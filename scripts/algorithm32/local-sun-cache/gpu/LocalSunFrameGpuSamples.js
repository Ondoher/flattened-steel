import * as THREE from 'three';
import {Algorithm32ShaderAssembler} from '../../../../src/algorithm32/shader-assembly/runtime/Algorithm32ShaderAssembler.js';
import {ShaderContributions} from '../../../../src/algorithm32/shader-assembly/base/ShaderContributions.js';
import {ReceiverEnvironmentLightTransportShader} from '../../../../src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightTransportShader.js';
import {SharedModel} from '../../../../src/algorithm32/implementation/algorithm32/model/SharedModel.js';
import {LocalSunCompactReconstruction} from '../../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactReconstruction.js';
import {SpectralCalculator} from '../../../../src/algorithm32/atmospheric-transport/spectral/SpectralCalculator.js';
import {DistanceMath} from '../../../../src/algorithm32/math/index.js';

/** Retained ordinary lookup/view probe with independent frozen-field CPU controls at exact live poses. */
export class LocalSunFrameGpuSamples {
	/** Last independent CPU oracle, scoped to this immutable field set and exact profile/query tuple.
	 *
	 * @type {LocalSunFrameGpuCpuOracle|null}
	 */ _cpuOracle = null;
	/** First matched reuse is cross-checked by an independent repeated CPU evaluation. */ _cpuOracleCrosschecked = false;
	/** Retained normal owner assembly; pose values are uniforms.
	 *
	 * @type {LocalSunFrameGpuMaterial|null}
	 */ _material = null;
	/** Compiled fragment identity protects retained-program compatibility.
	 *
	 * @type {string|null}
	 */ _source = null;
	/** External physical CPU field inputs; never derived from this candidate.
	 *
	 * @type {readonly Float32Array[]}
	 */ _fields;
	/** External renderer and backend.
	 *
	 * @type {LocalSunFrameGpuSamplesConfiguration}
	 */ _configuration;

	/** Creates one bounded probe over independently authenticated immutable physical fields.
	 *
	 * @param {LocalSunFrameGpuSamplesConfiguration} configuration - External hardware and CPU gold arrays.
	 */
	constructor(configuration) {
		this._configuration = configuration;
		this._fields = configuration.fields;
	}

	/** Called by shader bindings to normalize ordinary owner uniform defaults.
	 *
	 * @param {string} type - Shader uniform type.
	 * @param {unknown} value - Owner default.
	 * @returns {unknown} - Corresponding Three value.
	 */
	_uniformValue(type, value) {
		if (!Array.isArray(value)) return value;
		if (type === 'mat4') return new THREE.Matrix4().fromArray(value);
		if (type === 'vec3') return new THREE.Vector3(...value);
		if (type === 'vec2') return new THREE.Vector2(...value);
		return value;
	}

	/** Called by sampling to assemble genuine cache, geometry, atmosphere and shared transport owners.
	 *
	 * @param {PreparedLocalSunFrame} frame - Complete exact live state.
	 * @param {GpuScatteringCache} cache - Borrowed canonical field with live geometry transform.
	 * @returns {ShaderAssemblyResult} - Complete diagnostic assembly without changing any owner function.
	 */
	_assemble(frame, cache) {
		const model = new SharedModel({profile: frame.profile.createExecutionProfile(), version: 0});
		const ordinary = new ReceiverEnvironmentLightTransportShader().create({model, scatteringCache: cache});
		/** @type {ShaderContribution[]} */ const contributions = ordinary.contributions.map((contribution) => ({
			...contribution,
			mainHooks: [],
		}));
		contributions.push(
			ShaderContributions.createShaderContribution({
				id: 'p3-live-physical-samples',
				owner: 'color',
				provides: ['proof.liveSamples'],
				requires: ['cache.sampleCumulativeScatteringDensity', 'transport.evaluatePathRadiance'],
				textures: [
					ShaderContributions.createShaderTextureDeclaration('uP3Queries', 'sampler2D', 'proof.liveQueries'),
				],
				uniforms: [
					ShaderContributions.createShaderUniformDeclaration('uP3Channel', 'int', 'proof.liveChannel', 0),
				],
				mainHooks: [
					ShaderContributions.createShaderSourceBlock(
						'p3-live-physical-output',
						'diagnosticOutput',
						0,
						`
int index=int(gl_FragCoord.x);
vec4 point=texelFetch(uP3Queries,ivec2(0,index),0);
vec4 direction=texelFetch(uP3Queries,ivec2(1,index),0);
state.ray=ViewRay(point.xyz,normalize(direction.xyz));
if(point.w==0.0) {
	AtmosphereCoordinate coordinate=resolveAtmosphereCoordinate(state.ray,0.0);
	SpectralValue density=sampleCumulativeScatteringDensity(point.xyz,coordinate,state.ray.direction);
	outColor=vec4(density.channels[uP3Channel],1.0,0.0,1.0);
} else {
	state.bounds=resolveAtmospherePath(state.ray,max(direction.w,0.0),direction.w>=0.0);
	evaluatePathRadiance(state);
	outColor=vec4(state.pathRadiance.channels[uP3Channel],state.transmittance.channels[uP3Channel],state.bounds.endDistanceMeters,1.0);
}`,
					),
				],
			}),
		);
		return new Algorithm32ShaderAssembler().assemble({
			contributions,
			mainRequiredSymbols: ['runtime.initialState', 'proof.liveSamples'],
			systemProvidedSymbols: [],
		});
	}

