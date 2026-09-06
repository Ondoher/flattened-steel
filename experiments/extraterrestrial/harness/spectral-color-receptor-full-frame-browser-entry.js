import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';

import { Algorithm32 } from '../candidate/src/algorithm32/Algorithm32.js';
import { CanonicalAtmosphere } from '../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import { CelestialRuntimeParticipant } from '../candidate/src/algorithm32/caches/celestial/CelestialRuntimeParticipant.js';
import { DistantSunCelestialSource } from '../candidate/src/algorithm32/caches/celestial/DistantSunCelestialSource.js';
import { BrunetonColorDisplayModel } from '../candidate/src/algorithm32/color/BrunetonColorDisplayModel.js';
import { BrunetonColorDisplayModel as SealedBrunetonColorDisplayModel } from '../baseline/src/algorithm32/color/BrunetonColorDisplayModel.js';
import { CANONICAL_ATMOSPHERE_CONSTANTS } from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import { SphericalEarthGeometry } from '../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
import { DistantSunLightSource } from '../candidate/src/algorithm32/light-sources/DistantSunLightSource.js';
import { DEFAULT_NATIVE_PRODUCTION_PROFILE, NATIVE_15_SPECTRAL_BASIS, NATIVE_SOURCE_IRRADIANCE_DENSITY } from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import { createShaderContribution, createShaderSourceBlock, createShaderTextureDescriptor, createShaderUniformDescriptor } from '../candidate/src/algorithm32/shader/shaderContribution.js';
import { ThreeCacheBackend } from '../candidate/src/algorithm32/three/ThreeCacheBackend.js';

const distance = (value) => ({ value, units: 'meters' });

class FullFrameSpectralReadbackColor extends BrunetonColorDisplayModel {
	createShaderContribution(request) {
		return [super.createShaderContribution(request), createShaderContribution({
			id: 'spectral-color-receptor-full-frame-readback', owner: 'color',
			descriptorFingerprint: request.descriptor.color.fingerprint,
			compatibilityTags: request.descriptor.color.compatibilityTags,
			provides: ['color.receptorFullFrameReadback'], requires: ['composition.composeSpectralRadiance', 'color.encodeOutput'],
			uniforms: [createShaderUniformDescriptor('uSpectralReadbackGroup', 'int', 'spectralReadback.group', 0)],
			mainHooks: [createShaderSourceBlock('receptor-full-frame-spectral-output', 'diagnosticOutput', 100, `
if (uSpectralReadbackGroup == 0) outColor = vec4(state.preDisplayRadiance.c[0], state.preDisplayRadiance.c[1], state.preDisplayRadiance.c[2], state.preDisplayRadiance.c[3]);
else if (uSpectralReadbackGroup == 1) outColor = vec4(state.preDisplayRadiance.c[4], state.preDisplayRadiance.c[5], state.preDisplayRadiance.c[6], state.preDisplayRadiance.c[7]);
else if (uSpectralReadbackGroup == 2) outColor = vec4(state.preDisplayRadiance.c[8], state.preDisplayRadiance.c[9], state.preDisplayRadiance.c[10], state.preDisplayRadiance.c[11]);
else if (uSpectralReadbackGroup == 3) outColor = vec4(state.preDisplayRadiance.c[12], state.preDisplayRadiance.c[13], state.preDisplayRadiance.c[14], 0.0);
else outColor = vec4(spectralRadianceToLinearSrgb(state.preDisplayRadiance), 1.0);
`)],
		})];
	}
}

