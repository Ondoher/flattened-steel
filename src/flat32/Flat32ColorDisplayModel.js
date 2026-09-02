import {BrunetonColorDisplayModel} from '../algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {BrunetonSourceLuminanceLiftColorDisplayModel} from '../algorithm32/implementation/bruneton-source-luminance-lift-color/BrunetonSourceLuminanceLiftColorDisplayModel.js';
import {FerwerdaColorDisplayModel} from '../algorithm32/implementation/ferwerda-color/FerwerdaColorDisplayModel.js';
import {FLAT32_COLOR_MODEL_IDS, resolveFlat32ColorDisplayModelConfiguration} from './Flat32ProductionSelections.js';

/**
 * Create Flat32's production Color model or an explicit integration-control model.
 * Omission selects the qualified source-luminance-driven Bruneton path.
 */
export function createFlat32ColorDisplayModel(configuration = {}) {
	const accepted = resolveFlat32ColorDisplayModelConfiguration(configuration);
	if (accepted.model === FLAT32_COLOR_MODEL_IDS.BASIC_BRUNETON) return new BrunetonColorDisplayModel();
	if (accepted.model === FLAT32_COLOR_MODEL_IDS.SOURCE_LUMINANCE_LIFT_V2) {
		return new BrunetonSourceLuminanceLiftColorDisplayModel();
	}
	if (accepted.model === FLAT32_COLOR_MODEL_IDS.COLOR_RESET_SLOPE_078_P9) {
		throw new RangeError('Flat32 color-reset-slope-078-p9 is recognized but is not implemented until P3.');
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
