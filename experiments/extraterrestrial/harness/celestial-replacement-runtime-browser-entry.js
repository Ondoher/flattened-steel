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

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function trackingBackend(backend) {
	const fields = [];
	let failNextAllocation = false;
	return {
		id: backend.id,
		capabilities: backend.capabilities,
		allocateField(spec) {
			if (failNextAllocation) {
				failNextAllocation = false;
				throw new Error('Injected celestial replacement allocation failure.');
			}
			const field = backend.allocateField(spec);
			const record = { descriptorId: field.descriptor.id, disposed: false };
			const dispose = field.dispose.bind(field);
			field.dispose = () => {
				if (!record.disposed) record.disposed = true;
				return dispose();
			};
			fields.push(record);
			return field;
		},
		compile: (shader) => backend.compile(shader),
		submitLayer: (request) => backend.submitLayer(request),
		createRuntimeBinding: (field, valueKey) => backend.createRuntimeBinding(field, valueKey),
		installRuntimeBindings: (request) => backend.installRuntimeBindings(request),
		readSelectedScalars: (request) => backend.readSelectedScalars(request),
		failNextAllocation() { failNextAllocation = true; },
		summary() {
			const primary = fields.filter((field) => field.descriptorId.startsWith('primary-celestial-'));
			return {
				primaryAllocated: primary.length,
				primaryDisposed: primary.filter((field) => field.disposed).length,
				primaryLive: primary.filter((field) => !field.disposed).length,
			};
		},
	};
}

function makeIrradiance(fixture) {
	const visualIrradianceScale = 100000000;
	const neutralDaylight = fixture.sourceIrradianceValues.reduce((sum, value) => sum + value, 0)
		/ fixture.sourceIrradianceValues.length;
	return createSpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
		units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
		values: fixture.sourceIrradianceValues.map(() => neutralDaylight * visualIrradianceScale),
		provenanceIdentity: 'celestial-replacement-runtime-neutral-daylight-v1',
	});
}

function makeCelestial({ fixture, irradiance, angularRadiusRadians }) {
	const sourceLight = new DistantSunLightSource({
		directionToLight: [0, 0, 1],
		sourceIrradiance: irradiance,
		angularRadius: { value: angularRadiusRadians, units: 'radians' },
	});
	return new CelestialRuntimeParticipant({
		sources: [new DistantSunCelestialSource({
			sourceId: fixture.sourceId,
			atmosphericSun: sourceLight,
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		})],
		primarySourceId: fixture.sourceId,
	});
}

function summarizePixels(context, width, height) {
	const values = new Uint8Array(width * height * 4);
	context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, values);
	let nonBlack = 0;
	for (let index = 0; index < values.length; index += 4) {
		if (values[index] || values[index + 1] || values[index + 2]) nonBlack += 1;
	}
	return { nonBlack };
}

