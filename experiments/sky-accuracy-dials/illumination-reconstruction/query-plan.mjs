import {curve} from '../phase-cells/geometry.mjs';
import {coordinates,phases} from './common.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';

/** Build geometry-only query preparation. Optical values and phase tables are
 * absent from the plan, so compatible wavelengths can share it. The explicit
 * fallback preserves the original interval implementation at support boundaries.
 * @param {any} f @returns {any} */
export function queryContext(f){
 const mesh=f.mesh,frame=mesh.frame,bases=['H100','sector'].map(name=>{const b=f.bases[name];return {...b,rings:b.rings.map(row=>({...row,sectors:row.sectors.map(s=>({...s,leftValue:curve(row.m,s.left,frame.a,mesh.horizon),rightValue:curve(row.m,s.right,frame.a,mesh.horizon)}))}))};});
 return {mesh,frame,bases};
}
/** @param {any[]} rows @param {number} x @param {string} key @returns {number} */
function search(rows,x,key){let lo=0,hi=rows.length-1;while(lo<hi){const j=(lo+hi)>>1;if(x<rows[j][key])hi=j;else lo=j+1;}return lo;}

/** Prepare pointer/coordinate information without reading illumination values.
 * Normalize each Hermite interval to[0,1] before float conversion, avoiding
 * cancellation between almost equal source-cosine knots near the Sun.
 * @param {any} context @param {number[]} d @returns {any} */
export function prepareQuery(context,d){
 const {mesh,frame,bases}=context,[m,phi]=coordinates(mesh,d),fallback=()=>({fallback:true,d}),kind=z=>(z>=mesh.horizon?1:0)+(z>=0?2:0),z=(mu,p)=>mu*frame.s[2]+Math.sqrt(Math.max(0,1-mu*mu))*(Math.cos(p)*frame.u[2]+Math.sin(p)*frame.v[2]),cls=kind(z(m,phi)),plans=[];
 if(Math.abs(d[2]-mesh.horizon)<1e-12||Math.abs(d[2])<1e-12)return fallback();
 for(const b of bases){
  const rings=b.rings;if(m<=rings[0].m||m>=rings.at(-1).m)return fallback();
  const hi=search(rings,m,'m'),lo=hi-1;if(Math.abs(m-rings[lo].m)<1e-12||Math.abs(m-rings[hi].m)<1e-12)return fallback();
  const queryRow=rings[search(rings,m,'hi')];let query=null;
  for(const s of queryRow.sectors){const l=curve(m,s.left,frame.a,mesh.horizon),r=curve(m,s.right,frame.a,mesh.horizon);if(phi<l-1e-12||phi>=r&&s!==queryRow.sectors.at(-1)||r<=l)continue;query={key:s.key,l,r};break;}
  if(!query)return fallback();
  const rowPlan=j=>{
   if(j<0||j>=rings.length)return null;const row=rings[j];let p=phi,selected=null;
   if(b.mode==='sector'){selected=row.sectors.find(s=>s.key===query.key);if(!selected)return null;p=selected.leftValue+(selected.rightValue-selected.leftValue)*(phi-query.l)/(query.r-query.l);}
   if(kind(z(row.m,p))!==cls)return null;
   let sector=selected;if(!sector)for(const s of row.sectors)if(p>=s.leftValue&&p<=s.rightValue){sector=s;break;}if(!sector)return null;
   const phis=sector.phis,ids=sector.indices;
   if(p<=phis[0])return {kind:1,indices:[-1,ids[0],-1,-1],t:0,x0:-1,x3:2};
   if(p>=phis.at(-1))return {kind:1,indices:[-1,ids.at(-1),-1,-1],t:0,x0:-1,x3:2};
   let a=0,c=phis.length-1;while(c-a>1){const k=(a+c)>>1;if(p<phis[k])c=k;else a=k;}
   const h=phis[a+1]-phis[a];
   return {kind:4,indices:[a-1,a,a+1,a+2].map(k=>k<0||k>=ids.length?-1:ids[k]),t:(p-phis[a])/h,x0:a>0?(phis[a-1]-phis[a])/h:-1,x3:a+2<phis.length?(phis[a+2]-phis[a])/h:2};
  };
  const js=[lo-1,lo,hi,hi+1],rows=js.map(rowPlan);if(!rows[1]||!rows[2])return fallback();
  const h=rings[hi].m-rings[lo].m;plans.push({t:(m-rings[lo].m)/h,x0:lo>0?(rings[lo-1].m-rings[lo].m)/h:-1,x3:hi+1<rings.length?(rings[hi+1].m-rings[lo].m)/h:2,rows});
 }
 return {fallback:false,d,bases:plans};
}

/** Point-valued normalized Hermite formula. @param {number} x0 @param {number} x3
 * @param {number} t @param {any[]} y @returns {number} */
export function normalizedCubic(x0,x3,t,y){
 const d=y[2]-y[1],harm=(a,b,ha,hb)=>{if(a*b<=0)return 0;const w1=2*hb+ha,w2=hb+2*ha;return (w1+w2)/(w1/a+w2/b);},a=y[0]===null?d:harm((y[1]-y[0])/(-x0),d,-x0,1),b=y[3]===null?d:harm(d,(y[3]-y[2])/(x3-1),1,x3-1);
 return Math.max(0,(1+2*t)*(1-t)**2*y[1]+t*t*(3-2*t)*y[2]+t*(1-t)**2*a+t*t*(t-1)*b);
}
/** Values for a prepared geometry plan. Factoring is N1-only; the raw mode is
 * reserved for separately qualified later-order fields. @param {any} f
 * @param {number[][]} nodes @param {boolean[]} [factored] @returns {any} */
export function plannedModel(f,nodes,factored=[true,true]){
 const amplitude=nodes.map((v,i)=>v.map((x,s)=>x/(factored[s]?f.sourcePhases[i][s]:1))),zero=nodes.map(()=>[0,0]);
 return {amplitude,evaluate(plan){
  if(plan.fallback)return polar2DModel(f,plan.d,nodes,zero,factored).values;
  const values=[0,0];
  for(const b of plan.bases){
   const rows=b.rows.map(row=>row===null?null:row.kind===1?amplitude[row.indices[1]]:[0,1].map(s=>normalizedCubic(row.x0,row.x3,row.t,row.indices.map(i=>i<0?null:amplitude[i][s]))));
   for(let s=0;s<2;s++)values[s]+=normalizedCubic(b.x0,b.x3,b.t,rows.map(v=>v===null?null:v[s]))/2;
  }
  const P=phases(f.px,plan.d);return values.map((x,s)=>x*(factored[s]?P[s]:1));
 }};
}
