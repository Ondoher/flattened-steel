/** Provider-neutral construction methods for direct shader assembly declarations. */
export const ShaderContributions = {
	/**
	 * Call this method to create one complete shader contribution from partial owner-provided fields.
	 *
	 * @param {ShaderContributionConfiguration} configuration - The contribution fields.
	 * @returns {ShaderContribution} - The complete contribution.
	 */
	createShaderContribution(configuration) {
		return {
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
	},

	/**
	 * Call this method to create one ordered GLSL source block for deterministic assembly.
	 *
	 * @param {string} id - The block identity.
	 * @param {ShaderSourceSlot} slot - The assembly slot.
	 * @param {number} order - The slot-local order.
	 * @param {string} code - The GLSL source.
	 * @returns {ShaderSourceBlock} - The source block.
	 */
	createShaderSourceBlock(id, slot, order, code) {
		return {id, slot, order, code};
	},

	/**
	 * Call this method to create one shader uniform declaration with an optional default.
	 *
	 * @param {string} name - The GLSL uniform name.
	 * @param {string} type - The GLSL uniform type.
	 * @param {string} valueKey - The runtime value key.
	 * @param {unknown} [defaultValue] - The optional default value.
	 * @returns {ShaderUniformDeclaration} - The uniform declaration.
	 */
	createShaderUniformDeclaration(name, type, valueKey, defaultValue) {
		const declaration = {name, type, valueKey};

		if (arguments.length >= 4) {
			declaration.defaultValue = defaultValue;
		}

		return declaration;
	},

	/**
	 * Call this method to create one shader texture declaration for a runtime value.
	 *
	 * @param {string} name - The GLSL sampler name.
	 * @param {string} type - The sampler type.
	 * @param {string} valueKey - The runtime value key.
	 * @returns {ShaderTextureDeclaration} - The texture declaration.
	 */
	createShaderTextureDeclaration(name, type, valueKey) {
		return {name, type, valueKey};
	},

	/**
	 * Call this method to create one runtime shader binding requirement.
	 *
	 * @param {string} id - The binding identity.
	 * @param {ShaderOwnerId} owner - The binding owner.
	 * @param {ShaderBindingKind} kind - The binding kind.
	 * @param {ShaderUpdateFrequency} updateFrequency - The update cadence.
	 * @param {string} valueKey - The runtime value key.
	 * @param {boolean} required - Whether setup must provide the value.
	 * @returns {ShaderBindingRequirement} - The binding requirement.
	 */
	createShaderBindingRequirement(id, owner, kind, updateFrequency, valueKey, required) {
		return {id, owner, kind, updateFrequency, valueKey, required};
	},
};
