# Flat Dome Cache Shape Experiment Status

Status: executing M1 under independent-execution; geometry proofs and the initial comparison contract are recorded.

## Current State

The topic, source root, ignored output root, and JavaScript type-check
configuration are established. The [execution record](execution.md) owns current
decisions and milestone reports. The design records the fixed-dome requirement,
sample-to-dome Euclidean-distance coordinate hypothesis, selected quadratic spacing,
coordinate/reuse risks, and direct-reference measurement strategy. No accepted
cache shape or selected slice count exists. The implementation now includes
stable cap geometry, valid-domain topology, immutable-run support, a frozen
567-ray development matrix, and the first independently adapted probe source.
The adapted probe has passed its first actual GPU/direct first-order pilot.

The owner's coordinate clarification is incorporated in the design and plan:
the added dimension measures each atmospheric sample's distance to the curved
dome surface. The former disk-edge-distance wording is superseded. Coordinate
sufficiency, inverse mapping, and slice spacing remain unverified hypotheses.

Accuracy guides are owner-selected: the existing independent probe and
libRadtran. The design records their distinct roles, required physical-match
checks, independent adaptation of the probe, and uncertainty/coverage reporting.
Cache size and build performance remain the primary optimization variables.
The installed libRadtran version/help commands have run successfully. No
libRadtran physical solve has completed yet. The independent GPU probe's first
three-case, one-channel pilot is recorded in run 00004.

The [slice-count plan](plan.md) now defines a fixed-distribution comparison,
per-count accuracy/storage/build measurements, and matched color swatches from
the new cache, independent probe, and libRadtran across physical sample
distances and altitudes. Other distributions are deferred by the owner. The
required read-only plan critique is complete. Its four suggestions were
incorporated in the plan: valid-domain interpolation coverage, non-slice error
diagnostics, guide applicability by observable/order, and development-only
count tuning followed by frozen validation. No numerical count is accepted.

The [dense-uniform curve-fitting follow-up](design.md#deferred-follow-up-fit-a-distribution-from-dense-uniform-slices)
is recorded for later selection. It does not change the fixed quadratic
distribution or add numerical work to the current plan.

The preceding production task remains in its own topic. Its dome-boundary
inspection is input to this experiment, not a production modification or an
authorization to reopen retired Star work. The city-list addition and other
preexisting working-tree changes remain separate from experiment source.

## Latest Verification

- Scaffold helper `--check`: passed for `flat-dome-cache-shape`.
- Folder resolver: the generated source paths retain the inherited
  `experiment` set and types.md; no applicability changes were needed.
- Git ignore check: generated-output probe path is ignored.
- Local TypeScript check: passed for the scaffold configuration and ambient
  declaration placeholder; this is not numerical verification.
- No generated artifacts were placed beneath the source root.
- Local links in the active-topic, experiment documents, and
  source instructions resolve; the output root is empty and unallocated.
- Git whitespace check: passed.
- Authored experiment type check: passed after geometry/topology/probe-source changes.
- `00001-m1-boundary`: accepted 190 analytic/coordinate checks; maximum
  clearance roundtrip error 3.092281986027956e-11 meters. The preceding
  `00000-m1-boundary` failed at sandbox-blocked WSL process launch; its completed
  geometry results and failure are preserved unchanged.
- `00002-m1-contract`: accepted 567 frozen physical cases, 98-direction
  reflection-complete grid, topology coordinates, boundary support, and memory
  forecast. This is not a scattering-accuracy or measured-build result.
- `00004-m1-probe-pilot`: accepted actual RTX 2060 GPU execution, 24 batches
  across three clearances. J1 relative differences from converged binary64
  calculations were 0.063%, 0.228%, and 0.173%, within the declared uncertainty
  check. Pure J2-J4 outputs were retained but are not yet a cache-accuracy result.
  `00003` preserves the earlier sandbox-blocked Chrome launch.
- One-pass second-agent plan critique completed; all four suggestions incorporated.
- Type-check configuration: `experiments/flat-dome-cache-shape/jsconfig.json`.
- Output root: `tmp/experiments/flat-dome-cache-shape/`.
- Latest accepted run: `00004-m1-probe-pilot`.

## Standards Restoration Provenance

The source root inherits the permanent `experiments/` assignment to the
`experiment` set: documentation.md, project-foundation.md, and types.md, with
the matching repository overlays. The existing normalization marker records
normalized status; the folder resolver parses the current manifest/overlay
and resolves this source root successfully. No set definition, manifest
assignment, overlay rule, or normalization marker was changed. No temporary
standards configuration needs restoration at suspension or closure.

Dedicated standards reviewers and independent audits are disabled by the
repository contained-experiment policy. The topic transition does not activate
those reviewers. Checkpoint-adviser monitoring remains active and independent.
Local self-review, type checking after authored
implementation, and the experiment's scientific/evidence checks remain owned
by the primary agent; no standards-compliance result is claimed.

The adviser recommends preserving the coherent scaffold as a separate
checkpoint, excluding the earlier city change and unrelated working-tree
changes. No commit was created as part of experiment initialization.

## Run State

Runs 00000 through 00004 are finalized below the declared output root. Later
runs use strictly increasing local sequence numbers, suffixes of at most
sixteen characters, and never reopen an earlier directory. Source snapshots
are now retained with the source hashes in new runs.

## Blockers

None recorded.

## Next Action

Complete the physical/reference pilot contract, then build the N=2/N=4
working cache slice and obtain the first
real three-method swatches. M1 remains open until reference/lookup controls are
verified; no final slice recommendation or production change is claimed.
