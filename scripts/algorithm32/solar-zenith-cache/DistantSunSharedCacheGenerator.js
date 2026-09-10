import {randomUUID} from 'node:crypto';
import {lstat, mkdir, readdir, rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import DistantSunSharedCacheGenerationFiles from './DistantSunSharedCacheGenerationFiles.js';
import DistantSunSharedCacheGenerationInventory from './DistantSunSharedCacheGenerationInventory.js';
import DistantSunSharedCacheGenerationStaging from './DistantSunSharedCacheGenerationStaging.js';
import DistantSunSharedCacheGenerationHost from './DistantSunSharedCacheGenerationHost.js';
import DistantSunSharedCacheGenerationPackage from './DistantSunSharedCacheGenerationPackage.js';
import DistantSunSharedCacheGenerationVerifier from './DistantSunSharedCacheGenerationVerifier.js';
import {
	SHARED_GENERATION_RUN_ROOT,
	SHARED_GENERATION_SOURCE_ROOT,
	SHARED_GENERATION_MAXIMUM_WORKING_BYTES,
	SHARED_GENERATION_MAXIMUM_NODE_RSS_BYTES,
} from './consts.js';

/** Immutable production generation run owner from authenticated controls through atomic candidate publication. */
export default class DistantSunSharedCacheGenerator {
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
		let staging = null;
		let publicationCommitted = false;
		let sealed = false;
		let publishedRoot = null;
		try {
			await progress({phase: 'control-authentication'});
			const inventory = await new DistantSunSharedCacheGenerationInventory().load(files);
			const sources = [];
			const names = (await readdir(await files.resolve(SHARED_GENERATION_SOURCE_ROOT)))
				.filter((name) =>
					/^(?:DistantSunSharedCache.*|DistantSunSceneCacheGpuCompiler|DistantSunSceneCacheCompilerInputs|consts|generate-shared-cache)\.js$/u.test(
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
				version: '1.0.0',
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
			staging = new DistantSunSharedCacheGenerationStaging(inventory);
			await staging.allocate(files, stagingRoot);
			await progress({
				phase: 'common-field-computation',
				wavelengths: 15,
				unionRows: inventory.coordinates.length,
				blocks: inventory.blocks.length,
			});
			const gpu = await new DistantSunSharedCacheGenerationHost().run({
				files,
				runRoot,
				inventory,
				staging,
				chromePath: options.chromePath,
				signal,
				progress,
			});
			const stagedBytes = staging.complete();
			await staging.close();
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
			await staging?.close();
		}
	}
}
