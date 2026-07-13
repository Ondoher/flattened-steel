/**
 * Describe the accepted spectral-to-display conversion.
 */
type DisplayConversionDescriptor = {
	/** Identify the conversion. */
	readonly conversionKind: string;

	/** Identify the output color space. */
	readonly outputColorSpace: string;

	/** Identify the selected tone mapping. */
	readonly toneMapping: "paper-figure1-exponential";

	/** Store paper-facing conversion metadata. */
	readonly metadata: {
		/** Identify the official color-matching observer. */
		readonly cieObserver: "CIE 1931 2-degree";
		/** Store the source CIE table sample spacing. */
		readonly cieTableResolution: UnitValue<"nanometers">;
		/** Identify the exactly-once native-bin integration policy. */
		readonly spectralIntegration: "native-15-bin-average-width-once";
		/** Store maximum luminous efficacy with its physical unit. */
		readonly maxLuminousEfficacy: UnitValue<"lumens-per-watt">;
		/** Store the accepted Figure 1 exponential tone-map coefficient. */
		readonly paperFigure1ToneMapK: number;
		/** Record that the demo-only gamma power is omitted. */
		readonly demoGammaPowerOmitted: boolean;
		/** Record that the demo-only white point is omitted. */
		readonly demoWhitePointOmitted: boolean;
	};
};

/**
 * Store constants used by the accepted Figure 1 display conversion.
 */
type Figure1DisplayConstants = {
	/** Identify the display conversion. */
	readonly conversionKind: string;

	/** Identify the output color space. */
	readonly outputColorSpace: string;

	/** Store maximum luminous efficacy with its physical unit. */
	readonly maxLuminousEfficacy: UnitValue<"lumens-per-watt">;

	/** Store the accepted comparison exposure scalar. */
	readonly brunetonComparisonToneMapExposureScale: number;

	/** Store the accepted Figure 1 exponential tone-map coefficient. */
	readonly paperFigure1ToneMapK: number;

	/** Store the XYZ-to-linear-sRGB matrix. */
	readonly xyzToLinearSrgbMatrix: readonly (readonly [number, number, number])[];

	/** Record whether the demo gamma power is intentionally omitted. */
	readonly demoGammaPowerOmitted: boolean;

	/** Record whether the demo white point is intentionally omitted. */
	readonly demoWhitePointOmitted: boolean;
};
