import assert from 'node:assert/strict';
import test from 'node:test';
import {Registry} from '@polylith/core';
import {RoutersService} from '../routers.js';
test('routers preserve registration order and place the final router last', () => {
	const service = new RoutersService(new Registry());
	service.start();
	assert.deepEqual(service.get(), []);
	service.add('first');
	service.add('second');
	assert.deepEqual(service.get(), ['first', 'second']);
	service.setLast('final');
	assert.deepEqual(service.get(), ['first', 'second', 'final']);
});
test('routers reject duplicate and multiple final configuration', () => {
	const service = new RoutersService(new Registry());
	service.start();
	service.add('first');
	assert.throws(() => service.add('first'), /Duplicate/);
	assert.throws(() => service.setLast('first'), /Only one/);
	service.setLast('final');
	assert.throws(() => service.setLast('other'), /Only one/);
	assert.throws(() => service.add('final'), /Duplicate/);
});
