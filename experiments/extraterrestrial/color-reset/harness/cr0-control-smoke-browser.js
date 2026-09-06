import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';

import {Algorithm32Bindings} from '../controls/production-v1/src/algorithm32/implementation/react-three/Algorithm32Bindings.js';
import {BrunetonSourceLuminanceLiftColorDisplayModel} from '../controls/production-v1/src/algorithm32/implementation/bruneton-source-luminance-lift-color/BrunetonSourceLuminanceLiftColorDisplayModel.js';
import {ThreeCacheBackend} from '../controls/production-v1/src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import {createDistantSunSceneState} from '../controls/production-v1/src/flat32/DistantSunSceneState.js';
import {SphericalDistantMode} from '../controls/production-v1/src/flat32/SphericalDistantMode.js';

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function dataUrlBytes(dataUrl) {
	const match = /^data:image\/png;base64,(.+)$/u.exec(dataUrl);
	if (!match) throw new Error('Render did not produce a PNG data URL.');
	const binary = atob(match[1]);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
	return bytes;
}

async function uploadPng(artifactPath, dataUrl) {
	const bytes = dataUrlBytes(dataUrl);
	const response = await fetch(`/artifact/${artifactPath}`, {
		method: 'POST',
		headers: {'content-type': 'image/png'},
		body: bytes,
	});
	if (!response.ok) throw new Error(`Artifact upload failed for ${artifactPath}: HTTP ${response.status}.`);
	return bytes.length;
}

function cameraDirection(camera) {
	const azimuth = camera.viewAzimuthDegrees * Math.PI / 180;
	const elevation = camera.viewElevationDegrees * Math.PI / 180;
	const horizontal = Math.cos(elevation);
	return new THREE.Vector3(
		Math.sin(azimuth) * horizontal,
		Math.sin(elevation),
		-Math.cos(azimuth) * horizontal,
	).normalize();
}

function pixelSummary(pixels, width, height) {
	const sums = [0, 0, 0];
	let nonBlackPixelCount = 0;
	let saturatedPixelCount = 0;
	let maximumChannel = 0;
	for (let index = 0; index < pixels.length; index += 4) {
		const red = pixels[index];
		const green = pixels[index + 1];
		const blue = pixels[index + 2];
		if (red !== 0 || green !== 0 || blue !== 0) nonBlackPixelCount += 1;
		if (red === 255 || green === 255 || blue === 255) saturatedPixelCount += 1;
		sums[0] += red;
		sums[1] += green;
		sums[2] += blue;
		maximumChannel = Math.max(maximumChannel, red, green, blue);
	}
	const centerIndex = (Math.floor(height / 2) * width + Math.floor(width / 2)) * 4;
	return {
		width,
		height,
		pixelCount: width * height,
		nonBlackPixelCount,
		blackPixelCount: width * height - nonBlackPixelCount,
		saturatedPixelCount,
		maximumChannel,
		meanRgb: sums.map((sum) => sum / (width * height)),
		centerRgba: Array.from(pixels.slice(centerIndex, centerIndex + 4)),
	};
}

function readSceneInput(renderer, composer, width, height, sceneDepthMax) {
	const capture = composer.passes.find(
		(pass) => pass.getDiagnostics?.().kind === 'algorithm32-scene-input-capture-pass',
	);
	if (!capture?._depthTarget || !capture?._hitTarget) {
		throw new Error('CR0 could not inspect the geometry scene-input targets.');
	}
	const x = Math.floor(width / 2);
	const y = Math.floor(height * 0.05);
	const depthRgba = new Uint8Array(4);
	const hitRgba = new Uint8Array(4);
	resultRead(renderer, capture._depthTarget, x, y, depthRgba);
	resultRead(renderer, capture._hitTarget, x, y, hitRgba);
	const packedDepth = depthRgba[0] * 65536 + depthRgba[1] * 256 + depthRgba[2];
	return {
		screenProbe: {x, yFromBottom: y},
		depthRgba: Array.from(depthRgba),
		hitRgba: Array.from(hitRgba),
		depthMeters: (packedDepth / 16777214) * sceneDepthMax.value,
	};
}

