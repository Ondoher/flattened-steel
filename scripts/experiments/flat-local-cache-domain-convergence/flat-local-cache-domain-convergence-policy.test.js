import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {POLICY_RELATIVE_PATH} from './consts.js';

const V4_POLICY_RELATIVE_PATH =
	'scripts/experiments/flat-local-cache-domain-convergence/' + 'flat-local-cache-domain-convergence-policy.json';
const V4_REPORT_RELATIVE_PATH =
	'archives/algorithm32-flat-local-cache-domain-convergence/' + 'report-v4-observed-worst-nodes.json';
const V4_POLICY_SHA256 = 'afa729f7c289bad5709c4442bc1c0ea53a0cd524b37d385952b9f346aa0b729b';
const V4_REPORT_SHA256 = '0e656ddd9034a1a2528935a025e1a88de8bcb3da66eef1fd4747f3619c33772e';

test('predeclares one bounded post-promotion flat/local verification', async () => {
	const [policyBytes, v4PolicyBytes, v4ReportBytes] = await Promise.all([
		readFile(POLICY_RELATIVE_PATH),
		readFile(V4_POLICY_RELATIVE_PATH),
		readFile(V4_REPORT_RELATIVE_PATH),
	]);
	const policy = JSON.parse(policyBytes.toString('utf8'));
	const v4Policy = JSON.parse(v4PolicyBytes.toString('utf8'));
	const resource = policy.resourceCriteria;
	const production = policy.productionSelection;

	assert.equal(policy.schema, 'algorithm32-flat-local-cache-domain-convergence-policy-v5');
	assert.equal(policy.status, 'predeclared-before-post-promotion-verification-output');
	assert.equal(production.position.constructionLookup, 'clamped-bilinear-z-rho');
	assert.equal(production.position.id, 'profile-z19-rho15-add-50km-4p5mm');
	assert.equal(production.position.zNodeCount, undefined);
	assert.deepEqual(
		production.position.zNodesMeters,
		[
			0, 250, 500, 1000, 1500, 3000, 5000, 7000, 10000, 14000, 20000, 25000, 37500, 50000, 62500, 75000, 87500,
			99000, 100000,
		],
	);
	assert.deepEqual(
		production.position.rhoNodesMeters,
		[
			0, 50000, 100000, 200000, 400000, 600000, 1200000, 1800000, 2400000, 3000000, 3600000, 4200000, 4500000,
			4700000, 4800000,
		],
	);
	assert.equal(
		production.position.positionCount,
		production.position.zNodesMeters.length * production.position.rhoNodesMeters.length,
	);
	assert.equal(production.transportIntervalCount, policy.controlStudies.storedFieldTransport.candidateIntervalCount);
	assert.equal(
		production.sourceTransmittanceIntervalCount,
		policy.controlStudies.sourceTransmittance.candidateIntervalCount,
	);
	assert.equal(policy.controlStudies.sourceTransmittance.gating, false);
	assert.equal(policy.controlStudies.storedFieldTransport.gating, false);
	assert.equal(policy.spatialStudy.reference.maximumScatteringOrder, 4);
	assert.deepEqual(policy.spatialStudy.comparedFields, ['J1', 'J2', 'J3', 'J4', 'Jthrough4']);
	assert.equal(policy.spatialStudy.reference.zNodesMeters.length, 19);
	assert.equal(policy.spatialStudy.reference.rhoNodesMeters.length, 17);
	assert.deepEqual(policy.spatialStudy.reference.zNodesMeters, v4Policy.spatialStudy.reference.zNodesMeters);
	assert.deepEqual(policy.spatialStudy.reference.rhoNodesMeters, v4Policy.spatialStudy.reference.rhoNodesMeters);
	assert.deepEqual(policy.spatialStudy.stressPositions, v4Policy.spatialStudy.stressPositions);
	assert.deepEqual(policy.spatialStudy.outgoingDirectionIndicesW3, v4Policy.spatialStudy.outgoingDirectionIndicesW3);
	assert.deepEqual(policy.spatialStudy.spectrumMetric, {
		maximumNormalizedLInf: 0.1,
		maximumP95NormalizedRms: 0.02,
		normalizedLInfDefinition: 'max(abs(candidate-reference)) / ' + 'max(max(abs(reference)), 1e-30)',
		normalizedRmsDefinition: 'sqrt(mean(((candidate-reference) / ' + 'max(max(abs(reference)), 1e-30))^2))',
		percentileDefinition:
			'nearest-rank with one-based rank ' + 'ceil(p * sampleCount), clamped to ' + 'the final sorted sample',
	});
	assert.deepEqual(policy.spatialStudy.diagnostics, {
		retainedWorstSpectrumCountPerFieldCandidate: 10,
		retainedWorstSpectrumOrdering: [
			'normalized-l-infinity-descending',
			'comparison-id-utf16-code-unit-ascending',
			'original-comparison-ordinal-ascending',
		],
		acceptanceRole:
			'Diagnostic only. Preserve worstSpectrum ' +
			'and all maximum, percentile, finite, ' +
			'nonnegative, and pass calculations unchanged.',
	});
	assert.deepEqual(policy.spatialStudy.spectrumMetric, v4Policy.spatialStudy.spectrumMetric);
	assert.deepEqual(policy.spatialStudy.diagnostics, v4Policy.spatialStudy.diagnostics);
	assert.deepEqual(policy.positionCandidates, [
		{
			id: 'profile-z19-rho15-add-50km-4p5mm',
			role: 'current-production-selection',
			zNodesMeters: production.position.zNodesMeters,
			rhoNodesMeters: production.position.rhoNodesMeters,
			positionCount: 285,
		},
	]);
	assert.deepEqual(policy.outgoingStudy.positionAxes.zNodesMeters, [0, 100000]);
	assert.deepEqual(policy.outgoingStudy.positionAxes.rhoNodesMeters, [0, 4800000]);
	assert.equal(policy.outgoingStudy.candidateFaceWidth, 9);
	assert.equal(policy.outgoingStudy.referenceFaceWidth, 27);
	assert.deepEqual(policy.outgoingStudy, v4Policy.outgoingStudy);
	assert.equal(policy.controlStudies.sourceTransmittance.candidateIntervalCount, 15);
	assert.equal(policy.controlStudies.sourceTransmittance.referenceIntervalCount, 60);
	assert.equal(policy.controlStudies.storedFieldTransport.candidateIntervalCount, 15);
	assert.equal(policy.controlStudies.storedFieldTransport.referenceIntervalCount, 60);
	assert.deepEqual(policy.controlStudies, v4Policy.controlStudies);
	assert.deepEqual(
		{
			maximumPositionCountUnderW27ResidentLimit: resource.maximumPositionCountUnderW27ResidentLimit,
			residentCumulativeFieldBytesMaximum: resource.residentCumulativeFieldBytesMaximum,
			peakTrackedLogicalBytesMaximum: resource.peakTrackedLogicalBytesMaximum,
		},
		{
			maximumPositionCountUnderW27ResidentLimit: 285,
			residentCumulativeFieldBytesMaximum: 83886080,
			peakTrackedLogicalBytesMaximum: 469762048,
		},
	);
	assert.match(resource.defaultPositionDomainRequirement, /Omitted FlatEarthGeometry cache axes must realize/u);
	assert.deepEqual(
		{
			maximumPositionCountUnderW27ResidentLimit: resource.maximumPositionCountUnderW27ResidentLimit,
			residentCumulativeFieldBytesMaximum: resource.residentCumulativeFieldBytesMaximum,
			peakTrackedLogicalBytesMaximum: resource.peakTrackedLogicalBytesMaximum,
			packedTransportTapUpperBoundPerQuery: resource.packedTransportTapUpperBoundPerQuery,
			fieldPeakModel: resource.fieldPeakModel,
		},
		{
			maximumPositionCountUnderW27ResidentLimit:
				v4Policy.resourceCriteria.maximumPositionCountUnderW27ResidentLimit,
			residentCumulativeFieldBytesMaximum: v4Policy.resourceCriteria.residentCumulativeFieldBytesMaximum,
			peakTrackedLogicalBytesMaximum: v4Policy.resourceCriteria.peakTrackedLogicalBytesMaximum,
			packedTransportTapUpperBoundPerQuery: v4Policy.resourceCriteria.packedTransportTapUpperBoundPerQuery,
			fieldPeakModel: v4Policy.resourceCriteria.fieldPeakModel,
		},
	);
	assert.equal(policy.report.schema, 'algorithm32-flat-local-cache-domain-convergence-report-v5');
	assert.equal(
		policy.report.path,
		'archives/algorithm32-flat-local-cache-domain-convergence/' + 'report-post-promotion.json',
	);
	const v4Amendment = policy.amendmentHistory.at(-2);
	assert.equal(
		v4Amendment.priorReport.path,
		'archives/algorithm32-flat-local-cache-domain-convergence/' + 'report-v3-radial-attribution.json',
	);
	assert.equal(v4Amendment.priorReport.sha256, '5b5650a98ff95b8f55e74cb0c48ed57053906cd8db2c8b957347928d9f04da93');
	const v5Amendment = policy.amendmentHistory.at(-1);
	assert.deepEqual(v5Amendment.priorPolicy, {
		path: V4_POLICY_RELATIVE_PATH,
		sha256: V4_POLICY_SHA256,
	});
	assert.deepEqual(v5Amendment.priorReport, {
		path: V4_REPORT_RELATIVE_PATH,
		sha256: V4_REPORT_SHA256,
	});
	assert.equal(v5Amendment.promotedPositionDomain, production.position.id);
	assert.match(v5Amendment.verificationPurpose, /current production source hashes/u);
	assert.match(v5Amendment.selectionDisposition, /does not reopen or perform position-domain reselection/u);
	assert.equal(createHash('sha256').update(v4PolicyBytes).digest('hex'), V4_POLICY_SHA256);
	assert.equal(createHash('sha256').update(v4ReportBytes).digest('hex'), V4_REPORT_SHA256);

	for (const candidate of policy.positionCandidates) {
		assert.equal(candidate.positionCount, candidate.zNodesMeters.length * candidate.rhoNodesMeters.length);
		assert.ok(
			candidate.positionCount <= resource.maximumPositionCountUnderW27ResidentLimit,
			`${candidate.id} exceeds the predeclared position cap`,
		);
		assert.equal(candidate.zNodesMeters[0], 0);
		assert.equal(candidate.zNodesMeters.at(-1), 100000);
		assert.equal(candidate.rhoNodesMeters[0], 0);
		assert.equal(candidate.rhoNodesMeters.at(-1), 4800000);
		assert.ok(isStrictlyIncreasing(candidate.zNodesMeters));
		assert.ok(isStrictlyIncreasing(candidate.rhoNodesMeters));
	}

	const residentBytes =
		production.position.positionCount *
		production.outgoing.directionCount *
		production.spectralChannelCount *
		resource.scalarBytes;
	assert.ok(residentBytes <= resource.residentCumulativeFieldBytesMaximum);
	assert.match(policy.claimBoundary.starBoundary, /no integrated flat\/local cache/u);
});

function isStrictlyIncreasing(values) {
	return values.every((value, index) => index === 0 || value > values[index - 1]);
}
