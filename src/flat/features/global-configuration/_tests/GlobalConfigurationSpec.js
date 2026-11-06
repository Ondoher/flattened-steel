import {CityCatalog} from '../models/CityCatalog.js';
import {LocationEditorModel} from '../models/LocationEditorModel.js';
import {DateTimeEditorModel} from '../models/DateTimeEditorModel.js';
import {Registry, Service} from '@polylith/core';
import {AnimationLoopService} from '../../../services/animation-loop.js';
import {ConfigurationService} from '../../../services/configuration.js';
import {UiContributionsService} from '../../workspace/services/ui-contributions.js';
import {GlobalConfigurationController} from '../controller.js';
import {GlobalConfigurationView} from '../views/global-configuration.js';
import {LocalDateTimeFormat} from '../../../models/LocalDateTimeFormat.js';
import GlobalConfigurationPanel from '../components/GlobalConfigurationPanel.jsx';
import {createTestHarness} from '../../../testing/TestHarness.js';

/**
 * Local city-data HTTP fixture exposing the normal application capability.
 */
class CityIo extends Service {
	/**
	 * Creates an isolated city-data response.
	 *
	 * @param {Registry} registry - Isolated registry.
	 */
	constructor(registry) {
		super('io', registry);
		this.implement(['request']);
	}

	/**
	 * Call this method to return fixture cities without a network dependency.
	 *
	 * @returns {Promise<object>} - Fixture HTTP response.
	 */
	async request() {
		return {
			ok: true,
			json: async () => [
				{n: 'London', c: 'GB', a: 'ENG', lat: 51.5, lon: -0.1},
				{n: 'London', c: 'CA', a: 'ON', lat: 42.98, lon: -81.23},
			],
		};
	}
}

/**
 * Call this function to create the actual feature and public capabilities in isolation.
 *
 * @returns {object} - Models, controller, view, and shared configuration.
 */
function setup() {
	let registry = new Registry();
	new CityIo(registry);
	new LocationEditorModel(registry).start();
	new DateTimeEditorModel(registry).start();
	let catalog = new CityCatalog(registry);
	catalog.start();
	catalog.ready();
	let clock = new AnimationLoopService(registry);
	clock.start({autoStart: false});
	clock.ready();
	let configuration = new ConfigurationService(registry);
	configuration.start();
	configuration.ready();
	let contributions = new UiContributionsService(registry);
	contributions.start();
	let controller = new GlobalConfigurationController(registry);
	let view = new GlobalConfigurationView(registry);
	controller.start();
	controller.ready();
	view.ready();
	return {configuration, contributions, controller, view, clock};
}

