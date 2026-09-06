import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';

import {Algorithm32Bindings} from '../controls/production-v1/src/algorithm32/implementation/react-three/Algorithm32Bindings.js';
import {ThreeCacheBackend} from '../controls/production-v1/src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import {createDistantSunSceneState} from '../controls/production-v1/src/flat32/DistantSunSceneState.js';
import {SphericalDistantMode} from '../controls/production-v1/src/flat32/SphericalDistantMode.js';
import {measureCr2ReceiverLight} from '../lighting/Cr2ReceiverLightMeasurement.js';

const PARENT_CONTACT_SHEET_WIDTH = 2560;
const PARENT_CONTACT_SHEET_HEIGHT = 3066;
const PARENT_CONTACT_SHEET_LABEL_HEIGHT = 38;
const PARENT_RUN_ID = '000005-six-scene-visual-baseline';
const PARENT_ARTIFACT_SET_SHA256 = '2f7b49dd239fcaf5399c65bfebc59195458edf0b82910cf9987e341b76a615fc';
const PARENT_CONTACT_SHEET_SHA256 = '990c10625d66528902a7503fe4bb485713916c3bf9e3458071aeb9bf9f31b1f1';
const RADIANCE_UNITS = 'W m^-2 sr^-1 nm^-1';
const PLOT_COLORS = Object.freeze({
	directNormal: '#ff5a5f',
	directHorizontal: '#ffb000',
	diffuseHorizontal: '#3ec1d3',
	totalHorizontal: '#7ce38b',
	background: '#7ce38b',
	horizon: '#ff9f43',
	zenith: '#55a7ff',
});

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function clamp(value, minimum, maximum) {
	return Math.min(maximum, Math.max(minimum, value));
}

function dataUrlBytes(dataUrl) {
	const match = /^data:image\/png;base64,(.+)$/u.exec(dataUrl);
	if (!match) throw new Error('CR2 figure did not produce a PNG data URL.');
	const binary = atob(match[1]);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
	return bytes;
}

async function uploadBytes(artifactPath, bytes, contentType) {
	const response = await fetch('/artifact/' + artifactPath, {
		method: 'POST',
		headers: {'content-type': contentType},
		body: bytes,
	});
	if (!response.ok) {
		throw new Error('CR2 artifact upload failed for ' + artifactPath + ': HTTP ' + response.status + '.');
	}
	return bytes.byteLength;
}

