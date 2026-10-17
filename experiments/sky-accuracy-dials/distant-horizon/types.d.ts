/// <reference path="../../../scripts/algorithm32/solar-zenith-cache/types.d.ts" />

/** Standalone spherical N1 rendering request, independent of app/cache execution. */
type DistantAerosolGpuInput = {
	/** Complete generated GLSL with frozen physical coefficients and quadrature. */ readonly shader: string;
	/** Angular image dimensions in pixels. */ readonly width: number; readonly height: number;
	/** Unit ray directions for independent spectral parity. */ readonly directions: readonly (readonly number[])[];
};
/** A rendered sky and spectral readbacks at one fixed aerosol amplitude. */
type DistantAerosolGpuCase = {
	/** Remaining aerosol fraction, one or zero. */ fraction: number;
	/** Bottom-up RGBA Float32 readback; RGB is signed linear sRGB in physical units. */ pixels: number[];
	/** Native15 radiance for each requested probe direction. */ spectra: number[][];
};
/** Completed standalone hardware execution; failed operations reject without an accepted result. */
type DistantAerosolGpuResult = {
	/** Hardware adapter name; software rendering is rejected. */ renderer: string;
	/** Browser-side compile/render/readback duration. */ milliseconds: number;
	/** Matched baseline and zero-aerosol outputs. */ cases: DistantAerosolGpuCase[];
};

