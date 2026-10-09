import * as THREE from 'three';
import {EndpointScene} from '../../src/flat32/EndpointScene.js';
import {SCENE_OBJECTS} from '../../src/flat32/consts.js';
import {SceneInputCapture} from '../../src/algorithm32/rendering-runtime/three/SceneInputCapture.js';
import {FlatEarthGeometry} from '../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js';

/** Own the ordinary six-box scene and its exact-state spectral lighting.
 * The per-object 4096 shadow maps, meshes, materials and camera policies come
 * from EndpointScene. A suspended renderer displays its last complete pixels
 * while transient shadow maps are retired for a replacement cache build.
 * @implements {LocalSunShellSceneContract}
 */
export class ShellEndpointScene {
	/** Frame-owned visual scene. @type {THREE.Scene} */ scene=new THREE.Scene();
	/** Frozen control camera. @type {THREE.PerspectiveCamera} */ camera=new THREE.PerspectiveCamera(70,720/414,.002,500);
	/** Frame-owned ordinary endpoint scene. @type {EndpointScene} */ endpoints;
	/** Linear FP32 scene color, before atmosphere/display. @type {THREE.WebGLRenderTarget} */ colorTarget;
	/** Complete previously displayed pixels, copied without CPU readback. @type {THREE.FramebufferTexture} */ snapshotTexture=new THREE.FramebufferTexture(720,414);
	/** Snapshot-only presentation material. @type {THREE.RawShaderMaterial} */ snapshotMaterial;
	/** Snapshot-only fullscreen geometry. @type {THREE.PlaneGeometry} */ snapshotGeometry=new THREE.PlaneGeometry(2,2);
	/** Snapshot-only presentation scene. @type {THREE.Scene} */ snapshotScene=new THREE.Scene();
	/** Whether a complete displayed snapshot exists. @type {boolean} */ rendered=false;
	/** Whether the renderer is displaying only the preserved complete snapshot. @type {boolean} */ suspended=false;
	/** Terminal resource state. @type {boolean} */ disposed=false;

	/** Install the familiar unchanged meshes in the selected physical geometry.
	 * @param {FlatEarthGeometry} geometry - Exact frame geometry; scene mapping remains production-owned.
	 */
	constructor(geometry) {
		this.camera.position.set(0,.005,0);this.camera.lookAt(0,.005,-1);
		this.endpoints=new EndpointScene(this.scene);this.endpoints.install();this.endpoints.applyMode('flat-local',geometry);
		this.colorTarget=new THREE.WebGLRenderTarget(720,414,{format:THREE.RGBAFormat,type:THREE.FloatType,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:true,stencilBuffer:false});
		this.colorTarget.texture.internalFormat='RGBA32F';this.colorTarget.texture.colorSpace=THREE.NoColorSpace;this.colorTarget.texture.generateMipmaps=false;
		this.snapshotMaterial=new THREE.RawShaderMaterial({glslVersion:THREE.GLSL3,vertexShader:'precision highp float; in vec3 position; out vec2 uv; void main(){uv=position.xy*0.5+0.5;gl_Position=vec4(position.xy,0.,1.);}',
			fragmentShader:'precision highp float; uniform sampler2D image; in vec2 uv; out vec4 outColor; void main(){outColor=texture(image,uv);}',uniforms:{image:{value:this.snapshotTexture}},depthTest:false,depthWrite:false,blending:THREE.NoBlending});
		const mesh=new THREE.Mesh(this.snapshotGeometry,this.snapshotMaterial);mesh.frustumCulled=false;this.snapshotScene.add(mesh);
	}

	/** Apply one complete receiver spectrum and each object's finite-source direction.
	 * @param {LocalSunRotationOwners} owners - Matching source, geometry, model and display policy.
	 * @param {ReceiverEnvironmentLightMeasurement} receiver - Exact unsmoothed same-frame measurement.
	 * @param {UnitVector3} directionToSource - Exact receiver-to-source model direction.
	 * @returns {void} - The ordinary shadow map settings remain unchanged.
	 */
	setLighting(owners,receiver,directionToSource) {
		if(this.disposed)throw new Error('Shell endpoint scene is disposed.');
		this.endpoints.updateDistantSunLighting(directionToSource,receiver,owners.facade.config.config.color);
		const source=owners.geometry.mapModelPositionToObserverLocalScenePoint(owners.source.configuration.position,{sceneScale:{value:1000,units:'meters-per-scene-unit'}}).coordinates;
		let count=0;
		this.scene.traverse(object=>{
			if(!(object instanceof THREE.DirectionalLight))return;
			const definition=SCENE_OBJECTS.find(candidate=>candidate.name===object.userData.reviewObjectKey);
			if(!definition)throw new Error('Ordinary scene shadow object identity changed.');
			const direction=new THREE.Vector3(source[0]-definition.shadowFocus[0],source[1]-definition.shadowFocus[1],source[2]-definition.shadowFocus[2]).normalize();
			object.position.set(...definition.shadowFocus).addScaledVector(direction,definition.sourceLightDistance);
			object.userData.directionToSource=direction.toArray();object.userData.sourcePositionMeters=owners.source.configuration.position;
			object.userData.lightingPolicy='exact-local-receiver-spectrum-and-per-object-finite-source-direction-v1';
			object.shadow.needsUpdate=true;count++;
		});
		if(count!==6)throw new Error('Six ordinary per-object shadow lights required.');
	}

