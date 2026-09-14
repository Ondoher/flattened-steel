import {
	createPointStencilBuilder,
	evaluateOrders,
	integrateDensity,
	prepareViewPlan,
	sampleDensity,
} from '../../numerics/view.js';
import {medium} from '../../numerics/direct.js';
import {prepareGroundDensityCapture, evaluateGroundDensityCapture, validateGroundDensityCapture} from './ground.js';
import {prepareAdaptiveCapture, evaluateAdaptiveCapture, validateAdaptiveCapture} from './adaptive.js';
import {validateChannelDiagnostics} from './diagnostics.js';

/** Reconstruct identical synthetic Float32 fields for independently ordered local tap unions.
 * @param {readonly SkyFieldCoordinate[]} coordinates - Local capture coordinate order.
 * @returns {readonly Float32Array[]} Positive raw J1-J4 with coordinate-dependent variation.
 */
function manufacturedOrders(coordinates) {
	return [1, 2, 3, 4].map((order) =>
		Float32Array.from(
			coordinates,
			(point) =>
				order *
				1e-8 *
				(1 + 0.001 * point.altitudeIndex + 0.0001 * point.solarIndex + 0.00001 * point.directionIndex),
		),
	);
}

/** Identical synthetic species lighting in independently ordered local sparse unions.
 * @param {readonly SkyFieldCoordinate[]} coordinates - Local coordinate order.
 * @returns {SkyAdaptiveFactoredFirstOrder} Positive lighting fields with explicit Float32 storage.
 */
function manufacturedLighting(coordinates) {
	return {
		rayleighLighting: Float32Array.from(
			coordinates,
			(point) => 0.02 * (1 + 0.0001 * point.solarIndex + 0.00001 * point.directionIndex),
		),
		mieLighting: Float32Array.from(
			coordinates,
			(point) => 0.01 * (1 + 0.0002 * point.altitudeIndex + 0.000001 * point.directionIndex),
		),
	};
}

/** Build one malformed checkpoint envelope without modifying the original proof result.
 * @param {SkyAdaptiveCaptureEvidence} data - Accepted original evidence.
 * @param {number} rowIndex - Ray to replace.
 * @param {'adaptive' | 'uniform'} kind - Checkpoint family.
 * @param {number} checkpointIndex - Budget index.
 * @param {SkyAdaptiveCheckpoint} replacement - Deliberately altered numerical contract.
 * @returns {SkyAdaptiveCaptureEvidence} Independent malformed object for rejection checks.
 */
function replaceCheckpoint(data, rowIndex, kind, checkpointIndex, replacement) {
	return {
		...data,
		rows: data.rows.map((row, index) =>
			index !== rowIndex
				? row
				: {
						...row,
						[kind]: row[kind].map((result, position) =>
							position === checkpointIndex ? replacement : result,
						),
					},
		),
	};
}

/** Exercise capture support, reconstruction, parity and input validation on synthetic fields.
 * The caller authenticates H and the frozen registration before calling. This function
 * reads no files, allocates no evidence and executes no GPU or Kider calculation.
 * Stage callbacks run between bounded synchronous sections, followed by an event-loop yield.
 * @param {SkyBuildRequest} buildRequest - Registered H geometry and physical coefficients.
 * @param {readonly SkyScene[]} scenes - Ordered 09:30/11:15/13:30 screen conditions.
 * @param {SkyContinuationCaptureControl} selection - Frozen forty-probe selection and ground witnesses.
 * @param {(message: string) => void} [onProgress] - Caller-owned progress and cancellation hook.
 * @returns {Promise<SkyCaptureSupportProofResult>} Manufactured integration and rejection evidence.
 */
