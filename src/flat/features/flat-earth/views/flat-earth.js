import React from 'react';
import {Service} from '@polylith/core';
import FlatEarthViewTools from '../components/FlatEarthViewTools.jsx';
import FlatEarthPage from '../components/FlatEarthPage.jsx';
import FlatEarthTimeControls from '../components/FlatEarthTimeControls.jsx';

/**
 * Adapts scoped controller state and surface intents to the Flat Earth page.
 */
export class FlatEarthView extends Service {
	/**
	 * Creates the feature-owned presentation capability.
	 *
	 * @param {unknown} registry - Owning application registry.
	 */
	constructor(registry) {
		super('flat-earth-view', registry);
		this.implement([
			'ready',
			'stop',
			'getComponent',
			'getState',
			'attach',
			'detach',
			'retry',
			'getToolsComponent',
			'setFieldOfView',
			'setObserverHeight',
			'centerOnSun',
			'getTimeComponent',
			'getCameraComponent',
			'getTimeState',
			'beginTimeEdit',
			'seekTime',
			'endTimeEdit',
			'setTimeDraft',
			'acceptTimeDraft',
			'resetTimeDraft',
			'openTimeSettings',
			'openLocationSettings',
		]);
		this._listener = null;
	}

	/**
	 * Call this method after readiness to observe only the owning controller.
	 */
	ready() {
		this.stop();
		this.controller = /** @type {FlatEarthControllerService} */ (this.registry.subscribe('flat-earth-controller'));
		this._listener = this.controller.listen('state-changed', (change) => this.fire('state-changed', change));
		this._timeListener = this.controller.listen('time-changed', () =>
			this.fire('time-changed', this.getTimeState()),
		);
	}

	/**
	 * Call this method to release the original controller subscription exactly.
	 */
	stop() {
		if (this._listener) {
			this.controller.unlisten('state-changed', this._listener);
			this.controller.unlisten('time-changed', this._timeListener);
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
		return React.createElement(FlatEarthPage, {
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
		return React.createElement(FlatEarthViewTools, {viewId, sceneView: this, initialState: this.getState(viewId)});
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
	 * Call this method to read scoped scene presentation from the owning controller.
	 *
	 * @param {string} viewId - Exact workspace view identity.
	 * @returns {FlatEarthSceneState} - Disposable preparation state.
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
	 * Call this method to select shared time presentation for a panel or toolbar.
	 *
	 * @param {string} owner - Mounted control identity.
	 * @param {boolean} panel - Whether full numeric/reference content is needed.
	 * @returns {React.ReactElement} - Feature-owned time controls.
	 */
	getTimeComponent(owner, panel) {
		return React.createElement(FlatEarthTimeControls, {sceneView: this, owner, panel});
	}

	/**
	 * Call this method to select the same scoped Camera controls for configuration.
	 *
	 * @param {string} viewId - Exact owning view.
	 * @returns {React.ReactElement} - Feature-owned Camera contribution.
	 */
	getCameraComponent(viewId) {
		return this.getToolsComponent(viewId);
	}

	/**
	 * Call this method to project current time/reference facts into device-local text.
	 *
	 * @returns {FlatEarthTimePresentation} - Shared alternate-time presentation.
	 */
	getTimeState() {
		let facts = this.controller.getTimeState();
		let location = facts.configuration.location;
		let timestamp = facts.configuration.timestamp;
		return {
			...facts,
			location: location?.city?.name ?? (location ? `${location.latitude}, ${location.longitude}` : ''),
			resolvedTime:
				timestamp == null
					? ''
					: new Intl.DateTimeFormat(undefined, {dateStyle: 'medium', timeStyle: 'medium'}).format(timestamp),
			dateBasis: facts.closestInstant
				? new Intl.DateTimeFormat(undefined, {dateStyle: 'medium'}).format(new Date(facts.closestInstant))
				: '',
			deviceZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		};
	}

	/**
	 * Call this method to relay beginTimeEdit intent to the owning controller.
	 *
	 * @param {string} owner - Exact control identity.
	 * @returns {number} - Exact gesture token.
	 */
	beginTimeEdit(owner) {
		return this.controller.beginTimeEdit(owner);
	}

	/**
	 * Call this method to relay seekTime intent to the owning controller.
	 *
	 * @param {string} owner - Exact control identity.
	 * @param {number} token - Input supplied by the control.
	 * @param {number} angle - Input supplied by the control.
	 */
	seekTime(owner, token, angle) {
		this.controller.seekTime(owner, token, angle);
	}

	/**
	 * Call this method to relay endTimeEdit intent to the owning controller.
	 *
	 * @param {string} owner - Exact control identity.
	 * @param {number} token - Input supplied by the control.
	 */
	endTimeEdit(owner, token) {
		this.controller.endTimeEdit(owner, token);
	}

	/**
	 * Call this method to relay setTimeDraft intent to the owning controller.
	 *
	 * @param {string} text - Input supplied by the control.
	 */
	setTimeDraft(text) {
		this.controller.setTimeDraft(text);
	}

	/**
	 * Call this method to relay acceptTimeDraft intent to the owning controller.
	 */
	acceptTimeDraft() {
		this.controller.acceptTimeDraft();
	}

	/**
	 * Call this method to relay resetTimeDraft intent to the owning controller.
	 */
	resetTimeDraft() {
		this.controller.resetTimeDraft();
	}

	/**
	 * Call this method to relay openTimeSettings intent to the owning controller.
	 */
	openTimeSettings() {
		this.controller.openTimeSettings();
	}

	/**
	 * Call this method to relay openLocationSettings intent to the owning controller.
	 */
	openLocationSettings() {
		this.controller.openLocationSettings();
	}
}

new FlatEarthView();
