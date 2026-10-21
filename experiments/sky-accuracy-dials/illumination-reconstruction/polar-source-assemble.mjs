import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {base,read,pack,verifyRun} from './common.mjs';
import {polarNativeField} from './polar-native-field.mjs';

const roots=process.argv.slice(2);assert.ok(roots.length>0);
const parents=roots.map(root=>verifyRun(root)),sources=roots.map(root=>({root,summary:read(root+'/summary.json')}));
const run=createRun('h136-source-row',{
 parents,operation:'Assemble the complete paper15-band proposed pure-J2 row from the newest numerically qualified per-band level. Authenticate exact parents, physical inputs, native outgoing identity and every GPU/binary64 array; preserve rejected/coarse precision flags in their source runs. This is one local source-density tile, not observer radiance or a complete recurrent cache.',
 parameters:{roots,bands:15,nativeOutgoing:4374,extraPhysicalDirections:3,projectionTarget:1e-5,allComponentRelative:1e-4,costIsGate:false,observerColors:false},
});
try{
 const rows=[];
 for(let channel=0;channel<15;channel++){
  run.progress('assemble-spectral-source',`paper band${channel}/15`);
  const choices=sources.flatMap(source=>source.summary.rows.filter(row=>row.channel===channel).map(row=>({...source,row}))),last=choices.at(-1);assert.ok(last,'Missing spectral band');
  const {row,summary}=last,level=row.levels.at(-1);assert.ok(level.projectionQualified&&level.projectionEnvelope<=1e-5,'Latest band projection is unresolved');
  const coefficientRoot=row.reusedParent??last.root,path=coefficientRoot+`/paper-b${channel}-n${level.n}.json.gz`,packet=read(path),inputRoot=row.inputRoot??row.reusedParent??summary.originalInputRoot??last.root,inputPath=inputRoot+`/paper-b${channel}-nodes.json.gz`,input=read(inputPath),{f,union}=polarNativeField(channel);
  assert.deepEqual(packet.result,level);assert.deepEqual(input.physical,f.px);assert.deepEqual(input.directions,union.field.g.nodes);assert.equal(packet.gpu.length,4377*4);assert.equal(packet.cpuValues.length,packet.gpu.length);
  const maximum=Math.max(...packet.gpu.map((x,i)=>{assert.ok(Number.isFinite(x)&&x>=0);return Math.abs(x-packet.cpuValues[i])/Math.max(Math.abs(packet.cpuValues[i]),1e-25);}));assert.ok(maximum<=1e-4);
  rows.push({channel,physical:f.px,coefficient:identity(path),input:identity(inputPath),L:packet.L,n:level.n,scale:level.scale,projectionEnvelope:level.projectionEnvelope,maximum,values:packet.gpu,cpuValues:packet.cpuValues,units:'Local pure-J2 source density, four R/M transition components'});
 }
 const {f}=polarNativeField(0),directions=[...f.p.control.request.transportSpec.domains.outgoing.unitVectors,f.out,f.px.sun,f.px.sun.map(x=>-x)];
 run.write('paper-source-row.json.gz',pack({rows,directions,nativeOutgoing:4374,extraPhysicalDirections:3,order:2,quantity:'pure scattering source density',boundary:'black',reconstruction:'fixed full128-ring union, positive two-axis source-phase-factored cubic'}));
 run.write('summary.json',{bands:15,profile:'paper',fullSpectralRow:true,projectionQualified:true,allOutgoingParity:true,rows:rows.map(({values,cpuValues,physical,...row})=>row),scope:'One complete numerically qualified source-density row. Physical transfer has its own local evidence; own-field transport/recurrence, ground, Toronto full spectral rows, B1 and observer scenes remain separate.'});
 run.finish('accepted',{bands:15,projectionQualified:true});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}
verifyRun(run.path);
