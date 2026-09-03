import {ShaderContributions} from '../shader-assembly/base/ShaderContributions.js';

const STELLAR_SCREEN_INDEX_VALUE_KEY = 'runtime.celestial.stellarScreenIndex';
const STELLAR_PALETTE_VALUE_KEY = 'runtime.celestial.stellarPalette';
const SUN_COVERAGE_VALUE_KEY = 'runtime.celestial.sunCoverageTile';
const SUN_SCREEN_CENTER_VALUE_KEY = 'runtime.celestial.sunScreenCenterPixels';
const SUN_TILE_RESOLUTION_VALUE_KEY = 'runtime.celestial.sunTileResolution';
const SUN_TILE_SCALE_VALUE_KEY = 'runtime.celestial.sunTileSamplesPerPixel';
const SUN_SURFACE_RADIANCE_VALUE_KEY = 'runtime.celestial.sunSurfaceRadiance';

/** Shared fixed-cost stars-then-Sun celestial compositor contribution. */
export class CelestialScreenPaletteConsumerShaderContribution {
	/**
	 * Create the shared consumer contribution owner.
	 *
	 * @param {Readonly<{includeStars: boolean, filteredStars?: boolean, surfaceRadiance: SpectralRadiancePacket}>} configuration - Enabled back layer and Sun spectrum.
	 */
	constructor(configuration) {
		this._includeStars = configuration.includeStars;
		this._filteredStars = configuration.filteredStars === true;
		this._surfaceRadiance = configuration.surfaceRadiance;
	}

	/** Create one optional binding requirement. */
	_binding(id, kind, valueKey) {
		return ShaderContributions.createShaderBindingRequirement(
			id,
			'renderingRuntime',
			kind,
			'frame',
			valueKey,
			false,
		);
	}

