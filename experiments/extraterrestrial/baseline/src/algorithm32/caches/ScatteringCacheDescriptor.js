import { sha256Descriptor } from '../descriptors/descriptorSupport.js';

export const SCATTERING_CACHE_SCHEMA_REVISION = 'algorithm32-scattering-cache-schema-v1';

const BLACK_GROUND_BOUNDARY_BODY = /** @type {const} */ ({
	kind: 'omitted-ground-boundary',
	id: 'algorithm32-black-ground-boundary-v1',
	schemaRevision: 'algorithm32-ground-boundary-omission-v1',
	behavior: 'zero-reflection',
});

/** Canonical cache identity used when no reflecting ground boundary is supplied. */
export const BLACK_GROUND_BOUNDARY_IDENTITY = {
	id: BLACK_GROUND_BOUNDARY_BODY.id,
	contentHash: sha256Descriptor(BLACK_GROUND_BOUNDARY_BODY),
};

/**
 * Copy one trusted descriptor identity into cache metadata.
 *
 * @param {CacheDescriptorIdentity} descriptor - Supplies the typed identity.
 * @returns {CacheDescriptorIdentity} The copied identity metadata.
 */
function descriptorIdentity(descriptor) {
	return {
		id: descriptor.id,
		contentHash: descriptor.contentHash,
	};
}

/**
 * Copy the source-owned construction identities into cache metadata.
 *
 * @param {ScatteringCacheConstructionIdentitiesDefinition} definition - Supplies
 * the typed source, atmosphere, geometry, and optional boundary identities.
 * @returns {ScatteringCacheDescriptor['constructionIdentities']} The copied metadata.
 */
function constructionIdentities(definition) {
	const boundary = definition.boundary ?? BLACK_GROUND_BOUNDARY_IDENTITY;

	return {
		source: descriptorIdentity(definition.source),
		atmosphere: descriptorIdentity(definition.atmosphere),
		geometry: descriptorIdentity(definition.geometry),
		boundary: descriptorIdentity(boundary),
	};
}

/**
 * Create source-owned cumulative scattering-cache metadata from one typed
 * definition. Executable owners establish the definition before this
 * constructor is called; this function only copies metadata and derives its
 * stable content identity.
 *
 * @param {ScatteringCacheDescriptorDefinition} definition - Supplies the
 * completed field, incoming domain, controls, and construction identities.
 * @returns {ScatteringCacheDescriptor} The created descriptor metadata.
 */
export function createScatteringCacheDescriptor(definition) {
	const schemaRevision = definition.schemaRevision
		?? SCATTERING_CACHE_SCHEMA_REVISION;
	const identities = constructionIdentities(definition.constructionIdentities);
	const identityBody = /** @type {const} */ ({
		kind: 'scattering-cache',
		id: definition.id,
		schemaRevision,
		field: descriptorIdentity(definition.field),
		incomingDirectionDomain: descriptorIdentity(definition.incomingDirectionDomain),
		controls: descriptorIdentity(definition.controls),
		constructionIdentities: identities,
	});

	return {
		kind: identityBody.kind,
		id: identityBody.id,
		schemaRevision: identityBody.schemaRevision,
		field: definition.field,
		incomingDirectionDomain: definition.incomingDirectionDomain,
		controls: definition.controls,
		constructionIdentities: identities,
		contentHash: sha256Descriptor(identityBody),
	};
}
