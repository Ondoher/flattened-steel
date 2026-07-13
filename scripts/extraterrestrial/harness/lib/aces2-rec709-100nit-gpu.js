import {
	ACES2_FIXED_SCENE_SCALE,
	ACES2_TABLE_SIZE,
	buildAces2Rec709100NitParameters,
} from './aces2-rec709-100nit-parameters.js';

export const ACES2_GPU_TRANSFORM_ID = 'aces2-rec709-d65-100nit-srgb-piecewise-direct-glsl-v1';

const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

void main() {
	vec2 position = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
	gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
}`;

export const ACES2_REC709_100NIT_FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D uInputTexture;
uniform sampler2D uReachTable;
uniform sampler2D uCuspTable;
uniform mat3 uRec709ToAp0;
uniform mat3 uAp0ToAp1;
uniform mat3 uAp1ToAp0;
uniform mat3 uInputRgbToCam;
uniform mat3 uInputConeToAab;
uniform mat3 uLimitAabToCone;
uniform mat3 uLimitCamToRgb;
uniform float uInputFLn;
uniform float uInputCz;
uniform float uInputInvCz;
uniform float uInputAwJ;
uniform float uInputInvAwJ;
uniform float uLimitInvCz;
uniform float uToneG;
uniform float uToneT1;
uniform float uToneS2;
uniform float uToneM2;
uniform float uToneForwardLimit;
uniform float uLimitJ;
uniform float uModelGammaInverse;
uniform float uSaturation;
uniform float uSaturationThreshold;
uniform float uCompression;
uniform float uChromaCompressionScale;
uniform float uMidJ;
uniform float uFocusDistance;
uniform float uLowerHullGammaInverse;
uniform ivec2 uHueSearchRange;
uniform bool uEncodeSrgb;

out vec4 outColor;

const float ACES_FIXED_SCENE_SCALE = ${ACES2_FIXED_SCENE_SCALE};
const float PI = 3.14159265358979;
const float J_SCALE = 100.0;
const float CAM_NL_OFFSET = 27.13;
const float FOCUS_GAIN_BLEND = 0.3;
const float CUSP_MID_BLEND = 1.3;
const float SMOOTH_CUSPS = 0.12;
const float COMPRESSION_THRESHOLD = 0.75;

vec3 coneCompressForward(vec3 value) {
	vec3 powered = pow(abs(value), vec3(0.42));
	return sign(value) * powered / (vec3(CAM_NL_OFFSET) + powered);
}

vec3 coneCompressInverse(vec3 value) {
	vec3 limited = min(abs(value), vec3(0.99));
	return sign(value) * pow(CAM_NL_OFFSET * limited / (vec3(1.0) - limited), vec3(1.0 / 0.42));
}

vec3 rgbToJmh(vec3 rgb) {
	vec3 cone = uInputRgbToCam * rgb;
	vec3 aab = uInputConeToAab * coneCompressForward(cone);
	if (aab.x <= 0.0) return vec3(0.0);
	float j = J_SCALE * pow(aab.x, uInputCz);
	float m = length(aab.yz);
	float hue = degrees(atan(aab.z, aab.y));
	if (hue < 0.0) hue += 360.0;
	return vec3(j, m, hue);
}

vec3 jmhToLimitRgb(vec3 jmh) {
	float radiansHue = radians(jmh.z);
	vec3 aab = vec3(
		pow(jmh.x / J_SCALE, uLimitInvCz),
		jmh.y * cos(radiansHue),
		jmh.y * sin(radiansHue)
	);
	vec3 coneCompressed = uLimitAabToCone * aab;
	return uLimitCamToRgb * coneCompressInverse(coneCompressed);
}

float toneScaleJ(float j) {
	float achromatic = uInputAwJ * pow(abs(j) / J_SCALE, uInputInvCz);
	float luminance = pow((CAM_NL_OFFSET * achromatic) / (1.0 - achromatic), 1.0 / 0.42);
	float mapped = uToneM2 * pow(luminance / (luminance + uToneS2 * uInputFLn), uToneG);
	float flare = max(0.0, mapped * mapped / (mapped + uToneT1));
	float response = pow(uInputFLn * 100.0 * flare, 0.42);
	float mappedJ = J_SCALE * pow((response / (CAM_NL_OFFSET + response)) * uInputInvAwJ, uInputCz);
	return sign(j) * mappedJ;
}

float sampleReach(float hue) {
	float base = floor(hue);
	int lowerIndex = int(base) + 1;
	float lower = texelFetch(uReachTable, ivec2(lowerIndex, 0), 0).r;
	float upper = texelFetch(uReachTable, ivec2(lowerIndex + 1, 0), 0).r;
	return mix(lower, upper, hue - base);
}

float wrapHue(float hue) {
	float wrapped = mod(hue, 360.0);
	return wrapped < 0.0 ? wrapped + 360.0 : wrapped;
}

vec2 sampleCuspJm(float hue) {
	float wrappedHue = wrapHue(hue);
	int lowerIndex = 0;
	int upperIndex = ${ACES2_TABLE_SIZE - 1};
	int index = int(floor(wrappedHue / 360.0 * 360.0)) + 1;
	for (int iteration = 0; iteration < 16; iteration += 1) {
		if (lowerIndex + 1 >= upperIndex) break;
		float currentHue = texelFetch(uCuspTable, ivec2(index, 0), 0).a;
		if (wrappedHue > currentHue) lowerIndex = index;
		else upperIndex = index;
		index = (lowerIndex + upperIndex) / 2;
	}
	vec4 lower = texelFetch(uCuspTable, ivec2(upperIndex - 1, 0), 0);
	vec4 upper = texelFetch(uCuspTable, ivec2(upperIndex, 0), 0);
	float weight = (wrappedHue - lower.a) / (upper.a - lower.a);
	return mix(lower.xy, upper.xy, weight);
}

float sampleUpperHullGamma(float hue) {
	float wrappedHue = wrapHue(hue);
	int index = int(floor(wrappedHue / 360.0 * float(${ACES2_TABLE_SIZE}))) + 1;
	int lowerIndex = max(1, index + uHueSearchRange.x);
	int upperIndex = min(${ACES2_TABLE_SIZE - 1}, index + uHueSearchRange.y);
	for (int iteration = 0; iteration < 16; iteration += 1) {
		if (lowerIndex + 1 >= upperIndex) break;
		index = (lowerIndex + upperIndex) / 2;
		float currentHue = texelFetch(uCuspTable, ivec2(index, 0), 0).a;
		if (wrappedHue > currentHue) lowerIndex = index;
		else upperIndex = index;
	}
	upperIndex = max(1, upperIndex);
	vec4 lower = texelFetch(uCuspTable, ivec2(upperIndex - 1, 0), 0);
	vec4 upper = texelFetch(uCuspTable, ivec2(upperIndex, 0), 0);
	float weight = wrappedHue - lower.a;
	return mix(lower.z, upper.z, weight);
}

vec4 sampleGamutParameters(float hue) {
	return vec4(sampleCuspJm(hue), sampleUpperHullGamma(hue), wrapHue(hue));
}

float toeForward(float value, float limit, float k1Input, float k2Input) {
	if (value > limit) return value;
	float k2 = max(k2Input, 0.001);
	float k1 = sqrt(k1Input * k1Input + k2 * k2);
	float k3 = (limit + k1) / (limit + k2);
	float minusB = k3 * value - k1;
	return 0.5 * (minusB + sqrt(minusB * minusB + 4.0 * k2 * k3 * value));
}

float chromaCompressionNorm(float cosineHue, float sineHue) {
	float cosine2 = 2.0 * cosineHue * cosineHue - 1.0;
	float sine2 = 2.0 * cosineHue * sineHue;
	float cosine3 = 4.0 * cosineHue * cosineHue * cosineHue - 3.0 * cosineHue;
	float sine3 = 3.0 * sineHue - 4.0 * sineHue * sineHue * sineHue;
	float value = 11.34072 * cosineHue
		+ 16.46899 * cosine2
		+ 7.88380 * cosine3
		+ 14.66441 * sineHue
		- 6.37224 * sine2
		+ 9.19364 * sine3
		+ 77.12896;
	return value * uChromaCompressionScale;
}

vec3 toneAndChromaCompress(vec3 jmh, float mappedJ, float reachMaximum) {
	float mappedM = jmh.y;
	if (jmh.y != 0.0) {
		float normalizedJ = mappedJ / uLimitJ;
		float shadowJ = max(0.0, 1.0 - normalizedJ);
		float radiansHue = radians(jmh.z);
		float norm = chromaCompressionNorm(cos(radiansHue), sin(radiansHue));
		float limit = pow(normalizedJ, uModelGammaInverse) * reachMaximum / norm;
		mappedM = jmh.y * pow(mappedJ / jmh.x, uModelGammaInverse) / norm;
		mappedM = limit - toeForward(
			limit - mappedM,
			limit - 0.001,
			shadowJ * uSaturation,
			sqrt(normalizedJ * normalizedJ + uSaturationThreshold)
		);
		mappedM = toeForward(mappedM, limit, normalizedJ * uCompression, shadowJ) * norm;
	}
	return vec3(mappedJ, mappedM, jmh.z);
}

float focusGain(float j, float cuspJ) {
	float threshold = mix(cuspJ, uLimitJ, FOCUS_GAIN_BLEND);
	if (j <= threshold) return 1.0;
	float gain = log((uLimitJ - threshold) / max(0.0001, uLimitJ - j)) / log(10.0);
	return gain * gain + 1.0;
}

float solveJIntersect(float j, float m, float focusJ, float slopeGain) {
	float scaledM = m / slopeGain;
	float a = scaledM / focusJ;
	if (j < focusJ) {
		float b = 1.0 - scaledM;
		float c = -j;
		return -2.0 * c / (b + sqrt(b * b - 4.0 * a * c));
	}
	float b = -(1.0 + scaledM + uLimitJ * a);
	float c = uLimitJ * scaledM + j;
	return -2.0 * c / (b - sqrt(b * b - 4.0 * a * c));
}

float gamutBoundary(
	vec2 cusp,
	float topGammaInverse,
	float sourceIntersection,
	float cuspIntersection,
	float slope
) {
	float lower = cuspIntersection
		* pow(sourceIntersection / cuspIntersection, uLowerHullGammaInverse)
		/ (cusp.x / cusp.y - slope);
	float upper = cusp.y * (uLimitJ - cuspIntersection)
		* pow((uLimitJ - sourceIntersection) / (uLimitJ - cuspIntersection), topGammaInverse)
		/ (slope * cusp.y + uLimitJ - cusp.x);
	float smoothing = SMOOTH_CUSPS * cusp.y;
	float weight = max(smoothing - abs(lower - upper), 0.0) / smoothing;
	return min(lower, upper) - weight * weight * weight * smoothing / 6.0;
}

float remapM(float m, float gamutBoundaryM, float reachBoundaryM) {
	float boundaryRatio = gamutBoundaryM / reachBoundaryM;
	float proportion = max(boundaryRatio, COMPRESSION_THRESHOLD);
	float threshold = proportion * gamutBoundaryM;
	if (m <= threshold || proportion >= 1.0) return m;
	float gamutOffset = gamutBoundaryM - threshold;
	float reachOffset = reachBoundaryM - threshold;
	float scale = reachOffset / (reachOffset / gamutOffset - 1.0);
	float normalized = (m - threshold) / scale;
	return threshold + scale * normalized / (1.0 + normalized);
}

vec3 gamutCompress(vec3 jmh, vec4 cuspRecord, float reachMaximum) {
	if (jmh.x <= 0.0) return vec3(0.0, 0.0, jmh.z);
	if (jmh.y < 0.0 || jmh.x > uLimitJ) return vec3(jmh.x, 0.0, jmh.z);
	vec2 cusp = cuspRecord.xy;
	float focusJ = mix(cusp.x, uMidJ, min(1.0, CUSP_MID_BLEND - cusp.x / uLimitJ));
	float slopeGain = uLimitJ * uFocusDistance * focusGain(jmh.x, cusp.x);
	float sourceIntersection = solveJIntersect(jmh.x, jmh.y, focusJ, slopeGain);
	float direction = sourceIntersection < focusJ ? sourceIntersection : uLimitJ - sourceIntersection;
	float slope = direction * (sourceIntersection - focusJ) / (focusJ * slopeGain);
	float cuspIntersection = solveJIntersect(cusp.x, cusp.y, focusJ, slopeGain);
	float boundaryM = gamutBoundary(cusp, cuspRecord.z, sourceIntersection, cuspIntersection, slope);
	if (boundaryM <= 0.0) return vec3(jmh.x, 0.0, jmh.z);
	float reachBoundaryM = uLimitJ * pow(sourceIntersection / uLimitJ, uModelGammaInverse)
		/ (uLimitJ / reachMaximum - slope);
	float mappedM = remapM(jmh.y, boundaryM, reachBoundaryM);
	return vec3(sourceIntersection + mappedM * slope, mappedM, jmh.z);
}

float srgbEncode(float linearValue) {
	float gamma = 2.4;
	float offset = 0.055;
	float boundary = pow(offset * gamma / ((gamma - 1.0) * (1.0 + offset)), gamma);
	float slope = pow((gamma - 1.0) / offset, gamma - 1.0) * pow((1.0 + offset) / gamma, gamma);
	if (linearValue >= boundary) return (1.0 + offset) * pow(linearValue, 1.0 / gamma) - offset;
	return linearValue * slope;
}

void main() {
	ivec2 coordinate = ivec2(gl_FragCoord.xy);
	vec4 inputSample = texelFetch(uInputTexture, coordinate, 0);
	vec3 aces = uRec709ToAp0 * (inputSample.rgb * ACES_FIXED_SCENE_SCALE);
	vec3 ap1 = clamp(uAp0ToAp1 * aces, vec3(0.0), vec3(uToneForwardLimit));
	vec3 clampedAces = uAp1ToAp0 * ap1;
	vec3 jmh = rgbToJmh(clampedAces);
	float mappedJ = toneScaleJ(jmh.x);
	float reachMaximum = sampleReach(jmh.z);
	vec3 toneCompressed = toneAndChromaCompress(jmh, mappedJ, reachMaximum);
	vec3 gamutCompressed = gamutCompress(toneCompressed, sampleGamutParameters(toneCompressed.z), reachMaximum);
	vec3 displayLinear = clamp(jmhToLimitRgb(gamutCompressed), vec3(0.0), vec3(1.0));
	vec3 encoded = vec3(
		srgbEncode(displayLinear.r),
		srgbEncode(displayLinear.g),
		srgbEncode(displayLinear.b)
	);
	outColor = vec4(uEncodeSrgb ? encoded : displayLinear, inputSample.a);
}`;

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function compileShader(gl, type, source) {
	const shader = gl.createShader(type);
	requireCondition(shader, 'WebGL could not allocate an ACES 2 shader.');
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(`ACES 2 GPU shader compilation failed: ${log}`);
	}
	return shader;
}

