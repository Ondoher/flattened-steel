import assert from 'node:assert/strict';
import {deriveProfile} from '../../numerics/profile.js';
import {mechanismCase, mechanismCases} from './cases.mjs';
import {mechanismGroundProbes} from './registration.mjs';

/** Check the finite matrix, isolation and selector contracts without GPU or evidence writes.
 * This proof establishes admission controls, not atmospheric accuracy or a passed
 * interaction prediction. Numerical density/transport proofs have separate owners.
 * @param {SkyBuildRequest} native48 - Exact authenticated baseline physical request.
 * @returns {SkyMechanismContractProof} Compact assertion counts and layout ceiling.
 */
export function mechanismContractProof(native48) {
	let checks = 0,
		maximumSpeciesFieldBytes = 0;
	/** Compare independently specified expected behavior. @param {unknown} actual @param {unknown} expected */
	function equal(actual, expected) {
		assert.deepEqual(actual, expected);
		checks++;
	}
	equal(mechanismCases.length, 14);
	equal(mechanismCases.filter((item) => item.phase === 'C3').length, 10);
	equal(mechanismCases.filter((item) => item.phase === 'C4').length, 4);
	equal(
		mechanismCases.filter((item) => item.predictionRequired).map((item) => item.id),
		['j1-higher', 'end-t320', 'higher-end'],
	);
	equal(new Set(mechanismCases.map((item) => item.id)).size, 14);
	for (const candidate of mechanismCases) {
		assert.match(`c-${candidate.id}`, /^[a-z][a-z0-9-]{0,15}$/u);
		checks++;
		const profile = deriveProfile(native48, candidate.controls),
			controls = profile.controls;
		equal(controls.representations, ['grouped']);
		equal(controls.viewIntervals, [8, 16]);
		equal(controls.viewRule, 'altitude-segmented');
		equal(controls.solarInterpolations, ['monotone-cubic']);
		equal(controls.sourceIntervals, 80);
		equal(controls.outgoingWidth, 27);
		equal(controls.transportIntervals, ['h-t320', 'end-t320'].includes(candidate.id) ? 320 : 160);
		equal(controls.altitudeCount, candidate.id.startsWith('d55') ? 55 : 48);
		equal(profile.buildRequest.transportSpec.numerical.maximumScatteringOrder, 4);
		equal(profile.buildRequest.transportSpec.planet, native48.transportSpec.planet);
		equal(profile.buildRequest.transportSpec.atmosphere, native48.transportSpec.atmosphere);
		equal(profile.buildRequest.transportSpec.domains.spectrum, native48.transportSpec.domains.spectrum);
		equal(profile.buildRequest.transportSpec.domains.solarZenith, native48.transportSpec.domains.solarZenith);
		if (candidate.higherRepresentation !== 'combined-raw') {
			const domains = profile.buildRequest.transportSpec.domains;
			const bytes =
				4 *
				domains.position.count *
				domains.solarZenith.count *
				(domains.outgoing.directionCount + 3 * domains.incoming.directionCount);
			assert.ok(bytes < 1024 ** 3);
			checks++;
			maximumSpeciesFieldBytes = Math.max(maximumSpeciesFieldBytes, bytes);
		}
	}
	equal(mechanismCase('v-factored').controls, mechanismCase('v-raw').controls);
	equal(mechanismCase('d48-factored').controls, mechanismCase('d48-split').controls);
	equal(mechanismCase('d55-factored').controls, mechanismCase('d55-split').controls);
	equal(mechanismCase('d55-split').controls, mechanismCase('d55-raw').controls);
	equal(mechanismCase('j1-higher').controls, mechanismCase('d48-factored').controls);
	equal(mechanismCase('higher-end').controls, mechanismCase('i512-end').controls);
	equal(mechanismCase('i512-aspect').controls.incoming, {
		kind: 'gauss-legendre-product',
		muCount: 8,
		azimuthCount: 64,
	});
	equal(mechanismCase('i2048-end').controls.incoming, {
		kind: 'gauss-legendre-product',
		muCount: 32,
		azimuthCount: 64,
		azimuthPlacement: 'endpoint-aware',
	});
	equal(
		mechanismGroundProbes.map((item) => [item.time, item.gridX, item.gridY]),
		[
			['09:30', 4, 7],
			['09:30', 5, 7],
			['12:30', 3, 5],
			['12:30', 4, 4],
		],
	);
	assert.throws(() => mechanismCase('d48'), /Unknown mechanism/u);
	checks++;
	assert.throws(() => mechanismCase('../v-raw'), /Unknown mechanism/u);
	checks++;
	return {
		schemaId: 'sky-mechanism-contract-proof-v1',
		checks,
		caseCount: 14,
		requiredPredictions: 3,
		maximumSpeciesFieldBytes,
	};
}
