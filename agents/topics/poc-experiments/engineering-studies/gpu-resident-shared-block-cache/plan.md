# GPU-Resident Shared-Block Cache Experiment Plan

## Acceptance Gate

Can a shader-addressable shared-block atlas preserve exact cache samples while
retaining a predicted angular animation window and reduce adjacent-scene switch
work relative to dense-scene reconstruction?

An accepted result must be derived in a new immutable run, preserve all
comparison inputs, and demonstrate the atlas path on the qualifying browser/GPU
without modifying production or the prior experiment.

## S0 - Freeze The Comparison Contract

Goal: make the first proof reproducible and prevent a favorable sequence from
being selected after observing results.

- [x] Pin C0, E1, E2, E3, and D0 run IDs, artifact-set hashes, and the exact
  candidate graph/metadata artifacts used as read-only inputs.
- [x] Pin browser, GPU renderer, Node, WebGL capabilities, decoder identity,
  and relevant source-file identities.
- [x] Define a fixed animation sequence containing forward neighboring steps,
  a reverse step, a prediction miss, a cold start, and a repeat selection.
- [x] Define the sample-probe coordinates, values, and byte/value comparison
  method shared by dense and atlas paths.
- [x] Define the same start/end residency state, transfer conditions, and
  timing boundaries for both paths.

Completeness: one checked-in control document names every immutable input,
sequence item, probe set, resource budget, and comparison rule. It must state
which facts are inherited from C0--E3 and which are newly measured.

S0 status: complete. Its frozen facts are in
[`s0-s2-animation-atlas-contract.json`](../../../../../experiments/gpu-resident-shared-block-cache/controls/s0-s2-animation-atlas-contract.json).

## S1 - Specify The Shader-Addressable Cache Contract

Goal: turn the storage graph into an executable atlas/lookup design without
silently reconstructing dense scenes.

- [x] Choose and document the decoded atlas representation: texture array or
  atlas, scalar format, block dimensions, block slot identity, and maximum
  addressable resident blocks.
- [x] Define the per-scene lookup representation from logical sample
  coordinates to block ID, block row, wavelength, and direction index.
- [x] Specify the shader addressing equation and exact seam/direction mapping.
- [x] Define atlas allocation, slot reuse, eviction, and frame-boundary
  publication rules.
- [x] Define the CPU/Worker boundary: Zstandard decompression and inverse
  shuffle remain outside the shader; only authenticated decoded blocks upload.

Completeness: the design has one unambiguous address calculation and one
ownership rule for each block slot. It identifies every buffer/texture lifetime
and proves that neither shader path requires a full dense scene texture.

S1 status: complete. The selected texture-array address equation, slot
publication, and CPU/Worker boundary are frozen in the S0--S2 contract.

## S2 - Define Prediction And Animation Residency

Goal: make prefetch behavior measurable rather than assuming forward motion.

- [x] Select an explicit predictor from the requested angular direction and
  velocity, including its prediction horizon and maximum look-ahead scenes.
- [x] Define a bounded GPU-residency budget and a separate bounded CPU decoded
  block budget.
- [x] Define prefetch priority, request coalescing, duplicate suppression, and
  cancellation rules.
- [x] Define behavior for reverse direction, abrupt target change, cache miss,
  failed decode/upload, and context loss.
- [x] Define a frame-boundary handoff that preserves the last-good atlas lookup
  until the replacement is complete and authenticated.

Completeness: each sequence item from S0 has an expected predictor action,
required/resident/prefetched block set, and failure or cancellation outcome.

S2 status: complete. The first proof uses a 24-layer GPU budget, one-scene
look-ahead, pinned current/predicted lookups, and the declared reverse/miss
controls.

## S3 - Build A Contained Proof Host And Runner

Goal: implement the smallest isolated browser proof; production code remains
read-only.

- [x] Create authored browser, host, runner, and verifier surfaces only below
  `experiments/gpu-resident-shared-block-cache/`.
- [x] Real-path-check the frozen D0 parent/control reads and new-run output
  writes; reject
  symlinks, junctions, escaped paths, and mutation of parent evidence.
- [x] Allocate a new run directory and write command, input, provenance,
  environment, progress, artifact, and terminal records.
