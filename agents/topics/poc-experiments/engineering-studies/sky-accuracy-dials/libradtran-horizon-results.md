# H42-H47: Independent libRadtran Distant-Horizon Investigation

Completed follow-on: [H48-H52 Toronto order attribution](toronto-order-attribution-results.md)
owns the0.05-degree per-order/component analysis, controlled recurrence response,
cancellation evidence and final images. H42-H47 below remains its parent evidence.

## H47 Toronto Three-Method Order Comparison

The owner selected first and cumulative-fourth/full colors and spectra for
production, libRadtran and the independent probe at all three Toronto-optics
rays (0.05, 3 and 20 degrees, away from the Sun). Reuse immutable H45/H46
production and external spectra. Add a matched cache-free GPU Monte Carlo
measurement using the original physical registration and Toronto phase/SSA.
No production behavior changes or new external solves are selected.

Adapt the independent transport kernel's aerosol optics only. Evaluate the
normalized 83-node linear-cosine phase and sample it with an analytic inverse
of each segment's quadratic CDF. Verify normalization and inverse residuals
before execution. Unsupported centers retain canonical CS/SSA 0.8. Retain pure
orders 1-4, their cumulative sum and a separate all-order estimate with
compensated roulette starting at order 8. The latter is an estimator of all
orders, not a hard truncation. Black ground and continuous exponential density
match the existing target; the independent probe imports no production cache
or radiance evaluator.

Run a three-band GPU pilot (four batches of 2048 paths), then all 15 channels
and all 3 angles (24 batches of 8192 paths, optical quadrature 128). Retain an
eight-batch paired quadrature 64 control. Initial display precision targets:
3% Y and 10% per-band empirical 95% half-widths; report missed targets explicitly.
Check N1 against the saved direct/external result and full scattering against
libRadtran, retaining intervals and discretization qualifications separately.
Publish fixed-p2 swatches and side-by-side spectral plots with uncertainty.
The independent right column distinguishes cumulative N1-4 from all orders;
production uses cumulative N4 and libRadtran uses all orders, not isolated N4.
Use new immutable runs and the existing progress/cleanup/type-check contract.

### H47 Outcome

Complete through accepted GPU pilot 00322, measurement 00323 and final
[report 00325](../../../../../tmp/experiments/sky-accuracy-dials/runs/00325-h47-order-report/sealed.json).
The [three-angle color image](../../../../../tmp/experiments/sky-accuracy-dials/runs/00325-h47-order-report/comparison.png)
shows first scattering beside production cumulative N4, libRadtran all orders,
and both independent cumulative N4 and all orders. The
[spectral plot](../../../../../tmp/experiments/sky-accuracy-dials/runs/00325-h47-order-report/spectra.png)
uses the same vertical scale across each angle's two columns, with sampling
bands where retained. Dashed green shows independent cumulative N4; solid
green shows independent all orders. SVG versions and complete sampled spectra
are retained alongside the PNGs. These are scientific swatches, not screenshots.

| Elevation | Independent N1 Y | Independent cumulative N4 Y | Independent all-order Y | libRadtran all-order Y | Independent full relative to external |
| --- | ---: | ---: | ---: | ---: | ---: |
| 0.05 degrees | 3145.86 +/-15.55 | 5246.69 +/-38.77 | 5289.39 +/-39.94 | 5280.51 +/-42.89 | +0.168% |
| 3 degrees | 3898.26 +/-12.19 | 6155.76 +/-27.30 | 6200.75 +/-28.42 | 6199.78 +/-23.25 | +0.016% |
| 20 degrees | 2249.43 +/-5.06 | 3144.35 +/-9.59 | 3160.88 +/-9.85 | 3159.09 +/-26.66 | +0.056% |

Y is cd/m2; +/- quantities are empirical 95% sampling half-widths, not physical
model or discretization bounds. Independent full brightness differs from
libRadtran by less than 0.2% at every ray, within the displayed sampling intervals.
Independent N1 differs from the deterministic direct integral by +0.219%,
-0.052% and -0.019%, also within sampling intervals. The marked production
excess develops after N1. This independently corroborates the higher-order
disagreement; it does not finish causal attribution or select a production fix.

The independent N5-and-later tail supplies only 0.807%, 0.726% and 0.523% of full
luminance respectively. Thus the production/external order-limit difference
is small for these cases compared with the production excess. Maximum realized
history depth was 17; compensated roulette, not a fourth-order cap, governs the
full independent estimate. Nonnegative path tallies pass N1<=N4<=all checks.

All new GPU sampling targets pass. Across the nine angle/estimator combinations,
the largest Y half-width is 0.755% and the largest band half-width is 1.096%,
below the registered 3%/10% targets. Paired quadrature 64 versus 128 changes Y by
at most 0.01164 cd/m2, with its paired intervals retained. The canonical kernel's
spherical geometry and hardware precision limitations remain; these checks
do not certify arbitrary atmospheres. The older H46 external N1 per-band
precision limitations remain and are not repaired by this GPU measurement.

The RTX 2060 executed all 15 channels, 3 angles and 32 batches per channel/angle:
24 main batches and 8 paired controls, each 8192 paths. Original Toronto tables
retain unit mass; analytic inverse-CDF residuals pass below 1e-12 in binary64
before shader execution. Kernels, material, physical registration, batch means,
separate physical orders and hardware telemetry are retained in 00323.
[analysis.json](../../../../../tmp/experiments/sky-accuracy-dials/runs/00325-h47-order-report/analysis.json)
retains spectra, uncertainty, precision status and integration controls.

Sandbox browser-spawn failure 00321 remains immutable; corrected pilot 00322
used a new run. First render 00324 remains immutable; 00325 only adjusts label
spacing and displays retained Y uncertainty. No numerical calculation was
rerun for the final image. All owned browsers exited, scratch cleanup and run
verification passed, and local type checking passed. No dedicated reviewers,
production change, commit or further numerical campaign was selected.

