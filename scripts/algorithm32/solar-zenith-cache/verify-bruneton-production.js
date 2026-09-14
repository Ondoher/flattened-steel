import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdir, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createBrunetonProductionProfile} from '../../experiments/b1-directional-sky-radiance/production-profile.js';
import * as benchmark from '../../experiments/b1-directional-sky-radiance/benchmark.js';
import * as figures from '../../experiments/b1-directional-sky-radiance/figure5.js';
import DistantSunSharedCacheGenerator from './DistantSunSharedCacheGenerator.js';
import DistantSunSharedCacheGenerationFiles from './DistantSunSharedCacheGenerationFiles.js';
import DistantSunPointLocalCacheReader from './DistantSunPointLocalCacheReader.js';
import {DistantSunPointLocalProfileCompilerInputs} from './DistantSunPointLocalProfileCompilerInputs.js';
import DistantSunBrunetonView from './DistantSunBrunetonView.js';
import {DistantSunSceneCacheNumerics} from './DistantSunSceneCacheNumerics.js';
import {
	SHARED_COMPILER_SOURCE_NAMES,
	SHARED_GENERATION_SOURCE_ROOT,
	DISTANT_SUN_POINT_LOCAL_CACHE_OUTPUT_ROOT,
} from './consts.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const files = new DistantSunSharedCacheGenerationFiles(repositoryRoot);
const outputRoot = `${DISTANT_SUN_POINT_LOCAL_CACHE_OUTPUT_ROOT}/bruneton-${randomUUID()}`;
const parents = [];
const artifacts = [];
const cancellation = new AbortController();
const argumentsList = process.argv.slice(2);
const usage =
	'Usage: verify-bruneton-production.js [--surface-limit 2|4|8 | --numerical-policy anchored-radial] [--solar-interpolation linear|monotone-cubic]';
assert.equal(argumentsList.length % 2, 0, usage);
const options = new Map();
for (let index = 0; index < argumentsList.length; index += 2) {
	const flag = argumentsList[index];
	assert.ok(
		['--surface-limit', '--numerical-policy', '--solar-interpolation'].includes(flag) && !options.has(flag),
		usage,
	);
	options.set(flag, argumentsList[index + 1]);
}
assert.ok(!options.has('--surface-limit') || !options.has('--numerical-policy'), usage);
assert.ok(!options.has('--numerical-policy') || options.get('--numerical-policy') === 'anchored-radial', usage);
const solarInterpolation = options.get('--solar-interpolation') ?? 'linear';
assert.ok(['linear', 'monotone-cubic'].includes(solarInterpolation), usage);
const numericalPolicy = options.has('--numerical-policy')
	? DistantSunSceneCacheNumerics.createAnchoredRadial()
	: options.has('--surface-limit')
		? DistantSunSceneCacheNumerics.createSurfaceLimit(Number(options.get('--surface-limit')))
		: undefined;
const candidateMode = numericalPolicy !== undefined || solarInterpolation === 'monotone-cubic';
const interrupt = () => cancellation.abort(new Error('Production Bruneton qualification interrupted.'));

/** Authenticate an input and retain its exact consumed identity in the derivation record. */
async function readInput(relativePath, expected = null, maximumBytes = 16 * 1024 * 1024) {
	const bytes = await files.read(relativePath, expected, maximumBytes);
	parents.push({path: relativePath, byteLength: bytes.byteLength, sha256: files.hash(bytes)});
	return bytes;
}

