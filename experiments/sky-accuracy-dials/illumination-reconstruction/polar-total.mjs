import assert from 'node:assert/strict';
import {interval} from '../reconstruction-mechanisms/metrics.mjs';
import {absoluteChange} from './physical-decisions.mjs';

/** Reapply the registered common-reference physical bound to an unchanged
 * model integral and an explicitly selected independent error stream.
 * @param {any} row @param {any} source @returns {any} */
export function physicalTotal(row,source){
 const z=row.results.polarUnion,e=interval(z.bins.map(b=>b.mE+b.rE),z.envelopes.m+z.envelopes.r),half=e.half*2.46/2.04,error={...e,half,lo:e.mean-half-e.bias,hi:e.mean+half+e.bias};
 const {value,quadBias,control}=source;assert.ok([value,quadBias,control.value,control.bias].every(Number.isFinite));
 const delta={lo:control.value-value-control.bias-quadBias,hi:control.value-value+control.bias+quadBias},gain=absoluteChange(error,delta),lower=-gain.upper,upper=-gain.lower;
 const precision=quadBias<=1e-5&&source.priorIntegralOverlap!==false;
 return {lower,upper,passed:precision&&upper<=.001,rejected:precision&&lower>.001,inconclusive:!precision||lower<=.001&&upper>.001,error,value,quadBias,control,precision,priorIntegralOverlap:source.priorIntegralOverlap,scope:'Finite empirical black-boundary pure-J2 common-reference bound. Numerical convergence, independent error sampling and later-order accuracy remain distinct.'};
}
