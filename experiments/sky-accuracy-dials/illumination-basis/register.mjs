import assert from 'node:assert/strict';
import {createRun,verifyRun,identity,readRepository,storage} from '../io/files.mjs';
import {field} from '../phase-cells/field.mjs';
import {read} from '../geometry-incoming/common.mjs';
import {base,registrationRoot,registration,witnesses} from './common.mjs';
const parents=['00566-h97-phase-cells','00570-h99-phase-screen','00575-h98-az-proof','00576-h100-light-fit','00578-h100-path-delta','00579-h100-decisions','00581-h104-phase-proof'].map(x=>verifyRun(base+x));
const r=registration(),initial=storage(),run=createRun('h105-basis-reg',{parents,operation:'Authenticate retained illumination/model/controls before basis integration; reuse annotated historical geometry, not new physical results.',parameters:{witnesses,representation:'Exact H100 bilinear basis first, changed representation separately.',gates:{mass:1e-6,tv:5e-4,output:.001,decisionFraction:.1,nearGain:.5,sideGain:.2},cost:'Provisional only until actual representation accuracy and work are measured.',fresh:'Eight H97 tuples remain unexposed.',initial}});
try{
 const records=witnesses.map(t=>{run.progress('authenticate',JSON.stringify(t));const f=field(r,t);assert.equal(f.g.count,4096);return {...t,parent:f.parent,reference:r.reference,scale:Math.max(f.ref.mean,r.floors[t.profile]),nodeCount:f.g.count,A:f.A,geometry:identity(registrationRoot+`/${t.target}-k${t.k}.json.gz`)};});
 const old=base+'00571-h98-phase-maps/toronto-node-89-cells.png',image=readRepository(old),png=identity(old,image);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="950"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="20" y="30" font-size="24">H105 starting evidence: inherited illumination / physical cells / phase</text><text x="20" y="58">Reused H98 Toronto node-89 diagnostic. This is registration evidence, not a new candidate result or sky-color render.</text><text x="20" y="83">Next: expose positive interpolation donors and integrate their basis weights without changing the retained light.</text></g><image x="0" y="100" width="1440" height="850" href="data:image/png;base64,${image.toString('base64')}"/></svg>`;
 run.write('starting-evidence.svg',svg,{parents:[png],operation:'Annotate inherited image with current registration scope; original pixels embedded unchanged.'});
 const decision=read(base+'00579-h100-decisions/disposition.json');
 run.write('registration.json',{schema:'illumination-basis-registration-v1',registration:identity(registrationRoot+'/registration.json.gz'),records,floors:r.floors,materialHashes:r.materialHashes,cost:r.cost,controls:['A original point','C integrated constant cell','H100 same-model bilinear CDF','continuous physical J2','complete Sun1024/1408/2048/4096'],priorDisposition:decision,priorImage:png,reservedCount:r.freshReserved.length,authority:'Owner-selected H105-H112; source/output and immutable boundaries inherited.'});
 assert.equal(r.freshReserved.length,8);run.finish('accepted',{authenticatedWitnesses:records.length,newLightTraces:0,newPhysicalHistories:0,initial});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}
verifyRun(run.path);
