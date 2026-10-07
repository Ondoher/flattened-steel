import assert from 'node:assert/strict';
import path from 'node:path';
import {readFileSync, mkdirSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer';
import {
	createRun,
	identity,
	readRepository,
	outputRelative,
	sourceIdentities,
	sha256,
	checkedAbsolute,
	verifyRun,
	storage,
} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob, campaignUsage} from '../resources.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {prepareTargeted} from './prepare.mjs';
import {targetedShaders} from './kernels.mjs';
import {runTargetedGpu} from './browser.mjs';
import {assessTargeted, manufacturedProof, modeNames} from './assess.mjs';

const topic = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials';
const registrationPath = `${outputRelative}/runs/00099-c0-registration`;
const deadline = Date.parse('2026-09-15T18:00:00Z');
/** Exact contiguous section order of the retained Float32 GPU input. @type {readonly SkyTargetedGeometrySection[]} */
const geometrySections = ['planet', 'spectra', 'anchors', 'samples', 'rays'];

/** Retain the actual GPU precision without verbose duplicate JSON coordinates.
 * @param {SkyTargetedPayload} payload @returns {Buffer}
 */
function packGeometry(payload) {
	assert.equal(Buffer.from(new Float32Array([1]).buffer).readFloatLE(), 1, 'Little-endian input contract');
	return Buffer.concat(
		geometrySections.map((name) => {
			assert.ok(payload[name].every(Number.isFinite));
			return Buffer.from(new Float32Array(payload[name]).buffer);
		}),
	);
}

/** Read exact retained controls, independent references and measurements.
 * @returns {SkyTargetedInputs}
 */
function readInputs() {
	const parents = [];
	/** @param {string} runName @param {string} artifact @returns {unknown} */
	function read(runName, artifact) {
		const parent = acceptedMechanismInput(`${outputRelative}/runs/${runName}`),
			id = mechanismArtifact(parent, artifact);
		parents.push(parent.seal, id);
		return JSON.parse(readRepository(id.path, id).toString());
	}
	const control = /** @type {SkyGpuControl} */ (read('00103-c-r0-scr', 'control.json'));
	const references = /** @type {SkyJ1AssessmentRow[]} */ (read('00110-c1-j1-assess', 'rows.json'));
	const independent = /** @type {SkyTargetedReferenceRecord} */ (read('00109-c1-physical-j1', 'reference.json'));
	const columnPrediction = /** @type {SkyTargetedColumnPrediction} */ (
		read('00188-src-column-pred', 'prediction.json')
	);
	const columnTarget = /** @type {SkyTargetedColumnTarget} */ (read('00189-src-column-s160', 'target.json'));
	for (const ref of references) {
		const row = independent.rows.find((r) => r.probeId === ref.probeId && r.channel === ref.channel);
		assert.ok(row && row.resolved);
		assert.ok(Math.abs(ref.physicalW - (row.gaussWatts + row.simpsonWatts) / 2) <= 1e-14);
	}
	return {request: control.buildRequest, references, parents, columnPrediction, columnTarget};
}

/** Compare GPU source integration only at exactly matching retained source anchors.
 * @param {SkyTargetedInputs} input @param {SkyTargetedPayload} payload @param {SkyTargetedGpuResult} gpu
 * @returns {SkyTargetedColumnWitness[]}
 */
function columnWitnesses(input, payload, gpu) {
	const result = [],
		count = payload.anchors.length / 4;
	for (const prior of input.columnPrediction.rows) {
		let anchor = -1;
		for (let i = 0; i < count; i++)
			if (
				Math.abs(payload.anchors[i * 4] - prior.coordinate.altitudeMeters) < 1e-9 &&
				Math.abs(payload.anchors[i * 4 + 1] - prior.coordinate.solarCosine) < 1e-14
			) {
				anchor = i;
				break;
			}
		if (anchor < 0) continue;
		for (const source of [0, 1]) {
			const finite = source
				? input.columnTarget.rows.find((r) => r.coordinateId === prior.coordinate.id)?.finite
				: prior.baseline;
			assert.ok(finite);
			const rayleigh = gpu.columns[(source * count + anchor) * 4],
				mie = gpu.columns[(source * count + anchor) * 4 + 1];
			const differenceRayleighMeters = rayleigh - finite.rayleighMeters,
				differenceMieMeters = mie - finite.mieMeters;
			result.push({
				coordinateId: prior.coordinate.id,
				sourceCount: source ? 160 : 80,
				differenceRayleighMeters,
				differenceMieMeters,
				withinGuard:
					Math.abs(differenceRayleighMeters) <= Math.max(0.005, 2e-5 * finite.rayleighMeters) &&
					Math.abs(differenceMieMeters) <= Math.max(0.005, 2e-5 * finite.mieMeters),
			});
		}
	}
	assert.ok(result.length >= 8, 'Require matching retained source-column witnesses.');
	return result;
}

