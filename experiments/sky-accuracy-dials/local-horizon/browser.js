import * as THREE from 'three';
import {Flat32Application} from '../../../src/flat32/Flat32Application.js';
import {ThreeSceneRuntime} from '../../../src/flat32/ThreeSceneRuntime.js';
import '../horizon/browser.js';
import {LocalSunCompactProfileSelection} from '../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactProfileSelection.js';
import {referenceBlock} from './reference.mjs';

/** Observe the unchanged local runtime, freeze physical owners, and sample registered headings.
 * @returns {LocalHorizonRegistration} Physical inputs and current GPU shader measurements; missing owners throw.
 */
function observe() {
	const app = /** @type {Flat32Application} */ (/** @type {unknown} */ (window.__horizonApplication));
	const scene = /** @type {ThreeSceneRuntime} */ (app._sceneRuntime);
	const profile = new LocalSunCompactProfileSelection().create({observation: app._state.observation,
		observerPosition: {coordinates: [0, 0, 5], units: 'meters'}, viewRayLimit: {value: 1926774, units: 'meters'}, maximumScatteringOrder: 1});
	const {atmosphere, lightSource, geometry} = profile.models;
	const c = atmosphere.constants, s = lightSource.configuration;
	const medium = {geometry: 'flat',sourceKind: 'finite',radius: 6360000,topAltitude: 100000,
		sourcePosition: [...s.position.coordinates],sourceDirection: [0, 0, 1],referenceDistance: s.referenceDistance.value,incidentScale: 1,
		rayleighHeight: c.rayleighScaleHeight.value,mieHeight: c.mieScaleHeight.value,albedo: c.mieSingleScatteringAlbedo,g: c.miePhaseFunctionG,
		rayleigh: [...atmosphere.seaLevelRayleighScattering.values],mie: [...atmosphere.seaLevelMieExtinction.values],sourceIrradiance: [...profile.spectral.sourceIrradianceDensity.values]};
	const camera = scene.camera, previous = camera.quaternion.clone();
	const sun = new THREE.Vector3(...medium.sourcePosition);sun.z = 0;sun.normalize();
	const readings = [];
	for (const [heading, angle] of [['toward', 0], ['cross', Math.PI/2], ['away', Math.PI]]) {
		const a = Number(angle), desired = [sun.x*Math.cos(a)-sun.y*Math.sin(a),sun.x*Math.sin(a)+sun.y*Math.cos(a),0];
		const axes = [[1,0,0],[0,1,0],[0,0,1]].map(v => geometry.mapObserverLocalSceneDirectionToModelDirection(/** @type {UnitVector3} */ (/** @type {unknown} */ (v))));
		const v = axes.map(axis => axis.reduce((sum,x,k)=>sum+x*desired[k],0));
		camera.lookAt(camera.position.clone().add(new THREE.Vector3(...v)));camera.updateMatrixWorld(true);
		scene._renderOperation();
		const observation = window.__observeHorizon();
		readings.push({heading: String(heading),rays: observation.rays.filter(r=>r.uv[0]===0.5)});
	}
	camera.quaternion.copy(previous);camera.updateMatrixWorld(true);scene._renderOperation();
	const observation = window.__observeHorizon();
	return {medium: /** @type {HorizonReferenceMedium} */ (medium),observation,readings,
		order: app._localMaximumScatteringOrder,cachePolicy: app._localSunCachePolicy,configuration: s,
		baseline: scene.renderer.domElement.toDataURL('image/png')};
}

/** Substitute independent N1 transport only in a borrowed shader; preserve display/scene/camera state.
 * @param {HorizonReferenceMedium} medium Frozen physical packet.
 * @param {number} nodes Quadrature refinement, 64 or 128.
 * @returns {LocalHorizonImageResult} Actual image and ray probes; restores the original material on failure.
 */
function compare(medium, nodes) {
	const app=/** @type {Flat32Application} */ (/** @type {unknown} */ (window.__horizonApplication)),scene=/** @type {ThreeSceneRuntime} */ (app._sceneRuntime);
	const runtime=/** @type {HorizonRuntimeObservation} */ (/** @type {unknown} */ (app._modeController._activeRuntime));
	const pass=/** @type {LocalHorizonPass|undefined} */ ((window.__horizonPasses??[]).filter(p=>!p._disposed&&p.material?.fragmentShader?.includes('createInitialShaderState')).at(-1)??runtime._composer?.passes.find(p=>p.material?.fragmentShader?.includes('createInitialShaderState')));
	if(!pass?.material)throw new Error('Current atmosphere material missing');
	const material=pass.material,original=material.fragmentShader;
	if(original.split('evaluatePathRadiance(state);').length!==2)throw new Error('Transport hook is not unique');
	try{
		material.fragmentShader=original.replace('void main() {',referenceBlock(medium,nodes)+'\nvoid main() {').replace('evaluatePathRadiance(state);','lhPath(state);');
		material.needsUpdate=true;scene._renderOperation();
		const image=scene.renderer.domElement.toDataURL('image/png');
		const observation=window.__observeHorizon();
		return {image,observation};
	}finally{material.fragmentShader=original;material.needsUpdate=true;scene._renderOperation();}
}

window.__localHorizon={observe,compare};
