import {CacheBuildModules} from '../../shader-assembly/cache-pass/CacheBuildModules.js';
import {
	CACHE_GROUND_CONSTRUCTION_POSITION_TAP_COUNT,
	CACHE_OPERATION_REQUIREMENTS,
	REFLECTIVE_SCATTER_REQUIREMENTS,
} from './consts.js';

/**
 * Production implementation of the generic GPU recurrence.
 */

/** Object that supplies source-independent scatter, transport, and accumulation programs. */
export class CacheOperations {
	/**
	 * Call this method to create cache module.
	 *
	 *  @param {CacheBuildContext} context - Supplies one resolved operation.
	 * @returns - The result produced by the operation.
	 */
	createCacheModule(context) {
		return CacheBuildModules.createBuildModule({
			id: `algorithm32-cache-${context.kind}-operation-v3`,
			owner: 'transport',
			provides: [`cache.operation.${context.kind}`],
			requires: this._operationRequirements(context),
			blocks: this._operationBlocks(context),
			bindings: this._operationBindings(context),
		});
	}

	/**
	 * Called by cache operations to emit the exact scalar-field coordinate selected by the fullscreen pass.
	 * @returns - The result produced by the operation.
	 */
	_cacheCoordinate() {
		return `ivec3(
		int(gl_FragCoord.x),
		int(gl_FragCoord.y),
		a32CacheWavelengthLayer
	)`;
	}

	/**
	 * Called by cache operations to add production reflected incoming radiance before phase scattering. The BRDF guard deliberately precedes every reflection-only hit, path, and illumination-field operation so an explicit zero boundary is exact black. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 * @param context - The execution context accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	_groundReflectionSource(context) {
		if (context.groundReflection === undefined) {
			return '';
		}

		const reflectedRadiance =
			context.groundReflection.kind === 'direct-source'
				? this._directGroundReflectionSource()
				: this._indirectGroundReflectionSource(context.groundReflection);

		return `	float reflectedIncomingRadiance = 0.0;
	float groundBrdf = cacheGroundBrdf(a32CacheWavelengthLayer);
	if (groundBrdf != 0.0) {
		vec3 groundPositionMeters;
		vec3 groundNormal;
		float groundDistanceMeters;
		ivec4 groundConstructionPositionIndices;
		vec4 groundConstructionPositionWeights;
		if (cacheGroundBoundaryHit(
			position,
			incomingDirection,
			positionIndex,
			incomingIndex,
			groundPositionMeters,
			groundNormal,
			groundDistanceMeters,
			groundConstructionPositionIndices,
			groundConstructionPositionWeights
		)) {
			vec3 groundSourceDirection =
				cacheSourceDirection(groundPositionMeters);
${reflectedRadiance}
			reflectedIncomingRadiance *= cacheFiniteSegmentTransmittance(
				groundPositionMeters,
				-incomingDirection,
				groundDistanceMeters,
				a32CacheWavelengthLayer
			);
		}
	}
`;
	}

	/**
	 * Called by cache operations to emit production direct-source Lambertian ground illumination for J2.
	 * @returns - The result produced by the operation.
	 */
	_directGroundReflectionSource() {
		return `			float sourceCosine = max(
				0.0,
				dot(groundNormal, groundSourceDirection)
			);
			if (sourceCosine != 0.0) {
				reflectedIncomingRadiance =
					cacheSourceIrradiance(
						groundPositionMeters,
						a32CacheWavelengthLayer
					)
					* cachePathTransmittance(
						groundPositionMeters,
						groundSourceDirection,
						a32CacheWavelengthLayer
					)
					* sourceCosine
					* groundBrdf;
			}`;
	}

	/**
	 * Called by cache operations to emit production pure L(k - 2) ground-illumination integral for J3/J4.
	 * @param groundReflection - The ground reflection value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	_indirectGroundReflectionSource(groundReflection) {
		const illumination = CacheBuildModules.fieldInputBindingName(groundReflection.illumination.id);

		return `			for (int groundIncomingIndex = 0;
				groundIncomingIndex < CACHE_INCOMING_DIRECTION_COUNT;
				++groundIncomingIndex) {
				vec3 groundIncomingDirection = cacheIncomingDirection(
					groundIncomingIndex,
					groundSourceDirection
				);
				float groundCosine = max(
					0.0,
					dot(groundNormal, groundIncomingDirection)
				);
				if (groundCosine != 0.0) {
					float groundIllumination = 0.0;
					for (int groundPositionTapIndex = 0;
						groundPositionTapIndex < ${CACHE_GROUND_CONSTRUCTION_POSITION_TAP_COUNT};
						++groundPositionTapIndex) {
						float groundPositionWeight =
							groundConstructionPositionWeights[
								groundPositionTapIndex
							];
						if (groundPositionWeight != 0.0) {
							groundIllumination += texelFetch(
								${illumination},
								ivec3(
									groundIncomingIndex,
									groundConstructionPositionIndices[
										groundPositionTapIndex
									],
									a32CacheWavelengthLayer
								),
								0
							).r * groundPositionWeight;
						}
					}
					reflectedIncomingRadiance += groundIllumination
						* groundBrdf
						* groundCosine
						* cacheIncomingWeight(groundIncomingIndex);
				}
			}`;
	}

	/**
	 * Called by cache operations to promote production pure L(k - 1) to the pure Jk scattering loop.
	 *
	 * @param {CacheBuildContext} context - The resolved scatter operation.
	 * @returns {readonly CacheShaderBlock[]} - The ordered scattering blocks.
	 *
	 */
	_scatterBlocks(context) {
		const previousRadiance = CacheBuildModules.fieldInputBindingName(context.inputs[0].id);
		const groundReflection = this._groundReflectionSource(context);
		const reflectedRadianceAddition =
			context.groundReflection === undefined ? '' : '\tpreviousRadiance += reflectedIncomingRadiance;\n';

		return [
			{
				id: 'algorithm32-cache-scatter-main-v2',
				phase: 'main',
				order: 100,
				source: `int outgoingIndex = int(gl_FragCoord.x);
int positionIndex = int(gl_FragCoord.y);
vec3 position = cachePosition(positionIndex);
vec3 sourceDirection = cacheSourceDirection(position);
vec3 outgoingDirection = cacheOutgoingDirection(outgoingIndex, sourceDirection);
float rayleighScattering = cacheRayleighScattering(
	position,
	a32CacheWavelengthLayer
);
float mieScattering = cacheMieScattering(
	position,
	a32CacheWavelengthLayer
);
float scatteringDensity = 0.0;

for (int incomingIndex = 0;
	incomingIndex < CACHE_INCOMING_DIRECTION_COUNT;
	++incomingIndex) {
	vec3 incomingDirection = cacheIncomingDirection(
		incomingIndex,
		sourceDirection
	);
${groundReflection}	float phaseWeightedScattering =
		rayleighScattering * cacheRayleighPhase(
			outgoingDirection,
			incomingDirection
		)
		+ mieScattering * cacheMiePhase(
			outgoingDirection,
			incomingDirection
		);
	float previousRadiance = texelFetch(
		${previousRadiance},
		ivec3(incomingIndex, positionIndex, a32CacheWavelengthLayer),
		0
	).r;
${reflectedRadianceAddition}	scatteringDensity += previousRadiance
		* phaseWeightedScattering
		* cacheIncomingWeight(incomingIndex);
}

a32CacheOutput = scatteringDensity;`,
			},
		];
	}

