import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {
	createRun,
	identity,
	readRepository,
	repositoryRoot,
	verifyRun,
	listFiles,
	outputRelative,
} from './io/files.mjs';
import {own, pin} from './common.mjs';
import {runGpu} from './gpu/host.mjs';
import {browserSources} from '../sky-accuracy-dials/execution.mjs';
import {acceptControls} from '../sky-accuracy-dials/numerics/profile.js';
import {scalarFigure, horizonFigure} from './render.mjs';

/** Compile all four real orders with fixed physical/grid/view controls.
 * @returns {Promise<void>} Seals an accepted capture or a failed run without discarding evidence.
 */
async function main() {
	const started = performance.now(),
		kind = process.argv[2],
		stage = process.argv[3] ?? 'pilot';
	assert.ok(['baseline', 'candidate', 'refinement'].includes(kind) && ['pilot', 'witness', 'full'].includes(stage));
	/** @type {AngularFileIdentity[]} */ const parents = [];
	const registration = /** @type {AngularRegistration} */ (
		own('tmp/experiments/sky-angular-quadrature/runs/00002-q1-refine-reg', 'registration.json', parents)
	);
	const assessment = /** @type {{selected:string|null}} */ (
		own('tmp/experiments/sky-angular-quadrature/runs/00003-q1-screen', 'assessment.json', parents)
	);
	assert.ok(assessment.selected);
	const selected = registration.candidates.find((c) => c.id === assessment.selected);
	assert.ok(selected?.frame === 'receiver');
	const allocationRoot = process.argv[4];
	let allocation = /** @type {AngularAllocation|null} */ (null);
	if (allocationRoot) allocation = /** @type {AngularAllocation} */ (own(allocationRoot, 'allocation.json', parents));
	if (kind === 'refinement')
		own('tmp/experiments/sky-angular-quadrature/runs/00010-q2-space-amend', 'amendment.json', parents);
	assert.ok(stage === 'pilot' || allocation, 'Propagation beyond the pilot needs a sealed measured allocation.');
	const inventory = kind === 'refinement' ? allocation?.refinement : selected;
	assert.ok(inventory, 'Refinement inventory must be prospectively allocated.');
	const original = structuredClone(registration.paper);
	const buildRequest =
		kind === 'baseline'
			? original
			: {
					...original,
					id: `sky-angular-quadrature-${inventory.id}-native51-direct40-n4-v1`,
					transportSpec: {
						...original.transportSpec,
						domains: {
							...original.transportSpec.domains,
							incoming: {
								id: inventory.id,
								directionCount: inventory.directions.length,
								unitVectors: inventory.directions.map(
									(v) => /** @type {SkyVector3} */ ([v[0], v[1], v[2]]),
								),
								integrationWeightsSteradians: Array.from(inventory.weights),
							},
						},
					},
				};
	const {incoming: _incoming, ...controls} = acceptControls({
		altitudeCount: 51,
		sourceIntervals: 20,
		transportIntervals: 40,
		viewIntervals: [30],
		solarInterpolations: ['monotone-cubic'],
		representations: ['cumulative'],
	});
	const channels = stage === 'pilot' ? [16] : Array.from({length: 40}, (_, i) => i);
	const scenes = stage === 'full' ? registration.scenes : registration.scenes.filter((s) => s.time === '11:15');
	/** @type {AngularGpuControl} */ const control = {buildRequest, controls, channels, scenes, horizonWitness: true};
	const browser = 'experiments/sky-angular-quadrature/gpu/browser.js',
		compiler = 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
	const closure = browserSources([browser, compiler]);
	parents.push(...closure);
	pin(parents);
	let spent = 0;
	if (allocation)
		for (const file of listFiles(`${outputRelative}/runs`).filter((f) => f.endsWith('/sealed.json'))) {
			const s = JSON.parse(readRepository(file, undefined, 64 * 1024 ** 2).toString());
			if (s.recipe.parents.some((p) => p.path === `${allocationRoot}/sealed.json`))
				spent += s.result.elapsedMilliseconds ?? 0;
		}
	const timeout = allocation
		? Math.min(allocation.jobs[`${kind}-${stage}`], allocation.maximumMilliseconds - spent - 30000)
		: 120000;
	assert.ok(Number.isFinite(timeout) && timeout > 1000, 'Post-pilot allocation exhausted.');
	const baselineRoot = process.argv[5] ?? null;
	if (baselineRoot) own(baselineRoot, 'control.json', parents);
	const name = `q2-${kind === 'baseline' ? 'base' : kind === 'candidate' ? 'cand' : 'ref'}-${stage}`;
	const run = createRun(name, {
		parents,
		operation:
			'Run authenticated unchanged GPU recurrence J1-L1-J2-L2-J3-L3-J4 with only the selected incoming inventory changed; reconstruct Float32 cumulative fields and separately integrate pure orders through identical Q30 views.',
		parameters: {
			kind,
			stage,
			maximumMilliseconds: timeout,
			allocationMillisecondsAlreadySpent: spent,
			channels,
			scenes,
			control,
			logicalPeakFieldBytes:
				4 * 51 * 180 * (4374 + 2 * buildRequest.transportSpec.domains.incoming.directionCount),
			finalGridUnchanged: true,
			finalPayloadWritten: false,
		},
	});
	let execution = null,
		failure = null;
	/** @type {AngularScalarRow[]} */ const progressRows = [];
	const horizon = Array.from({length: 9}, () => []);
	const baselineHorizon = baselineRoot ? Array.from({length: 9}, () => []) : null;
	try {
		run.write('control.json', control);
		execution = await runGpu({
			repositoryRoot,
			scratchDirectory: run.scratchPath,
			chromePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
			control,
			sourceIdentities: closure,
			browserModulePath: browser,
			compilerModulePath: compiler,
			timeoutMilliseconds: timeout,
			readSource: async (file) => {
				const record = closure.find((s) => s.path === file);
				assert.ok(record);
				return readRepository(file, record);
			},
			onProgress: async (event) => {
				run.guard();
				run.progress(event.phase, event.message, event.completed, event.total);
			},
			onChannel: async (channel) => {
				const stem = `channel-${String(channel.channel).padStart(2, '0')}`,
					bytes = Buffer.alloc(channel.values.length * 8);
				const report = /** @type {AngularGpuReport} */ (channel.compilerReport),
					rayCount = channel.shape.rayCount,
					benchmarkCount = scenes.length * 81;
				assert.ok(
					report.pureRaySpectra.length === 4 &&
						report.pureRaySpectra.every(
							(v) => v.length === rayCount && v.every((x) => Number.isFinite(x) && x >= 0),
						),
					'Pure-ray diagnostic shape/value mismatch.',
				);
				let baselineValues = null;
				if (baselineRoot) {
					const meta = JSON.parse(readRepository(`${baselineRoot}/${stem}.json`).toString());
					assert.equal(
						meta.fieldChecks[0].pureSha256,
						channel.fieldChecks[0].pureSha256,
						'Matched J1 source field changed.',
					);
					baselineValues = readRepository(meta.spectra.path, meta.spectra);
				}
				for (let i = 0; i < 9; i++) {
					horizon[i].push(channel.values[3 * rayCount + benchmarkCount + i]);
					if (baselineHorizon)
						baselineHorizon[i].push(baselineValues.readDoubleLE((3 * rayCount + benchmarkCount + i) * 8));
				}
				progressRows.push({
					label: `channel${channel.channel} (${buildRequest.transportSpec.domains.spectrum.channels[channel.channel].centerNanometers}nm)`,
					baseline: baselineHorizon?.[3].at(-1),
					candidate: kind === 'baseline' ? undefined : horizon[3].at(-1),
					...(kind === 'baseline' ? {baseline: horizon[3].at(-1)} : {}),
				});
				channel.values.forEach((v, i) => bytes.writeDoubleLE(v, i * 8));
				const artifact = run.write(`${stem}.f64`, bytes),
					{values, ...metadata} = channel;
				run.write(`${stem}.json`, {
					...metadata,
					spectra: artifact,
					layout: 'cumulative-order-scene-X-Y-plus-nine-horizon-f64le-v1',
				});
				if (progressRows.length % 10 === 0 || stage === 'pilot') {
					const file = `progress-${String(channel.channel).padStart(2, '0')}.svg`;
					run.write(
						file,
						scalarFigure(progressRows, `${kind} N4 spectral progress: 3° source-facing horizon`),
					);
					run.progress('visual', `${run.path}/${file}`);
				}
				if (progressRows.length === 40) {
					const wavelengths = buildRequest.transportSpec.domains.spectrum.channels.map(
						(c) => c.centerNanometers,
					);
					run.write(
						'horizon.svg',
						horizonFigure(baselineHorizon ?? horizon, baselineHorizon ? horizon : null, wavelengths),
					);
					run.progress('visual', `${run.path}/horizon.svg`);
				}
			},
		});
		assert.ok(execution.executionSucceeded, execution.failure ?? 'GPU capture failed.');
	} catch (error) {
		failure = {message: String(error), stack: error.stack};
	}
	try {
		run.cleanup();
		run.write('execution.json', {execution, failure});
	} catch (error) {
		failure ??= {message: String(error), stack: error.stack};
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		elapsedMilliseconds: performance.now() - started,
		kind,
		stage,
		executionSucceeded: execution?.executionSucceeded ?? false,
		failure,
	});
	verifyRun(run.path);
	const actual = JSON.parse(readRepository(seal.path).toString());
	console.log(
		JSON.stringify({run: run.path, state: actual.state, elapsedMilliseconds: performance.now() - started, failure}),
	);
	assert.equal(actual.state, 'accepted');
}
await main();
