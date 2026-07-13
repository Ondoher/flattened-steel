import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

import { Algorithm32 } from '../candidate/src/algorithm32/Algorithm32.js';
import { CanonicalAtmosphere } from '../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import { CelestialRuntimeParticipant } from '../candidate/src/algorithm32/caches/celestial/CelestialRuntimeParticipant.js';
import { FiniteLocalSunCelestialSource } from '../candidate/src/algorithm32/caches/celestial/FiniteLocalSunCelestialSource.js';
import { BrunetonColorDisplayModel } from '../candidate/src/algorithm32/color/BrunetonColorDisplayModel.js';
import { CANONICAL_ATMOSPHERE_CONSTANTS, FIGURE1_DISPLAY_CONSTANTS } from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import { FlatEarthGeometry } from '../candidate/src/algorithm32/geometries/FlatEarthGeometry.js';
import { FiniteLocalSunLightSource } from '../candidate/src/algorithm32/light-sources/FiniteLocalSunLightSource.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import { SPECTRAL_QUANTITIES, SPECTRAL_UNITS, createSpectralPacket } from '../candidate/src/algorithm32/quantities/index.js';
import { ThreeCacheBackend } from '../candidate/src/algorithm32/three/ThreeCacheBackend.js';

const distance = (value) => ({ value, units: 'meters' });
const position = (coordinates) => ({ coordinates, units: 'meters' });
const WIDTH = 512;
const HEIGHT = 512;
const SOURCE_HORIZONTAL_METERS = 1600000;
const CAMERA_ELEVATION_DEGREES = 37;
const VERTICAL_FOV_DEGREES = 78;
const OBSERVER_DOME_APEX_METERS = 100000;
const OBSERVER_DOME_MAX_VIEW_RAY_METERS = 1926774;

function summarizeRgba(values) {
	let nonBlack = 0;
	const sums = [0, 0, 0];
	for (let index = 0; index < values.length; index += 4) {
		for (let channel = 0; channel < 3; channel += 1) sums[channel] += values[index + channel];
		if (values[index] || values[index + 1] || values[index + 2]) nonBlack += 1;
	}
	return { nonBlack, meanRgb: sums.map((sum) => sum / (values.length / 4)) };
}

function averageRgbAround(values, center, radiusPixels = 8) {
	const sums = [0, 0, 0];
	let count = 0;
	for (let y = Math.max(0, Math.floor(center.y - radiusPixels)); y <= Math.min(HEIGHT - 1, Math.ceil(center.y + radiusPixels)); y += 1) {
		for (let x = Math.max(0, Math.floor(center.x - radiusPixels)); x <= Math.min(WIDTH - 1, Math.ceil(center.x + radiusPixels)); x += 1) {
			if ((x - center.x) ** 2 + (y - center.y) ** 2 > radiusPixels ** 2) continue;
			const offset = (y * WIDTH + x) * 4;
			for (let channel = 0; channel < 3; channel += 1) sums[channel] += values[offset + channel];
			count += 1;
		}
	}
	return sums.map((sum) => sum / Math.max(count, 1));
}

function energy(rgb) { return rgb[0] + rgb[1] + rgb[2]; }

function sourceCenterPixels(camera, sourceScenePosition) {
	const clip = sourceScenePosition.clone().project(camera);
	return { x: (clip.x * 0.5 + 0.5) * WIDTH, y: (clip.y * 0.5 + 0.5) * HEIGHT };
}

function createOccluder({ center, radiusMeters, name }) {
	const object = new THREE.Mesh(
		new THREE.SphereGeometry(radiusMeters, 24, 16),
		new THREE.MeshBasicMaterial({ color: 0x14100d }),
	);
	object.name = name;
	object.position.copy(center);
	object.userData.algorithm32SceneInput = true;
	return object;
}

function capture(context, canvas, camera, sourceScenePosition) {
	const rgba = new Uint8Array(WIDTH * HEIGHT * 4);
	context.readPixels(0, 0, WIDTH, HEIGHT, context.RGBA, context.UNSIGNED_BYTE, rgba);
	const sourceCenter = sourceCenterPixels(camera, sourceScenePosition);
	const diskRegionMeanRgb = averageRgbAround(rgba, sourceCenter);
	return {
		imagePngDataUrl: canvas.toDataURL('image/png'),
		image: summarizeRgba(rgba),
		sourceCenterPixels: sourceCenter,
		diskRegionMeanRgb,
		diskRegionEnergy: energy(diskRegionMeanRgb),
	};
}

