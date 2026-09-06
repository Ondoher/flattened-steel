import {ShaderContributions} from '../controls/production-v1/src/algorithm32/shader-assembly/base/ShaderContributions.js';
import {ShaderSource} from '../controls/production-v1/src/algorithm32/shader-assembly/base/ShaderSource.js';
import {BrunetonColorDisplayModel} from '../controls/production-v1/src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {UnitMath} from '../controls/production-v1/src/algorithm32/spectral-values/index.js';

/** Stable identity of the CR4G soft-knee, slope-limited pre-tone response. */
export const CR4G_SLOPE_LIMITED_PRE_TONE_RESPONSE_ID =
	'color-reset-cr4g-slope-limited-total-horizontal-illuminance-pre-tone-gain-v1';

function requireFiniteRgb(value, label) {
	if ((!Array.isArray(value) && !ArrayBuffer.isView(value)) || value.length !== 3) {
		throw new RangeError(`${label} must contain exactly three values.`);
	}
	const copy = Array.from(value);
	if (!copy.every(Number.isFinite)) throw new TypeError(`${label} values must be finite.`);
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
		return (
			-(amplitude * power * inversePower * inverseRatio) / (transitionIlluminanceLux * (1 + inversePower) ** 2)
		);
	}
	return -(amplitude * power * ratio ** (power - 1)) / (transitionIlluminanceLux * (1 + ratio ** power) ** 2);
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

/**
 * One global scalar retains CR4C's qualified sunset term and replaces the
 * steep 1-lux cubic term with a finite soft-knee power-law adaptation. Its
 * deep-twilight logarithmic elasticity is bounded by the selected exponent.
 *
 * @implements {Color}
 */
export class Cr4gSlopeLimitedPreToneExposureColorDisplayModel extends BrunetonColorDisplayModel {
	/** @param {{curve: Cr4gSlopeLimitedCurve, displayConstants?: Figure1DisplayConstants}} configuration */
	constructor(configuration) {
		super(configuration);
		this._curve = this._acceptCurve(configuration?.curve);
	}

	/** @type {Readonly<Cr4gSlopeLimitedCurve>} */
	_curve;

	get id() {
		return `${CR4G_SLOPE_LIMITED_PRE_TONE_RESPONSE_ID}:${this._curve.id}`;
	}

	get curve() {
		return {...this._curve};
	}

