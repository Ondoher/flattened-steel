import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';

import { Algorithm32 } from '../candidate/src/algorithm32/Algorithm32.js';
import { CanonicalAtmosphere } from '../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import { CelestialRuntimeParticipant } from '../candidate/src/algorithm32/caches/celestial/CelestialRuntimeParticipant.js';
import { DistantSunCelestialSource } from '../candidate/src/algorithm32/caches/celestial/DistantSunCelestialSource.js';
import { FiniteLocalSunCelestialSource } from '../candidate/src/algorithm32/caches/celestial/FiniteLocalSunCelestialSource.js';
import { BrunetonColorDisplayModel } from '../candidate/src/algorithm32/color/BrunetonColorDisplayModel.js';
import { CANONICAL_ATMOSPHERE_CONSTANTS } from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import { FlatEarthGeometry } from '../candidate/src/algorithm32/geometries/FlatEarthGeometry.js';
import { SphericalEarthGeometry } from '../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
import { DistantSunLightSource } from '../candidate/src/algorithm32/light-sources/DistantSunLightSource.js';
import { FiniteLocalSunLightSource } from '../candidate/src/algorithm32/light-sources/FiniteLocalSunLightSource.js';
import { FlatSynchronizer } from '../candidate/src/algorithm32/light-sources/FlatSynchronizer.js';
import {
	DEFAULT_NATIVE_PRODUCTION_PROFILE,
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import { SPECTRAL_QUANTITIES, SPECTRAL_UNITS, createSpectralPacket } from '../candidate/src/algorithm32/quantities/index.js';
import { createShaderContribution, createShaderSourceBlock, createShaderUniformDescriptor } from '../candidate/src/algorithm32/shader/shaderContribution.js';
import { ThreeCacheBackend } from '../candidate/src/algorithm32/three/ThreeCacheBackend.js';

const MODE = Object.freeze({ path: 1, celestial: 5, preDisplay: 9, ray: 13, state: 14 });
const CHANNEL_COUNT = 15;
const ZERO_SPECTRUM = Object.freeze(Array(CHANNEL_COUNT).fill(0));
const distance = (value) => ({ value, units: 'meters' });
const position = (coordinates) => ({ coordinates, units: 'meters' });
const degrees = (value) => ({ value, units: 'degrees' });

class Stage1ReadbackColor extends BrunetonColorDisplayModel {
	createShaderContribution(request) {
		return [super.createShaderContribution(request), createReadbackContribution(request.descriptor)];
	}
}

function createReadbackContribution(descriptor) {
	return createShaderContribution({
		id: 'spectral-color-stage1-terminal-readback', owner: 'color',
		descriptorFingerprint: descriptor.color.fingerprint,
		compatibilityTags: descriptor.color.compatibilityTags,
		provides: ['color.spectralStage1Readback'],
		requires: ['composition.composeSpectralRadiance', 'color.encodeOutput'],
		uniforms: [createShaderUniformDescriptor('uSpectralStage1Mode', 'int', 'spectralStage1.mode', 0)],
		functions: [createShaderSourceBlock('spectral-stage1-packet', 'diagnosticOutput', 0, `vec4 spectralStage1Packet(SpectralValue value, int packetIndex) {
	vec4 packet = vec4(0.0);
	int firstChannel = packetIndex * 4;
	for (int componentIndex = 0; componentIndex < 4; componentIndex += 1) {
		int channelIndex = firstChannel + componentIndex;
		if (channelIndex < SPECTRAL_CHANNEL_COUNT) packet[componentIndex] = value.c[channelIndex];
	}
	return packet;
}`)],
		mainHooks: [createShaderSourceBlock('spectral-stage1-output', 'diagnosticOutput', 100, `if (uSpectralStage1Mode >= 1 && uSpectralStage1Mode < 5) {
	outColor = spectralStage1Packet(state.pathRadiance, uSpectralStage1Mode - 1);
} else if (uSpectralStage1Mode >= 5 && uSpectralStage1Mode < 9) {
	outColor = spectralStage1Packet(state.celestialRadiance, uSpectralStage1Mode - 5);
} else if (uSpectralStage1Mode >= 9 && uSpectralStage1Mode < 13) {
	outColor = spectralStage1Packet(state.preDisplayRadiance, uSpectralStage1Mode - 9);
} else if (uSpectralStage1Mode == 13) {
	outColor = vec4(state.ray.direction, 1.0);
} else if (uSpectralStage1Mode == 14) {
	outColor = vec4(state.sceneHitMask, state.bounds.valid ? 1.0 : 0.0, state.bounds.hasSceneEndpoint ? 1.0 : 0.0, state.bounds.hasGroundEndpoint ? 1.0 : 0.0);
}`)],
	});
}

function createGpuContext(fixture) {
	const size = fixture.sampling.viewportPixels;
	const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
	const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: false });
	if (!gl) throw new Error('Stage 1 requires WebGL2.');
	const renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: false }); renderer.setSize(size, size, false);
	const composer = new EffectComposer(renderer); composer.setSize(size, size);
	const camera = new THREE.PerspectiveCamera(fixture.sampling.verticalFieldOfViewDegrees, 1, 0.1, 10_000);
	const backend = new ThreeCacheBackend({ THREE, renderer });
	const target = new THREE.WebGLRenderTarget(size, size, { type: THREE.FloatType, format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false });
	return { size, pixel: Math.floor(size / 2), gl, renderer, composer, camera, backend, target, scene: new THREE.Scene() };
}

