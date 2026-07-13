import {
	createShaderBindingRequirement,
	createShaderContribution,
	createShaderSourceBlock,
	createShaderTextureDescriptor,
	formatShaderVec3,
} from '../../shader/shaderContribution.js';
import { STELLAR_POINT_SET_CACHE_VALUE_KEY } from './TiledStarPointSetCache.js';

const STELLAR_SAMPLER = 'uStellarPointSetIrradianceCache';

/** One published R32F tiled star field plus its exact-footprint live consumer. */
export class StellarPointSetGpuCache {
	constructor({ artifact, tiledCache, generationIdentity }) {
		this._artifact = artifact;
		this.tiledCache = tiledCache;
		this.generationIdentity = generationIdentity;
		this._disposed = false;
	}

	getRuntimeBindings() {
		if (this._disposed) throw new Error('Stellar point-set GPU cache is disposed.');
		return this._artifact.runtimeBindings;
	}

	async readSelectedScalars(probeReader, coordinates) {
		if (this._disposed) throw new Error('Stellar point-set GPU cache is disposed.');
		return probeReader.readSelectedScalars({ field: this._artifact.result, coordinates });
	}

	createShaderContribution({ descriptorFingerprint, compatibilityTags = [] }) {
		if (this._disposed) throw new Error('Stellar point-set GPU cache is disposed.');
		return createShaderContribution({
			id: 'cache-stellar-point-set-tiled-r32f-lookup', owner: 'cache', descriptorFingerprint, compatibilityTags,
			provides: ['cache.sampleStellarPointSetIrradiance'],
			requires: ['geometry.celestialCacheStencilTypes'],
			textures: [createShaderTextureDescriptor(STELLAR_SAMPLER, 'sampler2DArray', STELLAR_POINT_SET_CACHE_VALUE_KEY)],
			functions: [createShaderSourceBlock('cache-stellar-point-set-tiled-r32f-fetch', 'sampleCelestialCache', 1, `SpectralValue sampleStellarPointSetIrradiance(
	int memberIndex,
	CelestialCacheBilinearStencil stencil
) {
	SpectralValue result = zeroSpectral();
	if (!stencil.valid) return result;
	int tileX = memberIndex % STELLAR_POINT_MEMBER_TILE_COLUMNS;
	int tileY = memberIndex / STELLAR_POINT_MEMBER_TILE_COLUMNS;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		for (int positionTap = 0; positionTap < 2; positionTap += 1) {
			for (int directionTap = 0; directionTap < 2; directionTap += 1) {
				int x = tileX * STELLAR_POINT_CACHE_DIRECTION_COUNT + stencil.directionIndices[directionTap];
				int y = tileY * STELLAR_POINT_CACHE_POSITION_COUNT + stencil.positionIndices[positionTap];
				result.c[channelIndex] += stencil.positionWeights[positionTap]
					* stencil.directionWeights[directionTap]
					* texelFetch(${STELLAR_SAMPLER}, ivec3(x, y, channelIndex), 0).r;
			}
		}
	}
	return result;
}`)],
			bindingRequirements: [createShaderBindingRequirement('cache.stellar-point-set-irradiance', 'cache', 'texture', 'setup', STELLAR_POINT_SET_CACHE_VALUE_KEY, true)],
		});
	}

