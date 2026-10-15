import assert from 'node:assert/strict';
import {createRun, identity, storage, verifyRun, readRepository} from '../io/files.mjs';
import {readParent, pinProductionClosure, requireUnusedStage} from './common.mjs';
import {miePhase} from '../horizon/diagnosis-transport.mjs';
import {ciePath, colorimetry} from '../horizon/diagnosis-color.mjs';
import {LocalSunCompactProfileSelection} from '../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactProfileSelection.js';
import {LocalSunCompactCpuAssembly} from '../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactCpuAssembly.js';
import {LocalSunCompactReconstruction} from '../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactReconstruction.js';
import {LocalSunShellFactCache} from '../../../src/algorithm32/implementation/local-sun/cache/LocalSunShellFactCache.js';

/** Stable exponential density column for the flat upward or horizontal segment.
 * @param {number} z @param {number} mu @param {number} length @param {number} height @returns {number}
 */
function column(z, mu, length, height) {
	const x = (length * mu) / height;
	return Math.exp(-z / height) * length * (Math.abs(x) < 1e-9 ? 1 - x / 2 + (x * x) / 6 : -Math.expm1(-x) / x);
}

/** Finite source distance, illumination direction, density, columns and scattering phases.
 * @param {HorizonTransportInput} input @param {readonly number[]} point @param {readonly number[]} direction
 * @returns {HypothesisFlatFacts}
 */
function facts(input, point, direction) {
	const delta = input.sourcePosition.map((v, i) => v - point[i]),
		distance = Math.hypot(...delta),
		mu = delta[2] / distance;
	assert.ok(mu > 0 && point[2] >= 0 && point[2] <= input.topAltitude + 1e-8);
	const cosine = direction.reduce((sum, v, i) => sum + (v * delta[i]) / distance, 0),
		length = Math.max(0, (input.topAltitude - point[2]) / mu);
	return {
		distance,
		mu,
		rho: [Math.exp(-point[2] / input.rayleighHeight), Math.exp(-point[2] / input.mieHeight)],
		columns: [column(point[2], mu, length, input.rayleighHeight), column(point[2], mu, length, input.mieHeight)],
		phases: [(3 * (1 + cosine * cosine)) / (16 * Math.PI), miePhase(cosine, input.g)],
	};
}

/** Sparse Float32 physical-J control and algebraically normalized N1 column-cache intervention.
 * Both use the production geometry-owned position support; only N1 is claimed.
 * @param {LocalSunCompactConstructionProfile} profile @param {HorizonTransportInput} input @param {()=>void} guard
 * @returns {HypothesisSparseCache}
 */
