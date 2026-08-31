import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/index.js';
import {BrunetonColorDisplayModel} from '../../bruneton-color/BrunetonColorDisplayModel.js';
import {BrunetonSourceLuminanceLiftColorDisplayModel} from '../BrunetonSourceLuminanceLiftColorDisplayModel.js';

describe('BrunetonSourceLuminanceLiftColorDisplayModel', /** Called by Jasmine to register the named test suite. */ () => {
	it('retains exact Bruneton output throughout the selected bright range', /** Called by Jasmine to exercise the named behavior. */ () => {
		const bruneton = new BrunetonColorDisplayModel();
		const lifted = new BrunetonSourceLuminanceLiftColorDisplayModel();
		const linearSrgb = /** @type {const} */ ([120, 40, 15]);

		expect(lifted.id).toBe('bruneton-source-derived-global-luminance-lift-v2');
		expect(lifted.linearSrgbToDisplayRgb(linearSrgb, {value: 5, units: 'cd m^-2'})).toEqual(
			bruneton.linearSrgbToDisplayRgb(linearSrgb),
		);
		expect(lifted.linearSrgbToDisplayRgb(linearSrgb, {value: 5000, units: 'cd m^-2'})).toEqual(
			bruneton.linearSrgbToDisplayRgb(linearSrgb),
		);
	});

	it('applies the selected capped achromatic dark lift without changing channel ratios', /** Called by Jasmine to exercise the named behavior. */ () => {
		const model = new BrunetonSourceLuminanceLiftColorDisplayModel();
		const linearSrgb = /** @type {const} */ ([0.01, 0.01, 0.01]);
		const bruneton = new BrunetonColorDisplayModel().linearSrgbToDisplayRgb(linearSrgb);
		const dark = model.linearSrgbToDisplayRgb(linearSrgb, {value: 0, units: 'cd m^-2'});
		const expected = bruneton[0] * Math.min(bruneton[0] ** (0.125 - 1), 32768);

		expect(dark[0]).toBeCloseTo(expected, 14);
		expect(dark[1]).toBeCloseTo(expected, 14);
		expect(dark[2]).toBeCloseTo(expected, 14);
		expect(dark[0] / dark[1]).toBeCloseTo(bruneton[0] / bruneton[1], 14);
	});

	it('binds one condition-wide source luminance into the inherited Bruneton composition', /** Called by Jasmine to exercise the named behavior. */ () => {
		const model = new BrunetonSourceLuminanceLiftColorDisplayModel();
		const contribution = model.createShaderContribution(
			/** @type {ShaderContributionRequest} */ (
				/** @type {unknown} */ ({
					model: {
						profile: {spectral: {basis: NATIVE_15_SPECTRAL_BASIS}},
						celestialSources: null,
					},
				})
			),
		);
		const source = contribution.functions.map((block) => block.code).join('\n');

		expect(contribution.id).toBe('color-bruneton-source-luminance-lift');
		expect(contribution.uniforms).toContain(
			jasmine.objectContaining({
				name: 'uBrunetonSourceLuminance',
				valueKey: 'color.brightnessProxy',
			}),
		);
		expect(source).toContain('deriveSourceLuminanceGamma');
		expect(source).toContain('SOURCE_LUMINANCE_MAXIMUM_GAIN = 32768.0');
		expect(source).toContain('bruneton * gain');
	});

	it('rejects invalid curve and condition inputs', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			/** Called by Jasmine to construct an invalid curve. */ () =>
				new BrunetonSourceLuminanceLiftColorDisplayModel({
					luminanceLiftCurve: {
						brightThreshold: 1,
						darkThreshold: 1,
						minimumGamma: 0.125,
						maximumLuminanceGain: 32768,
					},
				}),
		).toThrowError(RangeError, 'Bruneton luminance-lift darkThreshold must be positive and below brightThreshold.');
		const model = new BrunetonSourceLuminanceLiftColorDisplayModel();
		expect(
			/** Called by Jasmine to supply an invalid physical condition. */ () =>
				model.linearSrgbToDisplayRgb([1, 1, 1], {value: -1, units: 'cd m^-2'}),
		).toThrowError(RangeError, 'brightnessProxy.value must be nonnegative.');
	});
});