- [x] Use a loopback-only browser host with an allowlisted file surface and
  bounded request bodies.
- [x] Implement dense and atlas paths with the same probes and browser/GPU.
- [x] Record progress at every phase transition and at least every 30 seconds
  for any long operation.

Completeness: static checks pass, the runner refuses invalid boundaries, no
generated file exists below the source root, and the output root is the sole
generated destination. Do not add an experimental unit-test tree; use focused
self-verifying proof runners.

S3 status: complete. The host/runner boundary and common dense/atlas probe
interface are browser-qualified by `1788886953998-s3-atlas-host-smoke`. It
establishes WebGL2 texture-array capacity, atlas shader compilation, and an
exact Float32 probe contract (including signed zero). S4 remains responsible
for exercising that contract with authenticated E1 blocks and real atlas
uploads.

## S4 - Prove Exact Atlas Sampling

Goal: establish that shader addressing is value-preserving before assessing
animation performance.

- [x] Decode and authenticate every required block identity before upload.
- [x] Run the S0 probe set against both dense and atlas paths for every
  sequence item.
- [x] Compare values with the declared exact comparison method and report all
  differences, including seam and dark-boundary probes.
- [x] Verify that a published atlas lookup references only resident,
  authenticated slots.
- [x] Inject corrupt block, missing slot, failed upload, and stale publication
  controls; verify the last-good result remains active.

Completeness: zero undeclared sample differences, no invalid lookup is
published, and every injected failure has a retained outcome record.

S4 status: complete under the separately frozen v2 contract. Run
`1788887946682-s4-exact-atlas` authenticated 34 real E1 blocks and passed all
486 exact Float32 shader probes with zero mismatches. It retained accepted
corrupt-block, missing-slot, injected failed-upload, and stale-publication
controls. The prior v1 mismatch run remains nonaccepted evidence.

## S5 - Measure Animation Switching And Resources

Goal: determine whether prediction and reuse reduce the work that blocks rapid
animated switching.

- [x] For dense and atlas paths, record per-sequence-item required, reused,
  decoded, uploaded, and evicted block counts and bytes.
- [x] Record CPU queue/decode/inverse-shuffle time, GPU upload time,
  shader/frame-boundary switch latency, and end-to-end selection latency.
- [x] Record GPU atlas bytes, CPU decoded bytes, encoded transfer bytes, peak
  browser/Worker/Node memory, request concurrency, and predictor hit/miss
  outcomes.
- [x] Compare cold, adjacent-forward, reverse, prediction-miss, and repeat
  cases against the same dense-path conditions.
- [x] Identify whether an adjacent step can reuse the expected shared-block
  set without reconstructing or uploading a dense scene.
- [x] Add encoded transfer, decoder queue, Zstandard/inverse-shuffle,
  publication, peak-memory, and predictor-outcome instrumentation to S5.
- [x] Use a declared tiled dense GPU baseline when a scene exceeds one 2D
  texture's dimension limit.

Completeness: the immutable run contains raw per-event records and a summary
that distinguishes measured wall time from concurrent sub-operation sums. The
comparison states the residency budget and predictor horizon used for every
claim.

S5 status: complete. Predictive animation run
`1788907211015-s5-animation-measurement` is the canonical S5 measurement.
Apples-to-apples 4K lookup run
`1788906789532-s5-production-cache-contribution-4k` separately bounds the
runtime cost of production-compatible shared-block slot indirection.

## S6 - Verify And Classify Evidence

Goal: ensure the result is trustworthy, bounded, and does not conceal a
lifecycle or capacity cost.

- [x] Independently verify the sealed run's artifact set, provenance chain,
  terminal result, progress closure, and output containment.
- [x] Re-authenticate parent run identities without reopening or altering them.
- [x] Confirm the proof did not create a full dense per-scene texture on the
  atlas path except where the explicitly declared dense baseline requires it.
- [x] Record rejected or incomplete alternatives, prediction failure behavior,
  and any resource limit that prevents animation use.
- [x] Update the status with the accepted/rejected run identity, exact
  measurements, remaining uncertainty, and next action.

Completeness: a reader can reproduce the decision from sealed artifacts and
the topic status alone; an incomplete or failed run is retained only as
nonaccepted evidence.

