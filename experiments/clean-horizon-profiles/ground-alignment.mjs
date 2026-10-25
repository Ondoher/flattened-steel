import {ATMOSPHERE_SCENE_SCALE,GROUND_COLOR} from '../../src/flat32/consts.js';

/** Compare the actual raster endpoint with the sphere for the same pixel ray.
 * A second capture refines only the visual ground, leaving cache/atmosphere fixed.
 * @returns {Promise<any[]>} Native/linear images and float hit/distance diagnostics.
 */
export async function captureGroundAlignment(){
 const G=/** @type {any} */(globalThis),app=G.proofApplication,scene=app._sceneRuntime,mode=app._modeController._activeRuntime._mode,renderer=scene.renderer,gl=renderer.getContext(),ground=app._endpointScene._meshes.find(m=>m.userData.algorithm32EndpointRole==='geometry-ground-visual');
 if(!ground)throw Error('Physical ground visual mesh missing');const originalGeometry=ground.geometry,patch=originalGeometry.userData.algorithm32GroundPatch,results=[];
 const encode=values=>{const bytes=new Uint8Array(values.buffer,values.byteOffset,values.byteLength);let s='';for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(s);};
 let refinedGeometry;
 try{for(const segments of [512,1024]){
  if(segments===1024){const endpoints=mode.geometry.createThreeEndpointObjects({sceneScale:ATMOSPHERE_SCENE_SCALE,widthSegments:segments,heightSegments:segments,visualMaterialColor:GROUND_COLOR,groundVisualMesh:{kind:'local-spherical-patch',xExtent:patch.xRange[1],zMin:patch.zRange[0],zMax:patch.zRange[1],surfaceLift:patch.surfaceLift}}),mesh=endpoints.visualObjects[0];refinedGeometry=mesh.geometry;mesh.material.dispose();ground.geometry=refinedGeometry;ground.updateMatrixWorld(true);}
  const capture=await G.twilightCapture({layers:[0],resetHeading:true}),composer=G.twilightComposer??app._modeController._activeRuntime._composer,pass=composer.passes.find(p=>p._material?.uniforms?.uColorResetTotalHorizontalIlluminanceLux),original=pass._material,input=composer.readBuffer;
  const material=original.clone(),needle='return pathLinearSrgb + sceneLinearSrgb * sceneTransmittanceRgb;',encodePattern=/vec4 encodeDisplayOutput\(vec3 linearSrgb\) \{[\s\S]*?\n\}/u;
  if(!material.fragmentShader.includes(needle)||!encodePattern.test(material.fragmentShader))throw Error('Ground-proof shader boundary changed');
  material.uniforms={...original.uniforms,uGroundProofLayer:{value:1}};
  material.fragmentShader='uniform highp int uGroundProofLayer;\n'+material.fragmentShader.replace(encodePattern,'vec4 encodeDisplayOutput(vec3 value){return vec4(value,1.0);\n}').replace(needle,`float observerHeight=length(uCameraGroundRelativePositionMeters);
 float b=dot(state.ray.originMeters,state.ray.direction);
 float c=observerHeight*(2.0*GEOMETRY_BOTTOM_RADIUS_METERS+observerHeight);
 float discriminant=b*b-c;bool analyticHit=b<0.0&&discriminant>=0.0;
 float analyticDistance=analyticHit?c/max(-b+sqrt(max(discriminant,0.0)),1.0):0.0;
 float meshHit=state.bounds.hasSceneEndpoint?1.0:0.0;
 if(uGroundProofLayer==1)return vec3(meshHit,analyticHit?1.0:0.0,abs(meshHit-(analyticHit?1.0:0.0)));
 if(uGroundProofLayer==2)return vec3(state.bounds.endpointDistanceMeters,analyticDistance,analyticHit?1.0:0.0);
 ${needle}`);
  const target=new input.constructor(scene.canvas.width,scene.canvas.height,{type:1015,format:1023,depthBuffer:false,stencilBuffer:false}),screen=pass.renderToScreen,previousTarget=renderer.getRenderTarget(),layers={};
  try{pass._material=material;pass._mesh.material=material;pass.renderToScreen=false;await renderer.compileAsync(pass._scene,pass._camera);for(const layer of [1,2]){material.uniforms.uGroundProofLayer.value=layer;pass.render(renderer,target,input);renderer.setRenderTarget(target);const values=new Float32Array(scene.canvas.width*scene.canvas.height*4);gl.readPixels(0,0,scene.canvas.width,scene.canvas.height,gl.RGBA,gl.FLOAT,values);if(gl.getError()!==0||values.some(v=>!Number.isFinite(v)))throw Error('Invalid ground-proof readback');layers[layer]=encode(values);}}
  finally{pass._material=original;pass._mesh.material=original;pass.renderToScreen=screen;renderer.setRenderTarget(previousTarget);material.dispose();target.dispose();}
  results.push({segments,capture,layers,mesh:{name:ground.name,position:ground.position.toArray(),patch:ground.geometry.userData.algorithm32GroundPatch,vertices:ground.geometry.getAttribute('position').count,triangles:ground.geometry.index.count/3},geometryRadius:mode.geometry.configuration.bottomRadius});
 }}finally{ground.geometry=originalGeometry;refinedGeometry?.dispose();}
 return results;
}
