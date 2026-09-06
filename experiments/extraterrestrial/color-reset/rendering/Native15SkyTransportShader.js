import {ShaderContributions} from '../controls/production-v1/src/algorithm32/shader-assembly/base/ShaderContributions.js';
import {OUTPUT_CHANNEL_VALUE_KEY} from '../controls/production-v1/src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightTransportShader.js';
import {Cr2ReceiverDiffuseTransportShader} from '../lighting/Cr2ReceiverDiffuseTransportShader.js';

/** Binding key for selecting path radiance or view-path transmittance. */
export const SKY_TRANSPORT_OUTPUT_KIND_VALUE_KEY = 'colorReset.rendering.native15SkyTransportOutputKind';

/** Output-kind codes shared by the sampler and shader. */
export const SKY_TRANSPORT_OUTPUT_KINDS = Object.freeze({
	PATH_RADIANCE: 0,
	TRANSMITTANCE: 1,
});

/**
 * CR2's direction-count specialization with a second readback seam for the
 * already-computed Q30 view transmittance. No transport or cache equation is
 * replaced.
 */
export class Native15SkyTransportShader extends Cr2ReceiverDiffuseTransportShader {
	_outputContribution() {
		return ShaderContributions.createShaderContribution({
			id: 'color-reset-native15-sky-transport-output',
			owner: 'color',
			provides: ['lighting.receiverEnvironmentOutput'],
			requires: ['transport.evaluatePathRadiance'],
			uniforms: [
				ShaderContributions.createShaderUniformDeclaration(
					'uReceiverEnvironmentOutputChannel',
					'int',
					OUTPUT_CHANNEL_VALUE_KEY,
					0,
				),
				ShaderContributions.createShaderUniformDeclaration(
					'uColorResetSkyTransportOutputKind',
					'int',
					SKY_TRANSPORT_OUTPUT_KIND_VALUE_KEY,
					SKY_TRANSPORT_OUTPUT_KINDS.PATH_RADIANCE,
				),
			],
			mainHooks: [
				ShaderContributions.createShaderSourceBlock(
					'color-reset-native15-sky-transport-output-main',
					'diagnosticOutput',
					0,
					`SpectralValue selectedValue = state.pathRadiance;
if (uColorResetSkyTransportOutputKind == ${SKY_TRANSPORT_OUTPUT_KINDS.TRANSMITTANCE}) {
	selectedValue = state.transmittance;
}
int firstChannel = uReceiverEnvironmentOutputChannel;
outColor = vec4(
	firstChannel < SPECTRAL_CHANNEL_COUNT ? selectedValue.channels[firstChannel] : 0.0,
	firstChannel + 1 < SPECTRAL_CHANNEL_COUNT ? selectedValue.channels[firstChannel + 1] : 0.0,
	firstChannel + 2 < SPECTRAL_CHANNEL_COUNT ? selectedValue.channels[firstChannel + 2] : 0.0,
	firstChannel + 3 < SPECTRAL_CHANNEL_COUNT ? selectedValue.channels[firstChannel + 3] : 0.0
);`,
				),
			],
		});
	}
}
