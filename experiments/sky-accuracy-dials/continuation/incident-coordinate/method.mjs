import {createPhysicalMethodBudget, consumeMediumEvaluation, integrateColumns} from '../reference/physical/columns.mjs';
import {integrateVector, referenceLimit} from '../reference/physical/quadrature.mjs';
import {integrateVectorGlobally} from '../reference/physical/global-quadrature.mjs';
import {volumePoint, volumeSphereExit} from '../volume-reference/geometry.mjs';
import {closestApproachAltitudeMap} from './geometry.mjs';

/** Propagate finite, nonnegative optical-depth error through physical transmission.
 * Clamping the lower optical depth to zero prevents overflow and respects T<=1.
 * Both sides of the empirical tau interval are included; no rigor is claimed.
 * @param {number} tau - Dimensionless optical depth.
 * @param {number} errorTau - Dimensionless empirical optical-depth allowance.
 * @returns {SkyVolumeAttenuation} Finite transmission and two-sided allowance.
 */
export function volumeAttenuation(tau, errorTau) {
	if (![tau, errorTau].every((value) => Number.isFinite(value) && value >= 0))
		throw new RangeError('Volume optical depth and allowance must be finite and nonnegative.');
	const value = Math.exp(-tau);
	const upper = Math.exp(-Math.max(0, tau - errorTau)) * -Math.expm1(-Math.min(tau, errorTau));
	const lower = value * -Math.expm1(-errorTau);
	return {value, allowance: Math.max(upper, lower)};
}

/** Resolve source plus view attenuation with matched exponential optical columns.
 * @param {SkyTransportSpec} spec - Validated physical coefficients.
 * @param {SkyVolumeGeometry} geometry - Finite incident ray.
 * @param {SkyVector3} point - Lit scattering/ground point in metres.
 * @param {number} distance - View distance from origin in metres.
 * @param {readonly number[]} channels - Admitted spectral indices.
 * @param {SkyPhysicalReferenceMethod} method - Independent column method.
 * @param {SkyPhysicalReferenceBudget} budget - Shared bounded method accounting.
 * @returns {SkyVolumeAttenuation[]} Per-channel finite attenuation and allowance.
 */
function attenuationAt(spec, geometry, point, distance, channels, method, budget) {
	const view = integrateColumns(spec, geometry.origin, geometry.direction, Math.max(0, distance), method, budget);
	const source = integrateColumns(
		spec,
		point,
		[0, 0, 1],
		volumeSphereExit(point, [0, 0, 1], spec.planet.topRadiusMeters),
		method,
		budget,
	);
	if (!view.converged || !source.converged)
		throw referenceLimit(view.reason ?? source.reason ?? 'An optical column is unresolved.');
	return channels.map((channel) => {
		const spectral = spec.domains.spectrum.channels[channel];
		const tau =
			spectral.rayleighScatteringPerMeter * (view.rayleighMeters + source.rayleighMeters) +
			spectral.mieExtinctionPerMeter * (view.mieMeters + source.mieMeters);
		const error =
			spectral.rayleighScatteringPerMeter * (view.errorRayleighMeters + source.errorRayleighMeters) +
			spectral.mieExtinctionPerMeter * (view.errorMieMeters + source.errorMieMeters);
		return volumeAttenuation(tau, error);
	});
}

/** Evaluate complete separated components for one tolerance pass.
 * @param {SkyTransportSpec} spec - Matched physical model.
 * @param {SkyVolumeGeometry} geometry - Exact split incident geometry.
 * @param {readonly number[]} channels - Spectral indices in vector order.
 * @param {SkyPhysicalReferenceMethod} method - Distance Gauss or branchwise altitude Simpson.
 * @param {SkyPhysicalReferenceBudget} budget - Shared work and guard state.
 * @param {SkyPhysicalOuterStrategy} outerStrategy - Outer-only error allocation; segment tolerances and inner columns are unchanged.
 * @returns {SkyVolumePass} Complete component-major vectors or explicit nonresolution.
 */
