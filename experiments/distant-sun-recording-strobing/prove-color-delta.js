import path from 'node:path';
import {StrobingRun} from './StrobingRun.js';

const run = await StrobingRun.allocate('color-delta');
try {
	const ids = ['00031-fixed-film', '00035-film-analysis', '00050-fixed-film', '00054-film-analysis'];
	const parents = [];
	for (const id of ids) {
		const root = await StrobingRun.checkedPath(
			StrobingRun.repositoryRoot,
			`${StrobingRun.outputRelative}/runs/${id}`,
		);
		const manifest = /** @type {StrobingParentManifest} */ (
			await StrobingRun.readJson(root, 'artifact-manifest.json')
		);
		if (
			manifest.state !== 'accepted' ||
			(await StrobingRun.inventory(root, manifest.excludedPaths)).artifactSetSha256 !== manifest.artifactSetSha256
		)
			throw new Error('Color-delta parent failed authentication.');
		parents.push({id, root, artifactSetSha256: manifest.artifactSetSha256});
	}
	const before = /** @type {StrobingFilmSceneTrace} */ (
		await StrobingRun.readJson(parents[0].root, 'scene-trace.json')
	);
	const after = /** @type {StrobingFilmSceneTrace} */ (
		await StrobingRun.readJson(parents[2].root, 'scene-trace.json')
	);
	const previous = /** @type {StrobingSourceTemporalAnalysis} */ (
		await StrobingRun.readJson(parents[1].root, 'analysis.json')
	);
	const current = /** @type {StrobingEncodedTemporalAnalysis} */ (
		await StrobingRun.readJson(parents[3].root, 'analysis.json')
	);
	const qualification = /** @type {StrobingRunResult} */ (await StrobingRun.readJson(parents[3].root, 'result.json'));
	if (
		current.source.pass ||
		!previous.source.pass ||
		!current.encoded.pass ||
		qualification.result.horizonColorGatePass !== true
	)
		throw new Error(
			'This delta proof requires the declared ranking-only source failure and passing encoded/horizon gates.',
		);
	const events = [];
	for (const [region, result] of Object.entries(current.source.regions)) {
		if (result.ratio > 1.5) throw new Error('A source curvature-ratio regression cannot be waived by this proof.');
		for (const event of result.strongest.filter((event) => event.cacheAdjacent && event.reversal)) {
			const indices = [event.index - 1, event.index, event.index + 1];
			if (
				!indices.every(
					(index) =>
						JSON.stringify(before.frames[index].sourceRegions) ===
							JSON.stringify(after.frames[index].sourceRegions) &&
						before.frames[index].instant === after.frames[index].instant &&
						JSON.stringify(before.frames[index].camera) === JSON.stringify(after.frames[index].camera) &&
						before.frames[index].sharedScene === after.frames[index].sharedScene,
				)
			)
				throw new Error('A newly ranked source event differs from the earlier film.');
			events.push({
				region,
				frame: event.index,
				animationSeconds: after.frames[event.index].animationSeconds,
				curvature: event.curvature,
				previousRank:
					previous.source.regions[region].strongest.findIndex((entry) => entry.index === event.index) + 1,
				currentRank: result.strongest.findIndex((entry) => entry.index === event.index) + 1,
				identicalAllRegionRgbMeansAndPhysicalNeighborhood: true,
			});
		}
	}
	await run.writeJson('delta.json', {
		parents,
		events,
		sourceRecurrenceGatePass: false,
		encodedRecurrenceGatePass: true,
		horizonColorGatePass: true,
		interpretation:
			'The p2 color correction passes both horizon gates and changes none of the three-frame source measurements around the newly ranked ground events. The aggregate source recurrence gate remains failed; this is a color-delta qualification, not an overall strobe-free claim.',
		previousRankConvention: 'Zero means outside the retained strongest forty events.',
	});
	await run.writeJson('provenance.json', {
		operation:
			'Authenticate both complete films and their full analyses; compare exact native regional RGB means, physical times, cameras, and publication identities around every strongest source reversal; retain the failed aggregate gate unchanged.',
		implementation: await StrobingRun.inventory(
			path.join(StrobingRun.repositoryRoot, 'experiments/distant-sun-recording-strobing'),
			['node_modules'],
		),
		node: process.version,
	});
	await run.finish('accepted', {
		purpose: 'color-correction-delta-qualification',
		filmId: ids[2],
		analysisId: ids[3],
		colorDeltaPass: true,
		sourceRecurrenceGatePass: false,
		unchangedSourceEvents: events.length,
	});
} catch (error) {
	await run.finish('failed', {error: error instanceof Error ? error.stack : String(error)});
	process.exitCode = 1;
}
