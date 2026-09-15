import assert from 'node:assert/strict';
import {identity, sha256} from '../../io/files.mjs';
import {validatePhysicalSpec} from '../reference/physical/columns.mjs';
import {physicalReferencePolicy} from '../reference/physical/policy.mjs';
import {admitPhysicalReferenceChannel} from '../reference/physical/admission.mjs';
import {assembleClosestVolumeResult} from './index.mjs';
import {evaluateClosestVolumeMethod} from './method.mjs';

const originalSchema = 'sky-independent-volume-l1-v1';
const consistencyFailure = 'simpson coarse/fine difference exceeds the sum of its declared pass tolerances.';

/** Authenticate the exact runtime coordinate implementation through repository-owned safe paths.
 * Proofs, types and the standalone witness runner do not define reused numerical results.
 * @returns {DialFileIdentity[]} Ordered geometry/index/method/fallback source identities.
 */
export function incidentCoordinateSources() {
	return ['geometry.mjs', 'index.mjs', 'method.mjs', 'fallback.mjs'].map((name) =>
		identity(`experiments/sky-accuracy-dials/continuation/incident-coordinate/${name}`),
	);
}

/** Original physical fine-pass tolerance, unchanged by coordinate selection.
 * @param {number} value - Complete fine spectral radiance.
 * @returns {number} Absolute-plus-relative tolerance in spectral W.
 */
function tolerance(value) {
	return 1e-9 + 1e-6 * Math.abs(value);
}

/** Check every old/new fine pair without omitting ground, total, or unavailable values.
 * @param {readonly SkyPhysicalMethodResult[]} original - Complete original Gauss/Simpson pair.
 * @param {readonly SkyPhysicalMethodResult[]} candidate - Reused Gauss and new Simpson.
 * @param {number} count - Component-major vector length.
 * @returns {SkyIncidentFineComparison[]} Positive allowances with explicit failed/missing comparisons.
 */
export function incidentFineComparisons(original, candidate, count) {
	assert.ok(Number.isSafeInteger(count) && count > 0);
	for (const pair of [original, candidate])
		assert.deepEqual(pair.map((method) => method.method), ['gauss', 'simpson']);
	/** @type {SkyIncidentFineComparison[]} */ const result = [];
	for (let index = 0; index < count; index++)
		for (const oldMethod of original)
			for (const newMethod of candidate) {
				const a = oldMethod.values?.[index],
					b = newMethod.values?.[index],
					oldInner = oldMethod.innerAllowances?.[index],
					newInner = newMethod.innerAllowances?.[index];
				assert.ok(Number.isFinite(a) && a >= 0, 'Original fine evidence must be complete.');
				const available = [b, oldInner, newInner].every((value) => Number.isFinite(value) && value >= 0);
				const difference = available ? Math.abs(a - b) : null;
				const allowance = available ? tolerance(a) + tolerance(b) + oldInner + newInner : null;
				result.push({
					index,
					originalMethod: oldMethod.method,
					candidateMethod: newMethod.method,
					originalWatts: a,
					candidateWatts: Number.isFinite(b) && b >= 0 ? b : null,
					differenceWatts: difference,
					allowanceWatts: allowance,
					passed: allowance !== null && Number.isFinite(allowance) && difference <= allowance,
				});
			}
	return result;
}

/** Require complete original two-pass evidence and exact consumed-work accounting.
 * @param {SkyPhysicalMethodResult} method - Original independently evaluated method.
 * @param {number} count - Expected complete component vector length.
 * @param {SkyPhysicalReferencePolicy} policy - Original named work ceilings.
 * @returns {boolean} False for incomplete methods, without starting more work.
 */
function completeMethod(method, count, policy) {
	if (
		!method.converged || method.reasons.length || method.passes.length !== 2 ||
		method.passes.some((pass, index) => !pass.converged || pass.reason !== null || pass.toleranceScale !== [4, 1][index]) ||
		[method.values, method.coarseValues, method.refinementDifferences, method.outerErrors, method.innerAllowances].some(
			(values) => !values || values.length !== count || values.some((value) => !Number.isFinite(value) || value < 0),
		)
	) return false;
	for (const [key, maximum] of /** @type {const} */ ([
		['mediumEvaluations', policy.maximumMediumEvaluations[method.method]],
		['outerEvaluations', policy.maximumOuterEvaluations],
	])) {
		assert.ok(Number.isSafeInteger(method[key]) && method[key] >= 0 && method[key] <= maximum);
		assert.ok(method.passes.every((pass) => Number.isSafeInteger(pass[key]) && pass[key] >= 0));
		assert.equal(method.passes.reduce((sum, pass) => sum + pass[key], 0), method[key]);
	}
	return true;
}

