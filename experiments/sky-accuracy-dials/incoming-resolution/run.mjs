import assert from 'node:assert/strict';
import path from 'node:path';
import {gzipSync,gunzipSync} from 'node:zlib';
import {rollup} from 'rollup';
import puppeteer from 'puppeteer';
import {createRun,readRepository,identity,verifyRun,checkedAbsolute,repositoryRoot,sha256,storage} from '../io/files.mjs';
import {browserSources} from '../execution.mjs';
import {loadCase,jointPath} from '../paper-b1/diagnosis-data.mjs';
import {createProductQuadrature} from '../numerics/profile.js';

const compiler=jointPath+'/normalized-paper-compiler.js',entry='experiments/sky-accuracy-dials/angular-interpolation/browser.js';
const baselineRoot='tmp/experiments/sky-accuracy-dials/runs/00379-h59-40-screen';
const definitions=[{id:'F68',mu:0,azimuth:0},{id:'GL128',mu:8,azimuth:16},{id:'GL256',mu:16,azimuth:16},{id:'GL512',mu:16,azimuth:32},{id:'GL1024',mu:32,azimuth:32}];

/** Authenticate a prior compact channel packet. @param {string} root @param {number} c @returns {any} */
function saved(root,c){return JSON.parse(gunzipSync(readRepository(root+`/channel-${String(c).padStart(2,'0')}.json.gz`)).toString());}

/** Build complete higher-order fields on a registered incoming rule, retaining three rays only.
 * @returns {Promise<void>}
 */
