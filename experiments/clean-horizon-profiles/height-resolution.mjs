import * as THREE from 'three';
import {compileDistantSunSceneCacheWavelength} from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
import PacketLayout from '../../src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCachePacketLayout.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER as domain} from '../../src/algorithm32/sampling-domains/index.js';

const G=/** @type {any} */(globalThis),fields=new Map(),width=648,height=1728,count=domain.directionCount,layout=new PacketLayout();
const base=new Uint32Array(64*count);
for(let row=0;row<64;row++)for(let d=0;d<count;d++){const a=layout.resolveDestination(0,row,d,0);base[row*count+d]=(a.y*width+a.x)*4;}
function encode(values){const bytes=new Uint8Array(values.buffer,values.byteOffset,values.byteLength);let s='';for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(s);}
function texture(rows){const layers=Math.ceil(rows/64),values=new Float32Array(layers*width*height*4),map=new THREE.DataArrayTexture(values,width,height,layers);map.type=THREE.FloatType;map.format=THREE.RGBAFormat;map.minFilter=THREE.NearestFilter;map.magFilter=THREE.NearestFilter;map.generateMipmaps=false;map.needsUpdate=true;return{map,values,layers};}
function pack(target,values,channel){const rows=values.length/count,shift=Math.floor(channel/4)*162*4+channel%4;for(let row=0;row<rows;row++)for(let d=0;d<count;d++){const v=values[row*count+d];if(!Number.isFinite(v)||v<0)throw Error('Invalid height-field coefficient');target.values[Math.floor(row/64)*width*height*4+base[(row%64)*count+d]+shift]=v;}}

/** Compile only the height-factor intervention; every other construction parameter is borrowed unchanged.
 * @param {any} control - Registered baseline/refinement requests and exact source coordinates.
 */
export async function prepareHeightFields(control){
 const old=await(await fetch('/reuse-layout.json')).json(),zeniths=[...new Set(old.coordinates.map(c=>c[1]))].sort((a,b)=>a-b);
 if(zeniths.some((z,i)=>z!==i))throw Error('Height proof needs contiguous zenith rows from zero');
 const nativeHeights=old.runtimeHeights,oldRows=new Map(old.coordinates.map((c,i)=>[c.join(':'),i])),coordinates=nativeHeights.flatMap((_,h)=>zeniths.map(z=>[h,z]));
 const native=texture(coordinates.length);
 for(let c=0;c<15;c++){const raw=new Float32Array(await(await fetch('/reuse-channel-'+c+'.bin')).arrayBuffer()),ordered=new Float32Array(coordinates.length*count);for(let row=0;row<coordinates.length;row++){const index=oldRows.get(coordinates[row].join(':'));if(index===undefined)throw Error('Native proof coordinate missing');ordered.set(raw.subarray(index*count,(index+1)*count),row*count);}pack(native,ordered,c);}
 fields.set('native',{...native,heights:nativeHeights,zenithCount:zeniths.length});
 const request=control.request,heights=request.transportSpec.domains.position.nodes.map(n=>n.altitudeMeters),denseCoordinates=heights.flatMap((_,h)=>zeniths.map(z=>[h,z])),dense=texture(denseCoordinates.length);
 const ledger=/** @type {any} */({retainedBlockCount:denseCoordinates.length,rows:denseCoordinates.map(([h,z],i)=>({altitudeIndex:h,firstSolarZenithIndex:z,lastSolarZenithIndex:z,firstPackedRow:i}))});
 const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2',{powerPreference:'high-performance'});if(!gl)throw Error('Height compiler context unavailable');
 if(heights.length*180>gl.getParameter(gl.MAX_TEXTURE_SIZE)||dense.layers>gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS))throw Error('Height field exceeds actual GPU texture capabilities');
 const reports=[];await G.aerosolRetain('height-layout.json',{coordinates:denseCoordinates,runtimeHeights:heights,compilerHeights:heights,zenithCount:zeniths.length,sourceGrid:nativeHeights,storage:{width,height,layers:dense.layers,format:'RGBA32F'},operation:'All original height knots retained; dense height extraction in h-major, solar-minor order.'});
 try{for(let c=0;c<15;c++){
  await G.aerosolProgress('Compile height-refined N4 channel '+c+'/14');const started=performance.now();
  const report=await compileDistantSunSceneCacheWavelength({gl,buildRequest:request,wavelengthIndex:c,compileSceneCaches:true,sceneCacheRequests:[{cacheIdentity:'arm-height-refinement',ledger}],onSceneCacheLayer:async({values})=>{pack(dense,values,c);await G.aerosolHeightLayer(c,encode(values));},reportProgress:async stage=>{if(stage.endsWith(':180/180'))await G.aerosolProgress('height channel'+c+' '+stage);}});
  reports.push({channel:c,milliseconds:performance.now()-started,report});
 }}finally{gl.getExtension('WEBGL_lose_context')?.loseContext();}
 fields.set('dense',{...dense,heights,zenithCount:zeniths.length});
 await G.aerosolRetain('height-build.json',{reports,nativeTextureBytes:native.values.byteLength,denseTextureBytes:dense.values.byteLength,originalHeightsRetained:nativeHeights.every(h=>heights.includes(h)),nativeHeights,denseHeights:heights,unchangedFactors:'Full optical model, N4 recurrence, source, spectral/incoming/outgoing/solar grids, view30 and scene lighting.'});
 G.disposeHeightFields=()=>{for(const f of fields.values())f.map.dispose();fields.clear();};
}

