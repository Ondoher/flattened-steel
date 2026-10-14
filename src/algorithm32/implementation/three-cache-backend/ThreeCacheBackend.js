import {CacheBuildModules} from '../../shader-assembly/cache-pass/CacheBuildModules.js';
import {CACHE_WAVELENGTH_LAYER_BINDING_NAME} from '../../shader-assembly/cache-pass/consts.js';
import ThreeCachePersistentArray from './ThreeCachePersistentArray.js';
import {
	MAXIMUM_THREE_CACHE_PROBE_SCALAR_COUNT,
	THREE_CACHE_CANONICAL_UNIT_SCALE,
	THREE_CACHE_FULLSCREEN_VERTEX_SHADER,
} from './consts.js';

/**
 * Private state keyed by opaque backend handle.
 *
 * @type {WeakMap<ThreeCacheBackend, ThreeCacheBackendRecord>}
 */
const BACKEND_RECORDS = new WeakMap();
/**
 * Private state keyed by opaque field handle.
 *
 * @type {WeakMap<GpuCacheField, ThreeCacheBackendFieldRecord>}
 */
const FIELD_RECORDS = new WeakMap();
/**
 * Private state keyed by opaque program handle.
 *
 * @type {WeakMap<CacheGpuProgram, ThreeCacheBackendProgramRecord>}
 */
const PROGRAM_RECORDS = new WeakMap();
/**
 * Private state keyed by runtime binding.
 *
 * @type {WeakMap<CacheRuntimeBinding, ThreeCacheBackendRuntimeBindingRecord>}
 */
const RUNTIME_BINDING_RECORDS = new WeakMap();
/** @type {WeakMap<CacheImmutableTexture, ThreeCacheBackendImmutableTextureRecord>} */
const IMMUTABLE_TEXTURE_RECORDS = new WeakMap();
/** Monotonic identity sequence for backend handles. */
let backendSequence = 0;

/**
 * Three/WebGL2 adapter for Algorithm32's opaque GPU cache backend.
 *
 * @implements {CacheGpuBackend}
 * @implements {CachePacketAtlasBackend}
 * @implements {CacheProbeReader}
 */
export class ThreeCacheBackend {
	/**
	 * Called by ThreeCacheBackend to require one integer within inclusive API bounds.
	 *
	 * @param {number} value - Candidate integer value.
	 * @param {number} maximum - Inclusive upper bound.
	 * @param {string} label - Diagnostic label for an invalid value.
	 * @returns {number} - Accepted integer value.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_boundedIndex(value, maximum, label) {
		if (!Number.isInteger(value) || value < 0 || value > maximum) {
			throw new RangeError(`${label} must be an integer from 0 through ${maximum}.`);
		}

		return value;
	}

	/**
	 * Called by ThreeCacheBackend to capture every renderer and WebGL state value
	 * temporarily mutated by cache work.
	 *
	 * @param {ThreeCacheBackendResourceNamespace} THREE - Three namespace used by the renderer.
	 * @param {ThreeCacheBackendRendererOperations} renderer - Renderer whose state is captured.
	 * @param {WebGL2RenderingContext} context - WebGL2 context whose read buffer is captured.
	 * @returns {ThreeCacheBackendRendererStateRestorer} - Callback that restores the captured state.
	 */
	_captureRendererState(THREE, renderer, context) {
		const target = renderer.getRenderTarget();
		const layer = renderer.getActiveCubeFace();
		const mipLevel = renderer.getActiveMipmapLevel();
		const viewport = renderer.getViewport(new THREE.Vector4());
		const scissor = renderer.getScissor(new THREE.Vector4());
		const scissorTest = renderer.getScissorTest();
		const readBuffer = context.getParameter(context.READ_BUFFER);

		return /** Called by capture renderer state to handle one invocation of the declared operation. */ () => {
			renderer.setRenderTarget(target, layer, mipLevel);
			renderer.setViewport(viewport);
			renderer.setScissor(scissor);
			renderer.setScissorTest(scissorTest);
			context.readBuffer(readBuffer);
		};
	}

	/**
	 * Called by ThreeCacheBackend to execute renderer work while preserving
	 * caller-owned state through successful and exceptional completion.
	 *
	 * @template T
	 * @param {ThreeCacheBackendRendererRecord} record - Accepted renderer state.
	 * @param {ThreeCacheBackendRendererOperation<T>} operation - Renderer work protected by state restoration.
	 * @returns {T} - Result of the renderer operation.
	 */
	_withRendererState(record, operation) {
		const restore = this._captureRendererState(record.THREE, record.renderer, record.context);
		try {
			return operation();
		} finally {
			restore();
		}
	}

