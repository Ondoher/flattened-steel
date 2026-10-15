/** H16-H20 geometry/source packet; preserves the existing Native15 physical interpretation. */
type HorizonAuditInput = HorizonTransportInput & {
	/** Flat observer-dome center height, meters; unused for spherical geometry. */ domeCenterZ: number;
	/** Flat observer-dome radius, meters; unused for spherical geometry. */ domeRadius: number;
};

/** Independent nearest physical boundary; the observer dome is evaluated separately. */
type HorizonAuditBoundary = {
	/** Positive atmosphere exit distance, meters. */ top: number;
	/** Forward ground distance, or Infinity for a miss. */ ground: number;
	/** Nearest physical boundary distance, meters. */ distance: number;
	/** Whether the first physical boundary is opaque ground. */ endsOnGround: boolean;
};

/** Physical source and extinction at an exact point, before view attenuation. */
type HorizonAuditSource = {
	/** Rayleigh/Mie scattering sources, W m^-3 sr^-1 nm^-1. */ species: number[][];
	/** Total local extinction, m^-1. */ extinction: number[];
	/** Source-path Rayleigh/Mie density columns, meters. */ columns: number[];
	/** Physical illumination direction. */ sourceDirection: number[];
	/** Finite-source irradiance dilution, or the parallel multiplier. */ dilution: number;
	/** Physical altitude, meters. */ altitude: number;
};

/** A complete N1 viewing integral on explicitly supplied geometry. */
type HorizonAuditIntegral = {
	/** Integrated Rayleigh/Mie radiance, W m^-2 sr^-1 nm^-1. */ species: number[][];
	/** Integrated total spectral radiance in the same units. */ spectrum: number[];
	/** View transmittance at the supplied end. */ transmission: number[];
};

/** Optional source evaluator for holding the source field fixed during accumulation comparisons. */
type HorizonAuditSourceSampler = (point: number[], direction: number[]) => number[];

/** Exact typed subset of retained paired observation facts. */
type HorizonAuditObservation = {
	/** Original application facts and exact observation state. */ facts: {
		/** Mode and source placement recipe. */ state: {
			/** Actual mode identity. */ modeKind: string;
			/** Frozen geographic and temporal input. */ observation: GeometryObservation;
		};
		/** Authenticated snapshot of scalar uniforms used by prior display. */ uniforms: {
			/** Observer position in model meters. */ uCameraWorldPositionMeters: number[];
			/** Fixed display adaptation illuminance, lux. */ uColorResetTotalHorizontalIlluminanceLux: number;
		};
	};
	/** Saved physical rays and shader stages. */ rays: HorizonRayObservation[];
};

/** Keys describing the viewing segment, absent from the shared material packet.
 * - **"direction"** - Physical viewing direction, supplied separately for each ray.
 * - **"length"** - Viewing extent, independently derived for each ray.
 */
type HorizonAuditRayKey = 'direction' | 'length';

/** Retained independent local N1 packet. */
type HorizonAuditReference = {
	/** Fixed source and two-exponential material. */ physical: Omit<HorizonContinuousInputs, HorizonAuditRayKey>;
};

/** Earlier matched source/geometry comparison. */
type HorizonAuditGeometryPacket = {
	/** Physical distant-source unit direction. */ distantDirection: number[];
};

/** Sparse physical-J interpolation observation. */
type HorizonAuditLookup = {
	/** Query's physical scattering source. */ values: number[];
	/** Actual geometry-selected support, including spectral restoration factors. */ taps: readonly LocalSunCompactSpectralTap[];
};

/** Sparse physical-J source lookup capability, without allocating or mutating a full cache. */
interface HorizonAuditLookupSampler {
	/** Resolve one physical query and its complete support. */
	(point: number[], direction: number[]): HorizonAuditLookup;
}

/** Minimal immutable-run seal fields needed to debit the shared compute allowance. */
type HorizonAuditTimingSeal = {
	/** Producer's terminal timing record. */ result: {
		/** Measured producer elapsed time in milliseconds. */ elapsedMilliseconds: number;
	};
};

/** One angular-quadrature result for the same continuous first-order incoming field. */
type HorizonAuditAngular = {
	/** Total solid angle represented, steradians. */ solidAngle: number;
	/** Integrated phase-weighted second-scattering sources, selected Native15 channels. */ species: number[][];
	/** Per-region total second-scattering sources, same selected channels. */ regions: Record<string, number[]>;
	/** Direct reflected-ground fraction of each selected source channel. */ groundFractions: number[];
	/** Number of evaluated incoming directions. */ directions: number;
};

/** Positive quadrature directions and their physical solid-angle measures. */
type HorizonAuditAngularRule = {
	/** Physical unit vectors in the receiver frame. */ directions: number[][];
	/** Corresponding positive weights in steradians. */ weights: number[];
};

/** Frozen per-ray endpoint and N1 integral evidence from the first H16-H20 run. */
type HorizonAuditEndpointRow = {
	/** Zero for local, one for distant. */ mode: number;
	/** Elevation above horizontal, degrees. */ elevation: number;
	/** Azimuth relative to the source, degrees. */ heading: number;
	/** Physical observer position, meters. */ origin: number[];
	/** Physical viewing direction. */ direction: number[];
	/** Independently selected baseline path, meters. */ length: number;
	/** Captured GPU path length, or null for a synthetic heading. */ installedMeters: number | null;
	/** Captured unit direction's independently calculated path, or null when not compared. */ capturedIndependentMeters: number | null;
	/** Same-path continuous N1 spectrum. */ spectrum: number[];
	/** Per-channel numerical comparison allowance, spectral radiance units. */ allowance: number[];
	/** N1 omitted by the observer dome, or null for spherical geometry. */ fullTail: number[] | null;
	/** Baseline independent color projection. */ color: HorizonColorReading;
	/** Color after explicitly removing the observer dome, or null. */ withoutDomeColor: HorizonColorReading | null;
};

/** One retained incoming-light comparison and its declared geometry. */
type HorizonAuditIncomingRow = {
	/** Zero for local, one for distant. */ mode: number;
	/** Receiver altitude in meters. */ altitude: number;
	/** Physical receiver coordinates, meters. */ point: number[];
	/** Physical outgoing viewing direction. */ direction: number[];
	/** Selected channel centers in nanometers. */ wavelengths: number[];
	/** Actual-domain integration of continuous N1. */ baseline: HorizonAuditAngular;
	/** Boundary-split rules at counts 8 and 16. */ variants: HorizonAuditAngular[];
};

/** Saved cumulative spectrum at a physical distance. */
type HorizonAuditPathSample = {
	/** Distance from the observer, meters. */ distance: number;
	/** Integrated N1 through that distance. */ cumulativeSpectrum: number[];
};

/** Cumulative path samples for a registered away-Sun ray. */
type HorizonAuditPathRow = {
	/** Zero for local, one for distant. */ mode: number;
	/** Local elevation in degrees. */ elevation: number;
	/** Ordered cumulative observations. */ samples: HorizonAuditPathSample[];
};

/** Initial immutable registration consumed by the qualification/report stage. */
type HorizonAuditRegistration = {
	/** Local and distant complete Native15 physical packets. */ inputs: HorizonAuditInput[];
};
