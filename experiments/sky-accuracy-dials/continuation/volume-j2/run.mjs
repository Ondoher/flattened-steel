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
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {incidentWorld} from '../j2/angular.mjs';
import {evaluateVolumeFirstOrder} from '../volume-reference/index.mjs';
import {evaluateDirectGroundLimit} from '../volume-reference/boundary.mjs';
import {volumeJ2Groups, sumVolumeJ2} from './angular.mjs';
import {volumeJ2Cases, readVolumeJ2Parents, assessVolumeJ2Factorial, volumeJ2FactorialProof} from './factorial.mjs';
import {volumeJ2Proof} from './proof.mjs';
import {assessVolumeJ2} from './assess.mjs';

const allocatedBytes = 4 * 1024 ** 2,
	terminalReserveBytes = 768 * 1024;
const extensionId = 'compensation-attribution-v1';

/** Authenticate the original C0 Node binary without retaining its contents.
 * @param {DialContinuationToolIdentity} expected - Original pinned execution tool.
 * @returns {Promise<void>} Rejects any executable drift.
 */
async function authenticateNode(expected) {
	assert.equal(checkedAbsolute(process.execPath), expected.path);
	assert.equal(process.version, expected.version);
	const hash = createHash('sha256');
	let bytes = 0;
	for await (const chunk of createReadStream(expected.path)) {
		hash.update(chunk);
		bytes += chunk.length;
	}
	assert.equal(bytes, expected.byteLength);
	assert.equal(hash.digest('hex'), expected.sha256);
}

/** Execute the registered positive-height second-order component pilot in a new record.
 * Retains empirical incident allowances separately from unqualified angular accuracy.
 * @param {string} registrationRun - Exact original C0 registration.
 * @param {string} planPath - Governing prospective attribution plan.
 * @param {SkyVolumeJ2Stage} [stage] - Initial pilot or registered angular factorial.
 * @returns {Promise<SkyVolumeJ2RunResult>} Sealed execution and independent scientific outcomes.
 */
