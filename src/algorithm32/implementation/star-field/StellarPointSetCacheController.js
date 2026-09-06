import {StellarPointSetCacheResource} from './StellarPointSetCacheResource.js';
import {StellarPointSetGpuBuilder} from './StellarPointSetGpuBuilder.js';

/** Transactional controller for one tiled stellar point-set GPU resource. */
export class StellarPointSetCacheController {
	constructor({model, backend, scheduler}) {
		this._model = model;
		this._source = model.celestialSources?.stars;
		this._scheduler = scheduler;
		this._builder = new StellarPointSetGpuBuilder({model, source: this._source, backend});
		this._active = null;
		this._activeReuseKey = null;
		this._tail = Promise.resolve();
		this._latestCancellation = null;
		this._generation = 0;
		this._disposed = false;
	}

	get active() {
		return this._active;
	}

	_createAbortError(message) {
		const error = new Error(message);
		error.name = 'AbortError';
		return error;
	}

	_requireCurrent(generation, cancellation) {
		if (this._disposed || cancellation.signal.aborted || generation !== this._generation)
			throw this._createAbortError('Stellar point-set cache construction was cancelled or superseded.');
	}

	_linkCancellation(signal, controller) {
		if (!signal) return () => {};
		const abort = () => controller.abort();
		signal.addEventListener('abort', abort, {once: true});
		return () => signal.removeEventListener('abort', abort);
	}

	async _executeGeneration(generation, request, cancellation) {
		this._requireCurrent(generation, cancellation);
		const plan = this._builder.createBuildPlan(request);
		this._requireCurrent(generation, cancellation);
		if (this._active && this._activeReuseKey === plan.identity.contentHash) return this._active;
		const result = await this._builder.execute(plan, {scheduler: this._scheduler, signal: cancellation.signal});
		try {
			this._requireCurrent(generation, cancellation);
		} catch (error) {
			result.artifact.dispose();
			throw error;
		}
		const next = new StellarPointSetCacheResource({plan, artifact: result.artifact});
		const previous = this._active;
		this._active = next;
		this._activeReuseKey = plan.identity.contentHash;
		previous?.dispose();
		return next;
	}

	build(request) {
		if (this._disposed) return Promise.reject(new Error('StellarPointSetCacheController is disposed.'));
		if (request.signal?.aborted)
			return Promise.reject(this._createAbortError('Stellar point-set cache construction was aborted.'));
		const generation = ++this._generation;
		this._latestCancellation?.abort();
		const cancellation = new AbortController();
		this._latestCancellation = cancellation;
		const unlink = this._linkCancellation(request.signal, cancellation);
		const operation = this._tail.then(() => this._executeGeneration(generation, request, cancellation));
		this._tail = operation.then(
			() => {},
			() => {},
		);
		return operation.finally(() => {
			unlink();
			if (this._latestCancellation === cancellation) this._latestCancellation = null;
		});
	}

	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._generation += 1;
		this._latestCancellation?.abort();
		this._latestCancellation = null;
		this._active?.dispose();
		this._active = null;
		this._activeReuseKey = null;
	}
}
