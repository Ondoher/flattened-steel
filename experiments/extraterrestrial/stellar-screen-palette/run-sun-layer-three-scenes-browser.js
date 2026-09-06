import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';

import {Algorithm32} from '../candidate/src/algorithm32/Algorithm32.js';
import {CanonicalAtmosphere} from '../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS, FIGURE1_DISPLAY_CONSTANTS} from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import {SphericalEarthGeometry} from '../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
import {DistantSunLightSource} from '../candidate/src/algorithm32/light-sources/DistantSunLightSource.js';
import {NATIVE_15_SPECTRAL_BASIS, NATIVE_SOURCE_IRRADIANCE_DENSITY} from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import {ThreeCacheBackend} from '../candidate/src/algorithm32/three/ThreeCacheBackend.js';
import {FerwerdaFullSceneColorDisplayModel} from '../stellar-visual-adaptation/FerwerdaFullSceneColorDisplayModel.js';
import {
	SCREEN_PALETTE_MATRIX_VALUE_KEY,
	SCREEN_PALETTE_VALUES_VALUE_KEY,
	ScreenPaletteCelestialRuntimeParticipant,
} from './ScreenPaletteCelestialRuntimeParticipant.js';

const NATIVE_SUN_ANGULAR_RADIUS_RADIANS = 0.004675;
const DISTANT_REVIEW_BOXES = Object.freeze([
	Object.freeze({name: 'spherical-review-distant-cyan-box', colorHex: 2796220, eastMeters: 18000, northMeters: -60000, sizeMeters: [6000, 5000, 6000]}),
	Object.freeze({name: 'spherical-review-denali-250km-orange-box', colorHex: 14638880, eastMeters: 100000, northMeters: -250000, sizeMeters: [50000, 6200, 100000]}),
]);

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function directionFromUpEastNorth(direction) {
	const [up, east, north] = direction;
	return new THREE.Vector3(east, north, up).normalize();
}

function configureCamera(camera, sceneSpec, observerHeightMeters) {
	camera.up.set(0, 1, 0);
	camera.position.set(0, observerHeightMeters, 0);
	const azimuth = sceneSpec.viewAzimuthDegrees * Math.PI / 180;
	const elevation = sceneSpec.viewElevationDegrees * Math.PI / 180;
	camera.lookAt(
		1000 * Math.sin(azimuth) * Math.cos(elevation),
		observerHeightMeters + 1000 * Math.sin(elevation),
		-1000 * Math.cos(azimuth) * Math.cos(elevation),
	);
	camera.updateMatrixWorld(true);
}

function createReviewBoxes(bottomRadiusMeters) {
	return DISTANT_REVIEW_BOXES.map((specification) => {
		const horizontalDistanceMeters = Math.hypot(specification.eastMeters, specification.northMeters);
		const groundOffsetMeters = Math.sqrt(bottomRadiusMeters ** 2 - horizontalDistanceMeters ** 2) - bottomRadiusMeters;
		const box = new THREE.Mesh(
			new THREE.BoxGeometry(...specification.sizeMeters),
			new THREE.MeshLambertMaterial({color: specification.colorHex}),
		);
		box.name = specification.name;
		box.position.set(specification.eastMeters, groundOffsetMeters + specification.sizeMeters[1] / 2, specification.northMeters);
		return box;
	});
}

function summarize(values) {
	const sums = [0, 0, 0];
	let nonBlack = 0;
	let maximumChannel = 0;
	let exactWhitePixelCount = 0;
	for (let index = 0; index < values.length; index += 4) {
		for (let channel = 0; channel < 3; channel += 1) {
			sums[channel] += values[index + channel];
			maximumChannel = Math.max(maximumChannel, values[index + channel]);
		}
		if (values[index] || values[index + 1] || values[index + 2]) nonBlack += 1;
		if (values[index] === 255 && values[index + 1] === 255 && values[index + 2] === 255) exactWhitePixelCount += 1;
	}
	return {nonBlack, maximumChannel, exactWhitePixelCount, meanRgb: sums.map((sum) => sum / (values.length / 4))};
}

async function loadProduct(descriptor) {
	const [matrixBytes, paletteBytes] = await Promise.all([
		fetch(descriptor.matrixUrl).then((response) => response.arrayBuffer()),
		fetch(descriptor.paletteUrl).then((response) => response.arrayBuffer()),
	]);
	const pixelIndex = new Uint16Array(matrixBytes);
	const palette = new Float32Array(paletteBytes);
	requireCondition(pixelIndex.length === descriptor.viewport.width * descriptor.viewport.height, `${descriptor.id} matrix shape changed.`);
	requireCondition(palette.length === descriptor.paletteEntryCount * 15, `${descriptor.id} palette shape changed.`);
	return {...descriptor, pixelIndex, palette};
}

