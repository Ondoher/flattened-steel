import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {
	createRun, identity, readRepository, verifyRun, checkedAbsolute, repositoryRoot,
} from '../io/files.mjs';
import {colorimetry, colorControls, ciePath} from '../horizon/diagnosis-color.mjs';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/index.js';
import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';

const parent = 'tmp/experiments/sky-accuracy-dials/runs/00288-h40-distant';
const tool = 'scripts/libradtran/cli.js';
const centers = NATIVE_15_SPECTRAL_BASIS.channels.map(c => c.center.value);

/** Parse a bounded integer command option; malformed values abort before allocation.
 * @param {string} name @param {number} fallback @param {number} maximum @returns {number}
 */
function option(name, fallback, maximum) {
	const index = process.argv.indexOf(`--${name}`);
	const value = index < 0 ? fallback : Number(process.argv[index + 1]);
	assert.ok(Number.isInteger(value) && value > 0 && value <= maximum, `Invalid ${name}`);
	return value;
}

/** Construct explicit layer-integrated molecular properties without library atmosphere defaults.
 * @param {HorizonReferenceMedium} medium @param {HorizonLibCase} config
 * @returns {Map<string,string>} Self-contained input bundle; malformed physical values abort.
 */
export function bundle(medium, config) {
	assert.equal(medium.geometry, 'spherical');
	assert.equal(medium.sourceKind, 'parallel');
	assert.ok(config.epsilon > 0 && config.epsilon <= 1);
	const h = medium.rayleighHeight, top = medium.topAltitude;
	const levels = Array.from({length: config.layers + 1}, (_, i) =>
		-h * Math.log1p(-(1 - i / config.layers) * (1 - Math.exp(-top / h))));
	levels[0] = top; levels[levels.length - 1] = 0;
	levels.push(5); levels.sort((a, b) => b - a);
	const altitudeHeader = levels.map(z => (z / 1000).toPrecision(16)).join(' ');
	const sca = [altitudeHeader], abs = [altitudeHeader];
	for (const c of config.channels) {
		const opticalDepth = levels.slice(1).map((z, i) =>
			medium.rayleigh[c] * h * (Math.exp(-z / h) - Math.exp(-levels[i] / h)));
		sca.push([centers[c], ...opticalDepth.map(t => t * config.epsilon)].join(' '));
		abs.push([centers[c], ...opticalDepth.map(t => t * (1 - config.epsilon))].join(' '));
	}
	const solar = config.channels.map(c => `${centers[c]} ${medium.sourceIrradiance[c] * 1000 * medium.incidentScale}`);
	const files = new Map([
		['wavelengths.txt', config.channels.map(c => centers[c]).join('\n') + '\n'],
		['solar.txt', solar.join('\n') + '\n'],
		['scattering.txt', sca.join('\n') + '\n'],
		['absorption.txt', abs.join('\n') + '\n'],
		['atmosphere.txt', levels.map(z => {
			const density = Math.exp(-z / h);
			return `${z / 1000} ${1013 * density} 288 ${2.545818e19 * density}`;
		}).join('\n') + '\n'],
	]);
	const sza = Math.acos(medium.sourceDirection[2]) * 180 / Math.PI;
	files.set('input.inp', [
		'data_files_path @LIBRADTRAN_DATA@/',
		'atmosphere_file atmosphere.txt',
		'source solar solar.txt per_nm',
		'wavelength_grid_file wavelengths.txt',
		'spline_file wavelengths.txt',
		'mol_tau_file sca scattering.txt',
		'mol_tau_file abs absorption.txt',
		'mol_abs_param none',
		'rayleigh_depol 0',
		`earth_radius ${medium.radius / 1000}`,
		'albedo 0',
		`zout ${5 / 1000}`,
		`sza ${sza}`, 'phi0 0',
		`umu ${-Math.sin(config.elevation * Math.PI / 180)}`, 'phi 180',
		'rte_solver mystic', 'mc_spherical 1D',
		...(config.vroomOff ? ['mc_vroom off'] : []),
		`mc_photons ${config.photons}`,
		`mc_randomseed ${100003 + 104729 * config.repeat}`,
		'output_user lambda uu', 'quiet', '',
	].join('\n'));
	files.set('case.json', JSON.stringify({
		purpose: `H42 ${config.id}: matched zero-aerosol distant horizon; epsilon=${config.epsilon}`,
		geometry: `Fully spherical MYSTIC, R=${medium.radius} m, top=${top} m, observer=5 m, sza=${sza}, away elevation=${config.elevation} deg`,
		quantity: 'MYSTIC directional spectral radiance in mc.rad.spc; source photons normalized to the retained H40 source.',
		units: 'Wavelength nm; raw spectral radiance mW m^-2 sr^-1 nm^-1; analysis divides by 1000.',
		limitations: [
			'Black surface, scalar unpolarized Rayleigh, no refraction, no aerosol or inelastic scattering.',
			'Layer representation and photon sampling need independent convergence checks.',
			'Epsilon below one replaces scattering with absorption at unchanged total extinction; L/epsilon is a finite-epsilon first-order control, not a physical atmosphere.',
			'No comparison here establishes full production-cache correctness or local-source validation.',
		],
		configuration: config,
	}, null, 2));
	return files;
}

