# Extraterrestrial Adoption Guidance

Focus: Engine conformance and production benchmark export.

Related owners: [protocols](../../poc-experiments/protocols/extraterrestrial.md).

## Evidence And Production Recast

- A closed experiment is evidence, not production architecture. Its class
  layout, source paths, runners, fixtures, generated artifacts, and diagnostic
  helpers are never runtime or build dependencies.
- Before promotion, select an independent authority appropriate to the source:
  an official experiment, analytic oracle, external solver/data set, or a
  sealed isolated qualification boundary. Record the authority identity,
  complete relevant inputs, domains, profiles, spectral basis, precision, and
  claim limit.
- Declare comparison tolerances, query/probe selection, controls, and required
  zero, nonzero, boundary, and edge coverage before observing production output.
  CPU/GPU agreement alone does not establish physical fidelity.
- Recast only the accepted semantic contract through the current production
  source, geometry, cache, ShaderBuilder, renderer, and Color owners. Create a
  file-by-file promotion record that distinguishes ported behavior from rejected
  experiment-only material.


## CPU, GPU, And Runtime Qualification

- The CPU calculation is the deterministic selected-ray/reference surface; it
  is not a parallel product renderer. It becomes a GPU oracle only after the
  selected independent comparison accepts the affected capability.
- The GPU owns its resource construction, publication, and runtime
  orchestration. It consumes the same physical and numerical facts under a
  declared precision boundary.
- Cache construction publishes only a complete successor generation, preserves
  the last valid generation when staging fails or is superseded, and disposes
  idempotently without assuming ownership of an externally supplied backend.
- Qualification covers the normal renderer route, matched scene visibility,
  no-source fallback, replacement failure, disposal, and context
  loss/restoration. Camera, viewport, scene-hit, and display state are renderer
  inputs, not cached source facts.
