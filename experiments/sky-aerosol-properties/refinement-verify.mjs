import assert from 'node:assert/strict';
import {readdirSync,statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {gunzipSync} from 'node:zlib';
import {createRequire} from 'node:module';
import {checked,read,identity,repository,output,createRun} from './io.mjs';
import {authenticate,medium,queries} from './refinement-common.mjs';

const analysis=process.argv[2],midpoint=process.argv[3];
assert.match(analysis??'',/^tmp\/experiments\/sky-aerosol-properties\/runs\/\d{5}-refine-analysis$/);
assert.match(midpoint??'',/^tmp\/experiments\/sky-aerosol-properties\/runs\/\d{5}-refine-midpoint$/);
const run=createRun('refine-verify',[authenticate(analysis),authenticate(midpoint),identity('experiments/sky-aerosol-properties/refinement-verify.mjs')]);
let failure=null;
try{
 const roots=readdirSync(checked(output+'/runs')).filter(n=>/^\d{5}-/.test(n)&&n!==run.relative.split('/').at(-1)).map(n=>output+'/runs/'+n),inventory=[];
 for(const root of roots){
  run.progress('authenticate',root);const m=JSON.parse(read(root+'/manifest.json').toString());
  assert.equal(m.state,[0,13,19,45].includes(Number(root.split('/').at(-1).slice(0,5)))?'failed':'accepted');
  let bytes=0;for(const a of m.artifacts){assert.ok(a.path.startsWith(root+'/'));assert.deepEqual(identity(a.path),a);bytes+=a.byteLength;await new Promise(r=>setImmediate(r));}
  for(const p of m.parents.filter(p=>p.path.startsWith(output+'/runs/')))assert.deepEqual(identity(p.path),p);
  const events=read(root+'/progress.jsonl').toString().trim().split('\n').map(s=>JSON.parse(s)),gap=Math.max(0,...events.slice(1).map((e,i)=>(Date.parse(e.timestamp)-Date.parse(events[i].timestamp))/1000));
  assert.equal(events.at(-1).state,m.state);inventory.push({root,state:m.state,artifactCount:m.artifacts.length,bytes,maximumProgressGapSeconds:gap,progressTargetMet:gap<=30.5});
 }
 const screen=output+'/runs/00008-refine-screen',registration=JSON.parse(read(screen+'/registration.json').toString()),controls=JSON.parse(read(screen+'/controls.json').toString());
 assert.equal(registration.variants.length,11);assert.ok(controls.molecularInvariant<1e-12&&controls.aerosolSsaScaling<1e-12);
 let maximumDirectRefinement=0,maximumGpuRelative=0;
 for(const v of registration.variants){const p=JSON.parse(read(screen+'/'+v.id+'.json').toString());assert.deepEqual(p.medium,medium(v.H,v.alpha,v.loading,v.ssa));assert.equal(p.rays.length,26);
  for(const q of p.rays){if(q.ground)continue;assert.equal(q.spectrum.length,15);assert.ok(q.spectrum.every(x=>Number.isFinite(x)&&x>=0));maximumDirectRefinement=Math.max(maximumDirectRefinement,q.refinement);}
  for(const field of ['horizon','sun']){const g=JSON.parse(read(screen+'/'+v.id+'-'+field+'-gpu.json').toString());assert.ok(!/software|swiftshader|llvmpipe/i.test(g.renderer));for(const p of g.parity)maximumGpuRelative=Math.max(maximumGpuRelative,p.maximumRelative);
   const b=gunzipSync(read(screen+'/'+v.id+'-'+field+'-linear.f32.gz'));assert.equal(b.length,240*160*4*4);for(let i=0;i<b.length;i+=4)assert.ok(Number.isFinite(b.readFloatLE(i)));
  }
 }
 assert.ok(maximumDirectRefinement<=.002&&maximumGpuRelative<=.005);
 for(const q of queries(medium()).filter(r=>r.heldOut)){const separation=Math.acos(Math.max(-1,Math.min(1,q.direction.reduce((s,v,i)=>s+v*medium().sourceDirection[i],0))))*180/Math.PI;assert.ok(Math.abs(separation-Number(q.id.split('-').at(-1)))<1e-10);assert.equal(q.ground,false);}
 const comparisons=JSON.parse(read(analysis+'/comparisons.json').toString()),effects=JSON.parse(read(analysis+'/effects.json').toString()),summary=JSON.parse(read(analysis+'/summary.json').toString());
 assert.equal(comparisons.length,32);assert.equal(effects.length,4);assert.equal(summary.qualifiedComparisons,comparisons.filter(r=>r.qualified).length);
 for(const r of comparisons){assert.equal(r.cache.spectrum.length,15);assert.equal(r.independent.spectrum.length,15);assert.ok([...r.cache.spectrum,...r.independent.spectrum].every(x=>Number.isFinite(x)&&x>=0));assert.equal(r.qualified,!Object.values(r.failedTargets).some(Boolean));}
 for(const e of effects)assert.equal(e.retainsGlow,e.nearChange>=-.1&&e.glowChange>=-.1);
 const decision=JSON.parse(read(midpoint+'/decision.json').toString());assert.equal(decision.advance,decision.rows.find(r=>r.condition==='noon5').horizonChange>=.05&&decision.elevatedImprovement>=.005&&decision.rows.every(r=>r.glowRetained));
 const cacheRoots=[20,25,36].map((n)=>roots.find(r=>r.split('/').at(-1).startsWith(String(n).padStart(5,'0')+'-'))),resources=[];
 for(const root of cacheRoots){run.progress('cache-proof',root);const t=JSON.parse(read(root+'/telemetry.json').toString()),c=JSON.parse(read(root+'/control.json').toString());assert.ok(!/software|swiftshader|llvmpipe/i.test(t.renderer));let peak=0,observations=0,closure=0;
  assert.equal(c.jobs.length,4);assert.equal(c.channels.length,15);assert.equal(c.request.transportSpec.domains.incoming.directionCount,272);assert.equal(c.request.transportSpec.numerical.transportIntervalCount,60);assert.equal(c.intervals,96);
  for(let channel=0;channel<15;channel++){const p=JSON.parse(gunzipSync(read(root+`/channel-${channel}.json.gz`)).toString());assert.equal(p.channel,channel);assert.equal(p.records.length,4);peak=Math.max(peak,p.report.peakLiveFieldBytes);assert.equal(p.report.finalLiveFieldBytes,0);
   for(let n=0;n<4;n++)for(let j=0;j<4;j++){const v=p.records[n].jobs[j];assert.equal(v.cumulative.length,t.queryCount);assert.equal(v.pure.length,t.queryCount);for(let i=0;i<v.cumulative.length;i++){const value=v.cumulative[i],pure=v.pure[i],previous=n?p.records[n-1].jobs[j].cumulative[i]:0;assert.ok(Number.isFinite(value)&&Number.isFinite(pure)&&value>=0&&pure>=0);closure=Math.max(closure,Math.abs(value-previous-pure)/Math.max(value,1e-12));observations++;}}
   await new Promise(r=>setImmediate(r));
  }
  resources.push({root,renderer:t.renderer,milliseconds:t.milliseconds,compilerPeakFieldBytes:peak,observerAccumulatorBytes:t.extraAccumulatorBytes,logicalGpuTextureUpperBoundBytes:peak+t.extraAccumulatorBytes,nodeMemorySnapshot:t.nodeMemory,observations,pureCumulativeMaximumRelativeClosure:closure,orderAccounting:'Pure order and accumulated fields are traced independently. Monotone solar interpolation is nonlinear, so tracing the sum need not equal summing traced increments. This closure residual is reported, not asserted to be roundoff.',limitation:'Logical texture allocation upper bound and sampled Node RSS; neither is an OS or driver peak-memory measurement.'});
 }
 const corrected=output+'/runs/00041-refine-colors',parity=JSON.parse(read(corrected+'/n1-parity.json').toString());assert.equal(parity.materialMatched,true);assert.deepEqual(identity(parity.reference.path),parity.reference);
 const {PNG}=createRequire(import.meta.url)('pngjs');for(const field of ['horizon','sun']){const images=[output+'/runs/00024-refine-colors',corrected].map(root=>PNG.sync.read(read(root+'/noon5-N4-'+field+'.png'))),png=new PNG({width:images[0].width*2,height:images[0].height});images.forEach((image,i)=>PNG.bitblt(image,png,0,0,image.width,image.height,i*image.width,0));run.write(field+'-comparison.png',PNG.sync.write(png));}
 const changed=execFileSync('git',['diff','b00c7f40','--name-only'],{cwd:repository,encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean),allowed=['experiments/sky-aerosol-properties/','agents/topics/poc-experiments/engineering-studies/sky-aerosol-properties/','agents/topics/active-topic.md'];assert.ok(changed.every(p=>allowed.some(a=>p.startsWith(a))));
 const worktree=execFileSync('git',['status','--porcelain=v1','-z','--untracked-files=all'],{cwd:repository,encoding:'utf8'}).split('\0').filter(Boolean);assert.ok(worktree.every(p=>allowed.some(a=>p.slice(3).startsWith(a))));
 const scratch=readdirSync(checked(output+'/scratch'));assert.equal(scratch.length,0,'Every owned GPU/reference scratch directory must be closed and cleaned.');
 const totalBytes=inventory.reduce((s,r)=>s+r.bytes+statSync(checked(r.root+'/manifest.json')).size,0);
 run.write('source.mjs',read('experiments/sky-aerosol-properties/refinement-verify.mjs'));run.write('inventory.json',inventory);run.write('resources.json',{caches:resources,retainedClosedRunBytes:totalBytes,activeScratchEntries:scratch,measurementLimitations:['Total includes historical first campaign and invalidated runs; no earlier evidence was deleted.','Independent and external timings are retained in their authenticated telemetry/readings.','Historical peak transient disk and total browser/WSL/driver RSS were not instrumented.']});
 run.write('verification.json',{analysis,midpoint,artifactIntegrity:true,productionUnchangedSince:'b00c7f40',changedPaths:changed,maximumDirectRefinement,maximumGpuRelative,qualifiedComparisons:summary.qualifiedComparisons,totalComparisons:32,scientificExceptions:summary.failed,progressExceptions:inventory.filter(r=>!r.progressTargetMet),retainedBytes:totalBytes,interpretation:'Execution and evidence verification passes; reported numerical misses remain held scientific claims, not silently accepted accuracy.'});
 console.log(JSON.stringify({run:run.relative,qualified:summary.qualifiedComparisons,progressExceptions:inventory.filter(r=>!r.progressTargetMet),retainedMiB:totalBytes/1048576,resources}));
}catch(e){failure=e;run.write('failure.json',{error:String(e)});console.error(e);}finally{run.finish(failure,{analysis,midpoint,operation:'Read-only immutable artifact proof, causal controls, actual sky-field comparison and numerical-exception accounting.'});}if(failure)process.exitCode=1;
