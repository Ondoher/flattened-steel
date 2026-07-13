import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';

import {Algorithm32} from '/snapshot/src/algorithm32/implementation/algorithm32/Algorithm32.js';
import {BrunetonColorDisplayModel} from '/snapshot/src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {FIGURE1_DISPLAY_CONSTANTS} from '/snapshot/src/algorithm32/implementation/bruneton-color/consts.js';
import {CanonicalAtmosphere} from '/snapshot/src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {DistantSunLightSource} from '/snapshot/src/algorithm32/implementation/distant-sun/DistantSunLightSource.js';
import {FlatEarthGeometry} from '/snapshot/src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js';
import {LocalSunLightSource} from '/snapshot/src/algorithm32/implementation/local-sun/LocalSunLightSource.js';
import {Algorithm32Bindings} from '/snapshot/src/algorithm32/implementation/react-three/Algorithm32Bindings.js';
import {SphericalEarthGeometry} from '/snapshot/src/algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js';
import {ThreeCacheBackend} from '/snapshot/src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import {DEFAULT_NATIVE_PRODUCTION_PROFILE} from '/snapshot/src/algorithm32/profiles/native-15/native-15-profile.js';
import {NATIVE_48_POSITION_DOMAIN_OWNER} from '/snapshot/src/algorithm32/sampling-domains/position/spherical-native/consts.js';
import {ShaderContributions} from '/snapshot/src/algorithm32/shader-assembly/base/ShaderContributions.js';

const DIAGNOSTIC_MODE = {
	normal: 0,
	pathPacketStart: 1,
	celestialPacketStart: 5,
	preDisplayPacketStart: 9,
	signedLinearRgb: 13,
	directY: 14,
	mapper: 15,
	coverage: 16,
	state: 17,
	rayDirection: 18,
	cachePacketStart: 19,
	distantStencilIndices: 23,
	distantStencilWeights: 24,
};
const SPECTRAL_PACKET_COUNT = 4;
const SPECTRAL_CHANNEL_COUNT = 15;
const DEFAULT_SCENE_SCALE = {value: 1000, units: 'meters-per-scene-unit'};
const DEFAULT_OBSERVER_HEIGHT = {value: 5, units: 'meters'};
const DEFAULT_OBSERVER_UP_DIRECTION = [0, 0, 1];
const DEFAULT_FLAT_TOP_ALTITUDE = {value: 100000, units: 'meters'};
const DEFAULT_FLAT_VIEW_RAY_LIMIT = {value: 1926774, units: 'meters'};
const DEFAULT_LOCAL_SOURCE_HEIGHT = {value: 3000 * 1609.344, units: 'meters'};
const DEFAULT_LOCAL_SOURCE_RADIUS = {value: 25749.504, units: 'meters'};
const DEFAULT_LOCAL_REFERENCE_DISTANCE = {value: 4800000, units: 'meters'};
const CACHE_HEARTBEAT_INTERVAL_MILLISECONDS = 5000;
const RASTER_SAMPLE_OFFSETS = [
	[-0.25, -0.25],
	[0.25, -0.25],
	[-0.25, 0.25],
	[0.25, 0.25],
];

/** Production Color with one terminal readout contribution after the unchanged production contribution. */
class SunAppearanceGpuVisualColor extends BrunetonColorDisplayModel {
	/** Add the proof-only readout after the production Color contribution. */
	createShaderContribution(request) {
		const productionContribution = super.createShaderContribution(request);
		const family = request.model.celestialSources?.family;

		if (family !== 'spherical-sun-stars-radial-v1' && family !== 'flat-local-finite-sun-v1') {
			throw new RangeError(`Unsupported Sun GPU visual family: ${String(family)}.`);
		}
		return [productionContribution, createDiagnosticContribution(family)];
	}
}

/** Return the geometry-specific four-subsample coverage replay used only for evidence. */
function coverageSource(family) {
	if (family === 'spherical-sun-stars-radial-v1') {
		return `vec4 sunAppearanceGpuVisualCoverage(ShaderState state) {
	vec4 coverage = vec4(0.0);
	CelestialCacheBilinearStencil stencil = resolveDistantSunCelestialCacheStencil();
	if (!stencil.valid) return coverage;
	for (int sampleIndex = 0; sampleIndex < 4; sampleIndex += 1) {
		vec2 sampleTextureCoordinates = state.textureCoordinates
			+ DISTANT_SUN_CELESTIAL_SAMPLE_OFFSETS[sampleIndex]
				/ max(uViewportSizePixels, vec2(1.0));
		if (any(lessThan(sampleTextureCoordinates, vec2(0.0)))
			|| any(greaterThanEqual(sampleTextureCoordinates, vec2(1.0)))
			|| distantSunCelestialSampleIsSceneBlocked(sampleTextureCoordinates)) continue;
		ViewRay sampleRay = reconstructViewRay(sampleTextureCoordinates);
		vec3 directionToSun = normalize(directionToAtmosphericSource(sampleRay.originMeters));
		if (dot(sampleRay.direction, directionToSun) < DISTANT_SUN_CELESTIAL_MINIMUM_DISK_COSINE
			|| !distantSunCelestialSampleHasGroundSupport(sampleRay.direction)) continue;
		coverage[sampleIndex] = 1.0;
	}
	return coverage;
}`;
	}
	return `vec4 sunAppearanceGpuVisualCoverage(ShaderState state) {
	vec4 coverage = vec4(0.0);
	for (int sampleIndex = 0; sampleIndex < 4; sampleIndex += 1) {
		vec2 sampleTextureCoordinates = state.textureCoordinates
			+ FLAT_FINITE_SUN_SAMPLE_OFFSETS[sampleIndex]
				/ max(uViewportSizePixels, vec2(1.0));
		if (any(lessThan(sampleTextureCoordinates, vec2(0.0)))
			|| any(greaterThanEqual(sampleTextureCoordinates, vec2(1.0)))
			|| flatFiniteSunSampleIsSceneBlocked(sampleTextureCoordinates)) continue;
		ViewRay sampleRay = reconstructViewRay(sampleTextureCoordinates);
		float bodyEntryDistanceMeters;
		if (!flatFiniteSunEntryDistance(sampleRay, bodyEntryDistanceMeters)) continue;
		coverage[sampleIndex] = 1.0;
	}
	return coverage;
}`;
}

/** Return the source-family raw completed-cache lookup readout. */
function cacheLookupSource(family) {
	if (family === 'spherical-sun-stars-radial-v1') {
		return `SpectralValue sunAppearanceGpuVisualRawCache() {
	CelestialCacheBilinearStencil stencil = resolveDistantSunCelestialCacheStencil();
	if (!stencil.valid) return zeroSpectral();
	return sampleDistantSunCelestialRadiance(stencil);
}`;
	}
	return `SpectralValue sunAppearanceGpuVisualRawCache() {
	return sampleFlatFiniteSunRadiance();
}`;
}

