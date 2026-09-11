# Algorithm32 External Benchmark Contract

Status: the current production GPU B1--B3 suite is registered and accepted;
retained CPU and five-profile evidence remains available for comparison.


## Scope And Canonical Ownership

The benchmark suite evaluates complete declared Algorithm32 spectral output
against pinned clear-sky evidence. This document owns the interpretation and
promotion contract. Exact external citations belong in
[`/references/references.md`](../../../../references/references.md), and
official experiment identity belongs in
[`/references/experiments.md`](../../../../references/experiments.md).

Current retained result summaries are:

- [native-15 whole-algorithm conclusion](../../../../references/results/experiments/algorithm32-whole-algorithm-conclusion.md);
- [direct-40 paper-profile conclusion](../../../../references/results/experiments/algorithm32-paper-profile-whole-algorithm-conclusion.md);
- [B1 directional radiance](../../../../references/results/experiments/b1-directional-sky-radiance/result.md);
- [B2 hemispherical irradiance](../../../../references/results/experiments/b2-hemispherical-sky-irradiance/result.md); and
- [B3 matched-atmosphere solver comparison](../../../../references/results/experiments/b3-matched-atmosphere-solver/result.md).

These retained artifacts remain evidence inputs for recovery. The separate
current-production GPU reports registered in `/references/experiments.md`
constitute the official B1--B3 suite.


## Benchmark Observables

- **B1: directional spectral radiance.** Compare the complete 17-condition by
  81-direction spectral boundary with the pinned Kider measurements under the
  published spectral RMSE and aggregate-over-time rules.
- **B2: diffuse-sky hemispherical irradiance.** Apply the declared spectral
  and cosine-weighted hemispherical integral to the same directional fields
  used by B1; report RMSE, bias, and worst residual over time.
- **B3: matched-atmosphere solver context.** Score the same candidate cube
  against the same Kider measurements, require the aggregate to reproduce the
  candidate's B1 result, and place it beside Bruneton's published libRadtran
  results with a complete mismatch declaration.

B1, B2, and B3 are required views but are not three independent votes. B2 is
an integral transform of the B1 measurement field, and B3 intentionally
reuses the B1 cube and measurements. Their distinct value is directional
shape, aggregate energy behavior, and solver/mismatch context respectively.


## Retained CPU Evidence

Two non-interchangeable evidence families are retained:

| Family                             | Boundary                                                                                                                       | Retained conclusion                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Native 15-channel                  | Algorithm32's 15 equal-width spectral bins projected piecewise-constantly onto the benchmark coordinates                       | Default and cumulative J2 through J5 are favorable under the retained rules.                                         |
| Direct 40-coordinate paper profile | Published wavelength coordinates, paper atmosphere and solar packet, and profile-owned Lambertian grass for n-order candidates | J2 through J5 are favorable; Default is limited only by one B1 displayed-time threshold and remains favorable on B2. |

For the native boundary, the adjacent improvements used by the order-policy
decision diminish after J3. B1 aggregate RMSE improves by `1.320114`,
`0.181236`, and `0.014475 mW m^-2 sr^-1 nm^-1` across J2-to-J3,
J3-to-J4, and J4-to-J5. B2 RMSE improves by `1.634762`, `0.322904`, and
`0.079435 W m^-2` over the same steps. The direct-40 family shows the same
direction of diminishing gains; its Default miss is only `0.014261` above the
13:15 favorable B1 boundary.

This evidence informs the project-policy choice of J4 as the default. J5 is a
named comparison profile, not the unnamed production default. The pattern is
in-sample evidence, not a convergence proof or an order-optimality theorem.


## Fixed Scientific Boundaries

- Pin the Bruneton comparison paper/supplement, the Kider paper/supplement and
  measurement payloads, the declared comparison-code revision, and the
  libRadtran reference identity through `/references`.
- Keep candidate generation separate from scoring. A scorer consumes a
  durable spectral boundary and does not import or execute Algorithm32.
- Freeze candidate-independent judgment rules before generating the candidate
  output being judged.
- Require complete finite, nonnegative output. Do not discard inconvenient
  times, directions, or channels.
- Preserve spectral values through the benchmark boundary. Do not fit an
  intensity scale or use RGB as the benchmark observable.
- Declare every physical and numerical mismatch, including atmosphere,
  aerosol fitting, ground treatment, multiple-scattering truncation, angular
  quadrature, position/path discretization, geometry, observer altitude, and
  source treatment where applicable.
- Treat the Kider-fit comparison as in-sample. Do not present it as independent
  out-of-sample validation.


## Production Promotion Contract

After the production Algorithm32 path is integrated:

1. define standalone B1, B2, and B3 experiments with all input payloads,
   descriptors, scorer versions, thresholds, units, mismatch declarations,
   and output schemas owned in this repository;
2. generate a deterministic CPU-oracle boundary and the corresponding
   production GPU boundary for the exact same physical cases;
3. publish a separate CPU/GPU parity record so scientific scoring cannot hide
   an implementation mismatch;
4. have B1, B2, and B3 consume the durable production boundary rather than a
   research implementation or compatibility source tree;
5. record hashes for inputs, generated boundaries, scorer outputs, and
   figures; and
6. register the experiments in `/references/experiments.md` before citing
   them as official evidence.

Reproducibility includes candidate generation, not only scoring or figure
rendering. The Bruneton benchmark must own and rebuild its direct 40-coordinate
configuration from pinned atmosphere, solar-spectrum, ground, condition, and
direction inputs. Algorithm32 consumes those values through a typed,
basis-compatible execution contract without knowing their benchmark identity.
The benchmark generates the complete candidate boundary and provenance
sidecar, then runs the existing B1/B2/B3 scorers and figure generator. Retained
TSV, cube, or image artifacts may verify determinism but are not substitutes
for that generation path.

The production plan names this work `bruneton-paper`. It is sequenced directly
after extraterrestrial production integration and is a mandatory MVP gate,
not optional follow-on hardening.

The B-level experiments are follow-on hardening, not blockers for visible
feature development. They remain mandatory before a release or publication
claim.


## Claim Boundary

The retained favorable/limited classifications apply only to their declared
CPU boundaries under the adopted no-ozone, spherical, distant-Sun,
Kider-fitted conditions. They do not establish out-of-sample accuracy,
flat-geometry or finite-local-source accuracy, resolved-disc accuracy,
surface-material accuracy, equality with libRadtran, production CPU/GPU
equivalence, convergence, performance adequacy, or correctness under every
atmosphere.
