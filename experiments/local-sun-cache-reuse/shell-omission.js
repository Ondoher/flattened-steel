import {CanonicalValueHash} from '../../src/algorithm32/value-identity/CanonicalValueHash.js';

/** Derive a bounded unculled control with one empty slot per band and altitude row.
 * Occupied samples, physical equations and interpolation rows remain identical.
 * Empty-band slots represent source-centered points above the atmosphere and
 * are explicitly zero; they never participate in a query stencil.
 * @param {LocalSunShellLayout} compact - Authenticated compact mesh.
 * @returns {LocalSunShellLayout} - New control topology with an occupied prefix.
 */
export function unculledShellLayout(compact) {
	if(compact.occupiedNodeCount!==undefined)throw new Error('Already an unculled proof mesh.');
	const nodes=compact.nodes.map(n=>({...n}));
	for(const bandId of compact.omittedBands) {
		const band=compact.bands[bandId];
		if(band.admitted || band.outer>=compact.height-compact.top)throw new Error('Omission is not strictly empty.');
		const radius=(band.inner+band.outer)/2;
		for(let rowIndex=0;rowIndex<compact.rows.length;rowIndex++)
			nodes.push({index:nodes.length,rowIndex,band:bandId,z:compact.height-radius,rho:0,radius,excess:0,emptyBand:true});
	}
	return {...compact,schema:'local-sun-shell-unculled-proof-v1',nodes,occupiedNodeCount:compact.nodes.length};
}

/** Emit zero values for retained proof-only slots before any atmospheric equation.
 * The compact candidate never invokes this adapter or allocates these slots.
 * @param {CacheShader} shader - Actual renderer-neutral build source.
 * @param {LocalSunShellLayout} layout - Compact candidate or explicit unculled control.
 * @returns {CacheShader} - Actual-source identity and bounded zero guard.
 */
export function guardEmptyShellSlots(shader,layout) {
	if(layout.occupiedNodeCount===undefined)return shader;
	const signature='void main() {';
	if(shader.source.split(signature).length!==2 || !shader.source.includes('out float a32CacheOutput;'))
		throw new Error('Unculled output contract changed.');
	const source=shader.source.replace(signature,`${signature}\n\tif(int(gl_FragCoord.y)>=${layout.occupiedNodeCount}) { a32CacheOutput=0.0; return; }`);
	return {...shader,id:shader.id+'-unculled-zero-v1',source,sourceHash:CanonicalValueHash.sha256Value(source)};
}
