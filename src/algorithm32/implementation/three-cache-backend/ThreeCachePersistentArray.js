/** Renderer-private RGBA32F array storage, protected layer uploads, and context restoration.
 *
 * @implements {ThreeCachePersistentArrayOwner}
 */
export default class ThreeCachePersistentArray {
	/** Renderer-owned dependencies and storage request.
	 *
	 * @type {ThreeCachePersistentArrayDefinition}
	 */
	_definition;
	/** Stable Three texture object retained across context generations.
	 *
	 * @type {ThreeCacheBackendTexture}
	 */
	_texture;
	/** Authenticated identity of each successfully uploaded layer.
	 *
	 * @type {(string | undefined)[]}
	 */
	_identities;
	/** Published layers protected against replacement.
	 *
	 * @type {Set<number>}
	 */
	_protected = new Set();
	/** Context generation advanced at each loss. */
	_generation = 0;
	/** Unavailable GPU storage state. */
	_unavailable = true;
	/** Terminal disposal state. */
	_disposed = false;
	/** Paired context-loss listener. */
	_onLost = (event) => {
		event.preventDefault();
		this._generation += 1;
		this._unavailable = true;
		this._identities.fill(undefined);
		this._protected.clear();
	};
	/** Paired context-restoration listener. */
	_onRestored = () => {
		try {
			this._initialize();
		} catch (error) {
			this._unavailable = true;
			console.warn('Persistent cache array restoration failed.', error);
		}
	};

	/** Called before GPU access to reject disposed or lost storage. @returns {void} */
	_requireLive() {
		if (this._disposed || this._unavailable || this._definition.backend.context.isContextLost())
			throw new Error('Persistent cache array storage is unavailable.');
	}

	/**
	 * Called to validate one array layer before accessing GPU storage.
	 *
	 * @param {number} layer - Candidate layer.
	 * @returns {void}
	 */
	_requireLayer(layer) {
		if (!Number.isInteger(layer) || layer < 0 || layer >= this._identities.length)
			throw new RangeError('Persistent cache array layer is out of range.');
	}

	/** Called to allocate GPU storage without allocating a full host atlas. @returns {void} */
	_initialize() {
		if (this._disposed) return;
		const {backend, preserve} = this._definition;
		preserve.run(() => {
			try {
				if (backend.context.isContextLost() || backend.context.getError() !== backend.context.NO_ERROR)
					throw new Error('Persistent array allocation requires a healthy WebGL context.');
				this._texture.needsUpdate = true;
				backend.renderer.initTexture(this._texture);
				if (
					!backend.renderer.properties.get(this._texture).__webglTexture ||
					backend.context.getError() !== backend.context.NO_ERROR ||
					backend.context.isContextLost()
				)
					throw new Error('Persistent cache array GPU allocation failed.');
				this._unavailable = false;
			} finally {
				backend.renderer.resetState();
			}
		});
	}

	/**
	 * Creates bounded RGBA32F storage after capability and memory-policy checks.
	 * Unsupported dimensions, format, filtering, memory budget, or GPU allocation throw without retaining resources.
	 *
	 * @param {ThreeCachePersistentArrayDefinition} definition - Renderer dependencies and allocation request.
	 */
	constructor(definition) {
		const {backend, request} = definition,
			{storage} = request,
			context = backend.context;
		const bytes = storage.width * storage.height * storage.layers * 16;
		if (
			!request.id ||
			storage.format !== 'RGBA32F' ||
			![storage.width, storage.height, storage.layers].every((value) => Number.isInteger(value) && value > 0) ||
			storage.width > context.getParameter(context.MAX_TEXTURE_SIZE) ||
			storage.height > context.getParameter(context.MAX_TEXTURE_SIZE) ||
			storage.layers > context.getParameter(context.MAX_ARRAY_TEXTURE_LAYERS) ||
			!Number.isSafeInteger(bytes) ||
			!Number.isSafeInteger(request.maximumBytes) ||
			request.maximumBytes < bytes ||
			!context.getExtension('OES_texture_float_linear')
		)
			throw new RangeError('Persistent array exceeds its format, device, or memory policy.');
		this._definition = {...definition, request: {...request, storage: {...storage}}};
		this._identities = new Array(storage.layers);
		const texture = new backend.THREE.DataArrayTexture(null, storage.width, storage.height, storage.layers);
		this._texture = texture;
		texture.source.dataReady = false;
		texture.format = backend.THREE.RGBAFormat;
		texture.type = backend.THREE.FloatType;
		texture.internalFormat = 'RGBA32F';
		texture.minFilter = backend.THREE.LinearFilter;
		texture.magFilter = backend.THREE.LinearFilter;
		texture.wrapS = backend.THREE.ClampToEdgeWrapping;
		texture.wrapT = backend.THREE.ClampToEdgeWrapping;
		texture.generateMipmaps = false;
		texture.unpackAlignment = 1;
		try {
			this._initialize();
		} catch (error) {
			texture.dispose();
			throw error;
		}
		context.canvas.addEventListener('webglcontextlost', this._onLost);
		context.canvas.addEventListener('webglcontextrestored', this._onRestored);
	}

