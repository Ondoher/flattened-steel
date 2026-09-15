import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {freemem, cpus} from 'node:os';
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
import {sumVolumeJ2} from '../volume-j2/angular.mjs';
import {createVolumeWorkerPool} from '../volume-worker/pool.mjs';
import {volumeWorkerProof} from '../volume-worker/proof.mjs';
import {secondOrderViewNodes, secondOrderAngularGroups, viewAngularRules} from './geometry.mjs';
import {
	secondOrderViewTransmission,
	integrateSecondOrderView,
	secondOrderPointChecks,
	viewComponents,
} from './integrate.mjs';
import {secondOrderViewProof} from './proof.mjs';

const allocatedBytes = 4 * 1024 ** 2,
	terminalReserveBytes = 768 * 1024;
const extensionId = 'compensation-attribution-v1';
const referencePlanPath =
	'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/second-order-reference-plan.md';

/** Verify the pinned original executable, retaining only its identity.
 * @param {DialContinuationToolIdentity} expected - C0 Node identity.
 * @returns {Promise<void>} Rejects executable drift before numerical work.
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

/** Execute a bounded independent second-order viewing-ray stage.
 * @param {string} registrationRun - Original accepted C0 registration.
 * @param {string} planPath - Governing attribution plan.
 * @param {'pilot'|'coarse'} [stage] - Two-point cost pilot or completed original sixteen-point rule.
 * @param {string} [pilotRun] - Exact accepted pilot for the coarse completion.
 * @returns {Promise<SkyVolumeRunResult>} Sealed execution, not automatic reference qualification.
 */
