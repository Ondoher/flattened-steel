import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {createRun,identity,readRepository,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {base,read,pack,verifyRun,coordinates} from './common.mjs';
import {modelField} from './model-field.mjs';
import {phaseMoments} from './phase-moments.mjs';
import {convolve,lm} from './harmonics.mjs';
import {harmonicShader,harmonicResident} from './harmonic-gpu.mjs';

const parent=process.argv[2]??base+'00685-h136-sh-field',n=Number(process.argv[3]??4),profiles=(process.argv[4]??'paper,toronto').split(','),seal=read(parent+'/sealed.json'),sources=profiles.map(p=>seal.artifacts.find(a=>a.path===parent+`/${p}-n${n}.json.gz`));assert.ok(sources.every(Boolean));
for(const a of sources)readRepository(a.path,a);
const run=createRun('h136-sh-gpu',{parents:[identity(parent+'/sealed.json'),...sources,verifyRun(base+'00684-h136-sh-proof')],operation:'Evaluate every native outgoing direction from fixed physical-phase-weighted harmonic coefficients on resident GPU. Independently compare selected double-precision evaluations and preserve angular projection/truncation error separately. Coefficient parent identity and any inherited monitoring limitation remain explicit; this evaluation does not relabel a failed parent verifier.',parameters:{parent,quadratureOrder:n,profiles,outgoing:4374,partialMonitoringRecovery:parent.endsWith('00685-h136-sh-field'),costIsGate:false}});let browser,failure;
try{
 assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage(),rows=[];
 for(let k=0;k<sources.length;k++){
  const profile=profiles[k],artifact=JSON.parse(gunzipSync(readRepository(sources[k].path,sources[k])).toString()),L=artifact.L,c={...artifact,real:artifact.real,imag:artifact.imag},z=modelField(profile,'node-89',8,true),p=z.f.px,beta=[p.br*Math.exp(-p.h/8000),p.bm*p.ssa*Math.exp(-p.h/1200)],mie=phaseMoments(p.table,L),ray=Array.from({length:L+1},(_,l)=>l===0?1:l===2?.1:0),size=(L+1)*(L+2)/2,height=Math.ceil(size/256),real=new Float64Array(height*256*4),imag=new Float64Array(height*256*4);
  for(let l=0;l<=L;l++)for(let m=0;m<=l;m++){const at=lm(l,m),weights=[beta[0]*ray[l],beta[0]*ray[l],beta[1]*mie[l],beta[1]*mie[l]];for(let s=0;s<4;s++){const origin=s%2;real[at*4+s]=c.real[origin][at]*weights[s];imag[at*4+s]=c.imag[origin][at]*weights[s];}}
  const vectors=[...z.f.p.control.request.transportSpec.domains.outgoing.unitVectors,z.f.out],angles=vectors.map(d=>coordinates(z.f.mesh,d)),outgoing=angles.flatMap(([mu,phi])=>[mu,Math.cos(phi),Math.sin(phi),0]),started=Date.now(),renderer=await page.evaluate(harmonicResident,{action:'init',shader:harmonicShader(L),height,real:Array.from(real),imag:Array.from(imag),outgoing}),values=[];
  for(let at=0;at<vectors.length;at+=64){run.progress('whole-outgoing-GPU',`${profile} L${L} ${at}/${vectors.length}`);values.push(...await page.evaluate(harmonicResident,{action:'draw',offset:at,count:Math.min(64,vectors.length-at)}));}await page.evaluate(harmonicResident,{action:'close'});
  const checks=[];for(const j of [0,Math.floor((vectors.length-1)/2),vectors.length-1]){const [mu,phi]=angles[j],r=convolve(c,mu,phi,ray),m=convolve(c,mu,phi,mie),cpu=[r[0]*beta[0],r[1]*beta[0],m[0]*beta[1],m[1]*beta[1]],gpu=values.slice(j*4,j*4+4),relative=Math.max(...cpu.map((x,s)=>Math.abs(x-gpu[s])/Math.max(Math.abs(x),1e-25))),normalized=cpu.reduce((sum,x,s)=>sum+Math.abs(x-gpu[s]),0)/z.scale;assert.ok(relative<=1e-4||normalized<=2e-8,'Harmonic GPU/binary64 parity');checks.push({j,direction:vectors[j],cpu,gpu,relative,normalized});}
  const minimum=Math.min(...values),totalMinimum=Math.min(...vectors.map((_,j)=>values.slice(j*4,j*4+4).reduce((s,x)=>s+x,0))),row={profile,L,outgoing:vectors.length-1,checks,minimum,totalMinimum,milliseconds:Date.now()-started,renderer,projection:artifact.item};rows.push(row);run.write(`${profile}-row.json.gz`,pack({values,vectors,frame:'receiver-local native cube; harmonic transform in the registered Sun frame',row}));console.log(JSON.stringify({profile,L,maxParity:Math.max(...checks.map(x=>x.relative)),minimum,totalMinimum,milliseconds:row.milliseconds}));
 }
 await browser.close();browser=null;run.write('summary.json',{rows,scope:'Complete outgoing rows for one wavelength, finite harmonic GPU/CPU parity. Degree/projection accuracy remains separate; no complete spectral cache/recurrence or observer color claim. Preserves the original parent monitoring failure.'});run.finish('accepted',{rows:rows.length});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);if(failure)run.finish('failed',{failure:String(failure)});}verifyRun(run.path);if(failure)throw failure;
