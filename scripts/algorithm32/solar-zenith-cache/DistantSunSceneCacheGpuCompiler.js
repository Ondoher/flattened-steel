const VERTEX_SOURCE = `#version 300 es
void main() {
	vec2 position = gl_VertexID == 0 ? vec2(-1.0, -1.0)
		: gl_VertexID == 1 ? vec2(3.0, -1.0)
		: vec2(-1.0, 3.0);
	gl_Position = vec4(position, 0.0, 1.0);
}`;

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function formatFloat(value) {
	if (!Number.isFinite(value)) throw new RangeError('Shader constant must be finite.');
	const text = Number(value).toExponential(17).replace('e+', 'e');
	return text.includes('.') ? text : `${text}.0`;
}

function compileShader(gl, type, source, label) {
	const shader = gl.createShader(type);
	requireCondition(shader, `Could not allocate ${label} shader.`);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(`${label} shader compilation failed: ${log}`);
	}
	return shader;
}

function createProgram(gl, fragmentSource, label) {
	const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SOURCE, `${label} vertex`);
	const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource, `${label} fragment`);
	const program = gl.createProgram();
	requireCondition(program, `Could not allocate ${label} program.`);
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const log = gl.getProgramInfoLog(program);
		gl.deleteProgram(program);
		throw new Error(`${label} program link failed: ${log}`);
	}
	return program;
}

function requireNoGlError(gl, label) {
	const error = gl.getError();
	if (error !== gl.NO_ERROR) throw new Error(`${label} produced WebGL error ${error}.`);
}

function createTexture(gl, {width, height, internalFormat = gl.R32F, format = gl.RED, type = gl.FLOAT, data = null}) {
	const texture = gl.createTexture();
	requireCondition(texture, 'Could not allocate GPU recurrence texture.');
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, data);
	requireNoGlError(gl, `Texture allocation ${width}x${height}`);
	return texture;
}

function createDirectionTexture(gl, vectors, weights = null) {
	const data = new Float32Array(vectors.length * 4);
	for (let index = 0; index < vectors.length; index += 1) {
		data[index * 4] = vectors[index][0];
		data[index * 4 + 1] = vectors[index][1];
		data[index * 4 + 2] = vectors[index][2];
		data[index * 4 + 3] = weights?.[index] ?? 0;
	}
	return createTexture(gl, {
		width: vectors.length,
		height: 1,
		internalFormat: gl.RGBA32F,
		format: gl.RGBA,
		data,
	});
}

function bindFramebuffer(gl, framebuffer, texture) {
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	requireCondition(
		gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE,
		'GPU recurrence framebuffer is incomplete.',
	);
}

