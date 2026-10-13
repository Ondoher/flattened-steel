import {LocalSunCache} from './LocalSunCache.js';
import {LocalSunCompactGpuPlan} from './LocalSunCompactGpuPlan.js';
import {ShaderContributions} from '../../../shader-assembly/base/ShaderContributions.js';
import {CUMULATIVE_SCATTERING_CACHE_VALUE_KEY} from '../../../gpu-cache-runtime/consts.js';
import {LOCAL_SUN_CUMULATIVE_SCATTERING_SAMPLER_NAME} from './consts.js';

/** Completed compact cache with ordinary-runtime lookup and jointly owned auxiliary resources.
 *
 * @implements {LocalSunFrameCacheOwner}
 */
export class LocalSunCompactCache extends LocalSunCache {
	/** Accepted physical/numerical plan and lookup semantics. @type {LocalSunCompactGpuPlan} */
	_plan;
	/** Auxiliary textures owned for exactly this cache lifetime. @type {CacheImmutableTexture[]} */
	_auxiliaryTextures = [];
	/** Ordinary-runtime binding names paired with accepted data. @type {CacheBinding[]} */
	_auxiliaryBindings;
	/** Completed logical allocation report. @type {LocalSunCompactGpuResourceReport} */
	_compactResources;
	/** Closed runtime keys for the privately owned auxiliary resources. @type {Record<string, CacheRuntimeValueKey>} */
	_valueKeys = {
		uCompactPositions: 'cache.compactPositions',
		uCompactExcesses: 'cache.compactExcesses',
		uCompactIncoming: 'cache.compactIncomingDirections',
		uCompactOutgoing: 'cache.compactOutgoingDirections',
		uCompactIncomingWeights: 'cache.compactIncomingWeights',
		uCompactNodeFactors: 'cache.compactNodeFactors',
	};

	/** Creates a complete compact cache and transfers all artifact/auxiliary ownership.
	 * Upload failure releases this candidate and never touches a previously displayed cache.
	 *
	 * @param {CacheBuildArtifact} artifact - Completed cumulative physical field.
	 * @param {LocalSunCompactGpuPlan} plan - Accepted owner contributors and lookup policy.
	 * @param {CacheGpuBackend} backend - Externally owned backend.
	 * @param {LocalSunCompactGpuResourceReport} resources - Declared/observed logical payloads.
	 */
	constructor(artifact, plan, backend, resources) {
		super(artifact, resources);
		this._plan = plan;
		this._compactResources = resources;
		this._auxiliaryBindings = [
			...plan.geometryShader.createBindings(),
			{
				spec: {
					id: plan.nodeFactors.id,
					name: 'uCompactNodeFactors',
					kind: 'data',
					shaderType: 'sampler2D',
					frequency: 'build',
				},
				value: plan.nodeFactors,
			},
		];
		try {
			for (let binding of this._auxiliaryBindings) {
				let data = /** @type {CacheDataBinding} */ (binding).value;
				this._auxiliaryTextures.push(
					backend.uploadImmutableTexture({
						id: data.id,
						storage: {format: 'R32F', width: data.shape[0], height: data.shape[1] ?? 1, layers: 1},
						values: Float32Array.from(data.values),
						valueKey: this._valueKeys[binding.spec.name],
					}),
				);
			}
		} catch (error) {
			try {
				this.dispose();
			} catch (cleanupError) {
				throw new AggregateError([error, cleanupError], 'Compact auxiliary upload and cleanup both failed.');
			}
			throw error;
		}
	}

	/** Actual executor peaks, retained auxiliary payload and complete admission estimate.
	 *
	 * @returns {LocalSunCompactGpuResourceReport} - Logical bytes, distinct from process/driver observations.
	 */
	get resources() {
		return this._compactResources;
	}

