const fail = (value, message) => {
	if (!value) throw new Error(message);
};

const floatBits = (value) => new Uint32Array(new Float32Array([value]).buffer)[0];
const sha256 = async (bytes) =>
	[...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
		.map((value) => value.toString(16).padStart(2, '0'))
		.join('');
const progress = async (baseUrl, completed, total, message) => {
	const response = await fetch(`${baseUrl}/progress`, {
		method: 'POST',
		headers: {'content-type': 'application/json'},
		body: JSON.stringify({completed, total, message}),
	});
	fail(response.ok, 'S9.2 browser progress was rejected.');
};

function rendererIdentity(gl) {
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	return {
		vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
		renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
		version: gl.getParameter(gl.VERSION),
	};
}

function createMetadataTextures(gl, input) {
	const maximumPackedRows = Math.max(...input.scenes.map((scene) => scene.retainedBlockCount));
	const rowAddresses = new Uint16Array(maximumPackedRows * input.scenes.length * 2);
	rowAddresses.fill(0xffff);
	const ledgerValues = new Int32Array(48 * input.scenes.length * 4);
	for (const [sceneOrdinal, scene] of input.scenes.entries()) {
		let packedRow = 0;
		for (const segment of scene.segments) {
			const slot = input.blockSlots[String(segment.blockIndex)];
			fail(Number.isInteger(slot), `Scene references missing atlas block ${segment.blockIndex}.`);
			for (let offset = 0; offset < segment.rowCount; offset += 1) {
				const addressOffset = (sceneOrdinal * maximumPackedRows + packedRow) * 2;
				rowAddresses[addressOffset] = slot;
				rowAddresses[addressOffset + 1] = segment.firstBlockRow + offset;
				packedRow += 1;
			}
		}
		fail(packedRow === scene.retainedBlockCount, `Scene ${scene.degrees} row-address count changed.`);
		for (const row of scene.rows) {
			const offset = (sceneOrdinal * 48 + row.altitudeIndex) * 4;
			ledgerValues[offset] = row.firstSolarZenithIndex;
			ledgerValues[offset + 1] = row.lastSolarZenithIndex;
			ledgerValues[offset + 2] = row.firstPackedRow;
		}
	}

	const rowAddress = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, rowAddress);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(
		gl.TEXTURE_2D,
		0,
		gl.RG16UI,
		maximumPackedRows,
		input.scenes.length,
		0,
		gl.RG_INTEGER,
		gl.UNSIGNED_SHORT,
		rowAddresses,
	);

	const ledger = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, ledger);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(
		gl.TEXTURE_2D,
		0,
		gl.RGBA32I,
		48,
		input.scenes.length,
		0,
		gl.RGBA_INTEGER,
		gl.INT,
		ledgerValues,
	);
	fail(gl.getError() === gl.NO_ERROR, 'S9.2 metadata texture publication failed.');
	return {
		ledger,
		rowAddress,
		maximumPackedRows,
		rowAddressBytes: rowAddresses.byteLength,
		ledgerBytes: ledgerValues.byteLength,
	};
}

function compileProbeProgram(gl) {
	const compile = (type, source) => {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		fail(gl.getShaderParameter(shader, gl.COMPILE_STATUS), gl.getShaderInfoLog(shader));
		return shader;
	};
	const program = gl.createProgram();
	gl.attachShader(
		program,
		compile(
			gl.VERTEX_SHADER,
			'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID&1)*4-1,(gl_VertexID&2)*2-1);gl_Position=vec4(p,0.,1.);}',
		),
	);
	gl.attachShader(
		program,
		compile(
			gl.FRAGMENT_SHADER,
			'#version 300 es\nprecision highp float; precision highp sampler2DArray; uniform sampler2DArray a; uniform ivec3 q; uniform int component; out vec4 c; void main(){vec4 p=texelFetch(a,q,0);c=vec4(p[component],0.,0.,1.);}',
		),
	);
	gl.linkProgram(program);
	fail(gl.getProgramParameter(program, gl.LINK_STATUS), gl.getProgramInfoLog(program));
	return program;
}

