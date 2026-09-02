import {NATIVE_15_SPECTRAL_BASIS} from '../controls/production-v1/src/algorithm32/profiles/index.js';
import {ShaderContributions} from '../controls/production-v1/src/algorithm32/shader-assembly/base/ShaderContributions.js';
import {ShaderSource} from '../controls/production-v1/src/algorithm32/shader-assembly/base/ShaderSource.js';
import {BrunetonColorDisplayModel} from '../controls/production-v1/src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';

/** Stable identity of the contained CR6 raw stellar-contrast diagnostic. */
export const CR6_STELLAR_CONTRAST_DIAGNOSTIC_COLOR_ID =
	'color-reset-cr6-stellar-contrast-diagnostic-v1';

/** GLSL uniform mutated by the CR6 harness without rebuilding the installed shader. */
export const CR6_STELLAR_CONTRAST_DIAGNOSTIC_MODE_UNIFORM_NAME =
	'uCr6StellarContrastDiagnosticMode';

/**
 * Caller-owned binding key for the mutable CR6 mode.
 *
 * The key must exist in the same `bindingValues` object before shader
 * installation. Assign one of the exported integer mode values before a
 * render; the installed runtime refreshes that uniform at render time, so a
 * mode change must not call `setConfig` or rebuild the shader.
 */
export const CR6_STELLAR_CONTRAST_DIAGNOSTIC_MODE_VALUE_KEY =
	'color.cr6StellarContrastDiagnosticMode';

/** Integer modes supported by one installed CR6 diagnostic shader. */
export const CR6_STELLAR_CONTRAST_DIAGNOSTIC_MODES = Object.freeze({
	SKY_LINEAR_RGBY: 0,
	STAR_NATIVE15_CHANNELS_0_2: 1,
	STAR_NATIVE15_CHANNELS_3_5: 2,
	STAR_NATIVE15_CHANNELS_6_8: 3,
	STAR_NATIVE15_CHANNELS_9_11: 4,
	STAR_NATIVE15_CHANNELS_12_14: 5,
	STAR_LINEAR_RGBY: 6,
});

/** Stable mode-to-Native15-channel mapping for raw stellar packet readback. */
export const CR6_STELLAR_CONTRAST_DIAGNOSTIC_CHANNEL_GROUPS = Object.freeze([
	Object.freeze({mode: 1, channelIndices: Object.freeze([0, 1, 2])}),
	Object.freeze({mode: 2, channelIndices: Object.freeze([3, 4, 5])}),
	Object.freeze({mode: 3, channelIndices: Object.freeze([6, 7, 8])}),
	Object.freeze({mode: 4, channelIndices: Object.freeze([9, 10, 11])}),
	Object.freeze({mode: 5, channelIndices: Object.freeze([12, 13, 14])}),
]);

/**
 * One-install CR6 view of the atmosphere-only field and transported stellar
 * screen-palette packet. It is a raw float diagnostic, not a visibility model:
 * it introduces no threshold, exposure, tone map, or stellar selection rule.
 *
 * @implements {Color}
 */
export class Cr6StellarContrastDiagnosticColorDisplayModel extends BrunetonColorDisplayModel {
	/** Stable identity of the contained diagnostic Color implementation. */
	get id() {
		return CR6_STELLAR_CONTRAST_DIAGNOSTIC_COLOR_ID;
	}

	/** Build exact Native15 photopic-Y projection weights in cd m^-2. */
	_photopicYByChannel(basis) {
		const efficacy = this.displayConstants.maxLuminousEfficacy.value;
		return basis.channels.map((channel) => {
			const matching = this._cieColorMatchingValuesAt(channel.center.value);
			return efficacy * matching[1] * channel.width.value;
		});
	}

	/** Build the signed E8 linear-RGB and direct CIE-Y projection constants. */
	_diagnosticProjectionConstantsBlock(basis) {
		const weights = this._buildDisplayLinearSrgbByChannel(basis);
		const photopicY = this._photopicYByChannel(basis);
		const channelCount = basis.channelCount;

		return `const float CR6_LINEAR_SRGB_R_BY_CHANNEL[${channelCount}] = float[${channelCount}](${ShaderSource.formatFloatArray(weights.r)});
const float CR6_LINEAR_SRGB_G_BY_CHANNEL[${channelCount}] = float[${channelCount}](${ShaderSource.formatFloatArray(weights.g)});
const float CR6_LINEAR_SRGB_B_BY_CHANNEL[${channelCount}] = float[${channelCount}](${ShaderSource.formatFloatArray(weights.b)});
const float CR6_PHOTOPIC_Y_BY_CHANNEL[${channelCount}] = float[${channelCount}](${ShaderSource.formatFloatArray(photopicY)});`;
	}

