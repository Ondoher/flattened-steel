# Direct Idealized Solver: Fixed First Execution

The owner explicitly requests new direct code implementing the idealized
algorithm with tunable granularity and execution on the five selected rays,
without caches or other shortcuts. This authorizes one new GPU job for this
package, after the 38 previously charged attempts. Earlier packages remain
closed. All existing retained evidence remains immutable.

Implement direct nested quadrature of the documented attenuation, scattering,
transport and Lambertian ground equations. Recompute every physical field
at its query; no cached source, optical depth, incident radiance, interpolation,
memoization, or inherited higher-order contribution may enter the calculation.
Gauss-Legendre nodes and weights are mathematical quadrature constants, not
physical-field data. GPU output buffers hold independent integration terms
only for summation. Recursion is expanded to the selected finite interaction
depth because GLSL disallows recursive calls. This does not replace any
integral with an approximation beyond the declared quadrature and depth.

Retain the original physical coefficients, ground albedos, source spectrum,
fitted solar geometry and native rays A-E from diagnostic-rays.md. Evaluate
channels 0/8/24/30 together as independent spectral components. Compare all
new totals directly with Kider; the old corrected-P1/frozen-higher values
are comparison evidence only.

Controls are outer viewing Gauss count, nested path Gauss count, optical-depth
Gauss count, full-sphere cosine Gauss count, midpoint azimuth count, and maximum
interaction depth. Ground reflection counts as one interaction. Report pure
increments and cumulative totals without assuming they match historical
order bookkeeping in every boundary case.

Fixed configurations (view/path/transmission/mu/phi/orders):

- coarse: 16/8/16/4/8/2.
- path: 32/16/16/4/8/2.
- transmission: 32/16/32/4/8/2.
- angular: 32/16/32/8/16/2.
- third: 16/8/16/4/8/3.

These successive changes expose path, optical-depth and angular responses;
third versus coarse exposes the extra interaction at matched quadrature.
Counts are adjustable in source and through runner profile input for a later
explicit execution. No adaptive sweep or automatic retry follows this matrix.
Finite-count agreement is evidence of sensitivity, not certified convergence.

Before numerical GPU work, require manufactured quadrature moments, constant
extinction attenuation, phase normalization, vacuum, direct Lambertian ground,
and source-linearity checks. Require a tiny non-radiance hardware transfer.
Compare first-order GPU results with direct binary64 evaluation at identical
quadrature on all selected rays: allowance max(1e-6 W, 0.5% of CPU radiance).
Reject execution evidence if parity fails. This allowance is a hardware
implementation check, not the allowed error against Kider. No CPU atmospheric
cache construction is included.
Also compare all four second-order components on ray A at the coarse profile
against the direct binary64 recursion with the same hardware allowance.

Write source under experiments/sky-accuracy-dials/continuation/direct-solver/.
Run/output boundaries remain the existing experiment's. Reserve 768 KiB from
C5's remaining 890,610 bytes, preserve the existing 512 MiB global cap, and
stop scientific execution by 19:39 UTC on 2026-09-15. One GPU attempt includes
all profiles and a maximum 12-minute job duration, whichever limit is earlier.
Stop cleanly with partial results if the time limit prevents the remaining
profiles; do not claim unexecuted cases complete. Allow bounded finalization.

Snapshot actual source bytes via immutable 00226 base plus exact source delta,
original inputs, this plan and tool identities. Preserve all completed output
rows even on failure. Formal reviewers remain suspended; adviser calibration
remains blocked. Local proofs and type check do not close formal source review.
Initial HEAD: c7803b241f0f8f409226354dc4fb72484f25a5ec, with prior dirty work
preserved. This reference solver is offline; its nested loops do not change
the production loop-free-per-sample requirement.
