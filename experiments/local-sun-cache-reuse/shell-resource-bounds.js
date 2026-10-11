/** Bound selected-profile numeric payload during complete-frame replacement.
 * The phase matrix is one shared host allocation. Construction program copies
 * are transient; the phase GPU texture retires before the three-scattering-field
 * accumulation peak. Ordinary scene shadows retire while its snapshot is held.
 * This admission estimate must be checked against the allocation observations.
 * @param {LocalSunRotationRecipe} recipe - Selected N4/Native15 shell policy.
 * @param {CacheData} phases - One transferred Float32 phase matrix.
 * @param {PixelSize} [viewport] - Actual raster; omitted retains the original 720-by-414 control.
 * @returns {LocalSunShellResourceBounds} - Conservative logical payload bounds.
 */
export function shellResourceBounds(recipe,phases,viewport={width:720,height:414,units:'pixels'}) {
	if(viewport.units!=='pixels' || !Number.isSafeInteger(viewport.width) || !Number.isSafeInteger(viewport.height) || viewport.width<1 || viewport.height<1)throw new Error('Positive integer resource viewport required.');
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
	// Bounded celestial lane: two frame owners, each with static inputs, active
	// and staging R16UI+depth32/R32F products, compact Sun tiles and diagnostics.
	// Four R16UI+depth32 products across both owners plus compact palette/table/Sun data.
	const pixels=viewport.width*viewport.height;
	const celestialBytes=recipe.celestial ? 4*pixels*6+4000000 : 0;
	const otherPersistentBytes=phaseBytes+(recipe.shellScene ? 2*pixels*40 : 2*pixels*4)+3000000+celestialBytes;
	return {retainedCacheBytes:scattering+auxiliary,peakBuildBytes:peakGpuBuild+programData+auxiliary,otherPersistentBytes,
		sharedHostPhaseBytes:phaseBytes,maximumHostProgramCopyBytes:programData,claim:'Selected-profile logical numeric payload bound; diagnostic readbacks, JavaScript object overhead, compiled programs and driver bookkeeping are separate.'};
}
