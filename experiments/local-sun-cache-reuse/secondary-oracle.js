import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';
import {CANONICAL_SPECTRAL_CHANNELS} from '../../src/algorithm32/profiles/native-15/consts.js';
import {primaryRadiance} from './primary-oracle.js';

/** Independently generate a Gauss-Legendre x uniform-azimuth angular integral.
 * @param {number} muCount - Positive even polar quadrature count.
 * @param {number} azimuthCount - Positive azimuth count.
 * @param {LocalSunNativePolarTransform} [polarTransform] - Independent horizon-focused change of integration variable.
 * @param {LocalSunNativeAzimuthRule} [azimuthRule] - Independent periodic or endpoint-refined azimuth integral.
 * @returns {LocalSunIndependentAngularNode[]} - Physical unit directions and steradian weights.
 */
export function independentDirections(muCount,azimuthCount,polarTransform='uniform',azimuthRule='uniform') {
	if(!Number.isInteger(muCount) || muCount<2 || muCount%2 || !Number.isInteger(azimuthCount) || azimuthCount<2)
		throw new Error('Invalid independent product quadrature.');
	/** @type {LocalSunIndependentAngularNode[]} */
	const nodes=[];
	const azimuths=azimuthRule==='quadrant-gauss' ? gaussianAzimuths(azimuthCount) : Array.from({length:azimuthCount},(_,i)=>({phi:2*Math.PI*i/azimuthCount,weight:2*Math.PI/azimuthCount}));
	for(let index=0;index<muCount;index++) {
		let mu=Math.cos(Math.PI*(index+0.75)/(muCount+0.5)),derivative=0;
		for(let iteration=0;iteration<32;iteration++) {
			let p0=1,p1=mu;
			for(let order=2;order<=muCount;order++){const next=((2*order-1)*mu*p1-(order-1)*p0)/order;p0=p1;p1=next;}
			derivative=muCount*(mu*p1-p0)/(mu*mu-1);
			const step=p1/derivative;mu-=step;if(Math.abs(step)<1e-15)break;
		}
		let weight=2/((1-mu*mu)*derivative*derivative);
		if(polarTransform!=='uniform') {const strength=polarTransform==='sinh10' ? 10 : 5;weight*=strength*Math.cosh(strength*mu)/Math.sinh(strength);mu=Math.sinh(strength*mu)/Math.sinh(strength);}
		for(const az of azimuths) {
			const r=Math.sqrt(Math.max(0,1-mu*mu));
			nodes.push({direction:[r*Math.cos(az.phi),r*Math.sin(az.phi),mu],weight:weight*az.weight});
		}
	}
	const total=nodes.reduce((v,n)=>v+n.weight,0);
	if(Math.abs(total-4*Math.PI)>(polarTransform==='uniform' ? 1e-11 : 1e-6))throw new Error('Independent angular normalization failed.');
	if(polarTransform!=='uniform')for(const node of nodes)node.weight*=4*Math.PI/total;
	return nodes;
}

/** Independently refine azimuth endpoints at the cylinder tangent meridians.
 * @param {number} count - Total azimuth taps, divisible by eight.
 * @returns {LocalSunReferenceAzimuthNode[]} - Sorted quadrant Gaussian angles and radian weights.
 */
function gaussianAzimuths(count) {
	if(count%8)throw new Error('Quadrant Gaussian azimuth count must be divisible by eight.');
	const per=count/4,nodes=[];
	for(let quadrant=0;quadrant<4;quadrant++)for(let i=0;i<per;i++) {
		let x=Math.cos(Math.PI*(i+.75)/(per+.5)),derivative=0;
		for(let iteration=0;iteration<32;iteration++) {
			let previous=1,current=x;
			for(let degree=2;degree<=per;degree++){const next=((2*degree-1)*x*current-(degree-1)*previous)/degree;previous=current;current=next;}
			derivative=per*(x*current-previous)/(x*x-1);const step=current/derivative;x-=step;if(Math.abs(step)<1e-15)break;
		}
		nodes.push({phi:quadrant*Math.PI/2+(1-x)*Math.PI/4,weight:2/((1-x*x)*derivative*derivative)*Math.PI/4});
	}
	return nodes;
}

