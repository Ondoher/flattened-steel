const fail = (value, message) => {
	if (!value) throw new Error(message);
};

const floatBits = (value) => new Uint32Array(new Float32Array([value]).buffer)[0];

const sha256 = async (bytes) =>
	[...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
		.map((value) => value.toString(16).padStart(2, '0'))
		.join('');

const postProgress = async (completed, total, message) => {
	const response = await fetch('/progress', {
		method: 'POST',
		headers: {'content-type': 'application/json'},
		body: JSON.stringify({completed, total, message}),
	});
	fail(response.ok, 'The S9 progress endpoint rejected a browser event.');
};

function compileProgram(gl) {
	const compile = (type, source) => {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		fail(gl.getShaderParameter(shader, gl.COMPILE_STATUS), gl.getShaderInfoLog(shader));
		return shader;
	};
	const output = gl.createProgram();
	gl.attachShader(
		output,
		compile(gl.VERTEX_SHADER, '#version 300 es\nin vec2 p; void main(){gl_Position=vec4(p,0.,1.);}'),
	);
	gl.attachShader(
		output,
		compile(
			gl.FRAGMENT_SHADER,
			'#version 300 es\nprecision highp float; precision highp sampler2DArray; uniform sampler2DArray a; uniform ivec3 q; out vec4 c; void main(){c=vec4(texelFetch(a,q,0).r,0.,0.,1.);}',
		),
	);
	gl.bindAttribLocation(output, 0, 'p');
	gl.linkProgram(output);
	fail(gl.getProgramParameter(output, gl.LINK_STATUS), gl.getProgramInfoLog(output));
	return output;
}

function rendererIdentity(gl) {
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	return {
		vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
		renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
		version: gl.getParameter(gl.VERSION),
	};
}

export async function runS9WholeRouteCapacity() {
	const input = await fetch('/browser-input.json', {cache: 'no-store'}).then((response) => response.json());
	const canvas = document.createElement('canvas');
	canvas.width = 1;
	canvas.height = 1;
	const gl = canvas.getContext('webgl2', {powerPreference: 'high-performance'});
	fail(gl, 'WebGL2 is unavailable.');
	fail(gl.getExtension('EXT_color_buffer_float'), 'EXT_color_buffer_float is unavailable.');

	const capabilities = {
		maximumTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
		maximumArrayTextureLayers: gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS),
		maximumTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
	};
	const identity = rendererIdentity(gl);
	if (
		capabilities.maximumTextureSize < input.atlas.widthTexels ||
		capabilities.maximumTextureSize < input.atlas.heightTexels ||
		capabilities.maximumArrayTextureLayers < input.atlas.layers
	) {
		return {
			schemaId: 'gpu-resident-shared-block-cache-s9-capacity-browser-v1',
			accepted: false,
			wholeRouteAllocated: false,
			failure: 'WebGL2 dimension or layer capability is below the S9 whole-route requirement.',
			capabilities,
			gpu: identity,
		};
	}

	const texture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
	while (gl.getError() !== gl.NO_ERROR) {
		// Clear inherited errors before measuring the allocation boundary.
	}
	const allocationStarted = performance.now();
	gl.texStorage3D(
		gl.TEXTURE_2D_ARRAY,
		1,
		gl.R32F,
		input.atlas.widthTexels,
		input.atlas.heightTexels,
		input.atlas.layers,
	);
	const allocationMilliseconds = performance.now() - allocationStarted;
	const allocationError = gl.getError();
	if (allocationError !== gl.NO_ERROR || gl.isContextLost()) {
		return {
			schemaId: 'gpu-resident-shared-block-cache-s9-capacity-browser-v1',
			accepted: false,
			wholeRouteAllocated: false,
			failure: `Whole-route texStorage3D failed with WebGL error ${allocationError}.`,
			allocationMilliseconds,
			allocationError,
			contextLost: gl.isContextLost(),
			capabilities,
			gpu: identity,
		};
	}

	const probeCoordinates = input.probeCoordinates;
	const expectedProbes = [];
	const uploads = [];
	let totalTransferMilliseconds = 0;
	let totalAuthenticationMilliseconds = 0;
	let totalUploadSubmissionMilliseconds = 0;
	for (const [ordinal, block] of input.blocks.entries()) {
		const transferStarted = performance.now();
		const response = await fetch(`/blocks/${block.blockIndex}`, {cache: 'no-store'});
		fail(response.ok, `Missing authenticated S9 block ${block.blockIndex}.`);
		let bytes = await response.arrayBuffer();
		const transferMilliseconds = performance.now() - transferStarted;
		totalTransferMilliseconds += transferMilliseconds;

		const authenticationStarted = performance.now();
		const digest = await sha256(bytes);
		const authenticationMilliseconds = performance.now() - authenticationStarted;
		totalAuthenticationMilliseconds += authenticationMilliseconds;
		fail(digest === block.decodedSha256, `Browser decoded identity failed for block ${block.blockIndex}.`);
		fail(bytes.byteLength === block.decodedByteLength, `Browser decoded length failed for block ${block.blockIndex}.`);

		let values = new Float32Array(bytes);
		for (const coordinate of probeCoordinates) {
			const rowTexel = coordinate.wavelengthIndex * input.atlas.blockRowCount + coordinate.blockRow;
			const value = values[rowTexel * input.atlas.widthTexels + coordinate.uniqueDirectionIndex];
			expectedProbes.push({
				blockIndex: block.blockIndex,
				slot: ordinal,
				...coordinate,
				expectedBits: floatBits(value),
			});
		}

		gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
		const uploadStarted = performance.now();
		gl.texSubImage3D(
			gl.TEXTURE_2D_ARRAY,
			0,
			0,
			0,
			ordinal,
			input.atlas.widthTexels,
			input.atlas.heightTexels,
			1,
			gl.RED,
			gl.FLOAT,
			values,
		);
		const uploadSubmissionMilliseconds = performance.now() - uploadStarted;
		totalUploadSubmissionMilliseconds += uploadSubmissionMilliseconds;
		const uploadError = gl.getError();
		fail(uploadError === gl.NO_ERROR, `Atlas upload failed for block ${block.blockIndex}: ${uploadError}.`);
		fail(!gl.isContextLost(), `WebGL context was lost while uploading block ${block.blockIndex}.`);
		uploads.push({
			blockIndex: block.blockIndex,
			slot: ordinal,
			decodedByteLength: bytes.byteLength,
			transferMilliseconds,
			authenticationMilliseconds,
			uploadSubmissionMilliseconds,
		});
		values = null;
		bytes = null;
		await postProgress(ordinal + 1, input.blocks.length, `Uploaded authenticated route block ${ordinal + 1}.`);
	}

	const finishStarted = performance.now();
	gl.finish();
	const gpuCompletionMilliseconds = performance.now() - finishStarted;
	fail(gl.getError() === gl.NO_ERROR, 'Whole-route gl.finish reported a WebGL error.');
	fail(!gl.isContextLost(), 'WebGL context was lost after whole-route upload completion.');

	const target = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, target);
	gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, 1, 1);
	const framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);
	fail(gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE, 'S9 float readback framebuffer is incomplete.');

	const draw = compileProgram(gl);
	const triangle = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	gl.useProgram(draw);
	gl.enableVertexAttribArray(0);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
	gl.uniform1i(gl.getUniformLocation(draw, 'a'), 0);
	const queryLocation = gl.getUniformLocation(draw, 'q');
	const actualPixel = new Float32Array(4);
	const mismatches = [];
	for (const probe of expectedProbes) {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
		gl.uniform3i(
			queryLocation,
			probe.uniqueDirectionIndex,
			probe.wavelengthIndex * input.atlas.blockRowCount + probe.blockRow,
			probe.slot,
		);
		gl.viewport(0, 0, 1, 1);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, actualPixel);
		const actualBits = floatBits(actualPixel[0]);
		if (actualBits !== probe.expectedBits) mismatches.push({...probe, actualBits});
	}

	const residentBlockIndices = new Set(input.blocks.map((block) => block.blockIndex));
	const missingSceneReferences = [];
	for (const scene of input.scenes) {
		for (const blockIndex of scene.requiredBlockIndices) {
			if (!residentBlockIndices.has(blockIndex)) missingSceneReferences.push({degrees: scene.degrees, blockIndex});
		}
	}

	const accepted =
		uploads.length === input.blocks.length &&
		mismatches.length === 0 &&
		missingSceneReferences.length === 0 &&
		!gl.isContextLost();
	return {
		schemaId: 'gpu-resident-shared-block-cache-s9-capacity-browser-v1',
		accepted,
		wholeRouteAllocated: true,
		atlas: input.atlas,
		capabilities,
		gpu: identity,
		allocationMilliseconds,
		gpuCompletionMilliseconds,
		uploadedBlockCount: uploads.length,
		uploadedBytes: uploads.reduce((total, upload) => total + upload.decodedByteLength, 0),
		totalTransferMilliseconds,
		totalAuthenticationMilliseconds,
		totalUploadSubmissionMilliseconds,
		uploads,
		probeCount: expectedProbes.length,
		mismatchCount: mismatches.length,
		mismatches,
		missingSceneReferences,
		contextLost: gl.isContextLost(),
		browserHeapBytes: Number.isFinite(performance.memory?.usedJSHeapSize)
			? performance.memory.usedJSHeapSize
			: null,
	};
}
