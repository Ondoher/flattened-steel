import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import puppeteer from 'puppeteer';
import {createRun,verifyRun,identity,readRepository,checkedAbsolute} from '../io/files.mjs';
import {executeGpu} from '../horizon-reference/gpu.mjs';
import {gauss} from '../continuation/direct-solver/math.mjs';
import {phase,illumination} from '../horizon-reference/math.mjs';
import {aerosolPhase} from '../horizon/aerosol-optics.mjs';
import {halfWidth} from './libradtran.mjs';
import {kernel} from './toronto-orders.mjs';
import {inputs,runRoot} from './attribution-common.mjs';

/** Canonical receiver-local direction to physical sphere coordinates.
 * @param {readonly number[]} local @param {readonly number[]} point @returns {number[]}
 */
function world(local,point){const r=Math.hypot(...point),s=point[0]/r,c=point[2]/r;return [local[0]*-c+local[2]*s,-local[1],local[0]*s+local[2]*c];}
/** Rotate a cosine/azimuth pair about the outgoing physical direction.
 * @param {number} mu @param {number} phi @param {readonly number[]} n @returns {number[]}
 */
function rotate(mu,phi,n){const h=Math.abs(n[2])<.9?[0,0,1]:[1,0,0],v=[h[1]*n[2]-h[2]*n[1],h[2]*n[0]-h[0]*n[2],h[0]*n[1]-h[1]*n[0]],r=Math.hypot(...v),a=v.map(x=>x/r),b=[n[1]*a[2]-n[2]*a[1],n[2]*a[0]-n[0]*a[2],n[0]*a[1]-n[1]*a[0]];return n.map((x,i)=>mu*x+Math.sqrt(Math.max(0,1-mu*mu))*(Math.cos(phi)*a[i]+Math.sin(phi)*b[i]));}
/** Analytic inverse of a normalized piecewise-linear cosine PDF.
 * @param {HorizonAerosolPhaseTable} table @param {number} u @returns {number} Physical cosine.
 */
function inverse(table,u){let mass=0;for(let i=0;i<table.mu.length-1;i++){const d=table.mu[i+1]-table.mu[i],a=d*(table.pdf[i]+table.pdf[i+1])/2;if(u<=mass+a||i===table.mu.length-2){const slope=(table.pdf[i+1]-table.pdf[i])/d,area=Math.max(0,u-mass);return table.mu[i]+2*area/(table.pdf[i]+Math.sqrt(Math.max(0,table.pdf[i]**2+2*slope*area)));}mass+=a;}throw new Error('CDF range');}
/** Exact Rayleigh cosine-CDF inverse by monotone Newton iterations.
 * @param {number} u @returns {number} Cosine in [-1,1].
 */
function inverseRayleigh(u){let x=2*u-1;for(let i=0;i<12;i++)x-=(.5+.375*x+.125*x*x*x-u)/(.375*(1+x*x));return Math.max(-1,Math.min(1,x));}

/** Independent binary64 direct integral for exact surface-tangent qualification.
 * @param {HorizonReferenceMedium} m @param {AttributionPoint} target @param {number[]} v
 * @param {number} channel @param {HorizonAerosolMaterial} material @param {number} count
 * @returns {number[]} Rayleigh/Mie L1, with physical zero initial radial cosine.
 */
