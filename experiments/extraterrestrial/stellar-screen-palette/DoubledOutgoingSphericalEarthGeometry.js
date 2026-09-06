import CubedSphereDirectionDomain from
	'../candidate/src/algorithm32/domains/CubedSphereDirectionDomain.js';
import {
	FIBONACCI_34_DIRECTION_DOMAIN_OWNER,
	NATIVE_48_POSITION_DOMAIN_OWNER,
} from '../candidate/src/algorithm32/domains/consts.js';
import {
	SphericalEarthGeometry,
} from '../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
import DistantSunConstructionDomainSelection from
	'../candidate/src/algorithm32/light-sources/DistantSunConstructionDomainSelection.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
} from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import {
	createShaderContribution,
} from '../candidate/src/algorithm32/shader/shaderContribution.js';

export const DOUBLED_OUTGOING_FACE_WIDTH = 39;
export const DOUBLED_OUTGOING_DIRECTION_COUNT =
	6 * DOUBLED_OUTGOING_FACE_WIDTH * DOUBLED_OUTGOING_FACE_WIDTH;
export const DOUBLED_OUTGOING_DIRECTION_POLICY_ID =
	'contained-spherical-cubed-sphere-w39-outgoing-v1';

const RUNTIME_STENCIL_BLOCK_ID = 'geometry-cache-stencils';

/** Permit the one contained W39 experiment without widening candidate policy. */
class CubedSphereW39DirectionDomain extends CubedSphereDirectionDomain {
	_acceptDefinition(definition) {
		if (definition?.id !== DOUBLED_OUTGOING_DIRECTION_POLICY_ID
			|| definition?.faceWidth !== DOUBLED_OUTGOING_FACE_WIDTH) {
			throw new RangeError(
				'Contained doubled-outgoing domain requires the exact W39 policy.',
			);
		}

		return {
			id: definition.id,
			faceWidth: definition.faceWidth,
		};
	}
}

export const CUBED_SPHERE_W39_DIRECTION_DOMAIN_OWNER =
	new CubedSphereW39DirectionDomain({
		id: DOUBLED_OUTGOING_DIRECTION_POLICY_ID,
		faceWidth: DOUBLED_OUTGOING_FACE_WIDTH,
	});

export const DOUBLED_OUTGOING_DISTANT_SUN_DOMAIN_SELECTION =
	new DistantSunConstructionDomainSelection({
		id: 'contained-distant-sun-native48-fibonacci34-w39-v1',
		positionDomainOwner: NATIVE_48_POSITION_DOMAIN_OWNER,
		incomingDirectionDomain:
			FIBONACCI_34_DIRECTION_DOMAIN_OWNER.descriptor,
		incomingUnitVectors:
			FIBONACCI_34_DIRECTION_DOMAIN_OWNER.unitVectors,
		incomingIntegrationWeights:
			FIBONACCI_34_DIRECTION_DOMAIN_OWNER.integrationWeights,
		outgoingDirectionDomainOwner:
			CUBED_SPHERE_W39_DIRECTION_DOMAIN_OWNER,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		radiancePackingId:
			'contained-distant-sun-fibonacci34-radiance-packing-w39-v1',
		scatteringDensityPackingId:
			'contained-distant-sun-w39-scattering-density-packing-v1',
	});

function exactOccurrenceCount(source, expected) {
	let count = 0;
	let offset = 0;
	while (offset <= source.length - expected.length) {
		const index = source.indexOf(expected, offset);
		if (index < 0) break;
		count += 1;
		offset = index + expected.length;
	}
	return count;
}

function replaceExact(source, expected, replacement, label) {
	const count = exactOccurrenceCount(source, expected);
	if (count !== 1) {
		throw new Error(
			`W39 runtime adapter expected one ${label}, found ${count}.`,
		);
	}
	return source.replace(expected, replacement);
}

