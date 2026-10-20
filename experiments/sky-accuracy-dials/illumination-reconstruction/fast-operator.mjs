import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,read,pack,verifyRun,miePhase,rayleighPhase,dot} from './common.mjs';
import {modelField} from './model-field.mjs';
import {fastModel} from './fast-model.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';
import {piecewiseQuadrature} from './piecewise-quadrature.mjs';

const selected=(process.argv[3]??'paper:node-89:8:native,toronto:node-89:8:native').split(',').map(s=>{const [p,t,c,kind]=s.split(':');return {profile:p,target:t,channel:Number(c),native:kind==='native'};}),levels=(process.argv[2]??'2,4,8').split(',').map(Number),run=createRun('h136-fast-op',{parents:['00654-h135-profile','00657-h135-az-grid','00667-h136-native-row','00669-h136-native-row'].map(n=>verifyRun(base+n)),operation:'Boundary-partitioned continuous integral of the unchanged reconstructed illumination, using a separately implemented mean-only evaluator. Verify point parity against the preserved interval implementation on actual inputs first. Distinguish native full-spectrum row input from independent controls.',parameters:{selected,levels,costIsGate:false,tolerance:1e-10,physicalTruth:false}});
try{
 const rows=[];
 for(const c of selected){
  const z=modelField(c.profile,c.target,c.channel,c.native),models=z.models.map(x=>({...x,sample:fastModel(x.field,x.nodes)})),qs=read(base+`00654-h135-profile/${c.profile}-${c.target}-queries.json.gz`).qs.slice(0,1024),checks=[];
  for(const model of models){const zero=model.nodes.map(()=>[0,0]);let maximum=0;for(const q of qs){const a=model.sample(q.d),b=polar2DModel(model.field,q.d,model.nodes,zero).values;for(let s=0;s<2;s++)maximum=Math.max(maximum,Math.abs(a[s]-b[s])/Math.max(Math.abs(b[s]),1e-25));}assert.ok(maximum<=1e-10,'Fast actual-input evaluation parity');checks.push({name:model.name,maximum,count:qs.length});}
  const results=[];
  for(const n of levels){
   const sums=Object.fromEntries(models.map(x=>[x.name,[0,0]])),masses=[0,0],start=Date.now();let count=0;
   for(const q of piecewiseQuadrature(z.partition,n)){
    if(count%16384===0)run.progress('continuous-operator',`${c.profile}/${c.target}/b${c.channel} ${c.native?'native':'independent'} n${n} sample${count}`);
    const p=z.f.px,m=dot(q.d,z.f.out),pr=rayleighPhase(m),pm=miePhase(p.table,m),weights=[q.w*p.br*Math.exp(-p.h/8000)*pr,q.w*p.bm*p.ssa*Math.exp(-p.h/1200)*pm];masses[0]+=q.w*pr;masses[1]+=q.w*pm;
    for(const model of models){const v=model.sample(q.d);for(let s=0;s<2;s++)sums[model.name][s]+=weights[s]*(v[0]+v[1]);}count++;
   }
   const previous=results.at(-1),normalized=Object.fromEntries(Object.entries(sums).map(([name,v])=>[name,(v[0]+v[1])/z.scale])),change=previous?Object.fromEntries(Object.keys(sums).map(name=>[name,Math.abs(normalized[name]-previous.normalized[name])])):null,item={n,count,sums,masses,normalized,change,milliseconds:Date.now()-start};results.push(item);run.write(`${c.profile}-${c.target}-b${c.channel}-${c.native?'native':'ind'}-n${n}.json`,item);console.log(JSON.stringify({...c,...item}));
  }
  rows.push({...c,scale:z.scale,checks,levels:results,scope:z.scope,sourceRuns:z.parents});
 }
 run.write('rows.json.gz',pack(rows));run.finish('accepted',{cases:rows.length,levels,physicalTruth:false});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){run.finish('failed',{failure:String(e)});throw e;}verifyRun(run.path);
