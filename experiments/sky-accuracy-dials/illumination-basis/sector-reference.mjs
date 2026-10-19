import {reconstruction} from '../phase-cells/reconstruction.mjs';
import {curve} from '../phase-cells/geometry.mjs';
/** Direct independent row evaluator for the sector-coordinate model.
 * Uses unchanged H100 azimuth evaluation and the oracle's independent physical
 * membership index, never candidate stencil coefficients or integrated weights.
 * @param {any} mesh @param {number[][]} incidents
 * @returns {(m:number,x:number,y:number,index:number)=>number}
 */
export function sectorReference(mesh,incidents){
 const azimuth=reconstruction(mesh,incidents,'azimuth'),signature=s=>JSON.stringify([s.left,s.right]),keys=mesh.rows.map(row=>new Map(row.sectors.map(s=>[signature(s),s]))),kind=z=>(z>=mesh.horizon?1:0)+(z>=0?2:0),value=i=>incidents[i][0]+incidents[i][1];
 return (m,x,y,index)=>{let phi=Math.atan2(y,x);if(phi<0)phi+=2*Math.PI;const cell=mesh.list[index],key=signature(cell),left=curve(m,cell.left,mesh.frame.a,mesh.horizon),right=curve(m,cell.right,mesh.frame.a,mesh.horizon),t=(phi-left)/(right-left),cls=kind(m*mesh.frame.s[2]+x*mesh.frame.u[2]+y*mesh.frame.v[2]);
 const rowValue=j=>{const s=keys[j].get(key);if(!s)return null;const mu=mesh.rows[j].m,l=curve(mu,s.left,mesh.frame.a,mesh.horizon),h=curve(mu,s.right,mesh.frame.a,mesh.horizon),p=l+(h-l)*t,rad=Math.sqrt(1-mu*mu),xx=rad*Math.cos(p),yy=rad*Math.sin(p);if(kind(mu*mesh.frame.s[2]+xx*mesh.frame.u[2]+yy*mesh.frame.v[2])!==cls)return null;return azimuth(mu,xx,yy,s.indices[0]);};
 let lo=0,hi=mesh.rows.length-1;if(m<=mesh.rows[0].m)return rowValue(0)??value(index);if(m>=mesh.rows[hi].m)return rowValue(hi)??value(index);while(hi-lo>1){const j=(lo+hi)>>1;if(m<mesh.rows[j].m)hi=j;else lo=j;}const a=rowValue(lo),b=rowValue(hi);if(a===null)return b??value(index);if(b===null)return a;const blend=(m-mesh.rows[lo].m)/(mesh.rows[hi].m-mesh.rows[lo].m);return a*(1-blend)+b*blend;};
}
