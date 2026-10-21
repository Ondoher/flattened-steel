import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,registration,pack,verifyRun} from './common.mjs';
import {miePhase} from '../interior-illumination/physics.mjs';
import {phaseMoments,legendre} from './phase-moments.mjs';

/** This experiment-local rule extends the old helper's explicit256-node API.
 * Validate polynomial moments below; do not modify its historical caller contract.
 * @param {number} count @returns {{nodes:number[],weights:number[]}} */
function highGauss(count) {
 const nodes=[],weights=[];
 for(let i=0;i<count;i++) {
  let z=Math.cos(Math.PI*(i+.75)/(count+.5)),derivative=0;
  for(let iteration=0;iteration<40;iteration++) {
   let p=1,previous=0;
   for(let j=1;j<=count;j++){const old=p;p=((2*j-1)*z*p-(j-1)*previous)/j;previous=old;}
   derivative=count*(z*p-previous)/(z*z-1);
   const next=z-p/derivative;
   if(Math.abs(next-z)<2e-15){z=next;break;}
   z=next;
  }
  nodes.push((1+z)/2);weights.push(1/((1-z*z)*derivative*derivative));
 }
 return {nodes,weights};
}

const L=512,order=384,r=registration();
const run=createRun('h136-phase-high',{
 parents:[verifyRun(base+'00664-h136-phase-proof'),verifyRun(base+'00692-h136-sh-field')],
 operation:'Extend independently integrated physical phase moment controls through degree512. Gauss384 on each linear-PDF interval integrates polynomial degree<=767, covering P512 times a linear PDF. Analytic CS is checked by independent smooth-phase quadrature. No phase normalization, clipping, material fitting or reconstruction change.',
 parameters:{L,order,profiles:['paper','toronto'],bands:[0,3,5,8,14],absoluteMomentTolerance:1e-7,costIsGate:false},
});
try {
 const q=highGauss(order),rows=[];
 assert.ok(q.nodes.every(x=>x>0&&x<1)&&q.weights.every(x=>x>0));
 const moments=[0,1,2,16,128,512,766].map(power=>({power,error:Math.abs(q.nodes.reduce((s,x,j)=>s+q.weights[j]*x**power,0)-1/(power+1))}));
 assert.ok(moments.every(x=>x.error<1e-12));
 run.write('gauss-proof.json',{order,moments});
 for(const profile of ['paper','toronto'])for(const channel of [0,3,5,8,14]) {
  const p=r.profiles.find(x=>x.id===profile),table=p.control.material.phaseTables[channel];
  const actual=phaseMoments(table,L),numeric=Array(L+1).fill(0),cuts=table?table.mu:[-1,1];
  for(let interval=1;interval<cuts.length;interval++) {
   if(interval%8===1)run.progress('high-phase-moments',`${profile}/b${channel} ${interval}/${cuts.length-1}`);
   const a=cuts[interval-1],span=cuts[interval]-a;
   for(let j=0;j<q.nodes.length;j++) {
    const mu=a+span*q.nodes[j],weight=span*q.weights[j]*2*Math.PI*miePhase(table,mu),P=legendre(mu,L);
    for(let l=0;l<=L;l++)numeric[l]+=weight*P[l];
   }
  }
  const maximum=Math.max(...actual.map((x,l)=>Math.abs(x-numeric[l])));
  assert.ok(maximum<=1e-7,'Degree512 phase moments versus independent Gauss384');
  rows.push({profile,channel,maximum,actual,numeric});
  console.log(JSON.stringify({profile,channel,maximum}));
 }
 run.write('rows.json.gz',pack(rows));
 run.write('summary.json',{cases:rows.length,L,order,maximum:Math.max(...rows.map(x=>x.maximum)),scope:'Physical phase moments only; not illumination projection, full cache or physical accuracy.'});
 run.finish('accepted',{cases:rows.length,L});
 console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}
verifyRun(run.path);
