import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';

import {Algorithm32} from '../candidate/src/algorithm32/Algorithm32.js';
import {CanonicalAtmosphere} from '../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import {CelestialRuntimeParticipant} from '../candidate/src/algorithm32/caches/celestial/CelestialRuntimeParticipant.js';
import {FiniteLocalSunCelestialSource} from '../candidate/src/algorithm32/caches/celestial/FiniteLocalSunCelestialSource.js';
import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
	FIGURE1_DISPLAY_CONSTANTS,
} from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import {FlatEarthGeometry} from '../candidate/src/algorithm32/geometries/FlatEarthGeometry.js';
import {SphericalEarthGeometry} from '../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
import {DistantSunLightSource} from '../candidate/src/algorithm32/light-sources/DistantSunLightSource.js';
import {FiniteLocalSunLightSource} from '../candidate/src/algorithm32/light-sources/FiniteLocalSunLightSource.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	createSpectralPacket,
} from '../candidate/src/algorithm32/quantities/index.js';
import {ThreeCacheBackend} from '../candidate/src/algorithm32/three/ThreeCacheBackend.js';
import {
	BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID,
	BrunetonExtraterrestrialVisibilityColorDisplayModel,
} from './BrunetonExtraterrestrialVisibilityColorDisplayModel.js';
import {
	SCREEN_PALETTE_MATRIX_VALUE_KEY,
	SCREEN_PALETTE_VALUES_VALUE_KEY,
	ScreenPaletteCelestialRuntimeParticipant,
} from './ScreenPaletteCelestialRuntimeParticipant.js';
import {
	deriveFiniteSourceIncidentIrradiance,
	deriveSourceLocalLuminance,
} from './SourceDerivedLocalLuminance.js';

const NATIVE_SUN_ANGULAR_RADIUS_RADIANS = 0.004675;
const DISTANT_REVIEW_BOXES = Object.freeze([
	Object.freeze({
		name: 'spherical-review-distant-cyan-box',
		colorHex: 2796220,
		eastMeters: 18000,
		northMeters: -60000,
		sizeMeters: [6000, 5000, 6000],
	}),
	Object.freeze({
		name: 'spherical-review-denali-250km-orange-box',
		colorHex: 14638880,
		eastMeters: 100000,
		northMeters: -250000,
		sizeMeters: [50000, 6200, 100000],
	}),
]);

const distance = (value) => ({value, units: 'meters'});
const position = (coordinates) => ({coordinates, units: 'meters'});

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function directionFromUpEastNorth(direction) {
	const [up, east, north] = direction;
	return new THREE.Vector3(east, north, up).normalize();
}

function configureSphericalCamera(camera, sceneSpec, observerHeightMeters) {
	camera.up.set(0, 1, 0);
	camera.position.set(0, observerHeightMeters, 0);
	const azimuth = sceneSpec.viewAzimuthDegrees * Math.PI / 180;
	const elevation = sceneSpec.viewElevationDegrees * Math.PI / 180;
	camera.lookAt(
		1000 * Math.sin(azimuth) * Math.cos(elevation),
		observerHeightMeters + 1000 * Math.sin(elevation),
		-1000 * Math.cos(azimuth) * Math.cos(elevation),
	);
	camera.updateMatrixWorld(true);
}

function createSphericalReviewBoxes(bottomRadiusMeters) {
	return DISTANT_REVIEW_BOXES.map((specification) => {
		const horizontalDistanceMeters = Math.hypot(
			specification.eastMeters,
			specification.northMeters,
		);
		const groundOffsetMeters = Math.sqrt(
			bottomRadiusMeters ** 2 - horizontalDistanceMeters ** 2,
		) - bottomRadiusMeters;
		const box = new THREE.Mesh(
			new THREE.BoxGeometry(...specification.sizeMeters),
			new THREE.MeshLambertMaterial({color: specification.colorHex}),
		);
		box.name = specification.name;
		box.position.set(
			specification.eastMeters,
			groundOffsetMeters + specification.sizeMeters[1] / 2,
			specification.northMeters,
		);
		return box;
	});
}

function createFlatReviewBoxes(fixture) {
	return fixture.reviewBoxes.map((specification) => {
		const box = new THREE.Mesh(
			new THREE.BoxGeometry(...specification.sizeSceneUnits),
			new THREE.MeshLambertMaterial({color: specification.colorHex}),
		);
		box.name = specification.name;
		box.position.set(...specification.positionSceneUnits);
		box.rotation.y = specification.rotationYRadians;
		return box;
	});
}

