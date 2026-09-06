import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';

import {Algorithm32} from '../candidate/src/algorithm32/Algorithm32.js';
import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
	FIGURE1_DISPLAY_CONSTANTS,
} from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	SpectralPacket,
} from '../candidate/src/algorithm32/quantities/index.js';
import {ThreeCacheBackend} from
	'../candidate/src/algorithm32/three/ThreeCacheBackend.js';
import {BrunetonOzoneCandidateAtmosphere} from
	'../atmospheres/BrunetonOzoneCandidateAtmosphere.js';
import {
	ACTUAL_POINT_J1_CONTROL,
	ACTUAL_POINT_J1_DEFAULT_INTERVAL_COUNT,
	ACTUAL_POINT_J1_TOGGLE_VALUE_KEY,
	ACTUAL_POINT_J1_TOGGLE_UNIFORM_NAME,
	ActualPointJ1ControlledDistantSunLightSource,
	createActualPointJ1ThreeRayProbes,
} from './ActualPointJ1ControlledDistantSunLightSource.js';
import {BrunetonSourceLuminanceLiftColorDisplayModel} from
	'./BrunetonSourceLuminanceLiftColorDisplayModel.js';
import {
	DOUBLED_OUTGOING_DIRECTION_COUNT,
	DOUBLED_OUTGOING_DIRECTION_POLICY_ID,
	DOUBLED_OUTGOING_FACE_WIDTH,
	DoubledOutgoingSphericalEarthGeometry,
} from './DoubledOutgoingSphericalEarthGeometry.js';
import {
	REFLECTION_COMPLETED_FIBONACCI_68_W39_CONTROL,
	REFLECTION_COMPLETED_FIBONACCI_68_W39_CONTROL_SELECTION,
} from './ReflectionCompletedFibonacci68W39Control.js';
import {readSkyPathRadianceSpectra} from
	'./SkyPathRadianceSpectralProbe.js';
import {deriveSourceLocalLuminance} from './SourceDerivedLocalLuminance.js';
import {
	SCREEN_PALETTE_MATRIX_VALUE_KEY,
	SCREEN_PALETTE_VALUES_VALUE_KEY,
	ScreenPaletteCelestialRuntimeParticipant,
} from './ScreenPaletteCelestialRuntimeParticipant.js';

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

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function directionFromUpEastNorth(direction) {
	const [up, east, north] = direction;
	return new THREE.Vector3(east, north, up).normalize();
}

