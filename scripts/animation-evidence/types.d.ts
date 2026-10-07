/** A measured animation callback supplied to fixed-cadence replay. */
type AnimationEvidenceSourceFrame = Readonly<Record<string, unknown>>;

/** One deterministic output slot mapped to a measured source frame. */
type AnimationEvidenceReplayEntry = Readonly<{
	readonly slotIndex: number;
	readonly timestampMicroseconds: number;
	readonly mappingKind: string;
	readonly mappingEquationId: string;
	readonly sourceFrameId: string | number;
	readonly sourceAnimationCallbackMicroseconds: number;
	readonly heldFromPreviousSlot: boolean;
	readonly measuredFrameAdvance: number | null;
	readonly state: unknown;
}>;

/** Configuration for latest-frame-at-or-before fixed-cadence mapping. */
type AnimationEvidenceReplayConfiguration = Readonly<{
	readonly sourceFrames: readonly AnimationEvidenceSourceFrame[];
	readonly outputFrameCount: number;
	readonly outputFramesPerSecond: number;
	readonly getSourceTimestampMicroseconds: (frame: AnimationEvidenceSourceFrame) => number;
	readonly getSourceFrameId: (frame: AnimationEvidenceSourceFrame) => string | number;
	readonly projectState: (frame: AnimationEvidenceSourceFrame) => unknown;
	readonly mappingKind?: string;
	readonly mappingEquationId?: string;
}>;

/** Summary of one fixed-cadence replay mapping. */
type AnimationEvidenceReplaySummary = Readonly<{
	readonly slotCount: number;
	readonly uniqueSourceFrameCount: number;
	readonly unusedMeasuredFrameCount: number;
	readonly heldSlotCount: number;
	readonly sourceAdvanceCount: number;
	readonly maximumMeasuredFrameAdvance: number | null;
	readonly maximumConsecutiveSourceSlots: number;
	readonly longestMappedVisibleHoldMicroseconds: number;
	readonly firstSourceFrameId: string | number;
	readonly lastSourceFrameId: string | number;
	readonly lastSourceAnimationCallbackMicroseconds: number;
}>;

/** Caller-owned scheduling and rendering hooks for a measured animation trace. */
type AnimationEvidenceTraceConfiguration = Readonly<{
	readonly durationMicroseconds: number;
	readonly requestFrame: (callback: (timestampMilliseconds: number) => void) => unknown;
	readonly cancelFrame?: (handle: unknown) => void;
	readonly nowMilliseconds: () => number;
	readonly stateAt: (elapsedMicroseconds: number, durationMicroseconds: number) => unknown;
	readonly render: (state: unknown, frameId: number) => unknown | Promise<unknown>;
	readonly afterFrame?: (frame: AnimationEvidenceTraceFrame) => void | Promise<void>;
}>;

/** One generic measured animation callback and caller-owned render result. */
type AnimationEvidenceTraceFrame = {
	frameId: number;
	requestIssuedMicroseconds: number;
	animationCallbackMicroseconds: number;
	state: unknown;
	renderResult: unknown;
	associatedSamples?: readonly unknown[];
};

/** Generic cadence summary derived from a measured trace. */
type AnimationEvidenceCadenceSummary = Readonly<{
	readonly frameCount: number;
	readonly expectedPresentationSlotCount: number;
	readonly traceElapsedMicroseconds: number;
	readonly meanFramesPerSecond: number | null;
	readonly missedPresentationSlots: number;
	readonly longestVisibleHoldMicroseconds: number;
	readonly callbackCadence: Readonly<{
		readonly meanIntervalMicroseconds: number;
		readonly medianIntervalMicroseconds: number;
		readonly p95IntervalMicroseconds: number;
		readonly p99IntervalMicroseconds: number;
	}>;
}>;

/** Asynchronous consumer for one bounded encoded-byte batch. */
type AnimationEvidenceBatchPublisher = (bytes: Uint8Array, batchIndex: number) => void | Promise<void>;

/** Configuration for a bounded encoded-chunk sink. */
type AnimationEvidenceChunkSinkConfiguration = Readonly<{
	readonly maximumBatchBytes: number;
	readonly publishBatch: AnimationEvidenceBatchPublisher;
	readonly finalize: () => void | Promise<void>;
}>;

/** Diagnostics from the bounded encoded-chunk sink. */
type AnimationEvidenceChunkSinkDiagnostics = Readonly<{
	readonly batchCount: number;
	readonly totalByteLength: number;
	readonly maximumBufferedBytes: number;
	readonly finalized: boolean;
}>;

/** Minimal video-output adapter consumed by deterministic canvas replay. */
type AnimationEvidenceVideoOutput = Readonly<{
	readonly start: () => void | Promise<void>;
	readonly addFrame: (
		canvas: CanvasImageSource,
		timestampSeconds: number,
		durationSeconds: number,
		options: Readonly<{keyFrame: boolean}>,
	) => void | Promise<void>;
	readonly finalize: () => void | Promise<void>;
	readonly getResult: () => unknown | Promise<unknown>;
	/** Release owned output resources on failure; optional for legacy stateless adapters. */
	readonly abort?: (reason: unknown) => void | Promise<void>;
}>;

