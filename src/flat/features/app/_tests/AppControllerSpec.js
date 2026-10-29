import React from 'react';
import {Registry, Service} from '@polylith/core';
import {AppPagesService} from '../../../services/app-pages.js';
import {AppController} from '../controller.js';

class WorkspaceStub extends Service {
	constructor(registry) {
		super('workspace-controller', registry);
		this.implement(['mount', 'unmount', 'mountPage', 'clearPrimary', 'getPrimaryViewId']);
		this.activations = 0;
		this.releases = 0;
		this.selections = [];
		this.cleared = [];
	}

	mount() {
		this.activations++;
		return React.createElement('main', null, 'Provided workspace');
	}

	unmount() {
		this.releases++;
	}

	mountPage(pageId, viewId) {
		this.selections.push({pageId, viewId});
		return this.registry.subscribe('app-pages').getById(pageId);
	}

	clearPrimary(notFound) {
		this.cleared.push(notFound);
	}

	getPrimaryViewId() {
		return 'primary';
	}
}
class UrlStub extends Service {
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
		this.slug = slug;
		this.pushed.push(slug);
	}

	replacePageSlug(slug) {
		this.slug = slug;
		this.replaced.push(slug);
	}
}
class ViewStub extends Service {
	constructor(registry) {
		super('app-view', registry);
		this.implement(['getComponent']);
	}

	getComponent() {
		return React.createElement('div');
	}
}
class ContextStub extends Service {
	constructor(registry) {
		super('app-context', registry);
		this.implement(['get']);
		this.value = {locale: 'en-US'};
	}

	get() {
		return {...this.value};
	}
}
describe('application activation and routing', () => {
	let registry, pages, workspace, url, controller, context;
	beforeEach(() => {
		registry = new Registry();
		pages = new AppPagesService(registry);
		pages.start();
		context = new ContextStub(registry);
		workspace = new WorkspaceStub(registry);
		url = new UrlStub(registry);
		new ViewStub(registry);
		controller = new AppController(registry);
		controller.start();
		controller.ready();
	});
	afterEach(() => controller.stop());
	it('publishes canonical context changes and releases the exact context listener', () => {
		controller.activate();
		let changed = jasmine.createSpy('changed');
		controller.listen('state-changed', changed);
		context.value = {locale: 'changed'};
		context.fire('changed');
		expect(changed.calls.mostRecent().args[0].context.locale).toBe('changed');
		controller.stop();
		let count = changed.calls.count();
		context.fire('changed');
		expect(changed.calls.count()).toBe(count);
	});
	it('waits for executor activation and obtains workspace content through its public capability', () => {
		expect(workspace.activations).toBe(0);
		expect(controller.getState().content).toBeNull();
		controller.activate();
		controller.activate();
		expect(workspace.activations).toBe(1);
		expect(controller.getState().content.props.children).toBe('Provided workspace');
		expect(controller.getComponent().type).toBe('div');
	});
	it('does not infer a first page and preserves unknown routes', () => {
		pages.add({id: 'optional', controller: 'any'});
		controller.activate();
		expect(workspace.selections).toEqual([]);
		expect(workspace.cleared).toEqual([false]);
		url.slug = 'missing';
		url.fire('changed');
		expect(workspace.cleared).toEqual([false, true]);
		expect(url.slug).toBe('missing');
	});
	it('routes an explicit default, back/forward, and root refresh without duplicate history', () => {
		pages.add({id: 'home', default: true, controller: 'any'});
		pages.add({id: 'other', controller: 'any'});
		controller.activate();
		expect(url.replaced).toEqual(['home']);
		controller.requestPage('other');
		expect(url.pushed).toEqual(['other']);
		url.slug = 'home';
		url.fire('changed');
		expect(url.pushed).toEqual(['other']);
		url.slug = '';
		url.fire('changed');
		expect(url.replaced).toEqual(['home', 'home']);
	});
	it('keeps secondary selection outside browser history and ignores repeated primary navigation', () => {
		pages.add({id: 'home', default: true, controller: 'any'});
		pages.add({id: 'other', controller: 'any'});
		controller.activate();
		controller.requestPage('other', {viewId: 'secondary'});
		expect(url.pushed).toEqual([]);
		expect(workspace.selections.at(-1)).toEqual({pageId: 'other', viewId: 'secondary'});
		controller.requestPage('other', {viewId: 'primary'});
		controller.requestPage('other', {viewId: 'primary'});
		expect(url.pushed).toEqual(['other']);
	});
	it('releases routing listeners and the activated feature exactly once', () => {
		controller.activate();
		let selections = workspace.selections.length;
		let cleared = workspace.cleared.length;
		controller.stop();
		controller.stop();
		url.fire('changed');
		pages.fire('updated');
		expect(workspace.releases).toBe(1);
		expect(workspace.selections.length).toBe(selections);
		expect(workspace.cleared.length).toBe(cleared);
		expect(controller.getState().content).toBeNull();
	});
});
