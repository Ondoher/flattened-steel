import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {NATIVE_51_NEAR_GROUND_POSITION_DOMAIN_OWNER} from '../../../src/algorithm32/sampling-domains/position/spherical-native/consts.js';
import {SphericalNativePositionDomains} from '../../../src/algorithm32/sampling-domains/position/spherical-native/SphericalNativePositionDomains.js';

const N_ORDER_CONTROLS = Object.freeze({
	pathIntervalCount: 40,
	sourceTransmittanceIntervalCount: 20,
	incidentDirectionCount: 68,
	incidentAltitudeBinCount: 48,
	incomingDirectionDomain: 'algorithm32-reflection-completed-fibonacci-68-incoming-v1',
	scatteringOutputDomain: 'source-aligned-boundary-inclusive-gnomonic-cubed-sphere-w27',
	scatteringOutputFaceWidth: 27,
	scatteringOutputDirectionCount: 4374,
	positionNodeCount: 48,
	positionLookup: 'view-only-linear-physical-altitude-over-actual-nodes',
});

const RETAINED_NATIVE_N_ORDER_CONTROLS = Object.freeze({
	...N_ORDER_CONTROLS,
	incidentDirectionCount: 34,
	incomingDirectionDomain: 'source-oriented-fibonacci-pinned-34',
});

export const PAPER_PHYSICAL_PROFILE_ID = 'algorithm32-paper-comparison-v1';
export const PAPER_PHYSICAL_PROFILE_CONTENT_HASH =
	'sha256:d47601d954167ca8775c0a88cd8ca9b9527ae8e74a6f42ae6041eec3244aeecc';

const SUBSCRIPT_DIGITS = Object.freeze({
	0: '₀',
	1: '₁',
	2: '₂',
	3: '₃',
	4: '₄',
	5: '₅',
	6: '₆',
	7: '₇',
	8: '₈',
	9: '₉',
});

export function algorithm32DisplayName(order, {explicitDefault = true} = {}) {
	if (!Number.isInteger(order) || order < 1) {
		throw new RangeError(`Algorithm32 scattering order must be a positive integer, not ${order}.`);
	}
	if (order === 4 && !explicitDefault) return 'Algorithm32';
	return `Algorithm32${String(order)
		.split('')
		.map((digit) => SUBSCRIPT_DIGITS[digit])
		.join('')}`;
}

function nOrderProfile(order) {
	return Object.freeze({
		id: `Algorithm32-J${order}`,
		label: `${algorithm32DisplayName(order)} (cumulative scattering through order ${order})`,
		role: 'comparative',
		controls: Object.freeze({
			...RETAINED_NATIVE_N_ORDER_CONTROLS,
			maximumScatteringOrder: order,
		}),
	});
}
function paperNOrderProfile(order) {
	return Object.freeze({
		id: `Algorithm32-Paper-J${order}`,
		label: `${algorithm32DisplayName(order)} (paper profile; cumulative scattering through order ${order})`,
		role: 'comparative paper-input profile',
		provenanceProfileId: `paper-j${order}`,
		presentationName: `Algorithm32 Paper J${order}`,
		spectralChannelCount: 40,
		spectralProjection: 'identity-direct-40',
		physicalProfileId: PAPER_PHYSICAL_PROFILE_ID,
		physicalProfileContentHash: PAPER_PHYSICAL_PROFILE_CONTENT_HASH,
		controls: Object.freeze({
			...N_ORDER_CONTROLS,
			maximumScatteringOrder: order,
		}),
	});
}

function paperLebedev38Profile(order, rotationKind = 'none') {
	const rotationSuffix =
		rotationKind === 'cube-diagonal' ? '-Rotated' : rotationKind === 'near-horizon' ? '-Near-Horizon' : '';
	const profileSuffix =
		rotationKind === 'cube-diagonal' ? '-rotated' : rotationKind === 'near-horizon' ? '-near-horizon' : '';
	const labelSuffix =
		rotationKind === 'cube-diagonal'
			? ' cube-diagonal-rotated'
			: rotationKind === 'near-horizon'
				? ' five-degree near-horizon'
				: '';
	const presentationSuffix =
		rotationKind === 'cube-diagonal' ? ' Rotated' : rotationKind === 'near-horizon' ? ' Near-Horizon' : '';
	const incomingDirectionDomain =
		rotationKind === 'cube-diagonal'
			? 'source-local-lebedev-38-degree9-cube-diagonal-rotated'
			: rotationKind === 'near-horizon'
				? 'source-local-lebedev-38-degree9-five-degree-near-horizon'
				: 'source-local-lebedev-38-degree9';
	return Object.freeze({
		...paperNOrderProfile(order),
		id: `Algorithm32-Paper-J${order}-Lebedev38${rotationSuffix}`,
		label: `${algorithm32DisplayName(order)} (paper profile; experimental Lebedev-38${labelSuffix} incoming quadrature)`,
		provenanceProfileId: `paper-j${order}-lebedev38${profileSuffix}`,
		presentationName: `Algorithm32 Paper J${order} Experimental Lebedev-38${presentationSuffix}`,
		controls: Object.freeze({
			...N_ORDER_CONTROLS,
			incidentDirectionCount: 38,
			incomingDirectionDomain,
			maximumScatteringOrder: order,
		}),
	});
}

