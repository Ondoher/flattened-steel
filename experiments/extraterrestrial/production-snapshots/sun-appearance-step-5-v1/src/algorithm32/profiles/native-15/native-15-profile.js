import {
	CANONICAL_SPECTRAL_CHANNELS,
	DEFAULT_PROFILE_ID,
	DEFAULT_PROFILE_REVISION,
	DEFAULT_PROFILE_ROLE,
	NUMERICAL_PROFILE_SCHEMA_REVISION,
	PHYSICAL_PROFILE_SCHEMA_REVISION,
	PROFILE_SCHEMA_REVISION,
	SOURCE_PROVENANCE_IDENTITY,
} from './consts.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../implementation/canonical-atmosphere/consts.js';
import {DEFAULT_CACHE_CONSTRUCTION_OPTIONS} from '../../light-source-support/cache/consts.js';
import {ValueValidation} from '../../validation/ValueValidation.js';
import {
	SpectralBasis,
	SpectralPacket as SpectralPacketClass,
	SPECTRAL_BASIS_SCHEMA_REVISION,
	SPECTRAL_QUANTITIES,
	SPECTRAL_SAMPLE_SEMANTICS,
	SPECTRAL_UNITS,
} from '../../spectral-values/index.js';
import {UnitMath} from '../../physical-quantities/UnitMath.js';
import {CanonicalValueHash} from '../../value-identity/CanonicalValueHash.js';
import {CelestialSourceRoster} from '../../celestial-source-support/CelestialSourceRoster.js';
export {NATIVE_15_SPECTRAL_CHANNEL_COUNT} from './consts.js';

/**
 * Called by profile construction to require the Native-15 irradiance-density boundary.
 *
 * @param {unknown} packet - The candidate typed spectral packet.
 * @returns {void} - No value.
 */
function assertNativeSourcePacket(packet) {
	SpectralPacketClass.assert(packet, {
		quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
		units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
		basis: NATIVE_15_SPECTRAL_BASIS,
		semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
	});
}

/**
 * Called by profile construction to accept a Native-15 ground-albedo packet.
 *
 * @param {unknown} packet - The candidate typed reflectance packet.
 * @returns {SpectralReflectancePacket} - The accepted albedo packet.
 * @throws {RangeError} - When an accepted value is outside the supported range.
 */
