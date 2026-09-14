import {createReferenceBudget, createPhysicalMethodBudget, integrateColumns} from './columns.mjs';
import {evaluatePhysicalJ1References, mapAltitudeCoordinate} from './radiance.mjs';
import {gaussLegendreRule, integrateVector} from './quadrature.mjs';
import {admitPhysicalReferenceChannel} from './admission.mjs';
import {physicalReferencePolicy} from './policy.mjs';

/** Construct a minimal explicit physical fixture independent of runtime profiles.
 * @param {number} scaleHeight - Both exponential scale heights in metres.
 * @param {number} rayleigh - Ground Rayleigh scattering coefficient per metre.
 * @param {number} mie - Ground Mie extinction coefficient per metre.
 * @returns {SkyTransportSpec} Complete structural manufactured physical input.
 */
function fixture(scaleHeight, rayleigh, mie) {
	return {
		planet: {bottomRadiusMeters: 1000000, topRadiusMeters: 1100000},
		atmosphere: {
			rayleighScaleHeightMeters: scaleHeight,
			mieScaleHeightMeters: scaleHeight,
			mieSingleScatteringAlbedo: 0.9,
			miePhaseFunctionG: 0.7,
			ozone: {absorptionEnabled: false},
		},
		domains: {
			position: {id: 'manufactured-unused-position', count: 0, nodes: []},
			solarZenith: {id: 'manufactured-unused-solar', count: 0, nodes: []},
			incoming: {
				id: 'manufactured-unused-incoming',
				directionCount: 0,
				unitVectors: [],
				integrationWeightsSteradians: [],
			},
			outgoing: {
				id: 'manufactured-unused-outgoing',
				faceWidth: 0,
				directionCount: 0,
				unitVectors: [],
				positiveFaceCenterIndices: {positiveX: 0, positiveY: 0, positiveZ: 0},
			},
			spectrum: {
				id: 'manufactured-monochromatic',
				channels: [
					{
						centerNanometers: 550,
						sourceIrradianceDensityWattsPerSquareMeterPerNanometer: 1.5,
						rayleighScatteringPerMeter: rayleigh,
						mieExtinctionPerMeter: mie,
						groundAlbedo: 0,
					},
				],
			},
		},
		numerical: {sourcePathTransmittanceIntervalCount: 1, transportIntervalCount: 1, maximumScatteringOrder: 1},
	};
}

/** Focused self-verifying manufactured proofs; creates no files or evidence runs.
 * @returns {SkyPhysicalReferenceProof} Compact proof counts and actual deviations.
 */
