import {ShaderContributions} from '../../../shader-assembly/base/ShaderContributions.js';

const SCENE_CACHE_VALUE_KEY = 'cache.sceneCumulativeScatteringDensity';
const SCENE_DIRECTION_INDEX_VALUE_KEY = 'cache.sceneLogicalToUniqueDirection';
const SCENE_CACHE_SAMPLER_NAME = 'uDistantSunSceneCumulativeCache';
const SCENE_DIRECTION_INDEX_SAMPLER_NAME = 'uDistantSunLogicalToUniqueDirection';

/** Resident point-local distant-Sun cache loaded from one exact offline asset. */
export default class DistantSunSceneCache {
	/** @type {DistantSunSceneCacheAcceptedManifest} */ _manifest;
	/** @type {DistantSunSceneCacheLedger} */ _ledger;
	/** @type {CacheImmutableTexture} */ _cumulativeTexture;
	/** @type {CacheImmutableTexture} */ _directionIndexTexture;
	/** @type {CacheRuntimeBindings} */ _runtimeBindings;
	/** @type {DistantSunSceneCacheResourceReport} */ _resources;
	/** @type {boolean} */ _disposed = false;
	/** Number of explicit spectral channels represented by the atlas. @type {number} */ _spectralChannelCount;
	/** Explicit shader interpolation preserves weights beyond texture-filter precision. @type {boolean} */ _shaderInterpolation;

	/**
	 * @param {DistantSunSceneCacheDefinition} definition - Accepted manifest, ledger, and uploaded textures.
	 */
	constructor(definition) {
		const interpolation = definition.directionInterpolation ?? 'texture-bilinear';
		if (!['texture-bilinear', 'shader-bilinear'].includes(interpolation)) {
			throw new RangeError('Distant-Sun scene cache direction interpolation is unsupported.');
		}
		this._shaderInterpolation = interpolation === 'shader-bilinear';
		this._spectralChannelCount = definition.spectralChannelCount ?? 15;
		if (
			!Number.isInteger(this._spectralChannelCount) ||
			this._spectralChannelCount < 1 ||
			this._spectralChannelCount > 64
		) {
			throw new RangeError('Distant-Sun scene cache requires between 1 and 64 spectral channels.');
		}
		if (definition.ledger.rows.length !== 48) {
			throw new RangeError('Distant-Sun scene cache requires all 48 Native altitude ledger owners.');
		}
		if (
			definition.cumulativeTexture.storage.format !== 'RGBA32F' ||
			definition.cumulativeTexture.storage.width !== 162 * Math.ceil(this._spectralChannelCount / 4) ||
			definition.cumulativeTexture.storage.height !== 27 ||
			definition.cumulativeTexture.storage.layers !== definition.ledger.retainedBlockCount
		) {
			throw new RangeError('Distant-Sun scene cache cumulative texture shape is incompatible.');
		}
		if (
			definition.directionIndexTexture.storage.format !== 'R16UI' ||
			definition.directionIndexTexture.storage.width !== 4374 ||
			definition.directionIndexTexture.storage.height !== 1 ||
			definition.directionIndexTexture.storage.layers !== 1
		) {
			throw new RangeError('Distant-Sun scene cache direction-index texture shape is incompatible.');
		}
		if (definition.cumulativeTexture.backendId !== definition.directionIndexTexture.backendId) {
			throw new TypeError('Distant-Sun scene cache textures must share one backend owner.');
		}

		this._manifest = definition.manifest;
		this._ledger = definition.ledger;
		this._cumulativeTexture = definition.cumulativeTexture;
		this._directionIndexTexture = definition.directionIndexTexture;
		this._runtimeBindings = {
			backendId: definition.cumulativeTexture.backendId,
			bindings: [definition.cumulativeTexture.runtimeBinding, definition.directionIndexTexture.runtimeBinding],
		};
		const residentBytes =
			definition.cumulativeTexture.storage.width *
				definition.cumulativeTexture.storage.height *
				definition.cumulativeTexture.storage.layers *
				4 *
				Float32Array.BYTES_PER_ELEMENT +
			definition.directionIndexTexture.storage.width * Uint16Array.BYTES_PER_ELEMENT;
		this._resources = {
			residentTextureBytes: {value: residentBytes, units: 'bytes'},
			hostStagingBytes: {
				value:
					residentBytes +
					this._manifest.record.exactSeamPayload.byteLength +
					this._manifest.record.logicalToUniqueIndex.byteLength,
				units: 'bytes',
			},
		};
	}

