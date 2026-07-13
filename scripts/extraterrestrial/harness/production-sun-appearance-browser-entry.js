import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';

import {Algorithm32} from '/snapshot/src/algorithm32/implementation/algorithm32/Algorithm32.js';
import {BrunetonColorDisplayModel} from '/snapshot/src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
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
import {FIGURE1_DISPLAY_CONSTANTS} from '/snapshot/src/algorithm32/implementation/bruneton-color/consts.js';
import {DistantSunCpuCache} from '/snapshot/src/algorithm32/implementation/distant-sun/cache/DistantSunCpuCache.js';
import {DistantSunCelestialCpuCache} from '/snapshot/src/algorithm32/implementation/distant-sun/celestial/DistantSunCelestialCpuCache.js';
import LocalSunCpuCache from '/snapshot/src/algorithm32/implementation/local-sun/cache/LocalSunCpuCache.js';
import {SpectralPacket} from '/snapshot/src/algorithm32/spectral-values/SpectralPacket.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS} from '/snapshot/src/algorithm32/spectral-values/consts.js';

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
const SENTINEL_VALUES = [0, 1 / 255, 0.0031308, 0.018, 0.18, 0.5, 0.75, 1];
const RASTER_SAMPLE_OFFSETS = [
	[-0.25, -0.25],
	[0.25, -0.25],
	[-0.25, 0.25],
	[0.25, 0.25],
];

/** Production Color plus one proof-only terminal diagnostic hook. */
class SunAppearanceDiagnosticColor extends BrunetonColorDisplayModel {
	/** Add one terminal readout contribution after the unchanged production Color contribution. */
	createShaderContribution(request) {
		const productionContribution = super.createShaderContribution(request);
		const family = request.model.celestialSources?.family;

		if (family !== 'spherical-sun-stars-radial-v1' && family !== 'flat-local-finite-sun-v1') {
			throw new RangeError(`Unsupported Sun appearance diagnostic family: ${String(family)}.`);
		}

		return [productionContribution, createDiagnosticContribution(family)];
	}
}