function evaluatePass(spec, geometry, channels, method, budget, outerStrategy) {
	const integrateOuter = outerStrategy === 'global' ? integrateVectorGlobally : integrateVector;
	const count = channels.length,
		atmosphere = Array(count).fill(0),
		errors = Array(count).fill(0),
		inner = Array(count).fill(0);
	const cosine = Math.max(-1, Math.min(1, geometry.direction[2])),
		g = spec.atmosphere.miePhaseFunctionG;
	const phaseR = (3 * (1 + cosine * cosine)) / (16 * Math.PI);
	const phaseM =
		(3 * (1 - g * g) * (1 + cosine * cosine)) / (8 * Math.PI * (2 + g * g) * (1 + g * g - 2 * g * cosine) ** 1.5);
	for (const segment of geometry.segments) {
		budget.onProgress?.();
		if (!segment.sourceVisible) continue;
		const map = closestApproachAltitudeMap(geometry, segment),
			fraction = (segment.endMeters - segment.startMeters) / geometry.lengthMeters;
		const result = integrateOuter(
			(coordinate) => {
				if (budget.outerEvaluations >= budget.maximumOuterEvaluations)
					throw referenceLimit('Volume ray outer-evaluation cap reached.');
				budget.outerEvaluations++;
				const mapped = method === 'gauss' ? {distance: coordinate, jacobian: 1} : map.evaluate(coordinate);
				if (mapped.jacobian === 0) return Array(2 * count).fill(0);
				const point = volumePoint(geometry.origin, geometry.direction, mapped.distance);
				consumeMediumEvaluation(budget);
				const height = Math.max(0, Math.hypot(...point) - spec.planet.bottomRadiusMeters);
				const densityR = Math.exp(-height / spec.atmosphere.rayleighScaleHeightMeters),
					densityM = Math.exp(-height / spec.atmosphere.mieScaleHeightMeters);
				const attenuation = attenuationAt(spec, geometry, point, mapped.distance, channels, method, budget);
				const source = channels.map((channel) => {
					const spectral = spec.domains.spectrum.channels[channel];
					return (
						spectral.sourceIrradianceDensityWattsPerSquareMeterPerNanometer *
						(spectral.rayleighScatteringPerMeter * densityR * phaseR +
							spectral.mieExtinctionPerMeter *
								densityM *
								spec.atmosphere.mieSingleScatteringAlbedo *
								phaseM) *
						mapped.jacobian
					);
				});
				return [
					...source.map((value, index) => value * attenuation[index].value),
					...source.map((value, index) => value * attenuation[index].allowance),
				];
			},
			method === 'gauss' ? segment.startMeters : 0,
			method === 'gauss' ? segment.endMeters : map.endCoordinate,
			Array(2 * count).fill(1e-9 * budget.toleranceScale * fraction),
			1e-6 * budget.toleranceScale,
			method,
			budget.maximumOuterEvaluations,
		);
		if (!result.converged)
			return {values: null, errors: null, innerAllowances: null, converged: false, reason: result.reason};
		for (let i = 0; i < count; i++) {
			atmosphere[i] += result.values[i];
			errors[i] += result.errors[i];
			inner[i] += result.values[i + count] + result.errors[i + count];
		}
	}
	const ground = Array(count).fill(0),
		groundInner = Array(count).fill(0);
	const cosineGround = Math.max(0, geometry.endpoint[2] / Math.hypot(...geometry.endpoint));
	if (
		geometry.boundary === 'ground' &&
		cosineGround > 0 &&
		channels.some((channel) => spec.domains.spectrum.channels[channel].groundAlbedo > 0)
	) {
		const attenuation = attenuationAt(
			spec,
			geometry,
			geometry.endpoint,
			geometry.lengthMeters,
			channels,
			method,
			budget,
		);
		for (let i = 0; i < count; i++) {
			const spectral = spec.domains.spectrum.channels[channels[i]],
				coefficient =
					(spectral.groundAlbedo *
						spectral.sourceIrradianceDensityWattsPerSquareMeterPerNanometer *
						cosineGround) /
					Math.PI;
			ground[i] = coefficient * attenuation[i].value;
			groundInner[i] = coefficient * attenuation[i].allowance;
		}
	}
	return {
		values: [...atmosphere, ...ground, ...atmosphere.map((value, i) => value + ground[i])],
		errors: [...errors, ...Array(count).fill(0), ...errors],
		innerAllowances: [...inner, ...groundInner, ...inner.map((value, i) => value + groundInner[i])],
		converged: true,
		reason: null,
	};
}

