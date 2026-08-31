import {createFlat32ColorDisplayModel} from '../Flat32ColorDisplayModel.js';
describe('Flat32 Color selection', () => {
	it('uses the accepted Bruneton source-luminance lift unconditionally', () => {
		const color = createFlat32ColorDisplayModel();

		expect(color.id).toBe('bruneton-source-derived-global-luminance-lift-v2');
	});

	it('keeps explicit reference Color controls separate from the live default', () => {
		const ferwerda = createFlat32ColorDisplayModel({
			model: 'ferwerda-control',
			adaptationLuminanceCdPerSquareMeter: 0.001,
		});
		const bruneton = createFlat32ColorDisplayModel({model: 'bruneton-control'});

		expect(ferwerda.adaptation.luminance).toEqual({value: 0.001, units: 'cd m^-2'});
		expect(ferwerda.adaptation.kind).toBe('qualified-starlight-reference');
		expect(bruneton.id).toBe('bruneton-figure1-display');
		expect(createFlat32ColorDisplayModel().id).toBe('bruneton-source-derived-global-luminance-lift-v2');
	});
});
