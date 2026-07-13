import {CacheBuildModules} from '../../../shader-assembly/cache-pass/CacheBuildModules.js';
import {CacheValues} from '../../../gpu-cache-runtime/CacheValues.js';
import {
	LOCAL_SUN_CACHE_IRRADIANCE_SYMBOL,
	LOCAL_SUN_CACHE_REQUIREMENTS_BY_PASS,
	LOCAL_SUN_CACHE_SYMBOLS_BY_PASS,
	LOCAL_SUN_SHELL_BOUNDARY_COUNT,
	LOCAL_SUN_SHELL_COUNT,
	LOCAL_SUN_SHELL_SEARCH_ITERATION_COUNT,
} from './consts.js';

/** Object that supplies local point-Sun primary and dynamic source facts to GPU passes. */
export class LocalSunCacheSource {
	/**
	 * Source value.
	 *
	 *  @type {LocalSunCacheSourceDefinition['source']}
	 *
	 */
	_source;
	/**
	 * Shell fact cache value.
	 *
	 *  @type {LocalSunShellFactCache}
	 *
	 */
	_shellFactCache;
	/**
	 * Shell boundary data value.
	 *
	 *  @type {CacheData}
	 *
	 */
	_shellBoundaryData;

	/**
	 * Called by local sun cache source to create pass-scoped source bindings.
	 *
	 * @param {CacheBuildContext} context - Supplies one logical pass.
	 * @param {boolean} reflectiveScatter - Selects direct ground irradiance.
	 * @returns {CacheBinding[]} - The source bindings.
	 */
	_createBindings(context, reflectiveScatter) {
		/** @type {CacheBinding[]} */
		const bindings = [];
		const configuration = this._source.configuration;

		if (context.kind !== 'accumulate' && context.kind !== 'transport') {
			bindings.push(
				{
					spec: {
						id: 'local-sun-source-position',
						name: 'uCacheLocalSunPosition',
						kind: 'uniform',
						shaderType: 'vec3',
						frequency: 'build',
					},
					value: configuration.position,
				},
				{
					spec: {
						id: 'local-sun-source-reference-distance',
						name: 'uCacheLocalSunReferenceDistance',
						kind: 'uniform',
						shaderType: 'float',
						frequency: 'build',
					},
					value: configuration.referenceDistance,
				},
				{
					spec: {
						id: 'local-sun-source-radius',
						name: 'uCacheLocalSunRadius',
						kind: 'uniform',
						shaderType: 'float',
						frequency: 'build',
					},
					value: configuration.radius,
				},
				{
					spec: {
						id: 'local-sun-source-reference-scale',
						name: 'uCacheLocalSunReferenceScale',
						kind: 'uniform',
						shaderType: 'float',
						frequency: 'build',
					},
					value: configuration.referenceSpectralIncidentScale,
				},
				{
					spec: {
						id: 'local-sun-source-distance-falloff',
						name: 'uCacheLocalSunDistanceFalloff',
						kind: 'uniform',
						shaderType: 'bool',
						frequency: 'build',
					},
					value: configuration.distanceFalloff,
				},
				{
					spec: {
						id: 'local-sun-source-path-interval-count',
						name: 'CACHE_SOURCE_PATH_INTERVAL_COUNT',
						kind: 'define',
						shaderType: 'int',
						frequency: 'build',
					},
					value: configuration.sourceTransmittanceIntervalCount,
				},
			);
		}

		if (context.kind === 'primary-j1' || context.kind === 'direct-l1' || reflectiveScatter) {
			bindings.push({
				spec: {
					id: 'local-sun-source-irradiance',
					name: 'uCacheLocalSunReferenceIrradiance',
					kind: 'uniform',
					shaderType: `float[${configuration.sourceIrradiance.basis.channelCount}]`,
					frequency: 'build',
				},
				value: configuration.sourceIrradiance,
			});
		}

		if (context.kind === 'primary-j1') {
			bindings.push(
				{
					spec: {
						id: 'local-sun-shell-boundaries',
						name: 'uCacheLocalSunShellBoundaries',
						kind: 'data',
						shaderType: 'sampler2D',
						frequency: 'build',
					},
					value: this._shellBoundaryData,
				},
				{
					spec: {
						id: 'local-sun-shell-count',
						name: 'CACHE_LOCAL_SUN_SHELL_COUNT',
						kind: 'define',
						shaderType: 'int',
						frequency: 'build',
					},
					value: LOCAL_SUN_SHELL_COUNT,
				},
				{
					spec: {
						id: 'local-sun-shell-search-iteration-count',
						name: 'CACHE_LOCAL_SUN_SHELL_SEARCH_ITERATION_COUNT',
						kind: 'define',
						shaderType: 'int',
						frequency: 'build',
					},
					value: LOCAL_SUN_SHELL_SEARCH_ITERATION_COUNT,
				},
			);
		}

		return bindings;
	}

