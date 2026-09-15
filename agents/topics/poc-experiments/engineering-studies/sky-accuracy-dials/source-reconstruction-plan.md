# Source Integration And Reconstruction: Attribution Test

Status: registered before evaluating the new reconstructed-density contrasts.
This is a bounded addition to `compensation-attribution-v1`, under the owner's
direction to continue independently and prioritize sources of inaccuracy.
The [correctness standard](continuation-goals.md#standard-of-correctness) applies.
Kider values are not inputs to this test or its scientific criteria.

## Question And Existing Evidence

The admitted source-column audit establishes a negative transmission bias from
finite S80 integration and predicts its reduction at S160. Whole-component
comparisons show that S160 can nevertheless increase numerical error. Test
whether cached first-order reconstruction has an opposing positive error on
the same bottom-interval samples, and whether source refinement removes part
of that cancellation. Separate source integration from reconstruction before
considering another mitigation.

Reuse the exact 32 physical samples and 16 altitude/solar anchors, in channels
0 and 8, retained by `00188-src-column-pred` and `00189-src-column-s160`.
Use their admitted independent source transmissions and S80/S160 outputs;
perform no new optical-column integration, GPU construction or Kider scoring.
The source/transport factorial is already complete and is not repeated.

## Declared Calculation

For fixed medium, phase function, geometry and source irradiance, let
`D*(x)` be continuous first-order scattering density using the admitted source
transmission at the actual query. Let `R80(x)` and `R160(x)` be the original
raw reconstruction equations populated with the corresponding finite source
transmissions at the retained anchors. Let `R*(x)` use independently evaluated
source transmissions at those same anchors, with the same reconstruction.

Compute the exact accounting identity

```text
R80 - D* = (R80 - R*) + (R* - D*)
            source effect   reconstruction remainder
```

The first term measures the finite-source effect after reconstruction, including
its nonlinear solar response. The second includes outgoing, solar and altitude
reconstruction and storage rounding. It is not a pure altitude error.
Keep direct finite-source densities at the query as a separate comparison.

Evaluate raw, split-species raw, and query-density-factored reconstructions
using the existing equations and unchanged stencils. Split-species raw controls
for regrouping and separate storage before interpreting density factorization.
Also retain binary64 versus Float32 storage comparisons so storage error is
visible rather than silently included in the representation claim.

Use the declared phase and density equations at each anchor and query. Preserve
the source frame, outgoing stencil and monotone-cubic solar operation order.
This is a CPU reconstruction diagnostic of those equations; it does not certify
GPU arithmetic or establish a complete first- or second-order viewing integral.
Any comparison with an existing CPU producer must retain its geometry and
roundoff differences explicitly rather than assert unproved bitwise parity.

## Predictions And Checks

Before these derived responses are evaluated, predict that:

1. In each of the four ray/channel groups, the raw reconstruction remainder
   is positive in the fixed positive-weight bottom-interval projection, while
   the finite-source effect is negative: the two errors compensate.
2. The S80-to-S160 raw response is positive and increases the absolute error
   of that projected raw density against the independent continuous density.
3. Query-density factoring reduces the projected absolute reconstruction
   remainder by at least 80% compared with split-species raw, using the same
   independent source values and propagated allowances.

These are new attribution hypotheses using already known source-column data,
not withheld-source or unexecuted-setting validation. Retain every local
sample as well as group projections and RMS norms. A group result must not
conceal contrary local signs or unresolved changes. Preserve failed hypotheses;
do not refit a convergence exponent or change the 80% threshold afterward.

The group projection uses the original bottom-interval view16 midpoint lengths
and one common, fixed midpoint view-attenuation rule. Its positive weights are
identical for every variant. It diagnoses these sample errors, not outer-view
quadrature convergence or complete sky radiance.

Authenticate both parent seals, artifacts, original registration, exact sample
and anchor identities, source count and physical parameters. Check unchanged
relevant numerical implementations against the retained source identities;
unrelated subsequent source edits do not invalidate immutable parent data.
Replay the admitted source-reference formulas and preserve their empirical
allowances. Propagate those allowances through density multiplication,
interpolation and the fixed positive projection, with a justified conservative
allowance for storage and arithmetic. If this cannot resolve a prediction,
report it as unresolved. Empirical reference allowances are not rigorous
physical error bounds.

Manufactured local checks cover the accounting identity, equal-input
reconstruction, zero illumination, uncertainty propagation, the distinction
between raw and split-species storage, and preservation of failed or unresolved
scientific predicates. No test-framework tree is introduced.

Include the constant-illumination exponential-density limit: query-density
factoring should reproduce the analytic density at a fixed query, whereas raw
midpoint reconstruction has error proportional to
`beta(query) * (cosh(cellWidth/(2*scaleHeight)) - 1)` for each species. Decreasing
cell width tests the expected quadratic small-cell limit on this fixed field.
This manufactured component check does not claim the same count law for a
regenerated atmospheric cache.

## Execution And Stopping Boundary

Do not change experiment source while the current noon reference sequence has
its source snapshot open. After that sequence finishes or stops, implement this
single diagnostic under `experiments/sky-accuracy-dials/continuation/source-reconstruction/`.
It belongs to the existing deferred attribution review unit with baseline
`871690d334b4339f7aaee516dcc140dd00a3edaf`. Run focused local proofs and the
experiment type check; do not restart recurring standards reviewers.

Allocate one new immutable run, at most 3 MiB retained and five CPU-job minutes
including a 30-second finalization reserve, within the remaining C5 and total
budgets. Use existing parents in place, retain compact JSON and derivations,
and require no GPU job or disposable large field. Stop before allocation if
authentication, numerical compatibility or resource admission fails.

One accepted diagnostic is sufficient, including preserved scientific failures.
Use its decomposition to decide whether outgoing/solar reconstruction or
recurrence needs a separate causal test. Do not automatically launch another
resolution sweep, physical-parameter fit, or complete-cache regeneration.
