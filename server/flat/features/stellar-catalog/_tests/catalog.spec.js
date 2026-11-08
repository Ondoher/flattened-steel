import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import {mkdir, mkdtemp, readFile, realpath, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import express from 'express';
import {Registry} from '@polylith/core';
import {StellarCatalog} from '../catalog.js';
import {StellarCatalogRouter} from '../../../routing/stellar-catalog-router.js';
import {RoutersService} from '../../../services/routers.js';

test('authenticates complete operational packages, rejects corrupt/traversing assets, retries and serves each app mount', async () => {
	let repository = fileURLToPath(new URL('../../../../../', import.meta.url));
	let output = path.join(repository, '.codex-tmp', 'flat-stars');
	await mkdir(output, {recursive: true});
	let root = await mkdtemp(path.join(output, 'catalog-test-'));
	assert.ok((await realpath(root)).startsWith((await realpath(output)) + path.sep));
	let manifest = {
		schemaId: 'algorithm32-production-brightest-2000-stellar-package-v1',
		packageId: 'brightest-2000-stellar-package-v1',
		memberCount: 2000,
		spectralChannelCount: 15,
		artifacts: {},
	};
	for (let key of ['roster', 'packets', 'members', 'spectra']) {
		let bytes = Buffer.from(key);
		let name = key + (key === 'roster' || key === 'packets' ? '.json' : '.bin');
		manifest.artifacts[key] = {
			path: name,
			byteLength: bytes.length,
			sha256: createHash('sha256').update(bytes).digest('hex'),
		};
		await writeFile(path.join(root, name), bytes);
	}
	let saveManifest = () => writeFile(path.join(root, 'manifest.json'), JSON.stringify(manifest));
	await saveManifest();
	let humanRoot = path.join(root, 'human');
	await mkdir(humanRoot);
	let weights = Buffer.from(JSON.stringify({values: Array(15).fill(1)}));
	let humanManifest = {
		schemaId: 'algorithm32-production-human-vision-filter-package-v1',
		packageId: 'human-vision-filter-package-v1',
		artifact: {
			path: 'weights.json',
			byteLength: weights.length,
			sha256: createHash('sha256').update(weights).digest('hex'),
		},
	};
	await writeFile(path.join(humanRoot, 'manifest.json'), JSON.stringify(humanManifest));
	await writeFile(path.join(humanRoot, 'weights.json'), weights);
	let registry = new Registry();
	let catalog = new StellarCatalog(registry, root, humanRoot);
	let routers = new RoutersService(registry);
	let routerService = new StellarCatalogRouter(registry);
	let server;
	try {
		catalog.start();
		let pending = catalog.load();
		assert.equal(catalog.load(), pending);
		assert.equal((await pending).size, 5);
		let humanPending = catalog.load('human-vision');
		assert.equal(catalog.load('human-vision'), humanPending);
		assert.equal((await humanPending).size, 2);
		assert.notEqual(humanPending, pending);
		catalog.start();
		await writeFile(path.join(root, 'members.bin'), 'corrupt');
		await assert.rejects(catalog.load(), /failed authentication/);
		await writeFile(path.join(root, 'members.bin'), 'members');
		assert.equal((await catalog.load()).size, 5);
		catalog.start();
		manifest.artifacts.roster.path = '../outside.json';
		await saveManifest();
		await assert.rejects(catalog.load(), /invalid artifact filename/);
		manifest.artifacts.roster.path = 'roster.json';
		await saveManifest();
		routers.start();
		routerService.ready();
		routers.setLast('app-router');
		assert.deepEqual(routers.get(), ['stellar-catalog-router', 'app-router']);
		let app = express();
		for (let mount of ['/flat', '/group/flat']) {
			let router = express.Router();
			routerService.routes(app, router);
			app.use(mount, router);
		}
		server = app.listen(0, '127.0.0.1');
		await once(server, 'listening');
		let origin = 'http://127.0.0.1:' + server.address().port;
		for (let mount of ['/flat', '/group/flat']) {
			let base = origin + mount + '/stellar-catalogs/brightest-2000-stellar-package-v1/';
			let humanBase = origin + mount + '/presentation-filters/human-vision-filter-package-v1/';
			assert.equal((await fetch(humanBase + 'manifest.json')).status, 200);
			assert.deepEqual(Buffer.from(await (await fetch(humanBase + 'weights.json')).arrayBuffer()), weights);
			assert.equal((await fetch(humanBase + '..%2Fmanifest.json')).status, 404);
			assert.equal((await fetch(humanBase + 'unknown.json')).status, 404);
			let response = await fetch(base + 'members.bin');
			assert.equal(response.status, 200);
			assert.equal(response.headers.get('content-type'), 'application/octet-stream');
			assert.equal(await response.text(), 'members');
			assert.equal((await fetch(base + 'manifest.json')).status, 200);
			assert.equal((await fetch(base + 'unknown.bin')).status, 404);
			assert.equal((await fetch(base + '..%2Fprivate.json')).status, 404);
		}
		catalog.start();
		await writeFile(path.join(root, 'spectra.bin'), 'bad');
		let diagnostic = console.error;
		let logs = [];
		console.error = (...args) => logs.push(args);
		try {
			let response = await fetch(
				origin + '/flat/stellar-catalogs/brightest-2000-stellar-package-v1/manifest.json',
			);
			assert.equal(response.status, 503);
			assert.deepEqual(await response.json(), {error: 'stellar-catalog-unavailable'});
			assert.equal(logs.length, 1);
			catalog.start();
			await writeFile(path.join(humanRoot, 'weights.json'), 'corrupt');
			let humanResponse = await fetch(
				origin + '/flat/presentation-filters/human-vision-filter-package-v1/manifest.json',
			);
			assert.equal(humanResponse.status, 503);
			assert.deepEqual(await humanResponse.json(), {error: 'stellar-catalog-unavailable'});
		} finally {
			console.error = diagnostic;
		}
		assert.equal((await readFile(path.join(root, 'spectra.bin'))).toString(), 'bad');
	} finally {
		if (server) {
			server.closeAllConnections();
			await new Promise((resolve) => server.close(resolve));
		}
		await rm(root, {recursive: true, force: true});
	}
});
