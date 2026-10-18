import assert from 'node:assert/strict';
import path from 'node:path';
import puppeteer from 'puppeteer';
import {createRun,verifyRun,readRepository,identity,checkedAbsolute} from '../io/files.mjs';
import {colorimetry} from '../horizon/diagnosis-color.mjs';
import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';

const source=process.argv[2];assert.ok(source);const parents=[verifyRun(source),identity(source+'/analysis.json'),identity(source+'/comparison.svg')];
const analysis=JSON.parse(readRepository(source+'/analysis.json').toString()),display=new ColorResetSlope078P2ColorDisplayModel(),scale=1/8;
const colors=analysis.rows.flatMap(r=>[...r.cache.map(c=>c.spectrum),r.metrics[3].spectrum,r.metrics[4].spectrum,r.reference.meanSpectrum].map(s=>display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */(colorimetry(s,'midpoint',false).rgb.map(x=>x*scale)),{value:r.scene.displayLux,units:'lux'}).map(x=>Math.round(255*x))));
let index=0;const svg=readRepository(source+'/comparison.svg').toString().replace(/fill="rgb\([^"]+\)"/g,()=>`fill="rgb(${colors[index++].join(',')})"`).replace('Toronto: pre-sunset and sunset independent comparison','Toronto: shared lower-exposure comparison').replace('Same rays and fixed sunset P2 display; Y cd/m2; +/- empirical95% sampling interval.','All methods/times: shared -3stop preview (radiance scale1/8 before P2); physical Y labels unchanged.');assert.equal(index,colors.length);assert.equal(index,30);
const run=createRun('h65-exposure',{parents,operation:'Image-only derivative of qualified H65 spectra. One fixed1/8 scale on projected linear RGB for all30 swatches, then unchanged P2 display. No physical radiance, luminance label, uncertainty, source spectrum or per-method relative scaling changes.',parameters:{source,scale,stops:-3,colorArtifact:'colors.json'}});
let browser,failure=null;
try{
 run.write('colors.json',{colors,scale,physicalLabelsUnchanged:true});run.write('comparison-low.svg',svg);
 browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'images'),false)});const page=await browser.newPage();await page.setViewport({width:1540,height:1010});await page.setContent('<style>body{margin:0}</style>'+svg);run.write('comparison-low.png',await page.screenshot({type:'png'}));
}catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