export async function runSecondOrderView(registrationRun, planPath, stage = 'pilot', pilotRun) {
	assert.ok(['pilot', 'coarse'].includes(stage));
	assert.equal(typeof pilotRun === 'string', stage === 'coarse');
	assert.equal(planPath, 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/attribution-plan.md');
	const started = Date.now(),
		registration = readRegistration(registrationRun);
	const admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	await authenticateNode(registration.record.host.node);
	const planBytes = readRepository(planPath),
		plan = identity(planPath, planBytes);
	const referencePlanBytes = readRepository(referencePlanPath),
		referencePlan = identity(referencePlanPath, referencePlanBytes);
	assert.ok(
		planBytes.toString().includes(extensionId) && referencePlanBytes.toString().includes('second-order-view-pilot'),
	);
	readRepository(registration.record.inputs.path, registration.record.inputs);
	const spec = loadInputs().native48.transportSpec,
		channels = [0, 8],
		nodes = secondOrderViewNodes(registration, spec);
	const sources = sourceIdentities();
	const numericalSources = sources.filter(
		(source) =>
			/\/(numerics|volume-reference|volume-worker|second-order-view)\//.test(source.path) ||
			source.path.includes('/continuation/reference/physical/') ||
			source.path.endsWith('/volume-j2/angular.mjs') ||
			source.path.endsWith('/j2/angular.mjs'),
	);
	const factorial = acceptedMechanismInput('tmp/experiments/sky-accuracy-dials/runs/00162-volume-j2-ang');
	assert.equal(factorial.seal.sha256, '73e1c8d89dacae9e2f9e3f56d16662a2823e54dc2fe0a045f191ae1d77c29c58');
	const factorialArtifact = mechanismArtifact(factorial, 'reference.json');
	const factorialRecord = JSON.parse(readRepository(factorialArtifact.path, factorialArtifact).toString());
	assert.ok(factorialRecord.matrixComplete && factorialRecord.predictionsPassed);
	const baseline = acceptedMechanismInput('tmp/experiments/sky-accuracy-dials/runs/00161-volume-j2-pilot');
	assert.equal(baseline.seal.sha256, '59b8585633fbd21f2a6bd6fc04ac287000d8c8843f425587267a508cd76e2cdb');
	const baselineArtifact = mechanismArtifact(baseline, 'reference.json');
	/** @type {SkyVolumeJ2Document} */ const baselineRecord = JSON.parse(
		readRepository(baselineArtifact.path, baselineArtifact).toString(),
	);
	/** @type {SkySecondOrderPoint[]} */ const points = [];
	/** @type {DialFileIdentity[]} */ const reusedIdentities = [];
	if (pilotRun) {
		const parent = acceptedMechanismInput(pilotRun),
			artifact = mechanismArtifact(parent, 'view.json'),
			parentDefinition = mechanismArtifact(parent, 'definition.json');
		/** @type {SkySecondOrderDocument} */ const previous = JSON.parse(
			readRepository(artifact.path, artifact).toString(),
		);
		const definition = JSON.parse(readRepository(parentDefinition.path, parentDefinition).toString());
		assert.equal(previous.schemaId, 'sky-second-order-view-v1');
		assert.equal(previous.continuationRegistration, registration.run);
		assert.ok(previous.matrixComplete && previous.predictionsPassed);
		assert.equal(definition.recipe.parameters.extensionStage, 'second-order-view-pilot');
		assert.deepEqual(definition.recipe.parameters.numericalSources, numericalSources);
		assert.deepEqual(previous.nodes, nodes);
		assert.deepEqual(previous.channels, channels);
		assert.deepEqual(
			previous.points.map((point) => point.node.id),
			[nodes[0].id, nodes[12].id],
		);
		points.push(...previous.points);
		reusedIdentities.push(parent.seal, artifact, parentDefinition);
	}
	const selected =
		stage === 'pilot'
			? [nodes[0], nodes[12]]
			: nodes.filter((node) => !points.some((point) => point.node.id === node.id));
	const expectedCount = selected.length * 1728,
		extensionStage = `second-order-view-${stage}`;
	const parents = [
		registration.seal,
		registration.record.inputs,
		plan,
		referencePlan,
		factorial.seal,
		factorialArtifact,
		baseline.seal,
		baselineArtifact,
		...reusedIdentities,
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		...(admission.usage.invalidEvidence ?? []).map((record) => record.seal),
	];
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Independently evaluate pure physical J2 at frozen Gaussian viewing nodes; retain atmospheric/direct-ground and final Rayleigh/Mie components, three angular placements and independent final-view attenuation. Complete available physical intervals without using missing nodes as zero. No full Kider or N4 qualification.',
		parameters: {
			extensionId,
			extensionStage,
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C5',
			caseId: extensionStage,
			admission,
			channels,
			nodes,
			selectedIds: selected.map((node) => node.id),
			reusedIds: points.map((point) => point.node.id),
			angularRules: viewAngularRules,
			expectedCount,
			physicalProfile: 'simpson-expanded-medium',
			outerStrategy: 'global',
			workerCount: 4,
			logicalCpus: cpus().length,
			node: registration.record.host.node,
			sourceIdentities: sources,
			numericalSources,
			maximumJobMilliseconds: 3600000,
			finalizationReserveMilliseconds: 60000,
			prediction:
				'All incident/geometry/final-view column admissions pass; nonnegative separated components sum to the independent combined value. Complete first-interval ground radiance is <=1.1*original 1mm ground density*exact first-interval distance + propagated incident/view allowance. Outer and angular comparisons remain separate empirical observations, not qualified bounds.',
			retention:
				'Original recipe, source snapshot, point/component sums, all method/pass view columns, work, checks and at most eight unresolved full incident witnesses. Reproducible incident result arrays exist only in memory.',
			forecast:
				'After each complete point, twice the slowest observed complete-point wall milliseconds per incident times remaining incidents must fit the scientific deadline.',
		},
	};
	const before = storage(),
		run = createRun(stage === 'pilot' ? 'p2-view-pilot' : 'p2-view-coarse', recipe),
		definition = identity(`${run.path}/definition.json`);
	const deadline = started + Math.min(3600000, admission.timeoutMilliseconds) - 60000;
	let writtenBytes = definition.byteLength,
		lastPulse = 0,
		lastMemory = 0,
		completedCount = 0,
		batchBase = 0;
	let message = 'Preparing independent second-order viewing-ray pilot.',
		slowestPointPerIncident = 0;
	let stopReason = /** @type {string|null} */ (null),
		failure = /** @type {Error|null} */ (null);
	let pool = /** @type {SkyVolumeWorkerPool|null} */ (null);
	/** @type {SkyJ2Memory[]} */ const memory = [];
	/** @type {SkyVolumeResult[]} */ const unresolvedWitnesses = [];
	const resourceSignal = new Error('Second-order view deadline, conservative forecast or host headroom reached.');
	/** Enforce bounded time/storage/memory while workers compute; throw to cancel and join.
	 * @param {boolean} [force] - Observe a point or stage boundary immediately.
	 * @returns {void} Resource failure preserves its interruption identity.
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
			run.progress('second-order-view', message, completedCount, expectedCount);
			memory.push({elapsedMilliseconds: now - started, availableBytes, residentSetBytes});
			lastPulse = now;
		}
	}
	/** Retain a compact exclusive artifact and leave capacity for failure/terminal evidence.
	 * @param {string} name - Artifact basename.
	 * @param {unknown} value - JSON value or already encoded bytes.
	 * @param {DialDerivation} [derivation] - Exact parent/operation record.
	 * @returns {DialFileIdentity} Closed artifact identity.
	 */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: `Derive ${name} from the frozen independent second-order viewing recipe and actual evaluations.`,
		},
	) {
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`);
		assert.ok(writtenBytes + bytes.length < allocatedBytes - terminalReserveBytes);
		const output = run.write(name, bytes, derivation);
		writtenBytes += output.byteLength;
		return output;
	}
	try {
		guard(true);
		write('attribution-plan.md', planBytes, {
			parents: [plan],
			operation: 'Preserve governing plan before new numerical evaluation.',
		});
		write('second-order-reference-plan.md', referencePlanBytes, {
			parents: [referencePlan],
			operation: 'Preserve prospective physical target, pilot and subsequent comparison gates.',
		});
		const sourceBytes = Buffer.from(
			JSON.stringify(
				sources.map((source) => ({...source, base64: readRepository(source.path, source).toString('base64')})),
			),
		);
		write('sources.json.gz', gzipSync(sourceBytes, {level: 9}), {
			parents: sources,
			operation: 'Encode exact source bytes as base64 JSON then gzip level 9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: sourceBytes.length,
				uncompressedSha256: sha256(sourceBytes),
			},
		});
		write('proof.json', secondOrderViewProof(registration, spec));
		write('worker-proof.json', await volumeWorkerProof());
		pool = createVolumeWorkerPool(spec, channels, {
			workerCount: 4,
			deadlineEpochMilliseconds: deadline,
			guard,
			onComplete: (count) => {
				completedCount = batchBase + count;
			},
		});
		for (const node of selected) {
			const pointStarted = performance.now();
			message = `Evaluating ${node.id} at ${node.heightMeters.toFixed(3)} m with three angular rules.`;
			guard(true);
			const transmission = secondOrderViewTransmission(spec, node, channels, guard);
			const groupSets = viewAngularRules.map((rule) =>
				secondOrderAngularGroups(spec.planet.bottomRadiusMeters, node.origin, rule),
			);
			const tasks = groupSets.flatMap((groups, ruleIndex) =>
				groups.map((group, index) => ({
					id: `${viewAngularRules[ruleIndex]}:${index}`,
					origin: node.origin,
					direction: incidentWorld(node.origin, group.incident.direction),
				})),
			);
			assert.equal(tasks.length, 1728);
			batchBase = completedCount;
			const returned = await pool.evaluate(tasks);
			/** @type {SkySecondOrderAngularResult[]} */ const angular = [];
			let offset = 0;
			for (const [ruleIndex, groups] of groupSets.entries()) {
				const values = returned.slice(offset, offset + groups.length);
				const compact = values.map((value, index) => {
					assert.equal(value.id, tasks[offset + index].id);
					assert.deepEqual(value.result.geometry.origin, node.origin);
					assert.deepEqual(value.result.geometry.direction, tasks[offset + index].direction);
					if (!value.result.resolved && unresolvedWitnesses.length < 8)
						unresolvedWitnesses.push(value.result);
					return {
						targetId: node.id,
						index,
						mirrorOf: null,
						direction: value.result.geometry.direction,
						channels: value.result.channels,
						branch: value.result.geometry.branch,
						elapsedMilliseconds: value.elapsedMilliseconds,
						mediumEvaluations: value.result.methods.reduce(
							(sum, method) => sum + method.mediumEvaluations,
							0,
						),
						outerEvaluations: value.result.methods.reduce(
							(sum, method) => sum + method.outerEvaluations,
							0,
						),
					};
				});
				angular.push({
					rule: viewAngularRules[ruleIndex],
					rows: sumVolumeJ2(spec, node, channels, groups, compact),
					incidentCount: groups.length,
					geometryPassed: compact.every((row, index) => row.branch === groups[index].branch),
					incidentsPassed: values.every((row) => row.result.resolved),
				});
				offset += groups.length;
			}
			const point = {
				node,
				transmission,
				angular,
				elapsedMilliseconds: performance.now() - pointStarted,
				workerMilliseconds: returned.reduce((sum, row) => sum + row.elapsedMilliseconds, 0),
				mediumEvaluations: returned.reduce(
					(sum, row) =>
						sum + row.result.methods.reduce((total, method) => total + method.mediumEvaluations, 0),
					0,
				),
				outerEvaluations: returned.reduce(
					(sum, row) =>
						sum + row.result.methods.reduce((total, method) => total + method.outerEvaluations, 0),
					0,
				),
			};
			points.push(point);
			slowestPointPerIncident = Math.max(slowestPointPerIncident, point.elapsedMilliseconds / tasks.length);
			guard(true);
			if (secondOrderPointChecks([point]).some((check) => check.state !== 'passed')) {
				stopReason = `Unresolved incident, geometry or final-view admission at ${node.id}.`;
				break;
			}
			if (2 * slowestPointPerIncident * (expectedCount - completedCount) > deadline - Date.now())
				throw resourceSignal;
		}
	} catch (error) {
		if (error === resourceSignal) stopReason = resourceSignal.message;
		else failure = error instanceof Error ? error : new Error(String(error));
	} finally {
		await pool?.close();
	}
	const matrixComplete =
		!failure && !stopReason && selected.every((node) => points.some((point) => point.node.id === node.id));
	const checks = secondOrderPointChecks(points),
		integrals = integrateSecondOrderView(nodes, points, channels);
	/** @type {SkySecondOrderCheck[]} */ const intervalChecks = [];
	/** @type {SkySecondOrderGroundEnvelope[]} */ const groundEnvelopes = [];
	for (const channel of channels) {
		const baselineIndex = baselineRecord.targets.findIndex(
			(target) => target.probeId === nodes[0].probeId && target.heightMeters === 0.001,
		);
		const boundary = baselineRecord.rows[baselineIndex].find((row) => row.channel === channel);
		for (const rule of viewAngularRules) {
			const values = integrals.filter(
				(row) =>
					row.channel === channel &&
					row.interval === 0 &&
					row.rule === rule &&
					['groundRayleigh', 'groundMie'].includes(row.component),
			);
			if (values.every((row) => row.complete)) {
				const projection = nodes[0].surfaceOrigin.reduce(
					(sum, coordinate, axis) => sum + coordinate * nodes[0].direction[axis],
					0,
				);
				const delta = 1875 * (2 * spec.planet.bottomRadiusMeters + 1875),
					length = delta / (Math.sqrt(projection * projection + delta) + projection);
				const actual = values.reduce((sum, row) => sum + row.valueWatts, 0),
					numerical = values.reduce(
						(sum, row) => sum + row.incidentAllowanceWatts + row.viewAllowanceWatts,
						0,
					);
				const baselineScaleWatts = (boundary.groundRayleigh.mean + boundary.groundMie.mean) * length;
				const allowanceWatts =
					numerical +
					1.1 * (boundary.groundRayleigh.incidentAllowance + boundary.groundMie.incidentAllowance) * length;
				const bound = 1.1 * baselineScaleWatts + allowanceWatts;
				groundEnvelopes.push({
					channel,
					rule,
					actualWatts: actual,
					baselineScaleWatts,
					allowanceWatts,
					thresholdWatts: bound,
					passed: actual <= bound,
				});
				intervalChecks.push({
					id: `ch${channel}:${rule}:first-shell-ground-envelope`,
					state: actual <= bound ? 'passed' : 'failed',
				});
			}
		}
	}
	checks.push(...intervalChecks);
	const predictionsPassed = matrixComplete && checks.every((check) => check.state === 'passed');
	try {
		write('view.json', {
			schemaId: 'sky-second-order-view-v1',
			continuationRegistration: registration.run,
			channels,
			nodes,
			points,
			integrals,
			groundEnvelopes,
			checks,
			matrixComplete,
			predictionsPassed,
			stopReason,
			angularComparisons: points.flatMap((point) =>
				channels.flatMap((channel) =>
					viewComponents.map((component) => {
						const values = point.angular.map(
							(angular) => angular.rows.find((row) => row.channel === channel)[component],
						);
						const complete = values.every((row) => row.resolved);
						return {
							nodeId: point.node.id,
							channel,
							component,
							ordinaryFineMinusCoarse: complete ? values[1].mean - values[0].mean : null,
							mappedMinusOrdinaryFine: complete ? values[2].mean - values[1].mean : null,
							combinedIncidentAllowance: complete
								? values.reduce((sum, row) => sum + row.incidentAllowance, 0)
								: null,
						};
					}),
				),
			),
			limitations: [
				'Inner admission is separate from angular and outer quadrature adequacy. Coarse/fine and mapped disagreements are observations, not rigorous or qualified error bounds.',
				'A pilot contains two of sixteen nodes; no missing node contributes a fabricated zero.',
				'No new whole-N4 or Kider score qualification; component reference and frozen-increment attribution remain distinct.',
			],
		});
		write('unresolved-witnesses.json', unresolvedWitnesses);
		const fresh = points.filter((point) => selected.some((node) => node.id === point.node.id));
		write('costs.json', {
			expectedCount,
			returnedCount: completedCount,
			completePointCount: fresh.length,
			reusedPointCount: points.length - fresh.length,
			workerCount: 4,
			workerMilliseconds: fresh.reduce((sum, point) => sum + point.workerMilliseconds, 0),
			mediumEvaluations: fresh.reduce(
				(sum, point) => sum + point.mediumEvaluations + point.transmission.mediumEvaluations,
				0,
			),
			outerEvaluations: fresh.reduce((sum, point) => sum + point.outerEvaluations, 0),
			slowestPointMillisecondsPerIncident: slowestPointPerIncident,
			memory,
			maximumResidentSetBytes: Math.max(0, ...memory.map((row) => row.residentSetBytes)),
			memoryMetric: 'Process resident set including worker threads, not private bytes',
			partialWorkCountsUnavailable: completedCount !== fresh.length * 1728,
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
		throw new Error(`Second-order view infrastructure failed in ${run.path}: ${failure?.message}`);
	return {run: run.path, seal, matrixComplete, predictionsPassed, stopReason};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const [command, ...args] = process.argv.slice(2);
	if (command === 'proof') {
		assert.equal(args.length, 1);
		console.log(
			JSON.stringify(
				secondOrderViewProof(readRegistration(args[0]), loadInputs().native48.transportSpec),
				null,
				2,
			),
		);
	} else {
		assert.ok(['pilot', 'coarse'].includes(command));
		assert.equal(args.length, command === 'pilot' ? 2 : 3);
		console.log(
			JSON.stringify(
				await runSecondOrderView(args[0], args[1], /** @type {'pilot'|'coarse'} */ (command), args[2]),
				null,
				2,
			),
		);
	}
}
