import React from 'react';
import {Service} from '@polylith/core';
import AppShell from '../components/AppShell.jsx';
/**
 * View service that mediates between the application controller and React shell.
 *
 * @implements {AppView}
 */
export class AppView extends Service {
	/**
	 * Creates the application view service.
	 *
	 * @param {unknown} registry - The owning Polylith registry.
	 */
	constructor(registry) {
		super('app-view', registry);
		this.implement(['ready', 'stop', 'getComponent', 'getShellState', 'requestPage']);
	}
	/** Call this method when the controller is ready for event mediation. */
	ready() {
		this.stop();
		this.controller = this.registry.subscribe('app-controller');
		this.controllerStateChanged = (state) => this.fire('state-changed', state);
		this.controllerStateListener = this.controller.listen('state-changed', this.controllerStateChanged);
	}
	/** Call this method to remove the exact controller event listener. */
	stop() {
		if (this.controller && this.controllerStateListener)
			this.controller.unlisten('state-changed', this.controllerStateListener);
		this.controllerStateListener = null;
	}
	/**
	 * Call this method to create the presentational application shell.
	 *
	 * @param {object} props - Shell properties.
	 * @returns {React.ReactElement} - The application shell element.
	 */
	getComponent(props = {}) {
		return React.createElement(AppShell, {
			...props,
			appView: this,
			initialState: this.getShellState(),
			title: 'app.title',
			titleLiteral: 'Initial setup for a polylith project',
		});
	}
	/**
	 * Call this method to read shell state owned by the controller.
	 *
	 * @returns {AppShellState} - The current shell state.
	 */
	getShellState() {
		return this.controller.getShellState();
	}
	/**
	 * Call this method to forward page-selection intent to the controller.
	 *
	 * @param {string} pageId - The requested page identifier.
	 * @returns {AppPageRecord | null} - The selected page or no selection.
	 */
	requestPage(pageId) {
		return this.controller.requestPage(pageId);
	}
}
new AppView();
