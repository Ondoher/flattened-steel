/** Explicit bounded refinement batches on the original morning view. */
type SkySecondOrderRefinementStage = 'gauss4' | 'simpson4' | 'gauss8-low' | 'gauss8-high' | 'simpson8';

/** Exact admission of the coordinate amendment; the old numerical core stays distinct. */
type SkySecondOrderIncidentAdmission = Readonly<{
	/** Versioned amendment contract. */ schemaId: string;
	/** Original C0 owner. */ continuationRegistration: string;
	/** Accepted eight-witness source. */ witnessRun: string;
	/** Pinned accepted witness seal. */ witnessSeal: DialFileIdentity;
	/** Pinned eighty-predicate reference. */ witnessReference: DialFileIdentity;
	/** Exact prospective amendment bytes. */ plan: DialFileIdentity;
	/** Current three numerical files plus actual fallback wrapper identity. */ sources: readonly DialFileIdentity[];
	/** Three unchanged numerical files tested by the witness. */ witnessNumericalSources: readonly DialFileIdentity[];
}>;

/** Exact witness fields consumed by the admission reader. */
type SkySecondOrderIncidentWitnessDefinition = Readonly<{
	/** Original recipe. */ recipe: Readonly<{
		/** Original inputs and complete source inventory. */ parameters: Readonly<{
			/** C0 source. */ continuationRegistration: string;
			/** Original snapshot identities. */ sourceIdentities: readonly DialFileIdentity[];
		}>;
	}>;
}>;

/** Witness reference fields required for admission, without reinterpreting outcomes. */
type SkySecondOrderIncidentWitnessReference = Readonly<{
	/** Original witness schema. */ schemaId: string;
	/** All eighty prospectively registered results. */ checks: readonly SkySecondOrderCheck[];
}>;

/** Authenticated amendment and raw prospective bytes retained before compute. */
type SkySecondOrderIncidentRead = Readonly<{
	/** Exact reusable contract. */ admission: SkySecondOrderIncidentAdmission;
	/** Original plan bytes. */ planBytes: Uint8Array;
	/** Complete consumed immutable inputs and current implementations. */ identities: readonly DialFileIdentity[];
}>;

/** Known completed fresh work; unavailable in-flight method counts are never zeroed. */
type SkySecondOrderIncidentWork = {
	/** Original complete worker rows available for accounting. */ returnedRows: number;
	/** Original worker duration sum only. */ workerMilliseconds: number;
	/** Both original worker methods. */ originalMediumEvaluations: number;
	/** Both original worker methods. */ originalOuterEvaluations: number;
	/** Every completed additional Simpson method. */ mainThreadMediumEvaluations: number;
	/** Every completed additional Simpson method. */ mainThreadOuterEvaluations: number;
};

/** Preserved alternate-coordinate attempts for one unique physical point. */
type SkySecondOrderIncidentBatch = {
	/** Versioned batch identity. */ schemaId: string;
	/** Original computed node, before any interval aliasing. */ node: SkySecondOrderViewNode;
	/** Exact admitted sources and plan. */ admission: SkySecondOrderIncidentAdmission;
	/** Original work captured before calling the alternate evaluator. */ originalWork: SkySecondOrderIncidentWork;
	/** Every completed attempt, including rejected candidates. */ records: SkyIncidentFallbackRecord[];
	/** Every interrupted method with explicitly unavailable counts. */ interruptions: SkyIncidentFallbackInterruption[];
	/** Omitted-method work relative to returned methods; distinct from actual parent-thread work. */ extraWork: SkyIncidentFallbackWork;
	/** Actual parent-thread helper wall duration. */ mainThreadMilliseconds: number;
	/** All requested rows returned from postprocessing. */ complete: boolean;
	/** Closed compressed evidence identity; null inside its own encoded payload. */ artifact: DialFileIdentity | null;
};

/** Exact immutable origin of a point's alternate-coordinate work. */
type SkySecondOrderIncidentUse = Readonly<{
	/** Source identities and witness/plan admission. */ admission: SkySecondOrderIncidentAdmission;
	/** Immutable complete attempts artifact. */ artifact: DialFileIdentity;
	/** Original unique computed point before aliases. */ computedNodeId: string;
	/** All attempted task ids in original caller order. */ attemptIds: readonly string[];
	/** Tasks actually replaced by independently admitted candidates. */ replacedIds: readonly string[];
}>;

