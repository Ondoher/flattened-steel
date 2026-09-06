import {GpuFieldExecutor} from '../../../gpu-cache-runtime/GpuFieldExecutor.js';
import {CanonicalValueHash} from '../../../value-identity/CanonicalValueHash.js';
import {CacheBuildModules} from '../../../shader-assembly/cache-pass/CacheBuildModules.js';
import {CachePassAssembler} from '../../../shader-assembly/cache-pass/CachePassAssembler.js';
import {DISTANT_SUN_CELESTIAL_CACHE_VALUE_KEY} from '../../../celestial-contribution-cache/consts.js';
import {DistantSunCelestialCpuCache} from './DistantSunCelestialCpuCache.js';
import {
	DISTANT_SUN_CELESTIAL_FIELD_ID,
	DISTANT_SUN_CELESTIAL_PASS_ID,
	DISTANT_SUN_CELESTIAL_STORAGE,
} from './consts.js';

/** Stateless trusted-plan and GPU execution owner for the spherical distant-Sun field. */
export class DistantSunCelestialGpuBuilder {
	/** @type {SharedModel} */
	_model;
	/** @type {DistantSunCelestialLogicalCacheSource & DistantSunCelestialCacheModuleContributor} */
	_source;
	/** @type {CacheGpuBackend} */
	_backend;
	/** @type {WeakMap<DistantSunCelestialCachePlan, DistantSunCelestialCpuCacheContract>} */
	_cpuReferences = new WeakMap();

	/**
	 * Create one builder over exact configured owners and an external backend.
	 *
	 * @param {DistantSunCelestialGpuBuilderConfiguration} request - Model, source, and backend owners.
	 */
	constructor(request) {
		if (request === null || typeof request !== 'object') {
			throw new TypeError('DistantSunCelestialGpuBuilder configuration is required.');
		}
		this._model = request.model;
		this._source = request.source;
		this._backend = request.backend;
		this._requireOwners();
		this._requireBackendCapabilities();
	}

	/** Require exact feature owners before deriving executable work. */
	_requireOwners() {
		const roster = this._model?.celestialSources;
		if (
			!Object.is(this._model?.lightSource, this._source) ||
			roster?.family !== 'spherical-sun-stars-radial-v1' ||
			!Object.is(roster.sun, this._source)
		) {
			throw new RangeError('Distant-Sun celestial GPU source must be the configured atmospheric and roster Sun.');
		}
		const geometry = /** @type {Partial<DistantSunCelestialCacheModuleContributor>} */ (this._model.geometry);
		const atmosphere = /** @type {Partial<DistantSunCelestialCacheModuleContributor>} */ (this._model.atmosphere);
		if (typeof geometry.createDistantSunCelestialCacheModule !== 'function') {
			throw new TypeError('Distant-Sun celestial GPU geometry module contributor is required.');
		}
		if (typeof atmosphere.createDistantSunCelestialCacheModule !== 'function') {
			throw new TypeError('Distant-Sun celestial GPU atmosphere module contributor is required.');
		}
		if (typeof this._source.createDistantSunCelestialCacheModule !== 'function') {
			throw new TypeError('Distant-Sun celestial GPU source module contributor is required.');
		}
	}

	/** Require the exact WebGL-class field capabilities selected by Step 5. */
	_requireBackendCapabilities() {
		const capabilities = this._backend?.capabilities;
		if (
			capabilities?.scalarFormat !== 'R32F' ||
			capabilities.supportsArrayRenderTargets !== true ||
			capabilities.supportsFloatSampling !== true ||
			capabilities.maximumTextureSize <
				Math.max(DISTANT_SUN_CELESTIAL_STORAGE.width, DISTANT_SUN_CELESTIAL_STORAGE.height) ||
			capabilities.maximumArrayLayers < DISTANT_SUN_CELESTIAL_STORAGE.layers
		) {
			throw new RangeError('Distant-Sun celestial GPU backend does not support the exact R32F array field.');
		}
	}

	/**
	 * Create the cache-owned output-layout module for the sole field pass.
	 *
	 * @param {DistantSunCelestialCacheModuleContext} context - Exact construction context.
	 * @returns {CacheBuildModule} - Layout and numerical-control module.
	 */
	_createLayoutModule(context) {
		return CacheBuildModules.createBuildModule({
			id: 'algorithm32-distant-sun-celestial-layout-module-v1',
			owner: 'cache',
			provides: ['cache.outputLayout', 'cache.sourcePathNumerics'],
			requires: [],
			blocks: [],
			bindings: [
				{
					spec: {
						id: 'distant-sun-celestial-source-path-interval-count',
						name: 'CACHE_SOURCE_PATH_INTERVAL_COUNT',
						kind: 'define',
						shaderType: 'int',
						frequency: 'build',
					},
					value: context.sourcePathIntervalCount,
				},
			],
		});
	}

	/**
	 * Validate one plan request against its configured query authority.
	 *
	 * @param {DistantSunCelestialCachePlanRequest} request - Placement and query facts.
	 * @returns {void} - No return value.
	 */
	_validatePlanRequest(request) {
		if (
			request?.query?.family !== 'spherical-sun-stars-radial-v1' ||
			request.placement?.kind !== 'distant-uniform-sun' ||
			request.placement.sourceId !== this._source.id ||
			request.query.sun.placement.sourceId !== request.placement.sourceId ||
			request.query.sun.placement.kind !== request.placement.kind ||
			request.query.sun.placement.directionToSource.some(
				(value, index) => value !== request.placement.directionToSource[index],
			)
		) {
			throw new RangeError('Distant-Sun celestial GPU request does not match its spherical query packet.');
		}
	}

