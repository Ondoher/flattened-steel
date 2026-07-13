/** Type that supplies call-local tolerance behavior. */
type ToleranceOptions = {
	/** Value that stores the accepted absolute tolerance. */
	readonly epsilon?: number;
};

/** Type that supplies call-local range behavior. */
type RangeOptions = {
	/** Value that stores whether range endpoints are included. */
	readonly inclusive?: boolean;
};

/** Type that supplies call-local number formatting behavior. */
type NumberFormatOptions = {
	/** Value that stores the number of fixed decimal places to emit before trimming. */
	readonly precision?: number;

	/** Value that stores whether trailing fractional zeroes should be removed. */
	readonly trim?: boolean;
};

/** Type that supplies call-local angle wrapping bounds. */
type AngleWrapOptions = {
	/** Value that stores the inclusive lower wrap bound. */
	readonly min?: number;

	/** Value that stores the exclusive upper wrap bound. */
	readonly max?: number;
};

/** Request containing an optional renderer scene scale. */
type SceneScaleRequest = Readonly<{
	/** Renderer scene-to-physical scale. */
	readonly sceneScale?: SceneScale;
}>;

/**
 * Mapping from one numeric array value to another numeric value.
 */
type NumericArrayMapper =
	/**
	 * Called by numeric array mapper to handle one invocation of the declared operation.
	 * @param value - The value accepted by the operation.
	 * @param index - The zero-based index accepted by the operation.
	 * @param values - The values value accepted by the operation.
	 * @returns - The callback result returned to its caller.
	 */ (
		/**
		 * Current numeric value.
		 */
		value: number,

		/**
		 * Current numeric index.
		 */
		index: number,

		/**
		 * Source numeric array.
		 */
		values: readonly number[],
	) => number;

/** Type that supplies call-local nearest-sample lookup behavior. */
type NearestSampleIndexOptions = {
	/** Value that stores whether out-of-range targets clamp to the nearest endpoint. */
	readonly clamp?: boolean;
};

/** Type that supplies call-local sample padding behavior. */
type SamplePaddingOptions = {
	/** Value that stores the number of samples to add before the source samples. */
	readonly before?: number;

	/** Value that stores the number of samples to add after the source samples. */
	readonly after?: number;

	/** Value that stores the value used for padded samples. */
	readonly value?: number;
};

/**
 * Expected ordering direction for one monotonic sample sequence.
 *
 * - **"ascending"** - Each sample is greater than or equal to the previous sample unless strict mode is enabled.
 * - **"descending"** - Each sample is less than or equal to the previous sample unless strict mode is enabled.
 */
type MonotonicDirection = 'ascending' | 'descending';

/** Type that supplies call-local monotonic check behavior. */
type MonotonicOptions = {
	/** Expected ordering direction of the sample sequence. */
	readonly direction?: MonotonicDirection;

	/** Value that stores whether equal adjacent samples are rejected. */
	readonly strict?: boolean;
};

/**
 * Traversal direction for one ordered sample walk.
 *
 * - **"ascending"** - Traversal from the first sample to the last sample.
 * - **"descending"** - Traversal from the last sample to the first sample.
 */
type SampleWalkDirection = 'ascending' | 'descending';

/** Type that supplies call-local sample traversal behavior. */
type SampleWalkOptions = {
	/** Direction of the ordered sample traversal. */
	readonly direction?: SampleWalkDirection;
};

/** Type for one sample traversal entry. */
type SampleWalkEntry = {
	/** Value that stores the source sample index. */
	readonly index: number;

	/** Value that stores the source sample value. */
	readonly value: number;
};

/** Type that supplies call-local sample signature behavior. */
type SampleSignatureOptions = {
	/** Value that stores the number of fixed decimal places to emit before trimming. */
	readonly precision?: number;

	/** Value that stores the separator placed between formatted sample values. */
	readonly separator?: string;
};

/** Type that stores one normalized three-dimensional vector. */
type UnitVector3 = readonly [number, number, number];
