/** Derive the existing canonical numeric-array SHA-256 with native hashing for the positive phase matrix.
 * @param {CacheDataDefinition & {values:Float32Array}} definition - Exact positive finite scalar matrix.
 * @returns {Promise<CacheData>} - Same canonical identity, retaining the caller's transferable numeric buffer.
 */
export async function identifyShellPhase(definition) {
	const {id,quantity,units,shape,values}=definition;
	if(!id || quantity!=='phase-function' || units!=='sr^-1' || shape.length!==2 || shape.some(n=>!Number.isInteger(n) || n<=0) || shape[0]*shape[1]!==values.length)throw new Error('Invalid invariant phase metadata.');
	for(const value of values)if(!Number.isFinite(value) || value<=0)throw new Error('Canonical phase hashing requires positive finite numeric values.');
	// Positive finite numbers serialize identically in JSON and the canonical
	// numeric-array serializer; metadata keys here are in canonical sorted order.
	const canonical=JSON.stringify({id,quantity,shape,units,values:Array.from(values)});
	const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical));
	const contentHash='sha256:'+Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('');
	return {id,quantity,units,shape:[...shape],values,contentHash};
}
