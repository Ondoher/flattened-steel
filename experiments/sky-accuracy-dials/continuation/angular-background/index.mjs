import assert from 'node:assert/strict';
import {medium} from '../../numerics/direct.js';
import {volumeJ2Weights} from '../volume-j2/angular.mjs';
import {reconstructionValue, reconstructionSum, reconstructionDifference} from '../source-reconstruction/index.mjs';
import {phaseMagnitudeGate} from '../source-reconstruction/phase.mjs';

/** @param {SkySourceReconstructionValue} a @param {SkySourceReconstructionValue} b @returns {SkySourceReconstructionValue} */
export function backgroundProduct(a, b) {
	const value = a.value * b.value;
	return reconstructionValue(
		value,
		Math.abs(a.value) * b.allowance +
			Math.abs(b.value) * a.allowance +
			a.allowance * b.allowance +
			512 * Number.EPSILON * Math.abs(value),
	);
}

/** @param {SkyVolumeChannel} channel @param {'atmosphere'|'directGround'|'total'} component @returns {SkySourceReconstructionValue} */
function radiance(channel, component) {
	const v = channel[component];
	assert.ok(v.resolved && v.gaussWatts !== null && v.simpsonWatts !== null && v.empiricalAllowanceWatts !== null);
	const value = (v.gaussWatts + v.simpsonWatts) / 2;
	return reconstructionValue(value, v.empiricalAllowanceWatts + 256 * Number.EPSILON * Math.abs(value));
}

/** One retained-grid mean, not a qualified continuous angular oracle.
 * @param {SkyAngularBackgroundCell} cell @param {number} channel @param {'atmosphere'|'directGround'|'total'} component
 * @returns {SkySourceReconstructionValue}
 */
function backgroundMean(cell, channel, component) {
	const values = cell.groups.map((group, index) => {
		const c = cell.nodes.find((n) => n.index === index)?.channels.find((c) => c.channel === channel);
		assert.ok(c);
		return radiance(c, component);
	});
	return reconstructionSum(
		values,
		cell.groups.map((g) => (2 * g.incident.weight) / (4 * Math.PI)),
	);
}

/** Exact attribution of discrete quadrature responses, with unchanged input fields.
 * @param {SkyAngularBackgroundInput} input
 * @returns {{components:SkyAngularBackgroundComponent[],responses:SkyAngularBackgroundResponse[]}}
 */
export function evaluateAngularBackground(input) {
	const fine = input.cells[3];
	/** @type {SkyAngularBackgroundComponent[]} */ const components = [];
	/** @type {readonly SkyAngularBackgroundPart[]} */ const parts = [
		'atmosphereRayleigh',
		'atmosphereMie',
		'groundRayleigh',
		'groundMie',
		'combined',
	];
	for (const channel of [0, 8])
		for (const component of parts) {
			const physical = component.startsWith('atmosphere')
				? 'atmosphere'
				: component.startsWith('ground')
					? 'directGround'
					: 'total';
			const species = component.endsWith('Rayleigh') ? 0 : component.endsWith('Mie') ? 1 : 2;
			const constant = backgroundMean(fine, channel, physical);
			for (const cell of input.cells) {
				const beta = medium(
					input.spec,
					channel,
					Math.hypot(...cell.target.origin) - input.spec.planet.bottomRadiusMeters,
				);
				const coefficient = species === 2 ? beta[1] + beta[2] : beta[species + 1];
				assert.ok(coefficient > 0);
				const weights = cell.groups.map((g) => {
					const w = volumeJ2Weights(input.spec, cell.target, channel, g.incident);
					return species === 2 ? w[0] + w[1] : w[species];
				});
				const values = cell.groups.map((_, index) => {
					const c = cell.nodes.find((n) => n.index === index)?.channels.find((c) => c.channel === channel);
					assert.ok(c);
					return radiance(c, physical);
				});
				const phaseMass = reconstructionSum(
					weights.map((w) => reconstructionValue(w, 256 * Number.EPSILON * Math.abs(w))),
					weights.map(() => 1),
				);
				const normalization = reconstructionSum([phaseMass], [1 / coefficient]);
				const quadrature = reconstructionSum(values, weights),
					background = backgroundProduct(constant, phaseMass);
				const directional = reconstructionSum(
					values.map((v) => reconstructionDifference(v, constant)),
					weights,
				);
				const allowance =
					1024 *
					Number.EPSILON *
					weights.length *
					(Math.abs(quadrature.value) + Math.abs(background.value) + Math.abs(directional.value));
				assert.ok(Math.abs(quadrature.value - background.value - directional.value) <= allowance);
				const retained = cell.rows.find((r) => r.channel === channel)?.[component];
				assert.ok(retained?.resolved && retained.mean !== null);
				assert.ok(Math.abs(quadrature.value - retained.mean) <= allowance);
				components.push({
					cell: cell.id,
					channel,
					component,
					constant,
					phaseMass,
					normalization,
					quadrature,
					background,
					directional,
				});
			}
		}
	/** @type {SkyAngularBackgroundResponse[]} */ const responses = [];
	const contrasts = [
		{name: 'radial', weights: [-1, 1, 0, 0]},
		{name: 'azimuth', weights: [-1, 0, 1, 0]},
		{name: 'joint', weights: [-1, 0, 0, 1]},
		{name: 'interaction', weights: [1, -1, -1, 1]},
	];
	for (const channel of [0, 8])
		for (const component of parts) {
			const selected = components.filter((c) => c.channel === channel && c.component === component);
			assert.equal(selected.length, 4);
			for (const contrast of contrasts) {
				const total = reconstructionSum(
					selected.map((c) => c.quadrature),
					contrast.weights,
				);
				const massResponse = reconstructionSum(
					selected.map((c) => c.phaseMass),
					contrast.weights,
				);
				const background = backgroundProduct(selected[0].constant, massResponse);
				const directional = reconstructionSum(
					selected.map((c) => c.directional),
					contrast.weights,
				);
				const identityResidual = total.value - background.value - directional.value;
				assert.ok(Math.abs(identityResidual) <= total.allowance + background.allowance + directional.allowance);
				responses.push({
					channel,
					component,
					response: contrast.name,
					total,
					background,
					directional,
					identityResidual,
					backgroundSmall:
						component === 'combined' && contrast.name !== 'interaction'
							? phaseMagnitudeGate(background, total, 0.1)
							: null,
				});
			}
		}
	return {components, responses};
}

