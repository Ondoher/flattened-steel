const SPEED_OF_LIGHT_METERS_PER_SECOND = 299792458;

export const CR6F_NATIVE_15_CENTERS_NANOMETERS = Object.freeze([
	375.6666666666667, 407, 438.3333333333333, 469.66666666666663, 501,
	532.3333333333333, 563.6666666666666, 595, 626.3333333333333,
	657.6666666666666, 689, 720.3333333333333, 751.6666666666666, 783,
	814.3333333333333,
]);

export const CR6F_NATIVE_15_BIN_WIDTH_NANOMETERS = 31.333333333333332;

export const CR6F_SPECTRAL_MATERIALIZATION_CONTRACT = Object.freeze({
	id: 'color-reset-cr6f-brightest-2000-spectral-materialization-v1',
	policy: 'pickles-bracketed-plus-photometry-constrained-red-proxy-v1',
	spectralBasisId: 'algorithm32-native-15-spectral-basis-v1',
	quantity: 'spectral irradiance density',
	units: 'W m^-2 nm^-1',
	memberCount: 2000,
	coveredPolicyMemberCount: 1993,
	proxyMemberCount: 7,
	claim:
		'exact catalog Johnson B-V and V reconstruction; carbon-star molecular-band detail unclaimed',
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

export function cr6fWeightedMeanBins(values, filter) {
	let weighted = 0;
	let weight = 0;
	for (let channelIndex = 0; channelIndex < values.length; channelIndex += 1) {
		const center = CR6F_NATIVE_15_CENTERS_NANOMETERS[channelIndex];
		const lower = center - CR6F_NATIVE_15_BIN_WIDTH_NANOMETERS / 2;
		const upper = center + CR6F_NATIVE_15_BIN_WIDTH_NANOMETERS / 2;
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
		throw new RangeError('Native15 bins have no positive filter response.');
	}
	return weighted / weight;
}

function zeroPointFluxDensity(filter) {
	const wavelengthMeters = filter.pivotWavelengthNanometers * 1e-9;
	return filter.zeroPointJy * 1e-26 * SPEED_OF_LIGHT_METERS_PER_SECOND
		/ (wavelengthMeters * wavelengthMeters) * 1e-9;
}

function templateValues(template) {
	return CR6F_NATIVE_15_CENTERS_NANOMETERS.map((center) => binAverage(
		template,
		center - CR6F_NATIVE_15_BIN_WIDTH_NANOMETERS / 2,
		center + CR6F_NATIVE_15_BIN_WIDTH_NANOMETERS / 2,
	));
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

function tiltValues(values, exponent, pivotNanometers) {
	return values.map((value, index) => value
		* (CR6F_NATIVE_15_CENTERS_NANOMETERS[index] / pivotNanometers) ** exponent);
}

function solveTiltExponent(values, targetRatio, johnsonB, johnsonV) {
	const ratioAt = (exponent) => {
		const tilted = tiltValues(values, exponent, johnsonV.pivotWavelengthNanometers);
		return cr6fWeightedMeanBins(tilted, johnsonB) / cr6fWeightedMeanBins(tilted, johnsonV);
	};
	let lower = -32;
	let upper = 32;
	if (!(ratioAt(lower) > targetRatio && ratioAt(upper) < targetRatio)) {
		throw new RangeError('Declared spectral-tilt solve does not bracket the target B/V ratio.');
	}
	for (let iteration = 0; iteration < 96; iteration += 1) {
		const middle = (lower + upper) / 2;
		if (ratioAt(middle) > targetRatio) lower = middle;
		else upper = middle;
	}
	return (lower + upper) / 2;
}

function selectBracket(metrics, member, targetRatio) {
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
	return [luminosityCandidates, spectralCandidates, metrics]
		.map((candidates) => bracket(candidates, targetRatio))
		.find(Boolean) ?? null;
}

function proxyBaseTemplate(member, templates, proxyPolicy) {
	const record = proxyPolicy.find(({hr}) => hr === member.hr);
	if (!record) throw new RangeError(`No declared red-proxy policy for HR ${member.hr}.`);
	const template = templates.find(({id}) => id === record.baseTemplateId);
	if (!template) throw new RangeError(`Missing declared Pickles base ${record.baseTemplateId}.`);
	return {record, template};
}

export function materializeCr6fBrightest2000Spectra({
	members,
	templates,
	johnsonB,
	johnsonV,
	proxyPolicy,
}) {
	if (!Array.isArray(members) || members.length !== 2000) {
		throw new TypeError('CR6F requires the exact 2,000-member roster.');
	}
	if (!Array.isArray(templates) || templates.length < 100) {
		throw new TypeError('CR6F requires the checked Pickles template set.');
	}
	if (!Array.isArray(proxyPolicy) || proxyPolicy.length !== 7) {
		throw new TypeError('CR6F requires exactly seven predeclared red proxies.');
	}
	const metrics = templates.map((template) => {
		const values = templateValues(template);
		return {
			template,
			values,
			binnedB: cr6fWeightedMeanBins(values, johnsonB),
			binnedV: cr6fWeightedMeanBins(values, johnsonV),
		};
	});
	const bZero = zeroPointFluxDensity(johnsonB);
	const vZero = zeroPointFluxDensity(johnsonV);
	const packets = members.map((member) => {
		if (!Number.isFinite(member.visualMagnitude) || !Number.isFinite(member.bMinusV)) {
			throw new RangeError(`Member ${member.memberId} lacks finite V and B-V photometry.`);
		}
		const targetRatio = bZero / vZero * 10 ** (-0.4 * member.bMinusV);
		const choice = selectBracket(metrics, member, targetRatio);
		let normalized;
		let derivation;
		if (choice) {
			normalized = choice.lower.values.map((value, channelIndex) =>
				(1 - choice.fraction) * value / choice.lower.binnedV
				+ choice.fraction * choice.upper.values[channelIndex] / choice.upper.binnedV);
			derivation = {
				kind: 'retained-bracketed-pickles',
				lowerTemplateId: choice.lower.template.id,
				upperTemplateId: choice.upper.template.id,
				fraction: choice.fraction,
			};
		} else {
			const {record, template} = proxyBaseTemplate(member, templates, proxyPolicy);
			const baseValues = templateValues(template);
			const tiltExponent = solveTiltExponent(baseValues, targetRatio, johnsonB, johnsonV);
			const tilted = tiltValues(
				baseValues,
				tiltExponent,
				johnsonV.pivotWavelengthNanometers,
			);
			const tiltedV = cr6fWeightedMeanBins(tilted, johnsonV);
			normalized = tilted.map((value) => value / tiltedV);
			derivation = {
				kind: record.kind,
				baseTemplateId: template.id,
				tiltExponent,
				pivotNanometers: johnsonV.pivotWavelengthNanometers,
				claimLimit: record.claimLimit,
			};
		}
		const scale = vZero * 10 ** (-0.4 * member.visualMagnitude);
		const spectralIrradiance = normalized.map((value) => value * scale);
		if (spectralIrradiance.some((value) => !(value >= 0) || !Number.isFinite(value))) {
			throw new RangeError(`Invalid Native15 packet for ${member.memberId}.`);
		}
		const reconstructedVFlux = cr6fWeightedMeanBins(spectralIrradiance, johnsonV);
		const reconstructedBFlux = cr6fWeightedMeanBins(spectralIrradiance, johnsonB);
		const reconstructedV = -2.5 * Math.log10(reconstructedVFlux / vZero);
		const reconstructedBMinusV = -2.5 * Math.log10(
			(reconstructedBFlux / reconstructedVFlux) / (bZero / vZero),
		);
		return Object.freeze({
			canonicalIndex: member.canonicalIndex,
			memberId: member.memberId,
			hr: member.hr,
			visualMagnitude: member.visualMagnitude,
			bMinusV: member.bMinusV,
			spectralType: member.spectralType,
			spectralIrradiance: Object.freeze(spectralIrradiance),
			reconstructedVisualMagnitude: reconstructedV,
			reconstructedBMinusV,
			derivation: Object.freeze(derivation),
		});
	});
	return Object.freeze({
		contract: CR6F_SPECTRAL_MATERIALIZATION_CONTRACT,
		packets: Object.freeze(packets),
	});
}
