import {
	CACHE_WAVELENGTH_LAYER_BINDING_NAME,
	cacheFieldInputBindingName,
} from '../caches/gpu/cacheBuildContracts.js';
import {
	CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
} from '../caches/gpu/cacheRuntimeContracts.js';
const MAXIMUM_PROBE_SCALAR_COUNT = 4096;
/** @type {Readonly<Record<string, number>>} */
const CANONICAL_UNIT_SCALE = {
	meters: 1,
	kilometers: 1000,
	'm^-1': 1,
	'km^-1': 0.001,
	'm^-1 micrometers^4': 1,
	nanometers: 1,
	micrometers: 1000,
	radians: 1,
	degrees: Math.PI / 180,
	steradians: 1,
	'sr^-1': 1,
	seconds: 1,
	'scene-units': 1,
	'meters-per-scene-unit': 1,
	'1': 1,
	pixels: 1,
	bytes: 1,
	kibibytes: 1024,
	mebibytes: 1024 * 1024,
};
const FULLSCREEN_VERTEX_SHADER = `
precision highp float;
in vec3 position;
void main() {
	gl_Position = vec4(position, 1.0);
}
`.trim();

const BACKEND_RECORDS = new WeakMap();
const FIELD_RECORDS = new WeakMap();
const PROGRAM_RECORDS = new WeakMap();
const RUNTIME_BINDING_RECORDS = new WeakMap();
let backendSequence = 0;

/**
 * Require one integer value in an inclusive API range.
 *
 * @param {number} value - Supplies the candidate value.
 * @param {number} maximum - Supplies the inclusive maximum.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {number} The integer.
 */
function boundedIndex(value, maximum, label) {
	if (!Number.isInteger(value)
		|| value < 0
		|| value > maximum) {
		throw new RangeError(`${label} must be an integer from 0 through ${maximum}.`);
	}

	return value;
}

/**
 * Capture every renderer or WebGL state value mutated by this adapter.
 *
 * @param {typeof import('three')} THREE - Supplies the Three namespace.
 * @param {import('three').WebGLRenderer} renderer - Supplies the renderer.
 * @param {WebGL2RenderingContext} context - Supplies the WebGL2 context.
 * @returns {() => void} The restoration operation.
 */
function captureRendererState(THREE, renderer, context) {
	const target = renderer.getRenderTarget();
	const layer = renderer.getActiveCubeFace();
	const mipLevel = renderer.getActiveMipmapLevel();
	const viewport = renderer.getViewport(new THREE.Vector4());
	const scissor = renderer.getScissor(new THREE.Vector4());
	const scissorTest = renderer.getScissorTest();
	const readBuffer = context.getParameter(context.READ_BUFFER);

	return () => {
		renderer.setRenderTarget(target, layer, mipLevel);
		renderer.setViewport(viewport);
		renderer.setScissor(scissor);
		renderer.setScissorTest(scissorTest);
		context.readBuffer(readBuffer);
	};
}

/**
 * Execute renderer work while preserving caller-owned state.
 *
 * @template T
 * @param {object} record - Supplies accepted backend state.
 * @param {() => T} operation - Supplies renderer work.
 * @returns {T} The operation result.
 */
function withRendererState(record, operation) {
	const restore = captureRendererState(record.THREE, record.renderer, record.context);
	try {
		return operation();
	} finally {
		restore();
	}
}

/**
 * Create one private scalar R32F array render target.
 *
 * @param {typeof import('three')} THREE - Supplies the Three namespace.
 * @param {number} width - Supplies the direction extent.
 * @param {number} height - Supplies the position extent.
 * @param {number} layers - Supplies the wavelength extent.
 * @returns {import('three').WebGLArrayRenderTarget} The render target.
 */
