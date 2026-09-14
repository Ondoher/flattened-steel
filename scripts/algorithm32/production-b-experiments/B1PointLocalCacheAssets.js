import {randomUUID} from 'node:crypto';
import {readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer';
import ts from 'typescript';
import DistantSunSharedCacheGenerator from '../solar-zenith-cache/DistantSunSharedCacheGenerator.js';
import DistantSunSharedCacheGenerationFiles from '../solar-zenith-cache/DistantSunSharedCacheGenerationFiles.js';
import DistantSunPointLocalCacheReader from '../solar-zenith-cache/DistantSunPointLocalCacheReader.js';
import {DistantSunPointLocalProfileCompilerInputs} from '../solar-zenith-cache/DistantSunPointLocalProfileCompilerInputs.js';
import {CAPTURE_TIMES} from '../../experiments/b1-directional-sky-radiance/benchmark-domain.js';
import {createBrunetonProductionProfile} from '../../experiments/b1-directional-sky-radiance/production-profile.js';
import B1Direct40CacheAssetManifest, {
	B1_POINT_LOCAL_CACHE_LAYOUT,
	B1_DIRECT40_CACHE_PAYLOAD_CODEC,
	B1_DIRECT40_DIRECTION_INDEX_CODEC,
} from './B1Direct40CacheAssetManifest.js';
import B1Direct40CacheAssetSetManifest from './B1Direct40CacheAssetSetManifest.js';
import B1Direct40CacheAssetVerifier from './B1Direct40CacheAssetVerifier.js';

export const B1_POINT_LOCAL_COMPILER_IDENTITY = 'algorithm32-production-shared-cache-generator';
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

/** Materializes official B1 assets from the unified compiler; contains no scattering solver. */
export default class B1PointLocalCacheAssets {
	/** Identify all production and official-runner source bytes, including an uncommitted checkout. */
	static async sourceIdentity() {
		const files = new DistantSunSharedCacheGenerationFiles(repositoryRoot);
		const sources = [];
		const visit = async (directory) => {
			for (const entry of await readdir(await files.resolve(directory), {withFileTypes: true})) {
				if (['_tests', 'retired', 'inputs'].includes(entry.name)) continue;
				const name = `${directory}/${entry.name}`;
				await files.resolve(name);
				if (entry.isDirectory()) await visit(name);
				else if (/\.(?:js|json)$/u.test(name) && !name.endsWith('.test.js')) {
					const bytes = await files.read(name);
					sources.push({path: name, byteLength: bytes.length, sha256: files.hash(bytes)});
				}
			}
		};
		for (const directory of [
			'src/algorithm32',
			'scripts/algorithm32/solar-zenith-cache',
			'scripts/algorithm32/production-b-experiments',
			'scripts/experiments/b1-directional-sky-radiance',
		])
			await visit(directory);
		const lock = await files.read('package-lock.json');
		const seen = new Set(sources.map((source) => source.path));
		const traversed = new Set();
		const queue = [
			'scripts/experiments/b1-directional-sky-radiance/generate-production-boundary.js',
			'scripts/experiments/b1-directional-sky-radiance/production-gpu-browser.js',
			'scripts/experiments/generate-benchmark-figures.js',
		];
		while (queue.length) {
			const name = queue.shift();
			traversed.add(name);
			if (name.startsWith('experiments/'))
				throw new Error('Official B1 may not depend on contained experiment implementation.');
			const bytes = await files.read(name);
			if (!seen.has(name)) {
				seen.add(name);
				sources.push({path: name, byteLength: bytes.length, sha256: files.hash(bytes)});
			}
			const module = ts.createSourceFile(
				name,
				bytes.toString('utf8'),
				ts.ScriptTarget.Latest,
				false,
				ts.ScriptKind.JS,
			);
			for (const statement of module.statements) {
				if (
					(!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) ||
					!statement.moduleSpecifier ||
					!ts.isStringLiteral(statement.moduleSpecifier)
				)
					continue;
				const specifier = statement.moduleSpecifier.text;
				if (!specifier.startsWith('.')) continue;
				const dependency = path.posix.normalize(path.posix.join(path.posix.dirname(name), specifier));
				if (!traversed.has(dependency) && !queue.includes(dependency)) queue.push(dependency);
			}
		}
		sources.push({path: 'package-lock.json', byteLength: lock.length, sha256: files.hash(lock)});
		sources.sort((left, right) => (left.path < right.path ? -1 : 1));
		return {identity: `sha256:${files.hash(JSON.stringify(sources))}`, sources};
	}

	/** Compile the complete canonical family once, then expand its authenticated scene indexes. */
	static async compileSet({
		conditions,
		sourceIdentity,
		referenceInputs,
		signal,
		onProgress,
		numericalPolicy,
		solarInterpolation,
		positionDomain,
	}) {
		signal ??= new AbortController().signal;
		if (
			conditions.length !== 17 ||
			conditions.some((condition, index) => condition.localTime !== CAPTURE_TIMES[index])
		)
			throw new RangeError('Official B1 requires all 17 ordered conditions.');
		const files = new DistantSunSharedCacheGenerationFiles(repositoryRoot);
		const root = `tmp/algorithm32/point-local-cache-compiler/official-b1-${randomUUID()}`;
		await files.directory(root);
		const profiles = conditions.map((condition) =>
			createBrunetonProductionProfile({
				time: condition.localTime,
				fittedAzimuthDegrees: condition.fittedAzimuthDegrees,
				maximumScatteringOrder: 4,
				positionDomain,
			}),
		);
		const inputs = DistantSunPointLocalProfileCompilerInputs.createBatch(profiles, {
			numericalPolicy,
			solarInterpolation,
			positionDomain,
			ids: conditions.map((condition) => condition.id),
		});
		const compiler = new DistantSunSharedCacheGenerator({
			chromePath: process.env.CHROME_PATH ?? puppeteer.executablePath('chrome'),
		});
		const compilation = await compiler.compile({
			outputDirectory: `${root}/compilation`,
			buildRequest: inputs.buildRequest,
			scenes: [...inputs.scenes],
			wavelengths: [...inputs.wavelengths],
			signal,
			onProgress,
		});
		const packet = JSON.parse((await files.read(`${root}/compilation/package/cache.json`)).toString());
		const reader = new DistantSunPointLocalCacheReader();
		await reader.prepare(files, packet, `${root}/decoded`);
		const directions = await reader.readDirectionMap(files, packet);
		const assetRoot = `${root}/assets`;
		await files.directory(assetRoot);
		const handles = [];
		try {
			for (let index = 0; index < 17; index += 1) {
				await files.directory(`${assetRoot}/condition-${index}`);
				handles.push(await files.create(`${assetRoot}/condition-${index}/density.f32`));
			}
			for (let channel = 0; channel < 40; channel += 1) {
				signal?.throwIfAborted();
				const shared = await reader.readChannel(files, packet, channel);
				for (let index = 0; index < 17; index += 1) {
					const bytes = reader.expandUnique(files, packet, index, shared);
					let offset = 0;
					while (offset < bytes.length) {
						const written = await handles[index].write(
							bytes,
							offset,
							bytes.length - offset,
							channel * bytes.length + offset,
						);
						if (!written.bytesWritten)
							throw new Error('Official B1 cache materialization made no progress.');
						offset += written.bytesWritten;
					}
				}
				onProgress?.({phase: 'materialize', completed: channel + 1, total: 40});
			}
		} finally {
			await Promise.all(handles.map((handle) => handle.close()));
		}
		const assets = [];
		const writeJson = async (name, value) => files.write(name, Buffer.from(`${JSON.stringify(value, null, 2)}\n`));
		for (let index = 0; index < 17; index += 1) {
			const directory = `${assetRoot}/condition-${index}`;
			const density = await files.read(`${directory}/density.f32`, null, 512 * 1024 * 1024);
			const directionArtifact = await files.write(`${directory}/directions.u16`, directions);
			const evidence = await writeJson(`${directory}/compiler-evidence.json`, {
				schemaId: 'algorithm32-b1-point-local-compiler-evidence-v1',
				compilation,
				packageIdentity: packet.packageIdentity,
				scene: packet.scenes[index],
				sourceIdentity,
				referenceInputs,
				operation: 'decode authenticated unified-compiler blocks; copy indexed unique-direction rows',
			});
			const record = B1Direct40CacheAssetManifest.createRecord({
				...B1Direct40CacheAssetManifest.createProfileBoundary(profiles[index], conditions[index]),
				layout: {axisOrder: B1_POINT_LOCAL_CACHE_LAYOUT, scalarType: 'float32-little-endian'},
				ledger: packet.scenes[index].ledger,
				...(solarInterpolation === undefined ? {} : {solarInterpolation}),
				cumulativeScatteringDensity: {
					path: 'density.f32',
					byteLength: density.length,
					sha256: files.hash(density),
					codecId: B1_DIRECT40_CACHE_PAYLOAD_CODEC,
				},
				logicalToUniqueIndex: {
					...directionArtifact,
					path: 'directions.u16',
					codecId: B1_DIRECT40_DIRECTION_INDEX_CODEC,
				},
				derivation: {
					compilerIdentity: B1_POINT_LOCAL_COMPILER_IDENTITY,
					productionRevision: sourceIdentity.identity,
					operation: 'unified production GPU compilation and exact receiver-local scene expansion',
					inputs: {
						packageIdentity: packet.packageIdentity,
						referenceInputs,
						compilerEvidence: {...evidence, path: 'compiler-evidence.json'},
					},
				},
			});
			new B1Direct40CacheAssetManifest(record).requireCompatibility(profiles[index], conditions[index]);
			const manifestBytes = Buffer.from(`${JSON.stringify(record, null, 2)}\n`);
			const manifestName = `asset-manifest-${files.hash(manifestBytes)}.json`;
			const manifest = await files.write(`${directory}/${manifestName}`, manifestBytes);
			assets.push({
				condition: conditions[index],
				manifestPath: `condition-${index}/${manifestName}`,
				manifestSha256: manifest.sha256,
				assetIdentity: record.assetIdentity,
				profile: {id: profiles[index].id, contentHash: profiles[index].contentHash},
			});
		}
		const record = B1Direct40CacheAssetSetManifest.createRecord({
			profileFamily: B1Direct40CacheAssetSetManifest.profileFamilyFor(positionDomain),
			...(positionDomain === 'native51-near-ground' ? {positionDomain} : {}),
			productionRevision: sourceIdentity.identity,
			assets,
		});
		const bytes = Buffer.from(`${JSON.stringify(record, null, 2)}\n`);
		await files.write(`${assetRoot}/asset-set-manifest-${files.hash(bytes)}.json`, bytes);
		const outputDirectory = await files.resolve(assetRoot);
		await B1Direct40CacheAssetVerifier.verifySet({
			setDirectory: outputDirectory,
			productionRevision: sourceIdentity.identity,
		});
		return {outputDirectory, productionRevision: sourceIdentity.identity};
	}
}
