import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
	CANONICAL_SPECTRAL_CHANNELS,
	RUNTIME_NUMERICAL_CONTROLS,
} from '../constants/Algorithm32CanonicalData.js';
import { DEFAULT_CACHE_CONSTRUCTION_CONTROLS } from '../caches/CacheConstructionControlsDescriptor.js';
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN,
	FIBONACCI_34_DIRECTION_DOMAIN,
	NATIVE_48_POSITION_DOMAIN,
} from '../domains/index.js';
import {
	immutableDescriptorData,
	positiveInteger,
	requiredString,
	sha256Descriptor,
} from '../descriptors/descriptorSupport.js';
import {
	assertSpectralPacket,
	createSpectralBasis,
	createSpectralPacket,
	SPECTRAL_BASIS_SCHEMA_REVISION,
	SPECTRAL_QUANTITIES,
	SPECTRAL_SAMPLE_SEMANTICS,
	SPECTRAL_UNITS,
} from '../quantities/index.js';
import { createUnitValue } from '../quantities/UnitValue.js';
import {
	DEFAULT_PROFILE_ID,
	DEFAULT_PROFILE_REVISION,
	DEFAULT_PROFILE_ROLE,
	NUMERICAL_PROFILE_SCHEMA_REVISION,
	PHYSICAL_PROFILE_SCHEMA_REVISION,
	PROFILE_SCHEMA_REVISION,
	SOURCE_PROVENANCE_IDENTITY,
} from './consts.js';

export { NATIVE_15_SPECTRAL_CHANNEL_COUNT } from './consts.js';

/**
 * Create a recursively immutable descriptor with a content identity.
 *
 * @template Descriptor
 * @param {Descriptor} definition - Supplies descriptor identity data.
 * @returns {Descriptor & { readonly contentHash: string }} Return the immutable content-hashed descriptor.
 */
function hashedDescriptor(definition) {
	const body = /** @type {Descriptor & Record<string, unknown>} */ (
		immutableDescriptorData(definition)
	);
	return /** @type {Descriptor & { readonly contentHash: string }} */ (immutableDescriptorData({
		...body,
		contentHash: sha256Descriptor(body),
	}));
}

/**
 * Create the content-hashed native physical profile with its precise literal
 * contract preserved through the generic descriptor copier.
 *
 * @param {NativePhysicalProfileDefinition} definition - Supplies physical facts.
 * @returns {NativePhysicalProfile} The content-hashed physical profile.
 */
function createNativePhysicalProfile(definition) {
	return hashedDescriptor(definition);
}

/**
 * Create a configured physical profile while retaining its typed albedo packet.
 *
 * @param {SpectralReflectancePacket} albedo - Supplies accepted ground albedo.
 * @returns {NativePhysicalProfile} The configured physical profile.
 */
function createNativePhysicalProfileWithGround(albedo) {
	const {
		contentHash: _defaultContentHash,
		...defaultDefinition
	} = DEFAULT_NATIVE_PHYSICAL_PROFILE;
	const body = /** @type {NativePhysicalProfileDefinition} */ (
		immutableDescriptorData(defaultDefinition)
	);
	const identity = {
		...body,
		ground: {
			albedoHash: albedo.contentHash,
		},
	};

	return ({
		...body,
		ground: { albedo },
		contentHash: sha256Descriptor(identity),
	});
}

/**
 * Create the content-hashed native numerical profile with its precise literal
 * contract preserved through the generic descriptor copier.
 *
 * @param {NativeNumericalProfileDefinition} definition - Supplies numerical facts.
 * @returns {NativeNumericalProfile} The content-hashed numerical profile.
 */
function createNativeNumericalProfile(definition) {
	return hashedDescriptor(definition);
}

/**
 * Retain another descriptor by exact identity without copying its values.
 *
 * @param {NativeProfileDescriptorReference} descriptor - Supplies the owned descriptor.
 * @returns {NativeProfileDescriptorReference} Return an immutable identity reference.
 */
function descriptorReference(descriptor) {
	const reference = {
		kind: requiredString(descriptor.kind, 'Referenced descriptor kind'),
		id: requiredString(descriptor.id, 'Referenced descriptor id'),
		schemaRevision: requiredString(
			descriptor.schemaRevision,
			'Referenced descriptor schema revision',
		),
		contentHash: requiredString(
			descriptor.contentHash,
			'Referenced descriptor content hash',
		),
		...(descriptor.generatorRevision == null ? {} : {
			generatorRevision: requiredString(
				descriptor.generatorRevision,
				'Referenced descriptor generator revision',
			),
		}),
	};

	return /** @type {NativeProfileDescriptorReference} */ (
		immutableDescriptorData(reference)
	);
}

