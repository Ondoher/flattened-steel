import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRun,checked,identity} from './io.mjs';
import {colorimetry} from '../sky-accuracy-dials/horizon/diagnosis-color.mjs';

const parents=process.argv.slice(2);assert.equal(parents.length,5);
const json=p=>JSON.parse(readFileSync(checked(p),'utf8'));
const run=createRun('scene-analysis','S2 pilot-seed finite-pixel photometry and one-factor green-band sensitivity; no five-seed confirmation claims',parents.map(p=>identity(p+'/manifest.json')));
let failure;
try{
 for(const p of parents){const manifest=json(p+'/manifest.json');assert.equal(manifest.state,'accepted');for(const a of manifest.artifacts)assert.equal(identity(a.path).sha256,a.sha256);}
 const central=[...json(parents[0]+'/readings.json'),...json(parents[1]+'/readings.json')],variants=json(parents[2]+'/readings.json');
 const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
 const summary=a=>{assert.equal(a.length,3);const average=mean(a),sd=Math.sqrt(a.reduce((s,v)=>s+(v-average)**2,0)/2);return{mean:average,halfWidth95:4.302652729911275*sd/Math.sqrt(3),seeds:3,values:a};};
 const keys=[...new Map(central.map(r=>[JSON.stringify([r.config.model,r.config.time,r.config.height]),r.config])).values()],reference=[];
 for(const config of keys){const selected=central.filter(r=>r.config.model===config.model&&r.config.time===config.time&&r.config.height===config.height);
  const perSeed=[0,1,2].map(repeat=>{
   const sides=[-.1,.1].map(delta=>{const rows=selected.filter(r=>r.config.repeat===repeat&&r.config.delta===delta);assert.equal(rows.length,2);const spectrum=Array.from({length:15},(_,c)=>mean(rows.map(r=>r.spectrum[c])));return{delta,spectrum,color:colorimetry(spectrum,'bin-integrated')};});
   const low=sides[0].color.luminanceCdPerM2,high=sides[1].color.luminanceCdPerM2;return{repeat,sides,contrast:(high-low)/(high+low)};
  });
  reference.push({model:config.model,time:config.time,height:config.height,contrast:summary(perSeed.map(s=>s.contrast)),sides:[0,1].map(i=>({delta:perSeed[0].sides[i].delta,Y:summary(perSeed.map(s=>s.sides[i].color.luminanceCdPerM2)),meanSpectrum:Array.from({length:15},(_,c)=>mean(perSeed.map(s=>s.sides[i].spectrum[c])))})),perSeed});
 }
 const sensitivity=[];
 for(const model of [...new Set(variants.map(r=>r.config.model))]){
  const selected=variants.filter(r=>r.config.model===model),config=selected[0].config,baseline=central.filter(r=>r.config.model!=='bruneton'&&r.config.time===config.time&&r.config.height===config.height);
  for(const delta of [-.1,.1]){
   const values=rows=>[0,1,2].map(repeat=>mean(rows.filter(r=>r.config.repeat===repeat&&r.config.delta===delta).map(r=>r.spectrum[r.config.channels.indexOf(6)])));
   const a=values(selected),b=values(baseline);assert.ok(a.every(Number.isFinite)&&b.every(Number.isFinite));
   sensitivity.push({model,time:config.time,height:config.height,delta,band:6,variant:summary(a),central:summary(b),relativeDifference:mean(a)/mean(b)-1,pairedDifference:summary(a.map((v,i)=>v-b[i])),claim:'Green-band pilot only; matching random-seed IDs, distinct media. No full-color or five-seed benefit confirmation.'});
  }
 }
 const cache=parents.slice(3).flatMap(p=>json(p+'/comparison.json').outputs),cacheSummaries=[];
 for(const item of reference){const rows=cache.filter(r=>r.model===item.model&&r.time===item.time&&r.height===item.height);assert.equal(rows.length,8);
  const production=rows.filter(r=>r.intervals!==480),fine=rows.filter(r=>r.intervals===480);
  const contrasts=group=>{const y=delta=>mean(group.filter(r=>r.delta===delta).map(r=>r.color.luminanceCdPerM2)),low=y(-.1),high=y(.1);return(high-low)/(high+low);};
  cacheSummaries.push({model:item.model,time:item.time,height:item.height,relativeYRange:production.map(r=>r.relativeY).sort((a,b)=>a-b),fineRelativeYRange:fine.map(r=>r.relativeY).sort((a,b)=>a-b),referenceContrast:item.contrast,cacheContrast:contrasts(production),contrastError:contrasts(production)-item.contrast.mean,maximumDirectTransmissionError:Math.max(...production.map(r=>r.maximumDirectTransmissionError)),maximumViewRefinementRelativeY:Math.max(...production.map(r=>{const f=fine.find(v=>v.delta===r.delta&&v.pixelNode===r.pixelNode);return Math.abs(r.color.luminanceCdPerM2/f.color.luminanceCdPerM2-1);})),claim:'N4 retained-field CPU replay versus all-orders MYSTIC. Not an isolated cache-error estimate.'});
 }
 run.write('analysis.json',{reference,sensitivity,cacheSummaries,uncertainty:'Three pilot seeds only, Student t df2 intervals. Physical reconstruction uncertainty is separate. No five-seed confirmation or order-tail bound; do not infer validated full-scene photometry.'});
 console.log(JSON.stringify({cacheSummaries,sensitivity:sensitivity.map(({model,relativeDifference,delta})=>({model,delta,relativeDifference}))}));
}catch(error){failure=String(error);run.write('failure.json',{message:failure});}
run.finish(failure?'failed':'accepted',{failure});if(failure)process.exitCode=1;