export function createDistantSunSceneCacheCommonShaderSource({
	wavelengthNanometers,
	sourceIrradiance,
	ozoneCrossSection,
	ozoneMaximumDensity = 5.374e18,
	rayleighScattering = null,
	mieExtinction = null,
	groundAlbedo = 0,
	bottomRadiusMeters = 6360000,
	topRadiusMeters = 6420000,
	rayleighScaleHeightMeters = 8000,
	mieScaleHeightMeters = 1200,
	rayleighCoefficientScalePerMeter = 0.00000124062,
	mieAngstromAlpha = 0.8,
	mieAngstromBeta = 0.04,
	mieSingleScatteringAlbedo = 0.8,
	miePhaseFunctionG = 0.7,
	sourcePathTransmittanceIntervalCount = 20,
	incomingDirectionCount = 68,
	transportIntervalCount = 15,
	outgoingFaceWidth = 39,
	positionAltitudesMeters = null,
	solarZenithDegrees = null,
	coordinateContract = 'scene-cache-receiver-local-v1',
	sourceDirection = null,
}) {
	if (!['scene-cache-receiver-local-v1', 'production-source-aligned-v1'].includes(coordinateContract)) {
		throw new RangeError(`Unsupported offline recurrence coordinate contract: ${coordinateContract}.`);
	}
	const sourceAligned = coordinateContract === 'production-source-aligned-v1';
	if (
		sourceAligned &&
		(!Array.isArray(sourceDirection) ||
			sourceDirection.length !== 3 ||
			sourceDirection.some((value) => !Number.isFinite(value)) ||
			Math.abs(Math.hypot(...sourceDirection) - 1) > 1e-10)
	) {
		throw new RangeError('Production source-aligned recurrence requires one unit source direction.');
	}
	const outgoingCellWidth = outgoingFaceWidth - 1;
	const outgoingFaceNodeCount = outgoingFaceWidth * outgoingFaceWidth;
	const altitudes =
		positionAltitudesMeters ??
		Array.from({length: 48}, (_unused, index) => (index === 0 ? 0 : ((index + 0.5) / 48) * 60000));
	const zeniths = solarZenithDegrees ?? Array.from({length: 180}, (_unused, index) => index + 0.5);
	const floatArray = (values) => values.map(formatFloat).join(', ');
	const sourceDirectionValue = sourceAligned ? sourceDirection : [0, 0, 1];
	const sourceDirectionGlsl = `vec3(${sourceDirectionValue.map(formatFloat).join(', ')})`;
	const directionExactTolerance = sourceAligned ? '1e-10' : '1e-5';
	const altitudeAtPointSource = sourceAligned
		? `float altitudeAtPoint(vec3 point) {
	float radialOffset = point.z - BOTTOM_RADIUS;
	float transverseDistanceSquared = dot(point.xy, point.xy);
	float radiusAtRadialOffset = BOTTOM_RADIUS + radialOffset;
	float curvatureDenominator = sqrt(max(
		radiusAtRadialOffset * radiusAtRadialOffset + transverseDistanceSquared,
		0.0
	)) + radiusAtRadialOffset;
	return max(0.0, radialOffset + transverseDistanceSquared / max(curvatureDenominator, 1.0));
}`
		: `float altitudeAtPoint(vec3 point) {
	return max(0.0, length(point) - BOTTOM_RADIUS);
}`;
	const geometryIntersectionSource = sourceAligned
		? `bool rayBlockedByGround(vec3 position, vec3 direction) {
	float height = altitudeAtPoint(position);
	float radius = BOTTOM_RADIUS + height;
	float halfLinear = dot(position, direction);
	float constantTerm = height * (radius + BOTTOM_RADIUS);
	float discriminant = halfLinear * halfLinear - constantTerm;
	return halfLinear < 0.0 && discriminant >= 0.0;
}
float topBoundaryDistance(vec3 position, vec3 direction) {
	float radius = BOTTOM_RADIUS + altitudeAtPoint(position);
	float halfLinear = dot(position, direction);
	float constantTerm = (radius - TOP_RADIUS) * (radius + TOP_RADIUS);
	float root = sqrt(max(0.0, halfLinear * halfLinear - constantTerm));
	return max(0.0, halfLinear >= 0.0 ? -constantTerm / (halfLinear + root) : -halfLinear + root);
}
bool groundBoundaryHit(vec3 position, vec3 direction, out float distanceMeters) {
	float height = altitudeAtPoint(position);
	float radius = BOTTOM_RADIUS + height;
	float halfLinear = dot(position, direction);
	float constantTerm = height * (radius + BOTTOM_RADIUS);
	float discriminant = halfLinear * halfLinear - constantTerm;
	if (halfLinear >= 0.0 || discriminant < 0.0) return false;
	float denominator = -halfLinear + sqrt(max(0.0, discriminant));
	distanceMeters = denominator == 0.0 ? 0.0 : max(0.0, constantTerm / denominator);
	return true;
}`
		: `bool rayBlockedByGround(vec3 position, vec3 direction) {
	return firstPositiveRoot(sphereRoots(position, direction, BOTTOM_RADIUS)) < 1e29;
}
float topBoundaryDistance(vec3 position, vec3 direction) {
	return firstPositiveRoot(sphereRoots(position, direction, TOP_RADIUS));
}
bool groundBoundaryHit(vec3 position, vec3 direction, out float distanceMeters) {
	distanceMeters = firstPositiveRoot(sphereRoots(position, direction, BOTTOM_RADIUS));
	return distanceMeters < 1e29;
}`;
	const atmosphereBranchSource = sourceAligned
		? `float atmosphereBranchLength(vec3 origin, vec3 direction) {
	return topBoundaryDistance(origin, direction);
}`
		: `float atmosphereBranchLength(vec3 origin, vec3 direction) {
	float radius = length(origin);
	float radialDirection = dot(origin, direction);
	if (abs(radius - BOTTOM_RADIUS) <= 1.0 && radialDirection < -1e-7) return -1.0;
	if (abs(radius - TOP_RADIUS) <= 0.25 && radialDirection >= -1e-7) return -1.0;
	float groundDistance = firstPositiveRoot(sphereRoots(origin, direction, BOTTOM_RADIUS));
	float topDistance = firstPositiveRoot(sphereRoots(origin, direction, TOP_RADIUS));
	float distanceMeters = min(groundDistance, topDistance);
	return distanceMeters >= 1e29 ? -1.0 : distanceMeters;
}`;
	const sourceVisibilitySource = sourceAligned
		? `bool sourceVisible(vec3 point) {
	return !rayBlockedByGround(point, SOURCE_DIRECTION);
}`
		: `bool sourceVisible(vec3 point) {
	float radius = length(point);
	if (abs(radius - BOTTOM_RADIUS) <= 1.0) {
		return dot(point, SOURCE_DIRECTION) >= 0.0;
	}
	return firstPositiveRoot(sphereRoots(point, SOURCE_DIRECTION, BOTTOM_RADIUS)) >= 1e29;
}`;
	const representativePointSource = sourceAligned
		? `vec3 representativePoint(int positionIndex, int solarZenithIndex) {
	float radius = BOTTOM_RADIUS + altitudeForIndex(positionIndex);
	return vec3(0.0, 0.0, radius);
}`
		: `vec3 representativePoint(int positionIndex, int solarZenithIndex) {
	float radius = BOTTOM_RADIUS + altitudeForIndex(positionIndex);
	float angle = radians(SOLAR_ZENITH_DEGREES[solarZenithIndex]);
	float muS = cos(angle);
	return vec3(radius * sqrt(max(0.0, 1.0 - muS * muS)), 0.0, radius * muS);
}`;
	const directionFrameSource = sourceAligned
		? `vec3 leastAlignedAxis(vec3 direction) {
	vec3 selected = vec3(1.0, 0.0, 0.0);
	if (abs(direction.y) < abs(dot(selected, direction))) selected = vec3(0.0, 1.0, 0.0);
	if (abs(direction.z) < abs(dot(selected, direction))) selected = vec3(0.0, 0.0, 1.0);
	return selected;
}

void productionFrame(bool fibonacci, out vec3 xAxis, out vec3 yAxis, out vec3 zAxis) {
	xAxis = SOURCE_DIRECTION;
	vec3 reference = fibonacci && abs(dot(xAxis, vec3(0.0, 0.0, 1.0))) >= 0.95
		? vec3(0.0, 1.0, 0.0)
		: vec3(0.0, 0.0, 1.0);
	zAxis = reference - xAxis * dot(reference, xAxis);
	if (!fibonacci && length(zAxis) <= 1.0e-10) {
		vec3 fallback = leastAlignedAxis(xAxis);
		zAxis = fallback - xAxis * dot(fallback, xAxis);
	}
	zAxis = normalize(zAxis);
	yAxis = normalize(cross(zAxis, xAxis));
}

vec3 productionLocalToWorld(vec3 localDirection, bool fibonacci) {
	vec3 xAxis; vec3 yAxis; vec3 zAxis;
	productionFrame(fibonacci, xAxis, yAxis, zAxis);
	return normalize(xAxis * localDirection.x + yAxis * localDirection.y + zAxis * localDirection.z);
}

vec3 productionWorldToW27(vec3 worldDirection) {
	vec3 xAxis; vec3 yAxis; vec3 zAxis;
	productionFrame(false, xAxis, yAxis, zAxis);
	return vec3(dot(worldDirection, xAxis), dot(worldDirection, yAxis), dot(worldDirection, zAxis));
}

vec3 incomingPhysicalDirection(vec3 point, vec3 localDirection) {
	return productionLocalToWorld(localDirection, true);
}
vec3 phaseOutgoingDirection(vec3 point, vec3 localDirection) {
	return productionLocalToWorld(localDirection, false);
}
vec3 phaseIncomingDirection(vec3 point, vec3 localDirection) {
	return productionLocalToWorld(localDirection, true);
}
vec3 outgoingLocalDirection(vec3 point, vec3 worldDirection) {
	return normalize(productionWorldToW27(worldDirection));
}
vec3 j1SourceDirection(int solarZenithIndex) { return SOURCE_DIRECTION; }
float sourceZenithDegreesAtPoint(vec3 point) {
	return degrees(acos(clamp(dot(normalize(point), SOURCE_DIRECTION), -1.0, 1.0)));
}`
		: `void sourceFrame(vec3 point, out vec3 xAxis, out vec3 yAxis, out vec3 zAxis) {
	zAxis = normalize(point);
	float muS = clamp(zAxis.z, -1.0, 1.0);
	xAxis = normalize(vec3(0.0, 0.0, 1.0) - muS * zAxis);
	yAxis = normalize(cross(zAxis, xAxis));
}

vec3 localToWorld(vec3 point, vec3 localDirection) {
	vec3 xAxis;
	vec3 yAxis;
	vec3 zAxis;
	sourceFrame(point, xAxis, yAxis, zAxis);
	return normalize(xAxis * localDirection.x + yAxis * localDirection.y + zAxis * localDirection.z);
}

vec3 worldToLocal(vec3 point, vec3 worldDirection) {
	vec3 xAxis;
	vec3 yAxis;
	vec3 zAxis;
	sourceFrame(point, xAxis, yAxis, zAxis);
	return normalize(vec3(dot(worldDirection, xAxis), dot(worldDirection, yAxis), dot(worldDirection, zAxis)));
}

vec3 incomingPhysicalDirection(vec3 point, vec3 localDirection) { return localToWorld(point, localDirection); }
vec3 phaseOutgoingDirection(vec3 point, vec3 localDirection) { return localDirection; }
vec3 phaseIncomingDirection(vec3 point, vec3 localDirection) { return localDirection; }
vec3 outgoingLocalDirection(vec3 point, vec3 worldDirection) { return worldToLocal(point, worldDirection); }
vec3 j1SourceDirection(int solarZenithIndex) {
	float solarZenith = radians(float(solarZenithIndex) + 0.5);
	return vec3(sin(solarZenith), 0.0, cos(solarZenith));
}
float sourceZenithDegreesAtPoint(vec3 point) {
	return degrees(acos(clamp(point.z / length(point), -1.0, 1.0)));
}`;
	const positionStencilSource = sourceAligned
		? `void positionStencil(float altitudeMeters, out int lower, out int upper, out float fraction) {
	float normalized = clamp(altitudeMeters / ATMOSPHERE_HEIGHT, 0.0, 0.999999999);
	lower = clamp(int(floor(normalized * float(POSITION_COUNT))), 0, POSITION_COUNT - 1);
	upper = lower;
	fraction = 0.0;
}`
		: `void positionStencil(float altitudeMeters, out int lower, out int upper, out float fraction) {
	if (altitudeMeters <= POSITION_ALTITUDES[0]) {
		lower = 0; upper = 0; fraction = 0.0; return;
	}
	if (altitudeMeters >= POSITION_ALTITUDES[POSITION_COUNT - 1]) {
		lower = POSITION_COUNT - 1; upper = lower; fraction = 0.0; return;
	}
	for (int index = 0; index < POSITION_COUNT - 1; index += 1) {
		if (altitudeMeters <= POSITION_ALTITUDES[index + 1]) {
			lower = index; upper = index + 1;
			fraction = clamp((altitudeMeters - POSITION_ALTITUDES[index])
				/ (POSITION_ALTITUDES[index + 1] - POSITION_ALTITUDES[index]), 0.0, 1.0);
			return;
		}
	}
}`;
	const transportPolicySource = sourceAligned
		? `bool radianceTransportBlocked(vec3 origin, vec3 direction) {
	return rayBlockedByGround(origin, direction);
}
int transportBreaks(vec3 origin, vec3 direction, float lengthMeters, out float breaks[5]) {
	breaks[0] = 0.0;
	breaks[1] = lengthMeters;
	return 2;
}`
		: `bool radianceTransportBlocked(vec3 origin, vec3 direction) { return false; }
int transportBreaks(vec3 origin, vec3 direction, float lengthMeters, out float breaks[5]) {
	return branchBreaks(origin, direction, lengthMeters, breaks);
}`;
	const groundIncomingSource = sourceAligned
		? `void compensatedAdd(float value, inout float sum, inout float compensation) {
	float adjusted = value - compensation;
	float updated = sum + adjusted;
	compensation = (updated - sum) - adjusted;
	sum = updated;
}

float segmentTransmittance(vec3 origin, vec3 direction, float distanceMeters) {
	if (distanceMeters <= 0.0) return 1.0;
	float intervalLength = distanceMeters / float(SOURCE_TRANSMITTANCE_INTERVAL_COUNT);
	float opticalDepth = 0.0;
	for (int index = 0; index <= SOURCE_TRANSMITTANCE_INTERVAL_COUNT; index += 1) {
		float weight = index == 0 || index == SOURCE_TRANSMITTANCE_INTERVAL_COUNT ? 0.5 : 1.0;
		vec3 samplePoint = origin + direction * intervalLength * float(index);
		opticalDepth += sampleMediumAtPoint(samplePoint).extinction * intervalLength * weight;
	}
	return exp(-opticalDepth);
}

float groundIncomingContribution(
	vec3 point,
	vec3 incomingDirection,
	int scatteringOrder,
	sampler2D directionRecords,
	sampler2D groundIllumination
) {
	float groundDistance;
	if (!groundBoundaryHit(point, incomingDirection, groundDistance)) return 0.0;
	vec3 groundPoint = point + incomingDirection * groundDistance;
	vec3 normal = normalize(groundPoint);
	float reflected = 0.0;
	if (scatteringOrder == 2) {
		reflected = SOURCE_IRRADIANCE * sourceTransmittance(groundPoint)
			* max(0.0, dot(normal, SOURCE_DIRECTION)) * GROUND_ALBEDO / PI;
	} else {
		float compensation = 0.0;
		for (int directionIndex = 0; directionIndex < F68_COUNT; directionIndex += 1) {
			vec4 record = texelFetch(directionRecords, ivec2(directionIndex, 0), 0);
			vec3 illuminationDirection = incomingPhysicalDirection(groundPoint, record.xyz);
			float incidenceCosine = max(0.0, dot(normal, illuminationDirection));
			compensatedAdd(
				texelFetch(groundIllumination, ivec2(directionIndex, 0), 0).r
					* incidenceCosine * record.w * GROUND_ALBEDO / PI,
				reflected,
				compensation
			);
		}
	}
	return reflected * segmentTransmittance(groundPoint, -incomingDirection, groundDistance);
}`
		: '';
	return `
const float PI = 3.1415926535897932384626433832795;
const float BOTTOM_RADIUS = ${formatFloat(bottomRadiusMeters)};
const float TOP_RADIUS = ${formatFloat(topRadiusMeters)};
const float ATMOSPHERE_HEIGHT = ${formatFloat(topRadiusMeters - bottomRadiusMeters)};
const float RAYLEIGH_SCALE_HEIGHT = ${formatFloat(rayleighScaleHeightMeters)};
const float MIE_SCALE_HEIGHT = ${formatFloat(mieScaleHeightMeters)};
const float RAYLEIGH_SCALE = ${formatFloat(rayleighCoefficientScalePerMeter)};
const float MIE_ALPHA = ${formatFloat(mieAngstromAlpha)};
const float MIE_BETA = ${formatFloat(mieAngstromBeta)};
const float MIE_ALBEDO = ${formatFloat(mieSingleScatteringAlbedo)};
const float MIE_G = ${formatFloat(miePhaseFunctionG)};
const float WAVELENGTH_MICROMETERS = ${formatFloat(wavelengthNanometers / 1000)};
const float SOURCE_IRRADIANCE = ${formatFloat(sourceIrradiance)};
const float OZONE_CROSS_SECTION = ${formatFloat(ozoneCrossSection)};
const float EXPLICIT_RAYLEIGH_SCATTERING = ${formatFloat(rayleighScattering ?? -1)};
const float EXPLICIT_MIE_EXTINCTION = ${formatFloat(mieExtinction ?? -1)};
const float GROUND_ALBEDO = ${formatFloat(groundAlbedo)};
const float OZONE_MAXIMUM_DENSITY = ${formatFloat(ozoneMaximumDensity)};
const vec3 SOURCE_DIRECTION = ${sourceDirectionGlsl};
const int POSITION_COUNT = ${altitudes.length};
const int SOLAR_ZENITH_COUNT = ${zeniths.length};
const int F68_COUNT = ${incomingDirectionCount};
const int OUTGOING_FACE_WIDTH = ${outgoingFaceWidth};
const int OUTGOING_CELL_WIDTH = ${outgoingCellWidth};
const int OUTGOING_FACE_NODE_COUNT = ${outgoingFaceNodeCount};
const int TRANSPORT_INTERVAL_COUNT = ${transportIntervalCount};
const int SOURCE_TRANSMITTANCE_INTERVAL_COUNT = ${sourcePathTransmittanceIntervalCount};
const float POSITION_ALTITUDES[POSITION_COUNT] = float[POSITION_COUNT](
	${floatArray(altitudes)}
);
const float SOLAR_ZENITH_DEGREES[SOLAR_ZENITH_COUNT] = float[SOLAR_ZENITH_COUNT](
	${floatArray(zeniths)}
);

struct Medium {
	float rayleighScattering;
	float mieScattering;
	float extinction;
};

float altitudeForIndex(int index) {
	return POSITION_ALTITUDES[index];
}

float ozoneDensityScale(float altitudeMeters) {
	if (altitudeMeters <= 10000.0 || altitudeMeters >= 40000.0) return 0.0;
	if (altitudeMeters <= 25000.0) return (altitudeMeters - 10000.0) / 15000.0;
	return (40000.0 - altitudeMeters) / 15000.0;
}

${altitudeAtPointSource}

Medium sampleMediumAtPoint(vec3 point) {
	float altitudeMeters = altitudeAtPoint(point);
	float rayleighSeaLevel = EXPLICIT_RAYLEIGH_SCATTERING >= 0.0
		? EXPLICIT_RAYLEIGH_SCATTERING
		: RAYLEIGH_SCALE * pow(WAVELENGTH_MICROMETERS, -4.0);
	float rayleigh = rayleighSeaLevel
		* exp(-altitudeMeters / RAYLEIGH_SCALE_HEIGHT);
	float mieSeaLevel = EXPLICIT_MIE_EXTINCTION >= 0.0
		? EXPLICIT_MIE_EXTINCTION
		: (MIE_BETA / MIE_SCALE_HEIGHT) * pow(WAVELENGTH_MICROMETERS, -MIE_ALPHA);
	float mieExtinction = mieSeaLevel
		* exp(-altitudeMeters / MIE_SCALE_HEIGHT);
	float ozone = OZONE_MAXIMUM_DENSITY * OZONE_CROSS_SECTION
		* ozoneDensityScale(altitudeMeters);
	Medium medium;
	medium.rayleighScattering = rayleigh;
	medium.mieScattering = mieExtinction * MIE_ALBEDO;
	medium.extinction = rayleigh + mieExtinction + ozone;
	return medium;
}

float rayleighPhase(vec3 outgoingDirection, vec3 incomingDirection) {
	float cosine = clamp(dot(outgoingDirection, incomingDirection), -1.0, 1.0);
	return (3.0 / (16.0 * PI)) * (1.0 + cosine * cosine);
}

float miePhase(vec3 outgoingDirection, vec3 incomingDirection) {
	float cosine = clamp(dot(outgoingDirection, incomingDirection), -1.0, 1.0);
	float normalization = (3.0 / (8.0 * PI))
		* ((1.0 - MIE_G * MIE_G) / (2.0 + MIE_G * MIE_G));
	float denominator = max(1.0 + MIE_G * MIE_G - 2.0 * MIE_G * cosine, 1e-7);
	return normalization * (1.0 + cosine * cosine) / pow(denominator, 1.5);
}

vec2 sphereRoots(vec3 origin, vec3 direction, float radius) {
	float projection = dot(origin, direction);
	float discriminant = projection * projection - (dot(origin, origin) - radius * radius);
	if (discriminant < 0.0) return vec2(1e30);
	float root = sqrt(max(0.0, discriminant));
	return vec2(-projection - root, -projection + root);
}

float firstPositiveRoot(vec2 roots) {
	if (roots.x > 1e-3) return roots.x;
	if (roots.y > 1e-3) return roots.y;
	return 1e30;
}

${geometryIntersectionSource}

${atmosphereBranchSource}

${sourceVisibilitySource}

float sourceTransmittance(vec3 point) {
	if (!sourceVisible(point)) return 0.0;
	float distanceMeters = topBoundaryDistance(point, SOURCE_DIRECTION);
	if (distanceMeters >= 1e29) return 1.0;
	float intervalLength = distanceMeters / float(SOURCE_TRANSMITTANCE_INTERVAL_COUNT);
	float opticalDepth = 0.0;
	for (int index = 0; index <= SOURCE_TRANSMITTANCE_INTERVAL_COUNT; index += 1) {
		float weight = index == 0 || index == SOURCE_TRANSMITTANCE_INTERVAL_COUNT ? 0.5 : 1.0;
		vec3 samplePoint = point + SOURCE_DIRECTION * intervalLength * float(index);
		opticalDepth += sampleMediumAtPoint(samplePoint).extinction * intervalLength * weight;
	}
	return exp(-opticalDepth);
}

${representativePointSource}

${directionFrameSource}

float directScatteringDensity(vec3 point, vec3 outgoingDirection) {
	float transmittance = sourceTransmittance(point);
	if (transmittance == 0.0) return 0.0;
	Medium medium = sampleMediumAtPoint(point);
	vec3 sourceDirection = SOURCE_DIRECTION;
	return SOURCE_IRRADIANCE * transmittance
		* (medium.rayleighScattering * rayleighPhase(outgoingDirection, sourceDirection)
			+ medium.mieScattering * miePhase(outgoingDirection, sourceDirection));
}

int appendBreak(inout float breaks[5], int count, float value, float lengthMeters) {
	if (value <= 1e-3 || value >= lengthMeters - 1e-3 || count >= 4) return count;
	for (int index = 0; index < 5; index += 1) {
		if (index >= count) break;
		if (abs(breaks[index] - value) <= 0.01) return count;
	}
	breaks[count] = value;
	return count + 1;
}

int branchBreaks(vec3 origin, vec3 direction, float lengthMeters, out float breaks[5]) {
	int count = 1;
	breaks[0] = 0.0;
	float tangent = -dot(origin, direction);
	count = appendBreak(breaks, count, tangent, lengthMeters);
	vec3 perpendicularOrigin = origin - dot(origin, SOURCE_DIRECTION) * SOURCE_DIRECTION;
	vec3 perpendicularDirection = direction - dot(direction, SOURCE_DIRECTION) * SOURCE_DIRECTION;
	float a = dot(perpendicularDirection, perpendicularDirection);
	float b = 2.0 * dot(perpendicularOrigin, perpendicularDirection);
	float c = dot(perpendicularOrigin, perpendicularOrigin) - BOTTOM_RADIUS * BOTTOM_RADIUS;
	if (abs(a) > 1e-15) {
		float discriminant = b * b - 4.0 * a * c;
		if (discriminant >= 0.0) {
			float root = sqrt(max(0.0, discriminant));
			float first = (-b - root) / (2.0 * a);
			float second = (-b + root) / (2.0 * a);
			for (int candidateIndex = 0; candidateIndex < 2; candidateIndex += 1) {
				float candidate = candidateIndex == 0 ? first : second;
				if (candidate > 1e-3 && candidate < lengthMeters - 1e-3) {
					float probe = min(1.0, min(candidate * 0.25, (lengthMeters - candidate) * 0.25));
					bool before = sourceVisible(origin + direction * (candidate - probe));
					bool after = sourceVisible(origin + direction * (candidate + probe));
					if (before != after) count = appendBreak(breaks, count, candidate, lengthMeters);
				}
			}
		}
	} else if (abs(b) > 1e-15) {
		float candidate = -c / b;
		if (candidate > 1e-3 && candidate < lengthMeters - 1e-3) {
			float probe = min(1.0, min(candidate * 0.25, (lengthMeters - candidate) * 0.25));
			bool before = sourceVisible(origin + direction * (candidate - probe));
			bool after = sourceVisible(origin + direction * (candidate + probe));
			if (before != after) count = appendBreak(breaks, count, candidate, lengthMeters);
		}
	}
	breaks[count] = lengthMeters;
	count += 1;
	for (int left = 0; left < 5; left += 1) {
		for (int right = left + 1; right < 5; right += 1) {
			if (left < count && right < count && breaks[right] < breaks[left]) {
				float temporary = breaks[left];
				breaks[left] = breaks[right];
				breaks[right] = temporary;
			}
		}
	}
	return count;
}

${positionStencilSource}

void solarZenithStencil(float degreesValue, out int lower, out int upper, out float fraction) {
	if (degreesValue <= SOLAR_ZENITH_DEGREES[0]) {
		lower = 0; upper = 0; fraction = 0.0; return;
	}
	if (degreesValue >= SOLAR_ZENITH_DEGREES[SOLAR_ZENITH_COUNT - 1]) {
		lower = SOLAR_ZENITH_COUNT - 1; upper = lower; fraction = 0.0; return;
	}
	for (int index = 0; index < SOLAR_ZENITH_COUNT - 1; index += 1) {
		if (degreesValue <= SOLAR_ZENITH_DEGREES[index + 1]) {
			lower = index; upper = index + 1;
			fraction = clamp((degreesValue - SOLAR_ZENITH_DEGREES[index])
				/ (SOLAR_ZENITH_DEGREES[index + 1] - SOLAR_ZENITH_DEGREES[index]), 0.0, 1.0);
			return;
		}
	}
}

void directionFace(vec3 direction, out int faceIndex, out vec3 normal, out vec3 uAxis, out vec3 vAxis) {
	faceIndex = 0;
	normal = vec3(1.0, 0.0, 0.0);
	uAxis = vec3(0.0, 1.0, 0.0);
	vAxis = vec3(0.0, 0.0, 1.0);
	float selected = dot(direction, normal);
	float projection = -direction.x;
	if (projection > selected) { faceIndex = 1; selected = projection; normal = vec3(-1.0, 0.0, 0.0); uAxis = vec3(0.0, -1.0, 0.0); vAxis = vec3(0.0, 0.0, 1.0); }
	projection = direction.y;
	if (projection > selected) { faceIndex = 2; selected = projection; normal = vec3(0.0, 1.0, 0.0); uAxis = vec3(-1.0, 0.0, 0.0); vAxis = vec3(0.0, 0.0, 1.0); }
	projection = -direction.y;
	if (projection > selected) { faceIndex = 3; selected = projection; normal = vec3(0.0, -1.0, 0.0); uAxis = vec3(1.0, 0.0, 0.0); vAxis = vec3(0.0, 0.0, 1.0); }
	projection = direction.z;
	if (projection > selected) { faceIndex = 4; selected = projection; normal = vec3(0.0, 0.0, 1.0); uAxis = vec3(1.0, 0.0, 0.0); vAxis = vec3(0.0, 1.0, 0.0); }
	projection = -direction.z;
	if (projection > selected) { faceIndex = 5; normal = vec3(0.0, 0.0, -1.0); uAxis = vec3(-1.0, 0.0, 0.0); vAxis = vec3(0.0, 1.0, 0.0); }
}

float sampleJDirection(sampler2D field, int row, vec3 direction) {
	vec3 normal;
	vec3 uAxis;
	vec3 vAxis;
	int faceIndex;
	directionFace(normalize(direction), faceIndex, normal, uAxis, vAxis);
	float denominator = dot(direction, normal);
	float u = clamp(dot(direction, uAxis) / denominator, -1.0, 1.0);
	float v = clamp(dot(direction, vAxis) / denominator, -1.0, 1.0);
	float uCoordinate = (u + 1.0) * float(OUTGOING_CELL_WIDTH) * 0.5;
	float vCoordinate = (v + 1.0) * float(OUTGOING_CELL_WIDTH) * 0.5;
	float roundedU = floor(uCoordinate + 0.5);
	float roundedV = floor(vCoordinate + 0.5);
	if (abs(uCoordinate - roundedU) <= ${directionExactTolerance}) uCoordinate = roundedU;
	if (abs(vCoordinate - roundedV) <= ${directionExactTolerance}) vCoordinate = roundedV;
	int u0 = clamp(int(floor(uCoordinate)), 0, OUTGOING_FACE_WIDTH - 1);
	int v0 = clamp(int(floor(vCoordinate)), 0, OUTGOING_FACE_WIDTH - 1);
	int u1 = min(u0 + 1, OUTGOING_FACE_WIDTH - 1);
	int v1 = min(v0 + 1, OUTGOING_FACE_WIDTH - 1);
	float fu = uCoordinate - float(u0);
	float fv = vCoordinate - float(v0);
	int base = faceIndex * OUTGOING_FACE_NODE_COUNT;
	float a = texelFetch(field, ivec2(base + v0 * OUTGOING_FACE_WIDTH + u0, row), 0).r;
	float b = texelFetch(field, ivec2(base + v0 * OUTGOING_FACE_WIDTH + u1, row), 0).r;
	float cValue = texelFetch(field, ivec2(base + v1 * OUTGOING_FACE_WIDTH + u0, row), 0).r;
	float d = texelFetch(field, ivec2(base + v1 * OUTGOING_FACE_WIDTH + u1, row), 0).r;
	return mix(mix(a, b, fu), mix(cValue, d, fu), fv);
}

float sampleJ(sampler2D field, vec3 point, vec3 worldDirection) {
	float altitudeMeters = altitudeAtPoint(point);
	float degreesValue = sourceZenithDegreesAtPoint(point);
	int p0;
	int p1;
	float fp;
	int z0;
	int z1;
	float fz;
	positionStencil(altitudeMeters, p0, p1, fp);
	solarZenithStencil(degreesValue, z0, z1, fz);
	vec3 localDirection = outgoingLocalDirection(point, worldDirection);
	float a = sampleJDirection(field, z0 * POSITION_COUNT + p0, localDirection);
	float b = sampleJDirection(field, z0 * POSITION_COUNT + p1, localDirection);
	float cValue = sampleJDirection(field, z1 * POSITION_COUNT + p0, localDirection);
	float d = sampleJDirection(field, z1 * POSITION_COUNT + p1, localDirection);
	return mix(mix(a, b, fp), mix(cValue, d, fp), fz);
}

float sampleLAtGround(sampler2D field, vec3 groundPoint, int directionIndex) {
	float degreesValue = sourceZenithDegreesAtPoint(groundPoint);
	int z0;
	int z1;
	float fz;
	solarZenithStencil(degreesValue, z0, z1, fz);
	float a = texelFetch(field, ivec2(directionIndex, z0 * POSITION_COUNT), 0).r;
	float b = texelFetch(field, ivec2(directionIndex, z1 * POSITION_COUNT), 0).r;
	return mix(a, b, fz);
}

${transportPolicySource}

${groundIncomingSource}
`;
}

