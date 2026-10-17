import {benchmarkRay,createPointStencilBuilder,viewPathIntervals,sampleDensity,integrateDensity} from '../numerics/view.js';
import {localDirection} from '../numerics/math.js';

/** Fail an isolated proof without silently changing its equation. @param {unknown} ok @param {string} message */
function requireProof(ok,message){if(!ok)throw new Error(message);}

/** Compile a disposable fullscreen diagnostic program. @param {WebGL2RenderingContext} gl @param {string} fragment @returns {WebGLProgram} */
function program(gl,fragment){
 const p=gl.createProgram(),shaders=[];
 try{for(const [kind,source] of [[gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0,1);}'],[gl.FRAGMENT_SHADER,fragment]]){const s=gl.createShader(Number(kind));shaders.push(s);gl.shaderSource(s,String(source));gl.compileShader(s);requireProof(gl.getShaderParameter(s,gl.COMPILE_STATUS),gl.getShaderInfoLog(s));gl.attachShader(p,s);}gl.linkProgram(p);requireProof(gl.getProgramParameter(p,gl.LINK_STATUS),gl.getProgramInfoLog(p));return p;}catch(e){gl.deleteProgram(p);throw e;}finally{shaders.forEach(s=>gl.deleteShader(s));}
}

/** Original shader equation evaluated at a queried angle, preserving anchored geometry globals.
 * @param {string} scatter @param {string} common @param {boolean} first @returns {string}
 */
function directFunction(scatter,common,first){
 let body=first?`vec2 base=texelFetch(uDirectBase,ivec2(0,row),0).rg;vec3 point=representativePoint(row%POSITION_COUNT,row/POSITION_COUNT);vec3 outgoing=phaseOutgoingDirection(point,local);vec3 sourceDirection=j1SourceDirection(row/POSITION_COUNT);float answer=base.x*rayleighPhase(outgoing,sourceDirection)+base.y*miePhase(outgoing,sourceDirection);`:
 scatter.slice(scatter.indexOf('void main() {')+'void main() {'.length,scatter.lastIndexOf('}'))
 .replace('int outgoingIndex = int(gl_FragCoord.x);','').replace('int row = int(gl_FragCoord.y);','')
 .replace('texelFetch(uOutgoingDirections, ivec2(outgoingIndex, 0), 0).xyz','local')
 .replace('outputValue =','float answer =');
 requireProof(first||!body.includes('gl_FragCoord'),'Direct equation retains no pixel-coordinate dependency.');
 return `uniform sampler2D uAngularL;uniform sampler2D uDirectBase;
 float angleDirect(int row,vec3 local){
 vec3 ap=radialAnchorPoint,ad=radialAnchorDirection;float ah=radialAnchorHeight,ac=radialAnchorCosine,az=radialAnchorZenithDegrees,adc=radialAnchorDirectionCosine;
 ${body.replaceAll('uPreviousL','uAngularL')}
 radialAnchorPoint=ap;radialAnchorDirection=ad;radialAnchorHeight=ah;radialAnchorCosine=ac;radialAnchorZenithDegrees=az;radialAnchorDirectionCosine=adc;return answer;}
 `;
}

/** One live-field observation, optional bounded transport and row injection.
 * Borrowed compiler resources remain owned by the compiler. Diagnostic output is compact.
 * @param {any} c @returns {Promise<void>}
 */
export async function inspect(c){
 const {gl,fieldId,resource,common,scatter,transport,resources,f68}=c,state=globalThis['__h59State'];
 if(!state)return;
 const order=Number(fieldId.slice(1)),isJ=fieldId.startsWith('J');
 if(!isJ)return;
 const previous=order===1?resources.get('direct-base'):resources.get('L'+(order-1));
 requireProof(previous,'Previous live field is available.');
 const helper=directFunction(scatter,common,order===1),frame=gl.createFramebuffer(),vao=gl.createVertexArray(),owned=[],programs=[];
 /** @param {number} w @param {number} h @param {Float32Array|null} data @returns {WebGLTexture} */
 function texture(w,h,data=null){const t=gl.createTexture();owned.push(t);gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,w,h,0,gl.RGBA,gl.FLOAT,data);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);return t;}
 /** @param {WebGLProgram} p @param {WebGLTexture} query */
 function bind(p,query){gl.useProgram(p);gl.bindVertexArray(vao);for(const [i,name,t] of [[0,'uPreviousJ',resource.texture],[1,'uPreviousL',previous.texture],[2,'uAngularL',previous.texture],[3,'uDirectBase',previous.texture],[4,'uF68Directions',f68],[5,'uQueries',query]]){gl.activeTexture(gl.TEXTURE0+Number(i));gl.bindTexture(gl.TEXTURE_2D,t);gl.uniform1i(gl.getUniformLocation(p,String(name)),Number(i));}}
 try{
 const queries=state.queries,n=queries.length,query=texture(n,1,new Float32Array(queries.flatMap(q=>[...q.local,q.row]))),out=texture(n,1);
 const source=`#version 300 es\nprecision highp float;precision highp int;uniform sampler2D uPreviousJ,uPreviousL,uF68Directions,uQueries;${common}\n${helper}\nout vec4 value;void main(){vec4 q=texelFetch(uQueries,ivec2(int(gl_FragCoord.x),0),0);int row=int(q.w);value=vec4(sampleJDirection(uPreviousJ,row,q.xyz),angleDirect(row,q.xyz),0,0);}`;
 const p=program(gl,source);programs.push(p);gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,out,0);requireProof(gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE,'Query framebuffer complete');gl.viewport(0,0,n,1);bind(p,query);gl.drawArrays(gl.TRIANGLES,0,3);const values=new Float32Array(n*4);gl.readPixels(0,0,n,1,gl.RGBA,gl.FLOAT,values);
 const result={fieldId,pairs:queries.map((q,i)=>[values[4*i],values[4*i+1]]),transport:null};
 if((order===2||order===3)&&state.control.transport){
  // Keep native transport equation, splits and ground term. Replace only its angular lookup.
  const rows=state.rows,w=state.control.request.transportSpec.domains.incoming.directionCount;
  let modified=common.replace('float sampleJDirection(', 'float nativeJDirection(');
  modified=modified.replace('float sampleJ(sampler2D field,',helper+'\nfloat sampleJDirection(sampler2D field,int row,vec3 direction){return angleDirect(row,direction);}\nfloat sampleJ(sampler2D field,');
  let shader=transport.replace(common,modified).replace('int row = int(gl_FragCoord.y);','int row = uRows[int(gl_FragCoord.y)];').replace('void main() {','uniform int uRows[8];\nvoid main() {');
  const tp=program(gl,shader);programs.push(tp);const target=texture(w,rows.length);gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,target,0);gl.viewport(0,0,w,rows.length);bind(tp,query);gl.uniform1iv(gl.getUniformLocation(tp,'uRows'),rows);gl.drawArrays(gl.TRIANGLES,0,3);const data=new Float32Array(w*rows.length*4);gl.readPixels(0,0,w,rows.length,gl.RGBA,gl.FLOAT,data);
  result.transport=rows.map((row,j)=>({row,values:Array.from({length:w},(_,i)=>data[4*(j*w+i)])}));
  state.pending[fieldId]=result.transport;
 }
 state.diagnostics.push(result);
 if(order===1&&state.control.retainBases){const h=state.control.request.transportSpec.domains.position.count*state.control.request.transportSpec.domains.solarZenith.count;gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,previous.texture,0);const a=new Float32Array(h*2);gl.readPixels(0,0,1,h,gl.RG,gl.FLOAT,a);state.directBases=[...a];}
 if(order===2&&state.control.rules.length)state.quadrature=await quadrature(c,state);
 requireProof(gl.getError()===gl.NO_ERROR&&!gl.isContextLost(),'Diagnostic GPU work completed without error.');
 await globalThis['__h59Progress'](`channel ${state.channel} ${fieldId}: ${n} angular pairs${result.transport?' and bounded transport':''}`);
 }finally{programs.forEach(p=>gl.deleteProgram(p));owned.forEach(t=>gl.deleteTexture(t));gl.deleteVertexArray(vao);gl.deleteFramebuffer(frame);}
}

