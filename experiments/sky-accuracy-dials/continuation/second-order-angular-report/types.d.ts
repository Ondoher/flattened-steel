/** Authenticated complete azimuth64 evidence and its exact derivation inputs. */
type SkySecondOrderAngularRead = Readonly<{
	/** Immutable high-stage identity. */ run: string;
	/** Original angular view, not relabelled as the old view schema. */ view: SkySecondOrderAngularDocument;
	/** Terminal, definition, view and registered plan identities. */ identities: readonly DialFileIdentity[];
}>;

/** Explicit original outer target addresses required by the final component assessment. */
type SkySecondOrderReportParents = Readonly<{
	/** Original complete Gaussian4 view. */ gauss4: string;
	/** Registered independent coarse Simpson view. */ simpson4: string;
	/** Complete registered Gaussian8 high-stage view. */ gauss8: string;
	/** Complete independent refined Simpson view. */ simpson8: string;
	/** Complete new azimuth64 high-stage view. */ angular: string;
}>;

/** Verified assessment artifact identity and scientific admission, separate from implementation review. */
type SkySecondOrderAngularReportResult = Readonly<{
	/** Newly allocated immutable assessment. */ run: string;
	/** Verified terminal identity. */ seal: DialFileIdentity;
	/** Both selected spectral references pass every declared gate. */ referenceAdequate: boolean;
	/** Number of passed frozen 80% dial predicates. */ dialPredictionsPassed: number;
}>;
