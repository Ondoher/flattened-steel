import {ShaderContributions} from '../controls/production-v1/src/algorithm32/shader-assembly/base/ShaderContributions.js';
import {ShaderSource} from '../controls/production-v1/src/algorithm32/shader-assembly/base/ShaderSource.js';
import {UnitMath} from '../controls/production-v1/src/algorithm32/spectral-values/index.js';
import {BrunetonColorDisplayModel} from '../controls/production-v1/src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';

/** Stable identity of the CR4 response equation, independent of one parameter row. */
export const CR4_GLOBAL_ACHROMATIC_RESPONSE_ID =
	'color-reset-cr4-total-horizontal-illuminance-rational-gain-v1';

function requireFiniteRgb(value, label) {
	if ((!Array.isArray(value) && !ArrayBuffer.isView(value)) || value.length !== 3) {
		throw new RangeError(`${label} must contain exactly three values.`);
	}
	const copy = Array.from(value);
	if (!copy.every(Number.isFinite)) throw new TypeError(`${label} values must be finite.`);
	return copy;
}

/**
 * One contained CR4 post-Bruneton achromatic response. The only scene state is
 * total horizontal receiver illuminance. There is no named-time or bright-mode
 * branch: gain approaches one continuously as receiver light increases.
 *
 * @implements {Color}
 */
export class Cr4GlobalAchromaticTwilightColorDisplayModel extends BrunetonColorDisplayModel {
	/**
	 * @param {{curve: {
	 *   id: string,
	 *   maximumGain: number,
	 *   transitionIlluminanceLux: number,
	 *   rolloffPower: number,
	 * }, displayConstants?: Figure1DisplayConstants}} configuration
	 */
	constructor(configuration) {
		super(configuration);
		this._curve = this._acceptCurve(configuration?.curve);
	}

	/** @type {{id: string, maximumGain: number, transitionIlluminanceLux: number, rolloffPower: number}} */
	_curve;

	get id() {
		return `${CR4_GLOBAL_ACHROMATIC_RESPONSE_ID}:${this._curve.id}`;
	}

	get curve() {
		return {...this._curve};
	}

