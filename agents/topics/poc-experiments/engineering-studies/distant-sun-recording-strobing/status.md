# Distant-Sun Recording Strobing Experiment Status

Status: the horizon-color correction and replacement film are qualified for
the owner-reported sunrise/sunset excursion. The aggregate source recurrence
gate, required standards review, and owner visual acceptance remain open.

## Current Horizon Result

The owner reports sudden brightening after sunset and the opposite at sunrise.
The retained source trace locates the steepest sky changes at 11.37 and 48.60
seconds, near solar zenith 90.8-90.9 degrees. The production Color Reset p9
gain is continuous but has log elasticity below -1 around its 980-lux boost:
displayed radiance can increase while proportional physical light decreases.
The matched fixed-camera sunset control, boost-removal ablation, and broader
p2 response isolate the color mechanism: physical light and camera values are
exactly identical, while removing or broadening the boost removes the sky
excursion. `00053-color-proof` establishes positive slope for `E * gain(E)`
under p2 over all nonnegative illuminances. `00051-horizon-proof` authenticates
the control and ablations: the original sunset's upper-sky excursion is 53.765
mean code values; both sunset ablations and the p2 sunrise have zero excursion
in native source means, PNGs, original recording, and independent encoding.
The selected daytime capture `00046` passes all recurring-strobe gates in
`00049`. Replacement native film `00050-fixed-film` passes both horizon gates
in `00054`, with zero wrong-direction excursion in all measured regions for
source and encoded video. All 1,800 original camera/instant/zenith states and
presentation slots match. All curvature ratios pass; encoded recurrence passes.

The aggregate source recurrence gate fails on publications 112 and 125 in the
early ground region. `00055-color-delta` proves that every regional RGB mean,
physical time, camera, and publication identity in each flagged three-frame
neighborhood is exactly identical to the earlier film. Event 125 enters the
strongest forty only because the larger horizon-color excursion is removed.
The original source detector and failed result remain unchanged. This supports
the color correction without establishing overall strobe-free acceptance.

Review unit baseline is
`.codex-tmp/review-standards/session-lSEjUt/baseline.json`; source review remains
batched at the settled correction. The agent thread limit still prevents
independent investigation/reviewer startup.

## Deliverables

- [Replacement 4K The Hours film](../../../../../tmp/experiments/distant-sun-recording-strobing/runs/00050-fixed-film/captures/creative-full-day.mp4).
- [1024×576 viewing copy](../../../../../tmp/experiments/distant-sun-recording-strobing/runs/00058-film-1024/the-hours-1024.mp4): derived from the same corrected 4K frames; verified 60 seconds, 30 fps, and 1,800 presentation slots.
- [Horizon color graph, causal proof, and four diagnostic animations](../../../../../tmp/experiments/distant-sun-recording-strobing/runs/00051-horizon-proof/index.html).
- [Animation index: all diagnostics and six comparisons](../../../../../tmp/experiments/distant-sun-recording-strobing/runs/00056-evidence-index/index.html).
- [Full-film qualification, including the retained source failure](../../../../../tmp/experiments/distant-sun-recording-strobing/runs/00054-film-analysis/result.json).
- [Exact comparison of the unchanged source events](../../../../../tmp/experiments/distant-sun-recording-strobing/runs/00055-color-delta/delta.json).
- [Final sealed-evidence verification](../../../../../tmp/experiments/distant-sun-recording-strobing/runs/00057-final-verifier/verification.json).
- [Separate production-promotion proposal](promotion-proposal.md).

The index links 31 retained movies and includes six new synchronized comparisons:
current-package control versus selected correction, both encoding paths,
original versus cubic physical lighting at twilight, and the immutable original
versus the replacement full film, the three-way sunset color ablation, and
matching sunrise/sunset clips from the previous and replacement full films.
Rejected candidates and previous full films remain available with their outcomes.

## Previous Film Result And Limits

The selected correction combines stable sphere roots, a four-metre one-sided
surface-limit estimate for the logical ground row, monotone cubic solar-angle
interpolation, and monotone interpolation through the original one-second
physical receiver-light samples. Direct light, astronomical choreography,
native adaptation/exposure equations, Native15/N4 quality, image sampling,
and the existing two-atlas ceiling are retained. Source diagnostics now average
every native pixel instead of using an aliased default browser downsample.
The [design](design.md) owns the causal findings, equations, numeric results,
recurrence definition, and approximation scope.

The pinned daytime diagnostic passes all four regions through source PNGs,
the original recorder, and independent encoding. Full-film qualification
passes every region in exact native source means and decoded video. All
1,800 camera/instant/zenith states match the original exactly; presentation
slots are contiguous and there are no adjacent identical decoded frames.

One isolated lower-region source dip remains at 3.73 seconds: 0.1521 mean
code value on the 0-255 scale. Its two centered extrema belong to one physical
cache publication. The decoded film has no reversing publication event.
Recurrence counts distinct publications while preserving every raw extremum;
the initial strict-extrema report remains retained. The supplemental 7-11
second twilight ramp still exceeds the ratio gate in some regions, although
its reversing lighting-knot events are removed. These limitations are visible
in the index and are not hidden by the passing full-film aggregate.

The four-metre estimate's sensitivity proof covers one spectral channel and
a declared angular/altitude range, not universal physical accuracy. Owner
inspection of native playback and the encoded film remains pending. This
experiment makes no real-time performance or production-readiness claim.

