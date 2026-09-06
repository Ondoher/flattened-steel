# Extraterrestrial Experiment Promotions

Focus: Sources, datasets, licenses, and canonical claim registers.

Related owners: [protocols](../../poc-experiments/protocols/extraterrestrial-promotions.md), [engineering-studies](../../poc-experiments/engineering-studies/extraterrestrial-promotions.md).

## XA3 -- Calibrated Sun, Sirius, And Moon Inputs

- ID: `EXPERIMENT-A32-XA-003`; readiness: requires further protocol research.
- Stage boundary: the active Sun-and-stars implementation does not consume the
  lunar branch. Before XA3 executes, its Sun and Sirius results must be
  independently classifiable from the deferred Moon work, or the Moon work
  must move to a newly registered experiment identity.
- Question: do the retained Sun, Sirius, LIME, Air-LUSI, and ROLO payloads
  reproduce their declared spectral-basis transformations and independent
  calibration comparisons under predeclared uncertainty bounds?
- Inputs: repository-local payloads under
  `references/downloads/extraterrestrial-sources-2026-07-12/`, their canonical
  hashes and source identities, declared wavelength/bin transformations, and
  explicit uncertainty models.
- Iteration: source class, spectral bin, and published measurement or anchor.
- Research prerequisite: predeclare an objective case domain, spectral-bin
  operators, independent oracle values, uncertainty propagation, tolerances,
  and result classification. Freeze the exact LIME release branch, including
  release-linear interpolation, coefficient/covariance ordering, release SRF
  sign convention, and nearest-signed ASD phase selection. Use Air-LUSI bins
  2--15 as the decisive fully covered comparison and a qualified ROLO bin-1
  comparison only as the short-wavelength complement.
- Acceptance: verify every selected payload hash; independently reproduce the
  CALSPEC Sirius transform, the canonical Sun packet against TSIS, and the
  selected disk-integrated Moon model; then report all residuals with the
  predeclared uncertainties and classification. The Moon conclusion remains
  disk-integrated and does not claim a resolved lunar BRDF/radiance model.
- Fact boundary: no new paper-facing calibration value is admitted until this
  research is complete and the experiment produces its citable result.
- Intended result: `references/results/experiments/xa3-calibrated-celestial-inputs/result.md`.
