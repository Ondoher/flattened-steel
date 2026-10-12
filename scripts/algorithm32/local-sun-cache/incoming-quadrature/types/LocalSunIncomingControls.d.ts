/** Authenticated historical diagnostic projection; other diagnostic quantities remain unused. */
interface LocalSunIncomingDiagnosticArtifact {
	/** Historical result schema. */ schema: string;
	/** Frozen midpoint-azimuth48 samples produced before the production candidate. */ shiftedNodes: {
		/** Unit vector in the preserved flat basis. */ direction: UnitVector3;
		/** Positive measure in steradians. */ weight: number;
	}[];
}
