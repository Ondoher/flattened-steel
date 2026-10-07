import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {identity, readRepository, resolveRepository} from '../../io/files.mjs';
import {observationDirections} from './observation-geometry.mjs';
import {observationShaders} from './observation-kernels.mjs';
import {remainingGpuAuthorization, validateRemainingGpu} from './authorization.mjs';
import {getSampleDirection} from '../../../../scripts/experiments/b1-directional-sky-radiance/benchmark-domain.js';

/** Audit selected raw spectra and commanded coordinates without changing the comparison.
 * @param {readonly SkyJ1AssessmentRow[]} references @returns {SkyObservationAudit}
 */
export function auditObservation(references) {
	const parserPath = 'scripts/experiments/b1-directional-sky-radiance/benchmark.js';
	const parents = [
		identity(parserPath),
		identity('scripts/experiments/b1-directional-sky-radiance/benchmark-domain.js'),
		identity('references/results/experiments/b1-directional-sky-radiance/result.md'),
		identity('references/downloads/kider-clear-sky-framework-2014/paper-author-version.extracted.txt'),
		identity('scripts/experiments/b1-directional-sky-radiance/inputs/KIDER-PROVENANCE.md'),
	];
	const match = readRepository(parserPath, parents[0])
		.toString()
		.match(/const COORDINATE_VALUES = Object.freeze\(\[([\s\S]*?)\]\);/);
	assert.ok(match);
	const coordinates = match[1]
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean)
		.map(Number);
	assert.equal(coordinates.length, 162);
	assert.equal(
		new Set(Array.from({length: 81}, (_, i) => `${coordinates[i * 2]}:${8 - coordinates[i * 2 + 1]}`)).size,
		81,
	);
	const root = 'references/downloads/kider-clear-sky-framework-2014/radiance-2013-05-27-bruneton-subset/extracted';
	/** @type {Map<string,readonly number[]>} */ const cache = new Map();
	/** @param {string} time @param {number} index @returns {readonly number[]} */
	function spectrum(time, index) {
		const key = time + ':' + index,
			existing = cache.get(key);
		if (existing) return existing;
		const folder = `${root}/2013-05-27___${time.replace(':', '.')}.00`;
		const files = readdirSync(resolveRepository(folder)).filter(
			(f) => f.includes(`_-_${index}____`) && f.endsWith('.asd.rad.txt'),
		);
		assert.equal(files.length, 1);
		const id = identity(folder + '/' + files[0]);
		parents.push(id);
		const name = files[0].match(
			/^2013-05-27___(\d{2})\.(\d{2})\.00_-_(\d+)____(-?\d+(?:\.\d+)?)___(-?\d+(?:\.\d+)?)\.asd\.rad\.txt$/,
		);
		assert.ok(name);
		assert.equal(name[1] + ':' + name[2], time);
		assert.equal(Number(name[3]), index);
		const commanded = getSampleDirection(coordinates[2 * index], coordinates[2 * index + 1]);
		assert.ok(Math.abs(Number(name[4]) - ((commanded.azimuthDegrees + 360) % 360)) <= 5e-4);
		assert.ok(Math.abs(Number(name[5]) - (90 - commanded.zenithDegrees)) <= 5e-4);
		const lines = readRepository(id.path, id).toString().trim().split(/\r?\n/);
		assert.equal(lines.length, 2152);
		assert.ok(lines[0].startsWith('Wavelength\t'));
		const values = lines.slice(1).map((line, i) => {
			const pair = line.trim().split(/\s+/).map(Number);
			assert.equal(pair[0], 350 + i);
			assert.ok(Number.isFinite(pair[1]));
			return pair[1];
		});
		cache.set(key, values);
		return values;
	}
	let maximumDifferenceW = 0,
		repairedScalars = 0,
		scalarChecks = 0;
	for (const ref of references.filter((r) => [0, 8, 24, 30].includes(r.channel))) {
		const index = Array.from({length: 81}, (_, i) => i).find(
			(i) => coordinates[2 * i] === ref.gridX && 8 - coordinates[2 * i + 1] === ref.gridY,
		);
		assert.ok(index !== undefined);
		const wavelength = 360 + (470 * ref.channel) / 40,
			lower = Math.floor(wavelength) - 350,
			fraction = wavelength - Math.floor(wavelength);
		/** @param {number} sample @returns {number} */
		const value = (sample) => {
			const values = spectrum(ref.time, sample);
			return values[lower] * (1 - fraction) + values[lower + 1] * fraction;
		};
		const measured = index === 0 ? (value(1) + value(31)) / 2 : value(index);
		if (index === 0) repairedScalars++;
		maximumDifferenceW = Math.max(maximumDifferenceW, Math.abs(measured - ref.measuredW));
		assert.ok(Math.abs(measured - ref.measuredW) < 1e-13, 'Raw selected spectrum and fixed measurement differ');
		scalarChecks++;
	}
	assert.equal(scalarChecks, 160);
	return {
		parents,
		scalarChecks,
		rawFiles: cache.size,
		repairedScalars,
		maximumDifferenceW,
		wavelengthsNm: [0, 8, 24, 30].map((c) => 360 + (470 * c) / 40),
		convention:
			'Canonical gridY=8-sourceY; index0 repaired from indices1/31; linear wavelength interpolation; unchanged W m^-2 sr^-1 nm^-1.',
		metadata:
			'Paper reports approximately 0.5 degree rotational error, approximately three-minute scans, and 1/8 degree foreoptics. Selected spectral headers do not identify actual optic or individual pointing time. Uniform cone responses are sensitivities, not measured instrument calibration.',
	};
}