/** Identify an ordinary external tool without granting it data-output authority.
 * @param {string} absolute @returns {DialFileIdentity}
 */
function toolIdentity(absolute) {
	const bytes = readFileSync(checkedAbsolute(path.resolve(absolute)));
	return {path: path.resolve(absolute), byteLength: bytes.length, sha256: sha256(bytes)};
}

/** Execute one hardware job and seal all outputs, including failures.
 * @returns {Promise<void>}
 */
async function main() {
	const proofChecks = manufacturedProof();
	if (process.argv[2] === 'proof') {
		console.log(JSON.stringify({proofChecks}));
		return;
	}
	assert.ok(['preflight', 'execute'].includes(process.argv[2]), 'Use proof, preflight or execute.');
	const registration = readRegistration(registrationPath),
		input = readInputs();
	if (process.argv[2] === 'preflight') {
		const payload = prepareTargeted(input.request, registration, input.references, () => {});
		console.log(
			JSON.stringify({
				proofChecks,
				anchors: payload.anchors.length / 4,
				samples: payload.samples.length / 40,
				maxSamples: Math.max(...payload.rowLayout.map((r) => r.sampleCount)),
				rays: payload.rowLayout.length,
				payloadCompressedBytes: gzipSync(packGeometry(payload)).length,
			}),
		);
		return;
	}
	const started = Date.now();
	assert.ok(started < deadline - 120000, 'First-pass deadline leaves insufficient finalization time.');
	const allocatedBytes = 6 * 1024 ** 2,
		admission = admitJob(registration, 'gpu', 'component', allocatedBytes, 'C5');
	const maximumJobMilliseconds = Math.min(30 * 60000, admission.timeoutMilliseconds, deadline - started);
	const sources = sourceIdentities(),
		plan = identity(`${topic}/targeted-improvements-plan.md`);
	const tools = [
		toolIdentity(process.execPath),
		toolIdentity(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'),
		toolIdentity(fileURLToPath(import.meta.resolve('puppeteer'))),
		toolIdentity(fileURLToPath(import.meta.resolve('puppeteer/package.json'))),
	];
	const parents = [
		registration.seal,
		registration.record.inputs,
		plan,
		identity(`${topic}/design.md`),
		...input.parents,
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		...(admission.usage.invalidEvidence ?? []).map((r) => r.seal),
	];
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'GPU S80/S160 sunlight-column precomputation and 13-mode loop-free-per-sample first-order ray matrix; compare retained physical P1 and frozen GPU higher light against Kider.',
		parameters: {
			caseId: 'targeted-improvements-v1',
			continuationRegistration: registration.run,
			jobKind: 'gpu',
			scope: 'component',
			phase: 'C5',
			admission,
			sourceIdentities: sources,
			tools,
			nodeVersion: process.version,
			maximumJobMilliseconds,
			deadlineUtc: new Date(deadline).toISOString(),
			modes: modeNames,
			sourceCounts: [80, 160],
			viewLevels: [8, 16],
			channels: [0, 8, 24, 30],
			fullSolverQualification: false,
			higherOrdersRegenerated: false,
			newCpuRadianceIntegrations: 0,
		},
	};
	const run = createRun('targeted-gpu', recipe),
		definition = identity(run.path + '/definition.json');
	console.log(JSON.stringify({run: run.path, phase: 'allocated', maximumJobMilliseconds}));
	let written = definition.byteLength;
	/** @type {Error|null} */ let failure = null;
	/** @type {SkyTargetedGpuResult|null} */ let gpu = null;
	/** @type {SkyTargetedAssessment|null} */ let assessment = null;
	/** @type {Awaited<ReturnType<typeof puppeteer.launch>>|null} */ let browser = null;
	let gpuStarted = false;
	/** @param {string} name @param {unknown} value @param {DialDerivation} [derivation] */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: 'Derive ' + name + ' using the fixed authenticated GPU matrix and assessment source.',
		},
	) {
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value) + '\n');
		assert.ok(written + bytes.length < allocatedBytes - 768 * 1024, 'Retained allocation guard');
		written += run.write(name, bytes, derivation).byteLength;
	}
	/** Check elapsed/storage limits and flush heartbeat during synchronous preparation. */
	function guard() {
		assert.ok(Date.now() - started < maximumJobMilliseconds - 30000, 'Job deadline reached');
		run.guard();
	}
	try {
		run.progress('prepare', 'Reusing authenticated GPU higher fields, physical P1 references and Kider scalars.');
		write('targeted-plan.md', readRepository(plan.path, plan), {
			parents: [plan],
			operation: 'Copy prospective fixed comparison matrix and stopping criteria.',
		});
		const sourceBytes = Buffer.from(
			JSON.stringify(sources.map((id) => ({...id, base64: readRepository(id.path, id).toString('base64')}))),
		);
		write('sources.json.gz', gzipSync(sourceBytes, {level: 9}), {
			parents: sources,
			operation: 'Encode exact source bytes as base64 JSON, gzip level9.',
			parameters: {uncompressedSha256: sha256(sourceBytes), uncompressedByteLength: sourceBytes.length},
		});
		const payload = prepareTargeted(input.request, registration, input.references, guard);
		const packed = packGeometry(payload);
		write('gpu-input.f32.gz', gzipSync(packed, {level: 9}), {
			parents: [definition, ...input.parents],
			operation:
				'Prepare geometry, phases and fixed stencils from frozen P48/W27/Z180; concatenate GPU Float32 inputs in declared order, gzip level9.',
			parameters: {
				uncompressedSha256: sha256(packed),
				uncompressedByteLength: packed.length,
				endian: 'little',
				sections: geometrySections.map((name) => ({name, floatCount: payload[name].length})),
				channels: payload.channels,
				rowLayout: payload.rowLayout,
			},
		});
		write('proof.json', {proofChecks, loopFreeSampleHelpers: true, outerRayLoops: 1});
		const profile = checkedAbsolute(path.join(run.scratchPath, 'chrome-profile'), false);
		mkdirSync(profile);
		checkedAbsolute(profile);
		guard();
		run.progress('gpu', 'Executing both source counts and all representation/view variants on hardware GPU.');
		browser = await puppeteer.launch({
			executablePath: tools[1].path,
			headless: true,
			userDataDir: profile,
			protocolTimeout: maximumJobMilliseconds - (Date.now() - started) - 30000,
			args: [
				'--enable-gpu',
				'--enable-webgl',
				'--ignore-gpu-blocklist',
				'--disable-software-rasterizer',
				'--use-angle=d3d11',
				'--disable-background-networking',
				'--disable-component-update',
				'--no-first-run',
			],
		});
		const page = await browser.newPage();
		gpuStarted = true;
		gpu = await page.evaluate(runTargetedGpu, payload, targetedShaders);
		await browser.close();
		browser = null;
		guard();
		write('gpu-output.json', gpu);
		const witnesses = columnWitnesses(input, payload, gpu);
		write('column-witnesses.json', witnesses);
		assert.ok(
			witnesses.every((w) => w.withinGuard),
			'GPU source-column parity screen failed.',
		);
		run.progress('assess', 'Scoring directional changes and retaining signed error-cancellation terms.');
		assessment = assessTargeted(payload, gpu);
		write('assessment.json.gz', gzipSync(Buffer.from(JSON.stringify(assessment)), {level: 9}));
		write('groups.json', {
			groups: assessment.groups,
			comparisons: assessment.comparisons,
			parity: assessment.parity,
		});
		write('work.json', {
			anchors: payload.anchors.length / 4,
			sourceSpeciesEvaluations: (payload.anchors.length / 4) * (81 + 161) * 2,
			uniquePreparedSamples: payload.samples.length / 40,
			evaluatedRaySamples: (payload.samples.length / 40) * 104,
			rayLayout: payload.rowLayout,
			loopFreeSampleHelpers: true,
			gpuTimingIncludesReadback: true,
			newCpuRadianceIntegrations: 0,
			regeneratedHigherFields: 0,
		});
		for (const id of [...parents, ...sources]) readRepository(id.path, id);
		for (const id of tools) assert.deepEqual(toolIdentity(id.path), id);
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	}
	if (browser) {
		try {
			await browser.close();
		} catch (error) {
			failure = new Error(String(failure || '') + '; browser close: ' + String(error));
		}
	}
	const cleanup = run.cleanup();
	const corrected = assessment?.comparisons.filter((c) => c.mode === 7) ?? [];
	const state = failure ? 'failed' : corrected.some((c) => !c.numericalReductionResolved) ? 'rejected' : 'accepted';
	const seal = run.finish(state, {
		caseId: 'targeted-improvements-v1',
		jobElapsedMilliseconds: Date.now() - started,
		gpuJobsExecuted: gpuStarted ? 1 : 0,
		failure: failure?.message ?? null,
		proofChecks,
		cleanup,
		parityWitnessesWithinGuard: assessment?.parity.filter((p) => p.withinGuard).length ?? null,
		parityWitnessesTotal: assessment?.parity.length ?? null,
		correctedComparisons: corrected,
		fullSolverQualification: false,
		higherOrdersRegenerated: false,
		newCpuRadianceIntegrations: 0,
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
			gpu: gpu
				? {
						renderer: gpu.renderer,
						columnMilliseconds: gpu.columnMilliseconds,
						rayMilliseconds: gpu.rayMilliseconds,
					}
				: null,
			usage: {
				gpuConstructions: usage.gpuConstructions,
				retainedC5: usage.retainedBytesByPhase.C5,
				retainedBytes: storage().retainedBytes,
			},
		}),
	);
	if (failure) throw failure;
}

await main();
