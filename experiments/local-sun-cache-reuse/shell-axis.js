import {FlatEarthGeometry} from '../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js';
import {LocalSunCache} from '../../src/algorithm32/implementation/local-sun/cache/LocalSunCache.js';
import {shellLogReconstructionFactor} from './shell-reconstruction.js';

/** Experiment instance's compact topology, never global production state. */
const layouts=/** @type {WeakMap<FlatEarthGeometry,LocalSunShellLayout>} */(new WeakMap());
/** Immutable node factors for one owned topology; no sampled field values are cached. */
const nodeFactors=/** @type {WeakMap<FlatEarthGeometry,number[][]>} */(new WeakMap());
/** One last source-relative query's analytic factors, keyed by exact physical coordinates. */
const queryFactors=/** @type {WeakMap<FlatEarthGeometry,{rho:number,z:number,logs:number[]}>} */(new WeakMap());

/** Register an owned mesh for per-node axis reconstruction.
 * @param {FlatEarthGeometry} geometry - Newly owned experimental geometry.
 * @param {LocalSunShellLayout} layout - Matching compact mesh.
 * @returns {void} - Retains topology without taking resource ownership.
 */
export function registerShellAxis(geometry,layout) {
	layouts.set(geometry,layout);queryFactors.delete(geometry);
	if(layout.reconstruction)nodeFactors.set(geometry,layout.nodes.map(node=>Array.from({length:15},(_,channel)=>shellLogReconstructionFactor(layout,node.rho,node.z,channel))));
	else nodeFactors.delete(geometry);
}

/** Weight a stored physical J sample through the selected analytic reconstruction.
 * @param {FlatEarthGeometry} geometry - Owned physical query frame.
 * @param {number} index - Compact sample address.
 * @param {Position} position - Physical query, meters.
 * @param {number} channel - Native15 channel index.
 * @returns {number} - Positive multiplier; one for historical reconstruction.
 */
export function shellSpectralNodeWeight(geometry,index,position,channel) {
	const layout=layouts.get(geometry);if(!layout?.reconstruction)return 1;
	const coordinate=geometry.resolveAtmosphereCoordinate(position),rho=coordinate.rho.value,z=coordinate.altitude.value;
	let query=queryFactors.get(geometry);
	if(!query || query.rho!==rho || query.z!==z) {query={rho,z,logs:Array.from({length:15},(_,c)=>shellLogReconstructionFactor(layout,rho,z,c))};queryFactors.set(geometry,query);}
	return Math.exp(query.logs[channel]-nodeFactors.get(geometry)[index][channel]);
}

/** Resolve a node's direction; axis taps use one azimuth-independent meridian.
 * This repairs the spatial axis limit without changing the W27 inventory.
 * Physical accuracy of the chosen reconstruction still requires reference checks.
 * @param {FlatEarthGeometry} geometry - Query geometry, shell or historical control.
 * @param {number} positionIndex - Retained compact node address.
 * @param {Position} position - Physical query position.
 * @param {UnitVector3} direction - Physical outgoing direction.
 * @returns {ScatteringCacheDirectionStencil} - Four W27 angular taps.
 */
export function shellNodeDirectionStencil(geometry,positionIndex,position,direction) {
	const layout=layouts.get(geometry);
	if(!layout || layout.nodes[positionIndex].rho!==0)
		return geometry.resolveScatteringCacheDirectionStencil({position,physicalOutgoingDirection:direction});
	const frame=geometry.configuration.cacheRadialFallbackDirection;
	const horizontal=Math.hypot(direction[0],direction[1]);
	return geometry.resolveScatteringCacheDirectionStencil({
		position:geometry.configuration.sourceSubpoint,
		physicalOutgoingDirection:[frame[0]*horizontal,frame[1]*horizontal,direction[2]],
	});
}

