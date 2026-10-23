# High-Altitude Cache Resolution Results

State: numerical comparison complete on 2026-10-23. Production is unchanged.
This owner-authorized follow-on tests whether existing cache resolution is usable
for a future higher-altitude flat/globe comparison. It does not activate those
altitudes or certify all source directions and times.

**No resolution breakdown was found at 30 or 40 km in the tested noon horizon
rays.** Current altitude/outgoing sampling is a reasonable starting point for
extending coverage. Final-view integration needs more care: 30 intervals can
suppress or slightly invert the very narrow limb contrast. Using 120 intervals
largely resolves that sensitivity. Both the production-derived calculation and
libRadtran still predict a pale, weak horizon under this Bruneton atmosphere.
Higher altitude alone therefore does not deliver the desired crisp appearance.

[Color comparison](../../../../../tmp/experiments/elevated-horizon-validation/runs/00058-high-report/comparison.html)
contains sparse strips at 30 and 40 km: current grid/Q30, current grid/Q120,
refined altitude/Q120 and libRadtran. These are registered radiance samples with
shared production p2 exposure, not full scenes. Bands come from nearest sampled
rays; no smooth transition was fabricated. The geometric limb is at image center.
[Native spectra and analysis](../../../../../tmp/experiments/elevated-horizon-validation/runs/00058-high-report/analysis.json)
and [brightness CSV](../../../../../tmp/experiments/elevated-horizon-validation/runs/00058-high-report/brightness.csv)
retain quantitative results.

## Registered comparison

The medium, solar spectrum, noon source and black boundary match the completed
Bruneton baseline. Radius is 6,360 km, atmosphere top 60 km, no ozone/refraction.
Native15 bin-average optical/source values are held constant within each bin;
these are not center samples masquerading as a continuously varying spectrum.

At each height, anti-solar rays straddle the actual geometric limb at offsets
-1, -.1, -.02, +.02, +.1 and +1 degrees. Limb elevation is -5.554154 degrees at
30 km and -6.409204 degrees at 40 km. A 10 km control uses the previously captured
actual production GPU readout. The new binary64 final-view reconstruction of
fresh Float32 GPU fields matches that installed readout over all 15 bands and
Q30/Q120 within **0.0003671%**. This qualifies the diagnostic equations; it is
not a rendered 30/40 km app-state check.

Every GPU build constructs complete J1/L1/J2/L2/J3/L3/J4 fields, retaining only
sparse query values. Cumulative fields use the production left-fold Float32 sum,
row-dependent Sun035 coordinates, bilinear outgoing/linear altitude sampling,
monotone-cubic solar interpolation and quadratic midpoint final-view integration.
There is no N1 replacement or change to optical properties.

## Resolution sensitivities

The Native48 grid has 1.25 km spacing around 10, 30 and 40 km. Refinement inserts
midpoints below 45 km, preserving all original nodes and upper-atmosphere spacing:
83 altitude nodes versus 48. The separate angular refinement uses W39 instead
of W27, with the same Sun035 map and F68 incoming integration. Source attenuation
uses 80 rather than 20 intervals in its own branch; recurrence transport uses 120
rather than 60 in another. Only the contained bundle admits the latter diagnostic
value; shared production source and its selected policy remain unchanged.

The altitude check and baseline cover all 15 bands. Angular/source/recurrence
screens cover channels 2, 6, 9, approximately438,564 and658 nm. They establish
sensitivity only at those sampled wavelengths. All comparisons below use Q120
final-view integration and list the largest absolute change across six rays:

| Refinement | 10 km control | 30 km | 40 km |
| --- | ---: | ---: | ---: |
| Finer altitude, photometric Y | 0.929% | 0.679% | 0.672% |
| Finer altitude, any native band | 3.691% | 2.807% | 2.789% |
| W27 to W39, three-band radiance | 0.065% | 0.064% | 0.074% |
| Recurrence 60 to 120, three-band radiance | 0.105% | 0.081% | 0.081% |
| Source 20 to 80, three-band radiance | 0.519% | 0.410% | 0.411% |
| View Q30 to Q120, photometric Y | 0.893% | 1.402% | 1.891% |
| View Q120 to Q480, photometric Y | 0.053% | 0.101% | 0.107% |

Finer altitude has no growing instability with height. Small photometric changes
must not hide band-specific changes approaching3%. Two arbitrary grids do not
prove asymptotic convergence, and unchanged incoming/solar resolution is not
individually qualified for every condition by this test.

