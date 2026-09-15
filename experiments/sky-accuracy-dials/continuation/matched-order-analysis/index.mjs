import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {readRepository} from '../../io/files.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {validateMatchedOrderDiagnostics, assessMatchedOrderPredictions} from '../matched-orders/diagnostics.mjs';
import {readMatchedOrdersParent, assertMatchedOrdersPrefix} from '../matched-orders/read.mjs';
import {readSecondOrderOriginal} from '../second-order-analysis/index.mjs';

/** Sum declared allowances, preserving an unresolved constituent.
 * @param {readonly (number|null)[]} values - Nonnegative numerical allowances.
 * @returns {number|null} Conservative sum or unresolved.
 */
export function matchedOrderAllowance(values) {
	for (const value of values) assert.ok(value === null || (Number.isFinite(value) && value >= 0));
	return values.includes(null) ? null : values.reduce((sum, value) => sum + value, 0);
}

/** Conservative product-difference allowance; no independence assumption.
 * @param {number} a @param {number} b @param {number|null} ea @param {number|null} eb
 * @returns {number|null} Allowance for twice the product.
 */
function crossAllowance(a, b, ea, eb) {
	return ea === null || eb === null ? null : 2 * (Math.abs(a) * eb + Math.abs(b) * ea + ea * eb);
}

/** Exact frozen addition and its squared-residual identity.
 * The separately supplied after allowance can cancel shared N4 terms exactly.
 * @param {number} before @param {number} addition
 * @param {number|null} beforeAllowance @param {number|null} additionAllowance
 * @param {number|null} afterAllowance
 * @returns {SkyMatchedOrderResidualChange} Signed radiance and SSE quantities.
 */
export function matchedOrderResidualChange(before, addition, beforeAllowance, additionAllowance, afterAllowance) {
	assert.ok(Number.isFinite(before) && Number.isFinite(addition));
	matchedOrderAllowance([beforeAllowance, additionAllowance, afterAllowance]);
	const after = before + addition,
		linear = 2 * before * addition,
		quadratic = addition ** 2,
		deltaSse = after ** 2 - before ** 2,
		identityResidual = Math.abs(deltaSse - linear - quadratic),
		scale = Math.max(Math.abs(before), Math.abs(addition), Math.abs(after), Number.MIN_VALUE);
	assert.ok(Number.isFinite(deltaSse));
	assert.ok(identityResidual <= 512 * Number.EPSILON * scale ** 2);
	const linearAllowance = crossAllowance(before, addition, beforeAllowance, additionAllowance),
		quadraticAllowance =
			additionAllowance === null ? null : 2 * Math.abs(addition) * additionAllowance + additionAllowance ** 2;
	return {
		beforeResidualWatts: before,
		afterResidualWatts: after,
		additionWatts: addition,
		beforeAllowanceWatts: beforeAllowance,
		afterAllowanceWatts: afterAllowance,
		additionAllowanceWatts: additionAllowance,
		linearSseTermWattsSquared: linear,
		quadraticSseTermWattsSquared: quadratic,
		deltaSseWattsSquared: deltaSse,
		deltaSseAllowanceWattsSquared: matchedOrderAllowance([linearAllowance, quadraticAllowance]),
		sseIdentityResidualWattsSquared: identityResidual,
	};
}

/** Authenticate the exact accepted H extension, original prefix and attribution.
 * @param {DialContinuationRegistrationRead} registration - Original C0 owner.
 * @returns {SkyMatchedOrderAssessmentInput} Read-only matched evidence.
 */
