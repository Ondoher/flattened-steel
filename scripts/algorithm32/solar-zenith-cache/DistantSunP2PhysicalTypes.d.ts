/** Sparse physical-query reconstruction contract over unchanged Native48/Z180/W27 domains. */
interface P2PhysicalStencil {
	positionIndices: number[];
	positionFraction: number;
	solarIndices: number[];
	solarFraction: number;
	firstSolarInterval: boolean;
	lastSolarInterval: boolean;
	directionIndices: readonly number[];
	directionWeights: readonly number[];
	indices: number[][][];
}

/** One declared logical physical input, independently reproducible from the profile. */
interface P2PhysicalQuery {
	id: string;
	kind: 'surface' | 'b1' | 'lookup-only';
	heightMeters: number;
	solarZenithDegrees: number;
	localDirection: number[];
	stencil: P2PhysicalStencil;
}

/** One quadratic-near-observer Q30 atmospheric-path midpoint. */
interface P2PhysicalSample {
	stepMeters: number;
	heightMeters: number;
	solarZenithDegrees: number;
	localDirection: number[];
	stencil: P2PhysicalStencil;
}

/** One physical ray and its ordered atmospheric samples; no final ground-surface term. */
interface P2PhysicalRay {
	id: string;
	kind: 'surface' | 'b1';
	queryIndex: number;
	lengthMeters: number;
	endsOnGround: boolean;
	samples: P2PhysicalSample[];
}

/** Sparse readback coordinate in the production recurrence texture. */
interface P2PhysicalCoordinate {
	position: number;
	zenith: number;
	direction: number;
	x: number;
	y: number;
	label: string;
}

/** Complete registered matrix and its deduplicated field dependency inventory. */
interface P2PhysicalMatrix {
	schema: string;
	screen: boolean;
	coordinates: P2PhysicalCoordinate[];
	queries: P2PhysicalQuery[];
	rays: P2PhysicalRay[];
	heightsMeters: number[];
	solarZenithDegrees: number[];
	grazingOffsetDegrees: number;
	traversals: {sunrise: number[]; sunset: number[]};
}

/** Authenticated benchmark scene geometry, independent of either spectral profile. */
interface P2PhysicalScene extends BrunetonQualificationScene {
	zenithDegrees: number;
}

/** Complete profile data consumed independently by fresh GPU and binary64 computation. */
interface P2PhysicalProfile {
	id: 'native15' | 'direct40';
	buildRequest: DistantSunSceneCacheCompilerBuildRequest;
}
