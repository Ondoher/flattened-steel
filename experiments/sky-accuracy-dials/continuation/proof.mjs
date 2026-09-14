import assert from 'node:assert/strict';
import {lstatSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {setImmediate as yieldMainThread} from 'node:timers/promises';
import {Worker, isMainThread, parentPort, workerData} from 'node:worker_threads';
import {parseBoundaryTsv} from '../analysis/boundary.mjs';
import {runAnalysisProof} from '../analysis/proof.mjs';
import {runPredictionContractProofs} from '../prediction/contracts.mjs';
import {runMechanismProofs} from '../probes/mechanisms.mjs';
import {deriveProfile} from '../numerics/profile.js';
import {prepareViewPlan} from '../numerics/view.js';
import {
	checkedAbsolute,
	createRun,
	identity,
	readRepository,
	sha256,
	sourceIdentities,
	storage,
	verifyRun,
} from '../io/files.mjs';
import {validateChannelDiagnostics} from './capture/diagnostics.js';
import {physicalReferenceProof} from './reference/physical/index.mjs';
import {fixedFieldReferenceProof} from './reference/fixed-field.mjs';
import {readRegistration} from './registration/run.mjs';
import {admitJob} from './resources.mjs';

const MIB = 1024 ** 2;
const ALLOCATED_BYTES = 4 * MIB;
const TERMINAL_RESERVE_BYTES = MIB;
const ENTRY = 'experiments/sky-accuracy-dials/continuation/proof.mjs';

/** Authenticate the actual Node executable without retaining a binary copy.
 * @returns {DialContinuationToolIdentity} Canonical bounded executable identity.
 */
function nodeIdentity() {
	const file = checkedAbsolute(process.execPath),
		facts = lstatSync(file);
	assert.ok(facts.isFile() && facts.size > 0 && facts.size <= 256 * MIB);
	const bytes = readFileSync(file);
	assert.equal(bytes.length, facts.size);
	return {path: file, byteLength: bytes.length, sha256: sha256(bytes), version: process.version};
}

/** Exercise the actual browser-supplied metadata validator with bounded fixtures.
 * @returns {SkyContinuationDiagnosticsProof} Manufactured contract results.
 */
function diagnosticProof() {
	/** @type {SkyContinuationChannelDiagnostics} */
	const fixture = {
		schemaId: 'sky-continuation-channel-diagnostics-v1',
		scope: 'component-probes',
		units: 'W m^-2 sr^-1 nm^-1',
		queryCount: 12,
		evaluationCount: 24,
		preparationEvaluationCount: 48,
		allowancePolicy: 'Manufactured finite allowance for validator admission only.',
		probes: [
			{
				probeId: 'manufactured-0',
				sceneId: 'condition-1230',
				time: '12:30',
				gridX: 0,
				gridY: 8,
				methodId: 'gauss-8',
				representationId: 'cumulative',
				order: 4,
				value: 0.012,
				errorAllowance: 1e-8,
				evaluationCount: 24,
			},
		],
	};
	/** @type {string[]} */ const accepted = [];
	/** @type {string[]} */ const rejected = [];
	/** @param {string} label @param {unknown} value */
	const accept = (label, value) => {
		assert.equal(validateChannelDiagnostics(value), value, label);
		accepted.push(label);
	};
	/** @param {string} label @param {unknown} value */
	const reject = (label, value) => {
		assert.throws(() => validateChannelDiagnostics(value), undefined, label);
		rejected.push(label);
	};
	/** @param {string} label @param {Record<string, unknown>} changes */
	const rejectRow = (label, changes) => reject(label, {...fixture, probes: [{...fixture.probes[0], ...changes}]});
	accept('finite bounded component result', fixture);
	accept('explicit empty diagnostic scope', {...fixture, queryCount: 0, evaluationCount: 0, probes: []});
	accept('unresolved allowance is explicitly null', {
		...fixture,
		probes: [{...fixture.probes[0], errorAllowance: null}],
	});
	accept('explicit bounded unresolved limitations', {
		...fixture,
		probes: [{...fixture.probes[0], errorAllowance: null, limitations: ['Manufactured unresolved reference.']}],
	});
	accept('distinct methods on one probe', {
		...fixture,
		evaluationCount: 48,
		probes: [fixture.probes[0], {...fixture.probes[0], methodId: 'simpson-8'}],
	});
	for (const value of [null, [], 'diagnostics']) reject('non-record envelope ' + JSON.stringify(value), value);
	for (const [field, value] of [
		['schemaId', 'unknown'],
		['scope', 'full-sky'],
		['units', 'mW'],
	])
		reject(`invalid ${field}`, {...fixture, [field]: value});
	for (const field of ['queryCount', 'evaluationCount', 'preparationEvaluationCount'])
		for (const value of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, NaN])
			reject(`invalid ${field} ${String(value)}`, {...fixture, [field]: value});
	for (const allowancePolicy of [undefined, '', 4, 'x'.repeat(4097)])
		reject(`invalid allowance policy ${typeof allowancePolicy}`, {...fixture, allowancePolicy});
	for (const limitations of ['unbounded', [null], [''], ['x'.repeat(1025)], Array(17).fill('reason')])
		rejectRow('invalid limitations ' + JSON.stringify(limitations).slice(0, 64), {limitations});
	reject('non-array rows', {...fixture, probes: {}});
	reject('row limit', {...fixture, probes: Array(4097).fill(fixture.probes[0])});
	for (const value of [null, []]) reject('non-record row ' + JSON.stringify(value), {...fixture, probes: [value]});
	for (const field of ['probeId', 'sceneId', 'methodId', 'representationId'])
		rejectRow(`invalid ${field}`, {[field]: '../escape'});
	for (const value of ['24:00', '12:60', '1:30']) rejectRow(`invalid time ${value}`, {time: value});
	for (const field of ['gridX', 'gridY'])
		for (const value of [-1, 9, 0.5]) rejectRow(`invalid ${field} ${value}`, {[field]: value});
	for (const order of [0, 5, 1.5]) rejectRow(`invalid order ${order}`, {order});
	for (const value of [-1, NaN, Infinity]) {
		rejectRow(`invalid radiance ${String(value)}`, {value});
		rejectRow(`invalid allowance ${String(value)}`, {errorAllowance: value});
	}
	for (const evaluationCount of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1])
		rejectRow(`invalid row evaluations ${evaluationCount}`, {evaluationCount});
	reject('row count sum mismatch', {...fixture, evaluationCount: 25});
	reject('duplicate scientific identity', {
		...fixture,
		evaluationCount: 48,
		probes: [fixture.probes[0], fixture.probes[0]],
	});
	return {accepted, rejected, checks: accepted.length + rejected.length};
}

