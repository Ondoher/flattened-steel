import {FerwerdaColorDisplayModel, deriveFerwerdaParameters} from '../FerwerdaColorDisplayModel.js';
import {FERWERDA_ADAPTATION_KINDS, FERWERDA_DISPLAY_CONDITION} from '../consts.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/index.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket} from '../../../spectral-values/index.js';

const ACCEPTED_CONTROLS = Object.freeze({
	noon: Object.freeze({
		luminance: 5070.201700912994,
		coneScale: 0.009280959245300533,
		rodScale: 0.0012811290102633527,
		rodBlend: 0,
		display: Object.freeze([0.000014988749181160363, 0.000007494374590580181, 0.0000014988749181160363]),
	}),
	sunset: Object.freeze({
		luminance: 3632.4668027619023,
		coneScale: 0.012954374508212498,
		rodScale: 0.0017882014728909273,
		rodBlend: 0,
		display: Object.freeze([0.000020921314830763187, 0.000010460657415381593, 0.0000020921314830763183]),
	}),
	night: Object.freeze({
		luminance: 0.001,
		coneScale: 13.728342393473461,
		rodScale: 1421.6487023202644,
		rodBlend: 0.9999875001249987,
		display: Object.freeze([0.3563855447951056, 0.354972391700791, 0.35383693968085783]),
	}),
});

function createModel(control, kind = FERWERDA_ADAPTATION_KINDS.BRIGHTNESS_PROXY) {
	return new FerwerdaColorDisplayModel({
		adaptation: {
			kind,
			luminance: {value: control.luminance, units: 'cd m^-2'},
			provenanceId: `accepted-control:${control.luminance}`,
		},
	});
}

function expectValuesClose(actual, expected, tolerance = 1e-12) {
	expect(actual.length).toBe(expected.length);
	for (let index = 0; index < expected.length; index += 1) {
		expect(Math.abs(actual[index] - expected[index]))
			.withContext(`value ${index}`)
			.toBeLessThanOrEqual(Math.max(1, Math.abs(expected[index])) * tolerance);
	}
}

function createPacket(values, quantity, units) {
	return new SpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity,
		units,
		values,
		provenanceIdentity: `ferwerda-test:${quantity}:${values.join(', ')}`,
	});
}

