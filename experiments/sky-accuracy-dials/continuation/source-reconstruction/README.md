# Source and reconstruction attribution

This diagnostic reuses the admitted source columns from runs 00188/00189 at
the same 32 bottom-interval samples and their 16 altitude/solar anchors.
It separates the finite-source effect after reconstruction from the remaining
first-order reconstruction error. Kider values, new optical integrations and
GPU captures are not used.

The [registration](../../../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/source-reconstruction-plan.md)
owns predictions, scope, admission and stopping conditions. Use the pinned
Node with `run.mjs C0 sourcePrediction sourceTarget`. The run retains all local
contrasts, four group projections, propagated allowances and failed or
unresolved predicates within 3 MiB and five CPU-job minutes.

Raw, split-species and density-factored fields share source transmissions,
physical parameters and stencils. Binary64 and Float32 storage are separate
controls. Source-audit anchors define the diagnostic geometry; this is a CPU
calculation of the declared equations, without a GPU bitwise-parity claim.
Fixed positive view weights project the sample errors and do not qualify a
complete viewing integral or its quadrature.

For the harmonic slope H(a,b), the magnitude of each secant derivative is at
most 2, including the continuous zero-slope sign boundary. An interior slope
therefore has allowance 2*Uprevious + 4*Ulower + 2*Uupper. Absolute Hermite
basis weights propagate those slope allowances; positive angular and altitude
weights propagate the remaining sums. Float32 conversion and arithmetic
receive separate allowances. These bounds are conditional on the retained
empirical column allowances and shared physical equations, not rigorous bounds
on physical-model error.

`sourceReconstructionProof()` checks manufactured perturbations, original
interpolation operation order, zero and constant inputs, regrouping,
accounting identities and preservation of failed/unresolved predicates.
It neither reads atmospheric target values nor creates a test-framework tree.

The optional fourth CLI argument is the prior source-reconstruction run. It
selects the separately registered
[phase/transmission attribution](../../../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/phase-reconstruction-plan.md).
That case exactly replays the prior rows and groups before introducing its
analytic phase controls. Its phase proof adds geometry, homogeneity and gate
checks. The same storage/time caps and deferred-review boundary apply.

The optional fifth CLI argument is the prior phase-attribution run. It selects
the [altitude/solar transmission diagnostic](../../../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/transmission-reconstruction-plan.md).
This case adds 64 independently integrated columns at each sample's solar
cosine and original altitude anchors. It retains every Gauss/Simpson pass,
uses the original reference-admission policy, and exactly replays both earlier
decompositions before separating altitude from solar transmission error.
Its allocation is 4 MiB and five CPU-job minutes. GPU work and Kider inputs
remain absent; formal review remains deferred.

The optional sixth CLI argument is the prior transmission-attribution run.
It selects the [density-factored column controls](../../../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/column-reconstruction-plan.md).
These reuse all independent columns, replay the preceding decompositions and
compare interpolation of geometric columns with density-factored and
finite-top-adjusted representations. No new integration is performed. Both
local and projected predictions retain their failures, under 4 MiB and five
CPU-job minutes. Per-species geometric columns use metres; optical depths and
transmissions are dimensionless; the resulting density and projection errors
keep the original units.

The optional seventh CLI argument is the prior column-control run. It selects
the [original-grid/source-count interaction](../../../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/source-grid-plan.md).
Only the original altitude/solar anchors form its candidates. It restores
solar cubic reconstruction and propagates the source integrand's endpoint
derivative prediction through the same nonlinear representation. S80 and
S160 inputs were previously known, so this is a new combination test rather
than a newly withheld source-count qualification. The 4 MiB/five-minute cap,
no-new-integration boundary and deferred review remain in force.
