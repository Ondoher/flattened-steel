import {ALL_RAYS, CAPTURE_TIMES, SCORE_CHANNELS, assertAligned, selectBoundary} from './boundary.mjs';

/** Compute scores in the existing benchmark's x/y/channel arithmetic order. @param {DialAnalysisBoundary} model @param {DialAnalysisBoundary} measured @param {readonly number[]} [channels] @returns {DialBoundaryScore} */
export function scoreBoundary(model, measured, channels = SCORE_CHANNELS) {
	const selection = {times: model.times, rayIndices: model.rayIndices, channels};
	const selectedModel = selectBoundary(model, selection),
		selectedMeasured = selectBoundary(measured, selection);
	assertAligned(selectedModel, selectedMeasured);
	if (model.quantity !== 'radiance' || measured.quantity !== 'radiance')
		throw new Error('Only radiance boundaries may be scored against measurements.');
	const rayTraversal = [...model.rayIndices].sort(
		(first, second) => (first % 9) * 9 + Math.floor(first / 9) - ((second % 9) * 9 + Math.floor(second / 9)),
	);
	const conditions = model.times.map((time, timeIndex) => {
		let squaredError = 0,
			sampleCount = 0;
		for (const ray of rayTraversal) {
			const rayIndex = model.rayIndices.indexOf(ray);
			for (let channel = 0; channel < channels.length; channel++) {
				const index = (timeIndex * model.rayIndices.length + rayIndex) * channels.length + channel;
				const residual = selectedModel.values[index] - selectedMeasured.values[index];
				squaredError += residual * residual;
				sampleCount++;
			}
		}
		const rmseW = Math.sqrt(squaredError / sampleCount);
		if (!Number.isFinite(squaredError)) throw new Error('Score arithmetic overflow.');
		return {time, sampleCount, squaredError, rmseW, rmseMilliwatt: rmseW * 1000};
	});
	const squaredError = conditions.reduce((sum, condition) => sum + condition.squaredError, 0);
	const sampleCount = conditions.reduce((sum, condition) => sum + condition.sampleCount, 0);
	return {
		selection,
		fullRegisteredBoundary:
			JSON.stringify(model.times) === JSON.stringify(CAPTURE_TIMES) &&
			JSON.stringify(model.rayIndices) === JSON.stringify(ALL_RAYS) &&
			JSON.stringify(channels) === JSON.stringify(SCORE_CHANNELS),
		conditions,
		aggregateRmseMilliwatt:
			Math.sqrt(
				conditions.reduce((sum, condition) => sum + condition.rmseW * condition.rmseW, 0) / conditions.length,
			) * 1000,
		pooledRmseMilliwatt: Math.sqrt(squaredError / sampleCount) * 1000,
		meanConditionRmseMilliwatt:
			conditions.reduce((sum, condition) => sum + condition.rmseMilliwatt, 0) / conditions.length,
		squaredError,
		sampleCount,
	};
}

/** Signed candidate-minus-control physical spectra. @param {DialAnalysisBoundary} control @param {DialAnalysisBoundary} candidate @returns {DialAnalysisBoundary} */
export function spectralDelta(control, candidate) {
	assertAligned(control, candidate);
	if (control.quantity !== 'radiance' || candidate.quantity !== 'radiance')
		throw new Error('A physical response requires two radiance boundaries.');
	return {
		...candidate,
		configId: `${candidate.configId}-minus-${control.configId}`,
		quantity: 'delta',
		values: Float64Array.from(candidate.values, (value, index) => value - control.values[index]),
	};
}

/** Evaluate the exact SSE identity on already selected coordinates. @param {DialAnalysisBoundary} control @param {DialAnalysisBoundary} measured @param {DialAnalysisBoundary} delta @returns {DialScoreDeltaIdentity} */
export function scoreDeltaIdentity(control, measured, delta) {
	assertAligned(control, measured);
	assertAligned(control, delta);
	if (control.quantity !== 'radiance' || measured.quantity !== 'radiance' || delta.quantity !== 'delta')
		throw new Error('SSE expansion requires two radiance boundaries and a signed delta.');
	let residualCrossTerm = 0,
		deltaSquaredNorm = 0,
		before = 0,
		after = 0;
	for (let index = 0; index < control.values.length; index++) {
		const residual = control.values[index] - measured.values[index],
			change = delta.values[index];
		residualCrossTerm += 2 * residual * change;
		deltaSquaredNorm += change * change;
		before += residual * residual;
		after += (residual + change) ** 2;
	}
	const predictedSquaredErrorChange = residualCrossTerm + deltaSquaredNorm,
		actualSquaredErrorChange = after - before;
	if (![predictedSquaredErrorChange, actualSquaredErrorChange].every(Number.isFinite))
		throw new Error('SSE identity arithmetic overflow.');
	return {
		residualCrossTerm,
		deltaSquaredNorm,
		predictedSquaredErrorChange,
		actualSquaredErrorChange,
		identityResidual: actualSquaredErrorChange - predictedSquaredErrorChange,
	};
}

