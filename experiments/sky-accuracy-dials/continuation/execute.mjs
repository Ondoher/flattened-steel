import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {gzipSync, gunzipSync} from 'node:zlib';
import {
	createRun,
	identity,
	listFiles,
	readRepository,
	repositoryRoot,
	sha256,
	storage,
	verifyRun,
} from '../io/files.mjs';
import {browserSources, loadInputs} from '../execution.mjs';
import {deriveProfile} from '../numerics/profile.js';
import {runGpu} from '../gpu/host.mjs';
import {continuationCase} from './cases.mjs';
import {readRegistration} from './registration/run.mjs';
import {admitJob} from './resources.mjs';
import {observeMemory} from './memory.mjs';

const browserModulePath = 'experiments/sky-accuracy-dials/continuation/browser.js';
const compilerModulePath = 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';

/** Authenticate controls, selectors and resources without allocating a run or a GPU context.
 * @param {string} registrationRun - Authenticated frozen C0 run.
 * @param {string} caseId - Exact registered case name.
 * @param {SkyContinuationJobScope} scope - Screen or full construction.
 * @param {readonly number[]} [views] - Explicit retained final-view selectors.
 * @returns {SkyContinuationPrepared} Read-only preflight result.
 */
export function prepareContinuation(registrationRun, caseId, scope, views = [8, 16]) {
	assert.ok(scope === 'screen' || scope === 'full');
	assert.ok(scope !== 'full' || views.length === 1, 'Full captures retain one view selection.');
	const registration = readRegistration(registrationRun),
		candidate = continuationCase(caseId),
		inputs = loadInputs();
	assert.ok(
		isDeepStrictEqual(
			registration.record.constructionCases.find((item) => item.id === caseId),
			candidate,
		),
		'Case differs from its frozen registration.',
	);
	const profile = deriveProfile(inputs.native48, {...candidate.controls, viewIntervals: views});
	assert.ok(profile.layout.estimatedPeakFieldBytes <= registration.budgets.scalarFieldBytes);
	const selection = scope === 'full' ? registration.record.scopes.full : registration.record.scopes.screen;
	const scenes = inputs.scenes.filter((scene) => selection.times.includes(scene.time));
	const admission = admitJob(registration, 'gpu', scope, (scope === 'full' ? 13 : 4) * 1024 ** 2, candidate.phase);
	/** @type {SkyGpuControl} */
	const control = {
		buildRequest: profile.buildRequest,
		controls: profile.controls,
		scenes,
		channels: selection.channels,
		continuation: {
			finalFirstOrder: candidate.finalFirstOrder,
			referenceMode: 'component',
			probes: registration.probes,
			probeScenes: registration.probeScenes,
			...(candidate.phase === 'C2'
				? {
						groundDensityProbes: ['09:30:4:7', '09:30:5:7', '12:30:3:5', '12:30:4:4'].map((key) => {
							const probe = registration.probes.find((p) => `${p.time}:${p.gridX}:${p.gridY}` === key);
							assert.ok(probe, 'C2 ground witness is missing from the frozen component registration.');
							return probe;
						}),
					}
				: {}),
		},
	};
	const sources = browserSources([browserModulePath, compilerModulePath]);
	return {registration, candidate, profile, selection, admission, control, sources};
}

/** Execute one registered C1/C2 construction serially, preserving compact immutable evidence.
 * Main spectra retain their existing shape; component references have separate typed diagnostics.
 * @param {string} registrationRun - Authenticated frozen C0 run.
 * @param {string} caseId - Exact registered case name.
 * @param {SkyContinuationJobScope} scope - Screen or full construction.
 * @param {readonly number[]} [views] - Explicit retained final-view selectors.
 * @returns {Promise<DialExecutionResult>} Sealed construction result.
 */