function createScalarArrayTarget(THREE, width, height, layers) {
	const target = new THREE.WebGLArrayRenderTarget(width, height, layers, {
		format: THREE.RedFormat,
		type: THREE.FloatType,
		internalFormat: 'R32F',
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		wrapS: THREE.ClampToEdgeWrapping,
		wrapT: THREE.ClampToEdgeWrapping,
		generateMipmaps: false,
		depthBuffer: false,
		stencilBuffer: false,
	});
	target.texture.unpackAlignment = 1;
	target.texture.generateMipmaps = false;
	return target;
}

/**
 * Require a complete R32F framebuffer for one selected array layer.
 *
 * @param {object} record - Supplies accepted backend state.
 * @param {import('three').WebGLArrayRenderTarget} target - Supplies the target.
 * @param {number} layer - Supplies the selected layer.
 * @returns {void}
 */
function assertFramebufferComplete(record, target, layer) {
	record.renderer.setRenderTarget(target, layer, 0);
	const status = record.context.checkFramebufferStatus(record.context.FRAMEBUFFER);
	if (status !== record.context.FRAMEBUFFER_COMPLETE) {
		throw new Error(`ThreeCacheBackend R32F framebuffer is incomplete (${status}).`);
	}
}

/**
 * Inspect and validate the renderer capabilities required by the selected
 * scalar array layout.
 *
 * @param {typeof import('three')} THREE - Supplies the Three namespace.
 * @param {import('three').WebGLRenderer} renderer - Supplies the renderer.
 * @returns {{context: WebGL2RenderingContext, capabilities: CacheGpuCapabilities}} The accepted capability state.
 */
function inspectCapabilities(THREE, renderer) {
	if (renderer.capabilities.isWebGL2 !== true) {
		throw new Error('ThreeCacheBackend requires WebGL2.');
	}

	const context = /** @type {WebGL2RenderingContext} */ (renderer.getContext());
	if (!context.getExtension('EXT_color_buffer_float')) {
		throw new Error('ThreeCacheBackend requires EXT_color_buffer_float for R32F rendering.');
	}

	const maximumTextureSize = context.getParameter(context.MAX_TEXTURE_SIZE);
	const maximumArrayLayers = context.getParameter(context.MAX_ARRAY_TEXTURE_LAYERS);
	const highFloat = context.getShaderPrecisionFormat(
		context.FRAGMENT_SHADER,
		context.HIGH_FLOAT,
	);
	if (!Number.isInteger(maximumTextureSize) || maximumTextureSize < 1
		|| !Number.isInteger(maximumArrayLayers) || maximumArrayLayers < 1) {
		throw new Error('ThreeCacheBackend received invalid WebGL2 texture limits.');
	}
	if (!highFloat || highFloat.precision < 1) {
		throw new Error('ThreeCacheBackend requires highp fragment floating-point precision.');
	}

	const capabilityId = [
		`three-r${THREE.REVISION}`,
		'webgl2-r32f',
		`texture-${maximumTextureSize}`,
		`layers-${maximumArrayLayers}`,
		`highp-${highFloat.precision}`,
	].join(':');
	const capabilities = /** @type {CacheGpuCapabilities} */ ({
		id: capabilityId,
		api: `Three r${THREE.REVISION} / WebGL2`,
		scalarFormat: 'R32F',
		supportsArrayRenderTargets: true,
		supportsFloatSampling: true,
		maximumTextureSize,
		maximumArrayLayers,
	});
	const probeTarget = createScalarArrayTarget(THREE, 1, 1, 1);
	const record = { THREE, renderer, context };
	try {
		withRendererState(record, () => assertFramebufferComplete(record, probeTarget, 0));
	} finally {
		probeTarget.dispose();
	}

	return { context, capabilities };
}

/**
 * Require one active backend record.
 *
 * @param {ThreeCacheBackend} backend - Supplies the backend handle.
 * @returns {object} The backend record.
 */
function requireBackendRecord(backend) {
	const record = BACKEND_RECORDS.get(backend);
	if (!record || record.disposed) {
		throw new Error('ThreeCacheBackend has been disposed.');
	}

	return record;
}

