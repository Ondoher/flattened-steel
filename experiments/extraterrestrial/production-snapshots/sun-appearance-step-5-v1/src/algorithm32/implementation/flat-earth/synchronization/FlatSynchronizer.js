import AngleMath from '../../../math/AngleMath.js';
import {SolarPosition} from '../../../geometry-support/solar/SolarPosition.js';
import {TimeMath} from '../../../time/TimeMath.js';

/** Milliseconds per day constant. */
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
/** Milliseconds per second constant. */
const MILLISECONDS_PER_SECOND = 1000;
/** Seconds per day constant. */
const SECONDS_PER_DAY = 24 * 60 * 60;
/** Degrees per orbit constant. */
const DEGREES_PER_ORBIT = 360;

/** Flat-world Sun synchronization state for app-owned local Sun setup. */
export class FlatSynchronizer {
	/** Selected calibration mode. @type {FlatSynchronizationMode | null} */
	_calibrationMode = null;

	/**
	 * Called by FlatSynchronizer to resolve a positive modulo for orbit and
	 * longitude calculations.
	 *
	 * @param {number} value - Supplies the value.
	 * @param {number} divisor - Supplies the divisor.
	 * @returns {number} - The positive modulo result.
	 */
	_positiveModulo(value, divisor) {
		return ((value % divisor) + divisor) % divisor;
	}

	/**
	 * Called by FlatSynchronizer to normalize a longitude to `[-180, 180)` and
	 * canonicalize negative zero. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {number} longitudeDegrees - Supplies the longitude in degrees.
	 * @returns {number} - The normalized longitude.
	 */
	_normalizeLongitude(longitudeDegrees) {
		const normalized = this._positiveModulo(longitudeDegrees + 180, DEGREES_PER_ORBIT) - 180;

		return Object.is(normalized, -0) ? 0 : normalized;
	}

	/**
	 * Called by FlatSynchronizer to create one synchronized position packet
	 * from accepted orbit facts.
	 *
	 * @param {FlatSynchronizerPositionRequest} request - The position facts.
	 * @returns {FlatSynchronizedPosition} - The synchronized position packet.
	 */
	_createPositionPacket(request) {
		const startLongitudeDegrees = AngleMath.toDegrees(request.startLongitude);
		const orbitAngleDegrees = AngleMath.toDegrees(request.orbitAngle);
		const longitudeDegrees = this._normalizeLongitude(startLongitudeDegrees - orbitAngleDegrees);

		return {
			mode: request.mode,
			latitude: request.startLatitude,
			longitude: AngleMath.inDegrees(longitudeDegrees),
			startLatitude: request.startLatitude,
			startLongitude: request.startLongitude,
			startTime: request.startTime,
			orbitAngle: request.orbitAngle,
			elapsed: request.elapsed,
			orbitPeriod: TimeMath.durationInSeconds(SECONDS_PER_DAY),
		};
	}

	/**
	 * Called by FlatSynchronizer to create the UTC world anchor for one target
	 * date.
	 *
	 * @param {Date} targetTime - The target instant.
	 * @returns {FlatSynchronizerWorldAnchor} - The world anchor packet.
	 */
	_createWorldAnchor(targetTime) {
		const anchor = SolarPosition.resolveWorldAnchor(targetTime.toISOString());

		return {
			startLatitude: anchor.latitude,
			startLongitude: anchor.longitude,
			startTime: new Date(anchor.instant),
		};
	}

	/**
	 * Called by FlatSynchronizer to convert one canonical ISO timestamp into a
	 * Date while retaining the caller-selected failure message.
	 *
	 * @param {string} value - Supplies the ISO timestamp.
	 * @param {string} errorMessage - Supplies the failure message.
	 * @returns {Date} - The resolved Date.
	 * @throws {TypeError} - When the value is not the exact canonical ISO form.
	 */
	_dateFromIsoTimestamp(value, errorMessage) {
		if (typeof value !== 'string') {
			throw new TypeError(errorMessage);
		}

		const date = new Date(value);

		if (Number.isNaN(date.getTime()) || date.toISOString() !== value) {
			throw new TypeError(errorMessage);
		}

		return date;
	}

