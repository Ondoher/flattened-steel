import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {Registry} from '@polylith/core';
import {RoutersService} from '../routers.js';

describe('server router contributions', () => {
	it('preserves ordinary order and mounts the final fallback last', async () => {
		let registry = new Registry();
		let routers = new RoutersService(registry);
		await registry.start();
		routers.setLast('app-router');
		routers.add('cache-router');
		routers.add('catalog-router');
		assert.deepEqual(routers.get(), ['cache-router', 'catalog-router', 'app-router']);
		let snapshot = routers.get();
		snapshot.pop();
		assert.equal(routers.get().length, 3);
	});

	it('rejects duplicate names, empty identifiers and multiple final fallbacks', () => {
		let routers = new RoutersService(new Registry());
		routers.start();
		for (let value of ['', ' ', null, 3]) assert.throws(() => routers.add(value), /name is required/u);
		routers.add('cache-router');
		assert.throws(() => routers.add('cache-router'), /Duplicate/u);
		assert.throws(() => routers.setLast('cache-router'), /Duplicate/u);
		routers.setLast('app-router');
		assert.throws(() => routers.add('app-router'), /Duplicate/u);
		assert.throws(() => routers.setLast('another-app-router'), /Only one/u);
	});

	it('keeps separate app registries independent and clears contributions on restart', async () => {
		let firstRegistry = new Registry();
		let secondRegistry = new Registry();
		let first = new RoutersService(firstRegistry);
		let second = new RoutersService(secondRegistry);
		await firstRegistry.start();
		await secondRegistry.start();
		first.add('same-local-name');
		second.add('same-local-name');
		await firstRegistry.start();
		assert.deepEqual(first.get(), []);
		assert.deepEqual(second.get(), ['same-local-name']);
	});
});