	_acceptCurve(value) {
		if (!value || typeof value !== 'object' || Array.isArray(value)) {
			throw new TypeError('CR4G slope-limited curve must be an object.');
		}
		if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value.id ?? '')) {
			throw new TypeError('CR4G slope-limited curve id must be lowercase kebab case.');
		}
		if (!Number.isFinite(value.sunsetAmplitude) || value.sunsetAmplitude < 0) {
			throw new RangeError('CR4G sunsetAmplitude must be finite and nonnegative.');
		}
		for (const key of [
			'sunsetTransitionIlluminanceLux',
			'sunsetRolloffPower',
			'adaptationPivotIlluminanceLux',
			'adaptationFloorIlluminanceLux',
			'adaptationSoftnessLogUnits',
			'adaptationExponent',
		]) {
			if (!Number.isFinite(value[key]) || value[key] <= 0) {
				throw new RangeError(`CR4G ${key} must be positive and finite.`);
			}
		}
		if (value.sunsetRolloffPower <= 1) {
			throw new RangeError('CR4G sunsetRolloffPower must be greater than one.');
		}
		if (value.adaptationExponent >= 1) {
			throw new RangeError('CR4G adaptationExponent must remain below one.');
		}
		return Object.freeze({
			id: value.id,
			sunsetAmplitude: value.sunsetAmplitude,
			sunsetTransitionIlluminanceLux: value.sunsetTransitionIlluminanceLux,
			sunsetRolloffPower: value.sunsetRolloffPower,
			adaptationPivotIlluminanceLux: value.adaptationPivotIlluminanceLux,
			adaptationFloorIlluminanceLux: value.adaptationFloorIlluminanceLux,
			adaptationSoftnessLogUnits: value.adaptationSoftnessLogUnits,
			adaptationExponent: value.adaptationExponent,
		});
	}

	_acceptTotalHorizontalIlluminance(value) {
		UnitMath.assertUnitValue(value, 'totalHorizontalIlluminance');
		if (value.units !== 'lux') throw new TypeError('totalHorizontalIlluminance.units must be "lux".');
		if (value.value < 0) throw new RangeError('totalHorizontalIlluminance.value must be nonnegative.');
		return value.value;
	}

	_baseGain(illuminance) {
		return 1 + hillTerm(
			illuminance,
			this._curve.sunsetAmplitude,
			this._curve.sunsetTransitionIlluminanceLux,
			this._curve.sunsetRolloffPower,
		);
	}

	_baseGainDerivative(illuminance) {
		return hillTermDerivative(
			illuminance,
			this._curve.sunsetAmplitude,
			this._curve.sunsetTransitionIlluminanceLux,
			this._curve.sunsetRolloffPower,
		);
	}

	_adaptationState(illuminance) {
		const curve = this._curve;
		const logRatio = Math.log(
			curve.adaptationPivotIlluminanceLux /
				(illuminance + curve.adaptationFloorIlluminanceLux),
		);
		const softplusInput = logRatio / curve.adaptationSoftnessLogUnits;
		const softLogRatio = curve.adaptationSoftnessLogUnits * stableSoftplus(softplusInput);
		return {
			factor: Math.exp(curve.adaptationExponent * softLogRatio),
			activation: stableLogistic(softplusInput),
		};
	}

	/** Evaluate the CR4G slope-limited response. */
	displayGain(totalHorizontalIlluminance) {
		const illuminance = this._acceptTotalHorizontalIlluminance(totalHorizontalIlluminance);
		return this._baseGain(illuminance) * this._adaptationState(illuminance).factor;
	}

	/** Analytic derivative dg/dE in inverse lux. */
	displayGainDerivative(totalHorizontalIlluminance) {
		const illuminance = this._acceptTotalHorizontalIlluminance(totalHorizontalIlluminance);
		const curve = this._curve;
		const base = this._baseGain(illuminance);
		const baseDerivative = this._baseGainDerivative(illuminance);
		const adaptation = this._adaptationState(illuminance);
		const adaptationLogDerivative =
			-(curve.adaptationExponent * adaptation.activation) /
			(illuminance + curve.adaptationFloorIlluminanceLux);
		return adaptation.factor * (baseDerivative + base * adaptationLogDerivative);
	}

	displayGainLogElasticity(totalHorizontalIlluminance) {
		const illuminance = this._acceptTotalHorizontalIlluminance(totalHorizontalIlluminance);
		if (illuminance === 0) return 0;
		const gain = this.displayGain(totalHorizontalIlluminance);
		return (illuminance * this.displayGainDerivative(totalHorizontalIlluminance)) / gain;
	}

	applyPreToneGain(linearSrgb, totalHorizontalIlluminance) {
		const rgb = requireFiniteRgb(linearSrgb, 'CR4G projected linear RGB');
		const gain = this.displayGain(totalHorizontalIlluminance);
		return rgb.map((channel) => channel * gain);
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
		const curve = this._curve;
		return `const float CR4G_SUNSET_AMPLITUDE = ${ShaderSource.formatFloat(curve.sunsetAmplitude)};
const float CR4G_SUNSET_TRANSITION_ILLUMINANCE_LUX = ${ShaderSource.formatFloat(curve.sunsetTransitionIlluminanceLux)};
const float CR4G_SUNSET_ROLLOFF_POWER = ${ShaderSource.formatFloat(curve.sunsetRolloffPower)};
const float CR4G_ADAPTATION_PIVOT_ILLUMINANCE_LUX = ${ShaderSource.formatFloat(curve.adaptationPivotIlluminanceLux)};
const float CR4G_ADAPTATION_FLOOR_ILLUMINANCE_LUX = ${ShaderSource.formatFloat(curve.adaptationFloorIlluminanceLux)};
const float CR4G_ADAPTATION_SOFTNESS_LOG_UNITS = ${ShaderSource.formatFloat(curve.adaptationSoftnessLogUnits)};
const float CR4G_ADAPTATION_EXPONENT = ${ShaderSource.formatFloat(curve.adaptationExponent)};

float cr4gHillTerm(float illuminanceLux, float amplitude, float transitionLux, float power) {
	float ratio = max(illuminanceLux, 0.0) / transitionLux;
	return amplitude / (1.0 + pow(ratio, power));
}

float cr4gSoftplus(float value) {
	return max(value, 0.0) + log(1.0 + exp(-abs(value)));
}

float cr4gDisplayGain(float totalHorizontalIlluminanceLux) {
	float illuminanceLux = max(totalHorizontalIlluminanceLux, 0.0);
	float baseGain = 1.0 + cr4gHillTerm(
		illuminanceLux,
		CR4G_SUNSET_AMPLITUDE,
		CR4G_SUNSET_TRANSITION_ILLUMINANCE_LUX,
		CR4G_SUNSET_ROLLOFF_POWER
	);
	float logRatio = log(
		CR4G_ADAPTATION_PIVOT_ILLUMINANCE_LUX /
		(illuminanceLux + CR4G_ADAPTATION_FLOOR_ILLUMINANCE_LUX)
	);
	float softLogRatio = CR4G_ADAPTATION_SOFTNESS_LOG_UNITS * cr4gSoftplus(
		logRatio / CR4G_ADAPTATION_SOFTNESS_LOG_UNITS
	);
	return baseGain * exp(CR4G_ADAPTATION_EXPONENT * softLogRatio);
}

vec4 encodeDisplayOutput(vec3 linearSrgb) {
	vec3 exposedLinearSrgb = linearSrgb * cr4gDisplayGain(uCr4gTotalHorizontalIlluminanceLux);
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
			id: `color-cr4g-slope-limited-pre-tone-${this._curve.id}`,
			uniforms: [
				...contribution.uniforms,
				ShaderContributions.createShaderUniformDeclaration(
					'uCr4gTotalHorizontalIlluminanceLux',
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
				response: CR4G_SLOPE_LIMITED_PRE_TONE_RESPONSE_ID,
				condition: 'receiver-total-horizontal-illuminance-lux',
				operationOrdering: 'signed projected linear RGB gain before unchanged Bruneton exponential',
				curve: this.curve,
			},
		};
	}
}

/**
 * @typedef {object} Cr4gSlopeLimitedCurve
 * @property {string} id
 * @property {number} sunsetAmplitude
 * @property {number} sunsetTransitionIlluminanceLux
 * @property {number} sunsetRolloffPower
 * @property {number} adaptationPivotIlluminanceLux
 * @property {number} adaptationFloorIlluminanceLux
 * @property {number} adaptationSoftnessLogUnits
 * @property {number} adaptationExponent
 */
