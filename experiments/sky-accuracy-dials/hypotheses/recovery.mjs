import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {createRun, identity, resolveRepository, storage, verifyRun} from '../io/files.mjs';
import {readParent,requireUnusedStage} from './common.mjs';
import {directCpu} from '../continuation/direct-solver/math.mjs';

/** New immutable authority for the owner's explicit instruction to finish after setup repair. */
export const recoveryAdmissionRun = '00257-h10-finish';

/** Register the owner-directed continuation and evaluate the optional phase-only P1 intervention.
 * Keeps the continuous paper control and labels the reference-formulation contrast separately.
 * @returns {void}
 */
export function startRecovery() {
    requireUnusedStage('h10-finish');
	const started = Date.now(),
		before = storage();
	/** @type {DialFileIdentity[]} */ const parents = [];
	const original = /** @type {HypothesisAdmission} */ (readParent('00252-h10-audit', 'admission.json', parents));
	const audit = /** @type {HypothesisAuditRead} */ (readParent('00252-h10-audit', 'audit.json', parents));
	const input = /** @type {SmallRayInputs} */ (readParent('00230-direct-converge', 'inputs.json', parents));
	const oracle = /** @type {SmallRayDirectPacket} */ (
		readParent('00230-direct-converge', 'results.json.gz', parents)
	);
	const admission = {
		...original,
		plan: identity('agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/hypothesis-test-plan.md'),
		priorRunCount: readdirSync(resolveRepository('tmp/experiments/sky-accuracy-dials/runs')).length,
		ownerInstruction:
			'The owner explicitly instructed finish and challenged stopping on pre-computation setup failures. Repair setup and continue; preserve old runs and actual compute/storage caps.',
		originalAdmission: parents[1],
		priorGpuAttemptsStartedInThisPackage: 0,
		attemptCountingRule:
			'Setup repair is authorized. Per-stage aggregate wall time and successful scientific attempts are capped; accepted/rejected scientific stages cannot be repeated. Historical 194 remains lexical, not an authenticated historical GPU-attempt total.',
		maximumMilliseconds: 1140000,
		maximumBytes: 12 * 1024 ** 2,
		stageMilliseconds: {H10: 120000, H11: 300000, H12: 300000, H13: 300000, H14: 120000},
	};
	parents.push(admission.plan);
	const run = createRun('h10-finish', {
		parents,
		operation:
			'Owner-directed completion authority and independent phase-only P1 contrast on fixed paper near-Sun witnesses.',
		parameters: admission,
	});
	try {
		assert.ok(run.path.endsWith(recoveryAdmissionRun));
		run.write('admission.json', admission);
		run.write('prediction.json', {
			prediction:
				'The adapter phase increases Mie P1 at the selected near-Sun angles and therefore raises total P1. It may explain part of the negative continuous-minus-reference gap; P1 cannot establish the all-order consequence.',
			physicalControl:
				'Original paper atmosphere, analytic CS control, fixed extinction and source; only the diagnostic phase representation changes.',
		});
		/** @type {HypothesisPhaseP1Row[]} */ const rows = [];
		for (const ray of input.rays.filter((r) => ['p-0930-5-7', 'p-1230-3-5', 'p-1230-3-4'].includes(r.id)))
			for (const channel of [0, 8]) {
				run.progress('phase-p1', 'Independent species P1 for ' + ray.id + ' channel ' + channel + '.');
				const slot = input.channels.indexOf(channel),
					phase = audit.phaseRows.find((r) => r.ray === ray.id);
				assert.ok(slot >= 0 && phase);
				const values = [128, 256].map((count) => {
					const profile = {
						name: 'h10-phase-' + count,
						view: count,
						path: 8,
						transmission: 128,
						mu: 2,
						phi: 4,
						orders: 1,
					};
					const total = directCpu(input.medium, profile, slot).radiance(ray.origin, ray.direction, 1, true);
					const rayleigh = directCpu({...input.medium, albedo: 0}, profile, slot).radiance(
						ray.origin,
						ray.direction,
						1,
						true,
					);
					const mie = total - rayleigh;
					return {total, rayleigh, mie, adapter: rayleigh + mie * phase.ratio};
				});
				const direct = oracle.rows.find((r) => r.ray === ray.id && r.channel === channel);
				assert.ok(direct);
				const fine = values[1],
					allowance = 2 * Math.abs(fine.total - values[0].total) + 1e-10;
				assert.ok(
					Math.abs(fine.total - direct.cpu[1]) <=
						Math.max(allowance, Math.abs(direct.cpu[1] - direct.cpu[0]) + 1e-8),
				);
				rows.push({
					ray: ray.id,
					channel,
					phaseRatio: phase.ratio,
					control: values[1],
					coarse: values[0],
					p1ChangeW: fine.adapter - fine.total,
					refinementAllowanceW: allowance,
					retainedP1W: direct.cpu[1],
					retainedAllOrder: direct.total,
					limit: 'Phase-only P1 consequence. No new libRadtran run and no all-order propagation of the phase mismatch.',
				});
				assert.ok(Date.now() - started < 110000);
			}
		run.write('phase-p1.json', {rows, elapsedMilliseconds: Date.now() - started});
		assert.ok(storage().retainedBytes - before.retainedBytes < 2 * 1024 ** 2 - 200000);
		const seal = run.finish('accepted', {
			stage: 'H10',
			elapsedMilliseconds: Date.now() - started,
			rows: rows.length,
		});
		console.log(JSON.stringify({seal, verified: verifyRun(run.path)}));
	} catch (error) {
		run.write('failure.json', {message: String(error)});
		console.log(
			JSON.stringify({
				seal: run.finish('failed', {
					stage: 'H10',
					message: String(error),
					elapsedMilliseconds: Date.now() - started,
				}),
			}),
		);
		process.exitCode = 1;
	}
}
