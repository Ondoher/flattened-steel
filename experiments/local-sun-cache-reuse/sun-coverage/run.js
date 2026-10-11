import path from 'node:path';
import {readFile, rm} from 'node:fs/promises';
import puppeteer from 'puppeteer';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import {ExperimentRun} from '../ExperimentRun.js';
import {readParent} from '../parent-evidence.js';
import {repositoryRoot, checkPath, hash} from '../run-boundary.js';
import {requireHeavyExecution} from '../heavy-execution-admission.js';

/** Preserve a bounded raw GPU readback in a new immutable diagnostic run.
 * @returns {Promise<void>} - No production change, cache rebuild or full recording.
 */
async function main() {
	await requireHeavyExecution();
	const run = await ExperimentRun.create('sun-coverage'),
		profile = path.join(run.root, 'profile');
	let browser,
		failure = null;
	try {
		const parents = await Promise.all(
			['result.json', 'inputs.json'].map((name) => readParent('00674-p5-celestial', name)),
		);
		const result = JSON.parse(new TextDecoder().decode(parents[0].bytes)),
			inputs = JSON.parse(new TextDecoder().decode(parents[1].bytes)),
			transport = result.rows.find((row) => row.id === 'flat-180').transport;
		const generatorPath = 'src/algorithm32/rendering-runtime/three/SunDiskTileGenerationPass.js',
			consumerPath =
				'src/algorithm32/celestial-source-support/CelestialScreenPaletteConsumerShaderContribution.js';
		const files = [
			generatorPath,
			consumerPath,
			'experiments/local-sun-cache-reuse/read-sun-coverage.js',
			'experiments/local-sun-cache-reuse/sun-coverage/run.js',
			'experiments/local-sun-cache-reuse/ExperimentRun.js',
			'experiments/local-sun-cache-reuse/parent-evidence.js',
			'experiments/local-sun-cache-reuse/run-boundary.js',
			'experiments/local-sun-cache-reuse/heavy-execution-admission.js',
			'package-lock.json',
		];
		const texts = [];
		for (const relative of [generatorPath, consumerPath]) {
			const file = path.join(repositoryRoot, relative);
			await checkPath(repositoryRoot, file);
			const bytes = await readFile(file);
			if (hash(bytes) !== inputs.sources.find((s) => s.path === relative)?.sha256)
				throw new Error('Production shader differs from captured parent.');
			texts.push(bytes.toString('utf8'));
		}
		const vertex = texts[0].match(/const vertexShader = `([\s\S]*?)`;/u)?.[1],
			fragment = texts[0].match(/const fragmentShader = `([\s\S]*?)`;/u)?.[1],
			consumer = texts[1].match(/`(float sampleSunCoverageTile\(ShaderState state\) \{[\s\S]*?\n\})/u)?.[1],
			samples = Number(texts[0].match(/const TILE_SAMPLES_PER_PIXEL = (\d+);/u)?.[1]),
			margin = Number(texts[0].match(/const TILE_MARGIN_PIXELS = (\d+);/u)?.[1]);
		if (
			!vertex ||
			!fragment ||
			!consumer ||
			samples !== 16 ||
			margin !== 2 ||
			vertex.includes('${') ||
			fragment.includes('${')
		)
			throw new Error('Unrecognized unchanged shader source.');
		/** @type {SunCoverageDiagnosticInput} */ const input = {
			radius: transport.radiusPixels,
			center: transport.sunCenterPixels,
			samples,
			resolution: 2 * Math.ceil(transport.radiusPixels + margin) * samples,
			vertex,
			fragment,
			consumer,
		};
		const entry = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/sun-coverage/browser.js');
		await checkPath(repositoryRoot, entry);
		const build = await rollup({input: entry, plugins: [nodeResolve({browser: true})]});
		let code;
		try {
			files.push(...build.watchFiles.map((f) => path.relative(repositoryRoot, f).replaceAll('\\', '/')));
			code = (await build.generate({format: 'iife'})).output[0].code;
		} finally {
			await build.close();
		}
		const identities = [];
		for (const relative of [...new Set(files)].sort()) {
			const file = path.join(repositoryRoot, relative);
			await checkPath(repositoryRoot, file);
			const bytes = await readFile(file);
			identities.push({path: relative, sha256: hash(bytes), byteLength: bytes.length});
		}
		await run.write('bundle.js', code);
		await run.write('input.json', JSON.stringify(input, null, '\t'));
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					parents: parents.map(({bytes, ...p}) => p),
					sources: identities,
					operation:
						'Extract unchanged production shader literals, replay captured Flat180 radius/centre at original s16 resolution, R32F readback, geometric disjoint-support classification and exact consumer sample at 100 original screen-pixel positions.',
					tools: {node: process.version},
					outputHashes: {bundle: hash(code)},
				},
				null,
				'\t',
			),
		);
		const executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe',
			args = ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'];
		await checkPath(run.root, profile);
		browser = await puppeteer.launch({
			executablePath,
			headless: 'new',
			userDataDir: profile,
			args,
			protocolTimeout: 120000,
		});
		await run.write(
			'browser.json',
			JSON.stringify(
				{
					version: await browser.version(),
					executablePath,
					executableSha256: hash(await readFile(executablePath)),
					args,
				},
				null,
				'\t',
			),
		);
		const page = await browser.newPage();
		await page.setViewport({width: 720, height: 414, deviceScaleFactor: 1});
		await page.addScriptTag({content: code});
		await run.progress('readback', 'Unchanged production coverage and consumer shader, 96 by 96 tile.');
		const measured = await page.evaluate(
			(input) =>
				/** @type {SunCoverageDiagnosticBridge} */ (/** @type {unknown} */ (globalThis)).readSunCoverage(input),
			input,
		);
		const raw = new Uint8Array(measured.tile.length * 4),
			view = new DataView(raw.buffer);
		measured.tile.forEach((value, index) => view.setFloat32(index * 4, value, true));
		await run.write('coverage.f32le', raw);
		const {tile, ...compact} = measured;
		await run.write(
			'result.json',
			JSON.stringify({...compact, tileArtifact: 'coverage.f32le', tileSha256: hash(raw)}, null, '\t'),
		);
		console.log(
			JSON.stringify({
				run: run.name,
				positiveOutside: measured.positiveOutsideCount,
				maxOutside: measured.maximumOutsideCoverage,
				positiveScreenOutside: measured.screen.filter((p) => p.outside && p.coverage > 0).length,
			}),
		);
	} catch (error) {
		failure = error instanceof Error ? error.stack : String(error);
		process.exitCode = 1;
		console.log(failure);
	} finally {
		await browser?.close();
		await checkPath(run.root, profile);
		await rm(profile, {recursive: true, force: true});
		await run.finish(failure ? 'failed' : 'accepted', failure);
		console.log(run.name);
	}
}
await main();
