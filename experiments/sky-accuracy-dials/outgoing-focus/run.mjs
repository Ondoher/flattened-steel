import assert from 'node:assert/strict';
import path from 'node:path';
import {gzipSync,gunzipSync} from 'node:zlib';
import {rollup} from 'rollup';
import puppeteer from 'puppeteer';
import {createRun,readRepository,verifyRun,identity,checkedAbsolute,repositoryRoot,storage,sha256} from '../io/files.mjs';
import {loadCase,jointPath} from '../paper-b1/diagnosis-data.mjs';
import {browserSources} from '../execution.mjs';
import {adapt,geometryProof} from './control.mjs';

const folder='experiments/sky-accuracy-dials/outgoing-focus',entry=folder+'/browser.mjs',compiler=jointPath+'/normalized-paper-compiler.js',prior='tmp/experiments/sky-accuracy-dials/runs/00379-h59-40-screen';
/** Execute bounded screen or full outgoing-warp builds with immutable compact evidence.
 * @returns {Promise<void>}
 */
async function main(){
 const mode=process.argv[2]??'n1',full=process.argv.includes('--full');assert.ok(['n1','orders'].includes(mode));
 const factors=mode==='n1'?[1,.75,.5,.35]:[Number(process.argv[3])];assert.ok(factors.every(k=>[1,.75,.5,.35].includes(k)));
 const parent=loadCase(jointPath),channels=full?Array.from({length:40},(_,i)=>i):[4,12,24],control={schema:'h61-outgoing-focus-v1',mode,request:parent.control.buildRequest,scenes:parent.control.scenes,witnesses:[{t:0,x:4,y:7},{t:1,x:4,y:7},{t:6,x:3,y:6}],channels,factors,fullBoundary:mode==='orders'};
 const reuseAt=process.argv.indexOf('--reuse'),reuseRoot=reuseAt<0?null:process.argv[reuseAt+1],reuseSeal=reuseRoot?verifyRun(reuseRoot):null;
 const proof=geometryProof(control.request),sources=browserSources([entry,compiler]);
 const run=createRun('h61-'+(full?'40-':'')+mode,{parents:[parent.seal,verifyRun(prior),...sources,...(reuseSeal?[reuseSeal]:[])],operation:'Same-count Sun-focused outgoing reconstruction, forward node placement and inverse lookup applied to all J construction/recurrence/view queries. F68 incoming and physical/operators fixed; GPU pure and Float32 cumulative fields queried without runtime exact-angle replacement.',parameters:{controlArtifact:'control.json',controlHash:sha256(JSON.stringify(control)),baselineGit:'05185b92',reuseRoot,screenN1Gate:'Mildest k within10% of best mean exact-angle residual, >=20% gain, no ray >10% worse.'}});
 let failure=null,browser;const started=performance.now(),executions=[],completed=[];
 try{
 run.write('control.json',control);run.write('geometry-proof.json',proof);run.progress('bundle','Preparing one owned GPU browser.');
 browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'gpu'),false),protocolTimeout:1800000,args:['--enable-gpu','--ignore-gpu-blocklist','--use-angle=d3d11','--disable-background-timer-throttling']});
 const page=await browser.newPage();let current=1;
 await page.exposeFunction('__h61Progress',message=>{run.progress('gpu','k'+current+': '+String(message));if(String(message).includes('complete'))console.log(JSON.stringify({k:current,progress:message}));});
 await page.exposeFunction('__h61Channel',d=>{if(current===1&&!control.fullBoundary){const b=JSON.parse(gunzipSync(readRepository(prior+`/channel-${String(d.channel).padStart(2,'0')}.json.gz`)).toString());d.baselineReplay=Math.max(...d.native[0].map((v,i)=>Math.abs(v/b.native[0][i]-1)));assert.ok(d.baselineReplay<5e-6,'Identity GPU lookup reproduces original N1.');}if(d.report){assert.equal(d.report.fieldLayout.widthJ,4374);assert.equal(d.report.fieldLayout.widthL,68);assert.equal(d.report.finalLiveFieldBytes,0);}run.write(`k${current}/channel-${String(d.channel).padStart(2,'0')}.json.gz`,gzipSync(Buffer.from(JSON.stringify(d))));completed.push({k:current,channel:d.channel,milliseconds:d.milliseconds});});
 for(const k of factors){current=k;const source=adapt(readRepository(compiler).toString(),k);run.write(`k${k}/compiler.js.gz`,gzipSync(Buffer.from(source)));const browser=readRepository(entry).toString()+`\nimport * as compiler from '${path.join(repositoryRoot,compiler).split(path.sep).join('/')}';globalThis['__h61Execute']=c=>execute(c,compiler);`;
 const bundle=await rollup({input:checkedAbsolute(path.join(repositoryRoot,entry)),plugins:[{name:'h61-contained-warp',transform(code,id){if(path.resolve(id)===path.join(repositoryRoot,compiler))return{code:source,map:null};if(path.resolve(id)===path.join(repositoryRoot,entry))return{code:browser,map:null};return null;}}]});let code;try{code=(await bundle.generate({format:'iife'})).output[0].code;}finally{await bundle.close();}run.write(`k${k}/browser.js.gz`,gzipSync(Buffer.from(code)));await page.addScriptTag({content:code});
 const reused=[];if(reuseRoot){const previous=JSON.parse(readRepository(reuseRoot+'/control.json').toString());assert.deepEqual(previous.request,control.request);assert.equal(previous.mode,control.mode);assert.deepEqual(previous.factors,control.factors);assert.equal(previous.fullBoundary,control.fullBoundary);assert.equal(gunzipSync(readRepository(reuseRoot+`/k${k}/compiler.js.gz`)).toString(),source);for(const c of previous.channels){const file=reuseRoot+`/k${k}/channel-${String(c).padStart(2,'0')}.json.gz`,record=identity(file),bytes=readRepository(file,record);run.write(`k${k}/channel-${String(c).padStart(2,'0')}.json.gz`,bytes,{parents:[reuseSeal,record],operation:'Exact reuse of matching outgoing grid, compiled equations, incoming rule, full-boundary support and physical packet.',parameters:{k,channel:c}});reused.push(c);}}
 run.progress('rule','Starting k='+k);const result=await page.evaluate(c=>globalThis['__h61Execute'](c),{...control,channels:channels.filter(c=>!reused.includes(c))});executions.push({k,reusedChannels:reused,...result});run.progress('rule','Completed k='+k);
 }
 run.write('execution.json',{executions,completed,browserVersion:await browser.version(),storage:storage(),milliseconds:performance.now()-started});console.log(JSON.stringify({run:run.path,completed,milliseconds:performance.now()-started}));
 }catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,milliseconds:performance.now()-started});}verifyRun(run.path);if(failure)throw failure;
}
await main();
