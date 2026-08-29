const EPSILON_METERS = 1e-7;
const ROOT_EPSILON = 1e-9;

function requireVector(value, label, {unit = false} = {}) {
	if (!Array.isArray(value) || value.length !== 3) {
		throw new TypeError(`${label} must contain three components.`);
	}
	const vector = value.map(Number);
	const length = Math.hypot(...vector);
	if (!Number.isFinite(length) || length <= 0) {
		throw new RangeError(`${label} must be finite and nonzero.`);
	}
	if (unit && Math.abs(length - 1) > 1e-12) {
		throw new RangeError(`${label} must be a unit vector.`);
	}
	return vector;
}

function requireRadius(value, label) {
	if (!Number.isFinite(value) || value <= 0) {
		throw new RangeError(`${label} must be finite and positive.`);
	}
	return value;
}

export function dot(left, right) {
	return left[0] * right[0]
		+ left[1] * right[1]
		+ left[2] * right[2];
}

export function addScaled(origin, direction, distanceMeters) {
	return Object.freeze(origin.map(
		(component, index) => component + distanceMeters * direction[index],
	));
}

export function normalize(vector, label = 'vector') {
	const accepted = requireVector(vector, label);
	const length = Math.hypot(...accepted);
	return Object.freeze(accepted.map((component) => component / length));
}

/** Return ordered ray/sphere roots. A tangent contributes one repeated root. */
export function intersectRaySphere({origin, direction, radiusMeters}) {
	const point = requireVector(origin, 'origin');
	const ray = requireVector(direction, 'direction', {unit: true});
	const radius = requireRadius(radiusMeters, 'radiusMeters');
	const projection = dot(point, ray);
	const discriminant = projection * projection
		- (dot(point, point) - radius * radius);
	if (discriminant < -ROOT_EPSILON) {
		return Object.freeze({kind: 'none', rootsMeters: Object.freeze([])});
	}
	const root = Math.sqrt(Math.max(0, discriminant));
	const rootsMeters = Object.freeze([-projection - root, -projection + root]);
	return Object.freeze({
		kind: root <= ROOT_EPSILON ? 'tangent' : 'secant',
		rootsMeters,
	});
}

function firstForwardRoot(intersection, minimum = EPSILON_METERS) {
	return intersection.rootsMeters.find((root) => root >= minimum) ?? null;
}

/** Classify one geocentric point against the spherical atmosphere shell. */
export function classifyAtmospherePoint({
	point,
	bottomRadiusMeters,
	topRadiusMeters,
}) {
	const accepted = requireVector(point, 'point');
	const bottom = requireRadius(bottomRadiusMeters, 'bottomRadiusMeters');
	const top = requireRadius(topRadiusMeters, 'topRadiusMeters');
	if (top <= bottom) throw new RangeError('Atmosphere top must exceed bottom.');
	const radiusMeters = Math.hypot(...accepted);
	const altitudeMeters = radiusMeters - bottom;
	let region = 'atmosphere';
	if (radiusMeters < bottom - EPSILON_METERS) region = 'ground-interior';
	else if (radiusMeters > top + EPSILON_METERS) region = 'space';
	else if (Math.abs(radiusMeters - bottom) <= EPSILON_METERS) {
		region = 'ground-boundary';
	} else if (Math.abs(radiusMeters - top) <= EPSILON_METERS) {
		region = 'atmosphere-boundary';
	}
	return Object.freeze({radiusMeters, altitudeMeters, region});
}

/** Resolve the first forward ground or atmosphere-top end of an in-shell ray. */
export function resolveAtmosphereBranch({
	origin,
	direction,
	bottomRadiusMeters,
	topRadiusMeters,
}) {
	const point = requireVector(origin, 'origin');
	const ray = requireVector(direction, 'direction', {unit: true});
	const classification = classifyAtmospherePoint({
		point,
		bottomRadiusMeters,
		topRadiusMeters,
	});
	if (!['atmosphere', 'ground-boundary', 'atmosphere-boundary']
		.includes(classification.region)) {
		return Object.freeze({
			valid: false,
			reason: `origin-${classification.region}`,
			origin: Object.freeze(point),
			direction: Object.freeze(ray),
		});
	}
	const radialDirection = dot(point, ray);
	if (classification.region === 'ground-boundary'
		&& radialDirection < -ROOT_EPSILON) {
		return Object.freeze({
			valid: false,
			reason: 'direction-enters-ground-at-origin',
			origin: Object.freeze(point),
			direction: Object.freeze(ray),
		});
	}
	if (classification.region === 'atmosphere-boundary'
		&& radialDirection >= -ROOT_EPSILON) {
		return Object.freeze({
			valid: false,
			reason: 'direction-exits-atmosphere-at-origin',
			origin: Object.freeze(point),
			direction: Object.freeze(ray),
		});
	}
	const groundDistance = firstForwardRoot(intersectRaySphere({
		origin: point,
		direction: ray,
		radiusMeters: bottomRadiusMeters,
	}));
	const topDistance = firstForwardRoot(intersectRaySphere({
		origin: point,
		direction: ray,
		radiusMeters: topRadiusMeters,
	}));
	const candidates = [
		groundDistance === null ? null : {kind: 'ground', distanceMeters: groundDistance},
		topDistance === null ? null : {kind: 'atmosphere-top', distanceMeters: topDistance},
	].filter(Boolean).sort((left, right) => left.distanceMeters - right.distanceMeters);
	if (candidates.length === 0) {
		return Object.freeze({
			valid: false,
			reason: 'no-forward-boundary',
			origin: Object.freeze(point),
			direction: Object.freeze(ray),
		});
	}
	const boundary = candidates[0];
	return Object.freeze({
		valid: true,
		origin: Object.freeze(point),
		direction: Object.freeze(ray),
		lengthMeters: boundary.distanceMeters,
		boundary: Object.freeze({
			...boundary,
			point: addScaled(point, ray, boundary.distanceMeters),
		}),
	});
}

