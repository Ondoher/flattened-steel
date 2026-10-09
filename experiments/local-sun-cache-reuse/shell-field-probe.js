import {sampleField,residual} from './rotation-model.js';
import {primaryBoundary,primaryOpticalDepth} from './primary-oracle.js';

/** Isolate construction quadrature error from measured-field interpolation error.
 * Integrate the same GPU J2 readback using a distinct binary64 Simpson rule.
 * This is a common-input numerical diagnosis, not an independent physical oracle.
 * @param {LocalSunRotationOwners} owners - Owned canonical-Flat0 query model.
 * @param {Map<string,LocalSunRotationField>} fields - Actual pure J2/L2 GPU readbacks.
 * @param {LocalSunShellLayout} layout - Admitted physical support and cylinder.
 * @returns {LocalSunShellPrimaryProof} - Every selected packet and path refinement.
 */
export function probeShellFieldTransport(owners,fields,layout) {
	const j=fields.get('local-sun-j2'),l=fields.get('local-sun-l2');
	if(!j || !l)throw new Error('Transport diagnosis requires pure J2 and L2.');
	const center=owners.geometry.configuration.sourceSubpoint.coordinates;
	const polar=Array.from({length:owners.domains.incomingDirectionCount/48},(_,i)=>i);
	polar.sort((a,b)=>Math.abs(owners.domains.incomingUnitVectors[a*48][2])-Math.abs(owners.domains.incomingUnitVectors[b*48][2]));
	const directions=polar.slice(0,2).flatMap(m=>[0,6,12,18,24,30,36,42].map(a=>m*48+a));
	const samples=[];
	for(const altitude of [7000,25000,99000]) {
		const row=layout.rows.reduce((a,b)=>Math.abs(a.z-altitude)<Math.abs(b.z-altitude) ? a : b);
		for(const nodeIndex of [row.indices[0],row.indices.at(-1)])for(const di of directions) {
			const node=layout.nodes[nodeIndex],point=[node.rho,0,node.z],direction=owners.domains.incomingUnitVectors[di];
			let length=primaryBoundary(point,direction,layout.maximumRho,layout.top);
			const altitudeAt=(/** @type {number} */ t)=>Math.max(0,Math.min(layout.top,point[2]+direction[2]*t));
			if(Math.min(...primaryOpticalDepth(point[2],altitudeAt(length),Math.max(length,Math.abs(altitudeAt(length)-point[2]))))>32) {
				let low=0,high=length;
				for(let i=0;i<48;i++){const mid=(low+high)/2,z=altitudeAt(mid);if(Math.min(...primaryOpticalDepth(point[2],z,Math.max(mid,Math.abs(z-point[2]))))>32)high=mid;else low=mid;}
				length=high;
			}
			const levels=[240,480,960].map(intervals=>{
				const values=new Array(15).fill(0);
				for(let i=1;i<=intervals;i++) {
					const u=i/intervals,t=length*u*u,z=altitudeAt(t);
					const p=[center[0]+point[0]+direction[0]*t,center[1]+direction[1]*t,z];
					const density=sampleField(j,owners.geometry,p,direction),tau=primaryOpticalDepth(point[2],z,Math.max(t,Math.abs(z-point[2])));
					const weight=(i===intervals ? 1 : i%2 ? 4 : 2)*2*length*u/(3*intervals);
					for(let c=0;c<15;c++)values[c]+=weight*Math.exp(-tau[c])*density[c];
				}
				return {intervals,values};
			});
			const reference=levels[2].values,observed=Array.from({length:15},(_,c)=>l.values[(c*l.storage.height+nodeIndex)*l.storage.width+di]);
			const differences=levels.slice(1).map((level,i)=>Math.max(...level.values.map((v,c)=>Math.abs(v-levels[i].values[c])/(1e-9+.1*Math.abs(reference[c])))));
			samples.push({quantity:'L2-common-field',position:point,directionIndex:di,direction,observed,reference,levels,
				physical:residual(observed,reference,1e-9,.1),referenceDifferences:differences,
				converged:differences[1]*2<=.1 && (differences[1]<1e-12 || differences[1]<=differences[0]/2)});
		}
	}
	return {schema:'shell-common-field-transport-v1',samples,claim:'Construction quadrature diagnosis against the same GPU J2 interpolation; no independent physical or layout qualification. Tail retained through tau32 in all channels; empirical path differences remain explicit.'};
}
