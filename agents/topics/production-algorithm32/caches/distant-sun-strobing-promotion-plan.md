# Strobing Correction Production-Promotion Plan

Status: active production Algorithm32 work. P0 controls are established;
P1 implementation and focused checks are recorded. P2 physical and Bruneton
qualification passes, including the full matrix. P3 appearance artifacts are
accepted by the owner, and its 80-path source-review unit is complete. Broader
coupled numerical source and experiment release reviews remain open in P4.
Publication has not started.
[Promotion status](distant-sun-strobing-promotion-status.md) owns current phase,
readiness, and next actions. The
[experiment status](../../poc-experiments/engineering-studies/distant-sun-recording-strobing/status.md)
owns the inherited scientific findings, remaining source recurrence failure,
review evidence, and animation links.

## Intended Result

Promote the experimental cache and color corrections into their production
owners. Qualify the new cache generation and interpolation through the Bruneton
tests, using Bruneton's own unchanged color model. Qualify the p2 color response
separately through production color and animation checks.

Preserve Native15/N4 application quality, exact cache knots, coherent source
and receiver lighting, and the admitted two-atlas resource ceiling. Real-time
animation and a new frame-rate target are outside this plan; resource and
lifecycle correctness remain required.

Preserve the POC's demonstrated strobing improvements as a behavioral
requirement. Its selected four-metre surface estimate, cubic cache lookup,
physical-light interpolation, and p2 response remain the comparison baseline.
Numerical refinements are separate candidates: improved physical accuracy
does not establish behavioral equivalence. Before selecting a replacement,
compare matched daytime, sunrise, and sunset diagnostics against the selected
POC correction, followed by P3's original-film and recurrence gates. Retain the
POC's known early-ground source recurrence failures explicitly; do not confuse
preservation of demonstrated improvements with closing those failures.

The four-metre ground-row estimate is provisional until full-spectrum physical
qualification passes. The early ground events at publications 112 and 125
remain an unresolved source recurrence failure. The color-delta proof does not
close that separate gate.

## Production Owners

Paths below are repository-relative. Adapt equations and contracts to the
production owners; runtime code must not import the experiment, its generated
implementation, bundle patches, or experiment-local dependencies.

| Change                                     | Owner and integration                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stable sphere roots and surface evaluation | `scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js`, compiler-input types, offline compiler, and generation package owners. Introduce an explicit versioned numerical policy carrying the surface-limit height and relevant intersection tolerance. Keep the current policy identifiable for controls and rollback.                                               |
| Monotone cubic solar-angle lookup          | `src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCache.js` and its shader/packet contracts. Preserve exact knots, shared tangents, finite nonnegative monotone intervals, and spatial/directional sampling. Derive dimensions and endpoints from executable contracts rather than copying hardcoded experiment dimensions.                                               |
| Complete interpolation support             | `DistantSunSharedCacheController.js`, retention, atlas, metadata, and runtime-contract owners in the same directory. Require and protect the complete cubic stencil before atomic publication. Prediction cannot evict required support. Revalidate the experiment's 20-of-24 layer result for the generated production package.                                                          |
| p2 color response                          | Add a named successor under `src/algorithm32/implementation/`, recommended identity `color-reset-slope-078-p2`. Wire exports, `src/flat32/Flat32ColorDisplayModel.js`, `Flat32ProductionSelections.js`, `index.js`, types, and color-dependent resource identities. Preserve p9 and Basic Bruneton as explicit controls.                                                                  |
| Offline physical-light interpolation       | Put the The Hours scenario adapter under `scripts/flat32/`, using `scripts/animation-evidence/`. The one-second measured-light interpolation belongs to the creative harness. Preserve exact-time direct spectra and interpolate measured diffuse spectra/adaptation there. Verify ordinary application lighting publication through `ModeController` and `Flat32Application` separately. |
| Measurement and release                    | Production qualification tooling owns native-pixel measurements and recording evidence. Existing cache generation/publication owners and `server/flat32/features/shared-cache/selection.js` own the authenticated candidate package and eventual selection.                                                                                                                               |

The p2 model keeps the boost amplitude, 980-lux pivot, low-light adaptation,
spectral projection, and display encoding. Intermediate brightness changes
intentionally. CPU and generated GLSL must share versioned constants. This
change does not alter Bruneton's independent color model.

## P0 - Pin Controls And Acceptance Policies

- [x] Activate this production-owned plan and topic, and declare the production
      source and generated-output boundaries below.
