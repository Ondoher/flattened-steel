# H64 Toronto dusk independent brightness

Status: registered comparison complete; sunset excess identified, late-twilight
reference precision remains limited. The [H65 follow-on](presunset-probe-results.md)
adds independent sunset probes and a matched pre-sunset comparison. No production
change. The [plan](twilight-reference-plan.md) owns the registration.

## Reviewable images

- [Matched production display contexts](../../../../../tmp/experiments/sky-accuracy-dials/runs/00432-h64-dusk-report/comparison.png)
- [Common sunset exposure](../../../../../tmp/experiments/sky-accuracy-dials/runs/00432-h64-dusk-report/comparison-common.png)
- [Spectra and empirical band intervals](../../../../../tmp/experiments/sky-accuracy-dials/runs/00432-h64-dusk-report/spectra.png)
- [Numeric table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00432-h64-dusk-report/summary.tsv)
- [Analysis, sampling/refinement checks and order budgets](../../../../../tmp/experiments/sky-accuracy-dials/runs/00432-h64-dusk-report/analysis.json)

SVG versions alongside each PNG remain zoomable. These are selected spectral
swatches, not new app screenshots. H63 remains the actual full-scene image owner.

## Findings

At sunset both corrected caches predict substantially more light than the
independent reference. Corrected60 is5.24x,3.20x and1.83x the reference at
0.05,3 and20degrees respectively. Focused60 gives5.24x,3.30x and1.83x.
Doubling external layers changes the lowest sunset ray by just-0.0675%;
Q30-to-Q120 changes the cache probes by less than0.84% across the entire matrix.
Neither control explains the sunset excess.

At+30minutes the3degree and20degree brightnesses match closely. The lowest ray
is dimmer than the external estimate. At+60minutes sampling and high-altitude
layer representation remain material uncertainties; do not read those swatches
as a qualified color target or the zero pilot as physical darkness.

| Time | Elevation deg | Corrected60 Y | Focused60 Y | libRadtran Y +/- empirical95% |
| --- | ---: | ---: | ---: | ---: |
| Sunset |0.05|4941.02|4944.50|943.49 +/-32.67|
| Sunset |3|9553.63|9850.68|2982.69 +/-38.08|
| Sunset |20|2121.13|2122.18|1160.73 +/-27.51|
| +30minutes |0.05|14.042|14.105|25.468 +/-4.166|
| +30minutes |3|108.398|108.938|108.605 +/-13.531|
| +30minutes |20|49.005|49.044|49.025 +/-2.576|
| +60minutes |0.05|0.3022|0.3048|0.5578 +/-0.2316|
| +60minutes |3|4.2775|4.3163|3.8210 +/-0.3143|
| +60minutes |20|0.5354|0.5370|0.1002 +/-0.1101|

Y is physical photopic luminance, cd/m2. External values above use the common
256-layer campaign. Horizon512-layer means are942.851,24.9868 and0.46987:
changes-0.0675%,-1.8879% and-15.7592%. Four seeds per configuration support
empirical Student intervals, not formal error bounds. Rare contributing paths
can make even those intervals optimistic. None of the final means has an
all-zero sampled band; individual late-twilight seeds do contain zeros.

All three sunset luminance estimates meet the registered5% half-width target.
The remaining six do not; +60minute20degree uncertainty is about110% of the
mean. Only sunset20degrees meets the10% significant-visible-band target.
Unmet precision and layer gates are retained openly; scientific comparison
completion does not claim that every external ray is converged.

## Where the sunset excess appears

The0.05degree Corrected60 pure-order readouts have Y values:

| Pure scattering order | Y cd/m2 |
| --- | ---: |
| N1 |320.914|
| N2 |1611.551|
| N3 |1594.261|
| N4 |1444.896|

Separately reconstructed N2-N4 sum to4650.708cd/m2, exceeding even the external
all-order upper empirical interval976.157 by3674.551cd/m2. In the matched
positive-scattering model, true N2+ cannot exceed true total light. This points
to excess later-order calculation/reconstruction in this sunset cache case;
it does not identify the responsible numerical operation. Focused60 shows the
same finding. Missing external/cache order matching cannot explain excess in a
four-order cache compared with an all-order reference.

Do not confuse the pure-order sum with C4-C1. The latter is4620.104cd/m2 here:
cumulative fields add in Float32 before nonlinear solar cubic reconstruction,
whereas pure-order probes reconstruct each field separately. Both representations
are retained; no first-order replacement or source edit was made to force a fit.
No external N1 measurement or exact-order external separation was performed.

The outgoing focus changes the total only0.07% at the lowest sunset ray and3.11%
at3degrees. That mapping alone does not resolve this dusk discrepancy. Incoming
angular integration, propagated representation errors and grazing transport
remain candidate mechanisms, not isolated causes. This result does not undo
H61's separate full-paper RMSE findings.

## Geometry and solver qualification

