import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer';
import {PNG} from 'pngjs';
import {createRun, identity, checked, repository} from './io.mjs';
import {acceptedRuns, readEvidence, runsRoot} from './evidence.mjs';
import {quantile} from './analysis.mjs';

const final = acceptedRuns('r4-three-final').at(-1);
assert.ok(final && existsSync(path.join(repository, final, 'cleanup.json')));
const check = acceptedRuns('r2-scene-check')
	.filter((root) => readEvidence(`${root}/results.json`).render === final)
	.at(-1);
assert.ok(check, 'The final source/render must have a matched independent scene check.');
const parents = [
	...new Set([
		`${runsRoot}/00043-r1-three-cache`,
		`${runsRoot}/00044-r3-three-pilot`,
		`${runsRoot}/00045-r2-scene-probe`,
		`${runsRoot}/00046-r2-scene-check`,
		`${runsRoot}/00047-r2-scene-check`,
		`${runsRoot}/00048-r4-three-final`,
		`${runsRoot}/00049-r2-scene-check`,
		final,
		check,
	]),
];
const run = createRun('r4-scene-report', [
	...parents.map((root) => identity(`${root}/manifest.json`)),
	...[
		'node_modules/three/package.json',
		'node_modules/rollup/package.json',
		'node_modules/@rollup/plugin-node-resolve/package.json',
		'src/algorithm32/profiles/native-15/consts.js',
		'references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv',
	].map(identity),
]);
let browser;
let failure;
try {
	const registration = readEvidence(`${final}/registration.json`);
	const settings = registration.settings;
	const telemetry = readEvidence(`${final}/telemetry.json`);
	const verification = readEvidence(`${check}/results.json`);
	const cleanup = readEvidence(`${final}/cleanup.json`);
	const parity = readEvidence(`${runsRoot}/00043-r1-three-cache/parity.json`);
	const shaderIdentity = identity(`${final}/scene.glsl`);
	const reproducibility = ['outward.png', 'inward.png', 'scene.glsl', 'build.glsl'].map((name) => ({
		name,
		earlier: identity(`${runsRoot}/00048-r4-three-final/${name}`),
		final: identity(`${final}/${name}`),
	}));
	assert.ok(
		reproducibility.every((row) => row.earlier.sha256 === row.final.sha256),
		'Final instrumentation must preserve the actual images and shader sources.',
	);
	const accuracy = verification.actualSceneAir.map((row) => row.spectralRelative);
	const summary = {
		median: quantile(accuracy, 0.5),
		p95: quantile(accuracy, 0.95),
		maximum: Math.max(...accuracy),
		cases: accuracy.length,
	};
	const frameRows = telemetry.frames.map((frame) => ({
		name: frame.name,
		width: frame.width,
		height: frame.height,
		groundCaptureMilliseconds: frame.groundCaptureMilliseconds,
		renderingMilliseconds: frame.renderingMilliseconds,
		maximumTileMilliseconds: frame.maximumTileMilliseconds,
		totalWithReadbackAndChecksMilliseconds: frame.totalMilliseconds,
		cacheIdentity: frame.cacheIdentity,
		png: identity(`${final}/${frame.name}.png`),
	}));
	const cache = telemetry.cache;
	const cameraPreparationMilliseconds = telemetry.cameraControls.reduce((sum, row) => sum + row.milliseconds, 0);
	const results = {
		final,
		check,
		parents,
		settings,
		cache,
		frameRows,
		cameraPreparationMilliseconds,
		parity,
		cleanup,
		intrinsicAccuracy: verification.intrinsicQuerySummary,
		actualSceneAirAccuracy: summary,
		actualSceneAir: verification.actualSceneAir,
		verification: verification.checks,
		cameraControls: telemetry.cameraControls,
		reproducibility,
		shaderIdentity,
		implementation: {
			entry: 'experiments/flat-dome-cache-shape/scene-entry.mjs',
			builder: 'experiments/flat-dome-cache-shape/DomeCacheBuilder.mjs',
			resource: 'experiments/flat-dome-cache-shape/DomeCacheResource.mjs',
			shader: 'experiments/flat-dome-cache-shape/scene-shader.mjs',
			ground: 'experiments/flat-dome-cache-shape/FiniteGroundObject.mjs',
			scene: 'experiments/flat-dome-cache-shape/DomeSceneRenderer.mjs',
			runner: 'experiments/flat-dome-cache-shape/run-scene-render.mjs',
		},
		limits: [
			'Integration succeeded; the studied N12 spatial/angular representation is not accurate at all new near-rim rays. These errors are not solved by Three/raw equality.',
			'Ground is a fixed spectral diagnostic endpoint with no feedback into the absorbing-ground scattering cache; not a coupled ground-illumination solution.',
			'The camera is only about 5m below the cap; a mostly dark sky and narrow brighter band are physical outputs for the stated model, not a manufactured rim wall or normal-Earth sky claim.',
			'Workstation wall timings include synchronized tiles and callback overhead; no timer-query or external-host isolation claim.',
			'Owned texture/geometry counts and payloads exclude opaque driver allocations and general JavaScript heap.',
		],
		reproduction: 'node experiments/flat-dome-cache-shape/run-scene-render.mjs --final',
	};
	run.write('results.json', results);
	run.write(
		'accuracy.csv',
		'id,relative_spectral_percent,absolute_spectral_error,reference_integrated_half95_percent,ground_hit\n' +
			verification.actualSceneAir
				.map((r) =>
					[r.id, r.spectralRelative * 100, r.absolute, r.referenceRelativeHalf95 * 100, r.groundHit].join(
						',',
					),
				)
				.join('\n') +
			'\n',
	);
	const mib = (value) => (value / 1048576).toFixed(3);
	const seconds = (value) => (value / 1000).toFixed(3);
	const description = `# Flat dome cache: actual Three.js scene results\n\nThe code builds a complete N12 cache on the Three renderer, returns a live cumulative cache resource, and feeds it to the updated atmosphere shader through the unchanged production ShaderRuntimePass. A real finite ground mesh supplies FP32 hit/distance and spectral endpoint identity. The two 1280x720 renders use the same completed cache and differ only by 180 degrees of heading.\n\n- [Outward render](../${path.basename(final)}/outward.png)\n- [Inward render](../${path.basename(final)}/inward.png)\n\nCamera: 5 km inside the rim, 45 m height, latitude ${settings.latitude.toFixed(8)}, longitude 90E, level 90-degree horizontal FOV. Local roof ${settings.localCapHeight.toFixed(5)}m; shortest cap clearance ${settings.capClearance.toFixed(5)}m. Source remains inward; exposure 0.06 for both. Ground spectrum/scalar and actual RGB ${settings.groundColor.rgb.join(',')} are frozen in results.json.\n\n**Accuracy qualification:** Three/raw parity is exact on 34 rays, but the matched independent probe reveals ${(100 * summary.maximum).toFixed(2)}% maximum cumulative air-radiance error on the 16 checked final scene rays (median ${(100 * summary.median).toFixed(2)}%). The earlier broad-study 2% result does not qualify this pose. Do not treat these as production-quality accuracy renders. No additional count/distribution search was performed.\n\nCache: 3036 nodes, ${mib(cache.retainedTextureBytes)}MiB resident owned textures; ${mib(cache.peakCacheTextureBytes)}MiB peak cache/verification textures. Compilation ${seconds(cache.compilationMilliseconds)}s, field construction plus inspection ${seconds(cache.fieldConstructionAndInspectionMilliseconds)}s. Camera/shader preparation and auxiliary reuse checks ${seconds(cameraPreparationMilliseconds)}s.\n\n|View|Scene capture s|Tiled shader s|Total including readback/PNG/checks s|\n|---|---:|---:|---:|\n${frameRows.map((r) => `|${r.name}|${seconds(r.groundCaptureMilliseconds)}|${seconds(r.renderingMilliseconds)}|${seconds(r.totalWithReadbackAndChecksMilliseconds)}|`).join('\n')}\n\nVerification: real ground draws/hits, finite cap intervals, spectral composition, zero-air/unit-transmission endpoint, CIE/sRGB display (zero code-value discrepancy), camera-only cache/shader reuse, vacuum/outside-entry controls, no undrawn/nonfinite pixels, and zero Three-owned geometries/textures after disposal. A second final execution reproduces both PNGs and generated GLSL byte-for-byte. Reference errors and uncertainty remain in accuracy.csv/results.json.\n\nThe rim is only about 5.76 pixels below the level outward horizon at this natural framing. The ground cutoff is visible; the scene does not show an invented wall or a large cliff. Ground remains a diagnostic endpoint without scattering feedback. The whole implementation remains contained in the experiment.\n\nReproduce with:\n\n\`node experiments/flat-dome-cache-shape/run-scene-render.mjs --final\`\n\nEach execution creates a new immutable run. It compiles/builds once per session, renders both headings, closes resources, and seals evidence. Persistent export/reload, app integration, extra objects, and resolution/distribution studies remain deferred.\n`;
	run.write('summary.md', description);
	const imageRoot = `../${path.basename(final)}`;
	const accuracyRows = verification.actualSceneAir
		.map(
			(row) =>
				`<tr><td>${row.id}</td><td>${(row.spectralRelative * 100).toFixed(3)}%</td><td>${(row.referenceRelativeHalf95 * 100).toFixed(3)}%</td><td>${row.groundHit}</td></tr>`,
		)
		.join('');
	run.write(
		'index.html',
		`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Flat dome cache — Three.js scene</title><style>body{background:#121212;color:#eee;font:16px system-ui;margin:24px;line-height:1.5}a{color:#abd3fa}p{max-width:1250px}.qualification{border-left:4px solid #e7b974;padding-left:16px}figure{margin:24px 0;overflow-x:auto}img{display:block;width:1280px;height:720px;max-width:none}table{border-collapse:collapse}td,th{border:1px solid #666;padding:8px;text-align:left}code{color:#abd3fa}</style><h1>Live dome cache → updated shader → Three.js scene</h1><p>The actual renderer built one completed N12 cache and used it for both 1280×720 views of the finite ground disk and atmosphere. The unchanged production ShaderRuntimePass hosts the adapted camera, dome/lookup and scene-composition shader. These PNGs come from GPU fragments, not CPU sky-color images.</p><p class="qualification"><strong>Integration succeeds; near-rim accuracy remains limited.</strong> The new Three cache matches the existing evaluator exactly on 34 rays, but matched independent-probe errors reach ${(summary.maximum * 100).toFixed(2)}% on the 16 checked scene rays. The earlier broad-study 2% figure is not applicable here. This work does not claim production readiness or resolve the representation's near-rim error.</p><p>Camera: ${settings.eyeHeight}m above ground, ${settings.distanceInside}m inside rim, latitude ${settings.latitude.toFixed(8)}, longitude 90°E. Local dome height ${settings.localCapHeight.toFixed(5)}m; camera clearance ${settings.capClearance.toFixed(5)}m. Both views use level 90° horizontal FOV, exposure 0.06, identical source and spectral ground endpoint. Only heading changes. Images are shown at native size; scroll horizontally if needed.</p><p><a href="summary.md">Summary</a> · <a href="results.json">Settings, spectra, diagnostics, source/resource identities</a> · <a href="accuracy.csv">Matched scene-ray accuracy CSV</a></p><figure><figcaption><strong>Outward: toward the disk rim (+X)</strong>. Ground ends approximately 6 pixels below the level horizon.</figcaption><a href="${imageRoot}/outward.png"><img src="${imageRoot}/outward.png" width="1280" height="720" alt="Actual outward Three.js render of finite ground and dome-bounded atmosphere"></a></figure><figure><figcaption><strong>Inward: 180° toward the North Pole (-X)</strong>. Same completed cache, position and projection.</figcaption><a href="${imageRoot}/inward.png"><img src="${imageRoot}/inward.png" width="1280" height="720" alt="Actual inward Three.js render using the same cache"></a></figure><h2>Interpretation</h2><p>The ground cutoff is visible at natural FOV. The observer is just under the shallow atmospheric roof, so most sky directions quickly enter vacuum and appear dark without a Sun/stars mesh. The inward atmospheric band is brighter. There is no rim wall. The gray ground is a declared spectral scene endpoint; it does not feed ground reflection/emission back into the cache.</p><h2>Measured construction and rendering</h2><p>Cache: 3036 nodes; ${mib(cache.retainedTextureBytes)}MiB retained owned textures,${mib(cache.peakCacheTextureBytes)}MiB peak cache/verification textures. Compilation ${seconds(cache.compilationMilliseconds)}s; field construction/inspection ${seconds(cache.fieldConstructionAndInspectionMilliseconds)}s; camera/shader preparation and auxiliary reuse controls ${seconds(cameraPreparationMilliseconds)}s. Opaque driver and JS-object heap allocations are not included.</p><table><tr><th>View</th><th>Ground capture s</th><th>Tiled shader s</th><th>Total with readback, PNG and checks s</th></tr>${frameRows.map((r) => `<tr><td>${r.name}</td><td>${seconds(r.groundCaptureMilliseconds)}</td><td>${seconds(r.renderingMilliseconds)}</td><td>${seconds(r.totalWithReadbackAndChecksMilliseconds)}</td></tr>`).join('')}</table><p>These are synchronized workstation wall observations, not timer-query GPU timings or a claim of isolated interactive FPS. Final-source resource counters are 0 textures/0 geometries after disposal. A second final execution reproduces both images and shader sources byte-for-byte.</p><h2>Independent scene-ray comparison</h2><p>Same cap, finite source, optical medium, Native15 bins and cumulative J1-J4. The probe retains direct-J1 convergence and independent higher-order batches. Relative spectral error is integrated absolute spectral difference divided by integrated reference radiance. Reference marginal 95% intervals are estimates, not simultaneous guarantees. Only air radiance is compared here; the gray endpoint is separately validated spectrally.</p><table><tr><th>Physical pixel ray</th><th>Air spectral error</th><th>Reference 95% relative half-width</th><th>Ground hit</th></tr>${accuracyRows}</table><h2>Code and reproduction</h2><p><code>node experiments/flat-dome-cache-shape/run-scene-render.mjs --final</code></p><p>The entry constructs the shared renderer, DomeCacheBuilder returns DomeCacheResource, DomeSceneRenderer captures FiniteGroundObject and invokes the production pass with scene-shader GLSL. Camera-only changes use uniforms and preserve actual cache and shader identities. All source remains under experiments/flat-dome-cache-shape. Source snapshots, assembled shaders, input settings, raw selected pixel spectra, metadata and artifact hashes remain in ${path.basename(final)}. Persistent cache packaging, app integration, new objects and broader resolution studies are deferred.</p></html>`,
	);

	let verifiedFiles = 0,
		verifiedBytes = 0;
	const monitor = [];
	for (const root of parents) {
		const manifest = readEvidence(`${root}/manifest.json`);
		for (const artifact of manifest.artifacts) {
			const actual = identity(artifact.path);
			assert.equal(actual.bytes, artifact.bytes, artifact.path);
			assert.equal(actual.sha256, artifact.sha256, artifact.path);
			verifiedFiles++;
			verifiedBytes += actual.bytes;
		}
		const progress = readFileSync(checked(path.join(repository, root, 'progress.jsonl')), 'utf8')
			.trim()
			.split(/\r?\n/)
			.map((line) => JSON.parse(line));
		const maximumGapMilliseconds = Math.max(
			0,
			...progress.slice(1).map((event, i) => Date.parse(event.timestamp) - Date.parse(progress[i].timestamp)),
		);
		monitor.push({root, state: manifest.state, maximumGapMilliseconds});
		run.progress('verify', `Authenticated ${verifiedFiles} parent artifacts.`, {completed: verifiedFiles});
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
	for (const frame of frameRows) {
		const png = PNG.sync.read(readFileSync(checked(path.join(repository, frame.png.path))));
		assert.equal(png.width, 1280);
		assert.equal(png.height, 720);
		for (let i = 3; i < png.data.length; i += 4) {
			assert.equal(png.data[i], 255);
		}
	}
	run.write('evidence-verification.json', {
		verifiedFiles,
		verifiedBytes,
		monitor,
		reproducibility: true,
		cleanup,
		scope: 'Primary self-verifying immutable artifact check, not an independent audit or standards review. Earlier completed study inputs are reused through recorded manifest identity; no old native campaign is rerun.',
	});
	const profile = path.join(run.root, 'browser');
	// The evidence writer restricts direct artifacts; create and check this owned profile.
	const {mkdirSync} = await import('node:fs');
	mkdirSync(profile);
	checked(profile, run.root);
	browser = await puppeteer.launch({headless: 'new', userDataDir: profile});
	const page = await browser.newPage();
	await page.setViewport({width: 1440, height: 1000});
	const errors = [];
	page.on('pageerror', (error) => errors.push(String(error)));
	await page.goto(pathToFileURL(path.join(run.root, 'index.html')).href);
	const images = await page.evaluate(() =>
		Array.from(document.images).map((image) => ({
			width: image.naturalWidth,
			height: image.naturalHeight,
			complete: image.complete,
		})),
	);
	assert.equal(images.length, 2);
	assert.ok(images.every((image) => image.complete && image.width === 1280 && image.height === 720));
	assert.equal(errors.length, 0);
	run.write('report-render-check.json', {images, errors});
	await page.screenshot({path: path.join(run.root, 'report-preview.png'), fullPage: false});
	console.log(JSON.stringify({run: run.root, final, check, verifiedFiles, verifiedBytes, accuracy: summary}));
} catch (error) {
	failure = error;
	run.write('failure.json', {error: String(error), stack: error.stack});
} finally {
	await browser?.close().catch((error) => {
		failure ??= error;
	});
	run.finish(failure ? 'failed' : 'accepted', {
		message: failure
			? String(failure)
			: 'Actual two-view Three.js scene, live-cache/shader integration, matched accuracy limits, report rendering and immutable artifact checks retained.',
	});
}
if (failure) {
	throw failure;
}
