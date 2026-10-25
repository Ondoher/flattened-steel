import {FLAT32_FIELD_OF_VIEW_PRESETS} from '../../src/flat32/consts.js';

/** Capture the ordinary FOV presets without changing the physical scene.
 * @param {any} control Frozen profile and native output dimensions.
 * @returns {Promise<void>} Retains native images and actual app-state witnesses.
 */
export async function captureFov(control){
 const G=/** @type {any} */(globalThis),app=G.proofApplication,scene=app._sceneRuntime,camera=scene.camera,composer=G.flatPreparedResources.resources.composer,pass=composer.passes.find(p=>p._material?.uniforms?.uColorResetTotalHorizontalIlluminanceLux),gl=scene.renderer.getContext();
 const initial={position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),far:camera.far,height:app._publishedState.observerHeight,profile:control.profile.id,lux:pass._material.uniforms.uColorResetTotalHorizontalIlluminanceLux.value,shader:pass._material.fragmentShader,ground:app._endpointScene._meshes.find(m=>m.name==='flat32-flat-ground-visual').geometry};
 const pack=bytes=>{let s='';for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(s);};
 for(const item of [...FLAT32_FIELD_OF_VIEW_PRESETS,{degrees:50,label:'Default return'}]){
  const id=item.label==='Default return'?'return-50':String(item.degrees);await G.flatProgress('Flat FOV preset '+id);app.setFieldOfView(item.degrees);
  for(let i=0;i<2;i++){scene._renderOperation();await new Promise(r=>requestAnimationFrame(r));}scene._renderOperation();gl.finish();const pixels=new Uint8Array(control.width*control.height*4);gl.readPixels(0,0,control.width,control.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
  const state=app._publishedState,error=gl.getError();if(error!==0||state.cameraFieldOfViewDegrees!==item.degrees||JSON.stringify(camera.position.toArray())!==JSON.stringify(initial.position)||JSON.stringify(camera.quaternion.toArray())!==JSON.stringify(initial.quaternion)||camera.far!==initial.far||pass._material.uniforms.uColorResetTotalHorizontalIlluminanceLux.value!==initial.lux||pass._material.fragmentShader!==initial.shader||app._endpointScene._meshes.find(m=>m.name==='flat32-flat-ground-visual').geometry!==initial.ground)throw Error('FOV sweep changed a protected factor');
  const columns=[control.width/2-1,control.width/2].map(x=>({x,rows:Array.from({length:control.height},(_,y)=>{const offset=((control.height-1-y)*control.width+x)*4;return{y,elevationDegrees:Math.atan((1-2*(y+.5)/control.height)*Math.tan(item.degrees*Math.PI/360))*180/Math.PI,rgba:Array.from(pixels.subarray(offset,offset+4))};})}));
  const facts={id,preset:item,state,height:state.observerHeight,observation:state.observation,profile:control.profile.id,camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),far:camera.far,fov:camera.fov,aspect:camera.aspect},lux:initial.lux,glError:error,columns,viewport:{canvas:[scene.canvas.width,scene.canvas.height],composer:[composer.readBuffer.width,composer.readBuffer.height],sceneColor:[pass._material.uniforms.uSceneColorTexture.value.image.width,pass._material.uniforms.uSceneColorTexture.value.image.height]},visibleObjects:app._endpointScene._meshes.filter(m=>m.visible&&m.name.startsWith('flat32-review-object')).map(m=>m.name),geometryUnchanged:true,physicalShaderUnchanged:true};
  await G.flatRetain('fov-'+(control.heights.length>1?state.observerHeight.value+'-':'')+id+'.rgba',pack(pixels));await G.flatRetain('fov-'+(control.heights.length>1?state.observerHeight.value+'-':'')+id+'.json',facts);
 }
}
