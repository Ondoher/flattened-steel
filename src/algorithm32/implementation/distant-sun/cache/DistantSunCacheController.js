import {CanonicalValueHash} from '../../../value-identity/CanonicalValueHash.js';
import {CANONICAL_BLACK_GROUND_CACHE_MODULE_DEFINITION} from '../../../ground-transport/cache/consts.js';
import {CacheOperations} from '../../../atmospheric-transport/cache/CacheOperations.js';
import {IntegratedCacheTransport} from '../../../atmospheric-transport/cache/IntegratedCacheTransport.js';
import {CacheGpuExecutor} from '../../../gpu-cache-runtime/CacheGpuExecutor.js';
import {CachePassAssembler} from '../../../shader-assembly/cache-pass/CachePassAssembler.js';
import {CacheBuildModules} from '../../../shader-assembly/cache-pass/CacheBuildModules.js';
import {CacheValues} from '../../../gpu-cache-runtime/CacheValues.js';
import {DistantSunCache} from './DistantSunCache.js';
import DistantSunConstructionDomainSelection from './DistantSunConstructionDomainSelection.js';

/** Controller for distant-Sun GPU cache construction within one runtime attachment. */
export class DistantSunCacheController {
	/**
	 * Source value.
	 *
	 *  @type {DistantSunCacheSource}
	 *
	 */
	_source;
	/** Aggregate execution model retained for the controller lifetime. @type {SharedModel} */
	_model;
	/**
	 * Backend value.
	 *
	 *  @type {CacheGpuBackend}
	 *
	 */
	_backend;
	/**
	 * Scheduler value.
	 *
	 *  @type {CacheBuildScheduler | undefined}
	 *
	 */
	_scheduler;
	/**
	 * Executor value.
	 *
	 *  @type {CacheGpuExecutor}
	 *
	 */
	_executor;
	/**
	 * Active value.
	 *
	 *  @type {DistantSunCache | null}
	 *
	 */
	_active = null;
	/**
	 * Active reuse key value.
	 *
	 *  @type {string | null}
	 *
	 */
	_activeReuseKey = null;
	/**
	 * Tail value.
	 *
	 *  @type {Promise<void>}
	 *
	 */
	_tail = Promise.resolve();
	/**
	 * Latest cancellation value.
	 *
	 *  @type {AbortController | null}
	 *
	 */
	_latestCancellation = null;
	/** Generation value. */ _generation = 0;
	/** Disposed value. */ _disposed = false;

	/**
	 * Called by distant sun cache controller to create one ordinary cancellation error without requiring a DOM runtime.
	 *
	 * @param {string} message - Supplies the diagnostic.
	 * @returns {Error} - The abort error.
	 */
	_createAbortError(message) {
		const error = new Error(message);
		error.name = 'AbortError';
		return error;
	}

	/**
	 * Called by distant sun cache controller to accept one supported construction maximum.
	 *
	 * @param {unknown} value - Supplies the requested maximum.
	 * @returns {SupportedCacheScatteringOrder} - The accepted maximum.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	/**
	 * Called by DistantSunCacheController to create a pure outgoing Jk field
	 * specification on the selected scattering lattice.
	 *
	 * @param {1 | 2 | 3 | 4 | 5} order - The pure scattering order.
	 * @param {DistantSunCacheFieldDomains} fieldDomains - The executable field
	 * shapes.
	 * @returns {CacheFieldSpec} - The field specification.
	 */
	_createPureScatteringField(order, fieldDomains) {
		return {
			id: `distant-sun-j${order}`,
			storage: fieldDomains.scattering,
		};
	}

	/**
	 * Called by DistantSunCacheController to create a pure incoming Lk field
	 * specification on the selected radiance lattice.
	 *
	 * @param {1 | 2 | 3 | 4} order - The pure radiance order.
	 * @param {DistantSunCacheFieldDomains} fieldDomains - The executable field
	 * shapes.
	 * @returns {CacheFieldSpec} - The field specification.
	 */
	_createPureRadianceField(order, fieldDomains) {
		return {
			id: `distant-sun-l${order}`,
			storage: fieldDomains.radiance,
		};
	}

	/**
	 * Called by DistantSunCacheController to create a cumulative J-through-N
	 * field specification.
	 *
	 * @param {1 | 2 | 3 | 4 | 5} order - The cumulative maximum.
	 * @param {DistantSunCacheFieldDomains} fieldDomains - The executable field
	 * shapes.
	 * @returns {CacheFieldSpec} - The field specification.
	 */
	_createCumulativeScatteringField(order, fieldDomains) {
		return {
			id: `distant-sun-j-through-${order}`,
			storage: fieldDomains.scattering,
		};
	}

