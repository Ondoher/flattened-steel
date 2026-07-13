#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {deflateSync} from 'node:zlib';
import BASE_PROFILE from '../fixtures/camera-color-baseline-profile-v1.json' with {type: 'json'};
import CONFIGURATIONS from '../fixtures/camera-color-model-d8-t8-v1.json' with {type: 'json'};
import {CameraColorModel} from '../color/CameraColorModel.js';
import {compileCameraColorProfile} from '../color/CameraColorProfile.js';
import {assertNoReparseEntries} from '../harness/lib/containment.js';
import {sha256File} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, REPOSITORY_ROOT, RUNS_ROOT, assertRepositoryIdentity} from '../harness/lib/roots.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-camera-exposure-selected-renders-d8-2-t8-2.js';
const SOURCE = {runId: '000352-spectral-color-production-wide-light-adapted-log', artifactSetSha256: 'a563b4366dd465ff4d6a6c7a496594fec4e21c0f0659113887d04ff04f6ffb49'};
const D8 = {runId: '000382-camera-color-model-d8-t8', artifactSetSha256: 'c2cf6efab91308d86e58d0a2123b2fb35fed85b46fb4406f77e90f085bbed275'};
const D81 = {runId: '000384-camera-exposure-selection-d8-1-t8-1', artifactSetSha256: '8b47a56b8eb9aa9f0dd13601fee7351a502e5c0f24258cb0d88789ff71317a39'};
const WIDTH = 641; const HEIGHT = 401; const PIXELS = WIDTH * HEIGHT;
const PROTECTED_SURFACES = ['src/algorithm32', 'src/flat32', 'scripts/algorithm32-star'];

function requireCondition(value, message) { if (!value) throw new Error(message); }
function luminance(rgb) { return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]; }
function decodeFloat32(bytes) { requireCondition(bytes.byteLength % 4 === 0, 'Invalid Float32 bytes.'); const copy = new Uint8Array(bytes.byteLength); copy.set(bytes); return new Float32Array(copy.buffer); }
function spectrumAt(packets, pixel) { return Array.from({length: 15}, (_, channel) => packets[Math.floor(channel / 4)][pixel * 4 + channel % 4]); }

function crc32(bytes) { let crc = 0xffffffff; for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); } return (crc ^ 0xffffffff) >>> 0; }
function pngChunk(type, data = Buffer.alloc(0)) { const name = Buffer.from(type, 'ascii'); const length = Buffer.alloc(4); length.writeUInt32BE(data.length); const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, data]))); return Buffer.concat([length, name, data, checksum]); }
function encodePng(width, height, rgbaBottomUp) { const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6; const stride = width * 4; const rows = Buffer.alloc((stride + 1) * height); for (let y = 0; y < height; y += 1) { const target = y * (stride + 1); rows[target] = 0; const source = (height - 1 - y) * stride; rgbaBottomUp.copy(rows, target + 1, source, source + stride); } return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), pngChunk('IHDR', ihdr), pngChunk('IDAT', deflateSync(rows, {level: 9})), pngChunk('IEND')]); }

async function acceptedRun(identity, label) { const root = path.join(RUNS_ROOT, identity.runId); await assertNoReparseEntries(root, label); const manifest = JSON.parse(await readFile(path.join(root, 'artifact-manifest.json'), 'utf8')); requireCondition(manifest.runId === identity.runId && manifest.conclusion === 'accepted' && manifest.artifactSetSha256 === identity.artifactSetSha256, `${label} changed.`); return {root, manifest}; }
async function artifact(run, artifactPath) { const entry = run.manifest.artifacts.find((item) => item.path === artifactPath); requireCondition(entry, `Missing ${artifactPath}.`); const absolute = path.join(run.root, ...artifactPath.split('/')); requireCondition(await sha256File(absolute) === entry.sha256, `${artifactPath} changed.`); return {bytes: await readFile(absolute), parent: {runId: run.manifest.runId, artifactSetSha256: run.manifest.artifactSetSha256, path: artifactPath, sha256: entry.sha256}}; }

async function loadPackets(run, conditionId) { const packets = []; const parents = []; for (let index = 0; index < 4; index += 1) { const loaded = await artifact(run, `readbacks/${conditionId}/pre-display-packet-${index}.f32le`); packets.push(decodeFloat32(loaded.bytes)); parents.push(loaded.parent); } return {packets, parents}; }

function compileConfiguration(configuration) { const profile = structuredClone(BASE_PROFILE); profile.profileId = `d8-${configuration.id.toLowerCase()}-v1`; profile.parents.push(D8, D81); profile.capture.apertureFNumber = configuration.apertureFNumber; profile.capture.shutterSeconds = configuration.shutterSeconds; profile.capture.shutterNotation = configuration.shutterNotation; profile.capture.filterTransmission = 10 ** -configuration.filterOpticalDensity; profile.capture.filter = configuration.filterOpticalDensity === 0 ? 'none' : `ideal-neutral-od-${configuration.filterOpticalDensity}`; profile.capture.isoLabel = configuration.iso; profile.capture.postWellGain = configuration.postWellGain; profile.claimLimit = `${CONFIGURATIONS.claimLimit} Selected-profile render; no secondary photographic effects.`; profile.derivedFrom = {profileId: BASE_PROFILE.profileId, operation: 'render verified D8.1 selected complete profile', settings: structuredClone(configuration)}; return compileCameraColorProfile(profile); }

