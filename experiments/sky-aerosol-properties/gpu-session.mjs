import {fragment as originalFragment} from './gpu.mjs';
/** Generate one common numerical kernel; only physical uniforms vary between cases.
 * @param {AerosolMedium} medium Original coefficient spectrum.
 * @param {number[][]} rgb Color weights.
 * @param {AerosolView} view Initial field bounds; converted to uniforms below.
 * @returns {string} Common shader source.
 */
export function fragment(medium,rgb,view){
 let source=originalFragment(medium,rgb,view);
 const changes=[
  [`const vec3 SUN=vec3(${medium.sourceDirection.join(',')});`,'uniform vec3 SUN;\nuniform float phaseShape,singleScatteringAlbedo,observerAltitude;\nuniform vec4 angularField;'],
  [`vec3 o=vec3(0,0,${medium.observerHeight.toFixed(8)});`,'vec3 o=vec3(0,0,observerAltitude);'],
  [`g=${medium.g};`,'g=phaseShape;'],
  [`amount*M[k]*${medium.albedo}*d.y*pM`,'amount*M[k]*singleScatteringAlbedo*d.y*pM'],
 ];
 for(const [before,after] of changes){if(!source.includes(before))throw Error('Missing uniform transformation: '+before);source=source.replace(before,after);}
 source=source.replace(/float a=radians\([^\n]+;/,'float a=radians(angularField.x+angularField.y*uv.x),e=radians(angularField.z+angularField.w*uv.y);');
 if(!source.includes('radians(angularField.x'))throw Error('Missing view transformation');
 return source;
}
/** Render and probe a case on a reused owned context. Closing the owned page retires resources.
 * @param {AerosolSessionInput} input Physical parameters and common shader.
 * @returns {Promise<AerosolGpuResult>} Actual hardware results.
 */
export async function execute(input){
 const start=performance.now();
 /** @type {AerosolGpuSession} */
 let state=globalThis['__aerosolGpuSession'];
 if(!state){
  const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2',{powerPreference:'high-performance',antialias:false});
  if(!gl||!gl.getExtension('EXT_color_buffer_float'))throw Error('Float hardware WebGL2 required');
  const debug=gl.getExtension('WEBGL_debug_renderer_info'),renderer=String(gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER));
  if(/software|swiftshader|llvmpipe/i.test(renderer))throw Error('Hardware GPU required');
  const program=gl.createProgram(),texture=gl.createTexture(),frame=gl.createFramebuffer();
  for(const [kind,source] of [[gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}'],[gl.FRAGMENT_SHADER,input.shader]]){
   const shader=gl.createShader(Number(kind));gl.shaderSource(shader,String(source));gl.compileShader(shader);
   if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));gl.attachShader(program,shader);gl.deleteShader(shader);
  }
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA32F,input.width,input.height);
  gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Incomplete float target');
  state={gl,program,texture,frame,renderer,shader:input.shader,width:input.width,height:input.height};globalThis['__aerosolGpuSession']=state;
 }
 if(state.shader!==input.shader||state.width!==input.width||state.height!==input.height)throw Error('Session kernel changed');
 const {gl,program}=state,p=input.parameters,v=input.view;
 gl.useProgram(program);gl.bindFramebuffer(gl.FRAMEBUFFER,state.frame);
 gl.uniform2f(gl.getUniformLocation(program,'imageSize'),input.width,input.height);
 gl.uniform1f(gl.getUniformLocation(program,'amount'),p.amount);gl.uniform1f(gl.getUniformLocation(program,'singleScatteringAlbedo'),p.ssa);gl.uniform1f(gl.getUniformLocation(program,'phaseShape'),p.g);
 gl.uniform1f(gl.getUniformLocation(program,'observerAltitude'),p.observerHeight);gl.uniform3fv(gl.getUniformLocation(program,'SUN'),Float32Array.from(p.sourceDirection));
 gl.uniform4f(gl.getUniformLocation(program,'angularField'),v.azimuthMinimum,v.azimuthMaximum-v.azimuthMinimum,v.elevationMinimum,v.elevationMaximum-v.elevationMinimum);
 gl.uniform1i(gl.getUniformLocation(program,'probe'),0);gl.uniform1i(gl.getUniformLocation(program,'outputGroup'),-1);
 gl.viewport(0,0,input.width,input.height);gl.drawArrays(gl.TRIANGLES,0,3);
 const pixels=new Float32Array(input.width*input.height*4);gl.readPixels(0,0,input.width,input.height,gl.RGBA,gl.FLOAT,pixels);
 const spectra=[];gl.uniform1i(gl.getUniformLocation(program,'probe'),1);gl.viewport(0,0,1,1);
 for(const direction of input.directions){const spectrum=[];gl.uniform3fv(gl.getUniformLocation(program,'probeDirection'),Float32Array.from(direction));for(let group=0;group<4;group++){
  gl.uniform1i(gl.getUniformLocation(program,'outputGroup'),group);gl.drawArrays(gl.TRIANGLES,0,3);const values=new Float32Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.FLOAT,values);spectrum.push(...values);
 }spectra.push(spectrum.slice(0,15));}
 if(gl.getError()!==gl.NO_ERROR||![...pixels].every(Number.isFinite))throw Error('Invalid readback');
 return {renderer:state.renderer,milliseconds:performance.now()-start,cases:[{fraction:p.amount,pixels:[...pixels],spectra}]};
}
