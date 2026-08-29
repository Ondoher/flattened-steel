import {
	dot,
	normalize,
} from './SphericalAtmosphereGeometry.js';

function cross(left, right) {
	return [
		left[1] * right[2] - left[2] * right[1],
		left[2] * right[0] - left[0] * right[2],
		left[0] * right[1] - left[1] * right[0],
	];
}

/** Build the local right-handed source-relative frame at an actual point. */
export function createActualPointSourceFrame({point, directionToSource}) {
	const up = normalize(point, 'actual point');
	const source = normalize(directionToSource, 'direction to source');
	const muS = Math.max(-1, Math.min(1, dot(up, source)));
	const horizontal = source.map(
		(component, index) => component - muS * up[index],
	);
	let xAxis;
	if (Math.hypot(...horizontal) > 1e-12) {
		xAxis = normalize(horizontal, 'source horizontal projection');
	} else {
		const references = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
		const reference = references.reduce((best, candidate) =>
			Math.abs(dot(candidate, up)) < Math.abs(dot(best, up))
				? candidate
				: best);
		xAxis = normalize(reference.map(
			(component, index) => component - dot(reference, up) * up[index],
		), 'polar fallback axis');
	}
	const yAxis = normalize(cross(up, xAxis), 'source cross axis');
	return Object.freeze({
		id: 'actual-point-source-relative-frame-v1',
		xAxis: Object.freeze(xAxis),
		yAxis: Object.freeze(yAxis),
		zAxis: up,
		muS,
		solarZenithDegrees: Math.acos(muS) * 180 / Math.PI,
		radiusMeters: Math.hypot(...point),
	});
}

export function expressWorldDirectionInActualPointFrame(frame, direction) {
	const unit = normalize(direction, 'world direction');
	return Object.freeze([
		dot(unit, frame.xAxis),
		dot(unit, frame.yAxis),
		dot(unit, frame.zAxis),
	]);
}

export function expressActualPointDirectionInWorld(frame, direction) {
	const unit = normalize(direction, 'actual-point direction');
	return normalize([0, 1, 2].map((component) =>
		unit[0] * frame.xAxis[component]
		+ unit[1] * frame.yAxis[component]
		+ unit[2] * frame.zAxis[component]), 'world direction');
}

/** Construct a canonical representative point for one `(r, mu_s)` state. */
export function createRepresentativeActualPoint({radiusMeters, muS}) {
	if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
		throw new RangeError('radiusMeters must be finite and positive.');
	}
	if (!Number.isFinite(muS) || muS < -1 || muS > 1) {
		throw new RangeError('muS must lie in [-1, 1].');
	}
	const horizontal = Math.sqrt(Math.max(0, 1 - muS * muS));
	return Object.freeze([
		radiusMeters * horizontal,
		0,
		radiusMeters * muS,
	]);
}

