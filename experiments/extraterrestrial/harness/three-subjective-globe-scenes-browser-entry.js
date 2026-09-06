import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

import { Algorithm32 } from '../candidate/src/algorithm32/Algorithm32.js';
import { CanonicalAtmosphere } from '../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import { CelestialRuntimeParticipant } from '../candidate/src/algorithm32/caches/celestial/CelestialRuntimeParticipant.js';
import { DistantSunCelestialSource } from '../candidate/src/algorithm32/caches/celestial/DistantSunCelestialSource.js';
import { StellarCelestialSource } from '../candidate/src/algorithm32/caches/celestial/StellarCelestialSource.js';
import { BrunetonColorDisplayModel } from '../candidate/src/algorithm32/color/BrunetonColorDisplayModel.js';
import { CANONICAL_ATMOSPHERE_CONSTANTS, FIGURE1_DISPLAY_CONSTANTS } from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import { SphericalEarthGeometry } from '../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
import { DistantSunLightSource } from '../candidate/src/algorithm32/light-sources/DistantSunLightSource.js';
import { NATIVE_15_SPECTRAL_BASIS, NATIVE_SOURCE_IRRADIANCE_DENSITY } from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import { SPECTRAL_QUANTITIES, SPECTRAL_UNITS, createSpectralPacket } from '../candidate/src/algorithm32/quantities/index.js';
import { ThreeCacheBackend } from '../candidate/src/algorithm32/three/ThreeCacheBackend.js';
import { FerwerdaFullSceneColorDisplayModel } from '../stellar-visual-adaptation/FerwerdaFullSceneColorDisplayModel.js';

const SUN_SOURCE_ID = 'sun';
const NATIVE_SUN_ANGULAR_RADIUS_RADIANS = 0.004675;
const SAN_JOSE_ONE_HOUR_AFTER_SUNSET = Object.freeze({
	timeIso: '2024-06-21T04:26:03.503Z',
	directionToSourceUpEastNorth: [-0.16926779354724067, -0.7581374816251853, 0.6297427832239688],
});
const SAN_JOSE_TWENTY_MINUTES_AFTER_SUNSET = Object.freeze({
	timeIso: '2024-06-21T03:46:03.503Z',
	// NOAA-style declination/equation-of-time calculation used by FlatSynchronizer,
	// evaluated at the fixture's San Jose latitude/longitude and this UTC instant.
	directionToSourceUpEastNorth: [-0.058358452219860274, -0.8363142232343254, 0.5451355896201142],
});

function calculateSanJoseSolarNoon() {
	const latitudeDegrees = 37.3382;
	const longitudeDegrees = -121.8863;
	const dateNoonUtc = new Date(Date.UTC(2024, 5, 20, 12, 0, 0, 0));
	const dayOfYear = 172;
	const gamma = 2 * Math.PI / 366 * (dayOfYear - 1);
	const declinationRadians = (
		0.006918
		- 0.399912 * Math.cos(gamma)
		+ 0.070257 * Math.sin(gamma)
		- 0.006758 * Math.cos(2 * gamma)
		+ 0.000907 * Math.sin(2 * gamma)
		- 0.002697 * Math.cos(3 * gamma)
		+ 0.00148 * Math.sin(3 * gamma)
	);
	const equationOfTimeMinutes = 229.18 * (
		0.000075
		+ 0.001868 * Math.cos(gamma)
		- 0.032077 * Math.sin(gamma)
		- 0.014615 * Math.cos(2 * gamma)
		- 0.040849 * Math.sin(2 * gamma)
	);
	const solarNoonUtcMinutes = 720 - equationOfTimeMinutes - 4 * longitudeDegrees;
	const latitudeRadians = latitudeDegrees * Math.PI / 180;

	return Object.freeze({
		timeIso: new Date(Date.UTC(2024, 5, 20) + solarNoonUtcMinutes * 60 * 1000).toISOString(),
		// Same NOAA fractional-year declination and equation-of-time model used by
		// FlatSynchronizer. At local apparent solar noon the hour angle is zero.
		directionToSourceUpEastNorth: [
			Math.cos(latitudeRadians - declinationRadians),
			0,
			Math.sin(declinationRadians - latitudeRadians),
		],
	});
}

const SAN_JOSE_SOLAR_NOON = calculateSanJoseSolarNoon();