function createProgram(gl) {
	const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
	const fragment = compileShader(gl, gl.FRAGMENT_SHADER, ACES2_REC709_100NIT_FRAGMENT_SHADER_SOURCE);
	const program = gl.createProgram();
	requireCondition(program, 'WebGL could not allocate the ACES 2 program.');
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const log = gl.getProgramInfoLog(program);
		gl.deleteProgram(program);
		throw new Error(`ACES 2 GPU program link failed: ${log}`);
	}
	return program;
}

function columnMajor(matrix) {
	return new Float32Array([
		matrix[0],
		matrix[3],
		matrix[6],
		matrix[1],
		matrix[4],
		matrix[7],
		matrix[2],
		matrix[5],
		matrix[8],
	]);
}

function createTexture(gl, internalFormat, format, type, width, height, values) {
	const texture = gl.createTexture();
	requireCondition(texture, 'WebGL could not allocate an ACES 2 texture.');
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, values);
	return texture;
}

function setUniforms(gl, program, parameters) {
	const matrixUniforms = {
		uRec709ToAp0: parameters.matrices.rec709ToAp0,
		uAp0ToAp1: parameters.matrices.ap0ToAp1,
		uAp1ToAp0: parameters.matrices.ap1ToAp0,
		uInputRgbToCam: parameters.inputParameters.rgbToCam,
		uInputConeToAab: parameters.inputParameters.coneToAab,
		uLimitAabToCone: parameters.limitParameters.aabToCone,
		uLimitCamToRgb: parameters.limitParameters.camToRgb,
	};
	for (const [name, value] of Object.entries(matrixUniforms)) {
		gl.uniformMatrix3fv(gl.getUniformLocation(program, name), false, columnMajor(value));
	}
	const scalarUniforms = {
		uInputFLn: parameters.inputParameters.fLn,
		uInputCz: parameters.inputParameters.cz,
		uInputInvCz: parameters.inputParameters.invCz,
		uInputAwJ: parameters.inputParameters.awJ,
		uInputInvAwJ: parameters.inputParameters.invAwJ,
		uLimitInvCz: parameters.limitParameters.invCz,
		uToneG: parameters.tone.g,
		uToneT1: parameters.tone.t1,
		uToneS2: parameters.tone.s2,
		uToneM2: parameters.tone.m2,
		uToneForwardLimit: parameters.tone.forwardLimit,
		uLimitJ: parameters.compression.limitJ,
		uModelGammaInverse: parameters.compression.modelGammaInverse,
		uSaturation: parameters.compression.saturation,
		uSaturationThreshold: parameters.compression.saturationThreshold,
		uCompression: parameters.compression.compression,
		uChromaCompressionScale: parameters.compression.chromaCompressionScale,
		uMidJ: parameters.compression.midJ,
		uFocusDistance: parameters.compression.focusDistance,
		uLowerHullGammaInverse: parameters.compression.lowerHullGammaInverse,
	};
	for (const [name, value] of Object.entries(scalarUniforms)) {
		gl.uniform1f(gl.getUniformLocation(program, name), value);
	}
	gl.uniform2iv(
		gl.getUniformLocation(program, 'uHueSearchRange'),
		new Int32Array(parameters.compression.hueSearchRange),
	);
	gl.uniform1i(gl.getUniformLocation(program, 'uEncodeSrgb'), 1);
}

