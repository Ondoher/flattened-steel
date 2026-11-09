import {Service} from '@polylith/core';
import {SphericalEarthSession} from './SphericalEarthSession.js';
import {SphericalEarthRuntime} from './runtime/SphericalEarthRuntime.js';

/**
 * Owns spherical page/contribution lifetimes and coordinates shared services.
 *
 * @implements {WorkspacePageController}
 */
export class SphericalEarthController extends Service {
	/**
	 * Creates the feature without locating runtime dependencies.
	 *
	 * @param {unknown} registry - Application registry.
	 */
	constructor(registry) {
		super('spherical-earth-controller', registry);
		this.sessions = new Map();
		this.release = Promise.resolve();
		this.surfaces = new Map();
		this.tokens = new Map();
		this.listener = null;
		this.implement([
			'ready',
			'stop',
			'mount',
			'unmount',
			'getState',
			'getCanvas',
			'attach',
			'detach',
			'retry',
			'setFieldOfView',
			'setObserverHeight',
			'setSkyRenderMode',
			'centerOnSun',
			'centerOnPolaris',
			'toggleCompass',
			'mountContribution',
			'unmountContribution',
		]);
	}

	/**
	 * Call this method to bind shared capabilities and register the page.
	 */
	ready() {
		if (this.listener) {
			this.configuration.unlisten('changed', this.listener);
		}
		this.model = /** @type {SphericalEarthModelService} */ (this.registry.subscribe('spherical-earth-model'));
		this.view = /** @type {SphericalEarthViewService} */ (this.registry.subscribe('spherical-earth-view'));
		this.cache = /** @type {DistantSunCacheService} */ (this.registry.subscribe('distant-sun-cache'));
		this.stellar = /** @type {StellarCatalogService} */ (this.registry.subscribe('stellar-catalog'));
		this.configuration = /** @type {ConfigurationService} */ (this.registry.subscribe('configuration'));
		this.contributions = /** @type {WorkspaceUiContributionsService} */ (
			this.registry.subscribe('ui-contributions')
		);
		this.listener = this.configuration.listen('changed', () => this._update());
		/** @type {AppPagesService} */ (this.registry.subscribe('app-pages')).add({
			id: 'spherical-earth',
			label: 'spherical-earth.title',
			urlSlug: 'spherical-earth',
			order: 1,
			controller: 'spherical-earth-controller',
		});
		this._update();
	}

	/**
	 * Called by configuration changes to offer one shared snapshot to every view.
	 */
	_update() {
		const configuration = this.configuration.get();
		for (const session of this.sessions.values()) {
			session.update(configuration);
		}
	}

	/**
	 * Call this method to mount a separately owned session and controls.
	 *
	 * @param {WorkspacePageMount} request - Exact view identity.
	 * @returns {React.ReactElement} - Feature-owned presentation.
	 */
	mount({viewId}) {
		this.unmount(viewId);
		this.model.open(viewId);
		this.surfaces.set(viewId, document.createElement('canvas'));
		const session = new SphericalEarthSession(
			viewId,
			this.model,
			(state) => this.fire('state-changed', {viewId, state}),
			(canvas, model, id, onFailure, onCameraChange) =>
				new SphericalEarthRuntime(canvas, model, id, onFailure, onCameraChange, this.stellar, this.cache),
		);
		this.sessions.set(viewId, session);
		session.update(this.configuration.get());
		const definitions = [
			{id: 'spherical-earth-camera', slot: 'view-tools'},
			{id: 'spherical-earth-camera-settings', slot: 'configuration', label: 'spherical-earth.camera.title'},
		];
		this.tokens.set(
			viewId,
			definitions.map((definition) =>
				this.contributions.add({...definition, controller: 'spherical-earth-controller', viewId}),
			),
		);
		return this.view.getComponent(viewId);
	}

	/**
	 * Call this method to select the scoped toolbar or settings presentation.
	 *
	 * @param {WorkspaceContributionMount} request - Exact mounted contribution.
	 * @returns {React.ReactElement} - Feature-owned controls.
	 */
	mountContribution({contribution}) {
		return contribution.slot === 'configuration'
			? this.view.getCameraComponent(contribution.viewId)
			: this.view.getToolsComponent(contribution.viewId);
	}

