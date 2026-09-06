import { CacheGpuExecutor } from '../gpu/CacheGpuExecutor.js';
import { CachePassAssembler } from '../gpu/CachePassAssembler.js';
import { FlatFiniteSunGpuCache } from './FlatFiniteSunGpuCache.js';
import { createFlatFiniteSunGpuBuildPlan } from './FlatFiniteSunGpuPlan.js';

/** Publish only complete static-radiance generations for the finite local Sun. */
export class FlatFiniteSunGpuCacheController {
	constructor({ backend, scheduler = undefined }) {
		this._executor = new CacheGpuExecutor({ backend, assembler: new CachePassAssembler() });
		this._scheduler = scheduler;
		this._active = null;
		this._activeIdentity = null;
	}

	async build({ primaryCache, sourceId, probes = undefined, probeReader = undefined }) {
		const plan = createFlatFiniteSunGpuBuildPlan({ primaryCache, sourceId });
		if (this._active && this._activeIdentity === plan.identity.contentHash) return this._active;
		const artifact = await this._executor.execute(plan, { scheduler: this._scheduler, probes, probeReader });
		const fragment = primaryCache.fragments.find((value) => value.sourceId === sourceId);
		const next = new FlatFiniteSunGpuCache({
			artifact, sourceId, generationIdentity: plan.identity.contentHash,
			radiusMeters: fragment.support.radius.value,
			defaultCenterMeters: primaryCache.geometry.configuration.sourcePosition.coordinates,
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

export default FlatFiniteSunGpuCacheController;