function render(profile, packets) { const model = new CameraColorModel(profile); const rgba = Buffer.alloc(PIXELS * 4); let rawClippedPixelCount = 0; let adcClippedPixelCount = 0; let displayHighClippedPixelCount = 0; let meanEncodedLuminance = 0; for (let pixel = 0; pixel < PIXELS; pixel += 1) { const trace = model.traceRadiance(spectrumAt(packets, pixel)); if (trace.rawClipChannelCount > 0) rawClippedPixelCount += 1; if (trace.adcClipped.some(Boolean)) adcClippedPixelCount += 1; if (trace.preDevelopmentLinearRec709D65.some((value) => value > 1)) displayHighClippedPixelCount += 1; meanEncodedLuminance += luminance(trace.encodedSrgb); const offset = pixel * 4; for (let channel = 0; channel < 3; channel += 1) rgba[offset + channel] = Math.round(Math.min(1, Math.max(0, trace.encodedSrgb[channel])) * 255); rgba[offset + 3] = 255; } return {png: encodePng(WIDTH, HEIGHT, rgba), summary: {rawClippedPixelCount, adcClippedPixelCount, displayHighClippedPixelCount, meanEncodedLuminance: meanEncodedLuminance / PIXELS}}; }

function escapeXml(value) { return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }
function plate(rows) { const scale = 0.6; const imageWidth = WIDTH * scale; const imageHeight = HEIGHT * scale; const labelWidth = 360; const rowHeight = imageHeight + 42; const totalWidth = labelWidth + imageWidth + 24; const totalHeight = 52 + rows.length * rowHeight; const body = rows.map((row, index) => { const y = 52 + index * rowHeight; return `<text x="12" y="${y + 22}" fill="#eee" font-family="monospace" font-size="14">${escapeXml(row.label)}</text><image x="${labelWidth}" y="${y}" width="${imageWidth}" height="${imageHeight}" href="data:image/png;base64,${row.png.toString('base64')}"/>`; }).join(''); return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}"><rect width="100%" height="100%" fill="#202020"/><text x="12" y="31" fill="white" font-family="sans-serif" font-size="20">Predicted profile selections rendered through CameraColorModel</text>${body}</svg>`); }

