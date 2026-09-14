import {integrateVector, referenceLimit} from './quadrature.mjs';
import {physicalReferencePolicy} from './policy.mjs';

/** Create per-ray/per-formulation accounting; callbacks may throw to cancel work.
 * @param {() => void} [onProgress] - Synchronous heartbeat/cancellation callback.
 * @returns {SkyPhysicalReferenceBudget} Fresh mutable accounting and fixed caps.
 */
export function createReferenceBudget(onProgress) {
	if (onProgress !== undefined && typeof onProgress !== 'function')
		throw new TypeError('Progress callback must be a function.');
	const policy = physicalReferencePolicy();
	return {
		profile: policy.profile,
		physicalMethod: null,
		mediumEvaluations: 0,
		maximumMediumEvaluations: policy.maximumMediumEvaluations.gauss,
		outerEvaluations: 0,
		maximumOuterEvaluations: policy.maximumOuterEvaluations,
		maximumColumnEvaluations: policy.maximumColumnEvaluations,
		columnCalls: 0,
		columnEvaluationHighWater: 0,
		toleranceScale: 1,
		lastProgressMilliseconds: Date.now(),
		onProgress,
	};
}

/** Authorize an explicit physical-J1 method under a named work profile.
 * Generic fixed-field column callers retain createReferenceBudget's original caps.
 * @param {SkyPhysicalReferenceMethod} method - Explicit physical integration method.
 * @param {SkyPhysicalReferenceProfile} profile - Selected named work profile.
 * @param {() => void} [onProgress] - Heartbeat/cancellation callback.
 * @returns {SkyPhysicalReferenceBudget} Bounded method-specific mutable accounting.
 */
export function createPhysicalMethodBudget(method, profile, onProgress) {
	if (!['gauss', 'simpson'].includes(method)) throw new RangeError('Unknown physical reference method.');
	const policy = physicalReferencePolicy(profile),
		budget = createReferenceBudget(onProgress);
	return {
		...budget,
		profile,
		physicalMethod: method,
		maximumMediumEvaluations: policy.maximumMediumEvaluations[method],
	};
}

/** Account for one pair of medium-profile evaluations before computing it.
 * @param {SkyPhysicalReferenceBudget} budget - Shared mutable work allowance.
 * @returns {void} Throws an explicit limit signal on exhaustion.
 */
export function consumeMediumEvaluation(budget) {
	if (budget.mediumEvaluations >= budget.maximumMediumEvaluations)
		throw referenceLimit('Physical ray medium-pair evaluation cap reached.');
	budget.mediumEvaluations++;
	if (budget.mediumEvaluations % 1024 === 0 || Date.now() - budget.lastProgressMilliseconds >= 1000) {
		budget.onProgress?.();
		budget.lastProgressMilliseconds = Date.now();
	}
}

/** Validate the supported fixed two-exponential, ozone-disabled physical model.
 * @param {SkyTransportSpec} spec - Physical input, never a reconstruction grid.
 * @returns {void} Throws before unsupported physics can be silently omitted.
 */
export function validatePhysicalSpec(spec) {
	const {planet, atmosphere, domains} = spec;
	if (
		!(planet.bottomRadiusMeters > 0) ||
		!(planet.topRadiusMeters > planet.bottomRadiusMeters) ||
		!Number.isFinite(planet.topRadiusMeters) ||
		!(atmosphere.rayleighScaleHeightMeters > 0) ||
		!Number.isFinite(atmosphere.rayleighScaleHeightMeters) ||
		!(atmosphere.mieScaleHeightMeters > 0) ||
		!Number.isFinite(atmosphere.mieScaleHeightMeters) ||
		!(atmosphere.mieSingleScatteringAlbedo >= 0 && atmosphere.mieSingleScatteringAlbedo <= 1) ||
		!(Math.abs(atmosphere.miePhaseFunctionG) < 1) ||
		atmosphere.ozone.absorptionEnabled !== false ||
		!domains.spectrum.channels.length
	)
		throw new RangeError('Independent physical reference requires finite exponential profiles and disabled ozone.');
	for (const spectral of domains.spectrum.channels)
		for (const value of [
			spectral.rayleighScatteringPerMeter,
			spectral.mieExtinctionPerMeter,
			spectral.sourceIrradianceDensityWattsPerSquareMeterPerNanometer,
		])
			if (!(value >= 0) || !Number.isFinite(value))
				throw new RangeError('Physical spectral coefficients must be finite and nonnegative.');
}