function directBaseFragment(common) {
	return `#version 300 es
precision highp float;
precision highp int;
${common}
layout(location = 0) out vec2 outputBase;
void main() {
	int row = int(gl_FragCoord.y);
	int positionIndex = row % POSITION_COUNT;
	int solarZenithIndex = row / POSITION_COUNT;
	vec3 point = representativePoint(positionIndex, solarZenithIndex);
	float transmittance = sourceTransmittance(point);
	Medium medium = sampleMediumAtPoint(point);
	outputBase = SOURCE_IRRADIANCE * transmittance
		* vec2(medium.rayleighScattering, medium.mieScattering);
}`;
}

function j1Fragment(common) {
	return `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uDirectBase;
uniform sampler2D uOutgoingDirections;
${common}
layout(location = 0) out float outputValue;
void main() {
	int directionIndex = int(gl_FragCoord.x);
	int row = int(gl_FragCoord.y);
	vec3 point = representativePoint(row % POSITION_COUNT, row / POSITION_COUNT);
	vec3 outgoing = phaseOutgoingDirection(
		point,
		texelFetch(uOutgoingDirections, ivec2(directionIndex, 0), 0).xyz
	);
	vec2 base = texelFetch(uDirectBase, ivec2(0, row), 0).rg;
	vec3 sourceDirection = j1SourceDirection(row / POSITION_COUNT);
	outputValue = base.x * rayleighPhase(outgoing, sourceDirection)
		+ base.y * miePhase(outgoing, sourceDirection);
}`;
}

