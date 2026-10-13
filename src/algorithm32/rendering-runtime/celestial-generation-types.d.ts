/**
 * Reason that the installed celestial screen products cannot be consumed.
 *
 * - **"initial"** - No completed generation exists.
 * - **"view"** - Camera, projection, or viewport compatibility changed.
 * - **"configuration"** - The fixed source or observation configuration was replaced.
 * - **"context-restoration"** - Renderer context restoration requires normal regeneration.
 */
type CelestialGenerationDirtyReason = 'initial' | 'view' | 'configuration' | 'context-restoration';

/**
 * Primitive topology used by one standard celestial generation stage.
 *
 * - **"points"** - One point vertex is submitted per canonical stellar member.
 * - **"fullscreen-triangles"** - A fixed fullscreen surface addresses an output domain.
 */
type CelestialGenerationTopology = 'points' | 'fullscreen-triangles';

/**
 * Render-target format used by the accepted celestial generation stages.
 *
 * - **"R16UI"** - Unsigned 16-bit stellar screen indices.
 * - **"R32F"** - Binary32 scalar spectral or coverage storage.
 * - **"DEPTH_COMPONENT24"** - Transient deterministic point-order depth.
 */
type CelestialGenerationTargetFormat = 'R16UI' | 'R32F' | 'DEPTH_COMPONENT24';

/**
 * Depth policy selected by one standard celestial generation stage.
 *
 * - **"disabled"** - The stage performs no depth comparison or write.
 * - **"lowest-canonical-member"** - Deterministic ordering retains the lowest colliding canonical member.
 */
type CelestialGenerationDepthPolicy = 'disabled' | 'lowest-canonical-member';

/**
 * Completion boundary for one generation stage.
 *
 * - **"stage"** - Completion only makes downstream generation stages eligible.
 * - **"publication"** - Completion makes the complete transaction eligible for atomic publication.
 */
type CelestialGenerationCompletionBoundary = 'stage' | 'publication';

/**
 * Logical dimensions selected for a celestial generation output.
 *
 * - **"viewport"** - Current screen width and height.
 * - **"viewport-depth-order"** - Transient depth/order storage matching the viewport.
 * - **"stellar-entry-by-native-channel"** - Sparse entry capacity by 15 native channels.
 */
type CelestialGenerationOutputShape =
	| 'viewport'
	| 'viewport-depth-order'
	| 'stellar-entry-by-native-channel'
	| 'stellar-entry-by-native-channel-plus-visual-magnitude'
	| 'source-local-continuous-coverage';

/** Owner of one standard celestial generation-stage binding. */
type CelestialGenerationBindingOwner = 'geometry' | 'stellarSource' | 'renderingRuntime';

/** One runtime binding consumed by a standard celestial generation stage. */
type CelestialGenerationBindingRequirement = Readonly<{
	/** Stable binding identifier. */
	readonly id: string;
	/** Capability that owns the binding value. */
	readonly owner: CelestialGenerationBindingOwner;
	/** Shader binding kind. */
	readonly kind: ShaderBindingKind;
	/** Accepted update cadence. */
	readonly updateFrequency: ShaderUpdateFrequency;
	/** Provider-neutral runtime value key. */
	readonly valueKey: string;
	/** Whether stage installation fails when the value is absent. */
	readonly required: boolean;
}>;

/** Description of one output written by a standard celestial generation stage. */
type CelestialGenerationStageOutput = Readonly<{
	/** Stable output identifier referenced by later stage dependencies. */
	readonly id: string;
	/** Exact GPU storage format. */
	readonly format: CelestialGenerationTargetFormat;
	/** Whether the output survives stage completion and can enter the active publication. */
	readonly persistence: 'transient' | 'published';
	/** Logical output dimensions resolved by rendering runtime. */
	readonly shape: CelestialGenerationOutputShape;
	/** Exact scalar clear value applied before execution. */
	readonly clearValue: number;
}>;

