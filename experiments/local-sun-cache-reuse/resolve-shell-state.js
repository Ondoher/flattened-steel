import {FlatLocalMode} from '../../src/flat32/FlatLocalMode.js';
import {LocalSunLightSource} from '../../src/algorithm32/implementation/local-sun/LocalSunLightSource.js';

/** Resolve one exact ordinary Flat32 local-Sun state without constructing GPU fields.
 * @param {GeometryObservation} observation - Exact instant and canonical location.
 * @returns {LocalSunFrozenPlacement} - Complete physical state for independent fresh/reused proof.
 */
export function resolveShellState(observation) {
	const mode=new FlatLocalMode({sceneScale:{value:1000,units:'meters-per-scene-unit'},maximumScatteringOrder:4,observation});
	try {
		const source=mode.algorithm32.config.config.lightSource;
		if(!(source instanceof LocalSunLightSource))throw new Error('Expected the ordinary finite local-Sun source.');
		return {observation,geometry:mode.geometry.configuration,summary:mode.describe(),source:source.configuration,execution:mode.algorithm32.config.config.execution};
	} finally {mode.dispose();}
}
