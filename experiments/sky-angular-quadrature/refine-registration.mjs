import {performance} from 'node:perf_hooks';
import {createRun, verifyRun} from './io/files.mjs';
import {own, parent, pin} from './common.mjs';
import {horizonCandidates} from './math.mjs';

const started = performance.now();
/** @type {AngularFileIdentity[]} */ const parents = [];
const previous = /** @type {AngularRegistration} */ (
	own('tmp/experiments/sky-angular-quadrature/runs/00000-q0-register', 'registration.json', parents)
);
const screen = own('tmp/experiments/sky-angular-quadrature/runs/00001-q1-screen', 'assessment.json', parents);
const controls = /** @type {DialInputs} */ (parent('00000-inputs', 'controls.json', parents));
pin(parents);
const run = createRun('q1-refine-reg', {
	parents,
	operation:
		'Register a targeted positive horizon-concentrated rule family after the initial uniform product-rule failure, without fitting to measurement residuals.',
	parameters: {
		priorScreen: screen,
		maximumAdditionalCpuMilliseconds: 180000,
		initialPackageTotalMilliseconds: 900000,
		newCandidateCount: 3,
	},
});
try {
	run.write('registration.json', {
		...previous,
		candidates: horizonCandidates(),
		paper: controls.native51,
		amendment: {
			reason: 'Uniform product rules normalize phase mass but miss grazing incident structure. Concentrate cosine nodes at fixed logarithmic horizon bands; preserve positive weights.',
			cuts: [-1, -0.2, -0.02, -0.002, 0, 0.002, 0.02, 0.2, 1],
			azimuthCount: 32,
			gaussianNodesPerBand: [4, 6, 8],
			frame: 'unchanged paper receiver-local compiler contract',
			baselineCorrection:
				'Use authenticated Native51 paper baseline, the selected near-ground grid; original Native48 phase grid has identical outgoing inventory. No candidate N4 outcome has been observed.',
			prediction:
				'Horizon concentration reduces grazing-field and physical-source errors at the same or smaller inventory than uniform2048. It may leave broad-direction phase errors at the lowest band count.',
			scope: 'One targeted refinement family within the existing numerical cap; not authorization for an unbounded search.',
		},
	});
	run.finish('accepted', {
		elapsedMilliseconds: performance.now() - started,
		scientificScope: 'Prospective registration, not candidate acceptance.',
	});
	verifyRun(run.path);
	console.log(JSON.stringify({run: run.path}));
} catch (error) {
	run.finish('failed', {elapsedMilliseconds: performance.now() - started, message: String(error)});
	throw error;
}