/** Manufactured angular moments and scoped resource rejection checks; no atmospheric integration.
 * @returns {number}
 */
export function observationProof() {
	let checks = 0;
	/** @type {readonly SkyVector3[]} */ const directions = [
		[0.6, 0.8, 0],
		[0, 1, 0],
	];
	for (const direction of directions) {
		const rows = observationDirections([0, 1, 0], direction);
		for (const variant of new Set(rows.filter((r) => r.variant.startsWith('cone')).map((r) => r.variant))) {
			const selected = rows.filter((r) => r.variant === variant),
				angle = ((Number(variant.split('-')[1]) / 2) * Math.PI) / 180;
			assert.ok(Math.abs(selected.reduce((s, r) => s + r.weight, 0) - 1) < 1e-14);
			checks++;
			for (let i = 0; i < 3; i++) {
				assert.ok(
					Math.abs(
						selected.reduce((s, r) => s + r.weight * r.direction[i], 0) -
							(direction[i] * (1 + Math.cos(angle))) / 2,
					) < 1e-13,
				);
				checks++;
			}
		}
	}
	const zenith = observationDirections([0, 1, 0], [0, 1, 0]);
	for (const row of zenith.filter((r) => r.variant.startsWith('azimuth'))) {
		assert.deepEqual(row.direction, [0, 1, 0]);
		checks++;
	}
	assert.equal((observationShaders.rays.match(/\bfor\s*\(/g) ?? []).length, 1);
	assert.equal((observationShaders.rays.match(/\b(?:while|do)\b/g) ?? []).length, 0);
	checks += 2;
	const authorization = remainingGpuAuthorization(),
		parents = [authorization.through, authorization.plan];
	validateRemainingGpu(authorization, parents, 36, authorization.caseId, authorization.deadline);
	checks++;
	for (const prior of [35, 38]) {
		assert.throws(() =>
			validateRemainingGpu(authorization, parents, prior, authorization.caseId, authorization.deadline),
		);
		checks++;
	}
	assert.throws(() => validateRemainingGpu(authorization, [], 36, authorization.caseId, authorization.deadline));
	checks++;
	assert.throws(() => validateRemainingGpu(authorization, parents, 36, 'unrelated', authorization.deadline));
	checks++;
	assert.throws(() =>
		validateRemainingGpu(
			{...authorization, packageId: 'unrelated'},
			parents,
			36,
			authorization.caseId,
			authorization.deadline,
		),
	);
	checks++;
	return checks;
}
