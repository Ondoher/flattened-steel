import assert from 'node:assert/strict';
import {assessSecondOrderOuter} from '../second-order-analysis/refinement.mjs';
import {
	assertSecondOrderAngularBaseline,
	integrateSecondOrderAzimuth,
	secondOrderAngularBaselinePolicy,
} from '../second-order-angular-refine/run.mjs';
import {integrateSecondOrderView, viewComponents} from '../second-order-view/integrate.mjs';

const channels = secondOrderAngularBaselinePolicy.channels;
/** @type {readonly ('ordinary-fine'|'mapped-fine')[]} */
const fineRules = ['ordinary-fine', 'mapped-fine'];
const outerIds = [
	'outer-simpson4-within-one-percent',
	'outer-gauss8-smaller-correction',
	'outer-refined-independent-agreement',
];

/** Reject malformed complete numerical fields without fabricating missing data.
 * @param {number} value - Required nonnegative finite value.
 * @returns {number} The original value, unchanged.
 */
function nonnegative(value) {
	assert.ok(typeof value === 'number' && Number.isFinite(value) && value >= 0);
	return value;
}

/** Assess all ten held component/channel angular shrinkage inequalities.
 * Interval rows may accompany the full-view rows; duplicate or foreign full-view
 * addresses are rejected, and missing/incomplete expected rows stay unresolved.
 * @param {readonly SkySecondOrderAzimuthIntegral[]} integrals - Matched pathwise angular terms.
 * @returns {SkySecondOrderAngularShrinkageCheck[]} Exhaustive whole-view checks in channel/component order.
 */
export function assessSecondOrderAngularShrinkage(integrals) {
	const whole = integrals.filter((row) => row.interval === 'all');
	assert.equal(new Set(whole.map((row) => `${row.channel}:${row.component}`)).size, whole.length);
	assert.ok(whole.every((row) => channels.includes(row.channel) && viewComponents.includes(row.component)));
	return channels.flatMap((channel) =>
		viewComponents.map((component) => {
			const row = whole.find((value) => value.channel === channel && value.component === component);
			const complete = Boolean(
				row?.complete &&
				[
					row.absoluteCorrectionWatts,
					row.earlierAbsoluteResponseWatts,
					row.correctionIncidentAllowanceWatts,
					row.correctionViewAllowanceWatts,
					row.earlierIncidentAllowanceWatts,
					row.earlierViewAllowanceWatts,
				].every((value) => value !== null),
			);
			const absoluteCorrectionWatts = complete ? nonnegative(row.absoluteCorrectionWatts) : null;
			const earlierAbsoluteResponseWatts = complete ? nonnegative(row.earlierAbsoluteResponseWatts) : null;
			const correctionIncidentAllowanceWatts = complete
				? nonnegative(row.correctionIncidentAllowanceWatts)
				: null;
			const correctionViewAllowanceWatts = complete ? nonnegative(row.correctionViewAllowanceWatts) : null;
			const earlierIncidentAllowanceWatts = complete ? nonnegative(row.earlierIncidentAllowanceWatts) : null;
			const earlierViewAllowanceWatts = complete ? nonnegative(row.earlierViewAllowanceWatts) : null;
			const thresholdWatts = complete
				? nonnegative(
						0.2 * earlierAbsoluteResponseWatts +
							correctionIncidentAllowanceWatts +
							correctionViewAllowanceWatts +
							0.2 * (earlierIncidentAllowanceWatts + earlierViewAllowanceWatts) +
							1e-8,
					)
				: null;
			return {
				id: `angular-az64-shrinkage:${channel}:${component}`,
				channel,
				component,
				absoluteCorrectionWatts,
				earlierAbsoluteResponseWatts,
				correctionIncidentAllowanceWatts,
				correctionViewAllowanceWatts,
				earlierIncidentAllowanceWatts,
				earlierViewAllowanceWatts,
				responseFraction: /** @type {const} */ (0.2),
				floorWatts: /** @type {const} */ (1e-8),
				thresholdWatts,
				state: /** @type {SkyVolumeCheckState} */ (
					!complete ? 'unresolved' : absoluteCorrectionWatts <= thresholdWatts ? 'passed' : 'failed'
				),
			};
		}),
	);
}

