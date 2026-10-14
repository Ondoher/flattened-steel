/** Independent P1 packet, read without reopening the producer. */
type CancellationPhysicalPacket = {
    /** Qualified two-method ray/channel references. */ rows: CancellationPhysicalRow[];
};
/** Independent first-order estimates in radiance-density units. */
type CancellationPhysicalRow = {
    /** Canonical ray identity. */ probeId: string;
    /** Direct40 spectral index. */ channel: number;
    /** Distance-based Gaussian estimate. */ gaussWatts: number;
    /** Transformed-altitude Simpson estimate. */ simpsonWatts: number;
    /** Producer's unchanged qualification outcome. */ resolved: boolean;
};
/** A retained cumulative order reading with its diagnostic allowance. */
type CancellationOrderValue = {
    /** Canonical ray identity. */ probeId: string;
    /** Producer integration method identity. */ methodId: string;
    /** Producer field-reconstruction identity. */ representationId: string;
    /** Cumulative scattering order. */ order: number;
    /** Radiance density, W m^-2 sr^-1 nm^-1. */ value: number;
    /** Producer's empirical allowance in the same units. */ errorAllowance: number;
};
/** Retained matched N6 diagnostic boundary. */
type CancellationOrderPacket = {
    /** Explicit spectral radiance units. */ units: string;
    /** Producer cumulative order readings. */ rows: CancellationOrderValue[];
};
/** Independent second-order result admitted by its unchanged producer checks. */
type CancellationP2Value = {
    /** Direct40 channel. */ channel: number;
    /** Independent pure-second-order radiance density. */ referenceWatts: number;
    /** Producer empirical allowance. */ allowanceWatts: number;
    /** Matched original H pure-second-order radiance. */ originalHWatts: number;
    /** Producer qualification outcome. */ adequate: boolean;
};
/** Independent P2 packet at one spatial witness. */
type CancellationP2Packet = {
    /** The qualified wavelength readings. */ channels: CancellationP2Value[];
};

/** One paper-atmosphere scalar with a pointwise, ordered error decomposition. */
type CancellationMapRow = {
    /** Canonical retained ray identity. */ probeId: string;
    /** Local benchmark time. */ time: string;
    /** Direct40 spectral index. */ channel: number;
    /** Point-sample wavelength, nm. */ wavelength: number;
    /** Original benchmark-grid horizontal coordinate. */ gridX: number;
    /** Original benchmark-grid vertical coordinate. */ gridY: number;
    /** Elevation above the local horizon, degrees. */ elevation: number;
    /** Observer Sun separation, degrees. */ separation: number;
    /** Reference radiance density, W m^-2 sr^-1 nm^-1. */ targetW: number;
    /** Baseline total radiance density. */ baselineW: number;
    /** Independent P1 radiance density. */ physicalP1W: number;
    /** Fixed original orders two through four. */ higherW: number;
    /** Terms in the registered label order, each in radiance-density units. */ termsW: number[];
    /** Sum of the signed terms, baseline minus retained libRadtran. */ netW: number;
    /** Uncertainty diagnostic from the source candidate, not a rigorous bound. */ diagnosticGuardW: number;
    /** Pointwise amplitude cancellation: one minus absolute net divided by gross amplitude. */ cancellation: number;
};

/** Aggregate component interactions at exactly aligned scalar locations. */
type CancellationMapSummary = {
    /** Number of scalar samples. */ count: number;
    /** Component RMS values in spectral mW units. */ rmsMw: number[];
    /** Sum of twice the pairwise products, spectral mW squared. */ crossMw2: number[][];
    /** Normalized dot products across aligned samples, or zero for zero vectors. */ cosine: number[][];
    /** Baseline residual RMS against retained libRadtran, spectral mW. */ totalRmseMw: number;
    /** Error-vector self energies summed before pairwise cross terms. */ selfSseMw2: number;
    /** Sum over distinct component-pair cross terms. */ crossSseMw2: number;
    /** Baseline total squared residual. */ totalSseMw2: number;
};

/** A qualified P2 witness permits a partial decomposition between scattering orders. */
type CancellationOrderWitness = {
    /** Canonical ray identity. */ probeId: string;
    /** Benchmark time. */ time: string;
    /** Spectral channel. */ channel: number;
    /** Wavelength, nm. */ wavelength: number;
    /** Independently measured P1 discrepancy. */ firstErrorW: number;
    /** Independently measured pure P2 discrepancy. */ secondErrorW: number;
    /** Original later orders minus the remaining libRadtran contribution; not isolated tail error. */ remainderW: number;
    /** Pointwise baseline total minus libRadtran. */ netW: number;
    /** Independent P2 empirical allowance. */ secondAllowanceW: number;
};

/** Matched prefix evidence measures the effect of extending the retained order sum. */
type CancellationOrderExtension = {
    /** Canonical ray identity. */ probeId: string;
    /** Benchmark time. */ time: string;
    /** Spectral channel. */ channel: number;
    /** Original baseline through order four minus retained libRadtran. */ residual4W: number;
    /** Same baseline with retained orders five and six added. */ residual6W: number;
    /** Additional radiance from orders five and six, not an error estimate. */ incrementW: number;
};

/** Complete compact payload for the offline map and standard plotting tool. */
type CancellationMapData = {
    /** Declared ordered contribution names. */ labels: string[];
    /** Pointwise component decomposition. */ rows: CancellationMapRow[];
    /** All-sample interaction accounting. */ summary: CancellationMapSummary;
    /** Independent later-scattering coverage, deliberately sparse. */ orderWitnesses: CancellationOrderWitness[];
    /** Measured retained order extension. */ extensions: CancellationOrderExtension[];
    /** Authenticated source identities and seals. */ parents: DialFileIdentity[];
};
