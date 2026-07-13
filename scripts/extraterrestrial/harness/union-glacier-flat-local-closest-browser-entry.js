import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { Algorithm32 } from '../candidate/src/algorithm32/Algorithm32.js';
import { CanonicalAtmosphere } from '../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import { CelestialRuntimeParticipant } from '../candidate/src/algorithm32/caches/celestial/CelestialRuntimeParticipant.js';
import { FiniteLocalSunCelestialSource } from '../candidate/src/algorithm32/caches/celestial/FiniteLocalSunCelestialSource.js';
import { BrunetonColorDisplayModel } from '../candidate/src/algorithm32/color/BrunetonColorDisplayModel.js';
import { CANONICAL_ATMOSPHERE_CONSTANTS } from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import { FlatEarthGeometry } from '../candidate/src/algorithm32/geometries/FlatEarthGeometry.js';
import { FiniteLocalSunLightSource } from '../candidate/src/algorithm32/light-sources/FiniteLocalSunLightSource.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import { SPECTRAL_QUANTITIES, SPECTRAL_UNITS, createSpectralPacket } from '../candidate/src/algorithm32/quantities/index.js';
import { ThreeCacheBackend } from '../candidate/src/algorithm32/three/ThreeCacheBackend.js';

const distance = (value) => ({ value, units: 'meters' });
const position = (coordinates) => ({ coordinates, units: 'meters' });

function summarize(values) {
	let nonBlack = 0;
	const sums = [0, 0, 0];
	for (let index = 0; index < values.length; index += 4) {
		if (values[index] || values[index + 1] || values[index + 2]) nonBlack += 1;
		for (let channel = 0; channel < 3; channel += 1) sums[channel] += values[index + channel];
	}
	return { nonBlack, meanRgb: sums.map((sum) => sum / (values.length / 4)) };
}

function installFlat32GroundLighting({ scene, sourceScenePosition, fixture }) {
	const ambient = new THREE.AmbientLight(0xffffff, fixture.ambientLightIntensity);
	ambient.name = 'flat32-local-sun-ambient-fill';
	scene.add(ambient);
	const target = new THREE.Object3D(); target.position.set(0, 0, 0); scene.add(target);
	const directional = new THREE.DirectionalLight(0xffffff, fixture.directionalLightTotalIntensity);
	directional.name = 'flat32-local-sun-ground-directional';
	directional.position.copy(sourceScenePosition); directional.target = target; scene.add(directional);
	return { ambient, directional, target };
}

function createReviewBoxes(fixture) {
	return fixture.reviewBoxes.map((specification) => {
		const box = new THREE.Mesh(
			new THREE.BoxGeometry(...specification.sizeSceneUnits),
			new THREE.MeshLambertMaterial({ color: specification.colorHex }),
		);
		box.name = specification.name;
		box.position.set(...specification.positionSceneUnits);
		box.rotation.y = specification.rotationYRadians;
		return box;
	});
}

