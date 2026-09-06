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
import WavelengthMath from
	'../candidate/src/algorithm32/utils/WavelengthMath.js';
import {BrunetonOzoneCandidateAtmosphere} from
	'../atmospheres/BrunetonOzoneCandidateAtmosphere.js';
import {BrunetonSourceLuminanceLiftColorDisplayModel} from
	'./BrunetonSourceLuminanceLiftColorDisplayModel.js';
import {ControlledDistantSunLightSource} from
	'./ControlledDistantSunLightSource.js';
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
import {
	createSkyPathRadianceProbeGrid,
	readSkyPathRadianceSpectra,
} from './SkyPathRadianceSpectralProbe.js';
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

function summarizeImage(values) {
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
		width: 640,
		height: 400,
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
		const outputPixel =
			(product.viewport.height - 1 - y) * product.viewport.width + x;
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

function sumIndices(values, indices) {
	return indices.reduce((sum, index) => sum + values[index], 0);
}

function analyzeSkyPathRadianceSpectra({probes, spectra, color, probeTimingMilliseconds, probeAssemblySourceHash}) {
	const wavelengthsNanometers = NATIVE_15_SPECTRAL_BASIS.channels.map(
		(channel) => WavelengthMath.toNanometers(channel.center),
	);
	const indicesWithin = (minimum, maximum) => wavelengthsNanometers
		.map((wavelengthNanometers, index) => ({wavelengthNanometers, index}))
		.filter(({wavelengthNanometers}) =>
			wavelengthNanometers >= minimum && wavelengthNanometers <= maximum)
		.map(({index}) => index);
	const blueIndices = indicesWithin(407, 470);
	const redIndices = indicesWithin(626, 690);
	const visibleIndices = indicesWithin(407, 690);
	const channel470Index = wavelengthsNanometers.reduce(
		(best, wavelength, index) => Math.abs(wavelength - 470)
			< Math.abs(wavelengthsNanometers[best] - 470) ? index : best,
		0,
	);
	const channel626Index = wavelengthsNanometers.reduce(
		(best, wavelength, index) => Math.abs(wavelength - 626)
			< Math.abs(wavelengthsNanometers[best] - 626) ? index : best,
		0,
	);
	const samples = probes.map((probe, index) => {
		const pathRadiance = spectra[index];
		const packet = new SpectralPacket({
			basis: NATIVE_15_SPECTRAL_BASIS,
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			values: pathRadiance,
			provenanceIdentity:
				`nautical-twilight-f68-w39-ozone-sky-probe-${probe.index}`,
		});
		const blueBandSum = sumIndices(pathRadiance, blueIndices);
		const redBandSum = sumIndices(pathRadiance, redIndices);
		const visibleBandSum = sumIndices(pathRadiance, visibleIndices);
		const signedLinearSrgb = color.radianceToLinearSrgb(packet);
		return {
			...probe,
			pathRadiance,
			photopicLuminanceCdPerSquareMeter:
				color.radianceToPhotopicLuminance(packet),
			signedLinearSrgb,
			blueBandSum407To470: blueBandSum,
			redBandSum626To690: redBandSum,
			visibleBandSum407To690: visibleBandSum,
			blueFractionOf407To690: visibleBandSum > 0
				? blueBandSum / visibleBandSum
				: null,
			blueToRedBandRatio: redBandSum > 0 ? blueBandSum / redBandSum : null,
			channel470To626Ratio: pathRadiance[channel626Index] > 0
				? pathRadiance[channel470Index] / pathRadiance[channel626Index]
				: null,
			positiveBlueSpectralChannelCount: blueIndices.filter(
				(channelIndex) => pathRadiance[channelIndex] > 0,
			).length,
			positiveSignedLinearBlue: signedLinearSrgb[2] > 0,
			blueDominantSignedLinearRgb: signedLinearSrgb[2] > 0
				&& signedLinearSrgb[2] > signedLinearSrgb[0]
				&& signedLinearSrgb[2] > signedLinearSrgb[1],
		};
	});
	const horizonSamples = samples.filter((sample) => sample.elevationDegrees <= 2);
	const positiveBlueSpectra = samples.filter((sample) =>
		sample.positiveBlueSpectralChannelCount > 0);
	const positiveLinearBlue = samples.filter((sample) =>
		sample.positiveSignedLinearBlue);
	const blueDominant = samples.filter((sample) =>
		sample.blueDominantSignedLinearRgb);
	const finiteMetricRange = (key, subset = samples) => {
		const values = subset.map((sample) => sample[key]).filter(Number.isFinite);
		return values.length > 0
			? {minimum: Math.min(...values), maximum: Math.max(...values)}
			: {minimum: null, maximum: null};
	};
	return {
		schemaId: 'nautical-twilight-f68-w39-ozone-sky-path-radiance-v1',
		meaning: 'diffuse atmospheric state.pathRadiance intercepted before celestial composition and Color',
		spectralBasis: {
			id: NATIVE_15_SPECTRAL_BASIS.id,
			contentHash: NATIVE_15_SPECTRAL_BASIS.contentHash,
			channelCount: NATIVE_15_SPECTRAL_BASIS.channelCount,
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			channelCenterUnits: 'nanometers',
		},
		probeAssemblySourceHash,
		probeTimingMilliseconds,
		wavelengthsNanometers,
		bands: {
			blue407To470Indices: blueIndices,
			red626To690Indices: redIndices,
			visible407To690Indices: visibleIndices,
			channel470Index,
			channel626Index,
		},
		summary: {
			sampleCount: samples.length,
			horizonSampleCount: horizonSamples.length,
			positiveBlueSpectrumCount: positiveBlueSpectra.length,
			positiveSignedLinearBlueCount: positiveLinearBlue.length,
			blueDominantSignedLinearRgbCount: blueDominant.length,
			blueFractionOf407To690: finiteMetricRange('blueFractionOf407To690'),
			blueToRedBandRatio: finiteMetricRange('blueToRedBandRatio'),
			channel470To626Ratio: finiteMetricRange('channel470To626Ratio'),
			horizon: {
				positiveBlueSpectrumCount: horizonSamples.filter((sample) =>
					sample.positiveBlueSpectralChannelCount > 0).length,
				positiveSignedLinearBlueCount: horizonSamples.filter((sample) =>
					sample.positiveSignedLinearBlue).length,
				blueDominantSignedLinearRgbCount: horizonSamples.filter((sample) =>
					sample.blueDominantSignedLinearRgb).length,
				blueFractionOf407To690:
					finiteMetricRange('blueFractionOf407To690', horizonSamples),
				blueToRedBandRatio:
					finiteMetricRange('blueToRedBandRatio', horizonSamples),
				channel470To626Ratio:
					finiteMetricRange('channel470To626Ratio', horizonSamples),
			},
		},
		samples,
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

/** Render only the exact 000466 +1 h scene with ozone and W39 outgoing data. */
export async function runNauticalTwilightOzoneW39Browser() {
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
	const renderer = new THREE.WebGLRenderer({
		canvas,
		context,
		antialias: false,
	});
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
	const lightSource = new ControlledDistantSunLightSource({
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
	let handle;
	const started = performance.now();
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
		const setupMilliseconds = performance.now() - started;
		const renderStarted = performance.now();
		await handle.prepare(renderer);
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
		const buildResult = handle._buildResult;
		requireCondition(
			buildResult?.assembly && buildResult.runtime,
			'Live assembly/runtime is unavailable for the sky spectral probe.',
		);
		const sourceAzimuthDegrees = Math.atan2(
			sceneSpec.directionToSourceUpEastNorth[1],
			sceneSpec.directionToSourceUpEastNorth[2],
		) * 180 / Math.PI;
		const spectralProbes = createSkyPathRadianceProbeGrid({
			sourceAzimuthDegrees,
		});
		const spectralProbeStarted = performance.now();
		const spectralReadback = await readSkyPathRadianceSpectra({
			renderer,
			sourceAssembly: buildResult.assembly,
			sourceRuntime: buildResult.runtime,
			probes: spectralProbes,
			spectralChannelCount: NATIVE_15_SPECTRAL_BASIS.channelCount,
		});
		const skyPathRadianceSpectra = analyzeSkyPathRadianceSpectra({
			probes: spectralProbes,
			spectra: spectralReadback.spectra,
			color,
			probeTimingMilliseconds: performance.now() - spectralProbeStarted,
			probeAssemblySourceHash:
				spectralReadback.probeAssemblySourceHash,
		});
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
			renderId: 'san-jose-nautical-twilight-ozone-f68-w39-preview-v1',
			scope: 'single diagnostic render; no appearance acceptance gates',
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
				baselineOutgoingDirectionCount: 4374,
				outgoingDirectionCountRatio:
					DOUBLED_OUTGOING_DIRECTION_COUNT / 4374,
				positionCount:
					REFLECTION_COMPLETED_FIBONACCI_68_W39_CONTROL_SELECTION
						.positionCount,
				spectralChannelCount: 15,
				ozoneAbsorptionEnabled: atmosphere.ozoneAbsorptionEnabled,
				ozoneIdentity: atmosphere.ozoneIdentity,
				ozoneComposition: atmosphere.ozoneComposition,
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
			buildRecord,
			timing: {setupMilliseconds, renderMilliseconds},
			image: summarizeImage(values),
			stellarImage: summarizeStellar(values, product),
			skyPathRadianceSpectra,
			runtime: diagnostics.runtime,
			programDiagnostics: renderer.info.programs.map(
				(program) => program.diagnostics ?? null,
			),
			webglErrors,
			contextLost: context.isContextLost(),
			imagePngDataUrl: canvas.toDataURL('image/png'),
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

export default runNauticalTwilightOzoneW39Browser;
