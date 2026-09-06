/** Type that describes one ordered physical position node. */
type PositionDomainNode = {
	/** Value that stores the owner-local ordered index. */
	readonly index: number;

	/** Value that stores the physical node coordinate. */
	readonly coordinate: Distance;

	/** Value that identifies the node's selected construction role. */
	readonly role: string;

	/** Value that stores additional immutable identity data. */
	readonly metadata: Readonly<Record<string, unknown>>;
};

/** Type that supplies one physical position node in its owner-selected canonical units. */
type PositionDomainNodeDefinition = {
	/** Value that stores the index. */
	readonly index?: number;
	/** Value that stores the coordinate. */
	readonly coordinate: Distance;
	/** Value that identifies the selected role. */
	readonly role?: string;
	/** Value that stores the metadata. */
	readonly metadata?: Readonly<Record<string, unknown>>;
};

/** Contract that describes one executable ordered physical position domain. */
interface PositionDomain {
	/** Value that identifies the executable domain. */
	readonly id: string;
	/** Value that stores the executable position count. */
	readonly count: number;
	/** Value that stores executable ordered position nodes. */
	readonly nodes: readonly PositionDomainNode[];
}

/** Type that stores solid-angle quadrature weights. */
type SolidAngleWeights = {
	/** Value that stores one weight per direction. */
	readonly values: readonly number[];

	/** Value that identifies the weight unit. */
	readonly units: 'steradians';
};

/** Contract that describes one executable physical direction domain. */
interface DirectionDomain {
	/** Value that identifies the executable domain. */
	readonly id: string;
	/** Value that stores the executable direction count. */
	readonly directionCount: number;
	/** Value that stores executable unit vectors. */
	readonly unitVectors: readonly UnitVector3[];
	/** Value that stores integration weights, or null when the domain is not quadrature. */
	readonly integrationWeights: SolidAngleWeights | null;
}

/** Executable incoming-direction domain whose samples carry quadrature measure. */
interface WeightedDirectionDomain extends DirectionDomain {
	/** One finite nonnegative solid-angle weight for every ordered direction. */
	readonly integrationWeights: SolidAngleWeights;
}

/** Executable outgoing-direction domain that owns reconstruction from a physical direction. */
interface ReconstructionDirectionDomain extends DirectionDomain {
	/** Resolve one owner-local unit direction into normalized cache reconstruction taps. */
	resolveStencil(direction: UnitVector3): ScatteringCacheDirectionStencil;
}
