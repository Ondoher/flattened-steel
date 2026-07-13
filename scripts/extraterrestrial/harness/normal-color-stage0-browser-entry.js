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
import {
	DEFAULT_NATIVE_PRODUCTION_PROFILE,
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import {
	createShaderContribution,
	createShaderSourceBlock,
	createShaderUniformDescriptor,
} from '../candidate/src/algorithm32/shader/shaderContribution.js';
import { ThreeCacheBackend } from '../candidate/src/algorithm32/three/ThreeCacheBackend.js';

const MODE = Object.freeze({ path: 1, celestial: 5, preDisplay: 9, ray: 13, state: 14 });
const PACKET_COUNT = 4;
const CHANNEL_COUNT = 15;

class Stage0ReadbackColor extends BrunetonColorDisplayModel {
	createShaderContribution(request) {
		return [super.createShaderContribution(request), createReadbackContribution(request.descriptor)];
	}
}

function createReadbackContribution(descriptor) {
	return createShaderContribution({
		id: 'normal-color-stage0-terminal-readback',
		owner: 'color',
		descriptorFingerprint: descriptor.color.fingerprint,
		compatibilityTags: descriptor.color.compatibilityTags,
		provides: ['color.normalStage0Readback'],
		requires: ['composition.composeSpectralRadiance', 'color.encodeOutput'],
		uniforms: [createShaderUniformDescriptor('uNormalStage0Mode', 'int', 'normalStage0.mode', 0)],
		functions: [createShaderSourceBlock('normal-stage0-packet', 'diagnosticOutput', 0, `vec4 normalStage0Packet(SpectralValue value, int packetIndex) {
	vec4 packet = vec4(0.0);
	int firstChannel = packetIndex * 4;
	for (int componentIndex = 0; componentIndex < 4; componentIndex += 1) {
		int channelIndex = firstChannel + componentIndex;
		if (channelIndex < SPECTRAL_CHANNEL_COUNT) packet[componentIndex] = value.c[channelIndex];
	}
	return packet;
}`)],
		mainHooks: [createShaderSourceBlock('normal-stage0-output', 'diagnosticOutput', 100, `if (uNormalStage0Mode >= 1 && uNormalStage0Mode < 5) {
	outColor = normalStage0Packet(state.pathRadiance, uNormalStage0Mode - 1);
} else if (uNormalStage0Mode >= 5 && uNormalStage0Mode < 9) {
	outColor = normalStage0Packet(state.celestialRadiance, uNormalStage0Mode - 5);
} else if (uNormalStage0Mode >= 9 && uNormalStage0Mode < 13) {
	outColor = normalStage0Packet(state.preDisplayRadiance, uNormalStage0Mode - 9);
} else if (uNormalStage0Mode == 13) {
	outColor = vec4(state.ray.direction, 1.0);
} else if (uNormalStage0Mode == 14) {
	outColor = vec4(state.sceneHitMask, state.bounds.valid ? 1.0 : 0.0, state.bounds.hasSceneEndpoint ? 1.0 : 0.0, state.bounds.hasGroundEndpoint ? 1.0 : 0.0);
}`)],
	});
}

function solarDirectionModel(timeIso, location) {
	const latitude = location.latitudeDegrees * Math.PI / 180;
	const longitude = location.longitudeDegrees;
	const time = new Date(timeIso);
	const yearStart = Date.UTC(time.getUTCFullYear(), 0, 1);
	const dateStart = Date.UTC(time.getUTCFullYear(), time.getUTCMonth(), time.getUTCDate());
	const day = Math.floor((dateStart - yearStart) / 86400000) + 1;
	const utcHours = time.getUTCHours() + time.getUTCMinutes() / 60
		+ time.getUTCSeconds() / 3600 + time.getUTCMilliseconds() / 3600000;
	const gamma = 2 * Math.PI / 366 * (day - 1 + (utcHours - 12) / 24);
	const declination = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
		- 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
		- 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
	const equationOfTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma)
		- 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
	const trueSolarMinutes = ((utcHours * 60 + equationOfTime + 4 * longitude) % 1440 + 1440) % 1440;
	const hourAngle = (trueSolarMinutes / 4 - 180) * Math.PI / 180;
	const up = Math.sin(latitude) * Math.sin(declination)
		+ Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle);
	const east = -Math.cos(declination) * Math.sin(hourAngle);
	const north = Math.sin(declination) * Math.cos(latitude)
		- Math.cos(declination) * Math.sin(latitude) * Math.cos(hourAngle);
	return new THREE.Vector3(east, north, up).normalize();
}

function modelToScene(direction) {
	return new THREE.Vector3(direction.x, direction.z, -direction.y).normalize();
}

function sceneToModel(direction) {
	return new THREE.Vector3(direction.x, -direction.z, direction.y).normalize();
}

function offsetDirection(center, tangent, angle) {
	return center.clone().multiplyScalar(Math.cos(angle)).add(tangent.clone().multiplyScalar(Math.sin(angle))).normalize();
}

