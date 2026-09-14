import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {freemem} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {loadInputs} from '../../execution.mjs';
import {
	checkedAbsolute,
	createRun,
	identity,
	readRepository,
	sha256,
	sourceIdentities,
	storage,
	verifyRun,
} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {readPhysicalFirst} from '../ladder/physical/read.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {globalQuadratureProof} from '../reference/physical/global-proof.mjs';
import {physicalReferencePolicy} from '../reference/physical/policy.mjs';
import {evaluateVolumeFirstOrder} from './index.mjs';
import {evaluateDirectGroundLimit} from './boundary.mjs';
import {volumeWitnesses, assessVolumeWitnesses, compareVolumeStrategies} from './witnesses.mjs';
import {volumeReferenceProof} from './proof.mjs';

const allocatedBytes = 4 * 1024 ** 2,
	terminalReserveBytes = 768 * 1024,
	reportReserveBytes = 512 * 1024;
const maximumJobMilliseconds = 60 * 60 * 1000,
	finalizationReserveMilliseconds = 60000;
const extensionId = 'compensation-attribution-v1';

/** Verify the actual original registered Node bytes and version without persisting them.
 * @param {DialContinuationToolIdentity} expected - Authenticated C0 tool identity.
 * @returns {Promise<void>} Rejects changed executable identity.
 */
async function authenticateNode(expected) {
	assert.equal(checkedAbsolute(process.execPath), expected.path);
	assert.equal(process.version, expected.version);
	const hash = createHash('sha256');
	let byteLength = 0;
	for await (const chunk of createReadStream(expected.path)) {
		hash.update(chunk);
		byteLength += chunk.length;
	}
	assert.equal(byteLength, expected.byteLength);
	assert.equal(hash.digest('hex'), expected.sha256);
}

/** Run a compact predeclared volume-L1 boundary pilot in a new immutable C5 record.
 * Execution acceptance does not imply reference admission or prediction success.
 * The original C5 qualification skip remains immutable; this is new reference work.
 * @param {string} registrationRun - Exact original C0 registration run.
 * @param {string} planPath - Exact current attribution-plan owner.
 * @param {SkyPhysicalOuterStrategy} [outerStrategy] - Local or global allocation of unchanged outer tolerances.
 * @returns {Promise<SkyVolumeRunResult>} Sealed pilot evidence and explicit scientific outcomes.
 */
