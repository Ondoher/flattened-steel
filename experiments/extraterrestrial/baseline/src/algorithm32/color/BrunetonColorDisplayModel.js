import {
	FIGURE1_DISPLAY_CONSTANTS,
} from '../constants/Algorithm32CanonicalData.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../profiles/index.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	assertSpectralPacket,
	assertUnitValue,
} from '../quantities/index.js';
import { stableHash } from '../shader/stableHash.js';
import {
	createShaderContribution,
	createShaderSourceBlock,
	formatShaderFloat,
	formatShaderFloatArray,
} from '../shader/shaderContribution.js';
import ScalarMath from '../utils/ScalarMath.js';
import { CIE_1931_2_DEG_NATIVE_15_SOURCE_ROWS } from './consts.js';

/**
 * Convert completed Algorithm32 spectral radiance through the accepted E8
 * spectral-to-display boundary and compose captured scene RGB exactly as the
 * pinned Algorithm32-star display model does.
 */
export class BrunetonColorDisplayModel {
	/**
	 * Create the display model.
	 *
	 * @param {{ readonly displayConstants?: Figure1DisplayConstants }} [configuration] - Supplies optional display constants.
	 */
	constructor(configuration = {}) {
		this._displayConstants = this._acceptDisplayConstants(
			configuration.displayConstants === undefined
				? FIGURE1_DISPLAY_CONSTANTS
				: configuration.displayConstants,
		);
		this._displayLinearSrgbByChannel = this._buildDisplayLinearSrgbByChannel();
	}

	/**
	 * Store the accepted display constants.
	 *
	 * @type {Figure1DisplayConstants}
	 */
	_displayConstants;

	/**
	 * Store the native-15 linear-sRGB projection rows.
	 *
	 * @type {{ readonly r: readonly number[], readonly g: readonly number[], readonly b: readonly number[] }}
	 */
	_displayLinearSrgbByChannel;

	/**
	 * Identify this configured color conversion instance.
	 *
	 * @returns {string} Return the color conversion id.
	 */
	get id() {
		return 'bruneton-figure1-display';
	}

	/**
	 * Return the accepted display constants.
	 *
	 * @returns {Figure1DisplayConstants} Return the display constants.
	 */
	get displayConstants() {
		return this._displayConstants;
	}

	/**
	 * Accept a display-constant packet at the class boundary.
	 *
	 * @param {unknown} value - Supplies the candidate constants.
	 * @returns {Figure1DisplayConstants} Return accepted constants.
	 */
	_acceptDisplayConstants(value) {
		if (value === null || typeof value !== 'object' || Array.isArray(value)) {
			throw new TypeError('Display constants must be an object.');
		}

		const constants = /** @type {Figure1DisplayConstants} */ (value);
		assertUnitValue(constants.maxLuminousEfficacy, 'maxLuminousEfficacy');
		if (constants.maxLuminousEfficacy.units !== 'lumens-per-watt') {
			throw new TypeError('maxLuminousEfficacy.units must be "lumens-per-watt".');
		}
		if (
			!Number.isFinite(constants.paperFigure1ToneMapK)
			|| constants.paperFigure1ToneMapK <= 0
		) {
			throw new RangeError('paperFigure1ToneMapK must be positive and finite.');
		}
		if (
			!Array.isArray(constants.xyzToLinearSrgbMatrix)
			|| constants.xyzToLinearSrgbMatrix.length !== 3
		) {
			throw new TypeError('xyzToLinearSrgbMatrix must contain three rows.');
		}

		const matrix = [];
		for (const row of constants.xyzToLinearSrgbMatrix) {
			if (!Array.isArray(row) || row.length !== 3 || !row.every(Number.isFinite)) {
				throw new TypeError('xyzToLinearSrgbMatrix rows must contain three finite values.');
			}
			matrix.push([row[0], row[1], row[2]]);
		}

		return /** @type {Figure1DisplayConstants} */ (/** @type {unknown} */ ({
			...constants,
			maxLuminousEfficacy: { ...constants.maxLuminousEfficacy },
			xyzToLinearSrgbMatrix: matrix,
		}));
	}

