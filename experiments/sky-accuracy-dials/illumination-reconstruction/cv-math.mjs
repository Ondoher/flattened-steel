import {phases,dot} from './common.mjs';
import {phaseMoments,convolution} from './phase-moments.mjs';
const cache=new Map();
/** Exact phase/amplitude control-variate identity, up to the separately measured
 * Mie/Mie moment-series truncation. Constant amplitude and a Sun/outgoing-odd
 * linear term are integrated analytically; numerical quadrature sees residuals.
 * No reference value selects anchors or coefficients.
 * @param {any} f @param {(d:number[])=>number[]} model @returns {any} */
export function amplitudeControl(f,model){
 const p=f.px,key=JSON.stringify(p.table);if(!cache.has(key))cache.set(key,phaseMoments(p.table,384));const a=cache.get(key),nu=dot(p.sun,f.out),P2=(3*nu*nu-1)/2,prOut=phases(p,f.out),prSun=phases(p,p.sun),out=model(f.out).map((v,s)=>prOut[s]>0?v/prOut[s]:0),sun=model(p.sun).map((v,s)=>prSun[s]>0?v/prSun[s]:0),cRR=(1+.05*P2)/(4*Math.PI),cRM=(1+.5*a[2]*P2)/(4*Math.PI),cMM=convolution(a,a,nu,384),cMM256=convolution(a,a,nu,256),average=(out[1]+sun[1])/2,b=nu<1-1e-10?p.sun.map((x,i)=>(sun[1]-out[1])*(x-f.out[i])/(2*(1-nu))):[0,0,0],beta=[p.br*Math.exp(-p.h/8000),p.bm*p.ssa*Math.exp(-p.h/1200)],analytic=[beta[0]*out[0]*cRR,beta[0]*sun[1]*cRM,beta[1]*out[0]*cRM,beta[1]*average*cMM];
 return {anchors:{out,sun,average,b},convolutions:{RR:cRR,RM:cRM,MM:cMM,MM256:cMM256},analytic,phaseTailEnvelope:2*beta[1]*Math.abs(average)*Math.abs(cMM-cMM256),residual:(d,L)=>{const src=phases(p,d),dest=[3*(1+dot(d,f.out)**2)/(16*Math.PI),0];return {src,dest,L};},coefficients:(d)=>[out[0],sun[1],out[0],average+dot(b,d)],beta,scope:'For identical incoming/outgoing aerosol phase, the linear (Sun-Out).d term integrates to zero by exchange symmetry. This is additive numerical stabilization, not a new atmosphere or fitted physical correction.'};
}
