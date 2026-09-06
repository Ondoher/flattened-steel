import {
	cacheFieldInputBindingName,
	createCacheBuildModule,
} from './cacheBuildContracts.js';
import {
	CACHE_GROUND_CONSTRUCTION_POSITION_TAP_COUNT,
	CACHE_OPERATION_REQUIREMENTS,
	REFLECTIVE_SCATTER_REQUIREMENTS,
} from './consts.js';

/**
 * Production adaptation of Algorithm32-Star's generic GPU recurrence.
 * Numerical authority:
 * `scripts/algorithm32-star/src/gpu/n-order-cache-shader-sources.js`
 * SHA-256: `085880c7a62c910937b3743bcf22b3e1844732b831b75b6f80e28185726869d4`.
 */

/**
 * Supply source-independent scatter, transport, and accumulation programs.
 */
export class CacheOperations {
	/** @param {CacheBuildContext} context - Supplies one resolved operation. */
	createCacheModule(context) {
		return createCacheBuildModule({
			id: `algorithm32-cache-${context.kind}-operation-v3`,
			owner: 'transport',
			provides: [`cache.operation.${context.kind}`],
			requires: this._operationRequirements(context),
			blocks: this._operationBlocks(context),
			bindings: this._operationBindings(context),
		});
	}

	/** Emit the exact scalar-field coordinate selected by the fullscreen pass. */
	_cacheCoordinate() {
		return `ivec3(
		int(gl_FragCoord.x),
		int(gl_FragCoord.y),
		a32CacheWavelengthLayer
	)`;
	}

	/**
	 * Add Star's reflected incoming radiance before phase scattering.
	 *
	 * The BRDF guard deliberately precedes every reflection-only hit, path, and
	 * illumination-field operation so an explicit zero boundary is exact black.
	 */
	_groundReflectionSource(context) {
		if (context.groundReflection === undefined) {
			return '';
		}

		const reflectedRadiance = context.groundReflection.kind === 'direct-source'
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

	/** Emit Star's direct-source Lambertian ground illumination for J2. */
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

	/** Emit Star's pure L(k - 2) ground-illumination integral for J3/J4. */
	_indirectGroundReflectionSource(groundReflection) {
		const illumination = cacheFieldInputBindingName(
			groundReflection.illumination.id,
		);

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

	/** Promote Star's pure L(k - 1) to pure Jk scattering loop. */
	_scatterBlocks(context) {
		const previousRadiance = cacheFieldInputBindingName(context.inputs[0].id);
		const groundReflection = this._groundReflectionSource(context);
		const reflectedRadianceAddition = context.groundReflection === undefined
			? ''
			: '\tpreviousRadiance += reflectedIncomingRadiance;\n';

		return [{
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
		}];
	}

	/** Promote Star's geometry-packed pure Jk to pure Lk transport loop. */
	_transportBlocks(context) {
		const scatteringDensity = cacheFieldInputBindingName(context.inputs[0].id);

		return [{
			id: 'algorithm32-cache-transport-main-v1',
			phase: 'main',
			order: 100,
			source: `int outputDirectionIndex = int(gl_FragCoord.x);
int outputPositionIndex = int(gl_FragCoord.y);
float radiance = 0.0;

for (int tapIndex = 0;
	tapIndex < CACHE_TRANSPORT_TAP_COUNT;
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
		}];
	}

	/** Copy or add accepted identical-domain J fields into cumulative storage. */
	_accumulateBlocks(context) {
		const coordinate = this._cacheCoordinate();
		const terms = context.inputs.map((input) => `texelFetch(
		${cacheFieldInputBindingName(input.id)},
		coordinate,
		0
	).r`);

		return [{
			id: 'algorithm32-cache-accumulate-main-v1',
			phase: 'main',
			order: 100,
			source: `ivec3 coordinate = ${coordinate};
a32CacheOutput = ${terms.join('\n\t+ ')};`,
		}];
	}

	/** Select executable source for one trusted operation context. */
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

	/** Supply compile-time operation controls from executable field facts. */
	_operationBindings(context) {
		if (context.kind !== 'scatter') {
			return [];
		}

		return [/** @type {CacheBinding} */ ({
			spec: {
				id: 'cache-operation-incoming-direction-count',
				name: 'CACHE_INCOMING_DIRECTION_COUNT',
				kind: 'define',
				shaderType: 'int',
				frequency: 'pass',
			},
			value: context.inputs[0].storage.width,
		})];
	}

	/** Add reflective dependencies only when the plan selected that branch. */
	_operationRequirements(context) {
		const requirements = CACHE_OPERATION_REQUIREMENTS[context.kind];
		return context.kind === 'scatter' && context.groundReflection !== undefined
			? [...requirements, ...REFLECTIVE_SCATTER_REQUIREMENTS]
			: requirements;
	}
}
