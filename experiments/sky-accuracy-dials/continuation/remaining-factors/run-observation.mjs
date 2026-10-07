import assert from 'node:assert/strict';
import path from 'node:path';
import {readFileSync, mkdirSync} from 'node:fs';
import {gzipSync, gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
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
import {remainingPackageId} from './authorization.mjs';
import {prepareObservation} from './observation-geometry.mjs';
import {observationShaders} from './observation-kernels.mjs';
import {executeObservationGpu} from './observation-host.mjs';
import {assessObservation} from './observation-assess.mjs';
import {auditObservation, observationProof} from './observation-audit.mjs';
import {benchmarkRay} from '../../numerics/view.js';
import {computeTheoreticalSunDirection} from '../../../../scripts/experiments/b1-directional-sky-radiance/benchmark-domain.js';

const topic = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials';
const registrationPath = `${outputRelative}/runs/00099-c0-registration`;
const deadline = Date.parse('2026-09-15T19:39:00Z');

/** Identify an ordinary external tool without granting output authority.
 * @param {string} absolute @returns {DialFileIdentity}
 */
function toolIdentity(absolute) {
	const bytes = readFileSync(checkedAbsolute(path.resolve(absolute)));
	return {path: path.resolve(absolute), byteLength: bytes.length, sha256: sha256(bytes)};
}

/** Execute the fixed observation matrix in one hardware job, preserving failures.
 * @returns {Promise<void>}
 */
async function main() {
	const proofChecks = observationProof();
	if (process.argv[2] === 'proof') {
		console.log(JSON.stringify({proofChecks}));
		return;
	}
	assert.ok(['preflight', 'execute'].includes(process.argv[2]), 'Use proof, preflight or execute.');
	const registration = readRegistration(registrationPath);
	/** @type {DialFileIdentity[]} */ const inputParents = [];
	/** @param {string} name @param {string} artifact @returns {unknown} */
	function read(name, artifact) {
		const run = acceptedMechanismInput(`${outputRelative}/runs/${name}`),
			id = mechanismArtifact(run, artifact);
		inputParents.push(run.seal, id);
		const bytes = readRepository(id.path, id);
		return JSON.parse((artifact.endsWith('.gz') ? gunzipSync(bytes) : bytes).toString());
	}
	const control = /** @type {SkyGpuControl} */ (read('00103-c-r0-scr', 'control.json'));
	const references = /** @type {SkyJ1AssessmentRow[]} */ (read('00110-c1-j1-assess', 'rows.json'));
	const previous = /** @type {SkyTargetedAssessment} */ (read('00224-targeted-gpu', 'assessment.json.gz'));
	const accounting = /** @type {SkyRemainingAssessment} */ (read('00225-remain-account', 'accounting.json.gz'));
	assert.equal(accounting.runHigherFactorial, false);
	const audit = auditObservation(references);
	inputParents.push(...audit.parents);
	const fittedGeometry = registration.record.probeScenes.map((scene) => ({
		...scene,
		theoretical: computeTheoreticalSunDirection(scene.time),
		fittedMinusTheoreticalAzimuthDegrees:
			scene.fittedAzimuthDegrees - computeTheoreticalSunDirection(scene.time).theoreticalAzimuthDegrees,
	}));
	for (const original of registration.record.probeRays) {
		const scene = registration.record.probeScenes.find((s) => s.time === original.time);
		assert.ok(scene);
		const ray = benchmarkRay(control.buildRequest.transportSpec, scene, original.gridX, original.gridY);
		assert.deepEqual(ray.origin, original.origin);
		assert.ok(ray.direction.every((v, i) => Math.abs(v - original.direction[i]) <= 8 * Number.EPSILON));
	}
	if (process.argv[2] === 'preflight') {
		const started = Date.now(),
			payload = prepareObservation(control.buildRequest, registration, references, () => {});
		console.log(
			JSON.stringify({
				proofChecks,
				audit: {...audit, parents: audit.parents.length},
				preparationMilliseconds: Date.now() - started,
				anchors: payload.anchors.length / 4,
				samples: payload.samples.length / 16,
				rays: payload.rowLayout.length,
				maxSamples: Math.max(...payload.rowLayout.map((r) => r.sampleCount)),
				sampleTextureBytes: payload.samples.length * 4,
			}),
		);
		return;
	}
	const started = Date.now();
	assert.ok(started < deadline - 120000);
	const allocatedBytes = 2 * 1024 ** 2,
		admission = admitJob(registration, 'gpu', 'component', allocatedBytes, 'C5', remainingPackageId);
	assert.ok(admission.gpuAuthorization);
	const maximumJobMilliseconds = Math.min(30 * 60000, admission.timeoutMilliseconds, deadline - started);
	const sources = sourceIdentities(),
		plan = identity(`${topic}/remaining-observation-plan.md`);
	const tools = [
		toolIdentity(process.execPath),
		toolIdentity(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'),
		toolIdentity(fileURLToPath(import.meta.resolve('ws'))),
		toolIdentity(fileURLToPath(import.meta.resolve('ws/package.json'))),
	];
	const interrupted = verifyRun(outputRelative + '/runs/00226-remain-observe');
	assert.equal(interrupted.sha256, 'e658067b37be8d8245a908500e3f365ad99fa1bafa61c1e558d9e3e162684bc7');
	const baseSnapshot = identity(outputRelative + '/runs/00226-remain-observe/sources.json.gz');
	const retryPlan = identity(topic + '/remaining-observation-retry.md');
	const parents = [
		interrupted,
		baseSnapshot,
		retryPlan,
		registration.seal,
		registration.record.inputs,
		plan,
		identity(`${topic}/design.md`),
		...inputParents,
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		...(admission.usage.invalidEvidence ?? []).map((r) => r.seal),
	];
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'GPU corrected P1 observation sensitivity: fixed pointing signs and uniform angular cones, S160 and view8/16; original higher light and raw measurements held fixed.',
		parameters: {
			caseId: 'remaining-observation-v1',
			packageId: remainingPackageId,
			gpuAuthorization: admission.gpuAuthorization,
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
			channels: [0, 8, 24, 30],
			viewLevels: [8, 16],
			fullSolverQualification: false,
			higherFieldsFrozen: true,
			newCpuRadianceIntegrations: 0,
		},
	};
	const run = createRun('remain-observe', recipe),
		definition = identity(run.path + '/definition.json');
	console.log(JSON.stringify({run: run.path, phase: 'allocated', maximumJobMilliseconds}));
	let written = definition.byteLength,
		gpuStarted = false;
	/** @type {Error|null} */ let failure = null;
	/** @type {SkyTargetedGpuResult|null} */ let gpu = null;
	/** @type {SkyObservationAssessment|null} */ let assessment = null;
	/** @param {string} name @param {unknown} value @param {DialDerivation} [derivation] */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: 'Derive ' + name + ' with authenticated fixed observation matrix and assessment source.',
		},
	) {
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value) + '\n');
		assert.ok(written + bytes.length < allocatedBytes - 768 * 1024, 'Retained allocation guard');
		written += run.write(name, bytes, derivation).byteLength;
	}
	/** Flush heartbeat and enforce elapsed and storage caps. */
	function guard() {
		assert.ok(Date.now() - started < maximumJobMilliseconds - 30000, 'Job deadline reached');
		run.guard();
	}
	try {
		run.progress(
			'prepare',
			'Preparing fixed observation geometry; prior higher fields and spectra remain immutable.',
		);
		write('observation-plan.md', readRepository(plan.path, plan), {
			parents: [plan],
			operation: 'Copy prospective observation matrix and stopping criteria.',
		});
		const priorSources = /** @type {(DialFileIdentity & {base64:string})[]} */ (
			JSON.parse(gunzipSync(readRepository(baseSnapshot.path, baseSnapshot)).toString())
		);
		for (const entry of priorSources) assert.equal(sha256(Buffer.from(entry.base64, 'base64')), entry.sha256);
		const changed = sources.filter(
			(id) =>
				!priorSources.some(
					(prior) =>
						prior.path === id.path && prior.sha256 === id.sha256 && prior.byteLength === id.byteLength,
				),
		);
		const sourceBytes = Buffer.from(
			JSON.stringify({
				baseSnapshot,
				currentSources: sources,
				changed: changed.map((id) => ({...id, base64: readRepository(id.path, id).toString('base64')})),
			}),
		);
		write('sources-delta.json.gz', gzipSync(sourceBytes, {level: 9}), {
			parents: [baseSnapshot, ...sources],
			operation:
				'Reuse exact unchanged source bytes from the immutable base snapshot; retain all changed/new bytes and complete current identities.',
			parameters: {uncompressedSha256: sha256(sourceBytes), uncompressedByteLength: sourceBytes.length},
		});
		write('retry-plan.md', readRepository(retryPlan.path, retryPlan), {
			parents: [retryPlan],
			operation: 'Copy prospective bounded wrapper recovery and lossless source reuse plan.',
		});
		write('observation-audit.json', {
			...audit,
			fittedGeometry,
			originalDirectionChecks: registration.record.probeRays.length,
			fittedAzimuthTreatment:
				'Retain the existing hemisphere-symmetry fit; no new fit or theoretical replacement. Its difference from theoretical azimuth is comparison calibration, not a solver accuracy dial.',
		});
		write('proof.json', {proofChecks, loopFreeSampleHelpers: true, outerRayLoops: 1});
		guard();
		const payload = prepareObservation(control.buildRequest, registration, references, guard);
		assert.equal(Buffer.from(new Float32Array([1]).buffer).readFloatLE(), 1);
		const sampleBytes = Buffer.from(new Float32Array(payload.samples).buffer);
		const {samples, ...compact} = payload;
		write(
			'geometry.json.gz',
			gzipSync(
				Buffer.from(
					JSON.stringify({
						...compact,
						sampleTexture: {
							byteLength: sampleBytes.length,
							sha256: sha256(sampleBytes),
							format: 'little-endian Float32; reproduce from exact source and input parents',
						},
					}),
				),
				{level: 9},
			),
			{
				parents: [definition, ...inputParents],
				operation:
					'Prepare exact geometry and stencils; record the large transient sample texture by digest and complete reproducible derivation.',
			},
		);
		const profile = checkedAbsolute(path.join(run.scratchPath, 'chrome-profile'), false);
		mkdirSync(profile);
		checkedAbsolute(profile);
		guard();
		run.progress(
			'gpu',
			'Executing corrected first-order original, pointing and angular-cone rays on hardware GPU.',
		);
		gpuStarted = true;
		gpu = await executeObservationGpu(
			tools[1].path,
			profile,
			{...compact, samplesBase64: sampleBytes.toString('base64')},
			observationShaders,
			(message) => run.progress('gpu', message),
		);
		guard();
		write('gpu-output.json.gz', gzipSync(Buffer.from(JSON.stringify(gpu)), {level: 9}));
		run.progress(
			'assess',
			'Checking baseline parity and signed observation sensitivities without fitting offsets.',
		);
		assessment = assessObservation(payload, gpu, previous, accounting);
		write('assessment.json.gz', gzipSync(Buffer.from(JSON.stringify(assessment)), {level: 9}));
		write('groups.json', {groups: assessment.groups, parity: assessment.parity});
		write('work.json', {
			anchors: payload.anchors.length / 4,
			preparedSamples: samples.length / 16,
			evaluatedRaySamples: samples.length / 4,
			loopFreeSampleHelpers: true,
			newCpuRadianceIntegrations: 0,
			regeneratedHigherFields: 0,
			gpuTimingIncludesReadback: true,
		});
		for (const id of [...parents, ...sources]) readRepository(id.path, id);
		for (const id of tools) assert.deepEqual(toolIdentity(id.path), id);
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	}
	const cleanup = run.cleanup(),
		state = failure ? 'failed' : 'accepted';
	const seal = run.finish(state, {
		caseId: 'remaining-observation-v1',
		jobElapsedMilliseconds: Date.now() - started,
		gpuJobsExecuted: gpuStarted ? 1 : 0,
		failure: failure?.message ?? null,
		proofChecks,
		cleanup,
		parityWitnessesWithinGuard: assessment?.parity.filter((p) => p.withinGuard).length ?? null,
		parityWitnessesTotal: assessment?.parity.length ?? null,
		fullSolverQualification: false,
		higherFieldsFrozen: true,
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