/** Independently integrate continuous primary radiance into second-order density.
 * Uses no candidate data, spatial grid, or incoming/outgoing quadrature.
 * @param {LocalSunFrozenPlacement} state - Physical source and medium.
 * @param {readonly number[]} point - Source-relative point, meters.
 * @param {readonly UnitVector3[]} outgoing - Withheld physical direction sentinels.
 * @param {number} radius - Declared physical truncation cylinder, meters.
 * @param {number} muCount - Gauss-Legendre polar count.
 * @param {number} azimuthCount - Independent azimuth count.
 * @param {number} pathIntervals - Continuous L1 Simpson interval count.
 * @param {function(number,number):Promise<void>} progress - Yield/monitor observer.
 * @param {readonly LocalSunIndependentAngularNode[]} [diagnosticNodes] - Explicit discrete-control quadrature, never independent-reference authority.
 * @param {boolean} [normalizePhase] - Diagnostic per-direction kernel normalization, false for the continuous reference.
 * @param {LocalSunNativePolarTransform} [polarTransform] - Independent reference integration variable.
 * @param {LocalSunNativeAzimuthRule} [azimuthRule] - Explicit endpoint-refined angular reference.
 * @returns {Promise<number[][]>} - One Native15 J2 packet per outgoing query.
 */
export async function secondaryDensity(state,point,outgoing,radius,muCount,azimuthCount,pathIntervals,progress,diagnosticNodes,normalizePhase=false,polarTransform='uniform',azimuthRule='uniform') {
	const constants=CANONICAL_ATMOSPHERE_CONSTANTS,g=constants.miePhaseFunctionG;
	const r=CANONICAL_SPECTRAL_CHANNELS.map(c=>constants.rayleighCoefficientScale*(c.wavelength.value/1000)**-4*Math.exp(-point[2]/constants.rayleighScaleHeight.value));
	const m=CANONICAL_SPECTRAL_CHANNELS.map(c=>constants.mieSingleScatteringAlbedo*(constants.mieAngstromBeta/constants.mieScaleHeight.value)*(c.wavelength.value/1000)**-constants.mieAngstromAlpha*Math.exp(-point[2]/constants.mieScaleHeight.value));
	const values=outgoing.map(()=>new Array(15).fill(0)),nodes=diagnosticNodes ?? independentDirections(muCount,azimuthCount,polarTransform,azimuthRule);
	const rayleighSum=outgoing.map(()=>new Array(15).fill(0)),mieSum=outgoing.map(()=>new Array(15).fill(0));
	const rayleighNorm=outgoing.map(()=>0),mieNorm=outgoing.map(()=>0);
	// At the physical source axis, primary transport is rotationally symmetric.
	// Reuse its continuous integral, while retaining every independent phase tap.
	/** @type {Map<number,number[]>} */
	const axisRadiance=new Map();
	/** @type {Map<number,number[]>} */
	const reflectedRadiance=new Map();
	for(let index=0;index<nodes.length;index++) {
		const incoming=nodes[index],axis=point[0]===0 && point[1]===0;
		// For independently generated product nodes, reflection across the source
		// meridian preserves continuous L1. Phase still uses each physical direction.
		const az=index%azimuthCount,reflectionKey=Math.floor(index/azimuthCount)*azimuthCount+Math.min(az,azimuthRule==='uniform' ? azimuthCount-az : azimuthCount-1-az);
		const reflected=point[1]===0 && !diagnosticNodes;
		let l=axis ? axisRadiance.get(incoming.direction[2]) : reflected ? reflectedRadiance.get(reflectionKey) : undefined;
		if(!l){l=primaryRadiance(state,point,incoming.direction,radius,pathIntervals);if(axis)axisRadiance.set(incoming.direction[2],l);else if(reflected)reflectedRadiance.set(reflectionKey,l);}
		outgoing.forEach((direction,d)=>{
			const mu=Math.max(-1,Math.min(1,direction.reduce((sum,v,i)=>sum+v*incoming.direction[i],0)));
			const phaseR=3/(16*Math.PI)*(1+mu*mu);
			const phaseM=3/(8*Math.PI)*(1-g*g)/(2+g*g)*(1+mu*mu)/(1+g*g-2*g*mu)**1.5;
			rayleighNorm[d]+=incoming.weight*phaseR;mieNorm[d]+=incoming.weight*phaseM;
			for(let c=0;c<15;c++){rayleighSum[d][c]+=incoming.weight*l[c]*phaseR;mieSum[d][c]+=incoming.weight*l[c]*phaseM;}
		});
		if(index%16===0)await progress(index,nodes.length);
	}
	for(let d=0;d<outgoing.length;d++)for(let c=0;c<15;c++)
		values[d][c]=r[c]*rayleighSum[d][c]/(normalizePhase ? rayleighNorm[d] : 1)+m[c]*mieSum[d][c]/(normalizePhase ? mieNorm[d] : 1);
	return values;
}
