import assert from 'node:assert/strict';
import {predictMatchedAltitudeOrders} from './index.mjs';
import {matchedOrderAllowance, matchedOrderResidualChange} from '../matched-order-analysis/index.mjs';

/** @param {readonly (SkyOrderTransferValue|null)[]} values @returns {boolean} All numerical inputs available. */
function complete(values) {
	for (const row of values)
		if (row) {
			assert.ok(Number.isFinite(row.value));
			assert.ok(row.allowance === null || (Number.isFinite(row.allowance) && row.allowance >= 0));
		}
	return values.every((row) => row && row.allowance !== null);
}

/** Evaluate the registered response-only L2 inequality without scoring the known N4 contrast.
 * @param {readonly (SkyOrderTransferValue|null)[]} predicted
 * @param {readonly SkyOrderTransferValue[]} observed
 * @returns {SkyOrderTransferNormCheck} Exact finite-input gate, or unresolved.
 */
export function transferResponseNorm(predicted, observed) {
	assert.ok(predicted.length > 0 && predicted.length === observed.length);
	const admitted = complete(predicted) && complete(observed);
	const errorNormWatts = admitted ? Math.hypot(...predicted.map((row, i) => row.value - observed[i].value)) : null,
		predictionNormWatts = admitted ? Math.hypot(...predicted.map((row) => row.value)) : null,
		summedAllowanceNormWatts = admitted
			? Math.hypot(...predicted.map((row, i) => row.allowance + observed[i].allowance))
			: null,
		thresholdWatts = admitted ? 0.25 * predictionNormWatts + summedAllowanceNormWatts : null;
	return {
		count: predicted.length,
		errorNormWatts,
		predictionNormWatts,
		summedAllowanceNormWatts,
		thresholdWatts,
		state: !admitted ? 'unresolved' : errorNormWatts <= thresholdWatts ? 'passed' : 'failed',
	};
}

/** Preserve the original one-target-allowance gate and the larger superiority allowance.
 * @param {readonly (SkyOrderTransferValue|null)[]} primary
 * @param {readonly (SkyOrderTransferValue|null)[]} comparator
 * @param {readonly SkyOrderTransferValue[]} observed
 * @returns {SkyOrderTransferModelComparison} Noninferiority and superiority are separate.
 */
export function compareTransferModels(primary, comparator, observed) {
	assert.ok(primary.length > 0 && primary.length === comparator.length && primary.length === observed.length);
	const admitted = complete(primary) && complete(comparator) && complete(observed),
		primaryErrorNormWatts = admitted ? Math.hypot(...primary.map((row, i) => row.value - observed[i].value)) : null,
		comparatorErrorNormWatts = admitted
			? Math.hypot(...comparator.map((row, i) => row.value - observed[i].value))
			: null,
		primaryAllowanceNormWatts = admitted ? Math.hypot(...primary.map((row) => row.allowance)) : null,
		comparatorAllowanceNormWatts = admitted ? Math.hypot(...comparator.map((row) => row.allowance)) : null,
		targetAllowanceNormWatts = admitted ? Math.hypot(...observed.map((row) => row.allowance)) : null,
		noninferiorityAllowanceWatts = admitted
			? primaryAllowanceNormWatts + comparatorAllowanceNormWatts + targetAllowanceNormWatts
			: null,
		superiorityAllowanceWatts = admitted ? noninferiorityAllowanceWatts + targetAllowanceNormWatts : null,
		advantage = admitted ? comparatorErrorNormWatts - primaryErrorNormWatts : null;
	return {
		primaryErrorNormWatts,
		comparatorErrorNormWatts,
		primaryAllowanceNormWatts,
		comparatorAllowanceNormWatts,
		targetAllowanceNormWatts,
		noninferiorityAllowanceWatts,
		superiorityAllowanceWatts,
		noninferiority: !admitted
			? 'unresolved'
			: primaryErrorNormWatts <= comparatorErrorNormWatts + noninferiorityAllowanceWatts
				? 'passed'
				: 'failed',
		primarySuperiority:
			!admitted || Math.abs(advantage) <= superiorityAllowanceWatts
				? 'unresolved'
				: advantage > 0
					? 'passed'
					: 'failed',
		superiorModel:
			!admitted || Math.abs(advantage) <= superiorityAllowanceWatts
				? null
				: advantage > 0
					? 'primary'
					: 'comparator',
		allowanceExplanation:
			'Registered noninferiority U = ||Up||2 + ||Uc||2 + ||Ut||2. Separate superiority uses ||Up||2 + ||Uc||2 + 2||Ut||2 because the difference of two error norms has target Lipschitz bound two. Neither includes unknown model error.',
	};
}

