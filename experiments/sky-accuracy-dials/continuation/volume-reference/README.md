# Positive-altitude incident first-order reference

`index.mjs` exports `evaluateVolumeFirstOrder(spec, origin, direction, channels,
options)` and `evaluateVolumePilot(spec, witnesses, channels, options)`. These
pure in-memory evaluators write no evidence or scratch. The orchestrating runner
owns authenticated inputs, run allocation/sealing and job-level budgets. Supply
`options.guard` for cooperative deadlines, resource guards and heartbeat updates.
The optional work caps may only reduce the existing named physical-reference
policy. Geometry is derived from origin/direction, never a caller-supplied length.

The result separates atmospheric first scattering and attenuated direct
Lambertian ground reflection. A positive-altitude ray stops at its first ground
contact or atmosphere exit. Outward surface, outward volume, inward ground and
inward escaping branches are supported. Exact-ground inward rays are rejected:
the caller's existing zero-inward boundary convention remains a distinct case.
The +Z collimated solar delta beam is excluded from diffuse incident L1.

Independent outer formulations use distance Gauss 8/16 and branchwise
square-root-altitude Simpson, with explicit closest-approach, terminator and
shadow-cylinder breaks. They reuse the established independently integrated
exponential columns and matched physical phase/medium equations. Each has two
tolerance passes under the existing admission policy. Reported allowances are
empirical component estimates, not rigorous bounds. The total is admitted only
when both physical components and their sum pass; its allowance covers the sum
of the separated component allowances.

`options.outerStrategy` selects `local` (the unchanged default) or `global`.
Global allocation refines the largest error contributor in a complete outer
partition until every summed error estimate meets the same absolute-plus-relative
tolerance. Inner columns and physical admission are unchanged. The separate
`run.mjs pilot-global <original-C0-run> <attribution-plan-path>` command repeats
the eight witnesses and authenticates `00153-volume-l1-pilot` for component
agreement and admission-recovery comparisons. It keeps earlier nonresolution
intact and records the new strategy explicitly.

`volumeReferenceProof()` in `proof.mjs` is an in-memory self-verifying proof of
geometry, shadow splits, analytic homogeneous atmosphere/ground radiance,
surface-reference parity, finite uncertainty, work caps and guard propagation.
It is implementation verification, not a new atmospheric experiment. The pilot
accepts one to sixteen caller-selected rays and returns actual method work and
wall time for admission of later references. It does not itself estimate the
cost of the incoming-angular and final-view integrations required for J2.

This implementation is a prerequisite for a complete second-order ray reference.
It does not yet supply J2 angular integration, higher-order recursion, diffuse
ground reflection, a scattering-tail estimate or any Kider accuracy claim.

`run.mjs proof` runs the manufactured checks without output files. The command
`run.mjs pilot <original-C0-run> <attribution-plan-path>` authenticates the pinned
`00109-c1-physical-j1` parent and the original tool identity, then writes a new
immutable `volume-l1-pilot` run. Its definition freezes eight witnesses, two
channels and the surface-parity, zero-ground and ground-limit predictions before
evaluation. It retains the exact plan/source snapshot, separated results and
admission failures, prediction failures and actual resource accounting.

This stage uses the original continuation ledger's C5 CPU/component allocation
with a 4 MiB forecast, 768 KiB terminal reserve, one-hour maximum and a live deadline
narrowed by remaining campaign allowance. C5 is a new-work accounting debit;
the earlier skipped qualification decision remains immutable. No scratch or GPU
work is allocated. The runner checks four times the slowest measured witness
against remaining time before proceeding. A returned unresolved ray is retained
and independent remaining geometry witnesses may proceed within their caps.
