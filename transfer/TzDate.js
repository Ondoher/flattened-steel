import logger from '@ondohers/logger';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const HALF_HOUR = 30 * MINUTE;

export default class TzDate {
	constructor(tz) {
		this.tz = tz;
		this.localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		this.midnights = {};
		this.dateStamps = {};
		this.dateDetails = {};
		this.parts = {};
	}

	/**
	 * Call this method to convert a date object into a DateParts. Date parts
	 * are always in the proper time zone
	 *
	 * @param {Date} date a date within the given day
	 *
	 * @returns {DateParts}
	 */
	makeParts(date) {
		// special case the local timezone
		logger.startTimer('makeParts');
		var ts = date.getTime();
		var key = Math.floor(ts / HALF_HOUR) * HALF_HOUR;
		if (this.parts[key]) return this.parts[key];
		if (this.localTimeZone === this.tz) {
			let separator;
			if (!this.separator) {
				var separators = ['/', '-', '.', '. '];
				var dateStr = date.toLocaleDateString();

				separator = separators.find(function(separator) {
					return dateStr.split(separator).length !== 1;
				});
				this.separator = separator;
			}

			let offset = date.getTimezoneOffset();
			let sign = offset < 0 ? '-' : '+';
			offset = Math.abs(offset);
			let hour = Math.floor(offset / 60);
			let minute = Math.floor(offset % 60);

			hour = ('' + hour).padStart(2, '0');
			minute = ('' + minute).padStart(2, '0');

			let timeZoneName=`Z${sign}${hour}:${minute}`;
			separator = this.separator;

			let parts = {
				year: date.getFullYear(),
				month: date.getMonth() + 1,
				day: date.getDate(),
				hour: date.getHours(),
				minute: date.getMinutes(),
				second: date.getSeconds(),
				separator,
				timeZoneName,
			};

			this.parts[key] = parts;
			logger.stopTimer('makeParts');
			return parts;
		}

		//logger.log(key, 'makeParts:key');
		//logger.clock(key, 'makeParts:key');

		const options = {
			hour: 'numeric',
			minute: 'numeric',
			second: 'numeric',
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
			hour12: false,
			timeZoneName: 'longOffset',
			timeZone: this.tz,
		};

		logger.startTimer('makeParts:Intl.DateTimeFormat');
		const dateTimeFormat = new Intl.DateTimeFormat('en-US', options);
		var parts = dateTimeFormat.formatToParts(date);
		logger.stopTimer('makeParts:Intl.DateTimeFormat');

		parts = parts.reduce((parts, part) => {
			var name = part.type;
			var value = part.value;

			if (name === 'literal') {
				name = 'separator';
			} else if (name !== 'timeZoneName') {
				value = Number(value);
			}

			parts[name] = parts[name] || value;

			return parts;
		}, {});

		parts.hour = parts.hour % 24;

		parts.timeZoneName = parts.timeZoneName.replace('GMT', 'Z');

		this.parts[key] = parts;
		logger.stopTimer('makeParts');

		return parts;
	}

	search(timestamp, cb) {
		var bottom = timestamp - 24 * HOUR;
		var top =  timestamp + 24 * HOUR;
		var times = 24;

		var delta = cb(timestamp);

		while (delta !== 0) {
			logger.startTimer('findTimeWithinDate:delta');
			if (times < 24) logger.log(timestamp, 'timestamp - 1');
			// if (times < 24) logger.log(bottom, 'bottom');
			// if (times < 24) logger.log(top, 'top');
			// if (times < 24) logger.log(delta, 'delta');

			if (delta > 0) bottom = timestamp;
			else if (delta < 0) top = timestamp;

			timestamp = bottom + (top - bottom) / 2;
			// if (times < 24) logger.log(timestamp, 'timestamp - 2');
			delta = cb(timestamp);
			logger.stopTimer('findTimeWithinDate:delta');
			times++;
		}

		return timestamp;
	}