function tangentCpu(m,target,v,channel,material,count){
 assert.equal(target.altitude,0);const q=gauss(count),optical=gauss(128),r=m.radius,end=Math.sqrt(m.topAltitude*(2*r+m.topAltitude));
 const beta=m.rayleigh[channel],mie=m.mie[channel],ssa=material.albedos[channel],table=material.phaseTables[channel],pr=phase(v[2],.7)[0],pm=table?aerosolPhase(table,v[2]):phase(v[2],.7)[1];
 /** @param {number} h @param {number} mu @param {number} length @returns {number} True radial shell column. */
 function tau(h,mu,length){const radius=r+h;let sum=0;for(let j=0;j<128;j++){const s=length*optical.nodes[j],difference=2*radius*mu*s+s*s,altitude=Math.max(0,h+difference/(Math.sqrt(radius*radius+difference)+radius));sum+=optical.weights[j]*(beta*Math.exp(-altitude/8000)+mie*Math.exp(-altitude/1200));}return sum*length;}
 const result=[0,0],logEnd=Math.log1p(end/1000);
 for(let i=0;i<count;i++){const t=1000*Math.expm1(q.nodes[i]*logEnd),h=t*t/(Math.sqrt(r*r+t*t)+r),radius=r+h,b=target.point[2]+v[2]*t,ct=(h-m.topAltitude)*(2*r+h+m.topAltitude),sourceEnd=-ct/(b+Math.sqrt(b*b-ct)),T=Math.exp(-tau(0,0,t)-tau(h,b/radius,sourceEnd)),measure=q.weights[i]*(t+1000)*logEnd*m.sourceIrradiance[channel]*T;result[0]+=measure*beta*Math.exp(-h/8000)*pr;result[1]+=measure*mie*ssa*Math.exp(-h/1200)*pm;}
 return result;
}

/** Self-contained hardware L1 evaluator at arbitrary incoming directions; no production cache/code.
 * @param {string} shader @param {{directions:number[][],origin:number[],altitude:number,medium:HorizonReferenceMedium,channel:number,view:number}} request
 * @returns {Promise<{renderer:string,values:number[][]}>} Deterministic continuous direct L1 estimates per direction.
 */
export async function angularGpu(shader,request){
 const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2',{powerPreference:'high-performance',antialias:false});if(!gl||!gl.getExtension('EXT_color_buffer_float'))throw new Error('Float GPU required');const debug=gl.getExtension('WEBGL_debug_renderer_info'),renderer=String(gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER));if(/software|swiftshader|llvmpipe/i.test(renderer))throw new Error('Hardware required');
 const p=gl.createProgram(),shaders=[],textures=[],frame=gl.createFramebuffer();
 try{
  for(const [kind,text] of [[gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}'],[gl.FRAGMENT_SHADER,shader]]){const s=gl.createShader(Number(kind));shaders.push(s);gl.shaderSource(s,String(text));gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));gl.useProgram(p);
  const count=request.directions.length,height=Math.ceil(count/256),data=new Float32Array(256*height*4);request.directions.forEach((v,i)=>{let mu=v.reduce((s,x,k)=>s+x*request.origin[k],0)/Math.hypot(...request.origin);if(Math.abs(mu)<1e-12)mu=0;data.set([...v,mu],4*i);});
  const input=gl.createTexture();textures.push(input);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,input);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,256,height,0,gl.RGBA,gl.FLOAT,data);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.uniform1i(gl.getUniformLocation(p,'queries'),0);
  const out=gl.createTexture();textures.push(out);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,out);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,256,height,0,gl.RGBA,gl.FLOAT,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,out,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Incomplete reference framebuffer');
  const m=request.medium,c=request.channel;gl.uniform3fv(gl.getUniformLocation(p,'origin'),request.origin);gl.uniform1f(gl.getUniformLocation(p,'initialAltitude'),request.altitude);gl.uniform3fv(gl.getUniformLocation(p,'sunDirection'),m.sourceDirection);gl.uniform3fv(gl.getUniformLocation(p,'sunPosition'),m.sourcePosition);gl.uniform4fv(gl.getUniformLocation(p,'physical'),[m.rayleigh[c],m.mie[c],m.sourceIrradiance[c],0]);gl.uniform1f(gl.getUniformLocation(p,'sourceScale'),1);gl.uniform1f(gl.getUniformLocation(p,'referenceDistance'),m.referenceDistance);gl.uniform1i(gl.getUniformLocation(p,'flatGeometry'),0);gl.uniform1i(gl.getUniformLocation(p,'finiteSource'),0);gl.uniform1i(gl.getUniformLocation(p,'quadrature'),128);gl.uniform1i(gl.getUniformLocation(p,'viewQuadrature'),request.view);gl.uniform1i(gl.getUniformLocation(p,'queryCount'),count);
  gl.viewport(0,0,256,height);gl.drawArrays(gl.TRIANGLES,0,3);const pixels=new Float32Array(256*height*4);gl.readPixels(0,0,256,height,gl.RGBA,gl.FLOAT,pixels);if(gl.getError()!==gl.NO_ERROR||gl.isContextLost())throw new Error('Reference GPU failed');const values=Array.from({length:count},(_,i)=>[...pixels.slice(i*4,i*4+2)]);if(!values.flat().every(x=>Number.isFinite(x)&&x>=0))throw new Error('Invalid direct radiance');return {renderer,values};
 }finally{textures.forEach(t=>gl.deleteTexture(t));shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(p);gl.deleteFramebuffer(frame);gl.getExtension('WEBGL_lose_context')?.loseContext();}
}