	/**
	 * Accept spectral radiance on the canonical display basis.
	 *
	 * @param {unknown} value - Supplies the candidate.
	 * @returns {SpectralRadiancePacket} Return accepted radiance.
	 */
	_acceptSpectralRadiance(value) {
		return /** @type {SpectralRadiancePacket} */ (assertSpectralPacket(value, {
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			basis: NATIVE_15_SPECTRAL_BASIS,
			semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
		}));
	}

	/**
	 * Accept spectral transmittance on the canonical display basis.
	 *
	 * @param {unknown} value - Supplies the candidate.
	 * @returns {SpectralTransmittancePacket} Return accepted transmittance.
	 */
	_acceptSpectralTransmittance(value) {
		return /** @type {SpectralTransmittancePacket} */ (assertSpectralPacket(value, {
			quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
			units: SPECTRAL_UNITS.DIMENSIONLESS,
			basis: NATIVE_15_SPECTRAL_BASIS,
			semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
		}));
	}

	/**
	 * Assert a finite RGB triplet.
	 *
	 * @param {unknown} value - Supplies the candidate.
	 * @param {string} fieldName - Supplies the caller field name.
	 * @returns {asserts value is readonly [number, number, number]}
	 */
	_assertRgbTriplet(value, fieldName) {
		if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite)) {
			throw new TypeError(`${fieldName} requires a finite RGB triplet.`);
		}
	}

	/**
	 * Average one nonempty trusted numerical collection.
	 *
	 * @param {readonly number[]} values - Supplies values to average.
	 * @returns {number} Return their arithmetic mean.
	 */
	_average(values) {
		let sum = 0;

		for (const value of values) {
			sum += value;
		}

		return sum / values.length;
	}

	/**
	 * Apply the standard sRGB display transfer to one renderer-linear channel.
	 *
	 * @param {number} value - Supplies a renderer-linear channel.
	 * @returns {number} Return display-encoded RGB.
	 */
	_rendererLinearSrgbChannelToDisplayRgb(value) {
		const clamped = ScalarMath.clamp(value, 0, 1);

		if (clamped <= 0.0031308) {
			return clamped * 12.92;
		}

		return 1.055 * (clamped ** (1 / 2.4)) - 0.055;
	}

	/**
	 * Invert the Figure 1 exponential bridge for one display channel.
	 *
	 * @param {number} value - Supplies one display-encoded channel.
	 * @returns {number} Return the Star linear-sRGB proxy channel.
	 */
	_displayRgbChannelToLinearSrgb(value) {
		const clamped = ScalarMath.clamp(value, 0, 0.999999);

		return -Math.log(1 - clamped)
			/ this._displayConstants.paperFigure1ToneMapK;
	}

	/**
	 * Interpolate the official 1-nanometer CIE rows at one native channel
	 * center.
	 *
	 * @param {number} wavelengthNanometers - Supplies the channel center.
	 * @returns {readonly [number, number, number]} Return x-bar, y-bar, z-bar.
	 */
	_cieColorMatchingValuesAt(wavelengthNanometers) {
		const lowerWavelength = Math.floor(wavelengthNanometers);
		const upperWavelength = Math.ceil(wavelengthNanometers);
		let lowerRow = null;
		let upperRow = null;

		for (const row of CIE_1931_2_DEG_NATIVE_15_SOURCE_ROWS) {
			if (row[0] === lowerWavelength) {
				lowerRow = row;
			}
			if (row[0] === upperWavelength) {
				upperRow = row;
			}
		}

		if (!lowerRow || !upperRow) {
			throw new RangeError(
				`CIE source rows do not bracket ${wavelengthNanometers} nanometers.`,
			);
		}
		if (lowerWavelength === upperWavelength) {
			return [lowerRow[1], lowerRow[2], lowerRow[3]];
		}

		const fraction = wavelengthNanometers - lowerWavelength;

		return [
			lowerRow[1] + (upperRow[1] - lowerRow[1]) * fraction,
			lowerRow[2] + (upperRow[2] - lowerRow[2]) * fraction,
			lowerRow[3] + (upperRow[3] - lowerRow[3]) * fraction,
		];
	}

	/**
	 * Project trusted native-15 radiance values to linear sRGB.
	 *
	 * The channel widths are applied exactly once. The matching values were
	 * interpolated from the official 1-nanometer CIE table at the native bin
	 * centers and are then scaled by 683 lm/W and the declared matrix.
	 *
	 * @param {readonly number[]} radiance - Supplies trusted native-15 values.
	 * @returns {readonly [number, number, number]} Return linear sRGB values.
	 */
	_spectralRadianceValuesToLinearSrgb(radiance) {
		let x = 0;
		let y = 0;
		let z = 0;

		for (let channelIndex = 0; channelIndex < NATIVE_15_SPECTRAL_BASIS.channelCount; channelIndex += 1) {
			const channel = NATIVE_15_SPECTRAL_BASIS.channels[channelIndex];
			const widthNanometers = channel.width.value;
			const matching = this._cieColorMatchingValuesAt(
				channel.center.value,
			);
			const weightedRadiance = radiance[channelIndex] * widthNanometers;

			x += matching[0] * weightedRadiance;
			y += matching[1] * weightedRadiance;
			z += matching[2] * weightedRadiance;
		}

		const matrix = this._displayConstants.xyzToLinearSrgbMatrix;
		const efficacy = this._displayConstants.maxLuminousEfficacy.value;

		return [
			efficacy * (matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * z),
			efficacy * (matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * z),
			efficacy * (matrix[2][0] * x + matrix[2][1] * y + matrix[2][2] * z),
		];
	}

	/**
	 * Build the exact per-channel projection weights embedded in GLSL.
	 *
	 * @returns {{ readonly r: readonly number[], readonly g: readonly number[], readonly b: readonly number[] }} Return row weights.
	 */
	_buildDisplayLinearSrgbByChannel() {
		const rows = {
			r: [],
			g: [],
			b: [],
		};

		for (let channelIndex = 0; channelIndex < NATIVE_15_SPECTRAL_BASIS.channelCount; channelIndex += 1) {
			const basisPacket = new Array(NATIVE_15_SPECTRAL_BASIS.channelCount).fill(0);
			basisPacket[channelIndex] = 1;
			const response = this._spectralRadianceValuesToLinearSrgb(basisPacket);

			rows.r.push(response[0]);
			rows.g.push(response[1]);
			rows.b.push(response[2]);
		}

		return rows;
	}

	/**
	 * Apply the exposed final Figure 1 display mapping to one linear channel.
	 *
	 * @param {number} value - Supplies a linear channel.
	 * @returns {number} Return the mapped channel.
	 */
	_mapLinearSrgbChannelToDisplay(value) {
		return ScalarMath.clamp(
			1 - Math.exp(
				-Math.max(0, value) * this._displayConstants.paperFigure1ToneMapK
			),
			0,
			1,
		);
	}

	/**
	 * Build the display constants GLSL block.
	 *
	 * @returns {string} Return GLSL source.
	 */
	_displayConstantsBlock() {
		const channelCount = NATIVE_15_SPECTRAL_BASIS.channelCount;

		return `const float DISPLAY_TONE_MAP_K = ${formatShaderFloat(this._displayConstants.paperFigure1ToneMapK)};
const float DISPLAY_LINEAR_SRGB_R_BY_CHANNEL[${channelCount}] = float[${channelCount}](${formatShaderFloatArray(this._displayLinearSrgbByChannel.r)});
const float DISPLAY_LINEAR_SRGB_G_BY_CHANNEL[${channelCount}] = float[${channelCount}](${formatShaderFloatArray(this._displayLinearSrgbByChannel.g)});
const float DISPLAY_LINEAR_SRGB_B_BY_CHANNEL[${channelCount}] = float[${channelCount}](${formatShaderFloatArray(this._displayLinearSrgbByChannel.b)});`;
	}

	/**
	 * Build the pinned Star captured-scene composition and projection block.
	 *
	 * @returns {string} Return GLSL source.
	 */
	_displayComposeBlock() {
		return `vec3 spectralRadianceToLinearSrgb(SpectralValue radiance) {
	vec3 linearSrgb = vec3(0.0);
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		linearSrgb.r += radiance.c[channelIndex] * DISPLAY_LINEAR_SRGB_R_BY_CHANNEL[channelIndex];
		linearSrgb.g += radiance.c[channelIndex] * DISPLAY_LINEAR_SRGB_G_BY_CHANNEL[channelIndex];
		linearSrgb.b += radiance.c[channelIndex] * DISPLAY_LINEAR_SRGB_B_BY_CHANNEL[channelIndex];
	}
	return linearSrgb;
}

vec3 spectralTransmittanceToRgbBands(SpectralValue transmittance) {
	float red = 0.0;
	for (int channelIndex = 8; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		red += transmittance.c[channelIndex];
	}
	float green = 0.0;
	for (int channelIndex = 4; channelIndex < 9; channelIndex += 1) {
		green += transmittance.c[channelIndex];
	}
	float blue = 0.0;
	for (int channelIndex = 0; channelIndex < 5; channelIndex += 1) {
		blue += transmittance.c[channelIndex];
	}
	return vec3(red / 7.0, green / 5.0, blue / 5.0);
}

vec3 displayRgbToLinearSrgb(vec3 displayRgb) {
	vec3 clamped = clamp(displayRgb, vec3(0.0), vec3(0.999999));
	return -log(vec3(1.0) - clamped) / DISPLAY_TONE_MAP_K;
}

float rendererLinearSrgbChannelToDisplayRgb(float value) {
	float clamped = clamp(value, 0.0, 1.0);
	if (clamped <= 0.0031308) {
		return clamped * 12.92;
	}
	return 1.055 * pow(clamped, 1.0 / 2.4) - 0.055;
}

vec3 rendererLinearSrgbToDisplayRgb(vec3 linearSrgb) {
	return vec3(
		rendererLinearSrgbChannelToDisplayRgb(linearSrgb.r),
		rendererLinearSrgbChannelToDisplayRgb(linearSrgb.g),
		rendererLinearSrgbChannelToDisplayRgb(linearSrgb.b)
	);
}

bool shouldApplySceneTransmittance(ShaderState state) {
	return state.bounds.hasSceneEndpoint
		&& state.bounds.endpointDistanceMeters <= state.bounds.endDistanceMeters + 0.001;
}

vec3 composeSceneLinearSrgb(ShaderState state) {
	vec3 pathLinearSrgb = spectralRadianceToLinearSrgb(state.pathRadiance);
	vec3 sceneDisplayRgb = rendererLinearSrgbToDisplayRgb(state.sceneDisplayRgb);
	vec3 sceneLinearSrgb = displayRgbToLinearSrgb(sceneDisplayRgb);
	vec3 transmittanceRgb = spectralTransmittanceToRgbBands(state.transmittance);
	vec3 sceneTransmittanceRgb = shouldApplySceneTransmittance(state) ? transmittanceRgb : vec3(1.0);
	return pathLinearSrgb + sceneLinearSrgb * sceneTransmittanceRgb;
}`;
	}

	/**
	 * Build the exposed display output mapping GLSL block.
	 *
	 * @returns {string} Return GLSL source.
	 */
	_displayEncodeBlock() {
		return `vec4 encodeDisplayOutput(vec3 linearSrgb) {
	vec3 mapped = clamp(
		vec3(1.0) - exp(-max(linearSrgb, vec3(0.0)) * DISPLAY_TONE_MAP_K),
		vec3(0.0),
		vec3(1.0)
	);
	return vec4(mapped, 1.0);
}`;
	}

	/**
	 * Describe the configured display conversion.
	 *
	 * @returns {DisplayConversionDescriptor} Return the display conversion descriptor.
	 */
	describeDisplayConversion() {
		return {
			conversionKind: this._displayConstants.conversionKind,
			outputColorSpace: this._displayConstants.outputColorSpace,
			toneMapping: 'paper-figure1-exponential',
			metadata: {
				cieObserver: 'CIE 1931 2-degree',
				cieTableResolution: { value: 1, units: 'nanometers' },
				spectralIntegration: 'native-15-bin-average-width-once',
				maxLuminousEfficacy: this._displayConstants.maxLuminousEfficacy,
				paperFigure1ToneMapK: this._displayConstants.paperFigure1ToneMapK,
				demoGammaPowerOmitted: this._displayConstants.demoGammaPowerOmitted,
				demoWhitePointOmitted: this._displayConstants.demoWhitePointOmitted,
			},
		};
	}

	/**
	 * Return a serializable Color descriptor for compatibility checks.
	 *
	 * @returns {ColorDescriptor} Return the configured color descriptor.
	 */
	describe() {
		const displayConversion = this.describeDisplayConversion();
		const body = /** @type {Omit<ColorDescriptor, 'fingerprint'>} */ ({
			kind: 'algorithm32-color',
			id: this.id,
			colorSpace: displayConversion.outputColorSpace,
			conversionKind: displayConversion.conversionKind,
			displayConversion,
		});

		return {
			...body,
			fingerprint: stableHash(body),
		};
	}

	/**
	 * Apply the accepted Figure 1 exponential display mapping.
	 *
	 * @param {readonly [number, number, number]} linearSrgb - Supplies linear sRGB values.
	 * @returns {readonly [number, number, number]} Return display values.
	 */
	linearSrgbToDisplayRgb(linearSrgb) {
		this._assertRgbTriplet(
			linearSrgb,
			'linearSrgbToDisplayRgb',
		);

		return [
			this._mapLinearSrgbChannelToDisplay(linearSrgb[0]),
			this._mapLinearSrgbChannelToDisplay(linearSrgb[1]),
			this._mapLinearSrgbChannelToDisplay(linearSrgb[2]),
		];
	}

	/**
	 * Apply the renderer-to-display transfer used by the pinned Star
	 * compositor before its Figure 1 inverse tone-map bridge.
	 *
	 * @param {readonly [number, number, number]} linearSrgb - Supplies renderer linear sRGB.
	 * @returns {readonly [number, number, number]} Return display-encoded RGB.
	 */
	rendererLinearSrgbToDisplayRgb(linearSrgb) {
		this._assertRgbTriplet(
			linearSrgb,
			'rendererLinearSrgbToDisplayRgb',
		);

		return [
			this._rendererLinearSrgbChannelToDisplayRgb(
				linearSrgb[0],
			),
			this._rendererLinearSrgbChannelToDisplayRgb(
				linearSrgb[1],
			),
			this._rendererLinearSrgbChannelToDisplayRgb(
				linearSrgb[2],
			),
		];
	}

	/**
	 * Invert the accepted Figure 1 exponential mapping for captured scene
	 * composition.
	 *
	 * @param {readonly [number, number, number]} displayRgb - Supplies display RGB.
	 * @returns {readonly [number, number, number]} Return the Star linear-sRGB proxy.
	 */
	displayRgbToLinearSrgb(displayRgb) {
		this._assertRgbTriplet(
			displayRgb,
			'displayRgbToLinearSrgb',
		);

		return [
			this._displayRgbChannelToLinearSrgb(displayRgb[0]),
			this._displayRgbChannelToLinearSrgb(displayRgb[1]),
			this._displayRgbChannelToLinearSrgb(displayRgb[2]),
		];
	}

	/**
	 * Collapse native spectral transmittance into Star's three display bands.
	 *
	 * @param {SpectralTransmittancePacket} transmittance - Supplies native transmittance.
	 * @returns {readonly [number, number, number]} Return red, green, and blue bands.
	 */
	spectralTransmittanceToRgbBands(transmittance) {
		const packet =
			this._acceptSpectralTransmittance(
				transmittance,
			);

		return [
			this._average(packet.values.slice(8)),
			this._average(packet.values.slice(4, 9)),
			this._average(packet.values.slice(0, 5)),
		];
	}

	/**
	 * Convert canonical spectral radiance to linear sRGB through E8.
	 *
	 * @param {SpectralRadiancePacket} radiance - Supplies native spectral radiance.
	 * @returns {readonly [number, number, number]} Return linear sRGB values.
	 */
	radianceToLinearSrgb(radiance) {
		const packet = this._acceptSpectralRadiance(radiance);

		return this._spectralRadianceValuesToLinearSrgb(packet.values);
	}

	/**
	 * Convert canonical spectral radiance through E8 and the display mapping.
	 *
	 * @param {SpectralRadiancePacket} radiance - Supplies native spectral radiance.
	 * @returns {readonly [number, number, number]} Return display values.
	 */
	radianceToDisplayRgb(radiance) {
		return this.linearSrgbToDisplayRgb(this.radianceToLinearSrgb(radiance));
	}

	/**
	 * Convert completed spectral radiance into display-facing channels.
	 *
	 * @param {ColorConversionRequest} request - Supplies completed radiance.
	 * @returns {ColorSample} Return converted display values.
	 */
	convert(request) {
		if (request === null || typeof request !== 'object' || Array.isArray(request)) {
			throw new TypeError('Color conversion request is required.');
		}

		return {
			channels: this.radianceToDisplayRgb(request.radiance),
			colorSpace: this._displayConstants.outputColorSpace,
		};
	}

	/**
	 * Compose spectral path radiance over captured scene RGB using the pinned
	 * Star display-boundary approximation.
	 *
	 * @param {SceneDisplayCompositionRequest} request - Supplies path and scene facts.
	 * @returns {readonly [number, number, number]} Return composed linear sRGB.
	 */
	composeSceneLinearSrgb(request) {
		if (request === null || typeof request !== 'object' || Array.isArray(request)) {
			throw new TypeError('Scene display composition request is required.');
		}

		const pathRadiance = this._acceptSpectralRadiance(
			request.pathRadiance,
		);
		const transmittance = this._acceptSpectralTransmittance(
			request.transmittance,
		);
		this._assertRgbTriplet(
			request.sceneDisplayRgb,
			'sceneDisplayRgb',
		);
		const pathLinearSrgb = this.radianceToLinearSrgb(pathRadiance);
		const sceneDisplayRgb = request.sceneColorSpace === 'linear-srgb'
			? this.rendererLinearSrgbToDisplayRgb(request.sceneDisplayRgb)
			: request.sceneDisplayRgb;
		const sceneLinearSrgb = this.displayRgbToLinearSrgb(sceneDisplayRgb);
		const transmittanceRgb =
			this.spectralTransmittanceToRgbBands(transmittance);
		const sceneTransmittanceRgb =
			request.applySceneTransmittance === false
				? [1, 1, 1]
				: transmittanceRgb;

		return [
			pathLinearSrgb[0]
				+ sceneLinearSrgb[0] * sceneTransmittanceRgb[0],
			pathLinearSrgb[1]
				+ sceneLinearSrgb[1] * sceneTransmittanceRgb[1],
			pathLinearSrgb[2]
				+ sceneLinearSrgb[2] * sceneTransmittanceRgb[2],
		];
	}

	/**
	 * Compose spectral path radiance over captured scene RGB and encode it
	 * through the accepted display adapter.
	 *
	 * @param {SceneDisplayCompositionRequest} request - Supplies path and scene facts.
	 * @returns {readonly [number, number, number]} Return composed display values.
	 */
	composeSceneDisplayRgb(request) {
		return this.linearSrgbToDisplayRgb(
			this.composeSceneLinearSrgb(request),
		);
	}

	/**
	 * Create the Color-owned spectral composition and display contribution.
	 *
	 * @param {ShaderContributionRequest} request - Supplies the active shader descriptor.
	 * @returns {ShaderContribution} Return the color contribution.
	 */
	createShaderContribution(request) {
		const descriptor = request.descriptor;

		return createShaderContribution({
			id: 'color-bruneton-figure1-display',
			owner: 'color',
			descriptorFingerprint: descriptor.color.fingerprint,
			compatibilityTags: descriptor.color.compatibilityTags,
			provides: [
				'color.composeSceneColor',
				'color.encodeOutput',
			],
			requires: [
				'runtime.initialState',
				'transport.evaluatePathRadiance',
			],
			functions: [
				createShaderSourceBlock(
					'color-display-constants',
					'declareConstants',
					0,
					this._displayConstantsBlock(),
				),
				createShaderSourceBlock(
					'color-compose-helper',
					'composeSceneColor',
					0,
					this._displayComposeBlock(),
				),
				createShaderSourceBlock(
					'color-encode-helper',
					'encodeOutput',
					0,
					this._displayEncodeBlock(),
				),
			],
			mainHooks: [
				createShaderSourceBlock(
					'color-main-compose',
					'composeSceneColor',
					0,
					'state.outputRgba = encodeDisplayOutput(composeSceneLinearSrgb(state));',
				),
				createShaderSourceBlock(
					'color-main-output',
					'encodeOutput',
					0,
					'outColor = state.outputRgba;',
				),
			],
			diagnostics: {
				mode: this.id,
				spectralChannelCount: NATIVE_15_SPECTRAL_BASIS.channelCount,
				sceneComposition:
					'star-captured-rgb-display-boundary',
				cieTableResolutionNanometers: 1,
			},
		});
	}
}
