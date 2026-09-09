# GPU-Resident Shared-Block Cache Experiment Status

Status: accepted and closed. S6 verification, S7 decision, and the S9 core
animation evidence are complete. Remaining S8 candidates and S9.7 temporal
interpolation are explicitly deferred. Post-close R0 reusable-tool extraction
is complete.

## Current State

S0--S2 freeze the immutable parents, fixed `90 -> 91 -> 92 -> 91 ->
30 -> 90` sequence, 24-layer budget, exact addressing, and one-scene
predictor. S3 established the contained WebGL2 host. S4 run
`1788887946682-s4-exact-atlas` authenticated all 34 required E1 blocks and
passed 486 exact Float32 shader probes with zero mismatches plus all lifecycle
controls. The earlier v1 addressing failure remains immutable nonaccepted
evidence.

S5 is complete. Canonical run
`1788907211015-s5-animation-measurement` contains the raw frame records,
separate Zstandard and inverse-shuffle measurements, byte/count accounting,
tiled dense baseline, memory facts, real predictor outcomes, and a
self-validated summary. It used a 24-block GPU budget, one-scene horizon,
serial request concurrency, and no Worker.

## S5 Animation Result

- The 90-degree cold selection loaded 16 required blocks and one predicted
  91-degree block.
- At 91 degrees, all 17 required blocks were resident; the predictor hit one
  block and uploaded one new predicted 92-degree block.
- At 92 degrees, all 18 required blocks were resident and no block uploaded.
- The reverse 92-to-91 step reused all 17 required blocks. Its attempted
  30-degree lookahead was cancelled because the 33-block union exceeded the
  24-slot budget.
- The abrupt 91-to-30 step reused no blocks and cancelled its incompatible
  90-degree lookahead. The final 30-to-90 step likewise required 16 uploads.
- Across the complete sequence, the atlas uploaded 50 blocks (779.1 MB
  decoded) in 91.5 ms. The dense baseline spent 575.8 ms reconstructing and
  311.5 ms uploading scenes. The largest 92-degree dense scene required two
  2D texture tiles; the atlas remained within its fixed array shape.
- Browser-main peak was 1.092 GB. Node peak RSS was 623.3 MB. Node preparation
  decoded all 34 authenticated blocks in 1532.5 ms: 646.6 ms Zstandard and
  885.7 ms inverse shuffle. These preparation sums are not concurrent browser
  wall time.

## Shader Runtime Result

Accepted production full-pass run
`1788900458703-s5-production-display-performance` measured the fully loaded
current Algorithm32 runtime shader at 3840 by 2160 on the RTX 2060: 94.790 ms
mean and 99.897 ms p95.

Accepted apples-to-apples run
`1788906789532-s5-production-cache-contribution-4k` used the same authenticated
production seam payload, 24 resident rows, four row taps, 15 spectral
channels, hardware bilinear filtering, identical 3840-by-2160 pixels, and
interleaved GPU timer queries. The production lookup measured 1.280 ms mean,
1.271 ms median, and 1.339 ms p95. The production-compatible shared-block slot
lookup measured 1.563 ms mean, 1.556 ms median, and 1.609 ms p95. Runtime slot
indirection therefore added 0.283 ms mean at 4K: 22.1% of the isolated lookup,
but about 0.3% of the measured full production pass.

The rejected scalar `R32F` alternative required manual four-direction
bilinear reconstruction for every spectral channel and did not complete a 4K
frame within the bounded harness. S5 therefore retains the compact/shared
storage representation outside the shader but selects production-compatible
RGBA packet slots for GPU publication.

## Blockers

None recorded.

## Next Action

No work is required to complete this experiment. If requested, create a new
contained derivative-recording lane that reads the sealed evidence without
modification. After those recordings, initialize a new local-Sun cache
experiment using the same exactness, residency, predictive switching, timing,
and trace-faithful animation method, adopting the released
`scripts/animation-evidence/` toolkit. The remaining S8 candidates, S9.7, and
the horizon-quality issue remain deferred.

## S8 Runtime Extension Results

Accepted native-4K run `1788909415561-s5-production-interval-sweep-4k`
interleaved a Q30 control between lower-count variants on the same live
production application and RTX 2060. Q30 measured 92.426 ms (10.82 FPS), Q24
74.390 ms (13.44 FPS), Q20 60.852 ms (16.43 FPS), Q15 45.963 ms (21.76 FPS),
and Q10 31.717 ms (31.53 FPS). In its UI-free reference capture, Q24 differed
from Q30 by at most one 8-bit display code value per channel, with mean absolute
difference 0.209. Counts below Q30 remain diagnostic and unqualified.

