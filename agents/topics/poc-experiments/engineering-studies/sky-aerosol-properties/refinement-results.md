# Aerosol refinement results

Status: M1-M3 investigation complete; final analysis and immutable evidence proof
accepted. The experiment remains active for owner selection of any next work.
Production source, cache assets and selected atmosphere remain unchanged.

## Conclusion

**Spreading the same aerosol column higher is the strongest supported adjustment.**
Changing the scale height from 1200 to 2400 m brightens the ground-level away-Sun
horizon by 14.25% in the full N1-4 cache and 14.66% in the cache-free independent
solver, while near-Sun light falls only 0.95% and glow contrast falls 0.10%.
This preserves the glow that was lost when aerosol loading was reduced.

It is a tradeoff: the 500 m and lower-Sun horizons also brighten, but the 2 km noon
horizon is about 2-3% dimmer. H1800 gives a smaller ground-level gain but did not
meet its registered elevated-view compromise gate. Neither profile is selected
for production. These are model-controlled sensitivities, not measured sky truth.

The [plan](refinement-plan.md) owns the frozen parameters and gates. The
[first-campaign results](results.md) retain their original N1 scope.

## Evidence to inspect

- [Final matched field gallery](../../../../../tmp/experiments/sky-aerosol-properties/runs/00044-refine-analysis/comparison.html)
  covers all four conditions, horizon and Sun views, at primary and common 0.125 exposure.
- [Order-resolved H2400 fields](../../../../../tmp/experiments/sky-aerosol-properties/runs/00041-refine-colors/comparison.html)
  and [H1200 fields](../../../../../tmp/experiments/sky-aerosol-properties/runs/00024-refine-colors/comparison.html).
- [Eleven-profile N1 measurements](../../../../../tmp/experiments/sky-aerosol-properties/runs/00008-refine-screen/metrics.tsv).
- [Three-solver horizon spectra](../../../../../tmp/experiments/sky-aerosol-properties/runs/00044-refine-analysis/spectra.svg),
  [per-ray qualification](../../../../../tmp/experiments/sky-aerosol-properties/runs/00044-refine-analysis/metrics.tsv),
  [N1 screen gallery](../../../../../tmp/experiments/sky-aerosol-properties/runs/00044-refine-analysis/screen.html),
  and [immutable proof](../../../../../tmp/experiments/sky-aerosol-properties/runs/00046-refine-verify/verification.json).

These are actual diffuse angular sky fields, not full app scene captures. The
horizon covers away-Sun azimuth 150-210 degrees, elevation 0.05-20 degrees; the Sun view is an
undistorted rectilinear 24 x 16 degrees field. The direct disk and scene objects are absent.
Colors use the same bin-integrated CIE1931 -> linear sRGB -> production P2 mapping,
fixed parent display illuminance and shared exposures. No candidate-specific
white balance or exposure was fitted. Raw spectra/linear RGB remain available.
The fields are 120 x 80; the N1 screen fields are 240 x 160.

## M1 - Separate numerical accuracy from atmosphere changes

Completed: authenticated prior evidence, external operational/order pilots,
full global N1-4 cache observations, matched order fields, independent order
references, path/angular/view diagnostics and uncertainty accounting.

The unchanged combo025 medium has loading 25%, SSA 0.95, Cornette-Shanks g=0.85,
H1200 m and alpha=0.8. Both solvers use spherical R6360 km, a 60 km atmosphere,
black ground, no gas absorption, refraction or polarization. Native15 optics
are evaluated at the registered channel centers; the solar source uses its
registered bin means and color uses bin-integrated CIE weights. This is not a
new Bruneton B1 score or a measured atmospheric-profile fit.

With the original 68 incoming directions, cached N1 -> N1-4 raises noon horizon
luminance from 4192 to 5943 cd/m^2. The independent high-sample N1-4 reference is
6284 cd/m^2: the cache is about 5.4% low, so interpreting that difference as aerosol
physics would be misleading.

The plan's one path diagnostic and one angular diagnostic were used at fixed
medium. In a representative green channel:

| Numerical control | Horizon N1-4 radiance, W m^-2 sr^-1 nm^-1 | Finding |
| --- | ---: | --- |
|68 incoming /60 construction intervals|0.089128|Initial deficit|
|68 incoming /120 intervals|0.088990|-0.15%; does not explain deficit|
|272 incoming /60 intervals|0.093875|Close to independent pilot0.093935|

The 272-direction diagnostic was extended to all bands and protected conditions.
Every material comparison below uses the same 272/60 policy, focused outgoing
grid and solar interpolation. No production compiler was changed.