/** Execute coarse/fine tolerance passes with shared method caps and guard identity.
 * @param {SkyTransportSpec} spec - Matched physical inputs.
 * @param {SkyVolumeGeometry} geometry - Validated terminated geometry.
 * @param {readonly number[]} channels - Admitted channel order.
 * @param {SkyPhysicalReferenceMethod} method - Independent quadrature family.
 * @param {SkyVolumeOptions} options - Profile, optional lower caps and cooperative guard.
 * @returns {SkyPhysicalMethodResult} Component-major method evidence and actual work.
 */
export function evaluateClosestVolumeMethod(spec, geometry, channels, method, options) {
	const outerStrategy = options.outerStrategy ?? 'local';
	if (!['local', 'global'].includes(outerStrategy))
		throw new RangeError('Unknown volume outer integration strategy.');
	const budget = createPhysicalMethodBudget(method, options.profile ?? 'standard', options.guard);
	for (const key of ['maximumOuterEvaluations', 'maximumMediumEvaluations']) {
		const cap = options[key];
		if (cap !== undefined) {
			if (!Number.isInteger(cap) || cap < 0 || cap > budget[key])
				throw new RangeError(`Volume ${key} must lower the named profile cap.`);
			budget[key] = cap;
		}
	}
	/** @type {SkyVolumePass[]} */ const passes = [];
	/** @type {SkyPhysicalPassDiagnostics[]} */ const diagnostics = [];
	for (const toleranceScale of [4, 1]) {
		budget.onProgress?.();
		budget.toleranceScale = toleranceScale;
		budget.columnEvaluationHighWater = 0;
		const start = performance.now(),
			beforeMedium = budget.mediumEvaluations,
			beforeOuter = budget.outerEvaluations,
			beforeColumns = budget.columnCalls;
		/** @type {SkyVolumePass} */ let result;
		try {
			result = evaluatePass(spec, geometry, channels, method, budget, outerStrategy);
		} catch (error) {
			if (!(error instanceof RangeError && error.cause === 'sky-physical-reference-limit')) throw error;
			result = {values: null, errors: null, innerAllowances: null, converged: false, reason: error.message};
		}
		passes.push(result);
		diagnostics.push({
			toleranceScale,
			elapsedMilliseconds: Math.max(0, performance.now() - start),
			mediumEvaluations: budget.mediumEvaluations - beforeMedium,
			outerEvaluations: budget.outerEvaluations - beforeOuter,
			columnCalls: budget.columnCalls - beforeColumns,
			maximumColumnEvaluationsUsed: budget.columnEvaluationHighWater,
			converged: result.converged,
			reason: result.reason,
		});
		if (!result.converged) break;
	}
	const coarse = passes[0],
		fine = passes.length === 2 ? passes[1] : null;
	return {
		method,
		values: fine?.values ?? coarse.values,
		coarseValues: coarse.values,
		refinementDifferences:
			fine?.values && coarse.values ? fine.values.map((value, i) => Math.abs(value - coarse.values[i])) : null,
		outerErrors: fine?.errors ?? null,
		innerAllowances: fine?.innerAllowances ?? null,
		mediumEvaluations: budget.mediumEvaluations,
		outerEvaluations: budget.outerEvaluations,
		converged: passes.length === 2 && passes.every((pass) => pass.converged),
		reasons: passes.filter((pass) => !pass.converged).map((pass) => pass.reason),
		passes: diagnostics,
	};
}
