/** Frozen conditional physical inputs, with explicit radiometric units. */
type ArmPhysicalContract = {
	spectrumId?: string;
	reuseWavelengthNanometers?: number[];
	channels: {
		wavelengthNanometers: number;
		sourceIrradianceWattsPerSquareMeterPerNanometer: number;
		rayleighScatteringPerMeter: number;
		mieExtinctionPerMeter: number;
		mieSingleScatteringAlbedo: number;
		groundAlbedo: number;
		miePhaseTable: DistantSunMiePhaseTable;
		ozoneCrossSectionSquareMeters: number;
	}[];
	profiles: {
		rayleighScaleHeightMeters: number;
		mieScaleHeightMeters: number;
		ozoneDobsonUnits: number;
		ozoneMaximumDensityPerCubicMeter: number;
		ozoneCrossSectionTable: number[];
	};
	cases: {id: string; solarZenithGeometricDegrees: number}[];
};
