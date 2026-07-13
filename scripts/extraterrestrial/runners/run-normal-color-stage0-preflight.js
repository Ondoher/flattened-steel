import { execFile as executeFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { promisify } from 'node:util';

import FIXTURE from '../fixtures/normal-color-stage0-preflight-v1.json' with { type: 'json' };
import {
	assertNoReparseEntries,
	createProtectedTrackedInventory,
	loadContainmentPolicy,
} from '../harness/lib/containment.js';
import { assertFileInventoriesEqual } from '../harness/lib/hashes.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import {
	CANDIDATE_ROOT,
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	assertRepositoryIdentity,
} from '../harness/lib/roots.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-normal-color-stage0-preflight.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CIE_PATH = path.join(EXPERIMENT_ROOT, 'references', 'bruneton-step5-nonregression-v1', 'CIE_xyz_1931_2deg.csv');
const execFile = promisify(executeFile);

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function sha256(value) {
	return createHash('sha256').update(value).digest('hex');
}

function contentType(filePath) {
	if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
	if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
	if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
	return 'application/octet-stream';
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
			if (!root) throw new Error('Unsupported runtime path.');
			const relative = pathname.slice(root[0].length);
			if (!relative || relative.includes('..') || path.isAbsolute(relative)) throw new Error('Unsafe runtime path.');
			const resolved = path.resolve(root[1], relative);
			if (!resolved.startsWith(`${path.resolve(root[1])}${path.sep}`)) throw new Error('Runtime path escaped its root.');
			response.writeHead(200, { 'content-type': contentType(resolved) });
			response.end(await readFile(resolved));
		} catch {
			response.writeHead(404);
			response.end('not found');
		}
	});
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	const address = server.address();
	return {
		url: `http://127.0.0.1:${address.port}/browser/index.html`,
		close: () => new Promise((resolve) => server.close(resolve)),
	};
}

function parseCie(text) {
	const rows = new Map();
	for (const line of text.trim().split(/\r?\n/u)) {
		const fields = line.split(',').map(Number);
		if (fields.length === 4 && fields.every(Number.isFinite)) rows.set(fields[0], fields.slice(1));
	}
	requireCondition(rows.size === 471, `Expected 471 one-nanometer CIE rows; found ${rows.size}.`);
	return rows;
}

function cieAt(cie, wavelength) {
	const lower = Math.floor(wavelength);
	const upper = Math.ceil(wavelength);
	const low = cie.get(lower);
	const high = cie.get(upper);
	requireCondition(low && high, `CIE table does not bracket ${wavelength} nm.`);
	if (lower === upper) return low;
	const fraction = wavelength - lower;
	return low.map((value, axis) => value + (high[axis] - value) * fraction);
}

function integrateCie(cie, start, end) {
	const integral = [0, 0, 0];
	let wavelength = start;
	while (wavelength < end - 1e-12) {
		const nextInteger = Math.floor(wavelength + 1e-12) + 1;
		const next = Math.min(end, nextInteger);
		const first = cieAt(cie, wavelength);
		const second = cieAt(cie, next);
		for (let axis = 0; axis < 3; axis += 1) {
			integral[axis] += (first[axis] + second[axis]) * 0.5 * (next - wavelength);
		}
		wavelength = next;
	}
	return integral;
}

function nativeProjection(values, basis, cie) {
	const xyz = [0, 0, 0];
	for (let index = 0; index < basis.channels.length; index += 1) {
		const channel = basis.channels[index];
		const matching = cieAt(cie, channel.center.value);
		for (let axis = 0; axis < 3; axis += 1) xyz[axis] += values[index] * matching[axis] * channel.width.value * 683;
	}
	return xyz;
}

function binIntegratedProjection(values, basis, cie) {
	const xyz = [0, 0, 0];
	for (let index = 0; index < basis.channels.length; index += 1) {
		const channel = basis.channels[index];
		const start = channel.center.value - channel.width.value / 2;
		const end = channel.center.value + channel.width.value / 2;
		const matchingIntegral = integrateCie(cie, start, end);
		for (let axis = 0; axis < 3; axis += 1) xyz[axis] += values[index] * matchingIntegral[axis] * 683;
	}
	return xyz;
}

