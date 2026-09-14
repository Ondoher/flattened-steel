import assert from 'node:assert/strict';
import path from 'node:path';
import {selectCase} from './cases.mjs';
import {createRun, identity, listFiles, readRepository, repositoryRoot, sha256, verifyRun} from './io/files.mjs';
import {deriveProfile} from './numerics/profile.js';
import {runGpu} from './gpu/host.mjs';
import {inputRun} from './inputs.mjs';

/** Read the pinned controls and verify every retained input artifact.
 * @returns {DialInputs}
 */
export function loadInputs() {
	verifyRun(inputRun);
	const value = JSON.parse(readRepository(`${inputRun}/controls.json`).toString());
	assert.equal(value.schemaId, 'sky-accuracy-inputs-v1');
	assert.equal(value.scenes.length, 17);
	assert.equal(value.native48.transportSpec.domains.position.count, 48);
	return value;
}

/** Traverse the exact static browser import closure plus the explicit dynamic compiler entry.
 * @param {readonly string[]} [entries] - Explicit static roots plus any dynamic compiler entry.
 * @returns {DialFileIdentity[]}
 */
export function browserSources(
	entries = [
		'experiments/sky-accuracy-dials/gpu/browser.js',
		'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js',
	],
) {
	const queue = [...entries];
	const found = new Map();
	while (queue.length) {
		const file = queue.shift();
		if (found.has(file)) continue;
		const bytes = readRepository(file);
		found.set(file, identity(file, bytes));
		for (const match of bytes
			.toString()
			.matchAll(/(?:import|export)\s+(?:[^'";]+?\s+from\s*)?['"]([^'"]+)['"]/gu)) {
			assert.ok(match[1].startsWith('.'), `Unexpected browser dependency: ${match[1]}`);
			queue.push(path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1])));
		}
	}
	return [...found.values()].sort((a, b) => a.path.localeCompare(b.path));
}

/** Run one explicitly declared configuration, one wavelength at a time.
 * @param {string} caseId @param {DialExecutionSelection} selection
 * @param {readonly number[]} [viewIntervals] @param {readonly SkySolarInterpolation[]} [solarInterpolations]
 * @param {string} [predictionRun] @returns {Promise<DialExecutionResult>}
 */