/** Declarative standard-pipeline shader stage installed ahead of celestial consumption. */
type CelestialGenerationStageDescription = Readonly<{
	/** Stable stage identifier. */
	readonly id: string;
	/** Strict standard-pipeline order; lower values execute first. */
	readonly order: number;
	/** Exact vertex count submitted by the stage. */
	readonly vertexCount: number;
	/** Primitive topology submitted by the stage. */
	readonly topology: CelestialGenerationTopology;
	/** Complete vertex shader source. */
	readonly vertexShaderSource: string;
	/** Complete fragment shader source. */
	readonly fragmentShaderSource: string;
	/** Depth/order behavior required for deterministic output. */
	readonly depthPolicy: CelestialGenerationDepthPolicy;
	/** Stage output descriptions, including transient work targets. */
	readonly outputs: readonly CelestialGenerationStageOutput[];
	/** Output identifiers that must be completed before this stage executes. */
	readonly dependencies: readonly string[];
	/** Runtime bindings required before this stage can execute. */
	readonly bindingRequirements: readonly CelestialGenerationBindingRequirement[];
	/** Stable hash of both complete shader sources and executable stage policy. */
	readonly sourceHash: string;
	/** Boundary reached when this stage completes. */
	readonly completionBoundary: CelestialGenerationCompletionBoundary;
}>;

/** Exact compatibility identity for one stellar screen-palette generation. */
type StellarScreenPaletteCompatibilityIdentity = Readonly<{
	/** Canonical identity of the ordered source member table and numerical policies. */
	readonly sourceIdentity: string;
	/** Canonical identity of the fixed clock/location snapshot and epoch transform. */
	readonly observationIdentity: string;
	/** Exact camera, projection, and viewport identity. */
	readonly viewIdentity: string;
	/** Color, filter configuration/weights, and receiver-light compatibility when runtime-integrated. */
	readonly presentationIdentity?: string;
}>;

/** Complete identity derived before one stellar generation can execute or be consumed. */
type StellarScreenPaletteResolvedIdentity = Readonly<{
	/** Canonical identity of the complete source/observation/view compatibility tuple. */
	readonly generationIdentity: string;
	/** Independently addressable compatibility dimensions used by dirty checks. */
	readonly compatibility: StellarScreenPaletteCompatibilityIdentity;
	/** Capacity, format, and numerical-policy identity bound into source compatibility. */
	readonly policyIdentity: string;
}>;

/** Sparse member-addressed layout selected for the production stellar outputs. */
type StellarScreenPaletteLayout = Readonly<{
	/** Exact-zero matrix and palette index. */
	readonly zeroIndex: 0;
	/** Candidate-slot rule assigning canonical member `n` to slot `n + 1`. */
	readonly candidateSlotPolicy: 'canonical-member-index-plus-one';
	/** Collision representative chosen for each occupied screen pixel. */
	readonly collisionRepresentative: 'lowest-canonical-member';
	/** Spectral collision summation order. */
	readonly accumulationOrder: 'canonical-member-order';
	/** Number of ordered source members. */
	readonly memberCount: number;
	/** Reserved zero plus one candidate slot per member. */
	readonly entryCapacity: number;
	/** Unsigned integer matrix format selected before generation. */
	readonly indexFormat: 'R16UI';
	/** Entry-major scalar palette format. */
	readonly paletteFormat: 'R32F';
	/** Native spectral channel count stored for every entry. */
	readonly channelCount: 15;
	/** Native channels plus the presentation metadata row. */
	readonly rowCount: 16;
	/** Collision-combined apparent visual magnitude row. */
	readonly visualMagnitudeRow: 15;
}>;

/** Named numerical rules executed by the base stellar generation shaders. */
type StellarScreenPaletteNumericalPolicy = Readonly<{
	/** Geometry-owned catalog-epoch through fixed-observation projection. */
	readonly projection: 'geometry-owned-iau-2000-usno-mean-fixed-observation-v1';
	/** Exact top-left-origin half-open viewport assignment. */
	readonly viewport: 'top-left-row-major-half-open-v1';
	/** One unit-weight screen pixel assigned to each eligible point member. */
	readonly pointResponse: 'unit-weight-one-pixel-v1';
	/** Camera-independent catalog-irradiance to one-pixel boundary presentation. */
	readonly presentation: 'stellar-one-pixel-presentation-cr6c-q24-v1';
	/** Canonical collision representative selection. */
	readonly collisionRepresentative: 'lowest-canonical-member';
	/** Deterministic spectral collision summation order. */
	readonly accumulationOrder: 'canonical-member-order';
	/** Entry-major native-15 scalar conversion and storage. */
	readonly packing: 'binary32-r32f-entry-major-v1';
}>;

