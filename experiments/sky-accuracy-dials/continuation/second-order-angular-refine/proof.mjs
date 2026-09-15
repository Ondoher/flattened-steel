import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {secondOrderIncidentCollectorProof} from '../second-order-refine/proof.mjs';
import {loadInputs} from '../../execution.mjs';
import {sha256} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {volumeJ2Groups} from '../volume-j2/angular.mjs';
import {secondOrderViewNodes, viewAngularRules} from '../second-order-view/geometry.mjs';
import {viewComponents} from '../second-order-view/integrate.mjs';
import {secondOrderPhysicalKey} from '../second-order-refine/run.mjs';
import {
	assertSecondOrderAngularBaseline,
	assertSecondOrderAzimuthPoint,
	integrateSecondOrderAzimuth,
	secondOrderAzimuthPolicy,
	secondOrderAngularBaselinePolicy,
} from './run.mjs';

/** Manufacture separated constant-density components with explicit uncertainty.
 * @param {number} factor - Known source multiplier, independent of any atmospheric solver.
 * @returns {SkyVolumeJ2Row[]} Two-channel manufactured complete source rows.
 */
function manufacturedRows(factor) {
	return [0, 8].map((channel) => {
		const scale = channel === 0 ? 1 : 0.75;
		/** @param {number} coefficient - Component scale. @returns {SkyVolumeJ2Estimate} Manufactured estimate. */
		const value = (coefficient) => ({
			gauss: scale * coefficient * factor,
			simpson: scale * coefficient * factor,
			mean: scale * coefficient * factor,
			incidentAllowance: scale * coefficient * 1e-6,
			resolved: true,
		});
		return {
			channel,
			atmosphereRayleigh: value(1),
			atmosphereMie: value(2),
			groundRayleigh: value(3),
			groundMie: value(4),
			combined: value(10),
			sumDifference: 0,
			arithmeticAllowance: 0,
			sumIdentityPassed: true,
		};
	});
}

/** Manufacture complete original comparison data and an exact prescribed transmission.
 * @param {SkySecondOrderViewNode} node - Original Gaussian-eight physical address.
 * @returns {SkySecondOrderPoint} Synthetic three-rule baseline with no physical work.
 */
function manufacturedBaseline(node) {
	/** @type {SkySecondOrderViewColumns[]} */ const columns = [];
	/** @type {readonly SkyPhysicalReferenceMethod[]} */ const methods = ['gauss', 'simpson'];
	for (const method of methods)
		for (const toleranceScale of [4, 1])
			columns.push({
				method,
				toleranceScale,
				columns: {
					rayleighMeters: 0,
					mieMeters: 0,
					errorRayleighMeters: 0,
					errorMieMeters: 0,
					evaluations: 0,
					converged: true,
					reason: null,
				},
			});
	return {
		node,
		transmission: {
			columns,
			mediumEvaluations: 0,
			channels: [0, 8].map((channel) => ({
				channel,
				gauss: 0.5,
				simpson: 0.5,
				mean: 0.5,
				allowance: 1e-5,
				resolved: true,
			})),
		},
		angular: viewAngularRules.map((rule, index) => ({
			rule,
			incidentCount: index === 0 ? 192 : 768,
			geometryPassed: true,
			incidentsPassed: true,
			rows: manufacturedRows([1, 2, 2.1][index]),
		})),
		elapsedMilliseconds: 0,
		workerMilliseconds: 0,
		mediumEvaluations: 0,
		outerEvaluations: 0,
	};
}

/** Verify separate angular identities, weight/transmission algebra and missing-half behavior.
 * Prescribed source values and transmission are independent synthetic inputs;
 * the real geometry supplies addresses only. No physical radiation is evaluated.
 * @param {DialContinuationRegistrationRead} registration - Original authenticated C0 geometry.
 * @param {SkyTransportSpec} spec - Matched sphere radii for node construction.
 * @returns {SkySecondOrderAngularRefinementProof} Actual mathematical and rejection checks.
 */
