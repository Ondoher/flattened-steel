import {Registry} from '@polylith/core';
import {AnimationLoopService} from '../../../services/animation-loop.js';
import {ConfigurationService} from '../../../services/configuration.js';
import {formatCalendarDate, parseCalendarDate} from '../../../models/CalendarDate.js';
import {formatClockTime, parseClockTime} from '../../../models/ClockTime.js';
import {getLocalDateTimeParts, toLocalTimestamp} from '../../../models/LocalDateTime.js';
import {LocalDateTimeFormat} from '../../../models/LocalDateTimeFormat.js';
import {DateTimeEditorModel} from '../models/DateTimeEditorModel.js';

/**
 * Call this function to initialize registered date/time drafts with an explicit entry locale.
 *
 * @param {string} locale - Entry formatting locale.
 * @returns {DateTimeEditorModelService} - Public date/time editing model.
 */
function createEditor(locale) {
	let registry = new Registry();
	let editor = new DateTimeEditorModel(registry);
	editor.start({locale});
	return registry.subscribe('date-time-editor-model');
}

/**
 * Call this function to create shared configuration backed by an isolated fixed animation clock.
 *
 * @returns {ConfigurationService} - Ready shared configuration capability.
 */
function createConfiguration() {
	let registry = new Registry();
	let clock = new AnimationLoopService(registry);
	clock.start({autoStart: false});
	let configuration = new ConfigurationService(registry);
	configuration.start();
	configuration.ready();
	return configuration;
}