function installFlatGroundLighting({scene, sourceScenePosition, fixture}) {
	const ambient = new THREE.AmbientLight(
		0xffffff,
		fixture.ambientLightIntensity,
	);
	ambient.name = 'flat32-local-sun-ambient-fill';
	scene.add(ambient);
	const target = new THREE.Object3D();
	target.position.set(0, 0, 0);
	scene.add(target);
	const directional = new THREE.DirectionalLight(
		0xffffff,
		fixture.directionalLightTotalIntensity,
	);
	directional.name = 'flat32-local-sun-ground-directional';
	directional.position.copy(sourceScenePosition);
	directional.target = target;
	scene.add(directional);
	return {ambient, directional, target};
}

function summarizeReadback(values) {
	const sums = [0, 0, 0];
	let nonBlack = 0;
	let maximumChannel = 0;
	let exactWhitePixelCount = 0;
	for (let index = 0; index < values.length; index += 4) {
		const rgb = [values[index], values[index + 1], values[index + 2]];
		for (let channel = 0; channel < 3; channel += 1) {
			sums[channel] += rgb[channel];
			maximumChannel = Math.max(maximumChannel, rgb[channel]);
		}
		if (rgb.some((value) => value !== 0)) nonBlack += 1;
		if (rgb.every((value) => value === 255)) exactWhitePixelCount += 1;
	}
	return {
		nonBlack,
		maximumChannel,
		exactWhitePixelCount,
		meanRgb: sums.map((sum) => sum / (values.length / 4)),
	};
}

async function loadProduct(descriptor) {
	const [matrixBytes, paletteBytes] = await Promise.all([
		fetch(descriptor.matrixUrl).then((response) => response.arrayBuffer()),
		fetch(descriptor.paletteUrl).then((response) => response.arrayBuffer()),
	]);
	const pixelIndex = new Uint16Array(matrixBytes);
	const palette = new Float32Array(paletteBytes);
	requireCondition(
		pixelIndex.length === descriptor.viewport.width * descriptor.viewport.height,
		`${descriptor.id} matrix shape changed.`,
	);
	requireCondition(
		palette.length === descriptor.paletteEntryCount * 15,
		`${descriptor.id} palette shape changed.`,
	);
	return {...descriptor, pixelIndex, palette};
}

function createProductTextures(product) {
	const matrix = new THREE.DataTexture(
		product.pixelIndex,
		product.viewport.width,
		product.viewport.height,
	);
	matrix.format = THREE.RedIntegerFormat;
	matrix.type = THREE.UnsignedShortType;
	matrix.internalFormat = 'R16UI';
	matrix.minFilter = THREE.NearestFilter;
	matrix.magFilter = THREE.NearestFilter;
	matrix.wrapS = THREE.ClampToEdgeWrapping;
	matrix.wrapT = THREE.ClampToEdgeWrapping;
	matrix.generateMipmaps = false;
	matrix.unpackAlignment = 1;
	matrix.needsUpdate = true;
	const palette = new THREE.DataTexture(
		product.palette,
		15,
		product.paletteEntryCount,
	);
	palette.format = THREE.RedFormat;
	palette.type = THREE.FloatType;
	palette.internalFormat = 'R32F';
	palette.minFilter = THREE.NearestFilter;
	palette.magFilter = THREE.NearestFilter;
	palette.wrapS = THREE.ClampToEdgeWrapping;
	palette.wrapT = THREE.ClampToEdgeWrapping;
	palette.generateMipmaps = false;
	palette.unpackAlignment = 1;
	palette.needsUpdate = true;
	return {matrix, palette};
}

function collectWebglErrors(context) {
	const errors = [];
	for (
		let error = context.getError();
		error !== context.NO_ERROR;
		error = context.getError()
	) {
		errors.push(error);
	}
	return errors;
}

