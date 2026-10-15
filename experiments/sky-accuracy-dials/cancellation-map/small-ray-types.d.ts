/** Retained Monte Carlo radiance estimate in W m^-2 sr^-1 nm^-1. */
type SmallRayEstimate = {
    /** Batch-mean radiance density. */ mean: number;
    /** Approximate marginal 95% sampling interval half-width. */ halfWidth95: number;
};
/** Consumed all-order result; sampling uncertainty excludes systematic error. */
type SmallRayDirectRow = {
    /** Producer ray identity. */ ray: string;
    /** Direct40 channel index. */ channel: number;
    /** All-order estimate. */ total: SmallRayEstimate;
    /** First-order estimate from the same histories. */ first: SmallRayEstimate;
    /** Pure second-order estimate. */ second: SmallRayEstimate;
    /** Orders three and later. */ higher: SmallRayEstimate;
    /** Two independent CPU P1 refinement readings. */ cpu: number[];
    /** Producer's first-order CPU/GPU parity check. */ parity: boolean;
    /** Producer's unchanged sampling-precision outcome. */ samplingResolved: boolean;
    /** Producer's unchanged attenuation-refinement outcome. */ attenuationResolved: boolean;
    /** Producer's unchanged compensated-termination outcome. */ rouletteResolved: boolean;
};
/** Immutable result packet from either retained stochastic calculation. */
type SmallRayDirectPacket = {
    /** Unique ray/channel results. */ rows: SmallRayDirectRow[];
    /** Null only after successful producer execution. */ failure: unknown;
};
/** Retained input ray, with additional alternate-ray comparison metadata. */
type SmallRayInputRay = {
    /** Producer identity. */ id: string;
    /** Original benchmark time. */ time: string;
    /** Source-aligned observer position, km. */ origin: number[];
    /** Source-aligned viewing unit vector. */ direction: number[];
    /** Alternate benchmark column, absent on original five rays. */ x?: number;
    /** Alternate benchmark row, absent on original five rays. */ y?: number;
    /** Retained alternate-ray elevation, degrees. */ elevation?: number;
    /** Retained alternate-ray Sun separation, degrees. */ separation?: number;
    /** Retained alternate baseline and reference radiances by channel slot. */ models?: Record<string, number[]>;
};
/** Frozen physical inputs consumed by a stochastic producer. */
type SmallRayInputs = {
    /** Spherical medium in the producer's km convention. */ medium: SkyDirectMedium;
    /** Original selected rays. */ rays: SmallRayInputRay[];
    /** Direct40 channel indices corresponding to physical arrays. */ channels: number[];
};
/** Matched H8 witness with its higher/reference gap separated by the direct solver. */
type SmallRayJoinedRow = {
    /** Exact registered probe identity. */ probeId: string;
    /** Original benchmark time. */ time: string;
    /** Direct40 channel. */ channel: number;
    /** Point wavelength, nm. */ wavelength: number;
    /** Viewing elevation above the local horizon, degrees. */ elevation: number;
    /** Sun separation, degrees. */ separation: number;
    /** Original six-term P1 error against independent physical P1. */ firstErrorW: number;
    /** H orders two-four minus the direct all-order remainder. */ higherErrorW: number;
    /** Direct total minus retained libRadtran, not certified formulation error. */ solverGapW: number;
    /** H8 baseline total minus retained libRadtran. */ netW: number;
    /** Direct all-order radiance density. */ directW: number;
    /** Direct marginal sampling half-width, shared with opposite signs by higherErrorW and solverGapW. */ halfWidth95W: number;
    /** Unchanged original sampling-precision flag. */ samplingResolved: boolean;
    /** Physical P1 midpoint minus the independent fine CPU estimate. */ p1ReferenceDifferenceW: number;
    /** Original two-method P1 empirical allowance, unchanged. */ p1ReferenceAllowanceW: number;
    /** Six H8 P1 terms followed by higherErrorW and solverGapW. */ termsW: number[];
    /** Retained positive N5/N6 contribution, when its channel is available. */ n6IncrementW: number | null;
    /** Independent pure P2 error, when qualified. */ secondErrorW: number | null;
    /** Remaining orders-three-plus approximation, when P2 is independently known. */ thirdPlusErrorW: number | null;
};
/** Separate Native48 control comparison; never substituted for the H8 baseline. */
type SmallRayAlternateRow = {
    /** Original alternate producer identity. */ ray: string;
    /** Canonical benchmark identity at its frozen geometry. */ probeId: string;
    /** Original benchmark time. */ time: string;
    /** Direct40 channel. */ channel: number;
    /** Viewing elevation, degrees. */ elevation: number;
    /** Observer Sun separation, degrees. */ separation: number;
    /** Native48 control minus direct all-order total. */ approximationW: number;
    /** Direct total minus retained libRadtran. */ solverGapW: number;
    /** Native48 control minus retained libRadtran. */ netW: number;
    /** Direct marginal sampling half-width. */ halfWidth95W: number;
    /** Unchanged producer sampling-precision outcome. */ samplingResolved: boolean;
};
/** Retained flat N1 color contribution, a separate geometry and Native15 basis. */
type SmallRayColor = {
    /** Signed linear RGB in the producer's bin-integrated projection. */ rgb: number[];
};
/** A retained distance stratum of the flat N1 solution. */
type SmallRayStratum = {
    /** Lower path distance, m. */ lowMeters: number;
    /** Upper path distance, m. */ highMeters: number;
    /** Rayleigh color contribution at fixed combined extinction. */ rayleigh: SmallRayColor;
    /** Mie color contribution at fixed combined extinction. */ mie: SmallRayColor;
};
/** Consumed flat horizon attribution; not a paper/libRadtran error decomposition. */
type SmallRayHorizonRow = {
    /** Actual flat viewing elevation, degrees. */ elevationDegrees: number;
    /** Producer input identity including geometry/source and physical controls. */ inputs: unknown;
    /** Retained spectrum and species partition. */ result: SmallRayHorizonSpectrum;
    /** Full signed linear color. */ totalColor: SmallRayColor;
    /** Rayleigh signed linear color. */ rayleighColor: SmallRayColor;
    /** Mie signed linear color. */ mieColor: SmallRayColor;
    /** Additive distance strata in the same projection. */ stratumColors: SmallRayStratum[];
};
/** Fifteen-channel fixed-extinction species partition. */
type SmallRayHorizonSpectrum = {
    /** Total radiance-density spectrum. */ spectrum: number[];
    /** Rayleigh contribution. */ rayleigh: number[];
    /** Mie contribution. */ mie: number[];
};
/** Frozen registration subset required to match original geometry. */
type SmallRayRegistration = {
    /** Selected component rays in metres. */ probeRays: DialContinuationProbeRay[];
};
/** Retained flat reference packet. */
type SmallRayHorizonPacket = {
    /** Three original flat witness rays. */ rows: SmallRayHorizonRow[];
};
/** Original P1 qualification, including its retained empirical allowance. */
type SmallRayPhysicalValue = CancellationPhysicalRow & {
    /** Producer's unchanged empirical numerical allowance, radiance-density W. */ empiricalAllowanceWatts: number;
};
/** Original qualified P1 packet used for numerical compatibility. */
type SmallRayPhysicalPacket = {
    /** Independently cross-checked scalar references. */ rows: SmallRayPhysicalValue[];
};
