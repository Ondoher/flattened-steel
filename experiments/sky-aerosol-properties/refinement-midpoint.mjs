import assert from 'node:assert/strict';
import {createRun,read,identity} from './io.mjs';
import {authenticate} from './refinement-common.mjs';
const midpoint=process.argv[2],baseline='tmp/experiments/sky-aerosol-properties/runs/00024-refine-colors',high='tmp/experiments/sky-aerosol-properties/runs/00026-refine-colors';
const run=createRun('refine-midpoint',[authenticate(midpoint),authenticate(baseline),authenticate(high),identity('experiments/sky-aerosol-properties/refinement-midpoint.mjs')]);let failure=null;
try{
 const all=[baseline,midpoint,high].map(root=>JSON.parse(read(root+'/summary.json').toString()).filter(s=>s.order===4));
 const rows=all[0].map(a=>{const b=all[1].find(s=>s.job.id===a.job.id),c=all[2].find(s=>s.job.id===a.job.id);assert.ok(a&&b&&c);return {condition:a.job.id,baseline:a.metrics,midpoint:b.metrics,H2400:c.metrics,horizonChange:b.metrics.horizonY/a.metrics.horizonY-1,H2400HorizonChange:c.metrics.horizonY/a.metrics.horizonY-1,nearChange:b.metrics.nearY/a.metrics.nearY-1,glowChange:b.metrics.glow/a.metrics.glow-1,glowRetained:b.metrics.nearY/a.metrics.nearY>=.9&&b.metrics.glow/a.metrics.glow>=.9};});
 const ground=rows.find(r=>r.condition==='noon5'),elevated=rows.find(r=>r.condition==='noon2000'),improvement=elevated.horizonChange-elevated.H2400HorizonChange,advance=ground.horizonChange>=.05&&improvement>=.005&&rows.every(r=>r.glowRetained);
 const decision={rows,registeredGate:{minimumGroundGain:.05,minimumElevatedImprovement:.005,maximumGlowLoss:.1},elevatedImprovement:improvement,advance,scope:'Cache-based early screen of the H1800 compromise, not independent accuracy qualification or a universal profile ranking.',next:advance?'Run targeted independent noon/2km confirmation.':'Do not expand H1800; it did not earn the registered protected-altitude compromise gate.'};
 run.write('decision.json',decision);console.log(JSON.stringify({run:run.relative,...decision}));
}catch(e){failure=e;run.write('failure.json',{error:String(e)});console.error(e);}finally{run.finish(failure,{midpoint});}if(failure)process.exitCode=1;
