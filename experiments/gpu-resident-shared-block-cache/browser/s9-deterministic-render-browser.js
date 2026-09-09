const OUTPUT_WIDTH = 3840;
const OUTPUT_HEIGHT = 2160;
const OUTPUT_FRAMES_PER_SECOND = 60;
const OUTPUT_FRAME_COUNT = 1200;
const FRAME_DURATION_SECONDS = 1 / OUTPUT_FRAMES_PER_SECOND;
const MAXIMUM_MUXER_BATCH_BYTES = 4 * 1024 * 1024;
const CHECKPOINT_SLOTS = new Set([0, 300, 600, 900, 1199]);

const fail = (value, message) => {
	if (!value) throw new Error(message);
	return value;
};

const bytesToBase64 = (bytes) => {
	let binary = '';
	for (let index = 0; index < bytes.length; index += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
	}
	return btoa(binary);
};

const normalizedEncoderConfig = (config) => ({
	codec: config.codec,
	width: config.width,
	height: config.height,
	bitrate: config.bitrate,
	framerate: config.framerate,
	hardwareAcceleration: config.hardwareAcceleration,
	latencyMode: config.latencyMode,
	bitrateMode: config.bitrateMode,
	scalabilityMode: config.scalabilityMode,
	alpha: config.alpha,
	avc: config.avc,
});

async function testEncoderConfiguration(candidate) {
	const support = await VideoEncoder.isConfigSupported(candidate.config);
	if (!support.supported) return {id: candidate.id, supported: false, configured: false};
	const canvas = new OffscreenCanvas(OUTPUT_WIDTH, OUTPUT_HEIGHT);
	const context = fail(canvas.getContext('2d', {alpha: false}), 'Could not create the S9.5 codec-probe canvas.');
	context.fillStyle = '#5d7690';
	context.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
	let outputCount = 0;
	let outputByteLength = 0;
	let decoderConfig = null;
	let encodingError = null;
	const encoder = new VideoEncoder({
		output: (chunk, metadata) => {
			outputCount += 1;
			outputByteLength += chunk.byteLength;
			if (metadata?.decoderConfig) {
				const description = metadata.decoderConfig.description;
				decoderConfig = {
					codec: metadata.decoderConfig.codec,
					codedWidth: metadata.decoderConfig.codedWidth,
					codedHeight: metadata.decoderConfig.codedHeight,
					descriptionBase64: description
						? bytesToBase64(new Uint8Array(description))
						: null,
				};
			}
		},
		error: (error) => {
			encodingError = {name: error.name, message: error.message};
		},
	});
	try {
		encoder.configure(support.config);
		const frame = new VideoFrame(canvas, {timestamp: 0, duration: 16_667, alpha: 'discard'});
		encoder.encode(frame, {keyFrame: true});
		frame.close();
		await encoder.flush();
		return {
			id: candidate.id,
			supported: true,
			configured: encodingError === null && outputCount === 1 && outputByteLength > 0,
			requestedConfig: normalizedEncoderConfig(candidate.config),
			resolvedConfig: normalizedEncoderConfig(support.config),
			outputCount,
			outputByteLength,
			decoderConfig,
			encodingError,
		};
	} catch (error) {
		return {
			id: candidate.id,
			supported: true,
			configured: false,
			requestedConfig: normalizedEncoderConfig(candidate.config),
			resolvedConfig: normalizedEncoderConfig(support.config),
			encodingError: {name: error.name, message: error.message},
		};
	} finally {
		encoder.close();
	}
}