/** One requested production recurrence texel and its compact packet row. */
type HorizonProductionCoordinate = {
	/** W27 logical direction index. */ readonly x: number;
	/** Solar-major, altitude-minor recurrence row. */ readonly y: number;
	/** Compact row ordinal used only by the isolated packet replay. */ readonly row: number;
};
/** One physical midpoint and complete production interpolation support. */
type HorizonProductionSample = {
	/** Cubed-sphere face, continuous u and continuous v, rounded to shader floats. */ readonly coordinate: readonly number[];
	/** Zero-based continuous solar coordinate, rounded to shader float. */ readonly zenith: number;
	/** Two physical altitude indices. */ readonly altitudeIndices: readonly number[];
	/** Two linear altitude weights, rounded to shader floats. */ readonly altitudeWeights: readonly number[];
	/** Midpoint altitude in metres, rounded to shader float. */ readonly height: number;
	/** Physical path interval in metres, rounded to shader float. */ readonly step: number;
	/** Sparse coordinate indices indexed by altitude, solar knot and direction corner. */ readonly taps: readonly (readonly (readonly number[])[])[];
};
/** A complete away-Sun view ray at one numerical interval count. */
type HorizonProductionJob = {
	/** Viewing elevation in degrees. */ readonly elevation: number;
	/** Quadratic interval count; 30 is the production control. */ readonly intervals: number;
	/** Physical unit viewing vector in the retained H40 frame. */ readonly direction: readonly number[];
	/** Distance to the atmosphere top in metres. */ readonly length: number;
	/** Ordered view integration midpoints. */ readonly samples: readonly HorizonProductionSample[];
};
/** A physical Native48/Z180 cell row in the compact packet replay. */
type HorizonProductionRow = {
	/** Native48 altitude index. */ readonly position: number;
	/** Z180 solar index. */ readonly zenith: number;
};
/** Authenticated projection of the deployed package report. */
type HorizonProductionDeployment = {
	/** Immutable deployed configuration identities. */ readonly configurations: readonly DialFileIdentity[];
};
/** Consumed deployed configuration fact; the complete authenticated document is retained separately. */
type HorizonProductionConfiguration = {
	/** Exact numerical identity of the selected deployed production compiler controls. */ readonly numericalIdentity: string;
};
/** Union of all required production-grid cells; unused packet cells are never consumed. */
type HorizonProductionPlan = {
	/** Sparse recurrence coordinates, stable across channels and orders. */ readonly coordinates: readonly HorizonProductionCoordinate[];
	/** Explicit altitude/solar row identities in packet allocation order. */ readonly rows: readonly HorizonProductionRow[];
	/** All matched rays and view-refinement controls. */ readonly jobs: readonly HorizonProductionJob[];
};
/** Serialized hardware replay request. */
type HorizonProductionControl = {
	/** Optional contained Toronto phase/SSA intervention; production deployment stays unchanged. */ readonly material?: HorizonAerosolMaterial;
	/** Canonical production numerical request with physical matching overrides only. */ readonly request: DistantSunSceneCacheCompilerBuildRequest;
	/** Native15 channel indices selected for this run. */ readonly channels: readonly number[];
	/** Exact required sparse support and float shader inputs. */ readonly plan: HorizonProductionPlan;
	/** Matched sea-level Rayleigh coefficients per metre. */ readonly rayleigh: readonly number[];
	/** Rayleigh density scale height in metres. */ readonly scaleHeight: number;
	/** Optional matched aerosol extinction coefficients; absent in earlier zero-aerosol controls. */ readonly mie?: readonly number[];
	/** Aerosol density scale height in metres when aerosol extinction is present. */ readonly mieHeight?: number;
};
/** A completed canonical recurrence channel and its GPU lookup observations. */
type HorizonProductionChannel = {
	/** Native15 wavelength index. */ readonly channel: number;
	/** Actual canonical compiler resource and timing observations. */ readonly report: DistantSunSceneCacheWavelengthResult;
	/** Pure J1 through J4 at every requested sparse coordinate. */ readonly pure: readonly (readonly number[])[];
	/** Cumulative N1 through N4, then view-job ordinal, in W m^-2 sr^-1 nm^-1. */ readonly spectra: readonly (readonly number[])[];
};
/** Hardware replay output; GPU ownership is retired before resolving. */
type HorizonProductionResult = {
	/** Reported hardware adapter. */ readonly renderer: string;
	/** All requested channels, in input order. */ readonly reports: readonly HorizonProductionChannel[];
	/** Actual view shader containing unchanged production cubic lookup. */ readonly fragment: string;
};
/** Independently retained external color comparison at an actual measured elevation. */
type HorizonProductionComparison = {
	/** Viewing elevation in degrees. */ readonly elevation: number;
	/** Physical spectrum from production N1 at Q30. */ readonly productionN1: readonly number[];
	/** Physical spectrum from production N4 at Q30. */ readonly productionN4: readonly number[];
	/** Physical spectrum from external all-order transport. */ readonly reference: readonly number[];
};
/** A solved cumulative view spectrum with independent physical color projection. */
type HorizonProductionOrderReading = {
	/** Last included scattering order. */ readonly order: number;
	/** Native15 spectral radiance. */ readonly spectrum: readonly number[];
	/** Independently bin-integrated physical color. */ readonly color: HorizonColorReading;
};
/** One view-refinement observation of all four cumulative orders. */
type HorizonProductionReading = {
	/** Viewing elevation in degrees. */ readonly elevation: number;
	/** Quadratic view interval count. */ readonly intervals: number;
	/** N1 through N4 observations, in order. */ readonly cumulative: readonly HorizonProductionOrderReading[];
};
/** Persisted full-spectrum comparison with physical color values. */
type HorizonProductionColorComparison = HorizonProductionComparison & {
	/** Production first-order physical color. */ readonly productionN1Color: HorizonColorReading;
	/** Production N4 physical color. */ readonly productionN4Color: HorizonColorReading;
	/** External all-order physical color. */ readonly referenceColor: HorizonColorReading;
};
/** Three display conversions of one unchanged completed scattering spectrum. */
type HorizonDisplayRow = {
	/** Viewing elevation in degrees. */ readonly elevation: number;
	/** Explicit production N4 or external all-order label. */ readonly source: string;
	/** Original Native15 radiance, without normalization or fitting. */ readonly spectrum: readonly number[];
	/** Existing independent bin-integrated CIE projection followed by p2 mapping. */ readonly independent: readonly number[];
	/** Complete production-owned Bruneton model: midpoint CIE and Figure 1 mapping. */ readonly bruneton: readonly number[];
	/** Complete selected production p2 model: midpoint CIE and p2 gain/mapping. */ readonly production: readonly number[];
};
/** Authenticated subset of the actual external-case metadata. */
type HorizonAerosolCaseMetadata = {
	/** Original physical medium. */ readonly medium: HorizonReferenceMedium;
	/** Actual numerical and directional settings. */ readonly configuration: HorizonLibCase;
	/** Explicit normalized aerosol phase representation. */ readonly phase: {
		/** Dimensionless Legendre coefficients, starting with k0=1. */ readonly moments: readonly number[];
	};
};
/** Direct checks of one actual optical grid; identical hashes qualify further repeats. */
type HorizonAerosolGridProof = {
	/** Individually finalized shared-tool source. */ readonly toolRun: string;
	/** Actual atmospheric layer count. */ readonly layers: number;
	/** Hash of the ordered optical-input path/hash inventory. */ readonly opticalInputIdentity: string;
	/** Largest relative aerosol layer-column error. */ readonly maximumAerosolLayerRelativeError: number;
	/** Largest relative molecular layer-column error. */ readonly maximumMolecularLayerRelativeError: number;
	/** Largest phase reconstruction error against Cornette-Shanks. */ readonly maximumPhaseRelativeError: number;
};
/** Complete physical input qualification, separate from convergence or algorithmic accuracy. */
type HorizonAerosolInputProof = {
	/** Number of independently finalized external cases authenticated. */ readonly cases: number;
	/** Distinct optical grids inspected mathematically. */ readonly grids: readonly HorizonAerosolGridProof[];
	/** Actual production coefficients match the registered target. */ readonly productionPhysicalCoefficientsMatched: boolean;
};
interface Window {
	/** Host-owned progress publication; rejects if the owning run refuses the event. */ __h43Progress: (message: string) => Promise<void>;
	/** Contained browser entry; rejects failed hardware, compilation or lookup checks. */ __h43Evaluate: (control: HorizonProductionControl) => Promise<HorizonProductionResult>;
}


