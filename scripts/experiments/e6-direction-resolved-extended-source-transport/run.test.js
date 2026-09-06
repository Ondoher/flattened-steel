import assert from 'node:assert/strict';
import test from 'node:test';
import {CASES, evaluateCase, integrateDirections, runExperiment} from './run.js';
const byId = (id) => CASES.find((c) => c.id === id);
test('fully blocked directions contribute zero', () =>
	assert.ok(evaluateCase(byId('fully-blocked')).observed.every((v) => v === 0)));
test('all declared transport cases match the independent channel oracle', () =>
	CASES.forEach((c) => assert.ok(evaluateCase(c).accepted)));
test('direction order does not change the integrated spectrum', () => assert.ok(runExperiment().permutation.accepted));
test('changing one direction produces exactly its weighted contribution delta', () =>
	assert.ok(runExperiment().oneDirectionDelta.accepted));
test('the integrator rejects invalid boundary data', () =>
	assert.throws(() =>
		integrateDirections([{id: 'bad', radiance: [1], transmittance: [1], weight: 1, visibility: 1}]),
	));
test('the complete E6 experiment accepts', () => assert.ok(runExperiment().accepted));
