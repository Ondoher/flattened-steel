import assert from 'node:assert/strict';
import {altitude, bounds, dot, integrate, source, unit} from '../horizon-audit/math.mjs';
import {miePhase} from '../horizon/diagnosis-transport.mjs';
import {ownedPacket} from './math.mjs';

/** Integrate the same N1 field while retaining the species of its first scatter.
 * @param {HorizonSecondOrderControl} control Frozen geometry, material and rule.
 * @param {readonly number[]} direction Incoming look direction.
 * @returns {HorizonSecondOrderIncident} Rayleigh and Mie incoming radiances; invalid geometry rejects through shared assertions.
 */
export function incidentSpecies(control, direction) {
	const input = ownedPacket(control.input),
		point = Array.from(control.point),
		v = Array.from(direction);
	const end = bounds(input, point, v).distance;
	assert.ok(Number.isFinite(end) && end >= 0);
	if (control.kind === 'actual') return integrate(input, point, v, 0, end, control.pathCount).species;
	return [0, 1].map(
		(k) =>
			integrate(
				input,
				point,
				v,
				0,
				end,
				control.pathCount,
				(p, outgoing) =>
					source(input, [0, 0, input.radius + altitude(input, p)], outgoing, control.pathCount).species[k],
			).spectrum,
	);
}

/** Resolve all four species histories and incoming regions without a cache.
 * @param {HorizonSecondOrderControl} control Immutable physical query and selected rule.
 * @param {HorizonSecondOrderGuard} guard Deadline and progress capability, called throughout numerical work.
 * @returns {HorizonSecondOrderSource} Pure-P2 local source; errors propagate and the owning runner seals failure.
 */
export function secondOrder(control, guard) {
	const input = ownedPacket(control.input),
		point = Array.from(control.point),
		n = input.rayleigh.length;
	assert.equal(input.geometry, 'spherical');
	assert.equal(input.sourceKind, 'parallel');
	assert.equal(control.directions.length, control.weights.length);
	const empty = () => [0, 1].map(() => [0, 1].map(() => Array(n).fill(0)));
	const history = empty(),
		regions = {ground: empty(), grazing: empty(), sky: empty()};
	const z = altitude(input, point),
		up = unit(point);
	for (let i = 0; i < control.directions.length; i++) {
		guard();
		const v = control.directions[i],
			incoming = incidentSpecies(control, v);
		const cosine = dot(Array.from(control.outgoing), Array.from(v));
		const phase = [(3 * (1 + cosine * cosine)) / (16 * Math.PI), miePhase(cosine, input.g)];
		const key =
			Math.abs(dot(Array.from(v), up)) < 0.1
				? 'grazing'
				: bounds(input, point, Array.from(v)).endsOnGround
					? 'ground'
					: 'sky';
		assert.ok(control.weights[i] > 0 && incoming.flat().every((x) => Number.isFinite(x) && x >= 0));
		for (let a = 0; a < 2; a++)
			for (let b = 0; b < 2; b++)
				for (let c = 0; c < n; c++) {
					const coefficient =
						b === 0
							? input.rayleigh[c] * Math.exp(-z / input.rayleighHeight)
							: input.mie[c] * input.albedo * Math.exp(-z / input.mieHeight);
					const value = incoming[a][c] * control.weights[i] * phase[b] * coefficient;
					history[a][b][c] += value;
					regions[key][a][b][c] += value;
				}
	}
	const species = [0, 1].map((b) => history[0][b].map((x, c) => x + history[1][b][c]));
	const spectrum = species[0].map((x, c) => x + species[1][c]);
	const closureAbsolute = Math.max(
		...history.flatMap((row, a) =>
			row.flatMap((values, b) =>
				values.map((x, c) =>
					Math.abs(x - Object.values(regions).reduce((sum, region) => sum + region[a][b][c], 0)),
				),
			),
		),
	);
	assert.ok(closureAbsolute < 1e-14);
	return {
		history,
		regions,
		species,
		spectrum,
		closureAbsolute,
		solidAngle: control.weights.reduce((a, b) => a + b, 0),
	};
}
