import {isolatedCompilerGeometry,glslFunction} from './analytic-source.mjs';

/** Exercise actual compiler geometry in an owned live-view pass.
 * @param {any} request - The recorded, unchanged N4 build contract.
 * @returns {Promise<any[]>} Physical linear composites and branch diagnostics.
 */
export async function captureAnalyticViews(request){
 const G=/** @type {any} */(globalThis),app=G.proofApplication,scene=app._sceneRuntime,renderer=scene.renderer,gl=renderer.getContext(),composer=G.twilightComposer??app._modeController._activeRuntime._composer,pass=composer.passes.find(p=>p._material?.uniforms?.uColorResetTotalHorizontalIlluminanceLux),original=pass._material,input=composer.readBuffer,geometry=isolatedCompilerGeometry(request),results=[];
 await G.aerosolProgress('Render actual-compiler analytic ground branches');
 const init=`void initAnalyticGround(ViewRay ray){analytic_radialAnchorPoint=ray.originMeters;analytic_radialAnchorHeight=length(uCameraGroundRelativePositionMeters);analytic_radialAnchorDirection=ray.direction;analytic_radialAnchorDirectionCosine=dot(normalize(ray.originMeters),ray.direction);analytic_radialAnchorCosine=dot(normalize(ray.originMeters),analytic_SOURCE_DIRECTION);}`;
 const specs=[{id:'native',branch:'native',layer:0},{id:'cache-hit',branch:'native',layer:1},{id:'cache-length',branch:'native',layer:2},{id:'naive-clip',branch:'naive',layer:0},{id:'consistent',branch:'consistent',layer:0},{id:'consistent-flags',branch:'consistent',layer:3},{id:'consistent-path',branch:'consistent',layer:4}];
 const encode=values=>{const bytes=new Uint8Array(values.buffer);let s='';for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(s);};
 const target=new input.constructor(scene.canvas.width,scene.canvas.height,{type:1015,format:1023,depthBuffer:false,stencilBuffer:false}),oldScreen=pass.renderToScreen,previousTarget=renderer.getRenderTarget();
 try{for(const spec of specs){
  const material=original.clone(),composition='return pathLinearSrgb + sceneLinearSrgb * sceneTransmittanceRgb;',encodePattern=/vec4 encodeDisplayOutput\(vec3 linearSrgb\) \{[\s\S]*?\n\}/u;
  if(!material.fragmentShader.includes(composition)||!encodePattern.test(material.fragmentShader))throw Error('Analytic-view composition boundary changed');
  const oldPath=glslFunction(material.fragmentShader,'resolveAtmospherePath');
  material.fragmentShader='uniform highp int uAnalyticViewLayer;\n'+material.fragmentShader.replace(oldPath,geometry.isolated+'\n'+init+'\n'+oldPath).replace(encodePattern,'vec4 encodeDisplayOutput(vec3 value){return vec4(value,1.0);\n}').replace(composition,`initAnalyticGround(state.ray);float groundDistance=0.0;bool groundHit=analytic_groundBoundaryHit(state.ray.originMeters,state.ray.direction,groundDistance);
 if(uAnalyticViewLayer==1)return vec3(analytic_rayBlockedByGround(state.ray.originMeters,state.ray.direction)?1.0:0.0,groundHit?1.0:0.0,state.bounds.hasSceneEndpoint?1.0:0.0);
 if(uAnalyticViewLayer==2)return vec3(state.bounds.endDistanceMeters,analytic_atmosphereBranchLength(state.ray.originMeters,state.ray.direction),groundDistance);
 if(uAnalyticViewLayer==3)return vec3(state.bounds.hasGroundEndpoint?1.0:0.0,shouldApplySceneTransmittance(state)?1.0:0.0,state.bounds.hasSceneEndpoint?1.0:0.0);
 if(uAnalyticViewLayer==4)return pathLinearSrgb;
 ${composition}`);
  if(spec.branch!=='native')material.fragmentShader=material.fragmentShader.replace(oldPath,`PathBounds resolveAtmospherePath(ViewRay ray,float sceneTerminationMeters,bool hasSceneEndpoint){
 initAnalyticGround(ray);float groundDistance=0.0;bool groundHit=analytic_groundBoundaryHit(ray.originMeters,ray.direction,groundDistance);
 float physicalLength=analytic_atmosphereBranchLength(ray.originMeters,ray.direction);
 if(physicalLength<0.0)return PathBounds(0.0,0.0,0.0,false,false,false);
 float endDistance=hasSceneEndpoint?min(max(sceneTerminationMeters,0.0),physicalLength):physicalLength;
 bool groundEnds=groundHit&&groundDistance<=endDistance+0.001;
 float endpointDistance=${spec.branch==='consistent'?'hasSceneEndpoint&&groundEnds?endDistance:sceneTerminationMeters':'sceneTerminationMeters'};
 return PathBounds(0.0,max(0.0,endDistance),endpointDistance,hasSceneEndpoint,groundEnds,true);
}`);
  material.uniforms={...original.uniforms,uAnalyticViewLayer:{value:spec.layer}};
  try{pass._material=material;pass._mesh.material=material;pass.renderToScreen=false;await renderer.compileAsync(pass._scene,pass._camera);pass.render(renderer,target,input);renderer.setRenderTarget(target);const values=new Float32Array(scene.canvas.width*scene.canvas.height*4);gl.readPixels(0,0,scene.canvas.width,scene.canvas.height,gl.RGBA,gl.FLOAT,values);if(gl.getError()!==0||values.some(v=>!Number.isFinite(v)))throw Error('Invalid analytic-branch view output');results.push({...spec,width:scene.canvas.width,height:scene.canvas.height,linear:encode(values)});}finally{material.dispose();}
 }}finally{pass._material=original;pass._mesh.material=original;pass.renderToScreen=oldScreen;renderer.setRenderTarget(previousTarget);target.dispose();}
 return results;
}
