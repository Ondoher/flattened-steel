import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {readRepository} from '../../io/files.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {viewAngularRules} from '../second-order-view/geometry.mjs';

/** Reuse the original order decomposition with its exact representation and parent identity.
 * @param {DialContinuationRegistrationRead} registration - Original C0 owner.
 * @returns {SkySecondOrderOriginalRead} Complete authenticated source rows.
 */
export function readSecondOrderOriginal(registration) {
	const original = acceptedMechanismInput('tmp/experiments/sky-accuracy-dials/runs/00152-a-order-split');
	assert.equal(original.seal.sha256, 'a5d77a1e36261ee6f8fba54d7899511184e1698a3a318178ae01819db003c812');
	assert.equal(original.terminal.recipe.parameters.continuationRegistration, registration.run);
	const artifact = mechanismArtifact(original, 'rows.json.gz');
	/** @type {SkyOrderAttributionRow[]} */ const rows = JSON.parse(
		gunzipSync(readRepository(artifact.path, artifact), {maxOutputLength: 4 * 1024 ** 2}).toString(),
	);
	assert.equal(rows.length, 160);
	assert.equal(new Set(rows.map((row) => `${row.probeId}:${row.channel}`)).size, rows.length);
	for (const row of rows) {
		assert.equal(row.contributions.length, 4);
		assert.equal(row.cumulative.length, 4);
		assert.equal(row.allowances.length, 4);
		assert.equal(row.contributions[0], row.physicalFirstResidual);
		assert.equal(row.contributions[1], row.cumulative[1] - row.cumulative[0]);
	}
	return {identities: [original.seal, artifact], rows};
}

/** Replace one effective order while preserving the signed score and compensation terms.
 * This is algebra on a supplied estimate, not an assertion that it is qualified.
 * @param {number} firstResidual - Independently evaluated P1 minus measurement.
 * @param {readonly number[]} originalHigher - Original effective J2/J3/J4 increments.
 * @param {number} physicalSecond - Supplied pure second-order viewing estimate.
 * @returns {SkySecondOrderReplacement} Checked radiance and squared-error identities.
 */
export function secondOrderReplacement(firstResidual, originalHigher, physicalSecond) {
	assert.equal(originalHigher.length, 3);
	assert.ok([firstResidual, ...originalHigher, physicalSecond].every(Number.isFinite) && physicalSecond >= 0);
	const [second, third, fourth] = originalHigher;
	const beforeResidualWatts = firstResidual + second + third + fourth;
	const afterResidualWatts = firstResidual + physicalSecond + third + fourth;
	const deltaWatts = physicalSecond - second,
		cachedMinusPhysicalWatts = second - physicalSecond;
	const squaredScoreChange = afterResidualWatts ** 2 - beforeResidualWatts ** 2;
	const linearScoreTerm = 2 * beforeResidualWatts * deltaWatts,
		quadraticScoreTerm = deltaWatts ** 2;
	const compensationCrossTerm = 2 * cachedMinusPhysicalWatts * afterResidualWatts;
	const linearScale =
		Math.abs(firstResidual) + Math.abs(second) + Math.abs(third) + Math.abs(fourth) + physicalSecond;
	const residuals = [
		Math.abs(afterResidualWatts - beforeResidualWatts - deltaWatts),
		Math.abs(squaredScoreChange - linearScoreTerm - quadraticScoreTerm),
		Math.abs(
			beforeResidualWatts ** 2 - cachedMinusPhysicalWatts ** 2 - afterResidualWatts ** 2 - compensationCrossTerm,
		),
	];
	assert.ok(residuals[0] <= 256 * Number.EPSILON * Math.max(Number.MIN_VALUE, linearScale));
	assert.ok(
		residuals
			.slice(1)
			.every((value) => value <= 512 * Number.EPSILON * Math.max(Number.MIN_VALUE, linearScale ** 2)),
	);
	return {
		deltaWatts,
		beforeResidualWatts,
		afterResidualWatts,
		cachedMinusPhysicalWatts,
		squaredScoreChange,
		linearScoreTerm,
		quadraticScoreTerm,
		compensationCrossTerm,
		linearIdentityResidualWatts: residuals[0],
		maximumSquaredIdentityResidual: Math.max(...residuals.slice(1)),
	};
}

/** Describe complete supplied view estimates without promoting partial or coarse data to references.
 * @param {string} probeId - Original outward viewing probe.
 * @param {readonly SkySecondOrderIntegral[]} integrals - Complete-rule output with explicit missing states.
 * @param {readonly SkyOrderAttributionRow[]} originalRows - Authenticated original attribution scalars.
 * @returns {SkySecondOrderDiagnostic[]} Frozen-increment diagnostics; angular and outer accuracy remain unqualified here.
 */
