import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {loadInputs} from '../../execution.mjs';
import {readRepository, sha256} from '../../io/files.mjs';
import {deriveProfile} from '../../numerics/profile.js';
import {workingControls} from '../cases.mjs';
import {mechanismCase} from '../mechanisms/cases.mjs';
import {acceptedMechanismInput, mechanismArtifact, mechanismGroundProbes} from '../mechanisms/registration.mjs';
import {validateChannelDiagnostics} from '../capture/diagnostics.js';
import {checkedEnvelope} from '../ladder/read.mjs';
import {matchedOrderCanonical} from './evaluate.js';

/** Require exact prefix identity and actual-six-order evaluation parity.
 * @param {unknown} value - Browser-supplied prefix record.
 * @param {SkyMatchedOrdersPrefix} expected - Authenticated original H identity.
 * @returns {SkyMatchedOrdersPrefix} Exact validated prefix record.
 */
export function assertMatchedOrdersPrefix(value, expected) {
	assert.ok(value && typeof value === 'object');
	const actual = /** @type {SkyMatchedOrdersPrefix} */ (value);
	const {sixOrderEvaluatorPrefix, ...prefix} = actual;
	assert.deepEqual(
		prefix,
		expected,
		'Original H coordinate, field, spectrum or reference-envelope identity changed.',
	);
	const shape = expected.shape;
	assert.deepEqual(sixOrderEvaluatorPrefix, {
		comparisons: shape.representationCount * shape.viewCount * 4 * shape.rayCount,
		bitExact: true,
	});
	return actual;
}

/** Authenticate the explicitly admitted H or P55 prefix before browser work.
 * @param {DialContinuationRegistrationRead} registration - Original C0 owner.
 * @param {string} [prefixRun] - Exact immutable original H run.
 * @returns {SkyMatchedOrdersParent} Original controls and both complete prefix authorities.
 */
export function readMatchedOrdersParent(
	registration,
	prefixRun = 'tmp/experiments/sky-accuracy-dials/runs/00103-c-r0-scr',
) {
	const p55 = prefixRun === 'tmp/experiments/sky-accuracy-dials/runs/00132-c-d55-raw';
	assert.ok(p55 || prefixRun === 'tmp/experiments/sky-accuracy-dials/runs/00103-c-r0-scr');
	const parent = acceptedMechanismInput(prefixRun);
	assert.equal(
		parent.seal.sha256,
		p55
			? 'df4eb32c020fbc2fe14b7c68a6d0b64292fd21d7fb349ba9793ae20dd9aff95c'
			: '162a0214b66c7576d3ee245c53cb826030ef393a660c6d4287f59cb8fa0aea24',
	);
	assert.equal(parent.terminal.recipe.parameters.continuationRegistration, registration.run);
	assert.equal(parent.terminal.recipe.parameters.caseId, p55 ? 'd55-raw' : 'r0');
	const controlId = mechanismArtifact(parent, 'control.json'),
		executionId = mechanismArtifact(parent, 'execution.json');
	const control = /** @type {SkyGpuControl} */ (JSON.parse(readRepository(controlId.path, controlId).toString()));
	const expected = deriveProfile(
		loadInputs().native48,
		p55 ? mechanismCase('d55-raw').controls : {...workingControls, viewIntervals: [1, 2, 4, 8, 16]},
	);
	assert.deepEqual(control.buildRequest, expected.buildRequest);
	assert.deepEqual(control.controls, expected.controls);
	assert.deepEqual(control.channels, registration.record.scopes.screen.channels);
	assert.deepEqual(
		control.scenes,
		registration.probeScenes.filter((scene) => registration.record.scopes.screen.times.includes(scene.time)),
	);
	assert.deepEqual(control.continuation.probes, registration.probes);
	assert.deepEqual(control.continuation.probeScenes, registration.probeScenes);
	assert.equal(control.continuation.finalFirstOrder, 'raw');
	assert.equal(control.continuation.referenceMode, 'component');
	assert.equal(control.continuation.higherRepresentation ?? 'combined-raw', 'combined-raw');
	if (p55) assert.deepEqual(control.continuation.groundDensityProbes, mechanismGroundProbes);
	else assert.equal(control.continuation.groundDensityProbes?.length ?? 0, 0);
	const execution = JSON.parse(readRepository(executionId.path, executionId).toString()).execution;
	assert.ok(execution.executionSucceeded && execution.servedSourcesReauthenticated);
	const plan = execution.browser.plan;
	/** @type {DialFileIdentity[]} */ const identities = [parent.seal, controlId, executionId];
	const channels = [0, 8].map((channel) => {
		const stem = `channel-${String(channel).padStart(2, '0')}`;
		const metadataId = mechanismArtifact(parent, `${stem}.json`),
			spectraId = mechanismArtifact(parent, `${stem}.f64`),
			diagnosticId = mechanismArtifact(parent, `${stem}-diagnostics.json.gz`);
		const metadata = JSON.parse(readRepository(metadataId.path, metadataId).toString());
		assert.equal(metadata.channel, channel);
		assert.equal(metadata.spectra.sha256, spectraId.sha256);
		assert.equal(metadata.spectraSha256, spectraId.sha256);
		assert.deepEqual(metadata.shape, {
			representationCount: p55 ? 1 : 4,
			viewCount: p55 ? 2 : 5,
			orderCount: 4,
			rayCount: 243,
		});
		assert.equal(spectraId.byteLength, metadata.shape.representationCount * metadata.shape.viewCount * 4 * 243 * 8);
		assert.deepEqual(
			metadata.fieldChecks.map((row) => row.fieldId),
			['J1', 'J2', 'J3', 'J4'],
		);
		assert.ok(metadata.fieldChecks.every((row) => row.count === plan.coordinateCount));
		const diagnostic = validateChannelDiagnostics(
			JSON.parse(
				gunzipSync(readRepository(diagnosticId.path, diagnosticId), {maxOutputLength: 1024 ** 2}).toString(),
			),
		);
		assert.equal(diagnostic.probes.length, 2240);
		for (const probe of registration.probes)
			for (const order of [1, 2, 3, 4])
				for (const representation of ['cumulative', 'grouped'])
					checkedEnvelope(
						diagnostic.probes.filter(
							(row) =>
								row.probeId === probe.probeId &&
								row.order === order &&
								row.representationId === representation,
						),
					);
		const files = [metadataId, spectraId, diagnosticId];
		identities.push(...files);
		return {
			channel,
			identities: files,
			referenceQueryCount: diagnostic.queryCount,
			referencePreparationEvaluationCount: diagnostic.preparationEvaluationCount,
			expected: {
				coordinateCount: plan.coordinateCount,
				coordinateSha256: plan.coordinateSha256,
				shape: metadata.shape,
				fieldChecks: metadata.fieldChecks,
				spectraSha256: spectraId.sha256,
				referenceRowsSha256: sha256(matchedOrderCanonical(diagnostic.probes)),
				referenceRowCount: diagnostic.probes.length,
			},
		};
	});
	return {run: prefixRun, control, channels, identities};
}
