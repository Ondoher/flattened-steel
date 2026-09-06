import * as THREE from 'three';

import { CanonicalAtmosphere } from '../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import { PrimaryCelestialCache } from '../candidate/src/algorithm32/caches/celestial/PrimaryCelestialCache.js';
import { PrimaryCelestialGpuCacheController } from '../candidate/src/algorithm32/caches/celestial/PrimaryCelestialGpuCacheController.js';
import { DistantSunCelestialSource } from '../candidate/src/algorithm32/caches/celestial/DistantSunCelestialSource.js';
import { CelestialSpectralComposer } from '../candidate/src/algorithm32/composition/CelestialSpectralComposer.js';
import { CANONICAL_ATMOSPHERE_CONSTANTS } from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import { SphericalEarthGeometry } from '../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
import { ShaderBuilder } from '../candidate/src/algorithm32/implementation/ShaderBuilder.js';
import { DistantSunLightSource } from '../candidate/src/algorithm32/light-sources/DistantSunLightSource.js';
import { BrunetonColorDisplayModel } from '../candidate/src/algorithm32/color/BrunetonColorDisplayModel.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import { SPECTRAL_QUANTITIES, SPECTRAL_UNITS, createSpectralPacket } from '../candidate/src/algorithm32/quantities/index.js';
import { Algorithm32ShaderAssembler } from '../candidate/src/algorithm32/shader/Algorithm32ShaderAssembler.js';
import { createShaderContribution, createShaderSourceBlock } from '../candidate/src/algorithm32/shader/shaderContribution.js';
import { ThreeCacheBackend } from '../candidate/src/algorithm32/three/ThreeCacheBackend.js';

const VERTEX_SHADER = `in vec3 position;
in vec2 uv;
out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`;

function descriptor() {
	const section = (id) => ({ fingerprint: `g7-${id}`, compatibilityTags: [] });
	return {
		runtime: section('runtime'), geometry: section('geometry'), atmosphere: section('atmosphere'),
		lightSource: section('light-source'), cache: section('cache'), transport: section('transport'), color: section('color'),
	};
}

function fixtureTransportContribution(activeDescriptor) {
	return createShaderContribution({
		id: 'g7-fixture-base-transport', owner: 'transport', descriptorFingerprint: activeDescriptor.transport.fingerprint,
		provides: ['transport.evaluatePathRadiance'], requires: ['runtime.initialState'],
		functions: [createShaderSourceBlock('g7-fixture-base-transport-helper', 'evaluateTransport', 0, `void evaluateFixtureBaseTransport(inout ShaderState state) {
	state.pathRadiance = zeroSpectral();
	state.preDisplayRadiance = zeroSpectral();
	state.transmittance = oneSpectral();
}`)],
		mainHooks: [createShaderSourceBlock('g7-fixture-base-transport-main', 'evaluateTransport', 0, 'evaluateFixtureBaseTransport(state);')],
	});
}

/**
 * Provide an explicitly limited, display-oriented single-scattering sky
 * context for visual inspection. This is not the normal cumulative-cache
 * transport path: that runtime installation remains a separate pre-G9 task.
 */
function atmospherePreviewTransportContribution(activeDescriptor) {
	return createShaderContribution({
		id: 'g7-atmosphere-preview-transport', owner: 'transport', descriptorFingerprint: activeDescriptor.transport.fingerprint,
		provides: ['transport.evaluatePathRadiance'], requires: ['runtime.initialState', 'atmosphere.sampleMedium', 'geometry.resolveAtmosphereCoordinate', 'light.directionToAtmosphericSource'],
		functions: [createShaderSourceBlock('g7-atmosphere-preview-transport-helper', 'evaluateTransport', 0, `void evaluateAtmospherePreviewTransport(inout ShaderState state) {
	state.pathRadiance = zeroSpectral();
	state.preDisplayRadiance = zeroSpectral();
	state.transmittance = oneSpectral();
	MediumSample localMedium = sampleAtmosphere(resolveAtmosphereCoordinate(state.ray, 0.0));
	vec3 sourceDirection = normalize(directionToAtmosphericSource(state.ray.originMeters));
	float sourceForward = pow(max(dot(state.ray.direction, sourceDirection), 0.0), 8.0);
	float altitudeFactor = clamp(0.32 + 0.68 * dot(normalize(state.ray.originMeters), state.ray.direction), 0.08, 1.0);
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		float wavelengthMicrometers = ATMOSPHERE_WAVELENGTH_MICROMETERS[channelIndex];
		float rayleighTint = pow(0.55 / wavelengthMicrometers, 4.0);
		float density = localMedium.rayleighScattering.c[channelIndex] / max(ATMOSPHERE_RAYLEIGH_COEFFICIENT_SCALE * pow(wavelengthMicrometers, -4.0), 1.0e-20);
		state.pathRadiance.c[channelIndex] = 0.01 * rayleighTint * density * altitudeFactor * (0.45 + 0.55 * sourceForward);
		state.preDisplayRadiance.c[channelIndex] = state.pathRadiance.c[channelIndex];
	}
}`)],
		mainHooks: [createShaderSourceBlock('g7-atmosphere-preview-transport-main', 'evaluateTransport', 0, 'evaluateAtmospherePreviewTransport(state);')],
	});
}

