import {FlatEarthGeometry} from '../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js';
import {FlatScatteringCacheGeometry} from '../../src/algorithm32/implementation/flat-earth/FlatScatteringCacheGeometry.js';
import {FlatGeometryCacheModuleProvider} from '../../src/algorithm32/implementation/flat-earth/FlatGeometryCacheModuleProvider.js';
import {FlatGeometryShaderContributor} from '../../src/algorithm32/implementation/flat-earth/FlatGeometryShaderContributor.js';
import {FlatGeometrySceneAdapter} from '../../src/algorithm32/implementation/flat-earth/three/FlatGeometrySceneAdapter.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../src/algorithm32/sampling-domains/index.js';
import {CacheBuildModules} from '../../src/algorithm32/shader-assembly/cache-pass/CacheBuildModules.js';

/** Create an experiment-owned geometry with a co-rotating source-axis frame.
 * The instance is newly owned here; production modules and instances are unchanged.
 * @param {FlatEarthGeometryConfig} configuration - Frozen physical controls.
 * @param {number} degrees - Synthetic rotation from the canonical frame.
 * @returns {FlatEarthGeometry} - One unconfigured candidate geometry.
 */
export function createCorrectedGeometry(configuration, degrees) {
	const geometry = new FlatEarthGeometry(configuration);
	const angle = (degrees * Math.PI) / 180;
	geometry._shapeConfiguration = {
		...geometry._shapeConfiguration,
		cacheRadialFallbackDirection: [Math.cos(angle), Math.sin(angle), 0],
	};
	return geometry;
}

/** Extend an owned, configured cylinder without moving its existing radial nodes.
 * Triangle inequality covers every observer ray up to the declared dome extent.
 * @param {FlatEarthGeometry} geometry - Newly configured experiment instance.
 * @returns {void} - Replaces only this instance's normalized construction collaborators.
 */
export function extendCoverage(geometry) {
	const original = geometry.configuration;
	if (!original.observerCenteredDome) throw new Error('Coverage requires the declared observer dome.');
	const maximum =
		original.cacheRadialMaximum.value + original.observerCenteredDome.maxObserverViewRayExtent.value + 1;
	const nodes = [...original.cacheRadialNodes];
	const spacing = Math.min(400000, nodes.at(-1).value - nodes.at(-2).value);
	for (let r = nodes.at(-1).value + spacing; r < maximum; r += spacing) nodes.push({value: r, units: 'meters'});
	nodes.push({value: maximum, units: 'meters'});
	const configuration = {
		...original,
		cacheRadialNodes: nodes,
		cacheRadialMaximum: {value: maximum, units: /** @type {const} */ ('meters')},
	};
	geometry._configuration = configuration;
	geometry._scatteringCacheGeometry = new FlatScatteringCacheGeometry(
		configuration,
		geometry,
		CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	);
	geometry._cacheModuleProvider = new FlatGeometryCacheModuleProvider(configuration);
	geometry._shaderContributor = new FlatGeometryShaderContributor(configuration);
	geometry._sceneAdapter = new FlatGeometrySceneAdapter(configuration);
}

/** Classify axis roundoff consistently without altering physical cache nodes.
 * One micrometre exceeds the binary64 rotation roundoff at the frozen world scale.
 * @param {FlatEarthGeometry} geometry - Owned and configured candidate.
 * @returns {void} - Adapts this instance's CPU and shader axis frames.
 */
export function stabilizeAxisFrame(geometry) {
	const cacheGeometry = geometry._scatteringCacheGeometry;
	const frame = cacheGeometry._localCacheDirectionFrame.bind(cacheGeometry);
	cacheGeometry._localCacheDirectionFrame = (configuration, position) => {
		const center = configuration.sourceSubpoint.coordinates;
		return frame(
			configuration,
			Math.hypot(position[0] - center[0], position[1] - center[1]) <= 1e-6 ? center : position,
		);
	};
	const contribution = geometry.createShaderContribution.bind(geometry);
	geometry.createShaderContribution = () => {
		const original = contribution();
		return {
			...original,
			id: original.id + '-p2-axis-roundoff',
			functions: original.functions.map((block) => ({
				...block,
				code: block.code.replace('length(radial) <= 1.0e-10', 'length(radial) <= 1.0e-6'),
			})),
		};
	};
	const provider = geometry._cacheModuleProvider;
	const build = provider.createCacheModule.bind(provider);
	provider.createCacheModule = (context) => {
		const original = build(context);
		return CacheBuildModules.createBuildModule({
			...original,
			id: original.id + '-p2-axis-roundoff',
			blocks: original.blocks.map((block) => ({
				...block,
				source: block.source.replaceAll('length(radial) <= 1.0e-10', 'length(radial) <= 1.0e-6'),
			})),
		});
	};
}
