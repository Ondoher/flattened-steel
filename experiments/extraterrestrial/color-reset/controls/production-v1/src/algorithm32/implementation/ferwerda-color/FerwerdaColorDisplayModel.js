import {NATIVE_15_SPECTRAL_BASIS} from '../../profiles/index.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	SpectralPacket as SpectralPacketClass,
} from '../../spectral-values/index.js';
import {ShaderContributions} from '../../shader-assembly/base/ShaderContributions.js';
import {ShaderSource} from '../../shader-assembly/base/ShaderSource.js';
import {CanonicalValueHash} from '../../value-identity/CanonicalValueHash.js';
import {FIGURE1_DISPLAY_CONSTANTS} from '../bruneton-color/consts.js';
import {
	FERWERDA_ADAPTATION_KINDS,
	FERWERDA_ADAPTATION_EPSILON,
	FERWERDA_DISPLAY_CONDITION,
	NATIVE_15_LINEAR_SRGB_BASIS_RESPONSES,
} from './consts.js';

const PHOTOPIC_RGB_WEIGHTS = Object.freeze([0.2126, 0.7152, 0.0722]);
const FERWERDA_MODEL_ID = 'ferwerda-steady-state-cone-rod-display-v1';

function requirePositive(value, label) {
	if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be positive and finite.`);
	return value;
}

function protectZero(value, label) {
	if (!Number.isFinite(value) || value < 0) throw new RangeError(`${label} must be nonnegative and finite.`);
	return value === 0 ? FERWERDA_ADAPTATION_EPSILON : value;
}

/** Ferwerda et al. 1996 equation 4, in cd m^-2. */
export function ferwerdaPhotopicThreshold(adaptationLuminance) {
	const logarithmicLuminance = Math.log10(requirePositive(adaptationLuminance, 'Photopic adaptation luminance'));
	let logarithmicThreshold;
	if (logarithmicLuminance <= -2.6) logarithmicThreshold = -0.72;
	else if (logarithmicLuminance >= 1.9) logarithmicThreshold = logarithmicLuminance - 1.255;
	else logarithmicThreshold = (0.249 * logarithmicLuminance + 0.65) ** 2.7 - 0.72;
	return 10 ** logarithmicThreshold;
}

/** Ferwerda et al. 1996 equation 5, in cd m^-2. */
export function ferwerdaScotopicThreshold(adaptationLuminance) {
	const logarithmicLuminance = Math.log10(requirePositive(adaptationLuminance, 'Scotopic adaptation luminance'));
	let logarithmicThreshold;
	if (logarithmicLuminance <= -3.94) logarithmicThreshold = -2.86;
	else if (logarithmicLuminance >= -1.44) logarithmicThreshold = logarithmicLuminance - 0.395;
	else logarithmicThreshold = (0.405 * logarithmicLuminance + 1.6) ** 2.18 - 2.86;
	return 10 ** logarithmicThreshold;
}

/** Accepted Walraven-Valeton rod transition used by the qualified experiment. */
export function ferwerdaRodBlend(worldAdaptationLuminance, sigma = 100) {
	const world = requirePositive(worldAdaptationLuminance, 'World adaptation luminance');
	const acceptedSigma = requirePositive(sigma, 'Walraven-Valeton sigma');
	return Math.max(0, (acceptedSigma - world / 4) / (acceptedSigma + world));
}

/** Derive the fixed-display steady-state parameters used by CPU and GLSL. */
export function deriveFerwerdaParameters(worldAdaptationLuminance) {
	const world = protectZero(worldAdaptationLuminance, 'World adaptation luminance');
	const displayMaximum = FERWERDA_DISPLAY_CONDITION.maximumLuminance.value;
	const displayAdaptation = FERWERDA_DISPLAY_CONDITION.adaptationLuminance.value;
	const displayPhotopicThreshold = ferwerdaPhotopicThreshold(displayAdaptation);
	const worldPhotopicThreshold = ferwerdaPhotopicThreshold(world);
	const worldScotopicThreshold = ferwerdaScotopicThreshold(world);
	return Object.freeze({
		worldAdaptationLuminance: world,
		displayMaximumLuminance: displayMaximum,
		displayAdaptationLuminance: displayAdaptation,
		displayPhotopicThreshold,
		worldPhotopicThreshold,
		worldScotopicThreshold,
		coneScale: displayPhotopicThreshold / worldPhotopicThreshold,
		rodScale: displayPhotopicThreshold / worldScotopicThreshold,
		rodBlend: ferwerdaRodBlend(world),
		units: 'cd m^-2',
	});
}

/** Separate source-independent steady-state Ferwerda Color model. */
export class FerwerdaColorDisplayModel {
	/** @param {FerwerdaColorDisplayModelConfiguration} configuration - Declared condition-wide adaptation input. */
	constructor(configuration) {
		this._adaptation = this._acceptAdaptation(configuration?.adaptation);
		this._parameters = deriveFerwerdaParameters(this._adaptation.luminance.value);
		this._id = `${FERWERDA_MODEL_ID}:${CanonicalValueHash.sha256Value({
			adaptation: this._adaptation,
			displayCondition: FERWERDA_DISPLAY_CONDITION,
		})}`;
	}

	get id() {
		return this._id;
	}

	get adaptation() {
		return this._adaptation;
	}

	get parameters() {
		return this._parameters;
	}

	_acceptAdaptation(value) {
		if (!value || typeof value !== 'object') throw new TypeError('Ferwerda adaptation input is required.');
		if (!Object.values(FERWERDA_ADAPTATION_KINDS).includes(value.kind)) {
			throw new TypeError('Ferwerda adaptation kind is not supported.');
		}
		if (!value.luminance || value.luminance.units !== 'cd m^-2') {
			throw new TypeError('Ferwerda adaptation luminance units must be "cd m^-2".');
		}
		protectZero(value.luminance.value, 'Ferwerda adaptation luminance');
		if (typeof value.provenanceId !== 'string' || value.provenanceId.length === 0) {
			throw new TypeError('Ferwerda adaptation provenanceId is required.');
		}
		return Object.freeze({
			kind: value.kind,
			luminance: Object.freeze({...value.luminance}),
			provenanceId: value.provenanceId,
		});
	}

	_acceptRadiance(value) {
		const packet = SpectralPacketClass.assert(value, {
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
		});
		if (packet.basis.contentHash !== NATIVE_15_SPECTRAL_BASIS.contentHash) {
			throw new TypeError('Ferwerda Color requires the native-15 spectral basis.');
		}
		return packet;
	}

	_acceptTransmittance(value) {
		const packet = SpectralPacketClass.assert(value, {
			quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
			units: SPECTRAL_UNITS.DIMENSIONLESS,
		});
		if (packet.basis.contentHash !== NATIVE_15_SPECTRAL_BASIS.contentHash) {
			throw new TypeError('Ferwerda Color requires native-15 transmittance.');
		}
		return packet;
	}

	_acceptExposure(exposureModifier) {
		if (exposureModifier !== undefined && exposureModifier !== 1) {
			throw new RangeError('Ferwerda Color accepts only the qualified identity exposure.');
		}
	}

	radianceToLinearSrgb(radiance) {
		const packet = this._acceptRadiance(radiance);
		return [0, 1, 2].map((outputChannel) =>
			packet.values.reduce(
				(sum, value, channelIndex) =>
					sum + value * NATIVE_15_LINEAR_SRGB_BASIS_RESPONSES[channelIndex][outputChannel],
				0,
			),
		);
	}

	_rendererLinearChannelToDisplay(value) {
		const clamped = Math.min(1, Math.max(0, value));
		return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
	}

	rendererLinearSrgbToDisplayRgb(linearSrgb) {
		const nonnegative = linearSrgb.map((value) => Math.max(0, value));
		const peak = Math.max(...nonnegative);
		const bounded = peak > 1 ? nonnegative.map((value) => value / peak) : nonnegative;
		return bounded.map((value) => this._rendererLinearChannelToDisplay(value));
	}

	displayRgbToLinearSrgb(displayRgb) {
		return displayRgb.map(
			(value) =>
				-Math.log(1 - Math.min(0.999999, Math.max(0, value))) / FIGURE1_DISPLAY_CONSTANTS.paperFigure1ToneMapK,
		);
	}

	spectralTransmittanceToRgbBands(transmittance) {
		const packet = this._acceptTransmittance(transmittance);
		const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
		return [
			average(packet.values.slice(8)),
			average(packet.values.slice(4, 9)),
			average(packet.values.slice(0, 5)),
		];
	}

	linearSrgbToDisplayRgb(linearSrgb, exposureModifier) {
		this._acceptExposure(exposureModifier);
		const positive = linearSrgb.map((value) => Math.max(0, value));
		const luminance = positive.reduce(
			(sum, value, channelIndex) => sum + value * PHOTOPIC_RGB_WEIGHTS[channelIndex],
			0,
		);
		const parameters = this._parameters;
		return positive.map((value) => {
			const cone = parameters.coneScale * value;
			const rod = parameters.rodScale * parameters.rodBlend * luminance;
			return this._rendererLinearChannelToDisplay((cone + rod) / parameters.displayMaximumLuminance);
		});
	}

	convert(request) {
		return {
			channels: this.linearSrgbToDisplayRgb(
				this.radianceToLinearSrgb(request.radiance),
				request.exposureModifier,
			),
			colorSpace: 'display-srgb',
		};
	}

	composeSceneLinearSrgb(request) {
		this._acceptExposure(request.exposureModifier);
		const path = this.radianceToLinearSrgb(request.pathRadiance);
		const sceneRelative =
			request.sceneColorSpace === 'linear-srgb'
				? request.sceneDisplayRgb.map((value) => Math.max(0, value))
				: this.displayRgbToLinearSrgb(request.sceneDisplayRgb);
		const sceneLuminanceScale = request.sceneLuminanceScale?.value ?? this._adaptation.luminance.value;
		if (!Number.isFinite(sceneLuminanceScale) || sceneLuminanceScale < 0) {
			throw new RangeError('Ferwerda scene luminance scale must be finite and nonnegative.');
		}
		const scene = sceneRelative.map((value) => value * sceneLuminanceScale);
		const transmittance = this.spectralTransmittanceToRgbBands(request.transmittance);
		const sceneTransmittance = request.applySceneTransmittance === false ? [1, 1, 1] : transmittance;
		return /** @type {const} */ ([
			path[0] + scene[0] * sceneTransmittance[0],
			path[1] + scene[1] * sceneTransmittance[1],
			path[2] + scene[2] * sceneTransmittance[2],
		]);
	}

	/** @returns {readonly [number, number, number]} The display-encoded RGB channels. */
	composeSceneDisplayRgb(request) {
		const display = this.linearSrgbToDisplayRgb(this.composeSceneLinearSrgb(request), request.exposureModifier);
		return /** @type {const} */ ([display[0], display[1], display[2]]);
	}

	_projectionConstantsBlock() {
		const rows = [0, 1, 2].map((outputChannel) =>
			NATIVE_15_LINEAR_SRGB_BASIS_RESPONSES.map((response) => response[outputChannel]),
		);
		return `const float DISPLAY_LINEAR_SRGB_R_BY_CHANNEL[15] = float[15](${ShaderSource.formatFloatArray(rows[0])});
const float DISPLAY_LINEAR_SRGB_G_BY_CHANNEL[15] = float[15](${ShaderSource.formatFloatArray(rows[1])});
const float DISPLAY_LINEAR_SRGB_B_BY_CHANNEL[15] = float[15](${ShaderSource.formatFloatArray(rows[2])});
const float DISPLAY_TONE_MAP_K = ${ShaderSource.formatFloat(FIGURE1_DISPLAY_CONSTANTS.paperFigure1ToneMapK)};
const float FERWERDA_ADAPTATION_EPSILON = ${ShaderSource.formatFloat(FERWERDA_ADAPTATION_EPSILON)};
const float FERWERDA_DISPLAY_PHOTOPIC_THRESHOLD = ${ShaderSource.formatFloat(this._parameters.displayPhotopicThreshold)};
const float FERWERDA_DISPLAY_MAXIMUM = ${ShaderSource.formatFloat(this._parameters.displayMaximumLuminance)};`;
	}

	_composeBlock(celestialSourcesEnabled) {
		const parameter = celestialSourcesEnabled ? ', SpectralValue preDisplayRadiance' : '';
		const radiance = celestialSourcesEnabled ? 'preDisplayRadiance' : 'state.pathRadiance';
		return `vec3 ferwerdaSpectralRadianceToLinearSrgb(SpectralValue value) {
	vec3 result = vec3(0.0);
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		result.r += value.channels[channelIndex] * DISPLAY_LINEAR_SRGB_R_BY_CHANNEL[channelIndex];
		result.g += value.channels[channelIndex] * DISPLAY_LINEAR_SRGB_G_BY_CHANNEL[channelIndex];
		result.b += value.channels[channelIndex] * DISPLAY_LINEAR_SRGB_B_BY_CHANNEL[channelIndex];
	}
	return result;
}

