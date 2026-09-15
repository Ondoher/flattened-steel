# Nearly Tangent Incident-ray Coordinate Test

Extension: `compensation-attribution-v1`. This registration responds to the
preserved incomplete `00168-p2-gauss8-high` result. It changes no prior gate
and is frozen before evaluating the proposed coordinate on its witnesses.

## Observed Failure And Hypothesis

The first upper Gaussian8 point is at 8234.248852457098 m. Its ordinary coarse
and fine angular rows and final-view transmission pass. The mapped-fine rule
includes nearly tangent outward incident rays with local cosine about
2.8085e-5 and path length about 813450 m. Eight retained witnesses share the
failure: the coarse Simpson radiance differs from its fine result beyond
the original declared pass tolerances in channel 0. Fine Gauss/Simpson values
agree within approximately 1.3e-9 to 3.7e-9 W, much more closely than the coarse
Simpson discrepancy. These fine values do not override the failed gate.

The original map uses sqrt(radius minus the segment's starting radius). For
a small positive longitudinal projection its Jacobian starts at zero and
rises over a very short coordinate interval. That artificial boundary layer
can under-resolve the coarse error estimate. Hypothesis: an altitude coordinate
measured from the ray's closest-approach radius removes this boundary layer
and makes the unchanged coarse/fine consistency test reliable on these rays.

## Independent Coordinate

For unit ray direction v, let b=norm(origin cross v), p=origin dot v, and take
each original monotone-radius segment in its existing outward/inward orientation.
Let lowDistance be its smaller-radius endpoint, sign its radial orientation,
q0=abs(p+lowDistance), and length its positive path length. Define

```text
r0 = hypot(b,q0); q1=q0+length; r1=hypot(b,q1)
t0=q0/sqrt(r0+b); t1=q1/sqrt(r1+b)
endU=length*(2*q0+length)/((r1+r0)*(t1+t0))
t=t0+u; q=t*sqrt(2*b+t*t)
increment=u*(2*t0+u)*(2*b+t*t+t0*t0)/(q+q0)
distance=lowDistance+sign*increment
jacobian=2*(b+t*t)/sqrt(2*b+t*t)
```

At u=0 and q=q0=0, define increment=0. The atmospheric geometry excludes
the singular planet-center case b=q0=0. This is the coordinate t=sqrt(r-b),
translated by t0; it preserves the physical path and positive measure for
reverse inward integration. Verify endpoint, tangent, radial, constant-source
and nonconstant manufactured integrals against direct distance expressions.

Only the independent Simpson outer coordinate changes. Preserve the original
distance-Gauss calculation, phase functions, source/view column equations,
geometry splits and visibility, tolerance passes 4/1, final admission thresholds,
global allocator, method work caps and empirical-allowance equation. Implement
the alternate method in new contained source so original numerical-core
identities and prior run data remain intact. Record exact code derivation and
the changed mapping identity; do not relabel original Simpson results.

## Witness Predictions And Evidence

Authenticate the eight retained unresolved incident witnesses from `00168` and
evaluate both channels under the new mapping. Predict:

1. All eight complete new Gauss/Simpson pairs pass the original per-component
   admission at the same tolerances and work profile.
2. For each formerly failing channel-0 witness, the new coarse-Simpson deviation
   from original fine Gauss is at most one-quarter of the old coarse-Simpson
   deviation, plus the sum of the two original fine-pass tolerances. This is a
   finite consistency forecast, not proof that original fine Gauss is exact.
3. New fine values agree with each original fine method within the sum of their
   declared fine tolerances and inner column allowances. Preserve the old
   unresolved status; this comparison never grants it a retrospective allowance.

Use `incident-map-witness` as the bounded stage, at most 4 MiB and five CPU-job
minutes with thirty seconds for sealing. Retain exact witnesses, both method
results, mapping provenance, proof outcomes and every prediction. Charge C5
under the existing cumulative budgets. An unsuccessful test calls for another
bounded numerical diagnosis, never a relaxed tolerance.

## Conditional Viewing-run Integration

Only after the witness test passes, add a declared fallback to new viewing runs:
try the unchanged original incident solver; on unresolved admission, preserve
that attempt and use the alternate Simpson coordinate with the same Gauss
value and unchanged final gates. Require agreement with the original fine values
where those values exist. Charge all initial and fallback work and apply the
remaining original per-ray work caps to any additional solve.

Record each fallback's physical identity, original failure, changed coordinate,
complete admission and empirical allowance. Earlier admitted points retain
their original method and allowance. Their reuse does not claim they used the
new mapping. Parent readers must authenticate the additional numerical source
identities for any point that used it. Missing or still-unresolved contributions
stay unresolved. Retry the same held outer target in a new immutable run with
its original frozen predictions plus this explicit numerical amendment.

Production remains read-only, generated evidence remains immutable, and formal
source review remains deferred. This operational coordinate control is itself
part of the broader accuracy-dial investigation.
