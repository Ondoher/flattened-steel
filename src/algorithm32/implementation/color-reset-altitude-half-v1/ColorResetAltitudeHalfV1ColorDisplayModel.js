import {ColorResetSlope078P2ColorDisplayModel} from '../color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';
import DistanceMath from '../../math/DistanceMath.js';
import {ShaderContributions} from '../../shader-assembly/base/ShaderContributions.js';
import {
	COLOR_RESET_ALTITUDE_HALF_V1_ID,
	COLOR_RESET_ALTITUDE_HALF_RESPONSE,
	DISPLAY_ADAPTATION_ILLUMINANCE_UNIFORM,
	DISPLAY_ADAPTATION_ILLUMINANCE_VALUE_KEY,
} from './consts.js';

/** Altitude-aware frame exposure with native p2 CPU scene-light conversion.
 * Frame callers supply an explicit display-control illuminance. Inherited CPU
 * conversions intentionally remain p2 so scene lighting and physical facts do not change.
 */
export class ColorResetAltitudeHalfV1ColorDisplayModel extends ColorResetSlope078P2ColorDisplayModel {
	/** Select the independently prepared frame-display uniform.
	 * @returns {string} - Declared GLSL display-control uniform name.
	 */
	_displayIlluminanceUniformName() {
		return DISPLAY_ADAPTATION_ILLUMINANCE_UNIFORM;
	}

	/** Versioned identity of the accepted frame-display response.
	 * @returns {string} - Model identity.
	 */
	get id() {
		return COLOR_RESET_ALTITUDE_HALF_V1_ID;
	}

	/** Derive frame exposure without mutating the receiver measurement.
	 * Supply zero height for Flat geometry. Apply any illustrative source scale to
	 * the raw illuminance exactly once before calling. Formula and constants are
	 * the accepted altitude-half study, documented in this folder's README.
	 * @param {UnitValue<'lux'>} totalHorizontalIlluminance - Physical or once-scaled receiver illumination.
	 * @param {Distance} observerHeight - Spherical physical height, or zero for Flat.
	 * @returns {UnitValue<'lux'>} - Synthetic frame-display control, not measured light.
	 * @throws {TypeError|RangeError} - Invalid illuminance/distance or negative height.
	 */
	displayAdaptationIlluminance(totalHorizontalIlluminance, observerHeight) {
		const illuminanceLux = this._acceptTotalHorizontalIlluminance(totalHorizontalIlluminance);
		const heightMeters = DistanceMath.toMeters(observerHeight);
		if (heightMeters < 0) throw new RangeError('Display observer height must be nonnegative.');
		const response = COLOR_RESET_ALTITUDE_HALF_RESPONSE;
		const heightFraction = Math.max(
			0,
			Math.min(
				1,
				(heightMeters - response.heightStart.value) / (response.heightEnd.value - response.heightStart.value),
			),
		);
		const altitudeWeight = heightFraction * heightFraction * (3 - 2 * heightFraction);
		const taperFraction = Math.max(
			0,
			Math.min(
				1,
				(illuminanceLux - response.taperStart.value) / (response.taperEnd.value - response.taperStart.value),
			),
		);
		const illuminationWeight = 1 - taperFraction * taperFraction * (3 - 2 * taperFraction);
		return {
			value:
				illuminanceLux +
				altitudeWeight *
					response.lift.value *
					-Math.expm1(-illuminanceLux / response.activation.value) *
					illuminationWeight,
			units: 'lux',
		};
	}

	/** Contribute the explicit frame-display input while retaining receiver-lux observation.
	 * @param {ShaderContributionRequest} request - Accepted shader build facts.
	 * @returns {ShaderContribution} - Versioned display contribution with a required separate control.
	 */
	createShaderContribution(request) {
		const contribution = super.createShaderContribution(request);
		return {
			...contribution,
			uniforms: [
				...contribution.uniforms,
				ShaderContributions.createShaderUniformDeclaration(
					DISPLAY_ADAPTATION_ILLUMINANCE_UNIFORM,
					'float',
					DISPLAY_ADAPTATION_ILLUMINANCE_VALUE_KEY,
				),
			],
			bindingRequirements: [
				...contribution.bindingRequirements,
				ShaderContributions.createShaderBindingRequirement(
					'color.display-adaptation-illuminance',
					'color',
					'uniform',
					'frame',
					DISPLAY_ADAPTATION_ILLUMINANCE_VALUE_KEY,
					true,
				),
			],
			diagnostics: {
				.../** @type {Record<string, unknown>} */ (contribution.diagnostics ?? {}),
				condition: 'separate-altitude-aware-frame-display-control',
				physicalIlluminanceBinding: 'color.totalHorizontalIlluminance.value',
				displayIlluminanceBinding: DISPLAY_ADAPTATION_ILLUMINANCE_VALUE_KEY,
			},
		};
	}
}
