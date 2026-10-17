import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {createRun,readRepository,verifyRun,identity,listFiles,storage} from '../io/files.mjs';
import {loadCase,jointPath,measurements,caseBoundary} from '../paper-b1/diagnosis-data.mjs';
import {scoreBoundary} from '../analysis/metrics.mjs';

const roots=['00369-h59-screen','00370-h59-screen','00371-h59-screen','00372-h59-transport','00373-h59-report','00374-h59-l2','00375-h59-quadrature','00376-h59-report','00377-h59-l3','00378-h59-40-screen','00379-h59-40-screen','00380-h59-b1','00381-h59-report'].map(n=>'tmp/experiments/sky-accuracy-dials/runs/'+n);
/** Read a source artifact and retain its exact identity. @param {string} name @returns {any} */
function json(name){return JSON.parse(readRepository(name).toString());}
/** Decode one compact wavelength packet. @param {string} root @param {number} channel @returns {any} */
function channel(root,channel){return JSON.parse(gunzipSync(readRepository(root+`/channel-${String(channel).padStart(2,'0')}.json.gz`)).toString());}
/** Decode retained binary64 words. @param {string} name @returns {Float64Array} */
function words(name){const b=readRepository(name);assert.equal(b.length%8,0);return Float64Array.from({length:b.length/8},(_,i)=>b.readDoubleLE(i*8));}

/** Verify immutable runs, matched-order attribution, recurrence transfer and arithmetic sensitivity.
 * @returns {Promise<void>}
 */