describe('app-wide date/time models', () => {
	it('initializes shared date/time from one local clock reading and retains accepted edits as time advances', () => {
		jasmine.clock().install();
		try {
			jasmine.clock().mockDate(new Date(2024, 1, 29, 23, 58, 47));
			let configuration = createConfiguration();
			expect(configuration.get().timestamp).toBe(new Date(2024, 1, 29, 23, 58).getTime());
			expect(configuration.get().location).toBeUndefined();
			let accepted = new Date(2025, 2, 14, 0, 0).getTime();
			configuration.setTimestamp(accepted);
			jasmine.clock().tick(5 * 60 * 1000);
			expect(configuration.get().timestamp).toBe(accepted);
		} finally {
			jasmine.clock().uninstall();
		}
	});

	it('validates actual Gregorian dates without JavaScript Date rollover or early-year conversion', () => {
		expect(parseCalendarDate('2024-02-29')).toEqual({year: 2024, month: 2, day: 29});
		expect(parseCalendarDate('2000-02-29')).not.toBeNull();
		expect(parseCalendarDate('0099-12-31')).toEqual({year: 99, month: 12, day: 31});
		expect(formatCalendarDate({year: 99, month: 1, day: 2})).toBe('0099-01-02');
		for (let invalid of [
			'',
			'2024-',
			'2023-02-29',
			'1900-02-29',
			'2024-04-31',
			'2024-13-01',
			'0000-01-01',
			'02/29/2024',
		]) {
			expect(parseCalendarDate(invalid)).toBeNull();
		}
	});

	it('accepts midnight and end-of-day minutes without reading a locale or time zone', () => {
		expect(parseClockTime('00:00')).toEqual({hour: 0, minute: 0});
		expect(parseClockTime('23:59')).toEqual({hour: 23, minute: 59});
		expect(formatClockTime({hour: 0, minute: 5})).toBe('00:05');
		for (let invalid of ['', '12:', '24:00', '23:60', '9:30', '12:30 PM', '12:30:00']) {
			expect(parseClockTime(invalid)).toBeNull();
		}
	});

	it('keeps partial drafts and reports errors without inventing an accepted date or time', () => {
		let editor = createEditor('sv-SE');
		expect(editor.getValue()).toBeNull();
		expect(editor.getState().dateError).toBe('required');
		expect(editor.getState().timeError).toBe('required');
		editor.setField('date', '2024-02-29');
		editor.setField('time', '00:00');
		expect(editor.getValue()).toBe(new Date(2024, 1, 29, 0, 0).getTime());
		editor.setField('date', '2024-02-');
		expect(editor.getValue()).toBeNull();
		expect(editor.getState().date).toBe('2024-02-');
		expect(editor.getState().dateError).toBe('invalid');
	});

	it('uses local date order and separators without guessing ambiguous dates', () => {
		let us = new LocalDateTimeFormat('en-US');
		let gb = new LocalDateTimeFormat('en-GB');
		let de = new LocalDateTimeFormat('de-DE');
		let jp = new LocalDateTimeFormat('ja-JP');
		expect(us.dateHint).toBe('MM/DD/YYYY');
		expect(gb.dateHint).toBe('DD/MM/YYYY');
		expect(de.dateHint).toBe('DD.MM.YYYY');
		expect(jp.dateHint).toBe('YYYY/MM/DD');
		expect(us.parseDate('03/04/2024')).toEqual({year: 2024, month: 3, day: 4});
		expect(gb.parseDate('03/04/2024')).toEqual({year: 2024, month: 4, day: 3});
		expect(de.parseDate('29.02.2024')).toEqual({year: 2024, month: 2, day: 29});
		expect(jp.parseDate('2024/02/29')).toEqual({year: 2024, month: 2, day: 29});
		expect(us.parseDate('02/29/2023')).toBeNull();
		expect(us.parseDate('2024-02-29')).toBeNull();
		expect(gb.parseDate('31/04/2024')).toBeNull();
		expect(us.parseDate('02/29/')).toBeNull();
	});

	it('converts local midnight, noon, and case-insensitive day periods to 24-hour parts', () => {
		let us = new LocalDateTimeFormat('en-US');
		let gb = new LocalDateTimeFormat('en-GB');
		expect(us.parseTime('12:00 AM')).toEqual({hour: 0, minute: 0});
		expect(us.parseTime('12:00 pm')).toEqual({hour: 12, minute: 0});
		expect(us.parseTime('1:45 PM')).toEqual({hour: 13, minute: 45});
		expect(us.parseTime('00:00 AM')).toBeNull();
		expect(us.parseTime('13:00 PM')).toBeNull();
		expect(us.parseTime('1:45')).toBeNull();
		expect(us.parseTime('1:60 PM')).toBeNull();
		expect(gb.parseTime('00:00')).toEqual({hour: 0, minute: 0});
		expect(gb.parseTime('23:59')).toEqual({hour: 23, minute: 59});
		expect(gb.parseTime('24:00')).toBeNull();
	});

	it('round trips localized digits, punctuation, day periods, and early years without date rollover', () => {
		for (let locale of [
			'en-US',
			'en-GB',
			'de-DE',
			'ja-JP',
			'ar-EG',
			'ko-KR',
			'fi-FI',
			'en-US-u-hc-h11',
			'en-US-u-hc-h24',
		]) {
			let format = new LocalDateTimeFormat(locale);
			for (let date of [
				{year: 2024, month: 2, day: 29},
				{year: 99, month: 12, day: 31},
			]) {
				expect(format.parseDate(format.formatDate(date)))
					.withContext(locale)
					.toEqual(date);
			}
			for (let time of [
				{hour: 0, minute: 0},
				{hour: 12, minute: 0},
				{hour: 23, minute: 59},
			]) {
				expect(format.parseTime(format.formatTime(time)))
					.withContext(locale)
					.toEqual(time);
			}
		}
	});

	it('prepares locale-specific drafts and hints while retaining partial edits until explicit acceptance', () => {
		let editor = createEditor('en-US');
		editor.reset(new Date(2024, 1, 29, 13, 45).getTime());
		expect(editor.getState().date).toBe('02/29/2024');
		expect(editor.getState().dateFormat).toBe('MM/DD/YYYY');
		expect(editor.getState().timeFormat).toContain('AM/PM');
		expect(editor.getValue()).toBe(new Date(2024, 1, 29, 13, 45).getTime());
		editor.setField('time', '1:');
		expect(editor.getValue()).toBeNull();
		expect(editor.getState().time).toBe('1:');
		expect(editor.getState().timeError).toBe('invalid');
	});

	it('stores a single absolute timestamp, reports its property, and protects independent snapshots', () => {
		let configuration = createConfiguration();
		configuration.setLocation({latitude: 0, longitude: 0});
		let timestamp = new Date(2024, 1, 29, 13, 45).getTime();
		let changed = jasmine.createSpy('changed');
		configuration.listen('changed', changed);
		expect(configuration.setTimestamp(timestamp)).toBeTrue();
		expect(changed.calls.mostRecent().args[1]).toEqual(['timestamp']);
		expect(configuration.get()).toEqual({timestamp, location: {latitude: 0, longitude: 0, city: undefined}});
		let snapshot = configuration.get();
		snapshot.timestamp = 0;
		snapshot.location.latitude = 1;
		expect(configuration.get().timestamp).toBe(timestamp);
		expect(configuration.get().location.latitude).toBe(0);
		expect(configuration.setTimestamp(timestamp)).toBeFalse();
		expect(changed).toHaveBeenCalledTimes(1);
		configuration.setLocation({latitude: 1, longitude: 2});
		expect(configuration.get().timestamp).toBe(timestamp);
	});

	it('rejects invalid timestamps without replacing the accepted instant', () => {
		let configuration = createConfiguration();
		configuration.setTimestamp(0);
		for (let invalid of [NaN, Infinity, -Infinity, 1.5, 8640000000000001]) {
			expect(() => configuration.setTimestamp(invalid)).toThrowError(RangeError);
			expect(configuration.get().timestamp).toBe(0);
		}
	});

	it('converts local parts to epoch milliseconds and retains early years without 1900 coercion', () => {
		let date = {year: 2024, month: 2, day: 29};
		let time = {hour: 13, minute: 45};
		let timestamp = toLocalTimestamp(date, time);
		expect(timestamp).toBe(new Date(2024, 1, 29, 13, 45).getTime());
		expect(getLocalDateTimeParts(timestamp)).toEqual({date, time});
		let early = toLocalTimestamp({year: 99, month: 12, day: 31}, {hour: 0, minute: 5});
		expect(new Date(early).getFullYear()).toBe(99);
		expect(getLocalDateTimeParts(early)).toEqual({
			date: {year: 99, month: 12, day: 31},
			time: {hour: 0, minute: 5},
		});
		expect(new Date(timestamp).getSeconds()).toBe(0);
		expect(new Date(timestamp).getMilliseconds()).toBe(0);
	});

	it('treats epoch zero as an accepted instant rather than missing input', () => {
		let editor = createEditor('en-US');
		editor.reset(0);
		expect(editor.getState().date).not.toBe('');
		expect(editor.getState().time).not.toBe('');
		expect(editor.getValue()).toBe(0);
	});
});
