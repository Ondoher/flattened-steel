import {BrunetonColorDisplayModel} from '../BrunetonColorDisplayModel.js';
import {FIGURE1_DISPLAY_CONSTANTS} from '../consts.js';
import {CANONICAL_SPECTRAL_CHANNELS} from '../../../profiles/native-15/consts.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/index.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralBasis, SpectralPacket} from '../../../spectral-values/index.js';
import {E8_NATIVE_15_BASIS_LINEAR_SRGB, E8_NATIVE_15_ONES_LINEAR_SRGB} from './consts.js';

describe('BrunetonColorDisplayModel', /** Called by Jasmine to register the named test suite. */ () => {
	it('promotes the accepted Figure 1 display constants', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(FIGURE1_DISPLAY_CONSTANTS).toEqual(
			jasmine.objectContaining({
				conversionKind: 'cie-xyz-to-linear-srgb-paper-figure1-tone-map',
				outputColorSpace: 'linear-srgb',
				maxLuminousEfficacy: {value: 683, units: 'lumens-per-watt'},
				brunetonComparisonToneMapExposureScale: 5,
				paperFigure1ToneMapK: 1 / (5 * 683),
				demoGammaPowerOmitted: true,
				demoWhitePointOmitted: true,
			}),
		);
		expect(FIGURE1_DISPLAY_CONSTANTS.xyzToLinearSrgbMatrix[0]).toEqual([3.2406, -1.5372, -0.4986]);
	});

	it('identifies the accepted E8 display conversion owner', /** Called by Jasmine to exercise the named behavior. */ () => {
		const model = new BrunetonColorDisplayModel();

		expect(model.id).toBe('bruneton-figure1-display');
	});

	it('reproduces every E8 native-15 basis projection and the unit combination', /** Called by Jasmine to exercise the named behavior. */ () => {
		const model = new BrunetonColorDisplayModel();

		for (let channelIndex = 0; channelIndex < NATIVE_15_SPECTRAL_BASIS.channelCount; channelIndex += 1) {
			const values = new Array(NATIVE_15_SPECTRAL_BASIS.channelCount).fill(0);
			values[channelIndex] = 1;

			expectTripletClose(
				model.radianceToLinearSrgb(createRadiance(values)),
				E8_NATIVE_15_BASIS_LINEAR_SRGB[channelIndex],
			);
		}

		const ones = createRadiance(
			CANONICAL_SPECTRAL_CHANNELS.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @returns - The callback result returned to its caller.
				 */ () => 1,
			),
		);
		expectTripletClose(model.radianceToLinearSrgb(ones), E8_NATIVE_15_ONES_LINEAR_SRGB);
		expect(model.convert({radiance: ones})).toEqual({
			channels: model.radianceToDisplayRgb(ones),
			colorSpace: 'linear-srgb',
		});
	});

	it('exposes final negative clamping and high-value tone mapping', /** Called by Jasmine to exercise the named behavior. */ () => {
		const model = new BrunetonColorDisplayModel();
		const firstBasis = new Array(NATIVE_15_SPECTRAL_BASIS.channelCount).fill(0);
		firstBasis[0] = 1;

		expectTripletClose(
			model.radianceToDisplayRgb(createRadiance(firstBasis)),
			[0.004309678820771157, 0, 0.025181086456550483],
		);

		const high = createRadiance(
			CANONICAL_SPECTRAL_CHANNELS.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param _unusedValue - The intentionally unused callback value.
				 * @param index - The zero-based index accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (_unusedValue, index) => (index + 1) * 25,
			),
		);
		for (const channel of model.radianceToDisplayRgb(high)) {
			expect(channel).toBeGreaterThanOrEqual(0);
			expect(channel).toBeLessThanOrEqual(1);
		}
	});

	it('applies the reference Figure 1 mapping without an extra output transfer', /** Called by Jasmine to exercise the named behavior. */ () => {
		const model = new BrunetonColorDisplayModel();
		const linearInput = 0.18 / FIGURE1_DISPLAY_CONSTANTS.paperFigure1ToneMapK;
		const mappedLinear = 1 - Math.exp(-0.18);
		const mapped = model.linearSrgbToDisplayRgb([linearInput, linearInput, linearInput]);

		expectTripletClose(mapped, [mappedLinear, mappedLinear, mappedLinear]);
	});

	it('keeps the original Figure 1 mapping independent of adaptation exposure', /** Called by Jasmine to exercise the named behavior. */ () => {
		const model = new BrunetonColorDisplayModel();
		const linearInput = 0.18 / FIGURE1_DISPLAY_CONSTANTS.paperFigure1ToneMapK;
		const baseline = model.linearSrgbToDisplayRgb([linearInput, linearInput / 2, 0]);
		const attemptedHybrid = model.linearSrgbToDisplayRgb([linearInput, linearInput / 2, 0], 2);

		expectTripletClose(baseline, [1 - Math.exp(-0.18), 1 - Math.exp(-0.09), 0]);
		expectTripletClose(attemptedHybrid, baseline);
		expect(model.displayConstants.paperFigure1ToneMapK).toBe(FIGURE1_DISPLAY_CONSTANTS.paperFigure1ToneMapK);
	});

	it('matches the production captured-scene compositor', /** Called by Jasmine to exercise the named behavior. */ () => {
		const model = new BrunetonColorDisplayModel();
		const transmittanceValues = CANONICAL_SPECTRAL_CHANNELS.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param _unusedValue - The intentionally unused callback value.
			 * @param index - The zero-based index accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (_unusedValue, index) => 0.15 + index * 0.05,
		);
		const request = {
			pathRadiance: createRadiance(
				CANONICAL_SPECTRAL_CHANNELS.map(
					/**
					 * Called by Array.prototype.map to transform one collection value.
					 * @returns - The callback result returned to its caller.
					 */ () => 0,
				),
			),
			transmittance: createTransmittance(transmittanceValues),
			sceneDisplayRgb: [0.2, 0.4, 0.8],
			sceneColorSpace: 'linear-srgb',
		};

		expectTripletClose(
			model.spectralTransmittanceToRgbBands(request.transmittance),
			[0.7000000000000001, 0.45, 0.25],
		);
		expectTripletClose(
			model.composeSceneLinearSrgb(request),
			[1584.1237026773879, 1681.4771060372989, 2021.6766108224188],
		);
		expectTripletClose(
			model.composeSceneDisplayRgb(request),
			[0.3711561101361063, 0.38882981662960336, 0.4467797128822699],
		);
	});

	it('adds path radiance and leaves background RGB unattenuated', /** Called by Jasmine to exercise the named behavior. */ () => {
		const model = new BrunetonColorDisplayModel();
		const zero = createRadiance(
			CANONICAL_SPECTRAL_CHANNELS.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @returns - The callback result returned to its caller.
				 */ () => 0,
			),
		);
		const path = createRadiance(
			CANONICAL_SPECTRAL_CHANNELS.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param _unusedValue - The intentionally unused callback value.
				 * @param index - The zero-based index accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (_unusedValue, index) => (index + 1) * 0.000002,
			),
		);
		const transmittance = createTransmittance(
			CANONICAL_SPECTRAL_CHANNELS.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param _unusedValue - The intentionally unused callback value.
				 * @param index - The zero-based index accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (_unusedValue, index) => index / 14,
			),
		);
		const sceneOnly = model.composeSceneLinearSrgb({
			pathRadiance: zero,
			transmittance,
			sceneDisplayRgb: [0.2, 0.4, 0.8],
			sceneColorSpace: 'linear-srgb',
			applySceneTransmittance: false,
		});
		const withPath = model.composeSceneLinearSrgb({
			pathRadiance: path,
			transmittance,
			sceneDisplayRgb: [0.2, 0.4, 0.8],
			sceneColorSpace: 'linear-srgb',
			applySceneTransmittance: false,
		});

		expectTripletClose(sceneOnly, [2263.033860967697, 3736.6157911939977, 8086.706443289675]);
		const pathLinear = model.radianceToLinearSrgb(path);
		expectTripletClose(
			withPath,
			sceneOnly.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param value - The value accepted by the operation.
				 * @param index - The zero-based index accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (value, index) => value + pathLinear[index],
			),
		);
	});

	it('brings an HDR scene pixel into range without erasing its channel ratios', /** Called by Jasmine to exercise the named behavior. */ () => {
		const model = new BrunetonColorDisplayModel();
		const zero = createRadiance(new Array(CANONICAL_SPECTRAL_CHANNELS.length).fill(0));
		const transmittance = createTransmittance(new Array(CANONICAL_SPECTRAL_CHANNELS.length).fill(1));
		const displayRgb = model.rendererLinearSrgbToDisplayRgb([8, 4, 1.5]);
		const composed = model.composeSceneDisplayRgb({
			pathRadiance: zero,
			transmittance,
			sceneDisplayRgb: [8, 4, 1.5],
			sceneColorSpace: 'linear-srgb',
			applySceneTransmittance: false,
		});

		expectTripletClose(displayRgb, [0.9999999999999999, 0.7353569830524495, 0.47021403501609]);
		expectTripletClose(composed, [0.999999, 0.7353569830524495, 0.47021403501609]);
		expect(composed[0]).toBeGreaterThan(composed[1]);
		expect(composed[1]).toBeGreaterThan(composed[2]);
	});

	it('publishes the reference Figure 1 output mapping', /** Called by Jasmine to exercise the named behavior. */ () => {
		const model = new BrunetonColorDisplayModel();
		const contribution = model.createShaderContribution({
			model: /** @type {Algorithm32ExecutionModel} */ (
				/** @type {unknown} */ ({
					celestialSources: null,
					profile: {spectral: {basis: NATIVE_15_SPECTRAL_BASIS}},
				})
			),
		});

		expect(contribution.textures).toEqual([]);
		expect(contribution.uniforms).toEqual([]);
		expect(contribution.bindingRequirements).toEqual([]);
		expect(contribution.diagnostics).toEqual(
			jasmine.objectContaining({
				highlightShoulder: 'channel-wise-exponential',
				outputTransfer: 'bruneton-figure1-direct',
				cieTableResolution: {value: 1, units: 'nanometers'},
			}),
		);

		const composition = contribution.functions[1].code;
		const encoding = contribution.functions[2].code;
		expect(composition).toContain('spectralTransmittanceToRgbBands');
		expect(composition).toContain('displayRgbToLinearSrgb');
		expect(composition).toContain('rendererLinearSrgbToDisplayRgb');
		expect(composition).toContain('vec3 bounded = peakChannel > 1.0 ? nonnegative / peakChannel : nonnegative;');
		expect(composition).toContain('state.bounds.endpointDistanceMeters <= state.bounds.endDistanceMeters + 0.001');
		expect(composition).toContain('return pathLinearSrgb + sceneLinearSrgb * sceneTransmittanceRgb;');
		expect(composition).not.toContain('endpointRadiance');
		expect(composition).not.toContain('uMatteEndpointRadianceTexture');
		expect(encoding).toContain('vec3(1.0) - exp(-max(linearSrgb, vec3(0.0)) * DISPLAY_TONE_MAP_K)');
		expect(encoding).toContain('return vec4(mapped, 1.0);');
		expect(encoding).not.toContain('exposedPeak');
	});

	it('selects completed pre-display radiance only for enabled celestial assembly', /** Called by Jasmine to exercise the named behavior. */ () => {
		const model = new BrunetonColorDisplayModel();
		const contribution = model.createShaderContribution({
			model: /** @type {Algorithm32ExecutionModel} */ (
				/** @type {unknown} */ ({
					celestialSources: {},
					profile: {spectral: {basis: NATIVE_15_SPECTRAL_BASIS}},
				})
			),
		});
		const composition = contribution.functions[1].code;

		expect(contribution.requires).toEqual(['runtime.initialState', 'composition.composeSpectralRadiance']);
		expect(composition).toContain('spectralRadianceToLinearSrgb(preDisplayRadiance)');
		expect(composition).not.toContain('spectralRadianceToLinearSrgb(state.pathRadiance)');
	});

	it('fails loudly for unitless and wrong-quantity packets while accepting another supported basis', /** Called by Jasmine to exercise the named behavior. */ () => {
		const model = new BrunetonColorDisplayModel();
		const values = CANONICAL_SPECTRAL_CHANNELS.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @returns - The callback result returned to its caller.
			 */ () => 1,
		);
		const incompatibleBasis = new SpectralBasis({
			id: 'shifted-native-15',
			semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
			channels: NATIVE_15_SPECTRAL_BASIS.channels.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param channel - The channel value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (channel) => ({
					...channel,
					center: {value: channel.center.value + 1, units: channel.center.units},
				}),
			),
		});
		const wrongUnits = createRadiance(values);
		Reflect.set(wrongUnits, 'units', SPECTRAL_UNITS.DIMENSIONLESS);

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				model.radianceToLinearSrgb(/** @type {SpectralRadiancePacket} */ (/** @type {unknown} */ (values))),
		).toThrowError(/SpectralPacket/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				model.radianceToLinearSrgb(
					/** @type {SpectralRadiancePacket} */ (/** @type {unknown} */ (createTransmittance(values))),
				),
		).toThrowError(/quantity/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => model.radianceToLinearSrgb(wrongUnits),
		).toThrowError(/units/);
		expect(model.radianceToLinearSrgb(createRadiance(values, incompatibleBasis)).every(Number.isFinite)).toBeTrue();
	});
});

