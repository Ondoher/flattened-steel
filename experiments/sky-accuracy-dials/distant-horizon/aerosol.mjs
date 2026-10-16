import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {gzipSync} from 'node:zlib';
import puppeteer from 'puppeteer';
import {createRun,identity,readRepository,verifyRun,checkedAbsolute,storage} from '../io/files.mjs';
import {direct,boundary,proofs} from '../horizon-reference/math.mjs';
import {colorimetry,colorControls,ciePath} from '../horizon/diagnosis-color.mjs';
import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';
import {fragment,execute} from './gpu.mjs';

const {PNG}=createRequire(import.meta.url)('pngjs');

/** Measure spherical distant-Sun aerosol removal using matched independent N1 rays and GPU sky views.
 * @returns {Promise<void>} Verified new evidence; failed controls are sealed and rejected, browser/scratch retire.
 */
async function main(){
	const started=Date.now(),root='tmp/experiments/sky-accuracy-dials/runs/';
	const registrationRoot=root+'00264-h16-h20-audit',observationRoot=root+'00239-horizon-stages';
	const parents=[verifyRun(registrationRoot),verifyRun(observationRoot),verifyRun(root+'00287-h39-aerosol')];
	/** Read immutable parent data and record exact derivation identity.
	 * @param {string} p Repository-relative artifact. @returns {unknown} Parsed packet; authentication failures propagate.
	 */
	function input(p){const b=readRepository(p);parents.push(identity(p,b));return JSON.parse(b.toString());}
	const registered=/** @type {HorizonReferenceParent} */(input(registrationRoot+'/registration.json'));
	const observation=/** @type {HorizonObservation} */(input(observationRoot+'/distant-observation.json'));
	const state=/** @type {{locationLabel:string,timeLabel:string,modeKind:string}} */(observation.facts.state);
	assert.equal(state.locationLabel,'San Jose');assert.equal(state.timeLabel,'Solar noon');assert.equal(state.modeKind,'spherical-distant');
	const m=registered.inputs[1],origin=[0,0,m.radius+5];
	assert.equal(m.geometry,'spherical');assert.equal(m.sourceKind,'parallel');assert.ok(Math.abs(m.sourceDirection[0])<1e-12&&m.sourceDirection[1]<0);
	assert.equal(m.mieHeight,1200);assert.equal(m.albedo,0.8);assert.equal(m.g,0.7);
	const uniforms=/** @type {Record<string,unknown>} */(observation.facts.uniforms);
	const lux=Number(uniforms.uColorResetTotalHorizontalIlluminanceLux);assert.ok(Number.isFinite(lux)&&lux>0);
	const display=new ColorResetSlope078P2ColorDisplayModel(),visited=new Set();
	/** Authenticate the display's static local dependency graph, with bounded checked reads.
	 * @param {string} p Repository-relative source. @returns {void} Adds unique dependencies; read failures abort.
	 */
	function dependency(p){if(visited.has(p))return;visited.add(p);const b=readRepository(p);parents.push(identity(p,b));
		for(const match of b.toString().matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g))dependency(path.posix.normalize(path.posix.join(path.posix.dirname(p),match[1])));}
	dependency('src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js');
	for(const p of [ciePath,'package-lock.json','node_modules/pngjs/package.json','node_modules/pngjs/lib/png.js','agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/distant-aerosol-results.md'])parents.push(identity(p));
	const rgb=Array.from({length:15},(_,k)=>colorimetry(Array.from({length:15},(_,j)=>k===j?1:0),'bin-integrated').rgb);
	const shader=fragment(m,rgb),width=480,height=240;
	const run=createRun('h40-distant',{parents,operation:'Independent spherical/parallel N1 physical sensitivity: remove both aerosol extinction and scattering; fixed Sun, Rayleigh atmosphere, physical boundaries, bin-integrated CIE, p2 display and baseline lux. Hardware GPU angular sky images, not app screenshots or cache rebuilds.',
		parameters:{fractions:[1,0],nodes:[64,128],gpu:{viewNodes:64,columnNodes:32,width,height,elevationDegrees:[0.05,25],headingFromSunDegrees:[150,210]},lux,maximumMilliseconds:600000,relativeTolerance:0.002,brightnessThreshold:0.01,order:1,origin}});
	console.log(JSON.stringify({run:run.path}));let browser,failure=null;const cases=/** @type {LocalAerosolCase[]} */([]);
	const deadline=setTimeout(()=>{failure=new Error('Distant aerosol job exceeded ten minutes');void browser?.close();},600000);
	try{
		run.write('registration.json',{medium:m,origin,lux,display:display.id,rgbWeights:rgb});
		run.write('controls.json',{transport:proofs(registered.inputs),color:colorControls()});
		for(const fraction of [1,0]){
			const medium={...m,mie:m.mie.map(x=>x*fraction)},rows=[];
			for(const heading of ['toward','cross','away'])for(const elevation of [0.05,0.25,1,3,10,20]){
				run.progress('rays',`${fraction*100}% aerosol, ${heading} ${elevation} degrees`,rows.length,18);
				const e=elevation*Math.PI/180,a=['toward','cross','away'].indexOf(heading)*Math.PI/2;
				const direction=[Math.sin(a)*Math.cos(e),-Math.cos(a)*Math.cos(e),Math.sin(e)],end=boundary(medium,origin,direction).distance;
				const groups=Array.from({length:15},(_,channel)=>({id:'h40',medium,origin,direction,end,channel}));
				const fine=groups.map(g=>direct(g,128)),spectrum=fine.map(x=>x.total),coarse=groups.map(g=>direct(g,64).total);
				const refinement=Math.max(...spectrum.map((x,k)=>Math.abs(x-coarse[k])/Math.max(1e-10,Math.abs(x))));
				assert.ok(refinement<0.002,'Binary64 ray quadrature not converged');assert.ok(Date.now()-started<600000);
				const color=colorimetry(spectrum,'bin-integrated');rows.push({heading,elevation,direction,end,spectrum,color,extendedColor:color,refinement,
					species:[0,1].map(s=>fine.map(x=>x.species[s])),bins:Array.from({length:6},(_,b)=>fine.map(x=>x.bins[b]))});
				await new Promise(resolve=>setImmediate(resolve));
			}cases.push({fraction,medium,rows});
		}
		run.write('rays.json',cases);
		const summary=cases.map(item=>({fraction:item.fraction,rays:item.rows.map((r,k)=>({heading:r.heading,elevation:r.elevation,Y:r.color.luminanceCdPerM2,xy:r.color.xy,relativeY:r.color.luminanceCdPerM2/cases[0].rows[k].color.luminanceCdPerM2-1,
			speciesY:r.species.map(s=>colorimetry(s,'bin-integrated').luminanceCdPerM2),within50km:r.bins.slice(0,2).reduce((sum,s)=>sum+colorimetry(s,'bin-integrated').luminanceCdPerM2,0)/r.color.luminanceCdPerM2,refinement:r.refinement})),
			ratios:['toward','cross','away'].map(heading=>{const find=e=>item.rows.find(r=>r.heading===heading&&r.elevation===e).color.luminanceCdPerM2;return {heading,horizonOver3:find(0.05)/find(3),horizonOver10:find(0.05)/find(10)};})}));
		run.write('summary.json',summary);run.progress('gpu','Render matched independent spherical sky images on hardware.');
		const chrome=checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe'));
		browser=await puppeteer.launch({executablePath:chrome,headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'chrome-profile'),false),protocolTimeout:600000,args:['--enable-gpu','--ignore-gpu-blocklist','--use-angle=d3d11','--disable-background-timer-throttling']});
		const page=await browser.newPage();run.write('shader.glsl',shader);
		const result=await page.evaluate(execute,{shader,width,height,directions:cases[0].rows.map(r=>r.direction)}),images=[];
		for(const item of result.cases){
			const expected=cases.find(c=>c.fraction===item.fraction);
			const parity=item.spectra.map((s,k)=>({heading:expected.rows[k].heading,elevation:expected.rows[k].elevation,maximumRelative:Math.max(...s.map((x,c)=>Math.abs(x-expected.rows[k].spectrum[c])/Math.max(1e-10,Math.abs(expected.rows[k].spectrum[c]))))}));
			run.write(`aerosol-${item.fraction*100}-parity.json`,parity);assert.ok(parity.every(r=>r.maximumRelative<0.002),'GPU spectra failed independent parity');
			run.write(`aerosol-${item.fraction*100}-linear.f32.gz`,gzipSync(Buffer.from(Float32Array.from(item.pixels).buffer)));
			const png=new PNG({width,height});
			for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=4*(y*width+x),j=4*((height-1-y)*width+x);
				const v=display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */(item.pixels.slice(i,i+3)),{value:lux,units:'lux'});
				for(let c=0;c<3;c++)png.data[j+c]=Math.round(v[c]*255);png.data[j+3]=255;}
			const image=PNG.sync.write(png);run.write(`aerosol-${item.fraction*100}.png`,image);images.push(image);
		}
		run.write('comparison.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="1010" height="335"><rect width="1010" height="335" fill="white"/><g font-family="sans-serif" fill="#111"><text x="15" y="24" font-size="19">Distant Sun at San Jose noon: independent spherical N1</text>${images.map((b,k)=>`<text x="${15+500*k}" y="48">${[100,0][k]}% aerosol</text><image x="${15+500*k}" y="58" width="480" height="240" href="data:image/png;base64,${b.toString('base64')}"/>`).join('')}<text x="15" y="320">Sky only, 0.05 to 25 degrees elevation, away-Sun view; fixed physical source and display. No cache change.</text></g></svg>`);
		run.write('compatibility.json',{physicalParent:registrationRoot,observationParent:observationRoot,localComparison:root+'00287-h39-aerosol',scope:'Matched independent N1 physical intervention; no full production-cache or all-order inference',renderer:result.renderer,gpuMilliseconds:result.milliseconds});
		run.write('tool.json',{node:process.version,nodePath:process.execPath,chrome,browser:await browser.version()});
	}catch(error){failure=error;}
	finally{clearTimeout(deadline);await browser?.close().catch(e=>{failure??=e;});run.finish(failure?'failed':'accepted',{elapsedMilliseconds:Date.now()-started,failure:failure?String(failure):null,cases:cases.length});}
	verifyRun(run.path);const seal=JSON.parse(readRepository(run.path+'/sealed.json').toString());assert.equal(seal.state,'accepted');console.log(JSON.stringify({run:run.path,elapsedMilliseconds:Date.now()-started,storage:storage()}));if(failure)throw failure;
}

await main();