function disposeGpuContext(context) {
	context.target.dispose(); context.composer.dispose(); context.backend.dispose(); context.renderer.dispose();
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
	return new THREE.Vector3(
		-Math.cos(declination) * Math.sin(hourAngle),
		Math.sin(declination) * Math.cos(latitude) - Math.cos(declination) * Math.sin(latitude) * Math.cos(hourAngle),
		Math.sin(latitude) * Math.sin(declination) + Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle),
	).normalize();
}

function flatConditionFacts(fixture, condition) {
	const location = fixture.flat.location;
	const synchronizer = new FlatSynchronizer().calibrateToWorld();
	const observationLocation = { latitude: degrees(location.latitudeDegrees), longitude: degrees(location.longitudeDegrees) };
	const normalizedAngleDegrees = ((condition.unwrappedAngleDegrees % 360) + 360) % 360;
	const timeIso = synchronizer.getTimeFromClosest(location.dateBasis, observationLocation, degrees(normalizedAngleDegrees));
	const sourceLocation = synchronizer.getPosition(timeIso);
	const radius = fixture.flat.geometry.projectionRadiusMeters;
	const project = (latitudeDegrees, longitudeDegrees) => {
		const latitude = latitudeDegrees * Math.PI / 180; const longitude = longitudeDegrees * Math.PI / 180;
		const radial = radius * (Math.PI / 2 - latitude);
		return [radial * Math.sin(longitude), radial * Math.cos(longitude)];
	};
	const observer = project(location.latitudeDegrees, location.longitudeDegrees);
	const source = project(sourceLocation.latitude.value, sourceLocation.longitude.value);
	const globalX = source[0] - observer[0]; const globalY = source[1] - observer[1];
	const observerLongitude = location.longitudeDegrees * Math.PI / 180;
	const centerMeters = [
		globalX * Math.cos(observerLongitude) - globalY * Math.sin(observerLongitude),
		-globalX * Math.sin(observerLongitude) - globalY * Math.cos(observerLongitude),
		fixture.flat.source.heightMeters,
	];
	return { timeIso, normalizedAngleDegrees, centerMeters, sourceLocation: { latitudeDegrees: sourceLocation.latitude.value, longitudeDegrees: sourceLocation.longitude.value } };
}

