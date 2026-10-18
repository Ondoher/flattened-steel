import assert from 'node:assert/strict';
import {createRun,verifyRun,readRepository,identity,storage} from '../io/files.mjs';
import {verifySceneEvidence,progressQualification} from './evidence.mjs';

/** Validate immutable scene evidence, matching controls, capture coverage and owned cleanup.
 * @returns {void}
 */
function main(){
 const roots=process.argv.slice(2);assert.ok(roots.length>=4);
 const records=roots.map(root=>{const seal=verifySceneEvidence(root);return{root,seal,record:JSON.parse(readRepository(root+'/sealed.json').toString())};});
 const run=createRun('h62-verify',{parents:records.map(r=>r.seal),operation:'Verify immutable H62 capture/report hashes, scientific controls, scene coverage, source snapshots, cleanup, finite timings, mapping identities and identity publication. Prior failed run stays failed.',parameters:{roots}});
 let failure=null;const scenes=[];let realNoon=false;const networkRoot=roots.find(root=>root.endsWith('-h62-network'));assert.ok(networkRoot);const network=JSON.parse(readRepository(networkRoot+'/network.json').toString());assert.deepEqual(network.missingRequests,[{path:'/favicon.ico',status:404}]);assert.equal(network.serverFailures.length,0);
 try{
 if(roots.includes(progressQualification().root))run.write('progress-qualification.json',progressQualification());
 for(const {root,record}of records){assert.equal(record.state,'accepted');assert.equal(record.sourceFailures.length,0);assert.equal(record.heartbeatFailure,null);assert.ok(record.cleanup.absent);
 if(record.artifacts.some(a=>a.path.endsWith('/packet-proof.json'))){const proof=JSON.parse(readRepository(root+'/packet-proof.json').toString());assert.equal(proof.channel,7);for(const key of ['baseline','focused'])for(const p of proof[key].packetReports.actualLookup.reports)assert.ok(p.maximumRelative<5e-6);const transform=JSON.parse(readRepository(root+'/transform.json').toString());const noonRoot=roots.find(r=>r.endsWith('-h62-noon'));const original=JSON.parse(readRepository(noonRoot+'/transform.json').toString());assert.equal(transform.baselineSha256,original.baselineSha256);assert.equal(transform.candidateSha256,original.candidateSha256);assert.equal(transform.lookupSha256,original.lookupSha256);realNoon=true;}
 if(record.artifacts.some(a=>a.path.endsWith('/allocation.json'))){const proof=JSON.parse(readRepository(root+'/allocation.json').toString());assert.equal(new Set(proof.prefixes).size,2);for(const child of proof.paths)verifyRun(child);}
 if(!record.artifacts.some(a=>a.path.endsWith('/captures.json')))continue;
 const control=JSON.parse(readRepository(root+'/control.json').toString()),result=JSON.parse(readRepository(root+'/result.json').toString()),captures=JSON.parse(readRepository(root+'/captures.json').toString());
 assert.equal(result.accepted,true);assert.equal(result.serverFailures.length,0);assert.ok(!result.consoleMessages.some(m=>m.type==='pageerror'));const errors=result.consoleMessages.filter(m=>m.type==='error');assert.equal(errors.length,1);assert.equal(errors[0].text,'Failed to load resource: the server responded with a status of 404 (Not Found)');assert.equal(control.mapping.k,.35);assert.equal(control.mapping.slots,4374);
 assert.deepEqual(control.baseline.transportSpec,control.candidate.transportSpec);assert.equal(control.baseline.transportSpec.numerical.transportIntervalCount,60);
 const spec=control.baseline.transportSpec;assert.equal(spec.numerical.sourcePathTransmittanceIntervalCount,20);assert.equal(spec.numerical.maximumScatteringOrder,4);assert.equal(spec.numerical.solarInterpolation,'monotone-cubic');assert.equal(spec.domains.position.count,48);assert.equal(spec.domains.solarZenith.count,180);assert.equal(spec.domains.incoming.directionCount,68);assert.equal(spec.domains.outgoing.directionCount,4374);assert.equal(spec.domains.spectrum.channels.length,15);
 const headings=control.scene==='noon'?[0,90,180]:[0];assert.equal(captures.length,headings.length*3);
 for(const heading of headings){const group=captures.filter(c=>c.heading===heading);assert.deepEqual(group.map(c=>c.variant).sort(),['corrected','deployed','focused']);
 for(const c of group){assert.equal(c.facts.observation.instant,control.observation.instant);assert.deepEqual(c.facts.direction,group[0].facts.direction);assert.equal(c.facts.viewport.width,1024);assert.equal(c.facts.viewport.height,768);assert.equal(c.facts.cpuSubmitMilliseconds.length,12);assert.ok(c.facts.cpuSubmitMilliseconds.every(v=>Number.isFinite(v)&&v>=0));assert.ok(c.facts.gpuMilliseconds.every(v=>Number.isFinite(v)&&v>=0));identity(root+'/'+c.file);}
 }
 for(const proof of result.production.proof.reports)assert.ok(proof.maximumRelative<5e-6);
 assert.equal(result.baseline.buildTimings.length,15);assert.equal(result.candidate.buildTimings.length,30);
 for(const key of ['baseline','candidate']){const spectrum=result[key].packetReports.densitySpectra;assert.equal(spectrum.length,3);for(const p of spectrum){assert.equal(p.spectrum.length,15);assert.ok(p.spectrum.every(v=>v===null||(Number.isFinite(v)&&v>=0)));}}
 if(control.scene!=='noon')for(const key of ['baseline','candidate'])for(const p of result[key].packetReports.actualLookup.reports)assert.ok(p.maximumRelative<5e-6);
 scenes.push({scene:control.scene,instant:control.observation.instant,root,captures:captures.length,buildMilliseconds:result.candidate.buildTimings,atlasBytes:result.candidate.logicalCandidateAtlasBytes});
 }
 assert.ok(realNoon,'Actual packed noon lookup proof required');
 const extended=scenes.some(s=>s.scene==='twilight60');
 assert.deepEqual(scenes.map(s=>s.scene).sort(),extended?['noon','sunset','twilight','twilight60']:['noon','sunset','twilight']);assert.equal(scenes.find(s=>s.scene==='noon').instant,'2024-06-20T20:08:46.261Z');assert.equal(Date.parse(scenes.find(s=>s.scene==='twilight').instant)-Date.parse(scenes.find(s=>s.scene==='sunset').instant),1800000);
 if(extended){
 const extra=scenes.find(s=>s.scene==='twilight60'),old=scenes.find(s=>s.scene==='twilight');
 assert.equal(Date.parse(extra.instant)-Date.parse(scenes.find(s=>s.scene==='sunset').instant),3600000);
 assert.equal(extra.instant,'2024-06-21T04:26:03.503Z');
 const extraControl=JSON.parse(readRepository(extra.root+'/control.json').toString()),oldControl=JSON.parse(readRepository(old.root+'/control.json').toString());
 for(const key of ['baseline','candidate','mapping'])assert.deepEqual(extraControl[key],oldControl[key]);
 assert.deepEqual(extraControl.observation.location,oldControl.observation.location);
 const result=JSON.parse(readRepository(extra.root+'/result.json').toString());assert.deepEqual(result.missingRequests,[{path:'/favicon.ico',status:404}]);
 const captures=JSON.parse(readRepository(extra.root+'/captures.json').toString());for(const c of captures){assert.equal(c.facts.gpuMilliseconds.length,12);assert.equal(c.facts.timerUnavailable,null);assert.equal(c.facts.horizontalFovDegrees,60);assert.equal(c.facts.pitchDegrees,5);}
 const reports=records.filter(r=>r.record.artifacts.some(a=>a.path.endsWith('/twilight60-metrics.json')));assert.equal(reports.length,1);
 const metrics=JSON.parse(readRepository(reports[0].root+'/twilight60-metrics.json').toString());assert.equal(metrics.scene,'twilight60');assert.equal(metrics.entries.length,1);assert.deepEqual(metrics.entries[0].variants.focused.facts,captures.find(c=>c.variant==='focused').facts);
 }
 run.write('verification.json',{accepted:true,scenes,parents:records.map(r=>({root:r.root,seal:r.seal})),storage:storage(),networkQualification:'Historical console errors lack URL metadata. Each has exactly one generic404; a fresh same-route startup replay identifies favicon.ico as the only404. Required asset hashes/frame readiness and zero server/page errors are checked separately.',scope:'Actual scene and runtime qualification; twilight visual owner acceptance separate; no production promotion.'});console.log(JSON.stringify({run:run.path,scenes:scenes.map(s=>s.scene),storage:storage()}));
 }catch(error){failure=error;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}
 verifyRun(run.path);if(failure)throw failure;
}
main();