export function diagnoseSecondOrderView(probeId, integrals, originalRows) {
	/** @type {SkySecondOrderDiagnostic[]} */ const rows = [];
	const channels = [...new Set(integrals.map((row) => row.channel))];
	for (const channel of channels)
		for (const rule of viewAngularRules) {
			const selected = integrals.filter((row) => row.channel === channel && row.rule === rule);
			if (!selected.length || selected.some((row) => !row.complete)) continue;
			const source = originalRows.find((row) => row.probeId === probeId && row.channel === channel);
			assert.ok(source, `Missing original comparison ${probeId}:${channel}.`);
			/** Require exactly one complete physical integral by semantic address.
			 * @param {number|'all'} interval - Full view or physical shell.
			 * @param {SkySecondOrderComponent} component - Explicit physical component.
			 * @returns {SkySecondOrderIntegral} Unique admitted inner estimate.
			 */
			const get = (interval, component) => {
				const matches = selected.filter((row) => row.interval === interval && row.component === component);
				assert.equal(matches.length, 1);
				const result = matches[0];
				assert.ok(
					result.complete &&
						[result.valueWatts, result.incidentAllowanceWatts, result.viewAllowanceWatts].every(
							(value) => value !== null && Number.isFinite(value) && value >= 0,
						),
				);
				return result;
			};
			const combined = get('all', 'combined'),
				groundWatts = get('all', 'groundRayleigh').valueWatts + get('all', 'groundMie').valueWatts;
			const firstShellGroundWatts = get(0, 'groundRayleigh').valueWatts + get(0, 'groundMie').valueWatts;
			rows.push({
				probeId,
				time: source.time,
				channel,
				rule,
				secondOrderWatts: combined.valueWatts,
				incidentAllowanceWatts: combined.incidentAllowanceWatts,
				viewAllowanceWatts: combined.viewAllowanceWatts,
				originalSecondOrderWatts: source.contributions[1],
				originalAllowanceWatts: source.allowances[1],
				groundWatts,
				firstShellGroundWatts,
				frozenThirdAndFourthWatts: source.contributions.slice(2),
				physicalFirstResidualWatts: source.physicalFirstResidual,
				originalFirstNumericalWatts: source.firstNumerical,
				originalRawResidualWatts: source.remaining + source.firstNumerical,
				jointSquaredScoreChange:
					(source.remaining + combined.valueWatts - source.contributions[1]) ** 2 -
					(source.remaining + source.firstNumerical) ** 2,
				firstSecondScoreInteraction:
					-2 * source.firstNumerical * (combined.valueWatts - source.contributions[1]),
				replacement: secondOrderReplacement(
					source.physicalFirstResidual,
					source.contributions.slice(1),
					combined.valueWatts,
				),
			});
		}
	return rows;
}

/** Verify score improvement, worsening, cancellation, zero response and rejection cases.
 * @returns {SkySecondOrderAnalysisProof} Focused in-memory algebra evidence.
 */
export function secondOrderAnalysisProof() {
	let checks = 0;
	for (const first of [-0.12, -0.02, 0.01])
		for (const original of [0.01, 0.02])
			for (const next of [0, 0.01, 0.03]) {
				const row = secondOrderReplacement(first, [original, 0.003, 0.001], next);
				assert.equal(
					Math.sign(row.squaredScoreChange),
					Math.sign(Math.abs(row.afterResidualWatts) - Math.abs(row.beforeResidualWatts)),
				);
				checks++;
				assert.equal(row.cachedMinusPhysicalWatts, original - next);
				checks++;
			}
	assert.ok(secondOrderReplacement(-0.1, [0.04, 0.003, 0.001], 0.02).squaredScoreChange > 0);
	checks++;
	assert.ok(secondOrderReplacement(0.1, [0.04, 0.003, 0.001], 0.02).squaredScoreChange < 0);
	checks++;
	assert.throws(() => secondOrderReplacement(0, [1, 2], 0));
	checks++;
	assert.throws(() => secondOrderReplacement(0, [1, 2, 3], -1));
	checks++;
	assert.throws(() => secondOrderReplacement(NaN, [1, 2, 3], 1));
	checks++;
	assert.deepEqual(diagnoseSecondOrderView('missing', [], []), []);
	checks++;
	return {schemaId: 'sky-second-order-analysis-proof-v1', checks};
}
