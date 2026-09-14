import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {freemem} from 'node:os';
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
import {evaluatePhysicalSurfaceRay, physicalReferencePolicy} from '../reference/physical/index.mjs';
import {incidentGroups, incidentWorld, localJ2Rules, outwardLength} from './angular.mjs';
import {evaluateFiniteGroundL1, localJ2FiniteControls as finiteControls} from './finite.mjs';
import {accumulateNode, angularEnvelopes, createSums, phaseWeight} from './evaluate.mjs';
import {localJ2Proof} from './proof.mjs';

const allocatedBytes = 3 * 1024 ** 2,
	terminalReserve = 512 * 1024,
	reportReserve = 256 * 1024;
const channels = [0, 8, 24, 30],
	cpuReserveMilliseconds = 60 * 60 * 1000;

/** Authenticate the exact registered Node executable without retaining its bytes.
 * @param {DialContinuationToolIdentity} expected - Frozen C0 runtime identity.
 * @returns {Promise<void>} Throws when a runtime/tool identity differs.
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

/** Select exact existing C0 outputs, rather than changing the selected physical problem.
 * @param {DialContinuationRegistrationRead} registration - Authenticated frozen campaign.
 * @returns {readonly SkyJ2Target[]} Exactly four targets at two origins.
 */
function targetsFromRegistration(registration) {
	const keys = [
		['09:30', 4, 7],
		['09:30', 5, 7],
		['12:30', 3, 5],
		['12:30', 4, 4],
	];
	return keys.map(([time, gridX, gridY]) => {
		const index = registration.record.probeRays.findIndex(
			(ray) => ray.time === time && ray.gridX === gridX && ray.gridY === gridY,
		);
		assert.ok(index >= 0, 'Local J2 target must belong to the immutable component selection.');
		const ray = registration.record.probeRays[index];
		return {
			id: registration.probes[index].probeId,
			time: ray.time,
			gridX: ray.gridX,
			gridY: ray.gridY,
			origin: ray.origin,
			direction: ray.direction,
		};
	});
}

/** CPU-only local J2 pilot and registered angular/reference matrix.
 * Independent expansion stops on the first unresolved incident ray or a failed
 * 2x pilot timing projection. A bounded finite-control fallback remains explicitly
 * separate. Every derivative enters a new immutable run; previous evidence is read-only.
 * @param {string} registrationRun - Accepted C0 registration path.
 * @returns {Promise<SkyJ2RunResult>} Verified record, with scientific limitations kept distinct.
 */
