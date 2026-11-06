import {Registry, Service} from '@polylith/core';
import {ConfigurationService} from '../../../services/configuration.js';
import {CityCatalog} from '../models/CityCatalog.js';
import {LocationEditorModel} from '../models/LocationEditorModel.js';

/**
 * Call this function to initialize isolated location drafts through their registered capability.
 *
 * @returns {LocationEditorModelService} - Public location editing model.
 */
function createEditor() {
	let registry = new Registry();
	new LocationEditorModel(registry).start();
	return registry.subscribe('location-editor-model');
}

/**
 * Call this function to initialize a catalog with the normal registered HTTP boundary.
 *
 * @param {IoService} io - Test-owned HTTP response capability.
 * @returns {CityCatalogService} - Public city data capability.
 */
function createCatalog(io) {
	let registry = new Registry();
	let transport = new Service('io', registry);
	transport.request = io.request;
	transport.implement(['request']);
	let catalog = new CityCatalog(registry);
	catalog.start();
	catalog.ready();
	return registry.subscribe('city-catalog');
}

describe('shared location configuration', () => {
	it('preserves missing values, accepts zero coordinates, and protects accepted snapshots', () => {
		let configuration = new ConfigurationService(new Registry());
		configuration.start();
		expect(configuration.get().location).toBeUndefined();
		let changed = jasmine.createSpy('changed');
		configuration.listen('changed', changed);
		let location = {latitude: 0, longitude: 0, city: {id: 'zero', name: 'Origin', country: 'XX', admin1: ''}};
		expect(configuration.setLocation(location)).toBeTrue();
		location.city.name = 'Mutated input';
		configuration.get().location.city.name = 'Mutated snapshot';
		expect(configuration.get().location.city.name).toBe('Origin');
		expect(configuration.setLocation(configuration.get().location)).toBeFalse();
		expect(changed).toHaveBeenCalledTimes(1);
		for (let invalid of [
			{latitude: 91, longitude: 0},
			{latitude: 0, longitude: -181},
			{latitude: NaN, longitude: 0},
		]) {
			expect(() => configuration.setLocation(invalid)).toThrowError(RangeError);
		}
		expect(configuration.get().location.latitude).toBe(0);
	});

	it('keeps drafts separate and requires both coordinates before parsing', () => {
		let editor = createEditor();
		editor.reset({
			latitude: 51.5,
			longitude: -0.1,
			city: {id: 'london', name: 'London', country: 'GB', admin1: 'ENG'},
		});
		editor.setQuery('another city');
		expect(editor.getState().latitude).toBe('51.5');
		editor.setCoordinate('latitude', '');
		expect(editor.getCoordinates()).toBeNull();
		expect(editor.getState().coordinateError).toBe('required');
		editor.setCoordinate('latitude', '0');
		editor.setCoordinate('longitude', '0');
		expect(editor.getCoordinates()).toEqual({latitude: 0, longitude: 0});
	});
});

describe('city catalog model', () => {
	it('keeps all exact city names and finds California by full name, code, or punctuation-separated query', async () => {
		let records = Array.from({length: 30}, (_, index) => ({
			n: 'San José',
			c: 'MX',
			a: '01',
			lat: index,
			lon: -100,
		}));
		records.push({n: 'San Jose', c: 'US', a: 'CA', lat: 37.33939, lon: -121.89496});
		records.push({n: 'San José', c: 'CR', a: '08', lat: 9.93333, lon: -84.08333});
		let catalog = createCatalog({request: async () => ({ok: true, json: async () => records})});
		await catalog.load();
		let exact = catalog.search('san jose');
		expect(exact.length).toBe(32);
		expect(exact.some((city) => city.country === 'US' && city.admin1 === 'CA')).toBeTrue();
		for (let query of ['san jose california', 'san jose, ca', 'san josé, california, us']) {
			let matches = catalog.search(query);
			expect(matches[0].country).toBe('US');
			expect(matches[0].admin1Name).toBe('California');
			expect(catalog.getLocation(matches[0].id).latitude).toBe(37.33939);
		}
	});

	it('ranks exact matches after early substring matches and folds accents and country codes', async () => {
		let source = Array.from({length: 100}, (_, index) => ({
			n: `Old London ${index}`,
			c: 'US',
			a: 'TX',
			lat: 30,
			lon: -90,
		}));
		source.push({n: 'Londonderry', c: 'GB', a: 'NIR', lat: 55, lon: -7});
		source.push({n: 'London', c: 'GB', a: 'ENG', lat: 51.5, lon: -0.1});
		source.push({n: 'São Paulo', c: 'BR', a: '27', lat: -23.55, lon: -46.63});
		let request = jasmine.createSpy('request').and.resolveTo({ok: true, json: async () => source});
		let catalog = createCatalog({request});
		await Promise.all([catalog.load(), catalog.load()]);
		await catalog.load();
		expect(request).toHaveBeenCalledTimes(1);
		expect(catalog.search('london')[0].country).toBe('GB');
		expect(catalog.search('London GB')[0].name).toBe('London');
		expect(catalog.search('london').length).toBe(18);
		expect(catalog.search('sao br')[0].name).toBe('São Paulo');
		let selected = catalog.search('London GB')[0];
		let location = catalog.getLocation(selected.id);
		location.city.name = 'Changed';
		expect(catalog.getLocation(selected.id).city.name).toBe('London');
	});

	it('preserves city identities when the dataset is reordered', async () => {
		let records = [
			{n: 'London', c: 'GB', a: 'ENG', lat: 51.5, lon: -0.1},
			{n: 'Paris', c: 'FR', a: '11', lat: 48.85, lon: 2.35},
		];
		let first = createCatalog({request: async () => ({ok: true, json: async () => records})});
		let second = createCatalog({request: async () => ({ok: true, json: async () => [...records].reverse()})});
		await first.load();
		await second.load();
		expect(first.search('Paris')[0].id).toBe(second.search('Paris')[0].id);
	});

	it('rejects malformed external city data and permits a subsequent retry', async () => {
		let request = jasmine
			.createSpy('request')
			.and.resolveTo({ok: true, json: async () => [{n: 'Bad', c: 'US', a: '', lat: 200, lon: 0}]});
		let catalog = createCatalog({request});
		await catalog.load();
		expect(catalog.getStatus()).toBe('error');
		request.and.resolveTo({ok: true, json: async () => [{n: 'Valid', c: 'US', a: '', lat: 0, lon: 0}]});
		await catalog.load();
		expect(catalog.getStatus()).toBe('ready');
		expect(catalog.search('valid').length).toBe(1);
	});

	it('does not accept a late response after its request is cancelled', async () => {
		let finish;
		let signal;
		let catalog = createCatalog({
			request: (_url, options) => {
				signal = options.signal;
				return new Promise((resolve) => {
					finish = resolve;
				});
			},
		});
		let pending = catalog.load();
		catalog.stop();
		expect(signal.aborted).toBeTrue();
		finish({ok: true, json: async () => [{n: 'Late', c: 'US', a: '', lat: 0, lon: 0}]});
		await pending;
		expect(catalog.getStatus()).toBe('idle');
		expect(catalog.search('late')).toEqual([]);
	});
});
