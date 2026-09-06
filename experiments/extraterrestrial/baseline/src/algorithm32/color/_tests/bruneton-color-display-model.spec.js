import { BrunetonColorDisplayModel } from '../BrunetonColorDisplayModel.js';
import {
	CANONICAL_SPECTRAL_CHANNELS,
	FIGURE1_DISPLAY_CONSTANTS,
} from '../../constants/Algorithm32CanonicalData.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../../profiles/index.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	createSpectralBasis,
	createSpectralPacket,
} from '../../quantities/index.js';
import {
	E8_NATIVE_15_BASIS_LINEAR_SRGB,
	E8_NATIVE_15_ONES_LINEAR_SRGB,
} from './consts.js';

describe('BrunetonColorDisplayModel', () => {
	it('defaults only omitted display constants', () => {
		expect(() => new BrunetonColorDisplayModel({ displayConstants: null }))
			.toThrowError(/Display constants/);
	});

	it('describes the accepted E8 display conversion', () => {
		const model = new BrunetonColorDisplayModel();
		const descriptor = model.describe();

		expect(model.id).toBe('bruneton-figure1-display');
		expect(descriptor).toEqual(jasmine.objectContaining({
			kind: 'algorithm32-color',
			id: 'bruneton-figure1-display',
			colorSpace: 'linear-srgb',
			conversionKind: 'cie-xyz-to-linear-srgb-paper-figure1-tone-map',
		}));
		expect(descriptor.fingerprint).toMatch(/^fnv1a32:/);
		expect(descriptor.displayConversion).toEqual({
			conversionKind: 'cie-xyz-to-linear-srgb-paper-figure1-tone-map',
			outputColorSpace: 'linear-srgb',
			toneMapping: 'paper-figure1-exponential',
			metadata: {
				cieObserver: 'CIE 1931 2-degree',
				cieTableResolution: { value: 1, units: 'nanometers' },
				spectralIntegration: 'native-15-bin-average-width-once',
				maxLuminousEfficacy: { value: 683, units: 'lumens-per-watt' },
				paperFigure1ToneMapK: FIGURE1_DISPLAY_CONSTANTS.paperFigure1ToneMapK,
				demoGammaPowerOmitted: true,
				demoWhitePointOmitted: true,
			},
		});
	});

	it('reproduces every E8 native-15 basis projection and the unit combination', () => {
		const model = new BrunetonColorDisplayModel();

		for (let channelIndex = 0; channelIndex < NATIVE_15_SPECTRAL_BASIS.channelCount; channelIndex += 1) {
			const values = new Array(NATIVE_15_SPECTRAL_BASIS.channelCount).fill(0);
			values[channelIndex] = 1;

			expectTripletClose(
				model.radianceToLinearSrgb(createRadiance(values)),
				E8_NATIVE_15_BASIS_LINEAR_SRGB[channelIndex],
			);
		}

		const ones = createRadiance(CANONICAL_SPECTRAL_CHANNELS.map(() => 1));
		expectTripletClose(
			model.radianceToLinearSrgb(ones),
			E8_NATIVE_15_ONES_LINEAR_SRGB,
		);
		expect(model.convert({ radiance: ones })).toEqual({
			channels: model.radianceToDisplayRgb(ones),
			colorSpace: 'linear-srgb',
		});
	});

	it('exposes final negative clamping and high-value tone mapping', () => {
		const model = new BrunetonColorDisplayModel();
		const firstBasis = new Array(NATIVE_15_SPECTRAL_BASIS.channelCount).fill(0);
		firstBasis[0] = 1;

		expectTripletClose(
			model.radianceToDisplayRgb(createRadiance(firstBasis)),
			[0.004309678820771157, 0, 0.025181086456550483],
		);

		const high = createRadiance(
			CANONICAL_SPECTRAL_CHANNELS.map((_, index) => (index + 1) * 25),
		);
		for (const channel of model.radianceToDisplayRgb(high)) {
			expect(channel).toBeGreaterThanOrEqual(0);
			expect(channel).toBeLessThanOrEqual(1);
		}
	});

	it('matches the pinned Star captured-scene compositor', () => {
		const model = new BrunetonColorDisplayModel();
		const transmittanceValues = CANONICAL_SPECTRAL_CHANNELS.map(
			(_, index) => 0.15 + index * 0.05,
		);
		const request = {
			pathRadiance: createRadiance(
				CANONICAL_SPECTRAL_CHANNELS.map(() => 0),
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
			[
				1584.1237026773879,
				1681.4771060372989,
				2021.6766108224188,
			],
		);
		expectTripletClose(
			model.composeSceneDisplayRgb(request),
			[
				0.3711561101361063,
				0.38882981662960336,
				0.4467797128822699,
			],
		);
	});

	it('adds path radiance and leaves background RGB unattenuated', () => {
		const model = new BrunetonColorDisplayModel();
		const zero = createRadiance(
			CANONICAL_SPECTRAL_CHANNELS.map(() => 0),
		);
		const path = createRadiance(
			CANONICAL_SPECTRAL_CHANNELS.map((_, index) => (index + 1) * 0.000002),
		);
		const transmittance = createTransmittance(
			CANONICAL_SPECTRAL_CHANNELS.map((_, index) => index / 14),
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

		expectTripletClose(
			sceneOnly,
			[
				2263.033860967697,
				3736.6157911939977,
				8086.706443289675,
			],
		);
		const pathLinear = model.radianceToLinearSrgb(path);
		expectTripletClose(
			withPath,
			sceneOnly.map((value, index) => value + pathLinear[index]),
		);
	});

	it('publishes the Star captured-scene shader compositor', () => {
		const model = new BrunetonColorDisplayModel();
		const contribution = model.createShaderContribution({
			descriptor: createDescriptor(model.describe()),
		});

		expect(contribution.textures).toEqual([]);
		expect(contribution.bindingRequirements).toEqual([]);

		const composition = contribution.functions[1].code;
		expect(composition).toContain('spectralTransmittanceToRgbBands');
		expect(composition).toContain('displayRgbToLinearSrgb');
		expect(composition).toContain('rendererLinearSrgbToDisplayRgb');
		expect(composition).toContain(
			'state.bounds.endpointDistanceMeters <= state.bounds.endDistanceMeters + 0.001',
		);
		expect(composition).toContain(
			'return pathLinearSrgb + sceneLinearSrgb * sceneTransmittanceRgb;',
		);
		expect(composition).not.toContain('endpointRadiance');
		expect(composition).not.toContain('uMatteEndpointRadianceTexture');
	});

	it('fails loudly for unitless, wrong-quantity, and incompatible packets', () => {
		const model = new BrunetonColorDisplayModel();
		const values = CANONICAL_SPECTRAL_CHANNELS.map(() => 1);
		const incompatibleBasis = createSpectralBasis({
			id: 'shifted-native-15',
			semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
			channels: NATIVE_15_SPECTRAL_BASIS.channels.map((channel) => ({
				...channel,
				center: { value: channel.center.value + 1, units: channel.center.units },
			})),
		});
		const wrongUnits = createRadiance(values);
		Reflect.set(wrongUnits, 'units', SPECTRAL_UNITS.DIMENSIONLESS);

		expect(() => model.radianceToLinearSrgb(
			/** @type {SpectralRadiancePacket} */ (/** @type {unknown} */ (values)),
		)).toThrowError(/SpectralPacket/);
		expect(() => model.radianceToLinearSrgb(
			/** @type {SpectralRadiancePacket} */ (
				/** @type {unknown} */ (createTransmittance(values))
			),
		)).toThrowError(/quantity/);
		expect(() => model.radianceToLinearSrgb(wrongUnits)).toThrowError(/units/);
		expect(() => model.radianceToLinearSrgb(createRadiance(values, incompatibleBasis)))
			.toThrowError(/bases/);
		expect(() => model.composeSceneLinearSrgb({
			pathRadiance: createRadiance(values),
			transmittance: /** @type {SpectralTransmittancePacket} */ (
				/** @type {unknown} */ (createTransmittance(values))
			),
			sceneDisplayRgb: [0, 1],
		})).toThrowError(/RGB triplet/);
	});
});

/**
 * Create native spectral radiance for a test boundary.
 *
 * @param {readonly number[]} values - Supplies radiance values.
 * @param {SpectralBasis} [basis] - Supplies the spectral basis.
 * @returns {SpectralRadiancePacket} Return the packet.
 */
function createRadiance(values, basis = NATIVE_15_SPECTRAL_BASIS) {
	return /** @type {SpectralRadiancePacket} */ (createSpectralPacket({
		basis,
		quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
		units: SPECTRAL_UNITS.RADIANCE_DENSITY,
		values,
		provenanceIdentity: `color-spec:radiance:${values.join(',')}`,
	}));
}

/**
 * Create native spectral transmittance for a test boundary.
 *
 * @param {readonly number[]} values - Supplies transmittance values.
 * @returns {SpectralTransmittancePacket} Return the packet.
 */
function createTransmittance(values) {
	return /** @type {SpectralTransmittancePacket} */ (createSpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
		units: SPECTRAL_UNITS.DIMENSIONLESS,
		values,
		provenanceIdentity: `color-spec:transmittance:${values.join(',')}`,
	}));
}

