import {createNative15SpectralDomain} from
	'../san-jose-nautical-cache-poc/domains/native15SpectralDomain.js';
import {createNative48PositionDomain} from
	'../san-jose-nautical-cache-poc/domains/native48PositionDomain.js';
import {createReflectionCompletedFibonacci68Domain} from
	'../san-jose-nautical-cache-poc/domains/reflectionCompletedFibonacci68Domain.js';
import {createSolarZenith180Domain} from
	'../san-jose-nautical-cache-poc/domains/solarZenith180Domain.js';
import {createPocTransportSpec} from
	'../san-jose-nautical-cache-poc/fixtures/createPocTransportSpec.js';
import {createB1W27DirectionDomain} from './b1PointLocalInputs.js';

/** Build request for the selected Native48/Z180/W27/F68/N4 Native15 cache. */
export function createSelectedW27BuildRequest() {
	const domains = Object.freeze({
		position: createNative48PositionDomain(),
		solarZenith: createSolarZenith180Domain(),
		incoming: createReflectionCompletedFibonacci68Domain(),
		outgoing: createB1W27DirectionDomain(),
		spectrum: createNative15SpectralDomain(),
	});
	const base = createPocTransportSpec({domains});
	return Object.freeze({
		id: 'selected-native48-z180-w27-f68-native15-n4-v1',
		transportSpec: Object.freeze({...base,
			id: 'selected-san-jose-native15-w27-point-local-transport-v1'}),
	});
}

export default createSelectedW27BuildRequest;
