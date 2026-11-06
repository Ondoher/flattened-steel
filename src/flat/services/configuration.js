import {Service} from '@polylith/core';

/**
 * Application configuration model-service, owning location and exposing the animation clock's timestamp.
 *
 * @implements {ConfigurationService}
 */
export class ConfigurationService extends Service {
	/**
	 * Creates the shared configuration capability.
	 *
	 * @param {unknown} registry - Optional isolated application registry.
	 */
	constructor(registry) {
		super('configuration', registry);
		this.implement(['start', 'ready', 'stop', 'get', 'setLocation', 'setTimestamp']);
	}

	/**
	 * Call this method to initialize location configuration before dependency readiness.
	 */
	start() {
		this.stop();
		/** @type {ApplicationConfiguration} */
		this.value = {};
		/** @type {AnimationLoopService|null} */
		this.clock = null;
		this._clockListener = null;
		this._publishedTimestamp = null;
	}

	/**
	 * Call this method to expose the clock's timestamp through the shared configuration capability.
	 */
	ready() {
		this.stop();
		this.clock = /** @type {AnimationLoopService} */ (this.registry.subscribe('animation-loop'));
		this._clockListener = this.clock.listenFrame(() => this._clockChanged());
		this._clockChanged();
	}

	/**
	 * Call this method to release only this facade's clock listener.
	 */
	stop() {
		if (this._clockListener) {
			this.clock.unlistenFrame(this._clockListener);
		}
		this._clockListener = null;
	}

	/**
	 * Called by clock frames to relay changed timestamps without maintaining another canonical clock.
	 */
	_clockChanged() {
		let timestamp = this.clock.getTimestamp();
		if (timestamp !== this._publishedTimestamp) {
			this._publishedTimestamp = timestamp;
			this.fire('changed', this.get(), ['timestamp']);
		}
	}

	/**
	 * Call this method to read a defensive snapshot of accepted application properties.
	 *
	 * @returns {ApplicationConfiguration} - Configuration with absent properties left absent.
	 */
	get() {
		let snapshot = {...this.value};
		if (this.clock) {
			snapshot.timestamp = this.clock.getTimestamp();
		}
		if (snapshot.location) {
			snapshot.location = {
				...snapshot.location,
				city: snapshot.location.city ? {...snapshot.location.city} : undefined,
			};
		}
		return snapshot;
	}

	/**
	 * Call this method to accept one shared geographic location and notify consumers.
	 *
	 * @param {ConfiguredLocation} location - Coordinates in degrees, with optional selected-city metadata.
	 * @returns {boolean} - Whether the accepted location changed.
	 * @throws {RangeError} - Coordinates are nonfinite or outside geographic latitude/longitude bounds.
	 */
	setLocation(location) {
		let {latitude, longitude, city} = location;
		if (
			!Number.isFinite(latitude) ||
			Math.abs(latitude) > 90 ||
			!Number.isFinite(longitude) ||
			Math.abs(longitude) > 180
		) {
			throw new RangeError('Location coordinates must be finite and within geographic bounds.');
		}
		let next = {latitude, longitude, city: city ? {...city} : undefined};
		let previous = this.value.location;
		if (
			previous?.latitude === latitude &&
			previous.longitude === longitude &&
			previous.city?.id === city?.id &&
			previous.city?.name === city?.name &&
			previous.city?.country === city?.country &&
			previous.city?.admin1 === city?.admin1 &&
			previous.city?.admin1Name === city?.admin1Name
		) {
			return false;
		}
		this.value = {...this.value, location: next};
		this.fire('changed', this.get(), ['location']);
		return true;
	}

	/**
	 * Call this method to accept a shared instant independently of date/time entry presentation.
	 *
	 * @param {EpochTimestamp} timestamp - Integer milliseconds since the Unix epoch.
	 * @returns {boolean} - Whether the accepted timestamp changed.
	 * @throws {RangeError} - The timestamp is not an integer within the JavaScript Date range.
	 */
	setTimestamp(timestamp) {
		return this.clock.setTimestamp(timestamp);
	}
}

new ConfigurationService();
