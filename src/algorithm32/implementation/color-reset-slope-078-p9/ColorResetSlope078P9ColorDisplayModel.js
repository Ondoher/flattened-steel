import {ShaderContributions} from '../../shader-assembly/base/ShaderContributions.js';
import {ShaderSource} from '../../shader-assembly/base/ShaderSource.js';
import {UnitMath} from '../../spectral-values/index.js';
import {BrunetonColorDisplayModel} from '../bruneton-color/BrunetonColorDisplayModel.js';
import {COLOR_RESET_SLOPE_078_P9_CURVE, COLOR_RESET_SLOPE_078_P9_ID} from './consts.js';

/** Fixed slope-078/p9 gain before the unchanged Bruneton display encoding. */
export class ColorResetSlope078P9ColorDisplayModel extends BrunetonColorDisplayModel {
	/**
	 * Called by the gain operation to accept signed projected RGB. Throws for malformed or nonfinite channels.
	 *
	 * @param {unknown} value - Caller-owned RGB candidate.
	 * @returns {readonly [number, number, number]} - Accepted signed channels.
	 */
	_requireFiniteRgb(value) {
		if (!Array.isArray(value) || value.length !== 3) {
			throw new RangeError('Color Reset projected linear RGB must contain exactly three values.');
		}
		const copy = /** @type {readonly [number, number, number]} */ ([value[0], value[1], value[2]]);
		if (!copy.every(Number.isFinite))
			throw new TypeError('Color Reset projected linear RGB values must be finite.');
		return copy;
	}

	/**
	 * Called by the base gain to evaluate its bounded sunset contribution.
	 *
	 * @param {number} illuminance - Nonnegative receiver illuminance in lux.
	 * @param {number} amplitude - Sunset gain amplitude.
	 * @param {number} transitionIlluminanceLux - Transition illuminance in lux.
	 * @param {number} power - Rolloff exponent.
	 * @returns {number} - Sunset gain contribution.
	 */
	_hillTerm(illuminance, amplitude, transitionIlluminanceLux, power) {
		const ratio = illuminance / transitionIlluminanceLux;
		if (!Number.isFinite(ratio)) return 0;
		if (ratio > 1) {
			const inversePower = (1 / ratio) ** power;
			return (amplitude * inversePower) / (1 + inversePower);
		}
		return amplitude / (1 + ratio ** power);
	}

	/**
	 * Called by the derivative to evaluate the sunset slope.
	 *
	 * @param {number} illuminance - Nonnegative receiver illuminance in lux.
	 * @param {number} amplitude - Sunset gain amplitude.
	 * @param {number} transitionIlluminanceLux - Transition illuminance in lux.
	 * @param {number} power - Rolloff exponent.
	 * @returns {number} - Gain slope per lux.
	 */
	_hillTermDerivative(illuminance, amplitude, transitionIlluminanceLux, power) {
		if (illuminance === 0) return 0;
		const ratio = illuminance / transitionIlluminanceLux;
		if (!Number.isFinite(ratio)) return 0;
		if (ratio > 1) {
			const inverseRatio = 1 / ratio;
			const inversePower = inverseRatio ** power;
			return (
				-(amplitude * power * inversePower * inverseRatio) /
				(transitionIlluminanceLux * (1 + inversePower) ** 2)
			);
		}
		return -(amplitude * power * ratio ** (power - 1)) / (transitionIlluminanceLux * (1 + ratio ** power) ** 2);
	}

	/**
	 * Called by adaptation to evaluate softplus without exponential overflow.
	 *
	 * @param {number} value - Finite logarithmic input.
	 * @returns {number} - Soft logarithmic activation.
	 */
	_stableSoftplus(value) {
		return Math.max(value, 0) + Math.log1p(Math.exp(-Math.abs(value)));
	}

	/**
	 * Called by adaptation to evaluate the logistic activation without overflow.
	 *
	 * @param {number} value - Finite logarithmic input.
	 * @returns {number} - Activation fraction.
	 */
	_stableLogistic(value) {
		if (value >= 0) {
			const inverse = Math.exp(-value);
			return 1 / (1 + inverse);
		}
		const direct = Math.exp(value);
		return direct / (1 + direct);
	}