Internal reproduction: run
`node experiments/sky-accuracy-dials/distant-horizon/toronto-orders.mjs pilot`,
then `measure`; use `report tmp/experiments/sky-accuracy-dials/runs/00323-h47-gpu-orders`
to derive another figure without repeating transport. Each command creates
new immutable evidence and never reopens prior runs.

## H46 Toronto External First-Order Check

Owner selected matching libRadtran first-order results for Toronto. Reuse the
H45 physical target, direct angular library, default extinction, source, San Jose
noon rays and black spherical boundary. The installed public solver does not
expose the debug scattering-order controls used by other MYSTIC builds; retain
the previously qualified fixed-extinction weak-scattering method.

Scale Rayleigh scattering and each aerosol scattering albedo by epsilon, while
keeping phase and both species' total extinction fixed. Add the removed molecular
scattering to explicit molecular absorption. Then
`L(e)=sum e^n L_n`, with nonnegative orders and no ground source. For
`F(e)=L(e)/e`, use paired epsilons 0.1 and 0.05 and `Q=2F(.05)-F(.1)`.
The exact-mean positive-order bracket is
`Q <= L1 <= (Q+.005Lfull)/1.005`. Report finite-epsilon bracket width separately
from sampling uncertainty; substituting stochastic sample means does not turn
it into a rigorous confidence bound.

First run a supported-band operational pilot (10000 photons). Then run all 15
bands at all three elevations with four paired seed repeats and 1000000 photons
per wavelength. Match the already-qualified full-reference grids: 768 layers at
the horizon, 384 layers at 3°/20°. Reuse accepted 00315 full scattering without
rerunning it. Publish repeated-seed Student95 intervals, per-band uncertainty,
finite-epsilon bounds, three-way N1 spectra/colors and an updated production/
libRadtran first/full horizon image. Initial precision targets are 2% luminance
and 5% per-band empirical half-widths; retain failures rather than hiding them.

The displayed independent N1 uses a separate deterministic direct integral.
The broader [GPU probe](../../../../../experiments/sky-accuracy-dials/horizon-reference/gpu.mjs)
separately accumulates physical orders 1–4, all-order radiance and the
higher-order tail, but its current kernel hardcodes canonical aerosol phase/SSA.
At H46 it had not produced matched multi-order Toronto results. H47 above now
provides the contained Toronto adaptation and matched GPU measurements; H46
itself evaluates external N1 only.

### H46 Outcome

Complete through accepted pilot 00318, 24-case measurement 00319 and
[report 00320](../../../../../tmp/experiments/sky-accuracy-dials/runs/00320-h46-n1-report/sealed.json).
The [three-way N1 colors](../../../../../tmp/experiments/sky-accuracy-dials/runs/00320-h46-n1-report/comparison.png)
and [N1 spectra](../../../../../tmp/experiments/sky-accuracy-dials/runs/00320-h46-n1-report/spectra.png)
compare production, independent direct integration and external first-order
estimates. The updated [first/full horizon image](../../../../../tmp/experiments/sky-accuracy-dials/runs/00320-h46-n1-report/horizon.png)
now uses libRadtran in both bottom-row cells: extrapolated N1 and the saved
all-order result. All figures use unchanged H45 illumination and production p2
display. No full-scattering or production compilation was rerun.

| Elevation | libRadtran N1 estimate Y ± empirical 95%, cd/m² | Independent direct N1 Y | External relative to direct | External linear R/B ± empirical 95% |
| --- | ---: | ---: | ---: | ---: |
| 0.05° | 3125.60 ± 56.58 | 3138.98 | -0.43% | 1.23052 ± 0.06719 |
| 3° | 3912.51 ± 88.81 | 3900.28 | +0.31% | 1.13066 ± 0.05352 |
| 20° | 2245.32 ± 34.23 | 2249.84 | -0.20% | 0.51982 ± 0.06943 |

The mean brightness estimates differ from the direct integral by less than
0.5% at all three rays, with the direct values inside their sampling intervals.
The external N1 horizon is warm and closely matches the other first-order
calculations. This strengthens the evidence that the pronounced production
cyan excess develops after first scattering. It does not yet supply a matched
external or independent GPU N2–N4 sequence, or identify the entire error budget.

Finite-epsilon error remains separate. Evaluating the positive-order bracket
with the sample means gives Y intervals [3125.60,3136.32], [3912.51,3923.89] and
[2245.32,2249.87] cd/m² before sampling uncertainty. These are truncation
diagnostics, not rigorous bounds on the stochastic estimates or combined
confidence intervals. Maximum point-estimate per-band bracket widths are
0.871%, 0.843% and 0.660% respectively.

The registered initial precision targets were not all met. Luminance empirical
half-widths are 1.81%, 2.27% and 1.52%; the 3° control exceeds the initial 2%
target. Maximum individual-band half-widths are 8.55%, 8.44% and 17.44%, exceeding
the initial 5% target. No claim of a fully converged per-wavelength spectrum is
made. The estimate and its explicit intervals support the first-order color/
brightness comparison; finer per-band attribution would require more samples.
The [analysis](../../../../../tmp/experiments/sky-accuracy-dials/runs/00320-h46-n1-report/analysis.json)
retains all paired spectra, band/color intervals, finite-epsilon diagnostics
and precision flags.

Both molecular and aerosol scattering were reduced by the same epsilon at
unchanged total extinction. Molecular removed scattering becomes explicit
absorption; aerosol SSA scales at unchanged aerosol extinction. Every native
case preserves actual source/execution hashes, the resolved spherical/VROOM-off
deck, raw output and input proofs. All 24 executions succeeded, with about
17.09 minutes of native-tool invocation time in total. Every owned process
exited and scratch was cleaned. Local type checking and visual inspection
passed; no dedicated standards reviewer or audit was run. No production
change or additional numerical campaign is selected.

## H45 Toronto Aerosol Horizon Comparison

Owner selected matched Toronto-atmosphere horizon probes for production and
libRadtran. Interpret Toronto as the same retained AERONET Level 1.5 retrieval
used in H7: Toronto, 2013-05-27 13:19:01 UTC, instrument 614. Keep H44's
San Jose solar-noon direction, 5 m observer, black spherical surface, source,
Rayleigh coefficients, aerosol extinction and height profiles. Substitute the
normalized 83-node phase table and wavelength-dependent SSA at supported
Native15 centers (>=440 nm); below 440 nm preserve canonical CS/SSA0.8, with
no extrapolation. This is a partial optical-material intervention, not a full
retrieved Toronto atmosphere, changed aerosol optical depth, or Toronto sky.