/** Create the proof-only shader contribution that exposes production GPU locals. */
function createDiagnosticContribution(family) {
	const distant = family === 'spherical-sun-stars-radial-v1';
	return ShaderContributions.createShaderContribution({
		id: 'color-sun-appearance-gpu-visual-terminal-readout',
		owner: 'color',
		requires: [
			'composition.composeSpectralRadiance',
			'color.composeSceneColor',
			'color.encodeOutput',
			...(distant
				? ['cache.sampleDistantSunCelestialRadiance', 'geometry.resolveCelestialCacheStencil']
				: ['cache.sampleFlatFiniteSunRadiance']),
		],
		uniforms: [
			ShaderContributions.createShaderUniformDeclaration(
				'uSunAppearanceGpuVisualMode',
				'int',
				'sunAppearance.gpuVisualMode',
				DIAGNOSTIC_MODE.normal,
			),
		],
		functions: [
			ShaderContributions.createShaderSourceBlock(
				'sun-appearance-gpu-visual-functions',
				'diagnosticOutput',
				0,
				`vec4 sunAppearanceGpuVisualSpectralPacket(SpectralValue value, int packetIndex) {
	vec4 packet = vec4(0.0);
	int firstChannel = packetIndex * 4;
	for (int componentIndex = 0; componentIndex < 4; componentIndex += 1) {
		int channelIndex = firstChannel + componentIndex;
		if (channelIndex < SPECTRAL_CHANNEL_COUNT) packet[componentIndex] = value.channels[channelIndex];
	}
	return packet;
}

${coverageSource(family)}

${cacheLookupSource(family)}`,
			),
		],
		mainHooks: [
			ShaderContributions.createShaderSourceBlock(
				'sun-appearance-gpu-visual-main',
				'diagnosticOutput',
				0,
				`if (uSunAppearanceGpuVisualMode >= ${DIAGNOSTIC_MODE.pathPacketStart}
		&& uSunAppearanceGpuVisualMode < ${DIAGNOSTIC_MODE.pathPacketStart + SPECTRAL_PACKET_COUNT}) {
		outColor = sunAppearanceGpuVisualSpectralPacket(
			state.pathRadiance,
			uSunAppearanceGpuVisualMode - ${DIAGNOSTIC_MODE.pathPacketStart}
		);
	}
	if (uSunAppearanceGpuVisualMode >= ${DIAGNOSTIC_MODE.celestialPacketStart}
		&& uSunAppearanceGpuVisualMode < ${DIAGNOSTIC_MODE.celestialPacketStart + SPECTRAL_PACKET_COUNT}) {
		outColor = sunAppearanceGpuVisualSpectralPacket(
			celestialRadiance,
			uSunAppearanceGpuVisualMode - ${DIAGNOSTIC_MODE.celestialPacketStart}
		);
	}
	if (uSunAppearanceGpuVisualMode >= ${DIAGNOSTIC_MODE.preDisplayPacketStart}
		&& uSunAppearanceGpuVisualMode < ${DIAGNOSTIC_MODE.preDisplayPacketStart + SPECTRAL_PACKET_COUNT}) {
		outColor = sunAppearanceGpuVisualSpectralPacket(
			preDisplayRadiance,
			uSunAppearanceGpuVisualMode - ${DIAGNOSTIC_MODE.preDisplayPacketStart}
		);
	}
	if (uSunAppearanceGpuVisualMode == ${DIAGNOSTIC_MODE.signedLinearRgb}) {
		outColor = vec4(spectralRadianceToLinearSrgb(preDisplayRadiance), 1.0);
	}
	if (uSunAppearanceGpuVisualMode == ${DIAGNOSTIC_MODE.directY}) {
		outColor = vec4(
			spectralRadianceToPhotopicLuminance(preDisplayRadiance),
			spectralRadianceToPhotopicLuminance(state.pathRadiance),
			spectralRadianceToPhotopicLuminance(celestialRadiance),
			1.0
		);
	}
	if (uSunAppearanceGpuVisualMode == ${DIAGNOSTIC_MODE.mapper}) outColor = state.outputRgba;
	if (uSunAppearanceGpuVisualMode == ${DIAGNOSTIC_MODE.coverage}) {
		outColor = sunAppearanceGpuVisualCoverage(state);
	}
	if (uSunAppearanceGpuVisualMode == ${DIAGNOSTIC_MODE.state}) {
		outColor = vec4(
			state.sceneHitMask,
			state.bounds.valid ? 1.0 : 0.0,
			state.bounds.hasSceneEndpoint ? 1.0 : 0.0,
			state.bounds.hasGroundEndpoint ? 1.0 : 0.0
		);
	}
	if (uSunAppearanceGpuVisualMode == ${DIAGNOSTIC_MODE.rayDirection}) {
		outColor = vec4(state.ray.direction, 1.0);
	}
	if (uSunAppearanceGpuVisualMode >= ${DIAGNOSTIC_MODE.cachePacketStart}
		&& uSunAppearanceGpuVisualMode < ${DIAGNOSTIC_MODE.cachePacketStart + SPECTRAL_PACKET_COUNT}) {
		outColor = sunAppearanceGpuVisualSpectralPacket(
			sunAppearanceGpuVisualRawCache(),
			uSunAppearanceGpuVisualMode - ${DIAGNOSTIC_MODE.cachePacketStart}
		);
	}
${
	distant
		? `\tif (uSunAppearanceGpuVisualMode == ${DIAGNOSTIC_MODE.distantStencilIndices}) {
		CelestialCacheBilinearStencil stencil = resolveDistantSunCelestialCacheStencil();
		outColor = vec4(vec2(stencil.receiverIndices), vec2(stencil.directionIndices));
	}
	if (uSunAppearanceGpuVisualMode == ${DIAGNOSTIC_MODE.distantStencilWeights}) {
		CelestialCacheBilinearStencil stencil = resolveDistantSunCelestialCacheStencil();
		outColor = vec4(stencil.receiverWeights, stencil.directionWeights);
		if (!stencil.valid) outColor = vec4(-1.0);
	}`
		: ''
}`,
			),
		],
		diagnostics: {
			mode: 'sun-appearance-gpu-visual-terminal-readout-v1',
			family,
			spectralPacketCount: SPECTRAL_PACKET_COUNT,
			rasterSubsampleCount: 4,
		},
	});
}

/** Convert a scalar or unit-bearing value to one requested durable unit shape. */
function unitValue(value, fallback, units, label) {
	const candidate = value ?? fallback;
	const scalar = typeof candidate === 'number' ? candidate : candidate?.value;

	if (!Number.isFinite(scalar)) throw new TypeError(`${label} must be finite.`);
	return typeof candidate === 'number' ? {value: scalar, units} : candidate;
}

/** Normalize one fixture condition into the production observation packet. */
function observationFromCondition(family, condition, familyFixture) {
	const location = condition.location ?? familyFixture.location;
	const normalizedLocation = {
		latitude: unitValue(location?.latitude ?? location?.latitudeDegrees, undefined, 'degrees', 'latitude'),
		longitude: unitValue(location?.longitude ?? location?.longitudeDegrees, undefined, 'degrees', 'longitude'),
	};
	let instant = condition.instant;

	if (instant === undefined && family === 'flat') {
		const dateBasis = condition.dateBasis ?? location?.dateBasis;
		const angleDegrees = Number(condition.flatAngleDegrees);
		if (typeof dateBasis !== 'string' || !Number.isFinite(angleDegrees)) {
			throw new TypeError(`Flat condition ${String(condition.id)} requires dateBasis and flatAngleDegrees.`);
		}
		instant = FlatEarthGeometry.resolveObservationInstant({
			dateBasis,
			location: normalizedLocation,
			kind: 'closest-angle',
			angle: {value: angleDegrees, units: 'degrees'},
		});
	}
	if (typeof instant !== 'string' || !Number.isFinite(Date.parse(instant))) {
		throw new TypeError(`Condition ${String(condition.id)} requires a canonical instant.`);
	}
	return {instant: new Date(instant).toISOString(), location: normalizedLocation};
}

/** Normalize a three-component direction. */
function normalizeDirection(value, label) {
	if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite)) {
		throw new TypeError(`${label} must contain three finite coordinates.`);
	}
	const length = Math.hypot(...value);
	if (!(length > 0)) throw new RangeError(`${label} must be nonzero.`);
	return value.map((component) => component / length);
}