/** Prove exact maximum C1 dimensions independently of any actual GPU allocation.
 * @param {SkyBuildRequest} baseline - Authenticated Native48 physical control.
 * @returns {SkyContinuationLayoutProof} Exact structural calculation.
 */
function layoutProof(baseline) {
	const profile = deriveProfile(baseline, {
		altitudeCount: 63,
		outgoingWidth: 51,
		sourceIntervals: 160,
		transportIntervals: 320,
		incoming: {kind: 'gauss-legendre-product', muCount: 32, azimuthCount: 64, azimuthPlacement: 'endpoint-aware'},
		viewRule: 'altitude-segmented',
		viewIntervals: [16],
	});
	assert.deepEqual(profile.layout, {widthJ: 15606, widthL: 2048, height: 11340, estimatedPeakFieldBytes: 893682720});
	assert.equal(profile.layout.estimatedPeakFieldBytes, 4 * (180 * 63) * (6 * 51 ** 2 + 2 * 32 * 64));
	assert.ok(profile.layout.estimatedPeakFieldBytes < 1024 * MIB);
	assert.equal(profile.buildRequest.transportSpec.numerical.sourcePathTransmittanceIntervalCount, 160);
	assert.equal(profile.buildRequest.transportSpec.numerical.transportIntervalCount, 320);
	assert.equal(profile.buildRequest.transportSpec.numerical.maximumScatteringOrder, 4);
	for (const value of [profile.layout.widthJ, profile.layout.widthL, profile.layout.height])
		assert.ok(value <= 16384);
	return {
		buildRequestId: profile.buildRequest.id,
		controls: profile.controls,
		layout: profile.layout,
		scope: 'Exact scalar-field layout estimate only. Direction textures, species coefficients, driver/process overhead and actual device allocation require the separate execution resource gate.',
	};
}