export async function executeContinuation(registrationRun, caseId, scope, views = [8, 16]) {
	const {registration, candidate, profile, selection, admission, control, sources} = prepareContinuation(
		registrationRun,
		caseId,
		scope,
		views,
	);
	const snapshot = new Map(
		[...sources, ...listFiles('experiments/sky-accuracy-dials').map((file) => identity(file))].map((item) => [
			item.path,
			item,
		]),
	);
	const sourceBytes = Buffer.from(
		JSON.stringify(
			[...snapshot.values()].map((source) => ({
				...source,
				base64: readRepository(source.path, source).toString('base64'),
			})),
		),
	);
	const compressedSources = gzipSync(sourceBytes, {level: 9});
	assert.deepEqual(gunzipSync(compressedSources), sourceBytes, 'Source archive must round-trip exact bytes.');
	const controlBytes = Buffer.from(JSON.stringify(control));
	assert.deepEqual(
		JSON.parse(controlBytes.toString()),
		JSON.parse(JSON.stringify(control, null, 2)),
		'Compact control serialization must preserve every retained value.',
	);
	const spectrumBytes =
		control.channels.length *
		control.controls.representations.length *
		control.controls.viewIntervals.length *
		control.controls.solarInterpolations.length *
		4 *
		control.scenes.length *
		81 *
		8;
	assert.ok(
		compressedSources.length + controlBytes.length + spectrumBytes + 1024 ** 2 < admission.allocatedBytes,
		'Exact source/control/spectrum forecast leaves less than1MiB for diagnostics, manifests and sealing.',
	);
	const recipe = {
		parents: [
			registration.seal,
			registration.record.inputs,
			...(admission.usage.invalidEvidence ?? []).map((record) => record.seal),
			...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		],
		operation:
			'Generate the pinned N4 recurrence, capture the complete declared sparse union, evaluate ordinary and independent component views, retain spectra/diagnostics, and discard transient fields.',
		parameters: {
			continuationRegistration: registration.run,
			jobKind: 'gpu',
			scope,
			phase: candidate.phase,
			caseId,
			controls: profile.controls,
			finalFirstOrder: candidate.finalFirstOrder,
			hypothesis: candidate.hypothesis,
			predictionRun: null,
			admission,
			sourceIdentities: [...snapshot.values()],
			primarySelector:
				candidate.finalFirstOrder === 'factored' ? 'grouped with density-factored J1' : 'grouped with raw J1',
			componentScope: 'Frozen five-time probe set; only channels0/8/24/30; separate from ordinary scoring.',
		},
	};
	const started = Date.now(),
		initialBytes = storage().retainedBytes;
	const run = createRun(`c-${caseId}-${scope === 'full' ? 'full' : 'scr'}`, recipe);
	console.log(JSON.stringify({run: run.path, caseId, scope, admission, layout: profile.layout}));
	/** @type {SkyContinuationMemoryObservation[]} */ const memory = [];
	/** @type {DialFileIdentity[]} */ const channelArtifacts = [];
	/** @type {SkyGpuHostResult | null} */ let execution = null;
	/** @type {{message: string, stack?: string} | null} */ let failure = null;
	const guard = () => {
		const current = run.guard();
		assert.ok(
			current.retainedBytes - registration.initialStorage.retainedBytes <= registration.budgets.newRetainedBytes,
		);
		assert.ok(
			current.retainedBytes - initialBytes < admission.allocatedBytes - 128 * 1024,
			'Job evidence forecast exhausted; preserve failure/seal reserve.',
		);
	};
	try {
		run.write('control.json', controlBytes, {
			parents: recipe.parents,
			operation:
				'Serialize the unchanged control as compact UTF-8 JSON; preserve all numeric and selector values.',
		});
		run.write('profile-layout.json', profile.layout);
		run.write('admission.json', admission);
		guard();
		run.write('sources.json.gz', compressedSources, {
			parents: [...snapshot.values()],
			operation:
				'Preserve exact source path/size/hash/base64 records as UTF-8 JSON, compressed by Node zlib gzip level9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: sourceBytes.length,
				uncompressedSha256: sha256(sourceBytes),
				node: process.version,
				compression: 'gzip-level-9',
			},
		});
		guard();
		execution = await runGpu({
			repositoryRoot,
			scratchDirectory: run.scratchPath,
			chromePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
			control,
			sourceIdentities: sources,
			browserModulePath,
			compilerModulePath,
			readSource: async (file) => {
				const source = sources.find((item) => item.path === file);
				assert.ok(source, 'Requested source absent from authenticated closure.');
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
					observation.availableBytes >= registration.budgets.hostHeadroomBytes,
					'Host memory headroom fell below2GiB.',
				);
				assert.ok(
					observation.privateBytes <= registration.budgets.processPrivateBytes,
					'Owned process private-memory cap exceeded.',
				);
			},
			onChannel: async (channel) => {
				guard();
				const stem = `channel-${String(channel.channel).padStart(2, '0')}`;
				const bytes = Buffer.alloc(channel.values.length * 8);
				for (let index = 0; index < channel.values.length; index++)
					bytes.writeDoubleLE(channel.values[index], index * 8);
				const artifact = run.write(`${stem}.f64`, bytes);
				const {values, diagnostics, ...metadata} = channel;
				const diagnosticBytes = diagnostics ? Buffer.from(JSON.stringify(diagnostics)) : null;
				const diagnosticArtifact = diagnostics
					? run.write(`${stem}-diagnostics.json.gz`, gzipSync(diagnosticBytes, {level: 9}), {
							parents: recipe.parents,
							operation:
								'Losslessly gzip the validated component diagnostic JSON; UTF-8 JSON.stringify followed by Node zlib gzip level9.',
							parameters: {
								channel: channel.channel,
								schemaId: diagnostics.schemaId,
								node: process.version,
								uncompressedByteLength: diagnosticBytes.length,
								uncompressedSha256: sha256(diagnosticBytes),
							},
						})
					: null;
				run.write(`${stem}.json`, {
					...metadata,
					spectra: artifact,
					diagnosticArtifact,
					layout: 'representation-view-order-ray-f64le-v1',
				});
				channelArtifacts.push(artifact);
				console.log(
					JSON.stringify({
						run: run.path,
						channel: channel.channel,
						completed: channelArtifacts.length,
						total: selection.channels.length,
					}),
				);
			},
			timeoutMilliseconds: admission.timeoutMilliseconds,
		});
		assert.ok(execution.executionSucceeded, execution.failure ?? 'GPU continuation failed.');
		assert.equal(channelArtifacts.length, selection.channels.length);
	} catch (error) {
		failure = {message: String(error), stack: error.stack};
	}
	const cleanup = run.cleanup();
	const compactExecution = execution
		? {...execution, channels: execution.channels.map(({diagnostics, ...channel}) => channel)}
		: null;
	run.write('execution.json', {execution: compactExecution, failure, channels: channelArtifacts, cleanup});
	run.write('memory.json', {
		observations: memory,
		maximumPrivateBytes: Math.max(0, ...memory.map((row) => row.privateBytes)),
		limit: registration.budgets.processPrivateBytes,
	});
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		caseId,
		scope,
		failure,
		jobElapsedMilliseconds: Date.now() - started,
		retainedChannelCount: channelArtifacts.length,
	});
	verifyRun(run.path);
	const accepted = JSON.parse(readRepository(seal.path, seal).toString()).state === 'accepted';
	console.log(
		JSON.stringify({run: run.path, accepted, failure, retainedBytes: storage().retainedBytes - initialBytes}),
	);
	if (!accepted) throw new Error(`Continuation failed in ${run.path}: ${failure?.message ?? 'seal verification'}`);
	return {run: run.path, seal, accepted};
}