export async function executeCase(
	caseId,
	selection,
	viewIntervals = [30],
	solarInterpolations = ['monotone-cubic'],
	predictionRun,
) {
	assert.ok(['screen', 'full', 'repeat'].includes(selection));
	const inputs = loadInputs(),
		candidate = selectCase(caseId);
	const profile = deriveProfile(inputs.native48, {
		...candidate.controls,
		viewIntervals,
		solarInterpolations,
		representations: ['cumulative', 'grouped', 'analytic-n1', 'frozen-increment-analytic-n1'],
	});
	const channels =
		selection === 'full'
			? Array.from({length: 40}, (_, i) => i)
			: selection === 'repeat'
				? [24]
				: [0, 8, 16, 24, 30, 39];
	const scenes =
		selection === 'full'
			? inputs.scenes
			: inputs.scenes.filter((scene) => ['09:30', '11:15', '13:30'].includes(scene.time));
	const sources = browserSources();
	const parents = [identity(`${inputRun}/sealed.json`), identity(`${inputRun}/controls.json`)];
	if (predictionRun) parents.push(verifyRun(predictionRun));
	const control = {buildRequest: profile.buildRequest, scenes, controls: profile.controls, channels};
	const recipe = {
		parents,
		operation:
			'Compile fixed N1..N4 using sparse view support; immediately reconstruct Float32 cumulative orders, integrate requested views in binary64, retain compact per-channel spectra, and discard all recurrence fields.',
		parameters: {
			caseId,
			selection,
			controls: profile.controls,
			scenes,
			channels,
			hypothesis: candidate.hypothesis,
			predictionRun: predictionRun ?? null,
			sourceIdentities: sources,
			controlSha256: sha256(JSON.stringify(control)),
		},
	};
	const suffix = selection === 'screen' ? 'scr' : selection === 'repeat' ? 'rep' : 'full';
	const run = createRun(`${caseId}-${suffix}`, recipe);
	console.log(
		JSON.stringify({
			run: run.path,
			caseId,
			selection,
			channels: channels.length,
			controls: profile.controls,
			layout: profile.layout,
		}),
	);
	let execution = null,
		failure = null;
	const channelArtifacts = /** @type {DialFileIdentity[]} */ ([]);
	try {
		run.write('control.json', control);
		run.write('profile-layout.json', profile.layout);
		// This compact closure snapshot preserves reproducibility when authored code later changes.
		const snapshot = new Map(
			[...sources, ...listFiles('experiments/sky-accuracy-dials').map((file) => identity(file))].map((item) => [
				item.path,
				item,
			]),
		);
		for (const source of snapshot.values())
			run.write(`sources/${source.path}.txt`, readRepository(source.path, source), {
				parents: [source],
				operation: 'Retain the exact authored source bytes executed by this run.',
			});
		run.write('runtime-packages.json', {
			package: identity('package.json'),
			lock: identity('package-lock.json'),
			puppeteerPackage: identity('node_modules/puppeteer/package.json'),
			puppeteerCorePackage: identity('node_modules/puppeteer-core/package.json'),
		});
		run.guard();
		execution = await runGpu({
			repositoryRoot,
			scratchDirectory: run.scratchPath,
			chromePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
			control,
			sourceIdentities: sources,
			readSource: async (file) => {
				const source = sources.find((item) => item.path === file);
				assert.ok(source, `Module absent from authenticated closure: ${file}`);
				return readRepository(file, source);
			},
			onProgress: async (progress) => {
				run.progress(progress.phase, progress.message, progress.completed, progress.total);
				if (progress.phase === 'channel-complete') console.log(JSON.stringify(progress));
			},
			onChannel: async (channel) => {
				assert.ok(channels.includes(channel.channel));
				const stem = `channel-${String(channel.channel).padStart(2, '0')}`;
				const bytes = Buffer.alloc(channel.values.length * 8);
				for (let index = 0; index < channel.values.length; index++) {
					assert.ok(Number.isFinite(channel.values[index]) && channel.values[index] >= 0);
					bytes.writeDoubleLE(channel.values[index], index * 8);
				}
				const artifact = run.write(`${stem}.f64`, bytes);
				const {values, ...metadata} = channel;
				run.write(`${stem}.json`, {
					...metadata,
					spectra: artifact,
					layout: 'representation-view-order-ray-f64le-v1',
				});
				channelArtifacts.push(artifact);
			},
			timeoutMilliseconds: 30 * 60 * 1000,
		});
		assert.ok(execution.executionSucceeded, execution.failure ?? 'Browser execution failed.');
		assert.equal(channelArtifacts.length, channels.length);
		assert.ok(execution.servedSourcesReauthenticated);
		assert.ok(execution.cleanup.childExited && execution.cleanup.serverClosed);
	} catch (error) {
		failure = {message: String(error), stack: error.stack};
	}
	const cleanup = run.cleanup();
	try {
		run.write('execution.json', {execution, failure, channels: channelArtifacts, cleanup});
	} catch (error) {
		failure ??= {message: String(error), stack: error.stack};
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		caseId,
		selection,
		channelCount: channelArtifacts.length,
		failure,
	});
	verifyRun(run.path);
	const accepted = JSON.parse(readRepository(seal.path, seal).toString()).state === 'accepted';
	console.log(JSON.stringify({run: run.path, accepted, retainedChannels: channelArtifacts.length, failure}));
	if (!accepted)
		throw new Error(
			`GPU experiment failed: ${run.path}; ${failure?.message ?? 'source or heartbeat validation failed'}`,
		);
	return {run: run.path, seal, accepted};
}
