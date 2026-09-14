import {createHash} from 'node:crypto';
import {assertAligned, assertBoundary, assertIdentity, assertSelection, selectBoundary} from './boundary.mjs';
import {spectralDelta} from './metrics.mjs';

/** Content identity for the exact JSON-ready prediction to be sealed by IO. @param {DialSpectralPrediction} prediction @returns {string} */
export function predictionDigest(prediction) {
	return createHash('sha256').update(JSON.stringify(prediction)).digest('hex');
}

/** Compare exact retained artifact identities; identical numeric outputs at different run paths remain valid invariance evidence. @param {DialFileIdentity} first @param {DialFileIdentity} second @returns {boolean} */
function sameArtifact(first, second) {
	return first.path === second.path && first.sha256 === second.sha256 && first.byteLength === second.byteLength;
}

/** Whether two explicit coordinate scopes overlap in any scalar outcome. @param {DialAnalysisSelection} first @param {DialAnalysisSelection} second @returns {boolean} */
function overlaps(first, second) {
	assertSelection(first);
	assertSelection(second);
	return (
		first.times.some((value) => second.times.includes(value)) &&
		first.channels.some((value) => second.channels.includes(value)) &&
		first.rayIndices.some((value) => second.rayIndices.includes(value))
	);
}

/** Register a mechanism response without reading target values or measurements. @param {DialAnalysisBoundary} control @param {ArrayLike<number>} delta @param {string} mechanism @param {DialPredictionRegistration} registration @returns {DialSpectralPrediction} */
export function mechanisticPrediction(control, delta, mechanism, registration) {
	assertBoundary(control);
	if (
		control.quantity !== 'radiance' ||
		!registration.id ||
		!registration.targetConfigId ||
		!mechanism ||
		!['prospective-intervention', 'development-reconstruction'].includes(registration.scope)
	)
		throw new Error('Prediction identity, scope, mechanism and physical control are required.');
	if (
		!(registration.floorW > 0) ||
		!Number.isFinite(registration.floorW) ||
		!registration.floorEvidence?.length ||
		!registration.development?.length
	)
		throw new Error('A finite positive uncertainty floor and its earlier evidence are required.');
	for (const identity of registration.floorEvidence) assertIdentity(identity);
	for (const source of registration.development) {
		assertIdentity(source.artifact);
		if (source.selection) assertSelection(source.selection);
		if (
			!source.configId ||
			(registration.scope === 'prospective-intervention' &&
				source.configId === registration.targetConfigId &&
				(!source.selection || overlaps(source.selection, control)))
		)
			throw new Error(
				'A prospective predictor cannot consume overlapping target outcomes; prior screens require explicit disjoint coordinates.',
			);
	}
	if (registration.scope === 'prospective-intervention' && registration.targetConfigId === control.configId)
		throw new Error('The prospective target must differ from its control.');
	if (
		!registration.development.some(
			(source) => source.configId === control.configId && sameArtifact(source.artifact, control.sourceIdentity),
		)
	)
		throw new Error('The exact control must be declared as development evidence.');
	const values = Array.from(delta);
	if (values.length !== control.values.length || values.some((value) => !Number.isFinite(value)))
		throw new Error('Prediction delta must match every selected control coordinate.');
	return {
		...registration,
		development: registration.development.map((source) => ({
			...source,
			artifact: {...source.artifact},
			...(source.selection
				? {
						selection: {
							times: [...source.selection.times],
							channels: [...source.selection.channels],
							rayIndices: [...source.selection.rayIndices],
						},
					}
				: {}),
		})),
		floorEvidence: registration.floorEvidence.map((identity) => ({...identity})),
		schema: 'sky-accuracy-dials/spectral-prediction/v1',
		baselineConfigId: control.configId,
		baselineIdentity: {...control.sourceIdentity},
		units: control.units,
		times: [...control.times],
		channels: [...control.channels],
		rayIndices: [...control.rayIndices],
		unseenMeasurementData: false,
		mechanism,
		delta: values,
		minimumSignAgreement: 0.9,
		maximumRelativeVectorError: 0.25,
	};
}

