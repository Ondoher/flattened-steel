import assert from 'node:assert/strict';
import {identity, readRepository, verifyRun, listFiles} from './io/files.mjs';
import {verifyRun as verifyParent} from '../sky-accuracy-dials/io/files.mjs';
import {colorimetry} from '../sky-accuracy-dials/horizon/diagnosis-color.mjs';

/** Read an authenticated artifact from an immutable parent run.
 * @param {string} run @param {string} file @param {AngularFileIdentity[]} parents @param {boolean} [allowFailed] Preserve an explicitly selected failed producer's provenance. @returns {unknown}
 */
export function parent(run, file, parents, allowFailed = false) {
	const root = `tmp/experiments/sky-accuracy-dials/runs/${run}`;
	const sealIdentity = verifyParent(root),
		seal = JSON.parse(readRepository(sealIdentity.path).toString());
	assert.ok(seal.state === 'accepted' || (allowFailed && seal.state === 'failed'));
	const record = seal.artifacts.find((a) => a.path === `${root}/${file}`);
	assert.ok(record, 'Parent does not inventory this artifact.');
	const bytes = readRepository(record.path, record);
	parents.push(sealIdentity, identity(record.path, bytes));
	return JSON.parse(bytes.toString());
}

/** Read this lane's immutable input without altering it.
 * @param {string} root @param {string} file @param {AngularFileIdentity[]} parents @returns {unknown}
 */
export function own(root, file, parents) {
	const seal = verifyRun(root),
		bytes = readRepository(`${root}/${file}`);
	parents.push(seal, identity(`${root}/${file}`, bytes));
	return JSON.parse(bytes.toString());
}

/** Pin all authored numerical dependencies used by the bounded phase/source screen.
 * @param {AngularFileIdentity[]} parents @returns {void}
 */
export function pin(parents) {
	for (const prefix of [
		'experiments/sky-accuracy-dials/horizon-audit',
		'experiments/sky-accuracy-dials/horizon-migration',
		'experiments/sky-accuracy-dials/horizon',
		'experiments/sky-accuracy-dials/numerics',
	])
		for (const file of listFiles(prefix)) if (/\.(?:mjs|js|ts)$/.test(file)) parents.push(identity(file));
	parents.push(identity('references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv'));
}

/** Encode a source-density swatch at a registered common display normalization.
 * @param {readonly number[]} spectrum @param {number} scale @returns {string}
 */
export function swatch(spectrum, scale) {
	const rgb = colorimetry(Array.from(spectrum), 'bin-integrated').rgb;
	return `rgb(${rgb
		.map((v) => {
			const x = Math.max(0, v * scale);
			return Math.round(255 * Math.min(1, x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055));
		})
		.join(',')})`;
}

/** Render measured source spectra, preserving relative magnitudes within each row.
 * @param {readonly AngularSwatchRow[]} rows @param {string} caption @returns {string}
 */
export function sheet(rows, caption) {
	const y0 = 110,
		dy = 105;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${y0 + rows.length * dy + 55}"><rect width="100%" height="100%" fill="#fff"/><g font-family="sans-serif" fill="#18202a"><text x="25" y="30" font-size="19">${caption}</text><text x="25" y="55" font-size="13">P2 source density, not rendered sky. Common per-row normalization; sRGB OETF, D65, no adaptation.</text><text x="25" y="77" font-size="13">Magnitude: integrated CIE Y of source (cd m^-3); Native15. Raw spectra and provenance: spectra.json / sealed.json.</text>${rows
		.map((r, i) => {
			const baseY = colorimetry(Array.from(r.spectra[0]), 'bin-integrated').luminanceCdPerM2,
				scale = 0.25 / baseY;
			return `<text x="25" y="${y0 + i * dy + 18}" font-size="13">${r.label}</text>${r.spectra.map((s, k) => `<rect x="${220 + k * 235}" y="${y0 + i * dy}" width="215" height="55" fill="${swatch(s, scale)}"/><text x="${220 + k * 235}" y="${y0 + i * dy + 74}" font-size="12">${r.names[k]} · Y=${colorimetry(Array.from(s), 'bin-integrated').luminanceCdPerM2.toPrecision(5)}</text>`).join('')}`;
		})
		.join(
			'',
		)}<text x="25" y="${y0 + rows.length * dy + 25}" font-size="13">Matched geometry/material/order within each row. Source magnitude differences retained; no color-based acceptance.</text></g></svg>`;
}
