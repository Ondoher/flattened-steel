import assert from 'node:assert/strict';
import {readRepository, identity, verifyRun} from '../../io/files.mjs';
import {monteCarloFragment} from '../direct-solver/monte-carlo.mjs';

/** Piecewise-linear probability density in scattering cosine, integral one.
 * @typedef {{mu:number[],pdf:number[],cdf:number[],originalIntegral:number,meanCosine:number}} AerosolTable
 */
/** @param {string} text @returns {Record<string,string>[]} */
function csv(text) {
	const lines = text.trim().split(/\r?\n/),
		at = lines.findIndex((l) => l.startsWith('AERONET_Site,'));
	assert.ok(at >= 0);
	const keys = lines[at].split(',');
	return lines
		.slice(at + 1)
		.filter(Boolean)
		.map((l) => {
			const values = l.split(',');
			assert.equal(values.length, keys.length);
			return Object.fromEntries(keys.map((k, i) => [k, values[i]]));
		});
}
/** @param {number[]} mu @param {number[]} values @returns {AerosolTable} */
export function table(mu, values) {
	assert.equal(mu.length, values.length);
	assert.ok(mu.length >= 2 && mu.length <= 128);
	assert.equal(mu[0], -1);
	assert.equal(mu.at(-1), 1);
	let mass = 0;
	for (let i = 1; i < mu.length; i++) {
		assert.ok(mu[i] > mu[i - 1]);
		mass += ((mu[i] - mu[i - 1]) * (values[i] + values[i - 1])) / 2;
	}
	assert.ok(values.every((x) => Number.isFinite(x) && x > 0) && Number.isFinite(mass) && mass > 0);
	const pdf = values.map((x) => x / mass),
		cdf = [0];
	let meanCosine = 0;
	for (let i = 1; i < mu.length; i++) {
		const a = mu[i - 1],
			d = mu[i] - a,
			f = pdf[i - 1],
			s = (pdf[i] - f) / d;
		cdf.push(cdf.at(-1) + (d * (f + pdf[i])) / 2);
		meanCosine += a * f * d + ((a * s + f) * d * d) / 2 + (s * d * d * d) / 3;
	}
	assert.ok(Math.abs(cdf.at(-1) - 1) < 1e-12);
	cdf[cdf.length - 1] = 1;
	return {mu: [...mu], pdf, cdf, originalIntegral: mass, meanCosine};
}
/** @param {AerosolTable} t @param {number} c */
export function phase(t, c) {
	const i = Math.min(
		t.mu.length - 2,
		Math.max(
			0,
			t.mu.findIndex((x, j) => j < t.mu.length - 1 && c <= t.mu[j + 1]),
		),
	);
	const u = Math.max(0, Math.min(1, (c - t.mu[i]) / (t.mu[i + 1] - t.mu[i])));
	return ((1 - u) * t.pdf[i] + u * t.pdf[i + 1]) / (2 * Math.PI);
}
/** @param {AerosolTable} t @param {number} u */
export function sample(t, u) {
	assert.ok(u >= 0 && u <= 1);
	const i = Math.min(
		t.mu.length - 2,
		t.cdf.findIndex((x, j) => j < t.mu.length - 1 && u <= t.cdf[j + 1]),
	);
	const d = t.mu[i + 1] - t.mu[i],
		f = t.pdf[i],
		s = (t.pdf[i + 1] - f) / d,
		q = Math.max(0, u - t.cdf[i]);
	return t.mu[i] + Math.min(d, (2 * q) / (f + Math.sqrt(Math.max(0, f * f + 2 * s * q))));
}
/** @param {number} c @param {number} g */
export function cs(c, g) {
	return (3 * (1 - g * g) * (1 + c * c)) / (8 * Math.PI * (2 + g * g) * (1 + g * g - 2 * g * c) ** 1.5);
}

/** Authenticated physical properties from a single coherent retrieval. */
export function optics() {
	const root = 'tmp/experiments/sky-accuracy-dials/runs/00234-aerosol-data',
		seal = verifyRun(root);
	const ids = ['ssa', 'phase', 'asymmetry', 'quality'].map((n) => identity(root + '/' + n + '.txt'));
	const selected = ids.map((id) => {
		const rows = csv(readRepository(id.path, id).toString());
		const matches = rows.filter((r) => r['Time(hh:mm:ss)'] === '13:19:01');
		assert.equal(matches.length, 1);
		return matches[0];
	});
	const [ssa, pfn, asy, quality] = selected;
	for (const r of selected) {
		assert.equal(r.AERONET_Site, 'Toronto');
		assert.equal(r['Date(dd:mm:yyyy)'], '27:05:2013');
		assert.equal(r.Instrument_Number, '614');
		assert.equal(r['If_Retrieval_is_L2(without_L2_0.4_AOD_440_threshold)'], '1');
	}
	assert.equal(pfn.Phase_Function_Mode, 'Total');
	assert.equal(ssa.Inversion_Data_Quality_Level, 'lev15');
	const wavelengths = [440, 675, 870, 1020],
		bands = wavelengths.map((w) => {
			const entries = Object.entries(pfn).filter(([k]) => new RegExp('^\\d+\\.\\d+\\[' + w + 'nm\\]$').test(k));
			assert.equal(entries.length, 83);
			const t = table(
				entries.map(([k]) => Math.cos((Number(k.split('[')[0]) * Math.PI) / 180)),
				entries.map(([, v]) => Number(v)),
			);
			const albedo = Number(ssa['Single_Scattering_Albedo[' + w + 'nm]']),
				reportedMean = Number(asy['Asymmetry_Factor-Total[' + w + 'nm]']);
			assert.ok(albedo > 0 && albedo <= 1);
			assert.equal(Number(quality['Single_Scattering_Albedo[' + w + 'nm]']), -999);
			// AERONET tables use angular-average normalization; renormalize the finite linear representation explicitly.
			assert.ok(Math.abs(t.originalIntegral - 2) < 0.08);
			assert.ok(Math.abs(t.meanCosine - reportedMean) < 0.01);
			return {wavelength: w, albedo, reportedMean, ...t};
		});
	const values = [360, 454, 548, 642, 712.5].map((w) => {
		const j = w < 440 ? 0 : w < 675 ? 0 : w < 870 ? 1 : 2,
			k = w < 440 ? 0 : j + 1,
			u = w < 440 ? 0 : (w - wavelengths[j]) / (wavelengths[k] - wavelengths[j]);
		return {
			wavelength: w,
			extrapolated: w < 440,
			albedo: bands[j].albedo * (1 - u) + bands[k].albedo * u,
			...table(
				bands[j].mu,
				bands[j].pdf.map((p, i) => p * (1 - u) + bands[k].pdf[i] * u),
			),
		};
	});
	return {parents: [seal, ...ids], selected: ssa, bands, values};
}

