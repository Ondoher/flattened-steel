# Animation Evidence Toolkit

This repository-owned `1.0.0` toolkit separates animation performance
measurement from deterministic appearance recording. It is cache-, renderer-,
and scenario-agnostic. The originating GPU-resident shared-block-cache
experiment and its sealed runs are provenance and qualification oracles, not
runtime dependencies.

## Public entrypoints

Import browser-safe APIs from `./index.js`:

- `AnimationTrace` measures caller-scheduled animation callbacks and associates
  caller-owned CPU/GPU samples by frame identity.
- `FixedCadenceReplay` maps measured frames onto exact output timestamps by
  selecting the latest measured callback not after each presentation slot.
- `DeterministicCanvasRecorder` re-renders changed states, retains held frames,
  and sends every presentation slot to a caller-owned video output.
- `BoundedChunkSink` caps in-memory muxer bytes and publishes ordered batches.
- `WebCodecsEncoderSelector` proves ordered caller-owned codec candidates by
  encoding a frame instead of trusting capability declarations alone.
- `MediabunnyCanvasOutput` adapts a caller-injected Mediabunny module to
  fragmented MP4 output. It never imports or selects a Mediabunny version.
- `DiagnosticTimeline` and `DiagnosticPlayerDocument` create visible held-slot
  evidence and a synchronized ideal/trace player.

Import `ArtifactManifest` from `./node.js` in Node-only evidence publishers.

## Minimal flow

```js
import {
	BoundedChunkSink,
	DeterministicCanvasRecorder,
	FixedCadenceReplay,
	MediabunnyCanvasOutput,
} from './scripts/animation-evidence/index.js';

const mapping = FixedCadenceReplay.latestFrameAtOrBefore({
	sourceFrames: measuredFrames,
	outputFrameCount: 1200,
	outputFramesPerSecond: 60,
	getSourceTimestampMicroseconds: (frame) => frame.callbackMicroseconds,
	getSourceFrameId: (frame) => frame.id,
	projectState: (frame) => frame.state,
});

const chunks = new BoundedChunkSink({
	maximumBatchBytes: 4 * 1024 * 1024,
	publishBatch: uploadBatch,
	finalize: finalizeUpload,
});
const output = new MediabunnyCanvasOutput({
	mediabunny,
	canvas: presentationCanvas,
	writable: chunks.writable(),
	framesPerSecond: 60,
	codec: 'avc',
	fullCodecString: selectedCodec,
	bitrate: 40_000_000,
});
await new DeterministicCanvasRecorder({
	mapping,
	framesPerSecond: 60,
	presentationCanvas,
	videoOutput: output,
	render: async (entry) => renderApplicationState(entry.state),
}).record();
```

The caller remains responsible for copying its rendered canvas into the
configured presentation canvas, selecting dimensions/bitrate/codec policy,
providing a safe transport, retaining complete input and dependency identities,
and validating the resulting media.

## Compatibility and dependencies

The core has no third-party runtime dependency. It targets ESM runtimes with
ES2023, `WritableStream`, and the DOM types used by canvases. Browser encoding
requires `OffscreenCanvas`, `VideoFrame`, and `VideoEncoder`. Codec availability
is deliberately runtime-probed because it varies by browser, OS, hardware, and
requested dimensions.

`MediabunnyCanvasOutput` supports the canvas/fragmented-MP4 API exercised with
Mediabunny `1.55.7` (MPL-2.0) in the sealed source experiment. Callers inject
and record their exact module identity and license; the toolkit does not bundle,
fetch, or silently upgrade it. Other containers implement the small
`AnimationEvidenceVideoOutput` adapter contract from `types.d.ts`.

## Evidence limits

Performance traces must be captured without video encoding, screenshots, or
readback in the timed interval. Deterministic recordings provide visual proof
of the measured cadence, including real holds; their generation speed is not an
FPS result and lossy pixels are not renderer-equivalence evidence. GPU timer
samples remain caller-owned because timer-query creation/polling is renderer
lifecycle policy; `AnimationTrace.associateSamples` provides the generic
frame-correlation boundary.

The diagnostic player is browser-level evidence, not literal physical-display
capture. Its URLs and descriptive strings must come from a trusted evidence
publisher; HTML text and embedded JSON are escaped, but URL scheme policy stays
with that publisher.

## Verification

Run:

```text
npm run test:animation-evidence
npm run typecheck:animation-evidence
```

The behavioral check covers S9-oracle cadence mapping, holds and jumps,
synthetic trace capture, GPU-sample association, deterministic held-frame
recording, bounded/failing transport, Mediabunny adapter finalization,
diagnostic composition, and stable artifact identities. See `origin.json` and
the retained fixture for the complete extraction chain.