/** Return the dot product of two three-component vectors. */
function dot(left, right) {
	return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

/** Return the cross product of two three-component vectors. */
function cross(left, right) {
	return [
		left[1] * right[2] - left[2] * right[1],
		left[2] * right[0] - left[0] * right[2],
		left[0] * right[1] - left[1] * right[0],
	];
}

/** Build a stable tangent to one source direction from a preferred model-space axis. */
function tangentDirection(sourceDirection, preferredDirection) {
	const projected = preferredDirection.map(
		(component, index) => component - dot(preferredDirection, sourceDirection) * sourceDirection[index],
	);
	if (Math.hypot(...projected) > 1e-10) return normalizeDirection(projected, 'sample tangent');
	const fallback = Math.abs(sourceDirection[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0];
	return normalizeDirection(cross(sourceDirection, fallback), 'fallback sample tangent');
}

/** Offset one direction along a declared great-circle tangent. */
function offsetDirection(sourceDirection, tangent, angleRadians) {
	return normalizeDirection(
		sourceDirection.map(
			(component, index) => Math.cos(angleRadians) * component + Math.sin(angleRadians) * tangent[index],
		),
		'offset sample direction',
	);
}

/** Create the fixed center, inside-limb, and circumsolar visual samples. */
function createSamples(sourceDirection, upDirection, apparentRadiusRadians, sampling, condition) {
	const zenithward = tangentDirection(sourceDirection, upDirection);
	const equalElevation = tangentDirection(sourceDirection, cross(upDirection, sourceDirection));
	const insideFactor = Number(sampling.insideLimbRadiusFactor ?? 0.95);
	const orientationIds = condition.radialOrientations ?? ['zenithward'];
	const orientationDirections = {zenithward, 'equal-elevation': equalElevation};
	const samples = [
		{id: 'disk-center', directionModel: sourceDirection, angularOffsetRadians: 0, orientation: 'center'},
		{
			id: 'inside-limb-zenithward',
			directionModel: offsetDirection(sourceDirection, zenithward, apparentRadiusRadians * insideFactor),
			angularOffsetRadians: apparentRadiusRadians * insideFactor,
			orientation: 'zenithward',
		},
	];

	if (!(insideFactor >= 0 && insideFactor < 1)) throw new RangeError('insideLimbRadiusFactor must be in [0, 1).');
	if (!Array.isArray(orientationIds) || orientationIds.some((id) => !Object.hasOwn(orientationDirections, id))) {
		throw new RangeError('radialOrientations contains an unsupported direction.');
	}
	for (const offsetDegrees of sampling.circumsolarOffsetsDegrees ?? [0.5, 1, 2]) {
		if (!Number.isFinite(offsetDegrees) || offsetDegrees <= 0) {
			throw new RangeError('Circumsolar offsets must be positive and finite.');
		}
		const offsetRadians = (offsetDegrees * Math.PI) / 180;
		const idValue = String(offsetDegrees).replace('.', 'p');
		for (const orientation of orientationIds) {
			samples.push({
				id: `circumsolar-${idValue}-degrees-${orientation}`,
				directionModel: offsetDirection(sourceDirection, orientationDirections[orientation], offsetRadians),
				angularOffsetRadians: offsetRadians,
				orientation,
			});
		}
	}
	return samples;
}

/** Map a model direction through the geometry-owned observer-local scene frame. */
function modelDirectionToSceneDirection(geometry, modelDirection) {
	const modelRight = geometry.mapObserverLocalSceneDirectionToModelDirection([1, 0, 0]);
	const modelUp = geometry.mapObserverLocalSceneDirectionToModelDirection([0, 1, 0]);
	const modelForward = geometry.mapObserverLocalSceneDirectionToModelDirection([0, 0, -1]);
	return normalizeDirection(
		[dot(modelDirection, modelRight), dot(modelDirection, modelUp), -dot(modelDirection, modelForward)],
		'model-to-scene direction',
	);
}

/** Reconstruct one Three camera ray with the production inverse-projection convention. */
function cameraRayDirectionScene(camera, textureCoordinates) {
	const worldPoint = new THREE.Vector3(textureCoordinates[0] * 2 - 1, textureCoordinates[1] * 2 - 1, 1).unproject(
		camera,
	);
	return worldPoint.sub(camera.position).normalize();
}

/** Aim a requested sample at one texture coordinate while preserving stable zenith roll. */
function aimCamera(camera, geometry, directionModel, upModel, textureCoordinates = [0.5, 0.5]) {
	const directionScene = modelDirectionToSceneDirection(geometry, directionModel);
	const upScene = modelDirectionToSceneDirection(geometry, upModel);
	const projectedUp = tangentDirection(directionScene, upScene);
	const target = camera.position.clone().add(new THREE.Vector3(...directionScene));

	camera.up.set(...projectedUp);
	camera.lookAt(target);
	camera.updateProjectionMatrix();
	camera.updateMatrixWorld(true);
	const initialRay = cameraRayDirectionScene(camera, textureCoordinates);
	const correction = new THREE.Quaternion().setFromUnitVectors(initialRay, new THREE.Vector3(...directionScene));
	camera.quaternion.premultiply(correction).normalize();
	camera.updateMatrixWorld(true);
	return cameraRayDirectionScene(camera, textureCoordinates).toArray();
}

/** Create one no-color-space production-like diagnostic target. */
function createTarget(width, height, type, internalFormat, name) {
	const target = new THREE.WebGLRenderTarget(width, height, {
		format: THREE.RGBAFormat,
		type,
		internalFormat,
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		depthBuffer: false,
		stencilBuffer: false,
	});
	target.texture.name = name;
	target.texture.colorSpace = THREE.NoColorSpace;
	return target;
}

/** Read one diagnostic pixel using its render target's component type. */
function readTargetPixel(renderer, target, x, y) {
	if (target.texture.type === THREE.HalfFloatType) {
		const encoded = new Uint16Array(4);
		renderer.readRenderTargetPixels(target, x, y, 1, 1, encoded);
		return Array.from(encoded, (value) => THREE.DataUtils.fromHalfFloat(value));
	}
	const values = new Float32Array(4);
	renderer.readRenderTargetPixels(target, x, y, 1, 1, values);
	return Array.from(values);
}

/** Render the normal composer path at one measured optical-axis pixel. */
function renderComposerPixel(renderer, composer, pixel) {
	const previousRenderTarget = renderer.getRenderTarget();
	const previousScissor = renderer.getScissor(new THREE.Vector4());
	const previousScissorTest = renderer.getScissorTest();
	const composerTargets = [
		...new Set([
			composer.renderTarget1,
			composer.renderTarget2,
			...composer.passes.flatMap((pass) => [pass?._depthTarget, pass?._hitTarget]),
		]),
	].filter((target) => target?.isWebGLRenderTarget === true);
	const targetStates = composerTargets.map((target) => ({
		target,
		scissor: target.scissor.clone(),
		scissorTest: target.scissorTest,
	}));

	for (const target of composerTargets) {
		target.scissor.set(pixel.x, pixel.y, 1, 1);
		target.scissorTest = true;
	}
	renderer.setRenderTarget(null);
	renderer.setScissor(pixel.x, pixel.y, 1, 1);
	renderer.setScissorTest(true);
	try {
		composer.render();
	} finally {
		for (const state of targetStates) {
			state.target.scissor.copy(state.scissor);
			state.target.scissorTest = state.scissorTest;
		}
		renderer.setRenderTarget(null);
		renderer.setScissor(previousScissor);
		renderer.setScissorTest(previousScissorTest);
		renderer.setRenderTarget(previousRenderTarget);
	}
}

/** Render one readout mode through the installed production runtime pass. */
function renderAuxiliaryMode(renderer, runtimePass, readBuffer, target, pixel, mode) {
	const previousTarget = renderer.getRenderTarget();
	const modeUniform = runtimePass.uniforms.uSunAppearanceGpuVisualMode;
	modeUniform.value = mode;
	target.scissor.set(pixel.x, pixel.y, 1, 1);
	target.scissorTest = true;
	runtimePass.renderToScreen = false;
	try {
		runtimePass.render(renderer, target, readBuffer);
		return readTargetPixel(renderer, target, pixel.x, pixel.y);
	} finally {
		target.scissorTest = false;
		renderer.setRenderTarget(previousTarget);
	}
}

/** Read one complete Native-15 GPU spectrum from four RGBA32F packets. */
function readSpectrum(renderer, runtimePass, readBuffer, target, pixel, firstMode) {
	const values = [];
	const packets = [];
	for (let packetIndex = 0; packetIndex < SPECTRAL_PACKET_COUNT; packetIndex += 1) {
		const packet = renderAuxiliaryMode(renderer, runtimePass, readBuffer, target, pixel, firstMode + packetIndex);
		packets.push(packet);
		values.push(...packet);
	}
	return {packets, values: values.slice(0, SPECTRAL_CHANNEL_COUNT)};
}

/** Decode one PNG data URL without browser-managed color conversion. */
async function decodePngPixel(dataUrl, x, y, width, height) {
	const response = await fetch(dataUrl);
	const bitmap = await createImageBitmap(await response.blob(), {colorSpaceConversion: 'none'});
	const decodeCanvas = document.createElement('canvas');
	decodeCanvas.width = width;
	decodeCanvas.height = height;
	const context = decodeCanvas.getContext('2d', {willReadFrequently: true});
	if (context === null) throw new Error('PNG evidence requires a 2D decode context.');
	try {
		context.drawImage(bitmap, 0, 0);
		return Array.from(context.getImageData(x, height - 1 - y, 1, 1).data);
	} finally {
		bitmap.close();
	}
}

/** Encode one byte view as bounded-chunk base64. */
function bytesToBase64(bytes) {
	const chunkSize = 0x8000;
	let binary = '';
	for (let offset = 0; offset < bytes.length; offset += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(offset, Math.min(bytes.length, offset + chunkSize)));
	}
	return btoa(binary);
}

/** Return the standard sRGB opto-electronic transfer value. */
function srgbOetf(value) {
	return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
}

/** Format one finite JavaScript number as an explicit GLSL float literal. */
function formatGlslFloat(value) {
	if (!Number.isFinite(value)) throw new RangeError('GLSL sentinel values must be finite.');
	const literal = String(value);
	return /[.eE]/u.test(literal) ? literal : `${literal}.0`;
}

/** Classify measured grayscale Q8 RGBA values against identity and sRGB hypotheses. */
function classifyQ8(values, measuredRgba) {
	const identityCodes = values.map((value) => Math.round(Math.min(1, Math.max(0, value)) * 255));
	const srgbCodes = values.map((value) => Math.round(Math.min(1, Math.max(0, srgbOetf(value))) * 255));
	const residual = (expected) =>
		Math.max(
			...measuredRgba.flatMap((rgba, index) =>
				rgba.slice(0, 3).map((value) => Math.abs(value - expected[index])),
			),
		);
	const identityMaximumCodeResidual = residual(identityCodes);
	const srgbMaximumCodeResidual = residual(srgbCodes);
	return {
		identityCodes,
		srgbCodes,
		identityMaximumCodeResidual,
		srgbMaximumCodeResidual,
		classification:
			identityMaximumCodeResidual < srgbMaximumCodeResidual
				? 'identity-q8'
				: srgbMaximumCodeResidual < identityMaximumCodeResidual
					? 'srgb-oetf-q8'
					: 'ambiguous',
	};
}

/** Return bounded shader compilation diagnostics for the sentinel draw control. */
function sentinelProgramDiagnostics(renderer, material) {
	const currentProgram = renderer.properties.get(material)?.currentProgram;
	const diagnostics = currentProgram?.diagnostics;
	return {
		programAvailable: currentProgram !== undefined,
		diagnosticsAvailable: diagnostics !== undefined,
		runnable: diagnostics?.runnable ?? currentProgram !== undefined,
		programLog: diagnostics?.programLog ?? '',
		vertexShaderLog: diagnostics?.vertexShader?.log ?? '',
		fragmentShaderLog: diagnostics?.fragmentShader?.log ?? '',
	};
}

/** Measure the renderer output contract through float, default-framebuffer, and PNG boundaries. */
async function measureOutputContract(renderer, canvas, sentinelValues) {
	const width = sentinelValues.length;
	renderer.setSize(width, 1, false);
	const floatTarget = createTarget(width, 1, THREE.FloatType, 'RGBA32F', 'SunAppearanceGpuVisual.sentinel');
	const material = new THREE.RawShaderMaterial({
		glslVersion: THREE.GLSL3,
		vertexShader: 'in vec3 position; void main() { gl_Position = vec4(position, 1.0); }',
		fragmentShader: `precision highp float;
	out vec4 outColor;
	const float VALUES[${width}] = float[${width}](${sentinelValues.map(formatGlslFloat).join(', ')});
	void main() {
		int valueIndex = clamp(int(floor(gl_FragCoord.x)), 0, ${width - 1});
		outColor = vec4(vec3(VALUES[valueIndex]), 1.0);
	}`,
		depthTest: false,
		depthWrite: false,
	});
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
	const scene = new THREE.Scene();
	const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	const mesh = new THREE.Mesh(geometry, material);
	mesh.frustumCulled = false;
	scene.add(mesh);
	const context = renderer.getContext();
	const ditherInitiallyEnabled = context.isEnabled(context.DITHER);
	try {
		context.disable(context.DITHER);
		const deterministicDitherEnabledBeforeDraw = context.isEnabled(context.DITHER);
		renderer.setRenderTarget(floatTarget);
		renderer.render(scene, camera);
		const rgba32f = sentinelValues.map((_value, index) => readTargetPixel(renderer, floatTarget, index, 0));
		renderer.setRenderTarget(null);
		renderer.render(scene, camera);
		const deterministicDitherEnabledAfterDraw = context.isEnabled(context.DITHER);
		const deterministicPixels = new Uint8Array(width * 4);
		context.readPixels(0, 0, width, 1, context.RGBA, context.UNSIGNED_BYTE, deterministicPixels);
		const deterministicDefaultRgba = sentinelValues.map((_value, index) =>
			Array.from(deterministicPixels.slice(index * 4, index * 4 + 4)),
		);
		const deterministicPngDataUrl = canvas.toDataURL('image/png');
		const deterministicPngRgba = [];
		for (let index = 0; index < width; index += 1) {
			deterministicPngRgba.push(await decodePngPixel(deterministicPngDataUrl, index, 0, width, 1));
		}
		const deterministicDefaultFramebufferQ8 = classifyQ8(sentinelValues, deterministicDefaultRgba);
		const deterministicPngQ8 = classifyQ8(sentinelValues, deterministicPngRgba);
		if (ditherInitiallyEnabled) context.enable(context.DITHER);
		else context.disable(context.DITHER);
		const normalDitherEnabledBeforeDraw = context.isEnabled(context.DITHER);
		renderer.setRenderTarget(null);
		renderer.render(scene, camera);
		const normalDitherEnabledAfterDraw = context.isEnabled(context.DITHER);
		const normalPixels = new Uint8Array(width * 4);
		context.readPixels(0, 0, width, 1, context.RGBA, context.UNSIGNED_BYTE, normalPixels);
		const defaultRgba = sentinelValues.map((_value, index) =>
			Array.from(normalPixels.slice(index * 4, index * 4 + 4)),
		);
		const normalPngDataUrl = canvas.toDataURL('image/png');
		const normalPngRgba = [];
		for (let index = 0; index < width; index += 1) {
			normalPngRgba.push(await decodePngPixel(normalPngDataUrl, index, 0, width, 1));
		}
		const defaultFramebufferQ8 = classifyQ8(sentinelValues, defaultRgba);
		const pngQ8 = classifyQ8(sentinelValues, normalPngRgba);
		const programDiagnostics = sentinelProgramDiagnostics(renderer, material);
		const webglError = context.getError();
		return {
			sentinelValues,
			probeInputStage: 'raw mapper-output sentinel through RawShaderMaterial',
			rgba32f,
			deterministicNoDitherDefaultFramebufferRgba: deterministicDefaultRgba,
			deterministicNoDitherPngDecodedRgba: deterministicPngRgba,
			deterministicNoDitherDefaultFramebufferQ8: deterministicDefaultFramebufferQ8,
			deterministicNoDitherPngQ8: deterministicPngQ8,
			defaultFramebufferRgba: defaultRgba,
			pngDecodedRgba: normalPngRgba,
			defaultFramebufferQ8,
			pngQ8,
			dither: {
				initiallyEnabled: ditherInitiallyEnabled,
				deterministicEnabledBeforeDraw: deterministicDitherEnabledBeforeDraw,
				deterministicEnabledAfterDraw: deterministicDitherEnabledAfterDraw,
				normalEnabledBeforeDraw: normalDitherEnabledBeforeDraw,
				normalEnabledAfterDraw: normalDitherEnabledAfterDraw,
				restoredEnabled: context.isEnabled(context.DITHER),
			},
			drawControl: {
				fullscreenTriangle: true,
				frustumCulled: mesh.frustumCulled,
				programDiagnostics,
				webglError,
				allFloatAlphaOne: rgba32f.every((rgba) => Object.is(Math.fround(rgba[3]), Math.fround(1))),
				nonzeroFloatRgbCount: rgba32f.filter((rgba) => rgba.slice(0, 3).some((value) => value !== 0)).length,
			},
			requiredOfficialCtlEncoding:
				deterministicDefaultFramebufferQ8.classification === 'identity-q8' &&
				deterministicPngQ8.classification === 'identity-q8'
					? 'srgb-piecewise'
					: deterministicDefaultFramebufferQ8.classification === 'srgb-oetf-q8' &&
						  deterministicPngQ8.classification === 'srgb-oetf-q8'
						? 'none-renderer-supplies-srgb-oetf'
						: 'unresolved-reject',
		};
	} finally {
		if (ditherInitiallyEnabled) context.enable(context.DITHER);
		else context.disable(context.DITHER);
		geometry.dispose();
		material.dispose();
		floatTarget.dispose();
	}
}

/** Invert one finite row-major three-by-three matrix. */
function invertMatrix3(matrix) {
	const [[a, b, c], [d, e, f], [g, h, i]] = matrix;
	const determinant = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
	if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-15) {
		throw new RangeError('XYZ-to-linear-sRGB matrix must be finite and invertible.');
	}
	return [
		[(e * i - f * h) / determinant, (c * h - b * i) / determinant, (b * f - c * e) / determinant],
		[(f * g - d * i) / determinant, (a * i - c * g) / determinant, (c * d - a * f) / determinant],
		[(d * h - e * g) / determinant, (b * g - a * h) / determinant, (a * e - b * d) / determinant],
	];
}

