/** Contract that describes the executable Fibonacci-34 incoming quadrature owner. */
interface Fibonacci34DirectionDomain extends DirectionDomain {
	/** Integration weights value. */ readonly integrationWeights: SolidAngleWeights;
}

/** Contract that describes the executable paired-Fibonacci-34 incoming quadrature owner. */
interface PairedFibonacci34DirectionDomain extends DirectionDomain {
	/** Value that stores the fixed number of positive/antipodal direction pairs. */
	readonly pairCount: number;
	/** Integration weights value. */ readonly integrationWeights: SolidAngleWeights;
}

/** Contract that describes the orientation-balanced paired-Fibonacci-68 incoming quadrature owner. */
interface PairedRotatedFibonacci68DirectionDomain extends DirectionDomain {
	/** Value that stores the fixed number of positive/antipodal direction pairs. */
	readonly pairCount: number;
	/** Integration weights value. */ readonly integrationWeights: SolidAngleWeights;
}