Accepted resolution run `1788909198193-s5-production-resolution-sweep` kept
qualified Q30 unchanged. Native 4K measured 92.003 ms (10.87 FPS), 2560 by
1440 measured 43.338 ms (23.07 FPS), and 1920 by 1080 measured 23.061 ms
(43.36 FPS). These are internal-raster costs, not a completed 4K reconstruction
design; the first spatial comparison also included overlaid controls and is not
retained as quality evidence.

Accepted visual run `1788909932611-s5-q24-lighting-regime-visuals` supersedes
the stale-frame diagnostic predecessor. It selected San Jose scenes through
the live production resolver and preserved Q30, Q24, and amplified-difference
images at solar zeniths 84.683, 88.224, 89.958, 93.346, 96.613, 99.745,
104.148, and 108.137 degrees. Across every non-dark pre-sunset-through-
astronomical scene, maximum display-code difference was 1 or 2 and p99 was 1.
The final 108.137-degree control selected the configured dark path. This is
strong display-space evidence for Q24, but not yet spectral or physical
qualification.

## Candidate Runtime Controls

S8 retains a provisional discrete quality mapping from the measured native-4K
interval sweep: Ultra/Q30 at 10.82 FPS, High/Q24 at 13.44 FPS, Balanced/Q20 at
16.43 FPS, Performance/Q15 at 21.76 FPS, and Low/Q10 at 31.53 FPS. These are
measured performance labels, not qualified shipping presets.

The candidate Auto policy lowers only to an already-qualified preset during
camera or scene motion, advances toward Q24 as motion slows, and restores Q30
after the view settles. It requires frame-budget feedback, hysteresis, minimum
dwell times, and temporal refinement or bounded crossfading. Atmosphere render
scale remains a separate prospective control because its reconstruction and
artifact risks differ from path-count quality.

## Animation Evidence

S9 remains in this experiment because it directly exercises the same atlas,
prediction, publication, and live shader boundary. Its completed performance
runs contain no recording work. The deterministic offline executions map the
measured traces onto fixed 60 Hz video timelines and hold prior frames across
missed presentation slots, preserving visible hitching. Browser-level timing
is the accepted boundary; exact physical-display scanout and external capture
hardware are out of scope.

The repository now supplies Puppeteer browser control, complete per-frame GPU
timer traces, production scene selection, PNG capture, immutable evidence
records, the accepted full-route RGBA packet renderer, deterministic replay,
frozen WebCodecs/muxer configuration, bounded encoding transport, independently
verified videos, and synchronized diagnostic publication. The videos preserve
hard one-degree cache switches; interpolation remains a deferred candidate.

## S9.0-S9.2 Result

The checked-in S9 animation contract freezes a 20-second `90 -> 30 -> 90`
solar-zenith path, a camera that continuously follows the Sun, Q10 diagnostic
motion quality, an unencoded performance trace, and deterministic ideal and
trace-faithful 60 Hz replays. Browser callback cadence owns visible holds; GPU
queries attribute cost without claiming physical monitor scanout.

Accepted run `1788913194598-s9-whole-route-capacity` re-authenticated all 61
one-degree scene manifests and 62 unique E1 blocks. The route contains
363,647,002 encoded bytes and 966,128,640 decoded bytes. Node preparation took
1,227.665 ms for Zstandard and 1,662.114 ms for inverse shuffle. Chrome on the
RTX 2060 allocated the 62-layer `R32F` array, received and authenticated all
966,128,640 decoded bytes, submitted their uploads in 107.500 ms total, and
retained the WebGL context.
The pre-roll browser transfer and digest work took 10,177.600 ms and 2,712.500
ms respectively; neither belongs to playback timing.
The sealed artifact-set identity is
`593c0fff94f60c98a9e3b18f6d3a60f1483ae4bfb4d4cd288e228e23f9597fc0`.

S9.2 discovered that S9.1's 186 probe coordinates reversed the frozen
wavelength-major E1 row equation. They prove retrievable uploaded bits but not
semantic wavelength/block-row addressing. S9.1 therefore remains valid
whole-route allocation, authentication, byte, and context-capacity evidence;
its source has been corrected for future runs.

Accepted run `1788917159050-s9-shared-packet-renderer` proved the final surface
inside the full live render context. It allocated 62 `RGBA32F` layers of 648 by
1,728 texels (1,110,786,048 bytes), packed all 15 wavelength-major channels plus
the zero padding component, and passed 248 exact Float32 probes. Its `RG16UI`
row-address metadata resolves all 61 scenes to `{block slot, block row}` and
its `RGBA32I` ledger metadata supplies the matching altitude support.

