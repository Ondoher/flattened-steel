import {Registry} from '@polylith/core';
import {SphericalSolarEvents} from '../solar-events.js';
import {SphericalEarthModel} from '../models/spherical-earth-model.js';
import {SphericalEarthGeometry} from '../../../../algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js';
import {createTestHarness} from '../../../testing/TestHarness.js';
import SphericalEarthViewTools from '../components/SphericalEarthViewTools.jsx';

/**
 * Call this function to obtain geometric Sun elevation for an independently checked event.
 *
 * @param {number} timestamp - Event instant in epoch milliseconds.
 * @returns {number} - Sun-center upward component at the equator and Greenwich.
 */
function sunUp(timestamp) {
	let geometry = new SphericalEarthGeometry({
		bottomRadius: {value: 6360000, units: 'meters'},
		topRadius: {value: 6420000, units: 'meters'},
		observerUpDirection: [0, 0, 1],
		sceneFrame: {kind: 'observer-local'},
	});
	return geometry.resolveDistantSunSceneState({
		instant: new Date(timestamp).toISOString(),
		location: {latitude: {value: 0, units: 'degrees'}, longitude: {value: 0, units: 'degrees'}},
	}).directionToSourceModel[2];
}

describe('Globe solar-event time controls', () => {
	it('finds upper-limb sunrise and sunset around solar noon and extends daylight at elevation', () => {
		let request = {
			dayStart: Date.UTC(2026, 2, 20),
			dayEnd: Date.UTC(2026, 2, 21),
			latitude: 0,
			longitude: 0,
			observerHeightMeters: 0,
		};
		let events = SphericalSolarEvents.calculate(request);
		expect(events.sunrise).toBeLessThan(events['solar-noon']);
		expect(events.sunset).toBeGreaterThan(events['solar-noon']);
		expect(sunUp(events['solar-noon'])).toBeGreaterThan(0.99);
		let threshold = -Math.sin(SphericalSolarEvents.angularRadiusRadians);
		expect(sunUp(events.sunrise)).toBeCloseTo(threshold, 6);
		expect(sunUp(events.sunset)).toBeCloseTo(threshold, 6);
		let higher = SphericalSolarEvents.calculate({...request, observerHeightMeters: 5000});
		expect(higher.sunrise).toBeLessThan(events.sunrise);
		expect(higher.sunset).toBeGreaterThan(events.sunset);
		expect(higher['solar-noon']).toBe(events['solar-noon']);
	});

	it('keeps polar sunrise and sunset unavailable without substituting noon', () => {
		for (let month of [5, 11]) {
			let events = SphericalSolarEvents.calculate({
				dayStart: Date.UTC(2026, month, 21),
				dayEnd: Date.UTC(2026, month, 22),
				latitude: 90,
				longitude: 0,
				observerHeightMeters: 5,
			});
			expect(events.sunrise).toBeNull();
			expect(events.sunset).toBeNull();
			expect(events['solar-noon']).not.toBeNull();
		}
	});

	it('reuses date-scoped events through same-day time and camera changes but refreshes height, location and lifetime', () => {
		let registry = new Registry(),
			model = new SphericalEarthModel(registry);
		model.start();
		model.open('one');
		let configuration = {timestamp: new Date(2026, 2, 20, 12).getTime(), location: {latitude: 37, longitude: -121}};
		let calculation = spyOn(SphericalSolarEvents, 'calculate').and.callThrough();
		let first = model.getSolarEvents('one', configuration, 5);
		model.setFieldOfView('one', 90);
		let again = model.getSolarEvents('one', {...configuration, timestamp: configuration.timestamp + 600000}, 5);
		expect(again).toEqual(first);
		expect(calculation).toHaveBeenCalledTimes(1);
		model.getSolarEvents('one', configuration, 5000);
		expect(calculation).toHaveBeenCalledTimes(2);
		model.getSolarEvents('one', {...configuration, location: {latitude: 38, longitude: -121}}, 5000);
		expect(calculation).toHaveBeenCalledTimes(3);
		model.close('one');
		model.open('one');
		model.getSolarEvents('one', configuration, 5);
		expect(calculation).toHaveBeenCalledTimes(4);
		model.stop();
	});

	it('presents text-only clock choices, disables missing events and relays the exact view', () => {
		let state = {
			status: 'ready',
			renderedObservation: {},
			sync: {mode: 'off', available: false},
			shader: {mode: 'full'},
			camera: {observerHeightMeters: 5, fieldOfViewDegrees: 50, pendingHeightMeters: null},
		};
		let view = {
			getState: () => state,
			listen: () => 1,
			unlisten: () => {},
			getSyncOptions: () => [],
			getTimeOptions: () => [
				{value: 'sunrise', label: 'spherical-earth.time.sunrise-unavailable', disabled: true},
				{value: 'solar-noon', label: 'spherical-earth.time.solar-noon'},
				{value: 'sunset', label: 'spherical-earth.time.sunset'},
			],
			setSolarEvent: jasmine.createSpy('event'),
		};
		let harness = createTestHarness().withLocale('en-US');
		try {
			let result = harness.render(SphericalEarthViewTools, {viewId: 'two', sceneView: view, initialState: state});
			harness.click(result.query('.spherical-earth-time'));
			expect(result.queryDocument('[data-value="sunrise"]').getAttribute('aria-disabled')).toBe('true');
			harness.click(result.queryDocument('[data-value="solar-noon"]'));
			expect(view.setSolarEvent).toHaveBeenCalledOnceWith('two', 'solar-noon');
		} finally {
			harness.unmount();
		}
	});
});