/** Continuous angular test: evaluate incident L1 directly at every quadrature direction.
 * @param {import('puppeteer').Page} page @param {DialRun} run @param {AttributionControl} control
 * @param {HorizonReferenceMedium} medium @param {number} channel @param {AttributionPoint} target
 * @param {string[]} [rules] Angular rules selected by a later bounded diagnosis.
 * @param {boolean} [qualifyTangents] Original binary64 tangent proof assumes sunlit paths; later dusk cases disable it and use paired quadrature/Monte Carlo controls.
 * @returns {Promise<unknown[]>} F68 and phase-importance rules, with species-separated J2 and convergence facts.
 */
export async function angular(page,run,control,medium,channel,target,rules=['F68','importance16','importance32','importance64'],qualifyTangents=true){
 const material=control.material,table=material.phaseTables[channel],ssa=material.albedos[channel],base=kernel(table,ssa).shader;
 const start=base.lastIndexOf('void main(){');assert.ok(start>0);
 const shader=base.slice(0,start)+`uniform sampler2D queries;uniform int viewQuadrature,queryCount;uniform float initialAltitude;float initialEnd(float mu){float r=R+initialAltitude,b=r*mu,c=initialAltitude*(2.0*R+initialAltitude),d=b*b-c;if(mu<0.0&&d>=0.0)return max(0.0,c/(-b+sqrt(d)));float ct=(initialAltitude-60000.0)*(2.0*R+initialAltitude+60000.0),s=sqrt(max(0.0,b*b-ct));return max(0.0,b>=0.0?-ct/(b+s):-b+s);}void main(){int i=int(gl_FragCoord.x)+256*int(gl_FragCoord.y);o0=vec4(0);o1=o0;o2=o0;o3=o0;if(i>=queryCount)return;vec4 query=texelFetch(queries,ivec2(i%256,i/256),0);vec3 v=query.xyz;float end=initialEnd(query.w);if(end<=0.0)return;float q=log(1.0+end/1000.0);vec2 sum=vec2(0);for(int j=0;j<viewQuadrature;j++){float u=viewQuadrature==64?X64[j]:X128[j],w=viewQuadrature==64?W64[j]:W128[j],t=1000.0*(exp(u*q)-1.0);vec3 x=origin+t*v;vec2 b=density(x);vec4 sun=sunlight(x);sum+=w*(t+1000.0)*q*exp(-tau(origin,v,t))*sun.w*b*vec2(1.0,W)*phases(dot(v,sun.xyz));}o0=vec4(sum,0,0);}`;
 const altitude=target.altitude,br=medium.rayleigh[channel]*Math.exp(-altitude/8000),bm=medium.mie[channel]*ssa*Math.exp(-altitude/1200);
 const result=[];
 for(const rule of rules){
  /** @type {number[][]} */const directions=[];/** @type {number[][]} */const weights=[];
  if(rule==='F68')control.request.transportSpec.domains.incoming.unitVectors.forEach((local,j)=>{const v=world(local,target.point),c=Math.max(-1,Math.min(1,v.reduce((s,x,k)=>s+x*target.direction[k],0))),pr=phase(c,.7)[0],pm=table?aerosolPhase(table,c):phase(c,.7)[1],w=control.request.transportSpec.domains.incoming.integrationWeightsSteradians[j];directions.push(v);weights.push([br*pr*w,bm*pm*w]);});
  else{
   const n=Number(rule.slice(10)),azimuth=2*n,q=gauss(n);
   for(let species=0;species<2;species++)for(let i=0;i<n;i++)for(let k=0;k<azimuth;k++){
    const u=q.nodes[i],mu=species?(table?inverse(table,u):2*u-1):inverseRayleigh(u),v=rotate(mu,2*Math.PI*(k+.5)/azimuth,target.direction),baseWeight=q.weights[i]/azimuth;
    directions.push(v);weights.push(species?[0,bm*baseWeight*(table?1:2*2*Math.PI*phase(mu,.7)[1])]:[br*baseWeight,0]);
   }
  }
  run.progress('angular',`channel${channel} ${target.id} ${rule}: ${directions.length} independent incoming directions`);
  const evaluated=await page.evaluate(angularGpu,shader,{directions,origin:target.point,altitude:target.altitude,medium,channel,view:128});
  const terms=evaluated.values.map((s,i)=>weights[i].map(w=>w*(s[0]+s[1]))),sum=[0,1].map(k=>terms.reduce((s,t)=>s+t[k],0));
  const record={rule,count:directions.length,rayleigh:sum[0],mie:sum[1],J2:sum[0]+sum[1],constantFieldMass:[0,1].map(k=>weights.reduce((s,w)=>s+w[k],0)/(k?bm:br)),directionIdentity:createHash('sha256').update(JSON.stringify({directions,weights})).digest('hex'),outputIdentity:createHash('sha256').update(JSON.stringify(evaluated.values)).digest('hex'),renderer:evaluated.renderer,retention:'Streaming deterministic quadrature reduction; recipe, input/output identities and sums retained. F68 retains all incident samples.',samples:rule==='F68'?{directions,weights,incident:evaluated.values}:undefined};result.push(record);
  if(rule==='F68'){
   const tangentProof=[];
   for(let i=0;i<directions.length;i++)if(qualifyTangents&&target.altitude===0&&Math.abs(control.request.transportSpec.domains.incoming.unitVectors[i][2])<1e-12){const reference=tangentCpu(medium,target,directions[i],channel,material,128),coarse=tangentCpu(medium,target,directions[i],channel,material,64),gpu=evaluated.values[i];const error=(gpu[0]+gpu[1])/(reference[0]+reference[1])-1;assert.ok(Math.abs(error)<.002,'Exact horizontal L1 GPU/binary64 qualification');tangentProof.push({index:i,gpu,reference,relativeError:error,view64To128:(coarse[0]+coarse[1])/(reference[0]+reference[1])-1,initialRadialCosine:0,initialAltitude:0});}
   result.push({rule:'surface-tangent-proof',tangentProof,skipped:!qualifyTangents,method:qualifyTangents?'Initial shell intersection uses independently supplied physical altitude and binary64 radial cosine; exact tangents snap only below1e-12. Independent binary64 continuous integral validates each exact F68 tangent.':'Original no-shadow binary64 tangent proof is not applicable at dusk; no proof claimed by this empty record. Paired integration and independent local path estimates supply the new qualification.'});
   const coarse=await page.evaluate(angularGpu,shader,{directions,origin:target.point,altitude:target.altitude,medium,channel,view:64});const sums=[0,1].map(k=>coarse.values.reduce((s,L,i)=>s+(L[0]+L[1])*weights[i][k],0));result.push({rule:'F68-view64',J2:sums[0]+sums[1],relativeToView128:(sums[0]+sums[1])/record.J2-1});
  }
 }
 return result;
}