/** Observe a completed transport field and optionally inject the precomputed bounded rows.
 * @param {any} c @returns {void}
 */
export function transportHook(c){
 const {gl,fieldId,resource}=c,state=globalThis['__h59State'];if(!state||!fieldId.startsWith('L')||fieldId==='L1')return;
 const rows=state.pending['J'+fieldId.slice(1)];if(!rows)return;
 const width=state.control.request.transportSpec.domains.incoming.directionCount,frame=gl.createFramebuffer();
 try{gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,resource.texture,0);
 const before=rows.map(r=>{const a=new Float32Array(width);gl.readPixels(0,r.row,width,1,gl.RED,gl.FLOAT,a);return {row:r.row,values:[...a]};});
 const selected=state.control.patch==='L2'&&fieldId==='L2'||state.control.patch==='L3'&&fieldId==='L3';
 if(selected){gl.bindTexture(gl.TEXTURE_2D,resource.texture);for(const r of rows)gl.texSubImage2D(gl.TEXTURE_2D,0,0,r.row,width,1,gl.RED,gl.FLOAT,new Float32Array(r.values));}
 state.transports.push({fieldId,before,bypass:rows,patched:selected});
 requireProof(gl.getError()===gl.NO_ERROR,'Bounded transport observation/injection completed.');
 }finally{gl.deleteFramebuffer(frame);}
}

