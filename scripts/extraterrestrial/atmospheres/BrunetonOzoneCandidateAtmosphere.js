import DistanceMath from '../candidate/src/algorithm32/utils/DistanceMath.js';
import WavelengthMath from '../candidate/src/algorithm32/utils/WavelengthMath.js';
import {CanonicalAtmosphere} from
	'../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import {createCacheBuildModule} from
	'../candidate/src/algorithm32/caches/gpu/cacheBuildContracts.js';
import {sha256Descriptor} from
	'../candidate/src/algorithm32/descriptors/descriptorSupport.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	createSpectralPacket,
} from '../candidate/src/algorithm32/quantities/index.js';
import {
	formatShaderFloat,
	formatShaderFloatArray,
} from '../candidate/src/algorithm32/shader/shaderContribution.js';
import {
	BRUNETON_OZONE_AUTHORITY,
	BRUNETON_OZONE_CROSS_SECTIONS_SQUARE_METERS,
	maximumOzoneNumberDensityPerCubicMeter,
	ozoneCrossSectionAtNanometers,
	ozoneDensityScaleAtAltitudeMeters,
} from '../ozone/BrunetonOzoneReference.js';

/** Exact retained Bruneton demo ozone composition and its candidate identity. */
export const BRUNETON_OZONE_CANDIDATE_COMPOSITION = Object.freeze({
	...BRUNETON_OZONE_AUTHORITY,
	crossSectionTableContentHash: sha256Descriptor(
		BRUNETON_OZONE_CROSS_SECTIONS_SQUARE_METERS,
	),
	contentHash: sha256Descriptor({
		authority: BRUNETON_OZONE_AUTHORITY,
		crossSectionsSquareMeters: BRUNETON_OZONE_CROSS_SECTIONS_SQUARE_METERS,
	}),
});

/** Peak number density selected by the retained Bruneton 300-DU profile. */
export const BRUNETON_OZONE_CANDIDATE_PEAK_NUMBER_DENSITY_PER_CUBIC_METER =
	maximumOzoneNumberDensityPerCubicMeter();

export {
	BRUNETON_OZONE_AUTHORITY,
	BRUNETON_OZONE_CROSS_SECTIONS_SQUARE_METERS,
	ozoneCrossSectionAtNanometers,
	ozoneDensityScaleAtAltitudeMeters,
};

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function replaceOnce(source, target, replacement, label) {
	const firstIndex = source.indexOf(target);
	requireCondition(firstIndex >= 0, `Unable to extend candidate atmosphere ${label}.`);
	requireCondition(
		source.indexOf(target, firstIndex + target.length) < 0,
		`Candidate atmosphere ${label} seam is ambiguous.`,
	);
	return `${source.slice(0, firstIndex)}${replacement}${source.slice(firstIndex + target.length)}`;
}

function createOzonePacket(basis, quantity, values, role, configurationIdentity) {
	return createSpectralPacket({
		basis,
		quantity,
		units: SPECTRAL_UNITS.INVERSE_LENGTH,
		values,
		provenanceIdentity:
			`candidate-bruneton-ozone:${configurationIdentity}:${role}`,
	});
}

function ozoneConstantsBlock(channelCount, peakAbsorptionCoefficients) {
	const profile = BRUNETON_OZONE_AUTHORITY.profileAltitudesMeters;
	return `const float ATMOSPHERE_OZONE_LOWER_ALTITUDE_METERS = ${formatShaderFloat(profile.bottom)};
const float ATMOSPHERE_OZONE_PEAK_ALTITUDE_METERS = ${formatShaderFloat(profile.peak)};
const float ATMOSPHERE_OZONE_UPPER_ALTITUDE_METERS = ${formatShaderFloat(profile.top)};
const float ATMOSPHERE_OZONE_PEAK_ABSORPTION[${channelCount}] = float[${channelCount}](${formatShaderFloatArray(peakAbsorptionCoefficients)});`;
}

function cacheOzoneFunctions(
	altitudeExpression,
	coordinateParameter,
	functionPrefix,
	peakAbsorptionConstant,
) {
	const profile = BRUNETON_OZONE_AUTHORITY.profileAltitudesMeters;
	return `float ${functionPrefix}OzoneDensity(float altitudeMeters) {
	float risingDensity = clamp(
		(altitudeMeters - ${formatShaderFloat(profile.bottom)})
			/ ${formatShaderFloat(profile.peak - profile.bottom)},
		0.0,
		1.0
	);
	float fallingDensity = clamp(
		(${formatShaderFloat(profile.top)} - altitudeMeters)
			/ ${formatShaderFloat(profile.top - profile.peak)},
		0.0,
		1.0
	);
	return min(risingDensity, fallingDensity);
}

float ${functionPrefix}OzoneAbsorption(${coordinateParameter}, int wavelengthIndex) {
	return ${functionPrefix}OzoneDensity(${altitudeExpression})
		* ${peakAbsorptionConstant}[wavelengthIndex];
}`;
}

