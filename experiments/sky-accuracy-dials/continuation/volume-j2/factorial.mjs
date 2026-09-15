import assert from 'node:assert/strict';
import {readRepository} from '../../io/files.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {volumeJ2Targets} from './angular.mjs';

/** Freeze the bounded positive-height angular matrix before its output exists.
 * @param {DialContinuationRegistrationRead} registration - Original probe geometry.
 * @param {SkyTransportSpec} spec - Matched physical radii.
 * @param {SkyVolumeJ2Stage} stage - Explicit pilot or factorial operation.
 * @returns {SkyVolumeJ2Case[]} Exact targets and angular controls.
 */
export function volumeJ2Cases(registration, spec, stage) {
	assert.ok(['pilot', 'angular'].includes(stage));
	const targets = volumeJ2Targets(registration, spec);
	if (stage === 'pilot') return targets.map((target) => ({id: 'r8-a16', target, radialCount: 8, azimuthCount: 16}));
	return [
		{id: 'r16-a16', radialCount: 16, azimuthCount: 16},
		{id: 'r8-a32', radialCount: 8, azimuthCount: 32},
		{id: 'r16-a32', radialCount: 16, azimuthCount: 32},
	].flatMap((control) =>
		targets
			.filter((target) => target.heightMeters !== 1)
			.map((target) => ({...control, target: {...target, id: `${target.id}:${control.id}`}})),
	);
}

/** Authenticate the fixed earlier component and exact-ground evidence; never choose a favorable baseline.
 * @param {DialContinuationRegistrationRead} registration - Original C0 owner.
 * @returns {SkyVolumeJ2Parents} Exact consumed identities and validated comparison records.
 */
export function readVolumeJ2Parents(registration) {
	const definitions = [
		['00161-volume-j2-pilot', '59b8585633fbd21f2a6bd6fc04ac287000d8c8843f425587267a508cd76e2cdb'],
		['00160-j2-ang-fine', 'a8021a0e26482be80cc4cabfa5cadb94b29833b6bb073658222d6cf23c48aff9'],
	];
	/** @type {DialFileIdentity[]} */ const identities = [];
	const records = definitions.map(([name, hash]) => {
		const input = acceptedMechanismInput(`tmp/experiments/sky-accuracy-dials/runs/${name}`);
		assert.equal(input.seal.sha256, hash);
		const artifact = mechanismArtifact(input, 'reference.json');
		identities.push(input.seal, artifact);
		const record = JSON.parse(readRepository(artifact.path, artifact).toString());
		assert.equal(record.continuationRegistration, registration.run);
		assert.equal(record.matrixComplete, true);
		return record;
	});
	/** @type {SkyVolumeJ2Document} */ const baseline = records[0];
	/** @type {SkyAngularDocument} */ const angular = records[1];
	assert.equal(baseline.schemaId, 'sky-volume-j2-pilot-v1');
	assert.equal(baseline.predictionsPassed, true);
	assert.deepEqual(baseline.channels, [0, 8]);
	assert.equal(baseline.targets.length, 8);
	assert.equal(baseline.rows.length, 8);
	assert.equal(angular.schemaId, 'sky-j2-angular-attribution-v1');
	for (const target of baseline.targets) {
		const original =
			registration.record.probeRays[registration.probes.findIndex((probe) => probe.probeId === target.probeId)];
		assert.deepEqual(target.surfaceOrigin, original.origin);
		assert.deepEqual(target.direction, original.direction);
	}
	return {identities, baseline, angular};
}

/** Assess the frozen additive-response law and approximate positive-height limit prediction.
 * @param {SkyVolumeJ2Parents} parents - Authenticated original values, never fitted to the new cells.
 * @param {readonly SkyVolumeJ2Case[]} cases - Three prospective angular controls at six points.
 * @param {readonly SkyVolumeJ2Row[][]} rows - New complete or explicitly unresolved estimates.
 * @returns {SkyVolumeJ2FactorialResult} Explicit interaction vectors and limit outcomes.
 */
