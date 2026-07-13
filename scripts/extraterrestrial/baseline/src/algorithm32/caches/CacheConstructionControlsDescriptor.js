import { sha256Descriptor } from '../descriptors/descriptorSupport.js';
import {
	DEFAULT_CACHE_TRANSPORT_INTERVAL_COUNT,
} from './consts.js';

export const CACHE_CONTROLS_SCHEMA_REVISION = 'algorithm32-cache-controls-schema-v1';

/** Store first-release cache maxima with explicit acceptance coverage. */
/** @type {readonly SupportedCacheScatteringOrder[]} */
export const SUPPORTED_CACHE_SCATTERING_ORDERS = [1, 2, 4];

/**
 * Emit cache-construction control metadata from typed source-owned values.
 * Public planners validate supported requested maxima before creating this
 * record; internal descriptor construction trusts that accepted contract.
 *
 * @param {CacheConstructionControlsDefinition} definition - Supplies selected
 * construction controls.
 * @returns {CacheConstructionControlsDescriptor} The controls metadata.
 */
export function createCacheConstructionControlsDescriptor(definition) {
	const body = /** @type {const} */ ({
		kind: 'cache-construction-controls',
		id: definition.id,
		schemaRevision: definition.schemaRevision === undefined
			? CACHE_CONTROLS_SCHEMA_REVISION
			: definition.schemaRevision,
		transportIntervalCount: definition.transportIntervalCount,
		maximumScatteringOrder: definition.maximumScatteringOrder,
	});

	return {
		...body,
		contentHash: sha256Descriptor(body),
	};
}

export const DEFAULT_CACHE_CONSTRUCTION_CONTROLS = createCacheConstructionControlsDescriptor({
	id: 'algorithm32-default-cache-construction-controls-v1',
	transportIntervalCount: DEFAULT_CACHE_TRANSPORT_INTERVAL_COUNT,
	maximumScatteringOrder: 4,
});