## Evidence Authorities

All run identifiers are children of
`tmp/experiments/distant-sun-recording-strobing/runs/` and are sealed.

| Evidence                                                        | Run                                                                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Original parent authentication and pinned control               | `00000-pin-control`                                                                              |
| Current-package control and three-path diagnosis                | `00003-control-capture`, `00004-capture-analysis`                                                |
| Identical-instant cache-view isolation                          | `00005-cache-ablation`                                                                           |
| Original field and Float32 ground diagnosis                     | `00006-field-probe`, `00010-ground-probe`                                                        |
| Rejected root-only package and recordings                       | `00007-stable-ground`, `00008-fixed-capture`, `00011-capture-analysis`                           |
| Surface-limit sensitivity at 4, 2, and 8 metres                 | `00012-field-compile`, `00013-field-compile`, `00014-field-compile`                              |
| Selected full-spectrum cache package                            | `00015-stable-ground`                                                                            |
| Rejected linear-angle recording and analysis                    | `00016-fixed-capture`, `00017-capture-analysis`                                                  |
| Earlier cubic-cache diagnostic and analysis                     | `00018-fixed-capture`, `00019-capture-analysis`                                                  |
| Initial support/endpoint proof                                  | `00020-cubic-proof`                                                                              |
| Rejected first full film and qualification                      | `00021-fixed-film`, `00023-film-analysis`                                                        |
| PNG/caption and native-meter proofs                             | `00022-delivery-proof`, `00025-sampling-proof`                                                   |
| Matched original/cubic twilight lighting diagnostics            | `00024-fixed-capture`, `00026-capture-analysis`, `00027-fixed-capture`, `00028-capture-analysis` |
| Previous daytime diagnostic and independent encode              | `00029-fixed-capture`, `00030-capture-analysis`                                                  |
| Previous native full film with horizon artifact                 | `00031-fixed-film`                                                                               |
| Support and field/physical-light equation proof                 | `00032-cubic-proof`                                                                              |
| Initial raw-extrema full-film report                            | `00033-film-analysis`                                                                            |
| Distinct-publication recurrence proof                           | `00034-recurrence-proof`                                                                         |
| Final full-film qualification                                   | `00035-film-analysis`                                                                            |
| Complete animation index and four comparisons                   | `00036-evidence-index`                                                                           |
| Final sealed-evidence and containment verifier                  | `00037-final-verifier`                                                                           |
| Sunset p9 color control and both encodes                        | `00038-fixed-capture`, `00041-capture-analysis`                                                  |
| Native color-model analytic response proof                      | `00039-color-proof`, `00053-color-proof`                                                         |
| Sunset no-boost ablation and both encodes                       | `00040-fixed-capture`, `00043-capture-analysis`                                                  |
| Selected p2 sunset and both encodes                             | `00042-fixed-capture`, `00045-capture-analysis`                                                  |
| Selected p2 sunrise and both encodes                            | `00044-fixed-capture`, `00047-capture-analysis`                                                  |
| Matched physical-input horizon causal proof                     | `00048-horizon-proof`, `00051-horizon-proof`                                                     |
| Horizon evidence and patch-anchor cleanup guards                | `00052-horizon-guards`                                                                           |
| Selected p2 daytime diagnostic and both encodes                 | `00046-fixed-capture`, `00049-capture-analysis`                                                  |
| Replacement full film and complete qualification                | `00050-fixed-film`, `00054-film-analysis`                                                        |
| Color correction versus unchanged early source events           | `00055-color-delta`                                                                              |
| Updated animation index and six comparisons                     | `00056-evidence-index`                                                                           |
| Final authentication of 18 selected runs and historical parents | `00057-final-verifier`                                                                           |

Failed startup runs `00001` and `00002`, and field probe `00009`, remain
retained. Execution state and scientific acceptance are distinct: accepted
analysis execution does not imply that its candidate passed.

## Verification

Local JavaScript type checking and explicit experiment formatting pass.
Repository formatting passes. Support is complete across all 109 scenes with
at most 20 of 24 atlas slots. The interpolation proof checks 153 physical
intervals at 100 interior points each, exact endpoints, shared tangents,
monotonicity, and agreement between field and physical-light equations.

The index authenticates every preceding run. The final read-only verifier
independently authenticates 18 selected sealed runs, confirms that both
historical parent inventories are unchanged, and passes exclusive-write
preservation and path-escape rejection proofs. No experimental test suite or
framework was introduced.

## Review And Checkpoint Gates

The original pre-implementation review baseline is retained under
`.codex-tmp/review-standards/session-rr062b/`. The color-continuation baseline and
final cumulative review request are under
`.codex-tmp/review-standards/session-lSEjUt/`. Calibration readiness passes
and the durable normalization marker remains valid. Reviewer creation and
resumption fail with `agent thread limit reached`, including the settled
milestone retry. Required contracts/types and mapped architecture primary
reviews and independent audits remain incomplete. Final evidence-ledger
validation must therefore report missing reports; no compliance or completed
implementation-phase claim is made.

The owner's autonomous-execution direction allowed scientific qualification
to continue while these gates stayed open. Owner native-resolution visual
inspection is also pending. Production promotion requires those gates and the
separate proposal's physical-accuracy and production qualification work.

Checkpoint message preauthorization persists, but the last adviser state is
`NOT_READY`; no recommendation triggered a commit. The scientific result
cannot substitute for current whole-repository checkpoint readiness.
