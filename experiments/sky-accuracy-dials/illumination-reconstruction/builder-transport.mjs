import assert from 'node:assert/strict';
import {readRepository,identity} from '../io/files.mjs';
import {createDistantSunSceneCacheCommonShaderSource} from '../../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';

const compilerPath='scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';

/** Adapt the existing path operator to row-specific incoming directions and
 * separate atmospheric last-scattering species. Ground remains explicitly zero;
 * its own boundary recurrence is a later, separate integration obligation.
 * @param {any} f @param {number[]} altitudes @param {number[]} zeniths
 * @param {number} directionsPerRow @param {number} intervals
 * @param {boolean} [vacuum] @param {boolean} [compensated] @returns {any} */
export function transportKernel(f,altitudes,zeniths,directionsPerRow,intervals,vacuum=false,compensated=false){
 const source=readRepository(compilerPath).toString().replaceAll('\r\n','\n'),start=source.indexOf('function transportFragment('),end=source.indexOf('\n/**',start);assert.ok(start>=0&&end>start);const templateSource=source.slice(start,end),template=Function(`${templateSource}\nreturn transportFragment;`)(),p=f.px,spec=f.p.control.request.transportSpec;
 const parameters={wavelengthNanometers:spec.domains.spectrum.channels[f.packet.channel].centerNanometers,sourceIrradiance:p.irradiance,ozoneCrossSection:0,ozoneMaximumDensity:0,rayleighScattering:vacuum?0:p.br,mieExtinction:vacuum?0:p.bm,groundAlbedo:0,bottomRadiusMeters:p.radius,topRadiusMeters:p.radius+p.top,rayleighScaleHeightMeters:8000,mieScaleHeightMeters:1200,rayleighCoefficientScalePerMeter:spec.atmosphere.rayleighCoefficientScalePerMeter,mieAngstromAlpha:spec.atmosphere.mieAngstromAlpha,mieAngstromBeta:spec.atmosphere.mieAngstromBeta,mieSingleScatteringAlbedo:p.ssa,miePhaseFunctionG:spec.atmosphere.miePhaseFunctionG,sourcePathTransmittanceIntervalCount:spec.numerical.sourcePathTransmittanceIntervalCount,incomingDirectionCount:directionsPerRow,transportIntervalCount:intervals,outgoingFaceWidth:spec.domains.outgoing.faceWidth,positionAltitudesMeters:altitudes,solarZenithDegrees:zeniths,coordinateContract:'scene-cache-receiver-local-v1',sourceDirection:[0,0,1],numericalPolicy:spec.numerical.geometryPolicy};
 const common=createDistantSunSceneCacheCommonShaderSource(parameters);let scalar=template(common,false);
 const replaceScalar=(from,to)=>{assert.equal(scalar.split(from).length,2);scalar=scalar.replace(from,to);};
 replaceScalar('texelFetch(uF68Directions, ivec2(directionIndex, 0), 0).xyz','texelFetch(uF68Directions, ivec2(directionIndex, row), 0).xyz');
 if(compensated){
  replaceScalar('void main() {',`void stableAdd(float value,inout float sum,inout float compensation){float y=value-compensation,t=sum+y;compensation=(t-sum)-y;sum=t;}
void stableAdd(vec2 value,inout vec2 sum,inout vec2 compensation){vec2 y=value-compensation,t=sum+y;compensation=(t-sum)-y;sum=t;}
void main() {`);
  replaceScalar('float transmittance = 1.0;','float transmittance = 1.0;\nfloat opticalDepth = 0.0;\nfloat opticalCompensation = 0.0;');
  replaceScalar('float radiance = 0.0;','float radiance = 0.0;\nfloat radianceCompensation = 0.0;');
  replaceScalar('transmittance *= exp(-0.5 * (previousExtinction + medium.extinction) * intervalLength);','stableAdd(0.5 * (previousExtinction + medium.extinction) * intervalLength,opticalDepth,opticalCompensation);\ntransmittance = exp(-opticalDepth);');
  replaceScalar('radiance += transmittance * sampleJ(uPreviousJ, point, direction) * measure;','stableAdd(transmittance * sampleJ(uPreviousJ, point, direction) * measure,radiance,radianceCompensation);');
 }
 let split=scalar;const replace=(from,to)=>{assert.equal(split.split(from).length,2);split=split.replace(from,to);};
 replace('uniform sampler2D uPreviousJ;','uniform sampler2D uPreviousJ;\nuniform sampler2D uPreviousJM;');
 replace('layout(location = 0) out float outputValue;','layout(location = 0) out vec4 outputValue;');replace('float radiance = 0.0;','vec2 radiance = vec2(0.0);');
 if(compensated){replace('float radianceCompensation = 0.0;','vec2 radianceCompensation = vec2(0.0);');replace('stableAdd(transmittance * sampleJ(uPreviousJ, point, direction) * measure,radiance,radianceCompensation);','stableAdd(transmittance * vec2(sampleJ(uPreviousJ, point, direction),sampleJ(uPreviousJM, point, direction)) * measure,radiance,radianceCompensation);');}
 else replace('radiance += transmittance * sampleJ(uPreviousJ, point, direction) * measure;','radiance += transmittance * vec2(sampleJ(uPreviousJ, point, direction),sampleJ(uPreviousJM, point, direction)) * measure;');
 replace('outputValue = radiance;','outputValue = vec4(radiance,0.0,0.0);');assert.equal(split.split('outputValue = 0.0;').length,3);split=split.replaceAll('outputValue = 0.0;','outputValue = vec4(0.0);');
 return {scalar,split,parameters,compensated,parent:identity(compilerPath),templateSource,scope:'Contained black-boundary actual path operator. Separate R/M last-scattering fields and row-specific directions; no ground-boundary implementation or physical-accuracy claim.'};
}

