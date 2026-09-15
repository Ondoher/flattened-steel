/** One held whole-view angular response predicate, with every threshold term retained. */
type SkySecondOrderAngularShrinkageCheck = Readonly<{
	/** Stable component/channel predicate identity. */ id: string;
	/** Original spectral index. */ channel: number;
	/** Independently assessed separated source or combined value. */ component: SkySecondOrderComponent;
	/** Uncancelled azimuth32-to64 path correction. */ absoluteCorrectionWatts: number | null;
	/** Unscaled earlier coupled radial/azimuth response. */ earlierAbsoluteResponseWatts: number | null;
	/** New/baseline incident comparison allowance. */ correctionIncidentAllowanceWatts: number | null;
	/** Shared-view comparison allowance. */ correctionViewAllowanceWatts: number | null;
	/** Unscaled earlier incident comparison allowance. */ earlierIncidentAllowanceWatts: number | null;
	/** Unscaled earlier shared-view comparison allowance. */ earlierViewAllowanceWatts: number | null;
	/** Fixed response multiplier; this is not a convergence exponent. */ responseFraction: 0.2;
	/** Fixed additive arithmetic/scale floor in the registered predicate. */ floorWatts: 1e-8;
	/** Complete right-hand side of the frozen inequality. */ thresholdWatts: number | null;
	/** Missing/incomplete rows remain unresolved. */ state: SkyVolumeCheckState;
}>;

/** Absolute mapped-placement response on the exact ordinary-fine Gaussian-eight nodes. */
type SkySecondOrderMappedAllowance = Readonly<{
	/** Physical altitude interval or complete path. */ interval: number | 'all';
	/** Original spectral index. */ channel: number;
	/** One separated source or combined value. */ component: SkySecondOrderComponent;
	/** Diagnostic signed integral; never used as an allowance. */ signedDifferenceWatts: number;
	/** Sum of positive weight times transmission times absolute local difference. */ absoluteDifferenceWatts: number;
	/** Positive propagation of both local incident allowances. */ incidentAllowanceWatts: number;
	/** Shared transmission allowance times absolute difference and incident cross term. */ viewAllowanceWatts: number;
	/** Sum of absolute response and its two comparison allowances. */ allowanceWatts: number;
}>;

/** Authenticated completed or partial outer evidence; identity checking belongs to the caller. */
type SkySecondOrderReferenceOuterEvidence = Readonly<{
	/** Original separated viewing integrals, with missing values retained as null. */ integrals: readonly SkySecondOrderIntegral[];
	/** Caller-established complete physical inner admission for the original run. */ admitted: boolean;
}>;

/** Original captured effective second-order source on a matched channel. */
type SkySecondOrderReferenceOriginalH = Readonly<{
	/** Original channel, zero or eight. */ channel: number;
	/** Frozen original effective J2, used only in the registered relative adequacy threshold. */ valueWatts: number;
}>;

/** Pure assessment input; the caller authenticates provenance, exact rules and source compatibility. */
type SkySecondOrderReferenceInput = Readonly<{
	/** Complete exact Gaussian-eight constructor output, in original order. */ nodes: readonly SkySecondOrderViewNode[];
	/** Complete matched original three-rule points; malformed baselines are rejected. */ baselinePoints: readonly SkySecondOrderPoint[];
	/** Caller-established complete physical admission of the Gaussian-eight baseline. */ baselineAdmitted: boolean;
	/** Actual new azimuth64 points; an absent half is represented by absent points. */ angularPoints: readonly SkySecondOrderAzimuthPoint[];
	/** Caller-established physical admission of the complete azimuth64 view. */ angularAdmitted: boolean;
	/** Gaussian-four original view or explicit missing evidence. */ gauss4: SkySecondOrderReferenceOuterEvidence | null;
	/** Simpson-four original view or explicit missing evidence. */ simpson4: SkySecondOrderReferenceOuterEvidence | null;
	/** Simpson-eight original view or explicit missing evidence. */ simpson8: SkySecondOrderReferenceOuterEvidence | null;
	/** Frozen original effective source; an absent channel remains unresolved. */ originalH: readonly SkySecondOrderReferenceOriginalH[];
}>;

/** One of the twelve exhaustive frozen outer predicates on the two original fine placements. */
type SkySecondOrderReferenceOuterCheck = SkySecondOrderOuterCheck &
	Readonly<{
		/** Original spectral index. */ channel: number;
		/** Original fine angular placement. */ rule: 'ordinary-fine' | 'mapped-fine';
	}>;