function resultRead(renderer, target, x, y, output) {
	renderer.readRenderTargetPixels(target, x, y, 1, 1, output);
}

function drainWebglErrors(context) {
	const errors = [];
	for (let error = context.getError(); error !== context.NO_ERROR; error = context.getError()) {
		errors.push(error);
	}
	return errors;
}

function captureFrame({canvas, context, renderer, composer, algorithm32, handle, width, height, sceneDepthMax}) {
	composer.render(0);
	const pixels = new Uint8Array(width * height * 4);
	context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, pixels);
	return {
		dataUrl: canvas.toDataURL('image/png'),
		pixels,
		summary: pixelSummary(pixels, width, height),
		geometryProbe: readSceneInput(renderer, composer, width, height, sceneDepthMax),
		colorId: algorithm32.config.config.color.id,
		brightnessProxy: algorithm32.brightnessProxy,
		sourceBrightness: algorithm32.sourceBrightness,
		diagnostics: handle.getDiagnostics(),
		webglErrors: drainWebglErrors(context),
		contextLost: context.isContextLost(),
	};
}

async function renderScenePair(configuration, sceneSpec, frameReady) {
	const {camera: cameraSpec, observer, location} = configuration;
	const physical = configuration.physicalControls;
	requireCondition(
		[
			cameraSpec.nearSceneUnits,
			cameraSpec.farSceneUnits,
			physical.sceneDepthMaxMeters,
			physical.sceneScaleMetersPerSceneUnit,
			physical.sourceAngularRadiusRadians,
		].every((value) => Number.isFinite(value) && value > 0) &&
			cameraSpec.nearSceneUnits < cameraSpec.farSceneUnits &&
			physical.sceneDepthMaxMeters ===
				cameraSpec.farSceneUnits * physical.sceneScaleMetersPerSceneUnit &&
			physical.maximumScatteringOrder === 4 &&
			physical.pathIntervalCount === 30 &&
			physical.pathSampleDistribution === 'quadratic-near-observer-v1' &&
			Number.isInteger(physical.groundWidthSegments) &&
			physical.groundWidthSegments > 0 &&
			Number.isInteger(physical.groundHeightSegments) &&
			physical.groundHeightSegments > 0,
		'CR0 physical/camera controls are incompatible with the fixed Q30 production path.',
	);
	const width = cameraSpec.widthPixels;
	const height = cameraSpec.heightPixels;
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: true,
		stencil: false,
		preserveDrawingBuffer: true,
	});
	if (!context) throw new Error('CR0 requires WebGL2.');
	const renderer = new THREE.WebGLRenderer({canvas, context});
	renderer.setPixelRatio(1);
	renderer.setSize(width, height, false);
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);
	const camera = new THREE.PerspectiveCamera(
		cameraSpec.verticalFieldOfViewDegrees,
		width / height,
		cameraSpec.nearSceneUnits,
		cameraSpec.farSceneUnits,
	);
	camera.position.set(0, observer.heightMeters / physical.sceneScaleMetersPerSceneUnit, 0);
	camera.lookAt(camera.position.clone().add(cameraDirection(cameraSpec)));
	camera.updateMatrixWorld(true);
	const sceneDepthMax = {value: physical.sceneDepthMaxMeters, units: 'meters'};
	const sceneScale = {
		value: physical.sceneScaleMetersPerSceneUnit,
		units: 'meters-per-scene-unit',
	};
	const target = new THREE.WebGLRenderTarget(width, height, {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBAFormat,
		type: THREE.HalfFloatType,
		depthBuffer: true,
		stencilBuffer: false,
	});
	target.texture.colorSpace = THREE.NoColorSpace;
	const composer = new EffectComposer(renderer, target);
	composer.setPixelRatio(1);
	composer.setSize(width, height);
	composer.addPass(new RenderPass(scene, camera));
	const backend = new ThreeCacheBackend({THREE, renderer});
	const observation = {
		instant: sceneSpec.timeIso,
		location: {
			latitude: {value: location.latitudeDegrees, units: 'degrees'},
			longitude: {value: location.longitudeDegrees, units: 'degrees'},
		},
	};
	const sceneState = createDistantSunSceneState({
		observation,
		observerHeight: {value: observer.heightMeters, units: 'meters'},
		observerUpDirection: observer.upDirection,
	});
	requireCondition(
		Math.abs(sceneState.solarZenithDegrees - sceneSpec.solarZenithDegrees) <= 1e-12,
		`${sceneSpec.id} browser solar zenith differs from the runner selection.`,
	);
	const mode = new SphericalDistantMode({
		sceneState,
		sceneScale,
		sourceAngularRadius: {value: physical.sourceAngularRadiusRadians, units: 'radians'},
		maximumScatteringOrder: physical.maximumScatteringOrder,
		celestialSourcesEnabled: false,
		colorDisplayModelConfiguration: {model: 'bruneton-control'},
		sceneCacheAsset: sceneSpec.sceneCacheAsset,
	});
	const algorithm32 = mode.algorithm32;
	const groundEndpoints = mode.geometry.createThreeEndpointObjects({
		name: `cr0-${sceneSpec.id}-spherical-ground`,
		sceneScale,
		widthSegments: physical.groundWidthSegments,
		heightSegments: physical.groundHeightSegments,
		visualMaterialColor: 0x000000,
		groundVisualMesh: {kind: 'local-spherical-patch'},
	});
	scene.add(...groundEndpoints.visualObjects);
	const bindingValues = Algorithm32Bindings.create(THREE, sceneDepthMax);
	Algorithm32Bindings.update({
		bindingValues,
		camera,
		props: {config: algorithm32.config.config, sceneScale},
	});
	let handle = null;
	try {
		handle = await algorithm32.setupShader({
			THREE,
			composer,
			scene,
			camera,
			viewportSize: {width, height, units: 'pixels'},
			sceneScale,
			sceneDepthMax,
			bindingValues,
			cacheBackend: backend,
		});
		await handle.prepare(renderer);
		const bruneton = captureFrame({
			canvas,
			context,
			renderer,
			composer,
			algorithm32,
			handle,
			width,
			height,
			sceneDepthMax,
		});
		const brunetonCacheController = handle._buildResult?.scatteringCacheController;
		const brunetonCache = handle._buildResult?.scatteringCache;
		await frameReady({
			controlId: 'bruneton',
			frame: bruneton,
			solarZenithDegrees: sceneState.solarZenithDegrees,
			cacheIdentity: sceneSpec.sceneCacheAsset.loadRequest.cacheIdentity,
		});

		await handle.setConfig({
			...algorithm32.config.config,
			color: new BrunetonSourceLuminanceLiftColorDisplayModel(),
		});
		const productionLift = captureFrame({
			canvas,
			context,
			renderer,
			composer,
			algorithm32,
			handle,
			width,
			height,
			sceneDepthMax,
		});
		const cacheReuse = {
			initialExactCachePublished: Boolean(brunetonCacheController && brunetonCache),
			controllerIdentityPreserved:
				Boolean(brunetonCacheController) &&
				handle._buildResult?.scatteringCacheController === brunetonCacheController,
			residentCacheIdentityPreserved:
				Boolean(brunetonCache) && handle._buildResult?.scatteringCache === brunetonCache,
		};
		await frameReady({
			controlId: 'production-lift',
			frame: productionLift,
			solarZenithDegrees: sceneState.solarZenithDegrees,
			cacheIdentity: sceneSpec.sceneCacheAsset.loadRequest.cacheIdentity,
		});
		return {
			sceneId: sceneSpec.id,
			solarZenithDegrees: sceneState.solarZenithDegrees,
			directionToSourceModel: sceneState.directionToSourceModel,
			cacheIdentity: sceneSpec.sceneCacheAsset.loadRequest.cacheIdentity,
			ground: groundEndpoints.metadata,
			gpu: {
				api: context.getParameter(context.VERSION),
				renderer: context.getParameter(
					context.getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL
						?? context.RENDERER,
				),
			},
			cacheReuse,
			frames: {bruneton, 'production-lift': productionLift},
		};
	} finally {
		handle?.dispose();
		for (const groundObject of groundEndpoints.visualObjects) {
			groundObject.geometry?.dispose();
			groundObject.material?.dispose();
		}
		mode.dispose();
		backend.dispose();
		composer.dispose();
		target.dispose();
		renderer.dispose();
		renderer.forceContextLoss();
		canvas.remove();
	}
}