- [x] Establish production reviewer readiness through the topic-refresh lifecycle
      and capture a code-review baseline before implementation edits. Preserve
      pre-existing dirty work. Topic setup has its own documentation baseline;
      it does not substitute for the implementation baseline.
- [x] Authenticate the selected experiment mechanisms and original The Hours
      choreography through the [evidence index](../../poc-experiments/engineering-studies/distant-sun-recording-strobing/status.md#evidence-authorities).
      Preserve every original, rejected candidate, and historical Star artifact.
- [x] Pin current production source, deployed cache, numerical policy, benchmark
      inputs, tool versions, and test results. Establish matched unchanged
      controls before comparing candidates.
- [x] Record distinct complete profiles for the Native15 application and the
      direct-40 Bruneton/B-family benchmark. Both currently disable ozone, but
      their spectra, ground, and sampling profiles differ.
- [x] Register full-spectrum surface-error tolerances before candidate scoring,
      using absolute floors near zero and relative errors elsewhere. Cover all
      application channels and benchmark coordinates, the surface and first
      altitude intervals, daylight and both horizons, upward/grazing/ground-hit
      directions, and N1 through cumulative N4. Retain worst cases and per-channel
      results alongside aggregates.

Gate: reproducible controls, explicit identities, fixed acceptance policies,
and a captured review unit. Outstanding experiment review/audit and owner
inspection remain release gates while adaptation and diagnosis proceed.

## P1 - Adapt Cache Generation, Interpolation, And Inputs

- [x] Implement the versioned compiler policy and explicit four-metre candidate.
      Compare 2/4/8-metre surface limits with a numerically stronger binary64 or
      independent reference over the P0 matrix. Refine surface classification or
      representation if the physical error bound fails.
- [x] Implement cubic sampling together with complete required-stencil residency.
      Verify exact knots, shared tangents, monotone intervals, supported endpoints,
      forward/reverse traversal, and coherent publication. One-sided slopes apply
      only at declared physical support boundaries; missing interior support
      cannot silently select a fallback.
- [x] Thread the numerical policy through the direct-40 asset compiler,
      benchmark adapter, and `verify-bruneton-production.js`. Candidate results
      must identify the selected policy and freshly generated asset hashes.
- [x] Extend qualification input selection. The current
      `qualify-shared-runtime.js` pins a historical P2 package and accepts no
      candidate-package argument. Add authenticated package/profile selection
      while retaining its existing control mode.
- [x] Ensure candidate interpolation is actually exercised by Bruneton
      qualification. The existing compiler verifier evaluates a binary64 CPU Q30
      final view and does not run the application's shared-cache shader. Add a
      matched CPU/reference and GPU comparison using the production cubic lookup
      at fractional solar angles, with Bruneton's unchanged display path.
      A compile-only or integer-knot-only pass cannot qualify interpolation.

Gate: production executes the intended numerical policy and lookup without
experiment runtime dependencies, and focused positive contract checks pass.

## P2 - Run Bruneton And Full-Spectrum Cache Qualification

Numerical qualification passed. The [status](distant-sun-strobing-promotion-status.md#p2-execution)
records the full physical matrix, Native15 GPU interpolation and Q30 proof,
Direct40 composed GPU/CPU comparison, B1-B3 scores, and application publication
evidence. Source-review completion remains batched with P1-P3.

The [benchmark owner](../../poc-experiments/benchmarks/color-reset-production-qualification.md)
defines the fixed B1 boundary; the
[release qualification](../../production-app/release/color-reset-production-qualification.md)
owns accepted B1-B3 results. Bruneton's color model remains unchanged in every
control and candidate comparison. The p2 response is excluded from this phase.

| Gate                                | Required evidence                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compiler and reference tests        | Run `test:algorithm32:point-local-compiler`, `test:algorithm32:bruneton-production`, `verify:algorithm32:compiler-compatibility`, and `verify:algorithm32:bruneton-production`. Preserve legacy-policy reproduction assertions. Exercise the new numerical policy explicitly and report its differences under the registered candidate policy; do not weaken legacy checks or label a legacy-only pass as candidate acceptance. |
| Full B1 directional radiance        | Generate fresh candidate direct-40 GPU assets and all 17 x 81 x 40 values; score the complete registered set. Keep the ceiling `11.820391604126252 mW m^-2 sr^-1 nm^-1`. Compare with accepted RMSE `11.554013953257604` and explain degradation even below the ceiling. Physical scoring bypasses Color; all six figures retain Basic Bruneton.                                                                                |
| B2 and B3                           | Score the same new production manifest, retain separate results, and compare with the accepted release. B2's recorded baseline is `2.406574 W m^-2`; preserve B3/B1 same-run consistency at the existing `1e-6` tolerance.                                                                                                                                                                                                      |
| Interpolation and actual GPU lookup | Use the matched reference/GPU path from P1 at knots, between knots, across scene publications, and in both angular directions. Include near-ground and horizon rays. Retain raw spectral errors and Bruneton-rendered comparisons so the field and lookup changes are both covered. Exact packet encode/decode and packing checks retain zero bit tolerance where the operation is exact.                                       |
| Native15 surface accuracy           | Apply P0's full-spectrum error policy to the actual application field. The earlier single-channel sensitivity proof and an aggregate B1 pass cannot substitute for this check.                                                                                                                                                                                                                                                  |

Existing generation and scoring commands support isolated destinations:

```text
npm run generate:algorithm32:b1-production:gpu -- --output-root <fresh-generation-root>
npm run score:algorithm32:b1-b3-production -- <candidate-manifest> --output-root <fresh-score-root>
```

After P1 input plumbing, record the exact candidate policy/asset arguments.
These templates otherwise use default assets and are not yet complete candidate
commands. Avoid default official result publishers in the candidate loop. The
existing `gate:algorithm32:bruneton-sky-color` also invokes a contained-experiment
color runner and is not the promotion entrypoint.

Gate: candidate B1-B3, full-spectrum surface accuracy, and fractional-angle
reference/GPU interpolation comparisons pass under fixed policies. Diagnose
failures before expensive full-film rendering.

## P2 Near-Ground Resolution Trial

The owner authorized a separate near-ground resolution candidate, conditional
on fitting the existing GPU resource limit. Add altitude samples at 468.75,
937.5, and 1406.25 m to the current Native48 nodes, retaining every original
node. Give the resulting 51-node domain a distinct executable and provenance
identity. Keep the anchored numerical policy, solar-angle cubic interpolation,
physical inputs, spectral profiles, and display controls fixed.

- [x] Recompute the same 109-scene Native15 inventory and complete cubic
      residency. Require no more than 24 layers and the existing 429,981,696-byte
      atlas allocation before generating candidate fields. Check compiler
      texture dimensions against the recorded hardware limits.
- [x] Implement the explicitly selected domain through the existing production
      contracts, compiler, asset, and final-view owners. Preserve exact Native48
      controls and default selections.
- [x] Generate a fresh Direct40 diagnostic and compare the early-time spectra,
      the three identified low-elevation directions, and the current anchored
      Native48 candidate. If the diagnostic supports the refinement, extend it
      to the full 17-condition B1-B3 scores and comparison figures.
- [x] Record measured storage, numerical results, and the scope of GPU checks.
      Any application use requires a freshly generated compatible Native15
      package and actual publication/residency qualification.

The diagnostic execution is complete: capacity fits, but aggregate B1 and B2
worsen despite improved early-time scores. The
[status](distant-sun-strobing-promotion-status.md#near-ground-resolution-trial)
owns exact results, the all-time comparison, figures, and the sealed evidence
index. Focused implementation work is recorded here; the planned coupled
source-review completion gate remains open.

This is a resolution diagnostic, not acceptance of a replacement cache. The
existing P2 evidence continues to qualify its original grid; it does not
qualify the new grid by inheritance. Retain the P3 POC appearance and strobing
preservation gates. Keep the trial index and diagnostics below the
promotion-owned ignored output root. Its compiler children use the existing
ignored `tmp/algorithm32/point-local-cache-compiler/` output boundary and are
authenticated by the trial index. Preserve all parent evidence and retain the
planned coupled source-review milestone. The trial's starting state is captured
separately from prior work.

## P2 12:30 Error Attribution Diagnostic

The owner authorized tracing the worst 12:30 Kider errors through scattering
orders and asked whether directional sampling contributes. This diagnostic
continues the near-ground comparison with unchanged Native48/Native51 physical
profiles, Q30 final integration, solar cubic lookup, W27 outgoing directions,
and reflection-completed Fibonacci 68 incoming directions. It does not select
a replacement or change the POC appearance requirements.

- [x] Rank all 81 directions by measured RMSE and added squared error over the
      registered 31 channels. Trace seven rays: (3,5), (3,6), (0,4), (0,5),
      (3,4), (5,0), and (4,4), covering the worst near-Sun error, low sky,
      improving neighbors, and the exact zenith direction knot.
- [x] Use retained cumulative N4 fields to separate changed values at original
      altitude knots from changed final altitude reconstruction. Evaluate the
      Native51 field through both original and refined altitude stencils while
      retaining all other weights and integration controls.
- [x] Capture only required pure J1-J4 probes for both grids and all Direct40
      channels. Reconstruct Float32 cumulative fields in GPU addition order,
      authenticate cumulative N4 against retained fields, and reproduce the
      selected historical final radiances. Because monotone cubic lookup is
      nonlinear, report successive cumulative-radiance differences as order
      contributions; independently interpolated pure fields are not additive.
- [x] Compare cached first order with continuous binary64 direct scattering at
      the same Q30 points. Isolate outgoing angular reconstruction by evaluating
      analytic first order at the existing altitude/solar knots in the exact
      query direction, retaining the other interpolation weights. Measure
      CPU/GPU first-order evaluator residuals at matched knots. Higher-order
      incoming quadrature remains unchanged and is not qualified by this check.
- [x] Check the existing incoming angular rule against uniform incident
      radiance, where both normalized phase integrals are exactly one. Retain
      the variation across outgoing directions as a manufactured-input
      diagnostic, without treating it as an actual sky correction.
- [x] Retain spectra, path contributions, numerical tables, figures, and a
      concise attribution report with parent, source, tool, control, and output
      identities. Distinguish cache approximation from measurement support and
      shared model assumptions; do not infer accuracy from error cancellation.

Use new sealed runs below the promotion-owned ignored output root and preserve
all parents. Sparse recurrence readback must avoid full-field retention, cache
package regeneration, and repeated full-17 rendering. The task baseline is
`.codex-tmp/review-standards/session-p5WTNi/baseline.json`; the original coupled
P1-P3 source-review baseline and completion gates remain unchanged. Temporary
diagnostic wrappers must be frozen and identified in their execution evidence.

The diagnostic execution is complete. The
[status](distant-sun-strobing-promotion-status.md#1230-error-attribution-diagnostic)
records the measured attribution, exact historical-field reproduction,
figures, source identities, and limits. This bounded result does not close
the coupled source-review or appearance gates.

## P3 - Integrate Color And Qualify The Production Animation

The checked items below record verified functional and artifact outcomes.
Formal implementation completion also requires the final mapped primary/audit
validation linked from the [promotion status](distant-sun-strobing-promotion-status.md).

- [x] Implement the separately versioned p2 model and candidate application
      selection. Verify positive slope of `E * gain(E)` for nonnegative
      illuminance, CPU/GLSL agreement, physical-input bindings, and composed
      scene display. Preserve independent Basic Bruneton tests.
- [x] Adapt offline The Hours controls to production APIs and the existing
      animation toolkit. Preserve measured-light endpoints and exact-time
      direct light. Remove bundle interception and temporary private geometry
      mutation from the production proof path.
- [x] Generate/authenticate the Native15/N4 production package and exercise all
      109 scenes. Revalidate complete cubic support, cache/source/receiver-light
      identity coherence, and the admitted two-atlas byte budget.
- [x] Diagnose and resolve the early ground events with exact native frames and
      physical traces. Preserve the original detector and failure evidence;
      changes in strongest-event ranking do not justify dropping events.
- [x] Repeat daytime, sunrise, and sunset diagnostics through lossless frames,
      independent encoding, and the original recording workflow. Require
      curvature ratios at most 1.5 in every region and the existing
      distinct-publication recurrence gate. Require upper-sky wrong-direction
      excursion at most one mean 0-255 code value over each complete
      89.5-91.5-degree horizon crossing; retain other regional measurements.
- [x] After short diagnostics pass, regenerate the same **The Hours** film:
      3840 x 2160, 60 seconds, 30 fps, 1,800 frames, original seed, geometry,
      camera score, and astronomical timeline. Record promoted changes and
      verify every scene state/presentation slot, source and encoded recurrence,
      both horizons, and decoding consistency.
- [x] Deliver a 1024 x 576 copy, all diagnostic animations, synchronized
      comparisons, and one artifact index. Retain unannotated recordings and
      rejected outcomes. Obtain native-resolution owner inspection. Owner
      acceptance is recorded in the [promotion status](distant-sun-strobing-promotion-status.md#p3-appearance-evidence).

Gate: both physical qualification and production appearance pass, including the
full source recurrence gate. The encoded-only pass remains insufficient.

## P4 - Final Cleanup, Reviews, And Publication

Selected on 2026-10-07 under independent execution through the first owner
approval. Complete qualification and prepare a concrete deployment proposal
before requesting approval; publication and active default changes await that
approval. New temporary and generated P4 output belongs exclusively under
`.codex-tmp/p4-strobing-20261007/`, with new exclusive run children. Earlier
sealed evidence remains read-only. P4 source baseline is
`.codex-tmp/review-standards/session-cO9bp0/baseline.json`.

- [x] Run deferred failure/lifecycle checks: missing support, failed preparation,
      cancellation/supersession, large jumps, darkness, context loss/restoration,
      replacement, and disposal. Preserve old coherent state on failure without
      admitting a third atlas.
- [x] Run relevant compiler/generation/benchmark tests, Algorithm32 Node and
      WebGL suites, full-cache Flat32 integration, changed-tooling tests, types,
      build, runtime-dependency verification, and formatting. Existing entrypoints
      include `test:algorithm32`, `test:algorithm32:three`,
      `test:ui:flat32:full`, `test:algorithm32:shared-generation`,
      `test:algorithm32:b1-production`, `typecheck:algorithm32`,
      `typecheck:flat32`, `typecheck:algorithm32:shared-generation`,
      `typecheck:algorithm32:shared-runtime`, and
      `verify:flat32:shared-runtime-dependencies`.
- [ ] Validate mapped primary reviews and independent audits through
      `review-standards`. Expected production lanes are architecture,
      contracts/types, verification, and privacy/security for the server-mapped
      application and proof-tool paths. Resolve exact paths and collaborators
      at each milestone; additional lanes follow actual mappings. Complete
      outstanding experiment reviews as their own unit.
- [x] Update production cache, color, application, and qualification owners with
      source/package/color identities, evidence, remaining limits, and a verified
      compatible prior selection for rollback.
- [ ] Prepare the concrete cache publication and application-default change
      after all gates pass. Apply `publish:algorithm32:shared-runtime` and
      default selection through the production workflow when deployment is
      authorized, then check loaded identities and a short rendering sequence.

Capture baselines before coupled work begins. Batch numerical and color source
review after P1-P3 stabilize, then validate final evidence after P4 cleanup.
Rerun only lanes whose source, collaborators, contracts, or context changed.
A new render from unchanged code does not require another source review.
Use serial batches when agent capacity is constrained: finish one lane's
primary review, run its audit in a separate agent, then start the next lane.
Retain completed reports and validate the full required set after all batches;
reviewer concurrency is not an acceptance requirement.
Checkpoint when the adviser recommends it; commit-message preauthorization
continues, while actual whole-repository readiness remains required.

## Execution And Evidence Boundary

The authorized production scope covers the affected owners and their adjacent
contracts/tests under `src/algorithm32/` and `src/flat32/`; cache compilation,
publication, and qualification under `scripts/algorithm32/solar-zenith-cache/`;
direct-40 adapters under `scripts/algorithm32/production-b-experiments/`; the
existing B1/B2/B3 runners under `scripts/experiments/`; application recording
under `scripts/flat32/` and the existing `scripts/animation-evidence/` toolkit;
and shared-cache selection/service integration under `server/flat32/`.
Related root package/build/test configuration and production topic documentation
may change when required by this plan. This scope does not activate unrelated
work in those folders. Publication remains subject to the P4 gates.

The promotion-owned generated-output root is
`tmp/production-algorithm32/distant-sun-strobing-promotion/`. Use exclusive new
runs, closed hashed manifests, complete parent/tool/parameter derivation, checked
real paths, and progress at least every 30 seconds for long operations. Existing
compiler/runtime runners may retain their established immutable output roots;
the promotion index authenticates their child runs without relocating them.

For the owner-selected 2026-10-07 independent P3 execution, all new temporary
and qualification output uses `.codex-tmp/p3-strobing-20261007/` with exclusive
sealed run children. This is P3's plan-owned ignored output root. Existing
`tmp/` identities and relocated `D:\flattened-steel\archive\` parents remain
immutable provenance; read-only input authentication records the relocation.
The task baseline is
`.codex-tmp/review-standards/session-eg11IP/p3-baseline.json`. The original
coupled P1-P3 baseline remains preserved; the fresh review request must also
include affected P1-P2 production owners and relevant unchanged collaborators.

Production tests belong beside production owners or in existing production
runners. Preserve historical runs and Star evidence. Do not introduce an
experimental test tree or external repository dependency. Focus development
verification on positive cases and reserve deferred failure coverage for P4;
repeat full suites or films only when a material change invalidates evidence.
