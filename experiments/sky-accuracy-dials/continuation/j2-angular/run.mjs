import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream, readdirSync} from 'node:fs';
import {freemem} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {loadInputs} from '../../execution.mjs';
import {
	checkedAbsolute,
	createRun,
	identity,
	outputRelative,
	readRepository,
	resolveRepository,
	sha256,
	sourceIdentities,
	storage,
	verifyRun,
} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {evaluatePhysicalSurfaceRay, physicalReferencePolicy} from '../reference/physical/index.mjs';
import {incidentWorld, outwardLength} from '../j2/angular.mjs';
import {accumulateNode, createSums} from '../j2/evaluate.mjs';
import {angularGroups, angularRunName, reuseAddress, stageRules} from './rules.mjs';
import {readOriginal, readParent} from './read.mjs';
import {angularOutcomes, angularPredictions, angularRankings} from './evaluate.mjs';
import {angularProof} from './proof.mjs';

const allocatedBytes = 4 * 1024 ** 2,
	terminalReserve = 768 * 1024,
	reportReserve = 512 * 1024;
const maximumStageMilliseconds = 60 * 60 * 1000,
	finalizationReserveMilliseconds = 60000;
const extensionId = 'compensation-attribution-v1';
const outerStrategy = 'global';

/** Authenticate the exact original CPU executable without persisting it.
 * @param {DialContinuationToolIdentity} expected - Original C0 runtime identity.
 * @returns {Promise<void>} Throws on a tool identity change.
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

/** A prediction cannot be relabelled prospective after any extension fine-stage attempt.
 * @returns {void} Rejects even a failed target attempt, since it may have exposed values.
 */
function requireUnobservedFine() {
	for (const name of readdirSync(resolveRepository(`${outputRelative}/runs`))) {
		const terminal = JSON.parse(readRepository(`${outputRelative}/runs/${name}/sealed.json`).toString());
		const parameters = terminal.recipe.parameters;
		assert.ok(
			parameters?.extensionId !== extensionId || parameters.extensionStage !== 'fine',
			'Held fine output has already been attempted; a new prediction is retrospective.',
		);
	}
}

/** Execute one bounded CPU-only extension stage under the unchanged campaign ledger.
 * C5 is a resource debit for new reference work, not a reopening or success claim
 * for the historical skipped full-screen qualification stage.
 * @param {SkyAngularStage} stage - Explicit bounded scientific stage.
 * @param {string} registrationRun - Exact original C0 run.
 * @param {string} planPath - Current extension plan, retained by exact identity and bytes.
 * @param {string} [parentRun] - Exactly preceding accepted complete stage.
 * @returns {Promise<SkyAngularRunResult>} New immutable record with separate numerical status.
 */
