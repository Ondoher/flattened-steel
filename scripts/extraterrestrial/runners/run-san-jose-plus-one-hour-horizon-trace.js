#!/usr/bin/env node

import {execFile as executeFile} from 'node:child_process';
import {lstat, mkdir, readFile, realpath, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {promisify} from 'node:util';

import {
	assertCreatablePathContained,
	assertExistingRealPathContained,
	assertNoReparseEntries,
} from '../harness/lib/containment.js';
import {sha256File} from '../harness/lib/atomic-files.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	createSelectedFileInventory,
} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	OUTPUT_ROOT,
	REPOSITORY_ROOT,
	RUNS_ROOT,
	assertRepositoryIdentity,
} from '../harness/lib/roots.js';
import {verifyRun} from './verify-run.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-san-jose-plus-one-hour-horizon-trace.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executeFileAsync = promisify(executeFile);
const SCREEN_PALETTE_ROOT = path.join(EXPERIMENT_ROOT, 'stellar-screen-palette');
const CANDIDATE_ROOT = path.join(EXPERIMENT_ROOT, 'candidate');
const FIXTURES_ROOT = path.join(EXPERIMENT_ROOT, 'fixtures');
const THREE_ROOT = path.join(EXPERIMENT_NODE_MODULES_ROOT, 'three');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const FIXTURE_INPUTS = Object.freeze([
	Object.freeze({
		id: 'subjectiveGlobeContextScenes',
		fileName: 'subjective-globe-context-scenes-v1.json',
	}),
	Object.freeze({
		id: 'g4CpuSunDiskTransport',
		fileName: 'g4-cpu-sun-disk-transport-v1.json',
	}),
]);
const PARENT = Object.freeze({
	runId: '000466-bruneton-source-luminance-lift-spherical-comparison',
	artifactSetSha256: '62f912ac0fdbfac432b58e3c094a76a3a792f6afbda12de2ee6af7a5fddbd250',
	configArtifact: 'browser/config.json',
	visibleLobeArtifact: 'captures/source-exposure-sunset-plus-one-hour.png',
});
const TRACE = Object.freeze({
	minimumOffsetDegrees: -90,
	maximumOffsetDegrees: 90,
	stepDegrees: 0.5,
	elevationDegrees: 0,
});
const W27_ROLL_DEGREES = Object.freeze([0, 45, 90]);
const MODULE_CLOSURE_ENTRY_FILES = Object.freeze([
	'runners/run-san-jose-plus-one-hour-horizon-trace.js',
	'stellar-screen-palette/cubed-sphere-w27-seam-audit.js',
	'stellar-screen-palette/run-san-jose-plus-one-hour-horizon-trace-browser.js',
	'stellar-screen-palette/RolledW27SphericalEarthGeometry.js',
]);
const MODULE_CLOSURE_ALLOWED_NODE_BUILTINS = Object.freeze([
	'node:child_process',
	'node:crypto',
	'node:fs',
	'node:fs/promises',
	'node:http',
	'node:module',
	'node:os',
	'node:path',
	'node:url',
	'node:util',
]);

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function contentType(target) {
	if (target.endsWith('.js')) return 'text/javascript; charset=utf-8';
	if (target.endsWith('.json')) return 'application/json; charset=utf-8';
	if (target.endsWith('.html')) return 'text/html; charset=utf-8';
	return 'application/octet-stream';
}

async function inventoryProduction() {
	const [algorithm32, flat32] = await Promise.all([
		createFileInventory(ALGORITHM32_ROOT),
		createFileInventory(FLAT32_ROOT),
	]);
	return {algorithm32, flat32};
}

async function removeBrowserProfile(profilePath) {
	await assertExistingRealPathContained(OUTPUT_ROOT, profilePath, 'Chrome horizon-trace profile');
	await assertNoReparseEntries(profilePath, 'Chrome horizon-trace profile');
	await rm(profilePath, {recursive: true, force: true});
}

async function buildImplementationClosure() {
	return buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: MODULE_CLOSURE_ENTRY_FILES,
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
		allowedNodeBuiltins: MODULE_CLOSURE_ALLOWED_NODE_BUILTINS,
	});
}

async function describeImplementationClosure(closure) {
	const fileArtifacts = [];
	for (const relativePath of closure.files) {
		const absolutePath = await assertExistingRealPathContained(
			EXPERIMENT_ROOT,
			path.join(EXPERIMENT_ROOT, ...relativePath.split('/')),
			`implementation module ${relativePath}`,
		);
		const info = await lstat(absolutePath);
		fileArtifacts.push({
			path: relativePath,
			sha256: await sha256File(absolutePath),
			byteLength: info.size,
		});
	}
	return {...closure, fileArtifacts};
}

async function serve(run) {
	const requests = [];
	const roots = new Map([
		['/browser/', path.join(run.runDirectory, 'browser')],
		['/screen-palette/', SCREEN_PALETTE_ROOT],
		['/candidate/', CANDIDATE_ROOT],
		['/fixtures/', FIXTURES_ROOT],
		['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT],
	]);
	const server = createServer(async (request, response) => {
		try {
			const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
			requests.push(pathname);
			const route = [...roots].find(([prefix]) => pathname.startsWith(prefix));
			if (!route || pathname.includes('..')) throw new Error('Unsupported horizon-trace path.');
			const [prefix, root] = route;
			const target = path.resolve(root, pathname.slice(prefix.length));
			if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error('Horizon-trace path escapes its route root.');
			const info = await lstat(target);
			if (!info.isFile() || info.isSymbolicLink()) throw new Error('Horizon-trace target is not a real file.');
			const [canonicalRoot, canonicalTarget] = await Promise.all([realpath(root), realpath(target)]);
			if (!canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) throw new Error('Horizon-trace real path escapes its route root.');
			response.writeHead(200, {'content-type': contentType(target)});
			response.end(await readFile(canonicalTarget));
		} catch (error) {
			response.writeHead(404, {'content-type': 'text/plain; charset=utf-8'});
			response.end(error.message);
		}
	});
	await new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', resolve);
	});
	return {
		url: `http://127.0.0.1:${server.address().port}/browser/index.html`,
		requests,
		close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
	};
}

