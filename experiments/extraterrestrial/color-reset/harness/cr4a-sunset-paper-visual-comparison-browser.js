import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';

import {Algorithm32Bindings} from '../controls/production-v1/src/algorithm32/implementation/react-three/Algorithm32Bindings.js';
import {ThreeCacheBackend} from '../controls/production-v1/src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import {createDistantSunSceneState} from '../controls/production-v1/src/flat32/DistantSunSceneState.js';
import {SphericalDistantMode} from '../controls/production-v1/src/flat32/SphericalDistantMode.js';
import {CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE} from '../lighting/Cr2ReceiverDiffuseQuadrature.js';
import {Native15BatchedSkyTransportSampler} from '../rendering/Native15BatchedSkyTransportSampler.js';
import {Native15SkyImageRenderer} from '../rendering/Native15SkyImageRenderer.js';
import {
	FIGURE1_LOW_SUN_AZIMUTH_RADIANS,
	FIGURE9_SOLAR_RADIUS_RADIANS,
	FIGURE9_SOURCE_AZIMUTH_RADIANS,
	PAPER_Z_UP_IDENTITY_ORIENTATION,
	createFigure1EquidistantDomeProjection,
	createFigure9PinholeProjection,
	createSourceRelativePaperOrientation,
} from '../rendering/PaperSkyImageProjection.js';

const NATIVE15_CHANNEL_COUNT = 15;
const FIRST_IMAGE_STAGE = 'first-image';
const DECISION_PLATE_STAGE = 'decision-plate';
const HEATMAP_LOG10_MINIMUM = -6;
const HEATMAP_LOG10_MAXIMUM = 5;

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function dataUrlBytes(dataUrl) {
	const match = /^data:image\/png;base64,(.+)$/u.exec(dataUrl);
	if (!match) throw new Error('CR4A canvas did not produce a PNG data URL.');
	const binary = atob(match[1]);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
	return bytes;
}

async function uploadBytes(artifactPath, bytes, contentType = 'application/octet-stream') {
	const response = await fetch('/artifact/' + artifactPath, {
		method: 'POST',
		headers: {'content-type': contentType},
		body: bytes,
	});
	if (!response.ok) {
		throw new Error(`CR4A upload failed for ${artifactPath}: HTTP ${response.status}.`);
	}
	return {artifactPath, byteLength: bytes.byteLength};
}

async function uploadJson(artifactPath, value) {
	const json = JSON.stringify(
		value,
		(key, item) => {
			if (item === undefined) {
				throw new TypeError(`CR4A durable JSON contains undefined at ${key || '<root>'}.`);
			}
			if (typeof item === 'number' && !Number.isFinite(item)) {
				throw new TypeError(`CR4A durable JSON contains a non-finite number at ${key || '<root>'}.`);
			}
			if (typeof item === 'bigint' || typeof item === 'function' || typeof item === 'symbol') {
				throw new TypeError(`CR4A durable JSON contains unsupported ${typeof item} at ${key || '<root>'}.`);
			}
			return item;
		},
		2,
	);
	return uploadBytes(artifactPath, new TextEncoder().encode(json + '\n'), 'application/json');
}

function rgbaCanvas(rgba, width, height) {
	requireCondition(rgba instanceof Uint8ClampedArray, 'CR4A RGBA input must be Uint8ClampedArray.');
	requireCondition(rgba.length === width * height * 4, 'CR4A RGBA byte count is inconsistent.');
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', {alpha: false, willReadFrequently: true});
	requireCondition(context, 'CR4A requires a 2D canvas context.');
	context.putImageData(new ImageData(rgba, width, height), 0, 0);
	return canvas;
}

async function uploadCanvas(artifactPath, canvas) {
	return uploadBytes(artifactPath, dataUrlBytes(canvas.toDataURL('image/png')), 'image/png');
}

function float32LittleEndianBytes(value) {
	requireCondition(value instanceof Float32Array, 'CR4A raw field must be Float32Array.');
	const nativeProbe = new Uint8Array(new Uint16Array([0x0102]).buffer);
	if (nativeProbe[0] === 0x02) {
		return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
	}
	const bytes = new Uint8Array(value.byteLength);
	const view = new DataView(bytes.buffer);
	for (let index = 0; index < value.length; index += 1) {
		view.setFloat32(index * Float32Array.BYTES_PER_ELEMENT, value[index], true);
	}
	return bytes;
}

function rawFieldDeclaration(fixture, id) {
	const entry = fixture.outputs.rawFields.find((candidate) => candidate.id === id);
	requireCondition(entry, `CR4A fixture does not declare raw field ${id}.`);
	return entry;
}