/** Exact point-Sun visibility for a distant collimated source. */
export function resolveDistantSourceVisibility({
	point,
	directionToSource,
	bottomRadiusMeters,
}) {
	const acceptedPoint = requireVector(point, 'point');
	const source = requireVector(
		directionToSource,
		'directionToSource',
		{unit: true},
	);
	const groundHit = firstForwardRoot(intersectRaySphere({
		origin: acceptedPoint,
		direction: source,
		radiusMeters: bottomRadiusMeters,
	}));
	return Object.freeze({
		visible: groundHit === null,
		groundIntersectionDistanceMeters: groundHit,
	});
}

function uniqueSortedDistances(values, upperBound) {
	const accepted = values
		.filter((value) => Number.isFinite(value)
			&& value > EPSILON_METERS
			&& value < upperBound - EPSILON_METERS)
		.sort((left, right) => left - right);
	return accepted.filter(
		(value, index) => index === 0 || Math.abs(value - accepted[index - 1]) > 1e-5,
	);
}

function sourceVisibilityCandidateDistances({
	origin,
	direction,
	directionToSource,
	bottomRadiusMeters,
}) {
	const sourceDotOrigin = dot(origin, directionToSource);
	const sourceDotDirection = dot(direction, directionToSource);
	const perpendicularOrigin = origin.map(
		(component, index) => component - sourceDotOrigin * directionToSource[index],
	);
	const perpendicularDirection = direction.map(
		(component, index) => component - sourceDotDirection * directionToSource[index],
	);
	const a = dot(perpendicularDirection, perpendicularDirection);
	const b = 2 * dot(perpendicularOrigin, perpendicularDirection);
	const c = dot(perpendicularOrigin, perpendicularOrigin)
		- bottomRadiusMeters * bottomRadiusMeters;
	if (Math.abs(a) <= 1e-20) {
		if (Math.abs(b) <= 1e-20) return [];
		return [-c / b];
	}
	const discriminant = b * b - 4 * a * c;
	if (discriminant < 0) return [];
	const root = Math.sqrt(Math.max(0, discriminant));
	return [(-b - root) / (2 * a), (-b + root) / (2 * a)];
}

/**
 * Split one valid atmospheric branch at radial tangency and exact distant-Sun
 * visibility transitions. Boundary termination is retained separately.
 */
export function splitAtmosphereBranch({
	branch,
	directionToSource,
	bottomRadiusMeters,
}) {
	if (branch === null || typeof branch !== 'object' || branch.valid !== true) {
		throw new TypeError('A valid atmosphere branch is required.');
	}
	const source = requireVector(
		directionToSource,
		'directionToSource',
		{unit: true},
	);
	const tangentDistance = -dot(branch.origin, branch.direction);
	const visibilityCandidates = sourceVisibilityCandidateDistances({
		origin: branch.origin,
		direction: branch.direction,
		directionToSource: source,
		bottomRadiusMeters,
	});
	const candidateDistances = uniqueSortedDistances(
		[tangentDistance, ...visibilityCandidates],
		branch.lengthMeters,
	);
	const events = [];
	for (const distanceMeters of candidateDistances) {
		const point = addScaled(branch.origin, branch.direction, distanceMeters);
		if (Math.abs(distanceMeters - tangentDistance) <= 1e-5) {
			events.push(Object.freeze({kind: 'radial-tangent', distanceMeters, point}));
		}
		if (visibilityCandidates.some(
			(candidate) => Math.abs(candidate - distanceMeters) <= 1e-5,
		)) {
			const probe = Math.min(1, distanceMeters / 4, (branch.lengthMeters - distanceMeters) / 4);
			const before = resolveDistantSourceVisibility({
				point: addScaled(branch.origin, branch.direction, distanceMeters - probe),
				directionToSource: source,
				bottomRadiusMeters,
			}).visible;
			const after = resolveDistantSourceVisibility({
				point: addScaled(branch.origin, branch.direction, distanceMeters + probe),
				directionToSource: source,
				bottomRadiusMeters,
			}).visible;
			if (before !== after) {
				events.push(Object.freeze({
					kind: 'source-visibility',
					distanceMeters,
					point,
					visibleBefore: before,
					visibleAfter: after,
				}));
			}
		}
	}
	events.sort((left, right) => left.distanceMeters - right.distanceMeters);
	const breakpoints = uniqueSortedDistances(
		events.map((event) => event.distanceMeters),
		branch.lengthMeters,
	);
	const boundaries = [0, ...breakpoints, branch.lengthMeters];
	const segments = Object.freeze(boundaries.slice(0, -1).map((start, index) => {
		const end = boundaries[index + 1];
		const midpoint = (start + end) / 2;
		return Object.freeze({
			startDistanceMeters: start,
			endDistanceMeters: end,
			lengthMeters: end - start,
			sourceVisible: resolveDistantSourceVisibility({
				point: addScaled(branch.origin, branch.direction, midpoint),
				directionToSource: source,
				bottomRadiusMeters,
			}).visible,
		});
	}));
	return Object.freeze({
		branch,
		events: Object.freeze(events),
		segments,
	});
}
