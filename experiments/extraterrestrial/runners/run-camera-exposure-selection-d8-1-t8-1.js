#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import BASE_PROFILE from '../fixtures/camera-color-baseline-profile-v1.json' with {type: 'json'};
import CONFIGURATIONS from '../fixtures/camera-color-model-d8-t8-v1.json' with {type: 'json'};
import FIXTURE from '../fixtures/camera-exposure-selection-d8-1-v1.json' with {type: 'json'};
import {CameraColorModel} from '../color/CameraColorModel.js';
import {CameraExposureEvaluator} from '../color/CameraExposureEvaluator.js';
import {compileCameraColorProfile} from '../color/CameraColorProfile.js';
import {assertNoReparseEntries} from '../harness/lib/containment.js';
import {sha256File} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, REPOSITORY_ROOT, RUNS_ROOT, assertRepositoryIdentity} from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-camera-exposure-selection-d8-1-t8-1.js';
const FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'camera-exposure-selection-d8-1-v1.json');
const D8 = {runId: '000382-camera-color-model-d8-t8', artifactSetSha256: 'c2cf6efab91308d86e58d0a2123b2fb35fed85b46fb4406f77e90f085bbed275'};
const PROTECTED_SURFACES = ['src/algorithm32', 'src/flat32', 'scripts/algorithm32-star'];
const CLAIM_LIMIT = 'Application exposure selection only; no noise, blur, depth of field, diffraction, named-camera JPEG processing, glare, automatic schedule, or development look.';

function requireCondition(value, message) { if (!value) throw new Error(message); }

function decodeFloat32(bytes) {
	requireCondition(bytes.byteLength % 4 === 0, 'Float32 readback byte length is invalid.');
	const copy = new Uint8Array(bytes.byteLength); copy.set(bytes);
	return new Float32Array(copy.buffer);
}

function spectrumAt(packets, pixel) {
	return Array.from({length: 15}, (_, channel) => packets[Math.floor(channel / 4)][pixel * 4 + channel % 4]);
}

async function acceptedRun(identity, label) {
	const root = path.join(RUNS_ROOT, identity.runId);
	await assertNoReparseEntries(root, label);
	const manifest = JSON.parse(await readFile(path.join(root, 'artifact-manifest.json'), 'utf8'));
	requireCondition(manifest.runId === identity.runId && manifest.conclusion === 'accepted' && manifest.artifactSetSha256 === identity.artifactSetSha256, `${label} identity changed.`);
	return {root, manifest};
}

async function loadCondition(run, conditionId) {
	const packets = []; const parents = [];
	for (let index = 0; index < 4; index += 1) {
		const artifactPath = `readbacks/${conditionId}/pre-display-packet-${index}.f32le`;
		const entry = run.manifest.artifacts.find((item) => item.path === artifactPath);
		requireCondition(entry, `Missing ${artifactPath}.`);
		const absolute = path.join(run.root, ...artifactPath.split('/'));
		requireCondition(await sha256File(absolute) === entry.sha256, `${artifactPath} changed.`);
		packets.push(decodeFloat32(await readFile(absolute)));
		parents.push({runId: run.manifest.runId, artifactSetSha256: run.manifest.artifactSetSha256, path: artifactPath, sha256: entry.sha256});
	}
	return {packets, parents};
}

