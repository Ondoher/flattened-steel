# Extraterrestrial Stage 12 Experiment

This is the tracked source and control surface for the isolated Stage 12
Sun-and-stars implementation and qualification work. Stage 12.0 is complete:
`baseline/` is a sealed production Algorithm32 snapshot, `candidate/` is its
byte-identical mutable fork at the G0 checkpoint, and the containment policy,
schemas, fixture, decision manifest, harness, and proof runners are active.

Accepted immutable run `000002-g0-boundary-contract-proof` closes G0 with
10/10 assertions and 25/25 classified negative controls. Accepted immutable
run `000008-g1-geometry-transform-proof` closes G1 with 11/11 assertions and
5/5 negative controls. It establishes only geometry-owned named-frame
placement, `(h, u)` coordinates, horizon/Sun-support classification, and query
stencils. Accepted immutable run `000009-g2-generation-lifecycle-proof` closes
G2 with 10/10 assertions and 3/3 negative controls: synthetic complete-only
generation lifecycle and geometry-owned controller semantics. Stage 12.3 / G3
is accepted by immutable run `000017-g3-cpu-star-transport-proof` with 6/6
assertions and 2/2 negative controls: binary64 CPU star point-set transport.
G4 is accepted by immutable run `000024-g4-cpu-sun-disk-transport-proof` with
6/6 assertions and 2/2 negative controls: derived CPU Sun-disk radiance from
the existing atmospheric Sun, without a second source owner. Stage 12.5 / G5
is next: CPU disk rasterization and spectral composition.

The concise active context and immutable-run rules are in the
[Stage 12 implementation topic](../../agents/topics/extraterrestrial/stage-12-implementation-topic.md).

This lane intentionally has no experimental unit-test suite. Its current
purpose is to prove the cache concept and compare cache strategies through
focused self-verifying runners and immutable run records. Unit/regression
hardening begins only after candidate acceptance and explicit promotion.

Generated experimental output does not belong in this directory. Runs,
builds, browser bundles, profiles, caches, reports, readbacks, captures,
diagnostics, renders, logs, and scratch artifacts go under the
repository-local ignored directory:

```text
tmp/extraterrestrial/
```

The candidate is a qualification surface, not a production runtime
dependency. Production remains read-only until the explicit delta-promotion
stage.
