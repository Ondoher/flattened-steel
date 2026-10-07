import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/index.js';
import {BrunetonColorDisplayModel} from '../../bruneton-color/BrunetonColorDisplayModel.js';
import {ColorResetSlope078P9ColorDisplayModel} from '../../color-reset-slope-078-p9/ColorResetSlope078P9ColorDisplayModel.js';
import {ColorResetSlope078P2ColorDisplayModel} from '../ColorResetSlope078P2ColorDisplayModel.js';

describe('ColorResetSlope078P2ColorDisplayModel', () => {
	it('retains the shared response constants with a distinct p2 identity', () => {
		const successor = new ColorResetSlope078P2ColorDisplayModel();
		const control = new ColorResetSlope078P9ColorDisplayModel();
		expect(successor.id).toBe('color-reset-slope-078-p2');
		expect(successor.curve).toEqual({...control.curve, sunsetRolloffPower: 2});
		expect(successor.displayGain({value: 0, units: 'lux'})).toBe(control.displayGain({value: 0, units: 'lux'}));
	});

	it('has positive brightness slope across dark adaptation and sunset transitions', () => {
		const model = new ColorResetSlope078P2ColorDisplayModel();
		let previousBrightness = 0;
		for (let index = 0; index <= 6000; index += 1) {
			const illuminance = {value: 10 ** (-6 + (13 * index) / 6000), units: 'lux'};
			const gain = model.displayGain(illuminance);
			const brightness = illuminance.value * gain;
			expect(gain + illuminance.value * model.displayGainDerivative(illuminance)).toBeGreaterThan(0);
			expect(brightness).toBeGreaterThan(previousBrightness);
			previousBrightness = brightness;
		}
	});

	it('applies signed gain before the unchanged Bruneton display encoding', () => {
		const model = new ColorResetSlope078P2ColorDisplayModel();
		const basic = new BrunetonColorDisplayModel();
		const illuminance = {value: 980, units: 'lux'};
		const signedRgb = /** @type {const} */ ([-2, 0.01, 0.04]);
		const gained = model.applyPreToneGain(signedRgb, illuminance);
		expect(gained[0]).toBeLessThan(0);
		expect(model.linearSrgbToDisplayRgb(signedRgb, illuminance)).toEqual(basic.linearSrgbToDisplayRgb(gained));
	});

	it('contributes the versioned shader identity and physical receiver-lux binding', () => {
		const model = new ColorResetSlope078P2ColorDisplayModel();
		const contribution = model.createShaderContribution(
			/** @type {ShaderContributionRequest} */ ({
				model: {profile: {spectral: {basis: NATIVE_15_SPECTRAL_BASIS}}, celestialSources: null},
			}),
		);
		const source = contribution.functions.map((block) => block.code).join('\n');
		expect(contribution.id).toBe('color-reset-slope-078-p2-display');
		expect(contribution.diagnostics.response).toBe(model.id);
		expect(source).toContain('COLOR_RESET_SUNSET_ROLLOFF_POWER = 2.0');
		expect(contribution.uniforms).toContain(
			jasmine.objectContaining({valueKey: 'color.totalHorizontalIlluminance.value'}),
		);
	});
});
