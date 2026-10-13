import * as THREE from 'three';
import {Algorithm32ShaderAssembler} from '../../../../src/algorithm32/shader-assembly/runtime/Algorithm32ShaderAssembler.js';
import {ShaderContributions} from '../../../../src/algorithm32/shader-assembly/base/ShaderContributions.js';
import {ReceiverEnvironmentLightTransportShader} from '../../../../src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightTransportShader.js';
import {LocalSunCompactReconstruction} from '../../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactReconstruction.js';
import {SpectralCalculator} from '../../../../src/algorithm32/atmospheric-transport/spectral/SpectralCalculator.js';
import {ShellRuntimeCalculator} from '../../../../experiments/local-sun-cache-reuse/shell-runtime-calculator.js';
import {TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME} from '../../../../src/algorithm32/atmospheric-transport/consts.js';

/** Bounded CPU/ordinary-GPU lookup and view-ray qualification using independent physical inputs. */
export class LocalSunRuntimeProof {
	/** Called by query preparation to append one matched FP32 physical query.
	 *
	 * @param {LocalSunGpuPhysicalQuery[]} queries - Owned query output.
	 * @param {readonly number[]} position - Accepted three-coordinate physical point in meters.
	 * @param {readonly number[]} direction - Accepted three-coordinate nonzero ray direction.
	 * @param {0|1|2} [mode=0] - Lookup, complete ray or explicit rejection query.
	 * @param {number} [maximum=-1] - Shortened distance or complete-ray sentinel.
	 * @returns {void} - Query appended to the owned output.
	 */
	_appendQuery(queries, position, direction, mode = 0, maximum = -1) {
		const matched = direction.map(Math.fround);
		const length = Math.hypot(...matched);
		queries.push({
			position: [Math.fround(position[0]), Math.fround(position[1]), Math.fround(position[2])],
			direction: [matched[0] / length, matched[1] / length, matched[2] / length],
			mode,
			maximum,
		});
	}

