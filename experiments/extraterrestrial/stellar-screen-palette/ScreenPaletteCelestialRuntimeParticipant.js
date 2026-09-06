import {
	createShaderBindingRequirement,
	createShaderContribution,
	createShaderSourceBlock,
	createShaderTextureDescriptor,
} from '../candidate/src/algorithm32/shader/shaderContribution.js';

export const SCREEN_PALETTE_MATRIX_VALUE_KEY = 'cache.celestial.screenPaletteIndex';
export const SCREEN_PALETTE_VALUES_VALUE_KEY = 'cache.celestial.screenPaletteValues';

class ScreenPaletteCelestialGpuCache {
	constructor(identity) {
		this.identity = identity;
		this.disposed = false;
	}

	getRuntimeBindings() {
		if (this.disposed) throw new Error('Screen-palette celestial cache is disposed.');
		return Object.freeze({bindings: Object.freeze([])});
	}

	createShaderContribution({descriptorFingerprint, compatibilityTags = []}) {
		if (this.disposed) throw new Error('Screen-palette celestial cache is disposed.');
		return createShaderContribution({
			id: 'cache-screen-palette-native15-lookup',
			owner: 'cache',
			descriptorFingerprint,
			compatibilityTags,
			provides: ['cache.sampleScreenPaletteCelestialRadiance'],
			requires: ['runtime.initialState'],
			defines: ['precision highp usampler2D;'],
			textures: [
				createShaderTextureDescriptor('uCelestialScreenPaletteIndex', 'usampler2D', SCREEN_PALETTE_MATRIX_VALUE_KEY),
				createShaderTextureDescriptor('uCelestialScreenPaletteValues', 'sampler2D', SCREEN_PALETTE_VALUES_VALUE_KEY),
			],
			functions: [createShaderSourceBlock(
				'cache-screen-palette-native15-function',
				'sampleCelestialCache',
				0,
				`SpectralValue sampleScreenPaletteCelestialRadiance(vec2 uv) {
	ivec2 dimensions = textureSize(uCelestialScreenPaletteIndex, 0);
	ivec2 framebufferPixel = clamp(
		ivec2(floor(uv * vec2(dimensions))),
		ivec2(0),
		dimensions - ivec2(1)
	);
	ivec2 cachePixel = ivec2(framebufferPixel.x, dimensions.y - 1 - framebufferPixel.y);
	uint paletteIndex = texelFetch(uCelestialScreenPaletteIndex, cachePixel, 0).r;
	SpectralValue result = zeroSpectral();
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		result.c[channelIndex] = texelFetch(
			uCelestialScreenPaletteValues,
			ivec2(channelIndex, int(paletteIndex)),
			0
		).r;
	}
	return result;
}`,
			)],
			bindingRequirements: [
				createShaderBindingRequirement('cache.screen-palette-index', 'cache', 'texture', 'setup', SCREEN_PALETTE_MATRIX_VALUE_KEY, true),
				createShaderBindingRequirement('cache.screen-palette-values', 'cache', 'texture', 'setup', SCREEN_PALETTE_VALUES_VALUE_KEY, true),
			],
			diagnostics: {identity: this.identity, schema: 'R16UI-screen-index-plus-R32F-native15-palette'},
		});
	}

	createLiveShaderContribution({descriptorFingerprint, compatibilityTags = []}) {
		if (this.disposed) throw new Error('Screen-palette celestial cache is disposed.');
		return createShaderContribution({
			id: 'celestial-screen-palette-live-composition',
			owner: 'cache',
			descriptorFingerprint,
			compatibilityTags,
			provides: ['celestial.evaluateRadiance'],
			requires: [
				'runtime.initialState',
				'transport.evaluatePathRadiance',
				'cache.sampleScreenPaletteCelestialRadiance',
			],
			functions: [createShaderSourceBlock(
				'celestial-screen-palette-live-function',
				'evaluateCelestialRadiance',
				0,
				`void evaluateScreenPaletteCelestialRadiance(inout ShaderState state) {
	if (state.sceneHitMask >= 0.5) return;
	SpectralValue boundaryRadiance = sampleScreenPaletteCelestialRadiance(state.uv);
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		state.celestialRadiance.c[channelIndex] +=
			state.transmittance.c[channelIndex] * boundaryRadiance.c[channelIndex];
	}
}`,
			)],
			mainHooks: [createShaderSourceBlock(
				'celestial-screen-palette-live-main',
				'evaluateCelestialRadiance',
				0,
				'evaluateScreenPaletteCelestialRadiance(state);',
			)],
			diagnostics: {
				identity: this.identity,
				legacySunContributionEnabled: false,
				legacyStellarContributionEnabled: false,
				transmittanceApplications: 1,
			},
		});
	}

	dispose() {
		this.disposed = true;
	}
}

class ScreenPaletteCelestialGpuCacheController {
	constructor() {
		this.active = null;
	}

	async build({primaryCache}) {
		if (this.active?.identity === primaryCache.identity) return this.active;
		this.active?.dispose();
		this.active = new ScreenPaletteCelestialGpuCache(primaryCache.identity);
		return this.active;
	}

	dispose() {
		this.active?.dispose();
		this.active = null;
	}
}

/** Adapt one already-built screen matrix/palette into Algorithm32's celestial seam. */
export class ScreenPaletteCelestialRuntimeParticipant {
	constructor({identity}) {
		if (typeof identity !== 'string' || identity.length === 0) {
			throw new TypeError('Screen-palette celestial participant requires an identity.');
		}
		this.identity = identity;
		this.primarySourceId = 'composed-screen-palette';
	}

	describe() {
		return Object.freeze({
			kind: 'screen-palette-celestial-runtime-participant',
			identity: this.identity,
			primarySourceId: this.primarySourceId,
			legacySunContributionEnabled: false,
			legacyStellarContributionEnabled: false,
		});
	}

	createPrimaryCache() {
		return Object.freeze({identity: this.identity});
	}

	createGpuCacheController() {
		return new ScreenPaletteCelestialGpuCacheController();
	}
}