The experiment-only shader integration retained production's four hardware-
filtered RGBA reads and changed only the row/slot address. Full-frame
production/shared pairs at 32.461, 61.991, and 89.958 degrees solar zenith had
a maximum display-code difference of one and a p99 difference of zero. Five
arbitrary scenario times (`0, 5, 10, 15, 20` seconds) drove one explicit Sun,
camera-follow, nearest-degree cache, production Sun-tile placement,
endpoint-light direction, and Q10 state and produced distinct PNGs. Each
checkpoint completed at least one new atmosphere frame. The published Sun
center was `[960, 540]` within a maximum floating-point projection error of
`2.274e-13` pixels across the five states.
The run's artifact-set identity is
`1af5b56c38b4ba1e94cdfed27eedb587912a5a5c3e02d55588a0756026835b36`.
This completes S9.2 but does not measure animation cadence; S9.3 owns that
measurement. The verified 24-layer sliding-window contingency remains
available if another target cannot allocate the whole-route packet atlas.

Run `1788915844404-s9-shared-packet-renderer` remains valid packet-capacity,
exact-probe, and production/shared equivalence evidence. Its arbitrary-time
captures did not update the separately generated production Sun tile, so its
20-second disk remained about 30 degrees off-axis; it is not S9.2 joint-state
completion evidence. Failed attempts `1788917006123-s9-shared-packet-renderer`
and `1788917024866-s9-shared-packet-renderer` preserve respectively the
sandbox-denied Chrome launch and the initial incorrect wrapper accessor.

Run `1788913166583-s9-whole-route-capacity` is retained as nonaccepted
infrastructure evidence: repository-sandbox policy denied its Chrome process
launch with `spawn EPERM` before GPU work. The accepted retry used the required
real headless Chrome boundary.

## S9.3 Animation Trace Result

Accepted run `1788918482263-s9-animation-trace` exercised the complete
sunrise-to-sunset path for 20.0165 real seconds at 3,840 by 2,160, Q10, and the
production 78-degree vertical FOV. The timed interval performed no recording,
image readback, network transfer, decompression, authentication, packing, or
atlas upload. It submitted 455 frames and closed a valid non-disjoint
`EXT_disjoint_timer_query_webgl2` result for every frame.

Browser callback cadence was 22.681 FPS mean and 19.833 FPS one-percent-low.
The longest visible hold was 50.7 ms; a fixed 60 Hz interpretation contains
1,201 slots with 746 slots lacking a new frame. Shader GPU duration averaged
37.256 ms (37.600 ms median, 38.202 ms p95, 45.096 ms maximum), while outer CPU
submission averaged 1.939 ms and never exceeded 6.8 ms. The path is therefore
GPU-bound at native 4K even at Q10; its visible browser cadence is lower than
the reciprocal of the isolated mean GPU duration because callbacks commonly
arrived on 33.3 or 50.0 ms presentation intervals.

The trace retained 121 initial/changed cache-state publications and 334
repeated cache states, with no skipped cache degree. Transition frames averaged
36.976 ms GPU time, compared with 37.358 ms for stable-cache frames; cache
metadata switching did not create a measurable GPU penalty. Transition
callback intervals averaged 44.723 ms versus 43.862 ms for stable frames, a
small association that does not establish causation. Every frame used the
whole-route resident atlas and matching shader, camera, Sun-tile, and endpoint
light state. The sealed artifact-set identity is
`d7d5a46042ea00124b50bcdb2b7ef4f68130dec8aa7242996ccc4adba8f265b4`.

Diagnostic run `1788918318569-s9-animation-trace` remains nonaccepted. Its
four-query production backlog produced useful preliminary cadence but issued
GPU queries for only 315 of 470 frames. The accepted retry raised only the
diagnostic pending-query capacity to 32, retained that instrumentation fact,
and closed all 455 timer outcomes.

Accepted companion run `1788919164368-s9-animation-trace-fov55` repeats the
same native-4K Q10 trace at a 55-degree vertical FOV. It retained 470 frames,
23.392 FPS mean callback cadence, 19.881 FPS one-percent-low, 37.009 ms mean
shader GPU duration, 1.891 ms mean CPU submission, and a 50.3 ms longest hold,
with complete non-disjoint timing and no WebGL error or context loss. The
55-degree view is retained for its more natural aesthetic framing, not as a
performance optimization. S9.4-S9.6 apply the same replay, rendering, video,
PNG, diagnostic, verification, and provenance requirements to both the
55-degree presentation and the 78-degree wide-angle control. Its sealed
artifact-set identity is
`f2e4389e35999bfeab88e5ca0fb26bf05a3b5209158eb23d4a228faba8469589`.

