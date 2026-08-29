import {
	createPocDomainSet,
	createScenePageRequest,
} from '../san-jose-nautical-cache-poc/compiler/createPocBuildRequest.js';
import {createPocTransportSpec} from
	'../san-jose-nautical-cache-poc/fixtures/createPocTransportSpec.js';
import {SAN_JOSE_SCATTERING_SCENE_SEQUENCE} from
	'../san-jose-nautical-cache-poc/fixtures/sanJoseScatteringSceneSequence.js';
import {createP6NearGround48PositionDomain} from './p6RadialDomain.js';

export function createP6RadialBuildRequest() {
	const inherited = createPocDomainSet();
	const position = createP6NearGround48PositionDomain();
	const transportDomains = Object.freeze({
		position,
		solarZenith: inherited.solarZenith,
		incoming: inherited.incoming,
		outgoing: inherited.solverOutgoing,
		spectrum: inherited.spectrum,
	});
	const solarNoon = SAN_JOSE_SCATTERING_SCENE_SEQUENCE.find(
		(scene) => scene.id === 'solar-noon',
	);
	const pageDomains = Object.freeze({...inherited, position});
	const scenePageRequests = Object.freeze([createScenePageRequest({
		id: 'p6-solar-noon-quadratic-radial-c4-w39-v1',
		scene: solarNoon,
		domains: pageDomains,
		positionDomain: position,
	})]);
	return Object.freeze({
		id: 'p6-solar-noon-quadratic-radial-build-v1',
		kind: 'solar-zenith-scene-cache-build-request',
		transportSpec: createPocTransportSpec({domains: transportDomains}),
		scenePageRequests,
		outputPolicy: Object.freeze({
			pageIndependence: 'one independently stored and hashed diagnostic cache',
			isolatedVariable: 'altitude-node distribution only',
		}),
	});
}

