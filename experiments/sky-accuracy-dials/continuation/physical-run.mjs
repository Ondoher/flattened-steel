import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {freemem} from 'node:os';
import {loadInputs} from '../execution.mjs';
import {
	checkedAbsolute,
	createRun,
	identity,
	listFiles,
	outputRelative,
	readRepository,
	storage,
	verifyRun,
} from '../io/files.mjs';
import {readRegistration} from './registration/run.mjs';
import {admitJob} from './resources.mjs';
import {physicalReferencePolicy, evaluatePhysicalJ1References} from './reference/physical/index.mjs';

const allocationBytes = 4 * 1024 ** 2;
const sealingReserveBytes = 512 * 1024;
const finalReportReserveBytes = 512 * 1024;
const pilotProjectionMultiplier = 2;
const originalPilotRun = `${outputRelative}/runs/00102-c1-physical-j1`;

/** Authenticate the exact limited pilot that motivates the explicitly selected work revision.
 * Only the work-limit failure and frozen geometry are consumed; measured Kider
 * residuals play no role in selecting or admitting the larger numerical budget.
 * @param {DialContinuationRegistrationRead} registration - Current authenticated C0 registration.
 * @param {readonly SkyReferenceProbe[]} probes - Exact physical rays from that registration.
 * @param {readonly number[]} channels - Registered component spectral indices.
 * @returns {SkyPhysicalRevisionParent} Verified immutable revision authority.
 */
function readRevisionParent(registration, probes, channels) {
	const sealIdentity = verifyRun(originalPilotRun);
	/** @type {SkyPhysicalRevisionSeal} */
	const seal = JSON.parse(readRepository(sealIdentity.path, sealIdentity).toString());
	assert.equal(seal.state, 'accepted');
	assert.equal(seal.run, originalPilotRun);
	assert.equal(seal.recipe.parameters.continuationRegistration, registration.run);
	assert.equal(seal.recipe.parameters.jobKind, 'cpu');
	assert.equal(seal.recipe.parameters.scope, 'component');
	assert.equal(seal.result.caseId, 'physical-j1-reference');
	assert.equal(seal.result.referenceResolved, false);
	assert.equal(seal.result.completedProbeCount, 1);
	const controlIdentity = seal.artifacts.find((artifact) => artifact.path === `${originalPilotRun}/control.json`),
		pilotIdentity = seal.artifacts.find((artifact) => artifact.path === `${originalPilotRun}/pilot.json`);
	assert.ok(controlIdentity && pilotIdentity, 'Revision baseline lacks its declared control or pilot.');
	/** @type {SkyPhysicalOriginalControl} */
	const control = JSON.parse(readRepository(controlIdentity.path, controlIdentity).toString());
	assert.deepEqual(control.registration, registration.seal);
	assert.deepEqual(control.input, registration.record.inputs);
	assert.deepEqual(control.channels, channels);
	assert.deepEqual(control.probes, probes);
	assert.equal(control.numericalBudget.maximumMediumEvaluations, 262144);
	assert.equal(control.numericalBudget.maximumOuterEvaluations, 2048);
	assert.equal(control.numericalBudget.maximumColumnEvaluations, 4096);
	/** @type {SkyPhysicalOriginalPilot} */
	const pilot = JSON.parse(readRepository(pilotIdentity.path, pilotIdentity).toString());
	assert.equal(pilot.resolved, false);
	assert.equal(pilot.probes.length, 1);
	assert.equal(pilot.probes[0].probeId, probes[0].id);
	assert.deepEqual(
		pilot.rows.map((row) => row.channel),
		channels,
	);
	assert.ok(pilot.rows.every((row) => row.probeId === probes[0].id && row.resolved === false));
	assert.deepEqual(
		pilot.probes[0].methods.map((method) => method.method),
		['gauss', 'simpson'],
	);
	const [gauss, simpson] = pilot.probes[0].methods;
	assert.equal(gauss.converged, true);
	assert.equal(simpson.converged, false);
	assert.equal(simpson.mediumEvaluations, 262144);
	assert.ok(simpson.reasons.includes('Physical ray medium-pair evaluation cap reached.'));
	return {
		run: originalPilotRun,
		seal: sealIdentity,
		control: {path: controlIdentity.path, byteLength: controlIdentity.byteLength, sha256: controlIdentity.sha256},
		pilot: {path: pilotIdentity.path, byteLength: pilotIdentity.byteLength, sha256: pilotIdentity.sha256},
		reason: 'The exact original pilot completed Gauss but exhausted the shared Simpson medium-pair budget. This explicit revision changes only that computational cap; tolerances, geometry, admission gates and physical operators remain fixed.',
	};
}

