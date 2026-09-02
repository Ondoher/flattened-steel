import {ShaderContributions} from '../../shader-assembly/base/ShaderContributions.js';
import {ShaderSource} from '../../shader-assembly/base/ShaderSource.js';
import {UnitMath} from '../../spectral-values/index.js';
import {BrunetonColorDisplayModel} from '../bruneton-color/BrunetonColorDisplayModel.js';
import {BRUNETON_SOURCE_LUMINANCE_LIFT_CURVE, BRUNETON_SOURCE_LUMINANCE_LIFT_POLICY_ID} from './consts.js';

/**
 * Bruneton Figure-1 Color followed by one condition-wide achromatic luminance lift.
 *
 * @implements {Color}
 */
export class BrunetonSourceLuminanceLiftColorDisplayModel extends BrunetonColorDisplayModel {
	/**
	 * Creates the selected source-luminance-driven Bruneton display model.
	 *
	 * @param {BrunetonSourceLuminanceLiftColorDisplayModelConfiguration} [configuration] - Optional display and curve constants.
	 */
	constructor(configuration = {}) {
		super(configuration);
		this._luminanceLiftCurve = this._acceptLuminanceLiftCurve(
			configuration.luminanceLiftCurve ?? BRUNETON_SOURCE_LUMINANCE_LIFT_CURVE,
		);
	}

	/** @type {AcceptedBrunetonSourceLuminanceLiftCurve} */
	_luminanceLiftCurve;

	/** Configured source-luminance lift identity. */
	get id() {
		return BRUNETON_SOURCE_LUMINANCE_LIFT_POLICY_ID;
	}

	/**
	 * Called by the Color model to validate one complete lift curve at its construction boundary.
	 *
	 * @param {BrunetonSourceLuminanceLiftCurve} curve - Candidate curve facts.
	 * @returns {AcceptedBrunetonSourceLuminanceLiftCurve} - Accepted finite curve.
	 */
	_acceptLuminanceLiftCurve(curve) {
		if (!Number.isFinite(curve.brightThreshold) || curve.brightThreshold <= 0) {
			throw new RangeError('Bruneton luminance-lift brightThreshold must be positive and finite.');
		}
		if (
			!Number.isFinite(curve.darkThreshold) ||
			curve.darkThreshold <= 0 ||
			curve.darkThreshold >= curve.brightThreshold
		) {
			throw new RangeError('Bruneton luminance-lift darkThreshold must be positive and below brightThreshold.');
		}
		if (!Number.isFinite(curve.minimumGamma) || curve.minimumGamma <= 0 || curve.minimumGamma > 1) {
			throw new RangeError('Bruneton luminance-lift minimumGamma must be in (0, 1].');
		}
		if (!Number.isFinite(curve.maximumLuminanceGain) || curve.maximumLuminanceGain < 1) {
			throw new RangeError('Bruneton luminance-lift maximumLuminanceGain must be at least one.');
		}

		return {
			brightThreshold: curve.brightThreshold,
			darkThreshold: curve.darkThreshold,
			minimumGamma: curve.minimumGamma,
			maximumLuminanceGain: curve.maximumLuminanceGain,
		};
	}

	/**
	 * Called by the Color model to accept the one atmosphere-transmitted direct-source luminance.
	 *
	 * @param {UnitValue<'cd m^-2'> | undefined} brightnessProxy - Optional source-derived luminance; semantic darkness when omitted.
	 * @returns {number} - Accepted luminance in candelas per square meter.
	 */
	_acceptBrightnessProxy(brightnessProxy) {
		if (brightnessProxy === undefined) return 0;
		UnitMath.assertUnitValue(brightnessProxy, 'brightnessProxy');
		if (brightnessProxy.units !== 'cd m^-2') {
			throw new TypeError('brightnessProxy.units must be "cd m^-2".');
		}
		if (brightnessProxy.value < 0) {
			throw new RangeError('brightnessProxy.value must be nonnegative.');
		}
		return brightnessProxy.value;
	}

	/**
	 * Called by the Color model to derive the selected smooth logarithmic Hermite gamma.
	 *
	 * @param {number} sourceLuminance - Accepted source luminance in candelas per square meter.
	 * @returns {number} - Achromatic luminance gamma.
	 */
	_deriveGamma(sourceLuminance) {
		const {brightThreshold, darkThreshold, minimumGamma} = this._luminanceLiftCurve;
		if (sourceLuminance >= brightThreshold) return 1;
		if (sourceLuminance <= darkThreshold) return minimumGamma;
		const position =
			(Math.log(brightThreshold) - Math.log(sourceLuminance)) /
			(Math.log(brightThreshold) - Math.log(darkThreshold));
		const smoothPosition = position * position * (3 - 2 * position);
		return Math.exp(Math.log(minimumGamma) * smoothPosition);
	}

	/**
	 * Called by the Color model to apply one common capped luminance gain to Bruneton RGB.
	 *
	 * @param {readonly [number, number, number]} brunetonRgb - Figure-1 display RGB.
	 * @param {number} sourceLuminance - Accepted source luminance in candelas per square meter.
	 * @returns {readonly [number, number, number]} - Chroma-preserving lifted RGB.
	 */
	_liftDisplayRgb(brunetonRgb, sourceLuminance) {
		const luminance = brunetonRgb[0] * 0.2126 + brunetonRgb[1] * 0.7152 + brunetonRgb[2] * 0.0722;
		if (luminance <= 0) return [0, 0, 0];
		const gamma = this._deriveGamma(sourceLuminance);
		const powerGain = luminance ** (gamma - 1);
		const gain = Math.min(powerGain, this._luminanceLiftCurve.maximumLuminanceGain);
		return [
			Math.max(0, Math.min(1, brunetonRgb[0] * gain)),
			Math.max(0, Math.min(1, brunetonRgb[1] * gain)),
			Math.max(0, Math.min(1, brunetonRgb[2] * gain)),
		];
	}

