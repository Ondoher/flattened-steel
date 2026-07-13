#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {deflateSync} from 'node:zlib';
import FIXTURE from '../fixtures/camera-color-model-d8-t8-v1.json' with {type: 'json'};
import BASE_PROFILE from '../fixtures/camera-color-baseline-profile-v1.json' with {type: 'json'};
import {CameraColorModel} from '../color/CameraColorModel.js';
import {compileCameraColorProfile} from '../color/CameraColorProfile.js';
import {assertNoReparseEntries, loadContainmentPolicy} from '../harness/lib/containment.js';
import {sha256File} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, REPOSITORY_ROOT, RUNS_ROOT, assertRepositoryIdentity} from '../harness/lib/roots.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-camera-color-model-d8-t8.js';
const FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'camera-color-model-d8-t8-v1.json');
const PROTECTED_SURFACES = ['src/algorithm32', 'src/flat32', 'scripts/algorithm32-star'];

function requireCondition(value, message) { if (!value) throw new Error(message); }
function clampByte(value) { return Math.round(Math.min(1, Math.max(0, value)) * 255); }
function luminance(rgb) { return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]; }

function decodeFloat32(bytes) {
  requireCondition(bytes.byteLength % 4 === 0, 'Float32 readback byte length is invalid.');
  const copy = new Uint8Array(bytes.byteLength); copy.set(bytes);
  return new Float32Array(copy.buffer);
}

async function protectedSurfaceInventory() {
  const entries = [];
  async function visit(absolutePath, relativePath) {
    let stat;
    try { stat = await lstat(absolutePath); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
    requireCondition(!stat.isSymbolicLink(), `Protected surface contains a symbolic link: ${relativePath}`);
    if (stat.isDirectory()) {
      const children = await readdir(absolutePath);
      children.sort((left, right) => left.localeCompare(right, 'en'));
      for (const child of children) await visit(path.join(absolutePath, child), `${relativePath}/${child}`);
      return;
    }
    requireCondition(stat.isFile(), `Protected surface contains an unsupported entry: ${relativePath}`);
    const bytes = await readFile(absolutePath);
    entries.push({path: relativePath.replaceAll('\\', '/'), byteLength: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')});
  }
  for (const relativePath of PROTECTED_SURFACES) await visit(path.join(REPOSITORY_ROOT, ...relativePath.split('/')), relativePath);
  return {schemaId: 'camera-d8-protected-surface-inventory-v1', roots: PROTECTED_SURFACES, entries};
}

function assertProtectedInventoriesEqual(before, after) {
  requireCondition(JSON.stringify(before) === JSON.stringify(after), 'A protected production surface changed during D8/T8.');
}

function spectrumAt(packets, pixel) {
  return Array.from({length: 15}, (_, channel) => packets[Math.floor(channel / 4)][pixel * 4 + channel % 4]);
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data = Buffer.alloc(0)) {
  const name = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function encodePng(width, height, rgbaBottomUp) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  const stride = width * 4; const rows = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) { const target = y * (stride + 1); rows[target] = 0; const source = (height - 1 - y) * stride; rgbaBottomUp.copy(rows, target + 1, source, source + stride); }
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), pngChunk('IHDR', ihdr), pngChunk('IDAT', deflateSync(rows, {level: 9})), pngChunk('IEND')]);
}

async function loadAcceptedRun(runId, artifactSetSha256, label) {
  const root = path.join(RUNS_ROOT, runId); await assertNoReparseEntries(root, label);
  const manifest = JSON.parse(await readFile(path.join(root, 'artifact-manifest.json'), 'utf8'));
  requireCondition(manifest.runId === runId && manifest.conclusion === 'accepted' && manifest.artifactSetSha256 === artifactSetSha256, `${label} identity changed.`);
  return {root, manifest};
}

async function loadField(source, conditionIds) {
  const run = await loadAcceptedRun(source.runId, source.artifactSetSha256, 'D8 production field source');
  const fields = new Map(); const parents = [];
  for (const conditionId of conditionIds) {
    const packets = [];
    for (let packet = 0; packet < 4; packet += 1) {
      const artifactPath = `readbacks/${conditionId}/pre-display-packet-${packet}.f32le`;
      const entry = run.manifest.artifacts.find((item) => item.path === artifactPath);
      requireCondition(entry, `Missing ${artifactPath}.`);
      const absolute = path.join(run.root, ...artifactPath.split('/'));
      requireCondition(await sha256File(absolute) === entry.sha256, `${artifactPath} identity changed.`);
      packets.push(decodeFloat32(await readFile(absolute)));
      parents.push({runId: source.runId, artifactSetSha256: source.artifactSetSha256, path: artifactPath, sha256: entry.sha256});
    }
    fields.set(conditionId, packets);
  }
  return {fields, parents};
}