export async function runVolumeWitnesses(registrationRun, planPath, outerStrategy = 'local') {
	assert.ok(['local', 'global'].includes(outerStrategy));
	const extensionStage = outerStrategy === 'global' ? 'volume-global-witnesses' : 'volume-witnesses';
	assert.equal(planPath, 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/attribution-plan.md');
	const started = Date.now(),
		registration = readRegistration(registrationRun);
	const admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	await authenticateNode(registration.record.host.node);
	const planBytes = readRepository(planPath),
		plan = identity(planPath, planBytes);
	assert.ok(
		planBytes.toString().includes(extensionId) && planBytes.toString().includes(extensionStage),
		'Plan must explicitly preregister the volume-witness stage.',
	);
	const original = readPhysicalFirst(registration);
	readRepository(registration.record.inputs.path, registration.record.inputs);
	const spec = loadInputs().native48.transportSpec,
		channels = [0, 8],
		witnesses = volumeWitnesses(registration, spec);
	const previousInput =
		outerStrategy === 'global'
			? acceptedMechanismInput('tmp/experiments/sky-accuracy-dials/runs/00153-volume-l1-pilot')
			: null;
	const previousArtifact = previousInput ? mechanismArtifact(previousInput, 'reference.json') : null;
	/** @type {SkyVolumePilotRow[]|null} */ let previousRows = null;
	if (previousInput) {
		assert.equal(previousInput.seal.sha256, '3558d7b1ebe4c65794e5ce1e04c8df37d687d6fb5e632415a3563b8b3f0f5e73');
		const previous = JSON.parse(readRepository(previousArtifact.path, previousArtifact).toString());
		assert.equal(previous.schemaId, 'sky-volume-witness-reference-v1');
		assert.equal(previous.continuationRegistration, registration.run);
		assert.equal(previous.extensionStage, 'volume-witnesses');
		assert.deepEqual(previous.witnesses, witnesses);
		assert.deepEqual(previous.channels, channels);
		previousRows = previous.rows;
	}
	const sources = sourceIdentities();
	const parents = [
		registration.seal,
		registration.record.inputs,
		plan,
		...original.parents,
		...(previousInput ? [previousInput.seal, previousArtifact] : []),
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		...(admission.usage.invalidEvidence ?? []).map((record) => record.seal),
	];
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Evaluate eight independently integrated incident first-order rays, keeping atmospheric scattering and direct Lambertian ground reflection separate; compare original surface reference parity and the positive-height ground limit. No incoming angular integration, J2 viewing-ray solution or Kider scoring is performed.',
		parameters: {
			extensionId,
			extensionStage,
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C5',
			caseId: 'volume-l1-witnesses',
			admission,
			plan,
			originalRun: original.run,
			channels,
			witnesses,
			numericalPolicy: physicalReferencePolicy('simpson-expanded-medium'),
			outerStrategy,
			strategyComparisonParent: previousInput?.seal ?? null,
			node: registration.record.host.node,
			sourceIdentities: sources,
			maximumJobMilliseconds,
			finalizationReserveMilliseconds,
			allocationMeaning:
				'New compensation attribution reference work; no reopening or success claim for the original skipped C5 accuracy qualification.',
			predictions: [
				'Original 09:30/12:30 surface atmospheric L1 agrees with pinned 00109 means within joint empirical reference allowances plus a 1e-12 W m^-2 sr^-1 nm^-1 arithmetic floor.',
				'All four top/escaping rays have exactly zero direct-ground contribution in both formulations.',
				'At 09:30 local mu = -0.5, absolute discrepancy from the independent fixed-ground Lambertian direct limit does not increase for each decreasing height 1000 m -> 100 m -> 1 m -> 1 mm, within both witness allowances plus twice the limit allowance and a 1e-12 W m^-2 sr^-1 nm^-1 floor.',
				'At 1 mm the direct-ground component differs from the fixed-ground limit by at most 1e-5 * abs(limit) + 1e-12 W m^-2 sr^-1 nm^-1 plus their joint empirical allowance.',
			],
			pilotPolicy:
				'At most eight witnesses plus the fixed-ground source-column limit. After each completed witness require4*max(1,slowest observed witness milliseconds)*remaining count to fit the scientific deadline. Keep unresolved completed witnesses and continue independent geometry branches if resources permit; do not expand into a nested J2 solve.',
			boundary:
				'Common exponential atmosphere and spectral physics; zero direct solar delta beam in diffuse L1, direct Lambertian ground only, no diffuse recursion. Exact-ground inward-zero recurrence is unchanged and is not replaced by a positive-height limit.',
		},
	};
	const before = storage(),
		run = createRun(outerStrategy === 'global' ? 'volume-l1-global' : 'volume-l1-pilot', recipe),
		definition = identity(`${run.path}/definition.json`);
	const deadline =
		started + Math.min(maximumJobMilliseconds, admission.timeoutMilliseconds) - finalizationReserveMilliseconds;
	let writtenBytes = definition.byteLength,
		finalizing = false,
		lastPulse = 0,
		lastMemory = 0;
	let message = 'Preparing bounded independent volume-first-order witnesses.';
	let stopReason = /** @type {string|null} */ (null),
		failure = /** @type {Error|null} */ (null);
	let limit = /** @type {SkyVolumeGroundLimit|null} */ (null),
		limitElapsedMilliseconds = /** @type {number|null} */ (null);
	const resourceSignal = new Error('Volume witness scientific deadline or host-headroom limit reached.');
	/** @type {SkyVolumePilotRow[]} */ const rows = [];
	/** @type {SkyJ2Memory[]} */ const memory = [];
	/** Observe actual CPU memory and flush heartbeat before thirty seconds.
	 * @param {boolean} [force] - Force boundary progress and resource observation.
	 * @returns {void} Throws the same cooperative resource signal on exhaustion.
	 */
	function guard(force = false) {
		const now = Date.now();
		if (now >= deadline) throw resourceSignal;
		if (!force && now - lastMemory < 1000) return;
		lastMemory = now;
		const availableBytes = freemem(),
			residentSetBytes = process.memoryUsage().rss;
		if (availableBytes < registration.budgets.hostHeadroomBytes) throw resourceSignal;
		if (force || now - lastPulse >= 20000) {
			const current = run.guard();
			assert.ok(current.retainedBytes - before.retainedBytes < allocatedBytes - terminalReserveBytes);
			assert.ok(
				current.retainedBytes - registration.initialStorage.retainedBytes <
					registration.budgets.newRetainedBytes,
			);
			run.progress('volume-witness', message, rows.length, witnesses.length);
			memory.push({elapsedMilliseconds: now - started, residentSetBytes, availableBytes});
			lastPulse = now;
		}
	}
	/** Bound each artifact and preserve a protected terminal reserve.
	 * @param {string} name - Exclusive new-run artifact basename.
	 * @param {unknown} value - Binary bytes or compact JSON value.
	 * @param {DialDerivation} [derivation] - Specific reproducible parent operation.
	 * @returns {DialFileIdentity} Exact retained artifact identity.
	 */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: `Derive ${name} from the frozen volume-witness recipe and actual measured component/method outputs.`,
		},
	) {
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`);
		assert.ok(
			writtenBytes + bytes.length < allocatedBytes - terminalReserveBytes - (finalizing ? 0 : reportReserveBytes),
		);
		const artifact = run.write(name, bytes, derivation);
		writtenBytes += artifact.byteLength;
		return artifact;
	}
	try {
		guard(true);
		write('attribution-plan.md', planBytes, {
			parents: [plan],
			operation: 'Preserve exact plan and preregistered pilot criteria before physical evaluation.',
		});
		const sourceBytes = Buffer.from(
			JSON.stringify(
				sources.map((source) => ({...source, base64: readRepository(source.path, source).toString('base64')})),
			),
		);
		write('sources.json.gz', gzipSync(sourceBytes, {level: 9}), {
			parents: sources,
			operation: 'Preserve exact authored bytes as base64 JSON compressed using Node gzip level 9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: sourceBytes.length,
				uncompressedSha256: sha256(sourceBytes),
			},
		});
		write('proof.json', volumeReferenceProof());
		if (outerStrategy === 'global') write('global-proof.json', globalQuadratureProof());
		message = 'Resolving the independent direct Lambertian ground limit.';
		guard(true);
		const limitStarted = performance.now();
		limit = evaluateDirectGroundLimit(spec, witnesses[0].origin, channels, {
			profile: 'simpson-expanded-medium',
			guard,
		});
		limitElapsedMilliseconds = Math.max(0, performance.now() - limitStarted);
		write('ground-limit.json', limit);
		for (const witness of witnesses) {
			message = `Evaluating ${witness.id}, with atmospheric and direct-ground components separated.`;
			guard(true);
			const witnessStarted = performance.now();
			const result = evaluateVolumeFirstOrder(spec, witness.origin, witness.direction, channels, {
				profile: 'simpson-expanded-medium',
				outerStrategy,
				guard,
			});
			const row = {id: witness.id, elapsedMilliseconds: Math.max(0, performance.now() - witnessStarted), result};
			rows.push(row);
			write(`witness-${String(rows.length).padStart(2, '0')}.json`, row);
			const remaining = witnesses.length - rows.length;
			const projection = 4 * Math.max(1, ...rows.map((value) => value.elapsedMilliseconds)) * remaining;
			if (remaining > 0 && projection > Math.max(0, deadline - Date.now())) {
				stopReason =
					'Conservative four-times slowest-witness projection exceeds remaining scientific deadline.';
				break;
			}
		}
	} catch (error) {
		if (error === resourceSignal) stopReason = resourceSignal.message;
		else failure = error instanceof Error ? error : new Error(String(error));
	}
	const checks = assessVolumeWitnesses(rows, original.record, limit, channels);
	if (previousRows) checks.push(...compareVolumeStrategies(rows, previousRows, channels));
	const matrixComplete = !failure && !stopReason && rows.length === witnesses.length;
	const predictionsPassed = matrixComplete && checks.every((check) => check.state === 'passed');
	finalizing = true;
	try {
		run.progress(
			'volume-finalize',
			'Retaining independent method allowances, original parity and boundary-limit outcomes.',
			rows.length,
			witnesses.length,
		);
		write('reference.json', {
			schemaId: 'sky-volume-witness-reference-v1',
			units: 'W m^-2 sr^-1 nm^-1',
			extensionId,
			extensionStage,
			continuationRegistration: registration.run,
			outerStrategy,
			plan,
			originalRun: original.run,
			channels,
			witnesses,
			rows,
			groundLimit: limit,
			checks,
			matrixComplete,
			predictionsPassed,
			stopReason,
			limitations: [
				'Eight selected incident rays and two channels only; this is not an incoming angular integral, a J2 viewing-ray reference, a Kider score or a complete multiple-scattering reference.',
				'All finite allowances remain empirical and do not establish common geometry/physics correctness. Positive-height direct reflection and the exact-ground inward-zero recurrence are distinct boundaries.',
				'Missing or interrupted witnesses remain absent and every dependent predicate is unresolved; partial work has no fabricated radiance or allowance.',
			],
		});
		write('costs.json', {
			limitElapsedMilliseconds,
			returnedWitnessCount: rows.length,
			expectedWitnessCount: witnesses.length,
			perWitnessMilliseconds: rows.map((row) => ({id: row.id, elapsedMilliseconds: row.elapsedMilliseconds})),
			mediumEvaluations:
				rows.reduce(
					(sum, row) =>
						sum + row.result.methods.reduce((value, method) => value + method.mediumEvaluations, 0),
					0,
				) + (limit?.methods.reduce((sum, method) => sum + method.mediumEvaluations, 0) ?? 0),
			outerEvaluations: rows.reduce(
				(sum, row) => sum + row.result.methods.reduce((value, method) => value + method.outerEvaluations, 0),
				0,
			),
			memory,
			memoryMetric: 'Node resident set, not private bytes',
			maximumResidentSetBytes: Math.max(0, ...memory.map((value) => value.residentSetBytes)),
			partialCountsUnavailable: stopReason === resourceSignal.message,
			scratchBytes: 0,
		});
		write('execution.json', {
			matrixComplete,
			predictionsPassed,
			stopReason,
			failure: failure ? {message: failure.message, stack: failure.stack} : null,
			gpuJobsExecuted: 0,
			meaning:
				'Accepted execution preserves all failed/unresolved scientific predicates; no Kider or whole-solver numerical qualification is implied.',
		});
		for (const parent of parents) readRepository(parent.path, parent);
		for (const source of sources) readRepository(source.path, source);
		await authenticateNode(registration.record.host.node);
	} catch (error) {
		failure ??= error instanceof Error ? error : new Error(String(error));
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		caseId: 'volume-l1-witnesses',
		extensionId,
		extensionStage,
		matrixComplete,
		predictionsPassed,
		stopReason,
		failure: failure?.message ?? null,
		jobElapsedMilliseconds: Date.now() - started,
		allocatedBytes,
		gpuJobsExecuted: 0,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const terminal = JSON.parse(readRepository(seal.path, seal).toString());
	assert.ok(
		seal.byteLength + terminal.artifacts.reduce((sum, artifact) => sum + artifact.byteLength, 0) <= allocatedBytes,
	);
	if (terminal.state !== 'accepted')
		throw new Error(
			`Volume witness infrastructure failed in ${run.path}: ${failure?.message ?? 'source identity change'}`,
		);
	return {run: run.path, seal, matrixComplete, predictionsPassed, stopReason};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const [command, ...args] = process.argv.slice(2);
	if (command === 'proof') {
		assert.equal(args.length, 0);
		console.log(JSON.stringify(volumeReferenceProof(), null, 2));
	} else {
		assert.ok(
			['pilot', 'pilot-global'].includes(command),
			'Use proof, pilot or pilot-global <C0-run> <attribution-plan>.',
		);
		assert.equal(args.length, 2);
		console.log(
			JSON.stringify(
				await runVolumeWitnesses(args[0], args[1], command === 'pilot-global' ? 'global' : 'local'),
				null,
				2,
			),
		);
	}
}
