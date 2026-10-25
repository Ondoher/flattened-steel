import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,existsSync,rmSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer';
import {PNG} from 'pngjs';
import {createRun,checked,identity,command} from './io.mjs';

const parent=process.argv[2],json=p=>JSON.parse(readFileSync(checked(p),'utf8'));
const run=createRun('ground-alignment','Direct raster-ground versus physical-sphere pixel coverage/depth and ground-tessellation rim test',[identity(parent+'/manifest.json')]);
let failure,browser;const work=run.absolute+'/browser-verify';
try{
 const manifest=json(parent+'/manifest.json');assert.equal(manifest.state,'accepted');for(const a of manifest.artifacts)assert.equal(identity(a.path).sha256,a.sha256);
 const read=p=>{const b=gunzipSync(readFileSync(checked(p)));return new Float32Array(b.buffer,b.byteOffset,b.length/4);};
 const results=[],width=1024,height=576,firstRow=260,lastRow=310;
 for(const altitude of [500,2000]){
  const variants=[];
  for(const segments of [512,1024]){
   const prefix='noon-'+altitude+'-ground-'+segments,meta=json(parent+'/'+prefix+'.json'),mask=read(parent+'/'+prefix+'-proof-1.f32.gz'),distances=read(parent+'/'+prefix+'-proof-2.f32.gz'),linear=read(parent+'/'+prefix+'-linear.f32.gz'),png=PNG.sync.read(readFileSync(checked(parent+'/'+prefix+'.png')));
   assert.equal(meta.geometryRadius.value,6360000);assert.equal(meta.captureFacts.state.observerHeight.value,altitude);assert.equal(meta.mesh.patch.xSegments,segments);assert.equal(meta.mesh.patch.zSegments,segments);
   const [qx,qy,qz,qw]=meta.captureFacts.camera.quaternion,rotationY=[2*(qx*qy+qz*qw),1-2*(qx*qx+qz*qz),2*(qy*qz-qx*qw)],tangent=Math.tan(meta.captureFacts.camera.fov*Math.PI/360),aspect=meta.captureFacts.camera.aspect,c=altitude*(12720000+altitude),mismatches=[],cpuDisagreements=[],distanceDifferences=[],rootErrors=[],boundaryRows=[];
   for(let x=0;x<width;x++){
    let firstHit=-1;
    for(let y=firstRow;y<=lastRow;y++){
     const at=(y*width+x)*4,lx=(2*(x+.5)/width-1)*tangent*aspect,ly=(1-2*(y+.5)/height)*tangent,dy=(rotationY[0]*lx+rotationY[1]*ly-rotationY[2])/Math.sqrt(lx*lx+ly*ly+1),b=(6360000+altitude)*dy,discriminant=b*b-c,hit=b<0&&discriminant>=0,mesh=mask[at]>.5,gpu=mask[at+1]>.5;
     if(hit&&firstHit<0)firstHit=y;
     if(mesh!==gpu)mismatches.push({x,y,mesh,gpu});if(gpu!==hit)cpuDisagreements.push({x,y,gpu,cpu:hit});
     if(mesh&&gpu)distanceDifferences.push(distances[at]-distances[at+1]);
     if(gpu&&hit)rootErrors.push(Math.abs(distances[at+1]-c/(-b+Math.sqrt(discriminant))));
    }
    assert.ok(firstHit>firstRow);boundaryRows.push(firstHit);
   }
   distanceDifferences.sort((a,b)=>a-b);const percentile=f=>distanceDifferences[Math.floor(f*(distanceDifferences.length-1))];
   const stats={segments,mesh:meta.mesh,coverageMismatchCount:mismatches.length,mismatches,cpuGpuHitDisagreementCount:cpuDisagreements.length,cpuDisagreements,meshMinusGpuSphereDistanceMeters:{minimum:distanceDifferences[0],median:percentile(.5),p99:percentile(.99),maximum:distanceDifferences.at(-1)},maximumGpuVsBinary64RootDifferenceMeters:Math.max(...rootErrors),camera:meta.captureFacts.camera,centerBoundaryRow:boundaryRows[512]};
   for(const suffix of ['.png','-mask.png'])run.write(prefix+suffix,readFileSync(checked(parent+'/'+prefix+suffix)));
   variants.push({stats,mask,linear,png,boundaryRows});
  }
  assert.deepEqual(variants[0].stats.camera,variants[1].stats.camera);assert.deepEqual(variants[0].boundaryRows,variants[1].boundaryRows);
  let maximumRimRgbByteDifference=0,maximumRimLinearDifference=0,rimPixelCount=0,rimCoverageMismatches=0;
  for(let x=0;x<width;x++)for(let offset=1;offset<=2;offset++){const y=variants[0].boundaryRows[x]-offset,at=(y*width+x)*4;rimPixelCount++;if(variants.some(v=>v.mask[at]>.5))rimCoverageMismatches++;for(let channel=0;channel<3;channel++){maximumRimRgbByteDifference=Math.max(maximumRimRgbByteDifference,Math.abs(variants[0].png.data[at+channel]-variants[1].png.data[at+channel]));maximumRimLinearDifference=Math.max(maximumRimLinearDifference,Math.abs(variants[0].linear[at+channel]-variants[1].linear[at+channel]));}}
  const center=variants[0].boundaryRows[512],centerSamples=[center-2,center-1,center,center+1].map(y=>{const at=(y*width+512)*4;return{y,mask:variants.map(v=>Array.from(v.mask.subarray(at,at+3))),distances:variants.map(v=>Array.from(read(parent+'/noon-'+altitude+'-ground-'+v.stats.segments+'-proof-2.f32.gz').subarray(at,at+2))),rgb:variants.map(v=>Array.from(v.png.data.subarray(at,at+3)))};});
  results.push({altitude,region:{x:[0,1023],y:[firstRow,lastRow],pixels:width*(lastRow-firstRow+1)},variants:variants.map(v=>v.stats),rimPixelCount,rimCoverageMismatches,maximumRimRgbByteDifference,maximumRimLinearDifference,centerSamples});
 }
 const types=await command(run,'typecheck',['node_modules/typescript/bin/tsc','-p','experiments/clean-horizon-profiles/jsconfig.json']);assert.equal(types.code,0,types.stdout+types.stderr);
 run.write('analysis.json',{results,typecheck:'passed',interpretation:'Small isolated raster/sphere coverage differences exist. The continuous rim occupies agreed-sky pixels and persists under4x visual triangle count. This excludes the tested ground mismatch as the primary continuous-line explanation, without validating the near-limb radiance.',limitations:'Pixel-center coverage at500m/2km noon and one Sun-facing heading/FOV only; residual subpixel coverage and raster precision remain. GPU sphere roots are float32, checked independently in binary64. No claim that the rim is physically correct or that all ground-edge cases are fixed.'});
 const table=results.flatMap(r=>r.variants.map(v=>`<tr><td>${r.altitude} m</td><td>${v.segments} x ${v.segments}</td><td>${v.coverageMismatchCount}</td><td>${v.cpuGpuHitDisagreementCount}</td><td>${v.meshMinusGpuSphereDistanceMeters.median.toFixed(2)} m</td><td>${r.maximumRimRgbByteDifference}</td></tr>`)).join('');
 run.write('index.html','<!doctype html><meta charset="utf-8"><title>Ground and sphere alignment</title><style>body{background:#18232d;color:#eee;font:16px system-ui;max-width:1500px;margin:20px auto;padding:15px}section{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0}img{width:100%}td,th{padding:8px;border:1px solid #789}table{border-collapse:collapse}a{color:#9df}</style><h1>Ground-object / exact-sphere alignment</h1><p>Same cache, atmosphere, camera and lighting. Only the visual ground tessellation changes:512x512 to1024x1024, four times as many triangles. Hit masks compare the actual scene endpoint with the analytic sphere for the same reconstructed pixel ray, independently checked in binary64.</p><p>The continuous white rim survives. There are a few isolated coverage mismatches at500m; none at2km in the tested horizon strip. These are distinct from a full-width line. This test does not establish that the calculated rim radiance is physically correct.</p><table><tr><th>Height</th><th>Ground grid</th><th>Mesh/sphere mismatch pixels</th><th>GPU/CPU sphere mask disagreement</th><th>Median endpoint-distance difference</th><th>Rim RGB change after refinement</th></tr>'+table+'</table>'+results.map(r=>'<h2>'+r.altitude+' m noon</h2><section>'+r.variants.map(v=>{const f='noon-'+r.altitude+'-ground-'+v.segments;return'<figure><a href="'+f+'.png"><img src="'+f+'.png" alt="Ground grid '+v.segments+'"></a><figcaption>'+v.segments+' x '+v.segments+' ground</figcaption><img src="'+f+'-mask.png" alt="Mesh and sphere hit comparison"><figcaption>Yellow: both ground. Black: both sky. Cyan: analytic ground missed by mesh. Magenta: mesh outside physical silhouette.</figcaption></figure>';}).join('')+'</section>').join('')+'<p>Region:1024 columns x51 rows around the horizon. Rim color comparison uses the two agreed-sky pixels immediately above the exact boundary in every column. Quantities and mismatch coordinates are selectable in <a href="analysis.json">analysis.json</a>.</p>');
 mkdirSync(work);mkdirSync(work+'/temp');browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',userDataDir:work,env:{...process.env,TEMP:work+'/temp',TMP:work+'/temp'},args:['--disable-gpu']});const page=await browser.newPage();await page.goto(pathToFileURL(checked(run.path+'/index.html')).href,{waitUntil:'load'});const images=await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode()));return[...document.images].map(i=>({width:i.naturalWidth,height:i.naturalHeight}));});assert.equal(images.length,8);assert.ok(images.every(i=>i.width===1024&&i.height===576));run.write('gallery-verification.json',{images:images.length,dimensions:[1024,576]});
 console.log(JSON.stringify({report:run.path+'/index.html',results}));
}catch(error){failure=String(error);run.write('failure.json',{message:failure});}
finally{await browser?.close();if(existsSync(work)){const target=checked(run.path+'/browser-verify');assert.equal(target,path.resolve(work));rmSync(target,{recursive:true});}}
run.finish(failure?'failed':'accepted',{failure});if(failure)process.exitCode=1;