/** Adapt a newly constructed cache's runtime lookup to use axis-aware per-node taps.
 * @param {LocalSunCache} cache - Owned complete GPU cache.
 * @param {LocalSunShellNodeTexture} [nodeTexture] - Optional factor texture transferred to this cache's lifetime.
 * @param {LocalSunShellNodeTexture} [excessTexture] - Optional radius-excess texture transferred to the same lifetime.
 * @returns {void} - Changes the contribution of this instance, keeping its binding/disposal.
 */
export function installShellAxisCache(cache,nodeTexture,excessTexture) {
	const original=cache.createShaderContribution.bind(cache);
	if(nodeTexture || excessTexture) {
		const dispose=cache.dispose.bind(cache);let disposed=false;
		cache.dispose=()=>{if(disposed)return;disposed=true;try{dispose();}finally{nodeTexture?.dispose();excessTexture?.dispose();}};
	}
	cache.createShaderContribution=()=>{
		const contribution=original();
		let replaced=false;
		const functions=contribution.functions.map(block=>{
			if(!block.code.includes('SpectralValue sampleCumulativeScatteringDensity('))return block;
			replaced=true;
			const start=block.code.indexOf('\tCacheDirectionStencil directionStencil =');
			const end=block.code.indexOf('\tSpectralValue density;',start);
			if(start<0 || end<0)throw new Error('Shell axis runtime collaborator changed.');
			let code=(block.code.slice(0,start)+`\tCacheDirectionStencil normalDirectionStencil = resolveScatteringCacheDirectionStencil(positionMeters,physicalOutgoingDirection);
\tCacheDirectionStencil axisDirectionStencil = shellAxisDirectionStencil(physicalOutgoingDirection);
`+block.code.slice(end))
				.replace('\t\t\tfor (int directionTapIndex = 0;',
					'\t\t\tCacheDirectionStencil directionStencil = normalDirectionStencil;\n\t\t\tif(shellNodeExcess(positionStencil.indices[positionTapIndex])==0.0)directionStencil=axisDirectionStencil;\n\t\t\tfor (int directionTapIndex = 0;')
				.replace('float weight = positionStencil.weights[positionTapIndex]',
					'float weight = shellSpectralNodeWeight(positionStencil.indices[positionTapIndex],atmosphereCoordinate.rhoMeters,atmosphereCoordinate.altitudeMeters,channelIndex) * positionStencil.weights[positionTapIndex]');
			if(!code.includes('directionStencil=axisDirectionStencil'))throw new Error('Shell axis runtime loop changed.');
			if(nodeTexture) {
				code=code.replace('\t\tfor (int positionTapIndex = 0;',
					'\t\tfloat shellQueryLog = shellLogFactor(atmosphereCoordinate.rhoMeters,atmosphereCoordinate.altitudeMeters,channelIndex);\n\t\tfor (int positionTapIndex = 0;')
					.replace('shellSpectralNodeWeight(positionStencil.indices[positionTapIndex],atmosphereCoordinate.rhoMeters,atmosphereCoordinate.altitudeMeters,channelIndex)',
						'shellSpectralNodeWeightFromLog(positionStencil.indices[positionTapIndex],shellQueryLog,channelIndex)');
				if(!code.includes('float shellQueryLog ='))throw new Error('Shell factor-hoisting anchor changed.');
			}
			return {...block,code};
		});
		if(!replaced)throw new Error('Shell axis cache contribution missing.');
		return {...contribution,id:contribution.id+'-shell-axis-v1',functions,
			uniforms:[...contribution.uniforms,...(nodeTexture ? [{name:'uShellNodeFactors',type:/** @type {const} */('sampler2D'),valueKey:'experiment.shellNodeFactors',defaultValue:nodeTexture}] : []),
				...(excessTexture ? [{name:'uShellExcessNodes',type:/** @type {const} */('sampler2D'),valueKey:'experiment.shellExcessNodes',defaultValue:excessTexture}] : [])]};
	};
}
