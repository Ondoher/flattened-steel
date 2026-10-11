import * as THREE from 'three';
import {ThreeCacheBackend} from '../../../src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import {ReceiverEnvironmentLightTransportShader} from '../../../src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightTransportShader.js';
import {LOCAL_SUN_CUMULATIVE_SCATTERING_SAMPLER_NAME} from '../../../src/algorithm32/implementation/local-sun/cache/consts.js';
import {createOwners, sampleField, residual, rayCoverage, unit} from '../rotation-model.js';

/** Accumulate one scalar comparison without retaining full duplicate spectra.
 * @param {LocalSunRotationResidual} result - Running exact channel inventory.
 * @param {number} actual - Actual scalar, in the declared quantity units.
 * @param {number} expected - CPU or additive reference scalar.
 * @param {number} absolute - Frozen quantity-specific absolute allowance.
 * @returns {void} - Updates the unchanged 0.2-percent relative comparison.
 */
function observe(result, actual, expected, absolute) {
	const index = result.count++;
	if (!Number.isFinite(actual) || !Number.isFinite(expected)) {
		result.nonfinite++;
		result.failures++;
		return;
	}
	if (actual < -absolute || expected < -absolute) result.negative++;
	const error = Math.abs(actual - expected),
		ratio = error / (absolute + 0.002 * Math.abs(expected));
	if (ratio > result.maximumRatio) {
		result.maximumRatio = ratio;
		result.worstIndex = index;
	}
	result.maximumAbsolute = Math.max(result.maximumAbsolute, error);
	if (ratio > 1) result.failures++;
}

/** Derive fixed FP32 physical lookup ingresses without tuning from a holdout.
 * @param {LocalSunShellLayout} layout - Frozen compact topology or equivalent occupied prefix.
 * @param {readonly UnitVector3[]} outgoing - Complete production W27 directions.
 * @returns {LocalSunLayoutLookupQuery[]} - Nodes, cell interiors, edges, axis approaches and angular seams.
 */
function lookupQueries(layout, outgoing) {
	const directions = [
		[1, 0, 0],
		[0, 1, 0],
		[0, 0, 1],
		[1, 1, 0],
		[1, 0, 1],
		[1, 1, 1],
		[-1, 2, 3],
	];
	for (const seed of [
		[1, 1, 0],
		[1, 0, 1],
		[0, 1, 1],
		[1, 1, 1],
		[-1, 1, 1],
	])
		for (let axis = 0; axis < 3; axis++)
			for (const delta of [-1e-5, 1e-5]) {
				const d = [...seed];
				d[axis] += delta;
				directions.push(d);
			}
	/** @type {Map<string, readonly [number,number]>} */ const points = new Map();
	const add = (/** @type {number} */ rho, /** @type {number} */ z) => {
		const p = /** @type {const} */ ([Math.fround(rho), Math.fround(z)]);
		points.set(p.join(','), p);
	};
	for (const row of layout.rows)
		for (let i = 0; i < row.indices.length; i++) {
			const n = layout.nodes[row.indices[i]];
			add(n.rho, n.z);
			if (i + 1 < row.indices.length) add((n.rho + layout.nodes[row.indices[i + 1]].rho) / 2, n.z);
		}
	for (let i = 0; i < layout.rows.length - 1; i++)
		for (const fraction of [0, 0.19, 0.51, 0.93, 1])
			add(fraction * layout.maximumRho, (layout.rows[i].z + layout.rows[i + 1].z) / 2);
	for (const z of [0, 1, 5, layout.top - 1, layout.top])
		for (const rho of [0, 0.001, 1, layout.maximumRho - 1, layout.maximumRho]) add(rho, z);
	for (const band of layout.bands.filter((b) => b.admitted)) {
		const z = layout.top / 2,
			r = band.outer;
		const rho = Math.sqrt(Math.max(0, (r - (layout.height - z)) * (r + (layout.height - z))));
		if (rho > 1 && rho < layout.maximumRho - 1) for (const delta of [-1, 0, 1]) add(rho + delta, z);
	}
	/** @type {LocalSunLayoutLookupQuery[]} */ const queries = [];
	const append = (/** @type {number} */ rho, /** @type {number} */ z, /** @type {readonly number[]} */ direction) => {
		const d = unit(direction);
		queries.push({
			position: [Math.fround(rho), 0, Math.fround(z)],
			direction: [Math.fround(d[0]), Math.fround(d[1]), Math.fround(d[2])],
		});
	};
	for (const [rho, z] of points.values()) for (const d of directions) append(rho, z, d);
	for (const [rho, z] of [
		[0, 0],
		[0, 5],
		[0, layout.top],
		[layout.maximumRho / 2, 0],
		[layout.maximumRho, layout.top / 2],
		[layout.maximumRho, layout.top],
	])
		for (const d of outgoing) append(rho, z, d);
	return queries;
}

