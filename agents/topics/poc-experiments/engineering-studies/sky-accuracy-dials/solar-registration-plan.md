# Solar Registration: Retained-Data Isolation

## Authority And Scope

The owner selected registration as the next focus with "okay, let's focus on
that next". Preserve the numerical-accuracy conclusions and defer adoption
under the existing hold. Execute one bounded analysis in the existing
sky-accuracy-dials experiment; no atmospheric radiance integration, GPU attempt,
physical-coefficient fitting or production change is included.

Source: experiments/sky-accuracy-dials/continuation/solar-registration/.
Output: a new immutable run under tmp/experiments/sky-accuracy-dials/runs/.
Use at most **1 MiB** of the remaining C5 allocation and **15 minutes** of
CPU-job elapsed time. Finish by 19:39 UTC on 2026-09-15, retaining the original
session's three-hour ceiling. No automatic retry or added matrix follows.
CPU interpolation and small geometric fits reuse existing data; no GPU
radiance solve is being replaced by a CPU atmospheric integration.

Formal reviewers remain suspended. Adviser refresh is blocked by stale
calibration; do not restart reviewers or repair global calibration. Initial
HEAD is c7803b241f0f8f409226354dc4fb72484f25a5ec. Preserve all pre-existing dirty
work. Capture its experiment-source inventory identity before implementation
and include it with the new source identities in the run definition.

## Fixed Matrix

Read the exact 17-time, 81-direction, 40-channel measurement boundary and scene
controls from accepted 00000-inputs. Replay the original integrated-40-channel
solar-azimuth fit for all 17 times before interpreting changes. Its original
objective uses 16 uniform-cosine elevation samples, 64 azimuths, absolute
reflection differences and the original floating-point 0.2-degree search over
the theoretical azimuth's plus/minus-20-degree window. Require replay agreement
within 1e-9 degrees. Preserve original measurement and scene values.

Evaluate five spectral grids: the original integrated 40 channels, and channels
0, 8, 24 and 30. For each time and grid retain independent fits over:

1. The original complete quadrature.
2. Its lower-elevation half (cosine of zenith below 0.5).
3. Its higher-elevation half (cosine of zenith at least 0.5).
4. Native rings one and two, using only within-ring periodic interpolation.
5. Native rings three and four, using only within-ring periodic interpolation.

Evaluate every fitted axis on all five subsets of that same spectral grid.
Transfer channel-0 and channel-8 full-sky axes to the other tested wavelengths.
The native inner/outer ring sets are disjoint raw spatial inputs. The two
halves of the full bicubic quadrature share interpolation inputs and are
regional sensitivity checks, not independent raw-data validation.

Repeat only the integrated full-sky objective at 32 by 128 quadrature samples
for all 17 times. This distinguishes objective quadrature sensitivity from
the fixed 9-by-9 measurement representation. It does not refine the data.

## Known-Direction Controls

For every original theoretical solar vector, sample two positive analytic
skies on the exact 81 native directions. Use
I(v)=1+2*(1-v_z)+(1-g*g)/(1+g*g-2*g*dot(v,s))^(3/2), with g=0.6 and 0.9.
These are manufactured angular fields with known reflection axes, not
atmospheric solutions or calibrated aerosol models. Run the same five-subset
fit on each to measure bias introduced by sparse sampling and reconstruction.
Do not assume the manufactured fit returns the known axis exactly.

Focused proofs check exact native-node interpolation, periodicity, positive
scale invariance, and the ambiguity of a constant sky. A broad minimum or a
minimum at the search edge must be reported. Define a descriptive near-minimum
width by absolute-reflection loss within one percent of mean absolute paired
intensity above the minimum; this is not a statistical confidence interval.

## Geometric Hypotheses

Use even-indexed captures for fitting, odd-indexed captures for checking three
descriptive hypotheses against the original full-sky fitted azimuths:
constant azimuth zero offset; a clock offset from -60 to +60 minutes in
one-minute steps; and their combination. Fit squared wrapped-angle error,
report held-time RMS, and retain the associated solar-zenith changes for clock
hypotheses. A constant azimuth offset does not cover arbitrary instrument tilt.

These are hypotheses about a measured-sky-derived axis, not independent solar
observations. A successful time split cannot eliminate a shared fitting bias.
Do not apply any fitted offset or call it a physical timing/alignment correction.
Independent orientation, image or acquisition evidence is required for that.

## Evidence And Stop

Retain fit minima, losses evaluated at transferred axes, near-minimum widths,
edge flags, synthetic truth errors, quadrature comparisons and geometric
train/check results. Full loss curves need not be retained when their exact
inputs and calculation are reproducible. Record complete derivation identities.
Reuse immutable 00226 source bytes as a base snapshot and retain exact changed
source bytes plus the complete current inventory; failed atmospheric execution
does not invalidate authenticated source bytes as a storage input.

No Kider RMSE improvement is claimed from fitting a symmetry axis. End with
what the data identify, what remains confounded, and the smallest independent
evidence that could distinguish the surviving hypotheses.
