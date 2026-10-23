import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {read,identity,checked} from './io.mjs';
import {unit,boundary,direct} from './reference.mjs';
import {color} from './color.mjs';
import {NATIVE_15_SPECTRAL_BASIS as basis} from '../../src/algorithm32/profiles/native-15/native-15-profile.js';

export const first='tmp/experiments/sky-aerosol-properties/runs/00001-property-refine';
export const centers=basis.channels.map(c=>c.center.value);
export const widths=basis.channels.map(c=>c.width.value);
export const baseline=JSON.parse(read(first+'/noon-combo025.json').toString());
/** Authenticate terminal artifact bytes without requiring unchanged historical source. @param {string} root */
export function authenticate(root){const m=JSON.parse(read(root+'/manifest.json').toString());assert.equal(m.state,'accepted');for(const a of m.artifacts)assert.deepEqual(identity(a.path),a);return identity(root+'/manifest.json');}
/** Relevant local sources and immutable scientific inputs. */
export function parents(){return [authenticate(first),authenticate('tmp/experiments/sky-aerosol-properties/runs/00002-verify-report'),authenticate('tmp/experiments/sky-aerosol-properties/runs/00003-visual-report'),...readdirSync(checked('experiments/sky-aerosol-properties')).filter(n=>/\.(mjs|js|json|ts)$/.test(n)).map(n=>identity('experiments/sky-aerosol-properties/'+n))];}
/** Unit physical elevation and Sun-relative heading. @param {number} e @param {number} a */
export function direction(e,a=0){e*=Math.PI/180;a*=Math.PI/180;return [Math.sin(a)*Math.cos(e),-Math.cos(a)*Math.cos(e),Math.sin(e)];}
/** Fixed-column coefficient projection uses midpoint samples, matching the authenticated parent. @param {number} h @param {number} alpha @param {number} loading @param {number} ssa */
export function medium(h=1200,alpha=.8,loading=.25,ssa=.95){
 const tau550=.01*Math.pow(.55,-.8)*-Math.expm1(-60000/1200);
 const mie=centers.map(w=>tau550*(loading/.25)/h/-Math.expm1(-60000/h)*Math.pow(w/550,-alpha));
 return {...baseline.medium,mieHeight:h,albedo:ssa,mie};
}
assert.ok(Math.max(...medium().mie.map((x,i)=>Math.abs(x/baseline.medium.mie[i]-1)))<1e-14,'Projection must reproduce baseline');
/** Frozen main rays plus actual tangent-plane halo holdouts. @param {AerosolMedium} m */
export function queries(m){
 const e=Math.asin(m.sourceDirection[2])*180/Math.PI, rays=[];
 for(const a of [0,90,180])for(const v of [.05,1,3,10,20])rays.push({id:`h${a}-e${v}`,direction:direction(v,a),heldOut:false});
 for(const o of [.5,1,2,5,10])rays.push({id:'sun-'+o,direction:direction(e+o),heldOut:false});
 const s=m.sourceDirection,up=unit([0,0,1].map((v,i)=>v-s[2]*s[i])),left=[1,0,0];
 for(const o of [1,5])for(const {name,t} of [{name:'left',t:left},{name:'right',t:left.map(v=>-v)},{name:'down',t:up.map(v=>-v)}]){
  const a=o*Math.PI/180;rays.push({id:`hold-${name}-${o}`,direction:unit(s.map((v,i)=>v*Math.cos(a)+t[i]*Math.sin(a))),heldOut:true});
 }
 return rays.map(r=>({...r,ground:boundary(m,[0,0,m.radius+m.observerHeight],r.direction).ground}));
}
/** Qualified direct N1 reference for one medium. @param {AerosolMedium} m @param {(s:string)=>void} progress */
export async function measure(m,progress){
 const origin=[0,0,m.radius+m.observerHeight],rays=[];
 for(const q of queries(m)){
  if(q.ground){rays.push({...q,spectrum:null,molecular:null,aerosol:null,color:null,refinement:null});continue;}
  progress(q.id);const end=boundary(m,origin,q.direction).distance;
  const groups=centers.map((_,channel)=>({id:q.id,medium:m,origin,direction:q.direction,end,channel}));
  const coarse=groups.map(g=>direct(g,64)),fine=groups.map(g=>direct(g,128));
  const residual=Math.sqrt(fine.reduce((s,x,c)=>s+widths[c]*(x.total-coarse[c].total)**2,0)/fine.reduce((s,x,c)=>s+widths[c]*x.total**2,0));
  assert.ok(residual<=.002);const spectrum=fine.map(x=>x.total);
  rays.push({...q,spectrum,molecular:fine.map(x=>x.species[0]),aerosol:fine.map(x=>x.species[1]),color:color(spectrum),refinement:residual});
  await new Promise(r=>setImmediate(r));
 }
 return {medium:m,rays,metrics:metrics(rays)};
}
/** Physical quantities, no exposure normalization. @param {any[]} rays */
export function metrics(rays){
 const Y=id=>rays.find(r=>r.id===id).color.Y;
 const near=(Y('sun-0.5')+Y('sun-1')+Y('sun-2'))/3,far=(Y('sun-5')+Y('sun-10'))/2;
 const c=rays.find(r=>r.id==='h180-e0.05').color,[X,y,Z]=c.xyz,d=X+15*y+3*Z;
 return {horizonY:c.Y,xy:c.xy,uv:[4*X/d,9*y/d],nearY:near,glow:near/far,horizonOver3:Y('h180-e0.05')/Y('h180-e3'),horizonOver10:Y('h180-e0.05')/Y('h180-e10')};
}