describe('global configuration location workflow', () => {
	it('commits selected cities, preserves accepted coordinates while searching, and rejects invalid manual edits', async () => {
		let {configuration, controller, view, contributions} = setup();
		await controller.retryCities();
		controller.setQuery('London GB');
		controller.selectCity(controller.getState().matches[0].id);
		expect(configuration.get().location.latitude).toBe(51.5);
		controller.setQuery('unselected query');
		expect(configuration.get().location.city.name).toBe('London');
		controller.setCoordinate('latitude', '91');
		controller.applyCoordinates();
		expect(view.getState().coordinateError).toBe('global-configuration.coordinates.invalid');
		expect(configuration.get().location.latitude).toBe(51.5);
		controller.setCoordinate('latitude', '0');
		controller.setCoordinate('longitude', '0');
		controller.applyCoordinates();
		expect(configuration.get().location).toEqual({latitude: 0, longitude: 0, city: undefined});
		controller.stop();
		controller.stop();
		expect(contributions.get()).toEqual([]);
		expect(configuration.get().location.latitude).toBe(0);
		view.stop();
	});

	it('replaces registration and listeners exactly on repeated readiness', () => {
		let {configuration, controller, contributions, view} = setup();
		let first = contributions.get()[0].registrationId;
		controller.ready();
		view.ready();
		expect(contributions.get().length).toBe(2);
		expect(contributions.get()[0].registrationId).not.toBe(first);
		let changed = jasmine.createSpy('changed');
		view.listen('state-changed', changed);
		configuration.setLocation({latitude: 1, longitude: 2});
		expect(changed).toHaveBeenCalledTimes(1);
		controller.stop();
		view.stop();
		configuration.setLocation({latitude: 2, longitude: 3});
		expect(changed).toHaveBeenCalledTimes(1);
	});

	it('renders selected locations after panel remount and releases its view subscription', async () => {
		let {configuration, controller, view} = setup();
		await controller.retryCities();
		controller.setQuery('London GB');
		controller.selectCity(controller.getState().matches[0].id);
		let harness = createTestHarness();
		try {
			let props = {configurationView: view, initialState: view.getState()};
			let result = harness.render(GlobalConfigurationPanel, props);
			expect(result.query('.location-selection').textContent).toContain('London, England, GB');
			harness.input(result.query('input[name="latitude"]'), '');
			harness.click(result.query('.location-coordinates button[type="submit"]'));
			expect(result.query('[role="alert"]').textContent).toContain('Enter both');
			expect(configuration.get().location.latitude).toBe(51.5);
			harness.unmount();
			props = {configurationView: view, initialState: view.getState()};
			result = harness.render(GlobalConfigurationPanel, props);
			expect(result.query('.location-selection').textContent).toContain('London');
		} finally {
			harness.unmount();
			controller.stop();
			view.stop();
		}
	});

	it('accepts shared date/time independently of location and preserves unrelated drafts on configuration changes', () => {
		let {configuration, controller, view} = setup();
		try {
			let initialTimestamp = configuration.get().timestamp;
			let format = new LocalDateTimeFormat();
			let dateText = format.formatDate({year: 2024, month: 2, day: 29});
			controller.setQuery('unfinished city search');
			controller.setDateTimeField('date', dateText);
			controller.setDateTimeField('time', format.formatTime({hour: 0, minute: 0}));
			expect(configuration.get().timestamp).toBe(initialTimestamp);
			controller.applyDateTime();
			expect(configuration.get().timestamp).toBe(new Date(2024, 1, 29, 0, 0).getTime());
			expect(controller.getState().editor.query).toBe('unfinished city search');
			controller.setDateTimeField('date', '2025-');
			configuration.setLocation({latitude: 0, longitude: 0});
			expect(controller.getState().dateTimeEditor.date).toBe('2025-');
			controller.applyDateTime();
			expect(view.getState().dateTime.dateError).toBe('global-configuration.date-time.date.invalid');
			expect(configuration.get().timestamp).toBe(new Date(2024, 1, 29, 0, 0).getTime());
			expect(configuration.get().location.latitude).toBe(0);
		} finally {
			controller.stop();
			view.stop();
		}
	});

	it('preserves unfinished date/time edits during playback and resets them on explicit acceptance', () => {
		let {configuration, controller, view, clock} = setup();
		spyOn(performance, 'now').and.returnValue(0);
		try {
			let format = new LocalDateTimeFormat();
			let initial = configuration.get().timestamp;
			clock.ready();
			clock.setPlayback({mode: 'live'});
			controller.setDateTimeField('date', 'unfinished date');
			clock.advance(1000);
			expect(configuration.get().timestamp).toBe(initial + 2160000);
			expect(controller.getState().dateTimeEditor.date).toBe('unfinished date');
			controller.setDateTimeField('date', format.formatDate({year: 2024, month: 2, day: 29}));
			controller.setDateTimeField('time', format.formatTime({hour: 13, minute: 45}));
			controller.applyDateTime();
			expect(clock.getTimestamp()).toBe(new Date(2024, 1, 29, 13, 45).getTime());
			expect(controller.getState().dateTimeEditor.dirty).toBeFalse();
			clock.advance(1000);
			expect(controller.getState().dateTimeEditor.date).not.toBe('unfinished date');
		} finally {
			controller.stop();
			view.stop();
			configuration.stop();
			clock.stop();
		}
	});

	it('uses the shared controlled date/time fields and retains accepted values when the panel remounts', () => {
		let {configuration, controller, view} = setup();
		let harness = createTestHarness();
		try {
			configuration.setTimestamp(0);
			let initialTimestamp = configuration.get().timestamp;
			let format = new LocalDateTimeFormat();
			let dateText = format.formatDate({year: 2024, month: 2, day: 29});
			expect(view.getState().dateTime.accepted).not.toBeNull();
			let result = harness.render(GlobalConfigurationPanel, {
				configurationView: view,
				initialState: view.getState(),
			});
			harness.input(result.query('#global-date'), '');
			harness.input(result.query('#global-time'), '');
			harness.click(result.query('.date-time-editor button[type="submit"]'));
			expect(result.query('#global-date-error').textContent).toBe('Enter a date.');
			expect(result.query('#global-time-error').textContent).toBe('Enter a time.');
			harness.input(result.query('#global-date'), dateText);
			harness.input(result.query('#global-time'), format.formatTime({hour: 23, minute: 59}));
			expect(configuration.get().timestamp).toBe(initialTimestamp);
			harness.click(result.query('.date-time-editor button[type="submit"]'));
			expect(configuration.get().timestamp).toBe(new Date(2024, 1, 29, 23, 59).getTime());
			expect(result.query('.date-time-selection').textContent).toBe(
				`${dateText} ${format.formatTime({hour: 23, minute: 59})}`,
			);
			harness.unmount();
			result = harness.render(GlobalConfigurationPanel, {configurationView: view, initialState: view.getState()});
			expect(result.query('#global-date').value).toBe(dateText);
			expect(result.query('#global-time').value).toBe(format.formatTime({hour: 23, minute: 59}));
			expect(result.query('#global-date').type).toBe('text');
			expect(result.query('#global-time').type).toBe('text');
		} finally {
			harness.unmount();
			controller.stop();
			view.stop();
		}
	});
});