export async function selectS9VideoEncoderConfiguration() {
	fail(typeof VideoEncoder === 'function', 'S9.5 requires the WebCodecs VideoEncoder API.');
	fail(typeof VideoFrame === 'function', 'S9.5 requires the WebCodecs VideoFrame API.');
	const shared = {
		width: OUTPUT_WIDTH,
		height: OUTPUT_HEIGHT,
		bitrate: 40_000_000,
		framerate: OUTPUT_FRAMES_PER_SECOND,
		bitrateMode: 'variable',
		latencyMode: 'quality',
		avc: {format: 'avc'},
	};
	const candidates = [
		{
			id: 'avc-high-5.2-prefer-hardware',
			config: {...shared, codec: 'avc1.640034', hardwareAcceleration: 'prefer-hardware'},
		},
		{
			id: 'avc-high-5.2-no-preference',
			config: {...shared, codec: 'avc1.640034', hardwareAcceleration: 'no-preference'},
		},
		{
			id: 'avc-main-5.2-no-preference',
			config: {...shared, codec: 'avc1.4d0034', hardwareAcceleration: 'no-preference'},
		},
	];
	const outcomes = [];
	for (const candidate of candidates) {
		const outcome = await testEncoderConfiguration(candidate);
		outcomes.push(outcome);
		if (outcome.configured) {
			return {
				schemaId: 'gpu-resident-shared-block-cache-s9-webcodecs-selection-v1',
				selectedCandidateId: candidate.id,
				selectedConfig: normalizedEncoderConfig(candidate.config),
				outcomes,
			};
		}
	}
	throw new Error(`No S9.5 4K WebCodecs configuration encoded a probe frame: ${JSON.stringify(outcomes)}`);
}

function stateForRenderer(entry) {
	const direction = entry.state.directionToSunUpEastNorth;
	return {
		...entry.state,
		directionToSunModel: [direction[1], direction[2], direction[0]],
		cameraTargetScene: [direction[1], direction[0], -direction[2]],
	};
}

function applyState(application, state, fovDegrees) {
	const sceneRuntime = application._sceneRuntime;
	const runtime = application._modeController._activeRuntime;
	const mode = application._modeController._activeMode;
	const celestial = runtime._shaderHandle._buildResult.celestialGenerationParticipant;
	fail(celestial?._sun?._placement, 'S9.5 Sun generation participant is unavailable.');
	const camera = sceneRuntime.camera;
	if (camera.fov !== fovDegrees) {
		camera.fov = fovDegrees;
		camera.updateProjectionMatrix();
		celestial.markDirty('view');
	}
	camera.up.set(0, 1, 0);
	camera.lookAt(
		camera.position.x + state.cameraTargetScene[0],
		camera.position.y + state.cameraTargetScene[1],
		camera.position.z + state.cameraTargetScene[2],
	);
	camera.updateMatrixWorld(true);
	celestial._sun._placement = {...celestial._sun._placement, directionToSource: [...state.directionToSunModel]};
	celestial._sun.markDirty('view');
	application._endpointScene.updateDistantSunLighting(
		state.directionToSunModel,
		mode.algorithm32.receiverLight,
		mode.algorithm32.config.config.color,
	);
	sceneRuntime.refreshShadowMaps();
	window.__s9SharedPacketShader.setState({
		sceneOrdinal: state.cacheSceneDegrees - 30,
		directionToSunModel: state.directionToSunModel,
		qualityIntervalCount: state.qualityIntervalCount,
	});
	window.__s9SharedPacketShader.setEnabled(true);
}

function renderOneFrame(application) {
	const sceneRuntime = application._sceneRuntime;
	sceneRuntime._renderOperation();
	sceneRuntime._frameCount += 1;
	sceneRuntime.canvas.dataset.flat32FrameCount = String(sceneRuntime._frameCount);
	const sun = application._modeController._activeRuntime._shaderHandle._buildResult.celestialGenerationParticipant._sun;
	const center = [...sun.bindingValues()['runtime.celestial.sunScreenCenterPixels']];
	return {
		sunScreenCenterPixels: center,
		sunScreenCenterErrorPixels: Math.hypot(
			center[0] - sceneRuntime.canvas.width / 2,
			center[1] - sceneRuntime.canvas.height / 2,
		),
	};
}

const canvasPng = (canvas) => {
	if (typeof canvas.convertToBlob === 'function') return canvas.convertToBlob({type: 'image/png'});
	return new Promise((resolve, reject) =>
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error('S9.5 canvas PNG capture returned no bytes.'))),
			'image/png',
		),
	);
};

