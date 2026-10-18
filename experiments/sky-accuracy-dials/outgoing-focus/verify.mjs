import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {createRun,readRepository,verifyRun,listFiles,storage} from '../io/files.mjs';

/** Parse an immutable JSON artifact. @param {string} file @returns {any} */
const json=file=>JSON.parse(readRepository(file).toString());
/** Verify accepted outgoing evidence, invariant domains, exact reuse and full-score coverage.
 * @returns {Promise<void>}
 */
async function main(){
 const roots=process.argv.slice(2);assert.ok(roots.length);const baseline=json('tmp/experiments/sky-accuracy-dials/runs/00383-h60-screen/control.json').request;
 const run=createRun('h61-verify',{parents:roots.map(r=>verifyRun(r)),operation:'Post-run immutable validation of Sun-focused same-count outgoing evidence, fixed request/incoming integration, finite pure/cumulative radiances, exact screen reuse, identity replay and complete B1 scoring when present.',parameters:{roots,baseline:'00383 fixed normalized60 request',review:'Primary self-verification; no dedicated standards reviewers.'}});let failure=null;
 try{
 const cases=[],reports=[];for(const root of roots){const seal=json(root+'/sealed.json');assert.equal(seal.state,'accepted');assert.deepEqual(seal.sourceFailures,[]);assert.equal(seal.heartbeatFailure,null);assert.equal(seal.cleanup.absent,true);
 if(listFiles(root).includes(root+'/control.json')){const c=json(root+'/control.json');assert.deepEqual(c.request,baseline);assert.equal(c.request.transportSpec.domains.outgoing.directionCount,4374);assert.equal(c.request.transportSpec.domains.incoming.directionCount,68);const p=json(root+'/geometry-proof.json');assert.ok(p.unitError<1e-12&&p.inverseError<1e-12&&p.weightMassError<1e-14);
 for(const k of c.factors)for(const ch of c.channels){const d=JSON.parse(gunzipSync(readRepository(root+`/k${k}/channel-${String(ch).padStart(2,'0')}.json.gz`)).toString());assert.equal(d.channel,ch);const orders=c.mode==='n1'?1:4,count=c.fullBoundary?1377:3;for(const group of [d.native,d.cumulative]){assert.equal(group.length,orders);for(const values of group){assert.equal(values.length,count);assert.ok(values.every(v=>Number.isFinite(v)&&v>=0));}}if(d.report){assert.equal(d.report.finalLiveFieldBytes,0);assert.equal(d.report.fieldLayout.widthJ,4374);assert.equal(d.report.fieldLayout.widthL,68);}}
 cases.push({root,control:c});
 }else{const v=json(root+'/verification.json');assert.ok(v.identityReplay<5e-6);reports.push({root,...v});}
 run.progress('verify','Authenticated '+root);await new Promise(resolve=>setImmediate(resolve));
 }
 const n1=cases.find(c=>c.control.mode==='n1');if(n1)for(const c of cases.filter(c=>c.control.mode==='orders'&&c.control.factors[0]!==1))for(const k of c.control.factors)for(const ch of c.control.channels.filter(ch=>[4,12,24].includes(ch))){const decode=root=>JSON.parse(gunzipSync(readRepository(root+`/k${k}/channel-${String(ch).padStart(2,'0')}.json.gz`)).toString()),a=decode(n1.root),b=decode(c.root);for(let ray=0;ray<3;ray++){const w=c.control.witnesses[ray],at=w.t*81+w.x*9+w.y;assert.ok(Math.abs(a.native[0][ray]/b.native[0][at]-1)<5e-6);}}
 for(const c of cases.filter(c=>c.control.channels.length===40)){
 const screen=cases.find(s=>s.control.mode===c.control.mode&&s.control.channels.length===3&&s.control.factors[0]===c.control.factors[0]);assert.ok(screen);for(const k of c.control.factors)for(const ch of [4,12,24]){const suffix=`/k${k}/channel-${String(ch).padStart(2,'0')}.json.gz`;assert.ok(readRepository(c.root+suffix).equals(readRepository(screen.root+suffix)));}
 }
 for(const r of reports.filter(r=>r.fullBoundaryScored)){const scores=json(r.root+'/scores.json');for(const s of [scores.original,scores.corrected,scores.candidate]){assert.equal(s.sampleCount,42687);assert.equal(s.conditions.length,17);assert.equal(s.fullRegisteredBoundary,true);}assert.ok(listFiles(r.root).includes(r.root+'/dome-comparison.png'));}
 assert.equal(listFiles('tmp/experiments/sky-accuracy-dials/scratch').length,1);run.write('verification.json',{cases:cases.map(c=>({root:c.root,mode:c.control.mode,factors:c.control.factors,channels:c.control.channels.length})),reports,originalNodeSlots:4374,incomingFixed:68,allFinite:true,exactScreenReuse:true,storage:storage(),limits:'Selected-ray agreement and full paper scores answer different questions. No production adoption or twilight qualification.'});console.log(JSON.stringify({run:run.path,caseCount:cases.length,reportCount:reports.length}));
 }catch(e){failure=e;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}verifyRun(run.path);if(failure)throw failure;
}
await main();
