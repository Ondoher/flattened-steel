# Aerosol properties: controlled first campaign

Execution: M1–M3 complete. [Results](results.md) owns the milestone reports,
accepted evidence, retained pilot failure and order-limited conclusions. Full N4
and libRadtran confirmation remain follow-on work; production is unchanged.

## Outcome and authority

Exploratory work selected by the owner: identify how aerosol absorption, amount
and angular scattering affect a brown/gray horizon and the glow around the Sun.
Set up and execute a bounded first campaign. Production and suspended experiments
remain read-only. No default-atmosphere change or production promotion is selected.

This campaign screens mechanisms with converged independent first-order spectra
and matched hardware-GPU sky images. It can retain promising settings for a later
full N4 cache study, but cannot qualify them as an app replacement. Full scattering
and natural-sky accuracy are explicitly outside the first-order claim.

## M1 — Pin controls and make the comparison interpretable (about 20 minutes)

- Record the original paper-like exponential medium: aerosol amount beta=0.04,
  single-scattering albedo (SSA)=0.8, Cornette–Shanks g=0.7, aerosol scale height
  1,200 m; molecular scale height 8,000 m; original source and spectral basis.
- Include current zero-aerosol and original full-aerosol controls. Use San Jose
  solar-noon geometry, spherical Earth and 5 m observer height first; record the
  exact source direction and observation. This is a controlled diagnostic, not a
  reconstruction of the owner's screenshot without its complete settings.
- Preserve all Native15 spectra with explicit W m^-2 sr^-1 nm^-1 radiance units.
  Authenticate imported independent solver, original CIE table and physical inputs.
- At fixed extinction, changing SSA changes scattering and absorption together
  while retaining their sum. Record that intervention precisely; it is not an
  absorption-only reduction at fixed scattering. Require the fixed-scattering
  endpoint beta=0.032, SSA=1.0 alongside beta=0.04, SSA=1.0 and the original control.
  Save molecular and aerosol N1 terms separately: at fixed extinction molecular
  N1 must remain unchanged and aerosol N1 must scale exactly with SSA.
- Use one fixed exposure/display convention for the primary images. Also report
  physical luminance/chromaticity so tone mapping cannot masquerade as transport.
- Implement immutable runs, source hashes, phase progress and heartbeat at <=30 s.

Deliverable: registration and positive-control report in results.md. Advance only
when optical coefficients, units, source and color controls are reproducible.
Invalid controls hold the milestone; repair the affected part rather than drawing
physical conclusions from a failed harness.

## M2 — Separate the three properties (about 20 minutes after the pilot)

1. Absorption/scattering split at original extinction and g: SSA 0.8, 0.9, 0.95,
   1.0. Interpret 1.0 as a useful nonabsorbing endpoint, not a measured atmosphere.
2. Aerosol amount at SSA=0.95 and g=0.7: 10%, 25%, 50%, 100% of original beta;
   retain the zero-aerosol control. Keep the vertical distribution unchanged.
3. Angular shape at 50% loading and SSA=0.95: g=0.55, 0.7, 0.85. This varies
   the Cornette–Shanks shape parameter, not a measured particle-size distribution.
4. Probe horizon elevations 0.05, 1, 3, 10 and 20 degrees toward, across and away
   from the Sun. Add solar-angle offsets 0.5, 1, 2, 5 and 10 degrees; exclude the
   direct solar disk from the diffuse-glow metric. Define the sparse glow contrast
   as mean luminance at offsets 0.5/1/2 degrees divided by mean luminance at
   offsets 5/10 degrees, along the great circle toward the zenith. It is a sparse
   radial diagnostic, not an integrated annulus. Freeze the numerical radiance
   floor from original-control maximum radiance times 1e-8 before candidate analysis.
5. Check independent binary64 quadrature at 64/128 nodes, refine only failing
   rays to 256/512 as needed. Require <0.2% relative spectral change for claims;
   use an absolute floor and report near-zero/dark rays separately.
