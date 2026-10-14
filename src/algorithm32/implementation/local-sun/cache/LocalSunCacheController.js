import {CanonicalValueHash} from '../../../value-identity/CanonicalValueHash.js';
import {CANONICAL_BLACK_GROUND_CACHE_MODULE_DEFINITION} from '../../../ground-transport/cache/consts.js';
import {CacheOperations} from '../../../atmospheric-transport/cache/CacheOperations.js';
import {IntegratedCacheTransport} from '../../../atmospheric-transport/cache/IntegratedCacheTransport.js';
import {CacheGpuExecutor} from '../../../gpu-cache-runtime/CacheGpuExecutor.js';
import {CachePassAssembler} from '../../../shader-assembly/cache-pass/CachePassAssembler.js';
import {CacheBuildModules} from '../../../shader-assembly/cache-pass/CacheBuildModules.js';
import {CacheValues} from '../../../gpu-cache-runtime/CacheValues.js';
import {LocalSunCache} from './LocalSunCache.js';
import {LocalSunCompactGpuPlan} from './LocalSunCompactGpuPlan.js';
import {LocalSunCompactCache} from './LocalSunCompactCache.js';
import LocalSunConstructionDomainSelection from './LocalSunConstructionDomainSelection.js';
import {assertLocalSunGeometryPairing} from '../local-sun-geometry-pairing.js';
import {LOCAL_SUN_CACHE_PLAN_ID, LOCAL_SUN_CACHE_REUSE_KEY_SCHEMA_REVISION} from './consts.js';

/** Controller for local-Sun GPU cache construction within one runtime attachment. */
export class LocalSunCacheController {
	/** Configured local-Sun cache contributor.
	 *
	 * @type {LocalSunCacheBuildSource}
	 */
	_source;
	/** Aggregate execution model retained for the controller lifetime.
	 *
	 * @type {SharedModel}
	 */
	_model;
	/** Externally owned GPU backend.
	 *
	 * @type {CacheGpuBackend}
	 */
	_backend;
	/** Optional cache-build scheduler.
	 *
	 * @type {CacheBuildScheduler | undefined}
	 */
	_scheduler;
	/** Renderer-neutral cache-plan executor.
	 *
	 * @type {CacheGpuExecutor}
	 */
	_executor;
	/** Atomically published local-Sun cache.
	 *
	 * @type {LocalSunCache | null}
	 */
	_active = null;
	/** Reuse identity of the active cache.
	 *
	 * @type {string | null}
	 */
	_activeReuseKey = null;
	/** Serialized completion tail for controller generations.
	 *
	 * @type {Promise<void>}
	 */
	_tail = Promise.resolve();
	/** Cancellation owner for the latest generation.
	 *
	 * @type {AbortController | null}
	 */
	_latestCancellation = null;
	/** Monotonic controller generation.
	 *
	 * @type {number}
	 */
	_generation = 0;
	/** Controller disposal state.
	 *
	 * @type {boolean}
	 */
	_disposed = false;
	/** Explicit compact successor, absent for existing production selections.
	 *
	 * @type {LocalSunCompactGpuPlan | null}
	 */
	_compactPlan = null;

	/**
	 * Called by LocalSunCacheController to create a pure outgoing Jk field
	 * specification on the selected scattering lattice.
	 *
	 * @param {1 | 2 | 3 | 4 | 5} order - The pure scattering order.
	 * @param {LocalSunCacheFieldDomains} fieldDomains - The executable field shapes.
	 * @returns {CacheFieldSpec} - The field specification.
	 */
	_createPureScatteringField(order, fieldDomains) {
		return {
			id: `local-sun-j${order}`,
			storage: fieldDomains.scattering,
		};
	}

	/**
	 * Called by LocalSunCacheController to create a pure incoming Lk field
	 * specification on the selected radiance lattice.
	 *
	 * @param {1 | 2 | 3 | 4} order - The pure radiance order.
	 * @param {LocalSunCacheFieldDomains} fieldDomains - The executable field shapes.
	 * @returns {CacheFieldSpec} - The field specification.
	 */
	_createPureRadianceField(order, fieldDomains) {
		return {
			id: `local-sun-l${order}`,
			storage: fieldDomains.radiance,
		};
	}

