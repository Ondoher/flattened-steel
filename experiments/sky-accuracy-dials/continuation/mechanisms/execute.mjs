import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {
	createRun,
	readRepository,
	repositoryRoot,
	sha256,
	sourceIdentities,
	storage,
	verifyRun,
} from '../../io/files.mjs';
import {runGpu} from '../../gpu/host.mjs';
import {observeMemory} from '../memory.mjs';
import {prepareMechanism} from './prepare.mjs';

/** Execute exactly one registered screen after all parent, scope and resource gates.
 * Field textures and sparse values are transient; retain spectra, exact identities,
 * bounded diagnostics and execution/source provenance in a fresh immutable run.
 * @param {string} registrationRun - Original C0 registration.
 * @param {string} caseRegistrationRun - Exact prospective mechanism inventory.
 * @param {string} caseId - Registered C3/C4 target.
 * @param {SkyMechanismOptions} [options] - Mandatory prediction on joint targets.
 * @returns {Promise<string>} Accepted immutable screen path.
 */
export async function runMechanism(registrationRun, caseRegistrationRun, caseId, options = {}) {
	const prepared = prepareMechanism(registrationRun, caseRegistrationRun, caseId, options);
	const {
		registration,
		caseRegistration,
		candidate,
		profile,
		selection,
		admission,
		control,
		sources,
		browserModulePath,
		compilerModulePath,
		compilerReportSchema,
		expectedFieldIds,
		prediction,
	} = prepared;
	const parents = [
		registration.seal,
		caseRegistration.seal,
		caseRegistration.artifact,
		caseRegistration.record.allocation,
		caseRegistration.record.reusedH,
		registration.record.inputs,
		...(prediction ? [prediction.seal] : []),
		...(admission.usage.invalidEvidence ?? []).map((item) => item.seal),
	];
	const snapshot = [...new Map([...sources, ...sourceIdentities()].map((item) => [item.path, item])).values()];
	const sourceBytes = Buffer.from(
			JSON.stringify(
				snapshot.map((source) => ({...source, base64: readRepository(source.path, source).toString('base64')})),
			),
		),
		compressedSources = gzipSync(sourceBytes, {level: 9});
	const controlBytes = Buffer.from(`${JSON.stringify(control)}\n`);
	const storageForecast = {
		compressedSources: compressedSources.length,
		control: controlBytes.length,
		spectra: selection.channels.length * 2 * 4 * selection.times.length * 81 * 8,
		diagnostics: 1.5 * 1024 ** 2,
		metadataAndSeal: 1024 ** 2,
	};
	assert.ok(
		Object.values(storageForecast).reduce((sum, bytes) => sum + bytes, 0) < admission.allocatedBytes,
		'Mechanism provenance and diagnostic forecast exceeds the admitted record size.',
	);
	const recipe = {
		parents,
		operation:
			'Execute the exact preregistered N4 mechanism, retaining grouped spectra, independent component diagnostics and actual source-field identities while disposing all transient fields.',
		parameters: {
			continuationRegistration: registration.run,
			mechanismRegistration: caseRegistration.run,
			jobKind: 'gpu',
			scope: 'screen',
			phase: candidate.phase,
			caseId,
			controls: profile.controls,
			finalFirstOrder: candidate.finalFirstOrder,
			higherRepresentation: candidate.higherRepresentation,
			referenceMode: candidate.referenceMode,
			hypothesis: candidate.hypothesis,
			predictionRun: prediction?.run ?? null,
			admission,
			sourceIdentities: snapshot,
			compilerReportSchema,
			expectedFieldIds,
			fieldHashDerivation:
				candidate.higherRepresentation === 'combined-raw'
					? 'Pure Jn Float32 words and the left-fold Float32 J1-through-Jn sum.'
					: 'Seven actual pure source fields. J1 cumulative hash equals raw J1; each higher cumulative hash is the separate left-fold Float32 sum of that species from J2 through the emitted order. Species are never added for hashing.',
			estimatedPeakFieldBytes: prepared.estimatedPeakFieldBytes,
			storageForecast,
			storageForecastBasis:
				'Exact compressed sources, compact controls and spectra; 1.5 MiB diagnostic forecast exceeds the 1.062 MB high-entropy adaptive serialization stress. Metadata/seal forecast is empirical, with exact retained-write guards and a 1 MiB terminal reserve.',
			primarySelector: `grouped; final-J1=${candidate.finalFirstOrder}; higher=${candidate.higherRepresentation}; views8/16`,
			componentScope:
				'The fixed forty-probe four-channel reference scope is distinct from the three-time six-channel ordinary screen; raw ground-J2 witnesses are retained only for combined-raw recurrence.',
		},
	};
	const started = Date.now(),
		initialBytes = storage().retainedBytes,
		run = createRun(`c-${caseId}`, recipe);
	const reserve = 1024 ** 2;
	/** @type {SkyContinuationMemoryObservation[]} */ const memory = [];
	/** @type {DialFileIdentity[]} */ const channelArtifacts = [];
	/** @type {SkyGpuHostResult | null} */ let execution = null;
	/** @type {string | null} */ let failure = null;
	let maximumPrivateBytes = 0,
		minimumAvailableBytes = Infinity,
		memoryObservationCount = 0;
	function guard() {
		const current = run.guard();
		assert.ok(
			Date.now() - started < admission.timeoutMilliseconds,
			'Mechanism screen exhausted its elapsed allowance.',
		);
		assert.ok(
			current.retainedBytes - registration.initialStorage.retainedBytes <= registration.budgets.newRetainedBytes,
		);
		assert.ok(
			current.retainedBytes - initialBytes < admission.allocatedBytes - reserve,
			'Mechanism artifact forecast exhausted; terminal reserve protected.',
		);
	}
	/** Preflight an artifact before its irreversible retained write.
	 * @param {string} name - Fresh run-local artifact name.
	 * @param {unknown} value - Exact bytes or serializable content.
	 * @param {DialDerivation} [derivation] - Explicit refinement of recipe provenance.
	 * @returns {DialFileIdentity} Retained immutable artifact identity.
	 */
	function write(name, value, derivation) {
		guard();
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`);
		assert.ok(
			storage().retainedBytes - initialBytes + bytes.length < admission.allocatedBytes - reserve,
			'Mechanism write would consume terminal reserve.',
		);
		return run.write(name, bytes, derivation);
	}
	console.log(
		JSON.stringify({run: run.path, caseId, admission, estimatedPeakFieldBytes: prepared.estimatedPeakFieldBytes}),
	);
	try {
		write('control.json', controlBytes);
		write('profile-layout.json', {...profile.layout, estimatedPeakFieldBytes: prepared.estimatedPeakFieldBytes});
		write('admission.json', admission);
		write('sources.json.gz', compressedSources, {
			parents: snapshot,
			operation:
				'Preserve exact authored and browser/compiler source bytes as JSON path/size/hash/base64 records with Node zlib gzip level9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				node: process.version,
				uncompressedByteLength: sourceBytes.length,
				uncompressedSha256: sha256(sourceBytes),
			},
		});
		execution = await runGpu({
			repositoryRoot,
			scratchDirectory: run.scratchPath,
			chromePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
			control,
			sourceIdentities: sources,
			browserModulePath,
			compilerModulePath,
			expectedOrderCount: 4,
			compilerReportSchema,
			expectedFieldIds,
			readSource: async (file) => {
				const source = sources.find((item) => item.path === file);
				assert.ok(source, 'Browser requested a source outside its authenticated closure.');
				return readRepository(file, source);
			},
			onProgress: async (event) => {
				guard();
				run.progress(event.phase, event.message, event.completed, event.total);
			},
			observeResources: async (request) => {
				guard();
				const observation = await observeMemory(request);
				memoryObservationCount++;
				maximumPrivateBytes = Math.max(maximumPrivateBytes, observation.privateBytes);
				minimumAvailableBytes = Math.min(minimumAvailableBytes, observation.availableBytes);
				memory.push(observation);
				if (memory.length > 128) memory.shift();
				assert.ok(
					observation.availableBytes >= registration.budgets.hostHeadroomBytes,
					'Host memory headroom fell below its registered minimum.',
				);
				assert.ok(
					observation.privateBytes <= registration.budgets.processPrivateBytes,
					'Owned private-memory limit exceeded.',
				);
			},
			onChannel: async (channel) => {
				guard();
				assert.equal(channel.shape.representationCount, 1);
				assert.equal(channel.shape.viewCount, 2);
				assert.equal(channel.shape.orderCount, 4);
				assert.equal(channel.shape.rayCount, selection.times.length * 81);
				assert.ok(
					channel.compilerReport.peakLiveFieldBytes <= registration.budgets.scalarFieldBytes,
					'Actual scalar fields exceeded the registered cap.',
				);
				const stem = `channel-${String(channel.channel).padStart(2, '0')}`,
					bytes = Buffer.alloc(channel.values.length * 8);
				for (const [index, value] of channel.values.entries()) bytes.writeDoubleLE(value, index * 8);
				const spectra = write(`${stem}.f64`, bytes);
				const {values, diagnostics, ...metadata} = channel;
				const diagnosticBytes = diagnostics ? Buffer.from(JSON.stringify(diagnostics)) : null;
				const diagnosticArtifact = diagnostics
					? write(`${stem}-diagnostics.json.gz`, gzipSync(diagnosticBytes, {level: 9}), {
							parents,
							operation:
								'Losslessly gzip validated continuation component/operational diagnostic JSON with Node zlib level9.',
							parameters: {
								channel: channel.channel,
								schemaId: diagnostics.schemaId,
								uncompressedByteLength: diagnosticBytes.length,
								uncompressedSha256: sha256(diagnosticBytes),
							},
						})
					: null;
				write(`${stem}.json`, {
					...metadata,
					spectra,
					diagnosticArtifact,
					layout: 'representation-view-order-ray-f64le-v1',
				});
				channelArtifacts.push(spectra);
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
		assert.ok(execution.executionSucceeded, execution.failure ?? 'Mechanism GPU execution failed.');
		assert.equal(channelArtifacts.length, selection.channels.length);
	} catch (error) {
		failure = String(error);
	}
	const cleanup = run.cleanup();
	run.write('execution.json', {
		execution: execution
			? {...execution, channels: execution.channels.map(({diagnostics, ...metadata}) => metadata)}
			: null,
		failure,
		channels: channelArtifacts,
		cleanup,
	});
	run.write('memory.json', {
		observationCount: memoryObservationCount,
		retainedMostRecentObservations: memory,
		maximumPrivateBytes,
		minimumAvailableBytes: Number.isFinite(minimumAvailableBytes) ? minimumAvailableBytes : null,
		limit: registration.budgets.processPrivateBytes,
	});
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		caseId,
		scope: 'screen',
		failure,
		jobElapsedMilliseconds: Date.now() - started,
		retainedChannelCount: channelArtifacts.length,
	});
	verifyRun(run.path);
	assert.equal(
		JSON.parse(readRepository(seal.path, seal).toString()).state,
		'accepted',
		`Mechanism failed in ${run.path}: ${failure}`,
	);
	return run.path;
}
