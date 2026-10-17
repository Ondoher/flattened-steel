# Toronto Horizon: Scattering-Order Attribution Results

H48-H52 is complete under the owner's 2026-10-16 independent-execution request.
The [plan](toronto-order-attribution-plan.md) owns scope; the
[execution summary](toronto-order-attribution-execution.md) owns decisions,
verification, timings and checkpoint status. Production remains unchanged.

## Finding

The large later-order excess is sensitive to two demonstrated numerical
mechanisms: sparse angular phase integration and coarse integration of the
previous source field along long paths. They interact and feed errors into
later orders. Additional source-attenuation and reconstruction errors partly
cancel. Close agreement of a cumulative total can therefore conceal inaccurate
component calculations.

At the selected 0.05-degree Toronto-optics horizon, a contained diagnostic
intervention reduces cumulative fourth-order luminance error from +234.97%
to -0.77%. It normalizes discrete aerosol phase mass and increases cache-build
transport from 15 to 60 intervals. Neither the atmosphere nor the display is
fitted. This demonstrates a large numerical response; normalization is not
established as the final physically accurate angular integrator.

Review the [paired color image](../../../../../tmp/experiments/sky-accuracy-dials/runs/00342-h52-attribution/comparison.png),
[spectra](../../../../../tmp/experiments/sky-accuracy-dials/runs/00342-h52-attribution/spectra.png)
and [component evidence](../../../../../tmp/experiments/sky-accuracy-dials/runs/00342-h52-attribution/components.png).
All images are scientific swatches/plots, not app screenshots. SVG copies
and complete numerical evidence accompany them in accepted
[00342](../../../../../tmp/experiments/sky-accuracy-dials/runs/00342-h52-attribution/sealed.json).

## H48: Where The Excess Appears

Accepted [00326](../../../../../tmp/experiments/sky-accuracy-dials/runs/00326-h48-order-budget/sealed.json)
derives cumulative orders from unchanged production 00310 and independent GPU
batches 00323. No transport or external solver was rerun. Initial
[colors](../../../../../tmp/experiments/sky-accuracy-dials/runs/00326-h48-order-budget/comparison.png)
and [spectra](../../../../../tmp/experiments/sky-accuracy-dials/runs/00326-h48-order-budget/spectra.png)
were produced before the component campaign.

| Cumulative orders | Original production Y | Independent Y +/- sampling 95% | Original excess | Diagnostic intervention Y | Intervention excess |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 3045.35 | 3145.86 +/-15.55 | -3.20% | 3045.35 | -3.20% |
| 1-2 | 4726.39 | 4671.35 +/-30.67 | +1.18% | 4479.36 | -4.11% |
| 1-3 | 7226.12 | 5126.61 +/-36.76 | +40.95% | 5001.33 | -2.44% |
| 1-4 | 17575.05 | 5246.69 +/-38.77 | +234.97% | 5206.33 | -0.77% |

Y is cd/m2. Independent cumulative sums and stage differences use the original
paired batch identities, preserving covariance. Production cumulative viewed
radiance includes nonlinear cubic reconstruction; differences between those
totals are apparent stage increments, not exact isolated physical orders.

The near-match at order 2 hides errors. Most of the original final excess
arrives during the third and fourth stages. Independent physical orders
decline while some stored production source values grow rapidly. At the
selected exact ground node and 469.7 nm, production pure J2, J3 and J4 are
1.18, 5.83 and 88.15 times the independent point estimates respectively.
This excess exists in the stored fields before final display conversion.

## H49-H50: Component Calculations

Unchanged instrumented baselines 00327 and 00336 reproduce every saved view
result exactly on channels 2/3/5/8. All physical cache domains remain present.
They retain pure J samples, incoming L1-L3, off-grid reconstruction, native
weights and frozen-input transport controls. The final analysis uses enhanced
00336 traces with actual quadrature measures and both 15/60 interval records.

