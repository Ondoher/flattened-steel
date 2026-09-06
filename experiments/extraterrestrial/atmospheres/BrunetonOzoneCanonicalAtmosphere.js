import DistanceMath from '../../../src/algorithm32/math/DistanceMath.js';
import WavelengthMath from '../../../src/algorithm32/math/WavelengthMath.js';
import {CanonicalAtmosphere} from '../../../src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {ShaderSource} from '../../../src/algorithm32/shader-assembly/base/ShaderSource.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
} from '../../../src/algorithm32/spectral-values/index.js';
import {CanonicalValueHash} from '../../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {
	BRUNETON_OZONE_AUTHORITY,
	BRUNETON_OZONE_CROSS_SECTIONS_SQUARE_METERS,
	maximumOzoneNumberDensityPerCubicMeter,
	ozoneCrossSectionAtNanometers,
	ozoneDensityScaleAtAltitudeMeters,
} from '../ozone/BrunetonOzoneReference.js';

/** Exact retained Bruneton demo ozone composition and its content identity. */
export const BRUNETON_OZONE_COMPOSITION = Object.freeze({
	...BRUNETON_OZONE_AUTHORITY,
	crossSectionTableContentHash: CanonicalValueHash.sha256Value(
		BRUNETON_OZONE_CROSS_SECTIONS_SQUARE_METERS,
	),
	contentHash: CanonicalValueHash.sha256Value({
		authority: BRUNETON_OZONE_AUTHORITY,
		crossSectionsSquareMeters: BRUNETON_OZONE_CROSS_SECTIONS_SQUARE_METERS,
	}),
});

/** Peak ozone number density selected by the retained 300-DU profile. */
export const BRUNETON_OZONE_PEAK_NUMBER_DENSITY_PER_CUBIC_METER =
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
	requireCondition(firstIndex >= 0, `Unable to extend canonical atmosphere ${label}.`);
	requireCondition(
		source.indexOf(target, firstIndex + target.length) < 0,
		`Canonical atmosphere ${label} seam is ambiguous.`,
	);
	return `${source.slice(0, firstIndex)}${replacement}${source.slice(firstIndex + target.length)}`;
}

/**
 * Contained extension of the official Algorithm32 canonical atmosphere that
 * adds the retained Bruneton 300-DU ozone layer as absorption-only extinction.
 * When ozone is disabled, every inherited CPU and GLSL path is returned
 * unchanged.
 */
export class BrunetonOzoneCanonicalAtmosphere extends CanonicalAtmosphere {
	constructor(configuration = {}) {
		super(configuration);
		const enabled = configuration.constants?.ozoneAbsorptionEnabled === true;
		if (
			configuration.constants?.ozoneAbsorptionEnabled !== undefined &&
			typeof configuration.constants.ozoneAbsorptionEnabled !== 'boolean'
		) {
			throw new TypeError('ozoneAbsorptionEnabled must be boolean.');
		}
		if (
			enabled &&
			configuration.ozoneComposition !== undefined &&
			configuration.ozoneComposition !== BRUNETON_OZONE_COMPOSITION &&
			configuration.ozoneComposition?.contentHash !== BRUNETON_OZONE_COMPOSITION.contentHash
		) {
			throw new RangeError('Only the retained Bruneton 300-DU ozone composition is supported.');
		}

		this._ozoneAbsorptionEnabled = enabled;
		this._ozonePeakAbsorptionCoefficients = enabled
			? Object.freeze(
					this._spectralBasis.channels.map((channel) =>
						BRUNETON_OZONE_PEAK_NUMBER_DENSITY_PER_CUBIC_METER *
							ozoneCrossSectionAtNanometers(WavelengthMath.toNanometers(channel.center)),
					),
				)
			: Object.freeze([]);
		const identityBody = {
			enabled,
			composition: enabled ? BRUNETON_OZONE_COMPOSITION.contentHash : null,
			spectralBasis: this._spectralBasis.contentHash,
			peakAbsorptionCoefficients: enabled ? this._ozonePeakAbsorptionCoefficients : null,
		};
		this._ozoneConfigurationIdentity = CanonicalValueHash.sha256Value(identityBody);
		this._ozoneIdentity = Object.freeze({
			schemaId: 'algorithm32-contained-ozone-identity-v1',
			enabled,
			compositionId: enabled ? BRUNETON_OZONE_COMPOSITION.id : null,
			compositionContentHash: enabled ? BRUNETON_OZONE_COMPOSITION.contentHash : null,
			spectralBasisContentHash: this._spectralBasis.contentHash,
			alignedPeakAbsorptionContentHash: enabled
				? CanonicalValueHash.sha256Value(this._ozonePeakAbsorptionCoefficients)
				: null,
			configurationContentHash: this._ozoneConfigurationIdentity,
		});
	}

	get id() {
		return this._ozoneAbsorptionEnabled
			? `canonical-atmosphere-bruneton-ozone:${this._ozoneConfigurationIdentity}`
			: super.id;
	}

	get ozoneAbsorptionEnabled() {
		return this._ozoneAbsorptionEnabled;
	}

	get ozoneComposition() {
		return BRUNETON_OZONE_COMPOSITION;
	}

	get ozoneIdentity() {
		return this._ozoneIdentity;
	}

	get ozonePeakAbsorptionCoefficients() {
		return this._ozonePeakAbsorptionCoefficients;
	}

	ozoneDensityAtAltitude(altitude) {
		return ozoneDensityScaleAtAltitudeMeters(DistanceMath.toMeters(altitude));
	}

	ozoneCrossSectionAt(wavelength) {
		return ozoneCrossSectionAtNanometers(WavelengthMath.toNanometers(wavelength));
	}

