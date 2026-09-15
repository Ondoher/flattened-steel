# Remaining Atmospheric Angular Response

Status: registered before calculating the regional target values.
This is one bounded attribution test after `00222-at-assess`. The matched
theta-coordinate correction passed its combined improvement criterion in
channel 0; channel 8 retains a resolved theta16-to-theta32 response and an
unadmitted reference under the preceding frozen criterion. This test does not
reopen or relax that assessment.

## Question And Scientific Expectation

Does the remaining atmospheric refinement response concentrate near the radial
horizon after the identified polar-coordinate error is removed, or does
Sun-centered structure still dominate? The alternatives select different
sampling priorities. Linearity of the integral requires any partition of
unity to reproduce the original component totals. This is an accounting
identity, not an assumption that a finer rule is exact.

Use only the accepted `00220-at-pilot` and `00221-at-fine` incident batches at
`p-0930-5-7:h1000`, channels 0 and 8. Authenticate their seals, plans, model,
source identities, node batches and complete admission. Reconstruct exactly
their original theta16/azimuth32 and theta32/azimuth64 groups and replay all
four physical components and the combined values against their retained rows.
Consume `00222-at-assess` as the parent identifying the unresolved response.

## Fixed Partition

For every original incoming world direction w, let mu_radial be its dot product
with the local outward radial unit vector. Keep the already used smooth weights:

```text
sun = ((1 + w.z)/2)^32
horizon = (1-sun)*exp(-0.5*(mu_radial/0.1)^2)
other = 1-sun-horizon
```

Retain the original quadrature and phase weights and the full incident
radiance. Do not subtract a fitted background. Include both members of each
physical reflection pair with their own directions, phases and partition
weights. Preserve independently evaluated mirror witnesses for the original
symmetry/admission checks; do not count them twice as quadrature nodes.

Calculate the regional integrals and fine-minus-pilot differences separately
for atmospheric Rayleigh, atmospheric Mie, ground Rayleigh, ground Mie, their
atmospheric sum, ground sum and combined value. Propagate incident allowances
with the absolute integration weights and keep arithmetic allowances explicit.
Check partition nonnegativity/unity, original-row replay and sum/difference
reconstruction within those allowances. Never normalize a changed integral.

## Predictions And Interpretation

The primary hypothesis is that near-horizon atmospheric structure dominates
the remaining response in channel 8. Freeze two tests on its atmospheric sum:

1. Horizon and full atmospheric fine-minus-pilot responses have the same
   resolved sign.
2. The horizon contribution accounts for at least half the magnitude, using
   `abs(horizon)-Uhorizon >= 0.5*(abs(atmosphere)+Uatmosphere)`.

Both predictions must pass to support this concentration hypothesis. A
contradictory resolved sign or upper magnitude bound below the threshold is a
failure; overlapping uncertainty remains unresolved. Retain every region and
component so a failure identifies the alternative without moving thresholds.
Channel 0 and the Sun/other/ground partitions are diagnostic, not additional
post-hoc success gates. Signed shares may exceed 100% through cancellation.

This localizes a response of two existing rules, not absolute angular error.
Both polar and azimuth counts changed, so it does not isolate either axis.
It does not qualify a full viewing ray, another geometry, recurrence, GPU
arithmetic or Kider agreement. No new incident integration or physical fit
is authorized by this package.

## Execution, Verification And Stop

One immutable diagnostic record, including a failed attempt, completes this
test. Its package id is `angular-theta-regions-v1`, under C5's existing
`compensation-attribution-v1` extension. Limit it to 2 MiB retained evidence
and five CPU-job minutes with 30 seconds reserved for finalization, within
the unchanged cumulative ledger and disk limits. Read saved nodes in memory;
write no scratch or duplicate incident arrays. Retain compact regional values,
predictions, proof results and complete parent/operation/source/tool identities.
Use the verified source-delta snapshot inherited from `00210` and authenticate
all current source/control identities at finalization.

Focused manufactured proofs cover partition unity and bounds, mirror weights,
zero fields, signed cancellation, replay failures and all prediction outcomes.
Run the full POC type check after source changes. The deferred source unit is
`continuation/angular-theta-regions/` and its direct collaborators, baseline
`871690d334b4339f7aaee516dcc140dd00a3edaf`. Formal review remains deferred under
the owner's direction. Preserve all preceding evidence and production source.
Choose any subsequent test from this attribution result under a new bounded
registration; this package does not automatically admit another count sweep.
