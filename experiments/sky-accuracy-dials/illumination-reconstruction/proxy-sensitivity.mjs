import {base,read} from './common.mjs';
import {gauss} from '../interior-illumination/physics.mjs';
import {radialTau} from './segment-transport.mjs';

/** Propagate source-projection empirical envelopes and conservative selected
 * GPU/storage sensitivity through a positive known-integral proxy stencil.
 * This is numerical sensitivity, not a rigorous physical enclosure.
 * @param {any} field @param {boolean} normalized @returns {number[]} */
export function proxyIntegralSensitivity(field,normalized){
 const errors=field.rows.map(row=>{let scale,envelope;if(row.root===base+'00725-h136-source-row'){const item=read(row.root+'/summary.json').rows.find(x=>x.channel===8);scale=item.scale;envelope=item.projectionEnvelope;}else{scale=read(row.root+'/input.json.gz').scale;envelope=read(row.root+'/summary.json').projection.at(-1).envelope;}return scale*envelope+1.1e-4*(row.rayleigh[field.upIndex]+row.mie[field.upIndex]);}),q=gauss(64),out=[0,0];
 for(let i=1;i<field.altitudes.length;i++){const a=field.altitudes[i-1],span=field.altitudes[i]-a;for(let j=0;j<q.nodes.length;j++){const t=q.nodes[j],h=a+span*t,w=span*q.weights[j]*Math.exp(-radialTau(field.physical,h));for(let s=0;s<2;s++){const H=[8000,1200][s],left=normalized?Math.exp((a-h)/H):1,right=normalized?Math.exp((field.altitudes[i]-h)/H):1;out[s]+=w*((1-t)*errors[i-1]*left+t*errors[i]*right);}}}return [...out,out[0]+out[1]];
}

/** Last-scattering R/M with all incoming origins combined, plus their sum.
 * @param {number[][]} batches @returns {any} */
export function speciesBatchStats(batches){const values=batches.map(x=>[...x,x[0]+x[1]]),N=batches.length,mean=[0,1,2].map(s=>values.reduce((sum,x)=>sum+x[s],0)/N),se=mean.map((m,s)=>Math.sqrt(values.reduce((sum,x)=>sum+(x[s]-m)**2,0)/(N*(N-1))));return {mean,se,threeSE:se.map(x=>3*x),batches:N,components:['last-Rayleigh/all-origins','last-Mie/all-origins','total']};}
