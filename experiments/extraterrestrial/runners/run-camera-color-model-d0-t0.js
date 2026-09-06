#!/usr/bin/env node

import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {deflateSync} from 'node:zlib';

import PROFILE_SOURCE from '../fixtures/camera-color-baseline-profile-v1.json' with {type: 'json'};
import {CameraColorModel} from '../color/CameraColorModel.js';
import {compileCameraColorProfile} from '../color/CameraColorProfile.js';
import {assertNoReparseEntries, createProtectedTrackedInventory, loadContainmentPolicy} from '../harness/lib/containment.js';
import {assertFileInventoriesEqual, sha256File} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, RUNS_ROOT, assertRepositoryIdentity} from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-camera-color-model-d0-t0.js';
const PROFILE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'camera-color-baseline-profile-v1.json');
const FIELD = Object.freeze({
	runId: '000352-spectral-color-production-wide-light-adapted-log',
	artifactSetSha256: 'a563b4366dd465ff4d6a6c7a496594fec4e21c0f0659113887d04ff04f6ffb49',
	conditionId: 'solar-noon',
	width: 641,
	height: 401,
});
const STAGE8A = Object.freeze({runId: '000358-camera-relative-projection-stage8a', artifactSetSha256: '69607f8d1a9339f6cc9d69a0c568cba85bd41ec25e80e55e66b2906d55b9d249'});
const STAGE8C = Object.freeze({runId: '000363-camera-generic-phone-stage8c', artifactSetSha256: '06c581d4802ffc2598a76147edac62db0c4b93e2c3c954d562f8159a71242829'});

function requireCondition(value, message) { if (!value) throw new Error(message); }
function decodeFloat32(bytes) { requireCondition(bytes.byteLength % 4 === 0, 'Invalid Float32 packet.'); const copy = new Uint8Array(bytes.byteLength); copy.set(bytes); return new Float32Array(copy.buffer); }
function spectrumAt(packets, pixel) { return Array.from({length: 15}, (_, channel) => packets[Math.floor(channel / 4)][pixel * 4 + channel % 4]); }
function samples() { const x = Math.floor(FIELD.width / 2); return {'disk-center': Math.floor(FIELD.height / 2) * FIELD.width + x, 'upper-quarter': Math.floor(FIELD.height * 0.75) * FIELD.width + x, 'top-center': (FIELD.height - 1) * FIELD.width + x}; }
function maximumAbsolute(left, right) { return left.reduce((maximum, value, index) => Math.max(maximum, Math.abs(value - right[index])), 0); }
function crc32(bytes) { let crc = 0xffffffff; for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); } return (crc ^ 0xffffffff) >>> 0; }
function chunk(type, data = Buffer.alloc(0)) { const name = Buffer.from(type, 'ascii'), length = Buffer.alloc(4), sum = Buffer.alloc(4); length.writeUInt32BE(data.length); sum.writeUInt32BE(crc32(Buffer.concat([name, data]))); return Buffer.concat([length, name, data, sum]); }
function png(width, height, rgba) { const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6; const stride = width * 4, rows = Buffer.alloc((stride + 1) * height); for (let y = 0; y < height; y += 1) { const target = y * (stride + 1), source = (height - 1 - y) * stride; rows[target] = 0; rgba.copy(rows, target + 1, source, source + stride); } return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(rows, {level: 9})), chunk('IEND')]); }

async function loadRun(identity, label) {
	const root = path.join(RUNS_ROOT, identity.runId);
	await assertNoReparseEntries(root, label);
	const manifest = JSON.parse(await readFile(path.join(root, 'artifact-manifest.json'), 'utf8'));
	requireCondition(manifest.runId === identity.runId && manifest.conclusion === 'accepted' && manifest.artifactSetSha256 === identity.artifactSetSha256, `${label} identity changed.`);
	return {root, manifest};
}

