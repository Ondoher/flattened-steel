/** Describe one ordered physical position node. */
type PositionDomainNode = {
	/** Store the descriptor-local ordered index. */
	readonly index: number;

	/** Store the physical node coordinate. */
	readonly coordinate: Distance;

	/** Identify the node's selected construction role. */
	readonly role: string;

	/** Store additional immutable identity data. */
	readonly metadata: Readonly<Record<string, unknown>>;
};

/** Supply one physical position node in its owner-selected canonical units. */
type PositionDomainNodeDefinition = {
	/** Store the index. */
	readonly index?: number;
	/** Store the coordinate. */
	readonly coordinate: Distance;
	/** Identify the selected role. */
	readonly role?: string;
	/** Store the metadata. */
	readonly metadata?: Readonly<Record<string, unknown>>;
};

/** Supply one position-domain definition. */
type PositionDomainDefinition = {
	/** Identify this value. */
	readonly id: string;
	/** Identify the schema revision. */
	readonly schemaRevision: string;
	/** Identify the generator revision. */
	readonly generatorRevision: string;
	/** Describe the physical mapping. */
	readonly mapping: Readonly<Record<string, unknown>>;
	/** Describe the coordinate frame. */
	readonly frame: Readonly<Record<string, unknown>>;
	/** Describe the interpolation policy. */
	readonly interpolation: Readonly<Record<string, unknown>>;
	/** Identify the numeric precision. */
	readonly precision: string;
	/** Store the count. */
	readonly count?: number;
	/** Store the nodes. */
	readonly nodes: readonly PositionDomainNodeDefinition[];
};

/** Configure one supported executable spherical native position owner. */
type SphericalNativePositionDomainDefinition = Readonly<{
	/** Identify the domain and its descriptor. */
	readonly id: string;
	/** Select one supported native lattice size. */
	readonly count: 4 | 16 | 48;
	/** Override the count-specific retained generator identity. */
	readonly generatorRevision?: string;
}>;

/** Describe one executable spherical native position owner. */
interface SphericalNativePositionDomain {
	/** Store an independent declarative copy of the domain identity. */
	readonly descriptor: PositionDomainDescriptor;
	/** Store the executable native position count. */
	readonly count: number;
	/** Store executable ordered native position nodes. */
	readonly nodes: readonly PositionDomainNode[];
	/** Store the executable ground radius. */
	readonly bottomRadius: Distance;
	/** Store the executable atmosphere-top radius. */
	readonly topRadius: Distance;
}

/** Describe readonly physical position-domain metadata. */
type PositionDomainDescriptor = Readonly<{
	/** Identify the contract kind. */
	readonly kind: "position-domain";
	/** Identify this value. */
	readonly id: string;
	/** Identify the schema revision. */
	readonly schemaRevision: string;
	/** Identify the generator revision. */
	readonly generatorRevision: string;
	/** Describe the physical mapping. */
	readonly mapping: Readonly<Record<string, unknown>>;
	/** Describe the coordinate frame. */
	readonly frame: Readonly<Record<string, unknown>>;
	/** Describe the interpolation policy. */
	readonly interpolation: Readonly<Record<string, unknown>>;
	/** Identify the numeric precision. */
	readonly precision: string;
	/** Store the count. */
	readonly count: number;
	/** Store the nodes. */
	readonly nodes: readonly PositionDomainNode[];
	/** Identify the normalized content. */
	readonly contentHash: string;
}>;

/** Store solid-angle quadrature weights. */
type SolidAngleWeights = {
	/** Store one weight per direction. */
	readonly values: readonly number[];

	/** Identify the weight unit. */
	readonly units: "steradians";
};

/** Supply one direction-domain definition. */
type DirectionDomainDefinition = {
	/** Identify this value. */
	readonly id: string;
	/** Identify the schema revision. */
	readonly schemaRevision: string;
	/** Identify the generator revision. */
	readonly generatorRevision: string;
	/** Describe the coordinate frame. */
	readonly frame: Readonly<Record<string, unknown>>;
	/** Describe the domain topology. */
	readonly topology: Readonly<Record<string, unknown>>;
	/** Describe the interpolation policy. */
	readonly interpolation: Readonly<Record<string, unknown>>;
	/** Identify the numeric precision. */
	readonly precision: string;
	/** Store the count. */
	readonly count?: number;
	/** Store the unit vectors. */
	readonly unitVectors: readonly UnitVector3[];
	/** Store the integration weights. */
	readonly integrationWeights?: SolidAngleWeights | null;
};