	/**
	 * Called by FlatSynchronizer to resolve a closest-approach point into
	 * latitude and normalized longitude degrees.
	 *
	 * @param {FlatSynchronizationClosestPoint} value - Supplies the
	 * closest-approach point.
	 * @returns {readonly [number, number]} - The latitude and longitude in degrees.
	 * @throws {TypeError} - When either angle does not satisfy the angle contract.
	 */
	_closestPointFrom(value) {
		AngleMath.assertAngle(value?.latitude, 'FlatSynchronizer closest latitude');
		AngleMath.assertAngle(value?.longitude, 'FlatSynchronizer closest longitude');
		const latitudeDegrees = AngleMath.toDegrees(value.latitude);
		const longitudeDegrees = AngleMath.toDegrees(value.longitude);

		return [latitudeDegrees, this._normalizeLongitude(longitudeDegrees)];
	}

	/**
	 * Called by flat synchronizer to fail loudly when position resolution is requested before calibration.
	 *
	 * @returns {void} -
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_assertWorldMode() {
		if (this._calibrationMode !== 'world') {
			throw new Error('FlatSynchronizer.getPosition requires calibrateToWorld() first.');
		}
	}

	/**
	 * Call this method to select world-synchronized calibration.
	 *
	 * @returns {FlatSynchronizer} - This synchronizer for chaining.
	 */
	calibrateToWorld() {
		this._calibrationMode = 'world';

		return this;
	}

	/**
	 * Call this method to resolve the synchronized flat Sun latitude/longitude for an instant. World mode anchors the daily orbit at the latitude where the standard Sun is overhead for the UTC date and longitude `0`. The anchor time is Greenwich apparent solar noon, estimated with the equation of time. The returned longitude then follows one clockwise 24-hour orbit from that anchor.
	 *
	 * @param {string} time - Supplies the target instant as an ISO timestamp.
	 * @returns {FlatSynchronizedPosition} - The synchronized position packet.
	 */
	getPosition(time) {
		this._assertWorldMode();
		const targetTime = this._dateFromIsoTimestamp(
			time,
			'FlatSynchronizer.getPosition requires a valid ISO timestamp.',
		);
		const anchor = this._createWorldAnchor(targetTime);
		const elapsedMilliseconds = targetTime.getTime() - anchor.startTime.getTime();
		const orbitAngleDegrees = this._positiveModulo(
			(elapsedMilliseconds / MILLISECONDS_PER_DAY) * DEGREES_PER_ORBIT,
			DEGREES_PER_ORBIT,
		);

		return this._createPositionPacket({
			mode: 'world',
			startLatitude: anchor.startLatitude,
			startLongitude: anchor.startLongitude,
			startTime: anchor.startTime.toISOString(),
			orbitAngle: AngleMath.inDegrees(orbitAngleDegrees),
			elapsed: TimeMath.durationInSeconds(elapsedMilliseconds / MILLISECONDS_PER_SECOND),
		});
	}

	/**
	 * Call this method to resolve a position from a supplied closest-approach point and orbit angle. The supplied latitude/longitude identifies the closest-approach point. The returned longitude applies the same clockwise orbit convention as world mode, so positive angles move west from the closest longitude.
	 *
	 * @param {string} time - Supplies the target instant as an ISO timestamp.
	 * @param {FlatSynchronizationClosestPoint} latitudeLongitude -
	 * Supplies the closest-approach latitude/longitude.
	 * @param {Angle} angle - Supplies the clockwise orbit angle.
	 * @returns {FlatSynchronizedPosition} - The synchronized position packet.
	 */
	getPositionFromClosest(time, latitudeLongitude, angle) {
		const targetTime = this._dateFromIsoTimestamp(
			time,
			'FlatSynchronizer.getPositionFromClosest requires a valid ISO timestamp.',
		);
		const [closestLatitudeDegrees, closestLongitudeDegrees] = this._closestPointFrom(latitudeLongitude);
		AngleMath.assertAngle(angle, 'FlatSynchronizer.getPositionFromClosest angle');
		const orbitAngleDegrees = this._positiveModulo(AngleMath.toDegrees(angle), DEGREES_PER_ORBIT);
		const elapsedMilliseconds = (orbitAngleDegrees / DEGREES_PER_ORBIT) * MILLISECONDS_PER_DAY;

		return this._createPositionPacket({
			mode: 'closest',
			startLatitude: AngleMath.inDegrees(closestLatitudeDegrees),
			startLongitude: AngleMath.inDegrees(closestLongitudeDegrees),
			startTime: targetTime.toISOString(),
			orbitAngle: AngleMath.inDegrees(orbitAngleDegrees),
			elapsed: TimeMath.durationInSeconds(elapsedMilliseconds / MILLISECONDS_PER_SECOND),
		});
	}

