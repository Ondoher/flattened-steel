import path from 'node:path';
import {readFile, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import {createRequire} from 'node:module';
import puppeteer from 'puppeteer';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';
import {requireHeavyExecution} from './heavy-execution-admission.js';
import {createFlat180CelestialVariant} from './bruneton-sun-variant.js';
import {createSanJoseWinterControls} from './san-jose-winter-controls.js';
import {selectSunSize} from './sun-size.js';
const commonjs = createRequire(import.meta.url)('@rollup/plugin-commonjs');

/** Run one immutable bounded celestial capture, with disposable browser state.
 * @returns {Promise<void>} - Sealed new evidence; never a full P6 recording.
 */
async function main() {
	await requireHeavyExecution();
	const run = await ExperimentRun.create('p5-celestial'),
		profile = path.join(run.root, 'profile');
	let browser,
		host,
		failure = null;
	try {
		const option = process.argv[2];
		const captureOptions = process.argv.slice(3),
			sizeOptions = captureOptions.filter((value) => value.startsWith('--sun-size=')),
			fovOptions = captureOptions.filter((value) => value.startsWith('--fov=')),
			sizeOption = sizeOptions[0];
		if (captureOptions.length > 2 || sizeOptions.length > 1 || fovOptions.length > 1 ||
			captureOptions.some((value) => !['--sun-size=fixed-16mi', '--sun-size=overhead-calibrated', '--fov=standard', '--fov=human-central'].includes(value)) ||
			!['--stage=sun', '--stage=combined', '--stage=bruneton-180', '--stage=p2-combined-180', '--stage=p2-combined-away-180', '--stage=p2-combined-away-up-180', '--stage=p2-human-away-up-180', '--stage=p2-human-toward-up-180', '--stage=p2-human-scene-180', '--stage=p2-human-scene-0', '--stage=p2-human-san-jose-winter-scene-180'].includes(option))
			throw new Error('One bounded celestial stage required.');
		const sunSizeMode = /** @type {LocalSunSunSizeMode} */ (sizeOption?.slice(11) ?? 'fixed-16mi');
		const humanCentralFov = fovOptions[0] === '--fov=human-central';
		const sanJose = option === '--stage=p2-human-san-jose-winter-scene-180',
			closest = option === '--stage=p2-human-scene-0',
			selectedState = closest ? 'flat-0' : 'flat-180',
			scene = closest || sanJose || option === '--stage=p2-human-scene-180',
			toward = option === '--stage=p2-human-toward-up-180',
			humanVision = scene || toward || option === '--stage=p2-human-away-up-180',
			upward = toward || option === '--stage=p2-human-away-up-180' || option === '--stage=p2-combined-away-up-180',
			away = upward || option === '--stage=p2-combined-away-180',
			p2Combined = scene || away || option === '--stage=p2-combined-180';
		const variant = option === '--stage=bruneton-180' ? await createFlat180CelestialVariant() : p2Combined ? await createFlat180CelestialVariant(scene ? 'p2-human-scene' : toward ? 'p2-human-toward-up' : humanVision ? 'p2-human-away-up' : upward ? 'p2-combined-away-up' : away ? 'p2-combined-away' : 'p2-combined', selectedState) : null;
		const parents = await Promise.all([
			readParent('00018-controls', 'controls.json'),
			...['contract.json', 'gates.json', 'layout.json'].map((artifact) =>
				readParent('00478-p3-contract', artifact),
			),
		]);
		if (
			parents[1].artifactSha256 !== '186b8be60929276c1208dbd72d2c648a3782cd4346c59f4a0c74efcc9826a704' ||
			parents[2].artifactSha256 !== 'c5794fb707b7da7c87713e19ebaf77ae7e3816d6cc72e929958e12a4aa33210d' ||
			parents[3].artifactSha256 !== 'd1c7dea2b0587474de5930d75e8e91e9fb61d20ed92faefce2ab7a239a290864'
		)
			throw new Error('Pinned physical/numerical contract changed.');
		const decoder = new TextDecoder(),
			controls = JSON.parse(decoder.decode(parents[0].bytes));
		const baseStates = sanJose ? createSanJoseWinterControls() : controls.states;
		const sunSize = selectSunSize(baseStates, sunSizeMode), states = sunSize.states;
		const controlsDerivation = sanJose ? {
			parent: parents[0].run,
			operation: 'Replace only observation and resolved physical placement using FlatEarthGeometry.resolveObservationInstant and resolveShellState; retain ordinary finite-source/atmosphere policies and pinned shell layout.',
			location: states[0].observation.location,
			dateBasis: '2024-12-21T09:20:00.000Z',
			angleDegrees: 180,
			instants: states.map((state) => ({id: state.id, instant: state.observation.instant})),
			outputSha256: hash(JSON.stringify(baseStates)),
		} : null;
		const files = [],
			warnings = [];
		/** Bundle declared source and record all executable inputs.
		 * @param {string} basename - Contained authored entry.
		 * @returns {Promise<string>} - Browser script source.
		 */
		async function bundle(basename) {
			const entry = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', basename);
			await checkPath(repositoryRoot, entry);
			const build = await rollup({
				input: entry,
				plugins: [...(variant ? [variant.plugin] : []), nodeResolve({browser: true}), commonjs()],
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
		// Collect the complete executable host-control dependency graph as provenance.
		if (sanJose) await bundle('san-jose-winter-controls.js');
		await bundle('sun-size.js');
		const code = await bundle('celestial-browser.js'),
			worker = await bundle('shell-phase-worker.js');
		const catalogRoot = path.join(repositoryRoot, 'server/flat32/data/brightest-2000-stellar-package-v1'),
			routes = new Map([
				['/bundle.js', Buffer.from(code)],
				['/phase-worker.js', Buffer.from(worker)],
			]);
		for (const name of [
			'manifest.json',
			'catalog-roster.json',
			'native15-packets.json',
			'members-rgba32f.bin',
			'spectra-r32f.bin',
		]) {
			const file = path.join(catalogRoot, name);
			await checkPath(repositoryRoot, file);
			routes.set('/catalog/' + name, await readFile(file));
			files.push(file);
		}
		files.push(
			path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/run-celestial.js'),
			path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/bruneton-sun-variant.js'),
			path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/san-jose-winter-controls.js'),
			path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/sun-coverage/correction.js'),
			path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/parent-evidence.js'),
			path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/run-boundary.js'),
			path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/ExperimentRun.js'),
			path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/heavy-execution-admission.js'),
			path.join(repositoryRoot, 'package-lock.json'),
		);
		if (humanVision) for (const name of ['manifest.json', 'native15-scotopic-weights.json']) {
			const file = path.join(repositoryRoot, 'server/flat32/data/human-vision-filter-package-v1', name);
			await checkPath(repositoryRoot, file);
			routes.set('/human-vision/' + name, await readFile(file));
			files.push(file);
		}
		const identities = [];
		for (const file of [...new Set(files)].filter((f) => !f.startsWith('\0')).sort()) {
			await checkPath(repositoryRoot, file);
			const bytes = await readFile(file);
			identities.push({
				path: path.relative(repositoryRoot, file).replaceAll('\\', '/'),
				sha256: hash(bytes),
				byteLength: bytes.length,
			});
		}
		/** @type {LocalSunCelestialRecipe} */ const recipe = {
			states,
			layout: JSON.parse(decoder.decode(parents[3].bytes)),
			implementationIdentity: hash(JSON.stringify(identities)),
			viewportSize: {width: 1024, height: 768, units: 'pixels'},
			...(humanCentralFov ? {horizontalFieldOfViewDegrees: 60} : {}),
			humanVision,
			shellScene: scene,
			stage: /** @type {LocalSunCelestialStage} */ (p2Combined ? 'combined' : variant ? 'sun' : option.slice(8)),
			resourcePolicy:
				'Default 8 GiB machine reserve; 8 GiB owned ceiling; ten-minute job limit; P6 excluded.',
		};
		await run.write('bundle.js', code);
		await run.write('phase-worker.js', worker);
		await run.write('recipe.json', JSON.stringify(recipe, null, '\t'));
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					command: process.argv,
					parents: parents.map(({bytes, ...p}) => p),
					operation:
						'Reuse pinned N4 shell atmosphere; shared finite Sun, optional current production stellar catalog, flat geometry adapter and standard GPU index/palette generation.',
					sources: identities,
					outputHashes: {bundle: hash(code), worker: hash(worker)},
					warnings,
					controlsDerivation,
					sunSizeDerivation: {...sunSize.calibration, parent: parents[0].run, inputStatesSha256: hash(JSON.stringify(baseStates)), outputStatesSha256: hash(JSON.stringify(states))},
					cameraPolicy: humanCentralFov ? '60-degree horizontal central-view preset; derive vertical FOV from actual drawing-buffer aspect; no physical source or transport change.' : 'Existing 70-degree vertical FOV.',
					comparison: variant ? {id: closest ? 'p2-human-scene-flat0' : sanJose ? 'p2-human-san-jose-winter-scene-flat180' : scene ? 'p2-human-scene-flat180' : toward ? 'p2-human-toward-up-flat180' : humanVision ? 'p2-human-away-up-flat180' : upward ? 'p2-combined-away-up-flat180' : away ? 'p2-combined-away-flat180' : p2Combined ? 'p2-combined-flat180' : 'bruneton-flat180', derivations: variant.derivations} : null,
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
			protocolTimeout: 600000,
		});
		await run.write(
			'browser.json',
			JSON.stringify(
				{
					version: await browser.version(),
					executablePath,
					executableSha256: hash(await readFile(executablePath)),
					args,
					profilePolicy: 'Fresh disposable profile removed before sealing',
				},
				null,
				'\t',
			),
		);
		const page = await browser.newPage();
		await page.setViewport({width: recipe.viewportSize.width, height: recipe.viewportSize.height, deviceScaleFactor: 1});
		page.on('console', (message) => {
			const value = message.text();
			if (!value.startsWith('THREE.WebGLProgram: Program Info Log:')) console.log(value);
			void run.progress('browser', value);
		});
		page.on('pageerror', (error) => {
			console.log(String(error));
			void run.progress('browser-error', String(error));
		});
		await page.exposeFunction('localSunCelestialArtifact', async (name, value) => {
			if (!/^(flat-(0|90|180)-(sun|combined|stars|star-index)\.png|proof\.json|preview\.mp4)$/u.test(name))
				throw new Error('Unexpected celestial artifact.');
			const parsed = JSON.parse(value);
			await run.write(
				name,
				name.endsWith('.png')
					? Buffer.from(parsed.dataUrl.split(',')[1], 'base64')
					: name.endsWith('.mp4')
						? Buffer.from(parsed.base64, 'base64')
						: JSON.stringify(parsed, null, '\t'),
			);
		});
		await page.goto('http://127.0.0.1:' + address.port + '/', {waitUntil: 'load'});
		const result = JSON.parse(
			await page.evaluate(
				(recipe) =>
					/** @type {LocalSunCelestialBridge} */ (/** @type {unknown} */ (globalThis)).localSunCelestial(
						recipe,
					),
				recipe,
			),
		);
		await run.write('result.json', JSON.stringify(result, null, '\t'));
		if (
			result.schema !== 'local-sun-p5-celestial-delivery-v2' ||
			result.stage !== recipe.stage ||
			result.viewportSize?.width !== recipe.viewportSize.width || result.viewportSize?.height !== recipe.viewportSize.height ||
			result.glError !== 0 ||
			result.cacheCount !== 1 ||
			!result.sceneOcclusion ||
			result.rows?.length !== (variant ? 1 : 3) ||
			(variant && result.rows[0]?.id !== selectedState)
		)
			throw new Error('Incomplete celestial capture qualification.');
		if (!result.rows.every((row) => row.cameraFieldOfView?.aspect === recipe.viewportSize.width / recipe.viewportSize.height &&
			Math.abs((humanCentralFov ? row.cameraFieldOfView.horizontalDegrees : row.cameraFieldOfView.verticalDegrees) - (humanCentralFov ? 60 : 70)) < 1e-8))
			throw new Error('Actual camera field of view did not match the selected preset.');
		if (away && (result.rows[0].cameraYaw?.yawDegrees !== (toward ? 0 : 180) ||
			result.rows[0].cameraYaw.sunBehindCamera !== !toward || !result.rows[0].cameraYaw.positionUnchanged ||
			result.rows[0].cameraYaw.pitchUnchanged !== !upward || !result.rows[0].cameraYaw.atmosphericCacheUnchanged))
			throw new Error('Incomplete camera-only turned-view qualification.');
		if (upward && (!result.rows[0].cameraYaw.elevationVerified || Math.abs(result.rows[0].cameraYaw.elevationDegrees - 65) > 1e-8 ||
			!(result.rows[0].starProof?.occupiedPixels > 0) || result.rows[0].starProof.emptyView !== false))
			throw new Error('Upward camera elevation or occupied stellar view was not verified.');
		if (away && result.rows[0].starProof?.occupiedPixels === 0 && result.rows[0].starProof.emptyView !== true)
			throw new Error('Empty turned stellar view lacks catalog-wide verification.');
		if (humanVision && (!result.humanVisionPackageIdentity || !result.rows[0].presentationProof?.passed))
			throw new Error('Human-vision integration lacks authenticated package and GPU proof.');
		if (scene && (!result.rows[0].scene?.rendered || result.rows[0].scene?.lights?.length !== 6 || !result.rows[0].receiver))
			throw new Error('Ground capture lacks the complete ordinary scene and measured lighting.');
		if (sanJose && JSON.stringify(result.rows[0].observation) !== JSON.stringify(states.find((state) => state.id === 'flat-180')?.observation))
			throw new Error('San Jose capture did not retain its independently resolved winter-solstice observation.');
		if (
			recipe.stage === 'combined' &&
			(!result.lifecycle ||
				!result.cancellationVerified ||
				!result.rows.every((row) => row.starProof?.catalogCount === 2000) ||
				result.preview?.frames !== (p2Combined ? 0 : 24))
		)
			throw new Error('Incomplete combined celestial proof/preview.');
	} catch (error) {
		failure = error instanceof Error ? error.stack : String(error);
		process.exitCode = 1;
		console.log(failure);
	} finally {
		await browser?.close();
		await checkPath(run.root, profile);
		await rm(profile, {recursive: true, force: true});
		if (host) await new Promise((resolve) => host.close(() => resolve(undefined)));
		await run.finish(failure ? 'failed' : 'accepted', failure);
		console.log(run.name);
	}
}
await main();
