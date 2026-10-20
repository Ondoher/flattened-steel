import assert from 'node:assert/strict';
import {models,coordinates} from './common.mjs';
import {physical,miePhase,rayleighPhase,dot} from './physics.mjs';
import {interval,mean} from './analysis.mjs';
/** @param {any} f @param {any} x @param {any[]} qs @param {any} old @param {number} degrees @param {(s:string)=>void} progress @returns {any[]} */
export function outgoing(f,x,qs,old,degrees,progress){const {profile,target,channel}=old,p=physical(f),bs=models(f),all=[];const angle=degrees*Math.PI/180,v=[f.out[0]*Math.cos(angle)-f.out[1]*Math.sin(angle),f.out[0]*Math.sin(angle)+f.out[1]*Math.cos(angle),f.out[2]],bins=Object.fromEntries(['H100','sector','midpoint'].map(name=>[name,Array.from({length:32},()=>({rec:0,input:0,direct:0,bias:0}))]));
   assert.ok(Math.abs(dot(v,v)-1)<1e-10&&v[2]===f.out[2]);
   for(let j=0;j<qs.length;j++){
    if(j%4096===0)progress(`${profile}/${target}/b${channel} ${degrees}deg ${j}/${qs.length}`);
    const q=qs[j],mu=dot(v,q.d),factor=p.bm*p.ssa*Math.exp(-p.h/1200)*miePhase(p.table,mu)/q.pdf/old.scale,rf=p.br*Math.exp(-p.h/8000)*rayleighPhase(mu)/q.pdf/old.scale,uv=coordinates(f.mesh,q.d),L=x.angular.n256[j].reduce((a,b)=>a+b,0),delta=2*Math.abs(x.angular.n64[j].reduce((a,b)=>a+b,0)-x.angular.n32[j].reduce((a,b)=>a+b,0))+2*Math.abs(L-x.angular.n64[j].reduce((a,b)=>a+b,0))+old.numericalEnvelope.gpuRelative*Math.abs(L),a={};
    for(const name of ['H100','sector']){let node=0,previous=0,bias=delta;for(const [i,w]of bs[name].stencil(...uv)){const n=x.nodes.n256[i].reduce((a,b)=>a+b,0);node+=w*n;previous+=w*f.incidents[i].reduce((a,b)=>a+b,0);bias+=w*(2*Math.abs(x.nodes.n64[i].reduce((a,b)=>a+b,0)-x.nodes.n32[i].reduce((a,b)=>a+b,0))+2*Math.abs(n-x.nodes.n64[i].reduce((a,b)=>a+b,0))+old.numericalEnvelope.gpuRelative*Math.abs(n));}a[name]={node,previous,bias};}
    a.midpoint=Object.fromEntries(['node','previous','bias'].map(k=>[k,(a.H100[k]+a.sector[k])/2]));
    for(const name of ['H100','sector','midpoint']){const bin=bins[name][q.batch],n=qs.length/32;bin.rec+=factor*(a[name].node-L)/n;bin.input+=factor*(a[name].previous-a[name].node)/n;bin.bias+=factor*a[name].bias/n;bin.direct+=(factor+rf)*L/n;}
   }
   for(const name of ['H100','sector','midpoint']){const a=bins[name],bias=interval(a.map(x=>x.bias)).hi;all.push({profile,target,channel,model:name,rotationDegrees:degrees,outgoing:v,originalOutgoing:f.out,scale:old.scale,referenceScope:'Original-direction scale only; no matched new-direction independent reference.',samples:qs.length,queryParent:null,lightParent:null,reconstruction:interval(a.map(x=>x.rec),bias),input:interval(a.map(x=>x.input),bias),continuousEstimate:interval(a.map(x=>x.direct)),batches:a});}
return all;}
