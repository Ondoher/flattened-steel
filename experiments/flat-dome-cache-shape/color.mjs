import {readFileSync} from 'node:fs';
import path from 'node:path';
import {checked, repository} from './io.mjs';
import {medium} from './physical.mjs';

const cie = readFileSync(checked(path.join(repository, 'references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv')), 'utf8').trim().split(/\r?\n/).map((line) => line.split(',').map(Number));
const weights = medium.wavelengths.map((center, channel) => {
	const lower = center - medium.widths[channel] / 2;
	const upper = center + medium.widths[channel] / 2;
	const sum = [0, 0, 0];
	for (let i = 0; i < cie.length - 1; i++) {
		const a = Math.max(lower, cie[i][0]);
		const b = Math.min(upper, cie[i + 1][0]);
		if (b <= a) {
			continue;
		}
		for (let k = 0; k < 3; k++) {
			const ya = cie[i][k + 1] + (cie[i + 1][k + 1] - cie[i][k + 1]) * (a - cie[i][0]);
			const yb = cie[i][k + 1] + (cie[i + 1][k + 1] - cie[i][k + 1]) * (b - cie[i][0]);
			sum[k] += (b - a) * (ya + yb) / 2;
		}
	}
	return sum;
});

/**
 * Converts physical Native15 bin radiance using one shared CIE and display policy.
 *
 * @param {number[]} spectrum - W m^-2 sr^-1 nm^-1, piecewise constant over declared bins.
 * @param {number} [exposure] - Common display exposure.
 * @returns {DomeColor} - Physical XYZ/luminance and explicit displayed RGB/Lab.
 */
export function color(spectrum, exposure = 0.06) {
	const xyz = [0, 1, 2].map((k) => spectrum.reduce((sum, value, channel) => sum + value * weights[channel][k], 0));
	const [x, y, z] = xyz;
	const linear = [3.2404542 * x - 1.5371385 * y - 0.4985314 * z, -0.969266 * x + 1.8760108 * y + 0.041556 * z, 0.0556434 * x - 0.2040259 * y + 1.0572252 * z].map((v) => v * exposure);
	const rgb = linear.map((v) => Math.round(255 * (v <= 0.0031308 ? 12.92 * Math.max(0, v) : 1.055 * Math.min(1, Math.max(0, v)) ** (1 / 2.4) - 0.055)));
	const f = (v) => v > (6 / 29) ** 3 ? Math.cbrt(v) : v * (29 / 6) ** 2 / 3 + 4 / 29;
	const lab = [116 * f(y * exposure) - 16, 500 * (f(x * exposure / 0.95047) - f(y * exposure)), 200 * (f(y * exposure) - f(z * exposure / 1.08883))];
	return {xyz, luminance: 683 * y, linear, rgb, lab, clipped: linear.some((v) => v < 0 || v > 1)};
}

/**
 * Reports radiometric and display-color differences without fitting either method.
 *
 * @param {number[]} candidate - Physical cache spectrum.
 * @param {number[]} reference - Physical guide spectrum.
 * @returns {Record<string, number>} - Explicit radiometric and CIE76 differences.
 */
export function errors(candidate, reference) {
	const a = color(candidate);
	const b = color(reference);
	const total = reference.reduce((sum, value, c) => sum + Math.abs(value) * medium.widths[c], 0);
	const absolute = candidate.reduce((sum, value, c) => sum + Math.abs(value - reference[c]) * medium.widths[c], 0);
	return {integratedAbsolute: absolute, relativeSpectral: total > 0 ? absolute / total : absolute === 0 ? 0 : Infinity,
		luminanceRelative: b.luminance > 0 ? Math.abs(a.luminance - b.luminance) / b.luminance : a.luminance === 0 ? 0 : Infinity,
		deltaE76: Math.hypot(...a.lab.map((v, i) => v - b.lab[i]))};
}
