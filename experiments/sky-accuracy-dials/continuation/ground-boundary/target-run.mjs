import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream, readdirSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {gzipSync} from 'node:zlib';
import {browserSources} from '../../execution.mjs';
import {
	checkedAbsolute,
	createRun,
	identity,
	outputRelative,
	readRepository,
	repositoryRoot,
	resolveRepository,
	sha256,
	sourceIdentities,
	storage,
	verifyRun,
} from '../../io/files.mjs';
import {runGpu} from '../../gpu/host.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {observeMemory} from '../memory.mjs';
import {accountInvalidEvidence} from '../invalid-evidence.mjs';
import {readMatchedOrdersParent} from '../matched-orders/read.mjs';
import {groundBoundaryProof} from './proof.mjs';
import {groundBoundaryTargetProof} from './target-proof.mjs';
import {groundArithmeticProof} from './arithmetic-proof.mjs';
import {groundArithmeticPolicy, assessGroundArithmetic} from './arithmetic.mjs';
import {
	groundBoundaryPlanPath,
	groundBoundaryParentRun,
	groundBoundaryControl,
	readGroundBoundaryMorningReference,
	assertGroundBoundaryShadow,
	validateGroundBoundaryReport,
	validateGroundBoundaryDiagnostics,
	groundBoundaryP2Rows,
	readGroundBoundaryGzip,
	groundBoundaryArithmeticPlan,
} from './reader.mjs';

const compilerPath = 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
const modulePath = 'experiments/sky-accuracy-dials/continuation/ground-boundary/browser.js',
	attributionPath = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/attribution-plan.md';
const allocatedBytes = 6 * 1024 ** 2,
	terminalReserve = 768 * 1024;

/** Authenticate the original C0 Node executable before and after execution.
 * @param {DialContinuationToolIdentity} expected - Original runtime bytes/version.
 * @returns {Promise<void>} Rejects runtime drift.
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

/** Reject duplicate accepted boundary targets in the already fully authenticated campaign ledger.
 * @param {string} C0 - Original registration.
 * @param {SkyGroundBoundaryCaseId} caseId - Requested target.
 * @returns {void} No retries overwrite or relabel accepted evidence.
 */
function assertNoAcceptedTarget(C0, caseId) {
	for (const name of readdirSync(resolveRepository(outputRelative + '/runs')).sort()) {
		if (Number(name.slice(0, 5)) <= Number(path.posix.basename(C0).slice(0, 5))) continue;
		const run = outputRelative + '/runs/' + name;
		if (accountInvalidEvidence(run, C0)) continue;
		const terminal = /** @type {SkyMechanismTerminal} */ (
			JSON.parse(readRepository(run + '/sealed.json').toString())
		);
		if (
			terminal.recipe.parameters.continuationRegistration === C0 &&
			terminal.recipe.parameters.caseId === caseId &&
			terminal.state === 'accepted'
		)
			throw new Error('An accepted boundary target already exists: ' + run);
	}
}

/** Capture one matched raw J2-only intervention, using independently frozen local arithmetic bounds.
 * This module executes one target per explicit invocation and never starts a second target automatically.
 * @param {string} C0 - Original campaign registration.
 * @param {string} planPath - Exact prospective ground-boundary plan owner.
 * @param {SkyGroundBoundaryCaseId} caseId - P48 or P55 raw target.
 * @returns {Promise<DialExecutionResult>} Accepted complete capture or sealed explicit failure.
 */