The production algorithm requires an experiment-only optical adapter: the
bundler replaces only the compiler's `miePhase` GLSL function with the retained
piecewise-linear table, and supplies the corresponding SSA per wavelength.
Compiler source, deployment, cache lookup, grids, transport settings and view
samples remain unchanged. Record original and adapted source identities;
retain Q30/Q60/Q120 views and same-input binary64 replay parity.

Independent fully spherical scalar MYSTIC uses VROOM off and an explicit direct
angular optical library with matched phase/SSA and exact exponential layer
columns. The initial long-moment approach was cancelled in immutable 00311
after identifying this release's redundant per-layer phase expansion cost;
no scientific result was obtained. Accepted direct-table pilot 00312 imported
three bands successfully in about seven seconds. Full-band attempt 00313
rejected the optical grid because the native Float32 wavelength lay just below
its double-precision endpoint; it produced no scientific result. The corrected
library duplicates endpoint properties at +/-0.001 nm to cover native rounding,
without changing the fifteen actual centers or extending measured aerosol data.
Accepted all-fifteen-band pilot 00314 qualified that ingress. Native source
and executable remain unchanged. The replacement uses the original 83-node
linear cosine shape directly above 440 nm, and samples the original CS phase
at 0.1 degrees below 440 nm. Independent binary decoding checks wavelength, extinction,
SSA, phase positivity and normalization; maximum phase error is 0.001193%.
Use four seeds and 100000 photons per wavelength at 0.05, 3 and 20 degrees. Check
the horizon with doubled layers and independently with extra exact linear
midpoints (CS 0.05 degrees), retaining paired sampling intervals separately.
Preserve all raw cases and actual-input hashes.
Run one solver at a time; publish progress and fixed-p2 comparison images.
Local type/proof checks apply; no dedicated standards reviewers or audits.

### H45 Outcome

Complete: accepted production-algorithm run 00310 and independent reference
00315 feed accepted [final report 00316](../../../../../tmp/experiments/sky-accuracy-dials/runs/00316-h45-report/sealed.json).
The [paired colors](../../../../../tmp/experiments/sky-accuracy-dials/runs/00316-h45-report/comparison.png),
[default/Toronto material response](../../../../../tmp/experiments/sky-accuracy-dials/runs/00316-h45-report/material-effect.png)
and [spectra](../../../../../tmp/experiments/sky-accuracy-dials/runs/00316-h45-report/spectra.png)
use the same fixed production p2 display and 117791.5323 lux. They are sampled
spectral colors, not screenshots. The external reference has four independent
seeds at each case; quoted intervals are empirical Student95 half-widths.

| Elevation | Production algorithm N4 Y, cd/m² | libRadtran all orders Y, cd/m² | Production relative Y | Production / reference linear R/B |
| --- | ---: | ---: | ---: | ---: |
| 0.05° | 17575.05 | 5280.51 ± 42.89 | +232.83% | 0.62009 / 0.88349 |
| 3° | 15311.96 | 6199.78 ± 23.25 | +146.98% | 0.54062 / 0.76735 |
| 20° | 5499.56 | 3159.09 ± 26.66 | +74.09% | 0.34055 / 0.37885 |

The material brightens the independently solved horizon by **39.69%** relative
to H44, while the production algorithm brightens it by **317.99%**. The external
horizon becomes less blue and closer to neutral: linear R/B changes from
0.61904 to 0.88349, and fixed-display RGB8 changes from (156,171,201) to
(197,201,208). It remains dimmer than the external 3° sample. Production's
much larger response yields RGB8 (242,254,253) and reverses that gradient.
Thus this material intervention does brighten/neutralize the independent
horizon, but the nearly white production result substantially overstates it.

Doubling the external layers changes horizon Y by -0.001875%, with paired
difference -0.0990 ± 1.2528 cd/m². Independently refining the angular table
changes Y by 0.000000226% in these paired realizations. Q30-to-Q120 production
view refinement changes Y by +0.878%, +0.133% and +0.626% respectively. These
controls do not explain a 233% horizon excess. N4 versus external all orders
remains an order-limit distinction, but omitted positive physical higher orders
alone cannot explain an already brighter N4 estimate.

### H45 Calculation Diagnostics

The retained [diagnostics](../../../../../tmp/experiments/sky-accuracy-dials/runs/00316-h45-report/diagnostics.json)
identify a concrete angular-resolution problem for this sharper optical input.
For a constant incident radiance, the normalized continuous phase must integrate
to one. Applying the existing F68 weights to Toronto's phase over all W27
outgoing nodes instead gives values up to **5.9918** at 469.7 nm and **5.6872**
at 532.3 nm. The canonical CS control spans 0.6500–1.4179 on the same nodes.
The Toronto table's global normalization is correct; sparse angular sampling
can hit its narrow forward peak and greatly overcount it for some directions.
The arithmetic mean over W27 nodes is not a physical solid-angle average and
must not be used to dismiss these directional errors.

An independent continuous N1 integration gives horizon Y 3138.98 versus
production N1 3045.35 (-2.98%). At 3°/20°, production N1 differs by +2.77%/+2.56%.
The independent Q2048-to-Q4096 view change is below 4e-9 relative. Production's
cumulative horizon Y is 3045.35, 4726.39, 7226.12 and 17575.05 through N1–N4.
This locates the large response after first scattering and supports angular
overcounting as a testable mechanism. It does not assign the complete radiance
residual causally: a matched angular intervention is still needed. Differences
between cumulative cubic reconstructions are not isolated exact pure orders.
This result concerns the contained Toronto optical adapter; it does not change
the scope or conclusions of the matched canonical-atmosphere H44 comparison.

### H45 Qualification And Execution

