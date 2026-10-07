# Direct Idealized Solver: First Results

## Outcome

New direct code implements the [idealized equations](idealized-model.md) using
nested numerical integrals, without physical-field caches, interpolation,
memoization or inherited higher-order radiance. It evaluates the original
physical inputs and fitted geometry on the [five selected rays](diagnostic-rays.md).

All five rays and four wavelengths completed four configurations through two
interactions: 20 complete ray/profile records and 80 cumulative spectral values.
The requested extra-interaction configuration did not complete: its first
third-interaction browser call timed out after 90 seconds without output.
The complete run is therefore sealed **failed**, with successful earlier
calculations preserved. No third-order result or all-order convergence is claimed.

## Implementation And Controls

- [Direct binary64 solver and mathematical proofs](../../../../../experiments/sky-accuracy-dials/continuation/direct-solver/math.mjs).
- [Direct GPU equations and execution](../../../../../experiments/sky-accuracy-dials/continuation/direct-solver/shader.mjs).
- [Five-ray execution and original-input boundary](../../../../../experiments/sky-accuracy-dials/continuation/direct-solver/run.mjs).
- [Usage and numerical controls](../../../../../experiments/sky-accuracy-dials/continuation/direct-solver/README.md).

Every sunlight transmission, view-segment transmission, local density, phase
and incident radiance is evaluated from its physical query. Ground reflection
includes direct sunlight and recursively integrated diffuse illumination.
Stored Gauss-Legendre nodes and weights describe quadrature, not physical
fields. GPU output buffers hold independent integration contributions for
summation. The GPU evaluates four wavelengths independently in vector lanes.

The CPU uses ordinary recursion. GLSL expands the same recursive structure to
the chosen finite depth; it does not substitute a cached radiance field.
Ground reflection counts as one interaction. The selected outer rays all exit
through the top boundary; the CPU also implements outer ground-ending rays.
The current GPU outer dispatcher is restricted to the selected sky-ray scope.

| Profile      | Outer path | Nested paths | Optical depth | Angular mu x phi | Interactions | Outcome                                      |
| ------------ | ---------: | -----------: | ------------: | ---------------- | -----------: | -------------------------------------------- |
| coarse       |         16 |            8 |            16 | 4 x 8            |            2 | All five rays                                |
| path         |         32 |           16 |            16 | 4 x 8            |            2 | All five rays                                |
| transmission |         32 |           16 |            32 | 4 x 8            |            2 | All five rays                                |
| angular      |         32 |           16 |            32 | 8 x 16           |            2 | All five rays                                |
| third        |         16 |            8 |            16 | 4 x 8            |            3 | Ray A orders 1/2 retained; order 3 timed out |

These are finite numerical approximations. The final angular setting is not
declared converged, and a two-interaction total is not the full idealized solution.

## Kider Comparison

The angular profile produces the following spectral radiances at 454 nm,
in mW m^-2 sr^-1 nm^-1. Residual is model minus measurement.

| Ray               |  Kider | Direct two-interaction total | Residual | Relative residual |
| ----------------- | -----: | ---------------------------: | -------: | ----------------: |
| A, morning excess | 185.53 |                       207.33 |   +21.80 |           +11.75% |
| B, noon near Sun  | 400.73 |                       206.42 |  -194.31 |           -48.49% |
| C, noon neighbor  | 139.00 |                       151.30 |   +12.30 |            +8.85% |
| D, low elevation  | 144.04 |                       104.01 |   -40.03 |           -27.79% |
| E, zenith         |  99.54 |                        92.37 |    -7.17 |            -7.20% |

The same-time B/C angular contrast remains pronounced without the old cache
representation. This does not exclude an omitted-order contribution to B's
deficit. A's positive residual, together with the independently established
P1+P2 excess, remains a constraint on explanations based on later positive light.

Do not directly attribute the change from the earlier diagnostic totals to
cache removal: those totals include H orders through four, while these new
totals stop at two interactions. For example D is now below Kider at 360 nm
as well as the other channels; its former spectral sign pattern is not preserved
at this lower order cutoff. Matched-order comparisons are required.

## Which Controls Moved The Answer

Across the 20 spectral components:

- Doubling outer and nested path counts changes totals by at most **0.295 mW**;
  at 454 nm the largest change is **0.117 mW**.