6. Render actual sky color fields on the hardware GPU, including an away-Sun
   horizon view and a view centered on the Sun. These images are necessary to
   show hue and spatial glow. Label them independent N1, not production scenes.
   Compare GPU spectra against converged CPU rays to <0.5% where measurable.
7. Report luminance, xy, source-relative red/blue ratio and solar-glow contrast;
   preserve absolute spectra and separate brightness from hue. Produce numerical
   tables as Markdown/JSON/TSV, not text embedded in images.

Deliverable: images as soon as available, spectra, metric table and milestone
report. N1-screen rejection applies only to this order, not N4. Reject only branches that fail to move either target beyond numerical
uncertainty, remove the glow, or merely move the unwanted color elsewhere. Retain
tradeoffs on a Pareto comparison; do not declare a subjective color winner.
No arbitrary whiteness target substitutes for a measured clear-sky atmosphere.

## M3 — Challenge the interpretation and report (about 20 minutes)

- Check the most informative 1–2 settings at noon/500 m and lower-Sun/5 m
  independently, each with matched original and zero controls. Report source path and exposure.
  Do not compare different heights or Sun angles as if aerosol properties alone changed.
- If raised SSA brightens the horizon but leaves its hue unchanged, reject
  absorption as a complete color explanation and follow loading or phase evidence.
- If display clipping hides differences, retain physical spectral/chromaticity
  results and add one separately labeled exposure bracket for every compared case.
- If the initial controls already disprove the proposed absorption mechanism,
  finish the remaining distinct low-cost mechanisms rather than stopping the study.
- Record any new lead with its evidence, distinct prediction, bounded next test,
  estimated cost and protected controls before running it. Limit active additions
  to two. A 60-minute elapsed point is a progress review, not an automatic stop
  while clear positive progress continues within actual resource availability.
- Finish with a reviewable report stating what the experiment establishes, what
  remains unresolved, and exact retained configurations. Full N4 cache/render and
  matched libRadtran spectra are the next confirmation campaign for any promising
  setting; this first campaign does not silently claim those tests were run.

Completion: authenticated controls, converged physical sensitivities, qualified
GPU images and an honest mechanism/limitations report, including negative results.
No cache-building complexity rejection; report expected build time and memory.
Full-cache paper RMSE comparisons, when selected, must hold atmosphere fixed
against matched references. Different media are appearance choices, not algorithm
accuracy improvements over the original paper atmosphere.

## Resources and recovery

Measured pilot adaptation: initial Sun views were nearly saturated at the primary
exposure, and each constant-specialized shader compiled for roughly 40 seconds.
Preserve the pilot as deliberately interrupted/failed and authenticate its closed
CPU packets in a new run. Retain raw float RGB and add one common lower-exposure
bracket for all cases; reuse one uniform-controlled GPU program with the same
equations and quadrature, requalifying against CPU spectra. No earlier gate changes.

One bounded scientific follow-on is earned by the noon screen: lower loading
whitens the horizon while higher g strengthens the solar surround. Test their
combination at 25% and 10% loading, SSA=0.95 and g=0.85, predicting both effects
can coexist. Cost: two CPU packets and four reused-kernel GPU fields. Protect the
original/zero controls, fixed exposure and original spectral/precision gates.

Use one hardware-GPU browser at a time; CPU handles selected binary64 reference
rays. No new dependencies or experimental test suite. Budget is initial guidance
of roughly 60 minutes and compact evidence; measure the pilot before extending.
There is no newly invented retained-disk approval cap. Preserve existing dirty
production work and every earlier artifact. Failed/interrupted runs remain sealed;
retries write new runs. If hardware or precision is inadequate, report inconclusive
and identify the smallest resolving measurement.

## Plan critique

One read-only second-agent critique is required by create-plan before execution,
limited to this campaign's causal controls, visual evidence and claim boundaries.
The independent critique was completed before execution. All five recommendations
were incorporated: mandatory fixed-scattering endpoint, species decomposition and
SSA invariants, separate height/Sun interventions, order-limited rejection and
frozen glow/floor definitions. No suggestions were rejected. No dedicated
standards reviewers, audits or recurring milestone reviews are enabled.
