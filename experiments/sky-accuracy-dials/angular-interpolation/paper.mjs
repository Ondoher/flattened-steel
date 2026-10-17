import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import path from 'node:path';
import puppeteer from 'puppeteer';
import {createRun,readRepository,verifyRun,identity,checkedAbsolute,repositoryRoot} from '../io/files.mjs';
import {loadCase,jointPath,basePath,caseBoundary,measurements} from '../paper-b1/diagnosis-data.mjs';
import {scoreBoundary} from '../analysis/metrics.mjs';
import {prepareRay,evaluateRay} from './reconstruction.mjs';

const figureUrl=new URL('../../../scripts/experiments/b1-directional-sky-radiance/figure5.js',import.meta.url).href;
/** @type {B1FigureApi} */
const {FIGURE5_SCENES,renderAlgorithm32Figure5Panel}=await import(figureUrl);

/** Canonical grid mapping shared with the existing B1 renderer. @param {DialAnalysisBoundary} b @param {string} time @returns {number[][][]} */
function grid(b,time){const t=b.times.indexOf(time);assert.ok(t>=0);return Array.from({length:9},(_,x)=>Array.from({length:9},(_,y)=>Array.from({length:40},(_,c)=>b.values[(t*81+y*9+x)*40+c])));}

/** Full registered B1 readout diagnostic, preserving compiled N2-N4 and the measured-paper score target.
 * @returns {Promise<void>}
 */