S6 status: complete. Independent audit run
`1788926996374-s6-final-audit` executed ten canonical verifiers in fresh Node
processes and classified the evidence as accepted contained-experiment
evidence. Its meta-verifier reran every check and authenticated artifact set
`6c47921957ff4903fce20105bd5a655c2a6d92c1484ebd479e24a29518fdbf7f`.
Run `1788926960191-s6-final-audit` is preserved nonaccepted infrastructure
evidence: the repository sandbox denied its child verifier process before any
check completed.

## S7 - Decide The Next Boundary

Goal: make one explicit outcome without turning experiment findings into
unreviewed production architecture.

- [x] Evaluate rejection: not selected because exactness and every declared
  publication/lifecycle control passed.
- [x] Evaluate iteration: not selected because the bounded predictor reduced
  adjacent-switch work and the whole-route prepared path supported animation.
- [x] Retain the sealed contained evidence and its explicit claim boundaries.
- [x] Recommend a separately authorized production design because exactness,
  lifecycle safety, bounded residency, and meaningful adjacent-switch reuse
  are demonstrated and the trace-faithful native-4K animation is accepted for
  the intended large-display use.

Completeness: the conclusion names the supporting run, rejected alternatives,
operational capacity requirements, and any production work still requiring
separate authority.

S7 status: complete. The accepted outcome is recorded in
[decision.md](decision.md). Production promotion remains separately owned and
unauthorized by this contained conclusion.

## Promotion Boundary

Experiment results are evidence, not production architecture. Promotion
requires a separate production-owned design, implementation plan, and
verification boundary.

## S8 - Improve Steady-State 4K Runtime

Goal: identify a materially faster steady-state rendering design after S5
showed that shared-block indirection itself is not the dominant frame cost.

- [x] Measure the unchanged live production pass at interleaved Q30, Q24, Q20,
  Q15, and Q10 counts with true 4K GPU timer queries.
- [x] Preserve native-4K Q30/Q24/Q20/Q15/Q10 captures and quantify their
  display-code differences without UI overlays.
- [x] Render Q30 and Q24 through the production scene/cache path at San Jose
  pre-sunset, sunset, civil, nautical, astronomical, and configured-dark
  states; preserve raw images, amplified differences, and an overview plate.
- [x] Measure unchanged Q30 at native 4K, 1440p, and 1080p internal raster
  sizes, interleaving native 4K controls.
- [ ] Qualify Q24 against the retained spectral/physical comparison boundary
  across daylight, sunset, civil, nautical, astronomical, ground, atmosphere,
  and object-shortened endpoints.
- [ ] Build and measure a 4K presentation prototype that evaluates atmosphere
  below native resolution while retaining native-resolution celestial/scene
  content and depth-aware reconstruction.
- [ ] Build and measure a native-4K RGBA-packet transport candidate that avoids
  exploding four cache packets into 15 scalar shader channels during path
  integration and Color projection.
- [ ] Qualify discrete quality presets provisionally mapped as Ultra/Q30,
  High/Q24, Balanced/Q20, Performance/Q15, and Low/Q10; reject any preset that
  fails its spectral, endpoint, or lighting-regime gate.
- [ ] Prototype an Auto quality policy with motion detection, GPU-frame-budget
  feedback, hysteresis, minimum dwell time, and pop-free refinement back to
  Q30 after the view settles.
- [ ] Keep atmosphere render scale independent from the path-quality presets
  and verify that its reconstruction retains native-resolution celestial,
  scene, silhouette, and depth-boundary content.
- [ ] Select or reject each candidate using GPU time, image/spectral error,
  lifecycle safety, and compatibility with predictive shared-block switching.

Completeness: at least one candidate either demonstrates a reproducible,
quality-qualified material 4K speedup on the reference GPU or is rejected with
enough evidence to identify the next bottleneck. No candidate changes
production before a separate promotion decision.

S8 status: deferred after timing and display-space characterization. Spectral
qualification and the reconstruction, packetization, preset, and Auto-policy
candidates remain retained but incomplete; they do not block this experiment's
cache-animation conclusion.

## S9 - Produce Trace-Driven Animation Evidence