function diagnosticContribution(activeDescriptor) {
	return createShaderContribution({
		id: 'g7-celestial-radiance-readback', owner: 'color', descriptorFingerprint: activeDescriptor.color.fingerprint,
		provides: ['g7.celestialReadback'], requires: ['composition.composeSpectralRadiance'],
		mainHooks: [createShaderSourceBlock('g7-celestial-radiance-readback-main', 'diagnosticOutput', 0, `outColor = vec4(
		state.celestialRadiance.c[0] / (1.0e-16 + state.celestialRadiance.c[0]),
		resolveCelestialCacheStencil(state.ray.originMeters, directionToAtmosphericSource(state.ray.originMeters)).valid ? 1.0 : 0.0,
		0.5 + 0.5 * dot(state.ray.direction, normalize(directionToAtmosphericSource(state.ray.originMeters))), 1.0
);`)],
	});
}

function makeTexture(THREERef, width, height, data, format = THREERef.RedFormat) {
	const texture = new THREERef.DataTexture(data, width, height, format);
	texture.magFilter = THREERef.NearestFilter;
	texture.minFilter = THREERef.NearestFilter;
	texture.needsUpdate = true;
	return texture;
}

function renderReadback({ renderer, material, target, scene, camera }) {
	renderer.setRenderTarget(target);
	renderer.render(scene, camera);
	const values = new Uint8Array(target.width * target.height * 4);
	renderer.readRenderTargetPixels(target, 0, 0, target.width, target.height, values);
	return values;
}

function renderPng({ renderer, scene, camera, canvas }) {
	renderer.setRenderTarget(null);
	renderer.render(scene, camera);
	return canvas.toDataURL('image/png');
}

function coverageSummary(values) {
	const red = [];
	for (let index = 0; index < values.length; index += 4) red.push(values[index]);
	const max = Math.max(...red);
	const nonzero = red.filter((value) => value > 1e-6).length;
	const partial = red.filter((value) => value > 1e-6 && value < max * 0.99).length;
	return { max, nonzero, partial };
}

function differenceSummary(values, reference) {
	let changed = 0;
	let maximum = 0;
	for (let index = 0; index < values.length; index += 4) {
		const delta = Math.max(Math.abs(values[index] - reference[index]), Math.abs(values[index + 1] - reference[index + 1]), Math.abs(values[index + 2] - reference[index + 2]));
		if (delta > 0) changed += 1;
		maximum = Math.max(maximum, delta);
	}
	return { changed, maximum };
}

function colorSummary(values) {
	const total = [0, 0, 0];
	for (let index = 0; index < values.length; index += 4) {
		total[0] += values[index]; total[1] += values[index + 1]; total[2] += values[index + 2];
	}
	return total.map((value) => value / (values.length / 4));
}

function compileShader(context, type, source) {
	const shader = context.createShader(type);
	context.shaderSource(shader, source);
	context.compileShader(shader);
	const result = { compiled: context.getShaderParameter(shader, context.COMPILE_STATUS), log: context.getShaderInfoLog(shader) };
	context.deleteShader(shader);
	return result;
}

