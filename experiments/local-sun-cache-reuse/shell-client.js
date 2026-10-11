import * as THREE from 'three';
import {ThreeCacheBackend} from '../../src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import {LocalSunCacheController} from '../../src/algorithm32/implementation/local-sun/cache/LocalSunCacheController.js';
import {opticalShellTransport} from './shell-transport.js';
import {precomputedShellScatter} from './shell-scatter.js';
import {guardEmptyShellSlots} from './shell-omission.js';
import {installShellAxisCache} from './shell-axis.js';
import {shellReconstructionData,shellExcessData} from './shell-reconstruction.js';
import {createOwners,unit} from './rotation-model.js';
import {Algorithm32Bindings} from '../../src/algorithm32/implementation/react-three/Algorithm32Bindings.js';
import {ShaderRuntimePass} from '../../src/algorithm32/rendering-runtime/three/ShaderRuntimePass.js';
import {CanonicalValueHash} from '../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {FlatEarthGeometry} from '../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';
import {ShellReceiver} from './shell-receiver.js';
import {ShellEndpointScene} from './shell-scene.js';
import {installShellCelestial} from './shell-celestial.js';
import {CelestialGenerationPass} from '../../src/algorithm32/rendering-runtime/three/CelestialGenerationPass.js';

/** Keep live horizontal placement out of the owned runtime program's source identity.
 * Every frame still owns its exact uniform values; this changes no construction
 * field, transform equation or production contributor.
 * @param {FlatEarthGeometry} geometry - Newly owned and fully configured frame geometry.
 * @returns {void} - The runtime contributor declares live placement uniforms.
 */
