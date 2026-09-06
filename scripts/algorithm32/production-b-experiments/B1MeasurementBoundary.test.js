import assert from 'node:assert/strict';
import test from 'node:test';

import {
	B1_FIGURE_COLOR_CONTROL,
	B1_PHYSICAL_MEASUREMENT_BOUNDARY,
	requireB1FigureColorControl,
	requireB1PhysicalMeasurementBoundary,
	requireB1PhysicalMeasurementShader,
} from './B1MeasurementBoundary.js';

test('keeps physical scoring native-spectral and excludes every display contribution', () => {
	assert.equal(requireB1PhysicalMeasurementBoundary(B1_PHYSICAL_MEASUREMENT_BOUNDARY).spectralChannelCount, 40);
	assert.deepEqual(B1_PHYSICAL_MEASUREMENT_BOUNDARY.gpuReadback, {
		format: 'RGBA32F',
		channelsPerPass: 4,
		passCount: 10,
	});
	for (const mutation of [
		{...B1_PHYSICAL_MEASUREMENT_BOUNDARY, colorDisplayModel: 'color-reset-slope-078-p9'},
		{...B1_PHYSICAL_MEASUREMENT_BOUNDARY, displayEncoding: 'srgb'},
		{...B1_PHYSICAL_MEASUREMENT_BOUNDARY, toneMapping: 'aces'},
		{...B1_PHYSICAL_MEASUREMENT_BOUNDARY, stellarPresentationFilters: ['human-mesopic-luminance-v1']},
	]) {
		assert.throws(() => requireB1PhysicalMeasurementBoundary(mutation), /native-spectral and Color-free/u);
	}
});

test('rejects Color and presentation code at the physical shader boundary', () => {
	const nativeReadout = `uniform int uB1SpectralChannelBase;
state.outputRgba = vec4(state.pathRadiance.channels[uB1SpectralChannelBase]);
outColor = state.outputRgba;`;
	assert.equal(requireB1PhysicalMeasurementShader(nativeReadout), nativeReadout);
	for (const forbidden of [
		'uColorReset',
		'colorResetDisplayGain',
		'humanMesopic',
		'stellarPresentation',
		'toneMapping',
	]) {
		assert.throws(
			() => requireB1PhysicalMeasurementShader(`${nativeReadout}\nfloat ${forbidden};`),
			/Color, encoding, tone, or presentation/u,
		);
	}
});

test('keeps Basic Bruneton separate and figure-only', () => {
	assert.equal(requireB1FigureColorControl(B1_FIGURE_COLOR_CONTROL).selectionId, 'basic-bruneton');
	assert.equal(B1_FIGURE_COLOR_CONTROL.artifactCount, 6);
	assert.equal(B1_FIGURE_COLOR_CONTROL.participatesInPhysicalScoring, false);
	assert.throws(
		() => requireB1FigureColorControl({...B1_FIGURE_COLOR_CONTROL, selectionId: 'color-reset-slope-078-p9'}),
		/Basic Bruneton/u,
	);
});