/** Create the geometry-specific four-subsample replay used only for readout. */
function coverageSource(family) {
	if (family === 'spherical-sun-stars-radial-v1') {
		return `vec4 sunAppearanceDiagnosticCoverage(ShaderState state) {
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

	return `vec4 sunAppearanceDiagnosticCoverage(ShaderState state) {
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

/** Create the proof-only shader contribution that exposes already-computed production locals. */
function createDiagnosticContribution(family) {
	return ShaderContributions.createShaderContribution({
		id: 'color-sun-appearance-terminal-diagnostic',
		owner: 'color',
		requires: ['composition.composeSpectralRadiance', 'color.composeSceneColor', 'color.encodeOutput'],
		uniforms: [
			ShaderContributions.createShaderUniformDeclaration(
				'uSunAppearanceDiagnosticMode',
				'int',
				'sunAppearance.diagnosticMode',
				DIAGNOSTIC_MODE.normal,
			),
		],
		functions: [
			ShaderContributions.createShaderSourceBlock(
				'sun-appearance-diagnostic-functions',
				'diagnosticOutput',
				0,
				`vec4 sunAppearanceDiagnosticSpectralPacket(SpectralValue value, int packetIndex) {
	vec4 packet = vec4(0.0);
	int firstChannel = packetIndex * 4;
	for (int componentIndex = 0; componentIndex < 4; componentIndex += 1) {
		int channelIndex = firstChannel + componentIndex;
		if (channelIndex < SPECTRAL_CHANNEL_COUNT) packet[componentIndex] = value.channels[channelIndex];
	}
	return packet;
}

${coverageSource(family)}`,
			),
		],
		mainHooks: [
			ShaderContributions.createShaderSourceBlock(
				'sun-appearance-diagnostic-main',
				'diagnosticOutput',
				0,
				`if (uSunAppearanceDiagnosticMode >= ${DIAGNOSTIC_MODE.pathPacketStart}
		&& uSunAppearanceDiagnosticMode < ${DIAGNOSTIC_MODE.pathPacketStart + SPECTRAL_PACKET_COUNT}) {
		outColor = sunAppearanceDiagnosticSpectralPacket(
			state.pathRadiance,
			uSunAppearanceDiagnosticMode - ${DIAGNOSTIC_MODE.pathPacketStart}
		);
	}
	if (uSunAppearanceDiagnosticMode >= ${DIAGNOSTIC_MODE.celestialPacketStart}
		&& uSunAppearanceDiagnosticMode < ${DIAGNOSTIC_MODE.celestialPacketStart + SPECTRAL_PACKET_COUNT}) {
		outColor = sunAppearanceDiagnosticSpectralPacket(
			celestialRadiance,
			uSunAppearanceDiagnosticMode - ${DIAGNOSTIC_MODE.celestialPacketStart}
		);
	}
	if (uSunAppearanceDiagnosticMode >= ${DIAGNOSTIC_MODE.preDisplayPacketStart}
		&& uSunAppearanceDiagnosticMode < ${DIAGNOSTIC_MODE.preDisplayPacketStart + SPECTRAL_PACKET_COUNT}) {
		outColor = sunAppearanceDiagnosticSpectralPacket(
			preDisplayRadiance,
			uSunAppearanceDiagnosticMode - ${DIAGNOSTIC_MODE.preDisplayPacketStart}
		);
	}
	if (uSunAppearanceDiagnosticMode == ${DIAGNOSTIC_MODE.signedLinearRgb}) {
		outColor = vec4(spectralRadianceToLinearSrgb(preDisplayRadiance), 1.0);
	}
	if (uSunAppearanceDiagnosticMode == ${DIAGNOSTIC_MODE.directY}) {
		outColor = vec4(
			spectralRadianceToPhotopicLuminance(preDisplayRadiance),
			spectralRadianceToPhotopicLuminance(state.pathRadiance),
			spectralRadianceToPhotopicLuminance(celestialRadiance),
			1.0
		);
	}
	if (uSunAppearanceDiagnosticMode == ${DIAGNOSTIC_MODE.mapper}) outColor = state.outputRgba;
	if (uSunAppearanceDiagnosticMode == ${DIAGNOSTIC_MODE.coverage}) {
		outColor = sunAppearanceDiagnosticCoverage(state);
	}
	if (uSunAppearanceDiagnosticMode == ${DIAGNOSTIC_MODE.state}) {
		outColor = vec4(
			state.sceneHitMask,
			state.bounds.valid ? 1.0 : 0.0,
			state.bounds.hasSceneEndpoint ? 1.0 : 0.0,
			state.bounds.hasGroundEndpoint ? 1.0 : 0.0
		);
	}
	if (uSunAppearanceDiagnosticMode == ${DIAGNOSTIC_MODE.rayDirection}) {
		outColor = vec4(state.ray.direction, 1.0);
	}`,
			),
		],
		diagnostics: {
			mode: 'sun-appearance-terminal-readout-v1',
			family,
			spectralPacketCount: SPECTRAL_PACKET_COUNT,
			rasterSubsampleCount: 4,
		},
	});
}

/** Convert a finite number or unit-bearing value to the requested durable shape. */
function unitValue(value, fallback, units, label) {
	const candidate = value ?? fallback;
	const scalar = typeof candidate === 'number' ? candidate : candidate?.value;

	if (!Number.isFinite(scalar)) throw new TypeError(`${label} must be finite.`);
	return typeof candidate === 'number' ? {value: scalar, units} : candidate;
}

/** Normalize a family condition into the exact production observation packet. */
function observationFromCondition(family, condition, familyFixture) {
	const source = condition.observation ?? condition;
	const location = source.location ?? condition.location ?? familyFixture.location;
	const latitude = location?.latitude ?? location?.latitudeDegrees ?? condition.latitudeDegrees;
	const longitude = location?.longitude ?? location?.longitudeDegrees ?? condition.longitudeDegrees;
	const normalizedLocation = {
		latitude: unitValue(latitude, undefined, 'degrees', 'latitude'),
		longitude: unitValue(longitude, undefined, 'degrees', 'longitude'),
	};
	let instant = source.instant ?? condition.instant;

	if (instant === undefined && family === 'flat') {
		const dateBasis = condition.dateBasis ?? location?.dateBasis ?? familyFixture.dateBasis;
		const angleDegrees = Number(condition.flatAngleDegrees ?? condition.angleDegrees);
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

/** Normalize one three-component direction. */
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

/** Create the fixed center, inside-limb, and circumsolar sample inventory. */
function createSamples(sourceDirection, upDirection, apparentRadiusRadians, sampling, condition) {
	const zenithward = tangentDirection(sourceDirection, upDirection);
	const equalElevation = tangentDirection(sourceDirection, cross(upDirection, sourceDirection));
	const insideFactor = Number(sampling.insideLimbRadiusFactor ?? 0.95);
	const circumsolarOffsets = sampling.circumsolarOffsetsDegrees ?? [0.5, 1, 2];
	const orientationIds = condition.radialOrientations ?? ['zenithward', 'equal-elevation'];
	const orientationDirections = {
		zenithward,
		'equal-elevation': equalElevation,
	};

	if (!Number.isFinite(insideFactor) || insideFactor < 0 || insideFactor >= 1) {
		throw new RangeError('insideLimbRadiusFactor must be in [0, 1).');
	}
	if (
		!Array.isArray(orientationIds) ||
		orientationIds.length === 0 ||
		orientationIds.some((id) => !Object.hasOwn(orientationDirections, id))
	) {
		throw new RangeError('radialOrientations must select zenithward and/or equal-elevation.');
	}
	const samples = [
		{id: 'disk-center', directionModel: sourceDirection, angularOffsetRadians: 0, orientation: 'center'},
		{
			id: 'inside-limb-zenithward',
			directionModel: offsetDirection(sourceDirection, zenithward, apparentRadiusRadians * insideFactor),
			angularOffsetRadians: apparentRadiusRadians * insideFactor,
			orientation: 'zenithward',
		},
	];

	for (const offsetDegrees of circumsolarOffsets) {
		if (!Number.isFinite(offsetDegrees) || offsetDegrees <= 0) {
			throw new RangeError('Every circumsolar offset must be positive and finite.');
		}
		const offsetRadians = (offsetDegrees * Math.PI) / 180;
		const idValue = String(offsetDegrees).replace('.', 'p');
		for (const orientation of orientationIds) {
			const tangent = orientationDirections[orientation];
			samples.push({
				id: `circumsolar-${idValue}-degrees-${orientation}`,
				directionModel: offsetDirection(sourceDirection, tangent, offsetRadians),
				angularOffsetRadians: offsetRadians,
				orientation,
			});
		}
	}
	return samples;
}

/** Map one model direction back through the geometry's orthonormal scene basis. */
function modelDirectionToSceneDirection(geometry, modelDirection) {
	const modelRight = geometry.mapObserverLocalSceneDirectionToModelDirection([1, 0, 0]);
	const modelUp = geometry.mapObserverLocalSceneDirectionToModelDirection([0, 1, 0]);
	const modelForward = geometry.mapObserverLocalSceneDirectionToModelDirection([0, 0, -1]);
	return normalizeDirection(
		[dot(modelDirection, modelRight), dot(modelDirection, modelUp), -dot(modelDirection, modelForward)],
		'model-to-scene direction',
	);
}

/** Reconstruct one Three camera ray with the same inverse projection convention as the production shader. */
function cameraRayDirectionScene(camera, textureCoordinates) {
	const worldPoint = new THREE.Vector3(textureCoordinates[0] * 2 - 1, textureCoordinates[1] * 2 - 1, 1).unproject(
		camera,
	);
	return worldPoint.sub(camera.position).normalize();
}

/** Aim one declared raster sample at the requested model direction while retaining stable zenith roll. */
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

/** Create one production-like no-color-space render target. */
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

/** Read one target pixel using the target's declared component type. */
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

/** Render the normal composer path only at the measured optical-axis pixel. */
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

/** Render one diagnostic mode through the already-installed production runtime pass. */
function renderAuxiliaryMode(renderer, runtimePass, readBuffer, target, pixel, mode) {
	const previousTarget = renderer.getRenderTarget();
	const modeUniform = runtimePass.uniforms.uSunAppearanceDiagnosticMode;
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

/** Read one complete 15-channel spectrum from four RGBA32F packets. */
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

/** Decode one PNG data URL through the browser image path and return one pixel. */
async function decodePngPixel(dataUrl, x, y, width, height) {
	const response = await fetch(dataUrl);
	const bitmap = await createImageBitmap(await response.blob(), {colorSpaceConversion: 'none'});
	const decodeCanvas = document.createElement('canvas');
	decodeCanvas.width = width;
	decodeCanvas.height = height;
	const context = decodeCanvas.getContext('2d', {willReadFrequently: true});
	if (context === null) throw new Error('PNG diagnostic requires a 2D decode context.');
	try {
		context.drawImage(bitmap, 0, 0);
		return Array.from(context.getImageData(x, height - 1 - y, 1, 1).data);
	} finally {
		bitmap.close();
	}
}

/** Crop the measured bottom-left-origin framebuffer pixel and round-trip only its 1x1 PNG. */
async function roundTripCroppedPngPixel(canvas, pixel, canvasHeight) {
	const bitmap = await createImageBitmap(canvas, pixel.x, canvasHeight - 1 - pixel.y, 1, 1, {
		colorSpaceConversion: 'none',
	});
	const exportCanvas = document.createElement('canvas');
	exportCanvas.width = 1;
	exportCanvas.height = 1;
	const context = exportCanvas.getContext('2d');
	if (context === null) throw new Error('Cropped PNG diagnostic requires a 2D export context.');
	try {
		context.drawImage(bitmap, 0, 0);
	} finally {
		bitmap.close();
	}
	return decodePngPixel(exportCanvas.toDataURL('image/png'), 0, 0, 1, 1);
}

/** Return the standard sRGB opto-electronic transfer result. */
function srgbOetf(value) {
	return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
}

/** Compare measured bytes with identity and sRGB Q8 hypotheses. */
function classifyQ8(measuredBytes) {
	const identityCodes = SENTINEL_VALUES.map((value) => Math.round(Math.min(1, Math.max(0, value)) * 255));
	const srgbCodes = SENTINEL_VALUES.map((value) => Math.round(Math.min(1, Math.max(0, srgbOetf(value))) * 255));
	const residual = (expected) => Math.max(...measuredBytes.map((value, index) => Math.abs(value - expected[index])));
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

/** Reconstruct CIE XYZ from the production signed linear-sRGB coordinates. */
function linearSrgbToXyz(linearSrgb) {
	const inverse = invertMatrix3(FIGURE1_DISPLAY_CONSTANTS.xyzToLinearSrgbMatrix);
	return inverse.map((row) => dot(row, linearSrgb));
}

/** Encode bytes as base64 without creating one impractically large argument list. */
function bytesToBase64(bytes) {
	const chunkSize = 0x8000;
	let binary = '';
	for (let offset = 0; offset < bytes.length; offset += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(offset, Math.min(bytes.length, offset + chunkSize)));
	}
	return btoa(binary);
}

/** Measure raw material output through float, half-float, default, and PNG boundaries. */
async function measureSentinel(renderer, canvas) {
	const width = SENTINEL_VALUES.length;
	const height = 1;
	renderer.setSize(width, height, false);
	const floatTarget = createTarget(width, height, THREE.FloatType, 'RGBA32F', 'SunAppearance.sentinel.rgba32f');
	const halfTarget = createTarget(width, height, THREE.HalfFloatType, 'RGBA16F', 'SunAppearance.sentinel.rgba16f');
	const vertexShader = `#version 300 es
	in vec3 position;
	void main() { gl_Position = vec4(position, 1.0); }`;
	const fragmentShader = `#version 300 es
	precision highp float;
	out vec4 outColor;
	const float SENTINEL_VALUES[${width}] = float[${width}](${SENTINEL_VALUES.join(', ')});
	void main() {
		int valueIndex = clamp(int(floor(gl_FragCoord.x)), 0, ${width - 1});
		outColor = vec4(vec3(SENTINEL_VALUES[valueIndex]), 1.0);
	}`;
	const material = new THREE.RawShaderMaterial({
		glslVersion: THREE.GLSL3,
		vertexShader: vertexShader.replace(/^#version 300 es\s*/u, ''),
		fragmentShader: fragmentShader.replace(/^#version 300 es\s*/u, ''),
		depthTest: false,
		depthWrite: false,
	});
	const geometry = new THREE.PlaneGeometry(2, 2);
	const scene = new THREE.Scene();
	const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	scene.add(new THREE.Mesh(geometry, material));

	try {
		const renderAndRead = (target) => {
			renderer.setRenderTarget(target);
			renderer.render(scene, camera);
			const values = [];
			for (let index = 0; index < width; index += 1) values.push(readTargetPixel(renderer, target, index, 0));
			return values;
		};
		const rgba32f = renderAndRead(floatTarget);
		const rgba16f = renderAndRead(halfTarget);
		renderer.setRenderTarget(null);
		renderer.render(scene, camera);
		const context = renderer.getContext();
		const defaultPixels = new Uint8Array(width * 4);
		context.readPixels(0, 0, width, 1, context.RGBA, context.UNSIGNED_BYTE, defaultPixels);
		const defaultRgba = Array.from({length: width}, (_, index) =>
			Array.from(defaultPixels.slice(index * 4, index * 4 + 4)),
		);
		const pngDataUrl = canvas.toDataURL('image/png');
		const pngRgba = [];
		for (let index = 0; index < width; index += 1) {
			pngRgba.push(await decodePngPixel(pngDataUrl, index, 0, width, height));
		}
		const probes = SENTINEL_VALUES.map((value, index) => ({
			id: `mapper-output-${index}`,
			mapperRgb: [value, value, value],
			auxiliaryRgba32f: rgba32f[index],
			auxiliaryRgba16f: rgba16f[index],
			framebufferCodes: defaultRgba[index].slice(0, 3),
			pngCodes: pngRgba[index].slice(0, 3),
		}));
		const defaultFramebufferQ8 = classifyQ8(defaultRgba.map((rgba) => rgba[0]));
		const pngQ8 = classifyQ8(pngRgba.map((rgba) => rgba[0]));
		const requiredOfficialCtlEncoding =
			defaultFramebufferQ8.classification === 'identity-q8' && pngQ8.classification === 'identity-q8'
				? 'srgb-piecewise'
				: defaultFramebufferQ8.classification === 'srgb-oetf-q8' && pngQ8.classification === 'srgb-oetf-q8'
					? 'none-renderer-supplies-srgb-oetf'
					: 'unresolved-reject';
		return {
			values: SENTINEL_VALUES,
			probeInputStage: 'raw mapper-output sentinel injected through RawShaderMaterial',
			probes,
			rgba32f,
			rgba16f,
			defaultFramebufferRgba: defaultRgba,
			pngDecodedRgba: pngRgba,
			pngDataUrl,
			defaultFramebufferQ8,
			pngQ8,
			requiredOfficialCtlEncoding,
		};
	} finally {
		geometry.dispose();
		material.dispose();
		floatTarget.dispose();
		halfTarget.dispose();
	}
}

/** Record browser, GPU, renderer, framebuffer, and target configuration facts. */
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
			extensions: [...(context.getSupportedExtensions() ?? [])].sort(),
			contextAttributes: context.getContextAttributes(),
			drawingBufferColorSpace: context.drawingBufferColorSpace ?? null,
			unpackColorSpace: context.unpackColorSpace ?? null,
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
				maxTextures: renderer.capabilities.maxTextures,
				maxTextureSize: renderer.capabilities.maxTextureSize,
			},
		},
		targets: {
			composerSceneInput: {format: 'RGBA', type: 'half-float', internalFormat: null, colorSpace: 'none'},
			auxiliaryRgba32f: {format: 'RGBA', type: 'float', internalFormat: 'RGBA32F', colorSpace: 'none'},
			auxiliaryRgba16f: {format: 'RGBA', type: 'half-float', internalFormat: 'RGBA16F', colorSpace: 'none'},
			defaultFramebuffer: {format: 'RGBA', componentType: 'unsigned-byte-readback'},
		},
	};
}

/** Normalize the fixture's deterministic viewport inventory. */
function acceptedViewports(fixture) {
	const viewports = fixture.viewports ?? [];
	if (!Array.isArray(viewports) || viewports.length === 0) throw new TypeError('Fixture requires viewports.');
	return viewports.map((viewport, index) => {
		const width = Number(viewport.width ?? viewport.widthPixels);
		const height = Number(viewport.height ?? viewport.heightPixels);
		const verticalFovDegrees = Number(viewport.verticalFovDegrees);
		if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) {
			throw new RangeError('Viewport dimensions must be positive integers.');
		}
		if (!(verticalFovDegrees > 0 && verticalFovDegrees < 180)) {
			throw new RangeError('verticalFovDegrees must be in (0, 180).');
		}
		if (fixture.sampling?.centerPixelMustBeOpticalAxis === true && (width % 2 !== 1 || height % 2 !== 1)) {
			throw new RangeError('Optical-axis center sampling requires odd viewport width and height.');
		}
		return {id: viewport.id ?? `viewport-${index + 1}`, width, height, verticalFovDegrees};
	});
}

/** Build one exact production model for the requested family and condition. */
function createConditionModel(family, condition, fixture) {
	const profile = DEFAULT_NATIVE_PRODUCTION_PROFILE;
	const familyFixture = fixture[family] ?? {};
	const observation = observationFromCondition(family, condition, familyFixture);
	const maximumScatteringOrder = condition.maximumScatteringOrder ?? fixture.maximumScatteringOrder ?? 4;
	const sceneScale = unitValue(
		condition.sceneScale ?? fixture.sceneScale,
		DEFAULT_SCENE_SCALE,
		'meters-per-scene-unit',
		'sceneScale',
	);
	const color = new SunAppearanceDiagnosticColor();
	let geometry;
	let lightSource;
	let celestialSources;
	let observerHeightMeters;

	if (family === 'distant') {
		const observerHeight = unitValue(
			condition.observerHeight ??
				condition.observerHeightMeters ??
				familyFixture.observerHeight ??
				familyFixture.location?.observerHeightMeters,
			DEFAULT_OBSERVER_HEIGHT,
			'meters',
			'observerHeight',
		);
		observerHeightMeters = observerHeight.value;
		const observerUpDirection = normalizeDirection(
			condition.observerUpDirection ?? familyFixture.observerUpDirection ?? DEFAULT_OBSERVER_UP_DIRECTION,
			'observerUpDirection',
		);
		const angularRadius = unitValue(
			condition.sunAngularRadius ??
				condition.sunAngularRadiusRadians ??
				familyFixture.sunAngularRadius ??
				familyFixture.sunAngularRadiusRadians ??
				fixture.sampling?.sunAngularRadiusRadians,
			0.004675,
			'radians',
			'sunAngularRadius',
		);
		geometry = new SphericalEarthGeometry({
			bottomRadius: condition.geometry?.bottomRadius ?? profile.physical.geometry.bottomRadius,
			topRadius: condition.geometry?.topRadius ?? profile.physical.geometry.topRadius,
			observerHeight,
			observerUpDirection,
			sceneFrame: {kind: 'observer-local'},
			cacheAltitudeBinCount: condition.geometry?.cacheAltitudeBinCount ?? NATIVE_48_POSITION_DOMAIN_OWNER.count,
			cacheBoundaryAltitude:
				condition.geometry?.cacheBoundaryAltitude ?? NATIVE_48_POSITION_DOMAIN_OWNER.nodes[0].coordinate,
			sourceTransmittanceIntervalCount: profile.numerical.sourcePathTransmittance.intervalCount,
		});
		lightSource = new DistantSunLightSource({angularRadius});
		celestialSources = {
			id: condition.rosterId ?? 'sun-appearance-spherical-distant-sun',
			family: 'spherical-sun-stars-radial-v1',
			sun: lightSource,
			stars: null,
		};
	} else {
		const observerPosition = condition.geometry?.observerPosition ??
			familyFixture.observerPosition ??
			(familyFixture.location?.observerMeters
				? {coordinates: familyFixture.location.observerMeters, units: 'meters'}
				: undefined) ?? {
				coordinates: [0, 0, 5],
				units: 'meters',
			};
		observerHeightMeters = observerPosition.coordinates[2];
		const topAltitude = unitValue(
			condition.geometry?.topAltitude ??
				condition.geometry?.topAltitudeMeters ??
				familyFixture.topAltitude ??
				familyFixture.geometry?.topAltitudeMeters,
			DEFAULT_FLAT_TOP_ALTITUDE,
			'meters',
			'topAltitude',
		);
		const localLightSourceHeight = unitValue(
			condition.source?.centerHeight ??
				condition.source?.centerHeightMeters ??
				familyFixture.source?.centerHeight ??
				familyFixture.source?.centerHeightMeters ??
				familyFixture.source?.heightMeters,
			DEFAULT_LOCAL_SOURCE_HEIGHT,
			'meters',
			'localLightSourceHeight',
		);
		const sceneSkyRayLimit = unitValue(
			condition.geometry?.sceneSkyRayLimit ??
				condition.geometry?.sceneSkyRayLimitMeters ??
				familyFixture.sceneSkyRayLimit ??
				familyFixture.geometry?.observerDomeMaximumViewRayMeters,
			DEFAULT_FLAT_VIEW_RAY_LIMIT,
			'meters',
			'sceneSkyRayLimit',
		);
		geometry = new FlatEarthGeometry({
			observerPosition,
			topAltitude,
			localLightSourceHeight,
			projectionRadius: condition.geometry?.projectionRadius ?? profile.physical.geometry.bottomRadius,
			sceneSkyRayLimit,
			observerCenteredDome: {
				centerPolicy: 'observer-centered',
				apexAltitude: unitValue(
					condition.geometry?.domeApexAltitude ??
						condition.geometry?.domeApexAltitudeMeters ??
						familyFixture.geometry?.observerDomeApexMeters,
					topAltitude,
					'meters',
					'domeApexAltitude',
				),
				maxObserverViewRayExtent: unitValue(
					condition.geometry?.maxObserverViewRayExtent ??
						condition.geometry?.maxObserverViewRayExtentMeters ??
						familyFixture.geometry?.observerDomeMaximumViewRayMeters,
					sceneSkyRayLimit,
					'meters',
					'maxObserverViewRayExtent',
				),
			},
		});
		lightSource = new LocalSunLightSource({
			sourceKey:
				condition.source?.sourceKey ??
				condition.source?.sourceId ??
				familyFixture.source?.sourceKey ??
				familyFixture.source?.sourceId ??
				'sun-appearance-flat-local-sun',
			referenceDistance: unitValue(
				condition.source?.referenceDistance ??
					condition.source?.referenceDistanceMeters ??
					familyFixture.source?.referenceDistance ??
					familyFixture.source?.referenceDistanceMeters ??
					familyFixture.geometry?.referenceDistanceMeters,
				DEFAULT_LOCAL_REFERENCE_DISTANCE,
				'meters',
				'referenceDistance',
			),
			referenceSpectralIncidentScale:
				condition.source?.referenceSpectralIncidentScale ??
				familyFixture.source?.referenceSpectralIncidentScale ??
				1,
			radius: unitValue(
				condition.source?.radius ??
					condition.source?.radiusMeters ??
					familyFixture.source?.radius ??
					familyFixture.source?.radiusMeters,
				DEFAULT_LOCAL_SOURCE_RADIUS,
				'meters',
				'localSourceRadius',
			),
			distanceFalloff: condition.source?.distanceFalloff ?? familyFixture.source?.distanceFalloff ?? true,
			sourceTransmittanceIntervalCount: profile.numerical.sourcePathTransmittance.intervalCount,
		});
		celestialSources = {
			id: condition.rosterId ?? 'sun-appearance-flat-local-finite-sun-v1',
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
			maximumScatteringOrder,
		},
	});
	return {
		algorithm,
		geometry,
		lightSource,
		atmosphere,
		color,
		celestialSources,
		observation,
		sceneScale,
		maximumScatteringOrder,
		cameraScenePosition: [0, observerHeightMeters / sceneScale.value, 0],
	};
}

/** Resolve source direction, model up, and apparent disk radius from the configured model. */
function sourceFacts(family, model, fixture) {
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
	const observerPosition = model.geometry.configuration.observerPosition;
	const relative = model.geometry.resolveSourceRelativePosition({position: observerPosition});
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
		configuredSamplingRadiusRadians: fixture.sampling?.sunAngularRadiusRadians ?? null,
	};
}

/** Construct one production-basis spectral-radiance packet from diagnostic values. */
function createRadiancePacket(model, values, provenanceIdentity) {
	return new SpectralPacket({
		basis: model.lightSource.celestialSourceDefinition.surfaceRadiance.basis,
		quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
		units: SPECTRAL_UNITS.RADIANCE_DENSITY,
		values,
		provenanceIdentity,
	});
}

/** Convert one CPU path/celestial decomposition through the unchanged production Color owner. */
function describeCpuComposition(model, pathSpectrum, celestialSpectrum, provenanceIdentity) {
	const preDisplaySpectrum = pathSpectrum.map((value, index) => value + celestialSpectrum[index]);
	const pathPacket = createRadiancePacket(model, pathSpectrum, `${provenanceIdentity}:path`);
	const celestialPacket = createRadiancePacket(model, celestialSpectrum, `${provenanceIdentity}:celestial`);
	const preDisplayPacket = createRadiancePacket(model, preDisplaySpectrum, `${provenanceIdentity}:pre-display`);
	const signedLinearRgb = model.color.radianceToLinearSrgb(preDisplayPacket);
	return {
		pathSpectrum,
		celestialSpectrum,
		preDisplaySpectrum,
		cieXyz: linearSrgbToXyz(signedLinearRgb),
		directY: model.color.radianceToPhotopicLuminance(preDisplayPacket),
		directPathY: model.color.radianceToPhotopicLuminance(pathPacket),
		directCelestialY: model.color.radianceToPhotopicLuminance(celestialPacket),
		signedLinearRgb,
		mapperRgb: model.color.linearSrgbToDisplayRgb(signedLinearRgb),
	};
}

/** Map the live Three camera position into the configured Algorithm32 model frame. */
function cameraOriginModel(model, camera) {
	return model.geometry.mapObserverLocalScenePointToModelPosition(
		{coordinates: camera.getWorldPosition(new THREE.Vector3()).toArray(), units: 'scene-units'},
		{sceneScale: model.sceneScale},
	);
}

/** Reconstruct one raster sub-ray through the same camera matrices used by production. */
function rasterRayDirectionsModel(model, camera, pixel, viewport) {
	return RASTER_SAMPLE_OFFSETS.map(([offsetX, offsetY]) => {
		const textureCoordinates = [
			(pixel.x + 0.5 + offsetX) / viewport.width,
			(pixel.y + 0.5 + offsetY) / viewport.height,
		];
		const directionScene = cameraRayDirectionScene(camera, textureCoordinates).toArray();
		return {
			offsetPixels: [offsetX, offsetY],
			textureCoordinates,
			directionScene,
			directionModel: model.geometry.mapObserverLocalSceneDirectionToModelDirection(directionScene),
		};
	});
}

/** Return the first nonnegative entry distance for a model-space ray and finite source sphere. */
function sphereEntryDistance(origin, direction, center, radiusMeters) {
	const offset = origin.coordinates.map((value, index) => value - center[index]);
	const projectedOffset = dot(offset, direction);
	const radialTerm = dot(offset, offset) - radiusMeters * radiusMeters;
	const discriminant = projectedOffset * projectedOffset - radialTerm;
	if (discriminant < 0) return null;
	const root = Math.sqrt(Math.max(0, discriminant));
	const near = -projectedOffset - root;
	const far = -projectedOffset + root;
	if (near >= 0) return near;
	return far >= 0 ? far : null;
}

/** Transport source surface radiance over one geometry-owned atmosphere path. */
function transportedSurfaceSpectrum(model, path) {
	const transmittance = model.atmosphere.integrateOpticalDepth(path);
	if (transmittance.blockedByGround) return new Array(SPECTRAL_CHANNEL_COUNT).fill(0);
	return model.lightSource.celestialSourceDefinition.surfaceRadiance.values.map(
		(value, index) => value * transmittance.transmittance.values[index],
	);
}

/** Build the real production CPU scattering cache plus source-family direct-transport context. */
function buildCpuContext(family, model) {
	const startedAt = performance.now();
	let progressEventCount = 0;
	let lastProgress = null;
	const buildResult = model.lightSource.buildCpuScatteringCache({
		model: model.algorithm._model,
		onProgress(event) {
			progressEventCount += 1;
			lastProgress = event;
		},
	});
	const scatteringCache =
		family === 'distant' ? new DistantSunCpuCache(buildResult) : new LocalSunCpuCache(buildResult);
	const context = {
		scatteringCache,
		build: {
			method: `${model.lightSource.constructor.name}.buildCpuScatteringCache`,
			maximumScatteringOrder: model.maximumScatteringOrder,
			durationMilliseconds: performance.now() - startedAt,
			progressEventCount,
			lastProgress,
			sampleProvenanceIdentity: scatteringCache.sampleProvenanceIdentity,
		},
		distantCachedSpectrum: null,
		distantDirectLevels: null,
	};

	if (family === 'distant') {
		const placements = model.geometry.resolveCelestialPlacements({
			roster: model.celestialSources,
			observation: model.observation,
		});
		const placement = placements[0];
		const query = model.geometry.createCelestialQueryPacket(model.celestialSources, placements);
		const celestialCache = new DistantSunCelestialCpuCache({
			model: model.algorithm._model,
			domain: model.geometry.describeCelestialContributionDomain(),
			placement,
			source: model.lightSource,
		});
		context.distantCachedSpectrum = Array.from(
			celestialCache.lookup({
				receiverStencil: query.receiverStencil,
				directionStencil: query.sun.directionStencil,
			}).radiance.values,
		);
		context.distantDirectLevels = new Map(
			[20, 40, 80, 160, 320, 640, 1280].map((intervalCount) => {
				const path = model.geometry.resolveAtmospherePath({
					ray: {origin: query.receiverPosition, direction: placement.directionToSource},
					sourcePathLimit: {maxDistance: null, reason: 'distant-source-to-atmosphere-boundary'},
					sampleCount: intervalCount,
				});
				return [intervalCount, transportedSurfaceSpectrum(model, path)];
			}),
		);
	}
	return context;
}

/** Resolve one exact direct-source spectrum for a raster sub-ray and integration level. */
function directSubraySpectrum(family, model, cpuContext, origin, subray, intervalCount) {
	if (family === 'distant') {
		const directionToSource = model.geometry.configuration.directionToSource;
		const angularRadius = model.lightSource.celestialSourceDefinition.angularRadius.value;
		const hitsDisk = dot(subray.directionModel, directionToSource) >= Math.cos(angularRadius);
		const groundDistance = model.geometry.distanceToGroundBoundary(origin, subray.directionModel);
		const topDistance = model.geometry.distanceToTopAtmosphereBoundary(origin, subray.directionModel);
		if (!hitsDisk || (groundDistance !== null && groundDistance >= 0 && groundDistance <= topDistance)) {
			return new Array(SPECTRAL_CHANNEL_COUNT).fill(0);
		}
		return cpuContext.distantDirectLevels.get(intervalCount);
	}
	const definition = model.lightSource.celestialSourceDefinition;
	const sourceCenter = model.lightSource.configuration.position.coordinates;
	const entryDistanceMeters = sphereEntryDistance(
		origin,
		subray.directionModel,
		sourceCenter,
		definition.radius.value,
	);
	if (entryDistanceMeters === null) return new Array(SPECTRAL_CHANNEL_COUNT).fill(0);
	if (subray.directionModel[2] <= 1e-6) return new Array(SPECTRAL_CHANNEL_COUNT).fill(0);
	const topDistanceMeters =
		(model.geometry.configuration.topAltitude.value - origin.coordinates[2]) / subray.directionModel[2];
	const atmosphereEndDistanceMeters = Math.max(0, Math.min(entryDistanceMeters, topDistanceMeters));
	const path = model.geometry.resolveAtmospherePath({
		ray: {origin, direction: subray.directionModel},
		endDistance: {value: atmosphereEndDistanceMeters, units: 'meters'},
		sampleCount: intervalCount,
	});
	return transportedSurfaceSpectrum(model, path);
}

/** Average four live-raster direct-source spectra at one integration resolution. */
function directRasterSpectrum(family, model, cpuContext, origin, subrays, intervalCount) {
	const result = new Array(SPECTRAL_CHANNEL_COUNT).fill(0);
	for (const subray of subrays) {
		const spectrum = directSubraySpectrum(family, model, cpuContext, origin, subray, intervalCount);
		for (let index = 0; index < result.length; index += 1) result[index] += spectrum[index] * 0.25;
	}
	return result;
}

/** Evaluate the central atmospheric path and source-path refinement sequence on CPU. */
function evaluateCpuSample(family, model, cpuContext, camera, viewport, pixel, sampleId) {
	const origin = cameraOriginModel(model, camera);
	const centerTextureCoordinates = [(pixel.x + 0.5) / viewport.width, (pixel.y + 0.5) / viewport.height];
	const centerDirectionScene = cameraRayDirectionScene(camera, centerTextureCoordinates).toArray();
	const centerDirectionModel = model.geometry.mapObserverLocalSceneDirectionToModelDirection(centerDirectionScene);
	const subrays = rasterRayDirectionsModel(model, camera, pixel, viewport);
	const evaluation = model.algorithm.evaluate({
		viewRay: {
			origin,
			direction: centerDirectionModel,
			...(family === 'distant' ? {groundBoundaryMode: 'scene-hit-owned'} : {}),
		},
		scatteringCache: cpuContext.scatteringCache,
	});
	const pathSpectrum = Array.from(evaluation.pathRadiance.values);
	const directLevels = [20, 40, 80, 160, 320, 640, 1280].map((intervalCount) => {
		const celestialSpectrum = directRasterSpectrum(family, model, cpuContext, origin, subrays, intervalCount);
		return {
			intervalCount,
			celestialSpectrum,
			...describeCpuComposition(
				model,
				pathSpectrum,
				celestialSpectrum,
				`sun-appearance:${sampleId}:source-path-${intervalCount}`,
			),
		};
	});
	let productionCelestialSpectrum = directLevels[0].celestialSpectrum;
	if (family === 'distant') {
		const visibleFraction = subrays.reduce(
			(sum, subray) =>
				sum +
				(directSubraySpectrum(family, model, cpuContext, origin, subray, 20).some((value) => value > 0)
					? 0.25
					: 0),
			0,
		);
		productionCelestialSpectrum = cpuContext.distantCachedSpectrum.map((value) => value * visibleFraction);
	}
	const production = describeCpuComposition(
		model,
		pathSpectrum,
		productionCelestialSpectrum,
		`sun-appearance:${sampleId}:production-cpu`,
	);
	const refined = directLevels.at(-1);
	const previous = directLevels.at(-2);
	return {
		method: 'Algorithm32.evaluate plus source-family direct celestial mirror',
		originModel: origin.coordinates,
		actualRayDirectionModel: centerDirectionModel,
		rasterSubrays: subrays,
		...production,
		refinedDirectY: refined.directY,
		directYUncertainty: Math.abs(refined.directY - previous.directY) / 3,
		sourcePathConvergence: {
			productionIntervalCount: 20,
			refinedIntervalCounts: directLevels.map((entry) => entry.intervalCount),
			levels: directLevels,
			richardsonOrder: 2,
			tailEstimateDirectY: Math.abs(refined.directY - previous.directY) / 3,
		},
	};
}

/** Capture every required diagnostic stage for one aimed sample and viewport. */
async function captureSample({
	renderer,
	canvas,
	composer,
	runtimePass,
	bindingValues,
	model,
	cpuContext,
	family,
	camera,
	targets,
	sample,
}) {
	const {width, height, verticalFovDegrees} = targets.viewport;
	camera.fov = verticalFovDegrees;
	camera.aspect = width / height;
	const pixel = {x: Math.floor(width / 2), y: Math.floor(height / 2)};
	const centerTextureCoordinates = [(pixel.x + 0.5) / width, (pixel.y + 0.5) / height];
	const directionScene = aimCamera(
		camera,
		model.geometry,
		sample.directionModel,
		targets.upModel,
		centerTextureCoordinates,
	);
	composer.setSize(width, height);
	renderer.setSize(width, height, false);
	Algorithm32Bindings.update({
		bindingValues,
		camera,
		props: {config: model.algorithm.config.config, sceneScale: model.sceneScale},
	});
	runtimePass.uniforms.uSunAppearanceDiagnosticMode.value = DIAGNOSTIC_MODE.normal;
	renderComposerPixel(renderer, composer, pixel);
	const context = renderer.getContext();
	const defaultPixel = new Uint8Array(4);
	renderer.setRenderTarget(null);
	context.readPixels(pixel.x, pixel.y, 1, 1, context.RGBA, context.UNSIGNED_BYTE, defaultPixel);
	const pngCenterRgba = await roundTripCroppedPngPixel(canvas, pixel, height);
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
	const signedLinearRgba = renderAuxiliaryMode(
		renderer,
		runtimePass,
		readBuffer,
		targets.float,
		pixel,
		DIAGNOSTIC_MODE.signedLinearRgb,
	);
	const directYPacket = renderAuxiliaryMode(
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
	const rasterSubsamples = renderAuxiliaryMode(
		renderer,
		runtimePass,
		readBuffer,
		targets.float,
		pixel,
		DIAGNOSTIC_MODE.coverage,
	);
	const state = renderAuxiliaryMode(renderer, runtimePass, readBuffer, targets.float, pixel, DIAGNOSTIC_MODE.state);
	const shaderRayDirectionModel = normalizeDirection(
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
	const cieXyz = linearSrgbToXyz(signedLinearRgb);
	const cpu = evaluateCpuSample(
		family,
		model,
		cpuContext,
		camera,
		targets.viewport,
		pixel,
		`${family}:${targets.viewport.id}:${sample.id}`,
	);
	const gpu = {
		pathSpectrum: pathRadiance.values,
		celestialSpectrum: celestialRadiance.values,
		preDisplaySpectrum: preDisplayRadiance.values,
		cieXyz,
		directY: directYPacket[0],
		directPathY: directYPacket[1],
		directCelestialY: directYPacket[2],
		signedLinearRgb,
		mapperRgb: mapperRgba32f.slice(0, 3),
		framebufferCodes: Array.from(defaultPixel).slice(0, 3),
		pngCodes: pngCenterRgba.slice(0, 3),
	};
	return {
		id: sample.id,
		orientation: sample.orientation,
		angularOffsetRadians: sample.angularOffsetRadians,
		directionModel: sample.directionModel,
		directionScene,
		pixel: {...pixel, textureCoordinates: centerTextureCoordinates},
		actualRayDirectionModel: shaderRayDirectionModel,
		requestedRayAngularResidualRadians: Math.acos(
			Math.max(-1, Math.min(1, dot(shaderRayDirectionModel, sample.directionModel))),
		),
		pathRadiance,
		celestialRadiance,
		preDisplayRadiance,
		gpu,
		cpu,
		pathSpectrum: pathRadiance.values,
		celestialSpectrum: celestialRadiance.values,
		preDisplaySpectrum: preDisplayRadiance.values,
		cieXyz,
		signedLinearRgb,
		directCieY: {
			preDisplay: directYPacket[0],
			path: directYPacket[1],
			celestial: directYPacket[2],
		},
		mapperFloatRgba: mapperRgba32f,
		mapperRgb: mapperRgba32f.slice(0, 3),
		auxiliaryReplay: {rgba32f: mapperRgba32f, rgba16f: mapperRgba16f},
		defaultFramebufferRgba: Array.from(defaultPixel),
		framebufferCodes: Array.from(defaultPixel).slice(0, 3),
		pngCenterRgba,
		pngCodes: pngCenterRgba.slice(0, 3),
		rasterSubsamples: rasterSubsamples.map((value) => value >= 0.5),
		coverage: rasterSubsamples.slice(0, 4).reduce((sum, value) => sum + value, 0) / 4,
		state: {
			sceneHit: state[0] >= 0.5,
			pathValid: state[1] >= 0.5,
			hasSceneEndpoint: state[2] >= 0.5,
			hasGroundEndpoint: state[3] >= 0.5,
		},
	};
}

/** Capture one bounded full-frame signed-linear view through the installed diagnostic mode. */
function captureSignedLinearFrame({
	renderer,
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
	runtimePass.uniforms.uSunAppearanceDiagnosticMode.value = DIAGNOSTIC_MODE.normal;
	composer.render();
	const previousTarget = renderer.getRenderTarget();
	target.scissorTest = false;
	runtimePass.uniforms.uSunAppearanceDiagnosticMode.value = DIAGNOSTIC_MODE.signedLinearRgb;
	runtimePass.renderToScreen = false;
	try {
		runtimePass.render(renderer, target, composer.readBuffer);
		const values = new Float32Array(viewport.width * viewport.height * 4);
		renderer.readRenderTargetPixels(target, 0, 0, viewport.width, viewport.height, values);
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
			id: `${model.observation.instant}-${viewport.id}-signed-linear`,
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
		};
	} finally {
		renderer.setRenderTarget(previousTarget);
	}
}

/** Select only the two retained representative views unless a condition explicitly opts in. */
function shouldCaptureSignedLinearPreview(family, condition) {
	if (condition.signedLinearPreview === true) return true;
	if (condition.signedLinearPreview === false) return false;
	const id = String(condition.id ?? '').toLowerCase();
	return family === 'distant'
		? id.includes('minus-10') || id.includes('minus10')
		: id.includes('flat-180') || id.includes('flat180') || id.includes('long');
}

/** Execute one condition through the real facade, cache backend, composer, and runtime pass. */
async function runCondition(renderer, canvas, family, condition, fixture, viewports) {
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
	sceneTarget.texture.name = 'SunAppearance.productionSceneInput';
	sceneTarget.texture.colorSpace = THREE.NoColorSpace;
	const composer = new EffectComposer(renderer, sceneTarget);
	composer.setPixelRatio(1);
	composer.setSize(firstViewport.width, firstViewport.height);
	composer.addPass(new RenderPass(scene, camera));
	const backend = new ThreeCacheBackend({THREE, renderer});
	const sceneDepthMax = model.geometry.resolveSceneDepthMax();
	const bindingValues = Algorithm32Bindings.create(THREE, sceneDepthMax);
	const facts = sourceFacts(family, model, fixture);
	const samples = createSamples(
		facts.directionModel,
		facts.upModel,
		facts.apparentRadiusRadians,
		fixture.sampling ?? {},
		condition,
	);
	aimCamera(camera, model.geometry, samples[0].directionModel, facts.upModel);
	Algorithm32Bindings.update({
		bindingValues,
		camera,
		props: {config: model.algorithm.config.config, sceneScale: model.sceneScale},
	});
	let handle;
	let cpuContext;
	let gpuSetupAndCacheBuildDurationMilliseconds;
	let cpuScatteringCacheBuildDurationMilliseconds;
	let sampleCaptureDurationMilliseconds;

	try {
		const gpuBuildStartedAt = performance.now();
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
				yieldControl: () => new Promise((resolveYield) => requestAnimationFrame(() => resolveYield())),
			},
		});
		await handle.prepare(renderer);
		gpuSetupAndCacheBuildDurationMilliseconds = performance.now() - gpuBuildStartedAt;
		const shaderSource = handle._buildResult?.assembly?.fragmentShaderSource;
		if (typeof shaderSource !== 'string') throw new Error('Algorithm32 did not retain assembled shader source.');
		if (shaderSource.includes('uSkyExposureCoefficientTexture')) {
			throw new Error('Rejected sky-exposure binding appeared in the assembled production shader.');
		}
		const runtimePass = composer.passes.find((pass) => pass?.uniforms?.uSunAppearanceDiagnosticMode !== undefined);
		if (runtimePass === undefined) throw new Error('Sun appearance diagnostic runtime pass was not installed.');
		const cpuBuildStartedAt = performance.now();
		cpuContext = buildCpuContext(family, model);
		cpuScatteringCacheBuildDurationMilliseconds = performance.now() - cpuBuildStartedAt;
		const viewportResults = [];
		let signedLinearPreview = null;
		const previewViewport = [...viewports].sort(
			(left, right) => left.width * left.height - right.width * right.height || left.id.localeCompare(right.id),
		)[0];
		const sampleCaptureStartedAt = performance.now();
		for (const viewport of viewports) {
			const targets = {
				viewport,
				upModel: facts.upModel,
				float: createTarget(
					viewport.width,
					viewport.height,
					THREE.FloatType,
					'RGBA32F',
					`SunAppearance.${viewport.id}.rgba32f`,
				),
				half: createTarget(
					viewport.width,
					viewport.height,
					THREE.HalfFloatType,
					'RGBA16F',
					`SunAppearance.${viewport.id}.rgba16f`,
				),
			};
			try {
				const sampleResults = [];
				for (const sample of samples) {
					sampleResults.push(
						await captureSample({
							renderer,
							canvas,
							composer,
							runtimePass,
							bindingValues,
							model,
							cpuContext,
							family,
							camera,
							targets,
							sample,
						}),
					);
				}
				if (
					signedLinearPreview === null &&
					viewport.id === previewViewport.id &&
					shouldCaptureSignedLinearPreview(family, condition)
				) {
					signedLinearPreview = captureSignedLinearFrame({
						renderer,
						composer,
						runtimePass,
						bindingValues,
						model,
						camera,
						target: targets.float,
						viewport,
						sample: samples[0],
						upModel: facts.upModel,
					});
				}
				viewportResults.push({...viewport, samples: sampleResults});
			} finally {
				targets.float.dispose();
				targets.half.dispose();
			}
		}
		sampleCaptureDurationMilliseconds = performance.now() - sampleCaptureStartedAt;
		const diagnostics = handle.getDiagnostics();
		if (diagnostics?.runtime?.skyExposure != null) {
			throw new Error('Rejected sky-exposure runtime appeared in production diagnostics.');
		}
		return {
			evidence: {
				id: condition.id,
				family,
				observation: model.observation,
				maximumScatteringOrder: model.maximumScatteringOrder,
				cpuScatteringCacheBuild: cpuContext.build,
				sceneScale: model.sceneScale,
				source: facts,
				profile: {
					id: DEFAULT_NATIVE_PRODUCTION_PROFILE.id,
					spectralBasisHash: DEFAULT_NATIVE_PRODUCTION_PROFILE.spectral.basis.contentHash,
					viewPathIntervalCount: DEFAULT_NATIVE_PRODUCTION_PROFILE.numerical.viewPath.intervalCount,
					sourcePathIntervalCount:
						DEFAULT_NATIVE_PRODUCTION_PROFILE.numerical.sourcePathTransmittance.intervalCount,
				},
				shaderSource,
				shaderSourceHash: handle._buildResult.assembly.sourceHash,
				diagnostics,
				signedLinearPreview,
				viewports: viewportResults,
			},
			progressDurations: {
				gpuSetupAndCacheBuildMilliseconds: gpuSetupAndCacheBuildDurationMilliseconds,
				cpuScatteringCacheBuildMilliseconds: cpuScatteringCacheBuildDurationMilliseconds,
				sampleCaptureMilliseconds: sampleCaptureDurationMilliseconds,
			},
		};
	} finally {
		cpuContext?.scatteringCache.dispose();
		handle?.dispose();
		model.algorithm.dispose();
		composer.dispose();
		sceneTarget.dispose();
		backend.dispose();
	}
}

