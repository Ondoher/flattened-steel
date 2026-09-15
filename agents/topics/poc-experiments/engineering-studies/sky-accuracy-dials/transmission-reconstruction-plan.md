# Altitude Versus Solar Transmission Reconstruction

Status: registered before the crossed-coordinate columns are evaluated.
This bounded attribution case continues `compensation-attribution-v1`.

Run `00202-phase-recon` separates outgoing phase interpolation from transmission
reconstruction. Its transmission remainder is negative in all four projected
groups, while the outgoing term changes sign between conditions. The remaining
question is whether altitude or solar interpolation generates the dimming.

## Scientific Control

Authenticate and exactly replay `00201` and `00202`, using the existing
`00188`/`00189` columns and unchanged numerical evaluators. Keep all original
32 sample positions, two channels, projection weights, atmosphere and phase
equations. No Kider value enters this calculation.

For each sample evaluate independent sunlight transmission at its exact solar
cosine and each of its two original altitude anchors: 64 crossed coordinates.
Use the existing adaptive Gauss and Simpson rules, both tolerance scales, and
unchanged reference admission criteria. Retain every pass, allowance and
failure. A failed reference prevents a qualified attribution; it is never
replaced with a relaxed tolerance or discarded sample.

Let R be the original altitude/solar reconstruction of independent transmission,
H the altitude-linear reconstruction of the new exact-solar columns, and D the
existing independent transmission at the actual sample. Then

```text
R-D = (R-H) + (H-D)
        solar    altitude
```

Multiply each term by the same exact query density, analytic phase and source
irradiance to reproduce the transmission contribution of `00202`. The solar
term includes its propagation through the unchanged altitude interpolation;
the altitude term is the chord error at fixed solar cosine. This sequential
decomposition does not assume independent or additive mitigation responses.

## Frozen Hypotheses And Checks

In each of the four ray/channel projected groups predict:

1. The altitude term is negative beyond its propagated allowance.
2. Its absolute magnitude is at least 90% of the original transmission error,
   conservatively comparing `abs(altitude)-Ualtitude` with
   `0.9*(abs(total)+Utotal)`.
3. The solar term is at most 10% of that error, using
   `abs(solar)+Usolar <= 0.1*(abs(total)-Utotal)`.

An unresolved total makes the magnitude predicates unresolved. Preserve all
12 predicates, including failures. The dominance thresholds are hypotheses,
not correctness criteria. The scientific expectation is reconstruction of the
same attenuation field with the exact accounting identity and independent
column agreement. No universal concavity or global resolution law is assumed.

Manufactured checks cover constant and affine transmission (zero chord error),
concave and convex fields (opposite signs), the exact split, and failed and
unresolved predicates. Check the endpoint geometry and convex interpolation
weights before evaluation. Reuse the admitted numerical allowance propagation.

## Resources And Stop

Extend only `continuation/source-reconstruction/` in the existing deferred
review unit. Preserve the original numerical evaluators to allow exact replay.
One run may retain at most 4 MiB and consume five CPU-job minutes, with a
30-second finalization reserve, at most 64 crossed coordinates and two million
medium evaluations. Use no GPU and no large scratch; the existing cumulative
budgets and disk floor still apply. Record partial work if execution fails.

Run the focused proofs and full POC type check. Formal standards review remains
deferred under the owner's scheduling instruction. One accepted attribution
with all failures retained completes this test. Choose any subsequent test from
the measured component errors; do not automatically run a count sweep or fit
physical parameters to observation residuals.
