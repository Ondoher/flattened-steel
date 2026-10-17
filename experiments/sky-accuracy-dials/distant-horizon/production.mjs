import assert from 'node:assert/strict';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {pathToFileURL} from 'node:url';
import {rollup} from 'rollup';
import puppeteer from 'puppeteer';
import {createRun, identity, readRepository, verifyRun, checkedAbsolute, repositoryRoot} from '../io/files.mjs';
import {browserSources} from '../execution.mjs';
import {makePlan} from './production-plan.mjs';
import {colorimetry, ciePath} from '../horizon/diagnosis-color.mjs';
import {DistantSunSceneCacheCompilerInputs as Inputs} from '../../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheCompilerInputs.js';
import {DistantSunSceneCacheNumerics} from '../../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheNumerics.js';
import {DistantSunSolarInterpolation} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSolarInterpolation.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER as domain} from '../../../src/algorithm32/sampling-domains/index.js';
import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';
import {SHARED_PACKAGE_IDENTITY, SHARED_PACKAGE_REPORT, SHARED_PACKAGE_SOLAR_INTERPOLATION} from '../../../server/flat32/features/shared-cache/selection.js';
import {BrunetonColorDisplayModel} from '../../../src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/index.js';
import {SpectralPacket, SPECTRAL_QUANTITIES, SPECTRAL_UNITS} from '../../../src/algorithm32/spectral-values/index.js';

const root = 'tmp/experiments/sky-accuracy-dials/runs/';
const h40 = root + '00288-h40-distant', h42 = root + '00295-h42-libradtran', reportRoot = root + '00296-h42-report';
const browserEntry = 'experiments/sky-accuracy-dials/distant-horizon/production-browser.js';

/** Independently replay the uploaded float coordinates in binary64 for a packet/lookup parity check.
 * @param {HorizonProductionJob} job Actual shader sample sequence.
 * @param {HorizonProductionPlan} plan Sparse field addressing.
 * @param {Float32Array} field Actual Float32 cumulative field.
 * @param {number} rayleigh Shader Rayleigh coefficient.
 * @param {number} height Shader scale height.
 * @param {number} [mie=0] Matched aerosol extinction coefficient.
 * @param {number} [mieHeight=1200] Matched aerosol scale height in metres.
 * @returns {number} Physical radiance with binary64 arithmetic on the same inputs.
 */
export function replay(job, plan, field, rayleigh, height, mie = 0, mieHeight = 1200) {
	let radiance = 0, transmission = 1;
	for (const s of job.samples) {
		const lowerSolar = Math.min(178, Math.floor(s.zenith));
		let density = 0;
		for (let a = 0; a < 2; a++) {
			const knots = s.taps[a].map(indices => indices.reduce((sum, index) => {
				const d = domain.unflattenNodeIndex(plan.coordinates[index].x);
				const weight = Math.max(0, 1 - Math.abs(d.uIndex - s.coordinate[1])) * Math.max(0, 1 - Math.abs(d.vIndex - s.coordinate[2]));
				return sum + weight * field[index];
			}, 0));
			density += s.altitudeWeights[a] * DistantSunSolarInterpolation.sample(lowerSolar === 0 ? undefined : knots[0], knots[1], knots[2], lowerSolar === 178 ? undefined : knots[3], s.zenith - lowerSolar);
		}
		const extinction = Math.fround(rayleigh) * Math.exp(-s.height / Math.fround(height)) + Math.fround(mie) * Math.exp(-s.height / Math.fround(mieHeight));
		const half = Math.exp(-0.5 * extinction * s.step);
		transmission *= half; radiance += transmission * density * s.step; transmission *= half;
	}
	return radiance;
}

/** Render matched solved colors at the actual reference elevations, without exposure fitting.
 * @param {readonly HorizonProductionComparison[]} rows Exact measured spectra.
 * @param {number} lux Frozen H40 display illuminance.
 * @returns {string} Standalone reviewable SVG; swatches are not a scene capture.
 */
