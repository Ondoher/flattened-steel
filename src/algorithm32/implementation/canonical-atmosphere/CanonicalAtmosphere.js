import VectorMath from '../../math/VectorMath.js';
import DistanceMath from '../../math/DistanceMath.js';
import WavelengthMath from '../../math/WavelengthMath.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	SpectralBasis,
	SpectralPacket as SpectralPacketClass,
} from '../../spectral-values/index.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../profiles/native-15/native-15-profile.js';
import {ShaderContributions} from '../../shader-assembly/base/ShaderContributions.js';
import {ShaderSource} from '../../shader-assembly/base/ShaderSource.js';
import {CacheBuildModules} from '../../shader-assembly/cache-pass/CacheBuildModules.js';
import {CacheValues} from '../../gpu-cache-runtime/CacheValues.js';
import {
	ATMOSPHERE_CACHE_REQUIREMENTS_BY_PASS,
	ATMOSPHERE_CACHE_SYMBOLS_BY_PASS,
	ATMOSPHERE_FINITE_SEGMENT_TRANSMITTANCE_SYMBOL,
	CANONICAL_ATMOSPHERE_CONSTANTS,
} from './consts.js';

/**
 * Canonical atmosphere profile used by Algorithm32 transport.
 *
 * @implements {AtmosphereModel}
 * @implements {CacheBuildContributor}
 * @implements {DistantSunCelestialCacheModuleContributor}
 */
export class CanonicalAtmosphere {
	/**
	 * Called by CanonicalAtmosphere to evaluate an exponential density profile
	 * at one altitude and scale height.
	 *
	 * @param {number} altitudeMeters - Supplies altitude in meters.
	 * @param {number} scaleHeightMeters - Supplies scale height in meters.
	 * @returns {number} - The density scale.
	 */
	_exponentialDensity(altitudeMeters, scaleHeightMeters) {
		return Math.exp(-Math.max(0, altitudeMeters) / scaleHeightMeters);
	}

	/**
	 * Called by CanonicalAtmosphere to evaluate its Rayleigh phase function. [3]
	 *
	 * @param {number} phaseDirectionCosine - Supplies the direction cosine.
	 * @returns {number} - The Rayleigh phase value.
	 */
	_rayleighPhaseFunction(phaseDirectionCosine) {
		return (3 / (16 * Math.PI)) * (1 + phaseDirectionCosine * phaseDirectionCosine);
	}

	/**
	 * Called by CanonicalAtmosphere to evaluate its Cornette-Shanks-style Mie
	 * phase function. [3]
	 *
	 * @param {number} mieAsymmetryParameter - Supplies phase asymmetry.
	 * @param {number} phaseDirectionCosine - Supplies the direction cosine.
	 * @returns {number} - The Mie phase value.
	 */
	_miePhaseFunction(mieAsymmetryParameter, phaseDirectionCosine) {
		const phaseNormalizationFactor =
			(3 / (8 * Math.PI)) *
			((1 - mieAsymmetryParameter * mieAsymmetryParameter) / (2 + mieAsymmetryParameter * mieAsymmetryParameter));
		const denominator = Math.max(
			1 + mieAsymmetryParameter * mieAsymmetryParameter - 2 * mieAsymmetryParameter * phaseDirectionCosine,
			Number.EPSILON,
		);

		return (phaseNormalizationFactor * (1 + phaseDirectionCosine * phaseDirectionCosine)) / denominator ** 1.5;
	}

	/**
	 * Called by CanonicalAtmosphere to resolve one validated basis-channel
	 * wavelength in micrometers.
	 *
	 * @param {SpectralBasisChannel} channel - Supplies the channel.
	 * @returns {number} - The wavelength in micrometers.
	 */
	_wavelengthMicrometersForChannel(channel) {
		return WavelengthMath.toMicrometers(/** @type {Wavelength} */ (/** @type {unknown} */ (channel.center)));
	}

	/**
	 * Called by CanonicalAtmosphere to create one atmosphere-owned typed
	 * spectral result with its canonical provenance.
	 *
	 * @param {SpectralQuantity} quantity - The result quantity.
	 * @param {SpectralUnits} units - The result units.
	 * @param {readonly number[]} values - The trusted calculated values.
	 * @param {string} role - The atmosphere result role.
	 * @returns {SpectralPacket} - The typed spectral result.
	 */
	_createAtmospherePacket(quantity, units, values, role) {
		const basis = this._spectralBasis;

		return new SpectralPacketClass({
			basis,
			quantity,
			units,
			values,
			provenanceIdentity: `canonical-atmosphere:${basis.contentHash}:${role}`,
		});
	}