/** Integrate two geometric density columns without production transmittance helpers.
 * A column pair is reusable across every spectral channel. Component tolerances
 * imply an empirical optical-depth comparison of 1e-9 + 1e-8*abs(tau), scaled
 * by the caller's accuracy pass; no rigorous-bound interpretation is made.
 * @param {SkyTransportSpec} spec - Fixed physical exponential profile input.
 * @param {SkyVector3} origin - Physical path start in metres.
 * @param {SkyVector3} direction - Unit path direction.
 * @param {number} length - Nonnegative physical path extent in metres.
 * @param {SkyPhysicalReferenceMethod} method - Independent quadrature family.
 * @param {SkyPhysicalReferenceBudget} budget - Per-ray accounting shared across columns.
 * @returns {SkyPhysicalColumnResult} Best estimate and explicit resolution state.
 */
export function integrateColumns(spec, origin, direction, length, method, budget) {
	validatePhysicalSpec(spec);
	if (!['gauss', 'simpson'].includes(method)) throw new RangeError('Unknown physical reference column method.');
	const policy = physicalReferencePolicy(budget.profile);
	if (
		(budget.physicalMethod !== null && budget.physicalMethod !== method) ||
		(budget.profile !== 'standard' && budget.physicalMethod === null)
	)
		throw new RangeError('Expanded column budgets require the explicitly named physical method and profile.');
	const maximumMediumEvaluations =
		budget.physicalMethod === null
			? policy.maximumMediumEvaluations.gauss
			: policy.maximumMediumEvaluations[budget.physicalMethod];
	for (const [value, cap] of [
		[budget.maximumMediumEvaluations, maximumMediumEvaluations],
		[budget.maximumOuterEvaluations, policy.maximumOuterEvaluations],
		[budget.maximumColumnEvaluations, policy.maximumColumnEvaluations],
	])
		if (!Number.isInteger(value) || value < 0 || value > cap)
			throw new RangeError('Physical reference work allowance exceeds its declared cap.');
	for (const value of [
		budget.mediumEvaluations,
		budget.outerEvaluations,
		budget.columnCalls,
		budget.columnEvaluationHighWater,
	])
		if (!Number.isInteger(value) || value < 0)
			throw new RangeError('Physical reference accounting must be nonnegative integers.');
	if (
		origin.length !== 3 ||
		direction.length !== 3 ||
		[...origin, ...direction, length].some((value) => !Number.isFinite(value)) ||
		length < 0 ||
		Math.abs(Math.hypot(...direction) - 1) > 1e-12 ||
		!(budget.toleranceScale > 0) ||
		!Number.isFinite(budget.toleranceScale)
	)
		throw new RangeError('Physical column requires finite coordinates, unit direction and a nonnegative extent.');
	const radius = Math.hypot(...origin),
		projection = origin[0] * direction[0] + origin[1] * direction[1] + origin[2] * direction[2];
	const closestDistance = Math.min(length, Math.max(0, -projection));
	const closestRadius = Math.hypot(...origin.map((value, index) => value + closestDistance * direction[index]));
	if (closestRadius < spec.planet.bottomRadiusMeters - 1e-6)
		throw new RangeError('Physical column intersects the opaque ground.');
	const baseHeight = radius - spec.planet.bottomRadiusMeters;
	const rayleighMaximum = Math.max(
		...spec.domains.spectrum.channels.map((channel) => channel.rayleighScatteringPerMeter),
	);
	const mieMaximum = Math.max(...spec.domains.spectrum.channels.map((channel) => channel.mieExtinctionPerMeter));
	const absolute = [rayleighMaximum, mieMaximum].map(
		(coefficient) => (5e-10 * budget.toleranceScale) / Math.max(coefficient, 1e-12),
	);
	const before = budget.mediumEvaluations;
	budget.columnCalls++;
	const result = integrateVector(
		(distance) => {
			consumeMediumEvaluation(budget);
			const radialChangeSquared = distance * (2 * projection + distance);
			const pathRadius = Math.sqrt(Math.max(0, radius * radius + radialChangeSquared));
			const height = Math.max(0, baseHeight + radialChangeSquared / (pathRadius + radius));
			return [
				Math.exp(-height / spec.atmosphere.rayleighScaleHeightMeters),
				Math.exp(-height / spec.atmosphere.mieScaleHeightMeters),
			];
		},
		0,
		length,
		absolute,
		1e-8 * budget.toleranceScale,
		method,
		budget.maximumColumnEvaluations,
	);
	budget.columnEvaluationHighWater = Math.max(budget.columnEvaluationHighWater, budget.mediumEvaluations - before);
	return {
		rayleighMeters: result.values?.[0] ?? null,
		mieMeters: result.values?.[1] ?? null,
		errorRayleighMeters: result.errors?.[0] ?? null,
		errorMieMeters: result.errors?.[1] ?? null,
		evaluations: budget.mediumEvaluations - before,
		converged: result.converged,
		reason: result.reason,
	};
}
