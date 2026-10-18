# H64 Toronto dusk independent brightness comparison

Status: registered comparison complete; [results](twilight-reference-results.md)
own the sunset finding, images, accepted00433 verification and unmet late-twilight
precision/refinement limits. No production change.

Owner-selected follow-up to completed H63. Determine whether the bright corrected
Toronto sunset/twilight glow is supported by independent radiative transfer.
No presumption that either corrected cache is wrong; production stays read-only.

- Match H63 sunset, +30 and +60 minute solar zeniths, observer 5m, black ground,
  scalar spherical geometry, no refraction/ozone, Native15 source and extinction.
  Toronto measured phase/SSA above440nm only; canonical extinction and profiles.
- Probe elevations0.05,3,20 degrees, relative azimuth5 degrees toward the Sun.
  This small sideways offset avoids the direct solar disk at sunset for every
  method, rather than mixing direct sunlight with atmospheric scattering.
- Rebuild Corrected60 and Focused60 full-domain GPU fields once per wavelength,
  querying all nine rays at Q30/Q120 through pure/cumulative N1-N4. Reuse existing
  compiler equations, Mie mass normalization and outgoing mapping. Numerical
  final-view replay is a spectral probe, not another application screenshot.
- Run qualified libRadtran2.0.1 MYSTIC fully spherical with VROOM explicitly off.
  Check operational pilot first; four independent seeds per full case,256
  equal-column molecular layers plus aerosol levels,50,000 photons per band.
  Refine horizon layers to512 with four seeds. Sampling targets:5% luminance
  half-width and10% significant visible-band half-width, report misses honestly.
  Pilot uses3 channels/10,000 photons. Its zero +60minute result selects500,000
  photons per band at +60minutes in both main and layer-refined campaigns.
  Spherical mode already enables backward tracing; it is explicit in new decks.
  Adjust sampling where actual progress
  warrants it; preserve failed runs and never silently relax precision claims.
- Keep all-order external light distinct from cache N1-N4. Missing higher orders
  can explain a cache deficit; this comparison alone does not attribute that tail.
  Layer refinement and Monte Carlo uncertainty remain separate from model limits.
- Report physical luminance, spectra and residuals plus reviewable swatches at
  matched production display context and common exposure. No per-solver fitting.
  Publish useful previews between stable campaign blocks. Original H63 images
  remain the full-scene visual reference.
- Preserve immutable parent source/material/run identities and external manifests,
  raw output hashes, executed decks, optical-library byte/column qualification.
  Use existing shared tool run ownership for native solver executions.
- Stay within existing720MiB retained experiment allowance by retaining only
  compact selected-ray outputs, controls and compressed bundles; no full fields.
  External tool-owned case copies are recorded separately. Scratch remains1GiB.
- Self-review, local types and immutable scientific verification; checkpoint
  adviser only. No dedicated standards reviews in this experiment.

Sixty minutes is guidance; continue while strong useful progress is being made.
GPU preferred for cache work; native MYSTIC is the independent CPU reference.
