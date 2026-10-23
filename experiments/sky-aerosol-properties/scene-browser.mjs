import {Flat32Application} from '../../src/flat32/Flat32Application.js';
import {LocationTimeController} from '../../src/flat32/LocationTimeController.js';
import {createDistantSunSceneState} from '../../src/flat32/DistantSunSceneState.js';
import {createDistantSunSceneCacheHttpResolver} from '../../src/flat32/DistantSunSceneCacheResolver.js';
import {loadBrightest2000StellarCatalogPackage} from '../../src/flat32/Brightest2000StellarCatalogPackageLoader.js';
import {loadHumanVisionFilterPackage} from '../../src/flat32/HumanVisionFilterPackageLoader.js';
import {compileDistantSunSceneCacheWavelength} from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER as domain,NATIVE_48_POSITION_DOMAIN_OWNER as runtimePositions} from '../../src/algorithm32/sampling-domains/index.js';
import PacketLayout from '../../src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCachePacketLayout.js';
import {registry} from '@polylith/core';
import * as THREE from 'three';

/** Fail the contained capture without publishing an incomplete comparison. @param {unknown} value @param {string} message @returns {asserts value} */
function requireValue(value,message){if(!value)throw Error(message);}
/** Wait for ordinary presentation boundaries. */
async function frames(){await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}
/** Exact browser byte identity. @param {Uint8Array} bytes */
async function digest(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',Uint8Array.from(bytes).buffer)),v=>v.toString(16).padStart(2,'0')).join('');}
/** Encode binary readback without a giant argument spread. @param {Float32Array} values */
function encode(values){const b=new Uint8Array(values.buffer,values.byteOffset,values.byteLength);let s='';for(let i=0;i<b.length;i+=16384)s+=String.fromCharCode(...b.subarray(i,i+16384));return btoa(s);}

/** Render a complete production scene with an experiment-owned, physically matched source-density atlas.
 * @param {any} control - Captured material, compiler request, source, exposures and registered views.
 */
export async function start(control){
 globalThis['aerosolAtmosphereConstants']=control.constants;
 await registry.start();const controller=new LocationTimeController();let selected=controller.selectLocation(controller.start(),0);selected=controller.selectGlobeTime(selected,1);
 const state=createDistantSunSceneState({observation:selected.observation,observerHeight:{value:5,units:'meters'},observerUpDirection:[0,0,1]});
 requireValue(Math.abs(state.solarZenithDegrees-control.solarZenithDegrees)<1e-8,'Scene source differs from the measured noon source.');
 const catalog=await loadBrightest2000StellarCatalogPackage(),vision=await loadHumanVisionFilterPackage();
 const app=/** @type {any} */(new Flat32Application(document.getElementById('main-content'),{initialModeKind:'spherical-distant',reviewObjectsEnabled:true,cameraFieldOfViewDegrees:50,stellarCatalog:'brightest-2000',brightest2000StellarCatalogDefinition:catalog,scotopicLuminanceWeights:vision.scotopicLuminanceWeights,resolveDistantSunSceneCacheAsset:createDistantSunSceneCacheHttpResolver()}));
 // Only this application instance starts at the registered observation; no UI transition or production source edit.
 app._locationTimeController.selectTime=()=>selected;
 let array,compute;
 const dispose=()=>{app.dispose();array?.dispose();compute?.getExtension('WEBGL_lose_context')?.loseContext();};
 globalThis['aerosolSceneDispose']=dispose;window.addEventListener('beforeunload',dispose,{once:true});
 app.start();
 async function ready(height){const deadline=performance.now()+180000;while(performance.now()<deadline){const shell=document.querySelector('.flat32-shell');requireValue(!['failed','atmosphere-failed'].includes(shell?.getAttribute('data-flat32-state')),shell?.textContent??'');app._sceneRuntime?._renderFrame();if(shell?.getAttribute('data-flat32-state')==='ready'&&app._publishedState?.observerHeight?.value===height&&app._publishedState?.observation.instant===selected.observation.instant)return;await new Promise(r=>setTimeout(r,100));}throw Error('Scene publication timeout.');}
 await ready(5);const scene=app._sceneRuntime,runtime=app._modeController._activeRuntime,mode=runtime._mode,algorithm=mode.algorithm32,attachment=mode.lightSource.sharedCacheAttachment,atlas=attachment._controller._published.atlas;
 const initial=attachment._controller._published,slots=atlas.getSlots().filter(s=>s.lease),required=new Set(initial.snapshot.requiredBlockIds);
 requireValue(slots.length>0&&[...required].every(id=>slots.some(s=>s.block.id===id)),'Incomplete startup address atlas.');
 const atmosphere=algorithm.config.config.atmosphere;
 requireValue(atmosphere.constants.mieScaleHeight.value===control.medium.mieHeight&&atmosphere.constants.mieSingleScatteringAlbedo===control.medium.albedo&&atmosphere.constants.miePhaseFunctionG===control.medium.g,'Live material constants differ.');
 const coefficientError=Math.max(...control.medium.mie.map((x,i)=>x===0?Math.abs(atmosphere.seaLevelMieExtinction.values[i]):Math.abs(atmosphere.seaLevelMieExtinction.values[i]/x-1)),...control.medium.rayleigh.map((x,i)=>Math.abs(atmosphere.seaLevelRayleighScattering.values[i]/x-1)));
 requireValue(coefficientError<1e-12,'Live spectral optics differ from compiler.');
 const gl=scene.canvas.getContext('webgl2');requireValue(gl,'Renderer context missing.');const debug=gl.getExtension('WEBGL_debug_renderer_info'),renderer=String(gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER));requireValue(!/software|swiftshader|llvmpipe/i.test(renderer),'Hardware GPU required.');
 const computeCanvas=document.createElement('canvas');compute=computeCanvas.getContext('webgl2',{powerPreference:'high-performance'});requireValue(compute,'Compiler context missing.');
 const coordinates=[],offsets=[];for(const slot of slots){offsets.push(coordinates.length);coordinates.push(...slot.block.coordinates);}
 const runtimeHeights=runtimePositions.nodes.map(n=>n.coordinate.value),compilerHeights=control.request.transportSpec.domains.position.nodes.map(n=>n.altitudeMeters),compilerCoordinates=coordinates.map(([alt,z])=>{requireValue(alt<runtimeHeights.length,'Runtime height index outside N48.');const i=compilerHeights.findIndex(v=>Math.abs(v-runtimeHeights[alt])<1e-8);requireValue(i>=0,'Runtime physical height absent from compiler grid.');return[i,z];}),coordinateMapIdentity=control.productionNumerics?'physical-height-exact-N48-in-N48-v1':'physical-height-exact-N48-in-N51-v1';
 const ledger=/** @type {any} */({retainedBlockCount:coordinates.length,rows:compilerCoordinates.map(([alt,z],i)=>({altitudeIndex:alt,firstSolarZenithIndex:z,lastSolarZenithIndex:z,firstPackedRow:i}))});
 await globalThis['aerosolRetain']('layout.json',{coordinateMapIdentity,runtimeHeights,compilerHeights,compilerCoordinates,observation:selected.observation,solarZenithDegrees:state.solarZenithDegrees,slots:slots.map(s=>({id:s.block.id,index:s.index,coordinates:s.block.coordinates})),coordinates,coefficientError,liveConstants:atmosphere.constants,rayleigh:atmosphere.seaLevelRayleighScattering.values,mie:atmosphere.seaLevelMieExtinction.values,source:mode.lightSource.configuration.sourceIrradiance,atlasStorage:atlas.array.storage,renderer,initialSnapshot:initial.snapshot,operation:'Startup atlas supplies N48 address metadata only. Compiler rows are selected by exact physical height; request and mapping record the complete construction grid.'});
 const packets=slots.map(()=>new Float32Array(atlas.array.storage.width*atlas.array.storage.height*4)),layout=new PacketLayout(),count=domain.directionCount,baseAddress=new Uint32Array(64*count);
 for(let row=0;row<64;row++)for(let d=0;d<count;d++){const a=layout.resolveDestination(0,row,d,0);baseAddress[row*count+d]=(a.y*atlas.array.storage.width+a.x)*4;}
 const reports=[];
 if(control.reuseRoot){const old=await(await fetch('/reuse-layout.json')).json();requireValue(old.coordinateMapIdentity===coordinateMapIdentity&&JSON.stringify(old.compilerCoordinates)===JSON.stringify(compilerCoordinates)&&JSON.stringify(old.coordinates)===JSON.stringify(coordinates)&&JSON.stringify(old.slots)===JSON.stringify(slots.map(s=>({id:s.block.id,index:s.index,coordinates:s.block.coordinates}))),'Reused coefficient addresses or physical-height mapping differ.');}
 cancelAnimationFrame(scene._frameRequest);scene._frameRequest=null;scene._frameCadence='manual';
 try{for(let channel=0;channel<15;channel++){
  await globalThis['aerosolProgress']((control.reuseRoot?'Reuse cumulative scene channel ':'Compile matched scene channel ')+channel+'/14');const started=performance.now();let witness;
  async function retainAndPack(values){
   requireValue(values.length===coordinates.length*count,'Incomplete cumulative readback.');const shift=Math.floor(channel/4)*162*4+channel%4;
   for(let b=0;b<slots.length;b++)for(let row=0;row<slots[b].block.rowCount;row++)for(let d=0;d<count;d++){const value=values[(offsets[b]+row)*count+d];requireValue(Number.isFinite(value)&&value>=0,'Invalid cumulative density.');packets[b][baseAddress[row*count+d]+shift]=value;}
   witness=Array.from(values.subarray(0,Math.min(32,values.length)));if(!control.reuseRoot)await globalThis['aerosolLayer'](channel,encode(values));
  }
  let report;
  if(control.reuseRoot){const values=new Float32Array(await(await fetch('/reuse-channel-'+channel+'.bin')).arrayBuffer());await retainAndPack(values);report=control.reusedBuild.reports[channel].report;}
  else report=await compileDistantSunSceneCacheWavelength({gl:compute,buildRequest:control.request,wavelengthIndex:channel,compileSceneCaches:true,sceneCacheRequests:[{cacheIdentity:'aerosol-scene-H'+control.medium.mieHeight,ledger}],onSceneCacheLayer:async({values})=>retainAndPack(values),reportProgress:async stage=>{if(stage==='programs-compiled'||stage.endsWith(':180/180'))await globalThis['aerosolProgress']('channel'+channel+' '+stage);}});
  reports.push({channel,operation:control.reuseRoot?'Authenticated row reuse and packet packing':'Full N1-4 recurrence and extraction',milliseconds:performance.now()-started,witness,report});
 }}finally{compute.getExtension('WEBGL_lose_context')?.loseContext();compute=null;}
 array=attachment._backend.allocatePersistentArray({id:'aerosol-scenes-'+control.medium.mieHeight,valueKey:'cache.sharedPacketAtlas',storage:atlas.array.storage,maximumBytes:atlas.array.byteLength});
 const packetReports=[];for(let i=0;i<slots.length;i++){const hash=await digest(new Uint8Array(packets[i].buffer));attachment._backend.uploadPersistentArrayLayer({array,layer:slots[i].index,identity:hash,values:packets[i]});packetReports.push({slot:slots[i].index,block:slots[i].block.id,sha256:hash});await globalThis['aerosolProgress']('Uploaded matched packet '+i+'/'+slots.length);}
 await globalThis['aerosolRetain']('build.json',{reports,packetReports,coefficientReuse:control.reuseRoot??null,logicalCandidateAtlasBytes:array.byteLength,material:control.medium,displayLux:control.fixedLux,viewPathIntervals:30,viewPathDistribution:'production quadratic-near-observer-v1'});
 const sun=state.geometry.expressCelestialDirectionInScene(state.directionToSourceModel),horizontal=Math.hypot(sun[0],sun[2]);
 let measuredHeight=-1;
 globalThis['aerosolSceneView']=async(view)=>{
  scene._frameCadence='on-demand';if(app._publishedState.observerHeight.value!==view.height){app.setObserverHeight({value:view.height,units:'meters'});await ready(view.height);}
  const active=app._modeController._activeRuntime._mode.lightSource.sharedCacheAttachment,current=active._controller._published;
  requireValue(current.snapshot.requiredBlockIds.every(id=>slots.some(s=>s.block.id===id)),'Height requires an unbuilt block.');
  for(const slot of current.atlas.getSlots().filter(s=>current.snapshot.requiredBlockIds.includes(s.block.id)))requireValue(slots.some(b=>b.block.id===slot.block.id&&b.index===slot.index),'Atlas address moved during live elevation.');
  active._active.publish({...current,atlas:undefined,snapshot:{...current.snapshot,generation:current.snapshot.generation+100000},bindings:[array.runtimeBinding,...current.bindings.slice(1)]});
  const activeRuntime=app._modeController._activeRuntime,activeMode=activeRuntime._mode,alg=activeMode.algorithm32;
  if(measuredHeight!==view.height){await activeRuntime._shaderHandle.measureReceiverEnvironmentLight({THREE,renderer:scene.renderer,backend:activeRuntime._cacheBackend,signal:new AbortController().signal});app._endpointScene.updateDistantSunLighting(activeMode.geometry.configuration.directionToSource,alg.receiverLight,alg.config.config.color);scene.refreshShadowMaps();measuredHeight=view.height;}
  const physicalReceiverLight=alg.receiverLight;alg._colorRuntimeBindingValues['color.totalHorizontalIlluminance.value']=control.fixedLux;alg.setAdaptingLuminance({value:control.fixedLux/Math.PI,units:'cd m^-2'});
  app.setFieldOfView(view.fov);const az=view.heading*Math.PI/180,pitch=view.pitch*Math.PI/180,x=sun[0]/horizontal,z=sun[2]/horizontal,d=[(x*Math.cos(az)+z*Math.sin(az))*Math.cos(pitch),Math.sin(pitch),(z*Math.cos(az)-x*Math.sin(az))*Math.cos(pitch)];
  scene.camera.lookAt(scene.camera.position.x+d[0],scene.camera.position.y+d[1],scene.camera.position.z+d[2]);scene.camera.updateMatrixWorld(true);
  cancelAnimationFrame(scene._frameRequest);scene._frameRequest=null;scene._frameCadence='manual';for(let i=0;i<4;i++){scene._renderFrame();await frames();}gl.finish();
  requireValue(gl.getError()===gl.NO_ERROR&&scene.canvas.dataset.flat32RenderPath==='algorithm32','Invalid final scene render.');
  return {view,observation:app._publishedState.observation,observerHeight:app._publishedState.observerHeight,physicalHeight:app._modeController._activeRuntime._mode.observerHeight,cameraPosition:scene.camera.position.toArray(),direction:d,verticalFov:scene.camera.fov,aspect:scene.camera.aspect,fixedLux:alg.totalHorizontalIlluminance,exposureMultiplier:control.exposureMultiplier??1,physicalReceiverLight,receiverLightingRemeasuredAfterAtlasPublication:true,viewport:{width:scene.canvas.width,height:scene.canvas.height},dataset:{...scene.canvas.dataset},renderer,coefficientError,requiredBlocks:current.snapshot.requiredBlockIds,packetReports,frame:scene.canvas.dataset.flat32FrameCount};
 };
 return {ready:true,renderer,medium:control.medium,coordinates:coordinates.length,slots:slots.length};
}
