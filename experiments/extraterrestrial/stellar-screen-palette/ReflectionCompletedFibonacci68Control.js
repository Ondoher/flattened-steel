import {DirectionDomainDescriptor} from
	'../candidate/src/algorithm32/domains/DirectionDomainDescriptor.js';
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	NATIVE_48_POSITION_DOMAIN_OWNER,
} from '../candidate/src/algorithm32/domains/consts.js';
import DistantSunConstructionDomainSelection from
	'../candidate/src/algorithm32/light-sources/DistantSunConstructionDomainSelection.js';
import {NATIVE_15_SPECTRAL_BASIS} from
	'../candidate/src/algorithm32/profiles/native-15-profile.js';

/**
 * Pin the ordinary Fibonacci-34 values retained by the current production
 * reflection-completion implementation. Production is a read-only provenance
 * source for this contained control and is never imported at runtime.
 *
 * @type {readonly UnitVector3[]}
 */
export const CONTROL_FIBONACCI_34_UNIT_VECTORS = [
	[-6.118005084603635e-17, 2.5299871800168635e-18, -1],
	[0.2583867092358571, 0.21776859209109395, -0.9411764705882353],
	[-0.06047561872892965, -0.4666861758575938, -0.8823529411764706],
	[-0.32625572688193644, 0.4640651986900299, -0.8235294117647058],
	[0.6293498265705433, -0.1383607939065001, -0.7647058823529411],
	[-0.6128542713455739, -0.3551615771725794, -0.7058823529411765],
	[0.22818601419818665, 0.7274929702870527, -0.6470588235294118],
	[0.34275994505487156, -0.7324580935591514, -0.5882352941176471],
	[-0.784182423271093, 0.3236991047619375, -0.5294117647058824],
	[0.8288129085212791, 0.3026811448889182, -0.47058823529411775],
	[-0.4200200543211491, -0.8087230557846601, -0.4117647058823529],
	[-0.24289760303025734, 0.9035669761526882, -0.35294117647058826],
	[0.8064353434318656, -0.5129881543978481, -0.29411764705882354],
	[-0.9570668804538879, -0.1692916552549343, -0.23529411764705882],
	[0.5988899689069839, 0.7811459125096165, -0.17647058823529416],
	[0.0868185942832923, -0.9892531027178263, -0.11764705882352941],
	[-0.7360920478942543, 0.6743206132207334, -0.058823529411764705],
	[1, 0, 0],
	[-0.7360920478942543, -0.6743206132207334, 0.058823529411764705],
	[0.0868185942832923, 0.9892531027178263, 0.11764705882352941],
	[0.5988899689069839, -0.7811459125096165, 0.17647058823529416],
	[-0.9570668804538879, 0.1692916552549343, 0.23529411764705882],
	[0.8064353434318656, 0.5129881543978481, 0.29411764705882354],
	[-0.24289760303025734, -0.9035669761526882, 0.35294117647058826],
	[-0.4200200543211491, 0.8087230557846601, 0.4117647058823529],
	[0.8288129085212791, -0.3026811448889182, 0.47058823529411775],
	[-0.784182423271093, -0.3236991047619375, 0.5294117647058824],
	[0.34275994505487156, 0.7324580935591514, 0.5882352941176471],
	[0.22818601419818665, -0.7274929702870527, 0.6470588235294118],
	[-0.6128542713455739, 0.3551615771725794, 0.7058823529411765],
	[0.6293498265705433, 0.1383607939065001, 0.7647058823529411],
	[-0.32625572688193644, -0.4640651986900299, 0.8235294117647058],
	[-0.06047561872892965, 0.4666861758575938, 0.8823529411764706],
	[0.2583867092358571, -0.21776859209109395, 0.9411764705882353],
];

export const REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_PROVENANCE = Object.freeze({
	policyId: 'contained-reflection-completed-ordinary-fibonacci-68-control-v1',
	sourcePath:
		'src/algorithm32/sampling-domains/direction/fibonacci/ReflectionCompletedFibonacci68DirectionDomain.js',
	ordinarySourcePath:
		'src/algorithm32/sampling-domains/direction/fibonacci/Fibonacci34DirectionDomain.js',
	operation: 'For every pinned ordinary direction [x,y,z], emit [x,y,z] and [x,-y,z]; assign each one half of the ordinary solid-angle weight.',
	ordinaryDirectionCount: 34,
	ordinaryWeightSteradians: 0.36959913571644626,
});

