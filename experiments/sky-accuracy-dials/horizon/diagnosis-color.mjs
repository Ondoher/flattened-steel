import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readRepository} from '../io/files.mjs';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/index.js';

/** Original publisher data, not the production embedded table or projection builder. */
export const ciePath = 'references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv';
const bytes = readRepository(ciePath);
assert.equal(createHash('md5').update(bytes).digest('hex'), '17cca777db64b17170f06f67ce9d3ab7');
const rows = bytes.toString('utf8').trim().split(/\r?\n/).map(line => line.split(',').map(Number));
assert.equal(rows.length, 471);
rows.forEach((row, index) => {assert.equal(row[0], 360 + index); assert.ok(row.every(Number.isFinite));});

/** W3C CSS Color 4 sample conversion, D65, no adaptation. Retrieved 2026-10-14.
 * https://www.w3.org/TR/2026/CRD-css-color-4-20261009/#color-conversion-code
 */
const preciseMatrix = [[12831 / 3959, -329 / 214, -1974 / 3959],
    [-851781 / 878810, 1648619 / 878810, 36519 / 878810], [705 / 12673, -2585 / 12673, 705 / 667]];
// Independently stated four-decimal convention, used only to isolate matrix rounding.
const roundedMatrix = [[3.2406, -1.5372, -0.4986], [-0.9689, 1.8758, 0.0415], [0.0557, -0.204, 1.057]];

/** Interpolate the original CIE row table at a physical wavelength.
 * @param {number} wavelength @returns {number[]} x-bar/y-bar/z-bar.
 */
function matching(wavelength) {
    assert.ok(wavelength >= 360 && wavelength <= 830);
    const lower = Math.floor(wavelength), upper = Math.ceil(wavelength), t = wavelength - lower;
    return [1, 2, 3].map(axis => rows[lower - 360][axis] * (1 - t) + rows[upper - 360][axis] * t);
}

/** Integrate piecewise-linear original CIE functions exactly across a bin.
 * @param {number} low @param {number} high @returns {number[]} Integrated matching functions, nm.
 */
function matchingIntegral(low, high) {
    const sum = [0, 0, 0];
    let position = low;
    while (position < high) {
        const end = Math.min(high, Math.floor(position + 1e-9) + 1);
        const a = matching(position), b = matching(end);
        sum.forEach((_, axis) => {sum[axis] += (a[axis] + b[axis]) * 0.5 * (end - position);});
        position = end;
    }
    return sum;
}

/** Independently convert CIE XYZ to signed linear sRGB; never clip.
 * @param {number[]} xyz @param {boolean} [precise] @returns {number[]}
 */
export function xyzToRgb(xyz, precise = true) {
    return (precise ? preciseMatrix : roundedMatrix).map(row => row.reduce((sum, coefficient, axis) => sum + coefficient * xyz[axis], 0));
}

/** Convert fifteen spectral-density samples independently of production RGB weights.
 * @param {number[]} spectrum @param {HorizonCmfRule} [rule] @param {boolean} [precise]
 * @returns {HorizonColorReading} Signed color and physical luminance.
 */
export function colorimetry(spectrum, rule = 'midpoint', precise = true) {
    assert.equal(spectrum.length, 15);
    assert.ok(spectrum.every(Number.isFinite));
    const xyz = [0, 0, 0];
    NATIVE_15_SPECTRAL_BASIS.channels.forEach((channel, index) => {
        const center = channel.center.value, width = channel.width.value;
        const weights = rule === 'midpoint' ? matching(center).map(value => value * width) : matchingIntegral(center - width / 2, center + width / 2);
        xyz.forEach((_, axis) => {xyz[axis] += 683 * spectrum[index] * weights[axis];});
    });
    const total = xyz.reduce((a, b) => a + b, 0), rgb = xyzToRgb(xyz, precise);
    return {xyz, xy: total === 0 ? null : [xyz[0] / total, xyz[1] / total], luminanceCdPerM2: xyz[1], rgb,
        negativeChannels: rgb.map((value, index) => value < 0 ? index : -1).filter(index => index >= 0),
        redBlueRatio: rgb[2] === 0 ? null : rgb[0] / rgb[2]};
}

/** Focused positive controls of the independent quadrature and XYZ matrix.
 * @returns {HorizonColorControls} Checked white, constant-spectrum and basis linearity facts.
 */
export function colorControls() {
    const white = xyzToRgb([0.3127 / 0.3290, 1, (1 - 0.3127 - 0.3290) / 0.3290]);
    assert.ok(white.every(value => Math.abs(value - 1) < 1e-12));
    const equalEnergy = colorimetry(Array(15).fill(1), 'bin-integrated');
    assert.ok(equalEnergy.xy.every(value => Math.abs(value - 1 / 3) < 0.0002));
    const sum = [0, 0, 0];
    for (let index = 0; index < 15; index++) {
        const impulse = Array(15).fill(0); impulse[index] = 1;
        colorimetry(impulse, 'bin-integrated').xyz.forEach((value, axis) => {sum[axis] += value;});
    }
    const maximumLinearityRelative = Math.max(...sum.map((value, axis) => Math.abs(value - equalEnergy.xyz[axis]) / equalEnergy.xyz[axis]));
    assert.ok(maximumLinearityRelative < 1e-12);
    assert.deepEqual(colorimetry(Array(15).fill(0)).rgb, [0, 0, 0]);
    return {white, equalEnergy, maximumLinearityRelative, cieMd5: '17cca777db64b17170f06f67ce9d3ab7'};
}
