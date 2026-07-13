import {FLAT_FINITE_SUN_CACHE_VALUE_KEY} from '../../../celestial-contribution-cache/consts.js';
import {GpuFieldExecutor} from '../../../gpu-cache-runtime/GpuFieldExecutor.js';
import {CachePassAssembler} from '../../../shader-assembly/cache-pass/CachePassAssembler.js';
import {CanonicalValueHash} from '../../../value-identity/CanonicalValueHash.js';
import {FLAT_FINITE_SUN_FIELD_ID, FLAT_FINITE_SUN_PASS_ID, FLAT_FINITE_SUN_STORAGE} from './consts.js';

/** Stateless trusted-plan and GPU execution owner for the Flat finite-Sun field. */
export class FlatFiniteSunGpuBuilder {
	/** @type {SharedModel} */
	_model;
	/** @type {FiniteLocalSunCelestialSource & CelestialSourceProvider & FlatFiniteSunCacheModuleContributor} */
	_source;
	/** @type {CacheGpuBackend} */
	_backend;
	/** @type {WeakSet<FlatFiniteSunCachePlan>} */
	_plans = new WeakSet();

	/**
	 * Creates one builder over exact configured owners and an external backend.
	 *
	 * @param {FlatFiniteSunGpuBuilderConfiguration} request - Model, source, and backend owners.
	 */
	constructor(request) {
		this._model = request.model;
		this._source =
			/** @type {FiniteLocalSunCelestialSource & CelestialSourceProvider & FlatFiniteSunCacheModuleContributor} */ (
				/** @type {unknown} */ (request.model.lightSource)
			);
		this._backend = request.backend;
		const roster = request.model.celestialSources;
		if (
			roster?.family !== 'flat-local-finite-sun-v1' ||
			!Object.is(roster.localSun, this._source) ||
			!Object.is(request.model.lightSource, this._source)
		) {
			throw new RangeError('Flat finite-Sun GPU source must be the configured atmospheric and roster Sun.');
		}
		if (typeof this._source.createFlatFiniteSunCacheModule !== 'function') {
			throw new TypeError('Flat finite-Sun source cache module contributor is required.');
		}
		const capabilities = this._backend?.capabilities;
		if (
			capabilities?.scalarFormat !== 'R32F' ||
			capabilities.supportsArrayRenderTargets !== true ||
			capabilities.supportsFloatSampling !== true ||
			capabilities.maximumArrayLayers < FLAT_FINITE_SUN_STORAGE.layers
		) {
			throw new RangeError('Flat finite-Sun GPU backend does not support the exact R32F array field.');
		}
	}

	/**
	 * Call this method to derive the trusted one-field source-radiance plan.
	 *
	 * @returns {FlatFiniteSunCachePlan} - Complete executable plan.
	 */
	createBuildPlan() {
		const domain = /** @type {GeometryModel & CelestialGeometryCapability} */ (
			this._model.geometry
		).describeCelestialContributionDomain();
		const output = /** @type {GpuFieldSpec} */ ({
			id: FLAT_FINITE_SUN_FIELD_ID,
			storage: FLAT_FINITE_SUN_STORAGE,
		});
		const context = /** @type {FlatFiniteSunCacheModuleContext} */ ({output});
		const modules = [this._source.createFlatFiniteSunCacheModule(context)];
		const execution = /** @type {GpuFieldExecutionPlan} */ ({
			fields: [output],
			passes: [{id: FLAT_FINITE_SUN_PASS_ID, inputs: [], output: output.id, modules}],
			result: output.id,
			valueKey: FLAT_FINITE_SUN_CACHE_VALUE_KEY,
		});
		const descriptor = /** @type {FlatFiniteSunCacheDescriptor} */ ({
			sourceId: this._source.id,
			domainIdentity: domain.contentHash,
			storage: FLAT_FINITE_SUN_STORAGE,
			channelCount: 15,
			quantity: 'spectral-radiance-density',
			units: 'W m^-2 sr^-1 nm^-1',
			valueKey: FLAT_FINITE_SUN_CACHE_VALUE_KEY,
		});
		const identityFacts = {
			kind: 'algorithm32-flat-finite-sun-gpu-plan-v1',
			descriptor,
			source: this._source.describeCelestialSourceIdentity().definitionHash,
			modules: modules.map(({id, contentHash}) => ({id, contentHash})),
			backendCapabilities: this._backend.capabilities,
		};
		const plan = /** @type {FlatFiniteSunCachePlan} */ ({
			identity: {
				id: 'algorithm32-flat-finite-sun-gpu-plan-v1',
				contentHash: CanonicalValueHash.sha256Value(identityFacts),
			},
			sourceId: this._source.id,
			domain,
			descriptor,
			execution,
		});
		this._plans.add(plan);
		return plan;
	}

	/**
	 * Call this method to execute one builder-created plan.
	 *
	 * @param {FlatFiniteSunCachePlan} plan - Trusted plan from this builder.
	 * @param {FlatFiniteSunGpuExecutionOptions} [options] - Cancellation and scheduling.
	 * @returns {Promise<GpuFieldArtifact>} - Completed resident field artifact.
	 */
	async execute(plan, options = {}) {
		if (!this._plans.has(plan)) {
			throw new TypeError('Flat finite-Sun execution requires a plan created by this builder.');
		}
		const executor = new GpuFieldExecutor({backend: this._backend, assembler: new CachePassAssembler()});
		try {
			return await executor.execute(plan.execution, {
				signal: options.signal,
				scheduler: options.scheduler,
			});
		} finally {
			executor.dispose();
		}
	}
}
