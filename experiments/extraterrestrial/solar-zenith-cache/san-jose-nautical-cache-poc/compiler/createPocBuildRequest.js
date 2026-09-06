import {createCubedSphereW39DirectionDomain} from
	'../domains/cubedSphereW39DirectionDomain.js';
import {createNative15SpectralDomain} from
	'../domains/native15SpectralDomain.js';
import {createNative48PositionDomain} from
	'../domains/native48PositionDomain.js';
import {createReflectionCompletedFibonacci68Domain} from
	'../domains/reflectionCompletedFibonacci68Domain.js';
import {createSolarZenith180Domain} from
	'../domains/solarZenith180Domain.js';
import {createObserverSunCanonicalFrame} from
	'../geometry/ObserverSunCanonicalFrame.js';
import {createPocTransportSpec} from
	'../fixtures/createPocTransportSpec.js';
import {SAN_JOSE_NAUTICAL_SCENE} from
	'../fixtures/sanJoseNauticalScene.js';

/** Create every executable ZP1 domain under its own physical identity. */
export function createPocDomainSet() {
	const position = createNative48PositionDomain();
	const solarZenith = createSolarZenith180Domain();
	const incoming = createReflectionCompletedFibonacci68Domain();
	const solverOutgoing = createCubedSphereW39DirectionDomain({
		id: 'san-jose-poc-source-relative-cubed-sphere-w39-v1',
		frame: 'actual-point-source-relative',
	});
	const scenePageOutgoing = createCubedSphereW39DirectionDomain({
		id: 'san-jose-poc-observer-sun-canonical-cubed-sphere-w39-v1',
		frame: 'observer-up-sun-horizontal-canonical',
	});
	const spectrum = createNative15SpectralDomain();

	return Object.freeze({
		position,
		solarZenith,
		incoming,
		solverOutgoing,
		scenePageOutgoing,
		spectrum,
	});
}

function requireScene(scene) {
	if (scene === null || typeof scene !== 'object') {
		throw new TypeError('Scene-page request requires a scene object.');
	}
	if (typeof scene.id !== 'string' || scene.id.length === 0) {
		throw new TypeError('Scene-page request scene id must be non-empty.');
	}
	return scene;
}

/** Create one independently addressable cumulative-density scene page. */
export function createScenePageRequest({id, scene, domains, positionDomain = null}) {
	if (typeof id !== 'string' || id.length === 0) {
		throw new TypeError('Scene-page request id must be non-empty.');
	}
	const acceptedScene = requireScene(scene);
	if (domains === null || typeof domains !== 'object') {
		throw new TypeError('Scene-page request domains are required.');
	}
	const canonicalFrame = createObserverSunCanonicalFrame({
		observerUpDirectionUpEastNorth:
			acceptedScene.observer.upDirectionUpEastNorth,
		directionToSourceUpEastNorth:
			acceptedScene.directionToSourceUpEastNorth,
	});
	const pagePositionDomain = positionDomain ?? domains.position;
	if (!Number.isInteger(pagePositionDomain?.count)
		|| pagePositionDomain.count <= 1
		|| !Array.isArray(pagePositionDomain.nodes)
		|| pagePositionDomain.nodes.length !== pagePositionDomain.count) {
		throw new TypeError('Scene-page position domain is invalid.');
	}
	const logicalSpectrumCount =
		pagePositionDomain.count
		* domains.scenePageOutgoing.directionCount;
	const scalarCount = logicalSpectrumCount * domains.spectrum.channelCount;

	return Object.freeze({
		id,
		kind: 'actual-point-cumulative-density-scene-page-request',
		scene: acceptedScene,
		observer: Object.freeze({
			location: acceptedScene.location,
			heightMeters: acceptedScene.observer.heightMeters,
			upDirectionUpEastNorth:
				acceptedScene.observer.upDirectionUpEastNorth,
		}),
		sourceState: Object.freeze({
			timeIso: acceptedScene.timeIso,
			directionToSourceUpEastNorth:
				acceptedScene.directionToSourceUpEastNorth,
			solarElevationDegrees: acceptedScene.solarElevationDegrees,
			solarZenithDegrees: canonicalFrame.solarZenithDegrees,
		}),
		canonicalFrame,
		domains: Object.freeze({
			position: pagePositionDomain,
			outgoing: domains.scenePageOutgoing,
			spectrum: domains.spectrum,
		}),
		storedSemantic: Object.freeze({
			quantity: 'cumulative local spectral scattering density through N4',
			units: 'W m^-3 sr^-1 nm^-1',
		}),
		storage: Object.freeze({
			format: 'R32F',
			axes: Object.freeze({
				x: 'canonical observer-ray outgoing direction',
				y: 'Native48 altitude',
				layer: 'Native15 wavelength',
			}),
			logicalSpectrumCount,
			scalarCount,
			logicalBytes: scalarCount * 4,
		}),
	});
}

function requireUniquePageIds(scenePageRequests) {
	const ids = new Set();
	for (const page of scenePageRequests) {
		if (ids.has(page.id)) {
			throw new RangeError(`Duplicate scene-page request id: ${page.id}.`);
		}
		ids.add(page.id);
	}
}

/** Create one complete build request from an ordered list of page definitions. */
export function createPocBuildRequest({id, scenePageDefinitions}) {
	if (typeof id !== 'string' || id.length === 0) {
		throw new TypeError('POC build request id must be non-empty.');
	}
	if (!Array.isArray(scenePageDefinitions)
		|| scenePageDefinitions.length === 0) {
		throw new TypeError(
			'scenePageDefinitions must be a non-empty ordered array.',
		);
	}
	const domains = createPocDomainSet();
	const transportSpec = createPocTransportSpec({domains: Object.freeze({
		position: domains.position,
		solarZenith: domains.solarZenith,
		incoming: domains.incoming,
		outgoing: domains.solverOutgoing,
		spectrum: domains.spectrum,
	})});
	const scenePageRequests = Object.freeze(scenePageDefinitions.map(
		(definition) => createScenePageRequest({
			id: definition.id,
			scene: definition.scene,
			domains,
			positionDomain: definition.positionDomain,
		}),
	));
	requireUniquePageIds(scenePageRequests);

	return Object.freeze({
		id,
		kind: 'solar-zenith-scene-cache-build-request',
		transportSpec,
		scenePageRequests,
		outputPolicy: Object.freeze({
			pageIndependence: 'each page is independently stored and hashed',
			incrementalAddition:
				'new immutable runs add pages without modifying earlier pages',
			collectionAssembly:
				'new manifests may reference compatible pages from preserved runs',
		}),
	});
}

/**
 * Create the first one-page request through the same ordered-list interface
 * used by future incremental scene additions.
 */
export function createSanJoseNauticalPocBuildRequest({
	additionalScenePageDefinitions = [],
} = {}) {
	if (!Array.isArray(additionalScenePageDefinitions)) {
		throw new TypeError('additionalScenePageDefinitions must be an array.');
	}
	return createPocBuildRequest({
		id: 'san-jose-nautical-actual-point-cache-poc-build-v1',
		scenePageDefinitions: [
			{
				id: 'san-jose-sunset-plus-one-hour-native15-c4-page-v1',
				scene: SAN_JOSE_NAUTICAL_SCENE,
			},
			...additionalScenePageDefinitions,
		],
	});
}

export default createSanJoseNauticalPocBuildRequest;