	/**
	 * Stable identity of the selected versioned response.
	 *
	 * @returns {string} - Model identity.
	 */
	get id() {
		return COLOR_RESET_SLOPE_078_P9_ID;
	}

	/**
	 * Selected response constants, returned as a caller-owned copy.
	 *
	 * @returns {ColorResetSlope078Curve} - Response constants.
	 */
	get curve() {
		return {...COLOR_RESET_SLOPE_078_P9_CURVE};
	}

	/**
	 * Called by the gain operations to accept receiver illuminance. Throws for nonfinite, negative or non-lux values.
	 *
	 * @param {UnitValue<'lux'>} value - Receiver total-horizontal illuminance.
	 * @returns {number} - Accepted illuminance in lux.
	 */
	_acceptTotalHorizontalIlluminance(value) {
		UnitMath.assertUnitValue(value, 'totalHorizontalIlluminance');
		if (value.units !== 'lux') throw new TypeError('totalHorizontalIlluminance.units must be "lux".');
		if (value.value < 0) throw new RangeError('totalHorizontalIlluminance.value must be nonnegative.');
		return value.value;
	}

	/**
	 * Called by the gain operations to evaluate the sunset response.
	 *
	 * @param {number} illuminance - Accepted illuminance in lux.
	 * @returns {number} - Base gain.
	 */
	_baseGain(illuminance) {
		const curve = this.curve;
		return (
			1 +
			this._hillTerm(
				illuminance,
				curve.sunsetAmplitude,
				curve.sunsetTransitionIlluminanceLux,
				curve.sunsetRolloffPower,
			)
		);
	}

	/**
	 * Called by the derivative to evaluate the base response slope.
	 *
	 * @param {number} illuminance - Accepted illuminance in lux.
	 * @returns {number} - Base gain slope per lux.
	 */
	_baseGainDerivative(illuminance) {
		const curve = this.curve;
		return this._hillTermDerivative(
			illuminance,
			curve.sunsetAmplitude,
			curve.sunsetTransitionIlluminanceLux,
			curve.sunsetRolloffPower,
		);
	}

	/**
	 * Called by the gain operations to evaluate adaptation and its activation.
	 *
	 * @param {number} illuminance - Accepted illuminance in lux.
	 * @returns {ColorResetSlope078AdaptationState} - Internal adaptation state.
	 */
	_adaptationState(illuminance) {
		const curve = this.curve;
		const logRatio = Math.log(
			curve.adaptationPivotIlluminanceLux / (illuminance + curve.adaptationFloorIlluminanceLux),
		);
		const input = logRatio / curve.adaptationSoftnessLogUnits;
		const softLogRatio = curve.adaptationSoftnessLogUnits * this._stableSoftplus(input);
		return {
			factor: Math.exp(curve.adaptationExponent * softLogRatio),
			activation: this._stableLogistic(input),
		};
	}

	/**
	 * Call this method to evaluate the achromatic pre-tone gain. Invalid receiver illuminance throws.
	 *
	 * @param {UnitValue<'lux'>} totalHorizontalIlluminance - Receiver total-horizontal illuminance.
	 * @returns {number} - Finite display gain.
	 */
	displayGain(totalHorizontalIlluminance) {
		const illuminance = this._acceptTotalHorizontalIlluminance(totalHorizontalIlluminance);
		return this._baseGain(illuminance) * this._adaptationState(illuminance).factor;
	}

	/**
	 * Call this method to evaluate the pre-tone gain slope. Invalid receiver illuminance throws.
	 *
	 * @param {UnitValue<'lux'>} totalHorizontalIlluminance - Receiver total-horizontal illuminance.
	 * @returns {number} - Gain slope per lux.
	 */
	displayGainDerivative(totalHorizontalIlluminance) {
		const illuminance = this._acceptTotalHorizontalIlluminance(totalHorizontalIlluminance);
		const curve = this.curve;
		const base = this._baseGain(illuminance);
		const adaptation = this._adaptationState(illuminance);
		const adaptationLogDerivative =
			-(curve.adaptationExponent * adaptation.activation) / (illuminance + curve.adaptationFloorIlluminanceLux);
		return adaptation.factor * (this._baseGainDerivative(illuminance) + base * adaptationLogDerivative);
	}