/** Build only the registered witness support; full field domains remain unchanged.
 * @param {any} control @returns {any}
 */
function support(control){
 const stencil=createPointStencilBuilder(control.request),spec=control.request.transportSpec;
 const rays=control.witnesses.map(w=>{const r=benchmarkRay(spec,control.scenes[w.t],w.x,w.y);return {...r,worldDirection:r.direction,samples:viewPathIntervals(spec,r,'quadratic',30).map(({start,end})=>{const d=(start+end)/2;return stencil.sample([r.origin[0]+r.direction[0]*d,r.origin[1]+r.direction[1]*d,r.origin[2]+r.direction[2]*d],r.direction,end-start);})};});
 const queries=[],sampleMaps=[];
 rays.forEach((ray,ri)=>ray.samples.forEach((s,si)=>{const map=[];for(let a=0;a<s.altitudeWeights.length;a++)for(let z=0;z<4;z++){const coordinate=stencil.coordinates[s.indices[(a*4+z)*s.directionWeights.length]];map.push(queries.length);queries.push({row:coordinate.y,local:localDirection(s.point,ray.direction),ray:ri,sample:si,kind:'view'});}sampleMaps.push({ray:ri,sample:si,indices:map});}));
 // Original nodes and face seams, plus fixed centres. Selection is independent of observed errors.
 const row=queries[0].row,domain=spec.domains.outgoing;
 for(const i of [0,26,364,728,729,1458,2187,2916,3645,4373])queries.push({row,local:domain.unitVectors[i],kind:'node',node:i});
 for(const local of [[1,0.2,0.3],[1,1,0.2],[1,0.999999,0.2],[1,1.000001,0.2],[0.01,0,1]]){const n=Math.hypot(...local);queries.push({row,local:local.map(v=>v/n),kind:'edge-centre'});}
 const pools=[0,1,2].map(ray=>[...new Set(queries.filter(q=>q.kind==='view'&&q.ray===ray&&q.sample<2).map(q=>q.row))]);
 const rows=[];for(let i=0;rows.length<8&&i<8;i++)for(const pool of pools)if(pool[i]!==undefined&&!rows.includes(pool[i])&&rows.length<8)rows.push(pool[i]);
 return {rays,queries,sampleMaps,coordinates:stencil.coordinates,rows};
}

/** Execute a wavelength-streamed native build with read-only or bounded causal diagnostics.
 * @param {any} control @param {any} compiler @returns {Promise<any>}
 */