	/**
	 * Called by DistantSunCacheController to create one pass context from
	 * source-owned graph facts. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {CachePassKind} kind - The pass kind.
	 * @param {CacheOrder} order - The scattering order.
	 * @param {readonly CacheFieldSpec[]} inputs - The pure or cumulative inputs.
	 * @param {CacheFieldSpec} output - The logical output.
	 * @param {CacheConstructionOptions} options - The construction options.
	 * @param {CacheConstructionDomains} domains - The executable domains.
	 * @param {CacheTransportData} [transportData] - The shared packed transport taps.
	 * @param {CacheGroundReflection} [groundReflection] - The reflective illumination facts.
	 * @returns {CacheBuildContext} - The pass context.
	 */
	_createPassContext(kind, order, inputs, output, options, domains, transportData, groundReflection) {
		return {
			kind,
			order,
			inputs,
			output,
			options,
			domains,
			...(transportData ? {transportData} : {}),
			...(groundReflection ? {groundReflection} : {}),
		};
	}

	/**
	 * Called by DistantSunCacheController to create the source-owned scalar
	 * output-layout module for one pass.
	 *
	 * @param {CacheBuildContext} context - The resolved pass.
	 * @returns {CacheBuildModule} - The layout module.
	 */
	_createLayoutModule(context) {
		const storage = context.output.storage;
		const integratedTransport = context.kind === 'transport';
		const inputBindingName = integratedTransport
			? CacheBuildModules.fieldInputBindingName(context.inputs[0].id)
			: null;

		return CacheBuildModules.createBuildModule({
			id: `algorithm32-distant-sun-${context.output.id}-layout-module-v2`,
			owner: 'cache',
			provides: integratedTransport
				? ['cache.outputLayout', 'cache.storedScatteringDensity']
				: ['cache.outputLayout'],
			requires: [],
			blocks: integratedTransport
				? [
						{
							id: 'distant-sun-cache-stored-scattering-density',
							phase: 'function',
							order: 0,
							source: `float cacheStoredScatteringDensity(
	int directionIndex,
	int positionIndex,
	int wavelengthIndex
) {
	return texelFetch(
		${inputBindingName},
		ivec3(directionIndex, positionIndex, wavelengthIndex),
		0
	).r;
}`,
						},
					]
				: [],
			bindings: [
				{
					spec: {
						id: 'distant-sun-cache-direction-count',
						name: 'CACHE_DIRECTION_COUNT',
						kind: 'define',
						shaderType: 'int',
						frequency: 'pass',
					},
					value: storage.width,
				},
				{
					spec: {
						id: 'distant-sun-cache-position-count',
						name: 'CACHE_POSITION_COUNT',
						kind: 'define',
						shaderType: 'int',
						frequency: 'pass',
					},
					value: storage.height,
				},
				{
					spec: {
						id: 'distant-sun-cache-wavelength-count',
						name: 'CACHE_WAVELENGTH_COUNT',
						kind: 'define',
						shaderType: 'int',
						frequency: 'build',
					},
					value: storage.layers,
				},
			],
		});
	}

	/**
	 * Called by DistantSunCacheController to create one pass from only the
	 * concrete owner modules required by that operation.
	 *
	 * @param {DistantSunCachePassDefinition} definition - The pass construction facts.
	 * @returns {CachePass} - The cache pass.
	 */
	_createPass(definition) {
		const modules = definition.contributors.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param contributor - The contributor value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (contributor) => contributor.createCacheModule(definition.context),
		);

		if (definition.includeGround) {
			modules.push(
				definition.groundBoundary === null || definition.groundBoundary === undefined
					? CacheBuildModules.createBuildModule(CANONICAL_BLACK_GROUND_CACHE_MODULE_DEFINITION)
					: definition.groundBoundary.createCacheModule(definition.context),
			);
		}
		modules.push(this._createLayoutModule(definition.context));