export function secondOrderAngularRefinementProof(registration, spec) {
	let checks = 0;
	const nodes = secondOrderViewNodes(registration, spec, 'p-0930-5-7', 8);
	const baseline = nodes.map(manufacturedBaseline);
	assertSecondOrderAngularBaseline(nodes, baseline, secondOrderAngularBaselinePolicy);
	checks++;
	const parentArtifact = {
		path: 'tmp/experiments/sky-accuracy-dials/runs/manufactured/view.json',
		byteLength: 1,
		sha256: '0'.repeat(64),
	};
	/** @type {SkySecondOrderAzimuthPoint[]} */ const refined = baseline.map((point) => ({
		node: point.node,
		transmission: structuredClone(point.transmission),
		baselineAngular: structuredClone(point.angular),
		refinedRows: manufacturedRows(2 + (point.node.index < 16 ? 0.125 : -0.125)),
		refinedGeometryPassed: true,
		refinedIncidentsPassed: true,
		incidentCount: 1536,
		baselineParent: {
			run: 'manufactured-baseline',
			artifact: parentArtifact,
			nodeId: point.node.id,
			physicalKeySha256: sha256(secondOrderPhysicalKey(point.node, secondOrderAngularBaselinePolicy)),
		},
		elapsedMilliseconds: 0,
		workerMilliseconds: 0,
		mediumEvaluations: 0,
		outerEvaluations: 0,
	}));
	for (let index = 0; index < nodes.length; index++) {
		assertSecondOrderAzimuthPoint(refined[index], baseline[index], secondOrderAzimuthPolicy);
		checks++;
	}
	const integrals = integrateSecondOrderAzimuth(nodes, baseline, refined);
	assert.equal(integrals.length, 50);
	checks++;
	assert.ok(integrals.every((row) => row.complete));
	checks++;
	for (const row of integrals) {
		const selected = nodes.filter((node) => row.interval === 'all' || node.interval === row.interval);
		const coefficient = [1, 2, 3, 4, 10][viewComponents.indexOf(row.component)] * (row.channel === 0 ? 1 : 0.75);
		const weightSum = selected.reduce((sum, node) => sum + node.weightMeters, 0);
		const expectedBaseline = weightSum * coefficient;
		const expectedRefined = selected.reduce(
			(sum, node) => sum + node.weightMeters * 0.5 * coefficient * (2 + (node.index < 16 ? 0.125 : -0.125)),
			0,
		);
		const expectedAbsolute = weightSum * 0.5 * coefficient * 0.125;
		const expectedIncident = weightSum * 0.5 * coefficient * 2e-6;
		const expectedView = weightSum * coefficient * (0.125 + 2e-6) * 1e-5;
		const allowance = 64 * Number.EPSILON * Math.max(1, expectedBaseline);
		assert.ok(Math.abs(row.baselineWatts - expectedBaseline) <= allowance);
		checks++;
		assert.ok(Math.abs(row.refinedWatts - expectedRefined) <= allowance);
		checks++;
		assert.ok(Math.abs(row.absoluteCorrectionWatts - expectedAbsolute) <= allowance);
		checks++;
		assert.ok(Math.abs(row.correctionIncidentAllowanceWatts - expectedIncident) <= allowance);
		checks++;
		assert.ok(Math.abs(row.correctionViewAllowanceWatts - expectedView) <= allowance);
		checks++;
		assert.ok(Math.abs(row.earlierAbsoluteResponseWatts - weightSum * 0.5 * coefficient) <= allowance);
		checks++;
		assert.ok(Math.abs(row.earlierIncidentAllowanceWatts - expectedIncident) <= allowance);
		checks++;
		assert.ok(Math.abs(row.earlierViewAllowanceWatts - weightSum * coefficient * (1 + 2e-6) * 1e-5) <= allowance);
		checks++;
		assert.ok(Math.abs(row.signedCorrectionWatts - (row.refinedWatts - row.baselineWatts)) <= allowance);
		checks++;
		if (row.interval === 'all') {
			assert.ok(
				row.absoluteCorrectionWatts > Math.abs(row.signedCorrectionWatts),
				'Opposite-signed path changes cannot cancel in the absolute correction.',
			);
			checks++;
		}
	}
	const lowOnly = integrateSecondOrderAzimuth(nodes, baseline, refined.slice(0, 16));
	assert.ok(lowOnly.filter((row) => row.interval === 0 || row.interval === 1).every((row) => row.complete));
	checks++;
	assert.ok(
		lowOnly
			.filter((row) => row.interval === 'all' || row.interval === 2 || row.interval === 3)
			.every(
				(row) =>
					!row.complete &&
					row.refinedWatts === null &&
					row.refinedIncidentAllowanceWatts === null &&
					row.refinedViewAllowanceWatts === null &&
					row.absoluteCorrectionWatts === null &&
					row.signedCorrectionWatts === null &&
					row.correctionIncidentAllowanceWatts === null &&
					row.correctionViewAllowanceWatts === null,
			),
	);
	checks++;
	assert.ok(
		lowOnly.every((row) => Number.isFinite(row.baselineWatts) && row.earlierAbsoluteResponseWatts > 0),
		'Complete original comparison remains available when the refined half is absent.',
	);
	checks++;
	assert.ok(
		integrateSecondOrderAzimuth(nodes, baseline, []).every((row) => !row.complete && row.refinedWatts === null),
	);
	checks++;
	assert.throws(() =>
		assertSecondOrderAngularBaseline(nodes, baseline.slice(0, 16), secondOrderAngularBaselinePolicy),
	);
	checks++;
	const changedOrigin = /** @type {SkyVector3} */ ([nodes[0].origin[0] + 1, nodes[0].origin[1], nodes[0].origin[2]]);
	assert.throws(() =>
		assertSecondOrderAngularBaseline(
			nodes,
			[{...baseline[0], node: {...nodes[0], origin: changedOrigin}}, ...baseline.slice(1)],
			secondOrderAngularBaselinePolicy,
		),
	);
	checks++;
	assert.throws(() =>
		assertSecondOrderAngularBaseline(
			nodes,
			[{...baseline[0], angular: [...baseline[0].angular].reverse()}, ...baseline.slice(1)],
			secondOrderAngularBaselinePolicy,
		),
	);
	checks++;
	assert.throws(() =>
		assertSecondOrderAngularBaseline(nodes, baseline, {
			...secondOrderAngularBaselinePolicy,
			physicalProfile: 'standard',
		}),
	);
	checks++;
	assert.throws(() =>
		integrateSecondOrderAzimuth(nodes, baseline, refined, {...secondOrderAzimuthPolicy, azimuthCount: 32}),
	);
	checks++;
	assert.throws(() =>
		assertSecondOrderAzimuthPoint(
			{...refined[0], node: {...nodes[0], origin: changedOrigin}},
			baseline[0],
			secondOrderAzimuthPolicy,
		),
	);
	checks++;
	assert.throws(() =>
		assertSecondOrderAzimuthPoint({...refined[0], baselineAngular: []}, baseline[0], secondOrderAzimuthPolicy),
	);
	checks++;
	const changedTransmission = {
		...refined[0].transmission,
		channels: refined[0].transmission.channels.map((channel) => ({...channel, mean: 0.6})),
	};
	assert.throws(() =>
		assertSecondOrderAzimuthPoint(
			{...refined[0], transmission: changedTransmission},
			baseline[0],
			secondOrderAzimuthPolicy,
		),
	);
	checks++;
	assert.throws(() =>
		assertSecondOrderAzimuthPoint(
			{...refined[0], refinedRows: refined[0].refinedRows.slice(0, 1)},
			baseline[0],
			secondOrderAzimuthPolicy,
		),
	);
	checks++;
	assert.throws(() =>
		assertSecondOrderAzimuthPoint(
			{...refined[0], refinedIncidentsPassed: false},
			baseline[0],
			secondOrderAzimuthPolicy,
		),
	);
	checks++;
	assert.throws(() => integrateSecondOrderAzimuth(nodes, baseline, [refined[0], refined[0]]));
	checks++;
	for (const node of [nodes[0], nodes.at(-1)]) {
		const groups = volumeJ2Groups(spec.planet.bottomRadiusMeters, node.origin, 16, 64);
		assert.equal(groups.length, 1536);
		checks++;
		assert.ok(groups.every((group) => group.incident.weight > 0));
		checks++;
		assert.ok(Math.abs(groups.reduce((sum, group) => sum + 2 * group.incident.weight, 0) - 4 * Math.PI) < 1e-12);
		checks++;
	}
	checks += secondOrderIncidentCollectorProof(registration, spec).checks;
	return {schemaId: 'sky-second-order-angular-refinement-proof-v1', checks};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.equal(process.argv.length, 3, 'Pass the immutable original C0 registration path.');
	console.log(
		JSON.stringify(
			secondOrderAngularRefinementProof(readRegistration(process.argv[2]), loadInputs().native48.transportSpec),
			null,
			2,
		),
	);
}