async function postProgress(baseUrl, message, completed, total) {
	const response = await fetch(`${baseUrl}/progress`, {
		method: 'POST',
		headers: {'content-type': 'application/json'},
		body: JSON.stringify({message, completed, total}),
	});
	fail(response.ok, `S9.5 progress publication failed: ${response.status}.`);
}

async function uploadPng(canvas, baseUrl, outputId, slotIndex) {
	const probeCanvas = new OffscreenCanvas(16, 9);
	const probeContext = fail(probeCanvas.getContext('2d', {alpha: false}), 'S9.5 PNG probe canvas failed.');
	probeContext.drawImage(canvas, 0, 0, probeCanvas.width, probeCanvas.height);
	const pixels = probeContext.getImageData(0, 0, probeCanvas.width, probeCanvas.height).data;
	let nonBlackPixelCount = 0;
	let rgbSum = 0;
	for (let offset = 0; offset < pixels.length; offset += 4) {
		const rgb = pixels[offset] + pixels[offset + 1] + pixels[offset + 2];
		rgbSum += rgb;
		if (rgb > 0) nonBlackPixelCount += 1;
	}
	const blob = await canvasPng(canvas);
	const response = await fetch(
		`${baseUrl}/captures/${outputId}-slot-${String(slotIndex).padStart(4, '0')}.png`,
		{method: 'POST', headers: {'content-type': 'image/png'}, body: blob},
	);
	fail(response.ok, `S9.5 PNG upload failed: ${response.status}.`);
	return {
		slotIndex,
		byteLength: blob.size,
		pixelProbe: {
			width: probeCanvas.width,
			height: probeCanvas.height,
			nonBlackPixelCount,
			meanRgbCodeValue: rgbSum / (probeCanvas.width * probeCanvas.height * 3),
		},
	};
}

function createBoundedMuxerSink(baseUrl, outputId) {
	let retained = [];
	let retainedBytes = 0;
	let batchIndex = 0;
	let maximumBufferedBytes = 0;
	const flush = async () => {
		if (retainedBytes === 0) return;
		const body = new Uint8Array(retainedBytes);
		let offset = 0;
		for (const chunk of retained) {
			body.set(chunk, offset);
			offset += chunk.byteLength;
		}
		retained = [];
		retainedBytes = 0;
		const response = await fetch(`${baseUrl}/video-chunks/${outputId}/${batchIndex}`, {
			method: 'POST',
			headers: {'content-type': 'application/octet-stream'},
			body,
		});
		fail(response.ok, `S9.5 video batch ${batchIndex} failed: ${response.status}.`);
		batchIndex += 1;
	};
	const writable = new WritableStream({
		async write(chunk) {
			let offset = 0;
			while (offset < chunk.byteLength) {
				const available = MAXIMUM_MUXER_BATCH_BYTES - retainedBytes;
				const length = Math.min(available, chunk.byteLength - offset);
				const copy = chunk.subarray(offset, offset + length).slice();
				retained.push(copy);
				retainedBytes += copy.byteLength;
				offset += length;
				maximumBufferedBytes = Math.max(maximumBufferedBytes, retainedBytes);
				if (retainedBytes === MAXIMUM_MUXER_BATCH_BYTES) await flush();
			}
		},
		async close() {
			await flush();
			const response = await fetch(`${baseUrl}/videos/${outputId}/finalize`, {method: 'POST'});
			fail(response.ok, `S9.5 video finalization failed: ${response.status}.`);
		},
	});
	return {
		writable,
		diagnostics: () => ({batchCount: batchIndex, maximumBufferedBytes}),
	};
}