function calculateSanJoseSolarDirectionAt(timeIso) {
	const latitudeRadians = 37.3382 * Math.PI / 180;
	const longitudeDegrees = -121.8863;
	const time = new Date(timeIso);
	const yearStart = Date.UTC(time.getUTCFullYear(), 0, 1);
	const dateStart = Date.UTC(time.getUTCFullYear(), time.getUTCMonth(), time.getUTCDate());
	const dayOfYear = Math.floor((dateStart - yearStart) / 86400000) + 1;
	const utcHours = time.getUTCHours()
		+ time.getUTCMinutes() / 60
		+ time.getUTCSeconds() / 3600
		+ time.getUTCMilliseconds() / 3600000;
	const gamma = 2 * Math.PI / 366 * (dayOfYear - 1 + (utcHours - 12) / 24);
	const declinationRadians = 0.006918
		- 0.399912 * Math.cos(gamma)
		+ 0.070257 * Math.sin(gamma)
		- 0.006758 * Math.cos(2 * gamma)
		+ 0.000907 * Math.sin(2 * gamma)
		- 0.002697 * Math.cos(3 * gamma)
		+ 0.00148 * Math.sin(3 * gamma);
	const equationOfTimeMinutes = 229.18 * (0.000075
		+ 0.001868 * Math.cos(gamma)
		- 0.032077 * Math.sin(gamma)
		- 0.014615 * Math.cos(2 * gamma)
		- 0.040849 * Math.sin(2 * gamma));
	const utcMinutes = utcHours * 60;
	const trueSolarMinutes = ((utcMinutes + equationOfTimeMinutes + 4 * longitudeDegrees) % 1440 + 1440) % 1440;
	const hourAngleRadians = (trueSolarMinutes / 4 - 180) * Math.PI / 180;

	return [
		Math.sin(latitudeRadians) * Math.sin(declinationRadians)
			+ Math.cos(latitudeRadians) * Math.cos(declinationRadians) * Math.cos(hourAngleRadians),
		-Math.cos(declinationRadians) * Math.sin(hourAngleRadians),
		Math.sin(declinationRadians) * Math.cos(latitudeRadians)
			- Math.cos(declinationRadians) * Math.sin(latitudeRadians) * Math.cos(hourAngleRadians),
	];
}

const SAN_JOSE_THREE_HOURS_AFTER_SUNSET = Object.freeze({
	timeIso: '2024-06-21T06:26:03.503Z',
	directionToSourceUpEastNorth: calculateSanJoseSolarDirectionAt('2024-06-21T06:26:03.503Z'),
});
const DISTANT_REVIEW_BOXES = Object.freeze([
	Object.freeze({ name: 'spherical-review-distant-cyan-box', colorHex: 2796220, eastMeters: 18000, northMeters: -60000, sizeMeters: [6000, 5000, 6000] }),
	Object.freeze({ name: 'spherical-review-denali-250km-orange-box', colorHex: 14638880, eastMeters: 100000, northMeters: -250000, sizeMeters: [50000, 6200, 100000] }),
]);

function summarizeRgba(values) {
	const sums = [0, 0, 0];
	let nonBlack = 0;
	let maximumChannel = 0;
	let exactWhitePixelCount = 0;
	for (let index = 0; index < values.length; index += 4) {
		for (let channel = 0; channel < 3; channel += 1) {
			sums[channel] += values[index + channel];
			maximumChannel = Math.max(maximumChannel, values[index + channel]);
		}
		if (values[index] || values[index + 1] || values[index + 2]) nonBlack += 1;
		if (values[index] === 255 && values[index + 1] === 255 && values[index + 2] === 255) exactWhitePixelCount += 1;
	}
	return { nonBlack, maximumChannel, exactWhitePixelCount, meanRgb: sums.map((sum) => sum / (values.length / 4)) };
}

function directionFromUpEastNorth(directionToSourceUpEastNorth) {
	const [up, east, north] = directionToSourceUpEastNorth;
	return new THREE.Vector3(east, north, up).normalize();
}

function cameraAzimuthDegreesForLocalDirection(directionToSourceUpEastNorth) {
	const [, east, north] = directionToSourceUpEastNorth;
	// configureObserverLocalCamera maps local north to -Z, so its azimuth is the
	// ordinary atan2(east, north) geographic bearing.
	return Math.atan2(east, north) * 180 / Math.PI;
}

