import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sha256} from '../../io/files.mjs';
import {secondOrderPhysicalKey} from '../second-order-refine/run.mjs';
import {viewAngularRules} from '../second-order-view/geometry.mjs';
import {integrateSecondOrderView, viewComponents} from '../second-order-view/integrate.mjs';
import {integrateSecondOrderAzimuth, secondOrderAngularBaselinePolicy} from '../second-order-angular-refine/run.mjs';
import {
	assessSecondOrderAngularShrinkage,
	assessSecondOrderReference,
	secondOrderMappedPlacementAllowance,
} from './index.mjs';

/** Construct known separated sources; these are prescribed algebra inputs, not atmospheric solves.
 * @param {number} mean - Synthetic source unit.
 * @param {number} [incidentAllowance] - Synthetic incident uncertainty unit.
 * @returns {SkyVolumeJ2Row[]} Complete two-channel manufactured component rows.
 */
function rows(mean, incidentAllowance = 1e-9) {
	return [0, 8].map((channel) => {
		/** @param {number} coefficient - Independent component multiplier. @returns {SkyVolumeJ2Estimate} Prescribed scalar. */
		const value = (coefficient) => {
			const scale = coefficient * (channel === 0 ? 1 : 0.75);
			return {
				gauss: scale * mean,
				simpson: scale * mean,
				mean: scale * mean,
				incidentAllowance: scale * incidentAllowance,
				resolved: true,
			};
		};
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

/** Prescribe the complete matching original three-rule point evidence.
 * @param {SkySecondOrderViewNode} node - Manufactured positive-weight physical address.
 * @returns {SkySecondOrderPoint} Synthetic baseline with independently specified transmission.
 */
function baselinePoint(node) {
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
				allowance: 1e-8,
				resolved: true,
			})),
		},
		angular: viewAngularRules.map((rule, index) => ({
			rule,
			incidentCount: index === 0 ? 192 : 768,
			geometryPassed: true,
			incidentsPassed: true,
			rows: rows([9e-4, 1e-3, 1e-3 + (node.index < 16 ? 2e-7 : -2e-7)][index]),
		})),
		elapsedMilliseconds: 0,
		workerMilliseconds: 0,
		mediumEvaluations: 0,
		outerEvaluations: 0,
	};
}

/** Construct a complete prescribed refinement with equal and opposite path corrections.
 * @param {SkySecondOrderPoint} point - Exact manufactured original point.
 * @returns {SkySecondOrderAzimuthPoint} Complete synthetic new angular source.
 */
function angularPoint(point) {
	return {
		node: point.node,
		transmission: structuredClone(point.transmission),
		baselineAngular: structuredClone(point.angular),
		refinedRows: rows(1e-3 + (point.node.index < 16 ? 1e-8 : -1e-8)),
		refinedGeometryPassed: true,
		refinedIncidentsPassed: true,
		incidentCount: 1536,
		baselineParent: {
			run: 'manufactured-baseline',
			artifact: {path: 'manufactured/view.json', byteLength: 1, sha256: '0'.repeat(64)},
			nodeId: point.node.id,
			physicalKeySha256: sha256(secondOrderPhysicalKey(point.node, secondOrderAngularBaselinePolicy)),
		},
		elapsedMilliseconds: 0,
		workerMilliseconds: 0,
		mediumEvaluations: 0,
		outerEvaluations: 0,
	};
}

/** Verify held response laws, empirical allowance algebra, cancellation and missing-data behavior.
 * All coordinates, sources and transmissions below are manufactured. No physical
 * model, worker, immutable run or filesystem evidence is evaluated or created.
 * @returns {SkySecondOrderAngularAnalysisProof} Actual local assertion count.
 */
