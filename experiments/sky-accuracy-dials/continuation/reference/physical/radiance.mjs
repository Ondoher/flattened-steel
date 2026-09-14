import {
	createPhysicalMethodBudget,
	consumeMediumEvaluation,
	integrateColumns,
	validatePhysicalSpec,
} from './columns.mjs';
import {integrateVector, referenceLimit} from './quadrature.mjs';
import {integrateVectorGlobally} from './global-quadrature.mjs';
import {admitPhysicalReferenceChannel} from './admission.mjs';
import {physicalReferencePolicy} from './policy.mjs';

/** Independent positive outgoing intersection with a sphere.
 * @param {SkyVector3} origin - Physical position.
 * @param {SkyVector3} direction - Unit direction.
 * @param {number} radius - Target sphere radius.
 * @returns {number} Positive exit distance, with exact surface zero permitted.
 */
function sphereExit(origin, direction, radius) {
	const r = Math.hypot(...origin),
		projection = origin[0] * direction[0] + origin[1] * direction[1] + origin[2] * direction[2];
	const delta = (radius - r) * (radius + r),
		root = Math.sqrt(Math.max(0, projection * projection + delta));
	return projection >= 0 ? (root + projection === 0 ? 0 : delta / (root + projection)) : root - projection;
}

/** Determine opaque-ground visibility using the closest point on the source half ray.
 * @param {SkyTransportSpec} spec - Ground radius owner.
 * @param {SkyVector3} point - Scattering position; the source is along +Z.
 * @returns {boolean} Whether the direct collimated source is visible.
 */
function sourceVisible(spec, point) {
	if (point[2] >= 0) return true;
	return Math.hypot(point[0], point[1]) >= spec.planet.bottomRadiusMeters;
}

/** Analytic outward-ray coordinate transform, including the finite tangent limit.
 * @param {number} radius - Observer distance from the planet center in metres.
 * @param {number} projection - Nonnegative observer position dot unit direction.
 * @param {number} coordinate - Square root of altitude increment in sqrt(metres).
 * @returns {SkyPhysicalAltitudeCoordinate} Physical distance and exact coordinate Jacobian.
 */
export function mapAltitudeCoordinate(radius, projection, coordinate) {
	const dh = coordinate * coordinate,
		radialIncrement = dh * (2 * radius + dh);
	const root = Math.sqrt(projection * projection + radialIncrement);
	return {
		distance: root + projection === 0 ? 0 : radialIncrement / (root + projection),
		jacobian: root === 0 ? Math.sqrt(2 * radius) : (2 * coordinate * (radius + dh)) / root,
	};
}

/** Resolve one physical first-order ray with two successive tolerance passes.
 * The Simpson coordinate is u=sqrt(h-h_origin), removing the h→s Jacobian's
 * surface-tangent singularity analytically. All columns use that method's
 * independent distance integrator; geometry columns are shared across channels.
 * @param {SkyTransportSpec} spec - Supported physical model.
 * @param {SkyRayGeometry} ray - Exact benchmark outward surface geometry.
 * @param {readonly number[]} channels - Direct40 indices evaluated together.
 * @param {SkyPhysicalReferenceMethod} method - Independent formulation.
 * @param {SkyPhysicalReferenceProfile} profile - Explicit bounded work profile.
 * @param {() => void} [onProgress] - Heartbeat/cancellation callback.
 * @param {SkyPhysicalOuterStrategy} [outerStrategy='local'] - Outer-only adaptive error allocation; inner columns remain legacy.
 * @returns {SkyPhysicalMethodResult} Refinement estimates, counts and unresolved reasons.
 */
