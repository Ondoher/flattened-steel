import {Registry} from '@polylith/core';
import {UrlService} from '../url.js';

describe('URL service', () => {
	let originalPath;
	let base;
	let service;

	beforeEach(() => {
		originalPath = location.pathname;
		base = document.createElement('base');
		base.href = '/deployable/';
		document.head.append(base);
		service = new UrlService(new Registry());
	});

	afterEach(() => {
		service.stop();
		history.replaceState({}, '', originalPath);
		base.remove();
	});

	it('parses root, app-relative, and outside paths', () => {
		history.replaceState({}, '', '/deployable');
		expect(service.getPageSlug()).toBe('');
		history.replaceState({}, '', '/deployable/hello%20world/detail');
		expect(service.getPageSlug()).toBe('hello world');
		history.replaceState({}, '', '/outside');
		expect(service.getPageSlug()).toBe('outside');
	});

	it('derives standalone and composed deployment roots from the document base', () => {
		base.href = '/';
		history.replaceState({}, '', '/home');
		expect(service.basePath()).toBe('');
		expect(service.getPageSlug()).toBe('home');
		expect(service.pathForSlug('other')).toBe('/other');
		base.href = '/deployable/';
		history.replaceState({}, '', '/deployable/home');
		expect(service.basePath()).toBe('/deployable');
		expect(service.getPageSlug()).toBe('home');
		expect(service.pathForSlug('other')).toBe('/deployable/other');
	});

	it('builds and writes normalized paths without redundant history', () => {
		expect(service.pathForSlug()).toBe('/deployable/');
		expect(service.pathForSlug('/hello world/')).toBe('/deployable/hello%20world');
		spyOn(history, 'pushState').and.callThrough();
		spyOn(history, 'replaceState').and.callThrough();
		service.pushPageSlug('home');
		expect(history.pushState).toHaveBeenCalled();
		service.pushPageSlug('home');
		expect(history.pushState).toHaveBeenCalledTimes(1);
		service.replacePageSlug('other');
		expect(history.replaceState).toHaveBeenCalled();
	});

	it('publishes popstate changes and removes its listener', () => {
		const changed = jasmine.createSpy('changed');
		service.listen('changed', changed);
		service.ready();
		service.ready();
		history.replaceState({}, '', '/deployable/home');
		window.dispatchEvent(new PopStateEvent('popstate'));
		expect(changed).toHaveBeenCalledWith({pageSlug: 'home'});
		service.stop();
		window.dispatchEvent(new PopStateEvent('popstate'));
		expect(changed).toHaveBeenCalledTimes(1);
		service.stop();
	});
});
