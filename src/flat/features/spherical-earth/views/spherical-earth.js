import React from 'react';
import {Service} from '@polylith/core';
import SphericalEarthPage from '../components/SphericalEarthPage.jsx';

/**
 * Feature-owned presentation capability with scoped state and retry intents.
 *
 * @implements {SphericalEarthViewService}
 */
export class SphericalEarthView extends Service {
	/**
	 * Creates the view service.
	 *
	 * @param {unknown} registry - Owning application registry.
	 */
	constructor(registry) {
		super('spherical-earth-view', registry);
		this.implement(['ready', 'stop', 'getComponent', 'getState', 'retry']);
	}

	/**
	 * Call this method to observe the owning controller only.
	 */
	ready() {
		this.stop();
		this.controller = /** @type {SphericalEarthControllerService} */ (
			this.registry.subscribe('spherical-earth-controller')
		);
		this.listener = this.controller.listen('state-changed', (change) => this.fire('state-changed', change));
	}

	/**
	 * Call this method to release the original subscription.
	 */
	stop() {
		if (this.listener) {
			this.controller.unlisten('state-changed', this.listener);
			this.listener = null;
		}
	}

	/**
	 * Call this method to mount presentation for an exact view identity.
	 *
	 * @param {string} viewId - Owning view.
	 * @returns {React.ReactElement} - Independently subscribed page.
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
	 * Call this method to read presentation facts through the controller.
	 *
	 * @param {string} viewId - Owning view.
	 * @returns {SphericalEarthPageState} - Model-owned facts.
	 */
	getState(viewId) {
		return this.controller.getState(viewId);
	}

	/**
	 * Call this method to relay one view's retry intent.
	 *
	 * @param {string} viewId - Exact owner.
	 */
	retry(viewId) {
		this.controller.retry(viewId);
	}
}

new SphericalEarthView();