export async function runAngularStage(stage, registrationRun, planPath, parentRun) {
	assert.ok(['derive', 'development', 'predict', 'fine'].includes(stage));
	assert.equal(planPath, 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/attribution-plan.md');
	const started = Date.now(),
		registration = readRegistration(registrationRun);
	const admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	await authenticateNode(registration.record.host.node);
	const planBytes = readRepository(planPath),
		plan = identity(planPath, planBytes);
	assert.ok(planBytes.toString().includes(extensionId), 'New plan must explicitly identify this extension.');
	const original = readOriginal(registration),
		spec = loadInputs().native48.transportSpec;
	readRepository(registration.record.inputs.path, registration.record.inputs);
	const predecessor = stage === 'development' ? 'derive' : stage === 'predict' ? 'development' : 'predict';
	const parent = stage === 'derive' ? null : readParent(parentRun, predecessor, registration, plan, original);
	if (stage === 'derive') assert.equal(parentRun, undefined);
	if (stage === 'predict') requireUnobservedFine();
	const targets = original.reference.targets,
		channels = original.reference.channels;
	const rules = stageRules(stage),
		groups = rules.map(angularGroups);
	const expectedNodes = 2 * groups.reduce((sum, value) => sum + value.length, 0);
	const uniqueNewDirections = new Set(
		rules.flatMap((rule, ordinal) =>
			groups[ordinal]
				.filter((_, index) => !reuseAddress(rule, index))
				.map((incident) => JSON.stringify(incident.direction)),
		),
	);
	const expectedNewNodes = 2 * uniqueNewDirections.size;
	const sources = sourceIdentities();
	const parents = [
		registration.seal,
		registration.record.inputs,
		original.seal,
		...original.artifacts,
		plan,
		...(parent ? [parent.seal, parent.artifact] : []),
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		...(admission.usage.invalidEvidence ?? []).map((record) => record.seal),
	];
	/** @type {DialDerivation} */
	const recipe = {
		parents,
		operation:
			'Attribute local second-order angular errors using exact historical incident values and new independent continuous L1 evaluations; compare radial coordinate, azimuth count and placement, with separately sealed prospective held-rule predictions.',
		parameters: {
			extensionId,
			extensionStage: stage,
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C5',
			caseId: `j2-angular-${stage}`,
			allocationMeaning:
				'New plan extension reference-work allocation only; historical C5 skipped qualification remains immutable and no whole-N4 accuracy claim is made.',
			admission,
			plan,
			original: original.seal,
			parentRun: parentRun ?? null,
			targets,
			channels,
			rules,
			expectedNodes,
			expectedNewNodes,
			numericalPolicy: physicalReferencePolicy('simpson-expanded-medium'),
			outerStrategy,
			node: registration.record.host.node,
			sourceIdentities: sources,
			maximumStageMilliseconds,
			finalizationReserveMilliseconds,
			pilot: 'Evaluate lowest/highest-mu toward/away-source representative witnesses at both origins for each new rule; retain full first and unresolved witnesses. Require 2*max(mean measured node time,slowest witness time)*remaining new nodes to fit the scientific deadline. Stop on unresolved incident L1.',
			boundary:
				'Four exact frozen ground probes and four channels; inward L1 exactly zero, no added ground term, binary64 source-facing directions, positive phase weights, no cosine in the solid-angle scattering integral. Only local J2 density is assessed; no GPU, Kider, N4, positive-height or physical uncertainty qualification.',
			prediction:
				'H32 at az64 midpoint correction should shrink; H32 should be closer than H16 to independent mu=u²32 at az128 endpoint when changed-radial azimuth checks resolve. Freeze envelope radius 2*abs(H16-H8)+2*(U8+U16)+densityFloor around H16. Magnitude-order prediction is explicitly unresolved; no Gaussian power law is assumed. Held rules also include H32 endpoint az64/128, permitting same-radial count and placement checks from shared exact physical rays.',
		},
	};
	const before = storage(),
		run = createRun(angularRunName(stage), recipe),
		definition = identity(`${run.path}/definition.json`);
	const deadline =
		started + Math.min(maximumStageMilliseconds, admission.timeoutMilliseconds) - finalizationReserveMilliseconds;
	let writtenBytes = definition.byteLength,
		finalizing = false,
		lastPulse = 0,
		lastMemory = 0;
	let message = 'Preparing bounded local angular attribution.',
		stopReason = /** @type {string|null} */ (null);
	let failure = /** @type {Error|null} */ (null);
	const resourceSignal = new Error('Angular stage resource or scientific deadline reached.');
	/** @type {SkyAngularNode[]} */ const nodes = [];
	/** @type {SkyJ2Witness[]} */ const witnesses = [];
	/** @type {SkyJ2Memory[]} */ const memory = [];
	/** @type {Map<string,SkyJ2NodeResult>} */ const cache = new Map();
	/** @type {Map<string,SkyAngularNode>} */ const physicalCache = new Map();
	/** @type {SkyJ2RuleResult[]} */ const results = [...(parent?.record.rules ?? [])];
	/** @type {SkyJ2PilotAdmission|null} */ let pilot = null;
	/** @type {readonly SkyAngularPrediction[]} */ let predictions = parent?.record.predictions ?? [];
	/** @type {readonly SkyAngularOutcome[]} */ let outcomes = [];
	/** @type {readonly SkyAngularRanking[]} */ let rankings = [];
	let maximumResidentSetBytes = 0,
		minimumAvailableBytes = Infinity;
	/** Observe synchronous CPU work and flush before the monitorable-progress limit.
	 * @param {boolean} [force] - Force a full boundary observation.
	 * @returns {void} Throws immediately when the admitted budget is exhausted.
	 */
	function guard(force = false) {
		const now = Date.now();
		if (now >= deadline) throw resourceSignal;
		if (!force && now - lastMemory < 1000) return;
		lastMemory = now;
		const availableBytes = freemem(),
			residentSetBytes = process.memoryUsage().rss;
		if (
			availableBytes < registration.budgets.hostHeadroomBytes ||
			residentSetBytes > registration.budgets.processPrivateBytes
		)
			throw resourceSignal;
		maximumResidentSetBytes = Math.max(maximumResidentSetBytes, residentSetBytes);
		minimumAvailableBytes = Math.min(minimumAvailableBytes, availableBytes);
		if (force || now - lastPulse >= 20000) {
			assert.ok(run.guard().retainedBytes - before.retainedBytes < allocatedBytes - terminalReserve);
			run.progress('j2-angular', message, nodes.length, expectedNodes);
			memory.push({elapsedMilliseconds: now - started, residentSetBytes, availableBytes});
			lastPulse = now;
		}
	}
	/** Guard every retained artifact against the per-stage and terminal reserve.
	 * @param {string} name - New run-relative artifact.
	 * @param {unknown} value - Exact bytes or JSON data.
	 * @param {DialDerivation} [derivation] - Specific derivation overriding the stage recipe.
	 * @returns {DialFileIdentity} Newly retained artifact identity.
	 */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: `Derive ${name} from the exact angular-stage recipe and observed admitted values.`,
		},
	) {
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`);
		assert.ok(writtenBytes + bytes.length < allocatedBytes - terminalReserve - (finalizing ? 0 : reportReserve));
		const artifact = run.write(name, bytes, derivation);
		writtenBytes += artifact.byteLength;
		return artifact;
	}
	/** Evaluate one new continuous ray or reuse an exactly addressed authenticated original value.
	 * @param {SkyJ2Target} target - Exact origin owner.
	 * @param {number} ordinal - Current stage rule ordinal.
	 * @param {number} index - Reflection group ordinal.
	 * @param {boolean} [witness] - Retain full two-method report for a preregistered pilot witness.
	 * @returns {SkyJ2NodeResult} Independent incident result, never a partial angular estimate.
	 */
	function node(target, ordinal, index, witness = false) {
		const rule = rules[ordinal],
			incident = groups[ordinal][index],
			key = `${target.time}:${rule.id}:${index}`;
		if (cache.has(key)) return cache.get(key);
		guard();
		const address = reuseAddress(rule, index);
		const physicalKey = `${target.time}:${JSON.stringify(incident.direction)}`;
		const shared = address ? null : physicalCache.get(physicalKey);
		const sharedFrom = shared ? `${shared.time}:${shared.ruleId}:${shared.index}` : null;
		/** @type {SkyJ2NodeResult} */ let result;
		if (address) {
			const originalNode = original.nodes.find(
				(value) =>
					value.time === target.time &&
					value.ruleIndex === address.ruleIndex &&
					value.index === address.index,
			);
			assert.ok(originalNode && originalNode.resolved);
			result = {...originalNode, finite: [], elapsedMilliseconds: 0, mediumEvaluations: 0, outerEvaluations: 0};
		} else if (shared) {
			result = {...shared.result, elapsedMilliseconds: 0, mediumEvaluations: 0, outerEvaluations: 0};
		} else {
			const begin = performance.now(),
				direction = incidentWorld(target.origin, incident.direction);
			const report = evaluatePhysicalSurfaceRay(
				spec,
				{
					origin: target.origin,
					direction,
					length: outwardLength(target.origin, direction, spec.planet.topRadiusMeters),
				},
				channels,
				() => guard(),
				'simpson-expanded-medium',
				outerStrategy,
			);
			result = {
				gauss: report.channels.map((row) => row.gaussWatts),
				simpson: report.channels.map((row) => row.simpsonWatts),
				allowances: report.channels.map((row) => row.empiricalAllowanceWatts),
				resolved: report.resolved,
				mediumEvaluations: report.methods.reduce((sum, method) => sum + method.mediumEvaluations, 0),
				outerEvaluations: report.methods.reduce((sum, method) => sum + method.outerEvaluations, 0),
				elapsedMilliseconds: Math.max(0, performance.now() - begin),
				finite: [],
			};
			if (witness || !report.resolved)
				witnesses.push({
					time: target.time,
					ruleIndex: ordinal,
					index,
					report,
					elapsedMilliseconds: result.elapsedMilliseconds,
				});
		}
		const record = {time: target.time, ruleId: rule.id, index, incident, reused: address, sharedFrom, result};
		nodes.push(record);
		cache.set(key, result);
		if (!address && !shared) physicalCache.set(physicalKey, record);
		if (!result.resolved)
			stopReason = `Independent L1 unresolved at ${key}; no complete rule or dependent stage is admitted.`;
		return result;
	}
	try {
		guard(true);
		write('attribution-plan.md', planBytes, {
			parents: [plan],
			operation:
				'Retain exact current new-plan bytes; historical plans and skipped qualification remain unchanged.',
		});
		const sourceBytes = Buffer.from(
			JSON.stringify(
				sources.map((source) => ({...source, base64: readRepository(source.path, source).toString('base64')})),
			),
		);
		write('sources.json.gz', gzipSync(sourceBytes, {level: 9}), {
			parents: sources,
			operation: 'Preserve exact authored source bytes as base64 JSON with Node gzip level9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: sourceBytes.length,
				uncompressedSha256: sha256(sourceBytes),
			},
		});
		write('proof.json', angularProof());
		for (const [ordinal, rule] of rules.entries()) {
			if (!groups[ordinal].some((_, index) => !reuseAddress(rule, index))) continue;
			for (const time of ['09:30', '12:30']) {
				const target = targets.find((value) => value.time === time);
				for (const index of [0, rule.azimuthCount / 2 - 1, groups[ordinal].length - 1]) {
					message = `Pilot ${time} ${rule.id}, representative ${index}.`;
					node(target, ordinal, index, true);
					if (stopReason) break;
				}
				if (stopReason) break;
			}
			if (stopReason) break;
		}
		if (!stopReason && expectedNewNodes) {
			const measured = nodes.filter((value) => !value.reused && !value.sharedFrom),
				elapsed = measured.reduce((sum, value) => sum + value.result.elapsedMilliseconds, 0);
			const mean = elapsed / measured.length,
				slowest = Math.max(...witnesses.map((value) => value.elapsedMilliseconds));
			const remainingNodes = expectedNewNodes - measured.length;
			const projected = 2 * Math.max(1, mean, slowest) * remainingNodes,
				remaining = Math.max(0, deadline - Date.now());
			pilot = {
				resolved: true,
				completedNodes: measured.length,
				meanNodeMilliseconds: mean,
				maximumWitnessMilliseconds: slowest,
				projectionMultiplier: 2,
				remainingNodes,
				projectedRemainingMilliseconds: projected,
				remainingScientificMilliseconds: remaining,
				proceed: projected <= remaining,
			};
			if (!pilot.proceed) stopReason = 'Conservative pilot projection exceeds the bounded stage deadline.';
		}
		if (!stopReason)
			for (const [ordinal, rule] of rules.entries()) {
				for (const time of ['09:30', '12:30']) {
					const selected = targets.filter((target) => target.time === time),
						sums = createSums(selected, channels, 0);
					let completedNodes = 0;
					for (const [index, incident] of groups[ordinal].entries()) {
						message = `${time} ${rule.id}, representative ${index + 1}/${groups[ordinal].length}.`;
						const value = node(selected[0], ordinal, index);
						completedNodes++;
						if (!value.resolved) break;
						accumulateNode(spec, selected, channels, incident, value, sums);
					}
					results.push({
						time,
						ruleId: rule.id,
						expectedNodes: groups[ordinal].length,
						completedNodes,
						finiteAngularResolved: !stopReason,
						rows: stopReason ? null : sums,
					});
					if (stopReason) break;
				}
				if (stopReason) break;
			}
		if (!stopReason && stage === 'predict') predictions = angularPredictions(targets, channels, results);
		if (!stopReason && stage === 'fine') {
			assert.deepEqual(predictions, angularPredictions(targets, channels, parent.record.rules));
			outcomes = angularOutcomes(predictions, results);
			rankings = angularRankings(outcomes, results);
		}
	} catch (error) {
		if (error === resourceSignal) stopReason = resourceSignal.message;
		else failure = error instanceof Error ? error : new Error(String(error));
	}
	const matrixComplete = !failure && !stopReason && nodes.length === expectedNodes;
	finalizing = true;
	try {
		run.progress(
			'j2-angular-finalize',
			'Retaining local density evidence, costs, limitations and exact ancestry.',
			nodes.length,
			expectedNodes,
		);
		const nodeBytes = Buffer.from(JSON.stringify(nodes));
		write('incident-nodes.json.gz', gzipSync(nodeBytes, {level: 9}), {
			parents: [definition, ...original.artifacts],
			operation:
				'Preserve exact incident geometry, new weights, original value addresses, independent estimates and allowances; compress JSON using Node gzip level9.',
			parameters: {
				schemaId: 'sky-j2-angular-nodes-v1',
				uncompressedByteLength: nodeBytes.length,
				uncompressedSha256: sha256(nodeBytes),
			},
		});
		write('witnesses.json', witnesses);
		/** @type {SkyAngularDocument} */ const document = {
			schemaId: 'sky-j2-angular-attribution-v1',
			units: 'W m^-3 sr^-1 nm^-1',
			extensionId,
			stage,
			continuationRegistration: registration.run,
			plan,
			parentRun: parentRun ?? null,
			targets,
			channels,
			rules: results,
			predictions,
			outcomes,
			rankings,
			matrixComplete,
			stopReason,
		};
		write('reference.json', document);
		write('costs.json', {
			pilot,
			expectedNodes,
			expectedNewNodes,
			actualNewNodes: nodes.filter((node) => !node.reused && !node.sharedFrom).length,
			sharedNodes: nodes.filter((node) => node.sharedFrom).length,
			reusedNodes: nodes.filter((node) => node.reused).length,
			exactOriginalReplayValues: original.exactReplayValues,
			memory,
			maximumResidentSetBytes,
			minimumAvailableBytes: Number.isFinite(minimumAvailableBytes) ? minimumAvailableBytes : null,
			memoryMetric: 'Node resident set, not private bytes',
			mediumEvaluations: nodes.reduce((sum, node) => sum + node.result.mediumEvaluations, 0),
			outerEvaluations: nodes.reduce((sum, node) => sum + node.result.outerEvaluations, 0),
			partialCountsUnavailable: stopReason === resourceSignal.message,
		});
		write('execution.json', {
			matrixComplete,
			stopReason,
			failure: failure ? {message: failure.message, stack: failure.stack} : null,
			gpuJobsExecuted: 0,
			numericalQualification:
				'Local J2 only; accepted execution does not imply prediction success, complete angular accuracy, Kider improvement or whole-N4 qualification.',
		});
		for (const input of parents) readRepository(input.path, input);
		for (const source of sources) readRepository(source.path, source);
		await authenticateNode(registration.record.host.node);
	} catch (error) {
		failure ??= error instanceof Error ? error : new Error(String(error));
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		caseId: `j2-angular-${stage}`,
		extensionId,
		extensionStage: stage,
		matrixComplete,
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
			`Angular infrastructure failed in ${run.path}: ${failure?.message ?? 'source identity change'}`,
		);
	return {run: run.path, seal, matrixComplete, stopReason};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const [command, ...args] = process.argv.slice(2);
	if (command === 'proof') {
		assert.equal(args.length, 0);
		console.log(JSON.stringify(angularProof(), null, 2));
	} else {
		assert.ok(
			['derive', 'development', 'predict', 'fine'].includes(command),
			'Use proof or <derive|development|predict|fine> <C0-run> <extension-plan> [previous-stage-run].',
		);
		assert.equal(args.length, command === 'derive' ? 2 : 3);
		console.log(
			JSON.stringify(
				await runAngularStage(/** @type {SkyAngularStage} */ (command), args[0], args[1], args[2]),
				null,
				2,
			),
		);
	}
}
