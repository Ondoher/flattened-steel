import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {PNG} from 'pngjs';
import {createRun,checked,identity} from './io.mjs';
import {encodeChannel} from '../twilight-exposure/display.mjs';
const arguments_=process.argv.slice(2),paths=arguments_.slice(0,4),uncertaintyPaths=arguments_.slice(4);assert.ok(paths.length===2||paths.length===4);
for(const p of paths)assert.match(p,/^tmp\/experiments\/clean-horizon-profiles\/runs\/\d{5}-(?:bruneton-scene|arm-scene)$/u);
const json=p=>JSON.parse(readFileSync(checked(p),'utf8'));
const run=createRun(paths.length===2?'noon-gallery':'scene-gallery','S4 immutable actual-scene comparison gallery with native, pair-fixed and common lower exposure plus uncertainty images',[...paths,...uncertaintyPaths].map(p=>identity(p+'/manifest.json')));
let failure;
try{
 const all=[];
 for(let pair=0;pair<paths.length;pair+=2){
  const base=paths[pair],arm=paths[pair+1],b=json(base+'/captures.json'),a=json(arm+'/captures.json');
  for(const path of [base,arm]){const manifest=json(path+'/manifest.json');assert.equal(manifest.state,'accepted');for(const artifact of manifest.artifacts)assert.equal(identity(artifact.path).sha256,artifact.sha256);}
  assert.equal(b.length,5);assert.equal(a.length,5);
  const bc=json(base+'/control.json'),ac=json(arm+'/control.json');assert.equal(bc.time,ac.time);assert.equal(bc.profile,null);assert.ok(ac.profile);
  assert.deepEqual(bc.request.transportSpec.numerical,ac.request.transportSpec.numerical);
  assert.deepEqual(bc.request.transportSpec.domains.position,ac.request.transportSpec.domains.position);
  for(const height of [5,100,500,2000,40000]){
   const baseline=b.find(v=>v.view.height===height),candidate=a.find(v=>v.view.height===height);assert.ok(baseline&&candidate);
   assert.equal(baseline.observation.instant,candidate.observation.instant);
   assert.deepEqual(baseline.captureFacts.camera,candidate.captureFacts.camera);
   const id=bc.time+'-'+height,stats={};
   for(const[label,parent,item]of [['bruneton',base,baseline],['arm',arm,candidate]]){
    run.write(id+'-'+label+'-native.png',readFileSync(checked(parent+'/'+item.file)));
    const buffer=gunzipSync(readFileSync(checked(parent+'/'+item.linearFile))),values=new Float32Array(buffer.buffer,buffer.byteOffset,buffer.length/4),fixed=new PNG({width:1024,height:576}),low=new PNG({width:1024,height:576});
    let nativeWhite=0,fixedWhite=0;const native=PNG.sync.read(readFileSync(checked(parent+'/'+item.file)));
    for(let i=0;i<values.length;i+=4){let nativeClipped=true,fixedClipped=true;for(let c=0;c<3;c++){assert.ok(Number.isFinite(values[i+c]));fixed.data[i+c]=encodeChannel(values[i+c],baseline.gain,item.captureFacts.toneMapK);low.data[i+c]=encodeChannel(values[i+c],baseline.gain/8,item.captureFacts.toneMapK);nativeClipped&&=native.data[i+c]>=250;fixedClipped&&=fixed.data[i+c]>=250;}fixed.data[i+3]=255;low.data[i+3]=255;nativeWhite+=Number(nativeClipped);fixedWhite+=Number(fixedClipped);}
    run.write(id+'-'+label+'-fixed.png',PNG.sync.write(fixed));
    run.write(id+'-'+label+'-low.png',PNG.sync.write(low));
    stats[label]={gain:item.gain,fixedPairGain:baseline.gain,meterLux:item.captureFacts.meterLux,displayLux:item.captureFacts.displayLux,nearWhiteNativeFraction:nativeWhite/(1024*576),nearWhiteFixedFraction:fixedWhite/(1024*576),maximumNativeReplayByteError:item.maximumByteError,parentCapture:identity(parent+'/'+item.view.id+'.json')};
   }
   all.push({id,time:bc.time,height,instant:baseline.observation.instant,profile:ac.profile.id,camera:baseline.captureFacts.camera,sourceDirection:baseline.captureFacts.sunScene,stats});
  }
 }
 const sensitivity=[];
 for(const parent of uncertaintyPaths){
  assert.match(parent,/^tmp\/experiments\/clean-horizon-profiles\/runs\/\d{5}-arm-scene$/u);const manifest=json(parent+'/manifest.json');assert.equal(manifest.state,'accepted');for(const artifact of manifest.artifacts)assert.equal(identity(artifact.path).sha256,artifact.sha256);
  const captures=json(parent+'/captures.json');assert.equal(captures.length,1);const item=captures[0],centralRow=all.find(r=>r.time===json(parent+'/control.json').time&&r.height===item.view.height);assert.ok(centralRow);
  const prefix=centralRow.id+'-uncertainty-'+sensitivity.length,raw=gunzipSync(readFileSync(checked(parent+'/'+item.linearFile))),values=new Float32Array(raw.buffer,raw.byteOffset,raw.length/4);
  run.write(prefix+'-native.png',readFileSync(checked(parent+'/'+item.file)));
  for(const mode of ['fixed','low']){const png=new PNG({width:1024,height:576}),gain=centralRow.stats.bruneton.fixedPairGain/(mode==='low'?8:1);for(let i=0;i<values.length;i+=4){for(let c=0;c<3;c++)png.data[i+c]=encodeChannel(values[i+c],gain,item.captureFacts.toneMapK);png.data[i+3]=255;}run.write(prefix+'-'+mode+'.png',PNG.sync.write(png));}
  sensitivity.push({prefix,centralPrefix:centralRow.id+'-arm',time:centralRow.time,height:item.view.height,profile:item.profileIdentity,parent:identity(parent+'/manifest.json'),gain:item.gain});
 }
 run.write('uncertainty.json',sensitivity);
 run.write('comparisons.json',all);
 const css='body{font:16px system-ui;margin:24px auto;max-width:1500px;background:#19212b;color:#ecf0f7;padding:0 16px}header,nav{position:sticky;top:0;background:#19212bf2;padding:12px 0;z-index:1}button,select{font:inherit;padding:8px;margin-right:12px}article{margin:26px 0}section.pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}figure{margin:0}img{width:100%;display:block}figcaption{padding:8px;background:#273444}details{padding:8px;background:#273444}a{color:#99d5ff}table{border-collapse:collapse}td,th{padding:7px;border:1px solid #718096}code{overflow-wrap:anywhere}@media(max-width:800px){section.pair{grid-template-columns:1fr}}';
 const html='<!doctype html><html><meta charset="utf-8"><title>ARM-informed San Jose scenes</title><style>'+css+'</style><header><h1>ARM-informed San Jose scenes</h1><nav><label>Display <select id="display"><option value="native">Current app response</option><option value="fixed">Same frame exposure within each pair</option><option value="low">Same pair exposure / 8 (highlight diagnostic)</option></select></label><label>Time <select id="time"><option value="all">All</option><option value="noon">Noon</option><option value="sunset">Sunset</option></select></label></nav></header><p><strong>Illustrative reconstruction; numerical approximation remains.</strong> Selected N4 cache rays differ from all-orders spherical MYSTIC. These images do not establish a measured full atmosphere or a validated cache adapter. See the scene-results report for discrepancies and missing order-tail bounds.</p><p>Actual globe scenes at 1024×576 and 50° vertical FOV, looking toward the Sun’s azimuth with the geometric limb centered. Left: current Bruneton atmosphere. Right: the explicitly ARM-informed December reconstruction. This is an idealized transplant into San Jose geometry, with modeled humidity/near-field/phase/upper layers; it is not measured San Jose weather. World objects and ground remain in the scene but may be outside the view or small at altitude.</p><p>Sunset uses the same ground-defined instant at every altitude. At 40 km the Sun remains above the visible limb. The fixed-exposure option holds frame gain within each pair; gains can differ between cases. Images do not establish cross-condition radiometric equivalence.</p>'+all.map(row=>`<article data-time="${row.time}"><h2>${row.time==='noon'?'Noon':'Sunset'} · ${row.height<1000?row.height+' m':row.height/1000+' km'}</h2><section class="pair">${[['bruneton','Bruneton'],['arm','ARM-informed reconstruction']].map(([id,label])=>`<figure><img data-prefix="${row.id}-${id}" src="${row.id}-${id}-native.png" alt="${label}, ${row.time}, ${row.height} meters"><figcaption>${label} · <a data-download="${row.id}-${id}" href="${row.id}-${id}-native.png" download>PNG</a></figcaption></figure>`).join('')}</section><details><summary>Source, camera, exposure and verification</summary><p>UTC <code>${row.instant}</code>; native frame gains: Bruneton ${row.stats.bruneton.gain.toFixed(5)}, ARM ${row.stats.arm.gain.toFixed(5)}. Maximum HDR replay error: ${row.stats.bruneton.maximumNativeReplayByteError}/${row.stats.arm.maximumNativeReplayByteError} RGB byte(s).</p><p>Reconstruction: <code>${row.profile}</code>. <a href="comparisons.json">Complete selectable metadata</a></p></details></article>`).join('')+'<h2>Reconstruction uncertainty</h2><p>One factor at a time. These are additional sensitivity images, not measured alternative weather. Left is the central reconstruction; right is the named alternative. The display control applies to both using the same baseline-pair gain for fixed and lower exposure.</p>'+sensitivity.map(row=>`<article data-time="${row.time}"><h3>${row.time}, ${row.height} m: ${row.profile}</h3><section class="pair">${[[row.centralPrefix,'Central ARM reconstruction'],[row.prefix,row.profile]].map(([prefix,label])=>`<figure><img data-prefix="${prefix}" src="${prefix}-native.png" alt="${label}"><figcaption>${label} <a data-download="${prefix}" href="${prefix}-native.png" download>PNG</a></figcaption></figure>`).join('')}</section></article>`).join('')+'<script>const mode=document.getElementById("display"),time=document.getElementById("time");function update(){for(const img of document.querySelectorAll("img[data-prefix]"))img.src=img.dataset.prefix+"-"+mode.value+".png";for(const a of document.querySelectorAll("a[data-download]"))a.href=a.dataset.download+"-"+mode.value+".png";for(const article of document.querySelectorAll("article"))article.hidden=time.value!=="all"&&article.dataset.time!==time.value;}mode.onchange=update;time.onchange=update;</script></html>';
 run.write('index.html',html);console.log(JSON.stringify({conditions:all.length,primaryImages:all.length*2,gallery:run.path+'/index.html'}));
}catch(error){failure=String(error);run.write('failure.json',{message:failure});}
run.finish(failure?'failed':'accepted',{failure});if(failure)process.exitCode=1;
