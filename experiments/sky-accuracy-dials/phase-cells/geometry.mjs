import assert from 'node:assert/strict';
import {gauss} from '../continuation/direct-solver/math.mjs';
import {forward} from '../structured-incoming/rules.mjs';
import {dot} from '../numerics/math.js';

const tau=2*Math.PI;
/** Curved azimuth boundary: constant + ground/horizontal root coefficients.
 * @param {number} m @param {number[]} b @param {number} a @param {number} c @returns {number}
 */
export function curve(m,b,a,c){const den=Math.sqrt(Math.max(0,(1-a*a)*(1-m*m)));let v=b[0];if(b[1])v+=b[1]*Math.acos(Math.max(-1,Math.min(1,(c-a*m)/den)));if(b[2])v+=b[2]*Math.acos(Math.max(-1,Math.min(1,-a*m/den)));return v;}
/** Sector curves with the exact inherited construction bisectors.
 * @param {number} m @param {number} a @param {number} c @param {number} placement @returns {number[][]}
 */
function cuts(m,a,c,placement){const list=[[0,0,0],[tau,0,0]],den=Math.sqrt(Math.max(0,(1-a*a)*(1-m*m)));if(den>=1e-13)for(const [boundary,index] of [[c,1],[0,2]]){const q=(boundary-a*m)/den;if(q<=-1||q>=1)continue;const b=[0,0,0],d=[tau,0,0];b[index]=1;d[index]=-1;list.push(b,d);}list.sort((x,y)=>curve(m,x,a,c)-curve(m,y,a,c));const unique=list.filter((x,i)=>i===0||curve(m,x,a,c)-curve(m,list[i-1],a,c)>1e-12);return placement===1?unique.flatMap((x,i)=>i<unique.length-1?[x,x.map((v,j)=>(v+unique[i+1][j])/2)]:[x]):unique;}
/** Construct a real positive partition around the retained Bboth nodes.
 * @param {any} g @returns {any}
 */
export function cells(g){assert.equal(g.config.kind,'Bboth');const n=g.config.phi,a=g.frame.a,c=g.horizon,q=gauss(64),rows=[],list=[];for(let j=0;j<g.rings.length;j++){
 const ring=g.rings[j],lo=j===0||g.rings[j-1].polarPanel!==ring.polarPanel?forward(g.polarBreaks[ring.polarPanel],g.k):(g.rings[j-1].m+ring.m)/2,hi=j===g.rings.length-1||g.rings[j+1].polarPanel!==ring.polarPanel?forward(g.polarBreaks[ring.polarPanel+1],g.k):(ring.m+g.rings[j+1].m)/2;assert.ok(lo<ring.m&&ring.m<hi);const bounds=cuts(ring.m,a,c,g.placement);assert.equal(bounds.length,ring.breaks.length);for(let k=0;k<bounds.length;k++)assert.ok(Math.abs(curve(ring.m,bounds[k],a,c)-ring.breaks[k])<1e-11);const phis=Array.from({length:n},(_,k)=>{const d=g.nodes[j*n+k];let p=Math.atan2(dot(d,g.frame.v),dot(d,g.frame.u));if(p<0)p+=tau;return p;});const sectors=[];
 for(let s=0;s<bounds.length-1;s++){const left=bounds[s],right=bounds[s+1],l=curve(ring.m,left,a,c),h=curve(ring.m,right,a,c),indices=phis.map((p,k)=>({p,k})).filter(x=>x.p>l-1e-12&&x.p<h+1e-12);assert.ok(indices.length>=2);const t=indices.map(x=>(x.p-l)/(h-l)),edges=[0,...t.slice(1).map((v,k)=>(v+t[k])/2),1];assert.ok(t.every((v,k)=>v>edges[k]&&v<edges[k+1]));const spanIntegral=(hi-lo)*q.nodes.reduce((v,x,k)=>{const m=lo+(hi-lo)*x;return v+q.weights[k]*(curve(m,right,a,c)-curve(m,left,a,c));},0),sector={left,right,edges,indices:indices.map(x=>j*n+x.k)};sectors.push(sector);
  for(let k=0;k<t.length;k++){const id=j*n+indices[k].k,area=spanIntegral*(edges[k+1]-edges[k]);assert.ok(area>0&&Number.isFinite(area));list.push({id,ring:j,sector:s,lo,hi,tlo:edges[k],thi:edges[k+1],left,right,area,node:g.nodes[id]});}
 }rows.push({lo,hi,m:ring.m,sectors});}
 list.sort((x,y)=>x.id-y.id);assert.equal(list.length,g.count);assert.ok(list.every((x,i)=>x.id===i));return {schema:'phase-cell-geometry-v1',count:g.count,frame:g.frame,horizon:c,config:g.config,placement:g.placement,rows,list};}