function absoluteDifference(left, right, width, height) {
	requireCondition(left.length === right.length, 'Framebuffer lengths differ.');
	const pixels = new Uint8ClampedArray(left.length);
	const sums = [0, 0, 0];
	let maximumDifference = 0;
	let differingPixelCount = 0;
	let overOneCodePixelCount = 0;
	let squaredError = 0;
	let minimumX = width;
	let minimumY = height;
	let maximumX = -1;
	let maximumY = -1;
	for (let index = 0; index < left.length; index += 4) {
		let pixelMaximum = 0;
		for (let channel = 0; channel < 3; channel += 1) {
			const difference = Math.abs(left[index + channel] - right[index + channel]);
			pixels[index + channel] = difference;
			sums[channel] += difference;
			squaredError += difference * difference;
			maximumDifference = Math.max(maximumDifference, difference);
			pixelMaximum = Math.max(pixelMaximum, difference);
		}
		pixels[index + 3] = 255;
		if (pixelMaximum > 0) {
			differingPixelCount += 1;
			const pixel = index / 4;
			const x = pixel % width;
			const yFromBottom = Math.floor(pixel / width);
			const y = height - 1 - yFromBottom;
			minimumX = Math.min(minimumX, x);
			minimumY = Math.min(minimumY, y);
			maximumX = Math.max(maximumX, x);
			maximumY = Math.max(maximumY, y);
		}
		if (pixelMaximum > 1) overOneCodePixelCount += 1;
	}
	return {
		pixels,
		metrics: {
			maximumAbsoluteChannelDifference: maximumDifference,
			meanAbsoluteRgbDifference: sums.map((sum) => sum / (width * height)),
			rmseRgbCodes: Math.sqrt(squaredError / (width * height * 3)),
			differingPixelCount,
			overOneCodePixelCount,
			differingPixelFraction: differingPixelCount / (width * height),
			boundingBox:
				differingPixelCount === 0
					? null
					: {minimumX, minimumY, maximumX, maximumY},
		},
	};
}