/** Reconstruct CIE XYZ from the production signed-linear sRGB coordinates. */
function linearSrgbToXyz(linearSrgb) {
	const inverse = invertMatrix3(FIGURE1_DISPLAY_CONSTANTS.xyzToLinearSrgbMatrix);
	return inverse.map((row) => dot(row, linearSrgb));
}

/** Validate and return the frozen production Figure-1 display constants. */
function fixedDisplayConstants(fixture) {
	const expected = fixture.fixedSceneScale;
	if (
		expected?.owner !== 'BrunetonColorDisplayModel.DISPLAY_TONE_MAP_K' ||
		expected.variable !== false ||
		FIGURE1_DISPLAY_CONSTANTS.maxLuminousEfficacy.value !== expected.luminousEfficacyLumensPerWatt ||
		FIGURE1_DISPLAY_CONSTANTS.maxLuminousEfficacy.units !== 'lumens-per-watt' ||
		FIGURE1_DISPLAY_CONSTANTS.brunetonComparisonToneMapExposureScale !== expected.referenceLuminanceMultiplier ||
		FIGURE1_DISPLAY_CONSTANTS.paperFigure1ToneMapK !== expected.value
	) {
		throw new Error('Production Figure-1 display constants differ from the frozen GPU visual fixture.');
	}
	return {
		conversionKind: FIGURE1_DISPLAY_CONSTANTS.conversionKind,
		outputColorSpace: FIGURE1_DISPLAY_CONSTANTS.outputColorSpace,
		maxLuminousEfficacy: {...FIGURE1_DISPLAY_CONSTANTS.maxLuminousEfficacy},
		brunetonComparisonToneMapExposureScale: FIGURE1_DISPLAY_CONSTANTS.brunetonComparisonToneMapExposureScale,
		paperFigure1ToneMapK: FIGURE1_DISPLAY_CONSTANTS.paperFigure1ToneMapK,
		xyzToLinearSrgbMatrix: FIGURE1_DISPLAY_CONSTANTS.xyzToLinearSrgbMatrix.map((row) => [...row]),
		demoGammaPowerOmitted: FIGURE1_DISPLAY_CONSTANTS.demoGammaPowerOmitted,
		demoWhitePointOmitted: FIGURE1_DISPLAY_CONSTANTS.demoWhitePointOmitted,
	};
}

