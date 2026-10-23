import assert from 'node:assert/strict';
import {DistantSunSceneCacheCompilerInputs} from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheCompilerInputs.js';
import {DistantSunSceneCacheNumerics} from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheNumerics.js';
import {DistantSunScatteringAccuracy} from '../../src/algorithm32/implementation/distant-sun/cache/DistantSunScatteringAccuracy.js';
import {
	createOutgoingDomain,
	linearStencil,
	localDirection,
	outgoingStencil,
	solarCubic,
} from '../sky-accuracy-dials/numerics/math.js';
import {physical, channels, ray, directTransmission} from './physics.mjs';

/** Create an experiment-only refinement of the exact production construction request. */
export function buildInput(variant) {
	const m = physical();
	const originalScene = DistantSunSceneCacheCompilerInputs.createQualifiedSanJoseNauticalScene();
	const scene = {
		...originalScene,
		support: {
			...originalScene.support,
			observerAltitude: {value: 40000, units: /** @type {const} */ ('meters')},
			observerSolarZenith: {value: (m.zenithDegrees * Math.PI) / 180, units: /** @type {const} */ ('radians')},
		},
	};
	const request = DistantSunSceneCacheCompilerInputs.createInputSet(scene, {
		numericalPolicy: DistantSunSceneCacheNumerics.createAnchoredRadial(),
		scatteringAccuracy: 'corrected60-sun035',
		solarInterpolation: 'monotone-cubic',
	}).buildRequest;
	const s = request.transportSpec;
	let position = s.domains.position;
	if (variant === 'altitude') {
		const original = s.domains.position.nodes.map((n) => n.altitudeMeters);
		const heights = [
			...original,
			...original.slice(1).flatMap((h, i) => (h <= 45000 ? [(h + original[i]) / 2] : [])),
		].sort((a, b) => a - b);
		position = {
			id: 'experiment-native48-midpoints-below45km',
			count: heights.length,
			nodes: heights.map((altitudeMeters, index) => ({index, altitudeMeters})),
		};
	}
	assert.equal(s.atmosphere.ozone.maximumDensityPerCubicMeter, 0);
	return {
		...request,
		transportSpec: {
			...s,
			numerical: {
				...s.numerical,
				transportIntervalCount: variant === 'transport' ? 120 : 60,
				sourcePathTransmittanceIntervalCount: variant === 'source' ? 80 : 20,
			},
			domains: {
				...s.domains,
				position,
				outgoing: variant === 'angular' ? createOutgoingDomain(39) : s.domains.outgoing,
				spectrum: {
					...s.domains.spectrum,
					channels: s.domains.spectrum.channels.map((c, i) => ({
						...c,
						rayleighScatteringPerMeter: m.rayleigh[i],
						mieExtinctionPerMeter: m.mie[i],
					})),
				},
			},
		},
	};
}

