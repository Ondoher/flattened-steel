import {
	SCATTERING_CACHE_SCHEMA_REVISION,
} from '../caches/ScatteringCacheDescriptor.js';
import { sha256Descriptor } from '../descriptors/descriptorSupport.js';
import {
	LOCAL_SUN_CACHE_FINGERPRINT_SCHEMA_REVISION,
} from './local-sun-consts.js';

/**
 * Copy one descriptor identity into the cache fingerprint body.
 *
 * @param {{ readonly id: string, readonly contentHash: string }} value -
 * Supplies one accepted identity.
 * @returns {{ readonly id: string, readonly contentHash: string }} The stable
 * identity body.
 */
function identity(value) {
	return {
		id: value.id,
		contentHash: value.contentHash,
	};
}

/**
 * Derive the complete reusable-build identity for one local-Sun GPU plan.
 *
 * @param {CacheBuildPlan} plan - Supplies the source-owned graph.
 * @param {CacheGpuCapabilities} capabilities - Supplies backend capabilities.
 * @returns {string} The deterministic cache fingerprint.
 */
export function createLocalSunCacheFingerprint(plan, capabilities) {
	const descriptor = plan.descriptorDefinition;

	return sha256Descriptor({
		kind: 'algorithm32-local-sun-gpu-cache-fingerprint',
		fingerprintSchemaRevision:
			LOCAL_SUN_CACHE_FINGERPRINT_SCHEMA_REVISION,
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
