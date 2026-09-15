/** One frozen outward viewing-ray location above the original surface observer. */
type SkyVolumeJ2Target = Readonly<{
	/** Unique probe/height address. */ id: string;
	/** Original C0 probe identity. */ probeId: string;
	/** Requested radial altitude in metres. */ heightMeters: number;
	/** Distance along the original frozen ray in metres. */ distanceMeters: number;
	/** Original surface point, for the independent boundary limit. */ surfaceOrigin: SkyVector3;
	/** Derived positive-height point in metres. */ origin: SkyVector3;
	/** Original world viewing direction, unchanged. */ direction: SkyVector3;
}>;
/** A solid-angle reflection group in one explicitly split radial interval. */
type SkyVolumeJ2Group = Readonly<{
	/** Geometric incident branch, used to verify the independent ray classifier. */ branch: SkyVolumeBranch;
	/** Local representative, mirror and per-member solid angle. */ incident: SkyJ2Incident;
}>;
/** Retained compact incident evidence; no sampled cache field is stored. */
type SkyVolumeJ2Node = Readonly<{
	/** Parent volume target. */ targetId: string;
	/** Product-rule representative index. */ index: number;
	/** Representative index for an independently computed mirror, otherwise null. */ mirrorOf: number | null;
	/** Exact physical incident direction. */ direction: SkyVector3;
	/** Full separated component estimates and empirical allowances. */ channels: readonly SkyVolumeChannel[];
	/** Actual ray branch. */ branch: SkyVolumeBranch;
	/** Actual evaluation duration. */ elapsedMilliseconds: number;
	/** Actual medium evaluations across methods. */ mediumEvaluations: number;
	/** Actual outer evaluations across methods. */ outerEvaluations: number;
}>;
/** Accumulated component with explicit unresolved state. */
type SkyVolumeJ2Sum = {
	/** Sum using distance-Gauss incident values. */ gauss: number;
	/** Sum using altitude-Simpson incident values. */ simpson: number;
	/** Positive-weight propagated incident allowance only. */ allowance: number;
	/** All material incident contributions are admitted. */ resolved: boolean;
};
/** Complete local component estimate; angular error is not included in its allowance. */
type SkyVolumeJ2Estimate = Readonly<{
	/** Gauss incident sum, null when unresolved. */ gauss: number | null;
	/** Simpson incident sum, null when unresolved. */ simpson: number | null;
	/** Mean of the independent incident formulations, null when unresolved. */ mean: number | null;
	/** Propagated incident allowance, excluding unresolved angular quadrature error. */ incidentAllowance:
		number | null;
	/** All incident contributions admitted; this does not qualify angular accuracy. */ resolved: boolean;
}>;
/** Four physical contributions and a separately accumulated combined value. */
type SkyVolumeJ2Row = Readonly<{
	/** Direct40 index. */ channel: number;
	/** Atmospheric L1 followed by Rayleigh scattering. */ atmosphereRayleigh: SkyVolumeJ2Estimate;
	/** Atmospheric L1 followed by Mie scattering. */ atmosphereMie: SkyVolumeJ2Estimate;
	/** Direct ground light followed by Rayleigh scattering. */ groundRayleigh: SkyVolumeJ2Estimate;
	/** Direct ground light followed by Mie scattering. */ groundMie: SkyVolumeJ2Estimate;
	/** Independently accumulated total-L1 times combined phase. */ combined: SkyVolumeJ2Estimate;
	/** Difference between four-component and combined mean sums. */ sumDifference: number | null;
	/** Operand-scaled binary64 arithmetic allowance. */ arithmeticAllowance: number;
	/** Whether the component sum identity is numerically admitted. */ sumIdentityPassed: boolean;
}>;
/** Pilot predicate, preserving missing and failed outcomes. */
type SkyVolumeJ2Check = Readonly<{
	/** Unique scientific predicate identity. */ id: string;
	/** Optional Direct40 channel. */ channel: number | null;
	/** Passed, failed, or unresolved due to unavailable numerical evidence. */ state: SkyVolumeCheckState;
	/** Observed absolute discrepancy in the stated quantity. */ difference: number | null;
	/** Registered comparison allowance in the same quantity. */ allowance: number | null;
}>;
/** In-memory manufactured angular and missing-evidence proof result. */
type SkyVolumeJ2Proof = Readonly<{
	/** Versioned proof identity. */ schemaId: string;
	/** Count of executed assertions. */ checks: number;
	/** Largest error against analytic Rayleigh angular mass. */ maximumPhaseMassError: number;
}>;
/** Sealed pilot execution status, separate from scientific admission. */
type SkyVolumeJ2RunResult = Readonly<{
	/** Immutable new output directory. */ run: string;
	/** Exact terminal artifact identity. */ seal: DialFileIdentity;
	/** All planned incident records are retained. */ matrixComplete: boolean;
	/** Every preregistered predicate passed. */ predictionsPassed: boolean;
	/** Explicit resource interruption, otherwise null. */ stopReason: string | null;
}>;
/** Explicit scientific stages.
 * - **"pilot"** - Initial eight-position boundary and component pilot.
 * - **"angular"** - Three held cells completing the radial/azimuth factorial.
 */
