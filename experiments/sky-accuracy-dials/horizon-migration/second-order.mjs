import assert from 'node:assert/strict';
import {createRun, identity, storage, verifyRun} from '../io/files.mjs';
import {pinProductionClosure, readParent, requireUnusedStage} from '../hypotheses/common.mjs';
import {angularRule} from '../horizon-audit/angular.mjs';
import {along, roots, unit} from '../horizon-audit/math.mjs';
import {colorimetry, ciePath} from '../horizon/diagnosis-color.mjs';
import {SphericalEarthGeometry} from '../../../src/algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js';
import {DistantSunLightSource} from '../../../src/algorithm32/implementation/distant-sun/DistantSunLightSource.js';
import {REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER as f68} from '../../../src/algorithm32/sampling-domains/index.js';
import {ownedPacket} from './math.mjs';
import {incidentSpecies, secondOrder} from './second-order-math.mjs';

/** Evaluate the registered sparse species/position continuation once.
 * @returns {void} Prints a new immutable run identity; any failed assertion is sealed and rethrown for inspection.
 */
function main() {
	const spent = requireUnusedStage('h33-species', true),
		started = Date.now(),
		deadline = started + 360000 - spent,
		before = storage();
	/** @type {DialFileIdentity[]} */ const parents = [];
	const registration = /** @type {HorizonMigrationInput} */ (
		readParent('00264-h16-h20-audit', 'registration.json', parents)
	);
	const previous = /** @type {HorizonMigrationReadonly<readonly HorizonAuditIncomingRow[]>} */ (
		readParent('00264-h16-h20-audit', 'incoming.json', parents)
	);
	const qualification = /** @type {HorizonSecondOrderQualification} */ (
		readParent('00265-h16-h20-qual', 'qualification.json', parents)
	);
	const observations = /** @type {HorizonMigrationBatches} */ (
		readParent('00267-h21-h26-ref', 'inputs.json.gz', parents)
	);
	const input = registration.inputs[1];
	const topic = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/';
	for (const file of ['horizon-second-order-plan.md', 'horizon-archive-evidence.md'])
		parents.push(identity(topic + file));
	parents.push(identity(ciePath));
	pinProductionClosure(
		[
			'src/algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js',
			'src/algorithm32/implementation/distant-sun/DistantSunLightSource.js',
			'src/algorithm32/sampling-domains/index.js',
		],
		parents,
	);
	const geometry = new SphericalEarthGeometry({
		bottomRadius: {value: input.radius, units: 'meters'},
		topRadius: {value: input.radius + input.topAltitude, units: 'meters'},
		observerHeight: {value: 5, units: 'meters'},
	});
	geometry.configureLightSource({
		lightSource: new DistantSunLightSource({angularRadius: {value: 0.26667, units: 'degrees'}}),
		observation: observations.observations[1].facts.state.observation,
		placement: {
			kind: 'distant-direction',
			directionToLight: /** @type {SkyVector3} */ ([
				input.sourceDirection[0],
				input.sourceDirection[1],
				input.sourceDirection[2],
			]),
		},
	});
	const directions = f68.unitVectors.map((v) => geometry.expressPhysicalIncomingRadianceDirection(v));
	const receivers = [0.05, 3].flatMap((elevation) => {
		const radians = (elevation * Math.PI) / 180,
			horizontal = unit([input.sourceDirection[0], input.sourceDirection[1], 0]);
		const outgoing = [-horizontal[0] * Math.cos(radians), -horizontal[1] * Math.cos(radians), Math.sin(radians)],
			origin = [0, 0, input.radius + 5];
		return [5, 250].map((height) => {
			const distance =
				height === 5
					? 0
					: roots(origin, outgoing, input.radius + height)
							.filter((x) => x >= 0)
							.at(-1);
			return {elevation, height, distance, point: along(origin, outgoing, distance), outgoing};
		});
	});
	const run = createRun('h33-species', {
		parents,
		operation:
			'Separate first/second Rayleigh and Mie histories in continuous N1-driven P2. Compare F68 and boundary rules, and actual/observer-column primary source positions on fixed physical paths.',
		parameters: {
			maximumMilliseconds: 360000,
			maximumRetainedBytes: 8 * 1024 ** 2,
			spent,
			gpuJobs: 0,
			receivers,
			angularCounts: [16, 32],
			pathCount: 8,
			scope: 'Sparse P2 source only; not old/new discrete N4 or a libRadtran score.',
		},
	});
	let last = 0;
	/** Enforce numerical allocation and flush progress during synchronous path integration. @returns {void} */
	function guard() {
		assert.ok(Date.now() < deadline - 5000, 'H33 aggregate allocation exhausted.');
		if (Date.now() - last > 15000) {
			last = Date.now();
			run.guard();
			run.progress('compute', 'H33 sparse species source integration remains active.');
		}
	}
	try {
		console.log(JSON.stringify({run: run.path}));
		run.write('registration.json', {
			input,
			receivers,
			historyOrder: ['Rayleigh', 'Mie'],
			controls: ['F68', 'boundary16', 'boundary32'],
			primaryPositions: ['actual', 'column'],
			predictions:
				'F68 Rayleigh excess and Mie deficit partly cancel; column illumination may change their balance. See pinned plan for limits and allowance.',
			archive:
				'Selected entries authenticated against external manifest in pinned archive notes; historical full transport identity is not established.',
		});
		const rows = [];
		for (const receiver of receivers) {
			guard();
			const controls = [];
			for (const count of [0, 16, 32]) {
				const rule = count
					? angularRule(ownedPacket(input), receiver.point, count)
					: {directions, weights: Array.from(f68.integrationWeights.values)};
				for (const kind of /** @type {const} */ (['actual', 'column'])) {
					const control = {input, ...receiver, ...rule, kind, pathCount: 8};
					const value = secondOrder(control, guard);
					assert.ok(Math.abs(value.solidAngle - 4 * Math.PI) < 1e-10);
					controls.push({rule: count ? 'boundary' + count : 'F68', kind, value});
					run.progress(
						'receiver',
						`${receiver.elevation} degrees, ${receiver.height} m, ${count || 'F68'}, ${kind}.`,
					);
				}
			}
			const actual = controls.filter((c) => c.kind === 'actual'),
				column = controls.filter((c) => c.kind === 'column'),
				base = actual[0].value,
				reference = actual[2].value;
			const summary = {
				speciesRelative: base.species.map((v, k) => v.map((x, c) => x / reference.species[k][c] - 1)),
				historyRelative: base.history.map((r, a) =>
					r.map((v, b) => v.map((x, c) => x / reference.history[a][b][c] - 1)),
				),
				totalRelative: base.spectrum.map((x, c) => x / reference.spectrum[c] - 1),
				angularRefinement: actual[1].value.spectrum.map((x, c) => x / reference.spectrum[c] - 1),
				columnRefinement: column[1].value.spectrum.map((x, c) => x / column[2].value.spectrum[c] - 1),
				columnRelative: column[2].value.spectrum.map((x, c) => x / reference.spectrum[c] - 1),
				interaction: reference.spectrum.map(
					(x, c) => x - column[2].value.spectrum[c] - base.spectrum[c] + column[0].value.spectrum[c],
				),
				chromaticities: controls.map((c) => ({
					rule: c.rule,
					kind: c.kind,
					xy: colorimetry(Array.from(c.value.spectrum), 'bin-integrated').xy,
				})),
			};
			const pathChecks = [],
				coarse = angularRule(ownedPacket(input), receiver.point, 8);
			for (let index = 0; index < coarse.directions.length; index += 16)
				for (const offset of [0, 8, 15])
					for (const kind of /** @type {const} */ (['actual', 'column'])) {
						guard();
						const v = coarse.directions[index + offset],
							control = {input, ...receiver, directions: [v], weights: [1], kind, pathCount: 8};
						const low = incidentSpecies(control, v),
							high = incidentSpecies({...control, pathCount: 16}, v);
						pathChecks.push({
							index: index + offset,
							kind,
							direction: v,
							low,
							high,
							relative: low.map((s, k) =>
								s.map((x, c) => Math.abs(x - high[k][c]) / Math.max(1e-12, Math.abs(high[k][c]))),
							),
						});
					}
			const parity = [];
			if (receiver.elevation === 3) {
				const old = previous.find((r) => r.mode === 1 && r.altitude === receiver.height),
					qualified = qualification.angular.find((r) => r.mode === 1 && r.altitude === receiver.height);
				assert.ok(old && qualified);
				for (const [now, then] of [
					[base, old.baseline],
					[reference, qualified.reference],
				]) {
					const discrepancy = Math.max(
						...then.species.flatMap((s, k) =>
							s.map((x, c) => Math.abs(now.species[k][[2, 7, 12][c]] / x - 1)),
						),
					);
					assert.ok(discrepancy < 1e-10);
					parity.push(discrepancy);
				}
			}
			rows.push({...receiver, controls, summary, pathChecks, parity});
			run.write(`receiver-${receiver.elevation}-${receiver.height}.json`, rows.at(-1));
		}
		run.write('assessment.json', {
			rows: rows.map((r) => ({
				elevation: r.elevation,
				height: r.height,
				summary: r.summary,
				parity: r.parity,
				maximumPathRefinement: Math.max(...r.pathChecks.flatMap((p) => p.relative.flat())),
			})),
			limits: [
				'Sparse P2 local sources, not integrated N2 or regenerated N4.',
				'Column is a continuous positional control, not authenticated old discrete cache.',
				'Source chromaticity is not a rendered pixel color.',
				'Path refinement is sampled, not certified over all angular nodes.',
				'No matched horizon libRadtran output.',
			],
		});
		guard();
		run.cleanup();
		assert.ok(storage().retainedBytes - before.retainedBytes < 8 * 1024 ** 2);
		const elapsedMilliseconds = Date.now() - started;
		run.finish('accepted', {
			elapsedMilliseconds,
			previousFailureMilliseconds: spent,
			gpuJobs: 0,
			receivers: rows.length,
		});
		verifyRun(run.path);
		console.log(
			JSON.stringify({
				run: run.path,
				elapsedMilliseconds,
				summary: rows.map((r) => ({
					elevation: r.elevation,
					height: r.height,
					...r.summary,
					maximumPathRefinement: Math.max(...r.pathChecks.flatMap((p) => p.relative.flat())),
				})),
			}),
		);
	} catch (error) {
		run.finish('failed', {elapsedMilliseconds: Date.now() - started, message: String(error)});
		throw error;
	}
}
main();