async function uploadPng(artifactPath, dataUrl) {
	return uploadBytes(artifactPath, dataUrlBytes(dataUrl), 'image/png');
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

function rawRadiancePath(configuration, sceneId) {
	const expected = 'data/receiver-diffuse-radiance-' + sceneId + '.f32le';
	requireCondition(
		configuration.outputs.rawDiffuseRadiances.includes(expected),
		'CR2 fixture does not declare raw diffuse radiance ' + expected + '.',
	);
	return expected;
}

function drainWebglErrors(context) {
	const errors = [];
	for (let error = context.getError(); error !== context.NO_ERROR; error = context.getError()) {
		errors.push(error);
	}
	return errors;
}

function sceneInputCapture(composer) {
	const capture = composer.passes.find(
		(pass) => pass.getDiagnostics?.().kind === 'algorithm32-scene-input-capture-pass',
	);
	if (!capture?._depthTarget || !capture?._hitTarget) {
		throw new Error('CR2 could not inspect the geometry scene-input targets.');
	}
	return capture;
}

function readGroundProbe(renderer, composer, width, height, sceneDepthMax) {
	const capture = sceneInputCapture(composer);
	const x = Math.floor(width / 2);
	const yFromBottom = Math.floor(height * 0.05);
	const depthRgba = new Uint8Array(4);
	const hitRgba = new Uint8Array(4);
	renderer.readRenderTargetPixels(capture._depthTarget, x, yFromBottom, 1, 1, depthRgba);
	renderer.readRenderTargetPixels(capture._hitTarget, x, yFromBottom, 1, 1, hitRgba);
	const packedDepth = depthRgba[0] * 65536 + depthRgba[1] * 256 + depthRgba[2];
	return {
		screenProbe: {x, yFromBottom},
		depthRgba: Array.from(depthRgba),
		hitRgba: Array.from(hitRgba),
		depthMeters: packedDepth / 16777214 * sceneDepthMax.value,
	};
}

function cacheRuntimeFacts(cache) {
	const contribution = cache?.createShaderContribution?.();
	const runtimeBindings = cache?.getRuntimeBindings?.();
	return {
		contributionId: contribution?.id ?? null,
		bindingCount: runtimeBindings?.bindings?.length ?? null,
		backendId: runtimeBindings?.backendId ?? null,
	};
}

async function renderAndMeasureScene(configuration, sceneSpec, rawReady) {
	const {camera: cameraSpec, observer, location} = configuration;
	const physical = configuration.physicalControls;
	const cacheStatus = sceneSpec.cacheStatus ?? sceneSpec.cacheExpectation?.status;
	requireCondition(cacheStatus === 'ready' || cacheStatus === 'dark', sceneSpec.id + ' has no accepted cache status.');
	requireCondition(
		physical.maximumScatteringOrder === 4 &&
			physical.pathIntervalCount === 30 &&
			physical.pathSampleDistribution === 'quadratic-near-observer-v1' &&
			physical.celestialSourcesEnabled === false &&
			physical.sceneObjects === false &&
			physical.sceneDepthMaxMeters === cameraSpec.farSceneUnits * physical.sceneScaleMetersPerSceneUnit,
		'CR2 physical controls differ from the fixed CR1 runtime.',
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
	if (!context) throw new Error('CR2 requires WebGL2.');
	requireCondition(context.getExtension('EXT_color_buffer_float'), 'CR2 requires EXT_color_buffer_float.');
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
	const sceneScale = {value: physical.sceneScaleMetersPerSceneUnit, units: 'meters-per-scene-unit'};
	const target = new THREE.WebGLRenderTarget(width, height, {
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		depthBuffer: true,
		stencilBuffer: false,
	});
	target.texture.colorSpace = THREE.NoColorSpace;
	const composer = new EffectComposer(renderer, target);
	composer.setPixelRatio(1);
	composer.setSize(width, height);
	composer.addPass(new RenderPass(scene, camera));
	requireCondition(
		composer.readBuffer.texture.type === THREE.FloatType &&
			composer.writeBuffer.texture.type === THREE.FloatType &&
			composer.readBuffer.texture.colorSpace === THREE.NoColorSpace &&
			composer.writeBuffer.texture.colorSpace === THREE.NoColorSpace,
		'CR2 composer buffers are not FloatType/NoColorSpace.',
	);
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
		sceneSpec.id + ' browser solar zenith differs from the runner selection.',
	);
	requireCondition(
		cacheStatus === 'dark' ? sceneSpec.sceneCacheAsset === undefined : sceneSpec.sceneCacheAsset !== undefined,
		sceneSpec.id + ' browser cache selection disagrees with its cache status.',
	);
	const mode = new SphericalDistantMode({
		sceneState,
		sceneScale,
		sourceAngularRadius: {value: physical.sourceAngularRadiusRadians, units: 'radians'},
		maximumScatteringOrder: physical.maximumScatteringOrder,
		celestialSourcesEnabled: false,
		colorDisplayModelConfiguration: {model: 'bruneton-control'},
		...(cacheStatus === 'ready' ? {sceneCacheAsset: sceneSpec.sceneCacheAsset} : {}),
		distantSunCacheState: cacheStatus,
	});
	const algorithm32 = mode.algorithm32;
	const groundEndpoints = mode.geometry.createThreeEndpointObjects({
		name: 'cr2-' + sceneSpec.id + '-spherical-ground',
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
		composer.renderToScreen = true;
		composer.render(0);
		const groundProbe = readGroundProbe(renderer, composer, width, height, sceneDepthMax);
		const cache = handle._buildResult?.scatteringCache;
		const cacheController = handle._buildResult?.scatteringCacheController;
		const cacheRuntime = cacheRuntimeFacts(cache);
		const initialColor = {
			configVersion: algorithm32.config.version,
			colorId: algorithm32.config.config.color.id,
			brightnessProxy: {...algorithm32.brightnessProxy},
		};
		const measurement = await measureCr2ReceiverLight({
			THREE,
			renderer,
			backend,
			algorithm32,
			handle,
			sceneId: sceneSpec.id,
			cacheIdentity:
				sceneSpec.cacheIdentity ??
				sceneSpec.sceneCacheAsset?.loadRequest?.cacheIdentity ??
				'algorithm32-distant-sun-shared-dark-v1',
			stability: configuration.measurement.stability,
		});
		const rawRecord = await rawReady(sceneSpec, measurement.rawPrimaryBytes, measurement.publicResult);
		const finalColor = {
			configVersion: algorithm32.config.version,
			colorId: algorithm32.config.config.color.id,
			brightnessProxy: {...algorithm32.brightnessProxy},
		};
		return {
			sceneId: sceneSpec.id,
			label: sceneSpec.label,
			timeIso: sceneSpec.timeIso,
			solarZenithDegrees: sceneState.solarZenithDegrees,
			directionToSourceModel: [...sceneState.directionToSourceModel],
			cacheStatus,
			cacheIdentity: measurement.publicResult.cacheIdentity,
			ground: groundEndpoints.metadata,
			groundProbe,
			camera: {
				positionScene: camera.position.toArray(),
				directionScene: camera.getWorldDirection(new THREE.Vector3()).toArray(),
				verticalFieldOfViewDegrees: camera.fov,
				aspect: camera.aspect,
				nearSceneUnits: camera.near,
				farSceneUnits: camera.far,
			},
			gpu: {
				api: context.getParameter(context.VERSION),
				renderer: context.getParameter(
					context.getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL ?? context.RENDERER,
				),
				maximumTextureSize: context.getParameter(context.MAX_TEXTURE_SIZE),
				extColorBufferFloat: true,
				composerBufferType: 'FloatType',
				composerColorSpace: 'NoColorSpace',
			},
			cacheRuntime,
			cachePublished: Boolean(cache && cacheController),
			runtimeDiagnostics: handle.getDiagnostics(),
			measurement: measurement.publicResult,
			rawRadiance: rawRecord,
			colorState: {
				before: initialColor,
				after: finalColor,
				unchanged: JSON.stringify(initialColor) === JSON.stringify(finalColor),
			},
			webglErrors: drainWebglErrors(context),
			contextLost: context.isContextLost(),
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

function formatNumber(value) {
	if (!Number.isFinite(value)) return 'nonfinite';
	if (value === 0) return '0';
	if (Math.abs(value) >= 1000 || Math.abs(value) < 0.01) return value.toExponential(3);
	return value.toFixed(3);
}

function logPlotDataUrl({width, height, title, subtitle, minimum, maximum, units, scenes, series}) {
	const margin = {left: 105, right: 45, top: 105, bottom: 180};
	const plotWidth = width - margin.left - margin.right;
	const plotHeight = height - margin.top - margin.bottom;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d');
	requireCondition(context, 'CR2 log plot requires a 2D canvas context.');
	context.fillStyle = '#101216';
	context.fillRect(0, 0, width, height);
	context.fillStyle = '#ffffff';
	context.font = 'bold 26px sans-serif';
	context.textAlign = 'left';
	context.fillText(title, margin.left, 40);
	context.fillStyle = '#bfc5cf';
	context.font = '15px sans-serif';
	context.fillText(subtitle, margin.left, 69);
	const xFor = (index) =>
		scenes.length === 1 ? margin.left + plotWidth / 2 : margin.left + index * plotWidth / (scenes.length - 1);
	const yFor = (value) => {
		const logValue = Number.isFinite(value) && value > 0 ? Math.log10(value) : minimum;
		return margin.top + (maximum - clamp(logValue, minimum, maximum)) / (maximum - minimum) * plotHeight;
	};
	context.strokeStyle = '#555b66';
	context.fillStyle = '#bfc5cf';
	context.lineWidth = 1;
	context.font = '13px sans-serif';
	context.textAlign = 'right';
	for (let exponent = Math.ceil(minimum); exponent <= Math.floor(maximum); exponent += 1) {
		const y = yFor(10 ** exponent);
		context.beginPath();
		context.moveTo(margin.left, y);
		context.lineTo(margin.left + plotWidth, y);
		context.stroke();
		context.fillText('10^' + exponent, margin.left - 10, y + 4);
	}
	context.save();
	context.translate(24, margin.top + plotHeight / 2);
	context.rotate(-Math.PI / 2);
	context.fillStyle = '#ffffff';
	context.textAlign = 'center';
	context.font = '14px sans-serif';
	context.fillText(units + ' (fixed log10 scale)', 0, 0);
	context.restore();
	for (const line of series) {
		context.strokeStyle = line.color;
		context.fillStyle = line.color;
		context.lineWidth = 2.5;
		context.beginPath();
		line.values.forEach((value, index) => {
			const x = xFor(index);
			const y = yFor(value);
			if (index === 0) context.moveTo(x, y);
			else context.lineTo(x, y);
		});
		context.stroke();
		line.values.forEach((value, index) => {
			const x = xFor(index);
			const y = yFor(value);
			if (value > 0) {
				context.beginPath();
				context.arc(x, y, 4, 0, Math.PI * 2);
				context.fill();
			} else {
				context.beginPath();
				context.moveTo(x - 5, y - 5);
				context.lineTo(x + 5, y + 5);
				context.moveTo(x + 5, y - 5);
				context.lineTo(x - 5, y + 5);
				context.stroke();
			}
		});
	}
	context.font = '13px sans-serif';
	context.fillStyle = '#ffffff';
	context.textAlign = 'right';
	scenes.forEach((scene, index) => {
		context.save();
		context.translate(xFor(index) + 4, margin.top + plotHeight + 18);
		context.rotate(-Math.PI / 4);
		context.fillText(scene.label, 0, 0);
		context.restore();
	});
	let legendX = margin.left;
	let legendY = height - 36;
	context.font = '14px sans-serif';
	context.textAlign = 'left';
	for (const line of series) {
		context.fillStyle = line.color;
		context.fillRect(legendX, legendY - 10, 22, 4);
		context.fillStyle = '#ffffff';
		context.fillText(line.label, legendX + 30, legendY);
		legendX += Math.max(230, context.measureText(line.label).width + 65);
		if (legendX > width - 260) {
			legendX = margin.left;
			legendY += 23;
		}
	}
	const dataUrl = canvas.toDataURL('image/png');
	canvas.remove();
	return {
		dataUrl,
		width,
		height,
		minimumLog10: minimum,
		maximumLog10: maximum,
		units,
		series: series.map(({id, label, values}) => ({id, label, values})),
	};
}

function illuminancePlot(configuration, scenes) {
	const spec = configuration.diagnostics.illuminancePlot;
	const value = (scene, term) => scene.measurement.photopic[term].illuminance.value;
	return logPlotDataUrl({
		width: spec.widthPixels,
		height: spec.heightPixels,
		title: 'CR2 receiver-light inventory',
		subtitle: 'Direct-normal retained separately; total-horizontal = direct-horizontal + diffuse-horizontal.',
		minimum: spec.minimumLog10Lux,
		maximum: spec.maximumLog10Lux,
		units: 'lux',
		scenes,
		series: [
			{id: 'direct-normal', label: 'Direct normal', color: PLOT_COLORS.directNormal, values: scenes.map((scene) => value(scene, 'directNormal'))},
			{id: 'direct-horizontal', label: 'Direct horizontal', color: PLOT_COLORS.directHorizontal, values: scenes.map((scene) => value(scene, 'directHorizontal'))},
			{id: 'diffuse-horizontal', label: 'Diffuse horizontal', color: PLOT_COLORS.diffuseHorizontal, values: scenes.map((scene) => value(scene, 'diffuseHorizontal'))},
			{id: 'total-horizontal', label: 'Total horizontal', color: PLOT_COLORS.totalHorizontal, values: scenes.map((scene) => value(scene, 'totalHorizontal'))},
		],
	});
}

function interpolateColor(left, right, fraction) {
	return left.map((value, index) => Math.round(value * (1 - fraction) + right[index] * fraction));
}

function spectralMagnitudeColor(value, minimum, maximum) {
	if (!(Number.isFinite(value) && value > 0)) return [0, 0, 0];
	const position = clamp((Math.log10(value) - minimum) / (maximum - minimum), 0, 1);
	const stops = [
		{position: 0, color: [0, 0, 24]},
		{position: 0.25, color: [18, 30, 130]},
		{position: 0.5, color: [0, 190, 210]},
		{position: 0.75, color: [245, 210, 35]},
		{position: 1, color: [255, 45, 20]},
	];
	for (let index = 1; index < stops.length; index += 1) {
		const left = stops[index - 1];
		const right = stops[index];
		if (position <= right.position) {
			return interpolateColor(
				left.color,
				right.color,
				(position - left.position) / (right.position - left.position),
			);
		}
	}
	return stops.at(-1).color;
}

function spectralStripsDataUrl(configuration, scenes) {
	const spec = configuration.diagnostics.spectralStrips;
	const width = spec.widthPixels;
	const height = spec.heightPixels;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d');
	requireCondition(context, 'CR2 spectral strips require a 2D canvas context.');
	context.fillStyle = '#101216';
	context.fillRect(0, 0, width, height);
	context.fillStyle = '#ffffff';
	context.font = 'bold 26px sans-serif';
	context.fillText('CR2 Native15 receiver spectra', 36, 40);
	context.fillStyle = '#bfc5cf';
	context.font = '15px sans-serif';
	context.fillText(
		'One fixed log10 W m^-2 nm^-1 scale; no scene or row normalization.',
		36,
		69,
	);
	const channels = scenes[0].measurement.spectralBasis.channels;
	const left = 310;
	const right = 40;
	const plotWidth = width - left - right;
	const cellWidth = plotWidth / channels.length;
	const top = 112;
	const bottom = 100;
	const groupHeight = (height - top - bottom) / scenes.length;
	const stripHeight = Math.min(27, (groupHeight - 39) / 3);
	const terms = [
		{id: 'directHorizontal', label: 'Direct horizontal'},
		{id: 'diffuseHorizontal', label: 'Diffuse horizontal'},
		{id: 'totalHorizontal', label: 'Total horizontal'},
	];
	context.textAlign = 'center';
	context.font = '11px sans-serif';
	context.fillStyle = '#dfe4ec';
	channels.forEach((channel, index) => {
		context.fillText(Math.round(channel.center.value) + ' nm', left + (index + 0.5) * cellWidth, top - 13);
	});
	for (const [sceneIndex, scene] of scenes.entries()) {
		const groupTop = top + sceneIndex * groupHeight;
		context.textAlign = 'left';
		context.fillStyle = '#ffffff';
		context.font = 'bold 14px sans-serif';
		context.fillText(scene.label, 18, groupTop + 18);
		context.fillStyle = '#87909e';
		context.font = '12px sans-serif';
		context.fillText('SZ ' + scene.solarZenithDegrees.toFixed(3) + ' deg', 18, groupTop + 38);
		for (const [termIndex, term] of terms.entries()) {
			const y = groupTop + 4 + termIndex * (stripHeight + 8);
			context.textAlign = 'right';
			context.fillStyle = '#dfe4ec';
			context.font = '12px sans-serif';
			context.fillText(term.label, left - 12, y + stripHeight * 0.72);
			const values = scene.measurement.packets[term.id].values;
			values.forEach((value, channelIndex) => {
				const rgb = spectralMagnitudeColor(
					value,
					spec.minimumLog10IrradianceDensity,
					spec.maximumLog10IrradianceDensity,
				);
				context.fillStyle = 'rgb(' + rgb.join(',') + ')';
				context.fillRect(
					left + channelIndex * cellWidth,
					y,
					Math.ceil(cellWidth) + 1,
					stripHeight,
				);
			});
		}
		context.strokeStyle = '#343943';
		context.beginPath();
		context.moveTo(18, groupTop + groupHeight - 5);
		context.lineTo(width - 18, groupTop + groupHeight - 5);
		context.stroke();
	}
	const legendX = left;
	const legendY = height - 54;
	const legendWidth = plotWidth;
	for (let x = 0; x < Math.ceil(legendWidth); x += 1) {
		const logValue = spec.minimumLog10IrradianceDensity +
			x / Math.max(1, legendWidth - 1) *
			(spec.maximumLog10IrradianceDensity - spec.minimumLog10IrradianceDensity);
		const rgb = spectralMagnitudeColor(10 ** logValue, spec.minimumLog10IrradianceDensity, spec.maximumLog10IrradianceDensity);
		context.fillStyle = 'rgb(' + rgb.join(',') + ')';
		context.fillRect(legendX + x, legendY, 1, 16);
	}
	context.fillStyle = '#ffffff';
	context.font = '12px sans-serif';
	context.textAlign = 'left';
	context.fillText('10^' + spec.minimumLog10IrradianceDensity, legendX, legendY + 34);
	context.textAlign = 'right';
	context.fillText('10^' + spec.maximumLog10IrradianceDensity, legendX + legendWidth, legendY + 34);
	const dataUrl = canvas.toDataURL('image/png');
	canvas.remove();
	return {
		dataUrl,
		width,
		height,
		minimumLog10IrradianceDensity: spec.minimumLog10IrradianceDensity,
		maximumLog10IrradianceDensity: spec.maximumLog10IrradianceDensity,
		channelCentersNanometers: channels.map((channel) => channel.center.value),
		rowSceneOrder: scenes.map((scene) => scene.sceneId),
		termOrder: terms.map((term) => term.id),
	};
}

function percentileValue(entries, requestedPercentile) {
	return entries?.find((entry) => entry.percentile === requestedPercentile)?.value ?? null;
}

function probeValue(scene, id) {
	return scene.field?.probes?.find((probe) => probe.id === id)?.luminance ?? null;
}

function fieldContextPlot(configuration, scenes, parentFields) {
	const spec = configuration.diagnostics.fieldContextPlot;
	const parentById = new Map(parentFields.map((scene) => [scene.sceneId, scene]));
	const ordered = scenes.map((scene) => {
		const parent = parentById.get(scene.sceneId);
		requireCondition(parent, 'CR2 parent field context is missing ' + scene.sceneId + '.');
		return parent;
	});
	return logPlotDataUrl({
		width: spec.widthPixels,
		height: spec.heightPixels,
		title: 'CR2 inherited CR1 sky-field context',
		subtitle: 'Exact CR1 raw-field diagnostics; no values are inferred from display pixels.',
		minimum: spec.minimumLog10CdPerSquareMeter,
		maximum: spec.maximumLog10CdPerSquareMeter,
		units: 'cd m^-2',
		scenes,
		series: [
			{id: 'background-p50', label: 'Full-sky background p50', color: PLOT_COLORS.background, values: ordered.map((scene) => scene.backgroundMedianLuminance)},
			{id: 'horizon-p50', label: 'Horizon-band p50', color: PLOT_COLORS.horizon, values: ordered.map((scene) => scene.horizonMedianLuminance)},
			{id: 'zenith', label: 'True-zenith probe', color: PLOT_COLORS.zenith, values: ordered.map((scene) => scene.zenithLuminance)},
		],
	});
}

function loadImage(source) {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error('CR2 could not decode image ' + source + '.'));
		image.src = source;
	});
}

function comparePixels(left, right) {
	requireCondition(left.length === right.length, 'CR2 parent pixel populations differ.');
	let differingByteCount = 0;
	let differingPixelCount = 0;
	let maximumAbsoluteDifference = 0;
	let lastDifferingPixel = -1;
	for (let index = 0; index < left.length; index += 1) {
		const difference = Math.abs(left[index] - right[index]);
		if (difference !== 0) {
			differingByteCount += 1;
			const pixelIndex = Math.floor(index / 4);
			if (pixelIndex !== lastDifferingPixel) {
				differingPixelCount += 1;
				lastDifferingPixel = pixelIndex;
			}
		}
		maximumAbsoluteDifference = Math.max(maximumAbsoluteDifference, difference);
	}
	return {
		exactRgba: differingByteCount === 0,
		byteCount: left.length,
		differingByteCount,
		differingPixelCount,
		maximumAbsoluteDifference,
	};
}

async function annotatedContactSheetDataUrl(configuration, scenes, parentFields) {
	const parent = configuration.parentControl;
	const parentPath = parent.contactSheetPath ?? parent.contactSheet?.path;
	const parentUrl = parent.contactSheetUrl ?? '/parent/' + parentPath;
	const parentSha256 = parent.contactSheetSha256 ?? parent.contactSheet?.sha256;
	requireCondition(parentPath, 'CR2 parent contact-sheet path is missing.');
	requireCondition(
		parentSha256 === PARENT_CONTACT_SHEET_SHA256,
		'CR2 parent contact-sheet identity changed.',
	);
	const image = await loadImage(parentUrl);
	requireCondition(
		image.naturalWidth === PARENT_CONTACT_SHEET_WIDTH &&
			image.naturalHeight === PARENT_CONTACT_SHEET_HEIGHT &&
			(parent.contactSheetWidth === undefined || parent.contactSheetWidth === image.naturalWidth) &&
			(parent.contactSheetHeight === undefined || parent.contactSheetHeight === image.naturalHeight),
		'CR2 parent contact-sheet dimensions changed.',
	);
	const sourceCanvas = document.createElement('canvas');
	sourceCanvas.width = image.naturalWidth;
	sourceCanvas.height = image.naturalHeight;
	const sourceContext = sourceCanvas.getContext('2d', {willReadFrequently: true});
	requireCondition(sourceContext, 'CR2 parent replay requires a source 2D context.');
	sourceContext.drawImage(image, 0, 0);
	const sourcePixels = sourceContext.getImageData(0, 0, image.naturalWidth, image.naturalHeight).data;
	const annotationWidth = configuration.diagnostics.annotatedContactSheet.annotationWidthPixels;
	const canvas = document.createElement('canvas');
	canvas.width = image.naturalWidth + annotationWidth;
	canvas.height = image.naturalHeight;
	const context = canvas.getContext('2d', {willReadFrequently: true});
	requireCondition(context, 'CR2 annotated contact sheet requires a 2D canvas context.');
	context.fillStyle = '#101216';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.drawImage(image, 0, 0);
	const parentById = new Map(parentFields.map((scene) => [scene.sceneId, scene]));
	const labelHeight = parent.contactSheetLabelHeight ?? PARENT_CONTACT_SHEET_LABEL_HEIGHT;
	requireCondition(labelHeight === PARENT_CONTACT_SHEET_LABEL_HEIGHT, 'CR2 parent label height changed.');
	const rowHeight = configuration.camera.heightPixels + labelHeight;
	for (const [index, scene] of scenes.entries()) {
		const x = image.naturalWidth;
		const y = index * rowHeight;
		const parent = parentById.get(scene.sceneId);
		const measurement = scene.measurement;
		context.fillStyle = index % 2 === 0 ? '#15191f' : '#11151a';
		context.fillRect(x, y, annotationWidth, rowHeight);
		context.fillStyle = '#343943';
		context.fillRect(x, y, 1, rowHeight);
		context.fillRect(x, y, annotationWidth, 1);
		context.fillRect(x, y + rowHeight - 1, annotationWidth, 1);
		context.fillRect(x + annotationWidth - 1, y, 1, rowHeight);
		context.fillStyle = '#ffffff';
		context.textAlign = 'left';
		context.font = 'bold 22px sans-serif';
		context.fillText(scene.label, x + 28, y + 42);
		context.fillStyle = '#aeb7c4';
		context.font = '14px sans-serif';
		context.fillText(
			'Solar zenith ' + scene.solarZenithDegrees.toFixed(6) + ' deg | cache ' + scene.cacheStatus,
			x + 28,
			y + 70,
		);
		const rows = [
			['Direct normal', measurement.photopic.directNormal.illuminance.value, 'lux'],
			['Direct horizontal', measurement.photopic.directHorizontal.illuminance.value, 'lux'],
			['Diffuse horizontal', measurement.photopic.diffuseHorizontal.illuminance.value, 'lux'],
			['Total horizontal', measurement.photopic.totalHorizontal.illuminance.value, 'lux'],
			['CR1 sky background p50', parent?.backgroundMedianLuminance, 'cd m^-2'],
			['CR1 horizon p50', parent?.horizonMedianLuminance, 'cd m^-2'],
			['CR1 zenith', parent?.zenithLuminance, 'cd m^-2'],
		];
		context.font = '16px monospace';
		for (const [rowIndex, [label, value, units]] of rows.entries()) {
			const rowY = y + 112 + rowIndex * 32;
			context.fillStyle = '#cbd2dc';
			context.fillText(label, x + 28, rowY);
			context.fillStyle = '#ffffff';
			context.fillText(formatNumber(value) + ' ' + units, x + 360, rowY);
		}
		context.fillStyle = '#87909e';
		context.font = '14px monospace';
		context.fillText(
			'Repeat max rel: ' + formatNumber(measurement.stability.integratedPrimaryRepeat.maximumRelativeDifference),
			x + 28,
			y + 354,
		);
		context.fillText(
			'Rotation photopic rel: ' + formatNumber(measurement.stability.rotation.photopic.symmetricRelativeDifference),
			x + 28,
			y + 380,
		);
		context.fillText(
			'Color unchanged: ' + String(scene.colorState.unchanged && measurement.colorState.unchanged),
			x + 28,
			y + 406,
		);
	}
	const copiedPixels = context.getImageData(
		0,
		0,
		image.naturalWidth,
		image.naturalHeight,
	).data;
	const parentPixelReplay = comparePixels(sourcePixels, copiedPixels);
	const dataUrl = canvas.toDataURL('image/png');
	const result = {
		dataUrl,
		width: canvas.width,
		height: canvas.height,
		parentArtifactPath: parentPath,
		parentSha256,
		parentWidth: image.naturalWidth,
		parentHeight: image.naturalHeight,
		annotationWidth,
		rowHeight,
		rowSceneOrder: scenes.map((scene) => scene.sceneId),
		parentPixelReplay,
		leftRectangleExact: parentPixelReplay.exactRgba,
		leftRectangleDifferingByteCount: parentPixelReplay.differingByteCount,
		leftRectangleDifferingPixelCount: parentPixelReplay.differingPixelCount,
		leftRectangleMaximumAbsoluteDifference: parentPixelReplay.maximumAbsoluteDifference,
	};
	canvas.remove();
	sourceCanvas.remove();
	return result;
}

function parentFieldFromAnalysisScene(scene) {
	return {
		sceneId: scene.sceneId,
		label: scene.label,
		solarZenithDegrees: scene.solarZenithDegrees,
		cacheStatus: scene.cacheStatus,
		cacheIdentity: scene.cacheIdentity,
		currentDirectSourceProxy: scene.frames?.['production-lift']?.brightnessProxy,
		backgroundMedianLuminance: percentileValue(scene.field?.percentiles, 50),
		horizonMedianLuminance: percentileValue(scene.field?.regions?.horizonBand?.percentiles, 50),
		upperSkyMedianLuminance: percentileValue(scene.field?.regions?.upperSky?.percentiles, 50),
		zenithLuminance: probeValue(scene, 'zenith'),
	};
}

function validateParentFields(configuration, fields) {
	requireCondition(
		Array.isArray(fields) && fields.length === configuration.scenes.length,
		'CR2 parent field count changed.',
	);
	return fields.map((field, index) => {
		const scene = configuration.scenes[index];
		requireCondition(field.sceneId === scene.id, 'CR2 parent field scene order changed.');
		requireCondition(
			[
				field.solarZenithDegrees,
				field.backgroundMedianLuminance,
				field.horizonMedianLuminance,
				field.upperSkyMedianLuminance,
				field.zenithLuminance,
			].every(Number.isFinite),
			'CR2 parent field values are incomplete for ' + scene.id + '.',
		);
		return {
			...field,
			sourceRunId: PARENT_RUN_ID,
			sourceArtifactSetSha256: PARENT_ARTIFACT_SET_SHA256,
			sourceArtifactPath:
				configuration.parentControl.renderAnalysis?.path ?? 'evidence/render-analysis.json',
			sourceQuantity: 'CR1 pre-display raw sky-field luminance diagnostics',
			units: 'cd m^-2',
		};
	});
}

async function readParentFields(configuration) {
	if (Array.isArray(configuration.parentControl.fields)) {
		return validateParentFields(configuration, configuration.parentControl.fields);
	}
	const path = configuration.parentControl.renderAnalysis?.path;
	requireCondition(path, 'CR2 parent field diagnostics are missing.');
	const response = await fetch('/parent/' + path);
	if (!response.ok) throw new Error('CR2 parent render-analysis fetch failed: HTTP ' + response.status + '.');
	const value = await response.json();
	requireCondition(
		value.schemaId === 'algorithm32-color-reset-cr1-browser-result-v1' &&
			Array.isArray(value.scenes),
		'CR2 parent render-analysis schema changed.',
	);
	return validateParentFields(configuration, value.scenes.map(parentFieldFromAnalysisScene));
}

function validateConfiguration(configuration) {
	requireCondition(
		configuration.schemaId === 'algorithm32-color-reset-cr2-browser-config-v1',
		'CR2 browser configuration schema changed.',
	);
	requireCondition(configuration.scenes?.length === 7, 'CR2 requires six primary scenes plus one dark control.');
	requireCondition(configuration.outputs?.images?.length === 4, 'CR2 requires exactly four PNG figures.');
	requireCondition(
		JSON.stringify(configuration.outputs.images) === JSON.stringify([
			configuration.outputs.directDiffusePlot,
			configuration.outputs.spectralStrips,
			configuration.outputs.fieldContextPlot,
			configuration.outputs.annotatedContactSheet,
		]),
		'CR2 PNG declaration order changed.',
	);
	requireCondition(
		configuration.outputs.rawDiffuseRadiances?.length === 7,
		'CR2 requires seven raw primary-radiance fields.',
	);
	requireCondition(
		configuration.measurement?.spectralChannelCount === 15 &&
			configuration.measurement.spectralQuantity === 'spectral-irradiance-density' &&
			configuration.measurement.spectralUnits === 'W m^-2 nm^-1' &&
			configuration.measurement.repeatCount === 2,
		'CR2 measurement contract changed.',
	);
	requireCondition(
		(configuration.parentControl.runId === undefined || configuration.parentControl.runId === PARENT_RUN_ID) &&
			(configuration.parentControl.artifactSetSha256 === undefined ||
				configuration.parentControl.artifactSetSha256 === PARENT_ARTIFACT_SET_SHA256),
		'CR2 parent-control identity changed.',
	);
	const allArtifacts = configuration.outputs.rawDiffuseRadiances.concat(configuration.outputs.images);
	requireCondition(new Set(allArtifacts).size === 11, 'CR2 browser artifact declarations contain duplicates.');
}

/** Measure and visualize the complete seven-condition CR2 receiver-light inventory. */
export async function runCr2AvailableLightInventoryBrowser() {
	const configuration = await fetch('/browser/config.json').then((response) => response.json());
	validateConfiguration(configuration);
	const parentFields = await readParentFields(configuration);
	await window.colorResetProgress('measurement-started');
	const rawDiffuseRadiances = [];
	const scenes = [];
	const rawReady = async (scene, bytes, measurement) => {
		const artifactPath = rawRadiancePath(configuration, scene.id);
		const byteLength = await uploadBytes(artifactPath, bytes, 'application/octet-stream');
		const record = {
			sceneId: scene.id,
			artifactPath,
			byteLength,
			layout: 'direction-major little-endian float32; 4096 primary quadrature directions x 15 Native15 radiance channels',
			storage: 'little-endian float32, direction-major then Native15 channel',
			quantity: 'spectral-radiance-density',
			units: RADIANCE_UNITS,
			semantics: configuration.measurement.spectralSemantics,
			quadratureId: measurement.quadrature.primary.id,
			directionCount: measurement.quadrature.primary.sampleCount,
			channelCount: measurement.spectralBasis.channelCount,
			basisContentHash: measurement.spectralBasis.contentHash,
			cacheIdentity: measurement.cacheIdentity,
			derivation:
				'unchanged common Q30 path radiance at each primary 64x64 receiver quadrature direction, packed direction-major then Native15 channel as f32le',
		};
		rawDiffuseRadiances.push(record);
		await window.colorResetProgress('raw-' + scene.id);
		return record;
	};
	for (const sceneSpec of configuration.scenes) {
		scenes.push(await renderAndMeasureScene(configuration, sceneSpec, rawReady));
	}
	requireCondition(rawDiffuseRadiances.length === 7, 'CR2 did not upload all seven raw radiance fields.');
	const parentFieldById = new Map(parentFields.map((field) => [field.sceneId, field]));
	for (const scene of scenes) {
		const parentField = parentFieldById.get(scene.sceneId);
		requireCondition(parentField, 'CR2 parent field is missing ' + scene.sceneId + '.');
		scene.parentField = parentField;
	}

	const directDiffuse = illuminancePlot(configuration, scenes);
	const spectralStrips = spectralStripsDataUrl(configuration, scenes);
	const fieldContext = fieldContextPlot(configuration, scenes, parentFields);
	const annotatedContactSheet = await annotatedContactSheetDataUrl(
		configuration,
		scenes,
		parentFields,
	);
	const figureDefinitions = new Map([
		[configuration.outputs.directDiffusePlot, {
			kind: 'direct-diffuse-illuminance',
			figure: directDiffuse,
			derivation:
				'plot the seven CR2 photopic direct-normal, direct-horizontal, diffuse-horizontal, and total-horizontal illuminances on the fixture-fixed log10 lux scale',
		}],
		[configuration.outputs.spectralStrips, {
			kind: 'native15-spectral-strips',
			figure: spectralStrips,
			derivation:
				'visualize the seven CR2 direct-horizontal, diffuse-horizontal, and total-horizontal Native15 spectra on one fixture-fixed log10 irradiance-density scale without row or scene normalization',
		}],
		[configuration.outputs.fieldContextPlot, {
			kind: 'cr1-field-context',
			figure: fieldContext,
			derivation:
				'plot immutable CR1 raw-field full-sky background p50, horizon-band p50, and true-zenith luminance on the fixture-fixed log10 luminance scale',
		}],
		[configuration.outputs.annotatedContactSheet, {
			kind: 'annotated-cr1-baseline',
			figure: annotatedContactSheet,
			derivation:
				'copy the immutable CR1 contact-sheet decoded RGBA exactly into the left 2560x3066 rectangle and append CR2 receiver-light and CR1 field annotations in the fixture-sized right column',
		}],
	]);
	const images = [];
	for (const artifactPath of configuration.outputs.images) {
		const definition = figureDefinitions.get(artifactPath);
		requireCondition(definition, 'CR2 has no figure builder for ' + artifactPath + '.');
		const byteLength = await uploadPng(artifactPath, definition.figure.dataUrl);
		images.push({
			artifactPath,
			kind: definition.kind,
			byteLength,
			width: definition.figure.width,
			height: definition.figure.height,
			derivation: definition.derivation,
		});
		await window.colorResetProgress(
			artifactPath === configuration.outputs.annotatedContactSheet
				? 'decision-plate-complete'
				: 'image-' + definition.kind,
		);
	}
	return {
		schemaId: 'algorithm32-color-reset-cr2-browser-result-v1',
		software: {
			browserUserAgent: navigator.userAgent,
			threeRevision: THREE.REVISION,
		},
		parentControl: {
			runId: PARENT_RUN_ID,
			artifactSetSha256: PARENT_ARTIFACT_SET_SHA256,
			contactSheet: {
				path: annotatedContactSheet.parentArtifactPath,
				sha256: annotatedContactSheet.parentSha256,
			},
			renderAnalysis: configuration.parentControl.renderAnalysis ?? null,
			fieldDiagnostics: configuration.parentControl.fieldDiagnostics ?? null,
			parentSceneOrder: parentFields.map((scene) => scene.sceneId),
		},
		parentContactSheet: {
			sourceRunId: PARENT_RUN_ID,
			sourceArtifactSetSha256: PARENT_ARTIFACT_SET_SHA256,
			sourceArtifactPath: annotatedContactSheet.parentArtifactPath,
			sourceSha256: annotatedContactSheet.parentSha256,
			sourceWidth: annotatedContactSheet.parentWidth,
			sourceHeight: annotatedContactSheet.parentHeight,
			annotationWidth: annotatedContactSheet.annotationWidth,
			outputWidth: annotatedContactSheet.width,
			outputHeight: annotatedContactSheet.height,
			leftRectangleExact: annotatedContactSheet.leftRectangleExact,
			leftRectangleDifferingByteCount:
				annotatedContactSheet.leftRectangleDifferingByteCount,
			leftRectangleDifferingPixelCount:
				annotatedContactSheet.leftRectangleDifferingPixelCount,
			leftRectangleMaximumAbsoluteDifference:
				annotatedContactSheet.leftRectangleMaximumAbsoluteDifference,
			operation:
				'losslessly copy decoded CR1 contact-sheet RGBA to the unchanged left rectangle and append annotations only to a new right column',
		},
		rawDiffuseRadiances,
		images,
		dimensions: {
			measurementViewport: {
				width: configuration.camera.widthPixels,
				height: configuration.camera.heightPixels,
			},
			images: images.map(({artifactPath, width, height}) => ({artifactPath, width, height})),
		},
		figures: {
			directDiffuse: {...directDiffuse, dataUrl: undefined},
			spectralStrips: {...spectralStrips, dataUrl: undefined},
			fieldContext: {...fieldContext, dataUrl: undefined},
			annotatedContactSheet: {...annotatedContactSheet, dataUrl: undefined},
		},
		scenes,
		errors: scenes.flatMap((scene) => scene.webglErrors.map((code) => ({
			sceneId: scene.sceneId,
			kind: 'webgl-error',
			code,
		}))),
	};
}
