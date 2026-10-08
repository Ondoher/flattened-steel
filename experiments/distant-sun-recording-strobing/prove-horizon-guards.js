import path from 'node:path';
import {StrobingRun} from './StrobingRun.js';
import {StrobingHorizonMeasurement} from './StrobingHorizonMeasurement.js';
import {StrobingColorPatch} from './StrobingColorPatch.js';

const run = await StrobingRun.allocate('horizon-guards');
try {
	const parent = await StrobingRun.checkedPath(
		StrobingRun.repositoryRoot,
		`${StrobingRun.outputRelative}/runs/00042-fixed-capture`,
	);
	const manifest = /** @type {StrobingParentManifest} */ (
		await StrobingRun.readJson(parent, 'artifact-manifest.json')
	);
	if ((await StrobingRun.inventory(parent, manifest.excludedPaths)).artifactSetSha256 !== manifest.artifactSetSha256)
		throw new Error('Guard-proof parent did not authenticate.');
	const trace = /** @type {StrobingFilmSceneTrace} */ (
		await StrobingRun.readJson(parent, 'scene-trace.json')
	);
	const frames = trace.frames;
	const pixels = frames.map((frame, frameIndex) => ({frameIndex, regions: frame.sourceRegions}));
	const retained = frames.filter((frame) => frame.solarZenithDegrees >= 89.5 && frame.solarZenithDegrees <= 91.5);
	const guards = [];
	/** @param {string} name @param {()=>unknown} operation */
	const reject = (name, operation) => {
		let rejected = false;
		try {
			operation();
		} catch {
			rejected = true;
		}
		if (!rejected) throw new Error(`Guard did not reject ${name}.`);
		guards.push({name, rejected});
	};
	if (!StrobingHorizonMeasurement.evaluate(pixels, frames).pass) throw new Error('Complete positive case failed.');
	reject('truncated crossing without both physical endpoints', () =>
		StrobingHorizonMeasurement.evaluate(
			retained.map((frame, frameIndex) => ({frameIndex, regions: frame.sourceRegions})),
			retained,
		),
	);
	reject('missing pixel frame', () => StrobingHorizonMeasurement.evaluate(pixels.slice(1), frames));
	reject('reordered pixel frame', () =>
		StrobingHorizonMeasurement.evaluate(
			pixels.map((frame, index) => (index === 60 ? {...frame, frameIndex: 59} : frame)),
			frames,
		),
	);
	reject('nonfinite sky measurement', () =>
		StrobingHorizonMeasurement.evaluate(
			pixels.map((frame, index) =>
				index === 75
					? {...frame, regions: {...frame.regions, upper: {...frame.regions.upper, meanLuma: NaN}}}
					: frame,
			),
			frames,
		),
	);
	reject('missing color source anchor', () => StrobingColorPatch.apply('unrelated source', 'monotone-p2'));
	reject('duplicate color source anchor', () =>
		StrobingColorPatch.apply('sunsetRolloffPower: 9, sunsetRolloffPower: 9,', 'monotone-p2'),
	);
	await run.writeJson('guards.json', {
		parent: {runId: path.basename(parent), artifactSetSha256: manifest.artifactSetSha256},
		completePositiveCasePasses: true,
		guards,
	});
	await run.writeJson('provenance.json', {
		operation:
			'Use copies of authenticated candidate traces to challenge incomplete, misaligned, and nonfinite horizon evidence and ambiguous source-patch anchors. Parent artifacts are unchanged.',
		implementation: await StrobingRun.inventory(
			path.join(StrobingRun.repositoryRoot, 'experiments/distant-sun-recording-strobing'),
			['node_modules'],
		),
		node: process.version,
	});
	await run.finish('accepted', {
		purpose: 'horizon-final-cleanup',
		guards: guards.length,
		completePositiveCasePasses: true,
	});
} catch (error) {
	await run.finish('failed', {error: error instanceof Error ? error.stack : String(error)});
	process.exitCode = 1;
}
