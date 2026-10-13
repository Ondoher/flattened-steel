import {Algorithm32Transport} from '../../atmospheric-transport/Algorithm32Transport.js';
import {ShaderContributions} from '../../shader-assembly/base/ShaderContributions.js';
import {Algorithm32ShaderAssembler} from '../../shader-assembly/runtime/Algorithm32ShaderAssembler.js';
import {DIRECTION_TEXTURE_VALUE_KEY, OUTPUT_CHANNEL_VALUE_KEY} from './consts.js';

/** Normal production transport assembly with a fixed receiver-direction ingress. */
export class ReceiverEnvironmentLightTransportShader {
	/** Called by receiver assembly to define the normal runtime state and direction binding.
	 *
	 * @param {number} channelCount - Accepted physical spectral channel count.
	 * @returns {ShaderContribution} - Receiver runtime contribution.
	 */
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

	/** Called by receiver assembly to replace camera-ray ingress with fixed receiver directions.
	 *
	 * @param {ShaderContribution} geometryContribution - Geometry-owned normal contribution.
	 * @returns {ShaderContribution} - Receiver-specific geometry ingress with unchanged physical path functions.
	 */
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

	/** Called by receiver assembly to expose one measured physical spectral channel.
	 *
	 * @returns {ShaderContribution} - Physical radiance output contribution.
	 */
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

	/** Call this method to assemble shared physical path radiance for one active model/cache pair.
	 *
	 * @param {ReceiverEnvironmentLightTransportShaderRequest} request - Complete physical model and live cache capability.
	 * @returns {ShaderAssemblyResult} - Ordinary assembled physical receiver shader.
	 */
	create(request) {
		const transport = new Algorithm32Transport();
		const geometry = request.model.geometry.createShaderContribution({model: request.model});
		const geometryContributions = Array.isArray(geometry)
			? geometry.map((contribution) => this._geometryContribution(contribution))
			: [this._geometryContribution(/** @type {ShaderContribution} */ (geometry))];
		const contributions = [
			this._runtimeContribution(request.model.spectral.basis.channelCount),
			...geometryContributions,
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
