# H55 Bruneton B1: Paper Baseline40 And Normalized60

The [H58 largest-libRadtran-disagreement comparison](worst-ray-orders-results.md)
separates disagreement with retained full-B1 libRadtran from newly matched
physical references at the largest-error rays. It does not alter these paper
scores or the promotion gate.

The follow-on [H57 selected-ray order comparison](paper-ray-orders-results.md) diagnoses concrete cancellation witnesses against matched independent and libRadtran references. It does not change the full B1 scores below.

The owner selected the full [paper comparison plan](paper-b1-plan.md), following
H53/H54's selected-ray and full-scene observations. Completed accepted run `00347-h55-paper-b1` retains all 40 wavelengths and the
requested interval scores and dome figures. Production remains unchanged.

## Result

Aggregate spectral RMSE rises from **11.62291402828908** to
**11.668482392019996 mW m^-2 sr^-1 nm^-1**: **+0.04556836373091677**, or
**+0.3920562745281232%**. The first three intervals improve; the other 14 regress.
The full-cache paper RMSE match-or-improve gate is **not met**. The small overall
change does not invalidate the earlier matched selected-ray improvements, but
those improvements do not qualify this joint candidate for production.

The dome patterns remain close, with small changes in existing underprediction
regions. Error is redistributed rather than removed across the full benchmark.
This paired test changes both transport integration and Mie normalization, so it
cannot assign the aggregate regression to either intervention separately.

All values below are spectral RMSE in mW m^-2 sr^-1 nm^-1; lower is better.
Change is normalized60 minus baseline40. The table rounds to four decimals;
the immutable TSV retains full precision.

| Time (EDT) | Paper baseline40 | Normalized60 | Change |
| --- | ---: | ---: | ---: |
| 09:30 | 12.2745 | 12.0978 | -0.1768 |
| 09:45 | 8.3296 | 8.1520 | -0.1777 |
| 10:00 | 8.1441 | 8.0595 | -0.0846 |
| 10:15 | 8.3685 | 8.3712 | +0.0027 |
| 10:30 | 8.5140 | 8.5828 | +0.0688 |
| 10:45 | 10.5964 | 10.7045 | +0.1081 |
| 11:00 | 12.7987 | 12.9159 | +0.1172 |
| 11:15 | 11.5857 | 11.6857 | +0.0999 |
| 11:30 | 8.4063 | 8.4423 | +0.0360 |
| 11:45 | 7.8570 | 7.8753 | +0.0183 |
| 12:00 | 9.1315 | 9.1448 | +0.0133 |
| 12:15 | 16.4397 | 16.4773 | +0.0376 |
| 12:30 | 19.7638 | 19.8185 | +0.0547 |
| 12:45 | 12.8313 | 12.9304 | +0.0991 |
| 13:00 | 10.8720 | 11.0058 | +0.1338 |
| 13:15 | 11.6940 | 11.8459 | +0.1519 |
| 13:30 | 12.6929 | 12.8570 | +0.1641 |
| **Aggregate** | **11.6229** | **11.6685** | **+0.0456** |

[Full-precision interval TSV](../../../../../tmp/experiments/sky-accuracy-dials/runs/00347-h55-paper-b1/interval-rmse.tsv) |
[Interval chart](../../../../../tmp/experiments/sky-accuracy-dials/runs/00347-h55-paper-b1/interval-rmse.png) |
[Complete score/selection record](../../../../../tmp/experiments/sky-accuracy-dials/runs/00347-h55-paper-b1/paper-scores.json).

## Dome Comparisons

[Focused comparison: published Bruneton, published libRadtran, baseline40,
normalized60](../../../../../tmp/experiments/sky-accuracy-dials/runs/00347-h55-paper-b1/dome-comparison.png)
([standalone SVG](../../../../../tmp/experiments/sky-accuracy-dials/runs/00347-h55-paper-b1/dome-comparison.svg)).

![Focused B1 dome comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00347-h55-paper-b1/dome-comparison.png)

[Complete Figure5 model comparison plus normalized60](../../../../../tmp/experiments/sky-accuracy-dials/runs/00347-h55-paper-b1/domes.png)
([standalone SVG](../../../../../tmp/experiments/sky-accuracy-dials/runs/00347-h55-paper-b1/domes.svg)). The three rows are 10:15, 11:15 and 13:15,
matching the published Figure5 selectors. The same fixed percentage palette is
used for baseline and candidate. The published panels remain byte-identical.

## Comparison Boundary

Both sides use the saved paper physical inputs: Penndorf Rayleigh coefficients,
8000 m Rayleigh and 1200 m aerosol scale heights, aerosol alpha 0.8/beta 0.04,
single-scattering albedo 0.8, phase g 0.7, wavelength-dependent paper grass and
no ozone. The run computes Direct40, 360-818.25 nm, without projecting into the
production15-channel basis or applying Toronto optics.