function createSparseCache(profile, input, guard) {
	const {geometry, atmosphere, lightSource} = profile.models,
		topology = profile.domains.topology;
	const assembly = LocalSunCompactCpuAssembly.fromCompactProfile(profile);
	const reconstruction = new LocalSunCompactReconstruction({geometry, atmosphere, topology});
	const shells = new LocalSunShellFactCache({
		sourceConfiguration: lightSource.configuration,
		sourceDistanceBounds: topology.sourceDistanceBounds,
	});
	/** @type {Map<string,HypothesisFlatNode>} */ const fields = new Map();
	/** @type {Map<number,number[]>} */ const columnCache = new Map();
	let nodeParityRelative = 0,
		splitParityRelative = 0,
		constantResidualMaximum = 0,
		samples = 0;
	/** Construct a genuinely separate Rayleigh/Mie diagnostic payload, checking its sum against the production CPU J1 owner.
	 * @param {number} positionIndex @param {number} directionIndex @returns {HypothesisFlatNode}
	 */
	function node(positionIndex, directionIndex) {
		const key = positionIndex + ':' + directionIndex;
		let record = fields.get(key);
		if (record) return record;
		guard();
		const position = geometry.resolveCompactLocalSunCacheNodePosition({topology, positionIndex});
		const direction = geometry.expressPhysicalScatteringCacheDirection({
			position,
			cacheDirection: profile.domains.outgoingDirections.unitVectors[directionIndex],
		});
		const f = facts(input, position.coordinates, direction),
			held = shells.resolveShell(f.distance).heldIncidentScale;
		const species = [new Float32Array(15), new Float32Array(15)];
		const production = assembly.samplePrimaryScatteringDensity({positionIndex, directionIndex});
		const combined = Float32Array.from(production.values);
		for (let c = 0; c < 15; c++) {
			const beam =
				input.sourceIrradiance[c] *
				held *
				Math.exp(-input.rayleigh[c] * f.columns[0] - input.mie[c] * f.columns[1]);
			const r = beam * input.rayleigh[c] * f.rho[0] * f.phases[0],
				m = beam * input.mie[c] * input.albedo * f.rho[1] * f.phases[1];
			nodeParityRelative = Math.max(
				nodeParityRelative,
				Math.abs(r + m - production.values[c]) / Math.max(1e-30, production.values[c]),
			);
			species[0][c] = r;
			species[1][c] = m;
		}
		record = {combined, species};
		fields.set(key, record);
		return record;
	}
	/** Cache geometric column residuals at the same physical topology nodes.
	 * Flat exponential columns obey C*mu/rho + H*exp((z-top)/H) = H.
	 * The invariant residual remains a real looked-up payload; restoration uses query geometry, density and finite-top tail.
	 * @param {number} positionIndex @returns {number[]}
	 */
	function normalizedColumns(positionIndex) {
		let value = columnCache.get(positionIndex);
		if (value) return value;
		const position = geometry.resolveCompactLocalSunCacheNodePosition({topology, positionIndex}).coordinates;
		const f = facts(input, position, [0, 0, 1]),
			heights = [input.rayleighHeight, input.mieHeight];
		value = heights.map(
			(h, s) => (f.columns[s] * f.mu) / f.rho[s] + h * Math.exp((position[2] - input.topAltitude) / h),
		);
		for (let s = 0; s < 2; s++)
			constantResidualMaximum = Math.max(constantResidualMaximum, Math.abs(value[s] - heights[s]));
		// Float32 payload precision is part of the new cached representation.
		value = Array.from(Float32Array.from(value));
		columnCache.set(positionIndex, value);
		return value;
	}
	return {
		sample(point, direction) {
			samples++;
			if (samples % 32 === 0) guard();
			const position = {
				coordinates: /** @type {SkyVector3} */ ([point[0], point[1], point[2]]),
				units: /** @type {const} */ ('meters'),
			};
			const taps = reconstruction.resolveStencil({position, physicalOutgoingDirection: direction});
			const raw = Array(15).fill(0),
				split = [Array(15).fill(0), Array(15).fill(0)],
				lookedColumns = [0, 0];
			for (const tap of taps) {
				const columns = normalizedColumns(tap.positionIndex);
				for (let s = 0; s < 2; s++) lookedColumns[s] += tap.positionWeight * columns[s];
				for (let d = 0; d < tap.directionStencil.indices.length; d++) {
					const value = node(tap.positionIndex, tap.directionStencil.indices[d]);
					for (let c = 0; c < 15; c++) {
						const w = tap.positionWeight * tap.directionStencil.weights[d] * tap.spectralScales[c];
						raw[c] += w * value.combined[c];
						for (let s = 0; s < 2; s++) split[s][c] += w * value.species[s][c];
					}
				}
			}
			const f = facts(input, point, direction),
				heights = [input.rayleighHeight, input.mieHeight];
			const restored = heights.map((h, s) =>
				Math.max(0, ((lookedColumns[s] - h * Math.exp((point[2] - input.topAltitude) / h)) * f.rho[s]) / f.mu),
			);
			const corrected = [Array(15).fill(0), Array(15).fill(0)];
			for (let c = 0; c < 15; c++) {
				const beam =
					input.sourceIrradiance[c] *
					(input.referenceDistance / f.distance) ** 2 *
					Math.exp(-input.rayleigh[c] * restored[0] - input.mie[c] * restored[1]);
				corrected[0][c] = beam * input.rayleigh[c] * f.rho[0] * f.phases[0];
				corrected[1][c] = beam * input.mie[c] * input.albedo * f.rho[1] * f.phases[1];
				splitParityRelative = Math.max(
					splitParityRelative,
					Math.abs(raw[c] - split[0][c] - split[1][c]) / Math.max(1e-30, raw[c]),
				);
			}
			return {raw, split, corrected};
		},
		report() {
			return {
				topologyIdentity: topology.id,
				profileIdentity: profile.contentHash,
				positionCount: topology.positionCount,
				visitedPhysicalNodes: columnCache.size,
				visitedDirectionalNodes: fields.size,
				samples,
				nodeParityRelative,
				splitParityRelative,
				constantResidualMaximum,
				rawPayloadBytes: fields.size * 15 * 4 * 3,
				correctedPayloadBytes: columnCache.size * 2 * 4,
				limit: 'Sparse CPU evaluation of the current physical-J representation, not a shader-bitwise replay. New N1-only invariant-column payload is geometry-specialized; exact query phase/density/dilution restored. No higher-order or production integration claim.',
			};
		},
	};
}

/** Integrate the frozen ray with Simpson weights and independently analytic view attenuation.
 * @param {HorizonTransportInput} input @param {HypothesisSparseCache} cache @param {number} count
 * @param {()=>void} guard @returns {HypothesisFlatSample}
 */