		return {
			id: definition.id,
			kind: definition.context.kind,
			order: definition.context.order,
			inputs: definition.context.inputs.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param input - The input value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (input) => input.id,
			),
			output: definition.context.output.id,
			modules,
		};
	}

	/**
	 * Called by DistantSunCacheController reuse checks to derive the complete
	 * controller-local plan and backend identity.
	 *
	 * @param {CacheBuildPlan} plan - The complete source-owned graph.
	 * @param {CacheGpuCapabilities} capabilities - The accepted backend capabilities.
	 * @returns {string} - The deterministic cache reuse key.
	 */
	_createReuseKey(plan, capabilities) {
		return CanonicalValueHash.sha256Value({
			kind: 'algorithm32-distant-sun-gpu-cache-reuse-key',
			plan: plan.identity,
			backendCapabilities: capabilities,
		});
	}

	/**
	 * Called by distant sun cache controller to accept semantic values at the source-owned construction boundary.
	 *
	 * @param {ScatteringCacheBuildRequest} request - Supplies the request.
	 * @returns {DistantSunAcceptedCacheBuildRequest} - The normalized request.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_acceptBuildRequest(request) {
		if (request.signal?.aborted === true) {
			throw this._createAbortError('Distant-Sun cache construction was aborted.');
		}
		return request;
	}

	/**
	 * Called by distant sun cache controller to link caller cancellation to one controller-owned generation signal. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {AbortSignal | undefined} signal - Supplies caller cancellation.
	 * @param {AbortController} controller - Supplies owned cancellation.
	 * @returns {() => void} - The unlink operation.
	 */
	_linkCancellation(signal, controller) {
		if (!signal) {
			return /** Called by link cancellation to handle one invocation of the declared operation. */ () => {};
		}
		/**
		 * Called by abort to abort.
		 * @returns - The callback result returned to its caller.
		 */ const abort = () => controller.abort();
		signal.addEventListener('abort', abort, {once: true});
		return (
			/**
			 * Called by link cancellation to handle one invocation of the declared operation.
			 * @returns - The callback result returned to its caller.
			 */ () => signal.removeEventListener('abort', abort)
		);
	}

	/**
	 * Creates one per-runtime distant-Sun cache controller.
	 *
	 * @param {DistantSunCacheControllerConfiguration} request - The construction collaborators.
	 */
	constructor(request) {
		this._model = request.model;
		this._source = /** @type {DistantSunCacheSource} */ (/** @type {unknown} */ (request.model.lightSource));
		this._backend = request.backend;
		this._scheduler = request.scheduler;
		this._executor = new CacheGpuExecutor({
			backend: this._backend,
			assembler: new CachePassAssembler(),
		});
	}

	/**
	 * Active value.
	 *
	 *  @returns {DistantSunCache | null} - The atomically published active cache.
	 */
	get active() {
		return this._active;
	}

	/**
	 * Call this method to derive the exact selected N1, N2, or N4 source-owned
	 * build graph without executing it.
	 *
	 * @returns {CacheBuildPlan} - The source-owned cache build plan.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	createBuildPlan() {
		const profile = this._model.profile;
		const geometry = /** @type {DistantSunCacheControllerPlanRequestN4['geometry']} */ (
			/** @type {unknown} */ (this._model.geometry)
		);
		const atmosphere = /** @type {DistantSunCacheControllerPlanRequestN4['atmosphere']} */ (
			/** @type {unknown} */ (this._model.atmosphere)
		);
		const groundBoundary = /** @type {(GroundBoundary & CacheBuildContributor) | null} */ (
			this._model.groundBoundary
		);
		const maximumScatteringOrder = profile.numerical.cacheConstruction.maximumScatteringOrder;
		const domains = DistantSunConstructionDomainSelection.fromProfile(profile);
		/** @type {CacheFieldStorage} */
		const scatteringStorage = {
			format: 'R32F',
			width: domains.outgoingDirectionCount,
			height: domains.positionCount,
			layers: domains.spectralChannelCount,
		};
		/** @type {CacheFieldStorage} */
		const radianceStorage = {
			format: 'R32F',
			width: domains.incomingDirectionCount,
			height: domains.positionCount,
			layers: domains.spectralChannelCount,
		};
		/** @type {DistantSunCacheFieldDomains} */
		const fieldDomains = {
			scattering: scatteringStorage,
			radiance: radianceStorage,
		};
		const options = {
			transportIntervalCount: profile.numerical.cacheConstruction.transportIntervalCount,
			maximumScatteringOrder,
		};
		const primaryScatteringDensity = this._createPureScatteringField(1, fieldDomains);
		const fields = [primaryScatteringDensity];
		const passes = [];
		const operations = new CacheOperations();
		const integratedTransport = new IntegratedCacheTransport();
		const primaryContext = this._createPassContext('primary-j1', 1, [], primaryScatteringDensity, options, domains);

		const primaryPass = this._createPass({
			id: 'distant-sun-primary-j1',
			context: primaryContext,
			contributors: [geometry, atmosphere, this._source],
		});
		passes.push(primaryPass);

		/** @type {CacheFieldSpec} */
		let cumulative;
		if (maximumScatteringOrder === 1) {
			cumulative = this._createCumulativeScatteringField(1, fieldDomains);
			fields.push(cumulative);
			passes.push(
				this._createPass({
					id: 'distant-sun-accumulate-j1',
					context: this._createPassContext(
						'accumulate',
						1,
						[primaryScatteringDensity],
						cumulative,
						options,
						domains,
					),
					contributors: [operations],
				}),
			);
		} else {
			const primaryRadiance = this._createPureRadianceField(1, fieldDomains);
			const secondOrderScatteringDensity = this._createPureScatteringField(2, fieldDomains);
			const cumulativeThrough2 = this._createCumulativeScatteringField(2, fieldDomains);
			fields.push(primaryRadiance, secondOrderScatteringDensity, cumulativeThrough2);
			passes.push(
				this._createPass({
					id: 'distant-sun-direct-l1',
					context: this._createPassContext('direct-l1', 1, [], primaryRadiance, options, domains),
					contributors: [geometry, atmosphere, this._source],
				}),
			);
			passes.push(
				this._createPass({
					id: 'distant-sun-scatter-l1-to-j2',
					context: this._createPassContext(
						'scatter',
						2,
						[primaryRadiance],
						secondOrderScatteringDensity,
						options,
						domains,
						undefined,
						groundBoundary === null ? undefined : {kind: 'direct-source'},
					),
					contributors: [geometry, atmosphere, this._source, operations],
					includeGround: true,
					groundBoundary,
				}),
			);
			passes.push(
				this._createPass({
					id: 'distant-sun-accumulate-j1-j2',
					context: this._createPassContext(
						'accumulate',
						2,
						[primaryScatteringDensity, secondOrderScatteringDensity],
						cumulativeThrough2,
						options,
						domains,
					),
					contributors: [operations],
				}),
			);

			if (maximumScatteringOrder === 2) {
				cumulative = cumulativeThrough2;
			} else {
				const pureRadianceByOrder = [primaryRadiance];
				let previousScatteringDensity = secondOrderScatteringDensity;
				let previousCumulative = cumulativeThrough2;

				for (let scatteringOrder = 3; scatteringOrder <= maximumScatteringOrder; scatteringOrder += 1) {
					const transportedOrder = /** @type {2 | 3 | 4} */ (scatteringOrder - 1);
					const acceptedScatteringOrder = /** @type {3 | 4 | 5} */ (scatteringOrder);
					const transportedRadiance = this._createPureRadianceField(transportedOrder, fieldDomains);
					const scatteringDensity = this._createPureScatteringField(acceptedScatteringOrder, fieldDomains);
					const cumulativeThroughOrder = this._createCumulativeScatteringField(
						acceptedScatteringOrder,
						fieldDomains,
					);
					const groundIllumination = pureRadianceByOrder[scatteringOrder - 3];

					fields.push(transportedRadiance, scatteringDensity, cumulativeThroughOrder);
					passes.push(
						this._createPass({
							id: `distant-sun-transport-j${transportedOrder}-to-l${transportedOrder}`,
							context: this._createPassContext(
								'transport',
								transportedOrder,
								[previousScatteringDensity],
								transportedRadiance,
								options,
								domains,
							),
							contributors: [geometry, atmosphere, this._source, integratedTransport],
						}),
					);
					passes.push(
						this._createPass({
							id: `distant-sun-scatter-l${transportedOrder}-to-j${acceptedScatteringOrder}`,
							context: this._createPassContext(
								'scatter',
								acceptedScatteringOrder,
								groundBoundary === null
									? [transportedRadiance]
									: [transportedRadiance, groundIllumination],
								scatteringDensity,
								options,
								domains,
								undefined,
								groundBoundary === null
									? undefined
									: {kind: 'pure-radiance', illumination: groundIllumination},
							),
							contributors: [geometry, atmosphere, this._source, operations],
							includeGround: true,
							groundBoundary,
						}),
					);
					passes.push(
						this._createPass({
							id: `distant-sun-accumulate-j-through-${transportedOrder}-j${acceptedScatteringOrder}`,
							context: this._createPassContext(
								'accumulate',
								acceptedScatteringOrder,
								[previousCumulative, scatteringDensity],
								cumulativeThroughOrder,
								options,
								domains,
							),
							contributors: [operations],
						}),
					);

					pureRadianceByOrder.push(transportedRadiance);
					previousScatteringDensity = scatteringDensity;
					previousCumulative = cumulativeThroughOrder;
				}
				cumulative = previousCumulative;
			}
		}

		const identity = CacheValues.createPlanIdentity(
			'algorithm32-distant-sun-cache-construction-v1',
			fields,
			passes,
			{
				domainSelectionId: domains.id,
				positionDomainId: domains.positionDomain.id,
				incomingDirectionDomainId: domains.incomingDirectionDomain.id,
				outgoingDirectionDomainId: domains.outgoingDirectionDomain.id,
				groundBoundaryId: groundBoundary?.id ?? null,
				observation: geometry.configuration.observation,
				resolvedPlacement: geometry.configuration.directionToSource,
			},
		);
		const plan = /** @type {CacheBuildPlan} */ ({
			identity,
			fields,
			passes,
			result: cumulative.id,
		});

		return plan;
	}

	/**
	 * Called by distant sun cache controller to require one generation to remain the live controller request.
	 * @param generation - The generation value accepted by the operation.
	 * @param cancellation - The cancellation value accepted by the operation.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_requireCurrentGeneration(generation, cancellation) {
		if (this._disposed || cancellation.signal.aborted || generation !== this._generation) {
			throw this._createAbortError('Distant-Sun cache construction was cancelled or superseded.');
		}
	}

	/**
	 * Called by distant sun cache controller to build, reuse, or atomically publish one accepted generation. Cancellation or supersession rejects with an abort error; execution failure rejects while preserving the prior cache.
	 * @param generation - The generation value accepted by the operation.
	 * @param request - The request accepted by the operation.
	 * @param cancellation - The cancellation value accepted by the operation.
	 * @returns - A promise for the completed operation result.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	async _executeGeneration(generation, request, cancellation) {
		this._requireCurrentGeneration(generation, cancellation);
		const plan = this.createBuildPlan();
		const reuseKey = this._createReuseKey(plan, this._backend.capabilities);
		this._requireCurrentGeneration(generation, cancellation);

		if (this._active !== null && this._activeReuseKey === reuseKey) {
			return this._active;
		}

		const artifact = await this._executor.execute(plan, {
			scheduler: this._scheduler,
			signal: cancellation.signal,
		});
		try {
			this._requireCurrentGeneration(generation, cancellation);
		} catch (error) {
			artifact.dispose();
			throw error;
		}

		const cache = new DistantSunCache(artifact);
		const previous = this._active;
		this._active = cache;
		this._activeReuseKey = reuseKey;
		previous?.dispose();
		return cache;
	}

	/**
	 * Call this method to construct or reuse one complete cumulative scattering cache. Newer calls supersede older generations. Execution remains serialized so the controller-owned executor never runs two staging graphs concurrently.
	 *
	 * @param {ScatteringCacheBuildRequest} request - Supplies accepted physical
	 * owners and the requested maximum scattering order.
	 * @returns {Promise<DistantSunCache>} - The cache that became active.
	 */
	createScatteringCache(request) {
		if (this._disposed) {
			return Promise.reject(new Error('DistantSunCacheController is disposed.'));
		}

		let accepted;
		try {
			accepted = this._acceptBuildRequest(request);
		} catch (error) {
			return Promise.reject(error);
		}

		const generation = this._generation + 1;
		this._generation = generation;
		this._latestCancellation?.abort();
		const cancellation = new AbortController();
		this._latestCancellation = cancellation;
		const unlinkCancellation = this._linkCancellation(accepted.signal, cancellation);
		const predecessor = this._tail;
		const operation = predecessor.then(
			/**
			 * Called by the promise continuation to handle one callback invocation.
			 * @returns - The callback result returned to its caller.
			 */ () => this._executeGeneration(generation, accepted, cancellation),
		);
		this._tail = operation.then(
			/** Called by the promise continuation to handle one callback invocation. */ () => {},
			/** Called by the promise continuation to handle one callback invocation. */ () => {},
		);

		return operation.finally(
			/** Called by the surrounding operation to handle one callback invocation. */ () => {
				unlinkCancellation();
				if (this._latestCancellation === cancellation) {
					this._latestCancellation = null;
				}
			},
		);
	}

	/** Call this method to cancel staging and release the active cache without owning the backend. */
	dispose() {
		if (this._disposed) {
			return;
		}
		this._disposed = true;
		this._generation += 1;
		this._latestCancellation?.abort();
		this._latestCancellation = null;
		this._executor.dispose();
		this._active?.dispose();
		this._active = null;
		this._activeReuseKey = null;
	}
}