	/** Call this method to resolve the live Three texture inside its renderer adapter. @returns {ThreeCacheBackendTexture} - Private texture. */
	resolveTexture() {
		this._requireLive();
		return this._texture;
	}

	/**
	 * Call this method to replace one complete unprotected layer. Failure clears that layer's identity;
	 * every protected published layer remains unchanged. Host packet bytes are not retained.
	 *
	 * @param {number} layer - Unprotected destination layer.
	 * @param {string} identity - Authenticated block and layout identity.
	 * @param {Float32Array} values - Complete x-fastest RGBA32F layer.
	 * @returns {void}
	 */
	upload(layer, identity, values) {
		this._requireLive();
		this._requireLayer(layer);
		const {backend, request} = this._definition,
			context = backend.context,
			{width, height} = request.storage;
		if (this._protected.has(layer)) throw new Error('Published persistent array layers cannot be overwritten.');
		if (
			typeof identity !== 'string' ||
			!identity ||
			!(values instanceof Float32Array) ||
			values.length !== width * height * 4
		)
			throw new TypeError('Persistent array layer identity or shape is invalid.');
		const texture = backend.renderer.properties.get(this._texture).__webglTexture;
		if (!texture) throw new Error('Persistent array has no GPU allocation.');
		const binding = context.getParameter(context.TEXTURE_BINDING_2D_ARRAY);
		const unpackBuffer = context.getParameter(context.PIXEL_UNPACK_BUFFER_BINDING);
		const unpackKeys = [
			context.UNPACK_ALIGNMENT,
			context.UNPACK_ROW_LENGTH,
			context.UNPACK_IMAGE_HEIGHT,
			context.UNPACK_SKIP_PIXELS,
			context.UNPACK_SKIP_ROWS,
			context.UNPACK_SKIP_IMAGES,
			context.UNPACK_FLIP_Y_WEBGL,
			context.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
		];
		const unpackValues = unpackKeys.map((key) => context.getParameter(key));
		try {
			if (context.getError() !== context.NO_ERROR)
				throw new Error('Persistent array upload requires a healthy WebGL context.');
			this._identities[layer] = undefined;
			context.bindBuffer(context.PIXEL_UNPACK_BUFFER, null);
			context.bindTexture(context.TEXTURE_2D_ARRAY, texture);
			unpackKeys.forEach((key, index) => context.pixelStorei(key, index === 0 ? 1 : 0));
			context.texSubImage3D(
				context.TEXTURE_2D_ARRAY,
				0,
				0,
				0,
				layer,
				width,
				height,
				1,
				context.RGBA,
				context.FLOAT,
				values,
			);
			if (context.getError() !== context.NO_ERROR || context.isContextLost())
				throw new Error('Persistent array layer upload failed.');
			this._identities[layer] = identity;
		} finally {
			context.bindTexture(context.TEXTURE_2D_ARRAY, binding);
			context.bindBuffer(context.PIXEL_UNPACK_BUFFER, unpackBuffer);
			unpackKeys.forEach((key, index) => context.pixelStorei(key, unpackValues[index]));
		}
	}

	/**
	 * Call this method to replace the published-layer protection set atomically after validation.
	 *
	 * @param {readonly number[]} layers - Complete new protected set.
	 * @returns {void}
	 */
	protect(layers) {
		this._requireLive();
		for (const layer of layers) {
			this._requireLayer(layer);
			if (!this._identities[layer]) throw new Error('Cannot publish an unpopulated persistent array layer.');
		}
		if (new Set(layers).size !== layers.length)
			throw new RangeError('Protected persistent array layers are duplicated.');
		this._protected = new Set(layers);
	}

	/** Call this method to inspect current upload and context facts without exposing GPU resources. @returns {CachePersistentArrayState} - Current state. */
	state() {
		return {
			generation: this._generation,
			unavailable: this._disposed || this._unavailable || this._definition.backend.context.isContextLost(),
			layerIdentities: [...this._identities],
			protectedLayers: [...this._protected],
		};
	}

	/** Call this method to remove paired listeners and dispose the GPU allocation exactly once. @returns {void} */
	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		const canvas = this._definition.backend.context.canvas;
		canvas.removeEventListener('webglcontextlost', this._onLost);
		canvas.removeEventListener('webglcontextrestored', this._onRestored);
		this._identities.fill(undefined);
		this._protected.clear();
		this._texture.dispose();
	}
}