/** Rebuild exactly the ordinary historical union, retaining only its byte hash.
 * @param {SkyContinuationProofHistory} history - Authenticated original control and browser inventory.
 * @param {SkyBuildRequest} baseline - Original authenticated physical profile.
 * @returns {SkyContinuationSupportProof} Bit-exact coordinate inventory result.
 */
function supportProof(history, baseline) {
	const derived = deriveProfile(baseline, history.control.controls);
	assert.deepEqual(
		derived.buildRequest,
		history.control.buildRequest,
		'Historical ordinary physical request changed.',
	);
	const plan = prepareViewPlan(history.control.buildRequest, history.control.scenes, history.control.controls);
	const words = Buffer.alloc(plan.coordinates.length * 8);
	for (const [index, point] of plan.coordinates.entries()) {
		assert.ok(Number.isInteger(point.x) && point.x >= 0 && point.x < derived.layout.widthJ);
		assert.ok(Number.isInteger(point.y) && point.y >= 0 && point.y < derived.layout.height);
		words.writeUInt32LE(point.x, index * 8);
		words.writeUInt32LE(point.y, index * 8 + 4);
	}
	const actual = {
		coordinateCount: plan.coordinates.length,
		coordinateSha256: sha256(words),
		rayCount: plan.rayCount,
		viewCount: plan.views.length,
	};
	assert.deepEqual(
		actual,
		history.expected,
		'Ordinary support coordinate mapping changed from its historical executed hash.',
	);
	return {run: history.run, originalSources: history.originalSources, ...actual};
}

/** Run pure calculations on a worker so the owner continues flushing heartbeats.
 * @param {SkyContinuationProofWork} work - Authenticated, serializable compact inputs.
 * @returns {SkyContinuationProofReport} Complete manufactured proof results.
 */
function calculateProof(work) {
	/** @param {string} phase @param {string} message */
	const progress = (phase, message) => parentPort.postMessage({kind: 'progress', phase, message});
	progress('analysis', 'Checking mathematical controls and the retained historical score.');
	const measured = parseBoundaryTsv(work.measurementText, {
		configId: 'kider',
		sourceIdentity: work.measurementIdentity,
	});
	const baseline = parseBoundaryTsv(work.baselineText, {
		modelId: 'production',
		configId: 'native48-cpu',
		sourceIdentity: work.baselineIdentity,
	});
	const analysis = runAnalysisProof(measured, baseline, 11.419630255451395);
	progress('prediction-contracts', 'Checking positive and negative numerical-control admission.');
	const predictionContracts = runPredictionContractProofs();
	progress(
		'mechanisms',
		'Checking F68, both azimuth placements and the I8x64 aspect rule against independent phase references.',
	);
	const incomingDomains = [work.inputs.native48.transportSpec.domains.incoming];
	/** @type {readonly SkyAzimuthPlacement[]} */ const placements = ['midpoint', 'endpoint-aware'];
	for (const azimuthPlacement of placements)
		for (const [muCount, azimuthCount] of [
			[4, 8],
			[8, 16],
			[16, 32],
			[32, 64],
			[8, 64],
		])
			incomingDomains.push(
				deriveProfile(work.inputs.native48, {
					incoming: {kind: 'gauss-legendre-product', muCount, azimuthCount, azimuthPlacement},
				}).buildRequest.transportSpec.domains.incoming,
			);
	const mechanisms = runMechanismProofs({incomingDomains});
	progress('contracts-layout', 'Checking diagnostic metadata rejection and exact maximum admitted dimensions.');
	const diagnostics = diagnosticProof(),
		maximumLayout = layoutProof(work.inputs.native48);
	progress(
		'physical-reference',
		'Checking independent binary64 physical-reference manufactured limits and failure paths.',
	);
	const physicalReference = physicalReferenceProof();
	progress('fixed-field-reference', 'Checking independent fixed-field quadrature and finite sparse-support proofs.');
	const fixedFieldReference = fixedFieldReferenceProof();
	const supportParity = work.history.map((history) => {
		progress('historical-support', `Rebuilding the ordinary support map of ${history.run}.`);
		return supportProof(history, work.inputs.native48);
	});
	return {
		schemaId: 'sky-continuation-c1-proof-v1',
		analysis,
		predictionContracts,
		mechanisms,
		diagnostics,
		maximumLayout,
		physicalReference,
		fixedFieldReference,
		supportParity,
		limitations: [
			'Manufactured proofs and exact old support hashes do not establish current GPU allocation, recurrence prefix parity or component-reference convergence on Kider rays.',
			'Incoming Mie approximation errors are retained observations; no phase renormalization or convergence tolerance is introduced.',
			'Historical screen parity reproduces its registered Q30/Q60 union; full parity reproduces Q30. Neither includes the new continuation-only probe union.',
		],
	};
}

