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

import {
	FLAT_LOCAL_ANALYTIC_RASTER_MODES,
	createFlatLocalAnalyticDiskRasterContribution,
} from './flat-local-analytic-disk-raster.js';
import {
	createFloat64RaySphereOracle,
	describeFloat64RaySphereOracle,
	resolveFloat64ConicDiagnostics,
	resolveOraclePixelCenterDirection,
	resolvePixelSolidAngle,
	resolveSubdivisionCoverage,
} from './flat-local-analytic-disk-raster-oracle.js';

const SPECTRAL_CHANNEL_COUNT = 15;
const SPECTRAL_PACKET_COUNT = 4;
const CACHE_HEARTBEAT_INTERVAL_MILLISECONDS = 5000;
const DISTANT_CONTROL_MODES = {
	normal: 0,
	celestialPacketStart: 1,
};

/** Return the lowercase SHA-256 identity of one UTF-8 source string. */
async function sha256Utf8(value) {
	const bytes = new TextEncoder().encode(value);
	const digest = await crypto.subtle.digest('SHA-256', bytes);
	return {
		bytes: bytes.byteLength,
		sha256: Array.from(new Uint8Array(digest), (component) => component.toString(16).padStart(2, '0')).join(''),
	};
}

/** Return the nonoverlapping occurrence count of one exact source token. */
function sourceOccurrenceCount(source, token) {
	return source.split(token).length - 1;
}

/** Production Color followed by the contained Flat-only proof contribution. */
class FlatLocalAnalyticRasterProofColor extends BrunetonColorDisplayModel {
	/** Append the proof only for the Flat/local family. */
	createShaderContribution(request) {
		const productionContribution = super.createShaderContribution(request);
		return request.model.celestialSources?.family === 'flat-local-finite-sun-v1'
			? [productionContribution, createFlatLocalAnalyticDiskRasterContribution()]
			: productionContribution;
	}
}

/** Production distant-Sun Color with one contained terminal spectral readout. */
class DistantControlReadoutColor extends BrunetonColorDisplayModel {
	/** Append a resource-free celestial readout after unchanged production Color. */
	createShaderContribution(request) {
		const productionContribution = super.createShaderContribution(request);
		return [productionContribution, createDistantControlReadoutContribution()];
	}
}

/** Create the resource-free distant-Sun celestial-spectrum control readout. */
function createDistantControlReadoutContribution() {
	return ShaderContributions.createShaderContribution({
		id: 'proof-distant-sun-celestial-readout',
		owner: 'color',
		requires: ['composition.composeSpectralRadiance', 'color.composeSceneColor', 'color.encodeOutput'],
		uniforms: [
			ShaderContributions.createShaderUniformDeclaration(
				'uDistantControlReadoutMode',
				'int',
				'proof.distantControlReadoutMode',
				DISTANT_CONTROL_MODES.normal,
			),
		],
		functions: [
			ShaderContributions.createShaderSourceBlock(
				'proof-distant-sun-celestial-readout-functions',
				'diagnosticOutput',
				10,
				`vec4 proofDistantSunCelestialPacket(SpectralValue value, int packetIndex) {
	vec4 packet = vec4(0.0);
	int firstChannel = packetIndex * 4;
	for (int componentIndex = 0; componentIndex < 4; componentIndex += 1) {
		int channelIndex = firstChannel + componentIndex;
		if (channelIndex < SPECTRAL_CHANNEL_COUNT) packet[componentIndex] = value.channels[channelIndex];
	}
	return packet;
}`,
			),
		],
		mainHooks: [
			ShaderContributions.createShaderSourceBlock(
				'proof-distant-sun-celestial-readout-main',
				'diagnosticOutput',
				10,
				`if (uDistantControlReadoutMode >= ${DISTANT_CONTROL_MODES.celestialPacketStart}
		&& uDistantControlReadoutMode < ${DISTANT_CONTROL_MODES.celestialPacketStart + SPECTRAL_PACKET_COUNT}) {
		outColor = proofDistantSunCelestialPacket(
			celestialRadiance,
			uDistantControlReadoutMode - ${DISTANT_CONTROL_MODES.celestialPacketStart}
		);
	}`,
			),
		],
		diagnostics: {
			proofId: 'flat-local-analytic-disk-raster-gpu-proof-v1',
			purpose: 'distant-family-live-celestial-non-regression-control',
			declaresGpuResources: false,
		},
	});
}

/** Return a unit-bearing finite scalar. */
function unitValue(value, units, label) {
	const scalar = typeof value === 'number' ? value : value?.value;
	if (!Number.isFinite(scalar)) throw new TypeError(`${label} must be finite.`);
	return typeof value === 'number' ? {value: scalar, units} : value;
}

/** Return a normalized three-component direction. */
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

