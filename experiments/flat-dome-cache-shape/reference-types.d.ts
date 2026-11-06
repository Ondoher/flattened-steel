/** Independent reference geometry.
 * - **"flat"** - Infinite horizontal slab.
 * - **"spherical"** - Concentric spherical shell.
 */
type HorizonReferenceGeometry = 'flat' | 'spherical';
/** Independent illumination.
 * - **"finite"** - A point emitter with inverse-square dilution.
 * - **"parallel"** - A collimated beam with constant unattenuated irradiance.
 */
type HorizonReferenceSource = 'finite' | 'parallel';
/** Frozen physical data only, never a cache or production evaluator. */
type HorizonReferenceMedium = {
	/** Physical geometry. */ readonly geometry: HorizonReferenceGeometry;
	/** Source model. */ readonly sourceKind: HorizonReferenceSource;
	/** Ground radius in meters, ignored by flat geometry. */ readonly radius: number;
	/** Atmosphere top above ground in meters. */ readonly topAltitude: number;
	/** Source position in meters. */ readonly sourcePosition: readonly number[];
	/** Unit direction toward a parallel source. */ readonly sourceDirection: readonly number[];
	/** Point-source irradiance normalization distance in meters. */ readonly referenceDistance: number;
	/** Optional intensity multiplier, one for original source. */ readonly incidentScale: number;
	/** Rayleigh scale height in meters. */ readonly rayleighHeight: number;
	/** Aerosol scale height in meters. */ readonly mieHeight: number;
	/** Aerosol single-scattering albedo. */ readonly albedo: number;
	/** Cornette-Shanks asymmetry parameter. */ readonly g: number;
	/** Sea-level Rayleigh coefficients, inverse meters. */ readonly rayleigh: readonly number[];
	/** Sea-level aerosol extinction, inverse meters. */ readonly mie: readonly number[];
	/** Source irradiance density per nanometer. */ readonly sourceIrradiance: readonly number[];
};
/** Physical ray and spectral channel for one independent estimate. */
type HorizonReferenceGroup = {
	/** Stable identifier. */ readonly id: string;
	/** Frozen material and source packet. */ readonly medium: HorizonReferenceMedium;
	/** Observer position in meters. */ readonly origin: readonly number[];
	/** Unit view direction from observer. */ readonly direction: readonly number[];
	/** Native15 channel index. */ readonly channel: number;
	/** Finite view endpoint; negative selects a point source-density query. It does not constrain subsequent paths. */ readonly end: number;
};
/** Frozen sampling controls; profiles share seeds only for paired numerical qualifications. */
type HorizonReferenceProfile = {
	/** Profile identity. */ readonly name: string;
	/** Number of independent batch means. */ readonly batches: number;
	/** Source and spherical view quadrature count: 64 or 128. */ readonly quadrature: number;
	/** First scattering order at which compensated roulette begins. */ readonly roulette: number;
	/** Disjoint seed-state offset. */ readonly seed: number;
};
/** Standalone browser request, with no application runtime. */
type HorizonReferenceRequest = {
	/** Physical ray/channel groups. */ readonly groups: readonly HorizonReferenceGroup[];
	/** Frozen sampling profiles. */ readonly profiles: readonly HorizonReferenceProfile[];
	/** Path count per batch, a multiple of 256. */ readonly paths: number;
	/** Browser evaluation deadline in milliseconds. */ readonly maximumMilliseconds: number;
};
/** Compact batch output; metric positions are declared in the runner registration. */
type HorizonReferenceBatch = {
	/** Profile identity. */ profile: string;
	/** Group index. */ group: number;
	/** Independent batch index. */ batch: number;
	/** Binary64 means of the retained metric vector. */ means: number[];
	/** Largest realized scattering order. */ maximumDepth: number;
};
/** Browser telemetry, excluding launch and host retention. */
type HorizonReferenceExecution = {
	/** Actual hardware adapter description. */ renderer: string;
	/** Compilation and execution elapsed milliseconds. */ milliseconds: number;
	/** Number of completed batch/group estimates. */ completed: number;
};
/** Sampling-only uncertainty from independent batch means. */
type HorizonReferenceEstimate = {
	/** Arithmetic batch mean. */ mean: number;
	/** Estimated standard error. */ standardError: number;
	/** Conservative marginal 95 percent half-width. */ halfWidth95: number;
	/** Batch count. */ batches: number;
};
/** Typed subset of the retained H16 registration used solely as physical input. */
type HorizonReferenceParent = {
	/** Two authenticated original physical packets. */ readonly inputs: readonly HorizonReferenceMedium[];
};
/** Deterministic binary64 first-order result, for qualification and distance attribution. */
type HorizonReferenceDirect = {
	/** Total first-order radiance. */ total: number;
	/** Unattenuated final segment integral. */ before: number;
	/** Rayleigh and Mie radiance. */ species: number[];
	/** Distance-bin radiance. */ bins: number[];
	/** Distance-bin radiance before final-segment attenuation. */ beforeBins: number[];
};
/** Direction-independent geometric ray exit. */
type HorizonReferenceBoundary = {
	/** Distance in meters; Infinity for an exactly horizontal flat ray. */ distance: number;
	/** Opaque ground is hit first. */ ground: boolean;
};
/** Method-local manufactured-proof outcome. */
type HorizonReferenceProof = {
	/** Number of successful assertions. */ checks: number;
	/** Largest analytic/quadrature relative discrepancy. */ maximumColumnError: number;
	/** Proof descriptions and limitations. */ descriptions: string[];
};
/** Shared reduction of one ray/channel's independent path batches. */
type HorizonReferenceRow = {
	/** Original group index. */ group: number;
	/** Physical query identifier. */ id: string;
	/** Spectral channel index in its declared basis. */ channel: number;
	/** Sampling estimates for the registered vector. */ metrics: HorizonReferenceEstimate[];
	/** Direct estimate of the N5-and-later tail. */ tail: HorizonReferenceEstimate;
	/** Largest realized order across batches. */ maximumDepth: number;
};
/** Retained reference result packet. */
type HorizonReferenceResult = {
	/** Reduced physical estimates. */ rows: HorizonReferenceRow[];
	/** Browser execution facts. */ telemetry: HorizonReferenceExecution;
};
/** Shared original physical inputs and comparison-only observations. */
type HorizonReferenceInputs = {
	/** Exact independent queries. */ readonly groups: readonly HorizonReferenceGroup[];
	/** Original application observations for exact-ray joins. */ readonly observations: readonly HorizonAuditObservation[];
	/** Original receiver definitions, comparison-only. */ readonly incoming: readonly HorizonAuditIncomingRow[];
	/** Refined prior angular-source results, comparison-only. */ readonly qualification: HorizonReferencePriorAngular;
};
/** Spectral color projected directly from original CIE data. */
type HorizonReferenceColor = {
	/** Integrated XYZ tristimulus, cd per square meter for radiance inputs. */ xyz: number[];
	/** Chromaticity x and y, then photopic luminance. */ xyY: number[];
	/** Fixed-exposure encoded sRGB swatch. */ css: string;
};
/** Spectral projection callback with a fixed declared wavelength/bin basis. */
interface HorizonReferenceProjector {
	/** Project the supplied spectral densities into the fixed color convention. */
	(spectrum: readonly number[]): HorizonReferenceColor;
}
/** Minimal authenticated prior H19 qualification used for a comparison join. */
type HorizonReferencePriorAngular = {
	/** Prior continuous-source angular comparisons. */ readonly angular: readonly HorizonReferencePriorAngularRow[];
};
/** One receiver's prior angular integration, retaining its own numerical qualification. */
type HorizonReferencePriorAngularRow = {
	/** Original mode, zero local or one distant. */ readonly mode: number;
	/** Receiver altitude in meters. */ readonly altitude: number;
	/** Original registered wavelength centers. */ readonly wavelengths: readonly number[];
	/** Coarse current angular rule. */ readonly baseline: HorizonAuditAngular;
	/** Refined boundary-split reference rule. */ readonly reference: HorizonAuditAngular;
};
/** Additional fixed-spectrum and manufactured GPU qualification inputs. */
type HorizonReferenceQualificationInputs = {
	/** Original reference run name. */ readonly sourceRun: string;
	/** Fine spectral groups and local P2 receivers. */ readonly groups: readonly HorizonReferenceGroup[];
	/** Two native-bin subdivisions, each using the original constant irradiance within a bin. */ readonly counts: readonly number[];
	/** Actual midpoint wavelengths for each fine basis. */ readonly wavelengths: readonly (readonly number[])[];
	/** Prior receiver packet. */ readonly incoming: readonly HorizonAuditIncomingRow[];
};
/** Qualification run's streaming path records. */
type HorizonReferenceQualificationBatches = {
	/** Exact groups for this profile's indexing. */ readonly groups: readonly HorizonReferenceGroup[];
	/** Completed records. */ readonly rows: readonly HorizonReferenceBatch[];
	/** Per-batch path count. */ readonly paths: number;
};
/** Projected spectrum with marginal sampling intervals. */
type HorizonReferenceColorEstimate = {
	/** Color of the mean spectrum. */ color: HorizonReferenceColor;
	/** Marginal estimates of x, y and luminance across independent batches. */ uncertainty: HorizonReferenceEstimate[];
};
/** Prospective low-cost pilot output used to admit confirmation. */
type HorizonReferencePilot = {
	/** Original group indices, in pilot order. */ readonly indices: readonly number[];
	/** Independently retained low/high quadrature batches. */ readonly batches: readonly HorizonReferenceBatch[];
	/** Reduced high-quadrature estimates. */ readonly rows: readonly HorizonReferenceRow[];
};