async function renderSphericalTarget({
	fixture,
	geometryConfiguration,
	sceneSpec,
	product,
	sourceExposureCurve,
}) {
	const width = fixture.camera.widthPixels;
	const height = fixture.camera.heightPixels;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('webgl2', {
		antialias: false,
		preserveDrawingBuffer: true,
	});
	requireCondition(context, 'WebGL2 is unavailable for the spherical target.');
	const renderer = new THREE.WebGLRenderer({canvas, context, antialias: false});
	renderer.setSize(width, height, false);
	const composer = new EffectComposer(renderer);
	composer.setSize(width, height);
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);
	const camera = new THREE.PerspectiveCamera(
		fixture.camera.verticalFovDegrees,
		width / height,
		0.1,
		400000,
	);
	configureSphericalCamera(
		camera,
		sceneSpec,
		fixture.camera.observerHeightMeters,
	);
	const directionToSun = directionFromUpEastNorth(
		sceneSpec.directionToSourceUpEastNorth,
	);
	const geometry = new SphericalEarthGeometry({
		...geometryConfiguration,
		observerHeight: {
			value: fixture.camera.observerHeightMeters,
			units: 'meters',
		},
		observerUpDirection: [0, 0, 1],
		sceneFrame: {kind: 'observer-local'},
		directionToSource: directionToSun.toArray(),
		cacheAltitudeBinCount: 48,
	});
	const endpoints = geometry.createThreeEndpointObjects({
		name: `${sceneSpec.id}-ground`,
		sceneScale: {value: 1, units: 'meters-per-scene-unit'},
		widthSegments: 192,
		heightSegments: 96,
		visualMaterialLighting: 'lambert',
		groundVisualMesh: {kind: 'local-spherical-patch'},
	});
	const [ground] = endpoints.visualObjects;
	const reviewBoxes = createSphericalReviewBoxes(
		geometryConfiguration.bottomRadius.value,
	);
	scene.add(...endpoints.visualObjects, ...reviewBoxes);
	composer.addPass(new RenderPass(scene, camera));
	const backend = new ThreeCacheBackend({THREE, renderer});
	const atmosphere = new CanonicalAtmosphere({
		constants: CANONICAL_ATMOSPHERE_CONSTANTS,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const lightSource = new DistantSunLightSource({
		directionToLight: directionToSun.toArray(),
		sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
		angularRadius: {
			value: NATIVE_SUN_ANGULAR_RADIUS_RADIANS,
			units: 'radians',
		},
	});
	const celestial = new ScreenPaletteCelestialRuntimeParticipant({
		identity: product.identity,
	});
	const receiverPosition = {
		coordinates: [
			0,
			0,
			geometryConfiguration.bottomRadius.value
				+ fixture.camera.observerHeightMeters,
		],
		units: 'meters',
	};
	const sourcePath = geometry.resolveAtmospherePath({
		ray: {
			origin: receiverPosition,
			direction: directionToSun.toArray(),
		},
	});
	const sourceTransport = atmosphere.integrateOpticalDepth(sourcePath);
	const sourceLight = deriveSourceLocalLuminance({
		incidentIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY.values,
		transmittance: sourceTransport.transmittance.values,
	});
	const color = new BrunetonExtraterrestrialVisibilityColorDisplayModel({
		displayConstants: FIGURE1_DISPLAY_CONSTANTS,
		sourceDerivedLocalLuminance: sourceLight.luminanceCdPerSquareMeter,
		sourceExposureCurve,
	});
	const algorithm = new Algorithm32({
		geometry,
		atmosphere,
		lightSource,
		celestial,
		color,
		spectral: NATIVE_15_SPECTRAL_BASIS,
		execution: {maximumScatteringOrder: 4},
	});
	const textures = createProductTextures(product);
	let handle;
	try {
		handle = await algorithm.setupShader({
			THREE,
			composer,
			scene,
			camera,
			viewportSize: {width, height, units: 'pixels'},
			cacheBackend: backend,
			sceneScale: {value: 1, units: 'meters-per-scene-unit'},
			sceneDepthMax: {value: 300000, units: 'meters'},
			bindingValues: {
				'geometry.inverseProjectionMatrix':
					camera.projectionMatrixInverse.clone(),
				'geometry.inverseViewMatrix': camera.matrixWorld.clone(),
				'geometry.cameraWorldPosition': new THREE.Vector3(
					0,
					0,
					6360000 + fixture.camera.observerHeightMeters,
				),
				'geometry.cameraGroundRelativePosition': new THREE.Vector3(
					0,
					0,
					fixture.camera.observerHeightMeters,
				),
				'light.directionToAtmosphericSource': directionToSun,
				[SCREEN_PALETTE_MATRIX_VALUE_KEY]: textures.matrix,
				[SCREEN_PALETTE_VALUES_VALUE_KEY]: textures.palette,
			},
		});
		await handle.prepare(renderer);
		composer.render();
		const values = new Uint8Array(width * height * 4);
		context.readPixels(
			0,
			0,
			width,
			height,
			context.RGBA,
			context.UNSIGNED_BYTE,
			values,
		);
		const shader = handle._buildResult.assembly.fragmentShaderSource;
		const diagnostics = handle.getDiagnostics();
		return {
			id: sceneSpec.id,
			kind: 'spherical-distant',
			colorModelId: color.id,
			sourceLight: {
				...sourceLight,
				blockedByGround: sourceTransport.blockedByGround,
				exposureGain: color.exposureGain,
			},
			timeLabel: sceneSpec.timeLabel,
			timeIso: sceneSpec.timeIso,
			viewAzimuthDegrees: sceneSpec.viewAzimuthDegrees,
			viewElevationDegrees: sceneSpec.viewElevationDegrees,
			image: summarizeReadback(values),
			imagePngDataUrl: canvas.toDataURL('image/png'),
			webglErrors: collectWebglErrors(context),
			programDiagnostics: renderer.info.programs.map(
				(program) => program.diagnostics ?? null,
			),
			shaderIncludes: {
				screenPalette: shader.includes(
					'evaluateScreenPaletteCelestialRadiance',
				),
				singleTransmittanceExpression: (
					shader.match(
						/state\.transmittance\.c\[channelIndex\] \* boundaryRadiance\.c\[channelIndex\]/gu,
					) ?? []
				).length,
				bruneton: shader.includes('DISPLAY_TONE_MAP_K'),
				extraterrestrialVisibility: shader.includes(
					'SOURCE_DERIVED_EXPOSURE_GAIN',
				),
				separatePathLedger: shader.includes(
					'spectralRadianceToLinearSrgb(state.pathRadiance)',
				),
				alreadyTransportedBoundary: shader.includes(
					'spectralRadianceToLinearSrgb(state.celestialRadiance)',
				),
				cumulativeAtmosphere: shader.includes(
					'sampleCumulativeScatteringDensity',
				),
				sceneInputCapture:
					diagnostics.runtime.sceneInputCapture?.frameCount > 0,
			},
		};
	} finally {
		handle?.dispose();
		textures.matrix.dispose();
		textures.palette.dispose();
		scene.remove(...reviewBoxes, ...endpoints.visualObjects);
		for (const box of reviewBoxes) {
			box.geometry.dispose();
			box.material.dispose();
		}
		ground.geometry.dispose();
		ground.material.dispose();
		algorithm.dispose();
		composer.dispose();
		backend.dispose();
		renderer.dispose();
	}
}

async function renderFlatTarget({fixture, stateId, sourceExposureCurve}) {
	const state = fixture.states.find((candidate) => candidate.id === stateId);
	requireCondition(state, `Unsupported Flat/local state: ${stateId}`);
	const {
		widthPixels: width,
		heightPixels: height,
		verticalFovDegrees,
	} = fixture.camera;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('webgl2', {
		antialias: false,
		preserveDrawingBuffer: true,
	});
	requireCondition(context, 'WebGL2 is unavailable for the Flat/local target.');
	const renderer = new THREE.WebGLRenderer({canvas, context, antialias: false});
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.setSize(width, height, false);
	const sceneColorTarget = new THREE.WebGLRenderTarget(width, height, {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBAFormat,
		type: THREE.UnsignedByteType,
		depthBuffer: true,
		stencilBuffer: false,
	});
	sceneColorTarget.texture.colorSpace = THREE.NoColorSpace;
	const composer = new EffectComposer(renderer, sceneColorTarget);
	composer.setSize(width, height);
	const backend = new ThreeCacheBackend({THREE, renderer});
	const source = {...fixture.source, centerMeters: state.centerMeters};
	const sceneScaleMeters = fixture.sceneScaleMetersPerUnit;
	const groundExtentMeters = fixture.groundExtentSceneUnits * sceneScaleMeters;
	const geometry = new FlatEarthGeometry({
		observerPosition: position([0, 0, 5]),
		sourcePosition: position(source.centerMeters),
		topAltitude: distance(fixture.geometry.topAltitudeMeters),
		cacheRadialMaximum: distance(state.cacheRadialMaximumMeters),
		sceneSkyRayLimit: distance(
			fixture.geometry.observerDomeMaxViewRayMeters,
		),
		observerCenteredDome: {
			centerPolicy: 'observer-centered',
			apexAltitude: distance(fixture.geometry.observerDomeApexMeters),
			maxObserverViewRayExtent: distance(
				fixture.geometry.observerDomeMaxViewRayMeters,
			),
		},
	});
	const radiance = createSpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
		units: SPECTRAL_UNITS.RADIANCE_DENSITY,
		values: source.surfaceRadianceValues,
		provenanceIdentity: 'union-glacier-flat-local-closest-radiance-v1',
	});
	const lightSource = new FiniteLocalSunLightSource({
		sourceKey: source.sourceId,
		position: geometry.configuration.sourcePosition,
		radius: distance(source.radiusMeters),
		surfaceRadiance: radiance,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const celestialSource = new FiniteLocalSunCelestialSource({
		sourceId: source.sourceId,
		radius: distance(source.radiusMeters),
		surfaceRadiance: radiance,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const atmosphere = new CanonicalAtmosphere({
		constants: CANONICAL_ATMOSPHERE_CONSTANTS,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const observerMeters = [0, 0, 5];
	const toSource = source.centerMeters.map(
		(value, index) => value - observerMeters[index],
	);
	const sourceDistanceMeters = Math.hypot(...toSource);
	const directionToSource = toSource.map(
		(value) => value / sourceDistanceMeters,
	);
	const sourcePath = geometry.resolveAtmospherePath({
		ray: {
			origin: position(observerMeters),
			direction: directionToSource,
		},
		endDistance: distance(sourceDistanceMeters - source.radiusMeters),
	});
	const sourceTransport = atmosphere.integrateOpticalDepth(sourcePath);
	const incident = deriveFiniteSourceIncidentIrradiance({
		surfaceRadiance: source.surfaceRadianceValues,
		radiusMeters: source.radiusMeters,
		distanceMeters: sourceDistanceMeters,
	});
	const sourceLight = deriveSourceLocalLuminance({
		incidentIrradiance: incident.values,
		transmittance: sourceTransport.transmittance.values,
	});
	const color = new BrunetonExtraterrestrialVisibilityColorDisplayModel({
		displayConstants: FIGURE1_DISPLAY_CONSTANTS,
		sourceDerivedLocalLuminance: sourceLight.luminanceCdPerSquareMeter,
		sourceExposureCurve,
	});
	const algorithm = new Algorithm32({
		geometry,
		atmosphere,
		lightSource,
		celestial: new CelestialRuntimeParticipant({
			sources: [celestialSource],
			primarySourceId: source.sourceId,
		}),
		color,
		spectral: NATIVE_15_SPECTRAL_BASIS,
		execution: {maximumScatteringOrder: 4},
	});
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(fixture.sceneBackgroundHex);
	const camera = new THREE.PerspectiveCamera(
		verticalFovDegrees,
		width / height,
		0.002,
		500,
	);
	camera.position.set(0, 0.005, 0);
	camera.up.set(0, 1, 0);
	camera.lookAt(0, 0, -1);
	camera.updateMatrixWorld(true);
	camera.updateProjectionMatrix();
	const endpoints = geometry.createThreeEndpointObjects({
		name: 'union-glacier-flat-ground',
		sceneScale: {
			value: sceneScaleMeters,
			units: 'meters-per-scene-unit',
		},
		groundExtent: distance(groundExtentMeters),
		widthSegments: 96,
		heightSegments: 96,
		visualMaterialColor: fixture.groundColorHex,
		visualMaterialLighting: 'lambert',
	});
	const [ground] = endpoints.visualObjects;
	scene.add(...endpoints.visualObjects);
	const reviewBoxes = createFlatReviewBoxes(fixture);
	scene.add(...reviewBoxes);
	const sourceScenePosition = new THREE.Vector3(
		source.centerMeters[0] / sceneScaleMeters,
		source.centerMeters[2] / sceneScaleMeters,
		-source.centerMeters[1] / sceneScaleMeters,
	);
	const groundLighting = installFlatGroundLighting({
		scene,
		sourceScenePosition,
		fixture,
	});
	composer.addPass(new RenderPass(scene, camera));
	const bindings = {
		'geometry.inverseProjectionMatrix': camera.projectionMatrixInverse.clone(),
		'geometry.inverseViewMatrix': camera.matrixWorld.clone(),
		'geometry.cameraWorldPosition': new THREE.Vector3(0, 0, 5),
		'geometry.sceneTermination': distance(0),
		'geometry.sceneDepthMax': geometry.resolveSceneDepthMax({
			groundExtent: distance(groundExtentMeters),
		}),
		'geometry.flatFiniteSun.centerMeters': new THREE.Vector3(
			...source.centerMeters,
		),
	};
	let handle;
	try {
		handle = await algorithm.setupShader({
			THREE,
			composer,
			scene,
			camera,
			viewportSize: {width, height, units: 'pixels'},
			cacheBackend: backend,
			sceneScale: {
				value: sceneScaleMeters,
				units: 'meters-per-scene-unit',
			},
			bindingValues: bindings,
		});
		await handle.prepare(renderer);
		composer.render();
		const values = new Uint8Array(width * height * 4);
		context.readPixels(
			0,
			0,
			width,
			height,
			context.RGBA,
			context.UNSIGNED_BYTE,
			values,
		);
		const sourceNdc = sourceScenePosition.clone().project(camera);
		const sourceScreenPixelsBottomLeft = {
			x: (sourceNdc.x * 0.5 + 0.5) * width,
			y: (sourceNdc.y * 0.5 + 0.5) * height,
		};
		const shader = handle._buildResult.assembly.fragmentShaderSource;
		return {
			id: stateId,
			kind: 'flat-local',
			colorModelId: color.id,
			timeLabel: state.timeLabel,
			sourceLight: {
				...sourceLight,
				projectedSolidAngleSteradians:
					incident.projectedSolidAngleSteradians,
				sourceDistanceMeters,
				blockedByGround: sourceTransport.blockedByGround,
				exposureGain: color.exposureGain,
			},
			source: {
				centerMeters: source.centerMeters,
				screenPixelsBottomLeft: sourceScreenPixelsBottomLeft,
				projectedPixelTopLeft: {
					x: Math.floor(sourceScreenPixelsBottomLeft.x),
					y: height - 1
						- Math.floor(sourceScreenPixelsBottomLeft.y),
				},
			},
			image: summarizeReadback(values),
			imagePngDataUrl: canvas.toDataURL('image/png'),
			webglErrors: collectWebglErrors(context),
			programDiagnostics: renderer.info.programs.map(
				(program) => program.diagnostics ?? null,
			),
			shaderIncludes: {
				finiteDisk: shader.includes('evaluateFlatFiniteSunRadiance'),
				finiteBoundaryTransmittanceExpression: (
					shader.match(
						/radiance\.c\[channelIndex\] \* transmittance\.c\[channelIndex\]/gu,
					) ?? []
				).length,
				normalCache: shader.includes('sampleCumulativeScatteringDensity'),
				bruneton: shader.includes('DISPLAY_TONE_MAP_K'),
				extraterrestrialVisibility: shader.includes(
					'SOURCE_DERIVED_EXPOSURE_GAIN',
				),
				separatePathLedger: shader.includes(
					'spectralRadianceToLinearSrgb(state.pathRadiance)',
				),
				alreadyTransportedBoundary: shader.includes(
					'spectralRadianceToLinearSrgb(state.celestialRadiance)',
				),
			},
		};
	} finally {
		handle?.dispose();
		scene.remove(
			groundLighting.directional,
			groundLighting.target,
			groundLighting.ambient,
			...reviewBoxes,
			...endpoints.visualObjects,
		);
		for (const box of reviewBoxes) {
			box.geometry.dispose();
			box.material.dispose();
		}
		ground.geometry.dispose();
		ground.material.dispose();
		algorithm.dispose();
		composer.dispose();
		sceneColorTarget.dispose();
		backend.dispose();
		renderer.dispose();
	}
}

function loadImage(url) {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error(`Could not load image: ${url}`));
		image.src = url;
	});
}

async function decodeImage(url) {
	const image = await loadImage(url);
	const canvas = document.createElement('canvas');
	canvas.width = image.width;
	canvas.height = image.height;
	const context = canvas.getContext('2d');
	requireCondition(context, '2D image-analysis canvas is unavailable.');
	context.drawImage(image, 0, 0);
	return {
		width: image.width,
		height: image.height,
		values: context.getImageData(0, 0, image.width, image.height).data,
	};
}

function requireSameImageShape(left, right) {
	requireCondition(
		left.width === right.width && left.height === right.height,
		'Compared images have different shapes.',
	);
}

function compareMaskedImages(candidate, control, includesPixel) {
	requireSameImageShape(candidate, control);
	const histogram = new Array(256).fill(0);
	const candidateSums = [0, 0, 0];
	let pixelCount = 0;
	let nonBlackPixelCount = 0;
	let maximumCandidateChannel = 0;
	let maximumAbsoluteChannelDifference = 0;
	let absoluteDifferenceSum = 0;
	let squaredDifferenceSum = 0;
	for (let pixel = 0; pixel < candidate.width * candidate.height; pixel += 1) {
		if (!includesPixel(pixel)) continue;
		pixelCount += 1;
		const offset = pixel * 4;
		let pixelMaximumDifference = 0;
		let pixelNonBlack = false;
		for (let channel = 0; channel < 3; channel += 1) {
			const candidateValue = candidate.values[offset + channel];
			const difference = Math.abs(
				candidateValue - control.values[offset + channel],
			);
			candidateSums[channel] += candidateValue;
			pixelNonBlack ||= candidateValue !== 0;
			maximumCandidateChannel = Math.max(
				maximumCandidateChannel,
				candidateValue,
			);
			pixelMaximumDifference = Math.max(
				pixelMaximumDifference,
				difference,
			);
			maximumAbsoluteChannelDifference = Math.max(
				maximumAbsoluteChannelDifference,
				difference,
			);
			absoluteDifferenceSum += difference;
			squaredDifferenceSum += difference ** 2;
		}
		if (pixelNonBlack) nonBlackPixelCount += 1;
		histogram[pixelMaximumDifference] += 1;
	}
	requireCondition(pixelCount > 0, 'Image comparison selected no pixels.');
	const percentileRank = Math.ceil(pixelCount * 0.99);
	let cumulative = 0;
	let p99MaximumAbsoluteChannelDifference = 0;
	for (let difference = 0; difference < histogram.length; difference += 1) {
		cumulative += histogram[difference];
		if (cumulative >= percentileRank) {
			p99MaximumAbsoluteChannelDifference = difference;
			break;
		}
	}
	return {
		pixelCount,
		candidateNonBlackPixelCount: nonBlackPixelCount,
		candidateNonBlackFraction: nonBlackPixelCount / pixelCount,
		candidateMaximumChannel: maximumCandidateChannel,
		candidateMeanRgb: candidateSums.map((sum) => sum / pixelCount),
		maximumAbsoluteChannelDifference,
		p99MaximumAbsoluteChannelDifference,
		meanAbsoluteChannelDifference:
			absoluteDifferenceSum / (pixelCount * 3),
		rootMeanSquareChannelDifference: Math.sqrt(
			squaredDifferenceSum / (pixelCount * 3),
		),
	};
}

function quantile(sortedValues, fraction) {
	if (sortedValues.length === 0) return 0;
	const position = fraction * (sortedValues.length - 1);
	const lower = Math.floor(position);
	const upper = Math.ceil(position);
	const weight = position - lower;
	return sortedValues[lower]
		+ (sortedValues[upper] - sortedValues[lower]) * weight;
}

function summarizeStellarImage(image, product) {
	requireCondition(
		image.width === product.viewport.width
			&& image.height === product.viewport.height,
		'Stellar image and screen-palette shapes differ.',
	);
	const distinctRgb = new Set();
	const peakChannels = [];
	let eligibleCount = 0;
	let visibleCount = 0;
	let exactWhiteCount = 0;
	let maximumChannel = 0;
	let photopicSum = 0;
	for (let pixel = 0; pixel < product.pixelIndex.length; pixel += 1) {
		const entry = product.pixelIndex[pixel];
		if (entry === 0 || entry >= product.stellarPaletteEntryCount) continue;
		eligibleCount += 1;
		const offset = pixel * 4;
		const rgb = [
			image.values[offset],
			image.values[offset + 1],
			image.values[offset + 2],
		];
		const peak = Math.max(...rgb);
		peakChannels.push(peak);
		maximumChannel = Math.max(maximumChannel, peak);
		photopicSum += rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
		if (peak > 0) {
			visibleCount += 1;
			distinctRgb.add(rgb.join(','));
		}
		if (rgb.every((value) => value === 255)) exactWhiteCount += 1;
	}
	peakChannels.sort((left, right) => left - right);
	return {
		eligibleCount,
		visibleCount,
		exactWhiteCount,
		maximumChannel,
		distinctRgbCount: distinctRgb.size,
		meanPhotopicByte: eligibleCount === 0 ? 0 : photopicSum / eligibleCount,
		peakChannelQuantiles: {
			minimum: quantile(peakChannels, 0),
			firstQuartile: quantile(peakChannels, 0.25),
			median: quantile(peakChannels, 0.5),
			thirdQuartile: quantile(peakChannels, 0.75),
			maximum: quantile(peakChannels, 1),
		},
	};
}

function samplePixel(image, x, y) {
	requireCondition(
		Number.isInteger(x) && x >= 0 && x < image.width
			&& Number.isInteger(y) && y >= 0 && y < image.height,
		'Pixel sample is outside the image.',
	);
	const offset = (y * image.width + x) * 4;
	const rgb = [
		image.values[offset],
		image.values[offset + 1],
		image.values[offset + 2],
	];
	const maximum = Math.max(...rgb);
	const minimum = Math.min(...rgb);
	return {
		x,
		y,
		rgb,
		maximum,
		minimum,
		channelRange: maximum - minimum,
		exactWhite: rgb.every((value) => value === 255),
		greenToRed: rgb[0] === 0 ? null : rgb[1] / rgb[0],
		blueToRed: rgb[0] === 0 ? null : rgb[2] / rgb[0],
	};
}

function median(values) {
	const sorted = [...values].sort((left, right) => left - right);
	return quantile(sorted, 0.5);
}

function summarizePixelRing(image, center, radius) {
	const channels = [[], [], []];
	let count = 0;
	for (let y = center.y - radius; y <= center.y + radius; y += 1) {
		for (let x = center.x - radius; x <= center.x + radius; x += 1) {
			if (x === center.x && y === center.y) continue;
			if (x < 0 || y < 0 || x >= image.width || y >= image.height) continue;
			const sample = samplePixel(image, x, y);
			for (let channel = 0; channel < 3; channel += 1) {
				channels[channel].push(sample.rgb[channel]);
			}
			count += 1;
		}
	}
	return {count, medianRgb: channels.map(median)};
}

async function makePair({leftUrl, rightUrl, leftLabel, rightLabel}) {
	const [left, right] = await Promise.all([
		loadImage(leftUrl),
		loadImage(rightUrl),
	]);
	requireCondition(
		left.width === right.width && left.height === right.height,
		'Paired captures have different shapes.',
	);
	const labelHeight = 30;
	const canvas = document.createElement('canvas');
	canvas.width = left.width + right.width;
	canvas.height = left.height + labelHeight;
	const context = canvas.getContext('2d');
	requireCondition(context, '2D pair canvas is unavailable.');
	context.fillStyle = '#111';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#fff';
	context.font = '16px sans-serif';
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	context.fillText(leftLabel, left.width / 2, labelHeight / 2);
	context.fillText(
		rightLabel,
		left.width + right.width / 2,
		labelHeight / 2,
	);
	context.drawImage(left, 0, labelHeight);
	context.drawImage(right, left.width, labelHeight);
	return canvas.toDataURL('image/png');
}

async function analyzeSphericalTarget({record, product, controls}) {
	const [candidate, bruneton, rejected] = await Promise.all([
		decodeImage(record.imagePngDataUrl),
		decodeImage(controls.brunetonUrl),
		decodeImage(controls.rejectedUrl),
	]);
	const nonCelestial = (pixel) => product.pixelIndex[pixel] === 0;
	return {
		candidateVersusBrunetonNonCelestial: compareMaskedImages(
			candidate,
			bruneton,
			nonCelestial,
		),
		rejectedVersusBrunetonNonCelestial: compareMaskedImages(
			rejected,
			bruneton,
			nonCelestial,
		),
		candidateStars: summarizeStellarImage(candidate, product),
		rejectedStars: summarizeStellarImage(rejected, product),
	};
}

async function analyzeFlatTarget({record, controls, sourcePixel}) {
	const [candidate, bruneton] = await Promise.all([
		decodeImage(record.imagePngDataUrl),
		decodeImage(controls.brunetonUrl),
	]);
	const outsideSource = (pixel) => {
		const x = pixel % candidate.width;
		const y = Math.floor(pixel / candidate.width);
		return x !== sourcePixel.x || y !== sourcePixel.y;
	};
	return {
		candidateSourcePixel: samplePixel(
			candidate,
			sourcePixel.x,
			sourcePixel.y,
		),
		brunetonSourcePixel: samplePixel(
			bruneton,
			sourcePixel.x,
			sourcePixel.y,
		),
		candidateRadiusOneRing: summarizePixelRing(
			candidate,
			sourcePixel,
			1,
		),
		brunetonRadiusOneRing: summarizePixelRing(
			bruneton,
			sourcePixel,
			1,
		),
		candidateVersusBrunetonOutsideSource: compareMaskedImages(
			candidate,
			bruneton,
			outsideSource,
		),
	};
}

/** Run only the three owner-selected appearance targets. */
export async function runBrunetonExtraterrestrialVisibilityTargetedBrowser() {
	const [config, sphericalFixture, sphericalRadiometry, flatFixture] =
		await Promise.all([
			fetch('/browser/config.json').then((response) => response.json()),
			fetch('/fixtures/subjective-globe-context-scenes-v1.json')
				.then((response) => response.json()),
			fetch('/fixtures/g4-cpu-sun-disk-transport-v1.json')
				.then((response) => response.json()),
			fetch('/fixtures/union-glacier-flat-local-closest-approach-v1.json')
				.then((response) => response.json()),
		]);
	requireCondition(
		config.colorModelId === BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID,
		'Target configuration selected the wrong Color model.',
	);
	const products = Object.fromEntries(await Promise.all(
		Object.entries(config.spherical.products).map(
			async ([id, descriptor]) => [id, await loadProduct(descriptor)],
		),
	));
	const spherical = [];
	for (const sceneSpec of config.spherical.scenes) {
		const product = products[sceneSpec.id];
		requireCondition(product, `Missing spherical product: ${sceneSpec.id}`);
		const record = await renderSphericalTarget({
			fixture: sphericalFixture,
			geometryConfiguration: sphericalRadiometry.geometry,
			sceneSpec,
			product,
			sourceExposureCurve: config.sourceExposureCurve,
		});
		const controls = config.spherical.controls[sceneSpec.id];
		requireCondition(controls, `Missing controls: ${sceneSpec.id}`);
		record.analysis = await analyzeSphericalTarget({
			record,
			product,
			controls,
		});
		record.pairPngDataUrl = await makePair({
			leftUrl: controls.brunetonUrl,
			rightUrl: record.imagePngDataUrl,
			leftLabel: `Bruneton - ${record.timeLabel}`,
			rightLabel: `Extraterrestrial visibility - ${record.timeLabel}`,
		});
		spherical.push(record);
	}
	const flat = await renderFlatTarget({
		fixture: flatFixture,
		stateId: config.flat.stateId,
		sourceExposureCurve: config.sourceExposureCurve,
	});
	flat.analysis = await analyzeFlatTarget({
		record: flat,
		controls: config.flat.controls,
		sourcePixel: config.flat.sourcePixelTopLeft,
	});
	flat.pairPngDataUrl = await makePair({
		leftUrl: config.flat.controls.brunetonUrl,
		rightUrl: flat.imagePngDataUrl,
		leftLabel: 'Bruneton - Flat 180',
		rightLabel: 'Extraterrestrial visibility - Flat 180',
	});
	return {
		renderId: 'bruneton-extraterrestrial-visibility-targeted-v1',
		colorModelId: BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID,
		sourceExposureCurve: config.sourceExposureCurve,
		spherical,
		flat,
	};
}
