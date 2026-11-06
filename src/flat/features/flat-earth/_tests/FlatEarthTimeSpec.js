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
