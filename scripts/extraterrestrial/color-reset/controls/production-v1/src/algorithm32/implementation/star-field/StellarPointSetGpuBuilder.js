import {STELLAR_POINT_SET_CACHE_VALUE_KEY} from '../../celestial-contribution-cache/consts.js';
import {CacheValues} from '../../gpu-cache-runtime/CacheValues.js';
import {GpuFieldExecutor} from '../../gpu-cache-runtime/GpuFieldExecutor.js';
import {CacheBuildModules} from '../../shader-assembly/cache-pass/CacheBuildModules.js';
import {CachePassAssembler} from '../../shader-assembly/cache-pass/CachePassAssembler.js';
import {CanonicalValueHash} from '../../value-identity/CanonicalValueHash.js';
import {StellarPointSetCpuCache} from './StellarPointSetCpuCache.js';
import {STELLAR_POINT_SET_CACHE_LAYOUT} from './consts.js';

/** Stateless stellar CPU-field packing and GPU copy owner. */
export class StellarPointSetGpuBuilder {
	constructor({model, source, backend}) {
		this._model = model;
		this._source = source;
		this._backend = backend;
		this._cpuReferences = new WeakMap();
		const storage = STELLAR_POINT_SET_CACHE_LAYOUT.storage;
		const capabilities = backend?.capabilities;
		if (capabilities?.scalarFormat !== 'R32F' || capabilities.supportsArrayRenderTargets !== true || capabilities.supportsFloatSampling !== true || capabilities.maximumTextureSize < Math.max(storage.width, storage.height) || capabilities.maximumArrayLayers < storage.layers) {
			throw new RangeError('Stellar point-set GPU backend does not support the exact R32F array field.');
		}
	}

	createBuildPlan({placement, query}) {
		if (query?.family !== 'spherical-sun-stars-radial-v1' || query.stars?.placement.sourceId !== this._source.id || placement?.sourceId !== this._source.id || placement.kind !== 'static-stellar-point-set') {
			throw new RangeError('Stellar point-set GPU request does not match its spherical query packet.');
		}
		const domain = this._model.geometry.describeCelestialContributionDomain();
		if (query.domainIdentity !== domain.contentHash) throw new RangeError('Stellar point-set GPU query domain does not match geometry.');
		const cpuReference = new StellarPointSetCpuCache({model: this._model, domain, placement, source: this._source});
		const storage = STELLAR_POINT_SET_CACHE_LAYOUT.storage;
		const output = {id: 'stellar-point-set-tiled-transport', storage};
		// The descriptor already identifies every source packet, atmosphere owner,
		// domain node, equation input, and layout fact. Retain the binary32 payload
		// directly instead of expanding and hashing 1,098,240 scalars in JavaScript.
		const packedValues = cpuReference.packedValues();
		for (const [memberIndex, direction] of query.stars.placement.memberDirections.entries()) {
			const x = memberIndex % storage.width;
			const y = STELLAR_POINT_SET_CACHE_LAYOUT.directionTableRowStart + Math.floor(memberIndex / storage.width);
			for (let componentIndex = 0; componentIndex < 3; componentIndex += 1) {
				packedValues[(componentIndex * storage.height + y) * storage.width + x] = direction[componentIndex];
			}
		}
		const packed = /** @type {CacheData} */ ({
			id: 'algorithm32-stellar-point-set-tiled-packed-field-v1',
			quantity: 'spectral-irradiance-density',
			units: 'W m^-2 nm^-1',
			shape: [storage.width, storage.height, storage.layers],
			values: packedValues,
			contentHash: CanonicalValueHash.sha256Value({descriptor: cpuReference.descriptor.contentHash, query: query.contentHash, directionTable: 'two-row-r32f-v1'}),
		});
		const module = CacheBuildModules.createBuildModule({
			id: 'algorithm32-stellar-point-set-r32f-copy-module-v1', owner: 'cache',
			provides: ['cache.stellarPointSetTransport'], requires: [],
			bindings: [{spec: {id: 'stellar-point-set-packed-field', name: 'uStellarPointSetPackedField', kind: 'data', shaderType: 'sampler2DArray', frequency: 'build'}, value: packed}],
			blocks: [{id: 'stellar-point-set-r32f-copy-main', phase: 'main', order: 0, source: 'a32CacheOutput = texelFetch(uStellarPointSetPackedField, ivec3(int(gl_FragCoord.x), int(gl_FragCoord.y), a32CacheWavelengthLayer), 0).r;'}],
		});
		const pass = {id: 'stellar-point-set-r32f-copy', kind: /** @type {const} */ ('direct-l1'), order: /** @type {const} */ (1), inputs: [], output: output.id, modules: [module]};
		const execution = {fields: [output], passes: [pass], result: output.id, valueKey: STELLAR_POINT_SET_CACHE_VALUE_KEY};
		const plan = {
			identity: CacheValues.createPlanIdentity('algorithm32-stellar-point-set-tiled-r32f-plan-v1', [output], [pass], {descriptor: cpuReference.descriptor.contentHash, query: query.contentHash}),
			sourceId: this._source.id, domain, memberCount: STELLAR_POINT_SET_CACHE_LAYOUT.memberCount,
			descriptor: cpuReference.descriptor, execution,
		};
		this._cpuReferences.set(plan, cpuReference);
		return plan;
	}

	async execute(plan, options = {}) {
		const cpuReference = this._cpuReferences.get(plan);
		if (!cpuReference) throw new TypeError('Stellar point-set GPU execution requires a builder-created plan.');
		const executor = new GpuFieldExecutor({backend: this._backend, assembler: new CachePassAssembler()});
		try {
			const artifact = await executor.execute(plan.execution, {signal: options.signal, scheduler: options.scheduler, probeReader: options.probeReader, probes: options.probes});
			return {plan, cpuReference, artifact};
		} finally {
			executor.dispose();
		}
	}
}
