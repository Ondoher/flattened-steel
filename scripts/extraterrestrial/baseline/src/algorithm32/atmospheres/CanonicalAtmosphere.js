import VectorMath from '../utils/VectorMath.js';
import DistanceMath from '../utils/DistanceMath.js';
import WavelengthMath from '../utils/WavelengthMath.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	assertSpectralBasis,
	createSpectralPacket,
} from '../quantities/index.js';
import {
	createShaderContribution,
	createShaderSourceBlock,
	formatShaderFloat,
	formatShaderFloatArray,
} from '../shader/shaderContribution.js';
import {
	createCacheBuildModule,
	createCacheData,
} from '../caches/gpu/cacheBuildContracts.js';
import {
	ATMOSPHERE_CACHE_REQUIREMENTS_BY_PASS,
	ATMOSPHERE_CACHE_SYMBOLS_BY_PASS,
	ATMOSPHERE_FINITE_SEGMENT_TRANSMITTANCE_SYMBOL,
} from './consts.js';
/**
 * Exponential density profile for an altitude and scale height.
 *
 * @param {number} altitudeMeters - Supplies altitude in meters.
 * @param {number} scaleHeightMeters - Supplies scale height in meters.
 * @returns {number} The density scale.
 */
function exponentialDensity(altitudeMeters, scaleHeightMeters) {
	return Math.exp(-Math.max(0, altitudeMeters) / scaleHeightMeters);
}

/**
 * Rayleigh phase function. [3]
 *
 * @param {number} nu - Supplies the direction cosine.
 * @returns {number} The Rayleigh phase value.
 */
function rayleighPhaseFunction(nu) {
	return (3 / (16 * Math.PI)) * (1 + nu * nu);
}

/**
 * Cornette-Shanks-style Mie phase function used by the POC. [3]
 *
 * @param {number} g - Supplies phase asymmetry.
 * @param {number} nu - Supplies the direction cosine.
 * @returns {number} The Mie phase value.
 */
function miePhaseFunction(g, nu) {
	const k = (3 / (8 * Math.PI)) * ((1 - g * g) / (2 + g * g));
	const denominator = Math.max(1 + g * g - 2 * g * nu, Number.EPSILON);

	return (k * (1 + nu * nu)) / denominator ** 1.5;
}

/**
 * Resolve one validated basis channel wavelength in micrometers.
 *
 * @param {SpectralBasisChannel} channel - Supplies the channel.
 * @returns {number} Wavelength in micrometers.
 */
function wavelengthMicrometersForChannel(channel) {
	return WavelengthMath.toMicrometers(
		/** @type {Wavelength} */ (/** @type {unknown} */ (channel.center)),
	);
}

/**
 * Create one atmosphere-owned typed spectral result.
 *
 * @param {SpectralBasis} basis - Supplies the validated spectral basis.
 * @param {SpectralQuantity} quantity - Identifies the result quantity.
 * @param {SpectralUnits} units - Identifies the result units.
 * @param {readonly number[]} values - Supplies trusted calculated values.
 * @param {string} role - Identifies the atmosphere result role.
 * @returns {SpectralPacket} Return the typed spectral result.
 */
function createAtmospherePacket(basis, quantity, units, values, role) {
	return createSpectralPacket({
		basis,
		quantity,
		units,
		values,
		provenanceIdentity: `canonical-atmosphere:${basis.contentHash}:${role}`,
	});
}

/**
 * Assert a positive finite value.
 *
 * @param {unknown} value - Supplies the candidate value.
 * @param {string} label - Supplies the error label.
 * @returns {void}
 */
function assertPositiveFinite(value, label) {
	if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
		throw new RangeError(`${label} must be positive and finite.`);
	}
}

/**
 * Assert a finite three-component direction.
 *
 * @param {unknown} direction - Supplies the candidate direction.
 * @param {string} label - Supplies the error label.
 * @returns {void}
 */
function assertDirection(direction, label) {
	if (!Array.isArray(direction) || direction.length !== 3 || !direction.every(Number.isFinite)) {
		throw new TypeError(`samplePhase requires finite ${label}.`);
	}
}

/**
 * Assert atmosphere constants.
 *
 * @param {unknown} constants - Supplies candidate constants.
 * @returns {void}
 */
