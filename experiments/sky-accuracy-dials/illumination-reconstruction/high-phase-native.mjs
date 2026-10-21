import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,registration,pack,verifyRun} from './common.mjs';
import {extendedGauss} from './high-gauss.mjs';
import {phaseMoments,legendre} from './phase-moments.mjs';
import {miePhase} from '../interior-illumination/physics.mjs';

const L=1024,order=768,r=registration(),run=createRun('h136-phase-1024',{
 parents:[verifyRun(base+'00734-h136-input-wave'),verifyRun(base+'00696-h136-phase-high')],operation:'Independently validate registered active phase moments through degree1024 before whole-native Toronto source-field truncation work. Endpoint-antiderivative moments are compared with Gauss768 integration on every linear-PDF interval, polynomial degree<=1535. Validate the quadrature independently on positive weights and moments. No physical PDF, normalization, material coefficient or source light is changed.',
 parameters:{L,order,cases:[['paper',8],...Array.from({length:15},(_,i)=>['toronto',i])],absoluteMomentTolerance:1e-7,costIsGate:false},
});
try{
 const q=extendedGauss(order),checks=[0,1,2,16,128,512,1024,1534].map(power=>({power,error:Math.abs(q.nodes.reduce((s,x,i)=>s+q.weights[i]*x**power,0)-1/(power+1))}));assert.ok(q.nodes.every(x=>x>0&&x<1)&&q.weights.every(x=>x>0)&&checks.every(x=>x.error<=1e-12));run.write('gauss.json',{order,checks});const rows=[];
 for(const [profile,channel]of [['paper',8],...Array.from({length:15},(_,i)=>['toronto',i])]){
  const p=r.profiles.find(x=>x.id===profile),table=p.control.material.phaseTables[channel],actual=phaseMoments(table,L),numeric=Array(L+1).fill(0),cuts=table?table.mu:[-1,1];
  for(let panel=1;panel<cuts.length;panel++){run.progress('phase-moment-1024',`${profile}/b${channel} interval${panel}/${cuts.length-1}`);const a=cuts[panel-1],span=cuts[panel]-a;for(let j=0;j<order;j++){const mu=a+span*q.nodes[j],pdf=table?table.pdf[panel-1]+(table.pdf[panel]-table.pdf[panel-1])*q.nodes[j]:2*Math.PI*miePhase(null,mu),w=span*q.weights[j]*pdf,P=legendre(mu,L);for(let l=0;l<=L;l++)numeric[l]+=w*P[l];}}
  const maximum=Math.max(...actual.map((x,l)=>Math.abs(x-numeric[l])));run.write(`${profile}-b${channel}.json.gz`,pack({profile,channel,L,order,actual,numeric,maximum}));assert.ok(maximum<=1e-7);rows.push({profile,channel,maximum,phaseKind:table?'registered-linear-PDF':'analytic-CS'});console.log(JSON.stringify(rows.at(-1)));
 }
 run.write('summary.json',{L,order,rows,qualified:true,scope:'Registered phase moments and polynomial quadrature only. Toronto source projection and finite-degree convolution truncation, actual native fields, physical accuracy, later-order caches, images and B1 remain separate.'});run.finish('accepted',{L,cases:rows.length});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}verifyRun(run.path);