class CorrectedBrunetonPresentationColor extends SealedBrunetonColorDisplayModel {
	_displayComposeBlock() {
		return `vec3 spectralRadianceToLinearSrgb(SpectralValue radiance) {
	vec3 linearSrgb = vec3(0.0);
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		linearSrgb.r += radiance.c[channelIndex] * DISPLAY_LINEAR_SRGB_R_BY_CHANNEL[channelIndex];
		linearSrgb.g += radiance.c[channelIndex] * DISPLAY_LINEAR_SRGB_G_BY_CHANNEL[channelIndex];
		linearSrgb.b += radiance.c[channelIndex] * DISPLAY_LINEAR_SRGB_B_BY_CHANNEL[channelIndex];
	}
	return linearSrgb;
}

vec3 spectralTransmittanceToRgbBands(SpectralValue transmittance) {
	float red = 0.0; for (int channelIndex = 8; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) red += transmittance.c[channelIndex];
	float green = 0.0; for (int channelIndex = 4; channelIndex < 9; channelIndex += 1) green += transmittance.c[channelIndex];
	float blue = 0.0; for (int channelIndex = 0; channelIndex < 5; channelIndex += 1) blue += transmittance.c[channelIndex];
	return vec3(red / 7.0, green / 5.0, blue / 5.0);
}

bool shouldApplySceneTransmittance(ShaderState state) {
	return state.bounds.hasSceneEndpoint && state.bounds.endpointDistanceMeters <= state.bounds.endDistanceMeters + 0.001;
}

vec3 composeSceneLinearSrgb(ShaderState state) {
	vec3 pathLinearSrgb = spectralRadianceToLinearSrgb(state.preDisplayRadiance);
	vec3 sceneLinearSrgb = max(state.sceneLinearSrgb, vec3(0.0));
	vec3 sceneTransmittanceRgb = shouldApplySceneTransmittance(state) ? spectralTransmittanceToRgbBands(state.transmittance) : vec3(1.0);
	return pathLinearSrgb + sceneLinearSrgb * sceneTransmittanceRgb;
}`;
	}

	createShaderContribution(request) {
		return [super.createShaderContribution(request), createShaderContribution({
			id: 'corrected-bruneton-presentation-seams', owner: 'color',
			descriptorFingerprint: request.descriptor.color.fingerprint,
			compatibilityTags: request.descriptor.color.compatibilityTags,
			provides: ['color.correctedBrunetonPresentation'], requires: ['color.encodeOutput', 'composition.composeSpectralRadiance'],
			textures: [createShaderTextureDescriptor('uSkyIlluminanceTexture', 'sampler2D', 'color.skyIlluminanceTexture')],
			uniforms: [createShaderUniformDescriptor('uBrunetonPresentationMode', 'int', 'brunetonPresentation.mode', 0)],
			mainHooks: [createShaderSourceBlock('corrected-bruneton-demo-output', 'diagnosticOutput', 100, `
if (uBrunetonPresentationMode == 1) {
	vec3 demoLinear = max(composeSceneLinearSrgb(state), vec3(0.0));
	vec3 demoMapped = vec3(1.0) - exp(-demoLinear * 0.0001);
	outColor = vec4(pow(clamp(demoMapped, vec3(0.0), vec3(1.0)), vec3(1.0 / 2.2)), 1.0);
}`)],
		})];
	}
}

function solarDirectionModel(timeIso, location) {
	const latitude = location.latitudeDegrees * Math.PI / 180;
	const time = new Date(timeIso);
	const day = Math.floor((Date.UTC(time.getUTCFullYear(), time.getUTCMonth(), time.getUTCDate()) - Date.UTC(time.getUTCFullYear(), 0, 1)) / 86400000) + 1;
	const hours = time.getUTCHours() + time.getUTCMinutes() / 60 + time.getUTCSeconds() / 3600 + time.getUTCMilliseconds() / 3600000;
	const gamma = 2 * Math.PI / 366 * (day - 1 + (hours - 12) / 24);
	const declination = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
	const eot = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
	const solarMinutes = ((hours * 60 + eot + 4 * location.longitudeDegrees) % 1440 + 1440) % 1440;
	const hourAngle = (solarMinutes / 4 - 180) * Math.PI / 180;
	return new THREE.Vector3(-Math.cos(declination) * Math.sin(hourAngle), Math.sin(declination) * Math.cos(latitude) - Math.cos(declination) * Math.sin(latitude) * Math.cos(hourAngle), Math.sin(latitude) * Math.sin(declination) + Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle)).normalize();
}

function modelToScene(direction) { return new THREE.Vector3(direction.x, direction.z, -direction.y).normalize(); }
function aim(camera, directionModel, bindings) {
	const direction = modelToScene(directionModel);
	camera.position.set(0, 0, 0);
	camera.up.set(Math.abs(direction.y) > 0.95 ? 1 : 0, Math.abs(direction.y) > 0.95 ? 0 : 1, 0);
	camera.lookAt(direction); camera.updateMatrixWorld(true); camera.updateProjectionMatrix();
	bindings['geometry.inverseProjectionMatrix'].copy(camera.projectionMatrixInverse);
	bindings['geometry.inverseViewMatrix'].copy(camera.matrixWorld);
}
function bytesToBase64(bytes) { let binary = ''; for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, Math.min(bytes.length, offset + 0x8000))); return btoa(binary); }

