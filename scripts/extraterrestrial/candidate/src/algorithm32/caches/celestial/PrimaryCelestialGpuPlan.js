import { sha256Descriptor } from '../../descriptors/descriptorSupport.js';
import { createScalarArrayTextureLayout } from '../ScalarArrayTextureLayout.js';
import {
	createCacheOwnerIdentity,
	createCachePlanIdentity,
} from '../gpu/cacheBuildContracts.js';
import { PRIMARY_CELESTIAL_CACHE_VALUE_KEY } from '../gpu/cacheRuntimeContracts.js';

function identity(id, body) {
	return { id, contentHash: sha256Descriptor({ id, ...body }) };
}

/** Build one geometry-owned cache-render plan for the accepted distant Sun. */
export function createPrimaryCelestialGpuBuildPlan({ primaryCache, sourceId }) {
	const source = primaryCache?.sources?.get(sourceId);
	const payload = primaryCache?.payloads?.get(sourceId);
	const fragment = primaryCache?.fragments?.find((value) => value.sourceId === sourceId);
	if (!source || !payload || !fragment) throw new RangeError(`Unknown primary celestial source: ${sourceId}.`);
	if (fragment.kind !== 'uniform-disk') throw new RangeError('Only uniform-disk celestial cache fragments are supported.');
	const domain = primaryCache.geometry.describeCelestialContributionDomain();
	const channelCount = payload.channelCount;
	const layout = createScalarArrayTextureLayout({
		id: `primary-celestial-${sourceId}-r32f-layout-v1`,
		directionCount: domain.uNodes.length,
		positionCount: domain.altitudeNodesMeters.length,
		wavelengthCount: channelCount,
	});
	const directionDomain = identity(`primary-celestial-${sourceId}-direction-domain-v1`, { axes: ['u'], nodes: domain.uNodes });
	const positionDomain = identity(`primary-celestial-${sourceId}-position-domain-v1`, { axes: ['h'], nodes: domain.altitudeNodesMeters });
	const descriptor = {
		kind: 'primary-celestial-radiance-field',
		id: `primary-celestial-${sourceId}-r32f-field-v1`,
		quantity: fragment.sourceRadiance.quantity,
		units: fragment.sourceRadiance.units,
		precision: 'binary32',
		layout,
		positionDomain,
		directionDomain,
		contentHash: sha256Descriptor({ sourceId, fragment, layout: layout.contentHash, positionDomain: positionDomain.contentHash, directionDomain: directionDomain.contentHash }),
	};
	const field = {
		id: `primary-celestial-${sourceId}-r32f`,
		storage: { format: 'R32F', width: layout.shape.direction, height: layout.shape.position, layers: layout.shape.wavelength },
		descriptor,
	};
	const context = { domain, channelCount, output: field };
	const pass = {
		id: `primary-celestial-${sourceId}-direct-transport`,
		kind: 'celestial-direct',
		order: 1,
		inputs: [],
		output: field.id,
		modules: [
			primaryCache.geometry.createCelestialCacheBuildModule(context),
			primaryCache.atmosphere.createCelestialCacheBuildModule(context),
			source.createCacheBuildModule(context),
		],
	};
	const fields = [field];
	const passes = [pass];
	return {
		identity: createCachePlanIdentity(`primary-celestial-${sourceId}-cache-render-plan-v1`, fields, passes),
		descriptorDefinition: {
			id: `primary-celestial-${sourceId}-gpu-cache-v1`,
			field: descriptor,
			incomingDirectionDomain: directionDomain,
			controls: identity('primary-celestial-cache-render-controls-v1', { sourcePathIntervalCount: primaryCache.geometry._configuration?.sourceTransmittanceIntervalCount ?? null }),
			constructionIdentities: {
				source: createCacheOwnerIdentity('lightSource', `primary-celestial-${sourceId}-source-v1`, passes),
				atmosphere: createCacheOwnerIdentity('atmosphere', 'primary-celestial-atmosphere-v1', passes),
				geometry: createCacheOwnerIdentity('geometry', 'primary-celestial-spherical-geometry-v1', passes),
			},
		},
		fields,
		passes,
		result: field.id,
		runtimeValueKey: PRIMARY_CELESTIAL_CACHE_VALUE_KEY,
	};
}

export default createPrimaryCelestialGpuBuildPlan;
