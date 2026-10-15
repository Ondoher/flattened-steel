import assert from 'node:assert/strict';
import {along, altitude, dot, source, integrate} from '../horizon-audit/math.mjs';

/** Give legacy mutable-signature helpers an owned packet without exposing authenticated input arrays.
 * @param {HorizonMigrationMedium} input Deeply readonly original physical data.
 * @returns {HorizonAuditInput} Owned compatibility copy for its local consumer.
 */
export function ownedPacket(input) {
	const {aerosolAlbedos, aerosolPhaseTables, ...base} = input;
	return {
		...base,
		direction: Array.from(input.direction),
		sourcePosition: Array.from(input.sourcePosition),
		sourceDirection: Array.from(input.sourceDirection),
		sourceIrradiance: Array.from(input.sourceIrradiance),
		rayleigh: Array.from(input.rayleigh),
		mie: Array.from(input.mie),
		...(aerosolAlbedos ? {aerosolAlbedos: Array.from(aerosolAlbedos)} : {}),
		...(aerosolPhaseTables
			? {
					aerosolPhaseTables: aerosolPhaseTables.map((table) => ({
						mu: Array.from(table.mu),
						pdf: Array.from(table.pdf),
					})),
				}
			: {}),
	};
}

/** Construct a continuous N1 sampler; column mode reproduces only the old positional approximation, not its discrete cache.
 * @param {HorizonMigrationMedium} input Frozen spherical material/source packet.
 * @param {HorizonMigrationSourceKind} kind Actual-point or observer-column evaluation.
 * @param {number} [count] Independent source-column quadrature order.
 * @returns {HorizonMigrationSampler} Full-spectrum primary source; malformed points fail the shared physical checks.
 */
export function sampler(input, kind, count = 16) {
	const owned = ownedPacket(input);
	assert.equal(input.geometry, 'spherical');
	assert.equal(input.sourceKind, 'parallel');
	return (point, direction) => {
		const p = kind === 'actual' ? Array.from(point) : [0, 0, input.radius + altitude(owned, Array.from(point))];
		const f = source(owned, p, Array.from(direction), count);
		return f.species[0].map((v, c) => v + f.species[1][c]);
	};
}

/** Independently integrate a frozen source field using segmented physical view columns.
 * @param {HorizonMigrationMedium} input Frozen physical packet.
 * @param {readonly number[]} origin Observer world position, meters.
 * @param {readonly number[]} direction Unit world direction.
 * @param {number} end Independently derived physical endpoint, meters.
 * @param {HorizonMigrationSampler} sample Continuous source capability.
 * @param {number} count Gauss nodes per geometric segment.
 * @returns {readonly number[]} Full spectral radiance, sharing no production view placement.
 */
export function continuous(input, origin, direction, end, sample, count) {
	return integrate(ownedPacket(input), Array.from(origin), Array.from(direction), 0, end, count, (p, v) =>
		Array.from(sample(p, v)),
	).spectrum;
}

/** Replay uniform or quadratic midpoint placement with its own accumulated midpoint extinction, holding the source fixed.
 * @param {HorizonMigrationMedium} input Frozen physical packet.
 * @param {readonly number[]} origin Observer world position.
 * @param {readonly number[]} direction Unit physical viewing direction.
 * @param {number} end Physical view extent, meters.
 * @param {HorizonMigrationSampler} sample Frozen source operation.
 * @param {number} count Number of positive-width segments.
 * @param {number} power One for historical uniform, two for current quadratic spacing.
 * @returns {HorizonMigrationIntegral} Spectrum and actual contribution trace; invalid count/extent fails assertions.
 */
export function midpoint(input, origin, direction, end, sample, count, power) {
	const owned = ownedPacket(input);
	assert.ok(count > 0 && Number.isSafeInteger(count) && end > 0 && (power === 1 || power === 2));
	const result = Array(input.rayleigh.length).fill(0),
		transmission = result.map(() => 1),
		samples = [];
	for (let i = 0; i < count; i++) {
		const a = end * (i / count) ** power,
			b = end * ((i + 1) / count) ** power,
			distance = (a + b) / 2,
			width = b - a;
		const p = along(origin, direction, distance),
			h = altitude(owned, p),
			f = sample(p, direction);
		const contribution = f.map((v, c) => {
			const extinction =
				input.rayleigh[c] * Math.exp(-h / input.rayleighHeight) + input.mie[c] * Math.exp(-h / input.mieHeight);
			const half = Math.exp((-extinction * width) / 2),
				value = transmission[c] * half * v * width;
			transmission[c] *= half * half;
			result[c] += value;
			return value;
		});
		const r = Math.hypot(...p),
			mu = dot(p, input.sourceDirection) / r;
		samples.push({
			distance,
			altitude: h,
			solarZenith: (Math.acos(Math.max(-1, Math.min(1, mu))) * 180) / Math.PI,
			source: f,
			contribution,
		});
	}
	for (let c = 0; c < result.length; c++)
		assert.ok(Math.abs(samples.reduce((s, r) => s + r.contribution[c], 0) - result[c]) < 1e-12);
	return {spectrum: result, samples};
}

/** Independent local-up/source frame round trip, separate from production cache interpolation.
 * @param {HorizonMigrationMedium} input Frozen source packet.
 * @param {readonly number[]} point Physical query position.
 * @param {readonly number[]} direction Physical unit direction.
 * @returns {number} Largest absolute reconstruction discrepancy; nonunit directions fail the check.
 */
export function frameError(input, point, direction) {
	const norm = Math.hypot(...point),
		up = point.map((v) => v / norm),
		mu = dot(up, input.sourceDirection);
	const projected = input.sourceDirection.map((v, i) => v - mu * up[i]),
		n = Math.hypot(...projected);
	assert.ok(n > 1e-10);
	const x = projected.map((v) => v / n),
		y = [up[1] * x[2] - up[2] * x[1], up[2] * x[0] - up[0] * x[2], up[0] * x[1] - up[1] * x[0]];
	const local = [dot(direction, x), dot(direction, y), dot(direction, up)];
	return Math.max(...direction.map((v, i) => Math.abs(v - local[0] * x[i] - local[1] * y[i] - local[2] * up[i])));
}
