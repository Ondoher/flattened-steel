/** Authenticated original effective orders, retaining the immutable derivation chain. */
type SkySecondOrderOriginalRead = Readonly<{
	/** Exact original terminal and row artifact identities. */ identities: readonly DialFileIdentity[];
	/** Complete original 160-scalar attribution inventory. */ rows: readonly SkyOrderAttributionRow[];
}>;

/** Frozen-increment algebra result, independent of any reference-quality assertion. */
type SkySecondOrderReplacement = Readonly<{
	/** New second-order estimate minus original effective J2, in spectral radiance watts. */ deltaWatts: number;
	/** Original residual with physical first order substituted, in spectral radiance watts. */ beforeResidualWatts: number;
	/** Residual after also substituting the supplied P2 estimate. */ afterResidualWatts: number;
	/** Original effective J2 minus the supplied P2 estimate. */ cachedMinusPhysicalWatts: number;
	/** New residual squared minus old residual squared. */ squaredScoreChange: number;
	/** Twice replacement times original residual. */ linearScoreTerm: number;
	/** Replacement squared, always nonnegative. */ quadraticScoreTerm: number;
	/** Twice second-order numerical difference times the new remaining residual. */ compensationCrossTerm: number;
	/** Radiance replacement identity residual, in spectral radiance watts. */ linearIdentityResidualWatts: number;
	/** Largest squared-radiance identity residual, in squared spectral radiance watts. */ maximumSquaredIdentityResidual: number;
}>;

/** Complete-view diagnostic at one original probe, channel and angular placement. */
type SkySecondOrderDiagnostic = Readonly<{
	/** Frozen original sample address. */ probeId: string;
	/** Original measurement time. */ time: string;
	/** Original spectral index. */ channel: number;
	/** Fixed angular placement of the supplied complete outer integral. */ rule: SkySecondOrderAngularRule;
	/** Supplied physical second-order estimate, in spectral radiance watts. */ secondOrderWatts: number;
	/** Incident uncertainty propagated through the complete view only. */ incidentAllowanceWatts: number;
	/** Final-view optical-column uncertainty only. */ viewAllowanceWatts: number;
	/** Original grouped N2-N1 effective contribution. */ originalSecondOrderWatts: number;
	/** Original grouped N2-N1 numerical integration allowance. */ originalAllowanceWatts: number | null;
	/** Whole-view direct-ground illumination followed by one atmospheric scattering. */ groundWatts: number;
	/** Direct-ground component in the original first altitude shell alone. */ firstShellGroundWatts: number;
	/** Identical later effective increments retained explicitly. */ frozenThirdAndFourthWatts: readonly number[];
	/** Original physical first-order estimate minus measurement. */ physicalFirstResidualWatts: number;
	/** Original raw first-order cache error relative to physical P1. */ originalFirstNumericalWatts: number;
	/** Original raw grouped N4 minus measurement, retaining both original numerical errors. */ originalRawResidualWatts: number;
	/** Physical-P1 correction plus supplied P2 replacement, with original effective J3/J4 frozen. */ jointSquaredScoreChange: number;
	/** Score interaction of the two fixed radiance corrections, not a recurrence interaction. */ firstSecondScoreInteraction: number;
	/** Fully checked algebra on the supplied estimate. */ replacement: SkySecondOrderReplacement;
}>;

/** Pure manufactured algebra verification; not physical reference evidence. */
type SkySecondOrderAnalysisProof = Readonly<{
	/** Explicit proof identity. */ schemaId: string;
	/** Executed positive, negative and rejection cases. */ checks: number;
}>;
