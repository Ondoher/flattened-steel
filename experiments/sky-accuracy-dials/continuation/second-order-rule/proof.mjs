import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadInputs} from '../../execution.mjs';
import {dot} from '../../numerics/math.js';
import {readRegistration} from '../registration/run.mjs';
import {volumeSphereExit} from '../volume-reference/geometry.mjs';
import {secondOrderViewNodes, viewHeightBreaks, viewHeightCoordinate} from '../second-order-view/geometry.mjs';
import {secondOrderOuterRule} from './geometry.mjs';

/** Independently sum a dense transformed Simpson rule for a manufactured source.
 * This proof-only construction includes the exact zero-Jacobian ground endpoint;
 * its panel counts do not extend the public physical evaluation API.
 * @param {number} radius - Matched ground radius.
 * @param {number} projection - Original surface origin dotted with original view.
 * @param {number} panels - Dense even proof-only panel count per interval.
 * @param {number} extinction - Manufactured constant coefficient, in inverse metres.
 * @returns {number} Constant-source attenuated path integral, in metres.
 */
function denseSimpson(radius, projection, panels, extinction) {
	let integral = 0;
	for (let interval = 0; interval < viewHeightBreaks.length - 1; interval++) {
		const start = Math.sqrt(viewHeightBreaks[interval]),
			end = Math.sqrt(viewHeightBreaks[interval + 1]);
		const step = (end - start) / panels;
		for (let index = 0; index <= panels; index++) {
			const coordinate = index === panels ? end : start + index * step;
			const {distance, jacobian} = viewHeightCoordinate(radius, projection, coordinate);
			const coefficient = index === 0 || index === panels ? 1 : index % 2 ? 4 : 2;
			integral += (step / 3) * coefficient * jacobian * Math.exp(-extinction * distance);
		}
	}
	return integral;
}

/** Prove rule moments, snapped endpoints, exact nested geometry and manufactured integrals.
 * Coarse Simpson errors are retained as observations, not required to vanish.
 * Dense independent Simpson checks establish convergence at the original strict
 * analytic tolerance. No atmospheric radiance is evaluated and no files are written.
 * @param {DialContinuationRegistrationRead} registration - Authenticated original C0 rays.
 * @param {SkyTransportSpec} spec - Unchanged matched physical radii.
 * @returns {SkySecondOrderOuterProof} Actual local mathematical checks and observed errors.
 */
