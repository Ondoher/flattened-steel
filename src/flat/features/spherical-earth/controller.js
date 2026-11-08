import {Service} from '@polylith/core';

/**
 * Independent page registration and view-scoped cache preparation workflow.
 *
 * @implements {WorkspacePageController}
 */
export class SphericalEarthController extends Service {
	/**
	 * Creates the spherical page coordinator.
	 *
	 * @param {unknown} registry - Owning application registry.
	 */
	constructor(registry) {
		super('spherical-earth-controller', registry);
		this.sessions = new Map();
		this.implement(['ready', 'stop', 'mount', 'unmount', 'getState', 'retry']);
	}

	/**
	 * Call this method after startup to register the page and observe shared configuration.
	 */
	ready() {
		let mounted = [...this.sessions.keys()];
		this.stop();
		this.model = /** @type {SphericalEarthModelService} */ (this.registry.subscribe('spherical-earth-model'));
		this.view = /** @type {SphericalEarthViewService} */ (this.registry.subscribe('spherical-earth-view'));
		this.cache = /** @type {DistantSunCacheService} */ (this.registry.subscribe('distant-sun-cache'));
		this.configuration = /** @type {ConfigurationService} */ (this.registry.subscribe('configuration'));
		this.listener = this.configuration.listen('changed', () => {
			for (let viewId of this.sessions.keys()) {
				this.retry(viewId);
			}
		});
		/** @type {AppPagesService} */ (this.registry.subscribe('app-pages')).add({
			id: 'spherical-earth',
			label: 'spherical-earth.title',
			urlSlug: 'spherical-earth',
			order: 1,
			controller: 'spherical-earth-controller',
		});
		for (let viewId of mounted) {
			this.sessions.set(viewId, new AbortController());
			this.retry(viewId);
		}
	}

	/**
	 * Call this method to start one independent mounted view.
	 *
	 * @param {WorkspacePageMount} request - Exact page/view identity.
	 * @returns {React.ReactElement} - View-owned presentation.
	 */
	mount({viewId}) {
		this.unmount(viewId);
		this.sessions.set(viewId, new AbortController());
		this.retry(viewId);
		return this.view.getComponent(viewId);
	}

	/**
	 * Called by workflow changes to publish only the current view state.
	 *
	 * @param {string} viewId - Exact owner.
	 * @param {SphericalEarthPageState} state - Complete presentation projection.
	 */
	_publish(viewId, state) {
		this.model.set(viewId, state);
		this.fire('state-changed', {viewId, state: this.model.get(viewId)});
	}

	/**
	 * Call this method to prepare a view or retry failed data without cancelling another subscriber.
	 *
	 * @param {string} viewId - Owning mounted view.
	 */
	retry(viewId) {
		let previous = this.sessions.get(viewId);
		if (!previous) {
			return;
		}
		previous.abort();
		let abort = new AbortController();
		this.sessions.set(viewId, abort);
		let angle = this.model.getSolarZenith(this.configuration.get());
		if (angle == null) {
			this._publish(viewId, {status: 'missing-location', preparation: null});
			return;
		}
		this._publish(viewId, {status: 'loading', preparation: null});
		void this.cache
			.prepare(angle, abort.signal)
			.then((preparation) => {
				if (!abort.signal.aborted && this.sessions.get(viewId) === abort) {
					this._publish(viewId, {status: 'cache-ready', preparation});
				}
			})
			.catch((error) => {
				if (!abort.signal.aborted && this.sessions.get(viewId) === abort) {
					console.error('Spherical cache preparation failed.', error);
					this._publish(viewId, {status: 'error', preparation: null});
				}
			});
	}

	/**
	 * Call this method to read model-owned view state.
	 *
	 * @param {string} viewId - Exact owner.
	 * @returns {SphericalEarthPageState} - Current presentation facts.
	 */
	getState(viewId) {
		return this.model.get(viewId);
	}

	/**
	 * Call this method to release only the specified view lifetime.
	 *
	 * @param {string} viewId - Retiring view.
	 */
	unmount(viewId) {
		this.sessions.get(viewId)?.abort();
		this.sessions.delete(viewId);
		this.model?.remove(viewId);
	}

	/**
	 * Call this method to detach configuration and all exact view lifetimes.
	 */
	stop() {
		if (this.listener) {
			this.configuration.unlisten('changed', this.listener);
			this.listener = null;
		}
		for (let viewId of this.sessions.keys()) {
			this.unmount(viewId);
		}
	}
}

new SphericalEarthController();