	/**
	 * Called by CanonicalAtmosphere to require a positive finite scalar.
	 *
	 * @param {unknown} value - Supplies the candidate value.
	 * @param {string} label - Supplies the error label.
	 * @returns {void} - No value.
	 * @throws {RangeError} - When the value is not positive and finite.
	 */
	_assertPositiveFinite(value, label) {
		if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
			throw new RangeError(`${label} must be positive and finite.`);
		}
	}

	/**
	 * Called by CanonicalAtmosphere to validate its accepted physical constants.
	 *
	 * @param {CanonicalAtmosphereConstants} constants - Supplies accepted
	 * atmosphere constants.
	 * @returns {void} - No value.
	 * @throws {TypeError} - When a scalar constant is not finite.
	 * @throws {RangeError} - When a scale height is not positive and finite.
	 */
	_assertConstants(constants) {
		const {rayleighScaleHeight, mieScaleHeight} = constants;
		DistanceMath.assertDistance(rayleighScaleHeight, 'rayleighScaleHeight');
		DistanceMath.assertDistance(mieScaleHeight, 'mieScaleHeight');

		for (const field of [
			'rayleighCoefficientScale',
			'mieAngstromAlpha',
			'mieAngstromBeta',
			'mieSingleScatteringAlbedo',
			'miePhaseFunctionG',
		]) {
			const value = constants[field];
			if (typeof value !== 'number' || !Number.isFinite(value)) {
				throw new TypeError(`CanonicalAtmosphere constants.${field} must be finite.`);
			}
		}

		this._assertPositiveFinite(
			DistanceMath.toMeters(/** @type {Distance} */ (rayleighScaleHeight)),
			'rayleighScaleHeight',
		);
		this._assertPositiveFinite(DistanceMath.toMeters(/** @type {Distance} */ (mieScaleHeight)), 'mieScaleHeight');
	}

	/**
	 * Called by construction to accept one exact sea-level coefficient packet.
	 *
	 * @param {unknown} value - Supplies the candidate packet.
	 * @param {SpectralQuantity} quantity - Supplies the required quantity.
	 * @param {string} label - Supplies the diagnostic label.
	 * @returns {SpectralPacket} - The accepted packet.
	 */
	_acceptSeaLevelCoefficientPacket(value, quantity, label) {
		const packet = SpectralPacketClass.assert(value, {
			basis: this._spectralBasis,
			quantity,
			units: SPECTRAL_UNITS.INVERSE_LENGTH,
		});
		if (packet.values.some((entry) => entry < 0)) {
			throw new RangeError(`${label} values must be nonnegative.`);
		}
		return packet;
	}

	/**
	 * Called by construction to create aligned coefficients from the retained analytic definition.
	 *
	 * @param {SpectralQuantity} quantity - Supplies the coefficient quantity.
	 * @param {(wavelength: Wavelength) => number} evaluate - Supplies the analytic evaluator.
	 * @param {string} role - Supplies the provenance role.
	 * @returns {SpectralPacket} - The aligned coefficient packet.
	 */
	_createAnalyticCoefficientPacket(quantity, evaluate, role) {
		return this._createAtmospherePacket(
			quantity,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			this._spectralBasis.channels.map((channel) =>
				evaluate(/** @type {Wavelength} */ (/** @type {unknown} */ (channel.center))),
			),
			role,
		);
	}

	/**
	 * Called by CanonicalAtmosphere to create its shared atmosphere-constant
	 * GLSL block.
	 *
	 * @param {CanonicalAtmosphereConstants} facts - Supplies atmosphere constants.
	 * @param {SpectralBasis} spectralBasis - Supplies configured wavelengths.
	 * @returns {string} - The GLSL source.
	 */
	_atmosphereConstantsBlock(facts, spectralBasis) {
		const rayleighScaleHeightMeters = DistanceMath.toMeters(facts.rayleighScaleHeight);
		const mieScaleHeightMeters = DistanceMath.toMeters(facts.mieScaleHeight);
		const wavelengthMicrometers = spectralBasis.channels.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param channel - The channel value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (channel) => this._wavelengthMicrometersForChannel(channel),
		);
		const spectralChannelCount = spectralBasis.channelCount;

		const analyticConstants = `const float ATMOSPHERE_RAYLEIGH_SCALE_HEIGHT_METERS = ${ShaderSource.formatFloat(rayleighScaleHeightMeters)};
const float ATMOSPHERE_MIE_SCALE_HEIGHT_METERS = ${ShaderSource.formatFloat(mieScaleHeightMeters)};
const float ATMOSPHERE_RAYLEIGH_COEFFICIENT_SCALE = ${ShaderSource.formatFloat(facts.rayleighCoefficientScale)};
const float ATMOSPHERE_MIE_ANGSTROM_ALPHA = ${ShaderSource.formatFloat(facts.mieAngstromAlpha)};
const float ATMOSPHERE_MIE_ANGSTROM_BETA = ${ShaderSource.formatFloat(facts.mieAngstromBeta)};
const float ATMOSPHERE_MIE_SINGLE_SCATTERING_ALBEDO = ${ShaderSource.formatFloat(facts.mieSingleScatteringAlbedo)};
const float ATMOSPHERE_MIE_PHASE_FUNCTION_G = ${ShaderSource.formatFloat(facts.miePhaseFunctionG)};
const float ATMOSPHERE_WAVELENGTH_MICROMETERS[${spectralChannelCount}] = float[${spectralChannelCount}](${ShaderSource.formatFloatArray(wavelengthMicrometers)});`;
		if (this._usesAnalyticSpectralCoefficients) {
			return analyticConstants;
		}
		return `${analyticConstants}
const float ATMOSPHERE_SEA_LEVEL_RAYLEIGH_SCATTERING[${spectralChannelCount}] = float[${spectralChannelCount}](${ShaderSource.formatFloatArray(this._seaLevelRayleighScattering.values)});
const float ATMOSPHERE_SEA_LEVEL_MIE_EXTINCTION[${spectralChannelCount}] = float[${spectralChannelCount}](${ShaderSource.formatFloatArray(this._seaLevelMieExtinction.values)});`;
	}

	/**
	 * Called by shader assembly to emit the selected analytic or aligned-coefficient medium sampler.
	 *
	 * @returns {string} - The GLSL source.
	 */
	_runtimeMediumBlock() {
		if (!this._usesAnalyticSpectralCoefficients) {
			return `MediumSample sampleAtmosphere(AtmosphereCoordinate coordinate) {
	float altitudeMeters = max(0.0, coordinate.altitudeMeters);
	float rayleighDensity = exp(-altitudeMeters / ATMOSPHERE_RAYLEIGH_SCALE_HEIGHT_METERS);
	float mieDensity = exp(-altitudeMeters / ATMOSPHERE_MIE_SCALE_HEIGHT_METERS);
	MediumSample medium;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		float rayleighScattering = ATMOSPHERE_SEA_LEVEL_RAYLEIGH_SCATTERING[channelIndex]
			* rayleighDensity;
		float mieExtinction = ATMOSPHERE_SEA_LEVEL_MIE_EXTINCTION[channelIndex]
			* mieDensity;
		float mieScattering = mieExtinction * ATMOSPHERE_MIE_SINGLE_SCATTERING_ALBEDO;
		medium.rayleighScattering.channels[channelIndex] = rayleighScattering;
		medium.mieScattering.channels[channelIndex] = mieScattering;
		medium.scattering.channels[channelIndex] = rayleighScattering + mieScattering;
		medium.extinction.channels[channelIndex] = rayleighScattering + mieExtinction;
	}
	return medium;
}`;
		}

		return `MediumSample sampleAtmosphere(AtmosphereCoordinate coordinate) {
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
		medium.rayleighScattering.channels[channelIndex] = rayleighScattering;
		medium.mieScattering.channels[channelIndex] = mieScattering;
		medium.scattering.channels[channelIndex] = rayleighScattering + mieScattering;
		medium.extinction.channels[channelIndex] = rayleighScattering + mieExtinction;
	}
	return medium;
}`;
	}

	/**
	 * Creates a canonical atmosphere from optional sourced constants.
	 *
	 * @param {CanonicalAtmosphereConfig} [configuration] - Optionally supplies
	 * atmosphere constants, spectral basis, and optional exact sea-level coefficients.
	 *
	 */
	constructor(configuration = {}) {
		const constants = configuration.constants ?? CANONICAL_ATMOSPHERE_CONSTANTS;

		this._assertConstants(constants);
		this._spectralBasis = SpectralBasis.assert(configuration.spectralBasis ?? NATIVE_15_SPECTRAL_BASIS);
		const rayleighScaleHeightMeters = DistanceMath.toMeters(constants.rayleighScaleHeight);
		const mieScaleHeightMeters = DistanceMath.toMeters(constants.mieScaleHeight);

		this._constants = {
			...constants,
			rayleighScaleHeight: DistanceMath.inMeters(rayleighScaleHeightMeters),
			mieScaleHeight: DistanceMath.inMeters(mieScaleHeightMeters),
		};
		this._usesAnalyticSpectralCoefficients =
			configuration.seaLevelRayleighScattering === undefined && configuration.seaLevelMieExtinction === undefined;
		this._seaLevelRayleighScattering =
			configuration.seaLevelRayleighScattering === undefined
				? this._createAnalyticCoefficientPacket(
						SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
						(wavelength) => this.rayleighScatteringCoefficientAt(wavelength),
						'sea-level-rayleigh-scattering',
					)
				: this._acceptSeaLevelCoefficientPacket(
						configuration.seaLevelRayleighScattering,
						SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
						'CanonicalAtmosphere seaLevelRayleighScattering',
					);
		this._seaLevelMieExtinction =
			configuration.seaLevelMieExtinction === undefined
				? this._createAnalyticCoefficientPacket(
						SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
						(wavelength) => this.mieExtinctionCoefficientAt(wavelength),
						'sea-level-mie-extinction',
					)
				: this._acceptSeaLevelCoefficientPacket(
						configuration.seaLevelMieExtinction,
						SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
						'CanonicalAtmosphere seaLevelMieExtinction',
					);
	}

	/**
	 * Value that returns the immutable atmosphere constants.
	 *
	 * @returns {CanonicalAtmosphereConstants} - The constants.
	 */
	get constants() {
		return this._constants;
	}

	/**
	 * Value that returns the validated spectral basis.
	 *
	 * @returns {SpectralBasis} - The spectral basis.
	 */
	get spectralBasis() {
		return this._spectralBasis;
	}

	/**
	 * Exact sea-level Rayleigh packet selected for this atmosphere instance.
	 *
	 * Offline production compilers use this immutable packet instead of
	 * reconstructing profile-specific coefficients from implementation details.
	 *
	 * @returns {SpectralPacket} - Basis-aligned coefficients.
	 */
	get seaLevelRayleighScattering() {
		return this._seaLevelRayleighScattering;
	}

	/**
	 * Exact sea-level Mie-extinction packet selected for this atmosphere instance.
	 *
	 * @returns {SpectralPacket} - Basis-aligned coefficients.
	 */
	get seaLevelMieExtinction() {
		return this._seaLevelMieExtinction;
	}

	/**
	 * Value that identifies this configured atmosphere model instance for compatibility.
	 *
	 * @returns {string} - The atmosphere id.
	 */
	get id() {
		return 'canonical-atmosphere';
	}

	/**
	 * Called by cache assembly to emit the selected analytic or aligned-coefficient medium functions.
	 *
	 * @param {boolean} [usesAltitudeScalar] - Whether the caller supplies stable altitude rather than model-space position.
	 * @returns {string} - The cache GLSL source.
	 */
	_cacheMediumBlock(usesAltitudeScalar = false) {
		const coordinateParameter = usesAltitudeScalar ? 'float altitudeMeters' : 'vec3 positionMeters';
		const altitudeExpression = usesAltitudeScalar ? 'altitudeMeters' : 'cacheAltitude(positionMeters)';
		const coefficientSource = this._usesAnalyticSpectralCoefficients
			? `float cacheWavelengthMicrometers(int wavelengthIndex) {
	return texelFetch(uCacheAtmosphereWavelengths, ivec2(wavelengthIndex, 0), 0).r / 1000.0;
}

float cacheRayleighScattering(${coordinateParameter}, int wavelengthIndex) {
	float density = exp(-${altitudeExpression} / uCacheRayleighScaleHeight);
	float wavelengthMicrometers = cacheWavelengthMicrometers(wavelengthIndex);
	return density * uCacheRayleighCoefficientScale
		* pow(wavelengthMicrometers, -4.0);
}

float cacheMieExtinction(${coordinateParameter}, int wavelengthIndex) {
	float density = exp(-${altitudeExpression} / uCacheMieScaleHeight);
	float wavelengthMicrometers = cacheWavelengthMicrometers(wavelengthIndex);
	return density * (uCacheMieAngstromBeta / uCacheMieScaleHeight)
		* pow(wavelengthMicrometers, -uCacheMieAngstromAlpha);
}`
			: `float cacheRayleighScattering(${coordinateParameter}, int wavelengthIndex) {
	float density = exp(-${altitudeExpression} / uCacheRayleighScaleHeight);
	return density * uCacheSeaLevelRayleighScattering[wavelengthIndex];
}

float cacheMieExtinction(${coordinateParameter}, int wavelengthIndex) {
	float density = exp(-${altitudeExpression} / uCacheMieScaleHeight);
	return density * uCacheSeaLevelMieExtinction[wavelengthIndex];
}`;

		return `${coefficientSource}

float cacheMieScattering(${coordinateParameter}, int wavelengthIndex) {
	return cacheMieExtinction(${usesAltitudeScalar ? 'altitudeMeters' : 'positionMeters'}, wavelengthIndex)
		* uCacheMieSingleScatteringAlbedo;
}

float cacheExtinction(${coordinateParameter}, int wavelengthIndex) {
	return cacheRayleighScattering(${usesAltitudeScalar ? 'altitudeMeters' : 'positionMeters'}, wavelengthIndex)
		+ cacheMieExtinction(${usesAltitudeScalar ? 'altitudeMeters' : 'positionMeters'}, wavelengthIndex);
}`;
	}

	/**
	 * Call this method to supply the canonical medium, phase, and source-transmittance program portions required by one cache construction pass.
	 *
	 * @param {CacheBuildContext} context - Supplies the resolved logical pass.
	 * @returns {CacheBuildModule} - Return the atmosphere-owned module.
	 */
	createCacheModule(context) {
		const reflectiveScatter = context.kind === 'scatter' && context.groundReflection !== undefined;
		const provides = reflectiveScatter
			? [
					...ATMOSPHERE_CACHE_SYMBOLS_BY_PASS[context.kind],
					'atmosphere.sourceTransmittance',
					ATMOSPHERE_FINITE_SEGMENT_TRANSMITTANCE_SYMBOL,
				]
			: ATMOSPHERE_CACHE_SYMBOLS_BY_PASS[context.kind];
		const requires = reflectiveScatter
			? [...ATMOSPHERE_CACHE_REQUIREMENTS_BY_PASS[context.kind], 'geometry.sourcePath']
			: ATMOSPHERE_CACHE_REQUIREMENTS_BY_PASS[context.kind];

		const wavelengthData = CacheValues.createData({
			id: 'algorithm32-canonical-atmosphere-wavelengths-v1',
			quantity: 'wavelength',
			units: 'nanometers',
			shape: [this._spectralBasis.channelCount],
			values: this._spectralBasis.channels.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param channel - The channel value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (channel) => WavelengthMath.toNanometers(channel.center),
			),
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
				[
					'rayleigh-coefficient-scale',
					'uCacheRayleighCoefficientScale',
					{
						value: this._constants.rayleighCoefficientScale,
						units: 'm^-1 micrometers^4',
					},
				],
				[
					'mie-angstrom-alpha',
					'uCacheMieAngstromAlpha',
					{
						value: this._constants.mieAngstromAlpha,
						units: '1',
					},
				],
				[
					'mie-angstrom-beta',
					'uCacheMieAngstromBeta',
					{
						value: this._constants.mieAngstromBeta,
						units: '1',
					},
				],
				[
					'mie-single-scattering-albedo',
					'uCacheMieSingleScatteringAlbedo',
					{
						value: this._constants.mieSingleScatteringAlbedo,
						units: '1',
					},
				],
				[
					'mie-phase-g',
					'uCacheMiePhaseG',
					{
						value: this._constants.miePhaseFunctionG,
						units: '1',
					},
				],
			]).map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param input1 - The destructured input accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ ([id, name, value]) =>
					/** @type {CacheBinding} */ ({
						spec: {
							id: `canonical-atmosphere-${id}`,
							name,
							kind: 'uniform',
							shaderType: 'float',
							frequency: 'build',
						},
						value,
					}),
			),
		];
		if (!this._usesAnalyticSpectralCoefficients) {
			bindings.push(
				{
					spec: {
						id: 'canonical-atmosphere-sea-level-rayleigh-scattering',
						name: 'uCacheSeaLevelRayleighScattering',
						kind: 'uniform',
						shaderType: `float[${this._spectralBasis.channelCount}]`,
						frequency: 'build',
					},
					value: this._seaLevelRayleighScattering,
				},
				{
					spec: {
						id: 'canonical-atmosphere-sea-level-mie-extinction',
						name: 'uCacheSeaLevelMieExtinction',
						kind: 'uniform',
						shaderType: `float[${this._spectralBasis.channelCount}]`,
						frequency: 'build',
					},
					value: this._seaLevelMieExtinction,
				},
			);
		}
		/** @type {CacheShaderBlock[]} */
		const blocks = [];

		if (
			context.kind === 'primary-j1' ||
			context.kind === 'direct-l1' ||
			context.kind === 'scatter' ||
			context.kind === 'transport'
		) {
			blocks.push({
				id: 'canonical-atmosphere-cache-medium',
				phase: 'function',
				order: 0,
				source: this._cacheMediumBlock(),
			});
		}

		if (context.kind === 'primary-j1' || context.kind === 'direct-l1' || context.kind === 'scatter') {
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
	float mieAsymmetryParameter = uCacheMiePhaseG;
	float phaseNormalizationFactor = (3.0 / (8.0 * CACHE_PI))
		* ((1.0 - mieAsymmetryParameter * mieAsymmetryParameter)
			/ (2.0 + mieAsymmetryParameter * mieAsymmetryParameter));
	float denominator = max(
		1.0 + mieAsymmetryParameter * mieAsymmetryParameter
			- 2.0 * mieAsymmetryParameter * cosine,
		2.220446049250313e-16
	);
	return (phaseNormalizationFactor * (1.0 + cosine * cosine)) / pow(denominator, 1.5);
}`,
			});
		}

		if (context.kind === 'primary-j1' || context.kind === 'direct-l1' || reflectiveScatter) {
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

		return CacheBuildModules.createBuildModule({
			id: `algorithm32-canonical-atmosphere-${context.kind}-module-v2`,
			owner: 'atmosphere',
			provides,
			requires,
			blocks,
			bindings,
		});
	}

	/**
	 * Create the canonical-atmosphere portion of one distant-Sun celestial GPU pass.
	 *
	 * @param {DistantSunCelestialCacheModuleContext} context - Exact celestial construction context.
	 * @returns {CacheBuildModule} - Atmosphere-owned direct-transmittance module.
	 */
	createDistantSunCelestialCacheModule(context) {
		const base = this.createCacheModule(
			/** @type {CacheBuildContext} */ ({
				kind: 'primary-j1',
				order: 1,
				inputs: [],
				output: context.output,
				options: {maximumScatteringOrder: 1, transportIntervalCount: 1},
				domains: /** @type {CacheConstructionDomains} */ ({}),
				pathIntervalCount: context.sourcePathIntervalCount,
			}),
		);
		return CacheBuildModules.createBuildModule({
			id: 'algorithm32-canonical-atmosphere-distant-sun-celestial-module-v1',
			owner: 'atmosphere',
			provides: ['atmosphere.celestialTransmittance'],
			requires: ['geometry.celestialSourcePath'],
			blocks: [
				{
					id: 'canonical-atmosphere-celestial-medium',
					phase: 'function',
					order: 0,
					source: this._cacheMediumBlock(true),
				},
				{
					id: 'canonical-atmosphere-celestial-source-transmittance',
					phase: 'function',
					order: 20,
					source: `float cacheCelestialAltitudeAlongPath(
	int directionIndex,
	int receiverIndex,
	float distanceMeters
) {
	float startAltitudeMeters = cacheCelestialStartAltitude(receiverIndex);
	float startRadiusMeters = uCelestialBottomRadius + startAltitudeMeters;
	float radialProjection = startRadiusMeters
		* cacheCelestialRadialCosine(directionIndex, receiverIndex);
	float squaredRadiusDelta = startAltitudeMeters
		* (2.0 * uCelestialBottomRadius + startAltitudeMeters)
		+ 2.0 * distanceMeters * radialProjection
		+ distanceMeters * distanceMeters;
	float radiusMeters = sqrt(max(
		uCelestialBottomRadius * uCelestialBottomRadius + squaredRadiusDelta,
		uCelestialBottomRadius * uCelestialBottomRadius
	));
	return max(
		squaredRadiusDelta / (radiusMeters + uCelestialBottomRadius),
		0.0
	);
}