function assertConstants(constants) {
	if (!constants || typeof constants !== 'object') {
		throw new TypeError('CanonicalAtmosphere requires constants.');
	}

	const candidate = /** @type {Record<string, unknown>} */ (constants);
	const rayleighScaleHeight = candidate.rayleighScaleHeight;
	const mieScaleHeight = candidate.mieScaleHeight;
	DistanceMath.assertDistance(rayleighScaleHeight, 'rayleighScaleHeight');
	DistanceMath.assertDistance(mieScaleHeight, 'mieScaleHeight');

	for (const field of [
		'rayleighCoefficientScale',
		'mieAngstromAlpha',
		'mieAngstromBeta',
		'mieSingleScatteringAlbedo',
		'miePhaseFunctionG',
	]) {
		const value = candidate[field];
		if (typeof value !== 'number' || !Number.isFinite(value)) {
			throw new TypeError(`CanonicalAtmosphere constants.${field} must be finite.`);
		}
	}

	assertPositiveFinite(
		DistanceMath.toMeters(/** @type {Distance} */ (rayleighScaleHeight)),
		'rayleighScaleHeight',
	);
	assertPositiveFinite(
		DistanceMath.toMeters(/** @type {Distance} */ (mieScaleHeight)),
		'mieScaleHeight',
	);
}

/**
 * Create the shared atmosphere constant GLSL block.
 *
 * @param {CanonicalAtmosphereConstants} facts - Supplies atmosphere constants.
 * @param {SpectralBasis} spectralBasis - Supplies configured wavelengths.
 * @returns {string} Return GLSL source.
 */
function atmosphereConstantsBlock(facts, spectralBasis) {
	const rayleighScaleHeightMeters = DistanceMath.toMeters(facts.rayleighScaleHeight);
	const mieScaleHeightMeters = DistanceMath.toMeters(facts.mieScaleHeight);
	const wavelengthMicrometers = spectralBasis.channels.map(wavelengthMicrometersForChannel);
	const spectralChannelCount = spectralBasis.channelCount;

	return `const float ATMOSPHERE_RAYLEIGH_SCALE_HEIGHT_METERS = ${formatShaderFloat(rayleighScaleHeightMeters)};
const float ATMOSPHERE_MIE_SCALE_HEIGHT_METERS = ${formatShaderFloat(mieScaleHeightMeters)};
const float ATMOSPHERE_RAYLEIGH_COEFFICIENT_SCALE = ${formatShaderFloat(facts.rayleighCoefficientScale)};
const float ATMOSPHERE_MIE_ANGSTROM_ALPHA = ${formatShaderFloat(facts.mieAngstromAlpha)};
const float ATMOSPHERE_MIE_ANGSTROM_BETA = ${formatShaderFloat(facts.mieAngstromBeta)};
const float ATMOSPHERE_MIE_SINGLE_SCATTERING_ALBEDO = ${formatShaderFloat(facts.mieSingleScatteringAlbedo)};
const float ATMOSPHERE_MIE_PHASE_FUNCTION_G = ${formatShaderFloat(facts.miePhaseFunctionG)};
const float ATMOSPHERE_WAVELENGTH_MICROMETERS[${spectralChannelCount}] = float[${spectralChannelCount}](${formatShaderFloatArray(wavelengthMicrometers)});`;
}

/**
 * Own the canonical atmosphere profile used by Algorithm32 transport.
 */
export class CanonicalAtmosphere {
	/**
	 * Create a canonical atmosphere from sourced constants and a spectral
	 * basis.
	 *
	 * @param {CanonicalAtmosphereConfig} configuration - Supplies atmosphere
	 * constants and the wavelength basis.
	 */
	constructor(configuration) {
		if (!configuration || typeof configuration !== 'object') {
			throw new TypeError('CanonicalAtmosphere configuration is required.');
		}

		const { constants, spectralBasis } = configuration;

		assertConstants(constants);
		const acceptedSpectralBasis = assertSpectralBasis(
			spectralBasis,
			'CanonicalAtmosphere spectralBasis',
		);
		const rayleighScaleHeightMeters = DistanceMath.toMeters(constants.rayleighScaleHeight);
		const mieScaleHeightMeters = DistanceMath.toMeters(constants.mieScaleHeight);

		this._constants = {
			...constants,
			rayleighScaleHeight: DistanceMath.inMeters(rayleighScaleHeightMeters),
			mieScaleHeight: DistanceMath.inMeters(mieScaleHeightMeters),
		};
		this._spectralBasis = acceptedSpectralBasis;
	}

