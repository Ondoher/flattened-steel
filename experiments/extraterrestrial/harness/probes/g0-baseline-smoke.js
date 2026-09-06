#!/usr/bin/env node

import { Algorithm32 as BaselineAlgorithm32 } from
	'../../baseline/src/algorithm32/Algorithm32.js';
import {
	CANONICAL_ATMOSPHERE_CONSTANTS as BASELINE_ATMOSPHERE,
	CANONICAL_SPECTRAL_CHANNELS as BASELINE_CHANNELS,
	RUNTIME_NUMERICAL_CONTROLS as BASELINE_CONTROLS,
} from '../../baseline/src/algorithm32/constants/Algorithm32CanonicalData.js';
import { Algorithm32 as CandidateAlgorithm32 } from
	'../../candidate/src/algorithm32/Algorithm32.js';
import {
	CANONICAL_ATMOSPHERE_CONSTANTS as CANDIDATE_ATMOSPHERE,
	CANONICAL_SPECTRAL_CHANNELS as CANDIDATE_CHANNELS,
	RUNTIME_NUMERICAL_CONTROLS as CANDIDATE_CONTROLS,
} from '../../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import {
	canonicalFingerprint,
	canonicalJson,
} from '../lib/g0-contract.js';

const EXPECTED_BASIS_FINGERPRINT =
	'sha256:a03a3c7f45d9bd4ff8adf6482e9d1aac1acd72423758ecf797ac24f6dffba891';

function requireCondition(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

function basisProjection(channels) {
	return {
		kind: 'algorithm32-spectral-basis',
		id: 'algorithm32-native-15-spectral-basis-v1',
		schemaRevision: 'algorithm32-spectral-basis-v1',
		semantics: 'contiguous-wavelength-bin-average',
		channels: channels.map((channel) => ({
			id: channel.name,
			center: channel.wavelength,
			width: channel.wavelengthBinWidth,
		})),
	};
}

function main() {
	requireCondition(
		typeof BaselineAlgorithm32 === 'function'
			&& BaselineAlgorithm32.name === 'Algorithm32',
		'The sealed baseline Algorithm32 facade did not import.',
	);
	requireCondition(
		typeof CandidateAlgorithm32 === 'function'
			&& CandidateAlgorithm32.name === 'Algorithm32',
		'The initial candidate Algorithm32 facade did not import.',
	);
	requireCondition(
		canonicalJson(BASELINE_ATMOSPHERE)
			=== canonicalJson(CANDIDATE_ATMOSPHERE),
		'Baseline and candidate atmosphere constants differ.',
	);
	requireCondition(
		canonicalJson(BASELINE_CHANNELS) === canonicalJson(CANDIDATE_CHANNELS),
		'Baseline and candidate spectral channels differ.',
	);
	requireCondition(
		canonicalJson(BASELINE_CONTROLS) === canonicalJson(CANDIDATE_CONTROLS),
		'Baseline and candidate runtime controls differ.',
	);
	requireCondition(
		BASELINE_ATMOSPHERE.bottomRadius.value === 6_360_000
			&& BASELINE_ATMOSPHERE.topRadius.value === 6_420_000
			&& BASELINE_ATMOSPHERE.bottomRadius.units === 'meters'
			&& BASELINE_ATMOSPHERE.topRadius.units === 'meters',
		'The sealed spherical atmosphere radii are not the expected production values.',
	);
	requireCondition(
		BASELINE_CHANNELS.length === 15,
		'The sealed production spectral basis does not contain 15 channels.',
	);
	const basisFingerprint =
		canonicalFingerprint(basisProjection(BASELINE_CHANNELS));
	requireCondition(
		basisFingerprint === EXPECTED_BASIS_FINGERPRINT,
		'The sealed production spectral basis fingerprint differs from the fixture.',
	);

	return {
		schemaId: 'algorithm32-extraterrestrial-g0-baseline-smoke-v1',
		accepted: true,
		baselineFacadeImported: true,
		candidateFacadeImported: true,
		atmosphereConstantsIdentical: true,
		runtimeControlsIdentical: true,
		spectralChannelsIdentical: true,
		spectralChannelCount: BASELINE_CHANNELS.length,
		spectralBasisFingerprint: basisFingerprint,
		bottomRadiusMeters: BASELINE_ATMOSPHERE.bottomRadius.value,
		topRadiusMeters: BASELINE_ATMOSPHERE.topRadius.value,
	};
}

try {
	process.stdout.write(`${JSON.stringify(main(), null, 2)}\n`);
} catch (error) {
	process.stderr.write(`${error instanceof Error ? error.stack : error}\n`);
	process.exitCode = 1;
}