function l1Fragment(common, sourceAligned) {
	const compensationDeclaration = sourceAligned ? 'float radianceCompensation = 0.0;' : '';
	const radianceAddition = sourceAligned
		? 'compensatedAdd(transmittance * directScatteringDensity(point, direction) * measure, radiance, radianceCompensation);'
		: 'radiance += transmittance * directScatteringDensity(point, direction) * measure;';
	return `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uF68Directions;
${common}
layout(location = 0) out float outputValue;
void main() {
	int directionIndex = int(gl_FragCoord.x);
	int row = int(gl_FragCoord.y);
	int positionIndex = row % POSITION_COUNT;
	int solarZenithIndex = row / POSITION_COUNT;
	vec3 origin = representativePoint(positionIndex, solarZenithIndex);
	vec3 localDirection = texelFetch(uF68Directions, ivec2(directionIndex, 0), 0).xyz;
	vec3 direction = incomingPhysicalDirection(origin, localDirection);
	if (radianceTransportBlocked(origin, direction)) { outputValue = 0.0; return; }
	float lengthMeters = atmosphereBranchLength(origin, direction);
	if (lengthMeters <= 0.0) { outputValue = 0.0; return; }
	float groundDistance = firstPositiveRoot(sphereRoots(origin, direction, BOTTOM_RADIUS));
	bool hitsGround = groundDistance < 1e29 && abs(groundDistance - lengthMeters) <= 1.0;
	float breaks[5];
	int breakCount = transportBreaks(origin, direction, lengthMeters, breaks);
	float transmittance = 1.0;
	float radiance = 0.0;
	${compensationDeclaration}
	for (int segmentIndex = 0; segmentIndex < 4; segmentIndex += 1) {
		if (segmentIndex + 1 >= breakCount) break;
		float start = breaks[segmentIndex];
		float end = breaks[segmentIndex + 1];
		float intervalLength = (end - start) / float(TRANSPORT_INTERVAL_COUNT);
		float previousExtinction = 0.0;
		for (int pointIndex = 0; pointIndex <= TRANSPORT_INTERVAL_COUNT; pointIndex += 1) {
			float distanceMeters = start + intervalLength * float(pointIndex);
			vec3 point = origin + direction * distanceMeters;
			Medium medium = sampleMediumAtPoint(point);
			if (pointIndex > 0) {
				transmittance *= exp(-0.5 * (previousExtinction + medium.extinction) * intervalLength);
			}
			float measure = intervalLength * (pointIndex == 0 || pointIndex == TRANSPORT_INTERVAL_COUNT ? 0.5 : 1.0);
			${radianceAddition}
			previousExtinction = medium.extinction;
		}
	}
	if (hitsGround && GROUND_ALBEDO > 0.0) {
		vec3 groundPoint = origin + direction * lengthMeters;
		float incidenceCosine = max(0.0, dot(normalize(groundPoint), SOURCE_DIRECTION));
		radiance += transmittance * SOURCE_IRRADIANCE * sourceTransmittance(groundPoint)
			* incidenceCosine * GROUND_ALBEDO / PI;
	}
	outputValue = radiance;
}`;
}