/**
 * Dispose one field handle and its private renderer resource.
 *
 * @param {GpuCacheField} field - Supplies the field handle.
 * @returns {void}
 */
function disposeField(field) {
	const record = FIELD_RECORDS.get(field);
	if (!record || record.disposed) {
		return;
	}

	record.disposed = true;
	try {
		record.target.dispose();
	} finally {
		record.backend.fields.delete(field);
	}
}

/**
 * Dispose one program handle and every private resource it owns.
 *
 * @param {CacheGpuProgram} program - Supplies the program handle.
 * @returns {void}
 */
function disposeProgram(program) {
	const record = PROGRAM_RECORDS.get(program);
	if (!record || record.disposed) {
		return;
	}

	record.disposed = true;
	let disposalError = null;
	for (const resource of [...record.dataResources, record.geometry, record.material]) {
		try {
			resource.dispose();
		} catch (error) {
			disposalError ??= error;
		}
	}
	record.backend.programs.delete(program);
	if (disposalError) {
		throw disposalError;
	}
}

/**
 * Create an opaque public field handle backed by a private Three array target.
 *
 * @param {CacheFieldSpec} spec - Supplies storage and descriptive identity.
 * @param {string} backendId - Supplies backend ownership identity.
 * @returns {GpuCacheField} The field handle.
 */
function createFieldHandle(spec, backendId) {
	const field = /** @type {GpuCacheField} */ ({
		descriptor: spec.descriptor,
		storage: spec.storage,
		backendId,
		dispose() {
			disposeField(field);
		},
	});
	return field;
}

/**
 * Create an opaque public program handle backed by private pass resources.
 *
 * @param {string} id - Supplies program identity.
 * @param {string} sourceHash - Supplies source identity.
 * @returns {CacheGpuProgram} The program handle.
 */
function createProgramHandle(id, sourceHash) {
	const program = /** @type {CacheGpuProgram} */ ({
		id,
		sourceHash,
		dispose() {
			disposeProgram(program);
		},
	});
	return program;
}

/**
 * Create an opaque public runtime binding backed by a private field association.
 *
 * @param {string} id - Supplies binding identity.
 * @param {GpuCacheFieldDescriptor} descriptor - Supplies field identity.
 * @param {string} backendId - Supplies backend ownership identity.
 * @returns {CacheRuntimeBinding} The runtime binding.
 */
function createRuntimeBindingHandle(id, descriptor, backendId, valueKey) {
	return {
		id,
		valueKey,
		descriptor,
		backendId,
	};
}

/**
 * Require one active runtime binding owned by the supplied backend.
 *
 * @param {CacheRuntimeBinding} binding - Supplies the opaque binding handle.
 * @param {object} backend - Supplies required backend ownership.
 * @returns {object} The private field record.
 */
function requireRuntimeBindingField(binding, backend) {
	const bindingRecord = RUNTIME_BINDING_RECORDS.get(binding);
	if (!bindingRecord || bindingRecord.backend !== backend) {
		throw new TypeError(
			'Runtime cache binding must be an opaque binding owned by this backend.',
		);
	}

	return requireFieldRecord(
		bindingRecord.field,
		backend,
		'Runtime cache binding field',
	);
}

/**
 * Require one active field owned by the supplied backend.
 *
 * @param {GpuCacheField} value - Supplies the field handle.
 * @param {object} backend - Supplies required backend ownership.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {object} The private field record.
 */
function requireFieldRecord(value, backend, label) {
	const record = FIELD_RECORDS.get(value);
	if (!record || record.backend !== backend) {
		throw new TypeError(`${label} must be an opaque field owned by this backend.`);
	}
	if (record.disposed) {
		throw new Error(`${label} has been disposed.`);
	}

	return record;
}

/**
 * Require one active program owned by the supplied backend.
 *
 * @param {CacheGpuProgram} value - Supplies the program handle.
 * @param {object} backend - Supplies required backend ownership.
 * @returns {object} The private program record.
 */