export function secondOrderOuterProof(registration, spec) {
	let checks = 0,
		maximumMomentError = 0;
	/** @type {SkySecondOrderOuterObservation[]} */
	const observations = [];
	/** @type {SkySecondOrderOuterConvergence[]} */
	const convergence = [];
	/** @type {readonly SkySecondOrderOuterKind[]} */
	const kinds = ['gauss-height', 'gauss-distance', 'simpson-height'];
	const counts = [4, 8, 16];
	const radius = spec.planet.bottomRadiusMeters;
	/** @param {boolean} condition - Required mathematical property. @param {string} message - Checked claim. */
	function check(condition, message) {
		assert.ok(condition, message);
		checks++;
	}
	for (const probeId of ['p-0930-5-7', 'p-1230-3-5']) {
		const probeIndex = registration.probes.findIndex((probe) => probe.probeId === probeId);
		assert.ok(probeIndex >= 0);
		const ray = registration.record.probeRays[probeIndex];
		const projection = dot(ray.origin, ray.direction);
		const length = volumeSphereExit(ray.origin, ray.direction, spec.planet.topRadiusMeters);
		for (const kind of kinds)
			for (const count of counts) {
				const rule = secondOrderOuterRule(registration, spec, probeId, kind, count),
					nodes = rule.nodes;
				check(rule.kind === kind && rule.count === count, 'Exact declared rule identity.');
				check(
					rule.groundEndpointAnalyticZero === (kind === 'simpson-height'),
					'Only Simpson omits the exact zero-Jacobian endpoint.',
				);
				check(
					nodes.length === (kind === 'simpson-height' ? 4 * (count + 1) - 1 : 4 * count),
					'Every physical interval contributes its declared terms.',
				);
				check(
					new Set(nodes.map((node) => node.id)).size === nodes.length,
					'Interval terms have unique identities.',
				);
				check(
					nodes.every((node, index) => node.index === index),
					'Result order has contiguous global indices.',
				);
				if (kind === 'gauss-height') {
					assert.deepEqual(nodes, secondOrderViewNodes(registration, spec, probeId, count));
					checks++;
				}
				for (const node of nodes) {
					check(
						node.weightMeters > 0 && Number.isFinite(node.weightMeters),
						'Every retained path weight is finite and positive.',
					);
					check(
						node.heightMeters > 0 &&
							node.heightMeters >= viewHeightBreaks[node.interval] &&
							node.heightMeters <= viewHeightBreaks[node.interval + 1],
						'No epsilon-ground node or out-of-interval point.',
					);
					check(
						Math.abs(Math.hypot(...node.origin) - radius - node.heightMeters) < 1e-6,
						'Independent Euclidean radius agrees with declared height.',
					);
					assert.deepEqual(node.direction, ray.direction, 'The original world view is unchanged.');
					assert.deepEqual(node.surfaceOrigin, ray.origin, 'The original surface origin is unchanged.');
					checks += 2;
				}
				for (let interval = 0; interval < viewHeightBreaks.length - 1; interval++) {
					const selected = nodes.filter((node) => node.interval === interval);
					const low = viewHeightBreaks[interval],
						high = viewHeightBreaks[interval + 1];
					const startDistance = low === 0 ? 0 : volumeSphereExit(ray.origin, ray.direction, radius + low);
					const endDistance = volumeSphereExit(ray.origin, ray.direction, radius + high);
					const startY = Math.sqrt(low),
						endY = Math.sqrt(high);
					const maximumDegree = kind === 'simpson-height' ? 3 : 2 * count - 1;
					// At the omitted ground point, a normalized y polynomial of positive
					// degree vanishes. Its source after removing ds/dy stays bounded.
					const minimumDegree = kind === 'simpson-height' && interval === 0 ? 1 : 0;
					for (let degree = minimumDegree; degree <= maximumDegree; degree++) {
						const moment = selected.reduce((sum, node) => {
							if (kind === 'gauss-distance') {
								const span = endDistance - startDistance;
								return (
									sum +
									(node.weightMeters / span) *
										((node.distanceMeters - startDistance) / span) ** degree
								);
							}
							const coordinate = Math.sqrt(node.heightMeters);
							const {jacobian} = viewHeightCoordinate(radius, projection, coordinate);
							return (
								sum +
								(node.weightMeters / (jacobian * (endY - startY))) *
									((coordinate - startY) / (endY - startY)) ** degree
							);
						}, 0);
						const error = Math.abs(moment - 1 / (degree + 1));
						maximumMomentError = Math.max(maximumMomentError, error);
						check(error < 5e-12, 'Polynomial moments obey the independent quadrature degree.');
					}
					if (kind === 'gauss-distance') {
						check(
							Math.abs(
								selected.reduce((sum, node) => sum + node.weightMeters, 0) -
									(endDistance - startDistance),
							) < 1e-6,
							'Distance weights exactly integrate interval length within geometry roundoff.',
						);
					}
					if (kind === 'simpson-height') {
						check(
							selected.at(-1).heightMeters === high,
							'Upper Simpson endpoint snaps to the exact declared height.',
						);
						if (interval > 0) {
							const left = nodes.filter((node) => node.interval === interval - 1).at(-1),
								right = selected[0];
							check(
								left.id !== right.id && left.heightMeters === low && right.heightMeters === low,
								'Shared endpoints remain separate interval terms at exact heights.',
							);
							assert.deepEqual(
								left.origin,
								right.origin,
								'Shared endpoints have identical physical coordinates.',
							);
							assert.equal(left.distanceMeters, right.distanceMeters);
							checks += 2;
						}
					}
				}
				const pathErrorMeters = Math.abs(nodes.reduce((sum, node) => sum + node.weightMeters, 0) - length);
				const extinctionErrors = [1e-6, 1e-4].map((extinctionPerMeter) => {
					const integral = nodes.reduce(
						(sum, node) => sum + node.weightMeters * Math.exp(-extinctionPerMeter * node.distanceMeters),
						0,
					);
					const exact = -Math.expm1(-extinctionPerMeter * length) / extinctionPerMeter;
					return {extinctionPerMeter, absoluteErrorMeters: Math.abs(integral - exact)};
				});
				check(
					Number.isFinite(pathErrorMeters) &&
						extinctionErrors.every((item) => Number.isFinite(item.absoluteErrorMeters)),
					'Coarse approximation observations remain finite.',
				);
				if (kind !== 'simpson-height' && count === 16) {
					check(
						pathErrorMeters < 1e-6 && extinctionErrors.every((item) => item.absoluteErrorMeters < 1e-6),
						'Fine Gaussian formulations match manufactured analytic integrals.',
					);
				}
				observations.push({probeId, kind, count, pathErrorMeters, extinctionErrors});
			}
		for (const count of [4, 8]) {
			const coarse = secondOrderOuterRule(registration, spec, probeId, 'simpson-height', count);
			const fine = secondOrderOuterRule(registration, spec, probeId, 'simpson-height', 2 * count);
			for (const node of coarse.nodes) {
				const shared = fine.nodes.find(
					(candidate) => candidate.interval === node.interval && candidate.heightMeters === node.heightMeters,
				);
				check(Boolean(shared), 'Every coarse Simpson geometry is exactly nested in the next panel rule.');
				assert.equal(shared.distanceMeters, node.distanceMeters);
				assert.deepEqual(shared.origin, node.origin);
				checks += 2;
			}
		}
		for (const extinctionPerMeter of [0, 1e-6, 1e-4]) {
			const panelCounts = [256, 512];
			const exact =
				extinctionPerMeter === 0 ? length : -Math.expm1(-extinctionPerMeter * length) / extinctionPerMeter;
			const absoluteErrorsMeters = panelCounts.map((panels) =>
				Math.abs(denseSimpson(radius, projection, panels, extinctionPerMeter) - exact),
			);
			check(
				absoluteErrorsMeters[1] < 1e-5,
				'Dense independent Simpson meets the strict manufactured integral tolerance.',
			);
			check(
				absoluteErrorsMeters[1] <= absoluteErrorsMeters[0] + 1e-7,
				'Dense Simpson refinement converges up to the geometry roundoff floor.',
			);
			convergence.push({probeId, extinctionPerMeter, panelCounts, absoluteErrorsMeters});
		}
	}
	for (const count of [0, 3, 5, 32, Infinity]) {
		assert.throws(() => secondOrderOuterRule(registration, spec, 'p-0930-5-7', 'simpson-height', count));
		checks++;
	}
	assert.throws(() => secondOrderOuterRule(registration, spec, 'unregistered', 'gauss-distance', 4));
	checks++;
	return {schemaId: 'sky-second-order-outer-proof-v1', checks, maximumMomentError, observations, convergence};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.equal(process.argv.length, 3, 'Pass the immutable original C0 registration path.');
	console.log(
		JSON.stringify(
			secondOrderOuterProof(readRegistration(process.argv[2]), loadInputs().native48.transportSpec),
			null,
			2,
		),
	);
}