Goal: measure a real 20-second sunrise-to-sunset animation without recording
overhead, then construct viewable evidence that reproduces its measured frame
cadence, including every visible hold and hitch.

S9 became the final execution focus inside this experiment. Its completion is
recorded separately from the explicitly deferred S8 candidates.

### S9.0 - Freeze The Scenario And Evidence Contract

- [x] Freeze the `90 -> 30 -> 90` degree, 20-second solar path, continuous
  camera-follow rule, animation clock, initial quality, output cadence, and
  pre-roll boundary.
- [x] Define the performance trace schema, ideal replay, trace-faithful replay,
  representative PNG set, diagnostic overlay, and comparison rules.
- [x] State that browser-level frame timing is qualifying evidence and exact
  physical-display scanout is outside the experiment.

Completeness: one checked-in control names every state equation, timestamp,
artifact, and acceptance rule needed to reproduce both animation executions.

S9.0 status: complete. The frozen contract is
[`s9-trace-driven-animation-contract.json`](../../../../../experiments/gpu-resident-shared-block-cache/controls/s9-trace-driven-animation-contract.json).

### S9.1 - Prove Whole-Route Preparation Capacity

- [x] Re-authenticate the 61 scene manifests and 62 unique block identities
  used from 30 through 90 degrees.
- [x] Decode and authenticate the complete route during pre-roll and construct
  every scene lookup before playback.
- [x] Attempt the 62-layer, 966,128,640-byte GPU allocation and record browser,
  GPU, allocation, upload, and memory results.
- [x] Freeze and verify a bounded decoded CPU pool and sliding GPU-window
  contingency; select it only if whole-route GPU residency fails.

Completeness: the accepted preparation path contains no undeclared decode,
authentication, metadata construction, or encoded transfer during playback.

S9.1 status: complete. Accepted run
`1788913194598-s9-whole-route-capacity` selected the whole-route scalar spectral
source atlas. The smaller failed predecessor
`1788913166583-s9-whole-route-capacity` records only the sandbox-denied Chrome
launch and is nonaccepted infrastructure evidence. S9.1 does not qualify the
larger production-compatible RGBA packet surface owned by S9.2.

### S9.2 - Integrate The Animation Render Path

- [x] Connect production-compatible RGBA shared-block slots and row-to-slot
  metadata to a contained full rendering pass.
- [x] Allocate and populate the exact whole-route RGBA packet shape, including
  four-packet padding of the 15 spectral channels; do not infer its capacity
  from S9.1's smaller scalar source atlas.
- [x] Drive the Sun, camera, cache lookup, and quality setting from one explicit
  deterministic frame state.
- [x] Preserve nearest-integer cache switching as the initial temporal control.
- [x] Verify full-scene output against retained production-path probes and
  representative PNG controls.

Completeness: the same contained renderer accepts arbitrary scenario times for
real-time measurement and deterministic offline replay without importing the
experiment into production.

S9.2 status: complete. Accepted run
`1788917159050-s9-shared-packet-renderer` allocated and populated the exact
1,110,786,048-byte packet atlas, passed 248 wavelength-major and padding
probes, matched three full production-path controls within one display code,
and rendered five deterministic arbitrary-time states whose production Sun
tile, endpoint-light direction, camera, cache selection, and shader direction
came from the same explicit state. Every checkpoint published the Sun at the
camera center and completed a new atmosphere frame. It also corrected the S9.1
probe runner's row/wavelength coordinate order; S9.1 remains capacity evidence,
not semantic coordinate evidence. Earlier run
`1788915844404-s9-shared-packet-renderer` remains packet/equivalence evidence
but is not S9.2 completion evidence because its arbitrary-time Sun tile retained
the startup direction.

### S9.3 - Record The Unencoded Real Animation Trace

- [x] Run the scenario in real wall-clock time without video encoding or image
  readback.
- [x] Associate each frame ID with requested and callback timestamps, complete
  animation state, CPU submission time, GPU timer-query duration, disjoint
  status, and cache/prefetch/publication events.
- [x] Retain late, skipped, repeated-state, cache-transition, and quality-change
  outcomes rather than summarizing them away.
