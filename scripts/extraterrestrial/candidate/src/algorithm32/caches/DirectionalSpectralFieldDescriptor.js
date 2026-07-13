import { sha256Descriptor } from '../descriptors/descriptorSupport.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
} from '../quantities/spectral-packet-contract.js';

export const DIRECTIONAL_FIELD_SCHEMA_REVISION =
	'algorithm32-directional-spectral-field-schema-v1';

export const DIRECTIONAL_FIELD_QUANTITIES = /** @type {const} */ ({
	RADIANCE_DENSITY: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
	SCATTERING_DENSITY: SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
});

export const DIRECTIONAL_FIELD_UNITS = /** @type {const} */ ({
	RADIANCE_DENSITY: SPECTRAL_UNITS.RADIANCE_DENSITY,
	SCATTERING_DENSITY: SPECTRAL_UNITS.SCATTERING_DENSITY,
});

export const DIRECTION_DOMAIN_ROLES = /** @type {const} */ ({
	INCOMING_RADIANCE: 'incoming-radiance',
	OUTGOING_SCATTERING_DENSITY: 'outgoing-scattering-density',
});

/**
 * Emit a standalone order metadata record.
 *
 * @param {SpectralFieldOrderDefinition} order - Supplies typed order facts.
 * @returns {SpectralFieldOrder} The order metadata.
 */
function createOrderMetadata(order) {
	if (order.kind === 'pure') {
		return {
			kind: 'pure',
			value: order.value,
		};
	}

	return {
		kind: 'cumulative-through',
		value: order.value,
		included: order.included === undefined
			? Array.from({ length: order.value }, (_unused, index) => index + 1)
			: [...order.included],
	};
}

/**
 * Copy the stable identity used inside the field content hash.
 *
 * @param {CacheDescriptorIdentity} descriptor - Supplies descriptor identity.
 * @returns {CacheDescriptorIdentity} The copied identity metadata.
 */
function descriptorIdentity(descriptor) {
	return {
		id: descriptor.id,
		contentHash: descriptor.contentHash,
	};
}

/**
 * Emit directional spectral-field metadata from typed source-owned facts.
 *
 * This factory does not validate or compare its referenced descriptors. Those
 * records provide identity/reporting metadata only; concrete field owners keep
 * executable domain, storage, packing, and addressing facts separately.
 *
 * @param {DirectionalSpectralFieldDefinition} definition - Supplies the field
 * interpretation, domains, layout, order, and provenance.
 * @returns {DirectionalSpectralFieldDescriptor} The field metadata.
 */
export function createDirectionalSpectralFieldDescriptor(definition) {
	const order = createOrderMetadata(definition.order);
	const identityBody = /** @type {const} */ ({
		kind: 'directional-spectral-field',
		id: definition.id,
		schemaRevision: definition.schemaRevision === undefined
			? DIRECTIONAL_FIELD_SCHEMA_REVISION
			: definition.schemaRevision,
		quantity: definition.quantity,
		units: definition.units,
		directionRole: definition.directionRole,
		sampleSemantics: definition.basis.semantics,
		order,
		precision: definition.precision,
		provenanceIdentity: definition.provenanceIdentity,
		basis: descriptorIdentity(definition.basis),
		positionDomain: descriptorIdentity(definition.positionDomain),
		directionDomain: descriptorIdentity(definition.directionDomain),
		layout: descriptorIdentity(definition.layout),
	});

	return /** @type {DirectionalSpectralFieldDescriptor} */ ({
		kind: identityBody.kind,
		id: identityBody.id,
		schemaRevision: identityBody.schemaRevision,
		quantity: definition.quantity,
		units: definition.units,
		directionRole: definition.directionRole,
		sampleSemantics: identityBody.sampleSemantics,
		order,
		precision: definition.precision,
		provenanceIdentity: definition.provenanceIdentity,
		basis: definition.basis,
		positionDomain: definition.positionDomain,
		directionDomain: definition.directionDomain,
		layout: definition.layout,
		contentHash: sha256Descriptor(identityBody),
	});
}

/**
 * Derive the scattering order produced from a typed pure-radiance input.
 *
 * @param {DirectionalSpectralFieldDescriptor} value - Supplies the preceding
 * pure-radiance descriptor under the recurrence contract.
 * @returns {number} The next scattering order.
 */
export function nextScatteringOrder(value) {
	return value.order.value + 1;
}
