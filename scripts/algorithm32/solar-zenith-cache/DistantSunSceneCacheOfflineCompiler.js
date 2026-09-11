import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, rm, writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
	DISTANT_SUN_SCENE_CACHE_EXACT_SEAM_CODEC_ID,
	DISTANT_SUN_SCENE_CACHE_MANIFEST_SCHEMA_ID,
	DISTANT_SUN_SCENE_CACHE_ORACLE_CODEC_ID,
} from '../../../src/algorithm32/implementation/distant-sun/cache/consts.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../src/algorithm32/sampling-domains/index.js';
import {DistantSunSceneCacheCompilerInputs} from './DistantSunSceneCacheCompilerInputs.js';

/** Production-owned offline compiler for complete point-local distant-Sun scene-cache packages. */
export default class DistantSunSceneCacheOfflineCompiler {
	/** @type {string} */ _chromePath;
	/** @type {string} */ _repositoryRoot;

	/**
	 * Creates a production offline compiler with an explicit Chrome executable.
	 *
	 * @param {DistantSunSceneCacheOfflineCompilerDefinition} definition - The browser executable and optional timeout.
	 */
	constructor(definition) {
		this._chromePath = definition.chromePath;
		this._timeoutMilliseconds = definition.timeoutMilliseconds ?? 7_500_000;
		this._repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
	}

	/**
	 * Called by compilation to hash one byte sequence.
	 *
	 * @param {Uint8Array} bytes - The exact bytes to identify.
	 * @returns {string} - The lowercase SHA-256 hash.
	 */
	_sha256(bytes) {
		return createHash('sha256').update(bytes).digest('hex');
	}

	/**
	 * Called by compilation to encode deterministic indented JSON with one trailing newline.
	 *
	 * @param {unknown} value - The serializable value.
	 * @returns {Buffer} - The exact UTF-8 bytes.
	 */
	_jsonBytes(value) {
		return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8');
	}

	/**
	 * Called by the HTTP ingress to collect a bounded browser artifact.
	 *
	 * @param {import('node:http').IncomingMessage} request - The browser request stream.
	 * @param {number} limitBytes - The exclusive payload limit.
	 * @returns {Promise<Buffer>} - The complete uploaded bytes.
	 */
	async _readRequestBody(request, limitBytes) {
		const chunks = [];
		let byteLength = 0;

		for await (const chunk of request) {
			byteLength += chunk.length;
			if (byteLength > limitBytes) {
				throw new RangeError('Offline compiler browser upload exceeds its declared limit.');
			}
			chunks.push(chunk);
		}

		return Buffer.concat(chunks);
	}

	/**
	 * Called by the browser server to return the content type for one repository module.
	 *
	 * @param {string} target - The absolute file path.
	 * @returns {string} - The HTTP content type.
	 */
	_contentType(target) {
		if (target.endsWith('.js')) return 'text/javascript; charset=utf-8';
		if (target.endsWith('.json')) return 'application/json; charset=utf-8';
		return 'application/octet-stream';
	}

	/**
	 * Called by compilation to create the self-reporting browser entry document.
	 *
	 * @returns {string} - The complete HTML source.
	 */
	_browserDocument(
		browserModulePath = '/repository/scripts/algorithm32/solar-zenith-cache/runOfflineCompilerBrowser.js',
	) {
		return (
			'<!doctype html><meta charset="utf-8"><pre id="result">pending</pre>' +
			'<script type="module">const target=document.querySelector("#result");' +
			'globalThis.offlineCompilerProgress=(stage)=>fetch("/progress?stage="+encodeURIComponent(stage));' +
			`try{const module=await import(${JSON.stringify(browserModulePath)});` +
			'target.textContent=JSON.stringify(await module.runOfflineCompilerBrowser());}' +
			'catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>'
		);
	}

