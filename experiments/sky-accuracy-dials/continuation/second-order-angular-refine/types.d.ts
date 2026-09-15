/** Bounded halves of the complete original Gaussian-eight viewing rule. */
type SkySecondOrderAngularStage = 'low' | 'high';

/** Explicit new angular placement, separate from every original rule identity. */
type SkySecondOrderAzimuthPolicy = Readonly<{
	/** Radial Gaussian count in each geometric incident interval. */ radialCount: number;
	/** Full-circle midpoint azimuth count. */ azimuthCount: number;
	/** Actual source-plane representatives evaluated per point. */ representativeCount: number;
	/** Unchanged physical incident profile. */ physicalProfile: SkyPhysicalReferenceProfile;
	/** Unchanged physical outer error allocation. */ outerStrategy: SkyPhysicalOuterStrategy;
}>;

/** Exact immutable source of reused geometry and original view attenuation. */
type SkySecondOrderAngularParentPointer = Readonly<{
	/** Complete original Gaussian-eight view run. */ run: string;
	/** Authenticated original view artifact. */ artifact: DialFileIdentity;
	/** Exact original physical point identity. */ nodeId: string;
	/** Digest of the original complete physical/control key. */ physicalKeySha256: string;
}>;

/** New azimuth-64 result with unchanged original angular evidence retained separately. */
type SkySecondOrderAzimuthPoint = Readonly<{
	/** Present only for actually attempted alternate-coordinate work. */ incidentCoordinate?: SkySecondOrderIncidentUse;
	/** Exact original Gaussian-eight physical node and outer weight. */ node: SkySecondOrderViewNode;
	/** Admitted original observer-to-point attenuation, copied unchanged. */ transmission: SkySecondOrderTransmission;
	/** Original coarse, fine and mapped angular results; never relabeled as azimuth 64. */ baselineAngular: readonly SkySecondOrderAngularResult[];
	/** Independently evaluated radial16/azimuth64 separated components. */ refinedRows: readonly SkyVolumeJ2Row[];
	/** Every newly evaluated branch agrees with its declared geometry. */ refinedGeometryPassed: boolean;
	/** Every new incident component passes unchanged admission. */ refinedIncidentsPassed: boolean;
	/** Actual new incident representative count. */ incidentCount: number;
	/** Exact immutable origin of original geometry/transmission and comparison rows. */ baselineParent: SkySecondOrderAngularParentPointer;
	/** Whole new-point wall time, including queued work. */ elapsedMilliseconds: number;
	/** Sum of actual worker durations, excluding inherited work. */ workerMilliseconds: number;
	/** Actual new incident density-pair evaluations. */ mediumEvaluations: number;
	/** Actual new incident outer-integrand evaluations. */ outerEvaluations: number;
}>;

/** Matched positive-weight path integrals and explicit uncertainty terms, in spectral radiance watts. */
type SkySecondOrderAzimuthIntegral = Readonly<{
	/** Physical interval or complete original view. */ interval: number | 'all';
	/** Original spectral index. */ channel: number;
	/** One of the four source components or their independently accumulated combined value. */ component: SkySecondOrderComponent;
	/** Original ordinary-fine estimate on this same outer rule. */ baselineWatts: number;
	/** Original incident uncertainty propagated through the path. */ baselineIncidentAllowanceWatts: number;
	/** Original view-transmission uncertainty and cross term. */ baselineViewAllowanceWatts: number;
	/** New azimuth-64 integral, null when any required point is missing. */ refinedWatts: number | null;
	/** New incident uncertainty propagated through the path. */ refinedIncidentAllowanceWatts: number | null;
	/** Original transmission uncertainty applied to the new source and cross term. */ refinedViewAllowanceWatts:
		number | null;
	/** Integral of new minus original fine source; preserves sign. */ signedCorrectionWatts: number | null;
	/** Positive path integral of absolute new-minus-fine source differences. */ absoluteCorrectionWatts: number | null;
	/** Sum of new and baseline incident uncertainties in the absolute correction. */ correctionIncidentAllowanceWatts:
		number | null;
	/** Shared view uncertainty applied to the absolute correction, including cross terms. */ correctionViewAllowanceWatts:
		number | null;
	/** Positive path integral of the original coupled ordinary-coarse-to-fine response. */ earlierAbsoluteResponseWatts: number;
	/** Original coarse/fine incident uncertainties in the earlier response. */ earlierIncidentAllowanceWatts: number;
	/** Shared view uncertainty and cross terms in the earlier response. */ earlierViewAllowanceWatts: number;
	/** Every required new azimuth-64 point is available and admitted. */ complete: boolean;
}>;

/** Full target rule plus actual azimuth-64 points; independent of the older view schema. */
type SkySecondOrderAngularDocument = Readonly<{
	/** Must be sky-second-order-angular-view-v1. */ schemaId: string;
	/** Exact original C0 owner. */ continuationRegistration: string;
	/** Bounded half completed by this run. */ stage: SkySecondOrderAngularStage;
	/** Original complete ordinary-fine Gaussian-eight view run. */ baselineViewRun: string;
	/** Exact complete baseline view artifact. */ baselineViewArtifact: DialFileIdentity;
	/** Complete 32-node outer rule, even for a low-only run. */ nodes: readonly SkySecondOrderViewNode[];
	/** Exact original spectral order. */ channels: readonly number[];
	/** Explicit new radial16/azimuth64 placement. */ angularPolicy: SkySecondOrderAzimuthPolicy;
	/** Original three angular placements and physical controls. */ baselinePolicy: SkySecondOrderReusePolicy;
	/** New or explicitly reused low-stage refined points. */ points: readonly SkySecondOrderAzimuthPoint[];
	/** Refined and original matched component integrals and uncancelled corrections. */ integrals: readonly SkySecondOrderAzimuthIntegral[];
	/** All original angular-rule integrals on the same fixed nodes. */ baselineIntegrals: readonly SkySecondOrderIntegral[];
	/** Physical admission predicates only. */ checks: readonly SkySecondOrderCheck[];
	/** Every selected point completed; this can be true for a partial view. */ matrixComplete: boolean;
	/** All 32 refined points exist. */ fullViewComplete: boolean;
	/** Physical inner admission and selected-batch completion only. */ predictionsPassed: boolean;
}>;

/** Minimal original azimuth refinement definition for exact low-to-high reuse. */
type SkySecondOrderAngularDefinition = Readonly<{
	/** Original operation/control record, left immutable. */ recipe: Readonly<{
		/** Controls and implementations that must exactly match. */ parameters: Readonly<{
			/** Exact original owner. */ continuationRegistration: string;
			/** Original selected half. */ stage: SkySecondOrderAngularStage;
			/** Original complete baseline identity. */ baselineViewRun: string;
			/** Exact original baseline artifact. */ baselineViewArtifact: DialFileIdentity;
			/** Original incident numerical core. */ numericalSources: readonly DialFileIdentity[];
			/** This new azimuth executor/integrator implementation. */ angularExecutionSources: readonly DialFileIdentity[];
			/** Explicit radial16/azimuth64 placement. */ angularPolicy: SkySecondOrderAzimuthPolicy;
		}>;
	}>;
}>;

/** Local manufactured summation and rejection proof, not a physical reference. */
type SkySecondOrderAngularRefinementProof = Readonly<{
	/** Versioned focused proof identity. */ schemaId: string;
	/** Actual executed assertions. */ checks: number;
}>;