	createLiveShaderContribution({ descriptorFingerprint, compatibilityTags = [] }) {
		if (this._disposed) throw new Error('Stellar point-set GPU cache is disposed.');
		const directions = this.tiledCache.canonicalDirections.map((direction) => formatShaderVec3(direction)).join(', ');
		return createShaderContribution({
			id: 'celestial-stellar-point-set-live-raster', owner: 'cache', descriptorFingerprint, compatibilityTags,
			requires: ['runtime.initialState', 'runtime.sceneHitTexture', 'geometry.reconstructViewRay', 'geometry.resolveCelestialCacheStencil', 'cache.sampleStellarPointSetIrradiance'],
			functions: [
				createShaderSourceBlock('celestial-stellar-point-set-constants', 'declareConstants', 1, `const int STELLAR_POINT_MEMBER_COUNT = ${this.tiledCache.members.length};
const int STELLAR_POINT_MEMBER_TILE_COLUMNS = ${this.tiledCache.tileColumns};
const int STELLAR_POINT_CACHE_DIRECTION_COUNT = ${this.tiledCache.directionCount};
const int STELLAR_POINT_CACHE_POSITION_COUNT = ${this.tiledCache.positionCount};
const vec3 STELLAR_POINT_DIRECTIONS[${this.tiledCache.members.length}] = vec3[${this.tiledCache.members.length}](${directions});`),
				createShaderSourceBlock('celestial-stellar-point-set-footprint', 'evaluateCelestialRadiance', 1, `float stellarTriangleSolidAngle(vec3 a, vec3 b, vec3 c) {
	float numerator = abs(dot(a, cross(b, c)));
	float denominator = 1.0 + dot(a, b) + dot(b, c) + dot(c, a);
	return abs(2.0 * atan(numerator, denominator));
}

bool stellarDirectionInsidePixel(vec3 direction, vec2 uv, vec3 centerDirection) {
	vec2 halfPixel = 0.5 / max(uViewportSizePixels, vec2(1.0));
	vec3 c0 = reconstructViewRay(uv + vec2(-halfPixel.x, -halfPixel.y)).direction;
	vec3 c1 = reconstructViewRay(uv + vec2( halfPixel.x, -halfPixel.y)).direction;
	vec3 c2 = reconstructViewRay(uv + vec2( halfPixel.x,  halfPixel.y)).direction;
	vec3 c3 = reconstructViewRay(uv + vec2(-halfPixel.x,  halfPixel.y)).direction;
	return dot(cross(c0, c1), direction) * dot(cross(c0, c1), centerDirection) >= 0.0
		&& dot(cross(c1, c2), direction) * dot(cross(c1, c2), centerDirection) >= 0.0
		&& dot(cross(c2, c3), direction) * dot(cross(c2, c3), centerDirection) >= 0.0
		&& dot(cross(c3, c0), direction) * dot(cross(c3, c0), centerDirection) >= 0.0;
}

float stellarPixelSolidAngle(vec2 uv) {
	vec2 halfPixel = 0.5 / max(uViewportSizePixels, vec2(1.0));
	vec3 c0 = reconstructViewRay(uv + vec2(-halfPixel.x, -halfPixel.y)).direction;
	vec3 c1 = reconstructViewRay(uv + vec2( halfPixel.x, -halfPixel.y)).direction;
	vec3 c2 = reconstructViewRay(uv + vec2( halfPixel.x,  halfPixel.y)).direction;
	vec3 c3 = reconstructViewRay(uv + vec2(-halfPixel.x,  halfPixel.y)).direction;
	return stellarTriangleSolidAngle(c0, c1, c2) + stellarTriangleSolidAngle(c0, c2, c3);
}`),
				createShaderSourceBlock('celestial-stellar-point-set-live-evaluate', 'evaluateCelestialRadiance', 2, `void evaluateStellarPointSetRadiance(inout ShaderState state) {
	if (state.sceneHitMask > 0.5) return;
	float pixelSolidAngle = stellarPixelSolidAngle(state.uv);
	if (!(pixelSolidAngle > 0.0)) return;
	for (int memberIndex = 0; memberIndex < STELLAR_POINT_MEMBER_COUNT; memberIndex += 1) {
		vec3 directionToStar = STELLAR_POINT_DIRECTIONS[memberIndex];
		if (!stellarDirectionInsidePixel(directionToStar, state.uv, state.ray.direction)) continue;
		CelestialCacheBilinearStencil stencil = resolveCelestialCacheStencil(state.ray.originMeters, directionToStar);
		if (!stencil.valid) continue;
		SpectralValue irradiance = sampleStellarPointSetIrradiance(memberIndex, stencil);
		for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
			state.celestialRadiance.c[channelIndex] += irradiance.c[channelIndex] / pixelSolidAngle;
		}
	}
}`),
			],
			mainHooks: [createShaderSourceBlock('celestial-stellar-point-set-live-main', 'evaluateCelestialRadiance', 1, 'evaluateStellarPointSetRadiance(state);')],
		});
	}

	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._artifact.dispose();
	}
}

export default StellarPointSetGpuCache;
