import {LocalSunLightSource} from '../../src/algorithm32/implementation/local-sun/LocalSunLightSource.js';
import {LocalSunShellFactCache} from '../../src/algorithm32/implementation/local-sun/cache/LocalSunShellFactCache.js';
import LocalSunConstructionLightSource from '../../src/algorithm32/implementation/local-sun/cache/LocalSunConstructionLightSource.js';

/** Install fixed source-relative held-amplitude facts on a newly owned experimental source.
 * Keeps the 2048-band equal-inverse-square amplitude policy. The physical slab
 * and fixed cylinder determine its bounds; horizontal source placement does not.
 * @param {LocalSunLightSource} source - Fresh, already configured experimental source.
 * @param {LocalSunShellLayout} layout - Candidate's physical construction domain.
 * @returns {void} - Replaces this instance's construction source collaborators only.
 */
export function installShellSource(source,layout) {
	const configuration=source.configuration;
	if(configuration.position.coordinates[2]!==layout.height)throw new Error('Shell source height mismatch.');
	const facts=new LocalSunShellFactCache({sourceConfiguration:configuration});
	/** @type {LocalSunShellExecutableDomain} */
	const domain={
		minimumDistance:{value:layout.height-layout.top,units:'meters'},
		maximumDistance:{value:Math.hypot(layout.height,layout.maximumRho),units:'meters'},
		horizontalOffset:{value:0,units:'meters'},sourceHeight:{value:layout.height,units:'meters'},
		mapRadius:{value:layout.maximumRho,units:'meters'},atmosphereApex:{value:layout.top,units:'meters'},
	};
	const boundaries=facts._createEqualInverseSquareBoundaries(domain);
	facts._boundaries=boundaries;
	facts._heldIncidentScales=facts._createHeldIncidentScales(boundaries,facts._copySourceFacts(configuration));
	facts._minimumDistance=domain.minimumDistance;facts._maximumDistance=domain.maximumDistance;
	const provider=source._cacheProvider;
	if(!provider)throw new Error('Configured construction source missing.');
	provider._constructionShellFactCache=facts;
	provider._constructionLightSource=new LocalSunConstructionLightSource({source,shellFactCache:facts});
}