	/** Call this method to compare all declared support families and complete/shortened view rays.
	 *
	 * @param {LocalSunRuntimeProofRequest} request - Accepted profile, independent fields and live ordinary cache.
	 * @returns {Promise<LocalSunRuntimeProofReport>} - Physical scalar comparisons at the frozen gates.
	 */
	async verify({profile, model, cache, backend, renderer, order}) {
		let ids = order === 4 ? ['cumulative'] : Array.from({length: order}, (_, index) => 'local-sun-j' + (index + 1));
		/** @type {Float32Array[]} */ let fields = [];
		for (let id of ids) {
			let reply = await fetch('/gold/' + id);
			if (!reply.ok) throw new Error('Runtime physical control missing');
			fields.push(new Float32Array(await reply.arrayBuffer()));
		}
		let reconstruction = new LocalSunCompactReconstruction({
			geometry: profile.models.geometry,
			atmosphere: profile.models.atmosphere,
			topology: profile.domains.topology,
		});
		let reader = {
			readScalar: ({positionIndex, directionIndex, wavelengthIndex}) =>
				profile.models.lightSource.configuration.referenceSpectralIncidentScale *
				fields.reduce(
					(sum, field) => sum + field[(wavelengthIndex * 1049 + positionIndex) * 4374 + directionIndex],
					0,
				),
		};
		/** @type {CpuScatteringCache} */
		let cpuCache = {
			dispose: () => {},
			sampleProvenanceIdentity: 'independent-full-physical-fields',
			sampleCumulativeScatteringDensity: ({context}) =>
				reconstruction.sampleScatteringDensity({
					...context,
					reader,
					provenanceIdentity: 'independent-full-physical-fields',
				}),
		};
		/** @type {LocalSunGpuPhysicalQuery[]} */ const queries = [];
		for (let node of profile.domains.positions.nodes) {
			let p = /** @type {Position} */ (node.metadata.position).coordinates;
			for (let directionIndex of [364, 1093, 1822, 2551, 3280, 4009])
				this._appendQuery(queries, p, profile.domains.outgoingDirections.unitVectors[directionIndex]);
		}
		for (let positionIndex of [0, 400])
			for (let direction of profile.domains.outgoingDirections.unitVectors)
				this._appendQuery(
					queries,
					/** @type {Position} */ (profile.domains.positions.nodes[positionIndex].metadata.position)
						.coordinates,
					direction,
				);
		for (let row of profile.domains.topology.rows.slice(0, -1)) {
			let upper = profile.domains.topology.rows[profile.domains.topology.rows.indexOf(row) + 1];
			for (let rho of [0, 0.01, 1000, profile.domains.topology.coverageRadius.value - 8])
				for (let direction of [
					[1, 1, 0],
					[1, 0, 1],
					[-1, 2, 3],
				])
					this._appendQuery(queries, [rho, 0, (row.altitude.value + upper.altitude.value) / 2], direction);
		}
		let lookups = queries.length;
		for (let position of [
			[0, 0, 1000],
			[1000, 0, 8000],
			[1000, 1000, 80000],
		])
			for (let direction of [
				[0, 0, 1],
				[0, 0, -1],
			])
				this._appendQuery(queries, position, direction, 1);
		this._appendQuery(queries, [0, 0, 1000], [1, 0, 0], 1);
		this._appendQuery(queries, [1000, 0, 80000], [1, 0, 1], 1);
		this._appendQuery(queries, [1000, 0, 8000], [1, 2, 0.5], 1, 1024);
		let radius = profile.domains.topology.coverageRadius.value;
		for (let direction of [
			[0, 1, 0],
			[1, 0, 0],
			[0, 0, 1],
			[0, 0, -1],
		])
			this._appendQuery(queries, [radius, 0, 50000], direction, 1);
		// At the 33,378 km cylinder, FP32 rounds a one-meter excess onto the boundary.
		// Use an exactly represented exterior coordinate; CPU one-meter rejection remains a P1 control.
		for (let position of [
			[-1, 0, 1000],
			[radius + 8, 0, 1000],
			[0, 0, -1],
			[0, 0, profile.models.geometry.configuration.topAltitude.value + 1],
		])
			this._appendQuery(queries, position, [1, 0, 0], 2);
		/** @type {LocalSunGpuPhysicalExpectation[]} */ let expected = [];
		let independentRatios = [];
		let endpoints = [];
		let calculator = new SpectralCalculator({model});
		let independent = new ShellRuntimeCalculator({model});
		for (let query of queries) {
			/** @type {Position} */ let position = {coordinates: query.position, units: 'meters'};
			if (query.mode === 2) {
				expected.push({radiance: Array(15).fill(1)});
				continue;
			}
			if (query.mode === 0) {
				expected.push({
					radiance: cpuCache.sampleCumulativeScatteringDensity({
						geometry: profile.models.geometry,
						context: {
							position,
							atmosphereCoordinate: profile.models.geometry.resolveAtmosphereCoordinate(position),
							physicalOutgoingDirection: query.direction,
						},
					}).values,
				});
				continue;
			}
			let ray = profile.models.geometry.resolveCompactLocalSunCacheRay({
				topology: profile.domains.topology,
				position,
				physicalDirection: query.direction,
				...(query.maximum < 0 ? {} : {maximumDistance: {value: query.maximum, units: 'meters'}}),
			});
			/** @type {RaySegment} */ let segment = {
				ray: {origin: position, direction: query.direction},
				startDistance: {value: 0, units: 'meters'},
				endDistance: ray.length,
			};
			let points = calculator.buildEndpointTrapezoidPathIntegrationPoints(segment, 15);
			let cpu = calculator.computeRadiance(segment, points, {scatteringCache: cpuCache});
			let gold = independent.computeRadiance(
				segment,
				independent.buildEndpointTrapezoidPathIntegrationPoints(segment, 15),
				{scatteringCache: cpuCache},
			);
			let ratio = Math.max(
				...cpu.pathRadiance.values.map(
					(value, index) =>
						Math.abs(value - gold.pathRadiance.values[index]) /
						(1e-9 + 0.002 * Math.abs(gold.pathRadiance.values[index])),
				),
			);
			independentRatios.push(ratio);
			if (ratio > 1) throw new Error('CPU view policy differs from independent retained equations');
			expected.push({
				radiance: gold.pathRadiance.values,
				transmission: gold.transmittance.values,
				length: ray.length.value,
			});
			endpoints.push({boundary: ray.boundary, length: ray.length.value});
		}
		console.log('runtime queries prepared ' + queries.length + '; complete/shortened rays ' + endpoints.length);
		let source = new ReceiverEnvironmentLightTransportShader().create({model, scatteringCache: cache});
		let contributions = source.contributions.map((contribution) => ({...contribution, mainHooks: []}));
		let proof = ShaderContributions.createShaderContribution({
			id: 'compact-runtime-physical-probe',
			owner: 'color',
			provides: ['proof.compactRuntime'],
			requires: ['cache.sampleCumulativeScatteringDensity', 'transport.evaluatePathRadiance'],
			textures: [{name: 'uProofQueries', type: 'sampler2D', valueKey: 'proof.queries'}],
			uniforms: [{name: 'uProofChannel', type: 'int', valueKey: 'proof.channel', defaultValue: 0}],
			functions: [
				{
					id: 'proof-query-reader',
					slot: 'declareHelpers',
					order: 100,
					code: `float proofScalar(int index){return texelFetch(uProofQueries,ivec2(index%1024,index/1024),0).r;}`,
				},
			],
			mainHooks: [
				{
					id: 'proof-physical-output',
					slot: 'diagnosticOutput',
					order: 100,
					code: `
int queryIndex=int(gl_FragCoord.y)*512+int(gl_FragCoord.x);
if(queryIndex>=${queries.length}){outColor=vec4(0.0);return;}
int offset=queryIndex*8;
vec3 position=vec3(proofScalar(offset),proofScalar(offset+1),proofScalar(offset+2));
vec3 direction=normalize(vec3(proofScalar(offset+3),proofScalar(offset+4),proofScalar(offset+5)));
if(proofScalar(offset+6)==2.0){CompactPositionStencil rejected=compactPositionStencil(position.x,position.z);outColor=vec4(all(isnan(rejected.weights))?1.0:0.0,0.0,0.0,1.0);return;}
if(proofScalar(offset+6)==0.0){SpectralValue density=sampleCumulativeScatteringDensity(position,AtmosphereCoordinate(position.z,compactRho(position)),direction);outColor=vec4(density.channels[uProofChannel],0.0,0.0,1.0);}
else {bool cylinder;float full=compactBoundary(position,direction,cylinder);float requested=proofScalar(offset+7);float lengthMeters=requested<0.0 ? full : min(full,requested);state.ray=ViewRay(position,direction);state.bounds=PathBounds(0.0,lengthMeters,lengthMeters,false,false,true);evaluatePathRadiance(state);outColor=vec4(state.pathRadiance.channels[uProofChannel],state.transmittance.channels[uProofChannel],lengthMeters,1.0);}
`,
				},
			],
		});
		let assembly = new Algorithm32ShaderAssembler().assemble({
			contributions: [...contributions, proof],
			mainRequiredSymbols: ['proof.compactRuntime'],
			systemProvidedSymbols: [],
		});
		let values = new Float32Array(Math.ceil((queries.length * 8) / 1024) * 1024);
		queries.forEach((query, index) =>
			values.set([...query.position, ...query.direction, query.mode, query.maximum], index * 8),
		);
		let texture = new THREE.DataTexture(values, 1024, values.length / 1024, THREE.RedFormat, THREE.FloatType);
		texture.needsUpdate = true;
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		/** @type {Record<string, {value:unknown}>} */ let uniforms = {};
		/** @type {Record<string, {value:unknown}>} */ let cacheUniforms = {};
		for (let contribution of assembly.contributions) {
			for (let declaration of contribution.uniforms) {
				uniforms[declaration.name] = {value: declaration.defaultValue ?? null};
				if (declaration.type === 'mat4') uniforms[declaration.name].value = new THREE.Matrix4();
			}
			for (let declaration of contribution.textures) {
				uniforms[declaration.name] ??= {value: null};
				cacheUniforms[declaration.valueKey] = uniforms[declaration.name];
			}
		}
		backend.installRuntimeBindings({bindings: cache.getRuntimeBindings(), uniforms: cacheUniforms});
		uniforms.uProofQueries.value = texture;
		uniforms[TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME].value = 15;
		let material = new THREE.RawShaderMaterial({
			glslVersion: THREE.GLSL3,
			vertexShader:
				'in vec3 position; out vec2 screenTextureCoordinates;void main(){screenTextureCoordinates=position.xy*.5+.5;gl_Position=vec4(position,1.0);}',
			fragmentShader: assembly.fragmentShaderSource.replace(/^#version 300 es\n/, ''),
			uniforms,
			depthTest: false,
			depthWrite: false,
		});
		let geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
		let scene = new THREE.Scene();
		scene.add(new THREE.Mesh(geometry, material));
		let camera = new THREE.Camera();
		let target = new THREE.WebGLRenderTarget(512, Math.ceil(queries.length / 512), {
			type: THREE.FloatType,
			format: THREE.RGBAFormat,
			internalFormat: 'RGBA32F',
			depthBuffer: false,
			stencilBuffer: false,
		});
		let readback = new Float32Array(target.width * target.height * 4);
		/** @type {LocalSunRuntimeProofReport} */ let result = {
			rejectedQueries: queries.filter((query) => query.mode === 2).length,
			lookups,
			lookupScalars: lookups * 15,
			rays: endpoints.length,
			rayScalars: endpoints.length * 15,
			independentCpuMaximumRatio: Math.max(...independentRatios),
			lookupMaximumRatio: 0,
			radianceMaximumRatio: 0,
			transmissionMaximumRatio: 0,
			endpointMaximumError: 0,
			failures: 0,
			assemblyHash: assembly.sourceHash,
			endpoints,
		};
		try {
			for (let channel = 0; channel < 15; channel++) {
				uniforms.uProofChannel.value = channel;
				renderer.setRenderTarget(target);
				renderer.setViewport(0, 0, target.width, target.height);
				renderer.render(scene, camera);
				renderer.readRenderTargetPixels(target, 0, 0, target.width, target.height, readback);
				let error = renderer.getContext().getError();
				if (error !== 0) throw new Error('Shared-runtime GPU probe failed ' + error);
				for (let index = 0; index < queries.length; index++) {
					if (queries[index].mode === 2) {
						if (readback[index * 4] !== 1) result.failures++;
						continue;
					}
					let reference = expected[index],
						actual = readback[index * 4],
						absolute = index < lookups ? 1e-12 : 1e-9;
					let ratio =
						Math.abs(actual - reference.radiance[channel]) /
						(absolute + 0.002 * Math.abs(reference.radiance[channel]));
					let key = index < lookups ? 'lookupMaximumRatio' : 'radianceMaximumRatio';
					result[key] = Math.max(result[key], ratio);
					if (!Number.isFinite(ratio) || ratio > 1) result.failures++;
					if (index >= lookups) {
						let transmissionRatio =
							Math.abs(readback[index * 4 + 1] - reference.transmission[channel]) /
							(1e-7 + 0.002 * Math.abs(reference.transmission[channel]));
						let endpointError = Math.abs(readback[index * 4 + 2] - reference.length);
						result.transmissionMaximumRatio = Math.max(result.transmissionMaximumRatio, transmissionRatio);
						result.endpointMaximumError = Math.max(result.endpointMaximumError, endpointError);
						if (!Number.isFinite(transmissionRatio) || transmissionRatio > 1 || endpointError > 0.01)
							result.failures++;
					}
				}
			}
		} finally {
			renderer.setRenderTarget(null);
			target.dispose();
			geometry.dispose();
			material.dispose();
			texture.dispose();
		}
		console.log(JSON.stringify(result));
		if (result.failures) throw new Error('Runtime parity failed ' + result.failures);
		return result;
	}
}
