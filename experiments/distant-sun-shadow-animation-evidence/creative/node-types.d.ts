/**
 * Capture mode selected by the creative launcher.
 * - **"preview"** - Selected lossless scene stills.
 * - **"video"** - Complete native-4K sixty-second recording.
 */
type CreativeNodeMode = 'preview' | 'video';

/**
 * Terminal state of an immutable creative run.
 * - **"accepted"** - Requested artifacts completed and passed structural checks.
 * - **"failed"** - Rendering or artifact publication failed.
 * - **"interrupted"** - The run received an explicit process interruption.
 */
type CreativeNodeTerminalState = 'accepted' | 'failed' | 'interrupted';

/** Parsed launcher output selection. */
type CreativeNodeOptions = Readonly<{
	/** Selected capture mode. */
	mode: CreativeNodeMode;
	/** Native pixel width. */
	width: number;
	/** Native pixel height. */
	height: number;
}>;

/** Exact content identity of an input or artifact. */
type CreativeNodeFileIdentity = Readonly<{
	/** Slash-separated path relative to its recorded root. */
	path: string;
	/** Exact byte count. */
	byteLength: number;
	/** Lowercase SHA-256 digest. */
	sha256: string;
}>;

/** Validated input snapshot served without subsequent filesystem reads. */
type CreativeNodeFileSnapshot = Readonly<{
	/** Original bytes loaded at run initialization. */
	bytes: Uint8Array;
	/** Repository-relative content identity. */
	identity: CreativeNodeFileIdentity;
}>;

/** Bound listener and lifecycle owned by one immutable run. */
interface CreativeNodeModuleHost {
	/** Ephemeral loopback origin for allowlisted browser modules. */
	readonly baseUrl: string;
	/** Call this method to close the listener and active connections. */
	close(): Promise<void>;
}

/** Browser-reported activity retained in flushed JSON Lines progress. */
type CreativeNodeProgress = Readonly<{
	/** Current rendering or publication phase. */
	phase: string;
	/** Human-readable activity diagnostic. */
	message: string;
	/** Completed count when activity is countable. */
	completed?: number;
	/** Total count when activity is countable. */
	total?: number;
}>;

/** Narrow append-only filesystem capability used by the video stream. */
interface CreativeNodeVideoHandle {
	/** Call this method to append bytes at the handle's current offset. */
	write(buffer: Uint8Array, offset: number, length: number, position: null): Promise<CreativeNodeWriteReceipt>;
	/** Call this method to flush the complete video to the filesystem. */
	sync(): Promise<void>;
	/** Call this method to close the owned file descriptor. */
	close(): Promise<void>;
}

/** Actual filesystem write count required to handle partial writes correctly. */
type CreativeNodeWriteReceipt = Readonly<{
	/** Number of bytes written by one filesystem operation. */
	bytesWritten: number;
}>;

/** Video publication metadata validated at the browser-to-Node ingress. */
type CreativeNodeVideoMetadata = Readonly<{
	/** Exact total video byte count. */
	byteLength: number;
	/** Encoded output frame count. */
	frameCount: number;
	/** Intended playback duration in seconds. */
	durationSeconds: number;
}>;

/** Owned artifact callbacks and finalization state exposed to Puppeteer. */
interface CreativeNodeArtifacts {
	/** Lossless captures published so far. */
	readonly captures: readonly CreativeNodeFileIdentity[];
	/** Completed video identity, absent before video finalization. */
	readonly video: CreativeNodeFileIdentity | undefined;
	/** Saved scene trace identity, absent before trace publication. */
	readonly trace: CreativeNodeFileIdentity | undefined;
	/** Call this method to retain one lossless native-dimension capture. */
	capture(name: unknown, dataUrl: unknown): Promise<CreativeNodeFileIdentity>;
	/** Call this method to append the next bounded ordered MP4 chunk. */
	writeVideoChunk(index: unknown, byteOffset: unknown, base64: unknown): Promise<number>;
	/** Call this method to flush and close the complete MP4 after validating metadata. */
	finalizeVideo(metadata: unknown): Promise<CreativeNodeFileIdentity>;
	/** Call this method to retain the complete replay trace once. */
	writeTrace(trace: unknown): Promise<CreativeNodeFileIdentity>;
	/** Call this method to reject later writes and close outstanding files. */
	close(): Promise<void>;
}