/** Form every fixture-owned logical disk-versus-sky comparison from retained physical samples. */
function createRawOrdering(conditions) {
	const comparisons = [];
	for (const condition of conditions) {
		for (const viewport of condition.viewports) {
			const diskSamples = viewport.samples.filter(
				(sample) => sample.id === 'disk-center' || sample.id.startsWith('inside-limb'),
			);
			const skySamples = viewport.samples.filter((sample) => sample.id.startsWith('circumsolar-'));
			for (const disk of diskSamples) {
				for (const sky of skySamples) {
					const cpuDiskY = disk.cpu.refinedDirectY;
					const cpuSkyY = sky.cpu.refinedDirectY;
					const cpuDiskYUncertainty = disk.cpu.directYUncertainty;
					const cpuSkyYUncertainty = sky.cpu.directYUncertainty;
					const gpuDiskY = disk.gpu.directY;
					const gpuSkyY = sky.gpu.directY;
					comparisons.push({
						id: `${condition.id}:${viewport.id}:${disk.id}>${sky.id}`,
						conditionId: condition.id,
						family: condition.family,
						viewportId: viewport.id,
						diskSampleId: disk.id,
						skySampleId: sky.id,
						cpuDiskY,
						cpuSkyY,
						cpuDiskYUncertainty,
						cpuSkyYUncertainty,
						cpuStrictlyOrdered: cpuDiskY - cpuDiskYUncertainty > cpuSkyY + cpuSkyYUncertainty,
						gpuDiskY,
						gpuSkyY,
						gpuDiskYUncertainty: 0,
						gpuSkyYUncertainty: 0,
						gpuStrictlyOrdered: gpuDiskY > gpuSkyY,
					});
				}
			}
		}
	}
	return {comparisonCount: comparisons.length, comparisons};
}

