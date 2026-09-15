import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
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
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {observeMemory} from '../memory.mjs';
import {readMatchedOrdersParent} from '../matched-orders/read.mjs';
import {
	assertAltitudeTargetCase,
	altitudeTargetControl,
	altitudeTargetAttempts,
	readAltitudeTargetPrediction,
	validateAltitudeTargetDiagnostics,
	compareAltitudeSharedKnots,
	altitudeTargetProof,
} from './target-read.mjs';
import {altitudeConvergenceProof} from './proof.mjs';

const allocatedBytes = 6 * 1024 ** 2,
	terminalReserve = 1024 ** 2,
	browserModulePath = 'experiments/sky-accuracy-dials/continuation/browser.js',
	compilerModulePath = 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js',
	parentRun = 'tmp/experiments/sky-accuracy-dials/runs/00132-c-d55-raw';
/** @param {DialContinuationToolIdentity} expected @returns {Promise<void>} */
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
/** Execute one separately predicted raw H-control N4 altitude target.
 * The production compiler and existing browser evaluator are authenticated read-only.
 * Failed science is retained independently from execution acceptance.
 * @param {string} registrationRun @param {string} predictionRun @param {SkyAltitudeTargetCase} caseId
 * @returns {Promise<{run:string,seal:DialFileIdentity}>}
 */
