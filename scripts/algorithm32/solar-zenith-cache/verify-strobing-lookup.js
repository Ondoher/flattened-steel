import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import Files from './DistantSunSharedCacheGenerationFiles.js';
import Graph from './DistantSunSharedCacheGenerationGraph.js';
import Codec from './DistantSunSharedCacheGenerationCodec.js';
import Compiler from './DistantSunSceneCacheOfflineCompiler.js';
import PacketLayout from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCachePacketLayout.js';
import Support from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheSupport.js';
import {DistantSunSolarInterpolation} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSolarInterpolation.js';
import {BrunetonColorDisplayModel} from '../../../src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/index.js';
import {SpectralPacket, SPECTRAL_QUANTITIES, SPECTRAL_UNITS} from '../../../src/algorithm32/spectral-values/index.js';
import {encodeRgbaPng} from '../../experiments/b1-directional-sky-radiance/figure5.js';

const repository = fileURLToPath(new URL('../../../', import.meta.url));
const files = new Files(repository);
const [parent, expectedHash] = process.argv.slice(2);
assert.ok(
	parent && /^[a-f0-9]{64}$/u.test(expectedHash ?? ''),
	'Usage: verify-strobing-lookup.js PACKAGE_ROOT PACKAGE_REPORT_SHA256',
);
const run = `tmp/production-algorithm32/distant-sun-strobing-promotion/lookup-${randomUUID()}`;
await files.directory(run);
const artifacts = [],
	parents = [];
