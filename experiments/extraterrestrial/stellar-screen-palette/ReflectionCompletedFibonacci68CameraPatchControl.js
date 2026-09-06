import {NATIVE_48_POSITION_DOMAIN_OWNER} from
	'../candidate/src/algorithm32/domains/consts.js';
import DistantSunConstructionDomainSelection from
	'../candidate/src/algorithm32/light-sources/DistantSunConstructionDomainSelection.js';
import {NATIVE_15_SPECTRAL_BASIS} from
	'../candidate/src/algorithm32/profiles/native-15-profile.js';
import {
	CAMERA_FACING_PATCH_POLICY_ID,
} from './CameraFacingOutgoingPatchSphericalEarthGeometry.js';
import {
	REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_DOMAIN,
	REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_PROVENANCE,
} from './ReflectionCompletedFibonacci68Control.js';

export function createReflectionCompletedFibonacci68CameraPatchControl(
	outgoingDirectionDomainOwner,
) {
	if (outgoingDirectionDomainOwner?.descriptor?.id
		!== CAMERA_FACING_PATCH_POLICY_ID) {
		throw new TypeError(
			'Camera-patch F68 control requires the exact contained outgoing owner.',
		);
	}
	const selection = new DistantSunConstructionDomainSelection({
		id: 'contained-distant-sun-native48-reflection-completed-fibonacci68-camera-facing-patch-control-v1',
		positionDomainOwner: NATIVE_48_POSITION_DOMAIN_OWNER,
		incomingDirectionDomain:
			REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_DOMAIN.descriptor,
		incomingUnitVectors:
			REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_DOMAIN.unitVectors,
		incomingIntegrationWeights:
			REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_DOMAIN.integrationWeights,
		outgoingDirectionDomainOwner,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		radiancePackingId:
			'contained-distant-sun-reflection-completed-fibonacci-68-radiance-packing-control-v1',
		scatteringDensityPackingId:
			'contained-distant-sun-camera-facing-patch-over-w39-scattering-density-packing-v1',
	});
	return {
		selection,
		provenance: Object.freeze({
			schemaId:
				'contained-reflection-completed-fibonacci68-camera-facing-patch-control-v1',
			operation:
				'retain exact reflected ordinary F68 incoming quadrature and append a complete-view camera-aligned W77-density patch over unchanged W39 outgoing storage',
			incomingPolicy: REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_PROVENANCE,
			incomingDirectionDomain:
				REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_DOMAIN.descriptor,
			outgoingPolicyId: CAMERA_FACING_PATCH_POLICY_ID,
			outgoingDirectionDomain: outgoingDirectionDomainOwner.descriptor,
			selectionId: selection.id,
		}),
	};
}

export default createReflectionCompletedFibonacci68CameraPatchControl;