export function readMatchedOrderAssessment(registration) {
	const source = acceptedMechanismInput('tmp/experiments/sky-accuracy-dials/runs/00171-matched-h-n6');
	assert.equal(source.seal.byteLength, 206480);
	assert.equal(source.seal.sha256, '584023be2e9357670bb2df3afbf8d5ad0062df6d12608fd8a726556fdd06ee24');
	assert.equal(source.terminal.recipe.parameters.continuationRegistration, registration.run);
	assert.equal(source.terminal.recipe.parameters.caseId, 'matched-h-n6');
	assert.equal(
		/** @type {{extensionId:string}} */ (/** @type {unknown} */ (source.terminal.recipe.parameters)).extensionId,
		'compensation-attribution-v1',
	);
	const parent = readMatchedOrdersParent(registration),
		original = readSecondOrderOriginal(registration);
	const prefixId = mechanismArtifact(source, 'prefix.json'),
		predictionsId = mechanismArtifact(source, 'predictions.json'),
		planId = mechanismArtifact(source, 'matched-order-plan.md');
	const prefix = JSON.parse(readRepository(prefixId.path, prefixId).toString()),
		predictions = JSON.parse(readRepository(predictionsId.path, predictionsId).toString());
	assert.equal(prefix.schemaId, 'sky-matched-order-prefix-v1');
	assert.equal(prefix.parentRun, parent.run);
	assert.equal(prefix.passed, true);
	assert.equal(prefix.channels.length, 2);
	assert.equal(planId.sha256, 'd19f4f2e98b40c39d36c7c806e4a4fae18a5e313e932a1cee350eec261988a25');
	const identities = [source.seal, prefixId, predictionsId, planId, ...parent.identities, ...original.identities];
	const diagnostics = [0, 8].map((channel) => {
		const authority = parent.channels.find((row) => row.channel === channel),
			parity = prefix.channels.find((row) => row.channel === channel);
		assert.ok(authority && parity);
		assert.equal(parity.passed, true);
		assert.deepEqual(parity.expected, authority.expected);
		assertMatchedOrdersPrefix(parity.actual, authority.expected);
		const id = mechanismArtifact(source, `channel-${String(channel).padStart(2, '0')}-diagnostics.json.gz`);
		identities.push(id);
		const result = validateMatchedOrderDiagnostics(
			JSON.parse(gunzipSync(readRepository(id.path, id), {maxOutputLength: 2 * 1024 ** 2}).toString()),
			registration.probes,
			channel,
		);
		assert.equal(result.queryCount, authority.referenceQueryCount);
		assert.equal(result.preparationEvaluationCount, authority.referencePreparationEvaluationCount);
		return result;
	});
	assert.deepEqual(predictions.rows, diagnostics.flatMap(assessMatchedOrderPredictions));
	assert.equal(
		predictions.envelopesAdmitted,
		diagnostics.every((d) =>
			d.rows.filter((r) => r.methodId === 'reference-envelope').every((r) => r.errorAllowance !== null),
		),
	);
	assert.equal(predictions.physicalSubstitution.state, 'unresolved');
	return {
		identities: [...new Map(identities.map((id) => [id.path, id])).values()],
		original: original.rows,
		diagnostics,
	};
}

/** Assess the two frozen original rays in channels zero/eight without changing any fields.
 * @param {readonly SkyOrderAttributionRow[]} originals - Authenticated original attribution.
 * @param {readonly SkyMatchedOrderDiagnostics[]} diagnostics - Validated actual H stages.
 * @returns {SkyMatchedOrderAssessment} Descriptive addition, never a physical P2 replacement.
 */
