# H60 Incoming Angular Resolution Sweet-Spot Test

Status: bounded findings preserved; further builds stopped after the outgoing/
incoming distinction was clarified. Baseline Git348f3550. GL256 is qualified;
full GL512 remains incomplete. See [results](incoming-resolution-results.md) and
[execution](incoming-resolution-execution.md). The experiment remains open.

## Scope Clarification

H59 isolated outgoing-angle interpolation of N1. Incoming quadrature is a
separate higher-order integration control and cannot converge to the exact-angle
N1 replacement. The originally proposed alternative framing below is the
registered question, not an established equivalence. Keep this sweep as a
higher-order sensitivity/cost test; do not infer a repair of outgoing lookup.

## Question And Registration

Can better incoming angular integration improve the selected rays' N2-N4
accuracy enough to offer a build-time alternative to H59's N1 readout replacement?
Keep the original cached N1 readout. Increasing incoming count does not change
J1 and cannot fix its outgoing interpolation error; any total improvement comes
from changed higher orders and may involve cancellation.

Fixed physical packet and witnesses are exactly H59:09:30/ray67,09:45/ray67,
11:00/ray57, paper Direct40, native51 positions, Z180, W27 outgoing, source20,
transport60, normalized Mie phase mass, original Q30/cubic readout. Reuse matched
H58 independent/libRadtran references and H59 comparison data read-only.

Screen counts F68, GL8x16=128, GL16x16=256, GL16x32=512, GL32x32=1024;
Gauss-Legendre in cosine with midpoint mirrored azimuth pairs. Rule family and
polar/azimuth resolution are explicit: count alone is not the intervention.
Rebuild the COMPLETE native field domains through J4 at407/501/642nm, but retain
only the original selected-ray pure and cumulative spectra. This is not a
bounded row patch and is not a full-sky benchmark. A fresh F68 screen must
reproduce H59 exactly and establishes comparable native build timing.

## Selection And Qualification

Judge cumulative N4 spectral RMSE against matched independent N1-4, and separately
pure N2,N3,N4 plus their summed higher-order contribution. Keep brightness/color
and spectral shape separate. For screen cells use saved per-band sampling
intervals where available; never treat a sparse-band score as full-spectrum RMSE.

Rank the mean selected-ray higher-order RMSE and total N4 RMSE jointly against
median channel build time. A practical sweet-spot candidate is the least-cost
rule within5% of the best screened mean higher-order RMSE, with each ray's
behavior reported and any >10% higher-order regression relative to F68 flagged.
If this conflicts with total N4 fit, retain the tradeoff instead of hiding it.
Expand at most two promising rules to all40 bands, normally one knee and one
higher-resolution check. Reuse all matching screen channels exactly. If the
screen shows no plateau, report that; no unbounded count sweep is authorized.

Require J1/N1 invariance, fixed outgoing dimensions and physical inputs,
positive normalized incoming weights and native replay. Preserve pure-order and
cumulative grouping differences. Compare final all40-band Y and31-band spectral
errors against independent references; libRadtran is the existing wider external
cross-check. Report the earlier N1-replacement result as a separate alternative,
not mixed into any incoming-count candidate. Do not infer full B1 paper RMSE
from three selected rays. A full B1 test is NOT selected by this request.

## Images, Resources And Completion

Provide an interim numerical error/cost plot after the screen, then all40-band
common-CIE/p2 swatches and spectral/order plots for selected rules. Include the
F68 and independent reference, retaining numerical residuals when bright swatches
hide differences. No color reconstruction from three bands.

GPU-first, one job/wavelength at a time; streaming selected spectra avoids full
field retention. Use the existing immutable run allocator and ownership checks.
Source stays in experiments/sky-accuracy-dials/incoming-resolution; output stays
in tmp/experiments/sky-accuracy-dials. Preserve all prior evidence. Current656MiB
retention,1GiB scratch and40GiB free-disk limits remain; target <=8MiB new retained
output with compact recipes. No system/GPU/production limits change.

Measure one wavelength at higher counts before expansion.60minutes is guidance;
continue while strong monitored progress remains. Record actual build timings,
compiler-owned peak field bytes separately from total GPU memory, invariant
final cache dimensions, source/tool identities and cleanup. No new external
solver campaign or experimental unit-test suite. Source type checks, self-review,
scientific/visual/immutable proofs and checkpoint advice remain; dedicated
reviewers/audits remain disabled. Completion is a qualified sweet-spot finding or
an explicit nonconvergent/tradeoff result, retained images and reproducible code.

## Owner-Selected Future Follow-Up

After this uniform-count screen, consider different incoming rules/counts for
N2,N3,N4. Allocate effort using measured per-order sensitivity and cost rather
than assuming later orders always need fewer directions. This is recorded for
later and is not added to the active uniform-count campaign.

Each preceding radiance field must be freshly transported at the directions
needed by its next scattering pass. Do not resample a smaller incoming field
onto a larger rule and claim equivalent accuracy. Preserve quadrature/frame,
normalization, reflection and per-order texture/domain contracts across rule
transitions; verify invariant prefixes and compare matched per-order references.
