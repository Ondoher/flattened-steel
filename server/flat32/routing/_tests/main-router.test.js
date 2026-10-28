import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import express from 'express';
import {Registry} from '@polylith/core';
import {PolylithServer} from '@polylith/server';
import mainRouter from '../../index.js';
import {registry} from '../../registry.js';
import setupDeployment from '../../../setup-deployment.js';
import {Readable} from 'node:stream';

const repository = fileURLToPath(new URL('../../../../', import.meta.url));

/** Supply isolated local packages and a host error boundary, preserving environment state. */
async function fixture(t, usePolylith = false) {
	const directory = await mkdtemp(path.join(repository, '.codex-tmp', 'flat32-server-routes-'));
	const previousStellar = process.env.FLAT32_STELLAR_CATALOG_ROOT;
	const previousVision = process.env.FLAT32_HUMAN_VISION_FILTER_ROOT;
	t.after(async () => {
		if (previousStellar === undefined) delete process.env.FLAT32_STELLAR_CATALOG_ROOT;
		else process.env.FLAT32_STELLAR_CATALOG_ROOT = previousStellar;
		if (previousVision === undefined) delete process.env.FLAT32_HUMAN_VISION_FILTER_ROOT;
		else process.env.FLAT32_HUMAN_VISION_FILTER_ROOT = previousVision;
		for (let name of ['shared-cache', 'stellar-catalog', 'human-vision']) registry.subscribe(name).stop();
		assert.ok(path.resolve(directory).startsWith(path.join(repository, '.codex-tmp') + path.sep));
		await rm(directory, {recursive: true, force: true});
	});
	const stars = path.join(directory, 'stars');
	const vision = path.join(directory, 'vision');
	await mkdir(stars);
	await mkdir(vision);
	await writeFile(path.join(stars, 'payload.bin'), Buffer.from([5, 7, 9]));
	await writeFile(
		path.join(stars, 'manifest.json'),
		JSON.stringify({
			schemaId: 'algorithm32-production-brightest-2000-stellar-package-v1',
			packageId: 'brightest-2000-stellar-package-v1',
			artifacts: {payload: {path: 'payload.bin', byteLength: 3}},
		}),
	);
	await writeFile(path.join(vision, 'weights.json'), '{"weight":0.5}');
	process.env.FLAT32_STELLAR_CATALOG_ROOT = stars;
	process.env.FLAT32_HUMAN_VISION_FILTER_ROOT = vision;
	let shared = new Registry();
	await setupDeployment({sharedRegistry: shared}, true);
	let application;
	let listener;
	if (usePolylith) {
		let host = new PolylithServer({middleware: {urlencoded: {extended: false}}}, 'dist');
		await host.create(
			[
				{
					getRouterRoot: () => '/flat32',
					router: (expressApplication, router, suppliedRegistry) =>
						mainRouter(expressApplication, router, {getRouterRoot: () => '/flat32'}, suppliedRegistry),
				},
			],
			shared,
		);
		application = host.app;
		listener = host.server;
	} else {
		application = express();
		let router = express.Router();
		await mainRouter(application, router, {getRouterRoot: () => '/flat32'}, shared);
		application.use('/flat32', router);
	}
	application.get('/sibling/api', (_request, response) => response.json({sibling: true}));
	application.use((_error, _request, response, _next) => response.status(500).json({error: 'Asset request failed.'}));
	if (listener) listener.listen(0, '127.0.0.1');
	else listener = application.listen(0, '127.0.0.1');
	await new Promise((resolve) => listener.once('listening', resolve));
	t.after(async () => {
		listener.closeAllConnections();
		await new Promise((resolve) => listener.close(resolve));
	});
	return {directory, origin: `http://127.0.0.1:${listener.address().port}`, shared};
}

