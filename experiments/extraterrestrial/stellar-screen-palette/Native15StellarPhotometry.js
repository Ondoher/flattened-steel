const SPEED_OF_LIGHT_METERS_PER_SECOND = 299792458;
const NATIVE_15_CENTERS_NANOMETERS = Object.freeze([
	375.6666666666667, 407, 438.3333333333333, 469.66666666666663, 501,
	532.3333333333333, 563.6666666666666, 595, 626.3333333333333,
	657.6666666666666, 689, 720.3333333333333, 751.6666666666666, 783,
	814.3333333333333,
]);
const NATIVE_15_BIN_WIDTH_NANOMETERS = 31.333333333333332;

export const NATIVE_15_STELLAR_PHOTOMETRY_CONTRACT = Object.freeze({
	id: 'contained-native-15-stellar-photometry-v1',
	spectralBasisId: 'algorithm32-native-15-spectral-basis-v1',
	channelCentersNanometers: NATIVE_15_CENTERS_NANOMETERS,
	channelBinWidthNanometers: NATIVE_15_BIN_WIDTH_NANOMETERS,
	policy: 'pickles-bracketed-bv-johnson-bv-vega-v2',
	quantity: 'spectral irradiance density',
	units: 'W m^-2 nm^-1',
});

function interpolate(wavelengths, values, wavelength) {
	if (wavelength < wavelengths[0] || wavelength > wavelengths.at(-1)) {
		throw new RangeError('Spectral input does not cover the native-15 wavelength range.');
	}
	let upper = 1;
	while (upper < wavelengths.length && wavelengths[upper] < wavelength) upper += 1;
	if (upper === wavelengths.length) return values.at(-1);
	const lower = upper - 1;
	const ratio = (wavelength - wavelengths[lower])
		/ (wavelengths[upper] - wavelengths[lower]);
	return values[lower] * (1 - ratio) + values[upper] * ratio;
}

function binAverage(template, lower, upper) {
	const knots = [
		lower,
		...template.wavelengthNanometers.filter((value) => value > lower && value < upper),
		upper,
	];
	let integral = 0;
	for (let index = 1; index < knots.length; index += 1) {
		const a = knots[index - 1];
		const b = knots[index];
		integral += (
			interpolate(template.wavelengthNanometers, template.normalizedFlux, a)
			+ interpolate(template.wavelengthNanometers, template.normalizedFlux, b)
		) * (b - a) / 2;
	}
	return integral / (upper - lower);
}

function filterValue(filter, wavelength) {
	return interpolate(filter.wavelengthNanometers, filter.transmission, wavelength);
}

function weightedMeanBins(values, filter) {
	let weighted = 0;
	let weight = 0;
	for (let channelIndex = 0; channelIndex < values.length; channelIndex += 1) {
		const center = NATIVE_15_CENTERS_NANOMETERS[channelIndex];
		const lower = center - NATIVE_15_BIN_WIDTH_NANOMETERS / 2;
		const upper = center + NATIVE_15_BIN_WIDTH_NANOMETERS / 2;
		for (let filterIndex = 1; filterIndex < filter.wavelengthNanometers.length; filterIndex += 1) {
			const a = Math.max(lower, filter.wavelengthNanometers[filterIndex - 1]);
			const b = Math.min(upper, filter.wavelengthNanometers[filterIndex]);
			if (b <= a) continue;
			const responseIntegral = (filterValue(filter, a) + filterValue(filter, b))
				* (b - a) / 2;
			weighted += values[channelIndex] * responseIntegral;
			weight += responseIntegral;
		}
	}
	if (!(weighted > 0 && weight > 0)) {
		throw new RangeError('Native spectral bins have no positive filter response.');
	}
	return weighted / weight;
}

function zeroPointFluxDensity(filter) {
	const wavelengthMeters = filter.pivotWavelengthNanometers * 1e-9;
	return filter.zeroPointJy * 1e-26 * SPEED_OF_LIGHT_METERS_PER_SECOND
		/ (wavelengthMeters * wavelengthMeters) * 1e-9;
}

