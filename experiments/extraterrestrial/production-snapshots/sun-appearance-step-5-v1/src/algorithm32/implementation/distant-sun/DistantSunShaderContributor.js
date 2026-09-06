import {ShaderContributions} from '../../shader-assembly/base/ShaderContributions.js';

/** Distant-Sun final-view shader contribution provider. */
export class DistantSunShaderContributor {
	/**
	 * Immutable normalized source configuration.
	 * @type {DistantSunLightSourceConfiguration}
	 */
	_configuration;

	/**
	 * Creates a shader contributor for one normalized distant-Sun configuration.
	 *
	 * @param {DistantSunLightSourceConfiguration} configuration - The normalized source configuration.
	 */
	constructor(configuration) {
		this._configuration = configuration;
	}

	/**
	 * Call this method to create the source-owned distant-Sun shader contribution.
	 *
	 * @returns {ShaderContribution} - The light-source shader contribution.
	 *
	 */
	createShaderContribution() {
		return ShaderContributions.createShaderContribution({
			id: 'light-distant-sun',
			owner: 'lightSource',
			provides: ['light.directionToAtmosphericSource'],
			requires: [],
			uniforms: [
				ShaderContributions.createShaderUniformDeclaration(
					'uDistantSunDirection',
					'vec3',
					'lightSource.direction',
					this._configuration.directionToLight,
				),
			],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'light-source-direction',
					'sampleLightSource',
					0,
					`vec3 directionToAtmosphericSource(vec3 positionMeters) {
	return normalize(uDistantSunDirection);
}`,
				),
			],
		});
	}
}