	/**
	 * Return the immutable atmosphere constants.
	 *
	 * @returns {CanonicalAtmosphereConstants} The constants.
	 */
	get constants() {
		return this._constants;
	}

	/**
	 * Return the validated spectral basis.
	 *
	 * @returns {SpectralBasis} The spectral basis.
	 */
	get spectralBasis() {
		return this._spectralBasis;
	}

	/**
	 * Identify this configured atmosphere model instance for compatibility.
	 *
	 * @returns {string} The atmosphere id.
	 */
	get id() {
		return 'canonical-atmosphere';
	}

	/**
	 * Return a serializable atmosphere descriptor.
	 *
	 * @returns {object} The atmosphere descriptor.
	 */
	describe() {
		return {
			kind: 'canonical-atmosphere',
			spectralChannelCount: this._spectralBasis.channelCount,
			spectralBasisHash: this._spectralBasis.contentHash,
			constants: this._constants,
		};
	}

	/**
	 * Supply the canonical medium, phase, and source-transmittance program
	 * portions required by one cache construction pass.
	 *
	 * @param {CacheBuildContext} context - Supplies the resolved logical pass.
	 * @returns {CacheBuildModule} Return the atmosphere-owned module.
	 */
	createCacheModule(context) {
		const reflectiveScatter = context.kind === 'scatter'
			&& context.groundReflection !== undefined;
		const provides = reflectiveScatter
			? [
				...ATMOSPHERE_CACHE_SYMBOLS_BY_PASS[context.kind],
				'atmosphere.sourceTransmittance',
				ATMOSPHERE_FINITE_SEGMENT_TRANSMITTANCE_SYMBOL,
			]
			: ATMOSPHERE_CACHE_SYMBOLS_BY_PASS[context.kind];
		const requires = reflectiveScatter
			? [
				...ATMOSPHERE_CACHE_REQUIREMENTS_BY_PASS[context.kind],
				'geometry.sourcePath',
			]
			: ATMOSPHERE_CACHE_REQUIREMENTS_BY_PASS[context.kind];

		const wavelengthData = createCacheData({
			id: 'algorithm32-canonical-atmosphere-wavelengths-v1',
			quantity: 'wavelength',
			units: 'nanometers',
			shape: [this._spectralBasis.channelCount],
			values: this._spectralBasis.channels.map((channel) =>
				WavelengthMath.toNanometers(channel.center)),
		});
		/** @type {CacheBinding[]} */
		const bindings = [
			{
				spec: {
					id: 'canonical-atmosphere-wavelengths',
					name: 'uCacheAtmosphereWavelengths',
					kind: 'data',
					shaderType: 'sampler2D',
					frequency: 'build',
				},
				value: wavelengthData,
			},
			.../** @type {Array<[string, string, CacheBindingValue]>} */ ([
				['rayleigh-scale-height', 'uCacheRayleighScaleHeight', this._constants.rayleighScaleHeight],
				['mie-scale-height', 'uCacheMieScaleHeight', this._constants.mieScaleHeight],
				['rayleigh-coefficient-scale', 'uCacheRayleighCoefficientScale', {
					value: this._constants.rayleighCoefficientScale,
					units: 'm^-1 micrometers^4',
				}],
				['mie-angstrom-alpha', 'uCacheMieAngstromAlpha', {
					value: this._constants.mieAngstromAlpha,
					units: '1',
				}],
				['mie-angstrom-beta', 'uCacheMieAngstromBeta', {
					value: this._constants.mieAngstromBeta,
					units: '1',
				}],
				['mie-single-scattering-albedo', 'uCacheMieSingleScatteringAlbedo', {
					value: this._constants.mieSingleScatteringAlbedo,
					units: '1',
				}],
				['mie-phase-g', 'uCacheMiePhaseG', {
					value: this._constants.miePhaseFunctionG,
					units: '1',
				}],
			]).map(([id, name, value]) => /** @type {CacheBinding} */ ({
				spec: {
					id: `canonical-atmosphere-${id}`,
					name,
					kind: 'uniform',
					shaderType: 'float',
					frequency: 'build',
				},
				value,
			})),
		];
		/** @type {CacheShaderBlock[]} */
		const blocks = [];

		if (context.kind === 'primary-j1'
			|| context.kind === 'direct-l1'
			|| context.kind === 'scatter') {
			blocks.push({
				id: 'canonical-atmosphere-cache-medium',
				phase: 'function',
				order: 0,
				source: `float cacheWavelengthMicrometers(int wavelengthIndex) {
	return texelFetch(uCacheAtmosphereWavelengths, ivec2(wavelengthIndex, 0), 0).r / 1000.0;
}

float cacheRayleighScattering(vec3 positionMeters, int wavelengthIndex) {
	float density = exp(-cacheAltitude(positionMeters) / uCacheRayleighScaleHeight);
	float wavelengthMicrometers = cacheWavelengthMicrometers(wavelengthIndex);
	return density * uCacheRayleighCoefficientScale
		* pow(wavelengthMicrometers, -4.0);
}

float cacheMieExtinction(vec3 positionMeters, int wavelengthIndex) {
	float density = exp(-cacheAltitude(positionMeters) / uCacheMieScaleHeight);
	float wavelengthMicrometers = cacheWavelengthMicrometers(wavelengthIndex);
	return density * (uCacheMieAngstromBeta / uCacheMieScaleHeight)
		* pow(wavelengthMicrometers, -uCacheMieAngstromAlpha);
}

float cacheMieScattering(vec3 positionMeters, int wavelengthIndex) {
	return cacheMieExtinction(positionMeters, wavelengthIndex)
		* uCacheMieSingleScatteringAlbedo;
}

float cacheExtinction(vec3 positionMeters, int wavelengthIndex) {
	return cacheRayleighScattering(positionMeters, wavelengthIndex)
		+ cacheMieExtinction(positionMeters, wavelengthIndex);
}`,
			});
		}

		if (context.kind === 'primary-j1'
			|| context.kind === 'direct-l1'
			|| context.kind === 'scatter') {
			blocks.push({
				id: 'canonical-atmosphere-cache-phase',
				phase: 'function',
				order: 10,
				source: `const float CACHE_PI = 3.1415926535897932384626433832795;

float cacheRayleighPhase(vec3 outgoingDirection, vec3 incomingDirection) {
	float cosine = clamp(dot(outgoingDirection, incomingDirection), -1.0, 1.0);
	return (3.0 / (16.0 * CACHE_PI)) * (1.0 + cosine * cosine);
}

float cacheMiePhase(vec3 outgoingDirection, vec3 incomingDirection) {
	float cosine = clamp(dot(outgoingDirection, incomingDirection), -1.0, 1.0);
	float g = uCacheMiePhaseG;
	float k = (3.0 / (8.0 * CACHE_PI))
		* ((1.0 - g * g) / (2.0 + g * g));
	float denominator = max(
		1.0 + g * g - 2.0 * g * cosine,
		2.220446049250313e-16
	);
	return (k * (1.0 + cosine * cosine)) / pow(denominator, 1.5);
}`,
			});
		}

		if (context.kind === 'primary-j1'
			|| context.kind === 'direct-l1'
			|| reflectiveScatter) {
			blocks.push({
				id: 'canonical-atmosphere-cache-source-transmittance',
				phase: 'function',
				order: 20,
				source: `float cachePathTransmittance(
	vec3 positionMeters,
	vec3 direction,
	int wavelengthIndex
) {
	if (cacheRayBlockedByGround(positionMeters, direction)) return 0.0;
	float endDistanceMeters =
		cacheSourcePathDistance(positionMeters, direction);
	float intervalLengthMeters = endDistanceMeters
		/ float(CACHE_SOURCE_PATH_INTERVAL_COUNT);
	float opticalDepth = 0.0;

	for (int pointIndex = 0;
		pointIndex <= CACHE_SOURCE_PATH_INTERVAL_COUNT;
		pointIndex += 1) {
		float distanceMeters = intervalLengthMeters * float(pointIndex);
		vec3 samplePosition = positionMeters + direction * distanceMeters;
		float weight = pointIndex == 0
			|| pointIndex == CACHE_SOURCE_PATH_INTERVAL_COUNT
			? 0.5
			: 1.0;
		opticalDepth += cacheExtinction(samplePosition, wavelengthIndex)
			* intervalLengthMeters * weight;
	}

	return exp(-opticalDepth);
}`,
			});
		}

		if (reflectiveScatter) {
			blocks.push({
				id: 'canonical-atmosphere-cache-finite-segment-transmittance',
				phase: 'function',
				order: 30,
				source: `float cacheFiniteSegmentTransmittance(
	vec3 startPositionMeters,
	vec3 direction,
	float distanceMeters,
	int wavelengthIndex
) {
	if (distanceMeters == 0.0) return 1.0;

	float intervalLengthMeters = distanceMeters
		/ float(CACHE_SOURCE_PATH_INTERVAL_COUNT);
	float opticalDepth = 0.0;

	for (int pointIndex = 0;
		pointIndex <= CACHE_SOURCE_PATH_INTERVAL_COUNT;
		pointIndex += 1) {
		float distanceAlongPathMeters =
			intervalLengthMeters * float(pointIndex);
		vec3 samplePosition =
			startPositionMeters + direction * distanceAlongPathMeters;
		float weight = pointIndex == 0
			|| pointIndex == CACHE_SOURCE_PATH_INTERVAL_COUNT
			? 0.5
			: 1.0;
		opticalDepth += cacheExtinction(samplePosition, wavelengthIndex)
			* intervalLengthMeters * weight;
	}

	return exp(-opticalDepth);
}`,
			});
		}

		return createCacheBuildModule({
			id: `algorithm32-canonical-atmosphere-${context.kind}-module-v1`,
			owner: 'atmosphere',
			provides,
			requires,
			blocks,
			bindings,
		});
	}

