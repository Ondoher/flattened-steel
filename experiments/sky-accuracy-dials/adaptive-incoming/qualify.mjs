import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {createRun,verifyRun,readRepository,identity,sha256,storage} from '../io/files.mjs';
import {kernel} from '../distant-horizon/toronto-orders.mjs';
import {halfWidth} from '../distant-horizon/libradtran.mjs';
import {read} from './campaign.mjs';

const root=process.argv[2],report=process.argv[3];
assert.match(root,/^tmp\/experiments\/sky-accuracy-dials\/runs\/\d{5}-h70-layer-screen$/);
assert.match(report,/^tmp\/experiments\/sky-accuracy-dials\/runs\/\d{5}-h70-final-report$/);
const parents=[verifyRun(root),verifyRun(report)],reg=read(root+'/registration.json.gz'),refs=read(root+'/references.json'),old=read('tmp/experiments/sky-accuracy-dials/runs/00447-h67-sunset-j2/analysis.json').rows,paper=read('tmp/experiments/sky-accuracy-dials/runs/00347-h55-paper-b1/control.json'),p=reg.profiles.find(p=>p.id==='paper').control,analysis=read(report+'/analysis.json'),verified=read(report+'/verification.json');
assert.deepEqual(p.request.transportSpec.atmosphere,paper.buildRequest.transportSpec.atmosphere);assert.ok(p.material.phaseTables.every(t=>t===null));assert.ok(p.material.albedos.every(x=>x===.8));
for(const r of refs){
 assert.ok(r.mean>0&&r.relativeHalf95<=.05&&Math.abs(r.quadratureChange)<=.01);
 if(r.profile==='toronto'){const x=old.find(x=>x.id===r.id&&x.channel===r.channel);assert.equal(r.mean,x.monteCarlo.J2);assert.equal(r.half95,x.monteCarlo.J2Half95);}
}
let maximumReferenceControl=0;for(const channel of reg.channels){
 const actual=gunzipSync(readRepository(root+`/paper-kernel-${channel}.glsl.gz`));assert.equal(sha256(actual),sha256(kernel(null,.8).shader),'Unchanged validated full kernel, prefix tallies only');
 const batches=read(root+`/paper-reference-batches-${channel}.json.gz`);for(let group=0;group<4;group++){
  const main=batches.filter(b=>b.group===group&&b.profile==='main'),coarse=batches.filter(b=>b.group===group&&b.profile==='control64'),r=refs.find(r=>r.profile==='paper'&&r.id===reg.targets[group].id&&r.channel===channel),change=(coarse.reduce((s,b)=>s+b.means[2],0)/64)/(main.slice(0,64).reduce((s,b)=>s+b.means[2],0)/64)-1;assert.equal(r.quadratureChange,change);assert.equal(r.relativeHalf95,r.half95/r.mean);maximumReferenceControl=Math.max(maximumReferenceControl,Math.abs(change));
 }
}
assert.equal(analysis.rows.length,264);assert.equal(analysis.verdicts.length,6);assert.equal(analysis.advancing.length,0);assert.ok(analysis.verdicts.every(v=>v.status==='rejected'&&v.profiles.find(p=>p.profile==='toronto').resolvedRegression));assert.equal(verified.maximumRetainedReplay,0);
const notes={state:'accepted evidence; all six A/B/C configurations scientifically rejected',numericalParent:root,reportParent:report,cases:264,paperReferences:12,reusedTorontoReferences:12,maximumReferenceControl,retainedReferenceReplay:0,actualEvaluations:verified.actualIncidentEvaluations,unusedConditionalStages:['H71','H72','H73','H74'],notClaimed:['C placement validation','actual native row-dependent boundary implementation','full N4/B1/scene qualification','global failure of layered grids'],figuresInspected:['H69 geometry','H70 comparison','H70 aggregate errors'],numericalQualification:'Figures label numerical/reference/grid qualification only; qualified does not mean candidate accepted.',sourceReview:'Primary self-review and required local type checking; dedicated experiment reviewers disabled.',storageBefore:storage()};
const run=createRun('h70-qualify',{parents,operation:'Independent post-seal artifact, profile/material and complete-kernel identities; exact retained Toronto references; paper reference control recomputation; rejected-branch and image qualification. No source-run mutation or GPU rerun.'});let failure=null;
try{run.write('qualification.json',notes);}catch(e){failure=e;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null,storage:storage()}));if(failure)throw failure;