export async function runAltitudeTarget(registrationRun, predictionRun, caseId) {
	const started = Date.now();
	assertAltitudeTargetCase(caseId);
	const registration = readRegistration(registrationRun),
		admission = admitJob(registration, 'gpu', 'component', allocatedBytes, 'C5');
	assert.ok(admission.usage.gpuConstructions < 36);
	await authenticateNode(registration.record.host.node);
	const prediction = readAltitudeTargetPrediction(registration, predictionRun, caseId),
		attempts = altitudeTargetAttempts(registration),
		parent = readMatchedOrdersParent(registration, parentRun),
		control = altitudeTargetControl(registration, caseId);
	assert.ok(
		!attempts.some((row) => row.caseId === caseId && row.state === 'accepted'),
		'This altitude target already has an accepted capture.',
	);
	const domains = control.buildRequest.transportSpec.domains,
		estimatedPeakFieldBytes =
			4 *
			domains.position.count *
			domains.solarZenith.count *
			(domains.outgoing.directionCount + 2 * domains.incoming.directionCount);
	assert.ok(estimatedPeakFieldBytes <= registration.budgets.scalarFieldBytes);
	const maximumJobMilliseconds = Math.min(15 * 60000, admission.timeoutMilliseconds),
		finalizationReserveMilliseconds = 2 * 60000,
		deadline = started + maximumJobMilliseconds - finalizationReserveMilliseconds;
	assert.ok(deadline > Date.now() + 1000);
	const closure = browserSources([browserModulePath, compilerModulePath]),
		sources = [...new Map([...sourceIdentities(), ...closure].map((id) => [id.path, id])).values()],
		sourceBytes = Buffer.from(
			JSON.stringify(
				sources.map((source) => ({...source, base64: readRepository(source.path, source).toString('base64')})),
			),
		),
		sourceArchive = gzipSync(sourceBytes, {level: 9}),
		controlBytes = Buffer.from(JSON.stringify(control));
	const parents = [
		...new Map(
			[
				registration.seal,
				registration.record.inputs,
				...prediction.identities,
				...parent.identities,
				...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
				...(admission.usage.invalidEvidence ?? []).map((row) => row.seal),
			].map((id) => [id.path, id]),
		).values(),
	];
	assert.ok(sourceArchive.length + controlBytes.length + 2 * 2 * 4 * 243 * 8 + 2 * 1024 ** 2 < allocatedBytes);
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Execute the prospectively predicted raw matched H N4 altitude target through the unchanged production compiler and continuation browser, retaining spectra, every original C0 envelope, work and bounded physically matched ground J1/J2 tap invariants.',
		parameters: {
			extensionId: 'compensation-attribution-v1',
			extensionStage: 'altitude-target',
			caseId,
			continuationRegistration: registration.run,
			jobKind: 'gpu',
			scope: 'component',
			phase: 'C5',
			predictionRun,
			admission,
			sourceIdentities: sources,
			browserSources: closure,
			node: registration.record.host.node,
			controls: control.controls,
			finalFirstOrder: 'raw',
			higherRepresentation: 'combined-raw',
			channels: [0, 8],
			screenTimes: registration.record.scopes.screen.times,
			probes: registration.probes,
			forecastPlan: prediction.plan,
			maximumJobMilliseconds,
			finalizationReserveMilliseconds,
			estimatedPeakFieldBytes,
			sharedKnotScope:
				'Only raw J1/J2 taps in the physical intersection of original P5500132 and target ground-probe support. Other shared knots remain unresolved.',
			hashScope:
				'Whole sparse hashes authenticate each own union; different altitude grids are never expected to share a whole-union hash.',
			physicalReferenceAdequate: false,
		},
	};
	const before = storage(),
		run = createRun(caseId === 'altitude-p51' ? 'altitude-p51' : 'altitude-p63', recipe),
		definition = identity(run.path + '/definition.json');
	let written = definition.byteLength,
		nextStorageGuard = 0;
	/** @type {SkyGpuHostResult|null} */ let execution = null;
	/** @type {string|null} */ let failure = null;
	/** @type {SkyContinuationChannelDiagnostics[]} */ const diagnostics = [];
	/** @type {DialFileIdentity[]} */ const channelArtifacts = [];
	/** @type {SkyContinuationMemoryObservation[]} */ const memory = [];
	let memoryObservations = 0,
		maximumPrivateBytes = 0,
		minimumAvailableBytes = Infinity;
	/** @param {boolean} [force] @param {boolean} [finalizing] @returns {void} */
	function guard(force = false, finalizing = false) {
		assert.ok(
			Date.now() < (finalizing ? started + maximumJobMilliseconds : deadline),
			'Altitude target elapsed budget exhausted.',
		);
		if (force || Date.now() >= nextStorageGuard) {
			const current = run.guard();
			nextStorageGuard = Date.now() + 5000;
			assert.ok(
				current.retainedBytes - registration.initialStorage.retainedBytes <=
					registration.budgets.newRetainedBytes,
			);
			assert.ok(current.retainedBytes - before.retainedBytes < allocatedBytes - terminalReserve);
		}
	}
	/** @param {string} name @param {unknown} value @param {DialDerivation} [derivation] @param {boolean} [finalizing] @returns {DialFileIdentity} */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: 'Derive ' + name + ' from the exact declared prediction, target controls and actual capture.',
		},
		finalizing = false,
	) {
		guard(true, finalizing);
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value) + '\n');
		assert.ok(written + bytes.length < allocatedBytes - terminalReserve);
		const id = run.write(name, bytes, derivation);
		written += id.byteLength;
		return id;
	}
	console.log(JSON.stringify({run: run.path, caseId, predictionRun, allocatedBytes, maximumJobMilliseconds}));
	try {
		write('altitude-convergence-plan.md', prediction.planBytes, {
			parents: [prediction.plan],
			operation: 'Copy the exact prospective altitude plan before target execution.',
		});
		write('control.json', controlBytes);
		write('admission.json', admission);
		write('sources.json.gz', sourceArchive, {
			parents: sources,
			operation: 'Encode exact source bytes as base64 JSON and gzip level9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: sourceBytes.length,
				uncompressedSha256: sha256(sourceBytes),
			},
		});
		write('proof.json', {math: altitudeConvergenceProof(), target: altitudeTargetProof(registration)});
		execution = await runGpu({
			repositoryRoot,
			scratchDirectory: run.scratchPath,
			chromePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
			control,
			sourceIdentities: closure,
			browserModulePath,
			compilerModulePath,
			expectedOrderCount: 4,
			compilerReportSchema: 'algorithm32-distant-sun-offline-wavelength-result-v1',
			expectedFieldIds: ['J1', 'J2', 'J3', 'J4'],
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
				memoryObservations++;
				maximumPrivateBytes = Math.max(maximumPrivateBytes, observation.privateBytes);
				minimumAvailableBytes = Math.min(minimumAvailableBytes, observation.availableBytes);
				memory.push(observation);
				if (memory.length > 128) memory.shift();
				assert.ok(observation.availableBytes >= registration.budgets.hostHeadroomBytes);
				assert.ok(observation.privateBytes <= registration.budgets.processPrivateBytes);
			},
			onChannel: async (channel) => {
				guard();
				assert.equal(channel.channel, [0, 8][channelArtifacts.length]);
				assert.deepEqual(channel.shape, {representationCount: 1, viewCount: 2, orderCount: 4, rayCount: 243});
				assert.ok(channel.compilerReport.peakLiveFieldBytes <= registration.budgets.scalarFieldBytes);
				const diagnostic = validateAltitudeTargetDiagnostics(channel.diagnostics, registration, control);
				const stem = 'channel-' + String(channel.channel).padStart(2, '0'),
					bytes = Buffer.alloc(channel.values.length * 8);
				for (const [index, value] of channel.values.entries()) bytes.writeDoubleLE(value, index * 8);
				const spectra = write(stem + '.f64', bytes);
				assert.equal(spectra.sha256, channel.spectraSha256);
				const diagnosticBytes = Buffer.from(JSON.stringify(diagnostic));
				const diagnosticArtifact = write(stem + '-diagnostics.json.gz', gzipSync(diagnosticBytes, {level: 9}), {
					parents: [definition, spectra],
					operation:
						'Retain every validated original C0 N1..N4 six-rule envelope and bounded raw ground stencil, gzip level9.',
					parameters: {
						schemaId: diagnostic.schemaId,
						uncompressedByteLength: diagnosticBytes.length,
						uncompressedSha256: sha256(diagnosticBytes),
					},
				});
				const {values, diagnostics: omitted, ...metadata} = channel;
				write(stem + '.json', {
					...metadata,
					schemaId: 'sky-altitude-target-channel-v1',
					spectra,
					diagnosticArtifact,
					layout: 'representation-view-order-ray-f64le-v1',
				});
				diagnostics.push(diagnostic);
				channelArtifacts.push(spectra);
			},
			timeoutMilliseconds: Math.max(1000, deadline - Date.now()),
		});
		assert.ok(execution.executionSucceeded, execution.failure ?? 'Altitude GPU target failed.');
		assert.ok(
			execution.servedSourcesReauthenticated && execution.cleanup.childExited && execution.cleanup.serverClosed,
		);
		assert.equal(channelArtifacts.length, 2);
		const sharedKnots = compareAltitudeSharedKnots(control, diagnostics, parent);
		write('shared-knots.json', sharedKnots);
		write('component-values.json', {
			schemaId: 'sky-altitude-target-components-v1',
			units: 'W m^-2 sr^-1 nm^-1',
			rows: diagnostics.flatMap((diagnostic, i) =>
				diagnostic.probes
					.filter((row) => row.methodId === 'reference-envelope' && row.representationId === 'grouped')
					.map((row) => ({...row, channel: [0, 8][i]})),
			),
		});
		for (const source of [...parents, ...sources]) readRepository(source.path, source);
		await authenticateNode(registration.record.host.node);
	} catch (error) {
		failure = String(error);
	}
	const cleanup = run.cleanup();
	try {
		write(
			'execution.json',
			{
				execution: execution
					? {
							...execution,
							channels: execution.channels.map(({diagnostics: omitted, ...metadata}) => metadata),
						}
					: null,
				failure,
				channels: channelArtifacts,
				cleanup,
			},
			undefined,
			true,
		);
		write(
			'work.json',
			{
				memoryObservations,
				retainedMemory: memory,
				maximumPrivateBytes,
				minimumAvailableBytes: Number.isFinite(minimumAvailableBytes) ? minimumAvailableBytes : null,
				channels: diagnostics.map((row, i) => ({
					channel: [0, 8][i],
					evaluationCount: row.evaluationCount,
					queryCount: row.queryCount,
					preparationEvaluationCount: row.preparationEvaluationCount,
				})),
				preparationEvaluationCount: diagnostics[0]?.preparationEvaluationCount ?? null,
				preparationCountedOnce: true,
				interpretation:
					'Per-channel counts are retained as reported; the browser prepares its shared reference plan once.',
			},
			undefined,
			true,
		);
	} catch (error) {
		failure = (failure ? failure + '; ' : '') + String(error);
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		extensionId: 'compensation-attribution-v1',
		extensionStage: 'altitude-target',
		caseId,
		scope: 'component',
		failure,
		jobElapsedMilliseconds: Date.now() - started,
		allocatedBytes,
		retainedChannelCount: channelArtifacts.length,
		physicalReferenceAdequate: false,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const terminal = JSON.parse(readRepository(seal.path, seal).toString());
	assert.ok(seal.byteLength + terminal.artifacts.reduce((sum, row) => sum + row.byteLength, 0) <= allocatedBytes);
	if (failure) throw new Error('Altitude target failed in ' + run.path + ': ' + failure);
	return {run: run.path, seal};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.equal(process.argv.length, 5);
	const [registration, prediction, caseId] = process.argv.slice(2);
	assertAltitudeTargetCase(caseId);
	console.log(JSON.stringify(await runAltitudeTarget(registration, prediction, caseId)));
}