/** Compute mapped-placement allowances before path summation can cancel differences.
 * The caller supplies the authenticated exact Gaussian-eight constructor nodes;
 * every original point, weight, transmission and angular policy must match.
 * @param {readonly SkySecondOrderViewNode[]} nodes - Complete expected 32-node rule.
 * @param {readonly SkySecondOrderPoint[]} baselinePoints - Exact complete admitted original three-rule points.
 * @returns {SkySecondOrderMappedAllowance[]} All interval/channel/component path terms.
 */
export function secondOrderMappedPlacementAllowance(nodes, baselinePoints) {
	assertSecondOrderAngularBaseline(nodes, baselinePoints, secondOrderAngularBaselinePolicy);
	/** @type {SkySecondOrderMappedAllowance[]} */ const result = [];
	/** @type {readonly (number|'all')[]} */ const intervals = [0, 1, 2, 3, 'all'];
	for (const interval of intervals)
		for (const channel of channels)
			for (const component of viewComponents) {
				let signedDifferenceWatts = 0,
					absoluteDifferenceWatts = 0,
					incidentAllowanceWatts = 0,
					viewAllowanceWatts = 0;
				for (const node of nodes.filter((value) => interval === 'all' || value.interval === interval)) {
					const point = baselinePoints.find((value) => value.node.id === node.id);
					const original = point.angular
						.find((row) => row.rule === 'ordinary-fine')
						.rows.find((row) => row.channel === channel)[component];
					const mapped = point.angular
						.find((row) => row.rule === 'mapped-fine')
						.rows.find((row) => row.channel === channel)[component];
					const transmission = point.transmission.channels.find((row) => row.channel === channel);
					const weight = nonnegative(node.weightMeters);
					assert.ok(weight > 0);
					const difference = mapped.mean - original.mean;
					const incident = original.incidentAllowance + mapped.incidentAllowance;
					signedDifferenceWatts += weight * transmission.mean * difference;
					absoluteDifferenceWatts += weight * transmission.mean * Math.abs(difference);
					incidentAllowanceWatts += weight * transmission.mean * incident;
					viewAllowanceWatts += weight * transmission.allowance * (Math.abs(difference) + incident);
				}
				assert.ok(Number.isFinite(signedDifferenceWatts));
				for (const value of [absoluteDifferenceWatts, incidentAllowanceWatts, viewAllowanceWatts])
					nonnegative(value);
				result.push({
					interval,
					channel,
					component,
					signedDifferenceWatts,
					absoluteDifferenceWatts,
					incidentAllowanceWatts,
					viewAllowanceWatts,
					allowanceWatts: nonnegative(absoluteDifferenceWatts + incidentAllowanceWatts + viewAllowanceWatts),
				});
			}
	return result;
}

/** Read one complete original combined scalar without interpreting absent values as zero.
 * @param {SkySecondOrderReferenceOuterEvidence|null} evidence - Authenticated outer configuration or missing evidence.
 * @param {number} channel - Original spectral index.
 * @param {'ordinary-fine'|'mapped-fine'} rule - Original fine angular placement.
 * @returns {SkySecondOrderOuterValue|null} Complete scalar and summed inner allowance, or missing.
 */
function outerValue(evidence, channel, rule) {
	if (!evidence) return null;
	const rows = evidence.integrals.filter(
		(row) => row.interval === 'all' && row.channel === channel && row.rule === rule && row.component === 'combined',
	);
	assert.ok(rows.length <= 1, 'Duplicate outer comparison address.');
	const row = rows[0];
	if (
		!row?.complete ||
		[row.valueWatts, row.incidentAllowanceWatts, row.viewAllowanceWatts].some((value) => value === null)
	)
		return null;
	return {
		value: nonnegative(row.valueWatts),
		innerAllowance: nonnegative(nonnegative(row.incidentAllowanceWatts) + nonnegative(row.viewAllowanceWatts)),
	};
}

