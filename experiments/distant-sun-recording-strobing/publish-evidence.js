import {readdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {StrobingRun} from './StrobingRun.js';
import {StrobingMedia} from './StrobingMedia.js';
import {StrobingComparisonCaptions} from './StrobingComparisonCaptions.js';

const [selectedCapture, selectedAnalysis, filmId, filmAnalysis, horizonProofId, colorDeltaId] = process.argv.slice(2);
if (
	![selectedCapture, selectedAnalysis, filmId, filmAnalysis, horizonProofId, colorDeltaId].every((value) =>
		/^\d{5}-[a-z][a-z0-9-]{0,15}$/u.test(value ?? ''),
	)
)
	throw new Error(
		'Supply selected capture/analysis, full film/analysis, horizon proof, and color-delta proof run ids.',
	);
const root = StrobingRun.repositoryRoot;
const runsRoot = await StrobingRun.checkedPath(root, `${StrobingRun.outputRelative}/runs`);
const run = await StrobingRun.allocate('evidence-index');
try {
	await run.progress({
		phase: 'authenticate',
		message: 'Authenticating all retained experiment runs and building the deliverable index.',
	});
	/** @type {StrobingIndexedRun[]} */ const records = [];
	for (const id of (await readdir(runsRoot)).sort()) {
		if (id === run.id || !/^\d{5}-/u.test(id)) continue;
		const parent = await StrobingRun.checkedPath(runsRoot, id);
		const manifest = /** @type {StrobingParentManifest} */ (
			await StrobingRun.readJson(parent, 'artifact-manifest.json')
		);
		const actual = await StrobingRun.inventory(parent, manifest.excludedPaths);
		if (actual.artifactSetSha256 !== manifest.artifactSetSha256) throw new Error(`Immutable run changed: ${id}`);
		const outcome = /** @type {StrobingRunResult} */ (await StrobingRun.readJson(parent, 'result.json'));
		records.push({
			id,
			state: manifest.state,
			artifactSetSha256: manifest.artifactSetSha256,
			result: outcome.result,
			videos: actual.artifacts.filter((artifact) => artifact.path.endsWith('.mp4')),
			manifest: await StrobingRun.identity(parent, 'artifact-manifest.json'),
		});
	}
	const selected = records.find((record) => record.id === selectedAnalysis);
	const full = records.find((record) => record.id === filmAnalysis);
	const delta = records.find((record) => record.id === colorDeltaId);
	if (
		delta?.result.colorDeltaPass !== true ||
		delta.result.filmId !== filmId ||
		delta.result.analysisId !== filmAnalysis
	)
		throw new Error('Color-delta qualification does not cover this film and analysis.');
	if (
		selected?.result.strobingGatePass !== true ||
		full?.result.horizonColorGatePass !== true ||
		selected.result.parentId !== selectedCapture ||
		full.result.filmId !== filmId
	)
		throw new Error('Selected diagnostic or full-film quantitative qualification is incomplete.');
	if (records.find((record) => record.id === horizonProofId)?.result.selectedSunriseAndSunsetPass !== true)
		throw new Error('Horizon causal proof is incomplete.');
	const horizonProof = /** @type {StrobingHorizonEvidence} */ (
		await StrobingRun.readJson(runsRoot, `${horizonProofId}/horizon.json`)
	);
	const media = new StrobingMedia(run);
	const control = await StrobingRun.checkedPath(runsRoot, '00003-control-capture/captures/creative-full-day.mp4');
	const candidate = await StrobingRun.checkedPath(runsRoot, `${selectedCapture}/captures/creative-full-day.mp4`);
	const label = StrobingComparisonCaptions.label;
	const controlTrace = /** @type {StrobingSceneTrace} */ (
		await StrobingRun.readJson(runsRoot, '00003-control-capture/scene-trace.json')
	);
	const candidateTrace = /** @type {StrobingSceneTrace} */ (
		await StrobingRun.readJson(runsRoot, `${selectedCapture}/scene-trace.json`)
	);
	const controlCaption = StrobingComparisonCaptions.trace(controlTrace.frames);
	const candidateCaption = StrobingComparisonCaptions.trace(candidateTrace.frames);
	await run.progress({
		phase: 'diagnostic-comparison',
		message: 'Creating synchronized control/candidate and independent-encode comparisons.',
	});
	await media.execute('diagnostic-comparison', [
		'-i',
		control,
		'-i',
		candidate,
		'-filter_complex',
		`[0:v]scale=640:360,${label('Current package control')},${controlCaption}[a];[1:v]scale=640:360,${label('Selected correction')},${candidateCaption}[b];[a][b]hstack=inputs=2[v]`,
		'-map',
		'[v]',
		'-an',
		'-c:v',
		'libx264',
		'-crf',
		'16',
		'-pix_fmt',
		'yuv420p',
		'-n',
		path.join(run.directory, 'diagnostic-comparison.mp4'),
	]);
	const controlReplay = await StrobingRun.checkedPath(runsRoot, '00004-capture-analysis/retained-frames.mp4');
	const candidateReplay = await StrobingRun.checkedPath(runsRoot, `${selectedAnalysis}/retained-frames.mp4`);
	await media.execute('encoding-comparison', [
		'-i',
		control,
		'-i',
		candidate,
		'-i',
		controlReplay,
		'-i',
		candidateReplay,
		'-filter_complex',
		`[0:v]scale=640:360,${label('Control - original recorder')},${controlCaption}[a];[1:v]scale=640:360,${label('Correction - original recorder')},${candidateCaption}[b];` +
			`[2:v]scale=640:360,${label('Control - saved PNG encode')},${controlCaption}[c];[3:v]scale=640:360,${label('Correction - saved PNG encode')},${candidateCaption}[d];[a][b]hstack=inputs=2[top];[c][d]hstack=inputs=2[bottom];[top][bottom]vstack=inputs=2[v]`,
		'-map',
		'[v]',
		'-an',
		'-c:v',
		'libx264',
		'-crf',
		'16',
		'-pix_fmt',
		'yuv420p',
		'-n',
		path.join(run.directory, 'encoding-comparison.mp4'),
	]);
	const twilightControl = await StrobingRun.checkedPath(
		runsRoot,
		'00024-fixed-capture/captures/creative-full-day.mp4',
	);
	const twilightCandidate = await StrobingRun.checkedPath(
		runsRoot,
		'00027-fixed-capture/captures/creative-full-day.mp4',
	);
	const twilightTrace = /** @type {StrobingSceneTrace} */ (
		await StrobingRun.readJson(runsRoot, '00027-fixed-capture/scene-trace.json')
	);
	const twilightCaption = StrobingComparisonCaptions.trace(twilightTrace.frames);
	await media.execute('twilight-comparison', [
		'-i',
		twilightControl,
		'-i',
		twilightCandidate,
		'-filter_complex',
		`[0:v]scale=640:360,${label('Original linear physical lighting')},${twilightCaption}[a];[1:v]scale=640:360,${label('Cubic physical lighting')},${twilightCaption}[b];[a][b]hstack=inputs=2[v]`,
		'-map',
		'[v]',
		'-an',
		'-c:v',
		'libx264',
		'-crf',
		'16',
		'-pix_fmt',
		'yuv420p',
		'-n',
		path.join(run.directory, 'twilight-comparison.mp4'),
	]);
	await run.progress({
		phase: 'full-comparison',
		message: 'Creating the synchronized original and corrected full-film comparison.',
	});
	const originalFilm = await StrobingRun.checkedPath(
		root,
		'tmp/experiments/distant-sun-shadow-animation-evidence/runs/1788974488678-creative-animation/captures/creative-full-day.mp4',
	);
	const newFilm = await StrobingRun.checkedPath(runsRoot, `${filmId}/captures/creative-full-day.mp4`);
	await media.execute('full-comparison', [
		'-i',
		originalFilm,
		'-i',
		newFilm,
		'-filter_complex',
		`[0:v]scale=960:540,${label('Immutable original - The Hours')}[a];[1:v]scale=960:540,${label('Corrected - The Hours')}[b];[a][b]hstack=inputs=2[v]`,
		'-map',
		'[v]',
		'-an',
		'-c:v',
		'libx264',
		'-crf',
		'18',
		'-pix_fmt',
		'yuv420p',
		'-n',
		path.join(run.directory, 'full-comparison.mp4'),
	]);
	await run.progress({
		phase: 'color-comparisons',
		message: 'Creating matched sunset color ablations and both full-film horizon comparisons.',
	});
	const sunsetMovies = [];
	for (const record of horizonProof.records.slice(0, 3))
		sunsetMovies.push(
			await StrobingRun.checkedPath(runsRoot, `${record.captureId}/captures/creative-full-day.mp4`),
		);
	const sunsetTrace = /** @type {StrobingSceneTrace} */ (
		await StrobingRun.readJson(runsRoot, `${horizonProof.records[0].captureId}/scene-trace.json`)
	);
	const sunsetCaption = StrobingComparisonCaptions.trace(sunsetTrace.frames);
	await media.execute('color-comparison', [
		...sunsetMovies.flatMap((file) => ['-i', file]),
		'-filter_complex',
		`[0:v]scale=640:360,${label('Original p9 color')},${sunsetCaption}[a];[1:v]scale=640:360,${label('No sunset boost')},${sunsetCaption}[b];[2:v]scale=640:360,${label('Selected p2 color')},${sunsetCaption}[c];[a][b][c]hstack=inputs=3[v]`,
		'-map',
		'[v]',
		'-an',
		'-c:v',
		'libx264',
		'-crf',
		'16',
		'-pix_fmt',
		'yuv420p',
		'-n',
		path.join(run.directory, 'color-comparison.mp4'),
	]);
	const previousFilm = await StrobingRun.checkedPath(runsRoot, '00031-fixed-film/captures/creative-full-day.mp4');
	const previousTrace = /** @type {StrobingSceneTrace} */ (
		await StrobingRun.readJson(runsRoot, '00031-fixed-film/scene-trace.json')
	);
	const newTrace = /** @type {StrobingSceneTrace} */ (
		await StrobingRun.readJson(runsRoot, `${filmId}/scene-trace.json`)
	);
	const horizonCaptions = [
		StrobingComparisonCaptions.trace(previousTrace.frames.slice(300, 420)),
		StrobingComparisonCaptions.trace(newTrace.frames.slice(300, 420)),
		StrobingComparisonCaptions.trace(previousTrace.frames.slice(1380, 1500)),
		StrobingComparisonCaptions.trace(newTrace.frames.slice(1380, 1500)),
	];
	await media.execute('color-film-comparison', [
		'-ss',
		'10',
		'-t',
		'4',
		'-i',
		previousFilm,
		'-ss',
		'10',
		'-t',
		'4',
		'-i',
		newFilm,
		'-ss',
		'46',
		'-t',
		'4',
		'-i',
		previousFilm,
		'-ss',
		'46',
		'-t',
		'4',
		'-i',
		newFilm,
		'-filter_complex',
		`[0:v]setpts=PTS-STARTPTS,scale=960:540,${label('Previous color - sunrise 10-14s')},${horizonCaptions[0]}[a];[1:v]setpts=PTS-STARTPTS,scale=960:540,${label('Corrected color - sunrise 10-14s')},${horizonCaptions[1]}[b];[2:v]setpts=PTS-STARTPTS,scale=960:540,${label('Previous color - sunset 46-50s')},${horizonCaptions[2]}[c];[3:v]setpts=PTS-STARTPTS,scale=960:540,${label('Corrected color - sunset 46-50s')},${horizonCaptions[3]}[d];[a][b]hstack=inputs=2[m];[c][d]hstack=inputs=2[e];[m][e]concat=n=2:v=1:a=0[v]`,
		'-map',
		'[v]',
		'-an',
		'-c:v',
		'libx264',
		'-crf',
		'16',
		'-pix_fmt',
		'yuv420p',
		'-n',
		path.join(run.directory, 'color-film-comparison.mp4'),
	]);
	const diagnosticFrames = await media.measure(
		'diagnostic-comparison-check',
		['-i', path.join(run.directory, 'diagnostic-comparison.mp4')],
		120,
	);
	await media.measure('encoding-comparison-check', ['-i', path.join(run.directory, 'encoding-comparison.mp4')], 120);
	await media.measure('twilight-comparison-check', ['-i', path.join(run.directory, 'twilight-comparison.mp4')], 120);
	await media.measure('full-comparison-check', ['-i', path.join(run.directory, 'full-comparison.mp4')], 1800);
	await media.measure('color-comparison-check', ['-i', path.join(run.directory, 'color-comparison.mp4')], 120);
	await media.measure(
		'color-film-comparison-check',
		['-i', path.join(run.directory, 'color-film-comparison.mp4')],
		240,
	);
	const relative = (file) => path.relative(run.directory, file).replaceAll('\\', '/');
	/** @param {StrobingIndexedRun} record @returns {string} */
	const role = (record) => {
		if (record.id === filmId) return 'Required native 4K film';
		if (record.id === '00031-fixed-film') return 'Previous film - owner-reported horizon color artifact';
		if ([selectedCapture, selectedAnalysis].includes(record.id)) return 'Selected cache and color correction';
		const horizonRole = horizonProof.records.findIndex(
			(entry) => entry.captureId === record.id || entry.analysisId === record.id,
		);
		if (horizonRole >= 0)
			return [
				'Sunset color control - brightness excursion reproduced',
				'Sunset boost-removal ablation',
				'Selected p2 sunset - horizon gate passes',
				'Selected p2 sunrise - horizon gate passes',
			][horizonRole];
		if (['00027-fixed-capture', '00028-capture-analysis'].includes(record.id))
			return 'Supplemental twilight - reversing knots removed, ramp ratio still fails';
		if (['00003-control-capture', '00004-capture-analysis'].includes(record.id))
			return 'Unchanged current-package control';
		const analysis =
			record.result.purpose === 'capture-analysis'
				? record
				: records.find((entry) => entry.result.parentId === record.id || entry.result.filmId === record.id);
		if (analysis?.result.strobingGatePass === false) return 'Rejected candidate - quantitative gate failed';
		return 'Retained diagnostic';
	};
	const movies = records.flatMap((record) =>
		record.videos.map((video) => ({
			runId: record.id,
			label: `${record.id} / ${video.path}`,
			href: `../${record.id}/${video.path}`,
			sha256: video.sha256,
			role: record.state === 'accepted' ? role(record) : 'Failed capture - incomplete artifact',
		})),
	);
	const data = {
		selectedCapture,
		selectedAnalysis,
		filmId,
		filmAnalysis,
		horizonProofId,
		colorDeltaId,
		aggregateStrobingGatePass: full.result.strobingGatePass,
		colorCorrectionQualified: true,
		records,
		movies,
		originalFilm: {
			href: relative(originalFilm),
			...(await StrobingRun.identity(path.dirname(originalFilm), path.basename(originalFilm))),
		},
		comparisons: [
			'diagnostic-comparison.mp4',
			'encoding-comparison.mp4',
			'twilight-comparison.mp4',
			'full-comparison.mp4',
			'color-comparison.mp4',
			'color-film-comparison.mp4',
		],
		reviewStatus: 'Required standards review remains pending due to the session agent thread limit.',
		ownerInspection: 'pending',
		measurementLimits:
			'Recurrence counts distinct cache publications while retaining raw extrema. The separate horizon gate measures broad wrong-direction upper-sky excursions. Consult the selected film analysis for isolated residuals; owner visual acceptance remains separate.',
	};
	await run.writeJson('artifact-index.json', data);
	const serialized = JSON.stringify(data).replaceAll('<', '\\u003c');
	const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>The Hours — strobing experiment</title>
<style>body{font:16px system-ui;background:#11151a;color:#edf0f3;margin:0 auto;padding:32px;max-width:1200px}h1,h2{font-weight:500}a{color:#99d9ff}video{display:block;width:100%;max-height:75vh;background:black;margin:16px 0}section{padding:20px 0;border-top:1px solid #45515f}.note{color:#d6b989}li{margin:10px 0}code{overflow-wrap:anywhere}</style>
<h1>The Hours — strobing experiment</h1><p>Native 3840×2160, 30 fps, 60 seconds. The original scene, seed, camera and astronomical timeline are retained.</p>
<p>The selected cache uses a declared four-metre one-sided surface-limit estimate, monotone cubic solar-angle interpolation, and monotone interpolation through the original physical receiver-light samples. The color correction broadens the sunset display gain from exponent 9 to 2 while preserving its gain limits and the existing adaptation response. No image filtering or exposure averaging is applied.</p>
<p>The sunrise/sunset color gate passes in native source and encoded video. Encoded recurrence and all curvature-ratio gates pass. <strong>The aggregate source recurrence gate remains failed</strong>: unchanged early ground events at publications 112 and 125 enter the strongest-event list after the large color excursion is removed. Exact before/after regional measurements around those events are identical. This delivery qualifies the color correction, not overall strobe-free acceptance. <a href="../${colorDeltaId}/delta.json">Color-delta proof and retained source failure</a>.</p>
<p class="note" id="review"></p><section><h2>Corrected full film</h2><video id="film" controls preload="metadata"></video><a id="film-link">Open native film</a></section>
<section><h2>Original versus corrected</h2><p>The original uses its historical atmosphere package; the diagnostic comparison below isolates the current-package correction.</p><video controls preload="metadata" src="full-comparison.mp4"></video><a id="original">Open immutable original</a></section>
<section><h2>Diagnostic comparisons</h2><video controls loop preload="metadata" src="diagnostic-comparison.mp4"></video><video controls loop preload="metadata" src="encoding-comparison.mp4"></video></section>
<section><h2>Sunrise and sunset color correction</h2><p>Matching clips from the previous and replacement full films, followed by the fixed-camera original/no-boost/p2 sunset comparison.</p><video controls loop preload="metadata" src="color-film-comparison.mp4"></video><video controls loop preload="metadata" src="color-comparison.mp4"></video><a href="../${horizonProofId}/index.html">Color-response graph and causal proof</a></section>
<section><h2>Twilight physical-light interpolation</h2><p>The reversing one-second lighting knots are removed. This supplemental steep-ramp interval still exceeds the curvature-ratio gate in some regions; its failed quantitative result is retained.</p><video controls loop preload="metadata" src="twilight-comparison.mp4"></video></section>
<section><h2>Every retained animation</h2><ul id="movies"></ul></section><section><h2>Evidence runs</h2><ul id="runs"></ul><a href="artifact-index.json">Machine-readable artifact index</a></section>
<script>const data=${serialized};document.getElementById('review').textContent=data.reviewStatus+' Owner visual inspection is pending.';const film='../'+data.filmId+'/captures/creative-full-day.mp4';document.getElementById('film').src=film;document.getElementById('film-link').href=film;document.getElementById('original').href=data.originalFilm.href;
for(const movie of data.movies){const li=document.createElement('li');const a=document.createElement('a');a.href=movie.href;a.textContent=movie.role+' — '+movie.label;li.append(a);document.getElementById('movies').append(li)}for(const run of data.records){const li=document.createElement('li');const a=document.createElement('a');a.href='../'+run.id+'/result.json';a.textContent=run.id+' — '+run.state;li.append(a);document.getElementById('runs').append(li)}</script></html>`;
	await writeFile(path.join(run.directory, 'index.html'), html, {flag: 'wx'});
	await run.writeJson('provenance.json', {
		operation:
			'Read-only authentication of prior runs; explicitly labelled synchronized derived comparisons; complete animation and artifact index.',
		inputs: 'artifact-index.json',
		implementation: await StrobingRun.identity(
			root,
			'experiments/distant-sun-recording-strobing/publish-evidence.js',
		),
		comparisonFrameCount: diagnosticFrames.length,
		comparisonCommands: [
			'diagnostic-comparison-command.json',
			'encoding-comparison-command.json',
			'twilight-comparison-command.json',
			'full-comparison-command.json',
			'color-comparison-command.json',
			'color-film-comparison-command.json',
		],
	});
	await run.finish('accepted', {
		purpose: 'evidence-delivery',
		filmId,
		selectedCapture,
		index: 'index.html',
		allPriorRunsAuthenticated: true,
		movieCount: movies.length,
		comparisonCount: 6,
		colorCorrectionQualified: true,
		aggregateStrobingGatePass: full.result.strobingGatePass,
		ownerInspection: 'pending',
		standardsReview: 'pending',
	});
} catch (error) {
	await run.finish('failed', {error: error instanceof Error ? error.stack : String(error)});
	process.exitCode = 1;
}
