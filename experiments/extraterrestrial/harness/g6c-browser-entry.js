import * as THREE from 'three';

import { CanonicalAtmosphere } from '../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import { PrimaryCelestialCache } from '../candidate/src/algorithm32/caches/celestial/PrimaryCelestialCache.js';
import { PrimaryCelestialGpuCacheController } from '../candidate/src/algorithm32/caches/celestial/PrimaryCelestialGpuCacheController.js';
import { DistantSunCelestialSource } from '../candidate/src/algorithm32/caches/celestial/DistantSunCelestialSource.js';
import { CANONICAL_ATMOSPHERE_CONSTANTS } from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import { SphericalEarthGeometry } from '../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
import { DistantSunLightSource } from '../candidate/src/algorithm32/light-sources/DistantSunLightSource.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import { SPECTRAL_QUANTITIES, SPECTRAL_UNITS, createSpectralPacket } from '../candidate/src/algorithm32/quantities/index.js';
import { ThreeCacheBackend } from '../candidate/src/algorithm32/three/ThreeCacheBackend.js';

function placement(state, fixture) {
	return {
		sourceId: fixture.sourceId,
		direction: state.sunDirection,
		frameId: state.observationState.celestialFrameId,
		originConvention: 'observer-independent-infinite-direction',
		directionConvention: 'receiver-to-source',
		epoch: state.observationState.epoch,
		placementProviderContractFingerprint: 'sha256:g4-provider-v1',
		placementStateFingerprint: `sha256:g6c-${state.stateId}`,
	};
}

/** Execute the focused G6c proof in a real browser WebGL2 context. */
export async function runG6cBrowserProof() {
	const fixture = await fetch('/fixtures/g4-cpu-sun-disk-transport-v1.json').then((response) => {
		if (!response.ok) throw new Error(`Could not load G4 fixture: ${response.status}.`);
		return response.json();
	});
	const canvas = document.createElement('canvas');
	canvas.width = 16;
	canvas.height = 16;
	const context = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
	if (!context) throw new Error('WebGL2 is unavailable.');
	const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: false });
	const backend = new ThreeCacheBackend({ THREE, renderer });
	const geometry = new SphericalEarthGeometry(fixture.geometry);
	const atmosphere = new CanonicalAtmosphere({ constants: CANONICAL_ATMOSPHERE_CONSTANTS, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const irradiance = createSpectralPacket({ basis: NATIVE_15_SPECTRAL_BASIS, quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY, units: SPECTRAL_UNITS.IRRADIANCE_DENSITY, values: fixture.sourceIrradianceValues, provenanceIdentity: 'g6c-sun' });
	const light = new DistantSunLightSource({ directionToLight: [1, 0, 0], sourceIrradiance: irradiance, angularRadius: { value: fixture.angularRadiusRadians, units: 'radians' } });
	const source = new DistantSunCelestialSource({ sourceId: fixture.sourceId, atmosphericSun: light, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const primaryCache = new PrimaryCelestialCache({ geometry, atmosphere, sources: [source] });
	const controller = new PrimaryCelestialGpuCacheController({ backend });

	try {
		const gpuCache = await controller.build({ primaryCache, sourceId: fixture.sourceId });
		const payload = primaryCache.payloads.get(fixture.sourceId);
		const coordinates = [];
		for (let positionIndex = 0; positionIndex < payload.domain.altitudeNodesMeters.length; positionIndex += 1) {
			for (let directionIndex = 0; directionIndex < payload.domain.uNodes.length; directionIndex += 1) {
				for (let wavelengthIndex = 0; wavelengthIndex < payload.channelCount; wavelengthIndex += 1) coordinates.push({ directionIndex, positionIndex, wavelengthIndex });
			}
		}
		const readback = await gpuCache.readSelectedScalars(backend, coordinates);
		let maximumError = 0;
		for (const sample of readback.samples) {
			const { directionIndex, positionIndex, wavelengthIndex } = sample.coordinates;
			const expected = payload.field.data[((positionIndex * payload.domain.uNodes.length + directionIndex) * payload.channelCount) + wavelengthIndex];
			maximumError = Math.max(maximumError, Math.abs(sample.value - expected));
		}
		const contribution = gpuCache.createShaderContribution({ descriptorFingerprint: gpuCache.generationIdentity, compatibilityTags: ['spherical-sun-stars-radial-v1'] });
		const lookupSource = contribution.functions.map((block) => block.code).join('\n');
		const activeBeforeFailure = controller.active;
		const allocateField = backend.allocateField.bind(backend);
		backend.allocateField = () => { throw new Error('injected allocation failure'); };
		controller._activeIdentity = 'force-staging-failure';
		let failurePreserved = false;
		try {
			await controller.build({ primaryCache, sourceId: fixture.sourceId });
		} catch (error) {
			failurePreserved = /injected allocation failure/u.test(String(error.message)) && controller.active === activeBeforeFailure;
		} finally {
			backend.allocateField = allocateField;
		}
		return {
			webglVersion: context.getParameter(context.VERSION),
			capabilities: backend.capabilities,
			resource: { format: gpuCache._artifact.result.storage.format, width: gpuCache._artifact.result.storage.width, height: gpuCache._artifact.result.storage.height, layers: gpuCache._artifact.result.storage.layers, bindingValueKey: gpuCache.getRuntimeBindings().bindings[0].valueKey },
			maximumError,
			readbackCount: readback.samples.length,
			cacheRenderPassCount: gpuCache._artifact.diagnostics.passes.length,
			cacheRenderSubmissionCount: payload.channelCount,
			shaderLookupUsesExplicitStencil: lookupSource.includes('CelestialCacheBilinearStencil') && lookupSource.includes('texelFetch'),
			failurePreserved,
		};
	} finally {
		controller.dispose();
		backend.dispose();
		renderer.dispose();
	}
}