	/**
	 * Return Rayleigh scattering coefficient for a wavelength.
	 *
	 * @param {Wavelength} wavelength - Supplies a unit-bearing wavelength.
	 * @returns {number} The Rayleigh scattering coefficient.
	 */
	rayleighScatteringCoefficientAt(wavelength) {
		const wavelengthMicrometers = WavelengthMath.toMicrometers(wavelength);
		assertPositiveFinite(wavelengthMicrometers, 'wavelength');

		return this._constants.rayleighCoefficientScale * wavelengthMicrometers ** -4;
	}

	/**
	 * Return Mie extinction coefficient for a wavelength.
	 *
	 * @param {Wavelength} wavelength - Supplies a unit-bearing wavelength.
	 * @returns {number} The Mie extinction coefficient.
	 */
	mieExtinctionCoefficientAt(wavelength) {
		const wavelengthMicrometers = WavelengthMath.toMicrometers(wavelength);
		assertPositiveFinite(wavelengthMicrometers, 'wavelength');
		const mieScaleHeightMeters = this._constants.mieScaleHeight.value;

		return (
			(this._constants.mieAngstromBeta / mieScaleHeightMeters)
			* wavelengthMicrometers ** -this._constants.mieAngstromAlpha
		);
	}

	/**
	 * Return a readonly zero-valued spectrum for the configured basis.
	 *
	 * @returns {readonly number[]} Return the zero-valued spectrum.
	 */
	_zero() {
		return Array.from({ length: this._spectralBasis.channelCount }, () => 0);
	}