At noon/5 m the resulting H1200 cache versus independent N1-4 differences are
-0.11% at the 0.05 degrees away horizon, +0.33% at 3 degrees, +1.29% at solar offset 1 degrees and
+1.88% at offset 5 degrees. The qualified baseline N1 -> N1-4 horizon increase is now
4192 -> 6277 cd/m^2, about 49.7%; near-Sun mean light grows only 1.58% and contrast
changes about -1.14%. Multiple scattering fills the horizon much more strongly
than the solar halo in this setup.

Final-view 96 -> 192 interval changes are at most 0.048% in the initial cache and
0.029% for H2400. Paired independent 64/128 path-quadrature changes have maximum
absolute mean 0.000014% of N1-4 luminance across the selected rays. This is not
an absolute bound on all integration error. The independent N5+ tail is measured
separately; at baseline noon it adds about 0.38% at the horizon and 0.02% near the
Sun. Cache N1-4 is compared with independent N1-4, not with the all-order total.

Disposition: numerical diagnosis is complete within its authorized bound.
Qualified rays can support material sensitivity; remaining cache/reference
exceptions below are held. No further cache redesign is part of this study.

## M2 - Eleven-profile first-order screen

Completed eleven profiles,286 direct spectra and 22 GPU fields with shared
exposure brackets. Fixed extinction when varying SSA leaves molecular N1
unchanged; aerosol N1 scales with SSA to 4.33e-15 relative residual. GPU/direct
checks and finite-column checks are included in final verification.

| Change from combo025 | Horizon Y change | Near-Sun Y change | Glow contrast change | Disposition |
| --- | ---: | ---: | ---: | --- |
|H1800, fixed column|+14.0%|+0.12%|+0.004%|Promising vertical redistribution|
|H2400, fixed column|+23.0%|+0.19%|+0.003%|Strongest brightness lead; advanced|
|alpha0 /0.4|-0.57% /-0.28%|+0.87% /+0.39%|<+0.08%|Mostly hue; not a brightness solution|
|alpha1.2|+0.27%|-0.31%|-0.03%|Warmer hue, small brightness effect|
|loading 10% /15% /20%|+35.7% /+21.7% /+9.9%|-53.1% /-35.3% /-17.6%|-9.5% /-4.8% /-1.9%|Fail registered absolute-glow loss guard|
|SSA0.98 /1|+0.16% /+0.26%|+2.8% /+4.7%|+0.25% /+0.41%|Weak horizon lever in N1|

Reducing loading can brighten the horizon while severely dimming the absolute
solar surround, even if its contrast ratio still looks acceptable. Raising SSA
mainly adds near-Sun light here. Changing alpha shifts hue but moves horizon
brightness by less than 0.6%; these small effects are not rejected as impossible
N4 effects. They did not earn a second finalist or an unsupported combination.

Disposition: H2400 advanced as the distinct strongest lead. No Cartesian sweep,
cutoff layer, shifted layer or phase-function retuning was introduced.

## M3 - Full-order finalist across protected conditions

Both H1200 and H2400 retain exactly the same finite550 nm aerosol column,
loading, SSA and g; only the exponential scale height changes.

| Geometry | H1200 -> H2400 cache horizon Y, cd/m^2 | Cache change | Independent change | Independent endpoint envelope |
| --- | ---: | ---: | ---: | ---: |
|Noon,5 m|6277 -> 7171|+14.25%|+14.66%|+13.15 to +16.19%|
|Noon,500 m|7062 -> 7530|+6.63%|+6.64%|+5.35 to +7.95%|
|Sun15 degrees,5 m|7973 -> 9212|+15.54%|+14.99%|+13.06 to +16.96%|
|Noon,2 km|8373 -> 8160|-2.55%|-2.11%|-3.71 to -0.48%|

The endpoint envelopes divide opposite endpoints of the two separately estimated
95% luminance intervals. They are descriptive conservative endpoint envelopes,
not a formally calibrated joint 95% interval for the effect or all rays.
Sun15 degrees is a registered synthetic lower-Sun case, not a matched sunset timestamp.

| Geometry | Absolute near-Sun mean change | Contrast change | Registered10% loss guard |
| --- | ---: | ---: | --- |
|Noon,5 m|-0.95%|-0.10%|Pass|
|Noon,500 m|+17.21%|+1.89%|Pass|
|Sun15 degrees,5 m|-0.22%|-0.72%|Pass|
|Noon,2 km|+75.63%|+11.36%|Pass|

Six held-out left/right/down offsets at 1 degrees/5 degrees also retain light: their changes
range -0.96 to -0.92% at ground noon, +16.12 to +17.24% at 500 m,
-2.21 to -0.49% at Sun15 degrees, and+66.16 to +75.89% at 2 km. These verify directional
sensitivity, not independent accuracy of every held-out ray.

