import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
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
	for (let index = 0; index < values.length; index += 4) if (values[index] || values[index + 1] || values[index + 2]) nonBlack += 1;
	return { nonBlack };
}

function changedPixelCount(left, right) {
	let changed = 0;
	for (let index = 0; index < left.length; index += 4) {
		if (left[index] !== right[index] || left[index + 1] !== right[index + 1] || left[index + 2] !== right[index + 2]) changed += 1;
	}
	return changed;
}

/** Exercise the normal facade, both cache controllers, and a rendered finite disk. */
export async function runFlatFiniteSunRuntimeBrowserProof() {
	const fixture = await fetch('/fixtures/flat-local-finite-sun-v1.json').then((response) => response.json());
	const width = 256; const height = 256;
	const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
	const context = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
	if (!context) throw new Error('WebGL2 is unavailable.');
	const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: false }); renderer.setSize(width, height, false);
	const composer = new EffectComposer(renderer); composer.setSize(width, height);
	const backend = new ThreeCacheBackend({ THREE, renderer });
	const sourceConfig = fixture.source;
	const geometry = new FlatEarthGeometry({
		observerPosition: position([0, 0, 2]), sourcePosition: position([0, 0, sourceConfig.centerHeightMeters]),
		topAltitude: distance(fixture.geometry.topAltitudeMeters), cacheRadialMaximum: distance(fixture.geometry.cacheRadialMaximumMeters),
		cacheAltitudeNodes: [distance(0), distance(50000), distance(100000)], cacheRadialNodes: [distance(0), distance(2400000), distance(4800000)],
	});
	const radiance = createSpectralPacket({ basis: NATIVE_15_SPECTRAL_BASIS, quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY, units: SPECTRAL_UNITS.RADIANCE_DENSITY, values: sourceConfig.surfaceRadianceValues.map((value) => value * 1000), provenanceIdentity: 'flat-finite-sun-runtime-visual-radiance-v1' });
	const lightSource = new FiniteLocalSunLightSource({ sourceKey: sourceConfig.sourceId, position: geometry.configuration.sourcePosition, radius: distance(sourceConfig.radiusMeters), surfaceRadiance: radiance, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const celestialSource = new FiniteLocalSunCelestialSource({ sourceId: sourceConfig.sourceId, radius: distance(sourceConfig.radiusMeters), surfaceRadiance: radiance, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const algorithm = new Algorithm32({
		geometry, atmosphere: new CanonicalAtmosphere({ constants: CANONICAL_ATMOSPHERE_CONSTANTS, spectralBasis: NATIVE_15_SPECTRAL_BASIS }), lightSource,
		celestial: new CelestialRuntimeParticipant({ sources: [celestialSource], primarySourceId: sourceConfig.sourceId }),
		color: new BrunetonColorDisplayModel({ spectralBasis: NATIVE_15_SPECTRAL_BASIS }), spectral: NATIVE_15_SPECTRAL_BASIS,
		execution: { maximumScatteringOrder: 1, pathIntervalCount: 8 },
	});
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 10); camera.position.set(0, 0, 0); camera.lookAt(0, 1, 0); camera.updateMatrixWorld(true); camera.updateProjectionMatrix();
	const liveBindings = {
		'geometry.inverseProjectionMatrix': camera.projectionMatrixInverse.clone(), 'geometry.inverseViewMatrix': camera.matrixWorld.clone(),
		'geometry.cameraWorldPosition': new THREE.Vector3(0, 0, 2), 'geometry.sceneTermination': distance(0), 'geometry.sceneDepthMax': distance(5000000),
		'geometry.flatFiniteSun.centerMeters': new THREE.Vector3(0, 0, sourceConfig.centerHeightMeters),
	};
	let handle;
	try {
		handle = await algorithm.setupShader({ THREE, composer, scene, camera, viewportSize: { width, height, units: 'pixels' }, cacheBackend: backend, bindingValues: liveBindings });
		await handle.prepare(renderer); composer.render();
		const initial = new Uint8Array(width * height * 4); context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, initial);
		liveBindings['geometry.flatFiniteSun.centerMeters'].x = fixture.horizontalTranslationMeters;
		composer.render();
		const translated = new Uint8Array(width * height * 4); context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, translated);
		const source = handle._buildResult.assembly.fragmentShaderSource;
		return {
			imagePngDataUrl: canvas.toDataURL('image/png'), initial: summarize(initial), translated: summarize(translated), diagnostics: handle.getDiagnostics(),
			shaderIncludes: { finiteDisk: source.includes('evaluateFlatFiniteSunRadiance'), finiteAtmosphere: source.includes('finiteCelestialAtmosphereSegmentLength'), normalCache: source.includes('sampleCumulativeScatteringDensity') },
			changedPixelsAfterLiveCenterRefresh: changedPixelCount(initial, translated),
			centerUniformAfterRefresh: handle._buildResult.runtime.getUniformValue('uFlatFiniteSunCenterMeters').toArray(),
			celestialGenerationIdentity: handle._buildResult.celestialCache.generationIdentity,
		};
	} finally { handle?.dispose(); algorithm.dispose(); composer.dispose(); backend.dispose(); renderer.dispose(); }
}
