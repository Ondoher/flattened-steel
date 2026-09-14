import {gaussLegendre} from '../../numerics/profile.js';
import {createPointStencilBuilder, sampleDensity, viewPathIntervals} from '../../numerics/view.js';
import {createReferenceBudget, integrateColumns} from './physical/index.mjs';

/** Canonical component-reference methods, in retained result order. @type {readonly SkyFixedReferenceRule[]} */
const RULES = ['gauss4', 'gauss8', 'gauss8-split', 'simpson8', 'simpson16', 'simpson32'];
/** Component scope remains separate from the registered 31-channel scorer. */
const CHANNELS = [0, 8, 24, 30];
/** Only the five preregistered component times are admitted. */
const TIMES = ['09:30', '10:15', '11:15', '12:30', '13:30'];

/** Finite quadrature abscissae and positive weights; no adaptive query can escape this union.
 * @param {readonly SkyPathInterval[]} intervals @param {SkyFixedReferenceRule} rule
 * @returns {readonly SkyReferenceWeightedDistance[]}
 */
function ruleDistances(intervals, rule) {
	/** @type {SkyReferenceWeightedDistance[]} */ const result = [];
	for (const interval of intervals) {
		const span = interval.end - interval.start;
		if (rule.startsWith('gauss')) {
			const count = rule === 'gauss4' ? 4 : 8,
				parts = rule === 'gauss8-split' ? 2 : 1;
			for (let part = 0; part < parts; part++) {
				const lower = interval.start + (span * part) / parts,
					upper = part === parts - 1 ? interval.end : interval.start + (span * (part + 1)) / parts,
					midpoint = (lower + upper) / 2,
					half = (upper - lower) / 2;
				for (const {node, weight} of gaussLegendre(count))
					result.push({distance: midpoint + half * node, weight: half * weight});
			}
		} else {
			const count = rule === 'simpson8' ? 8 : rule === 'simpson16' ? 16 : 32;
			for (let index = 0; index <= count; index++)
				result.push({
					distance:
						index === 0
							? interval.start
							: index === count
								? interval.end
								: interval.start + span * (index / count),
					weight: (span / count / 3) * (index === 0 || index === count ? 1 : index % 2 ? 4 : 2),
				});
		}
	}
	return result;
}

/** Accumulate independently integrated geometric columns across the sorted query union.
 * Prefix construction never uses cached scattering values or the midpoint two-half-step rule.
 * @param {SkyTransportSpec} spec @param {SkyRayGeometry} ray @param {readonly number[]} distances
 * @param {SkyPhysicalReferenceMethod} method @param {() => void} progress
 * @returns {SkyReferencePrefixesResult}
 */
function columnPrefixes(spec, ray, distances, method, progress) {
	const budget = createReferenceBudget(progress);
	/** @type {SkyReferenceColumnPrefix[]} */ const prefixes = [];
	let previous = 0,
		rayleighMeters = 0,
		mieMeters = 0,
		errorRayleighMeters = 0,
		errorMieMeters = 0,
		converged = true,
		evaluations = 0;
	for (const distance of distances) {
		if (distance > previous) {
			/** @type {SkyVector3} */
			const origin = [
				ray.origin[0] + ray.direction[0] * previous,
				ray.origin[1] + ray.direction[1] * previous,
				ray.origin[2] + ray.direction[2] * previous,
			];
			const column = integrateColumns(spec, origin, ray.direction, distance - previous, method, budget);
			evaluations += column.evaluations;
			if (
				column.rayleighMeters === null ||
				column.mieMeters === null ||
				column.errorRayleighMeters === null ||
				column.errorMieMeters === null
			)
				throw new RangeError(`Fixed-field ${method} attenuation exhausted its bounded query budget.`);
			rayleighMeters += column.rayleighMeters;
			mieMeters += column.mieMeters;
			errorRayleighMeters += column.errorRayleighMeters;
			errorMieMeters += column.errorMieMeters;
			converged &&= column.converged;
		}
		prefixes.push({distance, rayleighMeters, mieMeters, errorRayleighMeters, errorMieMeters, converged});
		previous = distance;
	}
	return {prefixes, evaluations};
}

