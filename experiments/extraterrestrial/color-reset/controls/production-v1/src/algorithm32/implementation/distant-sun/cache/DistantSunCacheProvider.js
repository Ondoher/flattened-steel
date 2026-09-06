import {CacheBuildModules} from '../../../shader-assembly/cache-pass/CacheBuildModules.js';
import {ScatteringOrderFieldOperations} from '../../../atmospheric-transport/ScatteringOrderFieldOperations.js';
import {ALGORITHM32_PRODUCTION_LATER_ORDER_SCATTERING_PROVENANCE_IDENTITY} from '../../../atmospheric-transport/consts.js';
import {CanonicalValueHash} from '../../../value-identity/CanonicalValueHash.js';
import {DEFAULT_CACHE_CONSTRUCTION_OPTIONS} from '../../../light-source-support/cache/consts.js';
import {CpuDirectionalSpectralField} from '../../../light-source-support/cache/CpuDirectionalSpectralField.js';
import {
	DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
	DISTANT_SUN_CACHE_IRRADIANCE_SYMBOL,
	DISTANT_SUN_CACHE_REQUIREMENTS_BY_PASS,
	DISTANT_SUN_CACHE_SYMBOLS_BY_PASS,
	DISTANT_SUN_CPU_FIELD_PROVENANCE_IDENTITY,
	DISTANT_SUN_CPU_FIRST_ORDER_CACHE_OPTIONS,
	DISTANT_SUN_CPU_SECOND_ORDER_CACHE_OPTIONS,
	DISTANT_SUN_CPU_TRANSPORT_INTERVAL_COUNT,
} from './consts.js';
import DistantSunDomainSelectionOwner from './DistantSunConstructionDomainSelection.js';
import {DistantSunCpuMultipleScatteringEvaluator} from './DistantSunCpuMultipleScatteringEvaluator.js';
import {DistantSunCpuPrimaryEvaluator} from './DistantSunCpuPrimaryEvaluator.js';

/** Distant-Sun cache construction, recurrence, and controller provider. */
export class DistantSunCacheProvider {
	/**
	 * Configured physical source facade.
	 * @type {DistantSunCacheProviderSource}
	 */
	_source;
	/**
	 * Immutable normalized source configuration.
	 * @type {DistantSunLightSourceConfiguration}
	 */
	_configuration;
	/**
	 * Provider-owned primary J1/L1 evaluator.
	 * @type {DistantSunCpuPrimaryEvaluator}
	 */
	_primaryEvaluator;
	/**
	 * Provider-owned later-order and stored-field evaluator.
	 * @type {DistantSunCpuMultipleScatteringEvaluator}
	 */
	_multipleScatteringEvaluator;

	/**
	 * Creates a cache provider for one configured distant-Sun facade.
	 *
	 * @param {DistantSunCacheProviderSource} source - The configured physical source facade.
	 * @param {DistantSunLightSourceConfiguration} configuration - The normalized source configuration.
	 */
	constructor(source, configuration) {
		this._source = source;
		this._configuration = configuration;
		this._primaryEvaluator = new DistantSunCpuPrimaryEvaluator(source, configuration, {
			createPureRadianceField: this._createPureRadianceField.bind(this),
			createPureScatteringDensityField: this._createPureScatteringDensityField.bind(this),
		});
		this._multipleScatteringEvaluator = new DistantSunCpuMultipleScatteringEvaluator(source, configuration, {
			createPureRadianceField: this._createPureRadianceField.bind(this),
		});
	}