async function artifact(run, relativePath) {
	const entry = run.manifest.artifacts.find((candidate) => candidate.path === relativePath);
	requireCondition(entry, `Missing parent artifact: ${relativePath}`);
	const absolute = path.join(run.root, ...relativePath.split('/'));
	requireCondition(await sha256File(absolute) === entry.sha256, `Parent artifact changed: ${relativePath}`);
	return {bytes: await readFile(absolute), identity: {runId: run.manifest.runId, artifactSetSha256: run.manifest.artifactSetSha256, path: relativePath, sha256: entry.sha256, byteLength: entry.byteLength}};
}

function compareStage8cSample(actual, expected) {
	return {
		photoelectronMaximumAbsoluteError: maximumAbsolute(actual.photoelectrons, expected.photoelectrons),
		fullWellFractionMaximumAbsoluteError: maximumAbsolute(actual.fullWellFraction, expected.fullWellFraction),
		normalizedMaximumAbsoluteError: maximumAbsolute(actual.normalizedPostGain, expected.normalizedPostIso),
		whiteBalanceMaximumAbsoluteError: maximumAbsolute(actual.whiteBalanced, expected.whiteBalancedClipped),
		xyzMaximumAbsoluteError: maximumAbsolute(actual.xyzD65, expected.xyzD65),
		linearMaximumAbsoluteError: maximumAbsolute(actual.preDevelopmentLinearRec709D65, expected.preclipLinearRec709D65),
		encodedMaximumAbsoluteError: maximumAbsolute(actual.encodedSrgb, expected.encodedSrgb),
		rawClipIdentity: JSON.stringify(actual.rawClipped) === JSON.stringify(expected.rawClipped),
		adcIdentity: JSON.stringify(actual.adcCodes) === JSON.stringify(expected.adc),
	};
}

