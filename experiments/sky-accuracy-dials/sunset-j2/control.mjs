import assert from 'node:assert/strict';
import {readRepository,verifyRun,identity,sha256,resolveRepository} from '../io/files.mjs';
import {plan} from '../twilight-reference/geometry.mjs';
import {unit,dot,sourceFrame} from '../numerics/math.js';
import {warp} from '../outgoing-focus/geometry.mjs';
import {adapt} from '../outgoing-focus/control.mjs';
import {normalized} from '../outgoing-scene/mapping.mjs';
import {originalPhase} from '../distant-horizon/toronto-phase.js';
import {gunzipSync} from 'node:zlib';

export const parent='tmp/experiments/sky-accuracy-dials/runs/00429-h64-dusk-gpu';
export const compilerPath='scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
/** Frozen physics, exact row targets and canonicalized off-grid points.
 * @returns {any} Authenticated controls with original observer supports.
 */
export function inputs(){
 const parents=[verifyRun(parent),identity(compilerPath)],control=JSON.parse(readRepository(parent+'/control.json').toString());control.scenes=[control.scenes[0]];control.channels=[3,5,8];
 const support=plan(control),primary=support.rays[0],spec=control.request.transportSpec,count=spec.domains.position.count,nodes=spec.domains.outgoing.unitVectors;
 const e=.05*Math.PI/180,a=5*Math.PI/180,view=[Math.cos(e)*Math.cos(a),Math.cos(e)*Math.sin(a),Math.sin(e)];
 const targets=[],queries=[],samples=[];
 for(const z of [89,90]){
  const angle=(z+.5)*Math.PI/180,up=[Math.sin(angle),0,Math.cos(angle)],point=/** @type {SkyVector3} */([up[0]*spec.planet.bottomRadiusMeters,0,up[2]*spec.planet.bottomRadiusMeters]),sun=[Math.sin(angle),0,Math.cos(angle)];
  let outgoingIndex=0,best=-Infinity;for(let i=0;i<nodes.length;i++){const score=dot(warp(nodes[i],sun,.35),view);if(score>best){best=score;outgoingIndex=i;}}
  const local=warp(nodes[outgoingIndex],sun,.35),axes=sourceFrame(point),direction=unit([0,1,2].map(i=>local.reduce((s,x,j)=>s+x*axes[j][i],0)));
  targets.push({id:'node-'+z,kind:'node',row:z*count,zenith:z,position:0,point,direction,altitude:0,outgoingIndex,viewOffsetDegrees:Math.acos(Math.min(1,best))*180/Math.PI});
 }
 for(const index of [0,4]){
  const s=primary.samples[index],p=s.point,phi=Math.atan2(p[1],p[0]),c=Math.cos(phi),ss=Math.sin(phi),point=[Math.hypot(p[0],p[1]),0,p[2]],d=primary.direction,direction=[c*d[0]+ss*d[1],-ss*d[0]+c*d[1],d[2]],indices=[];
  for(const q of s.indices){indices.push(queries.length);queries.push(support.queries[q]);}
  const sample={...s,indices};samples.push({id:'view-'+index,sample});targets.push({id:'view-'+index,kind:'off-grid',point,direction,altitude:Math.hypot(...p)-spec.planet.bottomRadiusMeters,actualPoint:p,axialRotationRadians:-phi,sampleIndex:index});
 }
 control.targets=targets;control.queries=queries;control.samples=samples;control.schema='h67-sunset-l1-j2-v1';
 return {control,parents};
}

/** Unchanged retained compiler equations plus observation of live fields; stop after J2.
 * @returns {string} Contained JavaScript compiler source.
 */
export function source(){
 let s=readRepository(compilerPath).toString().replaceAll('\r\n','\n');assert.equal(s.split(originalPhase).length,2);
 s=`import {torontoPhaseGlsl} from '${resolveRepository('experiments/sky-accuracy-dials/distant-horizon/toronto-phase.js').replaceAll('\\','/')}';\n`+s.replace(originalPhase,'${torontoPhaseGlsl(wavelengthNanometers)}');s=adapt(normalized(s),.35);
 assert.equal(sha256(s),sha256(gunzipSync(readRepository(parent+'/k0.35/compiler.js.gz'))));
 return s.replace("if(fieldId.startsWith('J'))await globalThis['__h61Observe']({gl,fieldId,resource,common});","await globalThis['__h67Observe']({gl,fieldId,resource,common});");
}
