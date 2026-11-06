# Flat Dome Cache Shape Experiment Status

Status: executing M3; initial fields and independent development reference complete.

## Current State

The [execution record](execution.md) owns measured milestones, decisions,
failures/recovery, and limitations. The [plan](plan.md) owns remaining work.
The fixed North Pole-centered cap, sample-to-curved-surface Euclidean distance,
and quadratic spacing are implemented inside this contained experiment.
Production and earlier experiments remain read-only. No accepted production
cache or final slice-count recommendation exists.

The [M2 pilot report](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00013-m2-pilot-report/index.html)
contains actual cache/probe/libRadtran colors. Initial M3 six-count fields at
three Sun offsets are complete. Development-only errors are retained in
`00020-m3-dev-analysis`. Intermediate N6/N12/N24 and separate non-slice
diagnostics precede freezing counts and evaluating held-out errors. No
held-out accuracy has been inspected for tuning.

The full native guide campaign is running in `00018-m3-lib-guide`. libRadtran
is a local-height slab/collimated-source/all-orders guide, not finite-cap J4
truth. The shared-physics check in `00019-m3-guide-proof` agrees within its
stated sampling check. Exact native dome compatibility remains unestablished.

## Latest Verification

- Geometry: 190 checks; maximum distance roundtrip error 3.092281986027956e-11 m
  (`00001`). Valid-row/boundary-support proofs and physical contract: `00002`.
- Pilot cache fields and real three-method colors: `00008`, `00011`, `00012`,
  `00013`. Failed runs and their diagnostics remain immutable.
- All 18 initial M3 fields are finite/nonnegative (`00014`). Cumulative-only
  retained lookup agrees with summed pure-order fields within 7e-7 relative.
- Independent development probe: 61,200 batches, converged direct J1 plus
  sampled J2-J4; raw sampled-J1 checks passed (`00017`).
- Native shared-physics control: 45 channels pass the declared combined-sampling
  check (`00016`, `00019`), with explicit limits on precision and geometry.
- Local experiment type check passed after analysis/diagnostic updates.
- Generated output remains under ignored `tmp/experiments/flat-dome-cache-shape/`.
  New runs retain source snapshots, derivation, and recursive artifact hashes.

## Standards and Checkpoints

The source root retains the permanent experiment mapping, including types.md.
No temporary standards configuration needs restoration. Dedicated standards
reviewers and audits remain disabled; no standards-compliance result is claimed.
Primary self-review, types, and scientific/evidence checks remain required.
Checkpoint-adviser monitoring remains active. Local checkpoint `4b7be2d9`
preserves M1's foundation. Unrelated city data and other preexisting changes
remain excluded from experiment checkpoints.

## Next Action

Complete intermediate builds and non-slice controls, freeze provisional choices
from development, evaluate held-out rays once, repeat useful build timings,
and publish the full numeric/three-method swatch report. Preserve sealed runs;
repair failures in new runs only. Other distributions and production integration
remain deferred.