vec3 ferwerdaTransmittanceToRgbBands(SpectralValue value) {
	float red = 0.0;
	for (int channelIndex = 8; channelIndex < 15; channelIndex += 1) red += value.channels[channelIndex];
	float green = 0.0;
	for (int channelIndex = 4; channelIndex < 9; channelIndex += 1) green += value.channels[channelIndex];
	float blue = 0.0;
	for (int channelIndex = 0; channelIndex < 5; channelIndex += 1) blue += value.channels[channelIndex];
	return vec3(red / 7.0, green / 5.0, blue / 5.0);
}

vec3 ferwerdaDisplayRgbToLinearSrgb(vec3 value) {
	return -log(vec3(1.0) - clamp(value, vec3(0.0), vec3(0.999999))) / DISPLAY_TONE_MAP_K;
}

float ferwerdaRendererLinearChannelToDisplay(float value) {
	float clamped = clamp(value, 0.0, 1.0);
	return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * pow(clamped, 1.0 / 2.4) - 0.055;
}

vec3 ferwerdaRendererLinearToDisplay(vec3 value) {
	vec3 positive = max(value, vec3(0.0));
	float peak = max(max(positive.r, positive.g), positive.b);
	vec3 bounded = peak > 1.0 ? positive / peak : positive;
	return vec3(
		ferwerdaRendererLinearChannelToDisplay(bounded.r),
		ferwerdaRendererLinearChannelToDisplay(bounded.g),
		ferwerdaRendererLinearChannelToDisplay(bounded.b)
	);
}

