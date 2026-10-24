import {ViewPresentationFilterRegistry} from '../algorithm32/implementation/presentation-filter/ViewPresentationFilterRegistry.js';

export const FLAT32_COLOR_MODEL_IDS = /** @type {const} */ ({
	COLOR_RESET_ALTITUDE_HALF_V1: 'color-reset-altitude-half-v1',
	BASIC_BRUNETON: 'basic-bruneton',
	COLOR_RESET_SLOPE_078_P2: 'color-reset-slope-078-p2',
	COLOR_RESET_SLOPE_078_P9: 'color-reset-slope-078-p9',
	FERWERDA_CONTROL: 'ferwerda-control',
});

export const FLAT32_STELLAR_CATALOG_IDS = /** @type {const} */ ({
	BRIGHTEST_500: 'brightest-500',
	BRIGHTEST_2000: 'brightest-2000',
});

export const FLAT32_PRESENTATION_FILTER_IDS = /** @type {const} */ ({
	HUMAN_MESOPIC_LUMINANCE_V1: 'human-mesopic-luminance-v1',
	HUMAN_LOW_LIGHT_CHROMA_V1: 'human-low-light-chroma-v1',
});

const COLOR_MODEL_IDS = new Set(Object.values(FLAT32_COLOR_MODEL_IDS));
const STELLAR_CATALOG_IDS = new Set(Object.values(FLAT32_STELLAR_CATALOG_IDS));
const FILTER_KEYS = new Set(['id', 'stage', 'target', 'enabled', 'parameters']);

/** Require a plain configuration record. */
function acceptRecord(value, label) {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		throw new TypeError(`${label} must be an object.`);
	}
	return value;
}

/** Reject unrecognized keys rather than silently accepting misspelled parameters. */
function acceptKeys(record, allowedKeys, label) {
	for (const key of Object.keys(record)) {
		if (!allowedKeys.has(key)) throw new RangeError(`${label} does not support ${key}.`);
	}
}

/** Require one finite unit-interval filter strength. */
function acceptStrength(value, label) {
	if (!Number.isFinite(value) || value < 0 || value > 1) {
		throw new RangeError(`${label} must be finite and between 0 and 1.`);
	}
	return value;
}

/** Normalize one registered presentation filter without executing it. */
function acceptPresentationFilter(candidate, index) {
	const label = `Flat32 presentation filter ${index}`;
	const filter = acceptRecord(candidate, label);
	acceptKeys(filter, FILTER_KEYS, label);
	if (filter.stage !== 'source-linear') throw new RangeError(`${label} must use source-linear.`);
	if (filter.target !== 'stellar') throw new RangeError(`${label} must target stellar.`);
	if (typeof filter.enabled !== 'boolean') throw new TypeError(`${label} enabled must be boolean.`);
	const parameters = acceptRecord(filter.parameters, `${label} parameters`);

	if (filter.id === FLAT32_PRESENTATION_FILTER_IDS.HUMAN_MESOPIC_LUMINANCE_V1) {
		acceptKeys(parameters, new Set(['maximumRodContribution']), `${label} parameters`);
		if (parameters.maximumRodContribution !== 0.5) {
			throw new RangeError(`${label} maximumRodContribution must equal 0.5.`);
		}
		return {
			id: filter.id,
			stage: filter.stage,
			target: filter.target,
			enabled: filter.enabled,
			parameters: {
				maximumRodContribution: acceptStrength(
					parameters.maximumRodContribution,
					`${label} maximumRodContribution`,
				),
			},
		};
	}

	if (filter.id === FLAT32_PRESENTATION_FILTER_IDS.HUMAN_LOW_LIGHT_CHROMA_V1) {
		acceptKeys(parameters, new Set(['maximumChromaRetention']), `${label} parameters`);
		if (parameters.maximumChromaRetention !== 0.65) {
			throw new RangeError(`${label} maximumChromaRetention must equal 0.65.`);
		}
		return {
			id: filter.id,
			stage: filter.stage,
			target: filter.target,
			enabled: filter.enabled,
			parameters: {
				maximumChromaRetention: acceptStrength(
					parameters.maximumChromaRetention,
					`${label} maximumChromaRetention`,
				),
			},
		};
	}

	throw new RangeError(`${label} id is not supported.`);
}

/** Normalize the ordered filter list and enforce the selected compatibility order. */
function acceptPresentationFilters(value) {
	if (!Array.isArray(value)) throw new TypeError('Flat32 presentationFilters must be an array.');
	const filters = value.map(acceptPresentationFilter);
	const ids = filters.map((filter) => filter.id);
	if (new Set(ids).size !== ids.length) throw new RangeError('Flat32 presentation filter ids must be unique.');
	const mesopicIndex = ids.indexOf(FLAT32_PRESENTATION_FILTER_IDS.HUMAN_MESOPIC_LUMINANCE_V1);
	const chromaIndex = ids.indexOf(FLAT32_PRESENTATION_FILTER_IDS.HUMAN_LOW_LIGHT_CHROMA_V1);
	if (mesopicIndex >= 0 && chromaIndex >= 0 && mesopicIndex > chromaIndex) {
		throw new RangeError('Flat32 mesopic luminance must precede low-light chroma.');
	}
	return filters;
}

