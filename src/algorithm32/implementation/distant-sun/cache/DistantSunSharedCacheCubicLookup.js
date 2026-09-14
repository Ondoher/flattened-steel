import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	SOLAR_ZENITH_180_DOMAIN_OWNER,
} from '../../../sampling-domains/index.js';
import {DISTANT_SUN_SHARED_CACHE_UNAVAILABLE_ROW_ADDRESS} from './consts.js';
import {DistantSunSolarInterpolation} from './DistantSunSolarInterpolation.js';

/** Cubic packet lookup shared by the production facade and matched GPU qualification. */
export const DistantSunSharedCacheCubicLookup = {
	/** Emit domain- and packet-contract-derived sampling functions.
	 * @returns {string} - GLSL using the production packet and coordinate-address samplers.
	 */
	createShaderSource() {
		const faceWidth = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.faceWidth;
		const planeWidth = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.directionCount / faceWidth;
		const lastIndex = SOLAR_ZENITH_180_DOMAIN_OWNER.count - 1;
		return `${DistantSunSolarInterpolation.createShaderSource()}
vec4 distantCubicPacket(uvec2 address, vec3 coordinate, int plane) {
	// Keep bilinear weights in highp arithmetic rather than hardware subtexel filtering.
	vec2 node = clamp(coordinate.yz, vec2(0.0), vec2(${faceWidth - 1}.0));
	ivec2 lower = ivec2(floor(node));
	ivec2 upper = min(lower + ivec2(1), ivec2(${faceWidth - 1}));
	vec2 fraction = node - vec2(lower);
	ivec2 origin = ivec2(plane * ${planeWidth} + int(coordinate.x) * ${faceWidth}, int(address.y) * ${faceWidth});
	int layer = int(address.x);
	vec4 lowerV = mix(
		texelFetch(uDistantSunSharedPackets, ivec3(origin + lower, layer), 0),
		texelFetch(uDistantSunSharedPackets, ivec3(origin + ivec2(upper.x, lower.y), layer), 0), fraction.x);
	vec4 upperV = mix(
		texelFetch(uDistantSunSharedPackets, ivec3(origin + ivec2(lower.x, upper.y), layer), 0),
		texelFetch(uDistantSunSharedPackets, ivec3(origin + upper, layer), 0), fraction.x);
	return mix(lowerV, upperV, fraction.y);
}
vec4 distantCubicDensity(int altitudeIndex, vec3 directionCoordinate, float zenithCoordinate, int plane, out bool supported) {
	int lowerIndex = min(int(floor(zenithCoordinate)), ${lastIndex - 1});
	float fraction = zenithCoordinate - float(lowerIndex);
	uvec2 addresses[4];
	supported = true;
	for (int tap = 0; tap < 4; tap += 1) {
		int zenithIndex = clamp(lowerIndex + tap - 1, 0, ${lastIndex});
		addresses[tap] = texelFetch(uDistantSunSharedCoordinates, ivec2(zenithIndex, altitudeIndex), 0).rg;
		if (any(equal(addresses[tap], uvec2(${DISTANT_SUN_SHARED_CACHE_UNAVAILABLE_ROW_ADDRESS}u)))) supported = false;
	}
	if (!supported) return vec4(0.0);
	return distantSolarHermite(
		distantCubicPacket(addresses[0], directionCoordinate, plane),
		distantCubicPacket(addresses[1], directionCoordinate, plane),
		distantCubicPacket(addresses[2], directionCoordinate, plane),
		distantCubicPacket(addresses[3], directionCoordinate, plane),
		fraction, lowerIndex == 0, lowerIndex + 1 == ${lastIndex});
}
`;
	},

	/** Emit the altitude interpolation that surrounds the cubic solar lookup.
	 * @returns {string} - Spectral density accumulators and explicit support state.
	 */
	createSampleBody() {
		return `
	bool supported = true;
	vec4 density0 = vec4(0.0), density1 = vec4(0.0), density2 = vec4(0.0), density3 = vec4(0.0);
	for (int altitudeTap = 0; altitudeTap < 2; altitudeTap += 1) {
		float weight = altitudeStencil.weights[altitudeTap];
		if (weight <= 0.0) continue;
		for (int plane = 0; plane < 4; plane += 1) {
			bool available;
			vec4 value = weight * distantCubicDensity(altitudeStencil.indices[altitudeTap], directionCoordinate, zenithCoordinate, plane, available);
			supported = supported && available;
			if (plane == 0) density0 += value;
			else if (plane == 1) density1 += value;
			else if (plane == 2) density2 += value;
			else density3 += value;
		}
	}
`;
	},
};
