import {
	canonicalDirectionFromCatalogCoordinate,
	parseBrightStarCatalogV50,
	selectBrightestBrightStarCatalogMembers,
} from '../../catalogs/bright-star-catalog-v50.js';

const SPEED_OF_LIGHT_METERS_PER_SECOND = 299792458;
const NATIVE_15_CENTERS_NANOMETERS = Object.freeze([
	375.6666666666667,
	407,
	438.3333333333333,
	469.66666666666663,
	501,
	532.3333333333333,
	563.6666666666666,
	595,
	626.3333333333333,
	657.6666666666666,
	689,
	720.3333333333333,
	751.6666666666666,
	783,
	814.3333333333333,
]);
const NATIVE_15_BIN_WIDTH_NANOMETERS = 31.333333333333332;

export const CR6B_BRIGHTEST_2000_CATALOG_CONTRACT = Object.freeze({
	id: 'color-reset-cr6b-brightest-2000-catalog-v1',
	product: 'exact-catalog-roster',
	catalogId: 'cds-v50-bright-star-catalogue-5th-revised',
	catalogSourceSha256:
		'd79223194f938533b4a4b7d832249d8661cf7adda088a8a0ec44039d3baab759',
	coordinateEpoch: 'J2000.0',
	coordinateFrame: 'eq-FK5-J2000',
	coordinateContract: 'celestial-rh-v1',
	selection:
		'finite-j2000-position-and-vmag; ascending-vmag; ascending-hr-tiebreak; first-2000',
	memberCount: 2000,
	spectralPackets: 'not-materialized-by-roster-proof',
});

export const CR6B_CURRENT_PHOTOMETRY_COVERAGE_CONTRACT = Object.freeze({
	id: 'color-reset-cr6b-current-photometry-coverage-v1',
	policy: 'pickles-bracketed-bv-johnson-bv-vega-v2',
	spectralBasisId: 'algorithm32-native-15-spectral-basis-v1',
	channelCentersNanometers: NATIVE_15_CENTERS_NANOMETERS,
	channelBinWidthNanometers: NATIVE_15_BIN_WIDTH_NANOMETERS,
	claim: 'coverage-analysis-only; no spectral packet is emitted, clamped, or substituted',
});

function interpolate(wavelengths, values, wavelength) {
	if (wavelength < wavelengths[0] || wavelength > wavelengths.at(-1)) {
		throw new RangeError('Spectral input does not cover the Native15 wavelength range.');
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
		for (
			let filterIndex = 1;
			filterIndex < filter.wavelengthNanometers.length;
			filterIndex += 1
		) {
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
		throw new RangeError('Native15 bins have no positive filter response.');
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
	return Object.freeze({
		lowerTemplateId: lower.template.id,
		upperTemplateId: upper.template.id,
		fraction: upperRatio === lowerRatio
			? 0
			: (targetRatio - lowerRatio) / (upperRatio - lowerRatio),
	});
}

function spectralClass(type) {
	return /([OBAFGKM])\s*(\d(?:\.\d)?)/i.exec(type ?? '')?.[1]?.toUpperCase() ?? null;
}

function luminosityClass(type) {
	return /(III|II|IV|V|I)/i.exec(type ?? '')?.[1]?.toUpperCase() ?? null;
}

function bMinusVFromRatio(ratio, bToVZeroPointRatio) {
	return -2.5 * Math.log10(ratio / bToVZeroPointRatio);
}

/** Build the exact BSC V/50 brightest-2000 roster without deriving spectra. */
export function buildCr6bBrightest2000Catalog(catalogText) {
	const parsed = parseBrightStarCatalogV50(catalogText);
	const selected = selectBrightestBrightStarCatalogMembers(
		parsed,
		CR6B_BRIGHTEST_2000_CATALOG_CONTRACT.memberCount,
	);
	const members = selected.map((member, canonicalIndex) => Object.freeze({
		canonicalIndex,
		memberId: member.memberId,
		hr: member.hr,
		name: member.name,
		rightAscensionJ2000Hours: member.rightAscensionJ2000Hours,
		declinationJ2000Degrees: member.declinationJ2000Degrees,
		latitudeRadians: member.latitudeRadians,
		longitudeRadians: member.longitudeRadians,
		visualMagnitude: member.visualMagnitude,
		visualMagnitudeCode: member.visualMagnitudeCode,
		visualMagnitudeUncertainty: member.visualMagnitudeUncertainty,
		bMinusV: member.bMinusV,
		spectralType: member.spectralType,
		relativeVBandFlux: member.relativeVBandFlux,
		direction: canonicalDirectionFromCatalogCoordinate(member),
	}));
	return Object.freeze({
		contract: CR6B_BRIGHTEST_2000_CATALOG_CONTRACT,
		parsedRecordCount: parsed.length,
		members: Object.freeze(members),
	});
}

/**
 * Report which roster members the retained Pickles/Johnson Native15 policy
 * can bracket. Unsupported members stay in the roster and receive no packet.
 */
export function analyzeCr6bCurrentPhotometryCoverage({
	members,
	templates,
	johnsonB,
	johnsonV,
}) {
	if (!Array.isArray(members) || members.length < 1) {
		throw new TypeError('CR6B coverage analysis requires catalog members.');
	}
	if (!Array.isArray(templates) || templates.length < 1) {
		throw new TypeError('CR6B coverage analysis requires Pickles templates.');
	}
	if (!johnsonB?.id?.includes('Johnson.B') || !johnsonV?.id?.includes('Johnson.V')) {
		throw new TypeError('CR6B coverage analysis requires SVO Johnson B and V filters.');
	}
	const metrics = templates.map((template) => {
		const values = NATIVE_15_CENTERS_NANOMETERS.map((center) => binAverage(
			template,
			center - NATIVE_15_BIN_WIDTH_NANOMETERS / 2,
			center + NATIVE_15_BIN_WIDTH_NANOMETERS / 2,
		));
		return Object.freeze({
			template,
			binnedB: weightedMeanBins(values, johnsonB),
			binnedV: weightedMeanBins(values, johnsonV),
		});
	});
	const bToVZeroPointRatio = zeroPointFluxDensity(johnsonB)
		/ zeroPointFluxDensity(johnsonV);
	const ratios = metrics.map((metric) => metric.binnedB / metric.binnedV);
	const supported = [];
	const unsupported = [];
	for (const member of members) {
		if (!Number.isFinite(member.visualMagnitude) || !Number.isFinite(member.bMinusV)) {
			throw new RangeError(`Member ${member.memberId} lacks finite V and B-V photometry.`);
		}
		const targetRatio = bToVZeroPointRatio * 10 ** (-0.4 * member.bMinusV);
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
		const record = Object.freeze({
			canonicalIndex: member.canonicalIndex,
			memberId: member.memberId,
			hr: member.hr,
			visualMagnitude: member.visualMagnitude,
			bMinusV: member.bMinusV,
			spectralType: member.spectralType,
		});
		if (choice) supported.push(Object.freeze({...record, ...choice}));
		else unsupported.push(record);
	}
	return Object.freeze({
		contract: CR6B_CURRENT_PHOTOMETRY_COVERAGE_CONTRACT,
		templateCount: metrics.length,
		supportedBMinusVRange: Object.freeze({
			minimum: bMinusVFromRatio(Math.max(...ratios), bToVZeroPointRatio),
			maximum: bMinusVFromRatio(Math.min(...ratios), bToVZeroPointRatio),
		}),
		coveredMemberCount: supported.length,
		unsupportedMemberCount: unsupported.length,
		unsupportedMembers: Object.freeze(unsupported),
	});
}