/** Verify the fixture's deterministic Flat placement and monotone distance-class contract. */
function createFlatGeometryContract(conditions, fixture) {
	const expectedById = new Map((fixture.flat?.conditions ?? []).map((condition) => [condition.id, condition]));
	const entries = conditions
		.filter((condition) => condition.family === 'flat')
		.map((condition) => {
			const expected = expectedById.get(condition.id);
			const actualCenterMeters = condition.source.centerMeters;
			const expectedCenterMeters = expected?.expectedCenterMeters;
			const actualCacheRadialMaximumMeters = condition.source.cacheRadialMaximumMeters;
			const expectedCacheRadialMaximumMeters = expected?.expectedCacheRadialMaximumMeters;
			if (!Array.isArray(expectedCenterMeters) || expectedCenterMeters.length !== 3) {
				throw new TypeError(`Flat condition ${condition.id} requires expectedCenterMeters.`);
			}
			const centerMaximumAbsoluteResidualMeters = Math.max(
				...actualCenterMeters.map((value, index) => Math.abs(value - expectedCenterMeters[index])),
			);
			const cacheRadialMaximumAbsoluteResidualMeters = Math.abs(
				actualCacheRadialMaximumMeters - expectedCacheRadialMaximumMeters,
			);
			if (centerMaximumAbsoluteResidualMeters > 1e-6 || cacheRadialMaximumAbsoluteResidualMeters > 1e-6) {
				throw new Error(`Flat condition ${condition.id} resolved source geometry differs from its fixture.`);
			}
			return {
				conditionId: condition.id,
				distanceClass: expected.distanceClass,
				actualCenterMeters,
				expectedCenterMeters,
				centerMaximumAbsoluteResidualMeters,
				actualCacheRadialMaximumMeters,
				expectedCacheRadialMaximumMeters,
				cacheRadialMaximumAbsoluteResidualMeters,
				actualSourceDistanceMeters: condition.source.distanceMeters,
			};
		});
	const byClass = new Map(entries.map((entry) => [entry.distanceClass, entry]));
	const distanceClassesStrictlyOrdered =
		byClass.has('close') &&
		byClass.has('medium') &&
		byClass.has('long') &&
		byClass.get('close').actualSourceDistanceMeters < byClass.get('medium').actualSourceDistanceMeters &&
		byClass.get('medium').actualSourceDistanceMeters < byClass.get('long').actualSourceDistanceMeters;
	if (!distanceClassesStrictlyOrdered) throw new Error('Flat close/medium/long source distances are not ordered.');
	return {toleranceMeters: 1e-6, distanceClassesStrictlyOrdered, entries};
}

