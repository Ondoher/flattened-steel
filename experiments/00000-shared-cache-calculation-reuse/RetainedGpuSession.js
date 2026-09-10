/** Bounded GPU program and exact-layout texture pool for one context. */
export default class RetainedGpuSession {
	/** Creates a pool with explicit residency budgets.
	 * @param {WebGL2RenderingContext} gl - Exclusive context.
	 * @param {number} [maximumBytes] - Texture residency ceiling in bytes.
	 */
	constructor(gl, maximumBytes = 512 * 1024 * 1024) {
		this.gl = gl;
		this.maximumBytes = maximumBytes;
		this.textures = new Map();
		this.programs = new Map();
		this.stats = {
			textureAllocations: 0,
			textureReuses: 0,
			programCompiles: 0,
			programReuses: 0,
			peakBytes: 0,
			residentBytes: 0,
		};
	}

	/** Call this method to acquire a program keyed by complete unchanged shader source.
	 * @param {string} source - Complete fragment source.
	 * @param {Function} create - Original compiler allocation callback.
	 * @returns {WebGLProgram} - Retained program.
	 */
	program(source, create) {
		if (this.programs.has(source)) {
			this.stats.programReuses++;
			return this.programs.get(source);
		}
		if (this.programs.size >= 256) {
			// A phase boundary is required before clearing program residency.
			throw new Error('Program budget exceeded; close the compatible session before another profile.');
		}
		const program = create();
		this.programs.set(source, program);
		this.stats.programCompiles++;
		return program;
	}

	/** Call this method to acquire an exact-layout scratch or uploaded-data texture.
	 * All scratch callers fully overwrite their output before reading it.
	 * @param {CacheReuseTextureSpec} spec - Original allocation parameters.
	 * @param {Function} create - Original allocation callback.
	 * @returns {WebGLTexture} - Exclusively leased texture.
	 */
	texture(spec, create) {
		const gl = this.gl;
		const {width, height, internalFormat = gl.R32F, format = gl.RED, type = gl.FLOAT, data = null} = spec;
		const key = JSON.stringify([width, height, internalFormat, format, type]);
		for (const [texture, entry] of this.textures) {
			if (entry.key === key && !entry.leased) {
				entry.leased = true;
				gl.bindTexture(gl.TEXTURE_2D, texture);
				if (data !== null) gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, format, type, data);
				this.stats.textureReuses++;
				return texture;
			}
		}
		const components = format === gl.RGBA ? 4 : format === gl.RG ? 2 : 1;
		const bytes = width * height * components * 4;
		for (const [texture, entry] of this.textures) {
			if (this.stats.residentBytes + bytes <= this.maximumBytes) break;
			if (!entry.leased) {
				gl.deleteTexture(texture);
				this.textures.delete(texture);
				this.stats.residentBytes -= entry.bytes;
			}
		}
		if (this.stats.residentBytes + bytes > this.maximumBytes) throw new Error('Texture residency budget exceeded.');
		const texture = create();
		this.textures.set(texture, {key, bytes, leased: true});
		this.stats.textureAllocations++;
		this.stats.residentBytes += bytes;
		this.stats.peakBytes = Math.max(this.stats.peakBytes, this.stats.residentBytes);
		return texture;
	}

	/** Call this method to release a texture lease while retaining storage.
	 * @param {WebGLTexture} texture - Currently leased owned texture.
	 * @returns {void}
	 */
	release(texture) {
		const entry = this.textures.get(texture);
		if (!entry?.leased) throw new Error('Invalid texture release.');
		entry.leased = false;
	}

	/** Call this method to prove all compilation leases ended.
	 * @returns {void}
	 */
	boundary() {
		if ([...this.textures.values()].some((entry) => entry.leased)) throw new Error('Leaked texture lease.');
	}

	/** Call this method between wavelength jobs to bound program residency.
	 * @returns {void}
	 */
	prepare() {
		this.boundary();
		while (this.programs.size > 250) {
			const source = this.programs.keys().next().value;
			this.gl.deleteProgram(this.programs.get(source));
			this.programs.delete(source);
		}
	}

	/** Call this method to delete every retained allocation and shader program.
	 * @returns {void}
	 */
	close() {
		for (const texture of this.textures.keys()) this.gl.deleteTexture(texture);
		for (const program of this.programs.values()) this.gl.deleteProgram(program);
		this.textures.clear();
		this.programs.clear();
		this.stats.residentBytes = 0;
	}
}
