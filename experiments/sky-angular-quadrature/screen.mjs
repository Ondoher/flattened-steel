import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {createRun, readRepository, verifyRun} from './io/files.mjs';
import {own, parent, pin, sheet} from './common.mjs';
import {frame, receiverFrame, rotate, moments} from './math.mjs';
import {angularRule} from '../sky-accuracy-dials/horizon-audit/angular.mjs';
import {dot, unit, altitude, bounds} from '../sky-accuracy-dials/horizon-audit/math.mjs';
import {miePhase} from '../sky-accuracy-dials/horizon/diagnosis-transport.mjs';
import {incidentSpecies} from '../sky-accuracy-dials/horizon-migration/second-order-math.mjs';
import {ownedPacket} from '../sky-accuracy-dials/horizon-migration/math.mjs';
import {REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER as f68} from '../../src/algorithm32/sampling-domains/index.js';

/** Compute N1 once per incoming node, independent of the subsequent outgoing query.
 * @param {HorizonMigrationMedium} input @param {readonly number[]} point @param {AngularRule} rule @param {HorizonSecondOrderGuard} guard @returns {AngularIncidentField}
 */
function field(input, point, rule, guard) {
	return {
		rule,
		incident: rule.directions.map((direction, i) => {
			if (i % 8 === 0) guard();
			return incidentSpecies(
				{
					input,
					point,
					outgoing: [0, 0, 1],
					kind: 'actual',
					pathCount: 8,
					directions: rule.directions,
					weights: rule.weights,
				},
				direction,
			);
		}),
	};
}

/** Integrate the same cached incoming field with separate first/last species.
 * @param {HorizonMigrationMedium} input @param {readonly number[]} point @param {readonly number[]} outgoing @param {AngularIncidentField} f @returns {HorizonSecondOrderSource}
 */
function scatter(input, point, outgoing, f) {
	const n = input.rayleigh.length,
		z = altitude(ownedPacket(input), Array.from(point));
	const empty = () => [0, 1].map(() => [0, 1].map(() => Array(n).fill(0)));
	const history = empty(),
		regions = {ground: empty(), grazing: empty(), sky: empty()},
		up = unit(point);
	for (let i = 0; i < f.rule.directions.length; i++) {
		const v = f.rule.directions[i],
			mu = dot(v, outgoing),
			phase = [(3 * (1 + mu * mu)) / (16 * Math.PI), miePhase(mu, input.g)];
		const region =
			Math.abs(dot(v, up)) < 0.1
				? 'grazing'
				: bounds(ownedPacket(input), Array.from(point), Array.from(v)).endsOnGround
					? 'ground'
					: 'sky';
		for (let a = 0; a < 2; a++)
			for (let b = 0; b < 2; b++)
				for (let c = 0; c < n; c++) {
					const coefficient =
						b === 0
							? input.rayleigh[c] * Math.exp(-z / input.rayleighHeight)
							: input.mie[c] * input.albedo * Math.exp(-z / input.mieHeight);
					const value = f.incident[i][a][c] * f.rule.weights[i] * phase[b] * coefficient;
					history[a][b][c] += value;
					regions[region][a][b][c] += value;
				}
	}
	const species = [0, 1].map((b) => history[0][b].map((x, c) => x + history[1][b][c]));
	const closureAbsolute = Math.max(
		...history.flatMap((row, a) =>
			row.flatMap((s, b) =>
				s.map((x, c) => Math.abs(x - Object.values(regions).reduce((sum, r) => sum + r[a][b][c], 0))),
			),
		),
	);
	return {
		history,
		regions,
		species,
		spectrum: species[0].map((x, c) => x + species[1][c]),
		solidAngle: f.rule.weights.reduce((s, w) => s + w, 0),
		closureAbsolute,
	};
}

/** Positive manufactured input field with known geometric structure.
 * @param {string} kind @param {readonly number[]} v @param {readonly number[]} sun @returns {number}
 */
function manufactured(kind, v, sun) {
	if (kind === 'smooth') return 1 + 0.2 * v[0] + 0.3 * v[2];
	if (kind === 'directional') return 0.1 + Math.exp(4 * (dot(v, sun) - 1));
	if (kind === 'grazing') return 0.05 + Math.exp(-((v[2] / 0.05) ** 2));
	return v[2] >= 0 ? 1 : 0.05;
}

/** Convolve one manufactured field without adjusting phase normalization.
 * @param {AngularRule} rule @param {readonly number[]} out @param {readonly number[]} sun @param {string} kind @param {number} g @returns {number[]}
 */
function convolve(rule, out, sun, kind, g) {
	const sum = [0, 0];
	for (let i = 0; i < rule.directions.length; i++) {
		const v = rule.directions[i],
			mu = dot(v, out),
			w = rule.weights[i] * manufactured(kind, v, sun);
		sum[0] += (w * 3 * (1 + mu * mu)) / (16 * Math.PI);
		sum[1] += w * miePhase(mu, g);
	}
	return sum;
}

