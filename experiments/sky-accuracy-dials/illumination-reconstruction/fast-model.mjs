import {curve} from '../phase-cells/geometry.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';
import {miePhase,rayleighPhase} from './common.mjs';

/** Same point-valued positive Hermite formula; interval evaluation remains in
 * the preserved model. @param {number[]} x @param {any[]} y @param {number} m */
function cubic(x,y,m){
 const h=x[2]-x[1],d=(y[2]-y[1])/h,harm=(a,b,ha,hb)=>{if(a*b<=0)return 0;const w1=2*hb+ha,w2=hb+2*ha;return (w1+w2)/(w1/a+w2/b);},a=y[0]===null?d:harm((y[1]-y[0])/(x[1]-x[0]),d,x[1]-x[0],h),b=y[3]===null?d:harm(d,(y[3]-y[2])/(x[3]-x[2]),h,x[3]-x[2]),t=(m-x[1])/h;
 return Math.max(0,(1+2*t)*(1-t)**2*y[1]+t*t*(3-2*t)*y[2]+t*(1-t)**2*h*a+t*t*(t-1)*h*b);
}

/** Specialize unchanged two-axis interpolation for repeated mean-only numerical
 * integration. Precompute phase-free nodal values and fixed ring bounds. Boundary
 * and fallback cases use the original implementation. No physics, coefficients,
 * support, nodal data or threshold changes. @param {any} f @param {number[][]} nodes
 * @returns {(d:number[])=>number[]} */
export function fastModel(f,nodes){
 const amplitude=nodes.map((v,i)=>[v[0]/f.sourcePhases[i][0],v[1]/f.sourcePhases[i][1]]),zero=nodes.map(()=>[0,0]),mesh=f.mesh,frame=mesh.frame,tau=2*Math.PI,kind=z=>(z>=mesh.horizon?1:0)+(z>=0?2:0),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],z=(m,p)=>m*frame.s[2]+Math.sqrt(Math.max(0,1-m*m))*(Math.cos(p)*frame.u[2]+Math.sin(p)*frame.v[2]),bases=['H100','sector'].map(name=>{const b=f.bases[name];return {...b,rings:b.rings.map(row=>({...row,sectors:row.sectors.map(s=>({...s,leftValue:curve(row.m,s.left,frame.a,mesh.horizon),rightValue:curve(row.m,s.right,frame.a,mesh.horizon)}))}))};});
 const search=(rings,m,key)=>{let lo=0,hi=rings.length-1;while(lo<hi){const j=(lo+hi)>>1;if(m<rings[j][key])hi=j;else lo=j+1;}return lo;};
 return d=>{
  const m=Math.max(-1,Math.min(1,dot(d,frame.s)));let phi=Math.atan2(dot(d,frame.v),dot(d,frame.u));if(phi<0)phi+=tau;
  const fallback=()=>polar2DModel(f,d,nodes,zero).values;
  if(Math.abs(d[2]-mesh.horizon)<1e-12||Math.abs(d[2])<1e-12)return fallback();
  const cls=kind(z(m,phi)),total=[0,0];
  for(const b of bases){
   const rings=b.rings;if(m<=rings[0].m||m>=rings.at(-1).m)return fallback();const hi=search(rings,m,'m'),lo=hi-1;if(Math.abs(m-rings[lo].m)<1e-12||Math.abs(m-rings[hi].m)<1e-12)return fallback();
   const queryRow=rings[search(rings,m,'hi')];let query=null;
   for(const s of queryRow.sectors){const l=curve(m,s.left,frame.a,mesh.horizon),r=curve(m,s.right,frame.a,mesh.horizon);if(phi<l-1e-12||phi>=r&&s!==queryRow.sectors.at(-1)||r<=l)continue;query={key:s.key,l,r};break;}
   if(!query)return fallback();
   const ringValue=j=>{
    if(j<0||j>=rings.length)return null;const row=rings[j];let p=phi,selected=null;
    if(b.mode==='sector'){selected=row.sectors.find(s=>s.key===query.key);if(!selected)return null;p=selected.leftValue+(selected.rightValue-selected.leftValue)*(phi-query.l)/(query.r-query.l);}
    if(kind(z(row.m,p))!==cls)return null;
    let sector=selected;if(!sector)for(const s of row.sectors)if(p>=s.leftValue&&p<=s.rightValue){sector=s;break;}if(!sector)return null;
    const phis=sector.phis,ids=sector.indices;if(p<=phis[0])return amplitude[ids[0]];if(p>=phis.at(-1))return amplitude[ids.at(-1)];
    let a=0,c=phis.length-1;while(c-a>1){const k=(a+c)>>1;if(p<phis[k])c=k;else a=k;}
    const js=[a-1,a,a+1,a+2],X=js.map(k=>k<0?phis[a]-1:k>=phis.length?phis[a+1]+1:phis[k]);
    return [0,1].map(s=>cubic(X,js.map(k=>k<0||k>=ids.length?null:amplitude[ids[k]][s]),p));
   };
   const js=[lo-1,lo,hi,hi+1],Y=js.map(ringValue);if(!Y[1]||!Y[2])return fallback();const X=js.map(j=>j<0?rings[lo].m-1:j>=rings.length?rings[hi].m+1:rings[j].m);
   for(let s=0;s<2;s++)total[s]+=cubic(X,Y.map(v=>v===null?null:v[s]),m)/2;
  }
  const source=dot(d,f.px.sun);return [total[0]*rayleighPhase(source),total[1]*miePhase(f.px.table,source)];
 };
}