function pixelsToPngDataUrl(pixels, width, height) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d');
	requireCondition(context, 'CR0 difference image requires a 2D canvas context.');
	const topDown = new Uint8ClampedArray(pixels.length);
	const rowBytes = width * 4;
	for (let y = 0; y < height; y += 1) {
		const sourceOffset = (height - 1 - y) * rowBytes;
		topDown.set(pixels.subarray(sourceOffset, sourceOffset + rowBytes), y * rowBytes);
	}
	context.putImageData(new ImageData(topDown, width, height), 0, 0);
	const dataUrl = canvas.toDataURL('image/png');
	canvas.remove();
	return dataUrl;
}

function loadImage(dataUrl) {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = reject;
		image.src = dataUrl;
	});
}

async function contactSheet(configuration, scenePairs) {
	const width = configuration.camera.widthPixels;
	const height = configuration.camera.heightPixels;
	const labelHeight = 34;
	const canvas = document.createElement('canvas');
	canvas.width = width * 2;
	canvas.height = (height + labelHeight) * scenePairs.length;
	const context = canvas.getContext('2d');
	requireCondition(context, 'CR0 contact sheet requires a 2D canvas context.');
	context.fillStyle = '#111';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#fff';
	context.font = '16px sans-serif';
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	for (let row = 0; row < scenePairs.length; row += 1) {
		const pair = scenePairs[row];
		const images = await Promise.all([
			loadImage(pair.frames.bruneton.dataUrl),
			loadImage(pair.frames['production-lift'].dataUrl),
		]);
		const top = row * (height + labelHeight);
		context.fillText(`${pair.label} - Unchanged Bruneton`, width / 2, top + labelHeight / 2);
		context.fillText(`${pair.label} - Current production lift`, width + width / 2, top + labelHeight / 2);
		context.drawImage(images[0], 0, top + labelHeight);
		context.drawImage(images[1], width, top + labelHeight);
	}
	const dataUrl = canvas.toDataURL('image/png');
	canvas.remove();
	return dataUrl;
}