/** Predict the unexecuted fine level from two earlier midpoint levels assuming a leading Q^-2 error, never an observed target fit. @param {DialAnalysisBoundary} coarse @param {DialAnalysisBoundary} medium @param {number} coarseCount @param {number} mediumCount @param {number} targetCount @param {DialPredictionRegistration} registration @returns {DialSpectralPrediction} */
export function midpointRefinementPrediction(coarse, medium, coarseCount, mediumCount, targetCount, registration) {
	assertAligned(coarse, medium);
	if (
		![coarseCount, mediumCount, targetCount].every((count) => Number.isSafeInteger(count) && count > 0) ||
		!(coarseCount < mediumCount && mediumCount < targetCount)
	)
		throw new Error('Require increasing positive coarse, medium and held-out target counts.');
	if (
		!registration.development.some(
			(source) => source.configId === coarse.configId && sameArtifact(source.artifact, coarse.sourceIdentity),
		)
	)
		throw new Error('The earlier coarse result must be declared as development evidence.');
	const scale = (1 / targetCount ** 2 - 1 / mediumCount ** 2) / (1 / mediumCount ** 2 - 1 / coarseCount ** 2);
	const delta = Float64Array.from(medium.values, (value, index) => (value - coarse.values[index]) * scale);
	return mechanisticPrediction(
		medium,
		delta,
		`Assume L(Q)=L(infinity)+a/Q^2+smaller terms; predict L(${targetCount})-L(${mediumCount})=(L(${mediumCount})-L(${coarseCount}))*${scale}. Geometry/shadow/interpolation nonsmoothness can falsify this asymptotic model; no continuum-accuracy guarantee.`,
		registration,
	);
}