	/**
	 * Called by local sun cache source to create source shader functions for one pass.
	 *
	 * @param {CacheBuildContext} context - Supplies one logical pass.
	 * @param {boolean} reflectiveScatter - Selects irradiance for ground.
	 * @returns {CacheShaderBlock[]} - The source blocks.
	 */
	_createBlocks(context, reflectiveScatter) {
		/** @type {CacheShaderBlock[]} */
		const blocks = [];

		if (context.kind !== 'accumulate' && context.kind !== 'transport') {
			blocks.push({
				id: 'local-sun-cache-source-facts',
				phase: 'function',
				order: 0,
				source: `float cacheLocalSunDistance(vec3 positionMeters) {
	return length(uCacheLocalSunPosition - positionMeters);
}

vec3 cacheSourceDirection(vec3 positionMeters) {
	vec3 toSource = uCacheLocalSunPosition - positionMeters;
	float distanceMeters = length(toSource);
	return distanceMeters > 2.220446049250313e-16
		? toSource / distanceMeters
		: vec3(0.0, 0.0, 1.0);
}

float cacheLocalSunScaleAtDistance(float distanceMeters) {
	float safeDistanceMeters = max(
		max(uCacheLocalSunRadius, distanceMeters),
		2.220446049250313e-16
	);
	float falloffScale = uCacheLocalSunDistanceFalloff
		? pow(uCacheLocalSunReferenceDistance / safeDistanceMeters, 2.0)
		: 1.0;
	return uCacheLocalSunReferenceScale * falloffScale;
}

float cacheLocalSunScale(vec3 positionMeters) {
	return cacheLocalSunScaleAtDistance(
		cacheLocalSunDistance(positionMeters)
	);
}`,
			});
		}

		if (context.kind === 'direct-l1' || reflectiveScatter) {
			blocks.push({
				id: 'local-sun-cache-source-irradiance',
				phase: 'function',
				order: 5,
				source: `float cacheSourceIrradiance(
	vec3 positionMeters,
	int wavelengthIndex
) {
	return uCacheLocalSunReferenceIrradiance[wavelengthIndex]
		* cacheLocalSunScale(positionMeters);
}`,
			});
		}

		if (context.kind === 'primary-j1') {
			blocks.push(
				{
					id: 'local-sun-primary-j1-shell-held-scale',
					phase: 'function',
					order: 5,
					source: `float cacheLocalSunShellBoundary(int index) {
	return texelFetch(
		uCacheLocalSunShellBoundaries,
		ivec2(index, 0),
		0
	).r;
}

float cacheLocalSunShellHeldScale(float distanceMeters) {
	float firstBoundaryMeters = cacheLocalSunShellBoundary(0);
	float lastBoundaryMeters =
		cacheLocalSunShellBoundary(CACHE_LOCAL_SUN_SHELL_COUNT);
	float clampedDistanceMeters = clamp(
		distanceMeters,
		firstBoundaryMeters,
		lastBoundaryMeters
	);
	float heldScale = 0.0;
	if (clampedDistanceMeters >= lastBoundaryMeters) {
		heldScale = 0.5 * (
			cacheLocalSunScaleAtDistance(
				cacheLocalSunShellBoundary(
					CACHE_LOCAL_SUN_SHELL_COUNT - 1
				)
			)
			+ cacheLocalSunScaleAtDistance(lastBoundaryMeters)
		);
	} else {
		int lower = 0;
		int upper = CACHE_LOCAL_SUN_SHELL_COUNT;
		for (int iteration = 0;
			iteration < CACHE_LOCAL_SUN_SHELL_SEARCH_ITERATION_COUNT;
			iteration += 1) {
			int middle = (lower + upper) / 2;
			if (cacheLocalSunShellBoundary(middle)
				<= clampedDistanceMeters) {
				lower = middle;
			} else {
				upper = middle;
			}
		}

		heldScale = 0.5 * (
			cacheLocalSunScaleAtDistance(
				cacheLocalSunShellBoundary(lower)
			)
			+ cacheLocalSunScaleAtDistance(
				cacheLocalSunShellBoundary(lower + 1)
			)
		);
	}
	return heldScale;
}`,
				},
				{
					id: 'local-sun-primary-j1',
					phase: 'function',
					order: 10,
					source: `float cachePrimaryJ1(
	int positionIndex,
	int directionIndex,
	int wavelengthIndex
) {
	vec3 positionMeters = cachePosition(positionIndex);
	vec3 sourceDirection = cacheSourceDirection(positionMeters);
	float sourceTransmittance = cachePathTransmittance(
		positionMeters,
		sourceDirection,
		wavelengthIndex
	);
	vec3 outgoingDirection = cacheOutgoingDirection(
		directionIndex,
		sourceDirection
	);
	float phaseWeightedScattering =
		cacheRayleighScattering(positionMeters, wavelengthIndex)
			* cacheRayleighPhase(outgoingDirection, sourceDirection)
		+ cacheMieScattering(positionMeters, wavelengthIndex)
			* cacheMiePhase(outgoingDirection, sourceDirection);
	return sourceTransmittance
		* uCacheLocalSunReferenceIrradiance[wavelengthIndex]
		* cacheLocalSunShellHeldScale(
			cacheLocalSunDistance(positionMeters)
		)
		* phaseWeightedScattering;
}`,
				},
				{
					id: 'local-sun-primary-j1-main',
					phase: 'main',
					order: 0,
					source: `int directionIndex = int(gl_FragCoord.x);
int positionIndex = int(gl_FragCoord.y);
a32CacheOutput = cachePrimaryJ1(
	positionIndex,
	directionIndex,
	a32CacheWavelengthLayer
);`,
				},
			);
		}

		if (context.kind === 'direct-l1') {
			blocks.push(
				{
					id: 'local-sun-direct-l1',
					phase: 'function',
					order: 10,
					source: `float cacheDirectL1(
	int positionIndex,
	int directionIndex,
	int wavelengthIndex
) {
	vec3 originMeters = cachePosition(positionIndex);
	vec3 originSourceDirection =
		cacheSourceDirection(originMeters);
	vec3 pathDirection = cacheIncomingDirection(
		directionIndex,
		originSourceDirection
	);
	float endDistanceMeters = cacheReusableBoundaryDistance(
		originMeters,
		pathDirection
	);
	float intervalLengthMeters = endDistanceMeters
		/ float(CACHE_TRANSPORT_INTERVAL_COUNT);
	float viewTransmittance = 1.0;
	float previousExtinction = 0.0;
	float radiance = 0.0;

	for (int pointIndex = 0;
		pointIndex <= CACHE_TRANSPORT_INTERVAL_COUNT;
		pointIndex += 1) {
		float distanceMeters =
			intervalLengthMeters * float(pointIndex);
		vec3 samplePosition =
			originMeters + pathDirection * distanceMeters;
		float extinction =
			cacheExtinction(samplePosition, wavelengthIndex);
		if (pointIndex > 0) {
			viewTransmittance *= exp(
				-0.5 * (previousExtinction + extinction)
					* intervalLengthMeters
			);
		}

		vec3 sourceDirection =
			cacheSourceDirection(samplePosition);
		float sourceTransmittance = cachePathTransmittance(
			samplePosition,
			sourceDirection,
			wavelengthIndex
		);
		float phaseWeightedScattering =
			cacheRayleighScattering(
				samplePosition,
				wavelengthIndex
			) * cacheRayleighPhase(
				pathDirection,
				sourceDirection
			)
			+ cacheMieScattering(
				samplePosition,
				wavelengthIndex
			) * cacheMiePhase(
				pathDirection,
				sourceDirection
			);
		float measureMeters = intervalLengthMeters
			* (pointIndex == 0
				|| pointIndex == CACHE_TRANSPORT_INTERVAL_COUNT
				? 0.5
				: 1.0);
		radiance += viewTransmittance
			* sourceTransmittance
			* cacheSourceIrradiance(
				samplePosition,
				wavelengthIndex
			)
			* phaseWeightedScattering
			* measureMeters;
		previousExtinction = extinction;
	}

	return radiance;
}`,
				},
				{
					id: 'local-sun-direct-l1-main',
					phase: 'main',
					order: 0,
					source: `int directionIndex = int(gl_FragCoord.x);
int positionIndex = int(gl_FragCoord.y);
a32CacheOutput = cacheDirectL1(
	positionIndex,
	directionIndex,
	a32CacheWavelengthLayer
);`,
				},
			);
		}

		return blocks;
	}