The [input qualification](../../../../../tmp/experiments/sky-accuracy-dials/runs/00316-h45-report/input-qualification.json)
authenticates all twenty original/executed case files against native tool
manifests. Each binary library is independently decoded to check wavelengths,
extinction, SSA, phase and normalization. The largest checked angular phase
representation error is 1.193e-5 relative; exponential layer-column error is
below 4e-15. Controls excluding the explicit material equal H44 exactly, and
all 108 unsupported-band cumulative spectral values are exactly equal.
Same-input GPU/binary64 lookup relative discrepancy is 2.582e-6. The physical
means, uncertainty and view/angular/layer controls are in the
[analysis](../../../../../tmp/experiments/sky-accuracy-dials/runs/00316-h45-report/analysis.json).

Browser launch failure 00309, cancelled long-moment attempt 00311 and wavelength
edge rejection 00313 remain immutable. Pilots 00312/00314 and the final 00310,
00315 and 00316 runs verify successfully. The all-order reference uses native
direct-table inputs and no executable patch or rebuild. Every owned solver and
browser exited; scratch cleanup passed. Local type checking and source
self-review apply; no dedicated standards reviewers or audits were run.
Production/deployed caches remain unchanged. No further numerical campaign or
production change is selected.

### H45 First-Order / Full-Scattering Display

Accepted derivative [00317](../../../../../tmp/experiments/sky-accuracy-dials/runs/00317-h45-order-view/sealed.json)
renders the saved first-order and full-scattering spectra side by side. The
[horizon colors](../../../../../tmp/experiments/sky-accuracy-dials/runs/00317-h45-order-view/horizon.png)
show production N1/N4 above independent direct N1/libRadtran all orders.
The [all-elevation colors](../../../../../tmp/experiments/sky-accuracy-dials/runs/00317-h45-order-view/all-elevations.png)
include the 3- and 20-degree controls. Both use the same physical brightness,
Native15 midpoint CIE projection, fixed 117791.5323 lux and production p2 display
as 00316, with no equal-Y scaling or exposure adjustment.

The [paired spectral plots](../../../../../tmp/experiments/sky-accuracy-dials/runs/00317-h45-order-view/spectra.png)
use the same radiance scale across the first/full columns at each elevation.
Independent N1 is the saved continuous Q4096 direct integral, not a libRadtran
first-order measurement. Production full remains N4; independent full includes
all orders. Source spectra, physical colors and encoded RGB are retained in
[colors.json](../../../../../tmp/experiments/sky-accuracy-dials/runs/00317-h45-order-view/colors.json).
The horizon N1 pairs are warm and close in appearance; the pronounced cyan
excess develops in the production cumulative result. This is a display-only
derivative: no transport, cache compilation or previous evidence was changed.
Local type checking passed, all figures were visually inspected, the run
verifies successfully, and its browser exited with scratch cleaned.

## H44 Matched Full-Aerosol Continuation

The owner selected the 100% aerosol comparison on 2026-10-16. Reuse H40's
physical registration with its full canonical aerosol extinction, 1200 m scale
height, SSA 0.8 and Cornette–Shanks shape parameter 0.7. Keep the H43 source,
Rayleigh coefficients, spherical boundaries, black surface, 5 m observer,
San Jose solar-noon direction and away-Sun elevations 0.05, 3 and 20 degrees.
No production atmosphere or compiler changes are selected.

Construct explicit aerosol layer files with exact exponential column averages
and 96 analytic Cornette–Shanks Legendre moments; check phase reconstruction
against the analytic function before launch. Use fully spherical scalar MYSTIC
with VROOM off. First run a three-band 10000-photon pilot. Then measure all
15 bands at 100000 photons per wavelength in four independent seeded repeats,
including a doubled-layer horizon control. Authenticate actual retained solver
inputs, keep empirical sampling uncertainty separate from discretization, and
preserve every failed attempt. One external solver runs at a time.

Replay the unchanged selected Native48/Z180/W27/F68 production compiler and
cubic lookup on the GPU, matching full aerosol coefficients and retaining
N1–N4 with Q30/Q60/Q120 view integration. Include aerosol extinction in the
matched view equation and check same-input GPU/binary64 parity. Compare N4
with external all-order transport, explicitly retaining that order-limit
difference. Publish fixed-production-p2 swatches and radiance spectra without
white balance or exposure fitting. Local type/proof checks apply; dedicated
reviewers and audits are disabled under repository experiment policy.

### H44 Outcome

The comparison is complete. The [final side-by-side image](../../../../../tmp/experiments/sky-accuracy-dials/runs/00308-h44-report/comparison.png),
[zero/full aerosol image](../../../../../tmp/experiments/sky-accuracy-dials/runs/00308-h44-report/aerosol-effect.png)
and [spectral figure](../../../../../tmp/experiments/sky-accuracy-dials/runs/00308-h44-report/spectra.png)
use matched physical inputs and fixed production p2 display settings. These
are solved spectral colors, not app screenshots. The horizon reference uses
the finer 768-layer grid; 3° and 20° use 384 layers. Each includes four
independent seeds at 100000 photons per wavelength, over all fifteen bands.

| Elevation | Production N4 Y, cd/m² | libRadtran all-order Y, cd/m² | Production relative Y | Production / reference linear R/B |
| --- | ---: | ---: | ---: | ---: |
| 0.05° | 4204.62 | 3780.24 ± 28.54 | +11.23% | 0.56413 / 0.61904 |
| 3° | 5425.26 | 4954.85 ± 20.63 | +9.49% | 0.58163 / 0.61174 |
| 20° | 2947.16 | 2724.99 ± 31.73 | +8.15% | 0.31841 / 0.32409 |

Intervals are empirical repeated-seed Student 95% intervals; they do not
include model or discretization uncertainty. The comparison retains the
production N4 versus external all-order limit difference. Missing positive
higher orders cannot by themselves explain an already brighter N4 estimate.