/** Exercise the actual runtime cache lookup on the measured cumulative texture, without running transport.
 * Coordinates are explicitly source-relative for this diagnostic only; normal images/rays retain the exact world frame.
 * @param {LocalSunRotationOwners} owners - Live selected-policy candidate.
 * @param {Map<string,LocalSunRotationField>} fields - Actual complete readbacks.
 * @param {LocalSunRotationField} cumulative - Actual cumulative readback.
 * @param {LocalSunShellCaptureRequest} request - Frozen state and unchanged layout.
 * @param {GpuScatteringCache} cache - Caller-owned cache and support bindings.
 * @param {ThreeCacheBackend} backend - Caller-owned runtime-binding installer.
 * @param {THREE.WebGLRenderer} renderer - Caller-owned renderer.
 * @returns {Promise<LocalSunLayoutFieldLookup[]>} - All-channel cumulative lookup consistency observations.
 */
async function directLookups(owners, fields, cumulative, request, cache, backend, renderer) {
	const queries = lookupQueries(request.layout, owners.domains.outgoingUnitVectors);
	const cpu = createOwners(
		{
			state: {
				...request.state,
				geometry: {
					...request.state.geometry,
					sourcePosition: {coordinates: [0, 0, request.layout.height], units: 'meters'},
					sourceSubpoint: {coordinates: [0, 0, 0], units: 'meters'},
				},
			},
			candidate: 'axis',
			shellLayout: request.layout,
			shellRuntime: true,
			diagnostic: false,
			angles: [0],
			motion: false,
		},
		0,
	);
	const assembly = new ReceiverEnvironmentLightTransportShader().create({
		model: owners.model,
		scatteringCache: cache,
	});
	const start = assembly.fragmentShaderSource.lastIndexOf('void main()');
	if (start < 0) throw new Error('Lookup diagnostic main anchor changed.');
	const prefix = assembly.fragmentShaderSource
		.slice(0, start)
		.replace(
			/const vec3 GEOMETRY_SOURCE_SUBPOINT_METERS = [^;]+;/u,
			'const vec3 GEOMETRY_SOURCE_SUBPOINT_METERS = vec3(0.0);',
		);
	const block = assembly.contributions
		.flatMap((c) => c.functions)
		.find((b) => b.code.includes('SpectralValue sampleCumulativeScatteringDensity('));
	if (!block) throw new Error('Actual cache lookup source missing.');
	/** Require an exact single source anchor before deriving the diagnostic channel view.
	 * @param {string} code - Current derived source.
	 * @param {RegExp} anchor - Single frozen structural anchor.
	 * @param {string} replacement - Channel-only substitution, preserving lookup math.
	 * @returns {string} - Derived source or a loud schema-drift failure.
	 */
	const replaceOne = (code, anchor, replacement) => {
		if ([...code.matchAll(new RegExp(anchor.source, 'gu'))].length !== 1)
			throw new Error('Diagnostic channel lookup anchor changed: ' + anchor.source);
		return code.replace(anchor, replacement);
	};
	let channelSource = replaceOne(
		block.code,
		/SpectralValue sampleCumulativeScatteringDensity\(/u,
		'float sampleLayoutChannel(',
	);
	channelSource = replaceOne(channelSource, /SpectralValue density;/u, '');
	channelSource = replaceOne(
		channelSource,
		/for\s*\(int channelIndex\s*=\s*0;\s*channelIndex\s*<\s*SPECTRAL_CHANNEL_COUNT;\s*channelIndex\s*\+=\s*1\)\s*\{/u,
		'{ int channelIndex = uLayoutChannel;',
	);
	channelSource = replaceOne(
		channelSource,
		/density\.channels\[channelIndex\]\s*=\s*channelDensity;/u,
		'return channelDensity;',
	);
	channelSource = replaceOne(channelSource, /return density;/u, 'return 0.0;');
	channelSource = replaceOne(
		channelSource,
		new RegExp(
			'(texelFetch\\(\\s*' +
				LOCAL_SUN_CUMULATIVE_SCATTERING_SAMPLER_NAME +
				',\\s*ivec3\\([\\s\\S]*?),\\s*channelIndex\\s*\\)',
			'u',
		),
		'$1, 0)',
	);
	const source =
		prefix +
		'\nuniform int uLayoutChannel;\n' +
		channelSource +
		`\nuniform sampler2D uLayoutPositions; uniform sampler2D uLayoutDirections;
void main() {
 int index=int(gl_FragCoord.x);
 vec3 p=texelFetch(uLayoutPositions,ivec2(index,0),0).xyz;
 vec3 d=normalize(texelFetch(uLayoutDirections,ivec2(index,0),0).xyz);
 float value=sampleLayoutChannel(p,AtmosphereCoordinate(p.z,length(p.xy)),d);
 outColor=vec4(value,0.0,0.0,1.0);
}`;
	/** @type {LocalSunRotationUniformMap} */ const uniforms = {};
	/** @type {LocalSunRotationUniformMap} */ const cacheUniforms = {};
	for (const contribution of assembly.contributions) {
		for (const u of contribution.uniforms) {
			let value = u.defaultValue ?? null;
			if (u.name === 'uCacheGeometrySourceSubpoint') value = new THREE.Vector3(0, 0, 0);
			else if (u.type === 'vec3' && Array.isArray(value)) value = new THREE.Vector3(...value);
			else if (u.type === 'mat4' && Array.isArray(value)) value = new THREE.Matrix4().fromArray(value);
			uniforms[u.name] = {value};
		}
		for (const t of contribution.textures) {
			uniforms[t.name] = {value: null};
			cacheUniforms[t.valueKey] = uniforms[t.name];
		}
	}
	backend.installRuntimeBindings({bindings: cache.getRuntimeBindings(), uniforms: cacheUniforms});
	const outputUniform = cacheUniforms['cache.cumulativeScatteringDensity'];
	if (!outputUniform) throw new Error('Field lookup texture binding missing.');
	const capacity = 2048,
		positions = new Float32Array(capacity * 4),
		directions = new Float32Array(capacity * 4);
	const pTexture = new THREE.DataTexture(positions, capacity, 1, THREE.RGBAFormat, THREE.FloatType),
		dTexture = new THREE.DataTexture(directions, capacity, 1, THREE.RGBAFormat, THREE.FloatType);
	uniforms.uLayoutPositions = {value: pTexture};
	uniforms.uLayoutDirections = {value: dTexture};
	uniforms.uLayoutChannel = {value: 0};
	const material = new THREE.RawShaderMaterial({
		glslVersion: THREE.GLSL3,
		vertexShader:
			'precision highp float; in vec3 position; out vec2 screenTextureCoordinates; void main(){screenTextureCoordinates=position.xy*0.5+0.5;gl_Position=vec4(position.xy,0.,1.);}',
		fragmentShader: source.replace(/^#version 300 es\s*/u, ''),
		uniforms,
		depthTest: false,
		depthWrite: false,
	});
	const geometry = new THREE.PlaneGeometry(2, 2),
		scene = new THREE.Scene(),
		camera = new THREE.Camera();
	scene.add(new THREE.Mesh(geometry, material));
	const target = new THREE.WebGLRenderTarget(capacity, 1, {
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		depthBuffer: false,
	});
	const previous = renderer.getRenderTarget(),
		pixels = new Float32Array(capacity * 4);
	/** @type {LocalSunLayoutFieldLookup[]} */ const results = [];
	let texture;
	try {
		await renderer.compileAsync(scene, camera);
		for (const id of ['cumulative']) {
			const field = id === 'cumulative' ? cumulative : fields.get(id);
			if (!field) throw new Error('Required lookup field missing.');
			if (!(field.values.buffer instanceof ArrayBuffer))
				throw new Error('Shared diagnostic readback is not admitted.');
			const result = residual([], [], 1e-12, 0.002);
			const expected = new Float64Array(queries.length * 15);
			for (let i = 0; i < queries.length; i++) {
				const q = queries[i];
				expected.set(sampleField(field, cpu.geometry, q.position, unit(q.direction)), i * 15);
				if (i % 16384 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
			}
			const planeSize = field.storage.width * field.storage.height;
			for (let c = 0; c < 15; c++) {
				const data = new Float32Array(
					field.values.buffer,
					field.values.byteOffset + c * planeSize * 4,
					planeSize,
				);
				texture = new THREE.DataArrayTexture(data, field.storage.width, field.storage.height, 1);
				texture.format = THREE.RedFormat;
				texture.type = THREE.FloatType;
				texture.internalFormat = 'R32F';
				texture.needsUpdate = true;
				outputUniform.value = texture;
				uniforms.uLayoutChannel.value = c;
				for (let offset = 0; offset < queries.length; offset += capacity) {
					const batch = queries.slice(offset, offset + capacity);
					batch.forEach((q, i) => {
						positions.set([...q.position, 1], 4 * i);
						directions.set([...q.direction, 1], 4 * i);
					});
					pTexture.needsUpdate = true;
					dTexture.needsUpdate = true;
					renderer.setRenderTarget(target);
					renderer.render(scene, camera);
					renderer.readRenderTargetPixels(target, 0, 0, batch.length, 1, pixels);
					for (let i = 0; i < batch.length; i++)
						observe(result, pixels[4 * i], expected[(offset + i) * 15 + c], 1e-12);
					if (offset % (capacity * 8) === 0) {
						await new Promise((resolve) => setTimeout(resolve, 0));
					}
				}
				console.log(`layout lookup ${id}: channel ${c + 1}/15, ${queries.length} queries`);
				texture.dispose();
				texture = null;
			}
			results.push({id, units: 'W m^-3 sr^-1 nm^-1', queries: queries.length, residual: result});
		}
		return results;
	} finally {
		renderer.setRenderTarget(previous);
		texture?.dispose();
		target.dispose();
		material.dispose();
		geometry.dispose();
		pTexture.dispose();
		dTexture.dispose();
		cpu.facade.dispose();
	}
}

/** Check full pure-order accounting and exact candidate runtime consistency.
 * @param {LocalSunRotationOwners} owners - Exact current candidate owners.
 * @param {Float64Array | null} streamedSum - Complete binary64 additive sum, when order arrays are released.
 * @param {Map<string,LocalSunRotationField>} fields - Actual pure and transported fields.
 * @param {LocalSunRotationField} cumulative - Complete cumulative density.
 * @param {LocalSunShellCaptureRequest} request - Frozen numerical controls.
 * @param {GpuScatteringCache} cache - Caller-owned active cache.
 * @param {ThreeCacheBackend} backend - Caller-owned diagnostic backend.
 * @param {THREE.WebGLRenderer} renderer - Caller-owned renderer.
 * @param {LocalSunRotationRayResult[]} rays - Exact current CPU view segments.
 * @param {LocalSunRotationGpuRayResult[]} gpu - Identical-direction GPU observations.
 * @returns {Promise<LocalSunLayoutChecks>} - Additive ordinary-correctness evidence only.
 */
export async function qualifyLayout(
	owners,
	streamedSum,
	fields,
	cumulative,
	request,
	cache,
	backend,
	renderer,
	rays,
	gpu,
) {
	const pure = [1, 2, 3, 4].map((order) => fields.get('local-sun-j' + order));
	if (
		streamedSum
			? streamedSum.length !== cumulative.values.length
			: pure.some((f) => !f || f.values.length !== cumulative.values.length)
	)
		throw new Error('Pure/cumulative field shape mismatch.');
	const closure = residual([], [], 1e-12, 0.002);
	for (let i = 0; i < cumulative.values.length; i++)
		observe(
			closure,
			cumulative.values[i],
			streamedSum
				? streamedSum[i]
				: pure[0].values[i] + pure[1].values[i] + pure[2].values[i] + pure[3].values[i],
			1e-12,
		);
	const transmittance = residual(
		gpu.flatMap((q) => q.transmittance),
		rays.flatMap((q) => q.transmittance),
		1e-7,
		0.002,
	);
	const endpoint = Math.max(
		...rays.map((q, i) =>
			Math.max(
				Math.abs(q.segment.startDistance.value - gpu[i].start),
				Math.abs(q.segment.endDistance.value - gpu[i].end),
			),
		),
	);
	const coverage = rayCoverage(owners, rays);
	const lookups = await directLookups(owners, fields, cumulative, request, cache, backend, renderer);
	return {
		schema: 'local-sun-p3-layout-checks-v1',
		cumulativeClosure: closure,
		transmittance,
		maximumEndpointDifferenceMeters: endpoint,
		coverage,
		lookups,
		qualified:
			closure.failures === 0 &&
			transmittance.failures === 0 &&
			endpoint <= 0.01 &&
			coverage.excluded.length === 0 &&
			lookups.every((r) => r.residual.failures === 0 && r.residual.negative === 0),
	};
}
