import {ShaderContributions} from '../../shader-assembly/base/ShaderContributions.js';

const SCREEN_INDEX_VALUE_KEY = 'runtime.celestial.stellarScreenIndex';
const PALETTE_VALUE_KEY = 'runtime.celestial.stellarPalette';

/** Build the O(1) standard-pipeline consumer for one completed stellar screen palette. */
export class StellarScreenPaletteConsumerShaderContribution {
	/** Create the source-owned contribution. */
	createShaderContribution() {
		return ShaderContributions.createShaderContribution({
			id: 'celestial-stellar-screen-palette-consumer',
			owner: 'stellarSource',
			provides: ['celestial.evaluateStellarScreenPaletteRadiance'],
			requires: ['runtime.initialState', 'transport.evaluatePathRadiance', 'celestial.evaluateRadiance'],
			textures: [
				ShaderContributions.createShaderTextureDeclaration(
					'uStellarScreenIndex',
					'usampler2D',
					SCREEN_INDEX_VALUE_KEY,
				),
				ShaderContributions.createShaderTextureDeclaration('uStellarPalette', 'sampler2D', PALETTE_VALUE_KEY),
			],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'stellar-screen-palette-consumer-helper',
					'evaluateCelestialRadiance',
					1,
					`void addStellarScreenPaletteRadiance(inout SpectralValue celestialRadiance, ShaderState state) {
	if (state.sceneHitMask > 0.5) return;
	ivec2 dimensions = textureSize(uStellarScreenIndex, 0);
	ivec2 pixel = clamp(ivec2(floor(state.textureCoordinates * vec2(dimensions))), ivec2(0), dimensions - ivec2(1));
	uint paletteIndex = texelFetch(uStellarScreenIndex, pixel, 0).r;
	if (paletteIndex == 0u) return;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		float boundaryRadiance = texelFetch(uStellarPalette, ivec2(int(paletteIndex), channelIndex), 0).r;
		celestialRadiance.channels[channelIndex] += state.transmittance.channels[channelIndex] * boundaryRadiance;
	}
}`,
				),
			],
			mainHooks: [
				ShaderContributions.createShaderSourceBlock(
					'stellar-screen-palette-consumer-main',
					'evaluateCelestialRadiance',
					1,
					'addStellarScreenPaletteRadiance(celestialRadiance, state);',
				),
			],
			bindingRequirements: [
				ShaderContributions.createShaderBindingRequirement(
					'runtime.celestial-stellar-screen-index',
					'renderingRuntime',
					'texture',
					'frame',
					SCREEN_INDEX_VALUE_KEY,
					false,
				),
				ShaderContributions.createShaderBindingRequirement(
					'runtime.celestial-stellar-palette',
					'renderingRuntime',
					'texture',
					'frame',
					PALETTE_VALUE_KEY,
					false,
				),
			],
			diagnostics: {
				lookup: 'one-unsigned-index-plus-native-15',
				sceneMask: 'whole-pixel-before-lookup',
				transport: 'view-path-transmittance-once',
			},
		});
	}
}