function patchRuntimeStencil(source) {
	let patched = source;
	const replacements = [
		[
			'float uGrid = clamp((clamp(u, -1.0, 1.0) + 1.0) * 13.0, 0.0, 26.0);',
			'float uGrid = clamp((clamp(u, -1.0, 1.0) + 1.0) * 19.0, 0.0, 38.0);',
		],
		[
			'float vGrid = clamp((clamp(v, -1.0, 1.0) + 1.0) * 13.0, 0.0, 26.0);',
			'float vGrid = clamp((clamp(v, -1.0, 1.0) + 1.0) * 19.0, 0.0, 38.0);',
		],
		[
			'int uUpper = uExact ? uLower : min(uLower + 1, 26);',
			'int uUpper = uExact ? uLower : min(uLower + 1, 38);',
		],
		[
			'int vUpper = vExact ? vLower : min(vLower + 1, 26);',
			'int vUpper = vExact ? vLower : min(vLower + 1, 38);',
		],
		[
			'int faceOffset = faceIndex * 729;',
			'int faceOffset = faceIndex * 1521;',
		],
		[
			'faceOffset + vLower * 27 + uLower,',
			'faceOffset + vLower * 39 + uLower,',
		],
		[
			'faceOffset + vLower * 27 + uUpper,',
			'faceOffset + vLower * 39 + uUpper,',
		],
		[
			'faceOffset + vUpper * 27 + uLower,',
			'faceOffset + vUpper * 39 + uLower,',
		],
		[
			'faceOffset + vUpper * 27 + uUpper',
			'faceOffset + vUpper * 39 + uUpper',
		],
	];

	for (const [expected, replacement] of replacements) {
		patched = replaceExact(
			patched,
			expected,
			replacement,
			`runtime stencil fragment ${JSON.stringify(expected)}`,
		);
	}
	return patched;
}

/**
 * Keep spherical physics and the source-aligned cubed-sphere frame unchanged,
 * while replacing only the W27 outgoing lattice and its final-view addresses.
 */
export class DoubledOutgoingSphericalEarthGeometry
	extends SphericalEarthGeometry {
	describe() {
		return {
			...super.describe(),
			containedOutgoingDirectionDomain: {
				policy: DOUBLED_OUTGOING_DIRECTION_POLICY_ID,
				id: CUBED_SPHERE_W39_DIRECTION_DOMAIN_OWNER.descriptor.id,
				contentHash:
					CUBED_SPHERE_W39_DIRECTION_DOMAIN_OWNER.descriptor.contentHash,
				faceWidth: DOUBLED_OUTGOING_FACE_WIDTH,
				directionCount: DOUBLED_OUTGOING_DIRECTION_COUNT,
			},
		};
	}

	resolveScatteringCacheDirectionStencil(request) {
		return CUBED_SPHERE_W39_DIRECTION_DOMAIN_OWNER.resolveStencil(
			this.expressScatteringCacheDirection(request),
		);
	}

	createShaderContribution(request) {
		const contribution = super.createShaderContribution(request);
		const matching = contribution.functions.filter(
			(block) => block.id === RUNTIME_STENCIL_BLOCK_ID,
		);
		if (matching.length !== 1) {
			throw new Error(
				`W39 runtime adapter expected one ${RUNTIME_STENCIL_BLOCK_ID} block.`,
			);
		}
		const functions = contribution.functions.map((block) =>
			block.id === RUNTIME_STENCIL_BLOCK_ID
				? {...block, code: patchRuntimeStencil(block.code)}
				: block);

		return createShaderContribution({
			...contribution,
			id: `${contribution.id}:${DOUBLED_OUTGOING_DIRECTION_POLICY_ID}`,
			functions,
			diagnostics: {
				...(contribution.diagnostics ?? {}),
				containedOutgoingDirectionDomain: this.describe()
					.containedOutgoingDirectionDomain,
			},
		});
	}
}

export default DoubledOutgoingSphericalEarthGeometry;