async function protectedInventory() { const entries = []; async function visit(absolute, relative) { let stat; try { stat = await lstat(absolute); } catch (error) { if (error.code === 'ENOENT') return; throw error; } requireCondition(!stat.isSymbolicLink(), `Protected symbolic link: ${relative}`); if (stat.isDirectory()) { const children = await readdir(absolute); children.sort((a, b) => a.localeCompare(b, 'en')); for (const child of children) await visit(path.join(absolute, child), `${relative}/${child}`); return; } const bytes = await readFile(absolute); entries.push({path: relative.replaceAll('\\', '/'), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')}); } for (const relative of PROTECTED_SURFACES) await visit(path.join(REPOSITORY_ROOT, ...relative.split('/')), relative); return {roots: PROTECTED_SURFACES, entries}; }

async function main() {
	const run = await initializeRunRecord({slug: 'camera-exposure-selected-renders-d8-2-t8-2', command: COMMAND, inputs: {selectionRun: D81, configurationRun: D8, spectralRun: SOURCE, modes: ['normal-noon','normal-sunset','disk-visible','manual','continuity']}, provenance: {purpose: 'Render the complete profiles selected by verified D8.1 predictions.', method: 'Resolve each selected profile ID to its retained settings, run the public CameraColorModel over the matched production native-15 field, and compare render metrics and PNG identity to D8.', claimLimit: 'Selected-profile presentation evidence only; no new selection policy, development look, secondary camera physics, or no-qualified fallback.'}, environment: {node: process.version, platform: process.platform}, references: {activeTopic: 'agents/topics/active-topic.md', testingPlan: 'agents/topics/extraterrestrial/camera-controls-testing-plan.md'}});
	try {
		await assertRepositoryIdentity(); await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree'); const before = await protectedInventory();
		const [selectionRun, d8Run, sourceRun] = await Promise.all([acceptedRun(D81, 'D8.1 selection run'), acceptedRun(D8, 'D8 render run'), acceptedRun(SOURCE, 'Production spectral run')]);
		const selectionArtifact = await artifact(selectionRun, 'evidence/selections.json'); const selectionEvidence = JSON.parse(selectionArtifact.bytes.toString('utf8'));
		const [noon, sunset] = await Promise.all([loadPackets(sourceRun, 'solar-noon'), loadPackets(sourceRun, 'sunset')]);
		const requested = [
			{mode: 'normal-noon', selection: selectionEvidence.selections.normalNoon.selected, conditionId: 'solar-noon'},
			{mode: 'normal-sunset', selection: selectionEvidence.selections.normalSunset.selected, conditionId: 'sunset'},
			{mode: 'disk-visible', selection: selectionEvidence.selections.diskVisible.selected, conditionId: 'solar-noon'},
			{mode: 'manual', selection: selectionEvidence.selections.manual.selected, conditionId: 'sunset'},
			{mode: 'continuity', selection: selectionEvidence.selections.continuity.selected, conditionId: 'solar-noon'},
		];
		requireCondition(selectionEvidence.selections.impossible.selected === null, 'No-qualified control unexpectedly selected a profile.');
		const rows = []; const results = [];
		for (const item of requested) {
			const configuration = CONFIGURATIONS.configurations.find((candidate) => `d8-${candidate.id.toLowerCase()}-v1` === item.selection.profileId);
			requireCondition(configuration, `Selected profile has no retained configuration: ${item.selection.profileId}`);
			const profile = compileConfiguration(configuration); const rendered = render(profile, item.conditionId === 'sunset' ? sunset.packets : noon.packets);
			requireCondition(rendered.summary.rawClippedPixelCount === item.selection.rawClippedPixelCount, `${item.mode} raw-clipping prediction mismatch.`);
			requireCondition(rendered.summary.adcClippedPixelCount === item.selection.adcClippedPixelCount, `${item.mode} ADC-clipping prediction mismatch.`);
			requireCondition(rendered.summary.displayHighClippedPixelCount === item.selection.displayHighClippedPixelCount, `${item.mode} display-clipping prediction mismatch.`);
			requireCondition(Math.abs(rendered.summary.meanEncodedLuminance - item.selection.meanEncodedLuminance) <= 1e-15, `${item.mode} luminance prediction mismatch.`);
			const d8Image = await artifact(d8Run, `renders/${configuration.id}.png`); const outputPath = `renders/${item.mode}.png`; await run.writeArtifact(outputPath, rendered.png);
			const pngSha256 = createHash('sha256').update(rendered.png).digest('hex'); requireCondition(pngSha256 === d8Image.parent.sha256, `${item.mode} PNG differs from the earlier render of the same complete profile.`);
			results.push({mode: item.mode, conditionId: item.conditionId, configuration, profileId: profile.profileId, prediction: item.selection, observed: rendered.summary, outputPath, pngSha256, priorRender: d8Image.parent});
			rows.push({label: `${item.mode} | ${configuration.shutterNotation} f/${configuration.apertureFNumber} ISO ${configuration.iso} OD ${configuration.filterOpticalDensity}`, png: rendered.png});
		}
		await run.writeArtifact('review/selected-profiles.svg', plate(rows));
		const assertions = ['All five selected complete profiles were rendered through CameraColorModel.', 'Every observed raw, ADC, display-high, and mean-luminance result equals its D8.1 prediction.', 'Every selected-profile PNG is byte-identical to the prior D8 render of that same complete profile.', 'The no-qualified control produced no render or fallback image.'];
		const proof = {proofId: 'camera-exposure-selected-renders-d8-2-t8-2-v1', accepted: true, assertions, summary: {renderCount: results.length, modes: results.map(({mode}) => mode), profiles: Object.fromEntries(results.map(({mode, profileId}) => [mode, profileId])), noQualifiedRenderCount: 0}};
		await run.writeJsonArtifact('evidence/results.json', {schemaId: 'camera-exposure-selected-renders-v1', results});
		await run.writeJsonArtifact('evidence/derivation.json', {schemaId: 'camera-exposure-selected-renders-derivation-v1', parents: [selectionArtifact.parent, ...noon.parents, ...sunset.parents, ...results.map(({priorRender}) => priorRender)], operation: 'selected profile ID -> retained complete settings -> public CameraColorModel full-field render -> PNG; compare predicted metrics and prior same-profile PNG hash', implementation: {runner: 'scripts/extraterrestrial/runners/run-camera-exposure-selected-renders-d8-2-t8-2.js', runnerSha256: await sha256File(import.meta.filename)}, resultIdentityOwner: 'artifact-manifest.json'});
		const closure = await buildStaticModuleClosure({candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-camera-exposure-selected-renders-d8-2-t8-2.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process','node:crypto','node:fs','node:fs/promises','node:module','node:os','node:path','node:url','node:util','node:zlib']});
		const after = await protectedInventory(); requireCondition(JSON.stringify(before) === JSON.stringify(after), 'Protected production surfaces changed.'); proof.containment = {protectedRoots: after.roots, protectedFiles: after.entries.length, closureFileCount: closure.files.length, gitIndependent: true}; await run.writeJsonArtifact('evidence/proof.json', proof);
		const manifest = await run.finalize({conclusion: 'accepted', result: proof, report: `# ${run.runId}: selected exposure-profile renders D8.2/T8.2\n\nConclusion: **accepted as prediction-to-render evidence**.\n\nFive selected profiles were rendered; all predicted metrics and prior same-profile PNG hashes match exactly.\n`}); process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, summary: proof.summary}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack}; try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({conclusion: 'failed', result: {error: detail}, report: `# ${run.runId}: selected exposure-profile renders D8.2/T8.2\n\nConclusion: **failed**.\n\n${detail.message}\n`}); process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`); } catch {} process.exitCode = 1;
	}
}

await main();
