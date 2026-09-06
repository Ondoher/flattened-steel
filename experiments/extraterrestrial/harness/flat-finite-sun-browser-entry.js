import * as THREE from 'three';
import { CanonicalAtmosphere } from '../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import { FiniteLocalSunCelestialSource } from '../candidate/src/algorithm32/caches/celestial/FiniteLocalSunCelestialSource.js';
import { FlatFiniteSunPrimaryCache } from '../candidate/src/algorithm32/caches/celestial/FlatFiniteSunPrimaryCache.js';
import { FlatFiniteSunGpuCacheController } from '../candidate/src/algorithm32/caches/celestial/FlatFiniteSunGpuCacheController.js';
import { CANONICAL_ATMOSPHERE_CONSTANTS } from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import { FlatEarthGeometry } from '../candidate/src/algorithm32/geometries/FlatEarthGeometry.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import { SPECTRAL_QUANTITIES, SPECTRAL_UNITS, createSpectralPacket } from '../candidate/src/algorithm32/quantities/index.js';
import { ThreeCacheBackend } from '../candidate/src/algorithm32/three/ThreeCacheBackend.js';

const distance = (value) => ({ value, units: 'meters' });
const position = (coordinates) => ({ coordinates, units: 'meters' });

/** Execute the finite-local-Sun cache render in a real WebGL2 context. */
export async function runFlatFiniteSunBrowserProof() {
	const fixture = await fetch('/fixtures/flat-local-finite-sun-v1.json').then((response) => {
		if (!response.ok) throw new Error(`Could not load local-Sun fixture: ${response.status}.`);
		return response.json();
	});
	const canvas = document.createElement('canvas');
	canvas.width = 16; canvas.height = 16;
	const context = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
	if (!context) throw new Error('WebGL2 is unavailable.');
	const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: false });
	const backend = new ThreeCacheBackend({ THREE, renderer });
	const sourceConfig = fixture.source;
	const geometry = new FlatEarthGeometry({
		observerPosition: position([0, 0, 2]),
		sourcePosition: position([0, 0, sourceConfig.centerHeightMeters]),
		topAltitude: distance(fixture.geometry.topAltitudeMeters),
		cacheRadialMaximum: distance(fixture.geometry.cacheRadialMaximumMeters),
	});
	const atmosphere = new CanonicalAtmosphere({ constants: CANONICAL_ATMOSPHERE_CONSTANTS, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const radiance = createSpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS, quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
		units: SPECTRAL_UNITS.RADIANCE_DENSITY, values: sourceConfig.surfaceRadianceValues,
		provenanceIdentity: 'flat-finite-sun-browser-proof-v1',
	});
	const source = new FiniteLocalSunCelestialSource({ sourceId: sourceConfig.sourceId, surfaceRadiance: radiance, radius: distance(sourceConfig.radiusMeters), spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const primaryCache = new FlatFiniteSunPrimaryCache({ geometry, atmosphere, sources: [source] });
	const controller = new FlatFiniteSunGpuCacheController({ backend });
	try {
		const gpuCache = await controller.build({ primaryCache, sourceId: source.sourceId });
		const coordinates = radiance.values.map((_, wavelengthIndex) => ({ directionIndex: 0, positionIndex: 0, wavelengthIndex }));
		const readback = await backend.readSelectedScalars({ field: gpuCache._artifact.result, coordinates });
		const maximumError = Math.max(...readback.samples.map((sample, index) => Math.abs(sample.value - radiance.values[index])));
		const lookup = gpuCache.createShaderContribution({ descriptorFingerprint: gpuCache.generationIdentity }).functions.map((block) => block.code).join('\n');
		const live = gpuCache.createLiveShaderContribution({ descriptorFingerprint: gpuCache.generationIdentity });
		const liveSource = live.functions.map((block) => block.code).join('\n');
		const activeBeforeFailure = controller._active;
		const allocateField = backend.allocateField.bind(backend);
		backend.allocateField = () => { throw new Error('injected allocation failure'); };
		controller._activeIdentity = 'force-staging-failure';
		let failurePreserved = false;
		try { await controller.build({ primaryCache, sourceId: source.sourceId }); }
		catch (error) { failurePreserved = /injected allocation failure/u.test(String(error.message)) && controller._active === activeBeforeFailure; }
		finally { backend.allocateField = allocateField; }
		return {
			webglVersion: context.getParameter(context.VERSION), capabilities: backend.capabilities,
			resource: { ...gpuCache._artifact.result.storage, bindingValueKey: gpuCache.getRuntimeBindings().bindings[0].valueKey },
			readbackCount: readback.samples.length, maximumError,
			cacheRenderPassCount: gpuCache._artifact.diagnostics.passes.length,
			cacheRenderSubmissionCount: radiance.values.length,
			lookupUsesSingleTexel: lookup.includes('ivec3(0, 0, channelIndex)'),
			liveUsesFiniteBodyAndAtmosphere: liveSource.includes('flatFiniteSunRayEntryDistance') && liveSource.includes('finiteCelestialAtmosphereSegmentLength') && liveSource.includes('sampleAtmosphere'),
			liveCenterBinding: live.uniforms.find((uniform) => uniform.valueKey === 'geometry.flatFiniteSun.centerMeters')?.defaultValue,
			failurePreserved,
		};
	} finally {
		controller.dispose(); backend.dispose(); renderer.dispose();
	}
}
