/** Meters per kilometer constant. */
const METERS_PER_KILOMETER = 1000;
/** Meters constant. */
const METERS = 'meters';
/** Kilometers constant. */
const KILOMETERS = 'kilometers';

/**
 * Called by this module to create a distance packet in kilometers.
 *
 * @param {number} value - Supplies the distance value.
 * @returns {Distance} - The distance packet.
 */
function inKilometers(value) {
	return {
		value,
		units: KILOMETERS,
	};
}

/**
 * Called by this module to create a distance packet in meters.
 *
 * @param {number} value - Supplies the distance value.
 * @returns {Distance} - The distance packet.
 */
function inMeters(value) {
	return {
		value,
		units: METERS,
	};
}

/**
 * Called by this module to return a distance packet value in meters. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {Distance} distance - Supplies the distance packet.
 * @returns {number} - The distance in meters.
 */
function toMeters(distance) {
	if (distance.units === KILOMETERS) {
		return distance.value * METERS_PER_KILOMETER;
	}

	return distance.value;
}

/**
 * Called by this module to return a distance packet value in kilometers. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {Distance} distance - Supplies the distance packet.
 * @returns {number} - The distance in kilometers.
 */
function toKilometers(distance) {
	if (distance.units === METERS) {
		return distance.value / METERS_PER_KILOMETER;
	}

	return distance.value;
}

/**
 * Called by this module to add two distance packets and return the result in the left packet's units. Conditional result values are selected from the accepted input and current state.
 *
 * @param {Distance} left - Supplies the left distance packet.
 * @param {Distance} right - Supplies the right distance packet.
 * @returns {Distance} - The summed distance packet.
 */
function add(left, right) {
	return {
		value: left.units === KILOMETERS ? left.value + toKilometers(right) : left.value + toMeters(right),
		units: left.units,
	};
}

/**
 * Called by this module to subtract one distance packet from another and return the result in the left packet's units. Conditional result values are selected from the accepted input and current state.
 *
 * @param {Distance} left - Supplies the left distance packet.
 * @param {Distance} right - Supplies the right distance packet.
 * @returns {Distance} - The difference distance packet.
 */
function subtract(left, right) {
	return {
		value: left.units === KILOMETERS ? left.value - toKilometers(right) : left.value - toMeters(right),
		units: left.units,
	};
}

/**
 * Called by this module to scale a distance packet by a scalar factor.
 *
 * @param {Distance} distance - Supplies the distance packet.
 * @param {number} factor - Supplies the scalar factor.
 * @returns {Distance} - The scaled distance packet.
 */
function scale(distance, factor) {
	return {
		value: distance.value * factor,
		units: distance.units,
	};
}