/** Apply the exact prescribed shared sign floor; equality remains unresolved.
 * @param {SkyOrderTransferValue|null} predicted @param {SkyOrderTransferValue} observed
 * @returns {SkyOrderTransferSign} One sign comparison.
 */
export function transferResponseSign(predicted, observed) {
	const admitted = complete([predicted, observed]),
		floorWatts = admitted ? predicted.allowance + observed.allowance + 1e-10 : null;
	return {
		floorWatts,
		state:
			!admitted || Math.abs(predicted.value) <= floorWatts || Math.abs(observed.value) <= floorWatts
				? 'unresolved'
				: Math.sign(predicted.value) === Math.sign(observed.value)
					? 'passed'
					: 'failed',
	};
}

/** Require four resolved signs and ninety percent agreement, excluding unresolved signs.
 * @param {readonly SkyOrderTransferSign[]} signs @returns {SkyOrderTransferSignSummary} Registered sign-rate gate.
 */
export function summarizeTransferSigns(signs) {
	assert.ok(signs.length > 0);
	for (const row of signs) assert.ok(['passed', 'failed', 'unresolved'].includes(row.state));
	const passed = signs.filter((row) => row.state === 'passed').length,
		failed = signs.filter((row) => row.state === 'failed').length,
		resolved = passed + failed;
	return {
		total: signs.length,
		resolved,
		passed,
		failed,
		unresolved: signs.length - resolved,
		agreementRate: resolved ? passed / resolved : null,
		state: resolved < 4 ? 'unresolved' : passed / resolved >= 0.9 ? 'passed' : 'failed',
	};
}

/** @param {readonly SkyVolumeCheckState[]} states @returns {SkyVolumeCheckState} Conjunction with explicit failure precedence. */
function conjunction(states) {
	return states.includes('failed') ? 'failed' : states.includes('unresolved') ? 'unresolved' : 'passed';
}

/** Preserve the actual finite altitude-by-order interaction and identical-measurement SSE identity.
 * @param {SkyOrderTransferAssessmentInput} input @returns {SkyOrderTransferSseAssessment} Original N4 is separate.
 */