/** Reauthenticate the exact registration-time executable without retaining executable bytes.
 * @param {DialContinuationToolIdentity} expected - Frozen Node identity.
 * @returns {Promise<void>} Resolves only when current executable bytes/version match C0.
 */
async function authenticateNode(expected) {
	assert.equal(checkedAbsolute(process.execPath), expected.path);
	assert.equal(process.version, expected.version);
	const hash = createHash('sha256');
	let byteLength = 0;
	for await (const chunk of createReadStream(checkedAbsolute(process.execPath))) {
		hash.update(chunk);
		byteLength += chunk.length;
	}
	assert.equal(byteLength, expected.byteLength);
	assert.equal(hash.digest('hex'), expected.sha256);
}

/** Execute actual physical J1 references, with one frozen pilot and no cache or GPU work.
 * Numerical nonresolution is retained as an accepted limited diagnostic. Invalid inputs,
 * changed provenance and unexpected runtime errors remain failed infrastructure.
 * @param {string} registrationRun - Accepted immutable C0 registration.
 * @param {SkyPhysicalReferenceProfile} [profile] - Explicit numerical work profile; no automatic retry occurs.
 * @returns {Promise<SkyPhysicalRunResult>} Verified reference evidence and explicit completeness.
 */
export async function runPhysicalReferences(registrationRun, profile = 'standard') {
	const started = Date.now(),
		numericalPolicy = physicalReferencePolicy(profile),
		registration = readRegistration(registrationRun);
	const planSnapshot = {...registration.record.plan, path: `${registration.run}/continuation-plan.md`};
	readRepository(planSnapshot.path, planSnapshot);
	readRepository(registration.record.inputs.path, registration.record.inputs);
	const inputs = loadInputs(),
		admission = admitJob(registration, 'cpu', 'component', allocationBytes);
	await authenticateNode(registration.record.host.node);
	const deadline = started + admission.timeoutMilliseconds,
		channels = [...registration.record.scopes.probeChannels];
	assert.deepEqual(channels, [0, 8, 24, 30]);
	assert.equal(registration.record.probeRays.length, 40);
	/** @type {readonly SkyReferenceProbe[]} */
	const probes = registration.record.probeRays.map((ray, index) => ({
		id: registration.probes[index].probeId,
		time: ray.time,
		gridX: ray.gridX,
		gridY: ray.gridY,
		ray: {origin: ray.origin, direction: ray.direction, length: ray.lengthMeters},
	}));
	const revisionParent =
		profile === 'simpson-expanded-medium' ? readRevisionParent(registration, probes, channels) : null;
	const sources = listFiles('experiments/sky-accuracy-dials').map((file) => identity(file));
	/** @type {DialDerivation} */
	const recipe = {
		parents: [
			registration.seal,
			registration.record.inputs,
			planSnapshot,
			...(revisionParent ? [revisionParent.seal, revisionParent.control, revisionParent.pilot] : []),
			...(admission.usage.invalidEvidence ?? []).map((record) => record.seal),
			...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		],
		operation:
			'Evaluate independent binary64 physical J1 on the exact frozen 40 rays and 4 channels. Pilot the first ray, retain its two formulations, then admit the remainder only if resolved and its conservative timing projection fits. Preserve numerical nonresolution separately from execution failure; no GPU, cache construction, higher-order solution or Kider scoring.',
		parameters: {
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C1',
			caseId: 'physical-j1-reference',
			profile,
			revisionParent,
			admission,
			channels,
			probes,
			sourceIdentities: sources,
			node: registration.record.host.node,
			pilotProjectionMultiplier,
			numericalPolicy,
			deadlinePolicy:
				'Cooperative synchronous deadline checks through physical medium-evaluation callbacks, and before/after each ray. The timeout is narrowed by all prior CPU job elapsed records.',
			pilotPolicy:
				'First frozen probe, both methods, all four channels. Require numerical resolution and2*max(1,pilotMilliseconds)*remainingProbeCount<=remaining job allowance. This estimate does not replace the live deadline.',
			memoryPolicy:
				'Observe available host RAM and Node RSS. RSS is labelled resident-set size; it is not reported as private memory. The GPU private-memory monitor is a separate owner.',
		},
	};
	const initialBytes = storage().retainedBytes,
		run = createRun('c1-physical-j1', recipe);
	const definitionIdentity = identity(`${run.path}/definition.json`);
	let writtenBytes = definitionIdentity.byteLength,
		finalizing = false;
	/** Bound each artifact and link derivation through the complete frozen definition without duplicating its large selectors.
	 * @param {string} name - Exclusive artifact path.
	 * @param {unknown} value - Compact evidence bytes or JSON value.
	 * @param {DialDerivation} [derivation] - More specific source-copy derivation when applicable.
	 * @returns {DialFileIdentity} Newly retained immutable artifact identity.
	 */
	function writeArtifact(
		name,
		value,
		derivation = {
			parents: [definitionIdentity],
			operation: `Derive ${name} from this run's frozen physical-reference recipe, independent method reports and measured execution accounting.`,
		},
	) {
		const bytes = Buffer.isBuffer(value)
			? value
			: Buffer.from(typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
		assert.ok(
			writtenBytes + bytes.length <
				admission.allocatedBytes - sealingReserveBytes - (finalizing ? 0 : finalReportReserveBytes),
			'Physical-reference artifact exceeds its bounded output allocation.',
		);
		const artifact = run.write(name, bytes, derivation);
		writtenBytes += artifact.byteLength;
		return artifact;
	}
	console.log(
		JSON.stringify({
			run: run.path,
			jobKind: 'cpu',
			scope: 'component',
			admission,
			probeCount: probes.length,
			channels,
			profile,
		}),
	);
	/** @type {SkyPhysicalProbeExecution[]} */ const executions = [];
	/** @type {SkyPhysicalReferenceReport[]} */ const reports = [];
	/** @type {SkyPhysicalCpuMemory[]} */ const memory = [];
	/** @type {SkyPhysicalPilotAdmission|null} */ let pilot = null;
	/** @type {string|null} */ let stopReason = null;
	/** @type {Error|null} */ let failure = null;
	const deadlineSignal = new Error('Remaining CPU reference/analysis time allowance exhausted.');
	const memorySignal = new Error('Available host memory fell below the registered headroom floor.');
	let lastObservation = -Infinity,
		lastMemoryCheck = -Infinity,
		lastProgress = -Infinity,
		currentProbe = 0;
	/** Check live resource/time limits during synchronous physical quadrature.
	 * @param {boolean} [force] - Force a progress/memory record at a ray boundary.
	 * @returns {void}
	 */
	function guard(force = false) {
		const now = Date.now();
		if (now >= deadline) throw deadlineSignal;
		if (force || now - lastMemoryCheck >= 1000) {
			const availableHostBytes = freemem();
			lastMemoryCheck = now;
			if (availableHostBytes < registration.budgets.hostHeadroomBytes) throw memorySignal;
			if (force || now - lastObservation >= 25000) {
				memory.push({
					timestamp: new Date(now).toISOString(),
					elapsedMilliseconds: now - started,
					residentSetBytes: process.memoryUsage().rss,
					availableHostBytes,
				});
				lastObservation = now;
			}
		}
		if (force || now - lastProgress >= 25000) {
			const current = run.guard();
			assert.ok(
				current.retainedBytes - initialBytes < admission.allocatedBytes - sealingReserveBytes,
				'Physical-reference allocation exhausted before sealing.',
			);
			assert.ok(
				current.retainedBytes - registration.initialStorage.retainedBytes <
					registration.budgets.newRetainedBytes,
			);
			run.progress(
				currentProbe === 0 ? 'pilot' : 'physical-reference',
				`Evaluating frozen probe ${currentProbe + 1}/${probes.length}; independent physical J1 only.`,
				executions.length,
				probes.length,
			);
			lastProgress = now;
		}
	}
	try {
		writeArtifact('admission.json', admission);
		writeArtifact('control.json', {
			registration: registration.seal,
			input: registration.record.inputs,
			channels,
			probes,
			profile,
			numericalPolicy,
			revisionParent,
			pilotProjectionMultiplier,
		});
		for (const source of sources) {
			guard();
			writeArtifact(`sources/${source.path}.txt`, readRepository(source.path, source), {
				parents: [source],
				operation: 'Preserve exact authored source bytes for reproducing this CPU-only reference operation.',
			});
		}
		for (currentProbe = 0; currentProbe < probes.length; currentProbe++) {
			const probe = probes[currentProbe],
				probeStarted = Date.now();
			guard(true);
			/** @type {SkyPhysicalReferenceReport} */ let report;
			try {
				report = evaluatePhysicalJ1References(
					inputs.native48.transportSpec,
					[probe],
					channels,
					() => guard(),
					profile,
				);
			} catch (error) {
				if (error !== deadlineSignal && error !== memorySignal) throw error;
				stopReason = error.message;
				executions.push({
					probeId: probe.id,
					state: 'interrupted',
					elapsedMilliseconds: Date.now() - probeStarted,
					mediumEvaluations: null,
					outerEvaluations: null,
					reason: `${stopReason} The evaluator did not return this ray's partial counts or radiance.`,
					report: null,
				});
				break;
			}
			const elapsedMilliseconds = Date.now() - probeStarted;
			assert.equal(report.profile, profile);
			assert.deepEqual(report.numericalPolicy, numericalPolicy);
			assert.equal(report.probes.length, 1);
			assert.equal(report.probes[0].probeId, probe.id);
			assert.equal(report.rows.length, channels.length);
			assert.deepEqual(
				report.rows.map((row) => row.channel),
				channels,
			);
			const artifact = writeArtifact(
				currentProbe === 0 ? 'pilot.json' : `probes/probe-${String(currentProbe).padStart(2, '0')}.json`,
				report,
			);
			reports.push(report);
			executions.push({
				probeId: probe.id,
				state: report.resolved ? 'resolved' : 'unresolved',
				elapsedMilliseconds,
				mediumEvaluations: report.probes[0].methods.reduce((sum, method) => sum + method.mediumEvaluations, 0),
				outerEvaluations: report.probes[0].methods.reduce((sum, method) => sum + method.outerEvaluations, 0),
				reason: report.resolved
					? null
					: [
							...new Set([
								...report.probes[0].methods.flatMap((method) => method.reasons),
								...report.rows.flatMap((row) => row.reasons),
							]),
						].join('; '),
				report: artifact,
			});
			if (currentProbe === 0) {
				const projectedRemainingMilliseconds =
					pilotProjectionMultiplier * Math.max(1, elapsedMilliseconds) * (probes.length - 1);
				const remainingAllowanceMilliseconds = Math.max(0, deadline - Date.now());
				const proceed = report.resolved && projectedRemainingMilliseconds <= remainingAllowanceMilliseconds;
				pilot = {
					probeId: probe.id,
					resolved: report.resolved,
					elapsedMilliseconds,
					projectionMultiplier: pilotProjectionMultiplier,
					remainingProbeCount: probes.length - 1,
					projectedRemainingMilliseconds,
					remainingAllowanceMilliseconds,
					proceed,
					reason: !report.resolved
						? 'Pilot is numerically unresolved; retain the limitation without expanding the probe set.'
						: !proceed
							? 'Conservative pilot timing projection exceeds the remaining CPU allowance.'
							: 'Resolved pilot and conservative timing projection admit the remaining frozen probes under the live deadline.',
				};
				writeArtifact('pilot-admission.json', pilot);
				if (!proceed) {
					stopReason = pilot.reason;
					break;
				}
			}
			run.progress(
				'probe-complete',
				`Probe ${probe.id} returned ${report.resolved ? 'resolved' : 'unresolved'} independent physical references.`,
				executions.length,
				probes.length,
			);
			if (Date.now() >= deadline) {
				stopReason = deadlineSignal.message;
				break;
			}
		}
	} catch (error) {
		if (error === deadlineSignal || error === memorySignal) stopReason = error.message;
		else failure = error instanceof Error ? error : new Error(String(error));
	}
	for (const probe of probes)
		if (!executions.some((item) => item.probeId === probe.id))
			executions.push({
				probeId: probe.id,
				state: 'not-attempted',
				elapsedMilliseconds: null,
				mediumEvaluations: null,
				outerEvaluations: null,
				reason: failure
					? `Infrastructure stopped: ${failure.message}`
					: (stopReason ?? 'Probe was not admitted.'),
				report: null,
			});
	const rows = reports.flatMap((report) => report.rows),
		details = reports.flatMap((report) => report.probes);
	for (const probe of probes)
		if (!rows.some((row) => row.probeId === probe.id)) {
			for (const channel of channels)
				rows.push({
					probeId: probe.id,
					time: probe.time,
					gridX: probe.gridX,
					gridY: probe.gridY,
					channel,
					gaussWatts: null,
					simpsonWatts: null,
					methodDifferenceWatts: null,
					empiricalAllowanceWatts: null,
					resolved: false,
					reasons: [executions.find((item) => item.probeId === probe.id).reason],
				});
			details.push({probeId: probe.id, methods: []});
		}
	const ordinals = new Map(probes.map((probe, index) => [probe.id, index]));
	rows.sort(
		(a, b) =>
			ordinals.get(a.probeId) - ordinals.get(b.probeId) ||
			channels.indexOf(a.channel) - channels.indexOf(b.channel),
	);
	details.sort((a, b) => ordinals.get(a.probeId) - ordinals.get(b.probeId));
	const referenceResolved = !failure && rows.length === 160 && rows.every((row) => row.resolved);
	/** @type {SkyPhysicalReferenceReport} */
	const reference = {
		schemaId: 'sky-independent-physical-j1-reference-v1',
		units: 'W m^-2 sr^-1 nm^-1',
		profile,
		numericalPolicy,
		rows,
		probes: details,
		resolved: referenceResolved,
		limitations: [
			...new Set(reports.flatMap((report) => report.limitations)),
			'This is a 40-ray/four-channel physical J1 diagnostic, not a cache/N4/infinite-order reference or a Kider score.',
			'Unattempted or interrupted rays have null radiances and allowances; returned unresolved estimates remain explicitly unresolved.',
			'Both formulations retain common atmospheric/phase/geometry physics. Their disagreement/refinement evidence cannot bound shared physical or measurement error.',
			'Pilot timing projection is an admission estimate; all subsequent evaluations remain subject to the shared CPU deadline.',
		],
	};
	finalizing = true;
	try {
		writeArtifact('reference.json', reference);
		writeArtifact('costs.json', {
			profile,
			numericalPolicy,
			executions,
			pilot,
			stopReason,
			memory,
			maximumResidentSetBytes: Math.max(0, ...memory.map((item) => item.residentSetBytes)),
			memoryMetric: 'Node RSS, not private bytes',
			returnedMediumEvaluations: executions.reduce((sum, item) => sum + (item.mediumEvaluations ?? 0), 0),
			returnedOuterEvaluations: executions.reduce((sum, item) => sum + (item.outerEvaluations ?? 0), 0),
			partialCountsUnavailable: executions.some((item) => item.state === 'interrupted'),
		});
		writeArtifact('execution.json', {
			profile,
			revisionParent,
			failure: failure ? {message: failure.message, stack: failure.stack} : null,
			stopReason,
			completedProbeCount: reports.length,
			referenceResolved,
			noGpuExecuted: true,
		});
		if (!failure) {
			for (const parent of recipe.parents) readRepository(parent.path, parent);
			await authenticateNode(registration.record.host.node);
		}
	} catch (error) {
		failure ??= error instanceof Error ? error : new Error(String(error));
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		jobElapsedMilliseconds: Date.now() - started,
		caseId: 'physical-j1-reference',
		profile,
		scope: 'component',
		referenceResolved,
		completedProbeCount: reports.length,
		resolvedRowCount: rows.filter((row) => row.resolved).length,
		stopReason,
		failure: failure?.message ?? null,
		gpuJobsExecuted: 0,
	});
	verifyRun(run.path);
	const terminal = JSON.parse(readRepository(seal.path, seal).toString()),
		accepted = terminal.state === 'accepted';
	assert.ok(
		seal.byteLength + terminal.artifacts.reduce((sum, artifact) => sum + artifact.byteLength, 0) <=
			admission.allocatedBytes,
		'Physical-reference record exceeded its4MiB allocation.',
	);
	console.log(
		JSON.stringify({run: run.path, accepted, referenceResolved, completedProbeCount: reports.length, stopReason}),
	);
	if (!accepted)
		throw new Error(
			`Physical-reference execution failed in ${run.path}: ${failure?.message ?? 'source/seal validation'}`,
		);
	return {
		run: run.path,
		profile,
		seal,
		accepted,
		referenceResolved,
		completedProbeCount: reports.length,
		resolvedRowCount: rows.filter((row) => row.resolved).length,
	};
}
