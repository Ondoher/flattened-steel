import {NATIVE_15_SPECTRAL_BASIS} from '../../profiles/index.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	SpectralPacket as SpectralPacketClass,
	UnitMath,
} from '../../spectral-values/index.js';
import {ShaderContributions} from '../../shader-assembly/base/ShaderContributions.js';
import {ShaderSource} from '../../shader-assembly/base/ShaderSource.js';
import ScalarMath from '../../math/ScalarMath.js';
import {
	CIE_1931_2_DEG_SOURCE_ROWS,
	FIGURE1_DISPLAY_CONSTANTS,
	SKY_EXPOSURE_ADAPTING_FIELD_AREA_SQUARE_DEGREES,
	SKY_EXPOSURE_MAXIMUM_FACTOR,
	SKY_EXPOSURE_MAXIMUM_DELTA_TIME_SECONDS,
	SKY_EXPOSURE_MIDDLE_GRAY_RESPONSE,
	SKY_EXPOSURE_MINIMUM_FACTOR,
	SKY_EXPOSURE_PUPIL_FLUX_EXPONENT,
	SKY_EXPOSURE_INCREASING_TIME_CONSTANT_SECONDS,
	SKY_EXPOSURE_REFERENCE_DIFFUSE_REFLECTANCE,
	SKY_EXPOSURE_REFERENCE_OBSERVER_AGE_YEARS,
	SKY_EXPOSURE_REDUCING_TIME_CONSTANT_SECONDS,
} from './consts.js';

/**
 * Converts completed Algorithm32 spectral radiance through the accepted E8 spectral-to-display boundary and composes captured scene RGB exactly as the pinned production display model does.
 *
 * @implements {Color}
 */
export class BrunetonColorDisplayModel {
	/**
	 * Creates the display model.
	 *
	 * @param {BrunetonColorDisplayModelConfiguration} [configuration] - Supplies optional display constants.
	 *
	 */
	constructor(configuration = {}) {
		this._displayConstants = this._acceptDisplayConstants(
			configuration.displayConstants === undefined ? FIGURE1_DISPLAY_CONSTANTS : configuration.displayConstants,
		);
		this._displayLinearSrgbByChannel = this._buildDisplayLinearSrgbByChannel(NATIVE_15_SPECTRAL_BASIS);
	}

	/**
	 * Value that stores the accepted display constants.
	 *
	 * @type {Figure1DisplayConstants}
	 *
	 */
	_displayConstants;

	/**
	 * Value that stores the native-15 linear-sRGB projection rows.
	 *
	 * @type {BrunetonLinearSrgbChannelWeights}
	 *
	 */
	_displayLinearSrgbByChannel;

	/**
	 * Value that identifies this configured color conversion instance.
	 *
	 * @returns {string} - Return the color conversion id.
	 */
	get id() {
		return 'bruneton-figure1-display';
	}

	/**
	 * Value that returns the accepted display constants.
	 *
	 * @returns {Figure1DisplayConstants} - Return the display constants.
	 */
	get displayConstants() {
		return this._displayConstants;
	}

	/**
	 * Called by bruneton color display model to accept a display-constant packet at the class boundary.
	 *
	 * @param {unknown} value - Supplies the candidate constants.
	 * @returns {Figure1DisplayConstants} - Return accepted constants.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_acceptDisplayConstants(value) {
		const constants = /** @type {Figure1DisplayConstants} */ (value);
		UnitMath.assertUnitValue(constants.maxLuminousEfficacy, 'maxLuminousEfficacy');
		if (constants.maxLuminousEfficacy.units !== 'lumens-per-watt') {
			throw new TypeError('maxLuminousEfficacy.units must be "lumens-per-watt".');
		}
		if (!Number.isFinite(constants.paperFigure1ToneMapK) || constants.paperFigure1ToneMapK <= 0) {
			throw new RangeError('paperFigure1ToneMapK must be positive and finite.');
		}
		if (!Array.isArray(constants.xyzToLinearSrgbMatrix) || constants.xyzToLinearSrgbMatrix.length !== 3) {
			throw new TypeError('xyzToLinearSrgbMatrix must contain three rows.');
		}

		const matrix = [];
		for (const row of constants.xyzToLinearSrgbMatrix) {
			if (!Array.isArray(row) || row.length !== 3 || !row.every(Number.isFinite)) {
				throw new TypeError('xyzToLinearSrgbMatrix rows must contain three finite values.');
			}
			matrix.push([row[0], row[1], row[2]]);
		}

