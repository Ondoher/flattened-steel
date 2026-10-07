# Kider Mismatch: Follow-up Context and Hypotheses

## Start here

This is the resumption guide through the completed aerosol sensitivity pass.
It links the canonical results rather
than replacing their detailed measurements, uncertainty or provenance.

**Working hypothesis:** much of the discrepancy exposed by numerical
corrections arises from shared physical-model assumptions or inputs, with
aerosols a likely major contributor. This is the owner's leading hypothesis,
not a measured attribution or a conclusion that implementation errors are
absent. Known numerical errors can cancel one another and also conceal the
remaining physical/observation mismatch.

**Current state:** evidence through accepted 00235 is complete. The
[aerosol sensitivity](aerosol-sensitivity-results.md) tests regional phase and
scattering-albedo alternatives separately and together through the all-order
direct solver. Selected visible deficits improve; joint changes overshoot
the controls, although each isolated change helps their supported-wavelength
agreement. This supports physical-input sensitivity without identifying
the actual atmosphere or isolating the benefit of extra shape flexibility.
No simulation is active or full production improvement qualified. The adoption
hold remains; the source-refinement candidate is saved for later investigation.

The owner now requests excluding wavelengths without supporting aerosol data
from this sensitivity interpretation. Use the [supported-wavelength analysis](aerosol-sensitivity-results.md#supported-wavelength-interpretation):
exclude 360 nm; retain the four wavelengths interpolated within measured bands.
On that subset, phase alone and albedo alone each improve both controls, while
their combination overshoots. Preserve the original full benchmark and sealed
five-wavelength results; this restriction applies to the current diagnosis.

**Reference versus production:** the direct solver already avoids the known
cache/reconstruction and finite-order truncation mechanisms. It is not a
production deployment or proof of zero numerical error. Production corrections
remain deferred. The [cancellation interpretation](aerosol-sensitivity-results.md#numerical-and-physical-cancellation)
records the owner's hypothesis that new physical inputs may expose other
cancellations, and the unexecuted numerical-by-physical comparison discussed
in response. No additional correction or test has been selected.

**Latest spatial clues:** in the supported subset, all three selected rays
40-56 degrees from the Sun improve jointly; controls near 78-83 degrees
overshoot, and the low morning ray near 123 degrees worsens. The low rays
have the same elevation but different time and Sun angle. Repeated-scattering
fractions also differ. These observations constrain hypotheses without
isolating angle, temporal change, aerosol profile or ground contribution.
The result document owns exact values and their retained-data derivation.

## Objective and working preferences

- Improve the matched Bruneton comparison scores against measured Kider sky
  radiance, without selecting numerical inaccuracies for their favorable bias.
  The [reference-model target](reference-model-target.md) owns benchmark scope.
- Separate the continuous physical formulation from its numerical evaluation
  and from the observation model. More numerical accuracy approaches the
  declared equations; it does not establish that those equations and inputs
  describe the captured atmosphere.
- Reuse existing evidence before collecting more. Favor GPU computation for
  new atmospheric evidence, directional conclusions over excessive precision,
  and small fixed tests with explicit stopping conditions. The previous
  three-hour packages are consumed, not renewable open-ended authority.
- Statistical uncertainty is acceptable. The offline direct reference uses
  no radiance/attenuation caches; all-order Monte Carlo evaluation was expressly
  accepted after nested deterministic quadrature proved too expensive.
- Runtime work must be fixed and loop-free within each ray sample. Multiple
  samples along a ray are expected. See the [cost constraint](design.md#running-shader-cost).
- Near-Sun mismatch remains included in full scores but is set aside as the
  current work priority. Shared weakness there is not permission to remove it
  from the benchmark.
- Formal reviewers remain suspended by the owner. Checkpoint advice is wanted,
  with preapproved advised messages and a one-minute limit.
  [Status](status.md#verification-boundary) owns that lifecycle and
  current resource accounting; do not infer a fresh reviewer startup request.

## Evidence map and what each result establishes

| Question                                                      | Canonical owner                                                                                               | Established scope                                                                                                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What equations are we trying to solve?                        | [Idealized model](idealized-model.md)                                                                         | Continuous transport, coupled ground, physical assumptions and observation boundary; local Markdown math preview is available                                       |
| Which particular numerical errors cancel?                     | [Detailed attribution](attribution-results.md) and [00224 targeted results](targeted-improvements-results.md) | Density, transmission, phase reconstruction and their interactions; corrected P1 can worsen a frozen-higher-order Kider proxy                                       |
| Do higher-order repairs explain the proxy regression?         | [00225 remaining factors](remaining-factors-results.md)                                                       | Selected P2 accuracy improves while some proxy scores worsen; small transport response; failed observation attempts retain no atmospheric output                    |
| Is solar geometry independently known?                        | [00228 registration](solar-registration-results.md)                                                           | Sparse-fit bias and regional inconsistency; no qualified replacement axis or clock correction                                                                       |
| Does a direct, all-order solution remove the mismatch?        | [00230 convergence](direct-convergence-results.md)                                                            | Large discrepancies persist with reported sampling uncertainty; the deterministic timeout is no longer the latest reference result                                  |
| Do competing models share the errors?                         | [00231 matched comparison](reference-comparison-results.md)                                                   | Full retained benchmark and regional comparisons; shared residuals do not prove identical numerical defects                                                         |
| Does cancellation persist away from the Sun?                  | [00232 alternate rays](alternate-rays-results.md)                                                             | Six selected rays, all-order reference, numerical checks and signed approximation benefits/harms                                                                    |
| Is there a repeatable Sun-angle pattern?                      | [00233 angular analysis](angular-residual-results.md)                                                         | Conditional held-time angular structure in visible wavelengths, much weaker at 360 nm; not a phase retrieval                                                        |
| How do those cases bear on aerosols?                          | [Eight-case evaluation](aerosol-cancellation-evaluation.md)                                                   | Separates demonstrated cancellation, physical hypotheses, exceptions and discriminating responses                                                                   |
| Can regional aerosol alternatives improve accurate transport? | [00234-00235 aerosol sensitivity](aerosol-sensitivity-results.md)                                             | Supported-wavelength phase/albedo factorial: visible gains, isolated control gains but joint overshoot; regional sensitivity, not local retrieval or full benchmark |
| What is saved for production?                                 | [Source-refinement follow-up](accuracy-controls.md#saved-production-follow-up-source-sample-refinement)       | Investigate more source samples after joint reconstruction corrections; full-solver qualification remains open                                                      |

The original [five diagnostic rays](diagnostic-rays.md) and the later
[six alternate selectors](alternate-rays-results.md#fixed-selection-and-execution)
are different sets. Keep their times, wavelengths and baselines distinct.
The saved experiment control and older published production capture are also
different baselines; neither is a fresh current-source benchmark.

## Hypothesis register

The case evaluation owns the quantitative examples and primary aerosol
interpretation. This register preserves the broader alternatives discussed.
None of the untested entries is an established cause or a fitted recommendation.

| Hypothesis                                                                            | Why it remains relevant                                                                                       | Distinguishing evidence or limitation                                                                                                                                                     |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Broad aerosol phase shape is inadequate                                               | Visible deficits have repeatable angular structure outside the near-Sun region, including in competing models | 00235 phase alone improves supported-wavelength aggregate and both controls; joint phase/albedo overshoots controls. Mean directionality versus detailed shape remains unseparated        |
| Aerosol scattering/absorption varies with wavelength more than assumed                | Violet excess coexists with visible deficits                                                                  | 00235 albedo alone improves supported-wavelength aggregate and both controls; level versus spectral variation remains unseparated. Unsupported 360 nm is excluded from this diagnosis     |
| Aerosol amount or optical-depth spectral slope is wrong                               | These affect both illumination reaching samples and scattered light                                           | Preserve linked scattering/extinction changes; radiance alone may not distinguish amount from absorption or phase shape                                                                   |
| Aerosol vertical or horizontal distribution is oversimplified                         | Low-elevation transport and regional asymmetry are sensitive to where scattering occurs                       | Compare vertical profiles at fixed total column before changing amount; numerical altitude-grid refinement is not a physical profile test                                                 |
| Humidity, particle size/composition or nonspherical particles underlie aerosol errors | They are possible reasons the actual aerosol optical properties differ from a one-parameter description       | No capture-specific aerosol state has been retrieved. Weather can constrain context but does not determine the particle distribution, phase law or absorption                             |
| Ground reflection differs from the assumed surface                                    | Reflected and multiply scattered light can affect spectral/elevation patterns                                 | Independent surface context is needed; changing ground brightness to fit radiance would not identify the cause                                                                            |
| Geometry, optics or radiometric calibration contributes                               | Fitted Sun direction is not independent calibration; scans have finite duration and angular acceptance        | Use independent imagery/metadata. Selected raw spectra reproduce, which checks processing but does not validate instrument calibration                                                    |
| Solar spectrum or molecular inputs contribute to violet bias                          | The violet excess has little conditional angular predictability                                               | Check the full measured spectral shape and source/calibration provenance before assigning it to aerosols                                                                                  |
| Missing gaseous absorption or polarization matters                                    | These are physical simplifications worth keeping distinct from aerosol modeling                               | No matched perturbation has been run here. Adding absorption alone cannot brighten an existing deficit at fixed other inputs; do not present either effect as the established explanation |

Earlier discussion treated aerosol amount/spectral properties, phase shape and
distribution as plausible large contributors. That is a qualitative shortlist,
not a measured ranking. The case evidence now motivates **two separate
targets: visible angular shape and violet spectral balance**. The latter is
retained background, not the current aerosol test target, because the imported
properties do not cover 360 nm.

## Phase-function context to preserve

A phase function distributes scattered light over outgoing directions; it
must be nonnegative and integrate to one over solid angle. The algorithm
already uses angle. For direct sunlight the relevant cosine is the viewing
direction dotted with the direction toward the Sun. Multiple scattering uses
the local incoming/outgoing angle at each event, not just observer-Sun angle.

Evaluating the existing phase equation analytically repairs interpolation; it
does not replace that physical law. A richer normalized law changes the
modeled angular distribution and must propagate through affected orders.
Bruneton used a wavelength-independent Cornette-Shanks shape and fixed aerosol
single-scattering albedo/scale height. Its fitted optical parameters were not
independent measurements of the Kider atmosphere.

Bruneton attributes the shared near-Sun deficit to an inadequately represented
strong forward peak, including for libRadtran under the chosen inputs. More
integration samples cannot add a feature missing from the phase law. This
explanation motivated setting near-Sun work aside; it does not establish the
cause of the broader visible trough. See
[Bruneton, sections 3.4 and 14.5](https://arxiv.org/pdf/1612.04336) and
[Cornette and Shanks](https://doi.org/10.1364/AO.31.003152).

## Additional Kider information identified in the discussion

Distinguish information beyond Bruneton's selected evaluation from information
that was unavailable to Bruneton. The original Kider release already described
the following products. Listing a file is not validation of its contents.

| Product                    | Availability established so far                                                                                                                                                | Possible use and limits                                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Full 350-2500 nm spectra   | Original benchmark radiance files retained locally; [provenance](../../../../../scripts/experiments/b1-directional-sky-radiance/inputs/KIDER-PROVENANCE.md) records identities | Inspect spectral shape beyond the scored channels; nominal sampling is not independent instrument resolution, and infrared comparisons require appropriate absorption physics              |
| RAW photographic exposures | Original release links HDR archives; recent discussion did not decode them                                                                                                     | Check Sun position, orientation, clouds and obstructions; quantitative radiance needs lens/filter/exposure calibration                                                                     |
| RAP weather grids          | Release lists GRIB2 files; Kider describes hourly 13 km temperature/pressure/humidity grids plus visibility and albedo                                                         | Regional constraints on assumptions, not direct aerosol optical-property measurements; time/location/field coverage must be verified after decoding                                        |
| Ground-station records     | Release lists archives; paper describes SYNOP/METAR context                                                                                                                    | Independent weather/visibility clues; station distance, timestamps and relevant records remain unverified                                                                                  |
| Pyranometer records        | Listed by the release; irradiance already appears in Bruneton's comparison                                                                                                     | Could supply energy/time consistency checks; do not label irradiance itself a new constraint unavailable in the comparison, or conflate raw sensor records with our derived B2 integration |
| September capture set      | Listed alongside the May benchmark in the original repository                                                                                                                  | Potential different-day validation; not acquired or qualified for this follow-up. Do not conflate it with later expanded datasets                                                          |

Source owners: [Kider release](https://github.com/spectralskylight/sky-measurements-2014),
[Kider paper, section 4](https://www.yiningkarlli.com/projects/skydomecompare/Kider2014.pdf),
and the [retained local paper text](../../../../../references/downloads/kider-clear-sky-framework-2014/paper-author-version.extracted.txt).
The paper reports approximately three-minute scans, finite 1/8-degree optics
and roughly 0.5-degree motor error. The prior
[raw-data audit](remaining-factors-results.md#observation-audit) did not find
per-sample timestamps or the selected optic in the inspected spectral headers.
Do not assume those metadata are present or fabricate an aperture kernel.

No direct capture-specific aerosol phase, particle distribution or vertical
aerosol profile has been established. Dense solar-aureole measurements needed
for the discussed retrieval were also unavailable in Bruneton's comparison.
Photographs or weather records do not automatically fill that gap.

## Research leads retained from the discussion

### Regional data sources for the Kider capture

The primary matching target is Rhodes Hall, Cornell, approximately
42.443449 N, 76.481962 W, on 2013-05-27 at 09:30-13:30 EDT
(13:30-17:30 UTC under the existing capture convention). Match actual
observation times, quality flags and spatial footprint, not just the date.
The following catalog leads were checked after discussing constant g. Regional
AERONET values have now been acquired and tested; no co-located atmospheric
state has been qualified.

- **AERONET:** the [Version 3 inversion service](https://aeronet.gsfc.nasa.gov/print_web_data_help_v3_inv.html)
  provides asymmetry (ASY), full phase functions (PFN), single-scattering
  albedo (SSA), optical depth and particle-size retrievals. This is the most
  directly relevant lead for wavelength-dependent phase properties. Bruneton
  reported the nearest corresponding station near Toronto; do not assume it
  represents Ithaca. Accepted 00234 retains the same-day Toronto phase, SSA,
  asymmetry and quality responses; 00235 tests the coherent 13:19:01 UTC
  retrieval. SSA is exploratory Level 1.5; corresponding Level 2 SSA values
  are missing. The [sensitivity results](aerosol-sensitivity-results.md#regional-aerosol-input-and-limitations)
  own quality flags, normalization and wavelength-extension limits. Column
  retrievals do not supply vertical profiles.
- **MODIS MAIAC MCD19A2 Collection 6.1:** [NASA product catalog](https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/MCD19A2)
  describes daily global 1 km aerosol optical-depth products; the mission
  record spans 2013. This can constrain aerosol loading near Ithaca if a
  quality-screened overpass is available. It is not a direct measurement of
  g; do not treat model-dependent spectral bands as independent phase data.
- **MERRA-2:** [NASA hourly aerosol diagnostics](https://data.nasa.gov/dataset/merra-2-tavg1-2d-aer-nx-2d1-hourlytime-averagedsingle-levelassimilationaerosol-diagnostics-b1b07)
  span 1980 onward on a 0.5-degree latitude by 0.625-degree longitude grid.
  They provide date/location-matched regional reanalysis context rather than
  independent local aerosol truth. Optical assumptions used in the reanalysis
  must remain visible when using its composition or derived properties.
- **NOAA RAP and station weather:** [RAP archive](https://www.ncei.noaa.gov/products/weather-climate-models/rapid-refresh-update)
  covers May 2013, complementing the files already listed by Kider.
  [Global Hourly station data](https://www.ncei.noaa.gov/products/land-based-station/integrated-surface-database)
  provide temperature, dew point, pressure, visibility, clouds and winds where
  reported. These can constrain weather context; local station coverage and
  usable records have not been verified in this follow-up.

The unresolved data question is whether these products agree on the regional
air mass and aerosol loading at the capture time. Borrowing the Toronto
retrieval established sensitivity, not local representativeness. AERONET's
asymmetry is a mean scattering cosine; the current
Cornette-Shanks g is a shape parameter. Do not copy one into the other without
matching conventions or comparing the normalized phase functions themselves.

### Background literature

These are background sources for a later targeted investigation, not evidence
that their mechanisms explain this capture or that a retrieval has been run:

- [Dubovik and King: aerosol inversion](https://doi.org/10.1029/2000JD900282)
  for the distinction between fitting sky radiance and constraining aerosol
  properties using complementary observations.
- [Torres et al.: retrieval sensitivities](https://acp.copernicus.org/articles/14/847/2014/)
  for geometry, surface and atmospheric-profile ambiguities.
- [AERONET Version 3 retrieval work](https://amt.copernicus.org/articles/13/3375/2020/)
  for uncertainty and validation context.
- [Humidity-dependent aerosol scattering study](https://acp.copernicus.org/articles/20/10231/2020/)
  as background for the humidity hypothesis; local humidity alone does not
  specify aerosol optical properties.
- [Bruneton's documented scattering implementation](https://ebruneton.github.io/precomputed_atmospheric_scattering/atmosphere/functions.glsl.html)
  for how Sun/view angle and normalized phase evaluation already enter a
  conventional scattering calculation.

## Constraints on the next decision

1. Read the aerosol sensitivity results and case evaluation before selecting a
   test. The next unresolved distinction is overall phase directionality/SSA
   level versus added angular/spectral shape; no new sweep is authorized by
   this guide. Preserve the earlier exceptions:
   corrected source refinement helps the aggregate proxy; phase/transmission
   and ground-boundary cancellation can be demonstrated without Kider.
2. Seek independent geometry/weather/spectral context where usable. Remaining
   uncertainty is not permission for an unbounded parameter search.
3. State the expected angular/spectral/elevation response before changing a
   physical input. Label unsupported parameter variations as sensitivities.
4. If testing the cancellation hypothesis directly, compare original/corrected
   numerical evaluation against original/alternative physical inputs. Recompute
   affected higher orders. Check whether the numerical-correction score penalty
   shrinks and whether the result transfers to the retained control rays.
5. Preserve original full-benchmark scores, signed residuals and numerical
   checks. A lower aggregate RMSE is insufficient evidence of physical cause.
   Keep changed-atmosphere scores clearly separate from the original benchmark.

No execution matrix or new resource allocation is selected by this guide.
The current [factor-isolation framework](kider-factor-isolation.md) provides
additional comparison design; the saved production checkbox owns that separate
follow-up. Historical runs remain immutable.
