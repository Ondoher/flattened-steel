import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {PNG} from 'pngjs';
import {StrobingRun} from './StrobingRun.js';
import {StrobingMedia} from './StrobingMedia.js';
import {StrobingComparisonCaptions} from './StrobingComparisonCaptions.js';

const run = await StrobingRun.allocate('delivery-proof');
try {
	const parent = await StrobingRun.checkedPath(
		StrobingRun.repositoryRoot,
		`${StrobingRun.outputRelative}/runs/00018-fixed-capture`,
	);
	const trace = /** @type {StrobingSceneTrace} */ (await StrobingRun.readJson(parent, 'scene-trace.json'));
	const sourcePath = await StrobingRun.checkedPath(parent, 'captures/the-hours-frame-0000.png');
	const source = PNG.sync.read(await readFile(sourcePath));
	if (source.width !== 1280 || source.height !== 720) throw new Error('Lossless capture dimensions differ.');
	const media = new StrobingMedia(run);
	await media.execute('caption-proof', [
		'-i',
		sourcePath,
		'-vf',
		`scale=640:360,${StrobingComparisonCaptions.label('Selected cubic correction')},${StrobingComparisonCaptions.trace(trace.frames)}`,
		'-frames:v',
		'1',
		'-update',
		'1',
		'-n',
		path.join(run.directory, 'caption-proof.png'),
	]);
	const decoded = PNG.sync.read(await readFile(await StrobingRun.checkedPath(run.directory, 'caption-proof.png')));
	if (decoded.width !== 640 || decoded.height !== 360) throw new Error('Caption proof output dimensions differ.');
	await run.writeJson('provenance.json', {
		operation:
			'Decode retained lossless PNG, render exact comparison filter with cache and frame captions, decode derived PNG and verify dimensions.',
		parents: [
			await StrobingRun.identity(parent, 'captures/the-hours-frame-0000.png'),
			await StrobingRun.identity(parent, 'scene-trace.json'),
		],
		parentRoot: path.relative(StrobingRun.repositoryRoot, parent),
		implementation: await StrobingRun.inventory(
			path.join(StrobingRun.repositoryRoot, 'experiments/distant-sun-recording-strobing'),
			['node_modules'],
		),
		node: process.version,
	});
	await run.finish('accepted', {
		purpose: 'delivery-caption-and-lossless-proof',
		sourceDimensions: [1280, 720],
		comparisonPanelDimensions: [640, 360],
	});
} catch (error) {
	await run.finish('failed', {error: error instanceof Error ? error.stack : String(error)});
	process.exitCode = 1;
}