All methods share the H63 Native15 source, canonical molecular/aerosol amount,
exponential scale heights, black ground,5m observer and spherical Earth.
Toronto measured phase/SSA above440nm is retained exactly; default optics remain
below440nm. This is not a complete measured Toronto atmosphere. Solar zeniths
are89.9579152265,94.9954648168 and99.7452502666degrees.

At sunset the source center is0.042degrees above the horizon. A directly toward
Sun0.05degree ray would hit the solar disk. Every method instead uses the same
5degree relative azimuth, retaining near-Sun scattered light without the disk.

The installation isuvspec2.0.1-MYSTIC, executable SHA256
0065ec2c8711c3b65924492549714cf9497f8acc87cc468cd6b09092eec78881.
Its earlier warning concerned VROOM variance reduction not having been validated
in spherical geometry. H64 explicitly uses `mc_spherical 1D` and `mc_vroom off`.
The release's local geometry documentation explains that spherical mode already
enables backward tracing. Explicitly adding `mc_backward` reproduces the pilot;
it does not repair a forward/backward mismatch. No plane-parallel or
pseudo-spherical approximation is used. See the [official solver guide](https://www.libradtran.org/doku.php?id=basic_usage)
for the distinction between those geometries.

Accepted00427/00428 preserve both operational pilots. Their10000-photon+60minute
three-band result was zero. The full500000-photon runs resolve nonzero light;
the pilot was insufficient and is excluded as an accuracy reference.

## Display interpretation

The H63 recorded adapting-luminance proxies are487.1174438 at sunset,
13.45269874 at+30minutes and0.1681045405 at+60minutes, in cd/m2. The runtime
calculator defines these as horizontal photopic illuminance divided by pi,
with default floor0. H64 uses pi times each proxy as the retained production P2
context for every solver within that scene. Approximate display gains are2.018,
25.167 and747.39. The separate common-exposure sheet holds the sunset context
for every time. Neither mapping is fitted to libRadtran.

Swatches use published CIE data sampled at Native15 centers, bin widths, the
production rounded XYZ-to-linear-sRGB convention, then unchanged production P2
encoding. Physical Y uses independently bin-integrated CIE functions. Exposure,
saturation and spectral shape are therefore separated from physical brightness;
these swatches do not assert exact pixel equivalence with the H63 screenshots.

## Evidence, verification and resources

Accepted00429 owns30 GPU wavelength builds across both cache algorithms,
18 Q30/Q120 witnesses per algorithm, pure and Float32 cumulative N1-N4.
It observes actual compiler `sampleJDirection` lookups with the same builder-owned
outgoing map, followed by numerical final-view integration. The compiler request
is the retained H63 request; only the numerical view adapter fills explicit
canonical coefficient defaults, checked against the independent physical input.
Toronto per-wavelength SSA and phase match across methods.

Accepted00430 owns36 main external executions;00431 owns12 independent
layer-refinement executions. Four seeds each use50000 photons per band, increased
to500000 at+60minutes after the pilot.256/512 molecular equal-column layers
include additional aerosol-profile levels and the5m boundary. Direct angular
NetCDF optical tables preserve measured phase/SSA, with independent binary
normalization and exact exponential-column proofs. Native radiance mW units are
divided by1000 to obtain W m^-2 sr^-1 nm^-1.

Accepted00432 owns the images and analyses. Accepted00433 independently checks
all48 full-reference tool manifests, staged/executed decks and optical bytes,
720 raw spectral values, seed summaries,30 GPU channel outputs,36 witnesses,
report spectra, immutable inventories, strict progress and scratch cleanup.
Executable and installed-data identities agree throughout. Types and self-review
pass; final images were inspected. No dedicated reviewer/audit was run.
Checkpoint advice remains separate from scientific qualification.

Final retained experiment evidence is751765295bytes (716.939MiB), within the
existing720MiB allowance; scratch is0. The48 full-reference shared-tool executions
separately retain96313415bytes of case/output copies, plus the pilots' separately
owned tool records. No prior evidence was removed or changed. Browsers and owned
solver processes have finished; no production cache or source was changed.

## Reproduction

Every execution creates a new immutable run. Use the existing Node runtime:

```text
node experiments/sky-accuracy-dials/twilight-reference/run.mjs pilot
node experiments/sky-accuracy-dials/twilight-reference/run.mjs gpu
node experiments/sky-accuracy-dials/twilight-reference/run.mjs main
node experiments/sky-accuracy-dials/twilight-reference/run.mjs fine
node experiments/sky-accuracy-dials/twilight-reference/run.mjs report <gpu> <main> <fine>
node experiments/sky-accuracy-dials/twilight-reference/verify.mjs <gpu> <main> <fine> <report>
node node_modules/typescript/bin/tsc -p experiments/sky-accuracy-dials/jsconfig.json
```

The first pilot's implicit-backward deck is historical00427; the current explicit
backward command reproduces00428's scientific configuration. Source identities
and bundled GPU equations remain in each immutable run. Final LF-only source
formatting does not alter equations or numerical evidence.