function xyzToUv(xyz) {
	const denominator = xyz[0] + 15 * xyz[1] + 3 * xyz[2];
	return denominator > 0 ? [4 * xyz[0] / denominator, 9 * xyz[1] / denominator] : null;
}

function distance(first, second) {
	return Math.sqrt(first.reduce((sum, value, index) => sum + (value - second[index]) ** 2, 0));
}

function projectionComparison(values, basis, cie) {
	const nativeXyz = nativeProjection(values, basis, cie);
	const integratedXyz = binIntegratedProjection(values, basis, cie);
	const nativeUv = xyzToUv(nativeXyz);
	const integratedUv = xyzToUv(integratedXyz);
	return {
		nativeXyz,
		binIntegratedXyz: integratedXyz,
		relativeY: integratedXyz[1] > 1e-12 ? Math.abs(nativeXyz[1] - integratedXyz[1]) / integratedXyz[1] : 0,
		deltaUv: nativeUv && integratedUv ? distance(nativeUv, integratedUv) : 0,
	};
}

function analyzeReadback(browser, cie) {
	const assertions = [];
	const check = (value, message) => {
		requireCondition(value, message);
		assertions.push(message);
	};
	const tolerance = FIXTURE.tolerances;
	const basis = browser.spectralBasis;
	const projectionRows = [];
	let maximumCompositionAbsolute = 0;
	let maximumCompositionRelative = 0;
	let maximumAimAngularError = 0;
	let minimumVisibleCenterDirect = Infinity;
	let maximumNightDirect = 0;
	let sampleCount = 0;

	check(browser.schemaId === 'normal-color-stage0-browser-readback-v1', 'Browser returned the Stage 0 readback schema.');
	check(browser.conditionCount === FIXTURE.conditions.length, 'All three Stage 0 conditions were captured.');
	check(browser.atmosphereSetupCount === 1, 'One atmosphere setup was reused while time changed source geometry.');
	check(browser.quadrature.sampleCount === 32, 'Every condition retained the complete 32-ray upper-hemisphere quadrature.');
	check(basis.channelCount === 15 && basis.semantics === 'contiguous-wavelength-bin-average', 'Readback retained the declared native 15-bin-average spectral basis.');
	check(browser.radianceQuantity === 'spectral-radiance-density' && browser.radianceUnits === 'W m^-2 sr^-1 nm^-1', 'Color-boundary spectra retain explicit spectral-radiance units.');

	for (const condition of browser.conditions) {
		check(condition.hemisphere.length === 32, `${condition.id} contains 32 spectral hemisphere samples.`);
		if (condition.diskVisibleExpected) check(condition.samples.length === 5, `${condition.id} contains disk center and four inside-limb probes.`);
		else check(condition.geometryHorizonClassification === 'ground-blocked', `${condition.id} preserves the below-horizon geometric classification.`);
		for (const sample of [...condition.samples, ...condition.hemisphere]) {
			sampleCount += 1;
			for (const key of ['pathRadiance', 'celestialRadiance', 'preDisplayRadiance']) {
				const values = sample[key];
				check(values.length === 15 && values.every(Number.isFinite), `${condition.id}/${sample.id}/${key} is a finite native-15 spectrum.`);
				const comparison = projectionComparison(values, basis, cie);
				projectionRows.push({ conditionId: condition.id, sampleId: sample.id, spectrum: key, ...comparison });
			}
			for (let channel = 0; channel < 15; channel += 1) {
				const expected = sample.pathRadiance[channel] + sample.celestialRadiance[channel];
				const absolute = Math.abs(sample.preDisplayRadiance[channel] - expected);
				const scale = Math.max(Math.abs(sample.preDisplayRadiance[channel]), Math.abs(expected));
				maximumCompositionAbsolute = Math.max(maximumCompositionAbsolute, absolute);
				maximumCompositionRelative = Math.max(maximumCompositionRelative, scale > 0 ? absolute / scale : 0);
				check(absolute <= tolerance.compositionAbsolute + tolerance.compositionRelative * scale, `${condition.id}/${sample.id}/channel-${channel} preserves preDisplay = path + celestial.`);
			}
			const expectedDirection = sample.directionModel;
			const actualDirection = sample.readbackRayDirectionModel;
			const expectedLength = Math.hypot(...expectedDirection);
			const actualLength = Math.hypot(...actualDirection);
			const dot = Math.max(-1, Math.min(1, expectedDirection.reduce((sum, value, index) => sum + value * actualDirection[index], 0) / (expectedLength * actualLength)));
			const angularError = Math.acos(dot);
			maximumAimAngularError = Math.max(maximumAimAngularError, angularError);
			check(angularError <= tolerance.aimAngularErrorRadians, `${condition.id}/${sample.id} readback ray matches the requested geometry ray.`);
		}
		const center = condition.samples[0];
		const directMaximum = Math.max(...center.celestialRadiance.map(Math.abs));
		if (condition.diskVisibleExpected) minimumVisibleCenterDirect = Math.min(minimumVisibleCenterDirect, directMaximum);
		else maximumNightDirect = Math.max(maximumNightDirect, directMaximum);
	}

	const maximumRelativeY = Math.max(...projectionRows.map((row) => row.relativeY));
	const maximumDeltaUv = Math.max(...projectionRows.map((row) => row.deltaUv));
	check(minimumVisibleCenterDirect > tolerance.zeroDirectAbsolute, 'Noon and sunset-minus-10 disk centers contain transported celestial radiance.');
	check(maximumNightDirect <= tolerance.zeroDirectAbsolute, 'Sunset-plus-120 ground-blocked disk contribution is exact zero within the declared float tolerance.');
	check(maximumRelativeY <= tolerance.observerProjectionRelativeY, 'Native center-weight projection stays within the five-percent Y prerequisite against bin-integrated CIE weights.');
	check(maximumDeltaUv <= tolerance.observerProjectionDeltaUv, 'Native center-weight projection stays within the 0.005 CIE 1976 u-v prerequisite against bin-integrated CIE weights.');
	check(browser.hostWallElapsedMilliseconds <= FIXTURE.execution.maximumElapsedMilliseconds, 'The complete Stage 0 browser acquisition finished within ten minutes of host wall time.');

	return {
		accepted: true,
		assertions,
		summary: {
			conditionCount: browser.conditions.length,
			sampleCount,
			spectrumCount: projectionRows.length,
			maximumCompositionAbsolute,
			maximumCompositionRelative,
			maximumAimAngularErrorRadians: maximumAimAngularError,
			minimumVisibleCenterDirect,
			maximumNightDirect,
			maximumObserverProjectionRelativeY: maximumRelativeY,
			maximumObserverProjectionDeltaUv: maximumDeltaUv,
			browserElapsedMilliseconds: browser.elapsedMilliseconds,
			hostWallElapsedMilliseconds: browser.hostWallElapsedMilliseconds,
		},
		projectionRows,
	};
}