function requireProgramRecord(value, backend) {
	const record = PROGRAM_RECORDS.get(value);
	if (!record || record.backend !== backend) {
		throw new TypeError('Cache layer program must be an opaque program owned by this backend.');
	}
	if (record.disposed) {
		throw new Error('Cache layer program has been disposed.');
	}

	return record;
}

/**
 * Resolve a supported unit value to its canonical scalar.
 *
 * @param {object} value - Supplies the unit value.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {number} The canonical scalar.
 */
function canonicalUnitScalar(value, label) {
	const scale = CANONICAL_UNIT_SCALE[value.units];
	if (scale === undefined) {
		throw new RangeError(`${label} units are not supported by the GPU boundary.`);
	}

	return value.value * scale;
}

/**
 * Identify a packed-data binding for type-directed resource creation.
 *
 * @param {CacheBinding} binding - Supplies one typed binding.
 * @returns {binding is CacheDataBinding} Whether this carries packed data.
 */
function isDataBinding(binding) {
	return binding.spec.kind === 'data';
}

/**
 * Identify a uniform binding for type-directed value normalization.
 *
 * @param {CacheBinding} binding - Supplies one typed binding.
 * @returns {binding is CacheUniformBinding} Whether this carries a uniform.
 */
function isUniformBinding(binding) {
	return binding.spec.kind === 'uniform';
}

/**
 * Resolve one typed binding value to a Three uniform value.
 *
 * @param {typeof import('three')} THREE - Supplies the Three namespace.
 * @param {CacheUniformBinding} binding - Supplies the typed binding.
 * @returns {unknown} The Three uniform value.
 */
function uniformValue(THREE, binding) {
	const value = binding.value;
	if (binding.spec.shaderType === 'bool' || binding.spec.shaderType === 'int') {
		return value;
	}
	if (binding.spec.shaderType === 'vec3') {
		if (Array.isArray(value)) {
			return new THREE.Vector3(value[0], value[1], value[2]);
		}
		const position = /** @type {Position} */ (value);
		const scale = canonicalUnitScalar(
			{ value: 1, units: position.units },
			`Cache shader uniform ${binding.spec.name}`,
		);
		return new THREE.Vector3(
			position.coordinates[0] * scale,
			position.coordinates[1] * scale,
			position.coordinates[2] * scale,
		);
	}
	if (binding.spec.shaderType.startsWith('float[')) {
		return new Float32Array(/** @type {SpectralPacket} */ (value).values);
	}
	if (typeof value === 'number') {
		return value;
	}
	return canonicalUnitScalar(value, `Cache shader uniform ${binding.spec.name}`);
}

/**
 * Create one privately owned texture for a data binding.
 *
 * @param {typeof import('three')} THREE - Supplies the Three namespace.
 * @param {CacheData} data - Supplies normalized packed values.
 * @returns {import('three').DataTexture | import('three').DataArrayTexture} The texture.
 */
function createDataTexture(THREE, data) {
	const values = new Float32Array(data.values);
	const width = data.shape[0];
	const height = data.shape[1] ?? 1;
	const texture = data.shape.length === 3
		? new THREE.DataArrayTexture(values, width, height, data.shape[2])
		: new THREE.DataTexture(values, width, height);
	texture.format = THREE.RedFormat;
	texture.type = THREE.FloatType;
	texture.internalFormat = 'R32F';
	texture.minFilter = THREE.NearestFilter;
	texture.magFilter = THREE.NearestFilter;
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;
	texture.generateMipmaps = false;
	texture.unpackAlignment = 1;
	texture.needsUpdate = true;
	return texture;
}

/**
 * Configure material bindings and collect private data resources.
 *
 * @param {typeof import('three')} THREE - Supplies the Three namespace.
 * @param {readonly CacheBinding[]} bindings - Supplies shader bindings.
 * @returns {{uniforms: Record<string, {value: unknown}>, dataResources: Array<import('three').Texture>}} The material data.
 */