	/**
	 * Return mutable zero-valued working storage for the configured channels.
	 *
	 * @returns {number[]} Return zero-valued working storage.
	 */
	_zeroMutable() {
		return Array.from({ length: this._spectralBasis.channelCount }, () => 0);
	}

	/**
	 * Create the geometry-neutral runtime medium sampler from owner-configured
	 * atmosphere constants. Geometry resolves the physical coordinate before
	 * this contribution sees it.
	 *
	 * @param {Algorithm32ShaderDescriptor} descriptor - Supplies contribution identity.
	 * @returns {ShaderContribution} Return the atmosphere contribution.
	 */
	_createShaderContribution(descriptor) {
		return createShaderContribution({
			id: 'atmosphere-canonical',
			owner: 'atmosphere',
			descriptorFingerprint: descriptor.atmosphere.fingerprint,
			compatibilityTags: descriptor.atmosphere.compatibilityTags,
			provides: ['atmosphere.sampleMedium'],
			requires: ['geometry.atmosphereCoordinateTypes'],
			functions: [
				createShaderSourceBlock(
					'atmosphere-constants',
					'declareConstants',
					0,
					atmosphereConstantsBlock(this._constants, this._spectralBasis),
				),
				createShaderSourceBlock('atmosphere-sample-medium', 'sampleAtmosphere', 0, `MediumSample sampleAtmosphere(AtmosphereCoordinate coordinate) {
	float altitudeMeters = max(0.0, coordinate.altitudeMeters);
	float rayleighDensity = exp(-altitudeMeters / ATMOSPHERE_RAYLEIGH_SCALE_HEIGHT_METERS);
	float mieDensity = exp(-altitudeMeters / ATMOSPHERE_MIE_SCALE_HEIGHT_METERS);
	MediumSample medium;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		float wavelengthMicrometers = ATMOSPHERE_WAVELENGTH_MICROMETERS[channelIndex];
		float rayleighScattering = ATMOSPHERE_RAYLEIGH_COEFFICIENT_SCALE
			* pow(wavelengthMicrometers, -4.0)
			* rayleighDensity;
		float mieExtinction = (ATMOSPHERE_MIE_ANGSTROM_BETA / ATMOSPHERE_MIE_SCALE_HEIGHT_METERS)
			* pow(wavelengthMicrometers, -ATMOSPHERE_MIE_ANGSTROM_ALPHA)
			* mieDensity;
		float mieScattering = mieExtinction * ATMOSPHERE_MIE_SINGLE_SCATTERING_ALBEDO;
		medium.rayleighScattering.c[channelIndex] = rayleighScattering;
		medium.mieScattering.c[channelIndex] = mieScattering;
		medium.scattering.c[channelIndex] = rayleighScattering + mieScattering;
		medium.extinction.c[channelIndex] = rayleighScattering + mieExtinction;
	}
	return medium;
}`),
			],
		});
	}

