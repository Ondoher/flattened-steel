import assert from 'node:assert/strict';
import {aerosolPhase} from './aerosol-optics.mjs';

/** Positive Gauss-Legendre rule on [0,1], derived from the experiment's existing
 * direct-solver/math.mjs algorithm, without importing its unrelated recursive solver.
 * @param {number} count @returns {HorizonGaussRule} Physical column nodes and weights.
 */
export function gaussRule(count) {
    assert.ok(Number.isInteger(count) && count >= 2 && count <= 256);
    const nodes = [], weights = [];
    for (let index = 0; index < count; index++) {
        let z = Math.cos(Math.PI * (index + 0.75) / (count + 0.5)), derivative = 0;
        for (let iteration = 0; iteration < 40; iteration++) {
            let polynomial = 1, previous = 0;
            for (let order = 1; order <= count; order++) {
                const old = polynomial;
                polynomial = ((2 * order - 1) * z * polynomial - (order - 1) * previous) / order;
                previous = old;
            }
            derivative = count * (z * polynomial - previous) / (z * z - 1);
            const next = z - polynomial / derivative;
            if (Math.abs(next - z) < 2e-15) {z = next; break;}
            z = next;
        }
        nodes.push((1 + z) / 2);
        weights.push(1 / ((1 - z * z) * derivative * derivative));
    }
    return {nodes, weights};
}

const rules = new Map([64, 128].map(count => [count, gaussRule(count)]));
for (const rule of rules.values()) assert.ok(Math.abs(rule.weights.reduce((a, b) => a + b, 0) - 1) < 1e-12);

/** Dot product of physical Cartesian components. @param {number[]} a @param {number[]} b @returns {number} */
const dot = (a, b) => a.reduce((sum, value, axis) => sum + value * b[axis], 0);

/** Cornette-Shanks Mie phase for the physical scattering cosine and asymmetry.
 * @param {number} cosine @param {number} g @returns {number} Phase in sr^-1.
 */
export function miePhase(cosine, g) {
    return 3 * (1 - g * g) * (1 + cosine * cosine) / (8 * Math.PI * (2 + g * g) * (1 + g * g - 2 * g * cosine) ** 1.5);
}

/** Analytic exponential column for a flat, upward segment; stable near horizontal.
 * @param {number} altitude @param {number} cosine @param {number} length @param {number} height @returns {number}
 */
function flatColumn(altitude, cosine, length, height) {
    const x = length * cosine / height;
    return Math.exp(-altitude / height) * length * (Math.abs(x) < 1e-9 ? 1 - x / 2 + x * x / 6 : -Math.expm1(-x) / x);
}

/** Upper atmosphere intersection for the declared physical geometry.
 * @param {HorizonTransportInput} input @param {number[]} position @param {number[]} direction @returns {number}
 */
export function atmosphereExit(input, position, direction) {
    if (input.geometry === 'flat') return (input.topAltitude - position[2]) / direction[2];
    const radius = Math.hypot(...position), b = dot(position, direction);
    const c = (radius - input.radius - input.topAltitude) * (radius + input.radius + input.topAltitude);
    return -c / (b + Math.sqrt(b * b - c));
}

/** Independent two-species geometric column, without cache or production attenuation.
 * @param {HorizonTransportInput} input @param {number[]} position @param {number[]} direction
 * @param {number} length @param {number} count @returns {number[]} Rayleigh/Mie density columns, meters.
 */
function columns(input, position, direction, length, count) {
    if (input.geometry === 'flat') return [flatColumn(position[2], direction[2], length, input.rayleighHeight), flatColumn(position[2], direction[2], length, input.mieHeight)];
    const rule = rules.get(count), result = [0, 0];
    for (let node = 0; node < count; node++) {
        const t = rule.nodes[node] * length;
        const altitude = Math.hypot(...position.map((value, axis) => value + direction[axis] * t)) - input.radius;
        assert.ok(altitude > -0.01);
        result[0] += rule.weights[node] * Math.exp(-altitude / input.rayleighHeight) * length;
        result[1] += rule.weights[node] * Math.exp(-altitude / input.mieHeight) * length;
    }
    return result;
}

/** Continuous N1 equation with physical exponential medium, native density spectra
 * and explicit finite/parallel illumination. Spherical columns use independent
 * Gauss rules; flat columns are analytic. Simpson strata partition the same sum.
 * @param {HorizonTransportInput} input @param {number} intervals @param {number} [columnCount]
 * @param {boolean} [trace] @returns {HorizonTransportReading} Completed spectral and path attribution.
 */
