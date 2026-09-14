import {randomUUID} from 'node:crypto';
import {lstat, mkdir, readdir, realpath, rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import DistantSunSharedCacheGenerationFiles from './DistantSunSharedCacheGenerationFiles.js';
import DistantSunSharedCacheGenerationInventory from './DistantSunSharedCacheGenerationInventory.js';
import DistantSunPointLocalCacheStaging from './DistantSunPointLocalCacheStaging.js';
import DistantSunPointLocalCacheInventory from './DistantSunPointLocalCacheInventory.js';
import DistantSunPointLocalCachePackage from './DistantSunPointLocalCachePackage.js';
import DistantSunPointLocalCacheCompilerHost from './DistantSunPointLocalCacheCompilerHost.js';
import DistantSunSharedCacheGenerationPackage from './DistantSunSharedCacheGenerationPackage.js';
import DistantSunSharedCacheGenerationVerifier from './DistantSunSharedCacheGenerationVerifier.js';
import {
	SHARED_GENERATION_RUN_ROOT,
	DISTANT_SUN_POINT_LOCAL_CACHE_COMPILER_IDENTITY,
	DISTANT_SUN_POINT_LOCAL_CACHE_OUTPUT_ROOT,
	SHARED_COMPILER_SOURCE_NAMES,
	SHARED_GENERATION_SOURCE_ROOT,
	SHARED_GENERATION_MAXIMUM_WORKING_BYTES,
	SHARED_GENERATION_MAXIMUM_NODE_RSS_BYTES,
} from './consts.js';

/** Unified production cache compiler with Native15 runtime and explicit-input package serialization. */
export default class DistantSunSharedCacheGenerator {
	/** Absolute Chrome executable for explicit-input compilation. @type {string | undefined} */ chromePath;
	/** GPU execution deadline in milliseconds. @type {number} */ maximumMilliseconds;
	/** Repository identity derived from the compiler location. @readonly @type {string} */ repositoryRoot;
	/**
	 * Creates the production compiler with optional explicit-input execution settings.
	 *
	 * @param {SharedCompilerDefinition} [definition] - Browser and execution deadline for explicit-input compilation.
	 */
	constructor(definition = {}) {
		this.chromePath = definition.chromePath;
		this.maximumMilliseconds = definition.maximumMilliseconds ?? 900000;
		this.repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
	}

	/**
	 * Called by both package workflows to execute the same bounded compiler lifecycle.
	 *
	 * @param {SharedGenerationFiles} files - Repository-contained artifact owner.
	 * @param {string} runRoot - New run's root.
	 * @param {DistantSunPointLocalInventory} inventory - Accepted variable inventory.
	 * @param {SharedCompilerExecution} options - Explicit browser and cancellation.
	 * @param {(event: Readonly<Record<string, unknown>>) => Promise<void>} progress - Run progress owner.
	 * @returns {Promise<SharedCompilerComputation>} - Complete GPU execution and staged-byte accounting.
	 */
	async _compute(files, runRoot, inventory, options, progress) {
		const staging = new DistantSunPointLocalCacheStaging(inventory);
		try {
			await staging.allocate(files, `${runRoot}/staging`);
			await progress({
				phase: 'common-field-computation',
				wavelengths: inventory.channelCount,
				unionRows: inventory.coordinates.length,
				blocks: inventory.blocks.length,
			});
			const gpu = await new DistantSunPointLocalCacheCompilerHost().run({
				files,
				runRoot,
				inventory,
				staging,
				chromePath: options.chromePath,
				maximumMilliseconds: options.maximumMilliseconds,
				signal: options.signal,
				progress,
			});
			return {gpu, stagedBytes: staging.complete()};
		} finally {
			await staging.close();
		}
	}

	/**
	 * Counts all ordinary candidate files without following aliases.
	 *
	 * @param {string} directory - Verified candidate directory.
	 * @returns {Promise<number>} - Complete candidate byte count.
	 */
	async _bytes(directory) {
		let bytes = 0;
		for (const name of await readdir(directory)) {
			const target = path.join(directory, name);
			const facts = await lstat(target);
			if (facts.isSymbolicLink()) throw new Error('Candidate contains a link.');
			if (facts.isDirectory()) bytes += await this._bytes(target);
			else if (facts.isFile()) bytes += facts.size;
			else throw new Error('Candidate contains a nonordinary artifact.');
		}
		return bytes;
	}
	/**
	 * Called by explicit-input compilation to allocate an exclusive contained run.
	 * Existing destinations, aliases and paths outside the output root reject.
	 *
	 * @param {SharedGenerationFiles} files - Repository-contained artifact owner.
	 * @param {string} relativePath - New repository-relative output directory.
	 * @returns {Promise<string>} - Exclusive contained run path.
	 */
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

	/**
	 * Called by explicit-input compilation to identify every direct compiler source owner.
	 *
	 * @param {SharedGenerationFiles} files - Repository-contained artifact owner.
	 * @returns {Promise<SharedCompilerImplementation>} - Source identities for this execution.
	 */
	async _implementation(files) {
		const sources = [];
		for (const name of SHARED_COMPILER_SOURCE_NAMES) {
			const relativePath = `${SHARED_GENERATION_SOURCE_ROOT}/${name}`;
			const bytes = await files.read(relativePath);
			sources.push({path: relativePath, byteLength: bytes.byteLength, sha256: files.hash(bytes)});
		}
		return {
			id: DISTANT_SUN_POINT_LOCAL_CACHE_COMPILER_IDENTITY,
			version: '2.0.0',
			sha256: files.hash(JSON.stringify(sources)),
			sources,
		};
	}

	/**
	 * Call this method to generate and qualify the complete production shared inventory.
	 * Invalid execution options, failed controls, generation or verification failures, resource limits, or cancellation reject; callers must preserve prior runs.
	 * Failures before the atomic rename leave the candidate unpublished. Later bookkeeping failures
	 * preserve the complete publication and report its published and sealed states explicitly.
	 *
	 * @param {SharedGenerationRequest} options - Explicit local browser and caller cancellation.
	 * @returns {Promise<SharedGenerationRunResult>} - Complete acceptance and provenance record.
	 */
	async run(options) {
		if (
			!(options?.signal instanceof AbortSignal) ||
			typeof options.chromePath !== 'string' ||
			!path.isAbsolute(options.chromePath)
		)
			throw new Error('Generation requires an absolute browser path and AbortSignal.');
		options.signal.throwIfAborted();
		const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
		const files = new DistantSunSharedCacheGenerationFiles(repositoryRoot);
		await files.resolve('AGENTS.md');
		const runs = await files.directory(SHARED_GENERATION_RUN_ROOT);
		const runId = `${new Date().toISOString().replace(/[:.]/gu, '-')}-${randomUUID()}`;
		await mkdir(path.join(runs, runId));
		const runRoot = `${SHARED_GENERATION_RUN_ROOT}/${runId}`;
		const stagingRoot = `${runRoot}/staging`;
		const candidateRoot = `${runRoot}/candidate`;
		await files.directory(candidateRoot);
		const started = performance.now();
		let peakRssBytes = process.memoryUsage().rss;
		let peakArrayBufferBytes = process.memoryUsage().arrayBuffers;
		const sample = () => {
			const usage = process.memoryUsage();
			peakRssBytes = Math.max(peakRssBytes, usage.rss);
			peakArrayBufferBytes = Math.max(peakArrayBufferBytes, usage.arrayBuffers);
		};
		const monitor = setInterval(sample, 100);
		const signal = options.signal;
		const progress = async (event) => {
			signal.throwIfAborted();
			sample();
			if (peakRssBytes > SHARED_GENERATION_MAXIMUM_NODE_RSS_BYTES)
				throw new Error('Generation exceeds the declared Node process memory bound.');
			await files.progress(`${runRoot}/progress.json`, {
				runId,
				elapsedMilliseconds: performance.now() - started,
				peakRssBytes,
				...event,
			});
			process.stdout.write(`${JSON.stringify({runId, ...event})}\n`);
			await options.onProgress?.(event);
		};
		let publicationCommitted = false;
		let sealed = false;
		let publishedRoot = null;
		try {
			await progress({phase: 'control-authentication'});
			const inventory = await new DistantSunSharedCacheGenerationInventory().load(files, options);
			const sources = [];
			const names = (await readdir(await files.resolve(SHARED_GENERATION_SOURCE_ROOT)))
				.filter((name) =>
					/^(?:DistantSunSharedCache.*|DistantSunPointLocal.*|DistantSunSceneCacheGpuCompiler|DistantSunSceneCacheNumerics|DistantSunSceneCacheCompilerInputs|consts|generate-shared-cache)\.js$/u.test(
						name,
					),
				)
				.sort();
			for (const name of names) {
				const relativePath = `${SHARED_GENERATION_SOURCE_ROOT}/${name}`;
				const bytes = await files.read(relativePath);
				sources.push({
					path: relativePath,
					byteLength: bytes.byteLength,
					sha256: files.hash(bytes),
					source: bytes.toString('utf8'),
				});
			}
			const sourceBytes = Buffer.from(`${JSON.stringify(sources)}\n`);
			const sourceArtifact = await files.write(`${runRoot}/implementation.json`, sourceBytes);
			const implementation = {
				id: 'algorithm32-production-shared-cache-generator',
				version: '2.0.0',
				sha256: sourceArtifact.sha256,
			};
			const parameters = {
				buildRequest: inventory.buildRequest,
				unionLedger: inventory.unionLedger,
				blockGrid: [8, 8],
				tileRows: 64,
				codec: 'float32-byte-lane-v1+zstandard-level-6',
			};
			const parameterBytes = Buffer.from(`${JSON.stringify(parameters)}\n`);
			const parameterArtifact = await files.write(`${runRoot}/parameters.json`, parameterBytes);
			const parents = [
				{role: 'immutable-control-catalog', artifact: inventory.catalogArtifact},
				{role: 'generator-source', artifact: sourceArtifact},
				{role: 'common-field-parameters', artifact: parameterArtifact},
			];
			const planned = new DistantSunPointLocalCacheInventory().create(
				inventory.buildRequest,
				inventory.scenes.map((scene) => ({
					id: scene.manifest.sceneSun.id,
					instant: scene.manifest.sceneSun.instant,
					zenithDegrees: scene.ordinal,
					observerAltitudeMeters: scene.ledger.support.observerAltitude.value,
				})),
				Array.from({length: 15}, (_unused, index) => index),
			);
			if (
				JSON.stringify(planned.coordinates) !== JSON.stringify(inventory.coordinates) ||
				JSON.stringify(planned.blocks) !== JSON.stringify(inventory.blocks) ||
				!planned.directionBytes.equals(inventory.directionBytes)
			) {
				throw new Error('The expanded compiler inventory differs from the deployed Native15 layout.');
			}
			const {gpu, stagedBytes} = await this._compute(files, runRoot, planned, options, progress);
			const gpuArtifact = await files.write(`${runRoot}/gpu.json`, Buffer.from(`${JSON.stringify(gpu)}\n`));
			parents.push({role: 'common-field-gpu-execution', artifact: gpuArtifact});
			const compressionStarted = performance.now();
			const candidate = await new DistantSunSharedCacheGenerationPackage({
				files,
				inventory,
				candidateRoot,
				stagingRoot,
				implementation,
				parents,
				parametersSha256: parameterArtifact.sha256,
				browserVersion: gpu.userAgent,
				signal,
				progress,
			}).finalize();
			const compressionAndMetadataMilliseconds = performance.now() - compressionStarted;
			const verification = await new DistantSunSharedCacheGenerationVerifier().verify({
				files,
				inventory,
				candidate,
				candidateRoot,
				stagingRoot,
				signal,
				progress,
			});
			const verificationArtifact = await files.write(
				`${runRoot}/verification.json`,
				Buffer.from(`${JSON.stringify(verification)}\n`),
			);
			parents.push({role: 'persisted-graph-and-all-control-verification', artifact: verificationArtifact});
			for (const source of sources)
				if (files.hash(await files.read(source.path)) !== source.sha256)
					throw new Error('Generator source changed during execution.');
			const candidateBytes = await this._bytes(await files.resolve(candidateRoot));
			const workingBytesBeforePublication = await this._bytes(await files.resolve(runRoot));
			const elapsedMilliseconds = performance.now() - started;
			if (candidateBytes > 600000000 || elapsedMilliseconds > 900000)
				throw new Error('The generated candidate exceeds the production storage or generation-time gate.');
			if (
				workingBytesBeforePublication > SHARED_GENERATION_MAXIMUM_WORKING_BYTES ||
				peakRssBytes > SHARED_GENERATION_MAXIMUM_NODE_RSS_BYTES
			)
				throw new Error('Generation exceeds the declared working-disk or Node memory bound.');
			signal.throwIfAborted();
			await files.directory(`${runRoot}/published`);
			publishedRoot = `${runRoot}/published/${candidate.report.packageSetIdentity}`;
			const result = {
				accepted: true,
				runId,
				publishedRoot,
				packageSetIdentity: candidate.report.packageSetIdentity,
				packageSetSha256: candidate.reportArtifact.sha256,
				candidateBytes,
				workingBytesBeforePublication,
				maximumWorkingBytes: SHARED_GENERATION_MAXIMUM_WORKING_BYTES,
				maximumNodeRssBytes: SHARED_GENERATION_MAXIMUM_NODE_RSS_BYTES,
				stagedBytes,
				avoidedSceneStagingBytes: verification.comparedBytes,
				elapsedMilliseconds,
				compressionAndMetadataMilliseconds,
				verificationMilliseconds: verification.elapsedMilliseconds,
				peakRssBytes,
				peakArrayBufferBytes,
				maximumReadbackBytes: gpu.maximumReadbackBytes,
				unionAccumulatorBytes: gpu.unionAccumulatorBytes,
				sceneCount: verification.scenes.length,
				blockCount: candidate.blockIndex.blocks.length,
				implementation,
				parents,
			};
			await files.write(`${runRoot}/acceptance.json`, Buffer.from(`${JSON.stringify(result)}\n`));
			await rename(await files.resolve(candidateRoot), path.join(repositoryRoot, publishedRoot));
			publicationCommitted = true;
			await progress({phase: 'publication-committed', published: true, publishedRoot});
			await files.write(
				`${runRoot}/sealed.json`,
				Buffer.from(
					`${JSON.stringify({schemaId: 'algorithm32-production-shared-cache-run-seal-v1', runId, acceptanceSha256: files.hash(Buffer.from(`${JSON.stringify(result)}\n`)), packageSetIdentity: result.packageSetIdentity})}\n`,
				),
			);
			sealed = true;
			await files.progress(`${runRoot}/progress.json`, {runId, phase: 'complete', accepted: true, publishedRoot});
			return result;
		} catch (error) {
			if (publicationCommitted) {
				const publicationFailure = {
					runId,
					phase: 'publication-bookkeeping-failed',
					published: true,
					publishedRoot,
					sealed,
					error: error instanceof Error ? error.message : String(error),
				};
				try {
					await files.write(
						`${runRoot}/publication-bookkeeping-failure.json`,
						Buffer.from(`${JSON.stringify(publicationFailure)}\n`),
					);
					await files.progress(`${runRoot}/progress.json`, publicationFailure);
				} catch (diagnosticError) {
					process.stderr.write(
						`Publication completed; failure diagnostics could not be persisted: ${String(diagnosticError)}\n`,
					);
				}
				throw new Error(
					`Shared package publication completed at ${publishedRoot}; final bookkeeping failed (sealed: ${sealed}). Inspect the run before activation.`,
					{cause: error},
				);
			}
			await files.write(
				`${runRoot}/failure.json`,
				Buffer.from(
					`${JSON.stringify({accepted: false, runId, elapsedMilliseconds: performance.now() - started, error: error instanceof Error ? error.message : String(error)})}\n`,
				),
			);
			await files.progress(`${runRoot}/progress.json`, {runId, phase: 'failed', accepted: false});
			throw error;
		} finally {
			clearInterval(monitor);
		}
	}
	/**
	 * Call this method to compile all requested scenes in one browser/GPU lifecycle and publish a complete immutable run record.
	 * The output directory must not exist. Failure leaves it unpublished with a terminal failure record.
	 *
	 * @param {DistantSunPointLocalCompileRequest} request - Explicit output, calculation inputs, scenes, channels, and cancellation.
	 * @returns {Promise<DistantSunPointLocalCompileResult>} - Package identity, work counts, and GPU measurements.
	 */
	async compile(request) {
		if (!(request?.signal instanceof AbortSignal)) {
			throw new TypeError('Point-local compiler requires a caller-owned AbortSignal.');
		}
		if (typeof this.chromePath !== 'string' || !path.isAbsolute(this.chromePath)) {
			throw new TypeError('Compilation requires an absolute Chrome executable path.');
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
			const {gpu, stagedBytes} = await this._compute(
				files,
				runRoot,
				inventory,
				{
					chromePath: this.chromePath,
					maximumMilliseconds: this.maximumMilliseconds,
					signal: request.signal,
				},
				progress,
			);
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
		}
	}
}
