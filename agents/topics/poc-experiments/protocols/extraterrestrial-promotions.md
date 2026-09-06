# Extraterrestrial Experiment Promotions

Focus: Bounded experiment admission, evidence, and promotion.

Related owners: [engineering-studies](../engineering-studies/extraterrestrial-promotions.md), [sources-provenance](../../pure-research/sources-provenance/extraterrestrial-promotions.md).

## Retained Foundation And Promotion Gates

E4--E7 are useful standalone local foundations, and their current direct test
suite reports 27 passing tests. They are retained promotion candidates, not
official or citable experiments:

| Candidate | Foundation used here | Required promotion repair |
| --- | --- | --- |
| E4, `EXPERIMENT-A32-WF-000011` | Point-response and raster-conservation identity. | Replace generic "spectral flux" terminology with spectral irradiance density `F_lambda` in `W m^-2 nm^-1`. |
| E5, `EXPERIMENT-A32-WF-000012` | Ordinary/projected solid-angle integration and uniform-disk identity. | Make every input quantity and integration measure explicit. |
| E6, `EXPERIMENT-A32-WF-000013` | Direction-resolved visibility/transmittance integration. | Add explicit units and define every weight's measure and semantics. |
| E7, `EXPERIMENT-A32-WF-000014` | Pre-display spectral-radiance composition. | Add explicit units and distinguish integration weights from already integrated packets. |

Each candidate also needs its full stable ID in every artifact, exact command
and input identity, hashes, and bounded claim/non-claim statements before it
can be accepted and registered in `/references/experiments.md`. An imported
record or passing runner is not official evidence. XA1 and XA2 must restate
the needed analytic identities inside their own standalone definitions; they
must not import E4--E7 as runtime dependencies or treat retained results as
oracles.


## Subjective Globe Cases Are Not Evidence

The ER6/ER8 eight-case San Jose and Union Glacier matrix was selected for
subjective rendering. It is not an objective scientific sample, numerical
convergence domain, implementation oracle, or publication fixture. Its JPL
responses, reconstructed states, CPU residuals, and rendered outputs may be
retained as application/rendering inputs only; none may support a fact or an
official experiment. They are forbidden as XA3 cases, expected values, or
calibration oracles.

`EXPERIMENT-A32-XA-004` is therefore retired as an experiment proposal and
must not be created from this matrix. A future paper-facing ephemeris,
geometry, or convergence claim would require a new experiment ID, an
objectively selected case domain, and independently predeclared controls.

The current external bibliography and downloaded payload ownership are in the
[reference topic](../../pure-research/sources-provenance/README.md). Record 067's rolled-back code
promotion is excluded from every XA experiment and cannot serve as a
production or parity oracle.
