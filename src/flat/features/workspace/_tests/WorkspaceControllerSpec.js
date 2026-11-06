import {WorkspaceModel} from '../models/WorkspaceModel.js';
import React from 'react';
import {Registry, Service} from '@polylith/core';
import {AppPagesService} from '../../../services/app-pages.js';
import {UiContributionsService} from '../services/ui-contributions.js';
import {WorkspaceController} from '../controller.js';
import {WorkspaceView} from '../views/workspace.js';
class Owner extends Service {
	constructor(registry) {
		super('owner', registry);
		this.mounts = [];
		this.releases = [];
		this.contributionMounts = [];
		this.contributionReleases = [];
		this.implement(['mount', 'unmount', 'mountContribution', 'unmountContribution']);
	}

	mount({page, viewId}) {
		this.mounts.push({pageId: page.id, viewId});
		if (page.id === this.failPageId) {
			throw new Error('mount failed');
		}
		return page.id === 'empty' ? null : React.createElement('section', {'data-instance': viewId}, page.id);
	}

	unmount(viewId) {
		this.releases.push(viewId);
	}

	mountContribution({contribution}) {
		this.contributionMounts.push(contribution.registrationId);
		return React.createElement('span', null, contribution.id);
	}

	unmountContribution({contribution}) {
		this.contributionReleases.push(contribution.registrationId);
	}
}
class NavigationStub extends Service {
	constructor(registry) {
		super('app-controller', registry);
		this.implement(['requestPage']);
		this.requests = [];
	}

