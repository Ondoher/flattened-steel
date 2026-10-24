import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,existsSync,rmSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import path from 'node:path';
import {createRequire} from 'node:module';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import puppeteer from 'puppeteer';
import {PNG} from 'pngjs';
import {createRun,checked,identity,root,source} from './io.mjs';
import {physical} from '../elevated-horizon-validation/physics.mjs';
import {LocationTimeController} from '../../src/flat32/LocationTimeController.js';
import {createDistantSunSceneState} from '../../src/flat32/DistantSunSceneState.js';
import {createProductionSharedCacheService,SHARED_PACKAGE_ROOT,SHARED_PACKAGE_REPORT} from '../../server/flat32/features/shared-cache/selection.js';
import {ColorResetAltitudeHalfV1ColorDisplayModel} from '../../src/algorithm32/implementation/color-reset-altitude-half-v1/ColorResetAltitudeHalfV1ColorDisplayModel.js';
import {encodeChannel,flipRows} from '../twilight-exposure/display.mjs';

const modelParent=process.argv[2],requested=process.argv[3]??'central',time=process.argv[4]??'noon';
assert.match(modelParent,/^tmp\/experiments\/clean-horizon-profiles\/runs\/\d{5}-reconstruction$/u);assert.ok(['noon','sunset'].includes(time));
const json=p=>JSON.parse(readFileSync(checked(p),'utf8'));
const central=json(modelParent+'/model.json'),variants=json(modelParent+'/variants.json');
const profile=requested==='bruneton'?null:requested==='central'?central:variants.find(p=>p.id===requested);assert.ok(requested==='bruneton'||profile);
const reportPath=path.relative(root,path.join(SHARED_PACKAGE_ROOT,SHARED_PACKAGE_REPORT.path)).replaceAll('\\','/');
const packageReport=json(reportPath),input=packageReport.derivation.parents.find(p=>p.role==='common-field-parameters').artifact;
assert.equal(identity(input.path).sha256,input.sha256);
const request=structuredClone(json(input.path).buildRequest),m=physical();
if(profile){m.mie=profile.mie;m.albedo=profile.albedo;}
request.transportSpec.domains.spectrum.channels=request.transportSpec.domains.spectrum.channels.map((c,i)=>({...c,rayleighScatteringPerMeter:m.rayleigh[i],mieExtinctionPerMeter:m.mie[i],mieSingleScatteringAlbedo:m.albedo,...(profile?{miePhaseTable:profile.phase}:{})}));
request.transportSpec.atmosphere.mieSingleScatteringAlbedo=m.albedo;
const controller=new LocationTimeController(),selected=controller.selectGlobeTime(controller.selectLocation(controller.start(),0),time==='noon'?1:2);
const state=createDistantSunSceneState({observation:selected.observation,observerHeight:{value:5,units:'meters'},observerUpDirection:[0,0,1]});
if(time==='sunset')assert.equal(selected.observation.instant,'2024-06-21T03:26:03.503Z');
const variant=Boolean(profile&&profile.id!==central.id),heights=variant?[profile.id.includes('upper')?40000:500]:[500,5,100,2000,40000];
/** @type {Array<{id:string,height:number,heading:number,pitch:number,fov:number,time?:string}>} */
const views=heights.map(height=>({id:`${time}-${height}`,height,heading:0,pitch:-Math.acos(6360000/(6360000+height))*180/Math.PI,fov:50}));
const reuse=process.argv[5];if(reuse){assert.match(reuse,/^tmp\/experiments\/clean-horizon-profiles\/runs\/\d{5}-(?:arm-scene|bruneton-scene)$/u);const old=json(reuse+'/control.json');assert.deepEqual(old.profile,profile);assert.deepEqual(old.request,request);assert.equal(old.time,time);const manifest=json(reuse+'/manifest.json');for(const a of manifest.artifacts.filter(a=>/\/(?:channel-\d+\.f32.gz|layout.json|build.json)$/u.test(a.path)))assert.equal(identity(a.path).sha256,a.sha256);}
const measureFrames=process.argv[6]==='timing',transitionParent=measureFrames?null:process.argv[6];if(transitionParent){assert.ok(reuse);assert.match(transitionParent,/^tmp\/experiments\/clean-horizon-profiles\/runs\/\d{5}-arm-scene$/u);assert.deepEqual(json(transitionParent+'/control.json').profile,profile);assert.deepEqual(json(transitionParent+'/control.json').request,request);assert.equal(json(transitionParent+'/manifest.json').state,'accepted');views.splice(0,views.length,...[{id:'proof-noon-first',height:500,time:'noon'},{id:'proof-sunset',height:500,time:'sunset'},{id:'proof-noon-return',height:500,time:'noon'},{id:'proof-five-first',height:5,time:'noon'},{id:'proof-forty',height:40000,time:'noon'},{id:'proof-five-return',height:5,time:'noon'}].map(v=>({...v,heading:0,pitch:-Math.acos(6360000/(6360000+v.height))*180/Math.PI,fov:50})));}
const control={profile,time,medium:m,request,views,productionNumerics:true,solarZenithDegrees:state.solarZenithDegrees,fixedLux:0,reuseRoot:reuse??null,reusedBuild:reuse?json(reuse+'/build.json'):null};
const run=createRun(profile?'arm-scene':'bruneton-scene','S3/S4 actual current-renderer scene with matched N4 source-density cache and shared optical table',[identity(modelParent+'/manifest.json'),identity(reportPath),identity(input.path),identity('experiments/sky-aerosol-properties/scene-browser.mjs'),identity('experiments/twilight-exposure/browser.mjs'),...(reuse?[identity(reuse+'/manifest.json')]:[]),...(transitionParent?[identity(transitionParent+'/manifest.json')]:[])]);
run.write('control.json',control);
let browser,host,failure;const messages=[],sources=new Set(),served=[],start=Date.now(),work=run.absolute+'/work-browser';
const commonjs=createRequire(import.meta.url)('@rollup/plugin-commonjs');
try{
 const atmospherePath=checked('src/flat32/Flat32Atmosphere.js'),compilerPath=checked('scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js');
 async function build(entry){const build=await rollup({input:checked(entry),plugins:[{name:'contained-arm-medium',transform(code,id){
  if(id===atmospherePath){assert.ok(code.includes('return new CanonicalAtmosphere();'));return {code:code.replace('return new CanonicalAtmosphere();',"return globalThis['armSceneModel'] ? new ArmAtmosphere(globalThis['armSceneModel']) : new CanonicalAtmosphere();")+"\nimport {ArmAtmosphere} from '../../experiments/clean-horizon-profiles/ArmAtmosphere.js';\n",map:null};}
  if(id===compilerPath){const signature='export function createDistantSunSceneCacheCommonShaderSource(';assert.equal(code.split(signature).length,2);const changed=code.replace(signature,'function armOriginalCommon(')+"\nimport {adaptCompilerShader} from '../../../experiments/clean-horizon-profiles/profile-sampling.mjs';\nexport function createDistantSunSceneCacheCommonShaderSource(options){const raw=armOriginalCommon(options);return globalThis['armSceneModel']?adaptCompilerShader(raw,globalThis['armSceneModel']):raw;}\n";return{code:changed,map:null};}
  if(id===checked(source+'/scene-browser.mjs'))return{code:code+"\nglobalThis['aerosolSceneStart']=start;",map:null};return null;
 }},nodeResolve({browser:true}),commonjs()],onwarn:w=>messages.push({type:'bundle',message:w.message})});try{build.watchFiles.filter(p=>!p.startsWith('\0')).forEach(p=>sources.add(path.relative(root,p).replaceAll('\\','/')));return(await build.generate({format:'iife',inlineDynamicImports:true})).output[0].code.replaceAll('process.env.NODE_ENV',JSON.stringify('production'));}finally{await build.close();}}
 run.progress('bundle','Build contained current renderer, tabulated medium and compiler adapter');
 const code=await build(source+'/scene-browser.mjs'),worker=await build('src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheWorker.js');
 run.write('browser.js.gz',gzipSync(Buffer.from(code)));run.write('worker.js.gz',gzipSync(Buffer.from(worker)));
 const service=await createProductionSharedCacheService(),routes=new Map([['/bundle.js',Buffer.from(code)],['/shared-cache-worker.js',Buffer.from(worker)]]);
 if(reuse){routes.set('/reuse-layout.json',readFileSync(checked(reuse+'/layout.json')));for(let channel=0;channel<15;channel++)routes.set('/reuse-channel-'+channel+'.bin',gunzipSync(readFileSync(checked(reuse+'/channel-'+channel+'.f32.gz'))));}
 if(transitionParent){
  const left=json(reuse+'/layout.json'),right=json(transitionParent+'/layout.json'),coordinates=[...left.coordinates],indexes=new Map(coordinates.map((c,i)=>[c.join(':'),i]));
  for(const coordinate of right.coordinates)if(!indexes.has(coordinate.join(':'))){indexes.set(coordinate.join(':'),coordinates.length);coordinates.push(coordinate);}
  routes.set('/reuse-layout.json',Buffer.from(JSON.stringify({...left,coordinates})));
  for(let channel=0;channel<15;channel++){
   const merged=new Float32Array(coordinates.length*4374);
   for(const[parent,layout]of [[reuse,left],[transitionParent,right]]){const raw=gunzipSync(readFileSync(checked(parent+'/channel-'+channel+'.f32.gz'))),values=new Float32Array(raw.buffer,raw.byteOffset,raw.byteLength/4);for(let row=0;row<layout.coordinates.length;row++)merged.set(values.subarray(row*4374,(row+1)*4374),indexes.get(layout.coordinates[row].join(':'))*4374);}
   routes.set('/reuse-channel-'+channel+'.bin',Buffer.from(merged.buffer));
  }
  run.write('transition-reuse.json',{parents:[identity(reuse+'/manifest.json'),identity(transitionParent+'/manifest.json')],coordinates:coordinates.length,operation:'Union matching physical global-field coordinates from identical build requests; no N4 recomputation.'});
 }
 for(const[url,folder,files]of [['/stellar-catalogs/brightest-2000-stellar-package-v1/','server/flat32/data/brightest-2000-stellar-package-v1',['manifest.json','catalog-roster.json','native15-packets.json','members-rgba32f.bin','spectra-r32f.bin']],['/presentation-filters/human-vision-filter-package-v1/','server/flat32/data/human-vision-filter-package-v1',['manifest.json','native15-scotopic-weights.json']]])for(const file of files){routes.set(url+file,readFileSync(checked(folder+'/'+file)));sources.add(folder+'/'+file);}
 run.write('source-identities.json',[...sources].sort().map(identity));
 const html='<!doctype html><meta charset="utf-8"><style>html,body{margin:0;width:1024px;height:576px;overflow:hidden}.flat32-viewport{width:1024px;height:576px}.flat32-canvas{display:block;width:100%;height:100%}.flat32-scene-controls,.flat32-time-panel{display:none}</style><div id="main-content"></div><script src="/bundle.js"></script>';run.write('capture-host.html',html);
 host=createServer(async(req,res)=>{try{const u=new URL(req.url,'http://127.0.0.1');assert.equal(req.method,'GET');if(u.pathname==='/api/distant-sun-scene-cache'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(service.resolve(Number(u.searchParams.get('solarZenithDegrees')),'scene-caches/')));return;}if(u.pathname.startsWith('/scene-caches/')){const asset=await service.resolveAsset(decodeURIComponent(u.pathname.slice(14)));served.push({path:u.pathname,bytes:asset.byteLength});res.setHeader('Content-Type',asset.contentType);res.end(asset.bytes);return;}if(u.pathname==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}const bytes=routes.get(u.pathname);if(!bytes){res.writeHead(404).end();if(u.pathname!=='/favicon.ico')messages.push({type:'missing',url:u.pathname});return;}res.setHeader('Content-Type',u.pathname.endsWith('.js')?'text/javascript':u.pathname.endsWith('.json')?'application/json':'application/octet-stream');res.end(bytes);}catch(error){messages.push({type:'host',error:String(error)});res.writeHead(500).end(String(error));}});
 await new Promise((resolve,reject)=>{host.once('error',reject);host.listen(0,'127.0.0.1',()=>resolve(undefined));});const address=host.address();assert.ok(address&&typeof address!=='string');
 mkdirSync(work);mkdirSync(work+'/temp');browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',userDataDir:work,env:{...process.env,TEMP:work+'/temp',TMP:work+'/temp'},protocolTimeout:1800000,args:['--enable-gpu','--enable-webgl','--ignore-gpu-blocklist','--use-angle=d3d11','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 const page=await browser.newPage();await page.setViewport({width:1024,height:576,deviceScaleFactor:1});page.on('pageerror',error=>messages.push({type:'pageerror',error:String(error)}));page.on('console',v=>{if(v.type()==='error')messages.push({type:'console',error:v.text()});});
 await page.exposeFunction('aerosolProgress',text=>{run.progress('scene',String(text));console.log(JSON.stringify({run:run.path,message:text}));});
 await page.exposeFunction('aerosolRetain',(name,value)=>run.write(name,value));
 await page.exposeFunction('aerosolLayer',(channel,base64)=>{assert.ok(Number.isInteger(channel)&&channel>=0&&channel<15);run.write('channel-'+channel+'.f32.gz',gzipSync(Buffer.from(base64,'base64')));});
 await page.goto('http://127.0.0.1:'+address.port,{waitUntil:'domcontentloaded',timeout:120000});
 const ready=await page.evaluate(c=>globalThis['aerosolSceneStart'](c),control);run.write('ready.json',ready);
 const captures=[],display=new ColorResetAltitudeHalfV1ColorDisplayModel();let currentTime=time;
 for(const view of views){
  if(transitionParent&&view.time!==currentTime){await page.evaluate(t=>globalThis['aerosolSceneSetTime'](t),view.time);currentTime=view.time;}
  run.progress('capture',view.id);const value=await page.evaluate(v=>globalThis['aerosolSceneView'](v),view),{capture,...facts}=value;
  const expectedObservation=controller.selectGlobeTime(controller.selectLocation(controller.start(),0),currentTime==='noon'?1:2).observation;
  assert.equal(facts.observation.instant,expectedObservation.instant);assert.equal(facts.observerHeight.value,view.height);assert.equal(capture.facts.width,1024);assert.equal(capture.facts.height,576);assert.equal(capture.facts.glError,0);
  const native=flipRows(Buffer.from(capture.native,'base64'),1024,576,4),hdr=flipRows(Buffer.from(capture.layers['0'],'base64'),1024,576,16),floats=new Float32Array(hdr.buffer,hdr.byteOffset,hdr.length/4);
  const png=new PNG({width:1024,height:576});png.data=native;run.write(view.id+'.png',PNG.sync.write(png));run.write(view.id+'-linear.f32.gz',gzipSync(hdr));
  const gain=display.displayGain({value:capture.facts.displayLux,units:'lux'});let maximumByteError=0;
  for(let i=0;i<native.length;i++)if(i%4!==3)maximumByteError=Math.max(maximumByteError,Math.abs(encodeChannel(floats[i],gain,capture.facts.toneMapK)-native[i]));
  let transitionComparison;
  if(transitionParent){const freshParent=currentTime==='noon'?reuse:transitionParent,freshPath=freshParent+'/'+currentTime+'-'+view.height+'.png',fresh=PNG.sync.read(readFileSync(checked(freshPath)));let max=0;for(let i=0;i<native.length;i++)max=Math.max(max,Math.abs(native[i]-fresh.data[i]));transitionComparison={fresh:identity(freshPath),maximumRgbByteError:max};}
  const frameTiming=measureFrames?await page.evaluate(()=>{const scene=globalThis['proofApplication']._sceneRuntime,gl=scene.renderer.getContext(),milliseconds=[];for(let i=0;i<3;i++){gl.finish();const start=performance.now();scene._renderFrame();gl.finish();milliseconds.push(performance.now()-start);}return{milliseconds,method:'Three forced complete renderer frames with gl.finish; browser/CPU submission plus GPU completion, headless1024x576. Not a pure GPU timer or interactive FPS benchmark.'};}):undefined;
  const item={...facts,captureFacts:capture.facts,gain,maximumByteError,transitionComparison,frameTiming,profileIdentity:profile?.id??'production-bruneton',file:view.id+'.png',linearFile:view.id+'-linear.f32.gz'};
  run.write(view.id+'.json',item);captures.push(item);console.log(JSON.stringify({run:run.path,captured:view.id,gain,maximumByteError}));
 }
 run.write('captures.json',captures);await page.evaluate(()=>globalThis['aerosolSceneDispose']());
 assert.equal(messages.filter(m=>['host','pageerror','missing'].includes(m.type)).length,0,JSON.stringify(messages));
 run.write('telemetry.json',{milliseconds:Date.now()-start,nodeMemory:process.memoryUsage(),served,messages,browser:await browser.version()});
}catch(error){failure=String(error);run.write('failure.json',{message:failure,messages});}
finally{await browser?.close();if(host)await new Promise(r=>host.close(r));if(existsSync(work)){const target=checked(run.path+'/work-browser');assert.equal(target,work.replaceAll('/','\\'));rmSync(target,{recursive:true});}run.finish(failure?'failed':'accepted',{failure,milliseconds:Date.now()-start});}if(failure)process.exitCode=1;