- [x] Record aggregate cadence, one-percent-low cadence, longest visible hold,
  missed presentation slots, and hitch attribution.

Completeness: every submitted frame has a closed timing outcome or an explicit
rejection reason, and the trace covers the complete 20-second wall-clock run.

S9.3 status: complete. Accepted run
`1788918482263-s9-animation-trace` retained all 455 submitted 4K frames over
20.0165 seconds and obtained complete non-disjoint GPU timing for every frame.
At Q10 and the production 78-degree vertical FOV, browser callback cadence was
22.681 FPS mean and 19.833 FPS one-percent-low; mean shader GPU time was 37.256
ms and mean CPU submission was 1.939 ms. The longest visible hold was 50.7 ms,
and 746 of 1,201 fixed 60 Hz presentation slots lacked a new frame. No cache
degree was skipped, and transition frames showed no GPU penalty relative to
stable-cache frames. Diagnostic run `1788918318569-s9-animation-trace`
retains the original four-pending-query limit and is nonaccepted because it
issued GPU queries for only 315 of 470 frames.

Companion accepted run `1788919164368-s9-animation-trace-fov55` repeats the
same trace at a 55-degree vertical FOV for preferred aesthetic framing. It is
not an optimization candidate. Both the 78-degree wide-angle control and the
55-degree preferred presentation advance through the remaining S9 steps with
the same evidence and verification requirements.

### S9.4 - Construct The Presentation Replay

- [x] Map both the 78-degree and 55-degree real traces onto separate 1,200
  fixed 60 Hz presentation-slot sequences.
- [x] Hold the most recently available frame across missed slots and preserve
  the measured positional jump when the next frame becomes available.
- [x] Construct a corresponding evenly timed ideal mapping for each FOV over
  the same scenario.
- [x] Verify the mappings are deterministic and retain their source trace
  identity.

Completeness: every output slot for both FOVs names one source state and
equation; no replay interpolation can hide a measured hitch.

S9.4 status: complete. Accepted run
`1788919958694-s9-presentation-replay` authenticated both S9.3 parents and
retained separate ideal and trace-faithful 1,200-slot mappings for each FOV.
The 78-degree mapping uses 454 of 455 measured frames, holds a prior state in
746 slots, and has a maximum four-slot/66.667 ms mapped hold. The 55-degree
mapping uses 467 of 470 measured frames, holds a prior state in 733 slots, and
has a maximum three-slot/50 ms mapped hold. Its maximum measured-frame advance
is two, preserving rather than interpolating over the skipped source frame.
The independent verifier reproduced all 4,800 mapping entries from the frozen
equations and authenticated source traces. The artifact-set identity is
`db3b6283a0e37c9ddeb79be0f447b22367e25499e71aa928ec2c9ff423419105`.

### S9.5 - Render And Encode Deterministically

- [x] Re-render each required source state for both FOVs offline, waiting for
  completion without advancing the logical clock.
- [x] Capability-test WebCodecs at 3840 by 2160 and freeze a supported codec,
  profile, rate-control mode, color configuration, and keyframe policy.
- [x] Add an experiment-local muxer with frozen version/license identity and
  stream bounded encoded chunks to the loopback host.
- [x] Retain representative lossless PNG frames for both FOVs so lossy video is
  not the only image-quality evidence.

Completeness: playable ideal and trace-faithful videos for both FOVs have the
declared 4K dimensions, 20-second duration, 60 Hz timeline, monotonic
timestamps, bounded artifact transport, and complete codec/muxer provenance.

S9.5 status: complete. Accepted run
`1788923711177-s9-deterministic-video` produced four independently verified
3,840-by-2,160, 20-second, 60 Hz fragmented MP4 videos: ideal and
trace-faithful versions for both 78 and 55 degrees. It selected H.264 High
Profile Level 5.2 (`avc1.640034`), 40 Mbps variable bitrate, quality latency
mode, and a 60-frame keyframe interval. Mediabunny 1.55.7 (MPL-2.0) is frozen
as the experiment-local muxer. Transport was bounded to 4 MiB batches.

