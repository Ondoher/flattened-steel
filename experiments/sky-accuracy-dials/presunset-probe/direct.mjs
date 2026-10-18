import {gauss} from '../continuation/direct-solver/math.mjs';
import {along,height,illumination,opticalDepth,phase,dot} from '../horizon-reference/math.mjs';
import {aerosolPhase} from '../horizon/aerosol-optics.mjs';

/** Binary64, deterministic first scattering with independent boundary/column math.
 * Toronto phase and SSA match the stochastic solver; no cache or production evaluator.
 * @param {any} group Physical single-band ray.
 * @param {any} material Authenticated Native15 phase/SSA.
 * @param {number} n Paired Gauss count64/128 for source/view columns and log-distance integration.
 * @returns {number} Spectral radiance W m^-2 sr^-1 nm^-1.
 */
export function direct(group,material,n){
 const {medium:m,origin:o,direction:v,channel:c,end}=group,q=gauss(n),edges=[0,1e4,5e4,1e5,3e5,1e6,end];let sum=0;
 for(let b=0;b<6;b++){
  const lower=Math.min(edges[b],end),upper=Math.min(edges[b+1],end);if(upper<=lower)continue;
  const la=Math.log1p(lower/1000),lb=Math.log1p(upper/1000);
  for(let i=0;i<n;i++){
   const t=1000*Math.expm1(la+(lb-la)*q.nodes[i]),jac=(t+1000)*(lb-la)*q.weights[i],x=along(o,v,t),h=Math.max(0,height(m,x)),s=illumination(m,x,c,n),cosine=dot(v,s.slice(0,3)),p=phase(cosine,m.g),table=material.phaseTables[c];
   const mie=table?aerosolPhase(table,cosine):p[1],source=m.rayleigh[c]*Math.exp(-h/m.rayleighHeight)*p[0]+m.mie[c]*material.albedos[c]*Math.exp(-h/m.mieHeight)*mie;
   sum+=source*s[3]*jac*Math.exp(-opticalDepth(m,o,v,t,c,n));
  }
 }
 return sum;
}