	/** Build the raw mode switch and the exact production stellar lookup. */
	_diagnosticFunctionsBlock() {
		return `vec3 cr6SpectralRadianceToSignedLinearSrgb(SpectralValue radiance) {
	vec3 linearSrgb = vec3(0.0);
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		linearSrgb.r += radiance.channels[channelIndex] * CR6_LINEAR_SRGB_R_BY_CHANNEL[channelIndex];
		linearSrgb.g += radiance.channels[channelIndex] * CR6_LINEAR_SRGB_G_BY_CHANNEL[channelIndex];
		linearSrgb.b += radiance.channels[channelIndex] * CR6_LINEAR_SRGB_B_BY_CHANNEL[channelIndex];
	}
	return linearSrgb;
}

float cr6SpectralRadianceToPhotopicY(SpectralValue radiance) {
	float photopicY = 0.0;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		photopicY += radiance.channels[channelIndex] * CR6_PHOTOPIC_Y_BY_CHANNEL[channelIndex];
	}
	return photopicY;
}

SpectralValue cr6TransportedStellarScreenPaletteRadiance(
	ShaderState state,
	out float occupancy
) {
	SpectralValue stellarRadiance = zeroSpectral();
	occupancy = 0.0;
	if (state.sceneHitMask >= 0.5) return stellarRadiance;
	ivec2 dimensions = textureSize(uStellarScreenIndex, 0);
	ivec2 pixel = clamp(
		ivec2(floor(state.textureCoordinates * vec2(dimensions))),
		ivec2(0),
		dimensions - ivec2(1)
	);
	uint paletteIndex = texelFetch(uStellarScreenIndex, pixel, 0).r;
	if (paletteIndex == 0u) return stellarRadiance;
	occupancy = 1.0;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		float boundaryRadiance = texelFetch(
			uStellarPalette,
			ivec2(int(paletteIndex), channelIndex),
			0
		).r;
		stellarRadiance.channels[channelIndex] =
			state.transmittance.channels[channelIndex] * boundaryRadiance;
	}
	return stellarRadiance;
}

vec4 cr6StellarContrastDiagnosticOutput(ShaderState state) {
	if (uCr6StellarContrastDiagnosticMode == 0) {
		return vec4(
			cr6SpectralRadianceToSignedLinearSrgb(state.pathRadiance),
			cr6SpectralRadianceToPhotopicY(state.pathRadiance)
		);
	}
	if (uCr6StellarContrastDiagnosticMode == 6) {
		float occupancy = 0.0;
		SpectralValue stellarRadiance = cr6TransportedStellarScreenPaletteRadiance(state, occupancy);
		return vec4(
			cr6SpectralRadianceToSignedLinearSrgb(stellarRadiance),
			cr6SpectralRadianceToPhotopicY(stellarRadiance)
		);
	}
	if (uCr6StellarContrastDiagnosticMode < 1 || uCr6StellarContrastDiagnosticMode > 5) {
		return vec4(0.0);
	}
	float occupancy = 0.0;
	SpectralValue stellarRadiance = cr6TransportedStellarScreenPaletteRadiance(state, occupancy);
	int firstChannelIndex = (uCr6StellarContrastDiagnosticMode - 1) * 3;
	return vec4(
		stellarRadiance.channels[firstChannelIndex],
		stellarRadiance.channels[firstChannelIndex + 1],
		stellarRadiance.channels[firstChannelIndex + 2],
		occupancy
	);
}`;
	}

	/**
	 * Contribute one raw float diagnostic with a frame-mutable integer mode.
	 * The standard celestial consumer remains the sole declarer and binder of
	 * `uStellarScreenIndex` and `uStellarPalette`.
	 */
	createShaderContribution(request) {
		const basis = request?.model?.profile?.spectral?.basis;
		if (!basis || basis.contentHash !== NATIVE_15_SPECTRAL_BASIS.contentHash) {
			throw new TypeError('CR6 stellar contrast diagnostic requires the exact Native15 spectral basis.');
		}
		if (request.model.celestialSources === null) {
			throw new TypeError('CR6 stellar contrast diagnostic requires an enabled celestial composition path.');
		}

		return ShaderContributions.createShaderContribution({
			id: 'color-cr6-stellar-contrast-diagnostic',
			owner: 'color',
			provides: ['color.composeSceneColor', 'color.encodeOutput'],
			requires: ['runtime.initialState', 'composition.composeSpectralRadiance'],
			uniforms: [
				ShaderContributions.createShaderUniformDeclaration(
					CR6_STELLAR_CONTRAST_DIAGNOSTIC_MODE_UNIFORM_NAME,
					'int',
					CR6_STELLAR_CONTRAST_DIAGNOSTIC_MODE_VALUE_KEY,
				),
			],
			textures: [],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'color-cr6-stellar-contrast-diagnostic-constants',
					'declareConstants',
					0,
					this._diagnosticProjectionConstantsBlock(basis),
				),
				ShaderContributions.createShaderSourceBlock(
					'color-cr6-stellar-contrast-diagnostic-functions',
					'composeSceneColor',
					0,
					this._diagnosticFunctionsBlock(),
				),
			],
			mainHooks: [
				ShaderContributions.createShaderSourceBlock(
					'color-cr6-stellar-contrast-diagnostic-main',
					'composeSceneColor',
					0,
					'state.outputRgba = cr6StellarContrastDiagnosticOutput(state);',
				),
				ShaderContributions.createShaderSourceBlock(
					'color-cr6-stellar-contrast-diagnostic-output',
					'encodeOutput',
					0,
					'outColor = state.outputRgba;',
				),
			],
			bindingRequirements: [
				ShaderContributions.createShaderBindingRequirement(
					'color.cr6-stellar-contrast-diagnostic-mode',
					'color',
					'uniform',
					'frame',
					CR6_STELLAR_CONTRAST_DIAGNOSTIC_MODE_VALUE_KEY,
					true,
				),
			],
			diagnostics: {
				mode: this.id,
				output: 'raw-float-rgba',
				modeUniform: CR6_STELLAR_CONTRAST_DIAGNOSTIC_MODE_UNIFORM_NAME,
				modeValueKey: CR6_STELLAR_CONTRAST_DIAGNOSTIC_MODE_VALUE_KEY,
				skyOutput: 'signed E8 linear RGB plus direct CIE photopic Y from state.pathRadiance',
				stellarOutput: 'transported Native15 channel triplet plus palette occupancy, or GPU-projected signed E8 RGB plus direct CIE Y',
				stellarLookup: 'production stellar screen index and Native15 palette',
				sceneMask: 'whole-pixel exclusion before stellar lookup',
				transport: 'state.transmittance applied exactly once',
				visibilityThreshold: null,
			},
		});
	}
}
