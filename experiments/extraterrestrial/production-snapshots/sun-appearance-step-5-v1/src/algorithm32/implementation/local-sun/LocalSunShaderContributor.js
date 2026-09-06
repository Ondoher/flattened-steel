import {ShaderContributions} from '../../shader-assembly/base/ShaderContributions.js';
import {LOCAL_SUN_RUNTIME_SHADER_CONTRIBUTION_ID} from './consts.js';

/**
 * Final-view shader-contribution provider for one finite local Sun.
 */
export class LocalSunShaderContributor {
	/**
	 * Normalized physical source configuration retained by reference.
	 * @type {LocalSunLightSourceConfiguration}
	 */
	_configuration;

	/**
	 * Creates a shader-contribution provider for one normalized local source.
	 *
	 * @param {LocalSunLightSourceConfiguration} configuration - The source configuration retained by reference.
	 */
	constructor(configuration) {
		this._configuration = configuration;
	}

	/**
	 * Call this method to declare the configured point Sun during final-view assembly. The completed cumulative cache already contains every atmospheric source term. Flat geometry owns the source-relative runtime frame, so this contribution intentionally adds no direct-view lighting or GLSL branch.
	 *
	 * @returns {ShaderContribution} - The fresh source-owned runtime declaration.
	 *
	 */
	createShaderContribution() {
		return ShaderContributions.createShaderContribution({
			id: LOCAL_SUN_RUNTIME_SHADER_CONTRIBUTION_ID,
			owner: 'lightSource',
			diagnostics: {
				mode: 'cumulative-cache-only',
				sourceKey: this._configuration.sourceKey,
				directViewTerm: false,
			},
		});
	}
}