/**
 * Candidate-API extension of CanonicalAtmosphere that adds Bruneton's 300-DU
 * ozone layer as absorption-only extinction. It deliberately does not alter
 * density sources, Rayleigh/Mie scattering, or either phase function.
 */
export class BrunetonOzoneCandidateAtmosphere extends CanonicalAtmosphere {
	constructor(configuration = {}) {
		super(configuration);
		const configuredFlag = configuration.constants?.ozoneAbsorptionEnabled;
		if (configuredFlag !== undefined && typeof configuredFlag !== 'boolean') {
			throw new TypeError('ozoneAbsorptionEnabled must be boolean.');
		}
		const enabled = configuredFlag === true;
		const configuredComposition = configuration.ozoneComposition;
		if (
			enabled
			&& configuredComposition !== undefined
			&& configuredComposition !== BRUNETON_OZONE_CANDIDATE_COMPOSITION
			&& configuredComposition?.contentHash
				!== BRUNETON_OZONE_CANDIDATE_COMPOSITION.contentHash
		) {
			throw new RangeError(
				'Only the retained Bruneton 300-DU ozone composition is supported.',
			);
		}

		this._ozoneAbsorptionEnabled = enabled;
		this._ozonePeakAbsorptionCoefficients = Object.freeze(enabled
			? this.spectralBasis.channels.map((channel) =>
				BRUNETON_OZONE_CANDIDATE_PEAK_NUMBER_DENSITY_PER_CUBIC_METER
					* ozoneCrossSectionAtNanometers(
						WavelengthMath.toNanometers(channel.center),
					))
			: []);
		this._ozoneConfigurationIdentity = sha256Descriptor({
			enabled,
			composition: enabled
				? BRUNETON_OZONE_CANDIDATE_COMPOSITION.contentHash
				: null,
			spectralBasis: this.spectralBasis.contentHash,
			peakAbsorptionCoefficients: enabled
				? this._ozonePeakAbsorptionCoefficients
				: null,
		});
		this._ozoneIdentity = Object.freeze({
			schemaId: 'algorithm32-contained-candidate-ozone-identity-v1',
			enabled,
			compositionId: enabled
				? BRUNETON_OZONE_CANDIDATE_COMPOSITION.id
				: null,
			compositionContentHash: enabled
				? BRUNETON_OZONE_CANDIDATE_COMPOSITION.contentHash
				: null,
			spectralBasisContentHash: this.spectralBasis.contentHash,
			alignedPeakAbsorptionContentHash: enabled
				? sha256Descriptor(this._ozonePeakAbsorptionCoefficients)
				: null,
			configurationContentHash: this._ozoneConfigurationIdentity,
		});
	}

	get id() {
		return this._ozoneAbsorptionEnabled
			? `canonical-atmosphere-bruneton-ozone-candidate:${this._ozoneConfigurationIdentity}`
			: super.id;
	}

	get ozoneAbsorptionEnabled() {
		return this._ozoneAbsorptionEnabled;
	}

	get ozoneComposition() {
		return BRUNETON_OZONE_CANDIDATE_COMPOSITION;
	}

	get ozoneIdentity() {
		return this._ozoneIdentity;
	}

	get ozonePeakAbsorptionCoefficients() {
		return this._ozonePeakAbsorptionCoefficients;
	}

	describe() {
		const base = super.describe();
		if (!this._ozoneAbsorptionEnabled) return base;
		return {
			...base,
			kind: 'canonical-atmosphere-bruneton-ozone-candidate',
			ozone: this._ozoneIdentity,
		};
	}

	ozoneDensityAtAltitude(altitude) {
		return ozoneDensityScaleAtAltitudeMeters(DistanceMath.toMeters(altitude));
	}

	ozoneCrossSectionAt(wavelength) {
		return ozoneCrossSectionAtNanometers(WavelengthMath.toNanometers(wavelength));
	}

	ozoneAbsorptionCoefficientAt(wavelength, altitude) {
		return (
			BRUNETON_OZONE_CANDIDATE_PEAK_NUMBER_DENSITY_PER_CUBIC_METER
			* this.ozoneCrossSectionAt(wavelength)
			* this.ozoneDensityAtAltitude(altitude)
		);
	}