	_acceptCurve(value) {
		if (!value || typeof value !== 'object' || Array.isArray(value)) {
			throw new TypeError('CR4 curve must be an object.');
		}
		if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value.id ?? '')) {
			throw new TypeError('CR4 curve id must be lowercase kebab case.');
		}
		if (!Number.isFinite(value.maximumGain) || value.maximumGain < 1) {
			throw new RangeError('CR4 maximumGain must be finite and at least one.');
		}
		if (!Number.isFinite(value.transitionIlluminanceLux) || value.transitionIlluminanceLux <= 0) {
			throw new RangeError('CR4 transitionIlluminanceLux must be positive and finite.');
		}
		if (
			!Number.isInteger(value.rolloffPower) ||
			value.rolloffPower < 2 ||
			value.rolloffPower % 2 !== 0
		) {
			throw new RangeError('CR4 rolloffPower must be an even integer of at least two.');
		}
		return Object.freeze({
			id: value.id,
			maximumGain: value.maximumGain,
			transitionIlluminanceLux: value.transitionIlluminanceLux,
			rolloffPower: value.rolloffPower,
		});
	}

	_acceptTotalHorizontalIlluminance(value) {
		UnitMath.assertUnitValue(value, 'totalHorizontalIlluminance');
		if (value.units !== 'lux') {
			throw new TypeError('totalHorizontalIlluminance.units must be "lux".');
		}
		if (value.value < 0) {
			throw new RangeError('totalHorizontalIlluminance.value must be nonnegative.');
		}
		return value.value;
	}

	/**
	 * Evaluate g(E) = 1 + (G - 1) / (1 + (E / E0)^p).
	 *
	 * @param {UnitValue<'lux'>} totalHorizontalIlluminance
	 * @returns {number}
	 */
	displayGain(totalHorizontalIlluminance) {
		const illuminance = this._acceptTotalHorizontalIlluminance(totalHorizontalIlluminance);
		const ratio = illuminance / this._curve.transitionIlluminanceLux;
		return 1 +
			(this._curve.maximumGain - 1) /
			(1 + ratio ** this._curve.rolloffPower);
	}

	/** Analytic derivative dg/dE in inverse lux. */
	displayGainDerivative(totalHorizontalIlluminance) {
		const illuminance = this._acceptTotalHorizontalIlluminance(totalHorizontalIlluminance);
		if (illuminance === 0) return 0;
		const ratio = illuminance / this._curve.transitionIlluminanceLux;
		if (!Number.isFinite(ratio)) return 0;
		if (ratio > 1) {
			const inverseRatio = 1 / ratio;
			const inversePower = inverseRatio ** this._curve.rolloffPower;
			return -(
				(this._curve.maximumGain - 1) *
				this._curve.rolloffPower *
				inversePower *
				inverseRatio
			) / (
				this._curve.transitionIlluminanceLux *
				(1 + inversePower) ** 2
			);
		}
		return -(
			(this._curve.maximumGain - 1) *
			this._curve.rolloffPower *
			ratio ** (this._curve.rolloffPower - 1)
		) / (
			this._curve.transitionIlluminanceLux *
			(1 + ratio ** this._curve.rolloffPower) ** 2
		);
	}

	/** Apply the one scene-global gain equally to all three Bruneton channels. */
	applyDisplayGain(brunetonRgb, totalHorizontalIlluminance) {
		const rgb = requireFiniteRgb(brunetonRgb, 'CR4 Bruneton RGB');
		const gain = this.displayGain(totalHorizontalIlluminance);
		return rgb.map((channel) => Math.max(0, Math.min(1, channel * gain)));
	}

	linearSrgbToDisplayRgb(linearSrgb, totalHorizontalIlluminance) {
		return this.applyDisplayGain(
			super.linearSrgbToDisplayRgb(linearSrgb),
			totalHorizontalIlluminance,
		);
	}

	radianceToDisplayRgb(radiance, totalHorizontalIlluminance) {
		return this.linearSrgbToDisplayRgb(
			this.radianceToLinearSrgb(radiance),
			totalHorizontalIlluminance,
		);
	}

	convert(request) {
		return {
			channels: this.radianceToDisplayRgb(
				request.radiance,
				request.totalHorizontalIlluminance,
			),
			colorSpace: this.displayConstants.outputColorSpace,
		};
	}

	composeSceneDisplayRgb(request) {
		return this.linearSrgbToDisplayRgb(
			super.composeSceneLinearSrgb(request),
			request.totalHorizontalIlluminance,
		);
	}

	_displayEncodeBlock() {
		const curve = this._curve;
		return `const float CR4_MAXIMUM_GAIN = ${ShaderSource.formatFloat(curve.maximumGain)};
const float CR4_TRANSITION_ILLUMINANCE_LUX = ${ShaderSource.formatFloat(curve.transitionIlluminanceLux)};
const float CR4_ROLLOFF_POWER = ${ShaderSource.formatFloat(curve.rolloffPower)};

float cr4DisplayGain(float totalHorizontalIlluminanceLux) {
	float ratio = max(totalHorizontalIlluminanceLux, 0.0) / CR4_TRANSITION_ILLUMINANCE_LUX;
	return 1.0 + (CR4_MAXIMUM_GAIN - 1.0) / (1.0 + pow(ratio, CR4_ROLLOFF_POWER));
}

vec4 encodeDisplayOutput(vec3 linearSrgb) {
	vec3 bruneton = clamp(
		vec3(1.0) - exp(-max(linearSrgb, vec3(0.0)) * DISPLAY_TONE_MAP_K),
		vec3(0.0),
		vec3(1.0)
	);
	return vec4(clamp(bruneton * cr4DisplayGain(uCr4TotalHorizontalIlluminanceLux), vec3(0.0), vec3(1.0)), 1.0);
}`;
	}

	createShaderContribution(request) {
		const contribution = super.createShaderContribution(request);
		return {
			...contribution,
			id: `color-cr4-global-achromatic-twilight-${this._curve.id}`,
			uniforms: [
				...contribution.uniforms,
				ShaderContributions.createShaderUniformDeclaration(
					'uCr4TotalHorizontalIlluminanceLux',
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
				response: CR4_GLOBAL_ACHROMATIC_RESPONSE_ID,
				condition: 'receiver-total-horizontal-illuminance-lux',
				curve: this.curve,
			},
		};
	}
}
