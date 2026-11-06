import {Service} from '@polylith/core';
import {getLocalDateTimeParts, toLocalTimestamp} from '../../../models/LocalDateTime.js';
import {LocalDateTimeFormat} from '../../../models/LocalDateTimeFormat.js';

/**
 * Owns locale-formatted date/time drafts independently of accepted application configuration.
 *
 * @implements {DateTimeEditorModelService}
 */
export class DateTimeEditorModel extends Service {
	/**
	 * Registers the feature-owned date/time draft capability.
	 *
	 * @param {unknown} registry - Optional isolated application registry.
	 */
	constructor(registry) {
		super('date-time-editor-model', registry);
		this.implement(['start', 'reset', 'getState', 'setField', 'getValue']);
	}

	/**
	 * Call this method to initialize local drafts in the configured browser entry format.
	 *
	 * @param {{locale?: string}} [configuration] - Optional locale for date/time entry.
	 */
	start({locale} = {}) {
		this.format = new LocalDateTimeFormat(locale);
		this.reset();
	}

	/**
	 * Call this method to reset local drafts from the accepted timestamp.
	 *
	 * @param {EpochTimestamp} [timestamp] - Accepted instant when present.
	 */
	reset(timestamp) {
		let parts = timestamp == null ? null : getLocalDateTimeParts(timestamp);
		/** @type {DateTimeEditorState} */
		this.state = {
			date: parts ? this.format.formatDate(parts.date) : '',
			time: parts ? this.format.formatTime(parts.time) : '',
			dateFormat: this.format.dateHint,
			timeFormat: this.format.timeHint,
			dirty: false,
			dateError: null,
			timeError: null,
		};
	}

	/**
	 * Call this method to read a defensive copy of date/time drafts and feedback.
	 *
	 * @returns {DateTimeEditorState} - Current editing state.
	 */
	getState() {
		return {...this.state};
	}

	/**
	 * Call this method to edit one input without committing accepted values.
	 *
	 * @param {DateTimeDraftField} field - Date or time input being edited.
	 * @param {string} value - Uncommitted input text.
	 */
	setField(field, value) {
		this.state[field] = value;
		this.state.dirty = true;
		let errorField = field === 'date' ? 'dateError' : 'timeError';
		this.state[errorField] = null;
	}

	/**
	 * Call this method to parse and validate both drafts before offering them to configuration.
	 *
	 * @returns {EpochTimestamp|null} - Valid device-local entry converted to an instant, or null with validation feedback.
	 */
	getValue() {
		let date = this.format.parseDate(this.state.date);
		let time = this.format.parseTime(this.state.time);
		this.state.dateError = date ? null : this.state.date.trim() ? 'invalid' : 'required';
		this.state.timeError = time ? null : this.state.time.trim() ? 'invalid' : 'required';
		return date && time ? toLocalTimestamp(date, time) : null;
	}
}

new DateTimeEditorModel();
