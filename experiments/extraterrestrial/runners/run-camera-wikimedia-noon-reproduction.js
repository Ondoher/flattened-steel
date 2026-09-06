#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {deflateSync} from 'node:zlib';
import BASE_PROFILE from '../fixtures/camera-color-baseline-profile-v1.json' with {type: 'json'};
import {CameraColorModel} from '../color/CameraColorModel.js';
import {assertNoReparseEntries} from '../harness/lib/containment.js';
import {sha256File} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, REPOSITORY_ROOT, RUNS_ROOT, assertRepositoryIdentity} from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-camera-wikimedia-noon-reproduction.js';
const D8 = {runId: '000382-camera-color-model-d8-t8', artifactSetSha256: 'c2cf6efab91308d86e58d0a2123b2fb35fed85b46fb4406f77e90f085bbed275'};
const FOCUSED = {runId: '000351-spectral-color-production-sun-focused-light-adapted-log', artifactSetSha256: 'a936417dcc770ef965c33694340b227f3f7ca92c709964ee3ed2ec45301c81bc'};
const REFERENCE_PATH = path.join(REPOSITORY_ROOT, 'tmp', 'extraterrestrial', 'references', 'wikimedia-sun-at-noon', 'Sun_at_noon.jpg');
const REFERENCE_URL = 'https://commons.wikimedia.org/wiki/File:Sun_at_noon.jpg';
const ORIGINAL_URL = 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Sun_at_noon.jpg';
const PROTECTED_SURFACES = ['src/algorithm32', 'src/flat32', 'scripts/algorithm32-star'];

function requireCondition(value, message) { if (!value) throw new Error(message); }
function escapeXml(value) { return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }
function decodeFloat32(bytes) { requireCondition(bytes.byteLength % 4 === 0, 'Invalid Float32 readback.'); const copy = new Uint8Array(bytes.byteLength); copy.set(bytes); return new Float32Array(copy.buffer); }
function spectrumAt(packets, pixel) { return Array.from({length: 15}, (_, channel) => packets[Math.floor(channel / 4)][pixel * 4 + channel % 4]); }
function crc32(bytes) { let crc = 0xffffffff; for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); } return (crc ^ 0xffffffff) >>> 0; }
function pngChunk(type, data = Buffer.alloc(0)) { const name = Buffer.from(type, 'ascii'); const length = Buffer.alloc(4); length.writeUInt32BE(data.length); const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, data]))); return Buffer.concat([length, name, data, checksum]); }
function encodePng(width, height, rgbaBottomUp) { const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6; const stride = width * 4; const rows = Buffer.alloc((stride + 1) * height); for (let y = 0; y < height; y += 1) { const target = y * (stride + 1); rows[target] = 0; const source = (height - 1 - y) * stride; rgbaBottomUp.copy(rows, target + 1, source, source + stride); } return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), pngChunk('IHDR', ihdr), pngChunk('IDAT', deflateSync(rows, {level: 9})), pngChunk('IEND')]); }

async function acceptedRun(identity, label) {
	const root = path.join(RUNS_ROOT, identity.runId); await assertNoReparseEntries(root, label);
	const manifest = JSON.parse(await readFile(path.join(root, 'artifact-manifest.json'), 'utf8'));
	requireCondition(manifest.runId === identity.runId && manifest.conclusion === 'accepted' && manifest.artifactSetSha256 === identity.artifactSetSha256, 'D8 source identity changed.');
	return {root, manifest};
}

async function loadFocusedNoon(run) { const packets = []; const parents = []; for (let index = 0; index < 4; index += 1) { const loaded = await artifact(run, `readbacks/solar-noon/pre-display-packet-${index}.f32le`); packets.push(decodeFloat32(loaded.bytes)); parents.push(loaded.parent); } return {packets, parents}; }