function createMaterialBindings(THREE, bindings) {
	/** @type {Record<string, {value: unknown}>} */
	const uniforms = {
		[CACHE_WAVELENGTH_LAYER_BINDING_NAME]: { value: 0 },
	};
	/** @type {Array<import('three').Texture>} */
	const dataResources = [];

	try {
		bindings.forEach((binding) => {
			if (isDataBinding(binding)) {
				const texture = createDataTexture(THREE, binding.value);
				dataResources.push(texture);
				uniforms[binding.spec.name] = { value: texture };
				return;
			}
			if (isUniformBinding(binding)) {
				uniforms[binding.spec.name] = {
					value: uniformValue(THREE, binding),
				};
			}
		});
	} catch (error) {
		for (const resource of dataResources) {
			resource.dispose();
		}
		throw error;
	}

	return { uniforms, dataResources };
}

/**
 * Create private fullscreen pass resources for one cache shader.
 *
 * @param {object} backend - Supplies accepted backend state.
 * @param {CacheShader} shader - Supplies the shader.
 * @returns {object} The private program resources.
 */
function createProgramResources(backend, shader) {
	const bindingData = createMaterialBindings(backend.THREE, shader.bindings);
	/** @type {import('three').BufferGeometry | null} */
	let geometry = null;
	/** @type {import('three').RawShaderMaterial | null} */
	let material = null;
	try {
		geometry = new backend.THREE.BufferGeometry();
		geometry.setAttribute('position', new backend.THREE.BufferAttribute(new Float32Array([
			-1, -1, 0,
			3, -1, 0,
			-1, 3, 0,
		]), 3));
		material = new backend.THREE.RawShaderMaterial({
			glslVersion: backend.THREE.GLSL3,
			vertexShader: FULLSCREEN_VERTEX_SHADER,
			fragmentShader: shader.source,
			uniforms: bindingData.uniforms,
			blending: backend.THREE.NoBlending,
			depthTest: false,
			depthWrite: false,
			toneMapped: false,
			transparent: false,
		});
		const mesh = new backend.THREE.Mesh(geometry, material);
		mesh.frustumCulled = false;
		const scene = new backend.THREE.Scene();
		scene.add(mesh);

		return {
			geometry,
			material,
			scene,
			camera: new backend.THREE.Camera(),
			dataResources: bindingData.dataResources,
		};
	} catch (error) {
		geometry?.dispose();
		material?.dispose();
		for (const resource of bindingData.dataResources) {
			resource.dispose();
		}
		throw error;
	}
}

/**
 * Apply submission-time uniforms and opaque input fields.
 *
 * @param {object} backend - Supplies accepted backend state.
 * @param {object} program - Supplies private program state.
 * @param {CacheLayerSubmission} request - Supplies the layer request.
 * @param {number} layer - Supplies the accepted wavelength layer.
 * @returns {void}
 */
function applySubmissionBindings(backend, program, request, layer) {
	program.material.uniforms[CACHE_WAVELENGTH_LAYER_BINDING_NAME].value = layer;
	for (const input of request.inputs) {
		const inputRecord = requireFieldRecord(input.field, backend, `Cache input ${input.id}`);
		boundedIndex(
			layer,
			inputRecord.storage.layers - 1,
			`Cache input ${input.id} wavelength layer`,
		);
		const name = cacheFieldInputBindingName(input.id);
		const uniform = program.material.uniforms[name];
		if (uniform) {
			uniform.value = inputRecord.target.texture;
		} else {
			program.material.uniforms[name] = { value: inputRecord.target.texture };
		}
	}

	for (const binding of request.bindings) {
		if (!isUniformBinding(binding)
			|| binding.spec.frequency !== 'layer') {
			continue;
		}
		program.material.uniforms[binding.spec.name].value = uniformValue(
			backend.THREE,
			binding,
		);
	}
}