function compileConfiguration(configuration) {
	const profile = structuredClone(BASE_PROFILE);
	profile.profileId = `d8-${configuration.id.toLowerCase()}-v1`;
	profile.parents.push(D8);
	profile.capture.apertureFNumber = configuration.apertureFNumber;
	profile.capture.shutterSeconds = configuration.shutterSeconds;
	profile.capture.shutterNotation = configuration.shutterNotation;
	profile.capture.filterTransmission = 10 ** -configuration.filterOpticalDensity;
	profile.capture.filter = configuration.filterOpticalDensity === 0 ? 'none' : `ideal-neutral-od-${configuration.filterOpticalDensity}`;
	profile.capture.isoLabel = configuration.iso;
	profile.capture.postWellGain = configuration.postWellGain;
	profile.claimLimit = `${CONFIGURATIONS.claimLimit} Exposure selection evaluates ${configuration.id}; it does not simulate secondary photographic effects.`;
	profile.derivedFrom = {profileId: BASE_PROFILE.profileId, operation: 'composition of qualified exposure controls', settings: structuredClone(configuration), equations: {optical: 'shutterSeconds / apertureFNumber^2 * 10^(-OD)', postWell: 'postWellGain = ISO/100'}};
	return compileCameraColorProfile(profile);
}

function samplePixels(width, height) {
	const x = Math.floor(width / 2);
	return {'disk-center': Math.floor(height / 2) * width + x, 'upper-quarter': Math.floor(height * 0.75) * width + x, 'top-center': (height - 1) * width + x};
}