export function installShellLiveFrame(geometry) {
	const original=geometry.createShaderContribution.bind(geometry),facts=geometry.configuration;
	const placements=[{name:'GEOMETRY_SOURCE_SUBPOINT_METERS',valueKey:'experiment.shellLiveSourceSubpoint',value:facts.sourceSubpoint.coordinates},
		{name:'GEOMETRY_CACHE_RADIAL_FALLBACK',valueKey:'experiment.shellLiveRadialFallback',value:facts.cacheRadialFallbackDirection},
		...(facts.observerCenteredDome ? [{name:'GEOMETRY_OBSERVER_DOME_CENTER_METERS',valueKey:'experiment.shellLiveDomeCenter',value:facts.observerCenteredDome.sphereCenter.coordinates}] : [])];
	geometry.createShaderContribution=()=>{
		const contribution=original();
		const counts=placements.map(()=>0);
		const height=facts.sourcePosition.coordinates[2];
		if(!Number.isSafeInteger(height) || height<=facts.topAltitude.value)throw new Error('Live shell height requires a finite integer height above the slab.');
		const heightExpression=new RegExp('\\b'+height+'\\.0\\b','gu');
		let heightUses=0,legacyRadialDeclarations=0;
		const functions=contribution.functions.map(block=>{
			let code=block.code;
			for(let index=0;index<placements.length;index++) {
				const expression=new RegExp('^const vec3 '+placements[index].name+' = [^;\\n]+;$','mu');
				if(expression.test(code)){code=code.replace(expression,'');counts[index]++;}
			}
			// The shell adapter has replaced the sole consumer of the inherited
			// horizontal-grid node declaration. Reject any remaining consumer before
			// removing this dead, placement-dependent program-identity input.
			const legacy=/^const float GEOMETRY_CACHE_RHO_NODES_METERS\[[^\n]+$/mu;
			if(legacy.test(code)){code=code.replace(legacy,'');legacyRadialDeclarations++;}
			if(code.includes('GEOMETRY_CACHE_RHO_NODES_METERS'))throw new Error('Unexpected inherited horizontal-grid runtime consumer.');
			heightUses+=(code.match(heightExpression) ?? []).length;
			code=code.replace(heightExpression,'uShellLiveSourceHeight');
			return {...block,code};
		});
		if(counts.some(value=>value!==1) || heightUses!==4 || legacyRadialDeclarations!==1)throw new Error('Live shell geometry declaration owner changed.');
		return {...contribution,id:contribution.id+'-live-placement-height-v2',functions,uniforms:[...contribution.uniforms,...placements.map(value=>({name:value.name,type:/** @type {const} */('vec3'),valueKey:value.valueKey,defaultValue:[...value.value]})),
			{name:'uShellLiveSourceHeight',type:/** @type {const} */('float'),valueKey:'experiment.shellLiveSourceHeight',defaultValue:height}]};
	};
}

/** Keep exact Mie albedo in its owned runtime uniform, preserving all physical build equations.
 * @param {AtmosphereModel & CacheBuildContributor} atmosphere - Newly owned shell atmosphere, never a production singleton.
 * @param {number} albedo - Exact validated frame albedo.
 * @returns {void} - Runtime declarations use the same scalar value without recompiling solely for that value.
 */
export function installShellLiveAtmosphere(atmosphere,albedo) {
	if(!Number.isFinite(albedo) || albedo<0 || albedo>1)throw new Error('Physical live Mie albedo must lie between zero and one.');
	const original=atmosphere.createShaderContribution.bind(atmosphere);
	atmosphere.createShaderContribution=()=>{
		const contributions=original();if(!Array.isArray(contributions))throw new Error('Expected the experiment-owned shell atmosphere contributions.');
		let declarations=0;
		const values=contributions.map(contribution=>{
			const expression=/^const float ATMOSPHERE_MIE_SINGLE_SCATTERING_ALBEDO = [^;\n]+;$/mu;
			const functions=contribution.functions.map(block=>{if(!expression.test(block.code))return block;declarations++;return {...block,code:block.code.replace(expression,'')};});
			if(contribution.id!=='atmosphere-canonical')return {...contribution,functions};
			return {...contribution,id:contribution.id+'-live-albedo-v1',functions,uniforms:[...contribution.uniforms,{name:'ATMOSPHERE_MIE_SINGLE_SCATTERING_ALBEDO',type:/** @type {const} */('float'),valueKey:'experiment.shellLiveMieAlbedo',defaultValue:albedo}]};
		});
		if(declarations!==1)throw new Error('Live Mie albedo declaration owner changed.');
		return values;
	};
}

/** Configure one owned backend for canonical source-relative construction, never production globals.
 * @param {ThreeCacheBackend} backend - Caller-owned fresh GPU backend.
 * @param {LocalSunShellLayout} layout - Candidate spatial/numerical identity.
 * @param {CacheData | null} phases - Immutable matching incoming/outgoing Mie matrix.
 * @param {LocalSunShellTransportPolicy} policy - Identified construction path rule.
 * @returns {void} - Adapts compilation while retaining backend resource ownership.
 */
export function configureShellBackend(backend,layout,phases,policy) {
	const compile=backend.compile.bind(backend);
	backend.compile=shader=>{
		const adapted=opticalShellTransport({...shader,
			source:shader.source.includes('vec3 samplePositionMeters = ray.originMeters') ? shader.source.replace('vec3 samplePositionMeters = ray.originMeters',
				'shellTransportRhoOverride = pointIndex == CACHE_TRANSPORT_INTERVAL_COUNT && ray.endsOnCylinder ? uCacheGeometryRadialMaximum : -1.0;\n\tvec3 samplePositionMeters = ray.originMeters') : shader.source,
			bindings:shader.bindings.map(binding=>{
				if(['uCacheGeometrySourceSubpoint','uCacheGeometrySourcePosition','uCacheLocalSunPosition'].includes(binding.spec.name)) {
					if(binding.spec.kind!=='uniform' || binding.spec.shaderType!=='vec3')throw new Error('Build position binding contract changed.');
					const position=/** @type {Position} */(binding.value);
					if(position.units!=='meters' || !Array.isArray(position.coordinates) || !position.coordinates.every(Number.isFinite) || position.coordinates[2]!==layout.height && binding.spec.name!=='uCacheGeometrySourceSubpoint')throw new Error('Invalid source-relative build position.');
					return /** @type {CacheBinding} */({...binding,value:{...position,coordinates:[0,0,position.coordinates[2]]}});
				}
				if(binding.spec.name==='uCacheGeometryRadialFallback') {
					if(binding.spec.kind!=='uniform' || binding.spec.shaderType!=='vec3')throw new Error('Build fallback binding contract changed.');
					return /** @type {CacheBinding} */({...binding,value:/** @type {UnitVector3} */([1,0,0])});
				}
				return binding;
			})},policy);
		return compile(guardEmptyShellSlots(phases ? precomputedShellScatter(adapted,phases) : adapted,layout));
	};
}

/** Install per-cache scalar support textures and axis reconstruction on one owned controller.
 * @param {LocalSunCacheController} controller - Newly created controller; ownership stays with its caller.
 * @param {LocalSunShellLayout} layout - Matching complete compact mesh.
 * @returns {void} - Successful cache creation transfers textures into that cache's lifetime.
 */
export function configureShellController(controller,layout) {
	const build=controller.createScatteringCache.bind(controller);
	controller.createScatteringCache=async request=>{
		const cache=await build(request);
		let texture,excessTexture;
		try {
			if(layout.reconstruction) {
				const factors=shellReconstructionData(layout),excess=shellExcessData(layout);
				texture=new THREE.DataTexture(new Float32Array(factors.values),15,layout.nodes.length,THREE.RedFormat,THREE.FloatType);
				texture.internalFormat='R32F';texture.unpackAlignment=1;texture.needsUpdate=true;
				excessTexture=new THREE.DataTexture(new Float32Array(excess.values),layout.nodes.length,1,THREE.RedFormat,THREE.FloatType);
				excessTexture.internalFormat='R32F';excessTexture.unpackAlignment=1;excessTexture.needsUpdate=true;
			}
			installShellAxisCache(cache,texture,excessTexture);return cache;
		} catch(error){texture?.dispose();excessTexture?.dispose();cache.dispose();throw error;}
	};
}

/** Prepare an actual exact-state GPU application frame using one shared canonical cache lease.
 * @param {LocalSunRotationRecipe} recipe - Selected developmental shell source/medium controls.
 * @param {number} degrees - Exact synthetic source rotation, degrees.
 * @param {THREE.WebGLRenderer} renderer - Externally owned renderer shared by frame consumers.
 * @param {CacheData} phases - Complete immutable matching Mie matrix.
 * @param {LocalSunShellFramePreparation} context - Serialized preparation and resource lease owner.
 * @param {LocalSunShellFrameIdentity} identity - Expected live and canonical identities.
 * @param {LocalSunShellFrameProofHook} [beforeBuild] - Optional experiment-owned instrumentation/fault hook on a new backend.
 * @param {LocalSunShellSceneFactory} [sceneFactory] - Optional persistent-scene borrower factory; staging preserves its camera and visible lighting.
 * @returns {Promise<LocalSunShellPublishedFrame>} - Complete prepared state; caller publishes it atomically.
 */
export async function prepareShellApplicationFrame(recipe,degrees,renderer,phases,context,identity,beforeBuild,sceneFactory) {
	if(!recipe.shellLayout || !recipe.shellRuntime || !recipe.shellIncoming || recipe.diagnostic)throw new Error('Selected shell application controls required.');
	const owners=createOwners(recipe,degrees),layout=recipe.shellLayout;
	installShellLiveFrame(owners.geometry);
	if(recipe.celestial)installShellCelestial(owners,recipe.celestial);
	installShellLiveAtmosphere(/** @type {AtmosphereModel & CacheBuildContributor} */(owners.model.atmosphere),recipe.shellMieAlbedo ?? CANONICAL_ATMOSPHERE_CONSTANTS.mieSingleScatteringAlbedo);
	/** @type {ShaderHandle|null} */ let handle=null;
	/** @type {ShellReceiver|null} */ let receiverOwner=null;
	/** @type {LocalSunShellFrameScene|null} */ let sceneOwner=null;
	let completed=false;
	try {
		const controller=context.borrowController(()=>{
			const backend=new ThreeCacheBackend({THREE,renderer});
			try {
				beforeBuild?.(backend);
				configureShellBackend(backend,layout,phases,'column48-tail64');
				const real=owners.source.createCacheController({model:owners.model,backend,scheduler:{yieldControl:()=>new Promise(resolve=>setTimeout(resolve,0))}});
				if(!(real instanceof LocalSunCacheController)){real.dispose();throw new Error('Expected the selected local-Sun controller.');}
				configureShellController(real,layout);
				let disposed=false;
				return {backend,get active(){return real.active;},createScatteringCache:request=>real.createScatteringCache(request),dispose:()=>{if(disposed)return;disposed=true;try{real.dispose();}finally{backend.dispose();}}};
			} catch(error){backend.dispose();throw error;}
		});
		owners.source.createCacheController=()=>controller;
		if(!(controller.backend instanceof ThreeCacheBackend))throw new Error('Shell application requires its resource-owned Three backend.');
		if(sceneFactory)sceneOwner=sceneFactory(owners);
		else if(recipe.shellScene)sceneOwner=new ShellEndpointScene(owners.geometry);
		const viewport=renderer.getDrawingBufferSize(new THREE.Vector2());
		const camera=sceneOwner?.camera ?? new THREE.PerspectiveCamera(70,viewport.x/viewport.y,.002,500);
		if(!sceneFactory){
		camera.aspect=viewport.x/viewport.y;
		if(recipe.horizontalFieldOfViewDegrees!==undefined){
			const horizontal=recipe.horizontalFieldOfViewDegrees;
			if(!Number.isFinite(horizontal)||!(horizontal>0&&horizontal<180))throw new RangeError('Horizontal capture FOV must lie strictly between zero and 180 degrees.');
			camera.fov=2*Math.atan(Math.tan(horizontal*Math.PI/360)/camera.aspect)*180/Math.PI;
		}
		camera.updateProjectionMatrix();
		camera.position.set(0,.005,0);camera.lookAt(0,.005,-1);
		if(recipe.celestial?.sunFacing){const position=owners.source.configuration.position.coordinates,observer=owners.geometry.configuration.observerPosition.coordinates;camera.lookAt(position[0]-observer[0],position[2]-observer[2]+.005,-(position[1]-observer[1]));}
		}
		/** @type {ShaderRuntimeComposer} */ const composer={passes:[],addPass(pass){this.passes.push(pass);},removePass(pass){const index=this.passes.indexOf(pass);if(index>=0)this.passes.splice(index,1);}};
		const bindings=Algorithm32Bindings.create(THREE,{value:500000,units:'meters'});
		Algorithm32Bindings.update({bindingValues:bindings,camera,props:{config:{...owners.facade.config.config,geometry:owners.geometry},sceneScale:{value:1000,units:'meters-per-scene-unit'}}});
		const setupStarted=performance.now();
		handle=await owners.facade.setupShader({THREE,composer,scene:sceneOwner?.scene ?? new THREE.Scene(),camera,viewportSize:{width:viewport.x,height:viewport.y,units:'pixels'},sceneScale:{value:1000,units:'meters-per-scene-unit'},sceneDepthMax:{value:500000,units:'meters'},bindingValues:bindings,cacheBackend:controller.backend,signal:context.signal});
		const setup=performance.now()-setupStarted,viewStarted=performance.now(),cache=controller.active;
		if(!cache)throw new Error('No complete cache for frame preparation.');
		let view=0,receiverMilliseconds=0;
		// Three's compileAsync restores synchronous renderer state before polling.
		// These separate materials may compile concurrently; both settle before cleanup.
		const viewPromise=handle.prepare(renderer).then(()=>{view=performance.now()-viewStarted;});
		const receiverStarted=performance.now();
		receiverOwner=new ShellReceiver(controller.backend);
		const receiverPromise=receiverOwner.prepare({owners,renderer,backend:controller.backend,cache,signal:context.signal},recipe.state.observation,identity.identity+':receiver-exact-v1').then(receiver=>{receiverMilliseconds=performance.now()-receiverStarted;return receiver;});
		const outcomes=await Promise.allSettled(/** @type {const} */([viewPromise,receiverPromise]));
		for(const outcome of outcomes)if(outcome.status==='rejected')throw outcome.reason;
		const measured=outcomes[1];if(measured.status!=='fulfilled')throw new Error('Incomplete receiver preparation.');
		const receiver=measured.value;
		context.signal.throwIfAborted();
		handle.publishReceiverEnvironmentLight(receiver,recipe.state.observation);
		const viewPass=/** @type {LocalSunControlViewPass} */(composer.passes.at(-1));
		if(!cache || !viewPass)throw new Error('No prepared complete cache/view.');
		if(!(viewPass instanceof ShaderRuntimePass))throw new Error('Expected the selected shader runtime pass.');
		const material=viewPass.material;
		if(!(material instanceof THREE.RawShaderMaterial))throw new Error('Expected an owned raw shader material.');
		const shaderIdentities={view:CanonicalValueHash.sha256Value(material.fragmentShader),receiver:CanonicalValueHash.sha256Value(receiverOwner.program.source)};
		const source=owners.source.configuration,observer=owners.geometry.configuration.observerPosition.coordinates;
		const directionToSource=unit(source.position.coordinates.map((value,index)=>value-observer[index]));
		if(sceneOwner){sceneOwner.setLighting(owners,receiver,directionToSource);await sceneOwner.prepare(renderer);context.signal.throwIfAborted();}
		let disposed=false;
		/** @type {LocalSunShellPublishedFrame} */ const frame={...identity,source,observation:recipe.state.observation,receiver,directionToSource,viewPass,cache,backend:controller.backend,owners,stageMilliseconds:{setup,view,receiver:receiverMilliseconds},shaderIdentities,
			...(recipe.celestial ? {celestial:{camera,handle,generation:/** @type {CelestialGenerationPass} */(composer.passes.find(pass=>pass instanceof CelestialGenerationPass)),diagnostics:()=>handle.getDiagnostics(),render:()=>{const before=/** @type {LocalSunCelestialRenderDiagnostic} */(viewPass.getDiagnostics());Algorithm32Bindings.update({bindingValues:bindings,camera,props:{config:{...owners.facade.config.config,geometry:owners.geometry},sceneScale:{value:1000,units:'meters-per-scene-unit'}}});if(sceneOwner)sceneOwner.render(renderer,viewPass,composer);else{for(const pass of composer.passes)if(pass instanceof CelestialGenerationPass)pass.render(renderer);viewPass.renderToScreen=true;viewPass.render(renderer,null,null);}const after=/** @type {LocalSunCelestialRenderDiagnostic} */(viewPass.getDiagnostics());if(after.renderErrorCount!==before.renderErrorCount)throw new Error('Celestial frame draw failed: '+after.lastRenderError);}}} : {}),
			...(sceneOwner instanceof ShellEndpointScene ? {scene:sceneOwner} : sceneOwner ? {borrowedScene:sceneOwner} : {}),
			...(sceneOwner ? {renderScene:()=>sceneOwner.render(renderer,viewPass,composer)} : {}),
			dispose:()=>{if(disposed)return;disposed=true;try{sceneOwner?.dispose();}finally{try{receiverOwner?.dispose();}finally{try{handle?.dispose();}finally{owners.facade.dispose();}}}}};
		completed=true;return frame;
	} finally {if(!completed)try{sceneOwner?.dispose();}finally{try{receiverOwner?.dispose();}finally{try{handle?.dispose();}finally{owners.facade.dispose();}}}}
}
