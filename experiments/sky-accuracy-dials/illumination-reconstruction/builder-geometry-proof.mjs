import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,registration,read,setup,verifyRun,coordinates,direction} from './common.mjs';
import {builderTarget,builderGeometry,atmosphericL1ShadowBound} from './builder-geometry.mjs';
import {polarUnion} from './polar-union.mjs';
import {edge,altitude,dot,rotate} from '../interior-illumination/physics.mjs';

const run=createRun('h138-row-frame',{
 parents:['00720-h137-polar-qual','00725-h136-source-row','00731-h136-spec-proof'].map(name=>verifyRun(base+name)),
 operation:'Prove a source-independent actual builder-row geometry constructor against all exposed registered reconstruction geometries. Verify canonical-world/local frames and a conservative black-boundary atmospheric N1 geometric shadow bound. No new radiance, reserved physical tuples, own-field recurrence or independent accuracy result.',
 parameters:{profiles:['paper','toronto'],channel:8,geometryOnly:true,shadowAltitudes:[0,1000,30000,60000],shadowBeyondDegrees:1,shadowRays:256,pathFractions:17,costIsGate:false},
});
try{
 const registrations=[registration(),read(base+'00543-h92-broad-reg/registration.json.gz')],rows=[];let parity=0;
 for(let ri=0;ri<registrations.length;ri++){
  const r=registrations[ri],names=ri===0?['node-89','reserved-out-1','held-0','held-1','held-2','held-3']:['dev-2','dev-5','held-6','node-90'];
  for(const target of names)for(const profile of ['paper','toronto']){
   // Existing exposed probe geometry only; the eight H97 reserved tuples stay unopened.
   if(!r.targets.some(t=>t.id===target))continue;
   run.progress('builder-row-geometry',`${profile}/${target}`);const old=setup(r,profile,target,8),next=builderGeometry(old.p,old.t,8,old.g.config),priorRoot=base+(ri===0?'00654-h135-profile':'00670-h137-transfer');
   assert.deepEqual(next.f.px,old.px);assert.deepEqual(next.f.g,old.g);assert.deepEqual(next.f.sourcePhases,old.sourcePhases);
   // The full union is invariant to the twelve-ring allocation; compare with the prior actual allocation.
   let scores;try{scores=read(priorRoot+`/${profile}-${target}-allocation.json`).scores;}catch(error){if(!String(error).includes('Missing path'))throw error;scores=Array(old.g.rings.length-1).fill(0);}
   const previous=polarUnion(old,scores);assert.deepEqual(next.union.field.g.nodes,previous.field.g.nodes);assert.deepEqual(next.union.field.sourcePhases,previous.field.sourcePhases);parity++;
  }
 }
 const p=registrations[0].profiles.find(p=>p.id==='paper'),R=p.control.medium.radius,top=p.control.medium.topAltitude;
 for(const h of [0,1000,30000,60000]){
  const bound=atmosphericL1ShadowBound(R,top,h),sza=bound+Math.PI/180,target=builderTarget(R,h,sza*180/Math.PI,`geometric-shadow-${h}`),sun=target.axis;let checked=0;
  run.progress('geometric-N1-shadow',`altitude${h} bound${bound*180/Math.PI}`);
  for(let j=0;j<256;j++){
   const d=rotate(1-2*(j+.5)/256,j*Math.PI*(3-Math.sqrt(5)),[0,0,1]),e=edge(R,top,h,d[2]);
   for(let k=0;k<17;k++){const t=e.length*(k+.5)/17,H=altitude(R,h,d[2],t),sunMu=((R+h)*sun[2]+t*dot(d,sun))/(R+H);if(e.length>0){assert.equal(edge(R,top,H,sunMu).ground,true,'A directly lit visible point violates the geometric N1 shadow bound');checked++;}}
  }
  rows.push({h,boundDegrees:bound*180/Math.PI,checked,sourceZenithDegrees:sza*180/Math.PI});
 }
 // Explicit frame/cosine and inverse-direction limits at both source poles.
 for(const sza of [0,45,89.5,90.5,120,180]){const t=builderTarget(R,0,sza,`frame-${sza}`);assert.ok(Math.abs(t.axis[2]-Math.cos(sza*Math.PI/180))<1e-14);assert.ok(Math.abs(Math.hypot(...t.axis)-1)<1e-14);}
 run.write('summary.json',{parity,rows,scope:'Geometry/frame and conservative N1 shadow-bound proof only. Does not infer any higher-order dark boundary or radiance accuracy.'});run.finish('accepted',{parity,shadowCases:rows.length});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}
verifyRun(run.path);