/** Build a stable tangent to one direction. */
function tangentDirection(direction, preferredDirection) {
	const projected = preferredDirection.map(
		(component, index) => component - dot(preferredDirection, direction) * direction[index],
	);
	if (Math.hypot(...projected) > 1e-10) return normalizeDirection(projected, 'camera tangent');
	return normalizeDirection(
		cross(direction, Math.abs(direction[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0]),
		'fallback tangent',
	);
}

/** Convert one model direction into the geometry-owned observer-local scene frame. */
function modelDirectionToSceneDirection(geometry, modelDirection) {
	const modelRight = geometry.mapObserverLocalSceneDirectionToModelDirection([1, 0, 0]);
	const modelUp = geometry.mapObserverLocalSceneDirectionToModelDirection([0, 1, 0]);
	const modelForward = geometry.mapObserverLocalSceneDirectionToModelDirection([0, 0, -1]);
	return normalizeDirection(
		[dot(modelDirection, modelRight), dot(modelDirection, modelUp), -dot(modelDirection, modelForward)],
		'model-to-scene direction',
	);
}

/** Reconstruct one Three camera ray at normalized texture coordinates. */
function cameraRayDirection(camera, textureCoordinates) {
	return new THREE.Vector3(textureCoordinates[0] * 2 - 1, textureCoordinates[1] * 2 - 1, 1)
		.unproject(camera)
		.sub(camera.position)
		.normalize();
}

/** Aim one model direction at an exact texture coordinate. */
function aimCamera(camera, geometry, modelDirection, modelUp, textureCoordinates) {
	const sceneDirection = modelDirectionToSceneDirection(geometry, modelDirection);
	const sceneUp = modelDirectionToSceneDirection(geometry, modelUp);
	const projectedUp = tangentDirection(sceneDirection, sceneUp);
	camera.up.set(...projectedUp);
	camera.lookAt(camera.position.clone().add(new THREE.Vector3(...sceneDirection)));
	camera.updateProjectionMatrix();
	camera.updateMatrixWorld(true);
	const correction = new THREE.Quaternion().setFromUnitVectors(
		cameraRayDirection(camera, textureCoordinates),
		new THREE.Vector3(...sceneDirection),
	);
	camera.quaternion.premultiply(correction).normalize();
	camera.updateMatrixWorld(true);
}

/** Resolve one production Flat observation from the authored semantic angle. */
function resolveFlatObservation(fixture, condition) {
	const location = fixture.flat.location;
	const normalizedLocation = {
		latitude: {value: location.latitudeDegrees, units: 'degrees'},
		longitude: {value: location.longitudeDegrees, units: 'degrees'},
	};
	const instant = FlatEarthGeometry.resolveObservationInstant({
		dateBasis: location.dateBasis,
		location: normalizedLocation,
		kind: 'closest-angle',
		angle: {value: condition.flatAngleDegrees, units: 'degrees'},
	});
	return {instant, location: normalizedLocation};
}

/** Construct one exact production Flat model with the appended proof contribution. */
function createFlatModel(fixture, condition) {
	const profile = DEFAULT_NATIVE_PRODUCTION_PROFILE;
	const flat = fixture.flat;
	const observerPosition = {coordinates: [...flat.location.observerMeters], units: 'meters'};
	const geometry = new FlatEarthGeometry({
		observerPosition,
		topAltitude: {value: flat.geometry.topAltitudeMeters, units: 'meters'},
		localLightSourceHeight: {value: flat.source.heightMeters, units: 'meters'},
		projectionRadius: profile.physical.geometry.bottomRadius,
		sceneSkyRayLimit: {value: flat.geometry.observerDomeMaximumViewRayMeters, units: 'meters'},
		observerCenteredDome: {
			centerPolicy: 'observer-centered',
			apexAltitude: {value: flat.geometry.observerDomeApexMeters, units: 'meters'},
			maxObserverViewRayExtent: {
				value: flat.geometry.observerDomeMaximumViewRayMeters,
				units: 'meters',
			},
		},
	});
	const lightSource = new LocalSunLightSource({
		sourceKey: flat.source.sourceId,
		referenceDistance: {value: flat.source.referenceDistanceMeters, units: 'meters'},
		referenceSpectralIncidentScale: 1,
		radius: {value: flat.source.radiusMeters, units: 'meters'},
		distanceFalloff: true,
		sourceTransmittanceIntervalCount: profile.numerical.sourcePathTransmittance.intervalCount,
	});
	const celestialSources = {
		id: 'proof-flat-local-analytic-disk-raster',
		family: 'flat-local-finite-sun-v1',
		localSun: lightSource,
	};
	const algorithm = new Algorithm32({
		lightSource,
		atmosphere: new CanonicalAtmosphere(),
		geometry,
		groundBoundary: null,
		celestialSources,
		color: new FlatLocalAnalyticRasterProofColor(),
		observation: resolveFlatObservation(fixture, condition),
		execution: {
			pathIntervalCount: profile.numerical.viewPath.intervalCount,
			maximumScatteringOrder: 4,
		},
	});
	const sourceRelative = geometry.resolveSourceRelativePosition({position: geometry.configuration.observerPosition});
	return {
		algorithm,
		geometry,
		lightSource,
		sceneScale: fixture.sceneScale,
		cameraScenePosition: [0, flat.location.observerMeters[2] / fixture.sceneScale.value, 0],
		sourceDirectionModel: normalizeDirection(sourceRelative.directionToSource, 'Flat source direction'),
		sourceUpModel: [0, 0, 1],
		sourceDistanceMeters: sourceRelative.distanceFromSource.value,
		sourceCenterMeters: Array.from(lightSource.configuration.position.coordinates),
		sourceRadiusMeters: lightSource.celestialSourceDefinition.radius.value,
	};
}

/** Construct one production-only distant control model. */
function createDistantModel(fixture) {
	const profile = DEFAULT_NATIVE_PRODUCTION_PROFILE;
	const control = fixture.distantNonRegressionControl;
	const observerHeight = {value: control.location.observerHeightMeters, units: 'meters'};
	const geometry = new SphericalEarthGeometry({
		bottomRadius: profile.physical.geometry.bottomRadius,
		topRadius: profile.physical.geometry.topRadius,
		observerHeight,
		observerUpDirection: [0, 0, 1],
		sceneFrame: {kind: 'observer-local'},
		cacheAltitudeBinCount: NATIVE_48_POSITION_DOMAIN_OWNER.count,
		cacheBoundaryAltitude: NATIVE_48_POSITION_DOMAIN_OWNER.nodes[0].coordinate,
		sourceTransmittanceIntervalCount: profile.numerical.sourcePathTransmittance.intervalCount,
	});
	const lightSource = new DistantSunLightSource({
		angularRadius: {value: control.sunAngularRadiusRadians, units: 'radians'},
	});
	const celestialSources = {
		id: 'proof-distant-sun-non-regression',
		family: 'spherical-sun-stars-radial-v1',
		sun: lightSource,
		stars: null,
	};
	const algorithm = new Algorithm32({
		lightSource,
		atmosphere: new CanonicalAtmosphere(),
		geometry,
		groundBoundary: null,
		celestialSources,
		color: new DistantControlReadoutColor(),
		observation: {
			instant: control.instant,
			location: {
				latitude: {value: control.location.latitudeDegrees, units: 'degrees'},
				longitude: {value: control.location.longitudeDegrees, units: 'degrees'},
			},
		},
		execution: {
			pathIntervalCount: profile.numerical.viewPath.intervalCount,
			maximumScatteringOrder: 4,
		},
	});
	return {
		algorithm,
		geometry,
		lightSource,
		sceneScale: fixture.sceneScale,
		cameraScenePosition: [0, observerHeight.value / fixture.sceneScale.value, 0],
		sourceDirectionModel: normalizeDirection(geometry.configuration.directionToSource, 'distant source direction'),
		sourceUpModel: normalizeDirection(geometry.configuration.observerUpDirection, 'distant source up'),
	};
}

/** Return one no-color-space floating-point readout target. */
function createFloatTarget(width, height, name) {
	const target = new THREE.WebGLRenderTarget(width, height, {
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		internalFormat: 'RGBA32F',
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		depthBuffer: false,
		stencilBuffer: false,
	});
	target.texture.colorSpace = THREE.NoColorSpace;
	target.texture.name = name;
	return target;
}

/** Render and read one bounded bottom-left-origin tile in one proof mode. */
function readModeTile(
	renderer,
	runtimePass,
	readBuffer,
	target,
	tile,
	mode,
	modeUniformName = 'uFlatLocalAnalyticRasterMode',
) {
	const previousTarget = renderer.getRenderTarget();
	const modeUniform = runtimePass.uniforms[modeUniformName];
	if (modeUniform === undefined) throw new Error(`Missing diagnostic mode uniform ${modeUniformName}.`);
	const previousMode = modeUniform.value;
	const previousRenderToScreen = runtimePass.renderToScreen;
	const previousScissor = target.scissor.clone();
	const previousScissorTest = target.scissorTest;
	modeUniform.value = mode;
	target.scissor.set(tile.x, tile.y, tile.width, tile.height);
	target.scissorTest = true;
	runtimePass.renderToScreen = false;
	try {
		runtimePass.render(renderer, target, readBuffer);
		const values = new Float32Array(tile.width * tile.height * 4);
		renderer.readRenderTargetPixels(target, tile.x, tile.y, tile.width, tile.height, values);
		return Array.from({length: tile.width * tile.height}, (_unused, index) =>
			Array.from(values.slice(index * 4, index * 4 + 4)),
		);
	} finally {
		modeUniform.value = previousMode;
		runtimePass.renderToScreen = previousRenderToScreen;
		target.scissor.copy(previousScissor);
		target.scissorTest = previousScissorTest;
		renderer.setRenderTarget(previousTarget);
	}
}

/** Read one Native-15 spectrum for every tile pixel. */
function readSpectrumTile(
	renderer,
	runtimePass,
	readBuffer,
	target,
	tile,
	firstMode,
	modeUniformName = 'uFlatLocalAnalyticRasterMode',
) {
	const pixels = Array.from({length: tile.width * tile.height}, () => []);
	for (let packetIndex = 0; packetIndex < SPECTRAL_PACKET_COUNT; packetIndex += 1) {
		const packet = readModeTile(
			renderer,
			runtimePass,
			readBuffer,
			target,
			tile,
			firstMode + packetIndex,
			modeUniformName,
		);
		for (let pixelIndex = 0; pixelIndex < pixels.length; pixelIndex += 1)
			pixels[pixelIndex].push(...packet[pixelIndex]);
	}
	return pixels.map((values) => values.slice(0, SPECTRAL_CHANNEL_COUNT));
}

/** Position one declared full or source-edge blocker in the current camera plane. */
function positionBlocker(blocker, camera, control, sourceTextureCoordinates, viewport) {
	blocker.visible = control !== null;
	if (control === null) return;
	const forward = new THREE.Vector3();
	camera.getWorldDirection(forward);
	blocker.quaternion.copy(camera.quaternion);
	blocker.scale.set(1, 1, 1);
	if (control.kind === 'full-tile-camera-facing-plane') {
		blocker.position.copy(camera.position).addScaledVector(forward, 1);
	} else if (control.kind === 'source-centered-half-plane-edge') {
		const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
		const sourceRay = cameraRayDirection(camera, sourceTextureCoordinates);
		const planeDistance = 1 / sourceRay.dot(forward);
		const sourcePoint = camera.position.clone().addScaledVector(sourceRay, planeDistance);
		const pixelWorldExtent = (2 * Math.tan((camera.fov * Math.PI) / 360)) / viewport.heightPixels;
		const planeWidth = 10 * pixelWorldExtent;
		const planeHeight = 10 * pixelWorldExtent;
		blocker.scale.set(planeWidth / 0.5, planeHeight / 0.5, 1);
		blocker.position.copy(sourcePoint).addScaledVector(right, -0.5 * planeWidth);
	} else {
		throw new Error(`Unsupported Flat raster blocker kind: ${control.kind}`);
	}
	blocker.updateMatrixWorld(true);
}

/** Return bounded runtime shader diagnostics after material preparation. */
function programDiagnostics(renderer, runtimePass) {
	const currentProgram = renderer.properties.get(runtimePass.material)?.currentProgram;
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

/** Return static facts for the exact affine unnormalized ray helper only. */
function unnormalizedRaySourceDiagnostics(shaderSource) {
	const functionStart = shaderSource.indexOf('vec3 flatLocalAnalyticUnnormalizedModelRay');
	const functionEnd = shaderSource.indexOf('FlatLocalAnalyticConic flatLocalAnalyticResolveConic', functionStart);
	const source =
		functionStart >= 0 && functionEnd > functionStart ? shaderSource.slice(functionStart, functionEnd) : '';
	return {
		present: source.length > 0,
		containsNormalize: /\bnormalize\s*\(/u.test(source),
		containsHomogeneousDivide: /\.w\b/u.test(source),
		usesInverseProjectionXyz: source.includes('(uInverseProjectionMatrix * clip).xyz'),
		usesInverseViewDirectionWZero: source.includes('vec4(viewDirection, 0.0)'),
		usesGeometryFrame:
			source.includes('GEOMETRY_OBSERVER_RIGHT_DIRECTION') &&
			source.includes('GEOMETRY_OBSERVER_UP_DIRECTION') &&
			source.includes('GEOMETRY_OBSERVER_FORWARD_DIRECTION'),
	};
}

/** Return renderer and actual hardware identity facts. */
function rendererFacts(renderer) {
	const context = renderer.getContext();
	const debug = context.getExtension('WEBGL_debug_renderer_info');
	const rendererName = context.getParameter(context.RENDERER);
	const unmaskedRenderer = debug ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null;
	return {
		userAgent: navigator.userAgent,
		webglVersion: context.getParameter(context.VERSION),
		shadingLanguageVersion: context.getParameter(context.SHADING_LANGUAGE_VERSION),
		vendor: context.getParameter(context.VENDOR),
		renderer: rendererName,
		unmaskedVendor: debug ? context.getParameter(debug.UNMASKED_VENDOR_WEBGL) : null,
		unmaskedRenderer,
		softwareRendererDetected:
			/swiftshader|software|llvmpipe|lavapipe|\bwarp\b|microsoft basic render driver/iu.test(
				[rendererName, unmaskedRenderer ?? ''].join(' '),
			),
		isWebGL2: renderer.capabilities.isWebGL2,
		threeRevision: THREE.REVISION,
		outputColorSpace: renderer.outputColorSpace,
		toneMapping: renderer.toneMapping,
	};
}

/** Return a sum of one scalar property over a tile. */
function sumBy(pixels, selector) {
	return pixels.reduce((sum, pixel) => sum + selector(pixel), 0);
}

/** Return a channel-wise sum of spectrum times pixel solid angle. */
function spectralTileEnergy(pixels, spectrumKey) {
	const result = new Array(SPECTRAL_CHANNEL_COUNT).fill(0);
	for (const pixel of pixels) {
		for (let channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
			result[channelIndex] += pixel[spectrumKey][channelIndex] * pixel.solidAngleSteradians;
		}
	}
	return result;
}

/** Divide one energy spectrum by one positive supported solid angle. */
function normalizeEnergy(energy, supportedSolidAngle) {
	return supportedSolidAngle > 0 ? energy.map((value) => value / supportedSolidAngle) : null;
}

/** Return every object/state identity mutated or traversed by diagnostic readouts. */
function diagnosticReadoutState(renderer, runtimePass, readBuffer, target) {
	const rendererTarget = renderer.getRenderTarget();
	return {
		mode: runtimePass.uniforms.uFlatLocalAnalyticRasterMode.value,
		renderToScreen: runtimePass.renderToScreen,
		targetScissor: target.scissor.toArray(),
		targetScissorTest: target.scissorTest,
		rendererTargetUuid: rendererTarget?.uuid ?? null,
		rendererTargetIsNull: rendererTarget === null,
		rendererTargetIsReadBuffer: rendererTarget === readBuffer,
		rendererTargetIsDiagnosticTarget: rendererTarget === target,
		readBufferUuid: readBuffer.uuid,
		diagnosticTargetUuid: target.uuid,
	};
}

/** Capture all production controls, candidate facts, and independent oracle facts for one tile. */
async function captureTile({
	renderer,
	runtimePass,
	readBuffer,
	target,
	tile,
	oracle,
	fixture,
	reportProgress,
	progressIdentity,
}) {
	const modes = FLAT_LOCAL_ANALYTIC_RASTER_MODES;
	const readoutStateBefore = diagnosticReadoutState(renderer, runtimePass, readBuffer, target);
	const pathBefore = readSpectrumTile(renderer, runtimePass, readBuffer, target, tile, modes.pathPacketStart);
	const cacheBefore = readSpectrumTile(renderer, runtimePass, readBuffer, target, tile, modes.sourceCachePacketStart);
	const productionCelestial = readSpectrumTile(
		renderer,
		runtimePass,
		readBuffer,
		target,
		tile,
		modes.productionCelestialPacketStart,
	);
	const productionPreDisplay = readSpectrumTile(
		renderer,
		runtimePass,
		readBuffer,
		target,
		tile,
		modes.productionPreDisplayPacketStart,
	);
	const candidateCelestial = readSpectrumTile(
		renderer,
		runtimePass,
		readBuffer,
		target,
		tile,
		modes.candidateCelestialPacketStart,
	);
	const candidatePreDisplay = readSpectrumTile(
		renderer,
		runtimePass,
		readBuffer,
		target,
		tile,
		modes.candidatePreDisplayPacketStart,
	);
	const readouts = {
		productionNormal: readModeTile(renderer, runtimePass, readBuffer, target, tile, modes.passthrough),
		candidateNormal: readModeTile(renderer, runtimePass, readBuffer, target, tile, modes.candidateNormal),
		productionDirectY: readModeTile(renderer, runtimePass, readBuffer, target, tile, modes.productionDirectY),
		candidateDirectY: readModeTile(renderer, runtimePass, readBuffer, target, tile, modes.candidateDirectY),
		coverage: readModeTile(renderer, runtimePass, readBuffer, target, tile, modes.analyticCoverage),
		legacy: readModeTile(renderer, runtimePass, readBuffer, target, tile, modes.legacyHitFraction),
		hitMask: readModeTile(renderer, runtimePass, readBuffer, target, tile, modes.legacyHitMask),
		visibleMask: readModeTile(renderer, runtimePass, readBuffer, target, tile, modes.visibleTransportMask),
		fallback: readModeTile(renderer, runtimePass, readBuffer, target, tile, modes.fallbackDiagnostics),
		weight: readModeTile(renderer, runtimePass, readBuffer, target, tile, modes.weightDiagnostics),
		composition: readModeTile(renderer, runtimePass, readBuffer, target, tile, modes.compositionResidual),
		conic: readModeTile(renderer, runtimePass, readBuffer, target, tile, modes.conicDiagnostics),
		coverageNumerics: readModeTile(
			renderer,
			runtimePass,
			readBuffer,
			target,
			tile,
			modes.coverageNumericsDiagnostics,
		),
		conicCoefficients0: readModeTile(renderer, runtimePass, readBuffer, target, tile, modes.conicCoefficients0),
		conicCoefficients1: readModeTile(renderer, runtimePass, readBuffer, target, tile, modes.conicCoefficients1),
		conicAxis: readModeTile(renderer, runtimePass, readBuffer, target, tile, modes.conicAxisDiagnostics),
		conicScale: readModeTile(renderer, runtimePass, readBuffer, target, tile, modes.conicScaleDiagnostics),
		unnormalizedRayDirection: readModeTile(
			renderer,
			runtimePass,
			readBuffer,
			target,
			tile,
			modes.unnormalizedRayDirection,
		),
		productionRayDirection: readModeTile(
			renderer,
			runtimePass,
			readBuffer,
			target,
			tile,
			modes.productionRayDirection,
		),
		transportCounts: readModeTile(renderer, runtimePass, readBuffer, target, tile, modes.transportCountDiagnostics),
	};
	const pathAfter = readSpectrumTile(renderer, runtimePass, readBuffer, target, tile, modes.pathPacketStart);
	const cacheAfter = readSpectrumTile(renderer, runtimePass, readBuffer, target, tile, modes.sourceCachePacketStart);
	const readoutStateAfter = diagnosticReadoutState(renderer, runtimePass, readBuffer, target);
	const pixels = [];
	for (let localY = 0; localY < tile.height; localY += 1) {
		for (let localX = 0; localX < tile.width; localX += 1) {
			const pixelIndex = localY * tile.width + localX;
			const pixel = {x: tile.x + localX, y: tile.y + localY};
			const fineOracle = resolveSubdivisionCoverage(oracle, pixel, fixture.oracle.fineSubdivisionAxisCount);
			const coarseOracle = resolveSubdivisionCoverage(oracle, pixel, fixture.oracle.coarseSubdivisionAxisCount);
			const conicOracle = resolveFloat64ConicDiagnostics(oracle, pixel);
			pixels.push({
				local: {x: localX, y: localY},
				pixel,
				pathSpectrum: pathBefore[pixelIndex],
				pathSpectrumAfterCandidateReadouts: pathAfter[pixelIndex],
				cacheSpectrum: cacheBefore[pixelIndex],
				cacheSpectrumAfterCandidateReadouts: cacheAfter[pixelIndex],
				productionCelestialSpectrum: productionCelestial[pixelIndex],
				productionPreDisplaySpectrum: productionPreDisplay[pixelIndex],
				candidateCelestialSpectrum: candidateCelestial[pixelIndex],
				candidatePreDisplaySpectrum: candidatePreDisplay[pixelIndex],
				productionNormalRgba: readouts.productionNormal[pixelIndex],
				candidateNormalRgba: readouts.candidateNormal[pixelIndex],
				productionDirectY: readouts.productionDirectY[pixelIndex],
				candidateDirectY: readouts.candidateDirectY[pixelIndex],
				analyticCoverage: readouts.coverage[pixelIndex][0],
				conicValid: readouts.coverage[pixelIndex][1] >= 0.5,
				conicMapDeterminant: readouts.coverage[pixelIndex][2],
				conicForward: readouts.coverage[pixelIndex][3] >= 0.5,
				legacyGeometricHitFraction: readouts.legacy[pixelIndex][0],
				legacyVisibleTransportFraction: readouts.legacy[pixelIndex][1],
				diskHitCount: readouts.legacy[pixelIndex][2],
				visibleTransportCount: readouts.legacy[pixelIndex][3],
				diskHitMask: readouts.hitMask[pixelIndex],
				visibleTransportMask: readouts.visibleMask[pixelIndex],
				fallbackUsed: readouts.fallback[pixelIndex][0] >= 0.5,
				centerBlocked: readouts.fallback[pixelIndex][1] >= 0.5,
				candidateTransportEvaluationCount: readouts.fallback[pixelIndex][2],
				totalProofTransportEvaluationCount: readouts.fallback[pixelIndex][3],
				appliedScale: readouts.weight[pixelIndex][2],
				candidateCompositionResidual: readouts.composition[pixelIndex][0],
				productionCompositionResidual: readouts.composition[pixelIndex][1],
				conicCenterPixels: readouts.conic[pixelIndex].slice(0, 2),
				conicCenterSupport: readouts.conic[pixelIndex][2],
				rawAnalyticCoverage: readouts.coverageNumerics[pixelIndex][0],
				coverageClampResidual: readouts.coverageNumerics[pixelIndex][2],
				signedMappedArea: readouts.coverageNumerics[pixelIndex][3],
				conicCoefficients: {
					constantTerm: readouts.conicCoefficients0[pixelIndex][0],
					linearTerm: readouts.conicCoefficients0[pixelIndex].slice(1, 3),
					hessian: [
						readouts.conicCoefficients0[pixelIndex][3],
						readouts.conicCoefficients1[pixelIndex][0],
						readouts.conicCoefficients1[pixelIndex][1],
					],
					hessianDeterminant: readouts.conicCoefficients1[pixelIndex][2],
				},
				conicAxis: {
					base: readouts.conicAxis[pixelIndex][0],
					pixelX: readouts.conicAxis[pixelIndex][1],
					pixelY: readouts.conicAxis[pixelIndex][2],
					minimumOnPixel: readouts.conicCoefficients1[pixelIndex][3],
					maximumOnPixel: readouts.conicAxis[pixelIndex][3],
				},
				coneTangentSquared: readouts.conicScale[pixelIndex][0],
				axisAtEllipseCenter: readouts.conicScale[pixelIndex][1],
				forwardPolygonVertexCount: readouts.conicScale[pixelIndex][2],
				unnormalizedRayDirection: readouts.unnormalizedRayDirection[pixelIndex].slice(0, 3),
				productionRayDirection: readouts.productionRayDirection[pixelIndex].slice(0, 3),
				oracleRayDirection: resolveOraclePixelCenterDirection(oracle, pixel),
				conicOracle,
				fineOracle,
				coarseOracle,
				solidAngleSteradians: resolvePixelSolidAngle(oracle, pixel),
			});
		}
		await reportProgress({
			stage: 'oracle-row-complete',
			...progressIdentity,
			rowIndex: localY + 1,
			rowCount: tile.height,
		});
	}
	const analyticSupportedSolidAngle = sumBy(pixels, (pixel) => pixel.analyticCoverage * pixel.solidAngleSteradians);
	const oracleSupportedSolidAngle = sumBy(pixels, (pixel) => pixel.fineOracle.coverage * pixel.solidAngleSteradians);
	const candidateEnergy = spectralTileEnergy(pixels, 'candidateCelestialSpectrum');
	const productionEnergy = spectralTileEnergy(pixels, 'productionCelestialSpectrum');
	return {
		tile,
		readoutStateBefore,
		readoutStateAfter,
		oracle: describeFloat64RaySphereOracle(oracle),
		pixels,
		summary: {
			analyticCoverageSum: sumBy(pixels, (pixel) => pixel.analyticCoverage),
			fineOracleCoverageSum: sumBy(pixels, (pixel) => pixel.fineOracle.coverage),
			coarseOracleCoverageSum: sumBy(pixels, (pixel) => pixel.coarseOracle.coverage),
			legacyGeometricHitFractionSum: sumBy(pixels, (pixel) => pixel.legacyGeometricHitFraction),
			analyticSupportedSolidAngleSteradians: analyticSupportedSolidAngle,
			oracleSupportedSolidAngleSteradians: oracleSupportedSolidAngle,
			candidateSpectralEnergy: candidateEnergy,
			productionSpectralEnergy: productionEnergy,
			coverageNormalizedCandidateSpectrum: normalizeEnergy(candidateEnergy, analyticSupportedSolidAngle),
			coverageNormalizedProductionSpectrum: normalizeEnergy(productionEnergy, analyticSupportedSolidAngle),
			fallbackPixelCount: pixels.filter((pixel) => pixel.fallbackUsed).length,
			analyticPositiveLegacyZeroPixelCount: pixels.filter(
				(pixel) => pixel.analyticCoverage > 0 && pixel.diskHitCount === 0,
			).length,
			maximumCandidateTransportEvaluationCount: Math.max(
				...pixels.map((pixel) => pixel.candidateTransportEvaluationCount),
			),
			maximumTotalProofTransportEvaluationCount: Math.max(
				...pixels.map((pixel) => pixel.totalProofTransportEvaluationCount),
			),
			maximumAbsoluteCoverageClampResidual: Math.max(
				...pixels.map((pixel) => Math.abs(pixel.coverageClampResidual)),
			),
			maximumConicConditionNumber: Math.max(...pixels.map((pixel) => pixel.conicOracle.conditionNumber)),
		},
	};
}

/** Create the common production scene, composer, backend, and runtime. */
async function prepareRuntime(renderer, model, viewport, reportProgress, conditionId) {
	renderer.setPixelRatio(1);
	renderer.setSize(viewport.widthPixels, viewport.heightPixels, false);
	const drawingBuffer = renderer.getDrawingBufferSize(new THREE.Vector2());
	if (drawingBuffer.x !== viewport.widthPixels || drawingBuffer.y !== viewport.heightPixels) {
		throw new Error(
			`${conditionId} drawing buffer ${drawingBuffer.x}x${drawingBuffer.y} differs from ` +
				`${viewport.widthPixels}x${viewport.heightPixels}.`,
		);
	}
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);
	const camera = new THREE.PerspectiveCamera(
		viewport.verticalFovDegrees,
		viewport.widthPixels / viewport.heightPixels,
		0.001,
		10000,
	);
	camera.position.set(...model.cameraScenePosition);
	const sceneTarget = new THREE.WebGLRenderTarget(viewport.widthPixels, viewport.heightPixels, {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBAFormat,
		type: THREE.HalfFloatType,
		depthBuffer: true,
		stencilBuffer: false,
	});
	sceneTarget.texture.colorSpace = THREE.NoColorSpace;
	const composer = new EffectComposer(renderer, sceneTarget);
	composer.setPixelRatio(1);
	composer.setSize(viewport.widthPixels, viewport.heightPixels);
	composer.addPass(new RenderPass(scene, camera));
	const blocker = new THREE.Mesh(
		new THREE.PlaneGeometry(0.5, 0.5),
		new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide}),
	);
	blocker.visible = false;
	scene.add(blocker);
	const backend = new ThreeCacheBackend({THREE, renderer});
	const sceneDepthMax = model.geometry.resolveSceneDepthMax();
	const bindingValues = Algorithm32Bindings.create(THREE, sceneDepthMax);
	aimCamera(camera, model.geometry, model.sourceDirectionModel, model.sourceUpModel, [0.5, 0.5]);
	Algorithm32Bindings.update({
		bindingValues,
		camera,
		props: {config: model.algorithm.config.config, sceneScale: model.sceneScale},
	});
	let heartbeatSequence = 0;
	let schedulerYieldCount = 0;
	let lastHeartbeatAt = performance.now();
	const setupStartedAt = performance.now();
	const cacheBuildScheduler = {
		async yieldControl() {
			await new Promise((resolve) => requestAnimationFrame(() => resolve()));
			schedulerYieldCount += 1;
			const now = performance.now();
			if (now - lastHeartbeatAt >= CACHE_HEARTBEAT_INTERVAL_MILLISECONDS) {
				heartbeatSequence += 1;
				lastHeartbeatAt = now;
				await reportProgress({
					stage: 'gpu-cache-heartbeat',
					conditionId,
					heartbeatSequence,
					workCompleted: schedulerYieldCount,
					phaseDurationMilliseconds: now - setupStartedAt,
				});
			}
		},
	};
	await reportProgress({stage: 'gpu-setup-start', conditionId});
	const handle = await model.algorithm.setupShader({
		THREE,
		composer,
		scene,
		camera,
		viewportSize: {width: viewport.widthPixels, height: viewport.heightPixels, units: 'pixels'},
		sceneScale: model.sceneScale,
		sceneDepthMax,
		bindingValues,
		cacheBackend: backend,
		cacheBuildScheduler,
	});
	const programPreparationStartedAt = performance.now();
	await handle.prepare(renderer);
	const programPreparationMilliseconds = performance.now() - programPreparationStartedAt;
	const setupDurationMilliseconds = performance.now() - setupStartedAt;
	await reportProgress({
		stage: 'gpu-setup-complete',
		conditionId,
		durationMilliseconds: setupDurationMilliseconds,
	});
	return {
		scene,
		camera,
		sceneTarget,
		composer,
		blocker,
		backend,
		cacheBuildScheduler,
		sceneDepthMax,
		bindingValues,
		handle,
		setupDurationMilliseconds,
		programPreparationMilliseconds,
		drawingBufferSize: {widthPixels: drawingBuffer.x, heightPixels: drawingBuffer.y},
	};
}