export async function runLocalJ2References(registrationRun) {
	const started = Date.now(),
		registration = readRegistration(registrationRun);
	const admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C2');
	await authenticateNode(registration.record.host.node);
	const plan = {...registration.record.plan, path: `${registration.run}/continuation-plan.md`};
	readRepository(plan.path, plan);
	readRepository(registration.record.inputs.path, registration.record.inputs);
	const inputs = loadInputs(),
		spec = inputs.native48.transportSpec,
		targets = targetsFromRegistration(registration);
	assert.deepEqual(registration.record.scopes.probeChannels, channels);
	assert.deepEqual(targets[0].origin, targets[1].origin);
	assert.deepEqual(targets[2].origin, targets[3].origin);
	assert.equal(
		spec.shaderProfile?.coordinateContract ?? 'scene-cache-receiver-local-v1',
		'scene-cache-receiver-local-v1',
	);
	const sources = sourceIdentities(),
		groups = localJ2Rules.map(incidentGroups);
	const expectedNodes = 2 * groups.reduce((sum, nodes) => sum + nodes.length, 0);
	assert.equal(expectedNodes, 9536);
	const finiteRuleNodes = 2 * (groups[0].length + groups[1].length);
	const finiteScalarCount = finiteRuleNodes * finiteControls.length * channels.length;
	assert.equal(finiteScalarCount, 20480);
	const deadline = started + admission.timeoutMilliseconds - cpuReserveMilliseconds;
	const numericalPolicy = physicalReferencePolicy('simpson-expanded-medium');
	const parents = [
		registration.seal,
		registration.record.inputs,
		plan,
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		...(admission.usage.invalidEvidence ?? []).map((record) => record.seal),
	];
	/** @type {DialDerivation} */
	const recipe = {
		parents,
		operation:
			'Integrate continuous independently admitted L1 over the positive half of full-interval Gaussian product rules at exact frozen ground points; negative incoming L1 is zero. Compare finite S/T controls, reflected phase weighting and empirical angular refinement without constructing a GPU/cache or scoring Kider.',
		parameters: {
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C2',
			caseId: 'local-j2-reference',
			admission,
			targets,
			channels,
			rules: localJ2Rules,
			finiteControls,
			finiteEvidenceForecast: {
				finiteRuleNodes,
				finiteScalarCount,
				rawFloat64EquivalentBytes: finiteScalarCount * 8,
				combinedControlAdditionalScalars: finiteRuleNodes * channels.length,
				combinedControlAdditionalFloat64Bytes: finiteRuleNodes * channels.length * 8,
				retainedJobCeilingBytes: allocatedBytes,
				policy: 'Four finite controls replace the previous three-control draft before execution. All controls are included in measured incident cost and the 2x timing gate; the 3MiB total retained ceiling and per-write reserves remain enforced.',
			},
			numericalPolicy,
			sourceIdentities: sources,
			node: registration.record.host.node,
			boundary:
				'Exact ground-knot inward L1=0; no cosine in the scattering solid-angle integral, no added Lambertian term, local radial source-facing frame, binary64 intended vectors and weights. This is not the atmospheric-side positive-height limit or GPU packed-input parity.',
			pilot: 'At first origin, evaluate finest midpoint smallest-positive-mu toward/away-source witnesses and coarsest highest-mu witness, then all I512 representatives. Also evaluate one actual mirrored ray. Stop independent expansion immediately on any unresolved node. Require 2*max(mean completed pilot node time,slowest witness time)*remaining unique nodes <=remaining scientific deadline. Node time includes both methods, both accuracy passes, four channels and applicable finite controls.',
			cpuReserveMilliseconds,
			expectedNodes,
			sourceSnapshot: 'Exact base64 source records compressed with Node gzip level9.',
			angularPolicy:
				'At each output tauJ=max(1e-15,1e-6*abs(J2)) W m^-3 sr^-1 nm^-1. Require all incident L1 nodes resolved, shrinking midpoint corrections or last correction<=tauJ, and finest placement difference<=2*tauJ. Empirical U=2*max(abs(J8192-J2048),abs(J8192endpoint-J8192midpoint))+max(propagated L1 allowances over the four rules). No Richardson, rigorous-bound or physical-uncertainty claim. Missing material angular terms are unresolved. Any claimed error reduction separately requires plan U<=.2D and norm reduction>2U.',
			finitePolicy:
				'S80/T160, S160/T160, S80/T320, S160/T320 at I512 and I2048 using contained binary64 matched first-order equations. The fourth control matches the finer R2/R7 source/transport background and completes the S-by-T factorial. If independent expansion stops, permit only first-origin I512 finite controls as a limited diagnostic under the same live deadline.',
		},
	};
	const before = storage(),
		run = createRun('c2-local-j2', recipe),
		definition = identity(`${run.path}/definition.json`);
	let writtenBytes = definition.byteLength,
		finalizing = false,
		lastPulse = 0,
		lastMemoryCheck = 0,
		currentMessage = 'Preparing local J2 pilot.';
	let stopReason = /** @type {string|null} */ (null),
		failure = /** @type {Error|null} */ (null);
	const deadlineSignal = new Error(
			'Local J2 scientific deadline reached; one hour of shared CPU budget is reserved.',
		),
		memorySignal = new Error('Registered host memory headroom floor reached.');
	/** @type {SkyJ2RuleResult[]} */ const results = [];
	/** @type {SkyJ2NodeRecord[]} */ const nodes = [];
	/** @type {SkyJ2Witness[]} */ const witnesses = [];
	/** @type {SkyJ2Memory[]} */ const memory = [];
	/** @type {Map<string,SkyJ2NodeResult>} */ const cache = new Map();
	/** @type {SkyJ2PilotAdmission|null} */ let pilot = null;
	/** @type {SkyJ2FiniteDiagnostic|null} */ let fallback = null;
	let maximumResidentSetBytes = 0,
		minimumAvailableBytes = Infinity;
	let finiteControlCalls = 0,
		completedFiniteControlCalls = 0,
		finiteControlElapsedMilliseconds = 0;
	/** Observe live resources and flush progress during synchronous inner quadrature.
	 * @param {boolean} [force] - Force a boundary observation.
	 */
	function guard(force = false) {
		const now = Date.now();
		if (now >= deadline) throw deadlineSignal;
		if (!force && now - lastMemoryCheck < 1000) return;
		lastMemoryCheck = now;
		const available = freemem(),
			resident = process.memoryUsage().rss;
		if (available < registration.budgets.hostHeadroomBytes) throw memorySignal;
		maximumResidentSetBytes = Math.max(maximumResidentSetBytes, resident);
		minimumAvailableBytes = Math.min(minimumAvailableBytes, available);
		if (force || now - lastPulse >= 20000) {
			const current = run.guard();
			assert.ok(current.retainedBytes - before.retainedBytes < allocatedBytes - terminalReserve);
			run.progress('local-j2', currentMessage, cache.size, expectedNodes);
			memory.push({elapsedMilliseconds: now - started, residentSetBytes: resident, availableBytes: available});
			lastPulse = now;
		}
	}
	/** Bound every exclusive write including its derivation and terminal reserve.
	 * @param {string} name - New artifact path inside this run.
	 * @param {unknown} value - JSON or exact bytes.
	 * @param {DialDerivation} [derivation] - More specific operation for source/binary artifacts.
	 * @returns {DialFileIdentity} Immutable written artifact.
	 */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: `Derive ${name} from the frozen local-J2 recipe and measured method/control records.`,
		},
	) {
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`);
		assert.ok(
			writtenBytes + bytes.length < allocatedBytes - terminalReserve - (finalizing ? 0 : reportReserve),
			'Local J2 output forecast exhausted.',
		);
		const artifact = run.write(name, bytes, derivation);
		writtenBytes += artifact.byteLength;
		return artifact;
	}
	/** Evaluate and charge all four finite controls, including interrupted-call elapsed work.
	 * @param {SkyJ2Target} target - Exact frozen origin owner.
	 * @param {SkyVector3} local - Unit incident local direction.
	 * @returns {readonly (readonly number[])[]} Registered control order, each in frozen channel order.
	 */
	function evaluateFinite(target, local) {
		return finiteControls.map((control) => {
			const begin = performance.now();
			finiteControlCalls++;
			try {
				const values = evaluateFiniteGroundL1(
					spec,
					target.origin,
					local,
					channels,
					control.source,
					control.transport,
					() => guard(),
				);
				completedFiniteControlCalls++;
				return values;
			} finally {
				finiteControlElapsedMilliseconds += Math.max(0, performance.now() - begin);
			}
		});
	}
	/** Evaluate one arbitrary positive incident ray through both independent formulations.
	 * @param {SkyJ2Target} target - Origin owner; output direction is irrelevant to incident L1.
	 * @param {SkyVector3} local - Exact incident local direction.
	 * @param {number} ruleIndex - Registered angular rule index; -1 identifies a reflection witness.
	 * @param {number} index - Representative index within that rule.
	 * @returns {SkyJ2NodeEvaluation} Compact result plus full report for diagnostic witnesses.
	 */
	function evaluate(target, local, ruleIndex, index) {
		guard();
		const begin = performance.now(),
			direction = incidentWorld(target.origin, local);
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
		);
		const finite = ruleIndex >= 0 && ruleIndex < 2 ? evaluateFinite(target, local) : [];
		const result = {
			gauss: report.channels.map((row) => row.gaussWatts),
			simpson: report.channels.map((row) => row.simpsonWatts),
			allowances: report.channels.map((row) => row.empiricalAllowanceWatts),
			resolved: report.resolved,
			mediumEvaluations: report.methods.reduce((sum, method) => sum + method.mediumEvaluations, 0),
			outerEvaluations: report.methods.reduce((sum, method) => sum + method.outerEvaluations, 0),
			elapsedMilliseconds: Math.max(0, performance.now() - begin),
			finite,
		};
		nodes.push({time: target.time, ruleIndex, index, ...result});
		return {result, report};
	}
	/** Reuse an identical already evaluated incident node within this new run only.
	 * @param {SkyJ2Target} target - Frozen origin owner.
	 * @param {number} ruleIndex - Fixed angular rule ordinal.
	 * @param {number} index - Fixed representative ordinal.
	 * @param {boolean} [witness] - Retain full independent diagnostics for this pilot node.
	 * @returns {SkyJ2NodeResult} Complete or explicitly unresolved result.
	 */
	function node(target, ruleIndex, index, witness = false) {
		const key = `${target.time}:${ruleIndex}:${index}`;
		if (cache.has(key)) return cache.get(key);
		const value = evaluate(target, groups[ruleIndex][index].direction, ruleIndex, index);
		cache.set(key, value.result);
		if (witness || !value.result.resolved)
			witnesses.push({
				time: target.time,
				ruleIndex,
				index,
				report: value.report,
				elapsedMilliseconds: value.result.elapsedMilliseconds,
			});
		if (!value.result.resolved)
			stopReason = `Independent L1 unresolved at ${key}; no angular expansion is admitted.`;
		return value.result;
	}
	/** Finish one angular sum only when every positive contribution has resolved.
	 * @param {readonly SkyJ2Target[]} selected - Two same-origin outputs.
	 * @param {number} ruleIndex - Fixed rule ordinal.
	 * @returns {void} Appends a complete or explicitly limited result.
	 */
	function completeRule(selected, ruleIndex) {
		const rule = localJ2Rules[ruleIndex],
			incident = groups[ruleIndex],
			sums = createSums(selected, channels, ruleIndex < 2 ? finiteControls.length : 0);
		let completed = 0;
		for (let index = 0; index < incident.length; index++) {
			currentMessage = `Evaluating ${selected[0].time} ${rule.id}, incident ${index + 1}/${incident.length}.`;
			const value = node(selected[0], ruleIndex, index);
			completed++;
			if (!value.resolved) break;
			accumulateNode(spec, selected, channels, incident[index], value, sums);
		}
		const resolved = completed === incident.length && !stopReason;
		results.push({
			time: selected[0].time,
			ruleId: rule.id,
			expectedNodes: incident.length,
			completedNodes: completed,
			finiteAngularResolved: resolved,
			rows: resolved ? sums : null,
		});
	}
	try {
		guard(true);
		const records = sources.map((source) => ({
			...source,
			base64: readRepository(source.path, source).toString('base64'),
		}));
		const snapshot = Buffer.from(JSON.stringify(records));
		write('sources.json.gz', gzipSync(snapshot, {level: 9}), {
			parents: sources,
			operation: 'Preserve exact authored source bytes as base64 JSON compressed by Node zlib gzip level9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: snapshot.length,
				uncompressedSha256: sha256(snapshot),
			},
		});
		write('proof.json', localJ2Proof());
		// These exact actual fine-rule witnesses are selected before observing outcomes.
		for (const [ruleIndex, index] of [
			[2, 0],
			[2, localJ2Rules[2].azimuthCount / 2 - 1],
			[0, groups[0].length - 1],
		]) {
			currentMessage = `Pilot physical admission witness rule ${ruleIndex}, incident ${index}.`;
			node(targets[0], ruleIndex, index, true);
			if (stopReason) break;
		}
		if (!stopReason) {
			const first = node(targets[0], 0, 0, true);
			if (!stopReason) {
				const mirror = evaluate(targets[0], groups[0][0].mirror, -1, 0);
				witnesses.push({
					time: targets[0].time,
					ruleIndex: -1,
					index: 0,
					report: mirror.report,
					elapsedMilliseconds: mirror.result.elapsedMilliseconds,
				});
				if (!mirror.result.resolved) stopReason = 'Independent physical reflection witness is unresolved.';
				else
					for (let channel = 0; channel < channels.length; channel++) {
						assert.ok(
							Math.abs(first.gauss[channel] - mirror.result.gauss[channel]) <=
								1e-12 + first.allowances[channel] + mirror.result.allowances[channel],
							'Physical L1 reflection assumption failed.',
						);
						assert.ok(
							Math.abs(first.simpson[channel] - mirror.result.simpson[channel]) <=
								1e-12 + first.allowances[channel] + mirror.result.allowances[channel],
							'Independent Simpson reflection assumption failed.',
						);
					}
			}
		}
		if (!stopReason) completeRule(targets.slice(0, 2), 0);
		if (!stopReason) {
			const average = nodes.reduce((sum, value) => sum + value.elapsedMilliseconds, 0) / nodes.length;
			const witnessMaximum = Math.max(...witnesses.map((value) => value.elapsedMilliseconds));
			const cost = Math.max(1, average, witnessMaximum),
				remainingNodes = expectedNodes - cache.size;
			const projected = 2 * cost * remainingNodes,
				remaining = Math.max(0, deadline - Date.now());
			pilot = {
				resolved: true,
				completedNodes: cache.size,
				meanNodeMilliseconds: average,
				maximumWitnessMilliseconds: witnessMaximum,
				projectionMultiplier: 2,
				remainingNodes,
				projectedRemainingMilliseconds: projected,
				remainingScientificMilliseconds: remaining,
				proceed: projected <= remaining,
			};
			if (!pilot.proceed)
				stopReason =
					'Conservative 2x pilot timing projection exceeds remaining CPU allowance after the one-hour reserve.';
		}
		if (!stopReason)
			for (let origin = 0; origin < 2; origin++) {
				for (let rule = origin === 0 ? 1 : 0; rule < localJ2Rules.length; rule++) {
					completeRule(targets.slice(origin * 2, origin * 2 + 2), rule);
					guard(true);
					if (stopReason) break;
				}
				if (stopReason) break;
			}
		if (
			stopReason &&
			!results.some(
				(result) =>
					result.time === targets[0].time &&
					result.ruleId === localJ2Rules[0].id &&
					result.finiteAngularResolved,
			)
		) {
			currentMessage =
				'Retaining bounded first-origin I512 finite S/T sensitivity after independent reference limitation.';
			const selected = targets.slice(0, 2),
				sums = createSums(selected, channels, finiteControls.length);
			for (let index = 0; index < groups[0].length; index++) {
				const group = groups[0][index],
					cached = cache.get(`${targets[0].time}:0:${index}`);
				const values = cached?.finite.length ? cached.finite : evaluateFinite(targets[0], group.direction);
				for (const row of sums) {
					const weight = phaseWeight(
							spec,
							row.channel,
							selected.find((target) => target.id === row.targetId),
							group,
						),
						channel = channels.indexOf(row.channel);
					for (let control = 0; control < finiteControls.length; control++)
						row.finite[control] += weight * values[control][channel];
				}
			}
			fallback = {
				time: targets[0].time,
				ruleId: localJ2Rules[0].id,
				controls: finiteControls,
				rows: sums.map(({targetId, channel, finite}) => ({targetId, channel, finite})),
				independentReferenceAvailable: false,
			};
		}
	} catch (error) {
		if (error === deadlineSignal || error === memorySignal) stopReason = error.message;
		else failure = error instanceof Error ? error : new Error(String(error));
	}
	const matrixComplete = !failure && results.length === 8 && results.every((result) => result.finiteAngularResolved);
	finalizing = true;
	try {
		currentMessage = 'Retaining compact node values, allowances, angular sums and explicit limitations.';
		run.progress('local-j2-finalize', currentMessage, cache.size, expectedNodes);
		const nodeBytes = Buffer.from(JSON.stringify(nodes));
		write('incident-nodes.json.gz', gzipSync(nodeBytes, {level: 9}), {
			parents: [definition],
			operation:
				'Compress exact compact per-incident results in evaluation order; null means unavailable, never zero. Geometry follows rule/time/index from the frozen recipe.',
			parameters: {
				schemaId: 'sky-local-j2-nodes-v1',
				uncompressedByteLength: nodeBytes.length,
				uncompressedSha256: sha256(nodeBytes),
			},
		});
		write('witnesses.json', witnesses);
		write('reference.json', {
			schemaId: 'sky-local-j2-reference-v1',
			units: 'W m^-3 sr^-1 nm^-1',
			targets,
			channels,
			rules: results,
			envelopes: angularEnvelopes(targets, channels, results),
			finiteFallback: fallback,
			matrixComplete,
			stopReason,
			limitations: [
				'Only sixteen frozen space/direction/wavelength outputs; no N4 or infinite-order reference and no Kider score.',
				'Independent incident-ray admission qualifies a finite angular rule; angular adequacy has separate empirical density-unit gates.',
				'Incoming resolution and finite source/transport controls retain the exact ground-knot zero-inward-L1 boundary. Positive-height reflected-ground limits are not evaluated.',
				'Intended binary64 incoming vectors/weights differ from GPU Float32 packing; solar/outgoing/altitude reconstruction are not part of this continuous point result.',
				'Missing/interrupted/unresolved material terms retain null allowances. Empirical numerical allowances cannot bound shared physics or measurement error.',
			],
		});
		write('costs.json', {
			pilot,
			expectedNodes,
			evaluatedNodes: nodes.length,
			cachedRuleNodes: cache.size,
			memory,
			maximumResidentSetBytes,
			minimumAvailableBytes: Number.isFinite(minimumAvailableBytes) ? minimumAvailableBytes : null,
			memoryMetric: 'Node RSS, not private bytes',
			cpuReserveMilliseconds,
			finiteControlCalls,
			completedFiniteControlCalls,
			finiteControlElapsedMilliseconds,
			completedFiniteSpectralValues: completedFiniteControlCalls * channels.length,
			mediumEvaluations: nodes.reduce((sum, value) => sum + value.mediumEvaluations, 0),
			outerEvaluations: nodes.reduce((sum, value) => sum + value.outerEvaluations, 0),
			partialCountsUnavailable: stopReason === deadlineSignal.message || stopReason === memorySignal.message,
		});
		write('execution.json', {
			matrixComplete,
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
		caseId: 'local-j2-reference',
		matrixComplete,
		stopReason,
		failure: failure?.message ?? null,
		jobElapsedMilliseconds: Date.now() - started,
		allocatedBytes,
		gpuJobsExecuted: 0,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const record = JSON.parse(readRepository(seal.path, seal).toString());
	assert.ok(
		seal.byteLength + record.artifacts.reduce((sum, artifact) => sum + artifact.byteLength, 0) <= allocatedBytes,
	);
	if (record.state !== 'accepted')
		throw new Error(
			`Local J2 infrastructure failed: ${run.path}: ${failure?.message ?? 'source identity changed'}`,
		);
	return {run: run.path, seal, accepted: true, matrixComplete, stopReason};
}
