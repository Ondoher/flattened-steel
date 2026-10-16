import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {createRun, identity, readRepository, verifyRun} from './io/files.mjs';
import {parent, pin, sheet} from './common.mjs';
import {candidates, frame, rotate, moments} from './math.mjs';
import {REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER as f68} from '../../src/algorithm32/sampling-domains/index.js';

const started = performance.now();
/** @type {AngularFileIdentity[]} */ const parents = [];
const original = /** @type {HorizonSecondOrderRegistration} */ (
	parent('00272-h33-species', 'registration.json', parents, true)
);
const controls = /** @type {DialInputs} */ (parent('00000-inputs', 'controls.json', parents));
const phase = parent('00274-h33-phase-r2', 'phase.json', parents);
const receivers = original.receivers.map(
	(r) =>
		/** @type {HorizonSecondOrderRecoveryReceiver} */ (
			parent('00276-h33-recover-r2', `receiver-${r.elevation}-${r.height}.json`, parents)
		),
);
pin(parents);
for (const file of [
	'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js',
	'src/algorithm32/implementation/spherical-earth/SphericalScatteringCacheGeometry.js',
])
	parents.push(identity(file));
const rule = rotate(
	{id: f68.id, directions: f68.unitVectors, weights: f68.integrationWeights.values},
	frame(original.input.sourceDirection),
);
const parity = receivers.map((r) => ({
	elevation: r.elevation,
	height: r.height,
	moments: moments(rule, r.outgoing, original.input.g),
}));
assert.ok(Math.abs(parity[0].moments[1] - 0.6514836740253109) < 1e-14);
const rules = candidates();
const registration = {
	input: original.input,
	receivers: original.receivers,
	candidates: rules,
	paper: controls.native48,
	scenes: controls.scenes,
	backend: 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js',
	frames: {
		h33: 'source-aligned .95 reference-axis switch',
		paper: 'unchanged receiver-local compiler coordinate contract',
	},
	controls: {
		physical: 'paper atmosphere fixed; H33 black ground separate from paper grass',
		angularPhaseRelative: 0.005,
		physicalSourceRelative: 0.01,
		referenceFractionOfAllowance: 0.25,
		absoluteSourceFloor: 1e-12,
	},
	queries: {
		elevations: [0.05, 3, 20],
		headingsDegrees: [0, 90, 180],
		sourceZenithDegrees: [14, 60, 85],
		species: ['Rayleigh', 'Mie'],
	},
	budget: {
		initialNumericalMilliseconds: 900000,
		individualGpuPilotMilliseconds: 120000,
		initialRetainedBytes: 16 * 1024 ** 2,
		laneRetainedBytes: 64 * 1024 ** 2,
		liveScratchBytes: 1024 ** 3,
		gpuJobs: 'serial',
	},
	predictions: [
		'F68 under-resolves Mie phase mass; higher fixed rules should reduce that defect.',
		'A rule may meet phase normalization while failing directional-field integration; both gates stay mandatory.',
		'J1 must remain invariant under an incoming-rule-only intervention.',
		'Full-cache paper RMSE may worsen if angular bias compensates another error.',
	],
	scope: 'No libRadtran horizon ground truth asserted. No sparse score substitutes for full 17x81x31 RMSE.',
	derivatives: [
		'io/files.mjs and root IO types adapted from parent io owners',
		'gpu/host.mjs and gpu/browser.js adapted from parent, output boundaries changed to this lane',
	],
};
const run = createRun('q0-register', {
	parents,
	operation:
		'Authenticate parent run seals and artifacts; reconstruct F68 phase witnesses; freeze candidate inventories, physical frames, acceptance gates and budgets before evaluation.',
	parameters: {sourceReviewBaseline: '.codex-tmp/review-standards/session-ad9QEx/baseline.json'},
});
try {
	run.write('registration.json', registration);
	run.write('phase-parity.json', {retained: phase, reproduced: parity});
	const rows = receivers.map((r) => ({
		label: `${r.elevation} deg / ${r.height} m`,
		names: ['F68 baseline', 'boundary16', 'boundary32 reference'],
		spectra: ['F68', 'boundary16', 'boundary32'].map(
			(label) => r.controls.find((c) => c.kind === 'actual' && c.rule === label).value.spectrum,
		),
	}));
	run.write('spectra.json', rows);
	run.write('baseline.svg', sheet(rows, 'Q0: authenticated H33 baseline and refined source'));
	run.progress('visual', `${run.path}/baseline.svg; candidate columns remain uncomputed.`);
	run.finish('accepted', {
		elapsedMilliseconds: performance.now() - started,
		phaseParity: true,
		candidateCount: rules.length,
		scientificScope: 'Q0 registration and retained baseline only; extended witnesses remain Q1 work.',
	});
	verifyRun(run.path);
	console.log(JSON.stringify({run: run.path, visual: `${run.path}/baseline.svg`}));
} catch (error) {
	run.finish('failed', {elapsedMilliseconds: performance.now() - started, message: String(error)});
	throw error;
}
