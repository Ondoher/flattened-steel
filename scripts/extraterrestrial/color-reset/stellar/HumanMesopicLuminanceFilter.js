export const HUMAN_MESOPIC_LUMINANCE_FILTER_ID = 'human-mesopic-luminance-v1';
export const HUMAN_MESOPIC_LUMINANCE_FILTER_STAGE = 'source-linear';
export const HUMAN_MESOPIC_LUMINANCE_FILTER_TARGET = 'stellar';
export const CIE_SCOTOPIC_DATASET_DOI = '10.25039/CIE.DS.gr6w4b5g';
export const CIE_SCOTOPIC_DATASET_SHA256 =
	'6a75d3fdbcbf5e9e9a07478511933eefeda953f3e2cc14b74459e5a099ec3759';

const NATIVE_15_BIN_COUNT = 15;
const NATIVE_15_LOWER_NANOMETERS = 360;
const NATIVE_15_UPPER_NANOMETERS = 830;
const NATIVE_15_BIN_WIDTH_NANOMETERS =
	(NATIVE_15_UPPER_NANOMETERS - NATIVE_15_LOWER_NANOMETERS) / NATIVE_15_BIN_COUNT;
const SCOTOPIC_MAXIMUM_LUMINOUS_EFFICACY = 1700;
const PHOTOPIC_BOUNDARY_CD_M2 = 5;
const SCOTOPIC_BOUNDARY_CD_M2 = 0.005;

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function acceptParameters(parameters) {
	requireCondition(
		parameters?.photopicBoundaryCdM2 === PHOTOPIC_BOUNDARY_CD_M2 &&
			parameters.scotopicBoundaryCdM2 === SCOTOPIC_BOUNDARY_CD_M2 &&
			(parameters.maximumRodContribution === 0.5 || parameters.maximumRodContribution === 1),
		'Human mesopic luminance parameters changed.',
	);
	return parameters;
}

function parseCieRows(csvText) {
	requireCondition(typeof csvText === 'string' && csvText.length > 0, 'CIE scotopic CSV is required.');
	const rows = csvText.trim().split(/\r?\n/u).map((line, index) => {
		const fields = line.split(',');
		requireCondition(fields.length === 2, `Invalid CIE scotopic row ${index + 1}.`);
		const wavelength = Number(fields[0]);
		const efficiency = Number(fields[1]);
		requireCondition(
			Number.isFinite(wavelength) && Number.isFinite(efficiency) && efficiency >= 0,
			`Invalid CIE scotopic value at row ${index + 1}.`,
		);
		return {wavelength, efficiency};
	});
	requireCondition(
		rows.length === 401 && rows[0].wavelength === 380 && rows.at(-1).wavelength === 780,
		'CIE scotopic fixture range changed.',
	);
	for (let index = 1; index < rows.length; index += 1) {
		requireCondition(
			rows[index].wavelength === rows[index - 1].wavelength + 1,
			'CIE scotopic wavelength spacing changed.',
		);
	}
	return rows;
}

function efficiencyAt(rows, wavelength) {
	if (wavelength < rows[0].wavelength || wavelength > rows.at(-1).wavelength) return 0;
	if (wavelength === rows.at(-1).wavelength) return rows.at(-1).efficiency;
	const lowerWavelength = Math.floor(wavelength);
	const lower = rows[lowerWavelength - rows[0].wavelength];
	const upper = rows[lowerWavelength + 1 - rows[0].wavelength];
	const ratio = wavelength - lowerWavelength;
	return lower.efficiency * (1 - ratio) + upper.efficiency * ratio;
}

function integratePiecewiseLinear(rows, lower, upper) {
	const knots = [lower];
	for (let wavelength = Math.ceil(lower); wavelength < upper; wavelength += 1) knots.push(wavelength);
	knots.push(upper);
	let integral = 0;
	for (let index = 1; index < knots.length; index += 1) {
		const left = knots[index - 1];
		const right = knots[index];
		integral += (right - left) *
			(efficiencyAt(rows, left) + efficiencyAt(rows, right)) / 2;
	}
	return integral;
}