function report(runId, proof) {
	const summary = proof.summary;
	return `# ${runId}: Normal Color Stage 0 preflight\n\nConclusion: **accepted**\n\nThe current candidate exposed separate path, celestial, and composed native-15 radiance for all ${summary.sampleCount} selected rays while reusing one atmosphere setup across three solar times. Composition and geometry-ray identities passed, the below-horizon direct contribution was zero, and the complete browser acquisition took ${(summary.hostWallElapsedMilliseconds / 1000).toFixed(2)} seconds of host wall time.\n\nThe native center-weight observer projection differed from exact CIE integration of the declared bin-average representation by at most ${(summary.maximumObserverProjectionRelativeY * 100).toFixed(3)}% in Y and ${summary.maximumObserverProjectionDeltaUv.toExponential(4)} in CIE 1976 u-v. This qualifies the existing 15-channel representation for the first Color experiments under the declared Stage 0 thresholds; it does not validate atmospheric transport.\n\nThe 32-ray hemisphere record is an integration diagnostic, not a qualified local-luminance estimator. Local view-conditioned luminance remains a separate prerequisite before scene-derived Normal adaptation.\n`;
}

async function main() {
	const cieBytes = await readFile(CIE_PATH);
	const cieHash = sha256(cieBytes);
	const run = await initializeRunRecord({
		slug: 'normal-color-stage0-preflight',
		command: COMMAND,
		inputs: {
			fixture: 'scripts/extraterrestrial/fixtures/normal-color-stage0-preflight-v1.json',
			conditions: FIXTURE.conditions,
			runtime: 'current contained candidate GPU Color-boundary readback',
			transportBoundary: 'accepted Bruneton-qualified Algorithm32 atmosphere; not independently revalidated',
		},
		provenance: {
			experiment: 'scripts/extraterrestrial',
			candidate: 'scripts/extraterrestrial/candidate',
			cie1931Table: 'scripts/extraterrestrial/references/bruneton-step5-nonregression-v1/CIE_xyz_1931_2deg.csv',
			cie1931TableSha256: cieHash,
		},
		environment: { node: process.version, platform: process.platform, chromePath: CHROME_PATH },
		references: {
			canonicalPlan: 'agents/topics/extraterrestrial/spectral-color-transform-experiment-plan.md',
			normalPlan: 'agents/topics/extraterrestrial/normal-mode-test-plan.md',
			cie1931TableSha256: cieHash,
		},
	});
	let server;
	try {
		await assertRepositoryIdentity();
		const policy = await loadContainmentPolicy();
		const before = await createProtectedTrackedInventory(policy);
		await Promise.all([lstat(CHROME_PATH), assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree')]);
		await run.writeArtifact('browser/index.html', `<!doctype html><meta charset="utf-8"><title>Normal Color Stage 0</title><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">import { runNormalColorStage0BrowserPreflight } from '/harness/normal-color-stage0-browser-entry.js'; const target = document.querySelector('#result'); try { const fixture = await fetch('/fixtures/normal-color-stage0-preflight-v1.json').then((response) => response.json()); target.textContent = JSON.stringify(await runNormalColorStage0BrowserPreflight(fixture)); } catch (error) { target.textContent = JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}}); }</script>`);
		server = await serve(run);
		const browserStartedAt = Date.now();
		const browser = await execFile(CHROME_PATH, [
			'--headless=new', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader',
			'--virtual-time-budget=600000', '--dump-dom', server.url,
		], { timeout: 660_000, maxBuffer: 64 * 1024 * 1024, windowsHide: true });
		await run.writeArtifact('browser/dom.html', browser.stdout);
		const match = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(browser.stdout);
		requireCondition(match, 'Headless Chrome did not emit the Stage 0 result.');
		const browserResult = JSON.parse(match[1]);
		if (browserResult.error) throw new Error(`Stage 0 browser failed: ${browserResult.error.name}: ${browserResult.error.message}\n${browserResult.error.stack ?? ''}`);
		browserResult.hostWallElapsedMilliseconds = Date.now() - browserStartedAt;
		const analysis = analyzeReadback(browserResult, parseCie(cieBytes.toString('utf8')));
		await run.writeJsonArtifact('evidence/color-boundary-sidecar.json', browserResult);
		await run.writeJsonArtifact('evidence/observer-projection-analysis.json', {
			schemaId: 'normal-color-stage0-observer-projection-v1',
			reference: {
				observer: 'CIE 1931 2-degree',
				resolutionNanometers: 1,
				cieTableSha256: cieHash,
				reconstruction: 'piecewise constant radiance within each declared contiguous bin-average channel',
			},
			tolerances: FIXTURE.tolerances,
			summary: analysis.summary,
			rows: analysis.projectionRows,
		});
		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: ['runners/run-normal-color-stage0-preflight.js', 'harness/normal-color-stage0-browser-entry.js'],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
			allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:http', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util'],
		});
		const after = await createProtectedTrackedInventory(policy);
		assertFileInventoriesEqual(before, after, 'Stage 0 protected tracked-file inventory');
		const proof = {
			proofId: 'normal-color-stage0-preflight-v1',
			accepted: true,
			assertions: analysis.assertions,
			summary: analysis.summary,
			artifacts: ['evidence/color-boundary-sidecar.json', 'evidence/observer-projection-analysis.json'],
			containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length },
		};
		await run.writeJsonArtifact('evidence/stage0-proof.json', proof);
		const manifest = await run.finalize({ conclusion: 'accepted', result: proof, report: report(run.runId, proof) });
		process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, summary: proof.summary }, null, 2)}\n`);
	} catch (error) {
		const detail = { name: error.name, message: error.message, stack: error.stack };
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const manifest = await run.finalize({ conclusion: 'failed', result: { error: detail }, report: `# ${run.runId}: Normal Color Stage 0 preflight\n\nConclusion: **failed**\n\n${detail.message}\n` });
			process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail }, null, 2)}\n`);
		} catch {}
		process.exitCode = 1;
	} finally {
		await server?.close().catch(() => {});
	}
}

await main();
