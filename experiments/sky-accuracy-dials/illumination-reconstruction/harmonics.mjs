import {gauss} from '../interior-illumination/physics.mjs';

export const lm=(l,m)=>l*(l+1)/2+m;
/** Orthonormal complex-Y latitude factors including Condon-Shortley sign.
 * Stable normalized associated-Legendre recurrence. @param {number} mu
 * @param {number} L @returns {Float64Array} */
export function latitude(mu,L){
 const q=new Float64Array((L+1)*(L+2)/2),s=Math.sqrt(Math.max(0,1-mu*mu));q[0]=1/Math.sqrt(4*Math.PI);
 for(let m=0;m<=L;m++){
  if(m>0)q[lm(m,m)]=-Math.sqrt((2*m+1)/(2*m))*s*q[lm(m-1,m-1)];
  if(m<L)q[lm(m+1,m)]=Math.sqrt(2*m+3)*mu*q[lm(m,m)];
  for(let l=m+2;l<=L;l++){
   const d=(l-m)*(l+m),a=Math.sqrt((4*l*l-1)/d),b=Math.sqrt((2*l+1)*((l-1)*(l-1)-m*m)/((2*l-3)*d));
   q[lm(l,m)]=a*mu*q[lm(l-1,m)]-b*q[lm(l-2,m)];
  }
 }
 return q;
}

/** Nonuniform, boundary-compatible Fourier/Legendre projection. The quadrature
 * is explicit and independent of outgoing direction. No sampled physical phase
 * mass renormalization. @param {Iterable<any>} latitudes
 * @param {(mu:number,phi:number)=>number[]} sample @param {number} L
 * @param {(s:string)=>void} progress @returns {any} */
export function project(latitudes,sample,L,progress){
 const size=(L+1)*(L+2)/2,real=[new Float64Array(size),new Float64Array(size)],imag=[new Float64Array(size),new Float64Array(size)];let count=0,rings=0;
 for(const row of latitudes){
  if(rings%16===0)progress(`degree${L} latitude${rings} samples${count}`);
  const fr=[new Float64Array(L+1),new Float64Array(L+1)],fi=[new Float64Array(L+1),new Float64Array(L+1)];
  for(const arc of row.arcs){const g=gauss(arc.n),span=arc.b-arc.a;for(let i=0;i<g.nodes.length;i++){
   const phi=arc.a+span*g.nodes[i],w=span*g.weights[i],v=sample(row.mu,phi),c=Math.cos(phi),s=Math.sin(phi);let cm=1,sm=0;
   for(let m=0;m<=L;m++){for(let k=0;k<2;k++){fr[k][m]+=w*v[k]*cm;fi[k][m]-=w*v[k]*sm;}const next=cm*c-sm*s;sm=sm*c+cm*s;cm=next;}count++;
  }}
  const Q=latitude(row.mu,L);
  for(let l=0;l<=L;l++)for(let m=0;m<=l;m++){const at=lm(l,m),w=row.weight*Q[at];for(let k=0;k<2;k++){real[k][at]+=w*fr[k][m];imag[k][at]+=w*fi[k][m];}}
  rings++;
 }
 return {L,real,imag,count,rings};
}

/** Axisymmetric convolution eigenvalues are a_l=2pi integral P(x)P_l(x)dx.
 * Return independent input-channel contributions. @param {any} c
 * @param {number} mu @param {number} phi @param {number[]} moments
 * @param {number} [cutoff] @returns {number[]} */
export function convolve(c,mu,phi,moments,cutoff=c.L){
 const Q=latitude(mu,cutoff),out=[0,0],cos=Math.cos(phi),sin=Math.sin(phi);let cm=1,sm=0;
 for(let m=0;m<=cutoff;m++){
  for(let l=m;l<=cutoff;l++){const at=lm(l,m),w=moments[l]*Q[at]*(m===0?1:2);for(let k=0;k<2;k++)out[k]+=w*(c.real[k][at]*cm-c.imag[k][at]*sm);}
  const next=cm*cos-sm*sin;sm=sm*cos+cm*sin;cm=next;
 }
 return out;
}

/** Exact quadrature for the low-degree band-limited manufacture controls.
 * @param {number} n @returns {Generator<any>} */
export function* sphereRule(n){const q=gauss(n);for(let i=0;i<n;i++)yield {mu:2*q.nodes[i]-1,weight:2*q.weights[i],arcs:[{a:0,b:2*Math.PI,n:2*n}]};}