/**
 * Create a shader descriptor with a color section.
 *
 * @param {ColorDescriptor} colorDescriptor - Supplies color facts.
 * @returns {Algorithm32ShaderDescriptor} Return descriptor.
 */
function createDescriptor(colorDescriptor) {
	return {
		descriptorId: 'descriptor',
		variantId: 'variant',
		fingerprint: 'descriptor',
		compatibilityTags: [],
		spectralBasis: createSection('basis', {
			channelCount: NATIVE_15_SPECTRAL_BASIS.channelCount,
		}),
		geometry: createSection('geometry', {}),
		atmosphere: createSection('atmosphere', {}),
		lightSource: createSection('light-source', {}),
		cache: createSection('cache', {}),
		transport: createSection('transport', {}),
		color: createSection('color', colorDescriptor),
		runtime: createSection('runtime', {}),
	};
}

/**
 * Create one descriptor section.
 *
 * @param {string} fingerprint - Supplies section fingerprint.
 * @param {unknown} facts - Supplies section facts.
 * @returns {ShaderDescriptorSection} Return section.
 */
function createSection(fingerprint, facts) {
	return {
		descriptorId: fingerprint,
		fingerprint,
		compatibilityTags: [fingerprint],
		facts,
	};
}

/**
 * Expect matching finite RGB triplets with an E8-scale binary64 tolerance.
 *
 * @param {readonly number[]} actual - Supplies actual values.
 * @param {readonly number[]} expected - Supplies expected values.
 * @returns {void}
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