function paperPairedFibonacciProfile(order, directionCount) {
	return Object.freeze({
		...paperNOrderProfile(order),
		id: `Algorithm32-Paper-J${order}-Paired-Fibonacci-${directionCount}`,
		label: `${algorithm32DisplayName(order)} (paper profile; experimental paired Fibonacci-${directionCount} incoming quadrature)`,
		provenanceProfileId: `paper-j${order}-paired-fibonacci-${directionCount}`,
		presentationName: `Algorithm32 Paper J${order} Experimental Paired Fibonacci-${directionCount}`,
		controls: Object.freeze({
			...N_ORDER_CONTROLS,
			incidentDirectionCount: directionCount,
			incomingDirectionDomain: `source-local-paired-fibonacci-${directionCount}`,
			maximumScatteringOrder: order,
		}),
	});
}

function paperReflectionCompleted136Profile(order, {defaultProfile = false} = {}) {
	return Object.freeze({
		...paperNOrderProfile(order),
		id: defaultProfile
			? 'Algorithm32-Paper-Reflection-Completed-136'
			: `Algorithm32-Paper-J${order}-Reflection-Completed-136`,
		label: defaultProfile
			? 'Algorithm32 Paper (experimental reflection-completed 136-direction quadrature)'
			: `${algorithm32DisplayName(order)} (paper profile; experimental reflection-completed 136-direction quadrature)`,
		role: 'experimental paper-input quadrature profile',
		provenanceProfileId: defaultProfile
			? 'paper-reflection-completed-136'
			: `paper-j${order}-reflection-completed-136`,
		presentationName: defaultProfile
			? 'Algorithm32 Paper Experimental Reflection-Completed 136'
			: `Algorithm32 Paper J${order} Experimental Reflection-Completed 136`,
		controls: Object.freeze({
			...N_ORDER_CONTROLS,
			incidentDirectionCount: 136,
			incomingDirectionDomain: 'b1-reflection-completed-paired-rotated-fibonacci-136-v1',
			maximumScatteringOrder: order,
		}),
	});
}

function paperReflectionCompletedOrdinary68Profile(order, {defaultProfile = false} = {}) {
	return Object.freeze({
		...paperNOrderProfile(order),
		id: defaultProfile
			? 'Algorithm32-Paper-Reflection-Completed-Ordinary-68'
			: `Algorithm32-Paper-J${order}-Reflection-Completed-Ordinary-68`,
		label: defaultProfile
			? 'Algorithm32 Paper (experimental reflection-completed ordinary 68-direction quadrature)'
			: `${algorithm32DisplayName(order)} (paper profile; experimental reflection-completed ordinary 68-direction quadrature)`,
		role: 'experimental paper-input quadrature profile',
		provenanceProfileId: defaultProfile
			? 'paper-reflection-completed-ordinary-68'
			: `paper-j${order}-reflection-completed-ordinary-68`,
		presentationName: defaultProfile
			? 'Algorithm32 Paper Experimental Reflection-Completed Ordinary Fibonacci-68'
			: `Algorithm32 Paper J${order} Experimental Reflection-Completed Ordinary Fibonacci-68`,
		controls: Object.freeze({
			...N_ORDER_CONTROLS,
			incidentDirectionCount: 68,
			incomingDirectionDomain: 'b1-reflection-completed-ordinary-fibonacci-68-v1',
			maximumScatteringOrder: order,
		}),
	});
}

export const N_ORDER_PROFILE_KEYS = Object.freeze(['j2', 'j3', 'j4', 'j5']);

export const CANDIDATE_PROFILES = Object.freeze({
	default: Object.freeze({
		id: 'Algorithm32',
		label: 'Algorithm32 (Default, 34 incident directions)',
		role: 'canonical Default',
		controls: Object.freeze({
			pathIntervalCount: 40,
			sourceTransmittanceIntervalCount: 20,
			incidentDirectionCount: 34,
			incidentAltitudeBinCount: 48,
		}),
	}),
	j2: nOrderProfile(2),
	j3: nOrderProfile(3),
	j4: nOrderProfile(4),
	j5: nOrderProfile(5),
});

