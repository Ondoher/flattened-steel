import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';

import { Algorithm32 } from '../candidate/src/algorithm32/Algorithm32.js';
import { CanonicalAtmosphere } from '../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import { CelestialRuntimeParticipant } from '../candidate/src/algorithm32/caches/celestial/CelestialRuntimeParticipant.js';
import { DistantSunCelestialSource } from '../candidate/src/algorithm32/caches/celestial/DistantSunCelestialSource.js';
import { StellarCelestialSource } from '../candidate/src/algorithm32/caches/celestial/StellarCelestialSource.js';
import { CANONICAL_ATMOSPHERE_CONSTANTS } from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import { SphericalEarthGeometry } from '../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
import { DistantSunLightSource } from '../candidate/src/algorithm32/light-sources/DistantSunLightSource.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import { SPECTRAL_QUANTITIES, SPECTRAL_UNITS, createSpectralPacket } from '../candidate/src/algorithm32/quantities/index.js';
import { ThreeCacheBackend } from '../candidate/src/algorithm32/three/ThreeCacheBackend.js';
import { createShaderContribution, createShaderSourceBlock } from '../candidate/src/algorithm32/shader/shaderContribution.js';

function requireCondition(value, message) { if (!value) throw new Error(message); }

function sum(values) { return values.reduce((total, value) => total + value, 0); }

function readComposerCenter(renderer, composer, width, height) {
	const result = new Float32Array(4);
	renderer.readRenderTargetPixels(composer.writeBuffer, Math.floor(width / 2), Math.floor(height / 2), 1, 1, result);
	return [...result];
}

/** Diagnostic Color owner: exposes completed spectral radiance without changing transport or raster work. */
class SpectralChannelProbeColor {
	describe() { return { kind: 'stellar-live-raster-spectral-probe-color-v1' }; }
	createShaderContribution({ descriptor }) {
		return createShaderContribution({
			id: 'color-stellar-live-raster-spectral-probe', owner: 'color',
			descriptorFingerprint: descriptor.color.fingerprint,
			compatibilityTags: descriptor.color.compatibilityTags,
			provides: ['color.composeSceneColor', 'color.encodeOutput'],
			requires: ['runtime.initialState', 'transport.evaluatePathRadiance', 'composition.composeSpectralRadiance'],
			mainHooks: [
				createShaderSourceBlock('color-stellar-live-raster-probe-compose', 'composeSceneColor', 0, 'state.outputRgba = vec4(state.preDisplayRadiance.c[0], state.preDisplayRadiance.c[1], state.preDisplayRadiance.c[2], 1.0);'),
				createShaderSourceBlock('color-stellar-live-raster-probe-output', 'encodeOutput', 0, 'outColor = state.outputRgba;'),
			],
		});
	}
}