type SkyVolumeJ2Stage = 'pilot' | 'angular';
/** One physical point paired with its declared angular counts. */
type SkyVolumeJ2Case = Readonly<{
	/** Explicit control name. */ id: string;
	/** Frozen or derived physical location. */ target: SkyVolumeJ2Target;
	/** Nodes per radial interval. */ radialCount: number;
	/** Full-circle midpoint azimuth samples. */ azimuthCount: number;
}>;
/** Minimal authenticated pilot fields consumed by the subsequent factorial. */
type SkyVolumeJ2Document = Readonly<{
	/** Exact component-pilot schema. */ schemaId: string;
	/** Original C0 owner. */ continuationRegistration: string;
	/** Exact incident spectral indices. */ channels: readonly number[];
	/** Frozen targets in row order. */ targets: readonly SkyVolumeJ2Target[];
	/** Complete component sums in target order. */ rows: readonly SkyVolumeJ2Row[][];
	/** Every planned evaluation completed. */ matrixComplete: boolean;
	/** Original pilot predicates passed. */ predictionsPassed: boolean;
}>;
/** Authenticated baseline and exact-ground angular reference for prospective comparison. */
type SkyVolumeJ2Parents = Readonly<{
	/** Every consumed terminal and artifact identity. */ identities: readonly DialFileIdentity[];
	/** Baseline physical component pilot. */ baseline: SkyVolumeJ2Document;
	/** Fine outward exact-ground comparisons. */ angular: SkyAngularDocument;
}>;
/** One scalar response under a complete radial/azimuth factorial. */
type SkyVolumeJ2Interaction = Readonly<{
	/** Baseline target address. */ targetId: string;
	/** Direct40 channel. */ channel: number;
	/** Radial-only minus baseline. */ radial: number;
	/** Azimuth-only minus baseline. */ azimuth: number;
	/** Joint minus baseline. */ joint: number;
	/** Joint minus both single changes. */ interaction: number;
	/** Sum of all four propagated incident allowances. */ incidentAllowance: number;
}>;
/** Declared aggregate response prediction and its per-scalar vectors. */
type SkyVolumeJ2Factorial = Readonly<{
	/** Physical component name. */ component: string;
	/** Complete per-scalar signed changes, otherwise empty. */ vectors: readonly SkyVolumeJ2Interaction[];
	/** Norm of the two separate response vectors, added. */ responseScale: number | null;
	/** Norm of the interaction vector. */ interactionNorm: number | null;
	/** Norm of summed incident allowances. */ allowanceNorm: number | null;
	/** Registered additive comparison threshold. */ threshold: number | null;
	/** Passed, failed or numerically unresolved. */ state: SkyVolumeCheckState;
}>;
/** Complete factorial and near-surface prediction assessment. */
type SkyVolumeJ2FactorialResult = Readonly<{
	/** Component interaction vectors and norm gates. */ factorials: readonly SkyVolumeJ2Factorial[];
	/** Additive and approximate-limit scientific predicates. */ checks: readonly SkyVolumeJ2Check[];
}>;
/** In-memory positive, negative and missing-evidence checks of the response law. */
type SkyVolumeJ2FactorialProof = Readonly<{
	/** Distinct manufactured proof identity. */ schemaId: string;
	/** Actual aggregate and gate assertions. */ checks: number;
}>;
