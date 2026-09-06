import { sha256Descriptor } from '../descriptors/descriptorSupport.js';
import {
	SCATTERING_CACHE_SCHEMA_REVISION,
} from '../caches/ScatteringCacheDescriptor.js';

/** Copy one descriptor identity into the cache fingerprint body. */
function identity(value) {
	return {
		id: value.id,
		contentHash: value.contentHash,
	};
}

/**
 * Derive the complete reusable-build identity for one distant-Sun GPU plan.
 *
 * The plan's source construction identity already covers executable field
 * storage, every pass and module, and every owner-supplied binding value. The
 * remaining fingerprint facts identify the completed result contract, schema,
 * and backend capabilities that can affect its realization. Controller scope
 * supplies resource identity, so a process-local backend sequence is not part
 * of this deterministic content identity.
 *
 * @param {CacheBuildPlan} plan - Supplies the complete source-owned graph.
 * @param {CacheGpuCapabilities} capabilities - Supplies the accepted backend
 * construction capability.
 * @returns {string} Return the deterministic cache fingerprint.
 */
export function createDistantSunCacheFingerprint(plan, capabilities) {
	const descriptor = plan.descriptorDefinition;
	return sha256Descriptor({
		kind: 'algorithm32-distant-sun-gpu-cache-fingerprint',
		fingerprintSchemaRevision:
			'algorithm32-distant-sun-gpu-cache-fingerprint-v1',
		schemaRevision: descriptor.schemaRevision
			?? SCATTERING_CACHE_SCHEMA_REVISION,
		plan: identity(plan.identity),
		result: plan.result,
		field: identity(descriptor.field),
		incomingDirectionDomain: identity(descriptor.incomingDirectionDomain),
		controls: identity(descriptor.controls),
		constructionIdentities: {
			source: identity(descriptor.constructionIdentities.source),
			atmosphere: identity(descriptor.constructionIdentities.atmosphere),
			geometry: identity(descriptor.constructionIdentities.geometry),
			boundary: identity(descriptor.constructionIdentities.boundary),
		},
		backendCapabilities: capabilities,
	});
}

export default createDistantSunCacheFingerprint;