Contrast is C=(Y_above-Y_below)/(Y_above+Y_below). At the narrow +/-0.02 degree pair:

| Height | Current Q30 | Current Q120 | Current Q480 | libRadtran, empirical 95% half-width |
| --- | ---: | ---: | ---: | ---: |
| 30 km | 0.000324 | 0.003623 | 0.003907 | 0.003295 +/-0.002169 |
| 40 km | -0.000090 | 0.004223 | 0.004461 | 0.003619 +/-0.001413 |

Thus a radiance change below 2% can materially affect a weak boundary. The tiny
negativeQ30 contrast at 40 km is a numerical sign inversion, not evidence of a
physical reversed edge. At+/-0.1 degree, Q120 contrast is 0.01962 at 30 km and 0.02262
at 40 km; finer altitude changes these to 0.02012 and 0.02321. Neither is a strongly
contrasting ground-sky boundary.

## Independent reference

Fully spherical MYSTIC uses explicit sensor heights 30/40 km, matching view/Sun
conventions, direct Cornette-Shanks phase tables, black ground and native optical
columns. There are 36 initial cases and 12 layer/precision cases, with three
replicate vectors per direction. Fine cases double layer resolution from 256 to 512
and photons from100,000 to200,000 at the +/-0.1 degree pair.

Maximum absoluteQ120-versus-reference luminance residual is **0.358% at 30 km**
and **0.480% at 40 km** over the six rays. Individual-band residuals across the
initial scan are approximately-4.6% to+2.4%; photometric agreement does not imply
perfect spectral agreement. The reference is all orders while the GPU isN4;
remaining order-tail, quadrature and sampling contributions are not isolated.

Layer/precision changes in mean Y are below 0.101% at the selected pairs, but their
three-replicate95% intervals range about 0.47-1.33%. They are consistent with the
reported agreement, not proof of sub-percent systematic reference accuracy.
Three-seed empirical intervals omit model/systematic error and rare-history
coverage. No actual measured atmosphere or San Jose weather has been validated.

An independent 32768-step direct optical-depth integral gives transmission in
the native band containing550 nm of only 0.00728 at 30 km and 0.00850 at 40 km for
rays 0.1 degree below the limb. Less than 1% of ground radiance survives that path;
path light remains prominent. This helps explain why the stronger geometric dip
does not by itself create a crisp visible boundary.

## Practical disposition

- Extending observer coverage through 40 km is numerically plausible with the
  current cache grid for this case. It requires a newly generated, appropriately
  covered package; the installed 10 km package was not activated above its support.
- Use Q120 as the initial high-altitude scene-check setting. Increasing altitude
  or angular cache density is not presently supported as the primary fix for
  the fuzzy appearance. This recommendation is scoped to these rays and medium.
- Future app checks must still verify higher-altitude coordinate coverage,
  runtime allocation, scene-ground extent, actual pixel rays/depth, both modes
  and Sun-facing/other-time cases. These probes do not establish those behaviors.
- The intended flat/globe visual demonstration still needs a suitable atmosphere
  and viewing condition. Do not promise it from these 30/40 km noon results.

## Verification and cost

Accepted report 00058 authenticates 3,744 artifact records and 48 successful MYSTIC
cases, verifies physical input columns/options, and calibrates the readout against
the installed 10 km GPU. All 45 wavelength builds ran on RTX 2060/D3D11 WebGL2.
Final proof 00059 replays every retained GPU-probe view result and checks source
syntax/types, released fields and actual texture-size limits. Its receipt
confirms acceptance. No dedicated standards reviewers/audits ran.

Full 15-band baseline and altitude-refined runs took 61.8 and 73.1 seconds wall time,
respectively, including launch, compilation, readback, CPU analysis and evidence.
Reported peak live recurrence fields were 155,865,600 bytes baseline,
269,517,600 bytes altitude-refined and 320,094,720 bytes angular-refined. These
exclude browser/driver overhead and are not deployed cache sizes. Reference tool
invocations total 410.35 seconds including launch/copy/hash overhead. Source and
transport refinements remained bounded screens; no full production package was
built, so package size/build/runtime-scene costs are unmeasured.

All earlier evidence is immutable. Failed report 00057 exposed JSON negative-zero
normalization in request comparison; 00058 compares the actual JSON-serialized
browser contract and succeeds. No scientific calculation was rerun for that
analysis repair. [Execution log](execution-log.md) owns chronology and checkpoint
handoff; production and other experiment trees remain unchanged.