	/** Exact complete-cache compatibility identity. */
	get cacheIdentity() {
		return this._manifest.record.cacheIdentity;
	}

	/** Exact logical resident and host-staging payloads, excluding opaque driver overhead. */
	get resources() {
		return this._resources;
	}

	/** @returns {CacheRuntimeBindings} - Both opaque resident texture bindings. */
	getRuntimeBindings() {
		if (this._disposed) throw new Error('DistantSunSceneCache is disposed.');
		return this._runtimeBindings;
	}

	/** @returns {ShaderContribution} - Point-local 16-tap exact-seam lookup contribution. */
	createShaderContribution() {
		if (this._disposed) throw new Error('DistantSunSceneCache is disposed.');
		const firstZenith = this._ledger.rows.map((row) => row.firstSolarZenithIndex).join(', ');
		const lastZenith = this._ledger.rows.map((row) => row.lastSolarZenithIndex).join(', ');
		const firstPacked = this._ledger.rows.map((row) => row.firstPackedRow).join(', ');
		const groups = Array.from({length: Math.ceil(this._spectralChannelCount / 4)}, (_unused, index) => index);
		const atlasWidth = groups.length * 162;
		const declarations = groups.map((index) => `\tvec4 density${index} = vec4(0.0);`).join('\n');
		const samples = groups
			.map((index) =>
				this._shaderInterpolation
					? `\t\tdensity${index} += weight * distantSceneBilinear(${index * 162} + int(faceOffset), directionCoordinate.yz, packedRows[rowTap]);`
					: `\t\tdensity${index} += weight * texture(${SCENE_CACHE_SAMPLER_NAME}, vec3((${index === 0 ? '' : `${index * 162}.0 + `}faceOffset + directionCoordinate.y + 0.5) / ${atlasWidth}.0, atlasY, atlasLayer));`,
			)
			.join('\n');
		const interpolationHelper = this._shaderInterpolation
			? `// Range-reduced atan series: |r| <= tan(pi/8), remainder <= |r|^19/19.
// This avoids driver-dependent acos/atan approximation in interpolation coordinates.
float distantSceneSolarZenith(vec3 up, vec3 source) {
	float cosine = dot(up, source);
	float sine = length(cross(up, source));
	float absoluteCosine = abs(cosine);
	float ratio = min(sine, absoluteCosine) / max(max(sine, absoluteCosine), 1.0e-20);
	bool reduced = ratio > 0.414213562373095;
	float r = reduced ? (ratio - 1.0) / (ratio + 1.0) : ratio;
	float square = r * r;
	float polynomial = 1.0 / 17.0;
	polynomial = -1.0 / 15.0 + square * polynomial;
	polynomial = 1.0 / 13.0 + square * polynomial;
	polynomial = -1.0 / 11.0 + square * polynomial;
	polynomial = 1.0 / 9.0 + square * polynomial;
	polynomial = -1.0 / 7.0 + square * polynomial;
	polynomial = 1.0 / 5.0 + square * polynomial;
	polynomial = -1.0 / 3.0 + square * polynomial;
	float angle = r * (1.0 + square * polynomial);
	if (reduced) angle += 0.7853981633974483;
	if (sine > absoluteCosine) angle = 1.5707963267948966 - angle;
	return cosine < 0.0 ? 3.141592653589793 - angle : angle;
}

vec4 distantSceneBilinear(int faceOffset, vec2 grid, int layer) {
	ivec2 lower = ivec2(floor(grid));
	ivec2 upper = min(lower + ivec2(1), ivec2(26));
	vec2 fraction = grid - vec2(lower);
	vec4 p00 = texelFetch(${SCENE_CACHE_SAMPLER_NAME}, ivec3(faceOffset + lower.x, lower.y, layer), 0);
	vec4 p10 = texelFetch(${SCENE_CACHE_SAMPLER_NAME}, ivec3(faceOffset + upper.x, lower.y, layer), 0);
	vec4 p01 = texelFetch(${SCENE_CACHE_SAMPLER_NAME}, ivec3(faceOffset + lower.x, upper.y, layer), 0);
	vec4 p11 = texelFetch(${SCENE_CACHE_SAMPLER_NAME}, ivec3(faceOffset + upper.x, upper.y, layer), 0);
	return mix(mix(p00, p10, fraction.x), mix(p01, p11, fraction.x), fraction.y);
}`
			: '';
		const assignments = Array.from(
			{length: this._spectralChannelCount},
			(_unused, index) =>
				`\tdensity.channels[${index}] = supported ? density${Math.floor(index / 4)}.${'xyzw'[index % 4]} : unsupportedValue;`,
		).join('\n');

		return ShaderContributions.createShaderContribution({
			id: 'cache-distant-sun-point-local-scene',
			owner: 'cache',
			provides: ['cache.sampleCumulativeScatteringDensity'],
			requires: [
				'geometry.scatteringCacheStencilTypes',
				'geometry.resolveScatteringCachePositionStencil',
				'light.directionToAtmosphericSource',
			],
			textures: [
				ShaderContributions.createShaderTextureDeclaration(
					SCENE_CACHE_SAMPLER_NAME,
					'sampler2DArray',
					SCENE_CACHE_VALUE_KEY,
				),
				ShaderContributions.createShaderTextureDeclaration(
					SCENE_DIRECTION_INDEX_SAMPLER_NAME,
					'usampler2D',
					SCENE_DIRECTION_INDEX_VALUE_KEY,
				),
			],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'cache-distant-sun-scene-lookup',
					'sampleScatteringCache',
					0,
					`const int DISTANT_SCENE_FIRST_ZENITH[48] = int[48](${firstZenith});
const int DISTANT_SCENE_LAST_ZENITH[48] = int[48](${lastZenith});
const int DISTANT_SCENE_FIRST_PACKED_ROW[48] = int[48](${firstPacked});

int distantScenePackedRow(int altitudeIndex, int solarZenithIndex) {
	int firstZenith = DISTANT_SCENE_FIRST_ZENITH[altitudeIndex];
	int lastZenith = DISTANT_SCENE_LAST_ZENITH[altitudeIndex];
	if (solarZenithIndex < firstZenith || solarZenithIndex > lastZenith) return -1;
	return DISTANT_SCENE_FIRST_PACKED_ROW[altitudeIndex] + solarZenithIndex - firstZenith;
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

${interpolationHelper}

SpectralValue sampleCumulativeScatteringDensity(
	vec3 positionMeters,
	AtmosphereCoordinate atmosphereCoordinate,
	vec3 physicalOutgoingDirection
) {
	CachePositionStencil altitudeStencil =
		resolveScatteringCachePositionStencil(atmosphereCoordinate);
	vec3 directionToSource = directionToAtmosphericSource(positionMeters);
	vec3 directionCoordinate = distantSceneDirectionCoordinate(distantSceneLocalOutgoingDirection(
		positionMeters,
		directionToSource,
		physicalOutgoingDirection
	));
	float muS = clamp(dot(normalize(positionMeters), directionToSource), -1.0, 1.0);
	float solarZenith = ${this._shaderInterpolation ? 'distantSceneSolarZenith(normalize(positionMeters), directionToSource)' : 'acos(muS)'};
	float zenithCoordinate = clamp((solarZenith - 0.008726646259971648) / 0.017453292519943295, 0.0, 179.0);
	int lowerZenithIndex = int(floor(zenithCoordinate));
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
${declarations}
	for (int rowTap = 0; rowTap < 4; rowTap += 1) {
		if (altitudeZenithWeights[rowTap] <= 0.0 || packedRows[rowTap] < 0) continue;
		float weight = altitudeZenithWeights[rowTap];
		float faceOffset = directionCoordinate.x * 27.0;
		float atlasY = (directionCoordinate.z + 0.5) / 27.0;
		float atlasLayer = float(packedRows[rowTap]);
${samples}
	}
	float unsupportedValue = uintBitsToFloat(0x7fc00000u);
	SpectralValue density;
${assignments}
	return density;
}`,
				),
			],
			bindingRequirements: [
				ShaderContributions.createShaderBindingRequirement(
					'cache.distant-scene-cumulative',
					'cache',
					'texture',
					'setup',
					SCENE_CACHE_VALUE_KEY,
					true,
				),
				ShaderContributions.createShaderBindingRequirement(
					'cache.distant-scene-direction-index',
					'cache',
					'texture',
					'setup',
					SCENE_DIRECTION_INDEX_VALUE_KEY,
					true,
				),
			],
		});
	}

	/** Release both immutable textures exactly once. */
	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		let firstError = null;
		for (const texture of [this._directionIndexTexture, this._cumulativeTexture]) {
			try {
				texture.dispose();
			} catch (error) {
				firstError ??= error;
			}
		}
		if (firstError) throw firstError;
	}
}