/** Small common point surface supporting old evidence with no added metadata. */
type SkySecondOrderIncidentPoint = Readonly<{
	/** Original or aliased physical node. */ node: SkySecondOrderViewNode;
	/** Present only when alternate-coordinate attempts occurred. */ incidentCoordinate?: SkySecondOrderIncidentUse;
}>;

/** Backward-compatible original point with honest optional coordinate provenance. */
type SkySecondOrderFallbackPoint = SkySecondOrderPoint & SkySecondOrderIncidentPoint;

/** Parent runner owns all artifact destinations and resource accounting. */
type SkySecondOrderIncidentWriter = (name: string, value: Uint8Array, derivation: DialDerivation) => DialFileIdentity;
/** Remaining retained capacity, excluding the runner's terminal reserve. */
type SkySecondOrderIncidentCapacity = () => number;
/** Runner guard, invoked outside nonthrowing observer callbacks. */
type SkySecondOrderIncidentGuard = () => void;

/** Completed postprocessing result and exact known new work. */
type SkySecondOrderIncidentRows = Readonly<{
	/** Ordered unchanged or admitted replacement values. */ rows: readonly SkyVolumeWorkerRow[];
	/** Original plus every completed additional method. */ mediumEvaluations: number;
	/** Original plus every completed additional method. */ outerEvaluations: number;
	/** Original worker times, excluding parent-thread work. */ workerMilliseconds: number;
	/** Present only if attempts were retained. */ incidentCoordinate?: SkySecondOrderIncidentUse;
}>;

/** Mutable current-run collector; caller retains its summary even after a thrown guard. */
type SkySecondOrderIncidentCollector = Readonly<{
	/** All batches, including one interrupted batch. */ batches: readonly SkySecondOrderIncidentBatch[];
	/** At most eight original unresolved full witnesses. */ originalWitnesses: readonly SkyVolumeResult[];
	/** Completed original and additional method counts. */ work: SkySecondOrderIncidentWork;
	/** Actual parent-thread helper elapsed time. */ mainThreadMilliseconds: number;
	/** Apply only the admitted fallback after a complete original pool batch. */
	evaluate: (
		node: SkySecondOrderViewNode,
		originalRows: readonly SkyVolumeWorkerRow[],
		guard: SkySecondOrderIncidentGuard,
	) => SkySecondOrderIncidentRows;
}>;

/** Named explicit selector applied to historical inventories without rewriting them. */
type SkySecondOrderNumericalReuseFilter = Readonly<{
	/** Stable comparison contract identity. */ version: string;
	/** Included experiment-relative numerical directories. */ directories: readonly string[];
	/** Included exact experiment-relative numerical entries. */ files: readonly string[];
	/** Included executable JavaScript extensions. */ extensions: readonly string[];
	/** Human-readable exact exclusion rule. */ excludedBasenames: string;
}>;

/** Complete controls that must agree before any physical point can be reused. */
type SkySecondOrderReusePolicy = Readonly<{
	/** Exact spectral order. */ channels: readonly number[];
	/** Unchanged first-order physical profile. */ physicalProfile: SkyPhysicalReferenceProfile;
	/** Unchanged physical outer error allocation. */ outerStrategy: SkyPhysicalOuterStrategy;
	/** Exact ordered angular placements, whose implementations are source-authenticated. */ angularRules: readonly SkySecondOrderAngularRule[];
}>;

/** Exact provenance for an admitted reusable numerical point. */
type SkySecondOrderReuseEntry = Readonly<{
	/** Original point, with numerical values and historical work intact. */ point: SkySecondOrderFallbackPoint;
	/** Source execution's authenticated physical controls. */ policy: SkySecondOrderReusePolicy;
	/** Immutable source run, or null for a freshly computed point in this run. */ parentRun: string | null;
	/** Authenticated original view artifact, or null for current-run computations. */ artifact: DialFileIdentity | null;
}>;

