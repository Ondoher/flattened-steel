import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRun,verifyRun,identity,resolveRepository,readRepository,storage} from '../io/files.mjs';
import {verifySceneEvidence,progressQualification} from './evidence.mjs';

/** Derive scene sheets and metrics from already sealed capture runs. @returns {void} */
function main(){
 const roots=process.argv.slice(2);assert.ok(roots.length>=1&&roots.length<=4);
 const toronto=roots.every(root=>JSON.parse(readRepository(root+'/result.json').toString()).atmosphereProfile==='toronto');
 const parents=roots.map(root=>verifySceneEvidence(root));parents.push(identity('experiments/sky-accuracy-dials/outgoing-scene/report.py'),verifyRun('tmp/experiments/sky-accuracy-dials/runs/'+(toronto?'00344-h53-scene-tor':'00343-h53-scene-prod')));
 const run=createRun(toronto?'h63-tor-report':'h62-report',{parents,operation:'Compose unchanged scene PNGs side by side; absolute display-code difference x8, decoded-pixel photometry and warmed timing summaries. No solver rerun or per-image exposure normalization.',parameters:{roots,displayDifferenceGain:8,sourceImagesRemainImmutable:true}});
 let failure=null;
 try{const summaries=[];if(roots.includes(progressQualification().root))run.write('progress-qualification.json',progressQualification());run.write('tools.json',JSON.parse(execFileSync('python',[resolveRepository('experiments/sky-accuracy-dials/outgoing-scene/report.py'),'tools',roots[0]]).toString()));
 for(const root of roots){const result=JSON.parse(readRepository(root+'/result.json').toString());assert.ok(result.accepted);const name=(result.atmosphereProfile==='toronto'?'toronto-':'')+result.profile;
 const summary=JSON.parse(execFileSync('python',[resolveRepository('experiments/sky-accuracy-dials/outgoing-scene/report.py'),'summary',root],{maxBuffer:16*1024**2}).toString());
 run.write(`${name}-metrics.json`,summary);summaries.push(summary);
 const png=execFileSync('python',[resolveRepository('experiments/sky-accuracy-dials/outgoing-scene/report.py'),'image',root],{maxBuffer:16*1024**2});
 run.write(`${name}-comparison.png`,png);
 const spectral=execFileSync('python',[resolveRepository('experiments/sky-accuracy-dials/outgoing-scene/report.py'),'spectra',root],{maxBuffer:16*1024**2});run.write(`${name}-source-spectra.png`,spectral);run.progress('visual',`${run.path}/${name}-comparison.png`);
 }
 run.write('summary.json',{accepted:true,summaries,storage:storage()});console.log(JSON.stringify({run:run.path,scenes:summaries.map(s=>s.scene),storage:storage()}));
 }catch(error){failure=error;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}
 verifyRun(run.path);if(failure)throw failure;
}
main();
