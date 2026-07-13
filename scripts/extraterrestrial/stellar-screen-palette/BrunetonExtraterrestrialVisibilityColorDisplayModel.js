import {BrunetonColorDisplayModel} from '../candidate/src/algorithm32/color/BrunetonColorDisplayModel.js';
import {
	createShaderSourceBlock,
	formatShaderFloat,
} from '../candidate/src/algorithm32/shader/shaderContribution.js';
import {BrunetonSourceExposureCurve} from './BrunetonSourceExposureCurve.js';

const COLOR_MAIN_COMPOSE_BLOCK_ID = 'color-main-compose';
const ENCODE_FUNCTION_NAME = 'encodeBrunetonExtraterrestrialVisibility';
const REC709_LUMINANCE = [0.2126, 0.7152, 0.0722];

/**
 * Leave five percent of peak display capacity available after the external
 * contribution. This is one display policy for every source, location, and
 * light condition rather than a scene classification.
 */
export const DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM = 0.95;

// An eighth-power soft maximum is effectively linear away from the display
// boundary while remaining smooth, finite, and strictly increasing.
const DISPLAY_HEADROOM_SHOULDER_POWER = 8;

function requireLinearSrgb(value, name) {
	if (!Array.isArray(value)
		|| value.length !== 3
		|| !value.every(Number.isFinite)) {
		throw new TypeError(`${name} must contain three finite channels.`);
	}

	return value;
}

/**
 * Keep atmospheric path and renderer-scene appearance on exact Bruneton while
 * exposing every already-transported extraterrestrial boundary contribution
 * through one source-derived, chroma-preserving exposure.
 */
