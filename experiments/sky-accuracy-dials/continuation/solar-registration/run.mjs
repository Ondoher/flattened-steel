import assert from 'node:assert/strict';
import {gzipSync, gunzipSync} from 'node:zlib';
import {readFileSync} from 'node:fs';
import {
	createRun,
	identity,
	readRepository,
	outputRelative,
	sourceIdentities,
	sha256,
	verifyRun,
	storage,
	checkedAbsolute,
} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob, campaignUsage} from '../resources.mjs';
import {readSolarInputs} from './inputs.mjs';
import {registrationProof} from './fit.mjs';
import {assessSolarRegistration} from './assess.mjs';

const topic = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials';
const deadline = Date.parse('2026-09-15T19:39:00Z');

/** Execute a single retained-data registration analysis with compact lossless source reuse. */
async function main() {
	const proofChecks = registrationProof();
	if (process.argv[2] === 'proof') {
		console.log(JSON.stringify({proofChecks}));
		return;
	}
	assert.ok(['preflight', 'execute'].includes(process.argv[2]), 'Use proof, preflight or execute.');
	const input = readSolarInputs();
	if (process.argv[2] === 'preflight') {
		console.log(
			JSON.stringify({
				proofChecks,
				conditions: input.conditions.length,
				spectralGrids: Object.keys(input.conditions[0].grids),
				parents: input.parents,
			}),
		);
		return;
	}
	const started = Date.now();
	assert.ok(started < deadline - 120000);
	const registration = readRegistration(outputRelative + '/runs/00099-c0-registration');
	const allocatedBytes = 1024 ** 2,
		admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	const maximumJobMilliseconds = Math.min(15 * 60000, deadline - started, admission.timeoutMilliseconds);
	const baseRun = verifyRun(outputRelative + '/runs/00226-remain-observe');
	assert.equal(baseRun.sha256, 'e658067b37be8d8245a908500e3f365ad99fa1bafa61c1e558d9e3e162684bc7');
	const baseSnapshot = identity(outputRelative + '/runs/00226-remain-observe/sources.json.gz');
	const plan = identity(topic + '/solar-registration-plan.md'),
		sources = sourceIdentities();
	const nodeBytes = readFileSync(checkedAbsolute(process.execPath));
	const node = {path: process.execPath, byteLength: nodeBytes.length, sha256: sha256(nodeBytes)};
	const parents = [
		registration.seal,
		registration.record.inputs,
		plan,
		baseRun,
		baseSnapshot,
		...input.parents,
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		...(admission.usage.invalidEvidence ?? []).map((r) => r.seal),
	];
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Replay original solar-axis fits; isolate spectral, regional, quadrature and sparse-grid effects using retained Kider spectra and known-axis analytic fields; compare fixed geometric hypotheses on withheld times.',
		parameters: {
			caseId: 'solar-registration-v1',
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C5',
			admission,
			allocatedBytes,
			maximumJobMilliseconds,
			deadlineUtc: new Date(deadline).toISOString(),
			sourceIdentities: sources,
			node,
			nodeVersion: process.version,
			newRadianceIntegrations: 0,
			gpuJobsExecuted: 0,
			physicalCoefficientsFitted: false,
			initialHead: 'c7803b241f0f8f409226354dc4fb72484f25a5ec',
			initialSourceInventorySha256: '2342137086fe16863318978cf550c9aacdc9dcb2b8a0bbfbbfc01314257fa891',
			bands: ['integrated40', 'channel-0', 'channel-8', 'channel-24', 'channel-30'],
			analyticG: [0.6, 0.9],
			originalReplayAllowanceDegrees: 1e-9,
			geometricHypotheses: ['azimuth-zero', 'clock', 'clock-and-zero'],
			clockMinutes: {minimum: -60, maximum: 60, step: 1},
			trainingTimes: 'even-indexed captures',
			heldTimes: 'odd-indexed captures',
			appliedGeometryChanges: false,
		},
	};
	const run = createRun('solar-register', recipe),
		definition = identity(run.path + '/definition.json');
	console.log(JSON.stringify({run: run.path, phase: 'allocated', maximumJobMilliseconds}));
	let written = definition.byteLength,
		lastGuard = 0;
	/** @type {Error|null} */ let failure = null;
	/** @type {SkySolarAssessment|null} */ let assessment = null;
	/** @param {string} [message] */
	function progress(message) {
		assert.ok(Date.now() - started < maximumJobMilliseconds - 30000, 'Registration deadline reached');
		if (Date.now() - lastGuard >= 10000) {
			run.guard();
			lastGuard = Date.now();
		}
		if (message) run.progress('fit', message);
	}
	/** @param {string} name @param {unknown} value @param {DialDerivation} [derivation] */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: 'Derive ' + name + ' from exact retained inputs and the frozen registration matrix.',
		},
	) {
		progress();
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value) + '\n');
		assert.ok(written + bytes.length < allocatedBytes - 448 * 1024, 'Registration retention forecast exceeded');
		written += run.write(name, bytes, derivation).byteLength;
	}
	try {
		write('plan.md', readRepository(plan.path, plan), {
			parents: [plan],
			operation: 'Copy prospective registration selectors, hypotheses and limits.',
		});
		const prior = /** @type {(DialFileIdentity & {base64:string})[]} */ (
			JSON.parse(gunzipSync(readRepository(baseSnapshot.path, baseSnapshot)).toString())
		);
		for (const entry of prior) {
			const bytes = Buffer.from(entry.base64, 'base64');
			assert.equal(bytes.length, entry.byteLength);
			assert.equal(sha256(bytes), entry.sha256);
		}
		const changed = sources.filter(
			(id) => !prior.some((p) => p.path === id.path && p.sha256 === id.sha256 && p.byteLength === id.byteLength),
		);
		const snapshot = Buffer.from(
			JSON.stringify({
				baseSnapshot,
				currentSources: sources,
				changed: changed.map((id) => ({...id, base64: readRepository(id.path, id).toString('base64')})),
			}),
		);
		write('sources-delta.json.gz', gzipSync(snapshot, {level: 9}), {
			parents: [baseSnapshot, ...sources],
			operation:
				'Reuse authenticated unchanged base-source bytes and encode every changed/new source as base64 JSON, gzip level9.',
			parameters: {uncompressedByteLength: snapshot.length, uncompressedSha256: sha256(snapshot)},
		});
		write('proof.json', {
			proofChecks,
			interpretation:
				'Native-node and periodic interpolation, positive-scale invariance, flat-field ambiguity; not atmospheric reference qualification.',
		});
		write('inputs-summary.json', {
			conditions: input.conditions.map(({grids, ...geometry}) => ({
				...geometry,
				scalarGridSha256: sha256(JSON.stringify(grids)),
			})),
			units: 'Original W m^-2 sr^-1 nm^-1; integrated40 multiplies the unchanged forty-channel sum by 11.75 nm.',
			originalBoundaryUnchanged: true,
		});
		assessment = assessSolarRegistration(input, progress);
		write('assessment.json.gz', gzipSync(Buffer.from(JSON.stringify(assessment)), {level: 9}));
		write('hypotheses.json', assessment.hypotheses);
		progress('Reauthenticating inputs, source bytes and tool; sealing registration evidence.');
		for (const id of [...parents, ...sources]) readRepository(id.path, id);
		assert.equal(sha256(readFileSync(checkedAbsolute(node.path))), node.sha256);
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	}
	const cleanup = run.cleanup(),
		state = failure ? 'failed' : 'accepted';
	const seal = run.finish(state, {
		caseId: 'solar-registration-v1',
		failure: failure?.message ?? null,
		jobElapsedMilliseconds: Date.now() - started,
		proofChecks,
		replayChecks: assessment?.replayChecks ?? 0,
		fittedSubsets: assessment?.fits.length ?? 0,
		spectralTransfers: assessment?.spectralTransfers.length ?? 0,
		gpuJobsExecuted: 0,
		newRadianceIntegrations: 0,
		appliedGeometryChanges: false,
		cleanup,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	assert.ok(
		storage().retainedBytes - admission.usage.newRetainedBytes - registration.initialStorage.retainedBytes <=
			allocatedBytes,
	);
	const usage = campaignUsage(registration);
	console.log(
		JSON.stringify({
			run: run.path,
			state,
			failure: failure?.message ?? null,
			seal,
			proofChecks,
			replayChecks: assessment?.replayChecks,
			usage: {
				retainedBytes: storage().retainedBytes,
				retainedC5: usage.retainedBytesByPhase.C5,
				cpuMilliseconds: usage.cpuElapsedMilliseconds,
				gpuAttempts: usage.gpuConstructions,
			},
		}),
	);
	if (failure) throw failure;
}

await main();
