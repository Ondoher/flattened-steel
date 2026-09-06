import {spawn} from 'node:child_process';
import {createReadStream} from 'node:fs';
import {lstat, mkdir, readFile, realpath, rm, stat} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';

import {ensureSafeDirectory} from '../../harness/lib/atomic-files.js';
import {assertNoReparseEntries} from '../../harness/lib/containment.js';
import {sha256, sha256File} from '../../harness/lib/hashes.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	REPOSITORY_ROOT,
	assertLexicallyContained,
	pathComparisonKey,
} from '../../harness/lib/roots.js';
import {
	COLOR_RESET_BROWSER_PROFILES_ROOT,
	COLOR_RESET_OUTPUT_ROOT,
} from './color-reset-run-record.js';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const COLOR_RESET_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'color-reset');

function delay(milliseconds) {
	return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

async function withinDeadline(promise, deadline, label) {
	const remaining = deadline - Date.now();
	if (remaining <= 0) throw new Error(`${label} exceeded the browser deadline.`);
	let timeout = null;
	try {
		return await Promise.race([
			promise,
			new Promise((resolvePromise, reject) => {
				timeout = setTimeout(
					() => reject(new Error(`${label} exceeded the browser deadline.`)),
					remaining,
				);
			}),
		]);
	} finally {
		if (timeout !== null) clearTimeout(timeout);
	}
}

function contentType(target) {
	if (target.endsWith('.js')) return 'text/javascript; charset=utf-8';
	if (target.endsWith('.json')) return 'application/json; charset=utf-8';
	if (target.endsWith('.html')) return 'text/html; charset=utf-8';
	if (target.endsWith('.png')) return 'image/png';
	return 'application/octet-stream';
}

async function canonicalDirectory(directory, label) {
	const absolute = path.resolve(directory);
	const facts = await lstat(absolute);
	if (!facts.isDirectory() || facts.isSymbolicLink()) {
		throw new Error(`${label} must be an ordinary directory.`);
	}
	const canonical = await realpath(absolute);
	if (pathComparisonKey(canonical) !== pathComparisonKey(absolute)) {
		throw new Error(`${label} must not traverse a link or junction.`);
	}
	return canonical;
}

async function requestBody(request, maximumBytes) {
	const chunks = [];
	let length = 0;
	for await (const chunk of request) {
		length += chunk.length;
		if (length > maximumBytes) throw new Error('Browser upload exceeds its declared limit.');
		chunks.push(chunk);
	}
	return Buffer.concat(chunks);
}

async function executeChromeCdp({url, profilePath, timeoutMilliseconds}) {
	const child = spawn(
		CHROME_PATH,
		[
			'--headless=new',
			'--enable-gpu',
			'--enable-webgl',
			'--ignore-gpu-blocklist',
			'--use-angle=d3d11',
			'--disable-software-rasterizer',
			'--disable-breakpad',
			'--disable-crash-reporter',
			'--disable-component-update',
			'--disable-background-networking',
			'--disable-gpu-shader-disk-cache',
			'--no-first-run',
			'--remote-debugging-port=0',
			`--user-data-dir=${profilePath}`,
			url,
		],
		{windowsHide: true},
	);
	const stdout = [];
	const stderr = [];
	child.stdout.on('data', (value) => stdout.push(value));
	child.stderr.on('data', (value) => stderr.push(value));
	let spawnError = null;
	const childExit = new Promise((resolvePromise) => {
		child.once('exit', resolvePromise);
		child.once('error', (error) => {
			spawnError = error;
			resolvePromise(error);
		});
	});
	const chromeError = (message) => {
		const diagnostic = Buffer.concat(stderr).toString('utf8').trim();
		const error = new Error(diagnostic.length === 0 ? message : `${message}\n${diagnostic}`);
		error.stdout = Buffer.concat(stdout).toString('utf8');
		error.stderr = Buffer.concat(stderr).toString('utf8');
		return error;
	};
	const requireChromeRunning = (stage) => {
		if (spawnError !== null) {
			throw chromeError(`Chrome failed to launch while ${stage}: ${spawnError.message}`);
		}
		if (child.exitCode !== null || child.signalCode !== null) {
			throw chromeError(`Chrome exited while ${stage}.`);
		}
	};
	const childStillRunning = () => child.exitCode === null && child.signalCode === null;
	const deadline = Date.now() + timeoutMilliseconds;
	let socket = null;
	let executionError = null;
	let completedOutput = null;
	try {
		let port = null;
		while (Date.now() < deadline) {
			try {
				port = Number((await readFile(path.join(profilePath, 'DevToolsActivePort'), 'utf8')).split(/\r?\n/u)[0]);
				break;
			} catch {
				requireChromeRunning('publishing its DevTools port');
				await delay(100);
			}
		}
		if (!Number.isInteger(port)) throw chromeError('Chrome did not publish its DevTools port.');

		let target = null;
		while (Date.now() < deadline) {
			requireChromeRunning('publishing its page target');
			const targets = await withinDeadline(
				fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json()),
				deadline,
				'Chrome target discovery',
			).catch(() => []);
			target = targets.find((item) => item.type === 'page' && item.url === url)
				?? targets.find((item) => item.type === 'page');
			if (target) break;
			await delay(100);
		}
		if (!target?.webSocketDebuggerUrl) {
			throw chromeError('Chrome did not publish a page debugging target.');
		}

		socket = new WebSocket(target.webSocketDebuggerUrl);
		await withinDeadline(
			new Promise((resolvePromise, reject) => {
				socket.addEventListener('open', resolvePromise, {once: true});
				socket.addEventListener('error', reject, {once: true});
			}),
			deadline,
			'Chrome DevTools socket connection',
		);
		let nextId = 1;
		const pending = new Map();
		const rejectPending = (message) => {
			const error = chromeError(message);
			for (const record of pending.values()) record.reject(error);
			pending.clear();
		};
		socket.addEventListener('message', (event) => {
			let message;
			try {
				message = JSON.parse(event.data);
			} catch {
				rejectPending('Chrome DevTools returned malformed JSON.');
				return;
			}
			if (!message.id) return;
			const record = pending.get(message.id);
			if (!record) return;
			pending.delete(message.id);
			if (message.error) record.reject(new Error(message.error.message));
			else record.resolve(message.result);
		});
		socket.addEventListener('close', () => rejectPending('Chrome DevTools socket closed unexpectedly.'));
		socket.addEventListener('error', () => rejectPending('Chrome DevTools socket failed.'));
		const cdp = (method, parameters = {}) =>
			withinDeadline(new Promise((resolvePromise, reject) => {
				const id = nextId;
				nextId += 1;
				pending.set(id, {resolve: resolvePromise, reject});
				socket.send(JSON.stringify({id, method, params: parameters}));
			}), deadline, `Chrome CDP ${method}`);
		await cdp('Runtime.enable');
		const browserVersion = await cdp('Browser.getVersion');
		let content = 'pending';
		while (Date.now() < deadline) {
			const evaluated = await cdp('Runtime.evaluate', {
				expression: "document.querySelector('#result')?.textContent ?? 'pending'",
				returnByValue: true,
			});
			content = evaluated.result?.value ?? 'pending';
			if (content !== 'pending') break;
			await delay(1000);
		}
		if (content === 'pending') throw chromeError('Chrome page did not finish before the timeout.');
		const documentResult = await cdp('Runtime.evaluate', {
			expression: 'document.documentElement.outerHTML',
			returnByValue: true,
		});
		completedOutput = {
			browserVersion,
			document: documentResult.result?.value ?? '',
			resultText: content,
			stdout: Buffer.concat(stdout).toString('utf8'),
			stderr: Buffer.concat(stderr).toString('utf8'),
		};
		return completedOutput;
	} catch (error) {
		executionError = error instanceof Error ? error : new Error(String(error));
		executionError.stdout ??= Buffer.concat(stdout).toString('utf8');
		executionError.stderr ??= Buffer.concat(stderr).toString('utf8');
		if (completedOutput !== null) {
			executionError.browserVersion ??= completedOutput.browserVersion;
			executionError.document ??= completedOutput.document;
			executionError.resultText ??= completedOutput.resultText;
		}
		throw executionError;
	} finally {
		const cleanupErrors = [];
		try {
			socket?.close();
		} catch (cleanupError) {
			cleanupErrors.push(cleanupError);
		}
		if (childStillRunning()) child.kill();
		if (childStillRunning()) {
			await Promise.race([childExit, delay(5000)]).catch(() => {});
		}
		if (childStillRunning()) {
			child.kill('SIGKILL');
			await Promise.race([childExit, delay(5000)]).catch(() => {});
		}
		if (childStillRunning()) {
			cleanupErrors.push(chromeError('Chrome did not terminate after the CR0 browser run.'));
		}
		if (cleanupErrors.length > 0) {
			if (executionError !== null) {
				executionError.cleanupErrors = [
					...(executionError.cleanupErrors ?? []),
					...cleanupErrors.map((cleanupError) =>
						cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
					),
				];
			} else {
				const cleanupFailure = new AggregateError(cleanupErrors, 'Chrome cleanup failed.');
				cleanupFailure.cleanupErrors = cleanupErrors.map((cleanupError) =>
					cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
				);
				if (completedOutput !== null) {
					cleanupFailure.browserVersion = completedOutput.browserVersion;
					cleanupFailure.document = completedOutput.document;
					cleanupFailure.resultText = completedOutput.resultText;
					cleanupFailure.stdout = completedOutput.stdout;
					cleanupFailure.stderr = completedOutput.stderr;
				}
				throw cleanupFailure;
			}
		}
	}
}