	/** Call this method to return opaque ordinary-runtime bindings for physical density and owned auxiliary data.
	 *
	 * @returns {CacheRuntimeBindings} - Backend-owned opaque bindings.
	 * @throws {Error} - Cache was disposed.
	 */
	getRuntimeBindings() {
		let original = super.getRuntimeBindings();
		return {
			backendId: original.backendId,
			bindings: [...original.bindings, ...this._auxiliaryTextures.map((texture) => texture.runtimeBinding)],
		};
	}

	/** Call this method to contribute ordinary canonical compact lookup.
	 *
	 * @returns {ShaderContribution} - Ordinary physical cache lookup.
	 */
	createShaderContribution() {
		return this.createFrameShaderContribution(null);
	}

	/** Call this method to contribute geometry-transformed normalized lookup without changing stored values.
	 *
	 * @param {FlatLocalCacheTransformCapability|null} [transform] - Optional immutable geometry-owned live map.
	 * @returns {ShaderContribution} - Ordinary shared-runtime cumulative physical-J query.
	 * @throws {Error} - Cache was disposed.
	 */
	createFrameShaderContribution(transform = null) {
		this.getRuntimeBindings();
		return ShaderContributions.createShaderContribution({
			id: 'local-sun-compact-runtime-cache-v1',
			owner: 'cache',
			provides: ['cache.sampleCumulativeScatteringDensity'],
			requires: [],
			uniforms: transform === null ? [] : transform.createShaderUniforms(),
			textures: [
				ShaderContributions.createShaderTextureDeclaration(
					LOCAL_SUN_CUMULATIVE_SCATTERING_SAMPLER_NAME,
					'sampler2DArray',
					CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
				),
				...this._auxiliaryBindings.map((binding) =>
					ShaderContributions.createShaderTextureDeclaration(
						binding.spec.name,
						'sampler2D',
						this._valueKeys[binding.spec.name],
					),
				),
			],
			functions: [
				...(transform === null ? [] : transform.createShaderFunctions()),
				ShaderContributions.createShaderSourceBlock(
					'compact-cache-lookup-helpers',
					'sampleScatteringCache',
					0,
					this._plan.geometryShader.createSource() +
						this._plan.createReconstructionSource(LOCAL_SUN_CUMULATIVE_SCATTERING_SAMPLER_NAME),
				),
				ShaderContributions.createShaderSourceBlock(
					'compact-cache-lookup',
					'sampleScatteringCache',
					1,
					`
SpectralValue sampleCumulativeScatteringDensity(vec3 positionMeters,AtmosphereCoordinate atmosphereCoordinate,vec3 physicalOutgoingDirection) {
	${transform === null ? '' : 'positionMeters=localCacheCanonicalPosition(positionMeters); physicalOutgoingDirection=localCacheCanonicalDirection(physicalOutgoingDirection);'}
	positionMeters.z=atmosphereCoordinate.altitudeMeters;
	SpectralValue density;
	for(int channel=0;channel<SPECTRAL_CHANNEL_COUNT;++channel) density.channels[channel]=compactStoredDensity(positionMeters,physicalOutgoingDirection,channel,compactRho(positionMeters));
	return density;
}`,
				),
			],
			bindingRequirements: [
				ShaderContributions.createShaderBindingRequirement(
					'cache.compact-density',
					'cache',
					'texture',
					'setup',
					CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
					true,
				),
				...this._auxiliaryBindings.map((binding) =>
					ShaderContributions.createShaderBindingRequirement(
						binding.spec.id,
						'cache',
						'texture',
						'setup',
						this._valueKeys[binding.spec.name],
						true,
					),
				),
			],
		});
	}

	/** Call this method to release physical field and every auxiliary texture exactly once.
	 *
	 * @returns {void} - No value.
	 */
	dispose() {
		let errors = [];
		try {
			super.dispose();
		} catch (error) {
			errors.push(error);
		}
		for (let texture of this._auxiliaryTextures)
			try {
				texture.dispose();
			} catch (error) {
				errors.push(error);
			}
		this._auxiliaryTextures = [];
		if (errors.length) throw new AggregateError(errors, 'Compact cache resource cleanup failed.');
	}
}
