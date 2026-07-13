import {
	createShaderContribution,
	createShaderSourceBlock,
} from '../shader/shaderContribution.js';

/** Compose celestial radiance once after transport and before Color. */
export class CelestialSpectralComposer {
	createShaderContribution({ descriptor }) {
		return createShaderContribution({
			id: 'composition-celestial-spectral-radiance', owner: 'cache',
			descriptorFingerprint: descriptor.transport.fingerprint,
			compatibilityTags: descriptor.transport.compatibilityTags,
			provides: ['composition.composeSpectralRadiance'],
			requires: ['runtime.initialState', 'celestial.evaluateRadiance'],
			functions: [createShaderSourceBlock('composition-celestial-spectral-helper', 'composeSpectralRadiance', 0, `void composeSpectralRadiance(inout ShaderState state) {
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		state.preDisplayRadiance.c[channelIndex] = state.pathRadiance.c[channelIndex]
			+ state.celestialRadiance.c[channelIndex];
	}
}`)],
			mainHooks: [createShaderSourceBlock('composition-celestial-spectral-main', 'composeSpectralRadiance', 0, 'composeSpectralRadiance(state);')],
		});
	}
}

export default CelestialSpectralComposer;