/** Dispose one prepared runtime without disposing the renderer. */
function disposeRuntime(runtime, model) {
	runtime.handle.dispose();
	model.algorithm.dispose();
	runtime.composer.dispose();
	runtime.sceneTarget.dispose();
	runtime.blocker.geometry.dispose();
	runtime.blocker.material.dispose();
	runtime.backend.dispose();
}

/** Run the two selected Flat conditions through both viewports and all phases. */
async function runFlatCondition(renderer, fixture, condition, reportProgress) {
	const model = createFlatModel(fixture, condition);
	const firstViewport = fixture.viewports[0];
	const runtime = await prepareRuntime(renderer, model, firstViewport, reportProgress, condition.id);
	try {
		const shaderSource = runtime.handle._buildResult?.assembly?.fragmentShaderSource;
		if (typeof shaderSource !== 'string') throw new Error('Flat proof retained no assembled shader source.');
		const runtimePass = runtime.composer.passes.find(
			(pass) => pass?.uniforms?.uFlatLocalAnalyticRasterMode !== undefined,
		);
		if (runtimePass === undefined) throw new Error('Flat analytic proof uniform was not installed.');
		const contribution = runtime.handle._buildResult.assembly.contributions.find(
			(value) => value.id === 'proof-flat-local-analytic-disk-raster',
		);
		if (contribution === undefined) throw new Error('Flat analytic proof contribution was not assembled.');
		const contributionSourceBlocks = await Promise.all(
			[
				...contribution.functions.map((block) => ({kind: 'function', block})),
				...contribution.mainHooks.map((block) => ({kind: 'main-hook', block})),
			].map(async ({kind, block}) => ({
				kind,
				id: block.id,
				slot: block.slot,
				order: block.order,
				...(await sha256Utf8(block.code)),
			})),
		);
		const contributionUniformDeclarations = await Promise.all(
			contribution.uniforms.map(async (uniform) => {
				const source = `uniform ${uniform.type} ${uniform.name};`;
				return {
					name: uniform.name,
					type: uniform.type,
					valueKey: uniform.valueKey,
					occurrenceCount: sourceOccurrenceCount(shaderSource, source),
					...(await sha256Utf8(source)),
				};
			}),
		);
		for (const block of contributionSourceBlocks) {
			block.occurrenceCount = sourceOccurrenceCount(
				shaderSource,
				[...contribution.functions, ...contribution.mainHooks].find((value) => value.id === block.id).code,
			);
		}
		const assemblySeparatorBytes =
			(contribution.uniforms.length > 0 ? 1 : 0) +
			(contribution.functions.length > 0 ? 2 : 0) +
			(contribution.mainHooks.length > 0 ? 2 : 0);
		const assembledContributionFootprintBytes =
			contributionSourceBlocks.reduce((sum, block) => sum + block.bytes, 0) +
			contributionUniformDeclarations.reduce((sum, uniform) => sum + uniform.bytes, 0) +
			assemblySeparatorBytes;
		const viewportResults = [];
		for (const viewport of fixture.viewports) {
			const width = viewport.widthPixels;
			const height = viewport.heightPixels;
			const centerPixel = {x: Math.floor(width / 2), y: Math.floor(height / 2)};
			const tile = {
				x: centerPixel.x - Math.floor(fixture.tile.widthPixels / 2),
				y: centerPixel.y - Math.floor(fixture.tile.heightPixels / 2),
				width: fixture.tile.widthPixels,
				height: fixture.tile.heightPixels,
			};
			runtime.camera.fov = viewport.verticalFovDegrees;
			runtime.camera.aspect = width / height;
			runtime.camera.updateProjectionMatrix();
			runtime.composer.setSize(width, height);
			renderer.setSize(width, height, false);
			const drawingBuffer = renderer.getDrawingBufferSize(new THREE.Vector2());
			if (drawingBuffer.x !== width || drawingBuffer.y !== height) {
				throw new Error(`${condition.id}/${viewport.id} drawing-buffer size differs from its viewport.`);
			}
			const target = createFloatTarget(width, height, `${condition.id}.${viewport.id}.analytic-proof`);
			const phases = [];
			try {
				for (const phaseOffsetPixels of fixture.tile.sourceCenterHorizontalPhaseOffsetsPixels) {
					await reportProgress({
						stage: 'phase-start',
						conditionId: condition.id,
						viewportId: viewport.id,
						phaseOffsetPixels,
					});
					const sourceTextureCoordinates = [
						(centerPixel.x + 0.5 + phaseOffsetPixels) / width,
						(centerPixel.y + 0.5) / height,
					];
					aimCamera(
						runtime.camera,
						model.geometry,
						model.sourceDirectionModel,
						model.sourceUpModel,
						sourceTextureCoordinates,
					);
					positionBlocker(runtime.blocker, runtime.camera, null, sourceTextureCoordinates, viewport);
					Algorithm32Bindings.update({
						bindingValues: runtime.bindingValues,
						camera: runtime.camera,
						props: {config: model.algorithm.config.config, sceneScale: model.sceneScale},
					});
					runtimePass.uniforms.uFlatLocalAnalyticRasterMode.value =
						FLAT_LOCAL_ANALYTIC_RASTER_MODES.passthrough;
					runtime.composer.render();
					const rayOrigin = Array.from(runtimePass.uniforms.uCameraWorldPositionMeters.value.toArray());
					const oracle = createFloat64RaySphereOracle({
						inverseProjectionMatrixElements: Array.from(
							runtimePass.uniforms.uInverseProjectionMatrix.value.elements,
						),
						inverseViewMatrixElements: Array.from(runtimePass.uniforms.uInverseViewMatrix.value.elements),
						frame: {
							right: Array.from(model.geometry.mapObserverLocalSceneDirectionToModelDirection([1, 0, 0])),
							up: Array.from(model.geometry.mapObserverLocalSceneDirectionToModelDirection([0, 1, 0])),
							forward: Array.from(
								model.geometry.mapObserverLocalSceneDirectionToModelDirection([0, 0, 1]),
							),
						},
						rayOriginMeters: rayOrigin,
						sourceCenterMeters: model.sourceCenterMeters,
						sourceRadiusMeters: model.sourceRadiusMeters,
						viewport: {width, height},
					});
					const capture = await captureTile({
						renderer,
						runtimePass,
						readBuffer: runtime.composer.readBuffer,
						target,
						tile,
						oracle,
						fixture,
						reportProgress,
						progressIdentity: {conditionId: condition.id, viewportId: viewport.id, phaseOffsetPixels},
					});
					phases.push({phaseOffsetPixels, sourceTextureCoordinates, ...capture});
					await reportProgress({
						stage: 'phase-complete',
						conditionId: condition.id,
						viewportId: viewport.id,
						phaseOffsetPixels,
					});
				}
				viewportResults.push({
					...viewport,
					drawingBufferSize: {widthPixels: drawingBuffer.x, heightPixels: drawingBuffer.y},
					tile,
					phases,
				});
			} finally {
				target.dispose();
			}
		}
		const blockerControls = [];
		for (const blocker of fixture.tile.blockerControls.filter((value) => value.conditionId === condition.id)) {
			const viewport = fixture.viewports.find((value) => value.id === blocker.viewportId);
			const width = viewport.widthPixels;
			const height = viewport.heightPixels;
			const centerPixel = {x: Math.floor(width / 2), y: Math.floor(height / 2)};
			const tile = {
				x: centerPixel.x - Math.floor(fixture.tile.widthPixels / 2),
				y: centerPixel.y - Math.floor(fixture.tile.heightPixels / 2),
				width: fixture.tile.widthPixels,
				height: fixture.tile.heightPixels,
			};
			runtime.camera.fov = viewport.verticalFovDegrees;
			runtime.camera.aspect = width / height;
			runtime.camera.updateProjectionMatrix();
			runtime.composer.setSize(width, height);
			renderer.setSize(width, height, false);
			const sourceTextureCoordinates = [
				(centerPixel.x + 0.5 + blocker.phaseOffsetPixels) / width,
				(centerPixel.y + 0.5) / height,
			];
			aimCamera(
				runtime.camera,
				model.geometry,
				model.sourceDirectionModel,
				model.sourceUpModel,
				sourceTextureCoordinates,
			);
			positionBlocker(runtime.blocker, runtime.camera, blocker, sourceTextureCoordinates, viewport);
			Algorithm32Bindings.update({
				bindingValues: runtime.bindingValues,
				camera: runtime.camera,
				props: {config: model.algorithm.config.config, sceneScale: model.sceneScale},
			});
			runtimePass.uniforms.uFlatLocalAnalyticRasterMode.value = FLAT_LOCAL_ANALYTIC_RASTER_MODES.passthrough;
			runtime.composer.render();
			const target = createFloatTarget(width, height, `${condition.id}.${blocker.id}.analytic-proof`);
			try {
				const oracle = createFloat64RaySphereOracle({
					inverseProjectionMatrixElements: Array.from(
						runtimePass.uniforms.uInverseProjectionMatrix.value.elements,
					),
					inverseViewMatrixElements: Array.from(runtimePass.uniforms.uInverseViewMatrix.value.elements),
					frame: {
						right: Array.from(model.geometry.mapObserverLocalSceneDirectionToModelDirection([1, 0, 0])),
						up: Array.from(model.geometry.mapObserverLocalSceneDirectionToModelDirection([0, 1, 0])),
						forward: Array.from(model.geometry.mapObserverLocalSceneDirectionToModelDirection([0, 0, 1])),
					},
					rayOriginMeters: Array.from(runtimePass.uniforms.uCameraWorldPositionMeters.value.toArray()),
					sourceCenterMeters: model.sourceCenterMeters,
					sourceRadiusMeters: model.sourceRadiusMeters,
					viewport: {width, height},
				});
				const capture = await captureTile({
					renderer,
					runtimePass,
					readBuffer: runtime.composer.readBuffer,
					target,
					tile,
					oracle,
					fixture,
					reportProgress,
					progressIdentity: {
						blockerId: blocker.id,
						conditionId: condition.id,
						viewportId: viewport.id,
						phaseOffsetPixels: blocker.phaseOffsetPixels,
						blocker: true,
					},
				});
				blockerControls.push({
					id: blocker.id,
					kind: blocker.kind,
					viewportId: blocker.viewportId,
					phaseOffsetPixels: blocker.phaseOffsetPixels,
					sourceTextureCoordinates,
					...capture,
				});
			} finally {
				target.dispose();
				positionBlocker(runtime.blocker, runtime.camera, null, sourceTextureCoordinates, viewport);
			}
		}
		let backwardHalfSpaceControl = null;
		const backwardControl = fixture.tile.backwardHalfSpaceControl;
		if (backwardControl.conditionId === condition.id) {
			const viewport = fixture.viewports.find((value) => value.id === backwardControl.viewportId);
			const width = viewport.widthPixels;
			const height = viewport.heightPixels;
			const centerPixel = {x: Math.floor(width / 2), y: Math.floor(height / 2)};
			const tile = {
				x: centerPixel.x,
				y: centerPixel.y,
				width: backwardControl.widthPixels,
				height: backwardControl.heightPixels,
			};
			const aimTextureCoordinates = [(centerPixel.x + 0.5) / width, (centerPixel.y + 0.5) / height];
			runtime.camera.fov = viewport.verticalFovDegrees;
			runtime.camera.aspect = width / height;
			runtime.camera.updateProjectionMatrix();
			runtime.composer.setSize(width, height);
			renderer.setSize(width, height, false);
			aimCamera(
				runtime.camera,
				model.geometry,
				model.sourceDirectionModel.map((component) => -component),
				model.sourceUpModel,
				aimTextureCoordinates,
			);
			positionBlocker(runtime.blocker, runtime.camera, null, aimTextureCoordinates, viewport);
			Algorithm32Bindings.update({
				bindingValues: runtime.bindingValues,
				camera: runtime.camera,
				props: {config: model.algorithm.config.config, sceneScale: model.sceneScale},
			});
			runtimePass.uniforms.uFlatLocalAnalyticRasterMode.value = FLAT_LOCAL_ANALYTIC_RASTER_MODES.passthrough;
			runtime.composer.render();
			const target = createFloatTarget(width, height, `${condition.id}.${backwardControl.id}`);
			try {
				const oracle = createFloat64RaySphereOracle({
					inverseProjectionMatrixElements: Array.from(
						runtimePass.uniforms.uInverseProjectionMatrix.value.elements,
					),
					inverseViewMatrixElements: Array.from(runtimePass.uniforms.uInverseViewMatrix.value.elements),
					frame: {
						right: Array.from(model.geometry.mapObserverLocalSceneDirectionToModelDirection([1, 0, 0])),
						up: Array.from(model.geometry.mapObserverLocalSceneDirectionToModelDirection([0, 1, 0])),
						forward: Array.from(model.geometry.mapObserverLocalSceneDirectionToModelDirection([0, 0, 1])),
					},
					rayOriginMeters: Array.from(runtimePass.uniforms.uCameraWorldPositionMeters.value.toArray()),
					sourceCenterMeters: model.sourceCenterMeters,
					sourceRadiusMeters: model.sourceRadiusMeters,
					viewport: {width, height},
				});
				const capture = await captureTile({
					renderer,
					runtimePass,
					readBuffer: runtime.composer.readBuffer,
					target,
					tile,
					oracle,
					fixture,
					reportProgress,
					progressIdentity: {
						backwardHalfSpaceControlId: backwardControl.id,
						conditionId: condition.id,
						viewportId: viewport.id,
					},
				});
				backwardHalfSpaceControl = {
					...backwardControl,
					aimTextureCoordinates,
					...capture,
				};
			} finally {
				target.dispose();
			}
		}
		const sourceCenterResidualMeters = Math.hypot(
			...model.sourceCenterMeters.map((value, index) => value - condition.expectedCenterMeters[index]),
		);
		const cacheOwnerIdentity = runtime.handle._buildResult.flatFiniteSunCacheIdentity;
		const cacheResource = runtime.handle._buildResult.flatFiniteSunCache;
		return {
			id: condition.id,
			executionBackend: 'gpu',
			separateCpuN4AtmosphericCacheRefinedOrFullFrameLaneUsed: false,
			normalGpuPathCelestialCpuReferenceHelperUsed: false,
			sourcePathConvergenceUsed: false,
			source: {
				centerMeters: model.sourceCenterMeters,
				expectedCenterMeters: condition.expectedCenterMeters,
				centerResidualMeters: sourceCenterResidualMeters,
				radiusMeters: model.sourceRadiusMeters,
				distanceMeters: model.sourceDistanceMeters,
				surfaceRadiance: Array.from(model.lightSource.celestialSourceDefinition.surfaceRadiance.values),
			},
			shader: {
				sourceLengthBytes: new TextEncoder().encode(shaderSource).byteLength,
				sourceHash: runtime.handle._buildResult.assembly.sourceHash,
				containsProofContribution: shaderSource.includes('flatLocalAnalyticCoverage'),
				unnormalizedRay: unnormalizedRaySourceDiagnostics(shaderSource),
				program: programDiagnostics(renderer, runtimePass),
			},
			contribution: {
				id: contribution.id,
				owner: contribution.owner,
				requires: [...contribution.requires],
				uniformCount: contribution.uniforms.length,
				textureCount: contribution.textures.length,
				bindingRequirementCount: contribution.bindingRequirements.length,
				authoredSourceLengthBytes: contributionSourceBlocks.reduce((sum, block) => sum + block.bytes, 0),
				sourceBlocks: contributionSourceBlocks,
				uniformDeclarations: contributionUniformDeclarations,
				assemblySeparatorBytes,
				assembledContributionFootprintBytes,
				assemblyFootprintModel:
					'exact-utf8-blocks-plus-uniform-declaration-plus-runtime-assembler-join-separators',
				diagnostics: contribution.diagnostics,
			},
			composerPasses: runtime.composer.passes.map((pass, index) => ({
				index,
				constructorName: pass.constructor.name,
				needsSwap: pass.needsSwap,
				renderToScreen: pass.renderToScreen,
				hasProofUniform: pass?.uniforms?.uFlatLocalAnalyticRasterMode !== undefined,
			})),
			bindingValueKeys: runtime.handle._buildResult.bindingRequirements.map((value) => value.valueKey).sort(),
			cacheIdentity: {
				schemaVersion: 'flat-finite-sun-cache-proof-identity-v1',
				identityPresent: cacheOwnerIdentity !== null && cacheResource !== null,
				backendMatchesRuntime: cacheOwnerIdentity?.backend === runtime.backend,
				schedulerMatchesRuntime: cacheOwnerIdentity?.scheduler === runtime.cacheBuildScheduler,
				sourceMatchesConfiguredModel: cacheOwnerIdentity?.source === model.lightSource,
				geometryMatchesConfiguredModel: cacheOwnerIdentity?.geometry === model.geometry,
				resourceIdentity: cacheResource?.resourceIdentity ?? null,
				sourceId: cacheResource?.sourceId ?? null,
				sourceDefinitionHash: model.lightSource.describeCelestialSourceIdentity().definitionHash,
				descriptor: cacheResource?.descriptor ?? null,
				profileId: DEFAULT_NATIVE_PRODUCTION_PROFILE.id,
				sourceRadiusMeters: model.sourceRadiusMeters,
				sourceDistanceMeters: model.sourceDistanceMeters,
				configuredCacheRadialMaximumMeters: model.geometry.configuration.cacheRadialMaximum.value,
				derivedHorizontalCenterRadiusMeters: Math.hypot(
					model.sourceCenterMeters[0],
					model.sourceCenterMeters[1],
				),
			},
			pathProfile: {
				id: DEFAULT_NATIVE_PRODUCTION_PROFILE.id,
				maximumScatteringOrder: 4,
				viewPathIntervalCount: DEFAULT_NATIVE_PRODUCTION_PROFILE.numerical.viewPath.intervalCount,
				sourcePathIntervalCount:
					DEFAULT_NATIVE_PRODUCTION_PROFILE.numerical.sourcePathTransmittance.intervalCount,
			},
			setupDurationMilliseconds: runtime.setupDurationMilliseconds,
			programPreparationMilliseconds: runtime.programPreparationMilliseconds,
			viewports: viewportResults,
			blockerControls,
			backwardHalfSpaceControl,
		};
	} finally {
		disposeRuntime(runtime, model);
	}
}