	/**
	 * Given a Date, find midnight for that date in the timezone. Because the
	 * number of hours after midnight is not predictable by the given date,
	 * due to Daylight Saving, this will need to be found by subtracting an hour
	 * at a time
	 *
	 * @param {Date} date a time within the date being searched
	 *
	 * @returns {Date} a date for midnight on the day in the correct timezone
	 */
	findMidnight(date) {
		var key = date.getTime();
		if (this.midnights[key]) return this.midnights[key];
		logger.startTimer('findMidnight');
		logger.push('findMidnight');

		var ts = date.getTime();

		// truncate the minutes and seconds and milliseconds
		ts = Math.floor(ts / HOUR) * HOUR;
		date = new Date(ts);

		var parts = this.makeParts(date);
		var prevTs = ts;

		// get the base date details
		var startDetails = this.partsToDateDetails(parts);
		var curDetails = this.partsToDateDetails(parts);

		/*
		ts = this.search(ts, (ts) => {
			date = new Date(ts);
			parts = this.makeParts(date);
			curDetails = this.partsToDateDetails(parts);

			// we've found it if we've gone too far
			return this.compareDates(startDetails, curDetails);
		});
		*/

		/**/
		var found = false;
		while(!found) {
			ts -= HOUR;
			date = new Date(ts);
			parts = this.makeParts(date);
			curDetails = this.partsToDateDetails(parts);

			// we've found it if we've gone too far
			found = this.compareDates(startDetails, curDetails) > 0;
			if (!found) prevTs = ts;
		}
		/**/

		date = new Date(prevTs);
		this.midnights[key] = date;
		logger.pop();
		logger.stopTimer('findMidnight');

		return date;
	}

	/**
	 * Given a date, return that date converted to the DateDetails in the
	 * correct tz. The date will be forced to midnight before conversion
	 *
	 * @param {Date} date
	 *
	 * @returns {DateDetails}
	 */
	dateToDateDetails(date) {
		var key = date.getTime();
		if (this.dateDetails[key]) return this.dateDetails[key];
		date = this.findMidnight(date);
		var parts = this.makeParts(date);

		var result = this.partsToDateDetails(parts);

		this.dateDetails[key] = result;

		return result;
	}

	/**
	 * Call this method to convert a DateDetails object into a Date in the UTC
	 * timezone
	 *
	 * @param {DateDetails} dateDetails
	 *
	 * @returns {Date}
	 */
	dateDetailsToDate({year, month, day}) {
		return new Date(Date.UTC(year, month - 1, day));
	}

	/**
	 * Given a timestamp, turn that into a DateDetails in the correct timezone.
	 * The time stamp does not need to be set at midnight, but does need to
	 * be inside the correct day
	 *
	 * @param {Number} timestamp
	 *
	 * @returns {DateDetails}
	 */
	timestampToDateDetails(timestamp) {
		var date = new Date(timestamp);

		var parts = this.makeParts(date);

		//logger.log(parts, 'timestampToDateDetails:parts');
		var result = this.partsToDateDetails(parts);

		return result;
	}

	/**
	 * Given a DateDetails return that date as a timestamp in UTC timezone
	 *
	 * @param {DateDetails} dateDetails
	 *
	 * @returns {Number} time stamp of the given DateDetails
	 */
	dateDetailsToTimestamp(dateDetails) {
		return this.dateDetailsToDate(dateDetails).getTime();
	}

	/**
	 * Call this method to compare the given dates. Return < 0 if the first date
	 * is lower, > 0 if it is higher, and 0 if they match
	 *
	 * @param {DateDetails} dateDetails1
	 * @param {DateDetails} dateDetails2
	 *
	 * @returns {Number} < 0 if the first date is lower, > 0 if it is higher,
	 * 	and 0 if they match
	 */
	compareDates(dateDetails1, dateDetails2) {
		var ts1 = this.dateDetailsToTimestamp(dateDetails1);
		var ts2 = this.dateDetailsToTimestamp(dateDetails2);

		return ts1 - ts2;
	}

	/**
	 * Call this method to convert the DateParts object to a DateDetails
	 *
	 * @param {DateParts} data
	 *
	 * @returns {DateDetails}
	 */
	partsToDateDetails({month, day, year}) {
		return {month, day, year};
	}

	/**
	 * Given a DateDetails object, find a time somewhere in the date for the
	 * correct timezone. This will adjust for DST
	 *
	 * @param {DateDetails} dateDetails
	 * @returns {Date}
	 */
	findTimeWithinDate(dateDetails) {
		logger.startTimer('findTimeWithinDate');

		// take our first stab at it. start with UTC
		var date = this.dateDetailsToDate(dateDetails);
		var timestamp = date.getTime();
		var curDetails = this.timestampToDateDetails(timestamp);
		//var delta = this.compareDates(dateDetails, curDetails);

		// until the guess is on the date to match, keep adding or subtracting
		// an hour

		// var bottom = timestamp - 24 * HOUR;
		// var top =  timestamp + 24 * HOUR;
		// var times = 24;

		timestamp = this.search(timestamp, (timestamp) => {
			curDetails = this.timestampToDateDetails(timestamp);
			return this.compareDates(dateDetails, curDetails);
		});

		// timestamp is now a timestamp that is within the given date in the
		// correct timezone, but not necessarily at midnight, find midnight for
		// that timestamp in the correct timezone and return a date
		logger.stopTimer('findTimeWithinDate');
		return new Date(timestamp);
	}