/** Prepare component-only Gauss/Simpson query supports before recurrence fields exist.
 * At most 40 rays and P63 are admitted. Six rules use at most 87P logical
 * queries and 61P unique positions per ray; endpoints are shared when exact.
 * This reference-only support is distinct from a runtime adaptive midpoint union.
 * @param {SkyBuildRequest} buildRequest @param {readonly SkyReferenceProbe[]} probes
 * @param {() => void} [onProgress] @param {SkySolarInterpolation} [solarInterpolation]
 * @returns {SkyFixedFieldReferencePlan}
 */
export function prepareFixedFieldReference(
	buildRequest,
	probes,
	onProgress = () => {},
	solarInterpolation = 'monotone-cubic',
) {
	const spec = buildRequest.transportSpec;
	if (
		!Array.isArray(probes) ||
		probes.length < 1 ||
		probes.length > 40 ||
		new Set(probes.map((probe) => probe.id)).size !== probes.length ||
		new Set(probes.map((probe) => `${probe.time}:${probe.gridX}:${probe.gridY}`)).size !== probes.length ||
		spec.domains.position.count > 63 ||
		!['monotone-cubic', 'linear'].includes(solarInterpolation) ||
		typeof onProgress !== 'function'
	)
		throw new RangeError('Fixed-field references require at most forty unique registered P63 component probes.');
	const builder = createPointStencilBuilder(buildRequest);
	/** @type {SkyFixedReferenceRay[]} */ const rays = [];
	let ruleNodeCount = 0,
		uniqueQueryCount = 0;
	for (const probe of probes) {
		if (
			!probe.id ||
			!TIMES.includes(probe.time) ||
			![probe.gridX, probe.gridY].every((value) => Number.isInteger(value) && value >= 0 && value < 9)
		)
			throw new RangeError('Component probe coordinates are outside the frozen reference domain.');
		onProgress();
		const intervals = viewPathIntervals(spec, probe.ray, 'altitude-segmented', 1);
		const positions = new Map(RULES.map((rule) => [rule, ruleDistances(intervals, rule)]));
		const distances = [
			...new Set([
				0,
				probe.ray.length,
				...[...positions.values()].flatMap((nodes) => nodes.map((node) => node.distance)),
			]),
		].sort((a, b) => a - b);
		if (distances.length > 61 * intervals.length + 2)
			throw new RangeError('Reference abscissae exceeded their declared finite union.');
		const prefixIndexes = new Map(distances.map((distance, index) => [distance, index]));
		/** @type {Partial<Record<SkyFixedReferenceRule, readonly SkyFixedReferenceNode[]>>} */ const rules = {};
		for (const rule of RULES)
			rules[rule] = positions.get(rule).map(({distance, weight}) => {
				/** @type {SkyVector3} */
				const point = [
					probe.ray.origin[0] + probe.ray.direction[0] * distance,
					probe.ray.origin[1] + probe.ray.direction[1] * distance,
					probe.ray.origin[2] + probe.ray.direction[2] * distance,
				];
				return {
					distance,
					prefixIndex: prefixIndexes.get(distance),
					sample: builder.sample(point, probe.ray.direction, weight),
				};
			});
		const gauss = columnPrefixes(spec, probe.ray, distances, 'gauss', onProgress),
			simpson = columnPrefixes(spec, probe.ray, distances, 'simpson', onProgress);
		rays.push({
			probe,
			altitudeSegments: intervals.length,
			rules: /** @type {Record<SkyFixedReferenceRule, readonly SkyFixedReferenceNode[]>} */ (rules),
			distances,
			columns: {gauss: gauss.prefixes, simpson: simpson.prefixes},
			columnEvaluations: {gauss: gauss.evaluations, simpson: simpson.evaluations},
		});
		ruleNodeCount += [...positions.values()].reduce((sum, nodes) => sum + nodes.length, 0);
		uniqueQueryCount += distances.length;
	}
	return {
		schemaId: 'sky-fixed-field-reference-plan-v1',
		buildRequestId: buildRequest.id,
		solarInterpolation,
		coordinates: builder.coordinates,
		rays,
		ruleNodeCount,
		uniqueQueryCount,
		channels: [...CHANNELS],
	};
}

