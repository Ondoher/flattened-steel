# Measured Clean Horizon Profiles Results

Execution concluded at the M1 input-feasibility gate on 2026-10-24. The experiment
remains selected for owner review; it has not been closed or promoted.

ARM supplied the strongest new lead: several observed SGP days have an aerosol
column around one quarter of Bruneton's, and December surface measurements are
also very low. The acquired observations do not yet establish a complete ambient,
height-dependent spectral aerosol model. No measured-profile scene finalist was
qualified. This is a partial/inconclusive input result, not evidence that a clearer
near-ground horizon is physically impossible.

[Color opportunity controls](../../../../../tmp/experiments/clean-horizon-profiles/runs/00020-control-report/comparison.html)
and [spectra/replicates](../../../../../tmp/experiments/clean-horizon-profiles/runs/00020-control-report/analysis.json)
are available. They compare Bruneton with molecular-only transport; the 5 m page
also includes authenticated earlier continental-clean colors. They contain two
directional swatches per column, not full scenes or continuously resolved edges.

## M1 — Sources and qualification

| Acquired source | Useful evidence | Qualification limit / disposition |
| --- | --- | --- |
| Official ATom V2.2 guide, dictionary and CMR inventory | Current September 2026 revision and numerical-file inventory | Numerical profile download returned HTTP 401; Earthdata access unavailable |
| Public NASA mission archive, 2016-08-12 aerosol sample | Dry, reference-density size/optical measurements; 38,340 one-second records | Ammonium-sulfate-equivalent dry optics do not supply complete ambient composition, humidity response or phase; held |
| He et al. 2026 public ATom-derived dataset | 4,773 five-minute records and 70-bin distributions; 300 records below 500 m | Lowest record 164 m; no complete supplied ambient extinction/absorption/angular phase; held as a reconstruction input |
| ARM SGP + public AERONET | Three low-AOD days with same-day lidar, surface scattering/absorption and weather; conditional inversion phase/SSA | Strongest lead, with near-field, humidity, phase and upper-column gaps below |

