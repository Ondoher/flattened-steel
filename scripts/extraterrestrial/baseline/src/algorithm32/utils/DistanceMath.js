const METERS_PER_KILOMETER = 1000;
const METERS = 'meters';
const KILOMETERS = 'kilometers';

/**
 * Create a distance packet in kilometers.
 *
 * @param {number} value - Supplies the distance value.
 * @returns {Distance} The distance packet.
 */
function inKilometers(value) {
	return {
		value,
		units: KILOMETERS,
	};
}

/**
 * Create a distance packet in meters.
 *
 * @param {number} value - Supplies the distance value.
 * @returns {Distance} The distance packet.
 */
function inMeters(value) {
	return {
		value,
		units: METERS,
	};
}

/**
 * Return a distance packet value in meters.
 *
 * @param {Distance} distance - Supplies the distance packet.
 * @returns {number} The distance in meters.
 */
function toMeters(distance) {
	if (distance.units === KILOMETERS) {
		return distance.value * METERS_PER_KILOMETER;
	}

	return distance.value;
}

/**
 * Return a distance packet value in kilometers.
 *
 * @param {Distance} distance - Supplies the distance packet.
 * @returns {number} The distance in kilometers.
 */
function toKilometers(distance) {
	if (distance.units === METERS) {
		return distance.value / METERS_PER_KILOMETER;
	}

	return distance.value;
}

/**
 * Add two distance packets and return the result in the left packet's units.
 *
 * @param {Distance} left - Supplies the left distance packet.
 * @param {Distance} right - Supplies the right distance packet.
 * @returns {Distance} The summed distance packet.
 */
function add(left, right) {
	return {
		value: left.units === KILOMETERS ? left.value + toKilometers(right) : left.value + toMeters(right),
		units: left.units,
	};
}

/**
 * Subtract one distance packet from another and return the result in the left packet's units.
 *
 * @param {Distance} left - Supplies the left distance packet.
 * @param {Distance} right - Supplies the right distance packet.
 * @returns {Distance} The difference distance packet.
 */
function subtract(left, right) {
	return {
		value: left.units === KILOMETERS ? left.value - toKilometers(right) : left.value - toMeters(right),
		units: left.units,
	};
}

/**
 * Scale a distance packet by a scalar factor.
 *
 * @param {Distance} distance - Supplies the distance packet.
 * @param {number} factor - Supplies the scalar factor.
 * @returns {Distance} The scaled distance packet.
 */
function scale(distance, factor) {
	return {
		value: distance.value * factor,
		units: distance.units,
	};
}

/**
 * Assert that a distance packet uses the production distance unit contract.
 *
 * @param {unknown} distance - Supplies the candidate distance packet.
 * @param {string} [label] - Supplies the error label.
 * @returns {void}
 */
function assertDistance(distance, label = 'distance') {
	if (!distance || typeof distance !== 'object') {
		throw new TypeError(`${label} must be a unit-bearing distance packet.`);
	}
	const candidate = /** @type {{ value?: unknown, units?: unknown }} */ (distance);

	if (!Number.isFinite(candidate.value)) {
		throw new TypeError(`${label}.value must be finite.`);
	}

	if (candidate.units !== METERS && candidate.units !== KILOMETERS) {
		throw new TypeError(`${label}.units must be "meters" or "kilometers".`);
	}
}

/**
 * Assert one ordered distance series at a system boundary.
 *
 * @param {unknown} series - Supplies the candidate series.
 * @param {string} [label] - Supplies the error label.
 * @returns {void}
 */
function assertDistanceSeries(series, label = 'distance series') {
	if (!series || typeof series !== 'object') {
		throw new TypeError(`${label} must contain a values array and distance units.`);
	}
	const candidate = /** @type {{ values?: unknown, units?: unknown }} */ (series);

	if (!Array.isArray(candidate.values)) {
		throw new TypeError(`${label} must contain a values array and distance units.`);
	}

	if (candidate.units !== METERS && candidate.units !== KILOMETERS) {
		throw new TypeError(`${label}.units must be "meters" or "kilometers".`);
	}

	if (candidate.values.some((value) => !Number.isFinite(value))) {
		throw new TypeError(`${label}.values must contain only finite numbers.`);
	}
}

/**
 * Assert one physical position at a system boundary.
 *
 * @param {unknown} position - Supplies the candidate position.
 * @param {string} [label] - Supplies the error label.
 * @returns {void}
 */
function assertPosition(position, label = 'position') {
	if (!position || typeof position !== 'object') {
		throw new TypeError(`${label} must contain three coordinates and distance units.`);
	}
	const candidate = /** @type {{ coordinates?: unknown, units?: unknown }} */ (position);

	if (!Array.isArray(candidate.coordinates)
		|| candidate.coordinates.length !== 3) {
		throw new TypeError(`${label} must contain three coordinates and distance units.`);
	}

	if (candidate.units !== METERS && candidate.units !== KILOMETERS) {
		throw new TypeError(`${label}.units must be "meters" or "kilometers".`);
	}

	if (candidate.coordinates.some((value) => !Number.isFinite(value))) {
		throw new TypeError(`${label}.coordinates must contain only finite numbers.`);
	}
}

/**
 * Normalize an accepted distance series to local meter scalars.
 *
 * @param {DistanceSeries} series - Supplies the accepted series.
 * @returns {number[]} Values normalized to meters.
 */
function toMetersSeries(series) {
	const scale = series.units === KILOMETERS ? METERS_PER_KILOMETER : 1;
	return series.values.map((value) => value * scale);
}

/**
 * Normalize an accepted physical position to local meter scalars.
 *
 * @param {Position} position - Supplies the accepted position.
 * @returns {[number, number, number]} Coordinates normalized to meters.
 */
function toMetersPosition(position) {
	const scale = position.units === KILOMETERS ? METERS_PER_KILOMETER : 1;
	return [
		position.coordinates[0] * scale,
		position.coordinates[1] * scale,
		position.coordinates[2] * scale,
	];
}

export default {
	add,
	assertDistance,
	assertDistanceSeries,
	assertPosition,
	inKilometers,
	inMeters,
	scale,
	subtract,
	toKilometers,
	toMeters,
	toMetersPosition,
	toMetersSeries,
};
