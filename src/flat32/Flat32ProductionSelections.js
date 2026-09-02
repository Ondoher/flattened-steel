export const FLAT32_COLOR_MODEL_IDS = /** @type {const} */ ({
	BASIC_BRUNETON: 'basic-bruneton',
	COLOR_RESET_SLOPE_078_P9: 'color-reset-slope-078-p9',
	SOURCE_LUMINANCE_LIFT_V2: 'bruneton-source-luminance-lift-v2',
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
		return Object.freeze({
			id: filter.id,
			stage: filter.stage,
			target: filter.target,
			enabled: filter.enabled,
			parameters: Object.freeze({
				maximumRodContribution: acceptStrength(
					parameters.maximumRodContribution,
					`${label} maximumRodContribution`,
				),
			}),
		});
	}

	if (filter.id === FLAT32_PRESENTATION_FILTER_IDS.HUMAN_LOW_LIGHT_CHROMA_V1) {
		acceptKeys(parameters, new Set(['maximumChromaRetention']), `${label} parameters`);
		return Object.freeze({
			id: filter.id,
			stage: filter.stage,
			target: filter.target,
			enabled: filter.enabled,
			parameters: Object.freeze({
				maximumChromaRetention: acceptStrength(
					parameters.maximumChromaRetention,
					`${label} maximumChromaRetention`,
				),
			}),
		});
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
	return Object.freeze(filters);
}

/**
 * Normalize one exact Color configuration and reject aliases or unknown parameters.
 * @returns {Flat32ColorDisplayModelConfiguration} The accepted exact configuration.
 */
export function resolveFlat32ColorDisplayModelConfiguration(configuration = {}) {
	const record = acceptRecord(configuration, 'Flat32 Color configuration');
	const candidateModel = record.model ?? FLAT32_COLOR_MODEL_IDS.SOURCE_LUMINANCE_LIFT_V2;
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
		return Object.freeze({
			model: FLAT32_COLOR_MODEL_IDS.FERWERDA_CONTROL,
			adaptationLuminanceCdPerSquareMeter: luminance,
		});
	}
	return /** @type {Flat32ColorDisplayModelConfiguration} */ (Object.freeze({model}));
}

/** Normalize independent Color, celestial, catalog, and presentation-filter selections. */
export function resolveFlat32ProductionSelections(configuration = {}) {
	const record = acceptRecord(configuration, 'Flat32 production selection configuration');
	const celestialSourcesEnabled = record.celestialSourcesEnabled ?? true;
	if (typeof celestialSourcesEnabled !== 'boolean') {
		throw new TypeError('Flat32 celestialSourcesEnabled must be boolean.');
	}
	const stellarCatalog = record.stellarCatalog ?? FLAT32_STELLAR_CATALOG_IDS.BRIGHTEST_500;
	if (!STELLAR_CATALOG_IDS.has(stellarCatalog)) {
		throw new RangeError(`Flat32 stellar catalog ${String(stellarCatalog)} is not supported.`);
	}
	return Object.freeze({
		colorDisplayModelConfiguration: resolveFlat32ColorDisplayModelConfiguration(
			record.colorDisplayModelConfiguration,
		),
		celestialSourcesEnabled,
		stellarCatalog,
		presentationFilters: acceptPresentationFilters(record.presentationFilters ?? []),
	});
}

/** Fail closed for recognized selections whose implementation belongs to a later plan phase. */
export function requireImplementedFlat32ProductionSelections(selections, options = {}) {
	if (options.stellarCatalogUsed === true && selections.stellarCatalog !== FLAT32_STELLAR_CATALOG_IDS.BRIGHTEST_500) {
		throw new RangeError('Flat32 brightest-2000 is recognized but is not implemented until P5.');
	}
	if (selections.presentationFilters.some((filter) => filter.enabled)) {
		throw new RangeError('Flat32 presentation filters are recognized but are not implemented until P6.');
	}
}