/** Run the Flat-close full-coverage non-regression control. */
async function runFlatCloseControl(renderer, fixture, reportProgress) {
	const condition = fixture.flat.closeNonRegressionControl;
	const model = createFlatModel(fixture, condition);
	const viewport = fixture.viewports[0];
	const runtime = await prepareRuntime(renderer, model, viewport, reportProgress, condition.id);
	try {
		const runtimePass = runtime.composer.passes.find(
			(pass) => pass?.uniforms?.uFlatLocalAnalyticRasterMode !== undefined,
		);
		const centerPixel = {x: Math.floor(viewport.widthPixels / 2), y: Math.floor(viewport.heightPixels / 2)};
		aimCamera(runtime.camera, model.geometry, model.sourceDirectionModel, model.sourceUpModel, [0.5, 0.5]);
		Algorithm32Bindings.update({
			bindingValues: runtime.bindingValues,
			camera: runtime.camera,
			props: {config: model.algorithm.config.config, sceneScale: model.sceneScale},
		});
		runtimePass.uniforms.uFlatLocalAnalyticRasterMode.value = FLAT_LOCAL_ANALYTIC_RASTER_MODES.passthrough;
		runtime.composer.render();
		const target = createFloatTarget(viewport.widthPixels, viewport.heightPixels, 'flat-close-control');
		try {
			const tile = {x: centerPixel.x, y: centerPixel.y, width: 1, height: 1};
			return {
				id: condition.id,
				program: programDiagnostics(renderer, runtimePass),
				setupDurationMilliseconds: runtime.setupDurationMilliseconds,
				programPreparationMilliseconds: runtime.programPreparationMilliseconds,
				drawingBufferSize: runtime.drawingBufferSize,
				centerReadCoordinatePixels: [centerPixel.x, centerPixel.y],
				analyticCoverage: readModeTile(
					renderer,
					runtimePass,
					runtime.composer.readBuffer,
					target,
					tile,
					FLAT_LOCAL_ANALYTIC_RASTER_MODES.analyticCoverage,
				)[0][0],
				legacy: readModeTile(
					renderer,
					runtimePass,
					runtime.composer.readBuffer,
					target,
					tile,
					FLAT_LOCAL_ANALYTIC_RASTER_MODES.legacyHitFraction,
				)[0],
				appliedScale: readModeTile(
					renderer,
					runtimePass,
					runtime.composer.readBuffer,
					target,
					tile,
					FLAT_LOCAL_ANALYTIC_RASTER_MODES.weightDiagnostics,
				)[0][2],
				productionCelestialSpectrum: readSpectrumTile(
					renderer,
					runtimePass,
					runtime.composer.readBuffer,
					target,
					tile,
					FLAT_LOCAL_ANALYTIC_RASTER_MODES.productionCelestialPacketStart,
				)[0],
				candidateCelestialSpectrum: readSpectrumTile(
					renderer,
					runtimePass,
					runtime.composer.readBuffer,
					target,
					tile,
					FLAT_LOCAL_ANALYTIC_RASTER_MODES.candidateCelestialPacketStart,
				)[0],
			};
		} finally {
			target.dispose();
		}
	} finally {
		disposeRuntime(runtime, model);
	}
}