function evaluateMethod(spec, ray, channels, method, profile, onProgress, outerStrategy = 'local') {
	const integrateOuter = outerStrategy === 'global' ? integrateVectorGlobally : integrateVector;
	const budget = createPhysicalMethodBudget(method, profile, onProgress),
		reasons = new Set(),
		count = channels.length;
	const radius = Math.hypot(...ray.origin),
		projection = Math.max(
			0,
			ray.origin[0] * ray.direction[0] + ray.origin[1] * ray.direction[1] + ray.origin[2] * ray.direction[2],
		);
	const baseHeight = radius - spec.planet.bottomRadiusMeters;
	const phaseCosine = Math.max(-1, Math.min(1, ray.direction[2])),
		g = spec.atmosphere.miePhaseFunctionG;
	const rayleighPhase = (3 * (1 + phaseCosine * phaseCosine)) / (16 * Math.PI);
	const miePhase =
		(3 * (1 - g * g) * (1 + phaseCosine * phaseCosine)) /
		(8 * Math.PI * (2 + g * g) * (1 + g * g - 2 * g * phaseCosine) ** 1.5);
	const endHeightIncrement =
		(ray.length * (2 * projection + ray.length)) /
		(Math.sqrt(radius * radius + ray.length * (2 * projection + ray.length)) + radius);
	const endCoordinate = method === 'gauss' ? ray.length : Math.sqrt(Math.max(0, endHeightIncrement));
	/** @type {SkyPhysicalQuadratureResult[]} */
	const passes = [];
	/** @type {SkyPhysicalPassDiagnostics[]} */
	const diagnostics = [];
	for (const toleranceScale of [4, 1]) {
		budget.toleranceScale = toleranceScale;
		budget.columnEvaluationHighWater = 0;
		const started = performance.now(),
			beforeMedium = budget.mediumEvaluations,
			beforeOuter = budget.outerEvaluations,
			beforeColumns = budget.columnCalls;
		const result = integrateOuter(
			(coordinate) => {
				if (budget.outerEvaluations >= budget.maximumOuterEvaluations)
					throw referenceLimit('Physical ray outer-point evaluation cap reached.');
				budget.outerEvaluations++;
				let distance = coordinate,
					jacobian = 1;
				if (method === 'simpson') {
					const mapped = mapAltitudeCoordinate(radius, projection, coordinate);
					distance = mapped.distance;
					jacobian = mapped.jacobian;
				}
				/** @type {SkyVector3} */
				const point = [
					ray.origin[0] + distance * ray.direction[0],
					ray.origin[1] + distance * ray.direction[1],
					ray.origin[2] + distance * ray.direction[2],
				];
				if (jacobian === 0 || !sourceVisible(spec, point)) return Array(2 * count).fill(0);
				consumeMediumEvaluation(budget);
				const delta = distance * (2 * projection + distance);
				const height = Math.max(0, baseHeight + delta / (Math.sqrt(radius * radius + delta) + radius));
				const densityR = Math.exp(-height / spec.atmosphere.rayleighScaleHeightMeters);
				const densityM = Math.exp(-height / spec.atmosphere.mieScaleHeightMeters);
				const view = integrateColumns(spec, ray.origin, ray.direction, distance, method, budget);
				const source = integrateColumns(
					spec,
					point,
					[0, 0, 1],
					Math.max(0, sphereExit(point, [0, 0, 1], spec.planet.topRadiusMeters)),
					method,
					budget,
				);
				if (!view.converged || !source.converged) {
					reasons.add(view.reason ?? source.reason ?? 'An optical-depth column is unresolved.');
					throw referenceLimit('An optical-depth column is unresolved.');
				}
				const values = [],
					allowances = [];
				for (const channel of channels) {
					const spectral = spec.domains.spectrum.channels[channel],
						betaR = spectral.rayleighScatteringPerMeter,
						betaM = spectral.mieExtinctionPerMeter;
					const tau =
						betaR * (view.rayleighMeters + source.rayleighMeters) +
						betaM * (view.mieMeters + source.mieMeters);
					const errorTau =
						betaR * (view.errorRayleighMeters + source.errorRayleighMeters) +
						betaM * (view.errorMieMeters + source.errorMieMeters);
					const value =
						spectral.sourceIrradianceDensityWattsPerSquareMeterPerNanometer *
						Math.exp(-tau) *
						(betaR * densityR * rayleighPhase +
							betaM * densityM * spec.atmosphere.mieSingleScatteringAlbedo * miePhase) *
						jacobian;
					values.push(value);
					allowances.push(value * Math.expm1(errorTau));
				}
				return [...values, ...allowances];
			},
			0,
			endCoordinate,
			Array(2 * count).fill(1e-9 * toleranceScale),
			1e-6 * toleranceScale,
			method,
			budget.maximumOuterEvaluations,
		);
		passes.push(result);
		diagnostics.push({
			toleranceScale,
			elapsedMilliseconds: Math.max(0, performance.now() - started),
			mediumEvaluations: budget.mediumEvaluations - beforeMedium,
			outerEvaluations: budget.outerEvaluations - beforeOuter,
			columnCalls: budget.columnCalls - beforeColumns,
			maximumColumnEvaluationsUsed: budget.columnEvaluationHighWater,
			converged: result.converged,
			reason: result.reason,
		});
		if (!result.converged) {
			reasons.add(result.reason);
			break;
		}
	}
	const coarse = passes[0],
		fine = passes.length === 2 ? passes[1] : null;
	return {
		method,
		passes: diagnostics,
		values: fine?.values?.slice(0, count) ?? coarse?.values?.slice(0, count) ?? null,
		coarseValues: coarse?.values?.slice(0, count) ?? null,
		refinementDifferences:
			fine?.values && coarse?.values
				? fine.values.slice(0, count).map((value, i) => Math.abs(value - coarse.values[i]))
				: null,
		outerErrors: fine?.errors?.slice(0, count) ?? null,
		innerAllowances: fine?.values?.slice(count).map((value, i) => value + fine.errors[i + count]) ?? null,
		mediumEvaluations: budget.mediumEvaluations,
		outerEvaluations: budget.outerEvaluations,
		converged: passes.length === 2 && passes.every((pass) => pass.converged) && reasons.size === 0,
		reasons: [...reasons].filter(Boolean),
	};
}