function imageDeclaration(fixture, id) {
	const entry = fixture.outputs.oursCleanPanels.find((candidate) => candidate.id === id);
	requireCondition(entry, `CR4A fixture does not declare image ${id}.`);
	return entry;
}

function compositeImageDeclaration(fixture, id) {
	const entry = fixture.outputs.compositeImages.find((candidate) => candidate.id === id);
	requireCondition(entry, `CR4A fixture does not declare composite image ${id}.`);
	return entry;
}

function requireCanvasDeclaration(canvas, declaration, expectedPath) {
	requireCondition(declaration.path === expectedPath, `CR4A ${declaration.id} output path changed.`);
	requireCondition(
		canvas.width === declaration.widthPixels && canvas.height === declaration.heightPixels,
		`CR4A ${declaration.id} dimensions changed.`,
	);
}

function drainWebglErrors(context) {
	const errors = [];
	for (let error = context.getError(); error !== context.NO_ERROR; error = context.getError()) {
		errors.push(error);
	}
	return errors;
}

function quadratureDirections() {
	const directions = new Float32Array(CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.sampleCount * 3);
	for (const [index, sample] of CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.samples.entries()) {
		directions.set(sample.directionLocal, index * 3);
	}
	return directions;
}

function measureDiffuseSkyIrradiance(pathRadianceValues, basis) {
	const samples = CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.samples;
	requireCondition(
		pathRadianceValues.length === samples.length * NATIVE15_CHANNEL_COUNT,
		'CR4A quadrature field has the wrong Native15 shape.',
	);
	const spectralIrradianceValues = new Float64Array(NATIVE15_CHANNEL_COUNT);
	for (let directionIndex = 0; directionIndex < samples.length; directionIndex += 1) {
		const weight = samples[directionIndex].irradianceWeightSteradians;
		for (let channelIndex = 0; channelIndex < NATIVE15_CHANNEL_COUNT; channelIndex += 1) {
			spectralIrradianceValues[channelIndex] +=
				pathRadianceValues[directionIndex * NATIVE15_CHANNEL_COUNT + channelIndex] * weight;
		}
	}
	let integratedWattsPerSquareMeter = 0;
	for (let channelIndex = 0; channelIndex < NATIVE15_CHANNEL_COUNT; channelIndex += 1) {
		integratedWattsPerSquareMeter +=
			spectralIrradianceValues[channelIndex] * basis.channels[channelIndex].width.value;
	}
	requireCondition(
		Number.isFinite(integratedWattsPerSquareMeter) && integratedWattsPerSquareMeter > 0,
		'CR4A sky irradiance must be positive and finite.',
	);
	return {spectralIrradianceValues, integratedWattsPerSquareMeter};
}

function summarizeImage(result) {
	return {
		schemaId: result.schemaId,
		projectionId: result.projectionId,
		width: result.width,
		height: result.height,
		pixelCount: result.pixelCount,
		directionCount: result.directionCount,
		basisHash: result.basisHash,
		projectionIdE8: result.projectionIdE8,
		colorId: result.colorId,
		radianceScale: result.radianceScale,
		brunetonDisplayEncoding: result.brunetonDisplayEncoding,
		hashes: result.hashes,
		statistics: result.statistics,
		transport: {
			implementationId: result.transport.implementationId,
			shaderSourceHash: result.transport.shaderSourceHash,
			batchCapacity: result.transport.batchCapacity,
			batchCount: result.transport.batchCount,
			gpuPassCount:
				result.transport.batchCount *
				result.transport.outputKinds.length *
				Math.ceil(NATIVE15_CHANNEL_COUNT / 4),
			elapsedMilliseconds: result.transport.elapsedMilliseconds,
			storage: result.transport.storage,
		},
		directDisk: result.directDisk
			? {
					blend: result.directDisk.blend,
					angularRadiusRadians: result.directDisk.angularRadiusRadians,
					directionCount: result.directDisk.directionCount,
					radianceInput: result.directDisk.radianceInput,
				}
			: null,
		derivation: result.derivation,
	};
}

function heatmapColor(t) {
	const stops = [
		[0, 0, 32],
		[20, 20, 140],
		[0, 180, 220],
		[80, 220, 80],
		[255, 210, 0],
		[255, 32, 0],
	];
	const scaled = Math.max(0, Math.min(1, t)) * (stops.length - 1);
	const lower = Math.min(stops.length - 2, Math.floor(scaled));
	const fraction = scaled - lower;
	return stops[lower].map((value, index) => Math.round(value + (stops[lower + 1][index] - value) * fraction));
}

