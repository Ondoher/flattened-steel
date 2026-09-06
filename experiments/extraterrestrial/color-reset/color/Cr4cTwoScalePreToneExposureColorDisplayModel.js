import {ShaderContributions} from '../controls/production-v1/src/algorithm32/shader-assembly/base/ShaderContributions.js';
import {ShaderSource} from '../controls/production-v1/src/algorithm32/shader-assembly/base/ShaderSource.js';
import {BrunetonColorDisplayModel} from '../controls/production-v1/src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {UnitMath} from '../controls/production-v1/src/algorithm32/spectral-values/index.js';

/** Stable identity of the bounded CR4C two-scale pre-tone response. */
export const CR4C_TWO_SCALE_PRE_TONE_RESPONSE_ID =
	'color-reset-cr4c-two-scale-total-horizontal-illuminance-pre-tone-gain-v1';

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

/**
 * One smooth receiver-light-driven scalar multiplies signed projected linear
 * RGB before the unchanged Bruneton exponential. The two Hill terms provide
 * separate sunset and deep-nautical light scales without a scene branch.
 *
 * @implements {Color}
 */
export class Cr4cTwoScalePreToneExposureColorDisplayModel extends BrunetonColorDisplayModel {
	/** @param {{curve: Cr4cTwoScaleCurve, displayConstants?: Figure1DisplayConstants}} configuration */
	constructor(configuration) {
		super(configuration);
		this._curve = this._acceptCurve(configuration?.curve);
	}

	/** @type {Readonly<Cr4cTwoScaleCurve>} */
	_curve;

	get id() {
		return `${CR4C_TWO_SCALE_PRE_TONE_RESPONSE_ID}:${this._curve.id}`;
	}

	get curve() {
		return {...this._curve};
	}

