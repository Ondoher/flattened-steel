# Spatial And Scattering-Order Cancellation Map

Accepted **00250-h8-cancel-map** produces an
[offline interactive map](../../../../../tmp/experiments/sky-accuracy-dials/runs/00250-h8-cancel-map/map.html),
[static overview](../../../../../tmp/experiments/sky-accuracy-dials/runs/00250-h8-cancel-map/overview.svg)
and [numerical decomposition](../../../../../tmp/experiments/sky-accuracy-dials/runs/00250-h8-cancel-map/decomposition.json).
It diagnoses opposing discrepancies at the same time, direction and wavelength.
Paper physical inputs remain fixed. All scores below measure agreement with
retained libRadtran output; its exact configuration and convergence qualification
remain open under the [current metric](reference-model-target.md#current-accuracy-metric).

## What The Map Establishes

Large conditional first-order discrepancies oppose each other and the unresolved
higher-order/reference gap. Their aggregate net RMSE is much smaller than the
individual component RMS values. The balance varies with sky position and
wavelength. A small final residual can therefore conceal substantial component
inaccuracy, and a mathematically better component can expose a previously hidden
discrepancy elsewhere in the calculation.

At all four independently checked second-order scalars, P1 and P2 errors have
the same positive sign. The unresolved remainder opposes both. This demonstrates
opposition across the partial scattering-order decomposition, without establishing
which later order or formulation difference is responsible.

Adding retained orders five and six reduces RMSE from **4.083 to 2.262** on the
matched 80-scalar subset, with smaller absolute residual at 50 locations. Those
orders are measured radiance contributions, not independently qualified errors.

## Spatial Coverage And Reading The Map

The map contains **160 scalars: 40 ray/time positions across five times and four
wavelengths, 360, 454, 642 and 712.5 nm**. The minimum elevation is **12.115 degrees**,
with 60 scalars below 20 degrees and none below 5 degrees. The owner's suspected
0-3-degree horizon region is therefore **unmeasured by this component package**.
This spherical paper-atmosphere evidence does not establish the same allocation
in the flat/local-Sun scene.

Select a time and wavelength, then display pointwise cancellation strength,
a selected pair's signed cross term, or net baseline-minus-libRadtran discrepancy.
Click a populated benchmark-grid cell to inspect all seven signed contributions.
Cells show actual elevations; unmeasured positions remain blank. The grid is the
original benchmark indexing, not an interpolated sky image. Blue pair cells
indicate opposition and red cells reinforcement. Each view uses its own magnitude
scale. The below-20-degree filter selects the lowest available probes.

Pointwise amplitude cancellation is `1 - abs(sum(e_i)) / sum(abs(e_i))`.
It is zero when a nonzero decomposition has no opposing amplitude and approaches
one when substantial terms leave a small net discrepancy. It is a diagnostic
of this decomposition, not a percentage improvement in accuracy. It also cannot
identify whether a component should be removed or changed.

For example, at 12:30 and 454 nm, the four retained 12.115-degree positions have
49.8-70.4% cancellation, density contributions of +1.405 to +3.014 and sunlight
column contributions of -0.206 to -0.313. The near-Sun 71.919-degree probe has
95.6% cancellation, density +27.398, columns -1.334 and net +2.310. All radiance
numbers here are spectral mW m^-2 sr^-1 nm^-1. Opposing density/column signs occur
at all 160 sampled scalars. This evidence shows a spatially varying balance;
it does not show cancellation concentrated at the immediate horizon.

## Conditional First-Order Attribution

Let `P` be independent physical P1, `H` the fixed original orders two through four,
`R` the retained libRadtran radiance, and `v[m]` the retained S80 first-order value
for mode `m`. The baseline is `v[12] + H`. The declared mode path is
`7 -> 6 -> 4 -> 8 -> 0 -> 12`:

| Contribution | Signed term | RMS, spectral mW |
| --- | --- | ---: |
| Corrected P1 remainder | `v[7] - P` | 0.139049 |
| Density reconstruction | `v[6] - v[7]` | 11.906856 |
| Phase reconstruction | `v[4] - v[6]` | 0.717252 |
| Sunlight columns | `v[8] - v[4]` | 0.654399 |
| Transmission/product grouping | `v[0] - v[8]` | 1.894102 |
| Split/combined grouping | `v[12] - v[0]` | 0.000143 |
| Unisolated higher/ref gap | `P + H - R` | 8.034310 |

Mode 7 uses corrected density, phase and sunlight columns with transmission
separated. Restoring density reconstruction gives mode 6; restoring phase gives
mode 4; restoring original columns gives mode 8; restoring transmission/product
grouping gives mode 0; recombining the stored source gives mode 12. Differences
are conditional on those preceding choices. This is an exact telescoping
decomposition, not a unique allocation of interacting component errors.

The seven terms reproduce the signed total residual pointwise. Their self
energies sum to 33,739.683147 spectral mW squared; distinct-pair cross terms sum
to -31,782.074250; total squared residual is 1,957.608897, giving **3.497864 RMSE**.
Normalized dot products are -0.9704 for density/columns, -0.9075 for
density/product grouping and -0.9410 for density/higher-reference gap. These are
aligned vector cosines, not mean-centered correlations. Signed averages across
different locations are not used to claim local cancellation.

## Later Scattering

Independent P2 references cover only two rays at two wavelengths. At those four
scalars the decomposition is `P1 error + P2 error + unisolated remainder = net`:

| Ray | nm | P1 error | P2 error | Unisolated remainder | Net |
| --- | ---: | ---: | ---: | ---: | ---: |
| p-0930-5-7 | 360 | +5.020579 | +1.159643 | -10.383043 | -4.202821 |
| p-0930-5-7 | 454 | +16.963391 | +2.532074 | -15.851606 | +3.643858 |
| p-1230-3-5 | 360 | +6.845578 | +0.833540 | -10.726743 | -3.047625 |
| p-1230-3-5 | 454 | +18.216844 | +1.332476 | -17.239176 | +2.310143 |

Values are spectral mW m^-2 sr^-1 nm^-1. The retained empirical P2 allowances
range from 0.000767 to 0.001189 in those units. They do not qualify the whole
solver or bound the unisolated remainder. The remainder includes later-order,
formulation and reference differences; calling it measured P3-plus error would
overstate the evidence.

The N5/N6 comparison uses the same 40 positions at 360/454 nm. Original orders
two through four match the retained N6 prefix within 1e-13 radiance-density W
units. Adding the positive order-five/six increment reduces subset RMSE from
4.082642 to 2.262088. Some locations worsen. The result measures the effect of
extending the order sum, without independently establishing the accuracy of
those extra orders or the remaining tail.

## Derivation, Checks And Resources

The [run definition](../../../../../tmp/experiments/sky-accuracy-dials/runs/00250-h8-cancel-map/definition.json)
and [seal](../../../../../tmp/experiments/sky-accuracy-dials/runs/00250-h8-cancel-map/sealed.json)
retain parent artifact/seal identities, source snapshots, operations, parameters
and output hashes. Seal SHA-256:
`ecccf70ea17ba9964f9b7dba464aea9c1e2d6ff07826081548f5b0dd1c2e7fba`.

Parents are 00224's numerical factorial; 00109/00110's qualified two-method P1
reference and geometry; 00103's paper control; authenticated `published-models.tsv`;
00171's matched N6 diagnostics; and independent P2 assessments 00179/00200.
Earlier artifacts remain immutable. New source is under
`experiments/sky-accuracy-dials/cancellation-map/`; reproduce with
`node experiments/sky-accuracy-dials/cancellation-map/run.mjs`, which allocates a
new run and uses the recorded local Python installation.

Self-verification checks unique aligned joins, independent P1 qualification,
pointwise additivity, the full SSE identity, four-order prefixes, qualified P2
joins, and embedded JavaScript syntax. The experiment type check passes.
The standard Matplotlib renderer produced SVG/PNG; the PNG was visually inspected.
No browser interaction test, atmosphere recomputation, cache build or GPU job
was performed. Exact HTML interactions therefore retain that verification limit.

Execution through artifact retention took **38.192 seconds**, within the registered
120-second ceiling including temporary plotting setup. New evidence totals
**949,218 bytes**, within 2 MiB. Total retained experiment evidence after the seal
is 406,702,827 bytes. Plotting scratch peaked at 105,644,304 bytes and its owned
directory is verified absent; the seal records zero remaining scratch and
140,068,102,144 free disk bytes. The plotting toolchain artifact retains pinned
Matplotlib 3.9.4, wheel identities and Python identity; temporary packages were
not added to repository dependencies.

The coherent H8 source/documentation unit starts from
`.codex-tmp/review-standards/session-4zJwZ4/baseline.json`.
Its [review receipt](../../../../../.codex-tmp/review-standards/session-4zJwZ4/summary.md)
owns the implementation-completion gate. Scientific acceptance does not replace
that gate or reopen earlier deferred reviews.

## Remaining Diagnostic Gap

The next discriminating evidence would be matched component and order references
at actual 0-3-degree horizon positions, with both near-Sun and away-Sun headings.
It would need a separately registered resource bound and matched geometry. This
report selects no new integration campaign, aerosol change or production change.
