import {CacheBuildModules} from '../../../shader-assembly/cache-pass/CacheBuildModules.js';
import {CacheValues} from '../../../gpu-cache-runtime/CacheValues.js';
import {FlatCompactCacheShader} from '../../flat-earth/FlatCompactCacheShader.js';
import {CanonicalExponentialCacheShader} from '../../canonical-atmosphere/cache/CanonicalExponentialCacheShader.js';
import {CanonicalMiePhaseMatrix} from '../../canonical-atmosphere/cache/CanonicalMiePhaseMatrix.js';
import {PositiveColumnCacheTransport} from '../../../atmospheric-transport/cache/PositiveColumnCacheTransport.js';
import {LocalSunCompactCacheSource} from './LocalSunCompactCacheSource.js';
import {LocalSunCompactConstructionProfile} from './LocalSunCompactConstructionProfile.js';
import {LocalSunCompactReconstruction} from './LocalSunCompactReconstruction.js';

/** Source-owned complete pure/cumulative compact graph, scalar packing and reconstruction resources. */
export class LocalSunCompactGpuPlan {
	/** Genuine complete construction capability. @readonly @type {LocalSunCompactConstructionProfile} */
	profile;
	/** Geometry-owned coordinate contributor. @readonly @type {FlatCompactCacheShader} */
	geometryShader;
	/** Existing physical atmosphere with analytic columns. @type {CanonicalExponentialCacheShader} */
	_atmosphereShader;
	/** Continuous and held physical source contributor. @type {LocalSunCompactCacheSource} */
	_sourceShader;
	/** Source-independent positive path integrator. @type {PositiveColumnCacheTransport} */
	_transport;
	/** Invariant physical phase matrix, only allocated for multiple orders. @type {CanonicalMiePhaseMatrix | null} */
	_phase = null;
	/** Node-specific log normalization texture. @readonly @type {CacheData} */
	nodeFactors;

	/** Creates legitimate owner contributors and auxiliary resources for one accepted compact profile.
	 *
	 * @param {unknown} candidate - Complete construction profile validated at ingress.
	 */
	constructor(candidate) {
		let profile = LocalSunCompactConstructionProfile.assert(candidate);
		profile.createExecutionProfile();
		this.profile = profile;
		let {geometry, atmosphere} = profile.models;
		let {topology, incomingDirections, outgoingDirections} = profile.domains;
		this.geometryShader = new FlatCompactCacheShader({geometry, topology, incomingDirections, outgoingDirections});
		this._atmosphereShader = new CanonicalExponentialCacheShader(atmosphere);
		this._sourceShader = new LocalSunCompactCacheSource(profile);
		this._transport = new PositiveColumnCacheTransport();
		let reconstruction = new LocalSunCompactReconstruction({geometry, atmosphere, topology});
		this.nodeFactors = CacheValues.createData({
			id: topology.id + ':log-normalization',
			quantity: 'log-interpolation-factor',
			units: '1',
			shape: [15, topology.positionCount],
			values: topology.nodes.flatMap((node) => reconstruction.nodeLogFactors(node.index)),
		});
	}

	/** Called by plan creation to identify a real scalar field with direction-fastest physical packing.
	 *
	 * @param {string} id - Logical field identity.
	 * @param {boolean} radiance - Incoming L rather than outgoing J.
	 * @returns {CacheFieldSpec} - Exact R32F array storage.
	 */
	_field(id, radiance = false) {
		return {
			id,
			storage: {
				format: 'R32F',
				width: radiance
					? this.profile.domains.incomingDirections.directionCount
					: this.profile.domains.outgoingDirections.directionCount,
				height: this.profile.domains.topology.positionCount,
				layers: 15,
			},
		};
	}