/** Evaluate the complete held outer/angular inventory and empirical reference allowance.
 * This is an empirical allowance, not a rigorous error bound. It deliberately
 * retains overlapping inner terms and the specified whole-view outer responses.
 * Authentication, source identities and interpretation of run admission are
 * caller-owned; no filesystem access, physical solve or evidence write occurs.
 * @param {SkySecondOrderReferenceInput} input - Exact baseline, actual refinements and authenticated original controls.
 * @returns {SkySecondOrderReferenceAssessment} Exhaustive gates and distinct two-channel allowance terms.
 */
export function assessSecondOrderReference(input) {
	const {nodes, baselinePoints, angularPoints} = input;
	assert.equal(typeof input.baselineAdmitted, 'boolean');
	assert.equal(typeof input.angularAdmitted, 'boolean');
	for (const evidence of [input.gauss4, input.simpson4, input.simpson8])
		if (evidence) assert.equal(typeof evidence.admitted, 'boolean');
	assert.equal(new Set(input.originalH.map((row) => row.channel)).size, input.originalH.length);
	for (const row of input.originalH) {
		assert.ok(channels.includes(row.channel));
		nonnegative(row.valueWatts);
	}
	const angularIntegrals = integrateSecondOrderAzimuth(nodes, baselinePoints, angularPoints);
	const angularChecks = assessSecondOrderAngularShrinkage(angularIntegrals);
	const placement = secondOrderMappedPlacementAllowance(nodes, baselinePoints);
	const gauss8 = {
		integrals: integrateSecondOrderView(nodes, baselinePoints, channels),
		admitted: input.baselineAdmitted,
	};
	/** @type {SkySecondOrderReferenceOuterCheck[]} */ const outerChecks = [];
	let outerAdmissionsComplete = input.baselineAdmitted;
	for (const channel of channels)
		for (const rule of fineRules) {
			const g4 = outerValue(input.gauss4, channel, rule),
				s4 = outerValue(input.simpson4, channel, rule),
				g8 = outerValue(gauss8, channel, rule),
				s8 = outerValue(input.simpson8, channel, rule);
			outerAdmissionsComplete &&= Boolean(
				g4 && s4 && g8 && s8 && input.gauss4?.admitted && input.simpson4?.admitted && input.simpson8?.admitted,
			);
			const checks = g4
				? assessSecondOrderOuter({gauss4: g4, simpson4: s4, gauss8: g8, simpson8: s8})
				: outerIds.map((id) => ({
						id,
						differenceWatts: null,
						thresholdWatts: null,
						state: /** @type {SkyVolumeCheckState} */ ('unresolved'),
					}));
			outerChecks.push(...checks.map((row) => ({...row, channel, rule})));
		}
	const angularAdmissionsComplete =
		input.baselineAdmitted &&
		input.angularAdmitted &&
		angularPoints.length === nodes.length &&
		angularIntegrals.every((row) => row.complete);
	const outerChecksPassed = outerChecks.every((row) => row.state === 'passed');
	const angularChecksPassed = angularChecks.every((row) => row.state === 'passed');
	/** @type {SkySecondOrderReferenceChannel[]} */ const assessedChannels = channels.map((channel) => {
		const refined = angularIntegrals.find(
			(row) => row.interval === 'all' && row.channel === channel && row.component === 'combined',
		);
		const mapped = placement.find(
			(row) => row.interval === 'all' && row.channel === channel && row.component === 'combined',
		);
		const g4 = outerValue(input.gauss4, channel, 'ordinary-fine'),
			g8 = outerValue(gauss8, channel, 'ordinary-fine'),
			s8 = outerValue(input.simpson8, channel, 'ordinary-fine');
		const gaussDifferenceWatts = g4 ? Math.abs(g8.value - g4.value) : null;
		const gaussOuterAllowanceWatts = g4
			? nonnegative(gaussDifferenceWatts + g8.innerAllowance + g4.innerAllowance)
			: null;
		const simpsonDifferenceWatts = s8 ? Math.abs(s8.value - g8.value) : null;
		const simpsonOuterAllowanceWatts = s8
			? nonnegative(simpsonDifferenceWatts + s8.innerAllowance + g8.innerAllowance)
			: null;
		const outerAllowanceWatts = g4 && s8 ? Math.max(gaussOuterAllowanceWatts, simpsonOuterAllowanceWatts) : null;
		const innerAllowanceWatts = refined.complete
			? nonnegative(
					nonnegative(refined.refinedIncidentAllowanceWatts) + nonnegative(refined.refinedViewAllowanceWatts),
				)
			: null;
		const angularAllowanceWatts = refined.complete
			? nonnegative(
					nonnegative(refined.absoluteCorrectionWatts) +
						nonnegative(refined.correctionIncidentAllowanceWatts) +
						nonnegative(refined.correctionViewAllowanceWatts),
				)
			: null;
		const allowanceWatts =
			outerAdmissionsComplete &&
			angularAdmissionsComplete &&
			innerAllowanceWatts !== null &&
			outerAllowanceWatts !== null &&
			angularAllowanceWatts !== null
				? nonnegative(innerAllowanceWatts + outerAllowanceWatts + angularAllowanceWatts + mapped.allowanceWatts)
				: null;
		const referenceWatts = refined.complete ? nonnegative(refined.refinedWatts) : null;
		const originalHWatts = input.originalH.find((row) => row.channel === channel)?.valueWatts ?? null;
		const contrastWatts =
			originalHWatts !== null && referenceWatts !== null ? Math.abs(originalHWatts - referenceWatts) : null;
		const relativeThresholdWatts = contrastWatts !== null ? 0.2 * contrastWatts : null;
		const unresolved =
			allowanceWatts === null ||
			relativeThresholdWatts === null ||
			!outerAdmissionsComplete ||
			!angularAdmissionsComplete ||
			outerChecks.some((row) => row.state === 'unresolved') ||
			angularChecks.some((row) => row.state === 'unresolved');
		/** @type {SkyVolumeCheckState} */ const state = unresolved
			? 'unresolved'
			: outerChecksPassed &&
				  angularChecksPassed &&
				  allowanceWatts <= 5e-5 &&
				  allowanceWatts <= relativeThresholdWatts
				? 'passed'
				: 'failed';
		return {
			channel,
			referenceWatts,
			allowanceWatts,
			originalHWatts,
			contrastWatts,
			absoluteThresholdWatts: 5e-5,
			relativeThresholdWatts,
			outerAdmissionsComplete,
			angularAdmissionsComplete,
			outerChecksPassed,
			angularChecksPassed,
			terms: {
				refinedIncidentAllowanceWatts: refined.refinedIncidentAllowanceWatts,
				refinedViewAllowanceWatts: refined.refinedViewAllowanceWatts,
				innerAllowanceWatts,
				gaussDifferenceWatts,
				gauss8InnerAllowanceWatts: g8.innerAllowance,
				gauss4InnerAllowanceWatts: g4?.innerAllowance ?? null,
				gaussOuterAllowanceWatts,
				simpsonDifferenceWatts,
				simpson8InnerAllowanceWatts: s8?.innerAllowance ?? null,
				simpsonOuterAllowanceWatts,
				outerAllowanceWatts,
				angularAbsoluteCorrectionWatts: refined.absoluteCorrectionWatts,
				angularIncidentAllowanceWatts: refined.correctionIncidentAllowanceWatts,
				angularViewAllowanceWatts: refined.correctionViewAllowanceWatts,
				angularAllowanceWatts,
				mappedAbsoluteDifferenceWatts: mapped.absoluteDifferenceWatts,
				mappedIncidentAllowanceWatts: mapped.incidentAllowanceWatts,
				mappedViewAllowanceWatts: mapped.viewAllowanceWatts,
				mappedAllowanceWatts: mapped.allowanceWatts,
			},
			adequate: state === 'passed',
			state,
		};
	});
	return {outerChecks, angularChecks, placement, channels: assessedChannels};
}