	/** Compile scene and preserved-frame materials without allocating lazy shadow maps.
	 * @param {THREE.WebGLRenderer} renderer - Externally owned application renderer.
	 * @returns {Promise<void>} - Both independent programs settle before caller cleanup.
	 */
	async prepare(renderer) {
		const outcomes=await Promise.allSettled([renderer.compileAsync(this.scene,this.camera),renderer.compileAsync(this.snapshotScene,new THREE.Camera())]);
		for(const outcome of outcomes)if(outcome.status==='rejected')throw outcome.reason;
	}

	/** Draw one complete exact-state frame or its immutable suspended pixels.
	 * @param {THREE.WebGLRenderer} renderer - Shared live renderer.
	 * @param {LocalSunControlViewPass} view - Matching prepared atmosphere view.
	 * @param {ShaderRuntimeComposer} composer - Same-frame depth/hit capture and atmosphere passes.
	 * @returns {void} - Every temporary render-target change is restored.
	 */
	render(renderer,view,composer) {
		if(this.disposed)throw new Error('Shell endpoint scene is disposed.');
		const previous=renderer.getRenderTarget();
		try {
			if(this.suspended) {
				if(!this.rendered)throw new Error('Suspended frame has no complete pixels.');
				renderer.setRenderTarget(null);renderer.render(this.snapshotScene,new THREE.Camera());return;
			}
			renderer.setRenderTarget(this.colorTarget);renderer.clear();renderer.render(this.scene,this.camera);
			for(const pass of composer.passes) {
				if(pass===view)continue;
				if(!(pass instanceof SceneInputCapture))throw new Error('Unexpected shell scene collaborator.');
				pass.capture(/** @type {SceneInputCaptureRenderer} */(/** @type {unknown} */(renderer)));
			}
			view.renderToScreen=true;view.render(renderer,null,{texture:this.colorTarget.texture});
			renderer.setRenderTarget(null);renderer.copyFramebufferToTexture(this.snapshotTexture);this.rendered=true;
		} finally {renderer.setRenderTarget(previous);}
	}

	/** Preserve displayed pixels and retire only lazy shadow-map storage before staging.
	 * @returns {void} - Cached fields, exact frame facts, meshes and shaders remain live.
	 */
	suspend() {
		if(this.disposed || !this.rendered)throw new Error('A complete live scene frame is required before suspension.');
		this.suspended=true;
		this.scene.traverse(object=>{if(object instanceof THREE.DirectionalLight){object.shadow.map?.dispose();object.shadow.map=null;object.shadow.mapPass?.dispose();object.shadow.mapPass=null;object.shadow.needsUpdate=true;}});
	}

	/** Resume exact old-state rendering after a rejected replacement; maps rebuild lazily.
	 * @returns {void} - No physical state or scene policy is changed.
	 */
	resume(){if(this.disposed)throw new Error('Shell endpoint scene is disposed.');this.suspended=false;}

	/** Report ordinary endpoint/shadow policy and suspended presentation state.
	 * @returns {LocalSunShellSceneSnapshot} - Detached aggregate and per-object compatibility facts.
	 */
	describe(){
		/** @type {LocalSunShellSceneLight[]} */ const lights=[];
		this.scene.traverse(object=>{if(object instanceof THREE.DirectionalLight)lights.push({name:object.userData.reviewObjectKey,target:object.target.position.toArray(),position:object.position.toArray(),
			direction:[...object.userData.directionToSource],receiverIdentity:object.userData.receiverLightIdentity,spectralIdentity:object.userData.spectralPacketIdentity,
			mapSize:object.shadow.mapSize.toArray(),bias:object.shadow.bias,normalBias:object.shadow.normalBias,radius:object.shadow.radius,intensity:object.shadow.intensity,layer:object.userData.shadowLayer});});
		return {ordinary:this.endpoints.describe(),suspended:this.suspended,rendered:this.rendered,lights};
	}

	/** Retire every owned scene resource after its final renderer lease ends.
	 * @returns {void} - Idempotent disposal leaves external renderer/cache resources borrowed.
	 */
	dispose(){if(this.disposed)return;this.disposed=true;try{this.endpoints.dispose();}finally{this.colorTarget.dispose();this.snapshotTexture.dispose();this.snapshotMaterial.dispose();this.snapshotGeometry.dispose();}}
}
