import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,read,registration,setup,channels,pack,verifyRun,miePhase,rayleighPhase,dot} from './common.mjs';
import {augmented} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';
import {linearPredictor} from '../reconstruction-mechanisms/custom-metrics.mjs';
import {lightBias,summarize,compare,reference,interval} from '../reconstruction-mechanisms/metrics.mjs';
import {pairedProtection,sunProtection} from './protection.mjs';

const parents=['00667-h136-native-row','00669-h136-native-row','00658-h135-confirm'],run=createRun('h136-native-phys',{parents:parents.map(n=>verifyRun(base+n)),operation:'Actual full-active-spectrum native L1 nodal inputs and their frozen row allocations, evaluated against independently traced direct L1 on the disjoint32768 cloud. Separate native integration input error from interpolation gains and GPU finite-sum parity. No source modification or new physical tuple.',parameters:{profiles:['paper','toronto'],target:'node-89',bands:channels,N:32768,models:['original','native2D'],nativeIntervals:[64,128],nativeEnvelope:'2*abs(native128-native64)+2e-5*abs(native128), propagated through the actual positive reconstruction',costIsGate:false}});
try{
 const rows=[],r=registration();
 for(const profile of ['paper','toronto']){
  const root=base+(profile==='paper'?parents[0]:parents[1]),scores=read(root+'/allocation.json').scores,qs=read(base+`00658-h135-confirm/${profile}-node-89-queries.json.gz`).qs;
  for(const channel of channels){
   const f=setup(r,profile,'node-89',channel),p=f.px,{scale}=reference(f),original=read(root+`/original-${channel}.json.gz`).values,extra=read(root+`/row-${channel}.json.gz`).added,angular=read(base+`00658-h135-confirm/${profile}-node-89-b${channel}.json.gz`).angular,z=augmented(f,scores,'targeted'),arrange=view=>z.entries.flatMap(e=>e.old?original[view].slice(e.index*64,(e.index+1)*64):extra[view].slice(e.index*64,(e.index+1)*64)),nodes=arrange(128),coarse=arrange(64),errors=nodes.map((v,i)=>v.map((x,s)=>2*Math.abs(x-coarse[i][s])+2e-5*Math.abs(x))),oe=original[128].map((v,i)=>v.map((x,s)=>2*Math.abs(x-original[64][i][s])+2e-5*Math.abs(x))),linear=linearPredictor(f),records={original:[],native2D:[]};
   for(let i=0;i<qs.length;i++){
    if(i%1024===0)run.progress('native-input-assessment',`${profile}/node-89/b${channel} ${i}/${qs.length}`);
    const q=qs[i],m=dot(q.d,f.out),wm=p.bm*p.ssa*Math.exp(-p.h/1200)*miePhase(p.table,m)/q.pdf/scale,wr=p.br*Math.exp(-p.h/8000)*rayleighPhase(m)/q.pdf/scale,bq=lightBias(angular,i),values={original:linear(q.d,original[128],oe),native2D:polar2DModel(z.field,q.d,nodes,errors)};
    for(const [name,v]of Object.entries(values)){assert.ok(v.values.every(x=>x>=0&&Number.isFinite(x)));records[name].push([q.batch,wm,wr,v.values[0]-angular.n256[i][0],v.values[1]-angular.n256[i][1],v.errors[0]+v.errors[1]+bq[0]+bq[1]]);}
   }
   const results=Object.fromEntries(Object.entries(records).map(([name,v])=>[name,summarize(v,qs.length)])),row={profile,target:'node-89',channel,N:qs.length,scale,results,comparisons:{native2D:compare(results.original,results.native2D)}},protection={original:pairedProtection(row,'native2D'),sun:sunProtection(f,row,'native2D')},physical=Object.fromEntries(Object.entries(results).map(([name,x])=>[name,interval(x.bins.map(b=>b.mE+b.rE),x.envelopes.m+x.envelopes.r)]));rows.push({...row,protection,physical});
   console.log(JSON.stringify({profile,channel,ratio:row.comparisons.native2D.absoluteRatio,components:row.comparisons.native2D.protected,physical,protection}));
  }
 }
 run.write('rows.json.gz',pack(rows));run.write('summary.json',{fields:rows.length,scope:'Native input physical assessment, black-boundary pure localJ2; one whole-spectrum native allocation per profile. Not a later-order/observer result.',rows:rows.map(x=>({profile:x.profile,channel:x.channel,ratio:x.comparisons.native2D.absoluteRatio,protected:x.comparisons.native2D.protected,physical:x.physical,protection:x.protection}))});run.finish('accepted',{fields:rows.length});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){run.finish('failed',{failure:String(e)});throw e;}verifyRun(run.path);