bool ferwerdaShouldApplySceneTransmittance(ShaderState state) {
	return state.bounds.hasSceneEndpoint
		&& state.bounds.endpointDistanceMeters <= state.bounds.endDistanceMeters + 0.001;
}

vec3 composeFerwerdaSceneLinearSrgb(ShaderState state${parameter}) {
	vec3 path = ferwerdaSpectralRadianceToLinearSrgb(${radiance});
	vec3 scene = max(state.sceneDisplayRgb, vec3(0.0))
		* max(uFerwerdaSceneLuminanceScale, 0.0);
	vec3 sceneTransmittance = ferwerdaShouldApplySceneTransmittance(state)
		? ferwerdaTransmittanceToRgbBands(state.transmittance)
		: vec3(1.0);
	return path + scene * sceneTransmittance;
}`;
	}

	_encodeBlock() {
		return `float ferwerdaPhotopicThresholdRuntime(float adaptationLuminance) {
	float logarithmicLuminance = log(adaptationLuminance) / log(10.0);
	float logarithmicThreshold;
	if (logarithmicLuminance <= -2.6) logarithmicThreshold = -0.72;
	else if (logarithmicLuminance >= 1.9) logarithmicThreshold = logarithmicLuminance - 1.255;
	else logarithmicThreshold = pow(0.249 * logarithmicLuminance + 0.65, 2.7) - 0.72;
	return pow(10.0, logarithmicThreshold);
}

