import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {freemem} from 'node:os';
import {gzipSync} from 'node:zlib';
import {loadInputs} from '../execution.mjs';
import {
	checkedAbsolute,
	createRun,
	identity,
	listFiles,
	readRepository,
	sha256,
	storage,
	verifyRun,
} from '../io/files.mjs';
import {deriveProfile} from '../numerics/profile.js';
import {readRegistration} from './registration/run.mjs';
import {admitJob} from './resources.mjs';
import {workingControls} from './cases.mjs';
import {localJ2Proof} from './j2/proof.mjs';
import {adaptiveViewProof} from './adaptive/proof.mjs';
import {verifyDensityImplementation} from './density/proof.mjs';
import {captureSupportProof} from './capture/proof.mjs';
import {fixedFieldReferenceProof} from './reference/fixed-field.mjs';
import {physicalReferenceProof} from './reference/physical/index.mjs';
import {mechanismContractProof} from './mechanisms/proof.mjs';
import {verifyInteractionImplementation} from './interaction/proof.mjs';
import {referenceLadderProof} from './ladder/proof.mjs';

/** Authenticate the pinned Node runtime before recording new implementation proof.
 * @param {DialContinuationToolIdentity} expected - Original C0 executable identity.
 * @returns {Promise<void>} Resolves only for the exact executable bytes/version.
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

/** Seal manufactured algorithm, capture and ownership checks before new scientific execution.
 * No GPU context or physical benchmark reference is evaluated. H geometry is
 * used only to exercise the capture boundary with synthetic fields.
 * @param {string} registrationRun - Original immutable continuation registration.
 * @returns {Promise<DialExecutionResult>} Strictly verified implementation proof record.
 */
export async function runSupportProof(registrationRun) {
	const started = Date.now(),
		registration = readRegistration(registrationRun),
		admission = admitJob(registration, 'cpu', 'component', 2 * 1024 ** 2, 'C2');
	await authenticateNode(registration.record.host.node);
	const inputs = loadInputs(),
		profile = deriveProfile(inputs.native48, {
			...workingControls,
			representations: ['grouped'],
			viewIntervals: [8, 16],
		}),
		scenes = inputs.scenes.filter((scene) => registration.record.scopes.screen.times.includes(scene.time));
	const sources = [
		...listFiles('experiments/sky-accuracy-dials'),
		'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js',
		'scripts/algorithm32/solar-zenith-cache/types.d.ts',
	].map((file) => identity(file));
	const priorProof = verifyRun('tmp/experiments/sky-accuracy-dials/runs/00111-c1-contracts');
	assert.ok(admission.usage.allocationAmendment);
	const parents = [
		registration.seal,
		registration.record.inputs,
		priorProof,
		admission.usage.allocationAmendment.seal,
	];
	const initial = storage().retainedBytes;
	const run = createRun('c2-support-proof', {
		parents,
		operation:
			'Run bounded manufactured numerical, sparse-capture, resource-lifetime and negative-input proofs for C2-C4 implementation. Synthetic fields on H geometry establish integration parity, not measured atmospheric accuracy.',
		parameters: {
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C2',
			caseId: 'c2-c4-support-proof',
			admission,
			sourceIdentities: sources,
			node: registration.record.host.node,
		},
	});
	const deadline = started + admission.timeoutMilliseconds;
	let lastProgress = 0;
	/** Resource and heartbeat guard for all synchronous proof stages.
	 * @param {string} message - Current counted implementation operation.
	 * @returns {void}
	 */
	function guard(message) {
		assert.ok(Date.now() < deadline, 'Shared CPU proof deadline exhausted.');
		assert.ok(freemem() >= registration.budgets.hostHeadroomBytes, 'Proof host memory headroom is insufficient.');
		assert.ok(
			run.guard().retainedBytes - initial < admission.allocatedBytes - 256 * 1024,
			'Proof sealing reserve exhausted.',
		);
		if (Date.now() - lastProgress > 15000) {
			run.progress('support-proof', message);
			lastProgress = Date.now();
		}
	}
	/** @type {{message: string, stack?: string} | null} */ let failure = null;
	try {
		run.write('admission.json', admission);
		run.write('control.json', {
			buildRequest: profile.buildRequest,
			controls: profile.controls,
			scenes,
			probes: registration.probes,
		});
		const snapshot = [];
		for (const source of sources) {
			guard('Capturing exact authored implementation identities.');
			snapshot.push({...source, base64: readRepository(source.path, source).toString('base64')});
			await new Promise((resolve) => setImmediate(resolve));
		}
		const bytes = Buffer.from(JSON.stringify(snapshot)),
			compressed = gzipSync(bytes, {level: 9});
		run.write('sources.json.gz', compressed, {
			parents: sources,
			operation: 'Encode exact source bytes as path/hash/size/base64 JSON, then losslessly gzip at level9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				node: process.version,
				uncompressedByteLength: bytes.length,
				uncompressedSha256: sha256(bytes),
			},
		});
		guard('Verifying independent quadratures and adaptive arithmetic.');
		run.write('quadrature-proof.json', {
			localJ2: localJ2Proof(),
			adaptive: adaptiveViewProof(),
			fixedField: fixedFieldReferenceProof(),
			physical: physicalReferenceProof(),
			mechanisms: mechanismContractProof(inputs.native48),
			interactions: verifyInteractionImplementation(registration, {
				buildRequest: profile.buildRequest,
				controls: profile.controls,
				scenes,
				channels: registration.record.scopes.screen.channels,
			}),
			ladder: referenceLadderProof(),
		});
		run.progress(
			'density-proof',
			'Verifying species recurrence dispatch, unchanged physical shader fragments, numerical grouping and failure cleanup.',
		);
		run.write(
			'density-proof.json',
			await verifyDensityImplementation({
				buildRequest: profile.buildRequest,
				controls: profile.controls,
				scenes,
				channels: [0],
			}),
		);
		guard('Verifying complete sparse capture, counted costs and rejection boundaries.');
		/** @type {SkyContinuationCaptureControl} */
		const selection = {
			finalFirstOrder: 'raw',
			referenceMode: 'adaptive',
			probes: registration.probes,
			probeScenes: registration.probeScenes,
			groundDensityProbes: ['09:30:4:7', '09:30:5:7', '12:30:3:5', '12:30:4:4'].map((key) => {
				const probe = registration.probes.find((p) => `${p.time}:${p.gridX}:${p.gridY}` === key);
				assert.ok(probe);
				return probe;
			}),
		};
		run.write(
			'capture-proof.json',
			await captureSupportProof(profile.buildRequest, scenes, selection, () =>
				guard('Validating synthetic capture outcomes.'),
			),
		);
		for (const parent of parents) readRepository(parent.path, parent);
		for (const source of sources) {
			guard('Reauthenticating frozen implementation.');
			readRepository(source.path, source);
		}
		await authenticateNode(registration.record.host.node);
	} catch (error) {
		failure = error instanceof Error ? {message: error.message, stack: error.stack} : {message: String(error)};
	}
	run.write('execution.json', {failure, gpuExecuted: false, physicalBenchmarkEvaluated: false});
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		caseId: 'c2-c4-support-proof',
		jobElapsedMilliseconds: Date.now() - started,
		failure,
	});
	verifyRun(run.path);
	const accepted = JSON.parse(readRepository(seal.path, seal).toString()).state === 'accepted';
	assert.ok(storage().retainedBytes - initial <= admission.allocatedBytes);
	if (!accepted) throw new Error(`Support proof failed in ${run.path}: ${failure?.message ?? 'source verification'}`);
	return {run: run.path, seal, accepted};
}
