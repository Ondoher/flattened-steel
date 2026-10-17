# H57: Selected Paper Rays Through Scattering Orders

Completed the [selected-ray comparison](paper-ray-orders-plan.md). Three B1
witnesses now have matched 40-wavelength baseline, corrected-cache, independent
GPU and libRadtran spectra through orders 1-4, plus separate all-order references.
The comparison demonstrates both directional cancellation and cancellation
between scattering orders. Production remains unchanged.

## Images And Data

- [Cumulative-order swatches](../../../../../tmp/experiments/sky-accuracy-dials/runs/00363-h57-order-report/swatches.png) ([SVG](../../../../../tmp/experiments/sky-accuracy-dials/runs/00363-h57-order-report/swatches.svg))
- [Spectra with sampling intervals](../../../../../tmp/experiments/sky-accuracy-dials/runs/00363-h57-order-report/spectra.png)
- [Signed pure-order errors and cancellation](../../../../../tmp/experiments/sky-accuracy-dials/runs/00363-h57-order-report/order-errors.png)
- [Cache/reference spectral and brightness comparisons](../../../../../tmp/experiments/sky-accuracy-dials/runs/00363-h57-order-report/cache-to-reference.tsv)
- [Pure orders, including transport-only and normalization-only controls](../../../../../tmp/experiments/sky-accuracy-dials/runs/00363-h57-order-report/pure-orders.tsv)

All images use solved spectra. The same CIE1931 midpoint integration and
production p2 display mapping apply to every method, with one common source
illumination and no per-swatch exposure fitting or white balance. R/B labels
refer to linear sRGB before display mapping. These are scientific swatches,
not screenshots of a production scene. **T40/T60 denote cache transport
intervals; both caches here use the same paper 40-wavelength setup.**

## Locked Witnesses

| Witness | Paper time | Grid x,y | Elevation | Sun separation | Selection |
| --- | --- | --- | ---: | ---: | --- |
| Low regression |13:30|0,4|12.1151deg|56.1047deg| Largest joint SSE increase in the lowest scored B1 ring |
| Low improvement |13:30|8,4|12.1151deg|99.6651deg| Largest opposing gain at the same time and elevation |
| Near-Sun deficit |11:00|3,6|53.3665deg|4.1932deg| Largest individual joint SSE increase |

Selection used the accepted H56 ledger before these reference calculations.
These are diagnostic witnesses, not a representative or held-out sky sample.
The lowest B1 scored ring is 12.1degrees; these are not the 0.05-degree Toronto
horizon rays. The [H55 full paper score](paper-b1-results.md) remains unchanged.

## What The Orders Reveal

| Through N4, compared with independent through N4 | Baseline Y error | Corrected Y error | Baseline spectral RMSE | Corrected spectral RMSE |
| --- | ---: | ---: | ---: | ---: |
| Low regression |+7.077%|+4.556%|5.0327|2.9121|
| Low improvement |-0.951%|-2.370%|0.7848|0.9206|
| Near-Sun deficit |-0.467%|-0.847%|0.9247|1.8032|

Spectral RMSE is mW m^-2 sr^-1 nm^-1 over the 31 scored channels 360-712.5nm,
against the independently solved same-order target. It is distinct from RMSE
against the measured paper data. Colors retain all 40 channels 360-818.25nm.

**The low-regression ray becomes closer to both matched reference solutions
while its measured paper score worsens.** The independent through-N4 brightness
is 5406.4+/-20.8cd/m2; libRadtran gives 5448.0+/-71.0. The cache changes from
5789.0 to 5652.7. The correction removes some excess light, although substantial
excess remains. Against the independent physical increments, baseline N2/N3/N4
are high by about 8.16%/57.30%/147.72%; corrected values remain high by
5.96%/37.72%/85.99%. A large percentage of a small fourth-order contribution is
distinct from the 4.56% error in total brightness.

**The opposite low ray exposes a real deficit.** Independent N4 brightness is
3684.7+/-12.7; libRadtran gives 3707.8+/-50.0. The cache changes from 3649.7 to
3597.4, moving farther below both means while its measured paper score improves.
Its N2 contribution was already low; normalization and transport changes reduce
it further. The same-time, same-elevation pair demonstrates angular variation
in the error's sign, not a single common exposure error.