/**
 * Normalize one exact Color configuration and reject aliases or unknown parameters.
 *
 * @returns {Flat32ColorDisplayModelConfiguration} The accepted exact configuration.
 */
export function resolveFlat32ColorDisplayModelConfiguration(configuration = {}) {
	const record = acceptRecord(configuration, 'Flat32 Color configuration');
	const candidateModel = record.model ?? FLAT32_COLOR_MODEL_IDS.COLOR_RESET_ALTITUDE_HALF_V1;
	if (!COLOR_MODEL_IDS.has(candidateModel)) {
		throw new RangeError(`Flat32 Color model ${String(candidateModel)} is not supported.`);
	}
	const model = /** @type {Flat32ColorModelId} */ (candidateModel);
	const allowedKeys =
		model === FLAT32_COLOR_MODEL_IDS.FERWERDA_CONTROL
			? new Set(['model', 'adaptationLuminanceCdPerSquareMeter'])
			: new Set(['model']);
	acceptKeys(record, allowedKeys, 'Flat32 Color configuration');

	if (model === FLAT32_COLOR_MODEL_IDS.FERWERDA_CONTROL) {
		const luminance = record.adaptationLuminanceCdPerSquareMeter;
		if (!Number.isFinite(luminance) || luminance < 0) {
			throw new RangeError('Flat32 Ferwerda adaptation luminance must be finite and nonnegative.');
		}
		return {
			model: FLAT32_COLOR_MODEL_IDS.FERWERDA_CONTROL,
			adaptationLuminanceCdPerSquareMeter: luminance,
		};
	}
	return /** @type {Flat32ColorDisplayModelConfiguration} */ ({model});
}

/** Normalize independent Color, celestial, catalog, and presentation-filter selections.
 *
 * @returns {Flat32ProductionSelections} - Accepted readonly production selections.
 */
export function resolveFlat32ProductionSelections(configuration = {}) {
	const record = acceptRecord(configuration, 'Flat32 production selection configuration');
	const celestialSourcesEnabled = record.celestialSourcesEnabled ?? true;
	if (typeof celestialSourcesEnabled !== 'boolean') {
		throw new TypeError('Flat32 celestialSourcesEnabled must be boolean.');
	}
	const stellarCatalog = record.stellarCatalog ?? FLAT32_STELLAR_CATALOG_IDS.BRIGHTEST_2000;
	if (!STELLAR_CATALOG_IDS.has(stellarCatalog)) {
		throw new RangeError(`Flat32 stellar catalog ${String(stellarCatalog)} is not supported.`);
	}
	const presentationFilters = acceptPresentationFilters(record.presentationFilters ?? []);
	const presentationFilterConfigurationIdentity = new ViewPresentationFilterRegistry(presentationFilters).identity;
	const colorDisplayModelConfiguration = resolveFlat32ColorDisplayModelConfiguration(
		record.colorDisplayModelConfiguration,
	);
	return {
		colorDisplayModelConfiguration,
		sceneColorPrecision:
			colorDisplayModelConfiguration.model === FLAT32_COLOR_MODEL_IDS.COLOR_RESET_SLOPE_078_P2 ||
			colorDisplayModelConfiguration.model === FLAT32_COLOR_MODEL_IDS.COLOR_RESET_ALTITUDE_HALF_V1
				? 'float32'
				: 'float16',
		celestialSourcesEnabled,
		stellarCatalog,
		presentationFilters,
		presentationFilterConfigurationIdentity,
	};
}

/** Fail closed until P7 installs the P6 source-linear hooks in the compatible stellar generation. */
export function requireImplementedFlat32ProductionSelections(selections, options = {}) {
	if (
		selections.presentationFilters.some((filter) => filter.enabled) &&
		selections.colorDisplayModelConfiguration.model === FLAT32_COLOR_MODEL_IDS.FERWERDA_CONTROL
	) {
		throw new RangeError('Flat32 stellar presentation filters require a Bruneton Color model.');
	}
	if (selections.presentationFilters.some((filter) => filter.enabled) && options.supportsStellarFilters === false) {
		throw new RangeError('Flat32 stellar presentation filters require the spherical/distant stellar mode.');
	}
	if (
		selections.presentationFilters.some((filter) => filter.enabled) &&
		options.presentationFilterRegistry?.enabled !== true
	) {
		throw new RangeError('Flat32 enabled presentation filters require their production registry.');
	}
	if (options.presentationFilterRegistry?.enabled === true) {
		options.presentationFilterRegistry.createStellarSourceLinearShaderHook();
	}
}