At ground noon the horizon xy moves from(0.29454,0.31078) to(0.29934,0.31606):
slightly warmer and nearer descriptive D65, while still blue of it. This is
primarily a brightness/vertical-distribution adjustment, not a universal whitening
operation. At Sun15 degrees the horizon also becomes warmer.

Physical interpretation: at the same total column, H2400 halves the aerosol
concentration at ground level and puts more of the material higher up. This
reduces dense low-level horizontal attenuation while retaining scattering into
the solar surround. The two local density profiles cross near 1.66 km; at 2 km
H2400 has about 15% more local aerosol than H1200. The elevated-view tradeoff
therefore has a physical mechanism and is reproduced by the independent solver.
The integral is a balance of illumination, extinction and scattering; local
density alone does not determine its final radiance.

### Bounded H1800 compromise test

Registered before execution: require at least 5% ground horizon gain, at least
0.5 percentage point less2 km horizon penalty than H2400, and retain glow in all
four conditions; only then add independent noon/2 km confirmation.

[Run00040](../../../../../tmp/experiments/sky-aerosol-properties/runs/00040-refine-midpoint/decision.json)
finds +8.67% ground horizon gain and -2.08% at 2 km. The 2 km improvement over H2400 is
0.469 percentage point, narrowly below 0.5. Glow passes. The branch stops at its
registered cache screen; independent H1800 confirmation is not triggered.
This is a failed advancement gate, not proof that H1800 is aesthetically inferior.

## Reference qualification and limits

Final spectral/uncertainty analysis is in run 00044. The independent comparison qualifies 21/32 selected
medium/geometry/ray combinations against all targets. All comparisons pass the
physical matching checks. Six are held because the norm of marginal spectral
95% halfwidths is 1.03-1.19%, slightly over the 1% target, despite luminance
uncertainty below 1%. Five exceed a cache-disagreement target:

- H1200,500 m: solar offsets 1 degrees/+2.07% Y and 5 degrees/+2.52% Y.
- H1200,2 km: solar offsets 1 degrees/+5.53% Y and 5 degrees/+5.24% Y; spectrum and chromaticity
  also miss targets. Much of this already appears in cached N1 reconstruction.
- H1200,Sun15 degrees horizon:-2.09% Y and 2.43% spectrum residual after the higher-sample
  reference. The H2400 lower-Sun horizon remains within disagreement targets.

The spectrum uncertainty check is the width-weighted norm of per-channel 95%
halfwidths divided by spectral norm. It is explicitly not a joint 95% confidence
ball. Luminance intervals retain cross-channel batch covariance; both uncertainty
measures must be <=1% for full ray qualification. Earlier partial report 00035
used the luminance uncertainty gate alone;00043 adds the conservative spectral
check. No failed tolerance was relaxed to retain a result.

Independent transport uses deterministic converged N1 plus Monte Carlo pure
N2,N3,N4, with raw Monte Carlo N1 retained as a separate control. The strongest
runs use 16 x 8192 main paths per band/ray plus 8 paired 64-quadrature batches.
Other protected noon conditions use 16 x 2048 plus 8 paired batches. Both media use
four selected rays and 15 channels. Two lower-Sun references were refined rather
than restarting the full parameter screen.

The external route uses installed libRadtran 2.0.1-MYSTIC, fully spherical 1D,
scalar Rayleigh with zero depolarization, explicit aerosol layer optical depths,
SSA 0.95,256 Legendre moments for the same Cornette-Shanks phase function,
black ground, vroom off and maximum 4 scatterings. Executed input decks, binary,
worker, source units and raw output are archived and authenticated. This setup
validates these model inputs, not arbitrary real-world atmospheric conditions.

The baseline horizon's four external full-spectrum repeats average6303 cd/m^2,
+0.31% relative to independent, with1.32% spectral L2 residual and1.37% Student95
luminance halfwidth. H2400's two repeats average7233 cd/m^2, +0.39%
relative to independent, weighted spectral L2 residual 1.47%. The two-repeat
Student95 halfwidth is 2.52%, so external agreement is corroboration rather than
<=1% external uncertainty certification. Doubling mass layers 256 -> 512 in the
baseline matched-seed control changes luminance by -0.0012%. A three-band N1
solar pilot's 12% green discrepancy reduced to 1.4% at tenfold photon count;
that pilot is not a full-spectrum N1 qualification.

The baseline full-spectrum solar-offset1 degree external mean is1.62% above
independent, but its four-repeat luminance halfwidth is12.13% and spectral L2
residual6.30%. It does not qualify solar-surround accuracy. Retaining this
negative precision result is preferable to presenting a close mean as validation.
Additional high-photon external Sun runs are deferred; the physical halo
sensitivity has independent/cache support but is not externally certified here.