/** Execute G7 against the accepted cache using one assembled live pixel shader. */
export async function runG7BrowserProof({ outputMode = 'diagnostic' } = {}) {
	if (!['diagnostic', 'atmosphere-preview'].includes(outputMode)) throw new TypeError(`Unsupported G7 output mode: ${outputMode}`);
	const fixture = await fetch('/fixtures/g4-cpu-sun-disk-transport-v1.json').then((response) => response.json());
	const width = 256;
	const height = 256;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
	if (!context) throw new Error('WebGL2 is unavailable.');
	const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: false });
	const backend = new ThreeCacheBackend({ THREE, renderer });
	const geometry = new SphericalEarthGeometry({
		...fixture.geometry,
		observerHeight: { value: 1000, units: 'meters' },
	});
	const atmosphere = new CanonicalAtmosphere({ constants: CANONICAL_ATMOSPHERE_CONSTANTS, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const previewRadianceScale = outputMode === 'atmosphere-preview' ? 100000 : 1;
	const irradiance = createSpectralPacket({ basis: NATIVE_15_SPECTRAL_BASIS, quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY, units: SPECTRAL_UNITS.IRRADIANCE_DENSITY, values: fixture.sourceIrradianceValues.map((value) => value * previewRadianceScale), provenanceIdentity: `g7-sun:${outputMode}:${previewRadianceScale}` });
	const light = new DistantSunLightSource({ directionToLight: outputMode === 'atmosphere-preview' ? [0, 0, 1] : [0, -1, 0], sourceIrradiance: irradiance, angularRadius: { value: 0.42, units: 'radians' } });
	const source = new DistantSunCelestialSource({ sourceId: fixture.sourceId, atmosphericSun: light, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const primaryCache = new PrimaryCelestialCache({ geometry, atmosphere, sources: [source] });
	const controller = new PrimaryCelestialGpuCacheController({ backend });
	const scene = new THREE.Scene();
	const camera = new THREE.Camera();
	const activeDescriptor = descriptor();
	const color = new BrunetonColorDisplayModel({ spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	try {
		const gpuCache = await controller.build({ primaryCache, sourceId: fixture.sourceId });
		const centerCacheProbe = await gpuCache.readSelectedScalars(backend, [{ directionIndex: 1, positionIndex: 4, wavelengthIndex: 0 }]);
		const runtimeBuilder = new ShaderBuilder({ model: { spectral: { basis: NATIVE_15_SPECTRAL_BASIS } } });
		const assembler = new Algorithm32ShaderAssembler();
		const assembly = assembler.assemble({
			descriptor: activeDescriptor,
			contributions: [
				runtimeBuilder._createRuntimeShaderContribution(activeDescriptor),
				geometry.createShaderContribution({ descriptor: activeDescriptor }),
				...(outputMode === 'atmosphere-preview' ? [atmosphere.createShaderContribution({ descriptor: activeDescriptor })] : []),
				light.createShaderContribution({ descriptor: activeDescriptor }),
				gpuCache.createShaderContribution({ descriptorFingerprint: activeDescriptor.cache.fingerprint }),
				outputMode === 'diagnostic' ? fixtureTransportContribution(activeDescriptor) : atmospherePreviewTransportContribution(activeDescriptor),
				gpuCache.createLiveShaderContribution({ descriptorFingerprint: activeDescriptor.cache.fingerprint }),
				new CelestialSpectralComposer().createShaderContribution({ descriptor: activeDescriptor }),
				color.createShaderContribution({ descriptor: activeDescriptor }),
				...(outputMode === 'diagnostic' ? [diagnosticContribution(activeDescriptor)] : []),
			],
			mainRequiredSymbols: ['runtime.initialState', 'transport.evaluatePathRadiance', 'celestial.evaluateRadiance', 'composition.composeSpectralRadiance', 'color.composeSceneColor', 'color.encodeOutput'],
		});
		const directFragmentCompile = compileShader(context, context.FRAGMENT_SHADER, assembly.fragmentShaderSource);
		const directVertexCompile = compileShader(context, context.VERTEX_SHADER, `#version 300 es
in vec3 position;
in vec2 uv;
out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`);
		const sceneColor = makeTexture(THREE, width, height, new Uint8Array(width * height * 4), THREE.RGBAFormat);
		const depth = makeTexture(THREE, width, height, new Uint8Array(width * height));
		const clearHits = makeTexture(THREE, width, height, new Uint8Array(width * height));
		const blockedHits = makeTexture(THREE, width, height, new Uint8Array(width * height).fill(255));
		const uniforms = {
			uSceneColorTexture: { value: sceneColor }, uSceneDepthTexture: { value: depth }, uSceneHitTexture: { value: clearHits },
			uViewportSizePixels: { value: new THREE.Vector2(width, height) },
			uInverseProjectionMatrix: { value: new THREE.Matrix4() }, uInverseViewMatrix: { value: outputMode === 'atmosphere-preview' ? new THREE.Matrix4().makeRotationX(-Math.PI / 2) : new THREE.Matrix4() },
			uCameraWorldPositionMeters: { value: new THREE.Vector3(0, 0, 6361000) },
			uCameraGroundRelativePositionMeters: { value: new THREE.Vector3(0, 0, 1000) },
			uSceneTerminationMeters: { value: 0 }, uSceneDepthMaxMeters: { value: 6420000 },
			uDistantSunDirection: { value: outputMode === 'atmosphere-preview' ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, -1, 0) },
			uPrimaryCelestialAngularRadiusRadians: { value: gpuCache.angularRadiusRadians },
		};
		const primaryCelestialUniform = { value: null };
		backend.installRuntimeBindings({ bindings: gpuCache.getRuntimeBindings(), uniforms: { 'cache.primaryCelestialRadiance': primaryCelestialUniform } });
		uniforms.uPrimaryCelestialRadianceCache = primaryCelestialUniform;
		const material = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERTEX_SHADER, fragmentShader: assembly.fragmentShaderSource.replace(/^#version 300 es\r?\n/u, ''), uniforms, depthTest: false, depthWrite: false });
		const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
		scene.add(quad);
		renderer.compile(scene, camera);
		const shaderDiagnostics = renderer.info.programs.map((program) => ({
			runnable: program.diagnostics?.runnable,
			programLog: program.diagnostics?.programLog,
			fragmentLog: program.diagnostics?.fragmentShader?.log,
		}));
		const target = new THREE.WebGLRenderTarget(width, height, { type: THREE.UnsignedByteType, format: THREE.RGBAFormat, depthBuffer: false });
		const clearValues = renderReadback({ renderer, material, target, scene, camera });
		const clear = coverageSummary(clearValues);
		const clearColor = colorSummary(clearValues);
		const clearPngDataUrl = renderPng({ renderer, scene, camera, canvas });
		const centerOffset = ((Math.floor(height / 2) * width) + Math.floor(width / 2)) * 4;
		const centerStencilValid = clearValues[centerOffset + 1] / 255;
		const centerAlignment = clearValues[centerOffset + 2] / 255;
		uniforms.uPrimaryCelestialAngularRadiusRadians.value = 0.09;
		const partialValues = renderReadback({ renderer, material, target, scene, camera });
		const partial = coverageSummary(partialValues);
		const partialPngDataUrl = renderPng({ renderer, scene, camera, canvas });
		uniforms.uPrimaryCelestialAngularRadiusRadians.value = gpuCache.angularRadiusRadians;
		uniforms.uSceneHitTexture.value = blockedHits;
		const blockedValues = renderReadback({ renderer, material, target, scene, camera });
		const blocked = coverageSummary(blockedValues);
		const sunOverlay = differenceSummary(clearValues, blockedValues);
		const blockedColor = colorSummary(blockedValues);
		const blockedPngDataUrl = renderPng({ renderer, scene, camera, canvas });
		uniforms.uSceneHitTexture.value = clearHits;
		uniforms.uCameraWorldPositionMeters.value.set(0, 0, 6360000);
		uniforms.uCameraGroundRelativePositionMeters.value.set(0, 0, 0);
		const horizon = coverageSummary(renderReadback({ renderer, material, target, scene, camera }));
		const horizonPngDataUrl = renderPng({ renderer, scene, camera, canvas });
		uniforms.uCameraWorldPositionMeters.value.set(0, 0, 6500000);
		const outOfDomain = coverageSummary(renderReadback({ renderer, material, target, scene, camera }));
		const outOfDomainPngDataUrl = renderPng({ renderer, scene, camera, canvas });
		const sourceCode = assembly.fragmentShaderSource;
		return {
			webglVersion: context.getParameter(context.VERSION), outputMode, previewRadianceScale, clear, partial, blocked, horizon, outOfDomain, sunOverlay, clearColor, blockedColor, centerAlignment, centerStencilValid, centerCacheProbe: centerCacheProbe.samples[0].value,
			captures: { clearPngDataUrl, partialPngDataUrl, blockedPngDataUrl, horizonPngDataUrl, outOfDomainPngDataUrl },
			assembledSlots: ['samplePrimaryCelestialRadiance', 'evaluatePrimaryCelestialRadiance', 'composeSpectralRadiance'].every((name) => sourceCode.includes(name)),
			usesRuntimeMatchedVisibility: sourceCode.includes('uSceneHitTexture') && sourceCode.includes('reconstructViewRay(sampleUv)'),
			usesDistinctCelestialBinding: sourceCode.includes('uPrimaryCelestialRadianceCache'),
			shaderDiagnostics,
			directFragmentCompile, directVertexCompile,
			primaryLookupDefinitionCount: (sourceCode.match(/SpectralValue samplePrimaryCelestialRadiance\(/gu) ?? []).length,
			primaryLookupAssemblyLines: sourceCode.split('\n').slice(390, 455),
		};
	} finally {
		controller.dispose();
		backend.dispose();
		renderer.dispose();
	}
}
