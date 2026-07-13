/** Type that stores constants used by the accepted Figure 1 display conversion. */
type Figure1DisplayConstants = {
	/** Value that identifies the display conversion. */
	readonly conversionKind: string;

	/** Value that identifies the output color space. */
	readonly outputColorSpace: string;

	/** Value that stores maximum luminous efficacy with its physical unit. */
	readonly maxLuminousEfficacy: UnitValue<'lumens-per-watt'>;

	/** Value that stores the accepted comparison exposure scalar. */
	readonly brunetonComparisonToneMapExposureScale: number;

	/** Value that stores the accepted Figure 1 exponential tone-map coefficient. */
	readonly paperFigure1ToneMapK: number;

	/** Value that stores the XYZ-to-linear-sRGB matrix. */
	readonly xyzToLinearSrgbMatrix: readonly (readonly [number, number, number])[];

	/** Value that records whether the demo gamma power is intentionally omitted. */
	readonly demoGammaPowerOmitted: boolean;

	/** Value that records whether the demo white point is intentionally omitted. */
	readonly demoWhitePointOmitted: boolean;
};

/** Optional construction values for one Bruneton display model. */
type BrunetonColorDisplayModelConfiguration = {
	/** Figure 1 constants supplied instead of the canonical defaults. */
	readonly displayConstants?: Figure1DisplayConstants;
};

/** Instantaneous Color-owned exposure result derived from measured sky illuminance. */
type SkyExposureCoefficientCalculation = Readonly<{
	/** Measured atmospheric-only sky illuminance in lux. */
	readonly skyIlluminanceLux: number;
	/** Diffuse-sky reference illuminance in lux. */
	readonly referenceIlluminanceLux: number;
	/** Lower illuminance bound in lux used before reciprocal exposure. */
	readonly illuminanceFloorLux: number;
	/** Clamped instantaneous exposure factor. */
	readonly exposureFactor: number;
	/** Figure-1 coefficient after applying the exposure factor. */
	readonly effectiveDisplayCoefficient: number;
	/** Minimum provisional exposure factor. */
	readonly minimumExposureFactor: number;
	/** Maximum provisional exposure factor. */
	readonly maximumExposureFactor: number;
}>;
