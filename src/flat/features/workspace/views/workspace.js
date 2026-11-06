import React from 'react';
import {Service} from '@polylith/core';
import WorkspaceShell from '../components/WorkspaceShell.jsx';
/**
 * View service that mediates between the workspace controller and React frame.
 *
 * @implements {WorkspaceViewService}
 */
export class WorkspaceView extends Service {
	/**
	 * Creates the workspace view service.
	 *
	 * @param {unknown} registry - The owning Polylith registry.
	 */
	constructor(registry) {
		super('workspace-view', registry);
		this.implement([
			'ready',
			'stop',
			'getComponent',
			'getShellState',
			'requestPage',
			'toggleComparison',
			'closeView',
			'toggleConfiguration',
			'selectConfigurationTarget',
			'selectConfigurationSection',
			'openConfiguration',
		]);
	}

	/**
	 * Call this method when the controller is ready for event mediation.
	 */
	ready() {
		this.stop();
		this.controller = this.registry.subscribe('workspace-controller');
		this.controllerStateChanged = () => this.fire('state-changed', this.getShellState());
		this.controllerStateListener = this.controller.listen('state-changed', this.controllerStateChanged);
	}

	/**
	 * Call this method to remove the exact controller event listener.
	 */
	stop() {
		if (this.controller && this.controllerStateListener) {
			this.controller.unlisten('state-changed', this.controllerStateListener);
		}
		this.controllerStateListener = null;
	}

	/**
	 * Called by projection to group owner-rendered contributions into a presentation host.
	 *
	 * @param {WorkspaceContributionContent[]} contributions - Controller-owned mount results.
	 * @param {UiContributionSlot} slot - Presentation host.
	 * @param {string|null} viewId - Exact workspace or view scope.
	 * @returns {MountedUiContribution[]} - Renderable content in the existing catalog order.
	 */
	_content(contributions, slot, viewId) {
		return contributions
			.filter((record) => record.slot === slot && record.viewId === viewId)
			.map((record) => ({registrationId: record.registrationId, component: record.component}));
	}

	/**
	 * Call this method to create the presentational workspace shell.
	 *
	 * @param {object} props - Shell properties.
	 * @returns {React.ReactElement} - The workspace shell element.
	 */
	getComponent(props = {}) {
		return React.createElement(WorkspaceShell, {
			...props,
			workspaceView: this,
			initialState: this.getShellState(),
		});
	}

	/**
	 * Call this method to read shell state owned by the controller.
	 *
	 * @returns {WorkspaceShellState} - The current shell state.
	 */
	getShellState() {
		let state = this.controller.getState();
		return {
			notFound: state.workspace.notFound,
			views: state.workspace.views.map((view) => ({
				...view,
				page: state.pages.find((page) => page.id === view.pageId) ?? null,
				component: state.pageContent.find((page) => page.viewId === view.id)?.component ?? null,
				tools: this._content(state.contributions, 'view-tools', view.id),
				secondaryTools: this._content(state.contributions, 'view-tools-secondary', view.id),
				hasSettings: (state.availableContributions ?? []).some(
					(record) => record.slot === 'configuration' && record.viewId === view.id,
				),
				settingsSelected:
					state.workspace.configuration.open && state.workspace.configuration.target === view.id,
				status: this._content(state.contributions, 'status', view.id),
			})),
			pages: state.pages,
			toolbar: this._content(state.contributions, 'toolbar', null),
			configuration: {
				...state.workspace.configuration,
				sections: (state.availableContributions ?? []).filter(
					(record) =>
						record.slot === 'configuration' && record.viewId === state.workspace.configuration.target,
				),
				targets: (state.availableContributions ?? [])
					.filter((record) => record.slot === 'configuration')
					.map((record) => record.viewId),
				contributions: this._content(
					state.contributions,
					'configuration',
					state.workspace.configuration.target,
				),
			},
		};
	}

	/**
	 * Call this method to forward page-selection intent to the controller.
	 *
	 * @param {string} pageId - The requested page identifier.
	 * @param {string} viewId - Target open-view identity.
	 * @returns {AppPageRecord | null} - The selected page or no selection.
	 */
	requestPage(pageId, viewId) {
		return this.controller.requestPage(pageId, viewId);
	}

	/**
	 * Call this method to relay the comparison intent to the workspace owner.
	 */
	toggleComparison() {
		this.controller.toggleComparison();
	}

	/**
	 * Call this method to relay an exact optional-view close intent.
	 *
	 * @param {string} viewId - View lifetime identity.
	 */
	closeView(viewId) {
		this.controller.closeView(viewId);
	}

	/**
	 * Call this method to relay the configuration visibility intent.
	 */
	toggleConfiguration() {
		this.controller.toggleConfiguration();
	}

	/**
	 * Call this method to relay an explicit settings scope.
	 *
	 * @param {string|null} viewId - Open-view identity or workspace scope.
	 */
	selectConfigurationTarget(viewId) {
		this.controller.selectConfigurationTarget(viewId);
	}
	/**
	 * Call this method to relay a registered section selection.
	 *
	 * @param {string} section - Provider identity.
	 */
	selectConfigurationSection(section) {
		this.controller.selectConfigurationSection(section);
	}

	/**
	 * Call this method to relay a generic page-settings opening intent.
	 *
	 * @param {string|null} target - Exact view identity or shared scope.
	 */
	openConfiguration(target) {
		this.controller.openConfiguration(target);
	}
}
new WorkspaceView();
