import {REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER as control} from '../../src/algorithm32/sampling-domains/direction/fibonacci/consts.js';

/** Derive a bounded, hemisphere-balanced 68-direction diagnostic from the control.
 * Retains azimuths, reflection pairs and weights; moves each 34-node polar sample
 * to the center of its equal-area interval, avoiding the asymmetric -Z endpoint
 * and the single overweighted exact horizon row. This is a distinct quadrature.
 * @returns {LocalSunIncomingDirectionDomain} - Explicitly identified candidate, never the frozen control.
 */
export function balancedShellIncoming() {
	const directions=control.unitVectors.map((direction,index)=>{
		const mu=(Math.floor(index/2)+0.5)*2/34-1;
		const phi=Math.atan2(direction[1],direction[0]);
		const radius=Math.sqrt(1-mu*mu);
		return /** @type {UnitVector3} */([radius*Math.cos(phi),radius*Math.sin(phi),mu]);
	});
	return {id:'shell-midpoint-reflection-completed68-v1',directionCount:68,unitVectors:directions,
		integrationWeights:{values:[...control.integrationWeights.values],units:'steradians'}};
}

/** Generate a candidate polar rule independently of the reference implementation.
 * @param {number} count - Positive Gaussian order.
 * @returns {LocalSunShellPolarNode[]} - Nodes on [-1,1], weights summing to two.
 */
function polarRule(count) {
	const result=[];
	for(let i=0;i<count;i++) {
		let x=Math.cos(Math.PI*(i+0.75)/(count+0.5)),derivative=0;
		for(let iteration=0;iteration<40;iteration++) {
			let previous=1,current=x;
			for(let degree=2;degree<=count;degree++) {const next=((2*degree-1)*x*current-(degree-1)*previous)/degree;previous=current;current=next;}
			derivative=count*(x*current-previous)/(x*x-1);
			const next=x-current/derivative;if(Math.abs(next-x)<1e-15){x=next;break;}x=next;
		}
		result.push({mu:x,weight:2/((1-x*x)*derivative*derivative)});
	}
	return result;
}

/** Construct the explicitly revised incoming quadrature for flat horizon support.
 * Refines small |mu| and both poles, keeps positive weights and a full sphere.
 * Outgoing W27 reconstruction and spatial shell addressing remain unchanged.
 * @param {24|48} [azimuthCount] - Explicit candidate azimuth resolution.
 * @param {0|0.5} [azimuthOffset] - Endpoint or midpoint cyclic rule.
 * @returns {LocalSunIncomingDirectionDomain} - Explicitly identified construction directions.
 */
export function partitionedShellIncoming(azimuthCount=24,azimuthOffset=0) {
	if(![24,48].includes(azimuthCount) || ![0,.5].includes(azimuthOffset))throw new Error('Unsupported partitioned azimuth policy.');
	const edges=[-1,-0.1,-0.01,-0.001,0,0.001,0.01,0.1,1];
	/** @type {UnitVector3[]} */
	const directions=[];
	const weights=[];
	for(let band=0;band<edges.length-1;band++) {
		const half=(edges[band+1]-edges[band])/2,center=(edges[band+1]+edges[band])/2;
		for(const node of polarRule(band===0 || band===edges.length-2 ? 8 : 4)) {
			const mu=center+half*node.mu,r=Math.sqrt(1-mu*mu);
			for(let az=0;az<azimuthCount;az++) {
				const phi=2*Math.PI*(az+azimuthOffset)/azimuthCount;directions.push([r*Math.cos(phi),r*Math.sin(phi),mu]);
				weights.push(node.weight*half*2*Math.PI/azimuthCount);
			}
		}
	}
	if(directions.length!==40*azimuthCount || Math.abs(weights.reduce((v,w)=>v+w,0)-4*Math.PI)>1e-11)
		throw new Error('Partitioned incoming quadrature normalization failed.');
	return {id:`shell-partitioned-polar40-azimuth${azimuthCount}-incoming${directions.length}${azimuthOffset ? '-midpoint' : ''}-v1`,directionCount:directions.length,unitVectors:directions,
		integrationWeights:{values:weights,units:'steradians'}};
}
