# Experiments

This is the canonical index of referenceable official experiments. Each
official entry links to its standalone experiment definition, inputs,
execution controls, output boundary, and result artifacts. A retained runner,
passing self-check, historical record, or imported result is not official or
citable until it satisfies the promotion checklist and is registered here.

The binding admission, parameter-change, rerun, current-result, and historical
evidence rules are the
[Official Experiments policy](citation-and-retention-policy.md#official-experiments).
The [promotion checklist](../agents/topics/poc-experiments/protocols/promotion-checklist.md)
is its required operational review. Registration is explicit: absence from an
official table in this file means the experiment is not citable.

The required experiments below are not yet official experiments, so no fact
may cite them until their self-contained definitions and results exist here.
Their discovery provenance is maintained only in the working experiment
backlog, not in this publication-facing index.

## Official Bruneton Benchmark

| Id | Definition and reproduction | Current result | Figures |
| --- | --- | --- | --- |
| B1 | [Directional spectral sky radiance; published Bruneton comparison parameters and current production Algorithm32](../scripts/experiments/b1-directional-sky-radiance/README.md) | [GPU report](results/experiments/b1-directional-sky-radiance/gpu/result.md) | [Six-figure index](results/experiments/b1-directional-sky-radiance/README.md) |
| B2 | [Cosine-weighted hemispherical transform of the B1 directional field](../scripts/experiments/b2-hemispherical-sky-irradiance/README.md) | [GPU report](results/experiments/b2-hemispherical-sky-irradiance/gpu/result.md) | [Diffuse-sky irradiance](results/experiments/b2-hemispherical-sky-irradiance/gpu/figures/b2-diffuse-sky-irradiance.svg) |
| B3 | [Matched-atmosphere solver context and mismatch declaration](../scripts/experiments/b3-matched-atmosphere-solver/README.md) | [GPU report](results/experiments/b3-matched-atmosphere-solver/gpu/result.md) | [Fixed-baseline residuals](results/experiments/b3-matched-atmosphere-solver/gpu/figures/b3-fixed-baseline-residuals.svg) |

The registered current evidence set is combined score run
[`000003-current-production-b1-b3-gpu-shaders`](results/experiments/b1-b3-production-scores/gpu/000003-current-production-b1-b3-gpu-shaders/manifest.json).
Its manifest authenticates the one production input manifest, three reports,
shared table and cube derivation, and eight figures. The stable report and
figure links above are the citation-facing paths for this evidence set.

`npm run generate:algorithm32:b1-production` regenerates B1 from tracked pinned
inputs and the current production compiler/runtime.
`npm run score:algorithm32:b1-b3-production:official` then publishes B1, B2,
and B3 from that one authenticated manifest. Successful official runs replace
the current result files; Git history retains earlier official values.
The implementation, parameter mapping, physical scoring boundary, prerequisites,
and scope of the result are owned by the linked definitions. B1 is the primary
real-sky directional comparison. B2 integrates the same Kider measurement
field, and B3 scores the cube derived from the same candidate table against
those measurements while providing solver context. B2 and B3 are distinct
views, not additional independent real-sky validation votes.

## Required Official Experiments

| Required id | Standalone experiment scope | Research readiness | Status |
| --- | --- | --- | --- |
| EXPERIMENT-A32-XA-001 | Typed source and point-conservation experiment, including all inputs, response controls, source hashes, output boundary, and result. | Ready for implementation. | Required; not created. |
| EXPERIMENT-A32-XA-002 | Extended-source transport and spectral-composition experiment, including exact-direction transport and no-second-transmittance checks. | Ready for implementation. | Required; not created. |
| EXPERIMENT-A32-XA-003 | Sun/Sirius calibration plus a currently deferred Moon branch, including pinned source payloads, transformations, uncertainties, and independent comparisons. | Requires further protocol research and an independently classifiable Sun/Sirius path or a separately registered Moon successor. | Planned; protocol incomplete and experiment not created. |

## Retained Promotion Candidates

The local E4--E7 runner suite currently reports 27 passing direct tests. These
results are retained promotion candidates only: none of the following IDs is
official or citable, and imported records do not change that status.

| Candidate id | Retained scope | Repair required before registration |
| --- | --- | --- |
| `EXPERIMENT-A32-WF-000011` (E4) | Point-response and raster conservation. | Describe `F_lambda` as spectral irradiance density in `W m^-2 nm^-1`, not generic spectral flux. |
| `EXPERIMENT-A32-WF-000012` (E5) | Ordinary and projected solid-angle conservation. | Make every input quantity and integration measure explicit. |
| `EXPERIMENT-A32-WF-000013` (E6) | Direction-resolved visibility/transmittance integration. | Declare radiance, solid-angle, and output units plus the exact meaning and units of every integration weight. |
| `EXPERIMENT-A32-WF-000014` (E7) | Pre-display spectral-radiance composition. | Declare component/output units and distinguish integration weights from already integrated component packets. |

All four candidates also need their complete stable experiment ID in every
artifact, the exact invocation and input identity, content hashes, and a
bounded claim/non-claim statement. They become referenceable only after those
repairs, a standalone accepted result, and explicit registration in this
file.

## XA3 Protocol Research Boundary

Before `EXPERIMENT-A32-XA-003` can be implemented, its protocol must make the
Sun and Sirius outcomes independently classifiable from deferred Moon work, or
move the Moon work to a separately registered successor. It must predeclare:

- an objective case domain, spectral-bin operators, independent oracle values,
  uncertainty propagation, tolerances, and result classification;
- independent reproduction routes for CALSPEC Sirius and the canonical Sun
  packet against TSIS; and
- for any retained Moon branch, the exact LIME release branch:
  release-linear interpolation, coefficient/covariance ordering, the release
  spectral-response-function sign convention, and nearest-signed ASD phase
  selection;
- Air-LUSI bins 2--15 as the decisive fully covered lunar comparison and a
  qualified ROLO bin-1 result only as the lunar short-wavelength complement.

No source-specific calibration value is admitted from retained artifacts
while this protocol is incomplete.

The retired `EXPERIMENT-A32-XA-004` proposal is not an official or required
experiment. Its ER6/ER8 San Jose and Union Glacier matrix is subjective
rendering material and cannot be cited as evidence for any fact, numerical
choice, implementation, oracle, or publication claim. Those eight cases are
also forbidden as XA3's case domain or expected values.

Record 067 is deliberately excluded: its experimental production-code
promotion was rolled back and is not evidence of a production baseline or
GPU/browser parity.
