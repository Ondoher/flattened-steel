function requireUnitVector(value, label) {
	if (!Array.isArray(value) || value.length !== 3) {
		throw new TypeError(`${label} must contain three components.`);
	}
	const vector = value.map((component) => Number(component));
	const length = Math.hypot(...vector);
	if (!Number.isFinite(length) || Math.abs(length - 1) > 1e-12) {
		throw new RangeError(`${label} must be a finite unit vector.`);
	}
	return vector;
}

function dot(left, right) {
	return left[0] * right[0]
		+ left[1] * right[1]
		+ left[2] * right[2];
}

function cross(left, right) {
	return [
		left[1] * right[2] - left[2] * right[1],
		left[2] * right[0] - left[0] * right[2],
		left[0] * right[1] - left[1] * right[0],
	];
}

function normalize(vector) {
	const length = Math.hypot(...vector);
	if (!Number.isFinite(length) || length <= 1e-14) {
		throw new RangeError('Canonical-frame axis is degenerate.');
	}
	return vector.map((component) => component / length);
}

/**
 * Create a right-handed frame with +z along observer up, +x toward the Sun's
 * horizontal projection, and +y completing x cross y = z.
 */
export function createObserverSunCanonicalFrame({
	observerUpDirectionUpEastNorth,
	directionToSourceUpEastNorth,
}) {
	const up = requireUnitVector(
		observerUpDirectionUpEastNorth,
		'observerUpDirectionUpEastNorth',
	);
	const source = requireUnitVector(
		directionToSourceUpEastNorth,
		'directionToSourceUpEastNorth',
	);
	const sourceUp = dot(source, up);
	const projected = source.map(
		(component, index) => component - sourceUp * up[index],
	);
	let xAxis;
	if (Math.hypot(...projected) > 1e-12) {
		xAxis = normalize(projected);
	} else {
		const references = [[0, 1, 0], [0, 0, 1], [1, 0, 0]];
		const reference = references.reduce((selected, candidate) =>
			Math.abs(dot(candidate, up)) < Math.abs(dot(selected, up))
				? candidate
				: selected);
		xAxis = normalize(reference.map(
			(component, index) => component - dot(reference, up) * up[index],
		));
	}
	const yAxis = normalize(cross(up, xAxis));
	const zAxis = up;
	const sourceCanonical = [
		dot(source, xAxis),
		dot(source, yAxis),
		dot(source, zAxis),
	];

	return Object.freeze({
		id: 'observer-up-sun-horizontal-canonical-frame-v1',
		inputCoordinates: 'up-east-north',
		outputCoordinates: 'toward-sun-horizontal-cross-up',
		handedness: 'right',
		xAxisUpEastNorth: Object.freeze(xAxis),
		yAxisUpEastNorth: Object.freeze(yAxis),
		zAxisUpEastNorth: Object.freeze(zAxis),
		directionToSourceCanonical: Object.freeze(sourceCanonical),
		solarZenithDegrees: Math.acos(sourceUp) * 180 / Math.PI,
		solarElevationDegrees: Math.asin(sourceUp) * 180 / Math.PI,
	});
}

/** Express one UEN unit direction in an existing canonical frame. */
export function expressUenDirectionInCanonicalFrame(frame, direction) {
	const unit = requireUnitVector(direction, 'UEN direction');
	return Object.freeze([
		dot(unit, frame.xAxisUpEastNorth),
		dot(unit, frame.yAxisUpEastNorth),
		dot(unit, frame.zAxisUpEastNorth),
	]);
}

/** Express one canonical unit direction in the original UEN frame. */
export function expressCanonicalDirectionInUenFrame(frame, direction) {
	const unit = requireUnitVector(direction, 'Canonical direction');
	return Object.freeze([0, 1, 2].map((component) =>
		unit[0] * frame.xAxisUpEastNorth[component]
		+ unit[1] * frame.yAxisUpEastNorth[component]
		+ unit[2] * frame.zAxisUpEastNorth[component]));
}