async function main() {
	const run = await initializeRunRecord({
		slug: 'camera-color-model-d0-t0', command: COMMAND,
		inputs: {profile: 'experiments/extraterrestrial/fixtures/camera-color-baseline-profile-v1.json', field: FIELD, parents: {stage8a: STAGE8A, stage8c: STAGE8C}, cases: ['B-01', 'B-02', 'B-03']},
		provenance: {purpose: 'D0/T0 CameraColorModel contract, complete-profile migration, accepted Stage 8c reproduction, zero proof, and public/trace parity', derivation: 'accepted Stage 8a/8c matrices and physical parameters consolidated without refitting or atmosphere execution'},
		environment: {node: process.version, platform: process.platform},
		references: {developmentPlan: 'agents/topics/extraterrestrial/camera-controls-development-plan.md', testingPlan: 'agents/topics/extraterrestrial/camera-controls-testing-plan.md', inventory: 'agents/topics/extraterrestrial/camera-control-test-inventory.md', research: 'agents/topics/extraterrestrial/camera-spectral-color-prior-art-research.md'},
	});
	try {
		await assertRepositoryIdentity();
		const policy = await loadContainmentPolicy(), before = await createProtectedTrackedInventory(policy);
		await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree');
		const [fieldRun, stage8aRun, stage8cRun] = await Promise.all([loadRun(FIELD, 'Production field'), loadRun(STAGE8A, 'Stage 8a'), loadRun(STAGE8C, 'Stage 8c')]);
		const [oldProofArtifact, oldRenderArtifact, unitAuditArtifact, compiledProfileArtifact, pbrtSourceArtifact, pbrtLicenseArtifact] = await Promise.all([
			artifact(stage8cRun, 'evidence/stage8c-proof.json'), artifact(stage8cRun, 'renders/generic-phone-wide-solar-noon.png'), artifact(stage8cRun, 'evidence/unit-audit.json'),
			artifact(stage8aRun, 'evidence/compiled-camera-profile.json'), artifact(stage8aRun, 'evidence/pbrt-spectrum.cpp'), artifact(stage8aRun, 'evidence/pbrt-license.txt'),
		]);
		const oldProof = JSON.parse(oldProofArtifact.bytes.toString('utf8'));
		await run.writeArtifact('references/stage8a-compiled-camera-profile.json', compiledProfileArtifact.bytes);
		await run.writeArtifact('references/pbrt-spectrum.cpp', pbrtSourceArtifact.bytes);
		await run.writeArtifact('references/pbrt-license.txt', pbrtLicenseArtifact.bytes);
		await run.writeArtifact('references/stage8c-unit-audit.json', unitAuditArtifact.bytes);
		await run.writeArtifact('references/stage8c-proof.json', oldProofArtifact.bytes);
		await run.writeArtifact('references/stage8c-render.png', oldRenderArtifact.bytes);
		await run.writeArtifact('evidence/camera-color-profile.json', await readFile(PROFILE_PATH));

		const profile = compileCameraColorProfile(PROFILE_SOURCE);
		const model = new CameraColorModel(profile);
		const packetArtifacts = [], packets = [];
		for (let index = 0; index < 4; index += 1) {
			const packet = await artifact(fieldRun, `readbacks/${FIELD.conditionId}/pre-display-packet-${index}.f32le`);
			packetArtifacts.push(packet.identity); packets.push(decodeFloat32(packet.bytes));
		}
		const named = {};
		for (const [name, pixel] of Object.entries(samples())) {
			const spectrum = spectrumAt(packets, pixel), trace = model.traceRadiance(spectrum), publicRgb = model.radianceToDisplayRgb(spectrum);
			named[name] = {pixelIndex: pixel, spectrum, trace, publicRgb, comparison: compareStage8cSample(trace, oldProof.summary.nominalSamples[name])};
		}
		const zeroTrace = model.traceRadiance(Array(15).fill(0));
		const pixelCount = FIELD.width * FIELD.height, rgba = Buffer.alloc(pixelCount * 4);
		let rawClippedPixels = 0, allChannelClippedPixels = 0, adcClippedPixels = 0, nonFinitePixels = 0, publicTraceMismatchPixels = 0;
		for (let pixel = 0; pixel < pixelCount; pixel += 1) {
			const spectrum = spectrumAt(packets, pixel), trace = model.traceRadiance(spectrum), display = model.radianceToDisplayRgb(spectrum);
			if (trace.rawClipChannelCount > 0) rawClippedPixels += 1;
			if (trace.rawClipChannelCount === 3) allChannelClippedPixels += 1;
			if (trace.adcClipped.some(Boolean)) adcClippedPixels += 1;
			if ([...trace.photoelectrons, ...display].some((value) => !Number.isFinite(value))) nonFinitePixels += 1;
			if (display.some((value, channel) => !Object.is(value, trace.encodedSrgb[channel]))) publicTraceMismatchPixels += 1;
			for (let channel = 0; channel < 3; channel += 1) rgba[pixel * 4 + channel] = Math.round(display[channel] * 255);
			rgba[pixel * 4 + 3] = 255;
		}
		const rendered = png(FIELD.width, FIELD.height, rgba);
		await run.writeArtifact('renders/camera-color-model-wide-solar-noon.png', rendered);
		const renderSha256 = await sha256File(path.join(run.runDirectory, 'renders', 'camera-color-model-wide-solar-noon.png'));
		const assertions = [];
		const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(model.profile.profileId === profile.profileId && model.profile.schemaId === profile.schemaId, 'CameraColorModel consumes one complete CameraColorProfile and no loose parameters.');
		check(Object.isFrozen(model.profile) && Object.isFrozen(model.profile.device) && Object.isFrozen(model.profile.capture), 'The complete profile and nested parameter groups are immutable.');
		check(Object.values(named).every((sample) => Object.values(sample.comparison).every((value) => typeof value === 'boolean' ? value : value <= 1e-9)), 'All named Stage 8c intermediate values reproduce within 1e-9 absolute and discrete values are identical.');
		check(rawClippedPixels === oldProof.summary.rawClippedPixels && allChannelClippedPixels === oldProof.summary.allChannelClippedPixels, 'Full-frame raw clipping counts reproduce accepted Stage 8c.');
		check(renderSha256 === oldRenderArtifact.identity.sha256, 'Public CameraColorModel framebuffer is byte-identical to the accepted Stage 8c render.');
		check(publicTraceMismatchPixels === 0, 'Public radianceToDisplayRgb equals the trace terminal value for every pixel.');
		check(nonFinitePixels === 0, 'Every full-frame model result is finite.');
		check([...zeroTrace.photoelectrons, ...zeroTrace.clippedElectrons, ...zeroTrace.adcCodes, ...zeroTrace.xyzD65, ...zeroTrace.encodedSrgb].every((value) => Object.is(value, 0)), 'Exact-zero native-15 input remains exact zero through every tested boundary.');
		const derivation = {schemaId: 'camera-color-model-d0-t0-derivation-v1', parents: {fieldPackets: packetArtifacts, stage8aCompiledProfile: compiledProfileArtifact.identity, stage8cProof: oldProofArtifact.identity, stage8cUnitAudit: unitAuditArtifact.identity, stage8cRender: oldRenderArtifact.identity}, profile: {path: 'experiments/extraterrestrial/fixtures/camera-color-baseline-profile-v1.json', sha256: await sha256File(PROFILE_PATH), id: profile.profileId}, implementations: {model: {path: 'experiments/extraterrestrial/color/CameraColorModel.js', sha256: await sha256File(path.join(EXPERIMENT_ROOT, 'color', 'CameraColorModel.js'))}, profileCompiler: {path: 'experiments/extraterrestrial/color/CameraColorProfile.js', sha256: await sha256File(path.join(EXPERIMENT_ROOT, 'color', 'CameraColorProfile.js'))}, runner: {path: 'experiments/extraterrestrial/runners/run-camera-color-model-d0-t0.js', sha256: await sha256File(import.meta.filename)}}, operations: profile.derivation.operations, resultIdentityOwner: 'artifact-manifest.json'};
		const proof = {proofId: 'camera-color-model-d0-t0-v1', accepted: true, assertions, summary: {model: model.describe(), pixelCount, rawClippedPixels, allChannelClippedPixels, adcClippedPixels, nonFinitePixels, publicTraceMismatchPixels, renderSha256, acceptedStage8cRenderSha256: oldRenderArtifact.identity.sha256, named, zeroTrace}, claimLimit: profile.claimLimit, nextStep: 'D2/T2 optical-control profiles and proofs; acquire and hash their exact external source documents before qualification.'};
		await run.writeJsonArtifact('evidence/derivation.json', derivation);
		await run.writeJsonArtifact('evidence/d0-t0-proof.json', proof);
		const closure = await buildStaticModuleClosure({candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-camera-color-model-d0-t0.js', 'color/CameraColorModel.js', 'color/CameraColorProfile.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process','node:crypto','node:fs','node:fs/promises','node:module','node:os','node:path','node:url','node:util','node:zlib']});
		const after = await createProtectedTrackedInventory(policy); assertFileInventoriesEqual(before, after, 'Camera Color D0/T0 protected inventory');
		proof.containment = {protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length};
		const manifest = await run.finalize({conclusion: 'accepted', result: proof, report: `# ${run.runId}: Camera Color model D0/T0\n\nConclusion: **accepted**.\n\nThe complete baseline CameraColorProfile and public CameraColorModel reproduce accepted Stage 8c, including a byte-identical framebuffer and raw-clipping counts. Exact zero remains zero, and every public pixel equals its trace terminal value.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, summary: proof.summary}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({conclusion: 'failed', result: {error: detail}, report: `# ${run.runId}: Camera Color model D0/T0\n\nConclusion: **failed**.\n\n${detail.message}\n`}); process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`); } catch {}
		process.exitCode = 1;
	}
}

await main();