/**
 * Copy the production-profile identity under its exact discriminant contract.
 *
 * @param {NativeProductionProfileIdentity} definition - Supplies profile identity facts.
 * @returns {NativeProductionProfileIdentity} The copied identity.
 */
function createNativeProductionProfileIdentity(definition) {
	return immutableDescriptorData(definition);
}

/**
 * Assert a source packet matches the native irradiance-density boundary.
 *
 * @param {unknown} packet - Supplies the candidate typed spectral packet.
 * @returns {void}
 */
function assertNativeSourcePacket(packet) {
	assertSpectralPacket(packet, {
		quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
		units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
		basis: NATIVE_15_SPECTRAL_BASIS,
		semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
	});
}

/**
 * Accept an optional native-basis ground albedo packet.
 *
 * @param {unknown} packet - Supplies the candidate typed reflectance packet.
 * @returns {SpectralReflectancePacket} The accepted albedo packet.
 */
function acceptNativeGroundAlbedo(packet) {
	const albedo = /** @type {SpectralReflectancePacket} */ (assertSpectralPacket(packet, {
		quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
		units: SPECTRAL_UNITS.DIMENSIONLESS,
		basis: NATIVE_15_SPECTRAL_BASIS,
		semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
	}));

	if (albedo.values.some((value) => value < 0 || value > 1)) {
		throw new RangeError('Native production profile albedo values must be in [0, 1].');
	}

	return albedo;
}

/**
 * Store the native 15-channel production wavelength basis.
 *
 * This is the Algorithm32 production basis. It is not the paper/comparison
 * profile, even when a comparison configuration happens to reuse its values.
 */
export const NATIVE_15_SPECTRAL_BASIS = createSpectralBasis({
	id: 'algorithm32-native-15-spectral-basis-v1',
	schemaRevision: SPECTRAL_BASIS_SCHEMA_REVISION,
	semantics: SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE,
	channels: CANONICAL_SPECTRAL_CHANNELS.map((channel) => ({
		id: channel.name,
		center: channel.wavelength,
		width: channel.wavelengthBinWidth,
	})),
});

/**
 * Store the native top-of-atmosphere source irradiance-density packet.
 *
 * The legacy canonical-data module is the local value source. The exported
 * value is a typed spectral packet; raw radiometric arrays are not exposed.
 */
export const NATIVE_SOURCE_IRRADIANCE_DENSITY = createSpectralPacket({
	quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
	units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
	basis: NATIVE_15_SPECTRAL_BASIS,
	semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
	values: CANONICAL_SPECTRAL_CHANNELS.map((channel) => channel.sourceIrradiance.value),
	provenanceIdentity: SOURCE_PROVENANCE_IDENTITY,
});

/** Store the default native physical atmosphere profile. */
export const DEFAULT_NATIVE_PHYSICAL_PROFILE = createNativePhysicalProfile({
	kind: 'algorithm32-native-physical-profile',
	id: 'algorithm32-native-physical-default-v1',
	schemaRevision: PHYSICAL_PROFILE_SCHEMA_REVISION,
	revision: 1,
	role: DEFAULT_PROFILE_ROLE,
	comparisonParity: false,
	geometry: {
		bottomRadius: { ...CANONICAL_ATMOSPHERE_CONSTANTS.bottomRadius },
		topRadius: { ...CANONICAL_ATMOSPHERE_CONSTANTS.topRadius },
	},
	atmosphere: {
		rayleigh: {
			scaleHeight: { ...CANONICAL_ATMOSPHERE_CONSTANTS.rayleighScaleHeight },
			coefficientScale: createUnitValue({
				value: CANONICAL_ATMOSPHERE_CONSTANTS.rayleighCoefficientScale,
				units: SPECTRAL_UNITS.INVERSE_LENGTH,
			}),
		},
		mie: {
			scaleHeight: { ...CANONICAL_ATMOSPHERE_CONSTANTS.mieScaleHeight },
			angstromAlpha: createUnitValue({
				value: CANONICAL_ATMOSPHERE_CONSTANTS.mieAngstromAlpha,
				units: '1',
			}),
			angstromBeta: createUnitValue({
				value: CANONICAL_ATMOSPHERE_CONSTANTS.mieAngstromBeta,
				units: '1',
			}),
			singleScatteringAlbedo: createUnitValue({
				value: CANONICAL_ATMOSPHERE_CONSTANTS.mieSingleScatteringAlbedo,
				units: '1',
			}),
			phaseAsymmetry: createUnitValue({
				value: CANONICAL_ATMOSPHERE_CONSTANTS.miePhaseFunctionG,
				units: '1',
			}),
		},
		ozone: {
			absorptionEnabled: CANONICAL_ATMOSPHERE_CONSTANTS.ozoneAbsorptionEnabled,
		},
	},
});

