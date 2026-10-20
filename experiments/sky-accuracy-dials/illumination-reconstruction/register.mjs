import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,registration,read,setup,retained,pack,identity,verifyRun,activeTraining,querySeed,targets} from './common.mjs';
import {augmented,assemble} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {combinedAssess} from '../reconstruction-mechanisms/combination-math.mjs';

storage();
const parents=['00652-h133-mech-proof','00650-h132-composition','00347-h55-paper-b1','00397-h61-report'].map(p=>verifyRun(base+p));
const run=createRun('h134-recon-reg',{parents,operation:'Authenticate reconstruction and paper controls; reproduce a composition field and retained score arithmetic; freeze active-profile topology, seed, protections and supported independent-reference contracts before new physical light.',parameters:{querySeed,initialQueries:8192,channels:[3,5,8],targets,costIsGate:false,firstStep:'active-profile-only curvature and exact added-node tracing; no external/profile/reference training'}});
try{
 const r=registration(),root=base+'00650-h132-composition',f=setup(r,'paper','node-89',3),old=retained('paper','node-89',3),alloc=read(base+'00649-h132-dense-wave/node-89-allocation.json'),packet=read(base+'00649-h132-dense-wave/paper-node-89-b3.json.gz'),truthRoot=base+'00642-h132-cubic-wave',truth=read(truthRoot+'/paper-node-89-b3.json.gz'),qs=read(truthRoot+'/paper-node-89-queries.json.gz').qs,z=augmented(f,alloc.nodalScores,'targeted'),nodes=assemble(z,old.x.nodes,packet.variants.nodal.added);
 const replay=combinedAssess(f,qs,old.x.nodes,truth.angular,z.field,nodes,s=>run.progress('reproduce-composition',s));
 const saved=read(root+'/rows.json.gz').find(x=>x.profile==='paper'&&x.target==='node-89'&&x.channel===3);
 for(const k of ['results','comparisons','checks','combinedAgainstCubic','combinedAgainstNodal'])assert.deepEqual(replay[k],saved[k]);
 run.write('composition-replay.json.gz',pack(replay));
 const papers=[['H55Original40',base+'00347-h55-paper-b1/paper-scores.json','baseline'],['H61Focused60',base+'00397-h61-report/scores.json','candidate']].map(([name,path,key])=>{
  const all=read(path);if(!(key in all))throw Error(`Score key ${key}: ${Object.keys(all)}`);const s=all[key];
  assert.equal(s.conditions.length,17);assert.equal(s.sampleCount,42687);assert.ok(s.conditions.every(c=>c.sampleCount===81*31));
  const aggregate=Math.sqrt(s.conditions.reduce((a,c)=>a+c.rmseW**2,0)/17)*1000;assert.equal(aggregate,s.aggregateRmseMilliwatt);
  return {name,parent:identity(path),aggregateRmseMilliwatt:aggregate,sampleCount:s.sampleCount,units:'mW m^-2 sr^-1 nm^-1',replayedFromIntervalSquaredErrors:true};
 });
 const allocations={};for(const target of targets)for(const profile of ['paper','toronto'])allocations[`${profile}/${target}`]=activeTraining(r,profile,target,s=>run.progress('active-allocation',s));
 const references=[
  {quantity:'Atmospheric pure L1',estimator:'interior-illumination independent radial/path GPU oracle with binary64 and view/column refinement',orderCutoff:1,boundary:'black, no reflective event',status:'qualified finite controls for registered six receivers'},
  {quantity:'Local pure J2',estimator:'independent path-batch reference00613 and independently traced continuous L1 angular integral',orderCutoff:2,boundary:'black',status:'paired finite uncertainty; refine actual driver, no blanket higher-order qualification'},
  {quantity:'Local pure J3/J4 and viewed L2-L4/N4',estimator:'inventory existing continuation and paper-ray histories, require explicit event/boundary tally match',status:'not qualified by J2 reuse; register specific estimator and precision before physical claim'},
  {quantity:'Reflecting-ground or spherical twilight',estimator:'matched independent path solver only after ground/order/geometry controls',status:'no assumed libRadtran N4/twilight authority; ground return separate from air-only factorization'}
 ];
 run.write('registration.json',{querySeed,initialQueries:8192,batches:32,bootstrap:2000,targets,channels:[3,5,8],freshReserved:r.freshReserved,profiles:r.profiles.map(p=>({id:p.id,parent:identity('tmp/experiments/sky-accuracy-dials/runs/00566-h97-phase-cells/registration.json.gz')})),topology:'per receiver/solar row/profile/order; shared across outgoing/origin/active wavelengths',curvature:'32 fixed azimuths, adjacent-ring chord residual times physical polar width; equal normalized channel/origin shares; zero total share is zero',allocations,firstSpectrumRule:'Use all active spectral channels with equal normalized channel/origin shares; freeze before any full-spectrum allocation',gates:{poolRatio:.8,absoluteProtection:.001,currentProductionPaperRequired:true,costIsGate:false},references,comparators:papers,controlNote:'Current production paper/scene control must be registered from current source at builder stage; retained named paper controls are not deployed scenes.'});
 assert.equal(r.freshReserved.length,8);run.write('summary.json',{compositionReproduced:true,scoreArithmetic:papers,freshUnexposed:8,allocations:12,sourceSnapshot:true,initialStorage:storage(),noNewPhysicalLight:true});
 run.finish('accepted',{compositionReproduced:true,scoreResiduals:42687,freshUnexposed:8});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){run.finish('failed',{failure:String(e)});throw e;}
verifyRun(run.path);
