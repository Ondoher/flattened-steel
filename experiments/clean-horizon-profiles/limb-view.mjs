import * as THREE from 'three';
import {limbGrid} from './limb-grid.mjs';
import {glslFunction,isolatedCompilerGeometry} from './analytic-source.mjs';

/** Read actual path, attenuation and captured surface terms across the limb.
 * @param {string} id Capture identifier.
 * @param {any} request Unchanged cached atmosphere contract.
 * @returns {Promise<any>} Spectra/composition/geometry for native and analytic endpoints.
 */
export async function captureLimbTrace(id,request){
 const G=/** @type {any} */(globalThis),app=G.proofApplication,host=app._sceneRuntime,renderer=host.renderer,gl=renderer.getContext(),composer=app._modeController._activeRuntime._composer,pass=composer.passes.find(p=>p._material?.uniforms?.uColorResetTotalHorizontalIlluminanceLux),original=pass._material,input=composer.readBuffer,count=limbGrid.length,data=new Float32Array(count*4),target=new THREE.WebGLRenderTarget(count,1,{type:THREE.FloatType,format:THREE.RGBAFormat,depthBuffer:false,stencilBuffer:false}),texture=new THREE.DataTexture(data,count,1,THREE.RGBAFormat,THREE.FloatType),previousTarget=renderer.getRenderTarget(),screen=pass.renderToScreen,results=[];
 limbGrid.forEach((q,i)=>data.set([...q.uv,0,1],i*4));texture.needsUpdate=true;
 const initial=glslFunction(original.fragmentShader,'createInitialShaderState'),oldPath=glslFunction(original.fragmentShader,'resolveAtmospherePath'),geometry=isolatedCompilerGeometry(request),composition='return pathLinearSrgb + sceneLinearSrgb * sceneTransmittanceRgb;',encodePattern=/vec4 encodeDisplayOutput\(vec3 linearSrgb\) \{[\s\S]*?\n\}/u;
 if(!original.fragmentShader.includes(composition)||!encodePattern.test(original.fragmentShader))throw Error('Limb shader boundary changed');
 const init='void limbInit(ViewRay ray){analytic_radialAnchorPoint=ray.originMeters;analytic_radialAnchorHeight=length(uCameraGroundRelativePositionMeters);analytic_radialAnchorDirection=ray.direction;analytic_radialAnchorDirectionCosine=dot(normalize(ray.originMeters),ray.direction);analytic_radialAnchorCosine=dot(normalize(ray.originMeters),analytic_SOURCE_DIRECTION);}';
 try{for(const variant of [{id:'stock',intervals:30,analytic:false},{id:'sphere',intervals:30,analytic:true},{id:'sphere-fine',intervals:480,analytic:true}]){
  const material=original.clone();material.fragmentShader='uniform highp sampler2D uLimbQueries;uniform highp int uLimbOutput;\n'+original.fragmentShader
   .replace(initial,initial.replace('{','{\n textureCoordinates=texelFetch(uLimbQueries,ivec2(int(gl_FragCoord.x),0),0).xy;'))
   .replace(encodePattern,'vec4 encodeDisplayOutput(vec3 value){return vec4(value,1.0);\n}')
   .replace(composition,`if(uLimbOutput<15)return vec3(state.pathRadiance.channels[uLimbOutput],state.pathRadiance.channels[uLimbOutput+1],state.pathRadiance.channels[uLimbOutput+2]);
 if(uLimbOutput<30){int c=uLimbOutput-15;return vec3(state.transmittance.channels[c],state.transmittance.channels[c+1],state.transmittance.channels[c+2]);}
 if(uLimbOutput==30){vec3 up=GEOMETRY_OBSERVER_UP_DIRECTION;vec3 center=reconstructViewRay(vec2(0.5)).direction;vec3 toward=normalize(center-up*dot(center,up));return vec3(dot(state.ray.direction,up),dot(state.ray.direction,toward),dot(state.ray.direction,normalize(cross(up,toward))));}
 if(uLimbOutput==33)return vec3(state.bounds.endDistanceMeters,state.bounds.endpointDistanceMeters,state.bounds.hasSceneEndpoint?1.0:0.0);
 if(uLimbOutput==36)return sceneLinearSrgb;
 if(uLimbOutput==39)return spectralRadianceToLinearSrgb(state.pathRadiance);
 if(uLimbOutput==42)return sceneLinearSrgb*sceneTransmittanceRgb;
 if(uLimbOutput==45)return vec3(state.bounds.hasGroundEndpoint?1.0:0.0,shouldApplySceneTransmittance(state)?1.0:0.0,state.sceneHitMask);
 return spectralRadianceToLinearSrgb(state.pathRadiance)+sceneLinearSrgb*sceneTransmittanceRgb;`);
  if(variant.analytic)material.fragmentShader=material.fragmentShader.replace(oldPath,geometry.isolated+'\n'+init+`\nPathBounds resolveAtmospherePath(ViewRay ray,float sceneTerminationMeters,bool hasSceneEndpoint){limbInit(ray);float d=0.0;bool hit=analytic_groundBoundaryHit(ray.originMeters,ray.direction,d);float lengthMeters=analytic_atmosphereBranchLength(ray.originMeters,ray.direction);return PathBounds(0.0,max(0.0,lengthMeters),hit?d:0.0,hit,hit,lengthMeters>=0.0);}`);
  material.uniforms={...original.uniforms,uLimbQueries:{value:texture},uLimbOutput:{value:0},uTransportPathIntervalCount:{value:variant.intervals}};
  try{pass._material=material;pass._mesh.material=material;pass.renderToScreen=false;await renderer.compileAsync(pass._scene,pass._camera);await G.aerosolRetain(id+'-'+variant.id+'-limb.glsl',material.fragmentShader);await G.aerosolProgress('Across-limb GPU '+id+' '+variant.id);const values=[];
   for(const output of [0,3,6,9,12,15,18,21,24,27,30,33,36,39,42,45,48]){material.uniforms.uLimbOutput.value=output;pass.render(renderer,target,input);renderer.setRenderTarget(target);const readback=new Float32Array(count*4);gl.readPixels(0,0,count,1,gl.RGBA,gl.FLOAT,readback);if(gl.getError()!==0||readback.some(v=>!Number.isFinite(v)))throw Error('Invalid across-limb GPU readback');values.push(readback);}
   const triple=(k,i)=>Array.from(values[k].subarray(i*4,i*4+3));results.push({...variant,queries:limbGrid.map((q,i)=>({...q,spectrum:values.slice(0,5).flatMap(v=>Array.from(v.subarray(i*4,i*4+3))),transmittance:values.slice(5,10).flatMap(v=>Array.from(v.subarray(i*4,i*4+3))),rayLocalComponents:triple(10,i),elevationDegrees:Math.atan2(values[10][i*4],Math.hypot(values[10][i*4+1],values[10][i*4+2]))*180/Math.PI,azimuthDegrees:Math.atan2(values[10][i*4+2],values[10][i*4+1])*180/Math.PI,bounds:triple(11,i),sceneLinearRgb:triple(12,i),pathLinearRgb:triple(13,i),surfaceLinearRgb:triple(14,i),flags:triple(15,i),totalLinearRgb:triple(16,i)}))});
  }finally{material.dispose();}
 }}finally{pass._material=original;pass._mesh.material=original;pass.renderToScreen=screen;renderer.setRenderTarget(previousTarget);target.dispose();texture.dispose();}
 return{id,results,operation:'Native4K captured scene-color/depth/hit inputs, exact query UVs and production shader. Stock endpoints plus actual compiler analytic ground termination,30/480view intervals. Path spectra, transmittance and the captured surface contribution remain separate. Subpixel stock queries retain nearest-pixel scene endpoints; analytic variants define the continuous physical-ray comparison.'};
}
