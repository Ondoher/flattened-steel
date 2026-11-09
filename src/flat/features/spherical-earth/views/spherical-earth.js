import React from 'react';
import {Service} from '@polylith/core';
import SphericalEarthViewTools from '../components/SphericalEarthViewTools.jsx';
import SphericalEarthPage from '../components/SphericalEarthPage.jsx';

/**
 * Adapts scoped controller state and surface intents to the Spherical Earth page.
 */
export class SphericalEarthView extends Service {
	/**
	 * Creates the feature-owned presentation capability.
	 *
	 * @param {unknown} registry - Owning application registry.
	 */
	constructor(registry) {
		super('spherical-earth-view', registry);
		this.implement([
			'ready',
			'stop',
			'getComponent',
			'getState',
			'getCanvas',
			'attach',
			'detach',
			'retry',
			'getToolsComponent',
			'getCameraComponent',
			'setFieldOfView',
			'setSkyRenderMode',
			'setObserverHeight',
			'centerOnSun',
			'centerOnPolaris',
			'toggleCompass',
			'syncCamera',
			'getSyncOptions',
		]);
		this._listener = null;
	}

	/**
	 * Call this method after readiness to observe only the owning controller.
	 */
	ready() {
		this.stop();
		this.controller = /** @type {SphericalEarthControllerService} */ (
			this.registry.subscribe('spherical-earth-controller')
		);
		this._listener = this.controller.listen('state-changed', (change) => this.fire('state-changed', change));
	}

	/**
	 * Call this method to release the original controller subscription exactly.
	 */
	stop() {
		if (this._listener) {
			this.controller.unlisten('state-changed', this._listener);
		}
		this._listener = null;
	}

	/**
	 * Call this method to create one feature-owned scene presentation.
	 *
	 * @param {string} viewId - Exact workspace view receiving this page.
	 * @returns {React.ReactElement} - Page bound to its owning view.
	 */
	getComponent(viewId) {
		return React.createElement(SphericalEarthPage, {
			key: viewId,
			viewId,
			sceneView: this,
			initialState: this.getState(viewId),
		});
	}

	/**
	 * Call this method to provide scoped camera controls to the generic toolbar host.
	 *
	 * @param {string} viewId - Exact owning view.
	 * @returns {React.ReactElement} - Feature-owned toolbar presentation.
	 */
	getToolsComponent(viewId) {
		return React.createElement(SphericalEarthViewTools, {
			viewId,
			sceneView: this,
			initialState: this.getState(viewId),
		});
	}

	/**
	 * Call this method to relay a vertical FOV selection to its controller.
	 *
	 * @param {string} viewId - Exact owning view.
	 * @param {number} degrees - Vertical perspective angle.
	 */
	setFieldOfView(viewId, degrees) {
		this.controller.setFieldOfView(viewId, degrees);
	}

	/**
	 * Call this method to relay one view's shader selection through the controller.
	 *
	 * @param {string} viewId - Exact owning view.
	 * @param {SphericalEarthSkyRenderMode} mode - Selected sky composition.
	 */
	setSkyRenderMode(viewId, mode) {
		this.controller.setSkyRenderMode(viewId, mode);
	}

	/**
	 * Call this method to relay an elevation request to its controller.
	 *
	 * @param {string} viewId - Exact owning view.
	 * @param {Distance} height - Requested distance above ground.
	 */
	setObserverHeight(viewId, height) {
		this.controller.setObserverHeight(viewId, height);
	}

	/**
	 * Call this method to relay a scoped aim-at-Sun intent.
	 *
	 * @param {string} viewId - Exact owning view.
	 */
	centerOnSun(viewId) {
		this.controller.centerOnSun(viewId);
	}

	/**
	 * Call this method to relay a scoped aim-at-Polaris intent.
	 *
	 * @param {string} viewId - Exact owning view.
	 */
	centerOnPolaris(viewId) {
		this.controller.centerOnPolaris(viewId);
	}

	/**
	 * Call this method to toggle this view's directional ribbon.
	 *
	 * @param {string} viewId - Exact owning view.
	 */
	toggleCompass(viewId) {
		this.controller.toggleCompass(viewId);
	}

	/**
	 * Call this method to relay a scoped sync-menu action through the owning controller.
	 *
	 * @param {string} viewId - Mounted view identity.
	 * @param {CameraSyncMode} mode - Requested camera-sync action.
	 */
	syncCamera(viewId, mode) {
		this.controller.syncCamera(viewId, mode);
	}

	/**
	 * Call this method to prepare text-only menu availability from the scoped subscription projection.
	 *
	 * @param {string} viewId - Mounted view identity.
	 * @returns {AppSelectOption[]} - Localized action phrases and eligibility.
	 */
	getSyncOptions(viewId) {
		let {mode} = this.controller.getState(viewId).sync;
		return [
			{value: 'now', label: 'camera.sync.now', disabled: mode !== 'off'},
			{value: 'them', label: 'camera.sync.them', disabled: mode !== 'off'},
			{value: 'both', label: 'camera.sync.both', disabled: mode === 'both'},
			{value: 'off', label: 'camera.sync.off'},
		];
	}

	/**
	 * Call this method to read scoped scene presentation from the owning controller.
	 *
	 * @param {string} viewId - Exact workspace view identity.
	 * @returns {SphericalEarthSceneState} - Disposable preparation state.
	 */
	getState(viewId) {
		return this.controller.getState(viewId);
	}

	/**
	 * Call this method to relay a mounted canvas to its scene owner.
	 *
	 * @param {string} viewId - Exact workspace view identity.
	 * @param {HTMLCanvasElement} canvas - Mounted scene surface.
	 */
	attach(viewId, canvas) {
		this.controller.attach(viewId, canvas);
	}

	/**
	 * Call this method to provide the owning controller's retained graphics surface to presentation.
	 *
	 * @param {string} viewId - Exact mounted view identity.
	 * @returns {HTMLCanvasElement} - Feature-owned canvas for the React-owned host.
	 */
	getCanvas(viewId) {
		return this.controller.getCanvas(viewId);
	}

	/**
	 * Call this method to relay release of the exact original surface.
	 *
	 * @param {string} viewId - Exact workspace view identity.
	 * @param {HTMLCanvasElement} canvas - Surface being removed.
	 */
	detach(viewId, canvas) {
		this.controller.detach(viewId, canvas);
	}

	/**
	 * Call this method to relay an explicit scene retry.
	 *
	 * @param {string} viewId - Exact workspace view identity.
	 */
	retry(viewId) {
		this.controller.retry(viewId);
	}

	/**
	 * Call this method to mount the same scoped camera controls in settings.
	 *
	 * @param {string} viewId - Exact view identity.
	 * @returns {React.ReactElement} - Camera panel.
	 */
	getCameraComponent(viewId) {
		return React.createElement(SphericalEarthViewTools, {
			viewId,
			sceneView: this,
			initialState: this.getState(viewId),
			panel: true,
		});
	}
}

new SphericalEarthView();
