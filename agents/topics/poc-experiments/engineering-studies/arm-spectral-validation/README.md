# ARM Spectral Validation Experiment

Status: conditional pilot/confirmation comparison completed; absolute observational
accuracy remains inconclusive. See [results](results.md) and [status](status.md).

## Objective

Compare the production distant-Sun algorithm with recent measured ARM sky spectra using independently constrained, matched atmospheric profiles.

The first campaign uses ARM Southern Great Plains on 22 August 2023. Measured
spectra are the observational reference; libRadtran is the independent second
comparison. Calibration and matching limits prevent a definitive accuracy
verdict. No production defect or expected sky color is presumed.

## Governing Documents

- [Design](design.md)
- [Plan](plan.md)
- [Status](status.md)

## Repository Surfaces

- Authored source and controls: `experiments/arm-spectral-validation/`
- Generated output: `tmp/experiments/arm-spectral-validation/`
- Production and other experiments: read-only unless separately authorized

The [production promotion status](../../../production-algorithm32/caches/sky-accuracy-promotion-status.md)
owns the corrected implementation and its distinction from deployed legacy
assets. Sky Accuracy Dials remains suspended; this lane does not reopen it.

## First campaign

The [results](results.md) contain the completed conditional ARM/production/libRadtran
comparison and reviewable spectra. [Status](status.md) owns its interpretation and
resumption boundary. The historical `report.py` generates the earlier pre-access
inventory only; `comparison_report.py` owns the numerical comparison. Source
runners retain exact parents in each new immutable run. Authenticated acquisition
uses an interactive non-echoing prompt; never put credentials in arguments or files.
