import {spawn} from 'node:child_process';
import {createHash, randomUUID} from 'node:crypto';
import {lstat, mkdir, readFile, realpath} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';
import {validateChannelDiagnostics} from '../../sky-accuracy-dials/continuation/capture/diagnostics.js';

export const BROWSER_MODULE_PATH = 'experiments/sky-angular-quadrature/gpu/browser.js';
const COMPILER_MODULE_PATH = 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
const MAXIMUM_CHANNEL_BYTES = 8 * 1024 * 1024;

/** Reject invalid host/browser boundary data. @param {unknown} condition @param {string} message */
function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

/** Hash exact transport/source bytes. @param {Uint8Array} bytes @returns {string} */
function hash(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

/** Identify a bounded canonical tool file. @param {string} requested @returns {Promise<SkyGpuExecutable>} */
async function toolIdentity(requested) {
	const absolute = await ordinaryAbsolute(requested);
	const facts = await lstat(absolute);
	requireCondition(
		facts.isFile() && facts.size <= 256 * 1024 * 1024,
		'GPU tool file is not an ordinary bounded file.',
	);
	const bytes = await readFile(absolute);
	return {path: absolute, byteLength: bytes.length, sha256: hash(bytes)};
}

/** Resolve and reject aliased path components. @param {string} requested @returns {Promise<string>} */
async function ordinaryAbsolute(requested) {
	const absolute = path.resolve(requested);
	let cursor = path.parse(absolute).root;
	for (const component of absolute.slice(cursor.length).split(path.sep)) {
		cursor = path.join(cursor, component);
		const facts = await lstat(cursor);
		requireCondition(!facts.isSymbolicLink(), 'GPU host path traverses a link.');
		requireCondition(
			(await realpath(cursor)).toLowerCase() === cursor.toLowerCase(),
			'GPU host path traverses an alias.',
		);
	}
	return absolute;
}

/** Accept an ordinary repository module path. @param {string} value @returns {string} */
function modulePath(value) {
	requireCondition(
		typeof value === 'string' && /^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*\.(?:js|mjs)$/u.test(value),
		'GPU module path is invalid.',
	);
	requireCondition(
		!value.split('/').some((part) => part === '.' || part === '..'),
		'GPU module traversal is forbidden.',
	);
	return value;
}

/** Bound an operation and clear its timer. @template T @param {Promise<T>} operation @param {number} milliseconds @param {string} message @returns {Promise<T>} */
async function bounded(operation, milliseconds, message) {
	let timer;
	try {
		/** @type {Promise<never>} */
		const expiration = new Promise((_resolve, reject) => {
			timer = setTimeout(() => reject(new Error(message)), milliseconds);
		});
		return await Promise.race([operation, expiration]);
	} finally {
		clearTimeout(timer);
	}
}

/** Collect one bounded upload. @param {SkyGpuBodyStream} request @param {number} maximumBytes @returns {Promise<Buffer>} */
async function readBody(request, maximumBytes) {
	const chunks = [];
	let length = 0;
	for await (const chunk of request) {
		length += chunk.length;
		requireCondition(length <= maximumBytes, 'GPU upload exceeded its declared byte limit.');
		chunks.push(chunk);
	}
	return Buffer.concat(chunks);
}

/**
 * Validate a compact binary64 upload at the external browser boundary.
 * @param {Buffer} bytes - Length-prefixed JSON and Float64 little-endian words.
 * @param {number} channel - Expected channel selected by the recipe.
 * @param {number} expectedOrderCount - Explicitly admitted recurrence length.
 * @param {string} compilerReportSchema - Exact admitted completion schema.
 * @param {readonly string[]} expectedFieldIds - Exact source-field callback sequence for the selected compiler.
 * @param {boolean} adaptiveMetadata - Explicit registered screen operations permit at most2MiB metadata.
 * @returns {SkyGpuChannel} - Validated spectra and their compiler metadata.
 */
function decodeChannel(bytes, channel, expectedOrderCount, compilerReportSchema, expectedFieldIds, adaptiveMetadata) {
	requireCondition(bytes.length >= 4, 'GPU channel envelope is truncated.');
	const headerLength = bytes.readUInt32LE(0);
	requireCondition(
		headerLength > 0 &&
			headerLength <= (adaptiveMetadata ? 2 : 1) * 1024 * 1024 &&
			headerLength + 4 <= bytes.length,
		'GPU channel metadata length is invalid.',
	);
	/** @type {SkyGpuChannelHeader} */
	const header = JSON.parse(bytes.subarray(4, headerLength + 4).toString('utf8'));
	requireCondition(header.channel === channel, 'GPU upload channel does not match its endpoint.');
	const shape = header.shape;
	requireCondition(
		shape &&
			shape.orderCount === expectedOrderCount &&
			[shape.representationCount, shape.viewCount, shape.rayCount].every(
				(value) => Number.isInteger(value) && value > 0,
			),
		'GPU spectrum shape is invalid.',
	);
	const count = shape.representationCount * shape.viewCount * shape.orderCount * shape.rayCount;
	requireCondition(
		Number.isSafeInteger(count) && bytes.length === 4 + headerLength + count * 8,
		'GPU spectra do not fill the declared shape.',
	);
	requireCondition(
		Array.isArray(header.fieldChecks) && header.fieldChecks.length === expectedFieldIds.length,
		'GPU field checks are incomplete.',
	);
	for (const [index, check] of header.fieldChecks.entries()) {
		requireCondition(
			check.fieldId === expectedFieldIds[index] && Number.isInteger(check.count) && check.count > 0,
			'GPU pure-field identity/count is invalid.',
		);
		requireCondition(
			check.count === header.fieldChecks[0].count,
			'GPU sparse fields have different coordinate counts.',
		);
		requireCondition(
			Number.isFinite(check.minimum) &&
				check.minimum >= 0 &&
				Number.isFinite(check.maximum) &&
				check.maximum >= check.minimum,
			'GPU pure-field range is invalid.',
		);
		for (const value of [check.pureSha256, check.cumulativeSha256])
			requireCondition(/^[a-f0-9]{64}$/u.test(value), 'GPU sparse-field hash is invalid.');
	}
	requireCondition(
		header.compilerReport?.schemaId === compilerReportSchema &&
			header.compilerReport.wavelength.index === channel &&
			header.compilerReport.finalLiveFieldBytes === 0 &&
			header.compilerReport.compiledCaches.length === 0,
		'GPU compiler did not satisfy completion/resource checks.',
	);
	requireCondition(
		Number.isFinite(header.evaluationMilliseconds) && header.evaluationMilliseconds >= 0,
		'GPU evaluation timing is invalid.',
	);
	if (header.diagnostics !== undefined) validateChannelDiagnostics(header.diagnostics);
	const values = new Float64Array(count);
	const spectra = bytes.subarray(4 + headerLength);
	for (let index = 0; index < count; index++) {
		values[index] = spectra.readDoubleLE(index * 8);
		requireCondition(
			Number.isFinite(values[index]) && values[index] >= 0,
			'GPU derived spectrum contains an invalid value.',
		);
	}
	return {...header, values, spectraSha256: hash(spectra)};
}

/**
 * Run one isolated, bounded GPU capture with root-owned evidence callbacks.
 * Production modules are authenticated dynamic read-only inputs. This host writes
 * only its Chrome profile under the supplied scratch owner and never deletes it.
 * @param {B1GpuHostOptions} options - Frozen recipe, authenticated source reader and owning-run callbacks.
 * @returns {Promise<SkyGpuHostResult>} - Execution, module, timing and explicit cleanup evidence, including failures.
 */
export async function runGpu(options) {
	const started = Date.now();
	const repository = await ordinaryAbsolute(options.repositoryRoot);
	const implementationRepository = await ordinaryAbsolute(fileURLToPath(new URL('../../../', import.meta.url)));
	requireCondition(
		repository.toLowerCase() === implementationRepository.toLowerCase(),
		'GPU repository root disagrees with its source location.',
	);
	const scratch = await ordinaryAbsolute(options.scratchDirectory);
	const scratchBoundary = path.join(repository, 'tmp', 'experiments', 'sky-accuracy-dials', 'scratch');
	requireCondition(
		scratch.toLowerCase().startsWith(`${scratchBoundary.toLowerCase()}${path.sep}`),
		'GPU profile must be inside this experiment scratch root.',
	);
	requireCondition((await lstat(scratch)).isDirectory(), 'GPU scratch owner must be a directory.');
	const chromePath = await ordinaryAbsolute(options.chromePath);
	const chromeFacts = await lstat(chromePath);
	requireCondition(
		chromeFacts.isFile() && chromeFacts.size <= 256 * 1024 * 1024,
		'GPU executable is not an ordinary bounded file.',
	);
	const chromeBytes = await readFile(chromePath);
	const chrome = {path: chromePath, byteLength: chromeBytes.length, sha256: hash(chromeBytes)};
	const compilerModulePath = modulePath(options.compilerModulePath ?? COMPILER_MODULE_PATH);
	const browserModulePath = modulePath(options.browserModulePath ?? BROWSER_MODULE_PATH);
	const expectedOrderCount = options.expectedOrderCount ?? 4;
	const compilerReportSchema = options.compilerReportSchema ?? 'algorithm32-distant-sun-offline-wavelength-result-v1';
	const expectedFieldIds =
		options.expectedFieldIds ?? Array.from({length: expectedOrderCount}, (_value, index) => `J${index + 1}`);
	const speciesIds = ['J1', 'J2-rayleigh', 'J2-mie', 'J3-rayleigh', 'J3-mie', 'J4-rayleigh', 'J4-mie'];
	const densityMode = compilerReportSchema === 'sky-density-wavelength-result-v1';
	requireCondition(
		(expectedOrderCount === 4 && compilerReportSchema === 'algorithm32-distant-sun-offline-wavelength-result-v1') ||
			(expectedOrderCount === 6 && compilerReportSchema === 'sky-order-wavelength-result-v1') ||
			(expectedOrderCount === 4 && compilerReportSchema === 'sky-ground-boundary-wavelength-result-v1') ||
			(expectedOrderCount === 4 && densityMode),
		'GPU recurrence length and completion schema must be an explicitly supported pair.',
	);
	requireCondition(
		JSON.stringify(expectedFieldIds) ===
			JSON.stringify(
				densityMode ? speciesIds : Array.from({length: expectedOrderCount}, (_value, index) => `J${index + 1}`),
			),
		'GPU field identifiers do not match the explicitly admitted compiler schema.',
	);
	requireCondition(
		browserModulePath.startsWith('experiments/sky-angular-quadrature/'),
		'Browser entry must be the read-only authenticated benchmark harness.',
	);
	const timeout = options.timeoutMilliseconds ?? 7_500_000;
	requireCondition(
		Number.isInteger(timeout) && timeout >= 1000 && timeout <= 7_500_000,
		'GPU timeout is outside the experiment bounds.',
	);
	requireCondition(
		options.control.channels.length > 0 &&
			options.control.channels.length <= 40 &&
			new Set(options.control.channels).size === options.control.channels.length &&
			options.control.channels.every((value) => Number.isInteger(value) && value >= 0 && value < 40),
		'GPU channels must be a unique Direct40 selection.',
	);
	const controlBytes = Buffer.from(JSON.stringify(options.control));
	requireCondition(
		controlBytes.length <= 4 * 1024 * 1024,
		'GPU control must be a compact recipe, not an expanded view plan.',
	);
	const identities = new Map(options.sourceIdentities.map((identity) => [identity.path, identity]));
	requireCondition(
		identities.size === options.sourceIdentities.length,
		'GPU source allowlist contains duplicate paths.',
	);
	requireCondition(
		identities.has(browserModulePath) && identities.has(compilerModulePath),
		'GPU browser/compiler entries must be authenticated in the allowlist.',
	);
	/** @type {Map<string, Buffer>} */
	const sourceBytes = new Map();
	/** @type {Map<string, SkyGpuSourceIdentity>} */
	const served = new Map();
	for (const identity of options.sourceIdentities) {
		if (!/\.(?:js|mjs)$/u.test(identity.path)) continue;
		modulePath(identity.path);
		const absolute = await ordinaryAbsolute(path.join(repository, identity.path));
		requireCondition(
			absolute.toLowerCase().startsWith(`${repository.toLowerCase()}${path.sep}`),
			'GPU source escaped repository identity.',
		);
		const bytes = Buffer.from(await options.readSource(identity.path));
		requireCondition(
			bytes.length === identity.byteLength && hash(bytes) === identity.sha256,
			`GPU source identity mismatch: ${identity.path}`,
		);
		sourceBytes.set(identity.path, bytes);
	}
	const profile = path.join(scratch, 'browser-profile');
	await mkdir(profile, {recursive: false});
	await ordinaryAbsolute(profile);
	const prefix = `/${randomUUID()}`;
	/** @type {SkyGpuChannelSummary[]} */
	const channels = [];
	/** @type {Set<Promise<void>>} */
	const pendingDeliveries = new Set();
	/** @type {Set<number>} */
	const channelClaims = new Set();
	/** @type {SkyGpuBrowserResult | null} */
	let browserResult = null;
	/** @type {SkyGpuAutomationBrowser | null} */
	let browser = null;
	/** @type {SkyGpuAutomationIdentity | null} */
	let automationIdentity = null;
	/** @type {string | null} */
	let browserVersion = null;
	/** @type {SkyGpuOwnedChrome | null} */
	let child = null;
	let failure = null,
		stderrTail = '',
		servedSourcesReauthenticated = false;
	let settled = false,
		finishing = false;
	let resourceTimer;
	/** @type {Promise<void> | null} */
	let resourceObservation = null;
	/** @type {Error | null} */
	let resourceFailure = null;
	let progressTail = Promise.resolve();
	/** @type {(value: SkyGpuBrowserResult) => void} */
	let complete;
	/** @type {(reason: Error) => void} */
	let rejectCompletion;
	/** @type {Promise<SkyGpuBrowserResult>} */
	const completion = new Promise((resolve, reject) => {
		complete = resolve;
		rejectCompletion = reject;
	});
	// Attach rejection handling immediately, including failures before navigation.
	completion.catch(() => {});
	const abort = (error) => {
		if (!settled && !finishing) {
			settled = true;
			rejectCompletion(error instanceof Error ? error : new Error(String(error)));
		}
	};
	/** Poll only this host's owned browser; reject, time out or cancel before allowing further work. @returns {Promise<void>} */
	const observeResources = async () => {
		if (!options.observeResources) return;
		requireCondition(
			child && Number.isSafeInteger(child.pid) && child.pid > 0,
			'Resource admission requires the exact owned Chrome PID.',
		);
		const cancellation = new AbortController();
		try {
			await bounded(
				options.observeResources({
					hostPid: process.pid,
					chromePid: child.pid,
					elapsedMilliseconds: Date.now() - started,
					signal: cancellation.signal,
				}),
				10000,
				'GPU resource observer exceeded its ten-second deadline.',
			);
		} catch (error) {
			cancellation.abort();
			resourceFailure = error instanceof Error ? error : new Error(String(error));
			abort(resourceFailure);
			if (child && child.exitCode === null && child.signalCode === null) {
				cleanup.forcedChildKill = true;
				child.kill();
			}
			throw resourceFailure;
		}
	};
	const emit = (event) => {
		progressTail = progressTail.then(() => options.onProgress(event));
		progressTail.catch(abort);
		return progressTail;
	};
	const server = createServer(async (request, response) => {
		try {
			const url = new URL(request.url ?? '/', 'http://127.0.0.1');
			if (request.method === 'GET' && url.pathname === '/favicon.ico') {
				response.writeHead(404);
				response.end();
				return;
			}
			requireCondition(url.pathname.startsWith(`${prefix}/`), 'Unknown GPU host capability.');
			const relative = url.pathname.slice(prefix.length);
			if (request.method === 'GET' && relative === '/') {
				const entry = `${prefix}/module/${browserModulePath}`,
					compilerUrl = `${prefix}/module/${compilerModulePath}`;
				const document = `<!doctype html><meta charset="utf-8"><script type="module">import {runGpuBrowser} from ${JSON.stringify(entry)};runGpuBrowser(${JSON.stringify(prefix)},${JSON.stringify(compilerUrl)}).then(result=>fetch(${JSON.stringify(`${prefix}/complete`)},{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(result)})).catch(error=>fetch(${JSON.stringify(`${prefix}/failure`)},{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:error.message,stack:error.stack})}));</script>`;
				response.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
				response.end(document);
				return;
			}
			if (request.method === 'GET' && relative === '/control') {
				response.writeHead(200, {'content-type': 'application/json'});
				response.end(controlBytes);
				return;
			}
			if (request.method === 'GET' && relative.startsWith('/module/')) {
				const name = modulePath(relative.slice('/module/'.length)),
					bytes = sourceBytes.get(name);
				requireCondition(
					bytes !== undefined && identities.has(name),
					`GPU requested an unauthenticated module: ${name}`,
				);
				served.set(name, identities.get(name));
				response.writeHead(200, {'content-type': 'text/javascript; charset=utf-8'});
				response.end(bytes);
				return;
			}
			if (request.method === 'POST' && relative === '/progress') {
				/** @type {SkyGpuProgress} */
				const event = JSON.parse((await readBody(request, 16 * 1024)).toString('utf8'));
				requireCondition(
					typeof event.phase === 'string' && typeof event.message === 'string',
					'GPU progress schema is invalid.',
				);
				await emit(event);
				response.writeHead(204);
				response.end();
				return;
			}
			const match = relative.match(/^\/channel\/([0-9]+)$/u);
			if (request.method === 'POST' && match) {
				const channel = Number(match[1]);
				requireCondition(
					options.control.channels.includes(channel) && !channelClaims.has(channel),
					'GPU channel upload is unrequested or duplicated.',
				);
				requireCondition(
					channel === options.control.channels[channels.length],
					'GPU channel upload order changed.',
				);
				channelClaims.add(channel);
				const record = decodeChannel(
					await readBody(request, MAXIMUM_CHANNEL_BYTES),
					channel,
					expectedOrderCount,
					compilerReportSchema,
					expectedFieldIds,
					options.control.continuation?.referenceMode === 'adaptive',
				);
				requireCondition(
					record.diagnostics === undefined || options.control.continuation !== undefined,
					'GPU continuation diagnostics require an explicit capture recipe.',
				);
				const selection = options.control.continuation;
				if (record.diagnostics?.operations) {
					requireCondition(
						selection?.referenceMode === 'adaptive',
						'Unrequested adaptive operations were uploaded.',
					);
					for (const row of record.diagnostics.operations.rows.filter((item) => item.probeId !== null)) {
						const frozen = selection.probes.find((probe) => probe.probeId === row.probeId);
						requireCondition(
							frozen &&
								frozen.time === row.time &&
								frozen.gridX === row.gridX &&
								frozen.gridY === row.gridY,
							'Adaptive component identity differs from the frozen recipe.',
						);
					}
				}
				if (record.diagnostics?.groundDensities) {
					requireCondition(
						selection?.groundDensityProbes?.length === 4,
						'Unrequested ground densities were uploaded.',
					);
					for (const [index, row] of record.diagnostics.groundDensities.rows.entries()) {
						const frozen = selection.groundDensityProbes[index];
						requireCondition(
							frozen.probeId === row.probeId &&
								frozen.time === row.time &&
								frozen.gridX === row.gridX &&
								frozen.gridY === row.gridY,
							'Ground-density identity differs from the frozen recipe.',
						);
					}
				}
				requireCondition(
					record.shape.representationCount === options.control.controls.representations.length &&
						record.shape.viewCount ===
							options.control.controls.viewIntervals.length *
								options.control.controls.solarInterpolations.length &&
						record.shape.rayCount ===
							options.control.scenes.length * 81 + (options.control.horizonWitness ? 9 : 0),
					'GPU spectrum shape disagrees with the compact recipe.',
				);
				const delivery = options.onChannel(record);
				pendingDeliveries.add(delivery);
				try {
					await delivery;
				} finally {
					pendingDeliveries.delete(delivery);
				}
				const {values: _values, ...summary} = record;
				channels.push(summary);
				response.writeHead(204);
				response.end();
				return;
			}
			if (request.method === 'POST' && relative === '/complete') {
				/** @type {SkyGpuBrowserResult} */
				const result = JSON.parse((await readBody(request, 1024 * 1024)).toString('utf8'));
				requireCondition(
					!settled &&
						result.schemaId === 'sky-gpu-browser-result-v1' &&
						JSON.stringify(result.channels) === JSON.stringify(options.control.channels) &&
						channels.length === options.control.channels.length,
					'GPU completion is inconsistent.',
				);
				settled = true;
				complete(result);
				response.writeHead(204);
				response.end();
				return;
			}
			if (request.method === 'POST' && relative === '/failure') {
				const error = JSON.parse((await readBody(request, 64 * 1024)).toString('utf8'));
				abort(new Error(`Browser capture failed: ${error.message}\n${error.stack ?? ''}`));
				response.writeHead(204);
				response.end();
				return;
			}
			throw new Error('GPU host endpoint is unsupported.');
		} catch (error) {
			abort(error);
			if (!response.headersSent) response.writeHead(400, {'content-type': 'text/plain'});
			response.end(error instanceof Error ? error.message : String(error));
		}
	});
	/** @type {SkyGpuCleanup} */
	const cleanup = {browserClosed: false, childExited: false, serverClosed: false, forcedChildKill: false};
	const interrupt = () => abort(new Error('GPU capture interrupted by process signal.'));
	process.once('SIGINT', interrupt);
	process.once('SIGTERM', interrupt);
	let heartbeat;
	try {
		await emit({
			phase: 'gpu-start',
			message: 'Starting authenticated single-channel GPU capture.',
			completed: 0,
			total: options.control.channels.length,
		});
		heartbeat = setInterval(() => {
			void emit({
				phase: 'gpu',
				message: 'GPU capture heartbeat.',
				completed: channels.length,
				total: options.control.channels.length,
			});
		}, 25000);
		await new Promise((resolve, reject) => {
			server.once('error', reject);
			server.listen(0, '127.0.0.1', () => resolve(null));
		});
		const address = server.address();
		requireCondition(address && typeof address !== 'string', 'GPU host did not bind loopback TCP.');
		const url = `http://127.0.0.1:${typeof address === 'object' ? address.port : 0}${prefix}/`;
		child = spawn(
			chromePath,
			[
				'--headless=new',
				'--enable-gpu',
				'--enable-webgl',
				'--ignore-gpu-blocklist',
				'--disable-software-rasterizer',
				'--disable-background-networking',
				'--disable-component-update',
				'--no-first-run',
				'--remote-debugging-port=0',
				...(process.platform === 'win32' ? ['--use-angle=d3d11'] : []),
				`--user-data-dir=${profile}`,
				'about:blank',
			],
			{windowsHide: true, stdio: ['ignore', 'ignore', 'pipe']},
		);
		child.once('error', abort);
		child.once('exit', (code, signal) => {
			if (!finishing) abort(new Error(`Owned Chrome exited before completion (${code ?? signal}).`));
		});
		child.stderr.on('data', (bytes) => {
			stderrTail = (stderrTail + Buffer.from(bytes).toString('utf8')).slice(-65536);
		});
		await observeResources();
		if (options.observeResources) {
			resourceTimer = setInterval(() => {
				if (resourceObservation || settled || finishing) return;
				resourceObservation = observeResources();
				resourceObservation
					.catch(() => {})
					.finally(() => {
						resourceObservation = null;
					});
			}, 5000);
		}
		const deadline = Date.now() + Math.min(timeout, 30000);
		let endpoint = '';
		while (!endpoint && Date.now() < deadline && !settled) {
			try {
				const portPath = await ordinaryAbsolute(path.join(profile, 'DevToolsActivePort'));
				const [port, suffix] = (await readFile(portPath, 'utf8')).trim().split(/\r?\n/u);
				requireCondition(
					/^[0-9]+$/u.test(port) && suffix.startsWith('/devtools/browser/'),
					'Owned Chrome endpoint is invalid.',
				);
				endpoint = `ws://127.0.0.1:${port}${suffix}`;
			} catch (error) {
				if (error.code !== 'ENOENT') throw error;
				await delay(100);
			}
		}
		requireCondition(endpoint, 'Owned Chrome did not publish a debugger endpoint.');
		const packageName = 'puppeteer';
		const entry = await toolIdentity(fileURLToPath(import.meta.resolve(packageName)));
		const manifest = await toolIdentity(path.join(repository, 'node_modules', 'puppeteer', 'package.json'));
		const packageRecord = JSON.parse((await readFile(manifest.path)).toString('utf8'));
		requireCondition(typeof packageRecord.version === 'string', 'Automation package version is missing.');
		automationIdentity = {version: packageRecord.version, entry, manifest};
		/** @type {SkyGpuAutomationModule} */
		const automation = await bounded(import(packageName), 30000, 'Automation module load timed out.');
		browser = await bounded(
			automation.connect({browserWSEndpoint: endpoint, defaultViewport: null}),
			30000,
			'Cannot connect to owned Chrome.',
		);
		browserVersion = await bounded(browser.version(), 30000, 'Owned Chrome version query timed out.');
		const page = await bounded(browser.newPage(), 30000, 'Owned Chrome page creation timed out.');
		page.on('pageerror', abort);
		await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 30000});
		browserResult = await bounded(
			completion,
			Math.max(1, timeout - (Date.now() - started)),
			'GPU capture exceeded its execution timeout.',
		);
		for (const identity of served.values()) {
			const bytes = await options.readSource(identity.path);
			requireCondition(
				bytes.byteLength === identity.byteLength && hash(bytes) === identity.sha256,
				`Served GPU source changed: ${identity.path}`,
			);
		}
		servedSourcesReauthenticated = true;
		for (const identity of [automationIdentity.entry, automationIdentity.manifest]) {
			const current = await toolIdentity(identity.path);
			requireCondition(
				current.byteLength === identity.byteLength && current.sha256 === identity.sha256,
				'Installed automation changed during capture.',
			);
		}
	} catch (error) {
		failure = error instanceof Error ? (error.stack ?? error.message) : String(error);
	} finally {
		finishing = true;
		clearInterval(heartbeat);
		clearInterval(resourceTimer);
		if (resourceObservation) {
			try {
				await resourceObservation;
			} catch (error) {
				failure ??= String(error);
			}
		}
		failure ??= resourceFailure?.message ?? null;
		try {
			await progressTail;
		} catch (error) {
			failure ??= String(error);
		}
		if (browser) {
			try {
				await bounded(browser.close(), 10000, 'Owned Chrome close timed out.');
				cleanup.browserClosed = true;
			} catch (error) {
				failure ??= String(error);
				try {
					browser.disconnect();
				} catch {}
			}
		}
		if (child) {
			if (child.exitCode === null && child.signalCode === null) {
				cleanup.forcedChildKill = true;
				child.kill();
			}
			try {
				if (child.exitCode === null && child.signalCode === null)
					await bounded(
						new Promise((resolve) => child.once('exit', resolve)),
						10000,
						'Owned Chrome did not exit after cleanup.',
					);
				cleanup.childExited = child.exitCode !== null || child.signalCode !== null;
			} catch (error) {
				failure ??= String(error);
			}
		} else cleanup.childExited = true;
		try {
			server.closeAllConnections();
			if (server.listening)
				await bounded(
					new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve(null)))),
					10000,
					'GPU loopback server did not close.',
				);
			cleanup.serverClosed = true;
		} catch (error) {
			failure ??= String(error);
		}
		// A run must never seal while one of its already admitted writes is active.
		await Promise.allSettled([...pendingDeliveries]);
		process.removeListener('SIGINT', interrupt);
		process.removeListener('SIGTERM', interrupt);
	}
	try {
		await ordinaryAbsolute(chromePath);
		const bytes = await readFile(chromePath);
		requireCondition(
			bytes.length === chrome.byteLength && hash(bytes) === chrome.sha256,
			'Executed Chrome binary changed during capture.',
		);
	} catch (error) {
		failure ??= String(error);
	}
	const executionSucceeded =
		failure === null &&
		browserResult !== null &&
		servedSourcesReauthenticated &&
		cleanup.browserClosed &&
		cleanup.childExited &&
		cleanup.serverClosed;
	return {
		schemaId: 'sky-gpu-host-result-v1',
		executionSucceeded,
		failure,
		browser: browserResult,
		channels,
		servedSources: [...served.values()],
		servedSourcesReauthenticated,
		chrome,
		browserVersion,
		automation: automationIdentity,
		nodeVersion: process.version,
		stderrTail,
		cleanup,
		elapsedMilliseconds: Date.now() - started,
	};
}
