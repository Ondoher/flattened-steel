import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {gzipSync} from 'node:zlib';
import {browserSources} from '../../execution.mjs';
import {
	checkedAbsolute,
	createRun,
	identity,
	readRepository,
	repositoryRoot,
	sha256,
	sourceIdentities,
	storage,
	verifyRun,
} from '../../io/files.mjs';
import {runGpu} from '../../gpu/host.mjs';
import {verifyOrderImplementation} from '../../orders/proof.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {observeMemory} from '../memory.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {readMatchedOrdersParent, assertMatchedOrdersPrefix} from './read.mjs';
import {validateMatchedOrderDiagnostics, assessMatchedOrderPredictions} from './diagnostics.mjs';
import {matchedOrdersProof} from './proof.mjs';

const topic = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials';
const planOwner = `${topic}/matched-order-plan.md`,
	attributionOwner = `${topic}/attribution-plan.md`;
const browserModulePath = 'experiments/sky-accuracy-dials/continuation/matched-orders/browser.js';
const compilerModulePath = 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
const allocatedBytes = 6 * 1024 ** 2,
	terminalReserve = 768 * 1024;

/** Authenticate the original Node executable before and after bounded execution.
 * @param {DialContinuationToolIdentity} expected - Original C0 executable bytes/version.
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

/** Execute only the preregistered matched raw H N1-N6 diagnostic.
 * The original N4 build request, sparse union and selectors remain exact. The
 * runner owns authentication, bounded transport, all evidence and cleanup.
 * Failed scientific forecasts are retained independently from capture acceptance.
 * @param {string} C0 - Exact original continuation registration run.
 * @param {string} planPath - Exact owning matched-order prospective plan.
 * @param {'matched-h-n6'|'matched-p55-n6'} caseId - Explicit matched original construction.
 * @param {string} [prefixRun] - Exact original accepted H capture.
 * @param {string} [predictionRun] - Required separately sealed P55 response prediction.
 * @returns {Promise<DialExecutionResult>} Newly sealed capture, or explicit failure after sealing.
 */