export async function execute(control,compiler){
 const start=performance.now(),plan=support(control),canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2',{powerPreference:'high-performance',antialias:false});requireProof(gl,'WebGL2 required');
 const ext=gl.getExtension('WEBGL_debug_renderer_info'),renderer=gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER),maximumTextureSize=gl.getParameter(gl.MAX_TEXTURE_SIZE);requireProof(!/swiftshader|llvmpipe/i.test(renderer),'Hardware GPU required');
 const channels=[];
 try{for(const channel of control.channels){const t=performance.now(),state={...plan,channel,control,diagnostics:[],transports:[],pending:{}};globalThis['__h59State']=state;const fields=[];
 const report=await compiler.compileDistantSunSceneCacheWavelength({gl,buildRequest:control.request,wavelengthIndex:channel,compileSceneCaches:false,fieldProbeCoordinates:Object.fromEntries(['J1','J2','J3','J4'].map(id=>[id,plan.coordinates])),reportProgress:async stage=>{if(stage==='programs-compiled'||stage.endsWith(':180/180'))await globalThis['__h59Progress'](`channel ${channel}: ${stage}`);},onFieldProbes:async({fieldId,values})=>{if(fieldId.startsWith('J'))fields.push(Float32Array.from(values,v=>v.value));}});
 const native=fields.map(f=>plan.rays.map(r=>integrateDensity(control.request.transportSpec,channel,r,s=>sampleDensity(f,s,'monotone-cubic'))));
 const direct=state.diagnostics.map(d=>plan.rays.map((r,ri)=>integrateDensity(control.request.transportSpec,channel,r,s=>{const si=r.samples.indexOf(s),m=plan.sampleMaps.find(x=>x.ray===ri&&x.sample===si),sample={...s,indices:m.indices,directionWeights:[1]};return sampleDensity(Float32Array.from(d.pairs,p=>p[1]),sample,'monotone-cubic');})));
 const angularNative=state.diagnostics.map(d=>plan.rays.map((r,ri)=>integrateDensity(control.request.transportSpec,channel,r,s=>{const si=r.samples.indexOf(s),m=plan.sampleMaps.find(x=>x.ray===ri&&x.sample===si);return sampleDensity(Float32Array.from(d.pairs,p=>p[0]),{...s,indices:m.indices,directionWeights:[1]},'monotone-cubic');})));
 const cumulative=[],running=new Float32Array(plan.coordinates.length);for(const f of fields){for(let i=0;i<f.length;i++)running[i]=Math.fround(running[i]+f[i]);cumulative.push(plan.rays.map(r=>integrateDensity(control.request.transportSpec,channel,r,s=>sampleDensity(running,s,'monotone-cubic'))));}
 requireProof(report.finalLiveFieldBytes===0&&!gl.isContextLost()&&gl.getError()===gl.NO_ERROR,'Native compiler released fields and GPU stayed valid.');
 const result={channel,native,direct,angularNative,cumulative,diagnostics:state.diagnostics,transports:state.transports,quadrature:state.quadrature??null,directBases:state.directBases??null,milliseconds:performance.now()-t,report};channels.push({channel});await globalThis['__h59Channel'](result);await globalThis['__h59Progress'](`channel ${channel} complete in ${Math.round(result.milliseconds)}ms`);
 }}finally{globalThis['__h59State']=null;gl.getExtension('WEBGL_lose_context')?.loseContext();canvas.remove();}
 return {channels:channels.map(c=>c.channel),renderer,maximumTextureSize,support:{queries:plan.queries,rows:plan.rows,coordinates:plan.coordinates},milliseconds:performance.now()-start};
}

/** Fresh L1 values on refined incoming rules; no interpolation of the old F68 field.
 * @param {any} c @param {any} state @returns {Promise<any>}
 */
