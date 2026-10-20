import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,verifyRun,pack} from './common.mjs';
import {gauss,rayleighPhase,miePhase} from '../interior-illumination/physics.mjs';
import {phaseMoments} from './phase-moments.mjs';
import {latitude,lm,project,convolve,sphereRule} from './harmonics.mjs';

const run=createRun('h136-sh-proof',{parents:[verifyRun(base+'00664-h136-phase-proof'),verifyRun(base+'00682-h136-gpu-cont')],operation:'Independent low-degree manufacture proof for a spherical-harmonic representation of the unchanged axisymmetric phase integral. Orthonormal complexY with m>=0, implicit conjugate negative orders, normalized physical phase moments. No atmospheric implementation or empirical fit.',parameters:{L:10,manufactures:[[2,1],[7,3],[5,0]],projection:48,independentPhaseQuadrature:96,tolerance:1e-9,physicalPhase:['Rayleigh','CS0.7']}});
try{
 const L=10,rows=[],moments=phaseMoments(null,L),ray=Array.from({length:L+1},(_,l)=>l===0?1:l===2?.1:0),q=gauss(96);
 for(const [l,m]of [[2,1],[7,3],[5,0]]){
  const sample=(mu,phi)=>{const y=latitude(mu,L)[lm(l,m)]*Math.cos(m*phi);return [1+.1*y,.5-.05*y];},c=project(sphereRule(48),sample,L,s=>run.progress('harmonic-manufacture',s));
  for(const mu of [-.95,-.3,.2,.91])for(const phi of [.13,1.7,4.2]){
   const v=sample(mu,phi),identity=convolve(c,mu,phi,Array(L+1).fill(1));assert.ok(Math.max(...v.map((x,k)=>Math.abs(x-identity[k])))<1e-10);
   const physical=[convolve(c,mu,phi,ray),convolve(c,mu,phi,moments)],direct=[[0,0],[0,0]],rad=Math.sqrt(1-mu*mu);
   for(let i=0;i<q.nodes.length;i++){const a=2*q.nodes[i]-1,r=Math.sqrt(1-a*a);for(let j=0;j<2*96;j++){const p=2*Math.PI*(j+.5)/(2*96),w=2*q.weights[i]*2*Math.PI/(2*96),z=mu*a+rad*r*Math.cos(p-phi),f=sample(a,p);for(let k=0;k<2;k++){direct[0][k]+=w*rayleighPhase(z)*f[k];direct[1][k]+=w*miePhase(null,z)*f[k];}}}
   const expected=[[1+.1*ray[l]*(v[0]-1)/.1,.5-.05*ray[l]*(.5-v[1])/.05],[1+moments[l]*(v[0]-1),.5+moments[l]*(v[1]-.5)]],error=Math.max(...physical.flatMap((p,i)=>p.map((x,k)=>Math.abs(x-direct[i][k])))),eigenError=Math.max(...physical.flatMap((p,i)=>p.map((x,k)=>Math.abs(x-expected[i][k]))));assert.ok(error<1e-9&&eigenError<1e-9,'Physical phase convolution/normalization manufacture');rows.push({l,m,mu,phi,error,eigenError});
  }
 }
 run.write('rows.json.gz',pack(rows));run.write('summary.json',{cases:rows.length,maximum:Math.max(...rows.map(x=>x.error)),eigenMaximum:Math.max(...rows.map(x=>x.eigenError)),scope:'Independent small mathematical controls, not real-field angular convergence, GPU parity or atmospheric accuracy.'});run.finish('accepted',{cases:rows.length});console.log(JSON.stringify({run:run.path,cases:rows.length,storage:storage()}));
}catch(e){run.finish('failed',{failure:String(e)});throw e;}verifyRun(run.path);
