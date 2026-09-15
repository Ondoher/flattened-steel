import assert from 'node:assert/strict';
import {medium, phase} from '../../numerics/direct.js';
import {sourceFrame, unit, solarCubic} from '../../numerics/math.js';

/** @param {number} value @param {number} [allowance] @returns {SkySourceReconstructionValue} */
export function reconstructionValue(value, allowance = 0) {
	assert.ok(Number.isFinite(value) && Number.isFinite(allowance) && allowance >= 0);
	return {value, allowance};
}
/** @param {readonly SkySourceReconstructionValue[]} values @param {readonly number[]} weights @returns {SkySourceReconstructionValue} */
export function reconstructionSum(values, weights) {
	assert.equal(values.length, weights.length);
	let value = 0,
		allowance = 0,
		scale = 0;
	for (let i = 0; i < values.length; i++) {
		assert.ok(Number.isFinite(weights[i]));
		value += weights[i] * values[i].value;
		allowance += Math.abs(weights[i]) * values[i].allowance;
		scale += Math.abs(weights[i] * values[i].value);
	}
	return reconstructionValue(value, allowance + 256 * Number.EPSILON * scale);
}
/** @param {SkySourceReconstructionValue} a @param {SkySourceReconstructionValue} b @returns {SkySourceReconstructionValue} */
export function reconstructionDifference(a, b) {
	return reconstructionSum([a, b], [1, -1]);
}

/** The signed harmonic slope is globally 2-Lipschitz in each secant.
 * Thus an interior slope has allowance 2*Uprevious+4*Ulower+2*Uupper.
 * Hermite basis magnitudes then propagate a conservative bound, conditional on
 * the input empirical allowances. Rounding is budgeted separately.
 * @param {readonly SkySourceReconstructionValue[]} values @param {number} fraction
 * @param {boolean} first @param {boolean} last @returns {SkySourceReconstructionValue}
 */
export function reconstructionSolar(values, fraction, first, last) {
	assert.equal(values.length, 4);
	assert.ok(fraction >= 0 && fraction <= 1);
	const [p, l, u, n] = values;
	if (fraction === 0) return l;
	if (fraction === 1) return u;
	const t2 = fraction * fraction,
		t3 = t2 * fraction;
	const h = [2 * t3 - 3 * t2 + 1, t3 - 2 * t2 + fraction, -2 * t3 + 3 * t2, t3 - t2];
	const lowerSlope = first ? l.allowance + u.allowance : 2 * p.allowance + 4 * l.allowance + 2 * u.allowance;
	const upperSlope = last ? l.allowance + u.allowance : 2 * l.allowance + 4 * u.allowance + 2 * n.allowance;
	const value = solarCubic(first ? undefined : p.value, l.value, u.value, last ? undefined : n.value, fraction);
	const allowance =
		Math.abs(h[0]) * l.allowance +
		Math.abs(h[2]) * u.allowance +
		Math.abs(h[1]) * lowerSlope +
		Math.abs(h[3]) * upperSlope +
		256 * Number.EPSILON * Math.max(...values.map((x) => Math.abs(x.value)));
	return reconstructionValue(value, allowance);
}
/** Preserve the existing altitude/direction/solar operation order for either storage format.
 * @param {readonly SkySourceReconstructionValue[]} field @param {SkyViewSample} sample
 * @returns {SkySourceReconstructionValue}
 */
export function reconstructSourceField(field, sample) {
	assert.ok(sample.altitudeWeights.every((x) => x >= 0) && sample.directionWeights.every((x) => x >= 0));
	let offset = 0;
	const heights = sample.altitudeWeights.map(() => {
		const solar = Array.from({length: 4}, () => {
			const values = sample.directionWeights.map(() => field[sample.indices[offset++]]);
			assert.ok(values.every(Boolean));
			return reconstructionSum(values, sample.directionWeights);
		});
		return reconstructionSolar(solar, sample.solarFraction, sample.firstSolarInterval, sample.lastSolarInterval);
	});
	assert.equal(offset, sample.indices.length);
	return reconstructionSum(heights, sample.altitudeWeights);
}
/** A reference input perturbation can cross a Float32 rounding boundary; allow
 * an extra full relative unit plus the least subnormal, including the centre's
 * actual conversion. Finite source results remain fixed declared inputs.
 * @param {SkySourceReconstructionValue} input @param {number} coefficient
 * @param {SkySourceReconstructionPrecision} precision @returns {SkySourceReconstructionValue}
 */
function storedProduct(input, coefficient, precision) {
	assert.ok(coefficient >= 0 && Number.isFinite(coefficient));
	const unrounded = input.value * coefficient;
	const value = precision === 'float32' ? Math.fround(unrounded) : unrounded;
	const rounding =
		precision === 'float32'
			? Math.abs(value - unrounded) + 2 ** -23 * (Math.abs(unrounded) + input.allowance * coefficient) + 2 ** -149
			: 64 * Number.EPSILON * Math.abs(unrounded);
	return reconstructionValue(value, coefficient * input.allowance + rounding);
}
/** Populate the same sparse reconstruction support from retained finite or reference columns.
 * @param {SkySourceAuditInput} input @param {readonly SkySourceReconstructionColumn[]} columns
 * @param {number} channel @param {SkySourceReconstructionCount} count
 * @param {SkySourceReconstructionPrecision} precision @returns {SkySourceReconstructionFields}
 */