	/**
	 * Called by LocalSunCacheController to create a cumulative J-through-N
	 * field specification on the selected scattering lattice.
	 *
	 * @param {1 | 2 | 3 | 4 | 5} order - The cumulative maximum.
	 * @param {LocalSunCacheFieldDomains} fieldDomains - The executable field shapes.
	 * @returns {CacheFieldSpec} - The field specification.
	 */
	_createCumulativeScatteringField(order, fieldDomains) {
		return {
			id: `local-sun-j-through-${order}`,
			storage: fieldDomains.scattering,
		};
	}

	/**
	 * Called by LocalSunCacheController to create one pass context from
	 * source-owned graph facts. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {CachePassKind} kind - The pass kind.
	 * @param {CacheOrder} order - The scattering order.
	 * @param {readonly CacheFieldSpec[]} inputs - The pure or cumulative inputs.
	 * @param {CacheFieldSpec} output - The logical output.
	 * @param {CacheConstructionOptions} options - The construction options.
	 * @param {CacheConstructionDomains} domains - The executable domains.
	 * @param {LocalSunCachePassOptions} [passOptions] - The pass-specific executable facts.
	 * @returns {CacheBuildContext} - The pass context.
	 */
	_createPassContext(kind, order, inputs, output, options, domains, passOptions = {}) {
		return {
			kind,
			order,
			inputs,
			output,
			options,
			domains,
			...(passOptions.pathIntervalCount === undefined ? {} : {pathIntervalCount: passOptions.pathIntervalCount}),
			...(passOptions.groundReflection === undefined ? {} : {groundReflection: passOptions.groundReflection}),
		};
	}