export function transferSseIdentity(input) {
	const {h} = input.frozen,
		p = input.target,
		original = input.original;
	assert.equal(h.length, 6);
	assert.equal(p.length, 6);
	assert.deepEqual(
		original.cumulative,
		h.slice(0, 4).map((row) => row.value),
	);
	assert.ok(Number.isFinite(original.remaining) && Number.isFinite(original.firstNumerical));
	const residualH4 = original.remaining + original.firstNumerical,
		measurementWatts = h[3].value - residualH4,
		hTail = h[5].value - h[3].value,
		pTail = p[5].value - p[3].value,
		d4 = p[3].value - h[3].value,
		tailInteraction = pTail - hTail,
		d6 = p[5].value - h[5].value,
		n4 = matchedOrderResidualChange(
			residualH4,
			d4,
			h[3].allowance,
			matchedOrderAllowance([p[3].allowance, h[3].allowance]),
			p[3].allowance,
		),
		n6 = matchedOrderResidualChange(
			residualH4 + hTail,
			d6,
			h[5].allowance,
			matchedOrderAllowance([p[5].allowance, h[5].allowance]),
			p[5].allowance,
		),
		deltaContrast = n6.deltaSseWattsSquared - n4.deltaSseWattsSquared,
		sharedTailCross = 2 * hTail * d4,
		interactionLinear = 2 * (residualH4 + d4 + hTail) * tailInteraction,
		interactionQuadratic = tailInteraction ** 2,
		contrastIdentityResidual = Math.abs(d6 - d4 - tailInteraction),
		sseIdentityResidual = Math.abs(deltaContrast - sharedTailCross - interactionLinear - interactionQuadratic),
		scale = Math.max(...[...h, ...p].map((row) => Math.abs(row.value)), Math.abs(residualH4), Number.MIN_VALUE);
	assert.ok(contrastIdentityResidual <= 256 * Number.EPSILON * scale);
	assert.ok(sseIdentityResidual <= 1024 * Number.EPSILON * scale ** 2);
	return {
		measurementWatts,
		measurementDerivation:
			'M = original H N4 - (remaining + firstNumerical), using authenticated original attribution 00152; no new measurement or physical P2 is introduced.',
		hN4Watts: h[3].value,
		pN4Watts: p[3].value,
		hN6Watts: h[5].value,
		pN6Watts: p[5].value,
		hFiniteTailWatts: hTail,
		pFiniteTailWatts: pTail,
		knownN4ResponseWatts: d4,
		knownN4ResponseAllowanceWatts: matchedOrderAllowance([p[3].allowance, h[3].allowance]),
		observedTailInteractionWatts: tailInteraction,
		observedTailInteractionAllowanceWatts: matchedOrderAllowance([
			p[5].allowance,
			p[3].allowance,
			h[5].allowance,
			h[3].allowance,
		]),
		n6ResponseWatts: d6,
		contrastIdentityResidualWatts: contrastIdentityResidual,
		n4,
		n6,
		deltaContrastSseWattsSquared: deltaContrast,
		sharedTailCrossWattsSquared: sharedTailCross,
		interactionLinearWattsSquared: interactionLinear,
		interactionQuadraticWattsSquared: interactionQuadratic,
		sseIdentityResidualWattsSquared: sseIdentityResidual,
	};
}

/** Replay the frozen models and evaluate every held response predicate without refitting.
 * @param {readonly SkyOrderTransferAssessmentInput[]} inputs - Four authenticated original groups.
 * @returns {SkyOrderTransferAssessment} Failed and unresolved gates remain evidence.
 */
