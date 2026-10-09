import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';
import {CANONICAL_SPECTRAL_CHANNELS} from '../../src/algorithm32/profiles/native-15/consts.js';
import {densityColumn} from './continuous-reference.js';

const constants = CANONICAL_ATMOSPHERE_CONSTANTS;
const betaR = CANONICAL_SPECTRAL_CHANNELS.map(
	(c) => constants.rayleighCoefficientScale * (c.wavelength.value / 1000) ** -4,
);
const betaM = CANONICAL_SPECTRAL_CHANNELS.map(
	(c) =>
		(constants.mieAngstromBeta / constants.mieScaleHeight.value) *
		(c.wavelength.value / 1000) ** -constants.mieAngstromAlpha,
);

/** Versioned independent continuous-primary integration operation. */
export const PRIMARY_ORACLE_POLICY = 'binary64-primary-simpson-square-coordinate-v2';

/** Independent binary64 optical depth for a physically clipped flat segment.
 * @param {number} a - Starting altitude, meters.
 * @param {number} b - Ending altitude, meters.
 * @param {number} length - Segment length, meters.
 * @returns {number[]} - Fifteen dimensionless optical depths.
 */
export function primaryOpticalDepth(a, b, length) {
	const r = densityColumn(a, b, length, constants.rayleighScaleHeight.value);
	const m = densityColumn(a, b, length, constants.mieScaleHeight.value);
	return betaR.map((v, c) => v * r + betaM[c] * m);
}

/** Evaluate the continuous single-scattering source without any candidate field/stencil.
 * @param {LocalSunFrozenPlacement} state - Source calibration and flat slab.
 * @param {readonly number[]} point - Canonical source-relative x/y, physical altitude.
 * @param {readonly number[]} outgoing - Unit physical propagation direction.
 * @returns {number[]} - Native15 J1, W m^-3 sr^-1 nm^-1.
 */
export function primaryDensity(state, point, outgoing) {
	const h = state.geometry.sourcePosition.coordinates[2],
		top = state.geometry.topAltitude.value;
	const z = Math.min(top, Math.max(0, point[2]));
	const delta = [-point[0], -point[1], h - z];
	const distance = Math.hypot(...delta);
	const incoming = delta.map((v) => v / distance);
	const sourcePath = (top - z) / incoming[2];
	const tau = primaryOpticalDepth(z, top, Math.max(sourcePath, top - z));
	const mu = Math.max(
		-1,
		Math.min(
			1,
			incoming.reduce((v, d, i) => v + d * outgoing[i], 0),
		),
	);
	const rayleighPhase = (3 / (16 * Math.PI)) * (1 + mu * mu);
	const g = constants.miePhaseFunctionG;
	const miePhase =
		((((3 / (8 * Math.PI)) * (1 - g * g)) / (2 + g * g)) * (1 + mu * mu)) / (1 + g * g - 2 * g * mu) ** 1.5;
	const scale =
		state.source.referenceSpectralIncidentScale *
		(state.source.distanceFalloff
			? (state.source.referenceDistance.value / Math.max(distance, state.source.radius.value)) ** 2
			: 1);
	return betaR.map(
		(b, c) =>
			state.source.sourceIrradiance.values[c] *
			scale *
			Math.exp(-tau[c]) *
			(b * Math.exp(-z / constants.rayleighScaleHeight.value) * rayleighPhase +
				betaM[c] *
					Math.exp(-z / constants.mieScaleHeight.value) *
					constants.mieSingleScatteringAlbedo *
					miePhase),
	);
}

/** Solve the independent slab/cylinder boundary; ground is black.
 * @param {readonly number[]} p - Canonical source-relative point, meters.
 * @param {readonly number[]} d - Unit direction.
 * @param {number} radius - Physical truncation radius, meters.
 * @param {number} top - Atmosphere top, meters.
 * @returns {number} - Nonnegative distance to the first boundary.
 */
export function primaryBoundary(p, d, radius, top) {
	const slab = d[2] > 0 ? (top - p[2]) / d[2] : d[2] < 0 ? -p[2] / d[2] : Infinity;
	const a = d[0] ** 2 + d[1] ** 2,
		b = p[0] * d[0] + p[1] * d[1];
	const rho = Math.hypot(p[0], p[1]),
		inside = (radius - rho) * (radius + rho);
	const root = Math.sqrt(Math.max(0, b * b + a * inside));
	const radial = a === 0 ? Infinity : b >= 0 ? (inside === 0 ? 0 : inside / (root + b)) : (-b + root) / a;
	return Math.max(0, Math.min(slab, radial));
}

/** Independent continuous L1 with composite Simpson in t=L*u^2 and analytic attenuation.
 * Tail truncation at optical depth 32 in every channel contributes at most
 * exp(-32) times a bounded source function; retained in the reference record.
 * @param {LocalSunFrozenPlacement} state - Continuous physical source.
 * @param {readonly number[]} point - Source-relative point, meters.
 * @param {readonly number[]} direction - Unit physical direction.
 * @param {number} radius - Fixed physical cylinder, meters.
 * @param {number} intervals - Even path refinement count.
 * @returns {number[]} - Fifteen L1 radiance densities.
 */
