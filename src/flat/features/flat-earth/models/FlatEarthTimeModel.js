import {Service} from '@polylith/core';
import {FlatEarthGeometry} from '../../../../algorithm32/implementation/flat-earth/FlatEarthGeometry.js';

/**
 * Owns alternate time drafts and edit references while the application clock owns accepted time.
 *
 * @implements {FlatEarthTimeModelService}
 */
export class FlatEarthTimeModel extends Service {
	/**
	 * Registers the shared feature editor model in the application's registry.
	 *
	 * @param {unknown} registry - Optional isolated registry.
	 */
	constructor(registry) {
		super('flat-earth-time-model', registry);
		this.implement(['start', 'synchronize', 'getState', 'begin', 'seek', 'end', 'setDraft', 'accept', 'reset']);
	}

	/**
	 * Call this method to initialize only editor-owned state.
	 */
	start() {
		this.sequence ??= 0;
		this.gesture = null;
		this.reference = null;
		this.draft = '';
		this.dirty = false;
		this.error = false;
	}

	/**
	 * Call this method to invalidate obsolete gestures without replacing unfinished numeric text.
	 *
	 * @param {boolean} external - Whether another editor or location changed the reference.
	 */
	synchronize(external) {
		if (external) {
			this.gesture = null;
			this.reference = null;
		}
	}

	/**
	 * Called by editor operations to derive the current closest occurrence through public geometry.
	 *
	 * @param {ApplicationConfiguration} configuration - Accepted shared values.
	 * @returns {{closestInstant: string, angleDegrees: number}|null} - Available derived reference.
	 */
	_describe(configuration) {
		if (!configuration.location || configuration.timestamp == null) {
			return null;
		}
		let location = /** @type {FlatSynchronizationClosestPoint} */ ({
			latitude: {value: configuration.location.latitude, units: 'degrees'},
			longitude: {value: configuration.location.longitude, units: 'degrees'},
		});
		return FlatEarthGeometry.describeClosestApproach(new Date(configuration.timestamp).toISOString(), location);
	}

	/**
	 * Call this method to read derived time and editor draft facts without owning accepted time.
	 *
	 * @param {ApplicationConfiguration} configuration - Accepted shared values.
	 * @returns {FlatEarthTimeState} - Derived angle and editor state.
	 */
	getState(configuration) {
		let described = this._describe(configuration);
		let reference = this.reference ?? described?.closestInstant ?? null;
		let angle = reference ? (configuration.timestamp - Date.parse(reference)) / 240000 : null;
		let text =
			angle == null
				? ''
				: angle.toLocaleString('en-US', {
						useGrouping: false,
						minimumFractionDigits: 1,
						maximumFractionDigits: 6,
						signDisplay: 'always',
					});
		return {
			angle,
			closestInstant: reference,
			draft: this.dirty ? this.draft : text,
			dirty: this.dirty,
			error: this.error,
		};
	}

	/**
	 * Call this method to freeze a reference for one pointer or keyboard edit.
	 *
	 * @param {string} owner - Exact mounted control identity.
	 * @param {ApplicationConfiguration} configuration - Current accepted values.
	 * @returns {number} - Gesture token, or zero when location is absent.
	 */
	begin(owner, configuration) {
		let reference = this._describe(configuration)?.closestInstant;
		if (!reference) {
			return 0;
		}
		this.reference = reference;
		let token = ++this.sequence;
		this.gesture = {owner, token};
		this.reset();
		return token;
	}

	/**
	 * Call this method to resolve a current slider gesture to a shared timestamp.
	 *
	 * @param {string} owner - Mounted control identity.
	 * @param {number} token - Original gesture token.
	 * @param {number} angle - Requested signed degrees.
	 * @returns {number|null} - Resolved timestamp, or no write for an obsolete gesture.
	 */
	seek(owner, token, angle) {
		if (!this.gesture || this.gesture.owner !== owner || this.gesture.token !== token) {
			return null;
		}
		return this._resolve(angle);
	}

	/**
	 * Called by accepted numeric and slider input to validate the actual numeric domain.
	 *
	 * @param {number} angle - User-entered signed degrees.
	 * @returns {number} - Canonical integer timestamp.
	 */
	_resolve(angle) {
		if (!Number.isFinite(angle) || Math.abs(angle) > 180) {
			throw new RangeError('Degrees from closest must be between -180 and 180.');
		}
		return Date.parse(FlatEarthGeometry.resolveClosestOffset(this.reference, {value: angle, units: 'degrees'}));
	}

	/**
	 * Call this method to release only the matching control's gesture.
	 *
	 * @param {string} owner - Original control identity.
	 * @param {number} token - Original token.
	 */
	end(owner, token) {
		if (this.gesture?.owner === owner && this.gesture.token === token) {
			this.gesture = null;
		}
	}

	/**
	 * Call this method to retain unfinished numeric text independently of accepted time.
	 *
	 * @param {string} text - Unaccepted numeric input.
	 */
	setDraft(text) {
		this.draft = text;
		this.dirty = true;
		this.error = false;
	}

	/**
	 * Call this method to resolve complete numeric text against the current reference.
	 *
	 * @param {ApplicationConfiguration} configuration - Current accepted shared values.
	 * @returns {number|null} - New timestamp or no mutation for invalid/unavailable input.
	 */
	accept(configuration) {
		if (!this.dirty) {
			return null;
		}
		let angle = Number(this.draft.trim());
		if (
			!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(this.draft.trim()) ||
			!Number.isFinite(angle) ||
			Math.abs(angle) > 180
		) {
			this.error = true;
			return null;
		}
		let reference = this._describe(configuration)?.closestInstant;
		if (!reference) {
			return null;
		}
		this.reference = reference;
		this.gesture = null;
		let timestamp = this._resolve(angle);
		this.reset();
		return timestamp;
	}

	/**
	 * Call this method to discard the numeric draft while preserving accepted time.
	 */
	reset() {
		this.draft = '';
		this.dirty = false;
		this.error = false;
	}
}

new FlatEarthTimeModel();
