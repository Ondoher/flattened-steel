import {isCalendarDate} from './CalendarDate.js';
import {isClockTime} from './ClockTime.js';

/**
 * Formats and parses Gregorian calendar and clock parts using the browser's entry conventions.
 */
export class LocalDateTimeFormat {
	/**
	 * Creates matching numeric entry patterns without assigning a location or converting an instant.
	 *
	 * @param {string} [locale] - Explicit formatting locale, or the browser's default when omitted.
	 */
	constructor(locale) {
		this.date = new Intl.DateTimeFormat(locale, {
			calendar: 'gregory',
			timeZone: 'UTC',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		});
		this.time = new Intl.DateTimeFormat(locale, {timeZone: 'UTC', hour: 'numeric', minute: '2-digit'});
		this.hourCycle = this.time.resolvedOptions().hourCycle;
		let numbers = new Intl.NumberFormat(locale, {useGrouping: false});
		this.digits = Array.from({length: 10}, (_, digit) => numbers.format(digit));
		let sample = new Date('2006-11-22T06:08:00Z');
		this.dateParts = this.date.formatToParts(sample);
		this.timeParts = this.time.formatToParts(sample);
		this.periods = [6, 18].map((hour) => {
			sample.setUTCHours(hour);
			return this.time.formatToParts(sample).find((part) => part.type === 'dayPeriod')?.value ?? '';
		});
		this.dateHint = this._hint(this.dateParts);
		this.timeHint = this._hint(this.timeParts);
	}

	/**
	 * Called by parsing to accept localized digits, ordinary spaces, and text copied from formatted values.
	 *
	 * @param {string} text - Input or format literal.
	 * @returns {string} - Comparable input without bidirectional formatting controls.
	 */
	_normalize(text) {
		let result = text;
		this.digits.forEach((digit, index) => {
			result = result.replaceAll(digit, String(index));
		});
		return result.normalize('NFKC').replace(/[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '');
	}

	/**
	 * Called by pattern construction to treat locale punctuation as literal input.
	 *
	 * @param {string} text - Locale literal or day-period label.
	 * @returns {string} - Escaped expression accepting normal or nonbreaking whitespace.
	 */
	_escape(text) {
		return this._normalize(text)
			.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
			.replace(/\s+/g, '\\s+');
	}

	/**
	 * Called at construction to prepare a visible pattern in the locale's field order.
	 *
	 * @param {Intl.DateTimeFormatPart[]} parts - Numeric formatter output.
	 * @returns {string} - Entry hint including localized day-period choices when applicable.
	 */
	_hint(parts) {
		let tokens = {
			year: 'YYYY',
			month: 'MM',
			day: 'DD',
			hour: this.periods[0] ? 'hh' : 'HH',
			minute: 'mm',
			dayPeriod: this.periods.join('/'),
		};
		return parts.map((part) => tokens[part.type] ?? part.value).join('');
	}

	/**
	 * Called by date/time parsing to match exactly the locale's numeric fields and separators.
	 *
	 * @param {string} text - Uncommitted entry text.
	 * @param {Intl.DateTimeFormatPart[]} parts - Pattern determining numeric field order.
	 * @returns {Record<string, string>|null} - Captured field values, or null for an incomplete or mismatched entry.
	 */
	_parse(text, parts) {
		let pattern = parts
			.map((part) => {
				if (part.type === 'literal') {
					return /^\s+$/u.test(part.value) ? '\\s+' : this._escape(part.value);
				}
				if (part.type === 'dayPeriod') {
					let choices = this.periods.map((period) => this._escape(period)).join('|');
					return `(?<dayPeriod>${choices})`;
				}
				let width = part.type === 'year' ? 4 : 2;
				return `(?<${part.type}>[0-9]{1,${width}})`;
			})
			.join('');
		return new RegExp(`^${pattern}$`, 'iu').exec(this._normalize(text).trim())?.groups ?? null;
	}

	/**
	 * Call this method to format Gregorian parts without interpreting them in a device or location time zone.
	 *
	 * @param {CalendarDate} date - Accepted Gregorian calendar parts.
	 * @returns {string} - Local numeric date text.
	 */
	formatDate({year, month, day}) {
		let carrier = new Date(0);
		carrier.setUTCFullYear(year, month - 1, day);
		return this.date.format(carrier);
	}

	/**
	 * Call this method to format clock parts with the locale's hour cycle and day-period labels.
	 *
	 * @param {ClockTime} time - Accepted clock parts.
	 * @returns {string} - Local time text at minute precision.
	 */
	formatTime({hour, minute}) {
		let carrier = new Date(0);
		carrier.setUTCHours(hour, minute);
		return this.time.format(carrier);
	}

	/**
	 * Call this method to parse the displayed date order and validate the actual Gregorian day.
	 *
	 * @param {string} text - Local date entry.
	 * @returns {CalendarDate|null} - Valid calendar parts, or null while incomplete or invalid.
	 */
	parseDate(text) {
		let fields = this._parse(text, this.dateParts);
		if (!fields) {
			return null;
		}
		let date = {year: Number(fields.year), month: Number(fields.month), day: Number(fields.day)};
		return isCalendarDate(date) ? date : null;
	}

	/**
	 * Call this method to parse local clock text and normalize midnight/noon into 24-hour parts.
	 *
	 * @param {string} text - Local time entry, including a day period for a 12-hour locale.
	 * @returns {ClockTime|null} - Valid clock parts, or null while incomplete or invalid.
	 */
	parseTime(text) {
		let fields = this._parse(text, this.timeParts);
		if (!fields) {
			return null;
		}
		let hour = Number(fields.hour);
		if (this.hourCycle === 'h12' || this.hourCycle === 'h11') {
			let minimum = this.hourCycle === 'h12' ? 1 : 0;
			if (hour < minimum || hour > minimum + 11) {
				return null;
			}
			let afternoon =
				this._normalize(fields.dayPeriod).toLocaleLowerCase() ===
				this._normalize(this.periods[1]).toLocaleLowerCase();
			hour = (hour % 12) + (afternoon ? 12 : 0);
		} else if (this.hourCycle === 'h24') {
			if (hour < 1 || hour > 24) {
				return null;
			}
			hour %= 24;
		}
		let time = {hour, minute: Number(fields.minute)};
		return isClockTime(time) ? time : null;
	}
}
