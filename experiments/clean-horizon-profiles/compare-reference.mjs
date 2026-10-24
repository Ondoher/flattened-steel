import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createRun,checked,identity} from './io.mjs';
import View from '../../scripts/algorithm32/solar-zenith-cache/DistantSunBrunetonView.js';
import {DistantSunSolarInterpolation as Solar} from '../../src/algorithm32/implementation/distant-sun/cache/DistantSunSolarInterpolation.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER as domain} from '../../src/algorithm32/sampling-domains/index.js';
import {interpolate} from './profile-sampling.mjs';
import {colorimetry} from '../sky-accuracy-dials/horizon/diagnosis-color.mjs';

const coarseReadout=process.argv.includes('--coarse-readout');
const lowerReadout=process.argv.includes('--lower-readout'),upperReadout=process.argv.includes('--upper-readout'),subsetReadout=coarseReadout||lowerReadout||upperReadout;
const [referencePath,baseNoon,armNoon,baseSunset,armSunset]=process.argv.slice(2).filter(a=>!['--coarse-readout','--lower-readout','--upper-readout'].includes(a));
const json=p=>JSON.parse(readFileSync(checked(p),'utf8'));
const sourcePaths=[baseNoon,armNoon,baseSunset,armSunset].filter(Boolean);
const run=createRun('ref-compare','S2/S3 replay retained N4 source-density data with tabulated optical depth and compare exact registered finite-pixel rays against MYSTIC',[identity(referencePath+'/manifest.json'),...sourcePaths.map(p=>identity(p+'/manifest.json'))]);
let failure;
try{
 const readings=json(referencePath+'/readings.json'),outputs=[];
 for(const source of sourcePaths){
  const manifest=json(source+'/manifest.json');assert.equal(manifest.state,'accepted');
  const heightField=existsSync(checked(source)+'/height-control.json'),control=json(source+(heightField?'/height-control.json':'/control.json')),cacheSource=heightField?source:control.reuseRoot??source,layout=json(cacheSource+(heightField?'/height-layout.json':'/layout.json')),profile=control.profile;
  const spec=structuredClone(control.request.transportSpec),model=profile?.id??'bruneton',selected=readings.filter(r=>r.config.time===control.time&&r.config.model===model);
  if(subsetReadout){assert.ok(heightField);const native=control.baselineRequest.transportSpec.domains.position,heights=[...new Set([...native.nodes.map(n=>n.altitudeMeters),...spec.domains.position.nodes.filter(n=>lowerReadout?n.altitudeMeters<1875:upperReadout?n.altitudeMeters>1875&&n.altitudeMeters<=3000:false).map(n=>n.altitudeMeters)])].sort((a,b)=>a-b);spec.domains.position={...native,count:heights.length,nodes:heights.map((altitudeMeters,index)=>({index,altitudeMeters}))};}
  if(!selected.length)continue;
  const view=new View(),indexes=new Map(layout.coordinates.flatMap(([h,z],i)=>{const target=subsetReadout?spec.domains.position.nodes.findIndex(n=>n.altitudeMeters===layout.compilerHeights[h]):h;return target<0?[]:[[[target,z].join(':'),i]];}));
  const packet=/** @type {any} */({layout:{uniqueDirectionCount:domain.uniqueDirectionCount}});
  const configs=[...new Map(selected.map(r=>[JSON.stringify([r.config.height,r.config.delta,r.config.q]),r.config])).values()];
  const prepared=configs.flatMap(config=>[config.height===40000?120:30,480].map(intervals=>{
   const theta=control.solarZenithDegrees*Math.PI/180,alpha=config.elevation*Math.PI/180,phi=config.azimuth*Math.PI/180;
   const up=[Math.sin(theta),0,Math.cos(theta)],toward=[-Math.cos(theta),0,Math.sin(theta)],across=[0,-1,0];
   const direction=up.map((v,i)=>v*Math.sin(alpha)+(toward[i]*Math.cos(phi)+across[i]*Math.sin(phi))*Math.cos(alpha));
   const origin=up.map(v=>v*(6360000+config.height)),projection=origin.reduce((s,v,i)=>s+v*direction[i],0);
   const ground=projection*projection-config.height*(12720000+config.height),hit=projection<0&&ground>=0;
   const length=hit?-projection-Math.sqrt(ground):-projection+Math.sqrt(projection*projection+(60000-config.height)*(12780000+config.height));
   const samples=Array.from({length:intervals},(_,i)=>{
    const a=length*(i/intervals)**2,b=length*((i+1)/intervals)**2,t=(a+b)/2,point=origin.map((v,j)=>v+t*direction[j]);
    return{step:b-a,altitude:Math.max(0,Math.hypot(...point)-6360000),cubic:view._cubic(spec,packet,indexes,point,direction)};
   });
   let rayleighPath=0,miePath=0;const step=length/8192;
   for(let i=0;i<8192;i++){const t=(i+.5)*step,h=Math.max(0,Math.sqrt((6360000+config.height)**2+2*projection*t+t*t)-6360000);rayleighPath+=Math.exp(-h/spec.atmosphere.rayleighScaleHeightMeters)*step;
    let density;if(profile){const z=profile.altitudesMeters,a=profile.extinction550PerMeter;let upper=1;while(upper<z.length-1&&z[upper]<h)upper++;const fraction=Math.max(0,Math.min(1,(h-z[upper-1])/(z[upper]-z[upper-1])));density=(a[upper-1]*(1-fraction)+a[upper]*fraction)/a[0];}else density=Math.exp(-h/spec.atmosphere.mieScaleHeightMeters);miePath+=density*step;}
   const fineTransmittance=spec.domains.spectrum.channels.map(c=>Math.exp(-c.rayleighScatteringPerMeter*rayleighPath-c.mieExtinctionPerMeter*miePath));
   return{config,intervals,samples,spectrum:Array(15).fill(0),transmittance:Array(15).fill(0),fineTransmittance};
  }));
  for(let channel=0;channel<15;channel++){
   run.progress('replay',source+' channel'+channel);
   const encoded=readFileSync(checked(cacheSource+'/'+(heightField?'height-':'')+'channel-'+channel+'.f32.gz')),buffer=gunzipSync(encoded),logical=new Float32Array(buffer.buffer,buffer.byteOffset,buffer.byteLength/4);
   assert.equal(logical.length,layout.coordinates.length*domain.directionCount);
   const unique=new Float32Array(layout.coordinates.length*domain.uniqueDirectionCount);
   for(let row=0;row<layout.coordinates.length;row++)for(let d=0;d<domain.directionCount;d++)unique[row*domain.uniqueDirectionCount+domain.logicalToUniqueDirectionIndices[d]]=logical[row*domain.directionCount+d];
   const optical=spec.domains.spectrum.channels[channel];
   for(const preparedRay of prepared){let transmission=1,radiance=0;
    for(const sample of preparedRay.samples){
     const density=profile?interpolate(profile.altitudesMeters,profile.extinction550PerMeter,sample.altitude)/profile.extinction550PerMeter[0]:Math.exp(-sample.altitude/spec.atmosphere.mieScaleHeightMeters);
     const ext=optical.rayleighScatteringPerMeter*Math.exp(-sample.altitude/spec.atmosphere.rayleighScaleHeightMeters)+optical.mieExtinctionPerMeter*density;
     const half=Math.exp(-ext*sample.step/2);transmission*=half;
     const sourceDensity=sample.cubic.reduce((sum,a)=>{const at=taps=>taps?.reduce((v,t)=>v+t.weight*unique[t.index],0);return sum+a.weight*Solar.sample(at(a.previous),at(a.lower),at(a.upper),at(a.next),a.fraction);},0);
     radiance+=transmission*sourceDensity*sample.step;transmission*=half;
    }
    preparedRay.spectrum[channel]=radiance;preparedRay.transmittance[channel]=transmission;
   }
  }
  for(const ray of prepared){const refs=selected.filter(r=>r.config.height===ray.config.height&&r.config.delta===ray.config.delta&&r.config.q===ray.config.q);assert.equal(refs.length,3);const reference=Array.from({length:15},(_,c)=>refs.reduce((s,r)=>s+r.spectrum[c]/3,0));const observed=colorimetry(reference,'bin-integrated'),cache=colorimetry(ray.spectrum,'bin-integrated');outputs.push({source,model,heightReadout:lowerReadout?'below1875':upperReadout?'above1875':coarseReadout?'original48':heightField?'refined':'original',time:control.time,height:ray.config.height,delta:ray.config.delta,pixelNode:ray.config.q,intervals:ray.intervals,spectrum:ray.spectrum,referenceSpectrum:reference,color:cache,referenceColor:observed,relativeY:cache.luminanceCdPerM2/observed.luminanceCdPerM2-1,transmittance:ray.transmittance,fineTransmittance:ray.fineTransmittance,maximumDirectTransmissionError:Math.max(...ray.transmittance.map((v,i)=>Math.abs(v-ray.fineTransmittance[i])))});}
 }
 run.write('comparison.json',{outputs,claim:'CPU replay of actual N4 field with production solar/direction reconstruction. Full reference is all orders; error combines truncation, cache, and view approximation. No order-tail bound or complete GPU ray validation is asserted. Rendered green-ground below-limb RGB is separate from this black-boundary reference.',limits:{relativeY:.05,absoluteContrast:.02}});
 console.log(JSON.stringify(outputs.map(o=>({model:o.model,time:o.time,height:o.height,delta:o.delta,q:o.pixelNode,intervals:o.intervals,relativeY:o.relativeY}))));
}catch(error){failure=String(error);run.write('failure.json',{message:failure});}
run.finish(failure?'failed':'accepted',{failure});if(failure)process.exitCode=1;
