# Boundary-Aware Angular Sampling In The Atmosphere

Status: prospective implementation and execution plan. Execute only after the
[resource extension](resource-extension-plan.md) is accepted. This bounded
`compensation-attribution-v1` package follows `00210`; its manufactured
phase-product result does not qualify the actual atmospheric integral.

## Questions And Fixed Scope

At the frozen `p-0930-5-7:h1000` point, channels 0 and 8, does resolving the
Sun-centered structure improve second-order angular integration at a fixed
384-direction budget? Does refinement of that rule approach an independently
checked angular reference? Separate atmospheric and ground contributions and
outgoing Rayleigh and Mie scattering exactly as in `00161`/`00162`.

Keep the declared atmosphere, first-order incident solver, nonnegative ground
boundary, column tolerances and phase equations. Reuse the original r8-a16 and
r16-a32 data unchanged. Their incident allowances exclude angular error; neither
is an adequate angular oracle at h1000. The first package uses one point rather
than transferring a reference from nearby heights. A noon extension requires
a separate prospective transfer test after this result.

## Sampling Construction

Align the incoming polar axis with the Sun. Define the first azimuth basis
vector by the observer radial direction projected perpendicular to the Sun,
and its perpendicular partner by the right-handed cross product. This differs
from the outgoing-aligned azimuth convention of the manufactured benchmark:
the radial/Sun plane preserves the physical reflection symmetry of incident
radiance and allows independently witnessed mirror reuse.

For each midpoint azimuth, split the polar-cosine interval at both exact
physical boundaries: the radial tangent and the ground horizon. If
`a=radial dot sun`, `b=radial dot azimuthBasis(phi)`, an incoming direction at
polar angle theta has radial cosine `a*cos(theta)+b*sin(theta)`. Solve this
equation for boundary values 0 and `-sqrt(h*(2*R+h))/(R+h)`, retaining all roots
in `[0,pi]`, sorting their cosines and validating each root against the original
radial-cosine equation. Apply Gaussian integration separately in the resulting
intervals. The registered morning geometry must have exactly three intervals
per azimuth; otherwise stop this construction and retain the contrary geometry.

At eight Gaussian nodes per interval and sixteen azimuths the complete rule
has 384 directions, matching the original rule. Mirror representatives retain
both outgoing phase weights. Independently solve two fixed mirror witnesses
and require agreement within the summed incident allowances. Validate unit
directions, positive weights, total solid angle, boundary equations and branch
classification before interpreting radiance differences.

## Prospective Tests And Reference Admission

Freeze the following candidate predictions before any new atmospheric rays:

1. The 384-direction Sun-frame response relative to the original 384-direction
   radial rule is negative in both channels.
2. Against an admitted same-point angular reference, its absolute combined J2
   error is at least 80% smaller in both channels, including uncertainties.
3. Its 16-by-32 refinement further reduces combined absolute error by at least
   50% in both channels, unless the coarse error is unresolved.

The phase-only result motivates these predictions; it supplies no quantitative
atmospheric oracle. Keep every failed and unresolved predicate. Separately
report all four physical component errors and refinement responses; do not
discard a total improvement that hides a component regression.

Build a same-point empirical reference using two coordinate families. The
Sun-frame 16-by-32 and 32-by-64 rules provide one refinement comparison.
The original radial frame at 32-by-64 and 64-by-128 provides the second.
The retained radial 16-by-32 result is an additional convergence diagnostic.
For each combined or individual component, use the mean of the finest
Sun and radial values. Set angular allowance to twice the maximum of the two
last refinement changes and the finest-frame disagreement. Add propagated
incident uncertainty and a separately declared arithmetic allowance.
This is an empirical numerical allowance, not a rigorous physical-model bound.

Admit each required combined reference only if its total allowance is at most
10% of the original coarse error lower bound. Retain the finest-frame
disagreement explicitly as part of that allowance. The accuracy predicates additionally require their
conservative improvement inequalities, so reference admission alone cannot
force a pass. Components with unresolved comparisons stay unresolved.
No tolerance or error multiplier may be loosened after seeing the result.

## Bounded Execution Sequence

1. Prove the geometry and accounting contracts using manufactured inputs;
   run the complete POC type check. Authenticate original parent values,
   coordinate identity and relevant unchanged numerical collaborators.
2. Execute the new 8-by-16 candidate, retaining every compact incident estimate,
   its allowance and two independent mirror witnesses. This is the measured
   resource pilot. Do not claim absolute accuracy yet.
3. If the pilot is complete and forecasts fit remaining resources, evaluate
   the Sun 16-by-32 / 32-by-64 and radial 32-by-64 / 64-by-128 references in
   separately bounded records. Do not count intermediate finest values as
   an admitted oracle. Stop expansion if references fail or resource forecasts
   no longer fit; retain unresolved conclusions.
4. Authenticate all required records and assess the frozen predictions once.
   Select the next investigation from the measured error source and reference
   limits, not from Kider agreement.

The original 384-direction morning case required 192 representatives plus two
mirror witnesses and about 14.73 seconds summed incident-evaluator time. That
is a cost anchor, not an admission guarantee for different directions. Use
the new pilot's aggregate incident rate, divided across the four workers and
multiplied by two, plus a startup/accounting reserve to forecast reference
work. Record the slowest incident separately as an execution diagnostic;
hard task/job deadlines remain enforced even when the rate forecast is wrong.
Use the existing bounded CPU worker pool only if its
interface preserves exact source, coordinate and numerical-policy identities.

Cap this package at 16 MiB retained evidence and 60 CPU-job minutes, further
narrowed by campaign admission. Pilot records are at most 3 MiB; larger
reference records may use at most 6 MiB with a measured compressed-data forecast.
The total package cap includes all forecasts, failures and assessment records.
Every non-assessment admission must preserve 3 MiB and five CPU-job minutes
inside that package cap for the final assessment, including a partial or failed
reference package.
Retain compact node results and shared immutable source snapshots, rather than
full radiance caches. No GPU job or large scratch is needed. Keep a 30-second
finalization reserve per job and the existing 40 GiB disk floor.

## Implementation Boundary

Implementation belongs in a new `continuation/angular-frame/` module and any
narrowly necessary experiment-local worker adapter. Preserve the existing
physical integration and historical angular helpers. This source unit and its
direct collaborators use deferred baseline
`871690d334b4339f7aaee516dcc140dd00a3edaf`; formal source review remains deferred.
An admitted component result does not close the broader accuracy objective,
qualify production arithmetic or assess complete viewing radiance or Kider.
