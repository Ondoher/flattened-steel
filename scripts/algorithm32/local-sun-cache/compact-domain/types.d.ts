/** Independent first-slice geometry/bounds comparison; no held-amplitude or field acceptance. */
type LocalSunCompactDomainProofReport = Readonly<{
	/** Successful comparison label. */ readonly status: string;
	/** Production-owned independent fixture path. */ readonly authority: string;
	/** Exact independent fixture byte hash. */ readonly authoritySha256: string;
	/** Executable accepted topology identity. */ readonly topologyId: string;
	/** All compared compact positions. */ readonly positions: number;
	/** All compared ragged altitude rows. */ readonly rows: number;
	/** All compared physical bands, including omissions. */ readonly bands: number;
	/** All compared source-amplitude partition endpoints. */ readonly amplitudeBoundaries: number;
	/** Every exact-node reconstruction exercised. */ readonly exactNodeQueries: number;
	/** Independent boundary/interior/admission sentinels compared. */ readonly sentinelQueries: number;
	/** Explicitly rejected outside-coverage fixture queries. */ readonly rejectedQueries: number;
	/** False; held source-strength values need separate independent authority. */ readonly heldAmplitudesQualified: boolean;
	/** False; no scattering field or GPU qualification. */ readonly fieldsQualified: boolean;
	/** Complete executable band/altitude/refinement/medium controls; no expected node or weight values. */ readonly configuration: FlatCompactTopologyRequest;
	/** Actual finite-source calibration/position inputs; held outputs remain unqualified. */ readonly sourceFacts: LocalSunShellFactSourceConfiguration;
}>;
