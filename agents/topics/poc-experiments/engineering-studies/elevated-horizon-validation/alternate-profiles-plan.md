# Published Alternate Atmosphere Profiles Plan

State: execution authorized through independent-execution on 2026-10-23. Record
download failures and move to the next source/candidate as the owner requested.
The owner also requires the 5 m horizon in the initial screen. This is an exploratory follow-on within Elevated Horizon
Validation. The [completed baseline plan](plan.md) and its [results](results.md)
retain their original scope, criteria and conclusions.

## Outcome and boundaries

Find and try externally defined clear-air aerosol profiles, preferably with lower
aerosol optical loading than production, without inventing a profile or tuning
one to produce a desired image. Establish their effect on the 10 km horizon and
whether promising candidates retain useful solar-neighborhood scattering at low
elevation. A sharper horizon is a hypothesis, not a required physical outcome.

Completion means authenticated downloadable inputs, an explicit physical-property
inventory, matched libRadtran comparisons for usable candidates, reviewable
appearance evidence and a recommendation with implementation limitations. A
well-supported finding that the published alternatives do not improve the
horizon is a valid result. Full app scenes are conditional on a faithful local
implementation; solver strips remain useful if current production cannot
represent a published profile.

Execution of this plan is authorized; production promotion is not. Continue to
use the existing experiment source/output roots and immutable-run contract in
[design](design.md). Downloaded archives, extracted data, copies, solver decks,
caches and renders belong in new runs below
`tmp/experiments/elevated-horizon-validation/`. Authored adapters stay below
`experiments/elevated-horizon-validation/`. Production, installed shared solver
data, other experiments and all prior runs remain read-only. No default-profile
change, production promotion, solver installation/native compilation, email or
account creation is part of this plan.

## Baseline, sources and hypotheses

Reuse authenticated baseline runs 00003/00010 (MYSTIC), 00008 (GPU/app),
00018 (loading controls), 00019 (final analysis) and 00020/00021 (verification).
The completed execution checkpoint is `9bfb1a3c`; pin exact source/package/input
identities at execution rather than assume that current HEAD is unchanged.
The baseline has black-ground feedback, current Bruneton molecular/aerosol
physics, native-15 bin semantics and the production display transform. Its
10 km noon limb brightness matches MYSTIC within 1.3%, while molecular-only
transport still leaves haze. This constrains expectations; reducing aerosols
does not guarantee a crisp horizon.

Download sources, verified during planning:

