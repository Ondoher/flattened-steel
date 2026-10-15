# Immediate-Horizon Algorithm Audit: H16-H20

## Result

The bounded numerical package is scientifically complete as accepted **00264**
and **00265**. A substantial **distant-mode incoming-angular error** is supported
at two near-ground pure-P2 source probes: F68 underestimates Mie while
overestimating Rayleigh, partly cancelling in their sum. The local mode's
1920-direction rule is close to the independent angular reference at these points.
This does not establish a shared cause of the two rendered horizon colors.

The [registered plan](horizon-diagnosis-plan.md#next-action-h16-h20-immediate-horizon-algorithm-audit)
owns controls and hypotheses. No production behavior, physical parameter or prior
run was changed. The canonical material matches the fixed paper values; the app
geometries, Native15 basis, order targets and black ground remain distinct from
the complete paper benchmark. No new libRadtran score is claimed.

## Evidence And Coverage

- [00264 initial audit](../../../../../tmp/experiments/sky-accuracy-dials/runs/00264-h16-h20-audit/sealed.json):
  30 continuous N1 sky rays, 18 sparse support/coordinate probes, four incoming
  receivers and retained installed composition stages.
- [00265 qualification](../../../../../tmp/experiments/sky-accuracy-dials/runs/00265-h16-h20-qual/sealed.json):
  independent angular refinement, selected incoming-path refinement, endpoint
  displacement sensitivity and the [cumulative-distance figure](../../../../../tmp/experiments/sky-accuracy-dials/runs/00265-h16-h20-qual/cumulative.svg).
- [Exact qualification values](../../../../../tmp/experiments/sky-accuracy-dials/runs/00265-h16-h20-qual/qualification.json)
  retain signed species errors and regional contributions.

The rays use 0.05/0.25/1/3/20-degree elevations, three Sun-relative headings,
the retained San Jose instants/source positions and independently derived paths.
Material coefficients and Native15 irradiance are authenticated against production
owners. Source closure hashes and immutable parent identities are retained.
Geometry checks use stable binary64 sphere roots independently of production
intersection helpers. Columns are analytic in the flat slab and independently
integrated in the sphere. Continuous N1 uses geometrically segmented 8/16-point
Gauss rules, not installed endpoints or view placement.

## Hypothesis Decisions

| Hypothesis | Measured outcome | Decision and boundary |
| --- | --- | --- |
| H16: premature termination | Removing the Flat observer dome changes the away-Sun 3-degree R/B from 0.98922593 to 0.98936459; the largest omitted spectral fraction across all Flat rays is 0.28644%, at 1 degree. | Rejected as the dominant N1 color explanation on this set. The dome remains an explicit domain assumption. |
| H17: grazing support/branch defect | Direction round trips agree to 3.33e-16 absolute. Local sparse physical-J source differences are about 0.65-1.03% on low rays and reach 2.39% on the upper control. | No isolated horizon-specific wrong-direction failure found. Full GPU branch/packing and distant N4 lookup accuracy remain unresolved. |
| H18: view accumulation | At 0.05 degrees, local 15-interval N1 replay differs by at most 0.00119%; distant 30-interval replay differs by 2.0504%. At 3 degrees the maxima are 0.2663% and 0.4918%. | Numerical errors are measured, but the local continuous result remains neutral. No common missing-orange explanation is supported. |
| H19: incoming angular/ground contribution | Distant F68 strongly underestimates Mie and overestimates Rayleigh at both sparse P2 receivers; the local 1920 rule stays close to the reference. | Supported for the distant finite angular rule on the tested continuous-N1-driven P2 sources. Current N4 recurrence and final rendered color remain unqualified. |
| H20: composition | Saved sky-only path/composed RGB agree exactly on local center rays; distant discrepancies are zero except one 0.000488 Float32 green increment at 10 degrees. | Scene composition is rejected as the cause at these saved sky-only witnesses. Display compression remains separate; no new raster boundary intervention was performed. |

### Endpoints And Accumulation

The installed Flat dome uses a roughly 18613 km sphere centered below the plane;
1927 km is its near-horizontal reach, not a constant path cap. GPU Flat endpoint
differences from the independent calculation reach 9.84 m, exceeding the initial
four-Float32-ulp distance screen. They are retained as an arithmetic discrepancy,
not silently classified as exact agreement. A separate displacement sensitivity
puts the largest measured spectral effect below 6.50e-8 relative on these rays.
Captured/synthetic direction roundoff remains identified in that sensitivity.
Distant endpoint differences stay below 0.066 m.

The dome-tail computation extends the plane atmosphere only to its physical top;
it never integrates through ground. Its 8/16 refinement is retained separately.
At 0.05 degrees the missing Flat tail is negligible. At 3 degrees it is slightly
warm but much too small to supply a qualitatively orange band under these inputs.

Accumulation replay holds the exact N1 source fixed and changes only the view
policy. Local uses the installed positive source-function/column formulation;
distant uses the installed quadratic-distance midpoint formulation. Actual app
view counts are **15 local and 30 distant**, distinct from cache-transport counts.
The replay uses binary64 stable column arithmetic and does not claim GPU bit parity.
Refining counts reduces the tested errors, but it does not produce the expected
local orange: its converged 3-degree R/B remains about 0.98923.

## Incoming Calculation: Which Errors Balance

The two receiver altitudes are 5 m and 250 m along each mode's 3-degree away-Sun
ray. Both use the same continuous first-order incoming equation and combined
extinction. Selected wavelengths are **438.33, 595 and 751.67 nm**; these three
samples are not an RGB spectrum. Installed incoming rules are local polar40/az48
(1920) and distant source-aligned F68. Independent quadrature uses physical
local-up coordinates, with explicit ground-tangent splits and positive weights.

Errors below are `100 * (installed-rule source / refined source - 1)`.

| Distant receiver | Wavelength | Rayleigh error | Mie error | Total error |
| --- | ---: | ---: | ---: | ---: |
| 5 m | 438.33 nm | +7.17% | -33.71% | -16.90% |
| 5 m | 595 nm | +14.54% | -38.30% | -27.35% |
| 5 m | 751.67 nm | +19.46% | -40.15% | -33.10% |
| 250 m | 438.33 nm | +4.39% | -37.71% | -19.43% |
| 250 m | 595 nm | +11.50% | -42.75% | -30.75% |
| 250 m | 751.67 nm | +15.77% | -45.17% | -37.51% |

Thus coarse angular sampling removes a large amount of aerosol scattering while
adding molecular scattering. The sum hides part of each component error. Its
larger deficit at the longer tested wavelength is a plausible spectral mechanism
for retaining too much blue, but no full-spectrum color correction is established.
The low-elevation region is important: at the 5 m receiver and 595 nm, the
grazing-region source is about 6.38e-8 with F68 versus 1.84e-7 in the refined rule.
Region boundaries are numerical reporting partitions; their individual convergence
is less qualified than the complete smooth source integral.

For the local 1920 rule, total discrepancies range from -0.0264% to +0.0393%.
The largest species discrepancy is about 0.0458%. These are small relative to
the reference's conservative four-times-refinement allowance, so do not assign
strong significance to their individual signs. Moreover, the current local scene
renders N1: its hypothetical P2 source is a diagnostic, not a currently rendered
term. The distant angular defect therefore cannot by itself explain local N1 gray.

Angular 16-to-32 refinement changes the distant total by at most **0.0285%**;
the largest local change is **0.1637%**. Selected incoming directions' 8/16 spatial
refinement differs by at most **1.20e-12 relative**. That sparse screen is not a
rigorous all-direction bound. The refined rule integrates constant Rayleigh/Mie
phase over the sphere to approximately 1 and 0.99999999965. No phase
renormalization, material change or brightness matching was applied.

Both actual app modes select canonical-black atmospheric ground. Downward rays
can still contain atmospheric scattering; direct reflected-ground radiance is
zero by the selected model. The green visible scene does not independently
establish a reflecting atmospheric ground boundary. No alternative ground albedo
was introduced, and a paper-reference comparison must retain its own ground input.

## Verification, Resources And Implementation Handoff

The focused runners are [horizon-audit](../../../../../experiments/sky-accuracy-dials/horizon-audit/).
They retain analytic homogeneous/horizontal column controls, input assertions,
independent refinement, complete derivation parents, per-stage progress and sealed
artifact hashes. Both immutable verifiers pass. No GPU job, dependency install,
full-cache build or production change occurred. Authored code uses the existing
experiment type-check configuration. A post-run JSDoc/ambient return-shape
clarification does not change numerical executable statements; original source
identities remain in each run rather than being relabelled with current hashes.

Recorded runner elapsed through retention milestones is **45.437 seconds**
(18.628 + 26.809), excluding final seal verification, implementation and review.
New retained evidence is **1,068,817 bytes**, bringing the experiment to
**423,202,647 bytes**; scratch is absent and observed free disk remains about
137.94 GB. These are elapsed/storage observations, not CPU utilization or a
production memory estimate. Independent qualification refined the initial angular
reference because its 8/16 difference reached 2.2%; it did not repeat a successful
scientific candidate without cause.

The coherent implementation review baseline is
`.codex-tmp/review-standards/session-wK1HBG/baseline.json`. Its exact final request,
primary/source-first audit reports and `validation.json` own the implementation
gate separately from scientific acceptance. Source checks and review do not
qualify missing full-N4, live-GPU or libRadtran cells.

## Decisions And Remaining Boundaries

1. Use sparse CPU calculations and retained app observations; they answer the
   admitted N1/source questions without a full cache or new GPU allocation.
2. Independently derive endpoints; retain the observer dome as a named model
   assumption and measure its removal instead of presuming it is an erroneous cap.
3. Keep paper material fixed, and identify app geometry, black ground, Native15
   and N1/N4 scope explicitly. Do not mix this with the full paper benchmark.
4. Use production-declared view counts 15/30. The distant 30 count is a view
   selection; the earlier 15 cache-transport count is a different operation.
5. Regenerate continuous N1 only at sparse incoming directions to probe P2;
   missing current N4 incoming fields prevent a complete current-recurrence claim.
6. Refine the angular reference once to 32 after observing nonnegligible 8/16
   differences; retain that decision and the extra cost within the common budget.
7. Retain the Flat endpoint arithmetic discrepancy and measure its spectral
   effect rather than widening the initial distance tolerance after seeing it.
8. Do not claim a shared defect from different color symptoms. The supported
   distant angular mechanism is not active in the local N1 render.

The next useful proposed calculation is to propagate a corrected distant angular
source through a small matched ray/order comparison, preserving the opposing
Rayleigh/Mie errors and comparing full spectra. That needs a separate bounded
registration; it is not automatically started. Local N1 remains a separate open
formulation/material/representation question. Live raster depth classification,
actual distant N4 lookup values, consistent corrected descendants, an upper-sky
angular attribution control and matched libRadtran horizon outputs remain untested.