/** Matched continuous local J1..J4 references and independent angular J2 controls.
 * @returns {Promise<void>} New immutable GPU evidence; no production evaluator imported.
 */
async function main(){
 const source=process.argv[2],mode=process.argv[3]??'points';assert.match(source,/^tmp\/experiments\/sky-accuracy-dials\/runs\/\d{5}-h49-instrument$/);assert.ok(['points','angular'].includes(mode));assert.ok(process.argv.length<=4);
 const {parents,physical}=inputs();parents.push(verifyRun(source),identity(source+'/control.json'));const control=/** @type {AttributionControl} */(JSON.parse(readRepository(source+'/control.json').toString()));assert.ok(control.diagnostic);
 const medium={...physical.medium,sourceDirection:[0,0,1]},channels=[2,3,5,8];
 const run=createRun(mode==='points'?'h49-point-ref':'h50-angular-ref',{parents,operation:mode==='points'?'Independent continuous local pure J1..J4 Monte Carlo at exact nodes and off-grid horizon samples, with deterministic N1 checks.':'Independent continuous L1 at F68 and phase-importance-refined directions; same incident function, species-separated local J2, no sparse-L interpolation.',parameters:{mode,channels,points:control.diagnostic.points,paths:8192,batches:24,orderMethod:'Local source-density query end=-1; exact pure tallies through4 before roulette8',angularMethod:'Normalized Rayleigh CDF and measured-table inverse-CDF polar quadrature; azimuth2N. Below440nm uses exact canonical phase weights with uniform-mu proposal.',precisionTargets:{pointOrderRelative95:.05,angularRefinementRelative:.02}}});
 let browser,failure=null;const readings=[];
 try{
  run.write('registration.json',{physical:{...physical,medium},targets:control.diagnostic,channels});browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'gpu'),false),protocolTimeout:1200000,args:['--enable-gpu','--ignore-gpu-blocklist','--use-angle=d3d11','--disable-background-timer-throttling']});const page=await browser.newPage();
  /** @type {(HorizonReferenceBatch&{channel:number})[]} */const batches=[];let channel=-1;
  await page.exposeFunction('retainBatch',/** @param {HorizonReferenceBatch} b */b=>{batches.push({...b,channel});run.progress('points',`channel${channel}, point${b.group}, batch${b.batch+1}`);});
  for(channel of channels){
   if(mode==='points'){
    const groups=control.diagnostic.points.map(p=>({id:p.id,origin:p.point,direction:p.direction,medium,channel,end:-1}));
    const generated=kernel(control.material.phaseTables[channel],control.material.albedos[channel]);run.write(`shader-${channel}.glsl`,generated.shader);
    const telemetry=await page.evaluate(executeGpu,generated.shader,{groups,paths:8192,profiles:[{name:'local',batches:24,quadrature:128,roulette:8,seed:1073741824}],maximumMilliseconds:900000});run.write(`telemetry-${channel}.json`,telemetry);
    for(let group=0;group<groups.length;group++){
     const selected=batches.filter(b=>b.channel===channel&&b.group===group),means=[1,2,3,4].map(k=>selected.reduce((s,b)=>s+b.means[k],0)/24),widths=[1,2,3,4].map(k=>halfWidth(selected.map(b=>b.means[k]))),p=control.diagnostic.points[group],sun=illumination(medium,p.point,channel,128),cos=p.direction[2],br=medium.rayleigh[channel]*Math.exp(-p.altitude/8000),bm=medium.mie[channel]*control.material.albedos[channel]*Math.exp(-p.altitude/1200),pr=phase(cos,.7)[0],table=control.material.phaseTables[channel],pm=table?aerosolPhase(table,cos):phase(cos,.7)[1],direct=sun[3]*(br*pr+bm*pm);
     assert.ok(Math.abs(means[0]/direct-1)<.005,'Local N1 query qualification');readings.push({channel,id:p.id,means,halfWidths95:widths,independentDirectN1:direct,N1RelativeError:means[0]/direct-1,precisionPassed:widths.every((v,k)=>v/means[k]<.05)});
    }
    run.write(`batches-${channel}.json.gz`,gzipSync(Buffer.from(JSON.stringify(batches.filter(b=>b.channel===channel)))));
   }else{
    for(const target of control.diagnostic.points.filter(p=>p.kind==='node')){const value=await angular(page,run,control,medium,channel,target);readings.push({channel,id:target.id,controls:value});run.write(`angular-${channel}-${target.id}.json.gz`,gzipSync(Buffer.from(JSON.stringify(value))));}
   }
   console.log(JSON.stringify({mode,channel,completed:readings.length}));
  }
  run.write('readings.json',readings);
 }catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,readings:readings.length});}
 verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
