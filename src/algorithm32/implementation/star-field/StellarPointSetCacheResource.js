import {ShaderContributions} from '../../shader-assembly/base/ShaderContributions.js';
import {STELLAR_POINT_SET_CACHE_VALUE_KEY} from '../../celestial-contribution-cache/consts.js';

const SAMPLER_NAME = 'uStellarPointSetTransportCache';

/** Published tiled stellar field and exact-pixel live raster contribution. */
export class StellarPointSetCacheResource {
	constructor({plan, artifact}) {
		this._plan = plan;
		this._artifact = artifact;
		this._disposed = false;
		this.sourceId = plan.sourceId;
		this.memberCount = plan.memberCount;
		this.descriptor = plan.descriptor;
		this.resourceIdentity = plan.identity.contentHash;
	}

	_requireLive() {
		if (this._disposed) throw new Error('Stellar point-set cache resource is disposed.');
	}

	getRuntimeBindings() {
		this._requireLive();
		return this._artifact.runtimeBindings;
	}

	createShaderContribution() {
		this._requireLive();
		const layout = this._plan.layout;
		return ShaderContributions.createShaderContribution({
			id: 'cache-stellar-point-set-tiled-transport',
			owner: 'cache',
			provides: ['cache.sampleStellarPointSetIrradiance'],
			requires: ['geometry.celestialCacheStencilTypes'],
			textures: [
				ShaderContributions.createShaderTextureDeclaration(
					SAMPLER_NAME,
					'sampler2DArray',
					STELLAR_POINT_SET_CACHE_VALUE_KEY,
				),
			],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'cache-stellar-point-set-tiled-lookup',
					'sampleCelestialCache',
					1,
					`SpectralValue sampleStellarPointSetIrradiance(int memberIndex, CelestialCacheBilinearStencil stencil) {
	SpectralValue result = zeroSpectral();
	if (!stencil.valid) return result;
	int tileX = memberIndex % ${layout.tileColumns};
	int tileY = memberIndex / ${layout.tileColumns};
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		for (int receiverTap = 0; receiverTap < 2; receiverTap += 1) {
			for (int directionTap = 0; directionTap < 2; directionTap += 1) {
				int x = tileX * ${layout.directionCount} + stencil.directionIndices[directionTap];
				int y = tileY * ${layout.receiverCount} + stencil.receiverIndices[receiverTap];
				result.channels[channelIndex] += stencil.receiverWeights[receiverTap]
					* stencil.directionWeights[directionTap]
					* texelFetch(${SAMPLER_NAME}, ivec3(x, y, channelIndex), 0).r;
			}
		}
	}
	return result;
}`,
				),
			],
			bindingRequirements: [
				ShaderContributions.createShaderBindingRequirement(
					'cache.stellar-point-set-transport',
					'cache',
					'texture',
					'setup',
					STELLAR_POINT_SET_CACHE_VALUE_KEY,
					true,
				),
			],
		});
	}

	createLiveShaderContribution({queryPacket}) {
		this._requireLive();
		const layout = this._plan.layout;
		const stars = queryPacket?.stars;
		if (
			!stars ||
			stars.placement.sourceId !== this.sourceId ||
			stars.memberDirectionStencils.length !== this.memberCount
		)
			throw new RangeError('Stellar live raster requires its complete spherical query packet.');
		return ShaderContributions.createShaderContribution({
			id: 'celestial-stellar-point-set-live-raster',
			owner: 'celestialCache',
			provides: ['celestial.evaluateStellarPointSetRadiance'],
			requires: [
				'runtime.initialState',
				'runtime.sceneHitTexture',
				'geometry.reconstructViewRay',
				'geometry.resolveStellarPointSetCacheStencil',
				'cache.sampleStellarPointSetIrradiance',
				'celestial.evaluateRadiance',
			],
			uniforms: [
				ShaderContributions.createShaderUniformDeclaration(
					'uStellarPointMemberCount',
					'int',
					'celestial.stellarPointSetMemberCount',
					this.memberCount,
				),
			],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'stellar-point-set-live-constants',
					'declareConstants',
					1,
					`const int STELLAR_POINT_MEMBER_COUNT = ${this.memberCount};`,
				),
				ShaderContributions.createShaderSourceBlock(
					'stellar-point-set-live-functions',
					'evaluateCelestialRadiance',
					1,
					`float stellarTriangleSolidAngle(vec3 a, vec3 b, vec3 c) {
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
}

vec3 stellarPointSetDirection(int memberIndex) {
	int x = memberIndex % ${layout.storage.width};
	int y = ${layout.directionTableRowStart} + memberIndex / ${layout.storage.width};
	return normalize(vec3(
		texelFetch(${SAMPLER_NAME}, ivec3(x, y, 0), 0).r,
		texelFetch(${SAMPLER_NAME}, ivec3(x, y, 1), 0).r,
		texelFetch(${SAMPLER_NAME}, ivec3(x, y, 2), 0).r
	));
}

void addStellarPointSetRadiance(inout SpectralValue celestialRadiance, ShaderState state) {
	if (state.sceneHitMask > 0.5) return;
	float pixelSolidAngle = stellarPixelSolidAngle(state.textureCoordinates);
	if (!(pixelSolidAngle > 0.0)) return;
	for (int memberIndex = 0; memberIndex < uStellarPointMemberCount; memberIndex += 1) {
		vec3 directionToStar = stellarPointSetDirection(memberIndex);
		if (!stellarDirectionInsidePixel(directionToStar, state.textureCoordinates, state.ray.direction)) continue;
		CelestialCacheBilinearStencil stencil = resolveStellarPointSetCacheStencil(directionToStar);
		if (!stencil.valid) continue;
		SpectralValue irradiance = sampleStellarPointSetIrradiance(memberIndex, stencil);
		for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) celestialRadiance.channels[channelIndex] += irradiance.channels[channelIndex] / pixelSolidAngle;
	}
}`,
				),
			],
			mainHooks: [
				ShaderContributions.createShaderSourceBlock(
					'stellar-point-set-live-main',
					'evaluateCelestialRadiance',
					1,
					'addStellarPointSetRadiance(celestialRadiance, state);',
				),
			],
			diagnostics: {
				sourceId: this.sourceId,
				queryIdentity: queryPacket.contentHash,
				memberCount: this.memberCount,
			},
		});
	}

	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._artifact.dispose();
	}
}