async function main(){
 const mode=process.argv[2]??'screen';assert.ok(['screen','full'].includes(mode));const chosen=process.argv[3];
 const rules=mode==='screen'?definitions:definitions.filter(d=>d.id===chosen);assert.ok(rules.length);
 const baseline=loadCase(jointPath),baselineSeal=verifyRun(baselineRoot),channels=mode==='screen'?[4,12,24]:Array.from({length:40},(_,i)=>i);
 const reuseRoot=process.argv[4];let reuseControl=null,reuseSeal=null;if(reuseRoot){reuseSeal=verifyRun(reuseRoot);reuseControl=JSON.parse(readRepository(reuseRoot+'/control.json').toString());assert.equal(mode,'full');}
 const control={schema:'h60-incoming-resolution-v1',request:baseline.control.buildRequest,scenes:baseline.control.scenes,witnesses:[{t:0,x:4,y:7},{t:1,x:4,y:7},{t:6,x:3,y:6}],channels,rules,readout:'Original phase-bearing J1 angular lookup; all native cumulative/pure views.',fixed:'Native51 Z180 W27 source20 transport60 normalized Mie mass Q30 monotone-cubic'};
 const closure=browserSources([entry,compiler]),browserSource=readRepository(entry).toString()+`\nimport * as compiler from '${path.join(repositoryRoot,compiler).split(path.sep).join('/')}';globalThis['__h60Execute']=c=>execute(c,compiler);\n`;
 const run=createRun(mode==='screen'?'h60-screen':'h60-full-'+chosen.toLowerCase(),{parents:[baseline.seal,baselineSeal,...closure,...(reuseSeal?[reuseSeal]:[])],operation:'Complete J1/L1/J2/L2/J3/L3/J4 hardware-GPU rebuild with only incoming quadrature changed; preserve original N1 readout and all fixed physical/outgoing/view settings. Retain only three registered witness spectra and build diagnostics.',parameters:{controlValueSha256:sha256(JSON.stringify(control)),controlArtifact:'control.json',mode,rules,channels,N1Replacement:false,baselineGit:'348f3550',reuseRoot:reuseRoot??null}});
 let browser,failure=null;const started=performance.now(),completed=[];
 try{
 run.write('control.json',control);
 const bundle=await rollup({input:checkedAbsolute(path.join(repositoryRoot,entry)),plugins:[{name:'h60-entry-only',transform(code,id){return path.resolve(id)===path.join(repositoryRoot,entry)?{code:browserSource,map:null}:null;}}]});let code;try{code=(await bundle.generate({format:'iife'})).output[0].code;}finally{await bundle.close();}run.write('browser.js.gz',gzipSync(Buffer.from(code)));
 browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'gpu'),false),protocolTimeout:1800000,args:['--enable-gpu','--ignore-gpu-blocklist','--use-angle=d3d11','--disable-background-timer-throttling']});const page=await browser.newPage();let current=null;
 await page.exposeFunction('__h59Progress',message=>{run.progress('gpu',current.id+': '+String(message));if(String(message).includes('complete in'))console.log(JSON.stringify({rule:current.id,progress:message}));});
 await page.exposeFunction('__h59Channel',r=>{
 const b=saved(baselineRoot,r.channel);assert.deepEqual(r.native[0],b.native[0],'Incoming quadrature must not change viewed J1');assert.deepEqual(r.cumulative[0],b.cumulative[0]);assert.equal(r.report.fieldLayout.widthJ,4374);assert.equal(r.report.fieldLayout.height,9180);assert.equal(r.report.fieldLayout.widthL,current.mu*current.azimuth||68);assert.equal(r.report.finalLiveFieldBytes,0);
 if(current.id==='F68'){assert.deepEqual(r.native,b.native);assert.deepEqual(r.cumulative,b.cumulative);}
 const data={...r,rule:current.id};delete data.diagnostics;delete data.transports;delete data.quadrature;delete data.directBases;delete data.direct;delete data.angularNative;
 run.write(`${current.id}/channel-${String(r.channel).padStart(2,'0')}.json.gz`,gzipSync(Buffer.from(JSON.stringify(data))));completed.push({rule:current.id,channel:r.channel,milliseconds:r.milliseconds,peakFieldBytes:r.report.peakLiveFieldBytes});
 });
 await page.addScriptTag({content:code});const executions=[];
 for(const rule of rules){current=rule;const request=rule.mu?{...control.request,id:'h60-'+rule.id.toLowerCase()+'-normalized60-original-n1',transportSpec:{...control.request.transportSpec,domains:{...control.request.transportSpec.domains,incoming:createProductQuadrature(rule.mu,rule.azimuth)}}}:control.request;
 const incoming=request.transportSpec.domains.incoming;assert.ok(incoming.integrationWeightsSteradians.every(w=>w>0));assert.ok(Math.abs(incoming.integrationWeightsSteradians.reduce((s,w)=>s+w,0)-4*Math.PI)<1e-11);assert.equal(incoming.unitVectors.length,incoming.directionCount);for(const v of incoming.unitVectors)assert.ok(Math.abs(Math.hypot(...v)-1)<1e-12);
 assert.deepEqual({...request.transportSpec,domains:{...request.transportSpec.domains,incoming:null}},{...control.request.transportSpec,domains:{...control.request.transportSpec.domains,incoming:null}});
 const reused=[];if(reuseRoot){assert.deepEqual(reuseControl.request,control.request);assert.deepEqual(reuseControl.witnesses,control.witnesses);assert.deepEqual(reuseControl.rules.find(r=>r.id===rule.id),rule);for(const c of reuseControl.channels){const file=reuseRoot+`/${rule.id}/channel-${String(c).padStart(2,'0')}.json.gz`,record=identity(file),bytes=readRepository(file,record),data=JSON.parse(gunzipSync(bytes).toString());assert.equal(data.rule,rule.id);assert.deepEqual(data.native[0],saved(baselineRoot,c).native[0]);run.write(`${rule.id}/channel-${String(c).padStart(2,'0')}.json.gz`,bytes,{parents:[reuseSeal,record],operation:'Exact reuse of matched immutable screen wavelength; full physical/request/rule/witness identity checked.',parameters:{rule,channel:c}});reused.push(c);completed.push({rule:rule.id,channel:c,milliseconds:data.milliseconds,peakFieldBytes:data.report.peakLiveFieldBytes,reused:true});}}
 run.progress('rule',`Starting ${rule.id}, ${incoming.directionCount} incoming directions.`);
 const execution=await page.evaluate(c=>globalThis['__h60Execute'](c),{request,scenes:control.scenes,witnesses:control.witnesses,channels:channels.filter(c=>!reused.includes(c)),transport:false,patch:null,rules:[],retainBases:false});executions.push({rule:rule.id,reusedChannels:reused,execution});run.write(rule.id+'/incoming.json',incoming);run.progress('rule',`${rule.id} complete.`);
 }
 assert.equal(completed.length,rules.length*channels.length);run.write('execution.json',{executions,browserVersion:await browser.version(),milliseconds:performance.now()-started});run.write('proof.json',{completed,N1Exact:true,fixedOutgoingDirections:4374,fixedHeight:9180,fullNativeFieldBuild:true,productionUnchanged:true,storage:storage()});
 console.log(JSON.stringify({run:run.path,completed,milliseconds:performance.now()-started}));
 }catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,milliseconds:performance.now()-started,rules,channels});}verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
}
await main();
