import {SAN_JOSE_NAUTICAL_SCENE} from
	'../san-jose-nautical-cache-poc/fixtures/sanJoseNauticalScene.js';
import {SAN_JOSE_SCATTERING_SCENE_SEQUENCE} from
	'../san-jose-nautical-cache-poc/fixtures/sanJoseScatteringSceneSequence.js';
import {POINT_LOCAL_SCENE_CACHE_CONTRACT as CONTRACT} from './sceneCacheContract.js';

const support = CONTRACT.scenes[0].support;

function cacheScene(scene) {
	return Object.freeze({id: scene.id,
		cacheIdentity: `san-jose-${scene.id}-point-local-c4-native15-n4-v1`,
		label: scene.timeLabel ? `San Jose ${scene.timeLabel.toLowerCase()}`
			: 'San Jose one hour after sunset',
		timeIso: scene.timeIso,
		directionToSourceUpEastNorth: scene.directionToSourceUpEastNorth,
		solarElevationDegrees: scene.solarElevationDegrees,
		observerSolarZenithDegrees: 90 - scene.solarElevationDegrees,
		support});
}

const orderedFixtures = [SAN_JOSE_NAUTICAL_SCENE,
	...SAN_JOSE_SCATTERING_SCENE_SEQUENCE.filter((scene) => scene.id !== 'solar-noon'),
	SAN_JOSE_SCATTERING_SCENE_SEQUENCE.find((scene) => scene.id === 'solar-noon')];

export const SIX_SCENE_FIXTURES = Object.freeze(orderedFixtures);
export const SIX_CACHE_SCENES = Object.freeze(orderedFixtures.map(cacheScene));
export const MISSING_CACHE_SCENES = Object.freeze(SIX_CACHE_SCENES.slice(1, 5));