/**
 * Accept one selected scalar coordinate at the readback API boundary.
 *
 * @param {DirectionalSpectralFieldCoordinates} value - Supplies the coordinate.
 * @param {CacheFieldStorage} storage - Supplies executable field bounds.
 * @param {number} index - Supplies the coordinate index.
 * @returns {DirectionalSpectralFieldCoordinates} The coordinate.
 */
function acceptProbeCoordinate(value, storage, index) {
	return {
		directionIndex: boundedIndex(
			value.directionIndex,
			storage.width - 1,
			`Cache probe coordinate[${index}] directionIndex`,
		),
		positionIndex: boundedIndex(
			value.positionIndex,
			storage.height - 1,
			`Cache probe coordinate[${index}] positionIndex`,
		),
		wavelengthIndex: boundedIndex(
			value.wavelengthIndex,
			storage.layers - 1,
			`Cache probe coordinate[${index}] wavelengthIndex`,
		),
	};
}

/**
 * Adapt Three/WebGL2 to Algorithm32's opaque GPU cache backend.
 */
export class ThreeCacheBackend {
	/**
	 * @param {ThreeCacheBackendRequest} request - Supplies Three and its renderer.
	 */
	constructor(request) {
		const { THREE, renderer } = request;
		const inspected = inspectCapabilities(THREE, renderer);
		backendSequence += 1;
		this.id = `algorithm32-three-cache-backend-${backendSequence}`;
		this.capabilities = inspected.capabilities;
		BACKEND_RECORDS.set(this, {
			THREE,
			renderer,
			context: inspected.context,
			fields: new Set(),
			programs: new Set(),
			runtimeBindingSequence: 0,
			disposed: false,
		});
	}

	/**
	 * @param {CacheFieldSpec} spec - Supplies executable storage and metadata.
	 * @returns {GpuCacheField} The opaque field.
	 */
	allocateField(spec) {
		const backend = requireBackendRecord(this);
		const { storage } = spec;
		if (storage.width > this.capabilities.maximumTextureSize
			|| storage.height > this.capabilities.maximumTextureSize
			|| storage.layers > this.capabilities.maximumArrayLayers) {
			throw new RangeError('GPU cache field exceeds this backend\'s texture capabilities.');
		}

		const target = createScalarArrayTarget(
			backend.THREE,
			storage.width,
			storage.height,
			storage.layers,
		);
		const field = createFieldHandle(spec, this.id);
		const record = {
			backend,
			descriptor: spec.descriptor,
			storage,
			target,
			disposed: false,
		};
		FIELD_RECORDS.set(field, record);
		backend.fields.add(field);
		return field;
	}

	/**
	 * @param {CacheShader} shader - Supplies one assembled cache fragment shader.
	 * @returns {Promise<CacheGpuProgram>} The opaque compiled program.
	 */
	async compile(shader) {
		const backend = requireBackendRecord(this);
		const resources = createProgramResources(backend, shader);
		const program = createProgramHandle(shader.id, shader.sourceHash);
		const record = {
			backend,
			...resources,
			output: shader.output,
			disposed: false,
		};
		PROGRAM_RECORDS.set(program, record);
		backend.programs.add(program);

		try {
			await withRendererState(backend, () => (
				typeof backend.renderer.compileAsync === 'function'
					? backend.renderer.compileAsync(
						record.scene,
						record.camera,
					)
					: backend.renderer.compile(
						record.scene,
						record.camera,
					)
			));
		} catch (error) {
			program.dispose();
			throw error;
		}

		return program;
	}

	/**
	 * @param {CacheLayerSubmission} request - Supplies one pass/layer submission.
	 * @returns {void}
	 */
	submitLayer(request) {
		const backend = requireBackendRecord(this);
		const program = requireProgramRecord(request.program, backend);
		const output = requireFieldRecord(request.output, backend, 'Cache layer output');
		const layer = boundedIndex(
			request.layer,
			output.storage.layers - 1,
			'Cache output wavelength layer',
		);
		applySubmissionBindings(backend, program, request, layer);

		withRendererState(backend, () => {
			assertFramebufferComplete(backend, output.target, layer);
			backend.renderer.setViewport(
				0,
				0,
				output.storage.width,
				output.storage.height,
			);
			backend.renderer.setScissor(
				0,
				0,
				output.storage.width,
				output.storage.height,
			);
			backend.renderer.setScissorTest(false);
			backend.renderer.render(program.scene, program.camera);
		});
	}

