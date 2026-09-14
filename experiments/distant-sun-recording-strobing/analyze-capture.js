import path from 'node:path';
import {StrobingRun} from './StrobingRun.js';
import {StrobingMedia} from './StrobingMedia.js';
import {StrobingHorizonMeasurement} from './StrobingHorizonMeasurement.js';

const parentId = process.argv[2];
if (!/^\d{5}-[a-z][a-z0-9-]{0,15}$/u.test(parentId ?? '')) throw new Error('Supply one contained capture run id.');
const parent = await StrobingRun.checkedPath(
	StrobingRun.repositoryRoot,
	`${StrobingRun.outputRelative}/runs/${parentId}`,
);
const run = await StrobingRun.allocate('capture-analysis');
try {
	await run.progress({
		phase: 'authenticate',
		message: 'Authenticating the complete sealed capture before media analysis.',
	});
	const manifest = /** @type {StrobingParentManifest} */ (
		await StrobingRun.readJson(parent, 'artifact-manifest.json')
	);
	if (manifest.state !== 'accepted') throw new Error('Capture did not complete successfully.');
	const inventory = await StrobingRun.inventory(parent, manifest.excludedPaths);
	if (inventory.artifactSetSha256 !== manifest.artifactSetSha256)
		throw new Error('Parent capture artifacts changed.');
	await run.writeJson('parent.json', {root: path.relative(StrobingRun.repositoryRoot, parent), ...manifest});
	const trace = /** @type {StrobingSceneTrace} */ (await StrobingRun.readJson(parent, 'scene-trace.json'));
	const configuration = /** @type {StrobingRenderConfiguration} */ (
		await StrobingRun.readJson(parent, 'configuration.json')
	);
	if (configuration.fullFilm) throw new Error('This proof requires every retained diagnostic PNG.');
	const frameCount = configuration.durationSeconds * configuration.framesPerSecond;
	const media = new StrobingMedia(run);
	const sequence = path.join(parent, 'captures/the-hours-frame-%04d.png');
	const sequenceInput = ['-framerate', '30', '-start_number', '0', '-i', sequence];
	await run.progress({
		phase: 'offline-encode',
		message: 'Encoding the retained PNG sequence with pinned H.264 settings.',
	});
	const offline = path.join(run.directory, 'retained-frames.mp4');
	await media.execute('offline-encode', [
		...sequenceInput,
		'-frames:v',
		String(frameCount),
		'-an',
		'-c:v',
		'libx264',
		'-preset',
		'slow',
		'-profile:v',
		'high',
		'-level:v',
		'5.2',
		'-b:v',
		'40M',
		'-pix_fmt',
		'yuv420p',
		'-movflags',
		'+faststart',
		'-n',
		offline,
	]);
	await run.progress({
		phase: 'measure-source',
		message: 'Measuring the lossless source sequence and both decoded recordings.',
	});
	const source = await media.measure('source', sequenceInput, frameCount);
	const original = await media.measure(
		'original-recorder',
		['-i', path.join(parent, 'captures/creative-full-day.mp4')],
		frameCount,
	);
	const replay = await media.measure('retained-encode', ['-i', offline], frameCount);
	const comparisons = {
		source: StrobingMedia.evaluate(source, trace.frames),
		originalRecorder: StrobingMedia.evaluate(original, trace.frames),
		retainedEncode: StrobingMedia.evaluate(replay, trace.frames),
	};
	await run.writeJson('analysis.json', comparisons);
	const hasHorizon = configuration.startSeconds === 10 || configuration.startSeconds === 46;
	const horizon = hasHorizon
		? {
				nativeSource: StrobingHorizonMeasurement.evaluate(
					trace.frames.map((frame, frameIndex) => ({
						frameIndex,
						regions: /** @type {StrobingFilmSceneFrame} */ (frame).sourceRegions,
					})),
					trace.frames,
				),
				losslessPng: StrobingHorizonMeasurement.evaluate(source, trace.frames),
				originalRecorder: StrobingHorizonMeasurement.evaluate(original, trace.frames),
				retainedEncode: StrobingHorizonMeasurement.evaluate(replay, trace.frames),
			}
		: null;
	if (horizon) await run.writeJson('horizon.json', horizon);
	await run.writeJson('provenance.json', {
		schemaId: 'strobing-media-derivation-v1',
		parent: 'parent.json',
		operation:
			'Decode the authenticated PNG sequence and two H.264 encodes to RGB24; area-reduce to 320x180; compute Rec.709 display-code regional means and absolute centered second temporal differences. Boundary adjacency includes the frame before and after publication.',
		implementation: await StrobingRun.inventory(
			path.join(StrobingRun.repositoryRoot, 'experiments/distant-sun-recording-strobing'),
			['node_modules'],
		),
		threshold: 1.5,
		strongestPeakFraction: 0.1,
		maximumReversingBoundaryPeaks: 1,
		encoderDifference:
			'The original workflow uses WebCodecs/Mediabunny; independent replay uses FFmpeg/libx264 at matching resolution, cadence, H.264 high profile level 5.2, 40Mbps target, and YUV420. Encoder implementation is an explicit variable.',
	});
	await run.finish('accepted', {
		purpose: 'capture-analysis',
		parentId,
		frameCount,
		strobingGatePass: Object.values(comparisons).every((value) => value.pass),
		horizonColorGatePass: horizon ? Object.values(horizon).every((value) => value.pass) : null,
		ratios: Object.fromEntries(
			Object.entries(comparisons).map(([name, value]) => [
				name,
				Object.fromEntries(Object.entries(value.regions).map(([region, result]) => [region, result.ratio])),
			]),
		),
	});
} catch (error) {
	await run.finish('failed', {error: error instanceof Error ? error.stack : String(error)});
	process.exitCode = 1;
}
