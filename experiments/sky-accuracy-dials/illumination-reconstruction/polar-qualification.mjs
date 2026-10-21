import assert from 'node:assert/strict';
import {createRun,storage,identity} from '../io/files.mjs';
import {base,read,pack,verifyRun} from './common.mjs';
import {physicalTotal} from './polar-total.mjs';

const root=base+'00705-h137-polar-all',integrals=(process.argv[2]??base+'00700-h137-polar-phys').split(','),precisionRoots=process.argv[3]?.split(',')??[];
const run=createRun('h137-polar-qual',{
 parents:[verifyRun(root),verifyRun(base+'00710-h137-polar-again'),verifyRun(base+'00711-h137-union-proof'),...integrals.map(path=>verifyRun(path)),...precisionRoots.map(path=>verifyRun(path))],
 operation:'Combine exact fixed polar-union exposed-field identities, conservative physical protections and separately qualified continuous-integral recoveries. Recompute the registered common-reference error bound with the selected independent query stream; do not merely copy old pass flags. Preserve every earlier/inconclusive result and any reference conflict. This is local pure-J2 qualification only, not recurrence or B1 admission.',
 parameters:{root,integrals,precisionRoots,allowance:.001,StudentFactor:2.46,freshUnexposed:8,costIsGate:false},
});
try {
 const inputs=read(root+'/rows.json.gz'),summary=read(root+'/summary.json'),sources=new Map(),newErrors=new Map();
 for(const parent of integrals){
  const recipe=read(parent+'/definition.json').recipe??read(parent+'/definition.json'),inputRoot=recipe.parameters?.root;
  assert.ok([root,base+'00697-h137-polar-union'].includes(inputRoot),'Qualified integral must name the exact current or reused four-case input root');
  for(const row of read(parent+'/rows.json.gz')){
   const key=[row.profile,row.target,row.channel].join(':'),input=inputs.find(x=>[x.profile,x.target,x.channel].join(':')===key);assert.ok(input);assert.equal(input.scale,row.scale);assert.deepEqual(input.parameters,row.parameters);
   const packet=read(root+`/${row.profile}-${row.target}-b${row.channel}.json.gz`),sourcePacketPath=inputRoot+`/${row.profile}-${row.target}-b${row.channel}.json.gz`;
   if(inputRoot!==root){assert.deepEqual(packet.reusedFreshParent,identity(sourcePacketPath));const sourcePacket=read(sourcePacketPath);assert.deepEqual(packet.fresh,sourcePacket.fresh);assert.deepEqual(packet.physical,sourcePacket.physical);}
   sources.set(key,{row,parent,inputRoot});
  }
 }
 for(const parent of precisionRoots){const row=read(parent+'/row.json.gz'),key=[row.profile,row.target,row.channel].join(':'),expected=identity(root+`/${row.profile}-${row.target}-b${row.channel}.json.gz`);assert.deepEqual(row.nodeParent,expected);newErrors.set(key,{row,parent});}
 const rows=[];
 for(const input of inputs){
  const key=[input.profile,input.target,input.channel].join(':'),source=sources.get(key),newError=newErrors.get(key),errors=newError?.row??input;
  assert.equal(errors.scale,input.scale);
  const physical=source?physicalTotal(errors,source.row.decisions.polarUnion):null;
  if(source&&!newError&&source.inputRoot===root){const old=source.row.decisions.polarUnion;assert.equal(physical.lower,old.lower);assert.equal(physical.upper,old.upper);assert.equal(physical.passed,old.passed);assert.equal(physical.rejected,old.rejected);}
  const marginal=input.protection.sun,conflict=Boolean(physical&&(marginal.passed&&physical.rejected||marginal.rejected&&physical.passed));
  const selected=physical??marginal,passed=!conflict&&(selected.passed||marginal.passed),rejected=!conflict&&!passed&&(selected.rejected||marginal.rejected),inconclusive=conflict||!passed&&!rejected;
  rows.push({profile:input.profile,target:input.target,channel:input.channel,cohort:input.cohort,passed,rejected,inconclusive,conflict,marginal,physical,physicalParent:source?.parent,errorParent:newError?.parent??root,componentProtected:input.comparisons.polarUnion.protected&&errors.comparisons.polarUnion.protected,midpointProtected:input.protection.midpoint.passed&&errors.protection.midpoint.passed,parameters:input.parameters});
 }
 const counts={passed:rows.filter(x=>x.passed).length,rejected:rows.filter(x=>x.rejected).length,inconclusive:rows.filter(x=>x.inconclusive).length,conflicts:rows.filter(x=>x.conflict).length},repeat=read(base+'00710-h137-polar-again/summary.json');
 const componentProtected=rows.every(x=>x.componentProtected),midpointProtected=rows.every(x=>x.midpointProtected),gainSupported=summary.profiles.every(p=>p.gain20Supported),repeatProtected=repeat.componentProtected&&repeat.midpointProtected&&repeat.sunCounts.passed===6;
 const localAdmitted=counts.passed===60&&componentProtected&&midpointProtected&&gainSupported&&repeatProtected;
 run.write('rows.json.gz',pack(rows));run.write('protections.tsv',['profile\ttarget\tband\tpassed\trejected\tinconclusive\tconflict\tphysical_parent\terror_parent',...rows.map(a=>[a.profile,a.target,a.channel,a.passed,a.rejected,a.inconclusive,a.conflict,a.physicalParent??'',a.errorParent].join('\t'))].join('\n')+'\n');
 run.write('summary.json',{cases:rows.length,counts,componentProtected,midpointProtected,gainSupported,repeatProtected,localAdmitted,profiles:summary.profiles.map(p=>({cohort:p.cohort,profile:p.profile,ratio:p.ratio,gain20Supported:p.gain20Supported})),scope:'Only fixed exposed black-boundary L1-to-local-J2. No reserved tuple, complete spectral physical qualification, own-field N4, paper B1 or observer-color result.'});
 run.finish('accepted',{cases:rows.length,counts,localAdmitted});console.log(JSON.stringify({run:run.path,counts,localAdmitted,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}
verifyRun(run.path);
