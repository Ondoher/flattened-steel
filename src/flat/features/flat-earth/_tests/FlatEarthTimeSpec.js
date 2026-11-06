import {Registry} from '@polylith/core';
import {FlatEarthTimeModel} from '../models/FlatEarthTimeModel.js';

/**
 * Call this function to create one isolated application editor model.
 *
 * @returns {FlatEarthTimeModelService} - Public editor capability.
 */
function createModel() {
	let registry = new Registry();
	new FlatEarthTimeModel(registry).start();
	return registry.subscribe('flat-earth-time-model');
}

const configuration = {
	timestamp: Date.parse('2024-06-20T23:08:48.339Z'),
	location: {latitude: 37.33939, longitude: -121.89496},
};

describe('Flat Earth shared time editor', () => {
	it('preserves precise decimal entry and never recycles gesture tokens on restart', () => {
		let model = createModel();
		let old = model.begin('view-1', configuration);
		model.start();
		let next = model.begin('view-1', configuration);
		expect(next).not.toBe(old);
		expect(model.seek('view-1', old, 0)).toBeNull();
		model.setDraft('45.125');
		let timestamp = model.accept(configuration);
		expect(model.getState({...configuration, timestamp}).draft).toBe('+45.125');
		model.setDraft('0x20');
		expect(model.accept(configuration)).toBeNull();
	});
	it('keeps incomplete and invalid numeric text without changing accepted time', () => {
		let model = createModel();
		for (let text of ['-', '', '181', 'not a number']) {
			model.setDraft(text);
			expect(model.accept(configuration)).toBeNull();
			expect(model.getState(configuration).draft).toBe(text);
			expect(model.getState(configuration).error).toBeTrue();
		}
		model.reset();
		expect(model.getState(configuration).draft).toBe('+45.0');
	});

	it('invalidates obsolete gestures and preserves numeric drafts across external updates', () => {
		let model = createModel();
		let token = model.begin('view-2', configuration);
		model.setDraft('-30');
		model.synchronize(true);
		expect(model.seek('view-2', token, 90)).toBeNull();
		expect(model.getState(configuration).draft).toBe('-30');
		let next = model.begin('view-1', configuration);
		model.end('view-2', token);
		expect(model.seek('view-1', next, 0)).toBe(Date.parse('2024-06-20T20:08:48.339Z'));
		expect(model.getState(configuration).dirty).toBeFalse();
	});

	it('requires location and resolves a preserved draft against the new location', () => {
		let model = createModel();
		expect(model.getState({timestamp: configuration.timestamp}).angle).toBeNull();
		expect(model.begin('configuration', {timestamp: configuration.timestamp})).toBe(0);
		model.setDraft('0');
		expect(model.accept({timestamp: configuration.timestamp})).toBeNull();
		model.synchronize(true);
		let next = {...configuration, location: {latitude: 0, longitude: 0}};
		let result = model.accept(next);
		expect(model.getState({...next, timestamp: result}).angle).toBe(0);
		expect(next.timestamp).toBe(configuration.timestamp);
	});

	it('owns independent drafts and gesture tokens in separate app registries', () => {
		let first = createModel();
		let second = createModel();
		first.setDraft('90');
		expect(second.getState(configuration).draft).toBe('+45.0');
		let token = first.begin('view-1', configuration);
		expect(second.seek('view-1', token, 90)).toBeNull();
	});
	it('derives the current angle and resolves a slider request against one closest occurrence', () => {
		let model = createModel();
		expect(model.getState(configuration).angle).toBe(45);
		let token = model.begin('view-1', configuration);
		expect(model.seek('view-1', token, 0)).toBe(Date.parse('2024-06-20T20:08:48.339Z'));
		expect(model.seek('view-1', token, -45)).toBe(Date.parse('2024-06-20T17:08:48.339Z'));
		expect(model.seek('view-1', token, 180)).toBe(Date.parse('2024-06-21T08:08:48.339Z'));
		model.end('view-1', token);
		expect(configuration.timestamp).toBe(Date.parse('2024-06-20T23:08:48.339Z'));
	});

	it('accepts numeric degrees and exposes the same derived value for another control', () => {
		let model = createModel();
		model.setDraft('+90.0');
		let timestamp = model.accept(configuration);
		expect(timestamp).toBe(Date.parse('2024-06-21T02:08:48.339Z'));
		expect(model.getState({...configuration, timestamp}).draft).toBe('+90.0');
		expect(model.getState(configuration).dirty).toBeFalse();
	});
});