	/** Create the source-independent O(1) celestial contribution. */
	createShaderContribution() {
		const textures = [
			ShaderContributions.createShaderTextureDeclaration('uSunCoverageTile', 'sampler2D', SUN_COVERAGE_VALUE_KEY),
		];
		const bindings = [
			this._binding('runtime.celestial-sun-coverage-tile', 'texture', SUN_COVERAGE_VALUE_KEY),
			this._binding('runtime.celestial-sun-screen-center', 'uniform', SUN_SCREEN_CENTER_VALUE_KEY),
			this._binding('runtime.celestial-sun-tile-resolution', 'uniform', SUN_TILE_RESOLUTION_VALUE_KEY),
			this._binding('runtime.celestial-sun-tile-scale', 'uniform', SUN_TILE_SCALE_VALUE_KEY),
			this._binding('runtime.celestial-sun-surface-radiance', 'uniform', SUN_SURFACE_RADIANCE_VALUE_KEY),
		];
		if (this._includeStars) {
			textures.unshift(
				ShaderContributions.createShaderTextureDeclaration(
					'uStellarScreenIndex',
					'usampler2D',
					STELLAR_SCREEN_INDEX_VALUE_KEY,
				),
				ShaderContributions.createShaderTextureDeclaration(
					'uStellarPalette',
					'sampler2D',
					STELLAR_PALETTE_VALUE_KEY,
				),
			);
			bindings.unshift(
				this._binding('runtime.celestial-stellar-screen-index', 'texture', STELLAR_SCREEN_INDEX_VALUE_KEY),
				this._binding('runtime.celestial-stellar-palette', 'texture', STELLAR_PALETTE_VALUE_KEY),
			);
		}

		const stellarSource = this._includeStars
			? `ivec2 stellarDimensions = textureSize(uStellarScreenIndex, 0);
	ivec2 stellarPixel = clamp(
		ivec2(floor(state.textureCoordinates * vec2(stellarDimensions))),
		ivec2(0),
		stellarDimensions - ivec2(1)
	);
	uint paletteIndex = texelFetch(uStellarScreenIndex, stellarPixel, 0).r;
	if (paletteIndex == 0u) return result;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		float boundaryRadiance = texelFetch(
			uStellarPalette,
			ivec2(int(paletteIndex), channelIndex),
			0
		).r;
		result.channels[channelIndex] = state.transmittance.channels[channelIndex] * boundaryRadiance;
	}
	${this._filteredStars ? `stellarPresentation.radiance = result;
	stellarPresentation.visualMagnitude = texelFetch(uStellarPalette, ivec2(int(paletteIndex), 15), 0).r;` : ''}`
			: '';
		const presentationType = this._filteredStars
			? `struct StellarPresentationSample {
	SpectralValue radiance;
	float visualMagnitude;
};`
			: '';
		const evaluationSignature = this._filteredStars
			? 'SpectralValue evaluateScreenPaletteCelestialRadiance(ShaderState state, out StellarPresentationSample stellarPresentation)'
			: 'SpectralValue evaluateScreenPaletteCelestialRadiance(ShaderState state)';
		const presentationInitialization = this._filteredStars
			? `stellarPresentation.radiance = zeroSpectral();
	stellarPresentation.visualMagnitude = 0.0;`
			: '';
		const evaluationCall = this._filteredStars
			? `StellarPresentationSample stellarPresentation;
	SpectralValue celestialRadiance = evaluateScreenPaletteCelestialRadiance(state, stellarPresentation);`
			: 'SpectralValue celestialRadiance = evaluateScreenPaletteCelestialRadiance(state);';

		return ShaderContributions.createShaderContribution({
			id: 'celestial-screen-palette-consumer',
			owner: 'celestialCache',
			provides: ['celestial.evaluateRadiance'],
			requires: ['runtime.initialState', 'transport.evaluatePathRadiance'],
			uniforms: [
				ShaderContributions.createShaderUniformDeclaration(
					'uSunScreenCenterPixels',
					'vec2',
					SUN_SCREEN_CENTER_VALUE_KEY,
					[-1000000, -1000000],
				),
				ShaderContributions.createShaderUniformDeclaration(
					'uSunTileResolution',
					'vec2',
					SUN_TILE_RESOLUTION_VALUE_KEY,
					[1, 1],
				),
				ShaderContributions.createShaderUniformDeclaration(
					'uSunTileSamplesPerPixel',
					'float',
					SUN_TILE_SCALE_VALUE_KEY,
					1,
				),
				ShaderContributions.createShaderUniformDeclaration(
					'uSunSurfaceRadiance',
					`float[${this._surfaceRadiance.values.length}]`,
					SUN_SURFACE_RADIANCE_VALUE_KEY,
					[...this._surfaceRadiance.values],
				),
			],
			textures,
			functions: [
				...(this._filteredStars ? [ShaderContributions.createShaderSourceBlock(
					'celestial-stellar-presentation-type',
					'declareTypes',
					10,
					presentationType,
				)] : []),
				ShaderContributions.createShaderSourceBlock(
					'celestial-screen-palette-consumer-helper',
					'evaluateCelestialRadiance',
					0,
					`float sampleSunCoverageTile(ShaderState state) {
	vec2 screenPixelCenter = state.textureCoordinates * uViewportSizePixels;
	vec2 relativePixelCenter = screenPixelCenter - uSunScreenCenterPixels;
	vec2 tileTexelCenter = relativePixelCenter * uSunTileSamplesPerPixel
		+ 0.5 * uSunTileResolution;
	vec2 tileCoordinates = tileTexelCenter / uSunTileResolution;
	if (any(lessThanEqual(tileCoordinates, vec2(0.0)))
		|| any(greaterThanEqual(tileCoordinates, vec2(1.0)))) return 0.0;
	return clamp(texture(uSunCoverageTile, tileCoordinates).r, 0.0, 1.0);
}

${evaluationSignature} {
	SpectralValue result = zeroSpectral();
	${presentationInitialization}
	if (state.sceneHitMask >= 0.5) return result;
	float sunCoverage = sampleSunCoverageTile(state);
	if (sunCoverage > 0.0) {
		for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
			result.channels[channelIndex] = state.transmittance.channels[channelIndex]
				* sunCoverage
				* uSunSurfaceRadiance[channelIndex];
		}
		return result;
	}
	${stellarSource}
	return result;
}`,
				),
			],
			mainHooks: [
				ShaderContributions.createShaderSourceBlock(
					'celestial-screen-palette-consumer-main',
					'evaluateCelestialRadiance',
					0,
					evaluationCall,
				),
			],
			bindingRequirements: bindings,
			diagnostics: {
				layers: this._includeStars ? 'stars-then-sun' : 'sun-only',
				sunClaim: 'any-positive-coverage-opaque',
				sceneMask: 'whole-pixel-before-lookup',
				transport: 'view-path-transmittance-once',
				presentation: this._filteredStars ? 'source-linear-filtered' : 'physical-spectral',
			},
		});
	}
}
