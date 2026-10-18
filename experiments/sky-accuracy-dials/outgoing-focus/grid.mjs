import {warp} from './geometry.mjs';

/** Show actual same-count node placement in a Sun-centered angular neighborhood.
 * @param {any} request @param {number} k @returns {string}
 */
export function gridFigure(request,k){
 const angle=45.5*Math.PI/180,sun=[Math.sin(angle),0,Math.cos(angle)],u=[Math.cos(angle),0,-Math.sin(angle)],v=[0,1,0],seen=new Set(),nodes=request.transportSpec.domains.outgoing.unitVectors.filter(d=>{const key=d.map(Math.fround).join(',');if(seen.has(key))return false;seen.add(key);return true;});
 let svg='<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="520"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif"><text x="20" y="30" font-size="21">Same outgoing slots: denser node placement around the Sun</text><text x="20" y="55" font-size="13">Solar cache row45 (45.5 degrees zenith). Angular distance from Sun; duplicated seams removed for display.</text>';
 [1,k].forEach((factor,panel)=>{const x=250+panel*490,y=265,scale=5.3;let n10=0,n30=0;for(const d of nodes){const w=warp(d,sun,factor),cos=w.reduce((s,a,i)=>s+a*sun[i],0),theta=Math.acos(Math.max(-1,Math.min(1,cos)))*180/Math.PI;if(theta<=10)n10++;if(theta>30)continue;n30++;const az=Math.atan2(w.reduce((s,a,i)=>s+a*v[i],0),w.reduce((s,a,i)=>s+a*u[i],0));svg+=`<circle cx="${x+scale*theta*Math.cos(az)}" cy="${y-scale*theta*Math.sin(az)}" r="1.7" fill="${panel?'#e37a2f':'#3e78b4'}"/>`;}
 for(const r of [10,20,30])svg+=`<circle cx="${x}" cy="${y}" r="${r*scale}" fill="none" stroke="#bbb"/><text x="${x+r*scale+3}" y="${y-3}" font-size="11">${r}deg</text>`;svg+=`<path d="M${x-5} ${y}H${x+5}M${x} ${y-5}V${y+5}" stroke="#111"/><text x="${x-100}" y="92" font-size="16">${panel?'Sun-focused k='+factor:'Original W27'}</text><text x="${x-150}" y="465" font-size="13">${n10} unique nodes within10deg; ${n30} within30deg</text>`;
 });return svg+'</g></svg>';
}