	/**
	 * Call this method to map linear sRGB through Bruneton and the selected global luminance lift.
	 *
	 * @param {readonly [number, number, number]} linearSrgb - Composed scene-linear RGB.
	 * @param {UnitValue<'cd m^-2'>} [brightnessProxy] - Atmosphere-transmitted direct-source luminance.
	 * @returns {readonly [number, number, number]} - Lifted display RGB.
	 */
	linearSrgbToDisplayRgb(linearSrgb, brightnessProxy) {
		return this._liftDisplayRgb(
			super.linearSrgbToDisplayRgb(linearSrgb),
			this._acceptBrightnessProxy(brightnessProxy),
		);
	}

	/**
	 * Call this method to convert completed spectral radiance through the selected Color boundary.
	 *
	 * @param {ColorConversionRequest} request - Completed spectral radiance and source luminance.
	 * @returns {ColorSample} - Lifted display color.
	 */
	convert(request) {
		return {
			channels: this.linearSrgbToDisplayRgb(this.radianceToLinearSrgb(request.radiance), request.brightnessProxy),
			colorSpace: this.displayConstants.outputColorSpace,
		};
	}

	/**
	 * Call this method to compose the captured scene and atmosphere before applying the selected lift.
	 *
	 * @param {SceneDisplayCompositionRequest} request - Scene composition and source luminance.
	 * @returns {readonly [number, number, number]} - Lifted display RGB.
	 */
	composeSceneDisplayRgb(request) {
		return this.linearSrgbToDisplayRgb(super.composeSceneLinearSrgb(request), request.brightnessProxy);
	}

	/**
	 * Called by the Bruneton contribution to build the dynamic source-luminance lift GLSL block.
	 *
	 * @returns {string} - Complete display-encoding shader source.
	 */
	_displayEncodeBlock() {
		const curve = this._luminanceLiftCurve;
		return `const float SOURCE_LUMINANCE_BRIGHT_THRESHOLD = ${ShaderSource.formatFloat(curve.brightThreshold)};
const float SOURCE_LUMINANCE_DARK_THRESHOLD = ${ShaderSource.formatFloat(curve.darkThreshold)};
const float SOURCE_LUMINANCE_MINIMUM_GAMMA = ${ShaderSource.formatFloat(curve.minimumGamma)};
const float SOURCE_LUMINANCE_MAXIMUM_GAIN = ${ShaderSource.formatFloat(curve.maximumLuminanceGain)};

float deriveSourceLuminanceGamma(float sourceLuminance) {
	if (sourceLuminance >= SOURCE_LUMINANCE_BRIGHT_THRESHOLD) return 1.0;
	if (sourceLuminance <= SOURCE_LUMINANCE_DARK_THRESHOLD) return SOURCE_LUMINANCE_MINIMUM_GAMMA;
	float position = (log(SOURCE_LUMINANCE_BRIGHT_THRESHOLD) - log(sourceLuminance))
		/ (log(SOURCE_LUMINANCE_BRIGHT_THRESHOLD) - log(SOURCE_LUMINANCE_DARK_THRESHOLD));
	float smoothPosition = position * position * (3.0 - 2.0 * position);
	return exp(log(SOURCE_LUMINANCE_MINIMUM_GAMMA) * smoothPosition);
}

vec4 encodeDisplayOutput(vec3 linearSrgb) {
	vec3 bruneton = clamp(vec3(1.0) - exp(-max(linearSrgb, vec3(0.0)) * DISPLAY_TONE_MAP_K), vec3(0.0), vec3(1.0));
	float luminance = dot(bruneton, vec3(0.2126, 0.7152, 0.0722));
	if (luminance <= 0.0) return vec4(0.0, 0.0, 0.0, 1.0);
	float gamma = deriveSourceLuminanceGamma(max(uBrunetonSourceLuminance, 0.0));
	float powerGain = pow(luminance, gamma - 1.0);
	float gain = min(powerGain, SOURCE_LUMINANCE_MAXIMUM_GAIN);
	return vec4(clamp(bruneton * gain, vec3(0.0), vec3(1.0)), 1.0);
}`;
	}

	/**
	 * Call this method to contribute the selected Color mapping and its condition-wide luminance binding.
	 *
	 * @param {ShaderContributionRequest} request - Active shader build facts.
	 * @returns {ShaderContribution} - Bruneton composition plus the luminance-lift binding.
	 */
	createShaderContribution(request) {
		const contribution = super.createShaderContribution(request);
		return {
			...contribution,
			id: 'color-bruneton-source-luminance-lift',
			uniforms: [
				...contribution.uniforms,
				ShaderContributions.createShaderUniformDeclaration(
					'uBrunetonSourceLuminance',
					'float',
					'color.brightnessProxy',
					0,
				),
			],
			bindingRequirements: [
				...contribution.bindingRequirements,
				ShaderContributions.createShaderBindingRequirement(
					'color.source-derived-luminance',
					'color',
					'uniform',
					'frame',
					'color.brightnessProxy',
					false,
				),
			],
			diagnostics: {
				.../** @type {Record<string, unknown> | null} */ (contribution.diagnostics ?? {}),
				mode: this.id,
				response: 'bruneton-then-capped-achromatic-luminance-lift',
				condition: 'atmosphere-transmitted-direct-source-luminance',
				luminanceLiftCurve: {...this._luminanceLiftCurve},
			},
		};
	}
}