/**
 * Render a geometry-owned Flat ground/horizon with clear, fully blocked, and
 * partially blocked finite local-Sun visibility through the normal runtime.
 */
export async function runFlatLocalFiniteSunGroundScenesBrowserProof() {
	const fixture = await fetch('/fixtures/flat-local-finite-sun-v1.json').then((response) => response.json());
	const canvas = document.createElement('canvas'); canvas.width = WIDTH; canvas.height = HEIGHT;
	const context = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
	if (!context) throw new Error('WebGL2 is unavailable.');
	const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: false }); renderer.setSize(WIDTH, HEIGHT, false);
	const composer = new EffectComposer(renderer); composer.setSize(WIDTH, HEIGHT);
	const backend = new ThreeCacheBackend({ THREE, renderer });
	const sourceConfig = fixture.source;
	const sourceCenter = [SOURCE_HORIZONTAL_METERS, 0, sourceConfig.centerHeightMeters];
	const geometry = new FlatEarthGeometry({
		observerPosition: position([0, 0, 2]), sourcePosition: position(sourceCenter),
		topAltitude: distance(fixture.geometry.topAltitudeMeters), cacheRadialMaximum: distance(fixture.geometry.cacheRadialMaximumMeters),
		sceneSkyRayLimit: distance(OBSERVER_DOME_MAX_VIEW_RAY_METERS),
		observerCenteredDome: {
			centerPolicy: 'observer-centered',
			apexAltitude: distance(OBSERVER_DOME_APEX_METERS),
			maxObserverViewRayExtent: distance(OBSERVER_DOME_MAX_VIEW_RAY_METERS),
		},
		cacheAltitudeNodes: [distance(0), distance(50000), distance(100000)], cacheRadialNodes: [distance(0), distance(2400000), distance(4800000)],
	});
	const radiance = createSpectralPacket({ basis: NATIVE_15_SPECTRAL_BASIS, quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY, units: SPECTRAL_UNITS.RADIANCE_DENSITY, values: sourceConfig.surfaceRadianceValues, provenanceIdentity: 'flat-local-finite-sun-ground-scene-radiance-v1' });
	const lightSource = new FiniteLocalSunLightSource({ sourceKey: sourceConfig.sourceId, position: geometry.configuration.sourcePosition, radius: distance(sourceConfig.radiusMeters), surfaceRadiance: radiance, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const celestialSource = new FiniteLocalSunCelestialSource({ sourceId: sourceConfig.sourceId, radius: distance(sourceConfig.radiusMeters), surfaceRadiance: radiance, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const algorithm = new Algorithm32({
		geometry, atmosphere: new CanonicalAtmosphere({ constants: CANONICAL_ATMOSPHERE_CONSTANTS, spectralBasis: NATIVE_15_SPECTRAL_BASIS }), lightSource,
		celestial: new CelestialRuntimeParticipant({ sources: [celestialSource], primarySourceId: sourceConfig.sourceId }),
		color: new BrunetonColorDisplayModel({ spectralBasis: NATIVE_15_SPECTRAL_BASIS, displayConstants: { ...FIGURE1_DISPLAY_CONSTANTS, paperFigure1ToneMapK: FIGURE1_DISPLAY_CONSTANTS.paperFigure1ToneMapK * 120 } }), spectral: NATIVE_15_SPECTRAL_BASIS,
		execution: { maximumScatteringOrder: 4 },
	});
	const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
	const camera = new THREE.PerspectiveCamera(VERTICAL_FOV_DEGREES, 1, 0.1, 5000000);
	const elevationRadians = CAMERA_ELEVATION_DEGREES * Math.PI / 180;
	camera.position.set(0, 2, 0); camera.up.set(0, 1, 0);
	camera.lookAt(1000 * Math.cos(elevationRadians), 2 + 1000 * Math.sin(elevationRadians), 0);
	camera.updateMatrixWorld(true); camera.updateProjectionMatrix();
	const endpoints = geometry.createThreeEndpointObjects({
		name: 'flat-local-sun-ground', sceneScale: { value: 1, units: 'meters-per-scene-unit' }, groundExtent: distance(OBSERVER_DOME_MAX_VIEW_RAY_METERS), widthSegments: 96, heightSegments: 96,
		visualMaterialDisplayRgba: [56, 69, 41, 255],
	});
	const [ground] = endpoints.visualObjects;
	scene.add(...endpoints.visualObjects);
	composer.addPass(new RenderPass(scene, camera));
	const sourceScenePosition = new THREE.Vector3(SOURCE_HORIZONTAL_METERS, sourceConfig.centerHeightMeters, 0);
	const directionToSun = sourceScenePosition.clone().sub(camera.position).normalize();
	const tangent = new THREE.Vector3(0, 0, 1);
	const liveBindings = {
		'geometry.inverseProjectionMatrix': camera.projectionMatrixInverse.clone(), 'geometry.inverseViewMatrix': camera.matrixWorld.clone(),
		'geometry.cameraWorldPosition': new THREE.Vector3(0, 0, 2), 'geometry.sceneTermination': distance(0), 'geometry.sceneDepthMax': geometry.resolveSceneDepthMax({ groundExtent: distance(OBSERVER_DOME_MAX_VIEW_RAY_METERS) }),
		'geometry.flatFiniteSun.centerMeters': new THREE.Vector3(...sourceCenter),
	};
	let handle;
	let fullyBlocked;
	let partiallyBlocked;
	try {
		handle = await algorithm.setupShader({ THREE, composer, scene, camera, viewportSize: { width: WIDTH, height: HEIGHT, units: 'pixels' }, cacheBackend: backend, sceneScale: { value: 1, units: 'meters-per-scene-unit' }, bindingValues: liveBindings });
		await handle.prepare(renderer);
		composer.render(); const clear = capture(context, canvas, camera, sourceScenePosition);
		fullyBlocked = createOccluder({ center: camera.position.clone().addScaledVector(directionToSun, 75000), radiusMeters: 10000, name: 'flat-local-sun-full-occluder' });
		scene.add(fullyBlocked); composer.render(); const blocked = capture(context, canvas, camera, sourceScenePosition);
		scene.remove(fullyBlocked);
		partiallyBlocked = createOccluder({ center: camera.position.clone().addScaledVector(directionToSun, 150000).addScaledVector(tangent, 260), radiusMeters: 360, name: 'flat-local-sun-partial-occluder' });
		scene.add(partiallyBlocked); composer.render(); const partial = capture(context, canvas, camera, sourceScenePosition);
		const source = handle._buildResult.assembly.fragmentShaderSource;
		return {
			camera: { verticalFovDegrees: VERTICAL_FOV_DEGREES, elevationDegrees: CAMERA_ELEVATION_DEGREES, sourceHorizontalMeters: SOURCE_HORIZONTAL_METERS, sourceNotCentered: true },
			ground: { owner: endpoints.metadata.owner, endpointKind: endpoints.metadata.endpointKind, shape: endpoints.metadata.shape, groundPlane: endpoints.metadata.groundPlane },
			scenes: { clear, blocked, partial },
			diagnostics: handle.getDiagnostics(),
			shaderIncludes: { finiteDisk: source.includes('evaluateFlatFiniteSunRadiance'), finiteAtmosphere: source.includes('finiteCelestialAtmosphereSegmentLength'), normalCache: source.includes('sampleCumulativeScatteringDensity') },
		};
	} finally {
		if (fullyBlocked) { scene.remove(fullyBlocked); fullyBlocked.geometry.dispose(); fullyBlocked.material.dispose(); }
		if (partiallyBlocked) { scene.remove(partiallyBlocked); partiallyBlocked.geometry.dispose(); partiallyBlocked.material.dispose(); }
		handle?.dispose(); scene.remove(...endpoints.visualObjects); ground.geometry.dispose(); ground.material.dispose(); algorithm.dispose(); composer.dispose(); backend.dispose(); renderer.dispose();
	}
}