	/**
	 * Called by DistantSunCacheProvider field allocators to create one source-
	 * owned binary64 field with the exact mutable-to-sealed lifecycle. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {DistantSunCpuFieldBuildDefinition} definition - Accepted field identity, order, packing, and provenance.
	 * @returns {CpuDirectionalSpectralFieldContract} - Mutable CPU field storage.
	 */
	_createField(definition) {
		const packing = definition.packing;
		const order =
			definition.order.kind === 'pure'
				? {kind: /** @type {const} */ ('pure'), value: definition.order.value}
				: {
						kind: /** @type {const} */ ('cumulative-through'),
						value: definition.order.value,
						included:
							definition.order.included === undefined
								? Array.from(
										{length: definition.order.value},
										/**
										 * Called by the surrounding operation to handle one callback invocation.
										 * @param _unused - The intentionally unused callback value.
										 * @param index - The zero-based index accepted by the operation.
										 * @returns - The callback result returned to its caller.
										 */ (_unused, index) => index + 1,
									)
								: [...definition.order.included],
					};

		return new CpuDirectionalSpectralField({
			id: definition.id,
			provenanceIdentity:
				definition.provenanceIdentity === undefined
					? DISTANT_SUN_CPU_FIELD_PROVENANCE_IDENTITY
					: definition.provenanceIdentity,
			order,
			packing,
		});
	}

	/**
	 * Called by provider-owned primary and multiple-scattering evaluation to
	 * allocate one independently mutable pure incoming-radiance field.
	 *
	 * @param {DistantSunCpuPureFieldDefinition} definition - Field identity, pure order, and optional domain/provenance.
	 * @returns {CpuDirectionalSpectralFieldContract} - Mutable binary64 Lk storage.
	 */
	_createPureRadianceField(definition) {
		const domainSelection = definition.domainSelection;
		return this._createField({
			id: definition.id,
			packing: domainSelection.radiancePacking,
			order: {kind: 'pure', value: definition.order},
			provenanceIdentity: definition.provenanceIdentity,
			domainSelection,
		});
	}

	/**
	 * Called by provider-owned recurrence and primary evaluation to allocate one
	 * independently mutable pure outgoing scattering-density field.
	 *
	 * @param {DistantSunCpuPureFieldDefinition} definition - Field identity, pure order, and optional domain/provenance.
	 * @returns {CpuDirectionalSpectralFieldContract} - Mutable binary64 Jk storage.
	 */
	_createPureScatteringDensityField(definition) {
		const domainSelection = definition.domainSelection;
		return this._createField({
			id: definition.id,
			packing: domainSelection.scatteringDensityPacking,
			order: {kind: 'pure', value: definition.order},
			provenanceIdentity: definition.provenanceIdentity,
			domainSelection,
		});
	}

	/**
	 * Called by cumulative-result construction to allocate one independently
	 * mutable cumulative outgoing scattering-density field.
	 *
	 * @param {DistantSunCpuCumulativeFieldDefinition} definition - Field identity, cumulative order, and optional domain/provenance.
	 * @returns {CpuDirectionalSpectralFieldContract} - Mutable binary64 cumulative J storage.
	 */
	_createCumulativeScatteringDensityField(definition) {
		const domainSelection = definition.domainSelection;
		return this._createField({
			id: definition.id,
			packing: domainSelection.scatteringDensityPacking,
			order: {
				kind: 'cumulative-through',
				value: definition.cumulativeThroughOrder,
			},
			provenanceIdentity: definition.provenanceIdentity,
			domainSelection,
		});
	}

	/**
	 * Called by CPU recurrence construction to derive the boundary-dependent
	 * field suffix while preserving the exact omitted-black identity. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {GroundBoundary | null | undefined} boundary - Selected executable boundary.
	 * @returns {string} - Boundary hash suffix or the empty omitted-black suffix.
	 */
	_boundaryFieldIdentitySuffix(boundary) {
		if (boundary == null) {
			return '';
		}

		return `-ground-${CanonicalValueHash.sha256Value({
			id: boundary.id,
			model: boundary.model,
			albedoContentHash: boundary.albedo.contentHash,
		})}`;
	}

	/**
	 * Called by completed CPU recurrence construction to report the exact
	 * executed options without selecting numerical work. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {SupportedCacheScatteringOrder} maximumScatteringOrder - Completed recurrence order.
	 * @param {number} transportIntervalCount - Executed transport interval count.
	 * @returns {CacheConstructionOptions} - Executed cache-construction options.
	 */
	_resolveConstructionOptions(maximumScatteringOrder, transportIntervalCount) {
		if (transportIntervalCount === DISTANT_SUN_CPU_TRANSPORT_INTERVAL_COUNT) {
			return maximumScatteringOrder === 1
				? DISTANT_SUN_CPU_FIRST_ORDER_CACHE_OPTIONS
				: maximumScatteringOrder === 2
					? DISTANT_SUN_CPU_SECOND_ORDER_CACHE_OPTIONS
					: DEFAULT_CACHE_CONSTRUCTION_OPTIONS;
		}

		return {
			transportIntervalCount,
			maximumScatteringOrder,
		};
	}

