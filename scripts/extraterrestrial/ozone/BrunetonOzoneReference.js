/**
 * Contained, production-independent authority for Bruneton's Earth-demo ozone
 * definition. The source table and profile are copied from the commit-pinned
 * reference identified below; this module performs no atmosphere transport.
 */

export const BRUNETON_OZONE_AUTHORITY = Object.freeze({
	id: 'bruneton-earth-demo-ozone-34f14e7-v1',
	author: 'Eric Bruneton',
	commit: '34f14e745cff948f4ca3157d1b62a445ffa7286f',
	sourcePath: 'references/downloads/bruneton-precomputed-atmosphere-34f14e7/demo.cc',
	sourceSha256: '7e3659cdd8c23feca988b49801029e36e201ff0701e693fee2069b441ffa40d2',
	temperatureKelvin: 233,
	dobsonUnits: 300,
	dobsonUnitMoleculesPerSquareMeter: 2.687e20,
	densityIntegralMeters: 15000,
	profileAltitudesMeters: Object.freeze({bottom: 10000, peak: 25000, top: 40000}),
	tableMinimumNanometers: 360,
	tableMaximumNanometers: 830,
	tableSpacingNanometers: 10,
	crossSectionUnits: 'm^2',
	absorptionExtinctionUnits: 'm^-1',
	projectionPolicy:
		'piecewise-linear evaluation of the retained 10 nm bin-average table at each execution-basis channel coordinate',
});

/** Bruneton Earth-demo ozone cross sections at 360..830 nm in 10 nm steps. */
export const BRUNETON_OZONE_CROSS_SECTIONS_SQUARE_METERS = Object.freeze([
	1.18e-27,
	2.182e-28,
	2.818e-28,
	6.636e-28,
	1.527e-27,
	2.763e-27,
	5.52e-27,
	8.451e-27,
	1.582e-26,
	2.316e-26,
	3.669e-26,
	4.924e-26,
	7.752e-26,
	9.016e-26,
	1.48e-25,
	1.602e-25,
	2.139e-25,
	2.755e-25,
	3.091e-25,
	3.5e-25,
	4.266e-25,
	4.672e-25,
	4.398e-25,
	4.701e-25,
	5.019e-25,
	4.305e-25,
	3.74e-25,
	3.215e-25,
	2.662e-25,
	2.238e-25,
	1.852e-25,
	1.473e-25,
	1.209e-25,
	9.423e-26,
	7.455e-26,
	6.566e-26,
	5.105e-26,
	4.15e-26,
	4.228e-26,
	3.237e-26,
	2.451e-26,
	2.801e-26,
	2.534e-26,
	1.624e-26,
	1.465e-26,
	2.078e-26,
	1.383e-26,
	7.105e-27,
]);

