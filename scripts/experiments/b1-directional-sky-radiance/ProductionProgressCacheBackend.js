/** Experiment adapter that reports live cache-pass layer progress while delegating all GPU work unchanged. */
export class ProductionProgressCacheBackend {
	/**
	 * Called by the benchmark adapter to keep very large fixed incoming loops
	 * dynamic on ANGLE. The wavelength layer is always nonnegative during cache
	 * execution, so this changes compiler specialization only, not loop bounds.
	 *
	 * @param {CacheShader} shader - Assembled production cache shader.
	 * @returns {CacheShader} - Original or diagnostically stabilized shader.
	 */
	_stabilizeLargeIncomingLoop(shader) {
		const countMatch = /#define CACHE_INCOMING_DIRECTION_COUNT (\d+)/u.exec(shader.source);
		if (Number(countMatch?.[1] ?? 0) < 288) return shader;
		const fixedCondition = 'incomingIndex < CACHE_INCOMING_DIRECTION_COUNT;';
		const dynamicCondition = 'incomingIndex < (a32CacheWavelengthLayer < 0 ? 0 : CACHE_INCOMING_DIRECTION_COUNT);';
		const source = shader.source.replace(fixedCondition, dynamicCondition);
		if (source === shader.source) {
			throw new Error('Large incoming-loop stabilization did not find the production scatter loop.');
		}
		return {
			...shader,
			source,
			sourceHash: `${shader.sourceHash}:dynamic-incoming-loop-v1`,
		};
	}

	/**
	 * Create a progress-reporting adapter around the production cache backend.
	 *
	 * @param {{backend: CacheGpuBackend, report(message: string): void}} request - The delegated backend and reporter.
	 */
	constructor(request) {
		this._backend = request.backend;
		this._report = request.report;
	}

	/** @returns {string} - The delegated backend identity. */
	get id() {
		return this._backend.id;
	}

	/** @returns {CacheGpuCapabilities} - The delegated backend capabilities. */
	get capabilities() {
		return this._backend.capabilities;
	}

	/** @param {CacheFieldSpec} field - The requested field. @returns {GpuCacheField} - The allocated field. */
	allocateField(field) {
		return this._backend.allocateField(field);
	}

	/** @param {CacheShader} shader - The requested shader. @returns {Promise<CacheGpuProgram> | CacheGpuProgram} - The compiled program. */
	async compile(shader) {
		const acceptedShader = this._stabilizeLargeIncomingLoop(shader);
		const startedAt = performance.now();
		const packedDataBytes = acceptedShader.bindings
			.filter((binding) => binding.spec.kind === 'data')
			.reduce((total, binding) => total + binding.value.values.length * 4, 0);
		this._report(
			`${acceptedShader.id} shader preparation started (${acceptedShader.sourceHash}, ${acceptedShader.source.length} characters, ${packedDataBytes} constant data-texture bytes)`,
		);
		const program = await this._backend.compile(acceptedShader);
		this._report(`${acceptedShader.id} shader prepared in ${(performance.now() - startedAt).toFixed(1)}ms`);
		return program;
	}

	/** @param {CacheLayerSubmission} request - The layer submission. @returns {void} - No value. */
	submitLayer(request) {
		const completed = request.layer + 1;
		const total = request.output.storage.layers;
		this._backend.submitLayer(request);
		if (completed === 1 || completed === total || completed % 10 === 0) {
			this._report(`${request.output.id} ${completed}/${total}`);
		}
	}

	/** @param {GpuCacheField} field - The completed field. @returns {CacheRuntimeBinding} - The runtime binding. */
	createRuntimeBinding(field) {
		this._residentField = field;
		return this._backend.createRuntimeBinding(field);
	}

	/** @param {CacheImmutableTextureUploadRequest} request - Exact immutable texture upload. @returns {CacheImmutableTexture} - Delegated texture owner. */
	uploadImmutableTexture(request) {
		return this._backend.uploadImmutableTexture(request);
	}

	/** @returns {Promise<CacheProbeResult>} - Selected resident-cache values for experiment diagnostics. */
	async readResidentProbe() {
		if (!this._residentField) throw new Error('No resident cache field is available for probing.');
		const {width, height, layers} = this._residentField.storage;
		return this._backend.readSelectedScalars({
			field: this._residentField,
			coordinates: [
				{directionIndex: 0, positionIndex: 0, wavelengthIndex: 0},
				{
					directionIndex: Math.floor(width / 2),
					positionIndex: Math.floor(height / 2),
					wavelengthIndex: Math.floor(layers / 2),
				},
				{directionIndex: width - 1, positionIndex: height - 1, wavelengthIndex: layers - 1},
			],
		});
	}

	/** @param {CacheRuntimeBindingInstallRequest} request - The binding installation. @returns {void} - No value. */
	installRuntimeBindings(request) {
		this._backend.installRuntimeBindings(request);
	}

	/** @returns {void} - No value. */
	dispose() {
		this._backend.dispose();
	}
}
