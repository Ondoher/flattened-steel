import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,read,pack,verifyRun} from './common.mjs';
import {absoluteChange} from './physical-decisions.mjs';
import {interval} from '../reconstruction-mechanisms/metrics.mjs';

const parents=['00658-h135-confirm','00663-h135-phys-ref','00671-h136-piecewise','00673-h135-precision'],run=createRun('h135-phys-close',{parents:parents.map(n=>verifyRun(base+n)),operation:'Resolve specific complete-Sun physical-protection uncertainty with a controlled physical control variate: converged integral of the model minus independently sampled model-minus-direct error. Preserve common physical-reference covariance in candidate/control error changes; include finite integration, light and control envelopes. Independent history overlap remains separate.',parameters:{allowance:.001,StudentFactor:2.46,quadratureEnvelope:'2*last successive change +2e-12 normalized floating summation allowance; finite convergence evidence, not certified truncation.',scope:'Black-boundary pure localJ2 only. Preserve old inconclusive decisions; new recovery is separately derived.',costIsGate:false}});
try{
 const old=read(base+parents[0]+'/rows.json.gz'),quad=read(base+parents[2]+'/rows.json.gz'),precision=read(base+parents[3]+'/rows.json.gz'),refs=read(base+parents[1]+'/references.json.gz'),rows=[];
 for(const q of quad){
  const a=old.find(x=>x.profile===q.profile&&x.target===q.target&&x.channel===q.channel),last=q.levels.at(-1),sun=a.physicalDirect.completeSun4096;assert.ok(a&&q.levels.length>=2);
  for(const [name,key]of [['biRaw','raw'],['biDense','dense']]){
   const source=a.results[name],e=interval(source.bins.map(b=>b.mE+b.rE),source.envelopes.m+source.envelopes.r),half=e.half*2.46/2.04,error={...e,half,lo:e.mean-half-e.bias,hi:e.mean+half+e.bias},value=last.normalized[key],quadBias=2*last.change[key]+2e-12,delta={lo:sun.value-value-sun.bias-quadBias,hi:sun.value-value+sun.bias+quadBias},gain=absoluteChange(error,delta),lower=-gain.upper,upper=-gain.lower,truth={mean:value-error.mean,lo:value-quadBias-error.hi,hi:value+quadBias-error.lo},mc=refs.find(x=>x.profile===q.profile&&(x.id??x.target)===q.target&&x.channel===q.channel),mcInterval=mc?{lo:(mc.mean-mc.half95)/a.scale,hi:(mc.mean+mc.half95)/a.scale}:null;
   rows.push({profile:q.profile,target:q.target,channel:q.channel,name,lower,upper,passed:upper<=.001,rejected:lower>.001,inconclusive:lower<=.001&&upper>.001,gain:{lower:gain.lower,upper:gain.upper},candidateError:error,modelIntegral:value,quadBias,control:sun,delta,truth,independentMC:mcInterval,MCOverlap:mcInterval?truth.lo<=mcInterval.hi&&truth.hi>=mcInterval.lo:null,source:'Continuous model integral - independent paired reconstruction-error integral; common physical truth retained between model and complete Sun.'});
  }
 }
 const disposition=[];
 for(const a of old)for(const name of ['biRaw','biDense']){
  const recovered=rows.find(x=>x.profile===a.profile&&x.target===a.target&&x.channel===a.channel&&x.name===name),p=precision.find(x=>x.profile===a.profile&&x.target===a.target&&x.channel===a.channel),decision=recovered??p?.protection[name].sun??a.protection[name].sun;
  disposition.push({profile:a.profile,target:a.target,channel:a.channel,name,passed:decision.passed,rejected:decision.rejected,inconclusive:decision.inconclusive,source:recovered?parents[2]:p?parents[3]:parents[0],earlier:a.protection[name].sun});
 }
 const counts=['biRaw','biDense'].map(name=>({name,passed:disposition.filter(x=>x.name===name&&x.passed).length,rejected:disposition.filter(x=>x.name===name&&x.rejected).length,inconclusive:disposition.filter(x=>x.name===name&&x.inconclusive).length}));
 run.write('recovery.json.gz',pack(rows));run.write('summary.json',{counts,disposition,scope:'New separately derived protection decisions; no old evidence altered. Finite nonsimultaneous empirical coverage; local pureJ2 only.'});run.write('recovery.tsv','profile\ttarget\tband\tmodel\tprotectionLower\tprotectionUpper\tpassed\tMCOverlap\n'+rows.map(x=>[x.profile,x.target,x.channel,x.name,x.lower,x.upper,x.passed,x.MCOverlap].join('\t')).join('\n')+'\n');run.finish('accepted',{counts,recovered:rows.length});console.log(JSON.stringify({run:run.path,counts,rows:rows.map(x=>({profile:x.profile,channel:x.channel,name:x.name,upper:x.upper,passed:x.passed,MCOverlap:x.MCOverlap})),storage:storage()}));
}catch(e){run.finish('failed',{failure:String(e)});throw e;}verifyRun(run.path);
