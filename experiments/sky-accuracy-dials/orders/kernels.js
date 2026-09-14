// Adapted from the authenticated production compiler. Shader template bodies are
// retained verbatim; orders/proof.mjs verifies their source equality before execution.
const VERTEX_SOURCE = `#version 300 es
void main() {
	vec2 position = gl_VertexID == 0 ? vec2(-1.0, -1.0)
		: gl_VertexID == 1 ? vec2(3.0, -1.0)
		: vec2(-1.0, 3.0);
	gl_Position = vec4(position, 0.0, 1.0);
}`;

/** Reject an invalid driver invariant. @param {unknown} condition @param {string} message */
export function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

/** Compile one retained shader source. @param {WebGL2RenderingContext} gl @param {number} type @param {string} source @param {string} label @returns {WebGLShader} */
export function compileShader(gl, type, source, label) {
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

/** Link the exact full-screen vertex and fragment sources. @param {WebGL2RenderingContext} gl @param {string} fragmentSource @param {string} label @returns {WebGLProgram} */
export function createProgram(gl, fragmentSource, label) {
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

/** Fail at the operation which produced a GL error. @param {WebGL2RenderingContext} gl @param {string} label */
export function requireNoGlError(gl, label) {
	const error = gl.getError();
	if (error !== gl.NO_ERROR) throw new Error(`${label} produced WebGL error ${error}.`);
}

/** Allocate a nearest-filtered field. @param {WebGL2RenderingContext} gl @param {SkySixTextureOptions} options @returns {WebGLTexture} */
export function createTexture(
	gl,
	{width, height, internalFormat = gl.R32F, format = gl.RED, type = gl.FLOAT, data = null},
) {
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

/** Preserve Float32 direction/weight packing. @param {WebGL2RenderingContext} gl @param {readonly SkyVector3[]} vectors @param {readonly number[] | null} [weights] @returns {WebGLTexture} */
export function createDirectionTexture(gl, vectors, weights = null) {
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

/** Attach and validate the owned output field. @param {WebGL2RenderingContext} gl @param {WebGLFramebuffer} framebuffer @param {WebGLTexture} texture */
export function bindFramebuffer(gl, framebuffer, texture) {
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	requireCondition(
		gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE,
		'GPU recurrence framebuffer is incomplete.',
	);
}

/** Exact production fragment template; receiver-local execution passes false. @param {string} common @returns {string} */
export function directBaseFragment(common) {
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

/** Exact production fragment template; receiver-local execution passes false. @param {string} common @returns {string} */
export function j1Fragment(common) {
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

/** Exact production fragment template; receiver-local execution passes false. @param {string} common @param {boolean} sourceAligned @returns {string} */
export function l1Fragment(common, sourceAligned) {
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

/** Exact production fragment template; receiver-local execution passes false. @param {string} common @param {boolean} sourceAligned @returns {string} */
export function scatterFragment(common, sourceAligned) {
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

/** Exact production fragment template; receiver-local execution passes false. @param {string} common @param {boolean} sourceAligned @returns {string} */
export function transportFragment(common, sourceAligned) {
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