**Near the Sun, later-order excess partly hides a first-order deficit.** The
independent GPU N1 estimate is 13323.1+/-66.2, while saved cache N1 is 13148.1 and
is unchanged by either correction. The denser binary64 N1 integral gives
13328.6, confirming a 1.35% cache deficit under these physical inputs.

| Near-Sun physical increment, Y in cd/m2 | Independent mean +/-95% | Baseline cache | Corrected cache |
| --- | ---: | ---: | ---: |
| N1 |13323.1+/-66.2|13148.1|13148.1|
| N2 |450.93+/-7.31|542.77|502.18|
| N3 |76.01+/-1.63|88.61|80.26|
| N4 |18.24+/-0.52|24.06|20.37|

Every later-order excess in this table decreases with the corrections. That
also removes compensation for the unchanged N1 deficit, so the cumulative result
moves slightly farther below the independent total. This identifies the balance
between calculations. It does not yet uniquely identify the calculation causing
N1's deficit or separate all inherited incoming-field errors from newly added
recurrence errors. A later-order bias need not originate in that order alone.

The final pure-order ledger uses saved separately reconstructed physical-order
fields. The cumulative-reconstruction remainder is recorded separately; its
maximum magnitude at these witnesses is only 0.00747cd/m2. The corrected
cumulative-increment ledger passes a telescoping identity with maximum residual
5.46e-12cd/m2. These reconstruction differences do not explain the large biases.

## Matched Physical Problem And References

All methods use the paper's 6360 km sphere,60 km atmosphere,8 km molecular and
1.2 km aerosol scale heights, scalar Rayleigh and Cornette-Shanks aerosol phase
with parameter g 0.7, aerosol SSA 0.8, identical source/extinction channels and
spectral Lambertian grass. There is no ozone, refraction or polarization.
The references receive physical inputs rather than a production cache evaluator.
Ray rotation preserves elevation and Sun separation to 2e-12.

The independent solver uses analytic density/phase sampling and backward Monte
Carlo on RTX2060 WebGL2, with 24 batches of 8192 histories per band/ray and eight
paired 64/128 source/view quadrature batches. Ground reflection uses cosine
sampling and counts as an interaction, matching the recurrence and the pinned
MYSTIC source. Numerical N1 is also checked with an independent binary64 integral.

The external tool uses fully spherical libRadtran 2.0.1/MYSTIC, explicit molecular
and aerosol optical properties, 96 Cornette-Shanks moments, the same source,
grass and view angles, and four 20,000-photon seeds at each of40 wavelengths for
every prefix/ray. `mc_maxscatters` prefixes were validated against direct N1.
The128/256-layer pilot differs by at most 0.169% on its tested three bands at the
low-regression ray through N4. The admitted full package uses 128 layers.

Surface reflection is one interaction. All orders is a separate compensated
Monte Carlo target; it is not a synonym for through N4. The independent extra
brightness beyond N4 is:

| Witness | Beyond-N4 Y +/-95%, cd/m2 | Fraction of through-N4 Y |
| --- | ---: | ---: |
| Low regression |26.50+/-0.99|0.490%|
| Low improvement |27.16+/-1.07|0.737%|
| Near-Sun deficit |6.39+/-0.34|0.0461%|

This small omitted tail does not explain the through-N4 comparison errors,
which compare the same truncation in both methods. Missing cache all-order
cells remain explicitly blank in the images.

## Precision And Scientific Limits

The independent solver passes all 15 brightness and all 15 full-band sampling
targets: maximum95% brightness half-width0.505%, maximum per-band half-width
0.692%. Its largest N1 mean difference from the dense integral is0.0763%.
The paired 64/128 integration control changes Y by at most 0.00123cd/m2.

libRadtran passes13 of 15 brightness targets at 3%; near-Sun N1 and all orders
miss slightly, with maximum brightness half-width3.218%. **None of its 15 rows
meets the 10% worst-band target across all 40 wavelengths.** Worst-band intervals
range13.74%-42.52%. Spectral plots show these sampling bands. All15 independent
and external brightness intervals overlap, but this is not proof of pointwise
spectral convergence. The external data supports the broad comparison and
strong low-ray excess; the tighter independent references carry the small
near-Sun component diagnosis. No additional photon campaign was run merely to
turn these reported misses into passes.

