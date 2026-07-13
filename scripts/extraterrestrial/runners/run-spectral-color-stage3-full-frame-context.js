import { execFile as executeFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { promisify } from 'node:util';
import { deflateSync } from 'node:zlib';

import STAGE1_FIXTURE from '../fixtures/spectral-color-stage1-ledger-v1.json' with { type: 'json' };
import BRIDGE_FIXTURE from '../fixtures/spectral-color-stage2b-reference-bridge-v1.json' with { type: 'json' };
import OUTPUT_FIXTURE from '../fixtures/spectral-color-stage2b-output-proof-v1.json' with { type: 'json' };
import FIXTURE from '../fixtures/spectral-color-stage3-full-frame-context-v1.json' with { type: 'json' };
import { CAM16_DIM_SURROUND, forwardCam16 } from '../color/Cam16Reference.js';
import { deriveStage2bInputBridge } from '../color/Stage2bInputBridge.js';
import { Stage2bPreserveColorfulnessTransform } from '../color/Stage2bColorfulnessCandidates.js';
import { parseCie1931 } from '../color/NormalColorTransform.js';
import { rec709LinearToAbsoluteXyz } from '../color/Stage2bNormalDisplayTransform.js';
import { assertNoReparseEntries, createProtectedTrackedInventory, loadContainmentPolicy } from '../harness/lib/containment.js';
import { assertFileInventoriesEqual } from '../harness/lib/hashes.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { CANDIDATE_ROOT, EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, RUNS_ROOT, assertRepositoryIdentity } from '../harness/lib/roots.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-spectral-color-stage3-full-frame-context.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CIE_PATH = path.join(EXPERIMENT_ROOT, 'references', 'bruneton-step5-nonregression-v1', 'CIE_xyz_1931_2deg.csv');
const execFile = promisify(executeFile);
const requireCondition = (value, message) => { if (!value) throw new Error(message); };
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

async function assertFrozenFixtures() {
	for (const record of [FIXTURE.stage1Fixture, FIXTURE.bridgeFixture, FIXTURE.outputFixture, FIXTURE.candidateFixture]) {
		const bytes = await readFile(path.join(EXPERIMENT_ROOT, ...record.path.split('/').slice(2)));
		requireCondition(sha256(bytes) === record.sha256, `Frozen fixture changed: ${record.path}.`);
	}
}

async function loadLedger() {
	const root = path.join(RUNS_ROOT, BRIDGE_FIXTURE.input.runId);
	await lstat(root);
	await assertNoReparseEntries(root, 'Stage 3 full-frame ledger input');
	const manifest = JSON.parse(await readFile(path.join(root, 'artifact-manifest.json'), 'utf8'));
	requireCondition(manifest.runId === BRIDGE_FIXTURE.input.runId && manifest.conclusion === 'accepted' && manifest.artifactSetSha256 === BRIDGE_FIXTURE.input.artifactSetSha256, 'Stage 3 full-frame ledger identity changed.');
	const entry = manifest.artifacts.find((artifact) => artifact.path === BRIDGE_FIXTURE.input.ledgerPath);
	const bytes = await readFile(path.join(root, BRIDGE_FIXTURE.input.ledgerPath));
	requireCondition(entry?.sha256 === BRIDGE_FIXTURE.input.ledgerSha256 && bytes.byteLength === entry.byteLength && sha256(bytes) === entry.sha256, 'Stage 3 full-frame ledger bytes changed.');
	return { ledger: JSON.parse(bytes.toString('utf8')), manifest };
}

function contentType(filePath) {
	return filePath.endsWith('.js') ? 'text/javascript; charset=utf-8' : filePath.endsWith('.json') ? 'application/json; charset=utf-8' : filePath.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream';
}

async function serve(run) {
	const roots = new Map([
		['/browser/', path.join(run.runDirectory, 'browser')],
		['/harness/', path.join(EXPERIMENT_ROOT, 'harness')],
		['/candidate/', CANDIDATE_ROOT],
		['/fixtures/', path.join(EXPERIMENT_ROOT, 'fixtures')],
		['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT],
	]);
	const server = createServer(async (request, response) => {
		try {
			const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
			const root = [...roots.entries()].find(([prefix]) => pathname.startsWith(prefix));
			if (!root) throw new Error('Unsupported path.');
			const relative = pathname.slice(root[0].length);
			if (!relative || relative.includes('..') || path.isAbsolute(relative)) throw new Error('Unsafe path.');
			const resolved = path.resolve(root[1], relative);
			if (!resolved.startsWith(`${path.resolve(root[1])}${path.sep}`)) throw new Error('Escaped root.');
			response.writeHead(200, { 'content-type': contentType(resolved) });
			response.end(await readFile(resolved));
		} catch {
			response.writeHead(404);
			response.end('not found');
		}
	});
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	return { url: `http://127.0.0.1:${server.address().port}/browser/index.html`, close: () => new Promise((resolve) => server.close(resolve)) };
}

function browserHtml() {
	return '<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">import {runStage3FullFrameContext} from "/harness/spectral-color-stage3-full-frame-browser-entry.js"; const t=document.querySelector("#result"); try {const [stage1,context]=await Promise.all([fetch("/fixtures/spectral-color-stage1-ledger-v1.json").then(r=>r.json()),fetch("/fixtures/spectral-color-stage3-full-frame-context-v1.json").then(r=>r.json())]); t.textContent=JSON.stringify(await runStage3FullFrameContext(stage1,context));} catch(error){t.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>';
}

async function launchBrowser(server) {
	const started = Date.now();
	const browser = await execFile(CHROME_PATH, ['--headless=new', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--virtual-time-budget=600000', '--dump-dom', server.url], { timeout: 720_000, maxBuffer: 64 * 1024 * 1024, windowsHide: true });
	const match = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(browser.stdout);
	requireCondition(match, 'Full-frame browser emitted no result.');
	const result = JSON.parse(match[1]);
	if (result.error) throw new Error(`${result.error.name}: ${result.error.message}\n${result.error.stack ?? ''}`);
	return { result, dom: browser.stdout, hostWallMilliseconds: Date.now() - started };
}

function decodeFloat32(base64, expectedLength) {
	const bytes = Buffer.from(base64, 'base64');
	requireCondition(bytes.byteLength === expectedLength * 4, 'Full-frame float readback byte length changed.');
	return new Float32Array(bytes.buffer, bytes.byteOffset, expectedLength);
}

function sourceAppearance(absoluteXyz, adaptingLuminanceCdPerSquareMeter) {
	const source = BRIDGE_FIXTURE.sourceViewingCondition;
	const referenceWhite = source.referenceWhiteToAdaptingLuminanceRatio * adaptingLuminanceCdPerSquareMeter;
	const cam16 = forwardCam16({ xyz: absoluteXyz.map((value) => 100 * value / referenceWhite), whiteXyz: source.whiteChromaticityXyzRelative, adaptingLuminanceCdPerSquareMeter, backgroundRelativeY: source.backgroundRelativeY, surround: CAM16_DIM_SURROUND, discountIlluminant: source.discountIlluminant });
	return { ...cam16, h: Number.isFinite(cam16.h) ? cam16.h : 0 };
}

function maximumRelativeDifference(left, right) {
	return Math.max(...left.map((value, index) => Math.abs(value - right[index]) / Math.max(1, Math.abs(value), Math.abs(right[index]))));
}

function transformFrame(frame, bridgeRow, transform, ledgerCondition) {
	const { widthPixels: width, heightPixels: height } = FIXTURE.viewport;
	const floats = decodeFloat32(frame.linearSrgbFloat32Base64, width * height * 4);
	const output = Buffer.alloc(width * height * 4);
	let boundaryLimitedCount = 0;
	let exactWhiteCount = 0;
	let blackCount = 0;
	let maximumNegativeXyz = 0;
	let encodedMinimum = 1;
	let encodedMaximum = 0;
	const started = Date.now();
	for (let pixel = 0; pixel < width * height; pixel += 1) {
		const linearRgb = [floats[pixel * 4], floats[pixel * 4 + 1], floats[pixel * 4 + 2]];
		requireCondition(linearRgb.every(Number.isFinite), `${frame.id} contains a non-finite pre-display projection.`);
		const xyz = rec709LinearToAbsoluteXyz(linearRgb, 1);
		maximumNegativeXyz = Math.max(maximumNegativeXyz, ...xyz.map((value) => Math.max(0, -value)));
		requireCondition(xyz.every((value) => value >= -FIXTURE.tolerances.negativeXyzAbsolute), `${frame.id} exceeds the negative XYZ tolerance.`);
		let encoded;
		if (xyz.every((value) => Math.abs(value) <= 1e-20)) {
			encoded = [0, 0, 0];
			blackCount += 1;
		} else {
			const result = transform.transformAppearance(sourceAppearance(xyz.map((value) => Math.max(0, value)), bridgeRow.adaptingLuminanceCdPerSquareMeter));
			encoded = result.output.encodedSrgb;
			if (result.boundaryLimited) boundaryLimitedCount += 1;
			if (encoded.every((value) => value === 1)) exactWhiteCount += 1;
		}
		for (let channel = 0; channel < 3; channel += 1) {
			requireCondition(Number.isFinite(encoded[channel]) && encoded[channel] >= -FIXTURE.tolerances.rgbBoundsAbsolute && encoded[channel] <= 1 + FIXTURE.tolerances.rgbBoundsAbsolute, `${frame.id} contains an invalid encoded pixel.`);
			encodedMinimum = Math.min(encodedMinimum, encoded[channel]);
			encodedMaximum = Math.max(encodedMaximum, encoded[channel]);
			output[pixel * 4 + channel] = Math.round(Math.max(0, Math.min(1, encoded[channel])) * 255);
		}
		output[pixel * 4 + 3] = 255;
	}
	const centerPixel = Math.floor(height / 2) * width + Math.floor(width / 2);
	const centerLinearRgb = [floats[centerPixel * 4], floats[centerPixel * 4 + 1], floats[centerPixel * 4 + 2]];
	const ledgerCenter = ledgerCondition.samples.find((sample) => sample.role === 'disk-center');
	const expectedCenterLinearRgb = ledgerCenter.derived.preDisplayRadiance.signedLinearSrgb;
	return { rgba: output, raw: Buffer.from(floats.buffer, floats.byteOffset, floats.byteLength), summary: { id: frame.id, timeIso: frame.timeIso, solarElevationRadians: frame.solarElevationRadians, adaptingLuminanceCdPerSquareMeter: bridgeRow.adaptingLuminanceCdPerSquareMeter, pixelCount: width * height, boundaryLimitedCount, exactWhiteCount, blackCount, maximumNegativeXyz, encodedRange: [encodedMinimum, encodedMaximum], centerLinearRgb, expectedCenterLinearRgb, centerLinearRgbMaximumRelativeDifference: maximumRelativeDifference(centerLinearRgb, expectedCenterLinearRgb), colorTransformWallMilliseconds: Date.now() - started } };
}

const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let index = 0; index < 256; index += 1) { let value = index; for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1; table[index] = value >>> 0; }
	return table;
})();

function crc32(buffer) {
	let value = 0xffffffff;
	for (const byte of buffer) value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
	return (value ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data = Buffer.alloc(0)) {
	const typeBytes = Buffer.from(type, 'ascii');
	const output = Buffer.alloc(12 + data.length);
	output.writeUInt32BE(data.length, 0);
	typeBytes.copy(output, 4);
	data.copy(output, 8);
	output.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length);
	return output;
}

function encodePng(width, height, rgbaBottomUp) {
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
	const rows = Buffer.alloc((width * 4 + 1) * height);
	for (let y = 0; y < height; y += 1) {
		const targetOffset = y * (width * 4 + 1);
		rows[targetOffset] = 0;
		const sourceOffset = (height - 1 - y) * width * 4;
		rgbaBottomUp.copy(rows, targetOffset + 1, sourceOffset, sourceOffset + width * 4);
	}
	return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk('IHDR', ihdr), pngChunk('IDAT', deflateSync(rows, { level: 9 })), pngChunk('IEND')]);
}

