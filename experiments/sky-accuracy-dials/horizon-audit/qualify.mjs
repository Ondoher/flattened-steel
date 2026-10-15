import assert from 'node:assert/strict';
import {createRun, storage, verifyRun} from '../io/files.mjs';
import {readParent, requireUnusedStage} from '../hypotheses/common.mjs';
import {colorimetry} from '../horizon/diagnosis-color.mjs';
import {bounds, dot, integrate} from './math.mjs';
import {angularRule, incomingSource} from './angular.mjs';
import {miePhase} from '../horizon/diagnosis-transport.mjs';

/** Total spectral P2 source. @param {HorizonAuditAngular} value @returns {number[]} */
function total(value) {return value.species[0].map((x, c) => x + value.species[1][c]);}

/** Simple standalone scientific SVG, plotting fractions of each final RGB integral.
 * Channel normalization is explicit; these curves are not colors of the scene.
 * @param {HorizonAuditPathRow[]} rows @returns {string}
 */
function figure(rows) {
	const panels = [...rows].sort((a, b) => a.elevation - b.elevation || a.mode - b.mode).map((row, index) => {
		const x = 35 + (index % 2) * 390, y = 35 + Math.floor(index / 2) * 190;
		const end = row.samples.at(-1).distance, rgb = row.samples.map(s => colorimetry(s.cumulativeSpectrum, 'bin-integrated').rgb), final = rgb.at(-1);
		const curves = ['#d34b3f', '#26874e', '#326fcb'].map((color, c) => {
			const points = row.samples.map((s, i) => (x + 320 * Math.log1p(s.distance) / Math.log1p(end)).toFixed(2) + ',' + (y + 125 - 110 * rgb[i][c] / final[c]).toFixed(2)).join(' ');
			return '<polyline fill="none" stroke="' + color + '" stroke-width="2" points="' + points + '"/>';
		}).join('');
		return '<g><text x="' + x + '" y="' + y + '">' + (row.mode ? 'Distant N1 control' : 'Flat local N1') + ', ' + row.elevation + ' degrees</text><path d="M' + x + ',' + (y + 15) + 'v110h320" fill="none" stroke="#888"/>' + curves +
			'<text x="' + x + '" y="' + (y + 146) + '">0 m</text><text x="' + (x + 230) + '" y="' + (y + 146) + '">' + (end / 1000).toFixed(1) + ' km</text></g>';
	}).join('');
	return '<svg xmlns="http://www.w3.org/2000/svg" width="820" height="650" viewBox="0 0 820 650"><rect width="820" height="650" fill="white"/><g font-family="sans-serif" font-size="13" fill="#222">' + panels +
		'<text x="35" y="625">Cumulative fraction per R/G/B channel (0 to 1); logarithmic distance; sampled polylines; no white balancing.</text></g></svg>';
}

/** Qualify the identified angular gap and retain a compact final attribution, without rerunning completed science.
 * @returns {void} Seals a new derivative report and preserves the first run.
 */
