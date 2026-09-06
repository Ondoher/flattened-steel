import {NATIVE_48_POSITION_DOMAIN_OWNER} from
	'../candidate/src/algorithm32/domains/consts.js';
import DistantSunConstructionDomainSelection from
	'../candidate/src/algorithm32/light-sources/DistantSunConstructionDomainSelection.js';
import {NATIVE_15_SPECTRAL_BASIS} from
	'../candidate/src/algorithm32/profiles/native-15-profile.js';
import {CUBED_SPHERE_W39_DIRECTION_DOMAIN_OWNER} from
	'./DoubledOutgoingSphericalEarthGeometry.js';
import {
	REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_DOMAIN,
	REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_PROVENANCE,
} from './ReflectionCompletedFibonacci68Control.js';

/**
 * Combine the retained reflection-completed F68 incoming quadrature with the
 * contained W39 outgoing cache lattice. No physical or numerical owner other
 * than those two angular domains changes.
 */
export const REFLECTION_COMPLETED_FIBONACCI_68_W39_CONTROL_SELECTION =
	new DistantSunConstructionDomainSelection({
		id: 'contained-distant-sun-native48-reflection-completed-fibonacci68-w39-control-v1',
		positionDomainOwner: NATIVE_48_POSITION_DOMAIN_OWNER,
		incomingDirectionDomain:
			REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_DOMAIN.descriptor,
		incomingUnitVectors:
			REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_DOMAIN.unitVectors,
		incomingIntegrationWeights:
			REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_DOMAIN.integrationWeights,
		outgoingDirectionDomainOwner:
			CUBED_SPHERE_W39_DIRECTION_DOMAIN_OWNER,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		radiancePackingId:
			'contained-distant-sun-reflection-completed-fibonacci-68-radiance-packing-control-v1',
		scatteringDensityPackingId:
			'contained-distant-sun-w39-scattering-density-packing-v1',
	});

export const REFLECTION_COMPLETED_FIBONACCI_68_W39_CONTROL = Object.freeze({
	schemaId: 'contained-reflection-completed-fibonacci68-w39-control-v1',
	operation: 'combine the exact reflected ordinary F68 incoming quadrature with the W39 outgoing cubed-sphere lattice',
	incomingPolicy: REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_PROVENANCE,
	incomingDirectionDomain:
		REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_DOMAIN.descriptor,
	outgoingDirectionDomain:
		CUBED_SPHERE_W39_DIRECTION_DOMAIN_OWNER.descriptor,
	selectionId: REFLECTION_COMPLETED_FIBONACCI_68_W39_CONTROL_SELECTION.id,
});

export default REFLECTION_COMPLETED_FIBONACCI_68_W39_CONTROL_SELECTION;
