import {getLocalDateTimeParts} from '../../../models/LocalDateTime.js';
import React from 'react';
import {Service} from '@polylith/core';
import GlobalConfigurationPanel from '../components/GlobalConfigurationPanel.jsx';
import GlobalConfigurationSummary from '../components/GlobalConfigurationSummary.jsx';
import {LocalDateTimeFormat} from '../../../models/LocalDateTimeFormat.js';

/**
 * Selects the feature-owned global configuration panel presentation.
 */
export class GlobalConfigurationView extends Service {
	/**
	 * Creates the global configuration presentation capability.
	 *
	 * @param {unknown} registry - Optional isolated application registry.
	 */
	constructor(registry) {
		super('global-configuration-view', registry);
		this.dateTimeFormat = new LocalDateTimeFormat();
		this.implement([
			'ready',
			'stop',
			'getComponent',
			'getState',
			'setQuery',
			'selectCity',
			'setCoordinate',
			'applyCoordinates',
			'retryCities',
			'setDateTimeField',
			'applyDateTime',
			'getSummaryComponent',
			'openEditor',
		]);
	}

	/**
	 * Call this method after dependency readiness to relay the owning controller's state changes.
	 */
	ready() {
		this.stop();
		this.controller = /** @type {GlobalConfigurationControllerService} */ (
			this.registry.subscribe('global-configuration-controller')
		);
		this._listener = this.controller.listen('state-changed', (state) =>
			this.fire('state-changed', this._project(state)),
		);
	}

	/**
	 * Call this method to detach the exact owned controller listener.
	 */
	stop() {
		if (this._listener) {
			this.controller.unlisten('state-changed', this._listener);
		}
		this._listener = null;
	}

	/**
	 * Call this method to create the global location editor through its presentation boundary.
	 *
	 * @returns {React.ReactElement} - Feature-owned configuration content.
	 */
	getComponent() {
		return React.createElement(GlobalConfigurationPanel, {configurationView: this, initialState: this.getState()});
	}

	/**
	 * Call this method to project controller facts into location-editor presentation.
	 *
	 * @returns {GlobalConfigurationPresentation} - Prepared labels, status keys, and editor values.
	 */
	getState() {
		return this._project(this.controller.getState());
	}

	/**
	 * Called by reads and state events to project one snapshot without repeating its catalog search.
	 *
	 * @param {GlobalConfigurationState} state - Controller snapshot.
	 * @returns {GlobalConfigurationPresentation} - Prepared editor presentation.
	 */
	_project(state) {
		let location = state.location;
		let dateTime = state.timestamp == null ? null : getLocalDateTimeParts(state.timestamp);
		let matches = state.matches.map((city) => ({
			id: city.id,
			name: city.name,
			detail: [city.admin1Name ?? city.admin1, city.country].filter(Boolean).join(', '),
		}));
		let catalogMessage = 'global-configuration.cities.ready';
		if (state.catalogStatus === 'error') {
			catalogMessage = 'global-configuration.cities.error';
		} else if (state.catalogStatus !== 'ready') {
			catalogMessage = 'global-configuration.cities.loading';
		} else if (state.editor.query.trim() && !matches.length) {
			catalogMessage = 'global-configuration.cities.no-results';
		}
		return {
			summaryTime:
				state.timestamp == null
					? ''
					: new Intl.DateTimeFormat(undefined, {dateStyle: 'medium', timeStyle: 'medium'}).format(
							state.timestamp,
						),
			dateTime: {
				editor: state.dateTimeEditor,
				dateError: state.dateTimeEditor.dateError
					? `global-configuration.date-time.date.${state.dateTimeEditor.dateError}`
					: null,
				timeError: state.dateTimeEditor.timeError
					? `global-configuration.date-time.time.${state.dateTimeEditor.timeError}`
					: null,
				accepted: dateTime
					? `${this.dateTimeFormat.formatDate(dateTime.date)} ${this.dateTimeFormat.formatTime(dateTime.time)}`
					: null,
			},
			editor: state.editor,
			matches,
			searchEnabled: state.catalogStatus === 'ready',
			catalogMessage,
			canRetry: state.catalogStatus === 'error',
			coordinateError: state.editor.coordinateError
				? `global-configuration.coordinates.${state.editor.coordinateError}`
				: null,
			locationLabel: location?.city
				? [location.city.name, location.city.admin1Name ?? location.city.admin1, location.city.country]
						.filter(Boolean)
						.join(', ')
				: null,
			locationCoordinates: location ? `${location.latitude}, ${location.longitude}` : null,
		};
	}

	/**
	 * Call this method to relay a city query to the owning controller.
	 *
	 * @param {string} query - User-entered search text.
	 */
	setQuery(query) {
		this.controller.setQuery(query);
	}

	/**
	 * Call this method to relay selection of a city identity.
	 *
	 * @param {string} id - Stable selected-city identity.
	 */
	selectCity(id) {
		this.controller.selectCity(id);
	}

	/**
	 * Call this method to relay a coordinate draft edit.
	 *
	 * @param {LocationCoordinateField} field - Edited coordinate field.
	 * @param {string} value - User-entered coordinate text.
	 */
	setCoordinate(field, value) {
		this.controller.setCoordinate(field, value);
	}

	/**
	 * Call this method to relay acceptance of coordinate drafts.
	 */
	applyCoordinates() {
		this.controller.applyCoordinates();
	}

	/**
	 * Call this method to request another city-data load after a failure.
	 *
	 * @returns {Promise<void>} - Completion of the retry workflow.
	 */
	retryCities() {
		return this.controller.retryCities();
	}

	/**
	 * Call this method to relay a local date or time draft edit.
	 *
	 * @param {DateTimeDraftField} field - Date or time field being edited.
	 * @param {string} value - Uncommitted input text.
	 */
	setDateTimeField(field, value) {
		this.controller.setDateTimeField(field, value);
	}

	/**
	 * Call this method to request acceptance of the complete date/time drafts.
	 */
	applyDateTime() {
		this.controller.applyDateTime();
	}
	/**
	 * Call this method to select accepted-value toolbar summaries.
	 *
	 * @returns {React.ReactElement} - Feature-owned shared summaries.
	 */
	getSummaryComponent() {
		return React.createElement(GlobalConfigurationSummary, {
			configurationView: this,
		});
	}

	/**
	 * Call this method to relay a provider-owned focus intent.
	 *
	 * @param {string} focus - Editor focus intent.
	 */
	openEditor(focus) {
		this.controller.openEditor(focus);
	}
}

new GlobalConfigurationView();