/** Exact current Native-15 execution-basis coordinates in nanometers. */
export const NATIVE_15_WAVELENGTHS_NANOMETERS = Object.freeze([
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

/** Exact B1 direct-40 execution-basis coordinates in nanometers. */
export const DIRECT_40_WAVELENGTHS_NANOMETERS = Object.freeze(
	Array.from({length: 40}, (_value, index) => 360 + (470 * index) / 40),
);

/** Return Bruneton's maximum ozone number density in molecules per cubic meter. */
export function maximumOzoneNumberDensityPerCubicMeter() {
	return (
		(BRUNETON_OZONE_AUTHORITY.dobsonUnits *
			BRUNETON_OZONE_AUTHORITY.dobsonUnitMoleculesPerSquareMeter) /
		BRUNETON_OZONE_AUTHORITY.densityIntegralMeters
	);
}

/** Return the ozone column in molecules per square meter. */
export function ozoneColumnMoleculesPerSquareMeter() {
	return BRUNETON_OZONE_AUTHORITY.dobsonUnits * BRUNETON_OZONE_AUTHORITY.dobsonUnitMoleculesPerSquareMeter;
}

/** Evaluate Bruneton's normalized triangular ozone density at an altitude. */
export function ozoneDensityScaleAtAltitudeMeters(altitudeMeters) {
	if (typeof altitudeMeters !== 'number' || !Number.isFinite(altitudeMeters)) {
		throw new TypeError('Ozone altitude must be finite.');
	}
	const {bottom, peak, top} = BRUNETON_OZONE_AUTHORITY.profileAltitudesMeters;
	if (altitudeMeters <= bottom || altitudeMeters >= top) return 0;
	if (altitudeMeters <= peak) return (altitudeMeters - bottom) / (peak - bottom);
	return (top - altitudeMeters) / (top - peak);
}

/** Evaluate the retained 233 K cross-section table by linear interpolation. */
export function ozoneCrossSectionAtNanometers(wavelengthNanometers) {
	if (typeof wavelengthNanometers !== 'number' || !Number.isFinite(wavelengthNanometers)) {
		throw new TypeError('Ozone wavelength must be finite.');
	}
	const minimum = BRUNETON_OZONE_AUTHORITY.tableMinimumNanometers;
	const maximum = BRUNETON_OZONE_AUTHORITY.tableMaximumNanometers;
	const spacing = BRUNETON_OZONE_AUTHORITY.tableSpacingNanometers;
	if (wavelengthNanometers < minimum || wavelengthNanometers > maximum) {
		throw new RangeError(`Ozone wavelength must be in [${minimum}, ${maximum}] nm.`);
	}
	const coordinate = (wavelengthNanometers - minimum) / spacing;
	const lowerIndex = Math.floor(coordinate);
	const upperIndex = Math.min(BRUNETON_OZONE_CROSS_SECTIONS_SQUARE_METERS.length - 1, lowerIndex + 1);
	const fraction = coordinate - lowerIndex;
	return (
		BRUNETON_OZONE_CROSS_SECTIONS_SQUARE_METERS[lowerIndex] * (1 - fraction) +
		BRUNETON_OZONE_CROSS_SECTIONS_SQUARE_METERS[upperIndex] * fraction
	);
}

/** Evaluate the absorption coefficient at one altitude and wavelength. */
export function ozoneAbsorptionExtinctionPerMeter(altitudeMeters, wavelengthNanometers) {
	return (
		maximumOzoneNumberDensityPerCubicMeter() *
		ozoneDensityScaleAtAltitudeMeters(altitudeMeters) *
		ozoneCrossSectionAtNanometers(wavelengthNanometers)
	);
}

/** Evaluate exact vertical ozone-only optical depth for the declared column. */
export function verticalOzoneOpticalDepth(wavelengthNanometers) {
	return ozoneColumnMoleculesPerSquareMeter() * ozoneCrossSectionAtNanometers(wavelengthNanometers);
}

/** Project the reference onto one explicit execution-basis coordinate list. */
export function projectOzoneReference(wavelengthsNanometers) {
	return wavelengthsNanometers.map((wavelengthNanometers) => {
		const crossSectionSquareMeters = ozoneCrossSectionAtNanometers(wavelengthNanometers);
		const peakAbsorptionExtinctionPerMeter =
			maximumOzoneNumberDensityPerCubicMeter() * crossSectionSquareMeters;
		const verticalOpticalDepth = ozoneColumnMoleculesPerSquareMeter() * crossSectionSquareMeters;
		return {
			wavelengthNanometers,
			crossSectionSquareMeters,
			peakAbsorptionExtinctionPerMeter,
			verticalOpticalDepth,
			verticalTransmittance: Math.exp(-verticalOpticalDepth),
		};
	});
}

/** Return the focused finite gates for this contained authority. */
export function auditBrunetonOzoneReference() {
	const native15 = projectOzoneReference(NATIVE_15_WAVELENGTHS_NANOMETERS);
	const direct40 = projectOzoneReference(DIRECT_40_WAVELENGTHS_NANOMETERS);
	const tableMaximumCrossSectionSquareMeters = Math.max(...BRUNETON_OZONE_CROSS_SECTIONS_SQUARE_METERS);
	const tableMaximumIndex = BRUNETON_OZONE_CROSS_SECTIONS_SQUARE_METERS.indexOf(
		tableMaximumCrossSectionSquareMeters,
	);
	const shared595 = projectOzoneReference([595])[0];
	const densityIntegralFromOneKilometerTrapezoids = Array.from({length: 61}, (_value, index) => index * 1000)
		.reduce((sum, altitudeMeters, index, altitudes) => {
			if (index === altitudes.length - 1) return sum;
			const nextAltitudeMeters = altitudes[index + 1];
			return (
				sum +
				0.5 *
					(ozoneDensityScaleAtAltitudeMeters(altitudeMeters) +
						ozoneDensityScaleAtAltitudeMeters(nextAltitudeMeters)) *
					(nextAltitudeMeters - altitudeMeters)
			);
		}, 0);

	return {
		authority: BRUNETON_OZONE_AUTHORITY,
		tableSampleCount: BRUNETON_OZONE_CROSS_SECTIONS_SQUARE_METERS.length,
		ozoneColumnMoleculesPerSquareMeter: ozoneColumnMoleculesPerSquareMeter(),
		maximumOzoneNumberDensityPerCubicMeter: maximumOzoneNumberDensityPerCubicMeter(),
		densityAnchors: {
			at0Meters: ozoneDensityScaleAtAltitudeMeters(0),
			at10000Meters: ozoneDensityScaleAtAltitudeMeters(10000),
			at25000Meters: ozoneDensityScaleAtAltitudeMeters(25000),
			at40000Meters: ozoneDensityScaleAtAltitudeMeters(40000),
			at60000Meters: ozoneDensityScaleAtAltitudeMeters(60000),
		},
		densityIntegralFromOneKilometerTrapezoids,
		tableMaximum: {
			wavelengthNanometers:
				BRUNETON_OZONE_AUTHORITY.tableMinimumNanometers +
				tableMaximumIndex * BRUNETON_OZONE_AUTHORITY.tableSpacingNanometers,
			crossSectionSquareMeters: tableMaximumCrossSectionSquareMeters,
			verticalOpticalDepth:
				ozoneColumnMoleculesPerSquareMeter() * tableMaximumCrossSectionSquareMeters,
			verticalTransmittance: Math.exp(
				-ozoneColumnMoleculesPerSquareMeter() * tableMaximumCrossSectionSquareMeters,
			),
		},
		shared595NanometerAnchor: shared595,
		native15,
		direct40,
	};
}
