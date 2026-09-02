import {BrunetonColorDisplayModel} from '../controls/production-v1/src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {Cr4gSlopeLimitedPreToneExposureColorDisplayModel} from './Cr4gSlopeLimitedPreToneExposureColorDisplayModel.js';

export const CR8_BASIC_BRUNETON_COLOR_MODEL_ID = 'basic-bruneton';
export const CR8_COLOR_RESET_CANDIDATE_MODEL_ID = 'color-reset-slope-078-p9';

/**
 * Resolve one explicit CR8/B1 display option. The selector does not participate
 * in B1 spectral scoring; it exists at the later Color boundary.
 */
export function createCr8B1ColorModel({id, curve}) {
	if (id === CR8_BASIC_BRUNETON_COLOR_MODEL_ID) return new BrunetonColorDisplayModel();
	if (id === CR8_COLOR_RESET_CANDIDATE_MODEL_ID) {
		return new Cr4gSlopeLimitedPreToneExposureColorDisplayModel({curve});
	}
	throw new RangeError(`Unsupported CR8 B1 color-model option: ${id}.`);
}

export function describeCr8B1ColorModel({id, curve}) {
	const model = createCr8B1ColorModel({id, curve});
	return Object.freeze({
		selectionId: id,
		implementationId: model.id,
		physicalB1Participation: 'none-pre-display-spectral-score-is-invariant',
	});
}