/** Complete decomposition of the empirical reference allowance; overlapping terms stay explicit. */
type SkySecondOrderReferenceTerms = Readonly<{
	/** Refined local incident allowance through the view. */ refinedIncidentAllowanceWatts: number | null;
	/** Refined view allowance including its incident cross term. */ refinedViewAllowanceWatts: number | null;
	/** Sum of the preceding refined inner terms. */ innerAllowanceWatts: number | null;
	/** Absolute ordinary-fine Gaussian-eight minus Gaussian-four view difference. */ gaussDifferenceWatts:
		number | null;
	/** Complete Gaussian-eight inner allowance. */ gauss8InnerAllowanceWatts: number;
	/** Complete Gaussian-four inner allowance. */ gauss4InnerAllowanceWatts: number | null;
	/** Gaussian difference plus both complete inner allowances. */ gaussOuterAllowanceWatts: number | null;
	/** Absolute ordinary-fine Simpson-eight minus Gaussian-eight view difference. */ simpsonDifferenceWatts:
		number | null;
	/** Complete Simpson-eight inner allowance. */ simpson8InnerAllowanceWatts: number | null;
	/** Simpson difference plus both complete inner allowances. */ simpsonOuterAllowanceWatts: number | null;
	/** Maximum of the two complete outer comparison allowances. */ outerAllowanceWatts: number | null;
	/** Uncancelled azimuth32-to64 path response. */ angularAbsoluteCorrectionWatts: number | null;
	/** Angular incident comparison allowance. */ angularIncidentAllowanceWatts: number | null;
	/** Angular shared-view comparison allowance. */ angularViewAllowanceWatts: number | null;
	/** Sum of the preceding three angular comparison terms. */ angularAllowanceWatts: number | null;
	/** Uncancelled mapped-fine versus ordinary-fine path response. */ mappedAbsoluteDifferenceWatts: number;
	/** Mapped/ordinary incident comparison allowance. */ mappedIncidentAllowanceWatts: number;
	/** Mapped/ordinary shared-view comparison allowance. */ mappedViewAllowanceWatts: number;
	/** Sum of the preceding three placement terms. */ mappedAllowanceWatts: number;
}>;

/** Empirical reference admission on one original spectral channel; no rigorous bound is claimed. */
type SkySecondOrderReferenceChannel = Readonly<{
	/** Original spectral index. */ channel: number;
	/** Complete radial16/azimuth64 Gaussian-eight combined view, if available. */ referenceWatts: number | null;
	/** Sum of refined inner, maximum outer, angular and mapped allowances, null when any term or physical admission is incomplete. */ allowanceWatts:
		number | null;
	/** Original captured effective second-order value, if available. */ originalHWatts: number | null;
	/** Absolute original-minus-reference contrast. */ contrastWatts: number | null;
	/** Frozen absolute adequacy ceiling. */ absoluteThresholdWatts: 5e-5;
	/** Frozen 20% of original-minus-reference contrast. */ relativeThresholdWatts: number | null;
	/** Every required outer configuration has complete authenticated physical admission. */ outerAdmissionsComplete: boolean;
	/** All 32 refined points and the baseline have complete authenticated physical admission. */ angularAdmissionsComplete: boolean;
	/** All twelve frozen outer checks pass, across both channels and placements. */ outerChecksPassed: boolean;
	/** All ten frozen angular checks pass, across both channels and all components. */ angularChecksPassed: boolean;
	/** Separate retained inputs to the empirical allowance. */ terms: SkySecondOrderReferenceTerms;
	/** Exact final empirical adequacy outcome. */ adequate: boolean;
	/** Missing evidence/admission is unresolved; completed violated gates fail. */ state: SkyVolumeCheckState;
}>;

/** Pure final reference assessment; callers retain immutable source and derivation identities. */
type SkySecondOrderReferenceAssessment = Readonly<{
	/** Complete twelve-predicate outer inventory. */ outerChecks: readonly SkySecondOrderReferenceOuterCheck[];
	/** Complete ten-predicate angular inventory. */ angularChecks: readonly SkySecondOrderAngularShrinkageCheck[];
	/** Four intervals plus complete path, two channels and five components. */ placement: readonly SkySecondOrderMappedAllowance[];
	/** Two original channel reference assessments. */ channels: readonly SkySecondOrderReferenceChannel[];
}>;

/** Focused local algebra proof result; never physical evidence or a reference qualification. */
type SkySecondOrderAngularAnalysisProof = Readonly<{
	/** Stable proof identity. */ schemaId: string;
	/** Actual executed assertions. */ checks: number;
}>;