function modelToScene(direction) { return new THREE.Vector3(direction.x, direction.z, -direction.y).normalize(); }
function sceneToModel(direction) { return new THREE.Vector3(direction.x, -direction.z, direction.y).normalize(); }
function offsetDirection(center, tangent, angle) { return center.clone().multiplyScalar(Math.cos(angle)).add(tangent.clone().multiplyScalar(Math.sin(angle))).normalize(); }

function radialFrame(center) {
	const up = new THREE.Vector3(0, 0, 1);
	const zenithward = up.clone().addScaledVector(center, -up.dot(center)).normalize();
	const equalElevation = new THREE.Vector3().crossVectors(up, center).normalize();
	return { zenithward, horizonward: zenithward.clone().negate(), equalElevationPositive: equalElevation, equalElevationNegative: equalElevation.clone().negate() };
}

function diskAndCircumsolarSamples(center, angularRadius, fixture) {
	const frame = radialFrame(center);
	const samples = [{ id: 'disk-center', role: 'disk-center', direction: center.clone() }];
	const limbAngle = angularRadius * fixture.sampling.limbRadiusFraction;
	for (const [id, tangent] of Object.entries(frame)) samples.push({ id: `limb-${id}`, role: 'disk-limb', direction: offsetDirection(center, tangent, limbAngle), angularOffsetRadians: limbAngle });
	for (const radiusDegrees of fixture.sampling.circumsolarRadiiDegrees) {
		const angle = radiusDegrees * Math.PI / 180;
		for (const [id, tangent] of Object.entries(frame)) samples.push({ id: `circumsolar-${radiusDegrees}-${id}`, role: 'circumsolar-sky', direction: offsetDirection(center, tangent, angle), angularOffsetRadians: angle });
	}
	return samples;
}

function nightContextSamples(sunDirection, fixture) {
	const horizontal = new THREE.Vector3(sunDirection.x, sunDirection.y, 0).normalize();
	const samples = [{ id: 'geometric-sun-center', role: 'ground-blocked-disk', direction: sunDirection.clone() }];
	for (const elevationDegrees of fixture.sampling.horizonContextElevationsDegrees) {
		const elevation = elevationDegrees * Math.PI / 180;
		samples.push({ id: `horizon-context-${elevationDegrees}`, role: 'horizon-context-sky', direction: new THREE.Vector3(horizontal.x * Math.cos(elevation), horizontal.y * Math.cos(elevation), Math.sin(elevation)) });
	}
	samples.push({ id: 'horizon-context-zenith', role: 'horizon-context-sky', direction: new THREE.Vector3(0, 0, 1) });
	return samples;
}

function aim(camera, directionModel, bindings) {
	const direction = modelToScene(directionModel);
	camera.position.set(0, 0, 0); camera.up.set(Math.abs(direction.y) > 0.95 ? 1 : 0, Math.abs(direction.y) > 0.95 ? 0 : 1, 0);
	camera.lookAt(direction); camera.updateMatrixWorld(true); camera.updateProjectionMatrix();
	bindings['geometry.inverseProjectionMatrix'].copy(camera.projectionMatrixInverse);
	bindings['geometry.inverseViewMatrix'].copy(camera.matrixWorld);
}

function renderPixel(context, pass, mode) {
	const previous = context.renderer.getRenderTarget();
	pass.uniforms.uSpectralStage1Mode.value = mode; pass.renderToScreen = false;
	context.target.scissor.set(context.pixel, context.pixel, 1, 1); context.target.scissorTest = true;
	try {
		pass.render(context.renderer, context.target, context.composer.readBuffer);
		const values = new Float32Array(4); context.renderer.readRenderTargetPixels(context.target, context.pixel, context.pixel, 1, 1, values); return Array.from(values);
	} finally { context.target.scissorTest = false; context.renderer.setRenderTarget(previous); }
}

function readSpectrum(context, pass, firstMode) {
	const values = []; for (let packet = 0; packet < 4; packet += 1) values.push(...renderPixel(context, pass, firstMode + packet)); return values.slice(0, CHANNEL_COUNT);
}

