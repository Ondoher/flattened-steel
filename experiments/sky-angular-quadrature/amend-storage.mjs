import {performance} from 'node:perf_hooks';
import {createRun, storage, verifyRun} from './io/files.mjs';

const started = performance.now(),
	before = storage();
const parents = [
	verifyRun('tmp/experiments/sky-angular-quadrature/runs/00006-q2-allocation'),
	verifyRun('tmp/experiments/sky-angular-quadrature/runs/00008-q2-base-verify'),
	verifyRun('tmp/experiments/sky-angular-quadrature/runs/00009-q2-cand-full'),
];
const run = createRun('q2-space-amend', {
	parents,
	operation:
		'Prospectively raise retained evidence ceiling from64MiB to96MiB before the independent refinement and final analysis. Preserve all original evidence, including the oversized original baseline manifest. No numerical timing, physical-input or scratch allowance changes.',
	parameters: {
		observedRetainedBytes: before.retainedBytes,
		oldRetainedBytes: 64 * 1024 ** 2,
		newRetainedBytes: 96 * 1024 ** 2,
		expectedAdditionalBytes: 8 * 1024 ** 2,
		reason: 'Completed paired captures retain60.98MiB. The immutable original baseline manifest alone retains26.08MiB; it may not be deleted or rewritten. Reserve space for the remaining refinement, lossless spatial table and final derivations.',
	},
});
try {
	run.write('amendment.json', {
		retainedBytes: 96 * 1024 ** 2,
		previousRetainedBytes: 64 * 1024 ** 2,
		initialPackageRetainedBytes: 16 * 1024 ** 2,
		aggregateNumericalMilliseconds: 1800000,
		liveScratchBytes: 1024 ** 3,
		minimumFreeDiskBytes: 40 * 1024 ** 3,
		scope: 'Subsequent refinement and final analysis only; earlier run budgets and dispositions remain immutable.',
		measuredBefore: before,
	});
	run.finish('accepted', {elapsedMilliseconds: performance.now() - started});
	verifyRun(run.path);
	console.log(JSON.stringify({run: run.path}));
} catch (error) {
	run.finish('failed', {elapsedMilliseconds: performance.now() - started, message: String(error)});
	throw error;
}
