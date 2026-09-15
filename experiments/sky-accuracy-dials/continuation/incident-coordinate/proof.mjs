import assert from 'node:assert/strict';
import {readRepository} from '../../io/files.mjs';
import {closestApproachAltitudeMap} from './geometry.mjs';

/** Verify the new physical method differs from the original only in its named coordinate.
 * @returns {SkySecondOrderAnalysisProof} Source derivation and independent geometric moments.
 */
export function incidentCoordinateProof() {
	const original = readRepository(
		'experiments/sky-accuracy-dials/continuation/volume-reference/method.mjs',
	).toString();
	const expected = original
		.replace(
			"import {volumeAltitudeMap, volumePoint, volumeSphereExit} from './geometry.mjs';",
			"import {volumePoint, volumeSphereExit} from '../volume-reference/geometry.mjs';\nimport {closestApproachAltitudeMap} from './geometry.mjs';",
		)
		.replace('volumeAltitudeMap(geometry, segment)', 'closestApproachAltitudeMap(geometry, segment)')
		.replace('export function evaluateVolumeMethod(', 'export function evaluateClosestVolumeMethod(');
	const actual = readRepository(
		'experiments/sky-accuracy-dials/continuation/incident-coordinate/method.mjs',
	).toString();
	assert.equal(actual.replace(/\s+/g, ''), expected.replace(/\s+/g, ''));
	let checks = 1;
	for (const [b, q0, length] of [
		[6360000, 0, 800000],
		[6368000, 178.85, 813450],
		[0, 6360000, 60000],
		[1e-4, 6360000, 10000],
		[6360000, 1, 1e-8],
		[6360000, 1e5, 1e-8],
	])
		for (const inward of [false, true]) {
			/** @type {SkyVector3} */ const origin = [b, 0, inward ? -(q0 + length) : q0];
			/** @type {SkyVolumeGeometry} */ const geometry = {
				origin,
				direction: [0, 0, 1],
				lengthMeters: length,
				boundary: 'top',
				branch: 'volume-outward',
				endpoint: [b, 0, origin[2] + length],
				segments: [{startMeters: 0, endMeters: length, sourceVisible: true}],
			};
			const map = closestApproachAltitudeMap(geometry, geometry.segments[0]);
			assert.ok(
				Math.abs(map.evaluate(0).distance - (inward ? length : 0)) <= 32 * Number.EPSILON * Math.max(1, length),
			);
			checks++;
			assert.ok(
				Math.abs(map.evaluate(map.endCoordinate).distance - (inward ? 0 : length)) <=
					32 * Number.EPSILON * Math.max(1, length),
			);
			checks++;
			assert.ok(map.evaluate(0).jacobian > 0);
			checks++;
			for (const order of [0, 1, 2, 3]) {
				let total = 0;
				const count = 256;
				for (let i = 0; i <= count; i++) {
					const value = map.evaluate((map.endCoordinate * i) / count),
						weight = i === 0 || i === count ? 1 : i % 2 ? 4 : 2;
					total += weight * (value.distance / length) ** order * value.jacobian;
				}
				total *= map.endCoordinate / (3 * count * length);
				assert.ok(
					Math.abs(total - 1 / (order + 1)) < 1e-10,
					`Moment ${order} failed for ${b}/${q0}/${length}/${inward}: ${total}`,
				);
				checks++;
			}
		}
	return {schemaId: 'sky-incident-coordinate-proof-v1', checks};
}
