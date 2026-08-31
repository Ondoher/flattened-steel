import {BrunetonColorDisplayModel} from '../algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {BrunetonSourceLuminanceLiftColorDisplayModel} from '../algorithm32/implementation/bruneton-source-luminance-lift-color/BrunetonSourceLuminanceLiftColorDisplayModel.js';
import {FerwerdaColorDisplayModel} from '../algorithm32/implementation/ferwerda-color/FerwerdaColorDisplayModel.js';

/**
 * Create Flat32's production Color model or an explicit integration-control model.
 * Omission selects the qualified source-luminance-driven Bruneton path.
 */
export function createFlat32ColorDisplayModel(configuration = {}) {
	if (configuration.model === 'bruneton-control') return new BrunetonColorDisplayModel();
	if (configuration.model !== 'ferwerda-control') return new BrunetonSourceLuminanceLiftColorDisplayModel();
	const luminance = configuration.adaptationLuminanceCdPerSquareMeter ?? 0;
	return new FerwerdaColorDisplayModel({
		adaptation: {
			kind:
				configuration.model === 'ferwerda-control'
					? 'qualified-starlight-reference'
					: 'receiver-local-brightness-proxy',
			luminance: {value: luminance, units: 'cd m^-2'},
			provenanceId:
				configuration.model === 'ferwerda-control'
					? 'run:000424:sunset-plus-three-hours:starlight-reference'
					: 'flat32:local-light-level-calculator',
		},
	});
}