	requestPage(pageId, {viewId} = {}) {
		this.requests.push({pageId, viewId});
		return this.registry.subscribe('workspace-controller').mountPage(pageId, viewId);
	}
}
function setup() {
	let registry = new Registry();
	new WorkspaceModel(registry).start();
	let pages = new AppPagesService(registry);
	pages.start();
	let contributions = new UiContributionsService(registry);
	contributions.start();
	let view = new WorkspaceView(registry);
	let owner = new Owner(registry);
	let navigation = new NavigationStub(registry);
	let controller = new WorkspaceController(registry);
	controller.start();
	controller.ready();
	view.ready();
	return {registry, pages, contributions, owner, navigation, controller, view};
}
describe('workspace controller', () => {
	let state;
	beforeEach(() => {
		state = setup();
	});
	afterEach(() => {
		state.controller.stop();
		state.view.stop();
	});
	describe('composition and feature lifetimes', () => {
		it('leaves default selection to the application and relays native selection through navigation', () => {
			state.pages.add({id: 'scene', default: true, controller: 'owner'});
			expect(state.view.getShellState().views[0].pageId).toBeNull();
			state.controller.requestPage('scene', 'view-1');
			expect(state.navigation.requests).toEqual([{pageId: 'scene', viewId: 'view-1'}]);
			expect(state.view.getShellState().views[0].pageId).toBe('scene');
		});
		it('releases and restores selected instances on repeated readiness without duplicate listeners', () => {
			state.pages.add({id: 'scene', controller: 'owner'});
			state.controller.mountPage('scene');
			state.controller.ready();
			expect(state.owner.releases).toEqual(['view-1']);
			expect(state.owner.mounts.length).toBe(2);
			expect(state.view.getShellState().views[0].pageId).toBe('scene');
		});
		it('ignores stale close intents without reopening or closing a replacement view', () => {
			state.controller.toggleComparison();
			expect(state.controller.closeView('view-2')).toBeTrue();
			expect(state.controller.closeView('view-2')).toBeFalse();
			expect(state.view.getShellState().views.length).toBe(1);
			state.controller.toggleComparison();
			expect(state.controller.closeView('view-2')).toBeFalse();
			expect(state.view.getShellState().views[1].id).toBe('view-3');
		});
		it('rolls back a failed optional mount and releases its partial lifetime', () => {
			state.pages.add({id: 'scene', default: true, controller: 'owner'});
			state.controller.mountPage('scene');
			let original = state.view.getShellState().views[0].component;
			state.owner.failPageId = 'scene';
			expect(() => state.controller.toggleComparison()).toThrowError('mount failed');
			expect(state.view.getShellState().views.length).toBe(1);
			expect(state.view.getShellState().views[0].component).toBe(original);
			expect(state.owner.releases).toEqual(['view-2']);
		});
		it('starts as an empty workspace without inferring a first registered page', () => {
			state.pages.add({id: 'optional', label: 'Optional', controller: 'owner'});
			expect(state.view.getShellState().views[0].pageId).toBeNull();
			expect(state.view.getShellState().views[0].component).toBeNull();
			expect(state.controller.mount().props.workspaceView).toBe(state.view);
		});
		it('mounts independent instances and closes only the optional view', () => {
			state.pages.add({id: 'scene', label: 'Scene', default: true, controller: 'owner'});
			state.controller.mountPage('scene');
			let original = state.view.getShellState().views[0].component;
			state.controller.toggleComparison();
			let views = state.view.getShellState().views;
			expect(views.map((view) => view.pageId)).toEqual(['scene', 'scene']);
			expect(views[0].component).toBe(original);
			expect(views[1].component).not.toBe(original);
			expect(state.owner.mounts.map((mount) => mount.viewId)).toEqual(['view-1', 'view-2']);
			state.controller.selectConfigurationTarget('view-2');
			state.controller.toggleComparison();
			expect(state.owner.releases).toEqual(['view-2']);
			expect(state.view.getShellState().configuration.target).toBeNull();
			expect(state.view.getShellState().views[0].component).toBe(original);
			state.controller.toggleComparison();
			expect(state.view.getShellState().views[1].id).toBe('view-3');
		});
		it('releases the previous instance before replacing a page in the same view', () => {
			state.pages.add({id: 'one', default: true, controller: 'owner'});
			state.controller.mountPage('one');
			state.pages.add({id: 'two', controller: 'owner'});
			state.controller.mountPage('two');
			expect(state.owner.releases).toEqual(['view-1']);
			expect(state.view.getShellState().views[0].pageId).toBe('two');
			state.controller.mountPage('two');
			expect(state.owner.mounts.length).toBe(2);
		});
		it('leaves missing page definitions and empty mounts unselected', () => {
			expect(state.controller.mountPage('missing')).toBeNull();
			state.pages.add({id: 'empty', controller: 'owner'});
			expect(state.controller.mountPage('empty')).toBeNull();
			expect(state.view.getShellState().views[0].pageId).toBeNull();
		});
	});
	describe('contribution scope and cleanup', () => {
		it('selects one registered section, falls back on removal, and preserves page lifetimes', () => {
			state.pages.add({id: 'scene', controller: 'owner'});
			state.controller.mountPage('scene');
			let first = state.contributions.add({
				id: 'location',
				label: 'Location',
				slot: 'configuration',
				controller: 'owner',
			});
			let second = state.contributions.add({
				id: 'time',
				label: 'Time',
				slot: 'configuration',
				controller: 'owner',
			});
			state.controller.openConfiguration(null, 'time', 'degrees');
			expect(state.owner.contributionMounts).toEqual([second]);
			expect(state.controller.getState().workspace.configuration.focus).toBe('degrees');
			state.controller.selectConfigurationSection('location');
			expect(state.owner.contributionReleases).toEqual([second]);
			expect(state.owner.contributionMounts).toEqual([second, first]);
			state.contributions.remove(first);
			expect(state.controller.getState().workspace.configuration.section).toBe('time');
			expect(state.owner.mounts.length).toBe(1);
			expect(state.owner.releases).toEqual([]);
			state.controller.openConfiguration('closed', 'time');
			expect(state.controller.getState().workspace.configuration.target).toBeNull();
		});
		it('mounts registered content without feature imports and releases exact registrations', () => {
			let token = state.contributions.add({id: 'shared-control', slot: 'toolbar', controller: 'owner'});
			expect(state.view.getShellState().toolbar[0].component.props.children).toBe('shared-control');
			state.contributions.remove(token);
			expect(state.view.getShellState().toolbar).toEqual([]);
			expect(state.owner.contributionReleases).toEqual([token]);
		});
		it('mounts settings only while their exact scope is visible, and removes closed-view tools', () => {
			let global = state.contributions.add({id: 'global', slot: 'configuration', controller: 'owner'});
			expect(state.owner.contributionMounts).toEqual([]);
			state.controller.toggleConfiguration();
			expect(state.owner.contributionMounts).toEqual([global]);
			state.controller.toggleComparison();
			let scoped = state.contributions.add({
				id: 'local',
				slot: 'configuration',
				viewId: 'view-2',
				controller: 'owner',
			});
			let tools = state.contributions.add({
				id: 'tools',
				slot: 'view-tools',
				viewId: 'view-2',
				controller: 'owner',
			});
			state.controller.selectConfigurationTarget('view-2');
			expect(state.view.getShellState().configuration.contributions.map((item) => item.registrationId)).toEqual([
				scoped,
			]);
			expect(state.owner.contributionReleases).toContain(global);
			state.controller.toggleComparison();
			expect(state.contributions.get().map((item) => item.registrationId)).toEqual([global]);
			expect(state.owner.contributionReleases.filter((token) => token === tools).length).toBe(1);
		});
		it('stops exact listeners and releases mounted owners without duplicate shutdown', () => {
			state.pages.add({id: 'one', default: true, controller: 'owner'});
			state.controller.mountPage('one');
			let token = state.contributions.add({id: 'control', slot: 'toolbar', controller: 'owner'});
			let changed = jasmine.createSpy('state');
			state.controller.listen('state-changed', changed);
			state.controller.stop();
			state.controller.stop();
			state.pages.fire('updated');
			state.registry.fire('ready');
			state.contributions.fire('changed');
			expect(changed).not.toHaveBeenCalled();
			expect(state.owner.releases).toEqual(['view-1']);
			expect(state.owner.contributionReleases).toEqual([token]);
		});
	});
});