function csvCell(value) {
	const text = String(value ?? '');
	return /[",\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function traceCsv(result) {
	const channelColumns = (prefix) => Array.from({length: 15}, (_, index) => `${prefix}_lambda_${index}`);
	const header = [
		'roll_degrees', 'index', 'offset_degrees', 'azimuth_degrees',
		'direction_x', 'direction_y', 'direction_z',
		'face_id', 'face_u', 'face_v', 'face_boundary_distance',
		'cpu_y_cd_m2', 'gpu_y_cd_m2',
		'cpu_linear_r', 'cpu_linear_g', 'cpu_linear_b',
		'gpu_linear_r', 'gpu_linear_g', 'gpu_linear_b',
		'maximum_absolute_cpu_gpu_residual', 'maximum_relative_cpu_gpu_residual',
		...channelColumns('cpu'), ...channelColumns('gpu'),
	];
	const rows = [header];
	for (const roll of result.rolls) {
		for (const sample of roll.samples) {
			rows.push([
				roll.rollDegrees, sample.index, sample.offsetDegrees, sample.azimuthDegrees,
				...sample.directionModel,
				sample.cache.face.id, sample.cache.face.u, sample.cache.face.v, sample.cache.face.boundaryDistance,
				sample.cpu.photopicLuminanceCdPerSquareMeter, sample.gpu.photopicLuminanceCdPerSquareMeter,
				...sample.cpu.signedLinearSrgb, ...sample.gpu.signedLinearSrgb,
				sample.cpuVsGpu.maximumAbsolute, sample.cpuVsGpu.maximumRelative,
				...sample.cpu.pathRadiance, ...sample.gpu.pathRadiance,
			]);
		}
	}
	return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function sparseCsv(result) {
	const rows = [[
		'roll_degrees', 'probe_id', 'dense_index', 'offset_degrees',
		'boundary_offset_degrees', 'boundary_epsilon_radians', 'probe_reasons', 'face_id',
		'path_interval_count', 'y_cd_m2', 'delta_from_160_y_cd_m2',
		'relative_delta_from_160', 'maximum_absolute_spectral_delta_from_160',
	]];
	for (const roll of result.rolls) {
		for (const probe of roll.sparseIntegration) {
			for (const evaluation of probe.evaluations) {
				rows.push([
					roll.rollDegrees, probe.probeId, probe.denseIndex, probe.offsetDegrees,
					probe.boundaryOffsetDegrees, probe.boundaryEpsilonRadians,
					probe.probeReasons.join('|'), probe.cache.face.id,
					evaluation.pathIntervalCount, evaluation.photopicLuminanceCdPerSquareMeter,
					evaluation.deltaFrom160.photopicLuminanceCdPerSquareMeter,
					evaluation.deltaFrom160.relativePhotopicLuminance,
					evaluation.deltaFrom160.maximumAbsoluteSpectral,
				]);
			}
		}
	}
	return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function escapeXml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

function polyline(points, color, width = 2) {
	return `<polyline fill="none" stroke="${color}" stroke-width="${width}" points="${points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')}"/>`;
}

function diagnosticSvg(result) {
	const colors = new Map([[0, '#e8e8e8'], [45, '#ff9f43'], [90, '#46b5ff']]);
	const width = 1200;
	const height = 800;
	const left = 82;
	const right = 28;
	const plotWidth = width - left - right;
	const topY = 82;
	const topHeight = 330;
	const deltaY = 500;
	const deltaHeight = 180;
	const x = (offset) => left + (offset - TRACE.minimumOffsetDegrees) / (TRACE.maximumOffsetDegrees - TRACE.minimumOffsetDegrees) * plotWidth;
	const positiveY = result.rolls.flatMap((roll) => roll.samples.map((sample) => sample.gpu.photopicLuminanceCdPerSquareMeter)).filter((value) => value > 0);
	requireCondition(positiveY.length > 0 && positiveY.every(Number.isFinite), 'The horizon figure requires at least one finite positive path-radiance luminance.');
	const floor = Math.max(Math.min(...positiveY) * 0.5, 1e-30);
	const logs = result.rolls.flatMap((roll) => roll.samples.map((sample) => Math.log10(Math.max(sample.gpu.photopicLuminanceCdPerSquareMeter, floor))));
	const logMinimum = Math.min(...logs);
	const logMaximum = Math.max(...logs);
	const logSpan = Math.max(logMaximum - logMinimum, 1e-12);
	requireCondition([floor, logMinimum, logMaximum, logSpan].every(Number.isFinite), 'The horizon figure luminance scale must be finite.');
	const topPlotY = (value) => topY + topHeight - (Math.log10(Math.max(value, floor)) - logMinimum) / logSpan * topHeight;
	const comparisonValues = result.rollComparisons.flatMap((comparison) => comparison.samples.map((sample) => sample.log10PhotopicLuminanceRatio));
	const deltaLimit = Math.max(0.01, ...comparisonValues.map(Math.abs));
	requireCondition(Number.isFinite(deltaLimit), 'The horizon figure roll-delta scale must be finite.');
	const deltaPlotY = (value) => deltaY + deltaHeight / 2 - value / deltaLimit * deltaHeight / 2;
	const maximumPhysicalDirectionDelta = Math.max(...result.rollComparisons.flatMap((comparison) => comparison.samples.map((sample) => sample.physicalDirectionDeltaNorm)));
	const quarterTurn = result.quarterTurnCubeSymmetry;
	requireCondition(quarterTurn && [
		maximumPhysicalDirectionDelta,
		quarterTurn.maximumLocalCoordinateComponentDelta,
		quarterTurn.maximumStencilWeightDelta,
	].every(Number.isFinite), 'The horizon figure requires finite physical-ray and quarter-turn controls.');
	const fragments = [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
		'<rect width="100%" height="100%" fill="#11151b"/>',
		'<style>text{font-family:Segoe UI,Arial,sans-serif;fill:#e8edf4}.axis{stroke:#77808c;stroke-width:1}.grid{stroke:#303844;stroke-width:1}.face{stroke-width:1;stroke-dasharray:4 5;opacity:.48}</style>',
		'<text x="82" y="34" font-size="22">San Jose sunset +1 h: pre-Color horizontal path radiance under W27 frame roll</text>',
		'<text x="82" y="58" font-size="13" fill="#aeb8c4">Same physical rays; live GPU Native-15 transport. Top: photopic Y (log). Bottom: log10(Yroll/Y0).</text>',
		`<rect x="${left}" y="${topY}" width="${plotWidth}" height="${topHeight}" fill="#171d25" stroke="#56606c"/>`,
		`<rect x="${left}" y="${deltaY}" width="${plotWidth}" height="${deltaHeight}" fill="#171d25" stroke="#56606c"/>`,
	];
	for (const tick of [-90, -60, -30, 0, 30, 60, 90]) {
		fragments.push(`<line class="grid" x1="${x(tick)}" x2="${x(tick)}" y1="${topY}" y2="${topY + topHeight}"/>`);
		fragments.push(`<line class="grid" x1="${x(tick)}" x2="${x(tick)}" y1="${deltaY}" y2="${deltaY + deltaHeight}"/>`);
		fragments.push(`<text x="${x(tick)}" y="${deltaY + deltaHeight + 24}" font-size="12" text-anchor="middle">${tick} deg</text>`);
	}
	for (let tick = 0; tick <= 4; tick += 1) {
		const value = logMinimum + logSpan * tick / 4;
		const py = topY + topHeight - topHeight * tick / 4;
		fragments.push(`<line class="grid" x1="${left}" x2="${left + plotWidth}" y1="${py}" y2="${py}"/>`);
		fragments.push(`<text x="${left - 9}" y="${py + 4}" font-size="11" text-anchor="end">${value.toFixed(2)}</text>`);
	}
	fragments.push(`<line class="grid" x1="${left}" x2="${left + plotWidth}" y1="${deltaY + deltaHeight / 2}" y2="${deltaY + deltaHeight / 2}"/>`);
	fragments.push(`<text x="${left - 9}" y="${deltaY + 5}" font-size="11" text-anchor="end">+${deltaLimit.toFixed(3)}</text>`);
	fragments.push(`<text x="${left - 9}" y="${deltaY + deltaHeight / 2 + 4}" font-size="11" text-anchor="end">0</text>`);
	fragments.push(`<text x="${left - 9}" y="${deltaY + deltaHeight + 4}" font-size="11" text-anchor="end">-${deltaLimit.toFixed(3)}</text>`);
	for (const roll of result.rolls) {
		const color = colors.get(roll.rollDegrees);
		for (const transition of roll.summary.faceTransitions) {
			const boundary = (transition.betweenOffsetsDegrees[0] + transition.betweenOffsetsDegrees[1]) / 2;
			fragments.push(`<line class="face" stroke="${color}" x1="${x(boundary)}" x2="${x(boundary)}" y1="${topY}" y2="${topY + topHeight}"/>`);
		}
		fragments.push(polyline(roll.samples.map((sample) => [x(sample.offsetDegrees), topPlotY(sample.gpu.photopicLuminanceCdPerSquareMeter)]), color, roll.rollDegrees === 0 ? 2.5 : 2));
		for (const probe of roll.sparseIntegration) {
			const evaluation15 = probe.evaluations.find((entry) => entry.pathIntervalCount === 15);
			requireCondition(evaluation15, 'Every plotted sparse probe must include its 15-interval evaluation.');
			fragments.push(`<circle cx="${x(probe.offsetDegrees)}" cy="${topPlotY(evaluation15.photopicLuminanceCdPerSquareMeter)}" r="2.4" fill="${color}"/>`);
		}
	}
	for (const comparison of result.rollComparisons) {
		fragments.push(polyline(comparison.samples.map((sample) => [x(sample.offsetDegrees), deltaPlotY(sample.log10PhotopicLuminanceRatio)]), colors.get(comparison.rollDegrees), 2));
	}
	let legendX = 815;
	for (const roll of result.rolls) {
		const color = colors.get(roll.rollDegrees);
		fragments.push(`<line x1="${legendX}" x2="${legendX + 25}" y1="54" y2="54" stroke="${color}" stroke-width="3"/>`);
		fragments.push(`<text x="${legendX + 31}" y="58" font-size="12">roll ${roll.rollDegrees} deg</text>`);
		legendX += 116;
	}
	fragments.push(`<text transform="translate(18 ${topY + topHeight / 2}) rotate(-90)" font-size="12" text-anchor="middle">log10 photopic Y [cd m^-2]</text>`);
	fragments.push(`<text transform="translate(18 ${deltaY + deltaHeight / 2}) rotate(-90)" font-size="12" text-anchor="middle">log10 roll / baseline</text>`);
	fragments.push(`<text x="${left}" y="728" font-size="11">Source elevation ${escapeXml(result.trace.sourceElevationDegrees.toFixed(4))} deg. Face markers use each rolled cache's dominant-face transition.</text>`);
	fragments.push(`<text x="${left}" y="747" font-size="11">Controls: max physical-ray delta ${escapeXml(maximumPhysicalDirectionDelta.toExponential(3))}; +90 local-coordinate delta ${escapeXml(quarterTurn.maximumLocalCoordinateComponentDelta.toExponential(3))}; tap/key mismatches ${quarterTurn.stencilTapCountMismatchCount}/${quarterTurn.physicalNodeKeyMismatchCount}; max weight delta ${escapeXml(quarterTurn.maximumStencilWeightDelta.toExponential(3))}.</text>`);
	fragments.push(`<text x="${left + plotWidth / 2}" y="778" font-size="13" text-anchor="middle">Azimuth offset from +1 h source bearing (degrees); circles are 15/40/160 CPU integration probes</text>`);
	fragments.push('</svg>');
	return fragments.join('\n');
}

function analyze(result) {
	const perRoll = result.rolls.map((roll) => {
		const seamJumps = roll.summary.faceTransitions.map((transition) => transition.gpuYJump);
		const maximumSparseRelative15To160 = Math.max(...roll.sparseIntegration.map((probe) => Math.abs(probe.evaluations.find((entry) => entry.pathIntervalCount === 15).deltaFrom160.relativePhotopicLuminance)));
		const brightest = roll.samples.reduce((selected, sample) =>
			sample.gpu.photopicLuminanceCdPerSquareMeter > selected.gpu.photopicLuminanceCdPerSquareMeter ? sample : selected);
		const adjacent = roll.samples.slice(1).map((sample, index) => {
			const previous = roll.samples[index];
			return {
				betweenOffsetsDegrees: [previous.offsetDegrees, sample.offsetDegrees],
				absoluteYJump: Math.abs(sample.gpu.photopicLuminanceCdPerSquareMeter - previous.gpu.photopicLuminanceCdPerSquareMeter),
				absoluteLog10YJump: Math.abs(Math.log10(Math.max(sample.gpu.photopicLuminanceCdPerSquareMeter, 1e-30)) - Math.log10(Math.max(previous.gpu.photopicLuminanceCdPerSquareMeter, 1e-30))),
			};
		});
		const strongestGradient = adjacent.reduce((selected, entry) =>
			entry.absoluteLog10YJump > selected.absoluteLog10YJump ? entry : selected);
		const gradientCenter = (strongestGradient.betweenOffsetsDegrees[0] + strongestGradient.betweenOffsetsDegrees[1]) / 2;
		const nearestFaceTransitionDistanceDegrees = Math.min(...roll.summary.faceTransitions.map((transition) => {
			const boundary = (transition.betweenOffsetsDegrees[0] + transition.betweenOffsetsDegrees[1]) / 2;
			return Math.abs(boundary - gradientCenter);
		}));
		const seamAudit = roll.residentCumulativeW27SeamAudit;
		return {
			rollDegrees: roll.rollDegrees,
			faceTransitionCount: roll.summary.faceTransitions.length,
			maximumFaceTransitionGpuYJump: Math.max(0, ...seamJumps),
			maximumAdjacentGpuYJump: roll.summary.maximumGpuAdjacentYJump,
			brightestOffsetDegrees: brightest.offsetDegrees,
			brightestPhotopicLuminanceCdPerSquareMeter: brightest.gpu.photopicLuminanceCdPerSquareMeter,
			strongestAdjacentLog10YGradient: strongestGradient,
			strongestGradientDistanceFromNearestFaceTransitionDegrees: nearestFaceTransitionDistanceDegrees,
			maximumAbsoluteCpuGpuResidual: roll.summary.maximumAbsoluteCpuGpuResidual,
			maximumRelativeCpuGpuResidual: roll.summary.maximumRelativeCpuGpuResidual,
			maximumSparseRelative15To160,
			seamAudit: {
				readbackScalarCount: seamAudit.readbackPlan.scalarCount,
				exactAliasMismatchCount: seamAudit.duplicateValues.exactMismatchCount,
				maximumAliasAbsoluteDifference: seamAudit.duplicateValues.maximumAbsoluteDifference,
				maximumAliasRelativeDifference: seamAudit.duplicateValues.maximumRelativeDifference,
				maximumSampledSideJump: seamAudit.boundaryInterpolation.maximumSampledSideJump,
				maximumRelativeSampledSideJump: seamAudit.boundaryInterpolation.maximumRelativeSampledSideJump,
				maximumAbsoluteSlopeJump: seamAudit.boundaryInterpolation.maximumAbsoluteSlopeJump,
			},
			identities: roll.numerics,
		};
	});
	const rollDeltas = result.rollComparisons.map((comparison) => {
		const largest = comparison.samples.reduce((selected, sample) =>
			Math.abs(sample.log10PhotopicLuminanceRatio) > Math.abs(selected.log10PhotopicLuminanceRatio) ? sample : selected);
		return {
			rollDegrees: comparison.rollDegrees,
			maximumAbsoluteLog10YRatio: Math.abs(largest.log10PhotopicLuminanceRatio),
			maximumAbsoluteLog10YRatioOffsetDegrees: largest.offsetDegrees,
			maximumPhysicalDirectionDeltaNorm: Math.max(...comparison.samples.map((sample) => sample.physicalDirectionDeltaNorm)),
		};
	});
	return {perRoll, rollDeltas, quarterTurnCubeSymmetry: result.quarterTurnCubeSymmetry};
}

function report(runId, analysis, assertions) {
	return [
		`# ${runId}: San Jose +1 h W27 horizon trace`, '',
		'Conclusion: **accepted as a contained diagnostic execution**.', '',
		'The exact run-000466 San Jose sunset-plus-one-hour source state is traced over the same 361 physical local-horizontal rays with fresh W27 rolls of 0, 45, and 90 degrees. Every roll records live GPU pre-Color Native-15 path radiance, a CPU Reference evaluation over an exact gathered readback of that roll\'s resident R32F field, signed Bruneton linear RGB/Y, dominant face and bilinear taps, sparse 15/40/160-interval integration controls, and a bounded cumulative-R32F audit of all 300 edge aliases plus eight corner triples.', '',
		`Per-roll diagnostic summary: ${JSON.stringify(analysis.perRoll)}.`, '',
		`Same-physical-ray roll deltas: ${JSON.stringify(analysis.rollDeltas)}.`, '',
		`Mechanical assertions: ${assertions.length}.`, '',
		'This run diagnoses causality; acceptance of its mechanics does not by itself accept the twilight appearance or modify transport, Color, production, or any prior run.', '',
	].join('\n');
}

async function main() {
	if (process.argv.length !== 2) throw new Error('The horizon trace accepts no arguments.');
	const run = await initializeRunRecord({
		slug: 'san-jose-plus-one-hour-w27-horizon-trace',
		command: COMMAND,
		inputs: {
			schemaId: 'san-jose-plus-one-hour-w27-horizon-trace-input-v1',
			parent: PARENT,
			trace: TRACE,
			w27RollDegrees: W27_ROLL_DEGREES,
			maximumScatteringOrder: 4,
			gpuPathIntervalCount: 15,
			cpuSparsePathIntervalCounts: [15, 40, 160],
			residentW27SeamAudit: {
				positionIndices: [0, 23, 47],
				wavelengthIndices: [0, 3, 7, 10, 14],
				epsilonRadians: [1e-9, 1e-8, 1e-7, 1e-6, 1e-5, 1e-4],
				maximumScalarCount: 25000,
			},
			fixtureInputs: FIXTURE_INPUTS.map((fixture) => `scripts/extraterrestrial/fixtures/${fixture.fileName}`),
		},
		provenance: {
			schemaId: 'san-jose-plus-one-hour-w27-horizon-trace-provenance-v1',
			operation: 'Rebuild one fresh N4 spherical/distant cache per W27 source-axis roll; trace the same dense source-centered physical horizon through live GPU common transport before Color; gather exactly referenced resident R32F cache scalars for CPU Reference parity, sparse path-quadrature refinement, and the bounded complete W27 edge/corner alias and one-sided interpolation audit.',
			implementation: [
				'scripts/extraterrestrial/stellar-screen-palette/cubed-sphere-w27-seam-audit.js',
				'scripts/extraterrestrial/stellar-screen-palette/RolledW27SphericalEarthGeometry.js',
				'scripts/extraterrestrial/stellar-screen-palette/run-san-jose-plus-one-hour-horizon-trace-browser.js',
				'scripts/extraterrestrial/runners/run-san-jose-plus-one-hour-horizon-trace.js',
			],
			exclusions: ['Color tuning', 'ozone change', 'production change', 'prior-run mutation', 'night or scene-specific transport branch'],
		},
		environment: {
			schemaId: 'san-jose-plus-one-hour-w27-horizon-trace-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: CHROME_PATH,
		},
		references: {
			schemaId: 'san-jose-plus-one-hour-w27-horizon-trace-references-v1',
			activeTopic: 'agents/topics/active-topic.md',
			productionPlan: 'agents/topics/extraterrestrial/stellar-screen-palette-production-port-plan.md',
			visibleLobeParent: PARENT,
		},
	});
	let server;
	let browserProfilePath;
	try {
		await assertRepositoryIdentity();
		await Promise.all([
			assertNoReparseEntries(SCREEN_PALETTE_ROOT),
			assertNoReparseEntries(CANDIDATE_ROOT),
			assertNoReparseEntries(FIXTURES_ROOT),
		]);
		const chromeInfo = await lstat(CHROME_PATH);
		requireCondition(chromeInfo.isFile() && !chromeInfo.isSymbolicLink(), 'Chrome executable must be a real non-symlink file.');
		const chromeIdentity = {
			path: CHROME_PATH,
			sha256: await sha256File(CHROME_PATH),
			byteLength: chromeInfo.size,
		};
		const closureBefore = await buildImplementationClosure();
		const [implementationClosure, experimentPackageInventory, threeDependencyInventory] = await Promise.all([
			describeImplementationClosure(closureBefore),
			createSelectedFileInventory(EXPERIMENT_ROOT, ['package.json', 'package-lock.json']),
			createFileInventory(THREE_ROOT),
		]);
		const tooling = {
			chrome: chromeIdentity,
			experimentPackageInventory,
			threeDependencyInventory,
		};
		const toolingSummary = {
			chrome: chromeIdentity,
			experimentPackageInventory: {
				fileCount: experimentPackageInventory.fileCount,
				aggregateSha256: experimentPackageInventory.aggregateSha256,
			},
			threeDependencyInventory: {
				fileCount: threeDependencyInventory.fileCount,
				aggregateSha256: threeDependencyInventory.aggregateSha256,
			},
		};
		await run.writeJsonArtifact('evidence/implementation-closure.json', implementationClosure);
		await run.writeJsonArtifact('evidence/tooling.json', tooling);
		const productionBefore = await inventoryProduction();
		const parentRoot = path.join(RUNS_ROOT, PARENT.runId);
		await assertExistingRealPathContained(RUNS_ROOT, parentRoot, 'run 000466 root');
		await assertNoReparseEntries(parentRoot);
		const parentVerification = await verifyRun(PARENT.runId);
		requireCondition(parentVerification.artifactSetSha256 === PARENT.artifactSetSha256, 'Run 000466 artifact-set identity changed.');
		const parentConfigPath = await assertExistingRealPathContained(parentRoot, path.join(parentRoot, ...PARENT.configArtifact.split('/')), 'run 000466 browser config');
		const parentCapturePath = await assertExistingRealPathContained(parentRoot, path.join(parentRoot, ...PARENT.visibleLobeArtifact.split('/')), 'run 000466 visible lobe capture');
		const parentConfig = JSON.parse(await readFile(parentConfigPath, 'utf8'));
		const scene = parentConfig.scenes.find((entry) => entry.id === 'sunset-plus-one-hour');
		requireCondition(scene, 'Run 000466 omits the sunset-plus-one-hour scene.');
		const parentArtifacts = {
			[PARENT.configArtifact]: {sha256: await sha256File(parentConfigPath), byteLength: (await lstat(parentConfigPath)).size},
			[PARENT.visibleLobeArtifact]: {sha256: await sha256File(parentCapturePath), byteLength: (await lstat(parentCapturePath)).size},
		};
		const fixtureArtifacts = {};
		for (const fixture of FIXTURE_INPUTS) {
			const sourcePath = await assertExistingRealPathContained(
				FIXTURES_ROOT,
				path.join(FIXTURES_ROOT, fixture.fileName),
				`${fixture.id} fixture`,
			);
			const sourceInfo = await lstat(sourcePath);
			requireCondition(sourceInfo.isFile() && !sourceInfo.isSymbolicLink(), `${fixture.id} fixture must be a real file.`);
			const artifactPath = `references/fixtures/${fixture.fileName}`;
			const bytes = await readFile(sourcePath);
			fixtureArtifacts[fixture.id] = {
				sourcePath: `scripts/extraterrestrial/fixtures/${fixture.fileName}`,
				artifactPath,
				sha256: await sha256File(sourcePath),
				byteLength: sourceInfo.size,
			};
			await run.writeArtifact(artifactPath, bytes);
		}
		await run.writeArtifact('references/000466-source-exposure-sunset-plus-one-hour.png', await readFile(parentCapturePath));
		await run.writeJsonArtifact('browser/config.json', {
			schemaId: 'san-jose-plus-one-hour-w27-horizon-trace-browser-config-v1',
			parent: PARENT,
			parentArtifacts,
			fixtureArtifacts,
			scene,
			trace: TRACE,
			w27RollDegrees: W27_ROLL_DEGREES,
		});
		await run.writeArtifact('browser/index.html', '<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">const target=document.querySelector("#result");try{const {runSanJosePlusOneHourHorizonTraceBrowser}=await import("/screen-palette/run-san-jose-plus-one-hour-horizon-trace-browser.js");target.textContent=JSON.stringify(await runSanJosePlusOneHourHorizonTraceBrowser());}catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>');
		server = await serve(run);
		browserProfilePath = await assertCreatablePathContained(
			OUTPUT_ROOT,
			path.join(OUTPUT_ROOT, 'browser-profiles', run.runId),
			'Chrome horizon-trace profile',
		);
		await mkdir(browserProfilePath, {recursive: true});
		let browser;
		try {
			browser = await executeFileAsync(CHROME_PATH, [
				'--headless=new', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader',
				'--disable-breakpad', '--disable-crash-reporter', '--disable-component-update',
				`--user-data-dir=${browserProfilePath}`,
				'--virtual-time-budget=2400000', '--dump-dom', server.url,
			], {timeout: 2700000, maxBuffer: 128 * 1024 * 1024, windowsHide: true});
		} catch (error) {
			await run.writeArtifact('browser/dom-on-failure.html', error.stdout ?? '');
			throw error;
		} finally {
			await removeBrowserProfile(browserProfilePath);
			browserProfilePath = null;
		}
		await run.writeArtifact('browser/dom.html', browser.stdout);
		await run.writeArtifact('browser/stderr.txt', browser.stderr);
		await run.writeJsonArtifact('browser/requests.json', server.requests);
		const resultText = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(browser.stdout)?.[1];
		requireCondition(resultText, 'Browser emitted no horizon-trace result.');
		const result = JSON.parse(resultText);
		if (result.error) throw new Error(`${result.error.name}: ${result.error.message}\n${result.error.stack ?? ''}`);
		const assertions = [];
		const assert = (condition, message) => { requireCondition(condition, message); assertions.push(message); };
		assert(result.schemaId === 'san-jose-plus-one-hour-horizon-path-radiance-roll-trace-v2', 'Browser returned the fixed roll-trace schema.');
		assert(JSON.stringify(result.inputArtifacts?.parent) === JSON.stringify(PARENT), 'Browser bound the exact verified parent-run identity from its generated configuration.');
		assert(JSON.stringify(result.inputArtifacts?.parentArtifacts) === JSON.stringify(parentArtifacts), 'Browser bound the exact parent-artifact byte identities from its generated configuration.');
		assert(JSON.stringify(result.inputArtifacts?.fixtureArtifacts) === JSON.stringify(fixtureArtifacts), 'Browser bound the exact copied runtime-fixture byte identities from its generated configuration.');
		assert(result.scene.id === 'sunset-plus-one-hour' && result.scene.timeIso === scene.timeIso, 'Browser traced the exact run-000466 plus-one-hour source state.');
		assert(result.rolls.map((roll) => roll.rollDegrees).join(',') === W27_ROLL_DEGREES.join(','), 'Fresh W27 roll traces completed in 0/45/90-degree order.');
		const expectedSampleCount = Math.round((TRACE.maximumOffsetDegrees - TRACE.minimumOffsetDegrees) / TRACE.stepDegrees) + 1;
		assert(result.rolls.every((roll) => roll.samples.length === expectedSampleCount), `Every W27 roll contains all ${expectedSampleCount} dense physical rays.`);
		const expectedRollRadians = [0, Math.PI / 4, Math.PI / 2];
		assert(result.rolls.every((roll, index) =>
			roll.mechanicalControls?.geometryDescription?.experimentalW27Frame?.policy === 'source-axis-roll-v1'
			&& Math.abs(roll.mechanicalControls.geometryDescription.experimentalW27Frame.radians - expectedRollRadians[index]) <= 1e-15), 'Every geometry advertises the exact contained 0/45/90-degree W27 frame policy.');
		assert(result.rolls.every((roll) => Array.isArray(roll.mechanicalControls.cacheModuleAudit) && roll.mechanicalControls.cacheModuleAudit.length > 0), 'Every fresh cache build exercised and recorded the rolled geometry module seam.');
		const baselineControls = result.rolls[0].mechanicalControls;
		assert(baselineControls.zeroRollCandidateParity?.geometryDescriptionSemanticEqual === true
			&& baselineControls.zeroRollCandidateParity.maximumLocalDirectionComponentDelta === 0
			&& baselineControls.zeroRollCandidateParity.maximumRoundTripDirectionComponentDelta === 0
			&& baselineControls.zeroRollCandidateParity.stencilIndexMismatchCount === 0
			&& baselineControls.zeroRollCandidateParity.maximumStencilWeightDelta === 0
			&& baselineControls.zeroRollCandidateParity.runtimeShaderSemanticSourceEqual === true, 'The zero-roll adapter is exactly candidate-equivalent in geometry, CPU direction/stencils, and runtime shader semantics.');
		assert(baselineControls.cacheModuleAudit.every((record) => record.candidateSemanticSourceEqual === true), 'Every zero-roll cache-construction module is semantically source-identical to the unadapted candidate module.');
		assert(result.rolls.slice(1).every((roll) => roll.mechanicalControls.zeroRollCandidateParity === null), 'Candidate-equivalence metadata is confined to the exact zero-roll control.');
		for (const identityKey of [
			'cacheDescriptorContentHash',
			'cacheConstructionGeometryIdentity',
			'cacheGeometryModuleSetHash',
			'runtimeDescriptorFingerprint',
			'geometryDescriptorFingerprint',
			'sourceAssemblyHash',
			'traceAssemblyHash',
		]) {
			const identities = result.rolls.map((roll) => roll.numerics[identityKey]);
			assert(identities.every((identity) => identity !== null && identity !== undefined), `Every roll records ${identityKey}.`);
			assert(new Set(identities.map((identity) => JSON.stringify(identity))).size === result.rolls.length, `${identityKey} distinguishes all three independently built W27 rolls.`);
		}
		assert(result.rolls.every((roll) => roll.webglErrors.length === 0), 'Every W27 roll completes without a WebGL error.');
		assert(result.rolls.every((roll) => roll.summary.faceTransitions.length >= 2), 'Every dense trace crosses at least two dominant W27 face boundaries.');
		assert(result.rolls.every((roll) => roll.sparseIntegration.length >= 7), 'Every roll includes boundary, gradient/lobe, center, and fixed CPU refinement probes.');
		assert(result.rolls.every((roll) => roll.sparseIntegration.every((probe) => probe.evaluations.map((entry) => entry.pathIntervalCount).join(',') === '15,40,160')), 'Every sparse probe records CPU Reference integrations at 15/40/160 intervals.');
		for (const roll of result.rolls) {
			assert(new Set(roll.sparseIntegration.map((probe) => probe.probeId)).size === roll.sparseIntegration.length, `The ${roll.rollDegrees}-degree roll has unique sparse-probe identities.`);
			const boundaryProbes = roll.sparseIntegration.filter((probe) => probe.boundaryEpsilonRadians !== null);
			assert(boundaryProbes.length === roll.summary.faceTransitions.length * 2, `The ${roll.rollDegrees}-degree roll has paired off-grid probes at every dense face crossing.`);
			const boundaryGroups = new Map();
			for (const probe of boundaryProbes) {
				const key = String(probe.boundaryOffsetDegrees);
				const group = boundaryGroups.get(key) ?? [];
				group.push(probe);
				boundaryGroups.set(key, group);
			}
			assert([...boundaryGroups.values()].every((probes) => probes.length === 2
				&& probes.map((probe) => probe.boundaryEpsilonRadians).sort((left, right) => left - right).join(',') === '-0.000001,0.000001'
				&& probes.every((probe) => probe.denseIndex === null
					&& Math.abs((probe.offsetDegrees - probe.boundaryOffsetDegrees) * Math.PI / 180 - probe.boundaryEpsilonRadians) <= 1e-15)), `The ${roll.rollDegrees}-degree face crossings each retain exact +/-1e-6-radian off-grid probes.`);
		}
		for (const roll of result.rolls) {
			const audit = roll.residentCumulativeW27SeamAudit;
			assert(audit?.schemaId === 'san-jose-plus-one-hour-packed-cumulative-r32f-w27-seam-audit-v1', `The ${roll.rollDegrees}-degree roll returned the packed resident-R32F W27 seam-audit schema.`);
			const fieldOrder = audit.fieldDescriptor.order?.value ?? audit.fieldDescriptor.order;
			assert(audit.fieldDescriptor.contentHash === audit.field.contentHash
				&& fieldOrder === 4
				&& audit.fieldStorage.width === 4374
				&& audit.fieldStorage.height === 48
				&& audit.fieldStorage.layers === 15, `The ${roll.rollDegrees}-degree seam audit is bound to that roll's live cumulative N4 W27/Native-48/native-15 field.`);
			assert(audit.readbackPlan.directionCount === 1200
				&& audit.readbackPlan.positionCount === 3
				&& audit.readbackPlan.wavelengthCount === 5
				&& audit.readbackPlan.scalarCount === 18000
				&& audit.readbackPlan.maximumScalarCount === 25000, `The ${roll.rollDegrees}-degree seam audit stayed on the declared 18,000-of-25,000 scalar readback plan.`);
			assert(audit.readbackPlan.positionIndices.join(',') === '0,23,47'
				&& audit.readbackPlan.wavelengthIndices.join(',') === '0,3,7,10,14', `The ${roll.rollDegrees}-degree seam audit used the fixed representative Native-48/native-15 axes.`);
			assert(audit.topology.counts.edgeGroupCount === 300
				&& audit.topology.counts.cornerGroupCount === 8
				&& audit.topology.counts.pairComparisonsPerPositionWavelength === 324
				&& audit.topology.checks.countsMatchContract === true, `The ${roll.rollDegrees}-degree audit retained the complete W27 duplicate-node topology.`);
			assert(audit.stencilSweep.anchorCount === 300
				&& audit.stencilSweep.sampleCount === 1800
				&& audit.stencilSweep.checks.allFaceSelectionsMatch === true, `The ${roll.rollDegrees}-degree audit retained every two-face epsilon stencil crossing.`);
			assert(audit.duplicateValues.pairComparisonCount === 324 * 3 * 5
				&& audit.boundaryInterpolation.sampleCount === 300 * 6 * 3 * 5, `The ${roll.rollDegrees}-degree audit evaluated every selected alias pair and one-sided epsilon sample.`);
			assert([
				audit.duplicateValues.maximumAbsoluteDifference,
				audit.duplicateValues.maximumRelativeDifference,
				audit.boundaryInterpolation.maximumAliasJump,
				audit.boundaryInterpolation.maximumSampledSideJump,
				audit.boundaryInterpolation.maximumRelativeSampledSideJump,
				audit.boundaryInterpolation.maximumAbsoluteSlopeJump,
			].every(Number.isFinite), `The ${roll.rollDegrees}-degree resident seam metrics are finite.`);
		}
		const finiteValues = result.rolls.every((roll) => roll.samples.every((sample) => [
			...sample.cpu.pathRadiance, ...sample.gpu.pathRadiance,
			...sample.cpu.signedLinearSrgb, ...sample.gpu.signedLinearSrgb,
			sample.cpu.photopicLuminanceCdPerSquareMeter,
			sample.gpu.photopicLuminanceCdPerSquareMeter,
		].every(Number.isFinite)));
		assert(finiteValues, 'Every CPU/GPU spectrum, signed linear RGB component, and photopic Y is finite.');
		for (const roll of result.rolls) {
			const positiveSamples = roll.samples.filter((sample) => sample.gpu.photopicLuminanceCdPerSquareMeter > 0);
			const maximumSpectralRadiance = Math.max(...roll.samples.flatMap((sample) => sample.gpu.pathRadiance.map(Math.abs)));
			assert(positiveSamples.length > 0 && maximumSpectralRadiance > 0, `The ${roll.rollDegrees}-degree roll contains nonzero finite physical path radiance and positive photopic luminance.`);
		}
		const sparseFinite = result.rolls.every((roll) => roll.sparseIntegration.every((probe) => probe.evaluations.every((evaluation) => [
			...evaluation.pathRadiance,
			...evaluation.signedLinearSrgb,
			evaluation.photopicLuminanceCdPerSquareMeter,
			evaluation.deltaFrom160.photopicLuminanceCdPerSquareMeter,
			evaluation.deltaFrom160.relativePhotopicLuminance,
			evaluation.deltaFrom160.maximumAbsoluteSpectral,
		].every(Number.isFinite))));
		assert(sparseFinite, 'Every sparse 15/40/160 spectrum, RGB/Y projection, and refinement delta is finite.');
		const parityFailures = result.rolls.flatMap((roll) => roll.samples.flatMap((sample) => sample.cpu.pathRadiance.map((cpuValue, channelIndex) => ({
			rollDegrees: roll.rollDegrees,
			offsetDegrees: sample.offsetDegrees,
			channelIndex,
			cpuValue,
			gpuValue: sample.gpu.pathRadiance[channelIndex],
			allowed: 5e-7 + 1e-4 * Math.abs(cpuValue),
			residual: Math.abs(cpuValue - sample.gpu.pathRadiance[channelIndex]),
		})).filter((entry) => entry.residual > entry.allowed)));
		assert(parityFailures.length === 0, `Live GPU pre-Color path radiance agrees with CPU Reference over the same R32F cache (${parityFailures.length} failures).`);
		assert(Array.isArray(result.rollComparisons) && result.rollComparisons.map((comparison) => comparison.rollDegrees).join(',') === '45,90', 'Browser returned exactly the 45/90-degree comparisons against zero roll.');
		assert(result.rollComparisons.every((comparison) => Array.isArray(comparison.samples) && comparison.samples.length === expectedSampleCount), `Every roll comparison contains all ${expectedSampleCount} physical rays.`);
		const finiteRollComparisons = result.rollComparisons.every((comparison) => comparison.samples.every((sample) => [
			sample.index,
			sample.offsetDegrees,
			sample.physicalDirectionDeltaNorm,
			sample.photopicLuminanceDeltaCdPerSquareMeter,
			sample.relativePhotopicLuminanceDelta,
			sample.log10PhotopicLuminanceRatio,
		].every(Number.isFinite)));
		assert(finiteRollComparisons, 'Every same-ray W27 roll comparison value is finite.');
		assert(result.rollComparisons.every((comparison) => comparison.samples.every((sample) => sample.physicalDirectionDeltaNorm === 0)), 'All W27 rolls trace bit-identical physical model directions.');
		const quarterTurn = result.quarterTurnCubeSymmetry;
		assert(quarterTurn?.policy === 'cubed-sphere-quarter-turn-coordinate-permutation-v1'
			&& quarterTurn.sampleCount === expectedSampleCount, 'Browser returned the fixed +90-degree cube-coordinate symmetry control over every dense ray.');
		assert([
			quarterTurn.maximumLocalCoordinateComponentDelta,
			quarterTurn.maximumStencilWeightDelta,
		].every(Number.isFinite), 'The +90-degree cube-coordinate and stencil-weight deltas are finite.');
		assert(quarterTurn.maximumLocalCoordinateComponentDelta <= 1e-12
			&& quarterTurn.stencilTapCountMismatchCount === 0
			&& quarterTurn.physicalNodeKeyMismatchCount === 0
			&& quarterTurn.maximumStencilWeightDelta <= 1e-12, 'The +90-degree roll preserves the exact cube-coordinate/tap support permutation within binary64 stencil tolerance.');
		const storedAddressPermutation = quarterTurn.storedAddressPermutation;
		assert(storedAddressPermutation?.policy === 'canonical-cubed-sphere-w27-exact-quarter-turn-address-permutation-v1'
			&& storedAddressPermutation.storedAddressCount === 4374
			&& storedAddressPermutation.uniqueTargetAddressCount === 4374
			&& storedAddressPermutation.addressBijection === true
			&& storedAddressPermutation.fourthPowerMismatchCount === 0
			&& storedAddressPermutation.faceCoordinateMap.length === 6, 'The +90-degree control is an exact bijection over all 4,374 stored W27 addresses and satisfies P^4 = identity.');
		assert(Number.isFinite(storedAddressPermutation.maximumRotatedUnitVectorComponentDelta)
			&& storedAddressPermutation.maximumRotatedUnitVectorComponentDelta <= Number.EPSILON, 'The full-domain +90-degree stored-node permutation preserves physical directions within one binary64 epsilon.');
		for (const fixture of FIXTURE_INPUTS) {
			const evidence = fixtureArtifacts[fixture.id];
			const sourcePath = path.join(FIXTURES_ROOT, fixture.fileName);
			const copiedPath = path.join(run.runDirectory, ...evidence.artifactPath.split('/'));
			assert(await sha256File(sourcePath) === evidence.sha256, `${fixture.id} fixture remains byte-identical throughout execution.`);
			assert(await sha256File(copiedPath) === evidence.sha256, `${fixture.id} copied fixture is byte-identical to its runtime input.`);
			assert(server.requests.includes(`/fixtures/${fixture.fileName}`), `${fixture.id} runtime fixture was requested by the browser.`);
		}
		const copiedCapturePath = path.join(run.runDirectory, 'references', '000466-source-exposure-sunset-plus-one-hour.png');
		assert(await sha256File(copiedCapturePath) === parentArtifacts[PARENT.visibleLobeArtifact].sha256, 'The copied +1 h lobe capture is byte-identical to verified run 000466.');
		const analysis = analyze(result);
		await run.writeJsonArtifact('evidence/horizon-trace.json', {
			proofId: 'san-jose-plus-one-hour-w27-horizon-trace-v1',
			parent: {...PARENT, verification: parentVerification, artifacts: parentArtifacts},
			fixtures: fixtureArtifacts,
			result,
			analysis,
			assertions,
		});
		await run.writeArtifact('evidence/horizon-trace.csv', traceCsv(result));
		await run.writeArtifact('evidence/path-interval-refinement.csv', sparseCsv(result));
		await run.writeArtifact('figures/horizon-radiance-by-roll.svg', diagnosticSvg(result));
		const closureAfter = await buildImplementationClosure();
		const [implementationClosureAfter, experimentPackageInventoryAfter, threeDependencyInventoryAfter] = await Promise.all([
			describeImplementationClosure(closureAfter),
			createSelectedFileInventory(EXPERIMENT_ROOT, ['package.json', 'package-lock.json']),
			createFileInventory(THREE_ROOT),
		]);
		assert(JSON.stringify(implementationClosureAfter) === JSON.stringify(implementationClosure), 'The complete executed implementation module closure remains byte-identical throughout the run.');
		assertFileInventoriesEqual(experimentPackageInventory, experimentPackageInventoryAfter, 'Experiment package manifest/lock inventory');
		assertFileInventoriesEqual(threeDependencyInventory, threeDependencyInventoryAfter, 'Installed Three dependency inventory');
		assert(await sha256File(CHROME_PATH) === chromeIdentity.sha256, 'The Chrome executable remains byte-identical throughout the run.');
		const productionAfter = await inventoryProduction();
		assertFileInventoriesEqual(productionBefore.algorithm32, productionAfter.algorithm32, 'Algorithm32 production inventory');
		assertFileInventoriesEqual(productionBefore.flat32, productionAfter.flat32, 'Flat32 production inventory');
		const proof = {
			proofId: 'san-jose-plus-one-hour-w27-horizon-trace-v1',
			accepted: true,
			parent: {...PARENT, verification: parentVerification, artifacts: parentArtifacts},
			fixtures: fixtureArtifacts,
			tooling: toolingSummary,
			analysis,
			assertions,
			artifacts: {
				trace: 'evidence/horizon-trace.json',
				csv: 'evidence/horizon-trace.csv',
				pathIntervalRefinement: 'evidence/path-interval-refinement.csv',
				figure: 'figures/horizon-radiance-by-roll.svg',
				visibleLobe: 'references/000466-source-exposure-sunset-plus-one-hour.png',
				fixtureInputs: Object.fromEntries(FIXTURE_INPUTS.map((fixture) => [fixture.id, fixtureArtifacts[fixture.id].artifactPath])),
				implementationClosure: 'evidence/implementation-closure.json',
				tooling: 'evidence/tooling.json',
			},
			containment: {
				algorithm32FileCount: productionAfter.algorithm32.fileCount,
				flat32FileCount: productionAfter.flat32.fileCount,
				moduleClosureFileCount: closureBefore.files.length,
				moduleClosureEdgeCount: closureBefore.edges.length,
			},
		};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const finalManifest = await run.finalize({
			conclusion: 'accepted',
			result: {proofId: proof.proofId, accepted: true, artifacts: proof.artifacts, analysis},
			report: report(run.runId, analysis, assertions),
		});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: finalManifest.artifactSetSha256, artifacts: proof.artifacts, analysis}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const finalManifest = await run.finalize({
				conclusion: 'failed',
				result: {proofId: 'san-jose-plus-one-hour-w27-horizon-trace-v1', accepted: false, error: detail},
				report: `# ${run.runId}: San Jose +1 h W27 horizon trace\n\nConclusion: **failed**.\n\n${detail.message}\n`,
			});
			process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: finalManifest.artifactSetSha256, error: detail}, null, 2)}\n`);
		} catch (finalizationError) {
			process.stderr.write(`${JSON.stringify({conclusion: 'unsealed-failure', error: detail, finalizationError: String(finalizationError)}, null, 2)}\n`);
		}
		process.exitCode = 1;
	} finally {
		await server?.close().catch(() => {});
		if (browserProfilePath) await removeBrowserProfile(browserProfilePath).catch(() => {});
	}
}

await main();
