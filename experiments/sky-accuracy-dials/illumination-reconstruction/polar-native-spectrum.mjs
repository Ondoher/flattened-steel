// Orchestration extension of experiments/sky-accuracy-dials/illumination-reconstruction/polar-native-row.mjs
// Source SHA256 965f9c2a193b6d57a99b4ba8fd49066745af0c3a743f6066aee0f0ae9806e13c. Nodal and integration equations preserved.
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {createRun,storage,identity} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {shader,resident,evaluate} from '../interior-illumination/gpu.mjs';
import {direct} from '../interior-illumination/physics.mjs';
import {base,read,pack,verifyRun,retained,coordinates,miePhase,rayleighPhase,dot} from './common.mjs';
import {polarNativeField,paperPhaseTail} from './polar-native-field.mjs';
import {polarUnion,assembleUnion} from './polar-union.mjs';
import {phaseMoments} from './phase-moments.mjs';
import {lm} from './harmonics.mjs';
import {harmonicResident,harmonicShader} from './harmonic-gpu.mjs';

const bands=(process.argv[2]??'0,1,2,3,4,5,6,7,8,9,10,11,12,13,14').split(',').map(Number),L=128,orders=[4,8];assert.ok(bands.every(c=>Number.isInteger(c)&&c>=0&&c<15));
const run=createRun('h136-polar-spec',{
 parents:['00705-h137-polar-all','00710-h137-polar-again','00711-h137-union-proof','00702-h136-compiler-l1','00698-h136-op-proof','00712-h136-polar-row','00715-h136-polar-row'].map(name=>verifyRun(base+name)),
 operation:'Actual contained direct-L1 nodal inputs, fixed full128-ring union, shared harmonic physical phase integration and all4374 native outgoing source-density values. Reuse exact compatible measured3/5/8 inputs; trace other bands using the identical resident direct-L1 operation. Compare every GPU component with independent binary64 coefficient evaluation; keep input, projection, phase truncation and physical-transfer claims separate. This is a diagnostic builder row while broader physical precision remains active.',
 parameters:{CPUConcurrency:4,reusedCompletedBands:[0,8],profile:'paper',target:'node-89',bands,L,orders,transport:'Direct-L1 panel/log Gauss32/64 and column128/256, exact operation already used by local reconstruction proofs',proposalRings:128,azimuthPerRing:64,allOutgoingBinary64:true,capacity:1024,projectionEnvelope:'Twice the uniform coefficient-difference sum plus the separately bounded physical CS kernel tail; empirical projection convergence, not a floating-point certificate.',costIsGate:false,observerColors:false},
});
/** @param {number} channel @param {number} n @param {any} input @returns {Promise<any>} */
function projectBand(channel,n,input){return new Promise((resolve,reject)=>{
 const worker=new Worker(new URL('./polar-native-worker.mjs',import.meta.url),{workerData:{channel,L,n,input}});let result,stopped=false;
 worker.on('message',m=>{if(stopped)return;try{if(m.type==='progress')run.progress('native-polar-projection',`b${channel}/n${n} ${m.message}`);else if(m.type==='result')result=m.value;}catch(error){stopped=true;worker.terminate().then(()=>reject(error),()=>reject(error));}});
 worker.once('error',reject);worker.once('exit',code=>{if(!stopped)code===0&&result?resolve(result):reject(Error(`Native projection worker exit${code}`));});
});}
let browser,failure;
try {
 for(const degree of [16,32,64,128]){const a=phaseMoments(null,degree+512),partial=a.slice(degree+1).reduce((s,x,i)=>s+(2*(degree+1+i)+1)*x/(4*Math.PI),0);assert.ok(partial<=paperPhaseTail(degree)*(1+1e-12));}
 assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage(),rows=[],prepared=[];
 for(const channel of bands){
  if([0,8].includes(channel)){
   const parent=base+(channel===0?'00715-h136-polar-row':'00712-h136-polar-row'),old=read(parent+'/summary.json').rows.find(row=>row.channel===channel);assert.ok(old.levels.at(-1).projectionQualified);
   rows.push({...old,reusedParent:parent});run.write('reused-band'+channel+'.json',{parent,summary:old,artifact:identity(parent+'/paper-b'+channel+'-n8.json.gz')});continue;
  }
  const {f,union}=polarNativeField(channel),levels={},inputTimings={};let inputParents=[];
  if([3,5,8].includes(channel)){
   const root=base+'00654-h135-profile',prior=read(root+`/paper-node-89-b${channel}.json.gz`),freshPath=base+`00705-h137-polar-all/paper-node-89-b${channel}.json.gz`,fresh=read(freshPath),scores=read(root+'/paper-node-89-allocation.json').scores,z=polarUnion(f,scores),original=retained('paper','node-89',channel).x.nodes;
   assert.deepEqual(z.field.g.nodes,union.field.g.nodes);assert.deepEqual(fresh.physical,f.px);inputParents=[identity(freshPath),identity(root+`/paper-node-89-b${channel}.json.gz`)];
   for(const key of ['n32','n64','n256'])levels[key]=assembleUnion(z,original[key],prior.added[key],fresh.fresh[key]);
  }else{
   await page.evaluate(resident,{action:'init',shader:shader()});
   for(const [key,nv,nc]of [['n32',32,128],['n64',64,128],['n256',64,256]]){const got=await evaluate(page,run,f.px,union.field.g.nodes,Number(nv),Number(nc),`paper/b${channel} actual polar L1 row`);levels[key]=got.values;inputTimings[key]=got.timings;}
   await page.evaluate(resident,{action:'close'});
  }
  const betaCheck=[f.px.br*Math.exp(-f.px.h/8000),f.px.bm*f.px.ssa*Math.exp(-f.px.h/1200)],originalValues=Array(f.g.count);union.entries.forEach((entry,ring)=>{if(entry.origin==='original')for(let j=0;j<64;j++)originalValues[entry.index*64+j]=levels.n256[ring*64+j];});
  const controlScale=originalValues.reduce((sum,L,i)=>{const mu=dot(f.g.nodes[i],f.out);return sum+f.g.weights[i]*(betaCheck[0]*rayleighPhase(mu)+betaCheck[1]*miePhase(null,mu))*(L[0]+L[1]);},0),calibration=[];
  for(const i of [Math.floor(.31*union.field.g.count),Math.floor(.67*union.field.g.count)]){run.progress('native-L1-binary64',`b${channel} node${i}`);const d=union.field.g.nodes[i],cpu=direct(f.px,d,64,256),gpu=levels.n256[i],difference=cpu.reduce((s,x,k)=>s+Math.abs(x-gpu[k]),0),relative=difference/Math.max(cpu[0]+cpu[1],1e-25),mu=dot(d,f.out),weighted=(betaCheck[0]*rayleighPhase(mu)+betaCheck[1]*miePhase(null,mu))*difference*4*Math.PI/controlScale;assert.ok(relative<=2e-5||weighted<=2e-8,'Actual native L1 GPU/binary64 calibration');calibration.push({i,cpu,gpu,relative,weighted});}
  const inputPath=`paper-b${channel}-nodes.json.gz`;run.write(inputPath,pack({levels,physical:f.px,directions:union.field.g.nodes,inputParents,inputTimings,calibration,controlScale,units:'Directional pure atmospheric L1 origin radiance'}));

  prepared.push({channel,input:identity(run.path+'/'+inputPath),controlScale});
 }
 for(let at=0;at<prepared.length;at+=4){
  const settled=await Promise.allSettled(prepared.slice(at,at+4).map(async data=>{const projections=[];for(const n of orders)projections.push(await projectBand(data.channel,n,data.input));return {...data,projections};}));let batchFailure;
  for(const settledItem of settled){
   if(settledItem.status==='rejected'){batchFailure??=settledItem.reason;continue;}
   const {channel,controlScale,projections}=settledItem.value,{f}=polarNativeField(channel);
  const beta=[f.px.br*Math.exp(-f.px.h/8000),f.px.bm*f.px.ssa*Math.exp(-f.px.h/1200)],mie=phaseMoments(null,L),ray=Array.from({length:L+1},(_,l)=>l===0?1:l===2?.1:0),vectors=[...f.p.control.request.transportSpec.domains.outgoing.unitVectors,f.out,f.px.sun,f.px.sun.map(x=>-x)],outgoing=vectors.flatMap(d=>{const [mu,phi]=coordinates(f.mesh,d);return [mu,Math.cos(phi),Math.sin(phi),0];}),band=[];let previous=null;

   for(let index=0;index<orders.length;index++){const n=orders[index],{c,cpuValues,item}=projections[index];assert.equal(item.scale,controlScale);let uniformChange=null;
   if(previous){let bound=0;for(let l=0;l<=L;l++){const y=Math.sqrt((2*l+1)/(4*Math.PI)),weight=beta[0]*ray[l]+beta[1]*mie[l];for(let m=0;m<=l;m++)for(let s=0;s<2;s++){const j=lm(l,m);bound+=(m===0?1:2)*weight*y*Math.hypot(c.real[s][j]-previous.real[s][j],c.imag[s][j]-previous.imag[s][j]);}}uniformChange=bound/item.scale;}
   const size=(L+1)*(L+2)/2,height=Math.ceil(size/256),real=new Float64Array(height*256*4),imag=new Float64Array(height*256*4);
   for(let l=0;l<=L;l++)for(let m=0;m<=l;m++){const at=lm(l,m),w=[beta[0]*ray[l],beta[0]*ray[l],beta[1]*mie[l],beta[1]*mie[l]];for(let s=0;s<4;s++){real[at*4+s]=c.real[s%2][at]*w[s];imag[at*4+s]=c.imag[s%2][at]*w[s];}}
   const started=Date.now(),renderer=await page.evaluate(harmonicResident,{action:'init',shader:harmonicShader(L),height,real:Array.from(real),imag:Array.from(imag),outgoing,capacity:1024}),gpu=[];
   for(let at=0;at<vectors.length;at+=1024){run.progress('native-polar-GPU',`b${channel}/n${n} ${at}/${vectors.length}`);gpu.push(...await page.evaluate(harmonicResident,{action:'draw',offset:at,count:Math.min(1024,vectors.length-at)}));}
   await page.evaluate(harmonicResident,{action:'close'});
   const gpuMilliseconds=Date.now()-started,maxRelative=Math.max(...gpu.map((x,i)=>Math.abs(x-cpuValues[i])/Math.max(Math.abs(cpuValues[i]),1e-25))),minimum=Math.min(...gpu);assert.ok(maxRelative<=1e-4&&minimum>=0,'Every outgoing GPU component must match independent binary64 and remain nonnegative');
   const projectionEnvelope=uniformChange===null?null:2*uniformChange+item.truncationUpper;
   const result={...item,uniformChange,projectionEnvelope,projectionQualified:projectionEnvelope!==null&&projectionEnvelope<=1e-5,maxRelative,minimum,gpuMilliseconds,renderer,outgoing:4374,extraPhysicalDirections:3};band.push(result);
   run.write(`paper-b${channel}-n${n}.json.gz`,pack({L,real:c.real.map(a=>Array.from(a)),imag:c.imag.map(a=>Array.from(a)),cpuValues:Array.from(cpuValues),gpu,result,units:'Local pure-J2 density; not observer radiance'}));previous=c;
   console.log(JSON.stringify(result));
   }
   rows.push({channel,levels:band});
  }
  if(batchFailure)throw batchFailure;
 }
 rows.sort((a,b)=>a.channel-b.channel);
 const values=rows.map(row=>read((row.reusedParent??run.path)+'/paper-b'+row.channel+'-n8.json.gz').gpu);
 const f=polarNativeField(0).f,directions=[...f.p.control.request.transportSpec.domains.outgoing.unitVectors,f.out,f.px.sun,f.px.sun.map(x=>-x)];
 assert.ok(values.every(row=>row.length===directions.length*4));
 run.write('paper-source-row.json.gz',pack({bands:rows.map(row=>row.channel),directions,values,units:'Four origin/outgoing contributions to local pure-J2 density per wavelength. Not observer radiance.'}));
 await browser.close();browser=null;
 run.write('summary.json',{bands,fullSpectralRow:bands.length===15,rows,allOutgoingParity:true,projectionQualified:rows.every(row=>row.levels.at(-1).projectionQualified),CPUConcurrency:4,reusedCompletedBands:[0,8],scope:'Actual paper15-band polar pure-J2 source row; complete native outgoing GPU/binary64 checks and separate finite numerical qualifications. No global recurrence, B1 or observer-color claim.'});
 run.finish('accepted',{bands:bands.length,fullSpectralRow:bands.length===15});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}
verifyRun(run.path);if(failure)throw failure;
