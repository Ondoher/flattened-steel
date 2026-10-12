/** Implementation-owned Gaussian polar sample on the dimensionless interval [-1,1]. */
interface FlatHorizonPolarNode {
	/** Ordered vertical cosine before mapping into one flat-horizon band. */ readonly mu: number;
	/** Positive one-dimensional Gaussian measure; all nodes sum to two. */ readonly weight: number;
}
