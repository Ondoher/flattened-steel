import assert from 'node:assert/strict';
import test from 'node:test';
import {CASES, COMPONENTS, compose, evaluateCase, runExperiment} from './run.js';
test('each isolated component passes through unchanged', () =>
	Object.entries(COMPONENTS).forEach(([name, packet]) =>
		assert.deepEqual(evaluateCase(CASES.find((c) => c.id === `isolated-${name}`)).observed, packet),
	));
test('combined and reordered components agree', () => assert.ok(runExperiment().ordering.accepted));
test('isolated component results close to the combined spectrum', () => assert.ok(runExperiment().isolation.accepted));
test('scaled component inputs remain linear', () =>
	assert.ok(evaluateCase(CASES.find((c) => c.id === 'scaled')).accepted));
test('the composition boundary returns spectral data and performs no display transform', () =>
	CASES.forEach((c) => {
		const r = evaluateCase(c);
		assert.equal(r.outputDataType, 'spectral radiance density');
		assert.equal(r.displayTransformCount, 0);
	}));
test('invalid component packets are rejected', () =>
	assert.throws(() => compose([{name: 'bad', values: [1], scale: 1}])));
test('the complete E7 experiment accepts', () => assert.ok(runExperiment().accepted));