## S9.4 Presentation Replay Result

Accepted run `1788919958694-s9-presentation-replay` authenticated both S9.3
trace parents and mapped each onto exactly 1,200 rounded 60 Hz slots from 0
through 19.983333 seconds. It also retained an independent equation-driven
ideal mapping at `slotIndex / 1199` for every slot and FOV. No mapping performs
interpolation, rendering, recording, or timing measurement.

The 78-degree trace-faithful mapping uses 454 of 455 measured source frames.
It holds the latest available state in 746 slots, advances by at most one
measured frame at a time, and has a maximum four-slot mapped hold (66.667 ms).
The 55-degree mapping uses 467 of 470 measured source frames. It holds in 733
slots, has a maximum three-slot mapped hold (50 ms), and once advances by two
measured frames because a source callback falls between adjacent output slots.
That jump is retained exactly; no synthesized state conceals it.

The independent verifier reproduced every one of the 4,800 retained mapping
entries from the frozen equations and authenticated traces, checked every
artifact hash, and confirmed a unique accepted terminal state. The sealed
artifact-set identity is
`db3b6283a0e37c9ddeb79be0f447b22367e25499e71aa928ec2c9ff423419105`.

## S9.5 Deterministic Video Result

Accepted run `1788923711177-s9-deterministic-video` rendered the frozen S9.4
ideal and trace-faithful mappings offline for both FOVs. It produced four
fragmented MP4 files, each exactly 3,840 by 2,160, 20 seconds, 60 Hz, and 1,200
frames. H.264 High Profile Level 5.2 (`avc1.640034`) was capability-tested at
40 Mbps variable bitrate with quality latency mode and a 60-frame keyframe
interval. The configuration requests hardware preference; it does not claim
that the browser selected hardware encoding.

Mediabunny 1.55.7, MPL-2.0, is frozen in the run with its bundle, license, and
package-lock hashes. Its fragmented output was streamed to the loopback host
in batches no larger than 4 MiB. The 78-degree ideal and trace videos are
62,395,857 and 41,760,725 bytes; the 55-degree ideal and trace videos are
58,849,017 and 40,578,737 bytes. The trace outputs preserve respectively 454
rendered states with 746 held slots and 467 rendered states with 733 held
slots. Held slots encode a retained 2D copy of the latest completed WebGL
render, so they repeat the intended image without rerunning the shader.

All four browser playback checks reported the declared dimensions and
20-second duration and decoded seeks at 0.1, 10, and 19.8 seconds. The
independent verifier demuxed every file and matched all 1,200 packet
timestamps, durations, key/delta types, and payload sizes to the retained
packet traces. Each video also has five distinct lossless 4K PNG checkpoints;
all 20 passed nonblack pixel probes. The sealed artifact-set identity is
`07c014ba6d0e029b4dc0c35721e013a5b4d662d585bd1c17fbea10fe6d745b01`.

The immutable diagnostic history records why each correction was required.
Run `1788921937834-s9-deterministic-video` stalled on persistent browser-to-host
streaming and was sealed failed after its isolated browser was stopped. Run
`1788922506830-s9-deterministic-video` failed when a muxer fragment exceeded
the transport batch. Run `1788922674433-s9-deterministic-video` self-accepted
before visual inspection exposed black trace-held frames from the
non-preserved WebGL drawing buffer. Run
`1788923064289-s9-deterministic-video` fixed those frames but independent
demuxing exposed a requested Level 5.1 declaration around an emitted Level 5.2
bitstream. None is S9.5 completion evidence. The final run uses bounded
batched transport, a retained presentation buffer, required nonblack probes,
and the verified Level 5.2 declaration.

Visual review confirms that the animation itself works well: the Sun/camera
motion, fixed-cadence replay, and intentional trace holds are readily visible
and coherent. The live application independently shows the same specific
quality defect seen in the videos: sunrise and sunset look somewhat off
overall, with a horizon that is often too gray instead of the expected white
as the clearest symptom. Live reproduction rules out deterministic replay and
video encoding as the root cause. Whether the defect comes from cache
selection/data or the cache-consuming renderer remains unresolved and is
deferred for a focused cache/horizon investigation. The current result is
sufficient for the Bruneton/cache-animation tests and does not invalidate the
S9.5 animation-pipeline, mapping, container, or playback claims. S9.6
discloses it rather than misattributing it to encoding or measured animation
hitching.