	/**
	 * Called by ThreeCacheBackend to allocate and configure one private scalar
	 * R32F array render target for capability probing or field storage.
	 *
	 * @param {ThreeCacheBackendResourceNamespace} THREE - Three namespace used for allocation.
	 * @param {number} width - Direction extent of the target.
	 * @param {number} height - Position extent of the target.
	 * @param {number} layers - Wavelength extent of the target.
	 * @returns {ThreeCacheBackendScalarArrayTarget} - Configured render target.
	 */
	_createScalarArrayTarget(THREE, width, height, layers) {
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
	 * Called by ThreeCacheBackend to require a complete R32F framebuffer for one
	 * selected array layer.
	 * An incomplete framebuffer throws with its status; stop that GPU operation and report the device failure.
	 *
	 * @param {ThreeCacheBackendRendererRecord} record - Accepted renderer state.
	 * @param {ThreeCacheBackendScalarArrayTarget} target - Scalar array render target.
	 * @param {number} layer - Selected array layer.
	 * @returns {void} - No value.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_assertFramebufferComplete(record, target, layer) {
		record.renderer.setRenderTarget(target, layer, 0);
		const status = record.context.checkFramebufferStatus(record.context.FRAMEBUFFER);
		if (status !== record.context.FRAMEBUFFER_COMPLETE) {
			throw new Error(`ThreeCacheBackend R32F framebuffer is incomplete (${status}).`);
		}
	}

	/**
	 * Called by ThreeCacheBackend to inspect and validate renderer capabilities
	 * required by the selected scalar array layout.
	 * Missing WebGL2, float rendering, highp precision or valid texture limits throws; select a capable
	 * renderer. Probe allocation/framebuffer/cleanup failures propagate; discard backend construction.
	 *
	 * @param {ThreeCacheBackendResourceNamespace} THREE - Three namespace used by the renderer.
	 * @param {ThreeCacheBackendRendererOperations} renderer - Renderer accepted at the backend boundary.
	 * @returns {ThreeCacheBackendCapabilityInspection} - Validated context and cache capabilities.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_inspectCapabilities(THREE, renderer) {
		if (renderer.capabilities.isWebGL2 !== true) {
			throw new Error('ThreeCacheBackend requires WebGL2.');
		}

		const context = /** @type {WebGL2RenderingContext} */ (renderer.getContext());
		if (!context.getExtension('EXT_color_buffer_float')) {
			throw new Error('ThreeCacheBackend requires EXT_color_buffer_float for R32F rendering.');
		}

		const maximumTextureSize = context.getParameter(context.MAX_TEXTURE_SIZE);
		const maximumArrayLayers = context.getParameter(context.MAX_ARRAY_TEXTURE_LAYERS);
		const highFloat = context.getShaderPrecisionFormat(context.FRAGMENT_SHADER, context.HIGH_FLOAT);
		if (
			!Number.isInteger(maximumTextureSize) ||
			maximumTextureSize < 1 ||
			!Number.isInteger(maximumArrayLayers) ||
			maximumArrayLayers < 1
		) {
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
		const probeTarget = this._createScalarArrayTarget(THREE, 1, 1, 1);
		const record = {THREE, renderer, context};
		try {
			this._withRendererState(record, () => this._assertFramebufferComplete(record, probeTarget, 0));
		} finally {
			probeTarget.dispose();
		}

		return {context, capabilities};
	}

	/**
	 * Called by ThreeCacheBackend to require the active private state for one
	 * opaque backend handle.
	 * Missing or disposed private state throws; create a live backend instead of reusing this handle.
	 *
	 * @param {ThreeCacheBackend} backend - Opaque backend handle.
	 * @returns {ThreeCacheBackendRecord} - Active private backend state.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_requireBackendRecord(backend) {
		const record = BACKEND_RECORDS.get(backend);
		if (!record || record.disposed) {
			throw new Error('ThreeCacheBackend has been disposed.');
		}

		return record;
	}

	/**
	 * Called by ThreeCacheBackend to dispose one field handle and its private
	 * renderer resource exactly once.
	 *
	 * @param {GpuCacheField} field - Opaque field handle.
	 * @returns {void} - No value.
	 */
	_disposeField(field) {
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

	/** @param {CacheImmutableTexture} texture - Opaque immutable texture owner. */
	_disposeImmutableTexture(texture) {
		const record = IMMUTABLE_TEXTURE_RECORDS.get(texture);
		if (!record || record.disposed) return;
		record.disposed = true;
		try {
			if (record.target) record.target.dispose();
			else record.texture.dispose();
		} finally {
			record.backend.immutableTextures.delete(texture);
		}
	}

	/**
	 * Called by ThreeCacheBackend to dispose one program handle and every private
	 * resource it owns exactly once while retaining the first disposal error.
	 *
	 * @param {CacheGpuProgram} program - Opaque program handle.
	 * @returns {void} - No value.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_disposeProgram(program) {
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
	 * Called by ThreeCacheBackend to create an opaque disposable field handle for
	 * a privately recorded Three array target.
	 *
	 * @param {CacheFieldSpec} fieldSpecification - Field identity and executable storage layout.
	 * @param {string} backendId - Backend ownership identity.
	 * @returns {GpuCacheField} - Opaque disposable field handle.
	 */
	_createFieldHandle(fieldSpecification, backendId) {
		const owner = this;
		const field = /** @type {GpuCacheField} */ ({
			id: fieldSpecification.id,
			storage: fieldSpecification.storage,
			backendId,
			/** Call this method to dispose. */ dispose() {
				owner._disposeField(field);
			},
		});
		return field;
	}

	/**
	 * Called by ThreeCacheBackend to create an opaque disposable program handle
	 * for privately recorded pass resources.
	 *
	 * @param {string} id - Program identity.
	 * @param {string} sourceHash - Shader-source identity.
	 * @returns {CacheGpuProgram} - Opaque disposable program handle.
	 */
	_createProgramHandle(id, sourceHash) {
		const owner = this;
		const program = /** @type {CacheGpuProgram} */ ({
			id,
			sourceHash,
			/** Call this method to dispose. */ dispose() {
				owner._disposeProgram(program);
			},
		});
		return program;
	}

	/**
	 * Called by ThreeCacheBackend to create an opaque runtime-binding identity for
	 * a private WeakMap field association.
	 *
	 * @param {string} id - Runtime-binding identity.
	 * @param {CacheRuntimeValueKey} valueKey - Shader value populated by the binding.
	 * @param {CacheFieldId} fieldId - Associated field identity.
	 * @param {string} backendId - Backend ownership identity.
	 * @returns {CacheRuntimeBinding} - Opaque runtime binding.
	 */
	_createRuntimeBindingHandle(id, valueKey, fieldId, backendId) {
		return {
			id,
			valueKey,
			fieldId,
			backendId,
		};
	}

	/**
	 * @param {CacheImmutableTextureUploadRequest} request - Accepted immutable texture request.
	 * @param {CacheRuntimeBinding} runtimeBinding - Opaque binding associated with the texture.
	 * @param {string} backendId - Backend ownership identity.
	 * @returns {CacheImmutableTexture} - Opaque immutable texture owner.
	 */
	_createImmutableTextureHandle(request, runtimeBinding, backendId) {
		const owner = this;
		const handle = /** @type {CacheImmutableTexture} */ ({
			id: request.id,
			storage: request.storage,
			backendId,
			runtimeBinding,
			dispose() {
				owner._disposeImmutableTexture(handle);
			},
		});
		return handle;
	}

	/**
	 * Called by ThreeCacheBackend to require the active field associated with one
	 * opaque runtime binding owned by the supplied backend.
	 * Foreign/nonfield bindings throw TypeError and disposed fields throw Error; use a live field binding from this backend.
	 *
	 * @param {CacheRuntimeBinding} binding - Opaque runtime-binding handle.
	 * @param {ThreeCacheBackendRecord} backend - Required backend ownership state.
	 * @returns {ThreeCacheBackendFieldRecord} - Active private field state.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_requireRuntimeBindingField(binding, backend) {
		const bindingRecord = RUNTIME_BINDING_RECORDS.get(binding);
		if (!bindingRecord || bindingRecord.backend !== backend) {
			throw new TypeError('Runtime cache binding must be an opaque binding owned by this backend.');
		}
		if (!bindingRecord.field) {
			throw new TypeError('Runtime cache binding does not represent a render field.');
		}

		return this._requireFieldRecord(bindingRecord.field, backend, 'Runtime cache binding field');
	}

	/** Resolve a live field, persistent-array or immutable texture binding.
	 * Foreign or missing texture ownership throws TypeError; disposed resources throw Error.
	 * Acquire a live binding from this backend before attempting installation or readback.
	 * @param {CacheRuntimeBinding} binding - Opaque runtime binding.
	 * @param {ThreeCacheBackendRecord} backend - Required backend owner.
	 * @returns {ThreeCacheBackendTexture} - Active private texture.
	 */
	_requireRuntimeBindingTexture(binding, backend) {
		const bindingRecord = RUNTIME_BINDING_RECORDS.get(binding);
		if (!bindingRecord || bindingRecord.backend !== backend) {
			throw new TypeError('Runtime cache binding must be an opaque binding owned by this backend.');
		}
		if (bindingRecord.field) {
			return this._requireFieldRecord(bindingRecord.field, backend, 'Runtime cache binding field').target.texture;
		}
		if (bindingRecord.persistentArray)
			return this._requirePersistentArray(bindingRecord.persistentArray, backend).resolveTexture();
		const immutable = bindingRecord.immutableTexture;
		const record = immutable ? IMMUTABLE_TEXTURE_RECORDS.get(immutable) : null;
		if (!record || record.backend !== backend) {
			throw new TypeError('Runtime cache binding has no backend-owned texture.');
		}
		if (record.disposed) throw new Error('Runtime cache immutable texture has been disposed.');
		return record.texture;
	}

	/**
	 * Called to validate opaque persistent-array ownership before accessing renderer storage.
	 * Missing or foreign handles throw TypeError; obtain a live array from this backend.
	 *
	 * @param {CachePersistentArray} array - Candidate handle.
	 * @param {ThreeCacheBackendRecord} backend - Required renderer owner.
	 * @returns {ThreeCachePersistentArrayOwner} - Private live array owner.
	 */
	_requirePersistentArray(array, backend) {
		const owner = backend.persistentArrays.get(array);
		if (!owner) throw new TypeError('Persistent array must be a live opaque handle owned by this backend.');
		return owner;
	}

	/**
	 * Called by ThreeCacheBackend to require one active opaque field owned by the
	 * supplied backend.
	 * Foreign handles throw TypeError and disposed fields throw Error; use a live backend-owned field.
	 *
	 * @param {GpuCacheField} value - Opaque field handle.
	 * @param {ThreeCacheBackendRecord} backend - Required backend ownership state.
	 * @param {string} label - Diagnostic label for an invalid handle.
	 * @returns {ThreeCacheBackendFieldRecord} - Active private field state.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_requireFieldRecord(value, backend, label) {
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
	 * Called by ThreeCacheBackend to require one active opaque program owned by
	 * the supplied backend.
	 * Foreign handles throw TypeError and disposed programs throw Error; compile a live backend-owned program.
	 *
	 * @param {CacheGpuProgram} value - Opaque program handle.
	 * @param {ThreeCacheBackendRecord} backend - Required backend ownership state.
	 * @returns {ThreeCacheBackendProgramRecord} - Active private program state.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_requireProgramRecord(value, backend) {
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
	 * Called by ThreeCacheBackend to resolve a supported unit value to its
	 * canonical GPU scalar.
	 * Unsupported units throw RangeError; convert the value to a supported physical unit before submission.
	 *
	 * @param {UnitValue} value - Unit-bearing scalar value.
	 * @param {string} label - Diagnostic label for unsupported units.
	 * @returns {number} - Canonical scalar value.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_canonicalUnitScalar(value, label) {
		const scale = THREE_CACHE_CANONICAL_UNIT_SCALE[value.units];
		if (scale === undefined) {
			throw new RangeError(`${label} units are not supported by the GPU boundary.`);
		}

		return value.value * scale;
	}

	/**
	 * Called by ThreeCacheBackend to determine whether one typed binding carries
	 * packed data for texture construction.
	 *
	 * @param {CacheBinding} binding - Typed shader binding.
	 * @returns {binding is CacheDataBinding} - Whether the binding carries packed data.
	 */
	_isDataBinding(binding) {
		return binding.spec.kind === 'data';
	}

	/**
	 * Called by ThreeCacheBackend to determine whether one typed binding carries
	 * a uniform value for normalization.
	 *
	 * @param {CacheBinding} binding - Typed shader binding.
	 * @returns {binding is CacheUniformBinding} - Whether the binding carries a uniform value.
	 */
	_isUniformBinding(binding) {
		return binding.spec.kind === 'uniform';
	}

	/**
	 * Called by ThreeCacheBackend to resolve one typed binding value to its Three
	 * uniform representation. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {ThreeCacheBackendResourceNamespace} THREE - Three namespace used for vector construction.
	 * @param {CacheUniformBinding} binding - Typed uniform binding.
	 * @returns {unknown} - Three uniform value.
	 */
	_uniformValue(THREE, binding) {
		const value = binding.value;
		if (binding.spec.shaderType === 'bool' || binding.spec.shaderType === 'int') {
			return value;
		}
		if (binding.spec.shaderType === 'vec3') {
			if (Array.isArray(value)) {
				return new THREE.Vector3(value[0], value[1], value[2]);
			}
			const position = /** @type {Position} */ (value);
			const scale = this._canonicalUnitScalar(
				{value: 1, units: position.units},
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
		return this._canonicalUnitScalar(/** @type {UnitValue} */ (value), `Cache shader uniform ${binding.spec.name}`);
	}

	/**
	 * Called by ThreeCacheBackend to allocate and configure one privately owned
	 * scalar texture for a packed data binding.
	 *
	 * @param {ThreeCacheBackendResourceNamespace} THREE - Three namespace used for allocation.
	 * @param {CacheData} data - Normalized packed scalar values and shape.
	 * @returns {ThreeCacheBackendDataTexture} - Configured data texture.
	 */
	_createDataTexture(THREE, data) {
		const values = new Float32Array(data.values);
		const width = data.shape[0];
		const height = data.shape[1] ?? 1;
		const texture =
			data.shape.length === 3
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
	 * Called by ThreeCacheBackend to configure material uniforms and collect the
	 * private data textures whose lifecycle the compiled program owns. Any
	 * partially constructed textures are disposed before an error is rethrown.
	 * Unsupported binding units, texture allocation or renderer-resource creation failures propagate;
	 * correct the binding or report the allocation failure and discard the incomplete program.
	 *
	 * @param {ThreeCacheBackendResourceNamespace} THREE - Three namespace used for resource construction.
	 * @param {readonly CacheBinding[]} bindings - Typed shader bindings.
	 * @returns {ThreeCacheBackendMaterialBindings} - Uniform map and owned data textures.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_createMaterialBindings(THREE, bindings) {
		/** @type {Record<string, {value: unknown}>} */
		const uniforms = {
			[CACHE_WAVELENGTH_LAYER_BINDING_NAME]: {value: 0},
		};
		/** @type {ThreeCacheBackendDataTexture[]} */
		const dataResources = [];

		try {
			bindings.forEach((binding) => {
				if (this._isDataBinding(binding)) {
					const texture = this._createDataTexture(THREE, binding.value);
					dataResources.push(texture);
					uniforms[binding.spec.name] = {value: texture};
					return;
				}
				if (this._isUniformBinding(binding)) {
					uniforms[binding.spec.name] = {
						value: this._uniformValue(THREE, binding),
					};
				}
			});
		} catch (error) {
			for (const resource of dataResources) {
				resource.dispose();
			}
			throw error;
		}

		return {uniforms, dataResources};
	}

	/**
	 * Called by ThreeCacheBackend to allocate the private fullscreen-pass resource
	 * cohort for one cache shader. Every successfully allocated resource is
	 * disposed before a construction error is rethrown.
	 * Binding conversion or GPU resource construction failures propagate after attempted cleanup;
	 * discard the incomplete program and report any allocation or cleanup failure.
	 *
	 * @param {ThreeCacheBackendRecord} backend - Accepted private backend state.
	 * @param {CacheShader} shader - Assembled cache shader.
	 * @returns {ThreeCacheBackendProgramResources} - Private program resources.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_createProgramResources(backend, shader) {
		const bindingData = this._createMaterialBindings(backend.THREE, shader.bindings);
		/** @type {ThreeCacheBackendBufferGeometry | null} */
		let geometry = null;
		/** @type {ThreeCacheBackendRawShaderMaterial | null} */
		let material = null;
		try {
			geometry = new backend.THREE.BufferGeometry();
			geometry.setAttribute(
				'position',
				new backend.THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
			);
			material = new backend.THREE.RawShaderMaterial({
				glslVersion: backend.THREE.GLSL3,
				vertexShader: THREE_CACHE_FULLSCREEN_VERTEX_SHADER,
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
	 * Called by ThreeCacheBackend to apply submission-time uniforms and opaque
	 * input fields to one private program.
	 *
	 * @param {ThreeCacheBackendRecord} backend - Accepted private backend state.
	 * @param {ThreeCacheBackendProgramRecord} program - Active private program state.
	 * @param {CacheLayerSubmission} request - Accepted layer submission.
	 * @param {number} layer - Accepted wavelength layer.
	 * @returns {void} - No value.
	 */
	_applySubmissionBindings(backend, program, request, layer) {
		program.material.uniforms[CACHE_WAVELENGTH_LAYER_BINDING_NAME].value = layer;
		for (const input of request.inputs) {
			const inputRecord = this._requireFieldRecord(input.field, backend, `Cache input ${input.id}`);
			this._boundedIndex(layer, inputRecord.storage.layers - 1, `Cache input ${input.id} wavelength layer`);
			const name = CacheBuildModules.fieldInputBindingName(input.id);
			const uniform = program.material.uniforms[name];
			if (uniform) {
				uniform.value = inputRecord.target.texture;
			} else {
				program.material.uniforms[name] = {value: inputRecord.target.texture};
			}
		}

		for (const binding of request.bindings) {
			if (!this._isUniformBinding(binding) || binding.spec.frequency !== 'layer') {
				continue;
			}
			program.material.uniforms[binding.spec.name].value = this._uniformValue(backend.THREE, binding);
		}
	}

	/**
	 * Called by ThreeCacheBackend to accept one selected scalar coordinate at the
	 * readback API boundary.
	 *
	 * @param {DirectionalSpectralFieldCoordinates} value - Candidate field coordinate.
	 * @param {CacheFieldStorage} storage - Executable field bounds.
	 * @param {number} index - Coordinate index in the probe request.
	 * @returns {DirectionalSpectralFieldCoordinates} - Accepted field coordinate.
	 */
	_acceptProbeCoordinate(value, storage, index) {
		return {
			directionIndex: this._boundedIndex(
				value.directionIndex,
				storage.width - 1,
				`Cache probe coordinate[${index}] directionIndex`,
			),
			positionIndex: this._boundedIndex(
				value.positionIndex,
				storage.height - 1,
				`Cache probe coordinate[${index}] positionIndex`,
			),
			wavelengthIndex: this._boundedIndex(
				value.wavelengthIndex,
				storage.layers - 1,
				`Cache probe coordinate[${index}] wavelengthIndex`,
			),
		};
	}

	/** Unpack a completed spectral texture at the diagnostic boundary only.
	 * Readback/context/framebuffer failures throw; callers discard incomplete observations.
	 * Production packing and lookup never invoke this CPU readback.
	 *
	 * @param {ThreeCacheBackendRecord} backend - Owning live renderer.
	 * @param {ThreeCacheBackendImmutableTextureRecord} packed - Validated packed texture record.
	 * @returns {CacheScalarFieldReadback} - Logical wavelength-major scalar values.
	 */
	_readPackedRuntimeField(backend, packed) {
		const storage = packed.scalarStorage;
		if (!storage || !packed.target) throw new TypeError('Packed diagnostic source is unavailable.');
		const {width, height, layers} = storage,
			count = width * height;
		const values = new Float32Array(count * layers),
			groupValues = new Float32Array(count * 4);
		this._withRendererState(
			backend,
			/** Read and unpack every group while restoring the caller's render target.
			 * @returns {void} - Logical diagnostic values have been populated.
			 */ () => {
				for (let group = 0; group < Math.ceil(layers / 4); group++) {
					this._assertFramebufferComplete(backend, packed.target, group);
					backend.context.readBuffer(backend.context.COLOR_ATTACHMENT0);
					backend.context.readPixels(
						0,
						0,
						width,
						height,
						backend.context.RGBA,
						backend.context.FLOAT,
						groupValues,
					);
					if (backend.context.getError() !== backend.context.NO_ERROR)
						throw new Error('Packed spectral diagnostic readback failed.');
					for (let component = 0; component < 4 && group * 4 + component < layers; component++)
						for (let index = 0; index < count; index++)
							values[(group * 4 + component) * count + index] = groupValues[index * 4 + component];
				}
			},
		);
		return {storage, values};
	}

	/**
	 * Creates a Three/WebGL2 cache backend after validating the renderer's
	 * scalar-array capabilities and framebuffer support.
	 *
	 * @param {ThreeCacheBackendRequest} request - Three namespace and renderer adapted by the backend.
	 * @throws {Error} - When the renderer lacks a required WebGL2 cache capability.
	 */
	constructor(request) {
		const THREE = /** @type {ThreeCacheBackendResourceNamespace} */ (request.THREE);
		const renderer = /** @type {ThreeCacheBackendRendererOperations} */ (request.renderer);
		const inspected = this._inspectCapabilities(THREE, renderer);
		backendSequence += 1;
		this.id = `algorithm32-three-cache-backend-${backendSequence}`;
		this.capabilities = inspected.capabilities;
		BACKEND_RECORDS.set(this, {
			THREE,
			renderer,
			context: inspected.context,
			fields: new Set(),
			programs: new Set(),
			immutableTextures: new Set(),
			persistentArrays: new Map(),
			runtimeBindingSequence: 0,
			disposed: false,
		});
	}

	/**
	 * Call this method to allocate one opaque scalar-array cache field owned by
	 * this backend.
	 *
	 * @param {CacheFieldSpec} fieldSpecification - Field identity and executable storage layout.
	 * @returns {GpuCacheField} - Opaque disposable cache field.
	 * @throws {Error} - When the backend is disposed or the requested field exceeds renderer capabilities.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	allocateField(fieldSpecification) {
		const backend = this._requireBackendRecord(this);
		const {storage} = fieldSpecification;
		if (
			storage.width > this.capabilities.maximumTextureSize ||
			storage.height > this.capabilities.maximumTextureSize ||
			storage.layers > this.capabilities.maximumArrayLayers
		) {
			throw new RangeError("GPU cache field exceeds this backend's texture capabilities.");
		}

		const target = this._createScalarArrayTarget(backend.THREE, storage.width, storage.height, storage.layers);
		const field = this._createFieldHandle(fieldSpecification, this.id);
		const record = {
			backend,
			id: fieldSpecification.id,
			storage,
			target,
			disposed: false,
		};
		FIELD_RECORDS.set(field, record);
		backend.fields.add(field);
		return field;
	}

	/** Pack a completed scalar field into four-float groups without a CPU readback.
	 * Source ownership stays with the caller. Invalid ownership, unavailable context,
	 * allocation, framebuffer, compile or copy failure throws after candidate cleanup;
	 * callers must keep the previous published cache and discard this conversion.
	 *
	 * @param {CacheRuntimeFieldPackingRequest} request - Borrowed source and destination identity.
	 * @returns {CacheImmutableTexture} - Complete immutable packed array with zero padding.
	 */
	packRuntimeField(request) {
		const backend = this._requireBackendRecord(this);
		const source = this._requireFieldRecord(request.source, backend, 'Spectral packing source');
		const {width, height, layers} = source.storage;
		if (!request.id || source.storage.format !== 'R32F' || backend.context.isContextLost())
			throw new Error('Spectral packing requires an identified live scalar source.');
		const storage = {format: /** @type {const} */ ('RGBA32F'), width, height, layers: Math.ceil(layers / 4)};
		const target = new backend.THREE.WebGLArrayRenderTarget(width, height, storage.layers, {
			format: backend.THREE.RGBAFormat,
			type: backend.THREE.FloatType,
			internalFormat: 'RGBA32F',
			minFilter: backend.THREE.NearestFilter,
			magFilter: backend.THREE.NearestFilter,
			wrapS: backend.THREE.ClampToEdgeWrapping,
			wrapT: backend.THREE.ClampToEdgeWrapping,
			generateMipmaps: false,
			depthBuffer: false,
			stencilBuffer: false,
		});
		let program;
		try {
			program = this._createProgramResources(backend, {
				id: request.id,
				sourceHash: request.id,
				bindings: [],
				output: request.source,
				source: `precision highp float; precision highp int; precision highp sampler2DArray;
uniform sampler2DArray packingSource; uniform int packingGroup;
out vec4 packingOutput;
void main() {
 ivec2 point=ivec2(gl_FragCoord.xy); vec4 value=vec4(0.0);
 for(int component=0;component<4;++component) {
  int channel=packingGroup*4+component;
  if(channel<${layers}) value[component]=texelFetch(packingSource,ivec3(point,channel),0).r;
 }
 packingOutput=value;
}`,
			});
			program.material.uniforms.packingSource = {value: source.target.texture};
			program.material.uniforms.packingGroup = {value: 0};
			this._withRendererState(
				backend,
				/** Convert all spectral groups while preserving the caller's renderer state.
				 * @returns {void} - The candidate target contains every packed group.
				 */ () => {
					for (let group = 0; group < storage.layers; group++) {
						this._assertFramebufferComplete(backend, target, group);
						backend.renderer.setViewport(0, 0, width, height);
						backend.renderer.setScissorTest(false);
						program.material.uniforms.packingGroup.value = group;
						backend.renderer.render(program.scene, program.camera);
						if (backend.context.getError() !== backend.context.NO_ERROR)
							throw new Error('Spectral GPU packing failed.');
					}
				},
			);
			if (backend.context.isContextLost()) throw new Error('Context lost during spectral packing.');
			const cleanupErrors = [];
			try {
				program.geometry.dispose();
			} catch (error) {
				cleanupErrors.push(error);
			}
			try {
				program.material.dispose();
			} catch (error) {
				cleanupErrors.push(error);
			}
			program = null;
			if (cleanupErrors.length)
				throw new AggregateError(cleanupErrors, 'Spectral packing scratch cleanup failed.');
			backend.runtimeBindingSequence++;
			const binding = this._createRuntimeBindingHandle(
				`${this.id}:packed:${backend.runtimeBindingSequence}:${request.id}`,
				request.valueKey,
				request.id,
				this.id,
			);
			const handle = this._createImmutableTextureHandle(
				{...request, storage, values: new Float32Array(0)},
				binding,
				this.id,
			);
			IMMUTABLE_TEXTURE_RECORDS.set(handle, {
				backend,
				texture: target.texture,
				target,
				scalarStorage: source.storage,
				disposed: false,
			});
			RUNTIME_BINDING_RECORDS.set(binding, {backend, immutableTexture: handle});
			backend.immutableTextures.add(handle);
			return handle;
		} catch (error) {
			const errors = [error];
			try {
				target.dispose();
			} catch (cleanupError) {
				errors.push(cleanupError);
			}
			try {
				program?.geometry.dispose();
			} catch (cleanupError) {
				errors.push(cleanupError);
			}
			try {
				program?.material.dispose();
			} catch (cleanupError) {
				errors.push(cleanupError);
			}
			if (errors.length > 1) throw new AggregateError(errors, 'Spectral packing and candidate cleanup failed.');
			throw error;
		}
	}

	/**
	 * Call this method to allocate and compile one opaque cache program while
	 * preserving caller-owned renderer state. The promise rejects after partial
	 * resources are disposed when allocation or renderer compilation fails. The operation is not cancellable once compilation starts, and callers must discard a rejected program.
	 *
	 * @param {CacheShader} shader - Assembled cache fragment shader.
	 * @returns {Promise<CacheGpuProgram>} - Opaque disposable compiled program.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	async compile(shader) {
		const backend = this._requireBackendRecord(this);
		const resources = this._createProgramResources(backend, shader);
		const program = this._createProgramHandle(shader.id, shader.sourceHash);
		const record = {
			backend,
			...resources,
			output: shader.output,
			disposed: false,
		};
		PROGRAM_RECORDS.set(program, record);
		backend.programs.add(program);

		try {
			await this._withRendererState(backend, () =>
				typeof backend.renderer.compileAsync === 'function'
					? backend.renderer.compileAsync(record.scene, record.camera)
					: backend.renderer.compile(record.scene, record.camera),
			);
		} catch (error) {
			program.dispose();
			throw error;
		}

		return program;
	}

	/**
	 * Call this method to submit one cache wavelength layer while restoring every
	 * caller-owned renderer state value before returning or throwing.
	 *
	 * @param {CacheLayerSubmission} request - Program, fields, bindings, and layer for one submission.
	 * @returns {void} - No value.
	 * @throws {Error} - When a handle, layer, framebuffer, binding, or renderer operation is invalid.
	 */
	submitLayer(request) {
		const backend = this._requireBackendRecord(this);
		const program = this._requireProgramRecord(request.program, backend);
		const output = this._requireFieldRecord(request.output, backend, 'Cache layer output');
		const layer = this._boundedIndex(request.layer, output.storage.layers - 1, 'Cache output wavelength layer');
		this._applySubmissionBindings(backend, program, request, layer);

		this._withRendererState(
			backend,
			/** Called by the surrounding operation to handle one callback invocation. */ () => {
				this._assertFramebufferComplete(backend, output.target, layer);
				backend.renderer.setViewport(0, 0, output.storage.width, output.storage.height);
				backend.renderer.setScissor(0, 0, output.storage.width, output.storage.height);
				backend.renderer.setScissorTest(false);
				backend.renderer.render(program.scene, program.camera);
				let error = backend.context.getError?.();
				if (error !== undefined && error !== 0)
					throw new Error('Cache GPU submission failed with WebGL error ' + error + '.');
			},
		);
	}

	/**
	 * Call this method to create one opaque runtime binding for a resident field
	 * owned by this backend.
	 *
	 * @param {CacheRuntimeBindingRequest} request - Resident field and caller-selected shader value.
	 * @returns {CacheRuntimeBinding} - Opaque runtime binding.
	 * @throws {Error} - When the backend or field is disposed, foreign, or invalid.
	 */
	createRuntimeBinding(request) {
		const backend = this._requireBackendRecord(this);
		const fieldRecord = this._requireFieldRecord(request.field, backend, 'Runtime cache field');
		backend.runtimeBindingSequence += 1;
		const binding = this._createRuntimeBindingHandle(
			`${this.id}:binding:${backend.runtimeBindingSequence}:${fieldRecord.id}`,
			request.valueKey,
			fieldRecord.id,
			this.id,
		);
		RUNTIME_BINDING_RECORDS.set(binding, {backend, field: request.field});
		return binding;
	}

	/**
	 * Call this method to validate and eagerly upload one immutable R32F, RGBA32F, or R16UI texture.
	 * Invalid identity, dimensions, format, payload or filtering throws; correct the request before retrying.
	 * Disposed backends, unavailable upload/float-filter capabilities and allocation/upload errors throw;
	 * retain prior textures and report the backend failure. Failed candidate upload attempts texture cleanup.
	 *
	 * @param {CacheImmutableTextureUploadRequest} request - Exact typed payload and executable shape.
	 * @returns {CacheImmutableTexture} - Opaque uploaded texture owner.
	 */
	uploadImmutableTexture(request) {
		const backend = this._requireBackendRecord(this);
		const {storage} = request;
		if (
			!request.id ||
			!Number.isInteger(storage.width) ||
			!Number.isInteger(storage.height) ||
			!Number.isInteger(storage.layers)
		) {
			throw new TypeError('Immutable cache texture requires an identity and integer dimensions.');
		}
		if (
			storage.width < 1 ||
			storage.height < 1 ||
			storage.layers < 1 ||
			storage.width > this.capabilities.maximumTextureSize ||
			storage.height > this.capabilities.maximumTextureSize ||
			storage.layers > this.capabilities.maximumArrayLayers
		) {
			throw new RangeError("Immutable cache texture exceeds this backend's texture capabilities.");
		}
		const componentCount =
			storage.format === 'RGBA32F' || storage.format === 'RGBA32I' ? 4 : storage.format === 'RG16UI' ? 2 : 1;
		const scalarCount = storage.width * storage.height * storage.layers * componentCount;
		const isFloat =
			(storage.format === 'R32F' || storage.format === 'RGBA32F') && request.values instanceof Float32Array;
		const isUnsignedInteger =
			(storage.format === 'R16UI' || storage.format === 'RG16UI') &&
			storage.layers === 1 &&
			request.values instanceof Uint16Array;
		const isSignedInteger =
			storage.format === 'RGBA32I' && storage.layers === 1 && request.values instanceof Int32Array;
		if ((!isFloat && !isUnsignedInteger && !isSignedInteger) || request.values.length !== scalarCount) {
			throw new TypeError('Immutable cache texture payload type or scalar count is incompatible.');
		}
		if (typeof backend.renderer.initTexture !== 'function') {
			throw new Error('ThreeCacheBackend renderer cannot eagerly upload immutable textures.');
		}
		if (request.filtering !== undefined && request.filtering !== 'nearest')
			throw new RangeError('Immutable texture filtering is unsupported.');
		if (
			storage.format === 'RGBA32F' &&
			request.filtering !== 'nearest' &&
			!backend.context.getExtension('OES_texture_float_linear')
		) {
			throw new Error('ThreeCacheBackend requires OES_texture_float_linear for RGBA32F scene caches.');
		}

		const texture =
			storage.layers > 1
				? new backend.THREE.DataArrayTexture(request.values, storage.width, storage.height, storage.layers)
				: new backend.THREE.DataTexture(request.values, storage.width, storage.height);
		texture.format =
			storage.format === 'RGBA32F'
				? backend.THREE.RGBAFormat
				: isFloat
					? backend.THREE.RedFormat
					: storage.format === 'RG16UI'
						? backend.THREE.RGIntegerFormat
						: isSignedInteger
							? backend.THREE.RGBAIntegerFormat
							: backend.THREE.RedIntegerFormat;
		texture.type = isFloat
			? backend.THREE.FloatType
			: isSignedInteger
				? backend.THREE.IntType
				: backend.THREE.UnsignedShortType;
		texture.internalFormat = storage.format;
		texture.minFilter =
			storage.format === 'RGBA32F' && request.filtering !== 'nearest'
				? backend.THREE.LinearFilter
				: backend.THREE.NearestFilter;
		texture.magFilter = texture.minFilter;
		texture.wrapS = backend.THREE.ClampToEdgeWrapping;
		texture.wrapT = backend.THREE.ClampToEdgeWrapping;
		texture.generateMipmaps = false;
		texture.unpackAlignment = 1;
		texture.needsUpdate = true;

		try {
			backend.renderer.initTexture(texture);
		} catch (error) {
			texture.dispose();
			throw error;
		}

		backend.runtimeBindingSequence += 1;
		const binding = this._createRuntimeBindingHandle(
			`${this.id}:binding:${backend.runtimeBindingSequence}:${request.id}`,
			request.valueKey,
			request.id,
			this.id,
		);
		const handle = this._createImmutableTextureHandle(request, binding, this.id);
		IMMUTABLE_TEXTURE_RECORDS.set(handle, {backend, texture, disposed: false});
		RUNTIME_BINDING_RECORDS.set(binding, {backend, immutableTexture: handle});
		backend.immutableTextures.add(handle);
		return handle;
	}

	/**
	 * Call this method to allocate a persistent RGBA32F array with a stable opaque runtime binding.
	 * Capability, budget, and allocation failures throw before a handle becomes visible.
	 *
	 * @param {CachePersistentArrayRequest} request - Immutable dimensions, identity, and declared payload budget.
	 * @returns {CachePersistentArray} - Opaque array owner.
	 */
	allocatePersistentArray(request) {
		const backend = this._requireBackendRecord(this);
		const owner = new ThreeCachePersistentArray({
			backend,
			request,
			preserve: {
				/** Execute an array operation while preserving renderer state; operation errors propagate to its caller.
				 * @template T
				 * @param {() => T} operation - Owned texture operation.
				 * @returns {T} - Operation result after renderer state restoration.
				 */ run: (operation) => this._withRendererState(backend, operation),
			},
		});
		backend.runtimeBindingSequence += 1;
		const binding = this._createRuntimeBindingHandle(
			`${this.id}:array:${backend.runtimeBindingSequence}:${request.id}`,
			request.valueKey,
			request.id,
			this.id,
		);
		const storage = {...request.storage};
		const handle = {
			id: request.id,
			storage,
			backendId: this.id,
			runtimeBinding: binding,
			byteLength: storage.width * storage.height * storage.layers * 16,
			/** Release the private array and detach its context listeners once. */
			dispose: () => {
				owner.dispose();
				backend.persistentArrays.delete(handle);
			},
		};
		backend.persistentArrays.set(handle, owner);
		RUNTIME_BINDING_RECORDS.set(binding, {backend, persistentArray: handle});
		return handle;
	}

	/**
	 * Call this method to upload a complete authenticated layer without replacing its stable binding.
	 * Foreign handles, protected layers, invalid data, or failed uploads throw without publishing a layer identity.
	 *
	 * @param {CachePersistentArrayUpload} request - Array, unprotected layer, identity, and exact values.
	 * @returns {void}
	 */
	uploadPersistentArrayLayer(request) {
		this._requirePersistentArray(request.array, this._requireBackendRecord(this)).upload(
			request.layer,
			request.identity,
			request.values,
		);
	}

	/**
	 * Call this method to atomically protect a complete published-layer set from replacement.
	 *
	 * @param {CachePersistentArray} array - Opaque array owner.
	 * @param {readonly number[]} layers - Complete uploaded layer set.
	 * @returns {void}
	 */
	protectPersistentArrayLayers(array, layers) {
		this._requirePersistentArray(array, this._requireBackendRecord(this)).protect(layers);
	}

	/**
	 * Call this method to inspect context generation, uploaded identities, and protected layers.
	 *
	 * @param {CachePersistentArray} array - Opaque array owner.
	 * @returns {CachePersistentArrayState} - Current array state.
	 */
	getPersistentArrayState(array) {
		return this._requirePersistentArray(array, this._requireBackendRecord(this)).state();
	}

	/**
	 * Call this method to read at most 256 exact RGBA texels from an owned uploaded texture.
	 * Invalid coordinates, foreign handles, lost contexts, or failed readback throw. GPU objects remain private.
	 *
	 * @param {CacheImmutableTexture | CachePersistentArray} texture - Opaque texture owner.
	 * @param {readonly CacheTextureTexel[]} coordinates - Bounded selected texel coordinates.
	 * @returns {Float32Array | Int32Array | Uint32Array} - Four components per selected texel.
	 */
	readTextureTexels(texture, coordinates) {
		const backend = this._requireBackendRecord(this),
			context = backend.context;
		const persistent = backend.persistentArrays.get(/** @type {CachePersistentArray} */ (texture));
		const immutable = IMMUTABLE_TEXTURE_RECORDS.get(/** @type {CacheImmutableTexture} */ (texture));
		if (!persistent && (!immutable || immutable.backend !== backend || immutable.disposed))
			throw new TypeError('Texture probe requires a live backend-owned handle.');
		const resource = persistent ? persistent.resolveTexture() : immutable.texture;
		const {width, height, layers, format} = texture.storage;
		if (!Array.isArray(coordinates) || coordinates.length > 256 || context.isContextLost())
			throw new RangeError('Texture probe is oversized or its context is lost.');
		for (const coordinate of coordinates) {
			this._boundedIndex(coordinate.x, width - 1, 'Texture probe column');
			this._boundedIndex(coordinate.y, height - 1, 'Texture probe row');
			this._boundedIndex(coordinate.layer, layers - 1, 'Texture probe layer');
			if (persistent && !persistent.state().layerIdentities[coordinate.layer])
				throw new Error('Texture probe layer has not been uploaded.');
		}
		const integer = format === 'R16UI' || format === 'RG16UI' || format === 'RGBA32I';
		const values =
			format === 'RGBA32I'
				? new Int32Array(coordinates.length * 4)
				: integer
					? new Uint32Array(coordinates.length * 4)
					: new Float32Array(coordinates.length * 4);
		const gpuTexture = backend.renderer.properties.get(resource).__webglTexture;
		if (!gpuTexture) throw new Error('Texture probe has no GPU allocation.');
		const framebuffer = context.createFramebuffer();
		if (!framebuffer) throw new Error('Texture probe framebuffer allocation failed.');
		const readFramebuffer = context.getParameter(context.READ_FRAMEBUFFER_BINDING),
			drawFramebuffer = context.getParameter(context.DRAW_FRAMEBUFFER_BINDING);
		const readBuffer = context.getParameter(context.READ_BUFFER),
			packBuffer = context.getParameter(context.PIXEL_PACK_BUFFER_BINDING);
		const packKeys = [
			context.PACK_ALIGNMENT,
			context.PACK_ROW_LENGTH,
			context.PACK_SKIP_PIXELS,
			context.PACK_SKIP_ROWS,
		];
		const packValues = packKeys.map((key) => context.getParameter(key));
		try {
			if (context.getError() !== context.NO_ERROR)
				throw new Error('Texture probe requires a healthy WebGL context.');
			context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
			context.bindBuffer(context.PIXEL_PACK_BUFFER, null);
			packKeys.forEach((key, index) => context.pixelStorei(key, index === 0 ? 1 : 0));
			for (let index = 0; index < coordinates.length; index += 1) {
				const coordinate = coordinates[index];
				if (persistent || immutable?.target || layers > 1)
					context.framebufferTextureLayer(
						context.FRAMEBUFFER,
						context.COLOR_ATTACHMENT0,
						gpuTexture,
						0,
						coordinate.layer,
					);
				else
					context.framebufferTexture2D(
						context.FRAMEBUFFER,
						context.COLOR_ATTACHMENT0,
						context.TEXTURE_2D,
						gpuTexture,
						0,
					);
				if (context.checkFramebufferStatus(context.FRAMEBUFFER) !== context.FRAMEBUFFER_COMPLETE)
					throw new Error('Texture probe framebuffer is incomplete.');
				context.readBuffer(context.COLOR_ATTACHMENT0);
				context.readPixels(
					coordinate.x,
					coordinate.y,
					1,
					1,
					integer ? context.RGBA_INTEGER : context.RGBA,
					format === 'RGBA32I' ? context.INT : integer ? context.UNSIGNED_INT : context.FLOAT,
					values.subarray(index * 4, index * 4 + 4),
				);
				if (context.getError() !== context.NO_ERROR) throw new Error('Texture probe readback failed.');
			}
			return values;
		} finally {
			context.bindFramebuffer(context.DRAW_FRAMEBUFFER, drawFramebuffer);
			context.bindFramebuffer(context.READ_FRAMEBUFFER, readFramebuffer);
			context.readBuffer(readBuffer);
			context.bindBuffer(context.PIXEL_PACK_BUFFER, packBuffer);
			packKeys.forEach((key, index) => context.pixelStorei(key, packValues[index]));
			context.deleteFramebuffer(framebuffer);
		}
	}

	/**
	 * Call this method to resolve opaque cache handles inside the renderer adapter
	 * and install their private textures into already-created shader uniforms.
	 *
	 * @param {CacheRuntimeBindingInstallRequest} request - Runtime bindings and renderer uniforms.
	 * @returns {void} - No value.
	 * @throws {Error} - When a binding is foreign or disposed or its target uniform is unavailable.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	installRuntimeBindings(request) {
		const backend = this._requireBackendRecord(this);

		const assignments = request.bindings.bindings.map((binding) => {
			const texture = this._requireRuntimeBindingTexture(binding, backend);
			const uniform = request.uniforms[binding.valueKey];
			if (!uniform) {
				throw new TypeError(`Runtime cache uniform ${binding.valueKey} is unavailable.`);
			}

			return {uniform, texture};
		});
		for (const {uniform, texture} of assignments) uniform.value = texture;
	}

	/**
	 * Call this method to read one complete resident field through its opaque runtime binding.
	 * Scalar fields are read per wavelength; packed RGBA fields are unpacked into the same
	 * logical wavelength-major values. Readback preserves caller-owned renderer state.
	 * A disposed backend or foreign, disposed or incompatible binding rejects the promise;
	 * acquire a live binding from this backend before retrying. Allocation, framebuffer or
	 * WebGL readback failures reject without returning partial values; discard the diagnostic
	 * result and report the device failure. Readback cannot be cancelled once started.
	 *
	 * @param {CacheRuntimeBinding} binding - Resident field binding owned by this backend.
	 * @returns {Promise<CacheScalarFieldReadback>} - Layer-major scalar values.
	 */
	async readRuntimeBindingField(binding) {
		const backend = this._requireBackendRecord(this);
		const bindingRecord = RUNTIME_BINDING_RECORDS.get(binding);
		const packed = bindingRecord?.immutableTexture
			? IMMUTABLE_TEXTURE_RECORDS.get(bindingRecord.immutableTexture)
			: null;
		if (packed?.scalarStorage) {
			this._requireRuntimeBindingTexture(binding, backend);
			return this._readPackedRuntimeField(backend, packed);
		}
		const field = this._requireRuntimeBindingField(binding, backend);
		const {width, height, layers} = field.storage;
		const layerSize = width * height;
		const values = new Float32Array(layerSize * layers);

		this._withRendererState(
			backend,
			/** Called by complete-field readback to inspect every wavelength while preserving the caller's render state.
			 *
			 * @returns {void} - Owned destination filled with complete physical scalars.
			 */ () => {
				for (let layer = 0; layer < layers; layer += 1) {
					this._assertFramebufferComplete(backend, field.target, layer);
					backend.context.readBuffer(backend.context.COLOR_ATTACHMENT0);
					backend.context.readPixels(
						0,
						0,
						width,
						height,
						backend.context.RED,
						backend.context.FLOAT,
						values.subarray(layer * layerSize, (layer + 1) * layerSize),
					);
				}
			},
		);

		return {storage: field.storage, values};
	}

	/**
	 * Call this method to read selected field scalars while restoring caller-owned
	 * renderer state. The promise rejects when the request, framebuffer, or WebGL
	 * readback fails. The operation is not cancellable once readback starts, and callers must discard a rejected result.
	 *
	 * @param {CacheProbeRequest} request - Opaque field and selected scalar coordinates.
	 * @returns {Promise<CacheProbeResult>} - Selected field scalars.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	async readSelectedScalars(request) {
		const backend = this._requireBackendRecord(this);
		const field = this._requireFieldRecord(request.field, backend, 'Cache probe field');
		if (request.coordinates.length > MAXIMUM_THREE_CACHE_PROBE_SCALAR_COUNT) {
			throw new RangeError(
				`Cache probe requests are limited to ${MAXIMUM_THREE_CACHE_PROBE_SCALAR_COUNT} scalars.`,
			);
		}
		const coordinates = request.coordinates.map((coordinate, index) =>
			this._acceptProbeCoordinate(coordinate, field.storage, index),
		);

		const samples = this._withRendererState(
			backend,
			/** Called by selected readback to preserve render state across all accepted scalar queries.
			 *
			 * @returns {CacheProbeResult['samples']} - Physical scalar values at accepted coordinates.
			 */ () =>
				coordinates.map(
					/** Called by selected readback to inspect one accepted physical scalar.
					 *
					 * @param {DirectionalSpectralFieldCoordinates} coordinate - Validated field address.
					 * @returns {CacheProbeResult['samples'][number]} - Owned physical scalar and its address.
					 */ (coordinate) => {
						this._assertFramebufferComplete(backend, field.target, coordinate.wavelengthIndex);
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
						return {coordinates: coordinate, value: value[0]};
					},
				),
		);

		return {
			fieldId: field.id,
			samples,
		};
	}

	/**
	 * Call this method to dispose every field and program owned by this adapter.
	 * Cleanup continues after individual failures and the first failure is thrown
	 * after all owned resources have been attempted.
	 *
	 * @returns {void} - No value.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
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
		for (const texture of [...backend.immutableTextures]) {
			try {
				texture.dispose();
			} catch (error) {
				disposalError ??= error;
			}
		}
		for (const array of [...backend.persistentArrays.keys()]) {
			try {
				array.dispose();
			} catch (error) {
				disposalError ??= error;
			}
		}
		if (disposalError) {
			throw disposalError;
		}
	}
}
