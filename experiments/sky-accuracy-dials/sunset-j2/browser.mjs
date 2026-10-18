import {setTorontoMaterial} from '../distant-horizon/toronto-phase.js';
import {sampleDensity} from '../numerics/view.js';

/** Observe exact field rows and actual final-view reconstruction without retaining fields.
 * @param {any} control @param {any} compiler @returns {Promise<any>}
 */
export async function execute(control,compiler){
 setTorontoMaterial(control.material);const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2',{powerPreference:'high-performance',antialias:false});if(!gl||!gl.getExtension('EXT_color_buffer_float'))throw new Error('Float WebGL2 required');
 const debug=gl.getExtension('WEBGL_debug_renderer_info'),renderer=String(gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER));if(/software|swiftshader|llvmpipe/i.test(renderer))throw new Error('Hardware GPU required');
 const frame=gl.createFramebuffer(),vao=gl.createVertexArray(),textures=[],programs=[];let channel=-1,fields=[];
 try{
  globalThis['__h67Observe']=async({fieldId,resource,common})=>{
   if(!['J1','L1','J2'].includes(fieldId))return;
   gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,resource.texture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Probe framebuffer');
   const exact=control.targets.filter(t=>t.kind==='node').map(t=>{const data=new Float32Array(fieldId==='L1'?68:1);gl.readPixels(fieldId==='L1'?0:t.outgoingIndex,t.row,data.length,1,gl.RED,gl.FLOAT,data);return {id:t.id,values:[...data]};});
   const reconstructed=[];
   if(fieldId!=='L1'){
    const p=gl.createProgram(),shaders=[];programs.push(p);
    try{for(const [kind,text]of [[gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0,1);}'],[gl.FRAGMENT_SHADER,`#version 300 es\nprecision highp float;precision highp int;uniform sampler2D field;uniform vec4 queries[32];${common}\nout vec4 value;void main(){vec4 q=queries[int(gl_FragCoord.x)];value=vec4(sampleJDirection(field,int(q.w),q.xyz),0,0,0);}`]]){const s=gl.createShader(Number(kind));shaders.push(s);gl.shaderSource(s,String(text));gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));}finally{shaders.forEach(s=>gl.deleteShader(s));}
    const texture=gl.createTexture();textures.push(texture);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA32F,control.queries.length,1);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Query framebuffer');gl.useProgram(p);gl.bindVertexArray(vao);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,resource.texture);gl.uniform1i(gl.getUniformLocation(p,'field'),0);gl.uniform4fv(gl.getUniformLocation(p,'queries'),control.queries.flat());gl.viewport(0,0,control.queries.length,1);gl.drawArrays(gl.TRIANGLES,0,3);const values=new Float32Array(control.queries.length*4);gl.readPixels(0,0,control.queries.length,1,gl.RGBA,gl.FLOAT,values);const packed=Float32Array.from(control.queries,(_,i)=>values[4*i]);
    for(const selected of control.samples)reconstructed.push({id:selected.id,value:sampleDensity(packed,selected.sample,'monotone-cubic')});
   }
   if(gl.getError()!==gl.NO_ERROR||gl.isContextLost())throw new Error('Field observer GPU failure');fields.push({fieldId,exact,reconstructed});await globalThis['__h67Progress'](`channel${channel} ${fieldId}`);if(fieldId==='J2')throw new Error('H67_J2_COMPLETE');
  };
  const readings=[];
  for(channel of control.channels){fields=[];try{await compiler.compileDistantSunSceneCacheWavelength({gl,buildRequest:{...control.request,transportSpec:{...control.request.transportSpec,atmosphere:{...control.request.transportSpec.atmosphere,mieSingleScatteringAlbedo:control.material.albedos[channel]}}},wavelengthIndex:channel,compileSceneCaches:false,reportProgress:async stage=>{if(stage==='programs-compiled'||stage.endsWith(':180/180'))await globalThis['__h67Progress'](`channel${channel} ${stage}`);}});}catch(e){if(!String(e).includes('H67_J2_COMPLETE')||fields.length!==3)throw e;}
   readings.push({channel,fields});await globalThis['__h67Progress'](`channel${channel} stopped after J2; compiler cleanup completed`);
  }
  return {renderer,readings};
 }finally{globalThis['__h67Observe']=null;programs.forEach(p=>gl.deleteProgram(p));textures.forEach(t=>gl.deleteTexture(t));gl.deleteVertexArray(vao);gl.deleteFramebuffer(frame);gl.getExtension('WEBGL_lose_context')?.loseContext();}
}
