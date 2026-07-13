import {CacheBuildModules} from '../../shader-assembly/cache-pass/CacheBuildModules.js';
import {
	INTEGRATED_CACHE_TRANSPORT_DIRECTION_TAP_COUNT,
	INTEGRATED_CACHE_TRANSPORT_POSITION_TAP_COUNT,
	INTEGRATED_CACHE_TRANSPORT_REQUIREMENTS,
} from './consts.js';

/**
 * GPU-integrated stored scattering-density transport operation.
 *
 * @implements {CacheBuildContributor}
 */
export class IntegratedCacheTransport {
	/**
	 * Called by module construction to emit the fixed integrated transport algorithm.
	 *
	 * @returns {string} - The transport fragment main body.
	 */
	_transportSource() {
		return `int outputDirectionIndex = int(gl_FragCoord.x);
int outputPositionIndex = int(gl_FragCoord.y);
int wavelengthIndex = a32CacheWavelengthLayer;
CacheTransportRay ray = cacheIntegratedTransportRay(
	outputPositionIndex,
	outputDirectionIndex
);
float intervalLengthMeters = ray.distanceMeters
	/ float(CACHE_TRANSPORT_INTERVAL_COUNT);
float transmittance = 1.0;
float previousExtinction = 0.0;
float radiance = 0.0;

for (int pointIndex = 0;
	pointIndex <= CACHE_TRANSPORT_INTERVAL_COUNT;
	++pointIndex) {
	vec3 samplePositionMeters = ray.originMeters
		+ ray.direction * intervalLengthMeters * float(pointIndex);
	if (pointIndex == CACHE_TRANSPORT_INTERVAL_COUNT && ray.endsOnGround) {
		samplePositionMeters.z = 0.0;
	}
	float extinction = cacheExtinction(
		samplePositionMeters,
		wavelengthIndex
	);
	if (pointIndex > 0) {
		transmittance *= exp(
			-0.5 * (previousExtinction + extinction) * intervalLengthMeters
		);
	}
	CachePositionStencil positionStencil =
		cacheConstructionPositionStencil(samplePositionMeters);
	CacheDirectionStencil directionStencil =
		cacheConstructionDirectionStencil(samplePositionMeters, ray.direction);
	float density = 0.0;
	for (int positionTapIndex = 0;
		positionTapIndex < CACHE_TRANSPORT_POSITION_TAP_COUNT;
		++positionTapIndex) {
		float positionWeight = positionStencil.weights[positionTapIndex];
		if (positionWeight == 0.0) continue;
		for (int directionTapIndex = 0;
			directionTapIndex < CACHE_TRANSPORT_DIRECTION_TAP_COUNT;
			++directionTapIndex) {
			float interpolationWeight = positionWeight
				* directionStencil.weights[directionTapIndex];
			if (interpolationWeight == 0.0) continue;
			density += cacheStoredScatteringDensity(
				directionStencil.indices[directionTapIndex],
				positionStencil.indices[positionTapIndex],
				wavelengthIndex
			) * interpolationWeight;
		}
	}
	float measureMeters = intervalLengthMeters
		* (pointIndex == 0 || pointIndex == CACHE_TRANSPORT_INTERVAL_COUNT
			? 0.5
			: 1.0);
	radiance += transmittance * density * measureMeters;
	previousExtinction = extinction;
}

a32CacheOutput = radiance;`;
	}

	/**
	 * Call this method to create the source-independent fused transport module.
	 *
	 * @param {CacheBuildContext} context - The resolved stored-field transport operation.
	 * @returns {CacheBuildModule} - The integrated transport module.
	 */
	createCacheModule(context) {
		return CacheBuildModules.createBuildModule({
			id: 'algorithm32-cache-integrated-transport-operation-v1',
			owner: 'transport',
			provides: ['cache.operation.transport'],
			requires: INTEGRATED_CACHE_TRANSPORT_REQUIREMENTS,
			blocks: [
				{
					id: 'algorithm32-cache-integrated-transport-main-v1',
					phase: 'main',
					order: 100,
					source: this._transportSource(),
				},
			],
			bindings: [
				{
					spec: {
						id: 'integrated-cache-transport-interval-count',
						name: 'CACHE_TRANSPORT_INTERVAL_COUNT',
						kind: 'define',
						shaderType: 'int',
						frequency: 'pass',
					},
					value: context.options.transportIntervalCount,
				},
				{
					spec: {
						id: 'integrated-cache-transport-position-tap-count',
						name: 'CACHE_TRANSPORT_POSITION_TAP_COUNT',
						kind: 'define',
						shaderType: 'int',
						frequency: 'build',
					},
					value: INTEGRATED_CACHE_TRANSPORT_POSITION_TAP_COUNT,
				},
				{
					spec: {
						id: 'integrated-cache-transport-direction-tap-count',
						name: 'CACHE_TRANSPORT_DIRECTION_TAP_COUNT',
						kind: 'define',
						shaderType: 'int',
						frequency: 'build',
					},
					value: INTEGRATED_CACHE_TRANSPORT_DIRECTION_TAP_COUNT,
				},
			],
		});
	}
}
