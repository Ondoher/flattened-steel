import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';

import {Algorithm32} from '../candidate/src/algorithm32/Algorithm32.js';
import {CanonicalAtmosphere} from '../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import {CelestialRuntimeParticipant} from '../candidate/src/algorithm32/caches/celestial/CelestialRuntimeParticipant.js';
import {FiniteLocalSunCelestialSource} from '../candidate/src/algorithm32/caches/celestial/FiniteLocalSunCelestialSource.js';
import {BrunetonColorDisplayModel} from '../candidate/src/algorithm32/color/BrunetonColorDisplayModel.js';
import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
	FIGURE1_DISPLAY_CONSTANTS,
} from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import {SphericalEarthGeometry} from '../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
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
	DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM,
} from './BrunetonExtraterrestrialVisibilityColorDisplayModel.js';
import {ControlledDistantSunLightSource} from './ControlledDistantSunLightSource.js';
import {
	CONTROLLED_FLAT_FIBONACCI68_TRANSPORT_PACKING_POLICY,
	ControlledFlatEarthFibonacci68TransportGeometry,
} from './ControlledFlatEarthFibonacci68TransportGeometry.js';
import {createFlatFibonacci68TransportGpuProbe} from
	'./FlatFibonacci68TransportGpuProbe.js';
import {
	CONTROLLED_LOCAL_SUN_FIBONACCI68_POLICY,
} from './ControlledLocalSunConstructionDomainSelection.js';
import {ControlledLocalSunLightSource} from './ControlledLocalSunLightSource.js';
import {Native15BrunetonExposureEvaluator} from './Native15BrunetonExposureEvaluator.js';
import {
	REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_PROVENANCE,
	REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_SELECTION,
	auditReflectionCompletedFibonacci68Control,
} from './ReflectionCompletedFibonacci68Control.js';
import {
	SCREEN_PALETTE_MATRIX_VALUE_KEY,
	SCREEN_PALETTE_VALUES_VALUE_KEY,
	ScreenPaletteCelestialRuntimeParticipant,
} from './ScreenPaletteCelestialRuntimeParticipant.js';
import {
	SOURCE_DERIVED_LOCAL_LUMINANCE_CONTRACT_ID,
	deriveFiniteSourceIncidentIrradiance,
	deriveSourceLocalLuminance,
} from './SourceDerivedLocalLuminance.js';

const NATIVE_SUN_ANGULAR_RADIUS_RADIANS = 0.004675;
const EXPECTED_SPHERICAL_SCENE_IDS = Object.freeze([
	'solar-noon',
	'sunset-minus-30-minutes',
	'sunset',
	'sunset-plus-30-minutes',
	'sunset-plus-one-hour',
	'sunset-plus-two-hours',
]);
const EXPECTED_FLAT_STATE_IDS = Object.freeze([
	'flat-0',
	'flat-90',
	'flat-180',
]);
const SPHERICAL_PREFLIGHT_IDS = Object.freeze([
	'sunset-plus-one-hour',
	'sunset-plus-two-hours',
]);
const FLAT_PREFLIGHT_ID = 'flat-180';
const FLAT_FINITE_DISK_SAMPLE_OFFSETS = Object.freeze([
	Object.freeze([-0.25, -0.25]),
	Object.freeze([0.25, -0.25]),
	Object.freeze([-0.25, 0.25]),
	Object.freeze([0.25, 0.25]),
]);
const SOURCE_EXPOSURE_CURVE = Object.freeze({
	brightThreshold: 5,
	darkThreshold: 0.001,
	maximumExposureGain: 131072,
});
const DISPLAY_SHOULDER_POWER = 8;
const GATES = Object.freeze({
	nonCelestialMaximumByteDifference: 1,
	plusOneVisibleStarCount: 32,
	plusTwoMinimumVisibleStarCount: 31,
	minimumVisibleStarUpliftChannel: 1,
	minimumMedianStarUpliftChannel: 32,
	minimumDistinctStarRgbCount: 28,
	maximumStarChannel: 254,
	maximumExactWhiteStarCount: 0,
	minimumRawPaletteRankCorrelation: 0.5,
	maximumPostSunsetSunUpliftChannel: 1,
	minimumVisibleSolarDiscPeakChannel: 64,
	flat180MaximumChannel: 254,
	flat180MinimumChangedPeakChannel: 128,
	flat180MaximumExactWhiteSupportCount: 0,
	flat180MaximumGreenToRed: 0.7,
	flat180MaximumBlueToRed: 0.3,
	localRadiometricCalibrationRelativeTolerance: 1e-12,
});
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

function countLiteral(source, literal) {
	let count = 0;
	let cursor = 0;
	while (true) {
		const index = source.indexOf(literal, cursor);
		if (index < 0) return count;
		count += 1;
		cursor = index + literal.length;
	}
}