export function assessMatchedOrders(originals, diagnostics) {
	assert.deepEqual(
		diagnostics.map((row) => row.channel),
		[0, 8],
	);
	const rows = ['p-0930-5-7', 'p-1230-3-5'].flatMap((probeId) =>
		diagnostics.map((diagnostic) => {
			const matches = originals.filter((row) => row.probeId === probeId && row.channel === diagnostic.channel);
			assert.equal(matches.length, 1);
			const original = matches[0];
			const envelopes = [1, 2, 3, 4, 5, 6].map((order) => {
				const found = diagnostic.rows.filter(
					(row) => row.probeId === probeId && row.order === order && row.methodId === 'reference-envelope',
				);
				assert.equal(found.length, 1);
				assert.equal(found[0].time, original.time);
				assert.ok(Number.isFinite(found[0].value));
				return found[0];
			});
			const values = envelopes.map((row) => row.value),
				allowances = envelopes.map((row) => row.errorAllowance);
			matchedOrderAllowance(allowances);
			assert.deepEqual(values.slice(0, 4), original.cumulative);
			assert.equal(original.allowances.length, 4);
			assert.deepEqual(
				original.allowances.slice(1),
				[1, 2, 3].map((i) => matchedOrderAllowance([allowances[i - 1], allowances[i]])),
			);
			const tail = values[5] - values[3],
				tailAllowance = matchedOrderAllowance([allowances[5], allowances[3]]),
				correction = -original.firstNumerical,
				correctionAllowance = matchedOrderAllowance([original.allowances[0], allowances[0]]),
				rawBefore = original.remaining + original.firstNumerical,
				raw = matchedOrderResidualChange(rawBefore, tail, allowances[3], tailAllowance, allowances[5]),
				physicalFirstOnly = matchedOrderResidualChange(
					original.remaining,
					tail,
					matchedOrderAllowance([correctionAllowance, allowances[3]]),
					tailAllowance,
					matchedOrderAllowance([correctionAllowance, allowances[5]]),
				),
				baselineSensitivity = 2 * correction * tail,
				baselineIdentityResidual = Math.abs(
					physicalFirstOnly.deltaSseWattsSquared - raw.deltaSseWattsSquared - baselineSensitivity,
				),
				scale = Math.max(Math.abs(rawBefore), Math.abs(original.remaining), Math.abs(tail), Number.MIN_VALUE);
			assert.ok(baselineIdentityResidual <= 1024 * Number.EPSILON * scale ** 2);
			return {
				probeId,
				time: original.time,
				channel: diagnostic.channel,
				original,
				cumulativeWatts: values,
				cumulativeAllowancesWatts: allowances,
				fifthIncrementWatts: values[4] - values[3],
				sixthIncrementWatts: values[5] - values[4],
				fifthAllowanceWatts: matchedOrderAllowance([allowances[4], allowances[3]]),
				sixthAllowanceWatts: matchedOrderAllowance([allowances[5], allowances[4]]),
				finiteAdditionWatts: tail,
				finiteAdditionAllowanceWatts: tailAllowance,
				firstCorrectionWatts: correction,
				firstCorrectionAllowanceWatts: correctionAllowance,
				raw,
				physicalFirstOnly,
				baselineSensitivityWattsSquared: baselineSensitivity,
				baselineSensitivityAllowanceWattsSquared: crossAllowance(
					correction,
					tail,
					correctionAllowance,
					tailAllowance,
				),
				baselineIdentityResidualWattsSquared: baselineIdentityResidual,
				firstErrorCrossBeforeWattsSquared: 2 * original.firstNumerical * original.remaining,
				firstErrorCrossAfterWattsSquared: 2 * original.firstNumerical * physicalFirstOnly.afterResidualWatts,
			};
		}),
	);
	return {
		schemaId: 'sky-matched-h-order-assessment-v1',
		units: 'W m^-2 sr^-1 nm^-1',
		rows,
		sums: {
			rawDeltaSseWattsSquared: rows.reduce((sum, row) => sum + row.raw.deltaSseWattsSquared, 0),
			physicalFirstOnlyDeltaSseWattsSquared: rows.reduce(
				(sum, row) => sum + row.physicalFirstOnly.deltaSseWattsSquared,
				0,
			),
			baselineSensitivityWattsSquared: rows.reduce((sum, row) => sum + row.baselineSensitivityWattsSquared, 0),
		},
		physicalSubstitution: {
			state: 'unresolved',
			physicalSecondWatts: null,
			reason: 'The held physical P1/P2 substitution requires a separately adequate physical P2 reference; this assessment adds only the retained frozen H N6 minus N4.',
		},
		limitations: [
			'N5 minus N4 and N6 minus N5 are effective grouped additions after the original nonlinear reconstruction, not isolated physical scattering terms.',
			'All original matched fields stay fixed. Changing the P1 residual baseline does not recompute or test recurrence interaction.',
			'Two positive finite increments do not bound the omitted infinite tail or establish recurrence accuracy.',
			'Allowances propagate empirical fixed-field view integration and the original physical P1 allowance; physical-model and measurement uncertainty are excluded.',
			'The four selected spectral scalars do not determine the full benchmark score.',
		],
	};
}