/** Evaluate only declared physical J1 component probes; never construct a cache.
 * @param {SkyTransportSpec} spec - Shared physical coefficients and planet geometry.
 * @param {readonly SkyReferenceProbe[]} probes - Caller-authenticated exact benchmark rays.
 * @param {readonly number[]} channels - Unique spectral indices in output order.
 * @param {() => void} [onProgress] - Synchronous heartbeat/cancellation callback.
 * @param {SkyPhysicalReferenceProfile} [profile='standard'] - Explicit numerical work profile.
 * @returns {SkyPhysicalReferenceReport} Independent methods with empirical allowances.
 */
export function evaluatePhysicalJ1References(spec, probes, channels, onProgress, profile = 'standard') {
	const numericalPolicy = physicalReferencePolicy(profile);
	if (!probes.length || new Set(probes.map((probe) => probe.id)).size !== probes.length)
		throw new RangeError('Physical reference probes must be nonempty and uniquely identified.');
	/** @type {SkyPhysicalReferenceRow[]} */
	const rows = [];
	/** @type {SkyPhysicalReferenceReport['probes']} */
	const details = [];
	for (const probe of probes) {
		const result = evaluatePhysicalSurfaceRay(spec, probe.ray, channels, onProgress, profile);
		details.push({probeId: probe.id, methods: [...result.methods]});
		for (const row of result.channels)
			rows.push({probeId: probe.id, time: probe.time, gridX: probe.gridX, gridY: probe.gridY, ...row});
	}
	return {
		schemaId: 'sky-independent-physical-j1-reference-v1',
		profile,
		numericalPolicy,
		units: 'W m^-2 sr^-1 nm^-1',
		rows,
		probes: details,
		resolved: rows.every((row) => row.resolved),
		limitations: physicalLimitations(profile, numericalPolicy),
	};
}

/** Resolve one caller-owned outward ground ray without assigning benchmark grid metadata.
 * The existing independent methods, tolerance passes and admission rules are unchanged.
 * @param {SkyTransportSpec} spec - Fixed supported physical model.
 * @param {SkyRayGeometry} ray - Exact outward surface-to-top geometry.
 * @param {readonly number[]} channels - Unique admitted spectral indices.
 * @param {() => void} [onProgress] - Cooperative cancellation and progress callback.
 * @param {SkyPhysicalReferenceProfile} [profile='standard'] - Explicit work ceiling policy.
 * @param {SkyPhysicalOuterStrategy} [outerStrategy='local'] - Outer-only error allocation; no change to column integration or tolerance values.
 * @returns {SkyPhysicalSurfaceResult} Both methods and independently admitted channels.
 */