/** Select only the original Simpson pass-consistency failure on complete global worker evidence.
 * @param {SkyVolumeResult} result - Original unresolved worker result.
 * @param {readonly number[]} channels - Exact caller channel order.
 * @returns {boolean} Unsupported failures and already changed coordinates remain untouched.
 */
function eligible(result, channels) {
	if (result.schemaId !== originalSchema || result.outerStrategy !== 'global') return false;
	const policy = physicalReferencePolicy(result.numericalPolicy.profile);
	assert.deepEqual(result.numericalPolicy, policy, 'Fallback cannot reinterpret changed numerical policies.');
	if (result.methods.length !== 2) return false;
	const [gauss, simpson] = result.methods;
	if (gauss.method !== 'gauss' || simpson.method !== 'simpson') return false;
	const count = 3 * channels.length;
	if (!result.methods.every((method) => completeMethod(method, count, policy))) return false;
	const reasons = Array.from({length: count}, (_, index) => admitPhysicalReferenceChannel(gauss, simpson, index).reasons).flat();
	if (!reasons.length || reasons.some((reason) => reason !== consistencyFailure)) return false;
	const recordedReasons = result.channels.flatMap((row) =>
		[row.atmosphere, row.directGround, row.total].flatMap((component) => component.reasons),
	);
	if (!recordedReasons.length || recordedReasons.some((reason) => reason.replace(/^(?:Atmosphere|Ground): /u, '') !== consistencyFailure))
		return false;
	const reproduced = assembleClosestVolumeResult(result.geometry, channels, gauss, simpson, {
		profile: policy.profile, outerStrategy: 'global',
	});
	assert.deepEqual(reproduced.channels, result.channels, 'Original admission must reproduce before a fallback.');
	return simpson.mediumEvaluations < policy.maximumMediumEvaluations.simpson &&
		simpson.outerEvaluations < policy.maximumOuterEvaluations;
}

/** Refine only complete original Simpson consistency failures under their remaining work ceilings.
 * Resolved and unsupported rows retain exact object identity. A replacement reuses
 * original Gauss and geometry, keeps worker elapsed time, and identifies the new map.
 * Caller-owned evidence records must retain records and extraWork even if no row resolves.
 * Guards propagate; a thrown guard never yields a purported complete batch.
 * @param {SkyTransportSpec} spec - Authenticated worker physical input.
 * @param {readonly number[]} channels - Exact supported spectral order.
 * @param {readonly SkyVolumeWorkerRow[]} rows - At most 4096 completed original worker rows.
 * @param {() => void} guard - Parent-thread heartbeat, deadline and resource guard.
 * @param {SkyIncidentFallbackObserver} [onAttempt] - Retain completed evidence before any subsequent guard.
 * @param {SkyIncidentFallbackInterruptionObserver} [onInterrupted] - Retain unavailable-work identity when a method throws.
 * @returns {SkyIncidentFallbackResult} Ordered results, compact attempts and uncancelled actual work.
 */