**The full-aerosol atmosphere independently produces a dim blue-gray horizon.**
External horizon Y is 42.20% of the zero-aerosol result, while production
retains 46.32%. The full-aerosol horizon is also dimmer than 3°: its Y ratio
is 0.76294 externally and 0.77501 in production. Under these inputs, a closer
numerical match would darken production slightly further. This supports an
atmospheric origin for the main dark band while retaining a genuine numerical
residual; it does not validate an arbitrary screenshot, local Sun, real-world
aerosol composition, or full-cache paper RMSE.

Production's excess is strongest at short wavelengths: maximum native-channel
relative residuals are 30.73%, 24.38%, and 12.51% at the three elevations.
The horizon is also somewhat bluer in production. A uniform display gain is
insufficient to describe the spectral residual. Both images use the same
mapping without white balance, normalization, or fitted exposure.

Doubling layers changes external horizon Y by −0.0170%, or −0.643 cd/m²;
the paired-seed difference has a 95% half-width of 1.724 cd/m². Production
Q30-to-Q120 view refinement changes horizon Y by +0.850%, increasing its
brightness excess. Neither tested refinement closes the gap. The same-input
GPU/binary64 lookup parity discrepancy is at most 2.379e−6 relative.

The matched independent H40 first-order reference is 2187.13 cd/m² at the
horizon, versus production N1's 2113.06 cd/m² (−3.39%). Its sign differs from
the cumulative N4/all-order comparison. That is evidence of changing error
balance as later scattering is included, rather than one common brightness
factor. It does not isolate an individual recurrence calculation or pure
species/order contribution; cumulative Hermite reconstructions remain nonlinear.
The zero-aerosol brightness residual was only +1.324% at this ray, so the larger
full-aerosol discrepancy is sensitive to aerosol-dependent transport/coupling.

### H44 Evidence And Qualification

Accepted pilot 00302 preceded the 79.1-second accepted production GPU measurement
[00303](../../../../../tmp/experiments/sky-accuracy-dials/runs/00303-h44-prod-full/sealed.json).
All sixteen individual external tool executions succeeded. Aggregate 00304
retains their complete measurements and an accepted seal, but its final
verifier rejected two operational heartbeat gaps of 35.478 and 40.145 seconds
during case handoffs. That aggregate remains unchanged and unqualified for its
monitoring contract. No solver calculation was repeated.

Accepted numerical qualification
[00307](../../../../../tmp/experiments/sky-accuracy-dials/runs/00307-h44-ref-qual/sealed.json)
authenticates every aggregate artifact, then independently authenticates the
sixteen finalized shared-tool manifests, actual resolved decks, original and
executed input copies, and raw radiance files. It checks seeds, source units,
view geometry, actual production coefficients, both distinct optical grids,
and identical optical-input hashes across repeats. Every spectrum, mean and
empirical interval is recomputed or compared against authenticated raw values.
Actual aerosol layer-column discrepancies are below 1.85e−14 relative;
molecular layer columns match exactly in binary64. Actual phase reconstruction
agrees with Cornette–Shanks within 1.56e−12 at the checked directions.
The input generator's separate 2001-direction reconstruction check bounds its
96-moment truncation below 1e−8. This is the Cornette–Shanks g=0.7 shape,
whose first Legendre coefficient is 0.7573494, without an HG substitution.

Accepted derived report
[00308](../../../../../tmp/experiments/sky-accuracy-dials/runs/00308-h44-report/sealed.json)
owns [analysis](../../../../../tmp/experiments/sky-accuracy-dials/runs/00308-h44-report/analysis.json)
and [compatibility](../../../../../tmp/experiments/sky-accuracy-dials/runs/00308-h44-report/compatibility.json).
Its actual reference parent is 00307; the zero-aerosol parent retained inside
the production measurement's earlier provenance is not used as H44 reference
radiance. The zero/full production requests are checked to differ only in
aerosol extinction. Progress images 00305/00306 remain preserved as explicitly
preliminary derivatives of individually finalized solver runs.

Future case staging now flushes progress every 32 input files and immediately
after solver return; input qualification also flushes during grid checks. This
repairs the handoff gap mechanism without changing the timing requirement or
rewriting prior evidence. Local type checking and new-run verification passed;
final images were inspected. All owned solver/browser processes exited and
scratch cleanup passed. Dedicated reviewers and audits were disabled throughout
H44. Production source, configuration and deployed cache are unchanged. No
additional numerical run or production change is selected.

## H43 Matched Production Comparison

The owner selected this follow-on after H42: evaluate the unchanged production
distant-cache compiler and production cubic lookup under the reference's exact
zero-aerosol inputs, then publish a new comparison image. Rebuild an isolated
cache field with Native48/Z180/W27/F68, anchored radial geometry, source Q20,
transport Q15 and cumulative N4. Match the retained native15 source/Rayleigh
packets, radii, density heights, zero aerosol/absorption, black ground, 5 m
observer and away-Sun rays at 0.05, 3 and 20 degrees.

Retain all four pure scattering-density orders and Float32 cumulative sums at
the exact required cache taps. Replay the production cubic lookup on the GPU,
with the ordinary quadratic Q30 view integration and diagnostic Q60/Q120
refinement on the same fields. A one-channel packet replay may relocate that
scalar to the first RGBA component without changing Float32 values or lookup
weights. Keep numerical view refinement distinct from cache refinement.

Compare production N1 with the external N1 estimate and production N4 with
external all-order transport. Report the order mismatch explicitly: a residual
against all orders is not automatically a cache error. Inspect individual order
increments and use a further independent order control only if that uncertainty
prevents a useful conclusion. Never presume a production defect.

Use one hardware GPU job at a time, first a single-channel operational pilot,
then all fifteen channels if the pilot validates. Publish comparison colors at
the actual measured elevations and spectral curves with fixed existing p2
exposure and independent CIE projection. Label these as sampled spectral colors,
not app screenshots. No production source, deployed package or prior run changes.
The coherent H43 review baseline is
`.codex-tmp/review-standards/session-1iFHYX/baseline.json`.

### H43 Outcome