/** Await exactly one shared-tool process; cancellation is forwarded and final evidence is retained.
 * @param {string} directory @param {number} timeout @returns {Promise<HorizonLibLaunch>}
 */
export async function invoke(directory, timeout) {
	return await new Promise((resolve, reject) => {
		const child = spawn(process.execPath, [checkedAbsolute(path.join(repositoryRoot, tool)), 'run', '--case', directory,
			'--timeout-seconds', String(timeout)], {cwd: repositoryRoot, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']});
		let stdout = '', stderr = '';
		const cancel = () => child.kill('SIGINT');
		process.once('SIGINT', cancel); process.once('SIGTERM', cancel);
		child.stdout.on('data', b => {stdout += b.toString();});
		child.stderr.on('data', b => {stderr += b.toString();});
		child.once('error', error => {process.off('SIGINT', cancel); process.off('SIGTERM', cancel); reject(error);});
		child.once('close', code => {
			process.off('SIGINT', cancel); process.off('SIGTERM', cancel);
			resolve({code, stdout, stderr});
		});
	});
}

/** Empirical Student interval from independent repeated solver invocations, not a formal error bound.
 * @param {readonly number[]} values @returns {number} Conservative two-sided 95% half-width; no repeats yields Infinity.
 */
export function halfWidth(values) {
	if (values.length < 2) return Infinity;
	const critical = [0, 0, 12.707, 4.303, 3.183, 2.777, 2.571, 2.447, 2.365, 2.307, 2.263][Math.min(10, values.length)];
	const mean = values.reduce((a, b) => a + b, 0) / values.length;
	return critical * Math.sqrt(values.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (values.length * (values.length - 1)));
}

/** Produce labelled swatches from actual solved spectra, preserving a fixed physical display gain.
 * @param {readonly HorizonLibSummary[]} summaries @param {number} lux @returns {string} Standalone reviewable SVG.
 */
function figure(summaries, lux) {
	const display = new ColorResetSlope078P2ColorDisplayModel();
	const items = [];
	for (const s of summaries) {
		const actual = display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */([...s.color.rgb]), {value: lux, units: 'lux'});
		const equal = s.color.rgb.map(x => Math.max(0, Math.min(1, x / s.color.luminanceCdPerM2 * 0.35)))
			.map(x => x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
		const original = display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */([...s.parentColor.rgb]), {value: lux, units: 'lux'});
		items.push({s, colors: [original, actual, equal].map(rgb => `rgb(${rgb.map(x => Math.round(x * 255)).join(',')})`)});
	}
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="${135 + 65 * items.length}"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="15" y="25" font-size="19">H42: external fully spherical zero-aerosol sky spectra</text><text x="15" y="48">Away from Sun; black surface; fixed exposure/white balance. Swatches, not scene captures.</text><text x="15" y="68">Weak rows show L/epsilon (mathematical first-order controls); full rows show physical all-order L.</text><text x="430" y="93">H40 N1 / fixed p2</text><text x="625" y="93">libRadtran / fixed p2</text><text x="820" y="93">libRadtran / equal Y</text>${items.map(({s, colors}, i) => `<text x="15" y="${126 + 65 * i}">${s.id}: R/B ${s.color.redBlueRatio.toFixed(4)} ± ${s.redBlueHalfWidth95.toFixed(4)}</text>${colors.map((c, j) => `<rect x="${430 + 195 * j}" y="${105 + 65 * i}" width="175" height="48" fill="${c}"/>`).join('')}`).join('')}</g></svg>`;
}

/** Authenticate the actual external case files and check physical matching independently of its metadata.
 * @param {HorizonLibReading} reading @param {HorizonLibParent} physical
 * @returns {HorizonLibInputCheck} Actual identities and optical-depth discrepancy; mismatches abort reporting.
 */
function checkInputs(reading, physical) {
	const manifestPath = reading.toolRun + '/manifest.json';
	const manifest = /** @type {HorizonLibManifest} */ (JSON.parse(readRepository(manifestPath).toString()));
	assert.ok(Array.isArray(manifest.artifacts));
	const identities = [identity(manifestPath)];
	/** @param {string} name @returns {string} Authenticated original case text. */
	function original(name) {
		const relative = `${reading.toolRun}/case/${name}`;
		const expected = manifest.artifacts.find(a => a.path === `case/${name}`);
		assert.ok(expected);
		const bytes = readRepository(relative, expected.sha256);
		assert.equal(bytes.length, expected.bytes); identities.push(identity(relative, bytes));
		return bytes.toString();
	}
	const deck = original('input.inp'), m = physical.medium;
	assert.deepEqual(physical.origin, [0, 0, m.radius + 5]);
	for (const line of ['rte_solver mystic', 'mc_spherical 1D', 'albedo 0', 'rayleigh_depol 0',
		'phi0 0', 'phi 180', 'zout 0.005', `earth_radius ${m.radius / 1000}`,
		'mol_tau_file sca scattering.txt', 'mol_tau_file abs absorption.txt', 'mol_abs_param none']) assert.ok(deck.split('\n').includes(line), line);
	assert.equal(deck.includes('mc_vroom off'), Boolean(reading.configuration.vroomOff));
	assert.ok(!deck.includes('pseudospherical') && !deck.includes('aerosol') && !deck.includes('no_absorption'));
	const sza = Number(deck.match(/^sza (.+)$/m)?.[1]);
	assert.ok(Math.abs(Math.cos(sza * Math.PI / 180) - m.sourceDirection[2]) < 1e-12);
	const solar = original('solar.txt').trim().split('\n').map(s => s.trim().split(/\s+/).map(Number));
	assert.equal(solar.length, 15);
	solar.forEach((row, c) => {assert.equal(row[0], centers[c]); assert.ok(Math.abs(row[1] / (m.sourceIrradiance[c] * 1000 * m.incidentScale) - 1) < 1e-12);});
	const sca = original('scattering.txt').trim().split('\n').map(s => s.trim().split(/\s+/).map(Number));
	const abs = original('absorption.txt').trim().split('\n').map(s => s.trim().split(/\s+/).map(Number));
	assert.deepEqual(sca[0], abs[0]); assert.equal(sca[0][0], m.topAltitude / 1000);
	assert.equal(sca[0].at(-1), 0); assert.ok(sca[0].includes(0.005));
	const atmosphere = original('atmosphere.txt').trim().split('\n').map(s => s.trim().split(/\s+/).map(Number));
	assert.equal(atmosphere.length, sca[0].length);
	atmosphere.forEach((row, i) => assert.ok(Math.abs(row[0] - sca[0][i]) < 1e-10));
	assert.equal(sca.length, 16); assert.equal(abs.length, 16);
	let maximumRelative = 0, maximumLayerRelative = 0;
	for (let c = 0; c < 15; c++) {
		assert.equal(sca[c + 1][0], centers[c]); assert.equal(abs[c + 1][0], centers[c]);
		assert.equal(sca[c + 1].length, sca[0].length); assert.equal(abs[c + 1].length, sca[0].length);
		const total = sca[c + 1].slice(1).reduce((sum, value, j) => sum + value + abs[c + 1][j + 1], 0);
		const target = m.rayleigh[c] * m.rayleighHeight * -Math.expm1(-m.topAltitude / m.rayleighHeight);
		maximumRelative = Math.max(maximumRelative, Math.abs(total / target - 1));
		for (let j = 1; j < sca[c + 1].length; j++) {
			const tau = sca[c + 1][j] + abs[c + 1][j];
			assert.ok(tau > 0 && Math.abs(sca[c + 1][j] / tau - reading.configuration.epsilon) < 1e-12);
			const upper = sca[0][j - 1] * 1000, lower = sca[0][j] * 1000;
			const targetLayer = m.rayleigh[c] * m.rayleighHeight * Math.exp(-upper / m.rayleighHeight) * Math.expm1((upper - lower) / m.rayleighHeight);
			maximumLayerRelative = Math.max(maximumLayerRelative, Math.abs(tau / targetLayer - 1));
		}
	}
	assert.ok(maximumRelative < 1e-12);
	assert.ok(maximumLayerRelative < 1e-10);
	return {case: reading.configuration, identities, maximumRelativeTotalOpticalDepthError: maximumRelative, maximumRelativeLayerOpticalDepthError: maximumLayerRelative};
}

/** Derive the final comparison without rerunning transport or modifying parent evidence.
 * @param {readonly string[]} paths @returns {Promise<void>} New sealed report; incompatible parents reject.
 */
async function report(paths) {
	assert.equal(paths.length, 2, 'Report requires initial and VROOM-off qualified run paths.');
	const parents = paths.map(p => verifyRun(p));
	parents.push(verifyRun(parent));
	const data = paths.map(p => {
		assert.equal(JSON.parse(readRepository(p + '/sealed.json').toString()).state, 'accepted');
		const relative = p + '/readings.json', summaryPath = p + '/summary.json';
		parents.push(identity(relative), identity(summaryPath));
		return {path: p, readings: /** @type {HorizonLibReading[]} */ (JSON.parse(readRepository(relative).toString())),
			summaries: /** @type {HorizonLibSummary[]} */ (JSON.parse(readRepository(summaryPath).toString()))};
	});
	const physicalPath = parent + '/registration.json'; parents.push(identity(physicalPath), identity(ciePath));
	const physical = /** @type {HorizonLibParent} */ (JSON.parse(readRepository(physicalPath).toString()));
	const parentRaysPath = parent + '/rays.json'; parents.push(identity(parentRaysPath));
	const parentCases = /** @type {LocalAerosolCase[]} */ (JSON.parse(readRepository(parentRaysPath).toString()));
	const parentRay = parentCases.find(c => c.fraction === 0).rows.find(r => r.heading === 'away' && r.elevation === 0.05);
	assert.ok(parentRay);
	const qualified = data[1]; assert.ok(qualified.readings.every(r => r.configuration.vroomOff));
	/** @param {string} id @returns {HorizonLibReading[]} Fixed-case repeats in seed order. */
	function group(id) {
		const rows = qualified.readings.filter(r => r.configuration.id === id).sort((a, b) => a.configuration.repeat - b.configuration.repeat);
		assert.ok(rows.length >= 4); assert.ok(rows.every((r, i) => r.configuration.repeat === i && r.spectrum.length === 15)); return rows;
	}
	/** @param {readonly number[]} values @returns {HorizonLibInterval} Empirical repeated-run mean interval. */
	function stats(values) {return {mean: values.reduce((a, b) => a + b, 0) / values.length, halfWidth95: halfWidth(values)};}
	const hi = group('weak-100'), lo = group('weak-050'); assert.equal(hi.length, lo.length);
	const n1 = lo.map((r, i) => r.dividedSpectrum.map((x, c) => 2 * x - hi[i].dividedSpectrum[c]));
	const meanN1 = centers.map((_, c) => n1.reduce((s, v) => s + v[c], 0) / n1.length);
	const n1Colors = n1.map(s => colorimetry(s, 'bin-integrated')), n1Color = colorimetry(meanN1, 'bin-integrated');
	const full = qualified.summaries.find(s => s.id === 'full-0.05'); assert.ok(full);
	const fine = qualified.summaries.find(s => s.id === 'full-fine'); assert.ok(fine);
	const previous = data[0].summaries.find(s => s.id === 'full-0.05'); assert.ok(previous);
	const finiteUpper = meanN1.map((x, c) => (x + 0.005 * full.meanSpectrum[c]) / 1.005);
	const sourceColor = colorimetry(physical.medium.sourceIrradiance.map(x => x * physical.medium.incidentScale), 'bin-integrated');
	const n1Summary = {...lo[0].configuration, id: 'N1-limit', elevation: 0.05, epsilon: 1,
		layers: lo[0].configuration.layers, repeats: lo.length, meanSpectrum: meanN1, meanDividedSpectrum: meanN1, color: n1Color,
		redBlueHalfWidth95: halfWidth(n1Colors.map(c => c.redBlueRatio)), luminanceHalfWidth95: halfWidth(n1Colors.map(c => c.luminanceCdPerM2)),
		maximumSpectralHalfWidth95Relative: Math.max(...centers.map((_, c) => halfWidth(n1.map(s => s[c])) / meanN1[c])),
		parentColor: full.parentColor, maximumRelativeToParentN1: Math.max(...meanN1.map((x, c) => Math.abs(x / parentRay.spectrum[c] - 1)))};
	const coarseRows = group('full-0.05'), fineRows = group('full-fine'); assert.equal(coarseRows.length, fineRows.length);
	const inputChecks = [];
	for (const dataset of data) for (const id of new Set(dataset.readings.map(r => r.configuration.id)))
		inputChecks.push(checkInputs(dataset.readings.find(r => r.configuration.id === id), physical));
	const higher = fine.meanSpectrum.map((x, c) => x - meanN1[c]);
	const analysis = {
		source: {xy: sourceColor.xy, redBlueRatio: sourceColor.redBlueRatio}, parentN1: full.parentColor,
		externalN1: {color: n1Color, redBlue: stats(n1Colors.map(c => c.redBlueRatio)), luminance: stats(n1Colors.map(c => c.luminanceCdPerM2)),
			meanSpectrum: meanN1, finiteEpsilonUpperSpectrum: finiteUpper,
			maximumPointEstimateRelativeBracketWidth: Math.max(...meanN1.map((x, c) => Math.abs(finiteUpper[c] / x - 1))),
			finiteEpsilonNote: 'Exact-mean positive-order bracket; sample-mean evaluation is reported separately from sampling uncertainty.'},
		externalFull: fine, coarseFull: full, defaultVarianceReductionFull: previous,
		layerRefinement: {redBlueDifference: stats(fineRows.map((r, i) => r.color.redBlueRatio - coarseRows[i].color.redBlueRatio)),
			luminanceRelativeDifference: stats(fineRows.map((r, i) => (r.color.luminanceCdPerM2 - coarseRows[i].color.luminanceCdPerM2) / full.color.luminanceCdPerM2))},
		higherOrderDifference: {spectrum: higher, color: colorimetry(higher, 'bin-integrated'),
			luminanceFractionOfFull: 1 - n1Color.luminanceCdPerM2 / fine.color.luminanceCdPerM2},
		selectedWavelengthGains: [2, 5, 8].map(c => ({wavelengthNm: centers[c], fullOverN1: fine.meanSpectrum[c] / meanN1[c]})),
		scope: 'Matched zero-aerosol scalar spherical model with black surface, not a production-cache comparison or real-atmosphere qualification.',
	};
	const run = createRun('h42-report', {parents, operation: 'Authenticate actual external inputs; paired first-order extrapolation and empirical uncertainty; full-scattering, layer and variance-reduction comparison.', parameters: {parentRuns: paths, epsilon: [0.1, 0.05], finiteEpsilonCoefficient: 0.005, lux: physical.lux}});
	let failure = null;
	try {
		run.write('compatibility.json', inputChecks);
		run.write('analysis.json', analysis);
		run.write('comparison.svg', figure([n1Summary, ...qualified.summaries.filter(s => ['full-fine', 'full-3', 'full-20'].includes(s.id))], physical.lux));
		// Every plotted curve has physical radiance units; source irradiance is not plotted as radiance.
		const curves = [{label: 'H40 independent N1', spectrum: parentRay.spectrum, color: '#777'},
			{label: 'libRadtran N1 limit', spectrum: meanN1, color: '#b36a00'},
			{label: 'libRadtran all orders', spectrum: [...fine.meanSpectrum], color: '#2466b5'},
			{label: 'additional higher orders', spectrum: higher, color: '#238647'}];
		const maximum = Math.max(...curves.flatMap(c => c.spectrum)) * 1.1;
		run.write('spectra.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="420"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="45" y="25" font-size="19">Independent spherical horizon: spectral contribution of later scattering</text><text x="45" y="47">Away view, elevation 0.05 degrees, zero aerosol, black ground; VROOM disabled.</text><path d="M65 70V350H800" fill="none" stroke="#777"/>${curves.map((c, i) => `<path d="${c.spectrum.map((v, k) => `${k ? 'L' : 'M'}${65 + (centers[k] - centers[0]) / (centers.at(-1) - centers[0]) * 735},${350 - v / maximum * 280}`).join(' ')}" fill="none" stroke="${c.color}" stroke-width="2"/><text x="${70 + i * 195}" y="380" fill="${c.color}">${c.label}</text>`).join('')}<text x="65" y="67">${maximum.toFixed(3)} W m^-2 sr^-1 nm^-1</text><text x="65" y="367">${centers[0].toFixed(1)} nm</text><text x="735" y="367">${centers.at(-1).toFixed(1)} nm</text><text x="45" y="407">Curves show sample means; sampling and finite-epsilon uncertainties are retained in analysis.json.</text></g></svg>`);
	} catch (error) {failure = error;}
	finally {run.finish(failure ? 'failed' : 'accepted', {failure: failure ? String(failure) : null, parentRuns: paths});}
	verifyRun(run.path); console.log(JSON.stringify({run: run.path, analysis})); if (failure) throw failure;
}