/** Build one exact production model without creating any CPU cache or CPU evaluator. */
function createConditionModel(family, condition, fixture) {
	const profile = DEFAULT_NATIVE_PRODUCTION_PROFILE;
	const familyFixture = fixture[family];
	const observation = observationFromCondition(family, condition, familyFixture);
	const sceneScale = unitValue(fixture.sceneScale, DEFAULT_SCENE_SCALE, 'meters-per-scene-unit', 'sceneScale');
	const color = new SunAppearanceGpuVisualColor();
	let geometry;
	let lightSource;
	let celestialSources;
	let observerHeightMeters;

	if (family === 'distant') {
		const observerHeight = unitValue(
			familyFixture.location?.observerHeightMeters,
			DEFAULT_OBSERVER_HEIGHT,
			'meters',
			'observerHeight',
		);
		observerHeightMeters = observerHeight.value;
		const observerUpDirection = normalizeDirection(
			familyFixture.observerUpDirection ?? DEFAULT_OBSERVER_UP_DIRECTION,
			'observerUpDirection',
		);
		geometry = new SphericalEarthGeometry({
			bottomRadius: profile.physical.geometry.bottomRadius,
			topRadius: profile.physical.geometry.topRadius,
			observerHeight,
			observerUpDirection,
			sceneFrame: {kind: 'observer-local'},
			cacheAltitudeBinCount: NATIVE_48_POSITION_DOMAIN_OWNER.count,
			cacheBoundaryAltitude: NATIVE_48_POSITION_DOMAIN_OWNER.nodes[0].coordinate,
			sourceTransmittanceIntervalCount: profile.numerical.sourcePathTransmittance.intervalCount,
		});
		lightSource = new DistantSunLightSource({
			angularRadius: unitValue(familyFixture.sunAngularRadiusRadians, 0.004675, 'radians', 'sunAngularRadius'),
		});
		celestialSources = {
			id: 'sun-appearance-gpu-visual-spherical-distant-sun',
			family: 'spherical-sun-stars-radial-v1',
			sun: lightSource,
			stars: null,
		};
	} else {
		const observerPosition = {
			coordinates: familyFixture.location.observerMeters,
			units: 'meters',
		};
		observerHeightMeters = observerPosition.coordinates[2];
		const topAltitude = unitValue(
			familyFixture.geometry.topAltitudeMeters,
			DEFAULT_FLAT_TOP_ALTITUDE,
			'meters',
			'topAltitude',
		);
		const sceneSkyRayLimit = unitValue(
			familyFixture.geometry.observerDomeMaximumViewRayMeters,
			DEFAULT_FLAT_VIEW_RAY_LIMIT,
			'meters',
			'sceneSkyRayLimit',
		);
		geometry = new FlatEarthGeometry({
			observerPosition,
			topAltitude,
			localLightSourceHeight: unitValue(
				familyFixture.source.heightMeters,
				DEFAULT_LOCAL_SOURCE_HEIGHT,
				'meters',
				'localLightSourceHeight',
			),
			projectionRadius: profile.physical.geometry.bottomRadius,
			sceneSkyRayLimit,
			observerCenteredDome: {
				centerPolicy: 'observer-centered',
				apexAltitude: unitValue(
					familyFixture.geometry.observerDomeApexMeters,
					topAltitude,
					'meters',
					'domeApexAltitude',
				),
				maxObserverViewRayExtent: sceneSkyRayLimit,
			},
		});
		lightSource = new LocalSunLightSource({
			sourceKey: familyFixture.source.sourceId,
			referenceDistance: unitValue(
				familyFixture.geometry.referenceDistanceMeters,
				DEFAULT_LOCAL_REFERENCE_DISTANCE,
				'meters',
				'referenceDistance',
			),
			referenceSpectralIncidentScale: 1,
			radius: unitValue(
				familyFixture.source.radiusMeters,
				DEFAULT_LOCAL_SOURCE_RADIUS,
				'meters',
				'localSourceRadius',
			),
			distanceFalloff: true,
			sourceTransmittanceIntervalCount: profile.numerical.sourcePathTransmittance.intervalCount,
		});
		celestialSources = {
			id: 'sun-appearance-gpu-visual-flat-local-finite-sun',
			family: 'flat-local-finite-sun-v1',
			localSun: lightSource,
		};
	}
	const atmosphere = new CanonicalAtmosphere();
	const algorithm = new Algorithm32({
		lightSource,
		atmosphere,
		geometry,
		groundBoundary: null,
		celestialSources,
		color,
		observation,
		execution: {
			pathIntervalCount: profile.numerical.viewPath.intervalCount,
			maximumScatteringOrder: 4,
		},
	});
	return {
		algorithm,
		geometry,
		lightSource,
		celestialSources,
		observation,
		sceneScale,
		cameraScenePosition: [0, observerHeightMeters / sceneScale.value, 0],
	};
}

/** Resolve source direction, model up, and apparent disk radius from production owners. */
function sourceFacts(family, model) {
	if (family === 'distant') {
		const definition = model.lightSource.celestialSourceDefinition;
		return {
			directionModel: normalizeDirection(
				model.geometry.configuration.directionToSource,
				'distant source direction',
			),
			upModel: normalizeDirection(model.geometry.configuration.observerUpDirection, 'distant observer up'),
			apparentRadiusRadians: definition.angularRadius.value,
			apparentRadiusDegrees: (definition.angularRadius.value * 180) / Math.PI,
			distanceMeters: null,
			surfaceRadiance: Array.from(definition.surfaceRadiance.values),
		};
	}
	const relative = model.geometry.resolveSourceRelativePosition({
		position: model.geometry.configuration.observerPosition,
	});
	const distanceMeters = relative.distanceFromSource.value;
	const radiusMeters = model.lightSource.celestialSourceDefinition.radius.value;
	return {
		directionModel: normalizeDirection(relative.directionToSource, 'local source direction'),
		upModel: [0, 0, 1],
		apparentRadiusRadians: Math.asin(Math.min(1, radiusMeters / distanceMeters)),
		apparentRadiusDegrees: (Math.asin(Math.min(1, radiusMeters / distanceMeters)) * 180) / Math.PI,
		distanceMeters,
		centerMeters: Array.from(model.lightSource.configuration.position.coordinates),
		radiusMeters,
		cacheRadialMaximumMeters: model.geometry.configuration.cacheRadialMaximum.value,
		surfaceRadiance: Array.from(model.lightSource.celestialSourceDefinition.surfaceRadiance.values),
	};
}

