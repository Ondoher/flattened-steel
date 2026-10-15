import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createRun, identity, storage, verifyRun} from '../io/files.mjs';
import {readParent, requireUnusedStage} from '../hypotheses/common.mjs';
import {benchmarkRay, createPointStencilBuilder, viewPathIntervals, sampleDensity} from '../numerics/view.js';
import {sourceFrame, unit, dot} from '../numerics/math.js';
import {medium, phase} from '../numerics/direct.js';
import {incomingAt, referenceSource} from './incoming.mjs';

/** Last-event species; both consume the same incoming field.
 * @readonly @type {readonly SpeciesName[]}
 */
const speciesNames = ['rayleigh', 'mie'];

/** Producer's receiver-local phase sum; independent reference uses world cosines and compensated sums.
 * @param {SkyTransportSpec} spec @param {SpeciesIncident} incident @param {SkyVector3} outgoing
 * @returns {SpeciesSource} Physical species sources before Float32 storage.
 */
function produce(spec, incident, outgoing) {
	const local = incident.axes.map((axis) => dot(outgoing, axis)),
		sums = [0, 0];
	for (let i = 0; i < incident.radiances.length; i++) {
		const p = phase(spec, Math.max(-1, Math.min(1, dot(local, spec.domains.incoming.unitVectors[i]))));
		for (let s = 0; s < 2; s++)
			sums[s] += incident.radiances[i] * p[s] * spec.domains.incoming.integrationWeightsSteradians[i];
	}
	const beta = medium(spec, 8, Math.hypot(...incident.point) - spec.planet.bottomRadiusMeters);
	return {rayleigh: sums[0] * beta[1], mie: sums[1] * beta[2]};
}

/** Logical node lookup: all interpolation weights collapse to the same physical cache node.
 * @param {number} index @param {SkyVector3} point @param {number} altitude @returns {SkyViewSample}
 */
function nodeSample(index, point, altitude) {
	return {
		point,
		altitude,
		step: 1,
		altitudeWeights: [1],
		directionWeights: [1],
		solarFraction: 0,
		firstSolarInterval: false,
		lastSolarInterval: false,
		indices: [index, index, index, index],
	};
}

/** Root-mean-square on the complete registered sample set; no point pruning.
 * @param {number[]} values @returns {number}
 */
function rms(values) {
	return Math.sqrt(values.reduce((sum, x) => sum + x * x, 0) / values.length);
}

/** Execute the fixed H15 comparison; scientific support is separate from operational acceptance.
 * @param {number} deadline Absolute parent-owned deadline including setup and prior failed work.
 * @returns {void}
 */