export function sourceReconstructionFields(input, columns, channel, count, precision) {
	const spec = input.buildRequest.transportSpec;
	const irradiance = spec.domains.spectrum.channels[channel].sourceIrradianceDensityWattsPerSquareMeterPerNanometer;
	/** @type {{raw:SkySourceReconstructionValue[],rayleighDensity:SkySourceReconstructionValue[],mieDensity:SkySourceReconstructionValue[],rayleighLighting:SkySourceReconstructionValue[],mieLighting:SkySourceReconstructionValue[]}} */
	const fields = {raw: [], rayleighDensity: [], mieDensity: [], rayleighLighting: [], mieLighting: []};
	for (const knot of input.knots) {
		const column = columns.find(
			(row) =>
				row.channel === channel && row.coordinate.id === 'knot:' + knot.altitudeIndex + ':' + knot.solarIndex,
		);
		assert.ok(column);
		const frame = sourceFrame(column.coordinate.point),
			local = spec.domains.outgoing.unitVectors[knot.directionIndex];
		const world = unit(
			[0, 1, 2].map((axis) => frame[0][axis] * local[0] + frame[1][axis] * local[1] + frame[2][axis] * local[2]),
		);
		const phases = phase(spec, world[2]),
			beta = medium(spec, channel, column.coordinate.altitudeMeters);
		const r = irradiance * phases[0],
			m = irradiance * phases[1],
			transmission = column[count];
		fields.raw.push(
			storedProduct(transmission, irradiance * (beta[1] * phases[0] + beta[2] * phases[1]), precision),
		);
		fields.rayleighDensity.push(storedProduct(transmission, r * beta[1], precision));
		fields.mieDensity.push(storedProduct(transmission, m * beta[2], precision));
		fields.rayleighLighting.push(storedProduct(transmission, r, precision));
		fields.mieLighting.push(storedProduct(transmission, m, precision));
	}
	return fields;
}
/** @param {SkySourceReconstructionFields} fields @param {SkyViewSample} sample
 * @param {SkySourceReconstructionMode} mode @param {SkyVector3} beta
 * @returns {SkySourceReconstructionValue}
 */
export function reconstructSourceDensity(fields, sample, mode, beta) {
	if (mode === 'raw') return reconstructSourceField(fields.raw, sample);
	if (mode === 'split')
		return reconstructionSum(
			[reconstructSourceField(fields.rayleighDensity, sample), reconstructSourceField(fields.mieDensity, sample)],
			[1, 1],
		);
	return reconstructionSum(
		[reconstructSourceField(fields.rayleighLighting, sample), reconstructSourceField(fields.mieLighting, sample)],
		[beta[1], beta[2]],
	);
}
/** @param {SkySourceReconstructionValue} value @returns {SkySourceAuditState} */
function positive(value) {
	return value.value > value.allowance ? 'passed' : value.value < -value.allowance ? 'failed' : 'unresolved';
}
/** @param {SkySourceReconstructionValue} value @returns {SkySourceAuditState} */
function negative(value) {
	return positive(reconstructionValue(-value.value, value.allowance));
}
/** A ratio gate requires a resolved control error; unresolved inputs do not pass.
 * @param {SkySourceReconstructionValue} candidate @param {SkySourceReconstructionValue} control
 * @returns {SkySourceAuditState}
 */
export function sourceReconstructionImprovement(candidate, control) {
	if (Math.abs(control.value) <= control.allowance) return 'unresolved';
	return Math.abs(candidate.value) + candidate.allowance <= 0.2 * (Math.abs(control.value) - control.allowance)
		? 'passed'
		: 'failed';
}
/** @param {readonly SkySourceReconstructionRow[]} rows @returns {SkySourceReconstructionGroup[]} */
export function groupSourceReconstruction(rows) {
	const keys = [...new Set(rows.map((row) => row.probeId + ':' + row.channel))];
	return keys.map((key) => {
		const selected = rows.filter((row) => row.probeId + ':' + row.channel === key),
			weights = selected.map((row) => row.weightMeters);
		/** @type {Record<string,SkySourceReconstructionValue>} */ const projected = {};
		/** @type {Record<string,number>} */ const rms = {};
		/** @type {Record<string,{positive:number,negative:number,unresolved:number}>} */ const localSigns = {};
		for (const term of Object.keys(selected[0].terms)) {
			const values = selected.map((row) => row.terms[term]);
			projected[term] = reconstructionSum(values, weights);
			rms[term] = Math.hypot(...values.map((row) => row.value)) / Math.sqrt(values.length);
			localSigns[term] = {
				positive: values.filter((row) => row.value > row.allowance).length,
				negative: values.filter((row) => row.value < -row.allowance).length,
				unresolved: values.filter((row) => Math.abs(row.value) <= row.allowance).length,
			};
		}
		const growth = reconstructionValue(
			Math.abs(projected.total160.value) - Math.abs(projected.total80.value),
			projected.total160.allowance + projected.total80.allowance,
		);
		return {
			probeId: selected[0].probeId,
			channel: selected[0].channel,
			sampleCount: selected.length,
			projected,
			rms,
			localSigns,
			checks: {
				positiveReconstruction: positive(projected.reconstruction),
				negativeSource: negative(projected.source),
				positiveRefinement: positive(projected.response),
				rawErrorGrowth: positive(growth),
				factoredImprovement: sourceReconstructionImprovement(projected.factored, projected.split),
			},
		};
	});
}
/** No physical integration or measured radiance is evaluated here.
 * @param {SkySourceAuditInput} input @param {readonly SkySourceReconstructionColumn[]} columns
 * @returns {{rows:SkySourceReconstructionRow[],groups:SkySourceReconstructionGroup[]}}
 */