function scatterFragment(common, sourceAligned) {
	const productionUniforms = sourceAligned
		? 'uniform sampler2D uGroundIlluminationL;\nuniform int uScatteringOrder;\n'
		: '';
	const groundAddition = sourceAligned
		? `incomingRadiance += groundIncomingContribution(
			point,
			incoming,
			uScatteringOrder,
			uF68Directions,
			uGroundIlluminationL
		);`
		: '';
	const compensationDeclaration = sourceAligned ? 'float sumCompensation = 0.0;' : '';
	const sumAddition = sourceAligned
		? 'compensatedAdd(incomingRadiance * scattering * incomingRecord.w, sum, sumCompensation);'
		: 'sum += incomingRadiance * scattering * incomingRecord.w;';
	return `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uPreviousL;
uniform sampler2D uF68Directions;
uniform sampler2D uOutgoingDirections;
${productionUniforms}
${common}
layout(location = 0) out float outputValue;
void main() {
	int outgoingIndex = int(gl_FragCoord.x);
	int row = int(gl_FragCoord.y);
	int positionIndex = row % POSITION_COUNT;
	vec3 point = representativePoint(positionIndex, row / POSITION_COUNT);
	Medium medium = sampleMediumAtPoint(point);
	vec3 outgoing = phaseOutgoingDirection(
		point,
		texelFetch(uOutgoingDirections, ivec2(outgoingIndex, 0), 0).xyz
	);
	float sum = 0.0;
	${compensationDeclaration}
	for (int incomingIndex = 0; incomingIndex < F68_COUNT; incomingIndex += 1) {
		vec4 incomingRecord = texelFetch(uF68Directions, ivec2(incomingIndex, 0), 0);
		vec3 incoming = phaseIncomingDirection(point, incomingRecord.xyz);
		float incomingRadiance = texelFetch(uPreviousL, ivec2(incomingIndex, row), 0).r;
		${groundAddition}
		float scattering = medium.rayleighScattering * rayleighPhase(outgoing, incoming)
			+ medium.mieScattering * miePhase(outgoing, incoming);
		${sumAddition}
	}
	outputValue = sum;
}`;
}