float cacheCelestialPathTransmittance(
	int directionIndex,
	int receiverIndex,
	int wavelengthIndex
) {
	float endDistanceMeters = cacheCelestialSourcePathDistance(
		directionIndex,
		receiverIndex
	);
	float intervalLengthMeters = endDistanceMeters
		/ float(CACHE_SOURCE_PATH_INTERVAL_COUNT);
	float opticalDepth = 0.0;

	for (int pointIndex = 0;
		pointIndex <= CACHE_SOURCE_PATH_INTERVAL_COUNT;
		pointIndex += 1) {
		float distanceMeters = intervalLengthMeters * float(pointIndex);
		float altitudeMeters = cacheCelestialAltitudeAlongPath(
			directionIndex,
			receiverIndex,
			distanceMeters
		);
		float weight = pointIndex == 0
			|| pointIndex == CACHE_SOURCE_PATH_INTERVAL_COUNT
			? 0.5
			: 1.0;
		opticalDepth += cacheExtinction(altitudeMeters, wavelengthIndex)
			* intervalLengthMeters * weight;
	}

	return exp(-opticalDepth);
}`,
				},
			],
			bindings: base.bindings.filter((binding) => binding.spec.id !== 'canonical-atmosphere-mie-phase-g'),
		});
	}

	/**
	 * Call this method to return Rayleigh scattering coefficient for a wavelength.
	 *
	 * @param {Wavelength} wavelength - Supplies a unit-bearing wavelength.
	 * @returns {number} - The Rayleigh scattering coefficient.
	 */
	rayleighScatteringCoefficientAt(wavelength) {
		const wavelengthMicrometers = WavelengthMath.toMicrometers(wavelength);
		this._assertPositiveFinite(wavelengthMicrometers, 'wavelength');

		return this._constants.rayleighCoefficientScale * wavelengthMicrometers ** -4;
	}

	/**
	 * Call this method to return Mie extinction coefficient for a wavelength.
	 *
	 * @param {Wavelength} wavelength - Supplies a unit-bearing wavelength.
	 * @returns {number} - The Mie extinction coefficient.
	 */
	mieExtinctionCoefficientAt(wavelength) {
		const wavelengthMicrometers = WavelengthMath.toMicrometers(wavelength);
		this._assertPositiveFinite(wavelengthMicrometers, 'wavelength');
		const mieScaleHeightMeters = this._constants.mieScaleHeight.value;

		return (
			(this._constants.mieAngstromBeta / mieScaleHeightMeters) *
			wavelengthMicrometers ** -this._constants.mieAngstromAlpha
		);
	}

	/**
	 * Called by canonical atmosphere to return a readonly zero-valued spectrum for the configured basis.
	 *
	 * @returns {readonly number[]} - Return the zero-valued spectrum.
	 */
	_zero() {
		return Array.from(
			{length: this._spectralBasis.channelCount},
			/**
			 * Called by the surrounding operation to handle one callback invocation.
			 * @returns - The callback result returned to its caller.
			 */ () => 0,
		);
	}

	/**
	 * Called by canonical atmosphere to return mutable zero-valued working storage for the configured channels.
	 *
	 * @returns {number[]} - Return zero-valued working storage.
	 */
	_zeroMutable() {
		return Array.from(
			{length: this._spectralBasis.channelCount},
			/**
			 * Called by the surrounding operation to handle one callback invocation.
			 * @returns - The callback result returned to its caller.
			 */ () => 0,
		);
	}

	/**
	 * Called by canonical atmosphere to create the geometry-neutral runtime medium sampler from owner-configured atmosphere constants. Geometry resolves the physical coordinate before this contribution sees it.
	 *
	 * @returns {ShaderContribution} - Return the atmosphere contribution.
	 */
	_createShaderContribution() {
		return ShaderContributions.createShaderContribution({
			id: 'atmosphere-canonical',
			owner: 'atmosphere',
			provides: ['atmosphere.sampleMedium'],
			requires: ['geometry.atmosphereCoordinateTypes'],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'atmosphere-constants',
					'declareConstants',
					0,
					this._atmosphereConstantsBlock(this._constants, this._spectralBasis),
				),
				ShaderContributions.createShaderSourceBlock(
					'atmosphere-sample-medium',
					'sampleAtmosphere',
					0,
					this._runtimeMediumBlock(),
				),
			],
		});
	}

	/**
	 * Call this method to sample wavelength-aligned medium coefficients at a geometry-resolved atmosphere coordinate.
	 *
	 * @param {AtmosphereCoordinate} coordinate - Supplies the atmosphere
	 * coordinate.
	 * @returns {AtmosphereSample} - The sampled medium coefficients.
	 */
	sampleMedium(coordinate) {
		const altitudeMeters = DistanceMath.toMeters(coordinate.altitude);
		const rayleighScaleHeightMeters = this._constants.rayleighScaleHeight.value;
		const mieScaleHeightMeters = this._constants.mieScaleHeight.value;

		// Exponential density profiles are standard atmosphere profile terms
		// used with wavelength-dependent scattering coefficients. [2]
		const density = {
			rayleigh: this._exponentialDensity(altitudeMeters, rayleighScaleHeightMeters),
			mie: this._exponentialDensity(altitudeMeters, mieScaleHeightMeters),
			absorption: 0,
		};
		const rayleighScatteringValues = this._seaLevelRayleighScattering.values.map(
			(value) => density.rayleigh * value,
		);
		const mieExtinctionValues = this._seaLevelMieExtinction.values.map((value) => density.mie * value);
		const mieScatteringValues = mieExtinctionValues.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param value - The value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (value) => value * this._constants.mieSingleScatteringAlbedo,
		);
		const absorptionValues = this._zero();
		const extinctionValues = rayleighScatteringValues.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param value - The value accepted by the operation.
			 * @param index - The zero-based index accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (value, index) => value + mieExtinctionValues[index] + absorptionValues[index],
		);
		const scatteringValues = rayleighScatteringValues.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param value - The value accepted by the operation.
			 * @param index - The zero-based index accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (value, index) => value + mieScatteringValues[index],
		);
		const rayleighScattering = /** @type {SpectralScatteringCoefficientPacket} */ (
			this._createAtmospherePacket(
				SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				rayleighScatteringValues,
				'rayleigh-scattering',
			)
		);
		const mieExtinction = /** @type {SpectralExtinctionCoefficientPacket} */ (
			this._createAtmospherePacket(
				SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				mieExtinctionValues,
				'mie-extinction',
			)
		);
		const mieScattering = /** @type {SpectralScatteringCoefficientPacket} */ (
			this._createAtmospherePacket(
				SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				mieScatteringValues,
				'mie-scattering',
			)
		);
		const absorption = /** @type {SpectralAbsorptionCoefficientPacket} */ (
			this._createAtmospherePacket(
				SPECTRAL_QUANTITIES.ABSORPTION_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				absorptionValues,
				'absorption',
			)
		);
		const extinction = /** @type {SpectralExtinctionCoefficientPacket} */ (
			this._createAtmospherePacket(
				SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				extinctionValues,
				'total-extinction',
			)
		);
		const scattering = /** @type {SpectralScatteringCoefficientPacket} */ (
			this._createAtmospherePacket(
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
	 * Call this method to integrate optical depth and transmittance over a geometry-built atmosphere path. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {AtmospherePath} path - Supplies path samples.
	 * @returns {OpticalDepthSample} - The optical-depth sample.
	 */
	integrateOpticalDepth(path) {
		const zero = this._zero();

		if (path.blockedByGround) {
			const transmittance = /** @type {SpectralTransmittancePacket} */ (
				this._createAtmospherePacket(
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

		const {samples} = path;

		const opticalDepth = this._zeroMutable();

		for (const sample of samples) {
			const medium = this.sampleMedium(sample.atmosphereCoordinate);
			const measureMeters = DistanceMath.toMeters(sample.measure);

			for (let index = 0; index < opticalDepth.length; index += 1) {
				opticalDepth[index] += medium.extinction.values[index] * measureMeters;
			}
		}

		// Optical depth drives Beer-Lambert transmittance channel by channel. [1]
		const opticalDepthPacket = /** @type {SpectralOpticalDepthPacket} */ (
			this._createAtmospherePacket(
				SPECTRAL_QUANTITIES.OPTICAL_DEPTH,
				SPECTRAL_UNITS.DIMENSIONLESS,
				opticalDepth,
				'path-optical-depth',
			)
		);
		const transmittance = /** @type {SpectralTransmittancePacket} */ (
			this._createAtmospherePacket(
				SPECTRAL_QUANTITIES.TRANSMITTANCE,
				SPECTRAL_UNITS.DIMENSIONLESS,
				opticalDepth.map(
					/**
					 * Called by Array.prototype.map to transform one collection value.
					 * @param value - The value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (value) => Math.exp(-value),
				),
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
	 * Call this method to sample Rayleigh and Mie phase functions for a pair of directions.
	 *
	 * @param {object} [request] - Supplies view and incoming directions.
	 * @returns {PhaseSample} - The phase sample.
	 */
	samplePhase(request = {}) {
		const {viewDirection, incomingDirection} = request;

		const phaseDirectionCosine = Math.max(-1, Math.min(1, VectorMath.dot(viewDirection, incomingDirection)));
		const rayleighPhase = /** @type {InverseSolidAngle} */ ({
			value: this._rayleighPhaseFunction(phaseDirectionCosine),
			units: SPECTRAL_UNITS.INVERSE_SOLID_ANGLE,
		});
		const miePhase = /** @type {InverseSolidAngle} */ ({
			value: this._miePhaseFunction(this._constants.miePhaseFunctionG, phaseDirectionCosine),
			units: SPECTRAL_UNITS.INVERSE_SOLID_ANGLE,
		});

		return {
			rayleighPhase,
			miePhase,
		};
	}

	/**
	 * Call this method to create the geometry-neutral atmosphere-owned shader contribution.
	 *
	 * @returns {ShaderContribution} - The atmosphere shader contribution.
	 */
	createShaderContribution() {
		return this._createShaderContribution();
	}
}