/** Independently weighted attenuation and frozen density; no recursive midpoint transmittance.
 * @param {SkyTransportSpec} spec @param {number} channel @param {SkyFixedReferenceRay} ray
 * @param {SkyFixedReferenceRule} rule @param {(sample:SkyViewSample)=>number} density
 * @returns {SkyFixedRuleValue}
 */
function integrateRule(spec, channel, ray, rule, density) {
	const method = rule.startsWith('gauss') ? 'gauss' : 'simpson',
		spectral = spec.domains.spectrum.channels[channel];
	let radianceW = 0,
		attenuationAllowanceW = 0,
		columnsConverged = true;
	for (const node of ray.rules[rule]) {
		const column = ray.columns[method][node.prefixIndex],
			tau =
				spectral.rayleighScatteringPerMeter * column.rayleighMeters +
				spectral.mieExtinctionPerMeter * column.mieMeters,
			tauError =
				spectral.rayleighScatteringPerMeter * column.errorRayleighMeters +
				spectral.mieExtinctionPerMeter * column.errorMieMeters,
			q = density(node.sample),
			contribution = node.sample.step * Math.exp(-tau) * q;
		if (!Number.isFinite(q) || q < 0 || !Number.isFinite(contribution))
			throw new RangeError('Fixed-field references require finite nonnegative reconstructed density.');
		radianceW += contribution;
		attenuationAllowanceW += contribution * Math.expm1(tauError);
		columnsConverged &&= column.converged;
	}
	if (!Number.isFinite(radianceW) || !Number.isFinite(attenuationAllowanceW))
		throw new RangeError('Fixed-field reference accumulation overflow.');
	return {radianceW, attenuationAllowanceW, evaluations: ray.rules[rule].length, columnsConverged};
}

/** Compare all reference rules and retain failures without assuming a Richardson remainder.
 * @param {SkyReferenceProbe} probe @param {number} order @param {SkyFixedReferenceRepresentation} representation
 * @param {Readonly<Record<SkyFixedReferenceRule,SkyFixedRuleValue>>} methods @returns {SkyFixedReferenceRow}
 */
function compareMethods(probe, order, representation, methods) {
	const a = methods['gauss8-split'].radianceW,
		b = methods.simpson32.radianceW,
		gaussCorrectionsW = [
			Math.abs(methods.gauss8.radianceW - methods.gauss4.radianceW),
			Math.abs(a - methods.gauss8.radianceW),
		],
		simpsonCorrectionsW = [
			Math.abs(methods.simpson16.radianceW - methods.simpson8.radianceW),
			Math.abs(b - methods.simpson16.radianceW),
		],
		methodDifferenceW = Math.abs(a - b),
		tolerance = 1e-9 + 1e-6 * Math.max(Math.abs(a), Math.abs(b));
	const limitations = [];
	if (gaussCorrectionsW[1] > Math.max(tolerance, gaussCorrectionsW[0]))
		limitations.push('Gauss correction did not shrink.');
	if (simpsonCorrectionsW[1] > Math.max(tolerance, simpsonCorrectionsW[0]))
		limitations.push('Simpson correction did not shrink.');
	if (methodDifferenceW > 2 * tolerance)
		limitations.push('Independent integration rules disagree above the component tolerance.');
	if (Object.values(methods).some((value) => !value.columnsConverged))
		limitations.push('At least one optical-depth prefix is unresolved.');
	const allowance =
		2 * Math.max(gaussCorrectionsW[1], simpsonCorrectionsW[1], methodDifferenceW) +
		Math.max(methods['gauss8-split'].attenuationAllowanceW, methods.simpson32.attenuationAllowanceW);
	return {
		probeId: probe.id,
		time: probe.time,
		gridX: probe.gridX,
		gridY: probe.gridY,
		order,
		representation,
		methods,
		referenceW: a,
		allowanceW: limitations.length ? null : allowance,
		methodDifferenceW,
		gaussCorrectionsW,
		simpsonCorrectionsW,
		resolved: limitations.length === 0,
		limitations,
	};
}

