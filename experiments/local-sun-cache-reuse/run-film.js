import path from 'node:path';
import {readFile, rm, open} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import puppeteer from 'puppeteer';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot, checkPath, hash, hashFile} from './run-boundary.js';
import {requireHeavyExecution} from './heavy-execution-admission.js';
import {deriveFilmControls} from './prove-film.js';
import {createFilmVariant} from './film-variant.js';
const commonjs = createRequire(import.meta.url)('@rollup/plugin-commonjs');

/** Capture one explicitly bounded film stage into a new immutable run.
 * @returns {Promise<void>} - Streamed native MP4, sparse stills and complete source provenance.
 */
async function main() {
	await requireHeavyExecution();
	const run = await ExperimentRun.create('p6-film'),
		profile = path.join(run.root, 'profile');
	let browser,
		host,
		failure = null,
		videoFinalized = false,
		nextBatch = 0,
		videoBytes = 0;
	/** @type {Awaited<ReturnType<typeof open>> | undefined} */ let video;
	try {
		const option = process.argv[2];
		if (process.argv.length !== 3 || !/^--stage=(stills|motion|preview|final)$/u.test(option ?? ''))
			throw new Error('An explicit P6 stage is required.');
		const stage = /** @type {LocalSunFilmStage} */ (option.slice(8)),
			preview = stage === 'preview';
		const parents = await Promise.all(
			['contract.json', 'gates.json', 'layout.json'].map((name) => readParent('00478-p3-contract', name)),
		);
		const pinned = [
			'186b8be60929276c1208dbd72d2c648a3782cd4346c59f4a0c74efcc9826a704',
			'c5794fb707b7da7c87713e19ebaf77ae7e3816d6cc72e929958e12a4aa33210d',
			'd1c7dea2b0587474de5930d75e8e91e9fb61d20ed92faefce2ab7a239a290864',
		];
		if (parents.some((parent, index) => parent.artifactSha256 !== pinned[index]))
			throw new Error('Pinned shell policy changed.');
		const controls = deriveFilmControls(),
			variant = await createFilmVariant(),
			files = [],
			warnings = [];
		/** Bundle one checked entry and retain its complete dependency inventory.
		 * @param {string} name - Experiment entry basename.
		 * @returns {Promise<string>} - Executable browser bytes.
		 */
		async function bundle(name) {
			const entry = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name);
			await checkPath(repositoryRoot, entry);
			const build = await rollup({
				input: entry,
				plugins: [variant.plugin, nodeResolve({browser: true}), commonjs()],
				onwarn: (warning) => warnings.push({code: warning.code, message: warning.message}),
			});
			try {
				files.push(...build.watchFiles);
				return (await build.generate({format: 'iife'})).output[0].code.replaceAll(
					'process.env.NODE_ENV',
					JSON.stringify('production'),
				);
			} finally {
				await build.close();
			}
		}
		const code = await bundle('film-browser.js'),
			worker = await bundle('shell-phase-worker.js');
		const routes = new Map([
			['/bundle.js', Buffer.from(code)],
			['/phase-worker.js', Buffer.from(worker)],
		]);
		for (const [prefix, folder, names] of [
			[
				'catalog',
				'brightest-2000-stellar-package-v1',
				[
					'manifest.json',
					'catalog-roster.json',
					'native15-packets.json',
					'members-rgba32f.bin',
					'spectra-r32f.bin',
				],
			],
			['human-vision', 'human-vision-filter-package-v1', ['manifest.json', 'native15-scotopic-weights.json']],
		])
			for (const name of names) {
				const file = path.join(repositoryRoot, 'server/flat32/data', String(folder), name);
				await checkPath(repositoryRoot, file);
				routes.set('/' + prefix + '/' + name, await readFile(file));
				files.push(file);
			}
		for (const name of [
			'run-film.js',
			'film-variant.js',
			'film-director.js',
			'prove-film.js',
			'san-jose-winter-controls.js',
			'resolve-shell-state.js',
			'sun-coverage/correction.js',
			'ExperimentRun.js',
			'parent-evidence.js',
			'run-boundary.js',
			'run-resource-bounded.js',
			'heavy-execution-admission.js',
			'resource-monitor/windows-process-telemetry.js',
		])
			files.push(path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name));
		files.push(path.join(repositoryRoot, 'package-lock.json'));
		const identities = [];
		for (const file of [...new Set(files)].filter((name) => !name.startsWith('\0')).sort())
			identities.push({
				path: path.relative(repositoryRoot, file).replaceAll('\\', '/'),
				...(await hashFile(repositoryRoot, file)),
			});
		const implementationIdentity = hash(JSON.stringify(identities));
		/** @type {LocalSunFilmRecipe} */ const recipe = {
			stage,
			viewportSize: {width: preview ? 640 : 1920, height: preview ? 360 : 1080, units: 'pixels'},
			framesPerSecond: preview ? 6 : 30,
			durationSeconds: 90,
			segmentStartSeconds: stage === 'motion' ? 40 : 0,
			segmentDurationSeconds: stage === 'motion' ? 10 : 90,
			bitrate: preview ? 4000000 : 20000000,
			implementationIdentity,
			startObservation: controls.startObservation,
			seed: 3202609,
			base: {
				state: controls.state,
				diagnostic: false,
				angles: [0],
				motion: false,
				shellLayout: JSON.parse(new TextDecoder().decode(parents[2].bytes)),
				shellRuntime: true,
				currentApplication: true,
				shellScene: true,
				shellImplementationIdentity: implementationIdentity,
			},
		};
		await run.write('bundle.js', code);
		await run.write('phase-worker.js', worker);
		await run.write('recipe.json', JSON.stringify(recipe, null, '\t'));
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					schema: 'local-sun-p6-film-input-v1',
					command: process.argv,
					node: process.version,
					parents: parents.map(({bytes, ...identity}) => identity),
					controlsDerivation: controls.derivation,
					sources: identities,
					outputHashes: {bundle: hash(code), worker: hash(worker)},
					variant: variant.derivations,
					warnings,
					resourceOwnership: JSON.parse(process.env.LOCAL_SUN_HEAVY_EXECUTION),
					operation:
						'Resolve a new exact San Jose source clock; render the continuous scored camera with fixed physical Sun policy and persistent film-owned scene; serialize exact state publication and stream bounded ordered AVC batches.',
				},
				null,
				'\t',
			),
		);
		host = createServer((request, response) => {
			const bytes = routes.get(request.url);
			if (bytes) {
				response.setHeader(
					'Content-Type',
					request.url.endsWith('.js')
						? 'text/javascript'
						: request.url.endsWith('.json')
							? 'application/json'
							: 'application/octet-stream',
				);
				response.end(bytes);
			} else if (request.url === '/') {
				response.end('<!doctype html><script src="/bundle.js"></script>');
			} else {
				response.statusCode = 404;
				response.end();
			}
		});
		await new Promise((resolve, reject) => {
			host.once('error', reject);
			host.listen(0, '127.0.0.1', () => resolve(undefined));
		});
		const address = host.address();
		if (!address || typeof address === 'string') throw new Error('Loopback unavailable.');
		await checkPath(run.root, profile);
		const executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe',
			args = [
				'--enable-gpu',
				'--use-angle=d3d11',
				'--ignore-gpu-blocklist',
				'--disable-background-timer-throttling',
			];
		browser = await puppeteer.launch({
			executablePath,
			headless: 'new',
			userDataDir: profile,
			args,
			protocolTimeout: (stage === 'final' ? 45 : 10) * 60000,
		});
		await run.write(
			'browser.json',
			JSON.stringify(
				{
					version: await browser.version(),
					executablePath,
					executableSha256: hash(await readFile(executablePath)),
					args,
					profilePolicy: 'Fresh profile removed before sealing',
				},
				null,
				'\t',
			),
		);
		const page = await browser.newPage();
		await page.setViewport({
			width: recipe.viewportSize.width,
			height: recipe.viewportSize.height,
			deviceScaleFactor: 1,
		});
		page.on('console', (message) => {
			const value = message.text();
			if (!value.startsWith('THREE.WebGLProgram: Program Info Log:')) console.log(value);
			void run.progress('browser', value);
		});
		page.on('pageerror', (error) => {
			console.error(error);
			void run.progress('browser-error', String(error));
		});
		await page.exposeFunction('localSunFilmProgress', async (phase, message, completed, total) => {
			await run.progress(
				String(phase).slice(0, 80),
				JSON.stringify({message: String(message).slice(0, 4000), completed, total}),
			);
		});
		await page.exposeFunction('localSunFilmArtifact', async (name, value) => {
			if (
				typeof name !== 'string' ||
				!(
					/^(trace|lighting|proof|scene|milestones)\.json$/u.test(name) ||
					/^(milestone-[a-z0-9-]+|endpoint90)\.png$/u.test(name)
				) ||
				typeof value !== 'string' ||
				value.length > 32 * 1024 * 1024
			)
				throw new Error('Unexpected or oversized film artifact.');
			const parsed = JSON.parse(value);
			if (name.endsWith('.png')) {
				if (
					typeof parsed.dataUrl !== 'string' ||
					!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/u.test(parsed.dataUrl)
				)
					throw new Error('Malformed PNG artifact.');
				await run.write(name, Buffer.from(parsed.dataUrl.slice(parsed.dataUrl.indexOf(',') + 1), 'base64'));
			} else await run.write(name, JSON.stringify(parsed, null, '\t'));
		});
		await page.exposeFunction('localSunFilmVideoChunk', async (index, base64) => {
			if (
				stage === 'stills' ||
				videoFinalized ||
				index !== nextBatch ||
				typeof base64 !== 'string' ||
				base64.length > Math.ceil((4 * 1024 * 1024) / 3) * 4 ||
				!base64.length ||
				!/^[A-Za-z0-9+/]+={0,2}$/u.test(base64)
			)
				throw new Error('Unexpected MP4 batch.');
			const bytes = Buffer.from(base64, 'base64');
			if (bytes.length > 4 * 1024 * 1024 || bytes.toString('base64') !== base64)
				throw new Error('Invalid bounded MP4 encoding.');
			if (!video) {
				const file = path.join(run.root, 'native.mp4');
				await checkPath(run.root, file);
				video = await open(file, 'wx');
			}
			await video.writeFile(bytes);
			videoBytes += bytes.length;
			nextBatch++;
		});
		await page.exposeFunction('localSunFilmVideoFinalize', async () => {
			if (!video || videoFinalized) throw new Error('Missing or repeated MP4 finalization.');
			await video.sync();
			await video.close();
			video = undefined;
			videoFinalized = true;
		});
		await page.goto('http://127.0.0.1:' + address.port + '/', {waitUntil: 'load'});
		const result = JSON.parse(
			await page.evaluate(
				(recipe) =>
					/** @type {LocalSunFilmBridge} */ (/** @type {unknown} */ (globalThis)).localSunFilm.run(recipe),
				recipe,
			),
		);
		await run.write('result.json', JSON.stringify(result, null, '\t'));
		if (
			result.schema !== 'local-sun-p6-film-v1' ||
			result.stage !== stage ||
			result.glError !== 0 ||
			result.cacheCount !== 1 ||
			result.viewportSize?.width !== recipe.viewportSize.width ||
			result.viewportSize?.height !== recipe.viewportSize.height
		)
			throw new Error('Incomplete film publication/render proof.');
		if (
			stage !== 'stills' &&
			(!videoFinalized || result.frames !== recipe.framesPerSecond * recipe.segmentDurationSeconds)
		)
			throw new Error('Incomplete streamed movie.');
		await run.write(
			'stream.json',
			JSON.stringify(
				{
					schema: 'local-sun-p6-stream-v1',
					batches: nextBatch,
					byteLength: videoBytes,
					finalized: videoFinalized,
					maximumBatchBytes: 4 * 1024 * 1024,
				},
				null,
				'\t',
			),
		);
	} catch (error) {
		failure = error instanceof Error ? error.stack : String(error);
		process.exitCode = 1;
		console.error(failure);
	} finally {
		try {
			await video?.close();
			await browser?.close();
			await checkPath(run.root, profile);
			await rm(profile, {recursive: true, force: true});
			if (host) await new Promise((resolve) => host.close(() => resolve(undefined)));
		} catch (error) {
			failure ??= String(error);
			process.exitCode = 1;
		}
		await run.finish(failure ? 'failed' : 'accepted', failure);
		console.log(run.name);
	}
}
await main();
