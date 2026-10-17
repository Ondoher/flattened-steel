/** Compile one owned GPU diagnostic pass, leaving borrowed field/direction textures alive.
 * @param {WebGL2RenderingContext} gl @param {string} source
 * @returns {WebGLProgram} Linked program; caller deletes it after use.
 */
function program(gl,source){
 const p=gl.createProgram();const shaders=[];
 try{for(const [kind,text] of [[gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}'],[gl.FRAGMENT_SHADER,source]]){const s=gl.createShader(Number(kind));shaders.push(s);gl.shaderSource(s,String(text));gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}catch(e){gl.deleteProgram(p);throw e;}finally{shaders.forEach(s=>gl.deleteShader(s));}
}

/** Diagnostic equations run while the full previous-order field is still live.
 * @param {{gl:WebGL2RenderingContext,fieldId:string,resource:{texture:WebGLTexture},common:string,transport:string,f68:WebGLTexture}} context
 * @returns {Promise<void>} Compact point reconstruction, frozen-input transport controls and traces.
 */
export async function inspect(context){
 const {gl,fieldId,resource,common,transport,f68}=context;
 const control=/** @type {AttributionControl} */(globalThis['__h49Control']);
 if(!control?.diagnostic||!fieldId.startsWith('J'))return;
 const nodes=control.diagnostic.nodes,points=control.diagnostic.points,spec=control.request.transportSpec;
 const width=spec.domains.incoming.directionCount,height=spec.domains.position.count*spec.domains.solarZenith.count;
 const frame=gl.createFramebuffer(),vao=gl.createVertexArray(),textures=[],programs=[];
 /** @type {AttributionFieldDiagnostic} */const result={fieldId,channel:globalThis['__h49Channel'],points:[],transport:[],traces:[]};
 /** @param {number} w @param {number} h @param {boolean} rgba @returns {WebGLTexture} Owned output. */
 function output(w,h,rgba){const t=gl.createTexture();textures.push(t);gl.bindTexture(gl.TEXTURE_2D,t);gl.texStorage2D(gl.TEXTURE_2D,1,rgba?gl.RGBA32F:gl.R32F,w,h);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Diagnostic framebuffer incomplete');gl.viewport(0,0,w,h);return t;}
 /** @param {WebGLProgram} p @returns {void} Bind borrowed input textures. */
 function bind(p){gl.useProgram(p);gl.bindVertexArray(vao);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,resource.texture);gl.uniform1i(gl.getUniformLocation(p,'uPreviousJ'),0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,f68);gl.uniform1i(gl.getUniformLocation(p,'uF68Directions'),1);}
 try{
  const pointShader=`#version 300 es\nprecision highp float;precision highp int;uniform sampler2D uPreviousJ;uniform vec3 points[16],directions[16];uniform float heights[16];${common}\nout vec4 value;void main(){int i=int(gl_FragCoord.x);vec3 p=points[i];radialAnchorPoint=p;radialAnchorHeight=heights[i];radialAnchorCosine=p.z/length(p);radialAnchorZenithDegrees=degrees(acos(clamp(radialAnchorCosine,-1.0,1.0)));radialAnchorDirection=directions[i];radialAnchorDirectionCosine=dot(normalize(p),directions[i]);value=vec4(sampleJ(uPreviousJ,p,directions[i]),directScatteringDensity(p,directions[i]),altitudeAtPoint(p),sourceZenithDegreesAtPoint(p));}`;
  const p=program(gl,pointShader);programs.push(p);output(points.length,1,true);bind(p);gl.uniform3fv(gl.getUniformLocation(p,'points'),points.flatMap(q=>q.point));gl.uniform3fv(gl.getUniformLocation(p,'directions'),points.flatMap(q=>q.direction));gl.uniform1fv(gl.getUniformLocation(p,'heights'),points.map(q=>q.altitude));gl.drawArrays(gl.TRIANGLES,0,3);const data=new Float32Array(points.length*4);gl.readPixels(0,0,points.length,1,gl.RGBA,gl.FLOAT,data);result.points=points.map((q,i)=>({...q,reconstructed:data[4*i],continuousDirect:data[4*i+1],actualHeight:data[4*i+2],actualZenith:data[4*i+3]}));
  if(fieldId!=='J4')for(const count of [15,30,60]){
   const shader=transport.replace(/const int TRANSPORT_INTERVAL_COUNT = \d+;/,`const int TRANSPORT_INTERVAL_COUNT = ${count};`);
   const p=program(gl,shader);programs.push(p);output(width,height,false);bind(p);gl.drawArrays(gl.TRIANGLES,0,3);
   const rows=nodes.map(n=>{const a=new Float32Array(width);gl.readPixels(0,n.row,width,1,gl.RED,gl.FLOAT,a);return {row:n.row,values:[...a]};});result.transport.push({intervals:count,rows});
  }
  // Trace the largest positive Q15-Q60 radiance response at each selected row.
  if(fieldId==='J2'||fieldId==='J3')for(const node of nodes)for(const intervals of [15,60]){
   const before=result.transport[0].rows.find(r=>r.row===node.row).values,after=result.transport[2].rows.find(r=>r.row===node.row).values;
   let directionIndex=0;for(let k=1;k<before.length;k++)if(before[k]-after[k]>before[directionIndex]-after[directionIndex])directionIndex=k;
   const direction=spec.domains.incoming.unitVectors[directionIndex];
   const source=`#version 300 es\nprecision highp float;precision highp int;uniform sampler2D uPreviousJ;${common}\nout vec4 value;void main(){vec3 origin=representativePoint(${node.position},${node.zenith});vec3 direction=incomingPhysicalDirection(origin,vec3(${direction.join(',')}));float lengthMeters=atmosphereBranchLength(origin,direction);float breaks[5];int count=transportBreaks(origin,direction,lengthMeters,breaks);float transmittance=1.0;int target=int(gl_FragCoord.x),cursor=0;value=vec4(-1.0);for(int seg=0;seg<4;seg++){if(seg+1>=count)break;float start=breaks[seg],end=breaks[seg+1],step=(end-start)/15.0,previous=0.0;for(int j=0;j<=15;j++){float distance=start+step*float(j);vec3 p=origin+direction*distance;Medium medium=sampleMediumAtPoint(p);if(j>0)transmittance*=exp(-.5*(previous+medium.extinction)*step);if(cursor==target)value=vec4(sampleJ(uPreviousJ,p,direction),transmittance,medium.extinction,distance);previous=medium.extinction;cursor++;}}}`;
   const count=4*(intervals+1),modified=source.replaceAll('/15.0',`/${intervals}.0`).replaceAll('j<=15',`j<=${intervals}`).replace('medium.extinction,distance','step*(j==0||j=='+intervals+'?.5:1.0),distance');
   const p=program(gl,modified);programs.push(p);output(count,1,true);bind(p);gl.drawArrays(gl.TRIANGLES,0,3);const a=new Float32Array(count*4);gl.readPixels(0,0,count,1,gl.RGBA,gl.FLOAT,a);result.traces.push({row:node.row,directionIndex,intervals,terms:Array.from({length:count},(_,i)=>[...a.slice(4*i,4*i+4)]).filter(x=>x[0]>=0)});
  }
  if(gl.getError()!==gl.NO_ERROR||gl.isContextLost())throw new Error('Diagnostic GPU pass failed');
  globalThis['__h49Telemetry'].push(result);
  await globalThis['__h43Progress'](`Instrumented ${fieldId}: reconstruction and fixed-input transport15/30/60`);
 }finally{programs.forEach(p=>gl.deleteProgram(p));textures.forEach(t=>gl.deleteTexture(t));gl.deleteVertexArray(vao);gl.deleteFramebuffer(frame);}
}