	/**
	 * Call this method when a controls host retires; the page owns its camera lifetime.
	 *
	 * @param {WorkspaceContributionMount} _request - Retiring presentation identity.
	 */
	unmountContribution(_request) {}

	/**
	 * Call this method to read one session's current projection.
	 *
	 * @param {string} viewId - Exact owner.
	 * @returns {SphericalEarthSceneState} - Requested/displayed state.
	 */
	getState(viewId) {
		return this.sessions.get(viewId).getState();
	}

	/**
	 * Call this method to obtain the feature-owned graphics surface.
	 *
	 * @param {string} viewId - Exact owner.
	 * @returns {HTMLCanvasElement} - Surface mounted by presentation.
	 */
	getCanvas(viewId) {
		return this.surfaces.get(viewId);
	}

	/**
	 * Call this method to attach the exact mounted surface.
	 *
	 * @param {string} viewId - Exact owner.
	 * @param {HTMLCanvasElement} canvas - Mounted surface.
	 */
	attach(viewId, canvas) {
		this.sessions.get(viewId)?.attach(canvas);
	}

	/**
	 * Call this method to detach only the original surface.
	 *
	 * @param {string} viewId - Exact owner.
	 * @param {HTMLCanvasElement} canvas - Retiring surface.
	 */
	detach(viewId, canvas) {
		this.sessions.get(viewId)?.detach(canvas);
	}

	/**
	 * Call this method to retry one failed renderer lifetime.
	 *
	 * @param {string} viewId - Exact owner.
	 */
	retry(viewId) {
		this.sessions.get(viewId)?.retry();
	}

	/**
	 * Call this method to change framing without rebuilding scene resources.
	 *
	 * @param {string} viewId - Exact owner.
	 * @param {number} degrees - Vertical field of view.
	 */
	setFieldOfView(viewId, degrees) {
		this.sessions.get(viewId)?.setFieldOfView(degrees);
	}

	/**
	 * Call this method to request a physical height update.
	 *
	 * @param {string} viewId - Exact owner.
	 * @param {Distance} height - Physical elevation.
	 */
	setObserverHeight(viewId, height) {
		this.sessions.get(viewId)?.setObserverHeight(height);
	}

	/**
	 * Call this method to change view-only sky presentation.
	 *
	 * @param {string} viewId - Exact owner.
	 * @param {SphericalEarthSkyRenderMode} mode - Sky selection.
	 */
	setSkyRenderMode(viewId, mode) {
		this.sessions.get(viewId)?.setSkyRenderMode(mode);
	}

	/**
	 * Call this method to aim only this view at its displayed Sun.
	 *
	 * @param {string} viewId - Exact owner.
	 */
	centerOnSun(viewId) {
		this.sessions.get(viewId)?.centerOnSun();
	}

	/**
	 * Call this method to relay a scoped aim-at-Polaris intent.
	 *
	 * @param {string} viewId - Exact owning view.
	 */
	centerOnPolaris(viewId) {
		this.sessions.get(viewId)?.centerOnPolaris();
	}

	/**
	 * Call this method to toggle this view's directional ribbon.
	 *
	 * @param {string} viewId - Exact owning view.
	 */
	toggleCompass(viewId) {
		this.sessions.get(viewId)?.toggleCompass();
	}

	/**
	 * Call this method to release a page, contribution tokens and model record.
	 *
	 * @param {string} viewId - Exact retiring owner.
	 */
	unmount(viewId) {
		const session = this.sessions.get(viewId);
		if (!session) {
			return;
		}
		this.sessions.delete(viewId);
		for (const token of this.tokens.get(viewId) ?? []) {
			this.contributions.remove(token);
		}
		this.tokens.delete(viewId);
		if (session.canvas) {
			session.detach(session.canvas);
		}
		this.release = Promise.all([this.release, session.release]).then(() => {});
		this.surfaces.delete(viewId);
		this.model.close(viewId);
	}

	/**
	 * Call this method to retire only this feature's subscriptions and sessions.
	 *
	 * @returns {Promise<void>} - Completion after all removed sessions release their resources.
	 */
	stop() {
		if (this.listener) {
			this.configuration.unlisten('changed', this.listener);
			this.listener = null;
		}
		for (const id of this.sessions.keys()) {
			this.unmount(id);
		}
		return this.release;
	}
}

new SphericalEarthController();