/** Sparse production-convention lookup, including a different focused direction for every solar row. */
export function viewPlan(request) {
	const m = physical(),
		d = request.transportSpec.domains;
	const heights = d.position.nodes.map((n) => n.altitudeMeters),
		angles = d.solarZenith.nodes.map((n) => n.solarZenithDegrees);
	const coordinates = [],
		indexes = new Map(),
		views = [];
	const theta = (m.zenithDegrees * Math.PI) / 180,
		up = [Math.sin(theta), 0, Math.cos(theta)],
		tangent = [-Math.cos(theta), 0, Math.sin(theta)];
	for (const altitude of [10000, 30000, 40000]) {
		const limb = (-Math.acos(m.radius / (m.radius + altitude)) * 180) / Math.PI;
		for (const offset of [-1, -0.1, -0.02, 0.02, 0.1, 1]) {
			const v = ray(limb + offset, altitude),
				a = (v.elevation * Math.PI) / 180;
			const origin = up.map((x) => x * (m.radius + altitude));
			const direction = up.map((x, i) => x * Math.sin(a) - tangent[i] * Math.cos(a));
			for (const intervals of [30, 120, 480]) {
				const samples = [];
				for (let k = 0; k < intervals; k++) {
					const start = v.length * (k / intervals) ** 2,
						end = v.length * ((k + 1) / intervals) ** 2;
					const t = (start + end) / 2,
						point = origin.map((x, i) => x + direction[i] * t);
					const h = Math.max(0, Math.hypot(...point) - m.radius),
						p = linearStencil(heights, h);
					const z = linearStencil(
						angles,
						(Math.acos(Math.max(-1, Math.min(1, point[2] / Math.hypot(...point)))) * 180) / Math.PI,
					);
					const lo = z.indices.length === 2 ? z.indices[0] : Math.min(z.indices[0], angles.length - 2),
						hi = lo + 1;
					const fraction = z.indices.length === 2 ? z.weights[1] : z.indices[0] === 0 ? 0 : 1;
					const local = localDirection(
							[point[0], point[1], point[2]],
							[direction[0], direction[1], direction[2]],
						),
						rows = [];
					for (const altitudeIndex of p.indices) {
						const solar = [];
						for (const solarIndex of [Math.max(0, lo - 1), lo, hi, Math.min(angles.length - 1, hi + 1)]) {
							const b = (angles[solarIndex] * Math.PI) / 180;
							const mapped = DistantSunScatteringAccuracy.map(
								local,
								[Math.sin(b), 0, Math.cos(b)],
								'corrected60-sun035',
								true,
							);
							const stencil = outgoingStencil(mapped, d.outgoing.faceWidth),
								ids = [];
							for (const x of stencil.indices) {
								const y = solarIndex * heights.length + altitudeIndex,
									key = x + ':' + y;
								if (!indexes.has(key)) {
									indexes.set(key, coordinates.length);
									coordinates.push({x, y});
								}
								ids.push(indexes.get(key));
							}
							solar.push({ids, weights: stencil.weights});
						}
						rows.push(solar);
					}
					samples.push({
						altitude: h,
						step: end - start,
						rows,
						weights: p.weights,
						fraction,
						first: lo === 0,
						last: hi === angles.length - 1,
					});
				}
				views.push({altitude, offset, intervals, limb, geometry: v, samples});
			}
		}
	}
	return {coordinates, views};
}

/** Match runtime Float32 cumulative storage, monotone cubic lookup and quadratic midpoint transport. */
export function evaluateView(plan, pure, channel) {
	const m = physical(),
		cumulative = [];
	for (let order = 0; order < 4; order++)
		cumulative.push(
			Float32Array.from(pure[order], (v, i) => (order ? Math.fround(cumulative[order - 1][i] + v) : v)),
		);
	return plan.views.map((v) => {
		const values = cumulative.map((field) => {
			let value = 0,
				T = 1;
			for (const s of v.samples) {
				let density = 0;
				for (let p = 0; p < s.rows.length; p++) {
					const z = s.rows[p].map((r) => r.ids.reduce((sum, id, i) => sum + field[id] * r.weights[i], 0));
					density +=
						s.weights[p] *
						solarCubic(s.first ? undefined : z[0], z[1], z[2], s.last ? undefined : z[3], s.fraction);
				}
				const extinction =
					m.rayleigh[channel] * Math.exp(-s.altitude / m.rayleighHeight) +
					m.mie[channel] * Math.exp(-s.altitude / m.mieHeight);
				const half = Math.exp(-0.5 * extinction * s.step);
				T *= half;
				value += T * density * s.step;
				T *= half;
			}
			assert.ok(Number.isFinite(value) && value >= 0);
			return value;
		});
		return {altitude: v.altitude, offset: v.offset, intervals: v.intervals, values};
	});
}

/** Independent direct extinction convergence and layout registration. */
export function geometryProof() {
	const m = physical();
	return [10000, 30000, 40000].map((altitude) => {
		const limb = (-Math.acos(m.radius / (m.radius + altitude)) * 180) / Math.PI;
		return {
			altitude,
			limb,
			paths: [-0.1, 0.1].map((offset) => {
				const v = ray(limb + offset, altitude);
				return {
					offset,
					geometry: v,
					transmissions: [30, 120, 480, 32768].map((n) => directTransmission(m, v, n)),
				};
			}),
		};
	});
}