/** Exercise normal shader-handle celestial replacement, failure preservation, and retirement. */
export async function runCelestialReplacementRuntimeBrowserProof() {
	const fixture = await fetch('/fixtures/g4-cpu-sun-disk-transport-v1.json').then((response) => response.json());
	const width = 160;
	const height = 160;
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
	const rawBackend = new ThreeCacheBackend({ THREE, renderer });
	const backend = trackingBackend(rawBackend);
	const geometry = new SphericalEarthGeometry({
		...fixture.geometry,
		observerHeight: { value: 1000, units: 'meters' },
		directionToSource: [0, 0, 1],
		cacheAltitudeBinCount: 48,
	});
	const atmosphere = new CanonicalAtmosphere({
		constants: CANONICAL_ATMOSPHERE_CONSTANTS,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const irradiance = makeIrradiance(fixture);
	const atmosphericLight = new DistantSunLightSource({
		directionToLight: [0, 0, 1],
		sourceIrradiance: irradiance,
		angularRadius: { value: 0.12, units: 'radians' },
	});
	const makeConfig = (angularRadiusRadians) => ({
		geometry,
		atmosphere,
		lightSource: atmosphericLight,
		celestial: makeCelestial({ fixture, irradiance, angularRadiusRadians }),
		color: new BrunetonColorDisplayModel({ spectralBasis: NATIVE_15_SPECTRAL_BASIS }),
		spectral: NATIVE_15_SPECTRAL_BASIS,
		execution: { maximumScatteringOrder: 1, pathIntervalCount: 8 },
	});
	const algorithm = new Algorithm32(makeConfig(0.12));
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
			THREE, composer, scene, camera,
			viewportSize: { width, height, units: 'pixels' },
			cacheBackend: backend,
			bindingValues,
		});
		await handle.prepare(renderer);
		composer.render();
		const firstBuild = handle._buildResult;
		const firstCache = firstBuild.celestialCache;
		const firstBinding = firstCache.getRuntimeBindings().bindings[0];
		const firstTexture = firstBuild.runtime.getUniformValue('uPrimaryCelestialRadianceCache');
		const firstProbe = await firstCache.readSelectedScalars(backend, [{ directionIndex: 0, positionIndex: 0, wavelengthIndex: 0 }]);

		const replacementSnapshot = await handle.setConfig(makeConfig(0.18));
		await handle.prepare(renderer);
		composer.render();
		const secondBuild = handle._buildResult;
		const secondCache = secondBuild.celestialCache;
		const secondBinding = secondCache.getRuntimeBindings().bindings[0];
		const secondTexture = secondBuild.runtime.getUniformValue('uPrimaryCelestialRadianceCache');
		const secondProbe = await secondCache.readSelectedScalars(backend, [{ directionIndex: 0, positionIndex: 0, wavelengthIndex: 0 }]);
		let retiredCacheRejected = false;
		try { firstCache.getRuntimeBindings(); } catch { retiredCacheRejected = true; }

		const committedPassCount = composer.passes.length;
		backend.failNextAllocation();
		let failure;
		try {
			await handle.setConfig(makeConfig(0.24));
		} catch (error) {
			failure = { name: error.name, message: error.message };
		}
		requireCondition(failure?.message === 'Injected celestial replacement allocation failure.', 'Injected replacement allocation failure must surface from the staged celestial build.');
		composer.render();
		const afterFailureBuild = handle._buildResult;
		const afterFailureTexture = afterFailureBuild.runtime.getUniformValue('uPrimaryCelestialRadianceCache');
		const beforeDispose = backend.summary();

		requireCondition(firstBuild !== secondBuild, 'Successful shader-handle replacement must publish a distinct build result.');
		requireCondition(firstCache !== secondCache && firstBinding !== secondBinding && firstTexture !== secondTexture, 'Successful replacement must publish distinct celestial cache, binding, and shader texture identities.');
		requireCondition(firstCache.angularRadiusRadians === 0.12 && secondCache.angularRadiusRadians === 0.18, 'Published celestial cache must carry the replacement source support.');
		requireCondition(firstProbe.samples[0].value !== secondProbe.samples[0].value, 'Replacement source radiance must reach the rebuilt celestial cache field.');
		requireCondition(retiredCacheRejected, 'The superseded celestial cache must be disposed after successful publication.');
		requireCondition(beforeDispose.primaryAllocated === 2 && beforeDispose.primaryDisposed === 1 && beforeDispose.primaryLive === 1, 'Successful publication must retain only the new primary celestial field.');
		requireCondition(afterFailureBuild === secondBuild && afterFailureBuild.celestialCache === secondCache && afterFailureTexture === secondTexture, 'Failed rebuild must preserve the active shader runtime and celestial binding.');
		requireCondition(algorithm.config.version === replacementSnapshot.version && composer.passes.length === committedPassCount, 'Failed rebuild must not publish config or disturb installed composer passes.');
		requireCondition(secondBuild.diagnostics.status === 'installed' && summarizePixels(context, width, height).nonBlack > 0, 'The preserved normal runtime remains renderable after the failed rebuild.');

		handle.dispose();
		let finalCacheRejected = false;
		try { secondCache.getRuntimeBindings(); } catch { finalCacheRejected = true; }
		const afterHandleDispose = backend.summary();
		requireCondition(finalCacheRejected, 'Shader-handle disposal must retire the final celestial cache.');
		requireCondition(afterHandleDispose.primaryAllocated === 2 && afterHandleDispose.primaryDisposed === 2 && afterHandleDispose.primaryLive === 0, 'Shader-handle disposal must release the final primary celestial field.');
		return {
			webglVersion: context.getParameter(context.VERSION),
			replacementSnapshotVersion: replacementSnapshot.version,
			firstProbe: firstProbe.samples[0].value,
			secondProbe: secondProbe.samples[0].value,
			failure,
			beforeDispose,
			afterHandleDispose,
			composerPassCountAfterDispose: composer.passes.length,
		};
	} finally {
		handle?.dispose();
		algorithm.dispose();
		composer.dispose();
		rawBackend.dispose();
		renderer.dispose();
	}
}