Each video contains exactly 1,200 monotonic packets and 20 key packets. The
trace videos preserve the S9.4 mappings: 454 rendered states plus 746 held
slots at 78 degrees, and 467 rendered states plus 733 held slots at 55
degrees. Five distinct lossless 4K PNGs per video passed nonblack pixel probes.
Browser playback confirmed dimensions, duration, and seeks at 0.1, 10, and
19.8 seconds; an independent Mediabunny demux reproduced every retained
packet timestamp, duration, type, and payload size. The artifact-set identity
is `07c014ba6d0e029b4dc0c35721e013a5b4d662d585bd1c17fbea10fe6d745b01`.

Four immutable diagnostic attempts precede the accepted run. Run
`1788921937834-s9-deterministic-video` exposed a stalled persistent request
stream and was sealed failed after its isolated browser was stopped. Run
`1788922506830-s9-deterministic-video` exposed an oversized atomic muxer
fragment. Run `1788922674433-s9-deterministic-video` exposed black repeated
frames from a non-preserved WebGL canvas. Run
`1788923064289-s9-deterministic-video` corrected the held-frame path but
declared H.264 Level 5.1 while the emitted bitstream was Level 5.2. They remain
preserved as noncompletion evidence. The accepted path retains each new WebGL
render in a 2D presentation buffer before repeated-slot encoding and declares
the verified Level 5.2 bitstream identity.

Project-owner review accepts the trace-faithful native-4K result as smooth
enough for the intended large-display use. This does not replace the retained
S9.3 timing data or assert sustained 60 FPS; it establishes that the measured
cadence and visible holds meet the experiment's practical animation goal.

### S9.6 - Publish And Verify The Evidence Set

- [x] Produce clean ideal-timing and trace-timing videos plus annotated
  diagnostics for both FOVs with frame time, solar zenith, cache identity,
  quality, and hitch markers.
- [x] Preserve the raw trace, replay mappings, representative PNGs, animation
  control, environment, commands, and hashes in one immutable run.
- [x] Decode and inspect the finished videos; verify dimensions, duration,
  cadence, timestamps, frame mapping, trace identity, and terminal manifest.
- [x] Record encoding limitations such as chroma subsampling or color
  conversion separately from renderer differences.
- [x] Record the live-app observation that sunrise/sunset rendering is
  somewhat off overall, with a horizon that is often too gray instead of the
  expected white as its clearest symptom. Treat it as a deferred cache/render-
  quality issue, not an animation-pipeline or encoding failure; the current
  output remains sufficient for the Bruneton/cache-animation tests.

Completeness: a reader can view every measured hitch for either FOV, trace it
back to the responsible runtime event, and reproduce all videos without
treating the recording execution as performance evidence.

S9.6 status: complete. Accepted publication run
`1788926658377-s9-published-evidence` copies the four exact clean videos, two
raw traces, four mappings, packet traces, lossless checkpoints, controls, and
parent metadata into one immutable evidence set. Its synchronized local
diagnostic players expose all 1,200 slots per FOV with hold, cache-transition,
source-frame, callback, GPU, and CPU attribution. Independent browser decode
checks and MP4 demux verification passed. The artifact-set identity is
`2d9411657a439dd3691235b11a6b715dcce5d89a19b896fcd90ec701fbab25a3`.

Nonaccepted run `1788926206410-s9-published-evidence` preserves the initial
sandbox-denied Chrome launch. Run
`1788926224232-s9-published-evidence` preserves the invalid generated-script
diagnostic. Run `1788926419309-s9-published-evidence` passed technical checks
but is superseded because visual review found literal newline escapes in its
legend. None is S9.6 completion evidence.

### S9.7 - Test Temporal Cache Interpolation

- [ ] After sealing the hard-switch control, implement a spectral interpolation
  candidate using the two neighboring authenticated scene lookups.
- [ ] Repeat representative daylight, sunrise, noon, and sunset segments with
  identical scenario timing.
- [ ] Compare temporal stepping, spectral/display error, atlas capacity, and
  shader cost against the sealed hard-switch control.

Completeness: retain or reject interpolation from measured temporal and
spectral evidence; do not replace the control or silently smooth its video.

S9.7 status: deferred. The hard-switch animation is accepted for the current
goal; temporal interpolation remains a future visual-quality candidate.

S9 status: core animation evidence complete through S9.6. S9.7 is a deferred
extension and does not block closure.