/** Render one frozen Union Glacier Flat-time presentation context. */
export async function runUnionGlacierFlatLocalClosestBrowserRender(stateId = 'flat-0') {
	const fixture = await fetch('/fixtures/union-glacier-flat-local-closest-approach-v1.json').then((response) => response.json());
	const state = fixture.states.find((candidate) => candidate.id === stateId);
	if (!state) throw new RangeError(`Unsupported Union Glacier Flat-time state: ${stateId}`);
	const { widthPixels: width, heightPixels: height, verticalFovDegrees } = fixture.camera;
	const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
	const context = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
	if (!context) throw new Error('WebGL2 is unavailable.');
	const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: false });
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.setSize(width, height, false);
	const sceneColorTarget = new THREE.WebGLRenderTarget(width, height, {
		minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
		format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
		depthBuffer: true, stencilBuffer: false,
	});
	sceneColorTarget.texture.colorSpace = THREE.NoColorSpace;
	const composer = new EffectComposer(renderer, sceneColorTarget); composer.setSize(width, height);
	const backend = new ThreeCacheBackend({ THREE, renderer });
	const source = { ...fixture.source, centerMeters: state.centerMeters };
	const sceneScaleMeters = fixture.sceneScaleMetersPerUnit;
	const groundExtentMeters = fixture.groundExtentSceneUnits * sceneScaleMeters;
	const geometry = new FlatEarthGeometry({
		observerPosition: position([0, 0, 5]), sourcePosition: position(source.centerMeters),
		topAltitude: distance(fixture.geometry.topAltitudeMeters), cacheRadialMaximum: distance(state.cacheRadialMaximumMeters),
		sceneSkyRayLimit: distance(fixture.geometry.observerDomeMaxViewRayMeters),
		observerCenteredDome: { centerPolicy: 'observer-centered', apexAltitude: distance(fixture.geometry.observerDomeApexMeters), maxObserverViewRayExtent: distance(fixture.geometry.observerDomeMaxViewRayMeters) },
	});
	const radiance = createSpectralPacket({ basis: NATIVE_15_SPECTRAL_BASIS, quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY, units: SPECTRAL_UNITS.RADIANCE_DENSITY, values: source.surfaceRadianceValues, provenanceIdentity: 'union-glacier-flat-local-closest-radiance-v1' });
	const lightSource = new FiniteLocalSunLightSource({ sourceKey: source.sourceId, position: geometry.configuration.sourcePosition, radius: distance(source.radiusMeters), surfaceRadiance: radiance, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const celestialSource = new FiniteLocalSunCelestialSource({ sourceId: source.sourceId, radius: distance(source.radiusMeters), surfaceRadiance: radiance, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const algorithm = new Algorithm32({ geometry, atmosphere: new CanonicalAtmosphere({ constants: CANONICAL_ATMOSPHERE_CONSTANTS, spectralBasis: NATIVE_15_SPECTRAL_BASIS }), lightSource, celestial: new CelestialRuntimeParticipant({ sources: [celestialSource], primarySourceId: source.sourceId }), color: new BrunetonColorDisplayModel({ spectralBasis: NATIVE_15_SPECTRAL_BASIS }), spectral: NATIVE_15_SPECTRAL_BASIS, execution: { maximumScatteringOrder: 4 } });
	const scene = new THREE.Scene(); scene.background = new THREE.Color(fixture.sceneBackgroundHex);
	const camera = new THREE.PerspectiveCamera(verticalFovDegrees, width / height, 0.002, 500);
	camera.position.set(0, 0.005, 0); camera.up.set(0, 1, 0); camera.lookAt(0, 0, -1); camera.updateMatrixWorld(true); camera.updateProjectionMatrix();
	const endpoints = geometry.createThreeEndpointObjects({ name: 'union-glacier-flat-ground', sceneScale: { value: sceneScaleMeters, units: 'meters-per-scene-unit' }, groundExtent: distance(groundExtentMeters), widthSegments: 96, heightSegments: 96, visualMaterialColor: fixture.groundColorHex, visualMaterialLighting: 'lambert' });
	const [ground] = endpoints.visualObjects; scene.add(...endpoints.visualObjects);
	const reviewBoxes = createReviewBoxes(fixture); scene.add(...reviewBoxes);
	const sourceScenePosition = new THREE.Vector3(source.centerMeters[0] / sceneScaleMeters, source.centerMeters[2] / sceneScaleMeters, -source.centerMeters[1] / sceneScaleMeters);
	const groundLighting = installFlat32GroundLighting({ scene, sourceScenePosition, fixture });
	composer.addPass(new RenderPass(scene, camera));
	const bindings = { 'geometry.inverseProjectionMatrix': camera.projectionMatrixInverse.clone(), 'geometry.inverseViewMatrix': camera.matrixWorld.clone(), 'geometry.cameraWorldPosition': new THREE.Vector3(0, 0, 5), 'geometry.sceneTermination': distance(0), 'geometry.sceneDepthMax': geometry.resolveSceneDepthMax({ groundExtent: distance(groundExtentMeters) }), 'geometry.flatFiniteSun.centerMeters': new THREE.Vector3(...source.centerMeters) };
	let handle;
	try {
		handle = await algorithm.setupShader({ THREE, composer, scene, camera, viewportSize: { width, height, units: 'pixels' }, cacheBackend: backend, sceneScale: { value: sceneScaleMeters, units: 'meters-per-scene-unit' }, bindingValues: bindings });
		await handle.prepare(renderer); composer.render();
		const rgba = new Uint8Array(width * height * 4); context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, rgba);
		const sourceNdc = sourceScenePosition.clone().project(camera);
		const shader = handle._buildResult.assembly.fragmentShaderSource;
		return { location: fixture.location, stateId, timeLabel: state.timeLabel, source: { centerMeters: source.centerMeters, elevationDegrees: Math.atan2(source.centerMeters[2] - 5, Math.hypot(source.centerMeters[0], source.centerMeters[1])) * 180 / Math.PI, screenPixels: { x: (sourceNdc.x * 0.5 + 0.5) * width, y: (sourceNdc.y * 0.5 + 0.5) * height } }, diskLiveCenterMeters: handle._buildResult.runtime.getUniformValue('uFlatFiniteSunCenterMeters').toArray(), camera: { width, height, verticalFovDegrees, azimuthDegrees: fixture.camera.viewAzimuthDegrees, elevationDegrees: fixture.camera.viewElevationDegrees, sceneScaleMeters }, ground: { owner: endpoints.metadata.owner, endpointKind: endpoints.metadata.endpointKind }, reviewBoxes: { count: reviewBoxes.length, names: reviewBoxes.map((box) => box.name) }, sceneLighting: { ambientIntensity: fixture.ambientLightIntensity, directionalIntensity: fixture.directionalLightTotalIntensity }, dome: { apexMeters: fixture.geometry.observerDomeApexMeters, maximumViewRayMeters: fixture.geometry.observerDomeMaxViewRayMeters }, image: summarize(rgba), imagePngDataUrl: canvas.toDataURL('image/png'), diagnostics: handle.getDiagnostics(), shaderIncludes: { finiteDisk: shader.includes('evaluateFlatFiniteSunRadiance'), dome: shader.includes('observerDomeBoundaryDistance'), normalCache: shader.includes('sampleCumulativeScatteringDensity') } };
	} finally { handle?.dispose(); scene.remove(groundLighting.directional, groundLighting.target, groundLighting.ambient, ...reviewBoxes); scene.remove(...endpoints.visualObjects); for (const box of reviewBoxes) { box.geometry.dispose(); box.material.dispose(); } ground.geometry.dispose(); ground.material.dispose(); algorithm.dispose(); composer.dispose(); sceneColorTarget.dispose(); backend.dispose(); renderer.dispose(); }
}
