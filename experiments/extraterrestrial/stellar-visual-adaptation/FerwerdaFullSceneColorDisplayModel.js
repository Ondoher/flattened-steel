import {BrunetonColorDisplayModel} from '../candidate/src/algorithm32/color/BrunetonColorDisplayModel.js';
import {formatShaderFloat} from '../candidate/src/algorithm32/shader/shaderContribution.js';

function requireFiniteNonnegative(value, label) {
	if (!Number.isFinite(value) || value < 0) throw new RangeError(`${label} must be finite and nonnegative.`);
	return value;
}

/**
 * Contained full-scene Ferwerda evaluation.
 *
 * The completed spectral atmosphere/celestial result and renderer scene bridge
 * are first composed by the retained Color model. The cone scale then preserves
 * RGB chromatic relationships, while the rod term is one achromatic contribution
 * derived from completed linear-sRGB luminance. This approximation is necessary
 * because renderer-owned scene geometry reaches Color as RGB rather than native-15.
 */
export class FerwerdaFullSceneColorDisplayModel extends BrunetonColorDisplayModel {
	constructor({ferwerda, ...configuration}) {
		super(configuration);
		if (!ferwerda || typeof ferwerda !== 'object') throw new TypeError('Ferwerda parameters are required.');
		this._ferwerda = Object.freeze({
			coneScale: requireFiniteNonnegative(ferwerda.coneScale, 'Cone scale'),
			rodScale: requireFiniteNonnegative(ferwerda.rodScale, 'Rod scale'),
			rodBlend: requireFiniteNonnegative(ferwerda.rodBlend, 'Rod blend'),
			displayMaximumLuminance: requireFiniteNonnegative(ferwerda.displayMaximumLuminance, 'Display maximum luminance'),
			worldAdaptationLuminance: requireFiniteNonnegative(ferwerda.worldAdaptationLuminance, 'World adaptation luminance'),
		});
		if (this._ferwerda.rodBlend > 1 || this._ferwerda.displayMaximumLuminance === 0) {
			throw new RangeError('Rod blend must be at most one and display maximum must be positive.');
		}
	}

	get id() { return 'contained-ferwerda-full-scene-display'; }

	_displayEncodeBlock() {
		const f = this._ferwerda;
		return `const float FERWERDA_CONE_SCALE = ${formatShaderFloat(f.coneScale)};
const float FERWERDA_ROD_SCALE = ${formatShaderFloat(f.rodScale)};
const float FERWERDA_ROD_BLEND = ${formatShaderFloat(f.rodBlend)};
const float FERWERDA_DISPLAY_MAXIMUM = ${formatShaderFloat(f.displayMaximumLuminance)};

float linearSrgbChannelToDisplaySrgb(float value) {
	float clamped = clamp(value, 0.0, 1.0);
	return clamped <= 0.0031308
		? 12.92 * clamped
		: 1.055 * pow(clamped, 1.0 / 2.4) - 0.055;
}

vec3 mapSceneLinearSrgbToDisplay(vec3 linearSrgb) {
	vec3 positive = max(linearSrgb, vec3(0.0));
	float luminance = dot(positive, vec3(0.2126, 0.7152, 0.0722));
	vec3 coneDisplayLuminance = FERWERDA_CONE_SCALE * positive;
	vec3 rodDisplayLuminance = vec3(FERWERDA_ROD_SCALE * FERWERDA_ROD_BLEND * luminance);
	vec3 normalized = clamp((coneDisplayLuminance + rodDisplayLuminance) / FERWERDA_DISPLAY_MAXIMUM, vec3(0.0), vec3(1.0));
	return vec3(
		linearSrgbChannelToDisplaySrgb(normalized.r),
		linearSrgbChannelToDisplaySrgb(normalized.g),
		linearSrgbChannelToDisplaySrgb(normalized.b)
	);
}

vec4 encodeDisplayOutput(vec3 linearSrgb) {
	return vec4(mapSceneLinearSrgbToDisplay(linearSrgb), 1.0);
}`;
	}

	describeDisplayConversion() {
		return {
			...super.describeDisplayConversion(),
			toneMapping: 'contained-ferwerda-steady-state-cone-plus-achromatic-rod',
			metadata: {...super.describeDisplayConversion().metadata, ferwerda: this._ferwerda, outputTransfer: 'standard-srgb-oetf'},
		};
	}
}
