# H10–H14 Hypothesis Test Results

## Current Disposition

**The bounded package is closed with incomplete numerical tests.** H10 found a
specific reference-phase representation discrepancy. H11–H13 failed in setup,
before GPU execution or horizon integration. H14 recorded those failures and all
four hypotheses remain unresolved. These harness failures are not scientific
falsifications. Production, physical parameters and historical evidence are unchanged.

The owner selected the [test plan](hypothesis-test-plan.md) through independent
execution. Its single-attempt stage limits were enforced; unused time was not
transferred and failed stages were not retried. The identified startup defects
are corrected in current source, but those corrections have not been exercised
by new scientific runs.

## New Reference Finding

The pinned Bruneton `libradtran.cc` adapter computes 20 aerosol Legendre moments
from 1000 midpoint samples with scattering cosine **0 to 1**, rather than the
full sphere. Pinned libRadtran 2.0.1 `ancillary.c` divides each aerosol moment by
moment zero when assembling its scattering representation. The arbitrary common
scale therefore cancels; the forward-only angular distribution does not.

Independent full-sphere integration of the analytic Cornette–Shanks law at the
fixed paper g=0.7 gives normalization 0.999999999999982. Its forward-hemisphere
mass is 0.9363313642. The normalized 20-term adapter representation gives:

| Registered ray | Adapter / continuous aerosol phase | Phase change |
| --- | ---: | ---: |
| A: 09:30, grid 5/7 | 1.06757997 | +6.758% |
| B: 12:30, grid 3/5 | 1.06555396 | +6.555% |
| C: 12:30, grid 3/4 | 1.07036428 | +7.036% |
| D: 12:30, grid 0/4 | 1.08857353 | +8.857% |
| E: 12:30, grid 4/4 | 1.06695118 | +6.695% |

These are **phase values, not radiance ratios or measured score improvements**.
The exact emitted input deck, effective solver/stream settings and convergence
of the retained published rows remain unqualified. The adapter also uses a
100-layer vertical representation and rounds relative view azimuth to 0.25°.
No new external solver was installed, compiled or executed. The source-backed
match/difference/unknown ledger and exact hashes are in
[00252 audit.json](../../../../../tmp/experiments/sky-accuracy-dials/runs/00252-h10-audit/audit.json).

This identifies a concrete candidate explanation for part of the cache-free
near-Sun deficit; it does not establish its all-order contribution. We must not
interpret the current reference score as a pure numerical-correctness score until
the representation and execution inputs are matched.

## Hypothesis Decisions

| Hypothesis | Decision | Evidence and missing comparison |
| --- | --- | --- |
| A: angular/reference mismatch contributes to the near-Sun deficit | Unresolved | A real angle-dependent phase discrepancy is measured. Its P1/all-order radiance consequence and effective retained reference setup are not qualified. |
| B: truncation matters more at 360 than 454 nm after reconstruction correction | Unresolved | Retained N4/N6 accounting is reproduced arithmetically. New raw replay and the full corrected-reconstruction/order matrix are absent. |
| C: numerical corrections materially reduce the Native48 afternoon low-ray excess | Unresolved | Exact Native48 Q30/S20/T40 recipes are prepared. No new replay, view attribution or P1 factorial completed. The retained +9.412 mW low454 approximation is still unattributed. |
| D: corrected Flat N1 converges toward the neutral continuous spectrum | Unresolved | Sparse actual-topology control and a geometry-specific N1 column-cache intervention are implemented; local payload parity passes. No new horizon spectrum or convergence decision exists. |

The existing order data are not new confirmation: A360's higher-order error
changes from −2.905 to +0.388 spectral mW with N5/N6, whereas A454 changes from
+2.451 to +3.119 mW and worsens. D360 changes −6.711 to −1.748 mW; D454 changes
−1.082 to +0.283 mW. H14 retains shared-reference SSE intervals and the original
sampling flags. All five original sampling-precision misses remain unchanged.

An analytic-P1/frozen-higher substitution is not a corrected recurrence. Existing
species-density factoring does not correct every phase/column reconstruction in
later scattering. The full B factorial and C higher-order response therefore
remain missing even apart from the setup failures.

## Execution And Failure Evidence