/** Stellar stage description carrying its validated sparse and numerical policy. */
type StellarScreenPaletteGenerationStageDescription = CelestialGenerationStageDescription &
	Readonly<{
		/** Canonical identity of the complete accepted generation policy. */
		readonly policyIdentity: string;
		/** Sparse output layout accepted before shader construction. */
		readonly stellarLayout: StellarScreenPaletteLayout;
		/** Named numerical rules executed by the stage pair. */
		readonly numericalPolicy: StellarScreenPaletteNumericalPolicy;
	}>;

/** Exact scalar layout of the immutable stellar generation source table. */
type StellarGenerationSourceTableLayout = Readonly<{
	/** Versioned table schema. */
	readonly schema: 'stellar-generation-source-table-v2';
	/** Scalar GPU storage format selected for upload. */
	readonly storageFormat: 'RGBA32F+R32F';
	/** Canonical member ordering policy. */
	readonly memberOrder: 'canonical-selection-order';
	/** Exact reviewed source-member count. */
	readonly memberCount: 500 | 2000;
	/** Direction plus visual-magnitude scalars in each RGBA member texel. */
	readonly memberComponentCount: 4;
	/** Catalog-direction scalar count. */
	readonly directionComponentCount: 3;
	/** Native spectral channel count. */
	readonly spectralChannelCount: 15;
}>;

/** Immutable CPU-authored stellar table uploaded as read-only shader input. */
interface StellarGenerationSourceTable {
	/** Stable identity of the binary32 table, metadata, and canonical order. */
	readonly identity: string;
	/** Identity of the complete normalized stellar source definition. */
	readonly sourceIdentity: string;
	/** FK5/J2000 mean-equatorial catalog frame. */
	readonly frame: StellarCatalogFrame;
	/** Epoch at which every catalog direction is defined. */
	readonly epoch: CelestialEpoch;
	/** Stable member identifiers in canonical row order. */
	readonly memberIds: readonly string[];
	/** Exact member-major scalar layout. */
	readonly layout: StellarGenerationSourceTableLayout;
	/**
	 * Copy the packed member-major binary32 direction and irradiance scalars for upload.
	 *
	 * @returns - An independent array containing exactly 18 scalars per canonical member.
	 */
	copyMemberValues(): Float32Array;
	/** Copy the channel-major R32F Native15 source payload. */
	copySpectralValues(): Float32Array;
}

/** Trusted construction data for the immutable stellar generation source table. */
type StellarGenerationSourceTableConfiguration = Readonly<{
	/** Accepted static stellar definition in canonical member order. */
	readonly definition: StellarPointSetSourceDefinition;
	/** Canonical identity of the complete accepted source definition. */
	readonly sourceIdentity: string;
}>;

/** Geometry-owned GLSL and bindings shared by stellar index and palette stages. */
type StellarGenerationGeometryShaderContribution = Readonly<{
	/** Stable identity of the transform, observation, scene frame, and projection policy. */
	readonly identity: string;
	/** Uniform declarations consumed by the geometry operations. */
	readonly uniforms: readonly ShaderUniformDeclaration[];
	/** Required fixed-observation and frame-view runtime bindings. */
	readonly bindingRequirements: readonly CelestialGenerationBindingRequirement[];
	/** GLSL declarations and functions used by both stellar stages. */
	readonly source: string;
}>;

