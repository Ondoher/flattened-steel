# GPU-Resident Shared-Block Cache Experiment Design

## Objective

Measure whether a GPU-resident atlas of decompressed shared distant-Sun cache blocks can support rapid animated scene switching without changing exact sampled values.

## Acceptance Question

Can a shader-addressable shared-block atlas preserve exact cache samples while retaining a predicted angular animation window and reduce adjacent-scene switch work relative to dense-scene reconstruction?

## Isolation Boundary

Authored experiment work remains below `experiments/gpu-resident-shared-block-cache/`. Generated output remains below `tmp/experiments/gpu-resident-shared-block-cache/`. Production and other experiment trees are read-only inputs unless their write scope is separately authorized.

## Output and run rules

- The experiment source root is `experiments/<slug>/`. Authored implementation, fixtures, harnesses, runner source, configuration, and dependency manifests belong there.
- The generated-output root is `tmp/experiments/<slug>/`. Builds, caches, browser profiles, reports, captures, diagnostics, renders, logs, progress records, temporary files, and other generated intermediates belong only there and must remain ignored by Git.
- Derive repository, source, and output roots from the location of a checked-in repository marker rather than `process.cwd()`.
- Real-path-check every read and write boundary. Reject symlinks, junctions, reparse points, and any resolved path outside its declared root.
- Use a new `runs/<run-id>/` directory for each evidence-bearing execution. Never overwrite or reopen a completed run. Copy or derive reused material into the new run and retain its source identity.
- Record the command, inputs, relevant configuration, implementation revision or hashes, tool/runtime versions, environment facts that affect the result, parent artifacts, derivation operation, and resulting artifact identities.
- Finalize a run with an explicit terminal state: `accepted`, `rejected`, `failed`, or `interrupted`. Publish its terminal manifest only after all artifacts are closed and hashed.
- A verifier may read the run it validates but must not mutate it. Corrections and retries create a new run.
- Keep production and other experiment trees read-only during experiment execution unless the engineer explicitly expands the write scope.

## Monitorable progress

Every operation expected to run longer than one minute writes UTF-8 JSON Lines to:

```text
tmp/experiments/<slug>/runs/<run-id>/progress.jsonl
```

Append one event at process start, every phase transition, at least once every 30 seconds while active, and at terminal completion or failure. Flush each event so another process can tail the file while the operation runs. Each event contains:

```json
{
	"timestamp": "2026-09-04T12:00:00.000Z",
	"phase": "compute",
	"completed": 24,
	"total": 100,
	"message": "Processing sample batch 24 of 100."
}
```

`timestamp`, `phase`, and `message` are always required. Include `completed` and `total` when work is countable. Terminal events additionally include `state` with one of the allowed terminal states. Do not place secrets, credentials, or unnecessary personal data in progress records.

## Decisions

### Initial hypothesis

Keep decoded shared blocks in a GPU texture atlas or texture array and switch
the shader's per-scene lookup metadata at a frame boundary. A predictor uses
the animation's next angular positions to fetch, decode, and upload only block
identities absent from the resident window. Zstandard bytes remain outside the
shader; the shader receives only decoded float data and exact addressing
metadata.

### Comparison boundary

Read the sealed C0--E3 evidence and the D0 decision from the distant-Sun cache
optimization study as immutable comparison inputs. Do not import its
implementation at runtime, alter its source/output, or modify production.

### First proof scope

The smallest proof must compare a bounded sequence of neighboring scene
selections under two paths on the same browser/GPU: dense-scene reconstruction
and an atlas-backed lookup. It must record exact sampled values, required and
reused block identities, prefetch hits/misses, CPU decode work, GPU upload
work, atlas residency, and frame-boundary switch latency. It must also retain
reverse-direction and prediction-miss cases rather than assuming monotonic
animation.

### S0--S2 selected defaults