	/** Called by each live pose to select identical FP32 ingress for both independently constructed fields.
	 *
	 * @param {PreparedLocalSunFrame} frame - Exact source/receiver facts.
	 * @returns {readonly LocalSunGpuPhysicalQuery[]} - Sixteen lookup and sixteen complete/shortened rays.
	 */
	_queries(frame) {
		const receiver = frame.profile.models.geometry.configuration.observerPosition.coordinates;
		const source = frame.profile.models.lightSource.configuration.position.coordinates;
		const points = [
			[...receiver],
			[receiver[0] + 1000, receiver[1] - 700, receiver[2] + 100],
			[source[0], source[1], 2],
			[source[0] + 10, source[1] - 10, 1000],
		];
		const directions = [
			[0, 0, 1],
			[0, 0, -1],
			[1, 0, 0],
			[0, 1, 0],
		];
		/** @type {LocalSunGpuPhysicalQuery[]} */ const queries = [];
		for (const point of points)
			for (const direction of directions)
				queries.push({
					position: [Math.fround(point[0]), Math.fround(point[1]), Math.fround(point[2])],
					direction: [direction[0], direction[1], direction[2]],
					mode: 0,
					maximum: -1,
				});
		for (const direction of [
			[0, 0, 1],
			[0, 0, -1],
			[1, 0, 0],
			[0, 1, 0],
			[0.6, 0, 0.8],
			[0, 0.8, 0.6],
			[0.6, 0.8, 0],
			[0, -0.6, 0.8],
		])
			for (const maximum of [1000, 50000]) {
				const rounded = direction.map(Math.fround),
					norm = Math.hypot(...rounded);
				queries.push({
					position: [Math.fround(receiver[0]), Math.fround(receiver[1]), Math.fround(receiver[2])],
					direction: [rounded[0] / norm, rounded[1] / norm, rounded[2] / norm],
					mode: 1,
					maximum,
				});
			}
		// Exact vertical full-slab endpoint and ordinary horizontal fallback.
		queries[16] = {...queries[16], maximum: -1};
		queries[20] = {...queries[20], maximum: -1};
		return queries;
	}

