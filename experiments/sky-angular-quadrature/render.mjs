import {readRepository} from './io/files.mjs';
import {ciePath, xyzToRgb} from '../sky-accuracy-dials/horizon/diagnosis-color.mjs';

const cmf = readRepository(ciePath)
	.toString()
	.trim()
	.split(/\r?\n/)
	.map((line) => line.split(',').map(Number));

/** Show scalar progress without implying that partial spectra have a known color.
 * @param {readonly AngularScalarRow[]} rows @param {string} title @param {string} [units] Explicit plotted quantity and units. @returns {string}
 */
export function scalarFigure(rows, title, units = 'Scalar radiance density, W m^-2 sr^-1 nm^-1') {
	const maximum = Math.max(1e-12, ...rows.flatMap((r) => [r.baseline ?? 0, r.candidate ?? 0])),
		height = 130 + rows.length * 35;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${height}"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#202c38"><text x="20" y="30" font-size="19">${title}</text><text x="20" y="55" font-size="13">${units}. Baseline: light bar; candidate: dark bar. Color pending for partial spectra.</text>${rows.map((r, i) => `<text x="20" y="${95 + i * 35}" font-size="12">${r.label}</text>${r.baseline === undefined ? '' : `<rect x="220" y="${80 + i * 35}" width="${(600 * r.baseline) / maximum}" height="8" fill="#aebdce"/>`}${r.candidate === undefined ? '' : `<rect x="220" y="${90 + i * 35}" width="${(600 * r.candidate) / maximum}" height="8" fill="#30475e"/>`}<text x="835" y="${95 + i * 35}" font-size="11">${r.baseline?.toPrecision(4) ?? 'pending'} / ${r.candidate?.toPrecision(4) ?? 'pending'}</text>`).join('')}</g></svg>`;
}

/** Project Direct40 point spectra by trapezoids, retaining their explicit support.
 * @param {readonly number[]} spectrum @param {readonly number[]} wavelengths @returns {number[]}
 */
export function paperXyz(spectrum, wavelengths) {
	if (spectrum.length !== 40 || wavelengths.length !== 40 || !spectrum.every(Number.isFinite))
		throw new RangeError('Complete Direct40 required for color.');
	const xyz = [0, 0, 0];
	for (let c = 0; c < 39; c++)
		for (let axis = 0; axis < 3; axis++) {
			const at = (k) => {
				const x = wavelengths[k],
					lo = Math.floor(x),
					t = x - lo;
				return (cmf[lo - 360][axis + 1] * (1 - t) + cmf[lo + 1 - 360][axis + 1] * t) * spectrum[k];
			};
			xyz[axis] += (at(c) + at(c + 1)) * 0.5 * (wavelengths[c + 1] - wavelengths[c]) * 683;
		}
	return xyz;
}

/** Display nine matched ray spectra with one fixed exposure across every row.
 * @param {readonly (readonly number[])[]} baseline @param {readonly (readonly number[])[]|null} candidate @param {readonly number[]} wavelengths @returns {string}
 */
export function horizonFigure(baseline, candidate, wavelengths) {
	const exposure = 0.25 / paperXyz(baseline[3], wavelengths)[1];
	const cell = (s, x, y, label) => {
		const xyz = paperXyz(s, wavelengths),
			rgb = xyzToRgb(xyz).map((v) => {
				const a = Math.max(0, v * exposure);
				return Math.round(255 * Math.min(1, a <= 0.0031308 ? 12.92 * a : 1.055 * a ** (1 / 2.4) - 0.055));
			});
		return `<rect x="${x}" y="${y}" width="245" height="45" fill="rgb(${rgb.join(',')})"/><text x="${x}" y="${y + 62}" font-size="12">${label}: Y=${xyz[1].toFixed(1)} cd/mÂ²</text>`;
	};
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1010"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#1b2633"><text x="20" y="28" font-size="19">Matched N4 horizon witnesses: baseline / angular candidate</text><text x="20" y="52" font-size="13">Paper atmosphere and grass; Sun zenith14Â°, observer5m. One exposure; sRGB OETF, D65, no adaptation.</text><text x="20" y="74" font-size="13">Direct40 point spectra 360â€“818.25nm, trapezoid projection. Independent matched N4 reference pending.</text>${baseline
		.map((s, i) => {
			const y = 105 + i * 96;
			return `<text x="20" y="${y + 20}" font-size="13">${[0.05, 3, 20][Math.floor(i / 3)]}Â° elevation / ${[0, 90, 180][i % 3]}Â° heading</text>${cell(s, 330, y, 'F68')}${candidate ? cell(candidate[i], 620, y, 'horizon2048') : `<text x="620" y="${y + 20}" font-size="13">Candidate spectrum pending</text>`}`;
		})
		.join('')}</g></svg>`;
}