		return /** @type {Figure1DisplayConstants} */ (
			/** @type {unknown} */ ({
				...constants,
				maxLuminousEfficacy: {...constants.maxLuminousEfficacy},
				xyzToLinearSrgbMatrix: matrix,
			})
		);
	}

	/**
	 * Called by bruneton color display model to accept spectral radiance on the canonical display basis.
	 *
	 * @param {unknown} value - Supplies the candidate.
	 * @returns {SpectralRadiancePacket} - Return accepted radiance.
	 */
	_acceptSpectralRadiance(value) {
		return /** @type {SpectralRadiancePacket} */ (
			SpectralPacketClass.assert(value, {
				quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
				units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			})
		);
	}

	/**
	 * Called by bruneton color display model to accept spectral transmittance on the canonical display basis.
	 *
	 * @param {unknown} value - Supplies the candidate.
	 * @returns {SpectralTransmittancePacket} - Return accepted transmittance.
	 */
	_acceptSpectralTransmittance(value) {
		return /** @type {SpectralTransmittancePacket} */ (
			SpectralPacketClass.assert(value, {
				quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
				units: SPECTRAL_UNITS.DIMENSIONLESS,
			})
		);
	}

	/**
	 * Called by bruneton color display model to average one nonempty trusted numerical collection.
	 *
	 * @param {readonly number[]} values - Supplies values to average.
	 * @returns {number} - Return their arithmetic mean.
	 */
	_average(values) {
		let sum = 0;

		for (const value of values) {
			sum += value;
		}

		return sum / values.length;
	}

	/**
	 * Called by bruneton color display model to apply the standard sRGB display transfer to one renderer-linear channel. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {number} value - Supplies a renderer-linear channel.
	 * @returns {number} - Return display-encoded RGB.
	 */
	_rendererLinearSrgbChannelToDisplayRgb(value) {
		const clamped = ScalarMath.clamp(value, 0, 1);

		if (clamped <= 0.0031308) {
			return clamped * 12.92;
		}

		return 1.055 * clamped ** (1 / 2.4) - 0.055;
	}

	/**
	 * Called by bruneton color display model to invert the Figure 1 exponential bridge for one display channel.
	 *
	 * @param {number} value - Supplies one display-encoded channel.
	 * @returns {number} - Return the production linear-sRGB proxy channel.
	 */
	_displayRgbChannelToLinearSrgb(value) {
		const clamped = ScalarMath.clamp(value, 0, 0.999999);

		return -Math.log(1 - clamped) / this._displayConstants.paperFigure1ToneMapK;
	}

	/**
	 * Called by bruneton color display model to interpolate the official 1-nanometer CIE rows at one native channel center. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {number} wavelengthNanometers - Supplies the channel center.
	 * @returns {readonly [number, number, number]} - Return x-bar, y-bar, z-bar.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_cieColorMatchingValuesAt(wavelengthNanometers) {
		const lowerWavelength = Math.floor(wavelengthNanometers);
		const upperWavelength = Math.ceil(wavelengthNanometers);
		let lowerRow = null;
		let upperRow = null;

		for (const row of CIE_1931_2_DEG_SOURCE_ROWS) {
			if (row[0] === lowerWavelength) {
				lowerRow = row;
			}
			if (row[0] === upperWavelength) {
				upperRow = row;
			}
		}

		if (!lowerRow || !upperRow) {
			throw new RangeError(`CIE source rows do not bracket ${wavelengthNanometers} nanometers.`);
		}
		if (lowerWavelength === upperWavelength) {
			return [lowerRow[1], lowerRow[2], lowerRow[3]];
		}

		const fraction = wavelengthNanometers - lowerWavelength;

		return [
			lowerRow[1] + (upperRow[1] - lowerRow[1]) * fraction,
			lowerRow[2] + (upperRow[2] - lowerRow[2]) * fraction,
			lowerRow[3] + (upperRow[3] - lowerRow[3]) * fraction,
		];
	}

	/**
	 * Called by bruneton color display model to project trusted native-15 radiance values to linear sRGB. The channel widths are applied exactly once. The matching values were interpolated from the official 1-nanometer CIE table at the native bin centers and are then scaled by 683 lm/W and the declared matrix.
	 *
	 * @param {readonly number[]} radiance - Supplies trusted basis-aligned values.
	 * @param {SpectralBasisValue} basis - Supplies the spectral coordinates.
	 * @returns {readonly [number, number, number]} - Return linear sRGB values.
	 */
	_spectralRadianceValuesToLinearSrgb(radiance, basis) {
		let cieXValue = 0;
		let cieYValue = 0;
		let cieZValue = 0;

		for (let channelIndex = 0; channelIndex < basis.channelCount; channelIndex += 1) {
			const channel = basis.channels[channelIndex];
			const widthNanometers = channel.width.value;
			const matching = this._cieColorMatchingValuesAt(channel.center.value);
			const weightedRadiance = radiance[channelIndex] * widthNanometers;

			cieXValue += matching[0] * weightedRadiance;
			cieYValue += matching[1] * weightedRadiance;
			cieZValue += matching[2] * weightedRadiance;
		}

		const matrix = this._displayConstants.xyzToLinearSrgbMatrix;
		const efficacy = this._displayConstants.maxLuminousEfficacy.value;

		return [
			efficacy * (matrix[0][0] * cieXValue + matrix[0][1] * cieYValue + matrix[0][2] * cieZValue),
			efficacy * (matrix[1][0] * cieXValue + matrix[1][1] * cieYValue + matrix[1][2] * cieZValue),
			efficacy * (matrix[2][0] * cieXValue + matrix[2][1] * cieYValue + matrix[2][2] * cieZValue),
		];
	}

	/**
	 * Called by bruneton color display model to build the exact per-channel projection weights embedded in GLSL.
	 *
	 * @param {SpectralBasisValue} basis - Supplies the spectral coordinates.
	 * @returns {BrunetonLinearSrgbChannelWeights} - Return row weights.
	 */
	_buildDisplayLinearSrgbByChannel(basis) {
		const rows = {
			r: [],
			g: [],
			b: [],
		};

		for (let channelIndex = 0; channelIndex < basis.channelCount; channelIndex += 1) {
			const basisPacket = new Array(basis.channelCount).fill(0);
			basisPacket[channelIndex] = 1;
			const response = this._spectralRadianceValuesToLinearSrgb(basisPacket, basis);

			rows.r.push(response[0]);
			rows.g.push(response[1]);
			rows.b.push(response[2]);
		}

		return rows;
	}

	/**
	 * Called by BrunetonColorDisplayModel to build the CIE 1931 photopic-luminance projection weights for one basis.
	 *
	 * @param {SpectralBasisValue} basis - Supplies the spectral coordinates and channel widths.
	 * @returns {readonly number[]} - Candela-per-square-meter response per unit spectral-radiance channel.
	 */
	_buildPhotopicLuminanceByChannel(basis) {
		const efficacy = this._displayConstants.maxLuminousEfficacy.value;

		return basis.channels.map(
			/**
			 * Called by Array.prototype.map to derive one channel's photopic response.
			 * @param channel - The basis channel with center and width in nanometers.
			 * @returns - The channel's CIE y-bar times width and luminous efficacy.
			 */ (channel) => efficacy * this._cieColorMatchingValuesAt(channel.center.value)[1] * channel.width.value,
		);
	}

	/**
	 * Called by BrunetonColorDisplayModel to project trusted basis-aligned radiance to photopic luminance.
	 *
	 * @param {readonly number[]} radiance - Supplies trusted spectral-radiance density values.
	 * @param {SpectralBasisValue} basis - Supplies the spectral coordinates and channel widths.
	 * @returns {number} - Photopic luminance in candelas per square meter.
	 */
	_spectralRadianceValuesToPhotopicLuminance(radiance, basis) {
		const weights = this._buildPhotopicLuminanceByChannel(basis);
		let luminance = 0;

		for (let channelIndex = 0; channelIndex < basis.channelCount; channelIndex += 1) {
			luminance += radiance[channelIndex] * weights[channelIndex];
		}

		return luminance;
	}

	/**
	 * Called by bruneton color display model to apply the reference Figure 1
	 * exponential mapping to one linear channel.
	 *
	 * @param {number} value - Supplies one linear-sRGB channel.
	 * @param {number} [displayCoefficient] - Supplies the effective Figure 1 coefficient.
	 * @returns {number} - Return one Figure 1 output channel.
	 */
	_mapLinearSrgbChannelToDisplay(value, displayCoefficient = this._displayConstants.paperFigure1ToneMapK) {
		return ScalarMath.clamp(1 - Math.exp(-Math.max(0, value) * displayCoefficient), 0, 1);
	}

	/**
	 * Called by bruneton color display model to build the display constants GLSL block.
	 *
	 * @param {SpectralBasisValue} basis - Supplies spectral coordinates.
	 * @param {BrunetonLinearSrgbChannelWeights} weights - Supplies projection rows.
	 * @returns {string} - Return GLSL source.
	 */
	_displayConstantsBlock(basis, weights, photopicWeights) {
		const channelCount = basis.channelCount;

		return `const float DISPLAY_TONE_MAP_K = ${ShaderSource.formatFloat(this._displayConstants.paperFigure1ToneMapK)};
const float DISPLAY_LINEAR_SRGB_R_BY_CHANNEL[${channelCount}] = float[${channelCount}](${ShaderSource.formatFloatArray(weights.r)});
const float DISPLAY_LINEAR_SRGB_G_BY_CHANNEL[${channelCount}] = float[${channelCount}](${ShaderSource.formatFloatArray(weights.g)});
const float DISPLAY_LINEAR_SRGB_B_BY_CHANNEL[${channelCount}] = float[${channelCount}](${ShaderSource.formatFloatArray(weights.b)});
const float DISPLAY_PHOTOPIC_LUMINANCE_BY_CHANNEL[${channelCount}] = float[${channelCount}](${ShaderSource.formatFloatArray(photopicWeights)});`;
	}

	/**
	 * Called by bruneton color display model to build the production captured-scene composition and projection block.
	 *
	 * @param {SpectralBasisValue} basis - Supplies spectral coordinates.
	 * @returns {string} - Return GLSL source.
	 */
	_displayComposeBlock(basis, celestialSourcesEnabled) {
		const radianceParameter = celestialSourcesEnabled ? ', SpectralValue preDisplayRadiance' : '';
		const spectralRadianceExpression = celestialSourcesEnabled ? 'preDisplayRadiance' : 'state.pathRadiance';
		const transmittanceBlock =
			basis.contentHash === NATIVE_15_SPECTRAL_BASIS.contentHash
				? `vec3 spectralTransmittanceToRgbBands(SpectralValue transmittance) {
	float redBandTotal = 0.0;
	for (int channelIndex = 8; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		redBandTotal += transmittance.channels[channelIndex];
	}
	float green = 0.0;
	for (int channelIndex = 4; channelIndex < 9; channelIndex += 1) {
		green += transmittance.channels[channelIndex];
	}
	float blue = 0.0;
	for (int channelIndex = 0; channelIndex < 5; channelIndex += 1) {
		blue += transmittance.channels[channelIndex];
	}
	return vec3(redBandTotal / 7.0, green / 5.0, blue / 5.0);
}`
				: this._wavelengthDrivenTransmittanceBlock(basis);
		return `vec3 spectralRadianceToLinearSrgb(SpectralValue radiance) {
	vec3 linearSrgb = vec3(0.0);
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		linearSrgb.r += radiance.channels[channelIndex] * DISPLAY_LINEAR_SRGB_R_BY_CHANNEL[channelIndex];
		linearSrgb.g += radiance.channels[channelIndex] * DISPLAY_LINEAR_SRGB_G_BY_CHANNEL[channelIndex];
		linearSrgb.b += radiance.channels[channelIndex] * DISPLAY_LINEAR_SRGB_B_BY_CHANNEL[channelIndex];
	}
	return linearSrgb;
}

float spectralRadianceToPhotopicLuminance(SpectralValue radiance) {
	float luminance = 0.0;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		luminance += radiance.channels[channelIndex] * DISPLAY_PHOTOPIC_LUMINANCE_BY_CHANNEL[channelIndex];
	}
	return luminance;
}

${transmittanceBlock}

vec3 displayRgbToLinearSrgb(vec3 displayRgb) {
	vec3 clamped = clamp(displayRgb, vec3(0.0), vec3(0.999999));
	return -log(vec3(1.0) - clamped) / DISPLAY_TONE_MAP_K;
}

float rendererLinearSrgbChannelToDisplayRgb(float value) {
	float clamped = clamp(value, 0.0, 1.0);
	if (clamped <= 0.0031308) {
		return clamped * 12.92;
	}
	return 1.055 * pow(clamped, 1.0 / 2.4) - 0.055;
}

vec3 rendererLinearSrgbToDisplayRgb(vec3 linearSrgb) {
	vec3 nonnegative = max(linearSrgb, vec3(0.0));
	float peakChannel = max(max(nonnegative.r, nonnegative.g), nonnegative.b);
	vec3 bounded = peakChannel > 1.0 ? nonnegative / peakChannel : nonnegative;
	return vec3(
		rendererLinearSrgbChannelToDisplayRgb(bounded.r),
		rendererLinearSrgbChannelToDisplayRgb(bounded.g),
		rendererLinearSrgbChannelToDisplayRgb(bounded.b)
	);
}

bool shouldApplySceneTransmittance(ShaderState state) {
	return state.bounds.hasSceneEndpoint
		&& state.bounds.endpointDistanceMeters <= state.bounds.endDistanceMeters + 0.001;
}

vec3 composeSceneLinearSrgb(ShaderState state${radianceParameter}) {
	vec3 pathLinearSrgb = spectralRadianceToLinearSrgb(${spectralRadianceExpression});
	vec3 sceneDisplayRgb = rendererLinearSrgbToDisplayRgb(state.sceneDisplayRgb);
	vec3 sceneLinearSrgb = displayRgbToLinearSrgb(sceneDisplayRgb);
	vec3 transmittanceRgb = spectralTransmittanceToRgbBands(state.transmittance);
	vec3 sceneTransmittanceRgb = shouldApplySceneTransmittance(state) ? transmittanceRgb : vec3(1.0);
	return pathLinearSrgb + sceneLinearSrgb * sceneTransmittanceRgb;
}`;
	}

	/**
	 * Build a wavelength-selected RGB transmittance projection for a non-native basis.
	 * @param {SpectralBasisValue} basis - Supplies spectral coordinates.
	 * @returns {string} - GLSL projection block.
	 */
	_wavelengthDrivenTransmittanceBlock(basis) {
		const band = (minimum, maximum) =>
			basis.channels
				.map((channel, index) => ({index, wavelength: channel.center.value}))
				.filter(({wavelength}) => wavelength >= minimum && wavelength <= maximum)
				.map(({index}) => index);
		const red = band(626.3333333333333, Number.POSITIVE_INFINITY);
		const green = band(501, 626.3333333333333);
		const blue = band(Number.NEGATIVE_INFINITY, 501);
		const sum = (indices) => indices.map((index) => `transmittance.channels[${index}]`).join(' + ');

		return `vec3 spectralTransmittanceToRgbBands(SpectralValue transmittance) {
	return vec3(
		(${sum(red)}) / ${ShaderSource.formatFloat(red.length)},
		(${sum(green)}) / ${ShaderSource.formatFloat(green.length)},
		(${sum(blue)}) / ${ShaderSource.formatFloat(blue.length)}
	);
}`;
	}

	/**
	 * Called by bruneton color display model to build the exposed display output mapping GLSL block.
	 *
	 * @returns {string} - Return GLSL source.
	 */
	_displayEncodeBlock() {
		return `vec4 encodeDisplayOutput(vec3 linearSrgb) {
	vec3 mapped = clamp(
		vec3(1.0) - exp(-max(linearSrgb, vec3(0.0)) * DISPLAY_TONE_MAP_K),
		vec3(0.0),
		vec3(1.0)
	);
	return vec4(mapped, 1.0);
}`;
	}

	/**
	 * Call this method to apply the reference Figure 1 exponential mapping.
	 *
	 * @param {readonly [number, number, number]} linearSrgb - Supplies linear sRGB values.
	 * @returns {readonly [number, number, number]} - Return display values.
	 */
	linearSrgbToDisplayRgb(linearSrgb) {
		return [
			this._mapLinearSrgbChannelToDisplay(linearSrgb[0]),
			this._mapLinearSrgbChannelToDisplay(linearSrgb[1]),
			this._mapLinearSrgbChannelToDisplay(linearSrgb[2]),
		];
	}

	/**
	 * Call this method to apply one shared effective Figure 1 coefficient at the completed scene-linear boundary.
	 *
	 * @param {readonly [number, number, number]} linearSrgb - Supplies completed scene-linear sRGB.
	 * @param {number} effectiveDisplayCoefficient - Supplies the positive shared display coefficient.
	 * @returns {readonly [number, number, number]} - Return display values.
	 * @throws {RangeError} - When the coefficient is not positive and finite.
	 */
	linearSrgbToDisplayRgbWithCoefficient(linearSrgb, effectiveDisplayCoefficient) {
		if (!Number.isFinite(effectiveDisplayCoefficient) || effectiveDisplayCoefficient <= 0) {
			throw new RangeError('effectiveDisplayCoefficient must be positive and finite.');
		}

		return [
			this._mapLinearSrgbChannelToDisplay(linearSrgb[0], effectiveDisplayCoefficient),
			this._mapLinearSrgbChannelToDisplay(linearSrgb[1], effectiveDisplayCoefficient),
			this._mapLinearSrgbChannelToDisplay(linearSrgb[2], effectiveDisplayCoefficient),
		];
	}

	/**
	 * Call this method to bring one renderer-linear highlight into range by uniform peak scaling, preserving its RGB ratios, then apply the production renderer-to-display transfer before the Figure 1 inverse tone-map bridge.
	 *
	 * @param {readonly [number, number, number]} linearSrgb - Supplies renderer linear sRGB.
	 * @returns {readonly [number, number, number]} - Return display-encoded RGB.
	 */
	rendererLinearSrgbToDisplayRgb(linearSrgb) {
		const nonnegative = linearSrgb.map((value) => Math.max(value, 0));
		const peakChannel = Math.max(...nonnegative);
		const bounded = peakChannel > 1 ? nonnegative.map((value) => value / peakChannel) : nonnegative;

		return [
			this._rendererLinearSrgbChannelToDisplayRgb(bounded[0]),
			this._rendererLinearSrgbChannelToDisplayRgb(bounded[1]),
			this._rendererLinearSrgbChannelToDisplayRgb(bounded[2]),
		];
	}

	/**
	 * Call this method to invert the accepted Figure 1 exponential mapping for captured scene composition.
	 *
	 * @param {readonly [number, number, number]} displayRgb - Supplies display RGB.
	 * @returns {readonly [number, number, number]} - Return the production linear-sRGB proxy.
	 */
	displayRgbToLinearSrgb(displayRgb) {
		return [
			this._displayRgbChannelToLinearSrgb(displayRgb[0]),
			this._displayRgbChannelToLinearSrgb(displayRgb[1]),
			this._displayRgbChannelToLinearSrgb(displayRgb[2]),
		];
	}

	/**
	 * Call this method to collapse native spectral transmittance into the production three display bands.
	 *
	 * @param {SpectralTransmittancePacket} transmittance - Supplies native transmittance.
	 * @returns {readonly [number, number, number]} - Return red, green, and blue bands.
	 */
	spectralTransmittanceToRgbBands(transmittance) {
		const packet = this._acceptSpectralTransmittance(transmittance);
		if (packet.basis.contentHash !== NATIVE_15_SPECTRAL_BASIS.contentHash) {
			const valuesInRange = (minimum, maximum) =>
				packet.values.filter((_, index) => {
					const wavelength = packet.basis.channels[index].center.value;
					return wavelength >= minimum && wavelength <= maximum;
				});

			return [
				this._average(valuesInRange(626.3333333333333, Number.POSITIVE_INFINITY)),
				this._average(valuesInRange(501, 626.3333333333333)),
				this._average(valuesInRange(Number.NEGATIVE_INFINITY, 501)),
			];
		}
		return [
			this._average(packet.values.slice(8)),
			this._average(packet.values.slice(4, 9)),
			this._average(packet.values.slice(0, 5)),
		];
	}

	/**
	 * Call this method to convert canonical spectral radiance to linear sRGB through E8.
	 *
	 * @param {SpectralRadiancePacket} radiance - Supplies native spectral radiance.
	 * @returns {readonly [number, number, number]} - Return linear sRGB values.
	 */
	radianceToLinearSrgb(radiance) {
		const packet = this._acceptSpectralRadiance(radiance);

		return this._spectralRadianceValuesToLinearSrgb(packet.values, packet.basis);
	}

	/**
	 * Call this method to convert canonical spectral radiance to CIE 1931 photopic luminance.
	 *
	 * @param {SpectralRadiancePacket} radiance - Supplies basis-aligned spectral radiance density.
	 * @returns {number} - Photopic luminance in candelas per square meter.
	 */
	radianceToPhotopicLuminance(radiance) {
		const packet = this._acceptSpectralRadiance(radiance);
		return this._spectralRadianceValuesToPhotopicLuminance(packet.values, packet.basis);
	}

	/**
	 * Called by BrunetonColorDisplayModel to evaluate Watson and Yellott's 2012 binocular light-adapted pupil formula for the reference-age observer and upper-hemisphere adapting field.
	 *
	 * @param {number} skyIlluminanceLux - Supplies projected upper-sky illuminance.
	 * @returns {number} - Predicted entrance-pupil diameter in millimeters.
	 */
	_resolveSkyExposurePupilDiameter(skyIlluminanceLux) {
		const adaptingLuminanceCandelasPerSquareMeter = skyIlluminanceLux / Math.PI;
		const effectiveCornealFlux =
			adaptingLuminanceCandelasPerSquareMeter * SKY_EXPOSURE_ADAPTING_FIELD_AREA_SQUARE_DEGREES;
		const fluxResponse = effectiveCornealFlux ** SKY_EXPOSURE_PUPIL_FLUX_EXPONENT;
		const observerAgeYears = SKY_EXPOSURE_REFERENCE_OBSERVER_AGE_YEARS;
		const constantNumerator = 18.5172 - 0.105569 * observerAgeYears;
		const fluxNumerator = 0.122165 + 0.000138645 * observerAgeYears;
		if (fluxResponse > 1) {
			const inverseFluxResponse = 1 / fluxResponse;
			return (constantNumerator * inverseFluxResponse + fluxNumerator) / (2 * inverseFluxResponse + 0.0630635);
		}

		return (constantNumerator + fluxNumerator * fluxResponse) / (2 + 0.0630635 * fluxResponse);
	}

	/**
	 * Call this method to derive the instantaneous shared display coefficient from atmospheric sky illuminance.
	 *
	 * @param {number} skyIlluminanceLux - Measured projected upper-sky illuminance.
	 * @returns {SkyExposureCoefficientCalculation} - The clamped exposure calculation.
	 * @throws {RangeError} - When the illuminance is not finite and nonnegative.
	 */
	resolveSkyExposureCoefficient(skyIlluminanceLux) {
		if (!Number.isFinite(skyIlluminanceLux) || skyIlluminanceLux < 0) {
			throw new RangeError('skyIlluminanceLux must be finite and nonnegative.');
		}

		const displayCoefficient = this._displayConstants.paperFigure1ToneMapK;
		const referenceIlluminanceLux =
			(Math.PI * -Math.log(1 - SKY_EXPOSURE_MIDDLE_GRAY_RESPONSE)) /
			(displayCoefficient * SKY_EXPOSURE_REFERENCE_DIFFUSE_REFLECTANCE);
		const illuminanceFloorLux = referenceIlluminanceLux / SKY_EXPOSURE_MAXIMUM_FACTOR;
		const reciprocalExposureFactor = referenceIlluminanceLux / Math.max(skyIlluminanceLux, illuminanceFloorLux);
		const referencePupilDiameterMillimeters = this._resolveSkyExposurePupilDiameter(referenceIlluminanceLux);
		const pupilDiameterMillimeters = this._resolveSkyExposurePupilDiameter(skyIlluminanceLux);
		const pupilAreaExposureFactor = (pupilDiameterMillimeters / referencePupilDiameterMillimeters) ** 2;
		const exposureFactor = ScalarMath.clamp(
			Math.min(reciprocalExposureFactor, pupilAreaExposureFactor),
			SKY_EXPOSURE_MINIMUM_FACTOR,
			SKY_EXPOSURE_MAXIMUM_FACTOR,
		);

		return {
			skyIlluminanceLux,
			referenceIlluminanceLux,
			illuminanceFloorLux,
			exposureFactor,
			effectiveDisplayCoefficient: displayCoefficient * exposureFactor,
			minimumExposureFactor: SKY_EXPOSURE_MINIMUM_FACTOR,
			maximumExposureFactor: SKY_EXPOSURE_MAXIMUM_FACTOR,
		};
	}

	/**
	 * Call this method to advance one exposure factor through the internal stop-space adaptation policy.
	 *
	 * @param {number} currentExposureFactor - Supplies the positive current factor.
	 * @param {number} targetExposureFactor - Supplies the positive target factor.
	 * @param {number} deltaTimeSeconds - Supplies finite nonnegative frame time.
	 * @returns {number} - The bounded next exposure factor.
	 * @throws {RangeError} - When an input is outside its accepted range.
	 */
	advanceSkyExposureFactor(currentExposureFactor, targetExposureFactor, deltaTimeSeconds) {
		if (
			!Number.isFinite(currentExposureFactor) ||
			currentExposureFactor <= 0 ||
			!Number.isFinite(targetExposureFactor) ||
			targetExposureFactor <= 0 ||
			!Number.isFinite(deltaTimeSeconds) ||
			deltaTimeSeconds < 0
		) {
			throw new RangeError(
				'Sky-exposure factors must be positive and frame time must be finite and nonnegative.',
			);
		}

		const acceptedDeltaTimeSeconds = Math.min(deltaTimeSeconds, SKY_EXPOSURE_MAXIMUM_DELTA_TIME_SECONDS);
		const currentStops = Math.log2(currentExposureFactor);
		const targetStops = Math.log2(targetExposureFactor);
		const timeConstantSeconds =
			targetStops < currentStops
				? SKY_EXPOSURE_REDUCING_TIME_CONSTANT_SECONDS
				: SKY_EXPOSURE_INCREASING_TIME_CONSTANT_SECONDS;
		const blend = 1 - Math.exp(-acceptedDeltaTimeSeconds / timeConstantSeconds);

		return 2 ** (currentStops + (targetStops - currentStops) * blend);
	}

	/**
	 * Call this method to convert canonical spectral radiance through E8 and the display mapping.
	 *
	 * @param {SpectralRadiancePacket} radiance - Supplies native spectral radiance.
	 * @returns {readonly [number, number, number]} - Return display values.
	 */
	radianceToDisplayRgb(radiance) {
		return this.linearSrgbToDisplayRgb(this.radianceToLinearSrgb(radiance));
	}

	/**
	 * Call this method to convert completed spectral radiance into display-facing channels.
	 *
	 * @param {ColorConversionRequest} request - Supplies completed radiance.
	 * @returns {ColorSample} - Return converted display values.
	 */
	convert(request) {
		return {
			channels: this.radianceToDisplayRgb(request.radiance),
			colorSpace: this._displayConstants.outputColorSpace,
		};
	}

	/**
	 * Call this method to compose spectral path radiance over captured scene RGB using the pinned production display-boundary approximation.
	 *
	 * @param {SceneDisplayCompositionRequest} request - Supplies path and scene facts.
	 * @returns {readonly [number, number, number]} - Return composed linear sRGB.
	 */
	composeSceneLinearSrgb(request) {
		const pathRadiance = this._acceptSpectralRadiance(request.pathRadiance);
		const transmittance = this._acceptSpectralTransmittance(request.transmittance);
		const pathLinearSrgb = this.radianceToLinearSrgb(pathRadiance);
		const sceneDisplayRgb =
			request.sceneColorSpace === 'linear-srgb'
				? this.rendererLinearSrgbToDisplayRgb(request.sceneDisplayRgb)
				: request.sceneDisplayRgb;
		const sceneLinearSrgb = this.displayRgbToLinearSrgb(sceneDisplayRgb);
		const transmittanceRgb = this.spectralTransmittanceToRgbBands(transmittance);
		const sceneTransmittanceRgb = request.applySceneTransmittance === false ? [1, 1, 1] : transmittanceRgb;

		return [
			pathLinearSrgb[0] + sceneLinearSrgb[0] * sceneTransmittanceRgb[0],
			pathLinearSrgb[1] + sceneLinearSrgb[1] * sceneTransmittanceRgb[1],
			pathLinearSrgb[2] + sceneLinearSrgb[2] * sceneTransmittanceRgb[2],
		];
	}

	/**
	 * Call this method to compose spectral path radiance over captured scene RGB and encode it through the accepted display adapter.
	 *
	 * @param {SceneDisplayCompositionRequest} request - Supplies path and scene facts.
	 * @returns {readonly [number, number, number]} - Return composed display values.
	 */
	composeSceneDisplayRgb(request) {
		return this.linearSrgbToDisplayRgb(this.composeSceneLinearSrgb(request));
	}

	/**
	 * Call this method to create the Color-owned spectral composition and display contribution.
	 *
	 * @param {ShaderContributionRequest} request - Supplies the retained aggregate execution model.
	 * @returns {ShaderContribution} - Return the color contribution.
	 */
	createShaderContribution(request) {
		const basis = request.model.profile.spectral.basis;
		const celestialSourcesEnabled = request.model.celestialSources !== null;
		const composeArguments = celestialSourcesEnabled ? 'state, preDisplayRadiance' : 'state';
		const weights =
			basis.contentHash === NATIVE_15_SPECTRAL_BASIS.contentHash
				? this._displayLinearSrgbByChannel
				: this._buildDisplayLinearSrgbByChannel(basis);
		const photopicWeights = this._buildPhotopicLuminanceByChannel(basis);
		return ShaderContributions.createShaderContribution({
			id: 'color-bruneton-figure1-display',
			owner: 'color',
			provides: ['color.composeSceneColor', 'color.encodeOutput'],
			requires: [
				'runtime.initialState',
				celestialSourcesEnabled ? 'composition.composeSpectralRadiance' : 'transport.evaluatePathRadiance',
			],
			textures: [],
			bindingRequirements: [],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'color-display-constants',
					'declareConstants',
					0,
					this._displayConstantsBlock(basis, weights, photopicWeights),
				),
				ShaderContributions.createShaderSourceBlock(
					'color-compose-helper',
					'composeSceneColor',
					0,
					this._displayComposeBlock(basis, celestialSourcesEnabled),
				),
				ShaderContributions.createShaderSourceBlock(
					'color-encode-helper',
					'encodeOutput',
					0,
					this._displayEncodeBlock(),
				),
			],
			mainHooks: [
				ShaderContributions.createShaderSourceBlock(
					'color-main-compose',
					'composeSceneColor',
					0,
					`state.outputRgba = encodeDisplayOutput(composeSceneLinearSrgb(${composeArguments}));`,
				),
				ShaderContributions.createShaderSourceBlock(
					'color-main-output',
					'encodeOutput',
					0,
					'outColor = state.outputRgba;',
				),
			],
			diagnostics: {
				mode: this.id,
				spectralChannelCount: basis.channelCount,
				sceneComposition: 'production-captured-rgb-display-boundary',
				highlightShoulder: 'channel-wise-exponential',
				outputTransfer: 'bruneton-figure1-direct',
				exposure: 'fixed-bruneton-figure1',
				cieTableResolution: {value: 1, units: 'nanometers'},
				photopicProjection: 'cie-1931-ybar-width-times-683-lm-per-watt',
			},
		});
	}
}