function packetCoordinate(logicalDirectionIndex, wavelengthIndex, blockRow) {
	const face = Math.floor(logicalDirectionIndex / 729);
	const local = logicalDirectionIndex - face * 729;
	const v = Math.floor(local / 27);
	const u = local - v * 27;
	return {
		x: Math.floor(wavelengthIndex / 4) * 162 + face * 27 + u,
		y: blockRow * 27 + v,
		component: wavelengthIndex % 4,
	};
}

function packBlock(source, logicalToUnique) {
	const packed = new Float32Array(648 * 1728 * 4);
	for (let blockRow = 0; blockRow < 64; blockRow += 1) {
		for (let logical = 0; logical < 4374; logical += 1) {
			const unique = logicalToUnique[logical];
			const face = Math.floor(logical / 729);
			const local = logical - face * 729;
			const v = Math.floor(local / 27);
			const u = local - v * 27;
			const outputRow = blockRow * 27 + v;
			for (let channel = 0; channel < 15; channel += 1) {
				const x = Math.floor(channel / 4) * 162 + face * 27 + u;
				packed[(outputRow * 648 + x) * 4 + (channel % 4)] =
					source[(channel * 64 + blockRow) * 4058 + unique];
			}
		}
	}
	return packed;
}

async function runExactProbes(gl, atlas, probes) {
	const target = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, target);
	gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, 1, 1);
	const framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);
	fail(gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE, 'S9.2 probe target is incomplete.');
	const program = compileProbeProgram(gl);
	gl.useProgram(program);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlas);
	gl.uniform1i(gl.getUniformLocation(program, 'a'), 0);
	const coordinateLocation = gl.getUniformLocation(program, 'q');
	const componentLocation = gl.getUniformLocation(program, 'component');
	const pixel = new Float32Array(4);
	const mismatches = [];
	for (const probe of probes) {
		gl.uniform3i(coordinateLocation, probe.x, probe.y, probe.slot);
		gl.uniform1i(componentLocation, probe.component);
		gl.viewport(0, 0, 1, 1);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, pixel);
		const actualBits = floatBits(pixel[0]);
		if (actualBits !== probe.expectedBits) mismatches.push({...probe, actualBits});
	}
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	return mismatches;
}

