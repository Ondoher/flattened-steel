import {createHash} from 'node:crypto';
import {appendFile, lstat, mkdir, readFile, readdir, realpath, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import puppeteer from 'puppeteer';
import {requireHeavyExecution} from './heavy-execution-admission.js';

const sourcePath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(sourcePath), '../..');
const outputRoot = path.join(repositoryRoot, 'tmp/experiments/local-sun-cache-reuse');
const require = createRequire(import.meta.url);

/** Checks every existing path segment against its declared root before access.
 * @param {string} root - Declared absolute root.
 * @param {string} target - Absolute destination or input.
 * @returns {Promise<void>} - Resolves only for an unaliased contained path.
 */
async function checkPath(root, target) {
	root = path.resolve(root);
	target = path.resolve(target);
	const relative = path.relative(root, target);
	if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative))
		throw new Error('Path escaped its declared root.');
	let current = root;
	for (const segment of ['', ...relative.split(path.sep).filter(Boolean)]) {
		current = segment ? path.join(current, segment) : current;
		try {
			const facts = await lstat(current);
			if (facts.isSymbolicLink() || (await realpath(current)).toLowerCase() !== current.toLowerCase())
				throw new Error('Symlink, junction or reparse alias rejected.');
		} catch (error) {
			if (error.code !== 'ENOENT') throw error;
		}
	}
}

/** Derives an artifact identity from its exact bytes.
 * @param {Uint8Array} bytes - Closed artifact contents.
 * @returns {string} - Lowercase SHA-256 digest.
 */
function hash(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

/** Inspects the browser without computing an atmospheric field.
 * @returns {LocalSunEnvironmentBrowserFacts} - Capability facts from this context.
 */
function inspectBrowser() {
	const gl = document.createElement('canvas').getContext('webgl2');
	const debug = gl?.getExtension('WEBGL_debug_renderer_info');
	return {
		webgl2: Boolean(gl),
		floatColor: Boolean(gl?.getExtension('EXT_color_buffer_float')),
		renderer: gl ? String(gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER)) : null,
		vendor: gl ? String(gl.getParameter(debug ? debug.UNMASKED_VENDOR_WEBGL : gl.VENDOR)) : null,
		maximumTextureSize: gl ? Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) : 0,
		fragmentTextureUnits: gl ? Number(gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)) : 0,
		videoEncoder: 'VideoEncoder' in globalThis,
		secureContext: globalThis.isSecureContext,
	};
}

/** Runs a setup-only probe, retaining each attempt as a new immutable run.
 * @returns {Promise<void>} - Resolves after the terminal manifest is published.
 */
