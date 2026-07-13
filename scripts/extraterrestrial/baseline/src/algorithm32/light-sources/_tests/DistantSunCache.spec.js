import { DistantSunCache } from '../DistantSunCache.js';

function createArtifact() {
	const descriptor = { id: 'distant-sun-cache-spec' };
	const runtimeBindings = {
		backendId: 'cache-spec-backend',
		bindings: [{
			id: 'cache-spec-binding',
			valueKey: 'cache.cumulativeScatteringDensity',
			descriptor: { id: 'cache-spec-field' },
			backendId: 'cache-spec-backend',
		}],
	};
	let disposeCount = 0;
	return {
		descriptor,
		runtimeBindings,
		dispose() {
			disposeCount += 1;
		},
		get disposeCount() {
			return disposeCount;
		},
	};
}

describe('DistantSunCache', () => {
	it('contributes one cumulative Native-48 by W27 array-texture lookup', () => {
		const artifact = createArtifact();
		const cache = new DistantSunCache(artifact);
		const contribution = cache.createShaderContribution(/** @type {ShaderContributionRequest} */ (/** @type {unknown} */ ({
			descriptor: {
				cache: {
					fingerprint: 'cache-spec-fingerprint',
					compatibilityTags: ['native-48', 'w27'],
				},
			},
		})));

		expect(contribution.provides).toEqual([
			'cache.sampleCumulativeScatteringDensity',
		]);
		expect(contribution.requires).toEqual([
			'geometry.scatteringCacheStencilTypes',
		]);
		expect(contribution.textures).toEqual([{
			name: 'uCumulativeScatteringDensityCache',
			type: 'sampler2DArray',
			valueKey: 'cache.cumulativeScatteringDensity',
		}]);
		expect(contribution.textures[0].valueKey)
			.toBe(cache.getRuntimeBindings().bindings[0].valueKey);
		expect(contribution.bindingRequirements).toEqual([{
			id: 'cache.cumulative-scattering-density',
			owner: 'cache',
			kind: 'texture',
			updateFrequency: 'setup',
			valueKey: 'cache.cumulativeScatteringDensity',
			required: true,
		}]);
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

	it('owns one completed artifact and releases it idempotently', () => {
		const artifact = createArtifact();
		const cache = new DistantSunCache(artifact);

		expect(cache.descriptor).toBe(artifact.descriptor);
		expect(cache.getRuntimeBindings()).toBe(artifact.runtimeBindings);

		cache.dispose();
		cache.dispose();

		expect(artifact.disposeCount).toBe(1);
		expect(() => cache.getRuntimeBindings()).toThrowError(/disposed/);
		expect(() => cache.createShaderContribution(/** @type {never} */ ({})))
			.toThrowError(/disposed/);
	});
});
