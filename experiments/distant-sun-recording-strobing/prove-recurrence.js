import path from 'node:path';
import {StrobingRun} from './StrobingRun.js';
import {StrobingMedia} from './StrobingMedia.js';

const run = await StrobingRun.allocate('recurrence-proof');
try {
	const proofs = [];
	for (const [filmId, analysisId] of [
		['00021-fixed-film', '00023-film-analysis'],
		['00031-fixed-film', '00033-film-analysis'],
	]) {
		const filmRoot = await StrobingRun.checkedPath(
			StrobingRun.repositoryRoot,
			`${StrobingRun.outputRelative}/runs/${filmId}`,
		);
		const analysisRoot = await StrobingRun.checkedPath(
			StrobingRun.repositoryRoot,
			`${StrobingRun.outputRelative}/runs/${analysisId}`,
		);
		const trace = /** @type {{frames:StrobingFilmSceneFrame[]}} */ (
			await StrobingRun.readJson(filmRoot, 'scene-trace.json')
		);
		const source = trace.frames.map((frame, frameIndex) => ({frameIndex, regions: frame.sourceRegions}));
		const decoded = /** @type {{frames:StrobingPixelFrame[]}} */ (
			await StrobingRun.readJson(analysisRoot, 'film-pixels.json')
		);
		const results = {
			source: StrobingMedia.evaluate(source, trace.frames),
			encoded: StrobingMedia.evaluate(decoded.frames, trace.frames),
		};
		if (
			filmId === '00021-fixed-film' &&
			(results.source.pass ||
				results.encoded.pass ||
				results.encoded.regions.full.reversingPublications.length !== 2)
		)
			throw new Error('Distinct morning and evening publications were incorrectly merged.');
		if (
			filmId === '00031-fixed-film' &&
			(!results.source.pass ||
				!results.encoded.pass ||
				results.source.regions.lower.reversingBoundaryPeaks !== 2 ||
				results.source.regions.lower.reversingPublications.join(',') !== '112')
		)
			throw new Error('The isolated two-sided pulse was not attributed to its single publication.');
		proofs.push({
			filmId,
			analysisId,
			results,
			parents: [
				await StrobingRun.identity(filmRoot, 'scene-trace.json'),
				await StrobingRun.identity(analysisRoot, 'film-pixels.json'),
			],
		});
	}
	await run.writeJson('recurrence.json', {
		definition:
			'Count distinct physical cache publications responsible for reversing strongest extrema; preserve raw extrema and unchanged 1.5 curvature threshold.',
		proofs,
		isolatedSourceEvent: {
			filmId: '00031-fixed-film',
			publicationFrame: 112,
			extrema: [111, 112],
			largestCurvature: 0.2727654380063642,
			regionalMeanDrop: 0.1520578122106473,
			displayCodeRange: [0, 255],
			encodedReversingPublications: 0,
		},
	});
	await run.writeJson('provenance.json', {
		operation:
			'Reevaluate unchanged complete source and decoded traces; require two separated publication events to remain failures and both extrema of one publication to count as one isolated event.',
		implementation: await StrobingRun.inventory(
			path.join(StrobingRun.repositoryRoot, 'experiments/distant-sun-recording-strobing'),
			['node_modules'],
		),
		node: process.version,
	});
	await run.finish('accepted', {
		purpose: 'physical-publication-recurrence-proof',
		oldFilmStillRejected: true,
		selectedFilmRecurringStrobeGatePass: true,
		isolatedSourcePublication: 112,
	});
} catch (error) {
	await run.finish('failed', {error: error instanceof Error ? error.stack : String(error)});
	process.exitCode = 1;
}