function figure(rows, lux) {
	const display = new ColorResetSlope078P2ColorDisplayModel();
	const columns = ['Production N1', 'Production N4', 'libRadtran all orders'];
	const cells = rows.flatMap((r, i) => [r.productionN1, r.productionN4, r.reference].map((s, j) => {
		const c = colorimetry([...s], 'bin-integrated');
		const rgb = display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */([...c.rgb]), {value: lux, units: 'lux'});
		return `<rect x="${165 + j * 285}" y="${110 + i * 130}" width="265" height="80" fill="rgb(${rgb.map(x => Math.round(x * 255)).join(',')})"/><text x="${165 + j * 285}" y="${210 + i * 130}">R/B ${c.redBlueRatio.toFixed(3)}; Y ${c.luminanceCdPerM2.toFixed(0)} cd/m²</text>`;
	}));
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="565"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="18" y="28" font-size="21">Matched distant horizon: production cache versus libRadtran</text><text x="18" y="52">Zero aerosol, black ground, observer 5 m; same Sun, spectrum and fixed p2 exposure.</text>${columns.map((t,j)=>`<text x="${165+j*285}" y="90" font-size="17">${t}</text>`).join('')}${rows.map((r,i)=>`<text x="18" y="${150+i*130}">${r.elevation}° elevation</text>`).join('')}${cells.join('')}<text x="18" y="525">Sampled spectral colors, not app screenshots. Production uses Q30 views and orders 1–4.</text><text x="18" y="548">External right column includes all orders; view refinement and residuals are retained separately.</text></g></svg>`;
}

/** Render three explicitly named spectrum-to-display pipelines with no image-specific fitting.
 * @param {readonly HorizonDisplayRow[]} rows Completed production/reference spectral colors.
 * @returns {string} Standalone SVG with the original encoded code values.
 */
function displayFigure(rows) {
	const height = 180 + rows.length * 145;
	const headings = ['Existing swatch method', 'Bruneton color model', 'Production p2 color model'];
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="${height}"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="18" y="28" font-size="21">Completed scattering: three display conversions</text><text x="18" y="53">Same saved spectra; zero aerosol, black ground, San Jose noon. No white balance or exposure fitting.</text>${headings.map((s,j)=>`<text x="${215+j*270}" y="88" font-size="16">${s}</text>`).join('')}<text x="215" y="111" font-size="12">Bin-integrated CIE + p2 curve</text><text x="485" y="111" font-size="12">Midpoint CIE + Figure 1 curve</text><text x="755" y="111" font-size="12">Midpoint CIE + p2 gain/curve</text>${rows.map((r,i)=>`<text x="18" y="${159+i*145}" font-size="16">${r.source}</text><text x="18" y="${183+i*145}">${r.elevation}° elevation</text>${[r.independent,r.bruneton,r.production].map((rgb,j)=>{const codes=rgb.map(x=>Math.round(255*x));return `<rect x="${215+j*270}" y="${130+i*145}" width="250" height="95" fill="rgb(${codes.join(',')})"/><text x="${215+j*270}" y="${247+i*145}" font-size="13">RGB ${codes.join(', ')} / #${codes.map(x=>x.toString(16).padStart(2,'0')).join('')}</text>`;}).join('')}`).join('')}<text x="18" y="${height-20}" font-size="12">Production includes orders 1–4; libRadtran includes all orders. First column repeats the previous swatch pipeline.</text></g></svg>`;
}

/** Reproject accepted fully scattered spectra through existing color models, without transport work.
 * @returns {Promise<void>} New immutable swatch evidence and PNGs; failures seal then reject.
 */
