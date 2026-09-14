import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import Codec from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationCodec.js';
import {StrobingRun} from './StrobingRun.js';

const candidateId = process.argv[2];
if (candidateId && !/^\d{5}-[a-z][a-z0-9-]{0,15}$/u.test(candidateId)) throw new Error('Invalid candidate run id.');
const packageRoot = await StrobingRun.checkedPath(
	StrobingRun.repositoryRoot,
	candidateId
		? `${StrobingRun.outputRelative}/runs/${candidateId}/candidate`
		: 'server/flat32/data/shared-block/2243c1ab2c2d529131759b32d72cee2a2e4b32098e1cc450c0d48cf34ed4edc7',
);
const run = await StrobingRun.allocate('field-probe');
try {
	const report = await StrobingRun.readJson(packageRoot, 'package-set.json');
	const configuration = await StrobingRun.readJson(
		packageRoot,
		/** @type {DistantSunSharedCachePackageSetReport} */ (report).configurations[0].path,
	);
	const indexPath = /** @type {DistantSunSharedCacheConfigurationManifest} */ (configuration).blockIndex.path;
	const index = /** @type {DistantSunSharedCacheBlockIndex} */ (await StrobingRun.readJson(packageRoot, indexPath));
	const mapPath = /** @type {DistantSunSharedCacheConfigurationManifest} */ (configuration).directionLayout
		.logicalToUniqueIndex.path;
	const mapBytes = await readFile(await StrobingRun.checkedPath(packageRoot, mapPath));
	const zenithDirection = mapBytes.readUInt16LE((4 * 729 + 13 * 27 + 13) * 2);
	const selected = index.blocks.filter((block) =>
		block.coordinates.some(([altitude, zenith]) => altitude <= 8 && zenith >= 65 && zenith <= 85),
	);
	const parents = [
		await StrobingRun.identity(packageRoot, 'package-set.json'),
		await StrobingRun.identity(packageRoot, indexPath),
		await StrobingRun.identity(packageRoot, mapPath),
	];
	const rows = [];
	for (const block of selected) {
		const identity = await StrobingRun.identity(packageRoot, block.encoded.path);
		if (identity.sha256 !== block.encoded.sha256) throw new Error('Encoded field block changed.');
		parents.push(identity);
		const bytes = new Codec().decode(
			await readFile(await StrobingRun.checkedPath(packageRoot, block.encoded.path)),
			block.decoded.byteLength,
		);
		if (createHash('sha256').update(bytes).digest('hex') !== block.decoded.sha256)
			throw new Error('Decoded block failed authentication.');
		for (const [row, [altitude, zenith]] of block.coordinates.entries()) {
			if (altitude > 8 || zenith < 65 || zenith > 85) continue;
			const offset = (6 * block.rowCount + row) * 4058;
			let sum = 0;
			for (let direction = 0; direction < 4058; direction++) sum += bytes.readFloatLE((offset + direction) * 4);
			rows.push({
				altitude,
				zenithDegrees: zenith + 0.5,
				channel: 6,
				meanDirections: sum / 4058,
				localZenith: bytes.readFloatLE((offset + zenithDirection) * 4),
			});
		}
		await run.progress({
			phase: 'inspect-block',
			completed: parents.length - 3,
			total: selected.length,
			message: 'Authenticated and measured shared physical field rows.',
		});
	}
	rows.sort((a, b) => a.altitude - b.altitude || a.zenithDegrees - b.zenithDegrees);
	await run.writeJson('field.json', {rows});
	await run.writeJson('provenance.json', {
		packageRoot: path.relative(StrobingRun.repositoryRoot, packageRoot),
		parents,
		operation:
			'Exact Zstandard/byte-lane decode; wavelength index 6, mean over 4058 unique outgoing directions and logical +Z face center. No value modification.',
		implementation: await StrobingRun.identity(
			StrobingRun.repositoryRoot,
			'experiments/distant-sun-recording-strobing/probe-field.js',
		),
		codec: await StrobingRun.identity(
			StrobingRun.repositoryRoot,
			'scripts/algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationCodec.js',
		),
		node: process.version,
	});
	await run.finish('accepted', {purpose: 'shared-field-probe', rows: rows.length});
} catch (error) {
	await run.finish('failed', {error: error instanceof Error ? error.stack : String(error)});
	process.exitCode = 1;
}