/** Capture every declared GPU stage for one aimed center pixel. */
async function captureSample({
	renderer,
	canvas,
	composer,
	runtimePass,
	bindingValues,
	model,
	family,
	camera,
	targets,
	sample,
}) {
	const {width, height, verticalFovDegrees} = targets.viewport;
	camera.fov = verticalFovDegrees;
	camera.aspect = width / height;
	const pixel = {x: Math.floor(width / 2), y: Math.floor(height / 2)};
	const textureCoordinates = [(pixel.x + 0.5) / width, (pixel.y + 0.5) / height];
	const directionScene = aimCamera(
		camera,
		model.geometry,
		sample.directionModel,
		targets.upModel,
		textureCoordinates,
	);
	composer.setSize(width, height);
	renderer.setSize(width, height, false);
	Algorithm32Bindings.update({
		bindingValues,
		camera,
		props: {config: model.algorithm.config.config, sceneScale: model.sceneScale},
	});
	runtimePass.uniforms.uSunAppearanceGpuVisualMode.value = DIAGNOSTIC_MODE.normal;
	renderComposerPixel(renderer, composer, pixel);
	const defaultPixel = new Uint8Array(4);
	renderer.setRenderTarget(null);
	renderer
		.getContext()
		.readPixels(
			pixel.x,
			pixel.y,
			1,
			1,
			renderer.getContext().RGBA,
			renderer.getContext().UNSIGNED_BYTE,
			defaultPixel,
		);
	const pngCenterRgba = await decodePngPixel(canvas.toDataURL('image/png'), pixel.x, pixel.y, width, height);
	const readBuffer = composer.readBuffer;
	const pathRadiance = readSpectrum(
		renderer,
		runtimePass,
		readBuffer,
		targets.float,
		pixel,
		DIAGNOSTIC_MODE.pathPacketStart,
	);
	const celestialRadiance = readSpectrum(
		renderer,
		runtimePass,
		readBuffer,
		targets.float,
		pixel,
		DIAGNOSTIC_MODE.celestialPacketStart,
	);
	const preDisplayRadiance = readSpectrum(
		renderer,
		runtimePass,
		readBuffer,
		targets.float,
		pixel,
		DIAGNOSTIC_MODE.preDisplayPacketStart,
	);
	const completedCelestialCache = readSpectrum(
		renderer,
		runtimePass,
		readBuffer,
		targets.float,
		pixel,
		DIAGNOSTIC_MODE.cachePacketStart,
	);
	let distantStencil = null;
	if (family === 'distant') {
		const indices = renderAuxiliaryMode(
			renderer,
			runtimePass,
			readBuffer,
			targets.float,
			pixel,
			DIAGNOSTIC_MODE.distantStencilIndices,
		);
		const weights = renderAuxiliaryMode(
			renderer,
			runtimePass,
			readBuffer,
			targets.float,
			pixel,
			DIAGNOSTIC_MODE.distantStencilWeights,
		);
		distantStencil = {
			valid: weights.every((value) => value >= 0),
			receiverIndices: indices.slice(0, 2),
			directionIndices: indices.slice(2, 4),
			receiverWeights: weights.slice(0, 2),
			directionWeights: weights.slice(2, 4),
		};
	}
	const signedLinearRgba = renderAuxiliaryMode(
		renderer,
		runtimePass,
		readBuffer,
		targets.float,
		pixel,
		DIAGNOSTIC_MODE.signedLinearRgb,
	);
	const directY = renderAuxiliaryMode(
		renderer,
		runtimePass,
		readBuffer,
		targets.float,
		pixel,
		DIAGNOSTIC_MODE.directY,
	);
	const mapperRgba32f = renderAuxiliaryMode(
		renderer,
		runtimePass,
		readBuffer,
		targets.float,
		pixel,
		DIAGNOSTIC_MODE.mapper,
	);
	const mapperRgba16f = renderAuxiliaryMode(
		renderer,
		runtimePass,
		readBuffer,
		targets.half,
		pixel,
		DIAGNOSTIC_MODE.mapper,
	);
	const coverage = renderAuxiliaryMode(
		renderer,
		runtimePass,
		readBuffer,
		targets.float,
		pixel,
		DIAGNOSTIC_MODE.coverage,
	);
	const state = renderAuxiliaryMode(renderer, runtimePass, readBuffer, targets.float, pixel, DIAGNOSTIC_MODE.state);
	const actualRayDirectionModel = normalizeDirection(
		renderAuxiliaryMode(
			renderer,
			runtimePass,
			readBuffer,
			targets.float,
			pixel,
			DIAGNOSTIC_MODE.rayDirection,
		).slice(0, 3),
		'shader ray direction',
	);
	const signedLinearRgb = signedLinearRgba.slice(0, 3);
	return {
		id: sample.id,
		orientation: sample.orientation,
		angularOffsetRadians: sample.angularOffsetRadians,
		directionModel: sample.directionModel,
		directionScene,
		pixel: {...pixel, textureCoordinates},
		actualRayDirectionModel,
		requestedRayAngularResidualRadians: Math.acos(
			Math.max(-1, Math.min(1, dot(actualRayDirectionModel, sample.directionModel))),
		),
		gpu: {
			completedCelestialCacheSpectrum: completedCelestialCache.values,
			cacheLookup:
				family === 'distant'
					? {
							route: 'sampleDistantSunCelestialRadiance(resolveDistantSunCelestialCacheStencil())',
							bindingIdentity: 'cache.celestial.sunTransport',
							stencil: distantStencil,
						}
					: {
							route: 'sampleFlatFiniteSunRadiance()',
							bindingIdentity: 'cache.celestial.localSunRadiance',
							stencil: null,
							stencilReason: 'The Flat finite-Sun cache is one exact 1x1x15 scalar field.',
						},
			pathSpectrum: pathRadiance.values,
			celestialSpectrum: celestialRadiance.values,
			preDisplaySpectrum: preDisplayRadiance.values,
			cieXyz: linearSrgbToXyz(signedLinearRgb),
			directY: directY[0],
			directPathY: directY[1],
			directCelestialY: directY[2],
			signedLinearRgb,
			mapperRgb: mapperRgba32f.slice(0, 3),
			mapperRgba32f,
			mapperRgba16f,
			framebufferCodes: Array.from(defaultPixel).slice(0, 3),
			pngCodes: pngCenterRgba.slice(0, 3),
		},
		pathRadiance,
		celestialRadiance,
		preDisplayRadiance,
		completedCelestialCache,
		mapperFloatRgba: mapperRgba32f,
		mapperProductionLikeHalfFloatRgba: mapperRgba16f,
		defaultFramebufferRgba: Array.from(defaultPixel),
		pngCenterRgba,
		rasterSubsamples: coverage.slice(0, 4).map((value) => value >= 0.5),
		coverage: coverage.slice(0, 4).reduce((sum, value) => sum + value, 0) / 4,
		state: {
			sceneHit: state[0] >= 0.5,
			pathValid: state[1] >= 0.5,
			hasSceneEndpoint: state[2] >= 0.5,
			hasGroundEndpoint: state[3] >= 0.5,
		},
	};
}

/** Capture a full normal mapper PNG and full signed-linear RGBA32F frame from one fresh GPU render. */
function captureFullFrame({
	renderer,
	canvas,
	composer,
	runtimePass,
	bindingValues,
	model,
	camera,
	target,
	viewport,
	sample,
	upModel,
}) {
	camera.fov = viewport.verticalFovDegrees;
	camera.aspect = viewport.width / viewport.height;
	aimCamera(camera, model.geometry, sample.directionModel, upModel);
	composer.setSize(viewport.width, viewport.height);
	renderer.setSize(viewport.width, viewport.height, false);
	Algorithm32Bindings.update({
		bindingValues,
		camera,
		props: {config: model.algorithm.config.config, sceneScale: model.sceneScale},
	});
	runtimePass.uniforms.uSunAppearanceGpuVisualMode.value = DIAGNOSTIC_MODE.normal;
	composer.render();
	const productionMapperPngDataUrl = canvas.toDataURL('image/png');
	const productionFramebufferRgba8 = new Uint8Array(viewport.width * viewport.height * 4);
	renderer.getContext().readPixels(0, 0, viewport.width, viewport.height, renderer.getContext().RGBA, renderer.getContext().UNSIGNED_BYTE, productionFramebufferRgba8);
	const previousTarget = renderer.getRenderTarget();
	target.scissorTest = false;
	runtimePass.renderToScreen = false;
	try {
		const preDisplayPacketDataBase64 = [];
		for (let packetIndex = 0; packetIndex < SPECTRAL_PACKET_COUNT; packetIndex += 1) {
			runtimePass.uniforms.uSunAppearanceGpuVisualMode.value = DIAGNOSTIC_MODE.preDisplayPacketStart + packetIndex;
			runtimePass.render(renderer, target, composer.readBuffer);
			const packetValues = new Float32Array(viewport.width * viewport.height * 4);
			renderer.readRenderTargetPixels(target, 0, 0, viewport.width, viewport.height, packetValues);
			preDisplayPacketDataBase64.push(bytesToBase64(new Uint8Array(packetValues.buffer)));
		}
		runtimePass.uniforms.uSunAppearanceGpuVisualMode.value = DIAGNOSTIC_MODE.signedLinearRgb;
		runtimePass.render(renderer, target, composer.readBuffer);
		const values = new Float32Array(viewport.width * viewport.height * 4);
		renderer.readRenderTargetPixels(target, 0, 0, viewport.width, viewport.height, values);
		runtimePass.uniforms.uSunAppearanceGpuVisualMode.value = DIAGNOSTIC_MODE.mapper;
		runtimePass.render(renderer, target, composer.readBuffer);
		const mapperValues = new Float32Array(viewport.width * viewport.height * 4);
		renderer.readRenderTargetPixels(target, 0, 0, viewport.width, viewport.height, mapperValues);
		let finite = true;
		let minimum = Number.POSITIVE_INFINITY;
		let maximum = Number.NEGATIVE_INFINITY;
		for (let index = 0; index < values.length; index += 4) {
			for (let channelIndex = 0; channelIndex < 3; channelIndex += 1) {
				const value = values[index + channelIndex];
				finite &&= Number.isFinite(value);
				minimum = Math.min(minimum, value);
				maximum = Math.max(maximum, value);
			}
		}
		return {
			width: viewport.width,
			height: viewport.height,
			channels: 4,
			verticalFovDegrees: viewport.verticalFovDegrees,
			cameraSampleId: sample.id,
			encoding: 'float32-le-base64',
			rowOrigin: 'bottom-left',
			channelOrder: 'RGBA',
			byteLength: values.byteLength,
			finite,
			minimumSignedRgb: minimum,
			maximumSignedRgb: maximum,
			dataBase64: bytesToBase64(new Uint8Array(values.buffer, values.byteOffset, values.byteLength)),
			mapperDataBase64: bytesToBase64(
				new Uint8Array(mapperValues.buffer, mapperValues.byteOffset, mapperValues.byteLength),
			),
			preDisplayPacketDataBase64,
			productionFramebufferRgba8Base64: bytesToBase64(productionFramebufferRgba8),
			productionMapperPngDataUrl,
		};
	} finally {
		renderer.setRenderTarget(previousTarget);
	}
}

