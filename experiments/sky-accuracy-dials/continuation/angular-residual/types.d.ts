/** Within-time/elevation centered angular response at one wavelength. */
type SkyAngularPoint = Readonly<{
	/** Original time identity, also the held-out validation group. */ time: string;
	/** Exact canonical square-ring radius. */ ring: number;
	/** Angular separation from the fitted Sun in degrees. */ angle: number;
	/** Centered cosine, cosine squared and cosine cubed. */ x: readonly number[];
	/** Centered model-minus-measured residual in mW or symmetric fraction. */ y: number;
}>;