/** One explicit alias operation; outer metadata never replaces numerical evidence. */
type SkySecondOrderAliasDerivation = Readonly<{
	/** Target interval term in the new frozen outer rule. */ targetNodeId: string;
	/** SHA-256 of the exact physical/control key. */ physicalKeySha256: string;
	/** Parent artifact reuse or a current-run computed geometry. */ sourceKind: 'parent' | 'current';
	/** Immutable parent run, or null for current computation. */ parentRun: string | null;
	/** Original authenticated artifact identity, or null for current computation. */ parentArtifact: DialFileIdentity | null;
	/** Original source node identity, retaining shared geometry ancestry. */ originalNodeId: string;
	/** Current unique computed node identity, or null for an immutable parent. */ currentComputedNodeId: string | null;
	/** Exact copying operation and intentional metadata changes. */ operation: string;
}>;

/** Available contributions attached to a complete frozen rule; missing terms stay absent. */
type SkySecondOrderAttachedPoints = Readonly<{
	/** Admitted numerical values with each target's own outer metadata. */ points: SkySecondOrderFallbackPoint[];
	/** One derivation for each retained term. */ derivations: SkySecondOrderAliasDerivation[];
}>;

/** Original definition fields required for authenticated physical reuse. */
type SkySecondOrderReuseDefinition = Readonly<{
	/** Original immutable operation recipe. */ recipe: Readonly<{
		/** Physical controls and original source inventory, without reinterpretation. */ parameters: SkySecondOrderReusePolicy &
			Readonly<{
				/** Original C0 identity. */ continuationRegistration: string;
				/** Exact original numerical inventory; old records may contain nonnumerical entries. */ numericalSources: readonly DialFileIdentity[];
			}>;
	}>;
}>;

/** Explicit evidence that the declared reusable numerical core matches a parent. */
type SkySecondOrderReuseSourceCheck = Readonly<{
	/** Parent definition supplying the immutable original inventory. */ parentDefinition: DialFileIdentity;
	/** Original inventory size, preserved rather than relabeled. */ originalInventoryCount: number;
	/** Number of actual selected numerical implementations checked. */ checkedCount: number;
	/** Only emitted after exact identity equality and current-byte authentication. */ unchanged: true;
}>;

/** Authenticated admitted parent, with complete point validation and source compatibility. */
type SkySecondOrderRefinementParent = Readonly<{
	/** Exact consumed seal, view and definition identities. */ identities: readonly DialFileIdentity[];
	/** Validated physical-point entries, without mutation of the source record. */ entries: readonly SkySecondOrderReuseEntry[];
	/** Immutable-to-current numerical compatibility evidence. */ sourceCheck: SkySecondOrderReuseSourceCheck;
}>;

/** Fixed outer rule and explicit selected physical intervals for one bounded batch. */
type SkySecondOrderRefinementSelection = Readonly<{
	/** Complete outer rule, including intervals not selected in this batch. */ rule: SkySecondOrderOuterRule;
	/** Selected physical interval indices. */ intervals: readonly number[];
	/** All requested terms, including shared physical endpoints. */ selected: readonly SkySecondOrderViewNode[];
}>;

/** Complete bounded refinement record compatible with the existing view reader. */
type SkySecondOrderRefinementDocument = Omit<SkySecondOrderDocument, 'points'> &
	Readonly<{
		/** Optional coordinate provenance survives exact physical aliases. */ points: readonly SkySecondOrderFallbackPoint[];
		/** Complete original outer rule and endpoint convention. */ outerRule: SkySecondOrderOuterRule;
		/** Selected stage identity. */ stage: SkySecondOrderRefinementStage;
		/** Complete admitted intervals and explicit null values for missing terms. */ integrals: readonly SkySecondOrderIntegral[];
		/** Actual physical admission checks, separate from held outcome predictions. */ checks: readonly SkySecondOrderCheck[];
		/** Every parent/current alias, retaining each target's own integration weight. */ derivations: readonly SkySecondOrderAliasDerivation[];
		/** True only if all nodes of the full outer rule are available. */ fullViewComplete: boolean;
	}>;

/** Focused manufactured reuse and missing-evidence proof, without physical evaluation. */
type SkySecondOrderRefinementProof = Readonly<{
	/** Versioned local proof identity. */ schemaId: string;
	/** Actual executed assertions. */ checks: number;
}>;