The official guide is [ATom Aerosol Optical Properties V2](https://daac.ornl.gov/ATOM/guides/ATom_Aerosol_Optical_Properties_V2.html).
Public alternatives were obtained from the [NASA mission archive](https://espoarchive.nasa.gov/archive/browse/atom)
and [the published Zenodo data](https://doi.org/10.5281/zenodo.18815333).
Versioned source URLs, files and exact hashes are retained in runs 00000–00005.
Acquisition success is distinct from scientific acceptance of a full atmosphere.

### ARM findings

Screened 291 valid public Level 2 daily observations from ARM_SGP in 2023.
Selected three near-minimum days for cross-instrument qualification, before any
candidate rendering. These are SGP measurements, not measured San Jose atmospheres.
An idealized transplant would require an explicit height and surface convention.

| Day | Daily AOD at 550 nm, inferred from AOD500 and Ångström exponent | Surface dry extinction at 529 nm, density corrected, 1/km | Surface window UTC |
| --- | ---: | ---: | --- |
| 2023-12-05 | 0.01760 | 0.001514 | 19:31:54 ±5 min |
| 2023-01-05 | 0.01764 | 0.005656 | 16:46:45 ±5 min |
| 2023-02-27 | 0.01999 | 0.003600 | 16:56:17 ±5 min |

Bruneton's continuous formula gives AOD550 about 0.06453; its executed native bin
containing 550 nm gives 0.06328. The ARM daily columns are therefore substantially
lower. These column and surface quantities have different wavelengths and physical
conditioning; they are not a spectral reconstruction or a common-unit phase comparison.

Surface results use simultaneous QC=0 scattering and absorption with the 10 µm
impactor state, not mixed impactor cycles. The December window has five paired
valid samples: scattering 1.31885/Mm and absorption 0.30379/Mm at reference density.
The conversion is `(Bs+Ba) × (P/1013.25 hPa) × (273.15 K/T) / 1000`, using ambient
weather for number-density correction. It does **not** restore humidity growth:
the sample RH was about 23%, while ambient RH was about 41%. Source corrections,
QC counts, sample values and meteorology remain in
[paired surface cases](../../../../../tmp/experiments/clean-horizon-profiles/runs/00023-surface-paired/surface-cases.json).
The ARM [PSAP handbook](https://www.arm.gov/publications/tech_reports/handbooks/psap_handbook.pdf)
confirms the absorption reference convention of 0°C and 1 atm.

The lidar product measures **355 nm** optical properties. It must not be treated
as a 550 nm profile. Our initial screen retained heights above 150 m, following
the older lane's screening convention; this is not a demonstrated universal
instrument-validity boundary. A separate raw near-field audit retained the lower
bins without clipping or silently discarding them.

At 18:32 UTC on December 5, the retained 169–499 m mean extinction was approximately
0.00584/km at 355 nm, with mean supplied random uncertainty 0.00135/km and mean
supplied **maximum systematic** uncertainty 0.01388/km. The last quantity is not
a standard error or 95% interval. At the surface-optics window around 19:32 UTC,
the corresponding mean systematic uncertainty was larger, about 0.04439/km.
Individual low bins and retrieval choices are preserved in
[lidar qualification](../../../../../tmp/experiments/clean-horizon-profiles/runs/00010-arm-qualify/qualification.json).

Raw 18.75 m bins contain about 6/km extinction, whereas adjacent surface dry
measurements are around 0.0015/km at 529 nm; several retrieval-source fields also
switch to zero. The wavelength/RH difference alone does not establish the cause.
These bins cannot simply be used as a clean surface profile, and a zero retrieval
source is not an observed aerosol-free layer. See the
[near-field audit](../../../../../tmp/experiments/clean-horizon-profiles/runs/00021-nearfield-audit/nearfield.json).
The [ARM FEX handbook](https://www.arm.gov/publications/tech_reports/doe-sc-arm-tr-224.pdf)
documents overlap correction and associated systematic errors; full wide-field
optical overlap is around 800 m. Corrected retrievals below that height require
their calibration/uncertainty treatment rather than a raw-bin assumption.

The remaining model gaps are:

- Ambient humidity growth and its vertical variation. The archived wet-nephelometer
  stream ends before December 5; no measured growth curve was obtained for that day.
- A defensible near-field bridge between surface optical sampling and the corrected
  lidar profile. Signal existence and a narrow random interval do not resolve overlap bias.
- Spectral absorption and angular phase with height. Available AERONET phase/SSA
  are Level 1.5 low-AOD inversions at four wavelengths; surface g is inferred from
  backscatter and does not specify the solar aureole. They remain conditional inputs.
- Intermediate/upper-column aerosol completion. No missing upper column was set
  to zero and no low-level profile was renormalized to force the measured AOD.

January has weaker surface cleanliness and some negative/noisy low-level lidar
values. February's low column coexists with more low-level lidar extinction; low
AOD by itself does not identify the cleanest horizon. December is the preferred
source lead, not a qualified final profile. The retained older ARM 2023-08-22 data
have much higher AOD and were not reused as a clean atmosphere.

## M1 — Available clarity opportunity

The matched scalar, fully spherical MYSTIC controls use native15 bin-center
coefficients/source, all scattering orders, 256 layers, 100,000 photons per
wavelength, three fixed replicate vectors, the same noon Sun and black ground.
Rays lie ±0.1° around each observer's true spherical limb, anti-Sun. C is
`(Y_above − Y_below)/(Y_above + Y_below)`; intervals below are empirical paired
Student 95% half-widths across the three fixed pilot vectors.

| Height | Bruneton contrast | Molecular-only contrast | Paired gain |
| --- | ---: | ---: | ---: |
| 5 m | 0.8018 ± 0.0094 | 0.9544 ± 0.0068 | +0.1526 ± 0.0141 |
| 500 m | 0.0386 ± 0.0044 | 0.3675 ± 0.0105 | +0.3290 ± 0.0065 |

There is meaningful aerosol-reduction opportunity at both heights in these
controls. It does not establish an ARM-profile result or visual acceptance.
Molecular-only sky radiance also rises; improvement cannot be inferred from
brightness alone. The earlier continental-clean 5 m contrast was about 0.8965,
yet its appearance had not met the owner's goal. The new 5 m controls reproduce
the earlier baseline/molecular result closely, authenticating the opportunity.

The images share one fixed p2 display context. The current altitude-half model
uses the same display curve below 10 km, but the controls do not evaluate each
candidate's native exposure. Two infinitesimal sample rays do not determine edge
width, camera-pixel contrast or the green app ground's appearance. No five-vector
finalist confirmation, finite-pixel sharpness claim or cache construction occurred.

## Disposition and remaining work

M1 completed with **partial/inconclusive profile qualification**. Public ATom
alternatives and the owner-added ARM branch were investigated. The source-completeness
gate leaves candidate M2, M3 and M4 untriggered. No measured-profile full scenes,
Sun-glow comparison, faithful renderer adapter or production recommendation exists.
The source deficiencies limit claims; they are not new runtime restrictions or
proof that the atmospheres fail visually.

The strongest continuation is a December ARM constrained-reconstruction study:
resolve surface humidity growth and the near-field bridge first, then register
two observationally justified completions and conditional phase/spectral bounds
before rendering. Treat any unresolved bridge as an explicitly assumed model,
with a narrower claim than a measured 5 m atmosphere. Earthdata access would
unlock the official ATom ambient-optics file but would not itself supply its
unobserved surface layer. Broader dates/stations remain future source leads;
this bounded screen did not establish that ARM has no suitable complete case.

## Verification, recovery and cost

[Verification](../../../../../tmp/experiments/clean-horizon-profiles/runs/00025-verify/verification.json)
recomputed 2,330 artifact hashes over all 25 preceding terminal runs and passed
the local JavaScript/TypeScript check. Image dimensions and sampled colors were
checked; the primary agent visually inspected the 500 m pair. Existing historical
source runs stayed immutable. Dedicated experiment standards reviewers are disabled;
no standards-compliance verdict is claimed.

Five failed executions are preserved: the initial single-wavelength spline deck,
an incorrect AERONET station alias, two report readers expecting newer metadata,
and a verifier callback type error. Each was repaired in a new run; the successful
numerical payloads were reused. Download access failures are recorded within their
inventory runs. No credentials were persisted in source, progress or provenance.

The 24 native15 color cases took 120.5 seconds elapsed. Summed recorded run time
before final verification was about 595 seconds, including acquisition, the
single-channel pilot, analysis and recovery; some stages overlapped. It is neither
total wall time nor model reasoning time. Retained evidence was about 952 MiB
before final verification, dominated by downloaded archives/raw data and preserved
derivatives. Source/profile fidelity, not a disk/time cap, determined the gate.

[Execution log](execution-log.md) owns consequential decisions and recovery.
Local checkpoint scope and authorization are recorded there; Git owns its identifier. Production changes
already present when this task began belong to the separately verified twilight
promotion; this experiment did not modify production or older experiment evidence.
