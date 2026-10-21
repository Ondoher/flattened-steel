import {curve} from '../phase-cells/geometry.mjs';
import {direction} from './common.mjs';

/** Prepare the same query pointers for many azimuths at one exact latitude.
 * Ring brackets, physical curves and sector matches are shared. No light or
 * optical input participates; uncommon support cases retain the original CPU
 * fallback. @param {any} f @param {any} context @param {number} mu
 * @returns {(phi:number)=>any} */
export function ringQueries(f,context,mu){
 const {mesh,frame,bases}=context,kind=z=>(z>=mesh.horizon?1:0)+(z>=0?2:0),z=(m,p)=>m*frame.s[2]+Math.sqrt(Math.max(0,1-m*m))*(Math.cos(p)*frame.u[2]+Math.sin(p)*frame.v[2]);
 const search=(rows,key)=>{let lo=0,hi=rows.length-1;while(lo<hi){const j=(lo+hi)>>1;if(mu<rows[j][key])hi=j;else lo=j+1;}return lo;};
 const setups=[];let allFallback=false;
 for(const basis of bases){
  const rings=basis.rings;if(mu<=rings[0].m||mu>=rings.at(-1).m){allFallback=true;break;}
  const hi=search(rings,'m'),lo=hi-1;if(Math.abs(mu-rings[lo].m)<1e-12||Math.abs(mu-rings[hi].m)<1e-12){allFallback=true;break;}
  const h=rings[hi].m-rings[lo].m,query=rings[search(rings,'hi')],sectors=query.sectors.map(s=>{
   const l=curve(mu,s.left,frame.a,mesh.horizon),r=curve(mu,s.right,frame.a,mesh.horizon),rows=[lo-1,lo,hi,hi+1].map(j=>{
    if(j<0||j>=rings.length)return null;const row=rings[j],selected=basis.mode==='sector'?row.sectors.find(x=>x.key===s.key):null;
    return {row,selected,missing:basis.mode==='sector'&&!selected};
   });return {l,r,rows};
  });
  setups.push({t:(mu-rings[lo].m)/h,x0:lo>0?(rings[lo-1].m-rings[lo].m)/h:-1,x3:hi+1<rings.length?(rings[hi+1].m-rings[lo].m)/h:2,sectors});
 }
 return phi=>{
  const d=direction(f,mu,phi),fallback=()=>({fallback:true,d});if(allFallback||Math.abs(d[2]-mesh.horizon)<1e-12||Math.abs(d[2])<1e-12)return fallback();
  const cls=kind(z(mu,phi)),plans=[];
  for(const setup of setups){
   const query=setup.sectors.find((s,i)=>phi>=s.l-1e-12&&(phi<s.r||i===setup.sectors.length-1)&&s.r>s.l);if(!query)return fallback();
   const rows=query.rows.map(v=>{
    if(!v||v.missing)return null;const {row,selected}=v,p=selected?selected.leftValue+(selected.rightValue-selected.leftValue)*(phi-query.l)/(query.r-query.l):phi;
    if(kind(z(row.m,p))!==cls)return null;
    const sector=selected??row.sectors.find(s=>p>=s.leftValue&&p<=s.rightValue);if(!sector)return null;const phis=sector.phis,ids=sector.indices;
    if(p<=phis[0])return {kind:1,indices:[-1,ids[0],-1,-1],t:0,x0:-1,x3:2};
    if(p>=phis.at(-1))return {kind:1,indices:[-1,ids.at(-1),-1,-1],t:0,x0:-1,x3:2};
    let a=0,c=phis.length-1;while(c-a>1){const k=(a+c)>>1;if(p<phis[k])c=k;else a=k;}
    const h=phis[a+1]-phis[a];return {kind:4,indices:[a-1,a,a+1,a+2].map(k=>k<0||k>=ids.length?-1:ids[k]),t:(p-phis[a])/h,x0:a>0?(phis[a-1]-phis[a])/h:-1,x3:a+2<phis.length?(phis[a+2]-phis[a])/h:2};
   });
   if(!rows[1]||!rows[2])return fallback();plans.push({t:setup.t,x0:setup.x0,x3:setup.x3,rows});
  }
  return {fallback:false,d,bases:plans};
 };
}
