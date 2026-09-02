# Active Topic

Current active topic: `algorithm32-production`.

Canonical entry document:
[Algorithm32 Production](algorithm32/production/README.md).

## Immediate Focus

The one-degree Flat32 distant-Sun scene-cache hookup is complete through P10
and production adoption PA7. Exact prebuilt packages, scalar solar-zenith
resolution, manifest validation, face-grid GPU upload, actual-point lookup,
Q30 final-view integration, transactional replacement, and the shared
texture-free dark state at and above 108 degrees are implemented.

The selected face-grid runtime removes the earlier sub-one-FPS regression. On
the qualified RTX 2060/D3D11 path, the atmosphere pass measures `22.22 ms`
mean and `22.30 ms` p95 at 1920 by 1080. The 3840-by-2160 diagnostic remains
about `123.32 ms` mean, so 4K 30-FPS work is still open. The documented green
closure is Algorithm32 `591/591`, Algorithm32 WebGL `23/23`, the full exact-
cache Flat32 lane `16/16`, both type checks, and the Flat32 build.

Stage 9.6 is implemented through 9.6.6, including the N=2048 shell-held local
Sun cache, continuous direct `L1`, replacement GPU graph, lifecycle,
publication, ordinary N4 Flat32 cutover, and containment. Omitted-ground
acceptance is established. Reflective local CPU/GPU behavior is implemented
and agrees under bounded probes, but renewed physical acceptance requires a
new independent authority; retired Star evidence is historical only.

Stage 10's captured-scene display-boundary composition is implemented. Stage
11 is sufficient for immediate application use: 11.1-11.3 are complete and
parts of 11.4-11.6 are implemented. Remaining interaction, migration,
reconciliation, and release closure is owner-deferred; 11.7 and unfinished
11.4-11.6 are inactive, and 11.8 is deferred rather than accepted.

The contained color-reset experiment is complete through accepted CR8 run
`000065-color-reset-qualification`, and production promotion is now selected
under the production-owned Color Reset design and implementation plan.
P0 and P1 are complete: the promotion manifest authenticates the contained
parents and inventories production ownership/fixed-500 assumptions, while
Flat32 now owns exact independent Color, celestial, catalog, and ordered-filter
selections with fail-closed staged availability. The live pre-P9 default still
selects `BrunetonSourceLuminanceLiftColorDisplayModel`; P2 receiver-light work
is next. The target also replaces the current brightest-500 roster with the
accepted brightest-2,000 roster while preserving one-pixel `q=24`
presentation.

Other open boundaries include 4K performance, broader supported-hardware
resource/performance qualification, renewed Stage 8/reflective evidence,
the cross-stage pinned-source audit, import provenance, citations, expanded
release hardening, and the public entry point. Visible extraterrestrial source
composition machinery is present for the current Sun and brightest-500 stellar
roster, but the selected Color Reset, brightest-2,000 replacement, and their
combined production qualification remain open under the new plan.

## Minimal Reload Sources

Read these files in order and no others during bootstrap:

1. [Repository workflow instructions](../../AGENTS.md)
2. [Algorithm32 production status](algorithm32/production/README.md)
3. [Current production dataflow](algorithm32/production/current-dataflow.md)
4. [Production implementation plan](algorithm32/production/production-implementation-plan.md)
5. [Production Color Reset design](algorithm32/production/color-reset-design.md)
6. [Production Color Reset implementation plan](algorithm32/production/color-reset-implementation-plan.md)