Independent local source-density reference 00328 measures exact physical
orders 1-4 at three off-grid ray points and two nearby exact surface nodes.
N1 agrees with an independent binary64 direct calculation within 0.026%.
These are J against J comparisons, not comparisons of J against integrated
observer radiance.

### Angular Integration Can Undercount At The Horizon

Qualified angular reference 00341 independently evaluates continuous L1 at
every requested incoming direction. It compares F68 with species-specific
phase-importance quadratures, using 16/32/64 polar nodes and twice as many
azimuths. No sparse F68 L field is interpolated into the refined reference.
The largest 32-to 64 change is 0.342%; refined J2 agrees with the local Monte
Carlo estimates within their retained sampling intervals.

At the exact ground node with solar zenith 13.5 degrees:

| Wavelength | F68 with continuous L1, relative to refined J2 | Production coarse L1 + F68, relative to refined J2 |
| --- | ---: | ---: |
| 438.3 nm, canonical control | +0.40% | +18.20% |
| 469.7 nm, Toronto optics | -7.52% | +17.99% |
| 532.3 nm, Toronto optics | -11.16% | +14.20% |
| 626.3 nm, Toronto optics | -16.38% | +10.92% |

Thus angular undershoot and the coarse incoming-light calculation have
opposing effects for these Toronto directions. Their percentage changes are
conditional ratios, not independent additive error terms. The earlier
constant-field mass excess near six at other outgoing nodes remains relevant:
the rule's error depends on direction and incident field, not one global gain.

The first angular implementation 00329 incorrectly blocked exact tangents at
one surface node because Float32 global sphere arithmetic rounded the boundary.
Its affected angular results and preliminary component table 00340 are not the
qualified evidence.00341 uses independently supplied physical initial altitude
and radial cosine; every exact F68 tangent passes a separate binary64 direct
integral check, with maximum relative difference 0.0047%. The refined continuous
J2 reference and the full-ray/cumulative recurrence results are unchanged by
this repair. Earlier artifacts remain immutable.

### Coarse Transport Overweights The Near Endpoint

Holding the same live J2/J3 texture and F68 weights fixed, changing transport
from 15 to 60 intervals reduces the next source by 39.7-55.3% at the selected
Toronto nodes. The duplicate 15-interval pass reproduces native L2/L3 exactly,
so this response cannot come from changing the input field.

For the important horizontal direction at 469.7 nm, the atmosphere branch is
875.67 km long. Fifteen equal intervals place the first sample 58.38 km away,
while local extinction length is 11.56 km. The first endpoint term supplies
98.53% of the computed J2-transport contribution and 98.56% for J3. At 60
intervals those fractions fall to 56.61% and 56.73%.

Replace attenuation alone at those same source samples and measures with an
independent 128-point column integral: the 15-interval totals change by only
-0.162% and-0.158%. Column refinement 128 to 256 changes them by less than 1e-12
relative. The dominant response in these witnesses comes from sampling the
source integral, not the attenuation approximation. This is a selected-direction
diagnosis, not a global allocation of every error.

A manufactured constant-source, constant-extinction integral independently
checks the same trapezoidal mechanism with exact attenuation and a closed-form
answer. At this branch length/extinction, source-integration excess is 155.8%,
48.2%, 12.9% and 3.30% for 15/30/60/120 intervals. Even a perfect source value and
perfect attenuation cannot make that coarse source quadrature accurate.

### Reconstruction And Source Attenuation Partly Cancel

At 469.7 nm, the exact ground-node first-order source is about 3.74% below the
independent value. Its source-transmission 20-interval trapezoid has the same
3.74% deficit against an independent column. Refining that column to 80 and 160
reduces the transmission deficit to 0.258% and 0.065%.