function compileConfiguration(configuration) {
  const profile = structuredClone(BASE_PROFILE);
  profile.profileId = `d8-${configuration.id.toLowerCase()}-v1`;
  profile.parents.push(FIXTURE.dependency);
  profile.capture.apertureFNumber = configuration.apertureFNumber;
  profile.capture.shutterSeconds = configuration.shutterSeconds;
  profile.capture.shutterNotation = configuration.shutterNotation;
  profile.capture.filterTransmission = 10 ** -configuration.filterOpticalDensity;
  profile.capture.filter = configuration.filterOpticalDensity === 0 ? 'none' : `ideal-neutral-od-${configuration.filterOpticalDensity}`;
  profile.capture.isoLabel = configuration.iso;
  profile.capture.postWellGain = configuration.postWellGain;
  profile.claimLimit = `${FIXTURE.claimLimit} Configuration ${configuration.id} uses ${configuration.sourceId}.`;
  profile.derivedFrom = {
    profileId: BASE_PROFILE.profileId,
    operation: 'simultaneous composition of previously qualified profile controls',
    settings: structuredClone(configuration),
    isoEquation: 'postWellGain = ISO / 100 in the simplified generic model',
    ndEquation: 'filterTransmission = 10^(-opticalDensity)',
  };
  return compileCameraColorProfile(profile);
}

function samplePixels(input) {
  const x = Math.floor(input.widthPixels / 2);
  return {'disk-center': Math.floor(input.heightPixels / 2) * input.widthPixels + x, 'upper-quarter': Math.floor(input.heightPixels * 0.75) * input.widthPixels + x, 'top-center': (input.heightPixels - 1) * input.widthPixels + x};
}

function predictField(model, packets, input) {
  const pixelCount = input.widthPixels * input.heightPixels;
  const prediction = {pixelCount, rawClippedPixelCount: 0, adcClippedPixelCount: 0, rawClipChannelHistogram: [0,0,0,0], exactBlackPixelCount: 0, exactWhitePixelCount: 0, nonFinitePixelCount: 0, meanEncodedLuminance: 0, samples: {}};
  const targets = samplePixels(input);
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const trace = model.traceRadiance(spectrumAt(packets, pixel));
    prediction.rawClipChannelHistogram[trace.rawClipChannelCount] += 1;
    if (trace.rawClipChannelCount > 0) prediction.rawClippedPixelCount += 1;
    if (trace.adcClipped.some(Boolean)) prediction.adcClippedPixelCount += 1;
    if (![...trace.photoelectrons, ...trace.preDevelopmentLinearRec709D65, ...trace.encodedSrgb].every(Number.isFinite)) prediction.nonFinitePixelCount += 1;
    if (trace.encodedSrgb.every((value) => value === 0)) prediction.exactBlackPixelCount += 1;
    if (trace.encodedSrgb.every((value) => value === 1)) prediction.exactWhitePixelCount += 1;
    prediction.meanEncodedLuminance += luminance(trace.encodedSrgb);
    for (const [id, target] of Object.entries(targets)) if (pixel === target) prediction.samples[id] = {pixelIndex: pixel, fullWellFraction: trace.fullWellFraction, rawClipped: trace.rawClipped, normalizedPostGain: trace.normalizedPostGain, preDevelopmentLinearRec709D65: trace.preDevelopmentLinearRec709D65, encodedSrgb: trace.encodedSrgb};
  }
  prediction.meanEncodedLuminance /= pixelCount;
  return prediction;
}

function renderField(model, packets, input) {
  const pixelCount = input.widthPixels * input.heightPixels; const rgba = Buffer.alloc(pixelCount * 4);
  let rawClippedPixelCount = 0; let adcClippedPixelCount = 0;
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const trace = model.traceRadiance(spectrumAt(packets, pixel));
    if (trace.rawClipChannelCount > 0) rawClippedPixelCount += 1;
    if (trace.adcClipped.some(Boolean)) adcClippedPixelCount += 1;
    const offset = pixel * 4; rgba[offset] = clampByte(trace.encodedSrgb[0]); rgba[offset + 1] = clampByte(trace.encodedSrgb[1]); rgba[offset + 2] = clampByte(trace.encodedSrgb[2]); rgba[offset + 3] = 255;
  }
  return {png: encodePng(input.widthPixels, input.heightPixels, rgba), observed: {rawClippedPixelCount, adcClippedPixelCount}};
}

function escapeXml(value) { return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }

function reviewSvg(rows, width, height) {
  const scale = 0.5; const imageWidth = width * scale; const imageHeight = height * scale; const labelWidth = 330; const gap = 18; const rowHeight = imageHeight + 46;
  const svgWidth = labelWidth + imageWidth + gap * 2; const svgHeight = 48 + rows.length * rowHeight;
  const body = rows.map((row, index) => {
    const y = 48 + index * rowHeight;
    return `<text x="12" y="${y + 24}" fill="#eee" font-family="monospace" font-size="14">${escapeXml(row.label)}</text><image x="${labelWidth}" y="${y}" width="${imageWidth}" height="${imageHeight}" href="data:image/png;base64,${row.png.toString('base64')}"/>`;
  }).join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}"><rect width="100%" height="100%" fill="#202020"/><text x="12" y="30" fill="white" font-family="sans-serif" font-size="20">D8/T8 sourced configurations — identity development</text>${body}</svg>`);
}

async function main() {
  const run = await initializeRunRecord({slug: 'camera-color-model-d8-t8', command: COMMAND, inputs: {fixture: 'scripts/extraterrestrial/fixtures/camera-color-model-d8-t8-v1.json', dependency: FIXTURE.dependency, sourceRun: FIXTURE.input, cases: FIXTURE.configurations.map(({id, sourceId}) => ({id, sourceId})), nonFactorial: true}, provenance: {purpose: 'Render and verify the ready sourced frequent-use camera configurations after independent control and interaction qualification.', method: 'Reuse immutable production native-15 fields; compile one traced generic profile per sourced configuration; predict full-field clipping before a separate render pass; retain identity development.', claimLimit: FIXTURE.claimLimit}, environment: {node: process.version, platform: process.platform}, references: {inventory: 'agents/topics/extraterrestrial/camera-control-test-inventory.md', testingPlan: 'agents/topics/extraterrestrial/camera-controls-testing-plan.md', developmentPlan: 'agents/topics/extraterrestrial/camera-controls-development-plan.md'}});
  try {
    await assertRepositoryIdentity(); const policy = await loadContainmentPolicy(); const before = await protectedSurfaceInventory();
    await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree');
    const dependency = await loadAcceptedRun(FIXTURE.dependency.runId, FIXTURE.dependency.artifactSetSha256, 'D7/T7 dependency');
    const conditionIds = [...new Set(FIXTURE.configurations.map((item) => item.conditionId))];
    const source = await loadField(FIXTURE.input, conditionIds);
    const results = []; const plateRows = [];
    for (const configuration of FIXTURE.configurations) {
      const profile = compileConfiguration(configuration); const model = new CameraColorModel(profile); const packets = source.fields.get(configuration.conditionId);
      const prediction = predictField(model, packets, FIXTURE.input);
      const rendered = renderField(model, packets, FIXTURE.input);
      requireCondition(prediction.rawClippedPixelCount === rendered.observed.rawClippedPixelCount && prediction.adcClippedPixelCount === rendered.observed.adcClippedPixelCount, `${configuration.id} prediction/render clipping mismatch.`);
      const outputPath = `renders/${configuration.id}.png`; await run.writeArtifact(outputPath, rendered.png);
      const result = {configuration, profile, prediction, observed: rendered.observed, outputPath}; results.push(result);
      plateRows.push({label: `${configuration.id} | ${configuration.shutterNotation} f/${configuration.apertureFNumber} ISO ${configuration.iso} OD ${configuration.filterOpticalDensity}`, png: rendered.png});
    }
    const byId = Object.fromEntries(results.map((item) => [item.configuration.id, item]));
    const assertions = []; const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
    check(results.length === 8, 'Exactly eight ready non-factorial configuration frames were rendered.');
    check(results.every((item) => item.prediction.nonFinitePixelCount === 0), 'Every predicted camera and display intermediate is finite.');
    check(results.every((item) => item.prediction.rawClippedPixelCount === item.observed.rawClippedPixelCount && item.prediction.adcClippedPixelCount === item.observed.adcClippedPixelCount), 'Every pre-render clipping prediction matches the separate render pass.');
    check(byId['U-PHONE-DAYLIGHT'].prediction.rawClippedPixelCount === 9 && byId['U-PHONE-DAYLIGHT'].prediction.samples['disk-center'].rawClipped.every(Boolean), 'U-PHONE-DAYLIGHT reproduces nine raw-clipped pixels and an all-channel-clipped disk center.');
    check(byId['U-DISK-MANUAL'].prediction.samples['disk-center'].rawClipped.every((value) => !value), 'U-DISK-MANUAL OD 5 recovers the noon disk center below raw clipping.');
    check(byId['U-HDR-MEMBERS-EV-MINUS-3'].prediction.samples['disk-center'].rawClipped.every(Boolean), 'The standard -3 EV AEB member still clips the noon disk center in all raw channels.');
    check(byId['U-HDR-MEMBERS-EV-MINUS-3'].prediction.meanEncodedLuminance < byId['U-HDR-MEMBERS-EV-0'].prediction.meanEncodedLuminance && byId['U-HDR-MEMBERS-EV-0'].prediction.meanEncodedLuminance < byId['U-HDR-MEMBERS-EV-PLUS-3'].prediction.meanEncodedLuminance, 'AEB member mean encoded luminance increases strictly from -3 to 0 to +3 EV.');
    check(['U-PHONE-SUNSET','U-DSLR-SUNSET'].every((id) => byId[id].prediction.samples['disk-center'].encodedSrgb[0] >= byId[id].prediction.samples['disk-center'].encodedSrgb[2]), 'Both sunset settings retain a disk-center red channel at least as strong as blue.');
    await run.writeArtifact('review/camera-configurations.svg', reviewSvg(plateRows, FIXTURE.input.widthPixels, FIXTURE.input.heightPixels));
    const derivation = {schemaId: 'camera-color-model-d8-t8-derivation-v1', parents: [{runId: dependency.manifest.runId, artifactSetSha256: dependency.manifest.artifactSetSha256}, ...source.parents], operation: {capture: 'photoelectrons = sensorPhotonIntegrals * pi/(4*N^2) * opticalTransmission * 10^(-OD) * pixelArea * shutter/(h*c)', saturation: 'clip photoelectrons to full well before postWellGain = ISO/100', color: 'fixed D55 WB -> accepted 3x3 characterization -> linear Rec.709 -> identity clamp -> IEC sRGB', renderOrder: 'complete numeric prediction pass precedes separate render pass'}, implementation: {runner: 'scripts/extraterrestrial/runners/run-camera-color-model-d8-t8.js', runnerSha256: await sha256File(import.meta.filename), fixture: 'scripts/extraterrestrial/fixtures/camera-color-model-d8-t8-v1.json', fixtureSha256: await sha256File(FIXTURE_PATH), node: process.version}, materialParameters: FIXTURE.configurations, results: results.map((item) => ({id: item.configuration.id, outputPath: item.outputPath})), resultIdentityOwner: 'artifact-manifest.json'};
    const proof = {proofId: 'camera-color-model-d8-t8-v1', accepted: true, assertions, summary: {configurationCount: results.length, rawClippedPixels: Object.fromEntries(results.map((item) => [item.configuration.id, item.prediction.rawClippedPixelCount])), adcClippedPixels: Object.fromEntries(results.map((item) => [item.configuration.id, item.prediction.adcClippedPixelCount])), meanEncodedLuminance: Object.fromEntries(results.map((item) => [item.configuration.id, item.prediction.meanEncodedLuminance]))}, claimLimit: FIXTURE.claimLimit};
    await run.writeJsonArtifact('evidence/configuration-results.json', {schemaId: 'camera-color-model-d8-t8-results-v1', results}); await run.writeJsonArtifact('evidence/derivation.json', derivation); await run.writeJsonArtifact('evidence/proof.json', proof);
    const closure = await buildStaticModuleClosure({candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-camera-color-model-d8-t8.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process','node:crypto','node:fs','node:fs/promises','node:module','node:os','node:path','node:url','node:util','node:zlib']});
    const after = await protectedSurfaceInventory(); assertProtectedInventoriesEqual(before, after); proof.containment = {protectedRoots: after.roots, protectedFiles: after.entries.length, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length, gitIndependent: true};
    const manifest = await run.finalize({conclusion: 'accepted', result: proof, report: `# ${run.runId}: CameraColorModel D8/T8\n\nConclusion: **accepted as sourced configuration mechanics and identity-development review evidence**.\n\nEight non-factorial configuration frames were predicted and rendered from immutable production native-15 fields. Every clipping prediction matched the separate render pass. No automatic exposure, HDR merge, timelapse, glare, noise, or non-identity development was introduced.\n`});
    process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, summary: proof.summary}, null, 2)}\n`);
  } catch (error) {
    const detail = {name: error.name, message: error.message, stack: error.stack};
    try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({conclusion: 'failed', result: {error: detail}, report: `# ${run.runId}: CameraColorModel D8/T8\n\nConclusion: **failed**.\n\n${detail.message}\n`}); process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`); } catch {}
    process.exitCode = 1;
  }
}

await main();
