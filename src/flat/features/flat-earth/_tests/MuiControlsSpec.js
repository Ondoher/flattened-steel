import FlatEarthViewTools from '../components/FlatEarthViewTools.jsx';
import FlatEarthTimeControls from '../components/FlatEarthTimeControls.jsx';
import {FlatEarthTimeModel} from '../models/FlatEarthTimeModel.js';
import {Registry} from '@polylith/core';
import {createTestHarness} from '../../../testing/TestHarness.js';

describe('Flat Earth shared MUI consumer controls', () => {
	it('represents custom camera values and sends numeric changes to the exact view', () => {
		let state = {
			status: 'ready',
			renderedObservation: {},
			shader: {mode: 'full'},
			camera: {observerHeightMeters: 321, pendingHeightMeters: null, fieldOfViewDegrees: 42},
		};
		let view = {
			getState: () => state,
			listen: () => 9,
			unlisten: jasmine.createSpy('unlisten'),
			setObserverHeight: jasmine.createSpy('height'),
			setFieldOfView: jasmine.createSpy('fov'),
			centerOnSun: jasmine.createSpy('sun'),
		};
		let harness = createTestHarness();
		try {
			let result = harness.render(FlatEarthViewTools, {viewId: 'view-2', sceneView: view, initialState: state});
			expect(result.query('.flat-earth-height [role="combobox"]').textContent).toContain('321 m');
			expect(result.query('.flat-earth-fov [role="combobox"]').textContent).toContain('42°');
			harness.select(result.query('.flat-earth-height [role="combobox"]'), 100);
			harness.select(result.query('.flat-earth-fov [role="combobox"]'), 35);
			harness.click(result.query('.flat-earth-center-sun'));
			expect(view.setObserverHeight).toHaveBeenCalledOnceWith('view-2', {value: 100, units: 'meters'});
			expect(view.setFieldOfView).toHaveBeenCalledOnceWith('view-2', 35);
			expect(view.centerOnSun).toHaveBeenCalledOnceWith('view-2');
		} finally {
			harness.unmount();
		}
		expect(view.unlisten).toHaveBeenCalledWith('state-changed', 9);
	});

	it('keeps one real model reference through repeated slider keys and releases its token once', () => {
		let registry = new Registry();
		new FlatEarthTimeModel(registry).start();
		let model = registry.subscribe('flat-earth-time-model');
		let config = {
			timestamp: Date.parse('2024-06-20T23:08:48.339Z'),
			location: {latitude: 37.33939, longitude: -121.89496},
		};
		let initialTimestamp = config.timestamp,
			listener;
		let view = {
			getTimeState: () => ({
				...model.getState(config),
				selected: false,
				location: 'Selected location',
				resolvedTime: 'Accepted time',
				dateBasis: 'Date',
				deviceZone: 'Device',
			}),
			listen: (event, callback) => {
				listener = callback;
				return callback;
			},
			unlisten: () => {
				listener = null;
			},
			beginTimeEdit: jasmine.createSpy('begin').and.callFake((owner) => model.begin(owner, config)),
			endTimeEdit: jasmine.createSpy('end').and.callFake((owner, token) => model.end(owner, token)),
			seekTime: (owner, token, value) => {
				let timestamp = model.seek(owner, token, value);
				if (timestamp !== null) {
					config.timestamp = timestamp;
				}
				listener?.(view.getTimeState());
			},
		};
		let harness = createTestHarness();
		try {
			let result = harness.render(FlatEarthTimeControls, {owner: 'view-1', sceneView: view});
			let input = result.query('input[type="range"]');
			harness.key(input, 'ArrowRight');
			harness.key(input, 'ArrowRight');
			expect(view.beginTimeEdit).toHaveBeenCalledOnceWith('view-1');
			expect(view.endTimeEdit).not.toHaveBeenCalled();
			expect(config.timestamp).toBe(initialTimestamp + 48000);
			harness.key(input, 'ArrowRight', 'keyup');
			expect(view.endTimeEdit).toHaveBeenCalledTimes(1);
		} finally {
			harness.unmount();
		}
		expect(view.endTimeEdit).toHaveBeenCalledTimes(1);
	});
});
