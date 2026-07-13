# Extraterrestrial Unresolved Research

Status: current decision and evidence gaps. Closed experimental chronology is
not reproduced here.

These gaps constrain a release, publication claim, or later source class. The
production sequencing policy still permits visible CPU/GPU integration to
advance with explicitly bounded fixtures before citation and full-test
hardening is complete.

## Required For First Release Claims

| Gap | Recommendation | Owner or evidence route |
| --- | --- | --- |
| E4--E7 are standalone generic runners but are not official, referenceable experiments. | Repair E4's `F_lambda` terminology and units to spectral irradiance density. Make E4--E7 report the full stable ID, exact command/input identity, result hashes, and claim limits; make E6/E7 units and weight semantics explicit. Promote them only after the publication checklist and canonical registration are complete. | [`/references/experiments.md`](../../../references/experiments.md) and the Algorithm32 experiment promotion checklist |
| The typed point-source boundary is not officially established. | Use a repaired/promoted E4 for the generic `L = F p / Omega` identity, then run `EXPERIMENT-A32-XA-001` for kind/quantity/unit rejection, exact perspective solid angle, exact-direction visibility/transmittance, off-frame conservation, additivity, and no second transmittance. | Canonical experiment register |
| Coupled extended transport and composition are not officially established. | Use repaired/promoted E5--E7 for their analytic identities, then run `EXPERIMENT-A32-XA-002` for exact-pixel averaging, per-direction visibility/transmittance, disk conservation, and detection of center-direction, second-coverage, and second-transmittance routes. | Canonical experiment register |
| `EXPERIMENT-A32-XA-003` is planned but its protocol is not research-complete. | Make its Sun and Sirius conclusions independently classifiable, or split the deferred Moon branch before execution, so unresolved lunar inputs cannot block solar or stellar calibration. Predeclare source-to-bin operators, external oracles, uncertainty propagation, tolerances, and outcome classification for the immediate CALSPEC/TSIS/Rieke work. Lunar LIME/Air-LUSI/ROLO research belongs to the [resolved-Moon follow-up](moon-follow-up.md). | Canonical experiment register, bibliography, and [fact accounting](fact-accounting.md) |
| The immediate Sun/Sirius payloads are not manifest-admitted or cleared for redistribution. | Complete authenticity, exact-consumer, transformation, and license review for the selected CALSPEC, TSIS, and Rieke payloads before publication or redistribution. Retained bytes may remain bounded research inputs; they are not citable evidence by mere presence. Lunar payload review is deferred with the Moon. | `/references/downloads/manifest.json` and canonical bibliography |
| The selected first cache family has not yet qualified its numerical or GPU representation. | Qualify `spherical-sun-stars-radial-v1` using a bounded star-field member table and one distant uniform Sun-disk layer, separate point/extended `(u, h)` fields, explicit geometry-owned interpolation, and the initial four-RGBA-layer-per-member-or-extended-layer target. Predeclare node, capacity, error, resource, build-time, and frame-time budgets; accept or reject the representation from measured CPU/GPU/browser evidence rather than inheriting the rolled-back implementation. | [Cache design](celestial-contribution-cache-design.md) and [implementation plan](promotion-plan.md) |

Official experiment conversion is publication work, not permission to import
the former implementation. The standalone experiment definitions may use
external sources and analytic boundary inputs, but not Algorithm32, `flat32`,
or another repository.

The ER6/ER8 San Jose and Union Glacier cases are subjective rendering
fixtures, not unresolved scientific research. Their observer states,
directions, residuals, resolution sequence, and images require no official
experiment or citation promotion and cannot close an ephemeris, geometry,
convergence, or implementation-evidence gap. Any future claim in one of those
areas requires a newly defined objective case domain.

## Object-Specific Gaps

- **Sun:** XA3 must independently establish the selected packet's bounded-band
  comparison before it is called calibrated. Decide whether the first release
  needs wavelength-dependent limb darkening or whether the normalized uniform
  disk remains sufficient. Aesthetic disk refinement is governed by the
  [Sun-disk appearance design](sun-disk-appearance-design.md) and does not lower
  the evidence standard for an atmospheric or calibration claim.
- **Moon:** the real state provider, celestial frame, epoch/time contract, and
  radius/shape convention remain unselected; geometry owns the observer/body
  transform once those facts exist. The entire Moon is deferred, including
  observer-relative orientation, body-fixed texture coordinates, spectral
  albedo/BRDF, live Sun illumination and terminator, surface depth/opacity,
  Moon-over-star visibility, atmosphere/cache factorization, Earthshine,
  eclipse behavior, opposition behavior, and objective ephemeris, geometry,
  and radiometry evidence. The owning design note is the
  [resolved-Moon follow-up](moon-follow-up.md).
- **Sirius:** XA3 must establish CALSPEC quality selection, source-unit
  conversion, bin reduction, and uncertainty without magnitude rescaling.
- **Catalog stars:** select catalog authority, passband response, zero point,
  SED reconstruction, uncertainty propagation, and direction/epoch transforms
  beyond the first Sirius fixture.
- **Diffuse fields and planets:** no selected calibrated source data or
  conservative production representation exists.
- **Observer visibility and Color:** prerequisite `2B-R` is researched in the
  [Stage 2B Normal reference record](normal-color-stage2b-reference-research.md).
  CIE 1931 2-degree, CIECAM16's primary role, the Hellwig/ACES comparison roles,
  the 100-nit destination, numerical gates, held-out split, and later review
  protocol are selected. The gate remains open because no universal standard
  supplies the source adapting field required to normalize absolute sky/Sun
  `cd/m2`. Qualify the bounded view-conditioned measurement `2B-M`; the sparse
  32-ray hemisphere and an inherited scene scale are not substitutes.

## Implementation Decisions To Make Locally

The canonical split between architecture decisions already fixed and choices
that cannot be inferred is the
[production algorithm placement and owner map](celestial-contribution-cache-design.md#production-algorithm-placement-and-owner-map).
Stage 12.0 owns closing that section's numbered open questions and replacing
the exploratory camera-space type surface. This research register does not
maintain a second engineering-decision list.

Every lunar geometry/radiometry/rendering path, flat geometry, profiled disks,
all celestial mutual ordering, and catalog-scale point capacity remain
separate family-design decisions. They are not gaps to fill by silently
generalizing `spherical-sun-stars-radial-v1`.

## Explicitly Closed Questions

The following are not open tuning options: source-specific exposure, fixed or
viewport-wide pixel solid angle, authored star disks as physical footprints,
solar-spectrum scaling by visual magnitude, scalar coverage reused as opacity
and energy, destination-pixel transmittance after point spreading, or neutral
Moon albedo `0.12` as real lunar calibration.