function createProductTextures(product) {
	const matrix = new THREE.DataTexture(product.pixelIndex, product.viewport.width, product.viewport.height);
	matrix.format = THREE.RedIntegerFormat;
	matrix.type = THREE.UnsignedShortType;
	matrix.internalFormat = 'R16UI';
	matrix.minFilter = THREE.NearestFilter;
	matrix.magFilter = THREE.NearestFilter;
	matrix.wrapS = THREE.ClampToEdgeWrapping;
	matrix.wrapT = THREE.ClampToEdgeWrapping;
	matrix.generateMipmaps = false;
	matrix.unpackAlignment = 1;
	matrix.needsUpdate = true;
	const palette = new THREE.DataTexture(product.palette, 15, product.paletteEntryCount);
	palette.format = THREE.RedFormat;
	palette.type = THREE.FloatType;
	palette.internalFormat = 'R32F';
	palette.minFilter = THREE.NearestFilter;
	palette.magFilter = THREE.NearestFilter;
	palette.wrapS = THREE.ClampToEdgeWrapping;
	palette.wrapT = THREE.ClampToEdgeWrapping;
	palette.generateMipmaps = false;
	palette.unpackAlignment = 1;
	palette.needsUpdate = true;
	return {matrix, palette};
}

async function renderScene({fixture, geometryConfiguration, sceneSpec, product}) {
	const width = fixture.camera.widthPixels;
	const height = fixture.camera.heightPixels;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('webgl2', {antialias: false, preserveDrawingBuffer: true});
	requireCondition(context, 'WebGL2 is unavailable.');
	const renderer = new THREE.WebGLRenderer({canvas, context, antialias: false});
	renderer.setSize(width, height, false);
	const composer = new EffectComposer(renderer);
	composer.setSize(width, height);
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);
	const camera = new THREE.PerspectiveCamera(fixture.camera.verticalFovDegrees, width / height, 0.1, 400000);
	configureCamera(camera, sceneSpec, fixture.camera.observerHeightMeters);
	const directionToSun = directionFromUpEastNorth(sceneSpec.directionToSourceUpEastNorth);
	const geometry = new SphericalEarthGeometry({
		...geometryConfiguration,
		observerHeight: {value: fixture.camera.observerHeightMeters, units: 'meters'},
		observerUpDirection: [0, 0, 1],
		sceneFrame: {kind: 'observer-local'},
		directionToSource: directionToSun.toArray(),
		cacheAltitudeBinCount: 48,
	});
	const endpoints = geometry.createThreeEndpointObjects({
		name: `${sceneSpec.id}-ground`,
		sceneScale: {value: 1, units: 'meters-per-scene-unit'},
		widthSegments: 192,
		heightSegments: 96,
		visualMaterialLighting: 'lambert',
		groundVisualMesh: {kind: 'local-spherical-patch'},
	});
	const [ground] = endpoints.visualObjects;
	const reviewBoxes = createReviewBoxes(geometryConfiguration.bottomRadius.value);
	scene.add(...endpoints.visualObjects, ...reviewBoxes);
	composer.addPass(new RenderPass(scene, camera));
	const backend = new ThreeCacheBackend({THREE, renderer});
	const atmosphere = new CanonicalAtmosphere({constants: CANONICAL_ATMOSPHERE_CONSTANTS, spectralBasis: NATIVE_15_SPECTRAL_BASIS});
	const lightSource = new DistantSunLightSource({
		directionToLight: directionToSun.toArray(),
		sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
		angularRadius: {value: NATIVE_SUN_ANGULAR_RADIUS_RADIANS, units: 'radians'},
	});
	const celestial = new ScreenPaletteCelestialRuntimeParticipant({identity: product.identity});
	const color = new FerwerdaFullSceneColorDisplayModel({
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		displayConstants: FIGURE1_DISPLAY_CONSTANTS,
		ferwerda: sceneSpec.ferwerda,
	});
	const algorithm = new Algorithm32({geometry, atmosphere, lightSource, celestial, color, spectral: NATIVE_15_SPECTRAL_BASIS, execution: {maximumScatteringOrder: 4}});
	const textures = createProductTextures(product);
	let handle;
	try {
		handle = await algorithm.setupShader({
			THREE,
			composer,
			scene,
			camera,
			viewportSize: {width, height, units: 'pixels'},
			cacheBackend: backend,
			sceneScale: {value: 1, units: 'meters-per-scene-unit'},
			sceneDepthMax: {value: 300000, units: 'meters'},
			bindingValues: {
				'geometry.inverseProjectionMatrix': camera.projectionMatrixInverse.clone(),
				'geometry.inverseViewMatrix': camera.matrixWorld.clone(),
				'geometry.cameraWorldPosition': new THREE.Vector3(0, 0, 6360000 + fixture.camera.observerHeightMeters),
				'geometry.cameraGroundRelativePosition': new THREE.Vector3(0, 0, fixture.camera.observerHeightMeters),
				'light.directionToAtmosphericSource': directionToSun,
				[SCREEN_PALETTE_MATRIX_VALUE_KEY]: textures.matrix,
				[SCREEN_PALETTE_VALUES_VALUE_KEY]: textures.palette,
			},
		});
		await handle.prepare(renderer);
		composer.render();
		const webglErrors = [];
		for (let error = context.getError(); error !== context.NO_ERROR; error = context.getError()) {
			webglErrors.push(error);
		}
		const values = new Uint8Array(width * height * 4);
		context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, values);
		const shader = handle._buildResult.assembly.fragmentShaderSource;
		const diagnostics = handle.getDiagnostics();
		return {
			id: sceneSpec.id,
			timeLabel: sceneSpec.timeLabel,
			timeIso: sceneSpec.timeIso,
			viewAzimuthDegrees: sceneSpec.viewAzimuthDegrees,
			viewElevationDegrees: sceneSpec.viewElevationDegrees,
			directionToSourceUpEastNorth: sceneSpec.directionToSourceUpEastNorth,
			imagePngDataUrl: canvas.toDataURL('image/png'),
			image: summarize(values),
			palette: {entryCount: product.paletteEntryCount, sunOccupiedPixelCount: product.sunOccupiedPixelCount, suppressedStellarPixelCount: product.suppressedStellarPixelCount},
			webglErrors,
			programDiagnostics: renderer.info.programs.map((program) => program.diagnostics ?? null),
			shaderIncludes: {
				screenPalette: shader.includes('evaluateScreenPaletteCelestialRadiance'),
				legacySun: shader.includes('evaluatePrimaryCelestialRadiance'),
				legacyStars: shader.includes('evaluateStellarPointSetRadiance'),
				singleTransmittanceExpression: (shader.match(/state\.transmittance\.c\[channelIndex\] \* boundaryRadiance\.c\[channelIndex\]/gu) ?? []).length,
				ferwerdaFullScene: shader.includes('FERWERDA_CONE_SCALE') && shader.includes('FERWERDA_ROD_SCALE'),
				cumulativeAtmosphere: shader.includes('sampleCumulativeScatteringDensity'),
				sceneInputCapture: diagnostics.runtime.sceneInputCapture?.frameCount > 0,
			},
		};
	} finally {
		handle?.dispose();
		textures.matrix.dispose();
		textures.palette.dispose();
		scene.remove(...reviewBoxes, ...endpoints.visualObjects);
		for (const box of reviewBoxes) {
			box.geometry.dispose();
			box.material.dispose();
		}
		ground.geometry.dispose();
		ground.material.dispose();
		algorithm.dispose();
		composer.dispose();
		backend.dispose();
		renderer.dispose();
	}
}

/** Render the fixed sunset-facing three-time review with one screen-palette celestial owner. */
export async function runSunLayerThreeScenesBrowser() {
	const [config, fixture, radiometry] = await Promise.all([
		fetch('/browser/config.json').then((response) => response.json()),
		fetch('/fixtures/subjective-globe-context-scenes-v1.json').then((response) => response.json()),
		fetch('/fixtures/g4-cpu-sun-disk-transport-v1.json').then((response) => response.json()),
	]);
	const products = Object.fromEntries(await Promise.all(Object.entries(config.products).map(async ([id, descriptor]) => [id, await loadProduct(descriptor)])));
	const scenes = [];
	for (const sceneSpec of config.scenes) scenes.push(await renderScene({fixture, geometryConfiguration: radiometry.geometry, sceneSpec, product: products[sceneSpec.id]}));
	return {
		renderId: 'sun-layer-screen-palette-sunset-facing-three-scenes-v1',
		camera: config.camera,
		colorPolicy: config.colorPolicy,
		singleCelestialOwner: true,
		scenes,
	};
}
