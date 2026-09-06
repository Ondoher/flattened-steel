import assert from 'node:assert/strict';
import test from 'node:test';
import {
	BIN_WIDTH_NM,
	CANONICAL_BASIS,
	CANONICAL_UNIT,
	CASES,
	WAVELENGTHS_NM,
	admitCanonical,
	evaluateCase,
	runExperiment,
} from './run.js';
test('canonical grid has exact declared size, order, and width', () => {
	assert.equal(WAVELENGTHS_NM.length, 15);
	assert.equal(BIN_WIDTH_NM, 31.333333333333332);
	assert.ok(WAVELENGTHS_NM.every((v, i) => i === 0 || v > WAVELENGTHS_NM[i - 1]));
});
test('all fifteen basis responses agree between independent paths', () =>
	CASES.slice(0, 15).forEach((c) => assert.ok(evaluateCase(c).accepted)));
test('arbitrary linear combinations agree', () =>
	['positive-combination', 'signed-combination'].forEach((id) =>
		assert.ok(evaluateCase(CASES.find((c) => c.id === id)).accepted),
	));
test('unitless and incompatible packets are rejected', () => {
	assert.throws(() =>
		admitCanonical({
			values: Array(15).fill(0),
			basis: CANONICAL_BASIS,
			sampleSemantics: 'bin-average spectral radiance density',
		}),
	);
	assert.throws(() =>
		admitCanonical({
			values: Array(15).fill(0),
			unit: CANONICAL_UNIT,
			basis: 'wrong',
			sampleSemantics: 'bin-average spectral radiance density',
		}),
	);
});
test('basis reconstruction, exactly-once width, and label invariance hold', () => {
	const r = runExperiment();
	assert.ok(r.basisReconstruction.accepted);
	assert.ok(r.binWidthOnce);
	assert.ok(r.labelInvariance.accepted);
});
test('nonlinear policy exposes negative clamp and bounded final output', () => {
	const r = runExperiment();
	assert.ok(r.negativeObserved);
	for (const item of r.results.filter((v) => v.kind === 'projection'))
		assert.ok(item.a.displayRgb.every((v) => v >= 0 && v <= 1));
});
test('the complete E8 experiment accepts', () => assert.ok(runExperiment().accepted));