export function transport(input, intervals, columnCount = 64, trace = false) {
    assert.ok(intervals > 0 && intervals % 2 === 0 && rules.has(columnCount));
    assert.ok(input.sourceKind !== 'finite' || input.geometry === 'flat');
    const origin = [0, 0, input.geometry === 'flat' ? 5 : input.radius + 5];
    const length = input.length ?? atmosphereExit(input, origin, input.direction);
    assert.ok(length > 0 && Number.isFinite(length));
    const edges = [0, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000, length].filter((value, index, all) => value <= length && all.indexOf(value) === index).sort((a, b) => a - b);
    const strata = edges.slice(0, -1).map((value, index) => ({lowMeters: value, highMeters: edges[index + 1], rayleigh: Array(15).fill(0), mie: Array(15).fill(0)}));
    const rayleigh = Array(15).fill(0), mie = Array(15).fill(0), samples = [];
    for (let index = 0; index <= intervals; index++) {
        const distance = length * index / intervals;
        const position = origin.map((value, axis) => value + distance * input.direction[axis]);
        const altitude = input.geometry === 'flat' ? position[2] : Math.hypot(...position) - input.radius;
        const toSource = input.sourceKind === 'finite' ? input.sourcePosition.map((value, axis) => value - position[axis]) : input.sourceDirection;
        const sourceDistance = Math.hypot(...toSource), sourceDirection = toSource.map(value => value / sourceDistance);
        const sourceLength = atmosphereExit(input, position, sourceDirection);
        assert.ok(sourceLength >= -0.01);
        const sourceColumns = columns(input, position, sourceDirection, Math.max(0, sourceLength), columnCount);
        const viewColumns = columns(input, origin, input.direction, distance, columnCount);
        const cosine = dot(input.direction, sourceDirection), g = input.g;
        const phaseRayleigh = 3 * (1 + cosine * cosine) / (16 * Math.PI);
        const phaseMie = miePhase(cosine, g);
        const dilution = input.sourceKind === 'finite' ? (input.referenceDistance / sourceDistance) ** 2 : input.incidentScale;
        const densityRayleigh = Math.exp(-altitude / input.rayleighHeight), densityMie = Math.exp(-altitude / input.mieHeight);
        const weight = (index === 0 || index === intervals ? 1 : index % 2 ? 4 : 2) * length / (3 * intervals);
        const segment = strata.find(item => distance >= item.lowMeters && distance < item.highMeters) ?? strata.at(-1);
        const sourceTau = [], viewTau = [];
        for (let channel = 0; channel < 15; channel++) {
            sourceTau[channel] = input.rayleigh[channel] * sourceColumns[0] + input.mie[channel] * sourceColumns[1];
            viewTau[channel] = input.rayleigh[channel] * viewColumns[0] + input.mie[channel] * viewColumns[1];
            const common = weight * input.sourceIrradiance[channel] * dilution * Math.exp(-sourceTau[channel] - viewTau[channel]);
            const r = common * input.rayleigh[channel] * densityRayleigh * phaseRayleigh;
            const materialTable = input.aerosolPhaseTables?.[channel];
            const channelPhase = materialTable ? aerosolPhase(materialTable, cosine) : phaseMie;
            const channelAlbedo = input.aerosolAlbedos?.[channel] ?? input.albedo;
            const m = common * channelAlbedo * input.mie[channel] * densityMie * channelPhase;
            rayleigh[channel] += r; mie[channel] += m;
            segment.rayleigh[channel] += r; segment.mie[channel] += m;
        }
        if (trace && index % (intervals / 16) === 0) samples.push({distanceMeters: distance, altitudeMeters: altitude, sourceColumns, viewColumns,
            sourceTau, viewTau, sourceTransmittance: sourceTau.map(value => Math.exp(-value)), viewTransmittance: viewTau.map(value => Math.exp(-value)),
            cosine, phaseRayleigh, phaseMie, dilution, densityRayleigh, densityMie});
    }
    const spectrum = rayleigh.map((value, channel) => value + mie[channel]);
    const maximumAdditiveRelative = Math.max(...spectrum.map((value, channel) => Math.abs(strata.reduce((sum, segment) => sum + segment.rayleigh[channel] + segment.mie[channel], 0) - value) / Math.max(1e-12, value)));
    assert.ok(maximumAdditiveRelative < 1e-12);
    return {length, spectrum, rayleigh, mie, strata, samples, maximumAdditiveRelative};
}
