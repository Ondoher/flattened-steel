import {BrunetonColorDisplayModel} from '../candidate/src/algorithm32/color/BrunetonColorDisplayModel.js';
import {formatShaderFloat} from '../candidate/src/algorithm32/shader/shaderContribution.js';
import {BrunetonGlobalLuminanceLiftCurve} from './BrunetonGlobalLuminanceLiftCurve.js';

/** Bruneton Figure-1 mapping followed by one global, chroma-preserving luminance lift. */
export class BrunetonSourceLuminanceLiftColorDisplayModel extends BrunetonColorDisplayModel {
	constructor({sourceDerivedLocalLuminance, luminanceLiftCurve, ...configuration}) {
		super(configuration);
		this.sourceDerivedLocalLuminance = sourceDerivedLocalLuminance;
		this.luminanceLiftCurve = new BrunetonGlobalLuminanceLiftCurve(luminanceLiftCurve);
		this.gamma = this.luminanceLiftCurve.derive(sourceDerivedLocalLuminance);
		this.maximumLuminanceGain = this.luminanceLiftCurve.configuration.maximumLuminanceGain;
	}

	get id() { return 'bruneton-source-derived-global-luminance-lift'; }

	_displayEncodeBlock() {
		if (this.gamma === 1) return super._displayEncodeBlock();
		return `const float SOURCE_DERIVED_LUMINANCE_GAMMA = ${formatShaderFloat(this.gamma)};
const float SOURCE_DERIVED_MAXIMUM_LUMINANCE_GAIN = ${formatShaderFloat(this.maximumLuminanceGain)};
vec3 mapSceneLinearSrgbToDisplay(vec3 linearSrgb) {
	vec3 bruneton = clamp(vec3(1.0) - exp(-max(linearSrgb, vec3(0.0)) * DISPLAY_TONE_MAP_K), vec3(0.0), vec3(1.0));
	float luminance = dot(bruneton, vec3(0.2126, 0.7152, 0.0722));
	if (luminance <= 0.0) return vec3(0.0);
	float powerGain = pow(luminance, SOURCE_DERIVED_LUMINANCE_GAMMA - 1.0);
	float liftedLuminance = luminance * min(powerGain, SOURCE_DERIVED_MAXIMUM_LUMINANCE_GAIN);
	return clamp(bruneton * (liftedLuminance / luminance), vec3(0.0), vec3(1.0));
}

vec4 encodeDisplayOutput(vec3 linearSrgb) {
	return vec4(mapSceneLinearSrgbToDisplay(linearSrgb), 1.0);
}`;
	}
}

export const BRUNETON_SOURCE_LUMINANCE_LIFT_COLOR_ID = 'bruneton-source-derived-global-luminance-lift-v2';