/** @param {AerosolTable} t */
function glsl(t) {
	const arr = (n, x) => `const float ${n}[${x.length}]=float[](${x.map((v) => v.toExponential(16)).join(',')});`;
	return `${arr('AMU', t.mu)}\n${arr('APDF', t.pdf)}\n${arr('ACDF', t.cdf)}
float aerosolPhase(float c){int lo=0,hi=${t.mu.length - 1};for(int i=0;i<7;i++){int mid=(lo+hi)/2;if(c>=AMU[mid])lo=mid;else hi=mid;}lo=min(lo,${t.mu.length - 2});float u=clamp((c-AMU[lo])/(AMU[lo+1]-AMU[lo]),0.0,1.0);return mix(APDF[lo],APDF[lo+1],u)/(2.0*PI);}
float aerosolSample(float u){int lo=0,hi=${t.mu.length - 1};for(int i=0;i<7;i++){int mid=(lo+hi)/2;if(u>=ACDF[mid])lo=mid;else hi=mid;}lo=min(lo,${t.mu.length - 2});float d=AMU[lo+1]-AMU[lo],f=APDF[lo],s=(APDF[lo+1]-f)/d,q=max(0.0,u-ACDF[lo]);return AMU[lo]+clamp(2.0*q/(f+sqrt(max(0.0,f*f+2.0*s*q))),0.0,d);}
`;
}
/** Preserve the original solver byte-for-byte except the physical aerosol evaluation and sampling.
 * @param {SkyDirectMedium} m @param {AerosolTable|null} t @returns {string}
 */
export function shader(m, t) {
	let s = monteCarloFragment(m);
	if (!t) return s;
	const replace = (from, to) => {
		assert.equal(s.split(from).length, 2, 'Exact shader adapter contract');
		s = s.replace(from, to);
	};
	replace('float kernel(vec2 b,float c){', glsl(t) + 'float kernel(vec2 b,float c){');
	replace(
		'float pm=3.0*(1.0-G*G)*(1.0+c*c)/(8.0*PI*(2.0+G*G)*pow(1.0+G*G-2.0*G*c,1.5));',
		'float pm=aerosolPhase(c);',
	);
	replace(
		'for(int j=0;j<rejectionLimit;j++){',
		'if(mie){cosine=aerosolSample(random());accepted=true;}\n else for(int j=0;j<rejectionLimit;j++){',
	);
	return s;
}

/** Deterministic, score-independent optical input and inverse-CDF checks. */
export function proof() {
	let checks = 0;
	const optical = optics();
	for (const t of [
		...optical.bands,
		...optical.values,
		table([-1, 0, 1], [1, 1, 1]),
		table([-1, 0, 1], [0.5, 1, 1.5]),
	]) {
		let average = 0;
		for (let i = 0; i < 10000; i++) {
			const u = (i + 0.5) / 10000,
				c = sample(t, u);
			assert.ok(c >= -1 && c <= 1);
			average += c / 10000;
			const j = Math.min(
				t.mu.length - 2,
				t.mu.findIndex((x, k) => k < t.mu.length - 1 && c <= t.mu[k + 1]),
			);
			const d = c - t.mu[j],
				s = (t.pdf[j + 1] - t.pdf[j]) / (t.mu[j + 1] - t.mu[j]);
			assert.ok(Math.abs(t.cdf[j] + t.pdf[j] * d + (s * d * d) / 2 - u) < 1e-11);
			checks++;
		}
		assert.ok(Math.abs(average - t.meanCosine) < 0.0001);
		checks++;
		let mass = 0;
		for (let i = 1; i < t.mu.length; i++)
			mass +=
				((Math.fround(t.mu[i]) - Math.fround(t.mu[i - 1])) *
					(Math.fround(t.pdf[i]) + Math.fround(t.pdf[i - 1]))) /
				2;
		assert.ok(Math.abs(mass - 1) < 2e-5);
		checks++;
	}
	const isotropic = table([-1, 0, 1], [1, 1, 1]);
	assert.ok(Math.abs(phase(isotropic, 0) - 1 / (4 * Math.PI)) < 1e-15);
	assert.equal(sample(isotropic, 0.75), 0.5);
	checks += 2;
	return {checks, optical};
}
