import assert from 'node:assert/strict';
import {identity, readRepository, outputRelative} from '../../io/files.mjs';
import {parseBoundaryTsv} from '../../analysis/boundary.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {computeTheoreticalSunDirection} from '../../../../scripts/experiments/b1-directional-sky-radiance/benchmark-domain.js';

/** Authenticate original measurement/geometry and all external interpolation collaborators.
 * @returns {SkySolarInputs}
 */
export function readSolarInputs() {
	const input = acceptedMechanismInput(outputRelative + '/runs/00000-inputs');
	const measurements = mechanismArtifact(input, 'measurements.tsv'),
		controlsId = mechanismArtifact(input, 'controls.json');
	const boundary = parseBoundaryTsv(readRepository(measurements.path, measurements).toString(), {
		configId: 'kider',
		sourceIdentity: measurements,
	});
	const controls = /** @type {{scenes: readonly SkyScene[]}} */ (
		JSON.parse(readRepository(controlsId.path, controlsId).toString())
	);
	assert.equal(boundary.times.length, 17);
	assert.equal(boundary.rayIndices.length, 81);
	assert.equal(boundary.channels.length, 40);
	const parents = [
		input.seal,
		measurements,
		controlsId,
		...['benchmark.js', 'benchmark-domain.js', 'B1ReferenceInputs.js', 'published-oracle.js'].map((name) =>
			identity('scripts/experiments/b1-directional-sky-radiance/' + name),
		),
	];
	const conditions = boundary.times.map((time, timeIndex) => {
		const scene = controls.scenes.find((s) => s.time === time);
		assert.ok(scene);
		const solar = computeTheoreticalSunDirection(time);
		assert.ok(Math.abs(scene.zenithDegrees - solar.zenithDegrees) < 1e-12);
		const grids = Object.fromEntries(
			['integrated40', 'channel-0', 'channel-8', 'channel-24', 'channel-30'].map((band) => [
				band,
				Array.from({length: 9}, (_, x) =>
					Array.from({length: 9}, (_, y) => {
						const start = (timeIndex * 81 + y * 9 + x) * 40;
						if (band !== 'integrated40') return boundary.values[start + Number(band.slice(8))];
						let sum = 0;
						for (let c = 0; c < 40; c++) sum += boundary.values[start + c];
						return sum * 11.75;
					}),
				),
			]),
		);
		return {
			time,
			zenithDegrees: scene.zenithDegrees,
			theoreticalDegrees: solar.theoreticalAzimuthDegrees,
			fittedDegrees: scene.fittedAzimuthDegrees,
			grids,
		};
	});
	return {conditions, parents};
}