function integrate(input, cache, count, guard) {
	const raw = Array(15).fill(0),
		split = [Array(15).fill(0), Array(15).fill(0)],
		corrected = [Array(15).fill(0), Array(15).fill(0)];
	for (let i = 0; i <= count; i++) {
		if (i % 32 === 0) guard();
		const distance = (input.length * i) / count,
			point = [distance * input.direction[0], distance * input.direction[1], 5 + distance * input.direction[2]];
		const view = [
			column(5, input.direction[2], distance, input.rayleighHeight),
			column(5, input.direction[2], distance, input.mieHeight),
		];
		const value = cache.sample(
			point,
			/** @type {SkyVector3} */ ([input.direction[0], input.direction[1], input.direction[2]]),
		);
		const weight = ((i === 0 || i === count ? 1 : i % 2 ? 4 : 2) * input.length) / (3 * count);
		for (let c = 0; c < 15; c++) {
			const w = weight * Math.exp(-input.rayleigh[c] * view[0] - input.mie[c] * view[1]);
			raw[c] += w * value.raw[c];
			for (let s = 0; s < 2; s++) {
				split[s][c] += w * value.split[s][c];
				corrected[s][c] += w * value.corrected[s][c];
			}
		}
	}
	return {raw, split, corrected};
}

/** Execute H13 without a full cache allocation or GPU dependency; retain spectra and parity evidence only.
 * @returns {void}
 */
export function flatStage() {
	requireUnusedStage('h13-flat-cache');
	const started = Date.now(),
		before = storage();
	/** @type {DialFileIdentity[]} */ const parents = [];
	const prior = /** @type {SmallRayHorizonPacket} */ (readParent('00245-h4-path', 'path.json', parents));
	const observation = /** @type {HypothesisFlatObservation} */ (
		readParent('00239-horizon-stages', 'local-observation.json', parents)
	);
	const admission = /** @type {HypothesisAdmission} */ (readParent('00252-h10-audit', 'admission.json', parents));
	const deadline = started + admission.stageMilliseconds.H13;
	const productionPaths = [
		'src/algorithm32/implementation/local-sun/cache/LocalSunCompactProfileSelection.js',
		'src/algorithm32/implementation/local-sun/cache/LocalSunCompactCpuAssembly.js',
		'src/algorithm32/implementation/local-sun/cache/LocalSunCompactReconstruction.js',
		'src/algorithm32/implementation/local-sun/cache/LocalSunCompactCache.js',
	];
	pinProductionClosure(productionPaths, parents);
	parents.push(identity(ciePath));
	const run = createRun('h13-flat-cache', {
		parents,
		operation:
			'Sparse actual-topology Flat N1 physical-J control, independently authored species payload with summed-control parity, and new Float32 invariant-column cache with exact query restoration; fixed combined extinction, geometry and Native15 input.',
		parameters: {
			deadline,
			gpuAttempts: 0,
			reason: 'CPU sparse precomputation suffices for N1; no full field, app or GPU allocation is needed. This does not qualify GPU arithmetic.',
			prediction:
				'Corrected N1 matches reference to max(0.1 percent, combined empirical allowance); 3-degree R/B approaches .9892 and 20-degree stays blue.',
			equation:
				'Cache K_s=C_s*mu/exp(-z/H_s)+H_s*exp((z-top)/H_s). Lookup K_s at geometry-owned positions; restore C_s at query and use exact density, phase and dilution.',
			controls:
				'Original held-shell combined-J control and its independent species sum; no physical changes; Simpson 2048/4096 for both representations.',
		},
	});
	let lastGuard = 0;
	const guard = () => {
		assert.ok(Date.now() < deadline - 10000, 'H13 cleanup reserve reached.');
		if (Date.now() - lastGuard > 10000) {
			run.guard();
			lastGuard = Date.now();
		}
	};
	try {
		const profile = new LocalSunCompactProfileSelection().create({
			observation: observation.facts.state.observation,
			observerPosition: {coordinates: [0, 0, 5], units: 'meters'},
			viewRayLimit: {value: 1926774, units: 'meters'},
			maximumScatteringOrder: 1,
		});
		const actual = profile.models;
		/** @type {HypothesisFlatComparison[]} */ const rows = [];
		for (const row of prior.rows) {
			run.progress('flat', 'Sparse cache comparison at ' + row.elevationDegrees + ' degrees.');
			const input = /** @type {HorizonTransportInput} */ (row.inputs);
			assert.equal(input.sourcePosition.length, 3);
			input.sourcePosition.forEach((value, i) =>
				assert.ok(
					Number.isFinite(value) && value === actual.lightSource.configuration.position.coordinates[i],
					'Physical source coordinate differs; signed zero has the same geometric meaning.',
				),
			);
			assert.deepEqual(input.rayleigh, [...actual.atmosphere.seaLevelRayleighScattering.values]);
			assert.deepEqual(input.mie, [...actual.atmosphere.seaLevelMieExtinction.values]);
			assert.deepEqual(input.sourceIrradiance, [...profile.spectral.sourceIrradianceDensity.values]);
			const cache = createSparseCache(profile, input, guard);
			const low = integrate(input, cache, 2048, guard),
				high = integrate(input, cache, 4096, guard);
			const corrected = high.corrected[0].map((r, c) => r + high.corrected[1][c]);
			const correctedLow = low.corrected[0].map((r, c) => r + low.corrected[1][c]);
			const allowances = corrected.map((v, c) => 2 * Math.abs(v - correctedLow[c]) + 1e-12);
			const errors = corrected.map((v, c) => v - row.result.spectrum[c]);
			const passed = errors.every(
				(v, c) => Math.abs(v) <= Math.max(0.001 * row.result.spectrum[c], allowances[c]),
			);
			const report = cache.report();
			assert.ok(report.nodeParityRelative < 1e-10, 'Independent species payload disagrees with CPU J1 control.');
			assert.ok(report.splitParityRelative < 2e-7, 'Float32 summed-control parity failed.');
			rows.push({
				elevationDegrees: row.elevationDegrees,
				inputs: input,
				raw: high.raw,
				rawLow: low.raw,
				rawSpecies: high.split,
				corrected,
				correctedSpecies: high.corrected,
				correctedLow,
				reference: row.result.spectrum,
				referenceSpecies: [row.result.rayleigh, row.result.mie],
				signedErrors: errors,
				comparisonAllowances: allowances,
				passed,
				rawColor: colorimetry(high.raw, 'bin-integrated'),
				correctedColor: colorimetry(corrected, 'bin-integrated'),
				referenceColor: colorimetry(row.result.spectrum, 'bin-integrated'),
				cache: report,
			});
		}
		run.write(
			'flat.json',
			{rows, elapsedMilliseconds: Date.now() - started},
			{
				parents,
				operation:
					'Composite Simpson outer view at 2048/4096 with exact analytic view extinction; raw cached J and corrected cached column residual evaluated on the identical rays; retain additive species, parity and convergence guards.',
			},
		);
		assert.ok(storage().retainedBytes - before.retainedBytes < 4 * 1024 ** 2 - 200000);
		const passed = rows.every((r) => r.passed);
		for (const parent of parents) readRepository(parent.path, parent);
		const seal = run.finish(passed ? 'accepted' : 'rejected', {
			stage: 'H13',
			passed,
			gpuAttempts: 0,
			elapsedMilliseconds: Date.now() - started,
		});
		console.log(JSON.stringify({seal, verified: verifyRun(run.path), elapsedMilliseconds: Date.now() - started}));
	} catch (error) {
		run.write('failure.json', {message: String(error)});
		console.log(
			JSON.stringify({
				seal: run.finish('failed', {
					stage: 'H13',
					message: String(error),
					elapsedMilliseconds: Date.now() - started,
				}),
			}),
		);
		process.exitCode = 1;
	}
}