/** Form every GPU disk-versus-circumsolar Y comparison for one condition. */
function createRawOrdering(conditionId, family, viewportId, samples) {
	const comparisons = [];
	const diskSamples = samples.filter((sample) => sample.id === 'disk-center' || sample.id.startsWith('inside-limb'));
	const skySamples = samples.filter((sample) => sample.id.startsWith('circumsolar-'));
	for (const disk of diskSamples) {
		for (const sky of skySamples) {
			const diskEvidenceValid = disk.coverage > 0 && disk.gpu.directCelestialY > 0;
			comparisons.push({
				id: `${conditionId}:${viewportId}:${disk.id}>${sky.id}`,
				conditionId,
				family,
				viewportId,
				diskSampleId: disk.id,
				skySampleId: sky.id,
				metric: 'gpu-direct-photopic-Y',
				gpuDiskY: disk.gpu.directY,
				gpuSkyY: sky.gpu.directY,
				diskCoverage: disk.coverage,
				diskDirectCelestialY: disk.gpu.directCelestialY,
				diskEvidenceValid,
				margin: disk.gpu.directY - sky.gpu.directY,
				gpuStrictlyOrdered: diskEvidenceValid && disk.gpu.directY > sky.gpu.directY,
			});
		}
	}
	return {
		comparisonCount: comparisons.length,
		validComparisonCount: comparisons.filter((comparison) => comparison.diskEvidenceValid).length,
		allStrictlyOrdered: comparisons.every((comparison) => comparison.gpuStrictlyOrdered),
		comparisons,
	};
}

/** Return browser, GPU, renderer, and framebuffer facts for the normal-path evidence. */
function rendererFacts(renderer) {
	const context = renderer.getContext();
	const debug = context.getExtension('WEBGL_debug_renderer_info');
	return {
		userAgent: navigator.userAgent,
		webgl: {
			version: context.getParameter(context.VERSION),
			shadingLanguageVersion: context.getParameter(context.SHADING_LANGUAGE_VERSION),
			vendor: context.getParameter(context.VENDOR),
			renderer: context.getParameter(context.RENDERER),
			unmaskedVendor: debug ? context.getParameter(debug.UNMASKED_VENDOR_WEBGL) : null,
			unmaskedRenderer: debug ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null,
			softwareRendererDetected:
				/swiftshader|software|llvmpipe|lavapipe|\bwarp\b|microsoft basic render driver/iu.test(
					[
						context.getParameter(context.RENDERER),
						debug ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL) : '',
					].join(' '),
				),
			contextAttributes: context.getContextAttributes(),
			ditherEnabled: context.isEnabled(context.DITHER),
			drawingBufferColorSpace: context.drawingBufferColorSpace ?? null,
			defaultFramebufferBits: {
				red: context.getParameter(context.RED_BITS),
				green: context.getParameter(context.GREEN_BITS),
				blue: context.getParameter(context.BLUE_BITS),
				alpha: context.getParameter(context.ALPHA_BITS),
			},
		},
		three: {
			revision: THREE.REVISION,
			outputColorSpace: renderer.outputColorSpace,
			toneMapping: renderer.toneMapping,
			capabilities: {
				isWebGL2: renderer.capabilities.isWebGL2,
				precision: renderer.capabilities.precision,
				maxTextureSize: renderer.capabilities.maxTextureSize,
			},
		},
	};
}

/** Validate and return the fixture's complete provisional visual viewport inventory. */
function acceptedViewports(fixture) {
	if (!Array.isArray(fixture.viewports) || fixture.viewports.length !== fixture.sampling.requiredViewportCount) {
		throw new Error('GPU visual viewport inventory differs from its declared count.');
	}
	return fixture.viewports.map((request) => {
		const width = Number(request?.widthPixels);
		const height = Number(request?.heightPixels);
		const verticalFovDegrees = Number(request?.verticalFovDegrees);
		if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) {
			throw new RangeError('GPU visual viewport dimensions must be positive integers.');
		}
		if (fixture.sampling?.centerPixelMustBeOpticalAxis === true && (width % 2 !== 1 || height % 2 !== 1)) {
			throw new RangeError('Optical-axis sampling requires odd viewport dimensions.');
		}
		if (!(verticalFovDegrees > 0 && verticalFovDegrees < 180)) {
			throw new RangeError('GPU visual vertical FOV must be in (0, 180).');
		}
		return {id: request.id, width, height, verticalFovDegrees};
	});
}

/** Select exactly one authored condition for one isolated browser process. */
function selectCondition(fixture, executionShard) {
	const conditions = [
		...(fixture.distant?.conditions ?? []).map((condition) => ({family: 'distant', condition})),
		...(fixture.flat?.conditions ?? []).map((condition) => ({family: 'flat', condition})),
	];
	if (conditions.length !== fixture.sampling.requiredConditionCount) {
		throw new Error('GPU visual condition inventory differs from its declared count.');
	}
	if (executionShard === null || typeof executionShard !== 'object' || Array.isArray(executionShard)) {
		throw new TypeError('GPU visual execution requires one condition shard.');
	}
	const selected = conditions.filter(
		(request) => request.family === executionShard.family && request.condition.id === executionShard.conditionId,
	);
	if (
		selected.length !== 1 ||
		executionShard.conditionCount !== conditions.length ||
		conditions[executionShard.conditionIndex - 1]?.family !== executionShard.family ||
		conditions[executionShard.conditionIndex - 1]?.condition.id !== executionShard.conditionId
	) {
		throw new Error('GPU visual execution shard does not match the ordered fixture inventory.');
	}
	return selected[0];
}