- Doubling optical-depth quadrature changes totals by at most **0.000954 mW**.
  These tiny responses are not assigned a resolved sign or treated as a
  certified quadrature error bound at GPU precision.
- Refining angular quadrature changes totals by as much as **2.155 mW**.
  It raises the second-order contribution on A/B/C and lowers it on D at 454 nm.
  The response is directional, not a uniform brightness correction.
- The extra-order response remains **unmeasured**.

The retained independent second-order references provide a useful comparison
that was not used to tune coefficients or compute the new radiances:

| Ray / wavelength | Independent P2 | Coarse direct P2 error | Angular-profile direct P2 error |
| ---------------- | -------------: | ---------------------: | ------------------------------: |
| A / 360 nm       |       21.23247 |               -1.38739 |                        +0.01968 |
| A / 454 nm       |       19.82358 |               -2.18923 |                        +0.07231 |
| B / 360 nm       |       14.79188 |               -1.07407 |                        -0.21643 |
| B / 454 nm       |       10.74572 |               -1.23322 |                        -0.37433 |

All four reference errors decrease across these configurations; nonzero
remaining errors, especially on B, prevent calling the direct solver exact.
The references are reconstructed from 00225's H `higherOrders[0] - secondError`,
with their original limited-ray scope and empirical allowances preserved.

## Verification, Cost And Failure Boundary

The full experiment type check and 46 manufactured checks pass. Checks cover
quadrature moments, constant-extinction attenuation, phase normalization,
vacuum, direct Lambertian reflection and source linearity. The tiny
non-radiance hardware transfer passes on NVIDIA GeForce RTX 2060 / ANGLE D3D11.

There are 88 passing CPU/GPU scalar comparisons: 84 first-order comparisons
(including the partial fifth profile's ray A) and four direct second-order
comparisons on coarse ray A. The largest observed relative difference is
0.0196%, below the registered max(1e-6 W, 0.5% of CPU value) allowance.
This tests matching quadrature implementations; it does not bound integration
error or qualify GPU precision at arbitrary depths and parameter settings.

Summed browser-call times for the completed profiles are 25.10, 62.03, 247.47
and 252.73 seconds respectively. They include shader compilation, GPU execution
and readback; they are not isolated shader performance timings. The timeout
does not establish whether compilation or execution caused the delay. In
particular, raising the timeout alone is not a justified accuracy improvement.

The run charged 745,576 ms (12.43 minutes), including the final timeout and
cleanup. The last in-flight call exceeded the nominal 12-minute job envelope
by 25.576 seconds; finalization finished at 19:33:32 UTC, within the owner's
19:39 UTC session ceiling. A future runner should bound each call by the
remaining time, rather than only checking the time before dispatch.

No retry was started. All owned browser scratch is absent. Formal source
review remains deferred under the owner's reviewer suspension; the checkpoint
adviser remains blocked by stale calibration. No source or production
qualification is inferred from local checks.

## Immutable Evidence

Run [00229-direct-ideal](../../../../../tmp/experiments/sky-accuracy-dials/runs/00229-direct-ideal/sealed.json)
has seal SHA-256
`f7d3e898966e443fad7834d587c127f94aaf88e1bdb093bd95fddb32278905a2`.
It retains 328,885 bytes. Source and heartbeat failure lists are empty, and
structural seal verification and campaign accounting pass despite the recorded
scientific execution failure.

[results.json](../../../../../tmp/experiments/sky-accuracy-dials/runs/00229-direct-ideal/results.json)
contains all 20 complete ray/profile records and their pure increments;
individual order files preserve the additional completed values from the
unfinished profile. [inputs.json](../../../../../tmp/experiments/sky-accuracy-dials/runs/00229-direct-ideal/inputs.json)
owns the exact original coefficients, rays, measurements and comparison totals.
Each GPU result records its generated shader hash and hardware identity.
Reconstruct source from immutable 00226 source bytes plus the 00229 delta.
The consumed [plan](direct-solver-plan.md) remains unchanged.

This report derives totals and residuals from those stored rows, multiplies
spectral W values by 1000, divides residual by measurement for percentages,
and differences matching probe/channel totals for profile responses. Historical
comparison/reference inputs remain those identified in diagnostic-rays.md and
remaining-factors-results.md. No additional atmospheric calculation was used
to write this report. [Status](status.md) owns current resource totals.