function diskDirections(sunDirection, angularRadius, fraction) {
	const up = new THREE.Vector3(0, 0, 1);
	const zenithward = up.clone().addScaledVector(sunDirection, -up.dot(sunDirection)).normalize();
	const equalElevation = new THREE.Vector3().crossVectors(up, sunDirection).normalize();
	const angle = angularRadius * fraction;
	return [
		{ id: 'disk-center', role: 'disk', direction: sunDirection.clone() },
		{ id: 'limb-zenithward', role: 'disk-limb', direction: offsetDirection(sunDirection, zenithward, angle) },
		{ id: 'limb-horizonward', role: 'disk-limb', direction: offsetDirection(sunDirection, zenithward.clone().negate(), angle) },
		{ id: 'limb-equal-elevation-east', role: 'disk-limb', direction: offsetDirection(sunDirection, equalElevation, angle) },
		{ id: 'limb-equal-elevation-west', role: 'disk-limb', direction: offsetDirection(sunDirection, equalElevation.clone().negate(), angle) },
	];
}

function aimCamera(camera, sceneDirection, bindings) {
	const up = Math.abs(sceneDirection.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
	camera.position.set(0, 0, 0);
	camera.up.copy(up);
	camera.lookAt(sceneDirection);
	camera.updateMatrixWorld(true);
	camera.updateProjectionMatrix();
	bindings['geometry.inverseProjectionMatrix'].copy(camera.projectionMatrixInverse);
	bindings['geometry.inverseViewMatrix'].copy(camera.matrixWorld);
}

function renderPixel(renderer, pass, readBuffer, target, pixel, mode) {
	const previous = renderer.getRenderTarget();
	pass.uniforms.uNormalStage0Mode.value = mode;
	target.scissor.set(pixel, pixel, 1, 1);
	target.scissorTest = true;
	pass.renderToScreen = false;
	try {
		pass.render(renderer, target, readBuffer);
		const values = new Float32Array(4);
		renderer.readRenderTargetPixels(target, pixel, pixel, 1, 1, values);
		return Array.from(values);
	} finally {
		target.scissorTest = false;
		renderer.setRenderTarget(previous);
	}
}

function readSpectrum(renderer, pass, readBuffer, target, pixel, firstMode) {
	const values = [];
	for (let packet = 0; packet < PACKET_COUNT; packet += 1) {
		values.push(...renderPixel(renderer, pass, readBuffer, target, pixel, firstMode + packet));
	}
	return values.slice(0, CHANNEL_COUNT);
}

function readSample(renderer, pass, readBuffer, target, pixel, camera, bindings, sample) {
	const sceneDirection = modelToScene(sample.direction);
	aimCamera(camera, sceneDirection, bindings);
	const pathRadiance = readSpectrum(renderer, pass, readBuffer, target, pixel, MODE.path);
	const celestialRadiance = readSpectrum(renderer, pass, readBuffer, target, pixel, MODE.celestial);
	const preDisplayRadiance = readSpectrum(renderer, pass, readBuffer, target, pixel, MODE.preDisplay);
	const ray = renderPixel(renderer, pass, readBuffer, target, pixel, MODE.ray).slice(0, 3);
	const state = renderPixel(renderer, pass, readBuffer, target, pixel, MODE.state);
	return {
		id: sample.id,
		role: sample.role,
		directionModel: sample.direction.toArray(),
		readbackRayDirectionModel: ray,
		pathRadiance,
		celestialRadiance,
		preDisplayRadiance,
		shaderState: { sceneHitMask: state[0], pathValid: state[1], hasSceneEndpoint: state[2], hasGroundEndpoint: state[3] },
	};
}

export async function runNormalColorStage0BrowserPreflight(fixture) {
	const started = performance.now();
	const size = fixture.sampling.viewportPixels;
	const pixel = Math.floor(size / 2);
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: false });
	if (!context) throw new Error('Stage 0 requires WebGL2.');
	const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: false });
	renderer.setSize(size, size, false);
	const composer = new EffectComposer(renderer);
	composer.setSize(size, size);
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(fixture.sampling.verticalFieldOfViewDegrees, 1, 0.1, 10_000);
	const backend = new ThreeCacheBackend({ THREE, renderer });
	const firstDirection = solarDirectionModel(fixture.conditions[0].timeIso, fixture.location);
	const profile = DEFAULT_NATIVE_PRODUCTION_PROFILE;
	const geometry = new SphericalEarthGeometry({
		bottomRadius: profile.physical.geometry.bottomRadius,
		topRadius: profile.physical.geometry.topRadius,
		observerHeight: { value: fixture.location.observerHeightMeters, units: 'meters' },
		observerUpDirection: [0, 0, 1],
		sceneFrame: { kind: 'observer-local' },
		directionToSource: firstDirection.toArray(),
		cacheAltitudeBinCount: 48,
		sourceTransmittanceIntervalCount: profile.numerical.sourcePathTransmittance.intervalCount,
	});
	const atmosphere = new CanonicalAtmosphere({ constants: CANONICAL_ATMOSPHERE_CONSTANTS, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const lightSource = new DistantSunLightSource({
		directionToLight: firstDirection.toArray(),
		sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
		angularRadius: { value: fixture.sun.angularRadiusRadians, units: 'radians' },
	});
	const celestial = new CelestialRuntimeParticipant({
		sources: [new DistantSunCelestialSource({ sourceId: fixture.sun.sourceId, atmosphericSun: lightSource, spectralBasis: NATIVE_15_SPECTRAL_BASIS })],
		primarySourceId: fixture.sun.sourceId,
	});
	const algorithm = new Algorithm32({
		geometry,
		atmosphere,
		lightSource,
		celestial,
		color: new Stage0ReadbackColor(),
		spectral: NATIVE_15_SPECTRAL_BASIS,
		execution: { maximumScatteringOrder: fixture.execution.maximumScatteringOrder },
	});
	const bottomRadius = profile.physical.geometry.bottomRadius.value;
	const observerHeight = fixture.location.observerHeightMeters;
	const bindings = {
		'geometry.inverseProjectionMatrix': new THREE.Matrix4(),
		'geometry.inverseViewMatrix': new THREE.Matrix4(),
		'geometry.cameraWorldPosition': new THREE.Vector3(0, 0, bottomRadius + observerHeight),
		'geometry.cameraGroundRelativePosition': new THREE.Vector3(0, 0, observerHeight),
		'geometry.sceneTermination': { value: 0, units: 'meters' },
		'geometry.sceneDepthMax': profile.physical.geometry.topRadius,
		'lightSource.direction': firstDirection,
	};
	let handle;
	const target = new THREE.WebGLRenderTarget(size, size, { type: THREE.FloatType, format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false });
	try {
		handle = await algorithm.setupShader({
			THREE, composer, scene, camera,
			viewportSize: { width: size, height: size, units: 'pixels' },
			cacheBackend: backend,
			bindingValues: bindings,
		});
		await handle.prepare(renderer);
		composer.render();
		const pass = composer.passes.find((candidate) => candidate?.uniforms?.uNormalStage0Mode !== undefined);
		if (!pass) throw new Error('Stage 0 terminal readback pass was not installed.');
		const plan = geometry.createSkyIlluminanceProbePlan();
		const conditions = [];
		for (const condition of fixture.conditions) {
			const sunDirection = solarDirectionModel(condition.timeIso, fixture.location);
			bindings['lightSource.direction'].copy(sunDirection);
			const elevationRadians = Math.asin(sunDirection.z);
			const selected = condition.diskVisible
				? diskDirections(sunDirection, fixture.sun.angularRadiusRadians, fixture.sampling.limbRadiusFraction)
				: [{ id: 'geometric-sun-center', role: 'ground-blocked-disk', direction: sunDirection.clone() }];
			const samples = selected.map((sample) => readSample(renderer, pass, composer.readBuffer, target, pixel, camera, bindings, sample));
			const hemisphere = plan.samples.map((sample, index) => {
				const modelDirection = sceneToModel(new THREE.Vector3(...sample.localDirection));
				return {
					...readSample(renderer, pass, composer.readBuffer, target, pixel, camera, bindings, { id: `hemisphere-${String(index).padStart(2, '0')}`, role: 'upper-hemisphere', direction: modelDirection }),
					solidAngleSteradians: sample.solidAngleSteradians,
					projectedSolidAngleSteradians: sample.projectedSolidAngleSteradians,
				};
			});
			conditions.push({
				id: condition.id,
				timeIso: condition.timeIso,
				diskVisibleExpected: condition.diskVisible,
				sunDirectionModel: sunDirection.toArray(),
				solarElevationRadians: elevationRadians,
				geometryHorizonClassification: elevationRadians >= 0 ? 'above-geometric-horizon' : 'ground-blocked',
				samples,
				hemisphere,
			});
		}
		return {
			schemaId: 'normal-color-stage0-browser-readback-v1',
			elapsedMilliseconds: performance.now() - started,
			webglVersion: context.getParameter(context.VERSION),
			atmosphereSetupCount: 1,
			conditionCount: conditions.length,
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
			source: {
				irradianceQuantity: NATIVE_SOURCE_IRRADIANCE_DENSITY.quantity,
				irradianceUnits: NATIVE_SOURCE_IRRADIANCE_DENSITY.units,
				irradianceValues: Array.from(NATIVE_SOURCE_IRRADIANCE_DENSITY.values),
				irradianceHash: NATIVE_SOURCE_IRRADIANCE_DENSITY.contentHash,
			},
			radianceQuantity: 'spectral-radiance-density',
			radianceUnits: 'W m^-2 sr^-1 nm^-1',
			profileHash: profile.contentHash,
			shaderSourceHash: handle._buildResult.assembly.sourceHash,
			quadrature: { id: plan.id, fingerprint: plan.fingerprint, sampleCount: plan.samples.length },
			conditions,
			diagnostics: handle.getDiagnostics(),
		};
	} finally {
		target.dispose();
		handle?.dispose();
		algorithm.dispose();
		composer.dispose();
		backend.dispose();
		renderer.dispose();
	}
}
