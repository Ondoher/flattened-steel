# Flat Geometry And Local-Sun Promotion Plan

Status: complete and accepted engine phase with the selected scaled 19-by-15
position profile promoted and post-promotion verification passed. `flat32`
handoff is next.

This plan follows the repository delivery sequence and the
[extension contract](extension-contract.md). It develops the independent flat-
geometry and local-source owners on CPU, establishes their integrated
flat/local oracle, and then completes that supported pairing on GPU before
advancing its completed status. Citation completion and the full unit/
integration suite are follow-on hardening, but remain mandatory before release
or publication.

## Entry Conditions

- The selected cumulative scattering cache works through order 4 on CPU and
  GPU, with source-owned lifecycle and runtime sampling.
- The production ground boundary works on CPU and GPU.
- Geometry, light-source, ground, cache, quantity, and descriptor contracts
  are stable enough to extend without flat-only branches in generic code.
- The shared renderer-neutral source-controller, runtime-binding, and view-
  sampling seams can exercise the new capabilities without a `flat32`
  application adapter.

Shared endpoint/RGB composition, `flat32`, and extraterrestrial visible-source
integration are later stages. Their absence does not block this engine phase;
the type and ownership boundaries must still keep the local atmospheric Sun
distinct from boundary-only extraterrestrial sources.