export function primaryRadianceControl(state, point, direction, radius, intervals) {
	if (!Number.isInteger(intervals) || intervals < 2 || intervals % 2)
		throw new Error('Simpson intervals must be positive and even.');
	const top = state.geometry.topAltitude.value;
	let length = primaryBoundary(point, direction, radius, top);
	const altitude = (/** @type {number} */ t) => Math.min(top, Math.max(0, point[2] + direction[2] * t));
	const full = primaryOpticalDepth(
		point[2],
		altitude(length),
		Math.max(length, Math.abs(altitude(length) - point[2])),
	);
	if (Math.min(...full) > 32) {
		let low = 0,
			high = length;
		for (let i = 0; i < 48; i++) {
			const mid = (low + high) / 2;
			const depths = primaryOpticalDepth(
				point[2],
				altitude(mid),
				Math.max(mid, Math.abs(altitude(mid) - point[2])),
			);
			if (Math.min(...depths) > 32) high = mid;
			else low = mid;
		}
		length = high;
	}
	const values = new Array(15).fill(0);
	for (let i = 0; i <= intervals; i++) {
		const u = i / intervals,
			t = length * u * u,
			p = [point[0] + direction[0] * t, point[1] + direction[1] * t, altitude(t)];
		const tau = primaryOpticalDepth(point[2], p[2], Math.max(t, Math.abs(p[2] - point[2])));
		const j = primaryDensity(state, p, direction);
		const weight = i === 0 || i === intervals ? 1 : i % 2 ? 4 : 2;
		for (let c = 0; c < 15; c++)
			values[c] += (weight * Math.exp(-tau[c]) * j[c] * (2 * length * u)) / (intervals * 3);
	}
	return values;
}

/** Allocation-light evaluation of the same binary64 continuous-primary integral.
 * Shares only analytic constants/equations with the candidate. Source and view
 * extinction exponents are added before exponentiation; phase is wavelength independent.
 * @param {LocalSunFrozenPlacement} state - Continuous physical source above the slab.
 * @param {readonly number[]} point - Source-relative point, meters.
 * @param {readonly number[]} direction - Unit physical direction.
 * @param {number} radius - Fixed physical cylinder, meters.
 * @param {number} intervals - Even Simpson refinement count.
 * @returns {number[]} - Fifteen L1 radiance densities.
 */
export function primaryRadiance(state, point, direction, radius, intervals) {
	if (!Number.isInteger(intervals) || intervals < 2 || intervals % 2)
		throw new Error('Simpson intervals must be positive and even.');
	const top = state.geometry.topAltitude.value,
		h = state.geometry.sourcePosition.coordinates[2];
	if (!(h > top)) throw new Error('The independent primary oracle requires a source above the slab.');
	let length = primaryBoundary(point, direction, radius, top);
	const altitude = (/** @type {number} */ t) => Math.min(top, Math.max(0, point[2] + direction[2] * t));
	const full = primaryOpticalDepth(
		point[2],
		altitude(length),
		Math.max(length, Math.abs(altitude(length) - point[2])),
	);
	if (Math.min(...full) > 32) {
		let low = 0,
			high = length;
		for (let i = 0; i < 48; i++) {
			const mid = (low + high) / 2,
				depths = primaryOpticalDepth(
					point[2],
					altitude(mid),
					Math.max(mid, Math.abs(altitude(mid) - point[2])),
				);
			if (Math.min(...depths) > 32) high = mid;
			else low = mid;
		}
		length = high;
	}
	const hr = constants.rayleighScaleHeight.value,
		hm = constants.mieScaleHeight.value;
	const startR = Math.exp(-point[2] / hr),
		startM = Math.exp(-point[2] / hm),
		g = constants.miePhaseFunctionG;
	const values = new Array(15).fill(0),
		irradiance = state.source.sourceIrradiance.values;
	const reference = state.source.referenceDistance.value,
		sourceRadius = state.source.radius.value;
	for (let i = 1; i <= intervals; i++) {
		const u = i / intervals,
			t = length * u * u,
			z = altitude(t),
			dz = z - point[2];
		const px = point[0] + direction[0] * t,
			py = point[1] + direction[1] * t,
			d = h - z,
			distance = Math.hypot(px, py, d);
		const mu = Math.max(-1, Math.min(1, (-px * direction[0] - py * direction[1] + d * direction[2]) / distance));
		const phaseR = (3 / (16 * Math.PI)) * (1 + mu * mu),
			phaseM =
				((((3 / (8 * Math.PI)) * (1 - g * g)) / (2 + g * g)) * (1 + mu * mu)) / (1 + g * g - 2 * g * mu) ** 1.5;
		const densityR = Math.exp(-z / hr),
			densityM = Math.exp(-z / hm);
		const viewR = dz === 0 ? startR * t : (startR * -Math.expm1(-dz / hr) * hr * t) / dz;
		const viewM = dz === 0 ? startM * t : (startM * -Math.expm1(-dz / hm) * hm * t) / dz;
		const sourceR = (densityR * -Math.expm1(-(top - z) / hr) * hr * distance) / d;
		const sourceM = (densityM * -Math.expm1(-(top - z) / hm) * hm * distance) / d;
		const scale =
			state.source.referenceSpectralIncidentScale *
			(state.source.distanceFalloff ? (reference / Math.max(distance, sourceRadius)) ** 2 : 1);
		const factor = (((i === intervals ? 1 : i % 2 ? 4 : 2) * (2 * length * u)) / (intervals * 3)) * scale;
		for (let c = 0; c < 15; c++)
			values[c] +=
				factor *
				irradiance[c] *
				Math.exp(-betaR[c] * (viewR + sourceR) - betaM[c] * (viewM + sourceM)) *
				(betaR[c] * densityR * phaseR + betaM[c] * densityM * constants.mieSingleScatteringAlbedo * phaseM);
	}
	return values;
}