	/**
	 * Called by compilation to create a containment-checking loopback module and artifact server.
	 *
	 * @param {Map<string, Buffer>} uploads - The unique browser layer uploads.
	 * @param {readonly DistantSunSceneCacheCompilerProgress[]} progress - The mutable progress collector.
	 * @param {DistantSunSceneCacheCompilerScene} scene - The exact scene supplied to the browser compiler.
	 * @returns {import('node:http').Server} - The unstarted loopback server.
	 */
	_createServer(uploads, progress, control, browserModulePath, layerCount) {
		const browserDocument = this._browserDocument(browserModulePath);

		return createServer(async (request, response) => {
			try {
				const url = new URL(request.url, 'http://127.0.0.1');
				const pathname = decodeURIComponent(url.pathname);

				if (pathname === '/') {
					response.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
					response.end(browserDocument);
					return;
				}
				if (pathname === '/progress') {
					progress.push({stage: url.searchParams.get('stage') ?? 'unknown', time: Date.now()});
					response.writeHead(204);
					response.end();
					return;
				}
				if (pathname === '/control.json') {
					response.writeHead(200, {'content-type': 'application/json; charset=utf-8'});
					response.end(this._jsonBytes(control));
					return;
				}
				const layerMatch = pathname.match(/^\/artifact\/layer-([0-9]+)\.f32$/u);
				if (request.method === 'POST' && layerMatch !== null && Number(layerMatch[1]) < layerCount) {
					if (uploads.has(pathname)) {
						throw new Error('Offline compiler browser attempted a duplicate layer upload.');
					}
					uploads.set(pathname, await this._readRequestBody(request, 16 * 1024 * 1024));
					response.writeHead(204);
					response.end();
					return;
				}
				if (!pathname.startsWith('/repository/') || pathname.includes('..')) {
					throw new Error('Offline compiler browser requested an unsupported path.');
				}

				const target = path.resolve(this._repositoryRoot, pathname.slice('/repository/'.length));
				const canonicalRepositoryRoot = await realpath(this._repositoryRoot);
				const canonicalTarget = await realpath(target);
				if (!canonicalTarget.startsWith(`${canonicalRepositoryRoot}${path.sep}`)) {
					throw new Error('Offline compiler browser path escapes the repository root.');
				}
				const information = await lstat(canonicalTarget);
				if (!information.isFile() || information.isSymbolicLink()) {
					throw new Error('Offline compiler browser target is not a real file.');
				}

				response.writeHead(200, {'content-type': this._contentType(canonicalTarget)});
				response.end(await readFile(canonicalTarget));
			} catch (error) {
				response.writeHead(500, {'content-type': 'text/plain; charset=utf-8'});
				response.end(error.message);
			}
		});
	}