export function secondOrderAngularAnalysisProof() {
	let checks = 0;
	/** @param {unknown} value - Assertion predicate. @returns {void} Records one passing assertion. */
	const check = (value) => {
		assert.ok(value);
		checks++;
	};
	/** @param {number} actual - Computed algebra. @param {number} expected - Independent formula. @param {number} [roundoffScale] - Pre-subtraction operand scale for cancellation-sensitive formulas. @returns {void} Checks binary64 rounding only, never a scientific threshold. */
	const close = (actual, expected, roundoffScale = Math.abs(expected)) => {
		assert.ok(
			Math.abs(actual - expected) <= 2e-14 * Math.max(1e-12, roundoffScale),
			`${actual} differs from ${expected}`,
		);
		checks++;
	};
	/** @type {SkySecondOrderViewNode[]} */ const nodes = Array.from({length: 32}, (_, index) => ({
		id: `manufactured-${index}`,
		probeId: 'p-0930-5-7',
		interval: Math.floor(index / 8),
		index,
		surfaceOrigin: [0, 0, 6000000],
		origin: [0, 0, 6000001 + index],
		direction: [0, 0, 1],
		distanceMeters: index + 1,
		heightMeters: index + 1,
		weightMeters: 1 / 32,
	}));
	const baseline = nodes.map(baselinePoint),
		angular = baseline.map(angularPoint);
	const integrated = integrateSecondOrderAzimuth(nodes, baseline, angular);
	const shrinkage = assessSecondOrderAngularShrinkage(integrated);
	check(shrinkage.length === 10 && shrinkage.every((row) => row.state === 'passed'));
	for (const row of shrinkage) {
		close(
			row.thresholdWatts,
			0.2 * row.earlierAbsoluteResponseWatts +
				row.correctionIncidentAllowanceWatts +
				row.correctionViewAllowanceWatts +
				0.2 * (row.earlierIncidentAllowanceWatts + row.earlierViewAllowanceWatts) +
				1e-8,
		);
		const original = integrated.find(
			(value) => value.interval === 'all' && value.channel === row.channel && value.component === row.component,
		);
		const edge = {...original, absoluteCorrectionWatts: row.thresholdWatts};
		check(
			assessSecondOrderAngularShrinkage([edge]).find(
				(value) => value.channel === row.channel && value.component === row.component,
			).state === 'passed',
		);
		check(
			assessSecondOrderAngularShrinkage([{...edge, absoluteCorrectionWatts: row.thresholdWatts + 1e-12}]).find(
				(value) => value.channel === row.channel && value.component === row.component,
			).state === 'failed',
		);
	}
	check(assessSecondOrderAngularShrinkage([]).length === 10);
	check(
		assessSecondOrderAngularShrinkage([]).every((row) => row.state === 'unresolved' && row.thresholdWatts === null),
	);
	check(
		assessSecondOrderAngularShrinkage(integrateSecondOrderAzimuth(nodes, baseline, angular.slice(0, 16))).every(
			(row) => row.state === 'unresolved',
		),
	);
	const first = integrated.find((row) => row.interval === 'all');
	assert.throws(() => assessSecondOrderAngularShrinkage([first, first]));
	checks++;
	assert.throws(() => assessSecondOrderAngularShrinkage([{...first, absoluteCorrectionWatts: -1}]));
	checks++;
	assert.throws(() => assessSecondOrderAngularShrinkage([{...first, earlierViewAllowanceWatts: NaN}]));
	checks++;
	check(assessSecondOrderAngularShrinkage([{...first, complete: false}]).every((row) => row.state === 'unresolved'));
	check(
		assessSecondOrderAngularShrinkage([{...first, correctionViewAllowanceWatts: null}]).every(
			(row) => row.state === 'unresolved',
		),
	);
	const placement = secondOrderMappedPlacementAllowance(nodes, baseline);
	check(placement.length === 50);
	for (const row of placement) {
		const coefficient = [1, 2, 3, 4, 10][viewComponents.indexOf(row.component)] * (row.channel === 0 ? 1 : 0.75);
		const mass = row.interval === 'all' ? 1 : 0.25;
		close(row.absoluteDifferenceWatts, mass * 0.5 * coefficient * 2e-7, mass * 0.5 * coefficient * 1e-3);
		close(row.incidentAllowanceWatts, mass * 0.5 * coefficient * 2e-9);
		close(row.viewAllowanceWatts, mass * 1e-8 * coefficient * (2e-7 + 2e-9), mass * 1e-8 * coefficient * 1e-3);
		close(row.allowanceWatts, row.absoluteDifferenceWatts + row.incidentAllowanceWatts + row.viewAllowanceWatts);
		check(row.absoluteDifferenceWatts >= Math.abs(row.signedDifferenceWatts));
		if (row.interval === 'all') check(Math.abs(row.signedDifferenceWatts) < row.absoluteDifferenceWatts * 1e-10);
	}
	const g8 = integrateSecondOrderView(nodes, baseline, [0, 8]);
	/** @param {number} difference - Prescribed whole-view combined offset from G8. @returns {SkySecondOrderReferenceOuterEvidence} Synthetic authenticated outer evidence. */
	const outer = (difference) => ({
		admitted: true,
		integrals: g8.map((row) => ({
			...row,
			valueWatts:
				row.interval === 'all' && row.component === 'combined' ? row.valueWatts + difference : row.valueWatts,
		})),
	});
	/** @type {SkySecondOrderReferenceInput} */ const input = {
		nodes,
		baselinePoints: baseline,
		baselineAdmitted: true,
		angularPoints: angular,
		angularAdmitted: true,
		gauss4: outer(-2e-6),
		simpson4: outer(8e-6),
		simpson8: outer(5e-7),
		originalH: [
			{channel: 0, valueWatts: 0.01},
			{channel: 8, valueWatts: 0.01},
		],
	};
	const assessment = assessSecondOrderReference(input);
	check(assessment.outerChecks.length === 12 && assessment.outerChecks.every((row) => row.state === 'passed'));
	check(assessment.channels.every((row) => row.adequate && row.state === 'passed'));
	for (const row of assessment.channels) {
		const terms = row.terms,
			coefficient = row.channel === 0 ? 10 : 7.5;
		close(row.referenceWatts, coefficient * 0.5e-3);
		close(terms.refinedIncidentAllowanceWatts, 0.5 * coefficient * 1e-9);
		close(terms.refinedViewAllowanceWatts, (1e-3 + 1e-9) * coefficient * 1e-8);
		close(terms.gaussDifferenceWatts, 2e-6, row.referenceWatts);
		close(terms.simpsonDifferenceWatts, 5e-7, row.referenceWatts);
		close(
			terms.gaussOuterAllowanceWatts,
			terms.gaussDifferenceWatts + terms.gauss8InnerAllowanceWatts + terms.gauss4InnerAllowanceWatts,
		);
		close(
			terms.simpsonOuterAllowanceWatts,
			terms.simpsonDifferenceWatts + terms.gauss8InnerAllowanceWatts + terms.simpson8InnerAllowanceWatts,
		);
		close(terms.outerAllowanceWatts, Math.max(terms.gaussOuterAllowanceWatts, terms.simpsonOuterAllowanceWatts));
		close(terms.angularAbsoluteCorrectionWatts, 0.5 * coefficient * 1e-8, 0.5 * coefficient * 1e-3);
		close(terms.angularIncidentAllowanceWatts, 0.5 * coefficient * 2e-9);
		close(terms.angularViewAllowanceWatts, coefficient * (1e-8 + 2e-9) * 1e-8, coefficient * 1e-3 * 1e-8);
		close(
			terms.angularAllowanceWatts,
			terms.angularAbsoluteCorrectionWatts +
				terms.angularIncidentAllowanceWatts +
				terms.angularViewAllowanceWatts,
		);
		close(
			row.allowanceWatts,
			terms.innerAllowanceWatts +
				terms.outerAllowanceWatts +
				terms.angularAllowanceWatts +
				terms.mappedAllowanceWatts,
		);
		check(
			row.allowanceWatts > terms.outerAllowanceWatts &&
				terms.angularAbsoluteCorrectionWatts > 0 &&
				terms.mappedAbsoluteDifferenceWatts > 0,
		);
		close(row.relativeThresholdWatts, 0.2 * Math.abs(row.originalHWatts - row.referenceWatts));
	}
	const simpsonLarger = assessSecondOrderReference({...input, simpson8: outer(3e-6)});
	check(
		simpsonLarger.channels.every((row) => row.terms.outerAllowanceWatts === row.terms.simpsonOuterAllowanceWatts),
	);
	check(
		assessSecondOrderReference({...input, angularPoints: angular.slice(0, 16)}).channels.every(
			(row) =>
				row.state === 'unresolved' &&
				row.allowanceWatts === null &&
				row.referenceWatts === null &&
				!row.adequate,
		),
	);
	check(
		assessSecondOrderReference({...input, simpson8: null}).channels.every(
			(row) => row.state === 'unresolved' && row.allowanceWatts === null,
		),
	);
	check(assessSecondOrderReference({...input, gauss4: null}).outerChecks.every((row) => row.state === 'unresolved'));
	check(
		assessSecondOrderReference({...input, simpson4: null}).channels.every(
			(row) => row.state === 'unresolved' && !row.adequate,
		),
	);
	check(
		assessSecondOrderReference({...input, angularAdmitted: false}).channels.every(
			(row) => row.state === 'unresolved',
		),
	);
	check(
		assessSecondOrderReference({...input, baselineAdmitted: false}).channels.every(
			(row) => row.state === 'unresolved',
		),
	);
	check(
		assessSecondOrderReference({...input, gauss4: {...input.gauss4, admitted: false}}).channels.every(
			(row) => row.state === 'unresolved',
		),
	);
	check(
		assessSecondOrderReference({...input, originalH: []}).channels.every(
			(row) => row.state === 'unresolved' && row.relativeThresholdWatts === null,
		),
	);
	check(
		assessSecondOrderReference({...input, simpson4: outer(1)}).channels.every(
			(row) => row.state === 'failed' && !row.adequate,
		),
	);
	const failedAngular = angular.map((point) => ({
		...point,
		refinedRows: point.refinedRows.map((row) =>
			row.channel !== 8 ? row : rows(1.5e-3).find((value) => value.channel === 8),
		),
	}));
	check(
		assessSecondOrderReference({...input, angularPoints: failedAngular}).channels.every(
			(row) => row.state === 'failed' && !row.angularChecksPassed,
		),
	);
	const tooClose = assessment.channels.map((row) => ({channel: row.channel, valueWatts: row.referenceWatts}));
	check(
		assessSecondOrderReference({...input, originalH: tooClose}).channels.every(
			(row) => row.state === 'failed' && row.relativeThresholdWatts === 0,
		),
	);
	const safelyInside = assessment.channels.map((row) => ({
		channel: row.channel,
		valueWatts: row.referenceWatts + 5 * row.allowanceWatts * (1 + 1e-8),
	}));
	const justOutside = assessment.channels.map((row) => ({
		channel: row.channel,
		valueWatts: row.referenceWatts + 5 * row.allowanceWatts * (1 - 1e-8),
	}));
	check(
		assessSecondOrderReference({...input, originalH: safelyInside}).channels.every((row) => row.state === 'passed'),
	);
	check(
		assessSecondOrderReference({...input, originalH: justOutside}).channels.every((row) => row.state === 'failed'),
	);
	const hugeMappedBaseline = baseline.map((point) => ({
		...point,
		angular: point.angular.map((value) =>
			value.rule === 'mapped-fine'
				? {...value, rows: rows(1e-3 + (point.node.index < 16 ? 2e-4 : -2e-4))}
				: value,
		),
	}));
	const hugeMappedAngular = angular.map((point, index) => ({
		...point,
		baselineAngular: hugeMappedBaseline[index].angular,
	}));
	check(
		assessSecondOrderReference({
			...input,
			baselinePoints: hugeMappedBaseline,
			angularPoints: hugeMappedAngular,
		}).channels.every((row) => row.allowanceWatts > 5e-5 && row.state === 'failed'),
	);
	const changed = baseline.map((point, index) =>
		index === 0 ? {...point, node: {...point.node, distanceMeters: point.node.distanceMeters + 1}} : point,
	);
	assert.throws(() => secondOrderMappedPlacementAllowance(nodes, changed));
	checks++;
	assert.throws(() => secondOrderMappedPlacementAllowance(nodes, baseline.slice(0, 16)));
	checks++;
	assert.throws(() => assessSecondOrderReference({...input, originalH: [{channel: 0, valueWatts: NaN}]}));
	checks++;
	assert.throws(() => assessSecondOrderReference({...input, originalH: [...input.originalH, input.originalH[0]]}));
	checks++;
	assert.throws(() =>
		assessSecondOrderReference({
			...input,
			gauss4: {...input.gauss4, integrals: [...input.gauss4.integrals, ...input.gauss4.integrals]},
		}),
	);
	checks++;
	return {schemaId: 'sky-second-order-angular-analysis-proof-v1', checks};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	console.log(JSON.stringify(secondOrderAngularAnalysisProof(), null, 2));
}