function luminanceDiagnostic(linearSrgbPixels, projection) {
	const rgba = new Uint8ClampedArray(projection.pixelCount * 4);
	let finitePositiveCount = 0;
	let minimumPositive = Number.POSITIVE_INFINITY;
	let maximum = 0;
	for (let pixelIndex = 0; pixelIndex < projection.pixelCount; pixelIndex += 1) {
		const offset = pixelIndex * 3;
		const luminance = Math.max(
			0,
			0.2126 * linearSrgbPixels[offset] +
				0.7152 * linearSrgbPixels[offset + 1] +
				0.0722 * linearSrgbPixels[offset + 2],
		);
		const rgbaOffset = pixelIndex * 4;
		if (projection.pixelDirectionIndices?.[pixelIndex] < 0 || luminance <= 0) {
			rgba.set([0, 0, 0, 255], rgbaOffset);
			continue;
		}
		finitePositiveCount += 1;
		minimumPositive = Math.min(minimumPositive, luminance);
		maximum = Math.max(maximum, luminance);
		const normalized =
			(Math.log10(luminance) - HEATMAP_LOG10_MINIMUM) / (HEATMAP_LOG10_MAXIMUM - HEATMAP_LOG10_MINIMUM);
		rgba.set([...heatmapColor(normalized), 255], rgbaOffset);
	}
	return {
		rgba,
		statistics: {
			finitePositiveCount,
			minimumPositive: finitePositiveCount > 0 ? minimumPositive : null,
			maximum,
			log10Minimum: HEATMAP_LOG10_MINIMUM,
			log10Maximum: HEATMAP_LOG10_MAXIMUM,
			units: 'cd m^-2',
		},
	};
}

async function loadPaperBitmap(path, width, height) {
	const response = await fetch('/run/' + path);
	requireCondition(response.ok, `CR4A could not load ${path}.`);
	const bitmap = await createImageBitmap(await response.blob(), {
		colorSpaceConversion: 'none',
		premultiplyAlpha: 'none',
	});
	if (bitmap.width !== width || bitmap.height !== height) {
		bitmap.close();
		throw new Error(`${path} has unexpected dimensions.`);
	}
	return bitmap;
}

function createColumn({title, subtitle, entries, minimumWidth = 0}) {
	const headerHeight = 118;
	const labelHeight = 58;
	const gap = 12;
	const width = Math.max(minimumWidth, ...entries.map((entry) => entry.source.width)) + 40;
	const height = headerHeight + entries.reduce((sum, entry) => sum + labelHeight + entry.source.height + gap, 0);
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', {alpha: false});
	requireCondition(context, 'CR4A column requires a 2D canvas context.');
	context.fillStyle = '#0d1015';
	context.fillRect(0, 0, width, height);
	context.fillStyle = '#ffffff';
	context.font = 'bold 25px sans-serif';
	context.fillText(title, 20, 34);
	context.fillStyle = '#bfc6d1';
	context.font = '15px sans-serif';
	context.fillText(subtitle, 20, 64);
	context.fillText('Paper pixels are drawn at native size; labels are external.', 20, 89);
	let y = headerHeight;
	for (const entry of entries) {
		context.fillStyle = entry.kind === 'ours' ? '#18304a' : '#252932';
		context.fillRect(0, y, width, labelHeight);
		context.fillStyle = '#ffffff';
		context.font = 'bold 18px sans-serif';
		context.fillText(entry.label, 20, y + 24);
		context.fillStyle = '#c5ccd6';
		context.font = '13px sans-serif';
		context.fillText(entry.note, 20, y + 45);
		y += labelHeight;
		context.drawImage(entry.source, Math.floor((width - entry.source.width) / 2), y);
		y += entry.source.height + gap;
	}
	return canvas;
}