	_acceptCurve(value) {
		if (!value || typeof value !== 'object' || Array.isArray(value)) {
			throw new TypeError('CR4C two-scale curve must be an object.');
		}
		if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value.id ?? '')) {
			throw new TypeError('CR4C two-scale curve id must be lowercase kebab case.');
		}
		for (const key of ['sunsetAmplitude', 'nauticalAmplitude']) {
			if (!Number.isFinite(value[key]) || value[key] < 0) {
				throw new RangeError(`CR4C ${key} must be finite and nonnegative.`);
			}
		}
		for (const key of ['sunsetTransitionIlluminanceLux', 'nauticalTransitionIlluminanceLux']) {
			if (!Number.isFinite(value[key]) || value[key] <= 0) {
				throw new RangeError(`CR4C ${key} must be positive and finite.`);
			}
		}
		for (const key of ['sunsetRolloffPower', 'nauticalRolloffPower']) {
			if (!Number.isFinite(value[key]) || value[key] <= 1) {
				throw new RangeError(`CR4C ${key} must be finite and greater than one.`);
			}
		}
		return Object.freeze({
			id: value.id,
			sunsetAmplitude: value.sunsetAmplitude,
			sunsetTransitionIlluminanceLux: value.sunsetTransitionIlluminanceLux,
			sunsetRolloffPower: value.sunsetRolloffPower,
			nauticalAmplitude: value.nauticalAmplitude,
			nauticalTransitionIlluminanceLux: value.nauticalTransitionIlluminanceLux,
			nauticalRolloffPower: value.nauticalRolloffPower,
		});
	}

	_acceptTotalHorizontalIlluminance(value) {
		UnitMath.assertUnitValue(value, 'totalHorizontalIlluminance');
		if (value.units !== 'lux') throw new TypeError('totalHorizontalIlluminance.units must be "lux".');
		if (value.value < 0) throw new RangeError('totalHorizontalIlluminance.value must be nonnegative.');
		return value.value;
	}

	/** Evaluate the frozen bounded CR4C two-scale response. */
	displayGain(totalHorizontalIlluminance) {
		const illuminance = this._acceptTotalHorizontalIlluminance(totalHorizontalIlluminance);
		return (
			1 +
			hillTerm(
				illuminance,
				this._curve.sunsetAmplitude,
				this._curve.sunsetTransitionIlluminanceLux,
				this._curve.sunsetRolloffPower,
			) +
			hillTerm(
				illuminance,
				this._curve.nauticalAmplitude,
				this._curve.nauticalTransitionIlluminanceLux,
				this._curve.nauticalRolloffPower,
			)
		);
	}

	/** Analytic derivative dg/dE in inverse lux. */
	displayGainDerivative(totalHorizontalIlluminance) {
		const illuminance = this._acceptTotalHorizontalIlluminance(totalHorizontalIlluminance);
		return (
			hillTermDerivative(
				illuminance,
				this._curve.sunsetAmplitude,
				this._curve.sunsetTransitionIlluminanceLux,
				this._curve.sunsetRolloffPower,
			) +
			hillTermDerivative(
				illuminance,
				this._curve.nauticalAmplitude,
				this._curve.nauticalTransitionIlluminanceLux,
				this._curve.nauticalRolloffPower,
			)
		);
	}

	applyPreToneGain(linearSrgb, totalHorizontalIlluminance) {
		const rgb = requireFiniteRgb(linearSrgb, 'CR4C projected linear RGB');
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
		return `const float CR4C_SUNSET_AMPLITUDE = ${ShaderSource.formatFloat(curve.sunsetAmplitude)};
const float CR4C_SUNSET_TRANSITION_ILLUMINANCE_LUX = ${ShaderSource.formatFloat(curve.sunsetTransitionIlluminanceLux)};
const float CR4C_SUNSET_ROLLOFF_POWER = ${ShaderSource.formatFloat(curve.sunsetRolloffPower)};
const float CR4C_NAUTICAL_AMPLITUDE = ${ShaderSource.formatFloat(curve.nauticalAmplitude)};
const float CR4C_NAUTICAL_TRANSITION_ILLUMINANCE_LUX = ${ShaderSource.formatFloat(curve.nauticalTransitionIlluminanceLux)};
const float CR4C_NAUTICAL_ROLLOFF_POWER = ${ShaderSource.formatFloat(curve.nauticalRolloffPower)};

float cr4cHillTerm(float illuminanceLux, float amplitude, float transitionLux, float power) {
	float ratio = max(illuminanceLux, 0.0) / transitionLux;
	return amplitude / (1.0 + pow(ratio, power));
}

float cr4cDisplayGain(float totalHorizontalIlluminanceLux) {
	return 1.0
		+ cr4cHillTerm(totalHorizontalIlluminanceLux, CR4C_SUNSET_AMPLITUDE, CR4C_SUNSET_TRANSITION_ILLUMINANCE_LUX, CR4C_SUNSET_ROLLOFF_POWER)
		+ cr4cHillTerm(totalHorizontalIlluminanceLux, CR4C_NAUTICAL_AMPLITUDE, CR4C_NAUTICAL_TRANSITION_ILLUMINANCE_LUX, CR4C_NAUTICAL_ROLLOFF_POWER);
}

vec4 encodeDisplayOutput(vec3 linearSrgb) {
	vec3 exposedLinearSrgb = linearSrgb * cr4cDisplayGain(uCr4cTotalHorizontalIlluminanceLux);
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
			id: `color-cr4c-two-scale-pre-tone-${this._curve.id}`,
			uniforms: [
				...contribution.uniforms,
				ShaderContributions.createShaderUniformDeclaration(
					'uCr4cTotalHorizontalIlluminanceLux',
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
				response: CR4C_TWO_SCALE_PRE_TONE_RESPONSE_ID,
				condition: 'receiver-total-horizontal-illuminance-lux',
				operationOrdering: 'signed projected linear RGB gain before unchanged Bruneton exponential',
				curve: this.curve,
			},
		};
	}
}

/**
 * @typedef {object} Cr4cTwoScaleCurve
 * @property {string} id
 * @property {number} sunsetAmplitude
 * @property {number} sunsetTransitionIlluminanceLux
 * @property {number} sunsetRolloffPower
 * @property {number} nauticalAmplitude
 * @property {number} nauticalTransitionIlluminanceLux
 * @property {number} nauticalRolloffPower
 */