export function assessMatchedAltitudeResponse(inputs) {
	assert.equal(inputs.length, 4);
	assert.deepEqual(
		inputs.map((row) => [row.frozen.probeId, row.frozen.channel]),
		[
			['p-0930-5-7', 0],
			['p-0930-5-7', 8],
			['p-1230-3-5', 0],
			['p-1230-3-5', 8],
		],
	);
	/** @type {SkyOrderTransferScalarAssessment[]} */ const scalars = [];
	/** @type {SkyOrderTransferTailAssessment[]} */ const tails = [];
	const groups = inputs.map((input) => {
		const {frozen, prediction, target, original} = input;
		assert.deepEqual(
			predictMatchedAltitudeOrders(frozen),
			prediction,
			'The original frozen model prediction changed.',
		);
		assert.equal(target.length, 6);
		complete(target);
		assert.deepEqual(target.slice(0, 4), frozen.p, 'Matched target N1..N4 envelope prefix changed.');
		assert.equal(original.probeId, frozen.probeId);
		assert.equal(original.channel, frozen.channel);
		if (prediction.admitted)
			assert.deepEqual(
				prediction.forecasts.map((row) => row.model),
				['damped-log-ratio', 'last-log-step'],
			);
		else assert.equal(prediction.forecasts.length, 0);
		const primary = prediction.forecasts.find((row) => row.model === 'damped-log-ratio') ?? null,
			comparator = prediction.forecasts.find((row) => row.model === 'last-log-step') ?? null;
		const observed = [4, 5].map((i) => ({
			value: target[i].value - target[i - 1].value - (frozen.h[i].value - frozen.h[i - 1].value),
			allowance: matchedOrderAllowance([
				target[i].allowance,
				target[i - 1].allowance,
				frozen.h[i].allowance,
				frozen.h[i - 1].allowance,
			]),
		}));
		for (const [i, row] of observed.entries())
			scalars.push({
				probeId: frozen.probeId,
				channel: frozen.channel,
				order: /** @type {5|6} */ (i + 5),
				observed: row,
				primary: primary?.responses[i] ?? null,
				comparator: comparator?.responses[i] ?? null,
				sign: transferResponseSign(primary?.responses[i] ?? null, row),
			});
		const sse = transferSseIdentity(input),
			tail = {value: sse.observedTailInteractionWatts, allowance: sse.observedTailInteractionAllowanceWatts};
		assert.ok(
			Math.abs(observed[0].value + observed[1].value - tail.value) <=
				256 * Number.EPSILON * Math.max(...target.map((row) => Math.abs(row.value)), Number.MIN_VALUE),
		);
		tails.push({
			probeId: frozen.probeId,
			channel: frozen.channel,
			observed: tail,
			primary: primary?.tail ?? null,
			comparator: comparator?.tail ?? null,
			primaryErrorWatts: primary ? primary.tail.value - tail.value : null,
			comparatorErrorWatts: comparator ? comparator.tail.value - tail.value : null,
		});
		return {
			probeId: frozen.probeId,
			channel: frozen.channel,
			inputAdmitted: prediction.admitted,
			targetAdmitted: complete(observed),
			primaryNorm: transferResponseNorm(primary?.responses ?? [null, null], observed),
			comparatorNorm: transferResponseNorm(comparator?.responses ?? [null, null], observed),
			sse,
		};
	});
	const primary = scalars.map((row) => row.primary),
		comparator = scalars.map((row) => row.comparator),
		observed = scalars.map((row) => row.observed),
		primaryAggregateNorm = transferResponseNorm(primary, observed),
		comparatorAggregateNorm = transferResponseNorm(comparator, observed),
		allPrimaryGroupNorms = conjunction(groups.map((row) => row.primaryNorm.state)),
		signs = summarizeTransferSigns(scalars.map((row) => row.sign)),
		modelComparison = compareTransferModels(primary, comparator, observed),
		inputAdmission = /** @type {SkyVolumeCheckState} */ (
			groups.every((row) => row.inputAdmitted && row.targetAdmitted) ? 'passed' : 'unresolved'
		);
	return {
		schemaId: 'sky-matched-p55-response-assessment-v1',
		units: 'W m^-2 sr^-1 nm^-1',
		groups,
		scalars,
		tails,
		inputAdmission,
		primaryAggregateNorm,
		comparatorAggregateNorm,
		allPrimaryGroupNorms,
		signs,
		modelComparison,
		primaryQualification: conjunction([
			inputAdmission,
			primaryAggregateNorm.state,
			allPrimaryGroupNorms,
			signs.state,
			modelComparison.noninferiority,
		]),
		limitations: [
			'The eight scored quantities are held effective order-five/six altitude responses; the already-known N4 response and tail sums are excluded from their L2 denominator.',
			'Effective grouped increments include the original nonlinear reconstruction. A finite altitude-by-order interaction is not an independently established physical scattering error.',
			'The primary and comparison models stay fixed; no model selection or refitting follows the target.',
			'Input allowances exclude model error, recurrence-field accuracy, physical-model uncertainty and measurement uncertainty.',
			'Response predictability does not establish higher-order numerical accuracy, full-benchmark improvement, physical P1/P2 adequacy or an infinite-tail bound.',
		],
	};
}