/** Validate a retained prediction against outcomes generated after its sealed registration. IO authenticates the supplied identities and timing records. @param {DialSpectralPrediction} prediction @param {DialAnalysisBoundary} control @param {DialAnalysisBoundary} candidate @param {DialPredictionEvaluationEvidence} evidence @param {readonly DialGeometricStratum[]} [strata] @returns {DialPredictionEvaluation} */
export function evaluatePrediction(prediction, control, candidate, evidence, strata = []) {
	assertIdentity(evidence.predictionSeal);
	assertIdentity(evidence.candidateIdentity);
	assertBoundary(control);
	assertBoundary(candidate);
	if (
		predictionDigest(prediction) !== evidence.predictionSha256 ||
		prediction.schema !== 'sky-accuracy-dials/spectral-prediction/v1'
	)
		throw new Error('Prediction content differs from the authenticated sealed registration.');
	if (
		prediction.targetConfigId !== candidate.configId ||
		prediction.baselineConfigId !== control.configId ||
		!sameArtifact(prediction.baselineIdentity, control.sourceIdentity) ||
		!sameArtifact(evidence.candidateIdentity, candidate.sourceIdentity)
	)
		throw new Error('Prediction target or control artifact identity mismatch.');
	if (
		prediction.units !== control.units ||
		prediction.unseenMeasurementData !== false ||
		prediction.minimumSignAgreement !== 0.9 ||
		prediction.maximumRelativeVectorError !== 0.25 ||
		!(prediction.floorW > 0) ||
		!Number.isFinite(prediction.floorW) ||
		!['prospective-intervention', 'development-reconstruction'].includes(prediction.scope) ||
		!prediction.floorEvidence?.length ||
		!prediction.development?.length
	)
		throw new Error('Prediction units, known-data scope or empirical gates changed.');
	const selectedControl = selectBoundary(control, prediction),
		selectedCandidate = selectBoundary(candidate, prediction);
	for (const identity of prediction.floorEvidence) assertIdentity(identity);
	for (const source of prediction.development) {
		assertIdentity(source.artifact);
		if (source.selection) assertSelection(source.selection);
	}
	const actual = spectralDelta(selectedControl, selectedCandidate);
	if (prediction.delta.length !== actual.values.length || prediction.delta.some((value) => !Number.isFinite(value)))
		throw new Error('Prediction values are malformed.');
	const prospective = prediction.scope === 'prospective-intervention';
	if (prospective) {
		const lockTime = Date.parse(evidence.lockedAt),
			started = Date.parse(evidence.candidateStartedAt);
		if (!Number.isFinite(lockTime) || !Number.isFinite(started) || lockTime >= started)
			throw new Error('Prospective registration must be sealed before candidate generation starts.');
		for (const source of prediction.development)
			if (
				sameArtifact(source.artifact, candidate.sourceIdentity) ||
				(source.configId === candidate.configId &&
					(!source.selection || overlaps(source.selection, prediction)))
			)
				throw new Error('Target evidence leaked into a prospective prediction.');
		for (const identity of prediction.floorEvidence)
			if (sameArtifact(identity, candidate.sourceIdentity))
				throw new Error('Target evidence cannot set its own uncertainty floor.');
	}
	const definitions = prediction.times.map((time) => ({
		id: `${time}/all-selected-rays`,
		time,
		rayIndices: prediction.rayIndices,
	}));
	for (const stratum of strata) {
		if (
			!prediction.times.includes(stratum.time) ||
			new Set(stratum.rayIndices).size !== stratum.rayIndices.length ||
			stratum.rayIndices.some((ray) => !prediction.rayIndices.includes(ray))
		)
			throw new Error('A prediction stratum requests undeclared coordinates.');
		if (stratum.rayIndices.length) definitions.push(stratum);
	}
	if (new Set(definitions.map((group) => group.id)).size !== definitions.length)
		throw new Error('Prediction group identities must be unique.');
	const groups = definitions.map((group) => {
		let sampleCount = 0,
			resolvedCount = 0,
			correctSign = 0,
			errorSquared = 0,
			actualSquared = 0,
			maximumError = 0;
		for (const ray of group.rayIndices)
			for (let channel = 0; channel < prediction.channels.length; channel++) {
				const index =
					(prediction.times.indexOf(group.time) * prediction.rayIndices.length +
						prediction.rayIndices.indexOf(ray)) *
						prediction.channels.length +
					channel;
				const expected = prediction.delta[index],
					observed = actual.values[index],
					error = expected - observed;
				if (Math.abs(expected) > prediction.floorW || Math.abs(observed) > prediction.floorW) {
					resolvedCount++;
					if (
						Math.abs(expected) > prediction.floorW &&
						Math.abs(observed) > prediction.floorW &&
						Math.sign(expected) === Math.sign(observed)
					)
						correctSign++;
				}
				errorSquared += error * error;
				actualSquared += observed * observed;
				maximumError = Math.max(maximumError, Math.abs(error));
				sampleCount++;
			}
		const signAgreement = resolvedCount ? correctSign / resolvedCount : null;
		if (![errorSquared, actualSquared].every(Number.isFinite))
			throw new Error('Prediction metric arithmetic overflow.');
		const relativeVectorError =
			Math.sqrt(errorSquared) / Math.max(Math.sqrt(actualSquared), prediction.floorW * Math.sqrt(sampleCount));
		const passed =
			relativeVectorError <= prediction.maximumRelativeVectorError &&
			(signAgreement === null
				? maximumError <= prediction.floorW
				: signAgreement >= prediction.minimumSignAgreement);
		return {id: group.id, sampleCount, resolvedCount, signAgreement, relativeVectorError, passed};
	});
	return {
		predictionId: prediction.id,
		prospective,
		unseenMeasurementData: false,
		groups,
		passed: groups.every((group) => group.passed),
	};
}