The independent GPU uses Float32 geometry and a 1 m surface offset at reflection.
The quadrature controls do not certify those approximations. The external layer
pilot is limited to its registered ray/bands/order. All reported intervals are
empirical sampling intervals, excluding discretization/systematic error.
Three deliberately selected rays cannot establish a full-sky accuracy win or
meet the full-cache paper RMSE promotion gate.

## Immutable Evidence And Monitoring Repair

- Accepted GPU pilot00352, ordinary external pilot00354 and GPU full00355.
- Failed00353 preserves the installed build's unavailable spectral-importance
  command. Every admitted external measurement uses ordinary wavelengths.
- Rejected00356 preserves a noisy near-Sun N1 pilot. Two 100,000-photon seeds in
 00357 pass the original5% N1 gate in admission00359; inputs and gate were unchanged.
- Interim00358 preserves the initial images. Its cumulative spectra and
  cache/reference table are valid. Its N1 reference increment table incorrectly
  subtracts the order0 all-order row; final00363 repairs the reducer and checks
  the telescoping identity. The interim was not overwritten.
- Original full00360 contains all 60 successful external cases, unchanged source
  identities and complete cleanup. Its seal says accepted, but the ordinary
  verifier correctly rejects one 39.154-second progress interval during final
  synchronous cleanup after calculation completed. **00360 is not represented
  as verifier-passing.**
- Admission00361 authenticates all 304 original artifacts, exact inventory,
  source/cleanup state, all 60 tool successes and raw identities. It copies the
  readings unchanged into a new verified run and explicitly discloses the sole
  post-compute monitoring defect. The generic verifier and old evidence are unchanged.
- Proof00362 restages an actual authenticated200-file bundle and exercises the
  repaired completed-case cleanup. It removes only checked, owned staging in
 0.847 seconds; no transport is executed. Future runs release each completed
  staging bundle after copied-input authentication, avoiding the large final backlog.
- Final00363 verifies and retains all images, cumulative and pure-order ledgers,
  factorial controls, reconstruction/tail records, precision and identities.

All numerical results remain preserved; no cache or solver calculation was
rerun for the monitoring repair. All owned browsers/solver clients exited,
cleanup passed and live experiment scratch is absent.

## Execution Decisions, Timing And Verification

The [execution record](paper-ray-orders-execution.md) owns the question/decision
list and verification disposition. This package reused the existing B1 baseline,
corrected capture and both H56 factorial captures; no new cache build occurred.
The independent reference took 346.88 seconds overall, including 236.53 seconds in
browser phases encompassing shader compilation, execution and readback.
The two-case-concurrent external batch took 3906.52 seconds (65.11minutes),
including staging, tool invocations, recording and cleanup. Positive progress
continued past the owner's60-minute guidance. Data admission took 7.92 seconds,
cleanup proof 5.11 seconds, and final report 23.14 seconds. These are observed phase
wall times, not estimates of model reasoning or isolated GPU/solver CPU time.

Local type checking, image inspection, source/input authentication, numerical
identities and final run verification pass. Dedicated experiment reviewers and
audits remain disabled by owner policy; no standards-compliance claim is made.
Checkpoint advice accepts the completed unit as coherent and supplies the
preauthorized local commit message. No push, production promotion or further numerical
campaign is selected.

## Reproduction

Commands allocate new immutable runs. Substitute their exact returned paths:

```text
node experiments/sky-accuracy-dials/paper-rays/independent.mjs pilot
node experiments/sky-accuracy-dials/paper-rays/external.mjs pilot
node experiments/sky-accuracy-dials/paper-rays/external.mjs nearcheck
node experiments/sky-accuracy-dials/paper-rays/report.mjs qualify <gpu-pilot> <external-pilot> <near-control>
node experiments/sky-accuracy-dials/paper-rays/independent.mjs full
node experiments/sky-accuracy-dials/paper-rays/external.mjs full
node experiments/sky-accuracy-dials/paper-rays/report.mjs report <gpu-full> <external-full>
node node_modules/typescript/bin/tsc -p experiments/sky-accuracy-dials/jsconfig.json
```

The recovery command is narrowly bound to original00360 and its exact monitoring
defect; it is not a general verifier override. The final report used verified
admission00361 as its external parent. Previously sealed runs remain immutable.
