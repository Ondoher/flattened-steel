import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';
import {CANONICAL_SPECTRAL_CHANNELS} from '../../src/algorithm32/profiles/native-15/consts.js';
import {createShellLayout,radiusExcess} from './shell-layout.js';

/** Add row-local support at physical extinction scales inward from the vacuum cylinder.
	* @param {LocalSunShellLayout} parent - Owned compact shell mesh.
	* @param {readonly number[]} [multiples] - Positive ordered physical extinction-length support.
 * @returns {LocalSunShellLayout} - Same bands with additional admitted support nodes.
 */
export function addShellBoundarySupport(parent,multiples=[.25,1,4,16]) {
	if(!multiples.length || multiples.some((value,index)=>!Number.isFinite(value) || value<=0 || index>0 && value<=multiples[index-1]))throw new Error('Ordered positive boundary support required.');
	const atmosphere=CANONICAL_ATMOSPHERE_CONSTANTS;
	/** @type {LocalSunShellLayoutNode[]} */ const nodes=[];
	const rows=parent.rows.map((row,rowIndex)=>{
		const maximumBeta=Math.max(...CANONICAL_SPECTRAL_CHANNELS.map(channel=>{
			const wavelength=channel.wavelength.value/1000;
			return atmosphere.rayleighCoefficientScale*wavelength**-4*Math.exp(-row.z/atmosphere.rayleighScaleHeight.value)+atmosphere.mieAngstromBeta/atmosphere.mieScaleHeight.value*wavelength**-atmosphere.mieAngstromAlpha*Math.exp(-row.z/atmosphere.mieScaleHeight.value);
		}));
		const existing=row.indices.map(index=>parent.nodes[index]);
		for(const scale of multiples) {
			const rho=parent.maximumRho-scale/maximumBeta;if(rho<=0)continue;
			const distance=parent.height-row.z,excess=radiusExcess(rho,distance),radius=distance+excess;
			const next=parent.radii.findIndex(value=>value>radius),band=next<0 ? parent.bands.length-1 : Math.max(0,next-1);
			if(!parent.bands[band].admitted)throw new Error('Boundary refinement entered an omitted band.');
			existing.push({index:0,rowIndex,band,z:row.z,rho,radius,excess});
		}
		existing.sort((a,b)=>a.excess-b.excess);
		const indices=[];
		for(const node of existing) {if(indices.length && nodes[indices.at(-1)].excess===node.excess)continue;const index=nodes.length;nodes.push({...node,index});indices.push(index);}
		return {z:row.z,indices,excesses:indices.map(index=>nodes[index].excess)};
	});
	const refined=multiples.length!==4 || multiples.some((value,index)=>value!==[.25,1,4,16][index]);
	return {...parent,schema:refined ? 'local-sun-shell-layout-v9' : 'local-sun-shell-layout-v8',...(refined ? {boundaryExtinctionLengthMultiples:[...multiples]} : {}),nodes,rows};
}

/** Rebuild the developmental shell policy in the app after source-height or coverage change.
 * Resolution is derived from frozen physical controls, never from candidate values.
 * @param {LocalSunFrozenPlacement} state - Pinned original spatial resolution seeds.
 * @param {LocalSunShellLayout} previous - Current policy and altitude support.
 * @param {number} height - New finite source height above the slab, meters.
 * @param {number} maximumRho - Required source-centered physical coverage, meters.
 * @returns {LocalSunShellLayout} - Newly compacted mesh with empty bands omitted initially.
 */
export function rebuildShellLayout(state,previous,height,maximumRho) {
	if(!['local-sun-shell-layout-v8','local-sun-shell-layout-v9'].includes(previous.schema) || previous.reconstruction!=='geometric-density' || previous.interpolation!=='euclidean-radius')throw new Error('Unselected replacement layout policy.');
	const fractions=state.geometry.cacheRadialNodes.map(node=>node.value/state.geometry.cacheRadialMaximum.value);
	const refined=fractions.flatMap((value,index)=>index===fractions.length-1 ? [value] : [value,(value+fractions[index+1])/2]);
	return addShellBoundarySupport({...createShellLayout({height,top:previous.top,maximumRho,altitudes:previous.rows.map(row=>row.z),radialFractions:refined,axisSupport:true}),reconstruction:previous.reconstruction,interpolation:previous.interpolation},previous.boundaryExtinctionLengthMultiples);
}
