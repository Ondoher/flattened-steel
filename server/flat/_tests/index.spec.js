import assert from 'node:assert/strict';
import test from 'node:test';
import {Registry} from '@polylith/core';
import path from 'node:path';
import mainRouter from '../index.js';

test('main router starts generated services and installs every owned route', async () => {
	const sharedRegistry = new Registry();
	const application = {
		getIndexFile: () => path.resolve('dist/flat/index.html'),
		getRouterRoot: () => '/flat',
	};
	const routes = [];
	const middleware = [];
	const router = {
		use(value) {
			middleware.push(value);
		},
		get(pattern) {
			routes.push(pattern);
		},
	};
	await assert.rejects(() => mainRouter(null, router, {}), /shared registry/);
	assert.equal(await mainRouter(null, router, application, sharedRegistry), true);
	assert.equal(middleware.length, 1);
	assert.deepEqual(routes, [
		'/stellar-catalogs/brightest-2000-stellar-package-v1/*',
		'/presentation-filters/human-vision-filter-package-v1/*',
		'/api/distant-sun-scene-cache',
		'/spherical-cache/*',
		'*',
	]);
});
