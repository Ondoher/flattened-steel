import assert from 'node:assert/strict';
import test from 'node:test';
import {once} from 'node:events';
import {mkdir, mkdtemp, realpath, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import express from 'express';
import {Registry} from '@polylith/core';
import {RoutersService} from '../../../services/routers.js';
import {AppRouter} from '../index.js';

test('page routes follow relocated output and mount for static assets and deep-link refreshes', async () => {
	let repositoryRoot = fileURLToPath(new URL('../../../../../', import.meta.url));
	let outputRoot = await realpath(path.join(repositoryRoot, '.codex-tmp'));
	let fixture = await mkdtemp(path.join(outputRoot, 'flat-router-'));
	assert.ok((await realpath(fixture)).startsWith(outputRoot + path.sep));
	let indexFile = path.join(fixture, 'index.html');
	await writeFile(indexFile, '<base href="./" /><h1>Workspace</h1>');
	await mkdir(path.join(fixture, 'styles'));
	await writeFile(path.join(fixture, 'styles', 'app.css'), 'main { display: grid; }');
	try {
		for (let mount of ['/flat', '/group/flat']) {
			let registry = new Registry();
			let routers = new RoutersService(registry);
			routers.start();
			let service = new AppRouter(registry);
			service.ready();
			assert.deepEqual(routers.get(), ['app-router']);
			let host = express();
			let router = express.Router();
			service.routes(host, router, {getIndexFile: () => indexFile, getRouterRoot: () => mount});
			host.use(mount, router);
			host.get('/sibling', (_request, response) => response.send('sibling'));
			let server = host.listen(0, '127.0.0.1');
			await once(server, 'listening');
			let origin = 'http://127.0.0.1:' + server.address().port;
			try {
				for (let page of ['/workspace', '/workspace/', '/workspace/detail']) {
					let response = await fetch(origin + mount + page);
					assert.equal(response.status, 200);
					assert.equal(await response.text(), '<base href="' + mount + '/" /><h1>Workspace</h1>');
				}
				let stylesheet = await fetch(origin + mount + '/styles/app.css');
				assert.equal(stylesheet.status, 200);
				assert.equal(await stylesheet.text(), 'main { display: grid; }');
				for (let api of ['/api', '/api/missing']) assert.equal((await fetch(origin + mount + api)).status, 404);
				assert.equal(await (await fetch(origin + '/sibling')).text(), 'sibling');
			} finally {
				server.closeAllConnections();
				await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
			}
		}
	} finally {
		assert.ok((await realpath(fixture)).startsWith(outputRoot + path.sep));
		await rm(fixture, {recursive: true, force: true});
	}
});
