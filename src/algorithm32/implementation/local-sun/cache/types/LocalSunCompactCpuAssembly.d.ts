/** Fixed existing physical collaborators and source-neutral shared phase calculator. */
type LocalSunCompactCpuAssemblyDefinition = LocalSunCompactTransportDefinition &
	Readonly<{
		/** Existing bound source with complete normalized physical facts. */ lightSource: LocalSunCacheProviderSource;
		/** Existing shared physical phase/scattering operation. */ calculator: LaterOrderScatteringCalculator;
		/** Existing medium and physical phase owner. */ atmosphere: CanonicalCacheColumnAtmosphere &
			Pick<AtmosphereModel, 'samplePhase'>;
		/** Geometry-owned physical cache-frame transformation. */ geometry: LocalSunCompactTransportDefinition['geometry'] &
			Pick<FlatEarthGeometry, 'expressPhysicalScatteringCacheDirection'>;
	}>;

/** Actual ragged domain and direction-fastest logical packing; no rectangular axes or allocated full field. */
type LocalSunCompactCpuDomains = Readonly<{
	/** Real compact nodes/admission. */ topology: FlatCompactTopology;
	/** Shared Native15 physical interpretation. */ spectralBasis: SpectralBasis;
	/** Qualified flat incoming measure. */ incomingDirections: WeightedDirectionDomain;
	/** Shared W27 outgoing reconstruction. */ outgoingDirections: CubedSphereDirectionDomain;
	/** Logical full-domain L packing, without a resident buffer. */ radiancePacking: LocalSunFieldPacking;
	/** Logical full-domain J packing, without a resident buffer. */ scatteringPacking: LocalSunFieldPacking;
}>;

/** One allocated physical compact/W27 primary sample. */
type LocalSunCompactPrimarySampleRequest = Readonly<{
	/** Compact address. */ positionIndex: number;
	/** W27 address. */ directionIndex: number;
}>;

/** Lazy physical-primary storage accounting, excluding implementation object overhead. */
type LocalSunCompactPrimaryMemoUsage = Readonly<{
	/** Retained logical node/direction spectra. */ spectra: number;
	/** Binary64 spectral payload only. */ spectralPayload: UnitValue<'bytes'>;
}>;

/** Selected physical L1 inputs to one full-measure J2 scattering step. */
type LocalSunCompactScatteringStepRequest = Readonly<{
	/** Explicit unique compact addresses, at most eight. */ positionIndices: readonly number[];
	/** Explicit unique W27 addresses, at most eight. */ outgoingDirectionIndices: readonly number[];
	/** Incoming physical-field identity, distinct from claiming full recurrence. */ provenanceIdentity: string;
	/**
	 * Call this method to supply a physical L1 spectrum at one selected compact/incoming address.
	 *
	 * @param request - Actual compact address and full-measure incoming index.
	 * @returns - Basis-compatible physical radiance packet; signed finite samples are allowed.
	 */
	sampleIncomingRadiance(request: Readonly<{positionIndex: number; directionIndex: number}>): SpectralPacket;
}>;

/** Genuine sealed subset field with explicit maps to complete physical domains. */
type LocalSunCompactSelectedScatteringResult = Readonly<{
	/** Local field position slots mapped to compact addresses. */ positionIndices: readonly number[];
	/** Local field direction slots mapped to W27 addresses. */ outgoingDirectionIndices: readonly number[];
	/** Sealed physical pure J2 subset, not a complete compact field. */ field: CpuDirectionalSpectralFieldContract;
	/** Exact previous/output binary64 buffers allocated for this step, excluding working blocks and object overhead. */ allocatedSpectralBytes: UnitValue<'bytes'>;
}>;
