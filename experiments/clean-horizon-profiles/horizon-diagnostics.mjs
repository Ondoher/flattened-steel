/** Diagnostic-only shader interventions on an owned capture instance.
 * Separates atmospheric path radiance, attenuated scene contribution and endpoints.
 * @returns {Promise<any[]>} Raw float images and exact intervention descriptions.
 */
export async function captureHorizonDiagnostics(){
 const G=/** @type {any} */(globalThis),app=G.proofApplication,scene=app._sceneRuntime,renderer=scene.renderer,gl=renderer.getContext(),composer=G.twilightComposer??app._modeController._activeRuntime._composer;
 const pass=composer.passes.find(p=>p._material?.uniforms?.uColorResetTotalHorizontalIlluminanceLux),original=pass._material,input=composer.readBuffer,width=scene.canvas.width,height=scene.canvas.height;
 const previousTarget=renderer.getRenderTarget(),screen=pass.renderToScreen,refresh=pass._refreshUniformValues,intervals=original.uniforms.uTransportPathIntervalCount.value,results=[];
 const encode=values=>{const bytes=new Uint8Array(values.buffer);let s='';for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(s);};
 const target=new input.constructor(width,height,{type:1015,format:1023,depthBuffer:false,stencilBuffer:false});
 const specs=[{id:'original-total',layer:0,intervals:30},{id:'original-path',layer:1,intervals:30},{id:'original-scene',layer:2,intervals:30},{id:'original-endpoint',layer:3,intervals:30},{id:'fine-total',layer:0,intervals:480},{id:'fine-path',layer:1,intervals:480},{id:'sphere-total',layer:0,intervals:30,sphere:true},{id:'sphere-path',layer:1,intervals:30,sphere:true}];
 try{for(const spec of specs){
  const material=original.clone();material.uniforms={...original.uniforms,uHorizonLayer:{value:spec.layer}};
  const encodePattern=/vec4 encodeDisplayOutput\(vec3 linearSrgb\) \{[\s\S]*?\n\}/u,composition='return pathLinearSrgb + sceneLinearSrgb * sceneTransmittanceRgb;';
  if(!encodePattern.test(material.fragmentShader)||!material.fragmentShader.includes(composition))throw Error('Diagnostic shader boundary changed');
  material.fragmentShader='uniform highp int uHorizonLayer;\n'+material.fragmentShader.replace(encodePattern,'vec4 encodeDisplayOutput(vec3 value){return vec4(value,1.0);\n}').replace(composition,`if(uHorizonLayer==1)return pathLinearSrgb;
 if(uHorizonLayer==2)return sceneLinearSrgb*sceneTransmittanceRgb;
 if(uHorizonLayer==3)return vec3(state.bounds.hasSceneEndpoint?1.0:0.0, state.bounds.endpointDistanceMeters/500000.0, state.bounds.endDistanceMeters/500000.0);
 ${composition}`);
  if(spec.sphere){const needle=/bool hasGroundEndpoint = false;/u;if(!needle.test(material.fragmentShader))throw Error('Ground diagnostic boundary changed');material.fragmentShader=material.fragmentShader.replace(needle,`bool hasGroundEndpoint=false;
 float stableHeight=length(uCameraGroundRelativePositionMeters);
 float groundConstant=stableHeight*(2.0*GEOMETRY_BOTTOM_RADIUS_METERS+stableHeight);
 float groundDiscriminant=halfLinear*halfLinear-groundConstant;
 if(halfLinear<0.0 && groundDiscriminant>=0.0){
  float groundDistance=groundConstant/max(-halfLinear+sqrt(groundDiscriminant),1.0);
  boundaryDistanceMeters=min(boundaryDistanceMeters,groundDistance);hasGroundEndpoint=true;
 }`);}
  try{pass._material=material;pass._mesh.material=material;pass.renderToScreen=false;pass._refreshUniformValues=()=>{refresh.call(pass);material.uniforms.uTransportPathIntervalCount.value=spec.intervals;};await renderer.compileAsync(pass._scene,pass._camera);pass.render(renderer,target,input);renderer.setRenderTarget(target);const values=new Float32Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.FLOAT,values);if(gl.getError()!==0||values.some(v=>!Number.isFinite(v)))throw Error('Invalid horizon diagnostic float readback');results.push({...spec,width,height,linear:encode(values)});}finally{material.dispose();}
 }}finally{pass._material=original;pass._mesh.material=original;pass.renderToScreen=screen;pass._refreshUniformValues=refresh;original.uniforms.uTransportPathIntervalCount.value=intervals;renderer.setRenderTarget(previousTarget);target.dispose();}
 return results;
}
