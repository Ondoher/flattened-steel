import assert from 'node:assert/strict';
import {createRun,verifyRun,storage} from '../io/files.mjs';
import {read} from '../geometry-incoming/common.mjs';
import {gauss} from '../continuation/direct-solver/math.mjs';
import {window,make} from './rules.mjs';

/** Independent rotationally symmetric partition integrals, split at exact taper boundaries. @param {any} config @param {number} order @returns {any} */
function exact(config,order){const q=gauss(order),[inner,outer]=config.width??[15,45],breaks=[0,inner,outer,180].map(x=>x*Math.PI/180);let area=0,axisMoment=0;
 for(let segment=1;segment<breaks.length;segment++){const lo=breaks[segment-1],span=breaks[segment]-lo;for(let i=0;i<q.nodes.length;i++){const theta=lo+span*q.nodes[i],mu=Math.cos(theta),d=[Math.sin(theta),0,mu],s=window(config,d,[0,0,1]),w=2*Math.PI*Math.sin(theta)*span*q.weights[i];area+=w*s;axisMoment+=w*s*mu;}}
 return {area,axisMoment};
}
const root=process.argv[2],r=read(root+'/registration.json.gz'),rows=[];
for(const t of r.targets)for(const width of [[15,45],[30,90]]){
 const config={id:width.join('-'),kind:'compact',n:1024,width},fine=exact(config,128),coarse=exact(config,64);assert.ok(Math.abs(coarse.area-fine.area)<1e-11&&Math.abs(coarse.axisMoment-fine.axisMoment)<1e-11);
 const g=make(config,t,r.profiles[0].control),b=g.nodes.slice(0,68),w=g.weights.slice(0,68),area=w.reduce((s,x)=>s+x,0)+fine.area,moments=[0,1,2].map(j=>(b.reduce((s,d,i)=>s+w[i]*d[j],0)+fine.axisMoment*t.axis[j])/(4*Math.PI));
 rows.push({target:t.id,width,exactInterior:fine,exteriorArea:w.reduce((s,x)=>s+x,0),limitingRelativeArea:area/(4*Math.PI)-1,limitingMoments:moments,geometryError:Math.max(Math.abs(area/(4*Math.PI)-1),...moments.map(Math.abs)),localPass:Math.max(Math.abs(area/(4*Math.PI)-1),...moments.map(Math.abs))<=.02});
}
const run=createRun('h84-exterior',{parents:[verifyRun(root)],operation:'Independently integrate compact partition area and first moments with split64/128 Gauss rules, combine exact interior with the unchanged F68 exterior. Mathematical infinite-Sun-resolution limit only; no atmospheric error floor is claimed.',parameters:{widths:[[15,45],[30,90]],limits:'Compact windows fail mandatory manufactured admission at every actual grid. Atmospheric partitioned-reference work is not triggered for rejected constructions.'}});
try{run.write('limits.json',{rows,allFailLocal:rows.every(x=>!x.localPass),interpretation:'Even an exactly integrated interior leaves a fixed first-moment error above2%. More Sun directions cannot qualify these compact windows. This is not evidence that a physical horizon is wrong.'});run.finish('accepted',{cases:rows.length});}catch(e){run.finish('failed',{failure:String(e)});throw e;}verifyRun(run.path);console.log(JSON.stringify({run:run.path,allFailLocal:rows.every(x=>!x.localPass),range:[Math.min(...rows.map(x=>x.geometryError)),Math.max(...rows.map(x=>x.geometryError))],storage:storage()}));
