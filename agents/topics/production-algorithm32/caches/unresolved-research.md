# Flat/Local Cache Promotion Work

Focus: Cache construction, storage, reconstruction, loading, and optimization.

Related owners: [physics-numerics](../../pure-research/physics-numerics/unresolved-research.md), [engineering-studies](../../poc-experiments/engineering-studies/unresolved-research.md).

## Selected Position Domain

The selected domain is
`profile-z19-rho15-add-50km-4p5mm`. It uses clamped bilinear interpolation
over 285 positions. Production stores exact fractions and scales them by the
configured atmosphere top and cache radial maximum:

```text
z fractions:
0, 1/400, 1/200, 1/100, 3/200, 3/100, 1/20, 7/100, 1/10,
7/50, 1/5, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8, 99/100, 1

rho fractions:
0, 1/96, 1/48, 1/24, 1/12, 1/8, 1/4, 3/8, 1/2, 5/8,
3/4, 7/8, 15/16, 47/48, 1
```

For the qualified 100,000 m by 4,800,000 m diagnostic configuration these
produce:

```text
z meters:
0, 250, 500, 1000, 1500, 3000, 5000, 7000, 10000, 14000,
20000, 25000, 37500, 50000, 62500, 75000, 87500, 99000, 100000

rho meters:
0, 50000, 100000, 200000, 400000, 600000, 1200000, 1800000,
2400000, 3000000, 3600000, 4200000, 4500000, 4700000, 4800000
```

The v4 report selected this profile under the unchanged spatial limits of
`0.1` maximum normalized L-infinity and `0.02` maximum p95 normalized RMS.
The winning maxima are `0.00502984504201558` and
`0.001092614831589967`. Every compared `J1`, `J2`, `J3`, `J4`, and
`Jthrough4` field passes and contains no negative or non-finite scalar.

Its logical resident cumulative field is `74,795,400` bytes against the
`83,886,080`-byte ceiling. V4 estimated a `403,628,992`-byte peak tracked
upper bound. V5 measures `389,675,392` logical peak-tracked bytes against the
`469,762,048`-byte ceiling. These are owner-reported logical resource facts;
renderer/driver overhead and supported-hardware timing are not qualified.

The selected fractions make other configured bounds executable but do not
extend the convergence claim beyond the measured 100 km/4.8 Mm case.
The observer dome remains final-view-only and does not truncate reusable cache
construction.


## Post-Promotion Verification

V5 contains only the already-selected 19-by-15 candidate and does not reopen
selection. It reproduces the v4 spatial maxima exactly, records current
production source hashes, realizes the expected physical node arrays through
the default production path, and decides
`retain-current-production-selection` with no production change required.

Actual selected-domain production facts are:

| Fact                            |                   Value |
| ------------------------------- | ----------------------: |
| positions                       |                     285 |
| outgoing directions             |             4,374 (W27) |
| packed transport queries        |                   9,690 |
| maximum taps per query          | 236 of the declared 256 |
| transport bytes                 |             164,652,480 |
| total packed-data bytes         |             164,707,792 |
| resident cumulative-field bytes |              74,795,400 |
| peak field bytes                |             224,967,600 |
| peak tracked logical bytes      |             389,675,392 |

Default-domain realization, spatial comparison, tap bound, resident limit,
and peak-tracked limit all pass. The qualification boundary still excludes
driver allocation, supported-hardware timing, and release performance.


## Selected Local-Sun Behavior

- The implementation retains the existing configured point Sun and its typed spectral irradiance at
  a reference distance, physical position, inverse-square falloff, radius
  near-source clamp, deterministic center behavior, and finite source-path
  bound.
- Its primary `J1` remains independent of later-order recurrence, and every
  Star-produced primitive/primary output is compared against the sealed gold.
- The first required source owns one concrete cache. Generalized multiple local
  sources and normalized/incremental cache reuse remain future capabilities,
  not Stage 9 decisions.
- Source-dependent changes trigger a full atomic rebuild. Incremental reuse
  requires separate future evidence.
- Atmospheric illumination and renderer endpoint lighting remain distinct
  consumers of the same configured source facts.


## Numerical And Runtime Evidence

- The selected R32F policy preserves the existing per-quantity
  absolute-plus-relative bounds and names the v4 report by path and hash.
- The bounded Karma/WebGL lane passes W3/N4 field probes and cumulative runtime
  lookup plus production-W27/N1 public ShaderBuilder transport for three rays
  and 90 spectral scalars.
- The lane does not contain W3/N4 numerical complete rays or a selected-domain
  W27/N4 numerical run. A bounded W27/N4 attempt exceeded `904.064` seconds
  against the 120-second bounded-build criterion and was reverted. No frozen
  gate requires that matrix cell, so it remains hardening rather than a reason
  to overstate existing evidence.
- Lifecycle checks cover reuse, invalidation, supersession,
  failure/cancellation preservation, and disposal.
- Supported-hardware selected-domain allocation, cold/rebuild time, staging
  responsiveness, and runtime cost remain Stage 15 qualification work. The
  bounded Chromium lane is conformance evidence, not that qualification.


## Explicitly Rejected Defaults

The historical 512-direction Bruneton quadrature, phase-integrated `J2`
quantity, provisional five-by-eight outgoing grid, `z`/`rho` sampling nodes,
interpolation policy, ground-reflection omission, and source intensity policy
are not selected controls. The old Algorithm32-star name and harness are not
production architecture.