/** Physical source-frame point from a cell's normalized coordinates.
 * @param {any} mesh @param {any} cell @param {number} x @param {number} t @returns {number[]}
 */
export function point(mesh,cell,x,t){const m=cell.lo+(cell.hi-cell.lo)*x,l=curve(m,cell.left,mesh.frame.a,mesh.horizon),r=curve(m,cell.right,mesh.frame.a,mesh.horizon),phi=l+(r-l)*(cell.tlo+(cell.thi-cell.tlo)*t),radius=Math.sqrt(Math.max(0,1-m*m));return mesh.frame.s.map((v,k)=>m*v+radius*(Math.cos(phi)*mesh.frame.u[k]+Math.sin(phi)*mesh.frame.v[k]));}
/** Independent membership implementation: project a physical vector then test saved strip/sector bounds.
 * @param {any} mesh @param {number[]} direction @returns {number}
 */
export function locate(mesh,direction){const m=dot(direction,mesh.frame.s);let lo=0,hi=mesh.rows.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(m<mesh.rows[mid].hi)hi=mid;else lo=mid+1;}const row=mesh.rows[lo];let phi=Math.atan2(dot(direction,mesh.frame.v),dot(direction,mesh.frame.u));if(phi<0)phi+=tau;for(const sector of row.sectors){const left=curve(m,sector.left,mesh.frame.a,mesh.horizon),right=curve(m,sector.right,mesh.frame.a,mesh.horizon);if(phi<left-1e-12||phi>=right&&sector!==row.sectors.at(-1))continue;if(right<=left)continue;const t=Math.max(0,Math.min(1,(phi-left)/(right-left)));let a=0,b=sector.indices.length-1;while(a<b){const mid=(a+b)>>1;if(t<sector.edges[mid+1])b=mid;else a=mid+1;}return sector.indices[a];}throw Error('Uncovered physical direction');}
/** Independent physical coverage/cap checks; no radiance or fitted weights.
 * @param {any} mesh @returns {any}
 */
export function geometryProof(mesh){let area=0,ground=0,horizontal=0,containment=0;for(const cell of mesh.list){area+=cell.area;if(cell.node[2]>=mesh.horizon)ground+=cell.area;if(cell.node[2]>=0)horizontal+=cell.area;assert.equal(locate(mesh,cell.node),cell.id);for(const x of [.1,.5,.9])for(const t of [.1,.5,.9]){const d=point(mesh,cell,x,t);assert.equal(locate(mesh,d),cell.id);for(const boundary of [mesh.horizon,0])if(Math.abs(d[2]-boundary)>1e-10&&Math.abs(cell.node[2]-boundary)>1e-10)assert.equal(d[2]>=boundary,cell.node[2]>=boundary);containment++;}}
 const areaError=area/(4*Math.PI)-1,groundError=ground/(tau*(1-mesh.horizon))-1,horizontalError=horizontal/tau-1;assert.ok(Math.abs(areaError)<1e-10&&Math.abs(groundError)<1e-6&&Math.abs(horizontalError)<1e-6);return {cells:mesh.count,area,areaError,groundError,horizontalError,containment,minimumArea:Math.min(...mesh.list.map(c=>c.area)),maximumArea:Math.max(...mesh.list.map(c=>c.area))};}
