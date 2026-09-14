import path from 'node:path';
import {StrobingRun} from './StrobingRun.js';
import {StrobingMedia} from './StrobingMedia.js';
import {StrobingHorizonMeasurement} from './StrobingHorizonMeasurement.js';

const filmId = process.argv[2];
if (!/^\d{5}-[a-z][a-z0-9-]{0,15}$/u.test(filmId ?? '')) throw new Error('Supply one completed film run id.');
const root = StrobingRun.repositoryRoot;
const filmRoot = await StrobingRun.checkedPath(root, `${StrobingRun.outputRelative}/runs/${filmId}`);
const run = await StrobingRun.allocate('film-analysis');
try {
	await run.progress({phase: 'authenticate', message: 'Authenticating the native film and original choreography.'});
	const manifest = /** @type {StrobingParentManifest} */ (
		await StrobingRun.readJson(filmRoot, 'artifact-manifest.json')
	);
	if (
		manifest.state !== 'accepted' ||
		(await StrobingRun.inventory(filmRoot, manifest.excludedPaths)).artifactSetSha256 !== manifest.artifactSetSha256
	)
		throw new Error('The film run did not authenticate.');
	await run.writeJson('film-parent.json', {root: path.relative(root, filmRoot), ...manifest});
	const trace = /** @type {{frames: StrobingFilmSceneFrame[]}} */ (
		await StrobingRun.readJson(filmRoot, 'scene-trace.json')
	);
	const configuration = /** @type {StrobingRenderConfiguration} */ (
		await StrobingRun.readJson(filmRoot, 'configuration.json')
	);
	if (
		!configuration.fullFilm ||
		configuration.width !== 3840 ||
		configuration.height !== 2160 ||
		configuration.durationSeconds !== 60 ||
		configuration.framesPerSecond !== 30 ||
		trace.frames.length !== 1800
	)
		throw new Error('Film does not match the original 4K, 60-second, 30-fps contract.');
	const originalRoot = await StrobingRun.checkedPath(
		root,
		'tmp/experiments/distant-sun-shadow-animation-evidence/runs/1788974488678-creative-animation',
	);
	const originalTrace = /** @type {{frames: StrobingFilmSceneFrame[]}} */ (
		await StrobingRun.readJson(originalRoot, 'scene-trace.json')
	);
	const choreography = trace.frames.map((frame, index) => ({
		index,
		instantMatches: frame.instant === originalTrace.frames[index].instant,
		zenithError: Math.abs(frame.solarZenithDegrees - originalTrace.frames[index].solarZenithDegrees),
		cameraMatches: JSON.stringify(frame.camera) === JSON.stringify(originalTrace.frames[index].camera),
	}));
	if (!choreography.every((frame) => frame.instantMatches && frame.zenithError < 1e-10 && frame.cameraMatches))
		throw new Error('Full film choreography differs from the immutable original.');
	await run.writeJson('choreography.json', {
		frameCount: 1800,
		exactInstantAndCameraMatch: true,
		maximumZenithError: Math.max(...choreography.map((frame) => frame.zenithError)),
		parent: await StrobingRun.identity(originalRoot, 'scene-trace.json'),
	});
	const media = new StrobingMedia(run);
	const film = await StrobingRun.checkedPath(filmRoot, 'captures/creative-full-day.mp4');
	await run.progress({phase: 'decode-film', message: 'Decoding and measuring all 1,800 native film frames.'});
	const decoded = await media.measure('film', ['-i', film], 1800);
	const source = trace.frames.map((frame, frameIndex) => ({frameIndex, regions: frame.sourceRegions}));
	const analysis = {
		source: StrobingMedia.evaluate(source, trace.frames),
		encoded: StrobingMedia.evaluate(decoded, trace.frames),
	};
	await run.writeJson('analysis.json', analysis);
	const horizon = {
		source: StrobingHorizonMeasurement.evaluate(source, trace.frames),
		encoded: StrobingHorizonMeasurement.evaluate(decoded, trace.frames),
	};
	await run.writeJson('horizon.json', horizon);
	await run.progress({
		phase: 'verify-timestamps',
		message: 'Checking complete decoded presentation order and frame identities.',
	});
	let frameMap = '';
	await media.execute(
		'frame-map',
		['-i', film, '-an', '-fps_mode', 'passthrough', '-f', 'framemd5', 'pipe:1'],
		(chunk) => {
			frameMap += chunk.toString();
		},
	);
	const entries = frameMap
		.split('\n')
		.filter((line) => line.trim() && !line.startsWith('#'))
		.map((line) => line.split(',').map((value) => value.trim()));
	if (
		entries.length !== 1800 ||
		!entries.every((entry, index) => Number(entry[2]) === index && Number(entry[3]) === 1)
	)
		throw new Error('Decoded presentation slots are missing, repeated, or out of order.');
	await run.writeJson('frame-map.json', {
		headers: frameMap.split('\n').filter((line) => line.startsWith('#')),
		entries,
		adjacentIdenticalDecodedFrames: entries.slice(1).filter((entry, index) => entry[5] === entries[index][5])
			.length,
	});
	await run.writeJson('provenance.json', {
		operation:
			'Authenticate film, compare all original camera/instant/zenith states, measure source and decoded region traces, and verify every decoded frame slot.',
		implementation: await StrobingRun.inventory(path.join(root, 'experiments/distant-sun-recording-strobing'), [
			'node_modules',
		]),
		parentIdentityArtifact: 'film-parent.json',
		originalTraceIdentityArtifact: 'choreography.json',
		sourceMeasurement: configuration.sourceMeasurement ?? 'legacy-browser-default-downsample',
		measurementCaveat:
			'Native source pixel means and independent FFmpeg area-downsampled decoded means are evaluated independently; no presentation pixels are altered by measurement.',
	});
	await run.finish('accepted', {
		purpose: 'full-film-qualification',
		filmId,
		frameCount: 1800,
		choreographyMatch: true,
		contiguousTimestamps: true,
		strobingGatePass: analysis.source.pass && analysis.encoded.pass,
		horizonColorGatePass: horizon.source.pass && horizon.encoded.pass,
		ownerInspection: 'pending',
		ratios: Object.fromEntries(
			Object.entries(analysis).map(([name, value]) => [
				name,
				Object.fromEntries(Object.entries(value.regions).map(([region, result]) => [region, result.ratio])),
			]),
		),
	});
} catch (error) {
	await run.finish('failed', {error: error instanceof Error ? error.stack : String(error)});
	process.exitCode = 1;
}
