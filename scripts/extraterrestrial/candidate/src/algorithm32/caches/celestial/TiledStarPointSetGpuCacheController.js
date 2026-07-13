import { CacheGpuExecutor } from '../gpu/CacheGpuExecutor.js';
import { CachePassAssembler } from '../gpu/CachePassAssembler.js';
import { createTiledStarPointSetGpuBuildPlan } from './TiledStarPointSetCache.js';
import { StellarPointSetGpuCache } from './StellarPointSetGpuCache.js';

/** Publish an immutable tiled stellar field only after its R32F build succeeds. */
export class TiledStarPointSetGpuCacheController {
	constructor({ backend, scheduler = undefined }) {
		this._executor = new CacheGpuExecutor({ backend, assembler: new CachePassAssembler() });
		this._scheduler = scheduler;
		this._active = null;
		this._activeIdentity = null;
	}

	get active() { return this._active; }

	async build({ tiledCache, probes = undefined, probeReader = undefined }) {
		const plan = createTiledStarPointSetGpuBuildPlan({ tiledCache });
		if (this._active && this._activeIdentity === plan.identity.contentHash) return this._active;
		const artifact = await this._executor.execute(plan, { scheduler: this._scheduler, probes, probeReader });
		const next = new StellarPointSetGpuCache({ artifact, tiledCache, generationIdentity: plan.identity.contentHash });
		const previous = this._active;
		this._active = next;
		this._activeIdentity = plan.identity.contentHash;
		previous?.dispose();
		return next;
	}

	dispose() { this._executor.dispose(); this._active?.dispose(); this._active = null; this._activeIdentity = null; }
}

export default TiledStarPointSetGpuCacheController;