	/**
	 * Called by CPU recurrence construction to allocate, accumulate, and seal the
	 * final cumulative field as one lifecycle transaction.
	 *
	 * @param {DistantSunCpuCumulativeResultRequest} request - Completed pure fields and cache identity.
	 * @returns {DistantSunCpuCumulativeResult} - Sealed cumulative field and executed options.
	 */
	_buildCumulativeResult(request) {
		const maximumScatteringOrder = request.maximumScatteringOrder;
		const boundaryIdentitySuffix = request.boundaryIdentitySuffix;
		const cumulativeScatteringDensity = this._createCumulativeScatteringDensityField({
			id: `algorithm32-distant-sun-cpu-j-through-${maximumScatteringOrder}-v1${boundaryIdentitySuffix}`,
			cumulativeThroughOrder: maximumScatteringOrder,
			provenanceIdentity: `algorithm32-distant-sun-cpu-recurrence-through-${maximumScatteringOrder}-v1${boundaryIdentitySuffix}`,
			domainSelection: request.domainSelection,
		});

		ScatteringOrderFieldOperations.accumulatePureScatteringFields({
			pureFields: request.pureScatteringDensityByOrder,
			cumulativeField: cumulativeScatteringDensity,
			packing: request.domainSelection.scatteringDensityPacking,
		});
		request.onProgress?.({
			phase: 'accumulation',
			order: maximumScatteringOrder,
			completed: request.domainSelection.positionCount,
			total: request.domainSelection.positionCount,
		});
		const options = this._resolveConstructionOptions(maximumScatteringOrder, request.transportIntervalCount);

		return {cumulativeScatteringDensity, options};
	}

