import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {PNG} from 'pngjs';
import {createRun,checked,identity} from './io.mjs';
import {encodeChannel} from '../twilight-exposure/display.mjs';
const scene=process.argv[2],json=p=>JSON.parse(readFileSync(checked(p),'utf8')),run=createRun('raster-gpu-proof','Verify actual camera pixel centers and image-area footprint quadrature before independent reference completes',[identity(scene+'/manifest.json')]);let failure;
try{
 const m=json(scene+'/manifest.json');assert.equal(m.state,'accepted');for(const a of m.artifacts)assert.equal(identity(a.path).sha256,a.sha256);const results=[];
 for(const height of [500,2000]){
  const trace=json(scene+'/noon-'+height+'-4096-raster.json'),q=trace.results.find(r=>r.id==='sphere').queries,stock=trace.results.find(r=>r.id==='stock').queries,meta=json(scene+'/noon-'+height+'-4096.json'),raw=gunzipSync(readFileSync(checked(scene+'/noon-'+height+'-4096-linear.f32.gz'))),f=new Float32Array(raw.buffer,raw.byteOffset,raw.length/4),image=new PNG({width:2,height:96});let centerError=0,areaWeightError=0,quadRelative=0;const luma=a=>.2126*a[0]+.7152*a[1]+.0722*a[2],pixels=[];
  for(const p of stock.filter(p=>p.kind==='center'))for(let c=0;c<3;c++)centerError=Math.max(centerError,Math.abs(p.totalLinearRgb[c]-f[(p.y*4096+p.x)*4+c])/Math.max(1,Math.abs(f[(p.y*4096+p.x)*4+c])));
  for(let y=1080;y<1176;y++)for(const x of [2048,2049]){const orders=[];for(const order of [2,4]){const items=q.filter(p=>p.kind==='quadrature'&&p.x===x&&p.y===y&&p.order===order);if(!items.length)continue;areaWeightError=Math.max(areaWeightError,Math.abs(items.reduce((s,p)=>s+p.weight,0)-1));orders.push({order,path:Array.from({length:3},(_,c)=>items.reduce((s,p)=>s+p.weight*p.pathLinearRgb[c],0)),total:Array.from({length:3},(_,c)=>items.reduce((s,p)=>s+p.weight*p.totalLinearRgb[c],0))});}if(orders.length===2)quadRelative=Math.max(quadRelative,Math.abs(luma(orders[1].path)/luma(orders[0].path)-1));const display=orders[0].path.map(v=>encodeChannel(v,meta.gain,meta.captureFacts.toneMapK));image.data.set([...display,255],((y-1080)*2+x-2048)*4);pixels.push({x,y,orders});}
  assert.ok(centerError<1e-5&&areaWeightError<1e-12);run.write('production-path-'+height+'-native.png',PNG.sync.write(image));run.write('pixels-'+height+'.json',pixels);results.push({height,centerError,areaWeightError,maximum2x2Vs4x4PathRelative:quadRelative});
 }
 run.write('verification.json',{results,scope:'Production image/footprint proof only; no independent reference appearance conclusion.'});console.log(JSON.stringify({run:run.path,results}));
}catch(e){failure=String(e);run.write('failure.json',{failure});}run.finish(failure?'failed':'accepted',{failure});if(failure)process.exitCode=1;