/** Run a production-only distant family non-regression control. */
async function runDistantControl(renderer, fixture, reportProgress) {
	const model = createDistantModel(fixture);
	const viewport = fixture.viewports[0];
	const runtime = await prepareRuntime(
		renderer,
		model,
		viewport,
		reportProgress,
		fixture.distantNonRegressionControl.id,
	);
	try {
		const shaderSource = runtime.handle._buildResult?.assembly?.fragmentShaderSource;
		const runtimePass = runtime.composer.passes.at(-1);
		if (runtimePass?.uniforms?.uDistantControlReadoutMode === undefined) {
			throw new Error('Distant celestial control readout uniform was not installed.');
		}
		const readoutContribution = runtime.handle._buildResult.assembly.contributions.find(
			(value) => value.id === 'proof-distant-sun-celestial-readout',
		);
		if (readoutContribution === undefined) throw new Error('Distant celestial control readout was not assembled.');
		aimCamera(runtime.camera, model.geometry, model.sourceDirectionModel, model.sourceUpModel, [0.5, 0.5]);
		Algorithm32Bindings.update({
			bindingValues: runtime.bindingValues,
			camera: runtime.camera,
			props: {config: model.algorithm.config.config, sceneScale: model.sceneScale},
		});
		runtime.composer.render();
		const context = renderer.getContext();
		const pixel = new Uint8Array(4);
		const readCoordinatePixels = [
			Math.floor(context.drawingBufferWidth / 2),
			Math.floor(context.drawingBufferHeight / 2),
		];
		context.readPixels(
			readCoordinatePixels[0],
			readCoordinatePixels[1],
			1,
			1,
			context.RGBA,
			context.UNSIGNED_BYTE,
			pixel,
		);
		const target = createFloatTarget(viewport.widthPixels, viewport.heightPixels, 'distant-sun-control-readout');
		let celestialSpectrum;
		try {
			celestialSpectrum = readSpectrumTile(
				renderer,
				runtimePass,
				runtime.composer.readBuffer,
				target,
				{x: readCoordinatePixels[0], y: readCoordinatePixels[1], width: 1, height: 1},
				DISTANT_CONTROL_MODES.celestialPacketStart,
				'uDistantControlReadoutMode',
			)[0];
		} finally {
			target.dispose();
		}
		return {
			id: fixture.distantNonRegressionControl.id,
			program: programDiagnostics(renderer, runtimePass),
			setupDurationMilliseconds: runtime.setupDurationMilliseconds,
			programPreparationMilliseconds: runtime.programPreparationMilliseconds,
			drawingBufferSize: {
				widthPixels: context.drawingBufferWidth,
				heightPixels: context.drawingBufferHeight,
			},
			centerReadCoordinatePixels: readCoordinatePixels,
			celestialSpectrum,
			readoutContribution: {
				id: readoutContribution.id,
				uniformCount: readoutContribution.uniforms.length,
				textureCount: readoutContribution.textures.length,
				bindingRequirementCount: readoutContribution.bindingRequirements.length,
			},
			normalGpuPathCelestialCpuReferenceHelper: {
				used: true,
				classId: 'DistantSunCelestialCpuCache',
				scalarCount:
					runtime.handle._buildResult.distantSunCelestialCache.descriptor.storage.width *
					runtime.handle._buildResult.distantSunCelestialCache.descriptor.storage.height *
					runtime.handle._buildResult.distantSunCelestialCache.descriptor.storage.layers,
				purpose: 'support-mask-and-logical-field-construction',
				disclosureBasis: 'sealed-normal-gpu-builder-contract-and-runtime-descriptor',
			},
			flatRasterProofUniformAbsent: !runtime.composer.passes.some(
				(pass) => pass?.uniforms?.uFlatLocalAnalyticRasterMode !== undefined,
			),
			flatRasterProofSourceAbsent:
				!shaderSource.includes('flatLocalAnalyticCoverage') &&
				!shaderSource.includes('uFlatLocalAnalyticRasterMode'),
			centerFramebufferRgba: Array.from(pixel),
			shaderSourceHash: runtime.handle._buildResult.assembly.sourceHash,
			bindingValueKeys: runtime.handle._buildResult.bindingRequirements.map((value) => value.valueKey).sort(),
			cacheIdentity: {
				schemaVersion: 'distant-sun-cache-proof-identity-v1',
				identityPresent:
					runtime.handle._buildResult.distantSunCelestialCacheIdentity !== null &&
					runtime.handle._buildResult.distantSunCelestialCache !== null,
				resourceIdentity: runtime.handle._buildResult.distantSunCelestialCache?.resourceIdentity ?? null,
				sourceId: runtime.handle._buildResult.distantSunCelestialCache?.sourceId ?? null,
				descriptor: runtime.handle._buildResult.distantSunCelestialCache?.descriptor ?? null,
			},
		};
	} finally {
		disposeRuntime(runtime, model);
	}
}