function renderFocusedNoon(packets) {
	const width = 641; const height = 401; const pixelCount = width * height; const model = new CameraColorModel(BASE_PROFILE); const rgba = Buffer.alloc(pixelCount * 4);
	let rawClippedPixelCount = 0; let adcClippedPixelCount = 0; let displayHighClippedPixelCount = 0; let meanEncodedLuminance = 0;
	for (let pixel = 0; pixel < pixelCount; pixel += 1) { const trace = model.traceRadiance(spectrumAt(packets, pixel)); if (trace.rawClipChannelCount > 0) rawClippedPixelCount += 1; if (trace.adcClipped.some(Boolean)) adcClippedPixelCount += 1; if (trace.preDevelopmentLinearRec709D65.some((value) => value > 1)) displayHighClippedPixelCount += 1; meanEncodedLuminance += 0.2126 * trace.encodedSrgb[0] + 0.7152 * trace.encodedSrgb[1] + 0.0722 * trace.encodedSrgb[2]; const offset = pixel * 4; for (let channel = 0; channel < 3; channel += 1) rgba[offset + channel] = Math.round(Math.min(1, Math.max(0, trace.encodedSrgb[channel])) * 255); rgba[offset + 3] = 255; }
	return {png: encodePng(width, height, rgba), summary: {width, height, verticalFovDegrees: 15, rawClippedPixelCount, adcClippedPixelCount, displayHighClippedPixelCount, meanEncodedLuminance: meanEncodedLuminance / pixelCount}};
}

async function artifact(run, artifactPath) {
	const entry = run.manifest.artifacts.find((item) => item.path === artifactPath); requireCondition(entry, `Missing ${artifactPath}.`);
	const absolute = path.join(run.root, ...artifactPath.split('/')); requireCondition(await sha256File(absolute) === entry.sha256, `${artifactPath} changed.`);
	return {bytes: await readFile(absolute), parent: {runId: run.manifest.runId, artifactSetSha256: run.manifest.artifactSetSha256, path: artifactPath, sha256: entry.sha256}};
}

function comparisonSvg(referenceJpeg, generatedPng) {
	const width = 1180; const height = 650; const refWidth = 540; const refHeight = 396; const generatedWidth = 540; const generatedHeight = 338;
	const settings = 'ISO 102   f/2.2   1/6444 s   auto exposure/WB metadata   sRGB';
	return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><clipPath id="refCrop"><rect x="30" y="112" width="${refWidth}" height="${refHeight}"/></clipPath></defs><rect width="100%" height="100%" fill="#202020"/><text x="30" y="34" fill="white" font-family="sans-serif" font-size="22">Sky color and circumsolar comparison</text><text x="30" y="62" fill="#ccc" font-family="monospace" font-size="14">${escapeXml(settings)}</text><text x="30" y="96" fill="#eee" font-family="sans-serif" font-size="16">Reference crop: photographed sky around Sun</text><g clip-path="url(#refCrop)"><svg x="30" y="112" width="${refWidth}" height="${refHeight}" viewBox="650 750 1500 1100" preserveAspectRatio="xMidYMid slice"><image width="2576" height="1932" href="data:image/jpeg;base64,${referenceJpeg.toString('base64')}"/></svg></g><text x="610" y="96" fill="#eee" font-family="sans-serif" font-size="16">Generated: centered 15° San Jose clear-sky field</text><image x="610" y="112" width="${generatedWidth}" height="${generatedHeight}" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${generatedPng.toString('base64')}"/><text x="30" y="548" fill="#bbb" font-family="sans-serif" font-size="14">Compare the blue field and transition toward the source; ignore cloud pixels and glare extent.</text><text x="30" y="574" fill="#bbb" font-family="sans-serif" font-size="14">Not reproduced: clouds, exact FOV, measured Galaxy sensor/CFA, glare, or Samsung development.</text></svg>`);
}

