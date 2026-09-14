import {evaluateVolumeFirstOrder, evaluateVolumePilot} from './index.mjs';
import {resolveVolumeGeometry, volumeAltitudeMap, volumePoint, volumeSourceVisible} from './geometry.mjs';
import {volumeAttenuation} from './method.mjs';
import {evaluateDirectGroundLimit} from './boundary.mjs';
import {assessVolumeWitnesses} from './witnesses.mjs';
import {integrateVector} from '../reference/physical/quadrature.mjs';
import {evaluatePhysicalSurfaceRay, evaluatePhysicalJ1References} from '../reference/physical/radiance.mjs';

/** Explicit monochromatic, almost homogeneous manufactured physical model.
 * @param {number} beta - Constant-limit Rayleigh coefficient per metre.
 * @param {number} albedo - Lambertian ground reflectance.
 * @returns {SkyTransportSpec} Structurally complete physical fixture; no runtime/cache input.
 */
function fixture(beta, albedo) {
	return {
		planet: {bottomRadiusMeters: 1e6, topRadiusMeters: 1.1e6},
		atmosphere: {
			rayleighScaleHeightMeters: 1e30,
			mieScaleHeightMeters: 1e30,
			mieSingleScatteringAlbedo: 0.9,
			miePhaseFunctionG: 0.7,
			ozone: {absorptionEnabled: false},
		},
		domains: {
			position: {id: 'unused-volume-proof-position', count: 0, nodes: []},
			solarZenith: {id: 'unused-volume-proof-solar', count: 0, nodes: []},
			incoming: {
				id: 'unused-volume-proof-incoming',
				directionCount: 0,
				unitVectors: [],
				integrationWeightsSteradians: [],
			},
			outgoing: {
				id: 'unused-volume-proof-outgoing',
				faceWidth: 0,
				directionCount: 0,
				unitVectors: [],
				positiveFaceCenterIndices: {positiveX: 0, positiveY: 0, positiveZ: 0},
			},
			spectrum: {
				id: 'volume-proof-monochromatic',
				channels: [
					{
						centerNanometers: 550,
						sourceIrradianceDensityWattsPerSquareMeterPerNanometer: 1.5,
						rayleighScatteringPerMeter: beta,
						mieExtinctionPerMeter: 0,
						groundAlbedo: albedo,
					},
				],
			},
		},
		numerical: {sourcePathTransmittanceIntervalCount: 1, transportIntervalCount: 1, maximumScatteringOrder: 1},
	};
}

/** Self-verifying geometry, manufactured radiance and failure-path checks in memory.
 * This is implementation verification; it does not write or claim atmospheric evidence.
 * @returns {SkyVolumeProof} Actual checks and maximum analytic discrepancies.
 */