export const PAPER_CANDIDATE_PROFILES = Object.freeze({
	default: Object.freeze({
		id: 'Algorithm32-Paper',
		label: 'Algorithm32 Paper (published physical-input profile)',
		role: 'canonical paper-input profile',
		provenanceProfileId: 'paper',
		presentationName: 'Algorithm32 Paper',
		spectralChannelCount: 40,
		spectralProjection: 'identity-direct-40',
		physicalProfileId: PAPER_PHYSICAL_PROFILE_ID,
		physicalProfileContentHash: PAPER_PHYSICAL_PROFILE_CONTENT_HASH,
		controls: Object.freeze({
			pathIntervalCount: 40,
			sourceTransmittanceIntervalCount: 20,
			incidentDirectionCount: 68,
			incidentAltitudeBinCount: 48,
		}),
	}),
	j2: paperNOrderProfile(2),
	j3: paperNOrderProfile(3),
	j4: paperNOrderProfile(4),
	j5: paperNOrderProfile(5),
});

export const PAPER_LEBEDEV38_CANDIDATE_PROFILES = Object.freeze({
	...PAPER_CANDIDATE_PROFILES,
	j4: paperLebedev38Profile(4),
});

export const PAPER_LEBEDEV38_ROTATED_CANDIDATE_PROFILES = Object.freeze({
	...PAPER_CANDIDATE_PROFILES,
	j4: paperLebedev38Profile(4, 'cube-diagonal'),
});

export const PAPER_LEBEDEV38_NEAR_HORIZON_CANDIDATE_PROFILES = Object.freeze({
	...PAPER_CANDIDATE_PROFILES,
	j4: paperLebedev38Profile(4, 'near-horizon'),
});

export const PAPER_PAIRED_FIBONACCI_CANDIDATE_PROFILE_FAMILIES = Object.freeze(
	Object.fromEntries(
		[34, 38, 42, 46, 50].map((directionCount) => [
			`paper-paired-fibonacci-${directionCount}`,
			Object.freeze({
				...PAPER_CANDIDATE_PROFILES,
				j4: paperPairedFibonacciProfile(4, directionCount),
			}),
		]),
	),
);

export const PAPER_REFLECTION_COMPLETED_136_CANDIDATE_PROFILES = Object.freeze({
	...PAPER_CANDIDATE_PROFILES,
	default: paperReflectionCompleted136Profile(4, {defaultProfile: true}),
	j4: paperReflectionCompleted136Profile(4),
});

export const PAPER_REFLECTION_COMPLETED_ORDINARY_68_CANDIDATE_PROFILES = Object.freeze({
	...PAPER_CANDIDATE_PROFILES,
	default: paperReflectionCompletedOrdinary68Profile(4, {defaultProfile: true}),
	j4: paperReflectionCompletedOrdinary68Profile(4),
});

export const CANDIDATE_PROFILE_FAMILIES = Object.freeze({
	native: CANDIDATE_PROFILES,
	paper: PAPER_CANDIDATE_PROFILES,
	'paper-lebedev38': PAPER_LEBEDEV38_CANDIDATE_PROFILES,
	'paper-lebedev38-rotated': PAPER_LEBEDEV38_ROTATED_CANDIDATE_PROFILES,
	'paper-lebedev38-near-horizon': PAPER_LEBEDEV38_NEAR_HORIZON_CANDIDATE_PROFILES,
	'paper-reflection-completed-136': PAPER_REFLECTION_COMPLETED_136_CANDIDATE_PROFILES,
	'paper-reflection-completed-ordinary-68': PAPER_REFLECTION_COMPLETED_ORDINARY_68_CANDIDATE_PROFILES,
	...PAPER_PAIRED_FIBONACCI_CANDIDATE_PROFILE_FAMILIES,
});

export function resolveCandidateProfiles(family = 'native') {
	const profiles = CANDIDATE_PROFILE_FAMILIES[family];
	if (!profiles) throw new RangeError(`Unknown candidate profile family: ${family}`);
	return profiles;
}

function assertEqual(actual, expected, label, path) {
	if (actual !== expected) {
		throw new Error(
			`Candidate provenance ${label} must be ${JSON.stringify(expected)}, ` +
				`not ${JSON.stringify(actual)}: ${path}`,
		);
	}
}