/** Accepted request for one standard-pipeline stellar screen generation. */
type StellarScreenPaletteGenerationRequest = Readonly<{
	/** Immutable ordered source table. */
	readonly source: StellarGenerationSourceTable;
	/** Fixed clock/location snapshot for this installed configuration. */
	readonly observation: GeometryObservation;
	/** Geometry-owned epoch-relative transform identity. */
	readonly epochTransform: StellarEpochRelativeTransformIdentity;
	/** Current renderer-neutral camera and viewport snapshot. */
	readonly view: CelestialRenderViewSnapshot;
	/** Exact sparse output layout selected before execution. */
	readonly layout: StellarScreenPaletteLayout;
	/** Fully derived identity against which execution, completion, and consumption are checked. */
	readonly identity: StellarScreenPaletteResolvedIdentity;
	/** Optional cancellation of this staging generation. */
	readonly signal?: AbortSignal;
}>;

/** Opaque renderer-owned texture produced by celestial generation. */
interface CelestialGenerationOutputResource {
	/** Stable resource identity. */
	readonly id: string;
	/** Exact allocated target format. */
	readonly format: CelestialGenerationTargetFormat;
	/** Allocated width in pixels or logical entries. */
	readonly width: number;
	/** Allocated height in pixels or spectral channels. */
	readonly height: number;
}

/** Opaque transient work retained only while a generation is staging. */
interface CelestialGenerationTransientResource {
	/** Stable transient identity. */
	readonly id: string;
	/** Stage that exclusively owns disposal of the transient. */
	readonly ownerStageId: string;
}

/** Completed sparse stellar output pair that may be sampled by the O(1) consumer. */
type StellarScreenPaletteGeneration = Readonly<{
	/** Stable generation identity. */
	readonly id: string;
	/** Exact compatibility identity completed by this generation. */
	readonly compatibility: StellarScreenPaletteCompatibilityIdentity;
	/** Screen-sized unsigned-integer index output. */
	readonly screenIndex: CelestialGenerationOutputResource;
	/** Entry-major native-15 floating-point palette output. */
	readonly palette: CelestialGenerationOutputResource;
	/** Completed sparse layout. */
	readonly layout: StellarScreenPaletteLayout;
	/** Publication completion marker written only after every required stage finishes. */
	readonly completion: 'complete';
}>;

/** Active/staging publication state for one stellar screen-palette owner. */
type StellarScreenPalettePublicationState = Readonly<{
	/** Last atomically published generation, or null before first completion. */
	readonly active: StellarScreenPaletteGeneration | null;
	/** Incomplete successor invisible to consumers, or null when no generation is running. */
	readonly staging: Readonly<{
		/** Identity reserved for the successor generation. */
		readonly id: string;
		/** Compatibility requested for the successor. */
		readonly compatibility: StellarScreenPaletteCompatibilityIdentity;
		/** Transient resources owned exclusively by the staging transaction. */
		readonly transients: readonly CelestialGenerationTransientResource[];
	}> | null;
	/** Dirty reason that prevents active sampling, or null when active exactly matches the current view. */
	readonly dirtyReason: CelestialGenerationDirtyReason | null;
}>;

/**
 * Terminal outcome assigned exactly once to every celestial generation transaction.
 *
 * - **"committed"** - The complete staging publication replaced the prior active publication atomically.
 * - **"aborted"** - Staging was discarded while the prior active publication remained unchanged.
 * - **"disposed"** - Ownership ended without publication and every owned handle was released once.
 */
type CelestialGenerationTerminalOutcome = 'committed' | 'aborted' | 'disposed';

/**
 * Reason one complete celestial publication transaction was staged.
 *
 * - **"initial"** - First generation for an installed pipeline.
 * - **"view-refresh"** - Camera, projection, or viewport compatibility changed.
 * - **"configuration-replacement"** - A static source or clock/location configuration is replacing its predecessor.
 * - **"context-restoration"** - Normal generation is recreating renderer resources after context restoration.
 */
type CelestialGenerationTransactionKind =
	'initial' | 'view-refresh' | 'configuration-replacement' | 'context-restoration';

/** Complete request staged by the standard celestial generation participant. */
type CelestialGenerationRequest = Readonly<{
	/** Stable transaction identity. */
	readonly transactionId: string;
	/** Lifecycle reason for staging this successor. */
	readonly kind: CelestialGenerationTransactionKind;
	/** Stellar generation request for the same fixed observation and current view. */
	readonly stellar: StellarScreenPaletteGenerationRequest | null;
	/** Source-local distant or finite Sun tile request for the same current view. */
	readonly sun: DistantSunTileGenerationRequest | FlatFiniteSunTileGenerationRequest;
}>;

