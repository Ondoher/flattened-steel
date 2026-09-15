import assert from 'node:assert/strict';

/** @param {SkyAltitudeValue} row @returns {void} Reject malformed numerical inputs, preserving null admission. */
function validateValue(row) {
	assert.ok(row && Number.isFinite(row.value));
	assert.ok(row.allowance === null || (Number.isFinite(row.allowance) && row.allowance >= 0));
}
/** @param {readonly {probeId:string,channel:number}[]} rows @returns {void} Exact four-group inventory. */
function validateGroups(rows) {
	assert.ok(Array.isArray(rows));
	assert.deepEqual(
		rows.map((row) => [row.probeId, row.channel]),
		[
			['p-0930-5-7', 0],
			['p-0930-5-7', 8],
			['p-1230-3-5', 0],
			['p-1230-3-5', 8],
		],
	);
}
/** Evaluate exact signed coefficients and propagate only their absolute numerical allowances.
 * Arithmetic roundoff is reported separately and does not change the preregistered gate.
 * @param {readonly number[]} coefficients @param {readonly SkyAltitudeValue[]} values
 * @returns {SkyAltitudeLinearValue} Central linear value and separate uncertainty components.
 */
export function altitudeLinearValue(coefficients, values) {
	assert.ok(coefficients.length > 0 && coefficients.length === values.length);
	coefficients.forEach((coefficient) => assert.ok(Number.isFinite(coefficient)));
	values.forEach(validateValue);
	const terms = values.map((row, i) => coefficients[i] * row.value),
		value = terms.reduce((sum, term) => sum + term, 0),
		allowance = values.some((row, i) => coefficients[i] !== 0 && row.allowance === null)
			? null
			: values.reduce((sum, row, i) => sum + Math.abs(coefficients[i]) * (row.allowance ?? 0), 0),
		roundoffAllowance = 32 * Number.EPSILON * terms.reduce((sum, term) => sum + Math.abs(term), 0);
	assert.ok(
		Number.isFinite(value) &&
			(allowance === null || Number.isFinite(allowance)) &&
			Number.isFinite(roundoffAllowance),
	);
	return {value, allowance, roundoffAllowance};
}

/** Freeze the registered altitude laws before their held target is supplied.
 * @param {SkyAltitudePredictionInput} input @returns {SkyAltitudePrediction} Both P63 models remain registered.
 */
export function predictAltitudeConvergence(input) {
	assert.ok(input && ['p51', 'p63'].includes(input.stage));
	validateGroups(input.groups);
	const rows = input.groups.map((group) => {
		validateValue(group.f1);
		validateValue(group.f8);
		if (input.stage === 'p51') assert.equal(group.f4, undefined, 'P51 prediction cannot consume its held F4.');
		else validateValue(group.f4);
		const values = input.stage === 'p51' ? [group.f1, group.f8] : [group.f1, group.f4, group.f8],
			parentOrder = /** @type {('f1'|'f4'|'f8')[]} */ (input.stage === 'p51' ? ['f1', 'f8'] : ['f1', 'f4', 'f8']);
		/** @type {SkyAltitudeModelPrediction[]} */ const models = [];
		for (const model of /** @type {('smooth-only'|'competing-rate')[]} */ (
			input.stage === 'p51' ? ['smooth-only'] : ['smooth-only', 'competing-rate']
		)) {
			const smooth = model === 'smooth-only',
				targetCoefficients =
					input.stage === 'p51' ? [1 / 21, 20 / 21] : smooth ? [0, -1 / 4, 5 / 4] : [1 / 56, -5 / 8, 45 / 28],
				responseCoefficients =
					input.stage === 'p51' ? [1 / 21, -1 / 21] : smooth ? [0, -1 / 4, 1 / 4] : [1 / 56, -5 / 8, 17 / 28],
				b = input.stage === 'p51' ? [-1 / 63, 64 / 63] : smooth ? [0, -1 / 3, 4 / 3] : [1 / 21, -4 / 3, 16 / 7],
				a =
					input.stage === 'p51'
						? [64 / 63, -64 / 63]
						: smooth
							? [0, 64 / 3, -64 / 3]
							: [32 / 21, -32 / 3, 64 / 7],
				d = input.stage === 'p51' ? [0, 0] : smooth ? [0, 0, 0] : [-4 / 7, 12, -80 / 7];
			models.push({
				model,
				parentOrder,
				targetCoefficients,
				responseCoefficients,
				target: altitudeLinearValue(targetCoefficients, values),
				response: altitudeLinearValue(responseCoefficients, values),
				fit: {
					b: altitudeLinearValue(b, values),
					a: altitudeLinearValue(a, values),
					d: altitudeLinearValue(d, values),
				},
			});
		}
		return {probeId: group.probeId, channel: group.channel, models};
	});
	return {schemaId: 'sky-altitude-convergence-prediction-v1', inputs: structuredClone(input), rows};
}