/** Execute one condition through the real production GPU cache, shader, composer, and readout seam. */
async function runCondition(renderer, canvas, fixture, family, condition, viewports, reportProgress) {
	const model = createConditionModel(family, condition, fixture);
	const firstViewport = viewports[0];
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);
	const camera = new THREE.PerspectiveCamera(
		firstViewport.verticalFovDegrees,
		firstViewport.width / firstViewport.height,
		0.001,
		10000,
	);
	camera.position.set(...model.cameraScenePosition);
	const sceneTarget = new THREE.WebGLRenderTarget(firstViewport.width, firstViewport.height, {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBAFormat,
		type: THREE.HalfFloatType,
		depthBuffer: true,
		stencilBuffer: false,
	});
	sceneTarget.texture.name = 'SunAppearanceGpuVisual.productionSceneInput';
	sceneTarget.texture.colorSpace = THREE.NoColorSpace;
	const composer = new EffectComposer(renderer, sceneTarget);
	composer.setPixelRatio(1);
	composer.setSize(firstViewport.width, firstViewport.height);
	composer.addPass(new RenderPass(scene, camera));
	const backend = new ThreeCacheBackend({THREE, renderer});
	const sceneDepthMax = model.geometry.resolveSceneDepthMax();
	const bindingValues = Algorithm32Bindings.create(THREE, sceneDepthMax);
	const facts = sourceFacts(family, model);
	const samples = createSamples(
		facts.directionModel,
		facts.upModel,
		facts.apparentRadiusRadians,
		fixture.sampling,
		condition,
	);
	aimCamera(camera, model.geometry, samples[0].directionModel, facts.upModel);
	Algorithm32Bindings.update({
		bindingValues,
		camera,
		props: {config: model.algorithm.config.config, sceneScale: model.sceneScale},
	});
	let handle;
	let lastCacheHeartbeatAt = performance.now();
	let cacheHeartbeatSequence = 0;
	let cacheSchedulerYieldCount = 0;
	try {
		const gpuStartedAt = performance.now();
		await reportProgress({stage: 'gpu-setup-start'});
		handle = await model.algorithm.setupShader({
			THREE,
			composer,
			scene,
			camera,
			viewportSize: {width: firstViewport.width, height: firstViewport.height, units: 'pixels'},
			sceneScale: model.sceneScale,
			sceneDepthMax,
			bindingValues,
			cacheBackend: backend,
			cacheBuildScheduler: {
				async yieldControl() {
					await new Promise((resolveYield) => requestAnimationFrame(() => resolveYield()));
					cacheSchedulerYieldCount += 1;
					const now = performance.now();
					if (now - lastCacheHeartbeatAt >= CACHE_HEARTBEAT_INTERVAL_MILLISECONDS) {
						cacheHeartbeatSequence += 1;
						lastCacheHeartbeatAt = now;
						await reportProgress({
							stage: 'condition-heartbeat',
							phase: 'gpu-cache-build',
							heartbeatSequence: cacheHeartbeatSequence,
							workCompleted: cacheSchedulerYieldCount,
							workUnit: 'cache-scheduler-yield',
							phaseDurationMilliseconds: now - gpuStartedAt,
						});
					}
				},
			},
		});
		await handle.prepare(renderer);
		const gpuSetupAndCacheBuildMilliseconds = performance.now() - gpuStartedAt;
		await reportProgress({stage: 'gpu-setup-complete', gpuSetupAndCacheBuildMilliseconds});
		const shaderSource = handle._buildResult?.assembly?.fragmentShaderSource;
		if (typeof shaderSource !== 'string') throw new Error('Algorithm32 retained no assembled shader source.');
		if (shaderSource.includes('uSkyExposureCoefficientTexture')) {
			throw new Error('Rejected sky-exposure binding appeared in the GPU visual shader.');
		}
		if (!shaderSource.includes('celestialRadiance') || !shaderSource.includes('preDisplayRadiance')) {
			throw new Error('Production GPU celestial/pre-display composition vocabulary is absent.');
		}
		const runtimePass = composer.passes.find((pass) => pass?.uniforms?.uSunAppearanceGpuVisualMode !== undefined);
		if (runtimePass === undefined) throw new Error('GPU visual terminal readout pass was not installed.');
		const cacheBindingValueKey =
			family === 'distant' ? 'cache.celestial.sunTransport' : 'cache.celestial.localSunRadiance';
		const cacheBindingRequirement = handle._buildResult.bindingRequirements.find(
			(requirement) => requirement.valueKey === cacheBindingValueKey,
		);
		if (cacheBindingRequirement === undefined) {
			throw new Error(`Production GPU cache binding ${cacheBindingValueKey} is absent.`);
		}
		const stencilContribution = handle._buildResult.assembly.contributions.find(
			(contribution) => contribution.id === 'geometry-spherical-celestial-cache-stencil',
		);
		const cacheLookupContract = {
			route:
				family === 'distant'
					? 'sampleDistantSunCelestialRadiance(resolveDistantSunCelestialCacheStencil())'
					: 'sampleFlatFiniteSunRadiance()',
			fieldId: family === 'distant' ? 'distant-sun-celestial-transport' : 'flat-finite-sun-surface-radiance',
			storage:
				family === 'distant'
					? {format: 'R32F', width: 11, height: 13, layers: 15}
					: {format: 'R32F', width: 1, height: 1, layers: 15},
			bindingRequirement: cacheBindingRequirement,
			distantStencilDiagnostics: family === 'distant' ? (stencilContribution?.diagnostics ?? null) : null,
			stencil:
				family === 'distant'
					? 'receiver and direction bilinear indices/weights captured per sample'
					: 'not-applicable: the Flat field is one exact 1x1x15 texel stack',
		};
		const viewportResults = [];
		let preview = null;
		for (let viewportIndex = 0; viewportIndex < viewports.length; viewportIndex += 1) {
			const viewport = viewports[viewportIndex];
			const floatTarget = createTarget(
				viewport.width,
				viewport.height,
				THREE.FloatType,
				'RGBA32F',
				`SunAppearanceGpuVisual.${condition.id}.${viewport.id}.rgba32f`,
			);
			const halfTarget = createTarget(
				viewport.width,
				viewport.height,
				THREE.HalfFloatType,
				'RGBA16F',
				`SunAppearanceGpuVisual.${condition.id}.${viewport.id}.rgba16f`,
			);
			try {
				const sampleResults = [];
				for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex += 1) {
					const sample = samples[sampleIndex];
					await reportProgress({
						stage: 'sample-start',
						viewportIndex: viewportIndex + 1,
						viewportCount: viewports.length,
						viewportId: viewport.id,
						sampleIndex: sampleIndex + 1,
						sampleCount: samples.length,
						sampleId: sample.id,
					});
					const sampleStartedAt = performance.now();
					sampleResults.push(
						await captureSample({
							renderer,
							canvas,
							composer,
							runtimePass,
							bindingValues,
							model,
							family,
							camera,
							targets: {
								viewport,
								upModel: facts.upModel,
								float: floatTarget,
								half: halfTarget,
							},
							sample,
						}),
					);
					await reportProgress({
						stage: 'sample-complete',
						viewportIndex: viewportIndex + 1,
						viewportCount: viewports.length,
						viewportId: viewport.id,
						sampleIndex: sampleIndex + 1,
						sampleCount: samples.length,
						sampleId: sample.id,
						durationMilliseconds: performance.now() - sampleStartedAt,
					});
				}
				viewportResults.push({
					...viewport,
					samples: sampleResults,
					rawOrdering: createRawOrdering(condition.id, family, viewport.id, sampleResults),
				});
				if (condition.requiredPreview === true && viewportIndex === 0) {
					await reportProgress({stage: 'preview-start', viewportId: viewport.id});
					const previewStartedAt = performance.now();
					preview = captureFullFrame({
						renderer,
						canvas,
						composer,
						runtimePass,
						bindingValues,
						model,
						camera,
						target: floatTarget,
						viewport,
						sample: samples[0],
						upModel: facts.upModel,
					});
					await reportProgress({
						stage: 'preview-complete',
						viewportId: viewport.id,
						durationMilliseconds: performance.now() - previewStartedAt,
						byteLength: preview.byteLength,
					});
				}
			} finally {
				floatTarget.dispose();
				halfTarget.dispose();
			}
		}
		const diagnostics = handle.getDiagnostics();
		if (diagnostics?.runtime?.skyExposure != null) {
			throw new Error('Rejected sky-exposure runtime appeared in GPU visual diagnostics.');
		}
		return {
			id: condition.id,
			family,
			observation: model.observation,
			executionBackend: 'gpu',
			cpuReferenceUsed: false,
			sourcePathConvergenceEvaluated: false,
			gpuSetupAndCacheBuildMilliseconds,
			sceneScale: model.sceneScale,
			source: facts,
			profile: {
				id: DEFAULT_NATIVE_PRODUCTION_PROFILE.id,
				spectralBasisHash: DEFAULT_NATIVE_PRODUCTION_PROFILE.spectral.basis.contentHash,
				viewPathIntervalCount: DEFAULT_NATIVE_PRODUCTION_PROFILE.numerical.viewPath.intervalCount,
				sourcePathIntervalCount:
					DEFAULT_NATIVE_PRODUCTION_PROFILE.numerical.sourcePathTransmittance.intervalCount,
			},
			cacheLookupContract,
			shaderSource,
			shaderSourceHash: handle._buildResult.assembly.sourceHash,
			diagnostics,
			viewports: viewportResults,
			preview,
		};
	} finally {
		handle?.dispose();
		model.algorithm.dispose();
		composer.dispose();
		sceneTarget.dispose();
		backend.dispose();
	}
}

/**
 * Run one authored Sun-appearance scene through the production GPU normal path.
 *
 * The caller supplies and persists authored fixture data. The function performs
 * no filesystem writes and returns in-memory evidence suitable for direct ACES
 * transformation in the same fresh browser execution.
 */
export async function runProductionSunAppearanceGpuVisualScene(
	fixture,
	reportProgress = async () => {},
	executionShard = null,
) {
	if (fixture === null || typeof fixture !== 'object' || Array.isArray(fixture)) {
		throw new TypeError('GPU visual fixture must be one object.');
	}
	if (fixture.schemaVersion !== 'production-sun-appearance-gpu-visual-v1') {
		throw new Error('GPU visual fixture schema is unsupported.');
	}
	if (typeof reportProgress !== 'function') throw new TypeError('GPU visual progress reporter must be a function.');
	if (
		fixture.finalVerificationDeferred?.cpuReferenceAuthority !== true ||
		fixture.finalVerificationDeferred?.sourcePathConvergence20Through1280 !== true ||
		fixture.finalVerificationDeferred?.gpuCpuResidualQualification !== true
	) {
		throw new Error('GPU visual fixture must explicitly defer CPU/refined authority to final verification.');
	}
	const displayConstants = fixedDisplayConstants(fixture);
	const selected = selectCondition(fixture, executionShard);
	const viewports = acceptedViewports(fixture);
	const maximumWidth = Math.max(
		...viewports.map((viewport) => viewport.width),
		fixture.outputContract.sentinelLinearValues.length,
	);
	const maximumHeight = Math.max(...viewports.map((viewport) => viewport.height));
	const canvas = document.createElement('canvas');
	canvas.width = maximumWidth;
	canvas.height = maximumHeight;
	const context = canvas.getContext('webgl2', {
		antialias: false,
		alpha: true,
		depth: true,
		preserveDrawingBuffer: true,
	});
	if (context === null) throw new Error('GPU visual evidence requires WebGL2.');
	const renderer = new THREE.WebGLRenderer({canvas, context, antialias: false});
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.setPixelRatio(1);
	renderer.setSize(maximumWidth, maximumHeight, false);
	try {
		await reportProgress({stage: 'output-contract-start'});
		const outputStartedAt = performance.now();
		const outputContract = await measureOutputContract(
			renderer,
			canvas,
			fixture.outputContract.sentinelLinearValues,
		);
		await reportProgress({
			stage: 'output-contract-complete',
			durationMilliseconds: performance.now() - outputStartedAt,
		});
		await reportProgress({stage: 'condition-start'});
		const conditionStartedAt = performance.now();
		const condition = await runCondition(
			renderer,
			canvas,
			fixture,
			selected.family,
			selected.condition,
			viewports,
			reportProgress,
		);
		await reportProgress({
			stage: 'condition-complete',
			totalDurationMilliseconds: performance.now() - conditionStartedAt,
		});
		return {
			schemaVersion: 'production-sun-appearance-gpu-visual-browser-shard-v1',
			fixtureId: fixture.id,
			executionShard,
			executionBackend: 'gpu',
			productionPath: 'Algorithm32.setupShader/prepare + ThreeCacheBackend + installed composer runtime pass',
			cpuReferenceUsed: false,
			sourcePathConvergenceEvaluated: false,
			displayConstants,
			renderer: rendererFacts(renderer),
			outputContract,
			condition,
			claimLimits: {
				status: 'provisional-gpu-visual-evidence-only',
				finalVerification:
					'CPU reference authority, source-path convergence 20..1280, and GPU/CPU residual qualification remain deferred.',
				generatedInputReuse: false,
				resourceCleanup: 'renderer.dispose then guarded renderer.forceContextLoss in the enclosing finally',
			},
		};
	} finally {
		renderer.dispose();
		if (typeof renderer.forceContextLoss === 'function') renderer.forceContextLoss();
	}
}
