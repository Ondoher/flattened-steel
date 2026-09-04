import assert from 'node:assert/strict';
import test from 'node:test';

import {ProductionProgressCacheBackend} from './ProductionProgressCacheBackend.js';

function createBackend() {
	const compiled = [];
	const uploads = [];
	return {
		compiled,
		uploads,
		adapter: new ProductionProgressCacheBackend({
			backend: {
				id: 'test-backend',
				capabilities: {},
				compile(shader) {
					compiled.push(shader);
					return {id: shader.id, sourceHash: shader.sourceHash, dispose() {}};
				},
				uploadImmutableTexture(request) {
					uploads.push(request);
					return {id: request.id, dispose() {}};
				},
			},
			report() {},
		}),
	};
}

function createShader(directionCount) {
	return {
		id: `shader-${directionCount}`,
		sourceHash: `hash-${directionCount}`,
		source: `#define CACHE_INCOMING_DIRECTION_COUNT ${directionCount}
for (int incomingIndex = 0;
	incomingIndex < CACHE_INCOMING_DIRECTION_COUNT;
	++incomingIndex) {}`,
		bindings: [],
	};
}

test('retains ordinary production incoming loops unchanged', async () => {
	const backend = createBackend();
	const shader = createShader(34);

	await backend.adapter.compile(shader);

	assert.equal(backend.compiled.length, 1);
	assert.equal(backend.compiled[0], shader);
});

test('keeps Bruneton-scale incoming loops runtime-driven without changing their accepted count', async () => {
	const backend = createBackend();

	await backend.adapter.compile(createShader(512));

	assert.equal(backend.compiled.length, 1);
	assert.match(backend.compiled[0].sourceHash, /dynamic-incoming-loop-v1$/);
	assert.match(
		backend.compiled[0].source,
		/incomingIndex < \(a32CacheWavelengthLayer < 0 \? 0 : CACHE_INCOMING_DIRECTION_COUNT\)/,
	);
	assert.match(backend.compiled[0].source, /#define CACHE_INCOMING_DIRECTION_COUNT 512/);
});

test('delegates immutable asset uploads without invoking recurrence instrumentation', () => {
	const backend = createBackend();
	const request = {
		id: 'asset-field',
		storage: {format: 'R32F', width: 2, height: 1, layers: 1},
		values: new Float32Array([1, 2]),
		valueKey: 'cache.test',
	};

	const uploaded = backend.adapter.uploadImmutableTexture(request);

	assert.equal(backend.uploads.length, 1);
	assert.equal(backend.uploads[0], request);
	assert.equal(uploaded.id, request.id);
	assert.equal(backend.compiled.length, 0);
});