	/**
	 * @param {GpuCacheField} field - Supplies one resident field.
	 * @returns {CacheRuntimeBinding} The opaque runtime binding.
	 */
	createRuntimeBinding(field, valueKey = CUMULATIVE_SCATTERING_CACHE_VALUE_KEY) {
		const backend = requireBackendRecord(this);
		if (typeof valueKey !== 'string' || valueKey.length === 0) {
			throw new TypeError('Runtime cache binding requires a nonempty value key.');
		}
		const fieldRecord = requireFieldRecord(field, backend, 'Runtime cache field');
		backend.runtimeBindingSequence += 1;
		const binding = createRuntimeBindingHandle(
			`${this.id}:binding:${backend.runtimeBindingSequence}:${fieldRecord.descriptor.id}`,
			fieldRecord.descriptor,
			this.id,
			valueKey,
		);
		RUNTIME_BINDING_RECORDS.set(binding, { backend, field });
		return binding;
	}

	/**
	 * Resolve opaque cache handles inside the renderer adapter and install their
	 * private textures into already-created shader uniforms.
	 *
	 * @param {CacheRuntimeBindingInstallRequest} request - Supplies bindings and renderer uniforms.
	 * @returns {void}
	 */
	installRuntimeBindings(request) {
		const backend = requireBackendRecord(this);

		for (const binding of request.bindings.bindings) {
			const field = requireRuntimeBindingField(binding, backend);
			const uniform = request.uniforms[binding.valueKey];
			if (!uniform) {
				throw new TypeError(
					`Runtime cache uniform ${binding.valueKey} is unavailable.`,
				);
			}

			uniform.value = field.target.texture;
		}
	}

	/**
	 * @param {CacheProbeRequest} request - Supplies selected scalar coordinates.
	 * @returns {Promise<CacheProbeResult>} The selected scalar values.
	 */
	async readSelectedScalars(request) {
		const backend = requireBackendRecord(this);
		const field = requireFieldRecord(request.field, backend, 'Cache probe field');
		if (request.coordinates.length > MAXIMUM_PROBE_SCALAR_COUNT) {
			throw new RangeError(
				`Cache probe requests are limited to ${MAXIMUM_PROBE_SCALAR_COUNT} scalars.`,
			);
		}
		const coordinates = request.coordinates.map((coordinate, index) =>
			acceptProbeCoordinate(coordinate, field.storage, index));

		const samples = withRendererState(backend, () => coordinates.map((coordinate) => {
			assertFramebufferComplete(
				backend,
				field.target,
				coordinate.wavelengthIndex,
			);
			backend.context.readBuffer(backend.context.COLOR_ATTACHMENT0);
			const value = new Float32Array(1);
			backend.context.readPixels(
				coordinate.directionIndex,
				coordinate.positionIndex,
				1,
				1,
				backend.context.RED,
				backend.context.FLOAT,
				value,
			);
			return { coordinates: coordinate, value: value[0] };
		}));

		return {
			descriptor: field.descriptor,
			samples,
		};
	}

	/** Dispose all fields and programs owned by this adapter. */
	dispose() {
		const backend = BACKEND_RECORDS.get(this);
		if (!backend || backend.disposed) {
			return;
		}

		backend.disposed = true;
		let disposalError = null;
		for (const program of [...backend.programs]) {
			try {
				program.dispose();
			} catch (error) {
				disposalError ??= error;
			}
		}
		for (const field of [...backend.fields]) {
			try {
				field.dispose();
			} catch (error) {
				disposalError ??= error;
			}
		}
		if (disposalError) {
			throw disposalError;
		}
	}
}
