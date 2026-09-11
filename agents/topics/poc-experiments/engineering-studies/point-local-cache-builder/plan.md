# Point-Local Cache Builder Experiment Plan

## Acceptance Gate

The builder and cache format must satisfy the [design's acceptance question](design.md#acceptance-question):
preserve application correctness, support extension to the Bruneton profile,
and expand shared indexes into the logical point-local cache needed to reproduce
accepted run 65. Preserve current sharing and execution efficiency; additional
speedup is not an objective.

## Preparation

- [x] Establish the current point-local builder, application controls, and later
  run 65 authority. Define numbered immutable runs and bounded execution.
- [x] Complete scaffold reconciliation and topic-refresh readiness.
- [x] Implement numbered allocation and progress reporting; prove exclusive
  allocation, nonreuse, containment, terminal immutability, acceptance of a
  sixteen-character suffix, and rejection of a seventeen-character suffix before allocation.

## Five-Step Implementation Plan

### 1. Pin the two profiles

- [x] Record the current application settings and accepted run 65's exact
  Bruneton settings: spectra, atmosphere, ground contribution, sampling, and
  integration. Authenticate input artifacts and pin implementation identities.
- [x] Establish numerical comparison criteria before qualification. Distinguish
  cache construction settings from final view integration settings.

### 2. Expose fixed assumptions as inputs

- [x] Adapt the current production point-local builder inside this experiment's
  source folder. Replace hardcoded scene counts, spectral counts, profile values,
  and package dimensions with explicit configuration.
- [x] Derive arbitrary-list request planning from the current inventory owner.
  Preserve the existing calculation structure, common-field sharing, resource
  lifecycle, and local Sun-angle dimension.

### 3. Generalize the cache representation and reader together

- [x] Retain the shared inventory and scene indexes while generalizing channel
  strides, block sizing, dimensions, and the experiment-local reader.
- [x] Prove that expansion reconstructs every required logical coordinate and
  spectral value without recalculating scattering. Preserve profile identity,
  ordering, and point-local lookup.

### 4. Prove application compatibility first

- [x] Use existing application data for a small daylight-and-twilight comparison
  at two wavelengths. Verify calculated values, expanded cache entries, and
  correct scene indexes before generating the larger Bruneton dataset.
- [x] Verify duplicate scene requests share common calculations within a batch.
- [x] Report effort and correctness progress at this first small proof result.
  Reevaluate if work is not advancing extensibility or correctness; continue
  reporting when progress is reasonable under the owner's standing direction.

### 5. Generate and qualify the Bruneton version

- [x] Generate using the adapted point-local builder and consume its cache
  through the adapted point-local reader with the pinned Bruneton profile.
- [x] Compare radiance values, figures, and scores against accepted run 65.
  Trace discrepancies to their first differing stage; a legacy B1 adapter
  self-comparison cannot substitute for this qualification.
- [x] Consolidate final correctness/lifecycle review and observed performance;
  record acceptance, rejection, or uncertainty and checkpoint the evidence.

## Verification and Effort

Focus verification on calculations and data, with one review per coherent
change and a consolidated final review. Reuse unchanged evidence and preserve
all parent artifacts. Check existing work and timing counters for regressions
during required runs; do not pursue new optimizations or launch a separate
performance campaign. The design owns the output, progress, and immutable-run
contracts.

## Promotion Boundary

Experiment results are evidence, not production architecture. Promotion requires a separate production-owned design, implementation plan, and verification boundary.

## Ozone Follow-up

- [x] Pin the 300 DU, 233 K retained Bruneton ozone table and density profile;
  keep all other accepted Direct40/F68/W27/N4/Q30 inputs unchanged.
- [x] Generate all 17 scenes in one point-local shared-cache execution with
  ozone included in construction and final-view extinction.
- [x] Compare all 55,080 radiances, B1 scores, and selected figures against the
  authenticated ozone-off point-local control; record the diagnostic boundary.
- [x] Complete focused verification, update current status, and checkpoint.