async function removeBrowserProfile(profilePath) {
	try {
		const profileFacts = await lstat(profilePath);
		if (!profileFacts.isDirectory() || profileFacts.isSymbolicLink()) {
			throw new Error('Color-reset browser profile is not an ordinary directory.');
		}
		const [profileRoot, canonicalProfile] = await Promise.all([
			realpath(COLOR_RESET_BROWSER_PROFILES_ROOT),
			realpath(profilePath),
		]);
		assertLexicallyContained(profileRoot, canonicalProfile, 'color-reset browser profile');
		if (pathComparisonKey(canonicalProfile) !== pathComparisonKey(path.resolve(profilePath))) {
			throw new Error('Color-reset browser profile resolves through a link or junction.');
		}
		await assertNoReparseEntries(canonicalProfile, 'Color-reset browser profile');
		await rm(canonicalProfile, {recursive: true, force: false, maxRetries: 20, retryDelay: 250});
	} catch (error) {
		if (error?.code !== 'ENOENT') throw error;
	}
}

/** Execute one browser/GPU experiment inside the color-reset namespace. */
export async function executeColorResetBrowser({
	run,
	modulePath,
	exportName,
	servedRoots = {},
	importMap = {},
	allowedArtifactPaths,
	uploadLimitBytes = 32 * 1024 * 1024,
	timeoutMilliseconds = 900_000,
}) {
	if (!Array.isArray(allowedArtifactPaths) || allowedArtifactPaths.length === 0) {
		throw new Error('Color-reset browser requires an explicit artifact allowlist.');
	}
	const allowedUploads = new Set(allowedArtifactPaths);
	if (allowedUploads.size !== allowedArtifactPaths.length) {
		throw new Error('Color-reset browser artifact allowlist contains duplicates.');
	}
	const chromeFacts = await lstat(CHROME_PATH);
	if (!chromeFacts.isFile() || chromeFacts.isSymbolicLink()) {
		throw new Error('Color-reset Chrome executable must be an ordinary file.');
	}
	const canonicalChromePath = await realpath(CHROME_PATH);
	if (pathComparisonKey(canonicalChromePath) !== pathComparisonKey(CHROME_PATH)) {
		throw new Error('Color-reset Chrome executable must not traverse a link or junction.');
	}
	const chromeExecutable = {
		requestedPath: CHROME_PATH,
		canonicalPath: canonicalChromePath,
		byteLength: chromeFacts.size,
		sha256: await sha256File(canonicalChromePath),
	};
	await ensureSafeDirectory(COLOR_RESET_OUTPUT_ROOT, COLOR_RESET_BROWSER_PROFILES_ROOT);
	const roots = new Map([
		['/browser/', path.join(run.runDirectory, 'browser')],
		['/lane/', COLOR_RESET_ROOT],
		['/dependencies/', EXPERIMENT_NODE_MODULES_ROOT],
		...Object.entries(servedRoots),
	]);
	const canonicalRoots = new Map();
	for (const [prefix, root] of roots) {
		if (!/^\/[a-z0-9-]+\/$/u.test(prefix)) throw new Error(`Invalid served prefix: ${prefix}`);
		canonicalRoots.set(prefix, await canonicalDirectory(root, `Served root ${prefix}`));
	}

	const requests = [];
	const progressEvents = [];
	const uploads = [];
	const serverErrors = [];
	const server = createServer(async (request, response) => {
		try {
			const url = new URL(request.url, 'http://127.0.0.1');
			const pathname = decodeURIComponent(url.pathname);
			requests.push({method: request.method, path: pathname, time: new Date().toISOString()});
			if (pathname === '/progress') {
				const stage = url.searchParams.get('stage');
				if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(stage ?? '')) {
					throw new Error('Browser progress stage is invalid.');
				}
				progressEvents.push({stage, completedAt: new Date().toISOString()});
				response.writeHead(204);
				response.end();
				return;
			}
			if (request.method === 'GET' && pathname === '/favicon.ico') {
				response.writeHead(204);
				response.end();
				return;
			}
			if (request.method === 'POST' && pathname.startsWith('/artifact/')) {
				const artifactPath = pathname.slice('/artifact/'.length);
				if (
					!allowedUploads.has(artifactPath) ||
					uploads.some((entry) => entry.path === artifactPath)
				) {
					throw new Error('Browser artifact path is not allowed or is duplicated.');
				}
				const bytes = await requestBody(request, uploadLimitBytes);
				await run.writeArtifact(artifactPath, bytes);
				uploads.push({
					path: artifactPath,
					byteLength: bytes.length,
					sha256: sha256(bytes),
					completedAt: new Date().toISOString(),
				});
				response.writeHead(204);
				response.end();
				return;
			}
			if (request.method !== 'GET') throw new Error('Unsupported browser request method.');
			const route = [...canonicalRoots].find(([prefix]) => pathname.startsWith(prefix));
			if (!route || pathname.includes('..')) throw new Error('Unsupported browser path.');
			const [prefix, root] = route;
			const relativePath = pathname.slice(prefix.length);
			if (relativePath.length === 0) throw new Error('Browser request does not identify a file.');
			const target = path.resolve(root, relativePath);
			assertLexicallyContained(root, target, 'served browser file');
			const facts = await lstat(target);
			if (!facts.isFile() || facts.isSymbolicLink()) throw new Error('Served target is not an ordinary file.');
			const canonicalTarget = await realpath(target);
			assertLexicallyContained(root, canonicalTarget, 'served real browser file');
			if (pathComparisonKey(canonicalTarget) !== pathComparisonKey(target)) {
				throw new Error('Served browser file traverses a link or junction.');
			}
			const size = (await stat(canonicalTarget)).size;
			response.writeHead(200, {
				'cache-control': prefix === '/cache/' ? 'public, max-age=31536000, immutable' : 'no-store',
				'content-length': String(size),
				'content-type': contentType(canonicalTarget),
			});
			createReadStream(canonicalTarget)
				.on('error', (error) => {
					serverErrors.push({
						time: new Date().toISOString(),
						method: request.method,
						path: request.url,
						message: error instanceof Error ? error.message : String(error),
					});
					response.destroy(error);
				})
				.pipe(response);
		} catch (error) {
			serverErrors.push({
				time: new Date().toISOString(),
				method: request.method,
				path: request.url,
				message: error instanceof Error ? error.message : String(error),
			});
			if (!response.headersSent) response.writeHead(500, {'content-type': 'text/plain; charset=utf-8'});
			response.end(error instanceof Error ? error.message : String(error));
		}
	});

	let profilePath = null;
	let browserOutput = null;
	let primaryError = null;
	const operationDeadline = Date.now() + timeoutMilliseconds;
	try {
		const html = '<!doctype html><meta charset="utf-8"><script type="importmap">'
			+ JSON.stringify({imports: importMap})
			+ '</script><pre id="result">pending</pre><script type="module">'
			+ 'window.colorResetProgress=async(stage)=>{const response=await fetch(`/progress?stage=${encodeURIComponent(stage)}`);if(!response.ok)throw new Error(`Progress upload failed: HTTP ${response.status}.`);};'
			+ 'const target=document.querySelector("#result");try{'
			+ `const module=await import(${JSON.stringify(modulePath)});`
			+ `target.textContent=JSON.stringify(await module[${JSON.stringify(exportName)}]());`
			+ '}catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}'
			+ '</script>';
		await run.writeArtifact('browser/index.html', html);
		await withinDeadline(
			new Promise((resolvePromise, reject) => {
				server.once('error', reject);
				server.listen(0, '127.0.0.1', resolvePromise);
			}),
			operationDeadline,
			'Color-reset HTTP server startup',
		);
		profilePath = assertLexicallyContained(
			COLOR_RESET_BROWSER_PROFILES_ROOT,
			path.join(COLOR_RESET_BROWSER_PROFILES_ROOT, run.runId),
			'color-reset browser profile',
		);
		await mkdir(profilePath, {recursive: false});
		await canonicalDirectory(profilePath, 'Color-reset browser profile');
		browserOutput = await executeChromeCdp({
			url: `http://127.0.0.1:${server.address().port}/browser/index.html`,
			profilePath,
			timeoutMilliseconds: Math.max(1, operationDeadline - Date.now()),
		});
		const result = JSON.parse(browserOutput.resultText);
		if (result.error) {
			const error = new Error(
				`${result.error.name}: ${result.error.message}\n${result.error.stack ?? ''}`,
			);
			error.document = browserOutput.document;
			error.stdout = browserOutput.stdout;
			error.stderr = browserOutput.stderr;
			throw error;
		}
		const runtimeEnvironment = {
			schemaId: 'algorithm32-color-reset-browser-runtime-environment-v1',
			chromeExecutable,
			browserVersion: browserOutput.browserVersion,
			requestedAngleBackend: 'd3d11',
		};
		await run.writeArtifact('browser/dom.html', browserOutput.document);
		await run.writeArtifact('browser/stdout.txt', browserOutput.stdout);
		await run.writeArtifact('browser/stderr.txt', browserOutput.stderr);
		await run.writeJsonArtifact('browser/progress-events.json', progressEvents);
		await run.writeJsonArtifact('browser/requests.json', requests);
		await run.writeJsonArtifact('browser/uploads.json', uploads);
		await run.writeJsonArtifact('browser/server-errors.json', serverErrors);
		await run.writeJsonArtifact('browser/runtime-environment.json', runtimeEnvironment);
		return {
			result,
			uploads,
			progressEvents,
			requests,
			serverErrors,
			runtimeEnvironment,
		};
	} catch (caught) {
		primaryError = caught instanceof Error ? caught : new Error(String(caught));
		primaryError.browserEvidence = {
			uploads: uploads.map((entry) => ({...entry})),
			progressEvents: progressEvents.map((entry) => ({...entry})),
			requests: requests.map((entry) => ({...entry})),
			serverErrors: serverErrors.map((entry) => ({...entry})),
			chromeExecutable,
			browserVersion: browserOutput?.browserVersion ?? primaryError.browserVersion ?? null,
			requestedAngleBackend: 'd3d11',
		};
		const failureArtifacts = [
			['artifact', 'browser/dom-on-failure.html', browserOutput?.document ?? primaryError.document ?? ''],
			['artifact', 'browser/stdout-on-failure.txt', browserOutput?.stdout ?? primaryError.stdout ?? ''],
			['artifact', 'browser/stderr-on-failure.txt', browserOutput?.stderr ?? primaryError.stderr ?? ''],
			['json', 'browser/progress-on-failure.json', progressEvents],
			['json', 'browser/requests-on-failure.json', requests],
			['json', 'browser/uploads-on-failure.json', uploads],
			['json', 'browser/server-errors-on-failure.json', serverErrors],
			[
				'json',
				'browser/runtime-environment-on-failure.json',
				{
					schemaId: 'algorithm32-color-reset-browser-runtime-environment-v1',
					chromeExecutable,
					browserVersion: browserOutput?.browserVersion ?? primaryError.browserVersion ?? null,
					requestedAngleBackend: 'd3d11',
				},
			],
		];
		const evidenceErrors = [];
		for (const [kind, artifactPath, value] of failureArtifacts) {
			try {
				if (kind === 'json') await run.writeJsonArtifact(artifactPath, value);
				else await run.writeArtifact(artifactPath, value);
			} catch (evidenceError) {
				evidenceErrors.push(
					evidenceError instanceof Error ? evidenceError.message : String(evidenceError),
				);
			}
		}
		if (evidenceErrors.length > 0) primaryError.evidenceErrors = evidenceErrors;
		throw primaryError;
	} finally {
		const cleanupErrors = [];
		if (server.listening) {
			try {
				await withinDeadline(
					new Promise((resolvePromise, reject) =>
						server.close((error) => (error ? reject(error) : resolvePromise())),
					),
					Date.now() + 15_000,
					'Color-reset HTTP server shutdown',
				);
			} catch (cleanupError) {
				server.closeAllConnections?.();
				cleanupErrors.push(cleanupError);
			}
		}
		if (profilePath !== null) {
			try {
				await removeBrowserProfile(profilePath);
			} catch (cleanupError) {
				cleanupErrors.push(cleanupError);
			}
		}
		if (cleanupErrors.length > 0) {
			if (primaryError !== null) {
				primaryError.cleanupErrors = cleanupErrors.map((error) =>
					error instanceof Error ? error.message : String(error),
				);
			} else {
				const cleanupFailure = new AggregateError(
					cleanupErrors,
					'Color-reset browser cleanup failed.',
				);
				cleanupFailure.cleanupErrors = cleanupErrors.map((error) =>
					error instanceof Error ? error.message : String(error),
				);
				cleanupFailure.browserEvidence = {
					uploads: uploads.map((entry) => ({...entry})),
					progressEvents: progressEvents.map((entry) => ({...entry})),
					requests: requests.map((entry) => ({...entry})),
					serverErrors: serverErrors.map((entry) => ({...entry})),
					chromeExecutable,
					browserVersion: browserOutput?.browserVersion ?? null,
					requestedAngleBackend: 'd3d11',
				};
				throw cleanupFailure;
			}
		}
	}
}