function createContext(viewport) {
	const canvas = document.createElement('canvas'); canvas.width = viewport.widthPixels; canvas.height = viewport.heightPixels;
	const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: false });
	if (!gl) throw new Error('Receptor full-frame context requires WebGL2.');
	const renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: false }); renderer.setSize(viewport.widthPixels, viewport.heightPixels, false);
	const composer = new EffectComposer(renderer); composer.setSize(viewport.widthPixels, viewport.heightPixels);
	const camera = new THREE.PerspectiveCamera(viewport.verticalFieldOfViewDegrees, viewport.widthPixels / viewport.heightPixels, 0.1, 10_000);
	const backend = new ThreeCacheBackend({ THREE, renderer });
	const target = new THREE.WebGLRenderTarget(viewport.widthPixels, viewport.heightPixels, { type: THREE.FloatType, format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false });
	return { renderer, composer, camera, backend, target, scene: new THREE.Scene() };
}
function disposeContext(context) { context.target.dispose(); context.composer.dispose(); context.backend.dispose(); context.renderer.dispose(); }

export async function runReceptorFullFrameContext(stage1Fixture, reviewFixture) {
	const normalBrunetonOutput = reviewFixture.outputMode === 'normal-bruneton-shader';
	const correctedBrunetonOutput = reviewFixture.outputMode === 'corrected-bruneton-presentations';
	const selected = reviewFixture.conditions.map((id) => { const condition = stage1Fixture.spherical.conditions.find((candidate) => candidate.id === id); if (!condition) throw new Error(`Unknown spherical condition: ${id}.`); return condition; });
	const context = createContext(reviewFixture.viewport); const profile = DEFAULT_NATIVE_PRODUCTION_PROFILE;
	const first = solarDirectionModel(selected[0].timeIso, stage1Fixture.spherical.location);
	const geometry = new SphericalEarthGeometry({ bottomRadius: profile.physical.geometry.bottomRadius, topRadius: profile.physical.geometry.topRadius, observerHeight: distance(stage1Fixture.spherical.location.observerHeightMeters), observerUpDirection: [0, 0, 1], sceneFrame: { kind: 'observer-local' }, directionToSource: first.toArray(), cacheAltitudeBinCount: 48, sourceTransmittanceIntervalCount: profile.numerical.sourcePathTransmittance.intervalCount });
	const atmosphere = new CanonicalAtmosphere({ constants: CANONICAL_ATMOSPHERE_CONSTANTS, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const light = new DistantSunLightSource({ directionToLight: first.toArray(), sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY, angularRadius: { value: stage1Fixture.spherical.sun.angularRadiusRadians, units: 'radians' } });
	const celestial = new CelestialRuntimeParticipant({ sources: [new DistantSunCelestialSource({ sourceId: stage1Fixture.spherical.sun.sourceId, atmosphericSun: light, spectralBasis: NATIVE_15_SPECTRAL_BASIS })], primarySourceId: stage1Fixture.spherical.sun.sourceId });
	const algorithm = new Algorithm32({ geometry, atmosphere, lightSource: light, celestial, color: correctedBrunetonOutput ? new CorrectedBrunetonPresentationColor() : normalBrunetonOutput ? new BrunetonColorDisplayModel() : new FullFrameSpectralReadbackColor(), spectral: NATIVE_15_SPECTRAL_BASIS, execution: { maximumScatteringOrder: stage1Fixture.execution.maximumScatteringOrder } });
	const radius = profile.physical.geometry.bottomRadius.value; const height = stage1Fixture.spherical.location.observerHeightMeters;
	const bindings = { 'geometry.inverseProjectionMatrix': new THREE.Matrix4(), 'geometry.inverseViewMatrix': new THREE.Matrix4(), 'geometry.cameraWorldPosition': new THREE.Vector3(0, 0, radius + height), 'geometry.cameraGroundRelativePosition': new THREE.Vector3(0, 0, height), 'geometry.sceneTermination': distance(0), 'geometry.sceneDepthMax': profile.physical.geometry.topRadius, 'lightSource.direction': first, 'spectralReadback.group': 0, 'brunetonPresentation.mode': 0 };
	let handle; const started = performance.now();
	try {
		handle = await algorithm.setupShader({ THREE, composer: context.composer, scene: context.scene, camera: context.camera, viewportSize: { width: reviewFixture.viewport.widthPixels, height: reviewFixture.viewport.heightPixels, units: 'pixels' }, cacheBackend: context.backend, bindingValues: bindings });
		await handle.prepare(context.renderer); context.composer.render();
		const pass = context.composer.passes.find((candidate) => correctedBrunetonOutput ? candidate?.uniforms?.uBrunetonPresentationMode !== undefined : normalBrunetonOutput ? candidate?.uniforms?.uSkyIlluminanceTexture !== undefined : candidate?.uniforms?.uSpectralReadbackGroup !== undefined);
		if (!pass) throw new Error(correctedBrunetonOutput ? 'Corrected Bruneton presentation pass was not installed.' : normalBrunetonOutput ? 'Normal Bruneton shader pass was not installed.' : 'Spectral full-frame readback pass was not installed.');
		const frames = [];
		for (const condition of selected) {
			const sun = solarDirectionModel(condition.timeIso, stage1Fixture.spherical.location); bindings['lightSource.direction'].copy(sun); aim(context.camera, sun, bindings);
			if (correctedBrunetonOutput) {
				const presentations = {};
				for (const [id, mode] of [['sealed-project-adapter', 0], ['official-demo-default-luminance', 1]]) {
					bindings['brunetonPresentation.mode'] = mode; pass.uniforms.uBrunetonPresentationMode.value = mode; pass.renderToScreen = false; pass.render(context.renderer, context.target, context.composer.readBuffer);
					const pixels = new Float32Array(reviewFixture.viewport.widthPixels * reviewFixture.viewport.heightPixels * 4); context.renderer.readRenderTargetPixels(context.target, 0, 0, reviewFixture.viewport.widthPixels, reviewFixture.viewport.heightPixels, pixels);
					presentations[id] = bytesToBase64(new Uint8Array(pixels.buffer));
				}
				frames.push({ id: condition.id, series: condition.series, timeIso: condition.timeIso, sunDirectionModel: sun.toArray(), solarElevationRadians: Math.asin(sun.z), presentations });
			} else if (normalBrunetonOutput) {
				pass.renderToScreen = false; pass.render(context.renderer, context.target, context.composer.readBuffer);
				const pixels = new Float32Array(reviewFixture.viewport.widthPixels * reviewFixture.viewport.heightPixels * 4); context.renderer.readRenderTargetPixels(context.target, 0, 0, reviewFixture.viewport.widthPixels, reviewFixture.viewport.heightPixels, pixels);
				frames.push({ id: condition.id, series: condition.series, timeIso: condition.timeIso, sunDirectionModel: sun.toArray(), solarElevationRadians: Math.asin(sun.z), skyIlluminanceLux: handle.readSkyIlluminanceLux(context.renderer), displayRgbaFloat32Base64: bytesToBase64(new Uint8Array(pixels.buffer)) });
			} else {
				const groups = [];
				let signedLinearRgbaFloat32Base64 = null;
				const readbackGroupCount = reviewFixture.includeSignedLinearReadback === true ? 5 : 4;
				for (let group = 0; group < readbackGroupCount; group += 1) {
					bindings['spectralReadback.group'] = group;
					pass.uniforms.uSpectralReadbackGroup.value = group; pass.renderToScreen = false; pass.render(context.renderer, context.target, context.composer.readBuffer);
					const pixels = new Float32Array(reviewFixture.viewport.widthPixels * reviewFixture.viewport.heightPixels * 4);
					context.renderer.readRenderTargetPixels(context.target, 0, 0, reviewFixture.viewport.widthPixels, reviewFixture.viewport.heightPixels, pixels);
					const encoded = bytesToBase64(new Uint8Array(pixels.buffer));
					if (group < 4) groups.push(encoded); else signedLinearRgbaFloat32Base64 = encoded;
				}
				frames.push({ id: condition.id, series: condition.series, timeIso: condition.timeIso, sunDirectionModel: sun.toArray(), solarElevationRadians: Math.asin(sun.z), spectralGroupsFloat32Base64: groups, signedLinearRgbaFloat32Base64 });
			}
		}
		return { schemaId: correctedBrunetonOutput ? 'spectral-color-corrected-bruneton-presentations-output-v1' : normalBrunetonOutput ? 'spectral-color-normal-bruneton-shader-output-v1' : 'spectral-color-receptor-full-frame-readback-v1', viewport: reviewFixture.viewport, atmosphereSetupCount: 1, sourceHash: NATIVE_SOURCE_IRRADIANCE_DENSITY.contentHash, physicalProfileHash: profile.physical.contentHash, shaderSourceHash: handle._buildResult.assembly.sourceHash, frames, elapsedMilliseconds: performance.now() - started };
	} finally { handle?.dispose(); algorithm.dispose(); disposeContext(context); }
}