async function protectedInventory() {
	const entries = [];
	async function visit(absolute, relative) {
		let stat; try { stat = await lstat(absolute); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
		requireCondition(!stat.isSymbolicLink(), `Protected surface contains a symbolic link: ${relative}`);
		if (stat.isDirectory()) { const children = await readdir(absolute); children.sort((a, b) => a.localeCompare(b, 'en')); for (const child of children) await visit(path.join(absolute, child), `${relative}/${child}`); return; }
		requireCondition(stat.isFile(), `Unsupported protected entry: ${relative}`);
		const bytes = await readFile(absolute); entries.push({path: relative.replaceAll('\\', '/'), byteLength: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')});
	}
	for (const relative of PROTECTED_SURFACES) await visit(path.join(REPOSITORY_ROOT, ...relative.split('/')), relative);
	return {roots: PROTECTED_SURFACES, entries};
}

function bestQualified(selection) {
	return selection.qualified.length === 0 || selection.selected === selection.qualified.reduce((best, item) => item.meanEncodedLuminance > best.meanEncodedLuminance ? item : best);
}

async function main() {
	const run = await initializeRunRecord({slug: 'camera-exposure-selection-d8-1-t8-1', command: COMMAND, inputs: {fixture: 'experiments/extraterrestrial/fixtures/camera-exposure-selection-d8-1-v1.json', configurations: 'experiments/extraterrestrial/fixtures/camera-color-model-d8-t8-v1.json', dependency: D8, sourceRun: FIXTURE.sourceRun}, provenance: {purpose: 'Predict complete-profile sky/celestial results and deterministically select settings for declared application modes.', method: 'Evaluate every candidate through CameraColorModel, apply explicit clipping/visibility constraints, and select maximum mean encoded field luminance with deterministic tie breaks.', claimLimit: CLAIM_LIMIT}, environment: {node: process.version, platform: process.platform}, references: {developmentPlan: 'agents/topics/extraterrestrial/camera-controls-development-plan.md', testingPlan: 'agents/topics/extraterrestrial/camera-controls-testing-plan.md', inventory: 'agents/topics/extraterrestrial/camera-control-test-inventory.md'}});
	try {
		await assertRepositoryIdentity(); await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree');
		const before = await protectedInventory();
		const [d8, sourceRun] = await Promise.all([acceptedRun(D8, 'D8/T8 dependency'), acceptedRun(FIXTURE.sourceRun, 'Production spectral source')]);
		const [noon, sunset] = await Promise.all([loadCondition(sourceRun, 'solar-noon'), loadCondition(sourceRun, 'sunset')]);
		const fields = {'solar-noon': noon, sunset};
		const width = FIXTURE.sourceRun.widthPixels; const height = FIXTURE.sourceRun.heightPixels; const pixelCount = width * height;
		const samples = samplePixels(width, height); const evaluator = new CameraExposureEvaluator();
		const evaluations = [];
		for (const configuration of CONFIGURATIONS.configurations) {
			const profile = compileConfiguration(configuration); const field = fields[configuration.conditionId];
			const evaluation = evaluator.evaluate({profile, pixelCount, spectrumAt: (pixel) => spectrumAt(field.packets, pixel), samplePixels: samples});
			evaluations.push({configuration, profile, evaluation});
		}
		const forCondition = (conditionId) => evaluations.filter(({configuration}) => configuration.conditionId === conditionId).map(({evaluation}) => evaluation);
		const normalNoon = evaluator.select({mode: 'normal', evaluations: forCondition('solar-noon'), policy: FIXTURE.policies.normal});
		const normalSunset = evaluator.select({mode: 'normal', evaluations: forCondition('sunset'), policy: FIXTURE.policies.normal});
		const diskVisible = evaluator.select({mode: 'disk-visible', evaluations: forCondition('solar-noon'), policy: FIXTURE.policies.diskVisible});
		const phoneSunset = evaluations.find(({configuration}) => configuration.id === 'U-PHONE-SUNSET');
		const manual = evaluator.select({mode: 'manual', evaluations: forCondition('sunset'), policy: {}, manualProfileId: phoneSunset.profile.profileId});
		const impossible = evaluator.select({mode: 'normal', evaluations: forCondition('sunset'), policy: {...FIXTURE.policies.normal, maximumRawClippedFraction: 0, maximumAdcClippedFraction: 0, maximumDisplayHighClippedFraction: 0, maximumExactWhiteFraction: 0}});
		const baselineEvaluation = evaluations.find(({configuration}) => configuration.id === 'U-PHONE-DAYLIGHT').evaluation;
		const continuity = evaluator.select({mode: 'normal', evaluations: forCondition('solar-noon'), policy: {...FIXTURE.policies.normal, previousOpticalExposureFactor: baselineEvaluation.opticalExposureFactor, maximumExposureChangeEv: 0.01}});
		const repeatProfile = evaluations.find(({configuration}) => configuration.id === 'U-DSLR-NOON').profile;
		const repeatA = evaluator.evaluate({profile: repeatProfile, pixelCount, spectrumAt: (pixel) => spectrumAt(noon.packets, pixel), samplePixels: samples});
		const repeatB = evaluator.evaluate({profile: repeatProfile, pixelCount, spectrumAt: (pixel) => spectrumAt(noon.packets, pixel), samplePixels: samples});
		const publicModel = new CameraColorModel(repeatProfile); const centerSpectrum = spectrumAt(noon.packets, samples['disk-center']);
		const assertions = []; const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(evaluations.length === 8 && evaluations.every(({evaluation}) => evaluation.nonFinitePixelCount === 0), 'All eight complete profiles produce finite full-field predictions.');
		check(JSON.stringify(repeatA) === JSON.stringify(repeatB), 'Repeated full-field evaluation is byte-stable after JSON serialization.');
		check(JSON.stringify(publicModel.radianceToDisplayRgb(centerSpectrum)) === JSON.stringify(repeatA.samples['disk-center'].encodedSrgb), 'Evaluator disk-center output equals the public CameraColorModel result exactly.');
		check(normalNoon.selected && bestQualified(normalNoon), 'Normal noon selects the brightest qualifying complete profile.');
		check(normalSunset.selected && bestQualified(normalSunset), 'Normal sunset selects the brightest qualifying complete profile.');
		check(diskVisible.selected?.profileId.includes('u-disk-manual') && diskVisible.selected.samples['disk-center'].rawClipped.every((value) => !value), 'Disk-visible mode selects the OD 5 profile with every disk-center raw channel recovered.');
		check(manual.selected.profileId === phoneSunset.profile.profileId && manual.qualified.length === 1, 'Manual mode returns the requested profile without optimization.');
		check(impossible.selected === null && impossible.qualified.length === 0 && impossible.rationale.includes('No candidate'), 'An unsatisfied policy returns no candidate rather than a least-bad fallback.');
		check(continuity.selected && continuity.qualified.every((item) => Math.abs(Math.log2(item.opticalExposureFactor / baselineEvaluation.opticalExposureFactor)) <= 0.01), 'Optional continuity rejects candidates outside the declared EV step.');
		const selectionSummary = {normalNoon, normalSunset, diskVisible, manual, impossible, continuity};
		const proof = {proofId: 'camera-exposure-selection-d8-1-t8-1-v1', accepted: true, assertions, summary: {evaluationCount: evaluations.length, selected: {normalNoon: normalNoon.selected.profileId, normalSunset: normalSunset.selected.profileId, diskVisible: diskVisible.selected.profileId, manual: manual.selected.profileId, continuity: continuity.selected.profileId}, noQualifiedReported: impossible.selected === null, normalNoonMeanEncodedLuminance: normalNoon.selected.meanEncodedLuminance, normalSunsetMeanEncodedLuminance: normalSunset.selected.meanEncodedLuminance}, claimLimit: CLAIM_LIMIT};
		await run.writeJsonArtifact('evidence/evaluations.json', {schemaId: 'camera-exposure-evaluations-v1', evaluations});
		await run.writeJsonArtifact('evidence/selections.json', {schemaId: 'camera-exposure-selections-v1', policies: FIXTURE.policies, selections: selectionSummary});
		await run.writeJsonArtifact('evidence/derivation.json', {schemaId: 'camera-exposure-selection-derivation-v1', parents: [{runId: d8.manifest.runId, artifactSetSha256: d8.manifest.artifactSetSha256}, ...noon.parents, ...sunset.parents], operation: {evaluation: 'complete CameraColorModel trace over every pixel', opticalExposure: 'shutterSeconds / apertureFNumber^2 * filterTransmission', selection: 'filter explicit constraints, then maximum mean encoded luminance; deterministic clipping/profile-ID tie breaks'}, implementation: {runner: 'experiments/extraterrestrial/runners/run-camera-exposure-selection-d8-1-t8-1.js', runnerSha256: await sha256File(import.meta.filename), evaluator: 'experiments/extraterrestrial/color/CameraExposureEvaluator.js', evaluatorSha256: await sha256File(path.join(EXPERIMENT_ROOT, 'color', 'CameraExposureEvaluator.js')), fixture: 'experiments/extraterrestrial/fixtures/camera-exposure-selection-d8-1-v1.json', fixtureSha256: await sha256File(FIXTURE_PATH)}, excluded: FIXTURE.excluded, resultIdentityOwner: 'artifact-manifest.json'});
		const closure = await buildStaticModuleClosure({candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-camera-exposure-selection-d8-1-t8-1.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process','node:crypto','node:fs','node:fs/promises','node:module','node:os','node:path','node:url','node:util']});
		const after = await protectedInventory(); check(JSON.stringify(before) === JSON.stringify(after), 'Explicit protected production-surface fingerprints are unchanged.');
		proof.containment = {protectedRoots: after.roots, protectedFiles: after.entries.length, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length, gitIndependent: true};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const manifest = await run.finalize({conclusion: 'accepted', result: proof, report: `# ${run.runId}: camera exposure prediction and selection D8.1/T8.1\n\nConclusion: **accepted as deterministic application exposure-policy evidence**.\n\nAll eight complete profiles were evaluated. Normal noon selected ${normalNoon.selected.profileId}; normal sunset selected ${normalSunset.selected.profileId}; disk-visible selected ${diskVisible.selected.profileId}. No secondary photographic effects or development look were introduced.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, summary: proof.summary}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({conclusion: 'failed', result: {error: detail}, report: `# ${run.runId}: camera exposure prediction and selection D8.1/T8.1\n\nConclusion: **failed**.\n\n${detail.message}\n`}); process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`); } catch {}
		process.exitCode = 1;
	}
}

await main();
