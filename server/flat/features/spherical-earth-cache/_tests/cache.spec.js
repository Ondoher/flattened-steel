import assert from 'node:assert/strict';
import test from 'node:test';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import express from 'express';
import {Registry} from '@polylith/core';
import {RoutersService} from '../../../services/routers.js';
import {SphericalCache} from '../cache.js';
import {SphericalCacheRouter} from '../../../routing/spherical-earth-cache-router.js';

/**
 * Call this function to serve one independently mounted cache capability.
 *
 * @param {string} mount - Effective application mount.
 * @param {string} [root] - Explicit operational package directory.
 * @returns {Promise<object>} - Test-owned host and origin.
 */
async function serve(mount, root) {
	const registry = new Registry(),
		routers = new RoutersService(registry);
	routers.start();
	new SphericalCache(registry, root);
	const service = new SphericalCacheRouter(registry);
	service.ready();
	assert.deepEqual(routers.get(), ['spherical-earth-cache-router']);
	const app = express(),
		router = express.Router();
	service.routes(app, router, {getRouterRoot: () => mount});
	app.use(mount, router);
	const server = app.listen(0, '127.0.0.1');
	await once(server, 'listening');
	return {server, origin: 'http://127.0.0.1:' + server.address().port + mount};
}

/**
 * Call this function to close the exact test host and all keepalive connections.
 *
 * @param {object} server - Test-owned HTTP server.
 * @returns {Promise<void>} - Completed retirement.
 */
async function close(server) {
	server.closeAllConnections();
	await new Promise((resolve) => server.close(resolve));
}

test('Flat independently resolves and serves authenticated metadata at standalone and composed mounts', async () => {
	for (const mount of ['/flat', '/group/flat']) {
		const {server, origin} = await serve(mount);
		try {
			const response = await fetch(origin + '/api/distant-sun-scene-cache?solarZenithDegrees=20');
			assert.equal(response.status, 200);
			const selection = await response.json();
			assert.equal(selection.status, 'ready');
			assert.ok(selection.asset.rootUrl.startsWith(mount + '/spherical-cache/'));
			assert.ok(!selection.asset.rootUrl.includes('flat32'));
			const metadata = await fetch(new URL(selection.asset.rootUrl + selection.asset.report.path, origin));
			assert.equal(metadata.status, 200);
			assert.equal((await metadata.arrayBuffer()).byteLength, selection.asset.report.byteLength);
			assert.equal(metadata.headers.get('accept-ranges'), 'none');
			assert.equal((await fetch(origin + '/api/distant-sun-scene-cache?solarZenithDegrees=108')).status, 200);
			for (const query of [
				'',
				'?solarZenithDegrees=no',
				'?solarZenithDegrees=-1',
				'?solarZenithDegrees=20&other=1',
				'?solarZenithDegrees=20&solarZenithDegrees=21',
			]) {
				assert.equal((await fetch(origin + '/api/distant-sun-scene-cache' + query)).status, 400);
			}
			assert.equal((await fetch(new URL(selection.asset.rootUrl + 'missing.json', origin))).status, 404);
		} finally {
			await close(server);
		}
	}
});

test('missing operational data is unavailable and diagnostics remain server-side', async () => {
	const previous = console.error,
		diagnostics = [];
	console.error = (...args) => diagnostics.push(args);
	const {server, origin} = await serve(
		'/flat',
		fileURLToPath(new URL('./missing-operational-package/', import.meta.url)),
	);
	try {
		const response = await fetch(origin + '/api/distant-sun-scene-cache?solarZenithDegrees=20');
		assert.equal(response.status, 503);
		assert.deepEqual(await response.json(), {error: 'spherical-cache-unavailable'});
		assert.equal(diagnostics.length, 1);
	} finally {
		console.error = previous;
		await close(server);
	}
});