function escapeXml(value) { return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }
function displayLabel(id) { return ({ 'sunset-minus-60': 'Sunset -60 min', 'sunset-minus-30': 'Sunset -30 min', sunset: 'Sunset' })[id] ?? id; }

function plateSvg(images) {
	const displayWidth = 481;
	const displayHeight = 271;
	const cellWidth = 511;
	const width = images.length * cellWidth;
	const height = 365;
	const cells = images.map((image, index) => { const x = index * cellWidth + 15; return `<g data-calibration-key="spherical-distant/${escapeXml(image.id)}"><image x="${x}" y="75" width="${displayWidth}" height="${displayHeight}" href="data:image/png;base64,${image.png.toString('base64')}"/><rect x="${x}" y="75" width="${displayWidth}" height="${displayHeight}" fill="none" stroke="#303844"/><text x="${x + displayWidth / 2}" y="354" text-anchor="middle" fill="#f4f7fb" font-family="Segoe UI, sans-serif" font-size="18" font-weight="600">${escapeXml(displayLabel(image.id))}</text></g>`; }).join('');
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#080a0e"/><text x="${width / 2}" y="34" text-anchor="middle" fill="#f4f7fb" font-family="Segoe UI, sans-serif" font-size="26" font-weight="650">Stage 3 — one global Color transform over the composed atmospheric frame</text><text x="${width / 2}" y="60" text-anchor="middle" fill="#aeb8c5" font-family="Segoe UI, sans-serif" font-size="14">San Jose · spherical/distant · 15° vertical field · Sun-centered camera · no Sun mask, overlay, enlargement, or source-specific grade</text>${cells}</svg>`;
}