	/** Call this method to emit physical-density reconstruction shared by build and ordinary runtime lookup.
	 *
	 * @param {string} sampler - Declared physical J array sampler.
	 * @returns {string} - Positive per-tap normalized interpolation and restoration.
	 */
	createReconstructionSource(sampler) {
		let atmosphere = this.profile.models.atmosphere;
		return `
const float COMPACT_BETA_R[15]=float[15](${atmosphere.seaLevelRayleighScattering.values.map((value) => value.toExponential(16)).join(',')});
const float COMPACT_BETA_M[15]=float[15](${atmosphere.seaLevelMieExtinction.values.map((value) => value.toExponential(16)).join(',')});
float compactLogFactor(float rho,float altitude,int channel) {
	float distance=length(vec2(rho,COMPACT_SOURCE.z-altitude));
	float extinction=COMPACT_BETA_R[channel]*exp(-altitude/${atmosphere.constants.rayleighScaleHeight.value.toFixed(1)})+COMPACT_BETA_M[channel]*exp(-altitude/${atmosphere.constants.mieScaleHeight.value.toFixed(1)});
	return log(extinction)+2.0*log(COMPACT_SOURCE.z/distance);
}
float compactStoredDensity(vec3 position,vec3 direction,int channel,float rho) {
	CompactPositionStencil positions=compactPositionStencil(rho,position.z);
	CompactDirectionStencil ordinary=compactDirectionStencil(position,direction,false);
	CompactDirectionStencil axis=compactDirectionStencil(position,direction,true);
	float queryLog=compactLogFactor(rho,position.z,channel);float density=0.0;
	for(int positionTap=0;positionTap<4;++positionTap) {
		if(positions.weights[positionTap]==0.0)continue;
		int positionIndex=positions.indices[positionTap];
		CompactDirectionStencil directions=ordinary;
		if(compactNodeExcess(positionIndex)==0.0)directions=axis;
		float nodeLog=texelFetch(uCompactNodeFactors,ivec2(channel,positionIndex),0).r;
		float positionWeight=positions.weights[positionTap]*exp(queryLog-nodeLog);
		for(int directionTap=0;directionTap<4;++directionTap) {
			float weight=positionWeight*directions.weights[directionTap];if(weight==0.0)continue;
			density+=weight*texelFetch(${sampler},ivec3(directions.indices[directionTap],positionIndex,channel),0).r;
		}
	}
	return density;
}`;
	}

	/** Called by graph assembly to supply source-owned main and physical-field layout semantics.
	 *
	 * @param {CacheBuildContext} context - Accepted operation and logical inputs.
	 * @returns {CacheBuildModule} - Cache layout/operation contribution.
	 */
	_cacheModule(context) {
		let inputs = context.inputs.map((field) => CacheBuildModules.fieldInputBindingName(field.id));
		/** @type {CacheBinding[]} */
		let bindings = [];
		/** @type {CacheShaderBlock[]} */
		let blocks = [];
		let requires = [];
		let provides = ['cache.outputLayout'];
		if (context.kind === 'primary-j1') {
			requires = ['lightSource.compactDensity'];
			blocks.push({
				id: 'compact-primary-main',
				phase: 'main',
				order: 100,
				source: 'vec3 position=compactPosition(int(gl_FragCoord.y)); vec3 direction=compactDirection(uCompactOutgoing,int(gl_FragCoord.x),position); a32CacheOutput=compactPrimaryDensity(position,direction,a32CacheWavelengthLayer,true);',
			});
		} else if (context.kind === 'transport') {
			requires = ['geometry.compactCache'];
			provides.push('cache.compactStoredDensity');
			bindings.push({
				spec: {
					id: this.nodeFactors.id,
					name: 'uCompactNodeFactors',
					kind: 'data',
					shaderType: 'sampler2D',
					frequency: 'build',
				},
				value: this.nodeFactors,
			});
			blocks.push({
				id: 'compact-stored-density',
				phase: 'function',
				order: 0,
				source: this.createReconstructionSource(inputs[0]),
			});
		} else if (context.kind === 'scatter') {
			if (this._phase === null)
				this._phase = new CanonicalMiePhaseMatrix({
					atmosphere: this.profile.models.atmosphere,
					incoming: this.profile.domains.incomingDirections,
					outgoing: this.profile.domains.outgoingDirections,
				});
			bindings.push({
				spec: {
					id: this._phase.data.id,
					name: 'uCompactMiePhases',
					kind: 'data',
					shaderType: 'sampler2D',
					frequency: 'build',
				},
				value: this._phase.data,
			});
			requires = ['geometry.compactCache', 'atmosphere.compactColumns'];
			blocks.push({
				id: 'compact-scatter-main',
				phase: 'main',
				order: 100,
				source: `
int outgoingIndex=int(gl_FragCoord.x);int positionIndex=int(gl_FragCoord.y);int channel=a32CacheWavelengthLayer;
vec3 position=compactPosition(positionIndex);vec3 outgoing=compactDirection(uCompactOutgoing,outgoingIndex,position);
float rayleigh=cacheRayleighScattering(position,channel);float mie=cacheMieScattering(position,channel);float density=0.0;
for(int incomingIndex=0;incomingIndex<${this.profile.domains.incomingDirections.directionCount};++incomingIndex) {
	vec3 incoming=compactDirection(uCompactIncoming,incomingIndex,position);
	float phase=rayleigh*cacheRayleighPhase(outgoing,incoming)+mie*texelFetch(uCompactMiePhases,ivec2(incomingIndex,outgoingIndex),0).r;
	float radiance=texelFetch(${inputs[0]},ivec3(incomingIndex,positionIndex,channel),0).r;
	density+=radiance*phase*texelFetch(uCompactIncomingWeights,ivec2(incomingIndex,0),0).r;
}
a32CacheOutput=density;`,
			});
		} else if (context.kind === 'accumulate') {
			blocks.push({
				id: 'compact-accumulate-main',
				phase: 'main',
				order: 100,
				source: `ivec3 address=ivec3(int(gl_FragCoord.x),int(gl_FragCoord.y),a32CacheWavelengthLayer); a32CacheOutput=${inputs.map((sampler) => `texelFetch(${sampler},address,0).r`).join('+')};`,
			});
		}
		return CacheBuildModules.createBuildModule({
			id: 'local-sun-compact-' + context.kind + '-layout-v1',
			owner: 'cache',
			provides,
			requires,
			bindings,
			blocks,
		});
	}