/** Exact source snapshots and module locations for the isolated browser. */
type CreativeNodeInputs = Readonly<{
	/** Complete repository-relative source and dependency identities. */
	parents: readonly CreativeNodeFileIdentity[];
	/** Exact allowed module URLs and their captured source bytes. */
	modules: ReadonlyMap<string, Uint8Array>;
	/** Production application bundle with only the contained exposure seam added. */
	instrumentedBundle: string;
	/** Browser entry module path on the ephemeral host. */
	renderModulePath: string;
	/** Pinned Mediabunny module path on the ephemeral host. */
	mediabunnyModulePath: string;
	/** Installed Three.js module path on the ephemeral host. */
	threeModulePath: string;
	/** Exact runtime-only bundle adaptation details. */
	instrumentation: CreativeNodeInstrumentation;
}>;

/** Complete in-memory production bundle adaptation identity. */
type CreativeNodeInstrumentation = Readonly<{
	/** Purpose of the isolated bundle adaptation. */
	operation: string;
	/** Required unique original anchor. */
	anchor: string;
	/** Exact text inserted before the anchor. */
	injectedSource: string;
	/** Exact adapted bundle SHA-256 digest. */
	instrumentedBundleSha256: string;
}>;

/** Narrow browser response capability for bounded JSON provenance snapshots. */
interface CreativeNodeBrowserResponse {
	/** Call this method to obtain the fully resolved response URL. */
	url(): string;
	/** Call this method to obtain the HTTP response status. */
	status(): number;
	/** Call this method to determine whether the response status is successful. */
	ok(): boolean;
	/** Call this method to obtain lowercase response header names. */
	headers(): Record<string, string>;
	/** Call this method to obtain this accepted small response's exact bytes. */
	buffer(): Promise<Buffer>;
}

/** Exact response URL and retained content identity. */
type CreativeNodeResponseIdentity = Readonly<{
	/** Fully resolved canonical request URL, including selector parameters. */
	url: string;
	/** Successful HTTP status. */
	status: number;
	/** Closed run-local exact response body identity. */
	artifact: CreativeNodeFileIdentity;
}>;

/** Closed provenance snapshot set for consumed cache selectors and manifests. */
type CreativeNodeConsumedInputs = Readonly<{
	/** Versioned response ledger identity. */
	schemaId: string;
	/** Operation applied to the exact incoming response bodies. */
	operation: string;
	/** Pinned source owner that validates large payload identities. */
	payloadValidationOwner: string;
	/** Payload validation operation performed by the pinned production owner. */
	payloadValidation: string;
	/** Observed successful JSON response count. */
	responseCount: number;
	/** Number of distinct retained response bodies. */
	uniqueBodyCount: number;
	/** Total bytes retained for unique response bodies. */
	byteLength: number;
	/** Exact URL and content associations. */
	responses: readonly CreativeNodeResponseIdentity[];
}>;

/** Independently demuxed packet identity and original decoder order. */
type CreativeVerificationDecodedPacket = Readonly<{
	/** Zero-based packet index in the original demuxed decode sequence. */
	decodeIndex: number;
	/** Encoded packet kind reported by the demuxer. */
	type: string;
	/** Presentation timestamp in integer microseconds. */
	timestampMicroseconds: number;
	/** Encoded presentation duration in microseconds. */
	durationMicroseconds: number;
	/** Encoded packet payload byte count. */
	byteLength: number;
}>;

/** Demuxed packet assigned to its verified sorted presentation frame. */
type CreativeVerificationPacket = CreativeVerificationDecodedPacket &
	Readonly<{
		/** Zero-based frame index after sorting by presentation timestamp. */
		frameIndex: number;
	}>;

/** Complete independent MP4 metadata and packet inspection. */
type CreativeVerificationDemux = Readonly<{
	/** Native displayed pixel width. */
	width: number;
	/** Native displayed pixel height. */
	height: number;
	/** Container duration in seconds. */
	durationSeconds: number;
	/** Actual frame count divided by container duration. */
	framesPerSecond: number;
	/** Complete encoded presentation frame count. */
	frameCount: number;
	/** Container MIME type and full codec parameter. */
	mimeType: string;
	/** Demuxer codec identity. */
	codec: string;
	/** Number of independently decodable key packets. */
	keyFrameCount: number;
	/** Sum of all encoded packet payload bytes. */
	encodedPayloadBytes: number;
	/** Whether original decode order also had increasing presentation timestamps, independent of B-frame validity. */
	presentationWasMonotoneInDecodeOrder: boolean;
	/** Every ordered packet's retained timing and byte facts. */
	packets: readonly CreativeVerificationPacket[];
}>;

