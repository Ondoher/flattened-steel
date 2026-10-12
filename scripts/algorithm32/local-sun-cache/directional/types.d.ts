/** Successful interpolation-support comparison; no physical-field acceptance. */
type LocalSunDirectionalReport = Readonly<{
	/** Complete selected proof outcome. */
	status: 'PASSED';
	/** Independently compared physical node count. */
	spatialNodes: number;
	/** Frozen angular/frame control count. */
	angularControls: number;
	/** Spatial/angular queries compared. */
	comparisons: number;
	/** Queries containing both axis and ordinary taps. */
	mixedQueries: number;
	/** Exact W27 logical nodes reconstructed, including seam aliases. */
	exactAngularNodes: number;
	/** Largest dimensionless spatial-weight discrepancy. */
	maximumSpatialWeightError: number;
	/** Largest dimensionless angular-weight discrepancy. */
	maximumAngularWeightError: number;
	/** Largest dimensionless near-axis synthetic-value discrepancy. */
	maximumContinuityDifference: number;
	/** Explicitly rejected unsupported-query count. */
	rejected: number;
	/** Physical field qualification is outside this proof. */
	fieldsQualified: false;
	/** Equivalent structural topology and kilometre pairing facts were accepted. */
	substitutableTopology: true;
}>;

/** Frozen analytic angular controls with complete immutable parent identities. */
type LocalSunDirectionalFixture = Readonly<{
	/** Exact portable authority schema. */
	schema: 'local-sun-directional-controls-v1';
	/** Selected independent ordinary-frame and canonical-axis gold. */
	cases: readonly Readonly<{
		/** Query radial angle in radians from +X. */
		angle: number;
		/** Physical outgoing unit vector. */
		direction: UnitVector3;
		/** Ordinary query-frame W27 support. */
		normal: ScatteringCacheDirectionStencil;
		/** Azimuth-independent axis-limit W27 support. */
		axis: ScatteringCacheDirectionStencil;
	}>[];
	/** Predeclared dimensionless binary64 interpolation limits. */
	limits: Readonly<{
		/** Angular-weight absolute tolerance. */
		weightAbsolute: number;
		/** Joint weight-sum absolute tolerance. */
		weightSumAbsolute: number;
		/** Exact spatial/angular node absolute tolerance. */
		exactNodeAbsolute: number;
		/** Bounded synthetic near-axis fan absolute tolerance. */
		continuityAbsolute: number;
	}>;
	/** Original parent/input/operation/tool derivation, retained with the controls. */
	derivation: Readonly<{
		/** Read-only authenticated historical/control parents. */
		parents: readonly Readonly<{
			/** Repository-relative artifact identity. */ path: string;
			/** Complete artifact byte identity. */ sha256: string;
		}>[];
		/** Complete original snapshot input ancestry record. */
		historicalInputs: string;
		/** Complete original snapshot manifest/derivation record. */
		historicalManifest: string;
		/** Independent equations and operation conventions. */
		operation: string;
		/** Exact offline producer identity. */
		producer: Readonly<{
			/** Maintained repository tool path. */ path: string;
			/** Complete producer source byte identity. */ sha256: string;
		}>;
		/** Authoring runtime identity. */
		tools: Readonly<{/** Node runtime version. */ node: string}>;
	}>;
}>;
