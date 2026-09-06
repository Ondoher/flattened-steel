import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';

import { Algorithm32 } from '../candidate/src/algorithm32/Algorithm32.js';
import { CanonicalAtmosphere } from '../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import { CelestialRuntimeParticipant } from '../candidate/src/algorithm32/caches/celestial/CelestialRuntimeParticipant.js';
import { DistantSunCelestialSource } from '../candidate/src/algorithm32/caches/celestial/DistantSunCelestialSource.js';
import { BrunetonColorDisplayModel } from '../candidate/src/algorithm32/color/BrunetonColorDisplayModel.js';
import { CANONICAL_ATMOSPHERE_CONSTANTS } from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import { SphericalEarthGeometry } from '../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
import { DistantSunLightSource } from '../candidate/src/algorithm32/light-sources/DistantSunLightSource.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import { SPECTRAL_QUANTITIES, SPECTRAL_UNITS, createSpectralPacket } from '../candidate/src/algorithm32/quantities/index.js';
import { ThreeCacheBackend } from '../candidate/src/algorithm32/three/ThreeCacheBackend.js';

function summarizeRgba(values) {
	const sums = [0, 0, 0];
	let nonBlack = 0;
	for (let index = 0; index < values.length; index += 4) {
		for (let channel = 0; channel < 3; channel += 1) sums[channel] += values[index + channel];
		if (values[index] || values[index + 1] || values[index + 2]) nonBlack += 1;
	}
	return { nonBlack, meanRgb: sums.map((sum) => sum / (values.length / 4)) };
}

/** Execute a real facade/ShaderBuilder/EffectComposer atmosphere render. */
export async function runThreeAtmosphereCelestialBrowserProof() {
	const fixture = await fetch('/fixtures/g4-cpu-sun-disk-transport-v1.json').then((response) => response.json());
	const width = 320;
	const height = 320;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
	if (!context) throw new Error('WebGL2 is unavailable.');
	const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: false });
	renderer.setSize(width, height, false);
	const composer = new EffectComposer(renderer);
	composer.setSize(width, height);
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(90, 1, 0.1, 10_000);
	const backend = new ThreeCacheBackend({ THREE, renderer });
	const geometry = new SphericalEarthGeometry({
		...fixture.geometry,
		observerHeight: { value: 1000, units: 'meters' },
		directionToSource: [0, 0, 1],
		cacheAltitudeBinCount: 48,
	});
	const atmosphere = new CanonicalAtmosphere({ constants: CANONICAL_ATMOSPHERE_CONSTANTS, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const visualIrradianceScale = 100000000;
	const neutralDaylightIrradiance = fixture.sourceIrradianceValues.reduce((sum, value) => sum + value, 0) / fixture.sourceIrradianceValues.length;
	const irradiance = createSpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
		units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
		values: fixture.sourceIrradianceValues.map(() => neutralDaylightIrradiance * visualIrradianceScale),
		provenanceIdentity: 'three-atmosphere-celestial-neutral-daylight-sun-v1',
	});
	const lightSource = new DistantSunLightSource({ directionToLight: [0, 0, 1], sourceIrradiance: irradiance, angularRadius: { value: 0.12, units: 'radians' } });
	const celestial = new CelestialRuntimeParticipant({
		sources: [new DistantSunCelestialSource({ sourceId: fixture.sourceId, atmosphericSun: lightSource, spectralBasis: NATIVE_15_SPECTRAL_BASIS })],
		primarySourceId: fixture.sourceId,
	});
	const algorithm = new Algorithm32({
		geometry,
		atmosphere,
		lightSource,
		celestial,
		color: new BrunetonColorDisplayModel({ spectralBasis: NATIVE_15_SPECTRAL_BASIS }),
		spectral: NATIVE_15_SPECTRAL_BASIS,
		execution: { maximumScatteringOrder: 1, pathIntervalCount: 8 },
	});
	const bindingValues = {
		'geometry.inverseProjectionMatrix': new THREE.Matrix4(),
		'geometry.inverseViewMatrix': new THREE.Matrix4().makeRotationX(-Math.PI / 2),
		'geometry.cameraWorldPosition': new THREE.Vector3(0, 0, 6361000),
		'geometry.cameraGroundRelativePosition': new THREE.Vector3(0, 0, 1000),
		'geometry.sceneTermination': { value: 0, units: 'meters' },
		'geometry.sceneDepthMax': { value: 6420000, units: 'meters' },
		'light.directionToAtmosphericSource': new THREE.Vector3(0, 0, 1),
	};
	let handle;
	try {
		handle = await algorithm.setupShader({
			THREE,
			composer,
			scene,
			camera,
			viewportSize: { width, height, units: 'pixels' },
			cacheBackend: backend,
			bindingValues,
		});
		await handle.prepare(renderer);
		composer.render();
		const values = new Uint8Array(width * height * 4);
		context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, values);
		const diagnostics = handle.getDiagnostics();
		return {
			webglVersion: context.getParameter(context.VERSION),
			visualIrradianceScale,
			imagePngDataUrl: canvas.toDataURL('image/png'),
			image: summarizeRgba(values),
			diagnostics,
			shaderIncludes: {
				cumulativeAtmosphere: handle._buildResult.assembly.fragmentShaderSource.includes('sampleCumulativeScatteringDensity'),
				celestialLive: handle._buildResult.assembly.fragmentShaderSource.includes('evaluatePrimaryCelestialRadiance'),
				celestialRuntimeBinding: handle._buildResult.assembly.fragmentShaderSource.includes('uPrimaryCelestialRadianceCache'),
			},
		};
	} finally {
		handle?.dispose();
		algorithm.dispose();
		composer.dispose();
		backend.dispose();
		renderer.dispose();
	}
}