export async function runGroundBoundaryTarget(C0, planPath, caseId) {
	assert.equal(planPath, groundBoundaryPlanPath);
	const registration = readRegistration(C0);
	await authenticateNode(registration.record.host.node);
	const parent = readMatchedOrdersParent(registration, groundBoundaryParentRun(caseId)),
		reference = readGroundBoundaryMorningReference();
	const planBytes = readRepository(planPath),
		plan = identity(planPath, planBytes),
		attributionBytes = readRepository(attributionPath),
		attribution = identity(attributionPath, attributionBytes);
	assert.ok(planBytes.toString().includes('compensation-attribution-v1') && planBytes.toString().includes(caseId));
	const admission = admitJob(registration, 'gpu', 'component', allocatedBytes, 'C5');
	assert.ok(admission.usage.gpuConstructions < 36);
	assert.ok(
		admission.usage.gpuElapsedMilliseconds < 18 * 3600000 && admission.usage.cpuElapsedMilliseconds <= 8 * 3600000,
	);
	assertNoAcceptedTarget(C0, caseId);
	const maximumJobMilliseconds = Math.min(15 * 60000, admission.timeoutMilliseconds),
		finalizationReserveMilliseconds = 2 * 60000;
	assert.ok(maximumJobMilliseconds > finalizationReserveMilliseconds + 1000);
	const closure = browserSources([modulePath, compilerPath]),
		sources = [...new Map([...sourceIdentities(), ...closure].map((s) => [s.path, s])).values()];
	const sourceBytes = Buffer.from(
			JSON.stringify(sources.map((s) => ({...s, base64: readRepository(s.path, s).toString('base64')}))),
		),
		sourceArchive = gzipSync(sourceBytes, {level: 9});
	const started = Date.now(),
		deadlineEpochMilliseconds = started + maximumJobMilliseconds - finalizationReserveMilliseconds,
		control = groundBoundaryControl(parent.control, caseId, deadlineEpochMilliseconds),
		controlBytes = Buffer.from(JSON.stringify(control));
	const arithmeticPlans = control.channels.map((channel) => ({
		channel,
		plan: groundBoundaryArithmeticPlan(control, channel),
	}));
	assert.ok(sourceArchive.length + controlBytes.length + 2 * 4 * 5 * 4 * 243 * 8 + 2 * 1024 ** 2 < allocatedBytes);
	const parents = [
		registration.seal,
		registration.record.inputs,
		plan,
		attribution,
		...parent.identities,
		...reference.identities,
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		...(admission.usage.invalidEvidence ?? []).map((row) => row.seal),
	];
	/** @type {DialDerivation} */
	const recipe = {
		parents,
		operation:
			'Regenerate raw N1-N4 with one same-L1 original J2 shadow and one J2-only inward exact-ground B0 substitution. Preserve full original sparse-union hashes, complete non-ground equality and separate independently bounded local ground arithmetic admission.',
		parameters: {
			extensionId: 'compensation-attribution-v1',
			extensionStage: 'ground-boundary-target',
			continuationRegistration: C0,
			jobKind: 'gpu',
			scope: 'component',
			phase: 'C5',
			caseId,
			admission,
			parentRun: parent.run,
			channels: [0, 8],
			actualOrders: [1, 2, 3, 4],
			sourceIdentities: sources,
			browserSources: closure,
			node: registration.record.host.node,
			maximumJobMilliseconds,
			finalizationReserveMilliseconds,
			groundNumericalAdmission: 'conditional-on-runtime-format-and-frozen-comparison',
			signPredicate:
				'Each selected grouped effective P2 change is greater than the sum of original and corrected E1/E2 view-envelope allowances.',
			physicalReference: {morning: reference.run, noon: null},
			retention:
				'No full textures persist; streamed non-ground hash inventories, sparse shadow identity, four-order spectra and original seven-method envelopes only.',
		},
	};
	const before = storage(),
		run = createRun(caseId === 'ground-j2-p48-raw' ? 'ground-p48' : 'ground-p55', recipe),
		definition = identity(run.path + '/definition.json');
	let writtenBytes = definition.byteLength;
	/** @type {SkyGpuHostResult|null} */ let execution = null;
	/** @type {SkyGroundBoundaryFailure|null} */ let failure = null;
	/** @type {DialFileIdentity[]} */ const channels = [];
	/** @type {SkyGroundBoundaryP2Row[]} */ const p2 = [];
	/** @type {SkyGroundBoundaryChannelAdmission[]} */ const captures = [];
	/** @type {SkyContinuationMemoryObservation[]} */ const memory = [];
	/** @type {SkyGroundArithmeticChannelAdmission[]} */ const arithmeticAdmissions = [];
	/** Exclusive bounded evidence writer with immutable terminal headroom.
	 * @param {string} name - New run-local name.
	 * @param {unknown} value - Exact bytes or structured evidence.
	 * @param {DialDerivation} [derivation] - Complete parent operation.
	 * @returns {DialFileIdentity} Closed artifact identity.
	 */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: 'Derive ' + name + ' from frozen target inputs and actual bounded execution.',
		},
	) {
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value) + '\n');
		assert.ok(
			writtenBytes + bytes.length < allocatedBytes - terminalReserve,
			'Boundary target retention reserve exhausted.',
		);
		const artifact = run.write(name, bytes, derivation);
		writtenBytes += artifact.byteLength;
		return artifact;
	}
	/** Enforce root deadline, owned storage and cumulative retained allocation.
	 * @returns {void} Throws through awaited host callbacks.
	 */
	function guard() {
		assert.ok(Date.now() < deadlineEpochMilliseconds, 'Boundary target scientific deadline reached.');
		const current = run.guard();
		assert.ok(current.retainedBytes - before.retainedBytes < allocatedBytes - terminalReserve);
		assert.ok(
			current.retainedBytes - registration.initialStorage.retainedBytes <= registration.budgets.newRetainedBytes,
		);
	}
	console.log(
		JSON.stringify({
			run: run.path,
			caseId,
			maximumJobMilliseconds,
			allocatedBytes,
			groundNumericalGate: 'prospectively-bounded-pending-runtime',
		}),
	);
	try {
		write('ground-boundary-plan.md', planBytes, {
			parents: [plan],
			operation: 'Retain original prospective sign predicates and invariant obligations before GPU compute.',
		});
		write('attribution-plan.md', attributionBytes, {
			parents: [attribution],
			operation: 'Retain original governing attribution bytes before compute.',
		});
		write('control.json', controlBytes);
		write('admission.json', admission);
		write('ground-arithmetic-policy.json', {
			policy: groundArithmeticPolicy,
			prerequisite:
				'Query actual LOW_FLOAT/HIGH_FLOAT before recurrence; lowp conversion uncertainty remains included.',
		});
		write('arithmetic-plans.json.gz', gzipSync(Buffer.from(JSON.stringify(arithmeticPlans)), {level: 9}));
		write('sources.json.gz', sourceArchive, {
			parents: sources,
			operation: 'Retain exact source bytes as base64 JSON, gzip level9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: sourceBytes.length,
				uncompressedSha256: sha256(sourceBytes),
			},
		});
		guard();
		run.progress(
			'proof',
			'Checking ground-only source transformation, sparse shadow contract and view algebra.',
			0,
			2,
		);
		write('proof.json', {
			compiler: await groundBoundaryProof(),
			target: groundBoundaryTargetProof(),
			arithmetic: groundArithmeticProof(),
		});
		guard();
		execution = await runGpu({
			repositoryRoot,
			scratchDirectory: run.scratchPath,
			chromePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
			control,
			sourceIdentities: closure,
			browserModulePath: modulePath,
			compilerModulePath: compilerPath,
			expectedOrderCount: 4,
			compilerReportSchema: 'sky-ground-boundary-wavelength-result-v1',
			readSource: async (file) => {
				const source = closure.find((row) => row.path === file);
				assert.ok(source);
				return readRepository(file, source);
			},
			onProgress: async (event) => {
				guard();
				run.progress(event.phase, event.message, event.completed, event.total);
			},
			observeResources: async (request) => {
				guard();
				const observation = await observeMemory(request);
				memory.push(observation);
				assert.ok(
					observation.availableBytes >= registration.budgets.hostHeadroomBytes &&
						observation.privateBytes <= registration.budgets.processPrivateBytes,
				);
			},
			onChannel: async (channel) => {
				guard();
				assert.equal(channel.channel, control.channels[channels.length]);
				const authority = parent.channels.find((row) => row.channel === channel.channel),
					stem = 'channel-' + String(channel.channel).padStart(2, '0');
				assert.ok(authority);
				assert.deepEqual(channel.shape, authority.expected.shape);
				const bytes = Buffer.alloc(channel.values.length * 8);
				for (const [index, value] of channel.values.entries()) bytes.writeDoubleLE(value, index * 8);
				const spectra = write(stem + '.f64', bytes);
				assert.equal(spectra.sha256, channel.spectraSha256);
				// Preserve the actual payload before any strict intervention/parity interpretation can fail.
				const diagnosticArtifact = write(
						stem + '-diagnostics.json.gz',
						gzipSync(Buffer.from(JSON.stringify(channel.diagnostics)), {level: 9}),
					),
					boundaryArtifact = write(
						stem + '-boundary.json.gz',
						gzipSync(Buffer.from(JSON.stringify(channel.compilerReport)), {level: 9}),
					);
				const {values, compilerReport, diagnostics, ...metadata} = channel;
				write(stem + '.json', {
					...metadata,
					schemaId: 'sky-ground-boundary-spectra-v1',
					actualOrders: [1, 2, 3, 4],
					units: 'W m^-2 sr^-1 nm^-1',
					spectra,
					diagnosticArtifact,
					boundaryArtifact,
					layout: 'representation-view-four-order-ray-f64le-v1',
				});
				const report = validateGroundBoundaryReport(compilerReport, control, channel.channel);
				const frozenPlan = arithmeticPlans.find((row) => row.channel === channel.channel);
				assert.ok(frozenPlan);
				const arithmetic = assessGroundArithmetic(
						frozenPlan.plan,
						report.arithmeticPrecision,
						report.boundary.groundSamples,
					),
					arithmeticArtifact = write(stem + '-arithmetic.json', arithmetic);
				arithmeticAdmissions.push({
					channel: channel.channel,
					artifact: arithmeticArtifact,
					state: arithmetic.state,
				});
				assert.equal(
					arithmetic.state,
					'passed',
					'Ground endpoint difference escaped the independently frozen arithmetic bound.',
				);
				const shadow = assertGroundBoundaryShadow(report.shadowProof, channel.fieldChecks, authority.expected),
					diagnostic = validateGroundBoundaryDiagnostics(diagnostics, registration),
					original = validateGroundBoundaryDiagnostics(
						readGroundBoundaryGzip(authority.identities[2]),
						registration,
					);
				assert.equal(diagnostic.queryCount, authority.referenceQueryCount);
				assert.equal(diagnostic.preparationEvaluationCount, authority.referencePreparationEvaluationCount);
				const originalBytes = readRepository(authority.identities[1].path, authority.identities[1]);
				for (let representation = 0; representation < channel.shape.representationCount; representation++)
					for (let view = 0; view < channel.shape.viewCount; view++)
						for (let ray = 0; ray < channel.shape.rayCount; ray++) {
							const index =
								(representation * channel.shape.viewCount + view) * 4 * channel.shape.rayCount + ray;
							assert.equal(
								channel.values[index],
								originalBytes.readDoubleLE(index * 8),
								'Original N1 spectrum changed.',
							);
						}
				captures.push({
					channel: channel.channel,
					sparseUnionParityPassed: true,
					nonGroundParityPassed: true,
					l1StructuralProofPassed: true,
					shadow,
					groundSampleCount: report.boundary.groundSamples.length,
					envelopesAdmitted: diagnostic.probes
						.filter((row) => row.methodId === 'reference-envelope')
						.every((row) => row.errorAllowance !== null),
					evaluationCount: diagnostic.evaluationCount,
					preparationEvaluationCount: diagnostic.preparationEvaluationCount,
					timings: report.timings,
					ledger: report.ledger,
				});
				p2.push(...groundBoundaryP2Rows(diagnostic, original, channel.channel, reference));
				channels.push(spectra);
				guard();
			},
			timeoutMilliseconds: Math.max(1000, deadlineEpochMilliseconds - Date.now()),
		});
		assert.ok(execution.executionSucceeded, execution.failure ?? 'Boundary browser failed.');
		assert.ok(
			execution.servedSourcesReauthenticated && execution.cleanup.childExited && execution.cleanup.serverClosed,
		);
		assert.equal(channels.length, 2);
		for (const source of [...parents, ...sources]) readRepository(source.path, source);
		await authenticateNode(registration.record.host.node);
	} catch (error) {
		failure = {message: String(error), stack: error instanceof Error ? error.stack : undefined};
	}
	const cleanup = run.cleanup();
	const arithmeticPassed =
		arithmeticAdmissions.length === 2 && arithmeticAdmissions.every((row) => row.state === 'passed');
	try {
		/** @type {SkyGroundBoundaryNumericalAdmission} */
		const numericalAdmission = {
			schemaId: 'sky-ground-boundary-numerical-admission-v2',
			state: arithmeticPassed
				? 'passed'
				: arithmeticAdmissions.some((row) => row.state === 'failed')
					? 'failed'
					: 'unresolved',
			primitiveBoundsComplete: arithmeticPassed,
			policy: groundArithmeticPolicy,
			channels: arithmeticAdmissions,
			reason: 'Local J2-only endpoint arithmetic with explicit runtime precision, B0/phase intervals, sampler conversion, positive shadow comparison, accumulation and packed Rayleigh discrepancy. Whole-view and later-order boundary accuracy remain separate.',
		};
		write('ground-admission.json', numericalAdmission);
		write('capture-admission.json', {
			schemaId: 'sky-ground-boundary-capture-admission-v1',
			channels: captures,
			complete: captures.length === 2,
			groundArithmeticAdmitted: arithmeticPassed,
		});
		write('p2.json', {
			schemaId: 'sky-ground-boundary-p2-v1',
			rows: p2,
			meaning: 'Effective grouped P2=E2-E1; independently viewed pure J2 is a different reconstruction.',
			predictionsPassed: p2.length === 4 && p2.every((row) => row.state === 'passed'),
			physicalBenefitPredicted: false,
			groundArithmeticAdmitted: arithmeticPassed,
			reference,
		});
		const compact = execution
			? {
					...execution,
					channels: execution.channels.map((channel) => {
						const {compilerReport, diagnostics, ...metadata} = channel;
						return {...metadata, compilerSchemaId: compilerReport.schemaId};
					}),
				}
			: null;
		write('execution.json', {execution: compact, failure, channels, cleanup});
		write('work.json', {
			memory,
			channels: captures.map((row) => ({
				channel: row.channel,
				timings: row.timings,
				ledger: row.ledger,
				evaluationCount: row.evaluationCount,
				preparationEvaluationCount: row.preparationEvaluationCount,
			})),
			shadowPassesPerChannel: 1,
			gpuConstructions: 1,
			extraFullCacheConstructions: 0,
		});
	} catch (error) {
		failure ??= {message: String(error), stack: error instanceof Error ? error.stack : undefined};
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		caseId,
		scope: 'component',
		failure,
		jobElapsedMilliseconds: Date.now() - started,
		channelCount: channels.length,
		captureComplete: captures.length === 2,
		shadowParityPassed: captures.length === 2 && captures.every((row) => row.sparseUnionParityPassed),
		envelopesAdmitted: captures.length === 2 && captures.every((row) => row.envelopesAdmitted),
		predictionsPassed: p2.length === 4 && p2.every((row) => row.state === 'passed'),
		groundArithmeticAdmitted: arithmeticPassed,
		groundArithmeticState: arithmeticPassed ? 'passed' : 'unresolved',
		physicalReferenceScope: 'morning only; noon unresolved',
	});
	verifyRun(run.path);
	const accepted = JSON.parse(readRepository(seal.path, seal).toString()).state === 'accepted';
	console.log(
		JSON.stringify({
			run: run.path,
			accepted,
			failure,
			retainedBytes: storage().retainedBytes - before.retainedBytes,
		}),
	);
	if (!accepted)
		throw new Error('Boundary target failed in ' + run.path + ': ' + (failure?.message ?? 'seal admission'));
	return {run: run.path, seal, accepted};
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
	assert.equal(
		process.argv.length,
		5,
		'Usage: target-run.mjs C0 ground-boundary-plan ground-j2-p48-raw|ground-j2-p55-raw',
	);
	await runGroundBoundaryTarget(
		process.argv[2],
		process.argv[3],
		/** @type {SkyGroundBoundaryCaseId} */ (process.argv[4]),
	);
}