function sampledSkyIrradianceToAmbientLight(skyIlluminanceLux, skyIrradianceLinearSrgb) {
	if (!Number.isFinite(skyIlluminanceLux) || skyIlluminanceLux < 0) {
		throw new RangeError('Sky illuminance must be finite and nonnegative.');
	}
	if (!Array.isArray(skyIrradianceLinearSrgb)
		|| skyIrradianceLinearSrgb.length !== 3
		|| !skyIrradianceLinearSrgb.every((value) => Number.isFinite(value) && value >= 0)) {
		throw new RangeError('Sampled sky irradiance must contain three finite nonnegative scene-linear values.');
	}
	return {
		// Three's Lambert path evaluates ambientLightColor * diffuseColor / pi.
		// Supply the sampled scene-linear irradiance directly; the composer keeps
		// its offscreen input half-float, and Color owns the final display map.
		color: skyIrradianceLinearSrgb,
		intensity: 1,
	};
}

function configureObserverLocalCamera(camera, sceneSpec) {
	camera.up.set(0, 1, 0);
	camera.position.set(0, sceneSpec.cameraHeightMeters, 0);
	const viewAzimuthRadians = sceneSpec.viewAzimuthDegrees * Math.PI / 180;
	const viewElevationRadians = sceneSpec.viewElevationDegrees * Math.PI / 180;
	camera.lookAt(
		1000 * Math.sin(viewAzimuthRadians) * Math.cos(viewElevationRadians),
		sceneSpec.cameraHeightMeters + 1000 * Math.sin(viewElevationRadians),
		-1000 * Math.cos(viewAzimuthRadians) * Math.cos(viewElevationRadians),
	);
	camera.updateMatrixWorld(true);
}