/**
 * Store the default native numerical-profile identity.
 *
 * Cache construction controls and readonly domains remain owned by their own
 * descriptors. This profile records their complete identities without
 * copying order, transport, node, direction, or layout values.
 */
export const DEFAULT_NATIVE_NUMERICAL_PROFILE = createNativeNumericalProfile({
	kind: 'algorithm32-native-numerical-profile',
	id: 'algorithm32-native-numerical-default-v1',
	schemaRevision: NUMERICAL_PROFILE_SCHEMA_REVISION,
	revision: 1,
	role: DEFAULT_PROFILE_ROLE,
	comparisonParity: false,
	sourcePathTransmittance: {
		intervalCount: RUNTIME_NUMERICAL_CONTROLS.sourceTransmittanceIntervalCount,
	},
	cacheConstruction: descriptorReference(DEFAULT_CACHE_CONSTRUCTION_CONTROLS),
	domains: {
		position: descriptorReference(NATIVE_48_POSITION_DOMAIN),
		incomingDirection: descriptorReference(FIBONACCI_34_DIRECTION_DOMAIN),
		outgoingDirection: descriptorReference(CUBED_SPHERE_W27_DIRECTION_DOMAIN),
	},
});

/**
 * Create one immutable native production profile.
 *
 * Supplying another compatible typed source packet creates a distinct content
 * identity. An explicitly supplied albedo is retained as a typed profile
 * packet; omission does not select a reflective-ground default. Neither
 * override turns this native profile into a comparison profile.
 *
 * @param {CreateNativeProductionProfileOptions} [options] - Supplies profile
 * identity and optional compatible native-basis source and ground-albedo packets.
 * @returns {NativeProductionProfile} Return the immutable production profile.
 */
export function createNativeProductionProfile(options = {}) {
	if (options === null || typeof options !== 'object' || Array.isArray(options)) {
		throw new TypeError('Native production profile options must be an object.');
	}

	const id = requiredString(
		options.id === undefined ? DEFAULT_PROFILE_ID : options.id,
		'Native production profile id',
	);
	const revision = positiveInteger(
		options.revision === undefined ? DEFAULT_PROFILE_REVISION : options.revision,
		'Native production profile revision',
	);
	const sourceIrradianceDensity = options.sourceIrradianceDensity
		=== undefined
		? NATIVE_SOURCE_IRRADIANCE_DENSITY
		: options.sourceIrradianceDensity;

	assertNativeSourcePacket(sourceIrradianceDensity);
	const albedo = options.albedo === undefined
		? undefined
		: acceptNativeGroundAlbedo(options.albedo);
	const physical = albedo === undefined
		? DEFAULT_NATIVE_PHYSICAL_PROFILE
		: createNativePhysicalProfileWithGround(albedo);

	const identity = createNativeProductionProfileIdentity({
		kind: 'algorithm32-native-production-profile',
		id,
		schemaRevision: PROFILE_SCHEMA_REVISION,
		revision,
		role: DEFAULT_PROFILE_ROLE,
		comparisonParity: false,
		spectralBasisHash: NATIVE_15_SPECTRAL_BASIS.contentHash,
		sourceIrradianceDensityHash: sourceIrradianceDensity.contentHash,
		physicalProfileHash: physical.contentHash,
		numericalProfileHash: DEFAULT_NATIVE_NUMERICAL_PROFILE.contentHash,
	});

	return ({
		kind: identity.kind,
		id: identity.id,
		schemaRevision: identity.schemaRevision,
		revision: identity.revision,
		role: identity.role,
		comparisonParity: identity.comparisonParity,
		spectral: ({
			basis: NATIVE_15_SPECTRAL_BASIS,
			sourceIrradianceDensity,
		}),
		physical,
		numerical: DEFAULT_NATIVE_NUMERICAL_PROFILE,
		contentHash: sha256Descriptor(identity),
	});
}

/** Store the selected default native production profile. */
export const DEFAULT_NATIVE_PRODUCTION_PROFILE = createNativeProductionProfile();