The accepted [matched production measurement](../../../../../tmp/experiments/sky-accuracy-dials/runs/00299-h43-prod-full/sealed.json)
and [derived report](../../../../../tmp/experiments/sky-accuracy-dials/runs/00300-h43-report/sealed.json)
complete this selected scientific comparison. The
[comparison PNG](../../../../../tmp/experiments/sky-accuracy-dials/runs/00300-h43-report/comparison.png)
and [SVG](../../../../../tmp/experiments/sky-accuracy-dials/runs/00300-h43-report/comparison.svg)
show production N1, production N4 and external all-order colors at the same
measured elevations. The
[spectral figure](../../../../../tmp/experiments/sky-accuracy-dials/runs/00300-h43-report/spectra.png)
shows their radiance spectra. These are actual solved spectral colors at fixed
exposure, not app screenshots or a photographed atmosphere.

| Elevation | Production N1 R/B | Production N4 R/B | libRadtran all-order R/B | Production N4 Y / reference Y, cd/m² |
| --- | ---: | ---: | ---: | ---: |
| 0.05° | 1.25007 | 0.93949 | 0.95111 ± 0.00537 | 9077.55 / 8958.93 ± 42.34 |
| 3° | 0.80103 | 0.58662 | 0.58570 ± 0.00895 | 7417.99 / 7351.87 ± 35.58 |
| 20° | 0.36524 | 0.26916 | 0.26864 ± 0.00768 | 2534.99 / 2520.00 ± 50.10 |

The matched full production calculation is nearly neutral at the horizon,
close in appearance to the independent reference. It does not reproduce the
warm N1 cast. At 0.05°, cumulative production R/B changes from 1.25007 at N1
to 1.03207 at N2, 0.96189 at N3 and 0.93949 at N4. The corresponding additional
Y values are 1469.82, 273.16 and 52.58 cd/m². These are differences between
cumulative reconstructions; nonlinear Hermite interpolation means they must
not be described as independently isolated exact pure radiance orders.

Production N4 is 1.324% brighter than the all-order reference at 0.05°, 0.899%
at 3°, and 0.595% at 20°. The 0.05° production color is slightly cooler than
the reference. These residuals are retained, rather than calling the match
exact or assigning the residual wholly to omitted orders. Missing positive
physical higher orders cannot by themselves explain an already brighter N4
estimate, although production discretization and reference uncertainty remain.
No isolated component attribution is established here.

The Q30-to-Q120 change in N4 Y is +0.139% at the horizon, +0.050% at 3° and
+0.088% at 20°. The largest corresponding spectral changes are 0.899%, 0.391%
and 0.102%. Thus view refinement changes the residual modestly and does not
restore a warm horizon. This tests view integration on the same cached fields;
it does not prove convergence of the altitude/direction/solar cache grids.

The rebuild's starting numerical identity exactly matches the selected deployed
package: `sha256:afd1ae6a7d3e84a13d82e5f24a1fb8c12e485b7d60b09ec86e0e6a46e0f3ea80`.
The production compiler and cubic lookup source are unchanged. Each wavelength
is compiled on hardware, using 1,022 required recurrence coordinates and 415
physical rows. Single-channel Float32 packet remapping preserves scalar values;
same-input binary64 replay differs from GPU radiance by at most 2.51e−6 relative.
The proof constructs view geometry in binary64 before rounding shader uniforms;
it qualifies the compiler/lookup and explicit production view equation, not
every stage of the live application's geometry or display pipeline.

The installed production atmosphere was not changed. This is a matched
zero-aerosol calculation, so it does not establish what the default aerosol
atmosphere, an arbitrary screen capture, or the local Sun should look like.
It supports the narrower conclusion that the current production cache/lookup
can produce the independently expected nearly white zero-aerosol horizon.
The full-cache paper-RMSE gate is unaffected.

The [analysis](../../../../../tmp/experiments/sky-accuracy-dials/runs/00300-h43-report/analysis.json)
owns the metrics; the [compatibility record](../../../../../tmp/experiments/sky-accuracy-dials/runs/00300-h43-report/compatibility.json)
owns the authenticated deployed configuration, matched request, GPU identity
and parity. Accepted pilot 00298 preceded the 67.74-second full run. Failed
00297 remains preserved: Windows path normalization rejected browser startup;
the corrected attempt used a new run. 00300 only derives figures and metrics.
Every browser exited and owned scratch was cleaned. Local type checking passed;
the final native validation in session-1iFHYX owns the separate H43 source-review
completion gate. No further numerical run or production change is selected.

### H43 Display Conversion Comparison

The owner requested the saved production N4 and libRadtran all-order spectra
through three complete display conversions. Accepted derivative
[00301](../../../../../tmp/experiments/sky-accuracy-dials/runs/00301-h43-displays/sealed.json)
reuses 00299 without recomputing transport or changing physical inputs.
The [horizon PNG](../../../../../tmp/experiments/sky-accuracy-dials/runs/00301-h43-displays/comparison.png)
shows paired 0.05-degree swatches; the
[all-elevations PNG](../../../../../tmp/experiments/sky-accuracy-dials/runs/00301-h43-displays/all-elevations.png)
also includes 3 and 20 degrees. These remain sampled spectral colors, not app
screenshots. Production includes orders 1–4; the external reference includes
all orders.

Columns show the previous independent bin-integrated CIE/D65 projection with
the p2 display curve, the repository's `BrunetonColorDisplayModel`, and the
selected production p2 model. The two model columns use their own midpoint CIE
projection and rounded XYZ-to-sRGB matrix. Every column uses the same saved
spectra and fixed illumination, with no exposure fitting, white balance,
normalization or additional gamma. The repository Bruneton model is the exact
implementation compared here, not a claim about every original-paper demo
display setting.

| Horizon source | Previous swatch RGB8 | Bruneton model RGB8 | Production p2 RGB8 |
| --- | --- | --- | --- |
| Production N4 | 236, 237, 239 | 236, 237, 240 | 236, 237, 240 |
| libRadtran all orders | 236, 237, 238 | 236, 236, 239 | 236, 236, 239 |

