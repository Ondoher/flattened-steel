import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {nativeHemisphereQuadrature} from './native-hemisphere-quadrature.js';
import {nativeNestedOutgoingPolarSupport} from './native-outgoing-polar.js';
import {nativeReceiverQuadrature} from './native-receiver-quadrature.js';
import {nativeReceiverKnotQuadrature} from './native-receiver-knot-quadrature.js';
import {repositoryRoot,checkPath,hash} from './run-boundary.js';

/** Closed-form spherical integral of the squared Cornette-Shanks phase.
 * Substitute t=1+g*g-2*g*mu and integrate the resulting polynomial divided by t^3.
 * @param {number} g - Physical asymmetry parameter, strictly between zero and one.
 * @returns {number} - Independent rational/logarithmic phase-product integral.
 */
function squaredMieIntegral(g) {
	const a=1+g*g,b=2*g,low=a-b,high=a+b,scale=3/(8*Math.PI)*(1-g*g)/(2+g*g);
	const p0=(b*b+a*a)**2,p1=-4*a*(b*b+a*a),p2=6*a*a+2*b*b,p3=-4*a;
	const integral=p0/2*(low**-2-high**-2)+p1*(1/low-1/high)+p2*Math.log(high/low)+p3*(high-low)+(high*high-low*low)/2;
	return 2*Math.PI*scale*scale/(b**5)*integral;
}

/** Check independently known spherical and cosine-hemisphere moments before using the new polar rules as reference evidence.
 * @returns {Promise<void>} - Sealed analytic invariants; actual transport convergence remains required.
 */