	/**
	 * Call this method to resolve the orbit time from a date, closest-approach point, and angle. The supplied time provides the date used for the world seasonal latitude and Greenwich solar-noon anchor. The supplied longitude identifies when the flat Sun is closest to that location. The angle then offsets from that closest approach on the same clockwise 24-hour orbit.
	 *
	 * @param {string} time - Supplies the date basis as an ISO timestamp.
	 * @param {FlatSynchronizationClosestPoint} latitudeLongitude -
	 * Supplies the closest-approach latitude/longitude.
	 * @param {Angle} angle - Supplies the clockwise orbit angle.
	 * @returns {string} - The resolved orbit time as an ISO timestamp.
	 */
	getTimeFromClosest(time, latitudeLongitude, angle) {
		const closestTime = this._dateFromIsoTimestamp(
			time,
			'FlatSynchronizer.getTimeFromClosest requires a valid ISO timestamp.',
		);
		const [, closestLongitudeDegrees] = this._closestPointFrom(latitudeLongitude);
		const anchor = this._createWorldAnchor(closestTime);
		AngleMath.assertAngle(angle, 'FlatSynchronizer.getTimeFromClosest angle');
		const orbitAngleDegrees = this._positiveModulo(
			AngleMath.toDegrees(angle) - closestLongitudeDegrees,
			DEGREES_PER_ORBIT,
		);
		const elapsedMilliseconds = (orbitAngleDegrees / DEGREES_PER_ORBIT) * MILLISECONDS_PER_DAY;

		return new Date(anchor.startTime.getTime() + elapsedMilliseconds).toISOString();
	}

	/**
	 * Resolve one geometry-owned observation instant from a date and location.
	 *
	 * @param {FlatEarthObservationInstantRequest} request - The selection request.
	 * @returns {string} - The selected canonical UTC instant.
	 * @throws {RangeError} - When the instant kind is unsupported or its required angle is absent.
	 */
	resolveObservationInstant(request) {
		if (request.kind === 'closest-angle') {
			if (request.angle === undefined) {
				throw new RangeError('Flat closest-angle observation instant requires an angle.');
			}

			return this.getTimeFromClosest(request.dateBasis, request.location, request.angle);
		}

		const solarNoon = this.getTimeFromClosest(request.dateBasis, request.location, AngleMath.inDegrees(0));
		if (request.kind === 'solar-noon') {
			return solarNoon;
		}
		if (request.kind !== 'sunrise' && request.kind !== 'sunset') {
			throw new RangeError(`Unsupported flat observation instant kind: ${request.kind}.`);
		}

		const solarNoonPosition = this.getPosition(solarNoon);
		const latitudeRadians = AngleMath.toRadians(request.location.latitude);
		const declinationRadians = AngleMath.toRadians(solarNoonPosition.latitude);
		const hourAngleCosine = -Math.tan(latitudeRadians) * Math.tan(declinationRadians);

		if (hourAngleCosine < -1 || hourAngleCosine > 1) {
			return solarNoon;
		}

		const eventOffsetHours = AngleMath.toDegrees(AngleMath.inRadians(Math.acos(hourAngleCosine))) / 15;
		const signedOffsetHours = request.kind === 'sunrise' ? -eventOffsetHours : eventOffsetHours;

		return new Date(new Date(solarNoon).getTime() + signedOffsetHours * 60 * 60 * 1000).toISOString();
	}
}
