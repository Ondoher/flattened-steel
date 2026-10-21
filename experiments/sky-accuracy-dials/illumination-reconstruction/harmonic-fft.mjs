import assert from 'node:assert/strict';
import {latitude,lm} from './harmonics.mjs';

/** In-place forward DFT, exp(-2*pi*i*j*k/N), unnormalized.
 * No atmospheric coefficients or phase weights enter this primitive.
 * @param {Float64Array} real @param {Float64Array} imag */
export function fft(real,imag) {
 const n=real.length;assert.ok(n===imag.length&&n>=2&&(n&(n-1))===0);
 for(let i=1,j=0;i<n;i++) {
  let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;
  if(i<j){[real[i],real[j]]=[real[j],real[i]];[imag[i],imag[j]]=[imag[j],imag[i]];}
 }
 for(let width=2;width<=n;width*=2) {
  const half=width/2,a=-2*Math.PI/width,wr=Math.cos(a),wi=Math.sin(a);
  for(let start=0;start<n;start+=width) {
   let cr=1,ci=0;
   for(let j=0;j<half;j++) {
    const lo=start+j,hi=lo+half,tr=cr*real[hi]-ci*imag[hi],ti=cr*imag[hi]+ci*real[hi];
    real[hi]=real[lo]-tr;imag[hi]=imag[lo]-ti;real[lo]+=tr;imag[lo]+=ti;
    const next=cr*wr-ci*wi;ci=ci*wr+cr*wi;cr=next;
   }
  }
 }
}

/** Independent O(N^2) comparison on small complex manufactures, including
 * the midpoint azimuth shift used by projection. @returns {any} */
export function fftProof() {
 const rows=[];
 for(const n of [8,32,128]) {
  const a=Float64Array.from({length:n},(_,j)=>.7+Math.sin(j*.314159)+.1*Math.cos(j*j*.017));
  const b=Float64Array.from({length:n},(_,j)=>.2*Math.sin(j*.271828));
  const real=a.slice(),imag=b.slice();fft(real,imag);let maximum=0;
  for(let k=0;k<n;k++) {
   let r=0,i=0;
   for(let j=0;j<n;j++){const q=-2*Math.PI*j*k/n,c=Math.cos(q),s=Math.sin(q);r+=a[j]*c-b[j]*s;i+=a[j]*s+b[j]*c;}
   maximum=Math.max(maximum,Math.abs(real[k]-r),Math.abs(imag[k]-i));
  }
  assert.ok(maximum<1e-10);rows.push({n,maximum});
 }
 return {convention:'Forward unnormalized negative-exponent complex DFT',rows};
}

/** The same polar quadrature and illumination function, with a separately
 * refined periodic midpoint Fourier rule. This is a numerical integration
 * adapter; it neither changes the light interpolation nor smooths its data.
 * @param {Iterable<any>} latitudes @param {(mu:number,phi:number)=>number[]} sample
 * @param {number} L @param {number} N @param {(s:string)=>void} progress
 * @returns {any} */
export function projectFft(latitudes,sample,L,N,progress) {
 assert.ok(Number.isInteger(N)&&N>2*L&&(N&(N-1))===0);
 const size=(L+1)*(L+2)/2,real=[new Float64Array(size),new Float64Array(size)],imag=[new Float64Array(size),new Float64Array(size)];
 const phaseR=Array.from({length:L+1},(_,m)=>Math.cos(m*Math.PI/N)*2*Math.PI/N);
 const phaseI=Array.from({length:L+1},(_,m)=>Math.sin(m*Math.PI/N)*2*Math.PI/N);
 let count=0,rings=0;
 for(const row of latitudes) {
  if(rings%8===0)progress(`degree${L} FFT${N} latitude${rings} samples${count}`);
  const fr=[new Float64Array(N),new Float64Array(N)],fi=[new Float64Array(N),new Float64Array(N)];
  for(let j=0;j<N;j++){const v=sample(row.mu,2*Math.PI*(j+.5)/N);fr[0][j]=v[0];fr[1][j]=v[1];count++;}
  fft(fr[0],fi[0]);fft(fr[1],fi[1]);
  const Q=latitude(row.mu,L);
  for(let l=0;l<=L;l++)for(let m=0;m<=l;m++) {
   const at=lm(l,m),weight=row.weight*Q[at];
   for(let s=0;s<2;s++) {
    real[s][at]+=weight*(fr[s][m]*phaseR[m]+fi[s][m]*phaseI[m]);
    imag[s][at]+=weight*(fi[s][m]*phaseR[m]-fr[s][m]*phaseI[m]);
   }
  }
  rings++;
 }
 return {L,N,real,imag,count,rings};
}
