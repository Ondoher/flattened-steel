# Lower-Band Light Source Trace

The owner requested a focused explanation of the warm lower sky, without changing
the renderer. The measured Flat0 trace supports a physical attenuation explanation
within the declared flat/local model. Warmth is present in first-scattering
radiance before display encoding; higher orders soften it. This is evidence about
the current model and discrete operator, not empirical validation or an error bound.

## Inputs And Derivation

The scene is the same sky-only Union Glacier setup as the
[first-image delivery](p3-first-image.md): latitude -79.768036, longitude
-83.261666, observer altitude 5 m, 720 by 414 pixels, 70-degree vertical FOV.
Flat0 is `2024-12-14T17:27:41.487Z`; Flat180 is twelve hours later. These are
the existing December 14 cadence fixtures. The [film plan](plan.md#p6--reproduce-the-local-sun-full-orbit-film)
separately owns the selected December 14, 2024 observatory replay and film clock.
Physical ground is black, ozone is disabled, and the unchanged p2 color model
receives the same adaptation used by the capture. No color or numerical policy
was tuned from these results.

The fresh candidate uses the pinned [P3 contract](p3-contract.md): Native15,
J1-J4, 1,049 admitted positional nodes, source-centered Euclidean shells,
column48-tail64 construction, column15 runtime and unchanged spectral projection.
Source height is 4,828,032 m and atmosphere top is 100,000 m. The original
Flat0/Flat180 images and every parent run remain immutable.

New measured [Flat0 trace](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00486-p3-shell-v3a/band-trace.json)
retains exact camera rays, pure-order endpoint densities, continuous primary
density, optical columns, interval contributions, CPU/GPU spectra and actual
framebuffer RGB bytes. Its [candidate image](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00486-p3-shell-v3a/candidate.png)
is a normal fresh capture. The
[derived summary](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00490-band-summary/result.json)
and [derivation identities](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00490-band-summary/inputs.json)
authenticate that trace and the accepted original state recipes.

For each pure order, the trace applies the renderer's existing positive
attenuation weights to S=J/beta_ext between its actual runtime endpoints.
Contributions are linear in each order and sum to the cumulative spectrum.
Visible-energy fractions integrate Native15 bins over 400-700 nm, including
partial endpoint bins; they are not photopic luminance percentages. Distance
quantiles integrate partial intervals of the same source function, linear in
optical depth, using analytic Rayleigh/Mie columns. Thus they describe the current
discrete operator's last-scattering distribution, not a new integration policy
or unique upstream photon histories.

## Measured Flat0 Contributions

Coordinates are PNG pixels counted from the top left. Elevation is above the
physical horizon; the black lower half is not part of these sky samples.

| Pixel                          |      Elevation | First-scattering share | Median last-scattering distance | 90% within | Display RGB bytes |
| ------------------------------ | -------------: | ---------------------: | ------------------------------: | ---------: | ----------------- |
| (360, 205), nearest horizon    |  0.291 degrees |                 74.10% |                        10.20 km |   37.03 km | 227, 214, 200     |
| (360, 195), warm band          |  2.228 degrees |                 76.33% |                        10.68 km |   53.66 km | 229, 220, 209     |
| (360, 175), higher band edge   |  6.082 degrees |                 79.17% |                         8.50 km |   58.07 km | 214, 214, 216     |
| (180, 195), side of band       |  1.904 degrees |                 69.63% |                        11.30 km |   58.25 km | 194, 184, 177     |
| (360, 100), higher sky control | 19.812 degrees |                 87.96% |                         3.33 km |   21.97 km | 204, 206, 218     |

At the nearest-horizon sample, J1/J2/J3/J4 supply respectively
74.10/20.76/4.13/1.01 percent of visible radiance. Only 0.52 percent has its
last scattering beyond 100 km. The band does not require most final scattering
to occur at a remote edge of the cache. This does not exclude long earlier paths
inside J2-J4, which these integrated fields cannot recover individually.

## Why The Spectrum Is Warm

There are two attenuation legs even for first scattering:

1. Sun to the scattering point: the local Sun is above the atmosphere, and its
   oblique ray passes through the slab before arriving at low-altitude air.
2. Scattering point to the camera: low-elevation rays remain in dense air for
   much longer than steep sky rays. Blue extinction is stronger than red.

At the Flat0 observer the Sun is 7,924 km away and 37.54 degrees above the
horizon. Its path inside the atmosphere is 164.12 km. Analytic transmission is
0.567 at 438 nm and 0.818 at 626 nm. Physical path length alone is not optical
depth: much of this path crosses thin upper air; the transmissions account for
the density profile.

On the nearest-horizon view ray, transmission from its median last-scattering
distance to the camera is 0.374 at 438 nm and 0.569 at 626 nm. The source-leg
numbers above are at the observer, not the median scattering point, so they
must not be multiplied as an exact complete-path result. Every actual endpoint's
two optical depths are retained in the trace.

The unchanged spectral projection yields nearest-horizon linear RGB
`[7560.62, 6235.21, 5203.87]` before adaptation/display encoding: red is already
stronger than blue. Its first-scattering component is
`[5961.14, 4659.81, 3487.04]`; the higher-order remainder is approximately
`[1599.47, 1575.40, 1716.83]`. Multiple scattering adds relatively more blue,
softening the warm first-order color rather than creating it. The display gain
is achromatic; it does not inject a brown spectrum.

Replacing cached J1 endpoint values with direct continuous-primary evaluations,
while keeping exactly the same view schedule/weights, gives
`[5939.88, 4645.77, 3480.18]`. That spectrum is also warm. Its integrated visible
energy is 99.70 percent of cached J1 here, and 99.04-99.79 percent across all five
samples. This is a useful cache-independent first-order cross-check; shared
source/medium equations and the same runtime schedule prevent treating it as
an independent total-accuracy bound.

The trace also retains an unattenuated density-trapezoid diagnostic. It uses
different interval weighting from the actual optical-depth operator and is not
a rendered counterfactual or an exact causal decomposition of attenuation.
It is not used to claim a measured physical error or assign a percentage of
the warmth to either path leg.

## Flat180: Analytic Source Comparison Only

The accepted original Flat180 recipe gives a source distance of 31,782 km and
an elevation of 8.74 degrees. The observer-to-source atmospheric path is
658.24 km; transmission is 0.103 at 438 nm and 0.447 at 626 nm. This substantially
stronger filtering is consistent with its warmer low sky under the same model.
It does not establish Flat180 per-order or last-scattering fractions.

The dedicated Flat180 trace was stopped by the machine-free-memory safeguard:
[wrapper 00487](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00487-resource-bound/result.json)
records minimum free memory 7,995,813,888 bytes, below the required 8 GiB reserve.
Child 00488 is incomplete and supplies no accepted trace. No third heavy build
was attempted. The analytic comparison derives only from the accepted original
00484 recipe, not the incomplete run.

## Verification And Scope

All five measured Flat0 pixels are reproduced exactly: maximum RGB-byte
difference is zero. The attributed spectra close against CPU transport across
75 channels with zero failures; maximum absolute difference is
2.8731e-9. Comparison with GPU transport likewise has zero failures, using the
unchanged 1e-9 absolute plus 0.2-percent relative consistency allowance.
The derived visible-distance attribution also closes against total visible
radiance with a 1e-10 relative summation allowance. These are implementation
checks, not estimates of physical approximation error.

[Flat0 wrapper 00485](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00485-resource-bound/result.json)
completed within the resource contract: peak owned private bytes 6,535,282,688,
peak working sets 4,388,110,336 and minimum free bytes 9,003,364,352. One heavy
job ran at a time; both initial attempts are preserved. The summary is a small
JavaScript derivation and builds no cache. No native helper was compiled or run.

Reproduction allocates new runs and preserves every parent:

```text
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 -- run-shell-capture.js --current-contract --state=flat-0 --trace-band
node experiments/local-sun-cache-reuse/summarize-band-trace.js 00486-p3-shell-v3a
```

The source unit covers additive tracing, the explicit capture switch, named
ambient records, lightweight summary derivation and relevant unchanged
transport/run-boundary collaborators. Its
[baseline](../../../../../.codex-tmp/review-standards/session-t5k6mg/baseline.json)
predates edits. Completion requires local experiment type checking and a matching
exit-0 `CLEAN`
[validation receipt](../../../../../.codex-tmp/review-standards/session-t5k6mg/validation.json)
with primary and independent audit evidence. Until that receipt validates,
source completion remains open. This focused diagnostic does not complete P3-C,
select ozone or reflective ground, qualify a global reference, or select video.

The supported conclusion is that the lower-band warmth is consistent with the
declared scattering and attenuation model and is reproduced without cached J1
interpolation. Unresolved approximation error and omitted physical effects
remain governed by the [evidence policy](reference-method.md#current-evidence-policy).
