import assert from 'node:assert/strict';
import {readRepository} from '../io/files.mjs';
import {ciePath, xyzToRgb} from '../horizon/diagnosis-color.mjs';
import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';
const table = readRepository(ciePath)
	.toString()
	.trim()
	.split(/\r?\n/)
	.map((r) => r.split(',').map(Number));
const display = new ColorResetSlope078P2ColorDisplayModel();
/** Direct40 midpoint CIE integration, identical for all methods; no Native15 projection.
 * @param {readonly number[]} spectrum @param {readonly number[]} centers
 * @returns {{xyz:number[],rgb:number[],Y:number,RB:number}}
 */
export function color(spectrum, centers) {
	assert.equal(spectrum.length, 40);
	assert.equal(centers.length, 40);
	const xyz = [0, 0, 0];
	centers.forEach((w, i) => {
		const l = Math.floor(w) - 360,
			h = Math.ceil(w) - 360,
			t = w - Math.floor(w);
		for (let k = 0; k < 3; k++)
			xyz[k] += 683 * 11.75 * spectrum[i] * (table[l][k + 1] * (1 - t) + table[h][k + 1] * t);
	});
	const rgb = xyzToRgb(xyz);
	return {xyz, rgb, Y: xyz[1], RB: rgb[0] / rgb[2]};
}
/** Common production p2 mapping under fixed paper source illumination.
 * @param {readonly number[]} spectrum @param {readonly number[]} centers @param {number} lux @returns {number[]}
 */
export function rgb(spectrum, centers, lux) {
	return display
		.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */ (color(spectrum, centers).rgb), {
			value: lux,
			units: 'lux',
		})
		.map((v) => Math.round(255 * v));
}
