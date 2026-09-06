/** Numerical facts used while generating one cubed-sphere direction domain. */
type CubedSphereDirectionGenerationFacts = Readonly<{
	/** Number of nodes along each face edge. */
	readonly faceWidth: number;
	/** Number of cells along each face edge. */
	readonly cellWidth: number;
	/** Number of nodes on each face. */
	readonly faceNodeCount: number;
	/** Total number of directions in the domain. */
	readonly directionCount: number;
	/** Ordered definitions of the six cubed-sphere faces. */
	readonly faces: readonly CubedSphereFace[];
}>;

/** Interpolation location of one continuous face-grid coordinate. */
type CubedSphereGridLocation = Readonly<{
	/** Lower node index of the interpolation pair. */
	readonly lower: number;
	/** Upper node index of the interpolation pair. */
	readonly upper: number;
	/** Fractional weight of the upper node. */
	readonly fraction: number;
	/** Whether the coordinate lands exactly on one node. */
	readonly exact: boolean;
}>;