export async function runVolumeJ2Pilot(registrationRun, planPath, stage = 'pilot') {
	assert.ok(['pilot', 'angular'].includes(stage));
	const extensionStage = stage === 'pilot' ? 'volume-j2-pilot' : 'volume-j2-angular';
	const started = Date.now(),
		registration = readRegistration(registrationRun);
	assert.equal(planPath, 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/attribution-plan.md');
	const admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	await authenticateNode(registration.record.host.node);
	const planBytes = readRepository(planPath),
		plan = identity(planPath, planBytes);
	assert.ok(planBytes.toString().includes(extensionId) && planBytes.toString().includes(extensionStage));
	readRepository(registration.record.inputs.path, registration.record.inputs);
	const spec = loadInputs().native48.transportSpec,
		channels = [0, 8];
	const cases = volumeJ2Cases(registration, spec, stage),
		targets = cases.map((item) => item.target);
	const groups = cases.map((item) =>
		volumeJ2Groups(spec.planet.bottomRadiusMeters, item.target.origin, item.radialCount, item.azimuthCount),
	);
	const mirrorIndices = cases.map((item) => [0, (item.radialCount * item.azimuthCount) / 2]);
	const expectedCount = groups.reduce((sum, values) => sum + values.length + 2, 0);
	assert.equal(expectedCount, stage === 'pilot' ? 1552 : 9252);
	const comparison = stage === 'angular' ? readVolumeJ2Parents(registration) : null;
	const original = acceptedMechanismInput('tmp/experiments/sky-accuracy-dials/runs/00156-volume-l1-global');
	assert.equal(original.seal.sha256, '0b57a1cfc14f910d37be83030d9bd189b240800c30cebf27c268537f03fb28cd');
	const originalArtifact = mechanismArtifact(original, 'reference.json');
	const originalRecord = JSON.parse(readRepository(originalArtifact.path, originalArtifact).toString());
	assert.ok(originalRecord.matrixComplete && originalRecord.predictionsPassed);
	const sources = sourceIdentities();
	const parents = [
		registration.seal,
		registration.record.inputs,
		plan,
		original.seal,
		originalArtifact,
		...(comparison?.identities ?? []),
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		...(admission.usage.invalidEvidence ?? []).map((record) => record.seal),
	];
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Integrate independent atmospheric and direct-ground L1 over three incoming angular intervals at declared positive-height viewing-ray locations, separating final Rayleigh and Mie scattering. Check source-plane symmetry, the analytic Rayleigh ground limit and any preregistered angular factorial; no final-view integral or Kider score.',
		parameters: {
			extensionId,
			extensionStage,
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C5',
			caseId: extensionStage,
			admission,
			plan,
			channels,
			targets,
			cases,
			angularConstruction:
				'Positive Gauss nodes mapped separately to [-1,-sqrt((r-R)*(r+R))/r], that horizon to zero, and zero to one; full-circle midpoint azimuths represented by source-plane mirrors with separate phase weights. Exact evaluated vectors are retained in incident-nodes.json.gz.',
			expectedCount,
			outerStrategy: 'global',
			physicalProfile: 'simpson-expanded-medium',
			node: registration.record.host.node,
			sourceIdentities: sources,
			maximumJobMilliseconds: 3600000,
			finalizationReserveMilliseconds: 60000,
			prediction:
				'All component and mirror admissions pass; nonnegative components sum to the separately accumulated total; 1mm Rayleigh ground agrees with beta_R(0)*B0/2 within 0.1% plus joint incident/limit allowances and 1e-15 density floor. The angular stage additionally tests the plan-frozen 25% additive-response norm and 0.05% approximate near-surface atmosphere agreement, with explicit propagated allowances and unresolved-effect gates.',
			pilotPolicy:
				stage === 'pilot'
					? 'Require twice the slowest completed incident duration times remaining count to fit the scientific deadline.'
					: 'After each complete position, require twice the largest observed whole-position milliseconds per incident times remaining count to fit the unchanged scientific deadline. The per-ray cooperative deadline/headroom guard remains active.',
		},
	};
	const before = storage(),
		run = createRun(stage === 'pilot' ? 'volume-j2-pilot' : 'volume-j2-ang', recipe),
		definition = identity(`${run.path}/definition.json`);
	const deadline = started + Math.min(3600000, admission.timeoutMilliseconds) - 60000;
	/** @type {SkyVolumeJ2Node[]} */ const nodes = [];
	/** @type {SkyVolumeGroundLimit[]} */ const limits = [];
	/** @type {SkyJ2Memory[]} */ const memory = [];
	/** @type {SkyVolumeResult[]} */ const unresolvedWitnesses = [];
	let slowestPositionPerIncident = 0;
	let lastPulse = 0,
		lastMemory = 0,
		writtenBytes = definition.byteLength,
		slowest = 0;
	let message = 'Preparing positive-height second-order pilot.';
	let stopReason = /** @type {string|null} */ (null),
		failure = /** @type {Error|null} */ (null);
	const resourceSignal = new Error(
		'Volume-J2 pilot deadline, conservative projection, or host-headroom limit reached.',
	);
	/** Cooperatively enforce resources and emit durable progress within twenty seconds.
	 * @param {boolean} [force] - Force observation at scientific boundaries.
	 * @returns {void} Throws the same interruption identity for honest finalization.
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
			run.progress('volume-j2', message, nodes.length, expectedCount);
			memory.push({elapsedMilliseconds: now - started, availableBytes, residentSetBytes});
			lastPulse = now;
		}
	}
	/** Write an exclusive compact artifact while preserving terminal capacity.
	 * @param {string} name - New artifact basename.
	 * @param {unknown} value - JSON or explicitly supplied binary data.
	 * @param {DialDerivation} [derivation] - Specific derivation when different from the frozen recipe.
	 * @returns {DialFileIdentity} Exact output identity.
	 */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: `Derive ${name} from the frozen volume-J2 recipe and actual incident evaluations.`,
		},
	) {
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`);
		assert.ok(writtenBytes + bytes.length < allocatedBytes - terminalReserveBytes);
		const artifact = run.write(name, bytes, derivation);
		writtenBytes += artifact.byteLength;
		return artifact;
	}
	try {
		guard(true);
		write('attribution-plan.md', planBytes, {
			parents: [plan],
			operation: 'Preserve the prospective matrix and predictions before physical evaluation.',
		});
		const sourceBytes = Buffer.from(
			JSON.stringify(
				sources.map((source) => ({...source, base64: readRepository(source.path, source).toString('base64')})),
			),
		);
		write('sources.json.gz', gzipSync(sourceBytes, {level: 9}), {
			parents: sources,
			operation: 'Encode exact source bytes as base64 JSON, then Node gzip level 9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: sourceBytes.length,
				uncompressedSha256: sha256(sourceBytes),
			},
		});
		write('proof.json', volumeJ2Proof(spec));
		if (comparison) write('factorial-proof.json', volumeJ2FactorialProof(comparison, cases));
		for (const target of targets.filter((value) => value.heightMeters === 0.001)) {
			if (
				limits.some((value) =>
					value.origin.every((coordinate, axis) => coordinate === target.surfaceOrigin[axis]),
				)
			)
				continue;
			message = `Resolving independent ground limit for ${target.probeId}.`;
			guard(true);
			limits.push(
				evaluateDirectGroundLimit(spec, target.surfaceOrigin, channels, {
					profile: 'simpson-expanded-medium',
					guard,
				}),
			);
		}
		for (const [targetIndex, target] of targets.entries()) {
			const targetStarted = performance.now();
			message = `Evaluating ${target.id}, keeping ground/atmosphere and Rayleigh/Mie separate.`;
			guard(true);
			const tasks = groups[targetIndex].map((group, index) => ({
				index,
				group,
				mirrorOf: /** @type {number|null} */ (null),
			}));
			for (const index of mirrorIndices[targetIndex])
				tasks.push({index, group: groups[targetIndex][index], mirrorOf: index});
			for (const task of tasks) {
				guard();
				const direction = incidentWorld(
					target.origin,
					task.mirrorOf === null ? task.group.incident.direction : task.group.incident.mirror,
				);
				const evaluationStarted = performance.now();
				const result = evaluateVolumeFirstOrder(spec, target.origin, direction, channels, {
					profile: 'simpson-expanded-medium',
					outerStrategy: 'global',
					guard,
				});
				const elapsedMilliseconds = Math.max(0, performance.now() - evaluationStarted);
				assert.equal(result.geometry.branch, task.group.branch);
				nodes.push({
					targetId: target.id,
					index: task.index,
					mirrorOf: task.mirrorOf,
					direction,
					channels: result.channels,
					branch: result.geometry.branch,
					elapsedMilliseconds,
					mediumEvaluations: result.methods.reduce((sum, method) => sum + method.mediumEvaluations, 0),
					outerEvaluations: result.methods.reduce((sum, method) => sum + method.outerEvaluations, 0),
				});
				if (!result.resolved && unresolvedWitnesses.length < 8) unresolvedWitnesses.push(result);
				slowest = Math.max(slowest, elapsedMilliseconds);
				if (stage === 'pilot' && 2 * slowest * (expectedCount - nodes.length) > deadline - Date.now())
					throw resourceSignal;
			}
			slowestPositionPerIncident = Math.max(
				slowestPositionPerIncident,
				(performance.now() - targetStarted) / tasks.length,
			);
			if (
				stage === 'angular' &&
				2 * slowestPositionPerIncident * (expectedCount - nodes.length) > deadline - Date.now()
			)
				throw resourceSignal;
		}
	} catch (error) {
		if (error === resourceSignal) stopReason = resourceSignal.message;
		else failure = error instanceof Error ? error : new Error(String(error));
	}
	const rows = targets.map((target, index) =>
		sumVolumeJ2(
			spec,
			target,
			channels,
			groups[index],
			nodes.filter((node) => node.targetId === target.id && node.mirrorOf === null),
		),
	);
	const checks = assessVolumeJ2(spec, targets, channels, nodes, limits, rows, mirrorIndices);
	const factorial = comparison ? assessVolumeJ2Factorial(comparison, cases, rows) : null;
	if (factorial) checks.push(...factorial.checks);
	const matrixComplete = !failure && !stopReason && nodes.length === expectedCount;
	const predictionsPassed = matrixComplete && checks.every((check) => check.state === 'passed');
	try {
		run.progress(
			'volume-j2-finalize',
			'Retaining component, symmetry, ground-limit and resource outcomes.',
			nodes.length,
			expectedCount,
		);
		const nodeBytes = Buffer.from(JSON.stringify(nodes));
		write('incident-nodes.json.gz', gzipSync(nodeBytes, {level: 9}), {
			parents: [definition],
			operation:
				'Retain exact component estimates and allowances in evaluation order, JSON encoded then Node gzip level 9.',
			parameters: {uncompressedByteLength: nodeBytes.length, uncompressedSha256: sha256(nodeBytes)},
		});
		write('unresolved-witnesses.json', unresolvedWitnesses);
		write('reference.json', {
			schemaId: stage === 'pilot' ? 'sky-volume-j2-pilot-v1' : 'sky-volume-j2-angular-v1',
			units: 'W m^-3 sr^-1 nm^-1',
			extensionId,
			extensionStage,
			continuationRegistration: registration.run,
			plan,
			channels,
			targets,
			rows,
			cases,
			factorial,
			limits,
			checks,
			matrixComplete,
			predictionsPassed,
			stopReason,
			limitations: [
				'Incident allowances exclude angular quadrature error; a passed pilot is not an angular reference or a final viewing-ray solution.',
				'The ground-limit predicate is Rayleigh-only and compares positive-height physics with its independent boundary limit; historical exact-ground inward-zero cache convention is unchanged.',
				'No Kider score, full N4 solver, missing-order or physical-model accuracy is qualified.',
			],
		});
		write('costs.json', {
			expectedCount,
			returnedCount: nodes.length,
			slowestIncidentMilliseconds: slowest,
			slowestPositionMillisecondsPerIncident: slowestPositionPerIncident,
			mediumEvaluations:
				nodes.reduce((sum, node) => sum + node.mediumEvaluations, 0) +
				limits.reduce(
					(sum, limit) => sum + limit.methods.reduce((value, method) => value + method.mediumEvaluations, 0),
					0,
				),
			outerEvaluations: nodes.reduce((sum, node) => sum + node.outerEvaluations, 0),
			memory,
			maximumResidentSetBytes: Math.max(0, ...memory.map((row) => row.residentSetBytes)),
			memoryMetric: 'Node resident set, not private bytes',
			partialCountsUnavailable: stopReason !== null,
			scratchBytes: 0,
		});
		write('execution.json', {
			matrixComplete,
			predictionsPassed,
			stopReason,
			failure: failure ? {message: failure.message, stack: failure.stack} : null,
			gpuJobsExecuted: 0,
		});
		for (const parent of parents) readRepository(parent.path, parent);
		for (const source of sources) readRepository(source.path, source);
		await authenticateNode(registration.record.host.node);
	} catch (error) {
		failure ??= error instanceof Error ? error : new Error(String(error));
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		extensionId,
		extensionStage,
		caseId: extensionStage,
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
		throw new Error(`Volume-J2 infrastructure failed in ${run.path}: ${failure?.message}`);
	return {run: run.path, seal, matrixComplete, predictionsPassed, stopReason};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const [command, ...args] = process.argv.slice(2);
	if (command === 'proof') {
		assert.equal(args.length, 0);
		console.log(JSON.stringify(volumeJ2Proof(loadInputs().native48.transportSpec), null, 2));
	} else {
		assert.ok(['pilot', 'angular'].includes(command));
		assert.equal(args.length, 2);
		console.log(
			JSON.stringify(
				await runVolumeJ2Pilot(args[0], args[1], /** @type {SkyVolumeJ2Stage} */ (command)),
				null,
				2,
			),
		);
	}
}
