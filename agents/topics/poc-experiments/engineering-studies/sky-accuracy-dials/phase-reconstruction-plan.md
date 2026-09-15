# Phase Versus Transmission Reconstruction

Status: registered before evaluating the new phase controls. This bounded
attribution test continues `compensation-attribution-v1` under the owner's
scientific-correctness and independent-execution instructions.

## Question

Run `00201-src-reconstruct` found a negative density-factored remainder at all
64 samples. Its noon projected reductions, 72.20% and 78.48%, failed the
registered 80% hypothesis. The nearest-ground noon sample also had negative
raw reconstruction error. Distinguish outgoing-angle interpolation, phase
coupling in solar interpolation, and interpolation of source transmission.
Do not change density, atmosphere, source integration, quadrature points or
measurement inputs to improve these results.

## Controlled Decomposition

Reuse the admitted source columns and exact sample identities of `00188` and
`00189`. Authenticate and exactly replay the baseline results from `00201`.
Use its binary64 density-factored reconstruction F, excluding Float32 storage
from this decomposition; the earlier storage contrasts remain available.

At every unchanged sample compute:

- B: evaluate the analytic phase at the query's local outgoing direction at
  each retained altitude/solar anchor, instead of interpolating outgoing
  directions. Keep the original solar and altitude interpolation.
- A: reconstruct source transmission alone across the same altitude/solar
  anchors, then multiply by the analytic phase and density at the actual
  query. This also removes phase coupling from the solar interpolation.
- D: the previously admitted continuous first-order density at that query.

The exact accounting is

```text
F - D = (F - B) + (B - A) + (A - D)
         outgoing   solar-phase   transmission reconstruction
```

These are sequential controlled contributions. The solar-phase term includes
its interaction with transmission; it is not a complete isolated solar-grid
error. The last term retains both altitude and solar transmission
reconstruction. Use the same fixed positive sample weights as `00201` and
retain all local values, signs, RMS norms and propagated allowances.

## Frozen Hypotheses

1. The outgoing contribution F-B is negative in all four projected ray/channel
   groups, consistent with smoothing a strong angular feature.
2. Removing outgoing interpolation reduces the absolute factored remainder by
   at least 50% in each noon channel, including propagated allowances. This
   is a falsifiable dominance hypothesis, not a condition of physical validity
   for analytic phase evaluation.
3. The solar-phase contribution has magnitude at most 10% of the original
   factored remainder in each noon channel, including allowances.

Use `abs(candidate)+Ucandidate <= fraction*(abs(control)-Ucontrol)` for magnitude
predicates; a control not resolved above its allowance is unresolved. No Kider
comparison enters any hypothesis. Preserve failed predictions and local
counterexamples. Do not change the 50% or 10% factors after execution.

Verify the source-frame/local-direction round trip, the exact decomposition,
zero-illumination and constant-phase limits, and failed/unresolved predicates
with focused manufactured checks. Reuse the established interpolation
allowance derivation and the admitted empirical source-column allowances.
No new optical integrals or GPU parity claims are made.

## Bounded Execution

Extend the existing `continuation/source-reconstruction/` diagnostic within its
deferred review unit. Keep its numerical baseline evaluator unchanged so the
`00201` rows and groups replay exactly. Refactor only the local run wrapper
needed to select this registered case, its parents, output and report.
Production and historical evidence remain unchanged.

Allocate one immutable run, at most 3 MiB and five CPU-job minutes with a
30-second finalization reserve, within remaining C5 and total limits. Use no
GPU work, new source integration or large scratch. Run the local proofs and
POC type check; formal reviews remain deferred.

One accepted diagnostic, including retained scientific failures, completes
this test. If outgoing interpolation is not dominant, use the measured
transmission and solar-phase terms to choose the next causal test. Do not
automatically launch a resolution sweep or tune an offset to a score.
