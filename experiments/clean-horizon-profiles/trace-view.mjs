import * as THREE from 'three';
import {verticalTraceGrid} from './trace-grid.mjs';
import {glslFunction} from './analytic-source.mjs';

/** Sample the live production transport/cache shader at exact vertical query rays.
 * @param {string} id Current authenticated scene-capture identity.
 * @param {any[]} [queries] Explicit camera UVs for the registered physical reference rays.
 * @returns {Promise<any>} Native15 atmospheric radiance, actual ray angles and raw RGB.
 */
export async function captureVerticalTrace(id,queries=verticalTraceGrid){
 const G=/** @type {any} */(globalThis),app=G.proofApplication,scene=app._sceneRuntime,renderer=scene.renderer,gl=renderer.getContext(),composer=app._modeController._activeRuntime._composer,pass=composer.passes.find(p=>p._material?.uniforms?.uColorResetTotalHorizontalIlluminanceLux),original=pass._material,input=composer.readBuffer,count=queries.length,data=new Float32Array(count*4),previousTarget=renderer.getRenderTarget(),screen=pass.renderToScreen;
 queries.forEach((q,i)=>data.set([...q.uv,0,1],i*4));const texture=new THREE.DataTexture(data,count,1,THREE.RGBAFormat,THREE.FloatType);texture.needsUpdate=true;
 const target=new THREE.WebGLRenderTarget(count,1,{type:THREE.FloatType,format:THREE.RGBAFormat,depthBuffer:false,stencilBuffer:false}),material=original.clone(),reconstruct=glslFunction(material.fragmentShader,'reconstructViewRay'),bounds=glslFunction(material.fragmentShader,'resolveAtmospherePath'),composition='return pathLinearSrgb + sceneLinearSrgb * sceneTransmittanceRgb;',encodePattern=/vec4 encodeDisplayOutput\(vec3 linearSrgb\) \{[\s\S]*?\n\}/u;
 if(!material.fragmentShader.includes(composition)||!encodePattern.test(material.fragmentShader))throw Error('Trace shader boundary changed');
 material.fragmentShader='uniform highp sampler2D uTraceQueries;uniform highp int uTraceBase;\n'+material.fragmentShader.replace(reconstruct,reconstruct.replace('reconstructViewRay','traceBaseViewRay')+'\nViewRay reconstructViewRay(vec2 ignored){return traceBaseViewRay(texelFetch(uTraceQueries,ivec2(int(gl_FragCoord.x),0),0).xy);}')
 .replace(bounds,bounds.replace('{','{\n hasSceneEndpoint=false;sceneTerminationMeters=0.0;'))
 .replace(encodePattern,'vec4 encodeDisplayOutput(vec3 value){return vec4(value,1.0);\n}')
 .replace(composition,`if(uTraceBase<15)return vec3(state.pathRadiance.channels[uTraceBase],state.pathRadiance.channels[uTraceBase+1],state.pathRadiance.channels[uTraceBase+2]);
 if(uTraceBase==15){vec3 up=GEOMETRY_OBSERVER_UP_DIRECTION;vec3 center=traceBaseViewRay(vec2(0.5)).direction;vec3 toward=normalize(center-up*dot(center,up));vec3 across=normalize(cross(up,toward));return vec3(dot(state.ray.direction,up),dot(state.ray.direction,toward),dot(state.ray.direction,across));}
 if(uTraceBase==21)return vec3(state.bounds.endDistanceMeters,state.bounds.hasSceneEndpoint?1.0:0.0,state.bounds.hasGroundEndpoint?1.0:0.0);
 return spectralRadianceToLinearSrgb(state.pathRadiance);`);
 material.uniforms={...original.uniforms,uTraceQueries:{value:texture},uTraceBase:{value:0},uTransportPathIntervalCount:{value:30}};const results=[];
 try{
  pass._material=material;pass._mesh.material=material;pass.renderToScreen=false;await renderer.compileAsync(pass._scene,pass._camera);await G.aerosolRetain(id+'-trace.glsl',material.fragmentShader);
  for(const intervals of [30,480]){
   await G.aerosolProgress('GPU native15 vertical trace '+id+' with '+intervals+' view intervals');material.uniforms.uTransportPathIntervalCount.value=intervals;const values=[];
   for(const base of [0,3,6,9,12,15,18,21]){material.uniforms.uTraceBase.value=base;pass.render(renderer,target,input);renderer.setRenderTarget(target);const readback=new Float32Array(count*4);gl.readPixels(0,0,count,1,gl.RGBA,gl.FLOAT,readback);if(gl.getError()!==0||readback.some(v=>!Number.isFinite(v)))throw Error('Invalid GPU vertical trace');values.push(readback);}
   results.push({intervals,queries:queries.map((q,i)=>({...q,spectrum:values.slice(0,5).flatMap(v=>Array.from(v.subarray(i*4,i*4+3))),rayLocalComponents:Array.from(values[5].subarray(i*4,i*4+3)),elevationDegrees:Math.atan2(values[5][i*4],Math.hypot(values[5][i*4+1],values[5][i*4+2]))*180/Math.PI,azimuthDegrees:Math.atan2(values[5][i*4+2],values[5][i*4+1])*180/Math.PI,endDistanceMeters:values[7][i*4],hasSceneEndpoint:values[7][i*4+1],hasGroundEndpoint:values[7][i*4+2],linearRgb:Array.from(values[6].subarray(i*4,i*4+3))}))});
  }
 }finally{pass._material=original;pass._mesh.material=original;pass.renderToScreen=screen;renderer.setRenderTarget(previousTarget);material.dispose();target.dispose();texture.dispose();}
 return{id,results,operation:'Actual live transport/cache GLSL, query UV replaces only reconstructed view direction; scene endpoints disabled for above-limb atmospheric spectra. Native15 pathRadiance is read before display/scene/celestial composition. 480interval diagnostic changes view quadrature only, reusing the N4 field.'};
}