/**
 * Called by this module to create native spectral radiance for a test boundary.
 *
 * @param {readonly number[]} values - Supplies radiance values.
 * @param {SpectralBasis} [basis] - Supplies the spectral basis.
 * @returns {SpectralRadiancePacket} - Return the packet.
 */
function createRadiance(values, basis = NATIVE_15_SPECTRAL_BASIS) {
	return /** @type {SpectralRadiancePacket} */ (
		new SpectralPacket({
			basis,
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			values,
			provenanceIdentity: `color-spec:radiance:${values.join(',')}`,
		})
	);
}

/**
 * Called by this module to create native spectral transmittance for a test boundary.
 *
 * @param {readonly number[]} values - Supplies transmittance values.
 * @returns {SpectralTransmittancePacket} - Return the packet.
 */
function createTransmittance(values) {
	return /** @type {SpectralTransmittancePacket} */ (
		new SpectralPacket({
			basis: NATIVE_15_SPECTRAL_BASIS,
			quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
			units: SPECTRAL_UNITS.DIMENSIONLESS,
			values,
			provenanceIdentity: `color-spec:transmittance:${values.join(',')}`,
		})
	);
}

/**
 * Called by this module to expect matching finite RGB triplets with an E8-scale binary64 tolerance.
 *
 * @param {readonly number[]} actual - Supplies actual values.
 * @param {readonly number[]} expected - Supplies expected values.
 * @returns {void} -
 */
function expectTripletClose(actual, expected) {
	expect(actual.length).toBe(3);

	for (let index = 0; index < 3; index += 1) {
		const tolerance = Math.max(1, Math.abs(expected[index])) * 1e-12;
		expect(Math.abs(actual[index] - expected[index]))
			.withContext(`channel ${index}`)
			.toBeLessThanOrEqual(tolerance);
	}
}