/**
 * Called by this module to assert that a distance packet uses the production distance unit contract.
 *
 * @param {unknown} distance - Supplies the candidate distance packet.
 * @param {string} [label] - Supplies the error label.
 * @returns {void} -
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
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
 * Called by this module to assert one ordered distance series at a system boundary.
 *
 * @param {unknown} series - Supplies the candidate series.
 * @param {string} [label] - Supplies the error label.
 * @returns {void} -
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
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

	if (
		candidate.values.some(
			/**
			 * Called by Array.prototype.some to test one collection value for a matching condition.
			 * @param value - The value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (value) => !Number.isFinite(value),
		)
	) {
		throw new TypeError(`${label}.values must contain only finite numbers.`);
	}
}

/**
 * Called by this module to assert one physical position at a system boundary.
 *
 * @param {unknown} position - Supplies the candidate position.
 * @param {string} [label] - Supplies the error label.
 * @returns {void} -
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 */
function assertPosition(position, label = 'position') {
	if (!position || typeof position !== 'object') {
		throw new TypeError(`${label} must contain three coordinates and distance units.`);
	}
	const candidate = /** @type {{ coordinates?: unknown, units?: unknown }} */ (position);

	if (!Array.isArray(candidate.coordinates) || candidate.coordinates.length !== 3) {
		throw new TypeError(`${label} must contain three coordinates and distance units.`);
	}

	if (candidate.units !== METERS && candidate.units !== KILOMETERS) {
		throw new TypeError(`${label}.units must be "meters" or "kilometers".`);
	}

	if (
		candidate.coordinates.some(
			/**
			 * Called by Array.prototype.some to test one collection value for a matching condition.
			 * @param value - The value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (value) => !Number.isFinite(value),
		)
	) {
		throw new TypeError(`${label}.coordinates must contain only finite numbers.`);
	}
}

/**
 * Called by this module to normalize an accepted distance series to local meter scalars.
 *
 * @param {DistanceSeries} series - Supplies the accepted series.
 * @returns {number[]} - Values normalized to meters.
 */
function toMetersSeries(series) {
	const scale = series.units === KILOMETERS ? METERS_PER_KILOMETER : 1;
	return series.values.map(
		/**
		 * Called by Array.prototype.map to transform one collection value.
		 * @param value - The value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (value) => value * scale,
	);
}

/**
 * Called by this module to normalize an accepted physical position to local meter scalars.
 *
 * @param {Position} position - Supplies the accepted position.
 * @returns {[number, number, number]} - Coordinates normalized to meters.
 */
function toMetersPosition(position) {
	const scale = position.units === KILOMETERS ? METERS_PER_KILOMETER : 1;
	return [position.coordinates[0] * scale, position.coordinates[1] * scale, position.coordinates[2] * scale];
}

/**
 * Called by this module to accept a physical position and normalize its coordinates to meters.
 *
 * @param {unknown} value - The candidate position.
 * @param {string} label - The diagnostic label.
 * @returns {[number, number, number]} - The coordinates in meters.
 *
 */
function acceptPositionInMeters(value, label) {
	assertPosition(value, label);
	return toMetersPosition(/** @type {Position} */ (value));
}

/**
 * Called by this module to create a physical position from meter coordinates.
 *
 * @param {readonly number[]} coordinates - The meter coordinates.
 * @returns {Position} - The physical position in meters.
 *
 */
function positionInMeters(coordinates) {
	return {coordinates: [coordinates[0], coordinates[1], coordinates[2]], units: METERS};
}

/**
 * Called by this module to resolve a positive physical distance in meters with an omission default. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {Distance | undefined} value - The optional distance.
 * @param {number} defaultValueMeters - The default in meters.
 * @param {string} label - The diagnostic label.
 * @returns {number} - The positive distance in meters.
 * @throws {RangeError} - When an accepted value is outside the supported range.
 */
function positiveMetersOrDefault(value, defaultValueMeters, label) {
	if (value === undefined) {
		return defaultValueMeters;
	}

	assertDistance(value, label);
	const valueMeters = toMeters(value);

	if (valueMeters <= 0) {
		throw new RangeError(`${label} must be a positive distance.`);
	}

	return valueMeters;
}

/**
 * Called by this module to normalize an optional physical distance to meters. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {unknown} value - The optional distance.
 * @param {string} label - The diagnostic label.
 * @returns {number | null} - The distance in meters, or null when omitted.
 */
function optionalMeters(value, label) {
	if (value === undefined) {
		return null;
	}

	assertDistance(value, label);
	return toMeters(/** @type {Distance} */ (value));
}

/**
 * Called by this module to resolve a unit-bearing position along one physical ray while preserving component evaluation order.
 *
 * @param {Position} origin - The ray origin.
 * @param {UnitVector3} direction - The ray direction.
 * @param {number} distanceAlongRayMeters - The normalized path distance.
 * @returns {Position} - The physical position in meters.
 *
 */
function positionAlongRay(origin, direction, distanceAlongRayMeters) {
	const originMeters = toMetersPosition(origin);

	return {
		coordinates: [
			originMeters[0] + direction[0] * distanceAlongRayMeters,
			originMeters[1] + direction[1] * distanceAlongRayMeters,
			originMeters[2] + direction[2] * distanceAlongRayMeters,
		],
		units: METERS,
	};
}

/** Physical distance and position conversion, validation, and arithmetic operations. */
export default {
	add,
	acceptPositionInMeters,
	assertDistance,
	assertDistanceSeries,
	assertPosition,
	inKilometers,
	inMeters,
	optionalMeters,
	positionAlongRay,
	positionInMeters,
	positiveMetersOrDefault,
	scale,
	subtract,
	toKilometers,
	toMeters,
	toMetersPosition,
	toMetersSeries,
};