/** Render retained scene input with a selected height readout, keeping lighting/exposure fixed.
 * @param {'native'|'build-only'|'dense'} kind - Original bridge control or two refinement ablations.
 * @returns {Promise<any>} Linear GPU composition and exact shader-intervention facts.
 */
export async function captureHeightField(kind){
 const app=G.proofApplication,scene=app._sceneRuntime,renderer=scene.renderer,gl=renderer.getContext(),composer=G.twilightComposer??app._modeController._activeRuntime._composer;
 const pass=composer.passes.find(p=>p._material?.uniforms?.uColorResetTotalHorizontalIlluminanceLux),original=pass._material,input=composer.readBuffer,field=fields.get(kind==='native'?'native':'dense'),native=fields.get('native'),heights=kind==='build-only'?native.heights:field.heights,heightMap=heights.map(h=>field.heights.indexOf(h));
 if(heightMap.some(i=>i<0))throw Error('Coarse readout lost an original physical knot');
 const material=original.clone();material.uniforms={...original.uniforms,uDistantSunSharedPackets:{value:field.map}};
 const nodes=/const float GEOMETRY_CACHE_POSITION_NODES_METERS\[\d+\]\s*=\s*float\[\d+\]\([\s\S]*?\);/u,number=/const int GEOMETRY_CACHE_POSITION_COUNT = \d+;/u,address='addresses[tap] = texelFetch(uDistantSunSharedCoordinates, ivec2(zenithIndex, altitudeIndex), 0).rg;',encodePattern=/vec4 encodeDisplayOutput\(vec3 linearSrgb\) \{[\s\S]*?\n\}/u;
 if(!nodes.test(material.fragmentShader)||!number.test(material.fragmentShader)||!material.fragmentShader.includes(address)||!encodePattern.test(material.fragmentShader))throw Error('Height shader bridge boundaries changed');
 material.fragmentShader=`const int HEIGHT_ROW_MAP[${heightMap.length}]=int[](${heightMap.join(',')});\n`+material.fragmentShader.replace(number,'const int GEOMETRY_CACHE_POSITION_COUNT = '+heights.length+';').replace(nodes,`const float GEOMETRY_CACHE_POSITION_NODES_METERS[${heights.length}]=float[${heights.length}](${heights.map(h=>h.toExponential(16)).join(',')});`).replace(address,`int heightRow=HEIGHT_ROW_MAP[altitudeIndex]*${field.zenithCount}+zenithIndex;
 addresses[tap]=zenithIndex<${field.zenithCount}?uvec2(heightRow/64,heightRow%64):uvec2(65535u);`).replace(encodePattern,'vec4 encodeDisplayOutput(vec3 value){return vec4(value,1.0);\n}');
 const target=new input.constructor(scene.canvas.width,scene.canvas.height,{type:THREE.FloatType,format:THREE.RGBAFormat,depthBuffer:false,stencilBuffer:false}),screen=pass.renderToScreen,refresh=pass._refreshUniformValues,oldTarget=renderer.getRenderTarget();
 try{pass._material=material;pass._mesh.material=material;pass.renderToScreen=false;pass._refreshUniformValues=()=>{refresh?.call(pass);material.uniforms.uDistantSunSharedPackets.value=field.map;};await renderer.compileAsync(pass._scene,pass._camera);pass.render(renderer,target,input);renderer.setRenderTarget(target);const values=new Float32Array(scene.canvas.width*scene.canvas.height*4);gl.readPixels(0,0,scene.canvas.width,scene.canvas.height,gl.RGBA,gl.FLOAT,values);if(gl.getError()!==0||values.some(v=>!Number.isFinite(v)))throw Error('Height view has missing support or invalid float data');return{kind,heights,heightMap,width:scene.canvas.width,height:scene.canvas.height,linear:encode(values),lighting:'Baseline receiver lighting and captured scene input held fixed; only source-field height construction/readout changes.'};}
 finally{pass._material=original;pass._mesh.material=original;pass.renderToScreen=screen;pass._refreshUniformValues=refresh;renderer.setRenderTarget(oldTarget);material.dispose();target.dispose();}
}
