import assert from 'node:assert/strict';
import {createRun, identity, verifyRun} from '../io/files.mjs';
import {readParent, requireUnusedStage} from '../hypotheses/common.mjs';
import {angularRule} from '../horizon-audit/angular.mjs';
import {dot, unit} from '../horizon-audit/math.mjs';
import {miePhase} from '../horizon/diagnosis-transport.mjs';
import {REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER as f68} from '../../../src/algorithm32/sampling-domains/index.js';
import {FIBONACCI_REFERENCE_SWITCH_DOT} from '../../../src/algorithm32/implementation/spherical-earth/consts.js';
import {ownedPacket} from './math.mjs';

/** Qualify phase integration on a constant incident field after the physical H33 probes.
 * @returns {void} Seals a small derivative run; unsupported inputs or failed analytic checks reject and seal failure.
 */
function main() {
	const spent = requireUnusedStage('h33-phase-r2', true),
		started = Date.now();
	/** @type {DialFileIdentity[]} */ const parents = [];
	const parent = '00272-h33-species';
	const original = /** @type {HorizonSecondOrderRegistration} */ (readParent(parent, 'registration.json', parents));
	const seal = /** @type {HorizonAuditTimingSeal} */ (readParent(parent, 'sealed.json', parents));
	const priorPhase = /** @type {HorizonAuditTimingSeal} */ (readParent('00273-h33-phase', 'sealed.json', parents));
	const remaining = 360000 - seal.result.elapsedMilliseconds - priorPhase.result.elapsedMilliseconds - spent;
	const input = ownedPacket(original.input),
		x = unit(input.sourceDirection);
	// Independent frame arithmetic with the actual owner's authenticated reference
	// axis switch. No unrecorded assumption about which branch the Sun selects.
	const reference = Math.abs(x[2]) < FIBONACCI_REFERENCE_SWITCH_DOT ? [0, 0, 1] : [0, 1, 0];
	const projection = dot(reference, x),
		z = unit(reference.map((v, i) => v - x[i] * projection));
	const y = unit([z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]]);
	const directions = f68.unitVectors.map((v) => unit([0, 1, 2].map((i) => x[i] * v[0] + y[i] * v[1] + z[i] * v[2])));
	parents.push(identity('src/algorithm32/implementation/spherical-earth/SphericalScatteringCacheGeometry.js'));
	parents.push(identity('src/algorithm32/sampling-domains/index.js'));
	parents.push(identity('src/algorithm32/implementation/spherical-earth/consts.js'));
	const run = createRun('h33-phase-r2', {
		parents,
		operation:
			'Constant unit incident radiance phase integral: independently reconstructed F68 source frame versus boundary-split 16/32/64. Analytic normalized Rayleigh and Cornette-Shanks phase integrals equal one; no renormalization applied to physical results.',
		parameters: {
			referenceAxis: reference,
			referenceSwitch: FIBONACCI_REFERENCE_SWITCH_DOT,
			maximumMilliseconds: remaining,
			maximumRetainedBytes: 1024 ** 2,
			gpuJobs: 0,
			prediction:
				'If F68 phase-mass loss explains the physical Mie deficit, its constant-field Mie integral will fall below one. Directional incident-field error remains separate.',
		},
	});
	try {
		const rows = original.receivers.map((receiver) => {
			const rules = [
				{count: 68, directions, weights: Array.from(f68.integrationWeights.values)},
				...[16, 32, 64].map((count) => ({count, ...angularRule(input, Array.from(receiver.point), count)})),
			];
			return {
				...receiver,
				rules: rules.map((rule) => {
					const moments = [0, 0];
					for (let i = 0; i < rule.directions.length; i++) {
						const cosine = dot(Array.from(receiver.outgoing), rule.directions[i]);
						moments[0] += (rule.weights[i] * 3 * (1 + cosine * cosine)) / (16 * Math.PI);
						moments[1] += rule.weights[i] * miePhase(cosine, input.g);
					}
					return {count: rule.count, moments, solidAngle: rule.weights.reduce((a, b) => a + b, 0)};
				}),
			};
		});
		assert.ok(rows.every((r) => r.rules.at(-1).moments.every((x) => Math.abs(x - 1) < 1e-8)));
		assert.ok(Date.now() - started < remaining);
		run.write('phase.json', {
			rows,
			analytic: [1, 1],
			scope: 'Manufactured constant field only. Its scalar phase errors cannot be used as a calibrated correction of a directional incoming field.',
		});
		run.cleanup();
		run.finish('accepted', {
			elapsedMilliseconds: Date.now() - started,
			parentMilliseconds: seal.result.elapsedMilliseconds,
			priorPhaseMilliseconds: priorPhase.result.elapsedMilliseconds,
			previousFailureMilliseconds: spent,
			gpuJobs: 0,
		});
		verifyRun(run.path);
		console.log(JSON.stringify({run: run.path, rows}));
	} catch (error) {
		run.finish('failed', {message: String(error), elapsedMilliseconds: Date.now() - started});
		throw error;
	}
}
main();
