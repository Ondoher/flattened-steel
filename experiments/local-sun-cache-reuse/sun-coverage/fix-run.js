import path from 'node:path';
import {readFile, rm} from 'node:fs/promises';
import puppeteer from 'puppeteer';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import {ExperimentRun} from '../ExperimentRun.js';
import {readParent} from '../parent-evidence.js';
import {repositoryRoot, checkPath, hash} from '../run-boundary.js';
import {requireHeavyExecution} from '../heavy-execution-admission.js';
import {correctSunCoverage} from './correction.js';

/** Compare contained candidate GPU shaders against immutable original coverage.
 * @returns {Promise<void>} - No production change, cache rebuild or full recording.
 */
async function main() {
	await requireHeavyExecution();
	const run = await ExperimentRun.create('sun-coverage-fix'),
		profile = path.join(run.root, 'profile');
	let browser,
		failure = null;
	try {
		const parents = await Promise.all(
			['result.json', 'inputs.json'].map((name) => readParent('00679-sun-coverage', name)),
		);
		const result = JSON.parse(new TextDecoder().decode(parents[0].bytes)),
			original = /** @type {SunCoverageDiagnosticInput} */ (result.input);
		const generatorPath = 'src/algorithm32/rendering-runtime/three/SunDiskTileGenerationPass.js',
			consumerPath =
				'src/algorithm32/celestial-source-support/CelestialScreenPaletteConsumerShaderContribution.js';
		const files = [
			generatorPath,
			consumerPath,
			'experiments/local-sun-cache-reuse/prove-sun-coverage-fix.js',
			'experiments/local-sun-cache-reuse/sun-coverage/fix-run.js',
			'experiments/local-sun-cache-reuse/sun-coverage/correction.js',
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
			throw new Error('Unrecognized current shader source.');
		/** @type {SunCoverageDiagnosticInput} */ const current = {
			radius: original.radius,
			center: original.center,
			samples,
			resolution: 2 * Math.ceil(original.radius + margin) * samples,
			vertex,
			fragment,
			consumer,
		};
		if (current.fragment !== original.fragment || current.consumer !== original.consumer)
			throw new Error('Read-only production coverage differs from the authenticated original.');
		const input = correctSunCoverage(current);
		const cases = [original.radius, 0.329, 0.961, 1.5, 4].flatMap((radius) =>
			[
				[360, 207],
				[360.03125, 207.03125],
				[360.5, 207.5],
				[360.25, 207.125],
			].map((center) => ({
				...input,
				radius,
				center,
				resolution: 2 * Math.ceil(radius + margin) * samples,
			})),
		);
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
		await run.write('input.json', JSON.stringify({original, input, cases}, null, '\t'));
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					parents: parents.map(({bytes, ...p}) => p),
					sources: identities,
					operation:
						'Replay authenticated original shader/input; derive contained candidate using correction.js; compare at captured Flat180 and 20 radius/subpixel-placement cases. Require zero disjoint coverage and preserve intersecting tile values within 5e-6. Production is read-only.',
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
		/** Execute the actual tile/consumer GPU draws for one fixed case.
		 * @param {SunCoverageDiagnosticInput} parameters - Exact source shader and pixel parameters.
		 * @returns {Promise<SunCoverageDiagnosticResult>} - Raw GPU evidence.
		 */
		const measure = async (parameters) =>
			page.evaluate(
				(parameters) =>
					/** @type {SunCoverageDiagnosticBridge} */ (/** @type {unknown} */ (globalThis)).readSunCoverage(
						parameters,
					),
				parameters,
			);
		const before = await measure(original),
			measured = await measure(input);
		if (before.positiveOutsideCount === 0) throw new Error('Original defect control did not reproduce.');
		const rows = [];
		for (const parameters of [input, ...cases]) {
			await run.progress('readback', `Coverage radius ${parameters.radius}, centre ${parameters.center}.`);
			const actual = parameters === input ? measured : await measure(parameters),
				baseline =
					parameters === input
						? before
						: await measure({...parameters, fragment: original.fragment, consumer: original.consumer});
			if (actual.positiveOutsideCount !== 0 || actual.screen.some((p) => p.outside && p.coverage !== 0))
				throw new Error('Corrected shader illuminates a disjoint pixel.');
			let maximumIntersectingDifference = 0;
			for (let index = 0; index < actual.tile.length; index++) {
				const x = ((index % parameters.resolution) + 0.5 - parameters.resolution / 2) / parameters.samples,
					y =
						(Math.floor(index / parameters.resolution) + 0.5 - parameters.resolution / 2) /
						parameters.samples;
				if (
					Math.hypot(Math.max(Math.abs(x) - 0.5, 0), Math.max(Math.abs(y) - 0.5, 0)) <
					Math.fround(parameters.radius)
				)
					maximumIntersectingDifference = Math.max(
						maximumIntersectingDifference,
						Math.abs(actual.tile[index] - baseline.tile[index]),
					);
			}
			if (maximumIntersectingDifference > 5e-6) throw new Error('Intersecting tile coverage changed.');
			rows.push({
				radius: parameters.radius,
				center: parameters.center,
				outsideCount: actual.outsideCount,
				positiveOutside: actual.positiveOutsideCount,
				positiveScreenOutside: actual.screen.filter((p) => p.outside && p.coverage > 0).length,
				maximumIntersectingDifference,
				screen: actual.screen,
			});
		}
		const core = measured.screen.filter((p) => !p.outside);
		if (
			core.length !== 4 ||
			core.some((p) => Math.abs(p.coverage - (Math.PI * Math.fround(input.radius) ** 2) / 4) > 1e-5)
		)
			throw new Error('Captured four-pixel partial overlap was not preserved.');
		const raw = new Uint8Array(measured.tile.length * 4),
			view = new DataView(raw.buffer);
		measured.tile.forEach((value, index) => view.setFloat32(index * 4, value, true));
		await run.write('coverage.f32le', raw);
		const {tile, ...compact} = measured;
		await run.write(
			'result.json',
			JSON.stringify(
				{
					...compact,
					schema: 'sun-coverage-fix-v1',
					rows,
					before: {
						positiveOutside: before.positiveOutsideCount,
						maximumOutsideCoverage: before.maximumOutsideCoverage,
						positiveScreenOutside: before.screen.filter((p) => p.outside && p.coverage > 0).length,
					},
					scope: 'Contained candidate shader correction versus authenticated read-only production on one GPU; exact-zero disjoint support and unchanged intersecting tile values, not app integration, production promotion or universal overlap error bounds.',
					tileArtifact: 'coverage.f32le',
					tileSha256: hash(raw),
				},
				null,
				'\t',
			),
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
