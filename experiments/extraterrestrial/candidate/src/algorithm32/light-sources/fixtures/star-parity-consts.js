import {
	createCacheConstructionControlsDescriptor,
} from '../../caches/CacheConstructionControlsDescriptor.js';

/** Store the executable comparison-only interval count from the sealed corpus. */
export const STAR_PARITY_DISTANT_SUN_TRANSPORT_INTERVAL_COUNT = 40;

/**
 * Preserve the frozen 40-interval controls used only to replay the sealed
 * Star parity corpus. Production runtime modules do not import this file.
 *
 * @type {Readonly<Record<
 *   SupportedCacheScatteringOrder,
 *   CacheConstructionControlsDescriptor
 * >>}
 */
export const STAR_PARITY_DISTANT_SUN_CACHE_CONSTRUCTION_CONTROLS =
	{
		1: createCacheConstructionControlsDescriptor({
			id: 'algorithm32-distant-sun-star-parity-n1-controls-v1',
			transportIntervalCount:
				STAR_PARITY_DISTANT_SUN_TRANSPORT_INTERVAL_COUNT,
			maximumScatteringOrder: 1,
		}),
		2: createCacheConstructionControlsDescriptor({
			id: 'algorithm32-distant-sun-star-parity-n2-controls-v1',
			transportIntervalCount:
				STAR_PARITY_DISTANT_SUN_TRANSPORT_INTERVAL_COUNT,
			maximumScatteringOrder: 2,
		}),
		4: createCacheConstructionControlsDescriptor({
			id: 'algorithm32-distant-sun-star-parity-n4-controls-v1',
			transportIntervalCount:
				STAR_PARITY_DISTANT_SUN_TRANSPORT_INTERVAL_COUNT,
			maximumScatteringOrder: 4,
		}),
	};
