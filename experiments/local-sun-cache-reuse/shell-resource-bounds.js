/** Bound selected-profile numeric payload during complete-frame replacement.
 * The phase matrix is one shared host allocation. Construction program copies
 * are transient; the phase GPU texture retires before the three-scattering-field
 * accumulation peak. Ordinary scene shadows retire while its snapshot is held.
 * This admission estimate must be checked against the allocation observations.
 * @param {LocalSunRotationRecipe} recipe - Selected N4/Native15 shell policy.
 * @param {CacheData} phases - One transferred Float32 phase matrix.
 * @returns {LocalSunShellResourceBounds} - Conservative logical payload bounds.
 */
export function shellResourceBounds(recipe,phases) {
	const count=recipe.shellLayout?.nodes.length;
	if(!count || recipe.diagnostic || recipe.state.execution.maximumScatteringOrder!==4 || phases.shape.length!==2 || phases.shape[0]!==1920 || phases.shape[1]!==4374 || !(phases.values instanceof Float32Array))throw new Error('Resource bounds require selected N4/Native15/1920-by-4374 shell construction.');
	const scattering=count*4374*15*4,incoming=count*1920*15*4;
	const phaseBytes=phases.values.byteLength;
	// Per-node GPU factors/excess, matching host textures, binary64 factors,
	// positions and compact addresses fit 320 bytes; bounded domain tables fit 0.3 MB.
	const auxiliary=count*320+300000;
	const programData=phaseBytes+200000;
	const peakGpuBuild=Math.max(3*scattering,2*scattering+incoming+programData);
	// Both old and prepared frame target sets are charged even though new targets
	// are lazy: RGBA32F+depth32, RGBA8 snapshot, two RGBA8+depth32 captures = 40 B/px.
	// Two scene geometry payloads and global directional/receiver tables add 3 MB.
	const otherPersistentBytes=phaseBytes+(recipe.shellScene ? 2*720*414*40 : 2*720*414*4)+3000000;
	return {retainedCacheBytes:scattering+auxiliary,peakBuildBytes:peakGpuBuild+programData+auxiliary,otherPersistentBytes,
		sharedHostPhaseBytes:phaseBytes,maximumHostProgramCopyBytes:programData,claim:'Selected-profile logical numeric payload bound; diagnostic readbacks, JavaScript object overhead, compiled programs and driver bookkeeping are separate.'};
}