	/**
	 * Called by compilation to execute the browser page through Chrome DevTools Protocol.
	 *
	 * @param {string} url - The loopback compiler page URL.
	 * @param {string} profilePath - The isolated Chrome profile path.
	 * @returns {Promise<DistantSunSceneCacheCompilerBrowserExecution>} - The decoded browser result and diagnostics.
	 */
	async _executeBrowser(url, profilePath) {
		const child = spawn(
			this._chromePath,
			[
				'--headless=new',
				'--enable-gpu',
				'--enable-webgl',
				'--ignore-gpu-blocklist',
				...(process.platform === 'win32' ? ['--use-angle=d3d11'] : []),
				'--disable-software-rasterizer',
				'--disable-breakpad',
				'--disable-crash-reporter',
				'--disable-component-update',
				'--disable-background-networking',
				'--remote-debugging-port=0',
				'--no-first-run',
				`--user-data-dir=${profilePath}`,
				url,
			],
			{windowsHide: true},
		);
		const stderr = [];
		child.stderr.on('data', (value) => stderr.push(value));
		const deadline = Date.now() + this._timeoutMilliseconds;

		try {
			let port;
			while (Date.now() < deadline) {
				try {
					port = Number(
						(await readFile(path.join(profilePath, 'DevToolsActivePort'), 'utf8')).split(/\r?\n/u)[0],
					);
					break;
				} catch {
					await new Promise((resolve) => setTimeout(resolve, 100));
				}
			}
			if (!Number.isInteger(port)) throw new Error('Chrome did not publish its DevTools port.');

			let target;
			while (Date.now() < deadline) {
				const targets = await fetch(`http://127.0.0.1:${port}/json/list`)
					.then((response) => response.json())
					.catch(() => []);
				target = targets.find((item) => item.type === 'page' && item.url === url);
				if (target) break;
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
			if (!target?.webSocketDebuggerUrl) throw new Error('Chrome did not publish the compiler page target.');

			const socket = new WebSocket(target.webSocketDebuggerUrl);
			await new Promise((resolve, reject) => {
				socket.addEventListener('open', resolve, {once: true});
				socket.addEventListener('error', reject, {once: true});
			});
			let nextId = 1;
			const pending = new Map();
			socket.addEventListener('message', (event) => {
				const message = JSON.parse(event.data);
				const record = pending.get(message.id);
				if (!record) return;
				pending.delete(message.id);
				if (message.error) record.reject(new Error(message.error.message));
				else record.resolve(message.result);
			});
			const command = (method, params = {}) =>
				new Promise((resolve, reject) => {
					const id = nextId;
					nextId += 1;
					pending.set(id, {resolve, reject});
					socket.send(JSON.stringify({id, method, params}));
				});
			await command('Runtime.enable');
			let content = 'pending';
			while (Date.now() < deadline) {
				const evaluation = await command('Runtime.evaluate', {
					expression: "document.querySelector('#result')?.textContent ?? 'pending'",
					returnByValue: true,
				});
				content = evaluation.result?.value ?? 'pending';
				if (content !== 'pending') break;
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
			socket.close();
			if (content === 'pending') throw new Error('Offline compiler browser did not finish before timeout.');
			const result = JSON.parse(content);
			if (result.error)
				throw new Error(`${result.error.name}: ${result.error.message}\n${result.error.stack ?? ''}`);

			return {result, stderr: Buffer.concat(stderr).toString('utf8')};
		} finally {
			if (child.exitCode === null) {
				child.kill();
				await new Promise((resolve) => child.once('exit', resolve));
			}
		}
	}

	/**
	 * Called by compilation to derive the exact seam payload from the uncompressed logical oracle.
	 *
	 * @param {Buffer} oracle - The wavelength-major logical W27 R32F payload.
	 * @param {number} packedRowCount - The number of retained altitude/solar-zenith rows.
	 * @returns {DistantSunSceneCacheSeamEncoding} - The exact derivative and logical index bytes.
	 */
	_encodeExactSeams(oracle, packedRowCount, spectralChannelCount = 15) {
		const domain = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER;
		const logicalValues = new Float32Array(oracle.buffer, oracle.byteOffset, oracle.byteLength / 4);
		const uniqueValues = new Float32Array(domain.uniqueDirectionCount * packedRowCount * spectralChannelCount);
		const representatives = new Int32Array(domain.uniqueDirectionCount);
		representatives.fill(-1);
		for (let logicalIndex = 0; logicalIndex < domain.directionCount; logicalIndex += 1) {
			const uniqueIndex = domain.logicalToUniqueDirectionIndices[logicalIndex];
			if (representatives[uniqueIndex] === -1) representatives[uniqueIndex] = logicalIndex;
		}

		for (let layerIndex = 0; layerIndex < spectralChannelCount; layerIndex += 1) {
			for (let packedRow = 0; packedRow < packedRowCount; packedRow += 1) {
				const logicalBase = (layerIndex * packedRowCount + packedRow) * domain.directionCount;
				const uniqueBase = (layerIndex * packedRowCount + packedRow) * domain.uniqueDirectionCount;
				for (let uniqueIndex = 0; uniqueIndex < domain.uniqueDirectionCount; uniqueIndex += 1) {
					uniqueValues[uniqueBase + uniqueIndex] = logicalValues[logicalBase + representatives[uniqueIndex]];
				}
			}
		}

		return {
			payload: Buffer.from(uniqueValues.buffer),
			logicalToUniqueIndex: Buffer.from(
				domain.logicalToUniqueDirectionIndices.buffer,
				domain.logicalToUniqueDirectionIndices.byteOffset,
				domain.logicalToUniqueDirectionIndices.byteLength,
			),
		};
	}

	/**
	 * Called by compilation to write one content-addressed payload and return its manifest reference.
	 *
	 * @param {string} outputDirectory - The empty package directory.
	 * @param {string} stem - The semantic payload stem.
	 * @param {string} extension - The filename extension.
	 * @param {Buffer} bytes - The exact payload bytes.
	 * @param {string} codecId - The payload codec identity.
	 * @returns {Promise<DistantSunSceneCachePayloadReference>} - The content-addressed manifest reference.
	 */
	async _writePayload(outputDirectory, stem, extension, bytes, codecId) {
		const sha256 = this._sha256(bytes);
		const relativePath = `${stem}-${sha256}.${extension}`;
		await writeFile(path.join(outputDirectory, relativePath), bytes, {flag: 'wx'});
		return {path: relativePath, byteLength: bytes.byteLength, sha256, codecId};
	}

	/**
	 * Execute one isolated offline GPU layer compilation into a newly-created output directory.
	 * Callers own validation and transactional publication of the returned layers.
	 */
	async compileLayers({outputDirectory: requestedOutput, control, browserModulePath, layerCount}) {
		await lstat(this._chromePath);
		if (!Number.isInteger(layerCount) || layerCount < 1 || layerCount > 256) {
			throw new RangeError('Offline compiler layer count must be an integer from 1 through 256.');
		}
		if (
			typeof browserModulePath !== 'string' ||
			!browserModulePath.startsWith('/repository/') ||
			browserModulePath.includes('..')
		) {
			throw new RangeError('Offline compiler browser module must be a repository-rooted module path.');
		}
		const outputDirectory = path.resolve(requestedOutput);
		await lstat(outputDirectory)
			.then(() => {
				throw new Error('Offline compiler output directory must not already exist.');
			})
			.catch((error) => {
				if (error.code !== 'ENOENT') throw error;
			});
		await mkdir(outputDirectory, {recursive: false});
		const canonicalOutput = await realpath(outputDirectory);
		if (canonicalOutput !== outputDirectory) {
			throw new Error('Offline compiler output directory must resolve exactly and may not traverse a link.');
		}

		const uploads = new Map();
		const progress = [];
		const server = this._createServer(uploads, progress, control, browserModulePath, layerCount);
		const profilePath = path.join(outputDirectory, '.chrome-profile');
		await mkdir(profilePath);
		let browserExecution;
		try {
			await new Promise((resolve, reject) => {
				server.once('error', reject);
				server.listen(0, '127.0.0.1', resolve);
			});
			browserExecution = await this._executeBrowser(`http://127.0.0.1:${server.address().port}/`, profilePath);
		} finally {
			await new Promise((resolve) => server.close(() => resolve()));
			await rm(profilePath, {recursive: true, force: true, maxRetries: 20, retryDelay: 250});
		}

		const layers = Array.from({length: layerCount}, (_unused, index) =>
			uploads.get(`/artifact/layer-${index}.f32`),
		);
		if (layers.some((layer) => !layer)) {
			throw new Error('Offline compiler did not emit every requested wavelength layer.');
		}
		return {outputDirectory, layers, progress, browserExecution};
	}

	/**
	 * Call this method to compile and emit one independently loadable, content-addressed scene-cache package.
	 *
	 * The output directory must not already exist. Browser construction is offline only; runtime code never imports this owner.
	 *
	 * @param {DistantSunSceneCacheOfflineCompileRequest} request - The empty output directory for the package.
	 * @returns {Promise<DistantSunSceneCacheOfflineCompileResult>} - The manifest, paths, hashes, and GPU build report.
	 */
	async compile(request) {
		const scene = request.scene ?? DistantSunSceneCacheCompilerInputs.createQualifiedSanJoseNauticalScene();
		const inputSet = DistantSunSceneCacheCompilerInputs.createInputSet(scene);
		const {outputDirectory, layers, progress, browserExecution} = await this.compileLayers({
			outputDirectory: request.outputDirectory,
			control: {scene},
			browserModulePath: '/repository/scripts/algorithm32/solar-zenith-cache/runOfflineCompilerBrowser.js',
			layerCount: 15,
		});
		const expectedLayerByteLength = inputSet.ledger.retainedBlockCount * 4374 * 4;
		if (layers.some((layer) => !layer || layer.byteLength !== expectedLayerByteLength)) {
			throw new Error('Offline compiler did not emit every exact logical-W27 wavelength layer.');
		}
		const oracle = Buffer.concat(layers);
		if (oracle.byteLength !== inputSet.ledger.oracleByteLength) {
			throw new Error('Offline compiler oracle byte length does not match the executable ledger.');
		}
		const seamEncoding = this._encodeExactSeams(oracle, inputSet.ledger.retainedBlockCount);
		if (
			seamEncoding.payload.byteLength + seamEncoding.logicalToUniqueIndex.byteLength !==
			inputSet.ledger.exactSeamByteLength
		) {
			throw new Error('Offline compiler exact-seam byte length does not match the executable ledger.');
		}

		const oraclePayload = await this._writePayload(
			outputDirectory,
			'oracle-native15-c4-w27',
			'f32',
			oracle,
			DISTANT_SUN_SCENE_CACHE_ORACLE_CODEC_ID,
		);
		const exactSeamPayload = await this._writePayload(
			outputDirectory,
			'exact-seam-native15-c4-w27',
			'f32',
			seamEncoding.payload,
			DISTANT_SUN_SCENE_CACHE_EXACT_SEAM_CODEC_ID,
		);
		const logicalToUniqueIndex = await this._writePayload(
			outputDirectory,
			'w27-logical-to-unique',
			'u16',
			seamEncoding.logicalToUniqueIndex,
			DISTANT_SUN_SCENE_CACHE_EXACT_SEAM_CODEC_ID,
		);
		const ledgerBytes = this._jsonBytes(inputSet.ledger.toRecord());
		const ledgerSha256 = this._sha256(ledgerBytes);
		const ledgerPath = `packed-row-ledger-${ledgerSha256}.json`;
		await writeFile(path.join(outputDirectory, ledgerPath), ledgerBytes, {flag: 'wx'});
		const derivation = {
			schemaId: 'algorithm32-distant-sun-scene-cache-derivation-v1',
			compilerIdentity: inputSet.compilerIdentity,
			numericalIdentity: inputSet.numericalIdentity,
			parentEvidence: [
				'000569-point-local-scene-cache-p8-owner-decision',
				'000572-point-local-scene-cache-p9-w27-asset',
				'000579-point-local-scene-cache-p10-seam-dedup',
			],
			operation:
				'GPU actual-point J1; direct L1; L1->J2; J2->L2; L2->J3; J3->L3; L3->J4; C4=J1+J2+J3+J4, one Native15 wavelength at a time',
			inputs: {
				scene: inputSet.scene,
				domains: ['Native48', 'Z180', 'W27', 'reflection-completed F68', 'Native15'],
				maximumScatteringOrder: 4,
				constructionTransportIntervals: 15,
				viewRuntimeIdentity: 'Q30 quadratic-near-observer',
				atmosphereIdentity: 'algorithm32-canonical-plus-bruneton-ozone-300du-v1',
			},
			tool: {node: process.version, platform: process.platform, architecture: process.arch},
			outputs: {oraclePayload, exactSeamPayload, logicalToUniqueIndex, ledgerSha256},
		};
		const compatibilityBytes = this._jsonBytes({
			sceneSun: inputSet.scene.sceneSun,
			numericalIdentity: inputSet.numericalIdentity,
			ledgerSha256,
			oracleSha256: oraclePayload.sha256,
		});
		const cacheIdentity = `algorithm32-distant-sun-scene-cache-sha256:${this._sha256(compatibilityBytes)}`;
		const manifest = {
			schemaId: DISTANT_SUN_SCENE_CACHE_MANIFEST_SCHEMA_ID,
			cacheIdentity,
			sceneSun: inputSet.scene.sceneSun,
			atmosphereIdentity: 'algorithm32-canonical-plus-bruneton-ozone-300du-v1',
			geometryIdentity: 'algorithm32-spherical-earth-6360-6420km-v1',
			groundIdentity: 'algorithm32-canonical-black-ground-boundary-v1',
			numericalIdentity: inputSet.numericalIdentity,
			ledgerPath,
			ledgerSha256,
			oraclePayload,
			exactSeamPayload,
			logicalToUniqueIndex,
			derivation,
		};
		const manifestBytes = this._jsonBytes(manifest);
		const manifestSha256 = this._sha256(manifestBytes);
		const manifestPath = `scene-cache-manifest-${manifestSha256}.json`;
		await writeFile(path.join(outputDirectory, manifestPath), manifestBytes, {flag: 'wx'});
		const report = {
			schemaId: 'algorithm32-distant-sun-scene-cache-compiler-report-v1',
			accepted: true,
			manifestPath,
			manifestSha256,
			cacheIdentity,
			browser: browserExecution.result,
			browserStderr: browserExecution.stderr,
			progress,
		};
		await writeFile(path.join(outputDirectory, 'compiler-report.json'), this._jsonBytes(report), {flag: 'wx'});

		return {outputDirectory, manifestPath, manifestSha256, manifest, report};
	}
}