describe('Flat32 server composition', () => {
	it('keeps unexpected asset and stream failures opaque while retaining diagnostics', async (t) => {
		let {origin} = await fixture(t);
		let diagnostics = [];
		t.mock.method(console, 'error', (...values) => diagnostics.push(values));
		let capability = registry.subscribe('stellar-catalog');
		let replacement = t.mock.method(capability, 'openAsset', async () => {
			throw new Error('C:/private/server/input');
		});
		let response = await fetch(origin + '/flat32/stellar-catalogs/brightest-2000-stellar-package-v1/payload.bin');
		assert.equal(response.status, 500);
		assert.deepEqual(await response.json(), {error: 'Stellar catalog asset request failed.'});
		replacement.mock.mockImplementation(async () => ({
			stream: new Readable({
				read() {
					this.destroy(new Error('C:/private/server/stream'));
				},
			}),
			byteLength: 3,
			contentType: 'application/octet-stream',
		}));
		response = await fetch(origin + '/flat32/stellar-catalogs/brightest-2000-stellar-package-v1/payload.bin');
		assert.equal(response.status, 500);
		assert.deepEqual(await response.json(), {error: 'Stellar catalog asset request failed.'});
		assert.equal(diagnostics.length, 2);
		assert.match(diagnostics[0][1].message, /private/u);
	});
	it('requires the explicit installation registry before registering any routes', async () => {
		let routes = 0;
		await assert.rejects(
			mainRouter(
				null,
				{
					get: () => {
						routes += 1;
					},
				},
				{getRouterRoot: () => '/flat32'},
			),
			/shared registry/u,
		);
		assert.equal(routes, 0);
	});

	it('attaches the shared registry and preserves mount-specific routes through the Polylith host', async (t) => {
		let {origin, shared} = await fixture(t, true);
		assert.equal(registry.getAttached('shared'), shared);
		assert.deepEqual(registry.subscribe('routers').get(), [
			'shared-cache-router',
			'stellar-catalog-router',
			'human-vision-router',
		]);
		let selection = await fetch(origin + '/flat32/api/distant-sun-scene-cache?solarZenithDegrees=45');
		assert.equal(selection.status, 200);
		let result = await selection.json();
		assert.ok(result.asset.rootUrl.startsWith('/flat32/scene-caches/'));
		assert.equal((await fetch(origin + '/api/distant-sun-scene-cache?solarZenithDegrees=45')).status, 404);
		assert.deepEqual(await (await fetch(origin + '/sibling/api')).json(), {sibling: true});
	});

	it('streams catalogs and vision data with their retained cache and content headers', async (t) => {
		let {origin} = await fixture(t);
		let stars = await fetch(origin + '/flat32/stellar-catalogs/brightest-2000-stellar-package-v1/payload.bin');
		assert.equal(stars.status, 200);
		assert.equal(stars.headers.get('cache-control'), 'private, max-age=0, must-revalidate');
		assert.equal(stars.headers.get('content-type'), 'application/octet-stream');
		assert.deepEqual(Buffer.from(await stars.arrayBuffer()), Buffer.from([5, 7, 9]));
		let vision = await fetch(origin + '/flat32/presentation-filters/human-vision-filter-package-v1/weights.json');
		assert.equal(vision.status, 200);
		assert.match(vision.headers.get('content-type'), /application\/json/u);
		assert.deepEqual(await vision.json(), {weight: 0.5});
		assert.equal(
			(await fetch(origin + '/flat32/stellar-catalogs/brightest-2000-stellar-package-v1/missing.json')).status,
			404,
		);
	});

	it('returns 400 for malformed cache selection and leaves sibling routes available', async (t) => {
		let {origin} = await fixture(t);
		for (let query of [
			'',
			'?solarZenithDegrees=bad',
			'?solarZenithDegrees=181',
			'?solarZenithDegrees=45&extra=1',
		]) {
			assert.equal((await fetch(origin + '/flat32/api/distant-sun-scene-cache' + query)).status, 400);
		}
		assert.equal((await fetch(origin + '/sibling/api')).status, 200);
	});
});
