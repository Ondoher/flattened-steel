/** A local ground-density reconstruction query, separate from any view integral. */
type SkyGroundDensityProbePlan = Readonly<{
	/** Frozen benchmark identity. */ probe: SkyContinuationProbe;
	/** Physical scene identity. */ sceneId: string;
	/** Observer and outgoing direction defining this density query. */ ray: SkyRayGeometry;
	/** Local reconstruction support; step is a placeholder and is never integrated. */ sample: SkyViewSample;
}>;

/** Ephemeral local tap union for four preregistered ground witnesses. */
type SkyGroundDensityPlan = Readonly<{
	/** Sparse texture coordinates in local index order. */ coordinates: readonly SkyFieldCoordinate[];
	/** Exactly four output probes. */ probes: readonly SkyGroundDensityProbePlan[];
}>;

/** One reconstructed source-density witness with its complete compact tap derivation. */
type SkyGroundDensityRow = Readonly<{
	/** Frozen benchmark identity. */ probeId: string;
	/** Physical scene identity. */ sceneId: string;
	/** Registered measurement time. */ time: string;
	/** Canonical grid coordinates. */ gridX: number;
	/** Canonical grid coordinates. */ gridY: number;
	/** Actual observer in canonical world coordinates. */ origin: SkyVector3;
	/** Actual outgoing direction in canonical world coordinates. */ direction: SkyVector3;
	/** Reconstructed pure J1 through J4, not cumulative radiances. */ pureDensities: readonly number[];
	/** Exact interpolation weights and local tap indices. */ sample: SkyViewSample;
}>;

/** Small ground-component envelope with units distinct from spectral radiance. */
type SkyGroundDensityEvidence = Readonly<{
	/** Exact component schema. */ schemaId: 'sky-ground-density-v1';
	/** Density scope does not imply a view-integral or Kider score. */ scope: 'four-ground-density-probes';
	/** Scattering-density units. */ units: 'W m^-3 sr^-1 nm^-1';
	/** Reconstruction rule applied to retained taps. */ solarInterpolation: SkySolarInterpolation;
	/** J1 through J4 raw scalar source fields. */ fieldIds: readonly string[];
	/** Sparse coordinates in the exact local field order. */ coordinates: readonly SkyFieldCoordinate[];
	/** One compact field array per pure order, including every tap used by the four probes. */ fields: readonly (readonly number[])[];
	/** Exactly four reconstructed density observations. */ rows: readonly SkyGroundDensityRow[];
	/** Explicit finite-grid and boundary limitations. */ limitations: readonly string[];
}>;

/** One adaptive ray's relationship to the ordinary boundary and frozen components. */
type SkyAdaptiveCaptureIdentity = Readonly<{
	/** Stable support-local identity. */ id: string;
	/** Registered time. */ time: string;
	/** Canonical grid column. */ gridX: number;
	/** Canonical grid row. */ gridY: number;
	/** Ordinary screen index, or null for an additional component-only ray. */ ordinaryRayIndex: number | null;
	/** Frozen component identity, or null for an ordinary ray without sparse mesh evidence. */ probeId: string | null;
}>;

/** Ephemeral adaptive union with explicit ordinary/component joins. */
type SkyAdaptiveCapturePlan = Readonly<{
	/** Local sparse and physical query support. */ support: SkyAdaptiveViewPlan;
	/** One identity per support ray. */ identities: readonly SkyAdaptiveCaptureIdentity[];
}>;

/** Counted adaptive and equal-budget uniform results for one physical ray. */
type SkyAdaptiveCaptureRow = SkyAdaptiveCaptureIdentity &
	Readonly<{
		/** Number of physical altitude segments. */ segmentCount: number;
		/** Results at total queried-node budgets 4P/8P/16P. */ adaptive: readonly SkyAdaptiveCheckpoint[];
		/** Independent counted uniform results at 4P/8P/16P. */ uniform: readonly SkyAdaptiveCheckpoint[];
	}>;

/** Operational comparison with its own scope, distinct from component reference radiances. */
type SkyAdaptiveCaptureEvidence = Readonly<{
	/** Closed operational metadata schema. */ schemaId: 'sky-adaptive-capture-v1';
	/** Ordinary screen plus the sixteen extra-time component rays. */ scope: 'registered-screen-and-component';
	/** All retained radiances use these units. */ units: 'W m^-2 sr^-1 nm^-1';
	/** First-order reconstruction used by both compared evaluators. */ firstOrder: SkyContinuationFirstOrder;
	/** Ordinary three-time screen size. */ ordinaryRayCount: 243;
	/** All prepared midpoint nodes, including nodes never queried at runtime. */ preparedQueryCount: number;
	/** Four/five scalar reconstructions at each charged joint query. */ scalarReconstructionsPerNode: 4 | 5;
	/** Maximum same-count discrepancy versus ordinary grouped output. */ maximumUniformParityError: number;
	/** Separate ordinary/component identities and complete counted results. */ rows: readonly SkyAdaptiveCaptureRow[];
	/** Explicit limitations of the heuristic and cost accounting. */ limitations: readonly string[];
}>;
