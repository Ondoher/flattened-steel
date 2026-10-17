import assert from 'node:assert/strict';
import path from 'node:path';
import puppeteer from 'puppeteer';
import {createRun,identity,readRepository,verifyRun,checkedAbsolute} from '../io/files.mjs';
import {browserSources} from '../execution.mjs';
import {colorimetry,ciePath} from '../horizon/diagnosis-color.mjs';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/index.js';
import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';

/** One saved first/full pair; the independent N1 solver differs from the full solver.
 * @typedef {object} OrderDisplayRow
 * @property {number} elevation View elevation in degrees, away from the Sun.
 * @property {'production'|'independent'} kind Calculation family.
 * @property {readonly number[]} first Saved Native15 N1 radiance.
 * @property {readonly number[]} full Saved Native15 cumulative N4 or external all-order radiance.
 * @property {string} firstLabel Exact first-order evaluator.
 * @property {string} fullLabel Exact cumulative evaluator.
 */

const root='tmp/experiments/sky-accuracy-dials/runs/';
const production=root+'00310-h45-toronto-prod',reference=root+'00315-h45-toronto-ref',report=root+'00316-h45-report',physical=root+'00288-h40-distant';
const centers=NATIVE_15_SPECTRAL_BASIS.channels.map(c=>c.center.value);
const display=new ColorResetSlope078P2ColorDisplayModel();

/** Convert retained radiance through the same complete p2 spectral/display convention as H45.
 * @param {readonly number[]} spectrum Native15 radiance; no normalization.
 * @param {number} lux Unchanged registered illumination.
 * @returns {number[]} Encoded RGB8 values, with gamma/display encoding applied once.
 */
function rgb(spectrum,lux){
	assert.equal(spectrum.length,15);assert.ok(spectrum.every(v=>Number.isFinite(v)&&v>=0));
	return display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */([...colorimetry([...spectrum],'midpoint',false).rgb]),{value:lux,units:'lux'}).map(v=>Math.round(v*255));
}

/** Paired physical-brightness swatches, separating order and solver identities explicitly.
 * @param {readonly OrderDisplayRow[]} rows Saved spectral pairs in display order.
 * @param {number} lux Fixed display illumination.
 * @returns {{svg:string,height:number}} Standalone figure with exact encoded colors.
 */
function swatches(rows,lux){
	const height=195+rows.length*145;
	const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="${height}"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="20" y="30" font-size="23">Toronto aerosol: first-order versus full scattering</text><text x="20" y="56" font-size="14">Same away-Sun rays, material and fixed production p2 display. No exposure fitting or equal-Y scaling.</text><text x="220" y="91" font-size="19">First scattering only — N1</text><text x="665" y="91" font-size="19">Full scattering — N4 / all orders</text>${rows.map((r,i)=>{const y=115+i*145;return `<text x="20" y="${y+34}" font-size="17">${r.kind==='production'?'Production algorithm':'Independent calculations'}</text><text x="20" y="${y+60}" font-size="15">${r.elevation}° elevation</text>${[r.first,r.full].map((s,j)=>{const color=colorimetry([...s],'bin-integrated'),codes=rgb(s,lux),x=220+j*445;return `<text x="${x}" y="${y-6}" font-size="13">${j?r.fullLabel:r.firstLabel}</text><rect x="${x}" y="${y}" width="420" height="88" fill="rgb(${codes.join(',')})"/><text x="${x}" y="${y+108}" font-size="13">Y ${color.luminanceCdPerM2.toFixed(0)} cd/m² · R/B ${color.redBlueRatio.toFixed(3)} · RGB ${codes.join(', ')}</text>`;}).join('')}`;}).join('')}<text x="20" y="${height-43}" font-size="13">Independent N1: continuous direct integration. Independent full: libRadtran all orders.</text><text x="20" y="${height-21}" font-size="13">Production full is cumulative N4. Solved spectral colors, not screenshots. Toronto properties apply above 440 nm.</text></g></svg>`;
	return {svg,height};
}

/** Plot the actual first/full spectra in adjacent columns, with the same radiance scale per elevation.
 * @param {readonly OrderDisplayRow[]} rows Saved spectral pairs.
 * @returns {{svg:string,height:number}} Reproducible scientific figure; no smoothed synthetic data.
 */
function spectra(rows){
	const elevations=[0.05,3,20],height=955;
	const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="${height}"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="20" y="30" font-size="23">Toronto aerosol spectra: first order beside full scattering</text><text x="20" y="56" font-size="14">Both columns share the same vertical radiance scale within each elevation. Native15 spectral samples.</text><text x="80" y="90" font-size="19">First scattering only — N1</text><text x="630" y="90" font-size="19">Full scattering — N4 / all orders</text>${elevations.map((e,i)=>{const selected=rows.filter(r=>r.elevation===e);assert.equal(selected.length,2);const top=120+i*250,bottom=top+175,maximum=Math.max(...selected.flatMap(r=>[...r.first,...r.full]))*1.08;return `<text x="20" y="${top-10}" font-size="16">${e}° elevation</text>${[0,1].map(j=>{const x=75+j*550,width=460;return `<path d="M${x} ${top}V${bottom}H${x+width}" stroke="#777" fill="none"/>${[0,0.5,1].map(f=>`<path d="M${x} ${bottom-f*175}H${x+width}" stroke="#ddd"/><text x="${x-8}" y="${bottom-f*175+4}" text-anchor="end" font-size="11">${(maximum*f).toFixed(3)}</text>`).join('')}${selected.map(r=>{const values=j?r.full:r.first;return `<path d="${values.map((v,c)=>`${c?'L':'M'}${x+(centers[c]-centers[0])/(centers.at(-1)-centers[0])*width},${bottom-v/maximum*175}`).join(' ')}" stroke="${r.kind==='production'?'#b22561':'#166ec1'}" stroke-width="2.4" fill="none"/>`;}).join('')}<text x="${x}" y="${bottom+20}" font-size="12">${centers[0].toFixed(1)} nm</text><text x="${x+width}" y="${bottom+20}" text-anchor="end" font-size="12">${centers.at(-1).toFixed(1)} nm</text><text x="${x}" y="${bottom+42}" font-size="12">Radiance: W m⁻² sr⁻¹ nm⁻¹</text>`;}).join('')}`;}).join('')}<text x="25" y="902" fill="#b22561" font-size="15">Production algorithm: N1 / N4</text><text x="520" y="902" fill="#166ec1" font-size="15">Independent: direct N1 / libRadtran all orders</text><text x="25" y="932" font-size="13">N1 is not a libRadtran first-order run. Full columns retain different scattering-order limits.</text></g></svg>`;
	return {svg,height};
}