- [OPAC 4.0 original software/data, Zenodo DOI 10.5281/zenodo.7275005](https://doi.org/10.5281/zenodo.7275005):
  `opac_40b.zip`, approximately 1 MB. Use its data, not a newly compiled executable.
- [Official libRadtran distribution/additional optical-property data](https://www.libradtran.org/doku.php?id=download):
  OPAC NetCDF library, currently linked as `optprop_v2.1.tar.gz`; older data are
  linked separately. Discover the actual URL/size/version before transfer and
  inspect compatibility with the installed 2.0.1-MYSTIC reader.
- [OPAC publication](https://lweb.cfa.harvard.edu/HITRAN/HITRAN2012/Aerosols/papers/hess_opac_1998.pdf):
  compositions, humidity classes, optical properties and vertical prescriptions.
  Check package-version differences rather than attach 1998 values to different data.
- [Current libRadtran manual](https://www.libradtran.org/doc/libRadtran.pdf):
  named mixtures and library formats. This manual is for 2.0.6, so qualify options
  against the actual installed 2.0.1 implementation and retained documentation.
- Conditional measured route: [NASA ACTIVATE dataset paper and data links](https://essd.copernicus.org/articles/15/3419/2023/),
  [HSRL-2 product documentation](https://asdc.larc.nasa.gov/project/ACTIVATE/pdocuments).
  Measurements provide extinction/backscatter and companion aerosol/meteorology
  information, not automatically a complete full-spectrum phase/SSA profile.

Initial candidates, using the published mixtures and their vertical prescriptions:

1. OPAC continental clean: relevant remote continental reference.
2. OPAC maritime tropical: published lower-loading marine candidate.
3. OPAC maritime clean: contrasting marine composition and near-ground loading;
   its name does not establish a lower optical column.

Use documented 50% RH as the common initial optical-property setting and 80% RH
as a conditional humidity sensitivity for promising or diagnostically distinct
cases, provided both are actually supplied for each component.
These are published model scenarios, not measured San Jose humidity profiles.
Retain non-hygroscopic components as specified. Do not choose RH after seeing
the colors, silently extrapolate a missing class, or multiply aerosol amounts.
Use the source-prescribed vertical distribution, including background layers;
list any humidity-with-height assumption explicitly.

Hypotheses:

- H1: a published lower-loading profile increases finite-ground transmission and
  cross-limb contrast at 10 km. Lower aerosol amount and changed phase/absorption
  are separate descriptors; a complete-mixture comparison does not isolate one.
- H2: source-defined vertical placement changes tangent-path loading enough to
  matter even when total column optical depth is similar.
- H3: a nonzero clean profile can retain stronger low-altitude near-Sun radiance
  than the molecular-only control. Quantify it; do not infer it from a 10 km ray.

For H2, integrated extinction along the actual paths tests loading directly.
Different mixtures also change phase, absorption and spectral behavior; similar
AOD alone does not isolate vertical placement as the cause of a radiance change.
Attribute that change to vertical placement only with a source-defined comparison
holding those other properties fixed; otherwise describe the mechanism as suggestive.

Keep molecular coefficients, source spectrum, Earth geometry, surface, view
quadrature and display fixed initially so the comparison isolates the aerosol
model as a whole. This is a published aerosol model on a shared molecular
background, not a fully measured atmosphere. A source-defined thermodynamic/gas
profile is a separately labelled, conditional comparison with every changed
quantity recorded; never silently introduce ozone or other gases.

## M1 - Download and qualify usable published profiles

Purpose: establish what is actually available and whether it meets the owner's
lower-aerosol requirement before spending on radiance or cache builds.

- [ ] Authenticate baseline inputs and inspect existing OPAC files read-only.
      Reuse exact available data by copying into a new run with parent hashes.
      Download missing original data and the smallest compatible optical library
      from the official links. Preserve archive, resolved URL, retrieval date,
      version, available publisher checksum, local SHA-256, citations and usage terms.
- [ ] Inspect archive members before extraction; reject path escapes, links and
      junctions. Keep extraction and any necessary data-format conversion in this
      lane. Do not alter the installed solver/data or run downloaded programs.
- [ ] Reconcile original compositions, vertical/background layers, humidity
      classes and NetCDF files. Confirm full phase representation, extinction,
      scattering/absorption, SSA, units and wavelength coverage. A parser/export
      adapter may use existing JS/Python runtimes; record transformations and
      quantify interpolation error. Do not substitute a fitted HG/CS lobe or a
      single fitted exponential and call it the original OPAC profile.
- [ ] Publish a native table/CSV with AOD at 550 nm, absorption optical depth,
      surface extinction, extinction at selected heights, aerosol column above
      the observer and integrated aerosol optical depth on the registered ground
      and sky paths. Include molecular contributions separately. Verify published
      reference values under the same humidity/layer conventions.
- [ ] Run one cheap compatibility/geometry pilot with the existing fully spherical
      MYSTIC configuration and sensor altitude explicit. Verify resolved optical
      inputs, layer transitions and phase normalization, not just process success.

Deliverable: `alternate-profiles-results.md` M1 section, source manifest,
property inventory and usable/incompatible/unavailable dispositions. No image is
needed for this inventory. First executable step is baseline/data inventory and
download manifest creation; no owner choice of arbitrary aerosol parameters.

Gate: unsupported or invalid data reject that adapter/candidate until repaired,
not the physical model. A candidate with neither a lower aerosol column nor a
lower relevant path loading is retained as a composition control, not advertised
as a lower-aerosol replacement. If standard cases provide no material loading
reduction, investigate the measured route or another documented clean scenario;
do not lower their density by hand. Similar AOD with a distinct vertical profile
can still earn a small H2 test. No arbitrary size/time allowance blocks downloads;
measure their actual costs and avoid unnecessary cloud libraries where possible.

Estimate: 20-40 minutes if compatible optical files are available; transfer and
format problems may extend this. Original OPAC archive is small; NetCDF library
transfer/extraction size is not yet measured. Update the forecast after the pilot.

## M2 - Screen horizon appearance independently

Purpose: find whether externally defined profiles materially change the observed
effect, using libRadtran before implementing new caches.

- [ ] Reuse or verify the existing 10 km, San Jose noon, anti-solar six-ray set,
      and run the same horizon-relative offsets at the owner-requested 5 m height:
      horizon offsets -1, -.1, -.02, +.02, +.1, +1 degrees; horizon is approximately
      -3.210885 degrees at 10 km. Recompute the 5 m limb from the same radius.
      Retain exact sphere hit/miss and finite endpoints; do not
      interpret local horizontal as the elevated limb. Hold black ground fixed.
- [ ] Compare baseline and the three usable published mixtures at 50% RH, publish
      the initial strips, then prioritize documented 80% RH sensitivities for
      promising or diagnostically distinct cases. A full six-case humidity sweep
      runs only when the first results show it would resolve a live question.
      Use matched source/band integrals;
      optical tables with real spectral variation need adequate quadrature within
      each native bin, not a point sample relabelled as bin energy. For candidates,
      converge layer resolution at profile discontinuities and the strongest limb
      rays. Bound spectral/phase interpolation and band-quadrature errors as well.
- [ ] Begin with three independent replicate vectors for screening. Extend seeds,
      photons and affected convergence checks for possible finalists until paired
      contrast differences and radiance claims are resolved, or explicitly report
      them inconclusive. Use paired seeds only with justified covariance handling;
      do not assume that equal seed numbers guarantee noise cancellation.
- [ ] Report spectra, Y, finite-path transmission, signed Michelson contrast at
      the three offset pairs and total/path aerosol optical depth. Label direct
      optical-depth integrals separately from MYSTIC radiance outputs.
      Define C(delta)=(Y_above-Y_below)/(Y_above+Y_below), at delta=.02,.1,1
      degrees, and gain DeltaC=C_candidate-C_baseline, not change in absolute C.
      Use empirical Student 95% intervals across full-spectrum replicate vectors
      for differences, retaining covariance when justified. Negligible denominators
      are unresolved; record sign inversions separately from contrast improvement.
- [ ] As soon as qualified radiance exists, link common-exposure horizon color
      strips beside baseline and molecular-only control. Images show essential
      color and spatial transition, using registered samples without fabricated
      smoothing. Keep numeric tables and status selectable in Markdown/CSV.
      Use the existing CIE/display mapping and shared fixed adaptation; a separate
      adaptive-exposure comparison, if useful, must be labelled and never replace it.

Deliverable: M2 report, appearance strips, spectra/contrast data with uncertainty,
ranked candidate dispositions and updated cost forecast. Do not wait for all
sensitivities before showing the first useful comparison.

Gate: an initial meaningful contrast lead is DeltaC of at least .01 at delta=.1
degrees, with its 95% difference interval excluding zero. A smaller positive gain
with intervals excluding zero at both delta=.1 and delta=1 degrees, or a distinct
resolved color/vertical-loading effect, may earn a bounded follow-up. Record its
specific prediction before extending work. These are screening choices, not physical
validity gates. A resolved lack of useful contrast/color change skips that
candidate's expensive cache build. Loading reduction without contrast improvement
is valuable negative evidence. An under-resolved result earns targeted precision,
not an unsupported pass/fail. Freeze definitions before scoring; changed criteria
create an explicitly new comparison, preserving original results.

Estimate: initial inventory-to-strips approximately 40-80 minutes total if format
compatibility is straightforward. Measure pilot throughput before forecasting the
full scan; the previous 79 successful external cases used 7.13 minutes of tool
invocation time, excluding adapter development, analysis and GPU initialization.

## M3 - Check useful appearance beyond the selected limb

Purpose: prevent selecting a profile on one favorable ray while losing the
near-Sun brightness or producing an undesirable low-elevation/sunset sky.

- [ ] Advance at most two distinct promising candidates. Compare baseline,
      molecular-only control and those candidates at observer heights 500 m,
      2 km and 10 km, with geometric rays registered independently at each height.
      Start with 500 m noon near-Sun diffuse rays at 1, 3 and 10 degrees from the
      Sun plus high-sky and anti-solar limb controls. Place those rays on the
      Sun-zenith great circle toward zenith; record exact direction vectors and
      observer-local Sun direction. Use the shared parallel point-source spectrum
      and center-ray radiance (zero angular footprint) for solver metrics, with
      no direct disk contribution. Actual scene pixels have separately recorded
      finite footprints and are not equated silently with these point samples.
      Converge the forward-peak table/angular sampling or phase-moment truncation
      on the 1 degree ray: two refinements should change Y by less than 1%, or
      bound and report the residual. Phase normalization alone is insufficient.
- [ ] For surviving candidates add the existing San Jose sunset and ten-minutes-
      before-sunset times, pinned by exact source/ephemeris metadata. Use spherical
      transport and document whether the Sun is above the observer's local limb.
      Expand angular samples only when a remaining transition needs resolution.
- [ ] Publish fixed-exposure spectral/color comparisons and radiance ratios for
      every sampled control, including adverse changes. H3 is supported only by
      a resolved diffuse near-Sun increase over the molecular-only control; use
      uncertainty rather than a visually saturated swatch to claim preserved glow.
- [ ] Rank profile fidelity, loading, horizon contrast, near-Sun behavior and
      sunset color separately. Do not collapse scientific suitability and owner
      appearance preference into one fitted score or promise universal improvement.

Deliverable: M3 report with cross-case evidence and one or two candidates worth
scene rendering, or an explicit explanation why none advances. Publish actual
color strips when their appearance adds information; plots only where spectral
or angular shape is essential.

Gate: reject a candidate as a proposed replacement if its important controls
are physically unsupported or its intended benefit is absent. An appearance
tradeoff is reported, not silently treated as an invalid atmosphere. A valid
but unresolved candidate remains available for owner assessment. No automatic
production selection follows from the ranking.

Estimate: another 20-60 minutes of setup/analysis plus measured solver work;
update after M2. Near-Sun Monte Carlo precision is a dominant uncertainty.

## M4 - Render faithful candidates and recommend the next action

Purpose: translate the radiance result into inspectable scene appearance without
claiming that a simplified profile is the downloaded model.

- [ ] Audit whether existing production transport/cache interfaces can preserve
      the finalist's vertical layers, spectral absorption and full phase behavior.
      If feasible through an experiment-local configuration/adapter, build new
      isolated N4 caches with the existing corrected algorithm, outgoing grid and
      view/display policy held fixed. Authenticate exported physical quantities
      against the libRadtran input and compare selected rays before full scenes.
- [ ] If faithful representation requires production changes, report that concrete
      limitation. Do not modify production or silently fit profile parameters.
      Retain the qualified external strips as the physical evidence and specify
      the smallest separate integration work. A supported local controlled
      renderer is an alternative only when it preserves the same physical model
      and is labelled distinctly from the installed production app.
- [ ] For faithful candidates capture identical globe scenes at 10 km noon,
      500 m noon toward the Sun, and 500 m sunset. Match camera/FOV, ground,
      lighting, exposure and object state; distinguish controlled black-ground
      atmospheric validation from the approximate green RGB app ground/lighting.
      Confirm depth masks and component compositing if the new adapter changes them.
      Scene images are necessary to judge actual horizon and solar glow appearance.
- [ ] Measure adapter effort, cache build time, peak memory when available,
      retained bytes, cache size and render cost. Complexity is reported, not an
      automatic rejection criterion. Disable new browser HTTP caching where
      practical before capture to avoid duplicating the large package in profiles;
      preserve all already sealed evidence.
- [ ] Finish `alternate-profiles-results.md` with sources, exact assumptions,
      milestone decisions, candidate ranking, limitations, untriggered work and a
      concrete recommendation. Update status with the resumption point. Keep
      the earlier baseline report intact. Promotion/default changes remain separate.

Gate/estimate: no cache or scene is required from a rejected candidate or an
unfaithful representation. Cache time/storage are unknown until the compatibility
audit and one representative build; publish that estimate before the wider render
set. A successful libRadtran-only conclusion can complete the exploratory question
with the scene implementation limitation explicitly deferred.

## Adaptive alternatives, monitoring and verification

If OPAC does not offer a useful externally defined clean case, first check another
complete published clean scenario with its own physical recipe. If those lack
needed conditions, inspect ACTIVATE
for a quality-controlled, cloud-free low-AOD segment with HSRL extinction profiles,
companion thermodynamics and usable aerosol composition/SSA/size information.
Register selection by data quality, loading and coverage before looking at colors;
do not select only an attractive render. Account for retrieval uncertainty and
missing above-aircraft/near-surface coverage. A lidar extinction curve alone is
not a complete spectral phase/SSA profile. Prefer a complete published case or
published reconstruction recipe. Filling missing properties/coverage with unrelated
sourced assumptions produces a hybrid assembled model; it is not an unmodified
external profile and does not by itself meet the owner's request. Document the
missing inputs and return that acquisition branch as inconclusive instead of
running an invented replacement. A published reconstruction, if available, retains
its method, assumptions, uncertainty and external source identity explicitly.

Another published clean profile or a source-defined molecular atmosphere may
also follow a distinct lead. Before any branch, record supporting evidence,
mechanism, prediction, smallest comparison, missing inputs, cost forecast,
advance/reject/inconclusive criteria and controls to protect. Keep at most two
adaptive branches active. An unavailable download rejects that acquisition route,
not the profile; try an authoritative mirror/version with identities retained.
Do not reuse credentials from old chat or expose them in commands/evidence.

Each milestone ends with a concise report section: completed work/evidence,
observations versus inference, limitations/verification/cost, disposition and
next step. Send useful evidence links when available. Keep current state in
`status.md`, consequential chronology in the existing `execution-log.md`, and
run progress at least every 30 seconds for long operations. At each milestone
reassess information gained and remaining work; time estimates are monitoring
guidance, not arbitrary stop or budget-approval gates. Diagnose and retry only
affected work with new immutable runs. Preserve source identity, parent inputs,
transformation, executable/library versions and output hashes throughout.

Primary self-review, local type checking after code changes, physical input and
geometry proofs, statistical/convergence checks and immutable-evidence verification
remain required. No experiment unit-test framework or dedicated standards review
is introduced. Keep checkpoint-advisor monitoring active; local checkpoint
authority follows the execution skill/user instruction active at execution time.

## Plan critique

One read-only second-agent critique under create-plan was completed before handoff.
Scope: this plan and the minimum baseline/design context. Questions: whether
downloaded profiles stay faithful, lower-loading and visual claims are measurable,
comparisons isolate the intended changes, and conditional scenes/adaptive routes
avoid unnecessary or unsupported work. All five recommendations were incorporated,
with dispositions recorded in status, and the revised sequence was self-checked.
This is plan critique, not a standards audit.
No recurring or additional review is requested.
