import {ShaderContributions} from '../../shader-assembly/base/ShaderContributions.js';
import {ShaderSource} from '../../shader-assembly/base/ShaderSource.js';
import {UnitMath} from '../../spectral-values/index.js';
import {BrunetonColorDisplayModel} from '../bruneton-color/BrunetonColorDisplayModel.js';
import {COLOR_RESET_SLOPE_078_P9_CURVE, COLOR_RESET_SLOPE_078_P9_ID} from './consts.js';

function requireFiniteRgb(value) {
	if (!Array.isArray(value) || value.length !== 3) {
		throw new RangeError('Color Reset projected linear RGB must contain exactly three values.');
	}
	const copy = /** @type {readonly [number, number, number]} */ ([value[0], value[1], value[2]]);
	if (!copy.every(Number.isFinite)) throw new TypeError('Color Reset projected linear RGB values must be finite.');
	return copy;
}

function hillTerm(illuminance, amplitude, transitionIlluminanceLux, power) {
	const ratio = illuminance / transitionIlluminanceLux;
	if (!Number.isFinite(ratio)) return 0;
	if (ratio > 1) {
		const inversePower = (1 / ratio) ** power;
		return (amplitude * inversePower) / (1 + inversePower);
	}
	return amplitude / (1 + ratio ** power);
}

function hillTermDerivative(illuminance, amplitude, transitionIlluminanceLux, power) {
	if (illuminance === 0) return 0;
	const ratio = illuminance / transitionIlluminanceLux;
	if (!Number.isFinite(ratio)) return 0;
	if (ratio > 1) {
		const inverseRatio = 1 / ratio;
		const inversePower = inverseRatio ** power;
		return -(amplitude * power * inversePower * inverseRatio) /
			(transitionIlluminanceLux * (1 + inversePower) ** 2);
	}
	return -(amplitude * power * ratio ** (power - 1)) /
		(transitionIlluminanceLux * (1 + ratio ** power) ** 2);
}

function stableSoftplus(value) {
	return Math.max(value, 0) + Math.log1p(Math.exp(-Math.abs(value)));
}

function stableLogistic(value) {
	if (value >= 0) {
		const inverse = Math.exp(-value);
		return 1 / (1 + inverse);
	}
	const direct = Math.exp(value);
	return direct / (1 + direct);
}

/** Fixed slope-078/p9 gain before the unchanged Bruneton display encoding. */
export class ColorResetSlope078P9ColorDisplayModel extends BrunetonColorDisplayModel {
	get id() {
		return COLOR_RESET_SLOPE_078_P9_ID;
	}

	get curve() {
		return {...COLOR_RESET_SLOPE_078_P9_CURVE};
	}

	_acceptTotalHorizontalIlluminance(value) {
		UnitMath.assertUnitValue(value, 'totalHorizontalIlluminance');
		if (value.units !== 'lux') throw new TypeError('totalHorizontalIlluminance.units must be "lux".');
		if (value.value < 0) throw new RangeError('totalHorizontalIlluminance.value must be nonnegative.');
		return value.value;
	}

	_baseGain(illuminance) {
		const curve = COLOR_RESET_SLOPE_078_P9_CURVE;
		return 1 + hillTerm(
			illuminance,
			curve.sunsetAmplitude,
			curve.sunsetTransitionIlluminanceLux,
			curve.sunsetRolloffPower,
		);
	}

	_baseGainDerivative(illuminance) {
		const curve = COLOR_RESET_SLOPE_078_P9_CURVE;
		return hillTermDerivative(
			illuminance,
			curve.sunsetAmplitude,
			curve.sunsetTransitionIlluminanceLux,
			curve.sunsetRolloffPower,
		);
	}

	_adaptationState(illuminance) {
		const curve = COLOR_RESET_SLOPE_078_P9_CURVE;
		const logRatio = Math.log(curve.adaptationPivotIlluminanceLux /
			(illuminance + curve.adaptationFloorIlluminanceLux));
		const input = logRatio / curve.adaptationSoftnessLogUnits;
		const softLogRatio = curve.adaptationSoftnessLogUnits * stableSoftplus(input);
		return {
			factor: Math.exp(curve.adaptationExponent * softLogRatio),
			activation: stableLogistic(input),
		};
	}

	displayGain(totalHorizontalIlluminance) {
		const illuminance = this._acceptTotalHorizontalIlluminance(totalHorizontalIlluminance);
		return this._baseGain(illuminance) * this._adaptationState(illuminance).factor;
	}

	displayGainDerivative(totalHorizontalIlluminance) {
		const illuminance = this._acceptTotalHorizontalIlluminance(totalHorizontalIlluminance);
		const curve = COLOR_RESET_SLOPE_078_P9_CURVE;
		const base = this._baseGain(illuminance);
		const adaptation = this._adaptationState(illuminance);
		const adaptationLogDerivative = -(curve.adaptationExponent * adaptation.activation) /
			(illuminance + curve.adaptationFloorIlluminanceLux);
		return adaptation.factor * (this._baseGainDerivative(illuminance) + base * adaptationLogDerivative);
	}

	displayGainLogElasticity(totalHorizontalIlluminance) {
		const illuminance = this._acceptTotalHorizontalIlluminance(totalHorizontalIlluminance);
		if (illuminance === 0) return 0;
		return illuminance * this.displayGainDerivative(totalHorizontalIlluminance) /
			this.displayGain(totalHorizontalIlluminance);
	}

	applyPreToneGain(linearSrgb, totalHorizontalIlluminance) {
		const gain = this.displayGain(totalHorizontalIlluminance);
		const rgb = requireFiniteRgb(linearSrgb);
		return /** @type {readonly [number, number, number]} */ ([
			rgb[0] * gain,
			rgb[1] * gain,
			rgb[2] * gain,
		]);
	}

	linearSrgbToDisplayRgb(linearSrgb, totalHorizontalIlluminance) {
		return super.linearSrgbToDisplayRgb(this.applyPreToneGain(linearSrgb, totalHorizontalIlluminance));
	}

	radianceToDisplayRgb(radiance, totalHorizontalIlluminance) {
		return this.linearSrgbToDisplayRgb(this.radianceToLinearSrgb(radiance), totalHorizontalIlluminance);
	}

	convert(request) {
		return {
			channels: this.radianceToDisplayRgb(request.radiance, request.totalHorizontalIlluminance),
			colorSpace: this.displayConstants.outputColorSpace,
		};
	}

	composeSceneDisplayRgb(request) {
		return this.linearSrgbToDisplayRgb(super.composeSceneLinearSrgb(request), request.totalHorizontalIlluminance);
	}

	_displayEncodeBlock() {
		const curve = COLOR_RESET_SLOPE_078_P9_CURVE;
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

	createShaderContribution(request) {
		const contribution = super.createShaderContribution(request);
		return {
			...contribution,
			id: 'color-reset-slope-078-p9-display',
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
				response: COLOR_RESET_SLOPE_078_P9_ID,
				condition: 'receiver-total-horizontal-illuminance-lux',
				operationOrdering: 'signed projected linear RGB gain before unchanged Bruneton exponential',
				curve: this.curve,
			},
		};
	}
}