/** Require one installed analytic-raster program to be linked and runnable. */
function requireVisualProgram(renderer, runtimePass, conditionId) {
	const program = programDiagnostics(renderer, runtimePass);
	if (
		program.programAvailable !== true ||
		program.runnable !== true ||
		typeof program.programLog !== 'string' ||
		typeof program.vertexShaderLog !== 'string' ||
		typeof program.fragmentShaderLog !== 'string'
	) {
		throw new Error(`${conditionId} visual shader is not linked and runnable: ${JSON.stringify(program)}.`);
	}
}

/** Render one phase-zero candidate-normal Flat view. */
async function renderFlatVisualImage(renderer, canvas, fixture, condition, viewport, reportProgress) {
	const model = createFlatModel(fixture, condition);
	let runtime = null;
	try {
		runtime = await prepareRuntime(renderer, model, viewport, reportProgress, condition.id);
		const runtimePass = runtime.composer.passes.find(
			(pass) => pass?.uniforms?.uFlatLocalAnalyticRasterMode !== undefined,
		);
		if (runtimePass === undefined) throw new Error(`${condition.id} analytic raster pass is absent.`);
		aimCamera(runtime.camera, model.geometry, model.sourceDirectionModel, model.sourceUpModel, [0.5, 0.5]);
		positionBlocker(runtime.blocker, runtime.camera, null, [0.5, 0.5], viewport);
		Algorithm32Bindings.update({
			bindingValues: runtime.bindingValues,
			camera: runtime.camera,
			props: {config: model.algorithm.config.config, sceneScale: model.sceneScale},
		});
		runtimePass.uniforms.uFlatLocalAnalyticRasterMode.value = FLAT_LOCAL_ANALYTIC_RASTER_MODES.candidateNormal;
		await reportProgress({stage: 'visual-capture-start', conditionId: condition.id});
		runtime.composer.render();
		requireVisualProgram(renderer, runtimePass, condition.id);
		const context = renderer.getContext();
		const webglErrors = [];
		for (let error = context.getError(); error !== context.NO_ERROR; error = context.getError()) {
			webglErrors.push(error);
		}
		if (webglErrors.length > 0) {
			throw new Error(`${condition.id} visual render reported WebGL errors: ${webglErrors.join(', ')}.`);
		}
		const pngDataUrl = canvas.toDataURL('image/png');
		if (!pngDataUrl.startsWith('data:image/png;base64,')) {
			throw new Error(`${condition.id} visual capture did not produce a PNG data URL.`);
		}
		await reportProgress({
			stage: 'visual-capture-complete',
			conditionId: condition.id,
			pngByteLength: Math.floor((pngDataUrl.length * 3) / 4),
		});
		return {
			conditionId: condition.id,
			width: viewport.widthPixels,
			height: viewport.heightPixels,
			verticalFovDegrees: viewport.verticalFovDegrees,
			pngDataUrl,
			setupDurationMilliseconds: runtime.setupDurationMilliseconds,
			programPreparationMilliseconds: runtime.programPreparationMilliseconds,
		};
	} finally {
		if (runtime === null) model.algorithm.dispose();
		else disposeRuntime(runtime, model);
	}
}