	ozoneAbsorptionCoefficientAt(wavelength, altitude) {
		return (
			BRUNETON_OZONE_PEAK_NUMBER_DENSITY_PER_CUBIC_METER *
			this.ozoneCrossSectionAt(wavelength) *
			this.ozoneDensityAtAltitude(altitude)
		);
	}

	_atmosphereConstantsBlock(facts, spectralBasis) {
		const base = super._atmosphereConstantsBlock(facts, spectralBasis);
		if (!this._ozoneAbsorptionEnabled) return base;
		const profile = BRUNETON_OZONE_AUTHORITY.profileAltitudesMeters;
		return `${base}
const float ATMOSPHERE_OZONE_LOWER_ALTITUDE_METERS = ${ShaderSource.formatFloat(profile.bottom)};
const float ATMOSPHERE_OZONE_PEAK_ALTITUDE_METERS = ${ShaderSource.formatFloat(profile.peak)};
const float ATMOSPHERE_OZONE_UPPER_ALTITUDE_METERS = ${ShaderSource.formatFloat(profile.top)};
const float ATMOSPHERE_OZONE_PEAK_ABSORPTION[${spectralBasis.channelCount}] = float[${spectralBasis.channelCount}](${ShaderSource.formatFloatArray(this._ozonePeakAbsorptionCoefficients)});`;
	}

	_runtimeMediumBlock() {
		if (!this._ozoneAbsorptionEnabled) return super._runtimeMediumBlock();
		let source = super._runtimeMediumBlock();
		source = replaceOnce(
			source,
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
			'runtime density',
		);
		source = replaceOnce(
			source,
			'\t\tfloat mieScattering = mieExtinction * ATMOSPHERE_MIE_SINGLE_SCATTERING_ALBEDO;',
			`\t\tfloat mieScattering = mieExtinction * ATMOSPHERE_MIE_SINGLE_SCATTERING_ALBEDO;
\t\tfloat ozoneAbsorption = ATMOSPHERE_OZONE_PEAK_ABSORPTION[channelIndex]
\t\t\t* ozoneDensity;`,
			'runtime ozone absorption',
		);
		return replaceOnce(
			source,
			'\t\tmedium.extinction.channels[channelIndex] = rayleighScattering + mieExtinction;',
			`\t\tmedium.extinction.channels[channelIndex] = rayleighScattering + mieExtinction
\t\t\t+ ozoneAbsorption;`,
			'runtime total extinction',
		);
	}

	_cacheMediumBlock(usesAltitudeScalar = false) {
		if (!this._ozoneAbsorptionEnabled) return super._cacheMediumBlock(usesAltitudeScalar);
		const source = super._cacheMediumBlock(usesAltitudeScalar);
		const coordinateParameter = usesAltitudeScalar ? 'float altitudeMeters' : 'vec3 positionMeters';
		const coordinateArgument = usesAltitudeScalar ? 'altitudeMeters' : 'positionMeters';
		const altitudeExpression = usesAltitudeScalar ? 'altitudeMeters' : 'cacheAltitude(positionMeters)';
		const target = `float cacheExtinction(${coordinateParameter}, int wavelengthIndex) {
\treturn cacheRayleighScattering(${coordinateArgument}, wavelengthIndex)
\t\t+ cacheMieExtinction(${coordinateArgument}, wavelengthIndex);
}`;
		const profile = BRUNETON_OZONE_AUTHORITY.profileAltitudesMeters;
		const replacement = `float cacheOzoneDensity(float altitudeMeters) {
\tfloat risingDensity = clamp(
\t\t(altitudeMeters - ${ShaderSource.formatFloat(profile.bottom)})
\t\t\t/ ${ShaderSource.formatFloat(profile.peak - profile.bottom)},
\t\t0.0,
\t\t1.0
\t);
\tfloat fallingDensity = clamp(
\t\t(${ShaderSource.formatFloat(profile.top)} - altitudeMeters)
\t\t\t/ ${ShaderSource.formatFloat(profile.top - profile.peak)},
\t\t0.0,
\t\t1.0
\t);
\treturn min(risingDensity, fallingDensity);
}

float cacheOzoneAbsorption(${coordinateParameter}, int wavelengthIndex) {
\treturn cacheOzoneDensity(${altitudeExpression})
\t\t* CACHE_OZONE_PEAK_ABSORPTION[wavelengthIndex];
}

float cacheExtinction(${coordinateParameter}, int wavelengthIndex) {
\treturn cacheRayleighScattering(${coordinateArgument}, wavelengthIndex)
\t\t+ cacheMieExtinction(${coordinateArgument}, wavelengthIndex)
\t\t+ cacheOzoneAbsorption(${coordinateArgument}, wavelengthIndex);
}`;
		return `const float CACHE_OZONE_PEAK_ABSORPTION[${this._spectralBasis.channelCount}] = float[${this._spectralBasis.channelCount}](${ShaderSource.formatFloatArray(this._ozonePeakAbsorptionCoefficients)});

${replaceOnce(source, target, replacement, 'cache total extinction')}`;
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
			absorption: this._createAtmospherePacket(
				SPECTRAL_QUANTITIES.ABSORPTION_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				absorptionValues,
				'bruneton-ozone-absorption',
			),
			extinction: this._createAtmospherePacket(
				SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				extinctionValues,
				'total-extinction-bruneton-ozone',
			),
			density: {...base.density, absorption: ozoneDensity},
		};
	}
}

/** Construct the contained exact Bruneton ozone atmosphere extension. */
export function createBrunetonOzoneCanonicalAtmosphere(configuration) {
	return new BrunetonOzoneCanonicalAtmosphere(configuration);
}