/** Evaluate held Float32 fields using the independent reference plan's exact local tap ordering.
 * Cumulative and grouped reconstruction remain separate. A named first-order
 * replacement affects only the explicitly labeled grouped representation.
 * @param {SkyBuildRequest} buildRequest @param {SkyFixedFieldReferencePlan} plan @param {number} channel
 * @param {readonly Float32Array[]} pureOrders @param {() => void} [onProgress]
 * @param {SkyFixedReferenceFirstOrder} [groupedFirstOrder] @returns {SkyFixedFieldReferenceResult}
 */
export function evaluateFixedFieldReference(
	buildRequest,
	plan,
	channel,
	pureOrders,
	onProgress = () => {},
	groupedFirstOrder,
) {
	if (
		plan.schemaId !== 'sky-fixed-field-reference-plan-v1' ||
		plan.buildRequestId !== buildRequest.id ||
		!plan.channels.includes(channel) ||
		pureOrders.length !== 4 ||
		pureOrders.some((field) => !(field instanceof Float32Array) || field.length !== plan.coordinates.length) ||
		typeof onProgress !== 'function' ||
		(groupedFirstOrder && (groupedFirstOrder.id !== 'factored' || typeof groupedFirstOrder.density !== 'function'))
	)
		throw new RangeError('Fixed-field reference inputs do not match their declared local support.');
	for (const field of pureOrders)
		for (const value of field)
			if (!Number.isFinite(value) || value < 0)
				throw new RangeError('Reference fields must be finite and nonnegative.');
	const cumulative = new Float32Array(plan.coordinates.length),
		higher = new Float32Array(plan.coordinates.length);
	/** @type {SkyFixedReferenceRow[]} */ const rows = [];
	for (let order = 0; order < 4; order++) {
		for (let index = 0; index < cumulative.length; index++) {
			cumulative[index] = order === 0 ? pureOrders[0][index] : cumulative[index] + pureOrders[order][index];
			higher[index] = order === 0 ? 0 : higher[index] + pureOrders[order][index];
		}
		for (const ray of plan.rays) {
			onProgress();
			/** @type {readonly SkyFixedReferenceRepresentation[]} */
			const representations = ['cumulative', groupedFirstOrder ? 'grouped-factored-n1' : 'grouped'];
			for (const representation of representations) {
				/** @param {SkyViewSample} sample @returns {number} */
				const density = (sample) =>
					representation === 'cumulative'
						? sampleDensity(cumulative, sample, plan.solarInterpolation)
						: (groupedFirstOrder
								? groupedFirstOrder.density(sample)
								: sampleDensity(pureOrders[0], sample, plan.solarInterpolation)) +
							sampleDensity(higher, sample, plan.solarInterpolation);
				/** @type {Partial<Record<SkyFixedReferenceRule, SkyFixedRuleValue>>} */ const methods = {};
				for (const rule of RULES)
					methods[rule] = integrateRule(buildRequest.transportSpec, channel, ray, rule, density);
				rows.push(
					compareMethods(
						ray.probe,
						order + 1,
						representation,
						/** @type {Record<SkyFixedReferenceRule,SkyFixedRuleValue>} */ (methods),
					),
				);
			}
		}
	}
	return {
		schemaId: 'sky-fixed-field-reference-result-v1',
		buildRequestId: buildRequest.id,
		channel,
		units: 'W m^-2 sr^-1 nm^-1',
		scope: 'Component probes only. Float32 fields and production reconstruction are held fixed; only final-view quadrature and optical-depth integration are independently resolved. No cache, recurrence, scattering-tail or physical-model accuracy is established.',
		allowancePolicy:
			'U=2*max(last Gauss change,last Simpson change,finest-method discrepancy)+maximum propagated attenuation allowance. No Richardson division. Reference admission additionally requires shrinking corrections or changes below 1e-9+1e-6*abs(L), method agreement within twice that tolerance, and resolved optical-depth prefixes. U is empirical, not a rigorous bound or confidence interval.',
		rows,
		ruleNodeCount: plan.ruleNodeCount,
		uniqueQueryCount: plan.uniqueQueryCount,
		coordinateCount: plan.coordinates.length,
	};
}

