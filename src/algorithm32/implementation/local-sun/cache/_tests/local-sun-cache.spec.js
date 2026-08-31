import {LocalSunCache} from '../LocalSunCache.js';

/**
 * Called by this module to create one observable completed-artifact double.
 *
 * @returns {LocalSunCacheDisposalTestArtifact} - The completed-artifact double.
 *
 */
function createArtifact() {
	const runtimeBindings = /** @type {CacheRuntimeBindings} */ ({
		backendId: 'local-cache-spec-backend',
		bindings: [
			{
				id: 'local-cache-spec-binding',
				valueKey: 'cache.cumulativeScatteringDensity',
				fieldId: 'local-cache-spec-field',
				backendId: 'local-cache-spec-backend',
			},
		],
	});
	let disposeCount = 0;

	return /** @type {LocalSunCacheDisposalTestArtifact} */ (
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

/**
 * Called by this module to create resources.
 * @returns - The result produced by the operation.
 */
function createResources() {
	return /** @type {LocalSunCacheResourceReport} */ ({
		sourceFacts: {
			boundaries: {value: 16_392, units: 'bytes'},
			heldIncidentScales: {
				value: 16_384,
				units: 'bytes',
			},
			total: {value: 32_776, units: 'bytes'},
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
			peakFieldStorage: {value: 120, units: 'bytes'},
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

describe('LocalSunCache', /** Called by Jasmine to register the named test suite. */ () => {
	it('samples the completed z-rho and W27 cumulative field', /** Called by Jasmine to exercise the named behavior. */ () => {
		const artifact = createArtifact();
		const resources = createResources();
		const cache = new LocalSunCache(artifact, resources);
		const contribution = cache.createShaderContribution();

		expect(contribution.provides).toEqual(['cache.sampleCumulativeScatteringDensity']);
		expect(contribution.requires).toEqual([
			'geometry.scatteringCacheStencilTypes',
			'geometry.resolveScatteringCachePositionStencil',
			'geometry.resolveScatteringCacheDirectionStencil',
		]);
		expect(contribution.textures).toEqual([
			{
				name: 'uLocalSunCumulativeScatteringDensityCache',
				type: 'sampler2DArray',
				valueKey: 'cache.cumulativeScatteringDensity',
			},
		]);
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
		expect(source).toContain('uLocalSunCumulativeScatteringDensityCache');
		expect(source).toContain('positionStencil.weights[positionTapIndex]');
		expect(source).toContain('directionStencil.weights[directionTapIndex]');
		expect(source).toContain('resolveScatteringCachePositionStencil(atmosphereCoordinate)');
		expect(source).toContain('resolveScatteringCacheDirectionStencil(');
		expect(cache.getRuntimeBindings()).toBe(artifact.runtimeBindings);
		expect(cache.resources).toBe(resources);
	});

	it('releases its completed artifact idempotently', /** Called by Jasmine to exercise the named behavior. */ () => {
		const artifact = createArtifact();
		const cache = new LocalSunCache(artifact, createResources());

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
