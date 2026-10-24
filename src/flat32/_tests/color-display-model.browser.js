import {createFlat32ColorDisplayModel} from '../Flat32ColorDisplayModel.js';
import {FlatLocalMode} from '../FlatLocalMode.js';
import {
	requireImplementedFlat32ProductionSelections,
	resolveFlat32ProductionSelections,
} from '../Flat32ProductionSelections.js';
import {ATMOSPHERE_SCENE_SCALE} from '../consts.js';
import {ViewPresentationFilterRegistry} from '../../algorithm32/implementation/presentation-filter/ViewPresentationFilterRegistry.js';
describe('Flat32 Color selection', () => {
	it('constructs the explicit P5 rectangular rollback with p2 and compatible cleared stellar filters', () => {
		const rollback = new FlatLocalMode({
			sceneScale: ATMOSPHERE_SCENE_SCALE,
			observation: {
				instant: '2024-12-14T17:27:41.487Z',
				location: {
					latitude: {value: -79.768036, units: 'degrees'},
					longitude: {value: -83.261666, units: 'degrees'},
				},
			},
			maximumScatteringOrder: 1,
			colorDisplayModelConfiguration: {model: 'color-reset-slope-078-p2'},
			celestialSourcesEnabled: true,
			stellarCatalog: 'brightest-2000',
			presentationFilters: [],
		});
		try {
			expect(rollback.compactProfile).toBeNull();
			expect(rollback.describe()).toEqual(
				jasmine.objectContaining({
					pairing: 'flat/local',
					maximumScatteringOrder: 1,
					incomingDirectionCount: 68,
					spectralChannelCount: 15,
				}),
			);
		} finally {
			rollback.dispose();
		}
	});
	it('selects altitude-half by default while retaining explicit p2 and p9 controls', () => {
		const model = createFlat32ColorDisplayModel({model: 'color-reset-slope-078-p2'});
		expect(model.id).toBe('color-reset-slope-078-p2');
		expect(
			resolveFlat32ProductionSelections({
				colorDisplayModelConfiguration: {model: 'color-reset-slope-078-p2'},
			}).colorDisplayModelConfiguration.model,
		).toBe(model.id);
		expect(createFlat32ColorDisplayModel().id).toBe('color-reset-altitude-half-v1');
		expect(
			resolveFlat32ProductionSelections({colorDisplayModelConfiguration: {model: 'color-reset-slope-078-p2'}})
				.sceneColorPrecision,
		).toBe('float32');
		expect(resolveFlat32ProductionSelections().sceneColorPrecision).toBe('float32');
		expect(
			resolveFlat32ProductionSelections({colorDisplayModelConfiguration: {model: 'color-reset-altitude-half-v1'}})
				.sceneColorPrecision,
		).toBe('float32');
		expect(
			resolveFlat32ProductionSelections({colorDisplayModelConfiguration: {model: 'color-reset-slope-078-p9'}})
				.sceneColorPrecision,
		).toBe('float16');
	});
	it('selects the accepted Color Reset model and brightest-2,000 catalog by default', () => {
		const color = createFlat32ColorDisplayModel();
		const selections = resolveFlat32ProductionSelections();

		expect(color.id).toBe('color-reset-altitude-half-v1');
		expect(selections.colorDisplayModelConfiguration.model).toBe('color-reset-altitude-half-v1');
		expect(selections.stellarCatalog).toBe('brightest-2000');
		expect(selections.presentationFilters).toEqual([]);
	});

	it('keeps the explicit reference Color control separate from the live default', () => {
		const ferwerda = createFlat32ColorDisplayModel({
			model: 'ferwerda-control',
			adaptationLuminanceCdPerSquareMeter: 0.001,
		});
		const bruneton = createFlat32ColorDisplayModel({model: 'basic-bruneton'});

		expect(ferwerda.adaptation.luminance).toEqual({value: 0.001, units: 'cd m^-2'});
		expect(ferwerda.adaptation.kind).toBe('qualified-starlight-reference');
		expect(bruneton.id).toBe('bruneton-figure1-display');
		expect(createFlat32ColorDisplayModel().id).toBe('color-reset-altitude-half-v1');
		expect(resolveFlat32ProductionSelections({stellarCatalog: 'brightest-500'}).stellarCatalog).toBe(
			'brightest-500',
		);
	});

	it('routes the promoted Color Reset model exactly and fails closed for unknown selections', () => {
		expect(() => createFlat32ColorDisplayModel({model: 'unknown'})).toThrowError(/not supported/);
		expect(() => createFlat32ColorDisplayModel({model: 'bruneton-source-luminance-lift-v2'})).toThrowError(
			/not supported/,
		);
		expect(createFlat32ColorDisplayModel({model: 'color-reset-slope-078-p9'}).id).toBe('color-reset-slope-078-p9');
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
		expect(selections.presentationFilterConfigurationIdentity).toMatch(/^sha256:[0-9a-f]{64}$/);
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
		expect(() =>
			resolveFlat32ProductionSelections({
				presentationFilters: [
					{
						...{
							id: 'human-low-light-chroma-v1',
							stage: 'source-linear',
							target: 'stellar',
							enabled: true,
						},
						parameters: {maximumChromaRetention: 0.4},
					},
				],
			}),
		).toThrowError(/must equal 0.65/);
	});

	it('accepts the implemented catalog and P7 registry while rejecting incompatible filter combinations', () => {
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

		expect(() => requireImplementedFlat32ProductionSelections(catalog, {stellarCatalogUsed: true})).not.toThrow();
		const registry = new ViewPresentationFilterRegistry(filter.presentationFilters, {
			scotopicLuminanceWeights: new Array(15).fill(1),
		});
		expect(() =>
			requireImplementedFlat32ProductionSelections(filter, {
				presentationFilterRegistry: registry,
			}),
		).not.toThrow();
		const ferwerda = resolveFlat32ProductionSelections({
			colorDisplayModelConfiguration: {
				model: 'ferwerda-control',
				adaptationLuminanceCdPerSquareMeter: 0.001,
			},
			presentationFilters: filter.presentationFilters,
		});
		expect(() =>
			requireImplementedFlat32ProductionSelections(ferwerda, {
				presentationFilterRegistry: registry,
			}),
		).toThrowError(/require a Bruneton Color model/);
	});

	it('keeps flat/local celestial enablement independent from basic Bruneton selection', () => {
		/** Called by this suite to construct a mode with explicit celestial visibility.
		 *
		 * @param {boolean} celestialSourcesEnabled - Requested finite-source visibility.
		 * @returns {FlatLocalMode} - Suite-owned mode; the calling spec disposes it.
		 */
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
