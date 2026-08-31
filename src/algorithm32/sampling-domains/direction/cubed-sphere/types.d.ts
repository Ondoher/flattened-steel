/** Definition of one supported executable cubed-sphere direction domain. */
type CubedSphereDirectionDomainDefinition = Readonly<{
	/** Unique identifier for the executable domain. */
	readonly id: string;
	/** Supported boundary-inclusive number of nodes along each face edge. */
	readonly faceWidth: 3 | 9 | 27;
}>;

/** Right-handed definition of one cubed-sphere face. */
type CubedSphereFace = {
	/** Unique identifier for the face. */
	readonly id: string;
	/** Outward unit normal of the face. */
	readonly normal: UnitVector3;
	/** Unit vector of the face-local horizontal axis. */
	readonly uAxis: UnitVector3;
	/** Unit vector of the face-local vertical axis. */
	readonly vAxis: UnitVector3;
};

/** Face-local address of one flattened cubed-sphere node. */
type CubedSphereNodeAddress = {
	/** Zero-based index of the containing face. */
	readonly faceIndex: number;
	/** Unique identifier of the containing face. */
	readonly faceId: string;
	/** Zero-based horizontal index within the face. */
	readonly uIndex: number;
	/** Zero-based vertical index within the face. */
	readonly vIndex: number;
};

/** Flattened indices of the positive-axis cubed-sphere face centers. */
type CubedSpherePositiveFaceCenterIndices = Readonly<{
	/** Flattened index of the positive-X face center. */
	readonly positiveX: number;
	/** Flattened index of the positive-Y face center. */
	readonly positiveY: number;
	/** Flattened index of the positive-Z face center. */
	readonly positiveZ: number;
}>;

/** Exact seam mapping derived from one logical cubed-sphere direction table. */
type CubedSphereExactSeamMapping = Readonly<{
	/** Unique physical directions in first-logical-occurrence order. */
	readonly uniqueUnitVectors: readonly UnitVector3[];
	/** Logical-direction to unique-direction indices. */
	readonly logicalToUniqueDirectionIndices: Uint16Array;
}>;

/** Executable boundary-inclusive cubed-sphere direction domain. */
interface CubedSphereDirectionDomain extends DirectionDomain {
	/** Number of nodes along one face edge. */
	readonly faceWidth: number;
	/** Number of cells along one face edge. */
	readonly cellWidth: number;
	/** Number of nodes on one face. */
	readonly faceNodeCount: number;
	/** Executable face definitions in flattening order. */
	readonly faces: readonly CubedSphereFace[];
	/** Flattened indices of the positive-axis face centers. */
	readonly positiveFaceCenterIndices: CubedSpherePositiveFaceCenterIndices;
	/** Unique physical directions in first-logical-occurrence order. */
	readonly uniqueUnitVectors: readonly UnitVector3[];
	/** Exact logical-direction to unique-direction indices. */
	readonly logicalToUniqueDirectionIndices: Uint16Array;
	/** Number of unique physical directions. */
	readonly uniqueDirectionCount: number;
	/**
	 * Call this method to flatten one face-local node.
	 * @param faceIndex - The face index value accepted by the operation.
	 * @param faceUIndex - The face-local u index accepted by the operation.
	 * @param faceVIndex - The face-local v index accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	flattenNodeIndex(faceIndex: number, faceUIndex: number, faceVIndex: number): number;
	/**
	 * Call this method to reverse one flattened node index.
	 * @param index - The zero-based index accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	unflattenNodeIndex(index: number): CubedSphereNodeAddress;
	/**
	 * Call this method to resolve one source-local direction into reconstruction taps.
	 * @param direction - The direction value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	resolveStencil(direction: UnitVector3): ScatteringCacheDirectionStencil;
}
