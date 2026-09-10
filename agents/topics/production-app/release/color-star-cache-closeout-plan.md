# Color, Stellar Rendering, And Distant-Sun Closeout Plan

Focus: Release gates, deployment inputs, and owner decisions.

## Disposition Rules

Each open item must receive exactly one disposition:

- `complete`: its linked source-document gate is satisfied and recorded;
- `execute`: it remains part of the active closeout and receives a focused
  implementation/evidence step;
- `defer`: it moves to the narrowest existing follow-up owner with its source
  link and claim boundary intact; or
- `close-out-of-scope`: the owner explicitly decides it is not a product or
  release requirement.

Deferral does not imply acceptance. No item may disappear merely because its
implementation exists or a contained run is available.


## Release-Critical Closeout

C1's [full corrected run](../../poc-experiments/benchmarks/production-b-family-c1-9-result.md)
is executed with all six B1 figures. It remains open because the fixed B1
closeout ceiling fails; B2/B3 are favorable. Its next work is the recorded
cache-construction versus historical-baseline investigation, not initial wiring.

| Item | Status | Work or decision | Source authority and close condition | Deferral destination |
| --- | --- | --- | --- | --- |
| C0 | complete | Reconcile stale plan states and remove false current-work signals. | The closed [stellar experiment](../../../../archives/topics/topic-consolidation-20260906/agents/topics/extraterrestrial/stellar-rendering-plan.md), [stellar production port](../../../../archives/topics/topic-consolidation-20260906/agents/topics/extraterrestrial/stellar-screen-palette-production-port-plan.md), [spectral Color experiment](../../../../archives/topics/topic-consolidation-20260906/agents/topics/extraterrestrial/spectral-color-transform-experiment-plan.md), [Color Reset experiment](../../../../archives/topics/topic-consolidation-20260906/agents/topics/extraterrestrial/color-reset-experiment-plan.md), [contained distant-Sun plan](../../../../archives/topics/topic-consolidation-20260906/agents/topics/algorithm32/cache/distant-sun-solar-zenith-cache-plan.md), and [production cache-adoption plan](../../../../archives/topics/topic-consolidation-20260906/agents/topics/algorithm32/production/solar-zenith-cache-adoption-plan.md) now route current work to this plan or the current production owner. | Not applicable. |
| C1 | open; canonical run rejected | Investigate the fixed B1 ceiling miss recorded by the [complete corrected run](../../poc-experiments/benchmarks/production-b-family-c1-9-result.md). All 17 assets, the GPU boundary, and six figures exist; B2/B3 are favorable. | The dedicated plan, [Color Reset production qualification: B1 Boundary](../../poc-experiments/benchmarks/color-reset-production-qualification.md#b1-boundary), and [P8](color-reset-implementation-plan.md#p8---run-production-qualification). Closes only when the fresh production GPU B1-B3 record is accepted. | The B1 authority question may remain in the [project reference follow-up](../../../../references/followup.md#color-reset-research-questions), but final release cannot close while C1 is deferred. |
| C2 | open | Obtain owner appearance acceptance of the complete nine-condition, brightest-2,000, default-human production cadence. | [Color Reset production qualification: Appearance Sequence](color-reset-production-qualification.md#appearance-sequence) and its [release checklist](color-reset-production-qualification.md#release-checklist). | If appearance acceptance is removed from the release target, record that explicit claim reduction in the project reference follow-up and production qualification record. |
| C3 | open | Review the lighting-only sunset and sunset-plus-one-hour candidate, especially whether plus-one-hour geometry is too dark; either accept it or select a named scene-light calibration equation with a new evidence boundary. | [Production Ambient-Light Plan A7](ambient-light-acceptance.md) and [design acceptance boundary](ambient-light-design.md#acceptance-boundary). | A deferred directional-lighting research question belongs in the [project reference follow-up](../../../../references/followup.md#color-reset-research-questions); an unaccepted application appearance decision remains explicitly open here. |
| C4 | open | Close or explicitly remove every applicable third-party source/provenance and official-experiment authority row. | The sole action ledger is the [Color Reset Research Register](../../../../references/followup.md#color-reset-research-register), including 12 `SRC-CR` and 12 `EXP-CR` identities. | Already owned by the project reference follow-up. Deferral preserves provisional scientific/numerical authority and blocks final release claims that depend on the rows. |
| C5 | open | Establish license and redistribution clearance for the BSC, Pickles, Johnson/SVO, Vega, CIE, and derived production payloads selected for distribution. | [Production qualification deployment inventory](color-reset-production-qualification.md#deployment-inventory), [research rows SRC-CR-001 and SRC-CR-005–012](../../../../references/followup.md#missing-third-party-sources-or-canonical-registrations), and the [reference-store admission policy](../../../../references/README.md). | Already owned by the project reference follow-up and reference store. If deferred, affected payloads remain local-only and excluded from public artifacts. |
| C6 | blocked on C1–C5 | Rerun all release lanes after the final source/licensing payload set and owner decisions are fixed, then close P8/P9. | [Production qualification release checklist](color-reset-production-qualification.md#release-checklist) and [Color Reset P9](color-reset-implementation-plan.md#p9---select-defaults-and-close-promotion). | Cannot be deferred while claiming final Color Reset release closure. |


## Owner-Disposition Candidates

These items do not reopen the closed experimental or distant-cache plans. The
owner must decide whether each is part of the immediate product target or a
follow-up.

| Item | Status | Candidate work | Source authority and current boundary | Suggested follow-up owner if deferred |
| --- | --- | --- | --- | --- |
| D1 | decision pending | Improve true 3840-by-2160 atmosphere/cache performance beyond the measured approximately 123 ms mean and decide whether 4K 30 FPS is a supported target. | [One-degree hookup H6](../../production-algorithm32/qualification/flat32-one-degree-cache-hookup-plan.md#h6---remove-resident-lookup-redundancy) and [closure exclusions](../../production-algorithm32/qualification/flat32-one-degree-cache-hookup-plan.md#closure). The 1080p RTX 2060 gate is accepted; 4K is not. | [Production implementation follow-up](../../production-algorithm32/architecture-contracts/production-implementation-plan.md) under a new performance stage. |
| D2 | decision pending | Broaden browser, GPU, operating-system, viewport, memory, and performance qualification beyond the pinned Windows/Chrome/RTX 2060 matrix. | [Color Reset selected execution boundary](color-reset-implementation-plan.md#selected-pre-execution-boundaries) and [distant-cache resource boundary](../../production-algorithm32/qualification/flat32-one-degree-cache-hookup-plan.md#h6---remove-resident-lookup-redundancy). | [Production implementation follow-up](../../production-algorithm32/architecture-contracts/production-implementation-plan.md) under release hardening. |
| D3 | decision pending | Define continuous or discrete Sun-animation/cache-swap policy beyond the accepted atomic state changes. | [One-degree hookup closure exclusions](../../production-algorithm32/qualification/flat32-one-degree-cache-hookup-plan.md#closure) and [cache-adoption boundaries](../../../../archives/topics/topic-consolidation-20260906/agents/topics/algorithm32/production/solar-zenith-cache-adoption-plan.md#adoption-boundaries). | [Extraterrestrial unresolved research](../../pure-research/sources-provenance/open-questions.md) for source/state evidence, followed by a new production interaction plan if selected. |
| D4 | decision pending | Investigate a lossy distant-Sun cache codec beyond exact seam deduplication. | [Contained distant-Sun P10](../../../../archives/topics/topic-consolidation-20260906/agents/topics/algorithm32/cache/distant-sun-solar-zenith-cache-plan.md#phase-p10--compression-and-owner-decision) explicitly defers lossy codecs. | [Extraterrestrial unresolved research](../../pure-research/sources-provenance/open-questions.md), with a new contained plan required before execution. |
| D5 | decision pending | Decide whether any point-local distant-Sun cache ideas should be adapted to Flat/local. | [One-degree hookup closure exclusions](../../production-algorithm32/qualification/flat32-one-degree-cache-hookup-plan.md#closure) state that Flat/local application is outside the closed plan. | [Flat/local unresolved research](../../production-algorithm32/caches/unresolved-research.md). |
| D6 | decision pending | Qualify Flat/local appearance under the selected Color and scene-lighting behavior. | [Color Reset deferred follow-ups](../product-behavior/color-reset-implementation-plan.md#deferred-follow-ups). | [Flat/local unresolved research](../../production-algorithm32/caches/unresolved-research.md) or a new focused production appearance plan. |
| D7 | decision pending | Optimize stellar palette sharing or rewrite eligible index matrices to `Uint8`. | [Stellar Rendering steps 6–7](../../../../archives/topics/topic-consolidation-20260906/agents/topics/extraterrestrial/stellar-rendering-plan.md#6-optimize-palette-sharing-separately--deferred). These optimizations are not required by the accepted base representation. | [Extraterrestrial unresolved research](../../pure-research/sources-provenance/open-questions.md) only if a measured resource need is established. |
| D8 | decision pending | Add Moon/planet rendering, direct lighting, moonlit-sky ambient/adaptation, overlap, and extended shadows. | [Stellar rendering deferred scope](../../../../archives/topics/topic-consolidation-20260906/agents/topics/extraterrestrial/stellar-rendering-plan.md#deferred) and [Color Reset deferred follow-ups](../product-behavior/color-reset-implementation-plan.md#deferred-follow-ups). | [Resolved-Moon follow-up](../../production-algorithm32/color-celestial/moon-follow-up.md); other planets require their own source plan. |
| D9 | decision pending | Add light pollution, automatic or temporal visual adaptation, or live celestial animation. | [Color Reset deferred follow-ups](../product-behavior/color-reset-implementation-plan.md#deferred-follow-ups) and [stellar rendering deferred scope](../../../../archives/topics/topic-consolidation-20260906/agents/topics/extraterrestrial/stellar-rendering-plan.md#deferred). | [Extraterrestrial unresolved research](../../pure-research/sources-provenance/open-questions.md), split by physical source versus presentation behavior before execution. |
| D10 | decision pending | Add optical/presentation solar filters, PSF, seeing, bloom, halo, glare, camera, or sensor simulation. | [Color Reset deferred follow-ups](../product-behavior/color-reset-implementation-plan.md#deferred-follow-ups) and [stellar rendering deferred scope](../../../../archives/topics/topic-consolidation-20260906/agents/topics/extraterrestrial/stellar-rendering-plan.md#deferred). | [Project reference follow-up](../../../../references/followup.md) for source/claim research, then a new focused feature plan. |
| D11 | decision pending | Add arbitrary spectral materials, interreflection, or population-level psychophysical validation. | [Color Reset deferred follow-ups](../product-behavior/color-reset-implementation-plan.md#deferred-follow-ups). | [Project reference follow-up](../../../../references/followup.md) for research; implementation requires a separate production design and plan. |


## Cache Optimization Design

The owner-requested
[distant-Sun cache optimization design](../../production-algorithm32/caches/distant-sun-cache-optimization-design.md)
records the storage and generation evaluation, exact-value proposals ranked by
impact, evidence identities, and qualification boundaries. Design documentation
is complete; its [P1-P8 rollout](../../production-algorithm32/caches/shared-runtime-rollout.md)
is also complete at the qualified bounded discrete-selection scope. The design owns
shared storage, lossless compression, and offline generation optimization;
D1's 4K rendering target and D4's lossy-codec decision remain separate.


## Existing Follow-Up Owners

The repository already has focused follow-up documents; there is no single
general engineering-deferral file that should absorb unrelated work:

- [Project Reference Follow-up](../../../../references/followup.md) owns
  project-wide researched/unresearched facts, source work, experiment
  registration, and claim boundaries.
- [Extraterrestrial Unresolved Research](../../pure-research/sources-provenance/open-questions.md)
  owns open celestial-source and evidence questions.
- [Flat/local Unresolved Research](../../production-algorithm32/caches/unresolved-research.md) owns
  flat/local numerical and source questions.
- [Resolved-Moon Follow-up](../../production-algorithm32/color-celestial/moon-follow-up.md) owns the
  deferred Moon boundary.
- [Production Implementation Plan](../../production-algorithm32/architecture-contracts/production-implementation-plan.md) retains
  deferred application-migration and release-hardening work.

Move an item only after the owner selects `defer`, and add a backlink to its
closeout id so disposition remains traceable.


## Closeout Sequence

1. Decide C2 and C3 appearance acceptance independently; neither decision may
   hide a defect in the other surface.
2. Decide whether C1 remains a final numerical gate; if yes, execute the
   [Production B-Experiment Wiring Plan](../../poc-experiments/benchmarks/production-b-experiment-wiring-plan.md).
3. Triage C4 and C5 row by row into execute, defer with claim reduction, or
   close by removing the affected release claim/payload.
4. Assign D1–D11 explicit dispositions and move only deferred items to their
   linked owners.
5. Execute C6 after all retained release inputs and claims are fixed.
6. Update current production status and active-topic continuity with the final
   dispositions.


## Done Condition

This plan closes when C1–C6 are complete or explicitly removed from the release
target with documented claim reductions, every D item has an owner disposition,
all deferred items exist in exactly one linked follow-up owner, and the final
release rerun and current-state documentation agree.
