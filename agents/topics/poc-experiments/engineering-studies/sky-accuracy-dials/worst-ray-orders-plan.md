# H58: Largest B1 Disagreement With libRadtran

Owner selection: find rays where the corrected cache diverges most from
libRadtran, then compare their scattering orders with independent references
and render swatches and signed spectral differences. Preserve H57's useful
cancellation comparison; its rays were selected by score change.
Baseline Git: `f0848d79`. Production remains unchanged.

## Locked Selection

Use the authenticated retained libRadtran spectral boundary covering all1377
B1 time/ray cells. Rank corrected-cache N4 RMSE against that all-order output
over the same31 scored channels,360-712.5nm. Independently recompute every cell
from saved spectral values; verify the H56 measurement ledger separately.
Retained published spectra are a screening reference, distinct from newly
matched/convergence-controlled libRadtran calculations.

| Rank | Time | Ray | Grid x,y | Elevation | Sun separation | RMSE vs retained libRadtran |
| --- | --- | --- | --- | ---: | ---: | ---: |
| 1 |09:30|67|4,7|33.7490deg|7.3689deg|23.8232 |
| 2 |09:45|67|4,7|33.7490deg|10.4878deg|19.4820 |
| 3 |11:00|57|3,6|53.3665deg|4.1932deg|18.0013 |

Units: mW m^-2 sr^-1 nm^-1. These are the literal top three cells, including
adjacent times at the same direction. Do not substitute measured-target error,
change in error, or more visually distinct selections. Also retain the full
ranking and band-limited signed residuals.

## Execution

- Reuse the matching H57 third-ray GPU and admitted libRadtran data after exact
  packet, wavelength/source and ground checks. Preserve the external parent's
  disclosed monitoring defect and authenticated admission lineage.
- Compute only the two missing rays. Reuse validated independent GPU backward
  Monte Carlo and fully spherical MYSTIC,40 bands,paper atmosphere/source/grass
  and N1,N1-2,N1-3,N1-4/all-order targets. Surface reflection counts as an interaction.
- Independent24x8192 histories with paired64/128 quadrature. External four20000-
  photon seeds per prefix,128layers,two concurrent cases. Retain precision misses;
  old layer controls remain scoped rather than universal convergence proofs.
- Render common-gain cumulative swatches,spectra and pure-order errors. Add the
  retained reference as an explicitly all-order total beside fresh physical
  solutions. Plot signed spectral residuals so display mapping cannot hide errors.
  Do not invent a retained per-order spectrum.
- Compare cache vs fresh same-order references separately from agreement with
  retained all-order libRadtran. Identify where disagreement first appears;
  include uncertainty,tail and reconstruction residuals. A reference-generation
  difference is distinct from an identified cache defect.
- Keep immutable runs,monitoring,local types,self-review,visual and numerical/
  input verification,cleanup and checkpoint advice. No experiment reviewers.

Observed retained evidence604,303,609bytes leaves16.4MB under592MiB. The two-ray
GPU/reference package,images and sealing reserve justify a bounded32MiB increase
to624MiB in the owning design and allocator. Scratch1GiB and free-disk40GiB
limits remain.60minutes is guidance while monitored positive progress continues.

## Decisions And Progress

1. Initial clarification selected largest absolute measurement RMSE; the owner
   then refined the objective to largest divergence from libRadtran before any
   new solver run. No measurement-ranked reference campaign was executed.
2. Rank against retained full-B1 libRadtran coverage, then check fresh matched
   references at those exact selected rays. Do not claim newly solved global
   maxima without a full newly matched reference grid.
3. Preserve H57 as useful cancellation evidence, without relabeling its selection.
4. Include residual plots because common display mapping can conceal spectral errors.
5. Reuse the exactly matching third ray and validated solver conventions rather
   than repeating the prior hour-long three-ray campaign.

Completed in [H58 results](worst-ray-orders-results.md),with accepted external00365,
independent00366,interim00367 and final00368. Source checks,figures,immutable
verification and cleanup pass. Failed00364 remains preserved. No promotion,
cache build or further numerical campaign is selected.