async function main(){
 const run=createRun('h59-verify',{parents:roots.map(r=>identity(r+'/sealed.json')),operation:'Read-only post-run verification; reduce complete40-band component errors, deterministic bounded recurrence transfer, combined-intervention interaction, exact partial reuse and full-B1 rounding sensitivity. No solver rerun.',parameters:{roots,fieldNorm:'Uniform positive1/(8*68) weights on identical rows/directions; compare L2 and L3 radiance fields.',combined:'C4_patch-C1_patch+N1_angle; fixed compiled later increment.'}});let failure=null;const start=performance.now();
 try{
 const verified=[];for(const root of roots){const id=verifyRun(root),seal=json(root+'/sealed.json');assert.equal(seal.sourceFailures.length,0);assert.equal(seal.heartbeatFailure,null);verified.push({identity:id,state:seal.state,cleanup:seal.cleanup});run.progress('verify','Verified '+root);}
 const full=roots[10],paper=roots[11],report=roots[12],control=json(full+'/control.json'),comparison=json('tmp/experiments/sky-accuracy-dials/runs/00368-h58-order-report/comparison.json'),photometry=json(report+'/photometry.json');
 let reuseExact=true;for(let c=0;c<12;c++)assert.ok(readRepository(full+`/channel-${String(c).padStart(2,'0')}.json.gz`).equals(readRepository(roots[9]+`/channel-${String(c).padStart(2,'0')}.json.gz`)));
 const component=[];for(let ray=0;ray<3;ray++){
 const p=Object.fromEntries(photometry.filter(p=>p.ray===ray).map(p=>[p.method,p]));
 const rmse=(a,b)=>1000*Math.sqrt(a.slice(0,31).reduce((s,v,i)=>s+(v-b[i])**2,0)/31);
 component.push({ray,nativeY:p.nativeN1.Y,directY:p.directN1.Y,denseY:p.denseN1.Y,relativeBrightness:100*(p.directN1.Y/p.nativeN1.Y-1),residualReduction:1-Math.abs(p.directN1.Y-p.denseN1.Y)/Math.abs(p.nativeN1.Y-p.denseN1.Y),N1rmseMilliwatt:[rmse(p.nativeN1.spectrum,p.denseN1.spectrum),rmse(p.directN1.spectrum,p.denseN1.spectrum)],C4rmseMilliwatt:[rmse(p.nativeC4.spectrum,p.independentC4.spectrum),rmse(p.frozenIncrementC4.spectrum,p.independentC4.spectrum)]});
 }assert.ok(component.every(c=>c.residualReduction>=.25));
 const propagation=[];for(const c of [4,12,24]){
 const base=channel(roots[2],c),a=channel(roots[5],c),b=channel(roots[8],c),A=Object.fromEntries(a.transports.map(t=>[t.fieldId,t])),B=Object.fromEntries(b.transports.map(t=>[t.fieldId,t]));
 assert.deepEqual(a.native.slice(0,2),base.native.slice(0,2));assert.deepEqual(b.native.slice(0,3),base.native.slice(0,3));
 assert.deepEqual(A.L2.before.map(r=>r.row),B.L2.before.map(r=>r.row));assert.deepEqual(A.L3.before.map(r=>r.row),B.L3.before.map(r=>r.row));
 const delta2=A.L2.bypass.flatMap((r,i)=>r.values.map((v,j)=>v-B.L2.before[i].values[j])),delta3=A.L3.before.flatMap((r,i)=>r.values.map((v,j)=>v-B.L3.before[i].values[j]));
 const norm=x=>x.reduce((s,v)=>s+Math.abs(v),0)/x.length;let interactionMaximum=0;
 const rays=[];for(let ray=0;ray<3;ray++){
 const readout=base.cumulative[3][ray]-base.cumulative[0][ray]+base.direct[0][ray],patched=a.cumulative[3][ray],combined=patched-a.cumulative[0][ray]+a.direct[0][ray],interaction=combined-readout-patched+base.cumulative[3][ray];interactionMaximum=Math.max(interactionMaximum,Math.abs(interaction));rays.push({ray,baseline:base.cumulative[3][ray],readoutOnly:readout,L2patchOnly:patched,combined,interaction,pureN3ChangePpm:1e6*(a.native[2][ray]/base.native[2][ray]-1),pureN4ChangePpm:1e6*(a.native[3][ray]/base.native[3][ray]-1),L3patchN4ChangePpm:1e6*(b.native[3][ray]/base.native[3][ray]-1)});
 }assert.ok(interactionMaximum<1e-15);propagation.push({channel:c,L2meanAbsoluteChange:norm(delta2),L3meanAbsoluteChange:norm(delta3),transfer:norm(delta3)/norm(delta2),interactionMaximum,rows:A.L2.before.map(r=>r.row),rays});
 }
 const corrected=loadCase(jointPath),actual=caseBoundary(corrected),measured=measurements(),candidate=words(paper+'/candidate-values.f64'),native=words(paper+'/n1-native.f64'),paired=new Float64Array(candidate);
 for(let t=0;t<17;t++)for(let y=0;y<9;y++)for(let x=0;x<9;x++)for(let c=0;c<40;c++){const i=(t*81+y*9+x)*40+c;paired[i]+=corrected.channels[c].values[t*81+x*9+y]-native[i];}
 const pairedScore=scoreBoundary({...actual,values:paired,sourceIdentity:identity(paper+'/n1-native.f64')},measured),scores=json(paper+'/scores.json'),arithmeticShift=pairedScore.aggregateRmseMilliwatt-scores.angle.aggregateRmseMilliwatt;
 assert.ok(pairedScore.aggregateRmseMilliwatt<scores.original.aggregateRmseMilliwatt);assert.ok(Math.abs(arithmeticShift)<1e-4,'Paired versus absolute readout arithmetic must not explain paper improvement.');
 assert.equal(listFiles('tmp/experiments/sky-accuracy-dials/scratch').length,1,'Only this verifier scratch owner should remain.');
 run.write('verification.json',{verified,reuseExact,channels:control.channels,component,propagation,rounding:{pairedRmseMilliwatt:pairedScore.aggregateRmseMilliwatt,absoluteRmseMilliwatt:scores.angle.aggregateRmseMilliwatt,arithmeticShift},milliseconds:performance.now()-start,storage:storage(),limitations:'Selected-ray physical references and bounded recurrence support. Full B1 evaluates a general frozen N1 readout only; no production or twilight qualification.'});
 console.log(JSON.stringify({run:run.path,component,propagation:propagation.map(p=>({channel:p.channel,transfer:p.transfer,interactionMaximum:p.interactionMaximum})),arithmeticShift,milliseconds:performance.now()-start}));
 }catch(e){failure=e;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,milliseconds:performance.now()-start});}verifyRun(run.path);if(failure)throw failure;
}
await main();