/** Exact decoded presentation frame selected by the compositor. */
type CreativeVerificationPresentedFrame = Readonly<{
	/** Zero-based intended presentation frame. */
	frameIndex: number;
	/** Seek time at the midpoint of the target frame interval, in seconds. */
	requestedSeconds: number;
	/** Actual compositor-reported media timestamp in seconds. */
	mediaTimeSeconds: number;
	/** HTML media playback position after seeking, in seconds. */
	resolvedSeconds: number;
	/** Browser media readiness after the exact frame appeared. */
	readyState: number;
}>;

/** Deterministic display-code statistics for a decoded frame. */
type CreativeVerificationPixelSummary = Readonly<{
	/** Diagnostic sample width in pixels. */
	width: number;
	/** Diagnostic sample height in pixels. */
	height: number;
	/** Mean Rec. 709 luma of sampled display-code values. */
	meanLuma: number;
	/** Minimum sampled display-code luma. */
	minimumLuma: number;
	/** Maximum sampled display-code luma. */
	maximumLuma: number;
	/** Fraction of sampled pixels with luma at least eight. */
	litPixelFraction: number;
	/** Number of distinct sampled RGB triplets. */
	uniqueColors: number;
}>;

/** Internal pixel samples and associated public image statistics. */
type CreativeVerificationPixels = CreativeVerificationPixelSummary &
	Readonly<{
		/** Actual unpremultiplied RGBA samples used for compression comparison. */
		rgba: Uint8ClampedArray;
	}>;

/** Every-pixel native opening-night measurements, excluding alpha and without resampling. */
type CreativeVerificationNativeStars = Readonly<{
	/** Exact native pixel width. */
	width: number;
	/** Exact native pixel height. */
	height: number;
	/** Minimum value in any RGB channel for a pixel to count as bright. */
	brightThresholdRgbCodeValue: number;
	/** Largest RGB channel code value in the complete image. */
	peakRgbCodeValue: number;
	/** Pixels with at least one nonzero RGB channel. */
	nonblackPixelCount: number;
	/** Pixels with at least one channel at or above the bright threshold. */
	brightPixelCount: number;
	/** Sum of every native RGB display-code channel, excluding alpha. */
	integratedRgbCodeValue: number;
}>;

/** Source-relative lower bounds for acceptable native-star retention after lossy encoding. */
type CreativeVerificationStarThresholds = Readonly<{
	/** Minimum decoded-to-original peak channel brightness ratio. */
	minimumPeakRatio: number;
	/** Minimum decoded-to-original bright native pixel count ratio. */
	minimumBrightPixelRatio: number;
	/** Minimum decoded-to-original integrated RGB display-code ratio. */
	minimumIntegratedRgbRatio: number;
}>;

/** Native source and decoded starfield comparison that cannot pass on a black decoded frame. */
type CreativeVerificationStarPreservation = Readonly<{
	/** Original lossless native opening-frame measurements. */
	source: CreativeVerificationNativeStars;
	/** Native opening-frame measurements after AVC decoding. */
	decoded: CreativeVerificationNativeStars;
	/** Recorded source-relative collapse rejection thresholds. */
	thresholds: CreativeVerificationStarThresholds;
	/** Decoded-to-original maximum channel brightness ratio. */
	peakRatio: number;
	/** Decoded-to-original native bright-pixel count ratio. */
	brightPixelRatio: number;
	/** Decoded-to-original integrated RGB display-code ratio. */
	integratedRgbRatio: number;
	/** Whether the source contains stars and every preservation bound passed. */
	accepted: boolean;
}>;

/** Selected parent presentation frame and optional original lossless capture. */
type CreativeVerificationCheckpoint = Readonly<{
	/** Zero-based desired video presentation frame. */
	frameIndex: number;
	/** Immutable parent capture identity when retained by the original render. */
	sourceCapture?: CreativeNodeFileIdentity;
	/** Validated local-file URL for the original lossless capture. */
	sourceCaptureUrl?: string;
}>;

/** Accepted inputs for read-only browser MP4 inspection. */
type CreativeVerificationBrowserConfiguration = Readonly<{
	/** Validated local-file URL of the immutable parent MP4. */
	videoUrl: string;
	/** Ordered frame checkpoints, including the final video frame. */
	checkpoints: readonly CreativeVerificationCheckpoint[];
}>;