	/**
	 * Sample wavelength-aligned medium coefficients at a geometry-resolved
	 * atmosphere coordinate.
	 *
	 * @param {AtmosphereCoordinate} coordinate - Supplies the atmosphere
	 * coordinate.
	 * @returns {AtmosphereSample} The sampled medium coefficients.
	 */
	sampleMedium(coordinate) {
		DistanceMath.assertDistance(coordinate?.altitude, 'AtmosphereCoordinate.altitude');
		const altitudeMeters = DistanceMath.toMeters(coordinate.altitude);
		const rayleighScaleHeightMeters = this._constants.rayleighScaleHeight.value;
		const mieScaleHeightMeters = this._constants.mieScaleHeight.value;

		// Exponential density profiles are standard atmosphere profile terms
		// used with wavelength-dependent scattering coefficients. [2]
		const density = {
			rayleigh: exponentialDensity(altitudeMeters, rayleighScaleHeightMeters),
			mie: exponentialDensity(altitudeMeters, mieScaleHeightMeters),
			absorption: 0,
		};
		const rayleighScatteringValues = this._spectralBasis.channels.map((channel) =>
			density.rayleigh * this.rayleighScatteringCoefficientAt(
				/** @type {Wavelength} */ (/** @type {unknown} */ (channel.center)),
			));
		const mieExtinctionValues = this._spectralBasis.channels.map((channel) =>
			density.mie * this.mieExtinctionCoefficientAt(
				/** @type {Wavelength} */ (/** @type {unknown} */ (channel.center)),
			));
		const mieScatteringValues = mieExtinctionValues.map((value) =>
			value * this._constants.mieSingleScatteringAlbedo);
		const absorptionValues = this._zero();
		const extinctionValues = rayleighScatteringValues.map((value, index) =>
			value + mieExtinctionValues[index] + absorptionValues[index]);
		const scatteringValues = rayleighScatteringValues.map((value, index) =>
			value + mieScatteringValues[index]);
		const rayleighScattering = /** @type {SpectralScatteringCoefficientPacket} */ (
			createAtmospherePacket(
				this._spectralBasis,
				SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				rayleighScatteringValues,
				'rayleigh-scattering',
			)
		);
		const mieExtinction = /** @type {SpectralExtinctionCoefficientPacket} */ (
			createAtmospherePacket(
				this._spectralBasis,
				SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				mieExtinctionValues,
				'mie-extinction',
			)
		);
		const mieScattering = /** @type {SpectralScatteringCoefficientPacket} */ (
			createAtmospherePacket(
				this._spectralBasis,
				SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				mieScatteringValues,
				'mie-scattering',
			)
		);
		const absorption = /** @type {SpectralAbsorptionCoefficientPacket} */ (
			createAtmospherePacket(
				this._spectralBasis,
				SPECTRAL_QUANTITIES.ABSORPTION_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				absorptionValues,
				'absorption',
			)
		);
		const extinction = /** @type {SpectralExtinctionCoefficientPacket} */ (
			createAtmospherePacket(
				this._spectralBasis,
				SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				extinctionValues,
				'total-extinction',
			)
		);
		const scattering = /** @type {SpectralScatteringCoefficientPacket} */ (
			createAtmospherePacket(
				this._spectralBasis,
				SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				scatteringValues,
				'total-scattering',
			)
		);

		return {
			extinction: extinction,
			scattering: scattering,
			rayleighScattering: rayleighScattering,
			mieScattering: mieScattering,
			mieExtinction: mieExtinction,
			absorption: absorption,
			density,
		};
	}