export function evaluatePhysicalSurfaceRay(
	spec,
	ray,
	channels,
	onProgress,
	profile = 'standard',
	outerStrategy = 'local',
) {
	if (!['local', 'global'].includes(outerStrategy))
		throw new RangeError('Unknown physical outer integration strategy.');
	physicalReferencePolicy(profile);
	validatePhysicalSpec(spec);
	if (
		!channels.length ||
		new Set(channels).size !== channels.length ||
		channels.some((channel) => !Number.isInteger(channel) || !spec.domains.spectrum.channels[channel])
	)
		throw new RangeError('Physical reference channels must be unique admitted spectral indices.');
	/** @type {SkyPhysicalSurfaceChannel[]} */ const rows = [];
	const radius = Math.hypot(...ray.origin),
		projection =
			ray.origin[0] * ray.direction[0] + ray.origin[1] * ray.direction[1] + ray.origin[2] * ray.direction[2];
	if (
		Math.abs(radius - spec.planet.bottomRadiusMeters) > 1e-6 ||
		projection < -1e-6 ||
		Math.abs(Math.hypot(...ray.direction) - 1) > 1e-12 ||
		!(ray.length > 0) ||
		[...ray.origin, ...ray.direction, ray.length].some((value) => !Number.isFinite(value)) ||
		Math.abs(ray.length - sphereExit(ray.origin, ray.direction, spec.planet.topRadiusMeters)) > 1e-5
	)
		throw new RangeError('Physical reference admits only outward surface-to-top benchmark rays.');
	onProgress?.();
	const gauss = evaluateMethod(spec, ray, channels, 'gauss', profile, onProgress, outerStrategy),
		simpson = evaluateMethod(spec, ray, channels, 'simpson', profile, onProgress, outerStrategy);
	for (let index = 0; index < channels.length; index++) {
		const a = gauss.values?.[index] ?? null,
			b = simpson.values?.[index] ?? null;
		const admission = admitPhysicalReferenceChannel(gauss, simpson, index);
		rows.push({
			channel: channels[index],
			gaussWatts: a,
			simpsonWatts: b,
			...admission,
		});
	}
	return {methods: [gauss, simpson], channels: rows, resolved: rows.every((row) => row.resolved)};
}

/** Preserve the benchmark report's scientific limitation text in one owner.
 * @param {SkyPhysicalReferenceProfile} profile - Selected work profile.
 * @param {SkyPhysicalReferencePolicy} numericalPolicy - Its exact admitted limits.
 * @returns {string[]} Common finite-reference limits.
 */
function physicalLimitations(profile, numericalPolicy) {
	return [
		'Admission policy: t(L)=1e-9+1e-6*abs(L) W. Each locally converged method requires abs(Lfine-Lcoarse)<=4*t(Lcoarse)+t(Lfine), fine outer remainder<=t(Lfine), and finite nonnegative propagated inner allowance. Independent fine estimates require abs(Lgauss-Lsimpson)<=t(Lgauss)+t(Lsimpson). A failed gate retains the estimates and differences but has no accepted allowance.',
		'Two tolerance passes provide an explicit pass-consistency check; they do not establish a shrinking refinement sequence or asymptotic order.',
		'Both methods retain the same spherical geometry, exponential atmosphere, spectral coefficients, collimated source and analytic phase model; shared physical or observation bias is not bounded.',
		'Distance adaptive Gauss 8/16 and square-root-altitude adaptive Simpson resolve first order only; no cache reconstruction, multiple-scattering tail or measurement uncertainty is included.',
		'Outward surface rays permit at most 1e-6 metre radial/projection roundoff. Tiny negative observer-direction projection is clamped to zero in the outer coordinate map; this common geometry convention is not an independent geometry-error bound.',
		'Allowance = 2*max(method discrepancy, both tolerance-refinement differences, both outer difference estimates) + 2*max(propagated inner allowances). This is an empirical allowance, not a rigorous bound or confidence interval.',
		`The ${profile} profile permits ${numericalPolicy.maximumMediumEvaluations.gauss} Gauss and ${numericalPolicy.maximumMediumEvaluations.simpson} Simpson medium pairs per physical ray, shared across both tolerance passes. Both methods retain ${numericalPolicy.maximumOuterEvaluations} outer evaluations and ${numericalPolicy.maximumColumnEvaluations} evaluations per column. Unresolved rows have no accepted allowance. Generic fixed-field column budgets remain unchanged.`,
	];
}
