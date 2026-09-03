import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/index.js';
import {BrunetonColorDisplayModel} from '../../bruneton-color/BrunetonColorDisplayModel.js';
import {ColorResetSlope078P9ColorDisplayModel} from '../ColorResetSlope078P9ColorDisplayModel.js';

const ACCEPTED_SCENES = [
	[1012.6643901353058, 2.4936675676154163, -0.007609811693596956, -3.0903017779190045],
	[385.0097520214597, 4.749025134495488, -0.004827715702629396, -0.3913893005110219],
	[104.71173702690129, 12.42255356946333, -0.09251799612086531, -0.7798493301633187],
	[20.29393028505105, 44.64703222723086, -1.7143253249649, -0.7792320540740446],
	[1.3443726921227952, 366.9645638852479, -209.79044910753177, -0.7685661739713302],
	[0.2044095523727617, 1499.8907887698003, -5213.302209600796, -0.7104842426044004],
];

describe('ColorResetSlope078P9ColorDisplayModel', () => {
	it('reproduces the accepted binary64 response values and slopes', () => {
		const model = new ColorResetSlope078P9ColorDisplayModel();

		for (const [lux, gain, derivative, elasticity] of ACCEPTED_SCENES) {
			const illuminance = {value: lux, units: 'lux'};
			expect(model.displayGain(illuminance)).toBe(gain);
			expect(model.displayGainDerivative(illuminance)).toBe(derivative);
			expect(model.displayGainLogElasticity(illuminance)).toBe(elasticity);
		}
	});

	it('is finite at darkness, tends to identity in daylight, and preserves the signed pre-tone operation', () => {
		const model = new ColorResetSlope078P9ColorDisplayModel();

		expect(model.displayGain({value: 0, units: 'lux'})).toBe(9887.08997070112);
		expect(model.displayGainDerivative({value: 0, units: 'lux'})).toBeLessThanOrEqual(0);
		expect(model.displayGainLogElasticity({value: 0, units: 'lux'})).toBe(0);
		expect(model.displayGain({value: 200000, units: 'lux'})).toBe(1);
		expect(model.applyPreToneGain([-2, 3, 0], {value: 385.0097520214597, units: 'lux'})).toEqual([
			-9.498050268990976,
			14.247075403486465,
			0,
		]);
	});

	it('adds only the total-horizontal lux binding to inherited Bruneton composition', () => {
		const model = new ColorResetSlope078P9ColorDisplayModel();
		const contribution = model.createShaderContribution(/** @type {ShaderContributionRequest} */ ({
			model: {profile: {spectral: {basis: NATIVE_15_SPECTRAL_BASIS}}, celestialSources: null},
		}));
		const source = contribution.functions.map((block) => block.code).join('\n');

		expect(model.id).toBe('color-reset-slope-078-p9');
		expect(contribution.id).toBe('color-reset-slope-078-p9-display');
		expect(contribution.uniforms).toContain(jasmine.objectContaining({
			name: 'uColorResetTotalHorizontalIlluminanceLux',
			valueKey: 'color.totalHorizontalIlluminance.value',
		}));
		expect(source).toContain('COLOR_RESET_ADAPTATION_EXPONENT = 0.78');
		expect(source).toContain('linearSrgb * colorResetDisplayGain');
		expect(source).toContain('exp(-max(exposedLinearSrgb, vec3(0.0)) * DISPLAY_TONE_MAP_K)');
	});

	it('leaves Basic Bruneton as a separate unchanged model and rejects invalid inputs', () => {
		const basic = new BrunetonColorDisplayModel();
		const model = new ColorResetSlope078P9ColorDisplayModel();

		expect(basic.id).toBe('bruneton-figure1-display');
		expect(basic.createShaderContribution({model: {profile: {spectral: {basis: NATIVE_15_SPECTRAL_BASIS}}}}).id)
			.toBe('color-bruneton-figure1-display');
		expect(() => model.displayGain({value: -1, units: 'lux'})).toThrowError(RangeError);
		expect(() => model.displayGain({value: 1, units: 'cd m^-2'})).toThrowError(TypeError);
		expect(() => model.applyPreToneGain([1, Number.NaN, 3], {value: 1, units: 'lux'})).toThrowError(TypeError);
	});
});
