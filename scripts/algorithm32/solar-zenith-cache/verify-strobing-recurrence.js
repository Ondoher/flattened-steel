import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import Files from './DistantSunSharedCacheGenerationFiles.js';
import Compiler from './DistantSunSceneCacheOfflineCompiler.js';
import Reference from './DistantSunBinary64Reference.js';
import {DistantSunSceneCacheCompilerInputs as Inputs} from './DistantSunSceneCacheCompilerInputs.js';
import {DistantSunPointLocalProfileCompilerInputs as ProfileInputs} from './DistantSunPointLocalProfileCompilerInputs.js';
import {DistantSunSceneCacheNumerics} from './DistantSunSceneCacheNumerics.js';
import {createBrunetonProductionProfile} from '../../experiments/b1-directional-sky-radiance/production-profile.js';

assert.ok(
	process.argv.length === 2 || (process.argv.length === 3 && ['--smoke', '--screen'].includes(process.argv[2])),
	'Usage: verify-strobing-recurrence.js [--smoke|--screen]',
);
const smoke = process.argv.includes('--smoke');
const screen = process.argv.includes('--screen');
const repository = fileURLToPath(new URL('../../../', import.meta.url)),
	files = new Files(repository);
const run = `tmp/production-algorithm32/distant-sun-strobing-promotion/recurrence-${randomUUID()}`;
await files.directory(run);
const numericalPolicy = DistantSunSceneCacheNumerics.createAnchoredRadial();
const profiles = [
	Inputs.createInputSet(Inputs.createQualifiedSanJoseNauticalScene(), {numericalPolicy}),
	ProfileInputs.createInputSet(
		createBrunetonProductionProfile({
			time: '10:15',
			fittedAzimuthDegrees: 98.59994923191232,
			maximumScatteringOrder: 4,
		}),
		{numericalPolicy},
	),
];
const probes = [];
for (const position of smoke ? [0] : [0, 1, 2])
	for (const zenith of smoke ? [90] : [0, 29, 30, 59, 60, 79, 80, 88, 89, 90, 91, 95, 96, 107])
		for (const direction of smoke ? [3280] : [364, 1093, 1822, 2551, 3280, 4009, 337, 391])
			probes.push({
				position,
				zenith,
				direction,
				x: direction,
				y: zenith * 48 + position,
				label: `${position}:${zenith}:${direction}`,
			});
const requests = [];
for (const [profileIndex, profile] of profiles.entries())
	for (let channel = 0; channel < profile.buildRequest.transportSpec.domains.spectrum.channels.length; channel++)
		if ((!smoke && !screen) || (profileIndex === 0 && channel === 7))
			requests.push({profileIndex, channel, buildRequest: profile.buildRequest, coordinates: probes});
const artifacts = [];
const write = async (name, value) => {
	const artifact = await files.write(
		`${run}/${name}`,
		Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`),
	);
	artifacts.push(artifact);
	return artifact;
};
const sources = [];
for (const name of [
	'verify-strobing-recurrence.js',
	'runRecurrenceProofBrowser.js',
	'DistantSunBinary64Reference.js',
	'DistantSunSceneCacheGpuCompiler.js',
	'DistantSunSceneCacheNumerics.js',
	'DistantSunSceneCacheCompilerInputs.js',
	'DistantSunPointLocalProfileCompilerInputs.js',
]) {
	const source = `scripts/algorithm32/solar-zenith-cache/${name}`,
		bytes = await files.read(source);
	sources.push({path: source, byteLength: bytes.length, sha256: files.hash(bytes)});
}
const heartbeat = setInterval(
	() => process.stdout.write(`${JSON.stringify({run, phase: 'recurrence-proof'})}\n`),
	25000,
);
try {
	await write('definition.json', {
		smoke,
		requests,
		sources,
		operation:
			'Independent binary64 memoized N1/L1/N2/L2/N3/L3/N4 dependency evaluation versus production R32F pure fields; cumulative N4 compared after ordered accumulation',
		tolerance: {absolute: 1e-10, relative: 0.01},
		units: 'W m^-3 sr^-1 nm^-1',
	});
	const execution = await new Compiler({
		chromePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
	}).compileLayers({
		outputDirectory: path.join(repository, run, 'browser'),
		control: {requests},
		browserModulePath: '/repository/scripts/algorithm32/solar-zenith-cache/runRecurrenceProofBrowser.js',
		layerCount: requests.length,
	});
	await write('gpu-execution.json', execution.browserExecution);
	const summaries = [];
	for (const [requestIndex, request] of requests.entries()) {
		const gpu = execution.layers[requestIndex];
		await write(`gpu-${requestIndex}.f32`, gpu);
		const reference = new Reference(request.buildRequest, request.channel, (event) =>
			process.stdout.write(`${JSON.stringify({run, requestIndex, ...event})}\n`),
		);
		const comparisons = [];
		let failures = 0,
			maximumRatio = 0,
			worst;
		for (const [probeIndex, probe] of probes.entries()) {
			let cumulativeActual = 0,
				cumulativeReference = 0;
			for (let order = 1; order <= 5; order++) {
				const actual =
					order === 5 ? cumulativeActual : gpu.readFloatLE(((order - 1) * probes.length + probeIndex) * 4);
				const expected =
					order === 5
						? cumulativeReference
						: reference.density(order, probe.position, probe.zenith, probe.direction);
				if (order <= 4) {
					cumulativeActual = Math.fround(cumulativeActual + actual);
					cumulativeReference += expected;
				}
				const error = Math.abs(actual - expected),
					limit = 1e-10 + 0.01 * Math.abs(expected);
				const pass =
					Number.isFinite(actual) &&
					actual >= 0 &&
					Number.isFinite(expected) &&
					expected >= 0 &&
					error <= limit;
				const comparison = {
					probeIndex,
					order: order === 5 ? 'cumulativeN4' : order,
					actual,
					reference: expected,
					error,
					limit,
					pass,
				};
				comparisons.push(comparison);
				if (!pass) failures++;
				if (error / limit > maximumRatio) {
					maximumRatio = error / limit;
					worst = comparison;
				}
			}
		}
		await write(`comparisons-${requestIndex}.json`, comparisons);
		summaries.push({
			profileIndex: request.profileIndex,
			channel: request.channel,
			failures,
			maximumRatio,
			worst,
			evaluations: reference.evaluations,
		});
		process.stdout.write(`${JSON.stringify(summaries.at(-1))}\n`);
	}
	for (const source of sources) await files.read(source.path, source);
	const accepted = summaries.every((summary) => summary.failures === 0);
	await write('result.json', {
		accepted,
		smoke,
		screen,
		summaries,
		sources,
		tools: {node: process.version},
		limitations: ['Discrete field coordinates; off-node lookup and full B1 view remain separate qualification.'],
	});
	await files.write(`${run}/sealed.json`, Buffer.from(`${JSON.stringify({accepted, artifacts})}\n`));
	process.stdout.write(`${JSON.stringify({run, accepted, smoke})}\n`);
	if (!accepted) process.exitCode = 1;
} catch (error) {
	await write('failure.json', {error: String(error)});
	await files.write(`${run}/sealed.json`, Buffer.from(`${JSON.stringify({accepted: false, artifacts})}\n`));
	throw error;
} finally {
	clearInterval(heartbeat);
}