function createDecisionPlate({paperSwatch, paperDome, ours}) {
	const margin = 28;
	const labelHeight = 62;
	const titleHeight = 150;
	const swatchWidth = paperSwatch.width;
	const domeColumnWidth = Math.max(paperDome.width, ours.z87Dome.width, ours.actualDome.width);
	const leftWidth = swatchWidth;
	const rightWidth = domeColumnWidth;
	const contentHeight = Math.max(3 * (576 + labelHeight), 3 * (256 + labelHeight) + 256 + labelHeight);
	const canvas = document.createElement('canvas');
	canvas.width = margin * 3 + leftWidth + rightWidth;
	canvas.height = titleHeight + contentHeight + margin;
	const context = canvas.getContext('2d', {alpha: false});
	requireCondition(context, 'CR4A decision plate requires a 2D canvas context.');
	context.fillStyle = '#0b0e13';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#ffffff';
	context.font = 'bold 28px sans-serif';
	context.fillText('CR4A — sunset structure versus absolute presentation', margin, 38);
	context.fillStyle = '#c7ced8';
	context.font = '15px sans-serif';
	context.fillText(
		'Left: 36 W m⁻² normalized swatches (structure only). Right: unnormalized Bruneton domes.',
		margin,
		70,
	);
	context.fillText(
		'Qualitative reference only — no paper RMSE, similarity gate, model ranking, or absolute-accuracy claim.',
		margin,
		96,
	);
	context.fillStyle = '#ffcf70';
	context.fillText(
		'Algorithm32 panels: Native15 / exact scene cache / Q30. Paper panels retain original spectral contracts.',
		margin,
		122,
	);

	const drawEntry = (source, x, y, label, note) => {
		context.fillStyle = '#202631';
		context.fillRect(x, y, Math.max(source.width, rightWidth), labelHeight);
		context.fillStyle = '#ffffff';
		context.font = 'bold 17px sans-serif';
		context.fillText(label, x + 10, y + 23);
		context.fillStyle = '#c0c8d2';
		context.font = '13px sans-serif';
		context.fillText(note, x + 10, y + 45);
		context.drawImage(source, x, y + labelHeight);
	};
	let y = titleHeight;
	drawEntry(
		paperSwatch,
		margin,
		y,
		'Paper Bruneton sunrise swatch',
		'Original paper model; per-model 36 W m⁻² normalization',
	);
	y += 576 + labelHeight;
	drawEntry(
		ours.z87Swatch,
		margin,
		y,
		'Algorithm32 San Jose Z=87 bridge',
		'Native15/Q30; same normalization and pinhole/disk presentation',
	);
	y += 576 + labelHeight;
	drawEntry(
		ours.actualSwatch,
		margin,
		y,
		'Algorithm32 actual San Jose sunset',
		'Native15/Q30; normalized structure diagnostic, not absolute brightness',
	);

	const rightX = margin * 2 + leftWidth;
	y = titleHeight;
	drawEntry(paperDome, rightX, y, 'Paper Bruneton Z=87 dome', 'Full-spectral paper panel; no measurement row');
	y += 256 + labelHeight;
	drawEntry(
		ours.z87Dome,
		rightX,
		y,
		'Algorithm32 Z=87 absolute dome',
		'Native15/Q30; unchanged Bruneton, no disk or normalization',
	);
	y += 256 + labelHeight;
	drawEntry(ours.actualDome, rightX, y, 'Algorithm32 sunset absolute dome', 'Product-facing absolute presentation');
	y += 256 + labelHeight;
	drawEntry(ours.luminance, rightX, y, 'Sunset pre-display luminance', 'Fixed log₁₀ false color; −6 to +5 cd m⁻²');
	return canvas;
}

