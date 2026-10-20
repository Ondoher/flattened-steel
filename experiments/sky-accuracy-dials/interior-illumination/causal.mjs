import assert from 'node:assert/strict';
import {createRun,verifyRun,identity,storage} from '../io/files.mjs';
import {base,registration,field,read,models,coordinates,pack} from './common.mjs';
import {physical,miePhase,dot} from './physics.mjs';
import {phaseWarp} from './phase-warp.mjs';
import {mean,interval} from './analysis.mjs';

const parents=process.argv.slice(2);assert.ok(parents.length>0);storage();const r=registration(),run=createRun('h124-phase-warp',{parents:parents.map(s=>verifyRun(base+s)),operation:'Preregistered species-specific positive source-phase polar interpolation, measured on new independent query streams. Same original nodes and azimuth donors. Mechanism screen compares paired absolute weighted reconstruction errors; no candidate protection is inferred without calibrated new operators.',parameters:{freeze:'Execution decision17, seeds519632469/684729157, no reference fitting',gate:'Upper95 paired contrast newAbsolute-.5*oldAbsolute<=0 with numerical envelope<=10% of resolved distance; mechanisms and candidate admission separate.'}});
const all=[],controls=[];
try{
 for(const parent of parents){const root=base+parent,rows=read(root+'/rows.json.gz');
  for(const old of rows.filter(x=>x.model==='midpoint')){
   const {profile,target,channel}=old,f=field(r,{profile,target,channel,k:.5}),p=physical(f),x=read(root+`/${profile}-${target}-b${channel}.json.gz`),queries=read(root+`/${profile}-${target}-queries.json.gz`),qs=queries.qs,bs=models(f),warps=Object.fromEntries(['H100','sector'].map(name=>[name,[0,1].map(c=>phaseWarp(bs[name],p,c))]));
   assert.ok([519632469,684729157].includes(x.seed),'Repair evaluation must use a newly frozen independent stream.');
   let constant=0,nodal=0,minimum=1;
   for(const name of ['H100','sector'])for(const b of warps[name])for(let i=0;i<4096;i++){
    const st=b.stencil(...coordinates(f.mesh,f.g.nodes[i]));constant=Math.max(constant,Math.abs(st.reduce((s,[j,w])=>s+w,0)-1));nodal=Math.max(nodal,Math.abs(st.reduce((s,[j,w])=>s+(j===i?w:0),0)-1));minimum=Math.min(minimum,...st.map(([i,w])=>w));
   }
   assert.ok(constant<1e-10&&nodal<1e-8&&minimum>=0);controls.push({profile,target,channel,constant,nodal,minimum});
   const bins=Object.fromEntries(['H100','sector','midpoint'].map(n=>[n,Array.from({length:32},()=>({old:0,next:0,oldAbs:0,nextAbs:0,bias:0}))])),perBatch=qs.length/32;
   for(let j=0;j<qs.length;j++){
    if(j%2048===0)run.progress('causal-paired-reconstruction',`${profile}/${target}/b${channel} ${j}/${qs.length}`);
    const q=qs[j],uv=coordinates(f.mesh,q.d),L=x.angular.n256[j].reduce((a,b)=>a+b,0),factor=p.bm*p.ssa*Math.exp(-p.h/1200)*miePhase(p.table,dot(q.d,f.out))/q.pdf/old.scale,oldL={},newL={},newBias={};
    const directionBias=2*Math.abs(x.angular.n64[j].reduce((a,b)=>a+b,0)-x.angular.n32[j].reduce((a,b)=>a+b,0))+2*Math.abs(L-x.angular.n64[j].reduce((a,b)=>a+b,0))+old.numericalEnvelope.gpuRelative*Math.abs(L);
    for(const name of ['H100','sector']){
     oldL[name]=bs[name].stencil(...uv).reduce((s,[i,w])=>s+w*x.nodes.n256[i].reduce((a,b)=>a+b,0),0);
     newL[name]=0;newBias[name]=0;
     for(let c=0;c<2;c++)for(const [i,w]of warps[name][c].stencil(...uv)){
      newL[name]+=w*x.nodes.n256[i][c];
      newBias[name]+=w*(2*Math.abs(x.nodes.n64[i][c]-x.nodes.n32[i][c])+2*Math.abs(x.nodes.n256[i][c]-x.nodes.n64[i][c])+old.numericalEnvelope.gpuRelative*Math.abs(x.nodes.n256[i][c]));
     }
    }
    oldL.midpoint=(oldL.H100+oldL.sector)/2;newL.midpoint=(newL.H100+newL.sector)/2;newBias.midpoint=(newBias.H100+newBias.sector)/2;
    for(const name of ['H100','sector','midpoint']){const a=bins[name][q.batch],before=factor*(oldL[name]-L),after=factor*(newL[name]-L);a.old+=before/perBatch;a.next+=after/perBatch;a.oldAbs+=Math.abs(before)/perBatch;a.nextAbs+=Math.abs(after)/perBatch;a.bias+=factor*(newBias[name]+directionBias)/perBatch;}
   }
   for(const name of ['H100','sector','midpoint']){
    const a=bins[name],original=rows.find(v=>v.profile===profile&&v.target===target&&v.channel===channel&&v.model===name),nb=interval(a.map(x=>x.bias)).hi,contrast=interval(a.map(x=>x.nextAbs-.5*x.oldAbs),nb+.5*original.numericalEnvelope.combined),mechanism=contrast.hi<=0&&contrast.bias<=.1*Math.abs(contrast.hi);
    const got={profile,target,channel,model:name,seed:x.seed,parent:identity(root+`/${profile}-${target}-b${channel}.json.gz`),scale:old.scale,samples:qs.length,original:interval(a.map(x=>x.old),original.numericalEnvelope.combined),changed:interval(a.map(x=>x.next),nb),oldAbsolute:interval(a.map(x=>x.oldAbs),original.numericalEnvelope.combined),newAbsolute:interval(a.map(x=>x.nextAbs),nb),contrast,mechanismSupported:mechanism,absoluteRatio:mean(a.map(x=>x.nextAbs))/mean(a.map(x=>x.oldAbs)),batches:a,candidateAdmissibility:'Not yet evaluated: changed phase operators require mass/TV and physical-protection qualification.'};all.push(got);
   }
   console.log(JSON.stringify(all.slice(-3).map(({batches,...x})=>x)));
  }
 }
 run.write('controls.json',controls);run.write('rows.json.gz',pack(all));run.write('summary.json',all.map(({batches,...x})=>x));run.finish('accepted',{fields:all.length,controls:controls.length,mechanismFields:all.filter(x=>x.mechanismSupported).length,candidateQualified:false,reservedUnexposed:8});
}catch(e){run.finish('failed',{failure:String(e)});throw e;}verifyRun(run.path);console.log(JSON.stringify({run:run.path,storage:storage()}));
