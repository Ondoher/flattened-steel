const NATIVE_15_BIN_COUNT = 15;
const NATIVE_15_LOWER_NANOMETERS = 360;
const NATIVE_15_UPPER_NANOMETERS = 830;
const NATIVE_15_BIN_WIDTH_NANOMETERS =
	(NATIVE_15_UPPER_NANOMETERS - NATIVE_15_LOWER_NANOMETERS) / NATIVE_15_BIN_COUNT;
const SCOTOPIC_MAXIMUM_LUMINOUS_EFFICACY = 1700;

function requirePositive(value, label) {
	if (!Number.isFinite(value) || value <= 0) {
		throw new RangeError(`${label} must be positive and finite.`);
	}
	return value;
}

/** Ferwerda et al. 1996 equation 4: cone threshold in cd m^-2. */
export function photopicThreshold(adaptationLuminance) {
	const luminance = requirePositive(adaptationLuminance, 'Photopic adaptation luminance');
	const logarithmicLuminance = Math.log10(luminance);
	let logarithmicThreshold;
	if (logarithmicLuminance <= -2.6) logarithmicThreshold = -0.72;
	else if (logarithmicLuminance >= 1.9) logarithmicThreshold = logarithmicLuminance - 1.255;
	else logarithmicThreshold = (0.249 * logarithmicLuminance + 0.65) ** 2.7 - 0.72;
	return 10 ** logarithmicThreshold;
}

/** Ferwerda et al. 1996 equation 5: rod threshold in cd m^-2. */
export function scotopicThreshold(adaptationLuminance) {
	const luminance = requirePositive(adaptationLuminance, 'Scotopic adaptation luminance');
	const logarithmicLuminance = Math.log10(luminance);
	let logarithmicThreshold;
	if (logarithmicLuminance <= -3.94) logarithmicThreshold = -2.86;
	else if (logarithmicLuminance >= -1.44) logarithmicThreshold = logarithmicLuminance - 0.395;
	else logarithmicThreshold = (0.405 * logarithmicLuminance + 1.6) ** 2.18 - 2.86;
	return 10 ** logarithmicThreshold;
}

/** Later Walraven-Valeton transition used by the cited HDR Toolbox implementation. */
export function walravenValetonRodBlend(worldAdaptationLuminance, sigma = 100) {
	const luminance = requirePositive(worldAdaptationLuminance, 'World adaptation luminance');
	requirePositive(sigma, 'Walraven-Valeton sigma');
	return Math.max(0, (sigma - luminance / 4) / (sigma + luminance));
}

export function deriveFerwerdaSteadyStateParameters({
	worldAdaptationLuminance,
	displayMaximumLuminance = 80,
	displayAdaptationLuminance = displayMaximumLuminance / 2,
}) {
	const world = requirePositive(worldAdaptationLuminance, 'World adaptation luminance');
	const displayMaximum = requirePositive(displayMaximumLuminance, 'Display maximum luminance');
	const displayAdaptation = requirePositive(displayAdaptationLuminance, 'Display adaptation luminance');
	if (displayAdaptation > displayMaximum) {
		throw new RangeError('Display adaptation luminance cannot exceed display maximum luminance.');
	}
	const displayPhotopicThreshold = photopicThreshold(displayAdaptation);
	const worldPhotopicThreshold = photopicThreshold(world);
	const worldScotopicThreshold = scotopicThreshold(world);
	return Object.freeze({
		worldAdaptationLuminance: world,
		displayMaximumLuminance: displayMaximum,
		displayAdaptationLuminance: displayAdaptation,
		displayPhotopicThreshold,
		worldPhotopicThreshold,
		worldScotopicThreshold,
		coneScale: displayPhotopicThreshold / worldPhotopicThreshold,
		// The paper explicitly maps the world rod threshold to the photopic
		// display observer's threshold (equations 3, 4 and 5).
		rodScale: displayPhotopicThreshold / worldScotopicThreshold,
		rodBlend: walravenValetonRodBlend(world),
		units: 'cd m^-2',
	});
}

function parseCieRows(csvText) {
	if (typeof csvText !== 'string' || csvText.length === 0) {
		throw new TypeError('CIE scotopic CSV text is required.');
	}
	const rows = csvText.trim().split(/\r?\n/u).map((line, index) => {
		const fields = line.split(',');
		if (fields.length !== 2) throw new Error(`Invalid CIE scotopic row ${index + 1}.`);
		const wavelength = Number(fields[0]);
		const efficiency = Number(fields[1]);
		if (!Number.isFinite(wavelength) || !Number.isFinite(efficiency) || efficiency < 0) {
			throw new Error(`Invalid CIE scotopic value at row ${index + 1}.`);
		}
		return {wavelength, efficiency};
	});
	if (rows.length !== 401 || rows[0].wavelength !== 380 || rows.at(-1).wavelength !== 780) {
		throw new Error('CIE scotopic fixture must cover its official 380-780 nm range at 1 nm intervals.');
	}
	for (let index = 1; index < rows.length; index += 1) {
		if (rows[index].wavelength !== rows[index - 1].wavelength + 1) {
			throw new Error('CIE scotopic fixture wavelength spacing changed.');
		}
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
		integral += (right - left) * (efficiencyAt(rows, left) + efficiencyAt(rows, right)) / 2;
	}
	return integral;
}

/**
 * Coefficients converting native-15 spectral radiance density
 * (W m^-2 sr^-1 nm^-1) to CIE scotopic luminance (cd m^-2).
 */
export function createNative15ScotopicLuminanceWeights(csvText) {
	const rows = parseCieRows(csvText);
	return Object.freeze(Array.from({length: NATIVE_15_BIN_COUNT}, (_, index) => {
		const lower = NATIVE_15_LOWER_NANOMETERS + index * NATIVE_15_BIN_WIDTH_NANOMETERS;
		const upper = lower + NATIVE_15_BIN_WIDTH_NANOMETERS;
		return SCOTOPIC_MAXIMUM_LUMINOUS_EFFICACY * integratePiecewiseLinear(rows, lower, upper);
	}));
}

export const FERWERDA_VISUAL_ADAPTATION_CONTRACT = Object.freeze({
	id: 'contained-ferwerda-steady-state-visual-adaptation-v1',
	primaryReference: 'Ferwerda et al., A Model of Visual Adaptation for Realistic Image Synthesis, SIGGRAPH 1996',
	primaryReferenceUrl: 'https://jamesferwerda.com/wp-content/uploads/2015/06/j03_ferwerda96_sig.pdf',
	cieScotopicDatasetDoi: '10.25039/CIE.DS.gr6w4b5g',
	scotopicMaximumLuminousEfficacy: {value: SCOTOPIC_MAXIMUM_LUMINOUS_EFFICACY, units: 'lm W^-1'},
	native15RangeNanometers: [NATIVE_15_LOWER_NANOMETERS, NATIVE_15_UPPER_NANOMETERS],
	steadyStateOnly: true,
	spatialAcuityFilter: false,
	temporalAdaptation: false,
});
