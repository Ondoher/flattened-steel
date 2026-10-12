/** Independent retained incoming-vector authority and its complete derivation record. */
interface LocalSunIncomingQuadratureFixture {
	/** Checked fixture schema identity. */ schema: string;
	/** Selected experiment policy, separate from the production owner identity. */ policy: string;
	/** Flat radial/tangent/vertical basis; positive Z is slab up. */ coordinateMeaning: string;
	/** Solid-angle weight unit. */ weightUnits: 'steradians';
	/** Fixed polar band endpoints in dimensionless vertical cosine. */ edges: number[];
	/** Fixed Gaussian polar count in each band. */ polarCounts: number[];
	/** Fixed midpoint cyclic azimuth count. */ azimuthCount: number;
	/** Dimensionless half-step offset in azimuth sample index. */ azimuthOffset: number;
	/** Ordered independent direction/weight samples from immutable historical output. */ samples: {
		/** Unit vector in the selected flat basis. */ direction: UnitVector3;
		/** Positive solid-angle integration weight in steradians. */ weight: number;
	}[];
	/** Predeclared binary64 agreement limits; no physical-error claim. */ limits: {
		/** Absolute component and unit-norm comparison allowance. */ directionAbsolute: number;
		/** Absolute per-weight agreement allowance in steradians. */ weightAbsolute: number;
		/** Retained constant-mass gate in steradians. */ massAbsolute: number;
		/** Absolute band polynomial-moment allowance in steradians. */ momentAbsolute: number;
	};
	/** Original parents, operations, controls and tool identities. */ derivation: {
		/** Complete exact parent byte identities. */ parents: {
			/** Repository-relative immutable artifact path. */ path: string;
			/** SHA-256 of complete artifact bytes. */ sha256: string;
		}[];
		/** Original authenticated diagnostic ancestor/tool record. */ diagnosticInputs: string;
		/** Original authenticated terminal diagnostic artifact identities. */ diagnosticManifest: string;
		/** Original selected contract and its claims/limits. */ selectedContract: string;
		/** Original selected contract ancestry and derivation. */ selectedProvenance: string;
		/** Immutable later policy source snapshot, copied without execution. */ sourceSnapshot: string;
		/** Original source-snapshot run ancestry and tool identities. */ snapshotInputs: string;
		/** Original terminal source-snapshot artifact identities. */ snapshotManifest: string;
		/** Projection/equation/compatibility operation; expected output is never candidate-produced. */ operation: string;
		/** Exact maintained offline authoring implementation identity. */ producer: {
			/** Repository-relative producer source. */ path: string;
			/** SHA-256 of exact producer bytes. */ sha256: string;
		};
		/** Authoring runtime version. */ node: string;
	};
}

/** Selected incoming quadrature numerical comparison, excluding scattering fields and GPU behavior. */
interface LocalSunIncomingQuadratureReport {
	/** Successful terminal proof state. */ status: 'PASSED';
	/** Exact production direction-domain identity. */ domainId: string;
	/** SHA-256 of checked independent fixture bytes. */ authoritySha256: string;
	/** Number of compared ordered incoming samples. */ directions: number;
	/** Total integration weight in steradians. */ solidAngle: number;
	/** Largest absolute unit-vector component difference. */ maximumDirectionError: number;
	/** Largest per-sample solid-angle weight difference. */ maximumWeightError: number;
	/** Number of per-band Gaussian polynomial moments checked. */ bandMoments: number;
	/** Explicitly false; domain correctness does not accept scattering fields. */ fieldsQualified: false;
}