	/**
	 * Called by DistantSunCacheProvider to construct the complete source-owned
	 * CPU recurrence through the profile-selected order while preserving pure-field loop,
	 * transport, and result-array identity order.
	 *
	 * @param {DistantSunCpuCacheBuildRequest} request - Physical collaborators and bound recurrence operations.
	 * @returns {DistantSunCpuCacheResult} - Complete nonresident CPU result.
	 */
	_buildCpuCache(request) {
		const boundaryIdentitySuffix = this._boundaryFieldIdentitySuffix(request.groundBoundary);
		const maximumScatteringOrder = request.maximumScatteringOrder;
		const transportIntervalCount = request.transportIntervalCount;
		const domainSelection = request.domainSelection;

		const primaryScatteringDensity = this._primaryEvaluator.buildPrimaryScatteringDensity({
			...request,
		});
		if (maximumScatteringOrder === 1) {
			const cumulative = this._buildCumulativeResult({
				maximumScatteringOrder,
				pureScatteringDensityByOrder: [primaryScatteringDensity],
				boundaryIdentitySuffix,
				domainSelection,
				transportIntervalCount,
				onProgress: request.onProgress,
			});

			return {
				maximumScatteringOrder,
				domainSelection,
				pureScatteringDensityByOrder: [primaryScatteringDensity],
				pureRadianceByOrder: [],
				cumulativeScatteringDensity: cumulative.cumulativeScatteringDensity,
				options: cumulative.options,
			};
		}

		const multipleScatteringRequest =
			/** @type {DistantSunCpuCacheBuildRequestN2 | DistantSunCpuCacheBuildRequestN4} */ (request);
		const operations = multipleScatteringRequest.operations;
		const primaryRadiance = this._primaryEvaluator.buildPrimaryRadiance({
			...multipleScatteringRequest,
			transportIntervalCount,
		});
		const pureScatteringDensityByOrder = [primaryScatteringDensity];
		const pureRadianceByOrder = [primaryRadiance];
		let previousRadiance = primaryRadiance;

		for (let scatteringOrder = 2; scatteringOrder <= maximumScatteringOrder; scatteringOrder += 1) {
			const outputScattering = this._createPureScatteringDensityField({
				id: `algorithm32-distant-sun-cpu-pure-j${scatteringOrder}-v1${boundaryIdentitySuffix}`,
				order: scatteringOrder,
				provenanceIdentity: operations.scatteringProvenanceIdentity,
				domainSelection,
			});
			const groundIlluminationRadiance = scatteringOrder < 3 ? null : pureRadianceByOrder[scatteringOrder - 3];
			const pureScatteringDensity = ScatteringOrderFieldOperations.buildNextScatteringOrder({
				previousRadiance,
				outputScattering,
				kernel: operations.createScatteringKernel({
					scatteringOrder: /** @type {2 | 3 | 4 | 5} */ (scatteringOrder),
					groundIlluminationRadiance,
				}),
			});
			pureScatteringDensityByOrder.push(pureScatteringDensity);

			if (scatteringOrder < maximumScatteringOrder) {
				const transportedScatteringOrder = /** @type {2 | 3 | 4} */ (scatteringOrder);
				const transportedRadiance = /** @type {DistantSunCpuTransportedRadianceBuilder} */ (
					operations.buildTransportedRadiance
				)({
					scatteringDensity: pureScatteringDensity,
					scatteringOrder: transportedScatteringOrder,
					id: `algorithm32-distant-sun-cpu-pure-l${transportedScatteringOrder}-v1${boundaryIdentitySuffix}`,
				});
				pureRadianceByOrder.push(transportedRadiance);
				previousRadiance = transportedRadiance;
			}
		}

		const cumulative = this._buildCumulativeResult({
			maximumScatteringOrder,
			pureScatteringDensityByOrder,
			boundaryIdentitySuffix,
			domainSelection,
			transportIntervalCount,
			onProgress: request.onProgress,
		});
		if (maximumScatteringOrder === 2) {
			return {
				maximumScatteringOrder,
				domainSelection,
				pureScatteringDensityByOrder:
					/** @type {readonly [CpuDirectionalSpectralFieldContract, CpuDirectionalSpectralFieldContract]} */ ([
						pureScatteringDensityByOrder[0],
						pureScatteringDensityByOrder[1],
					]),
				pureRadianceByOrder: /** @type {readonly [CpuDirectionalSpectralFieldContract]} */ ([
					pureRadianceByOrder[0],
				]),
				cumulativeScatteringDensity: cumulative.cumulativeScatteringDensity,
				options: cumulative.options,
			};
		}
		if (maximumScatteringOrder === 3) {
			return /** @type {DistantSunCpuCacheResultN3} */ ({
				maximumScatteringOrder,
				domainSelection,
				pureScatteringDensityByOrder,
				pureRadianceByOrder,
				cumulativeScatteringDensity: cumulative.cumulativeScatteringDensity,
				options: cumulative.options,
			});
		}
		if (maximumScatteringOrder === 5) {
			return /** @type {DistantSunCpuCacheResultN5} */ ({
				maximumScatteringOrder,
				domainSelection,
				pureScatteringDensityByOrder,
				pureRadianceByOrder,
				cumulativeScatteringDensity: cumulative.cumulativeScatteringDensity,
				options: cumulative.options,
			});
		}

		return {
			maximumScatteringOrder,
			domainSelection,
			pureScatteringDensityByOrder:
				/** @type {readonly [CpuDirectionalSpectralFieldContract, CpuDirectionalSpectralFieldContract, CpuDirectionalSpectralFieldContract, CpuDirectionalSpectralFieldContract]} */ ([
					pureScatteringDensityByOrder[0],
					pureScatteringDensityByOrder[1],
					pureScatteringDensityByOrder[2],
					pureScatteringDensityByOrder[3],
				]),
			pureRadianceByOrder:
				/** @type {readonly [CpuDirectionalSpectralFieldContract, CpuDirectionalSpectralFieldContract, CpuDirectionalSpectralFieldContract]} */ ([
					pureRadianceByOrder[0],
					pureRadianceByOrder[1],
					pureRadianceByOrder[2],
				]),
			cumulativeScatteringDensity: cumulative.cumulativeScatteringDensity,
			options: cumulative.options,
		};
	}