/** Execute a bounded reference package, retaining raw external identities and immutable scientific derivation.
 * @returns {Promise<void>} Sealed outcome; solver/qualification failures remain evidence and reject the command.
 */
async function main() {
	const stage = process.argv[2] ?? 'pilot';
	if (stage === 'report') {await report(process.argv.slice(3)); return;}
	assert.ok(['pilot', 'measure', 'qualify'].includes(stage));
	const photons = option('photons', stage === 'pilot' ? 10000 : stage === 'qualify' ? 30000 : 100000, 10000000);
	const weakPhotons = option('weak-photons', stage === 'qualify' ? 1000000 : 3000000, 10000000);
	const layers = option('layers', stage === 'pilot' ? 128 : 256, 2048);
	const repeats = option('repeats', stage === 'pilot' ? 1 : stage === 'qualify' ? 8 : 4, 16);
	const vroomOff = stage === 'qualify' || process.argv.includes('--vroom-off');
	const pilotEpsilon = option('epsilon-milli', 1000, 1000) / 1000;
	const bands = option('bands', stage === 'pilot' ? 3 : 15, 15);
	assert.ok([3, 15].includes(bands));
	assert.ok(stage === 'pilot' || repeats >= 2);
	const parents = [verifyRun(parent)];
	const registrationPath = parent + '/registration.json', raysPath = parent + '/rays.json';
	const registration = /** @type {HorizonLibParent} */ (JSON.parse(readRepository(registrationPath).toString()));
	const rays = /** @type {LocalAerosolCase[]} */ (JSON.parse(readRepository(raysPath).toString()));
	for (const p of [registrationPath, raysPath, ciePath, tool, 'scripts/libradtran/worker.py', 'scripts/libradtran/installation.json']) parents.push(identity(p));
	const configurations = stage === 'pilot' ? [{id: 'pilot', elevation: 0.05, epsilon: pilotEpsilon, layers}] : stage === 'qualify' ? [
		{id: 'full-0.05', elevation: 0.05, epsilon: 1, layers},
		{id: 'weak-050', elevation: 0.05, epsilon: 0.05, layers},
		{id: 'weak-100', elevation: 0.05, epsilon: 0.1, layers},
		{id: 'full-fine', elevation: 0.05, epsilon: 1, layers: layers * 2},
		...[3, 20].map(elevation => ({id: `full-${elevation}`, elevation, epsilon: 1, layers})),
	] : [
		{id: 'full-0.05', elevation: 0.05, epsilon: 1, layers},
		{id: 'weak-010', elevation: 0.05, epsilon: 0.01, layers},
		{id: 'weak-002', elevation: 0.05, epsilon: 0.002, layers},
		{id: 'weak-fine', elevation: 0.05, epsilon: 0.002, layers: layers * 2},
		...[3, 20].map(elevation => ({id: `full-${elevation}`, elevation, epsilon: 1, layers})),
	];
	const channels = bands === 3 ? [2, 5, 8] : Array.from({length: 15}, (_, i) => i);
	const run = createRun('h42-libradtran', {parents, operation: 'Matched explicit-extinction fully spherical MYSTIC; weak-scattering N1 limit at fixed total extinction and separate full-scattering controls.',
		parameters: {stage, photons, weakPhotons, layers, repeats, channels, configurations, vroomOff, sourceUnits: 'mW', analysisUnits: 'W', groundAlbedo: 0}});
	console.log(JSON.stringify({run: run.path, stage, cases: configurations.length * repeats}));
	let failure = null;
	const readings = /** @type {HorizonLibReading[]} */ ([]);
	const summaries = /** @type {HorizonLibSummary[]} */ ([]);
	const started = Date.now();
	try {
		run.write('color-controls.json', colorControls());
		for (const configuration of configurations) {
			for (let repeat = 0; repeat < repeats; repeat++) {
				const config = {...configuration, photons: stage !== 'pilot' && configuration.epsilon < 1 ? weakPhotons : photons, repeat, channels, vroomOff};
				const directory = checkedAbsolute(path.join(run.scratchPath, `${config.id}-${repeat}`), false);
				mkdirSync(directory);
				for (const [name, contents] of bundle(registration.medium, config)) writeFileSync(path.join(directory, name), contents, {flag: 'wx'});
				run.progress('solver', `${config.id}, repetition ${repeat + 1}/${repeats}`, readings.length, configurations.length * repeats);
				const caseStarted = Date.now(), launch = await invoke(directory, 180);
				run.write(`launch-${config.id}-${repeat}.json`, launch);
				const allocated = launch.stdout.match(/libRadtran run: (.+)/)?.[1].trim();
				assert.ok(allocated, `Solver did not allocate evidence: ${launch.stderr}`);
				const relative = path.relative(repositoryRoot, checkedAbsolute(allocated)).split(path.sep).join('/');
				assert.ok(relative.startsWith('.codex-tmp/libradtran/runs/'));
				const manifestPath = `${relative}/manifest.json`, manifestBytes = readRepository(manifestPath);
				const manifest = /** @type {HorizonLibManifest} */ (JSON.parse(manifestBytes.toString()));
				run.write(`manifest-${config.id}-${repeat}.json`, manifestBytes, {parents: [identity(manifestPath, manifestBytes)], operation: 'Copy finalized shared-tool manifest without modifying its source run.'});
				assert.equal(launch.code, 0, launch.stderr); assert.equal(manifest.status, 'succeeded');
				const stderrPath = `${relative}/stderr.txt`, stderrBytes = readRepository(stderrPath);
				assert.equal(identity(stderrPath, stderrBytes).sha256, manifest.artifacts.find(a => a.path === 'stderr.txt').sha256);
				if (vroomOff) assert.ok(!stderrBytes.toString().includes('vroom not yet validated'));
				run.write(`solver-log-${config.id}-${repeat}.txt`, stderrBytes, {parents: [identity(manifestPath, manifestBytes), identity(stderrPath, stderrBytes)], operation: 'Copy authenticated solver diagnostics for physical-option review.'});
				const spectraArtifact = manifest.artifacts.find(a => a.path === 'execution/mc.rad.spc');
				assert.ok(spectraArtifact, `MYSTIC radiance file absent; artifacts: ${manifest.artifacts.map(a => a.path).join(', ')}`);
				const bytes = readRepository(`${relative}/${spectraArtifact.path}`);
				assert.equal(identity(`${relative}/${spectraArtifact.path}`, bytes).sha256, spectraArtifact.sha256);
				run.write(`raw-${config.id}-${repeat}.txt`, bytes, {parents: [identity(manifestPath, manifestBytes), identity(`${relative}/${spectraArtifact.path}`, bytes)], operation: 'Copy authenticated MYSTIC radiance output; preserve raw mW units.'});
				const rows = bytes.toString().trim().split(/\r?\n/).filter(line => line.trim() && !line.startsWith('#')).map(line => line.trim().split(/\s+/).map(Number));
				assert.equal(rows.length, channels.length);
				const spectrum = rows.map((row, i) => {assert.ok(Math.abs(row[0] - centers[channels[i]]) < 0.001); assert.ok(row.length >= 5 && row.every(Number.isFinite)); return row[4] / 1000;});
				assert.ok(spectrum.every(x => x >= 0));
				const dividedSpectrum = spectrum.map(x => x / config.epsilon);
				readings.push({configuration: config, toolRun: relative, spectrum, dividedSpectrum,
					color: channels.length === 15 ? colorimetry(dividedSpectrum, 'bin-integrated') : null, elapsedMilliseconds: Date.now() - caseStarted});
				run.write(`reading-${config.id}-${repeat}.json`, readings.at(-1));
			}
			if (channels.length === 15 && repeats >= 2) {
				const set = readings.filter(r => r.configuration.id === configuration.id);
				const meanSpectrum = channels.map((_, c) => set.reduce((sum, r) => sum + r.spectrum[c], 0) / set.length);
				const meanDividedSpectrum = meanSpectrum.map(x => x / configuration.epsilon);
				const parentRay = rays.find(c => c.fraction === 0).rows.find(r => r.heading === 'away' && r.elevation === configuration.elevation);
				assert.ok(parentRay);
				const color = colorimetry(meanDividedSpectrum, 'bin-integrated');
				summaries.push({id: configuration.id, elevation: configuration.elevation, epsilon: configuration.epsilon, layers: configuration.layers,
					repeats, meanSpectrum, meanDividedSpectrum, color, parentColor: parentRay.color,
					redBlueHalfWidth95: halfWidth(set.map(r => r.color.redBlueRatio)),
					luminanceHalfWidth95: halfWidth(set.map(r => r.color.luminanceCdPerM2)),
					maximumSpectralHalfWidth95Relative: Math.max(...channels.map((_, c) => halfWidth(set.map(r => r.dividedSpectrum[c])) / meanDividedSpectrum[c])),
					maximumRelativeToParentN1: Math.max(...channels.map((_, c) => Math.abs(meanDividedSpectrum[c] / parentRay.spectrum[c] - 1)))});
				run.write(`comparison-${configuration.id}.svg`, figure(summaries, registration.lux));
			}
		}
		run.write('readings.json', readings);
		run.write('summary.json', summaries);
		if (summaries.length) run.write('comparison.svg', figure(summaries, registration.lux));
	} catch (error) {failure = error;}
	finally {run.finish(failure ? 'failed' : 'accepted', {elapsedMilliseconds: Date.now() - started, failure: failure ? String(failure) : null,
		cases: readings.length, scope: 'External execution and raw-output qualification; scientific convergence and matching conclusions require the retained report.'});}
	verifyRun(run.path);
	console.log(JSON.stringify({run: run.path, elapsedMilliseconds: Date.now() - started, accepted: !failure}));
	if (failure) throw failure;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
