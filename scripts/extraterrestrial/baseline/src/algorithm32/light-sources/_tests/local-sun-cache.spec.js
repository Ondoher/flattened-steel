import { LocalSunCache } from '../LocalSunCache.js';

/**
 * Create one observable completed-artifact double.
 *
 * @returns {CacheBuildArtifact & { readonly disposeCount: number }} The double.
 */
function createArtifact() {
	const descriptor = /** @type {ScatteringCacheDescriptor} */ ({
		id: 'local-sun-cache-spec',
	});
	const runtimeBindings = /** @type {CacheRuntimeBindings} */ ({
		backendId: 'local-cache-spec-backend',
		bindings: [{
			id: 'local-cache-spec-binding',
			valueKey: 'cache.cumulativeScatteringDensity',
			descriptor: { id: 'local-cache-spec-field' },
			backendId: 'local-cache-spec-backend',
		}],
	});
	let disposeCount = 0;

	return /** @type {CacheBuildArtifact & { readonly disposeCount: number }} */ ({
		descriptor,
		runtimeBindings,
		dispose() {
			disposeCount += 1;
		},
		get disposeCount() {
			return disposeCount;
		},
	});
}

function createResources() {
	return /** @type {LocalSunCacheResourceReport} */ ({
		sourceFacts: {
			boundaries: { value: 16_392, units: 'bytes' },
			heldIncidentScales: {
				value: 16_384,
				units: 'bytes',
			},
			total: { value: 32_776, units: 'bytes' },
		},
		boundaryTexture: {
			value: 8_196,
			units: 'bytes',
		},
		packedTransportData: {
			value: 0,
			units: 'bytes',
		},
		executor: {
			peakFieldStorage: { value: 120, units: 'bytes' },
			peakPackedDataStorage: {
				value: 8_196,
				units: 'bytes',
			},
			peakTrackedStorage: {
				value: 8_316,
				units: 'bytes',
			},
			residentFieldStorage: {
				value: 60,
				units: 'bytes',
			},
		},
	});
}

describe('LocalSunCache', () => {
	it('samples the completed z-rho and W27 cumulative field', () => {
		const artifact = createArtifact();
		const resources = createResources();
		const cache = new LocalSunCache(artifact, resources);
		const contribution = cache.createShaderContribution(
			/** @type {ShaderContributionRequest} */ (
				/** @type {unknown} */ ({
					descriptor: {
						cache: {
							fingerprint: 'local-cache-spec-fingerprint',
							compatibilityTags: ['local-z-rho', 'w27'],
						},
					},
				})
			),
		);

		expect(contribution.provides).toEqual([
			'cache.sampleCumulativeScatteringDensity',
		]);
		expect(contribution.requires).toEqual([
			'geometry.scatteringCacheStencilTypes',
		]);
		expect(contribution.textures).toEqual([{
			name: 'uLocalSunCumulativeScatteringDensityCache',
			type: 'sampler2DArray',
			valueKey: 'cache.cumulativeScatteringDensity',
		}]);
		expect(contribution.bindingRequirements[0]).toEqual(
			jasmine.objectContaining({
				owner: 'cache',
				kind: 'texture',
				valueKey: 'cache.cumulativeScatteringDensity',
				required: true,
			}),
		);
		const source = contribution.functions[0].code;
		expect(source).toContain('positionTapIndex < 4');
		expect(source).toContain('directionTapIndex < 4');
		expect(source).toContain(
			'uLocalSunCumulativeScatteringDensityCache',
		);
		expect(source).toContain('positionStencil.weights[positionTapIndex]');
		expect(source).toContain('directionStencil.weights[directionTapIndex]');
		expect(cache.getRuntimeBindings()).toBe(artifact.runtimeBindings);
		expect(cache.resources).toBe(resources);
	});

	it('releases its completed artifact idempotently', () => {
		const artifact = createArtifact();
		const cache = new LocalSunCache(
			artifact,
			createResources(),
		);

		expect(cache.descriptor).toBe(artifact.descriptor);
		cache.dispose();
		cache.dispose();

		expect(artifact.disposeCount).toBe(1);
		expect(() => cache.getRuntimeBindings()).toThrowError(/disposed/);
		expect(() => cache.createShaderContribution(
			/** @type {never} */ ({}),
		)).toThrowError(/disposed/);
	});
});