/** Decoded inspection capture, exact timing, and optional source-image comparison. */
type CreativeVerificationCheckpointResult = CreativeVerificationPresentedFrame &
	Readonly<{
		/** New verification-run lossless decoded frame identity. */
		capture: CreativeNodeFileIdentity;
		/** Deterministic displayed-pixel statistics. */
		pixels: CreativeVerificationPixelSummary;
		/** Immutable original lossless capture used for optional compression comparison. */
		sourceCapture?: CreativeNodeFileIdentity;
		/** Mean absolute RGB display-code difference across aligned 480x270 samples. */
		meanAbsoluteRgbDifference?: number;
		/** Complete native star preservation diagnostics for title-free frame zero. */
		nativeStarPreservation?: CreativeVerificationStarPreservation;
	}>;

/** Native browser metadata and exact decoded checkpoint inspection. */
type CreativeVerificationBrowserResult = Readonly<{
	/** Browser-decoded native width in pixels. */
	videoWidth: number;
	/** Browser-decoded native height in pixels. */
	videoHeight: number;
	/** Browser-decoded container duration in seconds. */
	durationSeconds: number;
	/** Exact presentation-frame captures and comparisons. */
	checkpoints: readonly CreativeVerificationCheckpointResult[];
}>;

/** Validated parent manifest accepted by the independent verification lane. */
type CreativeVerificationParentManifest = Readonly<{
	/** Parent creative-render artifact schema. */
	schemaId: string;
	/** Accepted parent run terminal state. */
	state: string;
	/** Immutable parent run identifier. */
	runId: string;
	/** Exactly the known manifest and browser-operational exclusions. */
	excludedPaths: readonly string[];
	/** Complete authenticated parent evidence file identities. */
	artifacts: readonly CreativeNodeFileIdentity[];
	/** SHA-256 of the sorted parent artifact identity array. */
	artifactSetSha256: string;
}>;

/** Parent render fields required to authenticate the full native video. */
type CreativeVerificationParentResult = Readonly<{
	/** Parent creative-render result schema. */
	schemaId: string;
	/** Accepted terminal state. */
	state: string;
	/** Parent run identity. */
	runId: string;
	/** Complete video render mode. */
	mode: string;
	/** Original native capture width. */
	width: number;
	/** Original native capture height. */
	height: number;
	/** Closed parent MP4 identity. */
	video: CreativeNodeFileIdentity;
	/** Closed parent replay trace identity. */
	trace: CreativeNodeFileIdentity;
	/** Original lossless render checkpoints. */
	captures: readonly CreativeNodeFileIdentity[];
}>;

/** Replay trace timing inspected independently of rendered metadata. */
type CreativeVerificationParentTrace = Readonly<{
	/** Parent scene-trace schema. */
	schemaId: string;
	/** Declared fixed playback cadence. */
	framesPerSecond: number;
	/** Declared film duration in seconds. */
	durationSeconds: number;
	/** Explicit deterministic scene seed. */
	seed: number;
	/** Every recorded scene state in exact presentation order. */
	frames: readonly CreativeVerificationTraceFrame[];
}>;

/** Parent trace timing fields needed to verify complete ideal replay coverage. */
type CreativeVerificationTraceFrame = Readonly<{
	/** Presentation time of the scene state, in seconds. */
	animationSeconds: number;
	/** UTC astronomical observation instant. */
	instant: string;
}>;

/** Authenticated parent paths, identities, and exact source checkpoint mapping. */
type CreativeVerificationParent = Readonly<{
	/** Read-only parent run directory. */
	directory: string;
	/** Validated accepted parent manifest. */
	manifest: CreativeVerificationParentManifest;
	/** Exact raw parent manifest identity. */
	manifestIdentity: CreativeNodeFileIdentity;
	/** Validated accepted video result. */
	result: CreativeVerificationParentResult;
	/** Validated full replay trace. */
	trace: CreativeVerificationParentTrace;
	/** Absolute parent MP4 path. */
	videoPath: string;
	/** Browser inspection inputs derived from authenticated parent artifacts. */
	browserConfiguration: CreativeVerificationBrowserConfiguration;
}>;

/** Browser bridge owned exclusively by the independent video verifier. */
interface Window {
	/** Call this method to retain one decoded PNG in the new verification run. */
	__creativeVerifyCapture(name: string, dataUrl: string): Promise<CreativeNodeFileIdentity>;
	/** Call this method to append decoded inspection progress to the new verification run. */
	__creativeVerifyProgress(event: CreativeNodeProgress): Promise<void>;
	/** Call this method to append exact-frame strobing diagnosis progress. */
	__creativeStrobingProgress(event: CreativeNodeProgress): Promise<void>;
}
