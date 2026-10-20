import {models,coordinates} from './common.mjs';
import {physical,miePhase,dot} from './physics.mjs';
import {interval,mean,weights} from './analysis.mjs';

/** Separate the origin of incoming L1 photons within the outgoing Mie integral.
 * This is distinct from the unchanged outgoing Rayleigh quadrature residual.
 * @param {any} f @param {any} x @param {any[]} qs @param {any} old
 * @param {(s:string)=>void} progress @returns {any[]} */
export function origins(f,x,qs,old,progress){
 const p=physical(f),bs=models(f),data=Object.fromEntries(['H100','sector','midpoint'].map(n=>[n,Array.from({length:32},()=>({rayleighOrigin:0,aerosolOrigin:0,pointwiseCancellation:0,biasR:0,biasM:0}))]));
 for(let j=0;j<qs.length;j++){
  if(j%4096===0)progress(`${old.profile}/${old.target}/b${old.channel} ${j}/${qs.length}`);
  const q=qs[j],uv=coordinates(f.mesh,q.d),factor=p.bm*p.ssa*Math.exp(-p.h/1200)*miePhase(p.table,dot(q.d,f.out))/q.pdf/old.scale,stencils={H100:bs.H100.stencil(...uv),sector:bs.sector.stencil(...uv)},values={},bias={};
  for(const name of ['H100','sector']){values[name]=[0,1].map(c=>stencils[name].reduce((s,[i,w])=>s+w*x.nodes.n256[i][c],0)-x.angular.n256[j][c]);bias[name]=[0,1].map(c=>2*Math.abs(x.angular.n64[j][c]-x.angular.n32[j][c])+2*Math.abs(x.angular.n256[j][c]-x.angular.n64[j][c])+old.numericalEnvelope.gpuRelative*Math.abs(x.angular.n256[j][c])+stencils[name].reduce((s,[i,w])=>s+w*(2*Math.abs(x.nodes.n64[i][c]-x.nodes.n32[i][c])+2*Math.abs(x.nodes.n256[i][c]-x.nodes.n64[i][c])+old.numericalEnvelope.gpuRelative*Math.abs(x.nodes.n256[i][c])),0));}
  values.midpoint=[0,1].map(c=>(values.H100[c]+values.sector[c])/2);bias.midpoint=[0,1].map(c=>(bias.H100[c]+bias.sector[c])/2);
  for(const name of ['H100','sector','midpoint']){const a=data[name][q.batch],n=qs.length/32,e=values[name].map(v=>v*factor);a.rayleighOrigin+=e[0]/n;a.aerosolOrigin+=e[1]/n;a.pointwiseCancellation+=(Math.abs(e[0])+Math.abs(e[1])-Math.abs(e[0]+e[1]))/n;a.biasR+=factor*bias[name][0]/n;a.biasM+=factor*bias[name][1]/n;}
 }
 const K=weights({...f,controlWeights:x.controlWeights??f.controlWeights}),delta=f.incidents.map((v,i)=>v[0]+v[1]-x.nodes.n256[i][0]-x.nodes.n256[i][1]),peak=Math.max(...x.nodes.n256.map(v=>v[0]+v[1])),nodeInput=name=>{const mass=K[name].reduce((a,b)=>a+b,0),factor=f.beta/mass/old.scale;return {signed:factor*K[name].reduce((s,w,i)=>s+w*delta[i],0),absolute:factor*K[name].reduce((s,w,i)=>s+Math.abs(w)*Math.abs(delta[i]),0),absoluteByOrigin:[0,1].map(c=>factor*K[name].reduce((s,w,i)=>s+Math.abs(w)*Math.abs(f.incidents[i][c]-x.nodes.n256[i][c]),0)),maximumNodeDifferenceOverPeak:Math.max(...delta.map(Math.abs))/Math.max(peak,1e-30),scope:'Deterministic audit through inherited calibrated K, normalized by reference/floor. No new independent K qualification; signed and absolute nodal effects distinguish hidden input cancellation.'};};
 return ['H100','sector','midpoint'].map(name=>{const a=data[name],R=interval(a.map(b=>b.rayleighOrigin),interval(a.map(b=>b.biasR)).hi),M=interval(a.map(b=>b.aerosolOrigin),interval(a.map(b=>b.biasM)).hi),sum=interval(a.map(b=>b.rayleighOrigin+b.aerosolOrigin),R.bias+M.bias);return {profile:old.profile,target:old.target,channel:old.channel,model:name,scale:old.scale,samples:qs.length,nodeInput:nodeInput(name),rayleighOrigin:R,aerosolOrigin:M,sum,pointwiseCancellation:interval(a.map(b=>b.pointwiseCancellation),2*(R.bias+M.bias)),opposingResolvedOrigins:R.lo>0&&M.hi<0||R.hi<0&&M.lo>0,batches:a,scope:'Incoming L1 origins only, phase weighted into outgoing Mie J2. Not an outgoing-Rayleigh correction or a higher-order calculation.'};});
}
