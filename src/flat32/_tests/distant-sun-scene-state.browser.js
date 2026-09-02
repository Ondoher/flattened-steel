import {createDistantSunSceneState} from '../DistantSunSceneState.js';
import {SphericalDistantMode} from '../SphericalDistantMode.js';
import {
	ATMOSPHERE_OBSERVER_HEIGHT,
	ATMOSPHERE_OBSERVER_UP_DIRECTION,
	ATMOSPHERE_SCENE_SCALE,
	ATMOSPHERE_SOURCE_ANGULAR_RADIUS,
} from '../consts.js';

const OBSERVATION = {
	instant: '2024-06-21T04:26:03.503Z',
	location: {
		latitude: {value: 37.3382, units: 'degrees'},
		longitude: {value: -121.8863, units: 'degrees'},
	},
};
const CANONICAL_SCENE_SUN = {
	id: 'solar-zenith-100-degrees',
	instant: '2000-01-01T12:00:00.000Z',
	directionToSourceUpEastNorth: [-0.1736481776669303, -0.984807753012208, 0],
	sourceIdentity: 'algorithm32-native-distant-collimated-sun-v1',
};
const ASSET = {
	assetRoot: '/scene-caches/packages/0000000000000000000000000000000000000000000000000000000000000000/',
	loadRequest: {
		manifestPath: `scene-cache-manifest-${'0'.repeat(64)}.json`,
		manifestSha256: '0'.repeat(64),
		cacheIdentity: `algorithm32-distant-sun-scene-cache-sha256:${'0'.repeat(64)}`,
		expected: {sceneSun: CANONICAL_SCENE_SUN},
	},
};

describe('Flat32 distant-Sun scene state', () => {
	it('derives one live placement and scalar from the observation', () => {
		const sceneState = createDistantSunSceneState({
			observation: OBSERVATION,
			observerHeight: ATMOSPHERE_OBSERVER_HEIGHT,
			observerUpDirection: ATMOSPHERE_OBSERVER_UP_DIRECTION,
		});

		expect(Math.hypot(...sceneState.directionToSourceModel)).toBeCloseTo(1, 12);
		expect(sceneState.solarZenithDegrees).toBeCloseTo(99.74525026663457, 12);
	});

	it('installs the observation direction while retaining canonical package provenance', () => {
		const sceneState = createDistantSunSceneState({
			observation: OBSERVATION,
			observerHeight: ATMOSPHERE_OBSERVER_HEIGHT,
			observerUpDirection: ATMOSPHERE_OBSERVER_UP_DIRECTION,
		});
		const canonicalModelDirection = [
			CANONICAL_SCENE_SUN.directionToSourceUpEastNorth[1],
			CANONICAL_SCENE_SUN.directionToSourceUpEastNorth[2],
			CANONICAL_SCENE_SUN.directionToSourceUpEastNorth[0],
		];
		const mode = new SphericalDistantMode({
			sceneState,
			sceneScale: ATMOSPHERE_SCENE_SCALE,
			sourceAngularRadius: ATMOSPHERE_SOURCE_ANGULAR_RADIUS,
			maximumScatteringOrder: 4,
			sceneCacheAsset: ASSET,
		});

		expect(mode.geometry.configuration.directionToSource).toEqual(sceneState.directionToSourceModel);
		expect(
			mode.geometry.configuration.directionToSource.some(
				(value, index) => Math.abs(value - canonicalModelDirection[index]) > 1e-6,
			),
		).toBeTrue();
		expect(ASSET.loadRequest.expected.sceneSun).toBe(CANONICAL_SCENE_SUN);
		expect(Object.hasOwn(ASSET, 'directionToSourceModel')).toBeFalse();

		mode.dispose();
	});

	it('keeps celestial enablement independent from basic Bruneton selection', () => {
		const createMode = (celestialSourcesEnabled) =>
			new SphericalDistantMode({
				sceneState: createDistantSunSceneState({
					observation: OBSERVATION,
					observerHeight: ATMOSPHERE_OBSERVER_HEIGHT,
					observerUpDirection: ATMOSPHERE_OBSERVER_UP_DIRECTION,
				}),
				sceneScale: ATMOSPHERE_SCENE_SCALE,
				sourceAngularRadius: ATMOSPHERE_SOURCE_ANGULAR_RADIUS,
				maximumScatteringOrder: 4,
				sceneCacheAsset: ASSET,
				celestialSourcesEnabled,
				colorDisplayModelConfiguration: {model: 'basic-bruneton'},
			});
		const enabled = createMode(true);
		const disabled = createMode(false);

		expect(enabled.algorithm32._model.celestialSources).not.toBeNull();
		expect(disabled.algorithm32._model.celestialSources).toBeNull();

		enabled.dispose();
		disabled.dispose();
	});
});
