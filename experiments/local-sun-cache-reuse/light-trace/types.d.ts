/** A fixed image-space sample, using top-left PNG coordinates. */
type LocalSunBandPixel = {
	/** Horizontal pixel index. */ x: number;
	/** Vertical pixel index. */ y: number;
};
/** One actual column-runtime endpoint and its direct-source optical context. */
type LocalSunBandTracePoint = {
	/** Distance from the camera, meters. */ distanceMeters: number;
	/** Physical world coordinates, meters. */ positionMeters: number[];
	/** Euclidean distance to the Sun center, meters. */ sourceDistanceMeters: number;
	/** Sun-to-point segment inside the atmospheric slab, meters. */ sourceAtmosphericLengthMeters: number;
	/** Native15 Sun-to-point optical depths, dimensionless. */ sourceOpticalDepth: number[];
	/** Native15 camera-to-point optical depths, dimensionless. */ viewOpticalDepth: number[];
	/** Native15 local extinction coefficients, m^-1. */ extinction: number[];
	/** Reconstructed pure J1-J4 densities, W m^-3 sr^-1 nm^-1. */ densities: number[][];
	/** Analytic continuous J1 density at this physical point, same units. */ continuousJ1: number[];
};
/** One actual view integration interval, with additive per-order contributions. */
type LocalSunBandTraceInterval = {
	/** Near-camera endpoint distance, meters. */ lowerMeters: number;
	/** Farther endpoint distance, meters. */ upperMeters: number;
	/** Native15 contributions by pure J1-J4, W m^-2 sr^-1 nm^-1. */ byOrder: number[][];
	/** Continuous-primary contribution, W m^-2 sr^-1 nm^-1. */ continuousJ1: number[];
};
/** One selected pixel's measured-field path attribution. */
type LocalSunBandRayTrace = {
	/** Fixed top-left image coordinate. */ pixel: LocalSunBandPixel;
	/** Geometry-mapped physical unit view direction. */ direction: UnitVector3;
	/** Resolved finite rendering segment. */ segment: RaySegment;
	/** Actual column-runtime endpoints. */ points: LocalSunBandTracePoint[];
	/** Actual positive view integration contributions. */ intervals: LocalSunBandTraceInterval[];
	/** Additive J1-J4 view radiance spectra, W m^-2 sr^-1 nm^-1. */ orderSpectra: number[][];
	/** Sum of pure-order view radiance spectra, same units. */ totalSpectrum: number[];
	/** Independently invoked current CPU runtime on the cumulative readback. */ cpuSpectrum: number[];
	/** Current GPU runtime spectrum at the same physical direction. */ gpuSpectrum: number[];
	/** Continuous-primary substitution, W m^-2 sr^-1 nm^-1, on the unchanged schedule. */ continuousJ1Spectrum: number[];
	/** Density trapezoid integral without survival, diagnostic only, same units. */ noViewAttenuationSpectrum: number[];
	/** Signed projected linear sRGB before display gain/encoding. */ linearRgb: readonly [number, number, number];
	/** Current gain and encoding applied to attributed spectrum. */ displayRgb: readonly [number, number, number];
	/** Actual PNG-equivalent byte values from the rendered framebuffer. */ pixelBytes: number[];
};
/** Bounded source-trace evidence; integrated caches retain no unique photon history. */
type LocalSunBandTraceResult = {
	/** Versioned diagnostic schema. */ schema: string;
	/** Frozen state's exact observation instant. */ state: string;
	/** Native15 channel centers, nanometers. */ wavelengthsNm: number[];
	/** Native15 channel widths for spectral integration, nanometers. */ widthsNm: number[];
	/** Fixed rays spanning the visible warm band and a higher-sky control. */ rays: LocalSunBandRayTrace[];
	/** Pure-order attribution versus current cumulative CPU transport. */ closure: LocalSunRotationResidual;
	/** Attributed spectrum versus current GPU transport. */ cpuGpu: LocalSunRotationResidual;
	/** Largest per-channel projected display/actual pixel byte residual. */ maximumPixelByteDifference: number;
	/** Explicit interpretation and diagnostic limits. */ limitations: string;
};