Project-owner visual review accepts the native-4K animation as smooth enough
for the intended large-display use. This is an experience-level acceptance of
the measured trace-faithful playback, including its retained holds; it is not
a claim that the renderer sustained 60 FPS. The governing performance facts
remain the S9.3 browser callback, GPU timer, and hold measurements.

Official closure will not preclude later recording requests. Any post-close
recordings will be new contained derivatives of the sealed evidence, with new
run identities and complete parent provenance; they will not reopen S9 or
silently change its accepted claims.

## S9.6 Published Evidence Result

Accepted run `1788926658377-s9-published-evidence` packages exact copies of all
four clean 4K videos, both raw frame traces, all four replay mappings, packet
traces, 20 lossless checkpoints, the frozen control, environment and command
records, hashes, and parent metadata. Its synchronized 55-degree and 78-degree
diagnostic players expose all 1,200 presentation slots with source frame,
hold-group, cache-transition, callback, GPU, and CPU attribution. Six
annotated screenshots retain browser-decoded evidence at 0.1, 10, and 19.8
seconds for both FOVs.

The independent verifier authenticated every copied byte against its sealed
parent, reconstructed timeline relationships, checked every screenshot,
demuxed all four MP4 files as 3,840-by-2,160, 20-second, 1,200-packet H.264
High Level 5.2 streams, and confirmed a unique accepted terminal state. The
artifact-set identity is
`2d9411657a439dd3691235b11a6b715dcce5d89a19b896fcd90ec701fbab25a3`.

Runs `1788926206410-s9-published-evidence` and
`1788926224232-s9-published-evidence` preserve respectively the sandbox-denied
Chrome launch and an invalid generated diagnostic script. Run
`1788926419309-s9-published-evidence` passed its programmatic checks but is
superseded after visual review found literal newline escapes in the legend.
All remain immutable and are not completion evidence.

## S6 Final Audit And S7 Decision

Accepted audit run `1788926996374-s6-final-audit` executed ten canonical
verifiers in fresh Node processes across S3, S4, S5, and S9. Its separate
meta-verifier reran all ten and reproduced every accepted output. The audit
classifies the chain as accepted contained-experiment evidence and confirms
exact samples, lifecycle safety, bounded residency, no hidden dense-scene
atlas on the shared path, complete native-4K timing, deterministic replay, and
traceable viewable publication. Its artifact-set identity is
`6c47921957ff4903fce20105bd5a655c2a6d92c1484ebd479e24a29518fdbf7f`.
Run `1788926960191-s6-final-audit` remains nonaccepted infrastructure
evidence because the repository sandbox denied its first child verifier
process; it made no evidence classification.

S7 selects recommendation rather than rejection, iteration, or an
animation-incomplete classification. The final
[decision](decision.md) recommends a separately authorized production design
for GPU-resident shared-block distant-Sun cache animation. It does not modify
or authorize production. The remaining S8 candidates and S9.7 are deferred,
and the live sunrise/sunset horizon-quality issue remains explicit.

## Reusable Animation-Evidence Toolkit

Post-close R0 extracted and released the repository-owned
`scripts/animation-evidence/` toolkit at version `1.0.0`. It owns generic
trace collection, GPU/CPU sample association, fixed-cadence mapping,
deterministic canvas replay, WebCodecs probing, caller-injected Mediabunny MP4
output, bounded chunk streaming, diagnostics, and artifact verification.
Algorithm32 solar, camera, cache, packet, shader, scene, and quality policy
remain caller adapters.

The toolkit has no runtime dependency on this experiment. `origin.json` and a
small derived FOV-55 trace fixture preserve the source hashes, accepted run
identities, derivation, and allowed differences. Seven destination-owned
behavior/failure checks and strict JavaScript type checking pass. Real Chrome
qualification run `tmp/animation-evidence/1788929186108-browser-compatibility`
encoded an AVC High probe frame and has artifact-set identity
`9e00c107d041cc56c7b172e527848ea55fb030920d4a92225a099239e5712802`.
The sealed native-4K AVC/fragmented-MP4 oracle was also reverified unchanged as
run `1788923711177-s9-deterministic-video`, artifact set
`07c014ba6d0e029b4dc0c35721e013a5b4d662d585bd1c17fbea10fe6d745b01`.
