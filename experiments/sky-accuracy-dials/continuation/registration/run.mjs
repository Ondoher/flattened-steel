import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {closeSync, fstatSync, openSync, readSync, readdirSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {ALL_CHANNELS, ALL_RAYS, CAPTURE_TIMES, SCORE_CHANNELS, SCREEN_SELECTION} from '../../analysis/boundary.mjs';
import {loadInputs} from '../../execution.mjs';
import {inputRun} from '../../inputs.mjs';
import {
	checkedAbsolute,
	createRun,
	identity,
	outputRelative,
	readRepository,
	resolveRepository,
	storage,
	verifyRun,
} from '../../io/files.mjs';
import {deriveProfile} from '../../numerics/profile.js';
import {benchmarkRay} from '../../numerics/view.js';
import {extractBoundary, loadSpectra, measurements} from '../../processing.mjs';
import {continuationCases} from '../cases.mjs';

const MiB = 1024 ** 2,
	GiB = 1024 ** 3;
const planPath = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/continuation-plan.md';
const baselinePath = '.codex-tmp/review-standards/session-UkTobr/baseline.json';
const originalRoot = `${outputRelative}/runs`;
const originalBaseline = `${originalRoot}/00054-baseline-full`;
const originalSummary = `${originalRoot}/00098-campaign-summary`;
/** Exact original identities by sequence; no discovery-based substitution is permitted. @type {readonly string[]} */
const originalNames =
	`inputs equation-proofs baseline-scr baseline-scr score baseline-rep prediction-floor prediction baseline-scr prediction-check j1-model prediction p55-scr p51-scr prediction-check segmented-scr s40-scr t80-scr i32-scr i128-scr w39-scr prediction prediction prediction prediction segmented-scr s80-scr t160-scr i512-scr w51-scr p63-scr p51-t80-scr w39-i128-scr baseline-scr prediction-check prediction-check prediction-check prediction-check representation factorial factorial density-n1 density-n1 equation-proofs score prediction prediction n6-baseline s40-t80-scr i128-t80-scr prediction-check prediction-check factorial factorial baseline-full score s40-full t80-full prediction prediction s80-full prediction-check t160-full prediction-check prediction s80-t160-full prediction-check factorial score comparison score comparison score comparison score comparison score comparison segmented-full prediction segmented-full prediction-check score score comparison n6-t160 n6-i512 campaign-summary equation-proofs prediction i2048-scr prediction-check j1-invariance score comparison source-repr transport-repr residuals campaign-summary`.split(
		' ',
	);

/** Independent hard limits; the actual private-memory ceiling is narrowed at registration.
 * @readonly @type {DialContinuationResourceCaps}
 */
export const continuationLimits = {
	totalRetainedBytes: 512 * MiB,
	newRetainedBytes: 256 * MiB,
	liveScratchBytes: GiB,
	minimumFreeDiskBytes: 40 * GiB,
	constructionSlots: 36,
	fullCaptureSlots: 8,
	concurrentGpuJobs: 1,
	gpuJobElapsedMilliseconds: 18 * 60 * 60 * 1000,
	cpuJobElapsedMilliseconds: 8 * 60 * 60 * 1000,
	screenTimeoutMilliseconds: 30 * 60 * 1000,
	fullTimeoutMilliseconds: 90 * 60 * 1000,
	scalarFieldBytes: GiB,
	hostHeadroomBytes: 2 * GiB,
	processPrivateBytes: 6 * GiB,
	initialAvailableMemoryFraction: 0.5,
	localJ2QueryCount: 16,
	modelRevisionsPerWorkPackage: 1,
	phaseAllocations: [
		{phase: 'C0', constructionSlots: 0, fullCaptureSlots: 0, retainedBytes: 8 * MiB},
		{phase: 'C1', constructionSlots: 2, fullCaptureSlots: 0, retainedBytes: 16 * MiB},
		{phase: 'C2', constructionSlots: 12, fullCaptureSlots: 0, retainedBytes: 48 * MiB},
		{phase: 'C3', constructionSlots: 10, fullCaptureSlots: 0, retainedBytes: 32 * MiB},
		{phase: 'C4', constructionSlots: 4, fullCaptureSlots: 0, retainedBytes: 16 * MiB},
		{phase: 'C5', constructionSlots: 8, fullCaptureSlots: 8, retainedBytes: 104 * MiB},
		{phase: 'C6', constructionSlots: 0, fullCaptureSlots: 0, retainedBytes: 20 * MiB},
		{phase: 'failure-and-sealing-reserve', constructionSlots: 0, fullCaptureSlots: 0, retainedBytes: 12 * MiB},
	],
};

/** Numerical/measurement gates frozen independently of future target values.
 * @readonly @type {DialContinuationScientificGates}
 */
const scientificGates = {
	implementationFloorW: 1e-8,
	minimumSignAgreement: 0.9,
	maximumRelativeVectorError: 0.25,
	referenceRemainderMultiplier: 2,
	maximumAllowanceToReduction: 0.2,
	strictReductionAllowanceMultiplier: 2,
	maximumNumericalReductionForecastError: 0.25,
	minimumUsefulKiderImprovementMilliwatt: 0.01,
	scoreForecastRelativeAllowance: 0.25,
	scoreForecastAbsoluteAllowanceMilliwatt: 0.01,
	referenceEquation:
		'U=sum_components(2*largest_supported_component_remainder_or_independent_discrepancy)+separately_measured_interaction_allowances; require U<=0.20D and ||Lcontrol-Lreference||-||Lcandidate-Lreference||>2U.',
	referenceLimitations: [
		'An empirical allowance is not a rigorous bound or confidence interval.',
		'No Richardson remainder division without a validated convergence law.',
		'Missing material terms, failed refinement or unexplained method disagreement makes the affected reference inadequate; unresolved terms are not zero.',
		'Fixed-field view accuracy does not qualify cache accuracy; finite-N4 accuracy does not resolve the scattering tail.',
		'Reference adequacy must hold at each actual full-assessment group; screen allowances do not automatically transfer.',
	],
	angularGroups: [
		'all-selected-rays',
		'near-sun-at-most-15deg',
		'middle-sun-15-to-90deg',
		'antisolar-at-least-90deg',
		'low-elevation-at-most-20deg',
		'zenith-at-least-75deg',
	],
};

/** Named mandated difficult points, followed by geometric and point-SSE additions.
 * @readonly @type {Readonly<Record<string, readonly number[]>>}
 */
const mandatedRays = {
	'09:30': [7 * 9 + 4, 7 * 9 + 5, 7 * 9 + 3],
	'10:15': [6 * 9 + 3],
	'11:15': [],
	'12:30': [5 * 9 + 3],
	'13:30': [],
};

/** Fixed scopes copied into the immutable record rather than inferred from later cases.
 * @returns {DialContinuationScopes} All axes in canonical order.
 */
function scopes() {
	return {
		screen: structuredClone(SCREEN_SELECTION),
		full: {times: [...CAPTURE_TIMES], channels: [...ALL_CHANNELS], rayIndices: [...ALL_RAYS]},
		prospective: {
			times: CAPTURE_TIMES.filter((time) => !SCREEN_SELECTION.times.includes(time)),
			channels: [...ALL_CHANNELS],
			rayIndices: [...ALL_RAYS],
		},
		probeTimes: Object.keys(mandatedRays),
		probeChannels: [0, 8, 24, 30],
		scoreChannels: [...SCORE_CHANNELS],
		orderDiagnostic: {times: [...CAPTURE_TIMES], channels: [0, 8], rayIndices: [...ALL_RAYS]},
	};
}

/** Hash the actual executable with bounded memory and checked canonical path.
 * @returns {DialContinuationToolIdentity} Complete Node executable identity.
 */
function nodeIdentity() {
	const executable = checkedAbsolute(process.execPath),
		descriptor = openSync(executable, 'r');
	try {
		const before = fstatSync(descriptor),
			hash = createHash('sha256'),
			buffer = Buffer.alloc(1024 * 1024);
		let bytesRead = 0;
		for (;;) {
			const count = readSync(descriptor, buffer, 0, buffer.length, null);
			if (!count) break;
			hash.update(buffer.subarray(0, count));
			bytesRead += count;
		}
		const after = fstatSync(descriptor);
		assert.equal(bytesRead, before.size);
		assert.equal(after.size, before.size);
		assert.equal(after.mtimeMs, before.mtimeMs);
		return {path: executable, byteLength: bytesRead, sha256: hash.digest('hex'), version: process.version};
	} finally {
		closeSync(descriptor);
	}
}

/** Observe current host facts without inferring a current GPU from prior runs.
 * @returns {DialContinuationHost} Registration-time memory/runtime facts.
 */
function hostFacts() {
	return {
		measuredAt: new Date().toISOString(),
		platform: os.platform(),
		release: os.release(),
		architecture: os.arch(),
		logicalProcessors: os.cpus().length,
		availableParallelism: os.availableParallelism(),
		totalMemoryBytes: os.totalmem(),
		availableMemoryBytes: os.freemem(),
		node: nodeIdentity(),
		deviceProbePending:
			'C1 must freshly measure the GPU renderer, WebGL limits and memory/cancellation behavior before GPU admission. Historical RTX 2060/ANGLE observations are not current device evidence.',
	};
}

/** Resolve the original 99 names and forbid accidental replay after scientific continuation begins.
 * @returns {readonly string[]} Exact original run paths.
 */
function originalRunPaths() {
	assert.equal(originalNames.length, 99);
	const expected = originalNames.map((name, index) => `${String(index).padStart(5, '0')}-${name}`);
	const entries = readdirSync(resolveRepository(originalRoot)).sort();
	assert.deepEqual(
		entries.filter((name) => Number(name.slice(0, 5)) <= 98),
		expected,
	);
	for (const entry of entries.filter((name) => Number(name.slice(0, 5)) > 98)) {
		assert.match(entry, /^\d{5}-c0-registration$/u, 'C0 cannot be replayed after scientific continuation starts.');
		const prior = `${originalRoot}/${entry}`,
			sealId = verifyRun(prior);
		const seal = JSON.parse(readRepository(sealId.path, sealId).toString());
		assert.notEqual(seal.state, 'accepted', 'An accepted C0 registration already exists.');
	}
	return expected.map((name) => `${originalRoot}/${name}`);
}

/** Freeze eight rays per time using only original baseline/measurement evidence.
 * Elevation extrema use the benchmark's exact integer square-ring rank so roundoff
 * does not break the physical elevation ties; reported angles use actual geometry.
 * @param {DialInputs} inputs - Authenticated physical/scene input snapshot.
 * @param {DialAnalysisBoundary} baseline - Exact original full Q30 cumulative N4 spectra.
 * @param {DialAnalysisBoundary} measured - Exact original Direct40 measurement table.
 * @returns {readonly DialContinuationProbeRay[]} Frozen per-time selection order.
 */
export function selectComponentProbes(inputs, baseline, measured) {
	for (const boundary of [baseline, measured]) {
		assert.deepEqual(boundary.times, CAPTURE_TIMES);
		assert.deepEqual(boundary.channels, ALL_CHANNELS);
		assert.deepEqual(boundary.rayIndices, ALL_RAYS);
	}
	/** @type {DialContinuationProbeRay[]} */ const selected = [];
	for (const time of Object.keys(mandatedRays)) {
		const scene = inputs.scenes.find((item) => item.time === time);
		assert.ok(scene);
		const timeIndex = baseline.times.indexOf(time),
			radius = inputs.native48.transportSpec.planet.bottomRadiusMeters;
		const candidates = ALL_RAYS.map((rayIndex) => {
			const gridX = rayIndex % 9,
				gridY = Math.floor(rayIndex / 9);
			const ray = benchmarkRay(inputs.native48.transportSpec, scene, gridX, gridY);
			let baselinePointSquaredError = 0;
			for (const channel of SCORE_CHANNELS) {
				const index = (timeIndex * 81 + rayIndex) * 40 + channel;
				baselinePointSquaredError += (baseline.values[index] - measured.values[index]) ** 2;
			}
			const upDot = ray.origin.reduce((sum, value, axis) => sum + (value * ray.direction[axis]) / radius, 0);
			return {
				time,
				rayIndex,
				gridX,
				gridY,
				baselinePointSquaredError,
				elevationDegrees: (Math.asin(Math.max(-1, Math.min(1, upDot))) * 180) / Math.PI,
				sunSeparationDegrees: (Math.acos(Math.max(-1, Math.min(1, ray.direction[2]))) * 180) / Math.PI,
				origin: ray.origin,
				direction: ray.direction,
				lengthMeters: ray.length,
			};
		});
		/** @type {Map<number, string[]>} */ const reasons = new Map();
		/** @param {number} rayIndex - Original canonical grid index. @param {string} reason - Deterministic selection criterion. @returns {void} */
		function add(rayIndex, reason) {
			if (!reasons.has(rayIndex)) reasons.set(rayIndex, []);
			reasons.get(rayIndex).push(reason);
		}
		for (const rayIndex of mandatedRays[time]) add(rayIndex, 'plan-named difficult point');
		add(
			[...candidates].sort(
				(a, b) => a.sunSeparationDegrees - b.sunSeparationDegrees || a.rayIndex - b.rayIndex,
			)[0].rayIndex,
			'nearest fitted Sun',
		);
		const ring = (candidate) => Math.max(Math.abs(candidate.gridX - 4), Math.abs(candidate.gridY - 4));
		add(
			[...candidates].sort((a, b) => ring(a) - ring(b) || a.rayIndex - b.rayIndex)[0].rayIndex,
			'highest elevation; exact benchmark-ring tie then grid index',
		);
		add(
			[...candidates].sort((a, b) => ring(b) - ring(a) || a.rayIndex - b.rayIndex)[0].rayIndex,
			'lowest elevation; exact benchmark-ring tie then grid index',
		);
		for (const candidate of [...candidates].sort(
			(a, b) => b.baselinePointSquaredError - a.baselinePointSquaredError || a.rayIndex - b.rayIndex,
		)) {
			if (reasons.size === 8) break;
			if (!reasons.has(candidate.rayIndex))
				add(candidate.rayIndex, 'decreasing baseline point SSE; grid-index tie breaking');
		}
		assert.equal(reasons.size, 8);
		for (const [rayIndex, why] of reasons) selected.push({...candidates[rayIndex], reasons: why});
	}
	assert.equal(selected.length, 40);
	return selected;
}

/** Register actual canonical C1/C2 cases and bounded future packages without inventing outputs.
 * @returns {readonly DialContinuationCaseSlot[]} Frozen slot reservations.
 */
function caseLedger() {
	assert.deepEqual(
		continuationCases.map((item) => item.id),
		[...Array.from({length: 12}, (_, index) => `r${index}`), 'h-factored'],
	);
	/** @type {DialContinuationCaseSlot[]} */
	const entries = continuationCases.map((item) => ({
		id: item.id,
		phase: item.phase,
		parentIds:
			item.id === 'r0'
				? ['B']
				: [
						item.id === 'h-factored'
							? 'r0'
							: Number(item.id.slice(1)) >= 8
								? 'r7'
								: `r${Number(item.id.slice(1)) - 1}`,
					],
		operation: item.hypothesis,
		constructionCase: structuredClone(item),
		constructionSlots: 1,
		fullCaptureSlots: 0,
		possibleReuseOf: null,
		selectorRequirement:
			'Screen plus predeclared five-time component support; segmented8/16 only where admitted. Reference member uses16, working control8.',
		predictionRequirement:
			'Record mechanism before execution; exploratory magnitude may remain unknown. No third incoming quarter-law extension.',
		outputIdentity: null,
	}));
	entries.push({
		id: 'C2-R0-support-reserve',
		phase: 'C2',
		parentIds: ['r0'],
		operation:
			'Reuse exact C1 R0 selectors and provenance. Only a needed new support capture consumes this reserved slot.',
		constructionCase: null,
		constructionSlots: 1,
		fullCaptureSlots: 0,
		possibleReuseOf: 'r0',
		selectorRequirement: 'Exact C2 reference selectors and component support.',
		predictionRequirement: 'A replacement identity and reason are required before any recapture.',
		outputIdentity: null,
	});
	/** @type {readonly string[]} */
	const c3 = [
		'V-raw-background',
		'V-final-J1-factored-background',
		'D-P48-split-raw',
		'D-P48-factored-higher',
		'D-P55-combined-raw',
		'D-P55-split-raw',
		'D-P55-factored-higher',
		'I512-endpoint-aware',
		'I512-8x64-midpoint',
		'I2048-endpoint-aware',
	];
	for (const name of c3)
		entries.push({
			id: `C3-${name}`,
			phase: 'C3',
			parentIds: name === 'V-final-J1-factored-background' ? ['h-factored'] : ['r0'],
			operation: `Execute the plan's ${name} mechanism control in the H background; keep grouping and first-affected-order attribution explicit.`,
			constructionCase: null,
			constructionSlots: 1,
			fullCaptureSlots: 0,
			possibleReuseOf: null,
			selectorRequirement: name.startsWith('V-')
				? 'Frozen fields; dyadic1/2/4/8/16 midpoint union plus independent reference queries. Debit all trial evaluations against4P/8P/16P runtime budgets.'
				: 'Screen plus admitted component support; complete density three-representation by two-altitude controls or fixed-count incoming-placement control.',
			predictionRequirement:
				'Register exact controls and mechanism before execution. Unknown magnitudes remain exploratory.',
			outputIdentity: null,
		});
	for (const name of [
		'final-J1-by-higher-factorization',
		'incoming-transport-T320-control',
		'incoming-by-transport-joint',
		'higher-factorization-by-incoming',
	])
		entries.push({
			id: `C4-${name}`,
			phase: 'C4',
			parentIds: ['r0'],
			operation: `Complete ${name} 2x2 vertices and evaluate spectral interaction before SSE attribution.`,
			constructionCase: null,
			constructionSlots: 1,
			fullCaptureSlots: 0,
			possibleReuseOf: null,
			selectorRequirement: 'Screen; matched grouping controls and complete compatible factorial vertices.',
			predictionRequirement:
				'Seal justified additive or explicit interaction model before the unexecuted joint target; record omitted feedback.',
			outputIdentity: null,
		});
	for (const name of [
		'H',
		'selected-reference',
		'independent-check-reference',
		'candidate-A-medium',
		'candidate-A-held-fine',
		'candidate-B-medium',
		'candidate-B-held-fine',
		'joint-or-additional-reference',
	])
		entries.push({
			id: `C5-${name}`,
			phase: 'C5',
			parentIds: ['r0'],
			operation: `Reserved full ${name}; candidate/reference selection must follow numerical adequacy, not lowest screening Kider score.`,
			constructionCase: null,
			constructionSlots: 1,
			fullCaptureSlots: 1,
			possibleReuseOf: null,
			selectorRequirement:
				'17x81x40, exactly one retained final-view selection; registered scoring0..30;14 non-screen intervention outcomes assessed prospectively.',
			predictionRequirement:
				'Select and register after C3/C4; seal target predictions before previously unexecuted outputs and disclose screen target exposures. Candidate-B slots may fund reference checks.',
			outputIdentity: null,
		});
	assert.equal(new Set(entries.map((item) => item.id)).size, entries.length);
	assert.equal(
		entries.reduce((sum, item) => sum + item.constructionSlots, 0),
		continuationLimits.constructionSlots,
	);
	assert.equal(
		entries.reduce((sum, item) => sum + item.fullCaptureSlots, 0),
		continuationLimits.fullCaptureSlots,
	);
	return entries;
}

/** Derive browser-safe frozen probe identifiers without losing the registered ordering.
 * @param {readonly DialContinuationProbeRay[]} rays - Authenticated selected rays.
 * @returns {readonly SkyContinuationProbe[]} Exact capture coordinates.
 */
function captureProbes(rays) {
	return rays.map((ray) => ({
		probeId: `p-${ray.time.replace(':', '')}-${ray.gridX}-${ray.gridY}`,
		time: ray.time,
		gridX: ray.gridX,
		gridY: ray.gridY,
	}));
}

/** Allocate and seal C0 only when explicitly invoked; no GPU or scientific recurrence executes.
 * @returns {DialContinuationRegistrationResult} Verified new registration and its exact retained size.
 */
export function registerContinuation() {
	const started = performance.now(),
		originals = originalRunPaths();
	const originalSeals = originals.map((run) => identity(`${run}/sealed.json`));
	const plan = identity(planPath),
		reviewBaseline = identity(baselinePath),
		inputIdentity = identity(`${inputRun}/controls.json`);
	const summary = identity(`${originalSummary}/scorecard.json`),
		baselineSeal = originalSeals[54];
	const initialStorage = storage(),
		host = hostFacts();
	assert.ok(initialStorage.freeBytes >= continuationLimits.minimumFreeDiskBytes);
	assert.ok(
		initialStorage.retainedBytes + continuationLimits.newRetainedBytes <= continuationLimits.totalRetainedBytes,
		'Existing evidence plus continuation allocation exceeds retained budget.',
	);
	assert.ok(initialStorage.scratchBytes < continuationLimits.liveScratchBytes);
	assert.ok(
		Number.isSafeInteger(host.availableMemoryBytes) &&
			host.availableMemoryBytes >= continuationLimits.hostHeadroomBytes,
	);
	/** @type {DialContinuationResourceCaps} */
	const budgets = {
		...structuredClone(continuationLimits),
		processPrivateBytes: Math.min(
			continuationLimits.processPrivateBytes,
			Math.floor(host.availableMemoryBytes * continuationLimits.initialAvailableMemoryFraction),
		),
	};
	/** @type {DialDerivation} */
	const recipe = {
		parents: [...originalSeals, plan, reviewBaseline, inputIdentity, summary],
		operation:
			'Authenticate exactly original runs00000..00098; freeze existing-baseline point-SSE/geometry probe selection, scopes, scientific gates, case reservations and independent resource ceilings. Measure current host/disk/Node identities; keep GPU admission pending. No target recurrence or new measurement outcome is evaluated.',
		parameters: {
			originalRunCount: 99,
			probeRaysPerTime: 8,
			probeTimes: Object.keys(mandatedRays),
			pointSseChannels: SCORE_CHANNELS,
			maximumRegistrationBytes: 8 * MiB,
			node: host.node,
		},
	};
	const run = createRun('c0-registration', recipe);
	let terminal = false;
	try {
		/** @type {DialContinuationHistoricalRun[]} */ const historicalRuns = [];
		for (const [sequence, original] of originals.entries()) {
			const seal = verifyRun(original);
			assert.deepEqual(seal, originalSeals[sequence]);
			const record = JSON.parse(readRepository(seal.path, seal).toString());
			historicalRuns.push({
				sequence,
				run: original,
				seal,
				state: record.state,
				retainedBytes:
					seal.byteLength + record.artifacts.reduce((sum, artifact) => sum + artifact.byteLength, 0),
			});
			if (sequence % 10 === 0 || sequence === 98)
				run.progress(
					'authenticate-history',
					`Authenticated original run ${sequence} without changing its terminal state.`,
					sequence + 1,
					99,
				);
		}
		const inputs = loadInputs(),
			loaded = loadSpectra(originalBaseline);
		assert.ok(
			isDeepStrictEqual(loaded.control.buildRequest, deriveProfile(inputs.native48, {}).buildRequest),
			'Historical B physical/profile inputs differ from the pinned baseline.',
		);
		const baseline = extractBoundary(loaded, 'cumulative', 30, 'monotone-cubic', 4),
			measured = measurements();
		const probeRays = selectComponentProbes(inputs, baseline, measured),
			scope = scopes();
		assert.deepEqual(
			probeRays,
			selectComponentProbes(inputs, baseline, measured),
			'Probe selection must reproduce exactly.',
		);
		assert.deepEqual(
			inputs.scenes.map((scene) => scene.time),
			CAPTURE_TIMES,
		);
		const ledger = caseLedger();
		assert.equal(
			budgets.phaseAllocations.reduce((sum, allocation) => sum + allocation.retainedBytes, 0),
			budgets.newRetainedBytes,
		);
		assert.equal(scope.prospective.times.length, 14);
		/** @type {DialContinuationRegistrationRecord} */
		const record = {
			schemaId: 'sky-accuracy-continuation-registration-v1',
			run: run.path,
			registeredAt: new Date().toISOString(),
			plan,
			reviewBaseline,
			inputs: inputIdentity,
			baseline: baselineSeal,
			summary,
			historicalRuns,
			initialStorage,
			host,
			budgets,
			initialCounters: {
				gpuConstructions: 0,
				fullCaptures: 0,
				gpuElapsedMilliseconds: 0,
				cpuElapsedMilliseconds: 0,
				newRetainedBytes: 0,
			},
			scopes: scope,
			probeRays,
			probeScenes: scope.probeTimes.map((time) => inputs.scenes.find((scene) => scene.time === time)),
			selectionRecipe:
				'For each fixed time: add plan-named rays in plan order; add nearest fitted Sun, highest elevation and lowest elevation; deduplicate; fill to eight by decreasing baseline point SSE=sum_channels0..30((B-measured)^2), ties by gridY*9+gridX. Equal elevation uses exact square-ring rank max(abs(gridX-4),abs(gridY-4)); reported geometry uses benchmarkRay. These difficult-region selections are not an unbiased whole-sky sample.',
			constructionCases: structuredClone(continuationCases),
			caseLedger: ledger,
			scientificGates: structuredClone(scientificGates),
			pendingAdmission: [
				'Fresh C1 GPU renderer/limits probe, exercised profile/count proofs, baseline/causal parity, private-memory pilot and timeout/cancellation support remain required before expensive work.',
				'Canonical C1/C2 case records are proposed executions, not proof that their largest layouts fit current hardware.',
				'Every later job must debit its slot, elapsed time, retained output and scratch against this registration, including failures/timeouts; do not reset counters between runs.',
				'The initial zero byte counter precedes C0 allocation; actual continuation bytes are current retainedBytes minus initialStorage.retainedBytes and include this registration.',
				'Initial counters are not implementation/review wall time; C0 wall time is recorded separately. CPU reference/analysis and GPU-job totals have independent ceilings.',
				'C6 reporting and failure reserves remain protected; unused allocations may be reassigned only with a recorded reason before the replacement executes.',
				'Any source/parity/provenance failure stops dependent work. Inadequate reference stops its accuracy claim. No automatic expansion of the physical model, grid ceiling, storage roots or prior evidence deletion.',
			],
		};
		const encoded = Buffer.from(`${JSON.stringify(record, null, 2)}\n`);
		assert.ok(encoded.length < 2 * MiB, 'Registration payload leaves insufficient C0 seal/metadata reserve.');
		run.write('registration.json', encoded);
		run.write('continuation-plan.md', readRepository(plan.path, plan), {
			parents: [plan],
			operation: 'Copy the exact governing plan bytes frozen for this continuation.',
		});
		run.write('admission-proof.json', {
			historicalRunsAuthenticated: 99,
			probeRayCount: 40,
			probesPerTime: 8,
			probeChannels: scope.probeChannels,
			selectionReproducedExactly: true,
			canonicalBaselineInputsMatched: true,
			allocatedConstructionSlots: ledger.reduce((sum, item) => sum + item.constructionSlots, 0),
			allocatedFullCaptureSlots: 8,
			currentGpuAdmission: 'pending C1',
			noGpuExecuted: true,
		});
		for (const parent of recipe.parents) readRepository(parent.path, parent);
		const nodeAfter = nodeIdentity();
		assert.deepEqual(nodeAfter, host.node);
		assert.ok(
			storage().retainedBytes - initialStorage.retainedBytes < 4 * MiB,
			'C0 exceeds its pre-seal byte allowance.',
		);
		run.progress(
			'registered',
			'Original evidence authenticated; 40 component rays, case ledger and limits frozen. Current GPU admission remains pending.',
		);
		terminal = true;
		const seal = run.finish('accepted', {
			historicalRunCount: 99,
			probeRayCount: 40,
			allocatedConstructionSlots: 36,
			fullCaptureSlots: 8,
			registrationElapsedMilliseconds: performance.now() - started,
			deviceProbePending: true,
			gpuJobsExecuted: 0,
		});
		verifyRun(run.path);
		const terminalRecord = JSON.parse(readRepository(seal.path, seal).toString());
		assert.equal(terminalRecord.state, 'accepted');
		const retainedBytes =
			seal.byteLength + terminalRecord.artifacts.reduce((sum, artifact) => sum + artifact.byteLength, 0);
		assert.ok(retainedBytes < 8 * MiB, 'C0 retained output exceeds its frozen allocation.');
		return {run: run.path, seal, retainedBytes, historicalRunCount: 99, probeRayCount: 40};
	} catch (error) {
		if (!terminal) {
			terminal = true;
			run.finish('failed', {message: String(error), stack: error.stack, gpuJobsExecuted: 0});
		}
		throw error;
	}
}

/** Authenticate a terminal C0 record before another continuation operation consumes its limits.
 * @param {string} runPath - Exact immutable c0-registration run.
 * @returns {DialContinuationRegistrationRead} Frozen record and compact execution projections.
 */
export function readRegistration(runPath) {
	assert.match(runPath, /^tmp\/experiments\/sky-accuracy-dials\/runs\/\d{5}-c0-registration$/u);
	const seal = verifyRun(runPath),
		terminal = JSON.parse(readRepository(seal.path, seal).toString());
	assert.equal(terminal.state, 'accepted');
	const file = `${runPath}/registration.json`,
		artifact = terminal.artifacts.find((item) => item.path === file);
	assert.ok(artifact);
	const record = /** @type {DialContinuationRegistrationRecord} */ (
		JSON.parse(readRepository(file, artifact).toString())
	);
	assert.equal(record.schemaId, 'sky-accuracy-continuation-registration-v1');
	assert.equal(record.run, runPath);
	assert.equal(record.historicalRuns.length, 99);
	assert.equal(record.probeRays.length, 40);
	assert.deepEqual(record.initialCounters, {
		gpuConstructions: 0,
		fullCaptures: 0,
		gpuElapsedMilliseconds: 0,
		cpuElapsedMilliseconds: 0,
		newRetainedBytes: 0,
	});
	assert.ok(record.budgets.processPrivateBytes <= continuationLimits.processPrivateBytes);
	const {processPrivateBytes, ...staticBudgets} = record.budgets;
	const {processPrivateBytes: maximumPrivateBytes, ...expectedStaticBudgets} = continuationLimits;
	assert.deepEqual(staticBudgets, expectedStaticBudgets);
	assert.equal(
		processPrivateBytes,
		Math.min(
			maximumPrivateBytes,
			Math.floor(record.host.availableMemoryBytes * continuationLimits.initialAvailableMemoryFraction),
		),
	);
	return {
		run: runPath,
		seal,
		record,
		probes: captureProbes(record.probeRays),
		probeScenes: record.probeScenes,
		budgets: record.budgets,
		initialStorage: record.initialStorage,
		initialCounters: record.initialCounters,
	};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.equal(process.argv.length, 2, 'The registration runner accepts no implicit control overrides.');
	console.log(JSON.stringify(registerContinuation(), null, 2));
}
