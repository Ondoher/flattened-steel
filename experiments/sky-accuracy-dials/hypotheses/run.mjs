import {startRecovery} from './recovery.mjs';
import {finishRecovery} from './finish.mjs';
import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {createRun, identity, readRepository, resolveRepository, storage, verifyRun} from '../io/files.mjs';
import {readParent, compareErrors, requireUnusedStage} from './common.mjs';
import {auditReference} from './audit.mjs';
import {sphericalStage} from './spherical.mjs';
import {flatStage} from './flat.mjs';
import {assessHypotheses} from './assess.mjs';

const root = 'tmp/experiments/sky-accuracy-dials/runs/';
const planPath = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/hypothesis-test-plan.md';

/** New, separately authorized H10 registration; does not edit a consumed allocation.
 * @returns {void}
 */
function audit() {
	requireUnusedStage('h10-audit');
	const started = Date.now(),
		before = storage();
	/** @type {DialFileIdentity[]} */ const parents = [];
	const inputs = /** @type {SmallRayInputs} */ (readParent('00230-direct-converge', 'inputs.json', parents));
	const joined = /** @type {HypothesisJoinedPacket} */ (readParent('00251-h9-small-rays', 'joined.json', parents));
	const names = readdirSync(resolveRepository(root.slice(0, -1)));
	const priorGpuRunCount = names.filter((name) => {
		const bytes = readRepository(root + name + '/sealed.json');
		const seal = JSON.parse(bytes.toString());
		return /gpu|webgl|browser|shader/i.test(JSON.stringify(seal.recipe));
	}).length;
	/** @type {HypothesisAdmission} */ const admission = {
		schemaId: 'sky-h10-h14-admission-v1',
		plan: identity(planPath),
		priorRunCount: names.length,
		priorGpuRunCount,
		maximumGpuAttempts: 3,
		maximumMilliseconds: 1200000,
		maximumBytes: 16 * 1024 ** 2,
		stageMilliseconds: {H10: 180000, H11: 300000, H12: 300000, H13: 300000, H14: 120000},
		registration: {
			H11: {
				profile: '00103 H',
				rays: ['p-0930-5-7', 'p-1230-0-4'],
				channels: [0, 8],
				orders: [4, 6],
				reconstruction: ['raw', 'jointly-corrected'],
			},
			H12: {
				profile: '00000 Native48',
				rays: ['p-1330-0-4', 'p-1330-5-4'],
				channels: [0, 8, 24],
				sourceCount: 20,
				transportCount: 40,
				order: 4,
				low454AbsoluteErrorReduction: 0.25,
				maximumUpperWorseningW: 0.0005,
			},
			H13: {
				profile: '00245 finite-source Native15',
				elevations: [0.05, 3, 20],
				spectralRelativeScreen: 0.001,
				largeRedBlueDeparture: 0.02,
			},
			replayScreen:
				'max(0.02 spectral mW, 0.02 percent retained radiance); original frozen guard prevails where present',
			decisions: [
				{
					question: 'Where does generated scientific output belong?',
					decision:
						'Experiment output root; repository experiment instructions override the generic skill scratch rule. Orchestration-only notes use .codex-tmp.',
					reason: 'Preserve established run/provenance ownership.',
				},
				{
					question: 'Does a final-view P1 correction complete the recurrence factorial?',
					decision: 'No. Missing consistently propagated cells remain unresolved.',
					reason: 'Later scattering consumes the affected fields.',
				},
			],
			predictions: {
				A: 'Angle-dependent phase/configuration effect rather than only a common gain.',
				B: 'N5/N6 matters more at 360 than 454 after consistent reconstruction.',
				C: 'At least 25 percent low454 approximation reduction without material upper-control damage.',
				D: 'Qualified corrected N1 approaches neutral continuous 3-degree spectrum; 20-degree control remains blue.',
			},
		},
	};
	parents.push(admission.plan);
	const run = createRun('h10-audit', {
		parents,
		operation:
			'New H10-H14 package admission, pinned-reference input/phase audit and retained B accounting. No external solver execution.',
		parameters: admission,
	});
	try {
		run.write('admission.json', admission);
		run.progress('audit', 'Authenticate pinned source and independently reconstruct aerosol phase moments.');
		const findings = auditReference(inputs, parents);
		// Prediction is retained in a distinct artifact before the numerical contrast is published.
		run.write('prediction.json', findings.prediction, {
			parents,
			operation:
				'Freeze the identified phase-representation intervention before publishing the evaluated contrast.',
		});
		const accounting = joined.joined
			.filter((row) => ['p-0930-5-7', 'p-1230-0-4'].includes(row.probeId) && [0, 8].includes(row.channel))
			.map((row) => {
				assert.ok(row.n6IncrementW !== null);
				const beforeW = row.higherErrorW,
					afterW = beforeW + row.n6IncrementW;
				return {
					probeId: row.probeId,
					channel: row.channel,
					n4HigherErrorW: beforeW,
					n6HigherErrorW: afterW,
					incrementW: row.n6IncrementW,
					halfWidth95W: row.halfWidth95W,
					samplingResolved: row.samplingResolved,
					comparison: compareErrors(beforeW, afterW, 0, row.halfWidth95W),
					newEvidence: false,
				};
			});
		assert.equal(accounting.length, 4);
		run.write(
			'audit.json',
			{...findings, accounting, before, elapsedMilliseconds: Date.now() - started},
			{
				parents,
				operation:
					'Pinned adapter moment formula followed by pinned libRadtran moment-zero normalization; compare against independently integrated full-sphere CS. Recompute retained H9 order effects without relabeling them new evidence.',
			},
		);
		assert.ok(Date.now() - started < admission.stageMilliseconds.H10 - 5000);
		assert.ok(storage().retainedBytes - before.retainedBytes < 2 * 1024 ** 2 - 200000);
		const seal = run.finish('accepted', {
			scope: 'H10 input audit and registration only; full external-reference execution/convergence remains unqualified.',
			elapsedMilliseconds: Date.now() - started,
		});
		console.log(JSON.stringify({seal, verified: verifyRun(run.path), elapsedMilliseconds: Date.now() - started}));
	} catch (error) {
		run.write('failure.json', {message: String(error)});
		console.log(
			JSON.stringify({
				seal: run.finish('failed', {message: String(error), elapsedMilliseconds: Date.now() - started}),
			}),
		);
		process.exitCode = 1;
	}
}

const action = process.argv[2];
if (action === 'finish') finishRecovery();
else if (action === 'resume') startRecovery();
else if (action === 'audit') audit();
else if (action === 'H11' || action === 'H12') await sphericalStage(action);
else if (action === 'H13') flatStage();
else if (action === 'H14') assessHypotheses();
else throw new Error('Expected audit, resume, H11, H12, H13, H14 or finish action.');