	/**
	 * Called by LocalSunCacheController to create the source-owned scalar
	 * output-layout module for one pass.
	 *
	 * @param {CacheBuildContext} context - The resolved pass context.
	 * @returns {CacheBuildModule} - The layout module.
	 */
	_createLayoutModule(context) {
		const storage = context.output.storage;
		const integratedTransport = context.kind === 'transport';
		const inputBindingName = integratedTransport
			? CacheBuildModules.fieldInputBindingName(context.inputs[0].id)
			: null;

		return CacheBuildModules.createBuildModule({
			id: `algorithm32-local-sun-${context.output.id}-layout-module-v2`,
			owner: 'cache',
			provides: integratedTransport
				? ['cache.outputLayout', 'cache.storedScatteringDensity']
				: ['cache.outputLayout'],
			requires: [],
			blocks: integratedTransport
				? [
						{
							id: 'local-sun-cache-stored-scattering-density',
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
						id: 'local-sun-cache-direction-count',
						name: 'CACHE_DIRECTION_COUNT',
						kind: 'define',
						shaderType: 'int',
						frequency: 'pass',
					},
					value: storage.width,
				},
				{
					spec: {
						id: 'local-sun-cache-position-count',
						name: 'CACHE_POSITION_COUNT',
						kind: 'define',
						shaderType: 'int',
						frequency: 'pass',
					},
					value: storage.height,
				},
				{
					spec: {
						id: 'local-sun-cache-wavelength-count',
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
	 * Called by LocalSunCacheController to create one pass from only the
	 * concrete owner modules required by that operation.
	 *
	 * @param {LocalSunCachePassDefinition} definition - The pass construction facts.
	 * @returns {CachePass} - The cache pass.
	 */
	_createPass(definition) {
		const modules = definition.contributors.map((contributor) => contributor.createCacheModule(definition.context));

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
			inputs: definition.context.inputs.map((input) => input.id),
			output: definition.context.output.id,
			modules,
		};
	}

	/**
	 * Called by LocalSunCacheController to append one stored-field transport pass.
	 *
	 * @param {CachePass[]} passes - The mutable plan pass sequence.
	 * @param {LocalSunCacheTransportPassRequest} request - The transport facts.
	 * @returns {void} - No value.
	 */
	_addTransportPass(passes, request) {
		passes.push(
			this._createPass({
				id: request.id,
				context: this._createPassContext(
					'transport',
					request.order,
					[request.input],
					request.output,
					request.options,
					request.domains,
				),
				contributors: [request.geometry, request.atmosphere, request.integratedTransport],
			}),
		);
	}

	/**
	 * Called by LocalSunCacheController to append one pure scatter and
	 * cumulative-add pair while preserving ground-reflection inputs.
	 *
	 * @param {CachePass[]} passes - The mutable plan pass sequence.
	 * @param {LocalSunCacheScatterPassRequest} request - The recurrence facts.
	 * @returns {void} - No value.
	 */
	_addScatterAndAccumulatePasses(passes, request) {
		const reflectedInputs =
			request.groundBoundary === null || request.groundIllumination === null
				? [request.previousRadiance]
				: [request.previousRadiance, request.groundIllumination];
		const groundReflection =
			request.groundBoundary === null
				? undefined
				: request.order === 2
					? {kind: /** @type {const} */ ('direct-source')}
					: {
							kind: /** @type {const} */ ('pure-radiance'),
							illumination: /** @type {CacheFieldSpec} */ (request.groundIllumination),
						};

		passes.push(
			this._createPass({
				id: `local-sun-scatter-l${request.order - 1}-to-j${request.order}`,
				context: this._createPassContext(
					'scatter',
					request.order,
					reflectedInputs,
					request.output,
					request.options,
					request.domains,
					{groundReflection},
				),
				contributors: [request.geometry, request.atmosphere, request.source, request.operations],
				includeGround: true,
				groundBoundary: request.groundBoundary,
			}),
		);
		passes.push(
			this._createPass({
				id:
					request.order === 2
						? 'local-sun-add-j1-j2-to-jthrough2'
						: `local-sun-add-jthrough${request.order - 1}` +
							`-j${request.order}-to-jthrough${request.order}`,
				context: this._createPassContext(
					'accumulate',
					request.order,
					[request.previousCumulative, request.output],
					request.cumulative,
					request.options,
					request.domains,
				),
				contributors: [request.operations],
			}),
		);
	}

	/**
	 * Called by LocalSunCacheController reuse checks to derive the complete
	 * controller-local plan and backend identity.
	 *
	 * @param {CacheBuildPlan} plan - The complete source-owned graph.
	 * @param {CacheGpuCapabilities} capabilities - The accepted backend capabilities.
	 * @returns {string} - The deterministic cache reuse key.
	 */
	_createReuseKey(plan, capabilities) {
		return CanonicalValueHash.sha256Value({
			kind: LOCAL_SUN_CACHE_REUSE_KEY_SCHEMA_REVISION,
			plan: plan.identity,
			backendCapabilities: capabilities,
		});
	}

	/**
	 * Called by LocalSunCacheController to create one ordinary cancellation
	 * error without requiring a DOM runtime.
	 *
	 * @param {string} message - The cancellation diagnostic.
	 * @returns {Error} - The abort error.
	 */
	_createAbortError(message) {
		const error = new Error(message);
		error.name = 'AbortError';
		return error;
	}

	/**
	 * Called by LocalSunCacheController to accept semantic values at the
	 * source-owned construction boundary.
	 * An already-aborted signal throws AbortError; abandon that request. Invalid compact
	 * byte accounting throws RangeError; supply nonnegative integral byte units before retrying.
	 *
	 * @param {ScatteringCacheBuildRequest} request - The untrusted construction request.
	 * @returns {LocalSunAcceptedCacheBuildRequest} - The normalized request.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_acceptBuildRequest(request) {
		if (request.signal?.aborted === true) {
			throw this._createAbortError('Local-Sun cache construction was aborted.');
		}
		if (this._compactPlan !== null) {
			let other = request.otherOwnedGpuBytes;
			if (other?.units !== 'bytes' || !Number.isSafeInteger(other.value) || other.value < 0)
				throw new RangeError(
					'Compact construction requires declared other owned GPU bytes, including external frame/old-cache resources.',
				);
			return {...request, otherOwnedGpuBytes: {...other}};
		}

		return request;
	}

	/**
	 * Called by LocalSunCacheController to link caller cancellation to one
	 * controller-owned generation signal. The returned callback removes the listener;
	 * when no caller signal is supplied, it is a no-op.
	 *
	 * @param {AbortSignal | undefined} signal - The optional caller cancellation.
	 * @param {AbortController} controller - The controller-owned cancellation.
	 * @returns {() => void} - The unlink operation.
	 */
	_linkCancellation(signal, controller) {
		if (!signal) {
			return /** Called by link cancellation to handle one invocation of the declared operation. */ () => {};
		}

		/** Cancel the controller-owned build when the caller aborts.
		 *
		 * @returns {void} - Owned cancellation is signalled.
		 */
		const abort = () => controller.abort();
		signal.addEventListener('abort', abort, {once: true});

		return () => signal.removeEventListener('abort', abort);
	}

	/**
	 * Called by LocalSunCacheController to require one generation to remain the
	 * live controller request.
	 * Disposal, cancellation or supersession throws AbortError; discard this generation's result.
	 *
	 * @param {number} generation - The candidate generation.
	 * @param {AbortController} cancellation - The generation cancellation owner.
	 * @returns {void} - No value.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_requireCurrentGeneration(generation, cancellation) {
		if (this._disposed || cancellation.signal.aborted || generation !== this._generation) {
			throw this._createAbortError('Local-Sun cache construction was cancelled or superseded.');
		}
	}

	/**
	 * Call this method to derive the exact selected N1, N2, or N4 source-owned
	 * build graph without executing it.
	 *
	 * @returns {LocalSunCachePlan} - The source-owned cache build plan.
	 */
	createBuildPlan() {
		if (this._compactPlan !== null)
			return {
				...this._compactPlan.createBuildPlan(),
				resources: {packedTransportData: {value: 0, units: 'bytes'}},
			};
		const profile = this._model.profile;
		const geometry = /** @type {LocalSunCacheBuildGeometry} */ (/** @type {unknown} */ (this._model.geometry));
		const atmosphere = /** @type {AtmosphereModel & CacheBuildContributor} */ (this._model.atmosphere);
		const maximumScatteringOrder = profile.numerical.cacheConstruction.maximumScatteringOrder;
		assertLocalSunGeometryPairing(this._source.configuration, geometry.configuration);

		const groundBoundary = /** @type {(GroundBoundary & CacheBuildContributor) | null} */ (
			this._model.groundBoundary
		);
		const domains = LocalSunConstructionDomainSelection.fromProfile(profile);
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
		/** @type {LocalSunCacheFieldDomains} */
		const fieldDomains = {
			scattering: scatteringStorage,
			radiance: radianceStorage,
		};
		const options = {
			transportIntervalCount: profile.numerical.cacheConstruction.transportIntervalCount,
			maximumScatteringOrder,
		};
		const operations = new CacheOperations();
		const integratedTransport = new IntegratedCacheTransport();
		const primaryScatteringDensity = this._createPureScatteringField(1, fieldDomains);
		const fields = [primaryScatteringDensity];
		/** @type {CachePass[]} */
		const passes = [];

		passes.push(
			this._createPass({
				id: 'local-sun-primary-j1',
				context: this._createPassContext('primary-j1', 1, [], primaryScatteringDensity, options, domains),
				contributors: [geometry, atmosphere, this._source],
			}),
		);

		/** @type {CacheFieldSpec} */
		let cumulative;

		if (maximumScatteringOrder === 1) {
			cumulative = this._createCumulativeScatteringField(1, fieldDomains);
			fields.push(cumulative);
			passes.push(
				this._createPass({
					id: 'local-sun-copy-j1-to-jthrough1',
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
					id: 'local-sun-direct-l1',
					context: this._createPassContext('direct-l1', 1, [], primaryRadiance, options, domains, {
						pathIntervalCount: options.transportIntervalCount,
					}),
					contributors: [geometry, atmosphere, this._source],
				}),
			);
			this._addScatterAndAccumulatePasses(passes, {
				order: 2,
				previousRadiance: primaryRadiance,
				groundIllumination: null,
				output: secondOrderScatteringDensity,
				previousCumulative: primaryScatteringDensity,
				cumulative: cumulativeThrough2,
				options,
				domains,
				geometry,
				atmosphere,
				source: this._source,
				operations,
				groundBoundary,
			});

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
					fields.push(transportedRadiance, scatteringDensity, cumulativeThroughOrder);
					this._addTransportPass(passes, {
						id: `local-sun-transport-j${transportedOrder}-to-l${transportedOrder}`,
						order: transportedOrder,
						input: previousScatteringDensity,
						output: transportedRadiance,
						options,
						domains,
						geometry,
						atmosphere,
						integratedTransport,
					});
					this._addScatterAndAccumulatePasses(passes, {
						order: acceptedScatteringOrder,
						previousRadiance: transportedRadiance,
						groundIllumination: pureRadianceByOrder[scatteringOrder - 3],
						output: scatteringDensity,
						previousCumulative,
						cumulative: cumulativeThroughOrder,
						options,
						domains,
						geometry,
						atmosphere,
						source: this._source,
						operations,
						groundBoundary,
					});
					pureRadianceByOrder.push(transportedRadiance);
					previousScatteringDensity = scatteringDensity;
					previousCumulative = cumulativeThroughOrder;
				}
				cumulative = previousCumulative;
			}
		}

		const identity = CacheValues.createPlanIdentity(LOCAL_SUN_CACHE_PLAN_ID, fields, passes, {
			domainSelectionId: domains.id,
			positionDomainId: domains.positionDomain.id,
			incomingDirectionDomainId: domains.incomingDirectionDomain.id,
			outgoingDirectionDomainId: domains.outgoingDirectionDomain.id,
			groundBoundaryId: groundBoundary?.id ?? null,
			observation: geometry.configuration.observation,
			resolvedPlacement: geometry.configuration.sourcePosition,
		});
		return /** @type {LocalSunCachePlan} */ ({
			identity,
			fields,
			passes,
			result: cumulative.id,
			resources: {
				packedTransportData: {
					value: 0,
					units: 'bytes',
				},
			},
		});
	}

	/**
	 * Called by LocalSunCacheController to build, reuse, or atomically publish
	 * one accepted generation. Cancellation or supersession rejects with an
	 * abort error; discard that incomplete generation. Invalid byte accounting rejects with RangeError;
	 * correct its units/value before retrying. Unsupported array/float/texture capabilities reject
	 * with RangeError; select a capable backend. GPU execution, packing or upload failure rejects
	 * while preserving the prior cache; discard the candidate and report the device failure.
	 * Cleanup failure can accompany the original error in AggregateError; report both causes.
	 *
	 * @param {number} generation - The accepted generation.
	 * @param {LocalSunAcceptedCacheBuildRequest} request - The accepted owners.
	 * @param {AbortController} cancellation - The generation cancellation owner.
	 * @returns {Promise<LocalSunCache>} - The published cache.
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
		let compactResources;
		if (this._compactPlan !== null) {
			let other = request.otherOwnedGpuBytes;
			if (other?.units !== 'bytes' || !Number.isSafeInteger(other.value) || other.value < 0)
				throw new RangeError(
					'Compact construction requires declared other owned GPU bytes, including external frame/old-cache resources.',
				);
			let auxiliaryBytes =
				this._compactPlan.geometryShader
					.createBindings()
					.reduce(
						(sum, binding) => sum + /** @type {CacheDataBinding} */ (binding).value.values.length * 4,
						0,
					) +
				this._compactPlan.nodeFactors.values.length * 4;
			auxiliaryBytes += this._compactPlan.profile.domains.topology.positionCount * 4;
			const runtimeDensityBytes =
				this._compactPlan.profile.domains.topology.positionCount *
				this._compactPlan.profile.domains.outgoingDirections.directionCount *
				16 *
				4;
			const oldDensityBytes =
				this._active instanceof LocalSunCompactCache ? this._active.resources.runtimeDensityBytes.value : 0;
			let oldAuxiliary =
				this._active instanceof LocalSunCompactCache ? this._active.resources.retainedAuxiliaryBytes.value : 0;
			let estimate = this._compactPlan.profile.estimateResources({
				retainedScatteringFields: 0,
				otherOwnedGpuBytes: {
					value: other.value + auxiliaryBytes * 2 + oldAuxiliary + oldDensityBytes + runtimeDensityBytes,
					units: 'bytes',
				},
			});
			// This estimate is diagnostic provenance, not a browser admission decision.
			// Actual backend allocation/capability failures still reject the candidate.
			let capabilities = this._backend.capabilities;
			if (
				!capabilities.supportsArrayRenderTargets ||
				!capabilities.supportsFloatSampling ||
				capabilities.scalarFormat !== 'R32F' ||
				capabilities.maximumTextureSize < 4374 ||
				capabilities.maximumArrayLayers < 15
			)
				throw new RangeError(
					'Compact cache requires supported WebGL2 R32F array and auxiliary texture capabilities.',
				);
			compactResources = {
				executor: null,
				admission: estimate,
				retainedAuxiliaryBytes: {value: auxiliaryBytes, units: /** @type {const} */ ('bytes')},
				runtimeDensityBytes: {value: runtimeDensityBytes, units: /** @type {const} */ ('bytes')},
				packingOverlapBytes: {
					value:
						runtimeDensityBytes +
						this._compactPlan.profile.domains.scatteringDensityPacking.scalarCount * 4,
					units: /** @type {const} */ ('bytes'),
				},
				packedTransportData: {value: 0, units: /** @type {const} */ ('bytes')},
			};
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

		let cache;
		try {
			cache =
				this._compactPlan === null
					? new LocalSunCache(artifact, this._source.createResourceReport(plan, artifact.diagnostics))
					: new LocalSunCompactCache(artifact, this._compactPlan, this._backend, {
							...compactResources,
							executor: artifact.diagnostics.memory,
						});
		} catch (error) {
			artifact.dispose();
			throw error;
		}
		const previous = this._active;
		this._active = cache;
		this._activeReuseKey = reuseKey;
		previous?.dispose();

		return cache;
	}

