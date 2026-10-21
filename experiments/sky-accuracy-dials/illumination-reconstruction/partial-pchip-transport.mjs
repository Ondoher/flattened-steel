import assert from 'node:assert/strict';
import {gauss} from '../interior-illumination/physics.mjs';
import {radialTau} from './segment-transport.mjs';
import {densitySegmentKernel} from './partial-density.mjs';
import {altitudePchip,altitudePchipValue} from './altitude-pchip.mjs';

/** Fixed normalized source models at the exact native upward direction.
 * @param {any} field @returns {any[]} */
export function partialPchipModels(field){return ['rayleigh','mie'].map(key=>altitudePchip(field.altitudes,field.rows.map(row=>row[key][field.upIndex])));}

/** Independent finite physical trapezoid with density restored exactly once.
 * @param {any} field @param {number} n @returns {number[]} */
export function partialPchipFinite(field,n){const models=partialPchipModels(field),out=[0,0],step=4375/n,p=field.physical;let T=1,previous=0;for(let j=0;j<=n;j++){const h=j*step,ext=p.br*Math.exp(-h/8000)+p.bm*Math.exp(-h/1200);if(j>0)T*=Math.exp(-.5*(previous+ext)*step);const w=T*step*(j===0||j===n?.5:1);models.forEach((m,s)=>out[s]+=w*Math.exp(-h/[8000,1200][s])*altitudePchipValue(m,h));previous=ext;}return out;}

/** Independent knot-split exact-column reference for this same source function.
 * @param {any} field @param {number} n @returns {number[]} */
export function partialPchipExact(field,n){const models=partialPchipModels(field),out=[0,0],q=gauss(n);for(let i=1;i<field.altitudes.length;i++){const a=field.altitudes[i-1],span=field.altitudes[i]-a;for(let j=0;j<n;j++){const h=a+span*q.nodes[j],w=span*q.weights[j]*Math.exp(-radialTau(field.physical,h));models.forEach((m,s)=>out[s]+=w*Math.exp(-h/[8000,1200][s])*altitudePchipValue(m,h));}}return out;}

/** Replace only the split source's altitude sampler. Incoming/outgoing angular
 * data and phase kernels remain unchanged; the scalar physical-linear control
 * stays byte-identical. Cubic slopes are computed from this query's actual
 * direction samples, not copied from a different angular location.
 * @param {any} f @param {number[]} altitudes @param {number} n @returns {any} */
export function partialPchipKernel(f,altitudes,n){
 const packet=densitySegmentKernel(f,altitudes,n),start=packet.split.indexOf('float sampleJ(sampler2D field,'),end=packet.split.indexOf('float sampleLAtGround(',start);assert.ok(start>=0&&end>start);assert.ok(altitudes.length>=3);
 const source=`float pchipEndpoint(float a,float b,float u,float v){
 float slope=((2.0*a+b)*u-a*v)/(a+b);
 if(slope*u<=0.0)return 0.0;
 if(u*v<0.0&&abs(slope)>3.0*abs(u))slope=3.0*u;
 return slope;
}
float pchipRow(sampler2D field,int solarRow,vec3 direction,float height){
 float values[POSITION_COUNT];float delta[POSITION_COUNT-1];float span[POSITION_COUNT-1];float slope[POSITION_COUNT];
 for(int i=0;i<POSITION_COUNT;i++)values[i]=sampleJDirection(field,solarRow*POSITION_COUNT+i,direction);
 for(int i=0;i<POSITION_COUNT-1;i++){span[i]=altitudeForIndex(i+1)-altitudeForIndex(i);delta[i]=(values[i+1]-values[i])/span[i];}
 slope[0]=pchipEndpoint(span[0],span[1],delta[0],delta[1]);
 slope[POSITION_COUNT-1]=pchipEndpoint(span[POSITION_COUNT-2],span[POSITION_COUNT-3],delta[POSITION_COUNT-2],delta[POSITION_COUNT-3]);
 for(int i=1;i<POSITION_COUNT-1;i++){
  if(delta[i-1]*delta[i]<=0.0)slope[i]=0.0;
  else{float a=2.0*span[i]+span[i-1],b=span[i]+2.0*span[i-1];slope[i]=(a+b)/(a/delta[i-1]+b/delta[i]);}
 }
 if(height<=altitudeForIndex(0))return values[0];
 if(height>=altitudeForIndex(POSITION_COUNT-1))return values[POSITION_COUNT-1];
 int lo;int hi;float t;positionStencil(height,lo,hi,t);
 float a=1.0-t,b=span[lo];
 return (1.0+2.0*t)*a*a*values[lo]+t*t*(3.0-2.0*t)*values[hi]+t*a*a*b*slope[lo]+t*t*(t-1.0)*b*slope[hi];
}
float sampleJ(sampler2D field,vec3 point,vec3 worldDirection){
 float height=altitudeAtPoint(point);int z0;int z1;float fz;
 solarZenithStencil(sourceZenithDegreesAtPoint(point),z0,z1,fz);
 vec3 direction=outgoingLocalDirection(point,worldDirection);
 float a=pchipRow(field,z0,direction,height),b=pchipRow(field,z1,direction,height);
 return mix(a,b,fz);
}

`;
 return {...packet,split:packet.split.slice(0,start)+source+packet.split.slice(end),splitRepresentation:'Fixed species-density-normalized nonuniform shape-preserving altitude cubic; density restored once; unchanged scalar physical-linear control'};
}