/** Integrate official CIE V'(lambda) over the exact Native15 bins. */
export function createNative15ScotopicLuminanceWeights(csvText) {
	const rows = parseCieRows(csvText);
	return Object.freeze(Array.from({length: NATIVE_15_BIN_COUNT}, (_, index) => {
		const lower = NATIVE_15_LOWER_NANOMETERS + index * NATIVE_15_BIN_WIDTH_NANOMETERS;
		const upper = lower + NATIVE_15_BIN_WIDTH_NANOMETERS;
		return SCOTOPIC_MAXIMUM_LUMINOUS_EFFICACY *
			integratePiecewiseLinear(rows, lower, upper);
	}));
}

export function native15ScotopicLuminance(native15, weights) {
	requireCondition(
		native15?.length === NATIVE_15_BIN_COUNT && weights?.length === NATIVE_15_BIN_COUNT,
		'Scotopic luminance requires Native15 values and weights.',
	);
	let luminance = 0;
	for (let index = 0; index < NATIVE_15_BIN_COUNT; index += 1) {
		const value = Number(native15[index]);
		const weight = Number(weights[index]);
		requireCondition(
			Number.isFinite(value) && value >= 0 && Number.isFinite(weight) && weight >= 0,
			'Scotopic luminance inputs must be finite and nonnegative.',
		);
		luminance += value * weight;
	}
	return luminance;
}

/** Smooth logarithmic approximation across the CIE off-axis mesopic range. */
export function humanMesopicRodWeight(adaptationLuminanceCdM2, parameters) {
	const accepted = acceptParameters(parameters);
	requireCondition(
		Number.isFinite(adaptationLuminanceCdM2) && adaptationLuminanceCdM2 >= 0,
		'Adaptation luminance must be finite and nonnegative.',
	);
	const bounded = Math.max(adaptationLuminanceCdM2, accepted.scotopicBoundaryCdM2);
	const denominator = Math.log10(accepted.photopicBoundaryCdM2) -
		Math.log10(accepted.scotopicBoundaryCdM2);
	const t = Math.max(0, Math.min(1,
		(Math.log10(accepted.photopicBoundaryCdM2) - Math.log10(bounded)) / denominator,
	));
	const smooth = t * t * (3 - 2 * t);
	return accepted.maximumRodContribution * smooth;
}

/** Scale transported stellar RGB to its blended photopic/scotopic luminance. */
export function applyHumanMesopicLuminance(rgb, metadata, parameters) {
	requireCondition(rgb?.length === 3, 'Mesopic luminance input must contain three channels.');
	const source = Array.from(rgb, Number);
	requireCondition(source.every(Number.isFinite),
		'Mesopic luminance RGB must be finite.');
	const photopic = Number(metadata?.photopicLuminance);
	const scotopic = native15ScotopicLuminance(metadata?.transportedNative15, metadata?.scotopicWeights);
	requireCondition(Number.isFinite(photopic) && photopic >= 0,
		'Mesopic photopic luminance must be finite and nonnegative.');
	if (photopic === 0) return /** @type {[number, number, number]} */ (source);
	const rodWeight = humanMesopicRodWeight(metadata.adaptationLuminanceCdM2, parameters);
	const blended = photopic + rodWeight * (scotopic - photopic);
	const scale = blended / photopic;
	return /** @type {[number, number, number]} */ (source.map((value) => value * scale));
}

export const HUMAN_MESOPIC_LUMINANCE_FILTER = Object.freeze({
	id: HUMAN_MESOPIC_LUMINANCE_FILTER_ID,
	stage: HUMAN_MESOPIC_LUMINANCE_FILTER_STAGE,
	target: HUMAN_MESOPIC_LUMINANCE_FILTER_TARGET,
	apply: applyHumanMesopicLuminance,
});

export const HUMAN_MESOPIC_LUMINANCE_CONTRACT = Object.freeze({
	id: HUMAN_MESOPIC_LUMINANCE_FILTER_ID,
	cieScotopicDatasetDoi: CIE_SCOTOPIC_DATASET_DOI,
	scotopicMaximumLuminousEfficacy: {value: SCOTOPIC_MAXIMUM_LUMINOUS_EFFICACY, units: 'lm W^-1'},
	mesopicBoundaries: {scotopicCdM2: SCOTOPIC_BOUNDARY_CD_M2, photopicCdM2: PHOTOPIC_BOUNDARY_CD_M2},
	steadyStateOnly: true,
	temporalAdaptation: false,
	spatialAcuityFilter: false,
});
