import {ShaderContributions} from '../../../shader-assembly/base/ShaderContributions.js';
import {SOLAR_ZENITH_180_DOMAIN_OWNER} from '../../../sampling-domains/solar-zenith/consts.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../sampling-domains/direction/cubed-sphere/consts.js';
import {DistantSunSolarInterpolation} from './DistantSunSolarInterpolation.js';
import {SphericalNativePositionDomains} from '../../../sampling-domains/position/spherical-native/SphericalNativePositionDomains.js';
import {DistantSunScatteringAccuracy} from './DistantSunScatteringAccuracy.js';

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
	/** Accepted solar-angle sampling policy. @type {DistantSunSolarInterpolationMethod} */ _solarInterpolation;
	/** Accepted scattering/mapping policy. @type {DistantSunScatteringAccuracyMethod} */ _scatteringAccuracy;

	/**
	 * @param {DistantSunSceneCacheDefinition} definition - Accepted manifest, ledger, and uploaded textures.
	 */
	constructor(definition) {
		this._scatteringAccuracy = DistantSunScatteringAccuracy.accept(definition.scatteringAccuracy);
		if (
			this._scatteringAccuracy !==
			DistantSunScatteringAccuracy.accept(definition.manifest.record.scatteringAccuracy)
		)
			throw new RangeError('Distant-Sun dense package and lookup scattering policies differ.');
		const interpolation = definition.directionInterpolation ?? 'texture-bilinear';
		if (!['texture-bilinear', 'shader-bilinear'].includes(interpolation)) {
			throw new RangeError('Distant-Sun scene cache direction interpolation is unsupported.');
		}
		this._shaderInterpolation = interpolation === 'shader-bilinear';
		this._solarInterpolation = definition.solarInterpolation ?? 'linear';
		if (!['linear', 'monotone-cubic'].includes(this._solarInterpolation)) {
			throw new RangeError('Distant-Sun scene cache solar interpolation is unsupported.');
		}
		this._spectralChannelCount = definition.spectralChannelCount ?? 15;
		if (
			!Number.isInteger(this._spectralChannelCount) ||
			this._spectralChannelCount < 1 ||
			this._spectralChannelCount > 64
		) {
			throw new RangeError('Distant-Sun scene cache requires between 1 and 64 spectral channels.');
		}
		const positionDomain = SphericalNativePositionDomains.accept(
			definition.positionDomain ?? SphericalNativePositionDomains.select(),
		);
		if (
			definition.ledger.rows.length !== positionDomain.count ||
			definition.ledger.rows.some(
				(row, index) =>
					row.altitudeIndex !== index ||
					row.altitude.units !== 'meters' ||
					!Object.is(row.altitude.value, positionDomain.nodes[index].coordinate.value),
			)
		) {
			throw new RangeError('Distant-Sun scene cache requires every selected physical altitude ledger owner.');
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

	/** Called by shader construction to sample four complete solar rows at one altitude.
	 * Physical domain endpoints alone use one-sided slopes; missing retained interior
	 * support produces the same unsupported result as the linear cache.
	 *
	 * @param {number} groupCount - Number of RGBA spectral groups in the accepted atlas.
	 * @returns {string} - Cubic GLSL over the existing direction sampler and packed-row owner.
	 */
	_createCubicShaderSource(groupCount) {
		const focused = DistantSunScatteringAccuracy.focus(this._scatteringAccuracy) !== 1;
		const faceWidth = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.faceWidth;
		const planeWidth = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.directionCount / faceWidth;
		const lastIndex = SOLAR_ZENITH_180_DOMAIN_OWNER.count - 1;
		const packetSample = this._shaderInterpolation
			? `distantSceneBilinear(plane * ${planeWidth} + int(coordinate.x) * ${faceWidth}, coordinate.yz, row)`
			: `texture(${SCENE_CACHE_SAMPLER_NAME}, vec3((float(plane * ${planeWidth}) + coordinate.x * ${faceWidth}.0 + coordinate.y + 0.5) / ${groupCount * planeWidth}.0, (coordinate.z + 0.5) / ${faceWidth}.0, float(row)))`;
		return `${DistantSunSolarInterpolation.createShaderSource()}
vec4 distantSceneCubicPacket(int row, vec3 coordinate, int plane) {
	return ${packetSample};
}
vec4 distantSceneCubicDensity(int altitudeIndex, ${focused ? 'vec3 coordinates[4]' : 'vec3 coordinate'}, float zenithCoordinate, int plane, out bool supported) {
	int lowerIndex = min(int(floor(zenithCoordinate)), ${lastIndex - 1});
	float fraction = zenithCoordinate - float(lowerIndex);
	ivec4 rows;
	supported = true;
	for (int tap = 0; tap < 4; tap += 1) {
		int zenithIndex = clamp(lowerIndex + tap - 1, 0, ${lastIndex});
		rows[tap] = distantScenePackedRow(altitudeIndex, zenithIndex);
		if (rows[tap] < 0) supported = false;
	}
	if (!supported) return vec4(0.0);
	return distantSolarHermite(
		distantSceneCubicPacket(rows.x, ${focused ? 'coordinates[0]' : 'coordinate'}, plane),
		distantSceneCubicPacket(rows.y, ${focused ? 'coordinates[1]' : 'coordinate'}, plane),
		distantSceneCubicPacket(rows.z, ${focused ? 'coordinates[2]' : 'coordinate'}, plane),
		distantSceneCubicPacket(rows.w, ${focused ? 'coordinates[3]' : 'coordinate'}, plane),
		fraction, lowerIndex == 0, lowerIndex + 1 == ${lastIndex});
}
`;
	}

	/** Called by shader construction to preserve altitude weights around cubic solar lookup.
	 *
	 * @param {readonly number[]} groups - Accepted RGBA spectral group indices.
	 * @returns {string} - Spectral accumulators and complete support predicate.
	 */
	_createCubicSampleBody(groups) {
		const focused = DistantSunScatteringAccuracy.focus(this._scatteringAccuracy) !== 1;
		return `${
			focused
				? `vec3 directionCoordinates[4];
	int directionLower = min(int(floor(zenithCoordinate)), ${SOLAR_ZENITH_180_DOMAIN_OWNER.count - 2});
	for (int tap = 0; tap < 4; tap += 1)
		directionCoordinates[tap] = distantSunRowCoordinate(outgoingDirection, clamp(directionLower + tap - 1, 0, ${SOLAR_ZENITH_180_DOMAIN_OWNER.count - 1}));`
				: ''
		}
	bool supported = true;
${groups.map((group) => `\tvec4 density${group} = vec4(0.0);`).join('\n')}
	for (int altitudeTap = 0; altitudeTap < 2; altitudeTap += 1) {
		float weight = altitudeStencil.weights[altitudeTap];
		if (weight <= 0.0) continue;
		bool available;
${groups
	.map(
		(
			group,
		) => `\t\tdensity${group} += weight * distantSceneCubicDensity(altitudeStencil.indices[altitudeTap], ${focused ? 'directionCoordinates' : 'directionCoordinate'}, zenithCoordinate, ${group}, available);
\t\tsupported = supported && available;`,
	)
	.join('\n')}
	}`;
	}

	/** @returns {ShaderContribution} - Point-local 16-tap exact-seam lookup contribution. */
	createShaderContribution() {
		if (this._disposed) throw new Error('DistantSunSceneCache is disposed.');
		const focused = DistantSunScatteringAccuracy.focus(this._scatteringAccuracy) !== 1;
		const firstZenith = this._ledger.rows.map((row) => row.firstSolarZenithIndex).join(', ');
		const lastZenith = this._ledger.rows.map((row) => row.lastSolarZenithIndex).join(', ');
		const firstPacked = this._ledger.rows.map((row) => row.firstPackedRow).join(', ');
		const altitudeCount = this._ledger.rows.length;
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

		const samplingBody =
			this._solarInterpolation === 'monotone-cubic'
				? this._createCubicSampleBody(groups)
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
${declarations}
	for (int rowTap = 0; rowTap < 4; rowTap += 1) {
		if (altitudeZenithWeights[rowTap] <= 0.0 || packedRows[rowTap] < 0) continue;
		float weight = altitudeZenithWeights[rowTap];
		${focused ? 'vec3 directionCoordinate = distantSunRowCoordinate(outgoingDirection, zenithIndices[rowTap % 2]);' : ''}
		float faceOffset = directionCoordinate.x * 27.0;
		float atlasY = (directionCoordinate.z + 0.5) / 27.0;
		float atlasLayer = float(packedRows[rowTap]);
${samples}
	}`;

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
					`const int DISTANT_SCENE_FIRST_ZENITH[${altitudeCount}] = int[${altitudeCount}](${firstZenith});
const int DISTANT_SCENE_LAST_ZENITH[${altitudeCount}] = int[${altitudeCount}](${lastZenith});
const int DISTANT_SCENE_FIRST_PACKED_ROW[${altitudeCount}] = int[${altitudeCount}](${firstPacked});

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

${focused ? DistantSunScatteringAccuracy.createLookupShaderSource(this._scatteringAccuracy, SOLAR_ZENITH_180_DOMAIN_OWNER) : ''}
${interpolationHelper}${this._solarInterpolation === 'monotone-cubic' ? this._createCubicShaderSource(groups.length) : ''}

SpectralValue sampleCumulativeScatteringDensity(
	vec3 positionMeters,
	AtmosphereCoordinate atmosphereCoordinate,
	vec3 physicalOutgoingDirection
) {
	CachePositionStencil altitudeStencil =
		resolveScatteringCachePositionStencil(atmosphereCoordinate);
	vec3 directionToSource = directionToAtmosphericSource(positionMeters);
	vec3 outgoingDirection = distantSceneLocalOutgoingDirection(
		positionMeters,
		directionToSource,
		physicalOutgoingDirection
	);
	vec3 directionCoordinate = distantSceneDirectionCoordinate(outgoingDirection);
	float muS = clamp(dot(normalize(positionMeters), directionToSource), -1.0, 1.0);
	float solarZenith = ${this._shaderInterpolation ? 'distantSceneSolarZenith(normalize(positionMeters), directionToSource)' : 'acos(muS)'};
	float zenithCoordinate = clamp((solarZenith - 0.008726646259971648) / 0.017453292519943295, 0.0, 179.0);
${samplingBody}
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
