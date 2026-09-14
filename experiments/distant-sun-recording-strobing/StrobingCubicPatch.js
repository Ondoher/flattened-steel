/** Contained, fail-closed instrumentation of the frozen production bundle. */
export class StrobingCubicPatch {
	/** @param {string} source @param {string} before @param {string} after @returns {string} */
	static replaceOnce(source, before, after) {
		if (source.split(before).length !== 2)
			throw new Error(`Cubic patch anchor is not unique: ${before.slice(0, 100)}`);
		return source.replace(before, after);
	}

	/** @param {string} source @returns {StrobingBundlePatch} */
	static apply(source) {
		const injection = `DistantSunSharedCacheController.prototype._window = ${StrobingCubicPatch.window.toString().replace(/^window\(/u, 'function(')};\n`;
		source = this.replaceOnce(
			source,
			'const application = new Flat32Application(root, {',
			`${injection}const application = new Flat32Application(root, {`,
		);
		source = this.replaceOnce(
			source,
			'const required = this._graph.scenes[sceneOrdinal].requiredBlockIds;',
			'const required = window.ids;',
		);
		source = this.replaceOnce(
			source,
			'candidate.atlas?.protect(candidate.snapshot.requiredBlockIds, candidate.predictedBlockIds,',
			'candidate.atlas?.protect(candidate.predictedBlockIds, candidate.predictedBlockIds,',
		);
		const first = source.indexOf('int distantScenePackedRow(int altitudeIndex, int solarZenithIndex) {');
		const last = source.indexOf('vec3 distantSceneLeastAlignedAxis', first);
		if (first < 0 || last < first) throw new Error('Shared lookup header is missing.');
		source = this.replaceOnce(source, source.slice(first, last), this.helpers());
		const bodyFirst = source.indexOf('\tint lowerZenithIndex = int(floor(zenithCoordinate));', first);
		const bodyLast = source.indexOf('\tfloat unsupportedValue = uintBitsToFloat(0x7fc00000u);', bodyFirst);
		if (bodyFirst < first || bodyLast < bodyFirst) throw new Error('Shared linear interpolation body is missing.');
		source = this.replaceOnce(source, source.slice(bodyFirst, bodyLast), this.lookup());
		return {source, injection};
	}

	/** Required complete five-scene support, preserving the existing atlas transaction owner.
	 * @this {StrobingCubicController}
	 * @param {number} ordinal @param {DistantSunSharedCacheSceneRequest} options
	 * @returns {StrobingCubicWindow}
	 */
	static window(ordinal, options) {
		if (this._layers !== 24) throw new Error('Cubic proof requires the admitted 24-layer policy.');
		if (options.routeIndex !== undefined && this._route[options.routeIndex] !== ordinal)
			throw new Error('Cubic route position differs from the requested scene.');
		const ids = new Set(this._graph.scenes[ordinal].requiredBlockIds);
		for (const offset of [-1, 1, -2, 2]) {
			const scene = this._graph.scenes[ordinal + offset];
			if (scene) for (const id of scene.requiredBlockIds) ids.add(id);
		}
		if (ids.size > this._layers) throw new Error('Cubic support exceeds the admitted atlas.');
		return {ids: [...ids], predicted: -1};
	}

	/** @returns {string} - Coordinate lookup and shape-preserving cubic equations. */
	static helpers() {
		return `uvec2 strobingAddress(int altitudeIndex, int solarZenithIndex) {
 for (int tap = 0; tap < 5; tap += 1) {
  int offset = tap == 0 ? 0 : (tap == 1 ? -1 : (tap == 2 ? 1 : (tap == 3 ? -2 : 2)));
  int scene = uDistantSunSharedScene + offset;
  if (scene < 0 || scene > 108) continue;
  ivec3 ledger = texelFetch(uDistantSunSharedAltitudes, ivec2(altitudeIndex, scene), 0).rgb;
  if (solarZenithIndex < ledger.x || solarZenithIndex > ledger.y) continue;
  uvec2 address = texelFetch(uDistantSunSharedRows, ivec2(ledger.z + solarZenithIndex - ledger.x, scene), 0).rg;
  if (address.x != 65535u && address.y != 65535u) return address;
 }
 return uvec2(65535u);
}

vec4 strobingPacket(uvec2 address, vec3 coordinate, int plane) {
 float x = (float(plane) * 162.0 + coordinate.x * 27.0 + coordinate.y + 0.5) / 648.0;
 float y = (float(address.y) * 27.0 + coordinate.z + 0.5) / 1728.0;
 return texture(uDistantSunSharedPackets, vec3(x, y, float(address.x)));
}

float strobingSlope(float left, float right) {
 if (left * right <= 0.0) return 0.0;
 return 2.0 * left * right / (left + right);
}

vec4 strobingHermite(vec4 a, vec4 b, vec4 c, vec4 d, float t) {
 vec4 left = b - a, middle = c - b, right = d - c;
 vec4 m0, m1;
 for (int component = 0; component < 4; component += 1) {
  m0[component] = strobingSlope(left[component], middle[component]);
  m1[component] = strobingSlope(middle[component], right[component]);
 }
 float t2 = t * t, t3 = t2 * t;
 return (2.0*t3 - 3.0*t2 + 1.0)*b + (t3 - 2.0*t2 + t)*m0
      + (-2.0*t3 + 3.0*t2)*c + (t3 - t2)*m1;
}

`;
	}

	/** @returns {string} - Eight-row Native15 sampling; no image or time-domain filtering. */
	static lookup() {
		return ` int lowerZenithIndex = int(floor(zenithCoordinate));
 float fraction = zenithCoordinate - float(lowerZenithIndex);
 vec4 density0 = vec4(0.0), density1 = vec4(0.0), density2 = vec4(0.0), density3 = vec4(0.0);
 bool supported = true;
 for (int altitudeTap = 0; altitudeTap < 2; altitudeTap += 1) {
  float altitudeWeight = altitudeStencil.weights[altitudeTap];
  if (altitudeWeight <= 0.0) continue;
  int altitudeIndex = altitudeStencil.indices[altitudeTap];
  uvec2 addresses[4];
  for (int tap = 0; tap < 4; tap += 1)
   addresses[tap] = strobingAddress(altitudeIndex, clamp(lowerZenithIndex + tap - 1, 0, 179));
  if (addresses[1].x == 65535u || addresses[2].x == 65535u) { supported = false; continue; }
  for (int plane = 0; plane < 4; plane += 1) {
   vec4 b = strobingPacket(addresses[1], directionCoordinate, plane);
   vec4 c = strobingPacket(addresses[2], directionCoordinate, plane);
   vec4 a = addresses[0].x == 65535u ? 2.0*b-c : strobingPacket(addresses[0], directionCoordinate, plane);
   vec4 d = addresses[3].x == 65535u ? 2.0*c-b : strobingPacket(addresses[3], directionCoordinate, plane);
   vec4 value = altitudeWeight * strobingHermite(a, b, c, d, fraction);
   if (plane == 0) density0 += value;
   else if (plane == 1) density1 += value;
   else if (plane == 2) density2 += value;
   else density3 += value;
  }
 }
`;
	}
}