	/**
	 * Creates one per-runtime local-Sun cache controller without taking
	 * ownership of its GPU backend.
	 *
	 * @param {LocalSunCacheControllerConfiguration} request - The construction collaborators.
	 */
	constructor(request) {
		this._model = request.model;
		this._source = request.source;
		this._backend = request.backend;
		this._scheduler = request.scheduler;
		if (request.model?.profile?.compactConstruction !== undefined)
			this._compactPlan = new LocalSunCompactGpuPlan(request.model.profile.compactConstruction);
		this._executor = new CacheGpuExecutor({
			backend: this._backend,
			assembler: new CachePassAssembler(),
		});
	}

	/**
	 * Atomically published active local-Sun cache.
	 *
	 * @returns {LocalSunCache|null} - Current owned cache, or no publication.
	 */
	get active() {
		return this._active;
	}

	/**
	 * Call this method to construct or reuse one complete cumulative scattering
	 * cache. Newer requests supersede older generations; cancellation and
	 * execution failure reject while preserving the last complete cache.
	 * Discard cancelled or superseded requests. Disposed controllers reject; create a live owner.
	 * Invalid byte accounting rejects; correct units and values before retrying. Unsupported GPU
	 * capabilities, construction, packing or upload failures reject; report the failed backend
	 * operation and keep the last complete cache. Cleanup failures also reject; report every cause.
	 *
	 * @param {ScatteringCacheBuildRequest} request - The physical owners and construction options.
	 * @returns {Promise<LocalSunCache>} - The cache that became active.
	 */
	createScatteringCache(request) {
		if (this._disposed) {
			return Promise.reject(new Error('LocalSunCacheController is disposed.'));
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
		const operation = predecessor.then(() => this._executeGeneration(generation, accepted, cancellation));
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

	/**
	 * Call this method to cancel staging and release the active cache without
	 * taking ownership of the GPU backend.
	 *
	 * @returns {void} - No value.
	 */
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
