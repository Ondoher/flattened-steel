import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import Files from './DistantSunSharedCacheGenerationFiles.js';
import Compiler from './DistantSunSceneCacheOfflineCompiler.js';
import Reference from './DistantSunBinary64Reference.js';
import {DistantSunSceneCacheCompilerInputs as Inputs} from './DistantSunSceneCacheCompilerInputs.js';
import {DistantSunSceneCacheNumerics} from './DistantSunSceneCacheNumerics.js';
const repository = fileURLToPath(new URL('../../../', import.meta.url)),
	files = new Files(repository);
const run = `tmp/production-algorithm32/distant-sun-strobing-promotion/radiance-${randomUUID()}`;
await files.directory(run);
const input = Inputs.createInputSet(Inputs.createQualifiedSanJoseNauticalScene(), {
	numericalPolicy: DistantSunSceneCacheNumerics.createAnchoredRadial(),
});
const order = Number(process.argv[2] ?? 1);
if (![0, 1, 2, 3].includes(order)) throw new Error('Expected density diagnostic 0 or pure radiance order 1, 2, or 3.');
const probes = [];
const field = order === 0 ? 'J2' : `L${order}`;
if (order === 0) {
	const collector = new Reference(input.buildRequest, 7),
		coordinates = new Map();
	collector.density = (_order, position, zenith, direction) => {
		const label = `${position}:${zenith}:${direction}`;
		coordinates.set(label, {position, zenith, incoming: direction, x: direction, y: zenith * 48 + position, label});
		return 0;
	};
	collector.radiance(2, 0, 89, 34);
	probes.push(...coordinates.values());
} else
	for (let position = 0; position < (order === 1 ? 48 : 1); position++)
		for (let zenith = order === 1 ? 0 : 89; zenith <= (order === 1 ? 179 : 89); zenith++)
			for (let incoming = 0; incoming < 68; incoming++)
				probes.push({
					position,
					zenith,
					incoming,
					x: incoming,
					y: zenith * 48 + position,
					label: `${position}:${zenith}:${incoming}`,
				});
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
	'diagnose-strobing-radiance.js',
	'runRecurrenceProofBrowser.js',
	'DistantSunBinary64Reference.js',
	'DistantSunSceneCacheGpuCompiler.js',
]) {
	const namePath = `scripts/algorithm32/solar-zenith-cache/${name}`,
		bytes = await files.read(namePath);
	sources.push({path: namePath, byteLength: bytes.length, sha256: files.hash(bytes)});
}
const heartbeat = setInterval(
	() => process.stdout.write(`${JSON.stringify({run, phase: 'direct-radiance-diagnosis'})}\n`),
	25000,
);
try {
	await write('definition.json', {
		input,
		probes,
		sources,
		channel: 7,
		fields: [field],
		operation: 'Independent binary64 recurrence compared to production at the declared probes.',
	});
	const execution = await new Compiler({
		chromePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
	}).compileLayers({
		outputDirectory: path.join(repository, run, 'browser'),
		control: {requests: [{buildRequest: input.buildRequest, channel: 7, fields: [field], coordinates: probes}]},
		browserModulePath: '/repository/scripts/algorithm32/solar-zenith-cache/runRecurrenceProofBrowser.js',
		layerCount: 1,
	});
	await write('gpu.f32', execution.layers[0]);
	const reference = new Reference(input.buildRequest, 7, (event) =>
		process.stdout.write(`${JSON.stringify({run, ...event})}\n`),
	);
	const comparisons = [];
	for (const [index, probe] of probes.entries()) {
		const actual = execution.layers[0].readFloatLE(index * 4),
			expected =
				order === 0
					? reference.density(2, probe.position, probe.zenith, probe.incoming)
					: reference.radiance(order, probe.position, probe.zenith, probe.incoming),
			error = Math.abs(actual - expected),
			limit = (order === 0 ? 1e-10 : 1e-8) + 0.01 * Math.abs(expected);
		comparisons.push({...probe, actual, reference: expected, error, limit, ratio: error / limit});
	}
	await write('comparisons.json', comparisons);
	const worst = [...comparisons].sort((a, b) => b.ratio - a.ratio).slice(0, 30);
	await write('result.json', {
		accepted: worst[0].ratio <= 1,
		worst,
		failures: comparisons.filter((value) => value.ratio > 1).length,
		sources,
	});
	for (const source of sources) await files.read(source.path, source);
	await files.write(
		`${run}/sealed.json`,
		Buffer.from(`${JSON.stringify({accepted: worst[0].ratio <= 1, artifacts})}\n`),
	);
	process.stdout.write(`${JSON.stringify({run, worst: worst.slice(0, 5)})}\n`);
} catch (error) {
	await write('failure.json', {error: String(error)});
	await files.write(`${run}/sealed.json`, Buffer.from(`${JSON.stringify({accepted: false, artifacts})}\n`));
	throw error;
} finally {
	clearInterval(heartbeat);
}
