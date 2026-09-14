import assert from 'node:assert/strict';
import {existsSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {ALL_RAYS, RADIANCE_UNITS, parseBoundaryTsv} from '../../analysis/boundary.mjs';
import {scoreBoundary} from '../../analysis/metrics.mjs';
import {selectCase} from '../../cases.mjs';
import {loadInputs} from '../../execution.mjs';
import {runGpu} from '../../gpu/host.mjs';
import {inputRun} from '../../inputs.mjs';
import {
	createRun,
	identity,
	listFiles,
	outputRelative,
	readRepository,
	repositoryRoot,
	resolveRepository,
	sha256,
	verifyRun,
} from '../../io/files.mjs';
import {acceptControls, deriveProfile} from '../../numerics/profile.js';
import {verifyOrderImplementation} from '../proof.mjs';

const browserModulePath = 'experiments/sky-accuracy-dials/orders/browser.js';
const compilerModulePath = 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
const actualOrders = [1, 2, 3, 4, 5, 6];
const channels = [0, 8];
const screenTimes = ['09:30', '11:15', '13:30'];

/** Construct the declared Q30 diagnostic without changing the pinned N4 request.
 * @param {string} caseId @returns {SkyDerivedProfile}
 */
function ordersProfile(caseId) {
	const candidate = selectCase(caseId);
	return deriveProfile(loadInputs().native48, {
		...candidate.controls,
		viewIntervals: [30],
		solarInterpolations: ['monotone-cubic'],
		representations: ['cumulative', 'grouped', 'analytic-n1', 'frozen-increment-analytic-n1'],
	});
}

/** Normalize recurrence controls while leaving the parent's original view recipe intact.
 * @param {SkyControlInput} input @returns {SkyControlInput}
 */
function recurrenceControls(input) {
	const {viewIntervals, solarInterpolations, representations, viewRule, ...recurrence} = acceptControls(input);
	return recurrence;
}

/** Find and authenticate a matching accepted screen; this performs no GPU work or writes.
 * @param {string} caseId @returns {DialOrdersParent}
 */
export function findOrdersParent(caseId) {
	const profile = ordersProfile(caseId);
	const scenes = loadInputs().scenes.filter((scene) => screenTimes.includes(scene.time));
	const runRoot = `${outputRelative}/runs`;
	const candidates = readdirSync(resolveRepository(runRoot), {withFileTypes: true})
		.filter((entry) => entry.isDirectory() && /^\d{5}-[a-z0-9-]+$/u.test(entry.name))
		.map((entry) => `${runRoot}/${entry.name}`)
		.sort()
		.reverse();
	const matching = [];
	for (const run of candidates) {
		const controlPath = `${run}/control.json`,
			sealPath = `${run}/sealed.json`;
		if (
			!existsSync(resolveRepository(controlPath, runRoot, false)) ||
			!existsSync(resolveRepository(sealPath, runRoot, false))
		)
			continue;
		/** @type {SkyGpuControl} */
		const control = JSON.parse(readRepository(controlPath).toString());
		if (
			'actualOrders' in control ||
			!isDeepStrictEqual(control.buildRequest, profile.buildRequest) ||
			!isDeepStrictEqual(control.scenes, scenes) ||
			!isDeepStrictEqual(recurrenceControls(control.controls), recurrenceControls(profile.controls)) ||
			!control.controls.viewIntervals.includes(30) ||
			!control.controls.solarInterpolations.includes('monotone-cubic') ||
			!channels.every((channel) => control.channels.includes(channel)) ||
			JSON.parse(readRepository(sealPath).toString()).state !== 'accepted'
		)
			continue;
		matching.push({run, control});
	}
	matching.sort(
		(first, second) =>
			first.control.controls.viewIntervals.length * first.control.controls.solarInterpolations.length -
				second.control.controls.viewIntervals.length * second.control.controls.solarInterpolations.length ||
			second.run.localeCompare(first.run),
	);
	const selected = matching[0];
	assert.ok(selected, `No accepted Q30 screen matches the physical and recurrence controls for ${caseId}.`);
	const seal = verifyRun(selected.run);
	const controlIdentity = identity(`${selected.run}/control.json`);
	assert.deepEqual(JSON.parse(readRepository(controlIdentity.path, controlIdentity).toString()), selected.control);
	const executionIdentity = identity(`${selected.run}/execution.json`);
	const execution = JSON.parse(readRepository(executionIdentity.path, executionIdentity).toString()).execution;
	assert.ok(execution.executionSucceeded && execution.servedSourcesReauthenticated);
	const plan = execution.browser.plan;
	assert.equal(plan.rayCount, 243);
	assert.equal(
		plan.viewCount,
		selected.control.controls.viewIntervals.length * selected.control.controls.solarInterpolations.length,
	);
	assert.match(plan.coordinateSha256, /^[a-f0-9]{64}$/u);
	assert.ok(Number.isSafeInteger(plan.coordinateCount) && plan.coordinateCount > 0);
	const artifacts = [seal, controlIdentity, executionIdentity];
	const parentChannels = channels.map((channel) => {
		const metadata = identity(`${selected.run}/channel-${String(channel).padStart(2, '0')}.json`);
		const value = JSON.parse(readRepository(metadata.path, metadata).toString());
		assert.equal(value.channel, channel);
		assert.deepEqual(value.shape, {
			representationCount: selected.control.controls.representations.length,
			viewCount: plan.viewCount,
			orderCount: 4,
			rayCount: 243,
		});
		assert.equal(value.compilerReport.schemaId, 'algorithm32-distant-sun-offline-wavelength-result-v1');
		assert.equal(value.layout, 'representation-view-order-ray-f64le-v1');
		assert.equal(value.fieldChecks.length, 4);
		for (const [index, check] of value.fieldChecks.entries()) {
			assert.equal(check.fieldId, `J${index + 1}`);
			assert.equal(check.count, plan.coordinateCount);
			assert.match(check.pureSha256, /^[a-f0-9]{64}$/u);
			assert.match(check.cumulativeSha256, /^[a-f0-9]{64}$/u);
		}
		const expectedSpectraPath = `${selected.run}/channel-${String(channel).padStart(2, '0')}.f64`;
		assert.equal(value.spectra.path, expectedSpectraPath);
		const bytes = readRepository(expectedSpectraPath, value.spectra);
		assert.equal(bytes.length, value.shape.representationCount * value.shape.viewCount * 4 * 243 * 8);
		assert.equal(sha256(bytes), value.spectraSha256);
		const spectra = identity(expectedSpectraPath, bytes);
		artifacts.push(metadata, spectra);
		return {
			metadata,
			spectra,
			expected: {
				coordinateCount: plan.coordinateCount,
				coordinateSha256: plan.coordinateSha256,
				shape: value.shape,
				fieldChecks: value.fieldChecks,
				spectraSha256: spectra.sha256,
			},
		};
	});
	return {run: selected.run, seal, control: selected.control, artifacts, channels: parentChannels};
}

/** Authenticate the static browser closure and its explicit dynamic production shader entry.
 * @returns {DialFileIdentity[]}
 */
function browserSources() {
	const queue = [browserModulePath, compilerModulePath];
	/** @type {Map<string, DialFileIdentity>} */
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
	return [...found.values()].sort((first, second) => first.path.localeCompare(second.path));
}

/** Score all actual stages on explicitly partial channel coverage, transposing X/Y at the boundary.
 * @param {DialOrdersControl} control @param {readonly DialOrdersRetainedChannel[]} retained
 * @param {DialFileIdentity} sourceIdentity @returns {DialOrdersScore[]}
 */
function scoreOrders(control, retained, sourceIdentity) {
	const measurementIdentity = identity(`${inputRun}/measurements.tsv`);
	const measured = parseBoundaryTsv(readRepository(measurementIdentity.path, measurementIdentity).toString(), {
		configId: 'kider-measurements',
		sourceIdentity: measurementIdentity,
	});
	/** @type {DialOrdersScore[]} */ const scores = [];
	for (const [representationIndex, representation] of control.controls.representations.entries()) {
		for (const order of actualOrders) {
			const values = new Float64Array(control.scenes.length * 81 * channels.length);
			for (const [channelOrdinal, channel] of retained.entries()) {
				assert.equal(channel.channel, channels[channelOrdinal]);
				assert.equal(channel.shape.viewCount, 1);
				const offset = (representationIndex * 6 + order - 1) * channel.shape.rayCount;
				for (let scene = 0; scene < control.scenes.length; scene++)
					for (let x = 0; x < 9; x++)
						for (let y = 0; y < 9; y++)
							values[(scene * 81 + y * 9 + x) * channels.length + channelOrdinal] =
								channel.bytes.readDoubleLE((offset + scene * 81 + x * 9 + y) * 8);
			}
			const model = {
				configId: `${control.buildRequest.id}-${representation}-n${order}`,
				quantity: /** @type {DialAnalysisQuantity} */ ('radiance'),
				units: RADIANCE_UNITS,
				times: control.scenes.map((scene) => scene.time),
				channels,
				rayIndices: ALL_RAYS,
				values,
				sourceIdentity,
			};
			const score = scoreBoundary(model, measured, channels);
			assert.equal(score.fullRegisteredBoundary, false);
			scores.push({representation, order, score});
		}
	}
	return scores;
}

/** Execute real receiver-local N1 through N6 on channels zero and eight, with exact accepted-prefix parity.
 * @param {string} caseId @param {SkySixSelection} [selection] @returns {Promise<DialExecutionResult>}
 */
export async function executeOrders(caseId, selection = 'screen') {
	assert.ok(['screen', 'all-times'].includes(selection));
	const profile = ordersProfile(caseId),
		parent = findOrdersParent(caseId),
		inputs = loadInputs();
	const scenes =
		selection === 'all-times' ? inputs.scenes : inputs.scenes.filter((scene) => screenTimes.includes(scene.time));
	/** @type {DialOrdersControl} */
	const control = {
		buildRequest: profile.buildRequest,
		controls: profile.controls,
		scenes,
		channels,
		executionSchemaId: 'sky-six-order-control-v1',
		actualOrders,
		prefixControl: parent.control,
	};
	const sources = browserSources();
	const parents = [
		identity(`${inputRun}/sealed.json`),
		identity(`${inputRun}/controls.json`),
		identity(`${inputRun}/measurements.tsv`),
		...parent.artifacts,
	];
	/** @type {DialDerivation} */
	const recipe = {
		parents,
		operation:
			'Run the contained receiver-local recurrence through J6 using actual L4/J5/L5/J6 passes; reproduce the accepted production J1..J4 prefix exactly; retain physical binary64 spectra for six cumulative stages.',
		parameters: {
			caseId,
			selection,
			actualOrders,
			controls: profile.controls,
			scenes,
			channels,
			prefixParent: parent.run,
			sourceIdentities: sources,
			controlSha256: sha256(JSON.stringify(control)),
			units: RADIANCE_UNITS,
			fullRegisteredBoundary: false,
		},
	};
	const run = createRun(`n6-${caseId}`.slice(0, 16).replace(/-$/u, ''), recipe);
	console.log(JSON.stringify({run: run.path, caseId, selection, channels, actualOrders, prefixParent: parent.run}));
	/** @type {DialOrdersRetainedChannel[]} */ const retained = [];
	/** @type {DialOrdersParityChannel[]} */ const parity = [];
	let execution = null,
		failure = null;
	try {
		const controlIdentity = run.write('control.json', control);
		run.write('profile-layout.json', {
			...profile.layout,
			actualOrders,
			compilerReportSchema: 'sky-order-wavelength-result-v1',
		});
		run.progress(
			'implementation-proof',
			'Checking unchanged shader templates and manufactured six-order evaluator prefix.',
		);
		run.write('implementation-proof.json', verifyOrderImplementation(parent.control));
		const snapshots = new Map(
			[...sources, ...listFiles('experiments/sky-accuracy-dials').map((file) => identity(file))].map((source) => [
				source.path,
				source,
			]),
		);
		for (const source of snapshots.values())
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
			browserModulePath,
			compilerModulePath,
			expectedOrderCount: 6,
			compilerReportSchema: 'sky-order-wavelength-result-v1',
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
				assert.equal(channel.channel, channels[retained.length]);
				assert.deepEqual(channel.shape, {
					representationCount: 4,
					viewCount: 1,
					orderCount: 6,
					rayCount: scenes.length * 81,
				});
				const bytes = Buffer.alloc(channel.values.length * 8);
				for (const [index, value] of channel.values.entries()) {
					assert.ok(Number.isFinite(value) && value >= 0);
					bytes.writeDoubleLE(value, index * 8);
				}
				const stem = `channel-${String(channel.channel).padStart(2, '0')}`;
				const spectra = run.write(`${stem}.f64`, bytes);
				const {values, ...metadata} = channel;
				run.write(`${stem}.json`, {
					...metadata,
					schemaId: 'sky-six-order-spectra-v1',
					actualOrders,
					units: RADIANCE_UNITS,
					spectra,
					layout: 'representation-view-six-order-ray-f64le-v1',
				});
				retained.push({channel: channel.channel, shape: channel.shape, spectra, bytes});
				const authority = parent.channels[channels.indexOf(channel.channel)];
				const actual = /** @type {DialOrdersPrefixProof|null} */ (channel.compilerReport.prefixProof ?? null);
				let parityFailure = null;
				try {
					assert.ok(actual, 'Missing production-prefix proof.');
					const {sixOrderEvaluatorPrefix, ...parentPrefix} = actual;
					assert.deepEqual(
						parentPrefix,
						authority.expected,
						'Actual J1..J4 prefix differs from the accepted matched screen.',
					);
					assert.deepEqual(
						sixOrderEvaluatorPrefix,
						{comparisons: 4 * 4 * scenes.length * 81, bitExact: true},
						'The six-order view evaluator changed an original prefix scalar.',
					);
				} catch (error) {
					parityFailure = String(error);
				}
				parity.push({
					channel: channel.channel,
					parentMetadata: authority.metadata,
					parentSpectra: authority.spectra,
					expected: authority.expected,
					actual,
					passed: !parityFailure,
					failure: parityFailure,
				});
				assert.equal(parityFailure, null, parityFailure ?? undefined);
			},
			timeoutMilliseconds: 30 * 60 * 1000,
		});
		assert.ok(execution.executionSucceeded, execution.failure ?? 'Browser execution failed.');
		assert.equal(retained.length, channels.length);
		assert.ok(
			execution.servedSourcesReauthenticated && execution.cleanup.childExited && execution.cleanup.serverClosed,
		);
		for (const source of parents) readRepository(source.path, source);
		run.write('scores.json', {
			schemaId: 'sky-six-order-scores-v1',
			units: RADIANCE_UNITS,
			channels,
			fullRegisteredBoundary: false,
			scope: 'Two-channel numerical diagnostic; not the full registered B1 score.',
			rows: scoreOrders(control, retained, controlIdentity),
		});
	} catch (error) {
		failure = {message: String(error), stack: error.stack};
	}
	const cleanup = run.cleanup();
	try {
		run.write('parity-analysis.json', {
			schemaId: 'sky-six-order-prefix-parity-v1',
			parentRun: parent.run,
			parentSeal: parent.seal,
			operation:
				'Exact coordinate identity, J1..J4 pure and Float32 cumulative identities, and complete original four-order binary64 spectra identity.',
			channels: parity,
			passed: parity.length === channels.length && parity.every((row) => row.passed),
		});
		run.write('execution.json', {execution, failure, channels: retained.map((item) => item.spectra), cleanup});
	} catch (error) {
		failure ??= {message: String(error), stack: error.stack};
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		caseId,
		selection,
		actualOrders,
		channelCount: retained.length,
		prefixParityPassed: parity.length === channels.length && parity.every((row) => row.passed),
		failure,
	});
	verifyRun(run.path);
	const accepted = JSON.parse(readRepository(seal.path, seal).toString()).state === 'accepted';
	console.log(JSON.stringify({run: run.path, accepted, retainedChannels: retained.length, failure}));
	if (!accepted)
		throw new Error(
			`Six-order diagnostic failed: ${run.path}; ${failure?.message ?? 'source or heartbeat validation failed'}`,
		);
	return {run: run.path, seal, accepted};
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
	assert.ok(
		process.argv[2],
		'Usage: node experiments/sky-accuracy-dials/orders/run/execute.mjs CASE [screen|all-times]',
	);
	await executeOrders(process.argv[2], /** @type {SkySixSelection} */ (process.argv[3] ?? 'screen'));
}