/** Completion record used to atomically publish one entire celestial generation. */
type CelestialGenerationCompletion = Readonly<{
	/** Identity of the completed transaction. */
	readonly transactionId: string;
	/** Completed stellar output pair. */
	readonly stellar: StellarScreenPaletteGeneration | null;
	/** Completed source-local Sun tile. */
	readonly sun: CelestialSunTileGeneration;
	/** Marker proving every declared publication-boundary stage completed. */
	readonly status: 'complete';
}>;

/** Active/staging state for one complete stellar-plus-Sun publication transaction. */
type CelestialGenerationPublicationState = Readonly<{
	/** Last complete atomic publication, or null before initial generation. */
	readonly active: CelestialGenerationCompletion | null;
	/** Incomplete transaction invisible to consumers, or null when idle. */
	readonly staging: Readonly<{
		/** Stable staging transaction identity. */
		readonly transactionId: string;
		/** Lifecycle reason for the successor. */
		readonly kind: CelestialGenerationTransactionKind;
		/** Transient handles that receive exactly one terminal disposal. */
		readonly transients: readonly CelestialGenerationTransientResource[];
	}> | null;
	/** Dirty reason that forces exact-zero celestial output until a compatible publication commits. */
	readonly dirtyReason: CelestialGenerationDirtyReason | null;
}>;

/** Standard render-pipeline participant that owns celestial generation lifecycle. */
interface CelestialGenerationPipelineParticipant {
	/** Ordered generation stages installed before the O(1) celestial consumer. */
	readonly stages: readonly CelestialGenerationStageDescription[];
	/** Current atomic stellar-plus-Sun publication state. */
	readonly publicationState: CelestialGenerationPublicationState;
	/** Mark current output incompatible before a changed view can be consumed. */
	markDirty(reason: CelestialGenerationDirtyReason): void;
	/** Stage a complete successor without changing the active publication. */
	stage(request: CelestialGenerationRequest): Promise<CelestialGenerationCompletion>;
	/** Atomically publish one completely matching celestial successor. */
	commit(completion: CelestialGenerationCompletion): CelestialGenerationTerminalOutcome;
	/** Abort staging while preserving the prior active publication. */
	abort(transactionId: string): CelestialGenerationTerminalOutcome;
	/** Invalidate renderer handles after context loss without changing immutable inputs. */
	handleContextLoss(): void;
	/** Mark normal regeneration required after renderer context restoration. */
	handleContextRestoration(): void;
	/** Release all active and staging resources exactly once. */
	dispose(): void;
}

/** Step-4 standard-pipeline owner for stellar outputs before Sun and consumer integration. */
interface StellarScreenPaletteGenerationPipelineParticipant {
	/** Qualified ordered point-index and sparse-palette stages. */
	readonly stages: readonly StellarScreenPaletteGenerationStageDescription[];
	/** Current atomic active/staging stellar publication state. */
	readonly publicationState: StellarScreenPalettePublicationState;
	/** Return matching active textures or exact-zero/null values while dirty. */
	bindingValues(): Readonly<{
		readonly 'runtime.celestial.stellarScreenIndex': unknown | null;
		readonly 'runtime.celestial.stellarPalette': unknown | null;
	}>;
	/** Return format-compatible active or exact-zero textures for consumer uniforms. */
	consumerBindingValues(): Readonly<{
		readonly 'runtime.celestial.stellarScreenIndex': unknown;
		readonly 'runtime.celestial.stellarPalette': unknown;
	}>;
	/** Mark current output incompatible before a changed frame can consume it. */
	markDirty(reason: CelestialGenerationDirtyReason): void;
	/** Resize view-dependent outputs without rebuilding the shader graph. */
	setSize(width: number, height: number): void;
	/** Invalidate renderer handles after context loss. */
	handleContextLoss(): void;
	/** Require standard regeneration after context restoration. */
	handleContextRestoration(): void;
	/** Return lifecycle and publication diagnostics. */
	getDiagnostics(): unknown;
	/** Release all active, staging, shader, geometry, and input resources exactly once. */
	dispose(): void;
}

