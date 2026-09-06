import {CanonicalValueHash} from '../../value-identity/CanonicalValueHash.js';

/** Cache-build declaration identity, binding naming, and construction methods. */
export const CacheBuildModules = {
	/**
	 * Call this method to derive an injective GLSL-safe input sampler name from a logical field identifier.
	 *
	 * @param {string} fieldId - The logical field identifier.
	 * @returns {string} - The GLSL-safe input sampler name.
	 */
	fieldInputBindingName(fieldId) {
		const bytes = new TextEncoder().encode(fieldId);
		const encoded = Array.from(
			bytes,
			/**
			 * Called by the surrounding operation to handle one callback invocation.
			 * @param value - The value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (value) => value.toString(16).padStart(2, '0'),
		).join('');
		return `a32CacheField_${encoded}`;
	},

	/**
	 * Call this method to derive stable identity metadata from one typed shader binding value. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {CacheBinding} binding - The typed shader binding.
	 * @returns {CacheBindingIdentity} - The stable binding identity value.
	 */
	bindingIdentity(binding) {
		if (binding.spec.kind === 'data') {
			const dataBinding = /** @type {CacheDataBinding} */ (binding);
			return {
				id: dataBinding.value.id,
				contentHash: dataBinding.value.contentHash,
			};
		}

		if (binding.spec.kind === 'uniform' && binding.spec.shaderType.startsWith('float[')) {
			return {
				contentHash: /** @type {SpectralPacket} */ (binding.value).contentHash,
			};
		}

		return binding.value;
	},

	/**
	 * Call this method to construct one owner module and derive its descriptive content identity.
	 *
	 * @param {CacheBuildModuleDefinition} definition - The owner module definition.
	 * @returns {CacheBuildModule} - The identified cache-build module.
	 */
	createBuildModule(definition) {
		const blocks = [...definition.blocks].sort(
			/**
			 * Called by Array.prototype.sort to compare two collection values.
			 * @param left - The left value accepted by the operation.
			 * @param right - The right value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (left, right) =>
				left.phase.localeCompare(right.phase) || left.order - right.order || left.id.localeCompare(right.id),
		);
		const bindings = [...definition.bindings].sort(
			/**
			 * Called by Array.prototype.sort to compare two collection values.
			 * @param left - The left value accepted by the operation.
			 * @param right - The right value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (left, right) => left.spec.id.localeCompare(right.spec.id),
		);
		const body = {
			id: definition.id,
			owner: definition.owner,
			provides: [...definition.provides].sort(),
			requires: [...definition.requires].sort(),
			blocks,
			bindings,
		};
		const identity = {
			...body,
			bindings: bindings.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param binding - The binding value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (binding) => ({
					spec: binding.spec,
					value: CacheBuildModules.bindingIdentity(binding),
				}),
			),
		};

		return /** @type {CacheBuildModule} */ ({
			...body,
			contentHash: CanonicalValueHash.sha256Value(identity),
		});
	},
};