	/**
	 * Creates a local sun cache source instance that binds the configured source and its private shell facts to construction.
	 *
	 * @param {LocalSunCacheSourceDefinition} request - Supplies the selected owners.
	 *
	 */
	constructor(request) {
		this._source = request.source;
		this._shellFactCache = request.shellFactCache;
		const boundaryValues = Float32Array.from(this._shellFactCache.boundaries);
		this._shellBoundaryData = CacheValues.createData({
			id: `${this._shellFactCache.id}-r32f-boundaries-v1`,
			quantity: 'local-sun-shell-boundary-radius',
			units: 'meters',
			shape: [LOCAL_SUN_SHELL_BOUNDARY_COUNT],
			values: boundaryValues,
		});
	}

	/**
	 * Value that returns the configured physical source facts.
	 *
	 * @returns {LocalSunLightSourceConfiguration} - The source configuration.
	 */
	get configuration() {
		return this._source.configuration;
	}

	/**
	 * Call this method to report actual retained facts, upload data, logical transport, and field memory for one completed build.
	 *
	 * @param {LocalSunCachePlan} plan - Supplies the executed logical graph.
	 * @param {CacheBuildDiagnostics} diagnostics - Supplies executor memory.
	 * @returns {LocalSunCacheResourceReport} - The source-owned resource report.
	 */
	createResourceReport(plan, diagnostics) {
		return {
			sourceFacts: this._shellFactCache.resourceUsage,
			boundaryTexture: {
				value: this._shellBoundaryData.values.length * Float32Array.BYTES_PER_ELEMENT,
				units: 'bytes',
			},
			packedTransportData: plan.resources.packedTransportData,
			executor: diagnostics.memory,
		};
	}

	/**
	 * Call this method to supply the dynamic point-source direction, irradiance, and primary fields.
	 *
	 * @param {CacheBuildContext} context - Supplies one logical pass.
	 * @returns {CacheBuildModule} - The source-owned module.
	 */
	createCacheModule(context) {
		const reflectiveScatter = context.kind === 'scatter' && context.groundReflection !== undefined;
		const provides = reflectiveScatter
			? [...LOCAL_SUN_CACHE_SYMBOLS_BY_PASS[context.kind], LOCAL_SUN_CACHE_IRRADIANCE_SYMBOL]
			: LOCAL_SUN_CACHE_SYMBOLS_BY_PASS[context.kind];

		return CacheBuildModules.createBuildModule({
			id: `algorithm32-local-sun-${context.kind}-module-v2`,
			owner: 'lightSource',
			provides,
			requires: LOCAL_SUN_CACHE_REQUIREMENTS_BY_PASS[context.kind],
			blocks: this._createBlocks(context, reflectiveScatter),
			bindings: this._createBindings(context, reflectiveScatter),
		});
	}
}