function configureCamera(camera, sceneSpec, observerHeightMeters) {
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

function createReviewBoxes(bottomRadiusMeters) {
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

function summarizeImage(values, width, height) {
	let nonBlackPixelCount = 0;
	let exactWhitePixelCount = 0;
	let maximumChannel = 0;
	const sums = [0, 0, 0];
	for (let index = 0; index < values.length; index += 4) {
		const rgb = [values[index], values[index + 1], values[index + 2]];
		if (rgb.some((value) => value > 0)) nonBlackPixelCount += 1;
		if (rgb.every((value) => value === 255)) exactWhitePixelCount += 1;
		for (let channel = 0; channel < 3; channel += 1) {
			sums[channel] += rgb[channel];
			maximumChannel = Math.max(maximumChannel, rgb[channel]);
		}
	}
	const pixelCount = values.length / 4;
	return {
		width,
		height,
		pixelCount,
		nonBlackPixelCount,
		exactWhitePixelCount,
		maximumChannel,
		meanRgb: sums.map((sum) => sum / pixelCount),
	};
}

function summarizeStellar(values, product) {
	let eligibleCount = 0;
	let visibleCount = 0;
	let exactWhiteCount = 0;
	let maximumChannel = 0;
	const distinctRgb = new Set();
	for (let pixel = 0; pixel < product.pixelIndex.length; pixel += 1) {
		const entry = product.pixelIndex[pixel];
		if (entry === 0 || entry >= product.stellarPaletteEntryCount) continue;
		eligibleCount += 1;
		const x = pixel % product.viewport.width;
		const y = Math.floor(pixel / product.viewport.width);
		const outputPixel = (product.viewport.height - 1 - y)
			* product.viewport.width + x;
		const offset = outputPixel * 4;
		const rgb = [values[offset], values[offset + 1], values[offset + 2]];
		if (Math.max(...rgb) > 0) {
			visibleCount += 1;
			distinctRgb.add(rgb.join(','));
		}
		if (rgb.every((value) => value === 255)) exactWhiteCount += 1;
		maximumChannel = Math.max(maximumChannel, ...rgb);
	}
	return {
		eligibleCount,
		visibleCount,
		exactWhiteCount,
		maximumChannel,
		distinctRgbCount: distinctRgb.size,
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
		pixelIndex.length
			=== descriptor.viewport.width * descriptor.viewport.height,
		'Parent matrix shape changed.',
	);
	requireCondition(
		palette.length === descriptor.paletteEntryCount * 15,
		'Parent palette shape changed.',
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

function compactBuildRecord(record) {
	if (!record) return null;
	return {
		policy: record.policy,
		domainSelectionId: record.domainSelectionId,
		incomingDirectionDomainId: record.incomingDirectionDomainId,
		incomingDirectionDomainContentHash:
			record.incomingDirectionDomainContentHash,
		incomingDirectionCount: record.incomingDirectionCount,
		outgoingDirectionDomainId: record.outgoingDirectionDomainId,
		outgoingDirectionCount: record.outgoingDirectionCount,
		positionDomainId: record.positionDomainId,
		positionCount: record.positionCount,
		maximumScatteringOrder: record.maximumScatteringOrder,
		planIdentity: record.planIdentity,
		planResult: record.planResult,
		fields: record.fields.map((field) => ({
			id: field.id,
			storage: field.storage,
			descriptorContentHash: field.descriptorContentHash,
		})),
		passes: record.passes,
	};
}

function spectralSample(probe, values, color, provenanceIdentity) {
	const pathRadiance = [...values];
	const packet = new SpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
		units: SPECTRAL_UNITS.RADIANCE_DENSITY,
		values: pathRadiance,
		provenanceIdentity,
	});
	return {
		...probe,
		pathRadiance,
		photopicLuminanceCdPerSquareMeter:
			color.radianceToPhotopicLuminance(packet),
		signedLinearSrgb: color.radianceToLinearSrgb(packet),
	};
}

function subtractSpectra(left, right) {
	return left.map((values, probeIndex) => values.map(
		(value, channelIndex) => value - right[probeIndex][channelIndex],
	));
}

function maximumClosureError(baseline, augmented, added) {
	let maximumAbsoluteError = 0;
	let maximumRelativeError = 0;
	for (let probeIndex = 0; probeIndex < baseline.length; probeIndex += 1) {
		for (let channelIndex = 0;
			channelIndex < baseline[probeIndex].length;
			channelIndex += 1) {
			const reconstructed = baseline[probeIndex][channelIndex]
				+ added[probeIndex][channelIndex];
			const expected = augmented[probeIndex][channelIndex];
			const absoluteError = Math.abs(reconstructed - expected);
			maximumAbsoluteError = Math.max(maximumAbsoluteError, absoluteError);
			maximumRelativeError = Math.max(
				maximumRelativeError,
				absoluteError / Math.max(Math.abs(expected), Number.MIN_VALUE),
			);
		}
	}
	return {maximumAbsoluteError, maximumRelativeError};
}

/** Render the exact run-000493 scene with one toggleable actual-point J1 add. */
export async function runNauticalTwilightActualPointJ1Browser() {
	const [config, fixture, radiometry] = await Promise.all([
		fetch('/browser/config.json').then((response) => response.json()),
		fetch('/fixtures/subjective-globe-context-scenes-v1.json')
			.then((response) => response.json()),
		fetch('/fixtures/g4-cpu-sun-disk-transport-v1.json')
			.then((response) => response.json()),
	]);
	const sceneSpec = config.scene;
	const product = await loadProduct(config.product);
	const width = product.viewport.width;
	const height = product.viewport.height;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('webgl2', {
		antialias: false,
		preserveDrawingBuffer: true,
	});
	requireCondition(context, 'WebGL2 is unavailable.');
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
	configureCamera(camera, sceneSpec, fixture.camera.observerHeightMeters);
	const directionToSun = directionFromUpEastNorth(
		sceneSpec.directionToSourceUpEastNorth,
	);
	const geometry = new DoubledOutgoingSphericalEarthGeometry({
		...radiometry.geometry,
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
	const reviewBoxes = createReviewBoxes(radiometry.geometry.bottomRadius.value);
	scene.add(...endpoints.visualObjects, ...reviewBoxes);
	composer.addPass(new RenderPass(scene, camera));
	const backend = new ThreeCacheBackend({THREE, renderer});
	requireCondition(
		backend.capabilities.maximumTextureSize
			>= DOUBLED_OUTGOING_DIRECTION_COUNT,
		`W39 requires texture width ${DOUBLED_OUTGOING_DIRECTION_COUNT}, `
			+ `but this renderer reports ${backend.capabilities.maximumTextureSize}.`,
	);
	const atmosphere = new BrunetonOzoneCandidateAtmosphere({
		constants: {
			...CANONICAL_ATMOSPHERE_CONSTANTS,
			ozoneAbsorptionEnabled: true,
		},
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const lightSource = new ActualPointJ1ControlledDistantSunLightSource({
		directionToLight: directionToSun.toArray(),
		sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
		angularRadius: {
			value: NATIVE_SUN_ANGULAR_RADIUS_RADIANS,
			units: 'radians',
		},
	}, {
		domainSelection:
			REFLECTION_COMPLETED_FIBONACCI_68_W39_CONTROL_SELECTION,
	});
	const celestial = new ScreenPaletteCelestialRuntimeParticipant({
		identity: product.identity,
	});
	const receiverPosition = {
		coordinates: [
			0,
			0,
			radiometry.geometry.bottomRadius.value
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
	const color = new BrunetonSourceLuminanceLiftColorDisplayModel({
		displayConstants: FIGURE1_DISPLAY_CONSTANTS,
		sourceDerivedLocalLuminance: sourceLight.luminanceCdPerSquareMeter,
		luminanceLiftCurve: config.luminanceLiftCurve,
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
	const bindingValues = {
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
		[ACTUAL_POINT_J1_TOGGLE_VALUE_KEY]: 0,
		[SCREEN_PALETTE_MATRIX_VALUE_KEY]: textures.matrix,
		[SCREEN_PALETTE_VALUES_VALUE_KEY]: textures.palette,
	};
	const probes = createActualPointJ1ThreeRayProbes({
		directionToSourceUpEastNorth:
			sceneSpec.directionToSourceUpEastNorth,
	});
	let handle;
	const setupStarted = performance.now();
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
			bindingValues,
		});
		const setupMilliseconds = performance.now() - setupStarted;
		const prepareStarted = performance.now();
		await handle.prepare(renderer);
		const prepareMilliseconds = performance.now() - prepareStarted;
		const buildResult = handle._buildResult;
		requireCondition(
			buildResult?.assembly && buildResult.runtime,
			'Live assembly/runtime is unavailable for the J1 control.',
		);

		const renderState = async (id, toggle) => {
			bindingValues[ACTUAL_POINT_J1_TOGGLE_VALUE_KEY] = toggle;
			const renderStarted = performance.now();
			composer.render();
			const renderMilliseconds = performance.now() - renderStarted;
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
			const imagePngDataUrl = canvas.toDataURL('image/png');
			const probeStarted = performance.now();
			const spectralReadback = await readSkyPathRadianceSpectra({
				renderer,
				sourceAssembly: buildResult.assembly,
				sourceRuntime: buildResult.runtime,
				probes,
				spectralChannelCount: NATIVE_15_SPECTRAL_BASIS.channelCount,
			});
			return {
				id,
				toggle,
				viewIntervalCount: ACTUAL_POINT_J1_DEFAULT_INTERVAL_COUNT,
				sourceIntervalCount: ACTUAL_POINT_J1_DEFAULT_INTERVAL_COUNT,
				timing: {
					renderMilliseconds,
					probeMilliseconds: performance.now() - probeStarted,
				},
				image: summarizeImage(values, width, height),
				stellarImage: summarizeStellar(values, product),
				imagePngDataUrl,
				spectra: spectralReadback.spectra,
				probeAssemblySourceHash:
					spectralReadback.probeAssemblySourceHash,
			};
		};

		const baselineCapture = await renderState('baseline', 0);
		const augmentedCapture = await renderState('augmented', 1);
		requireCondition(
			lightSource.controlledBuildRecords.length === 1,
			'The J1 control must construct exactly one shared cache.',
		);
		requireCondition(
			buildResult.runtime.getUniformValue(
				ACTUAL_POINT_J1_TOGGLE_UNIFORM_NAME,
			) === 1,
			'Augmented render did not publish the enabled J1 toggle.',
		);

		const addedSpectra = subtractSpectra(
			augmentedCapture.spectra,
			baselineCapture.spectra,
		);
		const baselineSamples = probes.map((probe, index) => spectralSample(
			probe,
			baselineCapture.spectra[index],
			color,
			`actual-point-j1-baseline-${index}`,
		));
		const augmentedSamples = probes.map((probe, index) => spectralSample(
			probe,
			augmentedCapture.spectra[index],
			color,
			`actual-point-j1-augmented-${index}`,
		));
		const addedSamples = probes.map((probe, index) => spectralSample(
			probe,
			addedSpectra[index],
			color,
			`actual-point-j1-added-${index}`,
		));
		const source = buildResult.assembly.fragmentShaderSource;
		const webglErrors = [];
		for (let error = context.getError();
			error !== context.NO_ERROR;
			error = context.getError()) {
			webglErrors.push(error);
		}
		const diagnostics = handle.getDiagnostics();
		const buildRecord = compactBuildRecord(
			lightSource.controlledBuildRecords[0],
		);
		return {
			schemaId: 'san-jose-nautical-twilight-actual-point-j1-browser-result-v1',
			renderId: 'san-jose-nautical-twilight-actual-point-j1-v1',
			scope:
				'exact run-000493 scene; one toggle-off baseline and one additive actual-point J1 render; no appearance gate',
			scene: sceneSpec,
			product: {
				id: product.id,
				viewport: product.viewport,
				paletteEntryCount: product.paletteEntryCount,
				stellarPaletteEntryCount: product.stellarPaletteEntryCount,
				identity: product.identity,
			},
			configuration: {
				maximumScatteringOrder: 4,
				incomingDirectionCount:
					REFLECTION_COMPLETED_FIBONACCI_68_W39_CONTROL_SELECTION
						.incomingDirectionCount,
				incomingDirectionControl:
					REFLECTION_COMPLETED_FIBONACCI_68_W39_CONTROL,
				outgoingDirectionPolicy:
					DOUBLED_OUTGOING_DIRECTION_POLICY_ID,
				outgoingFaceWidth: DOUBLED_OUTGOING_FACE_WIDTH,
				outgoingDirectionCount: DOUBLED_OUTGOING_DIRECTION_COUNT,
				positionCount:
					REFLECTION_COMPLETED_FIBONACCI_68_W39_CONTROL_SELECTION
						.positionCount,
				spectralChannelCount: 15,
				ozoneAbsorptionEnabled: atmosphere.ozoneAbsorptionEnabled,
				ozoneIdentity: atmosphere.ozoneIdentity,
				actualPointJ1: ACTUAL_POINT_J1_CONTROL,
			},
			control: {
				cacheSemantic: 'unchanged cumulative J1-through-J4 W39 field',
				baselineToggle: 0,
				augmentedToggle: 1,
				composition:
					'augmented pathRadiance = cached pathRadiance + directly integrated actual-point J1',
			},
			structural: {
				setupCount: 1,
				cacheBuildCount: lightSource.controlledBuildRecords.length,
				handleCount: 1,
				renderCount: 2,
				assemblySourceHash: buildResult.assembly.sourceHash,
				baselineToggleReturnsBeforeJ1Integration:
					source.includes('if (enabled <= 0.0 || !state.bounds.valid) return;'),
				usesActualPointGroundVisibility:
					source.includes('actualPointJ1RayBlockedByGround'),
				usesActualPointTopBoundary:
					source.includes('actualPointJ1TopBoundaryDistance'),
				usesOzoneAwareAtmosphereSampling:
					source.includes('sampleAtmosphere(coordinate)'),
				usesViewSourcePhaseCosine:
					source.includes('dot(\n\t\tnormalize(viewDirection),\n\t\tdirectionToSource'),
				retainsCachedCumulativeTransport:
					source.includes('sampleCumulativeScatteringDensity'),
				buildRecord,
			},
			timing: {
				setupMilliseconds,
				prepareMilliseconds,
				baseline: baselineCapture.timing,
				augmented: augmentedCapture.timing,
			},
			baseline: {
				toggle: baselineCapture.toggle,
				viewIntervalCount: baselineCapture.viewIntervalCount,
				sourceIntervalCount: baselineCapture.sourceIntervalCount,
				image: baselineCapture.image,
				stellarImage: baselineCapture.stellarImage,
			},
			augmented: {
				toggle: augmentedCapture.toggle,
				viewIntervalCount: augmentedCapture.viewIntervalCount,
				sourceIntervalCount: augmentedCapture.sourceIntervalCount,
				image: augmentedCapture.image,
				stellarImage: augmentedCapture.stellarImage,
			},
			threeRaySpectra: {
				schemaId: 'actual-point-j1-three-ray-native15-v1',
				quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
				units: SPECTRAL_UNITS.RADIANCE_DENSITY,
				spectralBasis: {
					id: NATIVE_15_SPECTRAL_BASIS.id,
					contentHash: NATIVE_15_SPECTRAL_BASIS.contentHash,
					channelCount: NATIVE_15_SPECTRAL_BASIS.channelCount,
				},
				probes,
				baseline: baselineSamples,
				augmented: augmentedSamples,
				addedJ1: addedSamples,
				convergence: {
					browserGpu: [{
						viewIntervalCount:
							ACTUAL_POINT_J1_DEFAULT_INTERVAL_COUNT,
						sourceIntervalCount:
							ACTUAL_POINT_J1_DEFAULT_INTERVAL_COUNT,
						augmented: augmentedSamples,
						addedJ1: addedSamples,
					}],
					binary64CpuOracleIntervalCounts: [15, 160, 320],
				},
				closure: maximumClosureError(
					baselineCapture.spectra,
					augmentedCapture.spectra,
					addedSpectra,
				),
				baselineProbeAssemblySourceHash:
					baselineCapture.probeAssemblySourceHash,
				augmentedProbeAssemblySourceHash:
					augmentedCapture.probeAssemblySourceHash,
			},
			backendCapabilities: backend.capabilities,
			geometry: geometry.describe(),
			atmosphere: {
				id: atmosphere.id,
				ozoneIdentity: atmosphere.ozoneIdentity,
			},
			color: color.describe(),
			sourceLight: {
				...sourceLight,
				blockedByGround: sourceTransport.blockedByGround,
				gamma: color.gamma,
			},
			runtime: diagnostics.runtime,
			programDiagnostics: renderer.info.programs.map(
				(program) => program.diagnostics ?? null,
			),
			webglErrors,
			contextLost: context.isContextLost(),
			baselineImagePngDataUrl: baselineCapture.imagePngDataUrl,
			augmentedImagePngDataUrl: augmentedCapture.imagePngDataUrl,
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

export default runNauticalTwilightActualPointJ1Browser;