The checked-in [S0--S2 animation-atlas contract](../../../../../experiments/gpu-resident-shared-block-cache/controls/s0-s2-animation-atlas-contract.json)
pins the accepted parents and selects the first proof's `90 -> 91 -> 92 -> 91
-> 30 -> 90` sequence. It uses a 24-layer `R32F` WebGL2 texture array,
one-scene look-ahead, least-recently-used unpinned eviction, and exact Float32
bit-pattern comparison. The complete block sets and expected neighbor deltas
are contractual inputs, not post-measurement choices.

### S5 GPU publication refinement

S4 retains the exact scalar `R32F` atlas as proof that decoded shared blocks
are directly shader-addressable. S5 rejects that scalar layout for the live
production sampling path: exact bilinear direction reconstruction multiplies
scalar texture fetches and did not complete the bounded 4K workload. The
animation design therefore keeps compressed/shared spectra as its storage and
transfer representation, then repacks only authenticated resident blocks into
production-compatible RGBA spectral packets during GPU publication. The
runtime shader adds one row-to-slot indirection while retaining production's
hardware bilinear filtering and spectral arithmetic. This does not reconstruct
a complete dense scene and remains bounded by the declared resident window.

## Open Questions

- Does S6 independently verify the complete S5 evidence chain?
- Do S5's bounded memory and switch-time results justify a production design?
- Can Q24 pass spectral/physical qualification across the complete production
  scene boundary, rather than only display-space comparisons?
- Can a lower-resolution atmosphere buffer be reconstructed at 4K without
  blurring celestial sources, geometry silhouettes, or depth discontinuities?

### S8 runtime-performance extension

The cache experiment also retains post-S5 performance evidence because the
shared-block lookup is not the dominant 4K cost. The live shader executes 30
camera-path intervals, with up to 16 hardware-filtered RGBA cache reads and 15
spectral exponential evaluations per interval. S8 may vary only one declared
performance lever at a time and must keep production source read-only.

The first retained candidates are:

- Q24 camera-path integration at native 4K. It is a numerical change and may
  advance only after spectral/physical qualification, even when display-space
  images appear equivalent.
- A lower-resolution atmosphere buffer reconstructed into a native-4K
  presentation. Sharp celestial, scene, and depth-boundary content must remain
  full resolution or receive an edge/depth-aware reconstruction; plain spatial
  scaling is not a promotion design.
- Native-resolution shader packetization that keeps the four RGBA spectral
  packets intact through transport and Color arithmetic. This is the preferred
  exact-arithmetic investigation because the resident cache is already packed
  as RGBA32F.

### Candidate quality control

If the lower camera-path counts pass their required quality gates, expose them
as discrete named presets rather than an unrestricted integer slider. The
current measured candidates are `Ultra = Q30`, `High = Q24`, `Balanced = Q20`,
`Performance = Q15`, and optionally `Low = Q10`. These names and counts remain
experimental until every preset has its own spectral, endpoint, and
daylight-to-twilight qualification. A preset must fail closed when its required
cache or shader contract is unavailable.

An `Auto` mode may select only qualified presets. While the camera or scene is
moving, it may reduce the path count to a configured motion preset; as motion
slows it may advance to Q24, then restore Q30 after a stable settling interval.
Transitions should use temporal refinement or a bounded crossfade so changing
quality does not create visible popping. Auto selection must use hysteresis,
minimum dwell times, and measured GPU-frame feedback to avoid oscillation.

Internal atmosphere resolution is a separate control from path quality. A
future render-scale setting may lower only the atmosphere evaluation while
retaining native-resolution celestial sources, scene color, silhouettes, and
depth boundaries. It must not be folded invisibly into the path-quality names,
because its artifacts and reconstruction requirements are different.

### Trace-driven animation evidence

The animation evidence remains in this experiment because it exercises the
same shared-block atlas, prediction, publication, and live shader boundary.
Starting another contained experiment would duplicate those contracts without
creating a distinct isolation boundary.

The first scenario is a 20-second sunrise-to-sunset control whose solar zenith
follows `90 -> 30 -> 90` degrees while the camera continuously follows the Sun.
The route contains 61 one-degree scenes and 62 unique authenticated blocks:
363,647,002 encoded bytes and 966,128,640 decoded bytes. Extended preparation
may decode, authenticate, construct lookup metadata, and attempt to upload the
entire route before playback. The existing 24-layer budget is not silently
expanded: a new capacity proof must accept a 62-layer allocation before a
whole-route GPU-resident result may be claimed. If that allocation fails, the
fallback is a bounded decoded CPU pool feeding a measured sliding GPU window.

Performance and recording use separate executions. The performance execution
records the real animation without encoding video. Each frame retains its
requested animation time, callback time, complete Sun/camera/cache/quality
state, CPU submission interval, associated disjoint-safe GPU timer result, and
cache lifecycle events. Browser-level timing is the acceptance boundary. Exact
physical-display scanout would require an external capture device and is
explicitly outside this experiment.

The appearance execution deterministically re-renders the recorded states
without a real-time deadline. A fixed 60 Hz replay maps each presentation slot
to the most recent frame available in the measured trace. A late frame holds
the previous image for the corresponding number of slots; the replay must not
interpolate over or otherwise conceal a measured hitch. An ideal evenly timed
render of the same state path is the visual control.

WebCodecs performs frame encoding, and an experiment-local muxer assembles a
playable container. Encoded output is streamed in bounded chunks to the
loopback experiment host rather than accumulating a raw frame sequence or one
unbounded browser blob. The current leading muxer candidate is Mediabunny, but
its exact version, license, codec/container selection, and 4K browser support
must be frozen by the implementation run rather than assumed by this design.

The evidence set contains a clean ideal-timing video, a clean trace-timing
video, an annotated side-by-side diagnostic, the raw timing trace, replay
mapping, encoder/muxer configuration, representative lossless PNG frames, and
artifact identities. The initial control preserves nearest-degree hard cache
switches so the recording can reveal stepping. Spectral interpolation between
neighboring cache scenes is a later candidate and must be compared against the
unchanged control rather than built into it invisibly.

S9.1 run `1788913194598-s9-whole-route-capacity` accepted the decoded
spectral-source capacity candidate. It authenticated all 61 scene manifests
and 62 unique blocks, allocated and uploaded a 62-layer `R32F` array containing
966,128,640 bytes, and retained the WebGL context. S9.2 later found that the
S9.1 probe runner interpreted the wavelength-major E1 source as row-major.
Those 186 reads prove retrievable uploaded bits but no longer qualify semantic
`{wavelength, block row}` coordinates. The allocation, authentication, byte,
and context-capacity facts remain valid; the S9.1 source now uses the frozen
wavelength-major equation for any future run.

S9.2 run `1788917159050-s9-shared-packet-renderer` independently allocated and
populated the final production-compatible packet shape: 62 `RGBA32F` block
layers of 648 by 1,728 texels, totaling 1,110,786,048 bytes. It expanded the
authenticated E1 wavelength-major spectra through the exact logical-to-unique
direction map, retained a zero fourth component in the final packet, and
passed 248 exact Float32 probes. A 61-scene `RG16UI` row-address texture maps
each scene packed row to `{block slot, block row}`; a companion `RGBA32I`
ledger texture supplies each scene's altitude support.

The contained integration serves the unchanged production bundle with an
experiment-only application exposure and rewrites only the generated cache
addressing contribution at shader compilation. Same-frame dense-production
and shared-atlas renders at 32.461, 61.991, and 89.958 degrees solar zenith
differed by at most one 8-bit display code; p99 channel difference was zero in
all three controls. The same renderer accepted deterministic states at 0, 5,
10, 15, and 20 seconds, rotated the live camera to follow the Sun, updated the
production celestial Sun-tile placement and endpoint-light direction from the
same explicit state, selected the nearest degree without interpolation, and
retained a distinct PNG for every state. Every checkpoint completed a new
atmosphere frame and published the Sun within
`2.274e-13` pixels of the 960-by-540 camera center. Production files were not
modified. This qualifies the integrated render path for S9.3 timing; it does
not yet measure real-time animation.

Earlier run `1788915844404-s9-shared-packet-renderer` remains valid for packet
capacity, exact probes, and dense/shared equivalence. Its arbitrary-time
captures changed the shader direction and camera but retained the production
startup Sun-tile placement, leaving the disk about 30 degrees off-axis at 20
seconds. It is therefore partial evidence and does not qualify the joint
animation-state requirement.

S9.3 run `1788918482263-s9-animation-trace` measured the integrated path for
20.0165 wall-clock seconds at a native 3,840-by-2,160 drawing buffer, Q10, and
the production diagnostic's 78-degree vertical FOV. It retained 455 submitted
frames and complete non-disjoint GPU timer results for every frame, with no
recording, screenshot, image readback, transfer, decode, authentication,
packing, or upload inside the timed interval. Ordered browser callbacks
measured 22.681 FPS mean and 19.833 FPS one-percent-low; the longest visible
hold was 50.7 ms. The runtime shader measured 37.256 ms mean GPU time while
outer CPU submission measured 1.939 ms mean. The 60 Hz presentation mapping
contains 1,201 slots, of which 746 have no new submitted frame and will hold
the preceding state in the fixed-cadence replay.

All 121 initial/changed cache-state publications used already-resident
whole-route metadata. Transition frames averaged 36.976 ms GPU time versus
37.358 ms for stable-cache frames, so this run shows no GPU cache-switch
penalty. Transition callback intervals averaged 44.723 ms versus 43.862 ms for
stable frames; that small cadence association is retained but is not evidence
that metadata switching caused the gap. No cache degree was skipped, and every
frame kept the separately generated Sun centered with the same direction used
by the shared-cache shader.

Companion run `1788919164368-s9-animation-trace-fov55` repeats the same
20-second, native-4K, Q10 trace at a 55-degree vertical FOV. Its purpose is to
provide the preferred natural-looking presentation, not to qualify an FOV
performance optimization. It retained 470 frames with complete non-disjoint
GPU timing. Mean callback cadence was 23.392 FPS, one-percent-low cadence was
19.881 FPS, mean shader GPU time was 37.009 ms, and the longest visible hold
was 50.3 ms. These measurements confirm compatibility, but aesthetic framing
is the reason the variant is retained.

S9.4 through S9.6 treat the 78-degree wide-angle control and the 55-degree
preferred presentation symmetrically. Each receives its own ideal mapping,
trace-faithful mapping, deterministic render, clean video, annotated evidence,
representative PNGs, verification, and provenance. Comparisons must label FOV
as a presentation choice and must not claim that the small observed timing
difference motivated the 55-degree selection.

S9.4 run `1788919958694-s9-presentation-replay` freezes the shared replay
boundary as 1,200 rounded 60 Hz slots from 0 through 19.983333 seconds. Each
ideal entry is computed independently at `slotIndex / 1199`. Each
trace-faithful entry selects the latest authenticated measured callback not
after its slot, repeats that exact state across missing slots, and exposes the
next measured jump without interpolation. The 78-degree mapping uses 454
source frames, contains 746 held slots, and reaches a maximum four-slot/66.667
ms mapped hold. The 55-degree mapping uses 467 source frames, contains 733 held
slots, and reaches a maximum three-slot/50 ms mapped hold. One 55-degree output
transition advances two measured frame IDs because both callbacks fall between
presentation slots; preserving that advance is the intended trace-faithful
behavior. An independent verifier reconstructed all four mappings exactly and
authenticated artifact set
`db3b6283a0e37c9ddeb79be0f447b22367e25499e71aa928ec2c9ff423419105`.

S9.5 run `1788923711177-s9-deterministic-video` freezes the deterministic
video construction boundary. A real one-frame WebCodecs probe selects H.264
High Profile Level 5.2 (`avc1.640034`) at 3,840 by 2,160, 60 Hz, 40 Mbps
variable bitrate, quality latency mode, and a 60-frame keyframe interval. The
hardware setting is a preference, not evidence of the encoder implementation
Chrome ultimately used. Mediabunny 1.55.7 (MPL-2.0) owns fragmented-MP4
construction, and the accepted evidence retains its exact bundle, license, and
package-lock identities.

The browser-to-host sink admits at most 4 MiB per request and splits larger
atomic muxer writes across batches. A completed WebGL render is copied into a
retained 2D presentation buffer before encoding. Trace-held slots encode that
buffer without rerunning the shader; this is necessary because the source
WebGL drawing buffer is not preserved. Five lossless 4K checkpoints per video
must be distinct across the scenario and pass a nonblack pixel probe so a
container-only success cannot qualify visually empty held frames.

The accepted run produced ideal and trace-faithful videos for both FOVs, each
with exactly 1,200 monotonic packets and 20 key packets over 20 seconds. The
trace videos retain the S9.4 hold counts exactly. Browser decode/seeks qualify
playability; an independent demux matches every packet timestamp, duration,
type, and payload size. The accepted artifact-set identity is
`07c014ba6d0e029b4dc0c35721e013a5b4d662d585bd1c17fbea10fe6d745b01`.
Video encoding remains appearance evidence, not performance evidence, and its
lossy color/chroma behavior is not renderer-equivalence evidence; S9.6 records
that limitation and owns the annotated diagnostic set.

Human review of the completed videos accepts the animation behavior while
flagging sunrise and sunset as somewhat off overall. A horizon that is often
too gray instead of the expected white is the clearest symptom. The same
defect is visible in the live application, which excludes deterministic replay
and video encoding as its cause. A later focused qualification must separate
cache selection/data from the cache-consuming shader and presentation response
before assigning the root cause. The current appearance is sufficient for the
Bruneton/cache-animation tests and does not block the established trace,
replay, held-frame, camera-follow, or deterministic-video path, but annotated
evidence must disclose it.

Project-owner visual review accepts the trace-faithful native-4K animation as
smooth enough for the intended large-display experience. That qualitative
acceptance complements rather than replaces the S9.3 measurements: the
renderer did not sustain 60 FPS, and the deterministic video deliberately
shows the resulting held presentation slots.

Sealing the experiment freezes its conclusion and evidence; it does not ban
later visual derivatives. A post-close recording request belongs in a new
contained derivative lane with new immutable run identities, read-only parent
artifacts, and complete parent hashes and derivation records. Such recordings
may vary presentation choices without being mistaken for new performance or
qualification evidence.

The preserved failed and superseded attempts define required guards. A
persistent streaming request can stall browser progress; one atomic muxer
fragment can exceed a transport batch; a non-preserved WebGL canvas can yield
black repeated frames; and the requested AVC level can differ from the emitted
bitstream. The accepted design therefore uses bounded discrete requests,
splits atomic writes, retains presentation pixels, probes checkpoint content,
and verifies the actual demuxed codec identity.

S9.6 run `1788926658377-s9-published-evidence` closes the viewable-evidence
boundary without rerunning the shader. It copies the exact S9.5 videos and all
required S9.3-S9.5 parents into one immutable set, constructs per-slot
diagnostic timelines, and supplies synchronized local players that expose
holds, cache transitions, source frames, and CPU/GPU attribution. Browser
decode checks, annotated screenshots, copied-byte authentication, and
independent MP4 demux verification qualify artifact set
`2d9411657a439dd3691235b11a6b715dcce5d89a19b896fcd90ec701fbab25a3`.

S6 audit run `1788926996374-s6-final-audit` independently accepts the complete
canonical verifier chain. S7 therefore closes the experiment with a
recommendation for a separately authorized production design, subject to the
operational and claim boundaries in [decision.md](decision.md). Remaining S8
candidates, S9.7 interpolation, and sunrise/sunset horizon diagnosis are
retained as deferred work rather than silently classified as complete.

The next intended cache study is local-Sun animation after any requested
post-close recording variants. It must begin as a new contained experiment and
may reuse this sealed evidence only as read-only comparison input.

### Post-experiment reuse boundary

The animation evidence machinery is now released for reuse at
`scripts/animation-evidence/`, while this experiment remains its immutable
origin. Completing the experiment does not
authorize moving, deleting, or replacing its controls, runners, sealed runs,
or generated artifacts. R0 copied and adapted reusable behavior into that
repository-owned tooling location and retained the source experiment and
accepted run identities as provenance.

The released implementation keeps reusable mechanics separate from
Algorithm32-specific policy. The reusable side consists of frame-trace event
collection, GPU-timer association, fixed-cadence presentation mapping,
deterministic state replay, bounded browser-to-host artifact streaming,
WebCodecs/muxer orchestration, diagnostic-video composition, and artifact
verification. Solar equations, cache manifests, spectral packet addressing,
shader uniforms, scene selection, camera policy, and quality presets remain
experiment adapters.

R0 selected repository-local offline tooling as the owner. Its source boundary
is `scripts/animation-evidence/`, generated qualification output belongs below
`tmp/animation-evidence/`, and its current repository-owned release is
`1.0.0`. It has no third-party runtime dependency; the optional Mediabunny
adapter requires caller injection and records compatibility with version
`1.55.7`, MPL-2.0. The tool does not depend at runtime on an experiment
directory or sealed run. Its small derived fixture retains the complete parent
and derivation identities, and original evidence remains untouched.