async function withSceneRuntime(configuration, sceneSpec, operation) {
	const runtime = configuration.algorithm32Control.runtime;
	const [width, height] = runtime.setupViewportPixels;
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: true,
		stencil: false,
		preserveDrawingBuffer: true,
	});
	requireCondition(context, 'CR4A requires WebGL2.');
	requireCondition(context.getExtension('EXT_color_buffer_float'), 'CR4A requires EXT_color_buffer_float.');
	const renderer = new THREE.WebGLRenderer({canvas, context});
	renderer.setPixelRatio(1);
	renderer.setSize(width, height, false);
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);
	const camera = new THREE.PerspectiveCamera(45, width / height, 0.002, 500);
	camera.position.set(0, configuration.location.observerAltitudeMeters / runtime.sceneScaleMetersPerSceneUnit, 0);
	camera.lookAt(0, camera.position.y, -1);
	camera.updateMatrixWorld(true);
	const target = new THREE.WebGLRenderTarget(width, height, {
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
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
			latitude: {value: configuration.location.latitudeDegrees, units: 'degrees'},
			longitude: {value: configuration.location.longitudeDegrees, units: 'degrees'},
		},
	};
	const sceneState = createDistantSunSceneState({
		observation,
		observerHeight: {value: configuration.location.observerAltitudeMeters, units: 'meters'},
		observerUpDirection: [0, 0, 1],
	});
	requireCondition(
		Math.abs(sceneState.solarZenithDegrees - sceneSpec.solarZenithDegrees) <= 1e-9,
		`${sceneSpec.id} solar zenith changed.`,
	);
	requireCondition(
		sceneState.directionToSourceModel.every(
			(component, index) => Math.abs(component - sceneSpec.directionToSourceLocal[index]) <= 1e-12,
		),
		`${sceneSpec.id} direction to source changed.`,
	);
	const sceneScale = {value: runtime.sceneScaleMetersPerSceneUnit, units: 'meters-per-scene-unit'};
	const sceneDepthMax = {value: runtime.sceneDepthMaxMeters, units: 'meters'};
	const mode = new SphericalDistantMode({
		sceneState,
		sceneScale,
		sourceAngularRadius: {value: runtime.sourceAngularRadiusRadians, units: 'radians'},
		maximumScatteringOrder: configuration.algorithm32Control.cache.maximumScatteringOrder,
		celestialSourcesEnabled: false,
		colorDisplayModelConfiguration: {model: 'bruneton-control'},
		sceneCacheAsset: sceneSpec.sceneCacheAsset,
		distantSunCacheState: 'ready',
	});
	const ground = mode.geometry.createThreeEndpointObjects({
		name: `cr4a-${sceneSpec.id}-spherical-ground`,
		sceneScale,
		widthSegments: runtime.groundWidthSegments,
		heightSegments: runtime.groundHeightSegments,
		visualMaterialColor: 0x000000,
		groundVisualMesh: {kind: 'local-spherical-patch'},
	});
	scene.add(...ground.visualObjects);
	const algorithm32 = mode.algorithm32;
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
		return await operation({
			THREE,
			renderer,
			backend,
			algorithm32,
			handle,
			bindingValues,
			sceneState,
			context,
			groundMetadata: ground.metadata,
		});
	} finally {
		handle?.dispose();
		for (const object of ground.visualObjects) {
			object.geometry?.dispose();
			object.material?.dispose();
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

async function renderScene(configuration, sceneSpec, state) {
	return withSceneRuntime(configuration, sceneSpec, async (runtime) => {
		const model = runtime.algorithm32._model;
		const sampler = new Native15BatchedSkyTransportSampler({
			THREE,
			renderer: runtime.renderer,
			backend: runtime.backend,
			algorithm32: runtime.algorithm32,
			handle: runtime.handle,
			bindingValues: runtime.bindingValues,
			maxDirectionsPerBatch: 4096,
		});
		const imageRenderer = new Native15SkyImageRenderer({
			model,
			transportSampler: sampler,
		});
		const quadrature = await sampler.sampleDirections({
			directionsLocal: quadratureDirections(),
			outputKinds: ['path-radiance'],
		});
		const irradiance = measureDiffuseSkyIrradiance(quadrature.pathRadianceValues, model.spectral.basis);
		const normalizationTarget =
			configuration.figure9SunriseSwatches.normalizationContract.targetTotalSkyIrradianceWattsPerSquareMeter;
		const normalizationFactor = normalizationTarget / irradiance.integratedWattsPerSquareMeter;
		const directLevel = runtime.algorithm32._localLightLevelCalculator.measureConfiguredDirectSource({
			geometry: model.geometry,
			atmosphere: model.atmosphere,
			observation: runtime.algorithm32.config.config.observation,
			celestialSources: model.celestialSources,
		});
		requireCondition(
			directLevel.directSpectralIrradiance.basisHash === model.spectral.basis.contentHash &&
				directLevel.directSpectralIrradiance.values.length === NATIVE15_CHANNEL_COUNT &&
				directLevel.directSpectralIrradiance.values.every((value) => Number.isFinite(value) && value >= 0),
			'CR4A direct solar irradiance is not finite nonnegative Native15.',
		);
		const solarSolidAngle = 2 * Math.PI * (1 - Math.cos(FIGURE9_SOLAR_RADIUS_RADIANS));
		const transmittedDiskRadianceValues = directLevel.directSpectralIrradiance.values.map(
			(value) => value / solarSolidAngle,
		);
		const figure1Orientation = createSourceRelativePaperOrientation({
			directionToSourceLocal: sceneSpec.directionToSourceLocal,
			paperSourceAzimuthRadians: FIGURE1_LOW_SUN_AZIMUTH_RADIANS,
		});
		const figure9Orientation = createSourceRelativePaperOrientation({
			directionToSourceLocal: sceneSpec.directionToSourceLocal,
			paperSourceAzimuthRadians: FIGURE9_SOURCE_AZIMUTH_RADIANS,
		});

		const renderRecord = async ({id, imageId, projection, scale, disk, encoding}) => {
			const image = imageDeclaration(configuration, imageId);
			const rawField = rawFieldDeclaration(configuration, id);
			requireCondition(
				projection.width === image.widthPixels && projection.height === image.heightPixels,
				`CR4A ${imageId} projection dimensions changed.`,
			);
			const result = await imageRenderer.render({
				projection,
				radianceScale: scale,
				...(disk ? {directSolarDisk: disk} : {}),
				brunetonDisplayEncoding: encoding,
			});
			requireCondition(
				result.width === image.widthPixels && result.height === image.heightPixels,
				`CR4A ${imageId} render dimensions changed.`,
			);
			requireCondition(
				result.directionCount === rawField.directionCount &&
					result.pathRadianceValues.length === rawField.valueCount &&
					rawField.channelCount === NATIVE15_CHANNEL_COUNT &&
					rawField.scalarType === 'float32' &&
					rawField.byteOrder === 'little-endian',
				`CR4A ${id} raw-field shape changed.`,
			);
			const canvas = rgbaCanvas(result.brunetonDisplayRgba8, result.width, result.height);
			await uploadCanvas(image.path, canvas);
			state.imageUploadOrder.push(image.path);
			if (!state.firstImageWritten) {
				state.firstImageWritten = true;
				await window.colorResetProgress(FIRST_IMAGE_STAGE);
			}
			const rawBytes = float32LittleEndianBytes(result.pathRadianceValues);
			requireCondition(rawBytes.byteLength === rawField.byteLength, `CR4A ${id} raw byte count changed.`);
			await uploadBytes(rawField.path, rawBytes);
			state.rawFieldUploadOrder.push(rawField.path);
			return {canvas, result, summary: summarizeImage(result)};
		};

		const alignedDome = await renderRecord({
			id: `${sceneSpec.id === 'z87-bridge' ? 'z87' : 'actual-sunset'}-aligned-dome`,
			imageId: sceneSpec.id === 'z87-bridge' ? 'z87-absolute-dome' : 'actual-sunset-absolute-dome',
			projection: createFigure1EquidistantDomeProjection({orientation: figure1Orientation}),
			scale: 1,
			disk: null,
			encoding: 'current-uint8-clamped',
		});

		let geographicDome = null;
		let luminance = null;
		if (sceneSpec.id === 'actual-sunset') {
			geographicDome = await renderRecord({
				id: 'actual-sunset-geographic-dome',
				imageId: 'actual-sunset-geographic-dome',
				projection: createFigure1EquidistantDomeProjection({
					orientation: PAPER_Z_UP_IDENTITY_ORIENTATION,
				}),
				scale: 1,
				disk: null,
				encoding: 'current-uint8-clamped',
			});
			const diagnostic = luminanceDiagnostic(
				alignedDome.result.pixelLinearSrgbValues,
				createFigure1EquidistantDomeProjection({orientation: figure1Orientation}),
			);
			luminance = {
				canvas: rgbaCanvas(diagnostic.rgba, alignedDome.result.width, alignedDome.result.height),
				statistics: diagnostic.statistics,
			};
			const luminanceDeclaration = configuration.outputs.luminanceDiagnostic;
			requireCondition(
				luminanceDeclaration.widthPixels === alignedDome.result.width &&
					luminanceDeclaration.heightPixels === alignedDome.result.height,
				'CR4A luminance-diagnostic dimensions changed.',
			);
			await uploadCanvas(luminanceDeclaration.path, luminance.canvas);
			state.imageUploadOrder.push(luminanceDeclaration.path);
		}

		const swatch = await renderRecord({
			id: `${sceneSpec.id === 'z87-bridge' ? 'z87' : 'actual-sunset'}-aligned-swatch`,
			imageId: sceneSpec.id === 'z87-bridge' ? 'z87-normalized-swatch' : 'actual-sunset-normalized-swatch',
			projection: createFigure9PinholeProjection({orientation: figure9Orientation}),
			scale: normalizationFactor,
			disk: {
				directionToSourceLocal: sceneSpec.directionToSourceLocal,
				angularRadiusRadians: FIGURE9_SOLAR_RADIUS_RADIANS,
				blend: 'replace',
				minimumUpComponent: 0,
				transmittedRadianceValues: transmittedDiskRadianceValues,
			},
			encoding: 'figure9-floyd-steinberg',
		});

		const webglErrors = drainWebglErrors(runtime.context);
		return {
			sceneId: sceneSpec.id,
			solarZenithDegrees: runtime.sceneState.solarZenithDegrees,
			directionToSourceModel: [...runtime.sceneState.directionToSourceModel],
			cacheIdentity: sceneSpec.cacheIdentity,
			ground: runtime.groundMetadata,
			gpu: {
				api: runtime.context.getParameter(runtime.context.VERSION),
				renderer: runtime.context.getParameter(
					runtime.context.getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL ??
						runtime.context.RENDERER,
				),
				maximumTextureSize: runtime.context.getParameter(runtime.context.MAX_TEXTURE_SIZE),
			},
			measurement: {
				quadratureId: CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.id,
				quadratureSampleCount: CR2_RECEIVER_DIFFUSE_PRIMARY_QUADRATURE.sampleCount,
				spectralDiffuseHorizontalIrradiance: Array.from(irradiance.spectralIrradianceValues),
				integratedDiffuseHorizontalWattsPerSquareMeter: irradiance.integratedWattsPerSquareMeter,
				normalizationTargetWattsPerSquareMeter: normalizationTarget,
				normalizationFactor,
				directNormal: directLevel.directSpectralIrradiance.toJSON(),
				solarSolidAngleSteradians: solarSolidAngle,
			},
			images: {
				alignedDome: alignedDome.summary,
				geographicDome: geographicDome?.summary ?? null,
				swatch: swatch.summary,
				luminance: luminance?.statistics ?? null,
			},
			canvases: {
				alignedDome: alignedDome.canvas,
				geographicDome: geographicDome?.canvas ?? null,
				swatch: swatch.canvas,
				luminance: luminance?.canvas ?? null,
			},
			webglErrors,
			contextLost: runtime.context.isContextLost(),
		};
	});
}

async function paperEntries(configuration) {
	const swatches = [];
	const domes = [];
	try {
		for (const panel of configuration.figure9SunriseSwatches.panels) {
			swatches.push({
				kind: 'paper',
				label: `Paper — ${panel.modelLabel}`,
				note: 'Figure 9 sunrise; original model wavelengths; normalized to 36 W m⁻²',
				source: await loadPaperBitmap(panel.outputPath, 1024, 576),
				modelId: panel.modelId,
			});
		}
		for (const panel of configuration.figure1LowSunDomes.panels) {
			domes.push({
				kind: 'paper',
				label: `Paper — ${panel.modelLabel}`,
				note: 'Figure 1 Z=87; full-spectral paper panel; no measurement row',
				source: await loadPaperBitmap(panel.outputPath, 256, 256),
				modelId: panel.modelId,
			});
		}
	} catch (error) {
		for (const entry of [...swatches, ...domes]) entry.source.close();
		throw error;
	}
	return {swatches, domes};
}

/** Execute the current Native15 sunset paper-reference comparison. */
export async function runCr4aSunsetPaperVisualComparison() {
	const response = await fetch('/browser/configuration.json');
	requireCondition(response.ok, 'CR4A browser configuration is unavailable.');
	const configuration = await response.json();
	requireCondition(
		configuration.schemaId === 'algorithm32-color-reset-cr4a-sunset-paper-visual-comparison-input-v1',
		'CR4A browser configuration schema is invalid.',
	);
	const state = {firstImageWritten: false, imageUploadOrder: [], rawFieldUploadOrder: []};
	const sceneSpecs = configuration.scenes.filter((scene) => scene.renderInThisControl);
	requireCondition(
		sceneSpecs.map((scene) => scene.id).join(',') === 'z87-bridge,actual-sunset',
		'CR4A scene order changed.',
	);
	const scenes = [];
	for (const sceneSpec of sceneSpecs) scenes.push(await renderScene(configuration, sceneSpec, state));
	const z87 = scenes.find((scene) => scene.sceneId === 'z87-bridge');
	const actual = scenes.find((scene) => scene.sceneId === 'actual-sunset');
	requireCondition(z87 && actual, 'CR4A did not render both declared scenes.');
	const paper = await paperEntries(configuration);
	const swatchEntries = [
		...paper.swatches,
		{
			kind: 'ours',
			label: 'Algorithm32 — San Jose Z=87 bridge',
			note: 'Native15/Q30; paper pinhole, disk, 36 W m⁻² normalization, and dither',
			source: z87.canvases.swatch,
		},
		{
			kind: 'ours',
			label: 'Algorithm32 — actual San Jose sunset',
			note: 'Native15/Q30; normalized structure diagnostic, not absolute brightness',
			source: actual.canvases.swatch,
		},
	];
	const domeEntries = [
		...paper.domes,
		{
			kind: 'ours',
			label: 'Algorithm32 — San Jose Z=87 bridge',
			note: 'Native15/Q30; absolute unchanged Bruneton; aligned source azimuth',
			source: z87.canvases.alignedDome,
		},
		{
			kind: 'ours',
			label: 'Algorithm32 — actual San Jose sunset',
			note: 'Native15/Q30; absolute unchanged Bruneton; aligned source azimuth',
			source: actual.canvases.alignedDome,
		},
	];
	const swatchColumn = createColumn({
		title: 'Figure 9 sunrise swatches + current Algorithm32',
		subtitle: 'Equal-sky-irradiance presentation: qualitative hue and gradient structure only',
		entries: swatchEntries,
		minimumWidth: 1024,
	});
	requireCanvasDeclaration(
		swatchColumn,
		compositeImageDeclaration(configuration, 'paper-swatch-column'),
		configuration.outputs.paperSwatchColumn,
	);
	await uploadCanvas(configuration.outputs.paperSwatchColumn, swatchColumn);
	state.imageUploadOrder.push(configuration.outputs.paperSwatchColumn);
	const domeColumn = createColumn({
		title: 'Figure 1 Z=87 sky domes + current Algorithm32',
		subtitle: 'Unnormalized Bruneton presentation: angular structure and absolute display response',
		entries: domeEntries,
		minimumWidth: 512,
	});
	requireCanvasDeclaration(
		domeColumn,
		compositeImageDeclaration(configuration, 'paper-dome-column'),
		configuration.outputs.paperDomeColumn,
	);
	await uploadCanvas(configuration.outputs.paperDomeColumn, domeColumn);
	state.imageUploadOrder.push(configuration.outputs.paperDomeColumn);
	const paperBrunetonSwatch = paper.swatches.find((entry) => entry.modelId === 'bruneton').source;
	const paperBrunetonDome = paper.domes.find((entry) => entry.modelId === 'bruneton').source;
	const decisionPlate = createDecisionPlate({
		paperSwatch: paperBrunetonSwatch,
		paperDome: paperBrunetonDome,
		ours: {
			z87Swatch: z87.canvases.swatch,
			actualSwatch: actual.canvases.swatch,
			z87Dome: z87.canvases.alignedDome,
			actualDome: actual.canvases.alignedDome,
			luminance: actual.canvases.luminance,
		},
	});
	requireCanvasDeclaration(
		decisionPlate,
		compositeImageDeclaration(configuration, 'decision-plate'),
		configuration.outputs.decisionPlate,
	);
	await uploadCanvas(configuration.outputs.decisionPlate, decisionPlate);
	state.imageUploadOrder.push(configuration.outputs.decisionPlate);
	requireCondition(
		JSON.stringify(state.imageUploadOrder) === JSON.stringify(configuration.outputs.requestedImageUploadOrder),
		'CR4A requested image upload order or completeness changed.',
	);
	requireCondition(
		JSON.stringify(state.rawFieldUploadOrder) ===
			JSON.stringify(configuration.outputs.rawFields.map(({path}) => path)),
		'CR4A raw-field upload order or completeness changed.',
	);
	await window.colorResetProgress(DECISION_PLATE_STAGE);

	const measurements = {
		schemaId: 'algorithm32-color-reset-cr4a-native15-scene-measurements-v1',
		scenes: scenes.map((scene) => ({
			sceneId: scene.sceneId,
			solarZenithDegrees: scene.solarZenithDegrees,
			directionToSourceModel: scene.directionToSourceModel,
			cacheIdentity: scene.cacheIdentity,
			gpu: scene.gpu,
			ground: scene.ground,
			measurement: scene.measurement,
			images: scene.images,
			webglErrors: scene.webglErrors,
			contextLost: scene.contextLost,
		})),
	};
	await uploadJson(configuration.outputs.sceneMeasurements, measurements);
	const result = {
		schemaId: 'algorithm32-color-reset-cr4a-browser-result-v1',
		renderComplete: true,
		integrityGateEvaluated: false,
		appearanceAccepted: false,
		claim: 'complete qualitative-comparison image acquisition; gate evaluation remains runner-owned',
		firstImageWritten: state.firstImageWritten,
		requestedImageCount: configuration.outputs.requestedImageUploadOrder.length,
		uploadedImageCount: state.imageUploadOrder.length,
		imageUploadOrder: [...state.imageUploadOrder],
		rawFieldUploadOrder: [...state.rawFieldUploadOrder],
		sceneMeasurements: measurements,
		columns: {
			swatch: {width: swatchColumn.width, height: swatchColumn.height, rowCount: swatchEntries.length},
			dome: {width: domeColumn.width, height: domeColumn.height, rowCount: domeEntries.length},
			decisionPlate: {width: decisionPlate.width, height: decisionPlate.height},
		},
	};
	for (const scene of scenes) {
		for (const canvas of Object.values(scene.canvases)) canvas?.remove();
	}
	for (const entry of [...paper.swatches, ...paper.domes]) entry.source.close();
	swatchColumn.remove();
	domeColumn.remove();
	decisionPlate.remove();
	return result;
}