function createDistantReviewBoxes(bottomRadiusMeters) {
	return DISTANT_REVIEW_BOXES.map((specification) => {
		const horizontalDistanceMeters = Math.hypot(specification.eastMeters, specification.northMeters);
		const groundOffsetMeters = Math.sqrt(bottomRadiusMeters ** 2 - horizontalDistanceMeters ** 2) - bottomRadiusMeters;
		const box = new THREE.Mesh(
			new THREE.BoxGeometry(...specification.sizeMeters),
			new THREE.MeshLambertMaterial({ color: specification.colorHex }),
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

async function renderScene({ fixture, sceneSpec, stellar = null, includeSkyProbeSamples = false }) {
	const width = fixture.camera.widthPixels;
	const height = fixture.camera.heightPixels;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
	if (!context) throw new Error('WebGL2 is unavailable.');
	const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: false });
	renderer.setSize(width, height, false);
	const composer = new EffectComposer(renderer);
	composer.setSize(width, height);
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(
		sceneSpec.verticalFovDegrees ?? fixture.camera.verticalFovDegrees,
		width / height,
		0.1,
		sceneSpec.cameraFarMeters ?? 200000,
	);
	const sceneInput = {
		...sceneSpec,
		cameraHeightMeters: fixture.camera.observerHeightMeters,
		viewElevationDegrees: sceneSpec.viewElevationDegrees ?? fixture.camera.viewElevationDegrees,
	};
	configureObserverLocalCamera(camera, sceneInput);
	const backend = new ThreeCacheBackend({ THREE, renderer });
	const directionToSun = directionFromUpEastNorth(sceneSpec.directionToSourceUpEastNorth);
	const geometry = new SphericalEarthGeometry({
		...fixture.geometry,
		observerHeight: { value: fixture.camera.observerHeightMeters, units: 'meters' },
		observerUpDirection: [0, 0, 1],
		sceneFrame: { kind: 'observer-local' },
		directionToSource: directionToSun.toArray(),
		cacheAltitudeBinCount: 48,
	});
	const groundEndpoints = geometry.createThreeEndpointObjects({
		name: `${sceneSpec.id}-ground`,
		sceneScale: { value: 1, units: 'meters-per-scene-unit' },
		widthSegments: 192,
		heightSegments: 96,
		// Geometry owns the endpoint's default ground color and mesh contract.
		// Lambert response is required before an endpoint-scene light can drive it.
		visualMaterialLighting: 'lambert',
		groundVisualMesh: { kind: 'local-spherical-patch' },
	});
	const [ground] = groundEndpoints.visualObjects;
	const reviewBoxes = sceneSpec.includeDistantReviewBoxes
		? createDistantReviewBoxes(fixture.geometry.bottomRadius.value)
		: [];
	scene.background = new THREE.Color(0x000000);
	scene.add(...groundEndpoints.visualObjects, ...reviewBoxes);
	composer.addPass(new RenderPass(scene, camera));
	const atmosphere = new CanonicalAtmosphere({ constants: CANONICAL_ATMOSPHERE_CONSTANTS, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
	const displayExposureScale = 1;
	const lightSource = new DistantSunLightSource({
		directionToLight: directionToSun.toArray(),
		sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
		angularRadius: { value: NATIVE_SUN_ANGULAR_RADIUS_RADIANS, units: 'radians' },
	});
	const celestial = new CelestialRuntimeParticipant({
		sources: [new DistantSunCelestialSource({ sourceId: SUN_SOURCE_ID, atmosphericSun: lightSource, spectralBasis: NATIVE_15_SPECTRAL_BASIS }), ...(stellar ? [stellar] : [])],
		primarySourceId: SUN_SOURCE_ID,
	});
	const colorConfiguration = {
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		displayConstants: FIGURE1_DISPLAY_CONSTANTS,
	};
	const color = sceneSpec.ferwerda
		? new FerwerdaFullSceneColorDisplayModel({...colorConfiguration, ferwerda: sceneSpec.ferwerda})
		: new BrunetonColorDisplayModel(colorConfiguration);
	const algorithm = new Algorithm32({
		geometry,
		atmosphere,
		lightSource,
		celestial,
		color,
		spectral: NATIVE_15_SPECTRAL_BASIS,
		execution: {
			maximumScatteringOrder: sceneSpec.maximumScatteringOrder ?? 4,
		},
	});
	let handle;
	try {
		handle = await algorithm.setupShader({
			THREE,
			composer,
			scene,
			camera,
			viewportSize: { width, height, units: 'pixels' },
			cacheBackend: backend,
			sceneScale: { value: 1, units: 'meters-per-scene-unit' },
			sceneDepthMax: { value: sceneSpec.sceneDepthMaxMeters ?? 160000, units: 'meters' },
			bindingValues: {
				'geometry.inverseProjectionMatrix': camera.projectionMatrixInverse.clone(),
      'geometry.inverseViewMatrix': camera.matrixWorld.clone(),
				'geometry.cameraWorldPosition': new THREE.Vector3(0, 0, 6360000 + fixture.camera.observerHeightMeters),
				'geometry.cameraGroundRelativePosition': new THREE.Vector3(0, 0, fixture.camera.observerHeightMeters),
				'light.directionToAtmosphericSource': directionToSun,
			},
		});
		await handle.prepare(renderer);
		composer.render();
		const values = new Uint8Array(width * height * 4);
		context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, values);
		const diagnostics = handle.getDiagnostics();
		return {
			id: sceneSpec.id,
			location: sceneSpec.location,
			dateBasis: sceneSpec.dateBasis,
			timeLabel: sceneSpec.timeLabel,
			verticalFovDegrees: sceneSpec.verticalFovDegrees ?? fixture.camera.verticalFovDegrees,
			viewAzimuthDegrees: sceneSpec.viewAzimuthDegrees,
			viewElevationDegrees: sceneInput.viewElevationDegrees,
			displayExposureScale,
			skyIlluminanceLux: null,
			ambientLighting: null,
			skyProbeSamples: null,
			directionToSourceUpEastNorth: sceneSpec.directionToSourceUpEastNorth,
			imagePngDataUrl: canvas.toDataURL('image/png'),
			image: summarizeRgba(values),
			ground: {
				owner: groundEndpoints.metadata.owner,
				endpointKind: groundEndpoints.metadata.endpointKind,
				shape: groundEndpoints.metadata.shape,
				visualMeshKind: groundEndpoints.metadata.visualMeshKind,
			},
			reviewBoxes: {
				count: reviewBoxes.length,
				names: reviewBoxes.map((box) => box.name),
			},
			diagnostics,
			shaderIncludes: {
				cumulativeAtmosphere: handle._buildResult.assembly.fragmentShaderSource.includes('sampleCumulativeScatteringDensity'),
				celestialLive: handle._buildResult.assembly.fragmentShaderSource.includes('evaluatePrimaryCelestialRadiance'),
				stellarLive: handle._buildResult.assembly.fragmentShaderSource.includes('evaluateStellarPointSetRadiance'),
				pureBrunetonFigure1: handle._buildResult.assembly.fragmentShaderSource.includes('DISPLAY_TONE_MAP_K')
					&& !handle._buildResult.assembly.fragmentShaderSource.includes('visualAdaptationGain')
					&& !handle._buildResult.assembly.fragmentShaderSource.includes('uSkyIlluminanceTexture'),
				ferwerdaFullScene: handle._buildResult.assembly.fragmentShaderSource.includes('FERWERDA_CONE_SCALE')
					&& handle._buildResult.assembly.fragmentShaderSource.includes('FERWERDA_ROD_SCALE'),
				sceneInputCapture: diagnostics.runtime.sceneInputCapture?.frameCount > 0,
			},
		};
	} finally {
		handle?.dispose();
		scene.remove(...reviewBoxes);
		scene.remove(...groundEndpoints.visualObjects);
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

/** Render the two retained subjective location/time contexts through normal Three runtime assembly. */
export async function runThreeSubjectiveGlobeScenesBrowserProof() {
	const [fixture, radiometry] = await Promise.all([
		fetch('/fixtures/subjective-globe-context-scenes-v1.json').then((response) => response.json()),
		fetch('/fixtures/g4-cpu-sun-disk-transport-v1.json').then((response) => response.json()),
	]);
	const scenes = [];
	for (const sceneSpec of fixture.scenes) {
		scenes.push(await renderScene({ fixture: { ...fixture, geometry: radiometry.geometry }, sceneSpec }));
	}
	return {
		claimBoundary: fixture.claimBoundary,
		nativeSunAngularRadiusRadians: NATIVE_SUN_ANGULAR_RADIUS_RADIANS,
		scenes,
	};
}

/** Render the retained San Jose sunset context with the real materialized stellar roster. */
export async function runThreeSubjectiveGlobeSunsetWithStarsBrowserPreview({ cameraAzimuthOffsetDegrees = 0, cameraElevationOffsetDegrees = 0, sceneTimeOverride = null, resolution = [640, 400], maximumScatteringOrder = 4 } = {}) {
	const [fixture, radiometry, stellarInput] = await Promise.all([
		fetch('/fixtures/subjective-globe-context-scenes-v1.json').then((response) => response.json()),
		fetch('/fixtures/g4-cpu-sun-disk-transport-v1.json').then((response) => response.json()),
		fetch('/browser/stellar-runtime-input.json').then((response) => response.json()),
	]);
	const stellar = new StellarCelestialSource({
		catalog: stellarInput.catalog,
		members: stellarInput.members,
		materializedTransportIdentity: stellarInput.transportIdentity,
		materializedTransportMembers: stellarInput.transportMembers.map((member) => ({
			memberId: member.memberId,
			sourceIrradiance: createSpectralPacket({ basis: NATIVE_15_SPECTRAL_BASIS, quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY, units: SPECTRAL_UNITS.IRRADIANCE_DENSITY, values: member.values, provenanceIdentity: `subjective-sunset-stellar:${member.memberId}` }),
		})),
	});
	const sunsetScene = fixture.scenes.find((scene) => scene.id === 'san-jose-globe-sunset');
	const sceneSpec = {
		...sunsetScene,
		...(sceneTimeOverride ?? {}),
		id: `san-jose-globe-sunset-stars-${cameraAzimuthOffsetDegrees}deg-${cameraElevationOffsetDegrees}deg`,
		viewAzimuthDegrees: sunsetScene.viewAzimuthDegrees + cameraAzimuthOffsetDegrees,
		viewElevationDegrees: sunsetScene.viewElevationDegrees + cameraElevationOffsetDegrees,
		maximumScatteringOrder,
	};
	const previewFixture = {
		...fixture,
		geometry: radiometry.geometry,
		camera: { ...fixture.camera, widthPixels: resolution[0], heightPixels: resolution[1] },
	};
	return renderScene({ fixture: previewFixture, sceneSpec, stellar });
}

/** Render the same sunset context with the camera pointed 180 degrees away from the Sun-facing view. */
export function runThreeSubjectiveGlobeSunsetWithStarsOppositeCameraBrowserPreview() {
	return runThreeSubjectiveGlobeSunsetWithStarsBrowserPreview({ cameraAzimuthOffsetDegrees: 180 });
}

/** Render the retained Sun-facing sunset with an upward tilt and unchanged azimuth. */
export function runThreeSubjectiveGlobeSunsetWithStarsUpwardBrowserPreview() {
	return runThreeSubjectiveGlobeSunsetWithStarsBrowserPreview({ cameraElevationOffsetDegrees: 20 });
}

/** Render the retained sunset opposite the Sun with the same upward tilt. */
export function runThreeSubjectiveGlobeSunsetWithStarsOppositeUpwardBrowserPreview() {
	return runThreeSubjectiveGlobeSunsetWithStarsBrowserPreview({
		cameraAzimuthOffsetDegrees: 180,
		cameraElevationOffsetDegrees: 20,
	});
}

/** Render the anti-solar upward view twenty minutes after the synchronized sunset. */
export function runThreeSubjectiveGlobeTwentyMinutesAfterSunsetWithStarsOppositeUpwardBrowserPreview() {
	return runThreeSubjectiveGlobeSunsetWithStarsBrowserPreview({
		cameraAzimuthOffsetDegrees: 180,
		cameraElevationOffsetDegrees: 20,
		sceneTimeOverride: { ...SAN_JOSE_TWENTY_MINUTES_AFTER_SUNSET, timeLabel: 'Twenty minutes after sunset' },
	});
}

/** Render the twenty-minute twilight scene with the fixture's original Sun-facing camera. */
export function runThreeSubjectiveGlobeTwentyMinutesAfterSunsetWithStarsSunFacingBrowserPreview() {
	return runThreeSubjectiveGlobeSunsetWithStarsBrowserPreview({
		sceneTimeOverride: { ...SAN_JOSE_TWENTY_MINUTES_AFTER_SUNSET, timeLabel: 'Twenty minutes after sunset' },
	});
}

/** Render the same 20-minute twilight view at three-times linear angular sampling. */
export function runThreeSubjectiveGlobeTwentyMinutesAfterSunsetWithStarsOppositeUpwardHighResolutionBrowserPreview() {
	return runThreeSubjectiveGlobeSunsetWithStarsBrowserPreview({
		cameraAzimuthOffsetDegrees: 180,
		cameraElevationOffsetDegrees: 20,
		resolution: [1920, 1200],
		sceneTimeOverride: { ...SAN_JOSE_TWENTY_MINUTES_AFTER_SUNSET, timeLabel: 'Twenty minutes after sunset' },
	});
}

/** Render the opposite sunset view tilted upward, retaining a small ground/horizon reference. */
export function runThreeSubjectiveGlobeSunsetWithStarsOppositeCameraUpwardBrowserPreview() {
	return runThreeSubjectiveGlobeSunsetWithStarsBrowserPreview({ cameraAzimuthOffsetDegrees: 180, cameraElevationOffsetDegrees: 25 });
}

/** Render the same upward, opposite view one hour after the fixture's synchronized sunset. */
export function runThreeSubjectiveGlobeOneHourAfterSunsetWithStarsBrowserPreview() {
	return runThreeSubjectiveGlobeSunsetWithStarsBrowserPreview({
		cameraAzimuthOffsetDegrees: 180,
		cameraElevationOffsetDegrees: 25,
		sceneTimeOverride: { ...SAN_JOSE_ONE_HOUR_AFTER_SUNSET, timeLabel: 'One hour after sunset' },
	});
}

/** Render San Jose at locally derived apparent solar noon with the ground in view. */
export function runThreeSubjectiveGlobeSolarNoonBrowserPreview() {
	return runThreeSubjectiveGlobeSunsetWithStarsBrowserPreview({
		cameraAzimuthOffsetDegrees: 43,
		cameraElevationOffsetDegrees: 0,
		sceneTimeOverride: {
			...SAN_JOSE_SOLAR_NOON,
			timeLabel: 'Solar noon',
			includeDistantReviewBoxes: true,
			cameraFarMeters: 400000,
			sceneDepthMaxMeters: 300000,
		},
	});
}

/** Render the synchronized San Jose sunset with the common ground-and-box context. */
export function runThreeSubjectiveGlobeSunsetWithDistantBoxesBrowserPreview() {
	return runThreeSubjectiveGlobeSunsetWithStarsBrowserPreview({
		cameraAzimuthOffsetDegrees: 43,
		cameraElevationOffsetDegrees: 0,
		sceneTimeOverride: {
			timeLabel: 'Sunset',
			includeDistantReviewBoxes: true,
			cameraFarMeters: 400000,
			sceneDepthMaxMeters: 300000,
		},
	});
}

/** Render complete sunset and noon scenes through one source-independent Ferwerda Color variant. */
export async function runThreeSubjectiveGlobeFerwerdaFullSceneComparison() {
	const configuration = await fetch('/browser/ferwerda-full-scene-config.json').then((response) => response.json());
	const sunset = await runThreeSubjectiveGlobeSunsetWithStarsBrowserPreview({
		cameraAzimuthOffsetDegrees: 43,
		sceneTimeOverride: {
			timeLabel: 'Sunset',
			includeDistantReviewBoxes: true,
			cameraFarMeters: 400000,
			sceneDepthMaxMeters: 300000,
			ferwerda: configuration.conditions.sunset,
		},
	});
	const solarNoon = await runThreeSubjectiveGlobeSunsetWithStarsBrowserPreview({
		cameraAzimuthOffsetDegrees: 43,
		sceneTimeOverride: {
			...SAN_JOSE_SOLAR_NOON,
			timeLabel: 'Solar noon',
			includeDistantReviewBoxes: true,
			cameraFarMeters: 400000,
			sceneDepthMaxMeters: 300000,
			ferwerda: configuration.conditions['solar-noon'],
		},
	});
	return {renderId: 'stellar-ferwerda-full-scene-sunset-noon-v1', scenes: [sunset, solarNoon]};
}

/** Render sunset and noon using atmosphere-data-derived diffuse adaptation. */
export async function runThreeSubjectiveGlobeDiffuseAdaptedFerwerdaFullSceneComparison() {
	const configuration = await fetch('/browser/diffuse-adapted-ferwerda-config.json').then((response) => response.json());
	const sunset = await runThreeSubjectiveGlobeSunsetWithStarsBrowserPreview({
		cameraAzimuthOffsetDegrees: 43,
		sceneTimeOverride: {
			timeLabel: 'Sunset',
			includeDistantReviewBoxes: true,
			cameraFarMeters: 400000,
			sceneDepthMaxMeters: 300000,
			ferwerda: configuration.conditions.sunset.ferwerda,
		},
	});
	const solarNoon = await runThreeSubjectiveGlobeSunsetWithStarsBrowserPreview({
		cameraAzimuthOffsetDegrees: 43,
		sceneTimeOverride: {
			...SAN_JOSE_SOLAR_NOON,
			timeLabel: 'Solar noon',
			includeDistantReviewBoxes: true,
			cameraFarMeters: 400000,
			sceneDepthMaxMeters: 300000,
			ferwerda: configuration.conditions['solar-noon'].ferwerda,
		},
	});
	return {
		renderId: 'stellar-ferwerda-diffuse-adapted-full-scene-sunset-noon-v1',
		adaptation: configuration.conditions,
		scenes: [sunset, solarNoon],
	};
}

/**
 * Hold the observer camera on the synchronized sunset bearing while rendering
 * noon, sunset, and sunset plus three hours through the contained adaptation.
 */
export async function runThreeSubjectiveGlobeSunsetFacingThreeTimeComparison() {
	const [configuration, fixture] = await Promise.all([
		fetch('/browser/diffuse-adapted-ferwerda-config.json').then((response) => response.json()),
		fetch('/fixtures/subjective-globe-context-scenes-v1.json').then((response) => response.json()),
	]);
	const base = fixture.scenes.find((scene) => scene.id === 'san-jose-globe-sunset');
	if (!base) throw new Error('Subjective globe fixture is missing San Jose sunset.');
	const sunsetFacingAzimuthDegrees = cameraAzimuthDegreesForLocalDirection(base.directionToSourceUpEastNorth);
	const cameraAzimuthOffsetDegrees = sunsetFacingAzimuthDegrees - base.viewAzimuthDegrees;
	const common = {
		includeDistantReviewBoxes: true,
		cameraFarMeters: 400000,
		sceneDepthMaxMeters: 300000,
	};
	const solarNoon = await runThreeSubjectiveGlobeSunsetWithStarsBrowserPreview({
		cameraAzimuthOffsetDegrees,
		sceneTimeOverride: {
			...SAN_JOSE_SOLAR_NOON,
			...common,
			timeLabel: 'Solar noon',
			ferwerda: configuration.conditions['solar-noon'].ferwerda,
		},
	});
	const sunset = await runThreeSubjectiveGlobeSunsetWithStarsBrowserPreview({
		cameraAzimuthOffsetDegrees,
		sceneTimeOverride: {
			...common,
			timeLabel: 'Sunset',
			ferwerda: configuration.conditions.sunset.ferwerda,
		},
	});
	const sunsetPlusThreeHours = await runThreeSubjectiveGlobeSunsetWithStarsBrowserPreview({
		cameraAzimuthOffsetDegrees,
		sceneTimeOverride: {
			...SAN_JOSE_THREE_HOURS_AFTER_SUNSET,
			...common,
			timeLabel: 'Three hours after sunset',
			ferwerda: configuration.conditions['sunset-plus-three-hours'].ferwerda,
		},
	});
	return {
		renderId: 'stellar-ferwerda-sunset-facing-three-time-v1',
		camera: {
			policy: 'fixed synchronized-sunset bearing',
			viewAzimuthDegrees: sunsetFacingAzimuthDegrees,
			viewElevationDegrees: base.viewElevationDegrees,
		},
		adaptation: configuration.conditions,
		scenes: [solarNoon, sunset, sunsetPlusThreeHours],
	};
}

/** Render the retained ground-and-box context three hours after San Jose sunset. */
export function runThreeSubjectiveGlobeThreeHoursAfterSunsetBrowserPreview() {
	return runThreeSubjectiveGlobeSunsetWithStarsBrowserPreview({
		cameraAzimuthOffsetDegrees: 43,
		cameraElevationOffsetDegrees: 0,
		sceneTimeOverride: {
			...SAN_JOSE_THREE_HOURS_AFTER_SUNSET,
			timeLabel: 'Three hours after sunset',
			includeDistantReviewBoxes: true,
			cameraFarMeters: 400000,
			sceneDepthMaxMeters: 300000,
		},
	});
}

/**
 * Measure the shared observer-local brightness state over a prescribed solar
 * depression grid. This intentionally has no stellar input: it measures only
 * the ordinary scattered sky that drives both Color and Geometry responses.
 */
export async function runThreeSubjectiveGlobeTwilightBrightnessCalibrationBrowserProbe() {
	const [fixture, radiometry, calibration] = await Promise.all([
		fetch('/fixtures/subjective-globe-context-scenes-v1.json').then((response) => response.json()),
		fetch('/fixtures/g4-cpu-sun-disk-transport-v1.json').then((response) => response.json()),
		fetch('/browser/twilight-brightness-calibration-input.json').then((response) => response.json()),
	]);
	if (calibration.schemaVersion !== 'twilight-brightness-calibration-input-v1'
		|| !Array.isArray(calibration.samples)
		|| calibration.samples.length === 0) {
		throw new TypeError('Twilight brightness calibration requires a nonempty v1 sample grid.');
	}
	const sanJose = fixture.scenes.find((scene) => scene.id === 'san-jose-globe-sunset');
	if (!sanJose) throw new Error('Subjective globe fixture is missing San Jose.');
	// The meter is camera-independent. Keep the browser workload small without
	// changing its geometry-owned upper-hemisphere quadrature.
	const meterFixture = {
		...fixture,
		geometry: radiometry.geometry,
		camera: { ...fixture.camera, widthPixels: 160, heightPixels: 100 },
	};
	const measurements = [];
	for (const sample of calibration.samples) {
		if (!Number.isFinite(sample.solarDepressionDegrees)
			|| sample.solarDepressionDegrees < 0
			|| !Array.isArray(sample.directionToSourceUpEastNorth)
			|| sample.directionToSourceUpEastNorth.length !== 3
			|| !sample.directionToSourceUpEastNorth.every(Number.isFinite)) {
			throw new TypeError('Twilight calibration samples require a nonnegative solar depression and finite source direction.');
		}
		const rendered = await renderScene({
			fixture: meterFixture,
			includeSkyProbeSamples: true,
			sceneSpec: {
				...sanJose,
				id: `san-jose-twilight-${sample.solarDepressionDegrees.toFixed(1)}deg`,
				timeLabel: `${sample.solarDepressionDegrees.toFixed(1)} degree solar depression`,
				directionToSourceUpEastNorth: sample.directionToSourceUpEastNorth,
			},
		});
		measurements.push({
			solarDepressionDegrees: sample.solarDepressionDegrees,
			directionToSourceUpEastNorth: sample.directionToSourceUpEastNorth,
			skyIlluminanceLux: rendered.skyIlluminanceLux,
			ambientLighting: rendered.ambientLighting,
			skyProbeSamples: rendered.skyProbeSamples,
			shaderIncludes: rendered.shaderIncludes,
		});
	}
	return {
		probeId: 'twilight-local-brightness-calibration-v1',
		measurementResolution: [meterFixture.camera.widthPixels, meterFixture.camera.heightPixels],
		measurements,
	};
}