function bracket(metrics, targetRatio) {
	const ratio = (metric) => metric.binnedB / metric.binnedV;
	const lower = metrics.filter((metric) => ratio(metric) <= targetRatio)
		.sort((left, right) => ratio(left) - ratio(right)).at(-1);
	const upper = metrics.filter((metric) => ratio(metric) >= targetRatio)
		.sort((left, right) => ratio(left) - ratio(right))[0];
	if (!lower || !upper) return null;
	const lowerRatio = ratio(lower);
	const upperRatio = ratio(upper);
	return {
		lower,
		upper,
		fraction: upperRatio === lowerRatio
			? 0
			: (targetRatio - lowerRatio) / (upperRatio - lowerRatio),
	};
}

function spectralClass(type) {
	return /([OBAFGKM])\s*(\d(?:\.\d)?)/i.exec(type ?? '')?.[1]?.toUpperCase() ?? null;
}

function luminosityClass(type) {
	return /(III|II|IV|V|I)/i.exec(type ?? '')?.[1]?.toUpperCase() ?? null;
}

/** Reproduce the accepted bracketed Pickles/Johnson B/V native-15 packets. */
export function materializeNative15StellarMembers({members, templates, johnsonB, johnsonV}) {
	if (!Array.isArray(members) || members.length < 1) {
		throw new TypeError('Stellar photometry requires at least one catalog member.');
	}
	if (!Array.isArray(templates) || templates.length < 1) {
		throw new TypeError('Stellar photometry requires Pickles templates.');
	}
	if (!johnsonB?.id?.includes('Johnson.B') || !johnsonV?.id?.includes('Johnson.V')) {
		throw new TypeError('Stellar photometry requires SVO Johnson B and V filters.');
	}
	const metrics = templates.map((template) => {
		const values = NATIVE_15_CENTERS_NANOMETERS.map((center) => binAverage(
			template,
			center - NATIVE_15_BIN_WIDTH_NANOMETERS / 2,
			center + NATIVE_15_BIN_WIDTH_NANOMETERS / 2,
		));
		return {
			template,
			values,
			binnedB: weightedMeanBins(values, johnsonB),
			binnedV: weightedMeanBins(values, johnsonV),
		};
	});
	const vZero = zeroPointFluxDensity(johnsonV);
	return Object.freeze(members.map((member) => {
		if (!Number.isFinite(member.visualMagnitude) || !Number.isFinite(member.bMinusV)) {
			throw new RangeError(`Member ${member.memberId} lacks finite V and B-V photometry.`);
		}
		const targetRatio = zeroPointFluxDensity(johnsonB) / vZero
			* 10 ** (-0.4 * member.bMinusV);
		const sourceClass = spectralClass(member.spectralType);
		const sourceLuminosity = luminosityClass(member.spectralType);
		const spectralCandidates = sourceClass === null
			? []
			: metrics.filter((metric) => metric.template.spectralClass === sourceClass);
		const luminosityCandidates = sourceLuminosity === null
			? []
			: spectralCandidates.filter(
				(metric) => metric.template.luminosityClass === sourceLuminosity,
			);
		const choice = [luminosityCandidates, spectralCandidates, metrics]
			.map((candidates) => bracket(candidates, targetRatio))
			.find(Boolean);
		if (!choice) throw new RangeError(`No Pickles templates bracket B-V for ${member.memberId}.`);
		const normalized = choice.lower.values.map((value, channelIndex) =>
			(1 - choice.fraction) * value / choice.lower.binnedV
			+ choice.fraction * choice.upper.values[channelIndex] / choice.upper.binnedV);
		const scale = vZero * 10 ** (-0.4 * member.visualMagnitude);
		const spectralIrradiance = Object.freeze(normalized.map((value) => value * scale));
		if (spectralIrradiance.some((value) => !(value >= 0) || !Number.isFinite(value))) {
			throw new RangeError(`Invalid native-15 packet for ${member.memberId}.`);
		}
		return Object.freeze({
			id: member.memberId,
			spectralIrradiance,
		});
	}));
}
