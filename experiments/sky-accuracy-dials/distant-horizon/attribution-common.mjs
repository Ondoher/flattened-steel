import assert from 'node:assert/strict';
import path from 'node:path';
import puppeteer from 'puppeteer';
import {verifyRun,identity,readRepository,checkedAbsolute} from '../io/files.mjs';
import {colorimetry,ciePath} from '../horizon/diagnosis-color.mjs';
import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/index.js';

export const runRoot='tmp/experiments/sky-accuracy-dials/runs/';
export const productionParent=runRoot+'00310-h45-toronto-prod',gpuParent=runRoot+'00323-h47-gpu-orders';
export const centers=NATIVE_15_SPECTRAL_BASIS.channels.map(c=>c.center.value);

/** Authenticate the physical target and reusable spectral parents.
 * @returns {{parents:DialFileIdentity[],physical:HorizonLibParent,control:HorizonProductionControl,production:HorizonProductionReading[],batches:(HorizonReferenceBatch&{channel:number})[]}}
 */
export function inputs(){
 const parents=[productionParent,gpuParent,runRoot+'00288-h40-distant'].map(verifyRun);
 /** @param {string} p @returns {unknown} Authenticated parsed data. */
 function read(p){const b=readRepository(p);parents.push(identity(p,b));return JSON.parse(b.toString());}
 parents.push(identity(ciePath),identity('src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js'));
 return {parents,physical:/** @type {HorizonLibParent} */(read(runRoot+'00288-h40-distant/registration.json')),control:/** @type {HorizonProductionControl} */(read(productionParent+'/control.json')),production:/** @type {HorizonProductionReading[]} */(read(productionParent+'/readings.json')),batches:/** @type {(HorizonReferenceBatch&{channel:number})[]} */(read(gpuParent+'/batches.json'))};
}

/** Fixed production p2 conversion, with no fitted exposure or chromatic adaptation.
 * @param {readonly number[]} s @param {number} lux @returns {number[]} Display RGB8.
 */
export function rgb(s,lux){
 const display=new ColorResetSlope078P2ColorDisplayModel();
 return display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */([...colorimetry([...s],'midpoint',false).rgb]),{value:lux,units:'lux'}).map(x=>Math.round(255*x));
}

/** Rasterize deterministic scientific figures under the active immutable-run owner.
 * @param {DialRun} run @param {{name:string,svg:string,width:number,height:number}[]} figures
 * @returns {Promise<void>} All images retained, browser always closed.
 */
export async function render(run,figures){
 let browser;
 try{
  browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'figures'),false),args:['--enable-gpu','--use-angle=d3d11']});
  const page=await browser.newPage();
  for(const f of figures){run.progress('render',f.name);run.write(f.name+'.svg',f.svg);await page.setViewport({width:f.width,height:f.height,deviceScaleFactor:1});await page.setContent('<style>body{margin:0}</style>'+f.svg);run.write(f.name+'.png',Buffer.from(await page.screenshot({type:'png'})));}
  run.write('render-tool.json',{node:process.version,browser:await browser.version(),operation:'Rasterize authored scientific plots; no transport computation or invented image content.'});
 }finally{await browser?.close();}
}

/** Compact signed-spectrum panel with exact point samples joined by straight segments.
 * @param {{s:readonly number[],color:string,dash?:boolean}[]} curves @param {number} x @param {number} y
 * @param {number} w @param {number} h @param {number} [minimum=0] @returns {string} SVG axes and curves.
 */
export function panel(curves,x,y,w,h,minimum=0){
 assert.ok(curves.length);const maximum=Math.max(...curves.flatMap(c=>[...c.s]))*1.05;
 const lo=Math.min(minimum,...curves.flatMap(c=>[...c.s])),range=Math.max(1e-12,maximum-lo);
 const px=c=>x+(centers[c]-centers[0])/(centers.at(-1)-centers[0])*w,py=v=>y+h-(v-lo)/range*h;
 return `<path d="M${x} ${y}V${y+h}H${x+w}" stroke="#999" fill="none"/>${[0,.5,1].map(t=>`<path d="M${x} ${py(lo+t*range)}H${x+w}" stroke="#ddd"/><text x="${x-8}" y="${py(lo+t*range)+4}" text-anchor="end" font-size="12">${(lo+t*range).toFixed(4)}</text>`).join('')}${curves.map(c=>`<path d="${c.s.map((v,i)=>`${i?'L':'M'}${px(i)},${py(v)}`).join(' ')}" fill="none" stroke="${c.color}" stroke-width="2.4" ${c.dash?'stroke-dasharray="7 5"':''}/>`).join('')}<text x="${x}" y="${y+h+20}" font-size="12">${centers[0].toFixed(1)} to ${centers.at(-1).toFixed(1)} nm</text>`;
}
