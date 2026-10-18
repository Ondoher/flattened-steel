# H65 Pre-sunset and independent-probe comparison

Status: complete through accepted00441 verification and00442 lower-exposure
image derivative. All selected numerical runs and images are finalized; no job
remains or further campaign is selected. The experiment stays open. Production
source/cache and earlier evidence remain unchanged. The [plan](presunset-probe-plan.md)
owns the frozen registration.

## Images and numeric evidence

- [Shared lower exposure: visible intensity differences](../../../../../tmp/experiments/sky-accuracy-dials/runs/00442-h65-exposure/comparison-low.png)
- [Original common sunset P2 exposure](../../../../../tmp/experiments/sky-accuracy-dials/runs/00440-h65-probe-report/comparison.png)
- [Six-ray spectra with sampling intervals](../../../../../tmp/experiments/sky-accuracy-dials/runs/00440-h65-probe-report/spectra.png)
- [Cumulative scattering-order table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00440-h65-probe-report/orders.png)
- [Complete numbers and uncertainty](../../../../../tmp/experiments/sky-accuracy-dials/runs/00440-h65-probe-report/analysis.json)
- [TSV summary](../../../../../tmp/experiments/sky-accuracy-dials/runs/00440-h65-probe-report/summary.tsv)

SVG versions accompany the PNGs. Both images use one common H64 sunset display
context for every method/time. Bright pre-sunset values clip in the first image;
the lower-exposure image multiplies projected linear RGB by1/8 for all30 swatches
before unchanged P2 encoding. Physical radiance, Y labels, uncertainty and all
relative method intensities are unchanged. This is a shared-3stop display
preview, never a per-method fit. These are ray swatches, not full-scene captures.

## Result

Our independently coded, cache-free GPU solver corroborates libRadtran at both
times and all three rays. Full luminance differs by-0.94% to+1.07%, within the
empirical sampling intervals. Both corrected caches remain too bright in total.
At0.05degrees the ordinary corrected cache is3.06times libRadtran ten minutes
before sunset and5.24times at sunset. Focusing the outgoing grid does not remove
this discrepancy.

| Time | Elevation deg | Corrected60 N1-4 | Focused60 N1-4 | Independent N1-4 | Independent all +/-95% | libRadtran all +/-95% |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
|-10minutes|0.05|26214.69|25963.18|8516.62|8538.61 +/-59.19|8568.85 +/-110.46|
|-10minutes|3|26697.62|27416.73|13623.31|13645.20 +/-71.81|13646.55 +/-110.50|
|-10minutes|20|4240.06|4230.12|2529.34|2536.31 +/-8.40|2522.00 +/-51.90|
|Sunset|0.05|4941.02|4944.50|923.36|934.64 +/-11.16|943.49 +/-32.67|
|Sunset|3|9553.63|9850.68|2966.71|2978.26 +/-20.55|2982.69 +/-38.08|
|Sunset|20|2121.13|2122.18|1169.12|1173.09 +/-6.60|1160.73 +/-27.51|

Y is cd/m2. Caches are cumulative N1-N4; the independent solver separately
measures that prefix and an all-order roulette estimate. libRadtran is all orders.
The measured N5+ tail is0.160-1.207% of full brightness, too small to explain the
cache excess. Common spectral/discretization assumptions remain qualifications;
this is not a measured Toronto-weather validation.

## Which orders diverge

At the lowest sunset ray, separately reconstructed physical-order estimates are:

| Pure order | Corrected60 Y | Focused60 Y | Independent Y |
| --- | ---: | ---: | ---: |
| N1 |320.91|317.60|272.01|
| N2 |1611.55|1612.70|469.00|
| N3 |1594.26|1597.47|145.05|
| N4 |1444.90|1446.99|37.30|

The ordinary cache is about18% high at N1,3.4times at N2,11times at N3 and39times
at N4. This directly corroborates the H64 higher-order excess and demonstrates
order-by-order error amplification in this scope. It does not isolate the
responsible construction, interpolation, angular integration or path operation.

At the same ray ten minutes earlier, ordinary-cache N1 is5389.31 versus the
independent6430.31, about16.2% low. Its later-order estimates are8823.55,6802.75
and5182.02 versus1690.78,325.71 and69.82. The N1 deficit offsets part of the much
larger later-order excess. At sunset the N1 error has changed sign. Thus total
brightness alone hides different component balances at these neighboring times.
The larger total relative error at sunset does not establish that each isolated
higher-order relative error grows monotonically as the Sun falls.

Cache pure-order sums and differences of reconstructed cumulative fields remain
separate representations: Float32 field addition occurs before nonlinear solar
cubic reconstruction. Independent isolated orders come from separately tallied
path contributions. No runtime exact-angle replacement or error-cancelling
postprocessing was applied.

## Matching and numerical qualification

The new instant is2024-06-21T03:16:03.503Z, solar zenith88.2237421377953degrees
(Sun elevation1.7762578622degrees). Sunset is03:26:03.503Z with the retained
89.9579152265degree zenith. The same production observation owner computes the
-10minute offset; no radiance or solar-angle interpolation generates this time.