export function evaluateSourceReconstruction(input, columns) {
	const spec = input.buildRequest.transportSpec;
	/** @type {SkySourceReconstructionRow[]} */ const rows = [];
	/** @type {SkySourceReconstructionCount[]} */ const counts = ['s80', 's160', 'reference'];
	/** @type {SkySourceReconstructionMode[]} */ const modes = ['raw', 'split', 'factored'];
	/** @type {SkySourceReconstructionPrecision[]} */ const precisions = ['binary64', 'float32'];
	for (const channel of [0, 8]) {
		/** @type {Map<string,SkySourceReconstructionFields>} */ const fields = new Map();
		for (const count of counts)
			for (const precision of precisions)
				fields.set(
					count + ':' + precision,
					sourceReconstructionFields(input, columns, channel, count, precision),
				);
		for (const ray of input.rays) {
			let viewTransmission = 1;
			for (const sample of input.samples.filter((row) => row.probeId === ray.probeId)) {
				const column = columns.find(
					(row) => row.coordinate.id === sample.coordinateId && row.channel === channel,
				);
				assert.ok(column);
				const beta = medium(spec, channel, column.coordinate.altitudeMeters),
					phases = phase(spec, ray.ray.direction[2]);
				const factor =
					spec.domains.spectrum.channels[channel].sourceIrradianceDensityWattsPerSquareMeterPerNanometer *
					(beta[1] * phases[0] + beta[2] * phases[1]);
				const direct = {
					s80: storedProduct(column.s80, factor, 'binary64'),
					s160: storedProduct(column.s160, factor, 'binary64'),
					reference: storedProduct(column.reference, factor, 'binary64'),
				};
				/** @type {Record<string,SkySourceReconstructionValue>} */ const reconstructed = {};
				for (const count of counts)
					for (const precision of precisions)
						for (const mode of modes) {
							const field = fields.get(count + ':' + precision);
							assert.ok(field);
							reconstructed[count + ':' + precision + ':' + mode] = reconstructSourceDensity(
								field,
								sample.stencil,
								mode,
								beta,
							);
						}
				const base = reconstructed['s80:float32:raw'],
					fine = reconstructed['s160:float32:raw'],
					ref = reconstructed['reference:float32:raw'];
				const terms = {
					source: reconstructionDifference(base, ref),
					reconstruction: reconstructionDifference(ref, direct.reference),
					total80: reconstructionDifference(base, direct.reference),
					total160: reconstructionDifference(fine, direct.reference),
					response: reconstructionDifference(fine, base),
					split: reconstructionDifference(reconstructed['reference:float32:split'], direct.reference),
					factored: reconstructionDifference(reconstructed['reference:float32:factored'], direct.reference),
					directSource80: reconstructionDifference(direct.s80, direct.reference),
					directSource160: reconstructionDifference(direct.s160, direct.reference),
					storageRaw: reconstructionDifference(ref, reconstructed['reference:binary64:raw']),
					storageSplit: reconstructionDifference(
						reconstructed['reference:float32:split'],
						reconstructed['reference:binary64:split'],
					),
					storageFactored: reconstructionDifference(
						reconstructed['reference:float32:factored'],
						reconstructed['reference:binary64:factored'],
					),
				};
				const identityResidual = terms.total80.value - terms.source.value - terms.reconstruction.value;
				assert.ok(
					Math.abs(identityResidual) <=
						64 *
							Number.EPSILON *
							(Math.abs(base.value) + Math.abs(ref.value) + Math.abs(direct.reference.value)),
				);
				const halfStep = Math.exp(-0.5 * beta[0] * sample.stencil.step);
				viewTransmission *= halfStep;
				const weightMeters = viewTransmission * sample.stencil.step;
				viewTransmission *= halfStep;
				assert.ok(weightMeters > 0);
				rows.push({
					probeId: ray.probeId,
					channel,
					sampleIndex: sample.sampleIndex,
					altitudeMeters: column.coordinate.altitudeMeters,
					weightMeters,
					direct,
					reconstructed,
					terms,
					identityResidual,
				});
			}
		}
	}
	assert.equal(rows.length, 64);
	return {rows, groups: groupSourceReconstruction(rows)};
}
