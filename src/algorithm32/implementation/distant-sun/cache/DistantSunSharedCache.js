import {ShaderContributions} from '../../../shader-assembly/base/ShaderContributions.js';
import {SOLAR_ZENITH_180_DOMAIN_OWNER} from '../../../sampling-domains/index.js';
import {DistantSunSharedCacheCubicLookup} from './DistantSunSharedCacheCubicLookup.js';

/** Stable packet lookup and live publication surface; the controller owns its resources.
 * @implements {GpuScatteringCache}
 */
export default class DistantSunSharedCache {
	/** Renderer owner identity. @type {string} */
	_backendId;
	/** Renderer-owned typed zero placeholders required by active WebGL sampler types. @type {(CachePersistentArray | CacheImmutableTexture)[]} */
	_zeros = [];
	/** Borrowed complete publication. @type {DistantSunSharedCacheFrame} */
	_frame;
	/** Terminal logical state. */
	_disposed = false;

	/** Creates a stable cache facade from an initial complete frame.
	 * @param {CachePacketAtlasBackend} backend - Renderer owner capability.
	 * @param {DistantSunSharedCacheFrame} frame - Borrowed initial frame.
	 */
	constructor(backend, frame) {
		this._backendId = backend.id;
		this._frame = frame;
		try {
			if (frame.solarInterpolation === 'monotone-cubic') {
				this._zeros.push(
					backend.uploadImmutableTexture({
						id: 'shared-zero-coordinates',
						valueKey: 'cache.sharedCoordinateAddress',
						storage: {format: 'RG16UI', width: 1, height: 1, layers: 1},
						values: new Uint16Array(2),
					}),
				);
			}
			const packet = backend.allocatePersistentArray({
				id: 'shared-zero-packet',
				valueKey: 'cache.sharedPacketAtlas',
				storage: {format: 'RGBA32F', width: 1, height: 1, layers: 1},
				maximumBytes: 16,
			});
			this._zeros.push(packet);
			backend.uploadPersistentArrayLayer({
				array: packet,
				layer: 0,
				identity: 'zero',
				values: new Float32Array(4),
			});
			this._zeros.push(
				backend.uploadImmutableTexture({
					id: 'shared-zero-row',
					valueKey: 'cache.sharedRowAddress',
					storage: {format: 'RG16UI', width: 1, height: 1, layers: 1},
					values: new Uint16Array(2),
				}),
			);
			this._zeros.push(
				backend.uploadImmutableTexture({
					id: 'shared-zero-ledger',
					valueKey: 'cache.sharedAltitudeLedger',
					storage: {format: 'RGBA32I', width: 1, height: 1, layers: 1},
					values: new Int32Array(4),
				}),
			);
		} catch (error) {
			for (const resource of this._zeros) resource.dispose();
			throw error;
		}
	}

	/** Call this method to replace the complete visible frame without changing shader source.
	 * @param {DistantSunSharedCacheFrame} frame - Validated controller publication.
	 * @returns {void}
	 */
	publish(frame) {
		if (this._disposed) throw new Error('Shared cache is disposed.');
		if ((frame.solarInterpolation ?? 'linear') !== (this._frame.solarInterpolation ?? 'linear'))
			throw new RangeError('Shared cache cannot change interpolation contracts within one facade.');
		if (frame.bindings.some((binding) => binding.backendId !== this._backendId))
			throw new TypeError('Shared cache publication has a foreign binding.');
		this._frame = frame;
	}

	/** Call this method to read the current complete opaque texture bindings.
	 * @returns {CacheRuntimeBindings} - Current renderer bindings.
	 */
	getRuntimeBindings() {
		return {
			backendId: this._backendId,
			bindings:
				this._frame.snapshot.status === 'dark'
					? this._zeros.map((resource) => resource.runtimeBinding)
					: this._frame.bindings,
		};
	}

