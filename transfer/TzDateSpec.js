/* global describe it expect beforeEach fdescribe fit xit*/

// all data validated here: https://www.gaijin.at/en/tools/time-converter

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

import TzDate from '../TzDate.js';

describe('TzDate Tests', function() {
	var tzDate;

	function makeExpected(year, month, day, hour, minute, second, timeZoneName) {
		return {year, month, day, hour, minute, second, timeZoneName};
	}

	function makeDate(year, month, day, hour, minute, second) {
		return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
	}

	function checkExpected(parts, expected) {
		delete parts.separator;
		expect(parts).toEqual(expected);
	}

	function makeDateDetails(year, month, day) {
		return {year, month, day};
	}

	describe('makeParts', function() {
		describe('Same DST', function() {
			describe('Negative Time Zone', function() {
				var tz = 'Z-05:00';
				beforeEach(function() {
					tzDate = new TzDate('America/New_York');
				});

				it('should convert given UTC', function() {
					var date = makeDate(2023, 12, 2, 1, 2, 3);
					var expected = makeExpected(2023, 12, 1, 20, 2, 3, tz);

					var parts = tzDate.makeParts(date);

					checkExpected(parts, expected);
				});

				it('should convert given UTC spanning month', function() {
					var date = makeDate(2023, 12, 1, 1, 2, 3);
					var expected = makeExpected(2023, 11, 30, 20, 2, 3, tz);

					var parts = tzDate.makeParts(date);

					checkExpected(parts, expected);
				});

				it('should convert given UTC spanning year', function() {
					var date = makeDate(2023, 1, 1, 1, 2, 3);
					var expected = makeExpected(2022, 12, 31, 20, 2, 3, tz);

					var parts = tzDate.makeParts(date);

					checkExpected(parts, expected);
				});
			});

			describe('Positive Time Zone', function() {
				var tz = 'Z+01:00';
				beforeEach(function() {
					tzDate = new TzDate('Europe/Paris');
				});

				it('should convert given UTC', function() {
					var date = makeDate(2023, 12, 1, 1, 2, 3);
					var expected = makeExpected(2023, 12, 1, 2, 2, 3, tz);

					var parts = tzDate.makeParts(date);

					checkExpected(parts, expected);
				});

				it('should convert given UTC spanning month', function() {
					var date = makeDate(2023, 11, 30, 23, 2, 3);
					var expected = makeExpected(2023, 12, 1, 0, 2, 3, tz);

					var parts = tzDate.makeParts(date);

					checkExpected(parts, expected);
				});

				it('should convert given UTC spanning year', function() {
					var date = makeDate(2023, 12, 31, 23, 2, 3);
					var expected = makeExpected(2024, 1, 1, 0, 2, 3, tz);

					var parts = tzDate.makeParts(date);

					checkExpected(parts, expected);
				});
			});

			describe('Negative 30 Minute Time Zone', function() {
				var tz = 'Z-03:30';

				beforeEach(function() {
					tzDate = new TzDate('America/St_Johns');
				});

				it('should convert given UTC', function() {
					var date = makeDate(2023, 12, 2, 12, 1, 2);
					var expected = makeExpected(2023, 12, 2, 8, 31, 2, tz);

					var parts = tzDate.makeParts(date);

					checkExpected(parts, expected);
				});

				it('should convert given UTC spanning month', function() {
					var date = makeDate(2023, 12, 1, 0, 1, 2);
					var expected = makeExpected(2023, 11, 30, 20, 31, 2, tz);

					var parts = tzDate.makeParts(date);

					checkExpected(parts, expected);
				});

				it('should convert given UTC spanning year', function() {
					var date = makeDate(2023, 1, 1, 0, 1, 2);
					var expected = makeExpected(2022, 12, 31, 20, 31, 2, tz);

					var parts = tzDate.makeParts(date);

					checkExpected(parts, expected);
				});
			});

			describe('Positive 30 Minute Time Zone', function() {
				var tz = 'Z+03:30';
				beforeEach(function() {
					tzDate = new TzDate('Asia/Tehran');
				});

				it('should convert given UTC', function() {
					var date = makeDate(2023, 12, 1, 0, 1, 2);
					var expected = makeExpected(2023, 12, 1, 3, 31, 2, tz);

					var parts = tzDate.makeParts(date);

					checkExpected(parts, expected);
				});

				it('should convert given UTC spanning month', function() {
					var date = makeDate(2023, 11, 30, 23, 1, 2);
					var expected = makeExpected(2023, 12, 1, 2, 31, 2, tz);

					var parts = tzDate.makeParts(date);

					checkExpected(parts, expected);
				});

				it('should convert given UTC spanning year', function() {
					var date = makeDate(2023, 12, 31, 23, 1, 2);
					var expected = makeExpected(2024, 1, 1, 2, 31, 2, tz);

					var parts = tzDate.makeParts(date);

					checkExpected(parts, expected);
				});
			});
		});

		describe('Spanning DST', function() {
			describe('Negative Time Zone', function() {
				var tz = 'Z-05:00';
				var dstTz = 'Z-04:00';

				beforeEach(function() {
					tzDate = new TzDate('America/New_York');
				});

				it('should convert spanning into DST', function() {
					var date = makeDate(2024, 3, 10, 6, 1, 2);
					var expected = makeExpected(2024, 3, 10, 1, 1, 2, tz);

					var parts = tzDate.makeParts(date);

					checkExpected(parts, expected);
					// increment by an hour to enter DST
					date = new Date(date.getTime() + HOUR);

					expected = makeExpected(2024, 3, 10, 3, 1, 2, dstTz);
					parts = tzDate.makeParts(date);
					checkExpected(parts, expected);
				});

				it('should convert spanning out of DST', function() {
					var date = makeDate(2024, 11, 3, 5, 59, 59);
					var expected = makeExpected(2024, 11, 3, 1, 59, 59, dstTz);

					var parts = tzDate.makeParts(date);
					checkExpected(parts, expected);

					// increment by an hour to exit DST
					date = new Date(date.getTime() + HOUR);

					expected = makeExpected(2024, 11, 3, 1, 59, 59, tz);
					parts = tzDate.makeParts(date);
					checkExpected(parts, expected);
				});
			});

			describe('Positive Time Zone', function() {
				var tz = 'Z+01:00';
				var dstTz = 'Z+02:00';

				beforeEach(function() {
					tzDate = new TzDate('Europe/Paris');
				});

				it('should convert spanning into DST', function() {
					var date = makeDate(2024, 3, 31, 0, 59, 59);
					var expected = makeExpected(2024, 3, 31, 1, 59, 59, tz);

					var parts = tzDate.makeParts(date);

					checkExpected(parts, expected);

					// increment by an hour to enter DST
					date = new Date(date.getTime() + HOUR);

					expected = makeExpected(2024, 3, 31, 3, 59, 59, dstTz);
					parts = tzDate.makeParts(date);
					checkExpected(parts, expected);
				});

				it('should convert spanning out of DST', function() {
					var date = makeDate(2024, 10, 27, 0, 59, 59);
					var expected = makeExpected(2024, 10, 27, 2, 59, 59, dstTz);

					var parts = tzDate.makeParts(date);

					checkExpected(parts, expected);

					// increment by an hour to enter DST
					date = new Date(date.getTime() + HOUR);

					expected = makeExpected(2024, 10, 27, 2, 59, 59, tz);
					parts = tzDate.makeParts(date);
					checkExpected(parts, expected);
				});
			});

			describe('Negative 30 Minute Time Zone', function() {
				var tz = 'Z-03:30';
				var dstTz = 'Z-02:30';

				beforeEach(function() {
					tzDate = new TzDate('America/St_Johns');
				});

				it('should convert spanning into DST', function() {
					var date = makeDate(2024, 3, 10, 5, 29, 59);
					var expected = makeExpected(2024, 3, 10, 1, 59, 59, tz);

					var parts = tzDate.makeParts(date);
					checkExpected(parts, expected);

					// increment by an hour to enter DST
					date = new Date(date.getTime() + HOUR);

					expected = makeExpected(2024, 3, 10, 3, 59, 59, dstTz);
					parts = tzDate.makeParts(date);
					checkExpected(parts, expected);
				});

				it('should convert spanning out of DST', function() {
					var date = makeDate(2024, 11, 3, 4, 29, 59);
					var expected = makeExpected(2024, 11, 3, 1, 59, 59, dstTz);

					var parts = tzDate.makeParts(date);

					checkExpected(parts, expected);

					// increment by an hour to enter DST
					date = new Date(date.getTime() + HOUR);

					expected = makeExpected(2024, 11, 3, 1, 59, 59, tz);
					parts = tzDate.makeParts(date);
					checkExpected(parts, expected);
				});
			});

			describe('Positive 30 Minute Time Zone', function() {
				var tz = 'Z+09:30';
				var dstTz = 'Z+10:30';

				beforeEach(function() {
					tzDate = new TzDate('Australia/Broken_Hill');
				});


				it('should convert spanning into DST', function() {
					var date = makeDate(2024, 4, 6, 16, 29, 59);
					var expected = makeExpected(2024, 4, 7, 2, 59, 59, dstTz);

					var parts = tzDate.makeParts(date);

					checkExpected(parts, expected);

					// increment by an hour to enter DST
					date = new Date(date.getTime() + HOUR);

					expected = makeExpected(2024, 4, 7, 2, 59, 59, tz);
					parts = tzDate.makeParts(date);
					checkExpected(parts, expected);
				});

				it('should convert spanning out of DST', function() {
					var date = makeDate(2024, 10, 5, 16, 29, 59);
					var expected = makeExpected(2024, 10, 6, 1, 59, 59, tz);

					var parts = tzDate.makeParts(date);

					checkExpected(parts, expected);

					// increment by an hour to enter DST
					date = new Date(date.getTime() + HOUR);

					expected = makeExpected(2024, 10, 6, 3, 59, 59, dstTz);
					parts = tzDate.makeParts(date);
					checkExpected(parts, expected);
				});



			});
		});
	});

	describe('findMidnight', function() {
		it('should find midnight on a normal day', function() {
			tzDate = new TzDate('America/New_York');
			var date = makeDate(2024, 2, 2, 3, 30, 1);

			var midnight = tzDate.findMidnight(date);
			var ts = midnight.getTime();

			expect(ts).toBe(1706763600000);
		});

		describe('Mid morning DST', function() {
			beforeEach(function() {
				tzDate = new TzDate('America/New_York');
			});

			it('should find midnight on change into DST', function() {
				// at 2:00 clock changes to 3:00. there is no 2:00 23 hours
				// that day.
				// lose 1 hour, net: -1
				var date = makeDate(2024, 3, 10, 16, 0, 1);

				var midnight = tzDate.findMidnight(date);
				var ts = midnight.getTime();

				expect(ts).toBe(1710046800000);
			});

			it('should find midnight on change out of DST', function() {
				// at 3:00 clock changes to back to 2:00. 2:00 happens
				// twice. 25 hours that day,
				// gain 1 hour, net: 0
				var date = makeDate(2024, 11, 3, 17, 0, 1);

				var midnight = tzDate.findMidnight(date);
				var ts = midnight.getTime();

				expect(ts).toBe(1730606400000);
			});
		});

		describe('0:00 DST Change' , function() {
			beforeEach(function() {
				tzDate = new TzDate('Africa/Cairo');
			});

			it('should find midnight on change into DST at 0:00', function() {
				// at 0:00 clock changes to 1:00, there is no midnight. day
				// length is 23 hours, the previous day has 24 hours
				// lose 1 hour, net: -1
				var date = makeDate(2024, 4, 26, 9, 0, 1);

				var midnight = tzDate.findMidnight(date);
				var ts = midnight.getTime();

				expect(ts).toBe(1714082400000);
			});

			it('should find midnight on change from DST at 0:00', function() {
				// at 0:00 clock changes to 23:00 the previous day.
				// 23:00 the previous day happens twice. Day length the
				// previous day is 25 hours, 24 hours on the day the clock
				// changes
				// gain 1 hour, net: 0
				var date = makeDate(2024, 11, 1, 10, 0, 1);

				var midnight = tzDate.findMidnight(date);
				var ts = midnight.getTime();

				expect(ts).toBe(1730412000000);
			});
		});

		describe('1:00 DST Change' , function() {
			beforeEach(function() {
				tzDate = new TzDate('America/Havana');
			});

			it('should find midnight on change into DST forward to 1:00 ', function() {
				// at 0:00 clock jumps ahead to 1:00. There is no 0:00, day
				// length 23 hours
				// lose: 1 hour, net: -1
				var date = makeDate(2024, 3, 10, 16, 0, 1);

				var midnight = tzDate.findMidnight(date);
				var ts = midnight.getTime();

				expect(ts).toBe(1710046800000);
			});

			it('should find midnight on change from DST at 1:00', function() {
				// at 1:00 clock jumps back to 0:00. 0:00 happens twice, day
				// length is 25 hours
				// gain: 1 hour, net: 0
				var date = makeDate(2024, 11, 3, 17, 0, 1);

				var midnight = tzDate.findMidnight(date);
				var ts = midnight.getTime();

				expect(ts).toBe(1730606400000);
			});
		});
	});

	describe('getTimestampForDay', function() {
		it('should give midnight timestamp for a normal day', function() {
			tzDate = new TzDate('America/New_York');

			var ts = tzDate.getTimestampForDay(makeDateDetails(2024, 1, 2));
			expect(ts).toBe(1704171600000);
		});

		it('should give midnight timestamp for change into DST', function() {
			tzDate = new TzDate('America/New_York');

			var ts = tzDate.getTimestampForDay(makeDateDetails(2024, 3, 10));
			expect(ts).toBe(1710046800000);
		});

		it('should give midnight timestamp for change from DST', function() {
			tzDate = new TzDate('America/New_York');

			var ts = tzDate.getTimestampForDay(makeDateDetails(2024, 11, 3));
			expect(ts).toBe(1730606400000);
		});

		it('should give midnight timestamp for change into DST at 0:00', function() {
			tzDate = new TzDate('Africa/Cairo');

			var ts = tzDate.getTimestampForDay(makeDateDetails(2024, 4, 26));
			expect(ts).toBe(1714082400000);
		});

		it('should give midnight timestamp for change out of DST at 0:00', function() {
			tzDate = new TzDate('Africa/Cairo');

			var ts = tzDate.getTimestampForDay(makeDateDetails(2024, 11, 1));
			expect(ts).toBe(1730412000000);
		});

		it('should give midnight timestamp for change out of DST at 1:00', function() {
			tzDate = new TzDate('America/Havana');

			var ts = tzDate.getTimestampForDay(makeDateDetails(2024, 11, 3));
			expect(ts).toBe(1730606400000);
		});
	});

	describe('getDayStarts', function() {
		it('should get a series of days', function() {
			tzDate = new TzDate('America/New_York');
			var expected = [1704085200000, 1704171600000, 1704258000000, 1704344400000, 1704430800000, 1704517200000, 1704603600000];

			var starts = tzDate.getDayStarts(makeDateDetails(2024, 1, 1), makeDateDetails(2024, 1, 7));
			expect(starts).toEqual(expected);
		});

		it('should get a series of days spanning into DST', function() {
			tzDate = new TzDate('America/New_York');
			var expected = [1709787600000, 1709874000000, 1709960400000, 1710046800000, 1710129600000, 1710216000000, 1710302400000];

			var starts = tzDate.getDayStarts(makeDateDetails(2024, 3, 7), makeDateDetails(2024, 3, 13));

			expect(starts).toEqual(expected);
		});

		it('should get a series of days spanning out of DST', function() {
			tzDate = new TzDate('America/New_York');
			var expected = [1730347200000, 1730433600000, 1730520000000, 1730606400000, 1730696400000, 1730782800000, 1730869200000];
			var starts = tzDate.getDayStarts(makeDateDetails(2024, 10, 31), makeDateDetails(2024, 11, 6));

			expect(starts).toEqual(expected);
		});

		it('should give series of days spanning into DST at 0:00', function() {
			tzDate = new TzDate('Africa/Cairo');
			var expected = [1713823200000, 1713909600000, 1713996000000, 1714082400000, 1714165200000, 1714251600000, 1714338000000];
			var starts = tzDate.getDayStarts(makeDateDetails(2024, 4, 23), makeDateDetails(2024, 4, 29));

			expect(starts).toEqual(expected);
		});

		it('should give series of days spanning out of DST at 0:00', function() {
			tzDate = new TzDate('Africa/Cairo');
			var expected = [1730149200000, 1730235600000, 1730322000000, 1730412000000, 1730498400000, 1730584800000, 1730671200000];
			var starts = tzDate.getDayStarts(makeDateDetails(2024, 10, 29), makeDateDetails(2024, 11, 4));

			expect(starts).toEqual(expected);
		});

		it('should give series of days spanning out of DST at 1:00', function() {
			tzDate = new TzDate('America/Havana');
			var expected = [1730347200000, 1730433600000, 1730520000000, 1730606400000, 1730696400000, 1730782800000, 1730869200000];
			var starts = tzDate.getDayStarts(makeDateDetails(2024, 10, 31), makeDateDetails(2024, 11, 6));

			expect(starts).toEqual(expected);
		});

		it('should give series of days spanning year boundary', function() {
			tzDate = new TzDate('America/New_York');
			var expected = [1703826000000, 1703912400000, 1703998800000, 1704085200000, 1704171600000, 1704258000000, 1704344400000];
			var starts = tzDate.getDayStarts(makeDateDetails(2023, 12, 29), makeDateDetails(2024, 1, 4));

			expect(starts).toEqual(expected);
		});
	});
});
