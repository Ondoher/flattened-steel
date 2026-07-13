import {DistantSunCache} from '../DistantSunCache.js';

/**
 * Called by this module to create artifact.
 * @returns - The result produced by the operation.
 */
function createArtifact() {
	const runtimeBindings = {
		backendId: 'cache-spec-backend',
		bindings: [
			{
				id: 'cache-spec-binding',
				valueKey: 'cache.cumulativeScatteringDensity',
				fieldId: 'cache-spec-field',
				backendId: 'cache-spec-backend',
			},
		],
	};
	let disposeCount = 0;
	return /** @type {CacheBuildArtifact & { readonly disposeCount: number }} */ (
		/** @type {unknown} */ ({
			runtimeBindings,
			/** Call this method to dispose. */ dispose() {
				disposeCount += 1;
			},
			/**
			 * Number of disposal calls.
			 * @returns - The dispose count value.
			 */ get disposeCount() {
				return disposeCount;
			},
		})
	);
}

describe('DistantSunCache', /** Called by Jasmine to register the named test suite. */ () => {
	it('contributes one cumulative Native-48 by W27 array-texture lookup', /** Called by Jasmine to exercise the named behavior. */ () => {
		const artifact = createArtifact();
		const cache = new DistantSunCache(artifact);
		const contribution = cache.createShaderContribution();

		expect(contribution.provides).toEqual(['cache.sampleCumulativeScatteringDensity']);
		expect(contribution.requires).toEqual(['geometry.scatteringCacheStencilTypes']);
		expect(contribution.textures).toEqual([
			{
				name: 'uCumulativeScatteringDensityCache',
				type: 'sampler2DArray',
				valueKey: 'cache.cumulativeScatteringDensity',
			},
		]);
		expect(contribution.textures[0].valueKey).toBe(cache.getRuntimeBindings().bindings[0].valueKey);
		expect(contribution.bindingRequirements).toEqual([
			{
				id: 'cache.cumulative-scattering-density',
				owner: 'cache',
				kind: 'texture',
				updateFrequency: 'setup',
				valueKey: 'cache.cumulativeScatteringDensity',
				required: true,
			},
		]);
		const source = contribution.functions[0].code;
		expect(contribution.functions[0].slot).toBe('sampleScatteringCache');
		expect(source).toContain('CachePositionStencil positionStencil');
		expect(source).toContain('CacheDirectionStencil directionStencil');
		expect(source).not.toContain('resolveScatteringCachePositionStencil');
		expect(source).not.toContain('resolveScatteringCacheDirectionStencil');
		expect(source).not.toContain('positionMeters');
		expect(source).toContain('positionTapIndex < 2');
		expect(source).toContain('directionTapIndex < 4');
		expect(source).toContain('texelFetch(');
		expect(source).toContain('uCumulativeScatteringDensityCache');
		expect(source).not.toContain('CACHE_INCIDENT_DIRECTION_COUNT');

		cache.dispose();
	});

	it('owns one completed artifact and releases it idempotently', /** Called by Jasmine to exercise the named behavior. */ () => {
		const artifact = createArtifact();
		const cache = new DistantSunCache(artifact);

		expect(cache.getRuntimeBindings()).toBe(artifact.runtimeBindings);

		cache.dispose();
		cache.dispose();

		expect(artifact.disposeCount).toBe(1);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => cache.getRuntimeBindings(),
		).toThrowError(/disposed/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => cache.createShaderContribution(),
		).toThrowError(/disposed/);
	});
});