/** Manufactured constant/zero fields and response identities; no retained data.
 * @returns {{checks:number,scope:string}}
 */
export function angularBackgroundProof() {
	let checks = 0;
	/** @param {boolean} value @returns {void} */ function check(value) {
		assert.ok(value, 'Angular background proof ' + (checks + 1));
		checks++;
	}
	for (const c of [0, 1, 10])
		for (const weights of [
			[0.2, 0.3],
			[0.1, 0.4],
			[0.3, 0.3],
		]) {
			const constant = reconstructionValue(c),
				mass = reconstructionSum(
					weights.map((w) => reconstructionValue(w)),
					[1, 1],
				);
			const q = reconstructionSum([constant, constant], weights),
				b = backgroundProduct(constant, mass);
			const residual = reconstructionSum(
				[reconstructionDifference(constant, constant), reconstructionDifference(constant, constant)],
				weights,
			);
			check(Math.abs(q.value - b.value) <= q.allowance + b.allowance);
			check(residual.value === 0);
		}
	for (const [c, a, b] of [
		[0, 1, 2],
		[1, -1, 3],
		[2, 3, -2],
	])
		check(c * (b - a) === c * b - c * a);
	const v = reconstructionValue;
	check(phaseMagnitudeGate(v(0.01), v(1), 0.1) === 'passed');
	check(phaseMagnitudeGate(v(0.2), v(1), 0.1) === 'failed');
	check(phaseMagnitudeGate(v(0), v(0, 1e-8), 0.1) === 'unresolved');
	return {
		checks,
		scope: 'Isotropic and zero-light identities, fixed-background response identity, failed and unresolved dominance.',
	};
}

/** @param {ReturnType<typeof evaluateAngularBackground>} result @returns {string} */
export function angularBackgroundReport(result) {
	return [
		'# Constant background and directional angular response',
		'',
		'Frozen p-0930-5-7:h1000, channels0/8. Density responses in W m^-3 sr^-1 nm^-1. The constant is the retained r16-a32 solid-angle mean, not an admitted angular oracle.',
		'',
		'| Channel | Change | Total response | Constant-background response | Directional-field response | Background <=10% |',
		'| ---: | --- | ---: | ---: | ---: | --- |',
		...result.responses
			.filter((r) => r.component === 'combined')
			.map(
				(r) =>
					'| ' +
					r.channel +
					' | ' +
					r.response +
					' | ' +
					r.total.value +
					' | ' +
					r.background.value +
					' | ' +
					r.directional.value +
					' | ' +
					(r.backgroundSmall ?? 'not registered') +
					' |',
			),
		'',
		'| Rule | Rayleigh normalization minus1 | Mie normalization minus1 |',
		'| --- | ---: | ---: |',
		...['r8-a16', 'r16-a16', 'r8-a32', 'r16-a32'].map((cell) => {
			const r = result.components.find(
					(r) => r.cell === cell && r.channel === 0 && r.component === 'atmosphereRayleigh',
				),
				m = result.components.find(
					(r) => r.cell === cell && r.channel === 0 && r.component === 'atmosphereMie',
				);
			assert.ok(r && m);
			return '| ' + cell + ' | ' + (r.normalization.value - 1) + ' | ' + (m.normalization.value - 1) + ' |';
		}),
		'',
		'All component sums replay their historical values. Species and atmosphere/ground terms, fixed constants, empirical allowances and every registered predicate are retained in JSON. These are three-interval angular rules. The result attributes their observed refinement responses; it does not measure absolute angular error or production-H accuracy.',
		'',
	].join('\n');
}
