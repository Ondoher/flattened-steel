import { FlatSynchronizer } from '../FlatSynchronizer.js';

describe('FlatSynchronizer', () => {
	it('requires world calibration before resolving a position', () => {
		const synchronizer = new FlatSynchronizer();

		expect(() => synchronizer.getPosition('2026-06-21T12:00:00.000Z'))
			.toThrowError(/calibrateToWorld/);
	});

	it('anchors world mode at solar noon on longitude zero', () => {
		const synchronizer = new FlatSynchronizer().calibrateToWorld();
		const firstPosition = synchronizer.getPosition('2026-06-21T12:00:00.000Z');
		const anchorPosition = synchronizer.getPosition(firstPosition.startTime);

		expect(firstPosition.mode).toBe('world');
		expect(firstPosition.startLongitude).toEqual(degrees(0));
		expect(firstPosition.startLatitude.value).toBeCloseTo(23.45, 1);
		expect(anchorPosition.latitude.value).toBeCloseTo(firstPosition.startLatitude.value, 12);
		expect(anchorPosition.longitude).toEqual(degrees(0));
		expect(anchorPosition.orbitAngle).toEqual(degrees(0));
	});

	it('moves longitude through one clockwise 24 hour orbit from the solar-noon anchor', () => {
		const synchronizer = new FlatSynchronizer().calibrateToWorld();
		const anchorPosition = synchronizer.getPosition('2026-03-20T12:00:00.000Z');
		const sixHoursAfterAnchor = new Date(
			new Date(anchorPosition.startTime).getTime() + 6 * 60 * 60 * 1000,
		).toISOString();
		const position = synchronizer.getPosition(sixHoursAfterAnchor);

		expect(position.latitude.value).toBeCloseTo(anchorPosition.startLatitude.value, 12);
		expect(position.orbitAngle.value).toBeCloseTo(90, 12);
		expect(position.longitude.value).toBeCloseTo(-90, 12);
	});

	it('uses the requested date to resolve the overhead latitude', () => {
		const synchronizer = new FlatSynchronizer().calibrateToWorld();
		const june = synchronizer.getPosition('2026-06-21T12:00:00.000Z');
		const december = synchronizer.getPosition('2026-12-21T12:00:00.000Z');

		expect(june.latitude.value).toBeGreaterThan(23);
		expect(december.latitude.value).toBeLessThan(-23);
	});

	it('resolves a position from a closest point and clockwise orbit angle', () => {
		const synchronizer = new FlatSynchronizer();
		const position = synchronizer.getPositionFromClosest(
			'2026-06-21T12:00:00.000Z',
			{ latitude: degrees(37), longitude: degrees(-122) },
			degrees(90));

		expect(position.mode).toBe('closest');
		expect(position.latitude).toEqual(degrees(37));
		expect(position.longitude).toEqual(degrees(148));
		expect(position.startLatitude).toEqual(degrees(37));
		expect(position.startLongitude).toEqual(degrees(-122));
		expect(position.startTime).toBe('2026-06-21T12:00:00.000Z');
		expect(position.orbitAngle).toEqual(degrees(90));
		expect(position.elapsed).toEqual({ value: 6 * 60 * 60, units: 'seconds' });
		expect(position.orbitPeriod).toEqual({ value: 24 * 60 * 60, units: 'seconds' });
	});

	it('normalizes supported angular units at the boundary', () => {
		const synchronizer = new FlatSynchronizer();
		const position = synchronizer.getPositionFromClosest(
			'2026-06-21T12:00:00.000Z',
			{ latitude: radians(Math.PI / 18), longitude: radians(Math.PI / 9) },
			radians(Math.PI / 4));

		expect(position.latitude).toEqual(degrees(10));
		expect(position.startLongitude.value).toBeCloseTo(20, 12);
		expect(position.orbitAngle.value).toBeCloseTo(45, 12);
		expect(position.longitude.value).toBeCloseTo(-25, 12);
	});

	it('normalizes closest-point longitude and orbit angle', () => {
		const synchronizer = new FlatSynchronizer();
		const position = synchronizer.getPositionFromClosest(
			'2026-06-21T12:00:00.000Z',
			{ latitude: degrees(0), longitude: degrees(190) },
			degrees(450));

		expect(position.startLongitude).toEqual(degrees(-170));
		expect(position.orbitAngle).toEqual(degrees(90));
		expect(position.longitude).toEqual(degrees(100));
	});

	it('fails loudly for invalid closest-point inputs', () => {
		const synchronizer = new FlatSynchronizer();

		expect(() => synchronizer.getPositionFromClosest('not-a-date', latLon(0, 0), degrees(0)))
			.toThrowError(/valid ISO timestamp/);
		expect(() => synchronizer.getPositionFromClosest('2026-06-21T12:00:00.000Z', {
			latitude: degrees(NaN),
			longitude: degrees(0),
		}, degrees(0))).toThrowError(/latitude/);
		expect(() => synchronizer.getPositionFromClosest(
			'2026-06-21T12:00:00.000Z',
			latLon(0, 0),
			degrees(Infinity))).toThrowError(/angle/);
	});

	it('resolves time from a date basis, closest point, and orbit angle', () => {
		const synchronizer = new FlatSynchronizer().calibrateToWorld();
		const anchorPosition = synchronizer.getPosition('2026-06-21T12:00:00.000Z');
		const expectedTime = new Date(new Date(anchorPosition.startTime).getTime() + 6 * 60 * 60 * 1000);

		expect(synchronizer.getTimeFromClosest('2026-06-21T12:00:00.000Z', latLon(0, 0), degrees(90)))
			.toBe(expectedTime.toISOString());
	});

	it('uses closest longitude so different places resolve different times', () => {
		const synchronizer = new FlatSynchronizer();
		const sanJose = synchronizer.getTimeFromClosest(
			'2026-06-21T12:00:00.000Z',
			latLon(37.3382, -121.8863),
			degrees(180));
		const boston = synchronizer.getTimeFromClosest(
			'2026-06-21T12:00:00.000Z',
			latLon(42.3601, -71.0589),
			degrees(180));
		const differenceHours = (new Date(sanJose).getTime() - new Date(boston).getTime()) / (60 * 60 * 1000);

		expect(sanJose).not.toBe(boston);
		expect(differenceHours).toBeCloseTo((121.8863 - 71.0589) / 15, 12);
	});

	it('normalizes getTimeFromClosest angle', () => {
		const synchronizer = new FlatSynchronizer();

		expect(synchronizer.getTimeFromClosest(
			'2026-06-21T12:00:00.000Z',
			latLon(0, 0),
			degrees(450))).toBe(synchronizer.getTimeFromClosest(
			'2026-06-21T12:00:00.000Z',
			latLon(0, 0),
			degrees(90)));
	});

	it('fails loudly for invalid closest-time inputs', () => {
		const synchronizer = new FlatSynchronizer();

		expect(() => synchronizer.getTimeFromClosest('not-a-date', latLon(0, 0), degrees(90)))
			.toThrowError(/valid ISO timestamp/);
		expect(() => synchronizer.getTimeFromClosest('2026-06-21T12:00:00.000Z', {
			latitude: degrees(NaN),
			longitude: degrees(0),
		}, degrees(90))).toThrowError(/latitude/);
		expect(() => synchronizer.getTimeFromClosest(
			'2026-06-21T12:00:00.000Z',
			latLon(0, 0),
			degrees(Infinity))).toThrowError(/angle/);
	});

	it('rejects Date and numeric timestamp compatibility shapes', () => {
		const synchronizer = new FlatSynchronizer().calibrateToWorld();

		expect(() => synchronizer.getPosition(new Date('2026-06-21T12:00:00.000Z')))
			.toThrowError(/valid ISO timestamp/);
		expect(() => synchronizer.getPosition(Date.parse('2026-06-21T12:00:00.000Z')))
			.toThrowError(/valid ISO timestamp/);
	});
});

function degrees(value) {
	return { value, units: 'degrees' };
}

function radians(value) {
	return { value, units: 'radians' };
}

function latLon(latitude, longitude) {
	return {
		latitude: degrees(latitude),
		longitude: degrees(longitude),
	};
}
