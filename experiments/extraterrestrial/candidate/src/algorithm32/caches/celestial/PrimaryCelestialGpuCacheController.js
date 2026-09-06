import { CacheGpuExecutor } from '../gpu/CacheGpuExecutor.js';
import { CachePassAssembler } from '../gpu/CachePassAssembler.js';
import { createPrimaryCelestialGpuBuildPlan } from './PrimaryCelestialGpuPlan.js';
import { PrimaryCelestialGpuCache } from './PrimaryCelestialGpuCache.js';

/** Stage complete celestial fields and publish only successful GPU generations. */
export class PrimaryCelestialGpuCacheController {
	constructor({ backend, scheduler = undefined }) {
		this._backend = backend;
		this._scheduler = scheduler;
		this._executor = new CacheGpuExecutor({ backend, assembler: new CachePassAssembler() });
		this._active = null;
		this._activeIdentity = null;
	}

	get active() { return this._active; }

	async build({ primaryCache, sourceId, probes = undefined, probeReader = undefined }) {
		const plan = createPrimaryCelestialGpuBuildPlan({ primaryCache, sourceId });
		if (this._active && this._activeIdentity === plan.identity.contentHash) return this._active;
		const artifact = await this._executor.execute(plan, { scheduler: this._scheduler, probes, probeReader });
		const fragment = primaryCache.fragments.find((value) => value.sourceId === sourceId);
		const next = new PrimaryCelestialGpuCache({
			artifact,
			sourceId,
			generationIdentity: plan.identity.contentHash,
			angularRadiusRadians: fragment?.support?.angularRadiusRadians,
		});
		const previous = this._active;
		this._active = next;
		this._activeIdentity = plan.identity.contentHash;
		previous?.dispose();
		return next;
	}

	dispose() {
		this._executor.dispose();
		this._active?.dispose();
		this._active = null;
		this._activeIdentity = null;
	}
}

export default PrimaryCelestialGpuCacheController;
