import {BrunetonColorDisplayModel} from '../algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {ColorResetSlope078P9ColorDisplayModel} from '../algorithm32/implementation/color-reset-slope-078-p9/ColorResetSlope078P9ColorDisplayModel.js';
import {FerwerdaColorDisplayModel} from '../algorithm32/implementation/ferwerda-color/FerwerdaColorDisplayModel.js';
import {FLAT32_COLOR_MODEL_IDS, resolveFlat32ColorDisplayModelConfiguration} from './Flat32ProductionSelections.js';

/**
 * Create Flat32's production Color model or an explicit integration-control model.
 * Omission selects the accepted Color Reset production path.
 */
export function createFlat32ColorDisplayModel(configuration = {}, presentationFilterRegistry = null) {
	const accepted = resolveFlat32ColorDisplayModelConfiguration(configuration);
	const shared = {presentationFilterRegistry};
	if (accepted.model === FLAT32_COLOR_MODEL_IDS.BASIC_BRUNETON) return new BrunetonColorDisplayModel(shared);
	if (accepted.model === FLAT32_COLOR_MODEL_IDS.COLOR_RESET_SLOPE_078_P9) {
		return new ColorResetSlope078P9ColorDisplayModel(shared);
	}
	if (!('adaptationLuminanceCdPerSquareMeter' in accepted)) {
		throw new RangeError(`Flat32 Color model ${accepted.model} has no implementation.`);
	}
	return new FerwerdaColorDisplayModel({
		adaptation: {
			kind: 'qualified-starlight-reference',
			luminance: {value: accepted.adaptationLuminanceCdPerSquareMeter, units: 'cd m^-2'},
			provenanceId: 'run:000424:sunset-plus-three-hours:starlight-reference',
		},
	});
}