async function quadrature(c,state){
 const {gl,common,l1,scatter,resources}=c,rows=state.rows,queries=rows.map(row=>state.queries.find(q=>q.kind==='view'&&q.row===row)),frame=gl.createFramebuffer(),vao=gl.createVertexArray(),owned=[],programs=[];
 const native=state.control.request.transportSpec.domains.incoming,old=resources.get('L1').texture;
 /** @param {number} w @param {number} h @param {Float32Array|null} data @returns {WebGLTexture} */
 function texture(w,h,data=null){const t=gl.createTexture();owned.push(t);gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,w,h,0,gl.RGBA,gl.FLOAT,data);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);return t;}
 /** @param {WebGLProgram} p @param {WebGLTexture} out @param {number} w @param {number} h */
 function target(p,out,w,h){gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,out,0);requireProof(gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE,'Refined framebuffer');gl.viewport(0,0,w,h);gl.useProgram(p);gl.bindVertexArray(vao);}
 /** @param {WebGLProgram} p @param {string} name @param {number} unit @param {WebGLTexture} t */
 function bind(p,name,unit,t){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);gl.uniform1i(gl.getUniformLocation(p,name),unit);}
 try{
 const nativeRule=native.unitVectors.map((v,i)=>[...v,native.integrationWeightsSteradians[i]]),results=[];
 for(const rule of [nativeRule,...state.control.rules]){
 const n=rule.length,directions=texture(n,1,new Float32Array(rule.flat())),radiance=texture(n,rows.length),source=l1.replace('int row = int(gl_FragCoord.y);','int row = uRows[int(gl_FragCoord.y)];').replace('void main() {','uniform int uRows[8];\nvoid main() {');
 const p=program(gl,source);programs.push(p);target(p,radiance,n,rows.length);bind(p,'uF68Directions',0,directions);gl.uniform1iv(gl.getUniformLocation(p,'uRows'),rows);gl.drawArrays(gl.TRIANGLES,0,3);const l=new Float32Array(n*rows.length*4);gl.readPixels(0,0,n,rows.length,gl.RGBA,gl.FLOAT,l);
 let nativeL1Maximum=0;if(n===nativeRule.length){gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,old,0);for(let r=0;r<rows.length;r++){const a=new Float32Array(n);gl.readPixels(0,rows[r],n,1,gl.RED,gl.FLOAT,a);for(let j=0;j<n;j++)nativeL1Maximum=Math.max(nativeL1Maximum,Math.abs(a[j]-l[4*(r*n+j)])/Math.max(Math.abs(a[j]),1e-25));}requireProof(nativeL1Maximum<1e-6,'Fresh native L1 replay agrees before quadrature change.');}
 const helper=directFunction(scatter,common,false).replaceAll('incomingIndex < F68_COUNT',`incomingIndex < ${n}`).replace('ivec2(incomingIndex, row)','ivec2(incomingIndex, rowSlot(row))');
 const slot=`int rowSlot(int row){${rows.map((r,i)=>`if(row==${r})return ${i};`).join('')}return 0;}`;
 const interp=`float interpRule(int row,vec3 d){vec3 normal,u,v;int face;directionFace(d,face,normal,u,v);vec2 uv=clamp(vec2(dot(d,u),dot(d,v))/dot(d,normal),-1.,1.);vec2 x=(uv+1.)*float(OUTGOING_CELL_WIDTH)*.5;ivec2 lo=ivec2(floor(x)),hi=min(lo+ivec2(1),ivec2(OUTGOING_CELL_WIDTH));vec2 f=fract(x);float sum=0.;for(int j=0;j<2;j++)for(int i=0;i<2;i++){ivec2 cell=ivec2(i==0?lo.x:hi.x,j==0?lo.y:hi.y);vec2 q=vec2(cell)*2./float(OUTGOING_CELL_WIDTH)-1.;vec3 node=normalize(normal+u*q.x+v*q.y);sum+=angleDirect(row,node)*(i==0?1.-f.x:f.x)*(j==0?1.-f.y:f.y);}return sum;}`;
 const qs=texture(queries.length,1,new Float32Array(queries.flatMap(q=>[...q.local,q.row]))),out=texture(queries.length,1);
 const fragment=`#version 300 es\nprecision highp float;precision highp int;uniform sampler2D uPreviousL,uF68Directions,uQueries;${common}\n${slot}\n${helper}\n${interp}\nout vec4 value;void main(){vec4 q=texelFetch(uQueries,ivec2(int(gl_FragCoord.x),0),0);value=vec4(interpRule(int(q.w),q.xyz),angleDirect(int(q.w),q.xyz),0,0);}`;
 const sp=program(gl,fragment);programs.push(sp);target(sp,out,queries.length,1);bind(sp,'uAngularL',0,radiance);bind(sp,'uF68Directions',1,directions);bind(sp,'uQueries',2,qs);gl.drawArrays(gl.TRIANGLES,0,3);const a=new Float32Array(queries.length*4);gl.readPixels(0,0,queries.length,1,gl.RGBA,gl.FLOAT,a);
 const rowPairs=queries.map((q,i)=>({row:q.row,local:q.local,interpolated:a[i*4],direct:a[i*4+1]}));
 results.push({directions:n,weightMass:rule.reduce((s,r)=>s+r[3],0),nativeL1Maximum,rows:rowPairs});
 requireProof(gl.getError()===gl.NO_ERROR,'Refined angular control is valid.');await globalThis['__h59Progress'](`channel ${state.channel}: fresh L1 and paired angular control, ${n} incoming directions`);
 }
 return {rows,results,method:'Gauss16 polar x azimuth16/32, midpoint azimuth; native source20 and transport60. Every incoming L1 value freshly evaluated.'};
 }finally{programs.forEach(p=>gl.deleteProgram(p));owned.forEach(t=>gl.deleteTexture(t));gl.deleteVertexArray(vao);gl.deleteFramebuffer(frame);}
}