const write = async (name, value) => {
	const artifact = await files.write(
		`${run}/${name}`,
		Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`),
	);
	artifacts.push(artifact);
	return artifact;
};
const read = async (name, expected) => {
	const bytes = await files.read(name, expected);
	parents.push({path: name, byteLength: bytes.length, sha256: files.hash(bytes)});
	return bytes;
};
const sources = [];
const sourceQueue = [
	'scripts/algorithm32/solar-zenith-cache/verify-strobing-lookup.js',
	'scripts/algorithm32/solar-zenith-cache/runCubicLookupProofBrowser.js',
	'src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheCubicLookup.js',
	'src/algorithm32/implementation/distant-sun/cache/DistantSunSolarInterpolation.js',
	'src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCachePacketLayout.js',
	'package-lock.json',
];
const sourceNames = new Set();
while (sourceQueue.length) {
	const name = sourceQueue.shift();
	if (sourceNames.has(name)) continue;
	assert.ok(!name.startsWith('experiments/'), 'Production lookup proof cannot import contained experiment code.');
	sourceNames.add(name);
	const bytes = await read(name);
	sources.push({path: name, byteLength: bytes.length, sha256: files.hash(bytes)});
	for (const match of bytes
		.toString('utf8')
		.matchAll(/(?:import|export)\s+(?:[^'";]+?\s+from\s*)?['"]([^'"]+)['"]/gu)) {
		if (match[1].startsWith('.'))
			sourceQueue.push(path.posix.normalize(path.posix.join(path.posix.dirname(name), match[1])));
	}
}
const heartbeat = setInterval(() => process.stdout.write(`${JSON.stringify({run, phase: 'lookup-proof'})}\n`), 25000);
try {
	const reportBytes = await read(`${parent}/package-set.json`);
	assert.equal(files.hash(reportBytes), expectedHash);
	const graph = await new Graph().read({
		files,
		candidateRoot: parent,
		reportArtifact: {path: 'package-set.json', byteLength: reportBytes.length, sha256: expectedHash},
		signal: new AbortController().signal,
	});
	const directionIdentity = graph.configuration.directionLayout.logicalToUniqueIndex;
	const support = new Support(graph);
	const residencyInventory = graph.scenes.map((scene, ordinal) => ({
		sceneId: scene.id,
		requiredBlocks: support.getRequiredBlocks(ordinal),
	}));
	assert.ok(
		residencyInventory.every((scene) => scene.requiredBlocks.length <= 24),
		'Complete cubic support exceeds the admitted atlas capacity.',
	);
	await write('required-residency.json', {
		scenes: residencyInventory,
		maximumLayers: Math.max(...residencyInventory.map((scene) => scene.requiredBlocks.length)),
		capacityLayers: 24,
		operation:
			'Complete static support coverage for every authenticated scene; runtime publication is qualified separately.',
	});
	const directionBytes = await read(`${parent}/${directionIdentity.path}`, directionIdentity);
	const directions = new Uint16Array(
		directionBytes.buffer.slice(directionBytes.byteOffset, directionBytes.byteOffset + directionBytes.byteLength),
	);
	const owners = new Map();
	for (const block of graph.blockIndex.blocks)
		for (const [row, coordinate] of block.coordinates.entries()) owners.set(coordinate.join(':'), {block, row});
	const decoded = new Map();
	const rowValues = async (altitude, zenith) => {
		const owner = owners.get(`${altitude}:${zenith}`);
		assert.ok(owner, 'Required physical lookup coordinate is absent.');
		if (!decoded.has(owner.block.id)) {
			const bytes = new Codec().decode(
				await read(`${parent}/${owner.block.encoded.path}`, owner.block.encoded),
				owner.block.decoded.byteLength,
			);
			assert.equal(files.hash(bytes), owner.block.decoded.sha256);
			decoded.set(owner.block.id, bytes);
		}
		const bytes = decoded.get(owner.block.id);
		return Array.from({length: 15}, (_, channel) => {
			const start = (channel * owner.block.rowCount + owner.row) * 4058 * 4;
			return bytes.subarray(start, start + 4058 * 4);
		});
	};
	const groups = [],
		expected = [];
	for (const altitude of [0, 1, 2, 23, 47])
		for (const lower of [0, 29, 59, 79, 88, 89, 90, 95, 106]) {
			const zeniths = [...new Set([Math.max(0, lower - 1), lower, lower + 1, lower + 2, lower + 3])];
			const rows = [];
			for (const zenith of zeniths) rows.push(await rowValues(altitude, zenith));
			const logical = Buffer.concat(
				Array.from({length: 15}, (_, channel) => Buffer.concat(rows.map((row) => row[channel]))),
			);
			const packed = new PacketLayout().pack({
				logicalBlockId: 'qualification-four-row-stencil',
				decodedSha256: files.hash(logical),
				logicalToUniqueIndexSha256: directionIdentity.sha256,
				blockRowCount: rows.length,
				decodedValues: new Float32Array(
					logical.buffer.slice(logical.byteOffset, logical.byteOffset + logical.byteLength),
				),
				logicalToUniqueIndex: directions,
			});
			const packet = await write(
				`packet-${groups.length}.f32`,
				Buffer.from(packed.values.buffer, 0, rows.length * 27 * packed.storage.width * 4 * 4),
			);
			const samples = [];
			const directionSamples = Array.from({length: 6}, (_, face) => [
				[face, 13, 13],
				[face, 0, 0],
				[face, 26, 26],
				[face, 12.25, 13.75],
			]).flat();
			for (const forward of [true, false])
				for (const fraction of forward
					? [0, 0.01, 0.25, 0.5, 0.75, 0.99, 1]
					: [1, 0.99, 0.75, 0.5, 0.25, 0.01, 0])
					for (const direction of directionSamples) {
						const spectrum = Array.from({length: 15}, (_, channel) => {
							const values = rows.map((row) => {
								const [face, u, v] = direction;
								const u0 = Math.floor(u),
									v0 = Math.floor(v),
									fu = u - u0,
									fv = v - v0;
								let value = 0;
								for (const [x, wx] of [
									[u0, 1 - fu],
									[Math.min(26, u0 + 1), fu],
								])
									for (const [y, wy] of [
										[v0, 1 - fv],
										[Math.min(26, v0 + 1), fv],
									])
										value +=
											wx * wy * row[channel].readFloatLE(directions[face * 729 + y * 27 + x] * 4);
								return value;
							});
							return DistantSunSolarInterpolation.sample(
								lower === 0 ? undefined : values[0],
								values[zeniths.indexOf(lower)],
								values[zeniths.indexOf(lower + 1)],
								values[zeniths.indexOf(lower + 2)],
								fraction,
							);
						});
						samples.push({direction, zenith: lower + fraction});
						expected.push({altitude, lower, fraction, forward, direction, spectrum});
					}
			groups.push({altitude, zeniths, packet: packet.path, samples});
			decoded.clear();
		}
	await write('definition.json', {
		parent,
		expectedHash,
		groups,
		sources,
		operation:
			'Authenticated candidate decode -> four physical rows -> production packet packing -> production cubic GLSL; binary64 bilinear direction and Hermite reference',
		tolerance: {absolute: 1e-10, relative: 2e-5},
		units: 'W m^-3 sr^-1 nm^-1',
	});
	await write('reference.json', expected);
	const execution = await new Compiler({
		chromePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
	}).compileLayers({
		outputDirectory: path.join(repository, run, 'browser'),
		control: {groups},
		browserModulePath: '/repository/scripts/algorithm32/solar-zenith-cache/runCubicLookupProofBrowser.js',
		layerCount: 1,
	});
	await write('gpu.f32', execution.layers[0]);
	const results = [];
	let accepted = true,
		maximumRatio = 0;
	for (const [sampleIndex, sample] of expected.entries())
		for (let channel = 0; channel < 15; channel++) {
			const actual = execution.layers[0].readFloatLE((sampleIndex * 16 + channel) * 4),
				reference = sample.spectrum[channel];
			const error = Math.abs(actual - reference),
				limit = 1e-10 + 2e-5 * Math.abs(reference);
			const pass = Number.isFinite(actual) && actual >= 0 && error <= limit;
			accepted &&= pass;
			maximumRatio = Math.max(maximumRatio, error / limit);
			results.push({sampleIndex, channel, actual, reference, error, limit, pass});
		}
	await write('comparisons.json', results);
	const color = new BrunetonColorDisplayModel();
	const imageWidth = groups[0].samples.length;
	for (const gpu of [false, true]) {
		const rgb = Buffer.alloc(expected.length * 4, 255);
		for (const [sampleIndex, sample] of expected.entries()) {
			const values = gpu
				? Array.from({length: 15}, (_, channel) =>
						Math.max(0, execution.layers[0].readFloatLE((sampleIndex * 16 + channel) * 4)),
					)
				: sample.spectrum;
			const radiance = /** @type {SpectralRadiancePacket} */ (
				new SpectralPacket({
					basis: NATIVE_15_SPECTRAL_BASIS,
					quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
					units: SPECTRAL_UNITS.RADIANCE_DENSITY,
					values,
					provenanceIdentity: `lookup-proof:${sampleIndex}:${gpu}:one-metre-slab`,
				})
			);
			const display = color.radianceToDisplayRgb(radiance);
			for (let channel = 0; channel < 3; channel++)
				rgb[sampleIndex * 4 + channel] = Math.round(255 * Math.max(0, Math.min(1, display[channel])));
		}
		await write(gpu ? 'gpu-bruneton.png' : 'reference-bruneton.png', encodeRgbaPng(imageWidth, groups.length, rgb));
	}
	for (const source of sources) await files.read(source.path, source);
	await write('result.json', {
		accepted,
		maximumRatio,
		samples: expected.length,
		values: results.length,
		browser: execution.browserExecution,
		parents,
		sources,
		limitations: ['Native15 cumulative N4 density lookup; full transport and Direct40 qualification are separate.'],
	});
	await files.write(`${run}/sealed.json`, Buffer.from(`${JSON.stringify({accepted, artifacts})}\n`));
	process.stdout.write(`${JSON.stringify({run, accepted, maximumRatio})}\n`);
	if (!accepted) process.exitCode = 1;
} catch (error) {
	await write('failure.json', {error: String(error), parents, sources});
	await files.write(`${run}/sealed.json`, Buffer.from(`${JSON.stringify({accepted: false, artifacts})}\n`));
	throw error;
} finally {
	clearInterval(heartbeat);
}
