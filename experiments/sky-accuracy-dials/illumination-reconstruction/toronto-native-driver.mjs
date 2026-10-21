import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {base,read,registration,pack,verifyRun} from './common.mjs';
import {builderGeometry} from './builder-geometry.mjs';
import {fastModel} from './fast-model.mjs';
import {piecewiseQuadrature} from './piecewise-quadrature.mjs';
import {miePhase,rayleighPhase,dot} from '../interior-illumination/physics.mjs';

const root=process.argv[2]?.startsWith(base)?process.argv[2]:base+process.argv[2];assert.ok(process.argv[2]);const seal=verifyRun(root),prior=read(root+'/summary.json'),last=prior.results.filter(x=>x.projectionQualified).at(-1);assert.ok(last);const nativePath=root+`/L${last.L}-native.json.gz`,native=read(nativePath),inputPath=base+'00734-h136-input-wave/toronto-b8-nodes.json.gz',input=read(inputPath),r=registration(),p=r.profiles.find(x=>x.id==='toronto'),t=r.targets.find(x=>x.id==='node-89'),config=r.configs.find(x=>x.k===.5),{f,union}=builderGeometry(p,t,8,config),vectors=[...native.nativeDirections,...native.extraDirections],drivers=[...new Set([...prior.results.slice(-2).map(x=>x.driver).filter(x=>Number.isInteger(x)&&x>=0),native.nativeDirections.length])],levels=[4,8,16,32],scale=input.controlScale;
assert.deepEqual(input.physical,f.px);assert.deepEqual(input.directions,union.field.g.nodes);const run=createRun('h136-tor-driver',{
 parents:[seal,verifyRun(base+'00734-h136-input-wave'),identity(nativePath),identity(inputPath)],operation:'Independently integrate the exact same reconstructed Toronto illumination with the full physical phase at the mechanically selected native phase-truncation drivers plus the aligned-Sun direction. Source-coordinate quadrature splits actual reconstruction knots and outgoing physical table tangencies/knots; it uses no harmonic expansion. Compare four last-species/input-channel contributions with the completed native projection. Native outgoing selection is frozen by previous degree-change maxima, not by new physical error. This is numerical operator verification, not physical atmosphere truth.',
 parameters:{L:last.L,drivers,levels,channel:8,physical:f.px,scale,operatorTolerance:1e-5,phaseMassTolerance:1e-5,nativeEmpiricalConvergence:prior.nativeEmpiricallyConverged,costIsGate:false},
});
try{
 const sample=fastModel(union.field,input.levels.n256),beta=[f.px.br*Math.exp(-f.px.h/8000),f.px.bm*f.px.ssa*Math.exp(-f.px.h/1200)],results=[];
 for(const index of drivers){assert.ok(index<vectors.length);const out=vectors[index],partition={...union.field,out},projection=native.values.slice(index*4,index*4+4),precision=[];let qualified=false;
  for(const n of levels){const started=Date.now(),sums=[0,0,0,0],mass=[0,0];let count=0;
   for(const q of piecewiseQuadrature(partition,n)){if(count%16384===0)run.progress('independent-native-driver',`out${index} n${n} query${count}`);const light=sample(q.d),mu=dot(q.d,out),phase=[rayleighPhase(mu),miePhase(f.px.table,mu)],w=[q.w*beta[0]*phase[0],q.w*beta[1]*phase[1]];sums[0]+=w[0]*light[0];sums[1]+=w[0]*light[1];sums[2]+=w[1]*light[0];sums[3]+=w[1]*light[1];mass[0]+=q.w*phase[0];mass[1]+=q.w*phase[1];count++;}
   const previous=precision.at(-1),referenceEnvelope=previous?2*sums.reduce((sum,x,s)=>sum+Math.abs(x-previous.sums[s]),0)/scale:null,discrepancy=sums.reduce((sum,x,s)=>sum+Math.abs(x-projection[s]),0)/scale,massQualified=mass.every(x=>Math.abs(x-1)<=1e-5),upper=referenceEnvelope===null?null:discrepancy+referenceEnvelope,item={n,count,sums,mass,massQualified,referenceEnvelope,discrepancy,upper,qualified:upper!==null&&upper<=1e-5&&massQualified,milliseconds:Date.now()-started};precision.push(item);run.write(`out${index}-n${n}.json`,item);console.log(JSON.stringify({index,...item}));if(item.qualified){qualified=true;break;}
  }
  results.push({index,direction:out,projection,precision,qualified});
 }
 const qualifiedNumerical=prior.nativeEmpiricallyConverged&&last.gpuEvaluationQualified&&last.negativeValues===0&&results.every(x=>x.qualified);run.write('summary.json',{L:last.L,drivers,results,nativeEmpiricallyConverged:prior.nativeEmpiricallyConverged,qualifiedNumerical,sourceNative:identity(nativePath),scope:'Finite actual native-node phase convergence plus independent full-physical-phase same-function driver checks. This is numerical producer evidence, not a rigorous arbitrary-outgoing tail bound, independent atmospheric truth, whole-cache/ground/later-order or B1 qualification.'});run.finish('accepted',{qualifiedNumerical,drivers:drivers.length});console.log(JSON.stringify({run:run.path,qualifiedNumerical,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}verifyRun(run.path);