All methods use San Jose, observer5m, spherical R6360km/top60km, black ground,
no refraction/ozone, scalar phase, Native15 source and extinction. Elevations are
0.05/3/20degrees,5degrees sideways from the Sun to avoid its direct disk. Toronto
measured phase/SSA above440nm is fixed; canonical aerosol amount/profile and
unsupported shorter wavelengths remain. This is not a complete measured Toronto
atmosphere. H64 sunset cache and external results are read-only parents.

The independent kernel uses continuous exponential density, null-collision
flights, analytic inversion of the normalized83-node linear-cosine aerosol
phase, separate pure orders and compensated roulette starting at order8.
It reads physical inputs and no production cache or radiance evaluator.
Accepted00436 has24 main batches and8 paired quadrature-control batches of8192
paths for each of15bands and6rays:2880 batch records and23592960 effective
histories in the final payload. Thirteen wavelength payloads are authenticated
reuse; channels13/14 were newly traced.

All independent cumulative/all-order targets pass. Maximum Y empirical95%
half-width is1.2152% versus3% target; maximum per-band half-width is5.8237%
versus10% target. Deterministic binary64 N1 and GPU Monte Carlo N1 agree within
0.454% in Y; the separately retained64/128 deterministic Gauss controls agree
near roundoff. The paired64/128 GPU optical controls change Y by at most
0.0123cd/m2, under0.00033% relative. These are sampling/convergence checks, not
formal bounds on every model or Float32 geometry error.

The new fully spherical MYSTIC reference uses the qualified direct angular
optical library, VROOM off, four seeds at50000photons/band. Doubling256 to512
layers changes the pre-sunset horizon Y by-0.01093%; the reused sunset control
changes by-0.06750%. Cache Q30-to-Q120 changes Y by at most0.649% in these six
rays. These controls do not account for the large later-order discrepancies.
Source, material, boundary and solver/data identities match across the retained
inputs. The older build's VROOM warning does not apply to these VROOM-off runs;
this check still does not qualify arbitrary spherical or twilight configurations.

## Preserved failure and resumption

Accepted00434 owns the three-band independent pilot. Full00435 preserved13
complete wavelengths before a bookkeeping assertion failed in channel13. The
assertion compared separately rounded Float32 total and order tallies with a
near-exact absolute1e-10 tolerance. The failed campaign remains immutable.

Accepted00436 reuses only complete authenticated payloads with identical
controls, streams, shader and executor. It retraces the last two wavelengths.
An explicit Float32 gamma16 accumulation/product bound now qualifies separately
stored totals without changing any values or sampling targets. Only two final
batch witnesses have total slightly below the separately rounded first-four
sum; the maximum relative difference is3.0962e-10 (0.000000030962%). These
rounding effects cannot explain any displayed radiance difference. The original
failed gate is not relabelled as passed, and no completed wavelength was altered.

## Final verification and resources

Accepted00437 owns both pre-sunset GPU cache builds.00438/00439 own12 standard
and4 layer-refined external executions.00440 owns the full comparison report;
00441 verifies all2880 independent batches,15 shader/material identities,
30 cache wavelengths,16 new external executions, six reported rows,13 exactly
reused wavelength payloads, source/control equality, executed optical/deck hashes,
unit conversion and image integrity. The original independent-run recipe names the
H64 parent-control hash `controlHash`; its new H65 control is separately
authenticated by the sealed `control.json` artifact and exact verifier equality.
Future authored commands now name both parent and new control hashes explicitly. Strict run progress, inventories and scratch
cleanup pass. Prior H64 verification remains the owner of reused external runs.

Accepted00442 is an image-only derivative with the explicit common1/8 display
scale. Its source and derived color identities are preserved; all three final
report images and the lower-exposure image were visually inspected. Local types,
self-review and whitespace checks pass. No dedicated reviewer/audit ran.
Checkpoint advice is separate from scientific verification.

Owner approved728MiB retained disk. Final retained evidence is759750313bytes
(724.554MiB), within that allowance; scratch is0. New shared-tool-owned external
runs separately retain32105668bytes of case/output copies. No old run was
reopened, overwritten or deleted. All owned browsers and solver jobs have ended.

## Reproduction

Use the existing Node runtime. Every command allocates new immutable output.
Run GPU work serially and preserve earlier runs:

```text
node experiments/sky-accuracy-dials/presunset-probe/run.mjs pilot
node experiments/sky-accuracy-dials/presunset-probe/run.mjs independent
node experiments/sky-accuracy-dials/presunset-probe/run.mjs gpu
node experiments/sky-accuracy-dials/presunset-probe/run.mjs reference
node experiments/sky-accuracy-dials/presunset-probe/run.mjs fine
node experiments/sky-accuracy-dials/presunset-probe/run.mjs report <independent> <pre-gpu> <pre-ref> <pre-fine>
node experiments/sky-accuracy-dials/presunset-probe/verify.mjs <independent> <pre-gpu> <pre-ref> <pre-fine> <report>
node experiments/sky-accuracy-dials/presunset-probe/exposure.mjs <report>
node node_modules/typescript/bin/tsc -p experiments/sky-accuracy-dials/jsconfig.json
```

For an explicitly audited partial campaign, `independent --reuse <source-run>`
requires matching controls, streams, scientific executor/source and shader bytes.
It copies complete authenticated wavelengths into a new run and retraces the
remainder, preserving the source campaign's real disposition.