float ferwerdaScotopicThresholdRuntime(float adaptationLuminance) {
	float logarithmicLuminance = log(adaptationLuminance) / log(10.0);
	float logarithmicThreshold;
	if (logarithmicLuminance <= -3.94) logarithmicThreshold = -2.86;
	else if (logarithmicLuminance >= -1.44) logarithmicThreshold = logarithmicLuminance - 0.395;
	else logarithmicThreshold = pow(0.405 * logarithmicLuminance + 1.6, 2.18) - 2.86;
	return pow(10.0, logarithmicThreshold);
}

vec4 encodeFerwerdaDisplayOutput(vec3 linearSrgb) {
	vec3 positive = max(linearSrgb, vec3(0.0));
	float luminance = dot(positive, vec3(0.2126, 0.7152, 0.0722));
	float worldAdaptation = max(uFerwerdaWorldAdaptationLuminance, FERWERDA_ADAPTATION_EPSILON);
	float coneScale = FERWERDA_DISPLAY_PHOTOPIC_THRESHOLD / ferwerdaPhotopicThresholdRuntime(worldAdaptation);
	float rodScale = FERWERDA_DISPLAY_PHOTOPIC_THRESHOLD / ferwerdaScotopicThresholdRuntime(worldAdaptation);
	float rodBlend = max(0.0, (100.0 - worldAdaptation / 4.0) / (100.0 + worldAdaptation));
	vec3 cone = coneScale * positive;
	vec3 rod = vec3(rodScale * rodBlend * luminance);
	vec3 normalized = clamp((cone + rod) / FERWERDA_DISPLAY_MAXIMUM, vec3(0.0), vec3(1.0));
	return vec4(
		ferwerdaRendererLinearChannelToDisplay(normalized.r),
		ferwerdaRendererLinearChannelToDisplay(normalized.g),
		ferwerdaRendererLinearChannelToDisplay(normalized.b),
		1.0
	);
}`;
	}

	createShaderContribution(request) {
		if (request.model.profile.spectral.basis.contentHash !== NATIVE_15_SPECTRAL_BASIS.contentHash) {
			throw new TypeError('Ferwerda Color shader requires the native-15 spectral basis.');
		}
		const hasCelestialComposition = request.model.celestialSources !== null;
		const argumentsSource = hasCelestialComposition ? 'state, preDisplayRadiance' : 'state';
		return ShaderContributions.createShaderContribution({
			id: 'color-ferwerda-steady-state-display',
			owner: 'color',
			provides: ['color.composeSceneColor', 'color.encodeOutput'],
			requires: [
				'runtime.initialState',
				hasCelestialComposition ? 'composition.composeSpectralRadiance' : 'transport.evaluatePathRadiance',
			],
			uniforms: [
				ShaderContributions.createShaderUniformDeclaration(
					'uFerwerdaWorldAdaptationLuminance',
					'float',
					'color.brightnessProxy',
					this._adaptation.luminance.value,
				),
				ShaderContributions.createShaderUniformDeclaration(
					'uFerwerdaSceneLuminanceScale',
					'float',
					'color.sceneLuminanceScale',
					this._adaptation.luminance.value,
				),
			],
			bindingRequirements: [
				ShaderContributions.createShaderBindingRequirement(
					'color.brightness-proxy',
					'color',
					'uniform',
					'frame',
					'color.brightnessProxy',
					false,
				),
				ShaderContributions.createShaderBindingRequirement(
					'color.scene-luminance-scale',
					'color',
					'uniform',
					'frame',
					'color.sceneLuminanceScale',
					false,
				),
			],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'color-ferwerda-constants',
					'declareConstants',
					0,
					this._projectionConstantsBlock(),
				),
				ShaderContributions.createShaderSourceBlock(
					'color-ferwerda-compose',
					'composeSceneColor',
					0,
					this._composeBlock(hasCelestialComposition),
				),
				ShaderContributions.createShaderSourceBlock(
					'color-ferwerda-encode',
					'encodeOutput',
					0,
					this._encodeBlock(),
				),
			],
			mainHooks: [
				ShaderContributions.createShaderSourceBlock(
					'color-ferwerda-main-compose',
					'composeSceneColor',
					0,
					`state.outputRgba = encodeFerwerdaDisplayOutput(composeFerwerdaSceneLinearSrgb(${argumentsSource}));`,
				),
				ShaderContributions.createShaderSourceBlock(
					'color-ferwerda-main-output',
					'encodeOutput',
					0,
					'outColor = state.outputRgba;',
				),
			],
			diagnostics: {
				mode: this.id,
				adaptationKind: this._adaptation.kind,
				adaptationProvenanceId: this._adaptation.provenanceId,
				worldAdaptationLuminance: this._parameters.worldAdaptationLuminance,
				displayMaximumLuminance: this._parameters.displayMaximumLuminance,
				displayAdaptationLuminance: this._parameters.displayAdaptationLuminance,
				response: 'steady-state-cone-plus-achromatic-rod',
				outputTransfer: 'standard-srgb-oetf',
			},
		});
	}
}
