# Animation Evidence Toolkit Design

## Ownership and boundaries

`scripts/animation-evidence/` owns versioned, repository-local offline tooling.
Its browser-safe public surface is `index.js`; Node-only artifact hashing is
exported separately by `node.js`. Generated qualification output belongs below
`tmp/animation-evidence/` and is never a source or runtime dependency. Version
and release responsibility remain with this repository's maintainers.

The toolkit does not own a scene, animation equation, renderer lifecycle, GPU
timer implementation, cache, shader, upload route, web server, codec choice, or
evidence retention policy. Those are explicit caller adapters. It never reads
an experiment directory, run identifier, or cache schema at runtime.

## Stable contracts

The stable generic pipeline is:

1. A caller schedules callbacks, derives state, renders, and returns its own
   measurements through `AnimationTrace`.
2. Caller-owned GPU/CPU samples are associated with immutable trace frames by
   an explicit key resolver.
3. `FixedCadenceReplay` selects the latest measured source callback not after
   each rounded output timestamp. It never interpolates state implicitly.
4. `DeterministicCanvasRecorder` renders changed states, retains held canvas
   content, and emits every exact output slot through a video adapter.
5. A video adapter owns codec and container mechanics. The included
   `MediabunnyCanvasOutput` uses a caller-injected module and streams its bytes
   through `BoundedChunkSink`.
6. Diagnostics make holds and caller-defined events visible. Node evidence
   publishers can content-address their completed artifact set.

Ambient contracts live in `types.d.ts`. Complex inputs are validated at public
constructors and methods; normalized internal operations then trust them.

## Experiment-specific exclusions

The originating experiment's solar path, 20-second equation, 55/78-degree
camera policy, Algorithm32 application traversal, cache-scene quantization,
shared-packet shader hook, 4K dimensions, bitrate, AVC candidate ordering,
HTTP endpoints, run allocation, and acceptance thresholds were deliberately
not extracted. A new local-Sun experiment supplies replacements through the
same public boundaries.

The production GPU timer remains renderer-owned. Its query lifecycle is tied
to the render graph, but its completed samples can be associated generically.
The original synchronous render operation and private application access were
experimental shortcuts and are not toolkit contracts.

## Dependency and compatibility policy

Version `1.0.0` has no third-party runtime dependency. Browser recording needs
ES modules, ES2023, `WritableStream`, canvas APIs, and WebCodecs. Codec support
must be proven at the requested dimensions using `WebCodecsEncoderSelector`.

The optional Mediabunny adapter is compatible with the canvas/fragmented-MP4
surface verified by Mediabunny `1.55.7`, MPL-2.0. The module is injected so a
caller must pin, retain, license, and record the exact dependency it uses.
Changing that surface or adding another muxer requires adapter qualification;
it does not change timing or replay contracts.

## Qualification and release

`animation-evidence.test.js` is the behavioral and failure-path gate.
`verify-browser-compatibility.js` is the real browser/WebCodecs gate and writes
a content-addressed run below `tmp/animation-evidence/`. `origin.json` and the
small S9-derived fixture preserve the extraction chain and allowed differences.

The sealed S9 oracle includes actual native-4K AVC/MP4 finalization and decode;
the reusable fixture intentionally retains timing inputs only. Therefore byte
identity is neither expected nor claimed. Required equivalence is the first 12
source-frame selections, output timestamps, holds, and measured-frame jump.
Allowed differences are generic schema names, omitted Algorithm32 state, caller
injection of codec/transport, and synthetic qualification dimensions.
