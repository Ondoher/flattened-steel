import {Service} from '@polylith/core';

/**
 * Owns location-editing drafts separately from the accepted application location.
 *
 * @implements {LocationEditorModelService}
 */
export class LocationEditorModel extends Service {
	/**
	 * Registers the feature-owned model capability in its application registry.
	 *
	 * @param {unknown} registry - Optional isolated application registry.
	 */
	constructor(registry) {
		super('location-editor-model', registry);
		this.implement([
			'start',
			'reset',
			'getState',
			'setQuery',
			'setCoordinate',
			'getCoordinates',
			'rejectCoordinates',
		]);
	}

	/**
	 * Call this method to initialize local model state before dependency readiness.
	 */
	start() {
		this.reset();
	}

	/**
	 * Call this method to initialize drafts from an accepted location without changing it.
	 *
	 * @param {ConfiguredLocation} [location] - Accepted configuration location, when present.
	 */
	reset(location) {
		/** @type {LocationEditorState} */
		this.state = {
			query: location?.city?.name ?? '',
			latitude: location ? String(location.latitude) : '',
			longitude: location ? String(location.longitude) : '',
			coordinateError: null,
		};
	}

	/**
	 * Call this method to read a defensive editing snapshot.
	 *
	 * @returns {LocationEditorState} - Current input drafts and validation feedback.
	 */
	getState() {
		return {...this.state};
	}

	/**
	 * Call this method to replace search text without changing accepted coordinates.
	 *
	 * @param {string} query - User-entered city search text.
	 */
	setQuery(query) {
		this.state.query = query;
	}

	/**
	 * Call this method to replace one coordinate draft without committing it.
	 *
	 * @param {LocationCoordinateField} field - Coordinate input being edited.
	 * @param {string} value - Uncommitted input text.
	 */
	setCoordinate(field, value) {
		this.state[field] = value;
		this.state.coordinateError = null;
	}

	/**
	 * Call this method to parse complete coordinate drafts for acceptance by the configuration owner.
	 *
	 * @returns {ConfiguredLocation|null} - Numeric coordinates, or null while either field is blank.
	 */
	getCoordinates() {
		if (!this.state.latitude.trim() || !this.state.longitude.trim()) {
			this.state.coordinateError = 'required';
			return null;
		}
		return {latitude: Number(this.state.latitude), longitude: Number(this.state.longitude)};
	}

	/**
	 * Call this method to report a domain rejection of the coordinate drafts.
	 */
	rejectCoordinates() {
		this.state.coordinateError = 'invalid';
	}
}

new LocationEditorModel();