/** Focused pre-execution happy-path proof at one off-witness physical point; no ray integration or scientific scoring.
 * @returns {HypothesisFlatCacheReport} Payload sum and invariant-column facts.
 */
export function flatPayloadProof() {
	/** @type {DialFileIdentity[]} */ const parents = [];
	const prior = /** @type {SmallRayHorizonPacket} */ (readParent('00245-h4-path', 'path.json', parents));
	const observation = /** @type {HypothesisFlatObservation} */ (
		readParent('00239-horizon-stages', 'local-observation.json', parents)
	);
	const profile = new LocalSunCompactProfileSelection().create({
		observation: observation.facts.state.observation,
		observerPosition: {coordinates: [0, 0, 5], units: 'meters'},
		viewRayLimit: {value: 1926774, units: 'meters'},
		maximumScatteringOrder: 1,
	});
	const input = /** @type {HorizonTransportInput} */ (prior.rows[0].inputs);
	input.sourcePosition.forEach((value, i) =>
		assert.ok(value === profile.models.lightSource.configuration.position.coordinates[i]),
	);
	assert.ok(0 === -0, 'Geometric coordinates identify signed zero.');
	const cache = createSparseCache(profile, input, () => {});
	const result = cache.sample([100000, 10000, 1000], [0, 1, 0]);
	assert.ok(result.raw.every((v) => Number.isFinite(v) && v > 0));
	const report = cache.report();
	assert.ok(
		report.nodeParityRelative < 1e-10 && report.splitParityRelative < 2e-7 && report.constantResidualMaximum < 1e-8,
	);
	return report;
}
