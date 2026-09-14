import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {PNG} from 'pngjs';
import {StrobingRun} from './StrobingRun.js';

const run = await StrobingRun.allocate('sampling-proof');
try {
	const root = await StrobingRun.checkedPath(
		StrobingRun.repositoryRoot,
		`${StrobingRun.outputRelative}/runs/00021-fixed-film`,
	);
	const trace = /** @type {{frames: StrobingFilmSceneFrame[]}} */ (
		await StrobingRun.readJson(root, 'scene-trace.json')
	);
	const comparisons = [],
		parents = [await StrobingRun.identity(root, 'scene-trace.json')];
	for (const frameIndex of [0, 210, 360, 540, 900, 1260, 1440, 1590, 1770]) {
		const file = `captures/the-hours-frame-${String(frameIndex).padStart(4, '0')}.png`;
		parents.push(await StrobingRun.identity(root, file));
		const png = PNG.sync.read(await readFile(await StrobingRun.checkedPath(root, file)));
		const native = {};
		for (const [region, first, last] of [
			['upper', 0, 720],
			['horizon', 720, 1440],
			['lower', 1440, 2160],
		]) {
			let red = 0,
				green = 0,
				blue = 0;
			for (let offset = Number(first) * 3840 * 4; offset < Number(last) * 3840 * 4; offset += 4) {
				red += png.data[offset];
				green += png.data[offset + 1];
				blue += png.data[offset + 2];
			}
			native[region] = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / (3840 * 720);
		}
		native.full = (native.upper + native.horizon + native.lower) / 3;
		comparisons.push({
			frameIndex,
			native,
			originalDownsample: trace.frames[frameIndex].sourceRegions,
			error: Object.fromEntries(
				Object.entries(native).map(([region, value]) => [
					region,
					trace.frames[frameIndex].sourceRegions[region].meanLuma - Number(value),
				]),
			),
		});
	}
	await run.writeJson('sampling.json', {
		comparisons,
		operation:
			'Exact means of native retained RGBA pixels compared with the recorded default browser 320x180 downsample. Presentation pixels remain unchanged.',
	});
	await run.writeJson('provenance.json', {
		root: path.relative(StrobingRun.repositoryRoot, root),
		parents,
		implementation: await StrobingRun.identity(
			StrobingRun.repositoryRoot,
			'experiments/distant-sun-recording-strobing/prove-sampling.js',
		),
		node: process.version,
	});
	await run.finish('accepted', {
		purpose: 'native-source-metering-proof',
		frames: comparisons.length,
		maximumAbsoluteLowerMeanError: Math.max(...comparisons.map((frame) => Math.abs(Number(frame.error.lower)))),
	});
} catch (error) {
	await run.finish('failed', {error: error instanceof Error ? error.stack : String(error)});
	process.exitCode = 1;
}