| Run | Outcome | Execution through pre-seal retention | Result |
| --- | --- | ---: | --- |
| 00252-h10-audit | Accepted audit/registration | 7.224 s | Pinned source/phase audit and retained order accounting. Full reference/preflight qualification remains open. |
| 00253-h11-orders | Failed setup | 6.599 s | Virtual bundle entry was incorrectly passed to physical-path validation. No GPU started. |
| 00254-h12-native48 | Failed setup | 7.108 s | Installed Chrome path used slash spelling instead of the strict I/O owner's normalized Windows spelling. No GPU started. |
| 00255-h13-flat-cache | Failed setup | 6.558 s | Deep equality rejected +0 versus −0 in the source position after JSON round-trip. No horizon integration started. |
| 00256-h14-hypotheses | Accepted reporting | 7.479 s | Joined decision sheet, complete question/decision log, failures and resource limits. |

The stage seals report **34.968 seconds** total before final sealing/verification.
Measured whole-command elapsed totals, including post-seal verification, are
approximately **47 seconds**; these are not implementation or review time.
No stage approached its wall-clock cap. The package failed because of avoidable
harness defects, not compute cost, memory pressure or adverse scientific results.

New retained evidence is **4,768,508 bytes**. Final measured retained total is
**411,819,865 bytes**, scratch is zero, and free space was **139,663,073,280 bytes**.
All five seals/artifact inventories verify; all owned scratch cleanup records
show absence. The H10 `priorGpuRunCount=194` is a lexical count of GPU-related
recipes, **not an authenticated count of historical GPU attempts**. That admission
limitation is recorded in H14; earlier authorizations were not changed or renewed.

Open the [offline decision sheet](../../../../../tmp/experiments/sky-accuracy-dials/runs/00256-h14-hypotheses/assessment.html)
or [exact assessment JSON](../../../../../tmp/experiments/sky-accuracy-dials/runs/00256-h14-hypotheses/assessment.json).
Their parent seals preserve the full immutable derivation chain.

## Implementation, Verification And Review

The contained runner lives under `experiments/sky-accuracy-dials/hypotheses/`.
It adapts the existing raw GPU driver with an explicit terminal order and the
existing P1 preparation with the two Native48 witnesses, three channels and fixed
S20 count. The production common-shader generator remains read-only.

The Flat diagnostic uses the actual 1049-position topology, held-shell J1 source,
physical-J reconstruction and Float32 scalar payload. It constructs Rayleigh/Mie
payloads independently and compares their sum to the existing CPU J1 owner. The
new N1-only representation caches the flat exponential column invariant
`K = C * mu / exp(-z/H) + H * exp((z-top)/H)`, then restores query columns, phase,
density and dilution. This is a geometry-specific diagnostic, not a production
cache or a later-order solution. It is not qualified merely because its normalized
column residual is algebraically constant.

The local off-witness payload proof measured production-node/species relative
difference 3.41e−16, Float32 summed-control relative difference 4.82e−8 and maximum
column-invariant residual 1.82e−12 m. This is implementation proof, not a measured
horizon result. Bundle generation and exact Native48 payload preparation were
also checked. The experiment type check passes. No experimental unit-test tree
or new dependency was introduced.

One batched mapped review unit covers these source changes and current-state
documents from baseline
`.codex-tmp/review-standards/session-NNPdLo/baseline.json` at `3d9a9b8d`.
Its completion remains pending until the matching ledger validates. Source review
cannot convert failed scientific stages into completed hypothesis tests.

## Questions And Decisions

The [H14 JSON](../../../../../tmp/experiments/sky-accuracy-dials/runs/00256-h14-hypotheses/assessment.json)
contains the complete question/decision/reason list. Decisions cover output-root
ownership, pinned moment-zero normalization, limits on phase/radiance inference,
missing full recurrence corrections, exact Native48 view/geometry, virtual-module
validation, Windows path normalization, geometric signed zero, CPU-only Flat
qualification, no automatic retries, no transfer of unused allocation and the
unqualified historical GPU-attempt count. No owner answer was required to make
these bounded decisions.

## Resumption Boundary

No scientific job is active. The selected package is consumed. The plan states:
“Each attempted stage, including a failure, consumes its one allocation.”
Corrections do not reopen 00253–00255 or authorize new attempts.

A separately selected recovery package should first validate all startup paths
without scientific computation, authenticate the attempt ledger and record fresh
admission. C's exact Native48 replay/conditional P1 attribution and D's sparse
three-ray N1 comparison are the smallest remaining executable targets. B's full
corrected recurrence needs a qualified representation before another compute
attempt; raw replay alone would not complete that factorial. Retain all current
failed evidence and do not expand into full skies or count ladders.