/** Result state in a finalized shared libRadtran execution manifest.
 * - **"succeeded"** - Execution and identity checks passed; physical accuracy remains case-owned.
 * - **"failed"** - Execution or identity checks failed and the output cannot qualify a reference.
 */
type HorizonLibStatus = 'succeeded' | 'failed';

/** One fully specified H42 external-solver case; no field certifies convergence. */
type HorizonLibCase = {
	/** Stable case label used to group matching repetitions. */ readonly id: string;
	/** Away-from-Sun viewing elevation in degrees. */ readonly elevation: number;
	/** Remaining scattering fraction at unchanged total extinction, in (0, 1]. */ readonly epsilon: number;
	/** Equal-molecular-mass layer count before inserting the 5 m observer level. */ readonly layers: number;
	/** Requested photon histories per calculated wavelength. */ readonly photons: number;
	/** Zero-based independent repeat seed selector, shared across interventions. */ readonly repeat: number;
	/** Ordered native15 channel indices represented by the input spectrum. */ readonly channels: readonly number[];
	/** Explicitly disables VROOM; missing in preserved early records means the release default. */ readonly vroomOff?: boolean;
};

/** Authenticated physical parent used by the fixed H42 comparison. */
type HorizonLibParent = {
	/** Retained spherical/parallel source and medium parameters in SI units. */ readonly medium: HorizonReferenceMedium;
	/** Observer Cartesian position in meters from the sphere center. */ readonly origin: readonly number[];
	/** Fixed parent horizontal illuminance used only by the display mapping. */ readonly lux: number;
};

/** Selected immutable file identity from the shared external-tool manifest. */
type HorizonLibArtifact = {
	/** Tool-run-relative artifact path with forward slashes. */ readonly path: string;
	/** Exact retained byte length. */ readonly bytes: number;
	/** SHA-256 of the retained bytes. */ readonly sha256: string;
};