async function main(){
 const root=process.argv[2];assert.ok(root);const seal=verifyRun(root),control=JSON.parse(readRepository(root+'/control.json').toString());assert.deepEqual(control.channels,Array.from({length:40},(_,i)=>i));assert.equal(control.patch,null);assert.equal(control.retainBases,true);
 const corrected=loadCase(jointPath),original=loadCase(basePath),baseline=caseBoundary(corrected),old=caseBoundary(original),measured=measurements();
 const run=createRun('h59-b1',{parents:[seal,corrected.seal,original.seal,measured.sourceIdentity,identity('experiments/sky-accuracy-dials/angular-interpolation/reconstruction.mjs'),identity('scripts/experiments/b1-directional-sky-radiance/figure5.js')],operation:'Full1377-ray Direct40 frozen-increment test: C4_angle=C4_corrected-C1_corrected+C1_exactAngle. Exact retained GPU direct-base coefficients; same Q30, altitude and solar operators. Validate binary64 phase readout against native GPU controls before scoring. No recurrence or atmosphere changes.',parameters:{root,channelCount:40,scoreChannels:[0,30],readoutReplayTolerance:5e-6,globalScope:'General factored-N1 readout diagnostic; not a production implementation or twilight qualification.'}});
 let failure=null,browser;const start=performance.now();
 try{
 const channels=control.channels.map(ch=>JSON.parse(gunzipSync(readRepository(root+`/channel-${String(ch).padStart(2,'0')}.json.gz`)).toString()));
 let nativeReplay=0,directReplay=0,allNativeReplay=0;
 for(const d of channels)for(let i=0;i<3;i++){const w=control.witnesses[i],p=prepareRay(control.request,control.scenes[w.t],w.x,w.y),r=evaluateRay(control.request,p,d.channel,d.directBases);nativeReplay=Math.max(nativeReplay,Math.abs(r.native/d.native[0][i]-1));directReplay=Math.max(directReplay,Math.abs(r.direct/d.direct[0][i]-1));}
 assert.ok(nativeReplay<5e-6&&directReplay<5e-6,`Controlled CPU/GPU phase replay ${nativeReplay},${directReplay}`);
 const values=new Float64Array(baseline.values),n1Angle=new Float64Array(values.length),n1Native=new Float64Array(values.length);
 for(let t=0;t<17;t++){for(let x=0;x<9;x++)for(let y=0;y<9;y++){
 const prepared=prepareRay(control.request,control.scenes[t],x,y);
 for(const d of channels){const r=evaluateRay(control.request,prepared,d.channel,d.directBases),at=(t*81+y*9+x)*40+d.channel,oldN1=corrected.channels[d.channel].values[t*81+x*9+y];allNativeReplay=Math.max(allNativeReplay,Math.abs(r.native/oldN1-1));n1Angle[at]=r.direct;n1Native[at]=r.native;values[at]=baseline.values[at]-oldN1+r.direct;}
 }run.progress('boundary',`Full B1 time ${control.scenes[t].time} reconstructed`,t+1,17);console.log(JSON.stringify({time:control.scenes[t].time,allNativeReplay}));}
 assert.ok(allNativeReplay<5e-6,`Full native N1 replay ${allNativeReplay}`);
 const artifact=run.write('candidate-values.f64',Buffer.from(values.buffer)),candidate={...baseline,configId:'h59-factored-n1-angle-readout',values,sourceIdentity:artifact};
 run.write('n1-angle.f64',Buffer.from(n1Angle.buffer));run.write('n1-native.f64',Buffer.from(n1Native.buffer));
 const scores=[scoreBoundary(old,measured),scoreBoundary(baseline,measured),scoreBoundary(candidate,measured)];assert.ok(scores.every(s=>s.fullRegisteredBoundary&&s.sampleCount===42687));
 run.write('scores.json',{original:scores[0],corrected:scores[1],angle:scores[2]});run.write('proof.json',{nativeReplay,directReplay,allNativeReplay,maximumAllowed:5e-6,witnessCount:120,completeBoundary:1377*40,operator:'Frozen compiled later-order increment; only N1 readout changes.',milliseconds:performance.now()-start,promotionGate:scores[2].aggregateRmseMilliwatt<=scores[0].aggregateRmseMilliwatt});
 const lines=['time\toriginal40_RMSE_mW\tcorrected60_RMSE_mW\texactAngleN1_RMSE_mW\tdelta_vs_corrected_mW'];for(let t=0;t<17;t++)lines.push([baseline.times[t],...scores.map(s=>s.conditions[t].rmseMilliwatt),scores[2].conditions[t].rmseMilliwatt-scores[1].conditions[t].rmseMilliwatt].join('\t'));lines.push(['aggregate',...scores.map(s=>s.aggregateRmseMilliwatt),scores[2].aggregateRmseMilliwatt-scores[1].aggregateRmseMilliwatt].join('\t'));run.write('interval-rmse.tsv',lines.join('\n')+'\n');
 const panels=[old,baseline,candidate].map((b,i)=>FIGURE5_SCENES.map(scene=>{const p=renderAlgorithm32Figure5Panel(grid(b,scene.time),grid(measured,scene.time),scene);const score=scores[i].conditions.find(c=>c.time===scene.time);assert.ok(Math.abs(p.score.rmseMilliwatt-score.rmseMilliwatt)<1e-10);run.write(`dome-${i}-${scene.fileTime}.png`,p.png);return p;}));
 let svg='<svg xmlns="http://www.w3.org/2000/svg" width="1160" height="1130"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif"><text x="20" y="30" font-size="22">B1 Figure5 error domes: N1 angular readout diagnostic</text><text x="20" y="55">Color is band-integrated relative error versus measured spectra, not sky display color.</text>';
 ['Original40','Corrected60','Corrected60 + exact-angle N1'].forEach((label,i)=>{svg+=`<text x="${35+i*380}" y="85" font-size="15">${label}</text>`;});
 FIGURE5_SCENES.forEach((scene,j)=>panels.forEach((set,i)=>{const p=set[j];svg+=`<image x="${25+i*380}" y="${110+j*330}" width="300" height="300" href="data:image/png;base64,${p.png.toString('base64')}"/><text x="${25+i*380}" y="${425+j*330}" font-size="13">${scene.time}: RMSE ${p.score.rmseMilliwatt.toFixed(4)} mW</text>`;}));svg+='</g></svg>';run.write('dome-comparison.svg',svg);
 browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'figures'),false)});const page=await browser.newPage();await page.setViewport({width:1160,height:1130,deviceScaleFactor:1});await page.setContent('<style>body{margin:0}</style>'+svg);await page.evaluate(async()=>{await Promise.all(Array.from(document.images).map(im=>im.decode()));});run.write('dome-comparison.png',Buffer.from(await page.screenshot({type:'png'})));
 console.log(JSON.stringify({run:run.path,RMSE:scores.map(s=>s.aggregateRmseMilliwatt),nativeReplay,directReplay,allNativeReplay,milliseconds:performance.now()-start}));
 }catch(e){failure=e;}finally{await browser?.close();run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,milliseconds:performance.now()-start});}verifyRun(run.path);if(failure)throw failure;
}
await main();
