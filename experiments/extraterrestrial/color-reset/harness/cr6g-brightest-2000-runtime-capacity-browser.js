const RESULT_SCHEMA_ID = 'algorithm32-color-reset-cr6g-runtime-capacity-browser-result-v1';

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

async function fetchBytes(record) {
	const response = await fetch(record.url);
	requireCondition(response.ok, `CR6G fetch failed for ${record.url}.`);
	const bytes = new Uint8Array(await response.arrayBuffer());
	requireCondition(bytes.byteLength === record.byteLength, `CR6G byte length changed for ${record.url}.`);
	const digest = await crypto.subtle.digest('SHA-256', bytes);
	const sha256 = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
	requireCondition(sha256 === record.sha256, `CR6G SHA-256 changed for ${record.url}.`);
	return bytes;
}

function compile(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	requireCondition(gl.getShaderParameter(shader, gl.COMPILE_STATUS), gl.getShaderInfoLog(shader));
	return shader;
}

function makeProgram(gl) {
	const program = gl.createProgram();
	gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, `#version 300 es
void main(){
  vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);
  gl_Position=vec4(p*2.0-1.0,0.0,1.0);
}`));
	gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, `#version 300 es
precision highp float;
uniform sampler2D sourceTexture;
uniform ivec2 sourceCoordinate;
out vec4 outputValue;
void main(){ outputValue=texelFetch(sourceTexture,sourceCoordinate,0); }
`));
	gl.linkProgram(program);
	requireCondition(gl.getProgramParameter(program, gl.LINK_STATUS), gl.getProgramInfoLog(program));
	return program;
}

function makeTexture(gl, {internalFormat, format, width, height, values}) {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, gl.FLOAT, values);
	requireCondition(gl.getError() === gl.NO_ERROR, 'CR6G texture upload failed.');
	return texture;
}

function sampleTexture(gl, program, texture, x, y) {
	const outputTexture = makeTexture(gl, {
		internalFormat: gl.RGBA32F,
		format: gl.RGBA,
		width: 1,
		height: 1,
		values: null,
	});
	const framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);
	requireCondition(gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE, 'CR6G float framebuffer is incomplete.');
	gl.viewport(0, 0, 1, 1);
	gl.useProgram(program);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(gl.getUniformLocation(program, 'sourceTexture'), 0);
	gl.uniform2i(gl.getUniformLocation(program, 'sourceCoordinate'), x, y);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
	const result = new Float32Array(4);
	gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, result);
	requireCondition(gl.getError() === gl.NO_ERROR, 'CR6G float readback failed.');
	gl.deleteFramebuffer(framebuffer);
	gl.deleteTexture(outputTexture);
	return result;
}

async function uploadDiagnostic(artifactPath, facts) {
	const canvas = document.createElement('canvas');
	canvas.width = 800;
	canvas.height = 480;
	const context = canvas.getContext('2d', {alpha: false});
	context.fillStyle = '#07111f';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#f4f7ff';
	context.font = 'bold 30px sans-serif';
	context.fillText('CR6G 2,000-member runtime capacity', 34, 52);
	context.fillStyle = '#9fb7d8';
	context.font = '18px sans-serif';
	const rows = [
		`WebGL2 renderer: ${facts.renderer}`,
		`MAX_TEXTURE_SIZE: ${facts.maximumTextureSize}`,
		`Spectra R32F: 2000 × 15 (${facts.spectraBytes} bytes)`,
		`Members RGBA32F: 2000 × 1 (${facts.memberBytes} bytes)`,
		`GPU sample comparisons: ${facts.sampleCount}, exact float32: ${facts.sampleExact}`,
		`WebGL errors: ${facts.webglErrorCount}`,
	];
	rows.forEach((row, index) => context.fillText(row, 52, 118 + index * 50));
	context.fillStyle = facts.sampleExact ? '#62e6b5' : '#ff718b';
	context.font = 'bold 22px sans-serif';
	context.fillText(facts.sampleExact ? 'CAPACITY AND READBACK PASS' : 'READBACK FAILURE', 52, 432);
	const blob = await new Promise((resolvePromise) => canvas.toBlob(resolvePromise, 'image/png'));
	const bytes = new Uint8Array(await blob.arrayBuffer());
	const response = await fetch(`/artifact/${artifactPath}`, {
		method: 'POST',
		headers: {'content-type': 'image/png'},
		body: bytes,
	});
	requireCondition(response.ok, 'CR6G diagnostic upload failed.');
	return {path: artifactPath, byteLength: bytes.byteLength, width: canvas.width, height: canvas.height};
}

export async function runCr6gBrightest2000RuntimeCapacityBrowser() {
	const configuration = await fetch('/browser/config.json').then((response) => response.json());
	const [memberBytes, spectraBytes] = await Promise.all([
		fetchBytes(configuration.browserInput.members),
		fetchBytes(configuration.browserInput.spectra),
	]);
	const members = new Float32Array(memberBytes.buffer, memberBytes.byteOffset, memberBytes.byteLength / 4);
	const spectra = new Float32Array(spectraBytes.buffer, spectraBytes.byteOffset, spectraBytes.byteLength / 4);
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {antialias: false, preserveDrawingBuffer: true});
	requireCondition(gl, 'CR6G requires WebGL2.');
	requireCondition(gl.getExtension('EXT_color_buffer_float'), 'CR6G requires EXT_color_buffer_float.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const renderer = debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
	const maximumTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
	requireCondition(maximumTextureSize >= 2000, 'CR6G texture width exceeds MAX_TEXTURE_SIZE.');
	const memberTexture = makeTexture(gl, {internalFormat: gl.RGBA32F, format: gl.RGBA, width: 2000, height: 1, values: members});
	const spectraTexture = makeTexture(gl, {internalFormat: gl.R32F, format: gl.RED, width: 2000, height: 15, values: spectra});
	const program = makeProgram(gl);
	const comparisons = [];
	for (const memberIndex of configuration.runtime.sampleMemberIndices) {
		const read = sampleTexture(gl, program, memberTexture, memberIndex, 0);
		for (let channel = 0; channel < 4; channel += 1) {
			comparisons.push({kind: 'member', memberIndex, channel, expected: members[memberIndex * 4 + channel], actual: read[channel]});
		}
		for (const channelIndex of configuration.runtime.sampleChannelIndices) {
			const spectralRead = sampleTexture(gl, program, spectraTexture, memberIndex, channelIndex);
			comparisons.push({kind: 'spectrum', memberIndex, channel: channelIndex, expected: spectra[channelIndex * 2000 + memberIndex], actual: spectralRead[0]});
		}
	}
	const sampleExact = comparisons.every(({expected, actual}) => Object.is(expected, actual));
	const webglErrorCount = gl.getError() === gl.NO_ERROR ? 0 : 1;
	const facts = {
		renderer,
		maximumTextureSize,
		memberBytes: memberBytes.byteLength,
		spectraBytes: spectraBytes.byteLength,
		sampleCount: comparisons.length,
		sampleExact,
		webglErrorCount,
	};
	const image = await uploadDiagnostic(configuration.outputs.diagnosticImage, facts);
	return {
		schemaId: RESULT_SCHEMA_ID,
		renderComplete: true,
		allDeclaredImagesUploaded: true,
		uploadOrder: [configuration.outputs.diagnosticImage],
		facts,
		comparisons,
		image,
	};
}