function execute(deadline) {
	const started = Date.now(),
		before = storage();
	/** @type {DialFileIdentity[]} */ const parents = [];
	const original = /** @type {SpeciesNativePacket} */ (readParent('00000-inputs', 'controls.json', parents));
	const witnesses = /** @type {SpeciesRayPacket} */ (readParent('00232-alternate-rays', 'inputs.json', parents));
	readParent('00260-h12-native48-r2', 'replay.json', parents);
	for (const path of [
		'scripts/algorithm32/solar-zenith-cache/DistantSunBinary64Reference.js',
		'experiments/sky-accuracy-dials/orders/kernels.js',
		'experiments/sky-accuracy-dials/numerics/view.js',
		'experiments/sky-accuracy-dials/numerics/math.js',
		'experiments/sky-accuracy-dials/numerics/direct.js',
		'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/horizon-diagnosis-plan.md',
	])
		parents.push(identity(path));
	const run = createRun('h15-species', {
		parents,
		operation:
			'Sparse matched-rule J2 species reconstruction: combined A, split B, exponential-density normalized C.',
		parameters: {channel: 8, maximumMilliseconds: 600000, maximumRetainedBytes: 4 * 1024 ** 2},
	});
	let lastProgress = 0,
		deadlineHit = false,
		sealed = false;
	/** Enforce resource/time caps and flush progress without rescanning storage on every arithmetic sample. @returns {void} */
	function guard() {
		if (Date.now() > deadline - 5000) {
			deadlineHit = true;
			throw new Error('H15 execution deadline reached.');
		}
		if (Date.now() - lastProgress > 20000) {
			lastProgress = Date.now();
			run.guard();
			run.progress('compute', 'H15 sparse incoming/source work remains within the registered deadline.');
		}
	}
	try {
		guard();
		const request = original.native48,
			spec = request.transportSpec,
			builder = createPointStencilBuilder(request);
		assert.equal(spec.domains.spectrum.channels[8].centerNanometers, 454);
		assert.equal(spec.domains.incoming.directionCount, 68);
		assert.equal(spec.numerical.sourcePathTransmittanceIntervalCount, 20);
		assert.equal(spec.numerical.transportIntervalCount, 40);
		assert.equal(spec.atmosphere.ozone.absorptionEnabled, false);
		const scene = original.scenes.find((s) => s.time === '13:30');
		assert.ok(scene);
		/** @type {SpeciesQuery[]} */ const queries = [];
		for (const x of [0, 5]) {
			const ray = benchmarkRay(spec, scene, x, 4),
				frozen = witnesses.rays.find((r) => r.time === '13:30' && r.x === x && r.y === 4);
			assert.ok(frozen);
			ray.origin.forEach((v, i) => assert.ok(Math.abs(v / 1000 - frozen.origin[i]) < 1e-10));
			ray.direction.forEach((v, i) => assert.ok(Math.abs(v - frozen.direction[i]) < 8 * Number.EPSILON));
			const intervals = viewPathIntervals(spec, ray, 'altitude-segmented', 1).slice(0, 3);
			assert.equal(intervals.length, 3);
			for (const [segment, interval] of intervals.entries())
				for (const fraction of [1 / 3, 2 / 3]) {
					const distance = interval.start + fraction * (interval.end - interval.start);
					const point = /** @type {SkyVector3} */ ([
						ray.origin[0] + distance * ray.direction[0],
						ray.origin[1] + distance * ray.direction[1],
						ray.origin[2] + distance * ray.direction[2],
					]);
					const sample = builder.sample(point, ray.direction, 1);
					assert.equal(sample.altitudeWeights.length, 2);
					queries.push({
						ray: 'p-1330-' + x + '-4',
						segment,
						fraction,
						distance,
						point,
						direction: ray.direction,
						sample,
					});
				}
		}
		assert.equal(queries.length, 12);
		run.write('registration.json', {
			request,
			queries,
			coordinates: builder.coordinates,
			deadline,
			variants: ['A combined physical', 'B separate physical', 'C separate density-normalized'],
			prediction:
				'C reduces each species RMS reconstruction error on both rays beyond the frozen engineering screen; partial support is reported per stratum.',
			allowanceRule:
				'Before off-node scoring, max(8 * observed node storage/restoration error, 8 * 2^-24 * maximum species node source, 1e-30). Twice that value screens RMS changes.',
			sharedInputs:
				'Same actual finite S20/T40 L1, original F68 weights, total extinction, direct-ground term, physical inputs and interpolation kernel. L1 is not independently converged.',
			resources: before,
		});
		run.progress(
			'nodes',
			'Freeze sparse node payloads and independent arithmetic/parity before any off-node error scoring.',
			0,
			builder.coordinates.length,
		);
		const size = builder.coordinates.length;
		/** @type {SpeciesFields} */ const fields = {
			combined: new Float32Array(size),
			rayleigh: new Float32Array(size),
			mie: new Float32Array(size),
			rayleighCoefficient: new Float32Array(size),
			mieCoefficient: new Float32Array(size),
		};
		/** @type {SpeciesNodeChecks} */ const checks = {
			arithmetic: {rayleigh: 0, mie: 0},
			storage: {rayleigh: 0, mie: 0},
			scale: {rayleigh: 0, mie: 0},
			combined: 0,
		};
		/** @type {Map<string,SpeciesIncident>} */ const incoming = new Map();
		for (const [index, c] of builder.coordinates.entries()) {
			guard();
			const key = c.altitudeIndex + ':' + c.solarIndex;
			const h = spec.domains.position.nodes[c.altitudeIndex].altitudeMeters,
				angle = (spec.domains.solarZenith.nodes[c.solarIndex].solarZenithDegrees * Math.PI) / 180;
			const point = /** @type {SkyVector3} */ ([
				(spec.planet.bottomRadiusMeters + h) * Math.sin(angle),
				0,
				(spec.planet.bottomRadiusMeters + h) * Math.cos(angle),
			]);
			let packet = incoming.get(key);
			if (!packet) {
				packet = incomingAt(spec, point, guard);
				incoming.set(key, packet);
			}
			const axes = sourceFrame(point),
				local = spec.domains.outgoing.unitVectors[c.directionIndex];
			const outgoing = unit(
				[0, 1, 2].map((i) => axes[0][i] * local[0] + axes[1][i] * local[1] + axes[2][i] * local[2]),
			);
			const physical = produce(spec, packet, outgoing),
				target = referenceSource(spec, packet, outgoing),
				actualHeight = Math.max(0, Math.hypot(...point) - spec.planet.bottomRadiusMeters);
			fields.combined[index] = physical.rayleigh + physical.mie;
			fields.rayleigh[index] = physical.rayleigh;
			fields.mie[index] = physical.mie;
			fields.rayleighCoefficient[index] =
				physical.rayleigh / Math.exp(-actualHeight / spec.atmosphere.rayleighScaleHeightMeters);
			fields.mieCoefficient[index] =
				physical.mie / Math.exp(-actualHeight / spec.atmosphere.mieScaleHeightMeters);
			const sample = nodeSample(index, point, actualHeight);
			for (const species of speciesNames) {
				const height =
					species === 'rayleigh'
						? spec.atmosphere.rayleighScaleHeightMeters
						: spec.atmosphere.mieScaleHeightMeters;
				const raw = fields[species],
					coefficient = species === 'rayleigh' ? fields.rayleighCoefficient : fields.mieCoefficient;
				const error = Math.abs(physical[species] - target[species]);
				assert.ok(error <= 2e-11 * Math.max(target[species], 1e-30));
				checks.arithmetic[species] = Math.max(checks.arithmetic[species], error);
				checks.scale[species] = Math.max(checks.scale[species], target[species]);
				checks.storage[species] = Math.max(
					checks.storage[species],
					Math.abs(sampleDensity(raw, sample, 'monotone-cubic') - target[species]),
					Math.abs(
						sampleDensity(coefficient, sample, 'monotone-cubic') *
							Math.exp(-actualHeight / Number(height)) -
							target[species],
					),
				);
			}
			checks.combined = Math.max(
				checks.combined,
				Math.abs(sampleDensity(fields.combined, sample, 'monotone-cubic') - target.rayleigh - target.mie),
			);
		}
		const allowance = {
			rayleigh: Math.max(8 * checks.storage.rayleigh, 8 * 2 ** -24 * checks.scale.rayleigh, 1e-30),
			mie: Math.max(8 * checks.storage.mie, 8 * 2 ** -24 * checks.scale.mie, 1e-30),
		};
		run.write('node-checks.json', {
			checks,
			allowance,
			comparisonRule:
				'RMS change must exceed twice the species allowance; engineering screen, not total solver uncertainty.',
			nearZeroFloor: allowance,
		});
		run.write('sparse-fields.json', {
			fields: Object.fromEntries(Object.entries(fields).map(([key, values]) => [key, Array.from(values)])),
			incoming: [...incoming.entries()].map(([key, p]) => ({
				key,
				point: p.point,
				directions: p.directions,
				radiances: p.radiances,
			})),
		});
		run.progress(
			'queries',
			'Node parity and screens frozen. Evaluate all twelve direct query sources and three representations.',
			0,
			12,
		);
		/** @type {SpeciesQueryResult[]} */ const rows = [];
		/** @type {SpeciesIncident[]} */ const queryIncoming = [];
		for (const query of queries) {
			guard();
			const packet = incomingAt(spec, query.point, guard),
				reference = referenceSource(spec, packet, query.direction),
				h = query.sample.altitude;
			queryIncoming.push(packet);
			const combined = sampleDensity(fields.combined, query.sample, 'monotone-cubic');
			const split = {
				rayleigh: sampleDensity(fields.rayleigh, query.sample, 'monotone-cubic'),
				mie: sampleDensity(fields.mie, query.sample, 'monotone-cubic'),
			};
			const normalized = {
				rayleigh:
					sampleDensity(fields.rayleighCoefficient, query.sample, 'monotone-cubic') *
					Math.exp(-h / spec.atmosphere.rayleighScaleHeightMeters),
				mie:
					sampleDensity(fields.mieCoefficient, query.sample, 'monotone-cubic') *
					Math.exp(-h / spec.atmosphere.mieScaleHeightMeters),
			};
			const splitError = {rayleigh: split.rayleigh - reference.rayleigh, mie: split.mie - reference.mie},
				normalizedError = {
					rayleigh: normalized.rayleigh - reference.rayleigh,
					mie: normalized.mie - reference.mie,
				};
			rows.push({
				query,
				reference,
				combined,
				split,
				normalized,
				combinedError: combined - reference.rayleigh - reference.mie,
				splitError,
				normalizedError,
				splitRelativeError: {
					rayleigh: splitError.rayleigh / Math.max(reference.rayleigh, allowance.rayleigh),
					mie: splitError.mie / Math.max(reference.mie, allowance.mie),
				},
				normalizedRelativeError: {
					rayleigh: normalizedError.rayleigh / Math.max(reference.rayleigh, allowance.rayleigh),
					mie: normalizedError.mie / Math.max(reference.mie, allowance.mie),
				},
				splitCrossTerm: 2 * splitError.rayleigh * splitError.mie,
				normalizedCrossTerm: 2 * normalizedError.rayleigh * normalizedError.mie,
			});
			for (const p of [splitError, normalizedError])
				assert.ok(
					Math.abs((p.rayleigh + p.mie) ** 2 - (p.rayleigh ** 2 + p.mie ** 2 + 2 * p.rayleigh * p.mie)) <
						1e-25,
				);
		}
		/** @type {SpeciesStratum[]} */ const strata = [];
		for (const ray of [...new Set(queries.map((q) => q.ray))])
			for (const species of speciesNames) {
				const group = rows.filter((r) => r.query.ray === ray),
					a = rms(group.map((r) => r.splitError[species])),
					b = rms(group.map((r) => r.normalizedError[species]));
				assert.equal(group.length, 6);
				strata.push({
					ray,
					species,
					splitRms: a,
					normalizedRms: b,
					allowance: 2 * allowance[species],
					direction:
						a - b > 2 * allowance[species]
							? 'improves'
							: b - a > 2 * allowance[species]
								? 'worsens'
								: 'unresolved',
					localRegressions: group.filter(
						(r) =>
							Math.abs(r.normalizedError[species]) - Math.abs(r.splitError[species]) >
							2 * allowance[species],
					).length,
				});
			}
		const result = {
			rows,
			strata,
			broadSupport: strata.every((s) => s.direction === 'improves'),
			questions: [
				{
					question: 'Where does generated output belong?',
					decision: 'Use the experiment-owned output root; orchestration/review receipts use .codex-tmp.',
					reason: 'The explicit experiment boundary governs scientific artifacts.',
				},
				{
					question: 'Can prior density-factor scores establish this hypothesis?',
					decision: 'No; add a direct exact-query, species-resolved matched-rule reconstruction comparison.',
					reason: 'Earlier full recurrence changes lacked an independent local reconstruction target.',
				},
				{
					question: 'Which incoming solution is held fixed?',
					decision:
						'Actual physical finite S20/T40 L1 including direct-ground reflection, shared by all variants and reference.',
					reason: 'Changing incoming integration would confound reconstruction; this is not incoming-field convergence qualification.',
				},
				{
					question: 'Can A receive species errors?',
					decision: 'No; score its total only and use B/C for component attribution.',
					reason: 'Combined nonlinear interpolation has no unique separate species allocation.',
				},
				{
					question: 'Does success authorize full P2/N4 or production adoption?',
					decision: 'No; report conditional local support and register follow-up separately.',
					reason: 'H15 measures reconstruction only at its frozen finite-rule witnesses.',
				},
			],
			limits: 'Local J2 source units, not integrated sky radiance. Same finite F68/S20/T40 incoming dependencies; no physical all-order or libRadtran accuracy claim. Logical-node collapse parity is not a full GPU-node reconstruction proof.',
		};
		run.write('query-incoming.json', queryIncoming);
		run.write('results.json', result);
		const csv = [
			'ray,segment,fraction,altitude_m,reference_R,reference_M,A_total_error,B_R_error,B_M_error,C_R_error,C_M_error,B_cross,C_cross',
			...rows.map((r) =>
				[
					r.query.ray,
					r.query.segment,
					r.query.fraction,
					r.query.sample.altitude,
					r.reference.rayleigh,
					r.reference.mie,
					r.combinedError,
					r.splitError.rayleigh,
					r.splitError.mie,
					r.normalizedError.rayleigh,
					r.normalizedError.mie,
					r.splitCrossTerm,
					r.normalizedCrossTerm,
				].join(','),
			),
		].join('\n');
		run.write('comparison.csv', csv);
		guard();
		assert.ok(storage().retainedBytes - before.retainedBytes < 4 * 1024 ** 2 - 100000);
		const seal = run.finish('accepted', {
			stage: 'H15',
			deadlineHit,
			elapsedMilliseconds: Date.now() - started,
			broadSupport: result.broadSupport,
			queries: rows.length,
			sparseCoordinates: size,
			incomingLocations: incoming.size + queries.length,
			gpuAttempts: 0,
		});
		sealed = true;
		const verified = verifyRun(run.path),
			after = storage();
		assert.ok(after.retainedBytes - before.retainedBytes < 4 * 1024 ** 2);
		console.log(
			JSON.stringify({
				seal,
				verified,
				strata,
				storage: after,
				growthBytes: after.retainedBytes - before.retainedBytes,
				elapsedMilliseconds: Date.now() - started,
			}),
		);
	} catch (error) {
		if (sealed) console.error(JSON.stringify({run: run.path, postSealVerificationFailure: String(error)}));
		else {
			run.write('failure.json', {message: String(error), deadlineHit});
			console.log(
				JSON.stringify({
					seal: run.finish('failed', {
						stage: 'H15',
						deadlineHit,
						message: String(error),
						elapsedMilliseconds: Date.now() - started,
					}),
				}),
			);
		}
		process.exitCode = 1;
	}
}

if (process.argv[2] === 'worker') execute(Number(process.argv[3]));
else {
	const started = Date.now(),
		consumed = requireUnusedStage('h15-species', true),
		deadline = started + 600000 - consumed;
	assert.ok(deadline - Date.now() > 10000, 'H15 execution allocation is exhausted.');
	const worker = fork(fileURLToPath(import.meta.url), ['worker', String(deadline)], {stdio: 'inherit'});
	const watchdog = setTimeout(
		() => {
			worker.kill();
			process.exitCode = 1;
		},
		Math.max(1, deadline - Date.now()),
	);
	worker.on('exit', (code) => {
		clearTimeout(watchdog);
		process.exitCode = code ?? 1;
	});
}
