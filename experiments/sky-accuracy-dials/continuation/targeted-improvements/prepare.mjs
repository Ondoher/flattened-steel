import assert from 'node:assert/strict';
import {createPointStencilBuilder, viewPathIntervals} from '../../numerics/view.js';
import {sourceFrame, unit} from '../../numerics/math.js';
import {phase} from '../../numerics/direct.js';

/** Prepare geometry only; all new finite source and ray integrations run on GPU.
 * @param {SkyBuildRequest} request @param {DialContinuationRegistrationRead} registration
 * @param {readonly SkyJ1AssessmentRow[]} references @param {()=>void} progress
 * @returns {SkyTargetedPayload}
 */
export function prepareTargeted(request, registration, references, progress) {
	const spec = request.transportSpec,
		builder = createPointStencilBuilder(request);
	const anchors = [],
		samples = [],
		rays = [],
		rowLayout = [];
	/** @type {Map<string,number>} */ const anchorMap = new Map();
	/** @type {Map<number,readonly number[]>} */ const phaseMap = new Map();
	/** @param {SkyFieldCoordinate} coordinate @returns {number} */
	function anchor(coordinate) {
		const key = coordinate.altitudeIndex + ':' + coordinate.solarIndex;
		let index = anchorMap.get(key);
		if (index === undefined) {
			index = anchors.length / 4;
			const h = spec.domains.position.nodes[coordinate.altitudeIndex].altitudeMeters;
			const mu = Math.cos(
				(spec.domains.solarZenith.nodes[coordinate.solarIndex].solarZenithDegrees * Math.PI) / 180,
			);
			assert.ok(mu > 0 && mu <= 1, 'This fixed screen requires outward lit source anchors.');
			anchors.push(h, mu, 0, 0);
			anchorMap.set(key, index);
		}
		return index;
	}
	/** @param {number} index @returns {readonly number[]} */
	function knotPhase(index) {
		let result = phaseMap.get(index);
		if (!result) {
			const c = builder.coordinates[index],
				id = anchor(c),
				h = anchors[id * 4],
				mu = anchors[id * 4 + 1];
			const radius = spec.planet.bottomRadiusMeters + h;
			const frame = sourceFrame([radius * Math.sqrt(Math.max(0, 1 - mu * mu)), 0, radius * mu]);
			const local = spec.domains.outgoing.unitVectors[c.directionIndex];
			const world = unit(
				[0, 1, 2].map((a) => frame[0][a] * local[0] + frame[1][a] * local[1] + frame[2][a] * local[2]),
			);
			result = phase(spec, world[2]);
			phaseMap.set(index, result);
		}
		return result;
	}
	for (const [probeIndex, frozen] of registration.record.probeRays.entries()) {
		progress();
		const probe = registration.probes[probeIndex];
		assert.equal(probe.time, frozen.time);
		assert.equal(probe.gridX, frozen.gridX);
		assert.equal(probe.gridY, frozen.gridY);
		const ray = {origin: frozen.origin, direction: frozen.direction, length: frozen.lengthMeters};
		const queryPhase = phase(spec, frozen.direction[2]);
		for (const subdivisions of [8, 16]) {
			const intervals = viewPathIntervals(spec, ray, 'altitude-segmented', subdivisions);
			const offset = samples.length / 40;
			for (const interval of intervals) {
				const distance = (interval.start + interval.end) / 2;
				const point = /** @type {SkyVector3} */ ([
					ray.origin[0] + distance * ray.direction[0],
					ray.origin[1] + distance * ray.direction[1],
					ray.origin[2] + distance * ray.direction[2],
				]);
				const sample = builder.sample(point, ray.direction, interval.end - interval.start);
				assert.ok([1, 2].includes(sample.altitudeWeights.length));
				const mu = point[2] / Math.hypot(...point);
				assert.ok(mu > 0);
				samples.push(
					sample.altitude,
					sample.step,
					sample.solarFraction,
					sample.altitudeWeights[1] ?? 0,
					Number(sample.firstSolarInterval),
					Number(sample.lastSolarInterval),
					mu,
					0,
				);
				let cursor = 0;
				for (let tap = 0; tap < 8; tap++) {
					if (tap === 4 && sample.altitudeWeights.length === 1) cursor = 0;
					const c = builder.coordinates[sample.indices[cursor]],
						id = anchor(c);
					let r = 0,
						m = 0;
					for (const weight of sample.directionWeights) {
						const p = knotPhase(sample.indices[cursor++]);
						r += weight * p[0];
						m += weight * p[1];
					}
					samples.push(id, anchors[id * 4], r, m);
				}
				assert.equal(cursor, sample.indices.length);
			}
			rays.push(offset, intervals.length, queryPhase[0], queryPhase[1]);
			rowLayout.push({probeIndex, probeId: probe.probeId, subdivisions, sampleCount: intervals.length});
		}
	}
	const channels = [0, 8, 24, 30];
	assert.equal(references.length, 160);
	for (const probe of registration.probes)
		for (const channel of channels) {
			const ref = references.find((r) => r.probeId === probe.probeId && r.channel === channel);
			assert.ok(ref && ref.physicalW !== null && ref.physicalAllowanceW !== null && ref.reasons.length === 0);
		}
	return {
		planet: [
			spec.planet.bottomRadiusMeters,
			spec.planet.topRadiusMeters - spec.planet.bottomRadiusMeters,
			spec.atmosphere.rayleighScaleHeightMeters,
			spec.atmosphere.mieScaleHeightMeters,
		],
		spectra: channels.flatMap((c) => {
			const s = spec.domains.spectrum.channels[c];
			return [
				s.rayleighScatteringPerMeter,
				s.mieExtinctionPerMeter,
				s.sourceIrradianceDensityWattsPerSquareMeterPerNanometer,
				spec.atmosphere.mieSingleScatteringAlbedo,
			];
		}),
		channels,
		anchors,
		samples,
		rays,
		rowLayout,
		references,
	};
}
