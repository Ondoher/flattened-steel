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
import { runG7BrowserProof } from './g7-browser-entry.js';

async function createScenario(fixture) {
	const canvas = document.createElement('canvas');
	canvas.width = 16; canvas.height = 16;
	const context = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
	if (!context) throw new Error('WebGL2 is unavailable.');
	const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: false });
	const backend = new ThreeCacheBackend({ THREE, renderer });
	const geometry = new SphericalEarthGeometry(fixture.geometry);
	const atmosphere = new CanonicalAtmosphere({ constants: CANONICAL_ATMOSPHERE_CONSTANTS, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const irradiance = createSpectralPacket({ basis: NATIVE_15_SPECTRAL_BASIS, quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY, units: SPECTRAL_UNITS.IRRADIANCE_DENSITY, values: fixture.sourceIrradianceValues, provenanceIdentity: 'g8-sun' });
	const light = new DistantSunLightSource({ directionToLight: [1, 0, 0], sourceIrradiance: irradiance, angularRadius: { value: fixture.angularRadiusRadians, units: 'radians' } });
	const source = new DistantSunCelestialSource({ sourceId: fixture.sourceId, atmosphericSun: light, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const primaryCache = new PrimaryCelestialCache({ geometry, atmosphere, sources: [source] });
	return { context, renderer, backend, primaryCache, controller: new PrimaryCelestialGpuCacheController({ backend }) };
}

function disposeScenario(scenario) { scenario.controller.dispose(); scenario.backend.dispose(); scenario.renderer.dispose(); }

/** Execute the G8 qualification slice on a fresh, real browser WebGL2 backend. */
export async function runG8BrowserQualification() {
	const fixture = await fetch('/fixtures/g4-cpu-sun-disk-transport-v1.json').then((response) => response.json());
	const initial = await createScenario(fixture);
	try {
		const buildStarted = performance.now();
		const active = await initial.controller.build({ primaryCache: initial.primaryCache, sourceId: fixture.sourceId });
		const initialRenderBuildMilliseconds = performance.now() - buildStarted;
		const reuse = await initial.controller.build({ primaryCache: initial.primaryCache, sourceId: fixture.sourceId });
		const diagnostics = active._artifact.diagnostics;
		const selected = await active.readSelectedScalars(initial.backend, [{ directionIndex: 5, positionIndex: 6, wavelengthIndex: 7 }]);
		const payload = initial.primaryCache.payloads.get(fixture.sourceId);
		const expected = payload.field.data[((6 * payload.domain.uNodes.length + 5) * payload.channelCount) + 7];
		const exactNodeAbsoluteError = Math.abs(selected.samples[0].value - expected);
		const activeBeforeFailure = initial.controller.active;
		const allocateField = initial.backend.allocateField.bind(initial.backend);
		initial.backend.allocateField = () => { throw new Error('injected G8 allocation failure'); };
		initial.controller._activeIdentity = 'g8-force-staging-failure';
		let failurePreservesActiveGeneration = false;
		try { await initial.controller.build({ primaryCache: initial.primaryCache, sourceId: fixture.sourceId }); } catch (error) { failurePreservesActiveGeneration = /injected G8 allocation failure/u.test(String(error.message)) && initial.controller.active === activeBeforeFailure; } finally { initial.backend.allocateField = allocateField; }
		initial.controller.dispose(); initial.controller.dispose();
		let disposedCacheRejectsUse = false;
		try { active.getRuntimeBindings(); } catch { disposedCacheRejectsUse = true; }
		const rehydrated = await createScenario(fixture);
		let contextRehydrated = false;
		try {
			const rebuilt = await rehydrated.controller.build({ primaryCache: rehydrated.primaryCache, sourceId: fixture.sourceId });
			const probe = await rebuilt.readSelectedScalars(rehydrated.backend, [{ directionIndex: 5, positionIndex: 6, wavelengthIndex: 7 }]);
			contextRehydrated = Math.abs(probe.samples[0].value - selected.samples[0].value) <= 2e-5;
		} finally { disposeScenario(rehydrated); }
		const liveStarted = performance.now();
		const live = await runG7BrowserProof();
		const liveTwoFrameMilliseconds = performance.now() - liveStarted;
		return {
			webglVersion: initial.context.getParameter(initial.context.VERSION), capabilities: initial.backend.capabilities,
			initialRenderBuildMilliseconds, liveTwoFrameMilliseconds, exactReuse: reuse === active,
			exactNodeAbsoluteError, memory: diagnostics.memory, failurePreservesActiveGeneration, disposedCacheRejectsUse, contextRehydrated,
			live: { clear: live.clear, blocked: live.blocked, assembledSlots: live.assembledSlots, usesRuntimeMatchedVisibility: live.usesRuntimeMatchedVisibility },
		};
	} finally { disposeScenario(initial); }
}