export async function installS9SharedPacketAtlas(baseUrl) {
	const input = await fetch(`${baseUrl}/browser-input.json`, {cache: 'no-store'}).then((response) => response.json());
	const canvas = document.querySelector('#flat32-canvas');
	const gl = canvas?.getContext('webgl2');
	fail(gl, 'The live production WebGL2 context is unavailable.');
	fail(window.__s9SharedPacketShader, 'The S9.2 shader hook is unavailable.');
	fail(gl.getExtension('EXT_color_buffer_float'), 'EXT_color_buffer_float is unavailable.');
	const capabilities = {
		maximumTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
		maximumArrayTextureLayers: gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS),
		maximumTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
	};
	fail(capabilities.maximumTextureSize >= 1728, 'S9.2 packet-atlas height is unsupported.');
	fail(capabilities.maximumArrayTextureLayers >= input.blocks.length, 'S9.2 packet-atlas layer count is unsupported.');
	fail(capabilities.maximumTextureImageUnits >= 3, 'S9.2 requires three fragment texture units.');

	const mapBytes = await fetch(`${baseUrl}/direction-map`, {cache: 'no-store'}).then((response) => response.arrayBuffer());
	fail(await sha256(mapBytes) === input.directionMap.sha256, 'S9.2 logical-direction map identity failed.');
	const logicalToUnique = new Uint16Array(mapBytes);
	fail(logicalToUnique.length === 4374, 'S9.2 logical-direction map shape changed.');

	const atlas = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlas);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
	while (gl.getError() !== gl.NO_ERROR) {
		// Attribute only errors produced after this boundary.
	}
	const allocationStarted = performance.now();
	gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA32F, 648, 1728, input.blocks.length);
	const allocationMilliseconds = performance.now() - allocationStarted;
	fail(gl.getError() === gl.NO_ERROR && !gl.isContextLost(), 'S9.2 RGBA32F packet-atlas allocation failed.');

	const exactProbes = [];
	const uploads = [];
	let uploadedBytes = 0;
	for (const [slot, block] of input.blocks.entries()) {
		const transferStarted = performance.now();
		let bytes = await fetch(`${baseUrl}/blocks/${block.blockIndex}`, {cache: 'no-store'}).then((response) => response.arrayBuffer());
		const transferMilliseconds = performance.now() - transferStarted;
		const authenticationStarted = performance.now();
		fail(await sha256(bytes) === block.decodedSha256, `S9.2 decoded block ${block.blockIndex} identity failed.`);
		const authenticationMilliseconds = performance.now() - authenticationStarted;
		let source = new Float32Array(bytes);
		for (const probe of input.probeCoordinates) {
			const coordinate = packetCoordinate(probe.logicalDirectionIndex, probe.wavelengthIndex, probe.blockRow);
			const unique = logicalToUnique[probe.logicalDirectionIndex];
			exactProbes.push({
				blockIndex: block.blockIndex,
				slot,
				...probe,
				...coordinate,
				expectedBits: floatBits(source[(probe.wavelengthIndex * 64 + probe.blockRow) * 4058 + unique]),
			});
		}
		exactProbes.push({
			blockIndex: block.blockIndex,
			slot,
			blockRow: 17,
			wavelengthIndex: 15,
			logicalDirectionIndex: 729,
			...packetCoordinate(729, 15, 17),
			expectedBits: floatBits(0),
		});
		const packingStarted = performance.now();
		let packed = packBlock(source, logicalToUnique);
		const packingMilliseconds = performance.now() - packingStarted;
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlas);
		const uploadStarted = performance.now();
		gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, slot, 648, 1728, 1, gl.RGBA, gl.FLOAT, packed);
		const uploadSubmissionMilliseconds = performance.now() - uploadStarted;
		fail(gl.getError() === gl.NO_ERROR && !gl.isContextLost(), `S9.2 packet upload ${block.blockIndex} failed.`);
		uploadedBytes += packed.byteLength;
		uploads.push({
			blockIndex: block.blockIndex,
			slot,
			decodedBytes: bytes.byteLength,
			packetBytes: packed.byteLength,
			transferMilliseconds,
			authenticationMilliseconds,
			packingMilliseconds,
			uploadSubmissionMilliseconds,
		});
		packed = null;
		source = null;
		bytes = null;
		await progress(baseUrl, slot + 1, input.blocks.length, `Packed and uploaded route block ${slot + 1} of ${input.blocks.length}.`);
	}
	const finishStarted = performance.now();
	gl.finish();
	const gpuCompletionMilliseconds = performance.now() - finishStarted;
	fail(gl.getError() === gl.NO_ERROR && !gl.isContextLost(), 'S9.2 packet-atlas completion failed.');
	const metadata = createMetadataTextures(gl, input);
	const mismatches = await runExactProbes(gl, atlas, exactProbes);
	fail(mismatches.length === 0, `S9.2 packet atlas had ${mismatches.length} exact probe mismatches.`);
	const assets = {
		context: gl,
		atlas,
		rowAddress: metadata.rowAddress,
		ledger: metadata.ledger,
		units: {
			atlas: capabilities.maximumTextureImageUnits - 3,
			rowAddress: capabilities.maximumTextureImageUnits - 2,
			ledger: capabilities.maximumTextureImageUnits - 1,
		},
	};
	window.__s9SharedPacketShader.installAssets(assets);
	return {
		accepted: true,
		atlas: {format: 'RGBA32F', width: 648, height: 1728, layers: input.blocks.length, bytes: uploadedBytes},
		metadata: {
			maximumPackedRows: metadata.maximumPackedRows,
			rowAddressBytes: metadata.rowAddressBytes,
			ledgerBytes: metadata.ledgerBytes,
		},
		allocationMilliseconds,
		gpuCompletionMilliseconds,
		uploads,
		probeCount: exactProbes.length,
		mismatchCount: mismatches.length,
		mismatches,
		capabilities,
		gpu: rendererIdentity(gl),
		contextLost: gl.isContextLost(),
	};
}
