/** Type that supplies construction dependencies for the CPU/reference algorithm execution collaborator. */
type ReferenceDependencies = {
	/** Value that stores the facade-owned shared model consumed by reference evaluations. */
	readonly model: SharedModel;

	/** Value that stores an optional default cumulative CPU scattering cache for reference evaluation. */
	readonly scatteringCache?: CpuScatteringCache;

	/** Value that stores an optional calculator double for focused tests. */
	readonly calculator?: SpectralCalculator;
};

/** CPU/reference execution surface retained by the Algorithm32 facade. */
interface ReferenceExecution {
	/** Facade-owned shared model consumed by reference evaluations. */
	readonly model: SharedModel;

	/** Shared spectral calculator used by reference evaluations. */
	readonly calculator: SpectralCalculator;

	/**
	 * Call this method to evaluate spectral radiance and transmittance for one ray request.
	 * @param request - The request accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	evaluate(request: EvaluationRequest): EvaluationResult;

	/** Call this method to release resources owned by the reference execution collaborator. */
	dispose(): void;
}
