import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,existsSync,rmSync} from 'node:fs';
import puppeteer from 'puppeteer';
import {createRun,checked,identity} from './io.mjs';
import {ArmAtmosphere} from './ArmAtmosphere.js';
import {DistantSunPointLocalCacheAerosolOptics as Aerosols} from '../../scripts/algorithm32/solar-zenith-cache/DistantSunPointLocalCacheAerosolOptics.js';
const parent=process.argv[2];assert.match(parent,/^tmp\/experiments\/clean-horizon-profiles\/runs\/\d{5}-reconstruction$/u);
const profile=JSON.parse(readFileSync(checked(parent+'/model.json'),'utf8'));
const run=createRun('gpu-feasibility','S1 compare actual WebGL medium/phase samples with CPU on the frozen tabulated physical contract',[identity(parent+'/manifest.json')]);
let browser,failure;const work=run.absolute+'/work-browser';mkdirSync(work);mkdirSync(work+'/temp');
try{
	const atmosphere=new ArmAtmosphere(profile),heights=[0,50,500,1500,2000,12000,34999,35000,40000,60000];
	const header='#version 300 es\nprecision highp float; precision highp int;\n#define SPECTRAL_CHANNEL_COUNT 15\nstruct Spectrum {float channels[15];};struct AtmosphereCoordinate {float altitudeMeters;};struct MediumSample {Spectrum rayleighScattering;Spectrum mieScattering;Spectrum scattering;Spectrum extinction;};\n';
	const shader=header+atmosphere._atmosphereConstantsBlock(atmosphere.constants,atmosphere.spectralBasis)+'\n'+atmosphere._runtimeMediumBlock()+'\nconst float PI=3.141592653589793;\n'+Aerosols.createShaderSource(profile.phase)+`\nout vec4 result;const float HEIGHT[${heights.length}]=float[](${heights.map(h=>h.toFixed(1)).join(',')});void main(){int i=int(gl_FragCoord.x);MediumSample m=sampleAtmosphere(AtmosphereCoordinate(HEIGHT[i]));float mu=-1.0+2.0*float(i)/${(heights.length-1).toFixed(1)};result=vec4(m.mieScattering.channels[6],m.extinction.channels[6],miePhase(vec3(0,0,1),vec3(sqrt(max(0.0,1.0-mu*mu)),0,mu)),1);}`;
	run.write('medium-phase.glsl',shader);
	browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:work,env:{...process.env,TEMP:work+'/temp',TMP:work+'/temp'},args:['--enable-gpu','--enable-webgl','--ignore-gpu-blocklist','--use-angle=d3d11']});
	const page=await browser.newPage();
	const result=await page.evaluate(({shader,count})=>{
		const canvas=document.createElement('canvas');canvas.width=count;canvas.height=1;
		const gl=canvas.getContext('webgl2');if(!gl||!gl.getExtension('EXT_color_buffer_float'))throw Error('Float WebGL2 unavailable');
		const compile=(kind,source)=>{const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
		const p=gl.createProgram();gl.attachShader(p,compile(gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=gl_VertexID==0?vec2(-1,-1):gl_VertexID==1?vec2(3,-1):vec2(-1,3);gl_Position=vec4(p,0,1);}'));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,shader));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));gl.useProgram(p);
		const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA32F,count,1);const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Incomplete float target');gl.viewport(0,0,count,1);gl.drawArrays(gl.TRIANGLES,0,3);const values=new Float32Array(count*4);gl.readPixels(0,0,count,1,gl.RGBA,gl.FLOAT,values);const debug=gl.getExtension('WEBGL_debug_renderer_info');return{values:Array.from(values),glError:gl.getError(),renderer:gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER)};
	},{shader,count:heights.length});
	assert.equal(result.glError,0);
	const comparisons=heights.map((height,i)=>{const m=atmosphere.sampleMedium({altitude:{value:height,units:'meters'}}),mu=-1+2*i/(heights.length-1),expected=[m.mieScattering.values[6],m.extinction.values[6],atmosphere._miePhaseFunction(0,mu)];return{height,expected,actual:result.values.slice(i*4,i*4+3),relativeErrors:expected.map((v,c)=>Math.abs(result.values[i*4+c]-v)/Math.max(Math.abs(v),1e-15))};});
	const maximumRelativeError=Math.max(...comparisons.flatMap(c=>c.relativeErrors));assert.ok(maximumRelativeError<.0001);
	run.write('proof.json',{comparisons,maximumRelativeError,environment:{renderer:result.renderer,browser:await browser.version()},claim:'Actual runtime GLSL medium and conditional phase agree with CPU. Full recurrence/scene transport still needs S2/S3 comparisons.'});
	console.log(JSON.stringify({maximumRelativeError,renderer:result.renderer}));
}catch(error){failure=String(error);run.write('failure.json',{message:failure});}
finally{await browser?.close();if(existsSync(work)){const target=checked(run.path+'/work-browser');assert.equal(target,work.replaceAll('/', '\\'));rmSync(target,{recursive:true});}run.finish(failure?'failed':'accepted',{failure});}if(failure)process.exitCode=1;
