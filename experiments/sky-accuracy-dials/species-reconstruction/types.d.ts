/** Species causing the current scattering event.
 * - **"rayleigh"** - Molecular Rayleigh scattering.
 * - **"mie"** - Aerosol scattering with the fixed CS phase law.
 */
type SpeciesName = 'rayleigh' | 'mie';
/** One sparse second-scattering species source, in spectral W m^-3 sr^-1 nm^-1. */
type SpeciesSource = {
	/** Rayleigh scattering contribution. */ rayleigh: number;
	/** Mie scattering contribution at unchanged total extinction. */ mie: number;
};
/** Frozen incoming first-scattering radiances and local receiver frame. */
type SpeciesIncident = {
	/** Exact physical receiver position in metres. */ point: SkyVector3;
	/** Source-facing tangent, across and radial axes. */ axes: readonly SkyVector3[];
	/** Original F68 local directions transformed to world directions. */ directions: SkyVector3[];
	/** Coupled first-scattering plus direct-ground radiance at each incoming direction. */ radiances: number[];
};
/** Registered off-node reconstruction witness. */
type SpeciesQuery = {
	/** Original Native48 ray identifier. */ ray: string;
	/** Zero-based altitude segment. */ segment: number;
	/** Preregistered one-third or two-thirds position. */ fraction: number;
	/** Distance from the original observer in metres. */ distance: number;
	/** Physical point in metres. */ point: SkyVector3;
	/** Original world viewing direction. */ direction: SkyVector3;
	/** Exact sparse reconstruction support and weights. */ sample: SkyViewSample;
};
/** Native48 parent packet fields consumed by this sparse comparison. */
type SpeciesNativePacket = {
	/** Complete original build request. */ native48: SkyBuildRequest;
	/** Original benchmark source geometry. */ scenes: SkyScene[];
};
/** Authenticated original observer/ray witness packet. */
type SpeciesRayPacket = {
	/** Retained benchmark rays; origins in kilometres in the direct-solver schema. */ rays: SmallRayInputs['rays'];
};
/** Sparse physical and normalized payloads in the shared coordinate order. */
type SpeciesFields = {
	/** Original combined physical source. */ combined: Float32Array;
	/** Separate physical Rayleigh source. */ rayleigh: Float32Array;
	/** Separate physical Mie source. */ mie: Float32Array;
	/** Rayleigh source with its exponential local density removed. */ rayleighCoefficient: Float32Array;
	/** Mie source with its exponential local density removed. */ mieCoefficient: Float32Array;
};
/** Complete per-query comparison, preserving species error and cancellation. */
type SpeciesQueryResult = {
	/** Frozen query identity, position and support. */ query: SpeciesQuery;
	/** Direct binary64 same-rule species source. */ reference: SpeciesSource;
	/** Combined control A; no species attribution is inferred. */ combined: number;
	/** Split physical reconstruction B. */ split: SpeciesSource;
	/** Density-normalized reconstruction C. */ normalized: SpeciesSource;
	/** Original combined minus reference total. */ combinedError: number;
	/** Split species minus their direct references. */ splitError: SpeciesSource;
	/** Normalized species minus their direct references. */ normalizedError: SpeciesSource;
	/** Relative errors with the frozen near-zero floor. */ splitRelativeError: SpeciesSource;
	/** Relative errors with the same floor. */ normalizedRelativeError: SpeciesSource;
	/** Exact split Rayleigh/Mie squared-error cross term. */ splitCrossTerm: number;
	/** Exact normalized Rayleigh/Mie squared-error cross term. */ normalizedCrossTerm: number;
};
/** Scientific direction of a resolved component-error comparison.
 * - **"improves"** - The error reduction exceeds its frozen comparison screen.
 * - **"worsens"** - The error increase exceeds that screen.
 * - **"unresolved"** - The change does not clear that screen.
 */
type SpeciesErrorDirection = 'improves' | 'worsens' | 'unresolved';
/** Ray/species stratum scored on all six frozen off-node queries. */
type SpeciesStratum = {
	/** Original ray identifier. */ ray: string;
	/** Last scattering species. */ species: SpeciesName;
	/** Split physical-source RMS error. */ splitRms: number;
	/** Density-normalized RMS error. */ normalizedRms: number;
	/** Frozen engineering comparison screen, not physical solver uncertainty. */ allowance: number;
	/** Resolved error direction. */ direction: SpeciesErrorDirection;
	/** Number of individual regressions beyond the same screen. */ localRegressions: number;
};
/** Independent arithmetic and physical-node parity measurements before off-node scoring. */
type SpeciesNodeChecks = {
	/** Largest arithmetic discrepancy before Float32 storage. */ arithmetic: SpeciesSource;
	/** Largest physical storage or normalized restoration discrepancy. */ storage: SpeciesSource;
	/** Largest absolute physical source by species. */ scale: SpeciesSource;
	/** Largest combined-node error. */ combined: number;
};