function bindStaticTextures(gl, program, reachTexture, cuspTexture) {
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, reachTexture);
	gl.uniform1i(gl.getUniformLocation(program, 'uReachTable'), 1);
	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, cuspTexture);
	gl.uniform1i(gl.getUniformLocation(program, 'uCuspTable'), 2);
}

export function createAces2Rec709100NitGpuTransform(gl) {
	requireCondition(gl instanceof WebGL2RenderingContext, 'ACES 2 GPU transform requires WebGL2.');
	requireCondition(gl.getExtension('EXT_color_buffer_float'), 'ACES 2 GPU parity requires EXT_color_buffer_float.');
	const parameters = buildAces2Rec709100NitParameters();
	const program = createProgram(gl);
	const vertexArray = gl.createVertexArray();
	requireCondition(vertexArray, 'WebGL could not allocate the ACES 2 vertex array.');
	const reachTexture = createTexture(gl, gl.R32F, gl.RED, gl.FLOAT, ACES2_TABLE_SIZE, 1, parameters.reachTable);
	const cuspTexture = createTexture(gl, gl.RGBA32F, gl.RGBA, gl.FLOAT, ACES2_TABLE_SIZE, 1, parameters.cuspTexture);
	gl.useProgram(program);
	gl.bindVertexArray(vertexArray);
	setUniforms(gl, program, parameters);
	bindStaticTextures(gl, program, reachTexture, cuspTexture);

	function render(input, width, height, targetFramebuffer = null, encodeSrgb = true) {
		requireCondition(input instanceof Float32Array, 'ACES 2 GPU input must be Float32Array.');
		requireCondition(input.length === width * height * 4, 'ACES 2 GPU input dimensions do not match.');
		const inputTexture = createTexture(gl, gl.RGBA32F, gl.RGBA, gl.FLOAT, width, height, input);
		gl.useProgram(program);
		gl.bindVertexArray(vertexArray);
		bindStaticTextures(gl, program, reachTexture, cuspTexture);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, inputTexture);
		gl.uniform1i(gl.getUniformLocation(program, 'uInputTexture'), 0);
		gl.uniform1i(gl.getUniformLocation(program, 'uEncodeSrgb'), encodeSrgb ? 1 : 0);
		gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);
		gl.viewport(0, 0, width, height);
		gl.disable(gl.BLEND);
		gl.disable(gl.DITHER);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		const error = gl.getError();
		gl.deleteTexture(inputTexture);
		requireCondition(error === gl.NO_ERROR, `ACES 2 GPU draw failed with WebGL error ${error}.`);
	}

	function transformFloat(input, width, height, encodeSrgb = true) {
		const outputTexture = createTexture(gl, gl.RGBA32F, gl.RGBA, gl.FLOAT, width, height, null);
		const framebuffer = gl.createFramebuffer();
		requireCondition(framebuffer, 'WebGL could not allocate the ACES 2 float framebuffer.');
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);
		requireCondition(
			gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE,
			'ACES 2 float framebuffer is incomplete.',
		);
		render(input, width, height, framebuffer, encodeSrgb);
		const output = new Float32Array(width * height * 4);
		gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, output);
		const error = gl.getError();
		gl.deleteFramebuffer(framebuffer);
		gl.deleteTexture(outputTexture);
		requireCondition(error === gl.NO_ERROR, `ACES 2 float readback failed with WebGL error ${error}.`);
		return output;
	}

	function transformCodes(input, width, height, encodeSrgb = true) {
		const outputTexture = createTexture(gl, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, width, height, null);
		const framebuffer = gl.createFramebuffer();
		requireCondition(framebuffer, 'WebGL could not allocate the ACES 2 code framebuffer.');
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);
		requireCondition(
			gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE,
			'ACES 2 code framebuffer is incomplete.',
		);
		render(input, width, height, framebuffer, encodeSrgb);
		const output = new Uint8Array(width * height * 4);
		gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, output);
		const error = gl.getError();
		gl.deleteFramebuffer(framebuffer);
		gl.deleteTexture(outputTexture);
		requireCondition(error === gl.NO_ERROR, `ACES 2 code readback failed with WebGL error ${error}.`);
		return output;
	}

	function transformDefaultFramebufferCodes(input, width, height, encodeSrgb) {
		requireCondition(
			width <= gl.drawingBufferWidth && height <= gl.drawingBufferHeight,
			'ACES 2 default-framebuffer evaluation exceeds the drawing buffer.',
		);
		render(input, width, height, null, encodeSrgb);
		const output = new Uint8Array(width * height * 4);
		gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, output);
		const error = gl.getError();
		requireCondition(
			error === gl.NO_ERROR,
			`ACES 2 default-framebuffer readback failed with WebGL error ${error}.`,
		);
		return output;
	}

	return {
		id: ACES2_GPU_TRANSFORM_ID,
		parameters,
		shaderSource: ACES2_REC709_100NIT_FRAGMENT_SHADER_SOURCE,
		transformFloat,
		transformCodes,
		transformDefaultFramebufferCodes,
		dispose() {
			gl.deleteTexture(reachTexture);
			gl.deleteTexture(cuspTexture);
			gl.deleteVertexArray(vertexArray);
			gl.deleteProgram(program);
		},
	};
}

export function createAces2GpuCanvas(width, height) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const gl = canvas.getContext('webgl2', {
		alpha: true,
		antialias: false,
		depth: false,
		stencil: false,
		premultipliedAlpha: false,
		preserveDrawingBuffer: true,
	});
	requireCondition(gl, 'A WebGL2 context is unavailable for the ACES 2 GPU transform.');
	return {canvas, gl};
}
