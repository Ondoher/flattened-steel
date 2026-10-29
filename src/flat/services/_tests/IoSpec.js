import {Registry, Service} from '@polylith/core';
import {IoService} from '../io.js';

describe('HTTP service', () => {
	let originalFetch;
	let base;
	let registry;
	let service;
	let context;

	beforeEach(() => {
		originalFetch = window.fetch;
		base = document.createElement('base');
		base.href = 'https://example.test/deployable-app/';
		document.head.append(base);
		registry = new Registry();
		class AppContextStub extends Service {
			constructor() {
				super('app-context', registry);
				this.implement(['get']);
				this.locale = 'en-US';
			}

			get() {
				return {locale: this.locale};
			}
		}
		context = new AppContextStub();
		service = new IoService(registry);
		service.ready();
	});

	afterEach(() => {
		window.fetch = originalFetch;
		base.remove();
	});

	it('resolves app routes below the deployment base and owns standard headers', async () => {
		window.fetch = jasmine.createSpy('fetch').and.resolveTo({ok: true});
		await service.request('/api/markdown/help', {body: '{}'});
		expect(window.fetch).toHaveBeenCalledWith('https://example.test/deployable-app/api/markdown/help', {
			body: '{}',
			headers: {
				Accept: 'application/json',
				'Accept-Language': 'en-US',
				'Content-Type': 'application/json',
			},
		});
	});

	it('preserves external URLs, permits header overrides, and omits content type without a body', async () => {
		window.fetch = jasmine.createSpy('fetch').and.resolveTo({ok: true});
		await service.request('https://api.example.test/items', {headers: {Accept: 'text/plain'}});
		expect(window.fetch).toHaveBeenCalledWith('https://api.example.test/items', {
			headers: {Accept: 'text/plain', 'Accept-Language': 'en-US'},
		});
	});

	it('uses the current canonical locale for each request after readiness', async () => {
		window.fetch = jasmine.createSpy('fetch').and.resolveTo({ok: true});
		await service.request('/api/items');
		context.locale = 'fr-CA';
		await service.request('/api/items');
		let requests = window.fetch.calls.allArgs();
		expect(requests[0][1].headers['Accept-Language']).toBe('en-US');
		expect(requests[1][1].headers['Accept-Language']).toBe('fr-CA');
	});

	it('logs transport failures and returns no response', async () => {
		const error = new Error('offline');
		window.fetch = jasmine.createSpy('fetch').and.rejectWith(error);
		spyOn(console, 'error');
		expect(await service.request('/api/items')).toBeNull();
		expect(console.error).toHaveBeenCalledWith(error);
	});
});
