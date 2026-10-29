import React from 'react';
import {Registry, Service} from '@polylith/core';
import {WorkspaceView} from '../views/workspace.js';
class ControllerStub extends Service {
	constructor(registry) {
		super('workspace-controller', registry);
		this.implement([
			'getState',
			'requestPage',
			'toggleComparison',
			'toggleConfiguration',
			'selectConfigurationTarget',
		]);
		this.state = {
			workspace: {
				views: [{id: 'view-1', pageId: 'scene'}],
				configuration: {open: false, target: null},
				notFound: false,
			},
			pages: [{id: 'scene'}],
			pageContent: [{viewId: 'view-1', component: React.createElement('main', null, 'Scene')}],
			contributions: [],
		};
		this.actions = [];
	}

	getState() {
		return this.state;
	}

	requestPage(pageId, viewId) {
		this.actions.push({pageId, viewId});
		return {id: pageId};
	}

	toggleComparison() {
		this.actions.push('comparison');
	}

	toggleConfiguration() {
		this.actions.push('configuration');
	}

	selectConfigurationTarget(viewId) {
		this.actions.push({target: viewId});
	}
}
describe('workspace view service', () => {
	it('projects raw controller facts into view hosts and relays scoped intents', () => {
		let registry = new Registry();
		let controller = new ControllerStub(registry);
		let view = new WorkspaceView(registry);
		view.ready();
		let projected = view.getShellState();
		expect(projected.views[0].page).toBe(controller.state.pages[0]);
		expect(projected.views[0].component).toBe(controller.state.pageContent[0].component);
		expect(projected.views[0]).not.toBe(controller.state.workspace.views[0]);
		view.requestPage('scene', 'view-2');
		view.toggleComparison();
		view.toggleConfiguration();
		view.selectConfigurationTarget('view-2');
		expect(controller.actions).toEqual([
			{pageId: 'scene', viewId: 'view-2'},
			'comparison',
			'configuration',
			{target: 'view-2'},
		]);
		expect(view.getComponent().props.workspaceView).toBe(view);
		expect(view.getComponent().props.initialState.views[0].id).toBe('view-1');
		view.stop();
	});
	it('groups mounted contribution facts by host and exact scope without mutating controller state', () => {
		let registry = new Registry();
		let controller = new ControllerStub(registry);
		let view = new WorkspaceView(registry);
		view.ready();
		let control = React.createElement('button', null, 'Tool');
		controller.state.contributions = [
			{id: 'shared', registrationId: 1, slot: 'toolbar', viewId: null, component: control},
			{id: 'local', registrationId: 2, slot: 'view-tools', viewId: 'view-1', component: control},
			{id: 'status', registrationId: 3, slot: 'status', viewId: 'view-2', component: control},
		];
		let projected = view.getShellState();
		expect(projected.toolbar.map((item) => item.registrationId)).toEqual([1]);
		expect(projected.views[0].tools.map((item) => item.registrationId)).toEqual([2]);
		expect(projected.views[0].status).toEqual([]);
		expect(controller.state.contributions.length).toBe(3);
		expect(controller.state.workspace.views[0]).toEqual({id: 'view-1', pageId: 'scene'});
		view.stop();
	});
	it('does not accumulate listeners across readiness and repeated cleanup', () => {
		let registry = new Registry();
		let controller = new ControllerStub(registry);
		let view = new WorkspaceView(registry);
		let changed = jasmine.createSpy('changed');
		view.listen('state-changed', changed);
		view.ready();
		view.ready();
		controller.fire('state-changed', controller.state);
		expect(changed).toHaveBeenCalledTimes(1);
		view.stop();
		view.stop();
		controller.fire('state-changed', controller.state);
		expect(changed).toHaveBeenCalledTimes(1);
	});
});
