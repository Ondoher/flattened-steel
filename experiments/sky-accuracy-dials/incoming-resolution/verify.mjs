import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {createRun,readRepository,verifyRun,identity,listFiles,storage} from '../io/files.mjs';
import {color} from '../paper-rays/color.mjs';

const baseline='tmp/experiments/sky-accuracy-dials/runs/00379-h59-40-screen',reference='tmp/experiments/sky-accuracy-dials/runs/00368-h58-order-report';
/** Decode authenticated run JSON. @param {string} file @returns {any} */
const json=file=>JSON.parse(readRepository(file).toString());
/** Decode a compact wavelength result. @param {string} file @returns {any} */
const channel=file=>JSON.parse(gunzipSync(readRepository(file)).toString());
/** Spectral RMS with explicit positive equal-band weights. @param {number[]} x @returns {number} */
const rms=x=>Math.sqrt(x.reduce((s,v)=>s+v*v,0)/x.length);

/** Independent post-run invariants, exact reuse and signed error-cancellation decomposition.
 * @returns {Promise<void>}
 */
async function main(){
 const roots=process.argv.slice(2);assert.ok(roots.length);const ref=json(reference+'/comparison.json'),pure=json(reference+'/pure-orders.json');
 const run=createRun('h60-verify',{parents:[verifyRun(baseline),verifyRun(reference),...roots.map(r=>identity(r+'/sealed.json'))],operation:'Read-only post-run verification of complete incoming-resolution builds, exact J1/N1 and outgoing-domain invariants, screen reuse, reference compatibility and signed component-error cancellation. No new solver execution.',parameters:{roots,baseline,reference,identity:'C4-referenceC4 = (cacheN1-referenceN1) + (sum cacheN2-4 - sum referenceN2-4) + cumulative grouping remainder; retain independent reference sum rounding separately.'}});let failure=null;const start=performance.now();
 try{
 const verified=[];for(const root of roots){const seal=verifyRun(root),d=json(root+'/sealed.json');assert.equal(d.state,'accepted');assert.deepEqual(d.sourceFailures,[]);assert.equal(d.heartbeatFailure,null);verified.push({seal,state:d.state,cleanup:d.cleanup});run.progress('verify','Verified '+root);}
 const caseRoots=roots.filter(root=>listFiles(root).includes(root+'/control.json')&&json(root+'/control.json').schema==='h60-incoming-resolution-v1');
 // Report and uncertainty runs are authenticated above but have no numerical control packet.
 const cases=[],baselineChannels=Array.from({length:40},(_,c)=>channel(baseline+`/channel-${String(c).padStart(2,'0')}.json.gz`));
 for(const root of caseRoots){const control=json(root+'/control.json');for(const rule of control.rules){const incoming=json(root+'/'+rule.id+'/incoming.json'),n=rule.mu*rule.azimuth||68;assert.equal(incoming.directionCount,n);assert.equal(incoming.unitVectors.length,n);assert.ok(incoming.integrationWeightsSteradians.every(w=>w>0));assert.ok(Math.abs(incoming.integrationWeightsSteradians.reduce((s,w)=>s+w,0)-4*Math.PI)<1e-11);for(const v of incoming.unitVectors)assert.ok(Math.abs(Math.hypot(...v)-1)<1e-12);
 const channels=control.channels.map(c=>{const d=channel(root+`/${rule.id}/channel-${String(c).padStart(2,'0')}.json.gz`),b=baselineChannels[c];assert.equal(d.channel,c);assert.equal(d.rule,rule.id);assert.deepEqual(d.native[0],b.native[0]);assert.deepEqual(d.cumulative[0],b.cumulative[0]);assert.equal(d.report.fieldLayout.widthJ,4374);assert.equal(d.report.fieldLayout.widthL,n);assert.equal(d.report.fieldLayout.height,9180);assert.equal(d.report.finalLiveFieldBytes,0);for(const group of [d.native,d.cumulative]){assert.equal(group.length,4);for(const row of group){assert.equal(row.length,3);assert.ok(row.every(v=>Number.isFinite(v)&&v>=0));}}if(rule.id==='F68'){assert.deepEqual(d.native,b.native);assert.deepEqual(d.cumulative,b.cumulative);}return d;});cases.push({root,rule,channels,full:channels.length===40});}}
 const screen=cases.find(c=>!c.full&&c.rule.id==='F68').root;for(const c of cases.filter(c=>c.full))for(const wavelength of [4,12,24]){const file=`/${c.rule.id}/channel-${String(wavelength).padStart(2,'0')}.json.gz`;assert.ok(readRepository(c.root+file).equals(readRepository(screen+file)));}
 const decompositions=[];
 const evaluate=(label,channels,full)=>{for(let ray=0;ray<3;ray++){
 const scored=channels.filter(c=>c.channel<=30),first=[],higher=[],grouping=[],total=[],identityResidual=[];
 for(const d of scored){const p=Array.from({length:4},(_,o)=>pure.find(r=>r.ray===ray&&r.method==='Independent'&&r.order===o+1).spectrum[d.channel]),referenceC4=ref.rows.find(r=>r.ray===ray&&r.method==='Independent'&&r.order===4).spectrum[d.channel],e1=d.native[0][ray]-p[0],eh=d.native.slice(1).reduce((s,o)=>s+o[ray],0)-p.slice(1).reduce((s,v)=>s+v,0),g=d.cumulative[3][ray]-d.native.reduce((s,o)=>s+o[ray],0),e=d.cumulative[3][ray]-referenceC4;first.push(e1);higher.push(eh);grouping.push(g);total.push(e);identityResidual.push(e-e1-eh-g);}
 const maximumIdentity=Math.max(...identityResidual.map(Math.abs));assert.ok(maximumIdentity<1e-14);const combined=first.map((v,i)=>v+higher[i]),index=1-rms(combined)/(rms(first)+rms(higher));
 const y=full?{first:color(channels.map(d=>d.native[0][ray]-pure.find(p=>p.ray===ray&&p.method==='Independent'&&p.order===1).spectrum[d.channel]),ref.centers).Y,higher:color(channels.map(d=>d.native.slice(1).reduce((s,o)=>s+o[ray],0)-[2,3,4].reduce((s,o)=>s+pure.find(p=>p.ray===ray&&p.method==='Independent'&&p.order===o).spectrum[d.channel],0)),ref.centers).Y}:null;
 decompositions.push({label,ray,full,channels:scored.map(d=>d.channel),firstErrorRmsMilliwatt:1000*rms(first),higherErrorRmsMilliwatt:1000*rms(higher),groupingRmsMilliwatt:1000*rms(grouping),totalErrorRmsMilliwatt:1000*rms(total),cancellationIndex:index,signedYErrors:y,maximumIdentity,meaning:'Cancellation index1-norm(e1+eh)/(norm(e1)+norm(eh)); grouping is reported separately. Same physical-order independent references, not retained legacy libRadtran.'});
 }};
 evaluate('F68',baselineChannels,true);for(const c of cases)evaluate(c.rule.id,c.channels,c.full);
 assert.equal(listFiles('tmp/experiments/sky-accuracy-dials/scratch').length,1,'Only the verifier scratch owner remains.');run.write('verification.json',{verified,caseCount:cases.length,allN1Exact:true,fixedOutgoing4374:true,exactScreenReuse:true,decompositions,storage:storage(),milliseconds:performance.now()-start,limits:'Three selected rays; no full B1 score, no global convergence claim, no production or variable-per-order implementation.'});console.log(JSON.stringify({run:run.path,decompositions:decompositions.filter(d=>d.full),milliseconds:performance.now()-start}));
 }catch(e){failure=e;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,milliseconds:performance.now()-start});}verifyRun(run.path);if(failure)throw failure;
}
await main();
