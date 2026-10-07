# Five Rays For The Kider Mismatch

## Selection And Comparison

These five retained rays expose distinct discrepancies for interpreting the
[idealized model](idealized-model.md): a reference-backed morning excess,
a noon deficit and neighboring excess, a low-elevation spectral disagreement,
and a zenith comparison. Selection is descriptive, made after inspecting the
40 rays with retained correction evidence. It is not a ranking over the full
Kider hemisphere, an unbiased benchmark subset or independent validation data.

Use one consistent comparison: accepted 00224's jointly corrected density,
phase and sunlight-column first order, source count S160 and viewing level 16,
plus the unchanged original H orders two through four. This is a diagnostic
combination, not the exact idealized solution or a fully corrected solver.
The original fitted solar geometry and measurements remain fixed. The owner's
[adoption hold](status.md#owner-decision-preserve-conclusions-defer-adoption)
remains in force.

Residual means **model minus Kider**. Positive is too bright; negative is too
dim. Radiances and residuals below are spectral mW m^-2 sr^-1 nm^-1. Times
are the original local EDT capture labels; grid coordinates are zero-based
benchmark indices. Solar separation uses the existing fitted Sun direction,
whose independent calibration remains unresolved.

## Exact Rays

| Label | Probe identity | Time  | Grid (x,y) | Elevation | Separation from fitted Sun | Purpose                                                          |
| ----- | -------------- | ----- | ---------- | --------: | -------------------------: | ---------------------------------------------------------------- |
| A     | p-0930-5-7     | 09:30 | (5,7)      | 33.75 deg |                  14.73 deg | Morning excess with independent first- and second-order evidence |
| B     | p-1230-3-5     | 12:30 | (3,5)      | 71.92 deg |                   5.11 deg | Large near-Sun deficit                                           |
| C     | p-1230-3-4     | 12:30 | (3,4)      | 71.92 deg |                  12.82 deg | Neighboring same-elevation excess                                |
| D     | p-1230-0-4     | 12:30 | (0,4)      | 12.12 deg |                  60.48 deg | Low-elevation residual that changes sign with wavelength         |
| E     | p-1230-4-4     | 12:30 | (4,4)      | 90.00 deg |                  22.16 deg | Zenith comparison, with much smaller 454 nm mismatch             |

## Retained Spectral Residuals

| Ray | 360 nm, channel 0 | 454 nm, channel 8 | 642 nm, channel 24 | 712.5 nm, channel 30 |
| --- | ----------------: | ----------------: | -----------------: | -------------------: |
| A   |            +26.01 |            +31.08 |             +30.02 |               +19.58 |
| B   |            -56.59 |           -189.25 |            -136.94 |              -121.69 |
| C   |            +17.98 |            +17.01 |             +17.04 |               +11.10 |
| D   |            +13.83 |            -25.53 |             -38.65 |               -40.74 |
| E   |             +6.28 |             -3.05 |              +5.31 |                +3.71 |

The corresponding 454 nm absolute comparison is:

| Ray |  Kider | Diagnostic model | Relative residual |
| --- | -----: | ---------------: | ----------------: |
| A   | 185.53 |           216.62 |           +16.75% |
| B   | 400.73 |           211.48 |           -47.23% |
| C   | 139.00 |           156.02 |           +12.24% |
| D   | 144.04 |           118.51 |           -17.73% |
| E   |  99.54 |            96.49 |            -3.06% |

## Why These Five

**Start with B and C together.** They share capture time and viewing elevation,
but the model undershoots B and overshoots C. At 454 nm, measured radiance
changes from 400.73 to 139.00 between them, while modeled radiance changes from
211.48 to 156.02. Their angular contrast is not reproduced. A common positive
brightness scale cannot match both. This observation does not identify whether
registration, scattering angular distribution, measurement response or another
effect causes the contrast discrepancy.

**A supplies an independent physical constraint.** The retained first-plus-second
order lower bounds already exceed Kider by 10.95 at 360 nm and 21.70 at 454 nm,
after their retained reference allowances. Later nonnegative scattering orders
cannot remove that excess under the same physical inputs and geometry. This
is stronger evidence than an excessive finite-order approximate total alone.
No equally strong complete-solver accuracy claim is implied for the other rays.

**D prevents a near-Sun explanation from standing in for the entire mismatch.**
At this low-elevation direction, far from the fitted Sun, the model is too
bright at 360 nm and too dim at the other three wavelengths. C and D also share
the same native benchmark azimuth, with different elevations. Their comparison
helps keep angular, path-length and spectral behavior distinct without assigning
the cause in advance.

**E is a comparison ray, not a claim of correctness.** The 454 nm mismatch is
only -3.06%, versus B's -47.23% at the same time. Its residual still changes
sign across wavelengths. Preserve it to detect whether an explanation for the
large errors would spoil better agreement elsewhere.

The important signs are not created by the recent corrections. For the
original raw S80 first-order evaluation with the same fixed higher light,
454 nm residuals for A/B/C/D/E are +48.15/-170.93/+30.71/-23.56/+3.74.
A/B/C/D already show the same signs; E crosses zero after correction. D's
360-positive/red-negative pattern is also present before correction. Thus
the set displays both persistent mismatches and a smaller result sensitive to
the numerical correction.

## Evidence And Reproduction

No new atmospheric integration, GPU attempt or evidence run was performed.
This report selects and summarizes existing accepted rows; historical records
remain immutable. All displayed numbers are rounded only for presentation.

Read [00224 assessment](../../../../../tmp/experiments/sky-accuracy-dials/runs/00224-targeted-gpu/assessment.json.gz),
gunzip and parse its JSON. For each listed probe and channel, select exactly
`mode=7`, `sourceCount=160`. Compute model as `first16W + higherW`, residual as
`residualW`, and relative residual as `100 * residualW / measuredW`. Multiply
W-valued radiances by 1000 for the table units. The raw comparison selects
`mode=0`, `sourceCount=80`. Both use viewing level 16.

Read [00225 accounting](../../../../../tmp/experiments/sky-accuracy-dials/runs/00225-remain-account/accounting.json.gz)
at matching probe/channel and `candidate="H"` for the preserved independent
`physicalLowerBound`. Geometry comes from
[00110 reference rows](../../../../../tmp/experiments/sky-accuracy-dials/runs/00110-c1-j1-assess/rows.json):
`gridX`, `gridY`, `elevationDegrees`, `sunSeparationDegrees`. The exact native
viewing direction is reproducible from those grid indices using
[getSampleDirection](../../../../../scripts/experiments/b1-directional-sky-radiance/benchmark-domain.js:60)
and the original benchmark coordinate convention.

Consumed artifact identities, SHA-256:

- 00224 `assessment.json.gz`, 301,069 bytes:
  `61529f6d7726f13fd4547f260522bc5baf6a78f4789a43dde884afe9a65243e9`.
- 00225 `accounting.json.gz`, 80,123 bytes:
  `ddb45b7c60803f0a33fbe8212e4219ae34aea405f7de1967ae6f1207809db125`.
- 00110 `rows.json`, 226,651 bytes:
  `487b4540b481e0f41a2726524d9eae03c8d7688a468d829ccb9968936bc4c581`.

Extraction used local Node v25.4.0 JSON parsing, gzip decompression and arithmetic;
no fitted parameter, measurement value or implementation setting was changed.
This selection is an inspection set for the mathematical discussion, not a
new sensitivity matrix or an allocation to execute one.
