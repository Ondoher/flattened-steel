import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,read,registration,setup,pack,verifyRun} from './common.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';
import {linearPredictor} from '../reconstruction-mechanisms/custom-metrics.mjs';

const selected=['node-89','held-0','held-1','held-2'],run=createRun('h138-raw-proof',{parents:[verifyRun(base+'00678-h135-phys-close'),verifyRun(base+'00664-h136-phase-proof')],operation:'Preliminary mathematical controls for the registered higher-order raw-radiance reconstruction. Explicitly disable source-phase division/restoration. Manufacture separate positive test channels, constants, exact nodes, support and linear equivalence. These are not measured L2/recurrence or physical higher-order evidence.',parameters:{targets:selected,profiles:['paper','toronto'],band:8,queries:512,factor:[false,false],costIsGate:false}});
try{
 const r=registration(),rows=[],manufactures=[{name:'constant',fn:d=>[.7,.3]},{name:'smooth',fn:d=>[Math.exp(.3*d[2])*(1+.1*d[0]),1+.4*d[1]*d[1]]},{name:'ground-support',fn:(d,h)=>d[2]<h?[0,0]:[1+.1*d[0],.5+.1*d[1]]}];
 for(const target of selected)for(const profile of ['paper','toronto']){
  const f=setup(r,profile,target,8),queries=read(base+`00654-h135-profile/${profile}-${target}-queries.json.gz`).qs.slice(0,512),zero=f.g.nodes.map(()=>[0,0]);
  for(const m of manufactures){
   run.progress('higher-order-math',`${profile}/${target}/${m.name}`);const nodes=f.g.nodes.map(d=>m.fn(d,f.mesh.horizon)),linear=linearPredictor(f,[false,false]);let constant=0,nodal=0,equivalence=0,negative=0,support=0,rawError=0,linearError=0;
   for(const q of queries){const got=polar2DModel(f,q.d,nodes,zero,[false,false]),control=polar2DModel(f,q.d,nodes,zero,[false,false],false,false),original=linear(q.d,nodes,zero),truth=m.fn(q.d,f.mesh.horizon);for(let s=0;s<2;s++){equivalence=Math.max(equivalence,Math.abs(control.values[s]-original.values[s]));negative=Math.max(negative,-got.values[s]);rawError+=Math.abs(got.values[s]-truth[s])/queries.length;linearError+=Math.abs(original.values[s]-truth[s])/queries.length;if(m.name==='constant')constant=Math.max(constant,Math.abs(got.values[s]-truth[s]));if(m.name==='ground-support'&&q.d[2]<f.mesh.horizon)support=Math.max(support,Math.abs(got.values[s]));}}
   for(let i=0;i<32;i++){const j=Math.floor(i*f.g.count/32),v=polar2DModel(f,f.g.nodes[j],nodes,zero,[false,false]);for(let s=0;s<2;s++)nodal=Math.max(nodal,Math.abs(v.values[s]-nodes[j][s]));}
   assert.ok(equivalence<1e-10&&constant<1e-10&&nodal<1e-10&&negative===0&&support<1e-10,'Higher-order raw-radiance mathematical control');rows.push({profile,target,manufacture:m.name,constant,nodal,equivalence,negative,support,rawError,linearError,phaseFactor:false});
  }
 }
 run.write('rows.json.gz',pack(rows));run.write('summary.json',{cases:rows.length,rows,scope:'Pre-recurrence manufactured raw-radiance controls only. No physical source-phase factor is assumed for higher orders; no real L2 fields or fresh tuples consumed.'});run.finish('accepted',{cases:rows.length});console.log(JSON.stringify({run:run.path,cases:rows.length,storage:storage()}));
}catch(e){run.finish('failed',{failure:String(e)});throw e;}verifyRun(run.path);