function transportFragment(common, sourceAligned) {
	const compensationDeclarations = sourceAligned
		? 'float radianceCompensation = 0.0;\n\tfloat irradianceCompensation = 0.0;'
		: '';
	const radianceAddition = sourceAligned
		? 'compensatedAdd(transmittance * sampleJ(uPreviousJ, point, direction) * measure, radiance, radianceCompensation);'
		: 'radiance += transmittance * sampleJ(uPreviousJ, point, direction) * measure;';
	const irradianceAddition = sourceAligned
		? `compensatedAdd(
				sampleLAtGround(uPreviousL, groundPoint, incomingIndex) * incidenceCosine * incomingRecord.w,
				irradiance,
				irradianceCompensation
			);`
		: `irradiance += sampleLAtGround(uPreviousL, groundPoint, incomingIndex)
				* incidenceCosine * incomingRecord.w;`;
	return `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uPreviousJ;
uniform sampler2D uPreviousL;
uniform sampler2D uF68Directions;
${common}
layout(location = 0) out float outputValue;
void main() {
	int directionIndex = int(gl_FragCoord.x);
	int row = int(gl_FragCoord.y);
	int positionIndex = row % POSITION_COUNT;
	int solarZenithIndex = row / POSITION_COUNT;
	vec3 origin = representativePoint(positionIndex, solarZenithIndex);
	vec3 localDirection = texelFetch(uF68Directions, ivec2(directionIndex, 0), 0).xyz;
	vec3 direction = incomingPhysicalDirection(origin, localDirection);
	if (radianceTransportBlocked(origin, direction)) { outputValue = 0.0; return; }
	float lengthMeters = atmosphereBranchLength(origin, direction);
	if (lengthMeters <= 0.0) { outputValue = 0.0; return; }
	float groundDistance = firstPositiveRoot(sphereRoots(origin, direction, BOTTOM_RADIUS));
	bool hitsGround = groundDistance < 1e29 && abs(groundDistance - lengthMeters) <= 1.0;
	float breaks[5];
	int breakCount = transportBreaks(origin, direction, lengthMeters, breaks);
	float transmittance = 1.0;
	float radiance = 0.0;
	${compensationDeclarations}
	for (int segmentIndex = 0; segmentIndex < 4; segmentIndex += 1) {
		if (segmentIndex + 1 >= breakCount) break;
		float start = breaks[segmentIndex];
		float end = breaks[segmentIndex + 1];
		float intervalLength = (end - start) / float(TRANSPORT_INTERVAL_COUNT);
		float previousExtinction = 0.0;
		for (int pointIndex = 0; pointIndex <= TRANSPORT_INTERVAL_COUNT; pointIndex += 1) {
			float distanceMeters = start + intervalLength * float(pointIndex);
			vec3 point = origin + direction * distanceMeters;
			Medium medium = sampleMediumAtPoint(point);
			if (pointIndex > 0) {
				transmittance *= exp(-0.5 * (previousExtinction + medium.extinction) * intervalLength);
			}
			float measure = intervalLength * (pointIndex == 0 || pointIndex == TRANSPORT_INTERVAL_COUNT ? 0.5 : 1.0);
			${radianceAddition}
			previousExtinction = medium.extinction;
		}
	}
	if (hitsGround && GROUND_ALBEDO > 0.0) {
		vec3 groundPoint = origin + direction * lengthMeters;
		float irradiance = 0.0;
		for (int incomingIndex = 0; incomingIndex < F68_COUNT; incomingIndex += 1) {
			vec4 incomingRecord = texelFetch(uF68Directions, ivec2(incomingIndex, 0), 0);
			vec3 incoming = incomingPhysicalDirection(groundPoint, incomingRecord.xyz);
			float incidenceCosine = max(0.0, dot(normalize(groundPoint), incoming));
			${irradianceAddition}
		}
		radiance += transmittance * irradiance * GROUND_ALBEDO / PI;
	}
	outputValue = radiance;
}`;
}

function packedRowAccumulatorFragment() {
	return `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uPreviousCache;
uniform sampler2D uPureJ;
uniform highp isampler2D uSourceRows;
uniform bool uFirstOrder;
layout(location = 0) out float outputValue;

void main() {
	int directionIndex = int(gl_FragCoord.x);
	int packedRow = int(gl_FragCoord.y);
	int sourceRow = texelFetch(uSourceRows, ivec2(packedRow, 0), 0).r;
	float previous = uFirstOrder ? 0.0
		: texelFetch(uPreviousCache, ivec2(directionIndex, packedRow), 0).r;
	float orderValue = texelFetch(uPureJ, ivec2(directionIndex, sourceRow), 0).r;
	outputValue = previous + orderValue;
}`;
}

function uploadTextureUnit(gl, texture, unit, program, name) {
	gl.activeTexture(gl.TEXTURE0 + unit);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(gl.getUniformLocation(program, name), unit);
}

/**
 * Call this method to execute one Native15 wavelength through the actual-point N4 recurrence.
 * Tile delivery replaces complete-layer delivery when supplied. Each callback is awaited before
 * further readback. Invalid bounds, unsupported GPU capabilities, shader or readback failures, and
 * rejected callbacks abort execution; callers must discard incomplete extraction and preserve prior runs.
 *
 * @param {DistantSunSceneCacheWavelengthRequest} request - Exact inputs, GPU context, and extraction observers.
 * @returns {Promise<DistantSunSceneCacheWavelengthResult>} - Complete execution and allocation diagnostics.
 */