	/**
	 * Called by cache operations to promote production geometry-packed pure Jk to the pure Lk transport loop.
	 *
	 * @param {CacheBuildContext} context - The resolved transport operation.
	 * @returns {readonly CacheShaderBlock[]} - The ordered transport blocks.
	 *
	 */
	_transportBlocks(context) {
		const scatteringDensity = CacheBuildModules.fieldInputBindingName(context.inputs[0].id);

		return [
			{
				id: 'algorithm32-cache-transport-main-v1',
				phase: 'main',
				order: 100,
				source: `int outputDirectionIndex = int(gl_FragCoord.x);
int outputPositionIndex = int(gl_FragCoord.y);
float radiance = 0.0;

for (int tapIndex = cacheTransportTapStart(outputDirectionIndex, outputPositionIndex);
	tapIndex < cacheTransportTapEnd(outputDirectionIndex, outputPositionIndex);
	++tapIndex) {
	ivec3 source = cacheTransportSource(
		outputDirectionIndex,
		outputPositionIndex,
		tapIndex
	);
	if (source.z != 0) {
		float density = texelFetch(
			${scatteringDensity},
			ivec3(source.xy, a32CacheWavelengthLayer),
			0
		).r;
		float coefficient = cacheTransportCoefficient(
			outputDirectionIndex,
			outputPositionIndex,
			tapIndex,
			a32CacheWavelengthLayer
		);
		radiance += density * coefficient;
	}
}

a32CacheOutput = radiance;`,
			},
		];
	}

	/**
	 * Called by cache operations to copy or add accepted identical-domain J fields into cumulative storage.
	 *
	 * @param {CacheBuildContext} context - The resolved accumulation operation.
	 * @returns {readonly CacheShaderBlock[]} - The ordered accumulation blocks.
	 *
	 */
	_accumulateBlocks(context) {
		const coordinate = this._cacheCoordinate();
		const terms = context.inputs.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param input - The input value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (input) => `texelFetch(
		${CacheBuildModules.fieldInputBindingName(input.id)},
		coordinate,
		0
	).r`,
		);

		return [
			{
				id: 'algorithm32-cache-accumulate-main-v1',
				phase: 'main',
				order: 100,
				source: `ivec3 coordinate = ${coordinate};
a32CacheOutput = ${terms.join('\n\t+ ')};`,
			},
		];
	}

	/**
	 * Called by cache operations to select executable source for one trusted operation context.
	 *
	 * @param {CacheBuildContext} context - The resolved operation context.
	 * @returns {readonly CacheShaderBlock[]} - The ordered operation blocks.
	 *
	 */
	_operationBlocks(context) {
		if (context.kind === 'scatter') {
			return this._scatterBlocks(context);
		}
		if (context.kind === 'transport') {
			return this._transportBlocks(context);
		}
		if (context.kind === 'accumulate') {
			return this._accumulateBlocks(context);
		}
		return [];
	}

	/**
	 * Called by cache operations to supply compile-time operation options from executable field facts. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 * @param context - The execution context accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	_operationBindings(context) {
		if (context.kind !== 'scatter') {
			return [];
		}

		return [
			/** @type {CacheBinding} */ ({
				spec: {
					id: 'cache-operation-incoming-direction-count',
					name: 'CACHE_INCOMING_DIRECTION_COUNT',
					kind: 'define',
					shaderType: 'int',
					frequency: 'pass',
				},
				value: context.inputs[0].storage.width,
			}),
		];
	}

	/**
	 * Called by cache operations to add reflective dependencies only when the plan selected that branch.
	 * @param context - The execution context accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	_operationRequirements(context) {
		const requirements = CACHE_OPERATION_REQUIREMENTS[context.kind];
		return context.kind === 'scatter' && context.groundReflection !== undefined
			? [...requirements, ...REFLECTIVE_SCATTER_REQUIREMENTS]
			: requirements;
	}
}