async function main() {
	const run = await initializeRunRecord({ slug: 'spectral-color-stage3-full-frame-context', command: COMMAND, inputs: { fixture: 'scripts/extraterrestrial/fixtures/spectral-color-stage3-full-frame-context-v1.json', measuredInputRunId: BRIDGE_FIXTURE.input.runId, scope: 'live spherical atmosphere full-frame preDisplayRadiance; one global CPU reference Color transform; three calibration conditions only' }, provenance: { transport: 'contained current candidate GPU atmosphere and celestial composition', color: 'Stage 2B preserve-M fixed-Q boundary applied uniformly to every pixel', framing: FIXTURE.viewport }, environment: { node: process.version, platform: process.platform, chromePath: CHROME_PATH }, references: { plan: 'agents/topics/extraterrestrial/spectral-color-transform-experiment-plan.md', architecture: 'agents/topics/extraterrestrial/sun-disk-appearance-design.md' } });
	let server;
	try {
		await assertRepositoryIdentity();
		const policy = await loadContainmentPolicy();
		const before = await createProtectedTrackedInventory(policy);
		await Promise.all([lstat(CHROME_PATH), assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree'), assertFrozenFixtures()]);
		const [{ ledger, manifest }, cieText] = await Promise.all([loadLedger(), readFile(CIE_PATH, 'utf8')]);
		const bridge = deriveStage2bInputBridge({ ledger, fixture: BRIDGE_FIXTURE, cieRows: parseCie1931(cieText) });
		const bridgeRows = new Map(bridge.rows.map((row) => [row.key, row]));
		const transform = new Stage2bPreserveColorfulnessTransform({ q0: bridge.q0, qMaster: bridge.qMaster, outputViewingCondition: BRIDGE_FIXTURE.outputViewingCondition, bisectionIterations: OUTPUT_FIXTURE.bisectionIterations });
		requireCondition(transform.describe().id === FIXTURE.expectedTransformId, 'Full-frame Color transform identity changed.');
		await run.writeArtifact('browser/index.html', browserHtml());
		server = await serve(run);
		const browser = await launchBrowser(server);
		await run.writeArtifact('browser/dom.html', browser.dom);
		requireCondition(browser.result.frames.length === FIXTURE.conditions.length && browser.result.frames.every((frame, index) => frame.id === FIXTURE.conditions[index]), 'Full-frame browser condition order changed.');
		const images = [];
		const summaries = [];
		for (const frame of browser.result.frames) {
			const key = `spherical-distant/${frame.id}`;
			const bridgeRow = bridgeRows.get(key);
			const ledgerCondition = ledger.spherical.conditions.find((condition) => condition.id === frame.id);
			requireCondition(bridgeRow && ledgerCondition, `Missing full-frame calibration state: ${key}.`);
			const transformed = transformFrame(frame, bridgeRow, transform, ledgerCondition);
			const png = encodePng(FIXTURE.viewport.widthPixels, FIXTURE.viewport.heightPixels, transformed.rgba);
			await run.writeArtifact(`gpu/${frame.id}-pre-display-linear-srgb.f32`, transformed.raw);
			await run.writeArtifact(`renders/${frame.id}.png`, png);
			images.push({ id: frame.id, png });
			summaries.push(transformed.summary);
		}
		const plate = plateSvg(images);
		await run.writeArtifact('renders/full-frame-calibration.svg', plate);
		const fullyVisibleSummaries = summaries.filter((summary) => summary.id !== 'sunset');
		const sunsetSummary = summaries.find((summary) => summary.id === 'sunset');
		const maximumFullyVisibleCenterDifference = Math.max(...fullyVisibleSummaries.map((summary) => summary.centerLinearRgbMaximumRelativeDifference));
		requireCondition(maximumFullyVisibleCenterDifference <= FIXTURE.tolerances.fullyVisibleCenterLinearRgbRelative, 'A fully visible full-frame center projection does not match the frozen ledger center.');
		requireCondition(Boolean(sunsetSummary), 'The exact-sunset horizon-raster summary is missing.');
		const [minimumSunsetDifference, maximumSunsetDifference] = FIXTURE.tolerances.horizonCenterLinearRgbRelativeRange;
		requireCondition(sunsetSummary.centerLinearRgbMaximumRelativeDifference >= minimumSunsetDifference && sunsetSummary.centerLinearRgbMaximumRelativeDifference <= maximumSunsetDifference, 'The exact-sunset center no longer exposes the declared live-raster versus mathematical-center divergence.');
		requireCondition(summaries.every((summary) => summary.exactWhiteCount === 0), 'A full-frame condition contains an exact-white pixel.');
		const result = { schemaId: 'spectral-color-stage3-full-frame-context-result-v1', input: { runId: manifest.runId, artifactSetSha256: manifest.artifactSetSha256, ledgerSha256: BRIDGE_FIXTURE.input.ledgerSha256 }, claimLimit: 'three calibration views; CPU reference Color over live GPU pre-display frame; not GPU Color parity or held-out review', browser: { viewport: browser.result.viewport, sourceHash: browser.result.sourceHash, physicalProfileHash: browser.result.physicalProfileHash, shaderSourceHash: browser.result.shaderSourceHash, browserElapsedMilliseconds: browser.result.elapsedMilliseconds, hostWallMilliseconds: browser.hostWallMilliseconds }, transform: transform.describe(), uniformity: 'one condition-wide adapting state and one source-independent transform over every preDisplayRadiance pixel; no solar identification or branch', centerComparison: { maximumFullyVisibleRelativeDifference: maximumFullyVisibleCenterDifference, exactSunsetHorizonRasterRelativeDifference: sunsetSummary.centerLinearRgbMaximumRelativeDifference, interpretation: 'The fully visible raster centers reconcile with selected-ray evidence. Exact sunset retains the current live raster/support result and is not asserted equal to the mathematical center-ray sample.' }, conditions: summaries };
		await run.writeJsonArtifact('evidence/stage3-full-frame-context.json', result);
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-spectral-color-stage3-full-frame-context.js', 'harness/spectral-color-stage3-full-frame-browser-entry.js', 'color/Cam16Reference.js', 'color/Stage2bInputBridge.js', 'color/Stage2bNormalDisplayTransform.js', 'color/Stage2bColorfulnessCandidates.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:http', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util', 'node:zlib'] });
		const after = await createProtectedTrackedInventory(policy);
		assertFileInventoriesEqual(before, after, 'Stage 3 full-frame protected inventory');
		const proof = { proofId: 'spectral-color-stage3-full-frame-context-v1', accepted: true, state: 'generated-for-observer-proxy-full-frame-review', assertions: ['The live GPU frame exposes composed preDisplayRadiance through one source-independent full-frame projection.', 'One condition-wide preserve-M Color state processes every pixel without identifying the Sun.', 'The two fully visible center pixels match the manifest-verified selected-ray ledger within the frozen tolerance.', 'Exact sunset retains and reports the current live horizon-raster divergence instead of pretending it is the mathematical center ray.', 'No rendered frame contains an exact-white pixel.', 'Only the three spherical calibration conditions are rendered; held-out conditions remain sealed.'], summary: { conditionCount: summaries.length, pixelCountPerCondition: FIXTURE.viewport.widthPixels * FIXTURE.viewport.heightPixels, totalPixelCount: summaries.reduce((sum, item) => sum + item.pixelCount, 0), maximumFullyVisibleCenterLinearRgbRelativeDifference: maximumFullyVisibleCenterDifference, exactSunsetHorizonRasterRelativeDifference: sunsetSummary.centerLinearRgbMaximumRelativeDifference, exactWhitePixelCount: summaries.reduce((sum, item) => sum + item.exactWhiteCount, 0), boundaryLimitedPixelCount: summaries.reduce((sum, item) => sum + item.boundaryLimitedCount, 0), browserHostWallMilliseconds: browser.hostWallMilliseconds, colorTransformWallMilliseconds: summaries.reduce((sum, item) => sum + item.colorTransformWallMilliseconds, 0) }, outputs: { plate: 'renders/full-frame-calibration.svg', frames: images.map((image) => `renders/${image.id}.png`), evidence: 'evidence/stage3-full-frame-context.json' }, remaining: ['observer-proxy full-frame review', 'GPU Color parity', 'candidate freeze before held-out rows'], containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length } };
		await run.writeJsonArtifact('evidence/stage3-full-frame-context-proof.json', proof);
		const finalManifest = await run.finalize({ conclusion: 'accepted', result: proof, report: `# ${run.runId}: Stage 3 full-frame atmospheric context\n\nConclusion: **accepted as full-frame calibration review evidence; observer-proxy decision pending**.\n\nThe live contained GPU rendered composed pre-display atmospheric radiance for three centered San Jose spherical/distant calibration views. One unchanged condition-wide preserve-M Color transform processed every pixel. There is no Sun mask, overlay, enlargement, source-specific branch, or separate disk Color operation. The fully visible centers agree with the frozen selected-ray ledger within ${proof.summary.maximumFullyVisibleCenterLinearRgbRelativeDifference} relative. Exact sunset retains the live raster/support result and differs from the mathematical center ray by ${proof.summary.exactSunsetHorizonRasterRelativeDifference} relative. No frame contains an exact-white pixel.\n\nThis run is CPU reference Color over live GPU pre-display frames. It does not establish GPU Color parity or authorize held-out presentation.\n` });
		process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: finalManifest.artifactSetSha256, state: proof.state, summary: proof.summary }, null, 2)}\n`);
	} catch (error) {
		const detail = { name: error.name, message: error.message, stack: error.stack };
		try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({ conclusion: 'failed', result: { error: detail }, report: `# ${run.runId}: Stage 3 full-frame atmospheric context\n\nConclusion: **failed**\n\n${detail.message}\n` }); process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail }, null, 2)}\n`); } catch {}
		process.exitCode = 1;
	} finally {
		await server?.close().catch(() => {});
	}
}

await main();
