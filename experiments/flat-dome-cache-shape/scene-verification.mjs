import assert from 'node:assert/strict';
import {color} from './color.mjs';
import {column} from './direct.mjs';
import {interval} from './geometry.mjs';
import {medium} from './physical.mjs';

/**
 * Checks independent geometry, spectral composition, display, and live cache reuse.
 *
 * @param {DomeSceneTelemetry} telemetry - Retained actual browser observations.
 * @param {DomeSceneRequest} request - Frozen camera/cache/endpoint inputs.
 * @returns {Record<string, unknown>} - Measured discrepancies and required invariants.
 */
export function verifyScene(telemetry, request) {
	const cameraControls = telemetry.cameraControls ?? [];
	for (const control of cameraControls) {
		assert.deepEqual(control.cacheIdentity, telemetry.identity);
		assert.equal(
			control.shaderIdentity,
			cameraControls[0].shaderIdentity,
			'Camera changes must not produce shader variants.',
		);
		const expected = interval(control.origin, control.direction);
		assert.ok(Math.abs(expected.entry - control.bounds[0]) <= 8 + 4e-6 * expected.entry);
		assert.ok(Math.abs(expected.exit - control.bounds[1]) <= 8 + 4e-6 * expected.exit);
	}
	let maxDisplayCodeDifference = 0,
		maximumTransmissionAbsoluteError = 0,
		maximumCompositionAbsoluteError = 0,
		maximumIntervalAbsoluteError = 0,
		maximumHigherContribution = 0;
	const rows = [];
	for (const frame of telemetry.frames) {
		assert.deepEqual(
			frame.cacheIdentity,
			telemetry.identity,
			'Both headings must use the same actual cache textures.',
		);
		assert.equal(frame.groundDrawCalls, 1);
		for (const row of frame.diagnostics) {
			const expected = interval(request.origin, row.direction);
			const actual = row.bounds;
			const intervalError = Math.max(Math.abs(actual[0] - expected.entry), Math.abs(actual[1] - expected.exit));
			const expectedAtGpuDirection = interval(request.origin, row.actualDirection);
			const solverError = Math.max(
				Math.abs(actual[0] - expectedAtGpuDirection.entry),
				Math.abs(actual[1] - expectedAtGpuDirection.exit),
			);
			maximumIntervalAbsoluteError = Math.max(maximumIntervalAbsoluteError, intervalError);
			// Eight meters is four world-coordinate FP32 ULPs at this radius;
			// the relative term covers long-ray root rounding. This is geometry,
			// not a replacement radiance-accuracy threshold.
			assert.ok(
				solverError <= 8 + 4e-6 * expectedAtGpuDirection.exit,
				'Atmosphere solver differs from independent finite-cap geometry at the actual GPU direction.',
			);
			for (let c = 0; c < 15; c++) {
				const length = Math.max(0, actual[1] - actual[0]);
				const startHeight = request.origin[2] + actual[0] * row.actualDirection[2];
				const tr = Math.exp(
					-medium.rayleigh[c] * column(startHeight, row.actualDirection[2], length, 8000) -
						medium.mie[c] * column(startHeight, row.actualDirection[2], length, 1200),
				);
				const transmissionError = Math.abs(tr - row.transmission[c]);
				maximumTransmissionAbsoluteError = Math.max(maximumTransmissionAbsoluteError, transmissionError);
				assert.ok(transmissionError <= 1e-5);
				const predicted = row.air[c] + (row.expectedHit ? row.transmission[c] * request.groundSpectrum[c] : 0);
				const difference = Math.abs(predicted - row.radiance[c]);
				maximumCompositionAbsoluteError = Math.max(maximumCompositionAbsoluteError, difference);
				assert.ok(
					Number.isFinite(row.radiance[c]) && row.radiance[c] >= 0 && difference <= 1e-7 + 3e-6 * predicted,
				);
				maximumHigherContribution = Math.max(maximumHigherContribution, row.air[c] - row.withoutHigher[c]);
			}
			const displayed = color(row.radiance);
			if (row.vacuumRadiance) {
				const endpoint = request.groundSpectrum.map((v) => (row.expectedHit ? v : 0));
				assert.ok(
					row.vacuumRadiance.every((v, c) => Math.abs(v - endpoint[c]) <= 1e-7 + 3e-6 * endpoint[c]),
					'Zero-air endpoint spectral composition failed.',
				);
				const endpointColor = color(endpoint);
				assert.ok(
					endpointColor.rgb.every((v, c) => Math.abs(v - Math.round(255 * row.vacuumDisplay[c])) <= 1),
					'Zero-air display composition failed.',
				);
			}
			const codeError = Math.max(
				...displayed.rgb.map((value, c) => Math.abs(value - Math.round(255 * row.displayed[c]))),
			);
			maxDisplayCodeDifference = Math.max(maxDisplayCodeDifference, codeError);
			assert.ok(codeError <= 1, 'GPU display differs from authenticated CPU CIE/sRGB conversion.');
			rows.push({
				frame: frame.name,
				x: row.x,
				y: row.y,
				expectedHit: row.expectedHit,
				intervalError,
				solverErrorAtGpuDirection: solverError,
				idealRayExit: expected.exit,
				actualGpuRayExit: expectedAtGpuDirection.exit,
				displayCodeDifference: codeError,
				cpuColor: displayed,
			});
		}
	}
	assert.ok(
		telemetry.frames.length >= 2 && maximumHigherContribution > 0,
		'The completed higher-order cache must contribute to an actual scene fragment.',
	);
	return {
		maximumIntervalAbsoluteError,
		maximumTransmissionAbsoluteError,
		maximumCompositionAbsoluteError,
		maxDisplayCodeDifference,
		maximumHigherContribution,
		rows,
		scope: 'Same live texture identities, real ground draw and hit/depth, independent cap/column geometry, wavelength-wise ground composition and authenticated display conversion. Intrinsic N12 error is separately measured, not hidden by these port checks.',
	};
}