export class BrunetonExtraterrestrialVisibilityColorDisplayModel
	extends BrunetonColorDisplayModel {
	constructor({
		sourceDerivedLocalLuminance,
		sourceExposureCurve,
		extraterrestrialDisplayHeadroom =
			DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM,
		...configuration
	}) {
		super(configuration);
		if (!Number.isFinite(sourceDerivedLocalLuminance)
			|| sourceDerivedLocalLuminance < 0) {
			throw new RangeError(
				'Source-derived local luminance must be finite and nonnegative.',
			);
		}
		if (!Number.isFinite(extraterrestrialDisplayHeadroom)
			|| extraterrestrialDisplayHeadroom <= 0
			|| extraterrestrialDisplayHeadroom >= 1) {
			throw new RangeError(
				'Extraterrestrial display headroom must be finite and in (0, 1).',
			);
		}

		this.sourceDerivedLocalLuminance = sourceDerivedLocalLuminance;
		this.sourceExposureCurve = new BrunetonSourceExposureCurve(
			sourceExposureCurve,
		);
		this.exposureGain = this.sourceExposureCurve.derive(
			sourceDerivedLocalLuminance,
		);
		this.extraterrestrialDisplayHeadroom =
			extraterrestrialDisplayHeadroom;
	}

	get id() {
		return BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID;
	}

	/**
	 * Bind every compile-time extraterrestrial-response input into the Color
	 * descriptor used for shader compatibility and reuse.
	 */
	describeDisplayConversion() {
		const base = super.describeDisplayConversion();
		return {
			...base,
			toneMapping:
				'paper-figure1-base-plus-source-conditioned-extraterrestrial-shoulder',
			metadata: {
				...base.metadata,
				extraterrestrialVisibility: {
					inputLedger:
						'already-atmosphere-transported-celestial-radiance',
					responseCoordinate: 'rec709-photopic-luminance',
					sourceDerivedLocalLuminance:
						this.sourceDerivedLocalLuminance,
					sourceExposureCurve: {
						...this.sourceExposureCurve.configuration,
					},
					exposureGain: this.exposureGain,
					displayHeadroom: this.extraterrestrialDisplayHeadroom,
					displayShoulderPower:
						DISPLAY_HEADROOM_SHOULDER_POWER,
					composition: 'bounded-display-screen-blend',
				},
			},
		};
	}

	/**
	 * Evaluate the exact CPU form of the external-ledger response.
	 *
	 * Photopic luminance owns the response coordinate. One common RGB scale
	 * therefore preserves chroma and makes output luminance strictly monotone
	 * until the smooth display-headroom shoulder becomes material.
	 */
	auditExtraterrestrialLinearSrgb(linearSrgb) {
		const accepted = requireLinearSrgb(
			linearSrgb,
			'auditExtraterrestrialLinearSrgb',
		);
		const positiveLinearSrgb = accepted.map((value) => Math.max(value, 0));
		const inputPhotopicLuminance = positiveLinearSrgb.reduce(
			(sum, value, channel) => sum + value * REC709_LUMINANCE[channel],
			0,
		);
		if (inputPhotopicLuminance <= 0) {
			return {
				positiveLinearSrgb,
				inputPhotopicLuminance: 0,
				mappedPhotopicLuminance: 0,
				exposedLinearSrgb: [0, 0, 0],
				exposedPeak: 0,
				headroomScale: 1,
				displayLinearSrgb: [0, 0, 0],
			};
		}

		const mappedPhotopicLuminance = 1 - Math.exp(
			-inputPhotopicLuminance
				* this.displayConstants.paperFigure1ToneMapK
				* this.exposureGain,
		);
		const luminanceScale =
			mappedPhotopicLuminance / inputPhotopicLuminance;
		const exposedLinearSrgb = positiveLinearSrgb.map(
			(value) => value * luminanceScale,
		);
		const exposedPeak = Math.max(...exposedLinearSrgb);
		const normalizedPeak =
			exposedPeak / this.extraterrestrialDisplayHeadroom;
		const headroomScale = (
			1 + normalizedPeak ** DISPLAY_HEADROOM_SHOULDER_POWER
		) ** (-1 / DISPLAY_HEADROOM_SHOULDER_POWER);
		const displayLinearSrgb = exposedLinearSrgb.map(
			(value) => value * headroomScale,
		);

		return {
			positiveLinearSrgb,
			inputPhotopicLuminance,
			mappedPhotopicLuminance,
			exposedLinearSrgb,
			exposedPeak,
			headroomScale,
			displayLinearSrgb,
		};
	}

	/** Map one already-transported external RGB contribution on the CPU. */
	mapExtraterrestrialLinearSrgbToDisplay(linearSrgb) {
		return this.auditExtraterrestrialLinearSrgb(linearSrgb)
			.displayLinearSrgb;
	}

	/**
	 * Mirror the shader's display-space screen composition from a completed
	 * Bruneton base-linear value and one already-transported external value.
	 */
	composeExtraterrestrialVisibilityDisplayRgb({
		baseLinearSrgb,
		extraterrestrialLinearSrgb,
	}) {
		const baseDisplaySrgb = this.linearSrgbToDisplayRgb(
			requireLinearSrgb(
				baseLinearSrgb,
				'composeExtraterrestrialVisibilityDisplayRgb.baseLinearSrgb',
			),
		);
		const extraterrestrialDisplaySrgb =
			this.mapExtraterrestrialLinearSrgbToDisplay(
				requireLinearSrgb(
					extraterrestrialLinearSrgb,
					'composeExtraterrestrialVisibilityDisplayRgb.extraterrestrialLinearSrgb',
				),
			);
		if (extraterrestrialDisplaySrgb.every((value) => value === 0)) {
			return baseDisplaySrgb;
		}

		return baseDisplaySrgb.map(
			(value, channel) => value
				+ (1 - value) * extraterrestrialDisplaySrgb[channel],
		);
	}

	/** Build the two-ledger Color helper without changing transport/composition. */
	_boundaryAwareDisplayBlock() {
		return `vec4 ${ENCODE_FUNCTION_NAME}(ShaderState state) {
	vec3 pathLinearSrgb = spectralRadianceToLinearSrgb(state.pathRadiance);
	vec3 sceneLinearSrgb = max(state.sceneLinearSrgb, vec3(0.0));
	vec3 transmittanceRgb = spectralTransmittanceToRgbBands(state.transmittance);
	vec3 sceneTransmittanceRgb = shouldApplySceneTransmittance(state)
		? transmittanceRgb
		: vec3(1.0);
	vec3 baseLinearSrgb = pathLinearSrgb
		+ sceneLinearSrgb * sceneTransmittanceRgb;
	vec3 baseDisplaySrgb = mapSceneLinearSrgbToDisplay(baseLinearSrgb);

	// state.celestialRadiance already includes atmosphere transport. Applying
	// state.transmittance here would attenuate the external boundary twice.
	vec3 extraterrestrialLinearSrgb = max(
		spectralRadianceToLinearSrgb(state.celestialRadiance),
		vec3(0.0)
	);
	float extraterrestrialLuminance = dot(
		extraterrestrialLinearSrgb,
		vec3(0.2126, 0.7152, 0.0722)
	);
	if (extraterrestrialLuminance <= 0.0) {
		return vec4(baseDisplaySrgb, 1.0);
	}

	float mappedExtraterrestrialLuminance = 1.0 - exp(
		-extraterrestrialLuminance
		* DISPLAY_TONE_MAP_K
		* SOURCE_DERIVED_EXPOSURE_GAIN
	);
	vec3 exposedExtraterrestrialSrgb = extraterrestrialLinearSrgb
		* (mappedExtraterrestrialLuminance / extraterrestrialLuminance);
	float exposedExtraterrestrialPeak = max(
		exposedExtraterrestrialSrgb.r,
		max(exposedExtraterrestrialSrgb.g, exposedExtraterrestrialSrgb.b)
	);
	float normalizedExtraterrestrialPeak =
		exposedExtraterrestrialPeak / EXTRATERRESTRIAL_DISPLAY_HEADROOM;
	float extraterrestrialHeadroomScale = pow(
		1.0 + pow(
			normalizedExtraterrestrialPeak,
			EXTRATERRESTRIAL_DISPLAY_SHOULDER_POWER
		),
		-1.0 / EXTRATERRESTRIAL_DISPLAY_SHOULDER_POWER
	);
	vec3 extraterrestrialDisplaySrgb = exposedExtraterrestrialSrgb
		* extraterrestrialHeadroomScale;
	vec3 displaySrgb = baseDisplaySrgb
		+ (vec3(1.0) - baseDisplaySrgb) * extraterrestrialDisplaySrgb;

	return vec4(displaySrgb, 1.0);
}`;
	}

	createShaderContribution(request) {
		const contribution = super.createShaderContribution(request);
		const functions = [
			...contribution.functions,
			createShaderSourceBlock(
				'color-bruneton-extraterrestrial-visibility-constants',
				'declareConstants',
				1,
				`const float SOURCE_DERIVED_EXPOSURE_GAIN = ${formatShaderFloat(this.exposureGain)};
const float EXTRATERRESTRIAL_DISPLAY_HEADROOM = ${formatShaderFloat(this.extraterrestrialDisplayHeadroom)};
const float EXTRATERRESTRIAL_DISPLAY_SHOULDER_POWER = ${formatShaderFloat(DISPLAY_HEADROOM_SHOULDER_POWER)};`,
			),
			createShaderSourceBlock(
				'color-bruneton-extraterrestrial-visibility-compose',
				'encodeOutput',
				1,
				this._boundaryAwareDisplayBlock(),
			),
		];
		const mainHooks = contribution.mainHooks.map((block) =>
			block.id === COLOR_MAIN_COMPOSE_BLOCK_ID
				? createShaderSourceBlock(
					block.id,
					block.slot,
					block.order,
					`state.outputRgba = ${ENCODE_FUNCTION_NAME}(state);`,
				)
				: block);

		return {
			...contribution,
			id: 'color-bruneton-extraterrestrial-visibility-display',
			functions,
			mainHooks,
			diagnostics: {
				...contribution.diagnostics,
				displayAdaptation: 'source-derived-extraterrestrial-exposure',
				exposureGain: this.exposureGain,
				extraterrestrialResponseCoordinate: 'rec709-photopic-luminance',
				extraterrestrialDisplayHeadroom:
					this.extraterrestrialDisplayHeadroom,
				extraterrestrialDisplayShoulder:
					`eighth-power-smooth-maximum`,
				extraterrestrialInput: 'already-atmosphere-transported-celestial-radiance',
				composition: 'bounded-display-screen-blend',
			},
		};
	}
}

export const BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID =
	'bruneton-extraterrestrial-visibility-color-v2';
