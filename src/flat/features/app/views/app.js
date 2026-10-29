import React from 'react';
import {Service} from '@polylith/core';
import AppShell from '../components/AppShell.jsx';
import App from '../../../main/App.jsx';

/**
 * Thin application presentation boundary around activated feature content.
 *
 * @implements {AppViewService}
 */
export class AppView extends Service {
	/**
	 * Creates the application view capability.
	 *
	 * @param {unknown} registry - Optional isolated application registry.
	 */
	constructor(registry) {
		super('app-view', registry);
		this.implement(['ready', 'stop', 'getState', 'getComponent']);
	}

	/**
	 * Call this method after dependency readiness to locate the owning controller.
	 */
	ready() {
		this.stop();
		this.controller = this.registry.subscribe('app-controller');
		this._stateListener = this.controller.listen('state-changed', () =>
			this.fire('state-changed', this.getState()),
		);
	}

	/**
	 * Call this method to remove the exact owned controller listener.
	 */
	stop() {
		if (this._stateListener) {
			this.controller.unlisten('state-changed', this._stateListener);
		}
		this._stateListener = null;
	}

	/**
	 * Call this method to project controller state into the application presentation.
	 *
	 * @returns {AppPresentationState} - Context and concrete presentation, without a new canonical owner.
	 */
	getState() {
		let state = this.controller.getState();
		return {context: state.context, presentation: React.createElement(AppShell, {content: state.content})};
	}

	/**
	 * Call this method to wrap activated content without locating or importing workspace internals.
	 *
	 * @param {object} props - Presentation properties.
	 * @returns {React.ReactElement} - Minimal application boundary.
	 */
	getComponent(props = {}) {
		return React.createElement(App, {...props, appView: this, initialState: this.getState()});
	}
}
new AppView();
