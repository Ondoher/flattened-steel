import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,registration,read,pack,verifyRun} from './common.mjs';
import {project,sphereRule} from './harmonics.mjs';
import {projectFft,fftProof} from './harmonic-fft.mjs';
import {phaseSquareNorm} from './phase-tail.mjs';
import {gauss} from '../interior-illumination/physics.mjs';

const parents=['00690-h136-sh-field','00691-h136-sh-field','00692-h136-sh-field','00693-h136-sh-gpu','00694-h136-sh-spectrum','00696-h136-phase-high'];
const run=createRun('h136-op-proof',{
 parents:parents.map(name=>verifyRun(base+name)),
 operation:'Replay retained selected integration/GPU/phase arithmetic; independently check small Fourier projection manufactures and the exact aligned phase-square norm. Publish native numerical tables. This qualifies only these numerical scopes, not full current-compiler inputs, variable-light whole-sphere accuracy, recurrence or physical transfer.',
 parameters:{maximumDegree:512,fftManufactureDegree:8,fftManufactureNodes:64,costIsGate:false},
});
try {
 const primitive=fftProof(),fn=(mu,phi)=>[1+.2*mu+.3*Math.sqrt(1-mu*mu)*Math.cos(phi),.7+.1*(3*mu*mu-1)/2+.1*(1-mu*mu)*Math.cos(2*phi)];
 const direct=project(sphereRule(16),fn,8,s=>run.progress('direct-manufacture',s));
 const transformed=projectFft(sphereRule(16),fn,8,64,s=>run.progress('FFT-manufacture',s));
 let manufactureMaximum=0;
 for(const part of ['real','imag'])for(let s=0;s<2;s++)for(let j=0;j<direct[part][s].length;j++)manufactureMaximum=Math.max(manufactureMaximum,Math.abs(direct[part][s][j]-transformed[part][s][j]));
 assert.ok(manufactureMaximum<1e-11,'FFT projection versus independent direct small-rule Fourier sum');
 run.write('fft-manufactures.json',{primitive,manufactureMaximum,scope:'Small band-limited manufactures only; actual-field FFT convergence is not tested.'});

 const convergence=[];
 for(const name of parents.slice(0,3)) {
  const row=read(base+name+'/summary.json').rows[0],last=row.results.at(-1),v=last.values.at(-1);
  assert.equal(v.difference,v.normalized-row.reference);
  convergence.push({parent:name,profile:row.profile,L:row.L,count:last.count,normalized:v.normalized,difference:v.difference,projectionChange:last.projectionChange,milliseconds:last.milliseconds});
 }
 assert.ok(Math.abs(convergence.at(-1).difference)<1e-5&&Math.abs(convergence.at(-1).projectionChange)<1e-5);
 const gpu=read(base+'00693-h136-sh-gpu/summary.json').rows[0],values=read(base+'00693-h136-sh-gpu/toronto-row.json.gz').values;
 assert.equal(gpu.outgoing,4374);assert.equal(values.length,4375*4);assert.ok(values.every(x=>Number.isFinite(x)&&x>=0));
 for(const check of gpu.checks)assert.ok(check.relative<=1e-4||check.normalized<=2e-8);
 const spectral=read(base+'00694-h136-sh-spectrum/summary.json');assert.deepEqual(spectral.bands,[0,14]);assert.equal(spectral.fullSpectralRow,false);
 for(const row of spectral.rows)for(const level of row.levels){assert.equal(level.checks.length,3);assert.ok(level.checks.every(c=>c.relative<=1e-4));}

 const phaseRows=read(base+'00696-h136-phase-high/rows.json.gz'),q=gauss(4),profile=registration().profiles.find(x=>x.id==='toronto'),tails=[];
 for(const channel of [3,5,8,14]) {
  const row=phaseRows.find(x=>x.profile==='toronto'&&x.channel===channel),table=profile.control.material.phaseTables[channel],exact=phaseSquareNorm(table);
  let numeric=0;
  for(let i=1;i<table.mu.length;i++)for(let j=0;j<q.nodes.length;j++) {
   const pdf=table.pdf[i-1]*(1-q.nodes[j])+table.pdf[i]*q.nodes[j];
   numeric+=(table.mu[i]-table.mu[i-1])*q.weights[j]*pdf*pdf/(2*Math.PI);
  }
  assert.ok(Math.abs(exact-numeric)<1e-12);
  const maximum=Math.max(...row.actual.map((x,l)=>Math.abs(x-row.numeric[l])));assert.equal(maximum,row.maximum);assert.ok(maximum<1e-7);
  let sum=0;const levels=[];
  for(let l=0;l<row.actual.length;l++){sum+=(2*l+1)*row.actual[l]**2/(4*Math.PI);if([64,128,256,512].includes(l))levels.push({L:l,partial:sum,tail:exact-sum,relativeTail:(exact-sum)/exact});}
  assert.ok(levels.every((x,i)=>x.tail>=0&&(i===0||x.tail<=levels[i-1].tail)));
  tails.push({channel,exact,numeric,levels});
 }
 run.write('selected-convergence.json',{convergence,gpuHostMilliseconds:gpu.milliseconds,scope:'One native-geometry red-band integration witness and its whole-outgoing finite GPU evaluation; no whole-function truncation bound.'});
 run.write('aligned-phase-tails.json',{tails,scope:'Constant-amplitude aligned source/outgoing manufacture only. Does not bound arbitrary varying illumination or qualify degree512 everywhere.'});
 run.write('convergence.tsv',['parent\tprofile\tdegree\tqueries\treference_normalized_difference\tprojection_change\tCPU_worker_ms',...convergence.map(r=>[r.parent,r.profile,r.L,r.count,r.difference,r.projectionChange,r.milliseconds].join('\t'))].join('\n')+'\n');
 run.write('summary.json',{convergence,manufactureMaximum,phaseCases:phaseRows.length,alignedPhaseCases:tails.length,wholeOutgoing:4374,spectralPilotBands:[0,14],scope:'Numerical subset verification only; actual-field FFT, compiler bridge and recurrence remain unexecuted.'});
 run.finish('accepted',{numericalSubset:true,manufactureMaximum});console.log(JSON.stringify({run:run.path,convergence,manufactureMaximum,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}
verifyRun(run.path);