export function refineIncidentRows(spec, channels, rows, guard, onAttempt, onInterrupted) {
	const started = performance.now();
	validatePhysicalSpec(spec);
	assert.equal(typeof guard, 'function');
	assert.ok(onAttempt === undefined || typeof onAttempt === 'function');
	assert.ok(onInterrupted === undefined || typeof onInterrupted === 'function');
	assert.ok(channels.length > 0 && new Set(channels).size === channels.length);
	assert.ok(channels.every((channel) => Number.isInteger(channel) && spec.domains.spectrum.channels[channel]));
	assert.ok(Array.isArray(rows) && rows.length <= 4096);
	assert.equal(new Set(rows.map((row) => row.id)).size, rows.length);
	/** @type {SkyVolumeWorkerRow[]} */ const refined = [];
	/** @type {SkyIncidentFallbackRecord[]} */ const records = [];
	/** @type {SkyVolumeResult[]} */ const originalWitnesses = [];
	/** @type {SkyIncidentFallbackWork} */ const extraWork = {mediumEvaluations: 0, outerEvaluations: 0, mainThreadMilliseconds: 0};
	guard();
	for (const row of rows) {
		guard();
		assert.ok(typeof row.id === 'string' && row.id.length > 0);
		assert.ok(Number.isFinite(row.elapsedMilliseconds) && row.elapsedMilliseconds >= 0);
		assert.deepEqual(row.result.channels.map((channel) => channel.channel), channels);
		const old = row.result;
		if (!old.resolved && originalWitnesses.length < 8) originalWitnesses.push(old);
		if (old.resolved || !eligible(old, channels)) {
			refined.push(row);
			continue;
		}
		const attemptStarted = performance.now(),
			[gauss, oldSimpson] = old.methods,
			policy = old.numericalPolicy;
		const remainingCaps = {
			maximumMediumEvaluations: policy.maximumMediumEvaluations.simpson - oldSimpson.mediumEvaluations,
			maximumOuterEvaluations: policy.maximumOuterEvaluations - oldSimpson.outerEvaluations,
		};
		const options = {profile: policy.profile, outerStrategy: old.outerStrategy, guard, ...remainingCaps};
		/** @type {SkyPhysicalMethodResult} */ let simpson;
		try {
			simpson = evaluateClosestVolumeMethod(spec, old.geometry, channels, 'simpson', options);
		} catch (error) {
			onInterrupted?.({
				schemaId: 'sky-incident-coordinate-interrupted-v1', id: row.id,
				originalResultSha256: sha256(JSON.stringify(old)), geometrySha256: sha256(JSON.stringify(old.geometry)),
				originalMethods: old.methods, remainingCaps, candidateSimpson: null,
				mediumEvaluations: null, outerEvaluations: null,
				mainThreadMilliseconds: Math.max(0, performance.now() - attemptStarted),
				failure: error instanceof Error ? error.message : String(error),
			}, old);
			throw error;
		}
		assert.ok(simpson.mediumEvaluations <= remainingCaps.maximumMediumEvaluations);
		assert.ok(simpson.outerEvaluations <= remainingCaps.maximumOuterEvaluations);
		const candidate = assembleClosestVolumeResult(old.geometry, channels, gauss, simpson, options);
		const comparisons = incidentFineComparisons(old.methods, candidate.methods, 3 * channels.length);
		const replaced = candidate.resolved && comparisons.every((comparison) => comparison.passed);
		// Returned methods contain G+newS after replacement, otherwise the original G+oldS.
		const omitted = replaced ? oldSimpson : simpson;
		extraWork.mediumEvaluations += omitted.mediumEvaluations;
		extraWork.outerEvaluations += omitted.outerEvaluations;
		const returnedRow = replaced ? {...row, result: candidate} : row;
		refined.push(returnedRow);
		/** @type {SkyIncidentFallbackRecord} */ const record = {
			schemaId: 'sky-incident-coordinate-fallback-v1', id: row.id,
			originalResultSha256: sha256(JSON.stringify(old)), geometrySha256: sha256(JSON.stringify(old.geometry)),
			originalSchemaId: old.schemaId, originalChannels: old.channels, originalMethods: old.methods,
			profile: policy.profile, remainingCaps, candidateSimpson: simpson, candidateChannels: candidate.channels,
			candidateResolved: candidate.resolved, comparisons, replaced,
			mainThreadMilliseconds: Math.max(0, performance.now() - attemptStarted),
		};
		records.push(record);
		onAttempt?.(record, returnedRow, {
			mediumEvaluations: omitted.mediumEvaluations, outerEvaluations: omitted.outerEvaluations,
			mainThreadMilliseconds: record.mainThreadMilliseconds,
		}, old);
	}
	guard();
	extraWork.mainThreadMilliseconds = Math.max(0, performance.now() - started);
	return {rows: refined, records, extraWork, originalWitnesses};
}