/** Select either the complete fixture or one execution-only condition shard. */
function conditionRequestsForExecution(distantConditions, flatConditions, executionShard) {
	const complete = [
		...distantConditions.map((condition) => ({family: 'distant', condition})),
		...flatConditions.map((condition) => ({family: 'flat', condition})),
	];
	if (executionShard === null || executionShard === undefined) {
		return {requests: complete, shard: null};
	}
	if (typeof executionShard !== 'object' || Array.isArray(executionShard)) {
		throw new TypeError('Sun appearance execution shard must be an object.');
	}
	const {id, family, conditionId, conditionIndex, conditionCount} = executionShard;
	if (
		typeof id !== 'string' ||
		!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(id) ||
		(family !== 'distant' && family !== 'flat') ||
		typeof conditionId !== 'string' ||
		!Number.isSafeInteger(conditionIndex) ||
		conditionIndex < 1 ||
		!Number.isSafeInteger(conditionCount) ||
		conditionCount !== complete.length ||
		conditionIndex > conditionCount
	) {
		throw new RangeError('Sun appearance execution shard identity is invalid.');
	}
	const selected = complete.filter((request) => request.family === family && request.condition.id === conditionId);
	if (
		selected.length !== 1 ||
		complete[conditionIndex - 1]?.family !== family ||
		complete[conditionIndex - 1]?.condition.id !== conditionId
	) {
		throw new Error('Sun appearance execution shard does not match the ordered fixture condition inventory.');
	}
	return {
		requests: selected,
		shard: {id, family, conditionId, conditionIndex, conditionCount},
	};
}

