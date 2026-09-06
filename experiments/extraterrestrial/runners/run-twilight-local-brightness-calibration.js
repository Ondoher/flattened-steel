import { execFile as executeFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { createServer } from 'node:http';
import { lstat, readFile } from 'node:fs/promises';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { assertContainmentPreconditions, assertExistingRealPathContained, assertNoReparseEntries, createProtectedTrackedInventory, verifyProtectedTrackedInventory } from '../harness/lib/containment.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT } from '../harness/lib/roots.js';
import { FIGURE1_DISPLAY_CONSTANTS } from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';

const PROBE_RANGE_DIAGNOSTIC = process.argv.includes('--probe-range-diagnostic');
const COMMAND = `node experiments/extraterrestrial/runners/run-twilight-local-brightness-calibration.js${PROBE_RANGE_DIAGNOSTIC ? ' --probe-range-diagnostic' : ''}`;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const execFile = promisify(executeFile);
const SOLAR_DEPRESSION_DEGREES = Object.freeze(PROBE_RANGE_DIAGNOSTIC ? [9, 10, 11, 12, 15] : [0, 3, 6, 9, 12, 15]);
const DISPLAY_KEY = 0.18;
const MINIMUM_ILLUMINANCE_LUX = 0.001;
const MAXIMUM_EXPOSURE = 100000;

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function contentType(filePath) {
	return filePath.endsWith('.js') ? 'text/javascript; charset=utf-8'
		: filePath.endsWith('.json') ? 'application/json; charset=utf-8'
			: filePath.endsWith('.html') ? 'text/html; charset=utf-8'
				: 'application/octet-stream';
}

function sourceDirectionForSolarDepression(solarDepressionDegrees) {
	const radians = solarDepressionDegrees * Math.PI / 180;
	return [-Math.sin(radians), 0, Math.cos(radians)];
}

function expectedLimitingMagnitude(solarDepressionDegrees) {
	return 1.07 * solarDepressionDegrees - 10;
}

function describeCalibration(measurement) {
	const targetLimitingVMagnitude = expectedLimitingMagnitude(measurement.solarDepressionDegrees);
	const skyIlluminanceLux = measurement.skyIlluminanceLux;
	const displayReferenceIlluminanceLux = DISPLAY_KEY * Math.PI / FIGURE1_DISPLAY_CONSTANTS.paperFigure1ToneMapK;
	const skyProbeSamples = measurement.skyProbeSamples;
	if (!Array.isArray(skyProbeSamples) || skyProbeSamples.length !== 32) {
		throw new Error('Every calibration measurement must return all 32 sky-probe samples.');
	}
	const positiveSamples = skyProbeSamples.filter((sample) => sample.positive);
	return {
		...measurement,
		targetLimitingVMagnitude,
		// The source relation's underlying 1-arcminute-eye model gives this
		// equivalent V-band sky surface-brightness target. It is recorded for
		// fit/reporting only and never supplied to rendering.
		targetSkySurfaceBrightnessVMagPerArcsecSquared: targetLimitingVMagnitude + 15,
		skyIlluminanceLog10Lux: skyIlluminanceLux > 0 ? Math.log10(skyIlluminanceLux) : null,
		colorExposure: Math.min(displayReferenceIlluminanceLux / Math.max(skyIlluminanceLux, MINIMUM_ILLUMINANCE_LUX), MAXIMUM_EXPOSURE),
		geometryAmbientResponse: 'sampled-hdr-linear-srgb-irradiance-direct',
		skyProbeSampleSummary: {
			sampleCount: skyProbeSamples.length,
			positiveSampleCount: positiveSamples.length,
			zeroSampleCount: skyProbeSamples.length - positiveSamples.length,
			maximumLog2PhotopicLuminance: Math.max(...skyProbeSamples.map((sample) => sample.log2PhotopicLuminance)),
			minimumPositiveLog2PhotopicLuminance: positiveSamples.length > 0
				? Math.min(...positiveSamples.map((sample) => sample.log2PhotopicLuminance))
				: null,
		},
		...(PROBE_RANGE_DIAGNOSTIC ? { skyProbeSamples } : {}),
	};
}

async function serve(run) {
	const roots = new Map([
		['/browser/', path.join(run.runDirectory, 'browser')],
		['/harness/', path.join(EXPERIMENT_ROOT, 'harness')],
		['/candidate/', path.join(EXPERIMENT_ROOT, 'candidate')],
		['/fixtures/', path.join(EXPERIMENT_ROOT, 'fixtures')],
		['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT],
	]);
	const server = createServer(async (request, response) => {
		try {
			const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
			const entry = [...roots.entries()].find(([prefix]) => pathname.startsWith(prefix));
			if (!entry) throw new Error('Unsupported runtime path.');
			const relative = pathname.slice(entry[0].length);
			if (!relative || relative.includes('..') || path.isAbsolute(relative)) throw new Error('Unsafe runtime path.');
			const filePath = path.resolve(entry[1], relative);
			if (!filePath.startsWith(path.resolve(entry[1]) + path.sep)) throw new Error('Runtime path escaped root.');
			response.writeHead(200, { 'content-type': contentType(filePath) });
			response.end(await readFile(filePath));
		} catch {
			response.writeHead(404);
			response.end('not found');
		}
	});
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	return {
		url: `http://127.0.0.1:${server.address().port}/browser/index.html`,
		close: () => new Promise((resolve) => server.close(resolve)),
	};
}

async function main() {
	const samples = SOLAR_DEPRESSION_DEGREES.map((solarDepressionDegrees) => ({
		solarDepressionDegrees,
		directionToSourceUpEastNorth: sourceDirectionForSolarDepression(solarDepressionDegrees),
	}));
	const run = await initializeRunRecord({
			slug: PROBE_RANGE_DIAGNOSTIC ? 'twilight-sky-probe-range-diagnostic' : 'twilight-local-brightness-calibration',
		command: COMMAND,
		inputs: {
			measurement: PROBE_RANGE_DIAGNOSTIC
				? 'normal Algorithm32 facade -> ShaderBuilder -> atmospheric-only per-ray sky-probe log-luminance diagnostic'
				: 'normal Algorithm32 facade -> ShaderBuilder -> atmospheric-only Color HDR sky probe',
			fixtures: ['fixtures/subjective-globe-context-scenes-v1.json', 'fixtures/g4-cpu-sun-disk-transport-v1.json'],
			solarDepressionDegrees: SOLAR_DEPRESSION_DEGREES,
			visibilityTarget: 'm_limit(theta) = 1.07 * theta - 10; fixed 1-arcminute eye approximation; external calibration target only',
			ambientResponse: 'sampled HDR linear-sRGB diffuse irradiance, evaluated by Three Lambert / pi',
		},
		provenance: { experiment: 'experiments/extraterrestrial', candidate: 'experiments/extraterrestrial/candidate' },
		environment: { node: process.version, platform: process.platform, chromePath: CHROME_PATH },
		references: {
			canonicalDesign: 'agents/topics/extraterrestrial/celestial-contribution-cache-design.md',
			canonicalPlan: 'agents/topics/extraterrestrial/promotion-plan.md',
			twilightReference: 'https://astronomy.stackexchange.com/questions/6205/time-after-sunset-until-star-can-be-seen',
		},
	});
	let server;
	try {
		const policy = await assertContainmentPreconditions();
		const before = await createProtectedTrackedInventory(policy);
		await Promise.all([
			lstat(CHROME_PATH),
			assertExistingRealPathContained(EXPERIMENT_ROOT, path.join(EXPERIMENT_ROOT, 'fixtures', 'subjective-globe-context-scenes-v1.json'), 'twilight calibration fixture'),
			assertExistingRealPathContained(EXPERIMENT_ROOT, path.join(EXPERIMENT_ROOT, 'fixtures', 'g4-cpu-sun-disk-transport-v1.json'), 'twilight calibration radiometry fixture'),
			assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree'),
		]);
		await run.writeJsonArtifact('browser/twilight-brightness-calibration-input.json', {
			schemaVersion: 'twilight-brightness-calibration-input-v1',
			samples,
		});
		await run.writeArtifact('browser/index.html', `<!doctype html><meta charset="utf-8"><title>Twilight local brightness calibration</title><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">import { runThreeSubjectiveGlobeTwilightBrightnessCalibrationBrowserProbe } from '/harness/three-subjective-globe-scenes-browser-entry.js'; const result = document.querySelector('#result'); try { result.textContent = JSON.stringify(await runThreeSubjectiveGlobeTwilightBrightnessCalibrationBrowserProbe()); } catch (error) { result.textContent = JSON.stringify({ error: { name: error.name, message: error.message, stack: error.stack } }); }</script>`);
		server = await serve(run);
		const browser = await execFile(CHROME_PATH, ['--headless=new', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--virtual-time-budget=480000', '--dump-dom', server.url], { timeout: 540000, maxBuffer: 32 * 1024 * 1024, windowsHide: true });
		await run.writeArtifact('browser/dom.html', browser.stdout);
		const match = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(browser.stdout);
		requireCondition(match, 'Headless browser did not emit the twilight calibration result.');
		const browserResult = JSON.parse(match[1]);
		if (browserResult.error) throw new Error(`Twilight calibration failed: ${browserResult.error.name}: ${browserResult.error.message}`);
		requireCondition(browserResult.probeId === 'twilight-local-brightness-calibration-v1', 'Browser must use the dedicated local-brightness calibration probe.');
		requireCondition(browserResult.measurements.length === samples.length, 'Browser must measure every solar-depression sample.');
		const measurements = browserResult.measurements.map(describeCalibration);
		for (let index = 0; index < measurements.length; index += 1) {
			const measurement = measurements[index];
			requireCondition(Number.isFinite(measurement.skyIlluminanceLux) && measurement.skyIlluminanceLux >= 0, `Sample ${index} must produce finite nonnegative local sky illuminance.`);
			requireCondition(measurement.shaderIncludes.cumulativeAtmosphere && measurement.shaderIncludes.celestialLive && !measurement.shaderIncludes.stellarLive, `Sample ${index} must meter ordinary atmosphere with no stellar source input.`);
			requireCondition(measurement.ambientLighting.owner === 'scene-lighting' && measurement.ambientLighting.meter === 'geometry.sampledSkyIrradiance', `Sample ${index} Geometry ambient must consume sampled sky irradiance.`);
			requireCondition(measurement.skyProbeSampleSummary.sampleCount === 32, `Sample ${index} must retain all geometry-provided sky-probe directions.`);
			if (index > 0) {
				requireCondition(measurement.skyIlluminanceLux <= measurements[index - 1].skyIlluminanceLux, 'Sky illuminance must not increase as the Sun is depressed farther below the horizon.');
				requireCondition(measurement.targetLimitingVMagnitude > measurements[index - 1].targetLimitingVMagnitude, 'External limiting-magnitude target must increase monotonically with solar depression.');
			}
		}
		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: ['runners/run-twilight-local-brightness-calibration.js', 'harness/three-subjective-globe-scenes-browser-entry.js'],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
			allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:http', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util', 'node:zlib'],
		});
		const after = await verifyProtectedTrackedInventory(before, policy);
		const result = {
			calibrationId: PROBE_RANGE_DIAGNOSTIC ? 'twilight-sky-probe-range-diagnostic-v1' : 'twilight-local-brightness-calibration-v1',
			status: measurements.some((measurement) => measurement.skyIlluminanceLux === 0)
				? 'measurement-baseline; dark-end meter floor observed; curve fitting remains open'
				: 'measurement-baseline; curve fitting remains open',
			measurementResolution: browserResult.measurementResolution,
			measurements,
			containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length },
		};
		await run.writeJsonArtifact('evidence/twilight-local-brightness-calibration.json', result);
		const manifest = await run.finalize({
			conclusion: 'accepted',
			result,
			report: `# ${run.runId}: ${PROBE_RANGE_DIAGNOSTIC ? 'Twilight sky-probe range diagnostic' : 'Twilight local-brightness calibration baseline'}\n\nConclusion: **accepted**\n\nThe normal atmospheric HDR meter was sampled over the declared solar-depression grid. The published limiting-magnitude relation is recorded only as an external calibration target; it is not a renderer visibility rule.\n`,
		});
		process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256 }, null, 2)}\n`);
	} catch (error) {
		const detail = { name: error.name, message: error.message, stack: error.stack };
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const manifest = await run.finalize({ conclusion: 'failed', result: { error: detail }, report: `# ${run.runId}: ${PROBE_RANGE_DIAGNOSTIC ? 'Twilight sky-probe range diagnostic' : 'Twilight local-brightness calibration baseline'}\n\nConclusion: **failed**\n\n${detail.message}\n` });
			process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail }, null, 2)}\n`);
		} catch {}
		process.exitCode = 1;
	} finally {
		await server?.close().catch(() => {});
	}
}

await main();
