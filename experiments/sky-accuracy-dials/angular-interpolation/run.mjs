import assert from 'node:assert/strict';
import path from 'node:path';
import {rollup} from 'rollup';
import puppeteer from 'puppeteer';
import {gzipSync,gunzipSync} from 'node:zlib';
import {readdirSync} from 'node:fs';
import {createRun,readRepository,identity,verifyRun,checkedAbsolute,repositoryRoot,storage,sha256} from '../io/files.mjs';
import {browserSources} from '../execution.mjs';
import {loadCase,jointPath,authenticate} from '../paper-b1/diagnosis-data.mjs';
import {gauss} from '../continuation/direct-solver/math.mjs';

const folder='experiments/sky-accuracy-dials/angular-interpolation',entry=folder+'/browser.js';
const compiler=jointPath+'/normalized-paper-compiler.js',reference='tmp/experiments/sky-accuracy-dials/runs/00368-h58-order-report';

/** Authenticate inputs, execute a compact GPU screen or bounded row intervention, and seal its evidence.
 * @returns {Promise<void>}
 */
async function main(){
 const mode=process.argv[2]??'screen',full=process.argv.includes('--full');assert.ok(['screen','transport','L2','L3','quadrature'].includes(mode));
 const channels=full?Array.from({length:40},(_,i)=>i):process.argv.includes('--validation')?[0,8,30,39]:[4,12,24];
 const parent=loadCase(jointPath),refSeal=verifyRun(reference);authenticate(jointPath);
 const witnesses=[{t:0,x:4,y:7},{t:1,x:4,y:7},{t:6,x:3,y:6}];
 const rules=[16,32].map(azimuths=>{const q=gauss(16);return Array.from({length:16*azimuths},(_,i)=>{const mu=2*q.nodes[Math.floor(i/azimuths)]-1,phi=2*Math.PI*(i%azimuths+.5)/azimuths;return [Math.sqrt(1-mu*mu)*Math.cos(phi),Math.sqrt(1-mu*mu)*Math.sin(phi),mu,q.weights[Math.floor(i/azimuths)]*4*Math.PI/azimuths];});});
 const control={request:parent.control.buildRequest,scenes:parent.control.scenes,witnesses,channels,transport:mode!=='screen'&&mode!=='quadrature',patch:['L2','L3'].includes(mode)?mode:null,rules:mode==='quadrature'?rules:[],retainBases:full};
 assert.equal(control.request.transportSpec.numerical.transportIntervalCount,60);assert.equal(control.request.transportSpec.shaderProfile.coordinateContract,'scene-cache-receiver-local-v1');
 let compilerSource=readRepository(compiler).toString().replaceAll('\r\n','\n');
 const hook="if (onFieldProbes === null) return;";assert.equal(compilerSource.split(hook).length,2);
 const modulePath=path.join(repositoryRoot,entry).split(path.sep).join('/');
 compilerSource=`import {inspect,transportHook} from '${modulePath}';\n`+compilerSource.replace(hook,`if(fieldId.startsWith('J')) await inspect({gl,fieldId,resource,common,l1:l1Fragment(common,sourceAligned),scatter:scatterFragment(common,sourceAligned),transport:transportFragment(common,sourceAligned),resources,f68:f68Texture});else transportHook({gl,fieldId,resource});\n\t\t${hook}`);
 const browserSource=readRepository(entry).toString()+`\nimport * as compiler from '${path.join(repositoryRoot,compiler).split(path.sep).join('/')}';\nglobalThis['__h59Execute']=control=>execute(control,compiler);\n`;
 const sources=browserSources([entry,compiler]);
 const reuseAt=process.argv.indexOf('--reuse'),reuseRoot=reuseAt<0?null:process.argv[reuseAt+1],reused=[];
 if(reuseRoot){const seal=verifyRun(reuseRoot);sources.push(seal);const previous=JSON.parse(readRepository(reuseRoot+'/control.json').toString());assert.deepEqual(previous,control);assert.equal(gunzipSync(readRepository(reuseRoot+'/compiler-instrumented.js.gz')).toString(),compilerSource);for(const name of readdirSync(checkedAbsolute(path.join(repositoryRoot,reuseRoot))).filter(n=>/^channel-\d{2}\.json\.gz$/.test(n)).sort()){const record=identity(reuseRoot+'/'+name),bytes=readRepository(record.path,record),data=JSON.parse(gunzipSync(bytes).toString());assert.equal(data.report.finalLiveFieldBytes,0);assert.equal(data.directBases.length,2*51*180);reused.push({record,bytes,data,name});}}
 const run=createRun('h59-'+(full?'40-':'')+mode.toLowerCase(),{parents:[parent.seal,refSeal,identity(compiler),...sources],operation:'Frozen physical-packet angular interpolation controls. Query analytic N1 and the original normalized F68 higher-order equation at exact requested outgoing directions; optional bounded native transport rows and isolated recurrence injection. Production and parents remain immutable.',parameters:{controlValueSha256:sha256(JSON.stringify(control)),controlArtifact:'control.json',mode,channels,baselineGit:'73af9897',replayTolerance:1e-6,readout:'Native monotone-cubic solar/linear altitude/Q30; identical anchors, changing outgoing-angle evaluation only.',temporaryBoundary:'Experiment-owned generated root required by approved H59 plan.',resourcePolicy:'Hardware GPU, one wavelength/job at a time; no external solver campaign.'}});
 let browser,failure=null;const results=reused.map(r=>r.data);const started=performance.now();
 try{
 run.write('control.json',control);run.write('compiler-instrumented.js.gz',gzipSync(Buffer.from(compilerSource)));
 for(const r of reused)run.write(r.name,r.bytes,{parents:[r.record,...sources.filter(s=>s.path===reuseRoot+'/sealed.json')],operation:'Reuse unchanged complete wavelength payload from immutable disk-limit failure. Native packet and adapted compiler are exactly identical; subsequent replay/node proofs independently validate all reused values.',parameters:{channel:r.data.channel}});
 const bundle=await rollup({input:checkedAbsolute(path.join(repositoryRoot,entry)),plugins:[{name:'h59-contained-instrumentation',transform(code,id){if(path.resolve(id)===path.join(repositoryRoot,compiler))return {code:compilerSource,map:null};if(path.resolve(id)===path.join(repositoryRoot,entry))return {code:browserSource,map:null};return null;}}]});let code;try{code=(await bundle.generate({format:'iife'})).output[0].code;}finally{await bundle.close();}
 run.write('browser.js.gz',gzipSync(Buffer.from(code)));
 run.progress('browser','Starting one owned hardware Chrome instance.');
 browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'gpu'),false),protocolTimeout:1800000,args:['--enable-gpu','--ignore-gpu-blocklist','--use-angle=d3d11','--disable-background-timer-throttling']});const page=await browser.newPage();
 await page.exposeFunction('__h59Progress',message=>{run.progress('gpu',String(message));console.log(JSON.stringify({progress:message}));});
 await page.exposeFunction('__h59Channel',r=>{run.write(`channel-${String(r.channel).padStart(2,'0')}.json.gz`,gzipSync(Buffer.from(JSON.stringify(r))));results.push(r);});
 await page.addScriptTag({content:code});const execution=await page.evaluate(c=>globalThis['__h59Execute'](c),{...control,channels:channels.filter(c=>!results.some(r=>r.channel===c))});results.sort((a,b)=>a.channel-b.channel);
 let baselineMaximum=0,nodeMaximum=0,angularReplayMaximum=0;
 for(const r of results){for(let o=0;o<4;o++)for(let i=0;i<3;i++){
 const w=witnesses[i],old=parent.channels[r.channel].values[o*1386+w.t*81+w.x*9+w.y];
 if(mode==='screen'||mode==='transport')baselineMaximum=Math.max(baselineMaximum,Math.abs(r.cumulative[o][i]/old-1));
 angularReplayMaximum=Math.max(angularReplayMaximum,Math.abs(r.angularNative[o][i]/r.native[o][i]-1));
 }
 for(const d of r.diagnostics)for(let q=0;q<execution.support.queries.length;q++)if(execution.support.queries[q].kind==='node'){const [a,b]=d.pairs[q];nodeMaximum=Math.max(nodeMaximum,Math.abs(a-b)/Math.max(a,b,1e-30));}}
 assert.ok(baselineMaximum<1e-6,`Native replay ${baselineMaximum}`);assert.ok(nodeMaximum<2e-5,`Native-node reconstruction ${nodeMaximum}`);
 run.write('execution.json',execution);run.write('proof.json',{baselineMaximum,nodeMaximum,angularReplayMaximum,patch:control.patch,channelCount:results.length,sourceMap:{J1:'Direct-base coefficients times phase at stored outgoing directions',L1:'Analytic directScatteringDensity; bypasses J1 lookup',J2J4:'F68 sum and Mie mass normalization',L2L3:'Bilinear outgoing plus original linear spatial/solar lookup',readout:'Bilinear outgoing, linear altitude, monotone-cubic solar, Q30'},milliseconds:performance.now()-started,storage:storage()});
 console.log(JSON.stringify({run:run.path,baselineMaximum,nodeMaximum,angularReplayMaximum,milliseconds:performance.now()-started}));
 }catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,milliseconds:performance.now()-started,mode,channels});}
 verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
}
await main();
