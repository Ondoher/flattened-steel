# Altitude Resolution And Competing Error Rates

Extension: `compensation-attribution-v1`. This registers a next bounded
component experiment before any matched H-control P51 or P63 target is run.
It complements the failed scalar order-ratio forecast. The source, transport,
incoming, outgoing, solar and physical controls stay at original H values;
only near-ground altitude nodes change. Production remains read-only.

## Question And Scope

Can the altitude dial's response be predicted from a smooth interpolation term
and a separately testable boundary term, rather than a fitted brightness offset?
Use raw N4 at P48, P51, P55 and P63, retaining the exact original P48 nodes.
The first interval is 1875 metres; these grids divide it into n=1,4,8,16 equal
segments. Higher original altitude intervals remain unchanged.

The primary scalar is the effective grouped P2 increment at the original
`p-0930-5-7` and `p-1230-3-5` rays, channels 0/8. Retain all forty C0 probes
and original screen selectors as bounded context. This is a partial spectral
component study, not a whole-N4 reference or seventeen-time score qualification.
Original P48/H `00103` and P55 `00132` outputs are known. Matched P51/P63
outputs under these H controls are held targets, distinct from older captures
with different source/transport/angular controls.

## First Held Target: P51

Let F(n) be the admitted fixed-field P2 increment. A smooth leading
interpolation bias proportional to n^-2 predicts

```text
F(4) = F(8) + (F(1)-F(8))/21
```

Seal this prediction before P51 construction. Score the new response
F(4)-F(8), not the much larger absolute radiance. For each of the four groups,
require absolute prediction error <=25% of the predicted response magnitude
plus the propagated input allowance. Evaluate the identical criterion for the
four-vector L2 norms. Preserve all individual failures and unresolved inputs.
The exact residual is F(4)-F(1)/21-20F(8)/21, so its conservative input
allowance is U4+U1/21+20U8/21. A predicted response inside five times that
allowance is unresolved as a magnitude prediction. Resolve signs only beyond
that allowance plus 1e-10 W; report every group.

Where an independent physical P2 reference is admitted, compare the numerical
error of each altitude setting and the corresponding frozen-order Kider
residual/SSE. The response forecast does not itself establish a numerical
accuracy gain. No reference becomes adequate merely because the altitude
response follows a fitted rate.

## Second Held Target: P63

After P51 is sealed, register exact numerical predictions for two models before
constructing P63. The smooth-only model uses the two finer settings:

```text
F(16) = 5F(8)/4 - F(4)/4
```

The competing-rate model F(n)=b+a/n²+d/n uses the original three settings:

```text
F(16) = F(1)/56 - 5F(4)/8 + 45F(8)/28
```

Fit coefficients and retain both models. Freeze the same 25% per-group/vector
response tests and resolution rules, using exact linear-coefficient propagation
of every parent and target allowance. Compare predicted F(16)-F(8), preserving
sign cancellation. Do not select a successful model afterward and present it
as the sole original prediction.

Smooth interpolation can produce an n^-2 term. A wrong boundary knot whose
influence spans one shrinking interval can produce an n^-1 term of the opposite
sign. Their competition can make total numerical error nonmonotone even while
both individual terms shrink. This is a hypothesis about the observed response;
fitted coefficients alone cannot identify its physical cause. In particular,
b includes all unchanged numerical errors and is not automatically a physical
or measurement discrepancy.

## Required Mechanism Controls

Before claiming that the two terms identify interpolation and the exact-ground
convention, test a separately registered J2-only atmospheric-side boundary
intervention. It should leave stored L1 and its ground transport convention
unchanged while adding the missing direct Lambertian lower-hemisphere incident
light to the ground J2 scatter row. The physical pilot supplies independent
Rayleigh half-space and Mie angular checks. Raw versus density-factorized
controls can then distinguish the two candidate error terms. The precise
shader intervention, predictions, original-prefix invariants and any extra
GPU allocation must be registered before its execution. This document does
not claim that intervention is already implemented or qualified.

For the altitude-only target, preserve the unchanged values at original shared
receiver knots where they can be authenticated. In particular, J2 samples L1
at the same receiver before scattering; adding other receiver heights should
not change that local physical solve. Any failed shared-node invariant must be
explained before labeling the response purely final reconstruction. Distinguish
later-order propagation from the P2 comparison and final-view sampling changes.

## Resources And Evidence

Initially allocate two new GPU targets, each at most 6 MiB and fifteen minutes
with two minutes reserved for finalization. Each prediction or assessment
record is capped at 3 MiB and five CPU-job minutes with a thirty-second reserve.
All debit existing C5, 36-attempt, time, retained-storage, scratch and free-space
ceilings. Do not count future deletion or increase those ceilings here.
Existing P48/P55 captures remain immutable. Retain hashes, compact reference
envelopes, explicit partial spectral scope, coefficients, every predicate and
exact derivations; no full texture packages are required. Focused local proofs
and type checking continue, with formal review deferred as directed.