/**
 * Render the two deliberately short analytic-raster visual checkpoints.
 *
 * This development-only loop performs no oracle subdivision, CPU N4 cache,
 * refined convergence, full-frame CPU work, or filesystem write.
 */
export async function runFlatLocalAnalyticDiskRasterGpuVisualLoop(fixture, reportProgress = async () => {}) {
	if (fixture?.schemaVersion !== 'flat-local-analytic-disk-raster-gpu-proof-v1') {
		throw new Error('Flat/local analytic raster visual fixture schema is unsupported.');
	}
	if (typeof reportProgress !== 'function') throw new TypeError('Progress reporter must be a function.');
	const viewport = fixture.viewports?.[0];
	if (
		viewport?.widthPixels !== 641 ||
		viewport.heightPixels !== 401 ||
		viewport.verticalFovDegrees !== 78 ||
		viewport.devicePixelRatio !== 1
	) {
		throw new Error('Flat/local analytic raster visual loop requires the 641x401 78-degree viewport.');
	}
	const conditionIds = ['flat-medium', 'flat-long'];
	const conditions = conditionIds.map((conditionId) => {
		const matches = fixture.flat?.qualificationConditions?.filter((condition) => condition.id === conditionId);
		if (matches?.length !== 1) throw new Error(`Visual condition ${conditionId} is not uniquely authored.`);
		return matches[0];
	});
	const canvas = document.createElement('canvas');
	canvas.width = viewport.widthPixels;
	canvas.height = viewport.heightPixels;
	const context = canvas.getContext('webgl2', {
		antialias: false,
		alpha: true,
		depth: true,
		preserveDrawingBuffer: true,
	});
	if (context === null) throw new Error('Flat/local analytic raster visual loop requires WebGL2.');
	const renderer = new THREE.WebGLRenderer({canvas, context, antialias: false});
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.setPixelRatio(1);
	renderer.setSize(viewport.widthPixels, viewport.heightPixels, false);
	const rendererIdentity = rendererFacts(renderer);
	if (
		rendererIdentity.isWebGL2 !== true ||
		rendererIdentity.softwareRendererDetected === true ||
		typeof rendererIdentity.unmaskedVendor !== 'string' ||
		rendererIdentity.unmaskedVendor.length === 0 ||
		typeof rendererIdentity.unmaskedRenderer !== 'string' ||
		rendererIdentity.unmaskedRenderer.length === 0
	) {
		renderer.dispose();
		throw new Error(`Hardware WebGL2 renderer identity is unavailable: ${JSON.stringify(rendererIdentity)}.`);
	}
	try {
		const images = [];
		for (const condition of conditions) {
			images.push(await renderFlatVisualImage(renderer, canvas, fixture, condition, viewport, reportProgress));
		}
		return {
			schemaVersion: 'flat-local-analytic-disk-raster-gpu-visual-loop-v1',
			renderer: rendererIdentity,
			images,
		};
	} finally {
		renderer.dispose();
	}
}