	/**
	 * Call this method to create the source-owned program portions for one cache pass.
	 *
	 * @param {CacheBuildContext} context - The resolved logical pass.
	 * @returns {CacheBuildModule} - The source-owned module.
	 *
	 */
	createCacheModule(context) {
		const reflectiveScatter = context.kind === 'scatter' && context.groundReflection !== undefined;
		const provides = reflectiveScatter
			? [...DISTANT_SUN_CACHE_SYMBOLS_BY_PASS[context.kind], DISTANT_SUN_CACHE_IRRADIANCE_SYMBOL]
			: DISTANT_SUN_CACHE_SYMBOLS_BY_PASS[context.kind];
		const requires = DISTANT_SUN_CACHE_REQUIREMENTS_BY_PASS[context.kind];
		/** @type {CacheBinding[]} */
		const bindings = [];
		/** @type {CacheShaderBlock[]} */
		const blocks = [];

		if (context.kind !== 'accumulate') {
			bindings.push({
				spec: {
					id: 'distant-sun-source-direction',
					name: 'uCacheSourceDirection',
					kind: 'uniform',
					shaderType: 'vec3',
					frequency: 'build',
				},
				value: this._configuration.directionToLight,
			});
			blocks.push({
				id: 'distant-sun-cache-direction',
				phase: 'function',
				order: 0,
				source: `vec3 cacheSourceDirection(vec3 positionMeters) {
	return uCacheSourceDirection;
}`,
			});
		}

		if (context.kind === 'primary-j1' || context.kind === 'direct-l1' || reflectiveScatter) {
			bindings.push({
				spec: {
					id: 'distant-sun-source-irradiance',
					name: 'uCacheSourceIrradiance',
					kind: 'uniform',
					shaderType: `float[${this._configuration.sourceIrradiance.basis.channelCount}]`,
					frequency: 'build',
				},
				value: this._configuration.sourceIrradiance,
			});
		}

		if (reflectiveScatter) {
			blocks.push({
				id: 'distant-sun-cache-irradiance',
				phase: 'function',
				order: 5,
				source: `float cacheSourceIrradiance(
	vec3 positionMeters,
	int wavelengthIndex
) {
	return uCacheSourceIrradiance[wavelengthIndex];
}`,
			});
		}

		if (context.kind === 'primary-j1') {
			blocks.push(
				{
					id: 'distant-sun-primary-j1',
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
	vec3 outgoingLocal = cacheOutgoingLocalDirection(directionIndex);
	vec3 sourceLocal = vec3(1.0, 0.0, 0.0);
	float phaseWeightedScattering =
		cacheRayleighScattering(positionMeters, wavelengthIndex)
			* cacheRayleighPhase(outgoingLocal, sourceLocal)
		+ cacheMieScattering(positionMeters, wavelengthIndex)
			* cacheMiePhase(outgoingLocal, sourceLocal);
	return sourceTransmittance
		* uCacheSourceIrradiance[wavelengthIndex]
		* phaseWeightedScattering;
}`,
				},
				{
					id: 'distant-sun-primary-j1-main',
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
					id: 'distant-sun-direct-l1',
					phase: 'function',
					order: 10,
					source: `float cacheDirectL1(
	int positionIndex,
	int directionIndex,
	int wavelengthIndex
) {
	vec3 positionMeters = cachePosition(positionIndex);
	vec3 sourceDirection = cacheSourceDirection(positionMeters);
	vec3 pathDirection = cacheIncomingDirection(
		directionIndex,
		sourceDirection
	);
	if (cacheIncomingRayBlockedByGround(
		positionIndex,
		directionIndex,
		positionMeters,
		pathDirection
	)) return 0.0;

	float endDistanceMeters = cacheTopBoundaryDistance(
		positionMeters,
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
		float distanceMeters = intervalLengthMeters * float(pointIndex);
		vec3 samplePosition = positionMeters + pathDirection * distanceMeters;
		float extinction = cacheExtinction(samplePosition, wavelengthIndex);
		if (pointIndex > 0) {
			viewTransmittance *= exp(
				-0.5 * (previousExtinction + extinction)
				* intervalLengthMeters
			);
		}
		float sourceTransmittance = cachePathTransmittance(
			samplePosition,
			sourceDirection,
			wavelengthIndex
		);
		float phaseWeightedScattering =
			cacheRayleighScattering(samplePosition, wavelengthIndex)
				* cacheRayleighPhase(pathDirection, sourceDirection)
			+ cacheMieScattering(samplePosition, wavelengthIndex)
				* cacheMiePhase(pathDirection, sourceDirection);
		float measureMeters = intervalLengthMeters
			* (pointIndex == 0 || pointIndex == CACHE_TRANSPORT_INTERVAL_COUNT
				? 0.5
				: 1.0);
		radiance += viewTransmittance
			* sourceTransmittance
			* uCacheSourceIrradiance[wavelengthIndex]
			* phaseWeightedScattering
			* measureMeters;
		previousExtinction = extinction;
	}

	return radiance;
}`,
				},
				{
					id: 'distant-sun-direct-l1-main',
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

		return CacheBuildModules.createBuildModule({
			id: `algorithm32-distant-sun-${context.kind}-module-v1`,
			owner: 'lightSource',
			provides,
			requires,
			blocks,
			bindings,
		});
	}

	/**
	 * Called by DistantSunCacheProvider to identify the reflective branch of the public CPU recurrence union.
	 *
	 * @param {DistantSunCpuCacheRequestN2 | DistantSunCpuCacheRequestN3 | DistantSunCpuCacheRequestN4 | DistantSunCpuCacheRequestN5} request - The recurrence request.
	 * @returns {boolean} - Whether reflective requirements apply.
	 */
	_hasReflectiveCpuGround(request) {
		return request.groundBoundary != null;
	}

	/**
	 * Called by DistantSunCacheProvider to create one order-specific CPU scattering kernel with pure L(k-2) captured for reflective-ground illumination. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {DistantSunCpuRecurrenceContext} context - The source-owned physical collaborators.
	 * @param {CpuScatteringKernelBuildRequest} request - The requested pure order and ground field.
	 * @returns {ScatteringOrderKernel} - The synchronous order kernel.
	 */
	_createCpuScatteringKernel(context, request) {
		const cacheRequest = context.request;
		if (!this._hasReflectiveCpuGround(cacheRequest)) {
			return this._multipleScatteringEvaluator.createLaterOrderScatteringKernel({
				atmosphere: cacheRequest.atmosphere,
				geometry: cacheRequest.geometry,
				calculator: context.calculator,
				domainSelection: context.domainSelection,
				scatteringOrder: request.scatteringOrder,
				groundIlluminationRadiance: request.groundIlluminationRadiance,
				groundBoundary: null,
				onProgress: cacheRequest.onProgress,
			});
		}

		return this._multipleScatteringEvaluator.createLaterOrderScatteringKernel(
			/** @type {DistantSunCpuLaterOrderKernelEvaluationRequest} */ (
				/** @type {unknown} */ ({
					geometry: cacheRequest.geometry,
					atmosphere: cacheRequest.atmosphere,
					calculator: context.calculator,
					domainSelection: context.domainSelection,
					scatteringOrder: request.scatteringOrder,
					groundIlluminationRadiance: request.groundIlluminationRadiance,
					groundBoundary: cacheRequest.groundBoundary,
					sourceTransmittanceIntervalCount: context.profile.numerical.sourcePathTransmittance.intervalCount,
					onProgress: cacheRequest.onProgress,
				})
			),
		);
	}

	/**
	 * Called by DistantSunCacheProvider to build one boundary-identified pure stored-field radiance order.
	 *
	 * @param {DistantSunCpuRecurrenceContext} context - The physical transport owners.
	 * @param {CpuTransportedRadianceBuildRequest} request - Pure Jk and its source-owned Lk identity.
	 * @returns {CpuDirectionalSpectralFieldContract} - The sealed pure Lk field.
	 */
	_buildCpuTransportedRadiance(context, request) {
		const fourthOrderRequest = /** @type {DistantSunCpuCacheRequestN4} */ (context.request);

		return this._multipleScatteringEvaluator.buildTransportedRadiance({
			scatteringDensity: request.scatteringDensity,
			scatteringOrder: request.scatteringOrder,
			geometry: fourthOrderRequest.geometry,
			atmosphere: fourthOrderRequest.atmosphere,
			calculator: context.calculator,
			domainSelection: context.domainSelection,
			transportIntervalCount: context.transportIntervalCount,
			id: request.id,
			onProgress: fourthOrderRequest.onProgress,
		});
	}

	/**
	 * Called by DistantSunCacheProvider to bind source-owned CPU recurrence methods for N2.
	 *
	 * @param {DistantSunCpuRecurrenceContext} context - The captured physical owners.
	 * @returns {DistantSunCpuCacheOperations} - The N2 operations.
	 */
	_createCpuRecurrenceOperations(context) {
		return {
			createScatteringKernel: this._createCpuScatteringKernel.bind(this, context),
			scatteringProvenanceIdentity: ALGORITHM32_PRODUCTION_LATER_ORDER_SCATTERING_PROVENANCE_IDENTITY,
		};
	}

	/**
	 * Called by DistantSunCacheProvider to bind source-owned CPU recurrence methods for N4.
	 *
	 * @param {DistantSunCpuRecurrenceContext} context - The captured physical owners.
	 * @returns {DistantSunCpuFourthOrderCacheOperations} - The N4 operations.
	 */
	_createCpuFourthOrderRecurrenceOperations(context) {
		return {
			...this._createCpuRecurrenceOperations(context),
			buildTransportedRadiance: this._buildCpuTransportedRadiance.bind(this, context),
		};
	}

	/**
	 * Called by DistantSunCacheProvider to select the omitted-ground default and verify explicit reflective-boundary profile facts.
	 *
	 * @param {DistantSunCpuCacheRequestN2 | DistantSunCpuCacheRequestN3 | DistantSunCpuCacheRequestN4 | DistantSunCpuCacheRequestN5} request - The public recurrence request.
	 * @returns {Algorithm32ExecutionProfile} - The accepted recurrence profile.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_acceptCpuRecurrenceProfile(request) {
		if (!this._hasReflectiveCpuGround(request)) {
			return request.model.profile;
		}
		const profile = request.model.profile;
		const albedo = profile.models.groundBoundary?.albedo;
		if (albedo === undefined) {
			throw new TypeError('reflective distant-Sun CPU construction requires a profile-owned ground albedo.');
		}
		const boundary = request.groundBoundary;
		if (boundary == null) {
			throw new TypeError('reflective distant-Sun CPU construction requires a profile-owned ground boundary.');
		}
		const boundaryAlbedo = boundary.albedo;
		if (
			boundaryAlbedo.contentHash !== albedo.contentHash ||
			boundaryAlbedo.basisHash !== profile.spectral.basis.contentHash
		) {
			throw new TypeError(
				'reflective distant-Sun CPU boundary must match the explicit profile albedo and spectral basis.',
			);
		}

		return profile;
	}

	/**
	 * Called by DistantSunCacheProvider to require the geometry operations used only by N=4 stored-field transport.
	 *
	 * @param {unknown} geometry - The public geometry candidate.
	 * @returns {void} - No return value.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_assertStoredFieldTransportGeometry(geometry) {
		if (!geometry || typeof geometry !== 'object' || Array.isArray(geometry)) {
			throw new TypeError('DistantSunLightSource N=4 stored-field transport geometry must be an object.');
		}
		for (const methodName of [
			'resolveScatteringCacheConstructionPositionStencil',
			'expressScatteringCacheDirection',
		]) {
			if (typeof (/** @type {Record<string, unknown>} */ (geometry)[methodName]) !== 'function') {
				throw new TypeError(
					`DistantSunLightSource N=4 stored-field transport geometry must implement ${methodName}().`,
				);
			}
		}
	}

	/**
	 * Call this method to build one complete nonresident CPU scattering result. Plain source construction defaults to N=4. An explicit N=1 request builds only J1 and its cumulative field; N=2 and N=4 bind the production physical later-order scatter and stored-field transport operations internally. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {DistantSunCpuCacheRequest} request - The aggregate execution model.
	 * @returns {DistantSunCpuCacheResult} - The canonical sealed N=1, N=2, or N=4 build result.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	buildCpuScatteringCache(request) {
		const model = request.model;
		const profileForDefaults = model.profile;
		const geometry = /** @type {DistantSunCpuCacheRequestN4['geometry']} */ (
			/** @type {unknown} */ (model.geometry)
		);
		const atmosphere = model.atmosphere;
		const groundBoundary = model.groundBoundary;
		const maximumScatteringOrder = profileForDefaults.numerical.cacheConstruction.maximumScatteringOrder;
		if (maximumScatteringOrder < 1 || maximumScatteringOrder > 5) {
			throw new RangeError('distant-Sun CPU maximum scattering order must be between 1 and 5.');
		}
		const transportIntervalCount = profileForDefaults.numerical.cacheConstruction.transportIntervalCount;
		const domainSelection = DistantSunDomainSelectionOwner.fromProfile(profileForDefaults);
		const executionRequest = {
			...request,
			geometry,
			atmosphere,
			groundBoundary,
			maximumScatteringOrder,
			transportIntervalCount,
			domainSelection,
		};

		if (maximumScatteringOrder === 1) {
			const firstOrderRequest = /** @type {DistantSunCpuCacheRequestN1} */ (executionRequest);
			return this._buildCpuCache({
				...firstOrderRequest,
				maximumScatteringOrder: 1,
				lightSource: this._source,
				domainSelection,
				transportIntervalCount,
			});
		}

		const multipleScatteringRequest =
			/** @type {DistantSunCpuCacheRequestN2 | DistantSunCpuCacheRequestN3 | DistantSunCpuCacheRequestN4 | DistantSunCpuCacheRequestN5} */ (
				executionRequest
			);
		const profile = this._acceptCpuRecurrenceProfile(multipleScatteringRequest);
		if (maximumScatteringOrder > 2) {
			this._assertStoredFieldTransportGeometry(multipleScatteringRequest.geometry);
		}
		const calculator = this._primaryEvaluator.createSpectralCalculator({model: multipleScatteringRequest.model});
		const recurrenceContext = {
			request: multipleScatteringRequest,
			calculator,
			profile,
			domainSelection,
			transportIntervalCount,
		};

		if (maximumScatteringOrder === 2) {
			return this._buildCpuCache({
				...multipleScatteringRequest,
				profile,
				maximumScatteringOrder: 2,
				lightSource: this._source,
				calculator,
				domainSelection,
				transportIntervalCount,
				operations: this._createCpuRecurrenceOperations(recurrenceContext),
			});
		}
		const higherOrderRequest =
			/** @type {DistantSunCpuCacheRequestN3 | DistantSunCpuCacheRequestN4 | DistantSunCpuCacheRequestN5} */ (
				multipleScatteringRequest
			);

		return this._buildCpuCache({
			...higherOrderRequest,
			profile,
			maximumScatteringOrder,
			lightSource: this._source,
			calculator,
			domainSelection,
			transportIntervalCount,
			operations: this._createCpuFourthOrderRecurrenceOperations(recurrenceContext),
		});
	}

	/**
	 * Call this method to build the source-owned direct CPU primary-radiance field. This focused seam exposes the selected direct L1 seed for recurrence diagnostics; it is not an alternate cache-build result contract.
	 *
	 * @param {DistantSunCpuPrimaryRadianceFieldRequest} request - The aggregate model and focused field identities.
	 * @returns {CpuDirectionalSpectralFieldContract} - The sealed pure L1 field.
	 *
	 */
	buildCpuPrimaryRadianceField(request) {
		const model = request.model;
		const profile = model.profile;
		const transportIntervalCount = profile.numerical.cacheConstruction.transportIntervalCount;
		const calculator = this._primaryEvaluator.createSpectralCalculator({model: request.model});

		return this._primaryEvaluator.buildPrimaryRadiance({
			...request,
			geometry: /** @type {DistantSunPrimaryRadianceGeometry} */ (/** @type {unknown} */ (model.geometry)),
			atmosphere: model.atmosphere,
			calculator,
			transportIntervalCount,
		});
	}
}
