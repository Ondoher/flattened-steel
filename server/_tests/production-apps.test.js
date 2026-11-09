import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {mkdir, mkdtemp, readFile, realpath, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, it} from 'node:test';
import {Registry} from '@polylith/core';
import {PolylithServer} from '@polylith/server';
import {getLocalEffectiveAppSpecs, normalizeAppSources, readDiscoveredAppSources} from 'polylith/bin/app-sources.js';
import {AppRouter} from '../flat/features/app/index.js';

let repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
let config = JSON.parse(await readFile(new URL('../../polylith.json', import.meta.url), 'utf8'));
let development = JSON.parse(await readFile(new URL('../../polylith.development.json', import.meta.url), 'utf8'));

describe('production application exposure', () => {
	for (let environment of ['prod', 'production']) {
		it(`rejects the Flat32 development launcher with NODE_ENV=${environment}`, () => {
			let result = spawnSync(process.execPath, ['scripts/flat32/development.js', 'serve', 'flat32'], {
				cwd: repositoryRoot,
				env: {...process.env, NODE_ENV: environment},
				encoding: 'utf8',
				windowsHide: true,
			});
			assert.ifError(result.error);
			assert.equal(result.status, 1);
			assert.match(result.stderr, /Flat32 is a local integration test bed and cannot run in production/u);
		});
	}

	it('publishes only Flat for standalone and parent discovery, with Flat32 explicitly local', async () => {
		assert.deepEqual(
			getLocalEffectiveAppSpecs(config, repositoryRoot).map((app) => app.name),
			['flat'],
		);
		let parentRoot = path.resolve(repositoryRoot, '.codex-tmp/production-parent');
		let sources = await readDiscoveredAppSources(
			[
				{
					appRoot: repositoryRoot.replaceAll('\\', '/'),
					configPath: path.join(repositoryRoot, 'polylith.json'),
					discoveryRoot: path.dirname(repositoryRoot),
				},
			],
			{serverRoot: parentRoot, dest: 'dist'},
		);
		let discovered = normalizeAppSources(sources, {serverRoot: parentRoot, dest: 'dist'});
		assert.deepEqual(
			discovered.map((app) => app.name),
			['flat'],
		);
		assert.equal(discovered[0].mount, '/flat');
		assert.ok(discovered[0].effectiveDest.endsWith('dist/flat'));
		assert.deepEqual(
			getLocalEffectiveAppSpecs({...config, ...development}, repositoryRoot).map((app) => app.name),
			['flat32', 'flat'],
		);
	});

	it('serves Flat while returning 404 for Flat32 pages, assets and APIs even with stale output', async () => {
		let temporaryRoot = path.join(repositoryRoot, '.codex-tmp');
		await mkdir(temporaryRoot, {recursive: true});
		let fixture = await mkdtemp(path.join(temporaryRoot, 'production-apps-'));
		let host;
		try {
			await mkdir(path.join(fixture, 'dist/flat'), {recursive: true});
			await mkdir(path.join(fixture, 'dist/flat32'), {recursive: true});
			let indexFile = path.join(fixture, 'dist/flat/index.html');
			await writeFile(indexFile, '<base href="./" /><h1>Flat</h1>');
			await writeFile(path.join(fixture, 'dist/flat/flat.js'), 'window.productionFlat = true;');
			await writeFile(path.join(fixture, 'dist/flat32/index.html'), 'stale Flat32 page');
			await writeFile(path.join(fixture, 'dist/flat32/flat32.js'), 'stale Flat32 bundle');
			let registry = new Registry();
			let pageRouter = new AppRouter(registry);
			let app = {
				getRouterRoot: () => '/flat',
				getIndexFile: () => indexFile,
				router: async (express, router) => {
					pageRouter.routes(express, router, app);
					return true;
				},
			};
			host = new PolylithServer(config, config.dest);
			host.root = fixture.replaceAll('\\', '/');
			await host.create([app], registry);
			host.server.listen(0, '127.0.0.1');
			await once(host.server, 'listening');
			let origin = 'http://127.0.0.1:' + host.server.address().port;
			for (let resource of ['/flat/', '/flat/workspace', '/flat/flat.js']) {
				assert.equal((await fetch(origin + resource)).status, 200, resource);
			}
			for (let resource of [
				'/flat32',
				'/flat32/',
				'/flat32/index.html',
				'/flat32/flat32.js',
				'/flat32/api/distant-sun-scene-cache?solarZenithDegrees=90',
				'/flat32/stellar-catalogs/brightest-2000-stellar-package-v1/manifest.json',
			]) {
				assert.equal((await fetch(origin + resource)).status, 404, resource);
			}
		} finally {
			if (host?.server.listening) {
				host.server.closeAllConnections();
				await new Promise((resolve, reject) =>
					host.server.close((error) => (error ? reject(error) : resolve())),
				);
			}
			assert.equal(path.dirname(await realpath(fixture)), await realpath(temporaryRoot));
			await rm(fixture, {recursive: true, force: true});
		}
	});
});
