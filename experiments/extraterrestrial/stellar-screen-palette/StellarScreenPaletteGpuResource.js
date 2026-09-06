const CHANNEL_COUNT = 15;

function requireGl(gl) {
	if (!gl || typeof gl.texImage2D !== 'function') {
		throw new TypeError('A WebGL2 rendering context is required.');
	}
	return gl;
}

function requireNoGlError(gl, label) {
	const error = gl.getError();
	if (error !== gl.NO_ERROR) throw new Error(`${label} failed with WebGL error ${error}.`);
}

function configureNearestTexture(gl) {
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

function requireProduct(product) {
	if (!(product?.pixelIndex instanceof Uint16Array)) {
		throw new TypeError('GPU upload requires a Uint16 screen matrix.');
	}
	if (!(product?.palette instanceof Float32Array) || product.palette.length % CHANNEL_COUNT !== 0) {
		throw new TypeError('GPU upload requires an entry-major Float32 native-15 palette.');
	}
	const {width, height} = product.viewport ?? {};
	if (
		!Number.isSafeInteger(width)
		|| !Number.isSafeInteger(height)
		|| width < 1
		|| height < 1
		|| product.pixelIndex.length !== width * height
	) {
		throw new RangeError('GPU upload matrix dimensions do not match the viewport.');
	}
	return product;
}

/** Own the two WebGL2 textures for one complete CPU screen-palette product. */
export class StellarScreenPaletteGpuResource {
	constructor(gl, product, {injectFailureAfterMatrixUpload = false} = {}) {
		this.gl = requireGl(gl);
		this.product = requireProduct(product);
		this.matrixTexture = null;
		this.paletteTexture = null;
		this.readFramebuffer = null;
		this.terminal = false;
		this.terminalKind = null;
		this.deleteCallCount = 0;
		this.abandonedHandleCount = 0;
		try {
			this.#allocateMatrix();
			if (injectFailureAfterMatrixUpload) {
				throw new Error('injected screen-palette allocation failure');
			}
			this.#allocatePalette();
		} catch (error) {
			const cleanup = this.#deleteHandles();
			error.stagingCleanup = cleanup;
			this.terminal = true;
			this.terminalKind = 'failed-construction';
			throw error;
		}
	}

	get #maximumTextureSize() {
		return this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
	}

	#allocateMatrix() {
		const gl = this.gl;
		if (
			this.product.viewport.width > this.#maximumTextureSize
			|| this.product.viewport.height > this.#maximumTextureSize
		) {
			throw new RangeError('Screen matrix exceeds WebGL2 MAX_TEXTURE_SIZE.');
		}
		this.matrixTexture = gl.createTexture();
		if (!this.matrixTexture) throw new Error('WebGL2 failed to allocate the R16UI matrix texture.');
		gl.bindTexture(gl.TEXTURE_2D, this.matrixTexture);
		gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
		configureNearestTexture(gl);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.R16UI,
			this.product.viewport.width,
			this.product.viewport.height,
			0,
			gl.RED_INTEGER,
			gl.UNSIGNED_SHORT,
			this.product.pixelIndex,
		);
		requireNoGlError(gl, 'R16UI matrix upload');
	}

	#allocatePalette() {
		const gl = this.gl;
		const entryCount = this.product.palette.length / CHANNEL_COUNT;
		if (entryCount > this.#maximumTextureSize) {
			throw new RangeError('Native-15 palette exceeds WebGL2 MAX_TEXTURE_SIZE.');
		}
		this.paletteTexture = gl.createTexture();
		if (!this.paletteTexture) throw new Error('WebGL2 failed to allocate the R32F palette texture.');
		gl.bindTexture(gl.TEXTURE_2D, this.paletteTexture);
		gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
		configureNearestTexture(gl);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.R32F,
			CHANNEL_COUNT,
			entryCount,
			0,
			gl.RED,
			gl.FLOAT,
			this.product.palette,
		);
		requireNoGlError(gl, 'R32F palette upload');
	}

	#requireLive() {
		if (this.terminal || !this.matrixTexture || !this.paletteTexture) {
			throw new Error('Screen-palette GPU resource is not live.');
		}
	}

	bindForLookup({matrixTextureUnit = 0, paletteTextureUnit = 1} = {}) {
		this.#requireLive();
		const gl = this.gl;
		gl.activeTexture(gl.TEXTURE0 + matrixTextureUnit);
		gl.bindTexture(gl.TEXTURE_2D, this.matrixTexture);
		gl.activeTexture(gl.TEXTURE0 + paletteTextureUnit);
		gl.bindTexture(gl.TEXTURE_2D, this.paletteTexture);
		return Object.freeze({matrixTextureUnit, paletteTextureUnit});
	}

	#framebufferFor(texture) {
		this.#requireLive();
		const gl = this.gl;
		if (!this.readFramebuffer) {
			this.readFramebuffer = gl.createFramebuffer();
			if (!this.readFramebuffer) throw new Error('WebGL2 failed to allocate a read framebuffer.');
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.readFramebuffer);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			texture,
			0,
		);
		gl.readBuffer(gl.COLOR_ATTACHMENT0);
		if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
			throw new Error('Screen-palette read framebuffer is incomplete.');
		}
		return this.readFramebuffer;
	}

	readMatrixPixel(x, y) {
		if (
			!Number.isSafeInteger(x)
			|| !Number.isSafeInteger(y)
			|| x < 0
			|| x >= this.product.viewport.width
			|| y < 0
			|| y >= this.product.viewport.height
		) throw new RangeError('Matrix readback pixel is outside the viewport.');
		const gl = this.gl;
		this.#framebufferFor(this.matrixTexture);
		const output = new Uint16Array(1);
		gl.readPixels(x, y, 1, 1, gl.RED_INTEGER, gl.UNSIGNED_SHORT, output);
		requireNoGlError(gl, 'R16UI matrix readback');
		return output[0];
	}

	readPaletteEntry(paletteIndex) {
		const entryCount = this.product.palette.length / CHANNEL_COUNT;
		if (!Number.isSafeInteger(paletteIndex) || paletteIndex < 0 || paletteIndex >= entryCount) {
			throw new RangeError('Palette readback index is outside the palette.');
		}
		if (!this.gl.getExtension('EXT_color_buffer_float')) {
			throw new Error('EXT_color_buffer_float is required for R32F palette readback.');
		}
		const gl = this.gl;
		this.#framebufferFor(this.paletteTexture);
		const output = new Float32Array(CHANNEL_COUNT);
		gl.readPixels(0, paletteIndex, CHANNEL_COUNT, 1, gl.RED, gl.FLOAT, output);
		requireNoGlError(gl, 'R32F palette readback');
		return output;
	}

	#deleteHandles() {
		const gl = this.gl;
		let deleted = 0;
		for (const [property, deleter] of [
			['readFramebuffer', (value) => gl.deleteFramebuffer(value)],
			['paletteTexture', (value) => gl.deleteTexture(value)],
			['matrixTexture', (value) => gl.deleteTexture(value)],
		]) {
			if (this[property]) {
				deleter(this[property]);
				this[property] = null;
				deleted += 1;
			}
		}
		this.deleteCallCount += deleted;
		return Object.freeze({deletedHandleCount: deleted});
	}

	dispose() {
		if (this.terminal) return false;
		this.#deleteHandles();
		this.terminal = true;
		this.terminalKind = 'disposed';
		return true;
	}

	abandonAfterContextLoss() {
		if (this.terminal) return false;
		this.abandonedHandleCount = [
			this.readFramebuffer,
			this.paletteTexture,
			this.matrixTexture,
		].filter(Boolean).length;
		this.readFramebuffer = null;
		this.paletteTexture = null;
		this.matrixTexture = null;
		this.terminal = true;
		this.terminalKind = 'context-lost';
		return true;
	}

	describe() {
		return Object.freeze({
			matrix: Object.freeze({
				format: 'R16UI',
				width: this.product.viewport.width,
				height: this.product.viewport.height,
				bytes: this.product.pixelIndex.byteLength,
			}),
			palette: Object.freeze({
				format: 'R32F',
				width: CHANNEL_COUNT,
				height: this.product.palette.length / CHANNEL_COUNT,
				bytes: this.product.palette.byteLength,
			}),
			logicalAddress: 'paletteIndex * 15 + wavelengthIndex',
			terminal: this.terminal,
			terminalKind: this.terminalKind,
			deleteCallCount: this.deleteCallCount,
			abandonedHandleCount: this.abandonedHandleCount,
		});
	}
}
