# Twilight Exposure Experiment Status

State: M1 and M2 complete. Two curve-only candidates advance to M3. No production
code, operational cache or display selection has been changed by the experiment.

## M1 report ? baseline qualified

Accepted capture `00002-baseline` contains San Jose Globe40 km sunset+30,+40,+50,
solar noon and genuine night (sunset+3 hours, Sun below -18 degrees), with fixed
pose and1024x576 pixels. Every lossless linear capture re-encodes to native GPU
within one byte in every channel. Stellar and atmosphere-only layers are retained
for the primary twilight/night cases. Baseline capture took142.5 seconds wall
including server/browser startup, cache preparation, compilation and readback.

The first two runs remain intact:00000 failed the replay gate;00001 completed but
its rerender controls are superseded. The probe used writeBuffer, although the
production pass has needsSwap=false and consumes readBuffer. Correcting the input
and asserting actual sampler texture identity fixes the mismatch without weakening
the parity criterion.00003 is an explicitly sealed startup failure: the sandbox
blocked the read-only Git child used for run metadata. The allocator now performs
that check before run allocation; host execution repairs this environment issue.

Accepted registration `00004-calibrate` seals geometric band/disc/sky masks and
comparison guards before candidate scoring. At+50 the geometric band is99.10%
near white with native gain7632.29; frozen +30 gain41.80 reduces it to27.25%.
The earlier52.49% figure measures the whole image, not this new band mask.
Frozen exposure remains a causal control rather than appearance ground truth.

## M2 report ? small screen complete

Accepted `00005-curve-screen` evaluates three curve-lift strengths, two isolated
field-meter variants and a highlight shoulder over identical qualified HDR data.
It also checks2401 illumination values per response, the daylight control and
actual genuine-night sky/star pixels. Screening took about6 seconds wall.

- `curve-half` advances: +50 gain71.73; band white30.75% versus99.10% baseline.
- `curve-match` advances: +50 gain41.80; band white27.26%.
- `curve-double` fails the +30 lower-scene brightness guard.
- P90/RMS field meters fail the lower-scene brightness guards; they are too dark.
- Highlight-only shoulder fails contrast at+40/+50 and the daylight guard.

The advancing functions use only the original scalar illumination input, with a
smooth low-light curve bend. They retain the zero-illumination night anchor and
are exactly the production response above the existing385 lux pivot. They add no
view-meter pass, source dimming, saturation slider or physical model change.
These are primary-pilot results, not generalization or final selection.

## Evidence

[Early gallery](../../../../../tmp/experiments/twilight-exposure/runs/00005-curve-screen/comparison.html)
shows actual pixel appearance; [screen JSON](../../../../../tmp/experiments/twilight-exposure/runs/00005-curve-screen/results.json)
retains all cases and failures. [Calibration](../../../../../tmp/experiments/twilight-exposure/runs/00004-calibrate/calibration.json)
owns masks/guards. [Execution log](execution-log.md) owns chronology and decisions.
All runs retain hashes, commands, parents, source snapshots and terminal states.

## Next action

Register the M3 matrix and carry only curve-half/curve-match to5 m,2 km,10 km,
40 km sunset-through+60, daylight/night, other viewing directions and the held-out
Union Glacier/Flat cases. Reuse the qualified M1 cases where physical view inputs
match. Estimate about20 minutes for the capture batch, then inexpensive replay;
update this estimate using the first completed batch.

## Verification and standards lifetime

Local experiment JavaScript type checking passes. All dedicated standards
reviewers/audits remain disabled; checkpoint-advisor monitoring is independent.
The inherited experiment mapping remains unchanged, including types.md guidance.
No temporary standards configuration exists to restore. No compliance claim.

## Blockers

None. No external data or downloads are needed.