async function protectedInventory() {
	const entries = [];
	async function visit(absolute, relative) { let stat; try { stat = await lstat(absolute); } catch (error) { if (error.code === 'ENOENT') return; throw error; } requireCondition(!stat.isSymbolicLink(), `Protected symbolic link: ${relative}`); if (stat.isDirectory()) { const children = await readdir(absolute); children.sort((a, b) => a.localeCompare(b, 'en')); for (const child of children) await visit(path.join(absolute, child), `${relative}/${child}`); return; } const bytes = await readFile(absolute); entries.push({path: relative.replaceAll('\\', '/'), byteLength: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')}); }
	for (const relative of PROTECTED_SURFACES) await visit(path.join(REPOSITORY_ROOT, ...relative.split('/')), relative);
	return {roots: PROTECTED_SURFACES, entries};
}

async function main() {
	const run = await initializeRunRecord({slug: 'camera-wikimedia-noon-reproduction', command: COMMAND, inputs: {spectralRun: FOCUSED, cameraProfile: 'experiments/extraterrestrial/fixtures/camera-color-baseline-profile-v1.json', referenceUrl: REFERENCE_URL, originalUrl: ORIGINAL_URL, exif: {camera: 'Samsung SM-M015G', iso: 102, apertureFNumber: 2.2, shutterSeconds: 0.00015518311607697083, focalLengthMillimeters: 2.26, metering: 'average', exposure: 'auto', whiteBalance: 'auto', colorSpace: 'sRGB'}}, provenance: {purpose: 'Compare sky color and the circumsolar region using the cited noon exposure settings.', method: 'Render the production sun-focused native-15 field through the generic ISO 102, f/2.2, 1/6444 s CameraColorModel profile and present it beside a Sun-centered crop of the unmodified CC BY-SA reference.', claimLimit: 'Settings-backed qualitative sky/circumsolar comparison only; not a Galaxy M01, scene, cloud, lens, glare, exact-FOV, or Samsung JPEG reproduction.'}, environment: {node: process.version, platform: process.platform}, references: {commons: REFERENCE_URL, license: 'CC BY-SA 4.0', author: 'Path slopu'}});
	try {
		await assertRepositoryIdentity(); await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree'); const before = await protectedInventory();
		const focusedRun = await acceptedRun(FOCUSED, 'Focused production spectral run'); const focused = await loadFocusedNoon(focusedRun); const generated = renderFocusedNoon(focused.packets);
		await assertNoReparseEntries(path.dirname(REFERENCE_PATH), 'Wikimedia reference import'); const reference = await readFile(REFERENCE_PATH); requireCondition(reference.length === 2271183, `Unexpected Wikimedia original byte length: ${reference.length}`);
		const referenceSha256 = createHash('sha256').update(reference).digest('hex');
		await run.writeArtifact('references/Sun_at_noon.jpg', reference); await run.writeArtifact('renders/settings-matched-sun-focused-noon.png', generated.png); await run.writeArtifact('review/sky-circumsolar-reference-vs-generated.svg', comparisonSvg(reference, generated.png));
		const generatedSha256 = createHash('sha256').update(generated.png).digest('hex');
		const proof = {proofId: 'camera-wikimedia-noon-reproduction-v1', accepted: true, assertions: ['The generated centered 15-degree image uses the production native-15 noon field and generic ISO 102, f/2.2, 1/6444 s CameraColorModel profile.', 'The retained reference is the unmodified 2576 x 1932 Wikimedia original.', 'The comparison isolates a Sun-centered reference crop for sky-color and circumsolar review while making no named-camera or cloud/glare reproduction claim.'], summary: {settings: {iso: 102, apertureFNumber: 2.2, shutter: '1/6444 s'}, generated: generated.summary, generatedSha256, referenceSha256, referenceBytes: reference.length, comparison: 'review/sky-circumsolar-reference-vs-generated.svg'}};
		await run.writeJsonArtifact('evidence/derivation.json', {schemaId: 'camera-wikimedia-noon-reproduction-derivation-v1', parents: [...focused.parents, {url: ORIGINAL_URL, page: REFERENCE_URL, sha256: referenceSha256, byteLength: reference.length, acquiredWith: 'curl 8.16.0 Schannel; -k used only after Windows revocation service failure'}], operation: 'production focused native-15 field -> exact generic EXIF settings CameraColorModel -> PNG; unmodified reference embedded through a Sun-centered SVG viewBox for qualitative comparison', resultIdentityOwner: 'artifact-manifest.json'});
		const closure = await buildStaticModuleClosure({candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-camera-wikimedia-noon-reproduction.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process','node:crypto','node:fs','node:fs/promises','node:module','node:os','node:path','node:url','node:util','node:zlib']}); const after = await protectedInventory(); requireCondition(JSON.stringify(before) === JSON.stringify(after), 'Protected production surfaces changed.'); proof.containment = {protectedRoots: after.roots, protectedFiles: after.entries.length, closureFileCount: closure.files.length, gitIndependent: true}; await run.writeJsonArtifact('evidence/proof.json', proof);
		const manifest = await run.finalize({conclusion: 'accepted', result: proof, report: `# ${run.runId}: Wikimedia noon settings reproduction\n\nConclusion: **accepted as settings-backed qualitative comparison evidence**.\n\nThe D8 generic-camera noon render uses the Commons EXIF exposure settings and is presented unchanged beside the original reference. Scene, sensor, lens, glare, FOV, and phone development differences remain explicit.\n`}); process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, summary: proof.summary}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack}; try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({conclusion: 'failed', result: {error: detail}, report: `# ${run.runId}: Wikimedia noon settings reproduction\n\nConclusion: **failed**.\n\n${detail.message}\n`}); process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`); } catch {} process.exitCode = 1;
	}
}

await main();