/** Configuration for deterministic canvas replay and recording. */
type AnimationEvidenceRecorderConfiguration = Readonly<{
	readonly mapping: readonly AnimationEvidenceReplayEntry[];
	readonly framesPerSecond: number;
	readonly presentationCanvas: CanvasImageSource;
	readonly videoOutput: AnimationEvidenceVideoOutput;
	readonly render: (
		entry: AnimationEvidenceReplayEntry,
		presentationCanvas: CanvasImageSource,
	) => unknown | Promise<unknown>;
	readonly shouldRender?: (entry: AnimationEvidenceReplayEntry) => boolean;
	readonly keyFrame?: (entry: AnimationEvidenceReplayEntry) => boolean;
	readonly capture?: (
		entry: AnimationEvidenceReplayEntry,
		presentationCanvas: CanvasImageSource,
	) => unknown | Promise<unknown>;
	readonly captureSlots?: ReadonlySet<number>;
	readonly reportProgress?: (completed: number, total: number) => void | Promise<void>;
	readonly progressIntervalFrames?: number;
}>;

/** Result of deterministic canvas replay and recording. */
type AnimationEvidenceRecorderResult = Readonly<{
	readonly frameCount: number;
	readonly renderedSourceStateCount: number;
	readonly heldOutputSlotCount: number;
	readonly captures: readonly Readonly<{readonly slotIndex: number; readonly result: unknown}>[];
	readonly output: unknown;
}>;

/** Candidate codec configuration and stable caller-owned identity. */
type AnimationEvidenceEncoderCandidate = Readonly<{
	readonly id: string;
	readonly config: VideoEncoderConfig;
}>;

/** Result from probing one WebCodecs encoder candidate. */
type AnimationEvidenceEncoderProbe = Readonly<Record<string, unknown>>;

/** Minimal caller-injected Mediabunny surface required by the MP4 adapter. */
type AnimationEvidenceMediabunnyModule = Readonly<{
	readonly AppendOnlyStreamTarget: new (writable: WritableStream<Uint8Array>) => unknown;
	readonly Mp4OutputFormat: new (configuration: Readonly<Record<string, unknown>>) => unknown;
	readonly Quality: new (configuration: Readonly<Record<string, unknown>>) => unknown;
	readonly Output: new (configuration: Readonly<Record<string, unknown>>) => AnimationEvidenceMediabunnyOutput;
	readonly CanvasSource: new (
		canvas: CanvasImageSource,
		configuration: AnimationEvidenceMediabunnyCanvasSourceConfiguration,
	) => AnimationEvidenceMediabunnyCanvasSource;
}>;

/** Minimal Mediabunny output instance required by the MP4 adapter. */
type AnimationEvidenceMediabunnyOutput = {
	addVideoTrack(
		source: AnimationEvidenceMediabunnyCanvasSource,
		configuration: Readonly<Record<string, unknown>>,
	): void;
	setMetadataTags(tags: Readonly<Record<string, string>>): void;
	start(): Promise<void>;
	finalize(): Promise<void>;
	/** Cancel incomplete output and release its encoders and writable target. */
	cancel(): Promise<void>;
	getMimeType(): Promise<string>;
};

/** Minimal Mediabunny canvas source instance required by the MP4 adapter. */
type AnimationEvidenceMediabunnyCanvasSource = {
	add(timestampSeconds: number, durationSeconds: number, options: Readonly<{keyFrame: boolean}>): Promise<void>;
};

/** Caller and evidence callbacks passed to the Mediabunny canvas source. */
type AnimationEvidenceMediabunnyCanvasSourceConfiguration = Readonly<Record<string, unknown>> &
	Readonly<{
		onEncoderConfig: (configuration: Readonly<Record<string, unknown>>) => void;
		onEncodedPacket: (
			packet: Readonly<{
				type: string;
				microsecondTimestamp: number;
				microsecondDuration: number;
				sequenceNumber: number;
				byteLength: number;
			}>,
		) => void;
	}>;

/** Configuration for the caller-injected Mediabunny MP4 adapter. */
type AnimationEvidenceMediabunnyOutputConfiguration = Readonly<{
	readonly mediabunny: AnimationEvidenceMediabunnyModule;
	readonly canvas: CanvasImageSource;
	readonly writable: WritableStream<Uint8Array>;
	readonly framesPerSecond: number;
	readonly codec: string;
	readonly fullCodecString: string;
	readonly bitrate: number;
	readonly bitrateMode?: string;
	readonly latencyMode?: string;
	readonly hardwareAcceleration?: string;
	readonly keyFrameIntervalSeconds?: number;
	readonly metadata?: Readonly<Record<string, string>>;
}>;

/** Generic diagnostic record for one presentation slot. */
type AnimationEvidenceDiagnosticEntry = Readonly<
	AnimationEvidenceReplayEntry & {
		readonly holdGroupFirstSlotIndex: number;
		readonly holdGroupOrdinal: number;
		readonly holdGroupSlotCount: number;
		readonly markers: readonly string[];
		readonly details: Readonly<Record<string, unknown>>;
	}
>;

/** Configuration for a standalone synchronized diagnostic player. */
type AnimationEvidenceDiagnosticDocumentConfiguration = Readonly<{
	readonly title: string;
	readonly subtitle: string;
	readonly idealVideoUrl: string;
	readonly traceVideoUrl: string;
	readonly timeline: readonly AnimationEvidenceDiagnosticEntry[];
	readonly disclosure: string;
	readonly provenance: Readonly<Record<string, unknown>>;
}>;
/** Caller-owned options for one encoded canvas frame. */
type AnimationFrameEncodingOptions = Readonly<{
	/** Whether this presentation begins a key frame. */ keyFrame: boolean;
}>;
