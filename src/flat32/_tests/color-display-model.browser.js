import {createFlat32ColorDisplayModel} from '../Flat32ColorDisplayModel.js';
describe('Flat32 Color selection', () => {
	it('uses Ferwerda unconditionally and protects only zero adaptation', () => {
		const color = createFlat32ColorDisplayModel();

		expect(color.id).toMatch(/^ferwerda-steady-state-cone-rod-display-v1:sha256:/u);
		expect(color.adaptation).toEqual({
			kind: 'receiver-local-brightness-proxy',
			luminance: {value: 0, units: 'cd m^-2'},
			provenanceId: 'flat32:local-light-level-calculator',
		});
		expect(color.parameters.worldAdaptationLuminance).toBeGreaterThan(0);
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
		expect(createFlat32ColorDisplayModel().adaptation.kind).toBe('receiver-local-brightness-proxy');
	});
});