export async function runMatchedSixOrders(C0, planPath, caseId, prefixRun, predictionRun) {
	assert.ok(['matched-h-n6', 'matched-p55-n6'].includes(caseId));
	const p55 = caseId === 'matched-p55-n6';
	const requiredPrefix = `tmp/experiments/sky-accuracy-dials/runs/${p55 ? '00132-c-d55-raw' : '00103-c-r0-scr'}`;
	prefixRun ??= requiredPrefix;
	assert.equal(prefixRun, requiredPrefix);
	assert.equal(planPath, planOwner);
	const registration = readRegistration(C0);
	await authenticateNode(registration.record.host.node);
	const parent = readMatchedOrdersParent(registration, prefixRun);
	/** @type {DialFileIdentity[]} */ const predictionParents = [];
	if (p55) {
		assert.ok(
			typeof predictionRun === 'string' && predictionRun.length > 0,
			'P55 requires a separately sealed prospective prediction.',
		);
		const prediction = acceptedMechanismInput(predictionRun);
		assert.equal(prediction.terminal.recipe.parameters.continuationRegistration, registration.run);
		const parameters = /** @type {{continuationRegistration:string,extensionStage?:string}} */ (
			prediction.terminal.recipe.parameters
		);
		assert.equal(parameters.extensionStage, 'matched-p55-predict');
		const artifact = mechanismArtifact(prediction, 'p55-prediction.json');
		/** @type {{schemaId:string,rows:SkyOrderTransferPrediction[]}} */ const values = JSON.parse(
			readRepository(artifact.path, artifact).toString(),
		);
		assert.equal(values.schemaId, 'sky-matched-p55-prediction-v1');
		assert.deepEqual(values.rows.map((row) => `${row.probeId}:${row.channel}`).sort(), [
			'p-0930-5-7:0',
			'p-0930-5-7:8',
			'p-1230-3-5:0',
			'p-1230-3-5:8',
		]);
		assert.ok(values.rows.every((row) => row.admitted && row.forecasts.length === 2));
		for (const row of values.rows)
			assert.deepEqual(
				row.forecasts.map((model) => model.model),
				['damped-log-ratio', 'last-log-step'],
			);
		const transferPlan = identity(`${topic}/matched-order-transfer-plan.md`);
		const savedPlan = mechanismArtifact(prediction, 'matched-order-transfer-plan.md');
		assert.equal(savedPlan.sha256, transferPlan.sha256);
		assert.equal(savedPlan.byteLength, transferPlan.byteLength);
		assert.ok(
			prediction.terminal.recipe.parents.some(
				(item) => item.sha256 === 'df4eb32c020fbc2fe14b7c68a6d0b64292fd21d7fb349ba9793ae20dd9aff95c',
			),
		);
		predictionParents.push(prediction.seal, artifact, savedPlan, transferPlan);
	} else assert.equal(predictionRun, undefined);
	const planBytes = readRepository(planPath),
		plan = identity(planPath, planBytes);
	assert.ok(
		planBytes.toString().includes('compensation-attribution-v1') && planBytes.toString().includes(`\`${caseId}\``),
	);
	const attributionBytes = readRepository(attributionOwner),
		attribution = identity(attributionOwner, attributionBytes);
	const admission = admitJob(registration, 'gpu', 'component', allocatedBytes, 'C5');
	assert.ok(admission.usage.gpuConstructions < 36);
	assert.ok(
		admission.usage.gpuElapsedMilliseconds < 18 * 3600000 && admission.usage.cpuElapsedMilliseconds <= 8 * 3600000,
	);
	const maximumJobMilliseconds = Math.min(15 * 60000, admission.timeoutMilliseconds),
		finalizationReserveMilliseconds = 2 * 60000;
	assert.ok(maximumJobMilliseconds > finalizationReserveMilliseconds + 1000);
	const closure = browserSources([browserModulePath, compilerModulePath]);
	const sources = [...new Map([...sourceIdentities(), ...closure].map((item) => [item.path, item])).values()];
	const sourceBytes = Buffer.from(
		JSON.stringify(
			sources.map((source) => ({...source, base64: readRepository(source.path, source).toString('base64')})),
		),
	);
	const sourceArchive = gzipSync(sourceBytes, {level: 9});
	const started = Date.now(),
		deadlineEpochMilliseconds = started + maximumJobMilliseconds - finalizationReserveMilliseconds;
	/** @type {SkyMatchedOrdersControl} */ const control = {
		...parent.control,
		channels: [0, 8],
		prefixControl: parent.control,
		executionSchemaId: 'sky-matched-six-order-control-v1',
		actualOrders: [1, 2, 3, 4, 5, 6],
		deadlineEpochMilliseconds,
	};
	const controlBytes = Buffer.from(JSON.stringify(control));
	assert.ok(sourceArchive.length + controlBytes.length + 2 * 4 * 5 * 6 * 243 * 8 + 2 * 1024 ** 2 < allocatedBytes);
	const parents = [
		...predictionParents,
		registration.seal,
		registration.record.inputs,
		plan,
		attribution,
		...parent.identities,
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		...(admission.usage.invalidEvidence ?? []).map((row) => row.seal),
	];
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Execute unchanged raw receiver-local J1..J6 on the exact original H build request. Reproduce its complete sparse-union N4 fields, spectra and independent view envelopes; extend grouped envelopes through explicit actual-order slot mappings.',
		parameters: {
			extensionId: 'compensation-attribution-v1',
			extensionStage: 'matched-orders',
			continuationRegistration: C0,
			jobKind: 'gpu',
			scope: 'component',
			phase: 'C5',
			caseId,
			admission,
			prefixRun,
			channels: [0, 8],
			probes: registration.probes,
			actualOrders: [1, 2, 3, 4, 5, 6],
			sourceIdentities: sources,
			browserSources: closure,
			node: registration.record.host.node,
			maximumJobMilliseconds,
			finalizationReserveMilliseconds,
			spectralScope: 'Two channels and all forty original C0 probes; no full-boundary qualification.',
			predictionScope:
				'Exact N4 prefix and complete actual N6 capture determine execution acceptance. Held increment/sign/ratio forecasts and envelope admission remain separate records; physical-substitution prediction4 requires independently admitted references.',
			retention:
				'Sparse fields stay in RAM for one channel; no full texture, scene package or infinite-tail estimate is retained.',
		},
	};
	const before = storage(),
		run = createRun(caseId, recipe),
		definition = identity(`${run.path}/definition.json`);
	let writtenBytes = definition.byteLength;
	/** @type {SkyGpuHostResult|null} */ let execution = null;
	/** @type {{message:string,stack?:string}|null} */ let failure = null;
	/** @type {DialFileIdentity[]} */ const channelArtifacts = [];
	/** @type {DialOrdersParityChannel[]} */ const parity = [];
	/** @type {SkyMatchedOrderDiagnostics[]} */ const diagnostics = [];
	/** @type {SkyContinuationMemoryObservation[]} */ const memory = [];
	/** Retain compact exclusive evidence while reserving immutable terminal bytes.
	 * @param {string} name - New run-local file.
	 * @param {unknown} value - JSON or exact bytes.
	 * @param {DialDerivation} [derivation] - Exact parent/operation chain.
	 * @returns {DialFileIdentity} Closed artifact identity.
	 */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: `Derive ${name} from the frozen matched H controls and actual execution.`,
		},
	) {
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`);
		assert.ok(
			writtenBytes + bytes.length < allocatedBytes - terminalReserve,
			'Matched-order retention reserve exhausted.',
		);
		const output = run.write(name, bytes, derivation);
		writtenBytes += output.byteLength;
		return output;
	}
	/** Enforce the scientific deadline and immutable resource allocation.
	 * @returns {void} Throws promptly through host progress and resource observations.
	 */
	function guard() {
		assert.ok(Date.now() < deadlineEpochMilliseconds, 'Matched-order scientific deadline reached.');
		const current = run.guard();
		assert.ok(current.retainedBytes - before.retainedBytes < allocatedBytes - terminalReserve);
		assert.ok(
			current.retainedBytes - registration.initialStorage.retainedBytes <= registration.budgets.newRetainedBytes,
		);
	}
	console.log(
		JSON.stringify({run: run.path, caseId, channels: control.channels, maximumJobMilliseconds, allocatedBytes}),
	);
	try {
		write('matched-order-plan.md', planBytes, {
			parents: [plan],
			operation: 'Retain the exact prospective matched-order plan before compute.',
		});
		write('attribution-plan.md', attributionBytes, {
			parents: [attribution],
			operation: 'Retain the exact governing attribution plan before compute.',
		});
		write('control.json', controlBytes);
		write('admission.json', admission);
		write('sources.json.gz', sourceArchive, {
			parents: sources,
			operation: 'Retain exact source identities and base64 bytes as JSON, gzip level9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: sourceBytes.length,
				uncompressedSha256: sha256(sourceBytes),
			},
		});
		guard();
		run.progress('proof', 'Verifying unchanged kernels and manufactured actual-order mappings.', 0, 2);
		write('proof.json', {
			orders: verifyOrderImplementation(parent.control),
			matched: matchedOrdersProof(parent.control),
		});
		guard();
		execution = await runGpu({
			repositoryRoot,
			scratchDirectory: run.scratchPath,
			chromePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
			control,
			sourceIdentities: closure,
			browserModulePath,
			compilerModulePath,
			expectedOrderCount: 6,
			compilerReportSchema: 'sky-order-wavelength-result-v1',
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
				assert.equal(channel.channel, control.channels[channelArtifacts.length]);
				const authority = parent.channels.find((row) => row.channel === channel.channel),
					stem = `channel-${String(channel.channel).padStart(2, '0')}`;
				assert.deepEqual(channel.shape, {...authority.expected.shape, orderCount: 6});
				const bytes = Buffer.alloc(channel.values.length * 8);
				for (const [index, value] of channel.values.entries()) bytes.writeDoubleLE(value, index * 8);
				const spectrum = write(`${stem}.f64`, bytes);
				assert.equal(spectrum.sha256, channel.spectraSha256);
				// Preserve bounded browser evidence even if the subsequent strict prefix or payload check fails.
				const payload = channel.compilerReport.matchedOrderDiagnostics;
				const diagnosticArtifact = write(
					`${stem}-diagnostics.json.gz`,
					gzipSync(Buffer.from(JSON.stringify(payload)), {level: 9}),
					{
						parents: [definition, ...authority.identities, spectrum],
						operation:
							'Preserve the bounded actual-order browser payload before validation; acceptance requires the separately retained validation and parity result.',
					},
				);
				const {values, compilerReport, ...metadata} = channel;
				const {matchedOrderDiagnostics: omitted, ...compactCompiler} = compilerReport;
				write(`${stem}.json`, {
					...metadata,
					compilerReport: compactCompiler,
					schemaId: 'sky-matched-six-order-spectra-v1',
					actualOrders: control.actualOrders,
					units: 'W m^-2 sr^-1 nm^-1',
					spectra: spectrum,
					diagnosticArtifact,
					layout: 'representation-view-six-order-ray-f64le-v1',
				});
				let parityFailure = null;
				try {
					assertMatchedOrdersPrefix(compilerReport.prefixProof, authority.expected);
				} catch (error) {
					parityFailure = String(error);
				}
				parity.push({
					channel: channel.channel,
					parentMetadata: authority.identities[0],
					parentSpectra: authority.identities[1],
					expected: authority.expected,
					actual: /** @type {SkyMatchedOrdersPrefix} */ (compilerReport.prefixProof),
					passed: parityFailure === null,
					failure: parityFailure,
				});
				assert.equal(parityFailure, null, parityFailure ?? undefined);
				const validated = validateMatchedOrderDiagnostics(payload, registration.probes, channel.channel);
				assert.equal(validated.queryCount, authority.referenceQueryCount);
				assert.equal(validated.preparationEvaluationCount, authority.referencePreparationEvaluationCount);
				for (const row of validated.rows)
					assert.equal(row.sceneId, registration.probeScenes.find((scene) => scene.time === row.time).id);
				diagnostics.push(validated);
				channelArtifacts.push(spectrum);
				guard();
			},
			timeoutMilliseconds: Math.max(1000, deadlineEpochMilliseconds - Date.now()),
		});
		assert.ok(execution.executionSucceeded, execution.failure ?? 'Matched-order browser failed.');
		assert.ok(
			execution.servedSourcesReauthenticated && execution.cleanup.childExited && execution.cleanup.serverClosed,
		);
		assert.equal(channelArtifacts.length, 2);
		for (const source of [...parents, ...sources]) readRepository(source.path, source);
		await authenticateNode(registration.record.host.node);
	} catch (error) {
		failure = {message: String(error), stack: error.stack};
	}
	const cleanup = run.cleanup();
	const predictions = diagnostics.flatMap(assessMatchedOrderPredictions);
	const envelopesAdmitted =
		diagnostics.length === 2 &&
		diagnostics.every((value) =>
			value.rows
				.filter((row) => row.methodId === 'reference-envelope')
				.every((row) => row.errorAllowance !== null),
		);
	try {
		write('prefix.json', {
			schemaId: 'sky-matched-order-prefix-v1',
			parentRun: parent.run,
			channels: parity,
			passed: parity.length === 2 && parity.every((row) => row.passed),
		});
		write('predictions.json', {
			schemaId: 'sky-matched-order-predictions-v1',
			rows: predictions,
			envelopesAdmitted,
			physicalSubstitution: {
				state: 'unresolved',
				reason: 'Requires separately admitted physical P1/P2 references and matched residual/SSE assessment.',
			},
			limitations: [
				'Two added finite orders do not establish an infinite-tail bound.',
				'View allowances do not quantify recurrence-field error.',
				'Channels0/8 are a partial spectral diagnostic.',
			],
		});
		const compactExecution = execution
			? {
					...execution,
					channels: execution.channels.map((channel) => {
						const {matchedOrderDiagnostics: omitted, ...compilerReport} = channel.compilerReport;
						return {...channel, compilerReport};
					}),
				}
			: null;
		write('execution.json', {execution: compactExecution, failure, channels: channelArtifacts, cleanup});
		write('work.json', {
			memory,
			prefixEvaluationCount: diagnostics.reduce((sum, row) => sum + row.prefixEvaluationCount, 0),
			extensionEvaluationCount: diagnostics.reduce((sum, row) => sum + row.extensionEvaluationCount, 0),
			preparationEvaluationCount: diagnostics[0]?.preparationEvaluationCount ?? null,
			preparationCountedOnce: true,
		});
	} catch (error) {
		failure ??= {message: String(error), stack: error.stack};
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		caseId,
		scope: 'component',
		failure,
		jobElapsedMilliseconds: Date.now() - started,
		channelCount: channelArtifacts.length,
		prefixParityPassed: parity.length === 2 && parity.every((row) => row.passed),
		envelopesAdmitted,
		predictionsPassed: predictions.length === 8 && predictions.every((row) => row.state === 'passed'),
		physicalSubstitutionAssessed: false,
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
		throw new Error(`Matched-order capture failed in ${run.path}: ${failure?.message ?? 'seal admission'}`);
	return {run: run.path, seal, accepted};
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
	assert.ok(
		process.argv.length >= 5 && process.argv.length <= 7,
		'Usage: run.mjs C0 matched-order-plan case [original-prefix-run] [prediction-run]',
	);
	await runMatchedSixOrders(
		process.argv[2],
		process.argv[3],
		/** @type {'matched-h-n6'|'matched-p55-n6'} */ (process.argv[4]),
		process.argv[5],
		process.argv[6],
	);
}
