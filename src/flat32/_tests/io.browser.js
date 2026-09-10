import {registry} from '@polylith/core';
import '../services/io.js';

function ioService() {
	const io = registry.subscribe('io');
	if (io === undefined) throw new Error('Flat32 io test requires the registered service.');
	return io;
}

describe('Flat32Io', () => {
	let priorAppContext;

	beforeEach(() => {
		priorAppContext = registry.subscribe('app-context');
		registry.unregister('app-context');
	});

	afterEach(() => {
		registry.unregister('app-context');
		if (priorAppContext !== undefined) registry.register('app-context', priorAppContext);
	});

	it('owns JSON request headers, feature data, locale, and cancellation', async () => {
		let capturedRoute = null;
		let capturedOptions = null;
		const controller = new AbortController();
		const io = ioService();
		registry.register('app-context', {get: () => ({locale: 'fr-CA'})});
		spyOn(globalThis, 'fetch').and.callFake(async (route, options) => {
			capturedRoute = route;
			capturedOptions = options;
			return new Response(JSON.stringify({accepted: true}), {status: 200});
		});

		const value = await io.requestJson({
			method: 'POST',
			route: '/api/example',
			data: {scene: 12},
			signal: controller.signal,
		});
		const headers = new Headers(capturedOptions.headers);

		expect(value).toEqual({accepted: true});
		expect(capturedRoute).toBe('/api/example');
		expect(capturedOptions.method).toBe('POST');
		expect(capturedOptions.body).toBe('{"scene":12}');
		expect(capturedOptions.signal).toBe(controller.signal);
		expect(headers.get('accept')).toBe('application/json');
		expect(headers.get('accept-language')).toBe('fr-CA');
		expect(headers.get('content-type')).toBe('application/json');
	});

	it('uses the fallback locale and omits content metadata for bodyless requests', async () => {
		let capturedOptions = null;
		const io = ioService();
		spyOn(globalThis, 'fetch').and.callFake(async (_route, options) => {
			capturedOptions = options;
			return new Response('null', {status: 200});
		});

		await io.requestJson({method: 'GET', route: new URL('/api/example', globalThis.location.href)});
		const headers = new Headers(capturedOptions.headers);

		expect(capturedOptions.body).toBeUndefined();
		expect(headers.get('accept-language')).toBe('en-US');
		expect(headers.has('content-type')).toBeFalse();
	});

	it('rejects invalid requests and unstable locale values before fetch', async () => {
		const io = ioService();

		await expectAsync(io.requestJson({method: 'TRACE', route: '/api/example'})).toBeRejectedWithError(/method/u);
		await expectAsync(io.requestJson({method: 'GET', route: ''})).toBeRejectedWithError(/route/u);
		await expectAsync(io.requestJson({method: 'GET', route: '/api/example', signal: {}})).toBeRejectedWithError(
			/signal/u,
		);
		registry.register('app-context', {get: () => ({locale: 42})});
		await expectAsync(io.requestJson({method: 'GET', route: '/api/example'})).toBeRejectedWithError(/locale/u);
	});

	it('reports stable HTTP and malformed-JSON failures', async () => {
		const io = ioService();
		const fetchSpy = spyOn(globalThis, 'fetch').and.resolveTo(new Response('{}', {status: 503}));
		await expectAsync(io.requestJson({method: 'GET', route: '/api/example'})).toBeRejectedWithError(/HTTP 503/u);

		fetchSpy.and.resolveTo(new Response('{', {status: 200}));
		await expectAsync(io.requestJson({method: 'GET', route: '/api/example'})).toBeRejectedWithError(
			/malformed JSON/u,
		);
	});
});
