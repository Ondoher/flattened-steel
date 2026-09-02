import {Algorithm32Transport} from '../../atmospheric-transport/Algorithm32Transport.js';
import {ShaderContributions} from '../../shader-assembly/base/ShaderContributions.js';
import {Algorithm32ShaderAssembler} from '../../shader-assembly/runtime/Algorithm32ShaderAssembler.js';

const DIRECTION_TEXTURE_VALUE_KEY = 'lighting.receiverEnvironmentDirections';
const OUTPUT_CHANNEL_VALUE_KEY = 'lighting.receiverEnvironmentOutputChannel';

/** Assemble the normal production transport with a fixed receiver-direction ingress. */
export class ReceiverEnvironmentLightTransportShader {
	_runtimeContribution(channelCount) {
		return ShaderContributions.createShaderContribution({
			id: 'runtime-receiver-environment-light',
			owner: 'runtime',
			provides: ['runtime.initialState', 'runtime.depthTexture', 'runtime.sceneHitTexture'],
			requires: [],
			textures: [
				ShaderContributions.createShaderTextureDeclaration(
					'uReceiverEnvironmentDirections',
					'sampler2D',
					DIRECTION_TEXTURE_VALUE_KEY,
				),
			],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'receiver-environment-runtime-types',
					'declareTypes',
					0,
					`const int SPECTRAL_CHANNEL_COUNT = ${channelCount};
struct SpectralValue { float channels[${channelCount}]; };
struct ViewRay { vec3 originMeters; vec3 direction; };
struct PathBounds { float startDistanceMeters; float endDistanceMeters; float endpointDistanceMeters; bool hasSceneEndpoint; bool hasGroundEndpoint; bool valid; };
struct MediumSample { SpectralValue rayleighScattering; SpectralValue mieScattering; SpectralValue scattering; SpectralValue extinction; };
struct ShaderState { vec2 textureCoordinates; float sceneDepth; float sceneHitMask; ViewRay ray; PathBounds bounds; MediumSample medium; SpectralValue pathRadiance; SpectralValue transmittance; vec3 sceneDisplayRgb; vec4 outputRgba; };
SpectralValue zeroSpectral() { SpectralValue value; for (int i = 0; i < SPECTRAL_CHANNEL_COUNT; i += 1) value.channels[i] = 0.0; return value; }
SpectralValue oneSpectral() { SpectralValue value; for (int i = 0; i < SPECTRAL_CHANNEL_COUNT; i += 1) value.channels[i] = 1.0; return value; }
ShaderState createInitialShaderState(vec2 uv) {
	ShaderState state;
	state.textureCoordinates = uv;
	state.sceneDepth = 0.0;
	state.sceneHitMask = 0.0;
	state.ray = ViewRay(vec3(0.0), vec3(0.0, 0.0, 1.0));
	state.bounds = PathBounds(0.0, 0.0, 0.0, false, false, true);
	state.medium = MediumSample(zeroSpectral(), zeroSpectral(), zeroSpectral(), zeroSpectral());
	state.pathRadiance = zeroSpectral();
	state.transmittance = oneSpectral();
	state.sceneDisplayRgb = vec3(0.0);
	state.outputRgba = vec4(0.0);
	return state;
}`,
				),
			],
		});
	}

	_geometryContribution(geometryContribution) {
		return {
			...geometryContribution,
			id: `${geometryContribution.id}-receiver-environment-light`,
			requires: geometryContribution.requires.filter(
				(symbol) => symbol !== 'runtime.depthTexture' && symbol !== 'runtime.sceneHitTexture',
			),
			functions: geometryContribution.functions.map((block) =>
				block.id === 'geometry-reconstruct-helper'
					? {
							...block,
							code: `ViewRay reconstructViewRay(vec2 textureCoordinates) {
	int directionIndex = clamp(int(floor(textureCoordinates.x * 32.0)), 0, 31);
	vec3 direction = normalize(texelFetch(uReceiverEnvironmentDirections, ivec2(directionIndex, 0), 0).xyz);
	return ViewRay(uCameraWorldPositionMeters, direction);
}`,
						}
					: block,
			),
		};
	}

	_outputContribution() {
		return ShaderContributions.createShaderContribution({
			id: 'lighting-receiver-environment-output',
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
			],
			mainHooks: [
				ShaderContributions.createShaderSourceBlock(
					'receiver-environment-output-main',
					'diagnosticOutput',
					0,
					'outColor = vec4(state.pathRadiance.channels[uReceiverEnvironmentOutputChannel], 0.0, 0.0, 1.0);',
				),
			],
		});
	}

	/** Assemble the shared path-radiance shader for one active model/cache pair. */
	create(request) {
		const transport = new Algorithm32Transport();
		const contributions = [
			this._runtimeContribution(request.model.spectral.basis.channelCount),
			this._geometryContribution(request.model.geometry.createShaderContribution()),
			request.model.atmosphere.createShaderContribution({model: request.model}),
			request.model.lightSource.createShaderContribution({model: request.model}),
			request.scatteringCache.createShaderContribution({model: request.model}),
			transport.createShaderContribution({model: request.model}),
			this._outputContribution(),
		].flat();
		return new Algorithm32ShaderAssembler().assemble({
			contributions,
			mainRequiredSymbols: [
				'runtime.initialState',
				'geometry.reconstructViewRay',
				'geometry.resolveAtmospherePath',
				'atmosphere.sampleMedium',
				'cache.sampleCumulativeScatteringDensity',
				'transport.evaluatePathRadiance',
				'lighting.receiverEnvironmentOutput',
			],
			systemProvidedSymbols: [],
		});
	}
}

export {DIRECTION_TEXTURE_VALUE_KEY, OUTPUT_CHANNEL_VALUE_KEY};
