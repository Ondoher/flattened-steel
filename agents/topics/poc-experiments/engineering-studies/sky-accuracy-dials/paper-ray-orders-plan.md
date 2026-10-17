# H57: Matched Paper Rays Through Scattering Orders

Completed in [H57 results](paper-ray-orders-results.md). The [execution summary](paper-ray-orders-execution.md) records decisions, repaired reporting/monitoring defects and verification limits. No further calculation is selected.

The owner requests specific rays that demonstrate the H56 issues, compared
through scattering orders using the corrected cache, independent solver and
libRadtran, with rendered swatches. Baseline Git: `77cbdc30`. This is contained
diagnosis; production and earlier evidence remain unchanged.

## Locked Ray Selection

Select from accepted H56 cell budgets before new reference calculations:

| Witness | Time | Grid x,y | Elevation | Sun separation | Reason |
| --- | --- | --- | ---: | ---: | --- |
| Low regression | 13:30 | 0,4 | 12.1151 deg | 56.1047 deg | Largest joint SSE increase in the lowest ring |
| Matched improvement | 13:30 | 8,4 | 12.1151 deg | 99.6651 deg | Largest improvement in that ring at the same time |
| Near-Sun deficit | 11:00 | 3,6 | 53.3665 deg | 4.1932 deg | Largest individual joint SSE increase overall |

Keep all40 Direct40 wavelengths and the paper atmosphere/source/grass boundary.
Use saved baseline and normalized60 through-order4 spectra; do not rebuild caches.
These are descriptive diagnostic selections, not withheld accuracy tests.

## Independent And External References

Adapt the cache-free GPU backward Monte Carlo estimator to the paper Lambertian
grass surface. Count surface reflection as an interaction, matching the cache
recurrence; retain separate pure orders1-4, cumulative1-4 and the compensated
all-order estimate. Supply only the physical packet. Rotate each spherical ray
to a pole observer while proving elevation and Sun separation are unchanged.
Validate N1 against independent binary64 direct integration, use repeated batches
and a paired source/view quadrature control. Use hardware GPU preferentially.

Run the existing local fully spherical libRadtran/MYSTIC tool with explicit
column-integrated Rayleigh/aerosol properties, Cornette-Shanks moments, source
irradiance, paper spectral grass albedo, observer0m and exact ray/Sun angles.
The installed source counts surface reflections in its scattering counter and
provides diagnostic `mc_maxscatters`. Validate the through-order1 convention
against dense N1 and the independent estimator before using prefix1/2/3/4.
Keep all orders as a separate external result.

The installed build rejected spectral importance sampling as an unavailable
command in preserved00353. Use ordinary independent wavelength calculations.
Pilot timing and noise determine the repeated photon budget; preserve every
attempt. Initial repeated budget is four20,000-photon seeds per prefix/ray.
The GPU surface origin is offset1m above the6360km sphere to resolve Float32
geometry; retain this numerical approximation explicitly when assessing agreement. Do not assume
DISORT planar geometry equals this spherical problem, or manufacture missing
per-order references from all-order spectra.

## Images And Qualification

Render common-gain swatches for baseline, corrected cache, independent solver
and libRadtran at cumulative orders1-4 and all orders where available. Show
unavailable cache all-order cells explicitly. Use the same Direct40 CIE/p2
conversion, source illumination and display mapping for every method, with no
per-swatch exposure fit, brightness normalization or white balance. Include
physical luminance and uncertainty, spectral plots and signed order budgets.
Separate physical order tallies from cumulative cache reconstruction differences.

Use pilot and full immutable runs, monitorable progress and frequent reviewable
images. Target a bounded package rather than a full-sky campaign. Check empirical
precision and paired numerical controls; report any unmet targets rather than
claiming convergence. Run local type checking, artifact/input verification,
image inspection and owned-resource cleanup. Keep checkpoint advice active;
dedicated experiment reviewers/audits remain disabled. Existing disk budgets
apply, amended only for a measured bounded shortage required by this request.

## Completed Execution

- [x] Lock the three adverse/control witnesses before reference calculation.
- [x] Validate matched geometry, spectral grass and interaction-order convention.
- [x] Run all 40 independent GPU bands with repeated and paired controls.
- [x] Run all 60 external prefix/ray/seed cases and retain uncertainty.
- [x] Preserve failed/rejected attempts and admit intact data after the disclosed post-compute cleanup heartbeat defect.
- [x] Prove the completed-case staging cleanup repair without transport.
- [x] Render final cumulative swatches, spectral intervals and signed pure-order errors.
- [x] Record reconstruction/tail/factorial budgets, scientific limits, immutable verification and cleanup.

The results and execution summary own actual outcomes. Historical inputs and artifacts remain unchanged; no production promotion or further campaign is selected.