	/** Call this method to read one coherent live binding publication.
	 * @returns {CacheRuntimePublication} - Stable identity, opaque bindings, and cache-owned scalar values.
	 */
	getRuntimePublication() {
		return {
			identity: 'shared:' + this._frame.snapshot.generation,
			bindings: this.getRuntimeBindings(),
			values: {
				'cache.sharedSceneOrdinal': this._frame.snapshot.sceneOrdinal ?? 0,
				'cache.sharedDark': this._frame.snapshot.status === 'dark' ? 1 : 0,
			},
		};
	}

	/** Call this method to emit the production four-RGBA-read Native15 lookup with explicit row indirection.
	 * @returns {ShaderContribution} - Stable source independent of selected scene.
	 */
	createShaderContribution() {
		const cubic = this._frame.solarInterpolation === 'monotone-cubic';
		return ShaderContributions.createShaderContribution({
			id: cubic ? 'cache-distant-sun-shared-cubic-packets-v1' : 'cache-distant-sun-shared-packets',
			owner: 'cache',
			provides: ['cache.sampleCumulativeScatteringDensity'],
			requires: [
				'geometry.scatteringCacheStencilTypes',
				'geometry.resolveScatteringCachePositionStencil',
				'light.directionToAtmosphericSource',
			],
			uniforms: [
				ShaderContributions.createShaderUniformDeclaration(
					'uDistantSunSharedScene',
					'int',
					'cache.sharedSceneOrdinal',
					this._frame.snapshot.sceneOrdinal ?? 0,
				),
				ShaderContributions.createShaderUniformDeclaration(
					'uDistantSunSharedDark',
					'int',
					'cache.sharedDark',
					this._frame.snapshot.status === 'dark' ? 1 : 0,
				),
			],
			textures: [
				...(cubic
					? [
							ShaderContributions.createShaderTextureDeclaration(
								'uDistantSunSharedCoordinates',
								'usampler2D',
								'cache.sharedCoordinateAddress',
							),
						]
					: []),
				ShaderContributions.createShaderTextureDeclaration(
					'uDistantSunSharedPackets',
					'sampler2DArray',
					'cache.sharedPacketAtlas',
				),
				ShaderContributions.createShaderTextureDeclaration(
					'uDistantSunSharedRows',
					'usampler2D',
					'cache.sharedRowAddress',
				),
				ShaderContributions.createShaderTextureDeclaration(
					'uDistantSunSharedAltitudes',
					'isampler2D',
					'cache.sharedAltitudeLedger',
				),
			],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'cache-distant-sun-shared-lookup',
					'sampleScatteringCache',
					0,
					`${cubic ? DistantSunSharedCacheCubicLookup.createShaderSource() : ''}
int distantScenePackedRow(int altitudeIndex, int solarZenithIndex) {
 ivec3 ledger = texelFetch(uDistantSunSharedAltitudes, ivec2(altitudeIndex, uDistantSunSharedScene), 0).rgb;
 if (solarZenithIndex < ledger.x || solarZenithIndex > ledger.y) return -1;
 return ledger.z + solarZenithIndex - ledger.x;
}

vec3 distantSceneLeastAlignedAxis(vec3 direction) {
	vec3 selected = vec3(1.0, 0.0, 0.0);
	if (abs(direction.y) < abs(dot(selected, direction))) selected = vec3(0.0, 1.0, 0.0);
	if (abs(direction.z) < abs(dot(selected, direction))) selected = vec3(0.0, 0.0, 1.0);
	return selected;
}

vec3 distantSceneLocalOutgoingDirection(
	vec3 positionMeters,
	vec3 directionToSource,
	vec3 physicalDirection
) {
	vec3 up = normalize(positionMeters);
	float muS = clamp(dot(up, directionToSource), -1.0, 1.0);
	vec3 xAxis = directionToSource - muS * up;
	if (length(xAxis) <= 1.0e-12) {
		vec3 reference = distantSceneLeastAlignedAxis(up);
		xAxis = reference - dot(reference, up) * up;
	}
	xAxis = normalize(xAxis);
	vec3 yAxis = normalize(cross(up, xAxis));
	vec3 direction = normalize(physicalDirection);
	return vec3(dot(direction, xAxis), dot(direction, yAxis), dot(direction, up));
}

vec3 distantSceneDirectionCoordinate(vec3 direction) {
	int faceIndex = 0;
	float selectedProjection = direction.x;
	if (-direction.x > selectedProjection) { selectedProjection = -direction.x; faceIndex = 1; }
	if (direction.y > selectedProjection) { selectedProjection = direction.y; faceIndex = 2; }
	if (-direction.y > selectedProjection) { selectedProjection = -direction.y; faceIndex = 3; }
	if (direction.z > selectedProjection) { selectedProjection = direction.z; faceIndex = 4; }
	if (-direction.z > selectedProjection) { selectedProjection = -direction.z; faceIndex = 5; }
	float denominator;
	float faceU;
	float faceV;
	if (faceIndex == 0) { denominator = direction.x; faceU = direction.y / denominator; faceV = direction.z / denominator; }
	else if (faceIndex == 1) { denominator = -direction.x; faceU = -direction.y / denominator; faceV = direction.z / denominator; }
	else if (faceIndex == 2) { denominator = direction.y; faceU = -direction.x / denominator; faceV = direction.z / denominator; }
	else if (faceIndex == 3) { denominator = -direction.y; faceU = direction.x / denominator; faceV = direction.z / denominator; }
	else if (faceIndex == 4) { denominator = direction.z; faceU = direction.x / denominator; faceV = direction.y / denominator; }
	else { denominator = -direction.z; faceU = -direction.x / denominator; faceV = direction.y / denominator; }
	float uGrid = clamp((clamp(faceU, -1.0, 1.0) + 1.0) * 13.0, 0.0, 26.0);
	float vGrid = clamp((clamp(faceV, -1.0, 1.0) + 1.0) * 13.0, 0.0, 26.0);
	return vec3(float(faceIndex), uGrid, vGrid);
}

SpectralValue sampleCumulativeScatteringDensity(
	vec3 positionMeters,
	AtmosphereCoordinate atmosphereCoordinate,
	vec3 physicalOutgoingDirection
) {
 if (uDistantSunSharedDark != 0) {
  SpectralValue dark;
  for (int channel = 0; channel < SPECTRAL_CHANNEL_COUNT; channel += 1) dark.channels[channel] = 0.0;
  return dark;
 }
 CachePositionStencil altitudeStencil =
		resolveScatteringCachePositionStencil(atmosphereCoordinate);
	vec3 directionToSource = directionToAtmosphericSource(positionMeters);
	vec3 directionCoordinate = distantSceneDirectionCoordinate(distantSceneLocalOutgoingDirection(
		positionMeters,
		directionToSource,
		physicalOutgoingDirection
	));
	float muS = clamp(dot(normalize(positionMeters), directionToSource), -1.0, 1.0);
	float zenithCoordinate = clamp((acos(muS) - ${SOLAR_ZENITH_180_DOMAIN_OWNER.firstCenter.value}) / ${SOLAR_ZENITH_180_DOMAIN_OWNER.spacing.value}, 0.0, ${SOLAR_ZENITH_180_DOMAIN_OWNER.count - 1}.0);
${
	cubic
		? DistantSunSharedCacheCubicLookup.createSampleBody()
		: `	int lowerZenithIndex = int(floor(zenithCoordinate));
	int upperZenithIndex = int(ceil(zenithCoordinate));
	float upperZenithWeight = zenithCoordinate - float(lowerZenithIndex);
	ivec2 zenithIndices = ivec2(lowerZenithIndex, upperZenithIndex);
	vec2 zenithWeights = vec2(1.0 - upperZenithWeight, upperZenithWeight);
	ivec4 packedRows = ivec4(
		distantScenePackedRow(altitudeStencil.indices.x, zenithIndices.x),
		distantScenePackedRow(altitudeStencil.indices.x, zenithIndices.y),
		distantScenePackedRow(altitudeStencil.indices.y, zenithIndices.x),
		distantScenePackedRow(altitudeStencil.indices.y, zenithIndices.y)
	);
	vec4 altitudeZenithWeights = vec4(
		altitudeStencil.weights.x * zenithWeights.x,
		altitudeStencil.weights.x * zenithWeights.y,
		altitudeStencil.weights.y * zenithWeights.x,
		altitudeStencil.weights.y * zenithWeights.y
	);
	bool supported = true;
	for (int rowTap = 0; rowTap < 4; rowTap += 1) {
		if (altitudeZenithWeights[rowTap] > 0.0 && packedRows[rowTap] < 0) supported = false;
	}
	vec4 density0 = vec4(0.0);
	vec4 density1 = vec4(0.0);
	vec4 density2 = vec4(0.0);
	vec4 density3 = vec4(0.0);
	for (int rowTap = 0; rowTap < 4; rowTap += 1) {
		if (altitudeZenithWeights[rowTap] <= 0.0 || packedRows[rowTap] < 0) continue;
		float weight = altitudeZenithWeights[rowTap];
		float faceOffset = directionCoordinate.x * 27.0;
		uvec2 address = texelFetch(uDistantSunSharedRows, ivec2(packedRows[rowTap], uDistantSunSharedScene), 0).rg;
  if (address.x == 65535u || address.y == 65535u) { supported = false; continue; }
  float atlasY = (float(address.y) * 27.0 + directionCoordinate.z + 0.5) / 1728.0;
  float atlasLayer = float(address.x);
		density0 += weight * texture(uDistantSunSharedPackets, vec3((faceOffset + directionCoordinate.y + 0.5) / 648.0, atlasY, atlasLayer));
		density1 += weight * texture(uDistantSunSharedPackets, vec3((162.0 + faceOffset + directionCoordinate.y + 0.5) / 648.0, atlasY, atlasLayer));
		density2 += weight * texture(uDistantSunSharedPackets, vec3((324.0 + faceOffset + directionCoordinate.y + 0.5) / 648.0, atlasY, atlasLayer));
		density3 += weight * texture(uDistantSunSharedPackets, vec3((486.0 + faceOffset + directionCoordinate.y + 0.5) / 648.0, atlasY, atlasLayer));
	}
`
}
	float unsupportedValue = uintBitsToFloat(0x7fc00000u);
	SpectralValue density;
	density.channels[0] = supported ? density0.x : unsupportedValue;
	density.channels[1] = supported ? density0.y : unsupportedValue;
	density.channels[2] = supported ? density0.z : unsupportedValue;
	density.channels[3] = supported ? density0.w : unsupportedValue;
	density.channels[4] = supported ? density1.x : unsupportedValue;
	density.channels[5] = supported ? density1.y : unsupportedValue;
	density.channels[6] = supported ? density1.z : unsupportedValue;
	density.channels[7] = supported ? density1.w : unsupportedValue;
	density.channels[8] = supported ? density2.x : unsupportedValue;
	density.channels[9] = supported ? density2.y : unsupportedValue;
	density.channels[10] = supported ? density2.z : unsupportedValue;
	density.channels[11] = supported ? density2.w : unsupportedValue;
	density.channels[12] = supported ? density3.x : unsupportedValue;
	density.channels[13] = supported ? density3.y : unsupportedValue;
	density.channels[14] = supported ? density3.z : unsupportedValue;
	return density;
}
`,
				),
			],
		});
	}

	/** Call this method to release typed zero placeholders; the controller owns data-atlas disposal. @returns {void} */
	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		for (const resource of this._zeros) resource.dispose();
		this._zeros = [];
	}
}