## Execution decisions, corrections and retained evidence

- Keep numerical and material interventions separate; use 272/60 for both media.
- Use one initial full-order finalist, then one registered H1800 compromise.
  No new sunset case, rich mixture or wavelength-dependent SSA was earned.
- Stop expansion after the registered compromise gate; retain every adverse ray.
- 00006 remains scientifically invalidated for experimental wavelength-shader
  constant reuse; corrected observations are00009 onward.
- 00013 remains failed because production admits 60 construction intervals;00014
  changes only a generated experiment copy for the 120 diagnostic.
- 00019 remains failed for orchestration run attribution during concurrent external
  allocation. Its completed baseline00020 was preserved and reused by 00023.
- Candidate color reports00026/00037 used an H1200 direct packet for their N1 parity
  diagnostic. Their spectra, images and N4 metrics remain usable, but those
  parity files are superseded by correctly matched00041/00039 respectively.
  Main analysis already uses matched direct controls00018, so material findings
  were not computed from the mismatched parity diagnostics.
- Legacy color reports store nominal noon directions for lower-Sun near-Sun rays.
  Actual shader queries were correctly rotated; final analysis reconstructs and
  checks actual directions from captured controls against independent queries.
- Source-normalized R/B is recomputed explicitly in final analysis; older default
  ratio fields are not used to claim source-normalized hue agreement.
- The first final verifier00045 failed when the sandbox denied its read-only Git
  child process. The same proof completed with host execution in00046. This did
  not require rerunning transport or changing production/Git permissions.

## Cost, verification and checkpoints

The [final proof](../../../../../tmp/experiments/sky-aerosol-properties/runs/00046-refine-verify/verification.json)
authenticates all closed run artifacts and their prior-evidence parent identities,
physical controls, GPU/direct N1 parity, held-out angle geometry, finite fields
and faithful accounting of failed targets. Production is unchanged relative to
the initial recovery checkpoint; owned browser/solver scratch is empty.

There are five historical progress-cadence exceptions:00007,00021,00022,00028
and00038 have maximum gaps108.1,61.3,66.6,38.6 and62.2 seconds respectively,
exceeding the30-second contract. Their artifacts/terminal states authenticate,
but monitoring compliance is not claimed. Synchronous host work and scheduling
can delay an event-loop heartbeat; future long runs need an independent heartbeat
or bounded yielding around serialization/I/O. Old progress records remain intact.

The retained closed-run inventory is 519.4 MiB, including the first campaign,
invalidated observations and failure records; the final proof adds a small amount.
No previous evidence was deleted. The new measured execution spans about59 minutes
from the first pilot through final proof, excluding earlier preparation; this is
wall time with overlapping CPU/GPU work, not pure compute or reasoning time.
The baseline external eight-case batch alone took53.8 minutes wall time.

Full15-band/four-condition observed cache runs took 105 s for H1200 and 133 s for
H2400 at 272 directions. These are observed diagnostic jobs, not controlled
benchmarks or deployable package-build timings. The original 68 run took 103 s;
GPU load/JIT overlap means these numbers do not establish free angular refinement.

The compiler logical texture peak is 180588960 bytes plus 321226560 bytes for
experimental pure/cumulative observation accumulators, an upper bound of about
479 MiB for these allocations. This is not driver/OS peak memory. Sampled Node
RSS is about 171-202 MB; total browser/WSL process peaks and historical peak scratch
were not instrumented and must not be inferred from unrelated Chrome processes.
One owned GPU browser runs at a time; installed CPU MYSTIC runs alongside it.

Pure-order fields and the accumulated source field are traced separately. Because
the solar interpolation is monotone and nonlinear, tracing their sum need not
equal summing the separately traced increments. The maximum relative closure
residual is 0.118% across the three full caches; it is retained as a reconstruction
diagnostic rather than mislabeled as roundoff or an exact pure-order identity.

Local type checking passes. No experimental unit-test tree was created.
Dedicated standards reviews/audits are disabled by experiment policy; no
standards-compliance claim is made. Checkpoint advice remains active.

Local checkpoints:

- `b00c7f40` - preserve prior completed app work, first campaign and initial setup.
- `6368bb3a` - preserve refinement measurements and the analysis harness.
- Final handoff message: `docs(experiment): conclude aerosol refinement study`;
  its commit identity is available in Git history and the execution reply. No push.

M1-M3 and the bounded adaptive branch are complete, with their explicit qualified,
held and rejected claim boundaries. App integration, a production cache selection,
measured-profile claims and B1 scores are outside this execution. Any next campaign
starts from this report and preserves these runs; no further run is queued.