export async function compileDistantSunSceneCacheWavelength({
	gl,
	buildRequest,
	wavelengthIndex = 7,
	reportProgress = async (_stage) => {},
	compileSceneCaches = false,
	sceneCacheRequests = [],
	onSceneCacheLayer = async (_layer) => {},
	onSceneCacheTile = null,
	sceneCacheReadbackRowCount = 64,
	onSceneCacheOrderLayer = null,
	fieldProbeCoordinates = {},
	onFieldProbes = null,
}) {
	if (onSceneCacheTile !== null) {
		requireCondition(typeof onSceneCacheTile === 'function', 'Scene-cache tile receiver must be callable.');
		requireCondition(
			Number.isInteger(sceneCacheReadbackRowCount) &&
				sceneCacheReadbackRowCount >= 1 &&
				sceneCacheReadbackRowCount <= 64,
			'Scene-cache tile readback must contain between one and 64 rows.',
		);
	}
	requireCondition(gl instanceof WebGL2RenderingContext, 'ZP3 requires WebGL2.');
	requireCondition(gl.getExtension('EXT_color_buffer_float'), 'EXT_color_buffer_float is required.');
	const spec = buildRequest.transportSpec;
	const domains = spec.domains;
	const channel = domains.spectrum.channels[wavelengthIndex];
	requireCondition(channel, 'Selected wavelength index is outside Native15.');
	const ozone = spec.atmosphere.ozone;
	const coordinate =
		(channel.centerNanometers - ozone.crossSectionTable.minimumNanometers) /
		ozone.crossSectionTable.spacingNanometers;
	const lower = Math.floor(coordinate);
	const upper = Math.min(ozone.crossSectionTable.values.length - 1, lower + 1);
	const fraction = coordinate - lower;
	const ozoneCrossSection =
		ozone.crossSectionTable.values[lower] * (1 - fraction) + ozone.crossSectionTable.values[upper] * fraction;
	const shaderProfile = spec.shaderProfile ?? {};
	const coordinateContract = shaderProfile.coordinateContract ?? 'scene-cache-receiver-local-v1';
	const sourceAligned = coordinateContract === 'production-source-aligned-v1';
	const common = createDistantSunSceneCacheCommonShaderSource({
		wavelengthNanometers: channel.centerNanometers,
		sourceIrradiance: channel.sourceIrradianceDensityWattsPerSquareMeterPerNanometer,
		ozoneCrossSection,
		ozoneMaximumDensity: ozone.maximumDensityPerCubicMeter ?? 5.374e18,
		rayleighScattering: channel.rayleighScatteringPerMeter ?? null,
		mieExtinction: channel.mieExtinctionPerMeter ?? null,
		groundAlbedo: channel.groundAlbedo ?? 0,
		bottomRadiusMeters: spec.planet.bottomRadiusMeters,
		topRadiusMeters: spec.planet.topRadiusMeters,
		rayleighScaleHeightMeters: spec.atmosphere.rayleighScaleHeightMeters,
		mieScaleHeightMeters: spec.atmosphere.mieScaleHeightMeters,
		rayleighCoefficientScalePerMeter: spec.atmosphere.rayleighCoefficientScalePerMeter,
		mieAngstromAlpha: spec.atmosphere.mieAngstromAlpha,
		mieAngstromBeta: spec.atmosphere.mieAngstromBeta,
		mieSingleScatteringAlbedo: spec.atmosphere.mieSingleScatteringAlbedo,
		miePhaseFunctionG: spec.atmosphere.miePhaseFunctionG,
		sourcePathTransmittanceIntervalCount: spec.numerical.sourcePathTransmittanceIntervalCount,
		incomingDirectionCount: domains.incoming.directionCount,
		transportIntervalCount: spec.numerical.transportIntervalCount,
		outgoingFaceWidth: domains.outgoing.faceWidth,
		positionAltitudesMeters: domains.position.nodes.map((node) => node.altitudeMeters),
		solarZenithDegrees: domains.solarZenith.nodes.map((node) => node.solarZenithDegrees),
		coordinateContract,
		sourceDirection: spec.source.directionToLight,
	});
	const widthJ = domains.outgoing.directionCount;
	const widthL = domains.incoming.directionCount;
	const height = domains.position.count * domains.solarZenith.count;
	const maximumTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
	const maximumViewport = Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS));
	requireCondition(
		widthJ <= maximumTextureSize && height <= maximumTextureSize,
		`ZP3 field ${widthJ}x${height} exceeds MAX_TEXTURE_SIZE ${maximumTextureSize}.`,
	);
	requireCondition(
		widthJ <= maximumViewport[0] && height <= maximumViewport[1],
		`ZP3 field ${widthJ}x${height} exceeds MAX_VIEWPORT_DIMS ${maximumViewport}.`,
	);
	const framebuffer = gl.createFramebuffer();
	const vertexArray = gl.createVertexArray();
	requireCondition(framebuffer && vertexArray, 'Could not allocate ZP3 framebuffer state.');
	const f68Texture = createDirectionTexture(
		gl,
		domains.incoming.unitVectors,
		domains.incoming.integrationWeightsSteradians,
	);
	const outgoingDirectionTexture = createDirectionTexture(gl, domains.outgoing.unitVectors);
	const programs = {
		directBase: createProgram(gl, directBaseFragment(common), 'ZP3 direct base'),
		j1: createProgram(gl, j1Fragment(common), 'ZP3 J1'),
		l1: createProgram(gl, l1Fragment(common, sourceAligned), 'ZP3 L1'),
		scatter: createProgram(gl, scatterFragment(common, sourceAligned), 'ZP3 scatter'),
		transport: createProgram(gl, transportFragment(common, sourceAligned), 'ZP3 transport'),
		projection: compileSceneCaches
			? createProgram(gl, packedRowAccumulatorFragment(), 'P2 packed-row accumulation')
			: null,
	};
	const resources = new Map();
	const ledger = [];
	const timings = [];
	let liveBytes = 0;
	let peakLiveBytes = 0;
	const allocate = (id, width, internalFormat = Number(gl.R32F), format = Number(gl.RED), components = 1) => {
		const texture = createTexture(gl, {width, height, internalFormat, format});
		const bytes = width * height * components * 4;
		resources.set(id, {id, texture, width, height, bytes});
		liveBytes += bytes;
		peakLiveBytes = Math.max(peakLiveBytes, liveBytes);
		ledger.push({operation: 'allocate', id, bytes, liveBytes});
		return resources.get(id);
	};
	const release = (id) => {
		const resource = resources.get(id);
		requireCondition(resource, `Cannot release missing field ${id}.`);
		gl.deleteTexture(resource.texture);
		liveBytes -= resource.bytes;
		resources.delete(id);
		ledger.push({
			operation: 'release',
			id,
			bytes: resource.bytes,
			liveBytes,
			isTextureAfterDelete: gl.isTexture(resource.texture),
		});
	};
	const drawField = async ({id, program, output, width, inputs = [], uniforms = []}) => {
		const started = performance.now();
		bindFramebuffer(gl, framebuffer, output.texture);
		gl.useProgram(program);
		gl.bindVertexArray(vertexArray);
		for (const [unit, texture, name] of inputs) uploadTextureUnit(gl, texture, unit, program, name);
		for (const apply of uniforms) apply(program);
		const zenithRows = domains.position.count;
		for (let zenith = 0; zenith < domains.solarZenith.count; zenith += 1) {
			gl.viewport(0, zenith * zenithRows, width, zenithRows);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			gl.finish();
			requireNoGlError(gl, `${id} solar-zenith ${zenith}`);
			if (zenith % 10 === 9 || zenith === domains.solarZenith.count - 1) {
				await reportProgress(`${id}:${zenith + 1}/${domains.solarZenith.count}`);
			}
		}
		const milliseconds = performance.now() - started;
		timings.push({id, milliseconds, outputField: output.id, inputFields: inputs.map((input) => input[3])});
		ledger.push({operation: 'pass', id, outputField: output.id, inputFields: inputs.map((input) => input[3])});
	};
	const probeZenithIndices = domains.solarZenith.count === 180 ? [45, 90, 99] : [0, 0, 0];
	const probeCoordinates = [
		{
			label: 'day-lower',
			x: domains.outgoing.positiveFaceCenterIndices.positiveX,
			y: probeZenithIndices[0] * domains.position.count + Math.min(8, domains.position.count - 1),
		},
		{
			label: 'terminator-middle',
			x: domains.outgoing.positiveFaceCenterIndices.positiveX,
			y: probeZenithIndices[1] * domains.position.count + Math.min(24, domains.position.count - 1),
		},
		{
			label: 'night-upper',
			x: domains.outgoing.positiveFaceCenterIndices.positiveZ,
			y: probeZenithIndices[2] * domains.position.count + domains.position.count - 1,
		},
	];
	const probe = (order, resource) => {
		bindFramebuffer(gl, framebuffer, resource.texture);
		return {
			order,
			fieldId: resource.id,
			values: probeCoordinates.map((coordinate) => {
				const value = new Float32Array(1);
				gl.readPixels(coordinate.x, coordinate.y, 1, 1, gl.RED, gl.FLOAT, value);
				requireNoGlError(gl, `${order} probe ${coordinate.label}`);
				return {...coordinate, value: value[0]};
			}),
		};
	};
	const projectionExposures = [];
	const accumulationProbes = [];
	const cacheResources = [];
	const readScalar = (texture, x, y, label) => {
		bindFramebuffer(gl, framebuffer, texture);
		const value = new Float32Array(1);
		gl.readPixels(x, y, 1, 1, gl.RED, gl.FLOAT, value);
		requireNoGlError(gl, label);
		return value[0];
	};
	const captureFieldProbes = async (fieldId, resource) => {
		if (onFieldProbes === null) return;
		const coordinates = fieldProbeCoordinates[fieldId] ?? [];
		const values = coordinates.map((coordinate) => ({
			...coordinate,
			value: readScalar(resource.texture, coordinate.x, coordinate.y, `P8 ${fieldId} probe ${coordinate.label}`),
		}));
		await onFieldProbes({fieldId, wavelengthIndex, values});
	};
	const accumulateOrder = async (order, pureJ) => {
		for (let cacheIndex = 0; cacheIndex < cacheResources.length; cacheIndex += 1) {
			const cacheState = cacheResources[cacheIndex];
			const destination = cacheState.textures[1 - cacheState.activeIndex];
			bindFramebuffer(gl, framebuffer, destination);
			gl.useProgram(programs.projection);
			gl.bindVertexArray(vertexArray);
			uploadTextureUnit(
				gl,
				cacheState.textures[cacheState.activeIndex],
				0,
				programs.projection,
				'uPreviousCache',
			);
			uploadTextureUnit(gl, pureJ.texture, 1, programs.projection, 'uPureJ');
			uploadTextureUnit(gl, cacheState.rowMapTexture, 2, programs.projection, 'uSourceRows');
			gl.uniform1i(gl.getUniformLocation(programs.projection, 'uFirstOrder'), order === 1 ? 1 : 0);
			gl.viewport(0, 0, widthJ, cacheState.request.ledger.retainedBlockCount);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			gl.finish();
			requireNoGlError(gl, `Offline scene cache ${cacheIndex} J${order} accumulation`);
			const packedRow = Math.floor(cacheState.request.ledger.retainedBlockCount / 2);
			const directionIndex = domains.outgoing.positiveFaceCenterIndices.positiveX;
			const sourceRow = cacheState.sourceRows[packedRow];
			const previous =
				order === 1
					? 0
					: readScalar(
							cacheState.textures[cacheState.activeIndex],
							directionIndex,
							packedRow,
							`Offline scene cache ${cacheIndex} J${order} previous probe`,
						);
			const pure = readScalar(
				pureJ.texture,
				directionIndex,
				sourceRow,
				`Offline scene cache ${cacheIndex} J${order} pure probe`,
			);
			const cumulative = readScalar(
				destination,
				directionIndex,
				packedRow,
				`Offline scene cache ${cacheIndex} J${order} cumulative probe`,
			);
			accumulationProbes.push({
				cacheIndex,
				cacheIdentity: cacheState.request.cacheIdentity,
				order,
				directionIndex,
				packedRow,
				sourceRow,
				previous,
				pure,
				cumulative,
				absoluteResidual: Math.abs(cumulative - (previous + pure)),
			});
			cacheState.activeIndex = 1 - cacheState.activeIndex;
			if (onSceneCacheOrderLayer !== null) {
				const packedHeight = cacheState.request.ledger.retainedBlockCount;
				bindFramebuffer(gl, framebuffer, cacheState.textures[cacheState.activeIndex]);
				const values = new Float32Array(widthJ * packedHeight);
				gl.readPixels(0, 0, widthJ, packedHeight, gl.RED, gl.FLOAT, values);
				requireNoGlError(gl, `P8 cache ${cacheIndex} J-through-${order} readback`);
				await onSceneCacheOrderLayer({cacheIndex, wavelengthIndex, order, values});
			}
			await reportProgress(`wavelength-${wavelengthIndex}:cache-${cacheIndex}:J${order}`);
		}
	};
	try {
		await reportProgress('programs-compiled');
		if (compileSceneCaches) {
			for (const request of sceneCacheRequests) {
				const sourceRows = new Int32Array(request.ledger.retainedBlockCount);
				for (const row of request.ledger.rows) {
					for (let z = row.firstSolarZenithIndex; z <= row.lastSolarZenithIndex; z += 1) {
						const packedRow = row.firstPackedRow + z - row.firstSolarZenithIndex;
						sourceRows[packedRow] = z * domains.position.count + row.altitudeIndex;
					}
				}
				cacheResources.push({
					request,
					sourceRows,
					rowMapTexture: createTexture(gl, {
						width: sourceRows.length,
						height: 1,
						internalFormat: gl.R32I,
						format: gl.RED_INTEGER,
						type: gl.INT,
						data: sourceRows,
					}),
					textures: [
						createTexture(gl, {width: widthJ, height: request.ledger.retainedBlockCount}),
						createTexture(gl, {width: widthJ, height: request.ledger.retainedBlockCount}),
					],
					activeIndex: 0,
				});
			}
		}
		const directBase = allocate('direct-base', 1, gl.RG32F, gl.RG, 2);
		await drawField({id: 'direct-base', program: programs.directBase, output: directBase, width: 1});
		const j1 = allocate('J1', widthJ);
		await drawField({
			id: 'J1',
			program: programs.j1,
			output: j1,
			width: widthJ,
			inputs: [
				[0, directBase.texture, 'uDirectBase', 'direct-base'],
				[1, outgoingDirectionTexture, 'uOutgoingDirections', 'outgoing-directions'],
			],
		});
		await captureFieldProbes('J1', j1);
		projectionExposures.push(probe('J1', j1));
		if (compileSceneCaches) await accumulateOrder(1, j1);
		release('J1');
		release('direct-base');

		const l1 = allocate('L1', widthL);
		await drawField({
			id: 'L1',
			program: programs.l1,
			output: l1,
			width: widthL,
			inputs: [[0, f68Texture, 'uF68Directions', 'F68-directions']],
		});
		await captureFieldProbes('L1', l1);
		const j2 = allocate('J2', widthJ);
		await drawField({
			id: 'J2',
			program: programs.scatter,
			output: j2,
			width: widthJ,
			inputs: [
				[0, l1.texture, 'uPreviousL', 'L1'],
				[1, f68Texture, 'uF68Directions', 'F68-directions'],
				[2, outgoingDirectionTexture, 'uOutgoingDirections', 'outgoing-directions'],
				...(sourceAligned ? [[3, l1.texture, 'uGroundIlluminationL', 'L1-ground-dummy']] : []),
			],
			uniforms: sourceAligned
				? [(program) => gl.uniform1i(gl.getUniformLocation(program, 'uScatteringOrder'), 2)]
				: [],
		});
		await captureFieldProbes('J2', j2);
		projectionExposures.push(probe('J2', j2));
		if (compileSceneCaches) await accumulateOrder(2, j2);
		const l2 = allocate('L2', widthL);
		await drawField({
			id: 'L2',
			program: programs.transport,
			output: l2,
			width: widthL,
			inputs: [
				[0, j2.texture, 'uPreviousJ', 'J2'],
				[1, f68Texture, 'uF68Directions', 'F68-directions'],
				[2, l1.texture, 'uPreviousL', 'L1'],
			],
		});
		await captureFieldProbes('L2', l2);
		release('J2');
		if (!sourceAligned) release('L1');

		const j3 = allocate('J3', widthJ);
		await drawField({
			id: 'J3',
			program: programs.scatter,
			output: j3,
			width: widthJ,
			inputs: [
				[0, l2.texture, 'uPreviousL', 'L2'],
				[1, f68Texture, 'uF68Directions', 'F68-directions'],
				[2, outgoingDirectionTexture, 'uOutgoingDirections', 'outgoing-directions'],
				...(sourceAligned ? [[3, l1.texture, 'uGroundIlluminationL', 'L1-ground']] : []),
			],
			uniforms: sourceAligned
				? [(program) => gl.uniform1i(gl.getUniformLocation(program, 'uScatteringOrder'), 3)]
				: [],
		});
		await captureFieldProbes('J3', j3);
		projectionExposures.push(probe('J3', j3));
		if (compileSceneCaches) await accumulateOrder(3, j3);
		const l3 = allocate('L3', widthL);
		await drawField({
			id: 'L3',
			program: programs.transport,
			output: l3,
			width: widthL,
			inputs: [
				[0, j3.texture, 'uPreviousJ', 'J3'],
				[1, f68Texture, 'uF68Directions', 'F68-directions'],
				[2, l2.texture, 'uPreviousL', 'L2'],
			],
		});
		await captureFieldProbes('L3', l3);
		release('J3');
		if (sourceAligned) release('L1');
		else release('L2');

		const j4 = allocate('J4', widthJ);
		await drawField({
			id: 'J4',
			program: programs.scatter,
			output: j4,
			width: widthJ,
			inputs: [
				[0, l3.texture, 'uPreviousL', 'L3'],
				[1, f68Texture, 'uF68Directions', 'F68-directions'],
				[2, outgoingDirectionTexture, 'uOutgoingDirections', 'outgoing-directions'],
				...(sourceAligned ? [[3, l2.texture, 'uGroundIlluminationL', 'L2-ground']] : []),
			],
			uniforms: sourceAligned
				? [(program) => gl.uniform1i(gl.getUniformLocation(program, 'uScatteringOrder'), 4)]
				: [],
		});
		await captureFieldProbes('J4', j4);
		projectionExposures.push(probe('J4', j4));
		if (compileSceneCaches) await accumulateOrder(4, j4);
		release('J4');
		release('L3');
		if (sourceAligned) release('L2');
		const compiledCaches = [];
		for (let cacheIndex = 0; cacheIndex < cacheResources.length; cacheIndex += 1) {
			const cacheState = cacheResources[cacheIndex];
			bindFramebuffer(gl, framebuffer, cacheState.textures[cacheState.activeIndex]);
			const packedHeight = cacheState.request.ledger.retainedBlockCount;
			let finite = true;
			let nonnegative = true;
			let maximum = 0;
			let readbackMilliseconds = 0;
			let deliveryMilliseconds = 0;
			const tileHeight = onSceneCacheTile === null ? packedHeight : sceneCacheReadbackRowCount;
			for (let firstPackedRow = 0; firstPackedRow < packedHeight; firstPackedRow += tileHeight) {
				const rowCount = Math.min(tileHeight, packedHeight - firstPackedRow);
				const values = new Float32Array(widthJ * rowCount);
				const readbackStarted = performance.now();
				gl.readPixels(0, firstPackedRow, widthJ, rowCount, gl.RED, gl.FLOAT, values);
				requireNoGlError(gl, `Offline scene cache ${cacheIndex} readback`);
				readbackMilliseconds += performance.now() - readbackStarted;
				for (let index = 0; index < values.length; index += 1) {
					finite &&= Number.isFinite(values[index]);
					nonnegative &&= values[index] >= 0;
					maximum = Math.max(maximum, values[index]);
				}
				const deliveryStarted = performance.now();
				if (onSceneCacheTile === null) await onSceneCacheLayer({cacheIndex, wavelengthIndex, values});
				else {
					requireCondition(finite && nonnegative, 'Scene-cache tile contains invalid spectral values.');
					await onSceneCacheTile({cacheIndex, wavelengthIndex, firstPackedRow, rowCount, values});
				}
				deliveryMilliseconds += performance.now() - deliveryStarted;
			}
			compiledCaches.push({
				cacheIndex,
				cacheIdentity: cacheState.request.cacheIdentity,
				packedRowCount: packedHeight,
				scalarCount: widthJ * packedHeight,
				logicalBytes: widthJ * packedHeight * Float32Array.BYTES_PER_ELEMENT,
				finite,
				nonnegative,
				maximum,
				readbackMilliseconds,
				deliveryMilliseconds,
			});
		}
		return {
			schemaId: 'algorithm32-distant-sun-offline-wavelength-result-v1',
			wavelength: {
				index: wavelengthIndex,
				centerNanometers: channel.centerNanometers,
				sourceIrradianceDensityWattsPerSquareMeterPerNanometer:
					channel.sourceIrradianceDensityWattsPerSquareMeterPerNanometer,
				ozoneCrossSectionSquareMeters: ozoneCrossSection,
			},
			fieldLayout: {widthJ, widthL, height, scalarBytes: 4},
			capabilities: {maximumTextureSize, maximumViewport},
			projectionExposures,
			accumulationProbes,
			compiledCaches,
			ledger,
			timings,
			peakLiveFieldBytes: peakLiveBytes,
			finalLiveFieldBytes: liveBytes,
		};
	} finally {
		for (const cacheState of cacheResources) {
			for (const texture of cacheState.textures) gl.deleteTexture(texture);
			gl.deleteTexture(cacheState.rowMapTexture);
		}
		for (const resource of resources.values()) gl.deleteTexture(resource.texture);
		resources.clear();
		for (const program of Object.values(programs)) if (program) gl.deleteProgram(program);
		gl.deleteTexture(f68Texture);
		gl.deleteTexture(outgoingDirectionTexture);
		gl.deleteVertexArray(vertexArray);
		gl.deleteFramebuffer(framebuffer);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindVertexArray(null);
	}
}
