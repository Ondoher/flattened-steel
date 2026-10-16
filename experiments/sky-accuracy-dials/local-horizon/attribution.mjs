import {gauss} from '../continuation/direct-solver/math.mjs';
import {along,dot,phase,illumination,opticalDepth} from '../horizon-reference/math.mjs';

/** Attribute N1 to physical species, distances and attenuation legs, without changing extinction.
 * @param {HorizonReferenceGroup} group Matched ray/channel and physical medium.
 * @returns {LocalHorizonAttribution} Additive radiance partitions and radiance-weighted moments; units remain explicit.
 */
export function attribute(group){
	const {medium:m,origin:o,direction:v,channel:c,end}=group,q=gauss(128);
	const edges=[0,1e4,5e4,1e5,3e5,1e6,end],bins=Array(6).fill(0),species=[0,0],moments=Array(5).fill(0),factorial=Array(4).fill(0);
	for(let b=0;b<6;b++){
		const a=Math.min(end,edges[b]),z=Math.min(end,edges[b+1]);if(z<=a)continue;
		const la=Math.log1p(a/1000),dz=Math.log1p(z/1000)-la;
		for(let j=0;j<128;j++){
			const t=1000*Math.expm1(la+dz*q.nodes[j]),jac=(t+1000)*dz*q.weights[j],x=along(o,v,t);
			const delta=m.sourcePosition.map((s,k)=>s-x[k]),d=Math.hypot(...delta),s=delta.map(y=>y/d);
			const solarLength=Math.min(d,(m.topAltitude-x[2])/s[2]),sourceTau=opticalDepth(m,x,s,solarLength,c),viewTau=opticalDepth(m,o,v,t,c);
			const p=phase(dot(v,s),m.g),E=m.sourceIrradiance[c]*m.incidentScale*(m.referenceDistance/d)**2;
			const R=m.rayleigh[c]*Math.exp(-x[2]/m.rayleighHeight)*p[0],M=m.mie[c]*m.albedo*Math.exp(-x[2]/m.mieHeight)*p[1];
			const incident=illumination(m,x,c)[3],Tv=Math.exp(-viewTau),terms=[R*incident*Tv*jac,M*incident*Tv*jac],total=terms[0]+terms[1];
			terms.forEach((value,k)=>{species[k]+=value;});bins[b]+=total;
			[t,x[2],solarLength,sourceTau,viewTau].forEach((value,k)=>{moments[k]+=total*value;});
			[total,(R+M)*incident*jac,(R+M)*E*Tv*jac,(R+M)*E*jac].forEach((value,k)=>{factorial[k]+=value;});
		}
	}
	const total=species[0]+species[1];
	return {total,species,bins,moments:moments.map(x=>x/total),factorial};
}
