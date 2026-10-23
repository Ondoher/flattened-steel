import assert from 'node:assert/strict';
import {createRun,read,identity} from './io.mjs';
import {parents,medium,measure,direction,authenticate} from './refinement-common.mjs';
const screen='tmp/experiments/sky-aerosol-properties/runs/00008-refine-screen';
const run=createRun('refine-finalist',[...parents(),authenticate(screen)]);let failure=null;
try{
 run.write('registration.json',{selection:'H2400 at fixed tau550, alpha0.8, SSA0.95, g0.85',evidence:identity(screen+'/summary.json'),prediction:'Lower surface aerosol density should brighten the ground-level horizon without removing the solar surround; elevated observers may see a different tradeoff.',protected:'Noon5m/500m/2km and Sun15degrees5m; held-out halo offsets',numericalComparison:'Both media must use identical incoming272/transport60 cache policy before attributing differences to material',deferred:'Spectral slope mostly changes hue; loading fails the absolute-glow guard; do not automatically build their finalist caches'});
 const packets=[];
 for(const H of [1200,2400])for(const condition of ['noon5','noon500','low15','noon2000']){
  if(condition==='noon5'){const file=screen+'/'+(H===1200?'combo025':'height2400')+'.json',p=JSON.parse(read(file).toString());packets.push({H,condition,...p});run.write(`H${H}-${condition}.json`,{...p,reusedFrom:identity(file)});continue;}
  const m=medium(H);m.observerHeight=condition==='noon500'?500:condition==='noon2000'?2000:5;if(condition==='low15')m.sourceDirection=direction(15);
  const p=await measure(m,s=>run.progress('direct',`H${H}/${condition}/${s}`));packets.push({H,condition,...p});run.write(`H${H}-${condition}.json`,p);
 }
 run.write('summary.json',packets.map(p=>({H:p.H,condition:p.condition,...p.metrics})));console.log(JSON.stringify({run:run.relative,summary:packets.map(p=>({H:p.H,condition:p.condition,...p.metrics}))}));
}catch(e){failure=e;run.write('failure.json',{error:String(e)});console.error(e);}finally{run.finish(failure,{scope:'Frozen finalist rationale and direct N1 controls; independent N4 confirmation remains separate'});}if(failure)process.exitCode=1;
