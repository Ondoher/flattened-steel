# Extraterrestrial Sources

Status: active production-follow-up topic. The qualified experimental
candidate remains evidence only; the production port follows the promotion and
API-integration plans in this topic.

This topic owns the current renderer-neutral design for visible light that
arrives from outside the atmosphere. The earlier name was "extra-atmosphere."
Selected retained ER0--ER5 formulas and conservation work may inform this
design, but the ER6/ER8 eight-case globe matrix is subjective rendering
material and is not evidence. The experimental production-code promotion was
rolled back. Nothing described here is current production behavior until it
is implemented afresh in this repository.

## Current Boundary

Extraterrestrial sources contribute after the view ray reaches the atmospheric
boundary. They do not seed, rebuild, or invalidate the cumulative atmospheric
scattering cache. Algorithm32 supplies atmospheric path radiance and the
directional transmittance needed to transport each source. The resulting
spectral contributions compose before the single Color/RGB boundary.

Two physical source measures require different execution paths:

- an unresolved point source owns top-of-atmosphere spectral irradiance
  density and is transported at its exact source direction before a normalized
  frame response distributes its flux;
- a resolved source owns directional spectral radiance density and is
  integrated over its physical angular support with visibility and
  transmittance evaluated at every quadrature direction.

This topic defines the semantic source boundary only; it does not preselect a
production declaration path or imply that either execution path exists. If a
qualified candidate is accepted for promotion, that promotion must allocate
each declaration to its nearest demonstrated capability owner through the
[canonical Algorithm32 organization](../algorithm32/archive/reconciliation-2026-08-04/algorithm32/source-organization-plan.md#selected-target-tree)
before implementation begins. No current `ExtraterrestrialSource`
declaration or owner tree is implied by this design.

## Working Documents

- [Interface contract](interface-contract.md) owns quantities, operation
  ordering, responsibility boundaries, and CPU/GPU invariants.
- [Source inventory](source-inventory.md) owns the selected or deferred status
  of the Sun, Moon, Sirius, catalog stars, and later source classes.
- [Unresolved research](unresolved-research.md) owns decisions that must not be
  inferred from the archived experiments.
- [Fact accounting](fact-accounting.md) maps every retained, deferred, or
  excluded extraterrestrial formula and value to its actual evidence route.
- [Promotion plan](promotion-plan.md) owns the fresh CPU-first, GPU-second
  implementation route and its completion boundary.
- [Production API and ownership contract](production-api-ownership-contract.md)
  owns the reviewed public API, internal owner map, invalidation matrix,
  lifecycle, candidate classification, and spherical plus mandatory Flat/local
  family boundaries.
- [Extraterrestrial adoption guidance](extraterrestrial.md) owns the reusable
  source-proposal, experiment-recast, and qualification guidance.
- [Completed Algorithm32 standards reconciliation](../algorithm32/archive/reconciliation-2026-08-04/extraterrestrial/reconciliation.md)
  records the finished Phase 2 standards audit, ambiguity decisions, and
  exception result.

Canonical citations and paper-facing facts remain in
[`/references/references.md`](../../../references/references.md) and
[`/references/algorithm32-working-facts.md`](../../../references/algorithm32-working-facts.md).
Official experiment status remains in
[`/references/experiments.md`](../../../references/experiments.md); this topic
does not duplicate those registries.

## Evidence Boundary

Retained analytic and conservation boundaries may inform the selected typed
CPU behavior, subject to standalone promotion. The ER6/ER8 subjective globe
cases establish nothing beyond their rendering-fixture behavior and cannot be
used as scientific, numerical, or implementation evidence. Record 067 is also
excluded: its durable unit boundary was insufficient and its production
changes were rolled back.

The archived reset design, reset plan, and object inventory remain available
in the
[topic-documentation archive](../../../archives/topic-documentation-archive-2026-07-19.zip).
They preserve research context and chronology; the focused documents in this
topic are the only current guidance extracted from them.

## Explicit Exclusions

- No experimental implementation or record is a runtime dependency.
- No celestial contribution-cache layout from the rolled-back work is
  selected by this topic.
- No source-specific exposure, authored star disk, fixed pixel solid angle,
  or display RGB is a physical source quantity.
- Moon/star/diffuse illumination of the atmosphere, ground, or scene is a
  separate future light-source/cache problem.
- Human-eye or camera visibility is not claimed without a separately selected
  observer, optics, background, and detection model.
