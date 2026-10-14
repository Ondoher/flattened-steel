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
	/** Accepted physical/numerical plan and lookup semantics.
	 *
	 * @type {LocalSunCompactGpuPlan}
	 */
	_plan;
	/** Auxiliary textures owned for exactly this cache lifetime.
	 *
	 * @type {CacheImmutableTexture[]}
	 */
	_auxiliaryTextures = [];
	/** Ordinary-runtime binding names paired with accepted data.
	 *
	 * @type {CacheBinding[]}
	 */
	_auxiliaryBindings;
	/** Completed logical allocation report.
	 *
	 * @type {LocalSunCompactGpuResourceReport}
	 */
	_compactResources;
	/** Immutable GPU-packed density, shared by every frame lease.
	 *
	 * @type {CacheImmutableTexture | null}
	 */
	_packed = null;
	/** Closed runtime keys for the privately owned auxiliary resources.
	 *
	 * @type {Record<string, CacheRuntimeValueKey>}
	 */
	_valueKeys = {
		uCompactPositions: 'cache.compactPositions',
		uCompactExcesses: 'cache.compactExcesses',
		uCompactIncoming: 'cache.compactIncomingDirections',
		uCompactOutgoing: 'cache.compactOutgoingDirections',
		uCompactIncomingWeights: 'cache.compactIncomingWeights',
		uCompactNodeFactors: 'cache.compactNodeFactors',
	};

	/** Emit the physical-density lookup with geometry shared by all four spectral groups.
	 * Per-node restoration and summation order match the scalar reconstruction.
	 *
	 * @returns {string} - FP32 packed lookup GLSL, with no construction-time scattering work.
	 */
	_createPackedLookupSource() {
		const atmosphere = this._plan.profile.models.atmosphere;
		const rayleighGroups = [],
			mieGroups = [];
		for (let group = 0; group < 4; group++) {
			const rayleigh = [],
				mie = [];
			for (let component = 0; component < 4; component++) {
				const channel = group * 4 + component;
				rayleigh.push((atmosphere.seaLevelRayleighScattering.values[channel] ?? 1).toExponential(16));
				mie.push((atmosphere.seaLevelMieExtinction.values[channel] ?? 1).toExponential(16));
			}
			rayleighGroups.push(`vec4(${rayleigh.join(',')})`);
			mieGroups.push(`vec4(${mie.join(',')})`);
		}
		return `
const vec4 PACKED_BETA_R[4]=vec4[4](${rayleighGroups.join(',')});
const vec4 PACKED_BETA_M[4]=vec4[4](${mieGroups.join(',')});
SpectralValue compactPackedDensity(vec3 position,vec3 direction) {
 float rho=compactRho(position);
 CompactPositionStencil positions=compactPositionStencil(rho,position.z);
 CompactDirectionStencil ordinary=compactDirectionStencil(position,direction,false);
 CompactDirectionStencil axis=compactDirectionStencil(position,direction,true);
 float distance=length(vec2(rho,COMPACT_SOURCE.z-position.z));
 float rayleigh=exp(-position.z/${atmosphere.constants.rayleighScaleHeight.value.toFixed(1)});
 float mie=exp(-position.z/${atmosphere.constants.mieScaleHeight.value.toFixed(1)});
 float dilutionLog=2.0*log(COMPACT_SOURCE.z/distance);
 vec4 queryLogs[4]; vec4 densities[4];
 for(int group=0;group<4;++group) {
  queryLogs[group]=log(PACKED_BETA_R[group]*rayleigh+PACKED_BETA_M[group]*mie)+dilutionLog;
  densities[group]=vec4(0.0);
 }
 for(int positionTap=0;positionTap<4;++positionTap) {
  if(positions.weights[positionTap]==0.0)continue;
  int positionIndex=positions.indices[positionTap];
  CompactDirectionStencil directions=ordinary;
  if(compactNodeExcess(positionIndex)==0.0)directions=axis;
  for(int group=0;group<4;++group) {
   vec4 nodeLog=texelFetch(uCompactNodeFactors,ivec2(group,positionIndex),0);
   vec4 positionWeight=positions.weights[positionTap]*exp(queryLogs[group]-nodeLog);
   for(int directionTap=0;directionTap<4;++directionTap) {
    if(directions.weights[directionTap]==0.0)continue;
    vec4 weight=positionWeight*directions.weights[directionTap];
    densities[group]+=weight*texelFetch(${LOCAL_SUN_CUMULATIVE_SCATTERING_SAMPLER_NAME},ivec3(directions.indices[directionTap],positionIndex,group),0);
   }
  }
 }
 SpectralValue result;
 for(int channel=0;channel<SPECTRAL_CHANNEL_COUNT;++channel)result.channels[channel]=densities[channel/4][channel%4];
 return result;
}`;
	}

	/** Call this method to release physical field and every auxiliary texture exactly once.
	 * Every release is attempted. AggregateError reports failed resource owners;
	 * report those cleanup failures and never reuse this retired cache.
	 *
	 * @returns {void} - No value.
	 */
	dispose() {
		let errors = [];
		try {
			this._packed?.dispose();
		} catch (error) {
			errors.push(error);
		}
		this._packed = null;
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

	/** Creates a complete compact cache and transfers all artifact/auxiliary ownership.
	 * Missing GPU spectral-packing support rejects construction; use a capable backend before retrying.
	 * Packing, metadata upload or scalar retirement failure releases this candidate and leaves any
	 * displayed cache untouched. Discard the failed candidate; report an AggregateError if cleanup also fails.
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
			if (!backend.packRuntimeField) throw new Error('Compact runtime requires GPU spectral packing support.');
			this._packed = backend.packRuntimeField({
				source: artifact.result,
				id: plan.profile.contentHash + ':runtime-rgba32f-groups-v1',
				valueKey: CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
			});
			for (let binding of this._auxiliaryBindings) {
				let data = /** @type {CacheDataBinding} */ (binding).value;
				const factors = binding.spec.name === 'uCompactNodeFactors';
				const values = new Float32Array(
					factors ? plan.profile.domains.topology.positionCount * 16 : data.values.length,
				);
				for (let index = 0; index < data.values.length; index++)
					values[factors ? Math.floor(index / 15) * 16 + (index % 15) : index] = data.values[index];
				this._auxiliaryTextures.push(
					backend.uploadImmutableTexture({
						id: factors ? data.id + ':runtime-rgba32f-v1' : data.id,
						storage: {
							format: factors ? 'RGBA32F' : 'R32F',
							width: factors ? 4 : data.shape[0],
							height: data.shape[1] ?? 1,
							layers: 1,
						},
						values,
						filtering: 'nearest',
						valueKey: this._valueKeys[binding.spec.name],
					}),
				);
			}
			// The executor completed every recurrence pass before this constructor.
			// Runtime leases and diagnostic unpacking now use only the packed field.
			artifact.dispose();
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
	 * A disposed cache or unavailable packed owner throws; stop using this instance and prepare a replacement.
	 *
	 * @returns {CacheRuntimeBindings} - Backend-owned opaque bindings.
	 * @throws {Error} - Cache was disposed.
	 */
	getRuntimeBindings() {
		super.getRuntimeBindings();
		if (!this._packed) throw new Error('Packed compact cache is unavailable.');
		return {
			backendId: this._packed.backendId,
			bindings: [
				this._packed.runtimeBinding,
				...this._auxiliaryTextures.map((texture) => texture.runtimeBinding),
			],
		};
	}

	/** Call this method to contribute geometry-transformed normalized lookup without changing stored values.
	 * A disposed cache or unavailable packed owner throws before contribution creation;
	 * discard the attempt and prepare a complete replacement cache. Invalid transform contributions
	 * propagate their validation failures; correct the supplied transform before retrying.
	 *
	 * @param {FlatLocalCacheTransformCapability|null} [transform] - Optional immutable geometry-owned live map.
	 * @returns {ShaderContribution} - Ordinary shared-runtime cumulative physical-J query.
	 * @throws {Error} - Cache was disposed.
	 */
	createFrameShaderContribution(transform = null) {
		this.getRuntimeBindings();
		return ShaderContributions.createShaderContribution({
			id: 'local-sun-compact-runtime-cache-rgba32f-v1',
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
					this._plan.geometryShader.createSource() + this._createPackedLookupSource(),
				),
				ShaderContributions.createShaderSourceBlock(
					'compact-cache-lookup',
					'sampleScatteringCache',
					1,
					`
SpectralValue sampleCumulativeScatteringDensity(vec3 positionMeters,AtmosphereCoordinate atmosphereCoordinate,vec3 physicalOutgoingDirection) {
	${transform === null ? '' : 'positionMeters=localCacheCanonicalPosition(positionMeters); physicalOutgoingDirection=localCacheCanonicalDirection(physicalOutgoingDirection);'}
	positionMeters.z=atmosphereCoordinate.altitudeMeters;
	return compactPackedDensity(positionMeters,physicalOutgoingDirection);
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

	/** Call this method to contribute ordinary canonical compact lookup.
	 * A disposed cache or unavailable packed owner throws through binding validation;
	 * discard the contribution attempt and prepare a complete replacement cache.
	 *
	 * @returns {ShaderContribution} - Ordinary physical cache lookup.
	 */
	createShaderContribution() {
		return this.createFrameShaderContribution(null);
	}
}
