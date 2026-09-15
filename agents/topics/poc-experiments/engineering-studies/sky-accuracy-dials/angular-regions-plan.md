# Locating The Directional Angular Response

Status: registered before computing these weighted partitions.
This bounded case continues `compensation-attribution-v1` after `00206` showed
that directional atmospheric Mie variation dominates most retained angular
refinement responses. It does not assume the remaining effect is concentrated
at the horizon or toward the Sun.

## Fixed Partition And Meaning

Authenticate and exactly replay the angular-background result. Keep its
original point, four angular rules, two channels, incident radiances, phase
weights and fixed diagnostic means. Use a smooth partition of incoming-angle
space, so artificial hard bin boundaries do not create a new discontinuity:

```text
sun = ((1 + direction_world.z)/2)^32
horizon = (1-sun)*exp(-0.5*(direction_local.z/0.1)^2)
other = 1-sun-horizon
```

The source direction is the existing world +z. The Sun weight is half its
maximum at approximately 16.8 degrees from the source. The horizon weight
selects a band around the local radial tangent and excludes the Sun weight.
These weights are fixed diagnostics, not angular sampling changes. Evaluate
both mirrored directions with their own phase and region weights. Require
nonnegative weights summing to one and exact reproduction of the preceding
directional sums within propagated arithmetic allowances.

For each physical component sum the existing directional residual `L-C`
with its original quadrature/phase weight times each partition weight.
Split radial-only, azimuth-only, combined and interaction responses into the
three partition contributions. Keep all component, channel, sign and allowance
information. This locates the _observed response of the retained rules_; it
does not measure a partition's absolute angular error or make the fine rule
an oracle. No Kider comparison is involved.

## Frozen Predictions

For total Rayleigh-plus-Mie directional response in each channel and each
radial-only, azimuth-only and combined refinement, predict:

1. The Sun-weighted response has the same resolved sign as the full directional
   response.
2. Its magnitude is at least 50% of the full directional response, comparing
   `abs(sun)-Usun >= 0.5*(abs(total)+Utotal)`.

For the combined refinement in each channel, additionally predict that the
horizon-weighted contribution is at most 10%, using
`abs(horizon)+Uhorizon <= 0.1*(abs(total)-Utotal)`.
These are fourteen tests. Unresolved controls remain unresolved and failed
predictions remain in the result. Weights and thresholds must not be adjusted
after seeing these outcomes.

## Verification And Limits

Manufactured checks cover partition unity, bounds, source/opposite-source and
radial-tangent directions, mirror treatment, zero residuals and exact response
identities. Reuse numerical allowance propagation and exact historical replay.
Preserve the existing angular-background evaluator so its results reproduce.
Extend only its current deferred implementation unit. Run focused proofs and
the POC type check; formal standards review remains deferred.

Allocate one run up to 4 MiB and five CPU-job minutes with a 30-second finalization
reserve, inside current cumulative limits. Use retained nodes in memory and
add no optical integral, GPU job or large scratch. One accepted decomposition
with all failures retained completes this test. A successful concentration
hypothesis motivates a targeted sampling experiment; it does not itself
qualify an accuracy improvement.