	/** Call this method to compare current live lookup/rays with independently generated physical CPU fields.
	 * Rejects incompatible retained shader source, GPU compilation/readback errors, nonfinite samples, failed endpoint/physical gates or a mismatched independently repeated oracle. The host must preserve the failed run; temporary GPU resources and the borrowed cache are always released.
	 *
	 * @param {PreparedLocalSunFrame} frame - Published complete packet.
	 * @returns {Promise<LocalSunFrameGpuSampleResult>} - Actual GPU quantities and independent CPU residuals.
	 */
	async sample(frame) {
		const {backend, renderer} = this._configuration;
		const cache = frame.borrowCache();
		const previousTarget = renderer.getRenderTarget();
		let target, texture, geometry;
		try {
			const assembly = this._assemble(frame, cache);
			const queries = this._queries(frame);
			const queryValues = new Float32Array(queries.length * 8);
			queries.forEach((query, index) =>
				queryValues.set([...query.position, query.mode, ...query.direction, query.maximum], index * 8),
			);
			texture = new THREE.DataTexture(queryValues, 2, queries.length, THREE.RGBAFormat, THREE.FloatType);
			texture.needsUpdate = true;
			texture.generateMipmaps = false;
			texture.minFilter = THREE.NearestFilter;
			texture.magFilter = THREE.NearestFilter;
			/** @type {LocalSunFrameGpuUniforms} */ const uniforms = {};
			/** @type {LocalSunFrameGpuCacheUniforms} */ const cacheUniforms = {};
			for (const contribution of assembly.contributions) {
				for (const uniform of contribution.uniforms)
					uniforms[uniform.name] = {value: this._uniformValue(uniform.type, uniform.defaultValue)};
				for (const declaration of contribution.textures) {
					uniforms[declaration.name] = {value: declaration.valueKey === 'proof.liveQueries' ? texture : null};
					if (declaration.valueKey.startsWith('cache.'))
						cacheUniforms[declaration.valueKey] = uniforms[declaration.name];
				}
			}
			backend.installRuntimeBindings({bindings: cache.getRuntimeBindings(), uniforms: cacheUniforms});
			if (this._material && this._source !== assembly.fragmentShaderSource)
				throw new Error('Physical pose changed the retained ordinary sample program.');
			if (!this._material) {
				this._source = assembly.fragmentShaderSource;
				this._material = new THREE.RawShaderMaterial({
					glslVersion: THREE.GLSL3,
					vertexShader:
						'precision highp float; in vec3 position; out vec2 screenTextureCoordinates; void main(){screenTextureCoordinates=position.xy*0.5+0.5;gl_Position=vec4(position,1.0);}',
					fragmentShader: assembly.fragmentShaderSource.replace(/^#version 300 es\s*/u, ''),
					uniforms,
					depthTest: false,
					depthWrite: false,
					blending: THREE.NoBlending,
				});
			} else
				for (const [name, uniform] of Object.entries(uniforms))
					this._material.uniforms[name].value = uniform.value;
			geometry = new THREE.BufferGeometry();
			geometry.setAttribute(
				'position',
				new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
			);
			const scene = new THREE.Scene(),
				camera = new THREE.Camera(),
				mesh = new THREE.Mesh(geometry, this._material);
			mesh.frustumCulled = false;
			scene.add(mesh);
			target = new THREE.WebGLRenderTarget(queries.length, 1, {
				type: THREE.FloatType,
				format: THREE.RGBAFormat,
				depthBuffer: false,
				stencilBuffer: false,
			});
			await renderer.compileAsync(scene, camera);
			const output = new Float32Array(queries.length * 15 * 3),
				pixels = new Float32Array(queries.length * 4);
			for (let channel = 0; channel < 15; channel++) {
				this._material.uniforms.uP3Channel.value = channel;
				renderer.setRenderTarget(target);
				renderer.render(scene, camera);
				renderer.readRenderTargetPixels(target, 0, 0, queries.length, 1, pixels);
				for (let index = 0; index < queries.length; index++)
					output.set(pixels.subarray(index * 4, index * 4 + 3), (index * 15 + channel) * 3);
			}
			if (output.some((value) => !Number.isFinite(value)))
				throw new Error('Live physical GPU samples contain nonfinite values.');
			if (renderer.getContext().getError() !== 0)
				throw new Error('Live physical sampling reported a WebGL error.');
			const profile = frame.profile,
				reconstruction = new LocalSunCompactReconstruction({
					geometry: profile.models.geometry,
					atmosphere: profile.models.atmosphere,
					topology: profile.domains.topology,
				});
			const reader = {
				/** Called by CPU reconstruction to read authenticated independent physical J fields.
				 *
				 * @param {DirectionalSpectralFieldCoordinates} address - Logical position, direction and wavelength indices.
				 * @returns {number} - Cumulative independent scattering density.
				 */
				readScalar: ({positionIndex, directionIndex, wavelengthIndex}) =>
					this._fields.reduce(
						(sum, field) => sum + field[(wavelengthIndex * 1049 + positionIndex) * 4374 + directionIndex],
						0,
					),
			};
			/** @type {CpuScatteringCache} */ const cpuCache = {
				/** Called by the borrowed oracle interface; authenticated arrays remain externally owned.
				 *
				 * @returns {void} - No owned numerical resource is released.
				 */
				dispose() {},
				sampleProvenanceIdentity: 'authenticated-p2-independent-fields',
				/** Called by CPU view transport to reconstruct this independent physical field.
				 * Rejects unsupported spatial or directional support; fail the comparison rather than clamp.
				 *
				 * @param {ScatteringCacheSampleRequest} request - Physical sample context and matching geometry.
				 * @returns {SpectralScatteringDensityPacket} - Independent Native15 scattering-density packet.
				 */
				sampleCumulativeScatteringDensity: ({context}) =>
					reconstruction.sampleScatteringDensity({
						...context,
						reader,
						provenanceIdentity: 'authenticated-p2-independent-fields',
					}),
			};
			const model = new SharedModel({profile: profile.createExecutionProfile(), version: 0});
			const oracleKey = JSON.stringify([profile.contentHash, queries]);
			const cachedOracle =
				this._configuration.retainMatchedCpuOracle && this._cpuOracle?.key === oracleKey
					? this._cpuOracle
					: null;
			const crosscheckOracle = cachedOracle !== null && !this._cpuOracleCrosschecked;
			const reuseOracle = cachedOracle !== null && !crosscheckOracle;
			const expectedValues = reuseOracle ? cachedOracle.values : new Float64Array(output.length);
			const residual = {count: 0, failures: 0, maximumRatio: 0, maximumAbsolute: 0},
				endpoints = {count: 0, maximumError: 0};
			for (const [index, query] of queries.entries()) {
				const position = {coordinates: query.position, units: /** @type {const} */ ('meters')};
				let density, radiance;
				if (!reuseOracle && query.mode === 0)
					density = cpuCache.sampleCumulativeScatteringDensity({
						context: {
							position,
							physicalOutgoingDirection: query.direction,
							atmosphereCoordinate: profile.models.geometry.resolveAtmosphereCoordinate(position),
						},
						geometry: profile.models.geometry,
					});
				else if (!reuseOracle) {
					const segment = profile.models.geometry.resolveViewRaySegment({
						origin: position,
						direction: query.direction,
						...(query.maximum < 0 ? {} : {endDistance: {value: query.maximum, units: 'meters'}}),
					});
					const calculator = new SpectralCalculator({model});
					const points = calculator.buildEndpointTrapezoidPathIntegrationPoints(segment, 15);
					radiance = calculator.computeRadiance(segment, points, {scatteringCache: cpuCache});
					expectedValues[index * 45 + 2] = DistanceMath.toMeters(segment.endDistance);
				}
				if (query.mode !== 0) {
					endpoints.count++;
					const error = Math.abs(output[index * 45 + 2] - expectedValues[index * 45 + 2]);
					endpoints.maximumError = Math.max(endpoints.maximumError, error);
					if (error > 0.01) throw new Error('Independent live ray endpoint exceeds its frozen gate.');
				}
				for (let channel = 0; channel < 15; channel++)
					for (let component = 0; component < (query.mode === 0 ? 1 : 2); component++) {
						const expected = reuseOracle
							? expectedValues[(index * 15 + channel) * 3 + component]
							: component === 1
								? radiance.transmittance.values[channel]
								: query.mode === 0
									? density.values[channel]
									: radiance.pathRadiance.values[channel];
						expectedValues[(index * 15 + channel) * 3 + component] = expected;
						const actual = output[(index * 15 + channel) * 3 + component],
							error = Math.abs(actual - expected),
							floor = component === 1 ? 1e-7 : query.mode === 0 ? 1e-12 : 1e-9;
						const ratio = error / (floor + 0.002 * Math.abs(expected));
						residual.count++;
						residual.maximumAbsolute = Math.max(residual.maximumAbsolute, error);
						residual.maximumRatio = Math.max(residual.maximumRatio, ratio);
						if (!Number.isFinite(ratio) || ratio > 1) residual.failures++;
					}
			}
			if (residual.failures)
				throw new Error('Independent live physical CPU/GPU comparison failed: ' + JSON.stringify(residual));
			if (crosscheckOracle) {
				if (expectedValues.some((value, index) => value !== cachedOracle.values[index]))
					throw new Error('Repeated independent CPU oracle differs from its exact matched-input copy.');
				this._cpuOracleCrosschecked = true;
			}
			if (this._configuration.retainMatchedCpuOracle) this._cpuOracle = {key: oracleKey, values: expectedValues};
			return {
				cpuOracleReused: reuseOracle,
				values: Array.from(output),
				queries: queries.map((query) => ({mode: query.mode, maximum: query.maximum})),
				cpu: residual,
				endpoints,
				negative: output.reduce((count, value, index) => count + (index % 3 !== 2 && value < 0 ? 1 : 0), 0),
			};
		} finally {
			renderer.setRenderTarget(previousTarget);
			target?.dispose();
			texture?.dispose();
			geometry?.dispose();
			cache.dispose();
		}
	}

	/** Call this method to release only the probe's retained program.
	 *
	 * @returns {void} - No value.
	 */
	dispose() {
		this._material?.dispose();
		this._material = null;
		this._cpuOracle = null;
	}
}
