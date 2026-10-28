import React from 'react';
import {Registry, Service} from '@polylith/core';
import {AppPagesService} from '../../../services/app-pages.js';
import {AppController} from '../controller.js';
class StubView extends Service {
	constructor(registry) {
		super('app-view', registry);
		this.implement(['getComponent']);
		this.calls = [];
	}
	getComponent(props = {}) {
		this.calls.push(props);
		return React.createElement('div', props);
	}
}
class StubPageController extends Service {
	constructor(registry) {
		super('page-controller', registry);
		this.implement(['mount']);
	}
	mount({page}) {
		return page.id === 'empty' ? null : React.createElement('section', {'data-page': page.id});
	}
}
class BrokenController extends Service {
	constructor(registry) {
		super('broken-controller', registry);
	}
}
class StubUrl extends Service {
	constructor(registry) {
		super('url', registry);
		this.implement(['getPageSlug', 'pushPageSlug', 'replacePageSlug']);
		this.slug = '';
		this.pushed = [];
		this.replaced = [];
	}
	getPageSlug() {
		return this.slug;
	}
	pushPageSlug(slug) {
		this.pushed.push(slug);
	}
	replacePageSlug(slug) {
		this.replaced.push(slug);
	}
}
function setup() {
	const registry = new Registry();
	const pages = new AppPagesService(registry);
	pages.start();
	const view = new StubView(registry);
	new StubPageController(registry);
	new BrokenController(registry);
	const url = new StubUrl(registry);
	const controller = new AppController(registry);
	controller.ready();
	return {controller, pages, registry, url, view};
}
describe('app controller', () => {
	it('owns default selection, mounting, events, and repeat selection', () => {
		const {controller, pages, registry} = setup();
		const mounted = jasmine.createSpy('mounted');
		const pageUpdates = jasmine.createSpy('pages');
		controller.listen('page-mounted', mounted);
		controller.listen('pages-updated', pageUpdates);
		pages.add({id: 'home', label: 'Home', default: true, controller: 'page-controller'});
		const state = controller.getShellState();
		expect(state.activePageId).toBe('home');
		expect(state.pageComponent.type).toBe('section');
		expect(state.notFound).toBeFalse();
		expect(controller.requestPage('home').id).toBe('home');
		expect(mounted).toHaveBeenCalled();
		expect(pageUpdates).toHaveBeenCalled();
		registry.fire('ready');
		expect(controller.registryReady).toBeTrue();
	});
	it('leaves selection unset when no executor-selected default exists', () => {
		const {controller, pages} = setup();
		pages.add({id: 'optional', label: 'Optional', controller: 'page-controller'});
		expect(controller.getShellState().activePageId).toBeNull();
	});
	it('handles missing pages, unavailable mounts, empty mounts, and explicit clearing', () => {
		const {controller, pages} = setup();
		expect(controller.requestPage('missing')).toBeNull();
		pages.add({id: 'missing-service', controller: 'missing-controller'});
		expect(() => controller.requestPage('missing-service')).toThrowError(/cannot mount/);
		pages.add({id: 'broken', controller: 'broken-controller'});
		expect(() => controller.requestPage('broken')).toThrowError(/cannot mount/);
		pages.add({id: 'empty', controller: 'page-controller'});
		expect(controller.requestPage('empty')).toBeNull();
		controller.clearSelection();
		expect(controller.getShellState().notFound).toBeFalse();
		controller.clearSelection(true);
		expect(controller.getShellState().notFound).toBeTrue();
	});
	it('creates application presentation through its view service and cleans up exact listeners', () => {
		const {controller, pages, registry, url, view} = setup();
		expect(controller.getComponent().type).toBe('div');
		expect(controller.getComponent({id: 'root'}).props.id).toBe('root');
		expect(view.calls).toEqual([{}, {id: 'root'}]);
		const stateChanged = jasmine.createSpy('state');
		controller.listen('state-changed', stateChanged);
		pages.add({id: 'one', controller: 'page-controller'});
		expect(stateChanged).toHaveBeenCalled();
		controller.stop();
		const count = stateChanged.calls.count();
		pages.fire('updated', pages.get());
		registry.fire('ready');
		url.fire('changed');
		expect(stateChanged.calls.count()).toBe(count);
		controller.stop();
	});
	it('preserves unknown URLs and reports a not-found shell state only after registration', () => {
		const {controller, pages, url} = setup();
		pages.add({id: 'home', default: true, controller: 'page-controller'});
		url.slug = 'missing';
		controller.registryReady = false;
		controller.reconcileLocation();
		expect(controller.getShellState().notFound).toBeFalse();
		controller.registryReady = true;
		controller.reconcileLocation();
		expect(controller.getShellState().notFound).toBeTrue();
		expect(controller.getShellState().activePageId).toBeNull();
	});
	it('delegates push, replace, and URL-owned selection without redundant history', () => {
		const {controller, pages, url} = setup();
		pages.add({id: 'home', label: 'Home', default: true, controller: 'page-controller'});
		expect(url.replaced).toEqual(['home']);
		pages.add({id: 'other', label: 'Other', controller: 'page-controller'});
		controller.requestPage('other');
		expect(url.pushed).toEqual(['other']);
		url.slug = 'home';
		url.fire('changed');
		expect(controller.getShellState().activePageId).toBe('home');
		expect(url.pushed).toEqual(['other']);
	});
});