At the retained 117791.5323 lux, p2's common gain is 1.000242249. Bruneton and
p2 therefore quantize identically in all six swatches. The independent
projection changes individual channels by at most two RGB8 steps here.
[colors.json](../../../../../tmp/experiments/sky-accuracy-dials/runs/00301-h43-displays/colors.json)
retains unquantized display values, physical spectra and conversion identities;
the sealed derivation retains parent and implementation identities. No solver,
cache or production configuration changed. This display-only extension has its
own source-review baseline and final validation in session-luoNfs.

## H42 Reference Registration

Owner selected this continuation on 2026-10-16. The question is whether an
external radiative-transfer solver reproduces the warm, zero-aerosol distant
horizon in [H40](distant-aerosol-results.md), and how later scattering changes
that result. Production is not presumed wrong and remains read-only.

## Registered Method

Authenticate H40's accepted seal, physical registration and ray spectra. Match
the spherical radius, 60 km upper boundary, 5 m observer, San Jose solar-noon
source direction, native15 source spectrum, exponential 8 km molecular density,
Rayleigh coefficients and zero aerosol. Use scalar, unpolarized transport with
zero Rayleigh depolarization and no refraction. Explicit layer optical depths
replace default molecular scattering and absorption. Solar inputs use mW;
convert solver radiance to the parent's W units explicitly.

Use the existing libRadtran 2.0.1-MYSTIC installation through the shared tool.
Select fully spherical MYSTIC, not a plane-parallel or pseudo-spherical
near-horizon reference. Start with a small operational/geometry pilot; inspect
actual outputs before increasing photon counts or spectral coverage. Run one
solver process at a time with bounded tool timeouts, awaited completion and
experiment progress heartbeats. The CPU is appropriate for this external
solver; do not substitute the production GPU algorithm as the reference.

The public 2.0.1 parser excludes `mc_maxscatters` and `mc_std`. Isolate first
order without rebuilding or patching it: hold total extinction fixed, multiply
Rayleigh scattering by epsilon, and replace the removed scattering with pure
absorption. Then `L(epsilon)/epsilon = L1 + epsilon L2 + ...` for a black
surface. Compare epsilon 0.01 and 0.002 and the retained independent N1 result;
report finite-epsilon contamination separately from Monte Carlo noise. These
artificial weak-scattering cases are mathematical controls, not alternative
production atmospheres.

Compare full scattering at epsilon 1 separately. A black surface matches the
absence of a ground source in H40 N1; its all-order result is conditional on
that boundary and is not the complete production-cache result. Check the away
horizon at 0.05 degrees and higher-elevation controls at 3 and 20 degrees.
Use independently repeated executions to estimate sampling uncertainty; increase
counts only where uncertainty prevents a useful conclusion. Refine the vertical
layer representation independently. Never call a single stochastic result
converged or attribute a discrepancy to cache interpolation without matching
scattering order and physical boundaries.

Recovery registration after the first low-sample screen: use 30,000 photons per
wavelength for full-scattering cases and 3,000,000 for the rare-scattering
controls, with four distinct deterministic repeat seeds. Reuse each repeat's
seed across interventions so paired differences can retain covariance. The
public parser accepts `mc_randomseed`; no native source change is needed.
Measure the full horizon first to publish an early useful color comparison.

Before treating these results as a reference, run an explicit `mc_vroom off`
control. The selected release warns that its default variance reduction was not
validated for spherical geometry. Preserve the default-mode package and compare
physical means with the disabled-mode repeats under the same spectrum, radius,
observer and boundary. Qualify the central horizon with the disabled mode and
retain sampling intervals; agreement at this case does not certify the option
for unrelated scenes. No native rebuild or solver patch is selected.

For that disabled-mode qualification, improve sampling efficiency with epsilon
0.10 and 0.05 at fixed extinction, eight repeat seeds and 1,000,000 photons per
wavelength. Use 30,000 photons for the full-scattering counterparts. Let
`F(e) = L(e)/e` and `Q = 2 F(0.05) - F(0.10)`. Nonnegative physical scattering
orders imply the exact-mean bracket
`Q <= L1 <= (Q + 0.005 Lfull) / 1.005`, channel by channel. Its finite-epsilon
width is at most about 0.5% of the higher-order contribution. This cancels the
leading higher-order term while avoiding the very rare events of epsilon
0.002. Report that truncation bracket separately from empirical sampling
uncertainty; substituting noisy sample means does not turn it into a rigorous
confidence bound. Reuse paired seeds across the two epsilon settings.

Retain spectra, source-relative R/B, physical CIE xy/Y and uncertainty. Reuse
the independently checked bin-integrated CIE projection. Produce a reviewable
comparison figure after the first useful color results and at final reporting,
with physical equal-Y swatches and fixed p2 display colors clearly labelled.
Swatches and interpolated profile strips must not be called actual scene
captures. Do not fit exposure, change white balance or neutralize the source.

## Execution And Evidence Boundary

Authored controls and runners remain under
`experiments/sky-accuracy-dials/distant-horizon/`. Experiment evidence uses new
immutable runs below `tmp/experiments/sky-accuracy-dials/`. The separately
authorized shared tool owns its raw `.codex-tmp/libradtran/runs/` records; consume
those read-only, authenticate and retain their input/output identities and
derivation links in the experiment run. Copy needed compact solver artifacts
into the experiment evidence before scratch cleanup. Preserve every earlier run.

Use the existing storage, progress, seal and cleanup contract. Sixty minutes is
guidance: continue while monitored positive progress is being made. Record
failed attempts and use a new run for a corrected attempt. Do not leave an old
process running when retrying. Batch the mapped source review after the coherent
runner and scientific report stabilize. Review baseline:
`.codex-tmp/review-standards/session-ogp1vu/baseline.json`.

## Outcome

The independent solver reproduces a warm first-order limit, consistent with
H40 within sampling uncertainty. Including later scattering produces a brighter,
nearly neutral, slightly cool horizon under these same zero-aerosol inputs.
H40's warm image was an N1 diagnostic; it was not an all-order cache result.