/** Full two-factor response contrast; SSE interaction includes the quadratic cross term even if radiance is additive. @param {DialAnalysisBoundary} control @param {DialAnalysisBoundary} factorA @param {DialAnalysisBoundary} factorB @param {DialAnalysisBoundary} combined @param {DialAnalysisBoundary} measured @param {number} floorW @returns {DialFactorialContrast} */
export function factorialContrast(control, factorA, factorB, combined, measured, floorW) {
	for (const boundary of [factorA, factorB, combined, measured]) assertAligned(control, boundary);
	if ([control, factorA, factorB, combined, measured].some((boundary) => boundary.quantity !== 'radiance'))
		throw new Error('Factorial contrasts require physical radiance outcomes.');
	if (!(floorW > 0) || !Number.isFinite(floorW))
		throw new RangeError('A positive preregistered scalar uncertainty floor is required.');
	const interaction = {
		...combined,
		configId: `${combined.configId}-factorial-interaction`,
		quantity: /** @type {DialAnalysisQuantity} */ ('delta'),
		values: new Float64Array(control.values.length),
	};
	let squaredInteraction = 0,
		squaredA = 0,
		squaredB = 0,
		squaredErrorInteraction = 0,
		additiveSquaredErrorCrossTerm = 0;
	for (let index = 0; index < control.values.length; index++) {
		const first = factorA.values[index] - control.values[index],
			second = factorB.values[index] - control.values[index];
		const residual = control.values[index] - measured.values[index],
			joint = combined.values[index] - control.values[index];
		const value = joint - first - second;
		interaction.values[index] = value;
		squaredInteraction += value * value;
		squaredA += first * first;
		squaredB += second * second;
		squaredErrorInteraction +=
			(residual + joint) ** 2 - (residual + first) ** 2 - (residual + second) ** 2 + residual * residual;
		additiveSquaredErrorCrossTerm += 2 * first * second;
	}
	const interactionNorm = Math.sqrt(squaredInteraction);
	if (
		![squaredInteraction, squaredA, squaredB, squaredErrorInteraction, additiveSquaredErrorCrossTerm].every(
			Number.isFinite,
		)
	)
		throw new Error('Factorial contrast arithmetic overflow.');
	return {
		interaction,
		interactionNorm,
		relativeInteraction:
			interactionNorm /
			Math.max(Math.sqrt(squaredA) + Math.sqrt(squaredB), floorW * Math.sqrt(control.values.length)),
		squaredErrorInteraction,
		additiveSquaredErrorCrossTerm,
	};
}

/** Geometry-only strata, fixed independently of measured residuals; membership overlaps across elevation and Sun angle. @param {string} time @param {readonly DialAnalysisRay[]} rays @returns {readonly DialGeometricStratum[]} */
export function geometricStrata(time, rays) {
	if (!CAPTURE_TIMES.includes(time) || rays.length !== 81 || new Set(rays.map((ray) => ray.rayIndex)).size !== 81)
		throw new Error('Geometry requires one complete canonical 81-ray condition.');
	for (const ray of rays)
		if (
			!ALL_RAYS.includes(ray.rayIndex) ||
			!Number.isFinite(ray.elevationDegrees) ||
			ray.elevationDegrees < 0 ||
			ray.elevationDegrees > 90 ||
			!Number.isFinite(ray.sunSeparationDegrees) ||
			ray.sunSeparationDegrees < 0 ||
			ray.sunSeparationDegrees > 180
		)
			throw new Error('Invalid geometric ray coordinates.');
	/** @type {readonly [string, (ray: DialAnalysisRay) => boolean][]} */
	const definitions = [
		['near-sun-at-most-15deg', (ray) => ray.sunSeparationDegrees <= 15],
		['middle-sun-15-to-90deg', (ray) => ray.sunSeparationDegrees > 15 && ray.sunSeparationDegrees < 90],
		['antisolar-at-least-90deg', (ray) => ray.sunSeparationDegrees >= 90],
		['low-elevation-at-most-20deg', (ray) => ray.elevationDegrees <= 20],
		['zenith-at-least-75deg', (ray) => ray.elevationDegrees >= 75],
	];
	return definitions.map(([name, predicate]) => ({
		id: `${time}/${name}`,
		time,
		rayIndices: rays
			.filter(predicate)
			.map((ray) => ray.rayIndex)
			.sort((first, second) => first - second),
	}));
}

/** Transpose numerics' scene-major x*9+y rays into the analysis y*9+x boundary for one wavelength. @param {Float64Array} values @param {readonly string[]} times @returns {Float64Array} */
export function transposeNumericsRays(values, times) {
	if (
		!(values instanceof Float64Array) ||
		values.length !== times.length * 81 ||
		times.some((time) => !CAPTURE_TIMES.includes(time)) ||
		values.some((value) => !Number.isFinite(value))
	)
		throw new Error('Expected one finite scene-major wavelength with x-major 81-ray blocks.');
	const output = new Float64Array(values.length);
	for (let scene = 0; scene < times.length; scene++)
		for (let gridX = 0; gridX < 9; gridX++)
			for (let gridY = 0; gridY < 9; gridY++)
				output[scene * 81 + gridY * 9 + gridX] = values[scene * 81 + gridX * 9 + gridY];
	return output;
}
