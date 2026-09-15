import assert from 'node:assert/strict';
import {altitudeLinearValue, predictAltitudeConvergence, assessAltitudeConvergence} from './index.mjs';

/** Exact-rate manufactured laws, negative responses, zero resolution and invalid-input rejection.
 * @returns {{schemaId:string,checks:number}} Self-verifying arithmetic evidence without a numerical run.
 */
export function altitudeConvergenceProof() {
	let checks = 0;
	/** @param {unknown} ok */ const check = (ok) => {
		assert.ok(ok);
		checks++;
	};
	/** @param {() => unknown} operation */ const rejects = (operation) => {
		assert.throws(operation);
		checks++;
	};
	/** @param {number} v @param {number|null} [u] @returns {SkyAltitudeValue} */ const value = (v, u = 0) => ({
		value: v,
		allowance: u,
	});
	/** @param {(n:number)=>number} law @param {'p51'|'p63'} stage @returns {SkyAltitudePredictionInput} */
	const input = (law, stage) => ({
		stage,
		groups: /** @type {SkyAltitudeGroup[]} */ (
			['p-0930-5-7', 'p-1230-3-5'].flatMap((probeId) =>
				[0, 8].map((channel) => ({
					probeId,
					channel,
					f1: value(law(1)),
					f8: value(law(8)),
					...(stage === 'p63' ? {f4: value(law(4))} : {}),
				})),
			)
		),
	});
	for (const a of [-3, 0, 3])
		for (const b of [-2, 0, 2])
			for (const stage of /** @type {const} */ (['p51', 'p63'])) {
				const law = (/** @type {number} */ n) => b + a / n ** 2,
					source = input(law, stage),
					prediction = predictAltitudeConvergence(source),
					targets = source.groups.map((g) => ({
						probeId: g.probeId,
						channel: g.channel,
						...value(law(stage === 'p51' ? 4 : 16)),
					})),
					assessment = assessAltitudeConvergence(prediction, targets);
				check(Math.abs(prediction.rows[0].models[0].target.value - targets[0].value) < 1e-13);
				check(Math.abs(prediction.rows[0].models[0].fit.a.value - a) < 1e-13);
				check(Math.abs(prediction.rows[0].models[0].fit.b.value - b) < 1e-13);
				if (a !== 0) check(assessment.models[0].vector.state === 'passed');
				else
					check(
						Math.abs(prediction.rows[0].models[0].response.value) <=
							prediction.rows[0].models[0].response.roundoffAllowance,
					);
			}
	for (const a of [-2, 2])
		for (const d of [-3, 3]) {
			const law = (/** @type {number} */ n) => 1 + a / n ** 2 + d / n,
				source = input(law, 'p63'),
				prediction = predictAltitudeConvergence(source),
				model = prediction.rows[0].models[1],
				assessment = assessAltitudeConvergence(
					prediction,
					source.groups.map((g) => ({probeId: g.probeId, channel: g.channel, ...value(law(16))})),
				);
			check(Math.abs(model.target.value - law(16)) < 1e-13);
			check(
				Math.abs(model.fit.b.value - 1) < 1e-13 &&
					Math.abs(model.fit.a.value - a) < 1e-13 &&
					Math.abs(model.fit.d.value - d) < 1e-13,
			);
			check(assessment.models[1].vector.state === 'passed');
		}
	const zero = input(() => 0, 'p51'),
		z = assessAltitudeConvergence(
			predictAltitudeConvergence(zero),
			zero.groups.map((g) => ({probeId: g.probeId, channel: g.channel, ...value(0)})),
		);
	check(z.models[0].vector.state === 'unresolved');
	check(z.models[0].rows.every((r) => r.sign === 'unresolved'));
	const known = input((n) => 1 + 1 / n ** 2, 'p51'),
		pred = predictAltitudeConvergence(known),
		targets = known.groups.map((g) => ({probeId: g.probeId, channel: g.channel, ...value(1.0625, 0.001)}));
	const altered = {
		...known,
		groups: known.groups.map((g) => ({...g, f1: value(g.f1.value, 0.002), f8: value(g.f8.value, 0.003)})),
	};
	const assessed = assessAltitudeConvergence(predictAltitudeConvergence(altered), targets);
	check(assessed.models[0].rows[0].inputAllowance === 0.001 + 0.002 / 21 + (20 * 0.003) / 21);
	check(assessed.models[0].rows[0].predictedResponse > 0);
	const missing = {...known, groups: known.groups.map((g) => ({...g, f8: value(g.f8.value, null)}))};
	check(
		assessAltitudeConvergence(predictAltitudeConvergence(missing), targets).models[0].vector.state === 'unresolved',
	);
	check(altitudeLinearValue([1, -1], [value(1e15), value(1e15)]).value === 0);
	check(altitudeLinearValue([1, -1], [value(1e15), value(1e15)]).roundoffAllowance > 0);
	rejects(() => altitudeLinearValue([1], [value(Infinity)]));
	rejects(() => altitudeLinearValue([1], [value(0, -1)]));
	rejects(() => predictAltitudeConvergence({...known, groups: known.groups.slice(1)}));
	rejects(() => predictAltitudeConvergence({...known, groups: [...known.groups].reverse()}));
	rejects(() => predictAltitudeConvergence({...known, groups: known.groups.map((g) => ({...g, f4: value(1)}))}));
	rejects(() => predictAltitudeConvergence({...known, stage: 'p63'}));
	rejects(() => assessAltitudeConvergence(pred, targets.slice(1)));
	return {schemaId: 'sky-altitude-convergence-proof-v1', checks};
}
