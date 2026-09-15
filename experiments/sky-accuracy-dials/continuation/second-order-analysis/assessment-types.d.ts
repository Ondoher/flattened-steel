/** Complete or partial authenticated outer view consumed by the assessment. */
type SkySecondOrderAssessmentView = SkySecondOrderDocument &
	Readonly<{
		/** Exactly retained complete/missing interval values. */ integrals: readonly SkySecondOrderIntegral[];
		/** Refinement stage when this is not the original Gauss4 view. */ stage?: SkySecondOrderRefinementStage;
	}>;

/** Named physical outer configuration, independent of which bounded run completed it. */
type SkySecondOrderAssessmentKind = 'gauss4' | 'simpson4' | 'gauss8' | 'simpson8';

/** Authenticated view with exactly replayed quadrature and unchanged numerical core. */
type SkySecondOrderAssessmentParent = Readonly<{
	/** Exact immutable source directory. */ run: string;
	/** Complete numerical configuration. */ kind: SkySecondOrderAssessmentKind;
	/** Original view document. */ view: SkySecondOrderAssessmentView;
	/** Exact consumed terminal/view/definition identities and source verification. */ source: SkySecondOrderRefinementParent;
	/** All physical terms of the complete rule are available. */ complete: boolean;
}>;

/** Registered outer predicate at one fixed spectral/representation address. */
type SkySecondOrderAddressedOuterCheck = SkySecondOrderOuterCheck &
	Readonly<{
		/** Original spectral index. */ channel: number;
		/** One of the two fine angular placements. */ rule: SkySecondOrderAngularRule;
	}>;

/** Sealed assessment result; accepted evidence may contain failed predictions. */
type SkySecondOrderAssessmentResult = Readonly<{
	/** New immutable assessment directory. */ run: string;
	/** Verified terminal identity. */ seal: DialFileIdentity;
	/** Number of prospective predicates evaluated. */ checks: number;
	/** Resolved passing predicates. */ passed: number;
	/** Resolved failed predicates. */ failed: number;
	/** Missing/unresolved target predicates. */ unresolved: number;
}>;
