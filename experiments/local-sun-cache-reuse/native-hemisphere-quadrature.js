import {independentDirections} from './secondary-oracle.js';

/** Split the independent polar integral at the physical ground horizon before Gaussian refinement.
 * @param {number} polarCount - Total even count, split evenly between hemispheres.
 * @param {number} azimuthCount - Uniform periodic azimuth count.
 * @param {boolean} [dualEndpoint=false] - Concentrate independent support at both horizon and polar endpoints.
 * @returns {LocalSunIndependentAngularNode[]} - Positive independently derived steradian weights, with no candidate inputs.
 */
export function nativeHemisphereQuadrature(polarCount,azimuthCount,dualEndpoint=false) {
	if(polarCount%4!==0)throw new Error('Independent hemisphere Gaussian counts require two even subrules.');
	const original=independentDirections(polarCount/2,azimuthCount),nodes=[];
	for(const tap of original) {
		const u=(tap.direction[2]+1)/2;
		const mu=dualEndpoint ? Math.sin(Math.PI*u/2)**2 : Math.sinh(5*u)/Math.sinh(5);
		const jacobian=dualEndpoint ? Math.PI/2*Math.sin(Math.PI*u) : 5*Math.cosh(5*u)/Math.sinh(5);
		const radius=Math.sqrt(1-mu*mu),phi=Math.atan2(tap.direction[1],tap.direction[0]);
		const weight=tap.weight/2*jacobian;
		for(const sign of [-1,1])nodes.push({direction:/** @type {UnitVector3} */([radius*Math.cos(phi),radius*Math.sin(phi),sign*mu]),weight});
	}
	const total=nodes.reduce((sum,node)=>sum+node.weight,0);
	if(!Number.isFinite(total) || nodes.some(node=>node.weight<=0))throw new Error('Independent hemisphere weights are invalid.');
	for(const node of nodes)node.weight*=4*Math.PI/total;
	return nodes.sort((a,b)=>a.direction[2]-b.direction[2] || Math.atan2(a.direction[1],a.direction[0])-Math.atan2(b.direction[1],b.direction[0]));
}