export function physicalReferenceProof() {
	let checks = 0,
		maximumPolynomialError = 0,
		maximumVerticalRelativeError = 0,
		maximumSlabAbsoluteError = 0;
	const assert = (/** @type {boolean} */ condition, /** @type {string} */ message) => {
		checks++;
		if (!condition) throw new Error(`Independent physical reference proof failed: ${message}`);
	};
	const assertRejected = (/** @type {() => unknown} */ operation, /** @type {string} */ message) => {
		let rejected = false;
		try {
			operation();
		} catch (error) {
			rejected = error instanceof RangeError;
		}
		assert(rejected, message);
	};
	const standardPolicy = physicalReferencePolicy(),
		expandedPolicy = physicalReferencePolicy('simpson-expanded-medium');
	assert(
		standardPolicy.maximumMediumEvaluations.gauss === 262144 &&
			standardPolicy.maximumMediumEvaluations.simpson === 262144,
		'standard physical policy preserves both original medium-pair caps',
	);
	assert(
		expandedPolicy.maximumMediumEvaluations.gauss === 262144 &&
			expandedPolicy.maximumMediumEvaluations.simpson === 1048576,
		'named expansion changes only physical Simpson medium capacity',
	);
	assert(
		expandedPolicy.maximumOuterEvaluations === 2048 &&
			expandedPolicy.maximumColumnEvaluations === 4096 &&
			expandedPolicy.tolerancePolicy === standardPolicy.tolerancePolicy,
		'expanded profile preserves outer, individual-column and accuracy admission policies',
	);
	assert(
		createReferenceBudget().maximumMediumEvaluations === 262144 && createReferenceBudget().physicalMethod === null,
		'generic fixed-field caller keeps its original budget',
	);
	assert(
		createPhysicalMethodBudget('gauss', 'simpson-expanded-medium').maximumMediumEvaluations === 262144,
		'expanded profile cannot enlarge physical Gauss',
	);
	assertRejected(
		() => physicalReferencePolicy(/** @type {SkyPhysicalReferenceProfile} */ ('unregistered')),
		'unregistered work profiles are rejected',
	);
	for (const count of [8, 16]) {
		const rule = gaussLegendreRule(count);
		assert(
			rule.every((item) => item.weight > 0 && Math.abs(item.node) < 1),
			`Gauss ${count} positive interior nodes`,
		);
		for (let degree = 0; degree < 2 * count; degree++) {
			const expected = degree % 2 === 0 ? 2 / (degree + 1) : 0;
			const actual = rule.reduce((sum, item) => sum + item.weight * item.node ** degree, 0);
			const error = Math.abs(expected - actual);
			maximumPolynomialError = Math.max(maximumPolynomialError, error);
			assert(error < 2e-14, `Gauss ${count} polynomial degree ${degree}`);
		}
	}
	/** @type {readonly SkyPhysicalReferenceMethod[]} */
	const methods = ['gauss', 'simpson'];
	for (const method of methods) {
		for (const projection of [0, 1000000]) {
			const radius = 1000000,
				height = 100000;
			const exactDistance = Math.sqrt(projection * projection + height * (2 * radius + height)) - projection;
			const path = integrateVector(
				(coordinate) => [mapAltitudeCoordinate(radius, projection, coordinate).jacobian],
				0,
				Math.sqrt(height),
				[1e-6],
				1e-10,
				method,
				4096,
			);
			assert(path.converged, `${method} square-root-altitude geometric path resolves`);
			assert(
				Math.abs(path.values[0] - exactDistance) < 1e-8 * exactDistance,
				`${method} transformed constant integrand has exact radial/tangent length`,
			);
		}
		for (const beta of [0, 1e-8, 2e-5]) {
			const length = 100000,
				expected = beta === 0 ? length : -Math.expm1(-beta * length) / beta;
			const result = integrateVector(
				(distance) => [Math.exp(-beta * distance)],
				0,
				length,
				[1e-7],
				1e-9,
				method,
				4096,
			);
			assert(result.converged, `${method} homogeneous attenuated path resolves`);
			assert(
				Math.abs(result.values[0] - expected) < 2e-8 * expected,
				`${method} expm1 path and zero-extinction limit`,
			);
		}
		const spec = fixture(8000, 1e-5, 2e-5);
		const shaped = {...spec, atmosphere: {...spec.atmosphere, mieScaleHeightMeters: 1200}};
		const result = integrateColumns(shaped, [0, 0, 1000000], [0, 0, 1], 100000, method, createReferenceBudget());
		assert(result.converged, `${method} independent exponential columns resolve`);
		for (const [actual, scale] of [
			[result.rayleighMeters, 8000],
			[result.mieMeters, 1200],
		]) {
			const expected = -scale * Math.expm1(-100000 / scale),
				relative = Math.abs(actual - expected) / expected;
			maximumVerticalRelativeError = Math.max(maximumVerticalRelativeError, relative);
			assert(relative < 2e-8, `${method} vertical exponential exact column`);
		}
		const exhausted = createReferenceBudget();
		exhausted.maximumMediumEvaluations = 1;
		const limited = integrateColumns(shaped, [0, 0, 1000000], [0, 0, 1], 100000, method, exhausted);
		assert(
			!limited.converged && limited.rayleighMeters === null && limited.evaluations === 1,
			`${method} cap cannot masquerade as zero success`,
		);
		const immediate = integrateVector(() => [1], 0, 1, [1e-9], 1e-6, method, 0);
		assert(!immediate.converged && immediate.values === null, `${method} no estimate on immediate exhaustion`);
	}
	/** @type {SkyReferenceProbe[]} */
	const probes = [
		{
			id: 'manufactured-vertical-slab',
			time: '00:00',
			gridX: 0,
			gridY: 0,
			ray: {origin: [0, 0, 1000000], direction: [0, 0, 1], length: 100000},
		},
	];
	const constant = fixture(1e30, 1e-5, 0),
		homogeneous = evaluatePhysicalJ1References(constant, probes, [0]);
	const exact = ((1.5 * 3) / (8 * Math.PI)) * 1e-5 * 100000 * Math.exp(-1);
	assert(homogeneous.resolved, 'both physical slab formulations resolve');
	const expandedHomogeneous = evaluatePhysicalJ1References(
		constant,
		probes,
		[0],
		undefined,
		'simpson-expanded-medium',
	);
	assert(
		expandedHomogeneous.profile === 'simpson-expanded-medium' &&
			expandedHomogeneous.numericalPolicy.maximumMediumEvaluations.simpson === 1048576,
		'physical report retains the explicitly selected work policy',
	);
	assert(
		expandedHomogeneous.resolved &&
			expandedHomogeneous.rows[0].gaussWatts === homogeneous.rows[0].gaussWatts &&
			expandedHomogeneous.rows[0].simpsonWatts === homogeneous.rows[0].simpsonWatts,
		'work expansion leaves already resolved manufactured radiance identical',
	);
	for (const method of homogeneous.probes[0].methods) {
		assert(
			method.passes.length === 2 &&
				method.passes[0].toleranceScale === 4 &&
				method.passes[1].toleranceScale === 1,
			`${method.method} retains both separately identified tolerance passes`,
		);
		assert(
			method.passes.reduce((sum, pass) => sum + pass.mediumEvaluations, 0) === method.mediumEvaluations &&
				method.passes.reduce((sum, pass) => sum + pass.outerEvaluations, 0) === method.outerEvaluations,
			`${method.method} pass counts sum to actual method work`,
		);
		assert(
			method.passes.every(
				(pass) =>
					pass.elapsedMilliseconds >= 0 &&
					pass.columnCalls > 0 &&
					pass.maximumColumnEvaluationsUsed > 0 &&
					pass.maximumColumnEvaluationsUsed <= 4096,
			),
			`${method.method} retains bounded measured column work and elapsed time`,
		);
	}
	const beyondOriginal = createPhysicalMethodBudget('simpson', 'simpson-expanded-medium');
	beyondOriginal.mediumEvaluations = 262144;
	const allowedExpanded = integrateColumns(constant, [0, 0, 1000000], [0, 0, 1], 100000, 'simpson', beyondOriginal);
	assert(
		allowedExpanded.converged && beyondOriginal.mediumEvaluations > 262144,
		'explicit physical Simpson profile admits work beyond the original medium cap',
	);
	const unauthorized = createReferenceBudget();
	unauthorized.maximumMediumEvaluations = 1048576;
	assertRejected(
		() => integrateColumns(constant, [0, 0, 1000000], [0, 0, 1], 100000, 'simpson', unauthorized),
		'larger generic budget without named physical profile is rejected',
	);
	assertRejected(
		() => integrateColumns(constant, [0, 0, 1000000], [0, 0, 1], 100000, 'gauss', beyondOriginal),
		'physical Simpson budget cannot be reused under another method',
	);
	const withoutMethod = {...beyondOriginal, physicalMethod: null};
	assertRejected(
		() => integrateColumns(constant, [0, 0, 1000000], [0, 0, 1], 100000, 'simpson', withoutMethod),
		'expanded profile requires an explicit physical method',
	);
	for (const invalid of [
		{...beyondOriginal, maximumMediumEvaluations: 1048577},
		{...beyondOriginal, maximumOuterEvaluations: 2049},
		{...beyondOriginal, maximumColumnEvaluations: 4097},
	])
		assertRejected(
			() => integrateColumns(constant, [0, 0, 1000000], [0, 0, 1], 100000, 'simpson', invalid),
			'expanded profile still rejects limits above its declared ceilings',
		);
	for (const actual of [homogeneous.rows[0].gaussWatts, homogeneous.rows[0].simpsonWatts]) {
		const error = Math.abs(actual - exact);
		maximumSlabAbsoluteError = Math.max(maximumSlabAbsoluteError, error);
		assert(error < 1e-8, 'homogeneous collimated single-scattering slab exact solution');
	}
	const vacuum = evaluatePhysicalJ1References(fixture(1e30, 0, 0), probes, [0]);
	assert(
		vacuum.resolved && vacuum.rows[0].gaussWatts === 0 && vacuum.rows[0].simpsonWatts === 0,
		'zero extinction/scattering has exact zero radiance',
	);
	for (const method of methods)
		for (const signal of [new Error('manufactured-deadline'), new RangeError('manufactured-resource-limit')]) {
			let cancelled = false;
			try {
				const budget = createReferenceBudget(() => {
					throw signal;
				});
				budget.mediumEvaluations = 1023;
				integrateColumns(constant, [0, 0, 1000000], [0, 0, 1], 100000, method, budget);
			} catch (error) {
				cancelled = error === signal;
			}
			assert(
				cancelled,
				`${method} preserves deadline/resource signal identity instead of returning numerical nonresolution`,
			);
		}
	/** @type {SkyPhysicalMethodResult} */
	const stableGauss = {
		method: 'gauss',
		passes: [],
		values: [1],
		coarseValues: [1],
		refinementDifferences: [0],
		outerErrors: [0],
		innerAllowances: [0],
		mediumEvaluations: 1,
		outerEvaluations: 1,
		converged: true,
		reasons: [],
	};
	/** @type {SkyPhysicalMethodResult} */
	const stableSimpson = {...stableGauss, method: 'simpson'};
	const consistent = admitPhysicalReferenceChannel(stableGauss, stableSimpson, 0);
	assert(
		consistent.resolved && consistent.empiricalAllowanceWatts === 0 && consistent.reasons.length === 0,
		'consistent complete reference evidence passes admission',
	);
	const disagreement = admitPhysicalReferenceChannel(
		stableGauss,
		{...stableSimpson, values: [1.001], coarseValues: [1.001]},
		0,
	);
	assert(
		!disagreement.resolved &&
			disagreement.empiricalAllowanceWatts === null &&
			disagreement.methodDifferenceWatts > 0.0009,
		'stable methods with incompatible values cannot qualify a reference',
	);
	assert(
		disagreement.reasons.some((reason) => reason.includes('Independent physical methods disagree')),
		'method disagreement has an explicit admission reason',
	);
	const passMismatch = admitPhysicalReferenceChannel(
		{...stableGauss, coarseValues: [1.001], refinementDifferences: [0.001]},
		stableSimpson,
		0,
	);
	assert(
		!passMismatch.resolved &&
			passMismatch.empiricalAllowanceWatts === null &&
			passMismatch.methodDifferenceWatts === 0,
		'matching fine methods do not hide inconsistent coarse/fine passes',
	);
	assert(
		passMismatch.reasons.some((reason) => reason.includes('coarse/fine difference')),
		'pass mismatch has an explicit admission reason',
	);
	const largeRemainder = admitPhysicalReferenceChannel({...stableGauss, outerErrors: [0.001]}, stableSimpson, 0);
	assert(
		!largeRemainder.resolved && largeRemainder.empiricalAllowanceWatts === null,
		'locally reported convergence cannot bypass the final outer-remainder gate',
	);
	return {
		schemaId: 'sky-independent-physical-reference-proof-v1',
		checks,
		maximumPolynomialError,
		maximumVerticalRelativeError,
		maximumSlabAbsoluteError,
	};
}