function main() {
	const spent = requireUnusedStage('h16-h20-qual', true), started = Date.now(), before = storage();
	/** @type {DialFileIdentity[]} */ const parents = [];
	const first = '00264-h16-h20-audit';
	const registration = /** @type {HorizonAuditRegistration} */ (readParent(first, 'registration.json', parents));
	const rows = /** @type {HorizonAuditIncomingRow[]} */ (readParent(first, 'incoming.json', parents));
	const endpoints = /** @type {HorizonAuditEndpointRow[]} */ (readParent(first, 'endpoints.json', parents));
	const paths = /** @type {HorizonAuditPathRow[]} */ (readParent(first, 'paths.json', parents));
	const firstSeal = /** @type {HorizonAuditTimingSeal} */ (readParent(first, 'sealed.json', parents));
	const deadline = started + 1200000 - firstSeal.result.elapsedMilliseconds - spent;
	const run = createRun('h16-h20-qual', {parents, operation: 'Resolve reference limitations identified by accepted H16-H20 audit: refine boundary angular rule 16 to 32, check incoming field quadrature at held directions, measure actual endpoint displacement effect and plot retained cumulative spectra.',
		parameters: {maximumMilliseconds: 1200000 - firstSeal.result.elapsedMilliseconds - spent, maximumNewBytes: 3 * 1024 ** 2,
			prediction: 'The large spherical F68 Mie deficit exceeds remaining angular/field refinement; Flat 1920 remains close. Small dome endpoint displacement does not produce a gray horizon.',
			allowance: '4x angular 16/32 difference plus a separately reported sparse incoming 8/16 path-refinement screen; no rigorous full-field bound.',
			reason: 'First 8/16 angular rule differs by up to 2.2 percent, so further reference refinement is needed before attributing the much larger F68 response.'}});
	let last = 0;
	/** Enforce the remaining aggregate budget and flush synchronous progress. @returns {void} */
	function guard() {assert.ok(Date.now() < deadline - 5000); if (Date.now() - last > 15000) {last = Date.now(); run.guard(); run.progress('qualification', 'Refining sparse incoming angular reference.');}}
	try {
		console.log(JSON.stringify({run: run.path}));
		run.write('registration.json', {selected: rows.map(r => ({mode: r.mode, altitude: r.altitude, point: r.point, direction: r.direction})),
			angularCount: 32, incomingFieldControl: 'First, middle and last azimuth in each boundary-split 8-node polar stratum; 8/16 spatial quadrature, all three frozen wavelengths.',
			note: 'Screen measures selected directions; it is not a certified error bound for the complete incoming field.'});
		const angular = [];
		for (const row of rows) {
			guard(); const original = registration.inputs[row.mode], channels = [2, 7, 12];
			const input = {...original, rayleigh: channels.map(c => original.rayleigh[c]), mie: channels.map(c => original.mie[c]), sourceIrradiance: channels.map(c => original.sourceIrradiance[c])};
			const rule = angularRule(input, row.point, 32), reference = incomingSource(input, row.point, row.direction, rule.directions, rule.weights, guard);
			const coarse = angularRule(input, row.point, 8), controls = [];
			// Select from each polar ring before evaluating its refinement; no outcome-based pruning.
			for (let i = 0; i < coarse.directions.length; i += 16) for (const offset of [0, 8, 15]) {
				const v = coarse.directions[i + offset];
				const length = bounds(input, row.point, v).distance;
				const a = integrate(input, row.point, v, 0, length, 8).spectrum, b = integrate(input, row.point, v, 0, length, 16).spectrum;
				controls.push({direction: v, low: a, high: b, absolute: a.map((x, c) => Math.abs(x - b[c]))});
			}
			const phaseRule = row.mode === 0 ? angularRule(input, row.point, 32) : rule;
			const phaseIntegral = [0, 0];
			for (let i = 0; i < phaseRule.directions.length; i++) {
				const mu = dot(row.direction, phaseRule.directions[i]);
				phaseIntegral[0] += phaseRule.weights[i] * 3 * (1 + mu * mu) / (16 * Math.PI);
				phaseIntegral[1] += phaseRule.weights[i] * miePhase(mu, input.g);
			}
			const baseline = total(row.baseline), ref = total(reference), previous = total(row.variants[1]);
			angular.push({mode: row.mode, altitude: row.altitude, wavelengths: row.wavelengths, baseline: row.baseline, reference,
				baselineSignedRelative: baseline.map((x, c) => x / ref[c] - 1),
				angularRefinementRelative: previous.map((x, c) => (x - ref[c]) / ref[c]),
				speciesSignedRelative: row.baseline.species.map((s, k) => s.map((x, c) => x / reference.species[k][c] - 1)),
				maximumIncomingFieldRefinementRelative: Math.max(...controls.flatMap(x => x.absolute.map((a, c) => a / Math.max(1e-12, Math.abs(x.high[c]))))),
				controls, phaseIntegral, note: 'Refined source is the same continuous N1 definition, not actual current N4 incoming cache or a fully propagated correction.'});
			run.progress('qualification', 'Qualified receiver mode ' + row.mode + ', altitude ' + row.altitude + '.');
		}
		const displacement = endpoints.filter(r => r.heading === 180 && r.installedMeters !== null).map(row => {
			const input = registration.inputs[row.mode];
			const top = bounds(input, row.origin, row.direction).top;
			const a = Math.min(top, row.length, row.installedMeters), b = Math.min(top, Math.max(row.length, row.installedMeters));
			const contribution = integrate(input, row.origin, row.direction, a, b, 16).spectrum;
			return {mode: row.mode, elevation: row.elevation, absoluteDifferenceMeters: Math.abs(row.installedMeters - row.capturedIndependentMeters),
				maximumSpectralRelative: Math.max(...contribution.map((x, c) => x / Math.max(1e-12, row.spectrum[c]))),
				limit: 'Sensitivity at independent synthetic direction; captured GPU direction differs by Float32 roundoff.'};
		});
		const summary = {angular, displacement, elapsedMilliseconds: Date.now() - started, firstRunMilliseconds: firstSeal.result.elapsedMilliseconds,
			gpuAttempts: 0, before, storage: storage(),
			limits: ['N4 propagation and live lookup unqualified.', 'Raster depth boundary and GPU precision not re-rendered.', 'No matched libRadtran horizon output.']};
		run.write('qualification.json', summary); run.write('cumulative.svg', figure(paths));
		guard(); const seal = run.finish('accepted', {elapsedMilliseconds: Date.now() - started, angularReceivers: angular.length, gpuAttempts: 0});
		verifyRun(run.path); console.log(JSON.stringify({run: run.path, seal, milliseconds: Date.now() - started}));
	} catch (error) {run.finish('failed', {error: String(error), elapsedMilliseconds: Date.now() - started, deadlineHit: Date.now() >= deadline - 5000}); throw error;}
}

main();