The accepted [final report](../../../../../tmp/experiments/sky-accuracy-dials/runs/00296-h42-report/sealed.json)
derives from accepted 00294 (24 cases, default variance reduction) and 00295
(48 cases, VROOM explicitly disabled). The
[comparison swatches](../../../../../tmp/experiments/sky-accuracy-dials/runs/00296-h42-report/comparison.svg)
show H40 N1 beside the independently solved colors, at fixed p2 exposure and
at equal physical Y. The
[spectral comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00296-h42-report/spectra.svg)
shows where later scattering adds light. These figures are solved spectral
comparisons, not production scene captures.

At the away-facing 0.05-degree horizon, R/B uses signed physical linear sRGB;
D65 neutral has R/B=1. Quoted plus/minus values are empirical two-sided 95%
sampling half-widths, not bounds on physical-model error.

| Calculation | Physical R/B | Y, cd/m² | CIE xy |
| --- | ---: | ---: | --- |
| H40 independent N1 | 1.23899 | 7283.11 | (0.32687, 0.34442) |
| libRadtran extrapolated N1 | 1.21617 ± 0.03163 | 7228.32 ± 70.32 | (0.32558, 0.34371) |
| libRadtran full scattering, 512 layers, VROOM off | 0.95111 ± 0.00537 | 8958.93 ± 42.34 | (0.30939, 0.32561) |

The full-scattering horizon is 23.01% brighter than H40 N1. Its color and
brightness are stable under the checked vertical refinement: 256 to 512 layers
changes paired R/B by −0.0000134 ± 0.0000328 and Y by −0.000204% ± 0.000232%.
This is a measured refinement response at this case, not a global continuum
error bound.

Disabling the flagged variance reduction preserves the conclusion. The earlier
default-mode full horizon has R/B=0.94915 ± 0.00947, consistent with the disabled
mode. The qualified result uses the disabled mode and its warning is absent.
No general claim about VROOM in other spherical scenes follows.

At 3 degrees, qualified full scattering gives R/B=0.58570 ± 0.00895 and
Y=7351.87 ± 35.58 cd/m²; at 20 degrees, R/B=0.26864 ± 0.00768 and
Y=2520.00 ± 50.10 cd/m². The horizon is brighter and much less blue than the
higher sky, rather than a uniformly neutral field.

## Physical Interpretation

The retained source spectrum is already warm relative to D65: R/B=1.13272,
xy=(0.32151, 0.33081). Neither the source nor white balance was changed for this
test. Long near-horizontal paths and source-path attenuation leave a warm
first-order contribution. The independent N1 estimate supports that behavior;
its maximum spectral point difference from H40 is 1.82%, with sampling
uncertainty retained separately.

Later Rayleigh scattering adds proportionally more blue light. Relative to the
external N1 estimate, full scattering adds about 52.5% at 438.3 nm, 24.7% at
532.3 nm and 15.8% at 626.3 nm. The estimated additional-light spectrum has
R/B=0.3988 and supplies about 19.3% of the full horizon's luminance. These are
differences of the retained stochastic estimates, including their finite-epsilon
and discretization limits, rather than individually isolated exact orders.

Rayleigh scattering redirects blue wavelengths more strongly. A first-order
view includes only direct sunlight scattered once toward the observer. Later
orders also bring light that has already scattered elsewhere into that viewing
path. In this optically long horizon view, that additional light substantially
changes the spectral balance and removes the first-order warm cast.

This establishes an independent expected appearance for the specified model.
It does not establish a defect in the current production cache: H40 itself
used first-order transport, and no matched all-order production-cache sample
was evaluated here. The result is conditional on zero aerosol, a black surface,
the retained native15 source/optical basis, scalar scattering and no refraction;
it is not a measurement of San Jose's real atmosphere or a production
composition recommendation. The full-cache paper-RMSE gate remains unchanged.

## Qualification And Reproduction

The report authenticates actual solver case files, rather than relying only on
their descriptive metadata. Source spectrum/direction, observer, radius, surface,
layer heights, scattering fraction and total optical depth match the registered
controls. The largest total vertical optical-depth discrepancy is 1.70e−14
relative; the largest per-layer discrepancy is 1.28e−13. Raw solver units are
explicitly converted from mW to the parent's W convention.

The exact-mean first-order bracket is derived from nonnegative scattering
orders. Its maximum point-estimate spectral width is 0.456% relative to the
extrapolated N1 spectrum. This finite-epsilon quantity is reported separately
from the substantially larger sampling uncertainty; it is not a combined
confidence certificate. Eight distinct repeat seeds are retained, with paired
seeds reused across interventions and refinement. Color intervals summarize
these repeated projections; they do not validate atmospheric realism or
continuous spectral resolution.

[analysis.json](../../../../../tmp/experiments/sky-accuracy-dials/runs/00296-h42-report/analysis.json)
owns the derived metrics and spectra;
[compatibility.json](../../../../../tmp/experiments/sky-accuracy-dials/runs/00296-h42-report/compatibility.json)
retains actual-input checks and identities. The parent packages preserve every
case's raw spectrum, source manifests, solver diagnostics, parameters, identities
and progress. The shared tool preserves its complete original case bundles and
the executable/data identities. Earlier evidence was not modified.

00291 is the accepted three-band pilot. 00292 is preserved failed: low-count
rare-scattering noise produced a zero channel rejected by the initial ingress
assertion. Zero counts are now retained as valid stochastic observations;
scientific sampling adequacy is evaluated separately. 00293 is the accepted
high-count pilot. Complete command times were about 14.06 minutes for 00294
and 10.01 minutes for 00295, including verification. The final report is a new
derivative run; no transport was rerun to produce it. Scratch was cleaned after
each run, one external solver ran at a time, and no native build was performed.

The [shared validation tool](../../../../../scripts/libradtran/README.md) owns
the supported npm commands for independent solver execution. The retained case
bundles and manifests preserve the physical inputs, solver invocation and tool
identities needed to repeat an individual reference calculation through that
interface. The experiment runner is internal evidence-generation machinery;
its derived report authenticates immutable parents and creates a new run.
The experiment's local type check passes. The coherent source-review baseline, request and final
native validation under `.codex-tmp/review-standards/session-ogp1vu/` own the
separate implementation-completion gate. Scientific qualification is complete;
no further numerical run or production change is selected by H42.