async function main() {
	const run=await ExperimentRun.create('p3-ang-moments');
	try {
		const implementation=[];
		for(const name of ['prove-native-quadrature.js','native-hemisphere-quadrature.js','native-outgoing-polar.js','native-receiver-quadrature.js','native-receiver-knot-quadrature.js','secondary-oracle.js','native-grid-reference.js','primary-oracle.js','continuous-reference.js','ExperimentRun.js','run-boundary.js']) {
			const target=path.join(repositoryRoot,'experiments/local-sun-cache-reuse',name);await checkPath(repositoryRoot,target);const bytes=await readFile(target);
			implementation.push({path:path.relative(repositoryRoot,target).replaceAll('\\','/'),sha256:hash(bytes)});await run.write('source-'+name,bytes);
		}
		const sphere=[16,32,64].map(count=>{
			const taps=nativeHemisphereQuadrature(count,count*2);
			return {count:count*count*2,mass:taps.reduce((sum,t)=>sum+t.weight,0),odd:taps.reduce((sum,t)=>sum+t.weight*t.direction[2],0),
				momentErrors:[0,1,2,3].map(power=>Math.abs(taps.reduce((sum,t)=>sum+t.weight*t.direction[2]**(2*power),0)-4*Math.PI/(2*power+1))),
				unitError:Math.max(...taps.map(t=>Math.abs(Math.hypot(...t.direction)-1))),positive:taps.every(t=>t.weight>0)};
		});
		const receiver=[8,16,32].map(count=>{
			const taps=nativeReceiverQuadrature(count,32,'gauss-sinh5');
			return {count:taps.length,momentErrors:[0,1,2,3].map(power=>Math.abs(taps.reduce((sum,t)=>sum+t.weight*t.direction[2]**power,0)-2*Math.PI/(power+2))),
				unitError:Math.max(...taps.map(t=>Math.abs(Math.hypot(...t.direction)-1))),positive:taps.every(t=>t.weight>0)};
		});
		const dualSphere=[16,32,64].map(count=>{
			const taps=nativeHemisphereQuadrature(count,count*2,true),g=.7;
			const phase=taps.reduce((sum,t)=>sum+t.weight*(3/(8*Math.PI)*(1-g*g)/(2+g*g)*(1+t.direction[2]**2)/(1+g*g-2*g*t.direction[2])**1.5)**2,0);
			return {count:taps.length,positive:taps.every(t=>t.weight>0),
				unitError:Math.max(...taps.map(t=>Math.abs(Math.hypot(...t.direction)-1))),
				momentErrors:[0,1,2,3].map(power=>Math.abs(taps.reduce((sum,t)=>sum+t.weight*t.direction[2]**(2*power),0)-4*Math.PI/(2*power+1))),
				phaseSquared:phase,phaseSquaredExact:squaredMieIntegral(g),phaseSquaredError:Math.abs(phase-squaredMieIntegral(g))};
		});
		const support=nativeHemisphereQuadrature(32,64).filter((_,i)=>i%64===0).map(tap=>tap.direction[2]);
		const receiverKnots=[32,64,128].map(count=>{
			const taps=nativeReceiverKnotQuadrature(count,8,support);
			return {count:taps.length,momentErrors:[0,1,2,3].map(power=>Math.abs(taps.reduce((sum,t)=>sum+t.weight*t.direction[2]**power,0)-2*Math.PI/(power+2))),
				unitError:Math.max(...taps.map(t=>Math.abs(Math.hypot(...t.direction)-1))),positive:taps.every(t=>t.weight>0)};
		});
		const cutoff=support.find(mu=>mu>0);
		const receiverBounded=[16,32,64].map(count=>{
			const taps=nativeReceiverKnotQuadrature(count,16,support,true);
			return {count:taps.length,momentErrors:[0,1,2,3].map(power=>Math.abs(taps.reduce((sum,t)=>sum+t.weight*t.direction[2]**power,0)-2*Math.PI*(1-cutoff**(power+2))/(power+2))),
				unitError:Math.max(...taps.map(t=>Math.abs(Math.hypot(...t.direction)-1))),positive:taps.every(t=>t.weight>0)};
		});
		/** @type {LocalSunNativeOutgoingPower[]} */const outgoingPowers=[2,4];
		const nestedOutgoing=outgoingPowers.flatMap(power=>[8,16,32,64,128].map(count=>{
			const nodes=nativeNestedOutgoingPolarSupport(count,power),previous=count>8 ? nativeNestedOutgoingPolarSupport(count/2,power) : null;
			return {count,power,nodes,ordered:nodes.every((value,index)=>Number.isFinite(value) && (index===0 || value>nodes[index-1])),
				complete:nodes.length===count+1 && nodes[0]===-1 && nodes.at(-1)===1 && nodes[count/2]===0,
				symmetric:nodes.every((value,index)=>value===-nodes[nodes.length-1-index]),
				nested:previous===null || previous.every((value,index)=>nodes[index*2]===value)};
		}));
		const qualified=[sphere.at(-1),dualSphere.at(-1),receiver.at(-1),receiverKnots.at(-1),receiverBounded.at(-1)].every(row=>row.positive && row.unitError<1e-12 && row.momentErrors.every(error=>error<1e-10)) && sphere.every(row=>Math.abs(row.odd)<1e-10 && Math.abs(row.mass-4*Math.PI)<1e-10) && dualSphere.at(-1).phaseSquaredError<1e-10 && nestedOutgoing.every(row=>row.ordered && row.complete && row.symmetric && row.nested);
		await run.write('inputs.json',JSON.stringify({implementation,tools:{node:process.version},command:process.argv.slice(1),operation:'Positive quadrature, unit directions and analytic moments: integral over sphere of mu^(2k)=4*pi/(2k+1), odd mu=0; cosine-hemisphere integral of mu^k=2*pi/(k+2). Retain every coarse error; require finest analytic accuracy 1e-10. No candidate or reference field inputs.'},null,'\t'));
		await run.write('result.json',JSON.stringify({schema:'independent-angular-moments-v1',sphere,dualSphere,nestedOutgoing,receiver,receiverKnots,receiverBounded,cutoff,support,qualified,claim:'Analytic rule invariants and exact nested outgoing support only; actual source-function, complete-view and receiver transport convergence are separate. Dual-endpoint phase-product calibration uses the independent rational/logarithmic integral at g=0.7. Bounded-rule analytic moments use the retained interval [cutoff,1], without renormalizing its omitted positive mass.'},null,'\t'));
		await run.finish(qualified ? 'accepted' : 'rejected');console.log(JSON.stringify({run:run.name,qualified,receiverBounded:receiverBounded.map(r=>r.momentErrors),cutoff}));
	} catch(error){await run.finish('failed',error instanceof Error?error.stack:String(error));throw error;}
}
await main();
