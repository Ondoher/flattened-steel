import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {createRun,readRepository,verifyRun} from '../io/files.mjs';
import {halfWidth} from '../distant-horizon/libradtran.mjs';

const reference='tmp/experiments/sky-accuracy-dials/runs/00366-h58-independent';
/** Read a provenance-checked JSON artifact. @param {string} file @returns {any} */
const json=file=>JSON.parse(readRepository(file).toString());
/** Spectral RMS, scaled to mW. @param {number[]} a @returns {number} */
const rms=a=>1000*Math.sqrt(a.reduce((s,x)=>s+x*x,0)/a.length);

/** Retain pointwise reference sampling bands for every compared spectral score.
 * The RMSE box is descriptive: pointwise95% bands are not a simultaneous95% interval.
 * @returns {Promise<void>}
 */
async function main(){
 const roots=process.argv.slice(2);assert.ok(roots.length);
 const parents=[verifyRun(reference),...roots.map(r=>verifyRun(r))];
 const batches=json(reference+'/batches.json').filter(b=>b.profile==='main');
 const lookup=new Map(batches.map(b=>[b.group+'/'+b.channel+'/'+b.batch,b]));
 const run=createRun('h60-ref-bands',{parents,operation:'Reduce the same24 independent Monte Carlo batches into pure-order, higher-only and cumulative spectral pointwise95% sampling bands. Compare candidate errors with the descriptive componentwise band box; no new sampling or physical convergence claim.',parameters:{roots,reference,batches:24,scoreBands:'Screen4/12/24; full0..30',intervalMeaning:'Pointwise95% reference half-widths, not simultaneous95% RMSE confidence intervals. Correlated order contributions are summed within each history batch before uncertainty reduction.'}});
 let failure=null;const rows=[];
 try{
 for(const root of roots){const control=json(root+'/control.json');for(const rule of control.rules){
 const channels=control.channels.filter(c=>c<=30),packets=channels.map(c=>JSON.parse(gunzipSync(readRepository(root+`/${rule.id}/channel-${String(c).padStart(2,'0')}.json.gz`)).toString()));
 for(let ray=0;ray<3;ray++)for(const term of ['N1','N2','N3','N4','higher','C4']){
 const cells=channels.map((c,i)=>{const samples=Array.from({length:24},(_,batch)=>{const b=lookup.get(ray+'/'+c+'/'+batch);assert.ok(b);return term==='C4'?b.means.slice(1,5).reduce((s,v)=>s+v,0):term==='higher'?b.means.slice(2,5).reduce((s,v)=>s+v,0):b.means[Number(term.slice(1))];}),mean=samples.reduce((s,v)=>s+v,0)/24,half=halfWidth(samples),p=packets[i],value=term==='C4'?p.cumulative[3][ray]:term==='higher'?p.native.slice(1).reduce((s,o)=>s+o[ray],0):p.native[Number(term.slice(1))-1][ray];return{channel:c,reference:mean,half95:half,value,error:value-mean};});
 rows.push({root,rule:rule.id,ray,term,full:control.channels.length===40,pointRmseMilliwatt:rms(cells.map(c=>c.error)),componentwiseBoxRmseMilliwatt:[rms(cells.map(c=>Math.max(0,Math.abs(c.error)-c.half95))),rms(cells.map(c=>Math.abs(c.error)+c.half95))],outsidePointwise95Bands:cells.filter(c=>Math.abs(c.error)>c.half95).length,cells});
 }
 run.progress('reduce',rule.id+' reference bands complete.');await new Promise(resolve=>setImmediate(resolve));
 }}
 run.write('reference-bands.json',{rows,limits:'Pointwise reference sampling only, not numerical/model bias or simultaneous RMSE uncertainty. The registered sweet spot uses point estimates and remains a selected-ray candidate.'});console.log(JSON.stringify({run:run.path,rows:rows.filter(r=>r.term==='higher').map(({cells,...r})=>r)}));
 }catch(e){failure=e;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}verifyRun(run.path);if(failure)throw failure;
}
await main();