/**
 * Run the focused exact-conic Flat/local raster qualification in one browser.
 *
 * The function performs no filesystem writes. It uses only the sealed
 * production snapshot, real GPU cache/shader execution, bounded 5x5 readbacks,
 * and an independent binary64 direct ray/sphere subdivision oracle.
 */
export async function runFlatLocalAnalyticDiskRasterGpuProof(fixture, reportProgress = async () => {}) {
	if (fixture?.schemaVersion !== 'flat-local-analytic-disk-raster-gpu-proof-v1') {
		throw new Error('Flat/local analytic raster fixture schema is unsupported.');
	}
	if (typeof reportProgress !== 'function') throw new TypeError('Progress reporter must be a function.');
	const maximumWidth = Math.max(...fixture.viewports.map((viewport) => viewport.widthPixels));
	const maximumHeight = Math.max(...fixture.viewports.map((viewport) => viewport.heightPixels));
	const canvas = document.createElement('canvas');
	canvas.width = maximumWidth;
	canvas.height = maximumHeight;
	const context = canvas.getContext('webgl2', {
		antialias: false,
		alpha: true,
		depth: true,
		preserveDrawingBuffer: true,
	});
	if (context === null) throw new Error('Flat/local analytic raster proof requires WebGL2.');
	const renderer = new THREE.WebGLRenderer({canvas, context, antialias: false});
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.setPixelRatio(1);
	renderer.setSize(maximumWidth, maximumHeight, false);
	const rendererIdentity = rendererFacts(renderer);
	if (rendererIdentity.softwareRendererDetected) throw new Error('Software GPU renderer is not accepted.');
	try {
		const flatConditions = [];
		for (const condition of fixture.flat.qualificationConditions) {
			flatConditions.push(await runFlatCondition(renderer, fixture, condition, reportProgress));
		}
		const closeControl = await runFlatCloseControl(renderer, fixture, reportProgress);
		const distantControl = await runDistantControl(renderer, fixture, reportProgress);
		const webglErrors = [];
		for (let error = context.getError(); error !== context.NO_ERROR; error = context.getError()) {
			webglErrors.push(error);
		}
		return {
			schemaVersion: 'flat-local-analytic-disk-raster-gpu-browser-proof-v1',
			fixtureId: fixture.id,
			executionBackend: 'hardware-gpu',
			separateCpuN4AtmosphericCacheRefinedOrFullFrameLaneUsed: false,
			normalGpuPathDistantCelestialCpuReferenceHelperUsed:
				distantControl.normalGpuPathCelestialCpuReferenceHelper.used,
			renderer: rendererIdentity,
			flatConditions,
			closeControl,
			distantControl,
			webglErrors,
			claimLimits: fixture.claimBoundary,
		};
	} finally {
		renderer.dispose();
	}
}
