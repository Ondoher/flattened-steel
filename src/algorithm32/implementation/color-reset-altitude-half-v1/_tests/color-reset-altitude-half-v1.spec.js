import {readFileSync} from 'node:fs';
import {ColorResetAltitudeHalfV1ColorDisplayModel} from '../ColorResetAltitudeHalfV1ColorDisplayModel.js';
import {ColorResetSlope078P2ColorDisplayModel} from '../../color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/index.js';

describe('ColorResetAltitudeHalfV1ColorDisplayModel', () => {
	it('matches the 70 independently retained accepted gain cases without changing physical inputs', () => {
		const fixture = JSON.parse(readFileSync(new URL('./fixtures/accepted-gains.json', import.meta.url), 'utf8'));
		const model = new ColorResetAltitudeHalfV1ColorDisplayModel();
		expect(fixture.cases.length).toBe(70);
		for (const reference of fixture.cases) {
			const before = JSON.stringify(reference.illuminance);
			const height =
				reference.mode === 'spherical-distant' ? reference.observerHeight : {value: 0, units: 'meters'};
			const display = model.displayAdaptationIlluminance(reference.illuminance, height);
			expect(display.value).withContext(reference.id).toBeCloseTo(reference.expectedDisplayIlluminance, 10);
			expect(model.displayGain(display)).withContext(reference.id).toBeCloseTo(reference.expectedGain, 9);
			expect(JSON.stringify(reference.illuminance)).toBe(before);
		}
	});

	it('retains p2 CPU scene lighting separately from altitude-adjusted frame display', () => {
		const model = new ColorResetAltitudeHalfV1ColorDisplayModel(),
			control = new ColorResetSlope078P2ColorDisplayModel();
		const illumination = {value: 0.007870837738151098, units: /** @type {const} */ ('lux')};
		const signedRgb = /** @type {const} */ ([-2, 0.01, 0.04]);
		expect(model.linearSrgbToDisplayRgb(signedRgb, illumination)).toEqual(
			control.linearSrgbToDisplayRgb(signedRgb, illumination),
		);
		expect(
			model.displayGain(model.displayAdaptationIlluminance(illumination, {value: 40, units: 'kilometers'})),
		).toBeCloseTo(71.73496747949208, 9);
		expect(
			model.displayAdaptationIlluminance({value: 0, units: 'lux'}, {value: 40000, units: 'meters'}).value,
		).toBe(0);
		expect(model.displayAdaptationIlluminance(illumination, {value: 10000, units: 'meters'})).toEqual(illumination);
		expect(
			model.displayAdaptationIlluminance({value: 385, units: 'lux'}, {value: 40000, units: 'meters'}).value,
		).toBe(385);
	});

	it('requires a distinct display binding while keeping receiver-lux observation', () => {
		const model = new ColorResetAltitudeHalfV1ColorDisplayModel();
		const contribution = model.createShaderContribution(
			/** @type {ShaderContributionRequest} */ ({
				model: {profile: {spectral: {basis: NATIVE_15_SPECTRAL_BASIS}}, celestialSources: null},
			}),
		);
		expect(contribution.id).toBe('color-reset-altitude-half-v1-display');
		expect(contribution.uniforms).toContain(
			jasmine.objectContaining({valueKey: 'color.totalHorizontalIlluminance.value'}),
		);
		expect(contribution.uniforms).toContain(
			jasmine.objectContaining({valueKey: 'color.displayAdaptationIlluminance.value'}),
		);
		expect(contribution.functions.map((block) => block.code).join('\n')).toContain(
			'colorResetDisplayGain(uColorResetDisplayAdaptationIlluminanceLux)',
		);
	});
});
