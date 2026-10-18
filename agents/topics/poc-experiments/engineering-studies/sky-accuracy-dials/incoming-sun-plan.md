# H68 Sun-focused incoming quadrature

Status: complete through00449/00450; [results](incoming-sun-results.md) and
[execution summary](incoming-sun-execution.md) own the outcome and decisions.
Owner-selected independent execution after H67. Test ordinary, Sun-focused and
Sun-plus-horizon incoming quadratures at exactly the four H67 sunset targets
and three wavelengths. Production and all parent runs remain read-only.

## Frozen screen

Reuse accepted00447/00448 control, local cache-free J2 means/uncertainty and
continuous-F68 incident samples. Keep physical inputs, source, phase/SSA,
outgoing physical directions and independent continuous L1 evaluator unchanged.
This isolates incoming angular integration, not outgoing reconstruction or the
full higher-order recurrence. No new Monte Carlo or libRadtran campaign.

Compare three families at68/256/1024 incoming evaluations per target:

1. Ordinary reflection-paired Fibonacci, using exact retained F68 at68.
2. Sun focus: the same nodes under tan(thetaPhysical/2)=.35*tan(thetaBase/2),
   with its solid-angle Jacobian4*k^2/[1+k^2+(1-k^2)*cos(thetaBase)]^2.
3. Equal-count50:50 Sun/horizon mixture: half the nodes under that Sun map;
   half under a truncated Cauchy polar map centered on the physical ground
   horizon cosine, width0.1. Use the balance-mixture density for each sample's
   physical integration weight, not an unweighted concatenation.

Higher counts use the same pinned-latitude/reflection construction generalized
to the requested count. Half-count streams in the hybrid have their own complete
base sphere coverage. Record actual directions/weights and constant/first-moment
errors; never silently change weights to force a manufactured result.

Primary J2 uses the same existing discrete Mie phase-mass normalization as H67.
Report raw weighted J2 alongside it and species mass/integral terms. Normalization
is a controlled operator choice, not a fitted per-case exposure or result.

## Execution and gates

- Prove map inverses, positive weights, Sun/horizon Jacobians and mixture-density
  identity numerically before launch. Retain quadrature geometry and parameters.
- Stream new continuous L1 evaluations on the GPU at all proposed directions,
  using physical initial altitude/radial cosine and the qualified128-column
  optical calculation. Pair view64/128. Record significant convergence misses;
  refine to256 only if a candidate's final J2 changes by more than1%.
- Reproduce H67 continuous F68/raw and normalized sums within5e-5 relative at
  all12 cases before treating the new comparisons as qualified.
- Compare normalized/raw J2 ratios to the same independent local path means.
  Retain their empirical intervals. Report mean/worst absolute relative error,
  all individual cases and measured direction-evaluation cost.
- Call a family promising only if mean error falls at least20% from ordinary
  F68 and worst error does not exceed ordinary F68's worst. Report failures and
  exceptions; do not call the best tested count a globally optimal grid.
- Render a12-case ratio heatmap, raw/normalized comparison and node/weight
  diagrams. These are three-band diagnostics, not full-color sky swatches.
- Verify immutable parents, exact rule and reduction replay, identities,
  finite outputs, cleanup, local types and image inspection. No experiment
  reviewers. Use the existing checkpoint adviser at the coherent final milestone.

The existing736MiB retained limit applies; estimated new compact evidence is
under3MiB and starting retained evidence is763852673bytes. Generated output
stays in this experiment's declared ignored root, following explicit repository
and experiment containment instructions. Preserve progress and every decision
in the intended repository execution summary. Run serially on the GPU.

Full-cache construction, later-order propagation, B1/paper RMSE qualification,
scene renders and production promotion remain outside this local screen.