export async function captureSupportProof(buildRequest, scenes, selection, onProgress = () => {}) {
	const spec = buildRequest.transportSpec;
	if (
		spec.domains.position.count !== 48 ||
		spec.domains.outgoing.faceWidth !== 27 ||
		spec.numerical.sourcePathTransmittanceIntervalCount !== 80 ||
		spec.numerical.transportIntervalCount !== 160
	)
		throw new RangeError('Capture manufactured proof is bounded to the registered H geometry.');
	let checks = 0,
		maximumAdaptiveEvidenceBytes = 0,
		maximumManufacturedEnvelopeBytes = 0;
	/** @type {Record<string, number>} */ const stageMilliseconds = {};
	/** @param {boolean} condition - Required invariant. @param {string} message - Failure diagnostic. @returns {void} */
	function assert(condition, message) {
		if (!condition) throw new Error(`Capture support proof failed: ${message}`);
		checks++;
	}
	/** @param {() => unknown} action - Operation expected to reject. @param {string} message - Failure diagnostic. @returns {void} */
	function rejects(action, message) {
		let rejected = false;
		try {
			action();
		} catch {
			rejected = true;
		}
		assert(rejected, message);
	}
	/** @param {string} message - Named progress boundary. @returns {Promise<void>} Event-loop yield after caller progress. */
	async function progress(message) {
		onProgress(message);
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
	await progress('Capture proof: reconstruct four ground witnesses.');
	let start = performance.now();
	const groundPlan = prepareGroundDensityCapture(buildRequest, selection);
	assert(groundPlan !== null && groundPlan.probes.length === 4, 'four declared ground witnesses');
	const groundFields = manufacturedOrders(groundPlan.coordinates),
		ground = evaluateGroundDensityCapture(groundPlan, groundFields, 'monotone-cubic');
	assert(validateGroundDensityCapture(ground) === ground, 'valid ground evidence accepted without mutation');
	assert(
		prepareGroundDensityCapture(buildRequest, {...selection, groundDensityProbes: undefined}) === null,
		'absent optional ground capture',
	);
	const independent = createPointStencilBuilder(buildRequest);
	for (const [index, probe] of groundPlan.probes.entries()) {
		const sample = independent.sample(probe.ray.origin, probe.ray.direction, 1);
		assert(
			JSON.stringify(sample) === JSON.stringify(ground.rows[index].sample),
			'independently rebuilt ground stencil identity',
		);
		for (let order = 0; order < 4; order++)
			assert(
				ground.rows[index].pureDensities[order] ===
					sampleDensity(groundFields[order], sample, 'monotone-cubic'),
				'independent retained-tap ground reconstruction',
			);
	}
	assert(
		JSON.stringify(independent.coordinates) === JSON.stringify(ground.coordinates),
		'complete ground tap-union identity',
	);
	const first = ground.rows[0];
	rejects(
		() => validateGroundDensityCapture({...ground, units: 'W m^-2 sr^-1 nm^-1'}),
		'ground radiance/density units rejection',
	);
	rejects(
		() => validateGroundDensityCapture({...ground, fieldIds: ['J2', 'J1', 'J3', 'J4']}),
		'ground pure-order label swap rejection',
	);
	rejects(
		() => validateGroundDensityCapture({...ground, rows: [ground.rows[1], first, ...ground.rows.slice(2)]}),
		'ground witness order swap rejection',
	);
	rejects(
		() =>
			validateGroundDensityCapture({
				...ground,
				rows: [
					{...first, pureDensities: [first.pureDensities[0] * 1.01, ...first.pureDensities.slice(1)]},
					...ground.rows.slice(1),
				],
			}),
		'ground numerical value tamper rejection',
	);
	rejects(
		() =>
			validateGroundDensityCapture({
				...ground,
				rows: [
					{
						...first,
						sample: {...first.sample, indices: first.sample.indices.map(() => ground.coordinates.length)},
					},
					...ground.rows.slice(1),
				],
			}),
		'ground out-of-range tap index rejection',
	);
	rejects(
		() =>
			validateGroundDensityCapture({
				...ground,
				rows: [
					{...first, sample: {...first.sample, indices: first.sample.indices.map(() => 0)}},
					...ground.rows.slice(1),
				],
			}),
		'ground in-range changed tap derivation rejection',
	);
	rejects(
		() =>
			validateGroundDensityCapture({
				...ground,
				rows: [{...first, pureDensities: [Infinity, ...first.pureDensities.slice(1)]}, ...ground.rows.slice(1)],
			}),
		'ground nonfinite reconstructed density rejection',
	);
	rejects(
		() =>
			validateGroundDensityCapture({
				...ground,
				fields: [[NaN, ...ground.fields[0].slice(1)], ...ground.fields.slice(1)],
			}),
		'ground nonfinite raw tap rejection',
	);
	rejects(
		() =>
			validateGroundDensityCapture({
				...ground,
				rows: [{...first, sample: {...first.sample, altitudeWeights: [0.5]}}, ...ground.rows.slice(1)],
			}),
		'ground unnormalized interpolation weight rejection',
	);
	rejects(
		() =>
			prepareGroundDensityCapture(buildRequest, {
				...selection,
				groundDensityProbes: [...selection.groundDensityProbes].reverse(),
			}),
		'ground registration-order admission',
	);
	stageMilliseconds.ground = performance.now() - start;
	await progress('Capture proof: prepare all 259 adaptive support rays and ordinary 8/16 controls.');
	start = performance.now();
	const adaptivePlan = prepareAdaptiveCapture(buildRequest, scenes, selection),
		ordinaryPlan = prepareViewPlan(buildRequest, scenes, {
			altitudeCount: 48,
			outgoingWidth: 27,
			sourceIntervals: 80,
			transportIntervals: 160,
			incoming: {kind: 'gauss-legendre-product', muCount: 16, azimuthCount: 32},
			viewRule: 'altitude-segmented',
			viewIntervals: [8, 16],
			solarInterpolations: ['monotone-cubic'],
			representations: ['grouped'],
		}),
		adaptiveFields = manufacturedOrders(adaptivePlan.support.coordinates),
		ordinaryFields = manufacturedOrders(ordinaryPlan.coordinates);
	assert(
		adaptivePlan.support.rays.length === 259 &&
			adaptivePlan.identities.filter((row) => row.ordinaryRayIndex !== null).length === 243,
		'complete ordinary-plus-extra-time scope',
	);
	assert(
		adaptivePlan.identities.filter((row) => row.probeId !== null).length === 40,
		'exact frozen diagnostic mesh count',
	);
	assert(adaptivePlan.support.preparedQueryCount === 259 * 48 * 31, 'all adaptive prepared queries reported');
	const adaptiveCoordinates = new Map(
		adaptivePlan.support.coordinates.map((point, index) => [`${point.x}:${point.y}`, index]),
	);
	for (const [index, point] of ordinaryPlan.coordinates.entries()) {
		const local = adaptiveCoordinates.get(`${point.x}:${point.y}`);
		assert(local !== undefined, 'ordinary field support belongs to adaptive finite union');
		for (let order = 0; order < 4; order++)
			assert(
				ordinaryFields[order][index] === adaptiveFields[order][local],
				'synthetic local-union field identity',
			);
	}
	stageMilliseconds.prepare = performance.now() - start;
	await progress('Capture proof: evaluate raw grouped ordinary controls.');
	start = performance.now();
	const ordinary = evaluateOrders(buildRequest, ordinaryPlan, 0, ordinaryFields);
	stageMilliseconds.ordinaryRaw = performance.now() - start;
	/** @type {number[]} */ const maximumUniformParityErrors = [];
	for (const firstOrder of /** @type {const} */ (['raw', 'factored'])) {
		await progress(`Capture proof: evaluate ${firstOrder} adaptive/uniform comparisons on 259 rays.`);
		start = performance.now();
		const factored = firstOrder === 'factored' ? manufacturedLighting(adaptivePlan.support.coordinates) : null;
		let comparison = ordinary;
		if (factored) {
			const lighting = manufacturedLighting(ordinaryPlan.coordinates),
				values = ordinary.values.slice();
			for (const [viewIndex, view] of ordinaryPlan.views.entries())
				for (const [rayIndex, ray] of view.rays.entries()) {
					const correctedFirst = integrateDensity(spec, 0, ray, (sample) => {
						const coefficients = medium(spec, 0, sample.altitude);
						return (
							coefficients[1] * sampleDensity(lighting.rayleighLighting, sample, 'monotone-cubic') +
							coefficients[2] * sampleDensity(lighting.mieLighting, sample, 'monotone-cubic')
						);
					});
					const offset = viewIndex * 4 * ordinaryPlan.rayCount + rayIndex,
						delta = correctedFirst - values[offset];
					for (let order = 0; order < 4; order++) values[offset + order * ordinaryPlan.rayCount] += delta;
				}
			comparison = {...ordinary, values};
		}
		const data = evaluateAdaptiveCapture(
			buildRequest,
			adaptivePlan,
			ordinaryPlan,
			comparison,
			0,
			adaptiveFields,
			factored,
		);
		assert(validateAdaptiveCapture(data) === data, `${firstOrder} complete operation envelope accepted`);
		/** @type {SkyContinuationChannelDiagnostics} */
		const envelope = {
			schemaId: 'sky-continuation-channel-diagnostics-v1',
			scope: 'component-probes',
			units: 'W m^-2 sr^-1 nm^-1',
			queryCount: 0,
			preparationEvaluationCount: 0,
			evaluationCount: 0,
			allowancePolicy: 'Manufactured capture-boundary proof with no physical-reference rows.',
			probes: [],
			groundDensities: ground,
			operations: data,
		};
		assert(
			validateChannelDiagnostics(envelope) === envelope,
			`${firstOrder} outer diagnostic envelope preserves both separate scopes`,
		);
		maximumAdaptiveEvidenceBytes = Math.max(
			maximumAdaptiveEvidenceBytes,
			new TextEncoder().encode(JSON.stringify(data)).byteLength,
		);
		maximumManufacturedEnvelopeBytes = Math.max(
			maximumManufacturedEnvelopeBytes,
			new TextEncoder().encode(JSON.stringify(envelope)).byteLength,
		);
		assert(
			data.firstOrder === firstOrder && data.scalarReconstructionsPerNode === (factored ? 5 : 4),
			`${firstOrder} exact callback cost declaration`,
		);
		maximumUniformParityErrors.push(data.maximumUniformParityError);
		for (const row of data.rows) {
			for (const result of row.adaptive) {
				assert(
					result.counters.queriedNodes >= 3 * row.segmentCount &&
						result.counters.queriedNodes <= result.budget,
					'all adaptive coarse/trial queries charged',
				);
				assert(
					result.counters.queriedNodes === 2 * result.activeNodeCount - row.segmentCount,
					'disjoint midpoint query identity',
				);
				assert(
					result.counters.queriedNodes + result.nextRefinementCost > result.budget,
					'top-priority budget stopping',
				);
				assert((result.mesh !== null) === (row.probeId !== null), 'only frozen components retain meshes');
			}
			for (const result of row.uniform)
				assert(
					result.counters.queriedNodes === result.budget &&
						result.activeNodeCount === result.budget &&
						result.counters.mediumEvaluations === result.budget &&
						result.counters.scalarReconstructions === result.budget * data.scalarReconstructionsPerNode,
					'uniform uses the identical charged joint evaluator',
				);
		}
		const rowIndex = data.rows.findIndex((row) => row.probeId !== null),
			row = data.rows[rowIndex],
			checkpoint = row.adaptive[0],
			uniform = row.uniform[0];
		rejects(
			() => validateAdaptiveCapture({...data, units: 'W m^-3 sr^-1 nm^-1'}),
			'adaptive density/radiance units rejection',
		);
		rejects(
			() => validateAdaptiveCapture({...data, preparedQueryCount: data.preparedQueryCount + 1}),
			'adaptive support-count tamper rejection',
		);
		rejects(() => validateAdaptiveCapture({...data, rows: data.rows.slice(1)}), 'missing adaptive ray rejection');
		rejects(
			() =>
				validateAdaptiveCapture({
					...data,
					rows: data.rows.map((item, index) =>
						index === rowIndex ? {...item, adaptive: [...item.adaptive].reverse()} : item,
					),
				}),
			'adaptive budget-order swap rejection',
		);
		rejects(
			() =>
				validateAdaptiveCapture({
					...data,
					rows: data.rows.map((item, index) =>
						index === rowIndex ? {...item, probeId: 'changed-frozen-probe'} : item,
					),
				}),
			'adaptive frozen identity join tamper rejection',
		);
		rejects(
			() =>
				validateAdaptiveCapture({
					...data,
					rows: data.rows.map((item, index) => (index === 0 ? {...item, ordinaryRayIndex: 1} : item)),
				}),
			'adaptive ordinary-index tamper rejection',
		);
		rejects(
			() =>
				validateAdaptiveCapture(
					replaceCheckpoint(data, rowIndex, 'adaptive', 0, {
						...checkpoint,
						groupedRadiancesW: [
							checkpoint.groupedRadiancesW[0] + 1,
							...checkpoint.groupedRadiancesW.slice(1),
						],
					}),
				),
			'adaptive grouped value tamper rejection',
		);
		rejects(
			() =>
				validateAdaptiveCapture(
					replaceCheckpoint(data, rowIndex, 'adaptive', 0, {...checkpoint, transmittance: NaN}),
				),
			'adaptive nonfinite transmittance rejection',
		);
		rejects(
			() =>
				validateAdaptiveCapture(
					replaceCheckpoint(data, rowIndex, 'adaptive', 0, {
						...checkpoint,
						componentRadiancesW: [Infinity, ...checkpoint.componentRadiancesW.slice(1)],
					}),
				),
			'adaptive nonfinite component radiance rejection',
		);
		rejects(
			() =>
				validateAdaptiveCapture(
					replaceCheckpoint(data, rowIndex, 'adaptive', 0, {
						...checkpoint,
						counters: {...checkpoint.counters, queriedNodes: checkpoint.counters.queriedNodes + 1},
					}),
				),
			'adaptive trial-count tamper rejection',
		);
		rejects(
			() =>
				validateAdaptiveCapture(
					replaceCheckpoint(data, rowIndex, 'adaptive', 0, {
						...checkpoint,
						counters: {
							...checkpoint.counters,
							scalarReconstructions: checkpoint.counters.scalarReconstructions + 1,
						},
					}),
				),
			'adaptive scalar-cost tamper rejection',
		);
		rejects(
			() =>
				validateAdaptiveCapture(replaceCheckpoint(data, rowIndex, 'adaptive', 0, {...checkpoint, mesh: null})),
			'missing frozen component mesh rejection',
		);
		rejects(
			() =>
				validateAdaptiveCapture(
					replaceCheckpoint(data, rowIndex, 'adaptive', 0, {...checkpoint, nextRefinementCost: 0}),
				),
			'false adaptive union exhaustion rejection',
		);
		rejects(
			() =>
				validateAdaptiveCapture(
					replaceCheckpoint(data, rowIndex, 'uniform', 0, {
						...uniform,
						mesh: uniform.mesh.map((level, index) => (index < 2 ? 2 : index === 2 ? 8 : level)),
					}),
				),
			'nonuniform uniform-control mesh rejection',
		);
		const prefixRowIndex = data.rows.findIndex(
			(item) =>
				item.probeId !== null &&
				[...item.adaptive[2].mesh].reverse().some((level, index) => level < item.adaptive[1].mesh[index]),
		);
		assert(prefixRowIndex >= 0, 'manufactured adaptive mesh has a concrete prefix-decrease witness');
		const prefixResult = data.rows[prefixRowIndex].adaptive[2];
		rejects(
			() =>
				validateAdaptiveCapture(
					replaceCheckpoint(data, prefixRowIndex, 'adaptive', 2, {
						...prefixResult,
						mesh: [...prefixResult.mesh].reverse(),
					}),
				),
			'same-sum mesh permutation violating refinement prefix is rejected',
		);
		rejects(
			() => validateChannelDiagnostics({...envelope, operations: {...data, units: 'W m^-3 sr^-1 nm^-1'}}),
			'outer diagnostic validation rejects altered operational units',
		);
		stageMilliseconds[firstOrder] = performance.now() - start;
	}
	await progress('Capture proof: complete manufactured integration and rejection checks.');
	return {
		schemaId: 'sky-capture-support-proof-v1',
		checks,
		groundProbeCount: groundPlan.probes.length,
		adaptiveRayCount: adaptivePlan.support.rays.length,
		preparedQueryCount: adaptivePlan.support.preparedQueryCount,
		adaptiveCoordinateCount: adaptivePlan.support.coordinates.length,
		maximumUniformParityErrors,
		maximumAdaptiveEvidenceBytes,
		maximumManufacturedEnvelopeBytes,
		stageMilliseconds,
		scope: 'Synthetic positive Float32 densities and species lighting on authenticated H geometry; full ordinary/extra-time support, reconstruction, grouping and validator integration only. No GPU fields, measured Kider outcome, recurrence accuracy or adaptive convergence claim is produced.',
	};
}