	sampleMedium(coordinate) {
		const base = super.sampleMedium(coordinate);
		if (!this._ozoneAbsorptionEnabled) return base;
		const altitudeMeters = DistanceMath.toMeters(coordinate.altitude);
		const ozoneDensity = ozoneDensityScaleAtAltitudeMeters(altitudeMeters);
		const absorptionValues = this._ozonePeakAbsorptionCoefficients.map(
			(value) => value * ozoneDensity,
		);
		const extinctionValues = base.extinction.values.map(
			(value, index) => value + absorptionValues[index],
		);
		return {
			...base,
			absorption: createOzonePacket(
				this.spectralBasis,
				SPECTRAL_QUANTITIES.ABSORPTION_COEFFICIENT,
				absorptionValues,
				'absorption',
				this._ozoneConfigurationIdentity,
			),
			extinction: createOzonePacket(
				this.spectralBasis,
				SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
				extinctionValues,
				'total-extinction',
				this._ozoneConfigurationIdentity,
			),
		};
	}

	_createShaderContribution(descriptor) {
		const base = super._createShaderContribution(descriptor);
		if (!this._ozoneAbsorptionEnabled) return base;
		const constants = ozoneConstantsBlock(
			this.spectralBasis.channelCount,
			this._ozonePeakAbsorptionCoefficients,
		);
		const functions = base.functions.map((block) => {
			if (block.id === 'atmosphere-constants') {
				return {...block, code: `${block.code}\n${constants}`};
			}
			if (block.id !== 'atmosphere-sample-medium') return block;
			let code = replaceOnce(
				block.code,
				'\tfloat mieDensity = exp(-altitudeMeters / ATMOSPHERE_MIE_SCALE_HEIGHT_METERS);',
				`\tfloat mieDensity = exp(-altitudeMeters / ATMOSPHERE_MIE_SCALE_HEIGHT_METERS);
\tfloat ozoneRisingDensity = clamp(
\t\t(altitudeMeters - ATMOSPHERE_OZONE_LOWER_ALTITUDE_METERS)
\t\t\t/ (ATMOSPHERE_OZONE_PEAK_ALTITUDE_METERS - ATMOSPHERE_OZONE_LOWER_ALTITUDE_METERS),
\t\t0.0,
\t\t1.0
\t);
\tfloat ozoneFallingDensity = clamp(
\t\t(ATMOSPHERE_OZONE_UPPER_ALTITUDE_METERS - altitudeMeters)
\t\t\t/ (ATMOSPHERE_OZONE_UPPER_ALTITUDE_METERS - ATMOSPHERE_OZONE_PEAK_ALTITUDE_METERS),
\t\t0.0,
\t\t1.0
\t);
\tfloat ozoneDensity = min(ozoneRisingDensity, ozoneFallingDensity);`,
				'runtime density evaluation',
			);
			code = replaceOnce(
				code,
				'\t\tfloat mieScattering = mieExtinction * ATMOSPHERE_MIE_SINGLE_SCATTERING_ALBEDO;',
				`\t\tfloat mieScattering = mieExtinction * ATMOSPHERE_MIE_SINGLE_SCATTERING_ALBEDO;
\t\tfloat ozoneAbsorption = ATMOSPHERE_OZONE_PEAK_ABSORPTION[channelIndex]
\t\t\t* ozoneDensity;`,
				'runtime absorption evaluation',
			);
			code = replaceOnce(
				code,
				'\t\tmedium.extinction.c[channelIndex] = rayleighScattering + mieExtinction;',
				`\t\tmedium.extinction.c[channelIndex] = rayleighScattering + mieExtinction
\t\t\t+ ozoneAbsorption;`,
				'runtime total extinction',
			);
			return {...block, code};
		});
		return {
			...base,
			id: 'atmosphere-canonical-bruneton-ozone-candidate',
			functions,
		};
	}

