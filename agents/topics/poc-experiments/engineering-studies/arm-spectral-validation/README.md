# ARM Spectral Validation Experiment

Status: execution authorized; M1 metadata inventory retained, advancement held for ARM data access.

## Objective

Compare the production distant-Sun algorithm with recent measured ARM sky spectra using independently constrained, matched atmospheric profiles.

ARM Southern Great Plains in 2023 is the first search target.22 August 2023 is an
unqualified candidate, not a verified matched benchmark. Measured spectra are
the observational reference; libRadtran is a required independent second
comparison. No production defect or expected sky color is presumed.

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