/** Evaluate scalar-sum and split previous-order fields with identical geometry.
 * @param {any} request @returns {any} */
export function transportResident(request){
 const gl=document.createElement('canvas').getContext('webgl2',{powerPreference:'high-performance',antialias:false});if(!gl||!gl.getExtension('EXT_color_buffer_float'))throw Error('Float hardware GPU required');const debug=gl.getExtension('WEBGL_debug_renderer_info'),renderer=String(gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER));if(/software|swiftshader|llvmpipe/i.test(renderer))throw Error('Hardware GPU required');
 const {widthJ,rows,widthL}=request,limit=gl.getParameter(gl.MAX_TEXTURE_SIZE);if(Math.max(widthJ,rows,widthL)>limit)throw Error('Transport field exceeds actual GPU texture dimensions');const textures=[],programs=[],frame=gl.createFramebuffer(),vao=gl.createVertexArray();
 try{
  const arrays=[request.rayleigh,request.mie,request.sum,new Float32Array(widthL*rows),request.directions,null],sizes=[[widthJ,rows],[widthJ,rows],[widthJ,rows],[widthL,rows],[widthL,rows],[widthL,rows]];
  for(let i=0;i<arrays.length;i++){const texture=gl.createTexture();textures.push(texture);const [w,h]=sizes[i],rgba=i>=4;gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,rgba?gl.RGBA32F:gl.R32F,w,h,0,rgba?gl.RGBA:gl.RED,gl.FLOAT,arrays[i]?Float32Array.from(arrays[i]):null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);}
  gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,textures[5],0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Transport framebuffer');gl.bindVertexArray(vao);const results=[];
  for(const [index,fragment]of [request.scalar,request.split].entries()){
   const program=gl.createProgram();programs.push(program);for(const [kind,source]of [[gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}'],[gl.FRAGMENT_SHADER,fragment]]){const shader=gl.createShader(Number(kind));gl.shaderSource(shader,String(source));gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));gl.attachShader(program,shader);gl.deleteShader(shader);}gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
   for(const [name,unit]of [['uPreviousJ',index===0?2:0],['uPreviousJM',1],['uPreviousL',3],['uF68Directions',4]])gl.uniform1i(gl.getUniformLocation(program,String(name)),Number(unit));gl.viewport(0,0,widthL,rows);gl.drawArrays(gl.TRIANGLES,0,3);const values=new Float32Array(widthL*rows*4);gl.readPixels(0,0,widthL,rows,gl.RGBA,gl.FLOAT,values);if(gl.getError()!==gl.NO_ERROR||gl.isContextLost())throw Error('Transport GPU failure');results.push(Array.from(values));
  }
  return {scalar:results[0],split:results[1],renderer,ownedTextureBytes:3*widthJ*rows*4+widthL*rows*4+2*widthL*rows*16};
 }finally{programs.forEach(p=>gl.deleteProgram(p));textures.forEach(t=>gl.deleteTexture(t));gl.deleteFramebuffer(frame);gl.deleteVertexArray(vao);gl.getExtension('WEBGL_lose_context')?.loseContext();}
}