function readSample(context, pass, sample, bindings, horizonMinimumZ) {
	aim(context.camera, sample.direction, bindings);
	const groundBlocked = sample.direction.z < horizonMinimumZ;
	const celestialRadiance = readSpectrum(context, pass, MODE.celestial);
	const ray = renderPixel(context, pass, MODE.ray).slice(0, 3);
	const state = renderPixel(context, pass, MODE.state);
	const base = {
		id: sample.id, role: sample.role, angularOffsetRadians: sample.angularOffsetRadians ?? 0,
		directionModel: sample.direction.toArray(), readbackRayDirectionModel: ray,
		geometryClassification: groundBlocked ? 'ground-blocked' : 'valid-sky-ray',
		celestialRadiance,
		shaderState: { sceneHitMask: state[0], pathValid: state[1], hasSceneEndpoint: state[2], hasGroundEndpoint: state[3] },
	};
	if (groundBlocked) return { ...base, pathRadiance: null, preDisplayRadiance: null };
	return { ...base, pathRadiance: readSpectrum(context, pass, MODE.path), preDisplayRadiance: readSpectrum(context, pass, MODE.preDisplay) };
}

function readHemisphere(context, pass, geometry, bindings, horizonMinimumZ) {
	const plan = geometry.createSkyIlluminanceProbePlan();
	return {
		plan,
		samples: plan.samples.map((sample, index) => ({
			...readSample(context, pass, { id: `hemisphere-${String(index).padStart(2, '0')}`, role: 'upper-hemisphere', direction: sceneToModel(new THREE.Vector3(...sample.localDirection)) }, bindings, horizonMinimumZ),
			solidAngleSteradians: sample.solidAngleSteradians,
			projectedSolidAngleSteradians: sample.projectedSolidAngleSteradians,
		})),
	};
}