export async function renderS9DeterministicVideo(configuration) {
	const {AppendOnlyStreamTarget, CanvasSource, Mp4OutputFormat, Output, Quality} = await import(
		configuration.mediabunnyModuleUrl
	);
	const mappingResponse = await fetch(configuration.mappingUrl, {cache: 'no-store'});
	fail(mappingResponse.ok, `S9.5 mapping fetch failed: ${mappingResponse.status}.`);
	const mapping = (await mappingResponse.text())
		.trim()
		.split('\n')
		.map((line) => JSON.parse(line));
	fail(mapping.length === OUTPUT_FRAME_COUNT, 'S9.5 mapping frame count changed.');
	fail(mapping.every((entry, index) => entry.slotIndex === index), 'S9.5 mapping slots are not contiguous.');
	const application = fail(window.__flat32S9Application, 'S9.5 application exposure is unavailable.');
	const sceneRuntime = application._sceneRuntime;
	const renderCanvas = sceneRuntime.canvas;
	const gl = fail(renderCanvas.getContext('webgl2'), 'S9.5 WebGL2 context is unavailable.');
	fail(
		gl.drawingBufferWidth === OUTPUT_WIDTH && gl.drawingBufferHeight === OUTPUT_HEIGHT,
		'S9.5 drawing buffer dimensions changed.',
	);
	const presentationCanvas = new OffscreenCanvas(OUTPUT_WIDTH, OUTPUT_HEIGHT);
	const presentationContext = fail(
		presentationCanvas.getContext('2d', {alpha: false}),
		'S9.5 could not create the retained presentation canvas.',
	);
	if (sceneRuntime._frameRequest !== null) {
		cancelAnimationFrame(sceneRuntime._frameRequest);
		sceneRuntime._frameRequest = null;
	}

	const packetRecords = [];
	const encoderConfigurations = [];
	const muxerSink = createBoundedMuxerSink(configuration.dataBaseUrl, configuration.outputId);
	const output = new Output({
		format: new Mp4OutputFormat({fastStart: 'fragmented', minimumFragmentDuration: 1}),
		target: new AppendOnlyStreamTarget(muxerSink.writable),
	});
	const selected = configuration.encoderSelection.selectedConfig;
	const videoSource = new CanvasSource(presentationCanvas, {
		codec: 'avc',
		quality: new Quality({bitrate: selected.bitrate, bitrateMode: selected.bitrateMode}),
		keyFrameInterval: 1,
		sizeChangeBehavior: 'deny',
		alpha: 'discard',
		latencyMode: selected.latencyMode,
		hardwareAcceleration: selected.hardwareAcceleration,
		fullCodecString: selected.codec,
		contentHint: 'detail',
		onEncoderConfig: (config) => encoderConfigurations.push(normalizedEncoderConfig(config)),
		onEncodedPacket: (packet) =>
			packetRecords.push({
				packetIndex: packetRecords.length,
				type: packet.type,
				timestampMicroseconds: packet.microsecondTimestamp,
				durationMicroseconds: packet.microsecondDuration,
				sequenceNumber: packet.sequenceNumber,
				byteLength: packet.byteLength,
			}),
	});
	output.addVideoTrack(videoSource, {frameRate: OUTPUT_FRAMES_PER_SECOND});
	output.setMetadataTags({
		title: `S9 ${configuration.outputId}`,
		comment: 'Offline deterministic evidence; generation time is not animation performance.',
	});
	await output.start();

	let renderedSourceStateCount = 0;
	let heldOutputSlotCount = 0;
	let maximumSunScreenCenterErrorPixels = 0;
	const captures = [];
	for (const entry of mapping) {
		const shouldRender = entry.mappingKind === 'ideal-equation' || !entry.heldFromPreviousSlot;
		if (shouldRender) {
			const state = stateForRenderer(entry);
			applyState(application, state, configuration.fovDegrees);
			const rendered = renderOneFrame(application);
			presentationContext.drawImage(renderCanvas, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
			maximumSunScreenCenterErrorPixels = Math.max(
				maximumSunScreenCenterErrorPixels,
				rendered.sunScreenCenterErrorPixels,
			);
			renderedSourceStateCount += 1;
		} else heldOutputSlotCount += 1;
		if (CHECKPOINT_SLOTS.has(entry.slotIndex)) {
			captures.push(
				await uploadPng(
					presentationCanvas,
					configuration.dataBaseUrl,
					configuration.outputId,
					entry.slotIndex,
				),
			);
		}
		await videoSource.add(
			entry.timestampMicroseconds / 1_000_000,
			FRAME_DURATION_SECONDS,
			{keyFrame: entry.slotIndex % OUTPUT_FRAMES_PER_SECOND === 0},
		);
		if ((entry.slotIndex + 1) % 60 === 0 || entry.slotIndex === mapping.length - 1) {
			await postProgress(
				configuration.dataBaseUrl,
				`Rendered and encoded ${configuration.outputId} slot ${entry.slotIndex + 1} of ${mapping.length}.`,
				entry.slotIndex + 1,
				mapping.length,
			);
		}
	}
	await output.finalize();
	const uploadResponse = await fetch(`${configuration.dataBaseUrl}/videos/${configuration.outputId}/receipt`, {
		cache: 'no-store',
	});
	fail(uploadResponse.ok, `S9.5 video receipt failed: ${uploadResponse.status}.`);
	const uploadResult = await uploadResponse.json();
	const mimeType = await output.getMimeType();
	fail(packetRecords.length === OUTPUT_FRAME_COUNT, 'S9.5 encoder did not retain one packet per output slot.');
	fail(packetRecords[0].timestampMicroseconds === 0, 'S9.5 first encoded timestamp changed.');
	fail(
		packetRecords.every((packet, index) =>
			index === 0
				? packet.type === 'key'
				: packet.timestampMicroseconds > packetRecords[index - 1].timestampMicroseconds,
		),
		'S9.5 packet timestamps are not strictly monotonic.',
	);
	return {
		schemaId: 'gpu-resident-shared-block-cache-s9-deterministic-video-v1',
		outputId: configuration.outputId,
		mappingKind: mapping[0].mappingKind,
		fovDegrees: configuration.fovDegrees,
		frameCount: mapping.length,
		renderedSourceStateCount,
		heldOutputSlotCount,
		presentationBuffer: 'retained-4k-offscreen-2d-canvas',
		maximumSunScreenCenterErrorPixels,
		captures,
		mimeType,
		encoderConfigurations,
		packetRecords,
		upload: {...uploadResult, transport: muxerSink.diagnostics()},
		browser: {
			drawingBuffer: {width: gl.drawingBufferWidth, height: gl.drawingBufferHeight},
			webglError: gl.getError(),
			contextLost: gl.isContextLost(),
		},
	};
}

const waitForVideoEvent = (video, successEvent) =>
	new Promise((resolve, reject) => {
		const cleanup = () => {
			video.removeEventListener(successEvent, succeeded);
			video.removeEventListener('error', failed);
		};
		const succeeded = () => {
			cleanup();
			resolve();
		};
		const failed = () => {
			cleanup();
			reject(new Error(`S9.5 video inspection failed with media error ${video.error?.code ?? 'unknown'}.`));
		};
		video.addEventListener(successEvent, succeeded, {once: true});
		video.addEventListener('error', failed, {once: true});
	});

export async function inspectS9DeterministicVideo(videoUrl) {
	const video = document.createElement('video');
	video.muted = true;
	video.preload = 'auto';
	video.src = videoUrl;
	await waitForVideoEvent(video, 'loadedmetadata');
	const seeks = [];
	for (const requestedSeconds of [0.1, 10, 19.8]) {
		const completion = waitForVideoEvent(video, 'seeked');
		video.currentTime = requestedSeconds;
		await completion;
		seeks.push({requestedSeconds, resolvedSeconds: video.currentTime, readyState: video.readyState});
	}
	const result = {
		videoWidth: video.videoWidth,
		videoHeight: video.videoHeight,
		durationSeconds: video.duration,
		seeks,
	};
	video.removeAttribute('src');
	video.load();
	return result;
}