/** Snapshot the authored tree and actual static proof collaborators, excluding Node built-ins.
 * @returns {DialFileIdentity[]} Exact current source identities in stable path order.
 */
function proofSources() {
	const sources = new Map(sourceIdentities().map((source) => [source.path, source]));
	const visited = new Set(),
		queue = [ENTRY];
	while (queue.length) {
		const file = queue.shift();
		if (visited.has(file)) continue;
		visited.add(file);
		const bytes = readRepository(file, sources.get(file));
		sources.set(file, identity(file, bytes));
		for (const match of bytes
			.toString()
			.matchAll(/(?:import|export)\s+(?:[^'";]+?\s+from\s*)?['"]([^'"]+)['"]/gu)) {
			if (match[1].startsWith('node:')) continue;
			assert.ok(match[1].startsWith('.'), `Unexpected proof dependency: ${match[1]}`);
			queue.push(path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1])));
		}
	}
	return [...sources.values()].sort((a, b) => a.path.localeCompare(b.path));
}

/** Read one exact artifact claimed by an already authenticated immutable parent seal.
 * @param {DialFileIdentity} seal - Authenticated parent seal.
 * @param {string} relative - Run-relative artifact path.
 * @param {DialFileIdentity[]} parents - Append exact consumed identities to the derivation.
 * @returns {Buffer} Exact authenticated artifact bytes.
 */
function parentArtifact(seal, relative, parents) {
	const terminal = JSON.parse(readRepository(seal.path, seal).toString());
	assert.equal(terminal.state, 'accepted');
	const wanted = `${path.posix.dirname(seal.path)}/${relative}`;
	const matches = terminal.artifacts.filter((artifact) => artifact.path === wanted);
	assert.equal(matches.length, 1, `Parent must uniquely contain ${wanted}.`);
	const record = /** @type {DialFileIdentity} */ ({
		path: wanted,
		byteLength: matches[0].byteLength,
		sha256: matches[0].sha256,
	});
	parents.push(record);
	return readRepository(record.path, record);
}

/** Execute only the CPU worker; the main-thread I/O owner retains progress and cancellation.
 * @param {SkyContinuationProofWork} work - Immutable input bytes and controls.
 * @param {DialRun} run - Existing admitted run; never allocated here.
 * @param {() => void} guard - Time, storage and source-owner checks.
 * @returns {Promise<SkyContinuationProofReport>} Calculations after worker exit.
 */
async function runWorker(work, run, guard) {
	let phase = 'proof-worker',
		message = 'Starting the bounded CPU proof worker.',
		lastProgress = Date.now();
	run.progress(phase, message);
	const worker = new Worker(new URL('./proof.mjs', import.meta.url), {
		workerData: work,
		execArgv: [],
		resourceLimits: {maxOldGenerationSizeMb: 1536},
	});
	/** @type {SkyContinuationProofReport | null} */ let report = null;
	/** @type {Error | null} */ let failure = null;
	const timer = setInterval(() => {
		try {
			guard();
			if (Date.now() - lastProgress >= 20000) {
				run.progress(phase, `CPU proof remains active: ${message}`);
				lastProgress = Date.now();
			}
		} catch (error) {
			failure ??= error instanceof Error ? error : new Error(String(error));
			void worker.terminate();
		}
	}, 1000);
	try {
		await new Promise((resolve, reject) => {
			worker.on('message', (/** @type {SkyContinuationProofMessage} */ update) => {
				try {
					guard();
					if (update.kind === 'progress') {
						phase = update.phase;
						message = update.message;
						run.progress(phase, message);
						lastProgress = Date.now();
					} else {
						assert.equal(update.kind, 'result');
						assert.equal(report, null);
						report = update.report;
					}
				} catch (error) {
					failure ??= error instanceof Error ? error : new Error(String(error));
					void worker.terminate();
				}
			});
			worker.on('error', (error) => {
				failure ??= error instanceof Error ? error : new Error(String(error));
			});
			worker.once('exit', (code) => {
				clearInterval(timer);
				if (failure) reject(failure);
				else if (code !== 0 || report === null)
					reject(new Error(`C1 proof worker exited ${code} without complete results.`));
				else resolve(undefined);
			});
		});
	} finally {
		clearInterval(timer);
		await worker.terminate();
	}
	return report;
}

