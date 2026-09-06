/** Normalized metadata for one local-Sun field allocation. */
type LocalSunCpuFieldBuildDefinition = Readonly<{
	/** Unique identifier for the allocated field. */
	id: string;
	/** Executable local field packing. */
	packing: LocalSunFieldPacking;
	/** Pure or cumulative field order. */
	order: SpectralFieldOrderDefinition;
	/** Optional field-algorithm provenance identity. */
	provenanceIdentity?: string;
	/** Coherent executable domains. */
	domainSelection: LocalSunConstructionDomainSelection;
}>;

/** Binary64 field-family allocator for a local-Sun cache. */
class LocalSunCpuFields {
	/**
	 * Call this method to create one mutable pure incoming-radiance field.
	 *
	 * @param definition - The identity and pure order.
	 * @returns - The fresh mutable field.
	 */
	static createPureRadiance(definition: LocalSunCpuPureFieldDefinition): CpuDirectionalSpectralFieldContract;

	/**
	 * Call this method to create one mutable pure outgoing scattering-density field.
	 *
	 * @param definition - The identity and pure order.
	 * @returns - The fresh mutable field.
	 */
	static createPureScatteringDensity(definition: LocalSunCpuPureFieldDefinition): CpuDirectionalSpectralFieldContract;

	/**
	 * Call this method to create one mutable cumulative outgoing scattering-density field.
	 *
	 * @param definition - The identity and through-order.
	 * @returns - The fresh mutable field.
	 */
	static createCumulativeScatteringDensity(
		definition: LocalSunCpuCumulativeFieldDefinition,
	): CpuDirectionalSpectralFieldContract;
}