The existing paper baseline already uses 40 cache-transport intervals. This
candidate changes that count to 60 and normalizes discrete Mie phase mass in
each higher-order angular scattering pass. Source transmittance 20, F68 incoming
directions, 51 positions, 180 solar zeniths, W27 outgoing directions, Q30 quadratic
final views and monotone-cubic solar reconstruction remain fixed. The selected
shader coordinate contract is receiver-local, exactly as in the saved baseline.
The derived compiler covers both available summation branches; the compensated
source-aligned branch is not selected by this benchmark.

All17 times (09:30-13:30 every 15 minutes), all 81 canonical directions and all 40
wavelengths are retained through cumulative order4. The original B1 spectral
RMSE uses channels 0-30 in its registered 360-720 nm scoring boundary, totaling
42,687 scalar residuals. Aggregate RMSE is the root mean square of the17
interval RMSEs, not their arithmetic average. Lower is better.

Dome colors represent directional band-integrated relative radiance error using
the original Figure5 spherical interpolation and percentage palette. The
number below each dome is spectral RMSE. These are error visualizations, not
photographic sky color renderings. Published model panels are original,
hash-authenticated Figure5 image objects; they are not new model executions.

## Decisions And Verification

- Reuse immutable accepted angular-study baseline `00007-q2-base-full` to avoid
  rebuilding all 40 baseline wavelengths. Authenticate its complete manifest and
  every artifact, reconcile its served-source closure, and freshly reproduce
  channel16 before candidate execution. The fresh check passed exactly for all
  four cumulative spectra and sparse pure/cumulative field hashes.
- Admit60 only in the existing experiment transport-count validator. Removing
  that literal admission restores the saved source hash. All earlier numerical
  count behavior stays intact. Require exact J1 hashes and viewed N1 spectra at
  every candidate wavelength.
- Keep the paper profile, registered scoring and existing renderer unchanged.
  Use an explicit typed boundary for the read-only historical Figure5 module
  rather than editing its older inferred literal-key Maps in this experiment.
- Run one hardware-GPU wavelength at a time, retain compact spectra and hashes,
  and preserve frequent progress and intermediate spectral figures. No reviewers,
  production edits, cache deployment or additional parameter sweep is selected.

Local experiment type checking passed before execution. The accepted seal
reports 40 complete channels, no heartbeat failure, no source changes, and no
execution failure. All candidate J1 sparse field hashes and all viewed N1
spectra match the baseline exactly. All four physical-order ray spectra are
finite and nonnegative. The 42,687-scalar score and spatial SSE-delta identity
pass. Figure RMSE labels reproduce the canonical interval scorer within 1e-10;
all 27 published PNG hashes match their original identities. Both final dome
sheets were visually inspected and have readable labels and intact panels.
Post-run immutable-artifact verification passes.

Owned qualification/candidate Chrome processes and loopback servers exited;
all owned scratch was removed. Earlier baseline artifacts remain untouched.
No dedicated standards reviewers or audits ran, and no compliance claim is
made. No additional parameter sweep, twilight test, local-source transfer,
production edit or cache deployment is included. These are explicit scope
limits, not silently completed verification.

## Execution Measurements And Handoff

Total measured runner time: 763.491 seconds (12 minutes 43 seconds), including
baseline qualification, all 40 candidate channels, score calculation, reporting,
figures and cleanup. Fresh one-channel baseline qualification took 20.817 seconds.
The 40-channel candidate host took 713.574 seconds (11 minutes 54 seconds). Those
host durations include compilation, GPU work, CPU view reconstruction and IO;
they are not isolated GPU kernel timings or a build-cost ratio against a fresh
40-channel baseline.

New retained evidence is 13,660,922 bytes (about 13.03 MiB). Peak owned scratch
was 125,876,161 bytes (about 120.04 MiB), with zero remaining scratch. The existing
544 MiB retained / 1 GiB scratch / 40 GiB free-disk budgets were sufficient; no
budget amendment or retry was needed.

Questions and choices are recorded above: paper40 rather than app15 as baseline;
Direct40 computation with the existing 31-channel score; authenticated baseline
reuse plus exact replay; preserved receiver-local contract; branch-complete Mie
adapter; read-only Figure5 renderer through typed interfaces; one sequential
GPU job and no automatic follow-on work. No user clarification was needed.
The experiment stays open; no scientific task is outstanding. The checkpoint
adviser recommended preserving this complete milestone with message
`Add full B1 qualification for the normalized60 candidate`. The local checkpoint
uses the standing independent-execution authorization; nothing is pushed.