	/**
	 * Derive one trusted one-field, one-pass distant-Sun GPU plan.
	 *
	 * @param {DistantSunCelestialCachePlanRequest} request - Placement and immutable query facts.
	 * @returns {DistantSunCelestialCachePlan} - Complete executable plan.
	 */
	createBuildPlan(request) {
		this._validatePlanRequest(request);
		const geometry =
			/** @type {GeometryModel & CelestialGeometryCapability & DistantSunCelestialCacheModuleContributor} */ (
				this._model.geometry
			);
		const atmosphere = /** @type {AtmosphereModel & DistantSunCelestialCacheModuleContributor} */ (
			this._model.atmosphere
		);
		const domain = geometry.describeCelestialContributionDomain();
		if (request.query.domainIdentity !== domain.contentHash) {
			throw new RangeError('Distant-Sun celestial GPU query domain does not match geometry.');
		}
		const cpuReference = new DistantSunCelestialCpuCache({
			model: this._model,
			domain,
			placement: request.placement,
			source: this._source,
		});
		const output = /** @type {DistantSunCelestialGpuFieldSpec} */ ({
			id: DISTANT_SUN_CELESTIAL_FIELD_ID,
			storage: DISTANT_SUN_CELESTIAL_STORAGE,
		});
		const context = {
			domain,
			placement: request.placement,
			supportMask: cpuReference.supportMask,
			output,
			sourcePathIntervalCount: this._model.profile.numerical.sourcePathTransmittance.intervalCount,
		};
		const modules = [
			this._createLayoutModule(context),
			geometry.createDistantSunCelestialCacheModule(context),
			atmosphere.createDistantSunCelestialCacheModule(context),
			this._source.createDistantSunCelestialCacheModule(context),
		];
		const execution = /** @type {DistantSunCelestialGpuExecutionPlan} */ ({
			fields: [output],
			passes: [{id: DISTANT_SUN_CELESTIAL_PASS_ID, inputs: [], output: DISTANT_SUN_CELESTIAL_FIELD_ID, modules}],
			result: DISTANT_SUN_CELESTIAL_FIELD_ID,
			valueKey: DISTANT_SUN_CELESTIAL_CACHE_VALUE_KEY,
		});
		const descriptorFacts = {
			id: 'algorithm32-distant-sun-celestial-cache-v1',
			logicalField: cpuReference.description,
			storage: DISTANT_SUN_CELESTIAL_STORAGE,
			valueKey: DISTANT_SUN_CELESTIAL_CACHE_VALUE_KEY,
		};
		const descriptor = /** @type {DistantSunCelestialCacheDescriptor} */ ({
			...descriptorFacts,
			contentHash: CanonicalValueHash.sha256Value(descriptorFacts),
		});
		const identityFacts = {
			kind: 'algorithm32-distant-sun-celestial-gpu-plan-v1',
			descriptor: descriptor.contentHash,
			supportMask: cpuReference.supportMask.contentHash,
			modules: modules.map(({id, contentHash}) => ({id, contentHash})),
			execution: {
				fields: execution.fields,
				passes: execution.passes.map(({id, inputs, output: passOutput}) => ({id, inputs, output: passOutput})),
				result: execution.result,
				valueKey: execution.valueKey,
			},
			backendCapabilities: this._backend.capabilities,
		};
		const plan = /** @type {DistantSunCelestialCachePlan} */ ({
			identity: {
				id: 'algorithm32-distant-sun-celestial-gpu-plan-v1',
				contentHash: CanonicalValueHash.sha256Value(identityFacts),
			},
			domain,
			supportMask: cpuReference.supportMask,
			descriptor,
			execution,
		});
		this._cpuReferences.set(plan, cpuReference);
		return plan;
	}

	/**
	 * Execute one builder-created plan without retaining controller lifecycle state.
	 *
	 * @param {DistantSunCelestialCachePlan} plan - Trusted plan from this builder.
	 * @param {DistantSunCelestialGpuExecutionOptions} [options] - Cancellation, scheduling, and bounded probes.
	 * @returns {Promise<DistantSunCelestialGpuBuildResult>} - Resident field and its CPU oracle.
	 */
	async execute(plan, options = {}) {
		const cpuReference = this._cpuReferences.get(plan);
		if (!cpuReference) {
			throw new TypeError('Distant-Sun celestial GPU execution requires a plan created by this builder.');
		}
		const probeCoordinates = options.probeCoordinates ?? [];
		const probes =
			probeCoordinates.length === 0
				? undefined
				: [
						{
							field: DISTANT_SUN_CELESTIAL_FIELD_ID,
							coordinates: probeCoordinates.map(({directionIndex, receiverIndex, wavelengthIndex}) => ({
								directionIndex,
								positionIndex: receiverIndex,
								wavelengthIndex,
							})),
						},
					];
		const executor = new GpuFieldExecutor({backend: this._backend, assembler: new CachePassAssembler()});
		try {
			const artifact = await executor.execute(plan.execution, {
				signal: options.signal,
				scheduler: options.scheduler,
				probeReader: options.probeReader,
				probes,
			});
			return {plan, cpuReference, artifact};
		} finally {
			executor.dispose();
		}
	}
}
