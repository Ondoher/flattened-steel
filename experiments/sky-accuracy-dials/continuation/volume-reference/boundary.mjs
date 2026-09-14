import {createPhysicalMethodBudget, integrateColumns, validatePhysicalSpec} from '../reference/physical/columns.mjs';
import {admitPhysicalReferenceChannel} from '../reference/physical/admission.mjs';
import {volumeAttenuation} from './method.mjs';
import {volumeSphereExit} from './geometry.mjs';

/** Evaluate the fixed-ground, zero-view-distance direct Lambertian limit.
 * This boundary quantity is compared with positive-height inward rays; it is
 * never substituted for the recurrence's exact-ground inward-zero convention.
 * @param {SkyTransportSpec} spec - Matched physical medium and explicit spectral albedo.
 * @param {SkyVector3} origin - Surface position in metres.
 * @param {readonly number[]} channels - Unique spectral indices.
 * @param {SkyVolumeOptions} [options={}] - Existing profile and cooperative guards.
 * @returns {SkyVolumeGroundLimit} Two independent source-column methods and empirical allowances.
 */
export function evaluateDirectGroundLimit(spec, origin, channels, options = {}) {
	validatePhysicalSpec(spec);
	if (
		origin.length !== 3 ||
		origin.some((value) => !Number.isFinite(value)) ||
		Math.abs(Math.hypot(...origin) - spec.planet.bottomRadiusMeters) > 1e-6 ||
		!channels.length ||
		new Set(channels).size !== channels.length ||
		channels.some((channel) => !Number.isInteger(channel) || !spec.domains.spectrum.channels[channel])
	)
		throw new RangeError('Direct-ground limit requires a finite surface origin and unique supported channels.');
	for (const channel of channels) {
		const albedo = spec.domains.spectrum.channels[channel].groundAlbedo;
		if (!Number.isFinite(albedo) || albedo < 0 || albedo > 1)
			throw new RangeError('Direct-ground limit requires explicit albedo in [0,1].');
	}
	const solarCosine = Math.max(0, origin[2] / Math.hypot(...origin));
	/** @type {SkyPhysicalMethodResult[]} */ const methods = [];
	/** @type {readonly SkyPhysicalReferenceMethod[]} */ const methodNames = ['gauss', 'simpson'];
	for (const method of methodNames) {
		const budget = createPhysicalMethodBudget(method, options.profile ?? 'standard', options.guard);
		if (options.maximumMediumEvaluations !== undefined) {
			if (
				!Number.isInteger(options.maximumMediumEvaluations) ||
				options.maximumMediumEvaluations < 0 ||
				options.maximumMediumEvaluations > budget.maximumMediumEvaluations
			)
				throw new RangeError('Ground-limit medium cap must lower the named policy.');
			budget.maximumMediumEvaluations = options.maximumMediumEvaluations;
		}
		/** @type {number[][]} */ const values = [],
			allowances = [];
		/** @type {SkyPhysicalPassDiagnostics[]} */ const passes = [];
		for (const toleranceScale of [4, 1]) {
			options.guard?.();
			const started = performance.now(),
				before = budget.mediumEvaluations,
				beforeColumns = budget.columnCalls;
			budget.toleranceScale = toleranceScale;
			budget.columnEvaluationHighWater = 0;
			const column =
				solarCosine === 0
					? null
					: integrateColumns(
							spec,
							origin,
							[0, 0, 1],
							volumeSphereExit(origin, [0, 0, 1], spec.planet.topRadiusMeters),
							method,
							budget,
						);
			const converged = column === null || column.converged;
			passes.push({
				toleranceScale,
				elapsedMilliseconds: Math.max(0, performance.now() - started),
				mediumEvaluations: budget.mediumEvaluations - before,
				outerEvaluations: 0,
				columnCalls: budget.columnCalls - beforeColumns,
				maximumColumnEvaluationsUsed: budget.columnEvaluationHighWater,
				converged,
				reason: column?.reason ?? null,
			});
			if (!converged) break;
			const transmitted = channels.map((channel) => {
				const spectral = spec.domains.spectrum.channels[channel];
				const transmission = column
					? volumeAttenuation(
							spectral.rayleighScatteringPerMeter * column.rayleighMeters +
								spectral.mieExtinctionPerMeter * column.mieMeters,
							spectral.rayleighScatteringPerMeter * column.errorRayleighMeters +
								spectral.mieExtinctionPerMeter * column.errorMieMeters,
						)
					: {value: 1, allowance: 0};
				const coefficient =
					(spectral.groundAlbedo *
						spectral.sourceIrradianceDensityWattsPerSquareMeterPerNanometer *
						solarCosine) /
					Math.PI;
				return {value: coefficient * transmission.value, allowance: coefficient * transmission.allowance};
			});
			values.push(transmitted.map((value) => value.value));
			allowances.push(transmitted.map((value) => value.allowance));
		}
		methods.push({
			method,
			values: values[1] ?? values[0] ?? null,
			coarseValues: values[0] ?? null,
			refinementDifferences:
				values.length === 2 ? values[1].map((value, i) => Math.abs(value - values[0][i])) : null,
			outerErrors: values.length === 2 ? Array(channels.length).fill(0) : null,
			innerAllowances: allowances[1] ?? null,
			mediumEvaluations: budget.mediumEvaluations,
			outerEvaluations: 0,
			converged: passes.length === 2 && passes.every((pass) => pass.converged),
			reasons: passes.filter((pass) => !pass.converged).map((pass) => pass.reason),
			passes,
		});
	}
	const rows = channels.map((channel, i) => ({
		channel,
		directGround: {
			gaussWatts: methods[0].values?.[i] ?? null,
			simpsonWatts: methods[1].values?.[i] ?? null,
			...admitPhysicalReferenceChannel(methods[0], methods[1], i),
		},
	}));
	return {
		units: 'W m^-2 sr^-1 nm^-1',
		origin: [...origin],
		solarCosine,
		methods,
		channels: rows,
		resolved: rows.every((row) => row.directGround.resolved),
	};
}
