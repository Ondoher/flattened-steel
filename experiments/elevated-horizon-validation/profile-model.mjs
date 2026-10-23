import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checked, identity} from './io.mjs';
import {readCdf, writeCdf} from './profile-cdf.mjs';
import {physical, ray} from './physics.mjs';

export const acquisition = 'tmp/experiments/elevated-horizon-validation/runs/00023-profile-acquire';
const libraryRoot = acquisition + '/data/optprop_v2/data/aerosol/OPAC/optprop/';
const recipeRoot = 'references/downloads/libradtran-2.0.1/libRadtran-2.0.1/data/aerosol/OPAC/standard_aerosol_files/';
export const profileNames = ['continental_clean', 'maritime_tropical', 'maritime_clean'];
const cache = new Map();

/** Lossless scalar/one-humidity slice of published Mie tables; no fitted phase lobe. */
export function optical(species, humidity = 50) {
	const key = species + humidity;
	if (cache.has(key)) return cache.get(key);
	const parent = identity(libraryRoot + species + '.mie.cdf');
	const original = readCdf(readFileSync(checked(parent.path)));
	const nlam = original.dimensions.find((d) => d.name === 'nlam').count;
	const nhum = original.dimensions.find((d) => d.name === 'nhum').count;
	const humidities = Array.from({length: nhum}, (_, i) => original.value('hum', i));
	const h = nhum === 1 ? 0 : humidities.indexOf(humidity);
	assert.ok(h >= 0, 'Published humidity class missing');
	const wavelengths = Array.from({length: nlam}, (_, i) => original.value('wavelen', i));
	const counts = wavelengths.map((_, i) => original.value('ntheta', i, h, 0));
	const maximum = Math.max(...counts), theta = [], phase = [], mass = [];
	for (let i = 0; i < nlam; i++) {
		let total = 0;
		for (let j = 0; j < maximum; j++) {
			const t = j < counts[i] ? original.value('theta', i, h, 0, j) : 0;
			const p = j < counts[i] ? original.value('phase', i, h, 0, j) : 0;
			theta.push(t); phase.push(p);
			if (j > 0 && j < counts[i]) total += (Math.cos(t * Math.PI / 180) - Math.cos(theta.at(-2) * Math.PI / 180)) * (p + phase.at(-2)) / 2;
		}
		mass.push(total / 2);
		assert.ok(Math.abs(theta[i * maximum] - 180) < 1e-4 && theta[i * maximum + counts[i] - 1] === 0);
	}
	const ext = wavelengths.map((_, i) => original.value('ext', i, h));
	const ssa = wavelengths.map((_, i) => original.value('ssa', i, h));
	const variables = [
		{name: 'wavelen', dims: ['nlam'], type: 6, values: wavelengths},
		{name: 'hum', dims: ['nhum'], type: 6, values: [0]},
		{name: 'ext', dims: ['nlam', 'nhum'], type: 6, values: ext},
		{name: 'ssa', dims: ['nlam', 'nhum'], type: 6, values: ssa},
		{name: 'nmom', dims: ['nlam', 'nhum'], type: 4, values: Array(nlam).fill(0)},
		{name: 'ntheta', dims: ['nlam', 'nhum', 'nphamat'], type: 4, values: counts},
		{name: 'theta', dims: ['nlam', 'nhum', 'nphamat', 'nthetamax'], type: 5, values: theta},
		{name: 'phase', dims: ['nlam', 'nhum', 'nphamat', 'nthetamax'], type: 5, values: phase},
	];
	const bytes = writeCdf({nlam, nhum: 1, nphamat: 1, nmommax: 1, nthetamax: maximum}, variables);
	const decoded = readCdf(bytes);
	for (let i = 0; i < nlam; i++) {
		assert.equal(decoded.value('ext', i, 0), ext[i]); assert.equal(decoded.value('ssa', i, 0), ssa[i]);
		for (let j = 0; j < counts[i]; j++) {
			assert.equal(decoded.value('theta', i, 0, 0, j), original.value('theta', i, h, 0, j));
			assert.equal(decoded.value('phase', i, 0, 0, j), original.value('phase', i, h, 0, j));
		}
	}
	const result = {bytes, wavelengths, ext, ssa, proof: {species, parent, selectedHumidity: nhum === 1 ? humidities[0] : humidity,
		operation: 'Exact scalar F11 and humidity slice; all published wavelengths/angular nodes preserved, nmom=0 selects direct phase. Synthetic singleton humidity axis=0 is an addressing convention; optical values are frozen at selected RH.',
		maximumPhaseMassError: Math.max(...mass.map((v) => Math.abs(v - 1))), mass, byteExactOpticalValues: true}};
	cache.set(key, result); return result;
}

