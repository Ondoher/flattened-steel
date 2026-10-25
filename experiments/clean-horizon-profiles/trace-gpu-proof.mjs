import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createRun,checked,identity,command} from './io.mjs';
import {BrunetonColorDisplayModel} from '../../src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {NATIVE_15_SPECTRAL_BASIS as basis} from '../../src/algorithm32/profiles/index.js';

const [initial,corrected,images]=process.argv.slice(2),json=p=>JSON.parse(readFileSync(checked(p),'utf8'));
const run=createRun('vertical-gpu','Validate native15 GPU spectra against actual4096images, production RGB projection and corrected physical ray registration',[initial,corrected,images].map(p=>identity(p+'/manifest.json')));let failure;
try{
 for(const parent of [initial,corrected,images]){const m=json(parent+'/manifest.json');assert.equal(m.state,'accepted');for(const a of m.artifacts)assert.equal(identity(a.path).sha256,a.sha256);}
 assert.deepEqual(json(initial+'/control.json').request,json(corrected+'/control.json').request);assert.deepEqual(json(initial+'/control.json').profile,json(images+'/control.json').profile);
 const color=new BrunetonColorDisplayModel(),results=[];
 for(const height of [500,2000]){
  const original=json(initial+'/noon-'+height+'-trace.json'),retarget=json(corrected+'/noon-'+height+'-trace.json'),raw=gunzipSync(readFileSync(checked(images+'/noon-'+height+'-4096-linear.f32.gz'))),image=new Float32Array(raw.buffer,raw.byteOffset,raw.length/4);let maximumImageRgbRelativeError=0,maximumProjectionRelativeError=0,maximumElevationErrorDegrees=0,maximumAzimuthErrorDegrees=0;const limb=-Math.acos(6360000/(6360000+height))*180/Math.PI;
  for(const q of original.results.find(r=>r.intervals===30).queries)if(q.imagePixel){const at=(q.imagePixel.y*4096+q.imagePixel.x)*4;for(let c=0;c<3;c++)maximumImageRgbRelativeError=Math.max(maximumImageRgbRelativeError,Math.abs(q.linearRgb[c]-image[at+c])/Math.max(1,Math.abs(image[at+c])));}
  for(const variant of retarget.results){assert.ok([30,480].includes(variant.intervals));assert.equal(variant.queries.length,95);for(const q of variant.queries){assert.equal(q.spectrum.length,15);assert.ok(q.spectrum.every(v=>Number.isFinite(v)&&v>=0));assert.equal(q.hasSceneEndpoint,0);assert.equal(q.hasGroundEndpoint,0);assert.ok(q.elevationDegrees>limb);const expected=color._spectralRadianceValuesToLinearSrgb(q.spectrum,basis);for(let c=0;c<3;c++)maximumProjectionRelativeError=Math.max(maximumProjectionRelativeError,Math.abs(q.linearRgb[c]-expected[c])/Math.max(1,Math.abs(expected[c])));maximumElevationErrorDegrees=Math.max(maximumElevationErrorDegrees,Math.abs(q.elevationDegrees-q.referenceElevationDegrees));maximumAzimuthErrorDegrees=Math.max(maximumAzimuthErrorDegrees,Math.abs(q.azimuthDegrees-q.referenceAzimuthDegrees));}}
  assert.ok(maximumImageRgbRelativeError<1e-5&&maximumProjectionRelativeError<1e-5);assert.ok(maximumElevationErrorDegrees<5e-6&&maximumAzimuthErrorDegrees<5e-6);results.push({height,queries:95,maximumImageRgbRelativeError,maximumProjectionRelativeError,maximumElevationErrorDegrees,maximumAzimuthErrorDegrees,scope:'Original queries validate image/spectral sampling. Retargeted queries match the frozen libRadtran physical angles; components converted by host atan2, not GPU inverse trig. No finite-footprint or scattering-order convergence claim.'});
 }
 const types=await command(run,'typecheck',['node_modules/typescript/bin/tsc','-p','experiments/clean-horizon-profiles/jsconfig.json']);assert.equal(types.code,0,types.stdout+types.stderr);run.write('proof.json',{results,typecheck:'passed'});console.log(JSON.stringify({proof:run.path,results}));
}catch(error){failure=String(error);run.write('failure.json',{message:failure});}run.finish(failure?'failed':'accepted',{failure});if(failure)process.exitCode=1;