/** Write one new qualification artifact without replacing an existing file. */
async function writeArtifact(name, value) {
	const bytes = Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`);
	const artifact = await files.write(`${outputRoot}/${name}`, bytes);
	artifacts.push(artifact);
	return artifact;
}

/** Snapshot the static local implementation closure, including browser-only compiler owners. */
async function snapshotSources() {
	const queue = [
		'scripts/algorithm32/solar-zenith-cache/verify-bruneton-production.js',
		...SHARED_COMPILER_SOURCE_NAMES.map((name) => `${SHARED_GENERATION_SOURCE_ROOT}/${name}`),
	];
	const seen = new Set();
	const sources = [];
	while (queue.length) {
		const sourcePath = queue.shift();
		if (seen.has(sourcePath)) continue;
		assert.ok(
			!sourcePath.startsWith('experiments/'),
			'Production proof must not import contained experiment code.',
		);
		seen.add(sourcePath);
		const bytes = await readInput(sourcePath);
		const name = `sources/${sourcePath}.txt`;
		await files.directory(`${outputRoot}/${path.posix.dirname(name)}`);
		const copy = await writeArtifact(name, bytes);
		sources.push({path: sourcePath, byteLength: bytes.byteLength, sha256: copy.sha256, snapshot: copy});
		for (const match of bytes
			.toString('utf8')
			.matchAll(/(?:import|export)\s+(?:[^'";]+?\s+from\s*)?['"]([^'"]+)['"]/gu)) {
			if (match[1].startsWith('.'))
				queue.push(path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), match[1])));
		}
	}
	await readInput('package-lock.json');
	return sources;
}

/** Resolve every dataset entry before the benchmark's synchronous loader opens it. */
async function validateDatasetTree(directory) {
	const absolute = await files.resolve(directory);
	for (const entry of await readdir(absolute, {withFileTypes: true})) {
		const relativePath = `${directory}/${entry.name}`;
		await files.resolve(relativePath);
		if (entry.isDirectory()) await validateDatasetTree(relativePath);
		else {
			assert.ok(entry.isFile(), 'Benchmark data must consist of ordinary files.');
			await readInput(relativePath);
		}
	}
}

/** Compare every finite nonnegative Direct40 radiance against historical Float32 regression evidence. */
function compareRadiances(candidate, target, scenes) {
	assert.equal(candidate.size, 17);
	assert.equal(target.size, 17);
	let count = 0;
	let squares = 0;
	let maximumAbsoluteWatts = 0;
	let worst = null;
	const deltas = [];
	for (const scene of scenes)
		for (let gridX = 0; gridX < 9; gridX++)
			for (let gridY = 0; gridY < 9; gridY++) {
				const actualSpectrum = candidate.get(scene.time)[gridX][gridY];
				const targetSpectrum = target.get(scene.time)[gridX][gridY];
				assert.equal(actualSpectrum.length, 40);
				assert.equal(targetSpectrum.length, 40);
				for (let channel = 0; channel < 40; channel++) {
					const actual = actualSpectrum[channel];
					const expected = targetSpectrum[channel];
					assert.ok(Number.isFinite(actual) && actual >= 0 && Number.isFinite(expected) && expected >= 0);
					const delta = actual - expected;
					deltas.push({time: scene.time, gridX, gridY, channel, actual, expected, delta});
					count++;
					squares += delta * delta;
					if (Math.abs(delta) > maximumAbsoluteWatts) {
						maximumAbsoluteWatts = Math.abs(delta);
						worst = {time: scene.time, gridX, gridY, channel, actual, expected, delta};
					}
				}
			}
	assert.equal(count, 55080);
	return {
		comparedValues: count,
		maximumAbsoluteWatts,
		rmsWatts: Math.sqrt(squares / count),
		worst,
		deltas,
		role: 'historical-float32-regression-comparison; not an independent physical oracle',
	};
}

await files.directory(DISTANT_SUN_POINT_LOCAL_CACHE_OUTPUT_ROOT);
await mkdir(path.join(await files.resolve(DISTANT_SUN_POINT_LOCAL_CACHE_OUTPUT_ROOT), path.posix.basename(outputRoot)));
await files.resolve(outputRoot);
process.once('SIGINT', interrupt);
process.once('SIGTERM', interrupt);
try {
	const sources = await snapshotSources();
	const verifierPath = 'tmp/experiments/point-local-cache-builder/00011-verify/sealed.json';
	const verifier = JSON.parse(
		(
			await readInput(verifierPath, {
				byteLength: 74180,
				sha256: '8768021c5d4cfa5878e604893ae10839ee4e101c0e57347936164c0f03746479',
			})
		).toString(),
	);
	assert.equal(verifier.state, 'accepted');
	const authenticated = async (relativePath) => {
		const identity = verifier.parents.find((parent) => parent.path === relativePath);
		assert.ok(identity, `Missing accepted experimental identity: ${relativePath}`);
		return readInput(relativePath, identity);
	};
	const pins = JSON.parse(
		(await authenticated('tmp/experiments/point-local-cache-builder/00000-profiles/profiles.json')).toString(),
	);
	const optimized = JSON.parse(
		(await authenticated('tmp/experiments/point-local-cache-builder/00003-bruneton/cache.json')).toString(),
	);
	const optimizedTablePath = 'tmp/experiments/point-local-cache-builder/00006-b1-qualification/b1.tsv';
	await authenticated(optimizedTablePath);
	const targetPath =
		'tmp/extraterrestrial/color-reset/runs/000065-color-reset-qualification/data/b1-point-local-direct40-w27-q30.tsv';
	const targetBytes = await readInput(targetPath);
	assert.equal(files.hash(targetBytes), 'e6d62e23ec0184cc9941e8305d4ea9e69691cf996d5bce8523afb641830ce634');
	assert.equal(pins.viewIntegration.intervalCount, 30);
	assert.equal(pins.viewIntegration.distribution, 'quadratic-near-observer');
	assert.deepEqual(pins.acceptance.bruneton, {
		allChannelMaximumAbsoluteWatts: 2e-7,
		allChannelRmsWatts: 5e-8,
		scoreDifferenceMilliwatts: 0.001,
	});
	const profiles = pins.scenes.map((scene) =>
		createBrunetonProductionProfile({
			time: scene.time,
			fittedAzimuthDegrees: scene.fittedAzimuthDegrees,
			maximumScatteringOrder: 4,
		}),
	);
	const input = DistantSunPointLocalProfileCompilerInputs.createBatch(profiles, {
		numericalPolicy,
		solarInterpolation,
		ids: pins.scenes.map((scene) => scene.id),
	});
	await writeArtifact('definition.json', {
		operation:
			'fresh production GPU compilation, encoded package decode, binary64 Q30 arithmetic over Float32 cache values and historical run-65 regression comparison',
		solarInterpolation,
		candidateMode,
		candidateAcceptance: candidateMode
			? {finiteNonnegativeRadiance: true, b1RmseCeilingMilliwatts: 11.820391604126252}
			: null,
		physicalAcceptance: 'Independent binary64 physical-field qualification is a separate required promotion gate.',
		input,
		scenes: pins.scenes,
		viewIntegration: pins.viewIntegration,
		limits: pins.acceptance.bruneton,
		sources,
	});
	const generated = await new DistantSunSharedCacheGenerator({
		chromePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
	}).compile({
		...input,
		scenes: [...input.scenes],
		wavelengths: [...input.wavelengths],
		outputDirectory: `${outputRoot}/compilation`,
		signal: cancellation.signal,
		onProgress: async (event) => {
			await files.progress(`${outputRoot}/progress.json`, event);
			process.stdout.write(`${JSON.stringify(event)}\n`);
		},
	});
	const packet = JSON.parse((await readInput(generated.manifest.path, generated.manifest)).toString());
	assert.equal(generated.accepted, true);
	assert.equal(generated.sceneCount, 17);
	assert.equal(generated.channelCount, 40);
	const topologyExact =
		JSON.stringify(packet.coordinates) === JSON.stringify(optimized.coordinates) &&
		JSON.stringify(packet.scenes.map((scene) => scene.indexes)) ===
			JSON.stringify(optimized.scenes.map((scene) => scene.indexes)) &&
		JSON.stringify(packet.blocks.map((block) => block.coordinates)) ===
			JSON.stringify(optimized.blocks.map((block) => block.coordinates));
	if (solarInterpolation === 'linear') {
		assert.equal(generated.coordinateCount, 1951);
		assert.equal(generated.blockCount, 96);
		assert.deepEqual(packet.coordinates, optimized.coordinates);
		assert.deepEqual(
			packet.scenes.map((scene) => scene.indexes),
			optimized.scenes.map((scene) => scene.indexes),
		);
		assert.deepEqual(
			packet.blocks.map((block) => block.coordinates),
			optimized.blocks.map((block) => block.coordinates),
		);
	}
	const decodedBlocksExact =
		topologyExact &&
		packet.blocks.every(
			(block, ordinal) =>
				block.decoded.sha256 === optimized.blocks[ordinal].decodedSha256 &&
				block.decoded.byteLength === optimized.blocks[ordinal].decodedBytes,
		);
	const encodedBlocksExact =
		topologyExact &&
		packet.blocks.every(
			(block, ordinal) =>
				block.encoded.sha256 === optimized.blocks[ordinal].artifact.sha256 &&
				block.encoded.byteLength === optimized.blocks[ordinal].artifact.byteLength,
		);
	const reader = new DistantSunPointLocalCacheReader();
	await reader.prepare(files, packet, `${outputRoot}/decoded`);
	const directions = await reader.readDirectionMap(files, packet);
	assert.equal(files.hash(directions), optimized.directionMap.sha256);
	const view = new DistantSunBrunetonView();
	const samples = view.prepare(packet, pins.scenes);
	const spectra = packet.scenes.map(() => Array.from({length: 81}, () => Array(40).fill(0)));
	for (let channel = 0; channel < 40; channel++) {
		cancellation.signal.throwIfAborted();
		const unique = await reader.readChannel(files, packet, channel);
		const sharedValues =
			solarInterpolation === 'monotone-cubic'
				? new Float32Array(unique.buffer, unique.byteOffset, unique.byteLength / Float32Array.BYTES_PER_ELEMENT)
				: null;
		for (let scene = 0; scene < 17; scene++) {
			const values = sharedValues ?? reader.expand(files, packet, scene, unique, directions);
			for (let direction = 0; direction < 81; direction++)
				spectra[scene][direction][channel] = view.integrate(
					values,
					samples[scene][direction],
					packet.buildRequest,
					channel,
				);
		}
		const event = {phase: 'production-b1-view', completed: channel + 1, total: 40};
		await files.progress(`${outputRoot}/progress.json`, event);
		process.stdout.write(`${JSON.stringify(event)}\n`);
	}
	const lines = [
		[
			'model',
			'time',
			'grid_x',
			'grid_y',
			...packet.buildRequest.transportSpec.domains.spectrum.channels.map((channel) => channel.centerNanometers),
		].join('\t'),
	];
	pins.scenes.forEach((scene, ordinal) =>
		spectra[ordinal].forEach((values, direction) =>
			lines.push(['production', scene.time, Math.floor(direction / 9), direction % 9, ...values].join('\t')),
		),
	);
	const table = await writeArtifact('b1.tsv', Buffer.from(lines.join('\n') + '\n'));
	const datasetPath = path.relative(repositoryRoot, benchmark.KIDER_ROOT).split(path.sep).join('/');
	await validateDatasetTree(datasetPath);
	const dataset = benchmark.loadKiderDataset(await files.resolve(datasetPath));
	assert.equal(dataset.rawAcquisitionSha256, benchmark.EXPECTED_DATASET_FINGERPRINTS.rawAcquisitionSha256);
	assert.equal(dataset.processedGridSha256, benchmark.EXPECTED_DATASET_FINGERPRINTS.processedGridSha256);
	const candidateModels = benchmark.parseSpectraTsv(await files.resolve(table.path));
	const targetModels = benchmark.parseSpectraTsv(await files.resolve(targetPath));
	const optimizedModels = benchmark.parseSpectraTsv(await files.resolve(optimizedTablePath));
	assert.equal(candidateModels.size, 1);
	assert.equal(targetModels.size, 1);
	assert.equal(optimizedModels.size, 1);
	const candidate = candidateModels.values().next().value;
	const target = targetModels.values().next().value;
	const {deltas: targetDeltas, ...comparison} = compareRadiances(candidate, target, pins.scenes);
	const {deltas: optimizedDeltas, ...optimizedComparison} = compareRadiances(
		candidate,
		optimizedModels.values().next().value,
		pins.scenes,
	);
	const regressionDeltas = await writeArtifact('historical-radiance-deltas.json', {
		role: 'Complete historical Float32 regression differences; independent physical acceptance is separate.',
		operation: 'delta = candidate - historical reference for each scene, direction, and wavelength',
		units: 'W m^-2 sr^-1 nm^-1',
		candidate: table,
		targetPath,
		optimizedTablePath,
		targetDeltas,
		optimizedDeltas,
	});
	const candidateScore = benchmark.scoreModels(dataset, candidateModels).values().next().value;
	const targetScore = benchmark.scoreModels(dataset, targetModels).values().next().value;
	assert.equal(targetScore.aggregate.rmseMilliwatt, 11.554012538468113);
	const scoreDifferenceMilliwatts = candidateScore.aggregate.rmseMilliwatt - targetScore.aggregate.rmseMilliwatt;
	const images = [];
	for (const scene of figures.FIGURE5_SCENES) {
		const measured = dataset.conditions.find((condition) => condition.time === scene.time).grid;
		const actual = figures.renderAlgorithm32Figure5Panel(candidate.get(scene.time), measured, scene);
		const expected = figures.renderAlgorithm32Figure5Panel(target.get(scene.time), measured, scene);
		assert.equal(actual.pixels.length, expected.pixels.length);
		let maximumCodeValueDelta = 0;
		let absoluteCodeValueDeltaSum = 0;
		let differingPixels = 0;
		for (let pixel = 0; pixel < actual.pixels.length; pixel += 4) {
			let differs = false;
			for (let component = 0; component < 3; component++) {
				const difference = Math.abs(actual.pixels[pixel + component] - expected.pixels[pixel + component]);
				maximumCodeValueDelta = Math.max(maximumCodeValueDelta, difference);
				absoluteCodeValueDeltaSum += difference;
				differs ||= difference !== 0;
			}
			if (differs) differingPixels++;
		}
		images.push({
			time: scene.time,
			candidate: await writeArtifact(`b1-${scene.fileTime}.png`, actual.png),
			target: await writeArtifact(`target-${scene.fileTime}.png`, expected.png),
			candidateRgbaSha256: actual.rgbaSha256,
			targetRgbaSha256: expected.rgbaSha256,
			displayRegression: {
				units: 'absolute RGB code-value difference on the 0-255 scale; includes figure annotations',
				maximumCodeValueDelta,
				meanAbsoluteCodeValueDelta: absoluteCodeValueDeltaSum / ((actual.pixels.length / 4) * 3),
				differingPixels,
			},
			exact: actual.rgbaSha256 === expected.rgbaSha256 && actual.png.equals(expected.png),
		});
	}
	for (const source of sources) await files.read(source.path, source);
	cancellation.signal.throwIfAborted();
	const limits = pins.acceptance.bruneton;
	const legacyAccepted =
		decodedBlocksExact &&
		encodedBlocksExact &&
		comparison.maximumAbsoluteWatts <= limits.allChannelMaximumAbsoluteWatts &&
		comparison.rmsWatts <= limits.allChannelRmsWatts &&
		Math.abs(scoreDifferenceMilliwatts) <= limits.scoreDifferenceMilliwatts &&
		images.every((image) => image.exact);
	const accepted = candidateMode
		? Number.isFinite(candidateScore.aggregate.rmseMilliwatt) &&
			candidateScore.aggregate.rmseMilliwatt <= 11.820391604126252
		: legacyAccepted;
	const result = await writeArtifact('result.json', {
		accepted,
		numericalPolicy: numericalPolicy ?? null,
		solarInterpolation,
		acceptanceMode: candidateMode
			? 'candidate-finite-nonnegative-radiance-and-fixed-b1-ceiling'
			: 'unchanged-legacy-reproduction',
		physicalAcceptance:
			'Not established by historical Float32 regression comparisons; separate independent physical proof required.',
		candidateB1RmseCeilingMilliwatts: candidateMode ? 11.820391604126252 : null,
		generated,
		comparison,
		optimizedComparison,
		regressionDeltas,
		topologyExact,
		decodedBlocksExact,
		encodedBlocksExact,
		candidateScore,
		targetScore,
		scoreDifferenceMilliwatts,
		limits,
		images,
		units: 'radiance W m^-2 sr^-1 nm^-1; benchmark RMSE mW m^-2 sr^-1 nm^-1',
		view: `production qualification Q30 CPU evaluator with ${solarInterpolation} solar reconstruction; application renderer not exercised`,
		dataset: {rawAcquisitionSha256: dataset.rawAcquisitionSha256, processedGridSha256: dataset.processedGridSha256},
		tools: {node: process.version, versions: process.versions},
		sources,
		parents,
	});
	await files.progress(`${outputRoot}/progress.json`, {phase: 'complete', accepted});
	const seal = await files.write(
		`${outputRoot}/sealed.json`,
		Buffer.from(`${JSON.stringify({accepted, result, artifacts})}\n`),
	);
	process.stdout.write(
		`${JSON.stringify({outputRoot, accepted, result, seal, comparison, scoreDifferenceMilliwatts})}\n`,
	);
	if (!accepted) process.exitCode = 1;
} catch (error) {
	const failure = await writeArtifact('failure.json', {
		accepted: false,
		error: error instanceof Error ? error.stack : String(error),
		parents,
	});
	await files.progress(`${outputRoot}/progress.json`, {phase: 'failed', accepted: false});
	await files.write(
		`${outputRoot}/sealed.json`,
		Buffer.from(`${JSON.stringify({accepted: false, failure, artifacts})}\n`),
	);
	throw error;
} finally {
	process.removeListener('SIGINT', interrupt);
	process.removeListener('SIGTERM', interrupt);
}
