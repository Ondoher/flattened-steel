import assert from 'node:assert/strict';
import {createRun,identity,readRepository,storage} from '../io/files.mjs';
import {base,read,registration,setup,verifyRun} from './common.mjs';
import {outgoingPhysical} from './outgoing-frame.mjs';

const compiler='scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js',run=createRun('h136-frame-proof',{parents:['00667-h136-native-row','00669-h136-native-row','00677-h136-frame-row'].map(n=>verifyRun(base+n)).concat([identity(compiler)]),operation:'Resolve the actual registered coordinate contract before recurrence. Original native row controls use receiver-local outgoing directions; the extra rotated row is a physical-direction diagnostic, not a native-layout correction. Preserve original and diagnostic provenance.',parameters:{expected:'scene-cache-receiver-local-v1',correctionToEarlierInterpretation:true}});
try{
 const rows=[],source=readRepository(compiler).toString();assert.ok(source.includes('vec3 phaseOutgoingDirection(vec3 point, vec3 localDirection) { return localDirection; }'));
 for(const profile of ['paper','toronto']){
  const f=setup(registration(),profile,'node-89',3),contract=f.p.control.request.transportSpec.shaderProfile.coordinateContract;assert.equal(contract,'scene-cache-receiver-local-v1');const vectors=f.p.control.request.transportSpec.domains.outgoing.unitVectors;
  assert.equal(vectors.length,4374);assert.ok(vectors.every(v=>Math.abs(Math.hypot(...v)-1)<1e-10));
  const alternate=read(base+`00677-h136-frame-row/${profile}-frame.json`);let mapping=0,difference=0;
  for(let i=0;i<vectors.length;i++){const d=outgoingPhysical(vectors[i],f.t.point);mapping=Math.max(mapping,...d.map((v,k)=>Math.abs(v-alternate.outgoing[i][k])));difference=Math.max(difference,...d.map((v,k)=>Math.abs(v-vectors[i][k])));}
  assert.ok(mapping<1e-12);rows.push({profile,contract,nativeCubeVectorsAreReceiverLocal:true,originalNativeMappingCorrect:true,rotatedRunIsDiagnostic:true,alternateMappingError:mapping,maximumDifferenceFromNative:difference});
 }
 run.write('summary.json',{rows,scope:'Contract/coordinate interpretation proof, not physical light or later-order qualification.',supersedesInterpretation:'00677 recipe frameCorrect refers only to the alternate production-source-aligned mapping, not the actual receiver-local parent control. Do not relabel00677 as its native-layout correction.'});run.finish('accepted',{profiles:rows.length,originalMappingCorrect:true});console.log(JSON.stringify({run:run.path,rows,storage:storage()}));
}catch(e){run.finish('failed',{failure:String(e)});throw e;}verifyRun(run.path);
