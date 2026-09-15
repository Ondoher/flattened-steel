# Atmospheric Attribution Of The Polar Coordinate Error

Status: prospective `compensation-attribution-v1` continuation after `00219`.
The [endpoint control](angular-endpoint-plan.md) identifies a numerical cause
on known analytic fields. This package tests whether that cause also accounts
for the actual atmospheric angular response, at one fixed point and matched
sample count. It is not a settings sweep or production implementation.

## Fixed Scientific Scope

Keep `p-0930-5-7:h1000`, channels 0 and 8, the declared atmosphere and phase
functions, incident solver, physical boundaries and mirror convention. The
matched control is the accepted Sun-polar mu16/azimuth32 result `00213`.
Change only integration coordinate to theta, with its sin(theta) solid-angle
Jacobian and the same sixteen Gaussian nodes in each physical interval and
the same thirty-two midpoint azimuths. Do not average actual atmospheric
incident light across the half-turn used for analytic attribution in `00219`.

Retain atmospheric/ground incident light and outgoing Rayleigh/Mie scattering
as four separate components. Preserve the two independently evaluated physical
mirror witnesses and every unchanged incident accuracy requirement.

## Registered Stages

1. Prove the theta geometry at the two required counts. Reproduce the known
   theta16/azimuth64 phase integral from `00219` within its arithmetic allowance
   after conversion through the existing radial local frame. Authenticate all
   prior geometry, source and physical-solver identities; run the full POC
   type check before atmospheric work.
2. `pilot`: theta16/azimuth32, 1536 full directions, 770 incident evaluations
   including independent mirrors. This matches `00213` exactly in node counts.
3. `fine`: theta32/azimuth64, 6144 full directions, 3074 incident evaluations.
   Admit only after the complete pilot and a measured time/byte forecast.
4. `assess`: retain the frozen predictions and component comparison, including
   a failed/incomplete package or inadequate reference. Do not silently extend
   the reference ladder or relax tolerances after observing the results.

All new output is separate from the closed `00212`-`00217` package. Its failed
reference criteria remain unchanged and are not replaced by this investigation.

## Predictions And Reference Criteria

The identified negative coordinate error motivates two predictions per channel:

- Theta16 minus the matched mu16 result is positive and resolved.
- Against an admitted same-point reference, theta16 reduces combined absolute
  error by at least 80% relative to the matched mu16 result, including all
  allowances. Keep any failure or unresolved result.

Build the reference from the mean of new theta32 and unchanged radial64
`00216`, using radial32 `00215` for independent refinement evidence. For each
combined or physical component, set angular allowance to twice the largest
absolute theta32-minus-theta16 change, radial64-minus-radial32 change, or
finest-frame disagreement. Include the propagated incident and arithmetic
allowances in those differences and in the finest mean.

Admit each required combined reference only when its total allowance is at
most 10% of the matched mu16 error lower bound. A finer result is not an oracle
by declaration. Components with inadequate reference precision remain
unqualified even if the combined result passes. Report every signed component
response and its uncertainty; a total gain must not conceal a component loss.
These are empirical numerical allowances for this declared physical problem.

A pass would quantify the identified coordinate error in actual incident
radiance at this point. It would not qualify another height or solar condition,
the complete viewing integral, later recurrence, GPU arithmetic or Kider
agreement. If the coordinate correction leaves a material discrepancy, use
the separate physical components to choose the next attribution test.

## Resource And Evidence Boundary

Cap this three-record package at 8 MiB retained and twenty CPU-job minutes,
including failures and final assessment, inside the existing campaign limits.
Reserve 2 MiB and five minutes for assessment before each numerical stage.
Pilot and assessment each allow at most 2 MiB; fine allows at most 3 MiB.
Use the pilot's compressed-node rate doubled for the fine byte forecast, and
twice its summed incident milliseconds per solve divided across four workers,
plus ninety seconds for startup/finalization, for the time forecast. Preserve
hard job/deadline and byte guards, including a thirty-second finalization
reserve. Stop expansion on incomplete physical admission or a forecast failure.

Use the existing four-worker incident solver and retain compact ordered batches
before evaluating subsequent batches. Reuse the authenticated `00210` source
snapshot with complete deltas. Source/control and output real-path guards,
the 40 GiB disk floor, immutable prior runs and full derivation chains remain
required. No GPU job, full cache, scratch deletion or production change occurs.

Implementation is confined to `continuation/angular-theta/`, using unchanged
physical and mathematical helpers. Its deferred source-review baseline is
`871690d334b4339f7aaee516dcc140dd00a3edaf`. Local proofs and type checking precede
execution; formal source review remains deferred under the owner's direction.