/** Allocate and seal one resource-debited C1 CPU proof; imports alone never run it.
 * @param {string} registrationRun - Exact accepted immutable C0 registration run.
 * @returns {Promise<SkyContinuationProofResult>} Verified terminal evidence and actual retained size.
 */
export async function continuationProof(registrationRun) {
	assert.ok(isMainThread, 'Only the serial continuation owner may allocate this CPU proof.');
	const registration = readRegistration(registrationRun);
	const admission = admitJob(registration, 'cpu', 'component', ALLOCATED_BYTES);
	const started = Date.now(),
		before = storage();
	const node = nodeIdentity();
	assert.deepEqual(node, registration.record.host.node, 'C1 must use the registered actual Node executable.');
	const parents = [
		registration.seal,
		registration.record.inputs,
		...(admission.usage.invalidEvidence ?? []).map((record) => record.seal),
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
	];
	const inputsRoot = path.posix.dirname(registration.record.inputs.path),
		inputSeal = verifyRun(inputsRoot);
	parents.push(inputSeal);
	const inputs = /** @type {DialInputs} */ (
		JSON.parse(readRepository(registration.record.inputs.path, registration.record.inputs).toString())
	);
	assert.equal(inputs.schemaId, 'sky-accuracy-inputs-v1');
	const measurementText = parentArtifact(inputSeal, 'measurements.tsv', parents).toString(),
		measurementIdentity = parents.at(-1);
	const baselineText = parentArtifact(inputSeal, 'native48-cpu.tsv', parents).toString(),
		baselineIdentity = parents.at(-1);
	const history = [3, 54].map((sequence) => {
		const original = registration.record.historicalRuns.find((record) => record.sequence === sequence);
		assert.ok(original && original.state === 'accepted');
		assert.deepEqual(verifyRun(original.run), original.seal);
		parents.push(original.seal);
		const control = /** @type {SkyGpuControl} */ (
			JSON.parse(parentArtifact(original.seal, 'control.json', parents).toString())
		);
		const execution = JSON.parse(parentArtifact(original.seal, 'execution.json', parents).toString());
		assert.equal(execution.failure, null);
		assert.equal(execution.execution.executionSucceeded, true);
		const terminal = JSON.parse(readRepository(original.seal.path, original.seal).toString());
		const oldView = terminal.sources.find(
			(source) => source.path === 'experiments/sky-accuracy-dials/numerics/view.js',
		);
		assert.ok(oldView);
		const snapshot = parentArtifact(original.seal, `sources/${oldView.path}.txt`, parents);
		assert.equal(snapshot.length, oldView.byteLength);
		assert.equal(sha256(snapshot), oldView.sha256);
		return {
			run: original.run,
			control,
			expected: execution.execution.browser.plan,
			originalSources: [oldView, parents.at(-1)],
		};
	});
	const sources = proofSources();
	const recipe = {
		parents,
		operation:
			'Run manufactured numerical/control/reference proofs in a bounded CPU worker and reproduce historical ordinary sparse coordinate hashes. No GPU, recurrence or full field is constructed.',
		parameters: {
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C1',
			allocatedBytes: ALLOCATED_BYTES,
			workerOldGenerationLimitMiB: 1536,
			node,
			admission,
		},
	};
	const run = createRun('c1-proofs', recipe);
	/** @type {DialFileIdentity[]} */ const written = [];
	/** Check before writes and on the worker watchdog without interrupting the I/O heartbeat. */
	function guard() {
		const current = run.guard();
		assert.ok(
			Date.now() - started < admission.timeoutMilliseconds,
			'C1 CPU job exhausted its registered wall-time allowance.',
		);
		assert.ok(
			current.retainedBytes - before.retainedBytes < ALLOCATED_BYTES - TERMINAL_RESERVE_BYTES,
			'C1 proof exhausted its bounded artifact allocation.',
		);
		assert.ok(
			current.retainedBytes - registration.initialStorage.retainedBytes <
				registration.budgets.newRetainedBytes - TERMINAL_RESERVE_BYTES,
		);
	}
	/** @param {string} file @param {unknown} value @param {DialDerivation} [derivation] */
	function write(file, value, derivation) {
		guard();
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
		assert.ok(
			storage().retainedBytes - before.retainedBytes + bytes.length < ALLOCATED_BYTES - TERMINAL_RESERVE_BYTES,
			'C1 proof write would exceed its artifact allocation.',
		);
		written.push(run.write(file, bytes, derivation));
	}
	let terminal = false;
	try {
		run.progress(
			'authentication',
			'Authenticated C0, original input tables, historical capture hashes and executed source snapshots.',
		);
		write('sources.json', sources);
		for (const [index, source] of sources.entries()) {
			write(`sources/${source.path}.txt`, readRepository(source.path, source), {
				parents: [source],
				operation: 'Snapshot the exact executed source bytes without rewriting the original source.',
			});
			if (index % 8 === 0 || index + 1 === sources.length)
				run.progress(
					'source-snapshot',
					'Retaining authenticated proof source snapshots.',
					index + 1,
					sources.length,
				);
			// Each write performs synchronous storage checks. Yield after every file
			// so the I/O owner's heartbeat cannot be starved by the whole inventory.
			await yieldMainThread();
		}
		write('admission.json', admission);
		write('tool.json', node);
		const report = await runWorker(
			{
				task: 'sky-continuation-c1-proofs',
				inputs,
				measurementText,
				measurementIdentity,
				baselineText,
				baselineIdentity,
				history,
			},
			run,
			guard,
		);
		write('result.json', report);
		run.progress(
			'reauthentication',
			'Rechecking every consumed parent and executed source before terminal sealing.',
		);
		for (const parent of parents) readRepository(parent.path, parent);
		for (const source of sources) readRepository(source.path, source);
		assert.deepEqual(nodeIdentity(), node, 'The executed Node binary changed while the proof was active.');
		guard();
		run.cleanup();
		const jobElapsedMilliseconds = Date.now() - started;
		const result = {
			checksPassed: true,
			gpuJobsExecuted: 0,
			jobElapsedMilliseconds,
			allocatedBytes: ALLOCATED_BYTES,
			report: written.at(-1),
		};
		assert.ok(
			Buffer.byteLength(JSON.stringify({sources, recipe, written, result})) * 2 + 65536 < TERMINAL_RESERVE_BYTES,
			'Terminal metadata reserve is insufficient.',
		);
		const seal = run.finish('accepted', result);
		terminal = true;
		assert.deepEqual(verifyRun(run.path), seal);
		const sealed = JSON.parse(readRepository(seal.path, seal).toString());
		assert.equal(sealed.state, 'accepted');
		const retainedBytes =
			seal.byteLength + sealed.artifacts.reduce((sum, artifact) => sum + artifact.byteLength, 0);
		assert.ok(retainedBytes <= ALLOCATED_BYTES, 'Sealed C1 proof exceeds its complete retained allocation.');
		return {run: run.path, seal, retainedBytes, jobElapsedMilliseconds};
	} catch (error) {
		if (!terminal) {
			run.progress('failure', String(error).slice(0, 4096));
			run.finish('failed', {
				message: String(error).slice(0, 8192),
				stack: String(error?.stack ?? '').slice(0, 8192),
				jobElapsedMilliseconds: Date.now() - started,
				allocatedBytes: ALLOCATED_BYTES,
				gpuJobsExecuted: 0,
			});
			terminal = true;
		}
		throw error;
	}
}

// The worker receives only validated inputs from the exported owner. Direct module
// execution and import on the main thread intentionally allocate and execute nothing.
if (!isMainThread && workerData?.task === 'sky-continuation-c1-proofs') {
	const report = calculateProof(/** @type {SkyContinuationProofWork} */ (workerData));
	parentPort.postMessage({kind: 'result', report});
}
