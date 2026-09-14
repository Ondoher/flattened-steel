import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {StrobingRun} from './StrobingRun.js';
import {StrobingHorizonMeasurement} from './StrobingHorizonMeasurement.js';

const ids = process.argv.slice(2);
if (ids.length !== 8 || ids.some((id) => !/^\d{5}-[a-z][a-z0-9-]{0,15}$/u.test(id)))
	throw new Error('Supply capture/analysis pairs: sunset control, no-boost ablation, p2 sunset, p2 sunrise.');
const run = await StrobingRun.allocate('horizon-proof');
try {
	const records = [];
	for (let pair = 0; pair < 4; pair += 1) {
		const captureId = ids[pair * 2],
			analysisId = ids[pair * 2 + 1];
		const parents = [];
		for (const id of [captureId, analysisId]) {
			const root = await StrobingRun.checkedPath(
				StrobingRun.repositoryRoot,
				`${StrobingRun.outputRelative}/runs/${id}`,
			);
			const manifest = /** @type {StrobingParentManifest} */ (
				await StrobingRun.readJson(root, 'artifact-manifest.json')
			);
			if (
				manifest.state !== 'accepted' ||
				(await StrobingRun.inventory(root, manifest.excludedPaths)).artifactSetSha256 !==
					manifest.artifactSetSha256
			)
				throw new Error(`Parent did not authenticate: ${id}`);
			parents.push({root, artifactSetSha256: manifest.artifactSetSha256});
		}
		const capture = parents[0].root,
			analysis = parents[1].root;
		const configuration = /** @type {StrobingRenderConfiguration} */ (
			await StrobingRun.readJson(capture, 'configuration.json')
		);
		const trace = /** @type {{frames:StrobingFilmSceneFrame[]}} */ (
			await StrobingRun.readJson(capture, 'scene-trace.json')
		);
		const analysisResult = /** @type {StrobingRunResult} */ (await StrobingRun.readJson(analysis, 'result.json'));
		if (analysisResult.result.parentId !== captureId)
			throw new Error('Analysis does not belong to its declared capture.');
		const frames = trace.frames;
		const expected = ['original-p9', 'no-sunset-boost', 'monotone-p2', 'monotone-p2'][pair];
		if (
			configuration.colorResponse !== expected ||
			configuration.startSeconds !== (pair === 3 ? 10 : 46) ||
			frames.length !== 120
		)
			throw new Error('Horizon comparison configuration does not match its role.');
		const measurements = {
			nativeSource: StrobingHorizonMeasurement.evaluate(
				frames.map((frame, frameIndex) => ({frameIndex, regions: frame.sourceRegions})),
				frames,
			),
		};
		for (const name of ['source', 'original-recorder', 'retained-encode']) {
			const pixels = /** @type {{frames:StrobingPixelFrame[]}} */ (
				await StrobingRun.readJson(analysis, `${name}-pixels.json`)
			);
			measurements[name] = StrobingHorizonMeasurement.evaluate(pixels.frames, frames);
		}
		if (Object.values(measurements).some((value) => value.pass !== (pair !== 0)))
			throw new Error('A horizon control or candidate did not meet its expected outcome.');
		records.push({captureId, analysisId, parents, configuration, frames, measurements});
	}
	const sunset = records.slice(0, 3);
	for (const candidate of sunset.slice(1)) {
		const physical = (frame) =>
			JSON.stringify([
				frame.instant,
				frame.solarZenithDegrees,
				frame.camera,
				frame.color.illuminanceLux,
				frame.color.adaptationLuminance,
			]);
		if (candidate.frames.some((frame, index) => physical(frame) !== physical(sunset[0].frames[index])))
			throw new Error('The color-only ablation changed physical inputs or camera.');
	}
	await run.writeJson('horizon.json', {records, identicalSunsetPhysicalInputs: true, threshold: 1});
	const colors = ['#ff9d8b', '#9ab7cf', '#88e0a0'];
	const curves = sunset
		.map((record, index) => {
			const points = record.frames
				.map(
					(frame) =>
						`${60 + (frame.animationSeconds - 46) * 200},${340 - frame.sourceRegions.upper.meanLuma * 1.4}`,
				)
				.join(' ');
			return `<polyline fill="none" stroke="${colors[index]}" stroke-width="3" points="${points}"/>`;
		})
		.join('');
	const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Horizon color proof</title><style>body{font:18px system-ui;background:#121820;color:#eee;max-width:960px;margin:40px auto}a{color:#9bd5ff}svg{width:100%;background:#19232d}table{border-collapse:collapse}td,th{padding:12px;text-align:left}</style><h1>Sunset color response</h1><p>Same physical receiver light, corrected cache, camera, and exact times. Only the display gain differs.</p><svg viewBox="0 0 920 390" role="img" aria-label="Upper-sky luminance from 46 to 50 seconds: the original rises abruptly after 48 seconds; both color ablations decline smoothly."><path d="M60 30V340H870" fill="none" stroke="#888"/>${curves}<g fill="#ddd" font-size="16"><text x="60" y="370">46 s</text><text x="450" y="370">48 s</text><text x="820" y="370">50 s</text><text x="70" y="25">Upper-sky mean luminance (0–255)</text></g></svg><p><span style="color:${colors[0]}">Original p9</span> · <span style="color:${colors[1]}">No sunset boost</span> · <span style="color:${colors[2]}">Selected p2</span></p><table><tr><th>Capture</th><th>Wrong-direction sky excursion</th><th>Movie</th></tr>${records.map((record) => `<tr><td>${record.configuration.startSeconds === 46 ? 'Sunset' : 'Sunrise'} / ${record.configuration.colorResponse}</td><td>${record.measurements.nativeSource.windows[0].regions.upper.excursion.toFixed(3)}</td><td><a href="../${record.captureId}/captures/creative-full-day.mp4">Open animation</a></td></tr>`).join('')}</table><p>All native frames, PNG measurements, original recorder output, and independent encodes reproduce the control failure and pass for the ablations. The one-code gate covers solar zenith 89.5–91.5 degrees. <a href="horizon.json">Complete measurements and parent identities</a>.</p></html>`;
	await writeFile(path.join(run.directory, 'index.html'), html, {flag: 'wx'});
	await run.writeJson('provenance.json', {
		operation:
			'Authenticate matched capture/analysis pairs; independently evaluate broad sky excursions in every image path; require exactly identical physical inputs across sunset color variants; plot retained native means.',
		implementation: await StrobingRun.inventory(
			path.join(StrobingRun.repositoryRoot, 'experiments/distant-sun-recording-strobing'),
			['node_modules'],
		),
		node: process.version,
	});
	await run.finish('accepted', {
		purpose: 'horizon-color-causal-proof',
		identicalSunsetPhysicalInputs: true,
		controlFails: true,
		ablationPasses: true,
		selectedSunriseAndSunsetPass: true,
	});
} catch (error) {
	await run.finish('failed', {error: error instanceof Error ? error.stack : String(error)});
	process.exitCode = 1;
}