async function main() {
	await requireHeavyExecution();
	await checkPath(repositoryRoot, path.join(repositoryRoot, 'AGENTS.md'));
	await readFile(path.join(repositoryRoot, 'AGENTS.md'));
	await checkPath(repositoryRoot, outputRoot);
	const runsRoot = path.join(outputRoot, 'runs');
	await checkPath(outputRoot, runsRoot);
	await mkdir(runsRoot, {recursive: true});
	const entries = await readdir(runsRoot);
	if (entries.some((name) => /^\d{5}/u.test(name) && !/^\d{5}-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(name)))
		throw new Error('Malformed prefixed run entry.');
	let maximum = -1;
	for (const name of entries) {
		if (!/^\d{5}-/u.test(name)) continue;
		if (name.length > 22) throw new Error('Run name exceeds the contract.');
		await checkPath(runsRoot, path.join(runsRoot, name));
		if (!(await lstat(path.join(runsRoot, name))).isDirectory()) throw new Error('Run entry is not a directory.');
		maximum = Math.max(maximum, Number(name.slice(0, 5)));
	}
	if (maximum >= 99999) throw new Error('Run sequence exhausted.');
	const runName = `${String(maximum + 1).padStart(5, '0')}-environment`;
	const runRoot = path.join(runsRoot, runName);
	await checkPath(runsRoot, runRoot);
	await mkdir(runRoot);
	const progressPath = path.join(runRoot, 'progress.jsonl');
	/** Appends a flushed progress event owned by this run.
	 * @param {string} phase - Current setup phase.
	 * @param {string} message - Human-readable operation.
	 * @param {LocalSunEnvironmentRunState} [state] - Terminal outcome, if any.
	 * @returns {Promise<void>} - Event append completion.
	 */
	const progress = async (phase, message, state) => {
		await checkPath(runRoot, progressPath);
		await appendFile(
			progressPath,
			`${JSON.stringify({timestamp: new Date().toISOString(), phase, message, ...(state ? {state} : {})})}\n`,
		);
	};
	let progressTail = Promise.resolve();
	await progress('start', 'Inspect CPU tools, read-only film parent and browser capabilities.');
	const heartbeat = setInterval(() => {
		progressTail = progressTail.then(() => progress('working', 'Environment inspection is active.'));
	}, 25000);
	/** @type {LocalSunEnvironmentRunState} */
	let state = 'failed';
	let failure = null;
	try {
		const dependencies = [];
		for (const name of [
			'typescript',
			'three',
			'puppeteer',
			'rollup',
			'@rollup/plugin-node-resolve',
			'@rollup/plugin-commonjs',
			'mediabunny',
			'pngjs',
		]) {
			const resolved = require.resolve(name);
			await checkPath(repositoryRoot, resolved);
			dependencies.push({
				name,
				path: path.relative(repositoryRoot, resolved).replaceAll('\\', '/'),
				sha256: hash(await readFile(resolved)),
			});
		}
		const evidenceRoot = process.env.ALGORITHM32_THE_HOURS_EVIDENCE_ROOT;
		if (!evidenceRoot || !path.isAbsolute(evidenceRoot))
			throw new Error('Set ALGORITHM32_THE_HOURS_EVIDENCE_ROOT to an absolute read-only parent root.');
		const parentConstantsUrl = new URL('../../scripts/flat32/the-hours/consts.js', import.meta.url);
		await checkPath(repositoryRoot, fileURLToPath(parentConstantsUrl));
		/** @type {LocalSunEnvironmentArtifactIdentity} */
		const parentIdentity = (await import(parentConstantsUrl.href)).THE_HOURS_ORIGINAL;
		const parentPath = path.resolve(evidenceRoot, parentIdentity.path);
		await checkPath(evidenceRoot, parentPath);
		const parentBytes = await readFile(parentPath);
		if (parentBytes.length !== parentIdentity.byteLength || hash(parentBytes) !== parentIdentity.sha256)
			throw new Error('Original film trace identity mismatch.');
		await progress('browser', 'Launch a browser with its profile contained in this run.');
		const profilePath = path.join(runRoot, 'profile');
		await checkPath(runRoot, profilePath);
		const executablePath =
			process.env.LOCAL_SUN_CACHE_CHROME_EXECUTABLE ??
			(process.platform === 'win32'
				? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
				: puppeteer.executablePath());
		const args = [
			'--enable-gpu',
			'--use-angle=d3d11',
			'--ignore-gpu-blocklist',
			'--disable-background-timer-throttling',
			'--disable-breakpad',
			'--disable-crash-reporter',
			'--noerrdialogs',
		];
		const browser = await puppeteer.launch({headless: 'new', executablePath, userDataDir: profilePath, args});
		let browserFacts;
		let browserVersion;
		const host = createServer((request, response) => {
			response.writeHead(request.url === '/' ? 200 : 404, {'content-type': 'text/html; charset=utf-8'});
			response.end('<!doctype html><html lang="en"><title>Local-Sun environment</title></html>');
		});
		try {
			await new Promise((resolve, reject) => {
				host.once('error', reject);
				host.listen(0, '127.0.0.1', () => resolve(undefined));
			});
			const address = host.address();
			if (!address || typeof address === 'string') throw new Error('Loopback host did not acquire a TCP port.');
			const page = await browser.newPage();
			await page.goto(`http://127.0.0.1:${address.port}/`, {waitUntil: 'load'});
			browserFacts = await page.evaluate(inspectBrowser);
			browserVersion = await browser.version();
		} finally {
			try {
				await browser.close();
				await checkPath(runRoot, profilePath);
				await rm(profilePath, {recursive: true, force: true});
			} finally {
				if (host.listening)
					await new Promise((resolve, reject) =>
						host.close((error) => (error ? reject(error) : resolve(undefined))),
					);
			}
		}
		const result = {
			schema: 'local-sun-cache-reuse-environment-v1',
			run: runName,
			node: process.version,
			platform: process.platform,
			dependencies,
			browser: {
				version: browserVersion,
				executablePath,
				executableSha256: hash(await readFile(executablePath)),
				args,
				context: 'HTTP loopback',
				facts: browserFacts,
			},
			parent: {root: evidenceRoot, ...parentIdentity},
			derivation: {
				operation:
					'Resolve installed tool modules, authenticate the immutable original film trace, and inspect WebGL2/browser capabilities without building an atmospheric cache.',
				command: 'node experiments/local-sun-cache-reuse/inspect-environment.js',
				inputs: [
					{
						path: 'experiments/local-sun-cache-reuse/inspect-environment.js',
						sha256: hash(await readFile(sourcePath)),
					},
					{
						path: 'scripts/flat32/the-hours/consts.js',
						sha256: hash(await readFile(path.join(repositoryRoot, 'scripts/flat32/the-hours/consts.js'))),
					},
					{
						path: 'package-lock.json',
						sha256: hash(await readFile(path.join(repositoryRoot, 'package-lock.json'))),
					},
				],
			},
			claim: 'Setup capability only; no GPU cache build, numerical accuracy, performance, or 4K encoding qualification.',
		};
		await writeFile(path.join(runRoot, 'result.json'), `${JSON.stringify(result, null, '\t')}\n`, {flag: 'wx'});
		if (!browserFacts.webgl2 || !browserFacts.floatColor)
			throw new Error('Required WebGL2 float-color capability is unavailable.');
		state = 'accepted';
	} catch (error) {
		failure = String(error.message);
	} finally {
		clearInterval(heartbeat);
		await progressTail;
		await progress('terminal', failure ?? 'Environment capability inspection completed.', state);
	}
	/** @type {LocalSunEnvironmentArtifactIdentity[]} */
	const artifacts = [];
	/** Hashes retained evidence after removing disposable browser state.
	 * @param {string} directory - Contained directory being inventoried.
	 * @returns {Promise<void>} - Complete recursive inventory.
	 */
	async function inventory(directory) {
		await checkPath(runRoot, directory);
		for (const entry of await readdir(directory, {withFileTypes: true})) {
			const target = path.join(directory, entry.name);
			await checkPath(runRoot, target);
			if (entry.isDirectory()) await inventory(target);
			else {
				const bytes = await readFile(target);
				artifacts.push({
					path: path.relative(runRoot, target).replaceAll('\\', '/'),
					byteLength: bytes.length,
					sha256: hash(bytes),
				});
			}
		}
	}
	await inventory(runRoot);
	await writeFile(
		path.join(runRoot, 'manifest.json'),
		`${JSON.stringify({schema: 'local-sun-cache-reuse-run-v1', run: runName, state, failure, artifacts}, null, '\t')}\n`,
		{flag: 'wx'},
	);
	console.log(JSON.stringify({run: path.relative(repositoryRoot, runRoot).replaceAll('\\', '/'), state, failure}));
	if (state !== 'accepted') process.exitCode = 1;
}

await main();
