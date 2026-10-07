import {ColorResetSlope078P9ColorDisplayModel} from '../color-reset-slope-078-p9/ColorResetSlope078P9ColorDisplayModel.js';
import {COLOR_RESET_SLOPE_078_P2_CURVE, COLOR_RESET_SLOPE_078_P2_ID} from './consts.js';

/** Separately versioned p2 successor using the common slope-078 gain and unchanged Bruneton encoding. */
export class ColorResetSlope078P2ColorDisplayModel extends ColorResetSlope078P9ColorDisplayModel {
	/**
	 * Stable identity of the selected p2 response.
	 *
	 * @returns {string} - Model identity.
	 */
	get id() {
		return COLOR_RESET_SLOPE_078_P2_ID;
	}

	/**
	 * Selected p2 response constants, returned as a caller-owned copy.
	 *
	 * @returns {ColorResetSlope078Curve} - Response constants.
	 */
	get curve() {
		return {...COLOR_RESET_SLOPE_078_P2_CURVE};
	}
}