/** Execute the prospective angular screen, preserving failed scientific predictions.
 * @returns {void} New immutable qualification run; execution faults seal failed.
 */
function main() {
	const started = performance.now();
	/** @type {AngularFileIdentity[]} */ const parents = [];
	const registrationRoot = process.argv[2] ?? 'tmp/experiments/sky-angular-quadrature/runs/00000-q0-register';
	const registration = /** @type {AngularRegistration} */ (own(registrationRoot, 'registration.json', parents));
	const input = registration.input,
		point = [0, 0, input.radius + 5];
	const retained = registration.receivers.map(
		(r) =>
			/** @type {HorizonSecondOrderRecoveryReceiver} */ (
				parent('00276-h33-recover-r2', `receiver-${r.elevation}-${r.height}.json`, parents)
			),
	);
	pin(parents);
	const run = createRun('q1-screen', {
		parents,
		operation:
			'Screen fixed positive angular rules against normalized phase mass, independent manufactured-field refinements and continuous N1-driven P2 species histories. Reuse incoming fields across outgoing queries.',
		parameters: {
			maximumMilliseconds: 720000,
			absoluteSourceFloor: 1e-12,
			phaseTolerance: 0.005,
			sourceTolerance: 0.01,
			referenceTolerance: 0.0025,
			fullStoredOutgoingPhaseInventory: true,
		},
	});
	let last = 0;
	const guard = () => {
		assert.ok(performance.now() - started < 720000, 'Q1 numerical allocation exhausted.');
		if (performance.now() - last > 15000) {
			last = performance.now();
			run.guard();
			run.progress('compute', 'Angular and physical-field qualification active.');
		}
	};
	try {
		/** @type {AngularRule} */ const baseline = {
			id: 'F68',
			directions: f68.unitVectors,
			weights: f68.integrationWeights.values,
		};
		const rules = [baseline, ...registration.candidates];
		const phaseRows = rules.map((rule) => {
			let maxRayleigh = 0,
				maxMie = 0;
			for (const [i, out] of registration.paper.transportSpec.domains.outgoing.unitVectors.entries()) {
				if (i % 128 === 0) guard();
				const mass = moments(rule, out, input.g);
				maxRayleigh = Math.max(maxRayleigh, Math.abs(mass[0] - 1));
				maxMie = Math.max(maxMie, Math.abs(mass[1] - 1));
			}
			assert.ok(
				rule.weights.every((w) => w > 0) &&
					Math.abs(rule.weights.reduce((a, b) => a + b, 0) - 4 * Math.PI) < 1e-10,
			);
			return {
				id: rule.id,
				count: rule.directions.length,
				maxRayleigh,
				maxMie,
				passes: Math.max(maxRayleigh, maxMie) <= 0.005,
			};
		});
		run.write('phase.json', phaseRows);
		run.progress('phase', JSON.stringify(phaseRows));
		/** @type {AngularManufacturedResult[]} */ const manufacturedRows = [];
		const referenceRules = [32, 64].map((count) => ({
			id: `boundary${count}`,
			...angularRule(ownedPacket(input), point, count),
		}));
		for (const sunZenith of [14, 60, 85]) {
			const sun = [0, -Math.sin((sunZenith * Math.PI) / 180), Math.cos((sunZenith * Math.PI) / 180)];
			for (const elevation of [0.05, 3, 20])
				for (const heading of [0, 90, 180]) {
					const e = (elevation * Math.PI) / 180,
						h = (heading * Math.PI) / 180,
						out = [Math.sin(h) * Math.cos(e), -Math.cos(h) * Math.cos(e), Math.sin(e)];
					for (const kind of ['smooth', 'directional', 'grazing', 'visible']) {
						guard();
						const reference = referenceRules.map((rule) => convolve(rule, out, sun, kind, input.g));
						for (const local of rules)
							for (const mode of local.frame ? [local.frame] : ['source', 'receiver']) {
								const rule = rotate(local, mode === 'source' ? frame(sun) : receiverFrame(point, sun)),
									values = convolve(rule, out, sun, kind, input.g);
								manufacturedRows.push({
									id: local.id + '/' + mode,
									elevation,
									heading,
									sunZenith,
									field: kind,
									values,
									reference: reference[1],
									refinement: reference[0].map((v, i) => v / reference[1][i] - 1),
									relative: values.map((v, i) => v / reference[1][i] - 1),
								});
							}
					}
				}
		}
		run.write('manufactured.json', manufacturedRows);
		const physicalRows = [],
			cache = new Map();
		/** @param {AngularRule} rule @param {readonly number[]} p @returns {AngularIncidentField} */
		function incoming(rule, p) {
			const key = rule.id + JSON.stringify(p);
			if (!cache.has(key))
				cache.set(
					key,
					field(
						input,
						p,
						rotate(
							rule,
							rule.frame === 'receiver'
								? receiverFrame(p, input.sourceDirection)
								: frame(input.sourceDirection),
						),
						guard,
					),
				);
			return cache.get(key);
		}
		for (const receiver of retained) {
			const reference = receiver.controls.find((c) => c.kind === 'actual' && c.rule === 'boundary32').value;
			const coarse = receiver.controls.find((c) => c.kind === 'actual' && c.rule === 'boundary16').value;
			for (const rule of rules) {
				const value = scatter(input, receiver.point, receiver.outgoing, incoming(rule, receiver.point));
				const relative = value.spectrum.map((v, c) => v / Math.max(1e-12, reference.spectrum[c]) - 1);
				if (rule.id === 'F68')
					assert.ok(
						value.spectrum.every(
							(v, c) => Math.abs(v / receiver.controls[0].value.spectrum[c] - 1) < 1e-12,
						),
					);
				physicalRows.push({
					id: rule.id,
					elevation: receiver.elevation,
					height: receiver.height,
					heading: 180,
					value,
					reference,
					relative,
					refinement: coarse.spectrum.map((v, c) => v / reference.spectrum[c] - 1),
				});
			}
			run.progress('physical', `Receiver ${receiver.elevation} deg / ${receiver.height} m complete.`);
		}
		// Reuse one N1 field per reference and rule for the added heading/elevation controls.
		const refs = [16, 32].map((count) => {
			const q = angularRule(ownedPacket(input), point, count);
			return field(input, point, {id: `boundary${count}`, ...q}, guard);
		});
		for (const elevation of [0.05, 3, 20])
			for (const heading of [0, 90, 180]) {
				const e = (elevation * Math.PI) / 180,
					h = (heading * Math.PI) / 180,
					out = [Math.sin(h) * Math.cos(e), -Math.cos(h) * Math.cos(e), Math.sin(e)];
				const reference = refs.map((f) => scatter(input, point, out, f));
				for (const rule of rules) {
					guard();
					const value = scatter(input, point, out, incoming(rule, point));
					physicalRows.push({
						id: rule.id,
						elevation,
						height: 5,
						heading,
						value,
						reference: reference[1],
						relative: value.spectrum.map((v, c) => v / reference[1].spectrum[c] - 1),
						refinement: reference[0].spectrum.map((v, c) => v / reference[1].spectrum[c] - 1),
					});
				}
			}
		run.write('physical.json', physicalRows);
		const summary = phaseRows.map((p) => {
			const m = manufacturedRows.filter((r) => r.id.startsWith(p.id + '/')),
				r = physicalRows.filter((r) => r.id === p.id);
			const maximumManufactured = Math.max(...m.flatMap((r) => r.relative.map(Math.abs))),
				maximumPhysical = Math.max(...r.flatMap((r) => r.relative.map(Math.abs))),
				maximumReference = Math.max(
					...m.flatMap((r) => r.refinement.map(Math.abs)),
					...r.flatMap((r) => r.refinement.map(Math.abs)),
				);
			return {
				...p,
				maximumManufactured,
				maximumPhysical,
				maximumReference,
				qualified:
					p.passes && maximumManufactured <= 0.01 && maximumPhysical <= 0.01 && maximumReference <= 0.0025,
			};
		});
		const selected = summary.filter((s) => s.qualified).sort((a, b) => a.count - b.count)[0]?.id ?? null;
		run.write('assessment.json', {
			summary,
			selected,
			scope: 'Qualification only; no N4 or full-paper score. No rule passes by scalar phase renormalization.',
		});
		const visualRules = ['F68', selected ?? registration.candidates.at(-1).id];
		const rows = physicalRows
			.filter((r) => r.heading === 180 && r.height === 5 && r.id === 'F68')
			.slice(0, 3)
			.map((r) => ({
				label: `${r.elevation} deg / 5 m`,
				names: [visualRules[0], visualRules[1], 'boundary32 reference'],
				spectra: [
					r.value.spectrum,
					physicalRows.find(
						(c) =>
							c.id === visualRules[1] &&
							c.elevation === r.elevation &&
							c.height === r.height &&
							c.heading === r.heading,
					).value.spectrum,
					r.reference.spectrum,
				],
			}));
		run.write('spectra.json', rows);
		run.write(
			'comparison.svg',
			sheet(rows, `Q1: angular screen; ${selected ? 'qualified ' + selected : 'no fully qualified rule'}`),
		);
		run.progress('visual', `${run.path}/comparison.svg`);
		run.finish('accepted', {
			elapsedMilliseconds: performance.now() - started,
			selected,
			scientificDisposition: selected ? 'candidate-qualified' : 'registered-fixed-rule-screen-rejected-all',
			gpuJobs: 0,
		});
		verifyRun(run.path);
		console.log(JSON.stringify({run: run.path, summary, selected}));
	} catch (error) {
		run.finish('failed', {
			elapsedMilliseconds: performance.now() - started,
			message: String(error),
			stack: error.stack,
		});
		throw error;
	}
}
main();