describe('FerwerdaColorDisplayModel', /** Register the production Ferwerda Color contract. */ () => {
	it('reproduces the accepted noon, sunset, and qualified-night controls', () => {
		for (const [condition, control] of Object.entries(ACCEPTED_CONTROLS)) {
			const kind =
				condition === 'night'
					? FERWERDA_ADAPTATION_KINDS.QUALIFIED_STARLIGHT_REFERENCE
					: FERWERDA_ADAPTATION_KINDS.BRIGHTNESS_PROXY;
			const model = createModel(control, kind);
			const parameters = deriveFerwerdaParameters(control.luminance);
			expect(parameters.displayMaximumLuminance).toBe(FERWERDA_DISPLAY_CONDITION.maximumLuminance.value);
			expect(parameters.displayAdaptationLuminance).toBe(FERWERDA_DISPLAY_CONDITION.adaptationLuminance.value);
			expect(parameters.coneScale).toBeCloseTo(control.coneScale, 14);
			expect(parameters.rodScale).toBeCloseTo(control.rodScale, 14);
			expect(parameters.rodBlend).toBeCloseTo(control.rodBlend, 14);
			expectValuesClose(model.linearSrgbToDisplayRgb([0.01, 0.005, 0.001]), control.display);
		}
	});

	it('requires an explicit brightness-proxy or qualified-starlight adaptation source', () => {
		expect(() => new FerwerdaColorDisplayModel()).toThrowError(TypeError, 'Ferwerda adaptation input is required.');
		expect(
			() =>
				new FerwerdaColorDisplayModel({
					adaptation: {
						kind: 'framebuffer-average',
						luminance: {value: 1, units: 'cd m^-2'},
						provenanceId: 'rejected',
					},
				}),
		).toThrowError(TypeError, 'Ferwerda adaptation kind is not supported.');
		expect(
			() =>
				new FerwerdaColorDisplayModel({
					adaptation: {
						kind: FERWERDA_ADAPTATION_KINDS.BRIGHTNESS_PROXY,
						luminance: {value: 1, units: 'cd m^-2'},
						provenanceId: '',
					},
				}),
		).toThrowError(TypeError, 'Ferwerda adaptation provenanceId is required.');
	});

	it('identifies the complete configured adaptation and fixed display condition', () => {
		const sunset = createModel(ACCEPTED_CONTROLS.sunset);
		const noon = createModel(ACCEPTED_CONTROLS.noon);
		expect(sunset.id).toMatch(/^ferwerda-steady-state-cone-rod-display-v1:sha256:/u);
		expect(noon.id).not.toBe(sunset.id);
	});

	it('maps the complete composed field without a source-specific display branch', () => {
		const model = createModel(ACCEPTED_CONTROLS.sunset);
		const contribution = model.createShaderContribution({
			model: {
				profile: {spectral: {basis: NATIVE_15_SPECTRAL_BASIS}},
				celestialSources: {id: 'opaque-roster'},
			},
		});
		const source = [...contribution.functions, ...contribution.mainHooks].map((block) => block.code).join('\n');

		expect(contribution.id).toBe('color-ferwerda-steady-state-display');
		expect(contribution.provides).toEqual(['color.composeSceneColor', 'color.encodeOutput']);
		expect(contribution.requires).toContain('composition.composeSpectralRadiance');
		expect(contribution.uniforms).toEqual([
			{
				name: 'uFerwerdaWorldAdaptationLuminance',
				type: 'float',
				valueKey: 'color.brightnessProxy',
				defaultValue: 3632.4668027619023,
			},
			{
				name: 'uFerwerdaSceneLuminanceScale',
				type: 'float',
				valueKey: 'color.sceneLuminanceScale',
				defaultValue: 3632.4668027619023,
			},
		]);
		expect(contribution.bindingRequirements).toEqual([
			{
				id: 'color.brightness-proxy',
				owner: 'color',
				kind: 'uniform',
				updateFrequency: 'frame',
				valueKey: 'color.brightnessProxy',
				required: false,
			},
			{
				id: 'color.scene-luminance-scale',
				owner: 'color',
				kind: 'uniform',
				updateFrequency: 'frame',
				valueKey: 'color.sceneLuminanceScale',
				required: false,
			},
		]);
		expect(source).toContain('composeFerwerdaSceneLinearSrgb(state, preDisplayRadiance)');
		expect(source).toContain('max(uFerwerdaWorldAdaptationLuminance, FERWERDA_ADAPTATION_EPSILON)');
		expect(source).not.toMatch(/Sun|stellar|catalog|framebuffer/u);
	});

	it('changes only exact-zero adaptation to the positive logarithm guard', () => {
		const zero = createModel({...ACCEPTED_CONTROLS.night, luminance: 0});
		const positive = createModel({...ACCEPTED_CONTROLS.night, luminance: 0.001});

		expect(zero.adaptation.luminance.value).toBe(0);
		expect(zero.parameters.worldAdaptationLuminance).toBe(0.000001);
		expect(positive.parameters.worldAdaptationLuminance).toBe(0.001);
	});

	it('keeps exposure tuning outside the accepted steady-state model', () => {
		const model = createModel(ACCEPTED_CONTROLS.noon);
		const radiance = createPacket(
			new Array(15).fill(0.000001),
			SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			SPECTRAL_UNITS.RADIANCE_DENSITY,
		);
		expect(model.convert({radiance}).colorSpace).toBe('display-srgb');
		expect(() => model.convert({radiance, exposureModifier: 2})).toThrowError(
			RangeError,
			'Ferwerda Color accepts only the qualified identity exposure.',
		);
	});

	it('feeds renderer-linear scene color directly into the Ferwerda display boundary', () => {
		const model = createModel(ACCEPTED_CONTROLS.sunset);
		const pathRadiance = createPacket(
			new Array(15).fill(0.000001),
			SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			SPECTRAL_UNITS.RADIANCE_DENSITY,
		);
		const transmittance = createPacket(
			new Array(15).fill(0.5),
			SPECTRAL_QUANTITIES.TRANSMITTANCE,
			SPECTRAL_UNITS.DIMENSIONLESS,
		);
		const request = {
			pathRadiance,
			transmittance,
			sceneDisplayRgb: [0.1, 0.2, 0.3],
			sceneColorSpace: 'linear-srgb',
			sceneLuminanceScale: {value: 42259.92746573373, units: 'cd m^-2'},
		};
		const linear = model.composeSceneLinearSrgb(request);
		const display = model.composeSceneDisplayRgb(request);
		const path = model.radianceToLinearSrgb(pathRadiance);
		expectValuesClose(
			linear,
			path.map(
				(value, index) => value + request.sceneDisplayRgb[index] * request.sceneLuminanceScale.value * 0.5,
			),
		);
		expect(display.every((value) => Number.isFinite(value) && value >= 0 && value <= 1)).toBeTrue();
	});

	it('uses source brightness as a neutral scene-luminance scale without changing photopic channel ratios', () => {
		const model = createModel(ACCEPTED_CONTROLS.noon);
		const zeroPath = createPacket(
			new Array(15).fill(0),
			SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			SPECTRAL_UNITS.RADIANCE_DENSITY,
		);
		const unitTransmittance = createPacket(
			new Array(15).fill(1),
			SPECTRAL_QUANTITIES.TRANSMITTANCE,
			SPECTRAL_UNITS.DIMENSIONLESS,
		);
		const scene = [0.1, 0.2, 0.3];
		const sceneLuminanceScale = {value: 42259.92746573373, units: 'cd m^-2'};
		const linear = model.composeSceneLinearSrgb({
			pathRadiance: zeroPath,
			transmittance: unitTransmittance,
			sceneDisplayRgb: scene,
			sceneColorSpace: 'linear-srgb',
			sceneLuminanceScale,
		});

		expectValuesClose(
			linear,
			scene.map((value) => value * sceneLuminanceScale.value),
		);
		expect(model.parameters.rodBlend).toBe(0);
		expect(linear[1] / linear[0]).toBeCloseTo(2, 14);
		expect(linear[2] / linear[0]).toBeCloseTo(3, 14);
	});
});