/** Consumed projection of the shared tool's authenticated artifact manifest. */
type HorizonLibManifest = {
	/** Final operational execution disposition, separate from scientific qualification. */ readonly status: HorizonLibStatus;
	/** Exact identities of retained original inputs and generated solver artifacts. */ readonly artifacts: readonly HorizonLibArtifact[];
};

/** Awaited host subprocess observation; failed startup rejects instead of returning this record. */
type HorizonLibLaunch = {
	/** Host exit code, or null if no ordinary exit code was returned. */ readonly code: number | null;
	/** Captured CLI stdout, including its exclusively allocated evidence path. */ readonly stdout: string;
	/** Captured host/worker diagnostic stderr, without the separate solver stream. */ readonly stderr: string;
};

/** Empirical sampling interval across independently seeded solver repetitions. */
type HorizonLibInterval = {
	/** Arithmetic mean of the specified observations. */ readonly mean: number;
	/** Conservative Student two-sided 95% half-width; excludes model/discretization error. */ readonly halfWidth95: number;
};

/** Physical matching checks against authenticated actual solver input files. */
type HorizonLibInputCheck = {
	/** Exact configuration selected for this checked case. */ readonly case: HorizonLibCase;
	/** Identities of its original manifest and inspected case files. */ readonly identities: readonly DialFileIdentity[];
	/** Largest relative discrepancy against the analytic total vertical molecular optical depth. */ readonly maximumRelativeTotalOpticalDepthError: number;
	/** Largest relative per-layer discrepancy against the analytic exponential density integral. */ readonly maximumRelativeLayerOpticalDepthError: number;
};

/** External reference observations in the parent's W m^-2 sr^-1 nm^-1 units. */
type HorizonLibReading = {
	/** Physical and numerical controls for this independently seeded invocation. */ readonly configuration: HorizonLibCase;
	/** Repository-relative immutable raw shared-tool execution directory. */ readonly toolRun: string;
	/** Raw solver radiance converted explicitly from mW to W, in channel order. */ readonly spectrum: readonly number[];
	/** Spectrum divided by epsilon for the first-order control; identical at epsilon one. */ readonly dividedSpectrum: readonly number[];
	/** Bin-integrated physical color, or null when a three-channel pilot cannot support it. */ readonly color: HorizonColorReading | null;
	/** Host duration including staging, identity checks and solver execution. */ readonly elapsedMilliseconds: number;
};

/** Repeated-case means and explicitly empirical sampling uncertainty. */
type HorizonLibSummary = {
	/** Stable grouped configuration label. */ readonly id: string;
	/** Away-from-Sun viewing elevation in degrees. */ readonly elevation: number;
	/** Remaining scattering fraction at unchanged total extinction. */ readonly epsilon: number;
	/** Configured mass-layer count before the observer-level insertion. */ readonly layers: number;
	/** Number of independent deterministic repeat seeds. */ readonly repeats: number;
	/** Mean physical radiance before division by epsilon, in W m^-2 sr^-1 nm^-1. */ readonly meanSpectrum: readonly number[];
	/** Mean radiance divided by epsilon for the mathematical first-order control. */ readonly meanDividedSpectrum: readonly number[];
	/** Physical color projected from meanDividedSpectrum with the independent CIE integral. */ readonly color: HorizonColorReading;
	/** Empirical 95% half-width for physical linear-sRGB red/blue ratio. */ readonly redBlueHalfWidth95: number;
	/** Empirical 95% luminance half-width in cd/m^2. */ readonly luminanceHalfWidth95: number;
	/** Maximum pointwise spectral half-width divided by its mean; not simultaneous coverage. */ readonly maximumSpectralHalfWidth95Relative: number;
	/** Retained zero-aerosol H40 first-order color at the same elevation. */ readonly parentColor: HorizonColorReading;
	/** Largest relative spectral difference from H40 N1; all-order differences are not accuracy errors. */ readonly maximumRelativeToParentN1: number;
};