/** Integrate an explicitly identified species reconstruction without inventing a combined scalar field.
 * The caller's evaluator uses this plan's local tap indices and retains all
 * species/grouping arithmetic. Quadrature, attenuation and admission match the
 * original fixed-field reference; this does not qualify the recurrence itself.
 * @param {SkyBuildRequest} buildRequest - Physical input matching the sparse plan.
 * @param {SkyFixedFieldReferencePlan} plan - Independent quadrature support.
 * @param {number} channel - Admitted diagnostic wavelength.
 * @param {SkyFixedReferenceRepresentation} representation - Explicit species/grouping identity.
 * @param {SkyFixedDensityEvaluator} density - Nonnegative grouped density, in W m^-3 sr^-1 nm^-1.
 * @param {() => void} [onProgress] - Cooperative progress and cancellation.
 * @returns {SkyFixedFieldReferenceResult} Finite-field quadrature envelope.
 */
export function evaluateFixedDensityReference(
	buildRequest,
	plan,
	channel,
	representation,
	density,
	onProgress = () => {},
) {
	if (
		plan.schemaId !== 'sky-fixed-field-reference-plan-v1' ||
		plan.buildRequestId !== buildRequest.id ||
		!plan.channels.includes(channel) ||
		typeof density !== 'function' ||
		typeof onProgress !== 'function' ||
		![
			'grouped',
			'grouped-factored-n1',
			'grouped-split-higher',
			'grouped-factored-higher',
			'grouped-factored-all',
		].includes(representation)
	)
		throw new RangeError('Named fixed-density reference does not match its declared support.');
	/** @type {SkyFixedReferenceRow[]} */ const rows = [];
	for (let order = 1; order <= 4; order++)
		for (const ray of plan.rays) {
			onProgress();
			/** @type {Partial<Record<SkyFixedReferenceRule, SkyFixedRuleValue>>} */ const methods = {};
			for (const rule of RULES)
				methods[rule] = integrateRule(buildRequest.transportSpec, channel, ray, rule, (sample) => {
					const value = density(sample, order);
					if (!Number.isFinite(value) || value < 0)
						throw new RangeError('Named density must be finite and nonnegative.');
					return value;
				});
			rows.push(
				compareMethods(
					ray.probe,
					order,
					representation,
					/** @type {Record<SkyFixedReferenceRule, SkyFixedRuleValue>} */ (methods),
				),
			);
		}
	return {
		schemaId: 'sky-fixed-field-reference-result-v1',
		buildRequestId: buildRequest.id,
		channel,
		units: 'W m^-2 sr^-1 nm^-1',
		scope: 'Fixed species fields and the explicitly named reconstruction are held constant. Only final-view quadrature and optical-depth integration are independently resolved; this is not a recurrence, scattering-tail or physical-model reference.',
		allowancePolicy:
			'U=2*max(last Gauss change,last Simpson change,finest-method discrepancy)+maximum propagated attenuation allowance. No Richardson division. The unchanged shrinking-correction, independent-method and attenuation-resolution gates apply. U is empirical, not rigorous.',
		rows,
		ruleNodeCount: plan.ruleNodeCount,
		uniqueQueryCount: plan.uniqueQueryCount,
		coordinateCount: plan.coordinates.length,
	};
}

