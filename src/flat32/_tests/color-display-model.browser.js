import {createFlat32ColorDisplayModel} from '../Flat32ColorDisplayModel.js';
import {FlatLocalMode} from '../FlatLocalMode.js';
import {
	requireImplementedFlat32ProductionSelections,
	resolveFlat32ProductionSelections,
} from '../Flat32ProductionSelections.js';
import {ATMOSPHERE_SCENE_SCALE} from '../consts.js';
describe('Flat32 Color selection', () => {
	it('retains the current source-luminance lift as the explicit pre-P9 default', () => {
		const color = createFlat32ColorDisplayModel();

		expect(color.id).toBe('bruneton-source-derived-global-luminance-lift-v2');
	});

	it('keeps explicit reference Color controls separate from the live default', () => {
		const ferwerda = createFlat32ColorDisplayModel({
			model: 'ferwerda-control',
			adaptationLuminanceCdPerSquareMeter: 0.001,
		});
		const bruneton = createFlat32ColorDisplayModel({model: 'basic-bruneton'});

		expect(ferwerda.adaptation.luminance).toEqual({value: 0.001, units: 'cd m^-2'});
		expect(ferwerda.adaptation.kind).toBe('qualified-starlight-reference');
		expect(bruneton.id).toBe('bruneton-figure1-display');
		expect(createFlat32ColorDisplayModel().id).toBe('bruneton-source-derived-global-luminance-lift-v2');
	});

	it('fails closed for unknown and recognized but not-yet-implemented Color selections', () => {
		expect(() => createFlat32ColorDisplayModel({model: 'unknown'})).toThrowError(/not supported/);
		expect(() => createFlat32ColorDisplayModel({model: 'color-reset-slope-078-p9'})).toThrowError(
			/not implemented until P3/,
		);
	});

	it('normalizes Color, celestial, catalog, and filter selections independently', () => {
		const selections = resolveFlat32ProductionSelections({
			celestialSourcesEnabled: false,
			colorDisplayModelConfiguration: {model: 'basic-bruneton'},
			stellarCatalog: 'brightest-2000',
			presentationFilters: [
				{
					id: 'human-mesopic-luminance-v1',
					stage: 'source-linear',
					target: 'stellar',
					enabled: false,
					parameters: {maximumRodContribution: 0.5},
				},
			],
		});

		expect(selections.colorDisplayModelConfiguration.model).toBe('basic-bruneton');
		expect(selections.celestialSourcesEnabled).toBeFalse();
		expect(selections.stellarCatalog).toBe('brightest-2000');
		expect(selections.presentationFilters[0].id).toBe('human-mesopic-luminance-v1');
	});

	it('rejects unsupported fields, targets, parameters, and filter order', () => {
		expect(() => resolveFlat32ProductionSelections({stellarCatalog: 'largest-2000'})).toThrowError(/not supported/);
		expect(() =>
			resolveFlat32ProductionSelections({
				presentationFilters: [
					{
						id: 'human-low-light-chroma-v1',
						stage: 'source-linear',
						target: 'stellar',
						enabled: true,
						parameters: {maximumChromaRetention: 0.65},
					},
					{
						id: 'human-mesopic-luminance-v1',
						stage: 'source-linear',
						target: 'stellar',
						enabled: true,
						parameters: {maximumRodContribution: 0.5},
					},
				],
			}),
		).toThrowError(/must precede/);
		expect(() =>
			resolveFlat32ProductionSelections({
				presentationFilters: [
					{
						id: 'human-mesopic-luminance-v1',
						stage: 'display-output',
						target: 'stellar',
						enabled: true,
						parameters: {maximumRodContribution: 0.5},
					},
				],
			}),
		).toThrowError(/source-linear/);
		expect(() =>
			resolveFlat32ProductionSelections({
				presentationFilters: [
					{
						id: 'human-mesopic-luminance-v1',
						stage: 'source-linear',
						target: 'stellar',
						enabled: true,
						parameters: {maximumRodContribution: 0.5, hiddenGain: 2},
					},
				],
			}),
		).toThrowError(/does not support hiddenGain/);
	});

	it('fails closed when a recognized later-phase catalog or filter reaches runtime', () => {
		const catalog = resolveFlat32ProductionSelections({stellarCatalog: 'brightest-2000'});
		const filter = resolveFlat32ProductionSelections({
			presentationFilters: [
				{
					id: 'human-mesopic-luminance-v1',
					stage: 'source-linear',
					target: 'stellar',
					enabled: true,
					parameters: {maximumRodContribution: 0.5},
				},
			],
		});

		expect(() => requireImplementedFlat32ProductionSelections(catalog, {stellarCatalogUsed: true})).toThrowError(
			/not implemented until P5/,
		);
		expect(() => requireImplementedFlat32ProductionSelections(filter)).toThrowError(/not implemented until P6/);
	});

	it('keeps flat/local celestial enablement independent from basic Bruneton selection', () => {
		const createMode = (celestialSourcesEnabled) =>
			new FlatLocalMode({
				sceneScale: ATMOSPHERE_SCENE_SCALE,
				observation: {
					instant: '2024-06-21T04:26:03.503Z',
					location: {
						latitude: {value: 37.3382, units: 'degrees'},
						longitude: {value: -121.8863, units: 'degrees'},
					},
				},
				maximumScatteringOrder: 1,
				celestialSourcesEnabled,
				colorDisplayModelConfiguration: {model: 'basic-bruneton'},
			});
		const enabled = createMode(true);
		const disabled = createMode(false);

		expect(enabled.algorithm32._model.celestialSources).not.toBeNull();
		expect(disabled.algorithm32._model.celestialSources).toBeNull();

		enabled.dispose();
		disabled.dispose();
	});
});