	/**
	 * Call this method to get a timestamp for the midnight in correct zone for
	 * the date specified in the date details. This will adjust for DST
	 *
	 * @param {DateDetails} dateDetails the date in question.
	 *
	 * @returns {Number} the timestamp for midnight in the timezone
	 */
	getTimestampForDay(dateDetails) {
		var key = JSON.stringify(dateDetails);
		if (this.dateStamps[key]) return this.dateStamps[key];

		var foundDate = this.findTimeWithinDate(dateDetails);

		// found date is a time somewhere in the specified date details for the
		// correct timezone, but not necessarily at midnight, find midnight for
		// for the date and return the timestamp
		foundDate = this.findMidnight(foundDate);
		this.dateStamps[key] = foundDate.getTime();
		return foundDate.getTime();
	}

	/**
	 * Given a DateDetails increment it by one day and return the result
	 *
	 * @param {DateDetails} dateDetails
	 *
	 * @returns {DateDetails}
	 */
	nextDay({year, month, day}) {
		// when constructing a date the date object will properly roll over
		// the month, day or year. This will use local time, but I'm just
		// pulling out the date parts, so that's okay
		var date = new Date(year, month - 1, day + 1);

		month = date.getMonth() + 1;
		year = date.getFullYear();
		day = date.getDate();

		return {year, month, day};
	}

	/**
	 * Call this method to change the given date by the number of days
	 *
	 * @param {DateDetails} from the date to change
	 * @param {Number} days the number of days to add to the passed date. This
	 * value can be negative
	 *
	 * @returns {DateDetails}
	 */
	addDays({year, month, day}, days) {
		// when constructing a date the date object will properly roll over
		// the month, day or year. This will use local time, but I'm just
		// pulling out the date parts, so that's okay
		var date = new Date(year, month - 1, day + days);

		month = date.getMonth() + 1;
		year = date.getFullYear();
		day = date.getDate();

		return {year, month, day};
	}

	/**
	 * Call this method to change the given date by the number of months
	 *
	 * @param {DateDetails} from the date to change
	 * @param {Number} months the number of months to add to the passed date.
	 * This value can be negative
	 *
	 * @returns {DateDetails}
	 */
	addMonths({year, month, day}, months) {
		// when constructing a date the date object will properly roll over
		// the month, day or year. This will use local time, but I'm just
		// pulling out the date parts, so that's okay
		var date = new Date(year, month - 1 + months, day);

		month = date.getMonth() + 1;
		year = date.getFullYear();
		day = date.getDate();

		return {year, month, day};
	}

	/**
	 * Call this method to change the given date by the number of years
	 *
	 * @param {DateDetails} from the date to change
	 * @param {Number} years the number of months to add to the passed date.
	 * This value can be negative
	 *
	 * @returns {DateDetails}
	 */
	addYears({year, month, day}, years) {
		// when constructing a date the date object will properly roll over
		// the month, day or year. This will use local time, but I'm just
		// pulling out the date parts, so that's okay
		var date = new Date(year + years, month - 1, day);

		month = date.getMonth() + 1;
		year = date.getFullYear();
		day = date.getDate();

		return {year, month, day};
	}

	/**
	 * Call this method to normalize the date in case it contains values outside
	 * of the proper date ranges
	 *
	 * @param {DateDetails} date
	 *
	 * @returns DateDetails}
	 */
	normalizeDate({year, month, day}) {
		// when constructing a date the date object will properly roll over
		// the month, day or year. This will use local time, but I'm just
		// pulling out the date parts, so that's okay
		var date = new Date(year, month - 1, day);

		month = date.getMonth() + 1;
		year = date.getFullYear();
		day = date.getDate();

		return {year, month, day};
	}

	/**
	 * Call this method to get an array of timestamps at midnight for each
	 * day in the given range, the last date will be included in the result.
	 * The length of each day might not be in increments of 24 hours in cases
	 * where a day is on the adjustment for Daylight Saving.
	 *
	 * @param {DateDetails} start
	 * @param {DateDetails} end
	 *
	 * @returns {Array.<Number>}
	 */
	getDayStarts(start, end) {
		var result = [this.getTimestampForDay(start)];
		var cur = this.nextDay(start);
		var delta = this.compareDates(end, cur);

		while (delta >= 0) {
			let ts = this.getTimestampForDay(cur);
			result.push(ts);
			cur = this.nextDay(cur);
			delta = this.compareDates(end, cur);
		}

		return result;
	}
}