/** Exact manufactured rule checks; caller owns immutable recording and full physical proofs.
 * @returns {SkyFixedReferenceProofResult}
 */
export function fixedFieldReferenceProof() {
	let checks = 0,
		maximumAbsolutePolynomialError = 0;
	const intervals = [
		{start: 0, end: 0.37},
		{start: 0.37, end: 1},
	];
	for (const rule of RULES) {
		const nodes = ruleDistances(intervals, rule),
			degree = rule.startsWith('gauss') ? (rule === 'gauss4' ? 7 : 15) : 3;
		if (nodes.some((node) => !(node.weight > 0) || node.distance < 0 || node.distance > 1))
			throw new Error('Reference nodes violate positivity or interval containment.');
		checks++;
		for (let power = 0; power <= degree; power++) {
			const actual = nodes.reduce((sum, node) => sum + node.weight * node.distance ** power, 0),
				expected = 1 / (power + 1),
				error = Math.abs(actual - expected);
			maximumAbsolutePolynomialError = Math.max(maximumAbsolutePolynomialError, error);
			if (error > 2e-13) throw new Error(`Independent ${rule} polynomial moment failed.`);
			checks++;
		}
		const kink = nodes.reduce((sum, node) => sum + node.weight * Math.abs(node.distance - 0.37), 0),
			exact = (0.37 ** 2 + 0.63 ** 2) / 2;
		if (Math.abs(kink - exact) > 2e-13) throw new Error('Known reconstruction-knot integral failed.');
		checks++;
	}
	const unique = new Set(RULES.flatMap((rule) => ruleDistances(intervals, rule).map((node) => node.distance)));
	if (unique.size > 61 * intervals.length + 2) throw new Error('Reference query union exceeds its declared bound.');
	checks++;
	/** @type {SkyReferenceProbe} */
	const probe = {
		id: 'manufactured',
		time: '12:30',
		gridX: 4,
		gridY: 4,
		ray: {origin: [0, 0, 1], direction: [0, 0, 1], length: 1},
	};
	/** @param {number} radianceW @param {boolean} [columnsConverged] @returns {SkyFixedRuleValue} */
	const value = (radianceW, columnsConverged = true) => ({
		radianceW,
		attenuationAllowanceW: 0,
		evaluations: 1,
		columnsConverged,
	});
	/** @type {Record<SkyFixedReferenceRule, SkyFixedRuleValue>} */
	const exactMethods = {
		gauss4: value(1),
		gauss8: value(1),
		'gauss8-split': value(1),
		simpson8: value(1),
		simpson16: value(1),
		simpson32: value(1),
	};
	const admitted = compareMethods(probe, 1, 'cumulative', exactMethods);
	if (!admitted.resolved || admitted.allowanceW !== 0) throw new Error('Exact agreeing methods were not admitted.');
	checks++;
	const columnFailure = compareMethods(probe, 1, 'cumulative', {...exactMethods, gauss4: value(1, false)});
	if (columnFailure.resolved || columnFailure.allowanceW !== null)
		throw new Error('Unresolved optical-depth estimate was accepted.');
	checks++;
	const disagreement = compareMethods(probe, 1, 'cumulative', {
		...exactMethods,
		simpson8: value(1.1),
		simpson16: value(1.1),
		simpson32: value(1.1),
	});
	if (disagreement.resolved || disagreement.allowanceW !== null)
		throw new Error('Stable disagreeing methods were accepted.');
	checks++;
	const growing = compareMethods(probe, 1, 'cumulative', {...exactMethods, gauss4: value(1.03), gauss8: value(1.02)});
	if (growing.resolved || growing.allowanceW !== null)
		throw new Error('Growing quadrature corrections were accepted.');
	checks++;
	return {
		schemaId: 'sky-fixed-field-reference-proof-v1',
		checks,
		maximumAbsolutePolynomialError,
		scope: 'Exact manufactured quadrature checks only; no atmospheric run or convergence claim.',
	};
}
