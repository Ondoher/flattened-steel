/**
 * Create one complete shader contribution from partial owner-provided fields.
 *
 * @param {Pick<ShaderContribution, 'id' | 'owner'> & Partial<ShaderContribution>} configuration - Supplies contribution fields.
 * @returns {ShaderContribution} Return the complete contribution.
 */
export function createShaderContribution(configuration) {
	return {
		descriptorFingerprint: '',
		compatibilityTags: [],
		provides: [],
		requires: [],
		defines: [],
		uniforms: [],
		textures: [],
		functions: [],
		mainHooks: [],
		bindingRequirements: [],
		diagnostics: null,
		...configuration,
	};
}

/**
 * Create one ordered GLSL source block.
 *
 * @param {string} id - Supplies the block identity.
 * @param {ShaderSourceSlot} slot - Supplies the assembly slot.
 * @param {number} order - Supplies slot-local order.
 * @param {string} code - Supplies GLSL source.
 * @returns {ShaderSourceBlock} Return the source block.
 */
export function createShaderSourceBlock(id, slot, order, code) {
	return { id, slot, order, code };
}

/**
 * Create one shader uniform descriptor.
 *
 * @param {string} name - Supplies the GLSL uniform name.
 * @param {string} type - Supplies the GLSL uniform type.
 * @param {string} valueKey - Supplies the runtime value key.
 * @param {unknown} [defaultValue] - Supplies an optional default value.
 * @returns {ShaderUniformDescriptor} Return the uniform descriptor.
 */
export function createShaderUniformDescriptor(name, type, valueKey, defaultValue) {
	const descriptor = { name, type, valueKey };

	if (arguments.length >= 4) {
		descriptor.defaultValue = defaultValue;
	}

	return descriptor;
}

/**
 * Create one shader texture descriptor.
 *
 * @param {string} name - Supplies the GLSL sampler name.
 * @param {string} type - Supplies the sampler type.
 * @param {string} valueKey - Supplies the runtime value key.
 * @returns {ShaderTextureDescriptor} Return the texture descriptor.
 */
export function createShaderTextureDescriptor(name, type, valueKey) {
	return { name, type, valueKey };
}

/**
 * Create one shader binding requirement.
 *
 * @param {string} id - Supplies the binding identity.
 * @param {ShaderOwnerId} owner - Supplies the binding owner.
 * @param {ShaderBindingKind} kind - Supplies the binding kind.
 * @param {ShaderUpdateFrequency} updateFrequency - Supplies the update cadence.
 * @param {string} valueKey - Supplies the runtime value key.
 * @param {boolean} required - Supplies whether setup must provide the value.
 * @returns {ShaderBindingRequirement} Return the binding requirement.
 */
export function createShaderBindingRequirement(
	id,
	owner,
	kind,
	updateFrequency,
	valueKey,
	required,
) {
	return { id, owner, kind, updateFrequency, valueKey, required };
}

/**
 * Format one finite number for deterministic GLSL source.
 *
 * @param {number} value - Supplies the accepted number.
 * @returns {string} Return GLSL numeric source.
 */
export function formatShaderFloat(value) {
	if (Number.isInteger(value)) {
		return value.toFixed(1);
	}

	return Number(value).toPrecision(12);
}

/**
 * Format numeric array entries for deterministic GLSL source.
 *
 * @param {readonly number[]} values - Supplies accepted numeric entries.
 * @returns {string} Return comma-separated GLSL numeric source.
 */
export function formatShaderFloatArray(values) {
	return values.map((value) => formatShaderFloat(value)).join(', ');
}

/**
 * Format one three-component GLSL vector.
 *
 * @param {readonly number[]} values - Supplies vector values.
 * @returns {string} The formatted GLSL vector source.
 */
export function formatShaderVec3(values) {
	return `vec3(${formatShaderFloatArray(values)})`;
}
