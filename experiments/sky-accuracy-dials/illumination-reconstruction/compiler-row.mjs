import assert from 'node:assert/strict';
import {createDistantSunSceneCacheCommonShaderSource} from '../../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
import {readRepository,identity} from '../io/files.mjs';
import {originalPhase,setTorontoMaterial,torontoPhaseGlsl} from '../distant-horizon/toronto-phase.js';

const compilerPath='scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';

/** Use the current compiler's exact scalar L1 template under explicitly matched
 * black-boundary physical inputs. Split its atmospheric numerator into R/M for
 * a separate arithmetic-parity check; the ordinary scalar shader stays intact.
 * This is different from the inherited cache-free Gauss64/128 kernel.
 * @param {any} f @param {number} transportIntervals @returns {any} */
export function compilerRow(f,transportIntervals) {
 const spec=f.p.control.request.transportSpec,p=f.px,source=readRepository(compilerPath).toString().replaceAll('\r\n','\n');
 const start=source.indexOf('function l1Fragment('),end=source.indexOf('\n/**',start);
 assert.ok(start>=0&&end>start);
 const templateSource=source.slice(start,end);
 const template=Function(`${templateSource}\nreturn l1Fragment;`)();
 const parameters={
  wavelengthNanometers:spec.domains.spectrum.channels[f.packet.channel].centerNanometers,
  sourceIrradiance:p.irradiance,ozoneCrossSection:0,ozoneMaximumDensity:0,
  rayleighScattering:p.br,mieExtinction:p.bm,groundAlbedo:0,
  bottomRadiusMeters:p.radius,topRadiusMeters:p.radius+p.top,
  rayleighScaleHeightMeters:8000,mieScaleHeightMeters:1200,
  rayleighCoefficientScalePerMeter:spec.atmosphere.rayleighCoefficientScalePerMeter,
  mieAngstromAlpha:spec.atmosphere.mieAngstromAlpha,mieAngstromBeta:spec.atmosphere.mieAngstromBeta,
  mieSingleScatteringAlbedo:p.ssa,miePhaseFunctionG:spec.atmosphere.miePhaseFunctionG,
  sourcePathTransmittanceIntervalCount:spec.numerical.sourcePathTransmittanceIntervalCount,
  incomingDirectionCount:f.g.nodes.length,transportIntervalCount:transportIntervals,
  outgoingFaceWidth:spec.domains.outgoing.faceWidth,
  positionAltitudesMeters:[p.h],solarZenithDegrees:[Math.acos(Math.max(-1,Math.min(1,p.sun[2])))*180/Math.PI],
  coordinateContract:'scene-cache-receiver-local-v1',sourceDirection:[0,0,1],
  numericalPolicy:spec.numerical.geometryPolicy,
 };
 let common=createDistantSunSceneCacheCommonShaderSource(parameters);
 if(p.table) {
  setTorontoMaterial(f.p.control.material);
  assert.equal(common.split(originalPhase).length,2);
  common=common.replace(originalPhase,torontoPhaseGlsl(parameters.wavelengthNanometers));
  setTorontoMaterial(null);
 }
 const scalar=template(common,false);
 let split=scalar;
 const replace=(from,to)=>{assert.equal(split.split(from).length,2);split=split.replace(from,to);};
 replace('layout(location = 0) out float outputValue;','layout(location = 0) out vec4 outputValue;');
 replace('float radiance = 0.0;','vec2 radiance = vec2(0.0);');
 replace('directScatteringDensity(point, direction)','splitDirectDensity(point, direction)');
 replace('outputValue = radiance;','outputValue = vec4(radiance,0.0,0.0);');
 assert.equal(split.split('outputValue = 0.0;').length,3);
 split=split.replaceAll('outputValue = 0.0;','outputValue = vec4(0.0);');
 replace('void main() {',`vec2 splitDirectDensity(vec3 point,vec3 outgoingDirection) {
  float t=sourceTransmittance(point);if(t==0.0)return vec2(0.0);
  Medium m=sampleMediumAtPoint(point);
  return SOURCE_IRRADIANCE*t*vec2(m.rayleighScattering*rayleighPhase(outgoingDirection,SOURCE_DIRECTION),m.mieScattering*miePhase(outgoingDirection,SOURCE_DIRECTION));
 }
 void main() {`);
 return {scalar,split,parameters,templateSource,parent:identity(compilerPath),scope:'Current compiler code, matched registered physical medium, black boundary, selected interval control. Not a deployed-cache capture.'};
}

/** Evaluate scalar and split templates in the same physical frame and GPU.
 * @param {any} request @returns {any} */
export function evaluateCompilerRow(request) {
 const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2',{powerPreference:'high-performance',antialias:false});
 if(!gl||!gl.getExtension('EXT_color_buffer_float'))throw Error('Float hardware WebGL2 required');
 const ext=gl.getExtension('WEBGL_debug_renderer_info'),renderer=String(gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER));
 if(/swiftshader|llvmpipe|software/i.test(renderer))throw Error('Hardware GPU required');
 const N=request.directions.length,frame=gl.createFramebuffer(),vao=gl.createVertexArray(),textures=[],programs=[];
 const vertex='#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}';
 try {
  if(N>gl.getParameter(gl.MAX_TEXTURE_SIZE))throw Error('Compiler-row width exceeds actual hardware limit');
  for(const [unit,data]of [[0,request.directions.flatMap(d=>[...d,0])],[1,null]]) {
   const t=gl.createTexture();textures.push(t);gl.activeTexture(gl.TEXTURE0+Number(unit));gl.bindTexture(gl.TEXTURE_2D,t);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,N,1,0,gl.RGBA,gl.FLOAT,data?Float32Array.from(data):null);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,textures[1],0);
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Compiler-row framebuffer');
  const rows=[];
  for(const fragment of [request.scalar,request.split]) {
   const program=gl.createProgram();programs.push(program);
   for(const [kind,code]of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]) {
    const sh=gl.createShader(Number(kind));gl.shaderSource(sh,String(code));gl.compileShader(sh);
    if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));
    gl.attachShader(program,sh);gl.deleteShader(sh);
   }
   gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
   gl.useProgram(program);gl.bindVertexArray(vao);gl.uniform1i(gl.getUniformLocation(program,'uF68Directions'),0);
   gl.viewport(0,0,N,1);gl.drawArrays(gl.TRIANGLES,0,3);
   const output=new Float32Array(N*4);gl.readPixels(0,0,N,1,gl.RGBA,gl.FLOAT,output);
   if(gl.getError()!==gl.NO_ERROR||gl.isContextLost())throw Error('Compiler-row GPU error');
   rows.push(Array.from(output));
  }
  return {renderer,scalar:request.directions.map((_,i)=>rows[0][4*i]),split:request.directions.map((_,i)=>rows[1].slice(4*i,4*i+2))};
 }finally {
  programs.forEach(p=>gl.deleteProgram(p));textures.forEach(t=>gl.deleteTexture(t));gl.deleteFramebuffer(frame);gl.deleteVertexArray(vao);
  gl.getExtension('WEBGL_lose_context')?.loseContext();canvas.remove();
 }
}