export function volumeReferenceProof() {
	let checks = 0,
		maximumGeometryErrorMeters = 0,
		maximumRadianceErrorWatts = 0;
	const assert = (/** @type {boolean} */ condition, /** @type {string} */ message) => {
		checks++;
		if (!condition) throw new Error(`Volume reference proof failed: ${message}`);
	};
	const rejects = (/** @type {() => unknown} */ operation, /** @type {string} */ message) => {
		let rejected = false;
		try {
			operation();
		} catch (error) {
			rejected = error instanceof RangeError;
		}
		assert(rejected, message);
	};
	const small = {...fixture(0, 0), planet: {bottomRadiusMeters: 10, topRadiusMeters: 30}};
	/** @type {SkyVolumeWitness[]} */ const witnesses = [
		{id: 'surface-outward', origin: [0, 0, 10], direction: [0, 0, 1]},
		{id: 'surface-tangent', origin: [0, 0, 10], direction: [1, 0, 0]},
		{id: 'volume-outward', origin: [0, 0, 20], direction: [0, 0, 1]},
		{id: 'volume-ground', origin: [0, 0, 20], direction: [0, 0, -1]},
		{id: 'volume-escaping', origin: [20, 0, -5], direction: [0, 0, 1]},
		{id: 'shadow-crossing', origin: [20, 0, -5], direction: [-1, 0, 0]},
		{id: 'closest-and-shadow', origin: [20, 0, -15], direction: [-1, 0, 0]},
	];
	for (const witness of witnesses) {
		const geometry = resolveVolumeGeometry(small, witness.origin, witness.direction);
		assert(geometry.lengthMeters > 0, `${witness.id} has a finite positive extent`);
		const target = geometry.boundary === 'ground' ? 10 : 30;
		assert(
			Math.abs(Math.hypot(...geometry.endpoint) - target) < 1e-12,
			`${witness.id} terminates on its declared sphere`,
		);
		let length = 0;
		for (const segment of geometry.segments) {
			const map = volumeAltitudeMap(geometry, segment);
			for (const fraction of [0.01, 0.25, 0.75, 0.99]) {
				const point = volumePoint(
					geometry.origin,
					geometry.direction,
					segment.startMeters + fraction * (segment.endMeters - segment.startMeters),
				);
				assert(
					volumeSourceVisible(10, point) === segment.sourceVisible,
					`${witness.id} open segment keeps source visibility`,
				);
				assert(Math.hypot(...point) >= 10 - 1e-12, `${witness.id} never traverses ground`);
			}
			const integral = integrateVector(
				(coordinate) => [map.evaluate(coordinate).jacobian],
				0,
				map.endCoordinate,
				[1e-9],
				1e-10,
				'simpson',
				4096,
			);
			assert(integral.converged, `${witness.id} branchwise constant integrand resolves`);
			const error = Math.abs(integral.values[0] - (segment.endMeters - segment.startMeters));
			maximumGeometryErrorMeters = Math.max(maximumGeometryErrorMeters, error);
			assert(error < 1e-8, `${witness.id} transformed path has the correct positive length`);
			length += integral.values[0];
		}
		assert(Math.abs(length - geometry.lengthMeters) < 2e-8, `${witness.id} splits cover the complete ray`);
	}
	const crossing = resolveVolumeGeometry(small, [20, 0, -5], [-1, 0, 0]);
	assert(
		crossing.boundary === 'ground' && crossing.segments.some((segment) => !segment.sourceVisible),
		'shadow transition is retained before ground contact',
	);
	assert(
		crossing.segments
			.filter((segment) => segment.sourceVisible)
			.reduce((sum, segment) => sum + segment.endMeters - segment.startMeters, 0) === 10,
		'manufactured shadow cylinder has exact illuminated length',
	);
	assert(
		resolveVolumeGeometry(small, [0, 0, 20], [0, 0, -1]).branch === 'volume-ground',
		'inward ground branch is explicit',
	);
	assert(
		resolveVolumeGeometry(small, [20, 0, -5], [0, 0, 1]).branch === 'volume-escaping',
		'inward escaping branch is explicit',
	);
	rejects(
		() => resolveVolumeGeometry(small, [0, 0, 10], [0, 0, -1]),
		'exact-ground inward convention is not silently changed',
	);
	rejects(() => resolveVolumeGeometry(small, [0, 0, 9], [0, 0, 1]), 'underground origin rejected');
	rejects(() => resolveVolumeGeometry(small, [0, 0, 31], [0, 0, -1]), 'outside origin rejected');
	rejects(() => resolveVolumeGeometry(small, [0, 0, 20], [0, 0, 2]), 'nonunit direction rejected');
	for (const [tau, allowance] of [
		[0, 0],
		[0, 1],
		[1, 0.1],
		[1000, 1],
		[1000, 2000],
	]) {
		const result = volumeAttenuation(tau, allowance);
		assert(
			Number.isFinite(result.value) &&
				Number.isFinite(result.allowance) &&
				result.allowance >= 0 &&
				result.allowance <= 1,
			'transmission uncertainty remains finite including underflow',
		);
		assert(
			result.allowance + 1e-15 >= Math.abs(Math.exp(-Math.max(0, tau - allowance)) - result.value) &&
				result.allowance + 1e-15 >= Math.abs(Math.exp(-(tau + allowance)) - result.value),
			'both physical optical-depth perturbations are covered',
		);
	}
	rejects(() => volumeAttenuation(1, Infinity), 'nonfinite uncertainty rejected');
	const physical = fixture(1e-5, 0.4),
		phase = 3 / (8 * Math.PI),
		irradiance = 1.5;
	const surface = evaluateVolumeFirstOrder(physical, [0, 0, 1e6], [0, 0, 1], [0]);
	const oldSurface = evaluatePhysicalSurfaceRay(
		physical,
		{origin: [0, 0, 1e6], direction: [0, 0, 1], length: 1e5},
		[0],
	);
	assert(surface.resolved && oldSurface.resolved, 'new and established outward ground references resolve');
	for (const key of ['gaussWatts', 'simpsonWatts']) {
		assert(
			Math.abs(surface.channels[0].atmosphere[key] - oldSurface.channels[0][key]) < 1e-10,
			'ground-outward physical parity retains the established implementation',
		);
		assert(surface.channels[0].directGround[key] === 0, 'outward ray has no ground contribution');
	}
	const elevated = evaluateVolumeFirstOrder(physical, [0, 0, 1.02e6], [0, 0, 1], [0]);
	const inward = evaluateVolumeFirstOrder(physical, [0, 0, 1.02e6], [0, 0, -1], [0]);
	assert(elevated.resolved && inward.resolved, 'positive-altitude outward and inward-ground slabs resolve');
	const expectedOut = irradiance * phase * 0.8 * Math.exp(-0.8);
	const expectedIn = irradiance * phase * 0.5 * (Math.exp(-0.8) - Math.exp(-1.2));
	const expectedGround = ((irradiance * 0.4) / Math.PI) * Math.exp(-1.2);
	for (const key of ['gaussWatts', 'simpsonWatts']) {
		for (const [actual, expected] of [
			[elevated.channels[0].atmosphere[key], expectedOut],
			[inward.channels[0].atmosphere[key], expectedIn],
			[inward.channels[0].directGround[key], expectedGround],
		]) {
			const error = Math.abs(actual - expected);
			maximumRadianceErrorWatts = Math.max(maximumRadianceErrorWatts, error);
			assert(error < 2e-9, 'analytic attenuated homogeneous volume/slab component agrees');
		}
		assert(
			inward.channels[0].total[key] === inward.channels[0].atmosphere[key] + inward.channels[0].directGround[key],
			'reported separated contributions exactly sum',
		);
	}
	assert(
		inward.channels[0].total.empiricalAllowanceWatts >=
			inward.channels[0].atmosphere.empiricalAllowanceWatts +
				inward.channels[0].directGround.empiricalAllowanceWatts,
		'total allowance covers both separated components',
	);
	const vacuum = evaluateVolumeFirstOrder(fixture(0, 0.4), [0, 0, 1.02e6], [0, 0, -1], [0]);
	assert(
		vacuum.resolved &&
			vacuum.channels[0].atmosphere.gaussWatts === 0 &&
			Math.abs(vacuum.channels[0].directGround.gaussWatts - (0.4 * 1.5) / Math.PI) < 1e-15,
		'vacuum direct Lambertian ground term is exact',
	);
	const limit = evaluateDirectGroundLimit(physical, [0, 0, 1e6], [0]);
	assert(limit.resolved, 'independent direct-ground limit resolves');
	for (const key of ['gaussWatts', 'simpsonWatts'])
		assert(
			Math.abs(limit.channels[0].directGround[key] - ((1.5 * 0.4) / Math.PI) * Math.exp(-1)) < 1e-10,
			'fixed-ground homogeneous attenuated Lambertian limit is analytic',
		);
	const limitedBoundary = evaluateDirectGroundLimit(physical, [0, 0, 1e6], [0], {maximumMediumEvaluations: 0});
	assert(
		!limitedBoundary.resolved && limitedBoundary.channels[0].directGround.empiricalAllowanceWatts === null,
		'unresolved boundary column has no accepted allowance',
	);
	const parent = evaluatePhysicalJ1References(
		physical,
		[
			{
				id: 'p-0930-4-7',
				time: '09:30',
				gridX: 4,
				gridY: 7,
				ray: {origin: [0, 0, 1e6], direction: [0, 0, 1], length: 1e5},
			},
		],
		[0],
	);
	/** @type {SkyVolumePilotRow[]} */ const manufacturedRows = [
		{id: 'p-0930-4-7', elapsedMilliseconds: 0, result: surface},
		...[0.001, 1, 100, 1000].map((height) => ({
			id: `ground-h${height}`,
			elapsedMilliseconds: 0,
			result: {...inward, channels: [{...inward.channels[0], directGround: {...limit.channels[0].directGround}}]},
		})),
	];
	const assessments = assessVolumeWitnesses(manufacturedRows, parent, limit, [0]);
	assert(
		assessments.find((check) => check.id === 'surface-parity:p-0930-4-7').state === 'passed',
		'manufactured authenticated-parent parity predicate passes',
	);
	assert(
		assessments.find((check) => check.id === 'ground-limit-1mm').state === 'passed',
		'manufactured exact-limit predicate passes',
	);
	assert(
		assessments.find((check) => check.id === 'surface-parity:p-1230-3-5').state === 'unresolved',
		'missing witness cannot pass a prediction',
	);
	const changed = manufacturedRows.map((row) =>
		row.id === 'ground-h0.001'
			? {
					...row,
					result: {
						...row.result,
						channels: [
							{
								...row.result.channels[0],
								directGround: {...row.result.channels[0].directGround, gaussWatts: 1, simpsonWatts: 1},
							},
						],
					},
				}
			: row,
	);
	assert(
		assessVolumeWitnesses(changed, parent, limit, [0]).find((check) => check.id === 'ground-limit-1mm').state ===
			'failed',
		'material limit disagreement preserves a failed prediction',
	);
	assert(
		assessVolumeWitnesses(manufacturedRows, parent, limitedBoundary, [0]).find(
			(check) => check.id === 'ground-limit-1mm',
		).state === 'unresolved',
		'missing limit allowance cannot produce a passed prediction',
	);
	const night = evaluateVolumeFirstOrder(physical, [0, 0, -1.02e6], [0, 0, 1], [0]);
	assert(
		night.resolved && night.channels[0].total.gaussWatts === 0 && night.channels[0].total.simpsonWatts === 0,
		'fully shadowed inward night path and ground produce zero',
	);
	const top = evaluateVolumeFirstOrder(physical, [0, 0, 1.1e6], [0, 0, 1], [0]);
	assert(
		top.resolved && top.geometry.lengthMeters === 0 && top.channels[0].total.gaussWatts === 0,
		'outward atmosphere-top boundary is zero without work',
	);
	const exhausted = evaluateVolumeFirstOrder(physical, [0, 0, 1.02e6], [0, 0, -1], [0], {maximumOuterEvaluations: 0});
	assert(
		!exhausted.resolved &&
			exhausted.channels[0].total.empiricalAllowanceWatts === null &&
			exhausted.methods.every((method) => method.outerEvaluations === 0),
		'outer cap yields explicit nonresolution and no fabricated allowance',
	);
	const mediumExhausted = evaluateVolumeFirstOrder(physical, [0, 0, 1.02e6], [0, 0, -1], [0], {
		maximumMediumEvaluations: 0,
	});
	assert(
		!mediumExhausted.resolved && mediumExhausted.methods.every((method) => method.mediumEvaluations === 0),
		'medium cap is shared and cannot be bypassed',
	);
	for (const cap of [-1, Infinity, 2049])
		rejects(
			() => evaluateVolumeFirstOrder(physical, [0, 0, 1.02e6], [0, 0, 1], [0], {maximumOuterEvaluations: cap}),
			'invalid lower cap rejected',
		);
	rejects(() => evaluateVolumeFirstOrder(physical, [0, 0, 1.02e6], [0, 0, 1], [0, 0]), 'duplicate channels rejected');
	let guardCalls = 0,
		propagated = false;
	const signal = new RangeError('manufactured volume deadline');
	try {
		evaluateVolumeFirstOrder(physical, [0, 0, 1.02e6], [0, 0, -1], [0], {
			guard: () => {
				if (++guardCalls === 4) throw signal;
			},
		});
	} catch (error) {
		propagated = error === signal;
	}
	assert(propagated, 'cooperative cancellation preserves its error identity during execution');
	for (const method of inward.methods) {
		assert(
			method.passes.length === 2 &&
				method.passes[0].toleranceScale === 4 &&
				method.passes[1].toleranceScale === 1,
			'both tolerance passes are retained',
		);
		assert(
			method.passes.reduce((sum, pass) => sum + pass.mediumEvaluations, 0) === method.mediumEvaluations &&
				method.passes.reduce((sum, pass) => sum + pass.outerEvaluations, 0) === method.outerEvaluations,
			'pass work sums to method accounting',
		);
		assert(
			method.passes.every((pass) => pass.maximumColumnEvaluationsUsed <= 4096 && pass.columnCalls > 0),
			'column work respects the existing profile',
		);
	}
	const pilot = evaluateVolumePilot(
		fixture(0, 0),
		[{id: 'bounded-vacuum', origin: [0, 0, 1.02e6], direction: [0, 0, 1]}],
		[0],
	);
	assert(
		pilot.length === 1 && pilot[0].result.resolved && pilot[0].elapsedMilliseconds >= 0,
		'pilot returns measured bounded witness results without I/O',
	);
	rejects(() => evaluateVolumePilot(physical, [], [0]), 'empty pilot rejected');
	return {schemaId: 'sky-volume-reference-proof-v1', checks, maximumGeometryErrorMeters, maximumRadianceErrorWatts};
}
