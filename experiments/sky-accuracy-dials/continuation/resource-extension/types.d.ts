/** Chronological usage immediately before the sole resource extension. */
type SkyResourceExtensionUsage = DialContinuationInitialCounters &
	Readonly<{
		retainedBytesByPhase: Readonly<Record<SkyContinuationAllocationPhase, number>>;
	}>;
/** Closed conserved transfer; no generic override or extra resource cap is accepted. */
type SkyContinuationResourceExtensionRecord = Readonly<{
	schemaId: 'sky-continuation-resource-extension-v1';
	registration: DialFileIdentity;
	previousAmendment: DialFileIdentity;
	through: DialFileIdentity;
	plan: DialFileIdentity;
	registeredLimits: DialContinuationResourceCaps;
	priorPhaseAllocations: readonly DialContinuationPhaseAllocation[];
	effectivePhaseAllocations: readonly DialContinuationPhaseAllocation[];
	usageBefore: SkyResourceExtensionUsage;
	amendmentPhase: 'C6';
	allocatedBytes: number;
	minimumRemainingC6Bytes: number;
	maximumJobMilliseconds: number;
	finalizationReserveMilliseconds: number;
	equation: string;
}>;
/** Common seal/effectivePhaseAllocations contract keeps existing future-parent gates intact. */
type SkyContinuationResourceExtensionRead = Readonly<{
	seal: DialFileIdentity;
	record: SkyContinuationResourceExtensionRecord;
}>;
/** Narrow terminal fields consumed by this extension verifier. */
type SkyResourceExtensionTerminal = SkyMechanismTerminal &
	Readonly<{
		sources: readonly DialFileIdentity[];
		recipe: SkyMechanismTerminalRecipe &
			Readonly<{
				parameters: SkyMechanismTerminalParameters &
					Readonly<{
						resourceExtensionSchemaId: string;
						allocationAmendmentSchemaId?: string;
						extensionId: string;
						allocatedBytes: number;
						admission: SkyContinuationAdmission;
					}>;
			}>;
		result: Readonly<{
			extensionRegistered: boolean;
			failure: string | null;
			gpuJobsExecuted: number;
			jobElapsedMilliseconds: number;
		}>;
	}>;
