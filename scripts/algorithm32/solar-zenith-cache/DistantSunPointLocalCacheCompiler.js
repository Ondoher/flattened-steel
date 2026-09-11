import {lstat, mkdir, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import DistantSunPointLocalCacheCompilerHost from './DistantSunPointLocalCacheCompilerHost.js';
import DistantSunPointLocalCacheInventory from './DistantSunPointLocalCacheInventory.js';
import DistantSunPointLocalCachePackage from './DistantSunPointLocalCachePackage.js';
import DistantSunPointLocalCacheStaging from './DistantSunPointLocalCacheStaging.js';
import DistantSunSharedCacheGenerationFiles from './DistantSunSharedCacheGenerationFiles.js';
import {SHARED_GENERATION_SOURCE_ROOT} from './consts.js';

export const DISTANT_SUN_POINT_LOCAL_CACHE_COMPILER_IDENTITY =
	'algorithm32-production-point-local-shared-cache-compiler-v1';
export const DISTANT_SUN_POINT_LOCAL_CACHE_OUTPUT_ROOT = 'tmp/algorithm32/point-local-cache-compiler';

const SOURCE_NAMES = Object.freeze([
	'DistantSunPointLocalCacheCompiler.js',
	'DistantSunPointLocalCacheCompilerBrowser.js',
	'DistantSunPointLocalCacheCompilerHost.js',
	'DistantSunPointLocalCacheInventory.js',
	'DistantSunPointLocalCachePackage.js',
	'DistantSunPointLocalCacheReader.js',
	'DistantSunPointLocalCacheStaging.js',
	'DistantSunPointLocalProfileCompilerInputs.js',
	'DistantSunSceneCacheGpuCompiler.js',
	'DistantSunSharedCacheGenerationCodec.js',
]);

/** Production offline compiler for one input-driven point-local shared cache. */
export default class DistantSunPointLocalCacheCompiler {
	/**
	 * @param {{chromePath: string, maximumMilliseconds?: number}} definition - Explicit local browser and deadline.
	 */
	constructor(definition) {
		if (typeof definition?.chromePath !== 'string' || !path.isAbsolute(definition.chromePath)) {
			throw new TypeError('Point-local compiler requires an absolute Chrome executable path.');
		}
		this.chromePath = definition.chromePath;
		this.maximumMilliseconds = definition.maximumMilliseconds ?? 900000;
		this.repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
	}

	async _createRun(files, relativePath) {
		if (
			typeof relativePath !== 'string' ||
			!/^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/u.test(relativePath) ||
			relativePath.split('/').some((part) => part === '.' || part === '..') ||
			!relativePath.startsWith(`${DISTANT_SUN_POINT_LOCAL_CACHE_OUTPUT_ROOT}/`)
		) {
			throw new RangeError(
				`Point-local compiler output must be below ${DISTANT_SUN_POINT_LOCAL_CACHE_OUTPUT_ROOT}/.`,
			);
		}
		await files.resolve(path.posix.dirname(relativePath));
		const absolute = path.join(this.repositoryRoot, ...relativePath.split('/'));
		await lstat(absolute)
			.then(() => {
				throw new Error('Point-local compiler output directory must not already exist.');
			})
			.catch((error) => {
				if (error.code !== 'ENOENT') throw error;
			});
		await mkdir(absolute, {recursive: false});
		if ((await realpath(absolute)).toLowerCase() !== absolute.toLowerCase()) {
			throw new Error('Point-local compiler output directory resolves through an alias.');
		}
		return relativePath;
	}

	async _implementation(files) {
		const sources = [];
		for (const name of SOURCE_NAMES) {
			const relativePath = `${SHARED_GENERATION_SOURCE_ROOT}/${name}`;
			const bytes = await files.read(relativePath);
			sources.push({path: relativePath, byteLength: bytes.byteLength, sha256: files.hash(bytes)});
		}
		return {
			id: DISTANT_SUN_POINT_LOCAL_CACHE_COMPILER_IDENTITY,
			version: '1.0.0',
			sha256: files.hash(JSON.stringify(sources)),
			sources,
		};
	}

	/**
	 * Compile all requested scenes in one browser/GPU lifecycle and publish a complete immutable run record.
	 * The output directory must not exist. Failure leaves it unpublished with a terminal failure record.
	 *
	 * @param {DistantSunPointLocalCompileRequest} request - Explicit output, calculation inputs, scenes, channels, and cancellation.
	 * @returns {Promise<DistantSunPointLocalCompileResult>} - Package identity, work counts, and GPU measurements.
	 */
	async compile(request) {
		if (!(request?.signal instanceof AbortSignal)) {
			throw new TypeError('Point-local compiler requires a caller-owned AbortSignal.');
		}
		request.signal.throwIfAborted();
		const files = new DistantSunSharedCacheGenerationFiles(this.repositoryRoot);
		const runRoot = await this._createRun(files, request.outputDirectory);
		const stagingRoot = `${runRoot}/staging`;
		const packageRoot = `${runRoot}/package`;
		const started = performance.now();
		const progress = async (event) => {
			request.signal.throwIfAborted();
			const value = {...event, elapsedMilliseconds: performance.now() - started};
			await files.progress(`${runRoot}/progress.json`, value);
			await request.onProgress?.(value);
		};
		let staging = null;
		try {
			await files.directory(packageRoot);
			await progress({phase: 'inventory'});
			const inventory = new DistantSunPointLocalCacheInventory().create(
				request.buildRequest,
				request.scenes,
				request.wavelengths,
			);
			const implementation = await this._implementation(files);
			const input = {
				schemaId: 'algorithm32-point-local-compiler-input-v1',
				buildRequest: request.buildRequest,
				scenes: request.scenes,
				wavelengths: request.wavelengths,
			};
			const inputArtifact = await files.write(`${runRoot}/input.json`, Buffer.from(`${JSON.stringify(input)}\n`));
			const implementationArtifact = await files.write(
				`${runRoot}/implementation.json`,
				Buffer.from(`${JSON.stringify(implementation)}\n`),
			);
			staging = new DistantSunPointLocalCacheStaging(inventory);
			await staging.allocate(files, stagingRoot);
			await progress({
				phase: 'gpu',
				scenes: inventory.scenes.length,
				channels: inventory.channelCount,
				coordinates: inventory.coordinates.length,
				blocks: inventory.blocks.length,
			});
			const gpu = await new DistantSunPointLocalCacheCompilerHost().run({
				files,
				runRoot,
				inventory,
				staging,
				chromePath: this.chromePath,
				maximumMilliseconds: this.maximumMilliseconds,
				signal: request.signal,
				progress,
			});
			const stagedBytes = staging.complete();
			await staging.close();
			staging = null;
			await progress({phase: 'package'});
			const packaged = await new DistantSunPointLocalCachePackage().write({
				files,
				root: packageRoot,
				stagingRoot,
				inventory,
				implementation,
				gpu,
				signal: request.signal,
				progress,
			});
			const result = {
				accepted: true,
				compilerIdentity: DISTANT_SUN_POINT_LOCAL_CACHE_COMPILER_IDENTITY,
				outputDirectory: runRoot,
				packageIdentity: packaged.packet.packageIdentity,
				manifest: packaged.manifest,
				input: inputArtifact,
				implementation: implementationArtifact,
				sceneCount: inventory.scenes.length,
				channelCount: inventory.channelCount,
				coordinateCount: inventory.coordinates.length,
				blockCount: inventory.blocks.length,
				stagedBytes,
				gpu,
				elapsedMilliseconds: performance.now() - started,
			};
			await files.progress(`${runRoot}/progress.json`, {phase: 'complete', accepted: true});
			await files.write(`${runRoot}/complete.json`, Buffer.from(`${JSON.stringify(result)}\n`));
			return result;
		} catch (error) {
			await files.write(
				`${runRoot}/failure.json`,
				Buffer.from(
					`${JSON.stringify({accepted: false, error: error instanceof Error ? error.stack : String(error)})}\n`,
				),
			);
			await files.progress(`${runRoot}/progress.json`, {phase: 'failed', accepted: false});
			throw error;
		} finally {
			await staging?.close();
		}
	}
}