/** Derive display evidence solely from authenticated H45 spectra; every output belongs to a new run.
 * @returns {Promise<void>} Accepted spectral/color figures; browser failures seal and reject the run.
 */
async function main(){
	assert.equal(process.argv.length,2);
	const parents=[production,reference,report,physical].map(verifyRun);
	/** Read one authenticated parent artifact. @param {string} p @returns {unknown} Saved parsed value. */
	function read(p){const bytes=readRepository(p);parents.push(identity(p,bytes));return JSON.parse(bytes.toString());}
	const readings=/** @type {HorizonProductionReading[]} */(read(production+'/readings.json'));
	const diagnostic=/** @type {{independentN1:{elevation:number,spectrum:number[]}[]}} */(read(report+'/diagnostics.json'));
	const summary=/** @type {HorizonLibSummary[]} */(read(reference+'/summary.json'));
	const registration=/** @type {HorizonLibParent} */(read(physical+'/registration.json'));
	parents.push(identity(ciePath),...browserSources(['src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js']));
	const rows=/** @type {OrderDisplayRow[]} */([]);
	for(const elevation of [0.05,3,20]){
		const p=readings.find(r=>r.elevation===elevation&&r.intervals===30),n1=diagnostic.independentN1.find(r=>r.elevation===elevation),full=summary.find(r=>r.id===(elevation===0.05?'full-fine':`full-${elevation}`));assert.ok(p&&n1&&full);
		rows.push({elevation,kind:'production',first:p.cumulative[0].spectrum,full:p.cumulative[3].spectrum,firstLabel:'Production algorithm N1 / Q30',fullLabel:'Production algorithm N4 / Q30'});
		rows.push({elevation,kind:'independent',first:n1.spectrum,full:full.meanSpectrum,firstLabel:'Independent direct integral N1 / Q4096',fullLabel:'libRadtran all orders / four seeds'});
	}
	const run=createRun('h45-order-view',{parents,operation:'Reuse accepted Toronto N1, N4 and external all-order Native15 spectra; produce first/full paired swatches and scientific spectral plots at identical registered display settings. No transport or cache compilation rerun.',parameters:{lux:registration.lux,firstIndependent:'Direct continuous integral from00316 diagnostics; not libRadtran N1',fullIndependent:'libRadtran all orders from00315; refined horizon layers',production:'Saved00310 Q30 cumulative N1 and N4',display:'Native midpoint CIE and selected production p2; same illumination, no fitted exposure, normalization or white balance'}});
	let browser,failure=null;
	try{
		run.write('colors.json',{lux:registration.lux,rows:rows.map(r=>({...r,firstColor:colorimetry([...r.first],'bin-integrated'),fullColor:colorimetry([...r.full],'bin-integrated'),firstRgb:rgb(r.first,registration.lux),fullRgb:rgb(r.full,registration.lux)}))});
		const figures=[{name:'horizon',...swatches(rows.filter(r=>r.elevation===0.05),registration.lux)},{name:'all-elevations',...swatches(rows,registration.lux)},{name:'spectra',...spectra(rows)}];
		browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'chrome-profile'),false),args:['--enable-gpu','--use-angle=d3d11']});
		const page=await browser.newPage();for(const figure of figures){run.progress('render',figure.name);run.write(figure.name+'.svg',figure.svg);await page.setViewport({width:1120,height:figure.height,deviceScaleFactor:1});await page.setContent('<style>body{margin:0}</style>'+figure.svg);run.write(figure.name+'.png',Buffer.from(await page.screenshot({type:'png'})));}
		run.write('tool.json',{node:process.version,browser:await browser.version(),operation:'Rasterize deterministic encoded SVG colors and retained spectral polylines to PNG.'});
	}catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,noTransportRerun:true});}
	verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
}

await main();