async function displayComparison() {
	assert.equal(process.argv.length, 3, 'Internal display comparison accepts no source substitutions.');
	const source = root + '00299-h43-prod-full';
	const parents = [verifyRun(source), verifyRun(h40), identity(ciePath)];
	const spectraPath = source + '/comparison.json', registrationPath = h40 + '/registration.json';
	parents.push(identity(spectraPath), identity(registrationPath));
	const comparisons = /** @type {HorizonProductionComparison[]} */ (JSON.parse(readRepository(spectraPath).toString()));
	const physical = /** @type {HorizonLibParent} */ (JSON.parse(readRepository(registrationPath).toString()));
	const illuminance = /** @type {UnitValue<'lux'>} */ ({value: physical.lux, units: 'lux'});
	const bruneton = new BrunetonColorDisplayModel(), production = new ColorResetSlope078P2ColorDisplayModel();
	const models = browserSources(['src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js', 'src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js']); parents.push(...models);
	const rows = /** @type {HorizonDisplayRow[]} */ ([]);
	for (const c of comparisons) for (const [label, values] of [['Production N4', c.productionN4], ['libRadtran all orders', c.reference]]) {
		const spectrum = /** @type {readonly number[]} */ (values);
		const packet = /** @type {SpectralRadiancePacket} */ (new SpectralPacket({basis: NATIVE_15_SPECTRAL_BASIS, quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY, units: SPECTRAL_UNITS.RADIANCE_DENSITY, values: spectrum, provenanceIdentity: `h43-display:${label}:${c.elevation}`}));
		const independent = production.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */ (colorimetry([...spectrum], 'bin-integrated').rgb), illuminance);
		const row = {source: String(label), elevation: c.elevation, spectrum: [...spectrum], independent, bruneton: bruneton.radianceToDisplayRgb(packet), production: production.radianceToDisplayRgb(packet, illuminance)};
		assert.ok([row.independent, row.bruneton, row.production].every(rgb => rgb.length === 3 && rgb.every(x => Number.isFinite(x) && x >= 0 && x <= 1))); rows.push(row);
	}
	const run = createRun('h43-displays', {parents, operation: 'Reuse accepted production N4 and external all-order spectra; compare existing independent-bin/p2 swatches with complete Bruneton and selected production p2 color models. No scattering, fitting, normalization, gamma addition or white balance change.', parameters: {source, lux: physical.lux, productionGain: production.displayGain(illuminance), bruneton: bruneton.id, production: production.id, models}});
	let browser, failure = null;
	try {
		run.write('colors.json', {rows, lux: physical.lux, productionGain: production.displayGain(illuminance), originalFirstColumn: 'Independent bin-integrated CIE + precise D65 matrix, followed by production p2 mapping.', completeModelColumns: 'Native15 midpoint CIE and model-owned rounded matrix, then each model-owned tone mapping; raw unquantized code values retained.'});
		browser = await puppeteer.launch({executablePath: checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')), headless: true, userDataDir: checkedAbsolute(path.join(run.scratchPath, 'chrome-profile'), false), protocolTimeout: 60000, args: ['--enable-gpu', '--use-angle=d3d11']});
		const page = await browser.newPage();
		for (const [name, selected] of [['comparison', rows.filter(r=>r.elevation === 0.05)], ['all-elevations', rows]]) {
			const selectedRows = /** @type {HorizonDisplayRow[]} */ (selected);
			const svg = displayFigure(selectedRows); run.write(`${name}.svg`, svg);
			await page.setViewport({width: 1040, height: 180 + 145 * selectedRows.length, deviceScaleFactor: 1});
			await page.setContent(`<style>body{margin:0}</style>${svg}`); run.write(`${name}.png`, Buffer.from(await page.screenshot({type: 'png'})));
		}
		run.write('tool.json', {node: process.version, browser: await browser.version(), rasterization: 'Chromium SVG to PNG; same retained encoded RGB for each cell'});
	} catch (error) {failure = error;}
	finally {await browser?.close().catch(e=>{failure??=e;}); run.finish(failure?'failed':'accepted', {failure: failure?String(failure):null, noTransportRerun:true, rows:rows.length});}
	verifyRun(run.path); if (failure) throw failure; console.log(JSON.stringify({run:run.path, rows:rows.map(r=>({elevation:r.elevation,source:r.source,codes:[r.independent,r.bruneton,r.production].map(v=>v.map(x=>Math.round(x*255)))}))}));
}

/** Derive final metrics and PNG previews from accepted spectra without rerunning recurrence.
 * @returns {Promise<void>} A new sealed derivative; failed browser/report work seals then rejects.
 */
async function report() {
	assert.equal(process.argv.length, 4, 'Internal report replay requires one accepted H43 full-run path.');
	const source = process.argv[3];
	assert.match(source, /^tmp\/experiments\/sky-accuracy-dials\/runs\/\d{5}-h43-prod-full$/);
	const parents = [verifyRun(source), verifyRun(h42), verifyRun(reportRoot)];
	/** Read one immutable input while preserving its exact identity. @param {string} p @returns {Buffer} Authenticated parent bytes. */
	function read(p) {const b = readRepository(p); parents.push(identity(p, b)); return b;}
	assert.equal(JSON.parse(read(source + '/sealed.json').toString()).state, 'accepted');
	const rows = /** @type {HorizonProductionColorComparison[]} */(JSON.parse(read(source + '/comparison.json').toString()));
	const readings = /** @type {HorizonProductionReading[]} */(JSON.parse(read(source + '/readings.json').toString()));
	const external = /** @type {HorizonLibSummary[]} */(JSON.parse(read(h42 + '/summary.json').toString()));
	const comparison = read(source + '/comparison.svg'), spectra = read(source + '/spectra.svg');
	const compatibility = read(source + '/compatibility.json');
	const metrics = rows.map(r => {
		const same = readings.filter(v => v.elevation === r.elevation);
		const q30 = same.find(v => v.intervals === 30), q60 = same.find(v => v.intervals === 60), q120 = same.find(v => v.intervals === 120);
		assert.ok(q30 && q60 && q120);
		const ref = external.find(v => v.id === (r.elevation === 0.05 ? 'full-fine' : `full-${r.elevation}`)); assert.ok(ref);
		return {elevation: r.elevation, productionN1: r.productionN1Color, productionN4: r.productionN4Color,
			reference: {color: r.referenceColor, luminanceHalfWidth95: ref.luminanceHalfWidth95, redBlueHalfWidth95: ref.redBlueHalfWidth95},
			n4RelativeY: r.productionN4Color.luminanceCdPerM2 / r.referenceColor.luminanceCdPerM2 - 1,
			n4RedBlueDifference: r.productionN4Color.redBlueRatio - r.referenceColor.redBlueRatio,
			viewRefinement: {q60: q60.cumulative[3].color, q120: q120.cumulative[3].color,
				q30To120RelativeY: q120.cumulative[3].color.luminanceCdPerM2 / q30.cumulative[3].color.luminanceCdPerM2 - 1,
				q30To120MaximumSpectralRelative: Math.max(...q30.cumulative[3].spectrum.map((x,k) => Math.abs(x / q120.cumulative[3].spectrum[k] - 1)))},
			cumulativeOrderColors: q30.cumulative.map(v => ({order: v.order, color: v.color})),
			cumulativeOrderYIncrements: q30.cumulative.map((v, i) => v.color.luminanceCdPerM2 - (i ? q30.cumulative[i - 1].color.luminanceCdPerM2 : 0))};
	});
	const run = createRun('h43-report', {parents, operation: 'Derive matched production/external color, view refinement and order-increment metrics from accepted GPU spectra; render original comparison SVGs to PNG without transport changes.', parameters: {measurementParent: source, referenceParent: reportRoot, scatteringOrderLimit: 4, externalOrderLimit: 'all orders', display: 'unchanged fixed H40 p2'}});
	let browser, failure = null;
	try {
		run.write('analysis.json', {metrics, limitations: ['Physical inputs matched; external all-order versus production N4 is not an equal-order error estimate.', 'Canonical compiler/packet cubic lookup with explicit production-equation view replay; no app screenshot or deployed atmosphere change.', 'View geometry is constructed in binary64 then rounded to GPU uniforms; this does not qualify full-app geometry construction.', 'Cumulative differences include nonlinear Hermite reconstruction and are not independently isolated exact scattering orders.']});
		run.write('compatibility.json', compatibility); run.write('comparison.svg', comparison); run.write('spectra.svg', spectra);
		browser = await puppeteer.launch({executablePath: checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')), headless: true, userDataDir: checkedAbsolute(path.join(run.scratchPath, 'chrome-profile'), false), protocolTimeout: 60000, args: ['--enable-gpu', '--use-angle=d3d11']});
		const page = await browser.newPage();
		for (const [name, bytes, height] of [['comparison', comparison, 565], ['spectra', spectra, 795]]) {
			await page.setViewport({width: 1040, height: Number(height), deviceScaleFactor: 1});
			await page.setContent(`<style>body{margin:0}</style>${bytes.toString()}`);
			run.write(`${name}.png`, Buffer.from(await page.screenshot({type: 'png'})));
		}
		run.write('tool.json', {node: process.version, browser: await browser.version(), renderer: 'Chromium rasterization of retained SVG; no transport calculation'});
	} catch (error) {failure = error;}
	finally {await browser?.close().catch(e => {failure ??= e;}); run.finish(failure ? 'failed' : 'accepted', {failure: failure ? String(failure) : null, measurementParent: source});}
	verifyRun(run.path); console.log(JSON.stringify({run: run.path, metrics})); if (failure) throw failure;
}

/** Run one immutable matched production-cache measurement, preserving failures and parent evidence.
 * @returns {Promise<void>} Accepted pilot or full spectrum comparison; failures seal then reject.
 */
async function main() {
	const stage = process.argv[2] ?? 'pilot', aerosol = stage.startsWith('aerosol-');
	assert.ok(process.argv.length <= 3 && ['pilot', 'full', 'aerosol-pilot', 'aerosol-full'].includes(stage));
	const full = stage.endsWith('full'), started = Date.now();
	const parents = [verifyRun(h40), verifyRun(h42), verifyRun(reportRoot), identity(ciePath)];
	/** Authenticate one already sealed parent artifact. @param {string} relative @returns {unknown} Parsed original data. */
	function input(relative) {const b = readRepository(relative); parents.push(identity(relative, b)); return JSON.parse(b.toString());}
	const physical = /** @type {HorizonLibParent} */(input(h40 + '/registration.json'));
	const summaries = /** @type {HorizonLibSummary[]} */(input(h42 + '/summary.json'));
	const medium = {...physical.medium, mie: physical.medium.mie.map(x => aerosol ? x : 0)};
	assert.deepEqual(physical.origin, [0, 0, medium.radius + 5]);
	assert.equal(medium.geometry, 'spherical'); assert.equal(medium.sourceKind, 'parallel');
	const baseline = Inputs.createInputSet(Inputs.createQualifiedSanJoseNauticalScene(), {solarInterpolation: 'monotone-cubic', numericalPolicy: DistantSunSceneCacheNumerics.createAnchoredRadial()});
	const deploymentRoot = `server/flat32/data/shared-block/${SHARED_PACKAGE_IDENTITY}`;
	const deploymentBytes = readRepository(deploymentRoot + '/package-set.json', SHARED_PACKAGE_REPORT);
	parents.push(identity(deploymentRoot + '/package-set.json', deploymentBytes), identity('server/flat32/features/shared-cache/selection.js'));
	const deployment = /** @type {HorizonProductionDeployment} */(JSON.parse(deploymentBytes.toString()));
	const configurationPath = deploymentRoot + '/' + deployment.configurations[0].path;
	const configurationBytes = readRepository(configurationPath, deployment.configurations[0]); parents.push(identity(configurationPath, configurationBytes));
	const configuration = /** @type {HorizonProductionConfiguration} */(JSON.parse(configurationBytes.toString()));
	assert.equal(baseline.numericalIdentity, configuration.numericalIdentity, 'Compiler controls differ from the selected deployment.');
	assert.equal(SHARED_PACKAGE_SOLAR_INTERPOLATION, 'monotone-cubic');
	const request = structuredClone(baseline.buildRequest), spec = request.transportSpec;
	assert.equal(spec.domains.position.count, 48); assert.equal(spec.domains.incoming.directionCount, 68);
	assert.equal(spec.domains.outgoing.directionCount, 4374); assert.equal(spec.domains.solarZenith.count, 180);
	assert.equal(spec.numerical.transportIntervalCount, 15); assert.equal(spec.numerical.sourcePathTransmittanceIntervalCount, 20);
	assert.equal(spec.planet.bottomRadiusMeters, medium.radius); assert.equal(spec.planet.topRadiusMeters, medium.radius + medium.topAltitude);
	assert.equal(spec.atmosphere.rayleighScaleHeightMeters, medium.rayleighHeight); assert.equal(spec.atmosphere.ozone.maximumDensityPerCubicMeter, 0);
	const matched = {...request, transportSpec: {...spec, source: {...spec.source, spectralIrradianceDensity: medium.sourceIrradiance.map(x => x * medium.incidentScale)},
		atmosphere: {...spec.atmosphere, mieAngstromBeta: aerosol ? spec.atmosphere.mieAngstromBeta : 0},
		domains: {...spec.domains, spectrum: {...spec.domains.spectrum, channels: spec.domains.spectrum.channels.map((c, i) => ({...c, sourceIrradianceDensityWattsPerSquareMeterPerNanometer: medium.sourceIrradiance[i] * medium.incidentScale, rayleighScatteringPerMeter: medium.rayleigh[i], mieExtinctionPerMeter: medium.mie[i], groundAlbedo: 0}))}}}};
	if (aerosol) {
		assert.equal(spec.atmosphere.mieScaleHeightMeters, medium.mieHeight); assert.equal(spec.atmosphere.mieSingleScatteringAlbedo, medium.albedo); assert.equal(spec.atmosphere.miePhaseFunctionG, medium.g);
		medium.mie.forEach((x,i) => assert.ok(Math.abs(x / ((spec.atmosphere.mieAngstromBeta / medium.mieHeight) * (spec.domains.spectrum.channels[i].centerNanometers / 1000) ** -spec.atmosphere.mieAngstromAlpha) - 1) < 1e-12));
	}
	const plan = makePlan(matched, medium);
	const channels = full ? Array.from({length: 15}, (_, i) => i) : [7];
	const control = {request: matched, channels, plan, rayleigh: medium.rayleigh, scaleHeight: medium.rayleighHeight, mie: medium.mie, mieHeight: medium.mieHeight};
	const closure = browserSources([browserEntry]); parents.push(...closure, identity('experiments/sky-accuracy-dials/distant-horizon/production-plan.mjs'));
	const run = createRun(aerosol ? (full ? 'h44-prod-full' : 'h44-prod-pilot') : (full ? 'h43-prod-full' : 'h43-prod-pilot'), {parents, operation: 'Compile unchanged production Native48/Z180/W27/F68 N4, replay canonical cubic packet lookup on hardware and retain fixed Q30/refined view spectra.', parameters: {aerosolFraction: aerosol ? 1 : 0, full, channels, baselineNumericalIdentity: baseline.numericalIdentity, physicalOverrides: ['source and Rayleigh packets matched exactly', aerosol ? '100% canonical aerosol: matching extinction, SSA and Cornette-Shanks' : 'zero aerosol', 'black ground'], maximumMilliseconds: 1800000, lux: physical.lux}});
	console.log(JSON.stringify({run: run.path, channels, sparseCoordinates: plan.coordinates.length, packetRows: plan.rows.length}));
	let browser, failure = null;
	const deadline = setTimeout(() => {failure = new Error('H43 exceeded 30-minute job deadline'); void browser?.close();}, 1800000);
	try {
		run.write('control.json', control); run.write('baseline-request.json', baseline.buildRequest);
		const bundle = await rollup({input: checkedAbsolute(path.join(repositoryRoot, browserEntry))});
		let code; try {code = (await bundle.generate({format: 'iife'})).output[0].code;} finally {await bundle.close();}
		run.write('browser.js.gz', gzipSync(Buffer.from(code)));
		browser = await puppeteer.launch({executablePath: checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')), headless: true, userDataDir: checkedAbsolute(path.join(run.scratchPath, 'chrome-profile'), false), protocolTimeout: 1800000, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--disable-background-timer-throttling']});
		const page = await browser.newPage(); await page.exposeFunction('__h43Progress', message => run.progress('gpu', String(message)));
		await page.addScriptTag({content: code});
		const result = await page.evaluate(c => window.__h43Evaluate(c), control);
		run.write('lookup.glsl', result.fragment); run.write('channels.json.gz', gzipSync(Buffer.from(JSON.stringify(result.reports))));
		let maximumLookupRelative = 0;
		for (const channel of result.reports) {
			const cumulative = new Float32Array(plan.coordinates.length);
			for (let o = 0; o < 4; o++) {channel.pure[o].forEach((x,i) => {cumulative[i] = o === 0 ? x : Math.fround(cumulative[i] + x);});
				plan.jobs.forEach((job, j) => {const expected = replay(job, plan, cumulative, medium.rayleigh[channel.channel], medium.rayleighHeight, medium.mie[channel.channel], medium.mieHeight); maximumLookupRelative = Math.max(maximumLookupRelative, Math.abs(expected - channel.spectra[o][j]) / Math.max(1e-12, Math.abs(expected)));});}
		}
		assert.ok(maximumLookupRelative < 0.001, `GPU lookup differs from same-input binary64 replay: ${maximumLookupRelative}`);
		run.write('compatibility.json', {physicalParent: h40, referenceParent: reportRoot, baselineNumericalIdentity: baseline.numericalIdentity, renderer: result.renderer, maximumLookupRelative, baseline: baseline.buildRequest, matchedRequest: matched, sourceClosure: closure, scope: 'Production compiler and unchanged cubic lookup; explicit production-equation view replay, not an app screenshot. N4 versus external all orders has an order truncation difference.'});
		if (full) {
			if (aerosol) run.write('readings.json', plan.jobs.map((job,j) => ({elevation:job.elevation,intervals:job.intervals,cumulative:[0,1,2,3].map(o=>{const spectrum=result.reports.map(c=>c.spectra[o][j]);return {order:o+1,spectrum,color:colorimetry(spectrum,'bin-integrated')};})})));
			else {
			const rows = [0.05, 3, 20].map(elevation => {
				const j = plan.jobs.findIndex(p => p.elevation === elevation && p.intervals === 30);
				const reference = summaries.find(s => s.id === (elevation === 0.05 ? 'full-fine' : `full-${elevation}`)); assert.ok(reference);
				return {elevation, productionN1: result.reports.map(c => c.spectra[0][j]), productionN4: result.reports.map(c => c.spectra[3][j]), reference: reference.meanSpectrum};
			});
			const all = plan.jobs.map((job, j) => ({elevation: job.elevation, intervals: job.intervals, cumulative: [0,1,2,3].map(o => {const spectrum = result.reports.map(c => c.spectra[o][j]); return {order: o + 1, spectrum, color: colorimetry(spectrum, 'bin-integrated')};})}));
			run.write('readings.json', all); run.write('comparison.svg', figure(rows, physical.lux));
			run.write('comparison.json', rows.map(r => ({...r, productionN1Color: colorimetry([...r.productionN1], 'bin-integrated'), productionN4Color: colorimetry([...r.productionN4], 'bin-integrated'), referenceColor: colorimetry([...r.reference], 'bin-integrated')})));
			const centers = matched.transportSpec.domains.spectrum.channels.map(c => c.centerNanometers);
			run.write('spectra.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="795"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="30" y="28" font-size="21">Matched production/reference spectral radiance</text>${rows.map((r,i) => {
				const maximum = Math.max(...r.reference, ...r.productionN4) * 1.1, top = 65 + i * 230, bottom = top + 170;
				return `<text x="45" y="${top}">${r.elevation}° away-Sun; ${maximum.toFixed(3)} W m^-2 sr^-1 nm^-1</text><path d="M65 ${top+10}V${bottom}H1000" fill="none" stroke="#999"/>${[r.productionN1,r.productionN4,r.reference].map((s,j)=>`<path d="${s.map((v,k)=>`${k?'L':'M'}${65+(centers[k]-centers[0])/(centers.at(-1)-centers[0])*935},${bottom-v/maximum*155}`).join(' ')}" fill="none" stroke="${['#b87720','#b22561','#166ec1'][j]}" stroke-width="2"/>`).join('')}<text x="65" y="${bottom+20}">${centers[0].toFixed(1)} nm</text><text x="920" y="${bottom+20}">${centers.at(-1).toFixed(1)} nm</text>`;
			}).join('')}<text x="65" y="775" fill="#b87720">Production N1 / Q30</text><text x="370" y="775" fill="#b22561">Production N4 / Q30</text><text x="680" y="775" fill="#166ec1">libRadtran all orders</text></g></svg>`);
			}
		}
		run.write('tool.json', {node: process.version, browser: await browser.version(), renderer: result.renderer});
	} catch (error) {failure = error;}
	finally {clearTimeout(deadline); await browser?.close().catch(e => {failure ??= e;}); run.finish(failure ? 'failed' : 'accepted', {failure: failure ? String(failure) : null, elapsedMilliseconds: Date.now() - started, full});}
	verifyRun(run.path); console.log(JSON.stringify({run: run.path, failure: failure ? String(failure) : null, elapsedMilliseconds: Date.now() - started})); if (failure) throw failure;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
	if (process.argv[2] === 'report') await report(); else if (process.argv[2] === 'colors') await displayComparison(); else await main();
}