/**
 * Run the immutable Sun-appearance browser diagnostic through sealed production source.
 *
 * The caller owns fixture serialization and output persistence. This function performs
 * no filesystem or network writes and returns JSON-compatible evidence. The optional
 * reporter receives bounded execution metadata, never partial scientific evidence.
 */
export async function runProductionSunAppearanceDiagnostic(
	fixture,
	reportProgress = async () => {},
	executionShard = null,
) {
	if (fixture === null || typeof fixture !== 'object' || Array.isArray(fixture)) {
		throw new TypeError('Sun appearance diagnostic fixture must be an object.');
	}
	if (typeof reportProgress !== 'function') {
		throw new TypeError('Sun appearance diagnostic progress reporter must be a function.');
	}
	const viewports = acceptedViewports(fixture);
	const distantConditions = fixture.distant?.conditions ?? [];
	const flatConditions = fixture.flat?.conditions ?? [];
	if (!Array.isArray(distantConditions) || !Array.isArray(flatConditions)) {
		throw new TypeError('Distant and Flat conditions must be arrays.');
	}
	if (distantConditions.length + flatConditions.length === 0) {
		throw new RangeError('Sun appearance diagnostic fixture contains no conditions.');
	}
	const execution = conditionRequestsForExecution(distantConditions, flatConditions, executionShard);
	const maximumWidth = Math.max(...viewports.map((viewport) => viewport.width), SENTINEL_VALUES.length);
	const maximumHeight = Math.max(...viewports.map((viewport) => viewport.height), 1);
	const canvas = document.createElement('canvas');
	canvas.width = maximumWidth;
	canvas.height = maximumHeight;
	const context = canvas.getContext('webgl2', {
		antialias: false,
		alpha: true,
		depth: true,
		preserveDrawingBuffer: true,
	});
	if (context === null) throw new Error('Sun appearance diagnostic requires WebGL2.');
	const renderer = new THREE.WebGLRenderer({canvas, context, antialias: false});
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.setPixelRatio(1);
	renderer.setSize(maximumWidth, maximumHeight, false);

	try {
		const outputContractStartedAt = performance.now();
		const outputContract = await measureSentinel(renderer, canvas);
		await reportProgress({
			stage: 'output-contract-complete',
			durationMilliseconds: performance.now() - outputContractStartedAt,
		});
		const conditions = [];
		const conditionRequests = execution.requests;
		for (let conditionIndex = 0; conditionIndex < conditionRequests.length; conditionIndex += 1) {
			const {family, condition} = conditionRequests[conditionIndex];
			const progressIdentity = {
				conditionIndex: execution.shard?.conditionIndex ?? conditionIndex + 1,
				conditionCount: execution.shard?.conditionCount ?? conditionRequests.length,
				family,
				conditionId: condition.id,
			};
			await reportProgress({stage: 'condition-start', ...progressIdentity});
			const conditionStartedAt = performance.now();
			const completed = await runCondition(renderer, canvas, family, condition, fixture, viewports);
			conditions.push(completed.evidence);
			await reportProgress({
				stage: 'condition-complete',
				...progressIdentity,
				totalDurationMilliseconds: performance.now() - conditionStartedAt,
				...completed.progressDurations,
			});
		}
		const fullFrameSignedLinearCaptures = conditions
			.filter((condition) => condition.signedLinearPreview !== null)
			.map((condition) => ({
				conditionId: condition.id,
				family: condition.family,
				...condition.signedLinearPreview,
			}));
		return {
			schemaVersion:
				execution.shard === null
					? 'production-sun-appearance-browser-evidence-v1'
					: 'production-sun-appearance-browser-condition-shard-v1',
			fixtureId: fixture.id ?? null,
			executionShard: execution.shard,
			renderer: rendererFacts(renderer),
			outputContract,
			conditions,
			rawOrdering: createRawOrdering(conditions),
			flatGeometryContract: execution.shard === null ? createFlatGeometryContract(conditions, fixture) : null,
			fullFrameSignedLinearCaptures,
			claimLimits: {
				offscreenReadbacks: 'auxiliary replay of the installed production pass, not normal post-mapper stages',
				defaultFramebuffer:
					'normal terminal EffectComposer output scissored to the sole measured optical-axis pixel; the four production +/-0.25 subrays are evaluated inside that fragment',
				png: 'per-sample code is the measured framebuffer pixel cropped with createImageBitmap colorSpaceConversion none, drawn to a 1x1 canvas, PNG-encoded, and decoded; outputContract retains the complete 8x1 sentinel PNG',
				fullFrameSignedLinearCaptures:
					'exactly two deliberately full-frame float32 diagnostic replays remain unscissored',
				coverage: 'proof-only replay of the four production visibility predicates',
			},
		};
	} finally {
		renderer.dispose();
	}
}
