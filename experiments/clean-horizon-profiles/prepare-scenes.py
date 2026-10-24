"""Adapt retained capture helpers into this lane; never modify their parent sources."""
import pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
DEST=pathlib.Path(__file__).resolve().parent
def replace(text,old,new):
 assert text.count(old)==1,old
 return text.replace(old,new)
probe=(ROOT/'experiments/twilight-exposure/browser.mjs').read_text()
probe=replace(probe,'const pitch = -6 * Math.PI / 180, sign', 'const pitch = -Math.acos(6360000 / (6360000 + a._publishedState.observerHeight.value)), sign')
probe=replace(probe,'meterLux: original.uniforms.uColorResetTotalHorizontalIlluminanceLux.value,','meterLux: original.uniforms.uColorResetTotalHorizontalIlluminanceLux.value, displayLux: original.uniforms.uColorResetDisplayAdaptationIlluminanceLux.value,')
probe=replace(probe,"if (!material.fragmentShader.includes('vec3 filteredStellarLinearSrgb =')) throw Error('Expected stellar source projection unavailable');", "if ((spec.layers ?? [0]).some(layer => layer !== 0)) throw Error('ARM scene probe captures total linear composition only');")
probe=replace(probe,".replace('return pathLinearSrgb + sceneLinearSrgb * sceneTransmittanceRgb;', 'if(uTwilightLayer==1)return filteredStellarLinearSrgb;\\n if(uTwilightLayer==2)return spectralRadianceToLinearSrgb(state.pathRadiance);\\n return pathLinearSrgb + sceneLinearSrgb * sceneTransmittanceRgb;')",'')
(DEST/'scene-probe.mjs').write_text(probe,encoding='utf-8')
text=(ROOT/'experiments/sky-aerosol-properties/scene-browser.mjs').read_text()
text="import {installProbe} from './scene-probe.mjs';\n"+text
text=replace(text,"globalThis['aerosolAtmosphereConstants']=control.constants;","globalThis['armSceneModel']=control.profile;")
text=replace(text,'selected=controller.selectGlobeTime(selected,1);',"selected=controller.selectGlobeTime(selected,control.time==='noon'?1:2);")
text=replace(text,'await ready(5);const scene=',"await ready(5);globalThis['proofApplication']=app;installProbe();for(const h of [100,500,2000,40000,5]){app.setObserverHeight({value:h,units:'meters'});await ready(h);}const scene=")
text=replace(text,'slots=atlas.getSlots().filter(s=>s.lease)','slots=atlas.getSlots()')
text=replace(text,'const initial=attachment._controller._published,slots=', 'let initial=attachment._controller._published,slots=')
text=replace(text,'const sun=state.geometry.expressCelestialDirectionInScene', 'let sun=state.geometry.expressCelestialDirectionInScene')
text=replace(text,"const physicalReceiverLight=alg.receiverLight;alg._colorRuntimeBindingValues['color.totalHorizontalIlluminance.value']=control.fixedLux;alg.setAdaptingLuminance({value:control.fixedLux/Math.PI,units:'cd m^-2'});",'const physicalReceiverLight=alg.receiverLight;activeRuntime._updateBindingValues();')
text=replace(text,'return {view,observation:',"const capture=await globalThis['twilightCapture']({layers:[0],resetHeading:true});return {capture,view,observation:")
text=replace(text,"if(control.reuseRoot){const old=await(await fetch('/reuse-layout.json')).json();requireValue(old.coordinateMapIdentity===coordinateMapIdentity&&JSON.stringify(old.compilerCoordinates)===JSON.stringify(compilerCoordinates)&&JSON.stringify(old.coordinates)===JSON.stringify(coordinates)&&JSON.stringify(old.slots)===JSON.stringify(slots.map(s=>({id:s.block.id,index:s.index,coordinates:s.block.coordinates}))),'Reused coefficient addresses or physical-height mapping differ.');}","let oldCoordinates=null;if(control.reuseRoot){const old=await(await fetch('/reuse-layout.json')).json();requireValue(old.coordinateMapIdentity===coordinateMapIdentity,'Reused physical-height mapping differs.');oldCoordinates=new Map(old.coordinates.map((c,i)=>[c.join(':'),i]));requireValue(coordinates.every(c=>oldCoordinates.has(c.join(':'))),'Reused coefficient rows do not cover this view.');}")
text=replace(text,"const values=new Float32Array(await(await fetch('/reuse-channel-'+channel+'.bin')).arrayBuffer());await retainAndPack(values);", "const originalValues=new Float32Array(await(await fetch('/reuse-channel-'+channel+'.bin')).arrayBuffer());const values=new Float32Array(coordinates.length*count);for(let row=0;row<coordinates.length;row++){const originalRow=oldCoordinates.get(coordinates[row].join(':'));values.set(originalValues.subarray(originalRow*count,(originalRow+1)*count),row*count);}await retainAndPack(values);")
transition="""
 globalThis['aerosolSceneSetTime']=async(time)=>{
  selected=controller.selectGlobeTime(app._state,time==='noon'?1:2);app._transitionLocationTime(()=>selected);await ready(app._state.observerHeight.value);
  const active=app._modeController._activeRuntime._mode.lightSource.sharedCacheAttachment,current=active._controller._published;
  slots=current.atlas.getSlots();const nextPackets=slots.map(()=>new Float32Array(current.atlas.array.storage.width*current.atlas.array.storage.height*4));
  for(let channel=0;channel<15;channel++){
   const originalValues=new Float32Array(await(await fetch('/reuse-channel-'+channel+'.bin')).arrayBuffer()),shift=Math.floor(channel/4)*162*4+channel%4;
   for(let b=0;b<slots.length;b++)for(let row=0;row<slots[b].block.rowCount;row++){
    const coordinate=slots[b].block.coordinates[row],originalRow=oldCoordinates.get(coordinate.join(':'));requireValue(originalRow!==undefined,'Transition coefficient row missing');
    for(let d=0;d<count;d++)nextPackets[b][baseAddress[row*count+d]+shift]=originalValues[originalRow*count+d];
   }
  }
  const previous=array;array=active._backend.allocatePersistentArray({id:'arm-transition-'+time,valueKey:'cache.sharedPacketAtlas',storage:current.atlas.array.storage,maximumBytes:current.atlas.array.byteLength});
  for(let i=0;i<slots.length;i++)active._backend.uploadPersistentArrayLayer({array,layer:slots[i].index,identity:await digest(new Uint8Array(nextPackets[i].buffer)),values:nextPackets[i]});
  previous.dispose();measuredHeight=-1;const nextState=createDistantSunSceneState({observation:selected.observation,observerHeight:app._state.observerHeight,observerUpDirection:[0,0,1]});
  sun=nextState.geometry.expressCelestialDirectionInScene(nextState.directionToSourceModel);horizontal=Math.hypot(sun[0],sun[2]);
  await globalThis['aerosolProgress']('Retained scene transitioned to '+time+' with authenticated source-density rows');
 };
"""
text=replace(text,"globalThis['aerosolSceneView']=async(view)=>{",transition+"\n globalThis['aerosolSceneView']=async(view)=>{")
(DEST/'scene-browser.mjs').write_text(text,encoding='utf-8')
print('Adapted two experiment-owned capture helpers from immutable read-only source. Compiled physics is supplied by the new host adapter.')
