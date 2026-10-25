/** Return actual output and input sizes from the live staged composer.
 * @returns {any} Pixel dimensions, recorded after the complete captured frame.
 */
export function viewportFacts(){
 const G=/** @type {any} */(globalThis),app=G.proofApplication,host=app._sceneRuntime,composer=app._modeController._activeRuntime._composer,pass=composer.passes.find(p=>p._material?.uniforms?.uColorResetTotalHorizontalIlluminanceLux),u=pass._material.uniforms,size=texture=>[texture.image.width,texture.image.height];
 return{canvas:[host.canvas.width,host.canvas.height],composerRead:[composer.readBuffer.width,composer.readBuffer.height],composerWrite:[composer.writeBuffer.width,composer.writeBuffer.height],sceneColor:size(u.uSceneColorTexture.value),sceneDepth:size(u.uSceneDepthTexture.value),sceneHit:size(u.uSceneHitTexture.value),shaderViewport:Array.from(u.uViewportSizePixels.value),captureViewport:pass._sceneInputCapture.viewportSize};
}

/** Resize the active staged composition, not only its borrowed output canvas.
 * @param {{width:number,height:number}} dimensions Desired native raster dimensions, DPR1.
 */
export async function resizeScene({width,height}){
 const G=/** @type {any} */(globalThis),app=G.proofApplication;
 document.querySelector('style').textContent=`html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden}.flat32-viewport{width:${width}px;height:${height}px}.flat32-canvas{display:block;width:100%;height:100%}.flat32-scene-controls,.flat32-time-panel{display:none}`;
 await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 app._sceneRuntime._configureViewport();
 const composer=app._modeController._activeRuntime._composer;composer.setPixelRatio(1);composer.setSize(width,height);
}
