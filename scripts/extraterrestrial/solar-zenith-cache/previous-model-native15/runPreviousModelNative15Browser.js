import * as THREE from '/modules/three.module.js';
import {Algorithm32} from '../../production-snapshots/sun-appearance-step-5-v1/src/algorithm32/implementation/algorithm32/Algorithm32.js';
import {ThreeCacheBackend} from '../../production-snapshots/sun-appearance-step-5-v1/src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import {ShaderContributions} from '../../production-snapshots/sun-appearance-step-5-v1/src/algorithm32/shader-assembly/base/ShaderContributions.js';
import {ShaderSource} from '../../production-snapshots/sun-appearance-step-5-v1/src/algorithm32/shader-assembly/base/ShaderSource.js';
import {B1_SUN_STATES} from '../point-local-scene-cache/b1PointLocalInputs.js';
import {createB1DiskDirection} from '../point-local-scene-cache/runB1PointLocalBrowser.js';
import {createPreviousModelB1Profile} from './PreviousModelNative15B1Profile.js';

const GRID=9,CHANNELS=40,READ=4;
function readoutOwner(){const directions=[];for(let y=0;y<GRID;y+=1)for(let x=0;x<GRID;x+=1)directions.push(createB1DiskDirection(x,y));
	return {createShaderContribution(){return ShaderContributions.createShaderContribution({id:'color-b1-matched-readout',owner:'color',
		provides:['color.composeSceneColor','color.encodeOutput'],requires:['runtime.initialState','geometry.reconstructViewRay','transport.evaluatePathRadiance'],
		uniforms:[ShaderContributions.createShaderUniformDeclaration('uB1SpectralChannelBase','int','b1.spectralChannelBase')],
		functions:[ShaderContributions.createShaderSourceBlock('b1-directions','declareConstants',100,
			`const vec3 B1_VIEW_DIRECTIONS[81]=vec3[81](${directions.map(direction=>ShaderSource.formatVec3(direction)).join(',')});`)],
		mainHooks:[ShaderContributions.createShaderSourceBlock('b1-ray','reconstructRay',100,
			'ivec2 p=clamp(ivec2(gl_FragCoord.xy),ivec2(0),ivec2(8));state.ray.direction=B1_VIEW_DIRECTIONS[p.y*9+p.x];'),
			ShaderContributions.createShaderSourceBlock('b1-compose','composeSceneColor',0,
				'state.outputRgba=vec4(state.pathRadiance.channels[uB1SpectralChannelBase],state.pathRadiance.channels[uB1SpectralChannelBase+1],state.pathRadiance.channels[uB1SpectralChannelBase+2],state.pathRadiance.channels[uB1SpectralChannelBase+3]);'),
			ShaderContributions.createShaderSourceBlock('b1-output','encodeOutput',0,'outColor=state.outputRgba;')],
		bindingRequirements:[ShaderContributions.createShaderBindingRequirement('b1.base','color','uniform','frame','b1.spectralChannelBase',true)]});}};}
function composer(){return {passes:[],addPass(pass){this.passes.push(pass);},removePass(pass){const i=this.passes.indexOf(pass);if(i>=0)this.passes.splice(i,1);}};}
function zeroTexture(){const texture=new THREE.DataTexture(new Uint8Array(GRID*GRID*4),GRID,GRID,THREE.RGBAFormat,THREE.UnsignedByteType);
	texture.minFilter=THREE.NearestFilter;texture.magFilter=THREE.NearestFilter;texture.colorSpace=THREE.NoColorSpace;texture.needsUpdate=true;return texture;}
async function generate(resources,state,spectralMode){const {renderer,context,backend,scene,camera,zeros,output,bindings}=resources;
	const profile=createPreviousModelB1Profile({time:state.time,fittedAzimuthDegrees:state.fittedAzimuthDegrees,maximumScatteringOrder:4,spectralMode});
	const algorithm=new Algorithm32({profile,color:readoutOwner()}),comp=composer();let handle;
	const heartbeat=setInterval(()=>globalThis.pointLocalProgress?.(`previous-${state.time}-${spectralMode}:heartbeat`),5000);
	try{handle=await algorithm.setupShader({THREE,composer:comp,scene,camera,viewportSize:{width:GRID,height:GRID,units:'pixels'},cacheBackend:backend,bindingValues:bindings,
		logger:{warn(_message,error){throw error instanceof Error?error:new Error(String(error));}}});await handle.prepare(renderer);if(context.isContextLost())throw new Error('GPU context lost.');
		const pass=comp.passes.at(-1),spectra=Array.from({length:81},()=>Array(CHANNELS)),readback=new Float32Array(81*READ);
		for(let base=0;base<CHANNELS;base+=READ){bindings['b1.spectralChannelBase']=base;pass.render(renderer,output,{texture:zeros[0]});renderer.readRenderTargetPixels(output,0,0,GRID,GRID,readback);
			for(let d=0;d<81;d+=1)for(let o=0;o<READ;o+=1)spectra[d][base+o]=readback[d*READ+o];}
		return {spectra,profile:{id:profile.id,contentHash:profile.contentHash,native15Control:profile.native15Control},diagnostics:handle.getDiagnostics()};
	}finally{clearInterval(heartbeat);handle?.dispose();algorithm.dispose();}}
export async function runPreviousModelNative15Browser(){const canvas=document.createElement('canvas'),context=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,stencil:false});
	if(!context||!context.getExtension('EXT_color_buffer_float'))throw new Error('Real float WebGL2 required.');const renderer=new THREE.WebGLRenderer({canvas,context});
	renderer.outputColorSpace=THREE.LinearSRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;renderer.setPixelRatio(1);renderer.setSize(GRID,GRID,false);
	const zeros=[zeroTexture(),zeroTexture(),zeroTexture()],output=new THREE.WebGLRenderTarget(GRID,GRID,{format:THREE.RGBAFormat,type:THREE.FloatType,internalFormat:'RGBA32F',
		minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:false,stencilBuffer:false});
	const resources={renderer,context,backend:new ThreeCacheBackend({THREE,renderer}),scene:new THREE.Scene(),camera:new THREE.PerspectiveCamera(90,1,.1,10),zeros,output,
		bindings:{'b1.spectralChannelBase':0,'geometry.inverseProjectionMatrix':new THREE.Matrix4(),'geometry.inverseViewMatrix':new THREE.Matrix4(),
			'runtime.sceneColorTexture':zeros[0],'runtime.sceneDepthTexture':zeros[1],'runtime.sceneHitTexture':zeros[2],
			'runtime.viewportSize':{width:GRID,height:GRID,units:'pixels'}}};
	const debug=context.getExtension('WEBGL_debug_renderer_info'),gpu={api:context.getParameter(context.VERSION),
		renderer:debug?context.getParameter(debug.UNMASKED_RENDERER_WEBGL):context.getParameter(context.RENDERER)};
	const direct40=[],native15Equivalent=[],profiles=[];
	try{for(const state of B1_SUN_STATES){await globalThis.pointLocalProgress?.(`previous-${state.time}-direct40:start`);const direct=await generate(resources,state,'direct40');direct40.push(direct.spectra);profiles.push(direct.profile);
			await globalThis.pointLocalProgress?.(`previous-${state.time}-native15:start`);const native=await generate(resources,state,'native15-equivalent');native15Equivalent.push(native.spectra);profiles.push(native.profile);}}
	finally{resources.backend.dispose();output.dispose();for(const texture of zeros)texture.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();}
	return {schemaId:'previous-model-direct40-native15-browser-v1',direct40,native15Equivalent,profiles,gpu};}