The canonical
[supported geometry/source pairings](../production/architecture-boundaries.md#supported-geometry-and-source-pairings)
are spherical/distant and flat/local. This phase preserves independent geometry
and source contracts but does not construct flat/distant or spherical/local as
production, parity, or application requirements.

## Current Outcome

The CPU, GPU, controller, and shared-runtime implementation exists. The v4
production-owner convergence study selected
`profile-z19-rho15-add-50km-4p5mm`: 285 positions, clamped bilinear `z`/`rho`
interpolation, Fibonacci-34 incoming directions, W27 outgoing directions, and
native-15 spectral storage. At the qualified 100 km/4.8 Mm diagnostic
configuration it passes the unchanged spatial limits with maximum normalized
L-infinity `0.00502984504201558` and maximum p95 normalized RMS
`0.001092614831589967`; its logical resident cumulative field is
`74,795,400` bytes and v4 peak tracked upper bound is `403,628,992` bytes.
V5 verifies the promoted default, reproduces those numerical maxima, and
measures `389,675,392` peak tracked logical bytes, `164,707,792` packed-data
bytes, and 236 taps per query against the declared 256-tap bound.

The earlier v1-v3 studies remain rejected evidence. Both selected
15-versus-60 transport-control characterizations still fail their numerical
limits and are retained as explicit accuracy limitations rather than rewritten
as passing. The W9-to-W27 supporting study rejects W9 but cannot establish a
beyond-W27 convergence result. Scaled configurations other than the measured
100 km/4.8 Mm case and selected-domain supported-hardware performance remain
unqualified.

The dedicated browser lane passes bounded W3/N4 pass probes and cumulative
lookup plus W27/N1 three-ray/90-scalar public ShaderBuilder transport.
W27/N4 numerical complete-ray execution is optional hardening, not a frozen
gate or an established result.

## 1. Freeze Selected Inputs And Predeclare Cache Promotion — complete

- Retain the existing configured flat atmosphere's bounds, frames, units,
  profile assumptions, and ground plane. Do not invent a second physical
  default for cache construction.
- Select analytic/direct CPU fixtures for plane intersections, optical paths,
  source-frame operations, joint flat/local translation symmetry, and ground-
  bound segments.
- Retain the Star-backed local point Sun's existing typed irradiance,
  configured geometry, inverse-square falloff, radius clamp, deterministic
  center behavior, and finite source-path rule.
- Require the completed Stage 8 ground recurrence at every applicable local
  cache order; this is inherited behavior, not a new policy selection.
- Evaluate candidate local coordinates and outgoing domains against direct
  high-accuracy queries before choosing grid nodes or interpolation.
- Predeclare numerical, conservation, lifecycle, and resource criteria using
  the established cache-promotion process. These predeclarations and the
  resulting convergence measurements are part of executing Stage 9, not an
  external product-decision gate.
- Retain Star's existing flat-geometry and local-Sun primitives only where
  they pass the selected analytic contracts, then pin their primitive/direct
  outputs in the
  [Star parity data-set contract](../production/star-parity-data-set.md).
  They are not whole-cache output authority.
- Do not implement a duplicate flat/local cache in Star solely for parity.
  Make explicit, evidence-backed decisions for missing source/geometry-
  specific domains and controls, then compose the pinned primitives once in
  production with the already accepted generic recurrence and cache
  operations.

The archived Bruneton harness may motivate test cases, but its implementation,
grids, and results are not an oracle for the selected Algorithm32 cache.

## 2. Implement Flat Geometry On CPU — complete

- Implement flat atmosphere and ground ray bounds through `GeometryModel`.
- Implement physical atmosphere coordinates, source-relative frames, cache
  build rays, and cache position/direction stencils.
- Verify those geometry-owned operations with analytic identities and
  manufactured source-frame, construction-ray, and stencil collaborators.
  Do not add a production flat/distant cache as a development vertical slice.
- Check plane/path identities, ground-bound atmospheric segments, joint
  source/geometry translation symmetry where applicable, and final view
  bounds.

CPU completion here means a deterministic geometry reference and selected
numerical domain. The scattering-cache oracle is established only by the
paired flat/local path in the following phase.

## 3. Implement The Local Sun And Flat/Local CPU Oracle — complete

- Implement source state, typed radiometry, direct lighting, source-path
  limits, and the local primary `J1` field. Flat geometry owns conversion
  from its native coordinates to the source-relative packet; the source and
  cache consume that packet.
- Feed pure local-source orders through the unchanged generic recurrence and
  cumulative accumulator, then publish them through a concrete
  `LocalSunScatteringCache` behind the shared consumer interface. Do not reuse
  the distant-Sun concrete cache type.
- Implement the full transport fingerprint, rebuild triggers, staging model,
  and failure semantics.
- Validate inverse-square/distance policy, near-source behavior, symmetry and
  domain error, ground contribution, pure/cumulative recurrence isolation,
  and complete rays.
- Run that source through the flat geometry and unchanged generic recurrence.
  This integrated binary64 result is the retained flat/local CPU oracle; no
  flat/distant scattering oracle is required.
- Compare the flat-geometry, local-Sun, and source-primary outputs for which
  Star has independent implementations against the declared
  [primitive data](../production/star-parity-data-set.md). Accept the
  integrated CPU oracle through those comparisons, analytic invariants, and
  reuse of the already validated generic recurrence, without claiming
  whole-cache Star parity.

This CPU lane becomes the retained oracle, not a parallel production cache
builder.

## 4. Complete Flat/Local Construction On GPU — complete

- Build the local Sun's primary and later-order fields on the GPU with the flat
  geometry's bounds, frames, construction rays, and stencils and the selected
  source-relative domain. Preserve separate geometry and source ownership.
- Keep scalar spectral resources resident and publish completed caches
  atomically; use readback only for focused diagnostics.
- Resolve CPU/GPU parity at nodes, interpolation boundaries, pure and
  cumulative fields, complete rays, and ground hits.
- Compare GPU results with the accepted CPU oracle and existing shared
  recurrence evidence. The sealed
  [Star parity data](../production/star-parity-data-set.md) applies only to
  flat/local primitive or primary outputs Star independently produces.
- Measure the flat/local cache's build, memory, and runtime costs.

## 5. Publish Flat/Local Through The Shared Runtime — complete

- Publish the completed cache through the shared source-controller/runtime
  binding and exercise GPU lookup and final view traversal through the
  renderer-neutral consumer seam.
- Integrate local cache lookup, view transport, and ground participation
  through the shared runtime seam without conflating renderer shadows with
  atmospheric scattering.
- Resolve lifecycle invalidation, supersession, failure/cancellation,
  complete-ray behavior, and declared resource seams.
- Regression-check spherical/distant without requiring flat/distant or
  spherical/local.

These implementation boundaries are present. Final acceptance retains the
evidence limits stated in the current outcome rather than implying a
production-domain W27/N4 browser matrix or whole-cache Star parity.

## 6. Application Handoff And Follow-On Hardening

- Hand the accepted flat/local-Sun path to the later composition and `flat32`
  stages through the existing shared contracts; do not add a temporary
  application adapter or alternate runtime strategy here.
- During follow-on hardening, complete AMA source/fixture citations, the full
  Jasmine unit surface, application integration tests, GPU parity/lifecycle
  acceptance, and any standalone official experiments needed for paper-facing
  claims.
- Verify the extension did not alter spherical/distant behavior or the generic
  recurrence.

## Exit Boundary

The implementation phase has exited: the promoted flat/local configuration's
CPU, GPU, and shared-runtime paths have green regression and scoped Star
reports, with the v4 selection and known characterization limits preserved.
Independent v5 post-promotion verification records current production source
hashes, reproduces the selected metrics, and passes default realization and
actual selected-domain logical-resource checks without modifying v4. Geometry
and source ownership remain independent. Shared composition is complete;
`flat32` migration now follows this engine evidence boundary. Full
release/publication acceptance additionally requires the follow-on citation,
performance, and experiment gates.