/** Render the four CR0 controls and upload every required image before returning metrics. */
export async function runCr0ControlSmokeBrowser() {
	const configuration = await fetch('/browser/config.json').then((response) => response.json());
	await window.colorResetProgress('render-started');
	const pairs = [];
	const panelRecords = [];
	for (const sceneSpec of configuration.scenes) {
		const pair = await renderScenePair(configuration, sceneSpec, async (frameResult) => {
			const panel = configuration.panels.find(
				(candidate) =>
					candidate.sceneId === sceneSpec.id &&
					candidate.controlId === frameResult.controlId,
			);
			requireCondition(
				panel,
				`CR0 panel mapping is missing for ${sceneSpec.id}/${frameResult.controlId}.`,
			);
			const byteLength = await uploadPng(panel.artifactPath, frameResult.frame.dataUrl);
			panelRecords.push({
				...panel,
				byteLength,
				colorId: frameResult.frame.colorId,
				cacheIdentity: frameResult.cacheIdentity,
				solarZenithDegrees: frameResult.solarZenithDegrees,
				shaderSourceHash: frameResult.frame.diagnostics?.runtime?.sourceHash ?? null,
			});
			await window.colorResetProgress(`image-${sceneSpec.id}-${frameResult.controlId}`);
		});
		pair.label = sceneSpec.label;
		pairs.push(pair);
	}

	const differences = [];
	for (const pair of pairs) {
		const difference = absoluteDifference(
			pair.frames.bruneton.pixels,
			pair.frames['production-lift'].pixels,
			configuration.camera.widthPixels,
			configuration.camera.heightPixels,
		);
		const artifactPath = configuration.differences[pair.sceneId];
		const byteLength = await uploadPng(
			artifactPath,
			pixelsToPngDataUrl(
				difference.pixels,
				configuration.camera.widthPixels,
				configuration.camera.heightPixels,
			),
		);
		differences.push({sceneId: pair.sceneId, artifactPath, byteLength, ...difference.metrics});
	}
	const contactSheetDataUrl = await contactSheet(configuration, pairs);
	const contactSheetByteLength = await uploadPng(configuration.contactSheetPath, contactSheetDataUrl);
	await window.colorResetProgress('decision-plate-complete');

	return {
		schemaId: 'algorithm32-color-reset-cr0-browser-result-v1',
		software: {
			browserUserAgent: navigator.userAgent,
			threeRevision: THREE.REVISION,
		},
		panels: panelRecords,
		differences,
		contactSheet: {
			artifactPath: configuration.contactSheetPath,
			byteLength: contactSheetByteLength,
			width: configuration.camera.widthPixels * 2,
			height: (configuration.camera.heightPixels + 34) * pairs.length,
		},
		scenes: pairs.map((pair) => ({
			sceneId: pair.sceneId,
			label: pair.label,
			solarZenithDegrees: pair.solarZenithDegrees,
			directionToSourceModel: pair.directionToSourceModel,
			cacheIdentity: pair.cacheIdentity,
			ground: pair.ground,
			gpu: pair.gpu,
			cacheReuse: pair.cacheReuse,
			frames: Object.fromEntries(
				Object.entries(pair.frames).map(([id, frame]) => [
					id,
					{
						colorId: frame.colorId,
						brightnessProxy: frame.brightnessProxy,
						sourceBrightness: frame.sourceBrightness,
						summary: frame.summary,
						geometryProbe: frame.geometryProbe,
						diagnostics: frame.diagnostics,
						webglErrors: frame.webglErrors,
						contextLost: frame.contextLost,
					},
				]),
			),
		})),
	};
}
