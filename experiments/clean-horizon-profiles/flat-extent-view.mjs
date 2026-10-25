import * as THREE from 'three';

/** Test distant ground coverage without replacing the existing local mesh or cache.
 * @param {any} control Frozen capture dimensions and requested extension factor.
 * @returns {Promise<void>} Retains each image and diagnostic in the owned run.
 */
export async function captureExtent(control){
 const G=/** @type {any} */(globalThis),app=G.proofApplication,scene=app._sceneRuntime,camera=scene.camera,ground=app._endpointScene._meshes.find(m=>m.name==='flat32-flat-ground-visual');
 if(!ground)throw Error('Original flat ground mesh missing');
 const composer=G.flatPreparedResources.resources.composer,pass=composer.passes.find(p=>p._material?.uniforms?.uColorResetTotalHorizontalIlluminanceLux),gl=scene.renderer.getContext(),originalMaterial=pass._material,oldFar=camera.far,oldFov=camera.fov;
 const base=ground.geometry.parameters.width/2,outer=base*4,geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([-outer,-outer,0,outer,-outer,0,outer,outer,0,-outer,outer,0,-base,-base,0,base,-base,0,base,base,0,-base,base,0],3));
 geometry.setIndex([0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7]);geometry.computeVertexNormals();
 const extension=new THREE.Mesh(geometry,ground.material);extension.name='experiment-flat-ground-extension';extension.position.copy(ground.position);extension.quaternion.copy(ground.quaternion);extension.scale.copy(ground.scale);extension.layers.mask=ground.layers.mask;extension.receiveShadow=ground.receiveShadow;extension.castShadow=ground.castShadow;extension.userData={...ground.userData};ground.parent.add(extension);
 const originalGeometry=ground.geometry,originalPositions=Array.from(originalGeometry.attributes.position.array),position=camera.position.toArray(),quaternion=camera.quaternion.toArray(),source=app._modeController.currentMode.geometry.resolveSourceRelativePosition({position:app._modeController.currentMode.geometry.mapObserverLocalScenePointToModelPosition({coordinates:position,units:'scene-units'},{sceneScale:app._modeController.currentMode.sceneScale})}),lighting=app._endpointScene.describe(),lux=originalMaterial.uniforms.uColorResetTotalHorizontalIlluminanceLux.value;
 const pack=bytes=>{let s='';for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(s);};
 const material=originalMaterial.clone(),needle='outColor = state.outputRgba;';if(material.fragmentShader.split(needle).length!==2)throw Error('Actual shader output boundary changed');material.fragmentShader=material.fragmentShader.replace(needle,'outColor = vec4(state.sceneHitMask,sceneTerminationMetersFromDepth(state.sceneDepth),state.bounds.endDistanceMeters,1.0);');material.uniforms={...originalMaterial.uniforms};
 const target=new THREE.WebGLRenderTarget(control.width,control.height,{type:THREE.FloatType,format:THREE.RGBAFormat,depthBuffer:false,stencilBuffer:false});
 try{
  for(const fov of [50,5])for(const variant of [{id:'baseline',extended:false,far:oldFar},{id:'extended',extended:true,far:oldFar},{id:'extended-far',extended:true,far:oldFar*4},{id:'baseline-return',extended:false,far:oldFar}]){
   const id=variant.id+'-fov'+fov;await G.flatProgress('Ground extent control '+id);extension.visible=variant.extended;camera.far=variant.far;camera.fov=fov;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
   for(let i=0;i<2;i++){scene._renderOperation();await new Promise(r=>requestAnimationFrame(r));}scene._renderOperation();gl.finish();const pixels=new Uint8Array(control.width*control.height*4);gl.readPixels(0,0,control.width,control.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   const screen=pass.renderToScreen,previousTarget=scene.renderer.getRenderTarget();let values;
   try{pass._material=material;pass._mesh.material=material;pass.renderToScreen=false;pass.render(scene.renderer,target,composer.readBuffer);scene.renderer.setRenderTarget(target);values=new Float32Array(control.width*control.height*4);gl.readPixels(0,0,control.width,control.height,gl.RGBA,gl.FLOAT,values);}finally{pass._material=originalMaterial;pass._mesh.material=originalMaterial;pass.renderToScreen=screen;scene.renderer.setRenderTarget(previousTarget);}
   const error=gl.getError();if(error!==0)throw Error('Ground extent WebGL error '+error);
   const columns=[-256,-64,0,64,256].map(offset=>{const x=control.width/2+offset;return{x,rows:Array.from({length:control.height},(_,y)=>{const i=((control.height-1-y)*control.width+x)*4;return{y,hit:values[i],endpointMeters:values[i+1],atmosphereEndMeters:values[i+2],rgba:Array.from(pixels.subarray(i,i+4))};})};});
   const currentGroundPositions=Array.from(ground.geometry.attributes.position.array);if(ground.geometry!==originalGeometry||JSON.stringify(originalPositions)!==JSON.stringify(currentGroundPositions)||JSON.stringify(position)!==JSON.stringify(camera.position.toArray())||JSON.stringify(quaternion)!==JSON.stringify(camera.quaternion.toArray())||originalMaterial.uniforms.uColorResetTotalHorizontalIlluminanceLux.value!==lux)throw Error('Protected geometry, camera pose or lighting changed');
   const facts={id,variant,fov,height:app._publishedState.observerHeight,state:app._publishedState,camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),far:camera.far,fov:camera.fov,aspect:camera.aspect},profile:control.profile.id,source,lighting,lux,glError:error,baseWidthSceneUnits:base*2,outerWidthSceneUnits:outer*2,metersPerSceneUnit:1000,originalTriangleCount:originalGeometry.index.count/3,extensionTriangleCount:geometry.index.count/3,extensionVisible:extension.visible,originalGeometryUnchanged:true,cacheUnchanged:true,originalShader:originalMaterial.fragmentShader,columns};
   await G.flatRetain('extent-'+id+'.rgba',pack(pixels));await G.flatRetain('extent-'+id+'.json',facts);
  }
 }finally{camera.far=oldFar;camera.fov=oldFov;camera.updateProjectionMatrix();extension.removeFromParent();geometry.dispose();material.dispose();target.dispose();}
}