async function acquireSpherical(fixture, context) {
	const profile = DEFAULT_NATIVE_PRODUCTION_PROFILE; const first = solarDirectionModel(fixture.spherical.conditions[0].timeIso, fixture.spherical.location);
	const geometry = new SphericalEarthGeometry({ bottomRadius: profile.physical.geometry.bottomRadius, topRadius: profile.physical.geometry.topRadius, observerHeight: distance(fixture.spherical.location.observerHeightMeters), observerUpDirection: [0, 0, 1], sceneFrame: { kind: 'observer-local' }, directionToSource: first.toArray(), cacheAltitudeBinCount: 48, sourceTransmittanceIntervalCount: profile.numerical.sourcePathTransmittance.intervalCount });
	const atmosphere = new CanonicalAtmosphere({ constants: CANONICAL_ATMOSPHERE_CONSTANTS, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const light = new DistantSunLightSource({ directionToLight: first.toArray(), sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY, angularRadius: { value: fixture.spherical.sun.angularRadiusRadians, units: 'radians' } });
	const celestial = new CelestialRuntimeParticipant({ sources: [new DistantSunCelestialSource({ sourceId: fixture.spherical.sun.sourceId, atmosphericSun: light, spectralBasis: NATIVE_15_SPECTRAL_BASIS })], primarySourceId: fixture.spherical.sun.sourceId });
	const algorithm = new Algorithm32({ geometry, atmosphere, lightSource: light, celestial, color: new Stage1ReadbackColor(), spectral: NATIVE_15_SPECTRAL_BASIS, execution: { maximumScatteringOrder: fixture.execution.maximumScatteringOrder } });
	const radius = profile.physical.geometry.bottomRadius.value; const height = fixture.spherical.location.observerHeightMeters;
	const bindings = { 'geometry.inverseProjectionMatrix': new THREE.Matrix4(), 'geometry.inverseViewMatrix': new THREE.Matrix4(), 'geometry.cameraWorldPosition': new THREE.Vector3(0, 0, radius + height), 'geometry.cameraGroundRelativePosition': new THREE.Vector3(0, 0, height), 'geometry.sceneTermination': distance(0), 'geometry.sceneDepthMax': profile.physical.geometry.topRadius, 'lightSource.direction': first };
	let handle;
	try {
		handle = await algorithm.setupShader({ THREE, composer: context.composer, scene: context.scene, camera: context.camera, viewportSize: { width: context.size, height: context.size, units: 'pixels' }, cacheBackend: context.backend, bindingValues: bindings });
		await handle.prepare(context.renderer); context.composer.render();
		const pass = context.composer.passes.find((candidate) => candidate?.uniforms?.uSpectralStage1Mode !== undefined); if (!pass) throw new Error('Spherical Stage 1 readback pass was not installed.');
		const horizonMinimumZ = -Math.sqrt(Math.max(0, 1 - (radius / (radius + height)) ** 2));
		const conditions = [];
		for (const condition of fixture.spherical.conditions) {
			const sun = solarDirectionModel(condition.timeIso, fixture.spherical.location); bindings['lightSource.direction'].copy(sun);
			const selected = condition.series === 'night-control' ? nightContextSamples(sun, fixture) : diskAndCircumsolarSamples(sun, fixture.spherical.sun.angularRadiusRadians, fixture);
			const hemisphere = readHemisphere(context, pass, geometry, bindings, horizonMinimumZ);
			conditions.push({ ...condition, sunDirectionModel: sun.toArray(), solarElevationRadians: Math.asin(sun.z), horizonMinimumZ, samples: selected.map((sample) => readSample(context, pass, sample, bindings, horizonMinimumZ)), hemisphere: hemisphere.samples });
		}
		return { family: 'spherical-distant', atmosphereSetupCount: 1, sourceHash: NATIVE_SOURCE_IRRADIANCE_DENSITY.contentHash, physicalProfileHash: profile.physical.contentHash, shaderSourceHash: handle._buildResult.assembly.sourceHash, quadrature: { id: geometry.createSkyIlluminanceProbePlan().id, fingerprint: geometry.createSkyIlluminanceProbePlan().fingerprint }, conditions, diagnostics: handle.getDiagnostics() };
	} finally { handle?.dispose(); algorithm.dispose(); }
}

function flatModel(fixture, condition, atmosphere) {
	const facts = flatConditionFacts(fixture, condition); const source = fixture.flat.source; const observer = fixture.flat.location.observerMeters;
	const simulationTranslationMeters = [-facts.centerMeters[0], -facts.centerMeters[1], 0];
	const simulationCenterMeters = [0, 0, facts.centerMeters[2]];
	const simulationObserverMeters = [observer[0] + simulationTranslationMeters[0], observer[1] + simulationTranslationMeters[1], observer[2]];
	const horizontalDistance = Math.hypot(simulationObserverMeters[0], simulationObserverMeters[1]);
	const geometry = new FlatEarthGeometry({ observerPosition: position(simulationObserverMeters), sourcePosition: position(simulationCenterMeters), topAltitude: distance(fixture.flat.geometry.topAltitudeMeters), cacheRadialMaximum: distance(Math.max(horizontalDistance, 1)), sceneSkyRayLimit: distance(fixture.flat.geometry.observerDomeMaximumViewRayMeters), observerCenteredDome: { centerPolicy: 'observer-centered', apexAltitude: distance(fixture.flat.geometry.observerDomeApexMeters), maxObserverViewRayExtent: distance(fixture.flat.geometry.observerDomeMaximumViewRayMeters) } });
	const surfaceRadiance = createSpectralPacket({ basis: NATIVE_15_SPECTRAL_BASIS, quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY, units: SPECTRAL_UNITS.RADIANCE_DENSITY, values: source.surfaceRadianceValues, provenanceIdentity: 'spectral-color-stage1-flat-local-surface-radiance-v1' });
	const light = new FiniteLocalSunLightSource({ sourceKey: source.sourceId, position: geometry.configuration.sourcePosition, radius: distance(source.radiusMeters), surfaceRadiance, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const celestialSource = new FiniteLocalSunCelestialSource({ sourceId: source.sourceId, radius: distance(source.radiusMeters), surfaceRadiance, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const celestial = new CelestialRuntimeParticipant({ sources: [celestialSource], primarySourceId: source.sourceId });
	const algorithm = new Algorithm32({ geometry, atmosphere, lightSource: light, celestial, color: new Stage1ReadbackColor(), spectral: NATIVE_15_SPECTRAL_BASIS, execution: { maximumScatteringOrder: fixture.execution.maximumScatteringOrder } });
	return { facts, geometry, surfaceRadiance, algorithm, simulationTranslationMeters, simulationCenterMeters, simulationObserverMeters, placement: geometry.resolveFiniteCelestialBodyPlacement({ sourceId: source.sourceId, receiverPosition: position(simulationObserverMeters), centerPosition: position(simulationCenterMeters), radius: distance(source.radiusMeters) }) };
}

async function acquireFlatCondition(fixture, condition, context, atmosphere, centerOnly = false) {
	const built = flatModel(fixture, condition, atmosphere);
	const bindings = { 'geometry.inverseProjectionMatrix': new THREE.Matrix4(), 'geometry.inverseViewMatrix': new THREE.Matrix4(), 'geometry.cameraWorldPosition': new THREE.Vector3(...built.simulationObserverMeters), 'geometry.sceneTermination': distance(0), 'geometry.sceneDepthMax': distance(fixture.flat.geometry.observerDomeMaximumViewRayMeters), 'geometry.flatFiniteSun.centerMeters': new THREE.Vector3(...built.simulationCenterMeters) };
	let handle;
	try {
		const started = performance.now();
		handle = await built.algorithm.setupShader({ THREE, composer: context.composer, scene: context.scene, camera: context.camera, viewportSize: { width: context.size, height: context.size, units: 'pixels' }, cacheBackend: context.backend, bindingValues: bindings });
		await handle.prepare(context.renderer); context.composer.render();
		const setupMilliseconds = performance.now() - started;
		const pass = context.composer.passes.find((candidate) => candidate?.uniforms?.uSpectralStage1Mode !== undefined); if (!pass) throw new Error('Flat Stage 1 readback pass was not installed.');
		const center = new THREE.Vector3(...built.placement.directionToSourceModel);
		const selected = centerOnly ? [{ id: 'disk-center', role: 'disk-center', direction: center }] : diskAndCircumsolarSamples(center, built.placement.angularRadiusRadians, fixture);
		const hemisphere = centerOnly ? null : readHemisphere(context, pass, built.geometry, bindings, 0);
		return {
			...condition, ...built.facts, setupMilliseconds,
			simulationFrame: { kind: 'source-centered-translation', translationMeters: built.simulationTranslationMeters, observerMeters: built.simulationObserverMeters, sourceCenterMeters: built.simulationCenterMeters },
			sourceDistanceMeters: built.placement.distance.value, apparentAngularRadiusRadians: built.placement.angularRadiusRadians,
			sourceDirectionModel: built.placement.directionToSourceModel,
			sourceRadianceHash: built.surfaceRadiance.contentHash,
			shaderSourceHash: handle._buildResult.assembly.sourceHash,
			cacheGenerationIdentity: handle._buildResult.cacheIdentity ?? handle._buildResult.cache?.generationIdentity ?? null,
			celestialGenerationIdentity: handle._buildResult.celestialCacheIdentity ?? handle._buildResult.celestialCache?.generationIdentity ?? null,
			samples: selected.map((sample) => readSample(context, pass, sample, bindings, 0)),
			hemisphere: hemisphere?.samples ?? [], diagnostics: handle.getDiagnostics(),
		};
	} finally { handle?.dispose(); built.algorithm.dispose(); }
}

async function acquireFlat(fixture, context, conditions) {
	const atmosphere = new CanonicalAtmosphere({ constants: CANONICAL_ATMOSPHERE_CONSTANTS, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const results = [];
	for (const condition of conditions) results.push(await acquireFlatCondition(fixture, condition, context, atmosphere, false));
	return { family: 'flat-local', atmosphereDefinitionCount: 1, physicalProfileHash: DEFAULT_NATIVE_PRODUCTION_PROFILE.physical.contentHash, conditions: results };
}

export async function runStage1FlatAnchorProbe(fixture) {
	const context = createGpuContext(fixture); const started = performance.now();
	try {
		const atmosphere = new CanonicalAtmosphere({ constants: CANONICAL_ATMOSPHERE_CONSTANTS, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
		const anchors = [fixture.flat.conditions.find((condition) => condition.unwrappedAngleDegrees === -15), fixture.flat.conditions.find((condition) => condition.unwrappedAngleDegrees === 0), fixture.flat.conditions.find((condition) => condition.unwrappedAngleDegrees === 180)];
		const conditions = []; for (const anchor of anchors) conditions.push(await acquireFlatCondition(fixture, anchor, context, atmosphere, true));
		return { schemaId: 'spectral-color-stage1-flat-anchor-v1', elapsedMilliseconds: performance.now() - started, webglVersion: context.gl.getParameter(context.gl.VERSION), conditions };
	} finally { disposeGpuContext(context); }
}

export async function runStage1SphericalLedger(fixture) {
	const context = createGpuContext(fixture); const started = performance.now();
	try {
		const spherical = await acquireSpherical(fixture, context);
		return {
			schemaId: 'spectral-color-stage1-spherical-shard-v1', elapsedMilliseconds: performance.now() - started,
			webglVersion: context.gl.getParameter(context.gl.VERSION), spectralBasis: NATIVE_15_SPECTRAL_BASIS,
			radianceQuantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY, radianceUnits: SPECTRAL_UNITS.RADIANCE_DENSITY,
			profileHash: DEFAULT_NATIVE_PRODUCTION_PROFILE.contentHash,
			sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
			spherical,
		};
	} finally { disposeGpuContext(context); }
}

export async function runStage1FlatLedgerShard(fixture, conditionIds) {
	if (!Array.isArray(conditionIds) || conditionIds.length < 1) throw new TypeError('Flat Stage 1 shard requires condition ids.');
	const selected = conditionIds.map((id) => {
		const condition = fixture.flat.conditions.find((candidate) => candidate.id === id);
		if (!condition) throw new RangeError(`Unknown Flat Stage 1 condition: ${id}`);
		return condition;
	});
	const context = createGpuContext(fixture); const started = performance.now();
	try {
		const flat = await acquireFlat(fixture, context, selected);
		return {
			schemaId: 'spectral-color-stage1-flat-shard-v1', elapsedMilliseconds: performance.now() - started,
			webglVersion: context.gl.getParameter(context.gl.VERSION), spectralBasis: NATIVE_15_SPECTRAL_BASIS,
			radianceQuantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY, radianceUnits: SPECTRAL_UNITS.RADIANCE_DENSITY,
			profileHash: DEFAULT_NATIVE_PRODUCTION_PROFILE.contentHash,
			flat,
		};
	} finally { disposeGpuContext(context); }
}

export async function runSpectralColorStage1Ledger(fixture) {
	const context = createGpuContext(fixture); const started = performance.now();
	try {
		const spherical = await acquireSpherical(fixture, context);
		const flat = await acquireFlat(fixture, context, fixture.flat.conditions);
		return {
			schemaId: 'spectral-color-stage1-ledger-readback-v1', elapsedMilliseconds: performance.now() - started,
			webglVersion: context.gl.getParameter(context.gl.VERSION),
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
			radianceQuantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY, radianceUnits: SPECTRAL_UNITS.RADIANCE_DENSITY,
			sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
			profileHash: DEFAULT_NATIVE_PRODUCTION_PROFILE.contentHash,
			spherical, flat,
		};
	} finally { disposeGpuContext(context); }
}
