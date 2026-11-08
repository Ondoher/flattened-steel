import FlatEarthViewTools from '../components/FlatEarthViewTools.jsx';
import FlatEarthTimeControls from '../components/FlatEarthTimeControls.jsx';
import {FlatEarthTimeModel} from '../models/FlatEarthTimeModel.js';
import {Registry} from '@polylith/core';
import {createTestHarness} from '../../../testing/TestHarness.js';
import {act} from 'react';
import {createTranslator} from '../../../services/localize.js';
import phrases from '../../../phrases/en-US.json';

describe('Flat Earth shared MUI consumer controls', () => {
	it('represents custom camera values and sends numeric changes to the exact view', async () => {
		let state = {
			status: 'ready',
			renderedObservation: {},
			shader: {mode: 'full'},
			camera: {observerHeightMeters: 5, pendingHeightMeters: 321, fieldOfViewDegrees: 42},
		};
		let view = {
			...timeView(),
			getState: () => state,
			listen: () => 9,
			unlisten: jasmine.createSpy('unlisten'),
			setObserverHeight: jasmine.createSpy('height'),
			setFieldOfView: jasmine.createSpy('fov'),
			centerOnSun: jasmine.createSpy('sun'),
		};
		let harness = createTestHarness().withLocale('en-US');
		try {
			let result = harness.render(FlatEarthViewTools, {viewId: 'view-2', sceneView: view, initialState: state});
			harness.click(result.query('.flat-earth-height'));
			expect(result.queryDocument('[role="menuitemradio"][aria-checked="true"]').textContent).toContain('321 m');
			harness.click(result.queryDocument('[data-value="100"]'));
			await waitUntil(() => !result.queryDocument('[role="menu"]'));
			harness.click(result.query('.flat-earth-fov'));
			expect(result.queryDocument('[role="menuitemradio"][aria-checked="true"]').textContent).toContain('42°');
			harness.click(result.queryDocument('[data-value="35"]'));
			await waitUntil(() => !result.queryDocument('[role="menu"]'));
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
		let harness = createTestHarness().withLocale('en-US');
		try {
			let result = harness.render(FlatEarthTimeControls, {owner: 'view-1', sceneView: view});
			harness.click(result.query('button.flat-time-clock'));
			let input = result.queryDocument('input[type="range"]');
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

/**
 * Creates an explicit time-view fixture for popup lifetime and navigation checks.
 *
 * @param {number|null} angle - Availability of alternate time at the current location.
 * @returns {object} - Feature-facing time capability with observable intents.
 */
function timeView(angle = 0) {
	return {
		getTimeState: () => ({
			angle,
			selected: false,
			location: 'Location',
			dateBasis: 'Date',
			resolvedTime: 'Time',
			deviceZone: 'Zone',
		}),
		listen: () => 1,
		unlisten: jasmine.createSpy('unlisten'),
		beginTimeEdit: jasmine.createSpy('begin').and.returnValue(7),
		endTimeEdit: jasmine.createSpy('end'),
		seekTime: jasmine.createSpy('seek'),
		openTimeSettings: jasmine.createSpy('time settings'),
		openLocationSettings: jasmine.createSpy('location settings'),
	};
}

/**
 * Waits for the observable end of MUI's native popup transition.
 *
 * @param {Function} predicate - Observable completion condition.
 * @returns {Promise<void>} - Completion of the expected interaction.
 */
async function waitUntil(predicate) {
	for (let attempt = 0; attempt < 100; attempt++) {
		if (predicate()) {
			return;
		}
		await act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
	}
	throw new Error('Expected popup transition did not complete.');
}

describe('Flat Earth clock popup lifetime', () => {
	let harness;
	afterEach(() => harness?.unmount());

	it('keeps the unavailable clock reachable and navigates only after popup dismissal', async () => {
		const view = timeView(null);
		harness = createTestHarness().withLocale('en-US');
		const result = harness.render(FlatEarthTimeControls, {owner: 'view-1', sceneView: view});
		const trigger = result.query('button');
		trigger.focus();
		harness.click(trigger);
		expect(result.queryDocument('input[type="range"]').disabled).toBeTrue();
		expect(result.queryDocument('.flat-time-unavailable')).toBeTruthy();
		harness.click(result.queryDocument('.flat-time-unavailable button'));
		expect(result.queryDocument('input[type="range"]')).toBeNull();
		expect(view.openLocationSettings).not.toHaveBeenCalled();
		await waitUntil(() => view.openLocationSettings.calls.count() === 1);
		expect(result.queryDocument('[role="dialog"]')).toBeNull();
		expect(document.activeElement).toBe(trigger);
	});

	it('retires the active slider and its edit token immediately when the popup closes', () => {
		const view = timeView();
		harness = createTestHarness().withLocale('en-US');
		const result = harness.render(FlatEarthTimeControls, {owner: 'view-2', sceneView: view});
		harness.click(result.query('button'));
		const input = result.queryDocument('input[type="range"]');
		expect(document.activeElement).toBe(input);
		harness.key(input, 'ArrowRight');
		expect(view.beginTimeEdit).toHaveBeenCalledOnceWith('view-2');
		harness.click(result.queryDocument('.MuiBackdrop-root'));
		expect(result.queryDocument('input[type="range"]')).toBeNull();
		expect(view.endTimeEdit).toHaveBeenCalledOnceWith('view-2', 7);
		const count = view.seekTime.calls.count();
		document.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, pointerId: 1, buttons: 1}));
		expect(view.seekTime.calls.count()).toBe(count);
		harness.unmount();
		expect(view.endTimeEdit).toHaveBeenCalledTimes(1);
	});

	it('cancels pending settings navigation when its owning page disappears', async () => {
		const view = timeView();
		harness = createTestHarness().withLocale('en-US');
		const result = harness.render(FlatEarthTimeControls, {owner: 'view-1', sceneView: view});
		harness.click(result.query('button'));
		harness.click(result.queryDocument('.flat-time-settings'));
		harness.unmount();
		await act(async () => new Promise((resolve) => setTimeout(resolve, 300)));
		expect(view.openTimeSettings).not.toHaveBeenCalled();
	});

	it('cancels pending navigation if the clock reopens before its prior exit completes', async () => {
		const view = timeView();
		harness = createTestHarness().withLocale('en-US');
		const result = harness.render(FlatEarthTimeControls, {owner: 'view-1', sceneView: view});
		harness.click(result.query('button'));
		harness.click(result.queryDocument('.flat-time-settings'));
		harness.click(result.query('button'));
		expect(result.queryDocument('.flat-time-popup')).toBeTruthy();
		harness.click(result.queryDocument('.MuiBackdrop-root'));
		await waitUntil(() => !result.queryDocument('[role="dialog"]'));
		expect(view.openTimeSettings).not.toHaveBeenCalled();
	});

	it('releases the original owner and cancels pending navigation when the view changes', async () => {
		const original = timeView();
		const replacement = timeView();
		harness = createTestHarness().withLocale('en-US');
		const result = harness.render(FlatEarthTimeControls, {owner: 'view-1', sceneView: original});
		harness.click(result.query('button'));
		harness.key(result.queryDocument('input[type="range"]'), 'ArrowRight');
		harness.click(result.queryDocument('.flat-time-settings'));
		result.rerender({owner: 'view-2', sceneView: replacement});
		await act(async () => new Promise((resolve) => setTimeout(resolve, 300)));
		expect(original.endTimeEdit).toHaveBeenCalledOnceWith('view-1', 7);
		expect(original.unlisten).toHaveBeenCalledOnceWith('time-changed', 1);
		expect(original.openTimeSettings).not.toHaveBeenCalled();
		expect(replacement.openTimeSettings).not.toHaveBeenCalled();
		expect(result.queryDocument('.flat-time-popup')).toBeNull();
		harness.click(result.query('button'));
		harness.key(result.queryDocument('input[type="range"]'), 'ArrowRight');
		expect(replacement.beginTimeEdit).toHaveBeenCalledOnceWith('view-2');
	});

	it('retains a bounded popup and readable slider with long translated copy', () => {
		harness = createTestHarness();
		const translations = {
			...phrases,
			'flat-earth.time.title': 'A substantially longer localized name for the shared time command',
			'flat-earth.time.shared': 'A longer description of the time shared between application views',
			'flat-earth.time.settings': 'Open the detailed shared-time configuration',
			'flat-earth.time.degrees-closest': 'Degrees before or after the closest approach of the Sun',
		};
		harness.context.localize.translators.set('fr-CA', createTranslator('fr-CA', translations));
		harness.withLocale('fr-CA');
		const result = harness.render(FlatEarthTimeControls, {owner: 'view-1', sceneView: timeView()});
		harness.click(result.query('button'));
		const popup = result.queryDocument('.app-interactive-panel');
		expect(popup.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth - 15);
		expect(popup.scrollWidth).toBeLessThanOrEqual(popup.clientWidth + 1);
		expect(result.queryDocument('.flat-time-slider').getBoundingClientRect().width).toBeGreaterThan(200);
	});
});