export function assessVolumeJ2Factorial(parents, cases, rows) {
	const {baseline, angular} = parents;
	/** @type {SkyVolumeJ2Factorial[]} */ const factorials = [];
	/** @type {SkyVolumeJ2Check[]} */ const checks = [];
	for (const component of ['atmosphereRayleigh', 'atmosphereMie', 'groundRayleigh', 'groundMie']) {
		/** @type {SkyVolumeJ2Interaction[]} */ const vectors = [];
		let complete = true;
		for (const [index, target] of baseline.targets.entries()) {
			if (target.heightMeters === 1) continue;
			for (const channel of baseline.channels) {
				const initial = baseline.rows[index].find((row) => row.channel === channel)?.[component];
				const controls = ['r16-a16', 'r8-a32', 'r16-a32'].map((id) => {
					const caseIndex = cases.findIndex(
						(item) =>
							item.id === id &&
							item.target.probeId === target.probeId &&
							item.target.heightMeters === target.heightMeters,
					);
					return rows[caseIndex]?.find((row) => row.channel === channel)?.[component];
				});
				if (![initial, ...controls].every((value) => value?.resolved)) {
					complete = false;
					continue;
				}
				const [a, b, ab] = controls;
				vectors.push({
					targetId: target.id,
					channel,
					radial: a.mean - initial.mean,
					azimuth: b.mean - initial.mean,
					joint: ab.mean - initial.mean,
					interaction: ab.mean - a.mean - b.mean + initial.mean,
					incidentAllowance: [initial, a, b, ab].reduce((sum, value) => sum + value.incidentAllowance, 0),
				});
			}
		}
		const responseScale = complete
			? Math.hypot(...vectors.map((value) => value.radial)) + Math.hypot(...vectors.map((value) => value.azimuth))
			: null;
		const interactionNorm = complete ? Math.hypot(...vectors.map((value) => value.interaction)) : null;
		const allowanceNorm = complete ? Math.hypot(...vectors.map((value) => value.incidentAllowance)) : null;
		const threshold = complete ? 0.25 * Math.max(responseScale, 1e-15) + allowanceNorm : null;
		const state =
			!complete || allowanceNorm > 0.2 * responseScale
				? 'unresolved'
				: interactionNorm <= threshold
					? 'passed'
					: 'failed';
		factorials.push({
			component,
			vectors: complete ? vectors : [],
			responseScale,
			interactionNorm,
			allowanceNorm,
			threshold,
			state,
		});
		checks.push({
			id: `additive:${component}`,
			channel: null,
			state,
			difference: interactionNorm,
			allowance: threshold,
		});
	}
	for (const [index, item] of cases.entries()) {
		if (item.id !== 'r16-a32' || item.target.heightMeters !== 0.001) continue;
		for (const channel of baseline.channels) {
			const ground = angular.outcomes.find(
				(row) => row.targetId === item.target.probeId && row.channel === channel,
			);
			assert.ok(ground?.angularAdequate && ground.empiricalAllowance !== null);
			const row = rows[index].find((value) => value.channel === channel);
			const resolved = row?.atmosphereRayleigh.resolved && row?.atmosphereMie.resolved;
			const difference = resolved
				? Math.abs(row.atmosphereRayleigh.mean + row.atmosphereMie.mean - ground.fine)
				: null;
			const allowance = resolved
				? 0.0005 * Math.abs(ground.fine) +
					ground.empiricalAllowance +
					row.atmosphereRayleigh.incidentAllowance +
					row.atmosphereMie.incidentAllowance +
					1e-15
				: null;
			checks.push({
				id: `near-surface-atmosphere:${item.target.probeId}`,
				channel,
				state: !resolved ? 'unresolved' : difference <= allowance ? 'passed' : 'failed',
				difference,
				allowance,
			});
		}
	}
	return {factorials, checks};
}

/** Verify the response-law assessment with exact additive, interacting and unresolved data.
 * Real geometry supplies addresses only; every manufactured change has a known equation.
 * @param {SkyVolumeJ2Parents} parents - Authenticated baseline addresses and initial values.
 * @param {readonly SkyVolumeJ2Case[]} cases - Frozen factorial matrix.
 * @returns {SkyVolumeJ2FactorialProof} Executed mathematical and missing-evidence assertions.
 */
export function volumeJ2FactorialProof(parents, cases) {
	const manufactured = structuredClone(parents);
	for (const rows of manufactured.baseline.rows)
		for (const row of rows)
			for (const name of ['atmosphereRayleigh', 'atmosphereMie', 'groundRayleigh', 'groundMie']) {
				row[name] = {...row[name], incidentAllowance: 0};
			}
	const rows = cases.map((item) => {
		const index = manufactured.baseline.targets.findIndex(
			(target) => target.probeId === item.target.probeId && target.heightMeters === item.target.heightMeters,
		);
		return manufactured.baseline.rows[index].map((row) => {
			const result = {...row};
			for (const name of ['atmosphereRayleigh', 'atmosphereMie', 'groundRayleigh', 'groundMie']) {
				const step = (index + 1) * 1e-8,
					delta = item.id === 'r16-a16' ? step : item.id === 'r8-a32' ? 2 * step : 3 * step;
				result[name] = {...row[name], mean: row[name].mean + delta};
			}
			return result;
		});
	});
	let checks = 0;
	for (const result of assessVolumeJ2Factorial(manufactured, cases, rows).factorials) {
		assert.equal(result.state, 'passed');
		assert.equal(result.vectors.length, 12);
		checks += 2;
	}
	for (const [index, item] of cases.entries())
		if (item.id === 'r16-a32')
			for (const row of rows[index])
				for (const name of ['atmosphereRayleigh', 'atmosphereMie', 'groundRayleigh', 'groundMie'])
					row[name] = {...row[name], mean: row[name].mean + 1e-4};
	for (const result of assessVolumeJ2Factorial(manufactured, cases, rows).factorials) {
		assert.equal(result.state, 'failed');
		checks++;
	}
	for (const name of ['atmosphereRayleigh', 'atmosphereMie', 'groundRayleigh', 'groundMie'])
		rows[0][0][name] = {...rows[0][0][name], resolved: false, mean: null, incidentAllowance: null};
	for (const result of assessVolumeJ2Factorial(manufactured, cases, rows).factorials) {
		assert.equal(result.state, 'unresolved');
		assert.equal(result.vectors.length, 0);
		checks += 2;
	}
	return {schemaId: 'sky-volume-j2-factorial-proof-v1', checks};
}
