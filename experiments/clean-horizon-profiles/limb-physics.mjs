import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checked} from './io.mjs';
import {interpolate} from './profile-sampling.mjs';

export const transmissionRgb=t=>[t.slice(8,15),t.slice(4,9),t.slice(0,5)].map(a=>a.reduce((s,v)=>s+v,0)/a.length);

/** Independent binary64 ray and exact slant lengths through the exported shells. */
export function groundTransmission(profile,casePrefix,height,elevationDegrees){
 const R=6360000,r=R+height,b=r*Math.sin(elevationDegrees*Math.PI/180),c=height*(2*R+height),D=b*b-c;if(!(b<0&&D>=0))return{ground:false,distance:0,transmittance:null};
 const distance=c/(-b+Math.sqrt(D)),parse=name=>readFileSync(checked(casePrefix+'/'+name),'utf8').trim().split(/\r?\n/u).map(l=>l.trim().split(/\s+/u).map(Number)),species=parse('species.txt'),sca=parse('scattering.txt'),abs=parse('absorption.txt'),z=sca[0].map(v=>v*1000);
 assert.equal(z.length,species.length);species.forEach((s,i)=>assert.ok(Math.abs(s[0]*1000-z[i])<1e-7));const shellT=h=>{const constant=(height-h)*(2*R+height+h);return constant/(-b+Math.sqrt(Math.max(0,b*b-constant)));};
 const tau=Array(15).fill(0);let shapeColumn=0;
 for(let i=0;i<z.length-1;i++){const upper=Math.min(height,z[i]),lower=Math.max(0,z[i+1]);if(upper<=lower)continue;const length=shellT(lower)-shellT(upper),thickness=z[i]-z[i+1];assert.ok(length>=0);shapeColumn+=species[i+1][1]*length;for(let channel=0;channel<15;channel++)tau[channel]+=length*(sca[channel+1][i+1]+abs[channel+1][i+1])/thickness;}
 for(let channel=0;channel<15;channel++)tau[channel]+=profile.mie[channel]*shapeColumn;
 function continuous(count){let molecular=0,aerosol=0;for(let i=0;i<count;i++){const t=distance*(i+.5)/count,difference=2*b*t+t*t,h=Math.max(0,height+difference/(Math.sqrt(r*r+difference)+r));molecular+=Math.exp(-h/8000)*distance/count;aerosol+=interpolate(profile.altitudesMeters,profile.extinction550PerMeter,h)/profile.extinction550PerMeter[0]*distance/count;}const rayleigh=sca.slice(1).map((row,ch)=>{let sum=0;for(let i=0;i<z.length-1;i++)sum+=row[i+1];return sum/(8000*-Math.expm1(-60000/8000));});return rayleigh.map((k,ch)=>Math.exp(-k*molecular-profile.mie[ch]*aerosol));}
 const coarse=continuous(16384),fine=continuous(32768),transmittance=tau.map(v=>Math.exp(-v));return{ground:true,distance,tau,transmittance,continuousTransmittance:fine,continuousConvergenceAbsolute:Math.max(...coarse.map((v,i)=>Math.abs(v-fine[i]))),exportedVsContinuousAbsolute:Math.max(...transmittance.map((v,i)=>Math.abs(v-fine[i]))),method:'Exact binary64 slant shell lengths times exported molecular/absorption layer coefficients and lower-row aerosol density (the installed reader shifts i+1 into layer i). Independent continuous-profile midpoint refinement measures continuous integration convergence and the export/continuous discrepancy.'};
}