	/**
	 * Call this method to evaluate the logarithmic gain slope. Invalid receiver illuminance throws.
	 *
	 * @param {UnitValue<'lux'>} totalHorizontalIlluminance - Receiver total-horizontal illuminance.
	 * @returns {number} - Dimensionless gain elasticity.
	 */
	displayGainLogElasticity(totalHorizontalIlluminance) {
		const illuminance = this._acceptTotalHorizontalIlluminance(totalHorizontalIlluminance);
		if (illuminance === 0) return 0;
		return (
			(illuminance * this.displayGainDerivative(totalHorizontalIlluminance)) /
			this.displayGain(totalHorizontalIlluminance)
		);
	}

	/**
	 * Call this method to apply gain to signed linear RGB before display encoding. Invalid RGB or illuminance throws.
	 *
	 * @param {readonly [number, number, number]} linearSrgb - Signed projected linear RGB.
	 * @param {UnitValue<'lux'>} totalHorizontalIlluminance - Receiver total-horizontal illuminance.
	 * @returns {readonly [number, number, number]} - Gain-scaled signed RGB.
	 */
	applyPreToneGain(linearSrgb, totalHorizontalIlluminance) {
		const gain = this.displayGain(totalHorizontalIlluminance);
		const rgb = this._requireFiniteRgb(linearSrgb);
		return /** @type {readonly [number, number, number]} */ ([rgb[0] * gain, rgb[1] * gain, rgb[2] * gain]);
	}

	/**
	 * Call this method to apply gain followed by the unchanged Bruneton encoding. Receiver illuminance is required for this response.
	 *
	 * @param {readonly [number, number, number]} linearSrgb - Signed projected linear RGB.
	 * @param {UnitValue<'lux'>} [totalHorizontalIlluminance] - Receiver total-horizontal illuminance; omission throws.
	 * @returns {readonly [number, number, number]} - Display-encoded RGB.
	 */
	linearSrgbToDisplayRgb(linearSrgb, totalHorizontalIlluminance) {
		return super.linearSrgbToDisplayRgb(this.applyPreToneGain(linearSrgb, totalHorizontalIlluminance));
	}

	/**
	 * Call this method to project spectral radiance and apply the selected display response.
	 *
	 * @param {SpectralRadiancePacket} radiance - Completed spectral radiance.
	 * @param {UnitValue<'lux'>} [totalHorizontalIlluminance] - Receiver total-horizontal illuminance; omission throws.
	 * @returns {readonly [number, number, number]} - Display-encoded RGB.
	 */
	radianceToDisplayRgb(radiance, totalHorizontalIlluminance) {
		return this.linearSrgbToDisplayRgb(this.radianceToLinearSrgb(radiance), totalHorizontalIlluminance);
	}

	/**
	 * Call this method to convert completed radiance with receiver illuminance. Missing illuminance throws.
	 *
	 * @param {ColorConversionRequest} request - Radiance and receiver display context.
	 * @returns {ColorSample} - Converted display color.
	 */
	convert(request) {
		return {
			channels: this.radianceToDisplayRgb(request.radiance, request.totalHorizontalIlluminance),
			colorSpace: this.displayConstants.outputColorSpace,
		};
	}

	/**
	 * Call this method to compose the physical scene and path before the final selected display mapping. Missing illuminance throws.
	 *
	 * @param {SceneDisplayCompositionRequest} request - Captured scene and completed physical path.
	 * @returns {readonly [number, number, number]} - Composed display RGB.
	 */
	composeSceneDisplayRgb(request) {
		return this.linearSrgbToDisplayRgb(super.composeSceneLinearSrgb(request), request.totalHorizontalIlluminance);
	}