	createCacheModule(context) {
		const base = super.createCacheModule(context);
		if (!this._ozoneAbsorptionEnabled) return base;
		const mediumBlock = base.blocks.find(
			(block) => block.id === 'canonical-atmosphere-cache-medium',
		);
		if (!mediumBlock) return base;
		const peakAbsorptionConstant = 'CACHE_OZONE_PEAK_ABSORPTION';
		const target = `float cacheExtinction(vec3 positionMeters, int wavelengthIndex) {
\treturn cacheRayleighScattering(positionMeters, wavelengthIndex)
\t\t+ cacheMieExtinction(positionMeters, wavelengthIndex);
}`;
		const ozoneFunctions = cacheOzoneFunctions(
			'cacheAltitude(positionMeters)',
			'vec3 positionMeters',
			'cache',
			peakAbsorptionConstant,
		);
		const replacement = `${ozoneFunctions}

float cacheExtinction(vec3 positionMeters, int wavelengthIndex) {
\treturn cacheRayleighScattering(positionMeters, wavelengthIndex)
\t\t+ cacheMieExtinction(positionMeters, wavelengthIndex)
\t\t+ cacheOzoneAbsorption(positionMeters, wavelengthIndex);
}`;
		const constants = `const float ${peakAbsorptionConstant}[${this.spectralBasis.channelCount}] = float[${this.spectralBasis.channelCount}](${formatShaderFloatArray(this._ozonePeakAbsorptionCoefficients)});`;
		const blocks = base.blocks.map((block) => block === mediumBlock
			? {
				...block,
				source: `${constants}\n\n${replaceOnce(
					block.source,
					target,
					replacement,
					'cache total extinction',
				)}`,
			}
			: block);
		return createCacheBuildModule({
			id: `algorithm32-bruneton-ozone-candidate-${context.kind}-module-v1`,
			owner: base.owner,
			provides: base.provides,
			requires: base.requires,
			blocks,
			bindings: base.bindings,
		});
	}

	createCelestialCacheBuildModule({channelCount}) {
		const base = super.createCelestialCacheBuildModule({channelCount});
		if (!this._ozoneAbsorptionEnabled) return base;
		const block = base.blocks.find(
			(candidate) => candidate.id === 'canonical-atmosphere-celestial-transport-functions',
		);
		requireCondition(block, 'Candidate celestial atmosphere block is missing.');
		const peakAbsorptionConstant = 'CELESTIAL_CACHE_OZONE_PEAK_ABSORPTION';
		const target = `float celestialCacheExtinction(vec3 positionMeters, int wavelengthIndex) {
\tfloat wavelengthMicrometers = celestialCacheWavelengthMicrometers(wavelengthIndex);
\tfloat rayleighDensity = exp(-celestialCacheAltitude(positionMeters) / uCelestialRayleighScaleHeight);
\tfloat mieDensity = exp(-celestialCacheAltitude(positionMeters) / uCelestialMieScaleHeight);
\treturn rayleighDensity * uCelestialRayleighCoefficientScale * pow(wavelengthMicrometers, -4.0)
\t\t+ mieDensity * (uCelestialMieAngstromBeta / uCelestialMieScaleHeight)
\t\t\t* pow(wavelengthMicrometers, -uCelestialMieAngstromAlpha);
}`;
		const ozoneFunctions = cacheOzoneFunctions(
			'celestialCacheAltitude(positionMeters)',
			'vec3 positionMeters',
			'celestialCache',
			peakAbsorptionConstant,
		);
		const replacement = `${ozoneFunctions}

float celestialCacheExtinction(vec3 positionMeters, int wavelengthIndex) {
\tfloat wavelengthMicrometers = celestialCacheWavelengthMicrometers(wavelengthIndex);
\tfloat rayleighDensity = exp(-celestialCacheAltitude(positionMeters) / uCelestialRayleighScaleHeight);
\tfloat mieDensity = exp(-celestialCacheAltitude(positionMeters) / uCelestialMieScaleHeight);
\treturn rayleighDensity * uCelestialRayleighCoefficientScale * pow(wavelengthMicrometers, -4.0)
\t\t+ mieDensity * (uCelestialMieAngstromBeta / uCelestialMieScaleHeight)
\t\t\t* pow(wavelengthMicrometers, -uCelestialMieAngstromAlpha)
\t\t+ celestialCacheOzoneAbsorption(positionMeters, wavelengthIndex);
}`;
		const constants = `const float ${peakAbsorptionConstant}[${channelCount}] = float[${channelCount}](${formatShaderFloatArray(this._ozonePeakAbsorptionCoefficients)});`;
		const blocks = base.blocks.map((candidate) => candidate === block
			? {
				...candidate,
				source: `${constants}\n\n${replaceOnce(
					candidate.source,
					target,
					replacement,
					'celestial-cache total extinction',
				)}`,
			}
			: candidate);
		return createCacheBuildModule({
			id: 'algorithm32-bruneton-ozone-candidate-celestial-transport-module-v1',
			owner: base.owner,
			provides: base.provides,
			requires: base.requires,
			blocks,
			bindings: base.bindings,
		});
	}
}

/** Construct the contained candidate-compatible Bruneton ozone atmosphere. */
export function createBrunetonOzoneCandidateAtmosphere(configuration) {
	return new BrunetonOzoneCandidateAtmosphere(configuration);
}