/** Read the externally distributed libRadtran OPAC-derived mass/layer preset unchanged. */
export function recipe(name) {
	assert.ok(profileNames.includes(name));
	const parent = identity(recipeRoot + name + '.dat'), text = readFileSync(checked(parent.path), 'utf8');
	const species = text.split(/\r?\n/u).find((s) => /^# z\(km\)/u.test(s)).replace(/^# z\(km\)\s*/u, '').trim().split(/\s+/u);
	const rows = text.split(/\r?\n/u).filter((s) => s.trim() && !s.startsWith('#')).map((s) => s.trim().split(/\s+/u).map(Number));
	assert.ok(rows.every((r) => r.length === species.length + 1 && r.every(Number.isFinite)));
	return {name, species, rows, text, parent,
		semantics: 'Published libRadtran OPAC-derived preset, not exact original OPAC number-density profile. Density on each lower boundary is the constant layer density above it (aerosol.c:1982-1986). Masses correspond to OPAC at 50% RH.'};
}

/** Interpolate the published optical cross sections linearly in wavelength, as a declared export. */
export function atWavelength(table, wavelength) {
	const w = wavelength / 1000;
	let lo = 0; while (lo + 1 < table.wavelengths.length && table.wavelengths[lo + 1] < w) lo++;
	assert.ok(lo + 1 < table.wavelengths.length && table.wavelengths[lo] <= w + 1e-12);
	const u = (w - table.wavelengths[lo]) / (table.wavelengths[lo + 1] - table.wavelengths[lo]);
	return {ext: table.ext[lo] * (1 - u) + table.ext[lo + 1] * u,
		abs: table.ext[lo] * (1 - table.ssa[lo]) * (1 - u) + table.ext[lo + 1] * (1 - table.ssa[lo + 1]) * u};
}

/** Exact layer-column inventory plus independent spherical midpoint path integrals. */
export function inventory(name, humidity = 50) {
	const r = recipe(name), tables = r.species.map((s) => optical(s, humidity));
	const layers = r.rows.slice(1).map((row, i) => {
		const optics = tables.map((t) => atWavelength(t, 550));
		return {lower: row[0] * 1000, upper: r.rows[i][0] * 1000,
			ext: optics.reduce((sum, o, j) => sum + row[j + 1] * o.ext / 1000, 0),
			abs: optics.reduce((sum, o, j) => sum + row[j + 1] * o.abs / 1000, 0)};
	});
	const paths = [5, 10000].flatMap((altitude) => [-.1, .1].map((offset) => {
		const elevation = -Math.acos(6360000 / (6360000 + altitude)) * 180 / Math.PI + offset;
		const v = ray(elevation, altitude), tau = [16384, 32768].map((n) => {
			let sum = 0;
			for (let i = 0; i < n; i++) {
				const t = (i + .5) / n * v.length, h = Math.hypot(v.direction[1] * t, 6360000 + altitude + v.direction[2] * t) - 6360000;
				const layer = layers.find((x) => h >= x.lower && h < x.upper);
				sum += (layer?.ext ?? 0) * v.length / n;
			}
			return sum;
		});
		return {altitude, offset, elevation, ground: v.ground, distance: v.length, aerosolTau550: tau[1], integrationDifference: tau[1] - tau[0]};
	}));
	return {name, humidity, label: 'libRadtran OPAC-derived ' + name, recipe: r.parent, semantics: r.semantics,
		optics: tables.map((t) => t.proof), layers, aod550: layers.reduce((s, l) => s + (l.upper - l.lower) * l.ext, 0),
		absorptionAod550: layers.reduce((s, l) => s + (l.upper - l.lower) * l.abs, 0),
		surfaceExtinction550PerM: layers.at(-1).ext,
		above10kmAod550: layers.reduce((s, l) => s + Math.max(0, l.upper - Math.max(10000, l.lower)) * l.ext, 0), paths};
}

/** Baseline analytic aerosol AOD/path inventory from executable production coefficients. */
export function baselineInventory() {
	const m = physical(), w = .55;
	const aod550 = m.constants.mieAngstromBeta * w ** -m.constants.mieAngstromAlpha;
	return {name: 'bruneton', aod550, scaleHeight: m.mieHeight, ssa: m.albedo, g: m.g,
		above10kmAod550: aod550 * Math.exp(-10000 / m.mieHeight), surfaceExtinction550PerM: aod550 / m.mieHeight};
}