	/**
	 * Called by shader assembly to emit the selected gain and unchanged final encoding.
	 *
	 * @returns {string} - GLSL display functions.
	 */
	_displayEncodeBlock() {
		const curve = this.curve;
		return `const float COLOR_RESET_SUNSET_AMPLITUDE = ${ShaderSource.formatFloat(curve.sunsetAmplitude)};
const float COLOR_RESET_SUNSET_TRANSITION_ILLUMINANCE_LUX = ${ShaderSource.formatFloat(curve.sunsetTransitionIlluminanceLux)};
const float COLOR_RESET_SUNSET_ROLLOFF_POWER = ${ShaderSource.formatFloat(curve.sunsetRolloffPower)};
const float COLOR_RESET_ADAPTATION_PIVOT_ILLUMINANCE_LUX = ${ShaderSource.formatFloat(curve.adaptationPivotIlluminanceLux)};
const float COLOR_RESET_ADAPTATION_FLOOR_ILLUMINANCE_LUX = ${ShaderSource.formatFloat(curve.adaptationFloorIlluminanceLux)};
const float COLOR_RESET_ADAPTATION_SOFTNESS_LOG_UNITS = ${ShaderSource.formatFloat(curve.adaptationSoftnessLogUnits)};
const float COLOR_RESET_ADAPTATION_EXPONENT = ${ShaderSource.formatFloat(curve.adaptationExponent)};

float colorResetHillTerm(float illuminanceLux) {
	float ratio = max(illuminanceLux, 0.0) / COLOR_RESET_SUNSET_TRANSITION_ILLUMINANCE_LUX;
	return COLOR_RESET_SUNSET_AMPLITUDE / (1.0 + pow(ratio, COLOR_RESET_SUNSET_ROLLOFF_POWER));
}

float colorResetSoftplus(float value) {
	return max(value, 0.0) + log(1.0 + exp(-abs(value)));
}

float colorResetDisplayGain(float totalHorizontalIlluminanceLux) {
	float illuminanceLux = max(totalHorizontalIlluminanceLux, 0.0);
	float baseGain = 1.0 + colorResetHillTerm(illuminanceLux);
	float logRatio = log(COLOR_RESET_ADAPTATION_PIVOT_ILLUMINANCE_LUX /
		(illuminanceLux + COLOR_RESET_ADAPTATION_FLOOR_ILLUMINANCE_LUX));
	float softLogRatio = COLOR_RESET_ADAPTATION_SOFTNESS_LOG_UNITS * colorResetSoftplus(
		logRatio / COLOR_RESET_ADAPTATION_SOFTNESS_LOG_UNITS
	);
	return baseGain * exp(COLOR_RESET_ADAPTATION_EXPONENT * softLogRatio);
}

vec4 encodeDisplayOutput(vec3 linearSrgb) {
	vec3 exposedLinearSrgb = linearSrgb * colorResetDisplayGain(uColorResetTotalHorizontalIlluminanceLux);
	return vec4(clamp(
		vec3(1.0) - exp(-max(exposedLinearSrgb, vec3(0.0)) * DISPLAY_TONE_MAP_K),
		vec3(0.0),
		vec3(1.0)
	), 1.0);
}`;
	}

	/**
	 * Call this method to contribute the selected response and physical receiver-lux binding.
	 *
	 * @param {ShaderContributionRequest} request - Accepted shader build facts.
	 * @returns {ShaderContribution} - Versioned display contribution.
	 */
	createShaderContribution(request) {
		const contribution = super.createShaderContribution(request);
		return {
			...contribution,
			id: `${this.id}-display`,
			uniforms: [
				...contribution.uniforms,
				ShaderContributions.createShaderUniformDeclaration(
					'uColorResetTotalHorizontalIlluminanceLux',
					'float',
					'color.totalHorizontalIlluminance.value',
				),
			],
			bindingRequirements: [
				...contribution.bindingRequirements,
				ShaderContributions.createShaderBindingRequirement(
					'color.receiver-total-horizontal-illuminance',
					'color',
					'uniform',
					'frame',
					'color.totalHorizontalIlluminance.value',
					true,
				),
			],
			diagnostics: {
				.../** @type {Record<string, unknown>} */ (contribution.diagnostics ?? {}),
				mode: this.id,
				response: this.id,
				condition: 'receiver-total-horizontal-illuminance-lux',
				operationOrdering: 'signed projected linear RGB gain before unchanged Bruneton exponential',
				curve: this.curve,
			},
		};
	}
}
