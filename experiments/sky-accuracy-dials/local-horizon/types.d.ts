/** Browser-safe Gauss rule with unit-interval measure. */
type LocalHorizonRule = {
	/** Ordered quadrature locations in [0,1]. */ nodes: number[];
	/** Positive weights summing to one. */ weights: number[];
};
/** Registered physical packet and unchanged current application measurements. */
type LocalHorizonRegistration = {
	/** Independent solver inputs, meters and spectral radiance/irradiance densities per nm. */ medium: HorizonReferenceMedium;
	/** Exact original shader, state and default-view samples. */ observation: HorizonObservation;
	/** Center rays in three named physical azimuths. */ readings: LocalHorizonHeading[];
	/** Actual runtime scattering order, not inferred from a URL. */ order: number;
	/** Selected production cache implementation. */ cachePolicy?: string;
	/** Serialized source configuration, provenance only. */ configuration: unknown;
	/** Actual canvas PNG data URL; omitted after separate image retention. */ baseline?: string;
};
/** Exact six-elevation samples at one physical azimuth. */
type LocalHorizonHeading = {
	/** Toward, cross or away relative to the source horizontal projection. */ heading: string;
	/** Registered rays with direction, endpoint and spectral readback. */ rays: HorizonRayObservation[];
};
/** Actual independent-transport image and its probe qualification. */
type LocalHorizonImageResult = {
	/** PNG canvas image data URL. */ image: string;
	/** Derived shader and spectra from the same renderer/uniforms. */ observation: HorizonObservation;
};
/** Narrow mutable pass capability used only by the reversible reference substitution. */
type LocalHorizonPass = {
	/** Owned material is borrowed and restored before returning. */ material?: HorizonShaderMaterial & {
		/** Mark the changed source for recompilation. */ needsUpdate: boolean;
	};
};
/** Experiment-only page API; no production global contract is changed. */
interface LocalHorizonApi {
	/** Freeze current physical inputs and unchanged runtime observations; rejects missing shader/owners. */ observe(): LocalHorizonRegistration;
	/** Render independent N1 with common display; restores original material even on failure. */ compare(medium: HorizonReferenceMedium, nodes: number): LocalHorizonImageResult;
}
/** Additional experiment ingress, installed only by the contained probe bundle. */
interface Window {
	/** Local horizon measurements and reversible reference image operation. */ __localHorizon: LocalHorizonApi;
}
/** Additive N1 explanation at one wavelength, retaining both attenuation legs. */
type LocalHorizonAttribution = {
	/** Total spectral radiance density W m^-2 sr^-1 nm^-1. */ total: number;
	/** Rayleigh and Mie contributions, same radiance units. */ species: number[];
	/** Last-scatter distance contributions in 0–10, 10–50, 50–100, 100–300, 300–1000, >1000 km. */ bins: number[];
	/** Radiance-weighted view distance (m), altitude (m), in-medium source leg (m), source optical depth and view optical depth. */ moments: number[];
	/** Both attenuations, source only, view only and neither; counterfactual N1 integrals at fixed source/extinction coefficients. */ factorial: number[];
};
/** One current independently integrated ray, with all original spectra retained. */
type LocalHorizonRayRow = {
	/** Physical azimuth label relative to the source. */ heading: string;
	/** Elevation in degrees. */ elevation: number;
	/** Unit direction in flat model coordinates. */ direction: number[];
	/** Camera-ray endpoint in meters, distinct from medium boundaries. */ end: number;
	/** Current cache radiance density, W m^-2 sr^-1 nm^-1. */ app: number[];
	/** Independent matched-domain N1 in the same units. */ reference: number[];
	/** Independent extended-domain N1 in the same units. */ infinite: number[];
	/** Current physical color and luminance. */ appColor: HorizonColorReading;
	/** Matched-domain independent physical color. */ referenceColor: HorizonColorReading;
	/** Extended-domain independent physical color. */ infiniteColor: HorizonColorReading;
	/** Maximum relative 64/128 refinement difference with registered signal floor. */ refinement: number;
};
/** Retained host controls and independent current-ray calculations. */
type LocalHorizonRayPacket = {
	/** Manufactured transport and color control outcomes. */ control: unknown;
	/** Registered current rays and independent spectra. */ rows: LocalHorizonRayRow[];
};
/** Independent shader readback on the same current camera and display bindings. */
type LocalHorizonGpuObservation = {
	/** Read-only app/camera/renderer state at image time. */ facts: Record<string,unknown>;
	/** Ray directions, domain endpoints and stage readbacks. */ rays: HorizonRayObservation[];
};
/** Narrow immutable parent seal used for exact display-dependency compatibility. */
type LocalHorizonParentSeal = {
	/** Original derivation inputs and operation. */ readonly recipe: DialDerivation;
};
/** Original failed capture seal, inspected without altering its status. */
type LocalHorizonRecoverySeal = LocalHorizonParentSeal & {
	/** Original terminal disposition. */ state: string;
	/** Original asynchronous heartbeat error, null for the selected parent. */ heartbeatFailure: string|null;
	/** Original complete experiment-source snapshot. */ sources: DialFileIdentity[];
	/** Exact integrity failures recorded by the original finalizer. */ sourceFailures: LocalHorizonSourceFailure[];
	/** Closed hashed evidence artifacts. */ artifacts: DialFileIdentity[];
};
/** Exact unchanged provenance failure entry from a parent run. */
type LocalHorizonSourceFailure = {
	/** Repository-relative changed source path. */ path: string;
	/** Preserved original hash-failure text. */ message: string;
};
/** Narrow numerical controls consumed by recovery qualification. */
type LocalHorizonRecoveryEvaluation = {
	/** Completed independently refined physical rays. */ rows: LocalHorizonRayRow[];
	/** Independent GPU/CPU checks from the actual image shader. */ parity: LocalHorizonParity[];
};
/** Actual independent-image/CPU comparison at a registered elevation. */
type LocalHorizonParity = {
	/** Elevation in degrees. */ elevation: number;
	/** Largest relative spectral residual across all visible bins. */ maximumRelative: number;
};
/** Existing accepted artifact qualification required before deriving from a failed capture. */
type LocalHorizonQualification = {
	/** Exact qualified capture run path. */ source: string;
	/** Preserved original capture disposition. */ parentState: string;
};
/** Frozen report subset needed by physical plots, without any transport evaluator. */
type LocalHorizonPresentation = {
	/** Current and independently computed N1 rays. */ readonly rows: readonly LocalHorizonRayRow[];
	/** Independent all-order estimates at selected away elevations. */ readonly allOrders: readonly LocalHorizonOrderPlot[];
};
/** One elevation's independently sampled order/color summaries. */
type LocalHorizonOrderPlot = {
	/** Elevation above horizontal in degrees. */ elevation: number;
	/** All-order total first, then pure orders and tail. */ orders: LocalHorizonOrderColor[];
};
/** Marginal sampling summaries used to plot physical quantities. */
type LocalHorizonOrderColor = {
	/** Photopic luminance, cd per square meter. */ Y: HorizonReferenceEstimate;
	/** CIE x coordinate, dimensionless. */ x: HorizonReferenceEstimate;
	/** CIE y coordinate, dimensionless. */ y: HorizonReferenceEstimate;
};