/** @param {readonly SkyVolumeCheckState[]} states @returns {SkyVolumeCheckState} Preserve individual failures. */
function conjunction(states) {
	return states.includes('failed') ? 'failed' : states.includes('unresolved') ? 'unresolved' : 'passed';
}

/** Apply the unchanged 25 percent and five-allowance gates to held responses only.
 * @param {SkyAltitudePrediction} prediction @param {readonly SkyAltitudeTarget[]} targets
 * @returns {SkyAltitudeAssessment} Complete per-group/vector/sign outcomes, without model selection.
 */
export function assessAltitudeConvergence(prediction, targets) {
	assert.deepEqual(prediction, predictAltitudeConvergence(prediction.inputs));
	validateGroups(targets);
	targets.forEach(validateValue);
	const models = prediction.rows[0].models.map((model, modelIndex) => {
		const rows = prediction.rows.map((group, index) => {
			const forecast = group.models[modelIndex],
				parents = prediction.inputs.groups[index],
				target = targets[index],
				parentValues = forecast.parentOrder.map((name) => parents[name]),
				residual = altitudeLinearValue(
					[1, ...forecast.targetCoefficients.map((coefficient) => -coefficient)],
					[target, ...parentValues],
				),
				predictedResponse = forecast.response.value,
				observedResponse = target.value - parents.f8.value,
				inputAllowance = residual.allowance,
				significanceThreshold = inputAllowance === null ? null : 5 * inputAllowance,
				magnitudeThreshold =
					inputAllowance === null ? null : 0.25 * Math.abs(predictedResponse) + inputAllowance,
				signFloor = inputAllowance === null ? null : inputAllowance + 1e-10,
				magnitude = /** @type {SkyVolumeCheckState} */ (
					inputAllowance === null || Math.abs(predictedResponse) <= significanceThreshold
						? 'unresolved'
						: Math.abs(residual.value) <= magnitudeThreshold
							? 'passed'
							: 'failed'
				),
				sign = /** @type {SkyVolumeCheckState} */ (
					signFloor === null ||
					Math.abs(predictedResponse) <= signFloor ||
					Math.abs(observedResponse) <= signFloor
						? 'unresolved'
						: Math.sign(predictedResponse) === Math.sign(observedResponse)
							? 'passed'
							: 'failed'
				);
			return {
				probeId: group.probeId,
				channel: group.channel,
				predictedResponse,
				observedResponse,
				signedError: residual.value,
				inputAllowance,
				roundoffAllowance: residual.roundoffAllowance,
				magnitudeThreshold,
				significanceThreshold,
				magnitude,
				signFloor,
				sign,
			};
		});
		const errorNorm = Math.hypot(...rows.map((row) => row.signedError)),
			predictedResponseNorm = Math.hypot(...rows.map((row) => row.predictedResponse)),
			inputAllowanceNorm = rows.some((row) => row.inputAllowance === null)
				? null
				: Math.hypot(...rows.map((row) => row.inputAllowance)),
			significanceThreshold = inputAllowanceNorm === null ? null : 5 * inputAllowanceNorm,
			magnitudeThreshold = inputAllowanceNorm === null ? null : 0.25 * predictedResponseNorm + inputAllowanceNorm,
			state = /** @type {SkyVolumeCheckState} */ (
				inputAllowanceNorm === null || predictedResponseNorm <= significanceThreshold
					? 'unresolved'
					: errorNorm <= magnitudeThreshold
						? 'passed'
						: 'failed'
			);
		return {
			model: model.model,
			rows,
			vector: {
				errorNorm,
				predictedResponseNorm,
				inputAllowanceNorm,
				magnitudeThreshold,
				significanceThreshold,
				state,
			},
			allGroupMagnitudes: conjunction(rows.map((row) => row.magnitude)),
		};
	});
	return {
		schemaId: 'sky-altitude-convergence-assessment-v1',
		stage: prediction.inputs.stage,
		models,
		physicalReferenceAdequate: false,
		limitations: [
			'Only held F(target)-F8 responses enter the magnitude denominators; known F8 radiance is excluded.',
			'Coefficient allowances follow the exact residual equation. Floating-point arithmetic allowance is reported separately and does not alter the registered gates.',
			'Fitted b includes unchanged numerical errors. Coefficients alone do not identify interpolation or a boundary mechanism.',
			'No physical P2 accuracy, Kider improvement or boundary-intervention qualification follows from a response prediction.',
		],
	};
}