Post-close recording policy: completing and sealing S9 does not prevent later
recording variants. Recordings requested after official experiment closure
must be produced in a new contained derivative lane, read the sealed S9
artifacts without modification, retain their parent hashes and derivation
operation, and write new immutable runs. Additional aesthetic, FOV, duration,
or lighting variants do not revise the accepted performance or animation
conclusion unless a separately frozen qualification contract says otherwise.

## R0 - Extract A Reusable Animation-Evidence Toolkit

Goal: after the experiment is concluded, preserve its general tracing,
trace-driven replay, video construction, and verification machinery in an
authorized reusable owner without turning experimental evidence into a runtime
dependency.

R0 is post-experiment work. It must not begin by moving or modifying this
experiment, and it requires a separately approved destination and governing
standards before writes occur outside the contained experiment boundary.

### R0.0 - Classify Reusable And Experiment-Specific Code

- [x] Identify generic trace collection, GPU-query association, presentation
  mapping, deterministic replay, encoding, chunk streaming, diagnostic
  composition, and artifact-verification modules.
- [x] Identify Algorithm32-specific solar, camera, cache, packet-addressing,
  shader, scene, and quality-policy adapters that must remain outside the core.
- [x] Record every experimental shortcut or assumption that cannot become a
  reusable contract.

Completeness: every extracted candidate has one declared generic contract and
no implicit dependency on Algorithm32 paths, run IDs, or cache schemas.

### R0.1 - Select And Authorize The Destination

- [x] Decide whether the reusable owner is repository-local tooling or a
  separately versioned package.
- [x] Load and apply the standards governing the selected destination.
- [x] Freeze dependency versions, codec/container support policy, licenses, and
  browser/runtime compatibility requirements.
- [x] Approve the destination's source, generated-output, and release
  boundaries before copying code.

Completeness: one approved design names ownership, public contracts,
dependencies, compatibility, outputs, and release responsibility.

### R0.2 - Extract Through Explicit Adapters

- [x] Copy or adapt the generic modules without importing the experiment or
  sealed runs at runtime.
- [x] Define adapters for animation state, frame rendering, GPU timing, encoded
  chunk sinks, diagnostic overlays, and evidence manifests.
- [x] Replace experiment constants and filesystem assumptions with validated
  caller-owned configuration.
- [x] Retain the originating experiment, accepted run, source identity, and
  derivation operation in the extraction record.

Completeness: the reusable core can drive a synthetic animation with no
Algorithm32 or cache-specific imports.

### R0.3 - Qualify The Extracted Toolkit

- [x] Reproduce a small retained trace/replay fixture derived from sealed S9
  evidence without mutating its parent.
- [x] Verify fixed-cadence holds, timestamp mapping, deterministic replay,
  bounded streaming, codec/container finalization, and artifact identities.
- [x] Run destination-owned behavioral, compatibility, and failure-path checks
  under its governing test standards.
- [x] Compare the extracted output with the sealed experimental oracle and
  explain every allowed difference.

Completeness: destination-owned verification proves equivalent generic
behavior and preserves the complete derivation chain.

### R0.4 - Document And Release

- [x] Document installation, supported browsers/codecs, adapter contracts,
  evidence limitations, performance-versus-recording separation, and example
  use.
- [x] Publish a versioned reusable release or repository-owned tool entrypoint.
- [x] Link back to the immutable experimental evidence without making it a
  runtime dependency.

Completeness: another animation experiment can adopt the toolkit from its
public documentation and produce independently verifiable evidence.

R0 status: complete. Repository-owned toolkit `scripts/animation-evidence/`
is released at version `1.0.0` with no third-party runtime dependency. Its
accepted real-browser qualification is
`tmp/animation-evidence/1788929186108-browser-compatibility`, artifact set
`9e00c107d041cc56c7b172e527848ea55fb030920d4a92225a099239e5712802`.
The destination-owned seven-check behavioral suite and strict typecheck pass,
and the sealed native-4K AVC/MP4 oracle
`1788923711177-s9-deterministic-video` reverified with artifact set
`07c014ba6d0e029b4dc0c35721e013a5b4d662d585bd1c17fbea10fe6d745b01`.