/** Installed composer-compatible owner that coordinates stellar and Sun generation. */
interface CelestialScreenPaletteGenerationPipelineParticipant {
	/** Ordered child stages installed ahead of the fixed-cost consumer. */
	readonly stages: readonly CelestialGenerationStageDescription[];
	/** Current joint publication state; Flat/local completions have no stellar child. */
	readonly publicationState: CelestialGenerationPublicationState;
	/** Return active values only when every enabled child has completed. */
	consumerBindingValues(): Readonly<Record<string, unknown>>;
	/** Mark all enabled children incompatible before changed frame data is consumed. */
	markDirty(reason: CelestialGenerationDirtyReason): void;
	/** Resize all view-dependent child outputs. */
	setSize(width: number, height: number): void;
	/** Invalidate renderer handles after context loss. */
	handleContextLoss(): void;
	/** Require regeneration after renderer context restoration. */
	handleContextRestoration(): void;
	/** Return joint lifecycle and publication diagnostics. */
	getDiagnostics(): unknown;
	/** Release all child resources exactly once. */
	dispose(): void;
}

/** Generation participant shape available during incremental production porting. */
type CelestialGenerationRuntimeParticipant =
	| StellarScreenPaletteGenerationPipelineParticipant
	| CelestialGenerationPipelineParticipant
	| CelestialScreenPaletteGenerationPipelineParticipant;

/**
 * Source-local Sun placement kind.
 *
 * - **"distant-direction"** - Angular disk centered on a model-space direction.
 * - **"finite-position"** - Physical disk centered at a finite model-space position.
 */
type CelestialSunTilePlacementKind = 'distant-direction' | 'finite-position';

/** Geometry-resolved placement used by one source-local Sun tile generation. */
type CelestialSunTilePlacement =
	| Readonly<{
			/** Distant directional disk placement. */
			readonly kind: 'distant-direction';
			/** Normalized model-space direction toward the disk center. */
			readonly directionToSun: UnitVector3;
			/** Positive apparent angular radius. */
			readonly angularRadius: Angle;
	  }>
	| Readonly<{
			/** Finite positional disk placement. */
			readonly kind: 'finite-position';
			/** Physical model-space disk center. */
			readonly position: Position;
			/** Positive physical disk radius. */
			readonly radius: Distance;
	  }>;

/** Completed compact Sun tile and its shared native-15 source spectrum. */
type CelestialSunTileGeneration = Readonly<{
	/** Stable generation identity. */
	readonly id: string;
	/** View identity for which tile placement and scale are valid. */
	readonly viewIdentity: string;
	/** Source-local continuous coverage in the closed range from zero to one. */
	readonly coverage: CelestialGenerationOutputResource;
	/** Unchanged top-of-atmosphere native-15 disk radiance. */
	readonly surfaceRadiance: SpectralRadiancePacket;
	/** Occupancy policy under which any positive coverage claims the pixel opaquely. */
	readonly claimPolicy: 'any-positive-coverage-opaque';
	/** Completion marker written only after tile generation finishes. */
	readonly completion: 'complete';
}>;

/** Runtime value key published by the standard celestial generation participant. */
type CelestialGenerationRuntimeValueKey =
	| 'runtime.celestial.stellarScreenIndex'
	| 'runtime.celestial.stellarPalette'
	| 'runtime.celestial.sunCoverageTile'
	| 'runtime.celestial.sunRadiusPixels'
	| 'runtime.celestial.sunSurfaceRadiance';

/** Opaque renderer binding for one completed celestial generation output. */
type CelestialGenerationRuntimeBinding = Readonly<{
	/** Stable binding identity. */
	readonly id: string;
	/** Standard runtime value consumed by the O(1) celestial compositor. */
	readonly valueKey: CelestialGenerationRuntimeValueKey;
	/** Completed renderer-owned output resource. */
	readonly resource: CelestialGenerationOutputResource;
	/** Generation identity that must match the consumer's completion identity. */
	readonly generationId: string;
}>;
