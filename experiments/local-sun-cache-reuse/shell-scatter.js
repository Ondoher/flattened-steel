import {CacheValues} from '../../src/algorithm32/gpu-cache-runtime/CacheValues.js';
import {CanonicalValueHash} from '../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';

/** Precompute invariant Mie phase in the selected local angular frame.
 * Avoids repeatedly evaluating the same phase power at every position/channel.
 * This is an exact-equation acceleration, not a fitted correction.
 * @param {LocalSunConstructionDomainSelection} domains - Owned angular inventories.
 * @returns {CacheData} - Scalar R32F-ready phase matrix; no spectral dependence.
 */
export function shellMiePhaseData(domains) {
	return shellMiePhaseFromDirections({id:domains.incomingDirectionDomain.id+'-w27-mie-phase-v1',incoming:domains.incomingUnitVectors,outgoing:domains.outgoingUnitVectors});
}

/** Build the exact invariant scalar phase matrix from explicitly owned direction inventories.
 * @param {LocalSunShellPhaseRequest} request - Unit-vector domains and stable matrix identity.
 * @returns {CacheData} - Copied scalar values and canonical numeric-array identity.
 */
export function shellMiePhaseFromDirections(request) {
	return CacheValues.createData(shellMiePhaseValues(request));
}

/** Evaluate the same physical matrix into one owned Float32 payload before selecting a hashing implementation.
 * @param {LocalSunShellPhaseRequest} request - Explicit matching unit-vector inventories.
 * @returns {CacheDataDefinition & {values:Float32Array}} - Positive finite scalar matrix and canonical metadata.
 */
export function shellMiePhaseValues(request) {
	if(!request.id || !request.incoming.length || !request.outgoing.length)throw new Error('Incomplete phase matrix request.');
	for(const vector of [...request.incoming,...request.outgoing])
		if(vector.length!==3 || vector.some(v=>!Number.isFinite(v)) || Math.abs(Math.hypot(...vector)-1)>1e-12)throw new Error('Phase matrix requires finite unit directions.');
	const g=CANONICAL_ATMOSPHERE_CONSTANTS.miePhaseFunctionG;
	const factor=3/(8*Math.PI)*(1-g*g)/(2+g*g);
	const values=new Float32Array(request.outgoing.length*request.incoming.length);
	for(let d=0;d<request.outgoing.length;d++)for(let i=0;i<request.incoming.length;i++) {
		const incoming=request.incoming[i],outgoing=request.outgoing[d];
		const mu=Math.max(-1,Math.min(1,outgoing[0]*incoming[0]+outgoing[1]*incoming[1]+outgoing[2]*incoming[2]));
		values[d*request.incoming.length+i]=factor*(1+mu*mu)/(1+g*g-2*g*mu)**1.5;
	}
	return {id:request.id,quantity:'phase-function',units:'sr^-1',
		shape:[request.incoming.length,request.outgoing.length],values};
}

/** Replace scatter-only repeated Mie evaluation with the invariant scalar matrix.
 * @param {CacheShader} shader - Owned candidate construction shader.
 * @param {CacheData} phases - Matching incoming/outgoing phase values.
 * @returns {CacheShader} - Actual adapted source hash and immutable matrix binding.
 */
export function precomputedShellScatter(shader,phases) {
	if(!shader.source.includes('float scatteringDensity = 0.0;'))return shader;
	const gBinding=shader.bindings.find(b=>b.spec.name==='uCacheMiePhaseG');
	const value=gBinding?.value;
	const g=typeof value==='number' ? value : value && typeof value==='object' && 'units' in value &&
		value.units==='1' && 'value' in value ? value.value : NaN;
	if(g!==CANONICAL_ATMOSPHERE_CONSTANTS.miePhaseFunctionG)
		throw new Error('Invariant phase matrix requires its pinned Mie asymmetry.');
	const expected=/cacheMiePhase\(\s*outgoingDirection,\s*incomingDirection\s*\)/gu;
	if([...shader.source.matchAll(expected)].length!==1)throw new Error('Scatter phase collaborator changed.');
	const source='uniform sampler2D uShellMiePhases;\n'+shader.source.replace(expected,
		'texelFetch(uShellMiePhases,ivec2(incomingIndex,outgoingIndex),0).r');
	return {...shader,id:shader.id+'-invariant-mie-matrix-v1',source,sourceHash:CanonicalValueHash.sha256Value(source),
		bindings:[...shader.bindings,{spec:{id:'shell-invariant-mie-phase',name:'uShellMiePhases',kind:'data',shaderType:'sampler2D',frequency:'build'},value:phases}]};
}