function relativeDifference(left, right) {
	return Math.abs(left - right) / Math.max(Math.abs(left), Math.abs(right), 1e-300);
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
	camera.updateProjectionMatrix();
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

async function loadProduct(descriptor) {
	const [matrixBytes, paletteBytes] = await Promise.all([
		fetch(descriptor.matrixUrl).then((response) => {
			requireCondition(response.ok, `${descriptor.id} matrix fetch failed.`);
			return response.arrayBuffer();
		}),
		fetch(descriptor.paletteUrl).then((response) => {
			requireCondition(response.ok, `${descriptor.id} palette fetch failed.`);
			return response.arrayBuffer();
		}),
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
	requireCondition(
		Number.isInteger(descriptor.stellarPaletteEntryCount)
			&& descriptor.stellarPaletteEntryCount >= 1
			&& descriptor.stellarPaletteEntryCount <= descriptor.paletteEntryCount
			&& pixelIndex.every((entry) => entry < descriptor.paletteEntryCount),
		`${descriptor.id} palette bounds changed.`,
	);
	requireCondition(
		palette.slice(0, 15).every((value) => value === 0),
		`${descriptor.id} palette entry zero is not exact-zero celestial radiance.`,
	);
	return {...descriptor, pixelIndex, palette};
}

function requireProductMatchesScene({key, product, sceneSpec, camera}) {
	const identity = JSON.parse(product.identity);
	const view = identity.view;
	const identityCamera = view.camera;
	const expectedAzimuth = sceneSpec.viewAzimuthDegrees * Math.PI / 180;
	const expectedElevation = sceneSpec.viewElevationDegrees * Math.PI / 180;
	const expectedVerticalFov = camera.verticalFovDegrees * Math.PI / 180;
	const sunOccupiedPixelCount = product.pixelIndex.reduce(
		(count, entry) => count + Number(entry >= product.stellarPaletteEntryCount),
		0,
	);
	requireCondition(
		product.id === key
			&& sceneSpec.id === key
			&& product.viewport.width === camera.widthPixels
			&& product.viewport.height === camera.heightPixels
			&& identity.schema === 'stellar-screen-palette-cache-v1'
			&& identity.legacySunContribution === 'disabled'
			&& view.catalogFrameId === 'eq-fk5-j2000-mean'
			&& view.observation.instant === sceneSpec.timeIso
			&& identityCamera.frameId === 'camera-forward-right-up-v1'
			&& identityCamera.viewportConventionId
				=== 'top-left-row-major-half-open-v1'
			&& relativeDifference(identityCamera.azimuthRadians, expectedAzimuth)
				<= 1e-12
			&& relativeDifference(identityCamera.elevationRadians, expectedElevation)
				<= 1e-12
			&& relativeDifference(
				identityCamera.verticalFieldOfViewRadians,
				expectedVerticalFov,
			) <= 1e-12
			&& identityCamera.viewport.width === camera.widthPixels
			&& identityCamera.viewport.height === camera.heightPixels
			&& sunOccupiedPixelCount === product.sunOccupiedPixelCount,
		`${key} screen product is not bound to its labeled scene and camera.`,
	);
	return {
		productId: product.id,
		identity,
		paletteEntryCount: product.paletteEntryCount,
		stellarPaletteEntryCount: product.stellarPaletteEntryCount,
		sunOccupiedPixelCount,
	};
}

function requireHistoricalBrunetonControl(descriptor, id, kind) {
	const expectedParent = kind === 'spherical-distant'
		? '000466-bruneton-source-luminance-lift-spherical-comparison'
		: '000467-bruneton-source-luminance-lift-flat-local-comparison';
	requireCondition(
		descriptor?.id === id
			&& descriptor.kind === kind
			&& descriptor.parentRunId === expectedParent
			&& /^sha256:[a-f0-9]{64}$/u.test(
				`sha256:${descriptor.parentArtifactSetSha256}`,
			)
			&& /^sha256:[a-f0-9]{64}$/u.test(`sha256:${descriptor.sha256}`)
			&& Number.isInteger(descriptor.byteLength)
			&& descriptor.byteLength > 0
			&& descriptor.url
				=== `/browser/historical/${kind === 'spherical-distant'
					? '000466'
					: '000467'}-bruneton-${id}.png`
			&& descriptor.sourcePath === `captures/bruneton-${id}.png`,
		`Historical Bruneton control identity changed for ${id}.`,
	);
	return descriptor;
}

function classifyHistoricalBrunetonDrift(id) {
	if (id === 'sunset-plus-one-hour') {
		return {
			classification:
				'intentional-fib68-lobe-correction-full-frame-owner-review',
			minimumDifferingPixelCount: 1,
			claimBoundary:
				'Run 000471 proves only a +1-hour one-dimensional horizon correction; this full-frame metric is reported without a historical-similarity threshold.',
		};
	}
	if (id === 'sunset-plus-30-minutes'
		|| id === 'sunset-plus-two-hours') {
		return {
			classification: 'post-sunset-diagnostic',
			claimBoundary:
				'FIB68-versus-historical-FIB34 drift is reported but is not a close-match acceptance gate after sunset.',
		};
	}
	return {
		classification: 'strict-close-match-outside-celestial-support',
		thresholds: {
			maximumAbsoluteChannelDifference: 8,
			p99AbsoluteChannelDifference: 2,
			rootMeanSquareChannelDifference: 1,
		},
	};
}

function historicalBrunetonDriftPasses(drift) {
	const metrics = drift.metrics;
	const metricsAreValid = metrics.pixelCount > 0
		&& Number.isFinite(metrics.maximumAbsoluteChannelDifference)
		&& Number.isFinite(metrics.p99AbsoluteChannelDifference)
		&& Number.isFinite(metrics.rootMeanSquareChannelDifference);
	if (!metricsAreValid) return false;
	if (drift.classification
		=== 'strict-close-match-outside-celestial-support') {
		return drift.thresholds.maximumAbsoluteChannelDifference === 8
			&& drift.thresholds.p99AbsoluteChannelDifference === 2
			&& drift.thresholds.rootMeanSquareChannelDifference === 1
			&& metrics.maximumAbsoluteChannelDifference
				<= drift.thresholds.maximumAbsoluteChannelDifference
			&& metrics.p99AbsoluteChannelDifference
				<= drift.thresholds.p99AbsoluteChannelDifference
			&& metrics.rootMeanSquareChannelDifference
				<= drift.thresholds.rootMeanSquareChannelDifference;
	}
	if (drift.classification
		=== 'intentional-fib68-lobe-correction-full-frame-owner-review') {
		return drift.minimumDifferingPixelCount === 1
			&& metrics.differingPixelCount >= drift.minimumDifferingPixelCount;
	}
	return drift.classification === 'post-sunset-diagnostic';
}

function createProductTextures(product) {
	const matrix = new THREE.DataTexture(
		new Uint16Array(product.pixelIndex),
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

function describeWebglError(context, code) {
	const names = [
		'INVALID_ENUM',
		'INVALID_VALUE',
		'INVALID_OPERATION',
		'OUT_OF_MEMORY',
		'INVALID_FRAMEBUFFER_OPERATION',
		'CONTEXT_LOST_WEBGL',
	];
	return {
		code,
		hex: `0x${code.toString(16).padStart(4, '0')}`,
		name: names.find((name) => context[name] === code) ?? 'UNKNOWN_WEBGL_ERROR',
	};
}

function captureWebglStage({context, label, stage, ledger}) {
	const codes = collectWebglErrors(context);
	const errors = codes.map((code) => describeWebglError(context, code));
	const contextLost = context.isContextLost();
	const record = {stage, codes, errors, contextLost};
	ledger.push(record);
	requireCondition(
		errors.length === 0 && contextLost === false,
		`${label} ${stage} WebGL failure: ${JSON.stringify({errors, contextLost})}.`,
	);
	return record;
}

function captureRuntimeHealth({
	context,
	renderer,
	handle,
	label,
	expectedSourceHash,
	webglStageLedger,
}) {
	const diagnostics = handle.getDiagnostics();
	const runtime = diagnostics.runtime;
	const programDiagnostics = renderer.info.programs.map(
		(program) => program.diagnostics ?? null,
	);
	const finalWebglStage = captureWebglStage({
		context,
		label,
		stage: 'post-readback-runtime-health',
		ledger: webglStageLedger,
	});
	const webglErrors = finalWebglStage.codes;
	const sceneInputCaptureFrameCount =
		runtime?.sceneInputCapture?.frameCount ?? 0;
	requireCondition(
		diagnostics.status === 'installed'
			&& runtime?.status === 'ready'
			&& runtime.sourceHash === expectedSourceHash
			&& runtime.frameCount >= 1
			&& runtime.renderErrorCount === 0
			&& runtime.lastRenderError === null,
		`${label} runtime is not installed.`,
	);
	requireCondition(
		programDiagnostics.length > 0
			&& programDiagnostics.every((entry) => entry === null),
		`${label} has an unrunnable or diagnostic shader program.`,
	);
	requireCondition(
		webglErrors.length === 0,
		`${label} produced WebGL errors.`,
	);
	requireCondition(
		sceneInputCaptureFrameCount >= 1,
		`${label} did not capture a scene-input frame.`,
	);
	return {
		status: diagnostics.status,
		modelVersion: diagnostics.modelVersion,
		runtimeStatus: runtime.status,
		sourceHash: runtime.sourceHash,
		expectedSourceHash,
		frameCount: runtime.frameCount,
		renderErrorCount: runtime.renderErrorCount,
		lastRenderError: runtime.lastRenderError,
		programCount: programDiagnostics.length,
		programDiagnostics,
		webglErrors,
		webglStageLedger: webglStageLedger.map((entry) => ({
			stage: entry.stage,
			codes: [...entry.codes],
			errors: entry.errors.map((error) => ({...error})),
			contextLost: entry.contextLost,
		})),
		sceneInputCaptureFrameCount,
	};
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

function summarizeImageHealth(image) {
	let nonBlackPixelCount = 0;
	let nonWhitePixelCount = 0;
	let minimumChannel = 255;
	let maximumChannel = 0;
	const distinctRgb = new Set();
	for (let pixel = 0; pixel < image.width * image.height; pixel += 1) {
		const offset = pixel * 4;
		const rgb = [
			image.values[offset],
			image.values[offset + 1],
			image.values[offset + 2],
		];
		const minimum = Math.min(...rgb);
		const maximum = Math.max(...rgb);
		minimumChannel = Math.min(minimumChannel, minimum);
		maximumChannel = Math.max(maximumChannel, maximum);
		if (maximum > 0) nonBlackPixelCount += 1;
		if (minimum < 255) nonWhitePixelCount += 1;
		distinctRgb.add(rgb.join(','));
	}
	return {
		width: image.width,
		height: image.height,
		pixelCount: image.width * image.height,
		nonBlackPixelCount,
		nonWhitePixelCount,
		minimumChannel,
		maximumChannel,
		distinctRgbCount: distinctRgb.size,
	};
}

function imageHealthIsValid(health, {allowExactBlack = false} = {}) {
	const normal = health.nonBlackPixelCount > 0
		&& health.nonWhitePixelCount > 0
		&& health.distinctRgbCount > 1;
	const exactBlack = allowExactBlack
		&& health.maximumChannel === 0
		&& health.nonBlackPixelCount === 0
		&& health.nonWhitePixelCount === health.pixelCount
		&& health.distinctRgbCount === 1;
	return normal || exactBlack;
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
	const channelHistogram = new Array(256).fill(0);
	let pixelCount = 0;
	let maximumAbsoluteChannelDifference = 0;
	let absoluteDifferenceSum = 0;
	let squaredDifferenceSum = 0;
	let differingPixelCount = 0;
	for (let pixel = 0; pixel < candidate.width * candidate.height; pixel += 1) {
		if (!includesPixel(pixel)) continue;
		pixelCount += 1;
		const offset = pixel * 4;
		let pixelMaximumDifference = 0;
		for (let channel = 0; channel < 3; channel += 1) {
			const difference = Math.abs(
				candidate.values[offset + channel]
					- control.values[offset + channel],
			);
			channelHistogram[difference] += 1;
			pixelMaximumDifference = Math.max(pixelMaximumDifference, difference);
			maximumAbsoluteChannelDifference = Math.max(
				maximumAbsoluteChannelDifference,
				difference,
			);
			absoluteDifferenceSum += difference;
			squaredDifferenceSum += difference ** 2;
		}
		if (pixelMaximumDifference > 0) differingPixelCount += 1;
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
	const channelPercentileRank = Math.ceil(pixelCount * 3 * 0.99);
	let channelCumulative = 0;
	let p99AbsoluteChannelDifference = 0;
	for (let difference = 0; difference < channelHistogram.length; difference += 1) {
		channelCumulative += channelHistogram[difference];
		if (channelCumulative >= channelPercentileRank) {
			p99AbsoluteChannelDifference = difference;
			break;
		}
	}
	return {
		pixelCount,
		differingPixelCount,
		maximumAbsoluteChannelDifference,
		p99MaximumAbsoluteChannelDifference,
		p99AbsoluteChannelDifference,
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

function averageRanks(values) {
	const indices = values.map((value, index) => ({value, index}))
		.sort((left, right) => left.value - right.value || left.index - right.index);
	const ranks = new Array(values.length);
	for (let start = 0; start < indices.length;) {
		let end = start + 1;
		while (end < indices.length && indices[end].value === indices[start].value) {
			end += 1;
		}
		const rank = (start + end - 1) / 2;
		for (let cursor = start; cursor < end; cursor += 1) {
			ranks[indices[cursor].index] = rank;
		}
		start = end;
	}
	return ranks;
}

function pearsonCorrelation(left, right) {
	requireCondition(left.length === right.length, 'Correlation shapes differ.');
	if (left.length < 2) return null;
	const leftMean = left.reduce((sum, value) => sum + value, 0) / left.length;
	const rightMean = right.reduce((sum, value) => sum + value, 0) / right.length;
	let covariance = 0;
	let leftVariance = 0;
	let rightVariance = 0;
	for (let index = 0; index < left.length; index += 1) {
		const leftDelta = left[index] - leftMean;
		const rightDelta = right[index] - rightMean;
		covariance += leftDelta * rightDelta;
		leftVariance += leftDelta ** 2;
		rightVariance += rightDelta ** 2;
	}
	if (leftVariance === 0 || rightVariance === 0) return null;
	return covariance / Math.sqrt(leftVariance * rightVariance);
}

function rawPalettePhotopic(entry, product, evaluator) {
	const spectrum = Array.from(
		product.palette.slice(entry * 15, (entry + 1) * 15),
	);
	const linearSrgb = evaluator.project(spectrum);
	return Math.max(
		0,
		linearSrgb[0] * 0.2126
			+ linearSrgb[1] * 0.7152
			+ linearSrgb[2] * 0.0722,
	);
}

function summarizeStellarImage(image, zeroCelestialImage, product) {
	requireCondition(
		image.width === product.viewport.width
			&& image.height === product.viewport.height,
		'Stellar image and screen-palette shapes differ.',
	);
	requireSameImageShape(image, zeroCelestialImage);
	const evaluator = new Native15BrunetonExposureEvaluator();
	const distinctRgb = new Set();
	const peakChannels = [];
	const rawPhotopic = [];
	const upliftPhotopic = [];
	let eligibleCount = 0;
	let visibleCount = 0;
	let exactWhiteCount = 0;
	let maximumChannel = 0;
	let negativeUpliftChannelCount = 0;
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
		const zeroRgb = [
			zeroCelestialImage.values[offset],
			zeroCelestialImage.values[offset + 1],
			zeroCelestialImage.values[offset + 2],
		];
		const signedUplift = rgb.map((value, channel) => value - zeroRgb[channel]);
		negativeUpliftChannelCount += signedUplift.filter((value) => value < 0).length;
		const upliftRgb = signedUplift.map((value) => Math.max(0, value));
		const peak = Math.max(...upliftRgb);
		const uplift = upliftRgb[0] * 0.2126
			+ upliftRgb[1] * 0.7152
			+ upliftRgb[2] * 0.0722;
		peakChannels.push(peak);
		rawPhotopic.push(rawPalettePhotopic(entry, product, evaluator));
		upliftPhotopic.push(uplift);
		maximumChannel = Math.max(maximumChannel, ...rgb);
		if (peak >= GATES.minimumVisibleStarUpliftChannel) {
			visibleCount += 1;
			distinctRgb.add(upliftRgb.join(','));
		}
		if (rgb.every((value) => value === 255)) exactWhiteCount += 1;
	}
	peakChannels.sort((left, right) => left - right);
	let comparablePairCount = 0;
	let concordantPairCount = 0;
	let discordantPairCount = 0;
	for (let left = 0; left < rawPhotopic.length; left += 1) {
		for (let right = left + 1; right < rawPhotopic.length; right += 1) {
			const rawDelta = rawPhotopic[left] - rawPhotopic[right];
			const renderedDelta = upliftPhotopic[left] - upliftPhotopic[right];
			if (rawDelta === 0 || renderedDelta === 0) continue;
			comparablePairCount += 1;
			if (Math.sign(rawDelta) === Math.sign(renderedDelta)) {
				concordantPairCount += 1;
			} else {
				discordantPairCount += 1;
			}
		}
	}
	return {
		eligibleCount,
		visibleCount,
		exactWhiteCount,
		maximumChannel,
		negativeUpliftChannelCount,
		distinctRgbCount: distinctRgb.size,
		peakChannelQuantiles: {
			minimum: quantile(peakChannels, 0),
			firstQuartile: quantile(peakChannels, 0.25),
			median: quantile(peakChannels, 0.5),
			thirdQuartile: quantile(peakChannels, 0.75),
			maximum: quantile(peakChannels, 1),
		},
		rank: {
			coordinate:
				'raw screen-palette photopic proxy versus isolated live display-byte uplift over the same-Color zero-celestial frame',
			spearmanCorrelation: pearsonCorrelation(
				averageRanks(rawPhotopic),
				averageRanks(upliftPhotopic),
			),
			comparablePairCount,
			concordantPairCount,
			discordantPairCount,
		},
	};
}

function summarizeSunEntryUplift(image, zeroCelestialImage, product) {
	requireSameImageShape(image, zeroCelestialImage);
	let eligibleCount = 0;
	let changedPixelCount = 0;
	let maximumPositiveChannelUplift = 0;
	let maximumAbsoluteChannelDifference = 0;
	let exactWhiteCount = 0;
	let peak = null;
	let changedPeak = null;
	for (let pixel = 0; pixel < product.pixelIndex.length; pixel += 1) {
		const entry = product.pixelIndex[pixel];
		if (entry < product.stellarPaletteEntryCount) continue;
		eligibleCount += 1;
		const offset = pixel * 4;
		const candidate = samplePixel(image, pixel);
		if (candidate.exactWhite) exactWhiteCount += 1;
		if (peak === null || candidate.maximum > peak.maximum) peak = candidate;
		let changed = false;
		for (let channel = 0; channel < 3; channel += 1) {
			const difference = image.values[offset + channel]
				- zeroCelestialImage.values[offset + channel];
			if (difference !== 0) changed = true;
			maximumPositiveChannelUplift = Math.max(
				maximumPositiveChannelUplift,
				difference,
			);
			maximumAbsoluteChannelDifference = Math.max(
				maximumAbsoluteChannelDifference,
				Math.abs(difference),
			);
		}
		if (changed) {
			changedPixelCount += 1;
			if (changedPeak === null
				|| candidate.maximum > changedPeak.maximum) {
				changedPeak = candidate;
			}
		}
	}
	return {
		eligibleCount,
		changedPixelCount,
		maximumPositiveChannelUplift,
		maximumAbsoluteChannelDifference,
		exactWhiteCount,
		peak,
		changedPeak,
	};
}

function samplePixel(image, pixel) {
	const offset = pixel * 4;
	const rgb = [
		image.values[offset],
		image.values[offset + 1],
		image.values[offset + 2],
	];
	const maximum = Math.max(...rgb);
	return {
		pixel,
		x: pixel % image.width,
		y: Math.floor(pixel / image.width),
		rgb,
		maximum,
		exactWhite: rgb.every((value) => value === 255),
		greenToRed: rgb[0] === 0 ? null : rgb[1] / rgb[0],
		blueToRed: rgb[0] === 0 ? null : rgb[2] / rgb[0],
	};
}

function summarizeFlatSupport(
	candidate,
	control,
	zeroCelestial,
	supportIndices,
) {
	requireSameImageShape(candidate, zeroCelestial);
	const samples = supportIndices.map((pixel) => ({
		candidate: samplePixel(candidate, pixel),
		control: samplePixel(control, pixel),
		zeroCelestial: samplePixel(zeroCelestial, pixel),
	}));
	let exactWhiteCount = 0;
	let changedPixelCount = 0;
	let peak = null;
	let changedPeak = null;
	let maximumPositiveChannelUplift = 0;
	let maximumAbsoluteChannelDifference = 0;
	let negativeUpliftChannelCount = 0;
	for (const sample of samples) {
		if (sample.candidate.exactWhite) exactWhiteCount += 1;
		let changed = false;
		for (let channel = 0; channel < 3; channel += 1) {
			const difference = sample.candidate.rgb[channel]
				- sample.zeroCelestial.rgb[channel];
			if (difference !== 0) changed = true;
			if (difference < 0) negativeUpliftChannelCount += 1;
			maximumPositiveChannelUplift = Math.max(
				maximumPositiveChannelUplift,
				difference,
			);
			maximumAbsoluteChannelDifference = Math.max(
				maximumAbsoluteChannelDifference,
				Math.abs(difference),
			);
		}
		if (changed) {
			changedPixelCount += 1;
			if (changedPeak === null
				|| sample.candidate.maximum > changedPeak.maximum) {
				changedPeak = sample.candidate;
			}
		}
		if (peak === null || sample.candidate.maximum > peak.maximum) {
			peak = sample.candidate;
		}
	}
	return {
		supportPixelCount: supportIndices.length,
		changedPixelCount,
		exactWhiteCount,
		maximumPositiveChannelUplift,
		maximumAbsoluteChannelDifference,
		negativeUpliftChannelCount,
		peak,
		changedPeak,
	};
}

async function makePair({leftUrl, rightUrl, leftLabel, rightLabel}) {
	const [left, right] = await Promise.all([loadImage(leftUrl), loadImage(rightUrl)]);
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
	context.fillText(rightLabel, left.width + right.width / 2, labelHeight / 2);
	context.drawImage(left, 0, labelHeight);
	context.drawImage(right, left.width, labelHeight);
	return canvas.toDataURL('image/png');
}

function parseShaderFloat(shader, name) {
	const match = new RegExp(`const\\s+float\\s+${name}\\s*=\\s*([^;]+);`, 'u')
		.exec(shader);
	requireCondition(match, `Shader omits ${name}.`);
	const value = Number(match[1].trim());
	requireCondition(Number.isFinite(value), `Shader ${name} is not finite.`);
	return value;
}

function auditControlShader(shader) {
	const baseInvocation =
		'encodeDisplayOutput(composeSceneLinearSrgb(state))';
	return {
		brunetonConstants: shader.includes('DISPLAY_TONE_MAP_K'),
		bakedToneMapK: parseShaderFloat(shader, 'DISPLAY_TONE_MAP_K'),
		baseInvocationCount: countLiteral(shader, baseInvocation),
		v2InvocationCount: countLiteral(
			shader,
			'encodeBrunetonExtraterrestrialVisibility(state)',
		),
	};
}

function auditCandidateShader(shader, descriptor, expected) {
	const metadata = descriptor.displayConversion.metadata
		.extraterrestrialVisibility;
	const externalStart = shader.indexOf('vec3 extraterrestrialLinearSrgb');
	const externalEnd = shader.indexOf('return vec4(displaySrgb, 1.0);', externalStart);
	requireCondition(
		externalStart >= 0 && externalEnd > externalStart,
		'V2 shader omits its external-ledger section.',
	);
	const externalSection = shader.slice(externalStart, externalEnd);
	const baked = {
		toneMapK: parseShaderFloat(shader, 'DISPLAY_TONE_MAP_K'),
		exposureGain: parseShaderFloat(shader, 'SOURCE_DERIVED_EXPOSURE_GAIN'),
		displayHeadroom: parseShaderFloat(
			shader,
			'EXTRATERRESTRIAL_DISPLAY_HEADROOM',
		),
		displayShoulderPower: parseShaderFloat(
			shader,
			'EXTRATERRESTRIAL_DISPLAY_SHOULDER_POWER',
		),
	};
	const audit = {
		v2InvocationCount: countLiteral(
			shader,
			'encodeBrunetonExtraterrestrialVisibility(state)',
		),
		staleBaseInvocationCount: countLiteral(
			shader,
			'encodeDisplayOutput(composeSceneLinearSrgb(state))',
		),
		externalSectionTransmittanceReferenceCount:
			countLiteral(externalSection, 'transmittance'),
		separatePathLedger: shader.includes(
			'spectralRadianceToLinearSrgb(state.pathRadiance)',
		),
		alreadyTransportedExternalLedger: shader.includes(
			'spectralRadianceToLinearSrgb(state.celestialRadiance)',
		),
		baked,
		descriptorMetadata: metadata,
	};
	requireCondition(
		audit.v2InvocationCount === 1
			&& audit.staleBaseInvocationCount === 0,
		'V2 shader must invoke exactly one V2 encoder and no stale base main.',
	);
	requireCondition(
		audit.externalSectionTransmittanceReferenceCount === 0,
		'V2 external ledger reapplies atmosphere transmittance.',
	);
	requireCondition(
		audit.separatePathLedger && audit.alreadyTransportedExternalLedger,
		'V2 shader does not retain the two qualified ledgers.',
	);
	requireCondition(
		baked.exposureGain === metadata.exposureGain
			&& baked.displayHeadroom === metadata.displayHeadroom
			&& baked.displayShoulderPower === metadata.displayShoulderPower,
		'V2 descriptor metadata and baked GLSL constants differ.',
	);
	requireCondition(
		metadata.inputLedger
			=== 'already-atmosphere-transported-celestial-radiance'
			&& metadata.responseCoordinate === 'rec709-photopic-luminance'
			&& metadata.sourceDerivedLocalLuminance
				=== expected.sourceDerivedLocalLuminance
			&& JSON.stringify(metadata.sourceExposureCurve)
				=== JSON.stringify(SOURCE_EXPOSURE_CURVE)
			&& metadata.exposureGain === expected.exposureGain
			&& metadata.displayHeadroom
				=== DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM
			&& metadata.displayShoulderPower === DISPLAY_SHOULDER_POWER
			&& metadata.composition === 'bounded-display-screen-blend'
			&& relativeDifference(
				baked.toneMapK,
				FIGURE1_DISPLAY_CONSTANTS.paperFigure1ToneMapK,
			) <= 1e-6,
		'V2 descriptor or shader differs from the independently pinned Color policy.',
	);
	return audit;
}

function auditColorIdentitySensitivity() {
	const create = ({
		sourceDerivedLocalLuminance = 0,
		sourceExposureCurve = SOURCE_EXPOSURE_CURVE,
		extraterrestrialDisplayHeadroom =
			DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM,
	} = {}) => new BrunetonExtraterrestrialVisibilityColorDisplayModel({
		displayConstants: FIGURE1_DISPLAY_CONSTANTS,
		sourceDerivedLocalLuminance,
		sourceExposureCurve,
		extraterrestrialDisplayHeadroom,
	});
	const base = create();
	const same = create();
	const variants = {
		sameEndpointGainDifferentSource: create({
			sourceDerivedLocalLuminance: SOURCE_EXPOSURE_CURVE.darkThreshold / 2,
		}),
		brightThreshold: create({
			sourceExposureCurve: {
				...SOURCE_EXPOSURE_CURVE,
				brightThreshold: SOURCE_EXPOSURE_CURVE.brightThreshold * 1.1,
			},
		}),
		darkThreshold: create({
			sourceExposureCurve: {
				...SOURCE_EXPOSURE_CURVE,
				darkThreshold: SOURCE_EXPOSURE_CURVE.darkThreshold / 2,
			},
		}),
		maximumExposureGain: create({
			sourceExposureCurve: {
				...SOURCE_EXPOSURE_CURVE,
				maximumExposureGain:
					SOURCE_EXPOSURE_CURVE.maximumExposureGain / 2,
			},
		}),
		headroom: create({
			extraterrestrialDisplayHeadroom:
				DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM - 0.01,
		}),
	};
	const baseDescriptor = base.describe();
	const sameDescriptor = same.describe();
	const variantFingerprints = Object.fromEntries(
		Object.entries(variants).map(([id, model]) => [id, model.describe().fingerprint]),
	);
	const audit = {
		baseFingerprint: baseDescriptor.fingerprint,
		sameConfigurationFingerprint: sameDescriptor.fingerprint,
		baseGain: base.exposureGain,
		sameEndpointGainDifferentSourceGain:
			variants.sameEndpointGainDifferentSource.exposureGain,
		variantFingerprints,
		sameConfigurationStable:
			baseDescriptor.fingerprint === sameDescriptor.fingerprint,
		allMaterialInputsChangeFingerprint: Object.values(variantFingerprints)
			.every((fingerprint) => fingerprint !== baseDescriptor.fingerprint),
	};
	requireCondition(
		audit.sameConfigurationStable,
		'Same V2 Color configuration changed fingerprint.',
	);
	requireCondition(
		base.exposureGain
			=== variants.sameEndpointGainDifferentSource.exposureGain,
		'Identity source-luminance control did not retain the same endpoint gain.',
	);
	requireCondition(
		audit.allMaterialInputsChangeFingerprint,
		'One V2 Color material input failed to change its fingerprint.',
	);
	return audit;
}

function normalizeCacheIdentity(identity) {
	return {
		backendCapabilitiesId: identity.backendCapabilitiesId,
		sourceFingerprint: identity.sourceFingerprint,
		atmosphereFingerprint: identity.atmosphereFingerprint,
		geometryFingerprint: identity.geometryFingerprint,
		boundaryContentHash: identity.boundaryContentHash,
		spectralContentHash: identity.spectralContentHash,
		maximumScatteringOrder: identity.maximumScatteringOrder,
	};
}

function cloneJson(value) {
	return value === undefined ? null : JSON.parse(JSON.stringify(value));
}

function normalizeNonColorAssemblyDescriptor(descriptor) {
	const spectralBasis = cloneJson(descriptor.spectralBasis);
	if (spectralBasis?.facts) delete spectralBasis.facts.version;
	if (spectralBasis) delete spectralBasis.fingerprint;
	const runtime = cloneJson(descriptor.runtime);
	if (runtime?.facts) delete runtime.facts.modelVersion;
	if (runtime) delete runtime.fingerprint;
	return {
		descriptorId: descriptor.descriptorId,
		compatibilityTags: descriptor.compatibilityTags,
		spectralBasis,
		geometry: descriptor.geometry,
		atmosphere: descriptor.atmosphere,
		lightSource: descriptor.lightSource,
		cache: descriptor.cache,
		transport: descriptor.transport,
		runtime,
	};
}

function normalizeBuildRecord(record) {
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
		zCount: record.zCount ?? null,
		rhoCount: record.rhoCount ?? null,
		maximumScatteringOrder: record.maximumScatteringOrder,
		planIdentity: record.planIdentity,
		planResult: record.planResult,
		fieldCount: record.fields.length,
		passCount: record.passes.length,
		passIds: record.passes.map((pass) => pass.id),
		probeScalarCount: record.probeScalarCount ?? 0,
	};
}

function requireCacheBuildRecord(lightSource, geometryKind) {
	requireCondition(
		lightSource.controlledBuildRecords.length === 1,
		`${geometryKind} must perform exactly one controlled cache build.`,
	);
	const record = lightSource.controlledBuildRecords[0];
	requireCondition(
		record.incomingDirectionCount === 68
			&& record.incomingDirectionDomainId
				=== 'contained-reflection-completed-fibonacci-68-incoming-control-v1'
			&& record.incomingDirectionDomainContentHash
				=== 'sha256:fb6ad49f2d8efa5561771c0b9282f64d80efdad69d330c23ebecee7c7b329cab',
		`${geometryKind} did not build with the pinned reflection-completed FIB68 domain.`,
	);
	if (geometryKind === 'spherical-distant') {
		requireCondition(
			record.domainSelectionId
				=== REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_SELECTION.id
				&& record.positionDomainId === 'algorithm32-native-48-position-v1'
				&& record.positionCount === 48,
			'Spherical build used the wrong controlled selection.',
		);
	} else {
		requireCondition(
			record.policy === CONTROLLED_LOCAL_SUN_FIBONACCI68_POLICY.id
				&& record.domainSelectionId
					=== 'contained-local-sun-z19-rho15-reflection-completed-fibonacci68-w27-control-v1'
				&& record.zCount === 19
				&& record.rhoCount === 15
				&& record.positionDomainId
					=== 'algorithm32-flat-local-z19-rho15-position-v3'
				&& record.positionCount === 285,
			'Flat/local build used the wrong controlled policy.',
		);
	}
	const expectedPlanId = geometryKind === 'spherical-distant'
		? 'algorithm32-distant-sun-cache-construction-v1'
		: 'algorithm32-local-sun-cache-construction-v3';
	const expectedPlanResult = geometryKind === 'spherical-distant'
		? 'distant-sun-j-through-4'
		: 'local-sun-j-through-4';
	requireCondition(
		record.maximumScatteringOrder === 4
			&& record.outgoingDirectionDomainId
				=== 'algorithm32-cubed-sphere-w27-outgoing-v1'
			&& record.outgoingDirectionCount === 4374
			&& record.planIdentity.id === expectedPlanId
			&& /^sha256:[a-f0-9]{64}$/u.test(record.planIdentity.contentHash),
		`${geometryKind} plan identity or scattering order changed.`,
	);
	requireCondition(
		record.planResult === expectedPlanResult
			&& record.fields.length === 10
			&& record.passes.length === 10,
		`${geometryKind} N4 cache graph changed.`,
	);
	return record;
}

function requireFlatTransportPacking({
	geometry,
	backend,
	buildRecord,
	gpuProof,
}) {
	const diagnostics = geometry.controlledTransportPackingDiagnostics;
	const moduleDiagnostics = geometry.controlledTransportModuleDiagnostics;
	requireCondition(
		Array.isArray(diagnostics) && diagnostics.length === 1,
		'Flat/local N4 build must publish one transport-packing derivation.',
	);
	requireCondition(
		Array.isArray(moduleDiagnostics) && moduleDiagnostics.length === 2,
		'Flat/local N4 build must replace exactly two transport modules.',
	);
	const diagnostic = diagnostics[0];
	const packing = diagnostic.packing;
	const logical = packing?.logical;
	const physical = packing?.physical;
	const capabilities = backend.capabilities;
	const policy = CONTROLLED_FLAT_FIBONACCI68_TRANSPORT_PACKING_POLICY;
	const expectedQueryCount =
		buildRecord.positionCount * buildRecord.incomingDirectionCount;
	const expectedColumnCount = 3;
	const expectedRowCount = expectedQueryCount / expectedColumnCount;
	const expectedSourceShape = [
		logical.tapCount * 3 * expectedColumnCount,
		expectedRowCount,
	];
	const expectedCoefficientShape = [
		logical.tapCount * expectedColumnCount,
		expectedRowCount,
		logical.wavelengthCount,
	];
	const expectedTransportPasses = [
		{id: 'local-sun-transport-j2-to-l2', kind: 'transport', order: 2},
		{id: 'local-sun-transport-j3-to-l3', kind: 'transport', order: 3},
	];
	const transportPasses = buildRecord.passes
		.filter((pass) => pass.kind === 'transport')
		.map(({id, kind, order}) => ({id, kind, order}));
	let addressBijectionMismatchCount = 0;
	for (let queryIndex = 0; queryIndex < expectedQueryCount; queryIndex += 1) {
		const column = queryIndex % expectedColumnCount;
		const row = Math.floor(queryIndex / expectedColumnCount);
		if (row * expectedColumnCount + column !== queryIndex) {
			addressBijectionMismatchCount += 1;
		}
	}
	const seamQueryIndices = [
		0,
		1,
		2,
		3,
		expectedQueryCount - 3,
		expectedQueryCount - 2,
		expectedQueryCount - 1,
	];
	const lastTapIndex = logical.tapCount - 1;
	const lastSourceComponentIndex = 2;
	const lastWavelengthIndex = logical.wavelengthCount - 1;
	const seamQueries = seamQueryIndices.map((queryIndex) => {
		const queryColumn = queryIndex % expectedColumnCount;
		const queryRow = Math.floor(queryIndex / expectedColumnCount);
		const sourceX = (
			queryColumn * logical.tapCount + lastTapIndex
		) * 3 + lastSourceComponentIndex;
		const coefficientX =
			queryColumn * logical.tapCount + lastTapIndex;
		const sourceLogicalOffset = (
			queryIndex * logical.tapCount + lastTapIndex
		) * 3 + lastSourceComponentIndex;
		const sourcePhysicalOffset =
			queryRow * physical.sources.shape[0] + sourceX;
		const coefficientLogicalOffset = (
			lastWavelengthIndex * expectedQueryCount + queryIndex
		) * logical.tapCount + lastTapIndex;
		const coefficientPhysicalOffset = (
			lastWavelengthIndex * physical.coefficients.shape[1] + queryRow
		) * physical.coefficients.shape[0] + coefficientX;
		return {
			queryIndex,
			queryColumn,
			queryRow,
			reconstructedQueryIndex:
				queryRow * expectedColumnCount + queryColumn,
			lastTapIndex,
			lastSourceComponentIndex,
			lastWavelengthIndex,
			sourceX,
			coefficientX,
			sourceLogicalOffset,
			sourcePhysicalOffset,
			coefficientLogicalOffset,
			coefficientPhysicalOffset,
		};
	});
	const geometryDescriptor = geometry.describe().controlledTransportPacking;
	const hashPattern = /^sha256:[a-f0-9]{64}$/u;
	const allPhysicalAxesWithinBackend = [
		physical.sources.shape[0],
		physical.sources.shape[1],
		physical.coefficients.shape[0],
		physical.coefficients.shape[1],
	].every((extent) => extent <= capabilities.maximumTextureSize)
		&& physical.coefficients.shape[2]
			<= capabilities.maximumArrayLayers;
	const moduleDiagnostic = moduleDiagnostics[0];
	const modulesMatch = moduleDiagnostics.every((entry) =>
		JSON.stringify(entry) === JSON.stringify(moduleDiagnostic));
	const mandatoryGpuPairs = [
		[0, 0],
		[1, 14],
		[2, 0],
		[3, 14],
		[expectedQueryCount - 1, 0],
	];
	const selectedGpuPairs = gpuProof?.probeSelection?.selectedPairs ?? [];
	const gpuTransportPasses = gpuProof?.transportPasses ?? [];
	const accepted = diagnostic.policyId === policy.id
		&& diagnostic.packingContentHash === packing.contentHash
		&& diagnostic.cacheDataReframingOperationId
			=== policy.cacheDataReframingOperationId
		&& diagnostic.sourceValuesSameObject === true
		&& diagnostic.coefficientValuesSameObject === true
		&& geometryDescriptor?.policyId === policy.id
		&& geometryDescriptor.maximumTextureSize
			=== capabilities.maximumTextureSize
		&& capabilities.maximumTextureSize === policy.maximumTextureSize
		&& capabilities.maximumArrayLayers >= 15
		&& geometryDescriptor.minimumQueryColumnCount
			=== expectedColumnCount
		&& packing.maximumTextureSize === capabilities.maximumTextureSize
		&& packing.minimumQueryColumnCount === expectedColumnCount
		&& logical.queryCount === expectedQueryCount
		&& expectedQueryCount === 19_380
		&& logical.wavelengthCount === 15
		&& logical.tapCount >= 1
		&& logical.tapCount <= policy.maximumLogicalTapCount
		&& physical.queryColumnCount === expectedColumnCount
		&& physical.queryRowCount === expectedRowCount
		&& expectedRowCount === 6_460
		&& physical.querySlotCount === expectedQueryCount
		&& physical.unusedQuerySlotCount === 0
		&& JSON.stringify(physical.sources.shape)
			=== JSON.stringify(expectedSourceShape)
		&& JSON.stringify(physical.coefficients.shape)
			=== JSON.stringify(expectedCoefficientShape)
		&& JSON.stringify(diagnostic.inputs.sources.shape)
			=== JSON.stringify(logical.sourceShape)
		&& JSON.stringify(diagnostic.inputs.coefficients.shape)
			=== JSON.stringify(logical.coefficientShape)
		&& JSON.stringify(diagnostic.outputs.sources.shape)
			=== JSON.stringify(expectedSourceShape)
		&& JSON.stringify(diagnostic.outputs.coefficients.shape)
			=== JSON.stringify(expectedCoefficientShape)
		&& physical.sources.scalarCount === logical.sourceScalarCount
		&& physical.coefficients.scalarCount
			=== logical.coefficientScalarCount
		&& physical.sources.paddingScalarCount === 0
		&& physical.coefficients.paddingScalarCount === 0
		&& physical.allTextureAxesWithinLimit === true
		&& allPhysicalAxesWithinBackend
		&& addressBijectionMismatchCount === 0
		&& seamQueries.every((query) =>
			query.reconstructedQueryIndex === query.queryIndex
				&& query.sourcePhysicalOffset === query.sourceLogicalOffset
				&& query.coefficientPhysicalOffset
					=== query.coefficientLogicalOffset)
		&& seamQueries.at(-1).sourcePhysicalOffset
			=== physical.sources.scalarCount - 1
		&& seamQueries.at(-1).coefficientPhysicalOffset
			=== physical.coefficients.scalarCount - 1
		&& hashPattern.test(diagnostic.contentHash)
		&& hashPattern.test(packing.contentHash)
		&& hashPattern.test(diagnostic.inputs.sources.contentHash)
		&& hashPattern.test(diagnostic.inputs.coefficients.contentHash)
		&& hashPattern.test(diagnostic.outputs.sources.contentHash)
		&& hashPattern.test(diagnostic.outputs.coefficients.contentHash)
		&& diagnostic.inputs.sources.scalarCount
			=== diagnostic.outputs.sources.scalarCount
		&& diagnostic.inputs.coefficients.scalarCount
			=== diagnostic.outputs.coefficients.scalarCount
		&& diagnostic.inputs.sources.contentHash
			!== diagnostic.outputs.sources.contentHash
		&& diagnostic.inputs.coefficients.contentHash
			!== diagnostic.outputs.coefficients.contentHash
		&& JSON.stringify(transportPasses)
			=== JSON.stringify(expectedTransportPasses)
		&& modulesMatch
		&& moduleDiagnostic.policyId === policy.id
		&& moduleDiagnostic.baseModule.id
			=== 'algorithm32-flat-earth-transport-module-v3'
		&& moduleDiagnostic.controlledModule.id
			=== 'contained-flat-earth-tiled-transport-module-v1'
		&& hashPattern.test(moduleDiagnostic.baseModule.contentHash)
		&& hashPattern.test(moduleDiagnostic.controlledModule.contentHash)
		&& moduleDiagnostic.baseModule.contentHash
			!== moduleDiagnostic.controlledModule.contentHash
		&& moduleDiagnostic.baseFetchBlockContentHash
			=== policy.baseTransportFetchBlockContentHash
		&& hashPattern.test(moduleDiagnostic.replacementFetchBlockContentHash)
		&& moduleDiagnostic.replacementFetchBlockContentHash
			!== moduleDiagnostic.baseFetchBlockContentHash
		&& moduleDiagnostic.pinnedBindingSpecsContentHash
			=== policy.baseTransportBindingSpecsContentHash
		&& moduleDiagnostic.queryColumnCount === expectedColumnCount
		&& moduleDiagnostic.untouchedBlockCount === 0
		&& moduleDiagnostic.untouchedBindingCount === 3
		&& hashPattern.test(moduleDiagnostic.contentHash)
		&& gpuProof?.schemaId
			=== 'flat-fibonacci68-packed-transport-gpu-proof-v1'
		&& gpuProof.accepted === true
		&& hashPattern.test(gpuProof.contentHash)
		&& JSON.stringify(gpuProof.planIdentity)
			=== JSON.stringify(buildRecord.planIdentity)
		&& gpuProof.controlledModule.instanceCount === 2
		&& gpuProof.controlledModule.id
			=== moduleDiagnostic.controlledModule.id
		&& gpuProof.controlledModule.contentHash
			=== moduleDiagnostic.controlledModule.contentHash
		&& gpuProof.transportData.tapCount === logical.tapCount
		&& gpuProof.transportData.queryColumnCount === expectedColumnCount
		&& gpuProof.transportData.sources.id
			=== diagnostic.outputs.sources.id
		&& gpuProof.transportData.sources.contentHash
			=== diagnostic.outputs.sources.contentHash
		&& JSON.stringify(gpuProof.transportData.sources.shape)
			=== JSON.stringify(expectedSourceShape)
		&& gpuProof.transportData.coefficients.id
			=== diagnostic.outputs.coefficients.id
		&& gpuProof.transportData.coefficients.contentHash
			=== diagnostic.outputs.coefficients.contentHash
		&& JSON.stringify(gpuProof.transportData.coefficients.shape)
			=== JSON.stringify(expectedCoefficientShape)
		&& buildRecord.probeScalarCount
			=== gpuProof.probeSelection.probeScalarCount
		&& gpuProof.probeSelection.probeScalarCount > 0
		&& gpuProof.probeSelection.probeScalarCount <= 4_096
		&& mandatoryGpuPairs.every(([queryIndex, wavelengthIndex]) =>
			selectedGpuPairs.some((pair) =>
				pair.queryIndex === queryIndex
					&& pair.wavelengthIndex === wavelengthIndex))
		&& JSON.stringify(gpuTransportPasses.map((pass) => pass.id))
			=== JSON.stringify(['j2-to-l2', 'j3-to-l3'])
		&& gpuTransportPasses.every((pass) =>
			pass.accepted === true
				&& pass.pairCount === selectedGpuPairs.length
				&& pass.nonzeroPairCount === pass.pairCount
				&& Number.isFinite(pass.maximumAbsoluteError)
				&& Number.isFinite(pass.maximumRelativeError)
				&& Number.isFinite(pass.maximumTolerance)
				&& pass.maximumAbsoluteError <= pass.maximumTolerance);
	requireCondition(
		accepted,
		`Flat/local FIB68 transport packing or live packed GPU dot-product proof failed: ${JSON.stringify({diagnostic, moduleDiagnostics, gpuProof, capabilities, addressBijectionMismatchCount, seamQueries, transportPasses})}`,
	);
	return {
		accepted,
		policy:
			'All 19,380 logical FIB68 transport queries and every tap/channel scalar are retained under one identity-bound three-column physical texture address map, and both live N4 transport passes reproduce their selected packed dot products.',
		geometryDescriptor,
		backendCapabilities: {
			maximumTextureSize: capabilities.maximumTextureSize,
			maximumArrayLayers: capabilities.maximumArrayLayers,
		},
		diagnostic,
		moduleDiagnostics,
		transportPasses,
		gpuProof,
		addressBijectionMismatchCount,
		seamQueries,
		allPhysicalAxesWithinBackend,
	};
}

function requireReusedPhysics({
	handle,
	lightSource,
	geometryKind,
	controlController,
	controlCache,
	controlIdentity,
	controlCelestialController,
	controlCelestialCache,
	controlCelestialIdentity,
	controlAssemblyDescriptor,
	controlBuildRecord,
}) {
	const candidateBuild = handle._buildResult;
	const candidateRecord = requireCacheBuildRecord(lightSource, geometryKind);
	const candidateIdentity = normalizeCacheIdentity(candidateBuild.cacheIdentity);
	const sameControllerObject =
		candidateBuild.cacheController === controlController;
	const sameCacheObject = candidateBuild.cache === controlCache;
	const sameCacheIdentity =
		JSON.stringify(candidateIdentity) === JSON.stringify(controlIdentity);
	const samePlanIdentity =
		JSON.stringify(candidateRecord.planIdentity)
			=== JSON.stringify(controlBuildRecord.planIdentity);
	const sameCelestialControllerObject =
		candidateBuild.celestialCacheController === controlCelestialController;
	const sameCelestialCacheObject =
		candidateBuild.celestialCache === controlCelestialCache;
	const sameCelestialCacheIdentity = JSON.stringify(
		cloneJson(candidateBuild.celestialCacheIdentity),
	) === JSON.stringify(cloneJson(controlCelestialIdentity));
	const controlNonColorDescriptor = normalizeNonColorAssemblyDescriptor(
		controlAssemblyDescriptor,
	);
	const candidateNonColorDescriptor = normalizeNonColorAssemblyDescriptor(
		candidateBuild.assembly.descriptor,
	);
	const sameNonColorAssemblyDescriptor = JSON.stringify(
		candidateNonColorDescriptor,
	) === JSON.stringify(controlNonColorDescriptor);
	const controlModelVersion =
		controlAssemblyDescriptor.spectralBasis.facts.version;
	const candidateModelVersion =
		candidateBuild.assembly.descriptor.spectralBasis.facts.version;
	const expectedModelVersionTransition =
		Number.isInteger(controlModelVersion)
			&& candidateModelVersion === controlModelVersion + 1
			&& controlAssemblyDescriptor.runtime.facts.modelVersion
				=== controlModelVersion
			&& candidateBuild.assembly.descriptor.runtime.facts.modelVersion
				=== candidateModelVersion
			&& controlAssemblyDescriptor.variantId
				=== `model-v${controlModelVersion}`
			&& candidateBuild.assembly.descriptor.variantId
				=== `model-v${candidateModelVersion}`;
	if (geometryKind === 'flat-local') {
		requireCondition(
			controlCelestialController !== null
				&& controlCelestialController !== undefined
				&& controlCelestialCache !== null
				&& controlCelestialCache !== undefined
				&& controlCelestialIdentity !== null
				&& controlCelestialIdentity !== undefined,
			'Flat/local finite-Sun celestial cache is not live.',
		);
	}
	const reuseChecks = {
		sameControllerObject,
		sameCacheObject,
		sameCacheIdentity,
		samePlanIdentity,
		sameCelestialControllerObject,
		sameCelestialCacheObject,
		sameCelestialCacheIdentity,
		sameNonColorAssemblyDescriptor,
		expectedModelVersionTransition,
	};
	requireCondition(
		Object.values(reuseChecks).every(Boolean),
		`${geometryKind} left/right renders did not reuse identical cache physics: ${JSON.stringify(reuseChecks)}`,
	);
	return {
		policy:
			'same Algorithm32ShaderHandle; Color-only setConfig; previous cache/controller preserved by object identity',
		...reuseChecks,
		controlModelVersion,
		candidateModelVersion,
		controlCacheIdentity: controlIdentity,
		candidateCacheIdentity: candidateIdentity,
		controlCelestialCacheIdentity: cloneJson(controlCelestialIdentity),
		candidateCelestialCacheIdentity:
			cloneJson(candidateBuild.celestialCacheIdentity),
		controlNonColorAssemblyDescriptor: controlNonColorDescriptor,
		candidateNonColorAssemblyDescriptor: candidateNonColorDescriptor,
		controlPlanIdentity: controlBuildRecord.planIdentity,
		candidatePlanIdentity: candidateRecord.planIdentity,
		buildRecordCount: lightSource.controlledBuildRecords.length,
		buildRecord: normalizeBuildRecord(candidateRecord),
	};
}

function assertColorDescriptorAndAssembly(color, assembly) {
	const descriptor = color.describe();
	const assembledSection = assembly.descriptor.color;
	requireCondition(
		assembledSection.descriptorId === 'color'
			&& JSON.stringify(assembledSection.compatibilityTags)
				=== JSON.stringify(['display-color'])
			&& assembledSection.facts.fingerprint === descriptor.fingerprint
			&& JSON.stringify(assembledSection.facts)
				=== JSON.stringify(descriptor),
		'Assembled Color facts differ from the configured Color descriptor.',
	);
	return descriptor;
}

function deriveLocalRadiometricCalibration(fixture) {
	const radiusMeters = fixture.source.radiusMeters;
	const distances = fixture.source.surfaceRadianceValues.map(
		(surfaceRadiance, channel) => radiusMeters * Math.sqrt(
			Math.PI * surfaceRadiance
				/ NATIVE_SOURCE_IRRADIANCE_DENSITY.values[channel],
		),
	);
	const referenceDistanceMeters = distances.reduce(
		(sum, value) => sum + value,
		0,
	) / distances.length;
	const maximumRelativeDistanceSpread = Math.max(...distances.map(
		(value) => relativeDifference(value, referenceDistanceMeters),
	));
	const projectedSolidAngleSteradians = Math.PI
		* (radiusMeters / referenceDistanceMeters) ** 2;
	const reconstructedSurfaceRadiance =
		NATIVE_SOURCE_IRRADIANCE_DENSITY.values.map(
			(value) => value / projectedSolidAngleSteradians,
		);
	const maximumRelativeSurfaceRadianceError = Math.max(
		...reconstructedSurfaceRadiance.map((value, channel) =>
			relativeDifference(
				value,
				fixture.source.surfaceRadianceValues[channel],
			)),
	);
	requireCondition(
		maximumRelativeDistanceSpread
			<= GATES.localRadiometricCalibrationRelativeTolerance
			&& maximumRelativeSurfaceRadianceError
				<= GATES.localRadiometricCalibrationRelativeTolerance,
		'Flat/local fixture cannot be represented by one native-source reference distance.',
	);
	return {
		policy:
			'E_ref(lambda)=L_surface(lambda)*pi*(radius/referenceDistance)^2 with one spectrally common derived reference distance',
		referenceDistanceMeters,
		projectedSolidAngleSteradians,
		maximumRelativeDistanceSpread,
		maximumRelativeSurfaceRadianceError,
		reconstructedSurfaceRadiance,
	};
}

function rayIntersectsSphere(origin, direction, center, radius) {
	const offsetX = origin[0] - center[0];
	const offsetY = origin[1] - center[1];
	const offsetZ = origin[2] - center[2];
	const b = offsetX * direction[0]
		+ offsetY * direction[1]
		+ offsetZ * direction[2];
	const c = offsetX ** 2 + offsetY ** 2 + offsetZ ** 2 - radius ** 2;
	const discriminant = b ** 2 - c;
	if (discriminant < 0) return false;
	const root = Math.sqrt(Math.max(discriminant, 0));
	const nearDistance = -b - root;
	const farDistance = -b + root;
	const entryDistance = nearDistance >= 0 ? nearDistance : farDistance;
	return entryDistance >= 0;
}

function deriveFlatFiniteDiskSupportMask({
	camera,
	width,
	height,
	observerMeters,
	sourceCenterMeters,
	radiusMeters,
}) {
	const supportIndices = [];
	const clip = new THREE.Vector4();
	const sceneDirection = new THREE.Vector3();
	for (let yTop = 0; yTop < height; yTop += 1) {
		const yBottom = height - 1 - yTop;
		for (let x = 0; x < width; x += 1) {
			let supported = false;
			for (const [offsetX, offsetY] of FLAT_FINITE_DISK_SAMPLE_OFFSETS) {
				const u = Math.max(0, Math.min(
					1,
					(x + 0.5 + offsetX) / width,
				));
				const v = Math.max(0, Math.min(
					1,
					(yBottom + 0.5 + offsetY) / height,
				));
				clip.set(u * 2 - 1, v * 2 - 1, 1, 1)
					.applyMatrix4(camera.projectionMatrixInverse);
				const inverseW = 1 / Math.max(clip.w, 0.000001);
				sceneDirection.set(
					clip.x * inverseW,
					clip.y * inverseW,
					clip.z * inverseW,
				).normalize().transformDirection(camera.matrixWorld);
				const modelDirection = [
					sceneDirection.x,
					-sceneDirection.z,
					sceneDirection.y,
				];
				if (rayIntersectsSphere(
					observerMeters,
					modelDirection,
					sourceCenterMeters,
					radiusMeters,
				)) {
					supported = true;
					break;
				}
			}
			if (supported) supportIndices.push(yTop * width + x);
		}
	}
	return {
		policy:
			'complete conservative four-subsample finite-disk support: exact shader sample offsets and ray/sphere support, with scene occlusion deliberately ignored so the mask is a superset',
		sampleOffsetsPixels: FLAT_FINITE_DISK_SAMPLE_OFFSETS,
		frameMapping: 'scene [x,y,z] -> Flat model [x,-z,y]',
		supportIndices,
	};
}

async function renderSphericalPair({
	fixture,
	geometryConfiguration,
	sceneSpec,
	product,
	historicalControl,
}) {
	const width = fixture.camera.widthPixels;
	const height = fixture.camera.heightPixels;
	const productFacts = requireProductMatchesScene({
		key: sceneSpec.id,
		product,
		sceneSpec,
		camera: fixture.camera,
	});
	const historicalReference = requireHistoricalBrunetonControl(
		historicalControl,
		sceneSpec.id,
		'spherical-distant',
	);
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('webgl2', {
		antialias: false,
		preserveDrawingBuffer: true,
	});
	requireCondition(context, 'WebGL2 is unavailable for a spherical pair.');
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
	configureSphericalCamera(camera, sceneSpec, fixture.camera.observerHeightMeters);
	const directionToSun = directionFromUpEastNorth(
		sceneSpec.directionToSourceUpEastNorth,
	);
	const geometry = new SphericalEarthGeometry({
		...geometryConfiguration,
		observerHeight: distance(fixture.camera.observerHeightMeters),
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
	const lightSource = new ControlledDistantSunLightSource({
		directionToLight: directionToSun.toArray(),
		sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
		angularRadius: {
			value: NATIVE_SUN_ANGULAR_RADIUS_RADIANS,
			units: 'radians',
		},
	}, {
		domainSelection: REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_SELECTION,
	});
	const celestial = new ScreenPaletteCelestialRuntimeParticipant({
		identity: product.identity,
	});
	const receiverPosition = position([
		0,
		0,
		geometryConfiguration.bottomRadius.value
			+ fixture.camera.observerHeightMeters,
	]);
	const sourcePath = geometry.resolveAtmospherePath({
		ray: {origin: receiverPosition, direction: directionToSun.toArray()},
	});
	const sourceTransport = atmosphere.integrateOpticalDepth(sourcePath);
	const sourceLight = deriveSourceLocalLuminance({
		incidentIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY.values,
		transmittance: sourceTransport.transmittance.values,
	});
	const controlColor = new BrunetonColorDisplayModel({
		displayConstants: FIGURE1_DISPLAY_CONSTANTS,
	});
	const candidateColor = new BrunetonExtraterrestrialVisibilityColorDisplayModel({
		displayConstants: FIGURE1_DISPLAY_CONSTANTS,
		sourceDerivedLocalLuminance: sourceLight.luminanceCdPerSquareMeter,
		sourceExposureCurve: SOURCE_EXPOSURE_CURVE,
	});
	const commonConfig = {
		geometry,
		atmosphere,
		lightSource,
		celestial,
		spectral: NATIVE_15_SPECTRAL_BASIS,
		execution: {maximumScatteringOrder: 4},
	};
	const algorithm = new Algorithm32({...commonConfig, color: controlColor});
	const textures = createProductTextures(product);
	const bindingValues = {
		'geometry.inverseProjectionMatrix':
			camera.projectionMatrixInverse.clone(),
		'geometry.inverseViewMatrix': camera.matrixWorld.clone(),
		'geometry.cameraWorldPosition': new THREE.Vector3(
			0,
			0,
			geometryConfiguration.bottomRadius.value
				+ fixture.camera.observerHeightMeters,
		),
		'geometry.cameraGroundRelativePosition': new THREE.Vector3(
			0,
			0,
			fixture.camera.observerHeightMeters,
		),
		'light.directionToAtmosphericSource': directionToSun,
		[SCREEN_PALETTE_MATRIX_VALUE_KEY]: textures.matrix,
		[SCREEN_PALETTE_VALUES_VALUE_KEY]: textures.palette,
	};
	const webglStageLedger = [];
	let handle;
	try {
		captureWebglStage({
			context,
			label: sceneSpec.id,
			stage: 'initialized-before-setup-shader',
			ledger: webglStageLedger,
		});
		handle = await algorithm.setupShader({
			THREE,
			composer,
			scene,
			camera,
			viewportSize: {width, height, units: 'pixels'},
			cacheBackend: backend,
			sceneScale: {value: 1, units: 'meters-per-scene-unit'},
			sceneDepthMax: distance(300000),
			bindingValues,
		});
		captureWebglStage({
			context,
			label: sceneSpec.id,
			stage: 'control-after-setup-shader',
			ledger: webglStageLedger,
		});
		await handle.prepare(renderer);
		captureWebglStage({
			context,
			label: sceneSpec.id,
			stage: 'control-after-prepare',
			ledger: webglStageLedger,
		});
		composer.render();
		captureWebglStage({
			context,
			label: sceneSpec.id,
			stage: 'control-after-render',
			ledger: webglStageLedger,
		});
		const controlPngDataUrl = canvas.toDataURL('image/png');
		const controlBuild = handle._buildResult;
		const controlRuntimeHealth = captureRuntimeHealth({
			context,
			renderer,
			handle,
			label: `${sceneSpec.id} Bruneton control`,
			expectedSourceHash: controlBuild.assembly.sourceHash,
			webglStageLedger,
		});
		const controlController = controlBuild.cacheController;
		const controlCache = controlBuild.cache;
		const controlIdentity = normalizeCacheIdentity(controlBuild.cacheIdentity);
		const controlCelestialController = controlBuild.celestialCacheController;
		const controlCelestialCache = controlBuild.celestialCache;
		const controlCelestialIdentity = controlBuild.celestialCacheIdentity;
		const controlAssemblyDescriptor = controlBuild.assembly.descriptor;
		const controlBuildRecord = requireCacheBuildRecord(
			lightSource,
			'spherical-distant',
		);
		const controlDescriptor = assertColorDescriptorAndAssembly(
			controlColor,
			controlBuild.assembly,
		);
		const controlShaderAudit = auditControlShader(
			controlBuild.assembly.fragmentShaderSource,
		);
		requireCondition(
			controlColor.id === 'bruneton-figure1-display'
				&& controlShaderAudit.brunetonConstants
				&& relativeDifference(
					controlShaderAudit.bakedToneMapK,
					FIGURE1_DISPLAY_CONSTANTS.paperFigure1ToneMapK,
				) <= 1e-6
				&& controlShaderAudit.baseInvocationCount === 1
				&& controlShaderAudit.v2InvocationCount === 0,
			'Spherical control is not unchanged Bruneton.',
		);

		await handle.setConfig({...commonConfig, color: candidateColor});
		captureWebglStage({
			context,
			label: sceneSpec.id,
			stage: 'candidate-after-set-config',
			ledger: webglStageLedger,
		});
		const candidateBuild = handle._buildResult;
		const cacheReuse = requireReusedPhysics({
			handle,
			lightSource,
			geometryKind: 'spherical-distant',
			controlController,
			controlCache,
			controlIdentity,
			controlCelestialController,
			controlCelestialCache,
			controlCelestialIdentity,
			controlAssemblyDescriptor,
			controlBuildRecord,
		});
		const candidateDescriptor = assertColorDescriptorAndAssembly(
			candidateColor,
			candidateBuild.assembly,
		);
		requireCondition(
			candidateDescriptor.fingerprint !== controlDescriptor.fingerprint,
			'Spherical Color-only transition retained the Bruneton fingerprint.',
		);
		const candidateShader = candidateBuild.assembly.fragmentShaderSource;
		const candidateShaderAudit = auditCandidateShader(
			candidateShader,
			candidateDescriptor,
			{
				sourceDerivedLocalLuminance:
					sourceLight.luminanceCdPerSquareMeter,
				exposureGain: candidateColor.exposureGain,
			},
		);
		const transportAudit = {
			screenPalette: candidateShader.includes(
				'evaluateScreenPaletteCelestialRadiance',
			),
			singleBoundaryTransmittanceExpression: (
				candidateShader.match(
					/state\.transmittance\.c\[channelIndex\] \* boundaryRadiance\.c\[channelIndex\]/gu,
				) ?? []
			).length,
			cumulativeAtmosphere: candidateShader.includes(
				'sampleCumulativeScatteringDensity',
			),
		};
		requireCondition(
			transportAudit.screenPalette
				&& transportAudit.singleBoundaryTransmittanceExpression === 1
				&& transportAudit.cumulativeAtmosphere,
			'Spherical atmosphere/external transport ownership changed.',
		);
		await handle.prepare(renderer);
		captureWebglStage({
			context,
			label: sceneSpec.id,
			stage: 'candidate-after-prepare',
			ledger: webglStageLedger,
		});
		composer.render();
		captureWebglStage({
			context,
			label: sceneSpec.id,
			stage: 'candidate-after-render',
			ledger: webglStageLedger,
		});
		const candidatePngDataUrl = canvas.toDataURL('image/png');
		const candidateRuntimeHealth = captureRuntimeHealth({
			context,
			renderer,
			handle,
			label: `${sceneSpec.id} visibility candidate`,
			expectedSourceHash: candidateBuild.assembly.sourceHash,
			webglStageLedger,
		});
		textures.matrix.image.data.fill(0);
		textures.matrix.needsUpdate = true;
		composer.render();
		captureWebglStage({
			context,
			label: sceneSpec.id,
			stage: 'zero-celestial-after-render',
			ledger: webglStageLedger,
		});
		const zeroCelestialPngDataUrl = canvas.toDataURL('image/png');
		const zeroCelestialRuntimeHealth = captureRuntimeHealth({
			context,
			renderer,
			handle,
			label: `${sceneSpec.id} same-Color zero-celestial diagnostic`,
			expectedSourceHash: candidateBuild.assembly.sourceHash,
			webglStageLedger,
		});
		textures.matrix.image.data.set(product.pixelIndex);
		textures.matrix.needsUpdate = true;
		const [
			controlImage,
			candidateImage,
			zeroCelestialImage,
			historicalControlImage,
		] = await Promise.all([
			decodeImage(controlPngDataUrl),
			decodeImage(candidatePngDataUrl),
			decodeImage(zeroCelestialPngDataUrl),
			decodeImage(historicalReference.url),
		]);
		const nonCelestial = (pixel) => product.pixelIndex[pixel] === 0;
		const nonCelestialParity = compareMaskedImages(
			candidateImage,
			controlImage,
			nonCelestial,
		);
		const zeroCelestialOutsideSupportParity = compareMaskedImages(
			candidateImage,
			zeroCelestialImage,
			nonCelestial,
		);
		const historicalBrunetonDrift = {
			policy:
				sceneSpec.id === 'sunset-plus-one-hour'
					? 'fresh live FIB68 Bruneton versus immutable historical Bruneton RGB bytes over the complete frame for owner review of the corrected lobe'
					: 'fresh live FIB68 Bruneton versus immutable historical Bruneton RGB bytes outside the exact screen-palette celestial-support mask',
			reference: historicalReference,
			...classifyHistoricalBrunetonDrift(sceneSpec.id),
			metrics: compareMaskedImages(
				controlImage,
				historicalControlImage,
				sceneSpec.id === 'sunset-plus-one-hour'
					? () => true
					: nonCelestial,
			),
		};
		requireCondition(
			nonCelestialParity.maximumAbsoluteChannelDifference
				<= GATES.nonCelestialMaximumByteDifference
				&& zeroCelestialOutsideSupportParity.maximumAbsoluteChannelDifference
					<= GATES.nonCelestialMaximumByteDifference,
			`${sceneSpec.id} changed a noncelestial Bruneton byte.`,
		);
		const candidateStars = summarizeStellarImage(
			candidateImage,
			zeroCelestialImage,
			product,
		);
		const sunEntryUplift = summarizeSunEntryUplift(
			candidateImage,
			zeroCelestialImage,
			product,
		);
		const imageHealth = {
			control: summarizeImageHealth(controlImage),
			candidate: summarizeImageHealth(candidateImage),
			zeroCelestial: summarizeImageHealth(zeroCelestialImage),
		};
		const pairPngDataUrl = await makePair({
			leftUrl: controlPngDataUrl,
			rightUrl: candidatePngDataUrl,
			leftLabel: `Bruneton - ${sceneSpec.timeLabel}`,
			rightLabel: `Extraterrestrial visibility - ${sceneSpec.timeLabel}`,
		});
		return {
			id: sceneSpec.id,
			kind: 'spherical-distant',
			location: 'San Jose',
			timeLabel: sceneSpec.timeLabel,
			timeIso: sceneSpec.timeIso,
			viewAzimuthDegrees: sceneSpec.viewAzimuthDegrees,
			viewElevationDegrees: sceneSpec.viewElevationDegrees,
			product: productFacts,
			sourceLight: {
				contractId: SOURCE_DERIVED_LOCAL_LUMINANCE_CONTRACT_ID,
				...sourceLight,
				blockedByGround: sourceTransport.blockedByGround,
				exposureCurve: SOURCE_EXPOSURE_CURVE,
				exposureGain: candidateColor.exposureGain,
			},
			color: {
				controlId: controlColor.id,
				candidateId: candidateColor.id,
				controlDescriptor,
				candidateDescriptor,
				controlShaderAudit,
				candidateShaderAudit,
			},
			cacheReuse,
			transportAudit,
			celestialSupport: {
				policy: 'exact screen-palette matrix entry != 0',
				pixelCount: product.pixelIndex.reduce(
					(count, entry) => count + Number(entry !== 0),
					0,
				),
				stellarPixelCount: candidateStars.eligibleCount,
				sunPixelCount: product.pixelIndex.reduce(
					(count, entry) => count + Number(
						entry >= product.stellarPaletteEntryCount,
					),
					0,
				),
			},
			analysis: {
				nonCelestialParity,
				zeroCelestialOutsideSupportParity,
				historicalBrunetonDrift,
				candidateStars,
				sunEntryUplift,
				imageHealth,
			},
			runtimeHealth: {
				control: controlRuntimeHealth,
				candidate: candidateRuntimeHealth,
				zeroCelestial: zeroCelestialRuntimeHealth,
			},
			webglErrors: [
				...controlRuntimeHealth.webglErrors,
				...candidateRuntimeHealth.webglErrors,
				...zeroCelestialRuntimeHealth.webglErrors,
			],
			programDiagnostics: candidateRuntimeHealth.programDiagnostics,
			sceneInputCaptureFrameCount:
				candidateRuntimeHealth.sceneInputCaptureFrameCount,
			controlPngDataUrl,
			candidatePngDataUrl,
			zeroCelestialPngDataUrl,
			pairPngDataUrl,
		};
	} finally {
		handle?.dispose();
		textures.matrix.dispose();
		textures.palette.dispose();
		scene.remove(...reviewBoxes, ...endpoints.visualObjects);
		for (const object of [...reviewBoxes, ...endpoints.visualObjects]) {
			object.geometry?.dispose?.();
			object.material?.dispose?.();
		}
		algorithm.dispose();
		composer.dispose();
		backend.dispose();
		renderer.dispose();
	}
}

async function renderFlatPair({
	fixture,
	stateId,
	calibration,
	historicalControl,
}) {
	const state = fixture.states.find((candidate) => candidate.id === stateId);
	requireCondition(state, `Unsupported Flat/local state: ${stateId}`);
	const historicalReference = requireHistoricalBrunetonControl(
		historicalControl,
		stateId,
		'flat-local',
	);
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
	requireCondition(context, 'WebGL2 is unavailable for a Flat/local pair.');
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
	const geometry = new ControlledFlatEarthFibonacci68TransportGeometry({
		observerPosition: position([0, 0, 5]),
		sourcePosition: position(source.centerMeters),
		topAltitude: distance(fixture.geometry.topAltitudeMeters),
		cacheRadialMaximum: distance(state.cacheRadialMaximumMeters),
		sceneSkyRayLimit: distance(fixture.geometry.observerDomeMaxViewRayMeters),
		observerCenteredDome: {
			centerPolicy: 'observer-centered',
			apexAltitude: distance(fixture.geometry.observerDomeApexMeters),
			maxObserverViewRayExtent: distance(
				fixture.geometry.observerDomeMaxViewRayMeters,
			),
		},
	}, {
		maximumTextureSize: backend.capabilities.maximumTextureSize,
		minimumQueryColumnCount:
			CONTROLLED_FLAT_FIBONACCI68_TRANSPORT_PACKING_POLICY
				.minimumQueryColumnCount,
	});
	const radiance = createSpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
		units: SPECTRAL_UNITS.RADIANCE_DENSITY,
		values: source.surfaceRadianceValues,
		provenanceIdentity:
			'union-glacier-flat-local-final-fibonacci68-radiance-v1',
	});
	const transportGpuProbe = createFlatFibonacci68TransportGpuProbe();
	const lightSource = new ControlledLocalSunLightSource({
		sourceKey: source.sourceId,
		position: geometry.configuration.sourcePosition,
		sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
		referenceDistance: distance(calibration.referenceDistanceMeters),
		referenceSpectralIncidentScale: 1,
		radius: distance(source.radiusMeters),
		distanceFalloff: true,
	}, {
		probeFactory: transportGpuProbe.probeFactory,
	});
	const celestialSource = new FiniteLocalSunCelestialSource({
		sourceId: source.sourceId,
		radius: distance(source.radiusMeters),
		surfaceRadiance: radiance,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const celestial = new CelestialRuntimeParticipant({
		sources: [celestialSource],
		primarySourceId: source.sourceId,
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
		ray: {origin: position(observerMeters), direction: directionToSource},
		endDistance: distance(sourceDistanceMeters - source.radiusMeters),
	});
	const sourceTransport = atmosphere.integrateOpticalDepth(sourcePath);
	const incident = deriveFiniteSourceIncidentIrradiance({
		surfaceRadiance: source.surfaceRadianceValues,
		radiusMeters: source.radiusMeters,
		distanceMeters: sourceDistanceMeters,
	});
	const controlledIncident = NATIVE_SOURCE_IRRADIANCE_DENSITY.values.map(
		(value) => value
			* (calibration.referenceDistanceMeters / sourceDistanceMeters) ** 2,
	);
	const maximumIncidentRelativeDifference = Math.max(
		...incident.values.map((value, channel) => relativeDifference(
			value,
			controlledIncident[channel],
		)),
	);
	requireCondition(
		maximumIncidentRelativeDifference
			<= GATES.localRadiometricCalibrationRelativeTolerance,
		`${stateId} controlled local source differs from the fixture radiometry.`,
	);
	const sourceLight = deriveSourceLocalLuminance({
		incidentIrradiance: incident.values,
		transmittance: sourceTransport.transmittance.values,
	});
	const controlColor = new BrunetonColorDisplayModel({
		displayConstants: FIGURE1_DISPLAY_CONSTANTS,
	});
	const candidateColor = new BrunetonExtraterrestrialVisibilityColorDisplayModel({
		displayConstants: FIGURE1_DISPLAY_CONSTANTS,
		sourceDerivedLocalLuminance: sourceLight.luminanceCdPerSquareMeter,
		sourceExposureCurve: SOURCE_EXPOSURE_CURVE,
	});
	const commonConfig = {
		geometry,
		atmosphere,
		lightSource,
		celestial,
		spectral: NATIVE_15_SPECTRAL_BASIS,
		execution: {maximumScatteringOrder: 4},
	};
	const algorithm = new Algorithm32({...commonConfig, color: controlColor});
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
		sceneScale: {value: sceneScaleMeters, units: 'meters-per-scene-unit'},
		groundExtent: distance(groundExtentMeters),
		widthSegments: 96,
		heightSegments: 96,
		visualMaterialColor: fixture.groundColorHex,
		visualMaterialLighting: 'lambert',
	});
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
		'geometry.cameraWorldPosition': new THREE.Vector3(...observerMeters),
		'geometry.sceneTermination': distance(0),
		'geometry.sceneDepthMax': geometry.resolveSceneDepthMax({
			groundExtent: distance(groundExtentMeters),
		}),
		'geometry.flatFiniteSun.centerMeters': new THREE.Vector3(
			...source.centerMeters,
		),
	};
	const supportMask = deriveFlatFiniteDiskSupportMask({
		camera,
		width,
		height,
		observerMeters,
		sourceCenterMeters: source.centerMeters,
		radiusMeters: source.radiusMeters,
	});
	const webglStageLedger = [];
	let handle;
	try {
		captureWebglStage({
			context,
			label: stateId,
			stage: 'initialized-before-setup-shader',
			ledger: webglStageLedger,
		});
		handle = await algorithm.setupShader({
			THREE,
			composer,
			scene,
			camera,
			viewportSize: {width, height, units: 'pixels'},
			cacheBackend: backend,
			sceneScale: {value: sceneScaleMeters, units: 'meters-per-scene-unit'},
			bindingValues: bindings,
		});
		captureWebglStage({
			context,
			label: stateId,
			stage: 'control-after-setup-shader',
			ledger: webglStageLedger,
		});
		await handle.prepare(renderer);
		captureWebglStage({
			context,
			label: stateId,
			stage: 'control-after-prepare',
			ledger: webglStageLedger,
		});
		composer.render();
		captureWebglStage({
			context,
			label: stateId,
			stage: 'control-after-render',
			ledger: webglStageLedger,
		});
		const controlPngDataUrl = canvas.toDataURL('image/png');
		const controlBuild = handle._buildResult;
		const controlRuntimeHealth = captureRuntimeHealth({
			context,
			renderer,
			handle,
			label: `${stateId} Bruneton control`,
			expectedSourceHash: controlBuild.assembly.sourceHash,
			webglStageLedger,
		});
		const controlController = controlBuild.cacheController;
		const controlCache = controlBuild.cache;
		const controlIdentity = normalizeCacheIdentity(controlBuild.cacheIdentity);
		const controlCelestialController = controlBuild.celestialCacheController;
		const controlCelestialCache = controlBuild.celestialCache;
		const controlCelestialIdentity = controlBuild.celestialCacheIdentity;
		const controlAssemblyDescriptor = controlBuild.assembly.descriptor;
		const controlBuildRecord = requireCacheBuildRecord(
			lightSource,
			'flat-local',
		);
		const transportGpuProof = transportGpuProbe.evaluateDiagnostics(
			controlBuildRecord.diagnostics,
		);
		const transportPacking = requireFlatTransportPacking({
			geometry,
			backend,
			buildRecord: controlBuildRecord,
			gpuProof: transportGpuProof,
		});
		const controlDescriptor = assertColorDescriptorAndAssembly(
			controlColor,
			controlBuild.assembly,
		);
		const controlShaderAudit = auditControlShader(
			controlBuild.assembly.fragmentShaderSource,
		);
		requireCondition(
			controlColor.id === 'bruneton-figure1-display'
				&& controlShaderAudit.brunetonConstants
				&& relativeDifference(
					controlShaderAudit.bakedToneMapK,
					FIGURE1_DISPLAY_CONSTANTS.paperFigure1ToneMapK,
				) <= 1e-6
				&& controlShaderAudit.baseInvocationCount === 1
				&& controlShaderAudit.v2InvocationCount === 0,
			'Flat/local control is not unchanged Bruneton.',
		);

		await handle.setConfig({...commonConfig, color: candidateColor});
		captureWebglStage({
			context,
			label: stateId,
			stage: 'candidate-after-set-config',
			ledger: webglStageLedger,
		});
		const candidateBuild = handle._buildResult;
		const cacheReuse = requireReusedPhysics({
			handle,
			lightSource,
			geometryKind: 'flat-local',
			controlController,
			controlCache,
			controlIdentity,
			controlCelestialController,
			controlCelestialCache,
			controlCelestialIdentity,
			controlAssemblyDescriptor,
			controlBuildRecord,
		});
		const candidateDescriptor = assertColorDescriptorAndAssembly(
			candidateColor,
			candidateBuild.assembly,
		);
		requireCondition(
			candidateDescriptor.fingerprint !== controlDescriptor.fingerprint,
			'Flat/local Color-only transition retained the Bruneton fingerprint.',
		);
		const candidateShader = candidateBuild.assembly.fragmentShaderSource;
		const candidateShaderAudit = auditCandidateShader(
			candidateShader,
			candidateDescriptor,
			{
				sourceDerivedLocalLuminance:
					sourceLight.luminanceCdPerSquareMeter,
				exposureGain: candidateColor.exposureGain,
			},
		);
		const transportAudit = {
			finiteDisk: candidateShader.includes('evaluateFlatFiniteSunRadiance'),
			singleFiniteBoundaryTransmittanceExpression: (
				candidateShader.match(
					/radiance\.c\[channelIndex\] \* transmittance\.c\[channelIndex\]/gu,
				) ?? []
			).length,
			cumulativeAtmosphere: candidateShader.includes(
				'sampleCumulativeScatteringDensity',
			),
		};
		requireCondition(
			transportAudit.finiteDisk
				&& transportAudit.singleFiniteBoundaryTransmittanceExpression === 1
				&& transportAudit.cumulativeAtmosphere,
			'Flat/local atmosphere/external transport ownership changed.',
		);
		await handle.prepare(renderer);
		captureWebglStage({
			context,
			label: stateId,
			stage: 'candidate-after-prepare',
			ledger: webglStageLedger,
		});
		composer.render();
		captureWebglStage({
			context,
			label: stateId,
			stage: 'candidate-after-render',
			ledger: webglStageLedger,
		});
		const candidatePngDataUrl = canvas.toDataURL('image/png');
		const candidateRuntimeHealth = captureRuntimeHealth({
			context,
			renderer,
			handle,
			label: `${stateId} visibility candidate`,
			expectedSourceHash: candidateBuild.assembly.sourceHash,
			webglStageLedger,
		});
		const candidatePrimaryController = candidateBuild.cacheController;
		const candidatePrimaryCache = candidateBuild.cache;
		const candidatePrimaryIdentity = normalizeCacheIdentity(
			candidateBuild.cacheIdentity,
		);
		await handle.setConfig({
			...commonConfig,
			celestial: null,
			color: candidateColor,
		});
		captureWebglStage({
			context,
			label: stateId,
			stage: 'zero-celestial-after-set-config',
			ledger: webglStageLedger,
		});
		const zeroCelestialBuild = handle._buildResult;
		const zeroCelestialDescriptor = assertColorDescriptorAndAssembly(
			candidateColor,
			zeroCelestialBuild.assembly,
		);
		const zeroCelestialIsolation = {
			policy:
				'same candidate Color and same atmospheric N4 cache with only the finite celestial participant omitted',
			samePrimaryControllerObject:
				zeroCelestialBuild.cacheController === candidatePrimaryController,
			samePrimaryCacheObject:
				zeroCelestialBuild.cache === candidatePrimaryCache,
			samePrimaryCacheIdentity: JSON.stringify(normalizeCacheIdentity(
				zeroCelestialBuild.cacheIdentity,
			)) === JSON.stringify(candidatePrimaryIdentity),
			exactZeroCelestialCache:
				zeroCelestialBuild.celestialCacheController === null
					&& zeroCelestialBuild.celestialCache === null
					&& zeroCelestialBuild.celestialCacheIdentity === null,
			sameColorFingerprint:
				zeroCelestialBuild.assembly.descriptor.color.fingerprint
					=== candidateBuild.assembly.descriptor.color.fingerprint
					&& JSON.stringify(zeroCelestialDescriptor)
						=== JSON.stringify(candidateDescriptor),
			finiteDiskFunctionAbsent:
				!zeroCelestialBuild.assembly.fragmentShaderSource.includes(
					'evaluateFlatFiniteSunRadiance',
				),
			buildRecordCount: lightSource.controlledBuildRecords.length,
		};
		requireCondition(
			Object.entries(zeroCelestialIsolation)
				.filter(([key]) => key !== 'policy' && key !== 'buildRecordCount')
				.every(([, value]) => value === true)
				&& zeroCelestialIsolation.buildRecordCount === 1,
			`${stateId} zero-celestial diagnostic changed atmospheric physics.`,
		);
		await handle.prepare(renderer);
		captureWebglStage({
			context,
			label: stateId,
			stage: 'zero-celestial-after-prepare',
			ledger: webglStageLedger,
		});
		composer.render();
		captureWebglStage({
			context,
			label: stateId,
			stage: 'zero-celestial-after-render',
			ledger: webglStageLedger,
		});
		const zeroCelestialPngDataUrl = canvas.toDataURL('image/png');
		const zeroCelestialRuntimeHealth = captureRuntimeHealth({
			context,
			renderer,
			handle,
			label: `${stateId} same-Color zero-celestial diagnostic`,
			expectedSourceHash: zeroCelestialBuild.assembly.sourceHash,
			webglStageLedger,
		});
		const [
			controlImage,
			candidateImage,
			zeroCelestialImage,
			historicalControlImage,
		] = await Promise.all([
			decodeImage(controlPngDataUrl),
			decodeImage(candidatePngDataUrl),
			decodeImage(zeroCelestialPngDataUrl),
			decodeImage(historicalReference.url),
		]);
		const supportSet = new Set(supportMask.supportIndices);
		const nonCelestialParity = compareMaskedImages(
			candidateImage,
			controlImage,
			(pixel) => !supportSet.has(pixel),
		);
		const zeroCelestialOutsideSupportParity = compareMaskedImages(
			candidateImage,
			zeroCelestialImage,
			(pixel) => !supportSet.has(pixel),
		);
		requireCondition(
			nonCelestialParity.maximumAbsoluteChannelDifference
				<= GATES.nonCelestialMaximumByteDifference
				&& zeroCelestialOutsideSupportParity.maximumAbsoluteChannelDifference
					<= GATES.nonCelestialMaximumByteDifference,
			`${stateId} changed a byte outside the complete finite-disk support mask.`,
		);
		const support = summarizeFlatSupport(
			candidateImage,
			controlImage,
			zeroCelestialImage,
			supportMask.supportIndices,
		);
		const historicalBrunetonDrift = {
			policy:
				'fresh live FIB68 Bruneton versus immutable historical Bruneton RGB bytes outside the conservative complete finite-disk support mask',
			reference: historicalReference,
			...classifyHistoricalBrunetonDrift(stateId),
			metrics: compareMaskedImages(
				controlImage,
				historicalControlImage,
				(pixel) => !supportSet.has(pixel),
			),
		};
		const imageHealth = {
			control: summarizeImageHealth(controlImage),
			candidate: summarizeImageHealth(candidateImage),
			zeroCelestial: summarizeImageHealth(zeroCelestialImage),
		};
		const sourceNdc = sourceScenePosition.clone().project(camera);
		const pairPngDataUrl = await makePair({
			leftUrl: controlPngDataUrl,
			rightUrl: candidatePngDataUrl,
			leftLabel: `Bruneton - ${state.timeLabel}`,
			rightLabel: `Extraterrestrial visibility - ${state.timeLabel}`,
		});
		return {
			id: stateId,
			kind: 'flat-local',
			location: 'Union Glacier camp',
			timeLabel: state.timeLabel,
			cameraBearingPolicy: 'fixed Flat 180 source bearing',
			sourceLight: {
				contractId: SOURCE_DERIVED_LOCAL_LUMINANCE_CONTRACT_ID,
				...sourceLight,
				projectedSolidAngleSteradians:
					incident.projectedSolidAngleSteradians,
				sourceDistanceMeters,
				blockedByGround: sourceTransport.blockedByGround,
				exposureCurve: SOURCE_EXPOSURE_CURVE,
				exposureGain: candidateColor.exposureGain,
				maximumControlledIncidentRelativeDifference:
					maximumIncidentRelativeDifference,
			},
			source: {
				centerMeters: source.centerMeters,
				radiusMeters: source.radiusMeters,
				projectedCenterNdc: [sourceNdc.x, sourceNdc.y, sourceNdc.z],
				projectedCenterTopLeftPixels: {
					x: (sourceNdc.x * 0.5 + 0.5) * width,
					y: (1 - (sourceNdc.y * 0.5 + 0.5)) * height,
				},
			},
			color: {
				controlId: controlColor.id,
				candidateId: candidateColor.id,
				controlDescriptor,
				candidateDescriptor,
				controlShaderAudit,
				candidateShaderAudit,
			},
			cacheReuse,
			transportPacking,
			zeroCelestialIsolation,
			transportAudit,
			celestialSupport: supportMask,
			analysis: {
				nonCelestialParity,
				zeroCelestialOutsideSupportParity,
				historicalBrunetonDrift,
				support,
				imageHealth,
			},
			runtimeHealth: {
				control: controlRuntimeHealth,
				candidate: candidateRuntimeHealth,
				zeroCelestial: zeroCelestialRuntimeHealth,
			},
			webglErrors: [
				...controlRuntimeHealth.webglErrors,
				...candidateRuntimeHealth.webglErrors,
				...zeroCelestialRuntimeHealth.webglErrors,
			],
			programDiagnostics: candidateRuntimeHealth.programDiagnostics,
			sceneInputCaptureFrameCount:
				candidateRuntimeHealth.sceneInputCaptureFrameCount,
			controlPngDataUrl,
			candidatePngDataUrl,
			zeroCelestialPngDataUrl,
			pairPngDataUrl,
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
		for (const object of [...reviewBoxes, ...endpoints.visualObjects]) {
			object.geometry?.dispose?.();
			object.material?.dispose?.();
		}
		algorithm.dispose();
		composer.dispose();
		backend.dispose();
		renderer.dispose();
	}
}

function requirePreflight(sphericalById, flatById) {
	const plusOne = sphericalById.get('sunset-plus-one-hour');
	const plusTwo = sphericalById.get('sunset-plus-two-hours');
	const flat180 = flatById.get('flat-180');
	requireCondition(plusOne && plusTwo && flat180, 'Preflight matrix is incomplete.');
	const plusOneStars = plusOne.analysis.candidateStars;
	const plusTwoStars = plusTwo.analysis.candidateStars;
	for (const [id, stars] of [
		['sunset-plus-one-hour', plusOneStars],
		['sunset-plus-two-hours', plusTwoStars],
	]) {
		requireCondition(
			stars.eligibleCount === 32
				&& stars.negativeUpliftChannelCount === 0
				&& stars.maximumChannel <= GATES.maximumStarChannel
				&& stars.exactWhiteCount <= GATES.maximumExactWhiteStarCount
				&& stars.distinctRgbCount >= GATES.minimumDistinctStarRgbCount
				&& stars.peakChannelQuantiles.median
					>= GATES.minimumMedianStarUpliftChannel
				&& stars.rank.spearmanCorrelation !== null
				&& stars.rank.spearmanCorrelation
					>= GATES.minimumRawPaletteRankCorrelation,
			`${id} stellar variation, rank, headroom, or no-white gate failed.`,
		);
	}
	for (const record of [plusOne, plusTwo]) {
		const sun = record.analysis.sunEntryUplift;
		requireCondition(
			sun.eligibleCount > 0
				&& sun.maximumPositiveChannelUplift
					<= GATES.maximumPostSunsetSunUpliftChannel
				&& sun.maximumAbsoluteChannelDifference
					<= GATES.maximumPostSunsetSunUpliftChannel,
			`${record.id} retained a visible below-horizon Sun entry.`,
		);
	}
	requireCondition(
		plusOneStars.visibleCount === GATES.plusOneVisibleStarCount,
		'Plus-one-hour did not display all 32 supported stars.',
	);
	requireCondition(
		plusTwoStars.visibleCount >= GATES.plusTwoMinimumVisibleStarCount,
		'Plus-two-hour did not display at least 31 supported stars.',
	);
	const flatSupport = flat180.analysis.support;
	requireCondition(
		flat180.transportPacking?.accepted === true
			&& flat180.transportPacking.gpuProof?.accepted === true,
		'Flat180 did not pass its bounded FIB68 packing and live GPU transport proof.',
	);
	requireCondition(
		flatSupport.supportPixelCount > 0
			&& flatSupport.changedPixelCount > 0
			&& flatSupport.maximumPositiveChannelUplift
				>= GATES.minimumVisibleSolarDiscPeakChannel
			&& flatSupport.negativeUpliftChannelCount === 0
			&& flatSupport.peak !== null
			&& flatSupport.changedPeak !== null,
		'Flat180 finite Sun has no live composite support.',
	);
	requireCondition(
		flatSupport.peak.maximum <= GATES.flat180MaximumChannel
			&& flatSupport.changedPeak.maximum
				>= GATES.flat180MinimumChangedPeakChannel
			&& flatSupport.exactWhiteCount
				<= GATES.flat180MaximumExactWhiteSupportCount
			&& flatSupport.changedPeak.greenToRed !== null
			&& flatSupport.changedPeak.blueToRed !== null
			&& flatSupport.changedPeak.greenToRed
				<= GATES.flat180MaximumGreenToRed
			&& flatSupport.changedPeak.blueToRed
				<= GATES.flat180MaximumBlueToRed,
		'Flat180 combined finite Sun is clipped, white, or insufficiently warm.',
	);
	return {
		passed: true,
		spherical: {
			plusOneStars,
			plusTwoStars,
		},
		flat180: flatSupport,
	};
}

/** Render the focused preflight first, then all nine final live pairs. */
export async function runBrunetonFibonacci68FinalPairedCapturesBrowser() {
	const [config, geometryFixture, flatFixture] = await Promise.all([
		fetch('/browser/config.json').then((response) => response.json()),
		fetch('/browser/fixtures/g4-cpu-sun-disk-transport-v1.json')
			.then((response) => response.json()),
		fetch('/browser/fixtures/union-glacier-flat-local-closest-approach-v1.json')
			.then((response) => response.json()),
	]);
	requireCondition(
		config.colorModelId === BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID,
		'Final configuration selected the wrong Color model.',
	);
	requireCondition(
		JSON.stringify(config.spherical.scenes.map((scene) => scene.id))
			=== JSON.stringify(EXPECTED_SPHERICAL_SCENE_IDS),
		'Final configuration does not contain the exact six San Jose scenes.',
	);
	requireCondition(
		JSON.stringify(config.flat.stateIds) === JSON.stringify(EXPECTED_FLAT_STATE_IDS),
		'Final configuration does not contain Flat 0/90/180.',
	);
	requireCondition(
		JSON.stringify(Object.keys(config.spherical.products))
			=== JSON.stringify(EXPECTED_SPHERICAL_SCENE_IDS)
			&& Object.entries(config.spherical.products).every(
				([key, descriptor]) => descriptor.id === key,
			),
		'Final configuration has missing, extra, or mislabeled screen products.',
	);
	requireCondition(
		JSON.stringify(Object.keys(config.historicalBrunetonControls).sort())
			=== JSON.stringify([
				...EXPECTED_SPHERICAL_SCENE_IDS,
				...EXPECTED_FLAT_STATE_IDS,
			].sort()),
		'Final configuration has missing or extra historical Bruneton controls.',
	);
	const domainAudit = auditReflectionCompletedFibonacci68Control();
	requireCondition(
		domainAudit.directionCount === 68
			&& domainAudit.reflectionMismatchCount === 0
			&& domainAudit.partnerWeightMismatchCount === 0
			&& domainAudit.totalWeightErrorSteradians <= 1e-12
			&& domainAudit.policyId
				=== REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_PROVENANCE.policyId,
		'Pinned FIB68 domain audit failed.',
	);
	const colorIdentityAudit = auditColorIdentitySensitivity();
	const calibration = deriveLocalRadiometricCalibration(flatFixture);
	const products = Object.fromEntries(await Promise.all(
		Object.entries(config.spherical.products).map(
			async ([id, descriptor]) => [id, await loadProduct(descriptor)],
		),
	));
	const sceneById = new Map(
		config.spherical.scenes.map((scene) => [scene.id, scene]),
	);
	const sphericalById = new Map();
	const flatById = new Map();
	for (const id of SPHERICAL_PREFLIGHT_IDS) {
		const sceneSpec = sceneById.get(id);
		const product = products[id];
		requireCondition(sceneSpec && product, `Missing preflight scene/product ${id}.`);
		sphericalById.set(id, await renderSphericalPair({
			fixture: {camera: config.spherical.camera},
			geometryConfiguration: geometryFixture.geometry,
			sceneSpec,
			product,
			historicalControl: config.historicalBrunetonControls[id],
		}));
	}
	flatById.set(FLAT_PREFLIGHT_ID, await renderFlatPair({
		fixture: flatFixture,
		stateId: FLAT_PREFLIGHT_ID,
		calibration,
		historicalControl:
			config.historicalBrunetonControls[FLAT_PREFLIGHT_ID],
	}));
	const preflight = requirePreflight(sphericalById, flatById);
	for (const id of EXPECTED_SPHERICAL_SCENE_IDS) {
		if (sphericalById.has(id)) continue;
		sphericalById.set(id, await renderSphericalPair({
			fixture: {camera: config.spherical.camera},
			geometryConfiguration: geometryFixture.geometry,
			sceneSpec: sceneById.get(id),
			product: products[id],
			historicalControl: config.historicalBrunetonControls[id],
		}));
	}
	for (const id of EXPECTED_FLAT_STATE_IDS) {
		if (flatById.has(id)) continue;
		flatById.set(id, await renderFlatPair({
			fixture: flatFixture,
			stateId: id,
			calibration,
			historicalControl: config.historicalBrunetonControls[id],
		}));
	}
	const spherical = EXPECTED_SPHERICAL_SCENE_IDS.map((id) => sphericalById.get(id));
	const flat = EXPECTED_FLAT_STATE_IDS.map((id) => flatById.get(id));
	const allRecords = [...spherical, ...flat];
	const flatPlanContentHashes = flat.map(
		(record) => record.cacheReuse.buildRecord.planIdentity.contentHash,
	);
	requireCondition(
		new Set(flatPlanContentHashes).size === EXPECTED_FLAT_STATE_IDS.length,
		'Flat0/90/180 unexpectedly reused one cross-state construction plan identity.',
	);
	const expectedPostSunsetSunEntries = new Map([
		['sunset-plus-30-minutes', 9],
		['sunset-plus-one-hour', 11],
		['sunset-plus-two-hours', 14],
	]);
	for (const record of spherical.filter(
		(entry) => expectedPostSunsetSunEntries.has(entry.id),
	)) {
		requireCondition(
			record.analysis.sunEntryUplift.eligibleCount
				=== expectedPostSunsetSunEntries.get(record.id)
				&& record.analysis.sunEntryUplift.maximumAbsoluteChannelDifference
					<= GATES.maximumPostSunsetSunUpliftChannel,
			`${record.id} retained a visible below-horizon Sun entry.`,
		);
	}
	for (const record of spherical.filter((entry) => [
		'sunset-minus-30-minutes',
		'sunset',
	].includes(entry.id))) {
		const sun = record.analysis.sunEntryUplift;
		requireCondition(
			sun.eligibleCount > 0
				&& sun.changedPixelCount > 0
				&& sun.maximumPositiveChannelUplift
					>= GATES.minimumVisibleSolarDiscPeakChannel
				&& sun.peak !== null
				&& sun.changedPeak !== null
				&& sun.peak.maximum <= GATES.maximumStarChannel
				&& sun.exactWhiteCount === 0,
			`${record.id} visible spherical Sun is absent or clipped.`,
		);
	}
	for (const record of flat.filter((entry) => entry.id !== 'flat-0')) {
		const support = record.analysis.support;
		requireCondition(
			support.supportPixelCount > 0
				&& support.changedPixelCount > 0
				&& support.changedPeak !== null
				&& support.maximumPositiveChannelUplift
					>= GATES.minimumVisibleSolarDiscPeakChannel
				&& support.negativeUpliftChannelCount === 0
				&& support.peak.maximum <= GATES.flat180MaximumChannel
				&& support.exactWhiteCount === 0,
			`${record.id} visible finite disk is absent or clipped.`,
		);
	}
	requireCondition(
		flat.find((record) => record.id === 'flat-0')
			.analysis.support.supportPixelCount === 0,
		'Flat0 fixed-Flat180 camera unexpectedly intersects the finite disk.',
	);
	requireCondition(
		allRecords.every((record) =>
			record.webglErrors.length === 0
				&& Object.values(record.runtimeHealth).every((health) =>
						health.status === 'installed'
							&& health.programCount > 0
							&& health.programDiagnostics.every((entry) => entry === null)
							&& health.webglErrors.length === 0
							&& Array.isArray(health.webglStageLedger)
							&& health.webglStageLedger.length > 0
							&& health.webglStageLedger.every((stage) =>
								stage.contextLost === false
									&& stage.codes.length === 0
									&& stage.errors.length === 0)
							&& health.sceneInputCaptureFrameCount >= 1)
				&& record.color.candidateId
					=== BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID
				&& record.cacheReuse.sameCacheObject
				&& record.cacheReuse.sameControllerObject
				&& record.cacheReuse.sameCelestialControllerObject
				&& record.cacheReuse.sameCelestialCacheObject
				&& record.cacheReuse.sameCelestialCacheIdentity
				&& record.cacheReuse.sameNonColorAssemblyDescriptor
				&& record.cacheReuse.expectedModelVersionTransition
				&& record.cacheReuse.buildRecord.incomingDirectionCount === 68
				&& (record.kind !== 'flat-local'
					|| (record.transportPacking?.accepted === true
						&& record.transportPacking.gpuProof?.accepted === true
						&& record.zeroCelestialIsolation.samePrimaryControllerObject
						&& record.zeroCelestialIsolation.samePrimaryCacheObject
						&& record.zeroCelestialIsolation.samePrimaryCacheIdentity
						&& record.zeroCelestialIsolation.exactZeroCelestialCache
						&& record.zeroCelestialIsolation.sameColorFingerprint
						&& record.zeroCelestialIsolation.finiteDiskFunctionAbsent
						&& record.zeroCelestialIsolation.buildRecordCount === 1))
				&& historicalBrunetonDriftPasses(
					record.analysis.historicalBrunetonDrift,
				)
				&& imageHealthIsValid(record.analysis.imageHealth.candidate)
				&& imageHealthIsValid(record.analysis.imageHealth.control, {
					allowExactBlack: record.id === 'sunset-plus-two-hours',
				})
				&& imageHealthIsValid(
					record.analysis.imageHealth.zeroCelestial,
					{allowExactBlack: record.id === 'sunset-plus-two-hours'},
				)
				&& record.analysis.nonCelestialParity.maximumAbsoluteChannelDifference
					<= GATES.nonCelestialMaximumByteDifference
				&& record.analysis.zeroCelestialOutsideSupportParity
					.maximumAbsoluteChannelDifference
					<= GATES.nonCelestialMaximumByteDifference),
		'One final matrix record failed its live physics, Color, parity, or WebGL gate.',
	);
	return {
		renderId: 'bruneton-fibonacci68-final-paired-captures-v1',
		colorModelId: BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID,
		sourceExposureCurve: SOURCE_EXPOSURE_CURVE,
		extraterrestrialDisplayHeadroom:
			DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM,
		gates: GATES,
		domainAudit,
		colorIdentityAudit,
		flatRadiometricCalibration: calibration,
		preflight,
		spherical,
		flat,
	};
}