export function verifyCandidateProvenance(path, profile) {
	if (!path || !existsSync(path)) {
		throw new Error(`Candidate provenance not found for ${profile.label}: ${path ?? '<missing>'}`);
	}
	const bytes = readFileSync(path);
	let value;
	try {
		value = JSON.parse(bytes.toString('utf8'));
	} catch (error) {
		throw new Error(`Candidate provenance is not valid JSON: ${path}`, {cause: error});
	}

	assertEqual(value?.modelNameInBenchmarkTables, 'proposed', 'modelNameInBenchmarkTables', path);
	if (profile.provenanceProfileId != null) {
		assertEqual(value?.profileId, profile.provenanceProfileId, 'profileId', path);
	}
	if (profile.presentationName != null) {
		assertEqual(value?.presentationName, profile.presentationName, 'presentationName', path);
	}
	const spectralBoundary = value?.spectralBoundary ?? value?.nativeSpectralBoundary;
	const expectedChannelCount = profile.spectralChannelCount ?? 15;
	assertEqual(spectralBoundary?.channelCount, expectedChannelCount, 'spectralBoundary.channelCount', path);
	if (profile.spectralProjection != null) {
		assertEqual(spectralBoundary?.projection, profile.spectralProjection, 'spectralBoundary.projection', path);
	}
	if (profile.physicalProfileId != null) {
		assertEqual(value?.physicalProfileId, profile.physicalProfileId, 'physicalProfileId', path);
		assertEqual(
			value?.physicalProfileContentHash,
			profile.physicalProfileContentHash,
			'physicalProfileContentHash',
			path,
		);
	}
	assertEqual(value?.rowCount, 1377, 'rowCount', path);
	const selectedQuadraticView =
		value.schema === 'algorithm32-current-production-b1-provenance-v2' &&
		['paper', 'paper-j4'].includes(value.profileId) &&
		value.numericalControls?.pathSampleDistribution === 'quadratic-near-observer-v1';
	if (value.numericalControls?.pathSampleDistribution !== undefined && !selectedQuadraticView) {
		throw new Error(`Unrecognized candidate view-path distribution in ${path}.`);
	}
	const positionDomain = value.numericalControls?.positionDomain;
	const refinedPositionDomain = positionDomain?.selection === 'native51-near-ground';
	if (positionDomain !== undefined || value.cacheRepresentation === 'receiver-local-native51-near-ground-z180-w27') {
		assertEqual(refinedPositionDomain, true, 'numericalControls.positionDomain.selection', path);
		assertEqual(selectedQuadraticView, true, 'selected quadratic view for refined positions', path);
		assertEqual(value.backend, 'gpu-production-shaders-r32f', 'backend for refined positions', path);
		assertEqual(
			value.cacheRepresentation,
			'receiver-local-native51-near-ground-z180-w27',
			'cacheRepresentation',
			path,
		);
		assertEqual(
			value.numericalControls.maximumScatteringOrder,
			4,
			'numericalControls.maximumScatteringOrder',
			path,
		);
		assertEqual(
			value.numericalControls.incidentAltitudeBinCount,
			NATIVE_51_NEAR_GROUND_POSITION_DOMAIN_OWNER.count,
			'numericalControls.incidentAltitudeBinCount',
			path,
		);
		const acceptedDomain = SphericalNativePositionDomains.accept({
			id: positionDomain.id,
			count: value.numericalControls.positionNodeCount,
			nodes: positionDomain.nodes,
		});
		assertEqual(
			acceptedDomain === NATIVE_51_NEAR_GROUND_POSITION_DOMAIN_OWNER,
			true,
			'named Native51 position domain',
			path,
		);
	}
	const controls = refinedPositionDomain ? PAPER_CANDIDATE_PROFILES.j4.controls : profile.controls;
	for (const [name, expected] of Object.entries(controls)) {
		const receiverLocal =
			value.cacheRepresentation ===
				(refinedPositionDomain
					? 'receiver-local-native51-near-ground-z180-w27'
					: 'receiver-local-native48-z180-w27') &&
			value.schema === 'algorithm32-current-production-b1-provenance-v2' &&
			['paper', 'paper-j4'].includes(value.profileId);
		const required =
			refinedPositionDomain && ['incidentAltitudeBinCount', 'positionNodeCount'].includes(name)
				? NATIVE_51_NEAR_GROUND_POSITION_DOMAIN_OWNER.count
				: receiverLocal && name === 'scatteringOutputDomain'
					? 'receiver-local-boundary-inclusive-gnomonic-cubed-sphere-w27'
					: selectedQuadraticView && name === 'pathIntervalCount'
						? 30
						: expected;
		assertEqual(value?.numericalControls?.[name], required, `numericalControls.${name}`, path);
	}

	return Object.freeze({
		path,
		sha256: createHash('sha256').update(bytes).digest('hex'),
		byteLength: bytes.byteLength,
		schema: value.schema,
		runId: value.runId,
		backend: value.backend ?? null,
		executionBoundary: value.executionBoundary ?? null,
		modelName: value.modelNameInBenchmarkTables,
		spectralChannelCount: spectralBoundary.channelCount,
		nativeChannelCount: spectralBoundary.channelCount,
		rowCount: value.rowCount,
		numericalControls: Object.freeze({...value.numericalControls}),
	});
}
