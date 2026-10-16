import assert from 'node:assert/strict';
import {createRun,identity,readRepository,verifyRun} from '../io/files.mjs';
import {readParent} from '../hypotheses/common.mjs';
import {direct,estimate} from '../horizon-reference/math.mjs';
import {colorimetry} from '../horizon/diagnosis-color.mjs';
import {attribute} from './attribution.mjs';

/** Summarize current comparisons and reuse independent all-order data only after exact physical compatibility.
 * @returns {void} Sealed report and image contact sheet; compatibility or qualification failures seal failure.
 */
function main(){
	const start=Date.now(),parent=process.argv[2];assert.ok(parent,'Explicit capture parent required');
	const parents=[verifyRun(parent)],p=parent.split('/').at(-1);
	const registration=/** @type {LocalHorizonRegistration} */(readParent(p,'registration.json',parents));
	const captureSeal=/** @type {LocalHorizonRecoverySeal} */(readParent(p,'sealed.json',parents));
	if(captureSeal.state!=='accepted'){
		const qualification=process.argv[3];assert.ok(qualification,'A failed capture requires an explicit accepted artifact-qualification run');
		parents.push(verifyRun(qualification));
		const qSeal=/** @type {LocalHorizonRecoverySeal} */(JSON.parse(readRepository(qualification+'/sealed.json').toString()));
		const q=/** @type {LocalHorizonQualification} */(JSON.parse(readRepository(qualification+'/qualification.json').toString()));
		assert.equal(qSeal.state,'accepted');assert.equal(q.source,parent);assert.equal(q.parentState,'failed');
		parents.push(identity(qualification+'/qualification.json'));
	}
	const current=/** @type {LocalHorizonRayPacket} */(readParent(p,'independent-rays.json',parents));
	const inputs=/** @type {HorizonReferenceInputs} */(readParent('00267-h21-h26-ref','inputs.json.gz',parents));
	const prior=/** @type {HorizonReferenceBatch[]} */(readParent('00267-h21-h26-ref','confirmation-batches.json.gz',parents));
	const displaySeal=/** @type {LocalHorizonParentSeal} */(readParent('00270-h27-brightness','sealed.json',parents));
	const displayProof=readParent('00270-h27-brightness','brightness.json',parents);
	const run=createRun('h36-h37-report',{parents,operation:'Exact physical compatibility qualification, signed ray/gradient comparison, independent N1 two-leg attribution and reuse of sealed GPU all-order batches; actual captured PNG contact sheet, no resimulation or production change.',parameters:{scope:'Numerical/model evaluation; current production correctness is open.',thresholds:{relative:0.02,xy:0.002,floor:1e-10}}});
	let sealed=false;
	try{
		const m=registration.medium,old=inputs.groups[0].medium;
		const keys=['geometry','sourceKind','radius','topAltitude','sourcePosition','referenceDistance','incidentScale','rayleighHeight','mieHeight','albedo','g','rayleigh','mie','sourceIrradiance'];
		for(const key of keys.filter(k=>k!=='sourcePosition'))assert.deepEqual(m[key],old[key],'Physical input differs: '+key);
		assert.deepEqual(m.sourcePosition.map(Math.fround),old.sourcePosition.map(Math.fround),'GPU source-position inputs differ');
		const sourceRoundingSensitivity=Math.max(...current.rows.flatMap(row=>Array.from({length:15},(_,channel)=>{
			const g={id:'rounding-control',medium:{...m,sourcePosition:old.sourcePosition},origin:[0,0,5],direction:row.direction,channel,end:row.end};
			return Math.abs(direct(g,128).total/row.reference[channel]-1);
		})));
		assert.ok(sourceRoundingSensitivity<1e-12,'Source rounding is numerically material');
		const displayDependencies=displaySeal.recipe.parents.filter(x=>x.path.startsWith('src/')||x.path.startsWith('node_modules/three/'));
		for(const source of displayDependencies)assert.deepEqual(identity(source.path),source,'Reused display control dependency changed');
		run.write('display-qualification.json',{displayDependencies,proof:displayProof,
			contract:'Installed p2 applies illuminance gain followed by Bruneton exponential mapping and writes those declared display values through a raw material. Reuse the unchanged neutral-ramp GPU proof to establish byte behavior. Additional sRGB encoding is a display counterfactual, not an assumed correction. No display or exposure change is applied.'});
		run.write('compatibility.json',{keys,matched:true,sourcePosition:{current:m.sourcePosition,prior:old.sourcePosition,float32Identical:true,maximumN1RelativeSensitivity:sourceRoundingSensitivity},exclusions:'Source position differs by binary64 rounding only; actual GPU uniforms are identical and host sensitivity is qualified above. Old descriptor-only direction/dome fields are not physical MC inputs; sourceDirection is unused for a finite point source. All-order reuse retains the infinite slab, black ground and its original uncertainty. Not a current-app matched finite-endpoint all-order comparison.'});
		const rows=current.rows.map(row=>{
			const {app,reference}=row,a=row.appColor,r=row.referenceColor;
			const uncertainty=row.refinement;
			const metrics={luminanceRelative:a.luminanceCdPerM2/r.luminanceCdPerM2-1,xy:a.xy.map((x,k)=>x-r.xy[k]),spectralRelative:app.map((x,k)=>(x-reference[k])/Math.max(1e-10,reference[k]))};
			const decisions={luminance:classify(metrics.luminanceRelative,uncertainty,0.02),xy:metrics.xy.map(x=>classify(x,2*uncertainty/(1-uncertainty),0.002)),spectrum:metrics.spectralRelative.map(x=>classify(x,uncertainty,0.02))};
			const attribution=Array.from({length:15},(_,channel)=>attribute({id:row.heading,medium:m,origin:[0,0,5],direction:row.direction,channel,end:row.end}));
			assert.ok(attribution.every((x,k)=>Math.abs(x.total/reference[k]-1)<1e-10));
			const species=[0,1].map(k=>colorimetry(attribution.map(x=>x.species[k]),'bin-integrated'));
			const distanceY=Array.from({length:6},(_,k)=>colorimetry(attribution.map(x=>x.bins[k]),'bin-integrated').luminanceCdPerM2);
			const moments=Array.from({length:5},(_,k)=>colorimetry(attribution.map(x=>x.total*x.moments[k]),'bin-integrated').luminanceCdPerM2/r.luminanceCdPerM2);
			const attenuation=Array.from({length:4},(_,k)=>colorimetry(attribution.map(x=>x.factorial[k]),'bin-integrated').luminanceCdPerM2);
			return {...row,metrics,decisions,species,distanceY,moments,attenuation};
		});
		const gradients=rows.filter(x=>x.elevation<1).map(row=>{const upper=rows.find(x=>x.heading===row.heading&&x.elevation===10);assert.ok(upper);
			const app=row.appColor.luminanceCdPerM2/upper.appColor.luminanceCdPerM2,reference=row.referenceColor.luminanceCdPerM2/upper.referenceColor.luminanceCdPerM2;
			const residual=app/reference-1;return {heading:row.heading,elevation:row.elevation,app,reference,residual,decision:classify(residual,row.refinement+upper.refinement,0.02)};
		});
		const allOrders=[0.05,3,20].map(elevation=>{
			const id=`local-${elevation}-away`,groups=inputs.groups.map((g,i)=>({...g,index:i})).filter(g=>g.id===id).sort((a,b)=>a.channel-b.channel);assert.equal(groups.length,15);
			const colors=Array.from({length:16},(_,batch)=>{
				const batchRows=groups.map(g=>prior.find(x=>x.group===g.index&&x.batch===batch));assert.ok(batchRows.every(Boolean));
				return Array.from({length:6},(_,order)=>colorimetry(batchRows.map(b=>order===5?b.means[0]-b.means.slice(1,5).reduce((a,x)=>a+x,0):b.means[order]),'bin-integrated'));
			});
			const orders=Array.from({length:6},(_,order)=>({order:order===0?'all':order===5?'N5+':`N${order}`,
				Y:estimate(colors.map(b=>b[order].luminanceCdPerM2)),x:estimate(colors.map(b=>b[order].xy[0])),y:estimate(colors.map(b=>b[order].xy[1]))}));
			const distance=Array.from({length:6},(_,bin)=>estimate(Array.from({length:16},(_,batch)=>colorimetry(groups.map(g=>prior.find(x=>x.group===g.index&&x.batch===batch).means[14+8*bin]),'bin-integrated').luminanceCdPerM2)));
			const species=[7,8].map(metric=>estimate(Array.from({length:16},(_,batch)=>colorimetry(groups.map(g=>prior.find(x=>x.group===g.index&&x.batch===batch).means[metric]),'bin-integrated').luminanceCdPerM2)));
			const deterministic=Array.from({length:15},(_,channel)=>direct(groups[channel],128).total);
			return {elevation,orders,distance,species,independentN1:colorimetry(deterministic,'bin-integrated'),domain:'infinite physical slab camera ray; secondary rays use same slab, black ground',groups:groups.map(g=>({channel:g.channel,direction:g.direction,end:g.end}))};
		});
		const gpu=/** @type {LocalHorizonGpuObservation} */(readParent(p,'reference-128-rays.json',parents));
		const parity=gpu.rays.filter(r=>r.uv[0]===0.5).map(ray=>{const d=ray.stages[3].slice(0,3),end=ray.stages[3][3],actual=ray.stages.slice(5,9).flat().slice(0,15);
			const expected=Array.from({length:15},(_,channel)=>direct({id:'gpu-check',medium:m,origin:[0,0,5],direction:d,channel,end},128).total);
			return {elevation:ray.elevationDegrees,maximumRelative:Math.max(...actual.map((x,k)=>Math.abs(x/expected[k]-1)))};
		});
		run.write('evaluation.json',{rows,gradients,allOrders,parity,qualification:current.control});
		assert.ok(parity.every(x=>x.maximumRelative<0.002),'Independent image shader must match CPU within 0.2%');
		assert.ok(rows.every(x=>x.refinement<0.002),'N1 quadrature did not converge to registered target');
		const files=['baseline.png','reference-64.png','reference-128.png'];
		const images=files.map(file=>{const relative=parent+'/'+file,bytes=readRepository(relative);parents.push(identity(relative,bytes));run.write(file,bytes,{parents,operation:'Exact byte copy of captured image for reviewable comparison.',parameters:{source:relative}});return 'data:image/png;base64,'+bytes.toString('base64');});
		run.write('comparison.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="1320" height="650"><rect width="1320" height="650" fill="white"/><g font-family="sans-serif" fill="#111"><text x="20" y="26" font-size="20">San Jose closest local Sun — actual images, same camera / atmosphere / display</text><text x="20" y="55">Current production N1</text><text x="675" y="55">Independent cache-free N1 (128 nodes per segment)</text><image x="20" y="70" width="625" height="510" href="${images[0]}"/><image x="675" y="70" width="625" height="510" href="${images[2]}"/><text x="20" y="610">This tests the declared point-source/slab model. No preferred color or production defect is assumed.</text><text x="20" y="633">All-order expectations are reported separately as sparse independent GPU estimates, not interpolated into this image.</text></g></svg>`);
		run.write('summary.json',{maximumN1Refinement:Math.max(...rows.map(x=>x.refinement)),maximumGpuCpuRelative:Math.max(...parity.map(x=>x.maximumRelative)),luminanceDecisions:rows.map(x=>({heading:x.heading,elevation:x.elevation,residual:x.metrics.luminanceRelative,decision:x.decisions.luminance})),allOrderY:allOrders.map(x=>({elevation:x.elevation,N1:x.independentN1.luminanceCdPerM2,total:x.orders[0].Y.mean,halfWidth95:x.orders[0].Y.halfWidth95}))});
		run.finish('accepted',{elapsedMilliseconds:Date.now()-start,rows:rows.length,reusedAllOrderBatches:prior.length});sealed=true;verifyRun(run.path);assert.equal(JSON.parse(readRepository(run.path+'/sealed.json').toString()).state,'accepted');console.log(run.path);
	}catch(error){if(!sealed)run.finish('failed',{elapsedMilliseconds:Date.now()-start,error:String(error)});throw error;}
}

/** Classify a signed discrepancy using the registered practical tolerance and empirical numerical envelope.
 * @param {number} value Signed residual. @param {number} envelope Estimated refinement envelope in matching units.
 * @param {number} tolerance Registered symmetric practical tolerance. @returns {string} Three-state decision.
 */
function classify(value,envelope,tolerance){return Math.abs(value)+envelope<=tolerance?'agreement':Math.abs(value)-envelope>tolerance?'resolved-disagreement':'unresolved';}

main();