/** Own the exact reflected ordinary Fibonacci control without production imports. */
export class ReflectionCompletedFibonacci68ControlDomain {
	constructor() {
		this.id = 'contained-reflection-completed-fibonacci-68-incoming-control-v1';
		this.directionCount = CONTROL_FIBONACCI_34_UNIT_VECTORS.length * 2;
		this.unitVectors = CONTROL_FIBONACCI_34_UNIT_VECTORS.flatMap((direction) => [
			/** @type {UnitVector3} */ ([direction[0], direction[1], direction[2]]),
			/** @type {UnitVector3} */ ([direction[0], -direction[1], direction[2]]),
		]);
		this.integrationWeights = {
			values: Array.from(
				{length: this.directionCount},
				() => REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_PROVENANCE
					.ordinaryWeightSteradians * 0.5,
			),
			units: /** @type {const} */ ('steradians'),
		};
		this.descriptor = new DirectionDomainDescriptor({
			id: this.id,
			schemaRevision: 'algorithm32-direction-domain-v1',
			generatorRevision: 'contained-source-plane-reflection-completed-ordinary-fibonacci-v1',
			frame: {
				kind: 'source-local-fibonacci-pinned-frame-v1',
				coordinates: 'source-local',
				handedness: 'right',
				xAxisRole: 'toward-source',
				yAxisRole: 'cross-projected-reference-with-source',
				zAxisRole: 'projected-reference',
				worldProjection: {
					kind: 'threshold-reference-projection-v1',
					primaryReference: [0, 0, 1],
					alternateReference: [0, 1, 0],
					switchAtAbsoluteDot: 0.95,
				},
			},
			topology: {
				kind: 'reflection-completed-fibonacci-sphere-points-v1',
				count: this.directionCount,
				ordinaryCount: CONTROL_FIBONACCI_34_UNIT_VECTORS.length,
				indexing: 'ordinary-index-major-original-then-y-reflection',
				reflection: '[x,y,z] -> [x,-y,z]',
			},
			interpolation: {kind: 'exact-quadrature-nodes-only'},
			precision: 'binary64-pinned-and-exact-reflection',
			count: this.directionCount,
			unitVectors: this.unitVectors,
			integrationWeights: this.integrationWeights,
		});
	}
}

export const REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_DOMAIN =
	new ReflectionCompletedFibonacci68ControlDomain();

export const REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_SELECTION =
	new DistantSunConstructionDomainSelection({
		id: 'contained-distant-sun-native48-reflection-completed-fibonacci68-w27-control-v1',
		positionDomainOwner: NATIVE_48_POSITION_DOMAIN_OWNER,
		incomingDirectionDomain:
			REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_DOMAIN.descriptor,
		incomingUnitVectors:
			REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_DOMAIN.unitVectors,
		incomingIntegrationWeights:
			REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_DOMAIN.integrationWeights,
		outgoingDirectionDomainOwner: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		radiancePackingId:
			'contained-distant-sun-reflection-completed-fibonacci-68-radiance-packing-control-v1',
		scatteringDensityPackingId:
			'contained-distant-sun-w27-scattering-density-packing-control-v1',
	});

/** Prove the exact finite construction facts without allocating a run. */
export function auditReflectionCompletedFibonacci68Control() {
	const domain = REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_DOMAIN;
	let reflectionMismatchCount = 0;
	let partnerWeightMismatchCount = 0;
	let nonFiniteWeightCount = 0;
	let nonPositiveWeightCount = 0;
	let maximumHalfOrdinaryWeightDeltaSteradians = 0;
	let maximumUnitLengthError = 0;
	const expectedPartnerWeightSteradians =
		REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_PROVENANCE
			.ordinaryWeightSteradians * 0.5;
	for (let ordinaryIndex = 0;
		ordinaryIndex < CONTROL_FIBONACCI_34_UNIT_VECTORS.length;
		ordinaryIndex += 1) {
		const ordinary = CONTROL_FIBONACCI_34_UNIT_VECTORS[ordinaryIndex];
		const original = domain.unitVectors[ordinaryIndex * 2];
		const reflected = domain.unitVectors[ordinaryIndex * 2 + 1];
		if (original[0] !== ordinary[0]
			|| original[1] !== ordinary[1]
			|| original[2] !== ordinary[2]
			|| reflected[0] !== ordinary[0]
			|| reflected[1] !== -ordinary[1]
			|| reflected[2] !== ordinary[2]) {
			reflectionMismatchCount += 1;
		}
		if (domain.integrationWeights.values[ordinaryIndex * 2]
			!== domain.integrationWeights.values[ordinaryIndex * 2 + 1]) {
			partnerWeightMismatchCount += 1;
		}
		for (const weight of [
			domain.integrationWeights.values[ordinaryIndex * 2],
			domain.integrationWeights.values[ordinaryIndex * 2 + 1],
		]) {
			if (!Number.isFinite(weight)) nonFiniteWeightCount += 1;
			if (!(weight > 0)) nonPositiveWeightCount += 1;
			maximumHalfOrdinaryWeightDeltaSteradians = Math.max(
				maximumHalfOrdinaryWeightDeltaSteradians,
				Math.abs(weight - expectedPartnerWeightSteradians),
			);
		}
		for (const direction of [original, reflected]) {
			maximumUnitLengthError = Math.max(
				maximumUnitLengthError,
				Math.abs(Math.hypot(...direction) - 1),
			);
		}
	}
	const totalWeightSteradians = domain.integrationWeights.values
		.reduce((total, weight) => total + weight, 0);
	const totalWeightErrorSteradians = Math.abs(totalWeightSteradians - 4 * Math.PI);
	return {
		policyId: REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_PROVENANCE.policyId,
		directionCount: domain.directionCount,
		ordinaryDirectionCount: CONTROL_FIBONACCI_34_UNIT_VECTORS.length,
		totalWeightSteradians,
		totalWeightErrorSteradians,
		reflectionMismatchCount,
		partnerWeightMismatchCount,
		nonFiniteWeightCount,
		nonPositiveWeightCount,
		expectedPartnerWeightSteradians,
		maximumHalfOrdinaryWeightDeltaSteradians,
		maximumUnitLengthError,
		descriptorId: domain.descriptor.id,
		descriptorContentHash: domain.descriptor.contentHash,
		selectionId: REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_SELECTION.id,
	};
}
