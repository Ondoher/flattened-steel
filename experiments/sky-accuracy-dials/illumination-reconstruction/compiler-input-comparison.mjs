import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,registration,read,setup,pack,verifyRun,identity} from './common.mjs';

const root=base+'00702-h136-compiler-l1',run=createRun('h136-input-gap',{
 parents:[verifyRun(root),verifyRun(base+'00667-h136-native-row'),verifyRun(base+'00669-h136-native-row')],
 operation:'Compare the saved exact current-compiler trapezoidal L1 inputs with the saved inherited Gauss128 inputs on identical4096 original receiver-local directions, matching the registered medium/source/phase and black boundary. This is a numerical-input difference, not proof that either is exact physical truth. Preserve interval and source-column settings separately from scalar/split arithmetic parity.',
 parameters:{profiles:['paper','toronto'],target:'node-89',bands:[3,5,8],intervals:[15,60,120],relativeSelection:'Inherited positive total above1e-8 of its row peak; descriptive quantiles only, not an accuracy gate.',costIsGate:false},
});
try {
 const r=registration(),rows=[];
 for(const profile of ['paper','toronto'])for(const channel of [3,5,8]){
  run.progress('compiler-input-difference',`${profile}/b${channel}`);
  const f=setup(r,profile,'node-89',channel),nativeRoot=base+(profile==='paper'?'00667-h136-native-row':'00669-h136-native-row'),nativePath=nativeRoot+`/original-${channel}.json.gz`,native=read(nativePath);
  assert.deepEqual(native.values[128],f.packet.result.incident[128]);
  const high=native.values[128].map(v=>v[0]+v[1]),peak=Math.max(...high);
  for(const n of [15,60,120]){
   const path=root+`/${profile}-b${channel}-n${n}.json.gz`,data=read(path),p=data.parameters;
   assert.equal(p.rayleighScattering,f.px.br);assert.equal(p.mieExtinction,f.px.bm);assert.equal(p.sourceIrradiance,f.px.irradiance);assert.equal(p.mieSingleScatteringAlbedo,f.px.ssa);assert.equal(p.groundAlbedo,0);assert.equal(p.ozoneCrossSection,0);assert.equal(p.coordinateContract,'scene-cache-receiver-local-v1');assert.equal(data.scalar.length,f.g.nodes.length);
   const relative=high.flatMap((v,i)=>v>peak*1e-8?[Math.abs(data.scalar[i]-v)/v]:[]).sort((a,b)=>a-b),normalizer=high.reduce((s,x)=>s+x,0),examples=high.map((v,i)=>({i,direction:f.g.nodes[i],inherited:v,compiler:data.scalar[i],difference:data.scalar[i]-v,relative:v>peak*1e-8?Math.abs(data.scalar[i]-v)/v:null})).filter(x=>x.relative!==null).sort((a,b)=>b.relative-a.relative).slice(0,4);
   rows.push({profile,channel,n,sourceIntervals:p.sourcePathTransmittanceIntervalCount,count:high.length,selected:relative.length,median:relative[Math.floor(relative.length/2)],p95:relative[Math.floor(relative.length*.95)],maximum:relative.at(-1),unweightedAbsoluteDifferenceRatio:high.reduce((s,v,i)=>s+Math.abs(data.scalar[i]-v),0)/normalizer,unweightedSignedDifferenceRatio:high.reduce((s,v,i)=>s+data.scalar[i]-v,0)/normalizer,examples,parents:[identity(path),identity(nativePath)]});
  }
 }
 run.write('rows.json.gz',pack(rows));run.write('differences.tsv',['profile\tband\ttransport_intervals\tsource_intervals\tselected\tmedian_relative\tp95_relative\tmax_relative\tunweighted_absolute_ratio',...rows.map(a=>[a.profile,a.channel,a.n,a.sourceIntervals,a.selected,a.median,a.p95,a.maximum,a.unweightedAbsoluteDifferenceRatio].join('\t'))].join('\n')+'\n');
 run.write('summary.json',{cases:rows.length,matchedDirections:4096,sourceIntervals:20,minimumMedian:Math.min(...rows.map(x=>x.median)),maximumMedian:Math.max(...rows.map(x=>x.median)),scope:'Distinct numerical input operations under matched physical settings. These descriptive differences do not identify the cause, prove truth or qualify whole-cache equivalence.'});
 run.finish('accepted',{cases:rows.length});console.log(JSON.stringify({run:run.path,rows:rows.map(({examples,parents,...rest})=>rest),storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}
verifyRun(run.path);