function acceptNativeGroundAlbedo(packet) {
	const albedo = /** @type {SpectralReflectancePacket} */ (
		SpectralPacketClass.assert(packet, {
			quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
			units: SPECTRAL_UNITS.DIMENSIONLESS,
			basis: NATIVE_15_SPECTRAL_BASIS,
			semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
		})
	);

	if (
		albedo.values.some(
			/**
			 * Called by Array.prototype.some to test one collection value for a matching condition.
			 * @param value - The value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (value) => value < 0 || value > 1,
		)
	) {
		throw new RangeError('Native production profile albedo values must be in [0, 1].');
	}

	return albedo;
}

/**
 * Native 15-channel production wavelength basis.
 *
 * This is the Algorithm32 production basis. It is not the paper/comparison
 * profile, even when a comparison configuration happens to reuse its values.
 *
 * @type {SpectralBasis}
 */
export const NATIVE_15_SPECTRAL_BASIS = new SpectralBasis({
	id: 'algorithm32-native-15-spectral-basis-v1',
	schemaRevision: SPECTRAL_BASIS_SCHEMA_REVISION,
	semantics: SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE,
	channels: CANONICAL_SPECTRAL_CHANNELS.map(
		/**
		 * Called by Array.prototype.map to transform one collection value.
		 * @param channel - The channel value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (channel) => ({
			id: channel.name,
			center: channel.wavelength,
			width: channel.wavelengthBinWidth,
		}),
	),
});

/**
 * Native top-of-atmosphere source irradiance-density packet.
 *
 * The legacy canonical-data module is the local value source. The exported
 * value is a typed spectral packet; raw radiometric arrays are not exposed.
 *
 * @type {SpectralIrradiancePacket}
 */
export const NATIVE_SOURCE_IRRADIANCE_DENSITY = /** @type {SpectralIrradiancePacket} */ (
	new SpectralPacketClass({
		quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
		units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
		basis: NATIVE_15_SPECTRAL_BASIS,
		semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
		values: CANONICAL_SPECTRAL_CHANNELS.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param channel - The channel value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (channel) => channel.sourceIrradiance.value,
		),
		provenanceIdentity: SOURCE_PROVENANCE_IDENTITY,
	})
);

/** Default native physical atmosphere profile without a reflective ground. @type {NativePhysicalProfile} */
export const DEFAULT_NATIVE_PHYSICAL_PROFILE = {
	kind: 'algorithm32-native-physical-profile',
	id: 'algorithm32-native-physical-default-v1',
	schemaRevision: PHYSICAL_PROFILE_SCHEMA_REVISION,
	revision: 1,
	role: DEFAULT_PROFILE_ROLE,
	comparisonParity: false,
	geometry: {
		bottomRadius: {...CANONICAL_ATMOSPHERE_CONSTANTS.bottomRadius},
		topRadius: {...CANONICAL_ATMOSPHERE_CONSTANTS.topRadius},
	},
	atmosphere: {
		rayleigh: {
			scaleHeight: {...CANONICAL_ATMOSPHERE_CONSTANTS.rayleighScaleHeight},
			coefficientScale: UnitMath.createUnitValue({
				value: CANONICAL_ATMOSPHERE_CONSTANTS.rayleighCoefficientScale,
				units: SPECTRAL_UNITS.INVERSE_LENGTH,
			}),
		},
		mie: {
			scaleHeight: {...CANONICAL_ATMOSPHERE_CONSTANTS.mieScaleHeight},
			angstromAlpha: UnitMath.createUnitValue({
				value: CANONICAL_ATMOSPHERE_CONSTANTS.mieAngstromAlpha,
				units: '1',
			}),
			angstromBeta: UnitMath.createUnitValue({
				value: CANONICAL_ATMOSPHERE_CONSTANTS.mieAngstromBeta,
				units: '1',
			}),
			singleScatteringAlbedo: UnitMath.createUnitValue({
				value: CANONICAL_ATMOSPHERE_CONSTANTS.mieSingleScatteringAlbedo,
				units: '1',
			}),
			phaseAsymmetry: UnitMath.createUnitValue({
				value: CANONICAL_ATMOSPHERE_CONSTANTS.miePhaseFunctionG,
				units: '1',
			}),
		},
		ozone: {
			absorptionEnabled: CANONICAL_ATMOSPHERE_CONSTANTS.ozoneAbsorptionEnabled,
		},
	},
};

/**
 * Default native numerical profile.
 *
 * Cache construction options remain direct numerical selections. Executable
 * domain owners are selected by the source and geometry that consume them.
 *
 * @type {NativeNumericalProfile}
 */
export const DEFAULT_NATIVE_NUMERICAL_PROFILE = {
	kind: 'algorithm32-native-numerical-profile',
	id: 'algorithm32-native-numerical-default-v1',
	schemaRevision: NUMERICAL_PROFILE_SCHEMA_REVISION,
	revision: 1,
	role: DEFAULT_PROFILE_ROLE,
	comparisonParity: false,
	viewPath: {
		intervalCount: 15,
		sampleDistribution: null,
	},
	sourcePathTransmittance: {
		intervalCount: 20,
	},
	cacheConstruction: {
		transportIntervalCount: DEFAULT_CACHE_CONSTRUCTION_OPTIONS.transportIntervalCount,
		maximumScatteringOrder: DEFAULT_CACHE_CONSTRUCTION_OPTIONS.maximumScatteringOrder,
	},
};

/**
 * Call this function to construct a readonly Native-15 production profile.
 *
 * Supplying another compatible typed source packet creates a distinct content
 * identity. An explicitly supplied albedo is retained as a typed profile
 * packet; omission does not select a reflective-ground default. Neither
 * override turns this native profile into a comparison profile. Numerical
 * overrides replace only their matching default selections.
 *
 * @param {NativeProductionProfileOverrides} [options] - The identity,
 * spectral, physical-boundary, and numerical overrides.
 * @returns {NativeProductionProfile} - The constructed production profile.
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 * @throws {RangeError} - When an accepted value is outside the supported range.
 */
export function createNativeProductionProfile(options = {}) {
	if (options === null || typeof options !== 'object' || Array.isArray(options)) {
		throw new TypeError('Native production profile options must be an object.');
	}

	const id = ValueValidation.requiredString(
		options.id === undefined ? DEFAULT_PROFILE_ID : options.id,
		'Native production profile id',
	);
	const revision = ValueValidation.positiveInteger(
		options.revision === undefined ? DEFAULT_PROFILE_REVISION : options.revision,
		'Native production profile revision',
	);
	const sourceIrradianceDensity =
		options.sourceIrradianceDensity === undefined
			? NATIVE_SOURCE_IRRADIANCE_DENSITY
			: options.sourceIrradianceDensity;

	assertNativeSourcePacket(sourceIrradianceDensity);
	const albedo = options.albedo === undefined ? undefined : acceptNativeGroundAlbedo(options.albedo);
	const pathIntervalCount = ValueValidation.positiveInteger(
		options.pathIntervalCount === undefined
			? DEFAULT_NATIVE_NUMERICAL_PROFILE.viewPath.intervalCount
			: options.pathIntervalCount,
		'Native production profile path interval count',
	);
	const sourceTransmittanceIntervalCount = ValueValidation.positiveInteger(
		options.sourceTransmittanceIntervalCount === undefined
			? DEFAULT_NATIVE_NUMERICAL_PROFILE.sourcePathTransmittance.intervalCount
			: options.sourceTransmittanceIntervalCount,
		'Native production profile source transmittance interval count',
	);
	const transportIntervalCount = ValueValidation.positiveInteger(
		options.transportIntervalCount === undefined
			? DEFAULT_NATIVE_NUMERICAL_PROFILE.cacheConstruction.transportIntervalCount
			: options.transportIntervalCount,
		'Native production profile cache transport interval count',
	);
	const maximumScatteringOrder =
		options.maximumScatteringOrder === undefined
			? DEFAULT_NATIVE_NUMERICAL_PROFILE.cacheConstruction.maximumScatteringOrder
			: options.maximumScatteringOrder;

	if (maximumScatteringOrder !== 1 && maximumScatteringOrder !== 2 && maximumScatteringOrder !== 4) {
		throw new RangeError('Native production profile maximum scattering order must be one of 1, 2, or 4.');
	}

	const physical =
		albedo === undefined
			? DEFAULT_NATIVE_PHYSICAL_PROFILE
			: /** @type {NativePhysicalProfile} */ ({
					...DEFAULT_NATIVE_PHYSICAL_PROFILE,
					ground: {albedo},
				});
	const numerical =
		options.pathIntervalCount === undefined &&
		options.sourceTransmittanceIntervalCount === undefined &&
		options.transportIntervalCount === undefined &&
		options.maximumScatteringOrder === undefined
			? DEFAULT_NATIVE_NUMERICAL_PROFILE
			: /** @type {NativeNumericalProfile} */ ({
					...DEFAULT_NATIVE_NUMERICAL_PROFILE,
					viewPath: {intervalCount: pathIntervalCount, sampleDistribution: null},
					sourcePathTransmittance: {intervalCount: sourceTransmittanceIntervalCount},
					cacheConstruction: {
						transportIntervalCount,
						maximumScatteringOrder,
					},
				});

	return {
		kind: 'algorithm32-native-production-profile',
		id,
		schemaRevision: PROFILE_SCHEMA_REVISION,
		revision,
		role: DEFAULT_PROFILE_ROLE,
		comparisonParity: false,
		spectral: {
			basis: NATIVE_15_SPECTRAL_BASIS,
			sourceIrradianceDensity,
		},
		physical,
		numerical,
	};
}

/** Default readonly Native-15 production profile. @type {NativeProductionProfile} */
export const DEFAULT_NATIVE_PRODUCTION_PROFILE = createNativeProductionProfile();

/**
 * Complete one per-model Native-15 execution profile from the legacy facade form.
 *
 * @param {NativeExecutionProfileDefinition} definition - Accepted components, observation, domains, and execution selections.
 * @returns {Algorithm32ExecutionProfile} - The complete generic execution profile.
 */
export function createNativeExecutionProfile(definition) {
	const numerical = {
		viewPath: {
			intervalCount:
				definition.execution.pathIntervalCount ?? DEFAULT_NATIVE_NUMERICAL_PROFILE.viewPath.intervalCount,
			sampleDistribution: definition.execution.pathSampleDistribution ?? null,
		},
		sourcePathTransmittance: {
			intervalCount:
				definition.execution.sourceTransmittanceIntervalCount ??
				DEFAULT_NATIVE_NUMERICAL_PROFILE.sourcePathTransmittance.intervalCount,
		},
		cacheConstruction: {
			transportIntervalCount: DEFAULT_NATIVE_NUMERICAL_PROFILE.cacheConstruction.transportIntervalCount,
			maximumScatteringOrder:
				definition.execution.maximumScatteringOrder ??
				DEFAULT_NATIVE_NUMERICAL_PROFILE.cacheConstruction.maximumScatteringOrder,
		},
	};
	const models = {
		lightSource: definition.lightSource,
		atmosphere: definition.atmosphere,
		geometry: definition.geometry,
		groundBoundary: definition.groundBoundary,
		sourcePlacement: {
			kind: /** @type {const} */ ('geometry-observation'),
			observation: definition.observation,
		},
		celestialSources: definition.celestialSources ?? null,
	};
	const identity = {
		template: DEFAULT_NATIVE_PRODUCTION_PROFILE.id,
		basis: NATIVE_15_SPECTRAL_BASIS.contentHash,
		source: NATIVE_SOURCE_IRRADIANCE_DENSITY.contentHash,
		models: {
			lightSource: definition.lightSource.id,
			atmosphere: definition.atmosphere.id,
			geometry: definition.geometry.id,
			groundBoundary: definition.groundBoundary?.id ?? null,
			...(models.celestialSources === null
				? {}
				: {
						celestialSources: CelestialSourceRoster.describeIdentity(
							models.celestialSources,
							NATIVE_15_SPECTRAL_BASIS,
						),
					}),
		},
		sourcePlacement: models.sourcePlacement,
		numerical,
		domains: {
			positions: definition.domains.positions.id,
			incomingDirections: definition.domains.incomingDirections.id,
			outgoingDirections: definition.domains.outgoingDirections.id,
		},
	};

	return {
		kind: 'algorithm32-execution-profile',
		id: DEFAULT_NATIVE_PRODUCTION_PROFILE.id,
		schemaRevision: 'algorithm32-execution-profile-v1',
		revision: DEFAULT_NATIVE_PRODUCTION_PROFILE.revision,
		contentHash: CanonicalValueHash.sha256Value(identity),
		provenanceIdentity: 'algorithm32-native-15-production-default-v1',
		spectral: DEFAULT_NATIVE_PRODUCTION_PROFILE.spectral,
		models,
		numerical,
		domains: definition.domains,
	};
}