	/**
	 * Integrate optical depth and transmittance over a geometry-built
	 * atmosphere path.
	 *
	 * @param {AtmospherePath} path - Supplies path samples.
	 * @returns {OpticalDepthSample} The optical-depth sample.
	 */
	integrateOpticalDepth(path) {
		const zero = this._zero();

		if (path?.blockedByGround) {
			const transmittance = /** @type {SpectralTransmittancePacket} */ (
				createAtmospherePacket(
					this._spectralBasis,
					SPECTRAL_QUANTITIES.TRANSMITTANCE,
					SPECTRAL_UNITS.DIMENSIONLESS,
					zero,
					'ground-blocked-transmittance',
				)
			);

			return {
				blockedByGround: true,
				opticalDepth: null,
				transmittance,
			};
		}

		const samples = path?.samples;

		if (!Array.isArray(samples)) {
			throw new TypeError('AtmospherePath.samples are required for optical-depth integration.');
		}

		const opticalDepth = this._zeroMutable();

		for (const sample of samples) {
			const medium = this.sampleMedium(sample.atmosphereCoordinate);
			DistanceMath.assertDistance(sample.measure, 'AtmospherePath sample measure');
			const measureMeters = DistanceMath.toMeters(sample.measure);

			for (let index = 0; index < opticalDepth.length; index += 1) {
				opticalDepth[index] += medium.extinction.values[index] * measureMeters;
			}
		}

		// Optical depth drives Beer-Lambert transmittance channel by channel. [1]
		const opticalDepthPacket = /** @type {SpectralOpticalDepthPacket} */ (
			createAtmospherePacket(
				this._spectralBasis,
				SPECTRAL_QUANTITIES.OPTICAL_DEPTH,
				SPECTRAL_UNITS.DIMENSIONLESS,
				opticalDepth,
				'path-optical-depth',
			)
		);
		const transmittance = /** @type {SpectralTransmittancePacket} */ (
			createAtmospherePacket(
				this._spectralBasis,
				SPECTRAL_QUANTITIES.TRANSMITTANCE,
				SPECTRAL_UNITS.DIMENSIONLESS,
				opticalDepth.map((value) => Math.exp(-value)),
				'path-transmittance',
			)
		);

		return {
			blockedByGround: false,
			opticalDepth: opticalDepthPacket,
			transmittance,
		};
	}

	/**
	 * Sample Rayleigh and Mie phase functions for a pair of directions.
	 *
	 * @param {object} [request] - Supplies view and incoming directions.
	 * @returns {PhaseSample} The phase sample.
	 */
	samplePhase(request = {}) {
		const { viewDirection, incomingDirection } = request;

		assertDirection(viewDirection, 'viewDirection');
		assertDirection(incomingDirection, 'incomingDirection');

		const nu = Math.max(-1, Math.min(1, VectorMath.dot(viewDirection, incomingDirection)));
		const rayleighPhase = /** @type {InverseSolidAngle} */ ({
			value: rayleighPhaseFunction(nu),
			units: SPECTRAL_UNITS.INVERSE_SOLID_ANGLE,
		});
		const miePhase = /** @type {InverseSolidAngle} */ ({
			value: miePhaseFunction(this._constants.miePhaseFunctionG, nu),
			units: SPECTRAL_UNITS.INVERSE_SOLID_ANGLE,
		});

		return {
			rayleighPhase,
			miePhase,
		};
	}

	/**
	 * Create the geometry-neutral atmosphere-owned shader contribution.
	 *
	 * @param {ShaderContributionRequest} request - Supplies the active shader descriptor.
	 * @returns {ShaderContribution} The atmosphere shader contribution.
	 */
	createShaderContribution(request) {
		return this._createShaderContribution(request?.descriptor);
	}
}