/** Render the actual 500-member tiled field through normal ShaderBuilder assembly. */
export async function runStellarLiveRasterBrowserProof() {
	const input = await fetch('/browser/stellar-runtime-input.json').then((response) => response.json());
	const fixture = await fetch('/fixtures/g4-cpu-sun-disk-transport-v1.json').then((response) => response.json());
	const width = 64;
	const height = 64;
	const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
	const context = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
	if (!context) throw new Error('WebGL2 is unavailable.');
	if (!context.getExtension('EXT_color_buffer_float')) throw new Error('Float composer readback is unavailable.');
	const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: false });
	renderer.setSize(width, height, false);
	const renderTarget = new THREE.WebGLRenderTarget(width, height, { type: THREE.FloatType, format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false });
	const composer = new EffectComposer(renderer, renderTarget);
	composer.setSize(width, height);
	composer.renderToScreen = false;
	const scene = new THREE.Scene();
	const targetDirection = new THREE.Vector3(...input.targetDirection);
	const camera = new THREE.PerspectiveCamera(90, 1, 0.1, 1000);
	const aimAtModelDirection = (direction) => {
		camera.position.set(0, 0, 0);
		camera.up.set(0, 1, 0);
		camera.lookAt(direction.x, direction.z, -direction.y);
		camera.updateMatrixWorld(true);
	};
	// Default spherical observer-local axes map model direction (x,y,z) to scene (x,z,-y).
	aimAtModelDirection(targetDirection);
	const stellarMembers = input.transportMembers.map((member) => ({
		memberId: member.memberId,
		sourceIrradiance: createSpectralPacket({
			basis: NATIVE_15_SPECTRAL_BASIS,
			quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
			units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
			values: member.values,
			provenanceIdentity: `stellar-runtime-materialized:${member.memberId}`,
		}),
	}));
	const stellar = new StellarCelestialSource({
		catalog: input.catalog,
		members: input.members,
		materializedTransportMembers: stellarMembers,
		materializedTransportIdentity: input.transportIdentity,
	});
	const geometry = new SphericalEarthGeometry({
		...fixture.geometry,
		observerHeight: { value: 1000, units: 'meters' },
		directionToSource: [-1, 0, 0],
		cacheAltitudeBinCount: 48,
	});
	const atmosphere = new CanonicalAtmosphere({ constants: CANONICAL_ATMOSPHERE_CONSTANTS, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const sourceIrradiance = createSpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
		units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
		values: fixture.sourceIrradianceValues,
		provenanceIdentity: 'stellar-live-runtime-atmospheric-sun-v1',
	});
	const lightSource = new DistantSunLightSource({ directionToLight: [-1, 0, 0], sourceIrradiance, angularRadius: { value: fixture.angularRadiusRadians, units: 'radians' } });
	const celestial = new CelestialRuntimeParticipant({
		sources: [new DistantSunCelestialSource({ sourceId: fixture.sourceId, atmosphericSun: lightSource, spectralBasis: NATIVE_15_SPECTRAL_BASIS }), stellar],
		primarySourceId: fixture.sourceId,
	});
	const algorithm = new Algorithm32({
		geometry, atmosphere, lightSource, celestial,
		color: new SpectralChannelProbeColor(),
		spectral: NATIVE_15_SPECTRAL_BASIS,
		execution: { maximumScatteringOrder: 1, pathIntervalCount: 8 },
	});
	const backend = new ThreeCacheBackend({ THREE, renderer });
	const bindingValues = {
		'geometry.inverseProjectionMatrix': camera.projectionMatrixInverse.clone(),
		'geometry.inverseViewMatrix': camera.matrixWorld.clone(),
		'geometry.cameraWorldPosition': new THREE.Vector3(0, 0, 6361000),
		'geometry.cameraGroundRelativePosition': new THREE.Vector3(0, 0, 1000),
		'geometry.sceneTermination': { value: 6420000, units: 'meters' },
		'geometry.sceneDepthMax': { value: 6420000, units: 'meters' },
		'light.directionToAtmosphericSource': new THREE.Vector3(-1, 0, 0),
	};
	let handle;
	try {
		handle = await algorithm.setupShader({ THREE, composer, scene, camera, viewportSize: { width, height, units: 'pixels' }, cacheBackend: backend, bindingValues });
		await handle.prepare(renderer);
		composer.render();
		const clearCenter = readComposerCenter(renderer, composer, width, height);
		const cache = handle._buildResult.stellarPointSetCache;
		const selectedMemberIndex = input.targetMemberIndex;
		const selectedTile = cache.tiledCache.memberTiles.get(cache.tiledCache.members[selectedMemberIndex].memberId);
		const selectedReadback = await cache.readSelectedScalars(backend, [{
			directionIndex: selectedTile.tileX * cache.tiledCache.directionCount + cache.tiledCache.directionCount - 1,
			positionIndex: selectedTile.tileY * cache.tiledCache.positionCount,
			wavelengthIndex: 0,
		}]);
		const blocker = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({ color: 0xffffff }));
		blocker.position.set(targetDirection.x * 2, targetDirection.z * 2, -targetDirection.y * 2);
		blocker.quaternion.copy(camera.quaternion);
		scene.add(blocker);
		composer.render();
		const blockedCenter = readComposerCenter(renderer, composer, width, height);
		scene.remove(blocker); blocker.geometry.dispose(); blocker.material.dispose();
		aimAtModelDirection(targetDirection.clone().multiplyScalar(-1));
		bindingValues['geometry.inverseViewMatrix'].copy(camera.matrixWorld);
		composer.render();
		const offFrameClearCenter = readComposerCenter(renderer, composer, width, height);
		const offFrameBlocker = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({ color: 0xffffff }));
		offFrameBlocker.position.set(-targetDirection.x * 2, -targetDirection.z * 2, targetDirection.y * 2);
		offFrameBlocker.quaternion.copy(camera.quaternion);
		scene.add(offFrameBlocker);
		composer.render();
		const offFrameBlockedCenter = readComposerCenter(renderer, composer, width, height);
		scene.remove(offFrameBlocker); offFrameBlocker.geometry.dispose(); offFrameBlocker.material.dispose();
		const shader = handle._buildResult.assembly.fragmentShaderSource;
		requireCondition(cache.tiledCache.members.length === 500 && cache.tiledCache.layout.shape.direction === 352 && cache.tiledCache.layout.shape.position === 208 && cache.tiledCache.layout.shape.wavelength === 15, 'Normal runtime must consume the accepted 500-member tiled R32F field.');
		requireCondition(selectedReadback.samples[0].value > 0, 'Selected member transport sample must be positive before raster consumption.');
		requireCondition(shader.includes('evaluateStellarPointSetRadiance') && shader.includes('stellarPixelSolidAngle') && shader.includes('uStellarPointSetIrradianceCache'), 'Assembled shader must include the stellar cache fetch, normalized exact-footprint response, and runtime binding.');
		return {
			webglVersion: context.getParameter(context.VERSION),
			memberCount: cache.tiledCache.members.length,
			cacheStorage: cache._artifact.result.storage,
			selectedReadback: selectedReadback.samples[0].value,
			clearCenter,
			blockedCenter,
			clearMinusBlocked: sum(clearCenter) - sum(blockedCenter),
			offFrameClearCenter,
			offFrameBlockedCenter,
			offFrameClearMinusBlocked: sum(offFrameClearCenter) - sum(offFrameBlockedCenter),
			shaderIncludes: { stellarRaster: shader.includes('evaluateStellarPointSetRadiance'), exactSolidAngle: shader.includes('stellarPixelSolidAngle'), runtimeBinding: shader.includes('uStellarPointSetIrradianceCache') },
	};
	} finally {
		handle?.dispose();
		algorithm.dispose();
		composer.dispose();
		renderTarget.dispose();
		backend.dispose();
		renderer.dispose();
	}
}
