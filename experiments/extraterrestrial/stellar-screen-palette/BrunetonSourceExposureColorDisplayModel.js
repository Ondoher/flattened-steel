import {BrunetonColorDisplayModel} from '../candidate/src/algorithm32/color/BrunetonColorDisplayModel.js';
import {formatShaderFloat} from '../candidate/src/algorithm32/shader/shaderContribution.js';
import {BrunetonGlobalExposureCurve} from './BrunetonGlobalExposureCurve.js';

/** Bruneton Figure-1 Color with one condition-wide, source-derived exposure. */
export class BrunetonSourceExposureColorDisplayModel extends BrunetonColorDisplayModel {
	constructor({sourceDerivedLocalLuminance, exposureCurve, ...configuration}) {
		super(configuration);
		this.sourceDerivedLocalLuminance = sourceDerivedLocalLuminance;
		this.exposureCurve = new BrunetonGlobalExposureCurve(exposureCurve);
		this.exposure = this.exposureCurve.derive(sourceDerivedLocalLuminance);
	}

	get id() { return 'bruneton-source-derived-global-exposure'; }

	_displayEncodeBlock() {
		if (this.exposure === 1) return super._displayEncodeBlock();
		return `const float SOURCE_DERIVED_GLOBAL_EXPOSURE = ${formatShaderFloat(this.exposure)};
vec3 mapSceneLinearSrgbToDisplay(vec3 linearSrgb) {
	return clamp(
		vec3(1.0) - exp(
			-max(linearSrgb, vec3(0.0)) * DISPLAY_TONE_MAP_K * SOURCE_DERIVED_GLOBAL_EXPOSURE
		),
		vec3(0.0),
		vec3(1.0)
	);
}

vec4 encodeDisplayOutput(vec3 linearSrgb) {
	return vec4(mapSceneLinearSrgbToDisplay(linearSrgb), 1.0);
}`;
	}

	linearSrgbToDisplayRgb(linearSrgb) {
		this._assertRgbTriplet(linearSrgb, 'linearSrgbToDisplayRgb');
		return linearSrgb.map((value) => Math.max(0, Math.min(1,
			1 - Math.exp(-Math.max(0, value) * this.displayConstants.paperFigure1ToneMapK * this.exposure),
		)));
	}
}

export const BRUNETON_SOURCE_EXPOSURE_COLOR_ID = 'bruneton-source-derived-global-exposure-v1';