/** Configure one supported executable cubed-sphere direction owner. */
type CubedSphereDirectionDomainDefinition = Readonly<{
	/** Identify the domain and its descriptor. */
	readonly id: string;
	/** Select one supported boundary-inclusive face width. */
	readonly faceWidth: 3 | 9 | 27;
}>;

/** Describe readonly physical direction-domain metadata. */
type DirectionDomainDescriptor = Readonly<{
	/** Identify the contract kind. */
	readonly kind: "direction-domain";
	/** Identify this value. */
	readonly id: string;
	/** Identify the schema revision. */
	readonly schemaRevision: string;
	/** Identify the generator revision. */
	readonly generatorRevision: string;
	/** Describe the coordinate frame. */
	readonly frame: Readonly<Record<string, unknown>>;
	/** Describe the domain topology. */
	readonly topology: Readonly<Record<string, unknown>>;
	/** Describe the interpolation policy. */
	readonly interpolation: Readonly<Record<string, unknown>>;
	/** Identify the numeric precision. */
	readonly precision: string;
	/** Store the count. */
	readonly count: number;
	/** Store the unit vectors. */
	readonly unitVectors: readonly UnitVector3[];
	/** Store the integration weights. */
	readonly integrationWeights: SolidAngleWeights | null;
	/** Identify the normalized content. */
	readonly contentHash: string;
}>;

/** Describe one right-handed cubed-sphere face. */
type CubedSphereFace = {
	/** Identify this value. */
	readonly id: string;
	/** Store the normal. */
	readonly normal: UnitVector3;
	/** Store the u axis. */
	readonly uAxis: UnitVector3;
	/** Store the v axis. */
	readonly vAxis: UnitVector3;
};

/** Describe one flattened cubed-sphere node address. */
type CubedSphereNodeAddress = {
	/** Store the face index. */
	readonly faceIndex: number;
	/** Store the face id. */
	readonly faceId: string;
	/** Store the u index. */
	readonly uIndex: number;
	/** Store the v index. */
	readonly vIndex: number;
};

/** Retain the established W27 address name for compatibility. */
type CubedSphereW27NodeAddress = CubedSphereNodeAddress;

/** Store the positive-axis cubed-sphere face-center indices. */
type CubedSpherePositiveFaceCenterIndices = Readonly<{
	/** Store the positive-X face center. */
	readonly positiveX: number;
	/** Store the positive-Y face center. */
	readonly positiveY: number;
	/** Store the positive-Z face center. */
	readonly positiveZ: number;
}>;

/** Describe one executable cubed-sphere direction owner. */
interface CubedSphereDirectionDomain {
	/** Store an independent declarative copy of the domain identity. */
	readonly descriptor: DirectionDomainDescriptor;
	/** Store the number of nodes along one face edge. */
	readonly faceWidth: number;
	/** Store the number of cells along one face edge. */
	readonly cellWidth: number;
	/** Store the number of nodes on one face. */
	readonly faceNodeCount: number;
	/** Store the full duplicated-seam direction count. */
	readonly directionCount: number;
	/** Store executable face definitions in flattening order. */
	readonly faces: readonly CubedSphereFace[];
	/** Store executable source-local unit vectors. */
	readonly unitVectors: readonly UnitVector3[];
	/** Store the positive-axis face-center indices. */
	readonly positiveFaceCenterIndices:
		CubedSpherePositiveFaceCenterIndices;
	/** Flatten one face-local node. */
	flattenNodeIndex(
		faceIndex: number,
		uIndex: number,
		vIndex: number,
	): number;
	/** Reverse one flattened node index. */
	unflattenNodeIndex(index: number): CubedSphereNodeAddress;
	/** Resolve one source-local direction into reconstruction taps. */
	resolveStencil(direction: UnitVector3): ScatteringCacheDirectionStencil;
}

/** Describe the executable paired-Fibonacci-34 incoming quadrature owner. */
interface PairedFibonacci34DirectionDomain {
	/** Store an independent declarative copy of the domain identity. */
	readonly descriptor: DirectionDomainDescriptor;
	/** Store the fixed number of source-local directions. */
	readonly directionCount: number;
	/** Store the fixed number of positive/antipodal direction pairs. */
	readonly pairCount: number;
	/** Store executable source-subpoint-local unit vectors. */
	readonly unitVectors: readonly UnitVector3[];
	/** Store executable solid-angle quadrature weights. */
	readonly integrationWeights: SolidAngleWeights;
}