At the 683 m off-grid witness, the direct source is 2.18% low, but reconstruction
adds 4.72% relative to that direct source, leaving the reconstructed value 2.43%
above the independent estimate. Exact-node reconstruction agrees with its own
direct source to about 1e-6 relative. This separates an error in source generation
from a further interpolation response between nodes.

Adding six lower-atmosphere altitude nodes alone modestly reduces the final
469.7-nm excess, from 391% to 369%; it does not remove the large higher-order
problem. It also changes the already-low first-order value. Lower-altitude
resolution is therefore relevant but is not the sole explanation.

## H51: Propagation And Cancellation Tests

All following results use the same full physical domains and 0.05-degree ray.
The table gives cumulative-fourth-order spectral error at 469.7 nm, not a
full-cache paper score.

| Intervention | N4 spectral error versus independent |
| --- | ---: |
| Original 15-interval recurrence | +391.01% |
| Transport 30 only | +87.68% |
| Transport 60 only | +42.41% |
| Mie phase-mass normalization at order 2 only | +92.48% |
| Mie phase-mass normalization at every higher-order pass | +38.42% |
| Normalization + transport 60 | +0.13% |
| Normalization + transport 120 | -1.25% |
| Normalization + transport 60 + source 80 | +2.55% |

Order 2-only and every-order normalization share exactly the same initial
correction. Their subsequent divergence demonstrates both propagation of
that corrected field and errors introduced by later passes. Pure first-order
view results remain bit-identical in every higher-order-only intervention.

The combined intervention was expanded from four channels to all 15 in 00339.
Its final luminance is 5206.33 versus independent 5246.69 cd/m2 (-0.77%), and
linear R/B is 0.911 versus 0.916. Its maximum Native 15 spectral point residual
is 2.40%. The selected four channels reproduce the earlier combined run exactly.

This near-matching cumulative total still hides order errors. At 469.7 nm,
its apparent production fourth-stage increment exceeds the independent pure
fourth-order contribution by about 43.8%, while preceding cumulative values
are low. Improving source integration makes N1 error shrink from-4.65% to
-1.23%, but changes the final total from+0.13% to+2.55%. This is direct evidence
that improving a component can reveal an offsetting residual and worsen the
aggregate match. It is not a reason to keep the inaccurate source integration.

Transport 60 to 120 changes final spectra by 0.88-1.38% on the four tested channels.
Normalization enforces constant-field phase mass; it does not establish
accurate integration of arbitrary nonuniform light. Remaining reconstruction,
angular and transport errors are not fully apportioned.

## Evidence, Verification And Limits

The [final analysis](../../../../../tmp/experiments/sky-accuracy-dials/runs/00342-h52-attribution/analysis.json)
retains cumulative/pure comparisons, component ratios, sampling intervals,
frozen-input controls, attenuation/source budgets, the manufactured integral,
source-column convergence and all recurrence interventions. Authored runners
are under `experiments/sky-accuracy-dials/distant-horizon/attribution-*`.

Seventeen immutable runs 00326-00342 were accepted. The first angular reference
and preliminary report remain preserved with their scientific qualification
limits; their selected replacements are 00341/00342. Every owned browser exited,
scratch cleanup passed, and accepted-run verification passed. Local type checking
and final image inspection passed; no dedicated reviewers or audits ran.

Six of 20 local point estimates miss the initial 5% target because the small
fourth-order terms have wider sampling intervals; the largest relative
half-width is 10.64%. This is far smaller than the demonstrated production
excesses at those stages, but the local MC results are not sub-percent component
certificates. Those precision misses remain explicit and were not hidden by
the successful all-ray sampling results from H47.

This package is complete as a focused attribution experiment. It does not
provide a globally converged correction, paper-RMSE qualification, twilight
transfer, a real measured Toronto atmosphere, or production promotion. The
target remains the registered partial Toronto phase/SSA intervention with
original aerosol amount and San Jose noon geometry. Full-cache promotion
must separately match or improve paper RMSE. No further numerical campaign
is selected automatically.
