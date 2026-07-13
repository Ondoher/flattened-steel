import { sha256Descriptor } from '../../descriptors/descriptorSupport.js';
import { createScalarArrayTextureLayout } from '../ScalarArrayTextureLayout.js';
import { createCacheOwnerIdentity, createCachePlanIdentity } from '../gpu/cacheBuildContracts.js';

export const FLAT_FINITE_SUN_CACHE_VALUE_KEY = 'cache.flatFiniteSunRadiance';

/** Build the static source-relative radiance cache for the flat finite Sun. */
export function createFlatFiniteSunGpuBuildPlan({ primaryCache, sourceId }) {
	const source = primaryCache?.sources?.get(sourceId);
	const fragment = primaryCache?.fragments?.find((value) => value.sourceId === sourceId);
	if (!source || !fragment || fragment.kind !== 'finite-uniform-disk') {
		throw new RangeError(`Unknown flat finite Sun source: ${sourceId}.`);
	}
	const channelCount = fragment.channelCount;
	const layout = createScalarArrayTextureLayout({
		id: `flat-finite-sun-${sourceId}-r32f-layout-v1`, directionCount: 1, positionCount: 1, wavelengthCount: channelCount,
	});
	const descriptor = {
		kind: 'flat-finite-sun-surface-radiance-field',
		id: `flat-finite-sun-${sourceId}-r32f-field-v1`,
		quantity: fragment.sourceRadiance.quantity,
		units: fragment.sourceRadiance.units,
		precision: 'binary32',
		layout,
		contentHash: sha256Descriptor({ sourceId, fragment, layout: layout.contentHash }),
	};
	const sourceRelativeDomain = {
		id: `flat-finite-sun-${sourceId}-source-relative-domain-v1`,
		contentHash: sha256Descriptor({ kind: 'source-relative-single-texel', sourceId }),
	};
	const controls = {
		id: 'flat-finite-sun-cache-render-controls-v1',
		contentHash: sha256Descriptor({ cache: 'static-surface-radiance', liveTransportIntervals: 16 }),
	};
	const field = {
		id: `flat-finite-sun-${sourceId}-r32f`,
		storage: { format: 'R32F', width: 1, height: 1, layers: channelCount },
		descriptor,
	};
	const context = { kind: 'flat-finite-sun-radiance', channelCount, output: field };
	const pass = {
		id: `flat-finite-sun-${sourceId}-surface-radiance`, kind: 'flat-finite-sun-radiance', order: 1,
		inputs: [], output: field.id, modules: [source.createCacheBuildModule(context)],
	};
	return {
		identity: createCachePlanIdentity(`flat-finite-sun-${sourceId}-cache-render-plan-v1`, [field], [pass]),
		descriptorDefinition: {
			id: `flat-finite-sun-${sourceId}-gpu-cache-v1`, field,
			incomingDirectionDomain: sourceRelativeDomain,
			controls,
			constructionIdentities: {
				source: createCacheOwnerIdentity('lightSource', `flat-finite-sun-${sourceId}-source-v1`, [pass]),
				atmosphere: { id: 'flat-finite-sun-live-atmosphere-v1', contentHash: sha256Descriptor({ owner: 'atmosphere', mode: 'live-finite-segment' }) },
				geometry: { id: 'flat-finite-sun-source-relative-geometry-v1', contentHash: primaryCache.generationIdentity },
			},
		},
		fields: [field], passes: [pass], result: field.id,
		runtimeValueKey: FLAT_FINITE_SUN_CACHE_VALUE_KEY,
	};
}

export default createFlatFiniteSunGpuBuildPlan;