	/** Called by graph assembly to compose contributors mechanically for one pass.
	 *
	 * @param {CacheBuildContext} context - Complete physical and numerical pass facts.
	 * @returns {CachePass} - Logical pass with legitimate owner modules.
	 */
	_pass(context) {
		let modules = [this._cacheModule(context)];
		if (context.kind !== 'accumulate') {
			modules.push(
				this.geometryShader.createCacheModule(context),
				this._atmosphereShader.createCacheModule(context),
			);
			if (context.kind === 'primary-j1' || context.kind === 'direct-l1')
				modules.push(this._sourceShader.createCacheModule(context));
			if (context.kind === 'direct-l1' || context.kind === 'transport')
				modules.push(this._transport.createCacheModule(context));
		}
		return {
			id: 'compact-' + context.kind + '-' + context.order,
			kind: context.kind,
			order: context.order,
			inputs: context.inputs.map((field) => field.id),
			output: context.output.id,
			modules,
		};
	}

	/** Call this method to assemble exactly N1, N2 or N4 pure/cumulative construction without allocating GPU fields.
	 *
	 * @returns {CacheBuildPlan} - Complete scalar graph and exact result identity.
	 */
	createBuildPlan() {
		LocalSunCompactConstructionProfile.assert(this.profile);
		let maximum = this.profile.numerical.maximumScatteringOrder;
		let primary = this._field('compact-j1');
		let fields = [primary];
		/** @type {CachePass[]} */
		let passes = [];
		let domains = /** @type {CacheConstructionDomains} */ (/** @type {unknown} */ (this.profile.domains));
		let options = {
			transportIntervalCount: this.profile.numerical.cacheTransport.intervalCount,
			maximumScatteringOrder: maximum,
		};
		passes.push(this._pass({kind: 'primary-j1', order: 1, inputs: [], output: primary, options, domains}));
		let previousDensity = primary;
		let cumulative = primary;
		if (maximum === 1) {
			cumulative = this._field('compact-j-through-1');
			fields.push(cumulative);
			passes.push(
				this._pass({kind: 'accumulate', order: 1, inputs: [primary], output: cumulative, options, domains}),
			);
		}
		for (let order = 2; order <= maximum; order++) {
			let radiance = this._field('compact-l' + (order - 1), true);
			let density = this._field('compact-j' + order);
			let nextCumulative = this._field('compact-j-through-' + order);
			fields.push(radiance, density, nextCumulative);
			let acceptedOrder = /** @type {CacheOrder} */ (order);
			passes.push(
				this._pass({
					kind: order === 2 ? 'direct-l1' : 'transport',
					order: /** @type {CacheOrder} */ (order - 1),
					inputs: order === 2 ? [] : [previousDensity],
					output: radiance,
					options,
					domains,
				}),
			);
			passes.push(
				this._pass({
					kind: 'scatter',
					order: acceptedOrder,
					inputs: [radiance],
					output: density,
					options,
					domains,
				}),
			);
			passes.push(
				this._pass({
					kind: 'accumulate',
					order: acceptedOrder,
					inputs: [cumulative, density],
					output: nextCumulative,
					options,
					domains,
				}),
			);
			previousDensity = density;
			cumulative = nextCumulative;
		}
		return {
			identity: CacheValues.createPlanIdentity('local-sun-compact-gpu-v1', fields, passes, {
				profileHash: this.profile.contentHash,
			}),
			fields,
			passes,
			result: cumulative.id,
		};
	}
}
