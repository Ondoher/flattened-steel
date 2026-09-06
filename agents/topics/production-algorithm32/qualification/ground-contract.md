# Algorithm32 Ground Boundary

Focus: Engine conformance and production benchmark export.

Related owners: [transport-geometry](../transport-geometry/ground-contract.md), [physics-numerics](../../pure-research/physics-numerics/ground-contract.md).

## Current State And Next Focus

The Stage 8 ground capability is implemented; renewed physical acceptance
remains subject to the evidence boundary below. The direct
`evaluateBrdf` contract, implementation-owned grass albedo, uniform Lambertian boundary,
spherical ground intersection, selected binary64 `J2`/`J3`/`J4` ground
recurrence, reflective GPU construction, and boundary-dependent cache identity
are present through the one source-controller/cache strategy. Omitted ground
retains the exact canonical black numerical and field-identity path. The
final-view runtime requires no ground-specific branch because
the completed cumulative cache already contains the ground contribution.

The completed recurrence is now reused by the implemented flat/local CPU and
GPU cache at every applicable order. Stage 9 selected and promoted its scaled
19-by-15 position profile, and Stage 10 implements the Star captured-scene
display-boundary composition while retaining spectral path projection. The
remaining application-facing work is the explicitly deferred
[Stage 11 migration](../../production-app/product-behavior/production-implementation-plan.md#11-integrate-flat32).
The implemented Stage 9.6 shell-cache and Stage 10 composition do not close
the independent reflective-validation gap.


## Implemented CPU Work And Historical Evidence

The implemented Stage 8.1 path and retained focused binary64 checks cover the
typed BRDF quantity, `albedo / pi`, profile-to-boundary ownership, no implicit
default albedo, spherical hits including exact boundary contact, direct-source
and return-path attenuation, source occlusion, incidence cosine, higher-order
field sampling, `J3 <- L1`, `J4 <- L2`, cumulative isolation, N1/N2/N4
accounting, omitted-versus-zero numerical identity, and complete boundary-
dependent cache identity. The zero-distance return path now uses exact unit
transmittance, and higher-order ground illumination uses geometry's retained
construction-position lookup.

The independent Star corpus is sealed and reader-verified under the ignored
`archives/algorithm32-star-parity` directory. It includes the omitted, nonzero
reflective, and explicit-zero spherical/distant gold needed here. The
[Star parity data-set contract](../../../../archives/topics/retired-20260906/agents/topics/algorithm32/production/star-parity-data-set.md) owns the
artifact's exact manifest and payload hashes and the historical binary64
production report's path, hash, coverage, and zero-failure result. The sealed
gold remains current, but the production report must be regenerated before
this CPU result can again be called the accepted Stage 8.2 oracle. The CPU path
remains a reference and diagnostic surface, not a second production cache
builder. The
[baseline status](../architecture-contracts/baseline-import-status.md) owns the exact Node
and type-check results.


## Implemented GPU Work And Historical Evidence

The Lambertian boundary supplies an executable cache-build contribution with
typed reflectance/BRDF bindings, while the canonical black module remains the
omitted-boundary implementation. The source/cache passes own the direct and
higher-order illumination loops, and no cumulative field participates in
ground illumination or recurrence.
The same N2/N4 graph, controller, atomic publication, cancellation, reuse, and
disposal strategy serves omitted, zero-reflectance, and nonzero Lambertian
boundaries.

The dedicated reduced-domain Karma/WebGL gate compares omitted, reflective,
explicit-zero, and matching-omitted N4 builds. It passes selected
pure/cumulative fields, exact zero and omitted checks, Star differentials,
CPU/GPU reflective differentials, coordinate agreement, and WebGL cleanup.
The browser receives only an authenticated bounded projection of the offline
gold, never the archive. The Node lifecycle checks separately establish
boundary-content invalidation, unchanged reuse, and camera/display
non-invalidation.
The [baseline status](../architecture-contracts/baseline-import-status.md) owns the exact
command, environment, duration, case counts, scalar totals, and the honest
`Jthrough1` evidence boundary.


## Completion Boundary

The visible ground capability is implemented through the one
source-controller/cache strategy, and its retained focused parity and
lifecycle evidence passed. Current Star acceptance is pending regeneration of
the production comparison report against the unchanged sealed gold in a new
isolated evidence lane; the archived Star tree is not reopened. Flat geometry,
the finite-distance local Sun, and captured-scene display composition now
follow the same implemented ground behavior. The deferred Stage 11
application migration must not introduce a second ground or cache strategy.

The built-in grass packet uses the exact retained Bruneton table averaged onto
Native-15. Omitted ground remains black. Snow requires a later explicit source,
derivation, and contract expansion; no placeholder value is accepted.
